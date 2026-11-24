// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  flushStatusQueue,
  persistQueue,
  uploadStatusReports,
  verifyStatusHistory,
} from '../../scripts/collect-status.mjs'
const temporary = []
const noWait = async () => {}
const origin = 'https://cpe.plus'
const observation = () => ({
  at: new Date().toISOString(),
  services: [{ id: 'website', state: 'operational', httpStatus: 200 }],
})
const reply = (body, status = 200) => new Response(JSON.stringify(body), { status })
afterEach(async () => {
  await Promise.all(temporary.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})
async function queue(reports) {
  const dir = await mkdtemp(join(tmpdir(), 'cpe-status-test-'))
  temporary.push(dir)
  const path = join(dir, 'pending.json')
  await persistQueue(path, reports)
  return path
}

describe('collector delivery guarantees', () => {
  it('retries transient server failures with the same observation and accepts duplicate acknowledgements', async () => {
    const report = observation()
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(reply({}, 503))
      .mockResolvedValueOnce(reply({ ok: true, stored: 0, duplicates: 1 }))
    await expect(
      uploadStatusReports(origin, 'test-secret', [report], { fetcher, sleep: noWait })
    ).resolves.toMatchObject({ duplicates: 1 })
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(fetcher.mock.calls[0][1].body).toBe(fetcher.mock.calls[1][1].body)
    expect(fetcher.mock.calls[0][1].redirect).toBe('error')
  })
  it('does not retry invalid authentication and keeps the entire queue', async () => {
    const path = await queue([observation()])
    const fetcher = vi.fn().mockImplementation(() => reply({}, 403))
    await expect(
      flushStatusQueue(origin, 'wrong', path, { fetcher, sleep: noWait })
    ).rejects.toThrow('403')
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(JSON.parse(await readFile(path, 'utf8'))).toHaveLength(1)
  })
  it('retains the unacknowledged remainder after a partial batch delivery', async () => {
    const path = await queue(Array.from({ length: 101 }, observation))
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(reply({ ok: true, stored: 100, duplicates: 0 }))
      .mockResolvedValueOnce(reply({}, 400))
    await expect(
      flushStatusQueue(origin, 'test', path, { fetcher, sleep: noWait })
    ).rejects.toThrow('400')
    expect(JSON.parse(await readFile(path, 'utf8'))).toHaveLength(1)
  })
  it('does not erase reports after an incomplete acknowledgement', async () => {
    const path = await queue([observation(), observation()])
    const fetcher = vi.fn().mockImplementation(() => reply({ ok: true, stored: 1, duplicates: 0 }))
    await expect(
      flushStatusQueue(origin, 'test', path, { fetcher, sleep: noWait })
    ).rejects.toThrow('acknowledge every report')
    expect(JSON.parse(await readFile(path, 'utf8'))).toHaveLength(2)
  })
  it('archives expired observations and clears them from the queue without blocking fresh reports', async () => {
    const old = { ...observation(), at: new Date(Date.now() - 8 * 86400_000).toISOString() }
    const path = await queue([old, observation()])
    const fetcher = vi.fn().mockImplementation(() => reply({ ok: true, stored: 1, duplicates: 0 }))
    expect(await flushStatusQueue(origin, 'test', path, { fetcher, sleep: noWait })).toMatchObject({
      stored: 1,
      expired: 1,
    })
    expect(JSON.parse(await readFile(path, 'utf8'))).toEqual([])
    expect(JSON.parse(await readFile(join(path, '..', 'expired-recovery.json'), 'utf8'))).toEqual([old])
    await expect(
      flushStatusQueue(origin, 'test', path, { fetcher, sleep: noWait })
    ).resolves.toMatchObject({ stored: 0, expired: 0 })
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
  it('confirms the observation when KV propagation completes and bypasses edge summary caching', async () => {
    const sample = observation()
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        reply({ ok: true, source: 'scheduled-monitor', history: [], lastCheckedAt: null })
      )
      .mockResolvedValueOnce(
        reply({
          ok: true,
          source: 'scheduled-monitor',
          history: [sample],
          lastCheckedAt: sample.at,
          totals: { samples: 7 },
          stale: false,
        })
      )
    expect(await verifyStatusHistory(origin, sample, { fetcher, sleep: noWait })).toMatchObject({
      visible: true,
      verificationAttempts: 2,
      samples: 7,
      stale: false,
    })
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(String(fetcher.mock.calls[0][0])).toContain('verify=1')
  })
  it('reports pending visibility after successful writes instead of failing on KV propagation delay', async () => {
    const fetcher = vi
      .fn()
      .mockImplementation(() =>
        reply({ ok: true, source: 'scheduled-monitor', history: [], lastCheckedAt: null })
      )
    await expect(
      verifyStatusHistory(origin, observation(), { fetcher, sleep: noWait })
    ).resolves.toMatchObject({ visible: false, visibilityPending: true, verificationAttempts: 5 })
    expect(fetcher).toHaveBeenCalledTimes(5)
  })
})
