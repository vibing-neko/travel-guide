import * as THREE from 'three'

const FLOWERS = {
	13: 'sakura',
	14: 'lily',
	11: 'primrose',
	12: 'rape',
	8: 'rose',
	9: 'azalea',
	10: 'azaleas',
	26: 'weeping',
	27: 'umePrimrose',
	28: 'mum',
	29: 'yae',
	25: 'rhodo',
	30: 'ume',
	24: 'iris',
	1: 'rose',
	2: 'apple',
	3: 'kiri',
	4: 'hagi',
	5: 'fuki',
	6: 'benibana',
	7: 'rhodo',
	15: 'tulip',
	16: 'tulip',
	17: 'lily',
	18: 'narcissus',
	19: 'sakura',
	20: 'gentian',
	21: 'renge',
	22: 'azalea',
	23: 'iris',
	31: 'rakkyo',
	32: 'peony',
	33: 'peach',
	34: 'momiji',
	35: 'citrus',
	36: 'citrus',
	37: 'olive',
	38: 'citrus',
	39: 'yamamomo',
	40: 'ume',
	41: 'kusu',
	42: 'azaleas',
	43: 'gentian',
	44: 'ume',
	45: 'hamayu',
	46: 'azaleas',
	47: 'deigo',
}

const INK = 'rgba(60, 40, 20, 0.12)'
const LIGHT = 'rgba(255, 255, 255, 0.5)'

const rnd = (() => {
	let s = 7
	return () => (s = (s * 16807) % 2147483647) / 2147483647
})()

function washiCanvas(size) {
	const c = document.createElement('canvas')
	c.width = c.height = size
	const g = c.getContext('2d')
	const img = g.createImageData(size, size)
	for (let i = 0; i < img.data.length; i += 4) {
		const v = 238 + rnd() * 17
		img.data[i] = img.data[i + 1] = img.data[i + 2] = v
		img.data[i + 3] = 255
	}
	g.putImageData(img, 0, 0)
	g.lineCap = 'round'
	const count = size * size / 620
	for (let i = 0; i < count; i++) {
		const light = rnd() < 0.5
		g.strokeStyle = light ? `rgba(255,255,255,${0.25 + rnd() * 0.3})` : `rgba(110,100,85,${0.05 + rnd() * 0.08})`
		g.lineWidth = 0.4 + rnd() * 1.2
		const x = rnd() * size, y = rnd() * size
		const len = 12 + rnd() * 46, ang = rnd() * Math.PI * 2, bend = (rnd() - 0.5) * 1.4
		g.beginPath()
		g.moveTo(x, y)
		g.quadraticCurveTo(x + Math.cos(ang + bend) * len / 2, y + Math.sin(ang + bend) * len / 2, x + Math.cos(ang) * len, y + Math.sin(ang) * len)
		g.stroke()
	}
	return c
}

const toTexture = (canvas, repeat) => {
	const tex = new THREE.CanvasTexture(canvas)
	tex.wrapS = tex.wrapT = THREE.RepeatWrapping
	tex.colorSpace = THREE.SRGBColorSpace
	tex.anisotropy = 4
	tex.repeat.set(repeat, repeat)
	return tex
}

function petals(g, n, r, rot, draw) {
	for (let i = 0; i < n; i++) {
		g.save()
		g.rotate(rot + i * Math.PI * 2 / n)
		g.beginPath()
		draw(r)
		g.fill()
		g.restore()
	}
}

const dot = (g, x, y, r, color) => {
	g.fillStyle = color
	g.beginPath()
	g.arc(x, y, r, 0, Math.PI * 2)
	g.fill()
}

const sakuraPetal = g => r => {
	g.moveTo(0, 0)
	g.bezierCurveTo(-0.55 * r, -0.35 * r, -0.5 * r, -0.92 * r, -0.13 * r, -r)
	g.lineTo(0, -0.8 * r)
	g.lineTo(0.13 * r, -r)
	g.bezierCurveTo(0.5 * r, -0.92 * r, 0.55 * r, -0.35 * r, 0, 0)
}

