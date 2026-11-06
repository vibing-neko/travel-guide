<script setup>
import { ref } from 'vue'
import { reduceMotion } from '../motion.js'

const props = defineProps({ def: Object })
const art = ref()
let playing = false

function play() {
	if (playing || reduceMotion || !art.value) return
	playing = true
	props.def.play(art.value).then(() => { playing = false })
}

defineExpose({ play })
</script>

<template>
	<svg ref="art" class="standee-art" viewBox="0 0 100 100" aria-hidden="true" @mouseover="play" @click="play">
		<g filter="url(#paper-cut)" v-html="def.svg" />
	</svg>
</template>

<style>
.standee-art {
	display: block;
	width: 100%;
	height: 100%;
	overflow: visible;
	pointer-events: none;
}

.standee-art * {
	pointer-events: visiblePainted;
}

.standee-art [stroke]:not([fill]),
.standee-art .o:not([fill]),
.standee-art g[stroke]:not([fill]) {
	fill: none;
}

.standee-art .o {
	stroke: #3a2e26;
	stroke-width: 1.6;
	stroke-linejoin: round;
	stroke-linecap: round;
}

.standee-art .o.thin {
	stroke-width: 0.9;
}

.standee-art [stroke] {
	stroke-linecap: round;
	stroke-linejoin: round;
}

.standee-art .kanji {
	font-family: 'Shippori Mincho', serif;
}
</style>
