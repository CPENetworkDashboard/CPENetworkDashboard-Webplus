import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { downloads } from '../src/content.ts'

const origin = new URL(process.env.CPE_STATUS_ORIGIN || 'https://cpe.plus')
const output = []
async function get(path, init = {}) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(new URL(path, origin), {
        signal: AbortSignal.timeout(90_000),
        ...init,
        headers: { 'Cache-Control': 'no-cache', ...init.headers },
      })
      if (
        attempt < 3 &&
        (response.status === 408 || response.status === 429 || response.status >= 500)
      ) {
        await response.body?.cancel()
        await new Promise((done) => setTimeout(done, attempt * 1000))
        continue
      }
      return response
    } catch (error) {
      if (attempt === 3) throw error
      await new Promise((done) => setTimeout(done, attempt * 1000))
    }
  }
}
async function json(path, init) {
  const response = await get(path, init)
  assert.equal(response.status, 200, path)
  return response.json()
}

const home = await get('/')
assert.equal(home.status, 200)
const html = await home.text()
assert.match(html, /id="app"/)
for (const [, path] of html.matchAll(/(?:src|href)="(\/assets\/[^"\s]+)"/g)) {
  const response = await get(path)
  assert.equal(response.status, 200, path)
  await response.body?.cancel()
}
const health = await json('/api/health')
assert.equal(health.ok, true)
assert.equal(health.service, 'cpe-plus-plus-web')
if (process.env.CPE_EXPECTED_BUILD) assert.equal(health.build, process.env.CPE_EXPECTED_BUILD)
output.push({ check: 'website and edge', ok: true, build: health.build })

for (const path of ['/api/public-stats', '/api/downloads', '/api/counter?skip=1'])
  assert.equal(typeof (await json(path)), 'object')
const releases = await json('/api/updates/latest')
for (const platform of ['android', 'windows', 'macos']) {
  const release = releases.releases[platform].stable
  for (const version of ['0.0.0', release.version]) {
    const result = await json('/api/updates/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform, version, channel: 'stable' }),
    })
    assert.equal(result.ok, true)
    assert.equal(result.platform, platform)
    assert.equal(result.latest.version, release.version)
    assert.equal(result.updateAvailable, version !== release.version)
  }
}
output.push({ check: 'public statistics and three platform update contracts', ok: true })
for (const path of ['/api/analytics/summary', '/api/analytics/debug', '/api/analytics/baseline'])
  assert.equal((await get(path)).status, 403, path)
output.push({ check: 'protected analytics reject anonymous reads', ok: true })

for (const days of [30, 90]) {
  const summary = await json('/api/status/summary?days=' + days)
  assert.equal(summary.ok, true)
  assert.equal(summary.source, 'scheduled-monitor')
  assert.equal(summary.daily.length, days)
  assert.equal(summary.windowDays, days)
  assert.doesNotMatch(JSON.stringify(summary), /latencyMs|meanLatency|latencyTotal|maxLatency/)
  assert.ok(summary.totals.samples > 0, 'No persisted observations')
  if (process.argv.includes('--require-fresh'))
    assert.equal(
      summary.stale,
      false,
      'Collector is not updating; latest observation: ' + summary.lastCheckedAt
    )
  output.push({
    check: days + '-day persistent availability',
    ok: true,
    samples: summary.totals.samples,
    last: summary.lastCheckedAt,
    stale: summary.stale,
    coverage: summary.totals.coverage,
  })
}

if (!process.argv.includes('--skip-downloads')) {
  await Promise.all(
    downloads.map(async (download) => {
      const hash = createHash('sha256')
      const paths = download.chunks || [download.href]
      let total = 0
      for (const [index, path] of paths.entries()) {
        let data
        for (let attempt = 1; attempt <= 3; attempt += 1) {
          try {
            const response = await get(path, { redirect: 'error' })
            assert.equal(response.status, 200, download.id + ' part ' + index)
            assert.ok(!response.headers.get('content-type')?.includes('text/html'))
            data = Buffer.from(await response.arrayBuffer())
            if (download.chunkBytes) assert.equal(data.length, download.chunkBytes[index], path)
            break
          } catch (error) {
            if (attempt === 3) throw error
            await new Promise((done) => setTimeout(done, attempt * 1000))
          }
        }
        hash.update(data)
        total += data.length
      }
      assert.equal(hash.digest('hex'), download.checksum, download.id + ' SHA-256')
      output.push({
        check: download.id + ' download and SHA-256',
        ok: true,
        bytes: total,
        parts: paths.length,
      })
      console.log('Verified package: ' + download.id)
    })
  )
}
console.log(
  JSON.stringify(
    { origin: origin.origin, verifiedAt: new Date().toISOString(), results: output },
    null,
    2
  )
)
