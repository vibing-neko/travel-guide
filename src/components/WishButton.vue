<script setup>
import { computed, ref } from 'vue'
import { animate, spring } from 'animejs'
import { wishIds, toggleWish } from '../wishlist.js'
import { reduceMotion } from '../motion.js'

const props = defineProps({ spot: Object, labelled: Boolean })

const on = computed(() => wishIds.has(props.spot.id))
const iconEl = ref()

function onClick() {
	toggleWish(props.spot.id)
	if (!reduceMotion) animate(iconEl.value, { scale: [0.6, 1], ease: spring({ bounce: 0.5, duration: 420 }) })
}
</script>

<template>
	<button
		class="wish"
		:class="{ on, labelled }"
		:aria-label="labelled ? null : `想去：${spot.name}`"
		:aria-pressed="labelled ? null : on"
		:title="on ? '從想去清單移除' : '加入想去清單'"
		@click="onClick"
	>
		<svg ref="iconEl" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3 H18 V21 L12 16.5 L6 21 Z" /></svg>
		<template v-if="labelled">{{ on ? '已加入想去清單' : '加入想去清單' }}</template>
	</button>
</template>

<style scoped>
.wish {
	display: inline-grid;
	place-items: center;
	flex: none;
	width: 44px;
	height: 44px;
	border-radius: 8px;
	color: var(--ink-3);
	transition: background-color 0.2s, color 0.2s, border-color 0.2s;
}

.wish:hover {
	background: var(--hover);
	color: var(--ink);
}

.wish.on {
	color: var(--ink);
}

svg {
	width: 24px;
	height: 24px;
	fill: none;
	stroke: currentColor;
	stroke-width: 2;
	stroke-linejoin: round;
}

.on svg {
	fill: currentColor;
}

.labelled {
	display: inline-flex;
	gap: 8px;
	width: auto;
	min-height: 46px;
	height: auto;
	padding: 0 18px 0 14px;
	border-radius: 999px;
	border: 1.5px solid var(--line-strong);
	color: var(--ink);
	font-size: 16px;
	font-weight: 700;
}

.labelled.on {
	background: var(--ink);
	border-color: var(--ink);
	color: var(--paper);
}

.labelled.on:hover {
	background: var(--ink-2);
	color: var(--paper);
}
</style>
