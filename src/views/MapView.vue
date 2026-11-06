<script setup>
import { ref, shallowRef, computed, watch, onMounted, onBeforeUnmount, onActivated, onDeactivated } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { animate, spring, createDrawable } from 'animejs'
import MapPanel from '../components/MapPanel.vue'
import PaperStandee from '../components/PaperStandee.vue'
import { STANDEES } from '../map/standees.js'
import { SEA_NAMES } from '../map/sea.js'
import { regions, regionById, prefs, regionOf } from '../data/regions.js'
import { spotById, spotsOfPref, spotsOfRegion, matchFilter, CATS } from '../data/spots.js'
import { reduceMotion } from '../motion.js'
import { wishIds } from '../wishlist.js'

defineOptions({ name: 'MapView' })

const SEAL = 17
const MERGE = 38

const route = useRoute()
const router = useRouter()
const stageEl = ref()
const canvasEl = ref()
const panelEl = ref()
const failed = ref('')
const ready = ref(false)
const ensoEl = ref()
const compassEl = ref()
const hover = ref({})
const filter = ref('all')
const zoomed = ref(false)
const compact = ref(false)
let tiny = false
let controlRects = []
function measureControls() {
	controlRects = [...stageEl.value.querySelectorAll('.compass, .rail-toggle, .reset')].map(el => {
		const b = el.getBoundingClientRect()
		return { x: b.left, y: b.top, w: b.width, h: b.height }
	})
}
const located = ref(null)
const view = shallowRef(parse())
const labelEls = new Map()
const markEls = new Map()
const standeeEls = new Map()
const standeeCmps = new Map()
let greetTimers = []
const nameWidths = new Map()
const boxSizes = new Map()
let scene = null
let ro = null
let firstPaint = true
let panelRect = null
let mobile = false
const touch = matchMedia('(pointer: coarse)').matches

const SPOTS_AROUND = [[0, 0], ...[1, 2, 3].flatMap(ring => [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, y]) => [x * ring, y * ring]))]
const OUTWARD = { hokkaido: [1, -0.2], tohoku: [1, 0.1], kanto: [1, 0.5], chubu: [0.4, 1], kansai: [0.1, 1], shikoku: [-0.1, 1], kyushu: [-1, 0.2], chugoku: [-0.5, -1], okinawa: [0, -0.6] }

function parse() {
	const region = regionById[route.params.region]
	if (!region) return { level: 'japan', region: null, pref: null }
	const pref = region.prefs.map(c => prefs[c]).find(p => p.slug === route.params.pref) ?? null
	return { level: pref ? 'pref' : 'region', region, pref }
}

const sceneView = v => ({ level: v.level, region: v.region?.id ?? null, pref: v.pref?.code ?? null })

watch(() => route.fullPath, () => {
	if (route.name !== 'map') return
	const v = parse()
	if (route.params.region && !v.region) return router.replace('/')
	if (route.params.pref && !v.pref) return router.replace('/' + v.region.id)
	if (v.region !== view.value.region) filter.value = 'all'
	if (v.region !== view.value.region || v.pref !== view.value.pref) zoomed.value = false
	view.value = v
	boxSizes.clear()
	hover.value = {}
	scene?.focus(sceneView(v))
	const spot = spotById[route.query.spot]
	const id = spot && spot.pref === v.pref?.code ? spot.id : null
	if (id === located.value) return
	located.value = id
	if (id) {
		filter.value = 'all'
		zoomToLocated()
	}
}, { immediate: true })

function zoomToLocated() {
	if (scene && located.value) zoomed.value = scene.locate(located.value, MERGE * 1.7)
}

const hoverRegion = computed(() => hover.value.region ?? (hover.value.code ? regionOf(hover.value.code).id : null))

const labels = computed(() => {
	const v = view.value
	if (v.level === 'japan') {
		return [
			...regions.map(r => ({ key: 'r-' + r.id, kind: 'region', region: r, to: '/' + r.id })),
			...SEA_NAMES.map(n => ({ key: 'sn-' + n.id, kind: 'sea', sea: n })),
		]
	}
	return v.region.prefs
		.filter(code => code !== v.pref?.code)
		.map(code => ({
			key: 'p-' + code, kind: 'pref', pref: prefs[code], to: `/${v.region.id}/${prefs[code].slug}`,
			muted: v.level === 'pref', count: v.level === 'region' ? spotsOfPref(code).length : 0,
		}))
})

const isHot = l => l.kind === 'region' ? hoverRegion.value === l.region.id : l.kind === 'pref' && hover.value.code === l.pref.code
const labelHover = l => l.kind === 'region' ? { region: l.region.id } : { code: l.pref.code }

function labelAria(l) {
	if (l.kind === 'region') {
		return `${l.region.name}，${spotsOfRegion(l.region.id).length} 處景點`
	}
	if (l.kind === 'pref') return l.pref.zh + (l.count ? `，${l.count} 處景點` : '')
	return null
}

const marks = computed(() => view.value.level === 'pref' ? spotsOfPref(view.value.pref.code) : [])

const standees = computed(() => view.value.level === 'japan'
	? STANDEES.filter(d => d.rep)
	: STANDEES.filter(d => regionOf(d.code) === view.value.region))

const standeeKey = d => (view.value.level === 'japan' ? 'dr-' : 'd-') + d.code

const isCurrentStandee = d => view.value.pref?.code === d.code
const standeeHover = d => view.value.level === 'japan' ? { region: d.rep } : { code: d.code }
function onStandeeClick(d) {
	if (isCurrentStandee(d)) return
	router.push(view.value.level === 'japan' ? '/' + d.rep : `/${view.value.region.id}/${prefs[d.code].slug}`)
}

watch(() => view.value.region, region => {
	greetTimers.forEach(clearTimeout)
	greetTimers = []
	if (!region || reduceMotion) return
	const base = firstPaint ? 3200 : 1900
	standees.value.forEach((d, i) => {
		greetTimers.push(setTimeout(() => standeeCmps.get('d-' + d.code)?.play(), base + i * 420))
	})
})

const railKey = 'travel-guide:rails'
const railOn = ref(false)
const railBusy = ref(false)
const railError = ref(false)
const stationsEl = ref()
let rails = null

const railLegend = computed(() => {
	const { level } = view.value
	if (level === 'japan') return [{ cls: 's', label: '新幹線' }]
	return [
		{ cls: 's', label: '新幹線' },
		{ cls: 'j', label: 'JR' },
		{ cls: 'o', label: level === 'pref' ? '私鐵・地鐵' : '主要私鐵' },
	]
})

async function setRails(on) {
	railError.value = false
	railOn.value = on
	try { localStorage.setItem(railKey, on ? '1' : '') } catch {}
	if (!on) {
		closeStation()
		rails?.setOn(false)
		return
	}
	railBusy.value = true
	try {
		if (!rails) {
			const { RailLayer } = await import('../map/RailLayer.js')
			rails ??= new RailLayer(scene)
		}
		rails.view = sceneView(view.value)
		await rails.setOn(railOn.value)
	} catch (e) {
		console.error(e)
		railOn.value = false
		railError.value = true
	}
	railBusy.value = false
}

watch(view, v => {
	if (rails?.on) rails.setView(sceneView(v)).catch(console.error)
	else if (rails) rails.view = sceneView(v)
})

watch(zoomed, closeStation)
watch(view, closeStation)

