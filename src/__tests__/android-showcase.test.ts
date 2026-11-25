import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, ref } from 'vue'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import AndroidShowcase from '@/components/AndroidShowcase.vue'
import type { AndroidView } from '@/androidTour'

let wrapper: VueWrapper | undefined
afterEach(() => wrapper?.unmount())
function render() {
  wrapper = mount(
    defineComponent({
      components: { AndroidShowcase },
      setup: () => ({ view: ref<AndroidView>('connect') }),
      template: '<AndroidShowcase :view="view" @select="view = $event" />',
    })
  )
  return wrapper
}

describe('interactive Android tour', () => {
  it('updates the serving-cell metrics when the user changes carrier', async () => {
    const view = render()
    expect(view.get('.app-metrics').text()).toContain('N41')
    await view.get('[aria-label="查看载波"] button:last-child').trigger('click')
    expect(view.get('.app-metrics').text()).toContain('N78')
    expect(view.get('.radio-metrics').text()).toContain('-87')
  })

  it('applies appearance changes in Settings when returning to Connection', async () => {
    const view = render()
    await view.get('.app-dock button:last-child').trigger('click')
    await view.get('[aria-label="演示界面外观"] button:first-child').trigger('click')
    await view.get('[aria-label="信号质量样式"] button:last-child').trigger('click')
    await view.get('.app-dock button:first-of-type').trigger('click')
    expect(view.get('.android-app').attributes('data-app-theme')).toBe('light')
    expect(view.get('.radio-metrics').classes()).toContain('outlined')
  })

  it('opens Wi-Fi from the test dock and shows the selected frequency range', async () => {
    const view = render()
    await view.get('.app-dock button:nth-of-type(3)').trigger('click')
    await view.get('.app-stack .app-row:last-child').trigger('click')
    await flushPromises()
    // Async route panels load only when a visitor opens them.
    await import('@/components/WifiChannelPreview.vue')
    await flushPromises()
    await view.get('.wifi-controls button:last-child').trigger('click')
    expect(view.get('.wifi-plot').attributes('aria-label')).toContain('6 GHz')
    expect(view.get('.wifi-readings').text()).toContain('Office-6E')
    await view.get('[aria-label="返回测试"]').trigger('click')
    expect(view.get('.android-app').attributes('data-screen')).toBe('tests')
  })
})
