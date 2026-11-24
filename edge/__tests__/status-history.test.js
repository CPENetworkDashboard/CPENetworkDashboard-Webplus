import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const source = readFileSync(resolve('edge/index.js'), 'utf8')
const ids = ['website', 'health', 'releases', 'android', 'windows', 'macos']
let store, edge, rejectPut
function report(at, failed = false) {
  return {
    at,
    services: ids.map((id) => ({
      id,
      state: failed && id === 'android' ? 'unavailable' : 'operational',
      latencyMs: 100,
      httpStatus: failed && id === 'android' ? 503 : 200,
      version: ['android', 'windows', 'macos'].includes(id) ? '3.7.1' : undefined,
    })),
  }
}
function loadEdge() {
  return new Function('EdgeKV', source.replace('export default', 'return'))(
    class {
      async get(key) {
        return store.get(key)
      }
      async put(key, value) {
        if (!/^[a-zA-Z0-9_-]+$/.test(key)) throw new Error('Unsupported KV key')
        if (key === rejectPut) {
          rejectPut = null
          throw new Error('Injected storage failure')
        }
        store.set(key, value)
      }
    }
  )
}
async function ingest(data, token = 'monitor-test-token') {
  return edge.fetch(
    new Request('https://cpe.plus/api/status/ingest', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  )
}
async function ingestBatch(reports, token = 'monitor-test-token') {
  return edge.fetch(
    new Request('https://cpe.plus/api/status/ingest', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reports }),
    })
  )
}
async function summary(days = 30, query = '') {
  const response = await edge.fetch(
    new Request('https://cpe.plus/api/status/summary?days=' + days + query)
  )
  expect(response.status).toBe(200)
  return response.json()
}