const stationCard = shallowRef(null)
const cardEl = ref()
const ringEl = ref()
let stationPinned = false

function closeStation() {
	stationCard.value = null
	stationPinned = false
}

function stationAt(e) {
	const r = canvasEl.value.getBoundingClientRect()
	return rails?.stationAt(e.clientX - r.left, e.clientY - r.top, 22) ?? null
}

function onCanvasMove(e) {
	const st = e && stationAt(e)
	if (!stationPinned) stationCard.value = st ?? null
	return !!st
}

function placeCard() {
	const st = stationCard.value, el = cardEl.value
	if (!st || !el) return
	const p = rails.screenOf(st)
	ringEl.value.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`
	const W = scene.width, H = scene.height
	const right = mobile ? W : panelRect.x
	const bottom = mobile ? panelRect.y : H
	const w = el.offsetWidth, h = el.offsetHeight
	const x = Math.max(8, Math.min(p.x - w / 2, right - w - 8))
	let y = p.y - h - 16
	if (y < 60) y = Math.min(p.y + 16, bottom - h - 8)
	el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
}

watch(stationCard, placeCard, { flush: 'post' })

function placeStations(occupied) {
	const pool = stationsEl.value?.children
	if (!pool) return
	const taken = [...occupied]
	const max = mobile ? 5 : pool.length
	const W = scene.width, H = scene.height
	let n = 0, tries = 0
	for (const st of rails?.stations() ?? []) {
		if (n >= max || tries >= max * 2) break
		if (!st.major && !rails.detail) continue
		const p = rails.screenOf(st)
		if (p.x < 0 || p.y < 0 || p.x > W || p.y > H) continue
		tries++
		const w = st.name.length * 16 + 14
		const c = [
			{ x: p.x + 7, y: p.y - 13, w, h: 26 },
			{ x: p.x - 7 - w, y: p.y - 13, w, h: 26 },
			{ x: p.x - w / 2, y: p.y - 33, w, h: 26 },
			{ x: p.x - w / 2, y: p.y + 7, w, h: 26 },
			{ x: p.x + 7, y: p.y - 33, w, h: 26 },
			{ x: p.x - 7 - w, y: p.y - 33, w, h: 26 },
			{ x: p.x + 7, y: p.y + 7, w, h: 26 },
			{ x: p.x - 7 - w, y: p.y + 7, w, h: 26 },
		].find(c => inView(c) && !taken.some(r => overlap(r, c)))
		if (!c) continue
		taken.push(c)
		const el = pool[n++]
		if (el.textContent !== st.name) el.textContent = st.name
		el.style.transform = `translate3d(${c.x.toFixed(1)}px, ${c.y.toFixed(1)}px, 0)`
		el.classList.add('show')
	}
	for (; n < pool.length; n++) pool[n].classList.remove('show')
	placeCard()
}

function setHover(h) {
	hover.value = h
	scene?.setHover(h)
}

function onPick(hit, e) {
	const st = e && stationAt(e)
	if (st) {
		stationCard.value = st
		stationPinned = true
		return
	}
	if (stationPinned) return closeStation()
	const v = view.value
	if (!hit) {
		if (e?.pointerType === 'touch') return
		if (zoomed.value) return resetZoom()
		if (v.level === 'pref') router.push('/' + v.region.id)
		else if (v.level === 'region') router.push('/')
		return
	}
	const region = regionOf(hit.code)
	if (v.level === 'japan' || region !== v.region) return router.push('/' + region.id)
	if (v.pref?.code !== hit.code) router.push(`/${region.id}/${prefs[hit.code].slug}`)
}

function onMarkClick(spot, el) {
	const members = el.dataset.members?.split(',') ?? []
	if (members.length > 1) {
		scene.zoomTo(members, MERGE * 1.7)
		zoomed.value = true
	} else router.push('/spot/' + spot.id)
}

function resetZoom() {
	scene.resetZoom()
	zoomed.value = false
	if (route.query.spot) router.replace(route.path)
}

function onKey(e) {
	if (e.key !== 'Escape' || e.defaultPrevented || !scene) return
	onPick(null)
}

const sheet = ref('half')
const collapsed = computed(() => sheet.value === 'collapsed')
const sheetLabel = computed(() => {
	const v = view.value
	if (v.level === 'japan') return '全日本・9 個地方'
	if (v.pref) return `${v.pref.zh}・${spotsOfPref(v.pref.code).length} 處景點`
	return `${v.region.name}・${spotsOfRegion(v.region.id).length} 處景點`
})
const sheetUp = computed(() => {
	const v = view.value
	if (v.level === 'pref') return { to: '/' + v.region.id, name: v.region.name }
	return { to: '/', name: '全日本' }
})

function setSheet(s) {
	if (s === sheet.value) return
	const el = panelEl.value
	const from = el.offsetHeight
	sheet.value = s
	if (reduceMotion) return
	el.style.height = ''
	const to = el.offsetHeight
	animate(el, { height: [from + 'px', to + 'px'], ease: spring({ bounce: 0.2, duration: 520 }), onComplete: () => { el.style.height = '' } })
}

let swipe = null
function onBarDown(e) {
	swipe = { y: e.clientY, used: false }
}
function onBarUp(e) {
	if (!swipe) return
	const dy = e.clientY - swipe.y
	if (Math.abs(dy) > 24) {
		if (dy > 0) setSheet(sheet.value === 'full' ? 'half' : 'collapsed')
		else setSheet(collapsed.value ? 'half' : 'full')
		swipe.used = true
	}
}
function onBarClick(s) {
	if (swipe?.used) {
		swipe = null
		return
	}
	setSheet(s)
}

watch(view, () => {
	if (sheet.value === 'full') setSheet('half')
})

const setLabelEl = (key, el) => (el ? labelEls.set(key, el) : labelEls.delete(key))
const setMarkEl = (id, el) => (el ? markEls.set(id, el) : markEls.delete(id))
const setStandeeEl = (key, el) => (el ? standeeEls.set(key, el) : standeeEls.delete(key))
const setStandeeCmp = (key, c) => (c ? standeeCmps.set(key, c) : standeeCmps.delete(key))

function boxOf(key, el) {
	let s = boxSizes.get(key)
	if (!s) {
		s = { w: el.offsetWidth, h: el.offsetHeight }
		if (s.w) boxSizes.set(key, s)
	}
	return s
}

function placeLabels() {
	const prefRects = []
	const seaRects = []
	const hideDecor = tiny && !zoomed.value && view.value.level === 'japan'
	for (const [key, el] of labelEls) {
		const p = scene.screenOf(key)
		if (!p) continue
		el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`
		if (key.startsWith('sn-')) {
			const { w, h } = boxOf(key, el.querySelector('.in'))
			el.classList.toggle('away', hideDecor || !inView({ x: p.x - w / 2, y: p.y - h / 2, w, h }))
			seaRects.push({ el, x: p.x - w / 2, y: p.y - h / 2, w, h })
		}
		if (key.startsWith('r-')) {
			el.classList.toggle('away', hideDecor)
			if (hideDecor) continue
			const { w, h } = boxOf(key, el.querySelector('.in'))
			const y = compact.value ? p.y - h / 2 : key === 'r-shikoku' ? p.y + 8 : p.y - 8 - h
			prefRects.push({ el, x: p.x - w / 2, y, w, h, area: 0, ax: p.x, ay: p.y, out: OUTWARD[key.slice(2)] })
		}
		if (key.startsWith('p-')) {
			const { w, h } = boxOf(key, el.querySelector('.in'))
			prefRects.push({ el, x: p.x - w / 2, y: p.y - h / 2, w, h, area: scene.prefs.get(+key.slice(2)).area })
		}
	}
	const standeeRects = []
	for (const [key, el] of standeeEls) {
		const p = scene.screenOf(key)
		if (!p) continue
		el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`
		let size = 0
		if (!key.startsWith('d-')) {
			el.style.removeProperty('--s')
			const { w } = boxOf(key, el.firstElementChild)
			el.classList.toggle('away', hideDecor || !inView({ x: p.x - w / 2, y: p.y - w, w, h: w }))
		} else {
			const focus = view.value.pref?.code === +key.slice(2)
			size = Math.min(mobile ? 64 : 110, Math.max(40, scene.pxPerUnit(key) * 0.3)) * (focus ? 1.25 : 1)
			el.style.setProperty('--s', size.toFixed(1) + 'px')
			el.classList.toggle('away', (!focus || zoomed.value) && !inView({ x: p.x - size / 2, y: p.y - size, w: size, h: size }))
		}
		if (el.classList.contains('away')) continue
		const w = size || boxOf(key, el.firstElementChild).w
		standeeRects.push({ el, x: p.x - w / 2, y: p.y - w, w, h: w })
	}
	const japan = view.value.level === 'japan'
	const occupied = placeMarks(prefRects, japan ? [] : standeeRects)
	if (japan) {
		const kept = [...occupied]
		for (const r of standeeRects) {
			if (occupied.some(o => overlap(o, r))) r.el.classList.add('away')
			else kept.push(r)
		}
		for (const r of seaRects) if (kept.some(o => overlap(o, r))) r.el.classList.add('away')
	}
	if (rails) {
		const detail = scene.zoomRatio() > 1.6
		if (rails.detail !== detail) rails.setDetail(detail)
		placeStations(occupied)
	}
	if (compassEl.value) compassEl.value.style.rotate = scene.northAngle().toFixed(1) + 'deg'
}

const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y

function inView(r) {
	const W = scene.width, H = scene.height
	return r.x >= 0 && r.y >= 60 && r.x + r.w <= W && r.y + r.h <= H && !(panelRect && overlap(r, panelRect))
}

function placeMarks(obstacles, standeeRects) {
	const items = []
	const pref = view.value.pref
	const hotId = hover.value.spot ?? located.value
	for (const [id, el] of markEls) {
		const p = scene.screenOf('s-' + id)
		if (!p) continue
		const spot = spotById[id]
		const off = !matchFilter(spot, filter.value) || (zoomed.value && !inView({ x: p.x - SEAL, y: p.y - SEAL, w: SEAL * 2, h: SEAL * 2 }))
		const dim = !!pref && spot.pref !== pref.code
		el.classList.toggle('off', off)
		el.classList.toggle('dim', dim)
		el.classList.toggle('hot', hotId === id)
		el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`
		if (off) {
			el.classList.remove('named', 'cluster', 'merged', 'left', 'holds-hot')
			el.tabIndex = -1
			continue
		}
		items.push({ id, el, x: p.x, y: p.y, pri: id === located.value ? 2 : dim ? 0 : 1 })
	}
	items.sort((a, b) => b.pri - a.pri)
	const leads = []
	for (const it of items) {
		const lead = leads.find(l => l.id !== located.value && Math.hypot(l.x - it.x, l.y - it.y) < MERGE)
		if (lead) lead.members.push(it.id)
		else {
			it.members = [it.id]
			leads.push(it)
		}
	}
	const seals = [...leads.map(l => ({ x: l.x - SEAL - 2, y: l.y - SEAL - 2, w: SEAL * 2 + 4, h: SEAL * 2 + 4 })), ...standeeRects]
	const W = scene.width, H = scene.height
	const blocked = c => c.x < 4 || c.y < 60 || c.x + c.w > W - 4 || c.y + c.h > H - 4 || (panelRect && overlap(c, panelRect))
	const placed = []
	for (const r of [...obstacles].sort((a, b) => a.area - b.area)) {
		const ax = r.x + r.w / 2, ay = r.y + r.h / 2
		const away = ax < 0 || ay < 0 || ax > W || ay > H || (panelRect && overlap({ x: ax, y: ay, w: 1, h: 1 }, panelRect))
		r.el.classList.toggle('away', away)
		if (away) continue
		const stepX = r.w * 0.6 + 12, stepY = r.h + 8
		let pick = null
		const far = r.out && [1, 1.5, 2, 2.5, 3].map(t => [r.out[0] * t, r.out[1] * t])
		const spots = !r.out ? SPOTS_AROUND : compact.value && !zoomed.value ? [...far, ...SPOTS_AROUND] : [[0, 0], ...far, ...SPOTS_AROUND]
		for (const [dx, dy] of spots) {
			const c = { x: r.x + dx * stepX, y: r.y + dy * stepY, w: r.w, h: r.h }
			if (!blocked(c) && !(r.out && controlRects.some(q => overlap(c, q))) && !seals.some(s => overlap(c, s)) && !placed.some(q => overlap(c, q))) {
				pick = { ox: dx * stepX, oy: dy * stepY, c }
				break
			}
		}
		if (!pick && r.out && zoomed.value) {
			r.el.classList.add('away')
			continue
		}
		const { ox = 0, oy = 0, c = r } = pick ?? {}
		r.el.style.setProperty('--sx', ox + 'px')
		r.el.style.setProperty('--sy', oy + 'px')
		const tx = r.out ? Math.min(Math.max(r.ax, c.x), c.x + c.w) - r.ax : ox
		const ty = r.out ? Math.min(Math.max(r.ay, c.y), c.y + c.h) - r.ay : oy
		r.el.style.setProperty('--len', Math.hypot(tx, ty) + 'px')
		r.el.style.setProperty('--ang', Math.atan2(ty, tx) + 'rad')
		r.el.classList.toggle('tied', (ox !== 0 || oy !== 0) && Math.hypot(tx, ty) > 10 && ay >= 60)
		placed.push(c)
	}
	const taken = [...placed, ...seals]
	const named = new Map()
	const order = [...leads].sort((a, b) => (b.id === hotId) - (a.id === hotId) || b.pri - a.pri)
	for (const l of order) {
		if (l.members.length > 1) continue
		const w = nameWidth(l.el, l.id)
		const right = { x: l.x + SEAL + 6, y: l.y - 15, w, h: 30 }
		const left = { x: l.x - SEAL - 6 - w, y: l.y - 15, w, h: 30 }
		const free = c => !blocked(c) && !taken.some(r => overlap(r, c))
		const side = free(right) ? 'right' : free(left) ? 'left' : l.id === hotId ? 'right' : null
		if (!side) continue
		named.set(l.id, side)
		taken.push(side === 'right' ? right : left)
	}
	for (const it of items) {
		const isLead = !!it.members
		const n = isLead ? it.members.length : 0
		const cl = it.el.classList
		cl.toggle('merged', !isLead)
		cl.toggle('cluster', n > 1)
		cl.toggle('named', named.has(it.id))
		cl.toggle('left', named.get(it.id) === 'left')
		cl.toggle('holds-hot', n > 1 && it.members.includes(hotId))
		cl.toggle('wish', isLead && it.members.some(id => wishIds.has(id)))
		it.el.tabIndex = isLead ? 0 : -1
		if (isLead) {
			it.el.dataset.members = it.members.join(',')
			it.el.querySelector('.count').textContent = n > 1 ? n : ''
			it.el.setAttribute('aria-label', n > 1 ? `${n} 個景點，點一下放大` : it.el.dataset.name)
		}
	}
	return taken
}