const MOTIFS = {
	apple(g, r) {
		g.fillStyle = INK
		for (let i = 0; i < 5; i++) {
			const a = i * Math.PI * 2 / 5 - Math.PI / 2
			g.beginPath()
			g.ellipse(Math.cos(a) * 0.5 * r, Math.sin(a) * 0.5 * r, 0.44 * r, 0.36 * r, a, 0, Math.PI * 2)
			g.fill()
		}
		for (let i = 0; i < 6; i++) dot(g, Math.cos(i) * 0.14 * r, Math.sin(i) * 0.14 * r, r * 0.05, LIGHT)
	},
	kiri(g, r) {
		g.fillStyle = INK
		for (const [y, n] of [[-0.75, 1], [-0.3, 3], [0.2, 5]]) {
			for (let i = 0; i < n; i++) {
				g.beginPath()
				g.ellipse((i - (n - 1) / 2) * 0.34 * r, y * r, 0.15 * r, 0.25 * r, 0, 0, Math.PI * 2)
				g.fill()
			}
		}
		g.beginPath()
		g.moveTo(-0.9 * r, 0.9 * r)
		g.quadraticCurveTo(0, 0.35 * r, 0.9 * r, 0.9 * r)
		g.quadraticCurveTo(0, 1.05 * r, -0.9 * r, 0.9 * r)
		g.fill()
	},
	hagi(g, r) {
		g.strokeStyle = INK
		g.lineWidth = r * 0.07
		g.beginPath()
		g.moveTo(-r, r)
		g.quadraticCurveTo(-0.2 * r, -0.2 * r, r, -0.8 * r)
		g.stroke()
		g.fillStyle = INK
		for (let t = 0.15; t < 1; t += 0.14) {
			const x = (1 - t) * (1 - t) * -1 + 2 * t * (1 - t) * -0.2 + t * t
			const y = (1 - t) * (1 - t) + 2 * t * (1 - t) * -0.2 + t * t * -0.8
			for (const s of [-1, 1]) {
				g.beginPath()
				g.ellipse((x + s * 0.13) * r, (y + s * 0.13) * r, 0.13 * r, 0.08 * r, 0.6, 0, Math.PI * 2)
				g.fill()
			}
		}
	},
	fuki(g, r) {
		g.fillStyle = INK
		for (const [w, y] of [[0.75, 0.25], [0.55, -0.1], [0.36, -0.45]]) {
			g.beginPath()
			g.moveTo(0, (y - 0.5) * r)
			g.bezierCurveTo(w * r, (y - 0.2) * r, w * r, (y + 0.4) * r, 0, (y + 0.65) * r)
			g.bezierCurveTo(-w * r, (y + 0.4) * r, -w * r, (y - 0.2) * r, 0, (y - 0.5) * r)
			g.fill()
		}
		dot(g, 0, -0.2 * r, r * 0.14, LIGHT)
	},
	benibana(g, r) {
		g.fillStyle = INK
		petals(g, 20, r, 0, r => {
			g.ellipse(0, -0.65 * r, 0.06 * r, 0.35 * r, 0, 0, Math.PI * 2)
		})
		dot(g, 0, 0, r * 0.32, LIGHT)
	},
	tulip(g, r) {
		g.fillStyle = INK
		g.beginPath()
		g.moveTo(-0.5 * r, -0.75 * r)
		g.lineTo(-0.18 * r, -0.42 * r)
		g.lineTo(0, -0.85 * r)
		g.lineTo(0.18 * r, -0.42 * r)
		g.lineTo(0.5 * r, -0.75 * r)
		g.bezierCurveTo(0.65 * r, -0.1 * r, 0.4 * r, 0.2 * r, 0, 0.2 * r)
		g.bezierCurveTo(-0.4 * r, 0.2 * r, -0.65 * r, -0.1 * r, -0.5 * r, -0.75 * r)
		g.fill()
		g.beginPath()
		g.moveTo(0, r)
		g.quadraticCurveTo(0.65 * r, 0.65 * r, 0.75 * r, 0.1 * r)
		g.quadraticCurveTo(0.3 * r, 0.4 * r, 0, r)
		g.fill()
		g.strokeStyle = INK
		g.lineWidth = r * 0.07
		g.beginPath()
		g.moveTo(0, 0.2 * r)
		g.lineTo(0, r)
		g.stroke()
	},
	narcissus(g, r) {
		g.fillStyle = INK
		petals(g, 6, r, 0, r => {
			g.ellipse(0, -0.58 * r, 0.26 * r, 0.42 * r, 0, 0, Math.PI * 2)
		})
		dot(g, 0, 0, r * 0.3, LIGHT)
		dot(g, 0, 0, r * 0.13, INK)
	},
	gentian(g, r) {
		g.fillStyle = INK
		for (const [x, s, rot] of [[-0.42, 0.75, -0.35], [0.42, 0.75, 0.35], [0, 1, 0]]) {
			g.save()
			g.translate(x * r, 0.2 * r)
			g.rotate(rot)
			g.scale(s, s)
			g.beginPath()
			g.moveTo(-0.2 * r, 0.6 * r)
			g.lineTo(-0.3 * r, -0.65 * r)
			g.lineTo(-0.14 * r, -0.45 * r)
			g.lineTo(0, -0.8 * r)
			g.lineTo(0.14 * r, -0.45 * r)
			g.lineTo(0.3 * r, -0.65 * r)
			g.lineTo(0.2 * r, 0.6 * r)
			g.closePath()
			g.fill()
			g.restore()
		}
	},
	renge(g, r) {
		g.fillStyle = INK
		petals(g, 8, r, 0, r => {
			g.ellipse(0, -0.68 * r, 0.2 * r, 0.3 * r, 0, 0, Math.PI * 2)
		})
		g.fillStyle = LIGHT
		petals(g, 8, r * 0.6, Math.PI / 8, r => {
			g.ellipse(0, -0.65 * r, 0.16 * r, 0.26 * r, 0, 0, Math.PI * 2)
		})
	},
	peony(g, r) {
		g.fillStyle = INK
		petals(g, 9, r, 0, r => {
			g.ellipse(0, -0.65 * r, 0.34 * r, 0.38 * r, 0, 0, Math.PI * 2)
		})
		g.fillStyle = LIGHT
		petals(g, 7, r * 0.62, 0.3, r => {
			g.ellipse(0, -0.6 * r, 0.3 * r, 0.36 * r, 0, 0, Math.PI * 2)
		})
		dot(g, 0, 0, r * 0.16, INK)
	},
	peach(g, r) {
		g.fillStyle = INK
		petals(g, 5, r, 0, r => {
			g.moveTo(0, 0)
			g.bezierCurveTo(-0.6 * r, -0.3 * r, -0.45 * r, -0.85 * r, 0, -r)
			g.bezierCurveTo(0.45 * r, -0.85 * r, 0.6 * r, -0.3 * r, 0, 0)
		})
		dot(g, 0, 0, r * 0.16, LIGHT)
	},
	momiji(g, r) {
		g.fillStyle = INK
		for (const [a, l] of [[0, 1], [0.8, 0.85], [-0.8, 0.85], [1.6, 0.7], [-1.6, 0.7], [2.35, 0.45], [-2.35, 0.45]]) {
			g.save()
			g.rotate(a)
			g.beginPath()
			g.moveTo(0, 0)
			g.bezierCurveTo(-0.24 * r, -0.3 * l * r, -0.16 * r, -0.7 * l * r, 0, -l * r)
			g.bezierCurveTo(0.16 * r, -0.7 * l * r, 0.24 * r, -0.3 * l * r, 0, 0)
			g.fill()
			g.restore()
		}
	},
	rakkyo(g, r) {
		g.strokeStyle = INK
		g.lineWidth = r * 0.05
		g.beginPath()
		g.moveTo(0, r)
		g.lineTo(0, -0.1 * r)
		g.stroke()
		g.fillStyle = INK
		for (let i = 0; i < 14; i++) {
			g.save()
			g.translate(0, -0.3 * r)
			g.rotate(i * Math.PI * 2 / 14)
			g.beginPath()
			g.ellipse(0, -0.42 * r, 0.09 * r, 0.26 * r, 0, 0, Math.PI * 2)
			g.fill()
			g.restore()
		}
	},
	citrus(g, r) {
		g.fillStyle = INK
		petals(g, 5, r, 0, r => {
			g.ellipse(0, -0.58 * r, 0.2 * r, 0.42 * r, 0, 0, Math.PI * 2)
		})
		dot(g, 0, 0, r * 0.22, LIGHT)
		for (let i = 0; i < 5; i++) dot(g, Math.cos(i * 1.257) * 0.13 * r, Math.sin(i * 1.257) * 0.13 * r, r * 0.04, INK)
	},
	olive(g, r) {
		g.fillStyle = INK
		for (const [x, y, a] of [[-0.4, -0.5, -0.5], [0.42, -0.25, 0.7], [-0.45, 0.2, -0.9], [0.4, 0.5, 1]]) {
			g.beginPath()
			g.ellipse(x * r, y * r, 0.14 * r, 0.42 * r, a, 0, Math.PI * 2)
			g.fill()
		}
		g.strokeStyle = INK
		g.lineWidth = r * 0.05
		g.beginPath()
		g.moveTo(0, r)
		g.lineTo(0, -0.85 * r)
		g.stroke()
		dot(g, 0.15 * r, 0.02 * r, r * 0.15, LIGHT)
		dot(g, -0.15 * r, 0.62 * r, r * 0.15, LIGHT)
	},
	yamamomo(g, r) {
		for (const [cx, cy, R] of [[-0.35, 0.2, 0.42], [0.38, 0.32, 0.36], [0.05, -0.32, 0.36]]) {
			dot(g, cx * r, cy * r, R * r, INK)
			for (let i = 0; i < 7; i++) dot(g, (cx + Math.cos(i * 0.9) * R * 0.6) * r, (cy + Math.sin(i * 0.9) * R * 0.6) * r, r * 0.04, LIGHT)
		}
	},
	kusu(g, r) {
		g.fillStyle = INK
		for (const a of [0.4, 2.1, 4.1]) {
			g.save()
			g.rotate(a)
			g.beginPath()
			g.ellipse(0, -0.62 * r, 0.25 * r, 0.42 * r, 0, 0, Math.PI * 2)
			g.fill()
			g.restore()
		}
		for (const [x, y] of [[-0.3, 0], [0.26, 0.1], [0, -0.26]]) {
			g.save()
			g.translate(x * r, y * r)
			petals(g, 6, r * 0.24, 0, r => {
				g.ellipse(0, -0.6 * r, 0.3 * r, 0.42 * r, 0, 0, Math.PI * 2)
			})
			g.restore()
		}
	},
	hamayu(g, r) {
		g.strokeStyle = INK
		g.lineCap = 'round'
		g.lineWidth = r * 0.11
		for (let i = 0; i < 6; i++) {
			g.save()
			g.rotate(i * Math.PI / 3)
			g.beginPath()
			g.moveTo(0, -0.08 * r)
			g.bezierCurveTo(0.08 * r, -0.45 * r, -0.08 * r, -0.72 * r, 0.22 * r, -r)
			g.stroke()
			g.restore()
		}
		dot(g, 0, 0, r * 0.15, LIGHT)
	},
	deigo(g, r) {
		g.fillStyle = INK
		for (let i = 0; i < 6; i++) {
			g.save()
			g.translate((i % 2 ? 0.12 : -0.12) * r, (0.8 - i * 0.32) * r)
			g.rotate(i % 2 ? 0.75 : -0.75)
			g.beginPath()
			g.moveTo(0, 0)
			g.quadraticCurveTo(0.42 * r, -0.2 * r, 0.1 * r, -0.72 * r)
			g.quadraticCurveTo(-0.14 * r, -0.3 * r, 0, 0)
			g.fill()
			g.restore()
		}
	},
	sakura(g, r) {
		g.fillStyle = INK
		petals(g, 5, r, 0, sakuraPetal(g))
		dot(g, 0, 0, r * 0.14, LIGHT)
	},
	yae(g, r) {
		g.fillStyle = INK
		petals(g, 5, r, 0, sakuraPetal(g))
		g.fillStyle = LIGHT
		petals(g, 5, r * 0.55, Math.PI / 5, sakuraPetal(g))
		dot(g, 0, 0, r * 0.1, INK)
	},
	weeping(g, r) {
		g.strokeStyle = INK
		g.lineWidth = r * 0.06
		for (const dx of [-0.5, 0, 0.5]) {
			g.beginPath()
			g.moveTo(dx * r, -1.1 * r)
			g.quadraticCurveTo(dx * r + 0.3 * r, 0, dx * r - 0.1 * r, 1.1 * r)
			g.stroke()
			for (const t of [-0.6, 0.1, 0.8]) {
				g.save()
				g.translate(dx * r + 0.12 * r + Math.sin(t) * 0.1 * r, t * r)
				g.fillStyle = INK
				petals(g, 5, r * 0.26, t, sakuraPetal(g))
				g.restore()
			}
		}
	},
	ume(g, r) {
		g.fillStyle = INK
		for (let i = 0; i < 5; i++) {
			const a = i * Math.PI * 2 / 5 - Math.PI / 2
			g.beginPath()
			g.arc(Math.cos(a) * 0.52 * r, Math.sin(a) * 0.52 * r, 0.46 * r, 0, Math.PI * 2)
			g.fill()
		}
		for (let i = 0; i < 6; i++) {
			const a = i * Math.PI / 3
			dot(g, Math.cos(a) * 0.22 * r, Math.sin(a) * 0.22 * r, r * 0.05, LIGHT)
		}
	},
	primrose(g, r) {
		g.fillStyle = INK
		petals(g, 5, r, 0, r => {
			g.moveTo(0, 0)
			g.bezierCurveTo(-0.5 * r, -0.3 * r, -0.62 * r, -0.85 * r, -0.28 * r, -0.95 * r)
			g.quadraticCurveTo(-0.08 * r, -r, 0, -0.68 * r)
			g.quadraticCurveTo(0.08 * r, -r, 0.28 * r, -0.95 * r)
			g.bezierCurveTo(0.62 * r, -0.85 * r, 0.5 * r, -0.3 * r, 0, 0)
		})
		dot(g, 0, 0, r * 0.12, LIGHT)
	},
	umePrimrose(g, r, i) {
		;(i % 2 ? MOTIFS.primrose : MOTIFS.ume)(g, r)
	},
	lily(g, r) {
		g.fillStyle = INK
		petals(g, 6, r, 0, r => {
			g.moveTo(0, 0)
			g.quadraticCurveTo(-0.3 * r, -0.55 * r, 0, -r)
			g.quadraticCurveTo(0.3 * r, -0.55 * r, 0, 0)
		})
		for (let i = 0; i < 6; i++) {
			const a = i * Math.PI / 3 - Math.PI / 2
			dot(g, Math.cos(a) * 0.45 * r, Math.sin(a) * 0.45 * r, r * 0.05, LIGHT)
		}
	},
	rape(g, r) {
		for (const [x, y] of [[0, -0.45], [-0.45, 0.35], [0.45, 0.35]]) {
			g.save()
			g.translate(x * r, y * r)
			g.fillStyle = INK
			for (let i = 0; i < 4; i++) {
				const a = i * Math.PI / 2 + Math.PI / 4
				g.beginPath()
				g.arc(Math.cos(a) * 0.2 * r, Math.sin(a) * 0.2 * r, 0.18 * r, 0, Math.PI * 2)
				g.fill()
			}
			dot(g, 0, 0, r * 0.07, LIGHT)
			g.restore()
		}
	},
	rose(g, r) {
		dot(g, 0, 0, r * 0.9, INK)
		g.strokeStyle = LIGHT
		g.lineWidth = r * 0.07
		g.beginPath()
		for (let t = 0; t < Math.PI * 5; t += 0.15) {
			const rr = r * 0.08 + t * r * 0.05
			const x = Math.cos(t) * rr, y = Math.sin(t) * rr
			t ? g.lineTo(x, y) : g.moveTo(x, y)
		}
		g.stroke()
	},
	azalea(g, r) {
		g.fillStyle = INK
		petals(g, 5, r, 0, r => {
			g.moveTo(0, 0)
			g.bezierCurveTo(-0.62 * r, -0.3 * r, -0.55 * r, -r, 0, -r)
			g.bezierCurveTo(0.55 * r, -r, 0.62 * r, -0.3 * r, 0, 0)
		})
		g.strokeStyle = LIGHT
		g.lineWidth = r * 0.04
		for (const a of [-0.5, -0.2, 0.1, 0.4]) {
			g.beginPath()
			g.moveTo(0, 0)
			g.quadraticCurveTo(Math.sin(a) * 0.5 * r, -0.6 * r, Math.sin(a) * 0.75 * r, -0.85 * r)
			g.stroke()
		}
	},
	azaleas(g, r) {
		for (const [x, y, s] of [[0, -0.4, 0.55], [-0.45, 0.35, 0.5], [0.45, 0.35, 0.5]]) {
			g.save()
			g.translate(x * r, y * r)
			MOTIFS.azalea(g, r * s)
			g.restore()
		}
	},
	mum(g, r) {
		g.fillStyle = INK
		petals(g, 16, r, 0, r => {
			g.ellipse(0, -0.58 * r, 0.1 * r, 0.42 * r, 0, 0, Math.PI * 2)
		})
		dot(g, 0, 0, r * 0.2, LIGHT)
	},
	rhodo(g, r) {
		g.fillStyle = INK
		for (const a of [-0.9, 0, 0.9]) {
			g.save()
			g.rotate(Math.PI + a)
			g.beginPath()
			g.ellipse(0, -0.75 * r, 0.16 * r, 0.42 * r, 0, 0, Math.PI * 2)
			g.fill()
			g.restore()
		}
		for (let i = 0; i < 7; i++) {
			const a = i * Math.PI * 2 / 7
			g.save()
			g.translate(Math.cos(a) * 0.42 * r, Math.sin(a) * 0.42 * r - 0.1 * r)
			g.fillStyle = INK
			petals(g, 5, r * 0.26, a, r => {
				g.arc(0, -0.55 * r, 0.45 * r, 0, Math.PI * 2)
			})
			g.restore()
		}
	},
	iris(g, r) {
		g.fillStyle = INK
		petals(g, 3, r, Math.PI, r => {
			g.moveTo(0, 0)
			g.bezierCurveTo(-0.6 * r, -0.2 * r, -0.5 * r, -r, 0, -r)
			g.bezierCurveTo(0.5 * r, -r, 0.6 * r, -0.2 * r, 0, 0)
		})
		petals(g, 3, r * 0.75, 0, r => {
			g.moveTo(0, 0)
			g.quadraticCurveTo(-0.25 * r, -0.6 * r, 0, -r)
			g.quadraticCurveTo(0.25 * r, -0.6 * r, 0, 0)
		})
		g.strokeStyle = LIGHT
		g.lineWidth = r * 0.05
		for (let i = 0; i < 3; i++) {
			const a = Math.PI / 2 + i * Math.PI * 2 / 3
			g.beginPath()
			g.moveTo(0, 0)
			g.lineTo(Math.cos(a) * 0.6 * r, Math.sin(a) * 0.6 * r)
			g.stroke()
		}
	},
}

