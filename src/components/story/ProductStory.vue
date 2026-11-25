<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import SiteIcon from '@/components/SiteIcon.vue'
import { useSiteTheme } from '@/composables/useSiteTheme'
import ChapterConnect from './ChapterConnect.vue'
import ChapterLock from './ChapterLock.vue'
import ChapterPlatforms from './ChapterPlatforms.vue'
import ChapterStyle from './ChapterStyle.vue'
import ChapterTest from './ChapterTest.vue'
import ChapterTools from './ChapterTools.vue'
import FitBox from './FitBox.vue'
import PhoneConnect from './PhoneConnect.vue'
import PhoneMock from './PhoneMock.vue'
import StoryHero from './StoryHero.vue'
import { finalPower, finalRadio } from './data'
import { clamp, ease, pop, span } from './quality'

defineProps<{ versions: Array<{ name: string; version?: string }> }>()

interface Chapter {
  id: string
  name: string
  eyebrow: string
  lines: string[]
  steps: Array<[string, string]>
  /** Timeline positions where each step starts. */
  marks: number[]
  /** Accent hue for this chapter's aura, eyebrow and rail highlight. */
  hue: number
  duration: number
}
const hero = { id: 'story-top', duration: 7200 }
const chapters: Chapter[] = [
  {
    id: 'story-connect',
    name: '连接',
    eyebrow: '01 连接',
    hue: 160,
    lines: ['信号好不好，', '一眼就知道。'],
    steps: [
      ['连接概览', '运营商、制式和连接状态集中在第一张卡片。'],
      ['射频质量', '数值实时刷新，磁贴下方的条随信号伸缩、变色。'],
      ['按门限评级', 'RSRP、RSRQ、SINR、RSSI、CQI 按客户端内置门限分为五档。'],
      ['设备与邻区', '设备流量、连接时长和周边小区改为适合手机阅读的卡片列表。'],
    ],
    marks: [0, 0.18, 0.48, 0.8],
    duration: 8500,
  },
  {
    id: 'story-lock',
    name: '锁频',
    eyebrow: '02 锁频',
    hue: 214,
    lines: ['换一个频段，', '结果当场验证。'],
    steps: [
      ['选择频段', '按设备能力列出可锁的 NR 与 LTE 频段。'],
      ['写入并重新注册', '写入配置后设备重新注册，过程实时显示。'],
      ['回读校验', '读取设备上的实际规则，确认与设置一致。'],
    ],
    marks: [0, 0.44, 0.7],
    duration: 8000,
  },
  {
    id: 'story-test',
    name: '测试',
    eyebrow: '03 测试',
    hue: 190,
    lines: ['信号还是外网，', '测一下就清楚。'],
    steps: [
      ['多线程测速', '直接在手机上测速，实时、平均与峰值速率都有记录。'],
      ['悬浮速率窗', '切到别的应用也能看到实时速率，默认关闭，按需开启。'],
      ['Ping 延迟', '常用站点一键 Ping，丢包与延迟曲线一目了然。'],
    ],
    marks: [0, 0.3, 0.5],
    duration: 9000,
  },
  {
    id: 'story-tools',
    name: '工具',
    eyebrow: '04 工具',
    hue: 266,
    lines: ['不只看信号，', '排查也在手边。'],
    steps: [
      ['Wi-Fi 信道分析', '2.4 / 5 GHz 周边热点和信道占用一屏看完。'],
      ['诊断与报告', '载波聚合、邻区扫描、离线诊断报告，排查有据可查。'],
      ['插件与终端', '签名插件扩展卡片；烽火、通则支持 SSH，鲲鹏无限、通则可收短信。'],
    ],
    marks: [0, 0.3, 0.62],
    duration: 7000,
  },
  {
    id: 'story-style',
    name: '个性化',
    eyebrow: '05 个性化',
    hue: 322,
    lines: ['界面的质感，', '按你的习惯调。'],
    steps: [
      ['液态玻璃底栏', '折射、模糊与高光随手机倾斜变化；也可换成悬浮底栏或 MIUIX。'],
      ['壁纸与卡片', '自定义壁纸，卡片透明度、背景模糊和高光都能调。'],
      ['两种质量样式', '磁贴内部条，或沿边框绕一圈的跑道，在界面风格里切换。'],
    ],
    marks: [0, 0.44, 0.7],
    duration: 8500,
  },
  {
    id: 'story-platforms',
    name: '多平台',
    eyebrow: '06 多平台',
    hue: 138,
    lines: ['手机现场调，', '电脑长时间看。'],
    steps: [
      ['手机与电脑', 'Android 现场调试，macOS 与 Windows 长时间观察。'],
      ['五家设备', '烽火、华为、鲲鹏无限、中兴、通则，同一套界面。'],
      ['深色与浅色', '跟随系统，或在设置里单独切换。'],
    ],
    marks: [0, 0.3, 0.56],
    duration: 6500,
  },
]
const scenes = [hero, ...chapters]
const theme = useSiteTheme()

