<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { animate, createScope, createTimeline, onScroll, splitText, stagger, spring, utils } from 'animejs'
import PrefOutline from '../components/PrefOutline.vue'
import WishButton from '../components/WishButton.vue'
import { prefs, regionById } from '../data/regions.js'
import { spotById, spotsOfRegion, detailOf, mapUrlOf, CATS } from '../data/spots.js'
import { reduceMotion } from '../motion.js'

const route = useRoute()
const router = useRouter()
const spot = spotById[route.params.id]
if (!spot) router.replace('/')

const region = spot && regionById[spot.region]
const pref = spot && prefs[spot.pref]
const detail = spot && detailOf(spot)
const mapUrl = spot && mapUrlOf(spot)

const facts = spot ? [
	{ k: '最佳季節', v: detail.season },
	{ k: '建議停留', v: spot.stay },
	{ k: '交通', v: detail.access },
	{ k: '小提醒', v: detail.tip },
] : []

const nearby = computed(() => {
	if (!spot) return []
	const d = s => Math.hypot((s.lon - spot.lon) * Math.cos(spot.lat * Math.PI / 180), s.lat - spot.lat)
	return spotsOfRegion(spot.region)
		.filter(s => s !== spot)
		.sort((a, b) => d(a) - d(b))
		.slice(0, 3)
		.map(s => ({ ...s, km: Math.round(d(s) * 111) }))
})

const root = ref()
let scope = null

onMounted(() => {
	if (!spot || reduceMotion) return
	scope = createScope({ root: root.value }).add(() => {
		const title = splitText('.title-ja', { chars: true })
		utils.set([title.chars, '.seal', '.hero [data-fade]', '.facts > div', '.reveal'], { opacity: 0 })
		createTimeline({ defaults: { ease: 'out(3)' } })
			.add('.band', { scaleY: [0, 1], duration: 900, ease: 'inOut(3)' }, 0)
			.add(title.chars, { opacity: [0, 1], y: ['-0.5em', 0], duration: 900, delay: stagger(65) }, 150)
			.add('.seal', { opacity: [0, 1], scale: [1.8, 1], rotate: [-18, -6], ease: spring({ bounce: 0.4, duration: 600 }) }, '-=500')
			.add('.hero [data-fade]', { opacity: [0, 1], y: [16, 0], duration: 700, delay: stagger(80) }, '-=600')
			.add('.facts > div', { opacity: [0, 1], y: [14, 0], duration: 600, delay: stagger(70) }, '-=500')

		utils.$('.reveal').forEach(el => {
			animate(el, {
				opacity: [0, 1],
				y: [24, 0],
				duration: 900,
				ease: 'out(3)',
				autoplay: onScroll({ target: el, enter: 'bottom-=40 top', repeat: false }),
			})
		})
	})
})

onBeforeUnmount(() => scope?.revert())
</script>

<template>
	<article v-if="spot" ref="root" class="spot" :style="{ '--rc': region.color }">
		<div class="band" aria-hidden="true" />
		<nav class="crumbs">
			<RouterLink :to="`/${region.id}/${pref.slug}`" class="back"><span aria-hidden="true">←</span>回到{{ pref.zh }}</RouterLink>
			<RouterLink to="/">全日本</RouterLink><span>／</span>
			<RouterLink :to="`/${region.id}`">{{ region.name }}</RouterLink>
		</nav>

		<header class="hero">
			<h1 class="title-ja mincho" lang="ja">{{ spot.ja }}</h1>
			<div class="hero-side">
				<h2 class="title-zh" data-fade>{{ spot.name }}</h2>
				<p class="where" data-fade>{{ pref.zh }}・{{ region.name }}<span class="latin">{{ pref.romaji }}</span></p>
				<p class="summary" data-fade>{{ spot.summary }}</p>
				<WishButton :spot="spot" labelled class="hero-wish" data-fade />
			</div>
			<span class="seal mincho" :title="CATS[spot.cat]">{{ spot.cat }}<small>{{ CATS[spot.cat] }}</small></span>
		</header>

		<dl class="facts">
			<div v-for="f in facts" :key="f.k">
				<dt>{{ f.k }}</dt>
				<dd>{{ f.v }}</dd>
				<a v-if="f.k === '交通'" :href="mapUrl" class="gmap" target="_blank" rel="noopener" aria-label="在 Google 地圖開啟（另開新頁）">
					<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22 C7 15 4.5 12 4.5 8.8 A7.5 7.5 0 0 1 19.5 8.8 C19.5 12 17 15 12 22Z" /><circle cx="12" cy="9" r="2.6" /></svg>
					Google 地圖<span aria-hidden="true">↗</span>
				</a>
			</div>
		</dl>

		<section class="body">
			<p v-for="(p, i) in detail.body" :key="i" class="reveal" :class="{ lead: i === 0 }">{{ p }}</p>
		</section>

		<section class="locate reveal">
			<div class="map-box">
				<PrefOutline :code="spot.pref" :lon="spot.lon" :lat="spot.lat" />
			</div>
			<div class="locate-text">
				<p class="kicker">Location</p>
				<p class="pref-name mincho" lang="ja">{{ pref.ja }}</p>
				<RouterLink :to="{ path: `/${region.id}/${pref.slug}`, query: { spot: spot.id } }" class="to-map">在立體地圖上查看 →</RouterLink>
			</div>
		</section>

		<section v-if="nearby.length" class="nearby reveal">
			<h3 class="section"><span>附近景點</span><span class="latin">Nearby</span></h3>
			<ol>
				<li v-for="s in nearby" :key="s.id">
					<RouterLink :to="`/spot/${s.id}`" class="near-card">
						<span class="near-mark mincho">{{ s.cat }}</span>
						<span class="near-name">{{ s.name }}</span>
						<span class="near-meta">{{ prefs[s.pref].zh }}・直線約 {{ s.km }} km</span>
					</RouterLink>
				</li>
			</ol>
		</section>

		<p class="disclaimer">本頁為一般性介紹，營業時間、票價與交通資訊可能變動，出發前請以官方公告為準。</p>
	</article>
