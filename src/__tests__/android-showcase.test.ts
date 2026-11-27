import { mount, flushPromises, RouterLinkStub, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AndroidShowcase from '@/components/AndroidShowcase.vue'
import { chapters, linkedScene } from '@/components/story/film'

let view: VueWrapper | undefined
let clock = 0
let serial = 0
let frames: Map<number, FrameRequestCallback>
let observed: Set<Element>
let emitEntries: IntersectionObserverCallback
let prefersReducedMotion = false
let changePreference: () => void
const disconnect = vi.fn()

beforeEach(() => {
  clock = 0
  frames = new Map()
  observed = new Set()
  prefersReducedMotion = false
  disconnect.mockClear()
  vi.stubGlobal('matchMedia', () => ({
    get matches() {
      return prefersReducedMotion
    },
    addEventListener(_event: string, cb: () => void) {
      changePreference = cb
    },
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
      constructor(cb: IntersectionObserverCallback) {
        emitEntries = cb
      }
      observe(target: Element) {
        observed.add(target)
      }
      disconnect() {
        observed.clear()
        disconnect()
      }
    }
  )
})

afterEach(() => {
  view?.unmount()
  view = undefined
  vi.unstubAllGlobals()
})

function render(home = false) {
  view = mount(AndroidShowcase, {
    props: { home },
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
  return view
}

function visibility(target: Element, ratio: number) {
  expect(observed.has(target)).toBe(true)
  emitEntries(
    [{ target, isIntersecting: ratio > 0, intersectionRatio: ratio } as IntersectionObserverEntry],
    {} as IntersectionObserver
  )
}

async function tick(count = 1) {
  for (let i = 0; i < count; i++) {
    const pending = [...frames.values()]
    frames.clear()
    clock += 40
    for (const frame of pending) frame(clock)
  }
  await flushPromises()
}

function getStyle(node: Element, variable: string) {
  return Number((node as HTMLElement).style.getPropertyValue(variable))
}

describe('product presentation', () => {
  it('keeps the Android opening and the later features in page order without demo controls', () => {
    const page = render(true)
    expect(
      page.findAll('.showcase-preview').map((preview) => preview.attributes('data-preview'))
    ).toEqual(['connect', 'neighbors', 'lock', 'speed', 'wifi', 'desktop-connect'])
    expect(page.findAll('.hero-panel')).toHaveLength(3)
    expect(page.get('.android-dock').text()).toBe('连接锁频测试设置')
    expect(
      page.find('.showcase-preview button, .showcase-preview input, .showcase-preview a').exists()
    ).toBe(false)
  })

  it('plays the visible take once, pauses away from it and holds the completed frame on return', async () => {
    const page = render()
    const opening = page.get('[data-preview=connect]')
    const speed = page.get('[data-preview=speed]')
    visibility(opening.element, 0.9)
    await tick(22)
    expect(opening.attributes('data-held')).toBe('false')
    expect(speed.attributes('data-held')).toBe('false')
    visibility(opening.element, 0)
    await tick()
    const paused = opening.html()
    await tick(80)
    expect(opening.html()).toBe(paused)
    expect(frames.size).toBe(0)

    visibility(opening.element, 1)
    await tick(70)
    expect(opening.attributes('data-held')).toBe('true')
    expect(opening.get('.rs-cell').attributes('data-carrier')).toBe('NR SCC1')
    expect(opening.get('.hero-rf').text()).toContain('-87')
    const completed = opening.html()
    visibility(opening.element, 0)
    visibility(opening.element, 1)
    await tick(80)
    expect(opening.html()).toBe(completed)

    visibility(speed.element, 0.12)
    await tick(80)
    expect(speed.attributes('data-held')).toBe('false')
    visibility(speed.element, 0.8)
    await tick(70)
    expect(speed.get('.pm-speed-card.down .pm-speed-headline strong').text()).toBe('508')
    expect(speed.get('.pm-speed-card.up .pm-speed-headline strong').text()).toBe('84.2')
    expect(speed.attributes('data-held')).toBe('true')
    expect(frames.size).toBe(0)
  })

  it('follows native scroll in both directions without replacing or pinning the chapters', async () => {
    const page = render()
    const hero = page.get('.showcase-hero').element
    const artwork = page.get('.showcase-hero-art').element
    const neighbor = page.get('[data-preview=neighbors]').element
    let heroTop = 0
    let neighborTop = innerHeight * 0.94
    const rect = (top: number, height: number) => ({ top, height }) as DOMRect
    vi.spyOn(hero, 'getBoundingClientRect').mockImplementation(() => rect(heroTop, 640))
    vi.spyOn(neighbor, 'getBoundingClientRect').mockImplementation(() => rect(neighborTop, 350))
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    try {
      visibility(hero, 0.6)
      visibility(neighbor, 0.1)
      await tick()
      expect(getStyle(artwork, '--camera-travel')).toBe(0)
      expect(getStyle(neighbor, '--arrival')).toBeGreaterThan(0.7)

      heroTop = -320
      neighborTop = innerHeight * 0.4
      window.dispatchEvent(new Event('scroll'))
      await tick()
      expect(getStyle(artwork, '--camera-travel')).toBeGreaterThan(0.4)
      expect(getStyle(neighbor, '--arrival')).toBe(0)
      expect(page.get('[data-preview=neighbors]').element).toBe(neighbor)

      heroTop = 0
      window.dispatchEvent(new Event('scroll'))
      await tick()
      expect(getStyle(artwork, '--camera-travel')).toBe(0)
      expect(scrollTo).not.toHaveBeenCalled()
      expect(frames.size).toBe(0)
    } finally {
      scrollTo.mockRestore()
    }
  })

  it('keeps deep links and every finished example readable with reduced motion', async () => {
    const page = render()
    visibility(page.get('[data-preview=connect]').element, 1)
    expect(frames.size).toBe(1)
    prefersReducedMotion = true
    changePreference()
    await flushPromises()
    expect(disconnect).toHaveBeenCalledOnce()
    expect(frames.size).toBe(0)
    expect(page.attributes('data-reduced')).toBe('true')
    expect(page.findAll('.showcase-preview[data-held=true]')).toHaveLength(chapters.length)
    expect(
      page.findAll('article.showcase-chapter').map((article) => article.attributes('id'))
    ).toEqual(chapters.slice(1).map(({ scene }) => 'film-' + scene))
    expect(page.get('#desktop').text()).toContain('桌面连接看板')
    expect(page.findAll('.sp-bands li').map((band) => band.text().replace(/\s/g, ''))).toEqual([
      '2.4GHz',
      '5GHz',
    ])
    expect(linkedScene('lock')).toBe('lock')
    expect(linkedScene('speed')).toBe('speed')
    expect(linkedScene('bogus')).toBeUndefined()
  })
})
