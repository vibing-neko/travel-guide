<script setup>
import { computed, nextTick, onActivated, onBeforeUnmount, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { animate, createLayout, createTimeline, splitText, stagger, utils } from 'animejs'
import { regions, prefs, regionOf } from '../data/regions.js'
import { spots, spotsOfRegion, spotsOfPref, CATS, FILTERS, matchFilter } from '../data/spots.js'
import { reduceMotion } from '../motion.js'
import WishButton from './WishButton.vue'

const props = defineProps({ view: Object, hover: Object, filter: String })
const emit = defineEmits(['hover', 'filter'])

const key = computed(() => [props.view.level, props.view.region?.id, props.view.pref?.code].join('/'))
const prefSpots = computed(() => props.view.pref ? spotsOfPref(props.view.pref.code) : [])
const hoverRegion = computed(() => props.hover.region ?? (props.hover.code ? regionOf(props.hover.code).id : null))
const topNames = code => spotsOfPref(code).slice(0, 3).map(s => s.name).join('、')

const up = computed(() => {
	const v = props.view
	if (v.level === 'pref') return { to: '/' + v.region.id, name: v.region.name }
	return { to: '/', name: '全日本' }
})

const filters = computed(() => FILTERS
	.map(f => ({ ...f, count: prefSpots.value.filter(s => matchFilter(s, f.id)).length }))
	.filter(f => f.count || f.id === props.filter))
const shown = computed(() => prefSpots.value.filter(s => matchFilter(s, props.filter)).length)

const shortQuery = matchMedia('(max-width: 760px), (max-height: 760px)')
const short = ref(shortQuery.matches)
const onShortChange = e => { short.value = e.matches }
shortQuery.addEventListener('change', onShortChange)
onBeforeUnmount(() => shortQuery.removeEventListener('change', onShortChange))
const compact = computed(() => short.value || !!props.view.pref)

const listEl = ref()

const scrollEl = ref()
let scrollTop = 0
onActivated(() => {
	if (scrollEl.value) scrollEl.value.scrollTop = scrollTop
})
const layouts = new WeakMap()

async function setFilter(id) {
	if (id === props.filter) return
	const el = listEl.value
	let layout = null
	if (el && !reduceMotion) {
		layout = layouts.get(el)
		if (!layout) {
			layout = createLayout(el, { children: 'li', duration: 520, ease: 'out(3)', enterFrom: { opacity: 0, transform: 'translateY(10px)' }, leaveTo: { opacity: 0 } })
			layouts.set(el, layout)
		}
		layout.record()
	}
	emit('filter', id)
	await nextTick()
	layout?.animate()
}

const splitters = new WeakMap()
let first = true

function restoreFocus(el, restore) {
	const lost = !document.activeElement || document.activeElement === document.body
	if (restore && lost) el.querySelector('.title')?.focus({ preventScroll: true })
}

function onBeforeEnter(el) {
	utils.set(el.querySelectorAll('[data-split], [data-fade], [data-item]'), { opacity: 0 })
}

function onEnter(el, done) {
	el.parentElement.scrollTop = scrollTop = 0
	const restore = !first
	first = false
	const all = el.querySelectorAll('[data-split], [data-fade], [data-item]')
	if (reduceMotion) {
		utils.set(all, { opacity: 1 })
		restoreFocus(el, restore)
		return done()
	}
	const split = [...el.querySelectorAll('[data-split]')].map(h => splitText(h, { chars: true }))
	splitters.set(el, split)
	const chars = split.flatMap(s => s.chars)
	utils.set(chars, { opacity: 0 })
	utils.set(el.querySelectorAll('[data-split]'), { opacity: 1 })
	const items = el.querySelectorAll('[data-item]')
	createTimeline({
		defaults: { ease: 'out(3)' },
		onComplete: () => {
			items.forEach(i => { i.style.transform = '' })
			restoreFocus(el, restore)
			done()
		},
	})
		.add(chars, { opacity: [0, 1], y: ['-0.35em', 0], duration: 800, delay: stagger(70) }, 0)
		.add(el.querySelectorAll('[data-fade]'), { opacity: [0, 1], y: [10, 0], duration: 600, delay: stagger(60) }, 120)
		.add(items, { opacity: [0, 1], x: [-12, 0], duration: 520, delay: stagger(32) }, 260)
}

function onLeave(el, done) {
	const finish = () => {
		splitters.get(el)?.forEach(s => s.revert())
		done()
	}
	if (reduceMotion) return finish()
	animate(el, { opacity: 0, y: -8, duration: 200, ease: 'in(2)', onComplete: finish })
}
</script>

<template>
	<div ref="scrollEl" class="scroll" @scroll.passive="scrollTop = $event.target.scrollTop">
		<Transition mode="out-in" :css="false" appear @before-enter="onBeforeEnter" @enter="onEnter" @leave="onLeave">
			<section v-if="view.level === 'japan'" :key="key" class="pane" :class="{ compact }">
				<header class="head">
					<h1 class="title mincho" tabindex="-1" data-split>旅帖</h1>
					<div class="side">
						<p class="kicker" data-fade>Vol.01 — Japan</p>
						<p class="lede mincho" data-fade>把日本攤開在桌上，<br />一個地方一個地方慢慢讀。</p>
						<p class="meta" data-fade>
							<span><b class="latin">9</b>地方</span>
							<span><b class="latin">47</b>都道府縣</span>
							<span><b class="latin">{{ spots.length }}</b>景點</span>
						</p>
					</div>
				</header>
				<p class="hint" data-fade>點一下地圖上的地方，或從下方列表選擇</p>
				<h2 class="section" data-fade><span>地方</span><span class="latin">Regions</span></h2>
				<ol class="regions">
					<li v-for="r in regions" :key="r.id" data-item>
						<RouterLink
							:to="`/${r.id}`"
							class="region-row"
							:class="{ hot: hoverRegion === r.id }"
							:style="{ '--rc': r.color }"
							@mouseenter="emit('hover', { region: r.id })"
							@mouseleave="emit('hover', {})"
							@focus="emit('hover', { region: r.id })"
							@blur="emit('hover', {})"
						>
							<span class="chip" />
							<span class="r-name mincho">{{ r.name }}</span>
							<i class="r-ro latin">{{ r.romaji }}</i>
							<span class="r-count"><b class="latin">{{ spotsOfRegion(r.id).length }}</b>處</span>
						</RouterLink>
					</li>
				</ol>
			</section>

			<section v-else :key="key" class="pane" :class="{ compact }" :style="{ '--rc': view.region.color }">
				<RouterLink :to="up.to" class="back" data-fade><span aria-hidden="true">←</span>回到{{ up.name }}</RouterLink>
				<header class="head">
					<h1 class="title mincho" lang="ja" tabindex="-1" data-split>{{ view.pref ? view.pref.ja : view.region.ja }}</h1>
					<div class="side">
						<p class="kicker" data-fade>{{ view.pref ? view.pref.romaji : view.region.romaji }}</p>
						<p v-if="view.pref" class="color-tag" data-fade><span class="chip" />{{ view.region.name }}・{{ prefSpots.length }} 處景點</p>
						<template v-else-if="!compact">
							<p class="color-tag" data-fade><span class="chip" />傳統色・{{ view.region.colorName }}</p>
							<p class="intro" data-fade>{{ view.region.intro }}</p>
						</template>
					</div>
				</header>

				<template v-if="view.level === 'region'">
					<h2 class="section" data-fade><span>都道府縣</span><span class="latin">Prefectures</span></h2>
					<p class="hint" data-fade>點一下縣名，地圖上就會標出那個縣的景點</p>
					<ol class="pref-list">
						<li v-for="code in view.region.prefs" :key="code" data-item>
							<RouterLink
								:to="`/${view.region.id}/${prefs[code].slug}`"
								class="pref-row"
								:class="{ hot: hover.code === code }"
								@mouseenter="emit('hover', { code })"
								@mouseleave="emit('hover', {})"
								@focus="emit('hover', { code })"
								@blur="emit('hover', {})"
							>
								<span class="p-ja mincho" lang="ja">{{ prefs[code].ja }}</span>
								<span class="s-main">
									<span class="s-name">{{ prefs[code].zh }}</span>
									<span class="s-meta">{{ topNames(code) }}</span>
								</span>
								<span class="r-count"><b class="latin">{{ spotsOfPref(code).length }}</b>處</span>
							</RouterLink>
						</li>
					</ol>
					<p v-if="compact" class="intro after">{{ view.region.intro }}</p>
				</template>

				<template v-else>
					<h2 class="sr-only">景點</h2>
					<div class="filters" role="radiogroup" aria-label="景點分類" data-fade>
						<button
							v-for="f in filters"
							:key="f.id"
							class="filter"
							:class="{ on: filter === f.id }"
							role="radio"
							:aria-checked="filter === f.id"
							@click="setFilter(f.id)"
						>
							{{ f.label }}<small class="latin">{{ f.count }}</small>
						</button>
					</div>
					<ol ref="listEl" class="spot-cards">
						<li v-for="s in prefSpots" v-show="matchFilter(s, filter)" :key="s.id" data-item>
							<RouterLink
								:to="`/spot/${s.id}`"
								class="spot-card"
								:class="{ hot: hover.spot === s.id }"
								@mouseenter="emit('hover', { spot: s.id })"
								@mouseleave="emit('hover', {})"
								@focus="emit('hover', { spot: s.id })"
								@blur="emit('hover', {})"
							>
								<span class="s-mark mincho">{{ s.cat }}</span>
								<span class="s-main">
									<span class="s-name">{{ s.name }}<small lang="ja">{{ s.ja }}</small></span>
									<span class="s-sum">{{ s.summary }}</span>
									<span class="s-meta">{{ CATS[s.cat] }}・建議停留 {{ s.stay }}</span>
								</span>
							</RouterLink>
							<WishButton :spot="s" class="card-wish" />
						</li>
					</ol>
					<p v-if="!shown" class="empty">這裡沒有這個分類的景點，<button class="link" @click="setFilter('all')">顯示全部</button></p>
				</template>
			</section>
		</Transition>
	</div>
</template>

<style scoped>
.scroll {
	height: 100%;
	overflow-y: auto;
	overscroll-behavior: contain;
	scrollbar-width: thin;
	scrollbar-color: var(--line-strong) transparent;
}

.pane {
	padding: 24px 28px 32px;
}

.back {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	min-height: 44px;
	padding: 0 18px 0 14px;
	margin-bottom: 20px;
	border-radius: 999px;
	border: 1.5px solid var(--line-strong);
	font-size: 16px;
	font-weight: 700;
	transition: background-color 0.2s, color 0.2s, border-color 0.2s;
}

.back span {
	font-size: 18px;
}

.back:hover {
	background: var(--ink);
	border-color: var(--ink);
	color: var(--paper);
}

.head {
	display: flex;
	gap: 22px;
	align-items: flex-start;
	margin-bottom: 24px;
}

.title {
	writing-mode: vertical-rl;
	font-size: clamp(48px, 5vw, 66px);
	font-weight: 800;
	line-height: 1.02;
	letter-spacing: 0.06em;
	flex: none;
	position: relative;
	padding-left: 14px;
}

.title:focus {
	outline: none;
}

.title::after {
	content: '';
	position: absolute;
	left: 0;
	top: 6px;
	bottom: 6px;
	width: 4px;
	border-radius: 2px;
	background: var(--rc, var(--shu));
}

.side {
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding-top: 6px;
	min-width: 0;
}

.lede {
	font-size: 19px;
	line-height: 1.8;
	font-weight: 500;
}

.meta {
	display: flex;
	flex-wrap: wrap;
	gap: 4px 16px;
	font-size: 15px;
	color: var(--ink-2);
}

.meta b {
	font-size: 24px;
	font-weight: 600;
	margin-right: 3px;
	color: var(--ink);
}

.color-tag {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 15px;
	color: var(--ink-2);
}

.chip {
	width: 12px;
	height: 12px;
	border-radius: 2px;
	background: var(--rc);
	flex: none;
}

.intro {
	font-size: 16px;
	line-height: 1.9;
	color: var(--ink-2);
	text-align: justify;
}

.section {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 12px;
	padding-bottom: 8px;
	margin: 8px 0 8px;
	border-bottom: 1px solid var(--line);
	font-size: 15px;
	font-weight: 700;
	letter-spacing: 0.18em;
}

.section .latin {
	font-size: 15px;
	font-weight: 500;
	font-style: italic;
	letter-spacing: 0.08em;
	color: var(--ink-3);
}

.region-row {
	display: grid;
	grid-template-columns: 5px 104px 1fr auto;
	align-items: center;
	gap: 14px;
	min-height: 60px;
	padding: 8px 8px 8px 0;
	border-bottom: 1px dashed var(--line);
	transition: background-color 0.25s, padding 0.35s var(--ease-out);
}

.region-row .chip {
	width: 5px;
	height: 30px;
}

.r-name {
	white-space: nowrap;
	font-size: 23px;
	font-weight: 700;
	letter-spacing: 0.06em;
}

.r-ro {
	font-size: 15px;
	color: var(--ink-3);
}

.r-count {
	font-size: 15px;
	color: var(--ink-2);
}

.r-count b {
	font-size: 22px;
	font-weight: 600;
	margin-right: 2px;
	color: var(--shu);
}

.region-row:hover,
.region-row.hot {
	background: var(--hover);
	padding-left: 8px;
}

.pref-row {
	display: grid;
	grid-template-columns: 76px 1fr auto;
	align-items: center;
	gap: 14px;
	min-height: 68px;
	padding: 8px 8px 8px 0;
	border-bottom: 1px dashed var(--line);
	transition: background-color 0.25s, padding 0.35s var(--ease-out);
}

.p-ja {
	white-space: nowrap;
	font-size: 21px;
	font-weight: 700;
	letter-spacing: 0.04em;
}

.pref-row .s-meta {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.pref-row:hover,
.pref-row.hot {
	background: var(--hover);
	padding-left: 8px;
}

.filters {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	margin: 12px 0 10px;
}

.filter {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	min-height: 44px;
	padding: 0 14px;
	border-radius: 6px;
	background: var(--hover);
	font-size: 15px;
	font-weight: 500;
	transition: background-color 0.2s, color 0.2s;
}

.filter small {
	font-size: 15px;
	font-family: var(--font-sans);
	color: var(--ink-3);
}

.filter:hover {
	background: var(--line);
}

.filter.on {
	background: var(--shu);
	color: var(--shu-ink);
	font-weight: 700;
}

.filter.on small {
	color: inherit;
	opacity: 0.85;
}

.s-mark {
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
	transition: rotate 0.4s var(--ease-out), background-color 0.25s, color 0.25s, box-shadow 0.25s;
}

.s-main {
	display: flex;
	flex-direction: column;
	min-width: 0;
}

.s-name {
	font-size: 17px;
	font-weight: 700;
	line-height: 1.45;
}

.s-meta {
	font-size: 15px;
	color: var(--ink-3);
}

.spot-card:hover .s-mark,
.spot-card.hot .s-mark {
	rotate: 0deg;
	background: var(--ink);
	color: var(--paper);
	box-shadow: inset 0 0 0 2.5px var(--ink), inset 0 0 0 3.5px color-mix(in srgb, var(--paper) 70%, transparent);
}

.spot-cards {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.spot-card {
	display: grid;
	grid-template-columns: 34px 1fr;
	gap: 14px;
	padding: 16px 16px 16px 14px;
	border-radius: 8px;
	border: 1.5px solid var(--line);
	background: color-mix(in srgb, var(--paper) 50%, transparent);
	transition: border-color 0.25s, box-shadow 0.35s;
}

.spot-card .s-name {
	display: flex;
	align-items: baseline;
	gap: 8px;
	flex-wrap: wrap;
	padding-right: 30px;
	font-size: 18px;
}

.spot-cards li {
	position: relative;
}

.card-wish {
	position: absolute;
	top: 6px;
	right: 6px;
}

.spot-card .s-name small {
	font-size: 15px;
	font-weight: 500;
	color: var(--ink-3);
}

.s-sum {
	margin: 4px 0 6px;
	font-size: 15px;
	line-height: 1.8;
	color: var(--ink-2);
}

.spot-card:hover,
.spot-card.hot {
	border-color: var(--rc);
	box-shadow: inset 4px 0 0 var(--rc);
}

.pane.compact {
	padding-top: 14px;
}

.compact .back {
	float: right;
	margin: 0 0 6px 10px;
	padding: 0 14px 0 10px;
	font-size: 15px;
}

.compact .head {
	flex-direction: column;
	gap: 2px;
	margin-bottom: 10px;
}

.compact .title {
	writing-mode: horizontal-tb;
	font-size: 32px;
	line-height: 1.25;
	padding-left: 12px;
}

.compact .title::after {
	top: 4px;
	bottom: 4px;
}

.compact .side {
	gap: 2px;
	padding-top: 0;
}

.compact .kicker,
.compact .lede,
.compact .section {
	display: none;
}

.compact .meta b {
	font-size: 20px;
}

.compact .hint,
.compact .section + .hint {
	margin: 0 0 4px;
}

.compact .filters {
	margin-top: 0;
}

.intro.after {
	margin-top: 16px;
}

.empty {
	margin-top: 14px;
	font-size: 15px;
	color: var(--ink-2);
}

.link {
	color: var(--shu);
	font-weight: 700;
	text-decoration: underline;
	text-underline-offset: 3px;
}

.section + .hint {
	margin: 4px 0 0;
}

.hint {
	margin: -6px 0 18px;
	font-size: 15px;
	color: var(--ink-2);
}

@media (max-width: 760px) {
	.pane {
		padding: 18px 18px 24px;
	}
}

@media (max-width: 760px), (max-height: 480px) {
	.filters {
		flex-wrap: nowrap;
		overflow-x: auto;
		margin-inline: -18px;
		padding-inline: 18px;
		scrollbar-width: none;
		overscroll-behavior-x: contain;
	}

	.filter {
		flex: none;
	}
}
</style>