// One pinned stage and one persistent phone for the whole story.
const track = ref<HTMLElement | null>(null)
const active = ref(0)
const inside = ref(true)
const sceneScroll = ref(0)
const reduced = ref(false)
const t = ref(0)
let frame = 0
let start = 0
let reduce = false
const tick = (now: number) => {
  t.value = Math.min(1, (now - start) / scenes[active.value]!.duration)
  // The hero keeps breathing apart and back together while it is on screen.
  if (t.value >= 1 && active.value === 0) {
    start = now + 500
    t.value = 0
  }
  frame = t.value < 1 || active.value === 0 ? requestAnimationFrame(tick) : 0
}
function finish() {
  if (frame) cancelAnimationFrame(frame)
  frame = 0
  t.value = 1
}
function play(delay = 0) {
  if (frame) cancelAnimationFrame(frame)
  frame = 0
  t.value = 0
  if (reduce) {
    t.value = 1
    return
  }
  start = performance.now() + delay
  frame = requestAnimationFrame(tick)
}
// Scrolling back shows the finished scene instead of blanking it and replaying.
watch(active, (now, before) => (now < before && now > 0 ? finish() : play(60)))
const tFor = (index: number) =>
  index === active.value ? Math.max(0, t.value) : index < active.value ? 1 : 0
const step = (chapter: Chapter, index: number) =>
  index + 1 === active.value ? chapter.marks.filter((m) => t.value >= m).length - 1 : 0
const reveal = (index: number) => (index + 1 === active.value ? span(t.value, 0, 0.3) : 0)
const charAt = (lines: string[], row: number, index: number, r: number) => {
  const total = lines.join('').length
  const offset = lines.slice(0, row).join('').length
  return Math.min(1, Math.max(0, r * total * 1.25 - offset - index))
}

// Single-phone state across all 7 scenes (00 Hero -> 06 Platforms).
const heroBreath = computed(() => {
  if (reduced.value) return 0.9
  const open = ease(span(tFor(0), 0.04, 0.28))
  const close = 1 - ease(span(tFor(0), 0.8, 0.97))
  const hover = 1 - Math.sin(span(tFor(0), 0.28, 0.8) * Math.PI) * 0.05
  return open * close * hover
})
const heroExplode = computed(() =>
  active.value === 0 ? heroBreath.value * (1 - ease(span(sceneScroll.value, 0.12, 0.92))) : 0
)
const phonePage = computed<'connect' | 'lock' | 'test' | 'settings'>(() =>
  active.value === 2 ? 'lock' : active.value === 3 || active.value === 4 ? 'test' : 'connect'
)
const phoneTheme = computed<'dark' | 'light'>(() => {
  if (active.value === 0) return 'dark'
  if (active.value === 3) return 'light'
  return theme.value
})
const phoneTabs = computed(() =>
  active.value === 2 ? ['网络首选', '锁频段', '锁ARFCN', '锁PCI'] : []
)
const phoneTitle = computed(() =>
  active.value === 3 ? (tFor(3) < 0.5 ? '测速' : 'Ping') : active.value === 4 ? 'Wi-Fi 信道' : ''
)
const tStyle = computed(() => tFor(5))
const styleHop = computed(() => span(tStyle.value, 0.08, 0.4) * 3)
const phoneLens = computed(() => {
  if (active.value !== 5) return undefined
  const index = Math.floor(styleHop.value)
  return Math.min(3, index + ease(clamp((styleHop.value - index) * 2.2)))
})
const phoneLensScale = computed(() => {
  if (active.value !== 5) return 1
  const frac = clamp((styleHop.value - Math.floor(styleHop.value)) * 2.2)
  return styleHop.value >= 3 ? 1 : 1 + Math.sin(frac * Math.PI) * 0.18
})
const styleDockFocus = computed(() =>
  active.value === 5
    ? pop(span(tStyle.value, 0.02, 0.14)) * (1 - ease(span(tStyle.value, 0.38, 0.46)))
    : 0
)
const styleWall = computed(() =>
  active.value === 5
    ? 0.22 * ease(span(tStyle.value, 0.02, 0.2)) + 0.78 * ease(span(tStyle.value, 0.44, 0.64))
    : 0
)
const platformSlide = computed(() => (active.value === 6 ? ease(span(tFor(6), 0.04, 0.4)) : 0))
const platformWipe = computed(() => (active.value === 6 ? ease(span(tFor(6), 0.56, 0.9)) : 0))

