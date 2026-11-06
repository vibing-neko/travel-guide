import * as THREE from 'three'
import { animate, createAnimatable, spring, stagger, utils } from 'animejs'
import 'animejs/adapters/three'
import { regions, regionById, regionOf } from '../data/regions.js'
import { spots, spotById } from '../data/spots.js'
import { project, prefShape, placeIn } from './projection.js'
import { washiTexture, prefTexture, seaTexture } from './textures.js'
import { STANDEES } from './standees.js'
import { SEA_NAMES } from './sea.js'
import { reduceMotion } from '../motion.js'

const DEG = Math.PI / 180
const FOV = 32
const BASE_TILT = 46
const JAPAN_BOX = { minX: -7.2, maxX: 7, minY: -9.4, maxY: 8.2 }
const HEIGHT = { hokkaido: 0.2, tohoku: 0.26, kanto: 0.22, chubu: 0.3, kansai: 0.24, chugoku: 0.2, shikoku: 0.17, kyushu: 0.24, okinawa: 0.16 }
const ZK = { japan: 1, region: 0.55, pref: 0.18 }
const PAD = { japan: 1.12, region: 1.3, pref: 1.35 }
const lookHeight = k => Math.min(0.2, 0.45 * k)
const MIN_SIZE = { japan: 3, region: 0.5, pref: 0.08 }
const SNAP = 0.9
const UNIT_BOX = { minX: 0, maxX: 1, minY: 0, maxY: 1 }

const PAL = {
	bg: '#b4c6cf', land: '#fbf8f0', dim: '#ece6d9', dimSide: '#cfc6b2', line: '#3a342b', lineOpacity: 0.45, guideOpacity: 0.18,
	sky: '#fffaf0', ground: '#d9cfbb', hemi: 1.9, sun: '#fff1da', sunI: 2.1,
}

const mixColor = (a, b, t) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString()
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const hoverEase = spring({ bounce: 0.35, duration: 420 })

export class JapanScene {
	constructor(canvas, { surface = canvas, onHover, onPick, onRender, onMove, onZoom, skipIntro = false } = {}) {
		this.canvas = canvas
		this.surface = surface
		this.onZoom = onZoom
		this.onHover = onHover
		this.onPick = onPick
		this.onRender = onRender
		this.onMove = onMove
		this.width = 1
		this.height = 1
		this.insets = { top: 0, right: 0, bottom: 0 }
		this.state = { level: 'japan', region: null, pref: null, hover: {} }
		this.dirty = true
		this.raf = 0
		this.flight = null
		this.invalidate = () => { this.dirty = true }
		this.applyCamera = this.applyCamera.bind(this)

		this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
		const phone = matchMedia('(pointer: coarse)').matches
		this.renderer.setPixelRatio(Math.min(devicePixelRatio, phone ? 1.5 : 2))
		this.renderer.shadowMap.enabled = true
		this.renderer.shadowMap.type = THREE.PCFShadowMap

		this.scene = new THREE.Scene()
		this.scene.background = new THREE.Color(PAL.bg)
		this.scene.fog = new THREE.Fog(PAL.bg, 10, 40)
		this.camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 300)
		this.camera.up.set(0, 0, 1)
		const settled = reduceMotion || skipIntro
		this.cam = { tx: 0, ty: 0, tz: 0.2, dist: 40, tilt: settled ? BASE_TILT : 6, azim: settled ? 0 : -16, offX: 0, offY: 0 }
		this.rotor = createAnimatable(this.cam, { azim: 600, tilt: 600, ease: 'out(4)', onUpdate: this.applyCamera })

		this.hemi = new THREE.HemisphereLight(PAL.sky, PAL.ground, PAL.hemi)
		this.sun = new THREE.DirectionalLight(PAL.sun, PAL.sunI)
		this.sun.castShadow = true
		const shadowSize = phone ? 1024 : 2048
		this.sun.shadow.mapSize.set(shadowSize, shadowSize)
		this.sun.shadow.radius = phone ? 2 : 4
		this.sun.shadow.bias = -0.0004
		this.sun.shadow.normalBias = 0.02
		this.scene.add(this.hemi, this.sun, this.sun.target)

