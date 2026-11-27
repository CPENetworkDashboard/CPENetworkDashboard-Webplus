import { onMounted, onUnmounted, reactive, ref, type Ref } from 'vue'
import type { SceneId } from '@/components/story/film'
import { span } from '@/components/story/quality'

/** Play each example once as it enters the page. The page itself always scrolls normally. */
export function useShowcaseMotion(root: Ref<HTMLElement | null>) {
  const preference =
    typeof window === 'undefined' ? null : window.matchMedia('(prefers-reduced-motion: reduce)')
  const supportsVisibility = typeof IntersectionObserver !== 'undefined'
  const reduced = ref(!supportsVisibility || (preference?.matches ?? true))
  const shots = reactive<Partial<Record<SceneId, number>>>({})
  const travel = ref(0)
  const playing = new Set<SceneId>()
  const inView = new Set<HTMLElement>()
  let observer: IntersectionObserver | undefined
  let hero: HTMLElement | null = null
  let heroVisible = false
  let measure = true
  let previous: number | undefined
  let frame = 0

  function progress(scene: SceneId) {
    return reduced.value ? 1 : (shots[scene] ?? 0)
  }

  function schedule() {
    if (!frame && !reduced.value && !document.hidden) frame = requestAnimationFrame(paint)
  }

  function paint(timestamp: number) {
    frame = 0
    if (measure) {
      const height = window.innerHeight
      const arrivals = Array.from(inView, (preview) => ({
        preview,
        arrival: span(preview.getBoundingClientRect().top / height, 0.47, 0.97),
      }))
      if (heroVisible && hero) {
        const rect = hero.getBoundingClientRect()
        travel.value = span(-rect.top / Math.min(rect.height, height), 0.06, 0.88)
      }
      for (const { preview, arrival } of arrivals) {
        preview.style.setProperty('--arrival', arrival.toFixed(3))
      }
    }
    measure = false
    const elapsed = previous === undefined ? 0 : Math.min(timestamp - previous, 48)
    for (const scene of playing) {
      const duration = scene === 'connect' ? 2350 : scene === 'speed' ? 2300 : 1420
      const next = Math.min(1, progress(scene) + elapsed / duration)
      shots[scene] = next
      if (next === 1) playing.delete(scene)
    }
    previous = playing.size ? timestamp : undefined
    if (playing.size) schedule()
  }

  function suspend() {
    if (frame) cancelAnimationFrame(frame)
    frame = 0
    previous = undefined
  }

  function onScroll() {
    if ((!heroVisible && !inView.size) || reduced.value) return
    measure = true
    schedule()
  }

  function observe() {
    if (!root.value || reduced.value) return
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target === hero) {
            heroVisible = entry.isIntersecting
            measure = true
            if (heroVisible) schedule()
            continue
          }
          const figure = entry.target as HTMLElement
          const scene = figure.dataset.preview as SceneId
          if (scene !== 'connect') {
            if (entry.isIntersecting) inView.add(figure)
            else inView.delete(figure)
          }
          if (entry.isIntersecting && entry.intersectionRatio >= 0.24 && progress(scene) < 1) {
            playing.add(scene)
            schedule()
          } else {
            playing.delete(scene)
          }
        }
        if (!playing.size) previous = undefined
        onScroll()
      },
      { threshold: [0, 0.24] }
    )
    if (hero) observer.observe(hero)
    for (const figure of root.value.querySelectorAll('[data-preview]')) observer.observe(figure)
  }

  function motionChanged() {
    reduced.value = !supportsVisibility || (preference?.matches ?? true)
    suspend()
    observer?.disconnect()
    playing.clear()
    inView.clear()
    heroVisible = false
    travel.value = 0
    if (!reduced.value) observe()
  }

  function visibilityChanged() {
    if (document.hidden) suspend()
    else if (heroVisible || inView.size || playing.size) {
      measure = true
      schedule()
    }
  }

  onMounted(() => {
    hero = root.value?.querySelector('.showcase-hero') ?? null
    preference?.addEventListener('change', motionChanged)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    document.addEventListener('visibilitychange', visibilityChanged)
    observe()
  })

  onUnmounted(() => {
    suspend()
    observer?.disconnect()
    preference?.removeEventListener('change', motionChanged)
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
    document.removeEventListener('visibilitychange', visibilityChanged)
  })

  return { progress, travel, reduced }
}