function nameWidth(el, id) {
	let w = nameWidths.get(id)
	if (!w) {
		w = el.querySelector('.name').offsetWidth
		if (w) nameWidths.set(id, w)
	}
	return w || 120
}

document.fonts?.ready.then(() => {
	nameWidths.clear()
	boxSizes.clear()
	scene?.invalidate()
})

watch(compact, () => {
	boxSizes.clear()
	scene?.invalidate()
}, { flush: 'post' })

watch(zoomed, () => {
	measureControls()
	scene?.invalidate()
}, { flush: 'post' })

watch(() => hover.value.spot, id => {
	if (!id || reduceMotion) return
	let el = markEls.get(id)
	if (el?.classList.contains('merged')) el = [...markEls.values()].find(e => e.dataset.members?.split(',').includes(id) && !e.classList.contains('merged'))
	const ring = el?.querySelector('.ripple')
	if (ring) animate(ring, { scale: [0.6, 2.6], opacity: [0.7, 0], duration: 900, ease: 'out(3)' })
})

function enterDelay(el) {
	const base = firstPaint ? (view.value.level === 'japan' ? 1700 : 200) : 750
	return base + Number(el.dataset.i) * 45
}

function onBeforeEnter(el) {
	el.style.opacity = 0
}

function onLabelEnter(el, done) {
	if (reduceMotion) {
		el.style.opacity = 1
		return done()
	}
	const delay = enterDelay(el)
	animate(el, { opacity: 1, duration: 500, delay, ease: 'out(2)', onComplete: done })
	animate(el.querySelector('.in'), { y: [10, 0], duration: 650, delay, ease: 'out(3)' })
}

