import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve('edge/index.js'), 'utf8')
const origin = 'https://cpe.plus'

function createEdge(config = {}) {
  const serialized = JSON.stringify(config)
  return new Function('EdgeKV', source.replace('export default', 'return'))(
    class {
      async get(key) {
        return key === 'config' ? serialized : undefined
      }
      async put() {
        throw new Error('This request must not modify storage')
      }
    }
  )
}

describe('public API boundaries', () => {
  it('keeps client-required health, release and version-check reads public', async () => {
    const edge = createEdge()
    for (const path of [
      '/api/health',
      '/api/updates/latest',
      '/api/updates/check?platform=android&version=0.0.0&channel=stable',
    ]) {
      const response = await edge.fetch(new Request(origin + path))
      expect(response.status, path).toBe(200)
    }
    const health = await (await edge.fetch(new Request(origin + '/api/health'))).json()
    expect(health).not.toHaveProperty('namespace')
  })

  it('requires a read token for detailed analytics', async () => {
    const edge = createEdge({ CPE_ANALYTICS_TOKEN: 'read-secret' })
    const denied = await edge.fetch(new Request(origin + '/api/analytics/summary'))
    expect(denied.status).toBe(403)
    const allowed = await edge.fetch(
      new Request(origin + '/api/analytics/summary', {
        headers: { Authorization: 'Bearer read-secret' },
      })
    )
    expect(allowed.status).toBe(200)
  })

  it('fails closed when an administrative write token is missing or incorrect', async () => {
    const noToken = createEdge()
    const missingConfig = await noToken.fetch(
      new Request(origin + '/api/updates/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'android', version: '9.9.9' }),
      })
    )
    expect(missingConfig.status).toBe(403)

    const protectedEdge = createEdge({ CPE_STATS_TOKEN: 'write-secret' })
    const wrongToken = await protectedEdge.fetch(
      new Request(origin + '/api/updates/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer wrong' },
        body: JSON.stringify({ platform: 'android', version: '9.9.9' }),
      })
    )
    expect(wrongToken.status).toBe(403)
  })

  it('does not reuse the general stats-write token for status-ingest authentication', async () => {
    const edge = createEdge({ CPE_STATS_TOKEN: 'write-secret' })
    const response = await edge.fetch(
      new Request(origin + '/api/status/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer write-secret' },
        body: JSON.stringify({}),
      })
    )
    expect(response.status).toBe(403)
  })
})

describe('anonymous stats write origin checks', () => {
  function createRecordingEdge() {
    const writes = []
    const store = new Map()
    const edge = new Function('EdgeKV', source.replace('export default', 'return'))(
      class {
        async get(key) {
          return store.get(key)
        }
        async put(key, value) {
          writes.push(key)
          store.set(key, value)
        }
      }
    )
    return { edge, writes }
  }

  function trackRequest(headers) {
    return new Request(origin + '/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ page: '/' }),
    })
  }

  it('rejects stats writes that only claim to be same-origin via Sec-Fetch-Site', async () => {
    const forgeries = [
      { 'Sec-Fetch-Site': 'same-origin' },
      { 'Sec-Fetch-Site': 'same-site' },
      { 'Sec-Fetch-Site': 'same-origin', Origin: 'https://attacker.example' },
      { 'Sec-Fetch-Site': 'same-site', Referer: 'https://attacker.example/page' },
    ]
    for (const headers of forgeries) {
      const { edge } = createRecordingEdge()
      const label = JSON.stringify(headers)
      expect((await edge.fetch(trackRequest(headers))).status, `track ${label}`).toBe(403)
      expect(
        (await edge.fetch(new Request(origin + '/api/counter', { headers }))).status,
        `counter ${label}`
      ).toBe(403)
    }
  })

  it('rejects cross-site browser requests even with a matching Origin', async () => {
    const { edge } = createRecordingEdge()
    const response = await edge.fetch(
      trackRequest({ 'Sec-Fetch-Site': 'cross-site', Origin: origin })
    )
    expect(response.status).toBe(403)
  })

  it('still counts genuine same-origin browser requests', async () => {
    for (const headers of [
      { 'Sec-Fetch-Site': 'same-origin', Origin: origin },
      { 'Sec-Fetch-Site': 'same-origin', Referer: origin + '/#/download' },
      { Origin: origin },
    ]) {
      const { edge } = createRecordingEdge()
      const label = JSON.stringify(headers)
      expect((await edge.fetch(trackRequest(headers))).status, `track ${label}`).toBe(200)
      expect(
        (await edge.fetch(new Request(origin + '/api/counter', { headers }))).status,
        `counter ${label}`
      ).toBe(200)
    }
  })
})
