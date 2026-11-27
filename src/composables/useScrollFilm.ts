import { onMounted, onUnmounted, ref, type Ref } from 'vue'

const readingMode = [
  '(prefers-reduced-motion: reduce)',
  '(max-height: 350px)',
  '(max-width: 559px) and (max-height: 530px)',
  '(max-width: 640px) and (max-height: 380px)',
].join(', ')

/** One take per chapter. Scroll selects the shot, which plays to its end and holds there. */
export function useScrollFilm(
  track: Ref<HTMLElement | null>,
  stage: Ref<HTMLElement | null>,
  count: number
) {
  const active = ref(0),
    progress = ref(0),
    travel = ref(0)
  const media = typeof window === 'undefined' ? undefined : window.matchMedia(readingMode)
  const reduced = ref(media?.matches ?? false)
  const duration = 3200
  let observer: IntersectionObserver | undefined, resize: ResizeObserver | undefined
  let visible = false,
    dirty = true,
    frame = 0
  let take = 0,
    previous = 0
  const finished = new Set<number>()

  function measure() {
    const root = track.value,
      sticky = stage.value
    if (!root || !sticky || !sticky.clientHeight) return
    const distance = root.offsetHeight - sticky.offsetHeight
    const top = parseFloat(getComputedStyle(sticky).top) || 0
    const physical =
      distance > 0
        ? Math.max(
            0,
            Math.min(count, ((top - root.getBoundingClientRect().top) / distance) * count)
          )
        : 0
    const chapter = Math.min(count - 1, Math.floor(physical))
    const local = physical - chapter
    travel.value = local
    // Completed chapters stay assembled when revisited. A quick swipe can still seek into a new take.
    if (chapter !== active.value) {
      active.value = chapter
      take = finished.has(chapter) ? 1 : 0
      previous = 0
    }
    take = Math.min(1, Math.max(take, local * 1.12))
  }
  function play(now: number) {
    frame = 0
    if (!visible || document.hidden || reduced.value) return
    if (dirty) measure()
    if (previous) take = Math.min(1, take + Math.min(100, now - previous) / duration)
    previous = now
    // Keep in-screen motion in step with the display while the chapter plays.
    progress.value = take
    dirty = false
    if (take < 1) frame = requestAnimationFrame(play)
    else {
      finished.add(active.value)
      previous = 0
    }
  }
  function requestPaint() {
    dirty = true
    if (visible && !reduced.value && !document.hidden && !frame) frame = requestAnimationFrame(play)
  }
  function suspend() {
    cancelAnimationFrame(frame)
    frame = 0
    previous = 0
  }
  function preference() {
    reduced.value = media?.matches ?? false
    if (reduced.value) suspend()
    else requestPaint()
  }
  function visibility() {
    if (document.hidden) suspend()
    else requestPaint()
  }
  onMounted(() => {
    media?.addEventListener('change', preference)
    if ('IntersectionObserver' in window && track.value) {
      observer = new IntersectionObserver(([entry]) => {
        visible = !!entry?.isIntersecting
        if (visible) requestPaint()
        else suspend()
      })
      observer.observe(track.value)
    } else {
      visible = true
      requestPaint()
    }
    if (typeof ResizeObserver !== 'undefined' && track.value) {
      resize = new ResizeObserver(requestPaint)
      resize.observe(track.value)
    }
    window.addEventListener('scroll', requestPaint, { passive: true })
    window.addEventListener('resize', requestPaint)
    document.addEventListener('visibilitychange', visibility)
  })
  onUnmounted(() => {
    suspend()
    observer?.disconnect()
    resize?.disconnect()
    media?.removeEventListener('change', preference)
    window.removeEventListener('scroll', requestPaint)
    window.removeEventListener('resize', requestPaint)
    document.removeEventListener('visibilitychange', visibility)
  })
  return { active, progress, travel, reduced }
}