function onMarkBeforeEnter(el) {
	el.querySelector('.stamp').style.opacity = 0
}

function onMarkEnter(el, done) {
	const stamp = el.querySelector('.stamp')
	if (reduceMotion) {
		stamp.style.opacity = 1
		return done()
	}
	const delay = view.value.level === 'region' ? 0 : enterDelay(el) + 200
	animate(stamp, { opacity: [0, 1], duration: 220, delay, ease: 'out(2)' })
	animate(stamp, { scale: [1.9, 1], rotate: [-24, 0], delay, ease: spring({ bounce: 0.35, duration: 500 }), onComplete: done })
}

function onStandeeBeforeEnter(el) {
	el.firstElementChild.style.opacity = 0
}

function onStandeeEnter(el, done) {
	const paper = el.firstElementChild
	if (reduceMotion) {
		paper.style.opacity = 1
		return done()
	}
	const delay = enterDelay(el) + 350
	animate(paper, { opacity: [0, 1], duration: 160, delay, ease: 'out(2)' })
	animate(paper, { rotateX: [88, 0], delay, ease: spring({ bounce: 0.45, duration: 650 }), onComplete: done })
}

function onLeave(el, done) {
	animate(el, { opacity: 0, duration: 180, ease: 'out(2)', onComplete: done })
}

function measure() {
	const W = stageEl.value.clientWidth, H = stageEl.value.clientHeight
	scene.setSize(W, H)
	const r = panelEl.value.getBoundingClientRect()
	panelRect = { x: r.left, y: r.top, w: r.width, h: r.height }
	const wasMobile = mobile
	mobile = matchMedia('(max-width: 760px)').matches
	if (mobile !== wasMobile) boxSizes.clear()
	stageEl.value.style.setProperty('--sheet', Math.round(H - r.top) + 'px')
	stageEl.value.style.setProperty('--panel-w', Math.round(W - r.left) + 'px')
	const bottom = Math.min(Math.round(H - r.top), Math.round(H * 0.46) + 10)
	const insets = mobile ? { top: 56, right: 0, bottom } : { top: 40, right: Math.round(W - r.left), bottom: 0 }
	scene.setInsets(insets)
	const scale = scene.japanScale()
	compact.value = scale < (mobile ? 22 : 28)
	tiny = scale < 12
	measureControls()
}

onMounted(async () => {
	if (!reduceMotion) animate(createDrawable(ensoEl.value), { draw: ['0 0', '0 0.94'], duration: 1400, delay: 200, ease: 'inOut(3)' })
	let JapanScene
	try {
		({ JapanScene } = await import('../map/JapanScene.js'))
	} catch (e) {
		console.error(e)
		failed.value = '地圖載入失敗，請檢查網路後重新整理頁面，或從列表選擇地方。'
		return
	}
	try {
		scene = new JapanScene(canvasEl.value, {
			onHover: h => { hover.value = h ?? {} },
			onPick,
			onRender: placeLabels,
			onMove: onCanvasMove,
			onZoom: z => {
				zoomed.value = z
				if (!z && route.query.spot) router.replace(route.path)
			},
			surface: stageEl.value,
			skipIntro: view.value.level !== 'japan',
		})
	} catch (e) {
		console.error(e)
		failed.value = '此裝置無法顯示 3D 地圖，請從列表選擇地方。'
		return
	}
	ready.value = true
	measure()
	if (view.value.level === 'japan') scene.intro()
	else {
		scene.focus(sceneView(view.value), true)
		zoomToLocated()
	}
	scene.resume()
	setTimeout(() => { firstPaint = false }, 0)
	ro = new ResizeObserver(measure)
	ro.observe(stageEl.value)
	ro.observe(panelEl.value)
	try { if (localStorage.getItem(railKey)) setRails(true) } catch {}
})

watch([filter, () => hover.value.spot, located, () => wishIds.size, ready], () => scene?.invalidate(), { flush: 'post' })

onActivated(() => {
	addEventListener('keydown', onKey)
	if (!scene) return
	scene.resume()
	measure()
})

onDeactivated(() => {
	removeEventListener('keydown', onKey)
	scene?.pause()
})

onBeforeUnmount(() => {
	removeEventListener('keydown', onKey)
	greetTimers.forEach(clearTimeout)
	ro?.disconnect()
	scene?.dispose()
})
</script>