</template>

<style scoped>
.spot {
	position: relative;
	max-width: 1080px;
	margin: 0 auto;
	padding: calc(var(--header-h) + 28px) clamp(16px, 5vw, 64px) 80px;
}

.spot::before {
	content: '';
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	height: calc(var(--header-h) + 12px);
	background: linear-gradient(var(--paper) 55%, transparent);
	z-index: 15;
	pointer-events: none;
}

.band {
	position: fixed;
	top: 0;
	bottom: 0;
	left: 0;
	width: 6px;
	background: var(--rc);
	transform-origin: top;
	z-index: 16;
}

.crumbs {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	font-size: 16px;
	color: var(--ink-3);
}

.crumbs {
	align-items: center;
}

.crumbs a {
	display: inline-flex;
	align-items: center;
	min-height: 44px;
	color: var(--ink-2);
	text-decoration: underline;
	text-decoration-color: var(--line-strong);
	text-underline-offset: 5px;
	transition: color 0.2s, text-decoration-color 0.2s;
}

.crumbs a:hover {
	color: var(--shu);
	text-decoration-color: var(--shu);
}

.crumbs a.back {
	gap: 8px;
	margin-right: 8px;
	padding: 0 18px 0 14px;
	border-radius: 999px;
	border: 1.5px solid var(--line-strong);
	color: var(--ink);
	font-weight: 700;
	text-decoration: none;
	transition: background-color 0.2s, color 0.2s, border-color 0.2s;
}

.crumbs a.back:hover {
	background: var(--ink);
	border-color: var(--ink);
	color: var(--paper);
}

.hero {
	position: relative;
	display: grid;
	grid-template-columns: auto 1fr;
	gap: clamp(24px, 5vw, 64px);
	align-items: start;
	padding: 40px 0 48px;
}

.title-ja {
	writing-mode: vertical-rl;
	font-size: clamp(52px, 5.6vw, 76px);
	font-weight: 800;
	line-height: 1.05;
	letter-spacing: 0.06em;
	max-height: 420px;
}

.hero-side {
	display: flex;
	flex-direction: column;
	gap: 14px;
	padding-top: 10px;
	max-width: 620px;
}

.title-zh {
	font-size: clamp(28px, 3.4vw, 40px);
	font-weight: 700;
	line-height: 1.3;
}

.where {
	display: flex;
	align-items: baseline;
	gap: 12px;
	font-size: 16px;
	color: var(--ink-2);
}

.where .latin {
	font-style: italic;
	color: var(--ink-3);
}

.summary {
	margin-top: 8px;
	padding-top: 18px;
	border-top: 1px solid var(--line);
	font-size: clamp(17px, 1.8vw, 20px);
	line-height: 1.9;
	font-weight: 500;
}

.hero-wish {
	align-self: flex-start;
}

.seal {
	position: absolute;
	right: 4%;
	bottom: 36px;
	display: grid;
	place-items: center;
	width: 78px;
	height: 78px;
	border: 3px solid var(--shu);
	border-radius: 6px;
	color: var(--shu);
	font-size: 36px;
	font-weight: 800;
	line-height: 1;
	transform: rotate(-6deg);
	box-shadow: inset 0 0 0 2px var(--paper), inset 0 0 0 3.5px var(--shu);
}

.seal small {
	font-size: 12px;
	letter-spacing: 0.2em;
	margin-top: -14px;
}

.facts {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	border-top: 2px solid var(--ink);
	border-bottom: 1px solid var(--line);
}

.facts > div {
	padding: 18px 20px 20px 0;
}

.facts > div + div {
	padding-left: 20px;
	border-left: 1px solid var(--line);
}

