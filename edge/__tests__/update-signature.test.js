import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const origin = 'https://cpe.plus'
const source = readFileSync(resolve('edge/index.js'), 'utf8')
const windowsExeChecksum =
  "checksum: '0808a5a69bf1ac5a16561955f67cc55ac87cfb3c3298b28dbe8e6ab17290addf',"
const signature = 'c2lnbmVkLWJ5LXRoZS1yZWxlYXNlLWtleQ=='

function createEdge(edgeSource = source) {
  const store = new Map([['config', JSON.stringify({ CPE_STATS_TOKEN: 'publish-secret' })]])
  return new Function('EdgeKV', edgeSource.replace('export default', 'return'))(
    class {
      async get(key) {
        return store.get(key)
      }
      async put(key, value) {
        store.set(key, value)
      }
    }
  )
}

async function checkWindowsUpdate(edge) {
  const response = await edge.fetch(
    new Request(`${origin}/api/updates/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ platform: 'windows', version: '3.5.0', versionCode: 350 }),
    })
  )
  expect(response.status).toBe(200)
  return response.json()
}

describe('desktop update signatures', () => {
  it('returns the release signature of a built-in download', async () => {
    expect(source).toContain(windowsExeChecksum)
    const edge = createEdge(
      source.replace(windowsExeChecksum, `${windowsExeChecksum}\n    signature: '${signature}',`)
    )
    const { latest } = await checkWindowsUpdate(edge)
    expect(latest.download.signature).toBe(signature)
  })

  it('returns an empty signature for unsigned downloads', async () => {
    const { latest } = await checkWindowsUpdate(createEdge())
    expect(latest.download.signature).toBe('')
    expect(latest.alternatives.map((item) => item.signature)).toEqual(['', ''])
  })

  it('keeps the signature of a published custom download', async () => {
    const edge = createEdge()
    const published = await edge.fetch(
      new Request(`${origin}/api/updates/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer publish-secret' },
        body: JSON.stringify({
          platform: 'windows',
          version: '3.6.0',
          versionCode: 360,
          download: {
            fileName: 'CPEPlusPlus-3.6.0-windows-x64.exe',
            href: '/downloads/CPEPlusPlus-3.6.0-windows-x64.exe',
            checksum: 'a'.repeat(64),
            signature: ` ${signature} `,
          },
        }),
      })
    )
    expect(published.status).toBe(200)
    const { latest } = await checkWindowsUpdate(edge)
    expect(latest.version).toBe('3.6.0')
    expect(latest.download.signature).toBe(signature)
  })
})
