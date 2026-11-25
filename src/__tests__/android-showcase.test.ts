import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AndroidShowcase from '@/components/AndroidShowcase.vue'
import { linkedScene } from '@/components/story/film'

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
  view = mount(AndroidShowcase)
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

describe('product presentation', () => {
  it('opens on desktop, completes its take without input and holds the same frame until the visitor scrolls', async () => {
    const page = render()
    await advance()
    expect(page.attributes('data-shot')).toBe('desktop-connect')
    await advance(92)
    expect(page.attributes('data-settled')).toBe('true')
    expect(frames.size).toBe(0)
    await advance(140)
    expect(page.attributes('data-shot')).toBe('desktop-connect')
    top = -1560
    window.dispatchEvent(new Event('scroll'))
    await advance()
    expect(page.attributes('data-shot')).toBe('neighbors')
    top = -1990
    window.dispatchEvent(new Event('scroll'))
    await advance()
    expect(page.attributes('data-shot')).toBe('lock')
    top = -475
    window.dispatchEvent(new Event('scroll'))
    await advance()
    expect(page.attributes('data-shot')).toBe('desktop-lock')
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
    // The transcript mounts both lazy feature bundles at once. Wait for their actual imports.
    await Promise.all([
      import('@/components/story/RadioScene.vue'),
      import('@/components/story/SpectrumScene.vue'),
    ])
    await flushPromises()
    expect(page.findAll('.sp-bands li').map((band) => band.text().replace(/\s/g, ''))).toEqual([
      '2.4GHz',
      '5GHz',
    ])
    expect(page.findAll('.film-transcript > article').map((el) => el.attributes('id'))).toEqual([
      'film-desktop-connect',
      'film-desktop-lock',
      'film-desktop-test',
      'film-connect',
      'film-neighbors',
      'film-lock',
      'film-speed',
      'film-wifi',
    ])
    expect(frames.size).toBe(0)
    expect(linkedScene('lock')).toBe('lock')
    expect(linkedScene('tests')).toBe('speed')
    expect(linkedScene('bogus')).toBeUndefined()
  })
})