// Per-chapter accent hue drives the ambient aura, eyebrow and rail highlight.
const auraHue = computed(() => (active.value === 0 ? 160 : chapters[active.value - 1]!.hue))

// Pointer parallax on decor only (aura + ring): text layers stay flat and crisp.
const px = ref(0)
const py = ref(0)
let pxT = 0
let pyT = 0
let pFrame = 0
const lerpPointer = () => {
  px.value += (pxT - px.value) * 0.09
  py.value += (pyT - py.value) * 0.09
  if (Math.abs(pxT - px.value) > 0.0008 || Math.abs(pyT - py.value) > 0.0008) {
    pFrame = requestAnimationFrame(lerpPointer)
  } else {
    px.value = pxT
    py.value = pyT
    pFrame = 0
  }
}
const onPointer = (e: PointerEvent) => {
  if (e.pointerType !== 'mouse') return
  pxT = (e.clientX / window.innerWidth - 0.5) * 2
  pyT = (e.clientY / window.innerHeight - 0.5) * 2
  if (!pFrame) pFrame = requestAnimationFrame(lerpPointer)
}

let scrollFrame = 0
const measure = () => {
  scrollFrame = 0
  const element = track.value
  if (!element) return
  const rect = element.getBoundingClientRect()
  const stickyH =
    element.querySelector<HTMLElement>('.story-sticky')?.offsetHeight || window.innerHeight
  const anchors = element.querySelectorAll<HTMLElement>('.story-anchor')
  if (!anchors.length) return
  const scrolled = Math.max(0, -rect.top)
  let nextActive = 0
  for (let i = 1; i < anchors.length; i++) {
    if (scrolled >= anchors[i]!.offsetTop) nextActive = i
  }
  const curStart = anchors[nextActive]!.offsetTop
  const curEnd =
    nextActive + 1 < anchors.length
      ? anchors[nextActive + 1]!.offsetTop
      : Math.max(curStart + 1, element.offsetHeight - stickyH)
  sceneScroll.value = clamp((scrolled - curStart) / Math.max(1, curEnd - curStart))
  active.value = nextActive
  inside.value = rect.top < stickyH * 0.5 && rect.bottom > stickyH * 0.6
}
const onScroll = () => {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(measure)
}
const rail = computed(() => (inside.value && active.value > 0 ? active.value - 1 : -1))
const railProgress = (index: number) =>
  index + 1 < active.value ? 1 : index + 1 === active.value ? t.value : 0
function jump(index: number) {
  const element = track.value
  const anchor = document.getElementById(chapters[index]!.id)
  if (!element || !anchor) return
  const trackTop = element.getBoundingClientRect().top + window.scrollY
  window.scrollTo({
    top: trackTop + anchor.offsetTop + 12,
    behavior: reduce ? 'auto' : 'smooth',
  })
}

const narrow = ref(false)
let query: MediaQueryList | undefined
const onQuery = () => (narrow.value = !!query?.matches)
onMounted(() => {
  reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  reduced.value = reduce
  query = window.matchMedia('(max-width: 760px)')
  onQuery()
  query.addEventListener('change', onQuery)
  measure()
  play(260)
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
  if (!reduce && window.matchMedia('(pointer: fine)').matches)
    window.addEventListener('pointermove', onPointer, { passive: true })
})
onUnmounted(() => {
  query?.removeEventListener('change', onQuery)
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  window.removeEventListener('pointermove', onPointer)
  if (frame) cancelAnimationFrame(frame)
  if (scrollFrame) cancelAnimationFrame(scrollFrame)
  if (pFrame) cancelAnimationFrame(pFrame)
})
</script>