<template>
	<main class="map-view">
		<div ref="stageEl" class="stage">
			<canvas ref="canvasEl" class="canvas" aria-hidden="true" />
			<svg class="defs" aria-hidden="true">
				<filter id="paper-cut" x="-20%" y="-20%" width="140%" height="140%">
					<feMorphology in="SourceAlpha" operator="dilate" radius="2.6" result="grown" />
					<feFlood flood-color="#fffaf0" />
					<feComposite in2="grown" operator="in" result="edge" />
					<feMerge>
						<feMergeNode in="edge" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
			</svg>
			<template v-if="ready">
				<div ref="stationsEl" class="stations" :class="{ on: railOn }" aria-hidden="true">
					<span v-for="i in 8" :key="i" class="st" lang="ja" />
				</div>
				<TransitionGroup
					tag="div"
					class="standees"
					:class="'lv-' + view.level"
					:css="false"
					appear
					@before-enter="onStandeeBeforeEnter"
					@enter="onStandeeEnter"
					@leave="onLeave"
				>
					<div
						v-for="(d, i) in standees"
						:key="standeeKey(d)"
						:ref="el => setStandeeEl(standeeKey(d), el)"
						class="standee"
						:class="{ focus: isCurrentStandee(d) }"
						:data-i="i"
						:title="d.name"
						@click="onStandeeClick(d)"
						@mouseenter="!isCurrentStandee(d) && setHover(standeeHover(d))"
						@mouseleave="!isCurrentStandee(d) && setHover({})"
					>
						<div class="paper">
							<PaperStandee :ref="c => setStandeeCmp(standeeKey(d), c)" :def="d" />
						</div>
					</div>
				</TransitionGroup>
				<TransitionGroup
					tag="div"
					class="labels"
					:class="{ compact }"
					:css="false"
					appear
					@before-enter="onBeforeEnter"
					@enter="onLabelEnter"
					@leave="onLeave"
				>
					<a
						v-for="(l, i) in labels"
						:key="l.key"
						:ref="el => setLabelEl(l.key, el)"
						:href="l.to && router.resolve(l.to).href"
						class="label"
						draggable="false"
						:class="[l.kind, { hot: isHot(l), muted: l.muted, below: l.region?.id === 'shikoku' }]"
						:data-i="i"
						:style="l.region ? { '--rc': l.region.color } : null"
						:aria-label="labelAria(l)"
						@click.prevent="l.to && router.push(l.to)"
						@mouseenter="l.to && setHover(labelHover(l))"
						@mouseleave="l.to && setHover({})"
						@focus="l.to && setHover(labelHover(l))"
						@blur="l.to && setHover({})"
					>
						<span v-if="l.kind === 'region'" class="tie" />
						<span v-if="l.kind === 'region'" class="in">
							<span class="ja mincho" lang="ja">{{ l.region.ja.replace('地方', '') }}<small v-if="l.region.ja.endsWith('地方')">地方</small></span>
							<span class="ro latin">{{ l.region.romaji }}</span>
						</span>
						<span v-else-if="l.kind === 'sea'" class="in" aria-hidden="true">
							<span class="ja mincho">{{ l.sea.name }}</span>
							<span class="ro latin">{{ l.sea.en }}</span>
						</span>
						<template v-else>
							<span class="tie" />
							<span class="in">
								<span class="zh mincho">{{ l.pref.zh }}</span>
								<span v-if="l.count" class="cnt latin" :aria-label="`${l.count} 處景點`">{{ l.count }}</span>
							</span>
						</template>
					</a>
				</TransitionGroup>
				<TransitionGroup
					tag="div"
					class="marks"
					:css="false"
					appear
					@before-enter="onMarkBeforeEnter"
					@enter="onMarkEnter"
					@leave="onLeave"
				>
					<a
						v-for="(s, i) in marks"
						:key="s.id"
						:ref="el => setMarkEl(s.id, el)"
						:href="router.resolve('/spot/' + s.id).href"
						class="mark"
						draggable="false"
						:data-i="i"
						:data-name="s.name"
						:title="CATS[s.cat]"
						@click.prevent="onMarkClick(s, $event.currentTarget)"
						@mouseenter="setHover({ spot: s.id })"
						@mouseleave="setHover({})"
						@focus="setHover({ spot: s.id })"
						@blur="setHover({})"
					>
						<span class="ripple" />
						<span class="stamp">
							<span class="seal mincho">{{ s.cat }}</span>
							<span class="count latin" />
						</span>
						<span class="name">{{ s.name }}</span>
					</a>
				</TransitionGroup>
			</template>
			<template v-if="stationCard">
				<span ref="ringEl" class="st-ring" />
				<div ref="cardEl" class="st-card">
					<b lang="ja">{{ stationCard.name }}</b>
					<p lang="ja">{{ stationCard.lines.join('、') }}</p>
					<small>依法定路線名稱，可能和搭車時看到的名稱不同</small>
				</div>
			</template>
			<div v-if="ready" class="rail-dock" @pointerdown.stop>
				<p v-if="railError" class="rail-note" role="alert">路線圖載入失敗，請檢查網路後再試一次。</p>
				<Transition name="legend">
					<div v-if="railOn && !railBusy" class="rail-legend" :class="{ zoomed }">
						<ul>
							<li v-for="l in railLegend" :key="l.cls"><i :class="l.cls" />{{ l.label }}</li>
						</ul>
						<a href="https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N02-2025.html" target="_blank" rel="noopener">「国土数値情報（鉄道データ）」（国土交通省）を加工して作成</a>
					</div>
				</Transition>
				<button
					class="rail-toggle"
					:class="{ on: railOn }"
					:aria-pressed="railOn"
					:aria-label="railBusy ? '路線圖載入中' : railOn ? '隱藏路線圖' : '顯示路線圖'"
					:title="railBusy ? '路線圖載入中' : railOn ? '隱藏路線圖' : '顯示路線圖'"
					:disabled="railBusy"
					@click="setRails(!railOn)"
				>
					<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="15" rx="3.5" /><path d="M5 11 H19 M8.5 14.5 H9 M15 14.5 H15.5 M9 18 L7 21.5 M15 18 L17 21.5" /></svg>
				</button>
			</div>
			<button v-if="ready" class="compass" :title="touch ? '方位' : '方位（點一下轉回正北）'" :aria-label="touch ? '方位' : '轉回正北'" :disabled="touch" @pointerdown.stop @click="scene.resetRotation()">
				<svg ref="compassEl" viewBox="0 0 64 64" aria-hidden="true">
					<circle cx="32" cy="32" r="29" class="ring" />
					<circle cx="32" cy="32" r="25.5" class="ring thin" />
					<path d="M32 9 L37 32 L32 55 L27 32 Z" class="needle" />
					<path d="M32 9 L37 32 L27 32 Z" class="needle north" />
					<path d="M9 32 L32 28 L55 32 L32 36 Z" class="needle cross" />
					<text x="32" y="7.5" class="dir">北</text>
				</svg>
			</button>
			<Transition name="fade">
				<button v-if="zoomed" class="reset" @pointerdown.stop @click="resetZoom">
					<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7" /><path d="M7.5 10.5 H13.5 M15.8 15.8 L21 21" /></svg>
					縮小
				</button>
			</Transition>
			<p v-if="failed" class="fallback mincho">{{ failed }}</p>
			<Transition name="loader">
				<div v-if="!ready && !failed" class="loader" role="status">
					<svg viewBox="0 0 100 100" aria-hidden="true">
						<path ref="ensoEl" d="M62 14 C84 20 94 44 86 66 C78 86 52 94 32 84 C12 74 6 48 16 30 C24 16 40 10 56 12" />
					</svg>
					<p class="mincho">地圖展開中</p>
				</div>
			</Transition>
		</div>
		<aside ref="panelEl" class="panel" :class="sheet">
			<div class="sheet-bar" @pointerdown="onBarDown" @pointerup="onBarUp">
				<span class="grip" aria-hidden="true" />
				<RouterLink v-if="collapsed && view.level !== 'japan'" :to="sheetUp.to" class="sheet-back">
					<span aria-hidden="true">←</span>回到{{ sheetUp.name }}
				</RouterLink>
				<button v-if="sheet === 'half'" class="sheet-toggle grow" @click="onBarClick('full')">
					<span class="sheet-act">放大列表<i aria-hidden="true">▲</i></span>
				</button>
				<button class="sheet-toggle" :aria-expanded="!collapsed" @click="onBarClick(sheet === 'half' ? 'collapsed' : 'half')">
					<span v-if="collapsed" class="sheet-name mincho">{{ sheetLabel }}</span>
					<span class="sheet-act">{{ collapsed ? '展開' : sheet === 'full' ? '縮小列表' : '收起' }}<i aria-hidden="true">{{ collapsed ? '▲' : '▼' }}</i></span>
				</button>
			</div>
			<div class="panel-body">
				<MapPanel :view="view" :hover="hover" :filter="filter" @hover="setHover" @filter="f => { filter = f }" />
			</div>
		</aside>
	</main>
