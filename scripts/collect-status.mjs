import { readFile, mkdir, writeFile, rename, appendFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkService, serviceDefinitions } from '../src/utils/status.ts'

const pause = (ms) => new Promise((done) => setTimeout(done, ms))
function monitorOrigin(value) {
  const url = new URL(value)
  if (url.protocol !== 'https:' && !['127.0.0.1', 'localhost'].includes(url.hostname))
    throw new Error('Monitor origin must use HTTPS')
  if (url.username || url.password) throw new Error('Monitor origin must not contain credentials')
  return url.origin
}
export async function collectStatus(origin, fetcher = fetch) {
  const base = monitorOrigin(origin)
  const definitions = serviceDefinitions('/api').map((item) => ({
    ...item,
    path: new URL(item.path, base).href,
  }))
  const services = await Promise.all(definitions.map((item) => checkService(item, { fetcher })))
  return { at: new Date().toISOString(), services }
}
export async function persistQueue(path, reports) {
  await mkdir(resolve(path, '..'), { recursive: true })
  await writeFile(path + '.tmp', JSON.stringify(reports), { mode: 0o600 })
  await rename(path + '.tmp', path)
}
function payload(report) {
  return {
    at: report.at,
    ...(report.monitor ? { monitor: report.monitor } : {}),
    services: report.services.map(({ id, state, httpStatus, version, build }) => ({
      id,
      state,
      httpStatus,
      ...(version ? { version } : {}),
      ...(build ? { build } : {}),
    })),
  }
}
export async function uploadStatusReports(origin, token, reports, options = {}) {
  const fetcher = options.fetcher || fetch
  const sleep = options.sleep || pause
  const base = monitorOrigin(origin)
  if (!token) throw new Error('Configure CPE_STATUS_TOKEN before uploading status measurements')
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    let retryable = true
    try {
      const response = await fetcher(new URL('/api/status/ingest', base), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ reports: reports.map(payload) }),
        signal: AbortSignal.timeout(30_000),
        redirect: 'error',
      })
      if (!response.ok) {
        retryable = response.status === 408 || response.status === 429 || response.status >= 500
        await response.body?.cancel()
        throw new Error('Status ingest returned HTTP ' + response.status)
      }
      const result = await response.json()
      if (
        result.ok !== true ||
        !Number.isInteger(result.stored) ||
        !Number.isInteger(result.duplicates) ||
        result.stored < 0 ||
        result.duplicates < 0 ||
        result.stored + result.duplicates !== reports.length
      )
        throw new Error('Status ingest did not acknowledge every report; queue retained')
      return result
    } catch (error) {
      if (!retryable || attempt === 3) throw error
      await sleep(attempt * 2_000)
    }
  }
}
export async function verifyStatusHistory(origin, observation, options = {}) {
  const fetcher = options.fetcher || fetch
  const sleep = options.sleep || pause
  const expectedSlot = Math.floor(Date.parse(observation.at) / 300_000)
  let attempts = 0
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    attempts = attempt
    try {
      const response = await fetcher(
        new URL('/api/status/summary?days=30&verify=1', monitorOrigin(origin)),
        {
          headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
          cache: 'no-store',
          signal: AbortSignal.timeout(20_000),
          redirect: 'error',
        }
      )
      if (!response.ok) throw new Error('Status history returned HTTP ' + response.status)
      const data = await response.json()
      const found = data.history?.some(
        (entry) => Math.floor(Date.parse(entry.at) / 300_000) === expectedSlot
      )
      if (
        data.ok === true &&
        data.source === 'scheduled-monitor' &&
        found &&
        Number.isFinite(Date.parse(data.lastCheckedAt)) &&
        Date.parse(data.lastCheckedAt) >= Date.parse(observation.at) - 300_000
      )
        return {
          visible: true,
          verificationAttempts: attempt,
          lastCheckedAt: data.lastCheckedAt,
          samples: data.totals.samples,
          stale: data.stale,
        }
    } catch {
      // A transient read failure is handled the same way as an eventual-consistency delay.
    }
    if (attempt < 5) await sleep(attempt * 3_000)
  }
  // EdgeKV may acknowledge a write before every edge location can read it. The ingest response
  // is authoritative; retain this diagnostic without replaying an already accepted report.
  return { visible: false, visibilityPending: true, verificationAttempts: attempts }
}
export async function flushStatusQueue(origin, token, path, options = {}) {
  let pending
  try {
    pending = JSON.parse(await readFile(path, 'utf8'))
  } catch (error) {
    if (error.code === 'ENOENT') return { stored: 0, duplicates: 0, expired: 0 }
    throw error
  }
  if (!Array.isArray(pending)) throw new Error('Pending report queue is invalid')
  const cutoff = Date.now() - 7 * 86400_000
  const expired = pending.filter((entry) => Date.parse(entry.at) < cutoff)
  let deliverable = pending.filter((entry) => Date.parse(entry.at) >= cutoff)
  if (expired.length + deliverable.length !== pending.length)
    throw new Error('Pending report timestamp is invalid')
  if (expired.length) {
    const recoveryPath = options.recoveryPath || resolve(dirname(path), 'expired-recovery.json')
    let recovery = []
    try {
      recovery = JSON.parse(await readFile(recoveryPath, 'utf8'))
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
    if (!Array.isArray(recovery)) throw new Error('Expired report recovery file is invalid')
    const known = new Set(recovery.map((entry) => entry.at))
    await persistQueue(
      recoveryPath,
      [...recovery, ...expired.filter((entry) => !known.has(entry.at))]
    )
    await persistQueue(path, deliverable)
  }
  let stored = 0,
    duplicates = 0
  while (deliverable.length) {
    const batch = deliverable.slice(0, 100)
    const result = await uploadStatusReports(origin, token, batch, options)
    stored += result.stored
    duplicates += result.duplicates
    deliverable = deliverable.slice(batch.length)
    // Remove only acknowledged batches. Retried time slots are deduplicated by the API.
    await persistQueue(path, deliverable)
  }
  return { stored, duplicates, expired: expired.length }
}
export async function runStatusMonitor(options = {}) {
  const origin = monitorOrigin(
    options.origin || process.env.CPE_STATUS_ORIGIN || 'https://cpe.plus'
  )
  const token = options.token || process.env.CPE_STATUS_TOKEN
  if (!token && !options.dryRun)
    throw new Error('Configure CPE_STATUS_TOKEN in the collector environment')
  const report = await collectStatus(origin, options.fetcher)
  if (options.dryRun) return report
  report.monitor = {
    source: process.env.GITHUB_ACTIONS === 'true' ? 'github-actions' : 'external',
    event: process.env.GITHUB_EVENT_NAME || 'external',
    ...(process.env.GITHUB_RUN_ID
      ? {
          runUrl:
            'https://github.com/CPENetworkDashboard/CPENetworkDashboard-Web/actions/runs/' +
            process.env.GITHUB_RUN_ID,
        }
      : {}),
  }
  const path = resolve(
    options.queuePath || process.env.CPE_STATUS_QUEUE || '.status-reports/pending.json'
  )
  let pending = []
  try {
    pending = JSON.parse(await readFile(path, 'utf8'))
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  if (!Array.isArray(pending)) throw new Error('Pending report queue is invalid')
  await persistQueue(path, [...pending, report])
  const delivered = await flushStatusQueue(origin, token, path, options)
  const history = await verifyStatusHistory(origin, report, options)
  const result = {
    ...delivered,
    ...history,
    checkedAt: report.at,
    services: report.services.map(({ id, state }) => ({ id, state })),
    verifiedAt: new Date().toISOString(),
  }
  await writeFile(resolve(path, '../last-run.json'), JSON.stringify(result, null, 2), {
    mode: 0o600,
  })
  if (process.env.GITHUB_STEP_SUMMARY) {
    const rows = report.services
      .map(
        ({ id, state }) =>
          '| ' + id + ' | ' + (state === 'operational' ? 'Available' : 'Unavailable') + ' |'
      )
      .join('\n')
    await appendFile(
      process.env.GITHUB_STEP_SUMMARY,
      '## Service availability\n\nChecked: ' +
        report.at +
        '\n\n| Service | Result |\n| --- | --- |\n' +
        rows +
        '\n\nStored ' +
        delivered.stored +
        '; duplicate ' +
        delivered.duplicates +
        '; retained expired ' +
        delivered.expired +
        '. ' +
        (history.visible
          ? 'Persisted history visible: ' + history.samples + ' observations.'
          : 'Ingest acknowledged; public history is awaiting EdgeKV replication.') +
        '\n'
    )
  }
  return result
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runStatusMonitor({ dryRun: process.argv.includes('--dry-run') })
    .then((result) => console.log(JSON.stringify(result, null, 2)))
    .catch((error) => {
      console.error('Monitor failed: ' + error.message + '. Unacknowledged reports remain queued.')
      process.exitCode = 1
    })
}