<template>
  <div class="story" :class="{ narrow }" :style="{ '--ah': auraHue, '--px': px, '--py': py }">
    <nav class="story-rail" :class="{ show: rail >= 0 }" aria-label="功能章节">
      <button
        v-for="(chapter, index) in chapters"
        :key="chapter.id"
        type="button"
        :class="{ on: index === rail }"
        :aria-current="index === rail ? 'step' : undefined"
        @click="jump(index)"
      >
        <i :style="{ '--p': railProgress(index) }"></i><span>0{{ index + 1 }}</span
        >{{ chapter.name }}
      </button>
    </nav>
    <section ref="track" class="story-track" aria-labelledby="home-title">
      <div class="story-sticky stage" :class="{ dark: active === 0 }">
        <div class="story-heads">
          <header class="story-head story-hero-copy" :class="{ on: active === 0 }">
            <RouterLink class="story-release" to="/changelog"
              >Android 3.7.1 已发布<SiteIcon name="chevron" :size="14"
            /></RouterLink>
            <h1 id="home-title">每一项数据，<br />都摊开给你看。</h1>
            <p>
              CPE加加 连上 4G / 5G CPE
              后台，把信号、锁频和测速放进手机。支持烽火、华为、鲲鹏无限、中兴、通则，也有 macOS 与
              Windows 版本。
            </p>
            <div class="story-actions">
              <RouterLink class="story-button primary" to="/download"
                ><SiteIcon name="download" :size="18" />免费下载</RouterLink
              >
              <RouterLink class="story-button" to="/product">功能介绍</RouterLink>
            </div>
          </header>
          <header
            v-for="(chapter, index) in chapters"
            :key="chapter.id"
            class="story-head"
            :class="{ on: active === index + 1 }"
          >
            <p class="story-eyebrow">{{ chapter.eyebrow }}</p>
            <h2 class="story-reveal">
              <template v-for="(line, row) in chapter.lines" :key="line"
                ><br v-if="row" /><i
                  v-for="(char, at) in line"
                  :key="at"
                  :style="{ '--c': charAt(chapter.lines, row, at, reveal(index)) }"
                  >{{ char }}</i
                ></template
              >
            </h2>
            <ol class="story-steps">
              <li
                v-for="([title, text], at) in chapter.steps"
                :key="title"
                :class="{ on: at === step(chapter, index) }"
              >
                <b>{{ title }}</b
                ><span>{{ text }}</span>
              </li>
            </ol>
            <ul v-if="chapter.id === 'story-platforms'" class="story-versions">
              <li v-for="item in versions" :key="item.name">
                <b>{{ item.name }}</b
                ><span>v{{ item.version }}</span>
              </li>
            </ul>
          </header>
        </div>
        <div class="story-stagebox">
          <i class="story-aura" aria-hidden="true"></i>
          <i
            class="story-ring"
            :class="{ on: active === 0 }"
            :style="{ '--e': heroExplode }"
            aria-hidden="true"
          ></i>
          <ChapterTest :t="tFor(3)" :on="active === 3" mode="back" />
          <ChapterPlatforms :t="tFor(6)" :on="active === 6" :theme />

          <div
            class="story-phone"
            :class="{ hero: active === 0, platforms: active === 6 }"
            :style="{
              '--sp': sceneScroll,
              '--t': t,
              '--w': styleWall,
              '--s': platformSlide,
            }"
          >
            <FitBox :width="410" fit-height>
              <PhoneMock
                :page="phonePage"
                :theme="phoneTheme"
                :explode="heroExplode"
                :wipe="platformWipe"
                :tabs="phoneTabs"
                :tab="1"
                :title="phoneTitle"
                :wallpaper="active === 5"
                :spill="active >= 1 && active <= 4"
                :lens="phoneLens"
                :lens-scale="phoneLensScale"
                :dock-focus="styleDockFocus"
              >
                <PhoneConnect
                  v-if="active === 0 || active === 6"
                  :radio="finalRadio"
                  :power="finalPower"
                  :layered="active === 0"
                />
                <ChapterConnect v-else-if="active === 1" :t="tFor(1)" />
                <ChapterLock v-else-if="active === 2" :t="tFor(2)" mode="screen" />
                <ChapterTest v-else-if="active === 3" :t="tFor(3)" mode="screen" />
                <ChapterTools v-else-if="active === 4" :t="tFor(4)" mode="screen" />
                <ChapterStyle v-else-if="active === 5" :t="tFor(5)" />
              </PhoneMock>
            </FitBox>
          </div>

          <StoryHero :explode="heroExplode" :on="active === 0" />
          <ChapterLock :t="tFor(2)" :on="active === 2" mode="stage" />
          <ChapterTest :t="tFor(3)" :on="active === 3" mode="stage" />
          <ChapterTools :t="tFor(4)" :on="active === 4" mode="stage" />
        </div>
        <span class="story-scroll" :class="{ on: active === 0 }">向下滚动</span>
      </div>
      <div v-for="scene in scenes" :id="scene.id" :key="scene.id" class="story-anchor"></div>
    </section>
  </div>
</template>
