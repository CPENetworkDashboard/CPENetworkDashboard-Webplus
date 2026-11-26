import { mount, flushPromises, RouterLinkStub, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AndroidShowcase from '@/components/AndroidShowcase.vue'
import { chapters, linkedScene, type SceneId } from '@/components/story/film'

let view: VueWrapper | undefined
let reduced = false
let top = 0
let clock = 0
let frames: Map<number, FrameRequestCallback>
let serial = 0
let setVisible: (value: boolean) => void

beforeEach(() => {
  reduced = false
  top = 0
  clock = 0
  frames = new Map()
  vi.stubGlobal('matchMedia', () => ({
    matches: reduced,
    addEventListener() {},
    removeEventListener() {},
  }))
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    frames.set(++serial, cb)
    return serial
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id))
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
        setVisible = (value) => cb([{ isIntersecting: value }])
      }
      observe() {
        setVisible(true)
      }
      disconnect() {}
    }
  )
})
afterEach(() => {
  view?.unmount()
  view = undefined
  vi.unstubAllGlobals()
})

function render() {
  view = mount(AndroidShowcase, { global: { stubs: { RouterLink: RouterLinkStub } } })
  const track = view.element as HTMLElement
  Object.defineProperty(track, 'offsetHeight', { value: 3500 })
  vi.spyOn(track, 'getBoundingClientRect').mockImplementation(() => ({ top }) as DOMRect)
  const stage = track.querySelector<HTMLElement>('.film-stage')
  if (stage) {
    Object.defineProperty(stage, 'clientHeight', { value: 500 })
    Object.defineProperty(stage, 'offsetHeight', { value: 500 })
  }
  return view
}
async function advance(count = 1) {
  for (let i = 0; i < count; i++) {
    const pending = [...frames.values()]
    frames.clear()
    clock += 50
    for (const cb of pending) cb(clock)
  }
  await flushPromises()
}

async function seek(scene: SceneId) {
  const index = chapters.findIndex((chapter) => chapter.scene === scene)
  top = -((index + 0.1) * 3000) / chapters.length
  window.dispatchEvent(new Event('scroll'))
  await advance()
}

describe('product presentation', () => {
  it('opens on the Android connection screen, completes its take without input and holds the same frame until the visitor scrolls', async () => {
    const page = render()
    await advance()
    expect(page.attributes('data-shot')).toBe('connect')
    await advance(92)
    expect(page.attributes('data-settled')).toBe('true')
    expect(frames.size).toBe(0)
    await advance(140)
    expect(page.attributes('data-shot')).toBe('connect')
    const handset = page.get('.android-handset').element
    const statusBar = page.get('.android-status-line').element
    expect(page.get('.android-dock').text()).toBe('连接锁频测试设置')
    expect(page.get('.rs-cell').attributes('data-carrier')).toBe('NR SCC1')
    await seek('neighbors')
    expect(page.get('.rs-device-stats').findAll('dt')).toHaveLength(13)
    expect(page.get('.rs-neighbor-list').text()).toContain('265/1')
    await seek('lock')
    expect(
      page
        .get('.rs-lock-tabs')
        .findAll('li')
        .map((tab) => tab.text())
    ).toEqual(['网络首选', '锁频段', '锁频点', '锁小区'])
    await seek('speed')
    expect(page.get('.android-handset').element).toBe(handset)
    expect(page.get('.android-status-line').element).toBe(statusBar)
    expect(page.get('.android-detail-bar').text()).toBe('测速')
    await seek('desktop-lock')
    expect(page.attributes('data-shot')).toBe('desktop-lock')
    await seek('connect')
    expect(page.get('.rs-cell').attributes('data-carrier')).toBe('NR PCC')
    expect(page.find('button, input, select, [tabindex], [role="tab"]').exists()).toBe(false)
  })
  it('suspends animation outside the viewport and removes the pending frame on unmount', async () => {
    render()
    await advance(3)
    setVisible(false)
    expect(frames.size).toBe(0)
    window.dispatchEvent(new Event('scroll'))
    expect(frames.size).toBe(0)
    setVisible(true)
    await advance()
    expect(frames.size).toBe(1)
    view!.unmount()
    view = undefined
    expect(frames.size).toBe(0)
  })
  it('shows all features in reading order when motion is reduced and preserves older shared scene names', async () => {
    reduced = true
    const page = render()
    expect(page.findAll('.sp-bands li').map((band) => band.text().replace(/\s/g, ''))).toEqual([
      '2.4GHz',
      '5GHz',
    ])
    expect(page.findAll('.film-transcript > article').map((el) => el.attributes('id'))).toEqual([
      'film-connect',
      'film-links',
      'film-neighbors',
      'film-lock',
      'film-tests',
      'film-speed',
      'film-wifi',
      'film-settings',
      'film-desktop-connect',
      'film-desktop-lock',
      'film-desktop-test',
    ])
    expect(frames.size).toBe(0)
    expect(linkedScene('lock')).toBe('lock')
    expect(linkedScene('speed')).toBe('speed')
    expect(linkedScene('settings')).toBe('settings')
    expect(linkedScene('bogus')).toBeUndefined()
  })
})
