import { reactive } from 'vue'
import { spotById } from './data/spots.js'

const KEY = 'travel-guide:wishlist'

function load() {
	try {
		const ids = JSON.parse(localStorage.getItem(KEY))
		return Array.isArray(ids) ? ids.filter(id => spotById[id]) : []
	} catch {
		return []
	}
}

export const wishIds = reactive(new Set(load()))

export function toggleWish(id) {
	if (wishIds.has(id)) wishIds.delete(id)
	else wishIds.add(id)
	try { localStorage.setItem(KEY, JSON.stringify([...wishIds])) } catch {}
}

addEventListener('storage', e => {
	if (e.key !== KEY) return
	wishIds.clear()
	load().forEach(id => wishIds.add(id))
})
