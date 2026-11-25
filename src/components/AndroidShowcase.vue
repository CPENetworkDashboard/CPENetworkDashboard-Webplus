<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useScrollFilm } from '@/composables/useScrollFilm'
import { chapters as allChapters } from './story/film'
import FilmArtwork from './story/FilmArtwork.vue'
import SiteIcon from './SiteIcon.vue'
import '@/styles/scroll-film.css'
const props = defineProps<{ home?: boolean }>()
const chapters = props.home
  ? allChapters.filter((chapter) =>
      ['connect', 'neighbors', 'lock', 'speed', 'wifi', 'desktop-connect'].includes(chapter.scene)
    )
  : allChapters
const desktopIndex = chapters.findIndex((chapter) => chapter.platform === 'macOS / Windows')
const track = ref<HTMLElement | null>(null)
const stage = ref<HTMLElement | null>(null)
const { active, progress, position, reduced } = useScrollFilm(track, stage, chapters.length)
const shot = computed(() => chapters[active.value]!)
const platform = computed(() => (shot.value.platform === 'Android' ? 'android' : 'desktop'))
const camera = computed(() => {
  const within = position.value - active.value
  return {
    '--travel': Math.min(1, within),
    '--take': progress.value,
    '--frame-out': active.value === chapters.length - 1 ? 0 : Math.max(0, (within - 0.78) / 0.22),
    '--film-length': chapters.length,
  }
})
function platformAnchor(index: number) {
  if (index === 0) return 'mobile'
  if (index === desktopIndex) return 'desktop'
  return undefined
}
</script>
<template>
  <section
    ref="track"
    class="scroll-film"
    :class="{ 'film-static': reduced, 'film-home': home }"
    :data-shot="shot.scene"
    :data-platform="platform"
    :data-settled="progress === 1"
    :style="camera"
    aria-label="CPE加加产品展示"
  >
    <template v-if="!reduced">
      <div ref="stage" class="film-stage">
        <div class="film-haze" aria-hidden="true"></div>
        <div class="film-sheet content-width">
          <div :key="shot.scene" class="film-script">
            <p class="film-label">
              {{ home && active === 0 ? 'CPE加加' : shot.platform }}
              <span aria-hidden="true">/</span> {{ home && active === 0 ? 'Android' : shot.label }}
            </p>
            <h1 v-if="home && active === 0" id="home-title">看清信号，<br />再调频段。</h1>
            <h2 v-else>{{ shot.heading }}</h2>
            <p class="film-description">
              {{
                home && active === 0
                  ? '查看 4G / 5G 小区，管理频段与邻区，在同一个 App 里验证网速。'
                  : shot.copy
              }}
            </p>
            <div v-if="active === 0 && home" class="film-actions">
              <RouterLink class="launch-download" to="/download"
                ><SiteIcon name="download" :size="17" />下载 CPE加加</RouterLink
              ><RouterLink class="film-link" to="/product">产品介绍</RouterLink>
            </div>
          </div>
          <figure class="film-figure" :aria-label="shot.caption + '，示例数据'">
            <div class="film-visual" aria-hidden="true">
              <div class="film-orbits"><i></i><i></i><i></i></div>
              <div :key="platform" class="film-art">
                <FilmArtwork :scene="shot.scene" :progress />
              </div>
            </div>
            <figcaption>
              <span>{{ shot.caption }}</span
              ><span>示例数据</span>
            </figcaption>
          </figure>
          <div class="film-foot">
            <span class="film-current-label">{{ shot.label }}</span
            ><span class="film-scroll-cue"><i aria-hidden="true"></i>向下浏览</span>
            <ol aria-label="展示章节">
              <li
                v-for="(item, i) in chapters"
                :key="item.scene"
                :aria-label="item.platform + ' · ' + item.label"
                :aria-current="active === i ? 'step' : undefined"
                :class="{ seen: active > i }"
              >
                <i aria-hidden="true"></i><span>{{ item.label }}</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
      <div
        v-for="(item, i) in chapters"
        :id="platformAnchor(i)"
        :key="item.scene"
        class="film-anchor"
        aria-hidden="true"
        :style="{ '--part': i }"
      >
        <span :id="'film-' + item.scene"></span>
      </div>
      <div class="sr-only">
        <h1 v-if="home && active !== 0">CPE加加</h1>
        <h2>展示内容</h2>
        <ul>
          <li v-for="item in chapters" :key="item.scene">{{ item.heading }}。{{ item.copy }}</li>
        </ul>
      </div>
    </template>
    <div v-else class="film-transcript content-width">
      <header v-if="home">
        <p class="film-label">CPE加加 / CPE++</p>
        <h1>看清信号，再调频段。</h1>
        <RouterLink class="launch-download" to="/download"
          ><SiteIcon name="download" :size="17" />下载 CPE加加</RouterLink
        >
      </header>
      <article v-for="(item, i) in chapters" :id="'film-' + item.scene" :key="item.scene">
        <div :id="platformAnchor(i)">
          <p class="film-label">{{ item.platform }}</p>
          <h2>{{ item.heading }}</h2>
          <p>{{ item.copy }}</p>
        </div>
        <figure :aria-label="item.caption + '，示例数据'">
          <div
            class="film-still"
            :class="{ 'film-still-android': item.platform === 'Android' }"
            aria-hidden="true"
          >
            <FilmArtwork :scene="item.scene" :progress="1" />
          </div>
          <figcaption>{{ item.caption }} · 示例数据</figcaption>
        </figure>
      </article>
    </div>
  </section>
</template>