</template>

<style scoped>
.map-view {
	position: fixed;
	inset: 0;
	overflow: hidden;
	background: var(--desk);
}

.stage {
	position: absolute;
	inset: 0;
	touch-action: none;
}

.canvas {
	display: block;
	width: 100%;
	height: 100%;
}

.defs {
	position: absolute;
	width: 0;
	height: 0;
}

.rail-dock {
	position: absolute;
	right: calc(var(--panel-w, 0px) + 14px);
	left: 150px;
	bottom: 20px;
	z-index: 5;
	display: flex;
	align-items: flex-end;
	justify-content: flex-end;
	gap: 10px;
	pointer-events: none;
}

.rail-dock > * {
	pointer-events: auto;
}

.rail-toggle {
	flex: none;
	display: grid;
	place-items: center;
	width: 52px;
	height: 52px;
	padding: 0;
	border-radius: 50%;
	background: var(--card);
	box-shadow: 0 8px 20px -10px rgba(30, 20, 10, 0.5);
	transition: background-color 0.25s, color 0.25s;
}

.rail-toggle svg {
	width: 26px;
	height: 26px;
	fill: none;
	stroke: currentColor;
	stroke-width: 1.9;
	stroke-linecap: round;
}

.rail-toggle:hover {
	background: var(--hover);
	background: color-mix(in srgb, var(--card) 80%, var(--ink));
}

.rail-toggle.on {
	background: var(--ink);
	color: var(--paper);
}

.rail-toggle:disabled {
	opacity: 0.6;
	cursor: progress;
}

.rail-note,
.rail-legend {
	min-width: 0;
	padding: 8px 14px;
	border-radius: 10px;
	background: var(--card);
	box-shadow: 0 8px 20px -10px rgba(30, 20, 10, 0.5);
}

.rail-note {
	font-size: 15px;
	color: var(--shu);
}

.rail-legend ul {
	display: flex;
	flex-wrap: wrap;
	gap: 2px 16px;
	font-size: 15px;
	font-weight: 700;
}

.rail-legend li {
	display: flex;
	align-items: center;
	gap: 7px;
}

.rail-legend i {
	width: 22px;
	height: 4px;
	border-radius: 2px;
}

.rail-legend .s {
	height: 5px;
	background: #d0432e;
}

.rail-legend .j {
	background: #3a2e26;
}

.rail-legend .o {
	background: #3f6f9c;
}

.rail-legend a {
	display: block;
	margin-top: 2px;
	font-size: 12px;
	color: var(--ink-3);
	text-decoration: underline;
	text-underline-offset: 2px;
}

.legend-enter-active {
	transition: opacity 0.35s, translate 0.45s var(--ease-out);
}

.legend-leave-active {
	transition: opacity 0.2s;
}

.legend-enter-from,
.legend-leave-to {
	opacity: 0;
}

.legend-enter-from {
	translate: 12px 0;
}

@media (max-width: 760px) {
	.rail-dock {
		left: 66px;
		right: 8px;
		bottom: calc(var(--sheet, 46dvh) + 8px);
		gap: 6px;
	}

	.rail-toggle {
		width: 46px;
		height: 46px;
	}

	.rail-note,
	.rail-legend {
		padding: 5px 9px;
	}

	.rail-legend.zoomed {
		display: none;
	}

	.rail-legend ul {
		gap: 0 8px;
		font-size: 13px;
	}

	.rail-legend i {
		width: 14px;
	}

	.rail-legend a {
		font-size: 10.5px;
		line-height: 1.25;
	}
}

.stations {
	position: absolute;
	inset: 0;
	pointer-events: none;
	overflow: hidden;
	opacity: 0;
	transition: opacity 0.2s;
}

.stations.on {
	opacity: 1;
	transition: opacity 0.4s 0.2s;
}

.st {
	position: absolute;
	left: 0;
	top: 0;
	display: none;
	height: 26px;
	padding: 0 7px;
	border-radius: 4px;
	background: rgba(255, 250, 240, 0.9);
	font-size: 15px;
	font-weight: 700;
	line-height: 26px;
	white-space: nowrap;
	color: #3a2e26;
	will-change: transform;
}

.st.show {
	display: block;
}

.st-ring {
	position: absolute;
	left: -9px;
	top: -9px;
	z-index: 6;
	width: 18px;
	height: 18px;
	border: 3px solid var(--shu);
	border-radius: 50%;
	background: rgba(255, 250, 240, 0.7);
	pointer-events: none;
}

.st-card {
	position: absolute;
	left: 0;
	top: 0;
	z-index: 6;
	width: max-content;
	max-width: min(300px, calc(100% - 16px));
	padding: 8px 12px 9px;
	border-radius: 8px;
	background: var(--card);
	box-shadow: 0 10px 24px -10px rgba(30, 20, 10, 0.55);
	pointer-events: none;
	animation: st-in 0.18s ease-out;
}

.st-card b {
	display: block;
	font-size: 18px;
}

.st-card p {
	margin-top: 2px;
	font-size: 15px;
	line-height: 1.6;
	color: var(--ink-2);
}

.st-card small {
	display: block;
	margin-top: 4px;
	font-size: 13px;
	line-height: 1.4;
	color: var(--ink-3);
}

@keyframes st-in {
	from {
		opacity: 0;
	}
}

.standees {
	position: absolute;
	inset: 0;
	pointer-events: none;
	overflow: hidden;
	--s: 42px;
}

.standee {
	position: absolute;
	left: 0;
	top: 0;
	will-change: transform;
	perspective: 500px;
	cursor: pointer;
}

.standee.focus {
	cursor: default;
}

.lv-japan .paper {
	pointer-events: auto;
}

.lv-japan .paper::after {
	content: '';
	position: absolute;
	inset: -6px;
}

.paper {
	position: absolute;
	left: calc(var(--s) / -2);
	bottom: 0;
	width: var(--s);
	height: var(--s);
	transform-origin: 50% 100%;
	filter: drop-shadow(3px 5px 3px rgba(30, 20, 10, 0.3));
}

.labels,
.marks {
	position: absolute;
	inset: 0;
	pointer-events: none;
	overflow: hidden;
	user-select: none;
	-webkit-user-select: none;
}

.label,
.mark {
	position: absolute;
	left: 0;
	top: 0;
	pointer-events: auto;
	will-change: transform;
}

.in {
	position: absolute;
	display: block;
	white-space: nowrap;
}

.label:focus-visible,
.mark:focus-visible {
	outline: none;
}