.facts dt {
	font-size: 15px;
	font-weight: 700;
	letter-spacing: 0.24em;
	color: var(--ink-3);
	margin-bottom: 6px;
}

.facts dd {
	font-size: 16px;
	line-height: 1.75;
}

.gmap {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	min-height: 44px;
	margin-top: 10px;
	padding: 0 14px 0 10px;
	border-radius: 999px;
	border: 1.5px solid var(--line-strong);
	font-size: 15px;
	font-weight: 700;
	white-space: nowrap;
	transition: background-color 0.2s, color 0.2s, border-color 0.2s;
}

.gmap svg {
	width: 20px;
	height: 20px;
	fill: none;
	stroke: var(--shu);
	stroke-width: 2;
	transition: stroke 0.2s;
}

.gmap:hover {
	background: var(--ink);
	border-color: var(--ink);
	color: var(--paper);
}

.gmap:hover svg {
	stroke: var(--paper);
}

.body {
	max-width: 680px;
	margin: 56px auto 0;
	display: flex;
	flex-direction: column;
	gap: 22px;
	font-size: 18px;
	line-height: 2.05;
	text-align: justify;
}

.body .lead::first-letter {
	float: left;
	font-family: var(--font-mincho);
	font-size: 3.4em;
	line-height: 1;
	font-weight: 800;
	margin: 0.08em 0.12em 0 0;
	color: var(--rc);
}

.locate {
	display: grid;
	grid-template-columns: minmax(180px, 280px) 1fr;
	gap: clamp(24px, 5vw, 56px);
	align-items: center;
	max-width: 760px;
	margin: 72px auto 0;
	padding: 32px;
	border-radius: 12px;
	background: var(--card);
	border: 1px solid var(--card-edge);
	box-shadow: var(--shadow-card);
}

.locate-text {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.pref-name {
	font-size: 34px;
	font-weight: 800;
	letter-spacing: 0.1em;
}

.to-map {
	margin-top: 10px;
	align-self: flex-start;
	display: inline-flex;
	align-items: center;
	min-height: 46px;
	padding: 0 20px;
	border-radius: 999px;
	background: var(--ink);
	color: var(--paper);
	font-size: 16px;
	font-weight: 500;
	transition: background-color 0.25s, transform 0.35s var(--ease-out);
}

.to-map:hover {
	background: var(--shu);
	transform: translateX(4px);
}

.nearby {
	max-width: 760px;
	margin: 72px auto 0;
}

.section {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	padding-bottom: 10px;
	border-bottom: 1px solid var(--line);
	font-size: 16px;
	letter-spacing: 0.22em;
}

.section .latin {
	font-size: 15px;
	font-weight: 500;
	font-style: italic;
	color: var(--ink-3);
}

.nearby ol {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 14px;
	margin-top: 16px;
}

.near-card {
	position: relative;
	display: flex;
	flex-direction: column;
	gap: 4px;
	height: 100%;
	padding: 18px 18px 16px;
	border-radius: 8px;
	border: 1px solid var(--line);
	overflow: hidden;
	transition: border-color 0.25s, transform 0.4s var(--ease-out), box-shadow 0.4s;
}

.near-mark {
	position: absolute;
	right: 10px;
	top: -6px;
	font-size: 64px;
	font-weight: 800;
	line-height: 1;
	color: var(--rc);
	opacity: 0.16;
	transition: opacity 0.3s, transform 0.5s var(--ease-out);
}

.near-name {
	font-size: 18px;
	font-weight: 700;
}

.near-meta {
	font-size: 15px;
	color: var(--ink-3);
}

.near-card:hover {
	border-color: var(--rc);
	transform: translateY(-4px);
	box-shadow: var(--shadow-card);
}

.near-card:hover .near-mark {
	opacity: 0.32;
	transform: rotate(-8deg) scale(1.08);
}

.disclaimer {
	max-width: 760px;
	margin: 64px auto 0;
	font-size: 15px;
	color: var(--ink-3);
	text-align: center;
}

@media (max-width: 760px) {
	.hero {
		gap: 18px;
		padding: 18px 0 28px;
	}

	.title-ja {
		font-size: 40px;
		max-height: 300px;
	}

	.seal {
		right: 0;
		top: 18px;
		bottom: auto;
		width: 56px;
		height: 56px;
		font-size: 25px;
	}

	.seal small {
		font-size: 10px;
		letter-spacing: 0.1em;
		margin-top: -10px;
	}

	.facts {
		grid-template-columns: 1fr 1fr;
	}

	.facts > div:nth-child(n + 3) {
		grid-column: 1 / -1;
		padding-right: 0;
		padding-left: 0;
		border-left: 0;
		border-top: 1px solid var(--line);
	}

	.body {
		font-size: 17px;
	}

	.locate {
		grid-template-columns: 1fr;
		padding: 24px;
	}

	.map-box {
		max-width: 220px;
	}

	.nearby ol {
		grid-template-columns: 1fr;
	}
}
</style>
