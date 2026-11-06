<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { animate, stagger } from 'animejs'
import { prefs, regionById } from '../data/regions.js'
import { spots, CATS, mapUrlOf } from '../data/spots.js'
import { wishIds, toggleWish } from '../wishlist.js'
import { reduceMotion } from '../motion.js'

const router = useRouter()

const listed = spots.filter(s => wishIds.has(s.id))
const groups = [...new Set(listed.map(s => s.pref))].map(code => ({
	pref: prefs[code],
	region: regionById[prefs[code].region],
	list: listed.filter(s => s.pref === code),
}))
const prefCount = computed(() => new Set(listed.filter(s => wishIds.has(s.id)).map(s => s.pref)).size)

function goBack() {
	if (router.options.history.state.back) router.back()
	else router.push('/')
}

const root = ref()
onMounted(() => {
	if (reduceMotion) return
	animate(root.value.querySelectorAll('.row'), { opacity: [0, 1], y: [10, 0], duration: 520, delay: stagger(40), ease: 'out(3)' })
})
</script>

<template>
	<main ref="root" class="wishlist">
		<button class="back" @click="goBack"><span aria-hidden="true">←</span>返回</button>
		<header class="head">
			<h1 class="title mincho">想去清單</h1>
			<p v-if="wishIds.size" class="count">{{ wishIds.size }} 處景點・{{ prefCount }} 個縣</p>
		</header>

		<template v-if="listed.length">
			<section v-for="g in groups" :key="g.pref.code" class="group" :style="{ '--rc': g.region.color }">
				<h2 class="pref">
					<RouterLink :to="`/${g.region.id}/${g.pref.slug}`">
						<span class="chip" />{{ g.pref.zh }}<small v-if="g.pref.zh !== g.region.name">{{ g.region.name }}</small>
					</RouterLink>
				</h2>
				<ol>
					<li v-for="s in g.list" :key="s.id" class="row" :class="{ removed: !wishIds.has(s.id) }">
						<RouterLink :to="`/spot/${s.id}`" class="main">
							<span class="mark mincho" aria-hidden="true">{{ s.cat }}</span>
							<span class="text">
								<span class="name">{{ s.name }}<small v-if="s.ja !== s.name" lang="ja">{{ s.ja }}</small></span>
								<span class="sum">{{ s.summary }}</span>
								<span class="meta">{{ CATS[s.cat] }}・建議停留 {{ s.stay }}</span>
							</span>
						</RouterLink>
						<div class="actions">
							<a :href="mapUrlOf(s)" class="act" target="_blank" rel="noopener" :aria-label="`在 Google 地圖開啟 ${s.name}（另開新頁）`">Google 地圖<span aria-hidden="true">↗</span></a>
							<button class="act" @click="toggleWish(s.id)">{{ wishIds.has(s.id) ? `移除` : `加回清單` }}<span class="sr-only">：{{ s.name }}</span></button>
						</div>
					</li>
				</ol>
			</section>
		</template>
		<div v-else class="empty">
			<p>還沒有想去的景點。</p>
			<p>在景點頁或地圖旁的列表按下書籤圖示，就會收進這裡。</p>
			<RouterLink to="/" class="to-map">到地圖上找景點 →</RouterLink>
		</div>

		<p class="note">清單存在這個瀏覽器裡：換手機或電腦就看不到，清除瀏覽資料也會消失。</p>
	</main>
</template>

<style scoped>
.wishlist {
	max-width: 820px;
	margin: 0 auto;
	padding: calc(var(--header-h) + 20px) clamp(16px, 5vw, 40px) 64px;
}

.back {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	min-height: 44px;
	padding: 0 18px 0 14px;
	border-radius: 999px;
	border: 1.5px solid var(--line-strong);
	font-size: 16px;
	font-weight: 700;
	transition: background-color 0.2s, color 0.2s, border-color 0.2s;
}

.back:hover {
	background: var(--ink);
	border-color: var(--ink);
	color: var(--paper);
}

.head {
	display: flex;
	flex-wrap: wrap;
	align-items: baseline;
	gap: 4px 16px;
	margin: 20px 0 8px;
}

.title {
	font-size: clamp(34px, 5vw, 46px);
	font-weight: 700;
	line-height: 1.25;
	letter-spacing: 0.06em;
}

.count {
	font-size: 16px;
	color: var(--ink-2);
}

.group {
	margin-top: 28px;
}

.pref {
	padding-bottom: 6px;
	border-bottom: 2px solid var(--ink);
	font-size: 19px;
}

.pref a {
	display: inline-flex;
	align-items: center;
	gap: 10px;
	min-height: 44px;
}

.pref a:hover {
	color: var(--shu);
}

.pref small {
	font-size: 15px;
	font-weight: 500;
	color: var(--ink-3);
}

.chip {
	width: 12px;
	height: 12px;
	border-radius: 2px;
	background: var(--rc);
}

.row {
	display: grid;
	grid-template-columns: 1fr auto;
	align-items: center;
	gap: 8px 16px;
	padding: 14px 0;
	border-bottom: 1px dashed var(--line);
}

.main {
	display: grid;
	grid-template-columns: 34px 1fr;
	gap: 14px;
	min-width: 0;
	border-radius: 6px;
	transition: opacity 0.25s;
}

.main:hover .name {
	color: var(--shu);
}

.removed .main {
	opacity: 0.45;
}

.removed .name {
	text-decoration: line-through;
}

.mark {
	display: grid;
	place-items: center;
	width: 34px;
	height: 34px;
	border-radius: 5px;
	background: var(--shu);
	color: var(--shu-ink);
	font-size: 19px;
	font-weight: 800;
	rotate: -6deg;
	box-shadow: inset 0 0 0 2.5px var(--shu), inset 0 0 0 3.5px color-mix(in srgb, var(--shu-ink) 75%, transparent);
}

.text {
	display: flex;
	flex-direction: column;
	min-width: 0;
}

.name {
	font-size: 18px;
	font-weight: 700;
	line-height: 1.45;
	transition: color 0.2s;
}

.name small {
	margin-left: 8px;
	font-size: 15px;
	font-weight: 500;
	color: var(--ink-3);
}

.sum {
	margin: 2px 0 4px;
	font-size: 15px;
	line-height: 1.7;
	color: var(--ink-2);
}

.meta {
	font-size: 15px;
	color: var(--ink-3);
}

.actions {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.act {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	min-height: 44px;
	padding: 0 14px;
	border-radius: 999px;
	border: 1.5px solid var(--line-strong);
	font-size: 15px;
	font-weight: 700;
	white-space: nowrap;
	transition: background-color 0.2s, color 0.2s, border-color 0.2s;
}

.act:hover {
	background: var(--ink);
	border-color: var(--ink);
	color: var(--paper);
}

.empty {
	margin-top: 32px;
	font-size: 17px;
}

.to-map {
	display: inline-flex;
	align-items: center;
	min-height: 46px;
	margin-top: 18px;
	padding: 0 20px;
	border-radius: 999px;
	background: var(--ink);
	color: var(--paper);
	font-size: 16px;
	font-weight: 700;
	transition: background-color 0.25s;
}

.to-map:hover {
	background: var(--shu);
}

.note {
	margin-top: 36px;
	font-size: 15px;
	color: var(--ink-3);
}

@media (max-width: 760px) {
	.row {
		grid-template-columns: 1fr;
	}

	.actions {
		flex-direction: row;
		padding-left: 48px;
	}
}
</style>
