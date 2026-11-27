<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useShowcaseMotion } from '@/composables/useShowcaseMotion'
import { chapters, type SceneId } from './story/film'
import FilmArtwork from './story/FilmArtwork.vue'
import SiteIcon from './SiteIcon.vue'
import '@/styles/scroll-film.css'

const props = defineProps<{ home?: boolean }>()
const highlights = new Set<SceneId>(['neighbors', 'lock', 'speed', 'wifi', 'desktop-connect'])
const features = chapters.filter(
  ({ scene }) => scene !== 'connect' && (!props.home || highlights.has(scene))
)
const root = ref<HTMLElement | null>(null)
const { progress, travel, reduced } = useShowcaseMotion(root)
const opening = chapters[0]
const wide = new Set<SceneId>(['links', 'speed', 'desktop-connect'])
</script>

<template>
  <section ref="root" class="showcase" :data-reduced="reduced" aria-label="CPE加加产品展示">
    <header id="film-connect" class="showcase-hero">
      <div id="mobile" class="showcase-hero-layout content-width">
        <div class="showcase-lead">
          <p class="showcase-kicker">
            <span></span>{{ home ? '4G / 5G CPE 管理工具' : 'Android 版' }}
          </p>
          <h1 v-if="home" id="home-title">看清信号，<br />再调频段</h1>
          <h1 v-else id="product-title">从连接<br />到诊断</h1>
          <p class="showcase-intro">
            {{
              home
                ? '查看 CPE 的信号、小区和频段。调整后，直接用测速验证效果。'
                : '从主辅载波、邻区和锁频，到双向测速与 Wi-Fi 信道分析。'
            }}
          </p>
          <div class="showcase-actions">
            <RouterLink class="showcase-download" to="/download"
              ><SiteIcon name="download" :size="17" />下载 CPE加加</RouterLink
            >
            <RouterLink v-if="home" class="showcase-text-link" to="/product">产品功能</RouterLink>
          </div>
          <p v-if="home" class="showcase-platforms">Android <i></i> macOS <i></i> Windows</p>
        </div>
        <figure
          class="showcase-preview showcase-preview-hero"
          data-preview="connect"
          :data-held="progress('connect') === 1"
          :aria-label="opening.caption + '，示例数据'"
        >
          <div class="showcase-hero-art" :style="{ '--camera-travel': travel }" aria-hidden="true">
            <FilmArtwork scene="connect" :progress="progress('connect')" />
          </div>
          <figcaption><span>Android · 连接看板</span><span>示例数据</span></figcaption>
        </figure>
      </div>
    </header>

    <nav v-if="!home" class="showcase-index content-width" aria-label="产品目录">
      <RouterLink :to="{ path: '/product', hash: '#mobile' }">Android</RouterLink>
      <RouterLink :to="{ path: '/product', hash: '#desktop' }">桌面端</RouterLink>
      <RouterLink :to="{ path: '/product', hash: '#devices' }">设备兼容性</RouterLink>
    </nav>

    <div class="showcase-chapters content-width">
      <article
        v-for="item in features"
        :id="'film-' + item.scene"
        :key="item.scene"
        v-memo="[progress(item.scene)]"
        class="showcase-chapter"
        :class="{
          'showcase-chapter-wide': wide.has(item.scene),
          'showcase-chapter-reverse': item.scene === 'wifi' || item.scene === 'desktop-test',
        }"
        :data-chapter="item.scene"
        :aria-labelledby="'title-' + item.scene"
      >
        <div
          :id="item.scene === 'desktop-connect' ? 'desktop' : undefined"
          class="showcase-chapter-copy"
        >
          <p class="showcase-kicker">
            <span></span>{{ item.platform === 'Android' ? item.label : item.platform }}
          </p>
          <h2 :id="'title-' + item.scene">{{ item.heading }}</h2>
          <p class="showcase-chapter-description">{{ item.copy }}</p>
        </div>
        <figure
          class="showcase-preview"
          :data-preview="item.scene"
          :data-held="progress(item.scene) === 1"
          :aria-label="item.caption + '，示例数据'"
        >
          <div class="showcase-art" aria-hidden="true">
            <FilmArtwork :scene="item.scene" :progress="progress(item.scene)" />
          </div>
          <figcaption>
            <span>{{ item.caption }}</span
            ><span>示例数据</span>
          </figcaption>
        </figure>
      </article>
    </div>
  </section>
</template>
