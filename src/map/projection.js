import geo from '../data/japan.geo.json'

const LON0 = 137.2
const LAT0 = 37.5
const KX = Math.cos(LAT0 * Math.PI / 180)
const OKINAWA_SHIFT = [4.6, 14.4]

export function project(lon, lat, code) {
	if (code === 47) {
		lon += OKINAWA_SHIFT[0]
		lat += OKINAWA_SHIFT[1]
	}
	return [(lon - LON0) * KX, lat - LAT0]
}

const ringArea = ring => {
	let a = 0
	for (let i = 0; i < ring.length; i++) {
		const [x1, y1] = ring[i]
		const [x2, y2] = ring[(i + 1) % ring.length]
		a += x1 * y2 - x2 * y1
	}
	return a / 2
}

const ringCentroid = ring => {
	let cx = 0, cy = 0, a = 0
	for (let i = 0; i < ring.length; i++) {
		const [x1, y1] = ring[i]
		const [x2, y2] = ring[(i + 1) % ring.length]
		const f = x1 * y2 - x2 * y1
		cx += (x1 + x2) * f
		cy += (y1 + y2) * f
		a += f
	}
	return [cx / (3 * a), cy / (3 * a)]
}

const cache = new Map()

export function prefShape(code) {
	if (cache.has(code)) return cache.get(code)
	const f = geo.features.find(f => f.properties.code === code)
	const raw = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
	const polygons = raw.map(rings => {
		const projected = rings.map(r => r.slice(0, -1).map(([lon, lat]) => project(lon, lat, code)))
		return { rings: projected, area: Math.abs(ringArea(projected[0])) }
	})
	const largest = polygons.reduce((a, b) => (b.area > a.area ? b : a))
	polygons.forEach(p => { p.main = p.area >= largest.area * 0.12 })
	const box = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
	for (const p of polygons) {
		if (!p.main) continue
		for (const [x, y] of p.rings[0]) {
			box.minX = Math.min(box.minX, x)
			box.maxX = Math.max(box.maxX, x)
			box.minY = Math.min(box.minY, y)
			box.maxY = Math.max(box.maxY, y)
		}
	}
	const shape = { polygons, box, center: ringCentroid(largest.rings[0]), area: largest.area }
	cache.set(code, shape)
	return shape
}

const inRing = ([x, y], ring) => {
	let c = false
	for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
		const [xi, yi] = ring[i], [xj, yj] = ring[j]
		if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c
	}
	return c
}
const inShape = (pt, shape) => shape.polygons.some(p => inRing(pt, p.rings[0]) && !p.rings.slice(1).some(h => inRing(pt, h)))

function nearest([x, y], shape) {
	let best = { d: Infinity }
	for (const p of shape.polygons) {
		const r = p.rings[0]
		for (let i = 0; i < r.length; i++) {
			const [x1, y1] = r[i], [x2, y2] = r[(i + 1) % r.length]
			const dx = x2 - x1, dy = y2 - y1
			const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy || 1)))
			const px = x1 + t * dx, py = y1 + t * dy
			const d = Math.hypot(x - px, y - py)
			if (d < best.d) best = { d, pt: [px, py], n: [-dy, dx].map(v => v / (Math.hypot(dx, dy) || 1)) }
		}
	}
	return best
}

export function placeIn(lon, lat, code) {
	const pt = project(lon, lat, code)
	const own = prefShape(code)
	if (code === 47 || inShape(pt, own)) return pt
	const other = geo.features.some(f => f.properties.code !== code && f.properties.code !== 47 && inShape(pt, prefShape(f.properties.code)))
	if (!other) return pt
	const mine = nearest(pt, own)
	const e = 0.006
	const a = [mine.pt[0] + mine.n[0] * e, mine.pt[1] + mine.n[1] * e]
	return inShape(a, own) ? a : [mine.pt[0] - mine.n[0] * e, mine.pt[1] - mine.n[1] * e]
}