let washi = null
export function washiTexture() {
	washi ??= washiCanvas(512)
	return toTexture(washi, 1)
}

const flowerTextures = new Map()
export function prefTexture(code) {
	const name = FLOWERS[code]
	const motif = MOTIFS[name]
	if (!motif) return null
	if (flowerTextures.has(name)) return flowerTextures.get(name)
	washi ??= washiCanvas(512)
	const size = 512
	const c = document.createElement('canvas')
	c.width = c.height = size
	const g = c.getContext('2d')
	g.drawImage(washi, 0, 0)
	const r = size * 0.13
	const spots = [[0.25, 0.25, 0.2], [0.75, 0.75, 1.1], [0.75, 0.25, 2.3], [0.25, 0.75, 3.4]]
	spots.forEach(([x, y, rot], i) => {
		for (const ox of [-1, 0, 1]) {
			for (const oy of [-1, 0, 1]) {
				g.save()
				g.translate((x + ox) * size, (y + oy) * size)
				g.rotate(rot)
				motif(g, r, i)
				g.restore()
			}
		}
	})
	const tex = toTexture(c, 1)
	flowerTextures.set(name, tex)
	return tex
}

export function seaTexture() {
	const size = 1024
	const R = 64
	const c = document.createElement('canvas')
	c.width = c.height = size
	const g = c.getContext('2d')
	g.fillStyle = '#ffffff'
	g.fillRect(0, 0, size, size)
	g.lineWidth = 2.2
	for (let j = -2; j <= size / (R / 2) + 2; j++) {
		const y = j * R / 2
		for (let i = -1; i <= size / (2 * R) + 1; i++) {
			const x = i * 2 * R + (j % 2 ? R : 0)
			g.fillStyle = '#ffffff'
			g.beginPath()
			g.arc(x, y, R, Math.PI, 0)
			g.fill()
			g.strokeStyle = 'rgba(40, 60, 70, 0.16)'
			for (const k of [1, 0.75, 0.5, 0.25]) {
				g.beginPath()
				g.arc(x, y, R * k - 1.5, Math.PI, 0)
				g.stroke()
			}
		}
	}
	g.globalCompositeOperation = 'multiply'
	washi ??= washiCanvas(512)
	g.fillStyle = g.createPattern(washi, 'repeat')
	g.fillRect(0, 0, size, size)
	return toTexture(c, 60)
}
