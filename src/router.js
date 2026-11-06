import { createRouter, createWebHistory } from 'vue-router'
import MapView from './views/MapView.vue'
import { spotById, loadDetails } from './data/spots.js'
import { pageMeta } from './pageMeta.js'

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{ path: '/spot/:id', name: 'spot', component: () => import('./views/SpotView.vue') },
		{ path: '/wishlist', name: 'wishlist', component: () => import('./views/WishlistView.vue') },
		{ path: '/:region?/:pref?', name: 'map', component: MapView },
		{ path: '/:rest(.*)*', redirect: '/' },
	],
	scrollBehavior: (to, from, saved) => saved || { top: 0 },
})

router.beforeEach(to => {
	if (to.path.length > 1 && to.path.endsWith('/')) return { path: to.path.slice(0, -1), query: to.query, hash: to.hash, replace: true }
})

router.beforeResolve(async to => {
	if (to.name !== 'spot') return
	const spot = spotById[to.params.id]
	if (!spot) return '/'
	await loadDetails(spot.region)
})

router.afterEach(to => {
	document.title = pageMeta(to).title
})

export default router
