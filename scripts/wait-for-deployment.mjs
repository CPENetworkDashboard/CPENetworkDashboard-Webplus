import { readFile } from 'node:fs/promises'
const origin = new URL(process.env.CPE_STATUS_ORIGIN || 'https://cpe.plus')
const html = await readFile('dist/index.html', 'utf8')
const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"\s]+)"/g)].map((match) => match[1])
const source = await readFile('edge/index.js', 'utf8')
const build = source.match(/const EDGE_BUILD = '([^']+)'/)?.[1]
if (!assets.length || !build) throw new Error('Build assets or edge build identifier missing')
const deadline = Date.now() + 20 * 60_000
let lastError
while (Date.now() < deadline) {
  try {
    const [page, health] = await Promise.all([
      fetch(new URL('/?deployment=' + (process.env.GITHUB_SHA || build), origin), {
        cache: 'no-store',
        signal: AbortSignal.timeout(15_000),
      }),
      fetch(new URL('/api/health', origin), {
        cache: 'no-store',
        signal: AbortSignal.timeout(15_000),
      }),
    ])
    const body = await page.text()
    const data = await health.json()
    if (
      !page.ok ||
      !health.ok ||
      data.build !== build ||
      !assets.every((asset) => body.includes(asset))
    )
      throw new Error('ESA is still serving an earlier build')
    console.log('Verified published frontend assets and edge build ' + build)
    process.exit(0)
  } catch (error) {
    lastError = error
  }
  await new Promise((done) => setTimeout(done, 15_000))
}
throw new Error('Deployment verification timed out: ' + lastError?.message)
