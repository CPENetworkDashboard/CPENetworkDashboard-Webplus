import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, KeepAlive, nextTick, ref } from 'vue'
import { mount, type DOMWrapper, type VueWrapper } from '@vue/test-utils'
import AndroidSpeedPanel from '@/components/AndroidSpeedPanel.vue'
import SpeedRealtimeCard from '@/components/story/SpeedRealtimeCard.vue'

let view: VueWrapper | undefined
function render() {
  view = mount(AndroidSpeedPanel)
  return view
}
function press(view: VueWrapper, label: string) {
  const button = view.findAll('button').find((button) => button.text() === label)
  if (!button) throw new Error('Missing playback control: ' + label)
  return button.trigger('click')
}
function values(group: Pick<DOMWrapper<Element>, 'findAll'>) {
  return group.findAll('dd').map((dd) => dd.text())
}
async function tick(ms: number) {
  vi.advanceTimersByTime(ms)
  await nextTick()
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
})
afterEach(() => {
  view?.unmount()
  view = undefined
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('Android local speed playback', () => {
  it('opens on the completed example with independently scaled 30-second plots and session totals', () => {
    const panel = render()
    expect(panel.get('[role="status"]').text()).toBe('已完成')
    expect(panel.text()).toContain('不产生测速流量')
    expect(panel.find('img').exists()).toBe(false)
    expect(panel.findAll('.pm-speed-headline strong').map((el) => el.text())).toEqual([
      '508',
      '84.2',
    ])
    const [down, up] = panel.findAll('.pm-speed-card')
    expect(down!.get('.pm-speed-axis span').text()).toBe('508M')
    expect(up!.get('.pm-speed-axis span').text()).toBe('84.2M')
    expect(down!.findAll('circle')).toHaveLength(30)
    expect(up!.findAll('circle')).toHaveLength(30)
    expect(values(down!)).toEqual(['442 Mbps', '521 Mbps', '9.35 GB'])
    expect(values(up!)).toEqual(['48.6 Mbps', '84.2 Mbps', '1.03 GB'])
    expect(values(panel.get('.speed-summary'))).toEqual(['10.38 GB', '02:49', '雷霆江苏'])
    expect(vi.getTimerCount()).toBe(0)
  })

  it('reads one local sample per second, slides the window and ends on the initial result', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    const send = vi.spyOn(XMLHttpRequest.prototype, 'send')
    const panel = render()
    const completed = panel.text()
    const down = panel.get('.pm-speed-card.down')
    const up = panel.get('.pm-speed-card.up')
    await press(panel, '重播示例')
    expect(values(down)).toEqual(['0 Mbps', '0 Mbps', '0.0 MB'])
    await tick(999)
    expect(down.text()).toContain('等待速率数据')
    await tick(1)
    // 84 and 16 Mbit in the first second. Only the displayed speeds are filtered.
    expect(down.get('strong').text()).toBe('53.1')
    expect(values(down)).toEqual(['84.0 Mbps', '53.1 Mbps', '10.5 MB'])
    expect(values(up)).toEqual(['16.0 Mbps', '10.1 Mbps', '2.0 MB'])
    expect(values(panel.get('.speed-summary')).slice(0, 2)).toEqual(['12.5 MB', '00:01'])
    const now = down.get('circle').attributes('cx')
    await tick(3000)
    // At second four the filter has dropped the first sample; totals still include it.
    expect(values(down)).toEqual(['253 Mbps', '259 Mbps', '126.5 MB'])
    expect(down.findAll('circle')).toHaveLength(4)
    expect(down.findAll('circle')[3]!.attributes('cx')).toBe(now)
    await tick(26_000)
    const points = () => down.findAll('circle').map((point) => point.attributes('cy'))
    const previous = points()
    await tick(1000)
    expect(points()).toHaveLength(30)
    // The scale is unchanged on these seconds; the oldest point has rolled off.
    expect(points().slice(0, -1)).toEqual(previous.slice(1))
    await tick(138_000)
    expect(panel.text()).toBe(completed)
    expect(vi.getTimerCount()).toBe(0)
    expect(fetch).not.toHaveBeenCalled()
    expect(send).not.toHaveBeenCalled()
  })

  it('pauses, continues and stops at a sample boundary, and restarts a stopped run from zero', async () => {
    const panel = render()
    await press(panel, '重播示例')
    await tick(2900)
    await press(panel, '暂停')
    const paused = panel.text()
    expect(vi.getTimerCount()).toBe(0)
    await tick(6000)
    expect(panel.text()).toBe(paused)
    await press(panel, '继续')
    await tick(1000)
    expect(panel.get('.speed-summary').text()).toContain('00:03')
    await press(panel, '停止')
    expect(panel.get('[role="status"]').text()).toBe('已停止')
    expect(vi.getTimerCount()).toBe(0)
    await tick(4000)
    expect(panel.get('.speed-summary').text()).toContain('00:03')
    await press(panel, '重播示例')
    expect(panel.get('.speed-summary').text()).toContain('00:00')
  })

  it('changes both cards and axes to MB/s without changing accumulated traffic or the clock', async () => {
    const panel = render()
    await press(panel, 'MB/s')
    const down = panel.get('.pm-speed-card.down')
    const up = panel.get('.pm-speed-card.up')
    expect(down.get('.pm-speed-headline').text()).toContain('63.5')
    expect(values(down)).toEqual(['55.3 MB/s', '65.1 MB/s', '9.35 GB'])
    expect(up.get('.pm-speed-axis span').text()).toBe('10.5')
    expect(values(up)).toEqual(['6.08 MB/s', '10.5 MB/s', '1.03 GB'])
    expect(values(panel.get('.speed-summary')).slice(0, 2)).toEqual(['10.38 GB', '02:49'])
    expect(panel.get('[aria-pressed="true"]').text()).toBe('MB/s')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('pauses in the background and waits for an explicit continue after visibility returns', async () => {
    let hidden = false
    vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden)
    const panel = render()
    await press(panel, '重播示例')
    await tick(1000)
    hidden = true
    document.dispatchEvent(new Event('visibilitychange'))
    await nextTick()
    await press(panel, '继续')
    expect(vi.getTimerCount()).toBe(0)
    hidden = false
    document.dispatchEvent(new Event('visibilitychange'))
    await tick(10_000)
    expect(panel.get('[role="status"]').text()).toBe('已暂停')
    expect(panel.get('.speed-summary').text()).toContain('00:01')
    await press(panel, '继续')
    await tick(1000)
    expect(panel.get('.speed-summary').text()).toContain('00:02')
  })

  it('releases the clock offscreen, while cached by KeepAlive, and on final unmount', async () => {
    const observers: Observer[] = []
    class Observer {
      observe = vi.fn()
      disconnect = vi.fn()
      constructor(private notify: IntersectionObserverCallback) {
        observers.push(this)
      }
      visible(isIntersecting: boolean) {
        this.notify(
          [{ isIntersecting } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver
        )
      }
    }
    vi.stubGlobal('IntersectionObserver', Observer)
    const remove = vi.spyOn(document, 'removeEventListener')
    const showing = ref(true)
    const panel = (view = mount(
      defineComponent({
        setup: () => () =>
          h(KeepAlive, null, { default: () => (showing.value ? h(AndroidSpeedPanel) : null) }),
      })
    ))
    expect(observers).toHaveLength(1)
    await press(panel, '重播示例')
    await tick(2000)
    const first = observers[0]!
    first.visible(false)
    await nextTick()
    expect(vi.getTimerCount()).toBe(0)
    await press(panel, '继续')
    expect(vi.getTimerCount()).toBe(0)
    first.visible(true)
    await press(panel, '继续')
    showing.value = false
    await nextTick()
    expect(first.disconnect).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(0)
    await tick(8000)
    showing.value = true
    await nextTick()
    expect(observers).toHaveLength(2)
    expect(panel.get('[role="status"]').text()).toBe('已暂停')
    expect(panel.get('.speed-summary').text()).toContain('00:02')
    await press(panel, '继续')
    first.visible(false) // A stale callback from the previous activation.
    await tick(1000)
    expect(panel.get('.speed-summary').text()).toContain('00:03')
    panel.unmount()
    view = undefined
    expect(vi.getTimerCount()).toBe(0)
    expect(observers[1]!.disconnect).toHaveBeenCalledTimes(1)
    expect(remove.mock.calls.filter(([name]) => name === 'visibilitychange')).toHaveLength(2)
  })

  it('keeps the story reveal on whole samples and scales the chart only to the visible window', async () => {
    view = mount(SpeedRealtimeCard, {
      props: {
        direction: 'down',
        rate: '12.0',
        average: '12.0 Mbps',
        peak: '900 Mbps',
        traffic: '1 GB',
        samples: [900, ...Array<number>(30).fill(12)],
        reveal: 0.02,
      },
    })
    expect(view.find('circle').exists()).toBe(false)
    await view.setProps({ reveal: 1 })
    expect(view.findAll('circle')).toHaveLength(30)
    expect(view.get('.pm-speed-axis span').text()).toBe('12.0M')
  })
})