		this.washi = washiTexture()
		this.textures = [this.washi]
		this.seaMat = new THREE.MeshStandardMaterial({ map: seaTexture(), roughness: 1, color: PAL.bg })
		this.textures.push(this.seaMat.map)
		const sea = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), this.seaMat)
		sea.receiveShadow = true
		this.scene.add(sea)

		this.lineMat = new THREE.LineBasicMaterial({ transparent: true, color: PAL.line, opacity: PAL.lineOpacity })
		this.guideMat = new THREE.LineDashedMaterial({ transparent: true, color: PAL.line, opacity: PAL.guideOpacity, dashSize: 0.1, gapSize: 0.14 })
		this.focusLineMat = new THREE.LineBasicMaterial({ transparent: true, color: PAL.line, opacity: 0.95 })
		this.proxyMat = new THREE.MeshBasicMaterial()

		this.anchors = new Map()
		this.buildGuides()
		this.buildPrefs()
		this.buildSpotAnchors()
		this.applyState({ duration: 0 })
		this.flowerQueue = [...this.prefs.keys()]

		this.raycaster = new THREE.Raycaster()
		this.ndc = new THREE.Vector2()
		this.tmp = new THREE.Vector3()
		this.down = null
		this.listen()
		this.loop = this.loop.bind(this)
	}

	buildGuides() {
		const segs = []
		for (let lon = 128; lon <= 146; lon += 2) segs.push([project(lon, 26), project(lon, 46)])
		for (let lat = 26; lat <= 46; lat += 2) segs.push([project(127, lat), project(147, lat)])
		const ok = prefShape(47).polygons.flatMap(p => p.rings[0])
		const xs = ok.map(p => p[0]), ys = ok.map(p => p[1])
		const [x0, x1, y0, y1] = [Math.min(...xs) - 0.4, Math.max(...xs) + 0.4, Math.min(...ys) - 0.4, Math.max(...ys) + 0.4]
		const frame = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(([x, y]) => new THREE.Vector3(x, y, 0.004))
		this.scene.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(frame), this.lineMat))
		const pts = segs.flatMap(([a, b]) => [new THREE.Vector3(a[0], a[1], 0.004), new THREE.Vector3(b[0], b[1], 0.004)])
		const lines = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), this.guideMat)
		lines.computeLineDistances()
		this.scene.add(lines)
	}

	buildPrefs() {
		this.prefs = new Map()
		for (const region of regions) {
			const h = HEIGHT[region.id]
			const members = region.prefs.map(code => ({ code, shape: prefShape(code) }))
			const total = members.reduce((s, m) => s + m.shape.area, 0)
			const rc = new THREE.Vector2(
				members.reduce((s, m) => s + m.shape.center[0] * m.shape.area, 0) / total,
				members.reduce((s, m) => s + m.shape.center[1] * m.shape.area, 0) / total,
			)
			this.anchors.set('r-' + region.id, new THREE.Vector3(rc.x, rc.y, h))

			for (const { code, shape } of members) {
				const shapes = shape.polygons.map(p => {
					const s = new THREE.Shape(p.rings[0].map(([x, y]) => new THREE.Vector2(x, y)))
					s.holes = p.rings.slice(1).map(r => new THREE.Path(r.map(([x, y]) => new THREE.Vector2(x, y))))
					return s
				})
				const geometry = new THREE.ExtrudeGeometry(shapes, { depth: h, bevelEnabled: false, curveSegments: 1 })
				const top = new THREE.MeshStandardMaterial({ map: this.washi, roughness: 0.92 })
				const side = new THREE.MeshStandardMaterial({ roughness: 0.75 })
				const mesh = new THREE.Mesh(geometry, [top, side])
				mesh.castShadow = mesh.receiveShadow = true
				mesh.userData.code = code
				const pts = []
				for (const p of shape.polygons) {
					for (const ring of p.rings) {
						ring.forEach(([x, y], i) => {
							const [nx, ny] = ring[(i + 1) % ring.length]
							pts.push(new THREE.Vector3(x, y, h + 0.003), new THREE.Vector3(nx, ny, h + 0.003))
						})
					}
				}
				const line = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), this.lineMat)
				mesh.add(line)
				const anchor = new THREE.Object3D()
				anchor.position.set(shape.center[0], shape.center[1], h)
				mesh.add(anchor)
				this.anchors.set('p-' + code, anchor)

				const center = new THREE.Vector2(...shape.center)
				const dir = center.clone().sub(rc)
				if (dir.lengthSq() > 0) dir.normalize()
				const proxy = new THREE.Mesh(geometry, this.proxyMat)
				proxy.visible = false
				proxy.userData.code = code
				this.prefs.set(code, { code, region, mesh, proxy, line, top, side, center, dir, height: h, box: shape.box, area: shape.area, key: '' })
				this.scene.add(mesh, proxy)
			}
		}
		this.pickables = [...this.prefs.values()].map(p => p.proxy)
	}

	growFlowers() {
		const idle = window.requestIdleCallback ?? (fn => setTimeout(fn, 60))
		const step = () => {
			const q = this.flowerQueue
			if (!q?.length) return
			if (this.flight || this.glide) return setTimeout(() => idle(step), 200)
			const { pref, region } = this.state
			const rank = code => code === pref ? 0 : this.prefs.get(code).region.id === region ? 1 : 2
			const code = q.reduce((best, c) => rank(c) < rank(best) ? c : best)
			q.splice(q.indexOf(code), 1)
			const flower = prefTexture(code)
			if (flower) {
				this.textures.push(flower)
				this.prefs.get(code).top.map = flower
				this.invalidate()
			}
			idle(step)
		}
		idle(step)
	}

	buildSpotAnchors() {
		for (const d of STANDEES) {
			const p = this.prefs.get(d.code)
			const [x, y] = project(d.lon, d.lat, d.code)
			const anchor = new THREE.Object3D()
			anchor.position.set(x, y, p.height)
			p.mesh.add(anchor)
			this.anchors.set('d-' + d.code, anchor)
			if (d.rep) this.anchors.set('dr-' + d.code, new THREE.Vector3(...project(d.repLon, d.repLat, d.code), 0))
		}
		for (const n of SEA_NAMES) this.anchors.set('sn-' + n.id, new THREE.Vector3(...project(n.lon, n.lat), 0))
		for (const spot of spots) {
			const p = this.prefs.get(spot.pref)
			const [x, y] = placeIn(spot.lon, spot.lat, spot.pref)
			const anchor = new THREE.Object3D()
			anchor.position.set(x, y, p.height)
			p.mesh.add(anchor)
			this.anchors.set('s-' + spot.id, anchor)
		}
	}

	listen() {
		const c = this.canvas
		const fingers = new Map()
		const release = (e, pick) => {
			const pinching = fingers.size > 1
			fingers.delete(e.pointerId)
			if (this.swallow) setTimeout(() => { this.swallow = false }, 300)
			if (pinching) {
				if (fingers.size < 2) this.settle()
				for (const [id, f] of fingers) this.down = { id, x: f.x, y: f.y, moved: true, pan: true }
				return
			}
			const d = this.down
			if (d?.id !== e.pointerId) return
			this.down = null
			c.style.cursor = 'grab'
			if (!pick || d.moved || !d.onMap) return
			if (d.mouse) this.onPick?.(this.pick(e), e)
			else this.tap = e
		}
		const onSurface = {
			wheel: e => {
				e.preventDefault()
				const dy = clamp(e.deltaY * (e.deltaMode === 1 ? 33 : 1), -150, 150)
				this.moveView(e.clientX, e.clientY, e.clientX, e.clientY, Math.exp(dy * (e.ctrlKey ? 0.01 : 0.003)), true)
				clearTimeout(this.settleTimer)
				this.settleTimer = setTimeout(() => this.settle(), 200)
			},
			pointerdown: e => {
				this.tap = null
				this.swallow = false
				const mouse = e.pointerType === 'mouse'
				if (mouse && e.button !== 0) return
				const onMap = e.target === c
				if (e.isPrimary) fingers.clear()
				if (!mouse) fingers.set(e.pointerId, { x: e.clientX, y: e.clientY })
				if (fingers.size > 1) {
					this.down = null
					this.swallow = true
					return
				}
				if (mouse && !onMap && !this.state.zoom) return
				if (mouse && onMap) {
					e.preventDefault()
					c.setPointerCapture(e.pointerId)
				}
				this.down = { id: e.pointerId, x: e.clientX, y: e.clientY, azim: this.cam.azim, tilt: this.cam.tilt, moved: false, mouse, onMap }
			},
			pointermove: e => {
				const f = fingers.get(e.pointerId)
				if (f && fingers.size > 1) {
					const [a, b] = fingers.values()
					const gap = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2
					f.x = e.clientX
					f.y = e.clientY
					this.moveView(mx, my, (a.x + b.x) / 2, (a.y + b.y) / 2, gap / Math.max(Math.hypot(a.x - b.x, a.y - b.y), 1))
					return
				}
				if (f) {
					f.x = e.clientX
					f.y = e.clientY
				}
				const d = this.down
				if (d?.id === e.pointerId && d.mouse && !(e.buttons & 1)) release(e, false)
				else if (d?.id === e.pointerId) {
					const dx = e.clientX - d.x, dy = e.clientY - d.y
					if (!d.moved && Math.hypot(dx, dy) > 6) {
						d.moved = true
						d.pan = !!this.state.zoom
						if (d.mouse) {
							c.setPointerCapture(e.pointerId)
							c.style.cursor = 'grabbing'
							this.setHover({})
							this.onHover?.(null)
						}
					}
					if (d.moved && d.pan) {
						this.swallow = true
						this.moveView(d.x, d.y, e.clientX, e.clientY)
						d.x = e.clientX
						d.y = e.clientY
						return
					}
					if (d.moved && d.mouse && d.onMap) {
						this.home = null
						this.rotor.azim(clamp(d.azim - dx * 0.16, -40, 40), 350, 'out(3)')
						this.rotor.tilt(clamp(d.tilt - dy * 0.14, 16, 58), 350, 'out(3)')
						return
					}
				}
				if (e.pointerType === 'mouse' && !this.down && e.target === c) this.hoverAt(e)
			},
			pointerup: e => release(e, true),
			pointercancel: e => release(e, false),
			lostpointercapture: e => {
				if (e.target === c) release(e, false)
			},
		}
		const onCanvas = {
			click: () => {
				const t = this.tap
				this.tap = null
				if (t) this.onPick?.(this.pick(t), t)
			},
			pointerleave: () => {
				if (this.down) return
				this.onMove?.(null)
				this.setHover({})
				this.onHover?.(null)
			},
		}
		const swallowClick = e => {
			if (!this.swallow) return
			this.swallow = false
			e.preventDefault()
			e.stopPropagation()
		}
		this.listeners = [
			...Object.entries(onSurface).map(([type, fn]) => [this.surface, type, fn, type === 'wheel' ? { passive: false } : undefined]),
			...Object.entries(onCanvas).map(([type, fn]) => [c, type, fn, undefined]),
			[this.surface, 'click', swallowClick, true],
		]
		for (const [el, type, fn, opts] of this.listeners) el.addEventListener(type, fn, opts)
		c.style.cursor = 'grab'
	}

	pick(e) {
		const r = this.canvas.getBoundingClientRect()
		this.ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1)
		this.raycaster.setFromCamera(this.ndc, this.camera)
		const hit = this.raycaster.intersectObjects(this.pickables, false)[0]
		return hit ? { code: hit.object.userData.code } : null
	}

	hoverAt(e) {
		const hit = this.pick(e)
		const other = this.onMove?.(e)
		this.canvas.style.cursor = hit || other ? 'pointer' : 'grab'
		if (this.setHover(hit ?? {})) this.onHover?.(hit)
	}

	setHover(h) {
		const prev = this.state.hover
		if (prev.region === h.region && prev.code === h.code && prev.spot === h.spot) return false
		this.state.hover = h
		this.applyState({ duration: 420, ease: hoverEase })
		return true
	}

	tween(target, params) {
		if (reduceMotion) {
			params.duration = 0
			params.delay = 0
		}
		return animate(target, { onUpdate: this.invalidate, ...params })
	}

	thickness() {
		return this.state.zoom ? this.state.zoomK : this.baseThickness()
	}

	baseThickness() {
		const { level, pref } = this.state
		if (level !== 'pref') return ZK[level]
		const b = this.prefs.get(pref).box
		return clamp(Math.max(b.maxX - b.minX, b.maxY - b.minY) * 0.12, 0.03, ZK.pref)
	}

	targetOf(p, hover = this.state.hover) {
		const { level, region, pref, zoom } = this.state
		const k = this.thickness()
		const rc = p.region.color
		const hoverCode = hover.code ?? (hover.spot ? spotById[hover.spot].pref : null)
		const hoverRegion = hover.region ?? (hoverCode ? regionOf(hoverCode).id : null)
		const t = { off: 0, z: 0, sz: k, top: PAL.land, side: rc }
		if (level === 'japan') {
			if (hoverRegion === p.region.id) {
				t.z = 0.16
				t.top = mixColor(PAL.land, rc, 0.2)
			}
			return t
		}
		if (p.region.id !== region) {
			t.sz = k * 0.4
			t.top = hoverRegion === p.region.id ? mixColor(PAL.dim, rc, 0.3) : PAL.dim
			t.side = mixColor(PAL.dimSide, rc, 0.18)
			return t
		}
		t.off = 0.16 * k
		t.z = 0.2 * k
		t.top = mixColor(PAL.land, rc, 0.2)
		if (level === 'pref') {
			if (p.code === pref) {
				t.z = 0.35 * k
				t.top = PAL.land
			} else {
				t.z = 0.05 * k
				t.top = mixColor(PAL.dim, rc, 0.12)
			}
		}
		if (hoverCode === p.code && p.code !== pref) t.top = mixColor(t.top, rc, 0.3)
		return t
	}

	applyState({ duration = 900, ease, from = null } = {}) {
		for (const p of this.prefs.values()) {
			const t = this.targetOf(p)
			const rest = this.targetOf(p, {})
			p.proxy.position.set(p.dir.x * rest.off, p.dir.y * rest.off, rest.z)
			p.proxy.scale.z = rest.sz
			p.proxy.updateMatrixWorld()
			const key = `${t.off}|${t.z}|${t.sz}|${t.top}|${t.side}`
			if (key === p.key) continue
			p.key = key
			const lineMat = this.state.level === 'pref' && p.code === this.state.pref ? this.focusLineMat : this.lineMat
			p.line.material = lineMat
			const delay = from && duration ? Math.min(p.center.distanceTo(from) * 40, 420) : 0
			const motion = { duration, delay, ease: ease ?? 'inOut(3)' }
			this.tween(p.mesh, { x: p.dir.x * t.off, y: p.dir.y * t.off, z: t.z, scaleZ: t.sz, ...motion })
			this.tween(p.top, { color: t.top, ...motion, ease: 'out(2)' })
			this.tween(p.side, { color: t.side, ...motion, ease: 'out(2)' })
		}
	}

	focusBox() {
		const { level, region, pref, zoom } = this.state
		if (zoom) return zoom
		if (level === 'japan') return JAPAN_BOX
		const box = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
		const grow = (x0, x1, y0, y1) => {
			box.minX = Math.min(box.minX, x0)
			box.maxX = Math.max(box.maxX, x1)
			box.minY = Math.min(box.minY, y0)
			box.maxY = Math.max(box.maxY, y1)
		}
		for (const code of level === 'pref' ? [pref] : regionById[region].prefs) {
			const b = this.prefs.get(code).box
			grow(b.minX, b.maxX, b.minY, b.maxY)
		}
		const min = level === 'pref' ? 0 : 2.4
		for (const [a, b] of [['minX', 'maxX'], ['minY', 'maxY']]) {
			const extra = Math.max(0, min - (box[b] - box[a])) / 2
			box[a] -= extra
			box[b] += extra
		}
		return box
	}

	fit(box, tilt = this.cam.tilt, pad = PAD[this.state.level]) {
		const { width: W, height: H } = this
		const { top, right, bottom } = this.insets
		const vt = Math.tan(FOV / 2 * DEG)
		const availW = Math.max(W - right, W * 0.3)
		const availH = Math.max(H - bottom - top, H * 0.3)
		const w = box.maxX - box.minX, h = box.maxY - box.minY
		const dW = (w / 2) / (vt * availW / H)
		const dH = (h * Math.cos(tilt * DEG) / 2 + h * Math.sin(tilt * DEG) * 0.12) / (vt * availH / H)
		return {
			tx: (box.minX + box.maxX) / 2,
			ty: (box.minY + box.maxY) / 2,
			tz: lookHeight(this.thickness()),
			dist: Math.max(dW, dH) * pad,
			offX: right / 2,
			offY: (bottom - top) / 2,
		}
	}

	fitPref(to) {
		const p = this.prefs.get(this.state.pref)
		const t = this.targetOf(p, {})
		const ox = p.dir.x * t.off, oy = p.dir.y * t.off
		const { polygons, box } = prefShape(p.code)
		const near = g => g.main || g.rings[0].some(([x, y]) =>
			x > box.minX - 0.25 && x < box.maxX + 0.25 && y > box.minY - 0.25 && y < box.maxY + 0.25)
		const pts = polygons.filter(near).flatMap(g => g.rings[0]).flatMap(([x, y]) => [
			new THREE.Vector3(x + ox, y + oy, t.z),
			new THREE.Vector3(x + ox, y + oy, t.z + p.height * t.sz),
		])
		const { width: W, height: H } = this
		const { top, right, bottom } = this.insets
		const m = clamp(Math.min(W, H) * 0.06, 16, 48)
		const ax0 = m, ax1 = Math.max(W - right, W * 0.3) - m
		const ay0 = top + m, ay1 = top + Math.max(H - bottom - top, H * 0.3) - m
		const cam = this.probe()
		const c = { ...this.cam, ...to }
		const v = this.tmp
		for (let i = 0; i < 8; i++) {
			this.aim(cam, c)
			cam.updateMatrixWorld()
			let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
			for (const q of pts) {
				v.copy(q).project(cam)
				const sx = (v.x + 1) / 2 * W, sy = (1 - v.y) / 2 * H
				x0 = Math.min(x0, sx)
				x1 = Math.max(x1, sx)
				y0 = Math.min(y0, sy)
				y1 = Math.max(y1, sy)
			}
			const ppu = H / (2 * c.dist * Math.tan(FOV / 2 * DEG))
			const dx = ((x0 + x1) - (ax0 + ax1)) / 2 / ppu
			const dy = ((y0 + y1) - (ay0 + ay1)) / 2 / ppu / Math.cos(c.tilt * DEG)
			const a = c.azim * DEG
			c.tx += dx * Math.cos(a) + dy * Math.sin(a)
			c.ty += dx * Math.sin(a) - dy * Math.cos(a)
			c.dist *= Math.max((x1 - x0) / (ax1 - ax0), (y1 - y0) / (ay1 - ay0))
		}
		return { ...to, tx: c.tx, ty: c.ty, dist: c.dist }
	}

	probe() {
		if (!this.fitCam) {
			this.fitCam = new THREE.PerspectiveCamera(FOV, 1, 0.01, 300)
			this.fitCam.up.set(0, 0, 1)
		}
		return this.fitCam
	}

	refit(duration = 0) {
		this.home = null
		this.glide?.pause()
		this.glide = null
		let to = this.fit(this.focusBox())
		if (this.state.level === 'pref' && !this.state.zoom) to = this.fitPref(to)
		if (this.flight) {
			this.flight.pause()
			duration = Math.max(duration, 500)
		}
		if (!duration || reduceMotion) {
			Object.assign(this.cam, to)
			this.applyCamera()
			return
		}
		this.flight = this.tween(this.cam, {
			...to, duration, ease: 'inOut(3)',
			onUpdate: this.applyCamera,
			onComplete: () => { this.flight = null },
		})
	}

	focus({ level, region = null, pref = null }, instant = false) {
		const s = this.state
		if (s.level === level && s.region === region && s.pref === pref) return
		Object.assign(s, { level, region, pref, hover: {}, zoom: null })
		this.refit(instant ? 0 : 1500)
		const b = this.focusBox()
		const from = new THREE.Vector2((b.minX + b.maxX) / 2, (b.minY + b.maxY) / 2)
		this.applyState({ duration: instant ? 0 : 900, from })
	}

	zoomTo(spotIds, gapPx) {
		const pts = spotIds.map(id => {
			const s = spotById[id]
			return placeIn(s.lon, s.lat, s.pref)
		})
		const xs = pts.map(p => p[0]), ys = pts.map(p => p[1])
		const extent = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys))
		let minD = Infinity
		for (let i = 0; i < pts.length; i++) {
			for (let j = i + 1; j < pts.length; j++) minD = Math.min(minD, Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]))
		}
		const { top, right, bottom } = this.insets
		const avail = Math.min(this.width - right, this.height - top - bottom)
		const spread = minD * avail / (gapPx * PAD[this.state.level])
		let size = Math.max(Math.min(Math.max(extent * 1.3, 0.12), spread), extent * 1.3)
		const cur = this.state.zoom ? this.state.zoom.maxX - this.state.zoom.minX : Infinity
		if (size > cur * 0.6) size = cur * 0.5
		size = Math.max(size, 0.01)
		this.setZoom((Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2, size)
	}

	locate(id, gapPx) {
		const s = spotById[id]
		const [x, y] = placeIn(s.lon, s.lat, s.pref)
		let minD = Infinity
		for (const o of spots) {
			if (o.pref !== s.pref || o === s) continue
			const [ox, oy] = placeIn(o.lon, o.lat, o.pref)
			minD = Math.min(minD, Math.hypot(ox - x, oy - y))
		}
		const { top, right, bottom } = this.insets
		const avail = Math.min(this.width - right, this.height - top - bottom)
		const b = this.prefs.get(s.pref).box
		const extent = Math.max(b.maxX - b.minX, b.maxY - b.minY)
		const size = Math.max(minD * avail / (gapPx * PAD.pref), extent * 0.4)
		const inFrame = x >= b.minX && x <= b.maxX && y >= b.minY && y <= b.maxY
		if (size >= extent && inFrame) {
			this.resetZoom()
			return false
		}
		this.setZoom(x, y, Math.min(size, extent))
		return true
	}

	setZoom(cx, cy, size) {
		this.state.zoom = { minX: cx - size / 2, maxX: cx + size / 2, minY: cy - size / 2, maxY: cy + size / 2 }
		this.state.zoomK = this.zoomThickness(size * this.fit(UNIT_BOX).dist)
		this.refit(1200)
		this.applyState()
	}

	homeView() {
		if (this.home) return this.home
		const s = this.state
		const zoom = s.zoom
		s.zoom = null
		let to = this.fit(this.focusBox())
		if (s.level === 'pref') to = this.fitPref(to)
		const box = { ...this.focusBox() }
		s.zoom = zoom
		if (s.level === 'pref') {
			for (const o of spots) {
				if (o.pref !== s.pref) continue
				const [x, y] = placeIn(o.lon, o.lat, o.pref)
				box.minX = Math.min(box.minX, x)
				box.maxX = Math.max(box.maxX, x)
				box.minY = Math.min(box.minY, y)
				box.maxY = Math.max(box.maxY, y)
			}
		}
		this.home = { ...to, box }
		return this.home
	}

	rayAt(c, x, y) {
		const cam = this.probe()
		this.aim(cam, c)
		cam.updateMatrixWorld()
		const r = this.canvas.getBoundingClientRect()
		this.ndc.set((x - r.left) / r.width * 2 - 1, -(y - r.top) / r.height * 2 + 1)
		this.raycaster.setFromCamera(this.ndc, cam)
		return this.raycaster.ray
	}

	zoomThickness(dist) {
		const base = this.baseThickness()
		return clamp(base * (dist / this.homeView().dist) ** 1.5, 0.006, base)
	}

	moveView(fx, fy, x, y, scale = 1, smooth = false) {
		if (this.flight) return
		const c = this.cam, s = this.state
		const home = this.homeView()
		const from = smooth && this.glide ? this.goal : c
		if (!s.zoom && from.dist * scale >= home.dist) return
		c.k = this.thickness()
		const kFrom = from === c ? c.k : from.k
		const g = { ...c, tx: from.tx, ty: from.ty, tz: from.tz, dist: from.dist }
		const unit = this.fit(UNIT_BOX).dist
		const ray = this.rayAt(g, fx, fy)
		const hit = this.raycaster.intersectObjects(this.pickables, false)[0]
		const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -(hit ? hit.point.z : 0))
		const start = ray.intersectPlane(plane, new THREE.Vector3())
		g.dist = clamp(from.dist * scale, Math.min(from.dist, MIN_SIZE[s.level] * unit), Math.max(from.dist, home.dist))
		const end = this.rayAt(g, x, y).intersectPlane(plane, new THREE.Vector3())
		if (start && end) {
			g.tx += start.x - end.x
			g.ty += start.y - end.y
		}
		const f = Math.max(0, 1 - g.dist / home.dist)
		const limit = (v, center, lo, hi, was) => {
			const a = center + (lo - center) * f, b = center + (hi - center) * f
			return scale <= 1 ? clamp(v, Math.min(a, was), Math.max(b, was)) : clamp(v, a, b)
		}
		g.tx = limit(g.tx, home.tx, home.box.minX, home.box.maxX, from.tx)
		g.ty = limit(g.ty, home.ty, home.box.minY, home.box.maxY, from.ty)
		g.k = scale === 1 ? kFrom : this.zoomThickness(g.dist)
		if (hit && g.k !== kFrom) {
			const p = this.prefs.get(hit.object.userData.code)
			const t = this.targetOf(p, {})
			const r = (g.k - kFrom) / c.k
			g.tx += p.dir.x * t.off * r
			g.ty += p.dir.y * t.off * r
			g.tz += (t.z + p.height * t.sz) * r
		}
		this.goal = g
		const size = g.dist / unit
		if (!s.zoom) s.zoomK = this.baseThickness()
		s.zoom = { minX: g.tx - size / 2, maxX: g.tx + size / 2, minY: g.ty - size / 2, maxY: g.ty + size / 2 }
		if (scale !== 1) this.onZoom?.(g.dist < home.dist * SNAP)
		this.glide?.pause()
		this.glide = null
		if (smooth && !reduceMotion) {
			this.glide = this.tween(c, {
				tx: g.tx, ty: g.ty, tz: g.tz, dist: g.dist, k: g.k, duration: 280, ease: 'out(3)',
				onUpdate: () => {
					this.thin(c.k)
					this.applyCamera()
				},
				onComplete: () => { this.glide = null },
			})
			return
		}
		Object.assign(c, { tx: g.tx, ty: g.ty, tz: g.tz, dist: g.dist })
		this.thin(g.k)
		this.applyCamera()
	}

	thin(k) {
		if (this.state.zoomK === k) return
		this.state.zoomK = k
		for (const p of this.prefs.values()) {
			const t = this.targetOf(p)
			const rest = this.targetOf(p, {})
			p.mesh.position.set(p.dir.x * t.off, p.dir.y * t.off, t.z)
			p.mesh.scale.z = t.sz
			p.proxy.position.set(p.dir.x * rest.off, p.dir.y * rest.off, rest.z)
			p.proxy.scale.z = rest.sz
			p.proxy.updateMatrixWorld()
			p.key = `${t.off}|${t.z}|${t.sz}|${t.top}|${t.side}`
		}
	}

	settle() {
		if (this.flight || !this.state.zoom) return
		if ((this.glide ? this.goal : this.cam).dist < this.homeView().dist * SNAP) return
		this.resetZoom(500)
		this.onZoom?.(false)
	}

	zoomRatio() {
		return this.state.zoom ? this.homeView().dist / this.cam.dist : 1
	}

	resetRotation() {
		this.home = null
		this.rotor.azim(0, 700, 'inOut(3)')
		this.rotor.tilt(BASE_TILT, 700, 'inOut(3)')
	}

	resetZoom(duration = 1000) {
		if (!this.state.zoom) return
		this.state.zoom = null
		this.refit(duration)
		this.applyState({ duration: Math.min(duration, 900) })
	}

	intro() {
		const to = this.fit(JAPAN_BOX, BASE_TILT, PAD.japan)
		if (reduceMotion) {
			Object.assign(this.cam, to)
			this.applyCamera()
			return
		}
		Object.assign(this.cam, { ...to, dist: to.dist * 1.6 })
		this.applyCamera()
		this.flight = this.tween(this.cam, {
			dist: to.dist, duration: 2400, ease: 'inOut(3)',
			onUpdate: this.applyCamera,
			onComplete: () => { this.flight = null },
		})
		this.rotor.tilt(BASE_TILT, 2400, 'inOut(3)')
		this.rotor.azim(0, 2400, 'inOut(3)')
		const order = [...this.prefs.values()].sort((a, b) => b.center.y - a.center.y).map(p => p.mesh)
		utils.set(order, { scaleZ: 0.001 })
		this.tween(order, { scaleZ: 1, delay: stagger(28, { start: 350 }), duration: 1000, ease: 'out(4)' })
	}

	aim(camera, c) {
		const t = c.tilt * DEG, a = c.azim * DEG
		camera.position.set(
			c.tx + c.dist * Math.sin(t) * Math.sin(a),
			c.ty - c.dist * Math.sin(t) * Math.cos(a),
			c.tz + c.dist * Math.cos(t),
		)
		camera.lookAt(c.tx, c.ty, c.tz)
		camera.setViewOffset(this.width, this.height, c.offX, c.offY, this.width, this.height)
	}

	applyCamera() {
		const c = this.cam
		this.camera.near = Math.max(0.002, c.dist * 0.05)
		this.aim(this.camera, c)
		this.scene.fog.near = c.dist * 1.3
		this.scene.fog.far = c.dist * 3.2
		this.sun.position.set(c.tx - c.dist * 0.45, c.ty - c.dist * 0.2, c.dist * 0.85)
		this.sun.target.position.set(c.tx, c.ty, 0)
		const sc = this.sun.shadow.camera
		const half = c.dist * 0.6
		sc.left = -half
		sc.right = half
		sc.top = half
		sc.bottom = -half
		sc.near = 0.1
		sc.far = c.dist * 2.2
		sc.updateProjectionMatrix()
		this.invalidate()
	}

	setSize(w, h) {
		if (w === this.width && h === this.height) return
		this.width = w
		this.height = h
		this.renderer.setSize(w, h, false)
		this.camera.aspect = w / h
		this.refit()
	}

	setInsets(insets) {
		const i = this.insets
		if (i.top === insets.top && i.right === insets.right && i.bottom === insets.bottom) return
		this.insets = insets
		this.refit()
	}

	japanScale() {
		return this.height / (2 * this.fit(JAPAN_BOX, BASE_TILT, PAD.japan).dist * Math.tan(FOV / 2 * DEG))
	}

	screenOf(key) {
		const a = this.anchors.get(key)
		if (!a) return null
		if (a.isObject3D) a.getWorldPosition(this.tmp)
		else this.tmp.copy(a)
		this.tmp.project(this.camera)
		return { x: (this.tmp.x + 1) / 2 * this.width, y: (1 - this.tmp.y) / 2 * this.height }
	}

	northAngle() {
		const c = this.cam
		const a = new THREE.Vector3(c.tx, c.ty, c.tz).project(this.camera)
		const b = new THREE.Vector3(c.tx, c.ty + 1, c.tz).project(this.camera)
		return Math.atan2((b.x - a.x) * this.width, (b.y - a.y) * this.height) * 180 / Math.PI
	}

	pxPerUnit(key) {
		const a = this.anchors.get(key)
		if (!a) return 0
		const p = a.isObject3D ? a.getWorldPosition(new THREE.Vector3()) : a.clone()
		const q = p.clone().add(new THREE.Vector3(0.2, 0, 0))
		p.project(this.camera)
		q.project(this.camera)
		return Math.hypot((q.x - p.x) * this.width / 2, (q.y - p.y) * this.height / 2) / 0.2
	}

	loop() {
		this.raf = requestAnimationFrame(this.loop)
		if (!this.dirty) return
		this.dirty = false
		this.renderer.render(this.scene, this.camera)
		this.onRender?.()
	}

	resume() {
		if (this.raf) return
		this.dirty = true
		this.loop()
		if (!this.flowersStarted) {
			this.flowersStarted = true
			this.growFlowers()
		}
	}

	pause() {
		cancelAnimationFrame(this.raf)
		this.raf = 0
	}

	dispose() {
		this.pause()
		clearTimeout(this.settleTimer)
		this.flowerQueue = null
		for (const [el, type, fn, opts] of this.listeners) el.removeEventListener(type, fn, opts)
		this.rotor.revert()
		this.scene.traverse(o => {
			o.geometry?.dispose()
			const m = o.material
			if (Array.isArray(m)) m.forEach(x => x.dispose())
			else m?.dispose()
		})
		this.textures.forEach(t => t.dispose())
		this.renderer.dispose()
	}
}
