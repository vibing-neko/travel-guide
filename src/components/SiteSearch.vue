<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { regions, regionById, prefs } from '../data/regions.js'
import { spots, spotsOfRegion, spotsOfPref, CATS } from '../data/spots.js'

const LIMIT = 40

const router = useRouter()
const dialogEl = ref()
const query = ref('')

const norm = s => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/臺/g, '台').replace(/東京都/g, '東京 都').toLowerCase()

let index = null
function buildIndex() {
	const places = [
		...regions.filter(r => r.prefs.length > 1).map(r => ({
			to: '/' + r.id, title: r.name, ja: r.ja, sub: `地方・${spotsOfRegion(r.id).length} 處景點`,
			hay: norm(`${r.name} ${r.ja} ${r.romaji}`),
		})),
		...Object.values(prefs).map(p => ({
			to: `/${p.region}/${p.slug}`, title: p.zh, ja: p.ja, sub: `${regionById[p.region].name}・${spotsOfPref(p.code).length} 處景點`,
			hay: norm(`${p.zh} ${p.ja} ${p.romaji}`),
		})),
	]
	const spotRows = spots.map(s => {
		const p = prefs[s.pref], r = regionById[s.region]
		return {
			to: '/spot/' + s.id, cat: s.cat, title: s.name, ja: s.ja, sub: `${p.zh === r.name ? p.zh : `${p.zh}・${r.name}`}・${CATS[s.cat]}`,
			starts: [norm(s.name), norm(s.ja)],
			name: norm(`${s.name} ${s.ja} ${s.id}`),
			all: norm(`${s.name} ${s.ja} ${s.id} ${p.zh} ${p.ja} ${p.romaji} ${r.name} ${r.ja} ${CATS[s.cat]} ${s.summary}`),
		}
	})
	return { places, spotRows }
}

const results = computed(() => {
	const text = norm(query.value).trim()
	if (!text) return []
	index ??= buildIndex()
	const terms = text.split(/\s+/)
	const has = hay => terms.every(t => hay.includes(t))
	const head = [], inName = [], inAll = []
	for (const row of index.spotRows) {
		if (row.starts.some(n => n.startsWith(text))) head.push(row)
		else if (has(row.name)) inName.push(row)
		else if (has(row.all)) inAll.push(row)
	}
	return [...index.places.filter(p => has(p.hay)), ...head, ...inName, ...inAll]
})
const shown = computed(() => results.value.slice(0, LIMIT))

function open() {
	dialogEl.value.showModal()
}

function close() {
	dialogEl.value.close()
}

function onEnter(e) {
	if (e.isComposing || !shown.value.length) return
	e.preventDefault()
	router.push(shown.value[0].to)
	close()
}
</script>

<template>
	<button class="search-open" aria-haspopup="dialog" @click="open">
		<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7" /><path d="M15.8 15.8 L21 21" /></svg>
		搜尋
	</button>
	<dialog
		ref="dialogEl"
		class="search"
		aria-label="搜尋景點或地名"
		@keydown.esc.prevent="close"
		@click="$event.target === dialogEl && close()"
		@close="query = ''"
	>
		<div class="box">
			<div class="bar">
				<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7" /><path d="M15.8 15.8 L21 21" /></svg>
				<input
					v-model="query"
					type="search"
					placeholder="景點或地名"
					aria-label="景點或地名"
					autocomplete="off"
					enterkeyhint="search"
					@keydown.enter="onEnter"
				/>
				<button class="close" @click="close">關閉</button>
			</div>
			<p class="status" role="status">
				<template v-if="!query.trim()">可以用中文或日文搜尋，例如：清水寺、京都、溫泉</template>
				<template v-else-if="!results.length">找不到「{{ query.trim() }}」，可以換成日文名稱，或只打其中幾個字</template>
				<template v-else-if="results.length > LIMIT">找到 {{ results.length }} 筆，先列出前 {{ LIMIT }} 筆；多打幾個字可以縮小範圍</template>
				<template v-else>找到 {{ results.length }} 筆</template>
			</p>
			<ol v-if="shown.length" class="results">
				<li v-for="r in shown" :key="r.to">
					<RouterLink :to="r.to" class="row" @click="close">
						<span v-if="r.cat" class="mark mincho" aria-hidden="true">{{ r.cat }}</span>
						<span v-else class="mark place" aria-hidden="true" />
						<span class="main">
							<span class="name">{{ r.title }}<small v-if="r.ja !== r.title" lang="ja">{{ r.ja }}</small></span>
							<span class="sub">{{ r.sub }}</span>
						</span>
					</RouterLink>
				</li>
			</ol>
		</div>
	</dialog>
