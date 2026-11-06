import * as THREE from 'three'
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js'
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js'
import { LineMaterial } from 'three/addons/lines/LineMaterial.js'
import { animate } from 'animejs'
import { project } from './projection.js'
import { reduceMotion } from '../motion.js'

const files = import.meta.glob('../data/rails/*.json', { import: 'default' })
const load = name => files[`../data/rails/${name}.json`]()

const STYLE = {
	o: { color: '#3f6f9c', width: 2, edge: 3.6, order: 10 },
	m: { color: '#3f6f9c', width: 2.2, edge: 3.8, order: 11 },
	j: { color: '#3a2e26', width: 2.6, edge: 4.6, order: 12 },
	s: { color: '#d0432e', width: 3.6, edge: 6, order: 14 },
}
const EDGE = '#fffaf0'

function decode(line, code, z, out) {
	let x = 0, y = 0, px = 0, py = 0
	for (let i = 0; i < line.length; i += 2) {
		x += line[i]
		y += line[i + 1]
		const [wx, wy] = project(x / 1e4, y / 1e4, code)
		if (i) out.push(px, py, z, wx, wy, z)
		px = wx
		py = wy
	}
}

function dotTexture() {
	const c = document.createElement('canvas')
	c.width = c.height = 32
	const g = c.getContext('2d')
	g.arc(16, 16, 12, 0, Math.PI * 2)
	g.fillStyle = '#fffaf0'
	g.fill()
	g.lineWidth = 5
	g.strokeStyle = '#3a2e26'
	g.stroke()
	return new THREE.CanvasTexture(c)
}

const noRaycast = () => {}

export class RailLayer {
	constructor(scene) {
		this.scene = scene
		this.on = false
		this.detail = false
		this.fades = []
		this.view = { level: 'japan', region: null, pref: null }
		this.entries = []
		this.points = new Map()
		this.loaded = new Map()
		this.tmp = new THREE.Vector3()
		this.mats = {}
		for (const [cls, s] of Object.entries(STYLE)) {
			const make = (color, linewidth) => new LineMaterial({ color, linewidth, opacity: 0, transparent: true, depthTest: false, depthWrite: false })
			this.mats[cls] = [make(EDGE, s.edge), make(s.color, s.width)]
		}
		this.dotMat = new THREE.PointsMaterial({ size: 7, sizeAttenuation: false, map: dotTexture(), opacity: 0, transparent: true, depthTest: false, depthWrite: false })
		scene.textures.push(this.dotMat.map)
	}

	addLines(region, code, cls, lines) {
		const p = this.scene.prefs.get(code)
		if (!p || !lines.length) return
		const pos = []
		for (const line of lines) decode(line, code, p.height, pos)
		const geo = new LineSegmentsGeometry().setPositions(pos)
		this.mats[cls].forEach((mat, i) => {
			const obj = new LineSegments2(geo, mat)
			obj.renderOrder = STYLE[cls].order + i
			obj.raycast = noRaycast
			obj.visible = false
			p.mesh.add(obj)
			this.entries.push({ obj, cls, region })
		})
	}

	addStations(code, list, ln) {
		const p = this.scene.prefs.get(code)
		if (!p || !list.length) return
		const stations = list.map(([name, x, y, major, lines]) => {
			const [wx, wy] = project(x / 1e4, y / 1e4, code)
			return { name, major, lines: lines.map(i => ln[i]), x: wx, y: wy, code }
		})
		const geo = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(stations.flatMap(s => [s.x, s.y, p.height]), 3))
		const majors = stations.filter(s => s.major).length
		geo.setDrawRange(0, this.detail ? stations.length : majors)
		const dots = new THREE.Points(geo, this.dotMat)
		dots.renderOrder = 20
		dots.raycast = noRaycast
		dots.visible = false
		p.mesh.add(dots)
		this.points.set(code, { dots, stations, majors })
	}

	ensure(name, build) {
		if (!this.loaded.has(name)) this.loaded.set(name, load(name).then(build))
		return this.loaded.get(name)
	}

	async sync() {
		const { region } = this.view
		await this.ensure('shinkansen', data => {
			for (const [code, lines] of Object.entries(data)) this.addLines(null, +code, 's', lines)
		})
		if (region) {
			await this.ensure(region, ({ ln, ...prefs }) => {
				for (const [code, d] of Object.entries(prefs)) {
					for (const cls of ['j', 'm', 'o']) this.addLines(region, +code, cls, d[cls])
					this.addStations(+code, d.st, ln)
				}
			})
		}
		this.apply()
	}

	apply() {
		const { level, region, pref } = this.view
		for (const e of this.entries) {
			const here = e.region === region
			e.obj.visible = this.on && (e.cls === 's' || (here && (e.cls === 'o' ? level === 'pref' : level !== 'japan')))
		}
		for (const [code, { dots }] of this.points) dots.visible = this.on && code === pref
		this.scene.invalidate()
	}

	fade(on, done) {
		this.fades.forEach(a => a.pause())
		const { o, m, j, s } = this.mats
		const layers = [[...o, ...m], j, [...s, this.dotMat]]
		const target = on ? 1 : 0
		if (reduceMotion) {
			layers.flat().forEach(mat => { mat.opacity = target })
			done?.()
			this.scene.invalidate()
			return
		}
		this.fades = layers.map((mats, i) => animate(mats, {
			opacity: target,
			duration: on ? 400 : 200,
			delay: on ? i * 100 : 0,
			ease: 'out(2)',
			onUpdate: this.scene.invalidate,
			onComplete: i === layers.length - 1 ? done : undefined,
		}))
	}

	async setOn(on) {
		if (on) {
			this.on = true
			await this.sync()
			this.fade(true)
		} else {
			this.fade(false, () => {
				this.on = false
				this.apply()
			})
		}
	}

	setView(view) {
		this.view = view
		return this.on ? this.sync() : Promise.resolve()
	}

	setDetail(detail) {
		this.detail = detail
		for (const { dots, stations, majors } of this.points.values()) dots.geometry.setDrawRange(0, detail ? stations.length : majors)
		this.scene.invalidate()
	}

	stations() {
		return (this.on && this.points.get(this.view.pref)?.stations) || []
	}

	stationAt(px, py, radius) {
		let best = null, d = radius
		for (const st of this.stations()) {
			if (!st.major && !this.detail) continue
			const p = this.screenOf(st)
			const v = Math.hypot(p.x - px, p.y - py)
			if (v < d) {
				d = v
				best = st
			}
		}
		return best
	}

	screenOf(st) {
		const { mesh, height } = this.scene.prefs.get(st.code)
		const t = this.tmp.set(st.x, st.y, height)
		mesh.localToWorld(t).project(this.scene.camera)
		return { x: (t.x + 1) / 2 * this.scene.width, y: (1 - t.y) / 2 * this.scene.height }
	}
}