.label:focus-visible .in,
.mark:focus-visible .stamp {
	outline: 3px solid var(--shu);
	outline-offset: 4px;
}

.label.region:focus-visible .in,
.mark:focus-visible .stamp {
	border-radius: 6px;
}

.mark.cluster:focus-visible .stamp {
	border-radius: 50%;
}

.region .in {
	left: var(--sx, 0px);
	bottom: calc(8px - var(--sy, 0px));
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 4px;
	translate: -50% 0;
	text-shadow: 0 0 10px var(--desk), 0 0 3px var(--desk), 0 0 2px var(--desk);
	transition: left 0.3s var(--ease-out), bottom 0.3s var(--ease-out), top 0.3s var(--ease-out);
}

.region.below .in {
	bottom: auto;
	top: calc(8px + var(--sy, 0px));
}

.region .ja small {
	font-size: 0.65em;
}

.region .ja {
	writing-mode: vertical-rl;
	font-size: 24px;
	font-weight: 800;
	letter-spacing: 0.16em;
	line-height: 1;
	transition: color 0.3s var(--ease-out);
}

.region .ja::before {
	content: '';
	display: block;
	width: 9px;
	height: 9px;
	margin: 0 auto 6px;
	border-radius: 50%;
	background: var(--rc);
	box-shadow: 0 0 0 2px var(--desk);
}

.region .ro {
	font-size: 14px;
	font-style: italic;
	color: var(--ink-2);
	letter-spacing: 0.06em;
}

.region.hot .ja {
	color: var(--shu);
}

.labels.compact .region .in {
	top: var(--sy, 0px);
	bottom: auto;
	flex-direction: row;
	translate: -50% -50%;
	padding: 3px 10px 4px 8px;
	border-radius: 999px;
	background: color-mix(in srgb, var(--card) 90%, transparent);
	border: 1px solid var(--card-edge);
	box-shadow: 0 6px 16px -10px rgba(40, 30, 15, 0.45);
	text-shadow: none;
}

.labels.compact .region .ja {
	display: flex;
	align-items: center;
	writing-mode: horizontal-tb;
	font-size: 16px;
	letter-spacing: 0.04em;
}

.labels.compact .region .ja small {
	font-size: 0.8em;
}

.labels.compact .region .ja::before {
	width: 8px;
	height: 8px;
	margin: 0 5px 0 0;
	box-shadow: none;
}

.labels.compact .region .ro {
	display: none;
}

.labels.compact .tie {
	height: 1px;
	margin-top: -0.5px;
}

.labels.compact .tie::before {
	left: -3px;
	top: -2.5px;
	width: 6px;
	height: 6px;
	box-shadow: 0 0 0 1px var(--card);
}

.label.sea {
	pointer-events: none;
}

.sea .in {
	translate: -50% -50%;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 2px;
	color: var(--ink-2);
	opacity: 0.62;
}

.sea .ja {
	font-size: 20px;
	font-weight: 500;
	letter-spacing: 0.6em;
	margin-right: -0.6em;
}

.sea .ro {
	font-size: 14px;
	font-style: italic;
	letter-spacing: 0.08em;
}

.pref .in {
	left: var(--sx, 0px);
	top: var(--sy, 0px);
	translate: -50% -50%;
	padding: 3px 12px 4px;
	border-radius: 999px;
	font-size: 15px;
	font-weight: 700;
	background: color-mix(in srgb, var(--card) 90%, transparent);
	border: 1px solid var(--card-edge);
	box-shadow: 0 6px 16px -10px rgba(40, 30, 15, 0.45);
	transition: background-color 0.25s, color 0.25s, scale 0.35s var(--ease-out), left 0.3s var(--ease-out), top 0.3s var(--ease-out);
}

.tie {
	position: absolute;
	left: 0;
	top: 0;
	width: var(--len, 0px);
	height: 1.5px;
	margin-top: -0.75px;
	background: var(--ink-2);
	transform-origin: 0 50%;
	rotate: var(--ang, 0rad);
	opacity: 0;
	pointer-events: none;
	transition: opacity 0.3s, width 0.3s var(--ease-out), rotate 0.3s var(--ease-out);
}

.tie::before {
	content: '';
	position: absolute;
	left: -4px;
	top: -3.25px;
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: var(--ink-2);
	box-shadow: 0 0 0 2px var(--card);
}

.pref.tied .tie,
.region.tied .tie {
	opacity: 0.7;
}

.label.away,
.standee.away {
	visibility: hidden;
}

.pref .cnt {
	display: inline-grid;
	place-items: center;
	min-width: 22px;
	height: 22px;
	margin-left: 6px;
	padding: 0 5px;
	border-radius: 999px;
	background: var(--shu);
	color: var(--shu-ink);
	font-family: var(--font-sans);
	font-size: 14px;
	font-weight: 700;
	vertical-align: 1px;
}

.pref.muted .in {
	font-size: 15px;
	color: var(--ink-2);
	background: color-mix(in srgb, var(--card) 70%, transparent);
	box-shadow: none;
}

.pref.hot .in {
	background: var(--ink);
	color: var(--paper);
	scale: 1.06;
}

.mark {
	z-index: 1;
	transition: opacity 0.35s var(--ease-out);
}

.mark.hot,
.mark.holds-hot {
	z-index: 3;
}

.mark.off,
.mark.merged {
	opacity: 0;
}

.mark.off,
.mark.merged,
.mark.off *,
.mark.merged * {
	pointer-events: none !important;
}

.stamp {
	position: absolute;
	left: -17px;
	top: -17px;
	width: 34px;
	height: 34px;
}

.seal,
.count {
	position: absolute;
	inset: 0;
	display: grid;
	place-items: center;
	line-height: 1;
	transition: background-color 0.3s, color 0.3s, rotate 0.45s var(--ease-out), scale 0.35s var(--ease-out), opacity 0.25s;
}

.seal {
	border-radius: 5px;
	background: var(--shu);
	color: var(--shu-ink);
	font-size: 19px;
	font-weight: 800;
	rotate: -6deg;
	box-shadow: inset 0 0 0 2.5px var(--shu), inset 0 0 0 3.5px color-mix(in srgb, var(--shu-ink) 75%, transparent), 0 4px 8px -2px rgba(30, 20, 10, 0.4);
}

.mark.hot .seal {
	rotate: 0deg;
	background: var(--ink);
	color: var(--paper);
	box-shadow: inset 0 0 0 2.5px var(--ink), inset 0 0 0 3.5px color-mix(in srgb, var(--paper) 70%, transparent), 0 6px 12px -3px rgba(30, 20, 10, 0.5);
}

.mark.dim .seal {
	scale: 0.78;
	opacity: 0.75;
}

.mark.wish .stamp::before,
.mark.wish .stamp::after {
	content: '';
	position: absolute;
	z-index: 1;
	clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 74%, 0 100%);
	pointer-events: none;
}

.mark.wish .stamp::before {
	right: -6px;
	top: -7px;
	width: 17px;
	height: 21px;
	background: var(--card);
}

.mark.wish .stamp::after {
	right: -3.5px;
	top: -5px;
	width: 12px;
	height: 15px;
	background: var(--ink);
}

.count {
	inset: -2px;
	border-radius: 50%;
	background: var(--card);
	color: var(--shu);
	border: 2.5px solid var(--shu);
	font-size: 21px;
	font-weight: 700;
	opacity: 0;
	box-shadow: 0 0 0 3px color-mix(in srgb, var(--card) 70%, transparent), 0 4px 10px -2px rgba(30, 20, 10, 0.4);
}