</template>

<style scoped>
.search-open {
	display: inline-flex;
	align-items: center;
	gap: 7px;
	min-height: 44px;
	padding: 0 16px 0 12px;
	border-radius: 999px;
	background: var(--card);
	box-shadow: 0 8px 20px -10px rgba(30, 20, 10, 0.5);
	font-size: 16px;
	font-weight: 700;
	transition: background-color 0.2s, color 0.2s;
}

.search-open:hover {
	background: var(--ink);
	color: var(--paper);
}

svg {
	flex: none;
	width: 22px;
	height: 22px;
	fill: none;
	stroke: currentColor;
	stroke-width: 2.2;
	stroke-linecap: round;
}

.search {
	position: fixed;
	inset: 0;
	width: 100%;
	height: 100%;
	max-width: none;
	max-height: none;
	margin: 0;
	padding: 32px 16px;
	border: 0;
	background: rgba(36, 33, 28, 0.45);
	color: inherit;
}

.box {
	display: flex;
	flex-direction: column;
	width: min(640px, 100%);
	max-height: 100%;
	margin: 0 auto;
	border-radius: 12px;
	background: var(--card);
	box-shadow: var(--shadow-card);
	overflow: hidden;
	animation: box-in 0.22s var(--ease-out);
}

@keyframes box-in {
	from {
		opacity: 0;
		translate: 0 12px;
	}
}

.bar {
	display: flex;
	align-items: center;
	gap: 10px;
	flex: none;
	padding: 10px 10px 10px 16px;
	border-bottom: 1px solid var(--line);
}

.bar input {
	flex: 1;
	min-width: 0;
	min-height: 44px;
	border: 0;
	outline: 0;
	background: none;
	color: inherit;
	font: inherit;
	font-size: 19px;
}

.bar input::placeholder {
	color: var(--ink-3);
}

.close {
	flex: none;
	min-height: 44px;
	padding: 0 14px;
	border-radius: 8px;
	font-size: 16px;
	font-weight: 700;
	color: var(--shu);
}

.close:hover {
	background: var(--hover);
}

.status {
	flex: none;
	padding: 10px 16px;
	font-size: 15px;
	color: var(--ink-2);
}

.results {
	flex: 1;
	min-height: 0;
	overflow-y: auto;
	overscroll-behavior: contain;
	border-top: 1px solid var(--line);
}

.row {
	display: grid;
	grid-template-columns: 34px 1fr;
	align-items: center;
	gap: 14px;
	min-height: 64px;
	padding: 8px 16px;
	border-bottom: 1px dashed var(--line);
	transition: background-color 0.2s;
}

.row:hover,
.row:focus-visible {
	background: var(--hover);
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

.mark.place {
	background: none;
	rotate: none;
	box-shadow: none;
}

.mark.place::before {
	content: '';
	width: 14px;
	height: 14px;
	border-radius: 50%;
	border: 3px solid var(--ink-2);
}

.main {
	display: flex;
	flex-direction: column;
	min-width: 0;
}

.name {
	display: flex;
	align-items: baseline;
	flex-wrap: wrap;
	gap: 0 8px;
	font-size: 17px;
	font-weight: 700;
	line-height: 1.45;
}

.name small {
	font-size: 15px;
	font-weight: 500;
	color: var(--ink-3);
}

.sub {
	font-size: 15px;
	line-height: 1.5;
	color: var(--ink-2);
}

@media (max-width: 760px) {
	.search {
		padding: 0;
	}

	.box {
		width: 100%;
		height: 100%;
		border-radius: 0;
	}
}

@media (prefers-reduced-motion: reduce) {
	.box {
		animation: none;
	}
}
</style>
