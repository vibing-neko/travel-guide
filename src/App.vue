<script setup>
import { RouterLink, RouterView, useRoute } from 'vue-router'
import SiteSearch from './components/SiteSearch.vue'
import { wishIds } from './wishlist.js'

const route = useRoute()
</script>

<template>
	<header class="site-header">
		<RouterLink to="/" class="brand" aria-label="旅帖 回到全日本">
			<span class="seal mincho" aria-hidden="true"><span>旅</span><span>帖</span></span>
			<span class="wordmark">
				<span class="latin">TABICHŌ</span>
				<span class="sub">日本旅行手帖</span>
			</span>
		</RouterLink>
		<div class="tools">
			<RouterLink to="/wishlist" class="wish-link" :aria-label="`想去清單，${wishIds.size} 處景點`">
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3 H18 V21 L12 16.5 L6 21 Z" /></svg>
				想去
				<b v-if="wishIds.size" aria-hidden="true">{{ wishIds.size }}</b>
			</RouterLink>
			<SiteSearch />
		</div>
	</header>
	<RouterView v-slot="{ Component }">
		<Transition name="page" mode="out-in">
			<KeepAlive include="MapView">
				<component :is="Component" :key="route.name === 'map' ? 'map' : route.fullPath" />
			</KeepAlive>
		</Transition>
	</RouterView>
</template>

<style scoped>
.site-header {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 20;
	height: var(--header-h);
	padding: 0 clamp(16px, 2.4vw, 28px);
	display: flex;
	align-items: center;
	justify-content: space-between;
	pointer-events: none;
}

.site-header > * {
	pointer-events: auto;
}

.brand {
	display: flex;
	align-items: center;
	min-height: 44px;
	gap: 12px;
}

.seal {
	display: grid;
	place-items: center;
	width: 38px;
	height: 38px;
	padding: 3px 0;
	background: var(--shu);
	color: var(--shu-ink);
	border-radius: 4px;
	font-size: 15px;
	font-weight: 800;
	line-height: 1;
	transform: rotate(-4deg);
	box-shadow: 0 0 0 2px var(--paper), 0 0 0 3px var(--shu);
	transition: transform 0.5s var(--ease-out);
}

.seal span {
	display: block;
}

.brand:hover .seal {
	transform: rotate(0deg) scale(1.04);
}

.wordmark {
	display: flex;
	flex-direction: column;
	line-height: 1.1;
}

.wordmark .latin {
	font-size: 19px;
	font-weight: 600;
	letter-spacing: 0.22em;
}

.wordmark .sub {
	font-size: 13px;
	letter-spacing: 0.3em;
	color: var(--ink-3);
}

.tools {
	display: flex;
	align-items: center;
	gap: 8px;
}

.wish-link {
	display: inline-flex;
	align-items: center;
	gap: 7px;
	min-height: 44px;
	padding: 0 14px 0 12px;
	border-radius: 999px;
	background: var(--card);
	box-shadow: 0 8px 20px -10px rgba(30, 20, 10, 0.5);
	font-size: 16px;
	font-weight: 700;
	transition: background-color 0.2s, color 0.2s;
}

.wish-link:hover {
	background: var(--ink);
	color: var(--paper);
}

.wish-link svg {
	width: 22px;
	height: 22px;
	fill: none;
	stroke: currentColor;
	stroke-width: 2.2;
	stroke-linejoin: round;
}

.wish-link b {
	min-width: 22px;
	height: 22px;
	padding: 0 6px;
	border-radius: 999px;
	background: var(--shu);
	color: var(--shu-ink);
	font-size: 14px;
	line-height: 22px;
	text-align: center;
}

@media (max-width: 480px) {
	.wordmark {
		display: none;
	}
}

.page-enter-active,
.page-leave-active {
	transition: opacity 0.28s var(--ease-out);
}

.page-enter-from,
.page-leave-to {
	opacity: 0;
}
</style>
