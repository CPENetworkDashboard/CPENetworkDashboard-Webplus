import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import AndroidShowcase from '@/components/AndroidShowcase.vue'

let wrapper: VueWrapper | undefined

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    }
  )
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  vi.unstubAllGlobals()
})

function renderShowcase() {
  wrapper = mount(AndroidShowcase)
  return wrapper
}

describe('Android product showcase', () => {
  it('switches between current connection and neighbor layouts', async () => {
    const view = renderShowcase()
    expect(view.find('.pm-overview').exists()).toBe(true)

    await view.get('[data-preview="neighbors"]').trigger('click')
    expect(view.findAll('.pm-device-grid > div')).toHaveLength(9)
    expect(view.findAll('.pm-neighbor-row')).toHaveLength(3)
    expect(view.get('[data-preview="neighbors"]').attributes('aria-selected')).toBe('true')
  })

  it('renders separate LTE and NR role grids with the verified selection', async () => {
    const view = renderShowcase()
    await view.get('[data-preview="lock"]').trigger('click')

    expect(view.findAll('.pm-band-grid')).toHaveLength(2)
    expect(view.findAll('.pm-band-grid > span.on')).toHaveLength(2)
    expect(view.get('.pm-band-role .on').text()).toBe('Pcell+Scell')
    expect(view.get('.pm-band-grid > span.locked').text()).toContain('N78')
    expect(view.get('.pm-status-pill').text()).toContain('回读一致')
  })

  it('shows independent download and upload charts and allows theme changes', async () => {
    const view = renderShowcase()
    await view.get('[data-preview="speed"]').trigger('click')

    const cards = view.findAll('.pm-speed-card')
    expect(cards).toHaveLength(2)
    expect(cards[0]!.get('.pm-speed-headline strong').text()).toBe('508')
    expect(cards[1]!.get('.pm-speed-headline strong').text()).toBe('84.2')
    expect(view.find('.pm-screen.light').exists()).toBe(true)

    await view.get('.android-theme-switch').trigger('click')
    expect(view.find('.pm-screen.dark').exists()).toBe(true)

    await view.get('[data-preview="wifi"]').trigger('click')
    expect(view.find('.pm-wifi').exists()).toBe(true)
  })
})