.mark.cluster .seal {
	opacity: 0;
}

.mark.cluster .count {
	opacity: 1;
}

.mark.cluster:hover .count,
.mark.cluster:focus-visible .count,
.mark.holds-hot .count {
	background: var(--shu);
	color: var(--shu-ink);
}

.name {
	position: absolute;
	left: 23px;
	top: -15px;
	height: 30px;
	padding: 0 11px;
	display: flex;
	align-items: center;
	white-space: nowrap;
	font-size: 15px;
	font-weight: 700;
	border-radius: 4px;
	background: var(--card);
	border: 1px solid var(--card-edge);
	box-shadow: 0 8px 18px -10px rgba(40, 30, 15, 0.55);
	opacity: 0;
	translate: -6px 0;
	pointer-events: none;
	transition: opacity 0.25s, translate 0.35s var(--ease-out), background-color 0.25s, color 0.25s;
}

.mark.left .name {
	left: auto;
	right: 23px;
	translate: 6px 0;
}

.mark.named .name {
	opacity: 1;
	translate: 0 0;
	pointer-events: auto;
}

.mark.dim .name {
	font-size: 15px;
	color: var(--ink-2);
}

.mark.hot .name {
	background: var(--ink);
	color: var(--paper);
}

.ripple {
	position: absolute;
	left: -18px;
	top: -18px;
	width: 36px;
	height: 36px;
	border-radius: 50%;
	border: 2px solid var(--shu);
	opacity: 0;
	pointer-events: none;
}

.compass {
	position: absolute;
	right: calc(var(--panel-w, 0px) + 14px);
	bottom: 82px;
	z-index: 4;
	width: 52px;
	height: 52px;
	padding: 0;
	border-radius: 50%;
	background: color-mix(in srgb, var(--card) 88%, transparent);
	box-shadow: 0 8px 20px -10px rgba(30, 20, 10, 0.5);
}

.compass:disabled {
	cursor: default;
}

.compass svg {
	display: block;
	width: 100%;
	height: 100%;
	overflow: visible;
}

.compass .ring {
	fill: none;
	stroke: var(--shu);
	stroke-width: 2.2;
}

.compass .ring.thin {
	stroke-width: 0.8;
}

.compass .needle {
	fill: var(--ink-3);
}

.compass .needle.north {
	fill: var(--shu);
}

.compass .needle.cross {
	fill: var(--ink-3);
	opacity: 0.45;
}

.compass .dir {
	font-family: var(--font-mincho);
	font-size: 10px;
	font-weight: 800;
	fill: var(--shu);
	text-anchor: middle;
}

.reset {
	position: absolute;
	left: 20px;
	bottom: 20px;
	z-index: 4;
	display: flex;
	align-items: center;
	gap: 8px;
	min-height: 46px;
	padding: 0 20px;
	border-radius: 999px;
	font-size: 16px;
	font-weight: 700;
	background: var(--ink);
	color: var(--paper);
	box-shadow: 0 10px 24px -10px rgba(20, 15, 10, 0.6);
	transition: background-color 0.25s;
}

.reset svg {
	width: 22px;
	height: 22px;
	fill: none;
	stroke: currentColor;
	stroke-width: 2.2;
	stroke-linecap: round;
}

.reset:hover {
	background: var(--shu);
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.3s, translate 0.4s var(--ease-out);
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
	translate: 0 10px;
}

.fallback {
	position: absolute;
	top: 40%;
	left: 24px;
	right: 24px;
	text-align: center;
	font-size: 18px;
	color: var(--ink-2);
}

.loader {
	position: absolute;
	top: 0;
	bottom: 0;
	left: 0;
	right: calc(clamp(360px, 31vw, 450px) + 20px);
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 14px;
	pointer-events: none;
}

.loader svg {
	width: 96px;
	height: 96px;
}

.loader path {
	fill: none;
	stroke: var(--shu);
	stroke-width: 5;
	stroke-linecap: round;
}

.loader p {
	font-size: 17px;
	font-weight: 700;
	letter-spacing: 0.3em;
	margin-right: -0.3em;
	color: var(--ink-2);
}

.loader-leave-active {
	transition: opacity 0.5s;
}

.loader-leave-to {
	opacity: 0;
}

.panel {
	position: absolute;
	top: calc(var(--header-h) + 8px);
	right: 20px;
	bottom: 20px;
	width: clamp(360px, 31vw, 450px);
	border-radius: 10px;
	background: var(--card);
	border: 1px solid var(--card-edge);
	box-shadow: var(--shadow-card);
	overflow: hidden;
	z-index: 5;
	display: flex;
	flex-direction: column;
}

.panel-body {
	flex: 1;
	min-height: 0;
}

.sheet-bar {
	display: none;
}

@media (max-width: 760px) {
	.panel {
		top: auto;
		left: 10px;
		right: 10px;
		bottom: 10px;
		width: auto;
		height: 46dvh;
	}

	.panel.collapsed {
		height: 64px;
	}

	.panel.full {
		height: calc(100dvh - var(--header-h) - 14px);
	}

	.loader {
		right: 0;
		bottom: calc(46dvh + 10px);
	}

	.panel.collapsed .panel-body {
		visibility: hidden;
		transition: visibility 0s 0.5s;
	}

	.sheet-bar {
		position: relative;
		display: flex;
		align-items: center;
		gap: 8px;
		flex: none;
		height: 64px;
		padding: 10px 10px 4px;
		border-bottom: 1px solid var(--line);
		touch-action: none;
	}

	.panel.collapsed .sheet-bar {
		border-bottom-color: transparent;
	}

	.panel:not(.collapsed) .sheet-bar {
		height: 54px;
	}

	.grip {
		position: absolute;
		left: 50%;
		top: 6px;
		width: 40px;
		height: 4px;
		margin-left: -20px;
		border-radius: 2px;
		background: var(--line-strong);
	}

	.sheet-back {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		flex: none;
		min-height: 44px;
		padding: 0 14px 0 12px;
		border-radius: 999px;
		border: 1.5px solid var(--line-strong);
		font-size: 15px;
		font-weight: 700;
	}

	.sheet-toggle {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		min-height: 44px;
		padding: 0 6px 0 8px;
		border-radius: 8px;
	}

	.sheet-toggle.grow {
		flex: none;
	}

	.sheet-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 17px;
		font-weight: 700;
	}

	.sheet-act {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		flex: none;
		margin-left: auto;
		font-size: 15px;
		font-weight: 700;
		color: var(--shu);
	}

	.sheet-act i {
		font-style: normal;
		font-size: 12px;
	}

	.reset {
		left: 0;
		right: 0;
		width: fit-content;
		margin: 0 auto;
		bottom: calc(var(--sheet, 46dvh) + 12px);
	}

	.compass {
		left: 14px;
		right: auto;
		bottom: calc(var(--sheet, 46dvh) + 12px);
		width: 48px;
		height: 48px;
	}

	.sea .ja {
		font-size: 15px;
	}

	.sea .ro {
		display: none;
	}

	.region .ja {
		font-size: 19px;
	}

	.standees {
		--s: 32px;
	}

	.region .ro {
		display: none;
	}
}
</style>
