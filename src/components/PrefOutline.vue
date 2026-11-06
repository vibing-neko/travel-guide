<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { createDrawable, createTimeline, onScroll, utils } from 'animejs'
import { prefShape, placeIn } from '../map/projection.js'
import { reduceMotion } from '../motion.js'

const props = defineProps({ code: Number, lon: Number, lat: Number })

const SIZE = 100
const PAD = 8

const geo = computed(() => {
	const { polygons, box: main } = prefShape(props.code)
	const pt = placeIn(props.lon, props.lat, props.code)
	const box = {
		minX: Math.min(main.minX, pt[0]), maxX: Math.max(main.maxX, pt[0]),
		minY: Math.min(main.minY, pt[1]), maxY: Math.max(main.maxY, pt[1]),
	}
	const inBox = ([x, y]) => x >= box.minX && x <= box.maxX && y >= box.minY && y <= box.maxY
	const w = box.maxX - box.minX, h = box.maxY - box.minY
	const k = (SIZE - PAD * 2) / Math.max(w, h)
	const ox = PAD + (SIZE - PAD * 2 - w * k) / 2, oy = PAD + (SIZE - PAD * 2 - h * k) / 2
	const tx = ([x, y]) => [ox + (x - box.minX) * k, oy + (box.maxY - y) * k]
	const d = polygons
		.filter(p => p.main || p.rings[0].every(inBox))
		.flatMap(p => p.rings)
		.map(r => 'M' + r.map(pt => tx(pt).map(n => n.toFixed(2)).join(' ')).join('L') + 'Z')
		.join('')
	const [dx, dy] = tx(pt)
	return { d, dx, dy }
})

const root = ref()
let tl = null

onMounted(() => {
	if (reduceMotion) return
	const [path] = createDrawable(root.value.querySelector('.outline'))
	const dot = root.value.querySelector('.dot')
	const ring = root.value.querySelector('.ring')
	utils.set(dot, { scale: 0 })
	utils.set(ring, { scale: 0, opacity: 0 })
	tl = createTimeline({ autoplay: onScroll({ target: root.value, enter: 'bottom-=60 top', repeat: false }) })
		.add(path, { draw: ['0 0', '0 1'], duration: 1600, ease: 'inOut(3)' })
		.add(dot, { scale: [0, 1], duration: 600, ease: 'outBack(3)' }, '-=300')
		.add(ring, { scale: [0.4, 2.4], opacity: [0.8, 0], duration: 1100, ease: 'out(3)' }, '-=400')
})

onBeforeUnmount(() => tl?.revert())
</script>

<template>
	<svg ref="root" class="pref-outline" :viewBox="`0 0 ${SIZE} ${SIZE}`" role="img" aria-label="景點在縣內的位置">
		<path class="outline" :d="geo.d" vector-effect="non-scaling-stroke" />
		<circle class="ring" :cx="geo.dx" :cy="geo.dy" r="3" />
		<circle class="dot" :cx="geo.dx" :cy="geo.dy" r="2.2" />
	</svg>
</template>

<style scoped>
.pref-outline {
	display: block;
	width: 100%;
	height: auto;
	overflow: visible;
}

.outline {
	fill: color-mix(in srgb, var(--rc) 14%, transparent);
	stroke: var(--ink);
	stroke-width: 1.2;
	stroke-linejoin: round;
}

.dot {
	fill: var(--shu);
	transform-box: fill-box;
	transform-origin: center;
}

.ring {
	fill: none;
	stroke: var(--shu);
	stroke-width: 0.6;
	transform-box: fill-box;
	transform-origin: center;
	opacity: 0;
}
</style>
