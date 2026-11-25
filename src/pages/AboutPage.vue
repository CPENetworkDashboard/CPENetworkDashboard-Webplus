<script setup lang="ts">
import LazyImage from '@/components/LazyImage.vue'
import { aboutInfo, appIcon } from '@/content'
</script>

<template>
  <section class="content-width sp-page" aria-labelledby="about-title">
    <header class="sp-header sp-about-header">
      <div class="sp-identity">
        <LazyImage :src="appIcon" alt="" :width="64" :height="64" eager />
        <div>
          <p class="sp-wordmark">{{ aboutInfo.englishName }}</p>
          <h1 id="about-title">关于{{ aboutInfo.chineseName }}</h1>
        </div>
      </div>
      <p>{{ aboutInfo.description }}</p>
      <dl class="sp-project-facts">
        <div>
          <dt>当前版本</dt>
          <dd>{{ aboutInfo.versionName.replace('Desktop', '桌面端') }}</dd>
        </div>
        <div>
          <dt>用户交流群（QQ）</dt>
          <dd>{{ aboutInfo.userGroup }}</dd>
        </div>
      </dl>
    </header>

    <section class="sp-section" aria-labelledby="makers-title">
      <h2 id="makers-title">开发者</h2>
      <ul class="sp-people">
        <li v-for="person in aboutInfo.makers" :key="person.name">
          <h3>{{ person.name }}</h3>
          <div class="sp-links">
            <a
              v-for="link in person.links"
              :key="link.href"
              :href="link.href"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="person.name + '的' + link.label + '主页'"
              >{{ link.label }}</a
            >
          </div>
        </li>
      </ul>
    </section>

    <section class="sp-section" aria-labelledby="sponsor-title">
      <h2 id="sponsor-title">赞助</h2>
      <div>
        <p>赞助用于服务器、下载流量、测试设备和多平台适配。</p>
        <a
          class="sp-link"
          :href="aboutInfo.sponsor.ifdianUrl"
          target="_blank"
          rel="noopener noreferrer"
          >在爱发电赞助</a
        >
        <div class="sp-codes">
          <figure v-for="qr in aboutInfo.sponsor.qrs" :key="qr.image">
            <a
              :href="qr.image"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="'查看' + qr.alt + '原图'"
            >
              <LazyImage :src="qr.image" :alt="qr.alt" :width="152" :height="152" />
            </a>
            <figcaption>{{ qr.label }}</figcaption>
          </figure>
        </div>
      </div>
    </section>

    <section class="sp-section" aria-labelledby="thanks-title">
      <h2 id="thanks-title">特别致谢</h2>
      <ul class="sp-credits">
        <li v-for="person in aboutInfo.thanks" :key="person.name">
          <h3>{{ person.name }}</h3>
          <p>{{ person.contribution }}</p>
          <div v-if="person.links?.length" class="sp-links">
            <a
              v-for="link in person.links"
              :key="link.href"
              :href="link.href"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="person.name + ' · ' + link.label"
              >{{ link.label }}</a
            >
          </div>
        </li>
      </ul>
    </section>
    <p class="font-credit">
      本站使用小米 MiSans 字体。<a
        class="sp-link"
        href="/fonts/MiSans-LICENSE.pdf"
        target="_blank"
        rel="noopener noreferrer"
        >字体许可协议</a
      >
    </p>
  </section>
</template>

<style src="../styles/support-pages.css"></style>