describe('durable status history', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-19T10:12:00Z'))
    delete globalThis.__CPE_PLUS_PLUS_EDGE_RUNTIME__
    store = new Map([['config', JSON.stringify({ CPE_STATUS_TOKEN: 'monitor-test-token' })]])
    rejectPut = null
    edge = loadEdge()
  })
  afterEach(() => {
    vi.useRealTimers()
    delete globalThis.__CPE_PLUS_PLUS_EDGE_RUNTIME__
  })
  it('rejects unauthenticated writes and invalid reports', async () => {
    expect((await ingest(report('2026-11-19T10:00:00Z'), 'wrong')).status).toBe(403)
    expect((await ingest({ at: '2026-11-19T10:00:00Z', services: [] })).status).toBe(400)
    expect([...store.keys()].filter((key) => key.startsWith('status_'))).toHaveLength(0)
  })
  it('serves an explicit empty history before the first scheduled report', async () => {
    const result = await summary()
    expect(result).toMatchObject({
      source: 'scheduled-monitor',
      latest: null,
      totals: { samples: 0, availability: null },
    })
    expect(result.daily).toHaveLength(30)
  })
  it('persists across a fresh runtime and deduplicates retried slots', async () => {
    const observation = report('2026-11-19T10:00:00Z')
    expect((await ingest(observation)).status).toBe(200)
    expect([...store.keys()].filter((key) => key.startsWith('status_v1_'))).toEqual([
      'status_v1_store',
    ])
    expect((await (await ingest(observation)).json()).duplicate).toBe(true)
    delete globalThis.__CPE_PLUS_PLUS_EDGE_RUNTIME__
    edge = loadEdge()
    const result = await summary()
    expect(result.source).toBe('scheduled-monitor')
    expect(result.history).toHaveLength(1)
    expect(result.totals.samples).toBe(1)
    expect(result.latest.at).toBe(new Date(observation.at).toISOString())
    expect(result.latest.services.find((service) => service.id === 'android').version).toBe('3.7.1')
  })
  it('bypasses the 15-second local summary cache for explicit history verification', async () => {
    await ingest(report('2026-11-19T10:00:00Z'))
    const runtime = globalThis.__CPE_PLUS_PLUS_EDGE_RUNTIME__
    runtime.statusCache = { days: 30, at: Date.now(), data: { ok: true, cached: true } }

    expect(await summary()).toEqual({ ok: true, cached: true })
    const verified = await summary(30, '&verify=1')
    expect(verified.history).toHaveLength(1)
    expect(verified.totals.samples).toBe(1)
    expect(runtime.statusCache.data).toEqual({ ok: true, cached: true })
  })
  it('stores a backfill batch in one write without overwriting earlier reports', async () => {
    const observations = [report('2026-11-19T10:00:00Z'), report('2026-11-19T10:05:00Z', true)]
    expect((await ingestBatch(observations)).status).toBe(200)
    expect([...store.keys()].filter((key) => key.startsWith('status_v1_'))).toEqual([
      'status_v1_store',
    ])
    const result = await summary()
    expect(result.history).toHaveLength(2)
    expect(result.totals.samples).toBe(2)
    expect(result.services.android.availability).toBe(50)
    expect((await (await ingestBatch(observations)).json()).duplicates).toBe(2)
    expect((await summary()).totals.samples).toBe(2)
  })
  it('retains failures, excludes missing periods from availability and reports coverage', async () => {
    await ingest(report('2026-11-19T10:00:00Z'))
    await ingest(report('2026-11-19T10:10:00Z', true))
    const result = await summary(90)
    expect(result.daily).toHaveLength(90)
    expect(result.services.android.availability).toBe(50)
    expect(result.totals.availability).toBe(50)
    expect(result.daily.at(-1).expected).toBe(3)
    expect(result.daily.at(-1).samples).toBe(2)
    expect(result.totals.coverage).toBe(66.67)
    expect(result.daily[0].coverage).toBeNull()
  })
  it('uses Shanghai calendar dates across UTC midnight boundaries', async () => {
    await ingest(report('2026-11-18T18:00:00Z'))
    const result = await summary()
    expect(result.daily.at(-1).samples).toBe(1)
    expect(JSON.parse(store.get('status_v1_store')).days['2026-11-19'].samples).toBe(1)
    expect(result.stale).toBe(true)
  })
  it('retains a report after a failed atomic write and accepts the retry', async () => {
    rejectPut = 'status_v1_store'
    const observation = report('2026-11-19T10:00:00Z')
    expect((await ingest(observation)).status).toBe(503)
    expect((await ingest(observation)).status).toBe(200)
    expect((await summary()).totals.samples).toBe(1)
  })
  it('does not treat a storage outage as empty healthy history', async () => {
    edge = new Function('EdgeKV', source.replace('export default', 'return'))(
      class {
        async get() {
          throw new Error('KV offline')
        }
      }
    )
    const response = await edge.fetch(new Request('https://cpe.plus/api/status/summary'))
    expect(response.status).toBe(503)
  })
  it('accepts legacy slow observations as available without publishing latency data', async () => {
    const observation = report('2026-11-19T10:00:00Z')
    observation.services.forEach((item) => {
      item.state = 'slow'
      item.latencyMs = 12_000
    })
    expect((await ingest(observation)).status).toBe(200)
    const result = await summary()
    expect(result.latest.services.every((item) => item.state === 'operational')).toBe(true)
    expect(result.totals.availability).toBe(100)
    expect(JSON.stringify(result)).not.toMatch(
      /latencyMs|meanLatency|latencyTotal|maxLatency|"slow"/
    )
  })
  it('accepts availability-only observations without a latency field', async () => {
    const observation = report('2026-11-19T10:00:00Z')
    observation.services.forEach((item) => delete item.latencyMs)
    expect((await ingest(observation)).status).toBe(200)
    expect((await summary()).totals.samples).toBe(1)
  })
  it('exposes collector freshness and validated workflow provenance independently of service availability', async () => {
    const observation = report('2026-11-19T10:00:00Z')
    observation.monitor = {
      source: 'github-actions',
      event: 'schedule',
      runUrl: 'https://github.com/CPENetworkDashboard/CPENetworkDashboard-Web/actions/runs/123',
    }
    await ingest(observation)
    const result = await summary()
    expect(result.monitor).toMatchObject({
      source: 'github-actions',
      event: 'schedule',
      ageSeconds: 720,
      missedSlots: 1,
      runUrl: observation.monitor.runUrl,
      samples24h: 1,
    })
    expect(result.latest.monitor).toMatchObject({ source: 'github-actions', event: 'schedule' })
    expect(result.totals.availability).toBe(100)
    vi.advanceTimersByTime(4 * 60_000)
    expect((await summary()).stale).toBe(true)
  })
  it('does not publish untrusted collector URLs', async () => {
    const observation = report('2026-11-19T10:00:00Z')
    observation.monitor = {
      source: 'github-actions',
      event: 'schedule',
      runUrl: 'https://untrusted.example/collect',
    }
    await ingest(observation)
    expect((await summary()).monitor.runUrl).toBeNull()
  })
})
