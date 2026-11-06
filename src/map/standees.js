import { createTimeline, createDrawable, svg as svgUtils } from 'animejs'

const $ = (root, part) => root.querySelector(`[data-part="${part}"]`)
const $$ = (root, part) => root.querySelectorAll(`[data-part="${part}"]`)
const motion = (root, part) => {
	const { translateX, translateY } = svgUtils.createMotionPath($(root, part))
	return { translateX, translateY }
}

function pagoda() {
	const levels = [[84, 34], [71, 30], [59, 26], [48, 22], [38, 18]]
	let s = '<rect class="o" x="20" y="88" width="60" height="8" rx="1.5" fill="#8d847a"/>'
	levels.forEach(([y, w], i) => {
		const next = levels[i + 1]
		const bw = w * 0.52
		const top = next ? next[0] + 3 : y - 12
		s += `<rect class="o" x="${50 - bw}" y="${top}" width="${bw * 2}" height="${y - top + 1}" fill="#9c4a32"/>`
		s += `<path d="M${50 - bw + 3} ${top + 3}V${y - 2}M${50 + bw - 3} ${top + 3}V${y - 2}" stroke="#6e2f1f" stroke-width="1"/>`
	})
	levels.forEach(([y, w]) => {
		s += `<path class="o" fill="#3f3530" d="M${50 - w} ${y + 1} Q${50 - w * 0.55} ${y - 5} 50 ${y - 7} Q${50 + w * 0.55} ${y - 5} ${50 + w} ${y + 1} L${50 + w - 5} ${y + 3.5} L${50 - w + 5} ${y + 3.5} Z"/>`
		for (const side of [-1, 1]) {
			s += `<g data-part="bell" style="transform-box:fill-box;transform-origin:50% 0"><line x1="${50 + side * (w - 1)}" y1="${y + 1}" x2="${50 + side * (w - 1)}" y2="${y + 5}" stroke="#7a5a2a" stroke-width="0.8"/><circle cx="${50 + side * (w - 1)}" cy="${y + 6}" r="1.6" fill="#d4a93c"/></g>`
		}
	})
	s += '<line x1="50" y1="31" x2="50" y2="6" stroke="#c9a13b" stroke-width="2.4"/>'
	for (let y = 12; y <= 27; y += 3) s += `<line x1="47" y1="${y}" x2="53" y2="${y}" stroke="#c9a13b" stroke-width="1.4"/>`
	s += '<circle cx="50" cy="5" r="2.2" fill="#c9a13b"/>'
	const leaf = 'M0 -4 L1.2 -1.4 L4 -2 L2.4 0.4 L3.6 3 L0.8 2 L0 4.4 L-0.8 2 L-3.6 3 L-2.4 0.4 L-4 -2 L-1.2 -1.4 Z'
	const paths = ['M92 8 C80 18 96 30 84 42 C74 52 88 64 80 78', 'M70 0 C58 12 74 22 64 34 C56 44 70 56 62 70', 'M98 30 C88 40 100 50 90 60 C82 70 94 80 88 92']
	paths.forEach((d, i) => {
		s += `<path data-part="leafpath${i}" d="${d}" fill="none" stroke="none"/>`
		s += `<path data-part="leaf${i}" d="${leaf}" fill="#d9532c" class="o thin" opacity="0"/>`
	})
	return s
}

export const STANDEES = [
	{
		code: 13, name: '雷門大提燈', lon: 139.796, lat: 35.711, rep: 'kanto', repLon: 141.9, repLat: 35.3,
		svg: `
			<rect class="o" x="18" y="16" width="6" height="81" fill="#5b3a29"/>
			<rect class="o" x="76" y="16" width="6" height="81" fill="#5b3a29"/>
			<rect class="o" x="12" y="9" width="76" height="8" rx="1.5" fill="#4a2f21"/>
			<g data-part="lantern" style="transform-origin:50px 17px">
				<line x1="50" y1="17" x2="50" y2="22" class="o"/>
				<rect class="o" x="32" y="21" width="36" height="7" rx="2" fill="#2b2420"/>
				<path class="o" fill="#c63a2c" d="M33 28 Q24 52 33 77 L67 77 Q76 52 67 28 Z"/>
				<path d="M31 40H69M29.5 52H70.5M31 64H69" stroke="#a52c20" stroke-width="1.1"/>
				<text x="50" y="49" font-size="17" text-anchor="middle" fill="#1d1916" font-weight="800" class="kanji">雷</text>
				<text x="50" y="70" font-size="17" text-anchor="middle" fill="#1d1916" font-weight="800" class="kanji">門</text>
				<rect class="o" x="34" y="76" width="32" height="7" rx="2" fill="#2b2420"/>
			</g>`,
		play: root => createTimeline().add($(root, 'lantern'), { rotate: [0, 13, -9, 5, -2, 0], duration: 1800, ease: 'inOut(2)' }),
	},
	{
		code: 14, name: '鎌倉大佛', lon: 139.536, lat: 35.317,
		svg: `
			<rect class="o" x="15" y="90" width="70" height="7" rx="2" fill="#5b4a3d"/>
			<path class="o" fill="#7aa094" d="M19 91 Q19 58 36 50 Q50 45 64 50 Q81 58 81 91 Z"/>
			<ellipse class="o" cx="50" cy="80" rx="17" ry="6" fill="#6a9085"/>
			<path class="o" fill="#7aa094" d="M36 29 Q31 34 35 45 Z M64 29 Q69 34 65 45 Z"/>
			<ellipse class="o" cx="50" cy="20" rx="6" ry="4.5" fill="#7aa094"/>
			<circle class="o" cx="50" cy="34" r="14" fill="#7aa094"/>
			<g fill="#5f857a"><circle cx="43" cy="25" r="1.9"/><circle cx="50" cy="23" r="1.9"/><circle cx="57" cy="25" r="1.9"/><circle cx="40" cy="29" r="1.9"/><circle cx="46.5" cy="28" r="1.9"/><circle cx="53.5" cy="28" r="1.9"/><circle cx="60" cy="29" r="1.9"/></g>
			<path d="M42.5 36 Q46 38 49 36 M51 36 Q54 38 57.5 36 M47 42.5 Q50 44 53 42.5" stroke="#2e3d38" stroke-width="1.3"/>
			<circle cx="50" cy="31.5" r="1" fill="#2e3d38"/>
			<path data-part="flypath" d="M96 12 C82 2 74 30 64 20 C58 14 54 10 50 15" fill="none" stroke="none"/>
			<g data-part="fly" opacity="0"><g data-part="wings"><path class="o thin" fill="#f2c94c" d="M0 0 Q-6 -7 -8 -1 Q-6 3 0 0 Q6 -7 8 -1 Q6 3 0 0Z"/></g></g>`,
		play: root => {
			const fly = $(root, 'fly')
			const path = motion(root, 'flypath')
			return createTimeline()
				.add(fly, { opacity: [0, 1], duration: 200 }, 0)
				.add(fly, { ...path, duration: 1500, ease: 'inOut(2)' }, 0)
				.add($(root, 'wings'), { scaleX: [1, 0.3, 1, 0.3, 1, 0.3, 1, 0.3, 1], duration: 1500, ease: 'linear' }, 0)
				.add(fly, { translateX: '-=26', translateY: '-=28', opacity: 0, duration: 800, ease: 'in(2)' }, '+=500')
				.add(fly, { translateX: 0, translateY: 0, duration: 0 })
		},
	},
	{
		code: 11, name: '烤地瓜', lon: 139.485, lat: 35.925,
		svg: `
			<path class="o" fill="#7a3b62" d="M20 92 Q12 66 32 50 Q56 32 78 36 Q91 40 83 56 Q68 82 40 94 Q27 98 20 92Z"/>
			<path class="o" fill="#f3c24f" d="M29 84 Q25 68 39 58 Q57 46 74 46 Q78 50 72 58 Q58 76 40 86 Q32 89 29 84Z"/>
			<path d="M38 74 Q52 62 66 55 M34 80 Q44 74 52 70" stroke="#e0a83a" stroke-width="1.4"/>
			<g data-part="steam" opacity="0" stroke="#8f989d" stroke-width="2.4">
				<path data-part="curl" d="M40 52 C36 44 44 40 40 32 C37 26 42 22 40 16"/>
				<path data-part="curl" d="M53 46 C49 38 57 34 53 26 C50 20 55 16 53 10"/>
				<path data-part="curl" d="M66 44 C62 36 70 32 66 24"/>
			</g>`,
		play: root => {
			const curls = createDrawable($$(root, 'curl'))
			return createTimeline()
				.add($(root, 'steam'), { opacity: [0, 1], duration: 150 }, 0)
				.add(curls, { draw: ['0 0', '0 1'], duration: 800, delay: (_, i) => i * 160, ease: 'out(2)' }, 0)
				.add(curls, { draw: '1 1', duration: 700, delay: (_, i) => i * 120, ease: 'in(2)' }, '+=250')
				.add($(root, 'steam'), { opacity: 0, duration: 100 })
		},
	},
	{
		code: 12, name: '落花生', lon: 140.15, lat: 35.35,
		svg: `
			<g transform="translate(0 7)">
				<ellipse class="o" cx="50" cy="37" rx="9" ry="11" fill="#b5523b"/>
				<ellipse class="o" cx="50" cy="68" rx="10" ry="12" fill="#b5523b"/>
				<g data-part="left" style="transform-origin:50px 89px">
					<path class="o" fill="#d9b77c" d="M50 17 C40 17 33 26 33 36 C33 44 38 48 38 52 C38 56 30 60 30 68 C30 80 39 89 50 89 Z"/>
					<path d="M37 30 L47 32 M35.5 40 L48 41 M34 63 L48 63 M34 74 L48 74 M43 21 Q39 36 43 48 M41 58 Q37 72 43 86" stroke="#b8925a" stroke-width="1"/>
				</g>
				<g data-part="right" style="transform-origin:50px 89px">
					<path class="o" fill="#d9b77c" d="M50 17 C60 17 67 26 67 36 C67 44 62 48 62 52 C62 56 70 60 70 68 C70 80 61 89 50 89 Z"/>
					<path d="M63 30 L53 32 M64.5 40 L52 41 M66 63 L52 63 M66 74 L52 74 M57 21 Q61 36 57 48 M59 58 Q63 72 57 86" stroke="#b8925a" stroke-width="1"/>
				</g>
			</g>`,
		play: root => createTimeline({ defaults: { ease: 'out(3)' } })
			.add($(root, 'left'), { rotate: -26, duration: 450 }, 0)
			.add($(root, 'right'), { rotate: 26, duration: 450 }, 0)
			.add($(root, 'left'), { rotate: 0, duration: 500, ease: 'inOut(2)' }, '+=650')
			.add($(root, 'right'), { rotate: 0, duration: 500, ease: 'inOut(2)' }, '<<'),
	},
	{
		code: 8, name: '稻草包納豆', lon: 140.471, lat: 36.371,
		svg: `
			<path class="o" fill="#dcb75e" d="M50 6 C29 30 25 62 33 96 L67 96 C75 62 71 30 50 6Z"/>
			<path d="M44 18 Q37 55 41 94 M50 12 V94 M56 18 Q63 55 59 94" stroke="#b8933f" stroke-width="1.1"/>
			<path class="o" d="M37 27 Q50 32 63 27 M32 84 Q50 90 68 84"/>
			<ellipse class="o" cx="50" cy="57" rx="13" ry="16" fill="#6b3f1f"/>
			<g fill="#b07a3a" stroke="#6b3f1f" stroke-width="0.6"><circle cx="45" cy="50" r="3.2"/><circle cx="52" cy="48" r="3.2"/><circle cx="56" cy="56" r="3.2"/><circle cx="47" cy="58" r="3.2"/><circle cx="53" cy="63" r="3.2"/><circle cx="44" cy="65" r="3.2"/><circle cx="50" cy="55" r="3.2"/></g>
			<g data-part="ito" stroke="#f3eedf" stroke-width="1.1" opacity="0">
				<path data-part="thread" d="M50 56 Q52 44 57 30"/>
				<path data-part="thread" d="M53 58 Q58 46 60 31"/>
				<path data-part="thread" d="M47 57 Q50 46 55 31"/>
			</g>
			<g data-part="hashi" opacity="0"><path d="M62 4 L55 30 M68 6 L59 31" stroke="#8a5a3b" stroke-width="2.6"/></g>`,
		play: root => {
			const threads = createDrawable($$(root, 'thread'))
			return createTimeline({ defaults: { ease: 'out(2)' } })
				.add($(root, 'hashi'), { opacity: [0, 1], translateY: [24, 0], duration: 350 }, 0)
				.add($(root, 'ito'), { opacity: [0, 1], duration: 100 }, 300)
				.add(threads, { draw: ['0 0', '0 1'], duration: 700 }, 300)
				.add($(root, 'hashi'), { translateY: -4, duration: 300, ease: 'inOut(2)' }, '<<')
				.add([$(root, 'hashi'), $(root, 'ito')], { opacity: 0, duration: 400 }, '+=450')
				.add($(root, 'hashi'), { translateY: 0, duration: 0 })
		},
	},
	{
		code: 9, name: '草莓', lon: 139.95, lat: 36.52,
		svg: `
			<g data-part="berry" style="transform-origin:50px 96px">
				<path class="o" fill="#d8383a" d="M50 96 C29 84 17 60 21 42 C25 28 40 26 50 32 C60 26 75 28 79 42 C83 60 71 84 50 96Z"/>
				<g fill="#f5d36b"><ellipse cx="34" cy="48" rx="1.2" ry="2"/><ellipse cx="44" cy="44" rx="1.2" ry="2"/><ellipse cx="56" cy="44" rx="1.2" ry="2"/><ellipse cx="66" cy="48" rx="1.2" ry="2"/><ellipse cx="38" cy="60" rx="1.2" ry="2"/><ellipse cx="50" cy="56" rx="1.2" ry="2"/><ellipse cx="62" cy="60" rx="1.2" ry="2"/><ellipse cx="44" cy="72" rx="1.2" ry="2"/><ellipse cx="56" cy="72" rx="1.2" ry="2"/><ellipse cx="50" cy="84" rx="1.2" ry="2"/></g>
				<path d="M29 48 Q31 39 39 37" stroke="#f39a9a" stroke-width="2.4"/>
				<g data-part="leaf" style="transform-origin:50px 33px">
					<path d="M50 33 Q50 22 55 13" stroke="#4f8a3c" stroke-width="3"/>
					<path class="o" fill="#5d9a45" d="M50 33 L37 23 L45 31 L34 35 L47 35 L50 45 L53 35 L66 35 L55 31 L63 23 Z"/>
				</g>
			</g>`,
		play: root => createTimeline()
			.add($(root, 'berry'), { scaleY: [1, 0.8, 1.12, 0.95, 1], scaleX: [1, 1.14, 0.92, 1.03, 1], translateY: [0, 0, -10, 0, 0], duration: 1100, ease: 'inOut(2)' }, 0)
			.add($(root, 'leaf'), { rotate: [0, -16, 12, -5, 0], duration: 1100, ease: 'inOut(2)' }, 0),
	},
	{
		code: 10, name: '高崎達磨', lon: 139.003, lat: 36.322,
		svg: `
			<g data-part="daruma" style="transform-origin:50px 96px">
				<path class="o" fill="#c62f2a" d="M50 96 C24 96 16 79 18 61 C20 39 32 18 50 16 C68 18 80 39 82 61 C84 79 76 96 50 96Z"/>
				<path class="o" fill="#fbf3e4" d="M50 26 C38 26 32 36 32 46 C32 56 40 62 50 62 C60 62 68 56 68 46 C68 36 62 26 50 26Z"/>
				<circle class="o thin" cx="42" cy="44" r="5" fill="#fff"/><circle cx="42" cy="44" r="3" fill="#1d1916"/>
				<circle class="o thin" cx="58" cy="44" r="5" fill="#fff"/>
				<path d="M35 36 Q41 30 46 36 M54 36 Q59 30 65 36 M38 55 Q44 50 50 55 Q56 50 62 55" stroke="#1d1916" stroke-width="2.4"/>
				<path d="M27 72 Q50 66 73 72" stroke="#e3b341" stroke-width="1.6"/>
				<text x="50" y="88" font-size="15" text-anchor="middle" fill="#e3b341" font-weight="800" class="kanji">福</text>
			</g>`,
		play: root => createTimeline().add($(root, 'daruma'), { rotate: [0, 62, -22, 11, -5, 2, 0], duration: 2000, ease: 'out(2)' }),
	},

	{
		code: 26, name: '五重塔', lon: 135.45, lat: 35.35,
		svg: pagoda(),
		play: root => {
			const tl = createTimeline()
				.add($$(root, 'bell'), { rotate: [0, 18, -14, 8, 0], duration: 1400, ease: 'inOut(2)', delay: (_, i) => i * 30 }, 0)
			for (let i = 0; i < 3; i++) {
				const leaf = $(root, 'leaf' + i)
				tl.add(leaf, { opacity: [0, 1, 1, 0], duration: 1800, ease: 'linear' }, i * 220)
					.add(leaf, { ...motion(root, 'leafpath' + i), rotate: [0, 260], duration: 1800, ease: 'inOut(1.5)' }, i * 220)
			}
			return tl
		},
	},
	{
		code: 27, name: '章魚燒', lon: 135.2, lat: 34.31,
		svg: `
			<path class="o" fill="#2c2a28" d="M10 78 H90 L86 94 H14 Z"/>
			<rect class="o" x="86" y="80" width="12" height="5" rx="2" fill="#5b3a29"/>
			<g data-part="ball1"><circle class="o" cx="28" cy="70" r="12" fill="#c98a3d"/><path fill="#5a2e17" d="M17 66 Q22 58 30 59 Q38 60 39 67 Q33 64 28 66 Q22 68 17 66Z"/></g>
			<g data-part="ball3"><circle class="o" cx="72" cy="70" r="12" fill="#c98a3d"/><path fill="#5a2e17" d="M61 66 Q66 58 74 59 Q82 60 83 67 Q77 64 72 66 Q66 68 61 66Z"/><line x1="78" y1="62" x2="88" y2="40" stroke="#e2cfa3" stroke-width="2"/></g>
			<g data-part="ball2" style="transform-box:fill-box;transform-origin:50% 50%">
				<circle class="o" cx="50" cy="64" r="14" fill="#c98a3d"/>
				<path fill="#5a2e17" d="M37 59 Q42 49 52 50 Q63 51 64 60 Q57 56 50 58 Q42 61 37 59Z"/>
				<path d="M40 56 L44 53 L48 57 L52 52 L56 56 L60 53" stroke="#fff4d6" stroke-width="1.5"/>
				<g fill="#5f8f3e"><circle cx="45" cy="60" r="0.9"/><circle cx="55" cy="59" r="0.9"/><circle cx="50" cy="62" r="0.9"/></g>
			</g>
			<g fill="#e7b98e" class="o thin">
				<path data-part="flake" style="transform-box:fill-box;transform-origin:50% 100%" d="M44 50 q-3 -6 2 -9 q2 4 -2 9z"/>
				<path data-part="flake" style="transform-box:fill-box;transform-origin:50% 100%" d="M54 50 q4 -6 -1 -10 q-3 5 1 10z"/>
				<path data-part="flake" style="transform-box:fill-box;transform-origin:50% 100%" d="M26 59 q-3 -5 2 -8 q2 4 -2 8z"/>
				<path data-part="flake" style="transform-box:fill-box;transform-origin:50% 100%" d="M72 59 q3 -5 -1 -8 q-2 4 1 8z"/>
			</g>`,
		play: root => createTimeline()
			.add($(root, 'ball2'), { translateY: [0, -26, 0], duration: 800, ease: 'inOut(2)' }, 0)
			.add($(root, 'ball2'), { rotate: [0, 360], duration: 800, ease: 'inOut(2)' }, 0)
			.add($$(root, 'flake'), { rotate: [0, -24, 18, -12, 8, 0], duration: 1400, delay: (_, i) => i * 80, ease: 'inOut(2)' }, 100),
	},
	{
		code: 28, name: '姬路城', lon: 134.694, lat: 34.839,
		svg: `
			<path class="o" fill="#9a958c" d="M22 97 L29 74 L71 74 L78 97 Z"/>
			<path d="M26 86 H74 M33 74 L31 97 M50 74 V97 M67 74 L69 97" stroke="#7b766d" stroke-width="0.9"/>
			<rect class="o" x="30" y="56" width="40" height="18" fill="#fbf8f0"/>
			<rect class="o" x="34" y="42" width="32" height="14" fill="#fbf8f0"/>
			<rect class="o" x="38" y="22" width="24" height="14" fill="#fbf8f0"/>
			<g fill="#3b3a36"><rect x="36" y="62" width="4" height="4"/><rect x="48" y="62" width="4" height="4"/><rect x="60" y="62" width="4" height="4"/><rect x="40" y="47" width="3" height="4"/><rect x="57" y="47" width="3" height="4"/><rect x="43" y="27" width="3" height="4"/><rect x="54" y="27" width="3" height="4"/></g>
			<path class="o" fill="#6f7d78" d="M33 24 L40 16 L60 16 L67 24 Z"/>
			<path d="M38 15 q-3 -4 1 -6 M62 15 q3 -4 -1 -6" stroke="#d4a93c" stroke-width="2"/>
			<path class="o" fill="#6f7d78" d="M27 45 L35 36 L65 36 L73 45 Z"/>
			<path class="o" fill="#fbf8f0" d="M42 39 L50 30 L58 39 Z"/>
			<path class="o" fill="#6f7d78" d="M23 59 L31 50 L69 50 L77 59 Z"/>
			<path data-part="heronpath" d="M52 30 C70 22 96 34 90 16 C85 2 62 4 46 -6" fill="none" stroke="none"/>
			<g data-part="heron" opacity="0">
				<path class="o thin" fill="#ffffff" d="M-7 1 Q0 -2 6 0 L10 -3 L9 0 L6 2 Q0 4 -7 1Z"/>
				<path data-part="wing" class="o thin" fill="#ffffff" style="transform-box:fill-box;transform-origin:50% 100%" d="M-3 0 Q0 -10 5 -12 Q3 -4 2 0Z"/>
			</g>`,
		play: root => {
			const heron = $(root, 'heron')
			return createTimeline()
				.add(heron, { opacity: [0, 1, 1, 0], duration: 1800, ease: 'linear' }, 0)
				.add(heron, { ...motion(root, 'heronpath'), duration: 1800, ease: 'inOut(1.5)' }, 0)
				.add($(root, 'wing'), { scaleY: [1, -0.6, 1, -0.6, 1, -0.6, 1, -0.6, 1], duration: 1800, ease: 'linear' }, 0)
		},
	},
	{
		code: 29, name: '鹿', lon: 135.84, lat: 34.685, rep: 'kansai', repLon: 136.4, repLat: 32.5,
		svg: `
			<g stroke="#7a4f2e" stroke-width="4.5" stroke-linecap="round"><path d="M44 66 L42 95 M51 68 L51 95 M68 68 L70 95 M76 66 L78 95"/></g>
			<ellipse class="o" cx="60" cy="58" rx="25" ry="13" fill="#b9814d"/>
			<ellipse cx="60" cy="64" rx="18" ry="5" fill="#d9ab78"/>
			<g fill="#f3e2c4"><ellipse cx="52" cy="52" rx="2" ry="1.4"/><ellipse cx="60" cy="50" rx="2" ry="1.4"/><ellipse cx="68" cy="52" rx="2" ry="1.4"/><ellipse cx="56" cy="56" rx="2" ry="1.4"/><ellipse cx="64" cy="56" rx="2" ry="1.4"/><ellipse cx="73" cy="55" rx="2" ry="1.4"/></g>
			<path class="o" fill="#f6efe1" d="M84 50 Q90 50 88 56 Q84 56 84 50Z"/>
			<g data-part="head" style="transform-origin:44px 54px">
				<path class="o" fill="#b9814d" d="M41 58 L31 33 L41 30 L50 54 Z"/>
				<ellipse class="o" cx="33" cy="25" rx="3" ry="7" fill="#b9814d" transform="rotate(-35 33 25)"/>
				<ellipse class="o" cx="42" cy="24" rx="3" ry="7" fill="#b9814d" transform="rotate(30 42 24)"/>
				<path class="o" fill="#b9814d" d="M28 26 Q38 24 41 32 Q38 38 30 38 L20 38 Q15 36 18 32 Z"/>
				<circle cx="31" cy="31" r="1.6" fill="#1d1916"/>
				<circle cx="17.5" cy="34" r="1.6" fill="#1d1916"/>
			</g>
			<g data-part="senbei" opacity="0" style="transform-box:fill-box;transform-origin:50% 50%">
				<circle class="o" cx="14" cy="62" r="7" fill="#e1b56c"/>
				<g fill="#b98b44"><circle cx="11" cy="60" r="0.9"/><circle cx="16" cy="59" r="0.9"/><circle cx="13" cy="65" r="0.9"/><circle cx="17" cy="64" r="0.9"/></g>
			</g>`,
		play: root => createTimeline()
			.add($(root, 'head'), { rotate: [0, -38, 0, -38, 0], duration: 1700, ease: 'inOut(2)' }, 0)
			.add($(root, 'senbei'), { opacity: [0, 1, 1, 0], scale: [0.2, 1.1, 1, 1], translateY: [8, -10, -14, -18], duration: 1000, ease: 'out(2)' }, 1300),
	},
	{
		code: 25, name: '信樂狸', lon: 136.07, lat: 34.906,
		svg: `
			<ellipse class="o" cx="38" cy="94" rx="9" ry="4" fill="#6e513a"/>
			<ellipse class="o" cx="62" cy="94" rx="9" ry="4" fill="#6e513a"/>
			<circle class="o" cx="50" cy="70" r="24" fill="#8a6447"/>
			<ellipse class="o" cx="50" cy="75" rx="16" ry="15" fill="#efe2c6"/>
			<path class="o" fill="#f2ead8" d="M74 58 Q70 62 72 68 Q68 74 72 82 L84 82 Q88 74 84 68 Q86 62 82 58 Z"/>
			<rect x="73.5" y="69" width="9" height="7" fill="#c63a2c"/>
			<rect class="o" x="17" y="64" width="11" height="15" rx="1" fill="#e7dcc4" transform="rotate(-12 22 71)"/>
			<g data-part="head" style="transform-origin:50px 48px">
				<circle class="o" cx="38" cy="26" r="4.5" fill="#8a6447"/><circle class="o" cx="62" cy="26" r="4.5" fill="#8a6447"/>
				<circle class="o" cx="50" cy="36" r="14" fill="#8a6447"/>
				<ellipse cx="50" cy="38" rx="10.5" ry="7.5" fill="#efe2c6"/>
				<ellipse data-part="eyeL" cx="45" cy="36" rx="1.8" ry="2.4" fill="#1d1916" style="transform-box:fill-box;transform-origin:50% 50%"/>
				<ellipse data-part="eyeR" cx="55" cy="36" rx="1.8" ry="2.4" fill="#1d1916" style="transform-box:fill-box;transform-origin:50% 50%"/>
				<ellipse cx="50" cy="41" rx="2.6" ry="1.9" fill="#1d1916"/>
				<g data-part="hat" style="transform-origin:50px 22px">
					<ellipse class="o" cx="50" cy="22" rx="25" ry="6" fill="#c99a4b"/>
					<path class="o" fill="#c99a4b" d="M40 21 Q42 12 50 11 Q58 12 60 21 Z"/>
				</g>
			</g>`,
		play: root => createTimeline({ defaults: { ease: 'inOut(2)' } })
			.add($(root, 'head'), { rotate: [0, -12, -12, 0], duration: 1300 }, 0)
			.add($(root, 'eyeR'), { scaleY: [1, 0.1, 0.1, 1], duration: 500 }, 350)
			.add($(root, 'hat'), { rotate: [0, -8, 4, 0], duration: 1300 }, 0),
	},
	{
		code: 30, name: '熊貓', lon: 135.42, lat: 33.78,
		svg: `
			<ellipse class="o" cx="36" cy="89" rx="11" ry="7" fill="#262422"/>
			<ellipse class="o" cx="64" cy="89" rx="11" ry="7" fill="#262422"/>
			<ellipse class="o" cx="50" cy="68" rx="24" ry="23" fill="#fbf8f0"/>
			<path d="M30 58 Q24 70 34 78" stroke="#262422" stroke-width="9" stroke-linecap="round"/>
			<path d="M28 64 Q20 52 22 40" stroke="#5d9a45" stroke-width="2.5"/>
			<path class="o thin" fill="#6fae52" d="M22 40 Q14 34 18 28 Q24 32 22 40Z M23 46 Q30 40 32 44 Q28 48 23 46Z"/>
			<g data-part="arm" style="transform-origin:69px 58px">
				<path d="M69 58 Q78 50 80 38" stroke="#262422" stroke-width="9" stroke-linecap="round"/>
			</g>
			<circle class="o" cx="37" cy="22" r="6" fill="#262422"/><circle class="o" cx="63" cy="22" r="6" fill="#262422"/>
			<circle class="o" cx="50" cy="35" r="16" fill="#fbf8f0"/>
			<ellipse cx="43" cy="35" rx="5" ry="6.5" fill="#262422" transform="rotate(25 43 35)"/>
			<ellipse cx="57" cy="35" rx="5" ry="6.5" fill="#262422" transform="rotate(-25 57 35)"/>
			<circle cx="44" cy="34" r="1.4" fill="#fff"/><circle cx="56" cy="34" r="1.4" fill="#fff"/>
			<ellipse cx="50" cy="42" rx="2.6" ry="1.8" fill="#262422"/>
			<path d="M47 45 Q50 47 53 45" stroke="#262422" stroke-width="1.2"/>`,
		play: root => createTimeline().add($(root, 'arm'), { rotate: [0, -28, 12, -28, 12, 0], duration: 1600, ease: 'inOut(2)' }),
	},
	{
		code: 24, name: '伊勢龍蝦', lon: 136.85, lat: 34.33,
		svg: `
			<rect class="o" x="16" y="78" width="68" height="6" rx="1.5" fill="#d6b27a"/>
			<path class="o" fill="#c9a36a" d="M27 84 H73 L70 97 H30 Z"/>
			<circle class="o thin" cx="50" cy="90" r="3.5" fill="#a9824b"/>
			<g data-part="ebi">
				<g data-part="ant" style="transform-origin:27px 54px">
					<path d="M27 54 Q30 20 64 8 Q84 4 94 14" stroke="#8f3423" stroke-width="2"/>
					<path d="M29 56 Q40 26 72 20 Q88 18 96 26" stroke="#8f3423" stroke-width="2"/>
				</g>
				<path d="M34 66 L30 76 M40 67 L37 77 M46 67 L44 77 M52 67 L51 77" stroke="#8f3423" stroke-width="1.8"/>
				<g data-part="tail" style="transform-origin:58px 62px">
					<path class="o" fill="#c4513a" d="M57 52 Q66 50 70 54 L70 68 Q64 71 57 70 Z"/>
					<path class="o" fill="#c4513a" d="M69 54 Q75 54 78 58 L78 68 Q74 70 69 68 Z"/>
					<path class="o" fill="#c4513a" d="M77 58 Q81 59 83 62 L83 69 Q80 70 77 68 Z"/>
					<path class="o" fill="#d86a4f" d="M82 62 L92 56 L94 66 L92 76 L82 70 Z"/>
				</g>
				<path class="o" fill="#b8452e" d="M24 60 Q26 47 42 46 Q56 46 60 54 L60 68 Q50 72 36 70 Q24 68 24 60Z"/>
				<path d="M30 50 l2 -4 M38 47 l1 -4 M46 47 l2 -4 M54 49 l2 -4" stroke="#8f3423" stroke-width="1.6"/>
				<circle cx="29" cy="55" r="1.8" fill="#1d1916"/>
			</g>`,
		play: root => createTimeline({ defaults: { ease: 'inOut(2)' } })
			.add($(root, 'tail'), { rotate: [0, 32, -8, 0], duration: 900 }, 0)
			.add($(root, 'ebi'), { translateX: [0, 7, 0], translateY: [0, -9, 0], duration: 700 }, 120)
			.add($(root, 'ant'), { rotate: [0, 7, -5, 3, 0], duration: 1300 }, 0),
	},
	{
		code: 1, name: '木雕熊', lon: 143.01, lat: 42.72, rep: 'hokkaido', repLon: 146.6, repLat: 41.4,
		svg: `
			<rect class="o" x="16" y="88" width="68" height="9" rx="2" fill="#8a6a45"/>
			<path class="o" fill="#7b5636" d="M22 89 Q18 58 36 50 Q58 42 74 56 Q84 66 80 89 Z"/>
			<path d="M36 62 Q40 72 36 84 M50 58 Q54 70 50 84 M64 62 Q68 72 66 84" stroke="#5b3d24" stroke-width="1.3"/>
			<g data-part="head" style="transform-origin:42px 54px">
				<circle class="o" cx="27" cy="26" r="6" fill="#7b5636"/><circle class="o" cx="53" cy="26" r="6" fill="#7b5636"/>
				<path class="o" fill="#7b5636" d="M20 40 Q20 24 40 24 Q60 24 60 40 Q60 56 40 57 Q20 56 20 40Z"/>
				<ellipse class="o thin" cx="40" cy="47" rx="10" ry="7" fill="#a78258"/>
				<ellipse cx="40" cy="43" rx="3.4" ry="2.4" fill="#1d1916"/>
				<circle cx="31" cy="36" r="2" fill="#1d1916"/><circle cx="49" cy="36" r="2" fill="#1d1916"/>
				<g data-part="fish" style="transform-origin:40px 51px">
					<path class="o" fill="#d97a5e" d="M12 50 Q26 42 42 50 Q58 56 68 48 L74 42 L74 60 L66 55 Q50 64 34 58 Q20 58 12 50Z"/>
					<path d="M46 52 Q50 56 48 60" stroke="#a84d36" stroke-width="1.2"/>
					<circle cx="20" cy="50" r="1.5" fill="#1d1916"/>
				</g>
			</g>`,
		play: root => createTimeline({ defaults: { ease: 'inOut(2)' } })
			.add($(root, 'head'), { rotate: [0, -8, 4, 0], duration: 1300 }, 0)
			.add($(root, 'fish'), { rotate: [0, 13, -11, 9, -7, 0], duration: 1300 }, 0),
	},
	{
		code: 2, name: '睡魔', lon: 140.74, lat: 40.824, rep: 'tohoku', repLon: 144.2, repLat: 38.6,
		svg: `
			<path class="o" d="M34 97 V82 M66 97 V82" stroke-width="3"/>
			<g data-part="face" style="transform-origin:50px 80px">
				<path class="o" fill="#f6e7c4" d="M14 44 Q14 12 50 10 Q86 12 86 44 Q86 72 66 82 L34 82 Q14 72 14 44Z"/>
				<path fill="#2b2420" d="M16 36 Q24 6 50 10 Q76 6 84 36 Q68 18 50 20 Q32 18 16 36Z"/>
				<path class="o thin" fill="#c63a2c" d="M20 46 Q28 30 44 40 L42 46 Q32 40 24 52Z"/>
				<path class="o thin" fill="#c63a2c" d="M80 46 Q72 30 56 40 L58 46 Q68 40 76 52Z"/>
				<g data-part="eyes" style="transform-box:fill-box;transform-origin:50% 50%">
					<ellipse class="o thin" cx="35" cy="48" rx="7" ry="4.5" fill="#fff"/><ellipse class="o thin" cx="65" cy="48" rx="7" ry="4.5" fill="#fff"/>
					<circle cx="36" cy="48" r="2.6" fill="#1d1916"/><circle cx="64" cy="48" r="2.6" fill="#1d1916"/>
				</g>
				<path class="o thin" fill="#3f7f9a" d="M44 56 Q50 50 56 56 L54 62 L46 62Z"/>
				<path class="o" fill="#c63a2c" d="M34 68 Q50 60 66 68 Q58 78 50 78 Q42 78 34 68Z"/>
				<path d="M40 69 H60" stroke="#fff" stroke-width="2"/>
			</g>`,
		play: root => createTimeline({ defaults: { ease: 'inOut(2)' } })
			.add($(root, 'face'), { rotate: [0, -9, 8, -5, 3, 0], translateY: [0, -5, 0, -3, 0, 0], duration: 1700 }, 0)
			.add($(root, 'eyes'), { scale: [1, 1.3, 1], duration: 500 }, 400),
	},
	{
		code: 3, name: '碗子蕎麥', lon: 141.153, lat: 39.702,
		svg: `
			<path class="o" fill="#2b2420" d="M16 74 H84 Q82 92 62 94 L38 94 Q18 92 16 74Z"/>
			<path class="o" fill="#b5352a" d="M20 76 H80 Q78 88 60 90 L40 90 Q22 88 20 76Z"/>
			<ellipse class="o" cx="50" cy="74" rx="34" ry="6" fill="#8c7a5c"/>
			<path d="M28 74 Q38 70 50 74 T72 73" stroke="#d5c7a2" stroke-width="1.6"/>
			<g data-part="bowl">
				<path class="o" fill="#2b2420" d="M34 18 H66 Q64 32 56 34 L44 34 Q36 32 34 18Z"/>
				<ellipse class="o" cx="50" cy="18" rx="16" ry="3.6" fill="#b5352a"/>
			</g>
			<g data-part="soba" opacity="0" stroke="#7f6b49" stroke-width="2.2">
				<path d="M45 36 Q42 50 46 66"/><path d="M50 36 Q53 50 50 68"/><path d="M55 36 Q58 50 54 66"/>
			</g>`,
		play: root => createTimeline()
			.add($(root, 'bowl'), { rotate: [0, -24, 0], translateY: [0, 4, 0], duration: 800, ease: 'inOut(2)' }, 0)
			.add($(root, 'soba'), { opacity: [0, 1, 1, 0], translateY: [-14, 10], duration: 800, ease: 'in(2)' }, 200),
	},
	{
		code: 4, name: '伊達政宗頭盔', lon: 140.857, lat: 38.253,
		svg: `
			<rect class="o" x="24" y="88" width="52" height="9" rx="2" fill="#5b3a29"/>
			<g data-part="helm" style="transform-origin:50px 88px">
				<path class="o" fill="#2f2f36" d="M16 72 Q10 84 22 90 L78 90 Q90 84 84 72 Q70 80 50 80 Q30 80 16 72Z"/>
				<path class="o" fill="#3c3c46" d="M24 74 Q22 40 50 38 Q78 40 76 74 Q50 84 24 74Z"/>
				<path d="M36 41 V76 M50 38 V80 M64 41 V76" stroke="#1d1d22" stroke-width="1.2"/>
				<g data-part="moon"><path class="o" fill="#e0b73c" d="M6 18 Q26 34 50 34 Q74 34 94 18 Q78 50 50 50 Q22 50 6 18Z"/></g>
				<circle class="o thin" cx="50" cy="48" r="4" fill="#c63a2c"/>
			</g>
			<path data-part="glint" d="M84 16 L86 22 L92 24 L86 26 L84 32 L82 26 L76 24 L82 22Z" fill="#fff6c7" opacity="0"/>`,
		play: root => createTimeline()
			.add($(root, 'helm'), { rotate: [0, 4, -2, 0], duration: 900, ease: 'inOut(2)' }, 0)
			.add($(root, 'glint'), { opacity: [0, 1, 0], scale: [0.4, 1.3, 0.4], duration: 800, ease: 'inOut(2)' }, 300),
	},
	{
		code: 5, name: '秋田犬', lon: 140.565, lat: 40.272,
		svg: `
			<g data-part="tail" style="transform-origin:76px 62px"><path class="o" fill="#d89a55" d="M74 66 Q92 62 88 44 Q84 34 76 40 Q84 46 78 52 Q72 56 70 60Z"/></g>
			<path class="o" fill="#d89a55" d="M28 62 Q42 52 62 54 Q80 56 80 72 L80 94 L68 94 L68 80 L44 80 L44 94 L32 94 Z"/>
			<path class="o" fill="#fbf1de" d="M30 64 Q40 72 44 80 L44 94 L34 94 Z"/>
			<g data-part="head" style="transform-origin:34px 58px">
				<path class="o" fill="#d89a55" d="M14 22 L24 8 L32 22Z M40 22 L50 8 L56 26Z"/>
				<path class="o" fill="#d89a55" d="M10 42 Q10 20 34 20 Q58 20 58 42 Q58 62 34 62 Q10 62 10 42Z"/>
				<path class="o thin" fill="#fbf1de" d="M18 46 Q22 36 34 36 Q46 36 50 46 Q48 60 34 60 Q20 60 18 46Z"/>
				<circle cx="24" cy="36" r="2.3" fill="#1d1916"/><circle cx="44" cy="36" r="2.3" fill="#1d1916"/>
				<ellipse cx="34" cy="46" rx="3.6" ry="2.6" fill="#1d1916"/>
				<path d="M28 52 Q34 56 40 52" stroke="#3a2e26" stroke-width="1.2"/>
			</g>`,
		play: root => createTimeline({ defaults: { ease: 'inOut(2)' } })
			.add($(root, 'head'), { rotate: [0, -10, -10, 0], duration: 1400 }, 0)
			.add($(root, 'tail'), { rotate: [0, 22, -14, 22, -14, 22, 0], duration: 1400 }, 0),
	},
	{
		code: 6, name: '櫻桃', lon: 139.83, lat: 38.03,
		svg: `
			<g data-part="branch" style="transform-origin:62px 12px">
				<path class="o" fill="#6e9a4f" d="M62 12 Q78 0 94 8 Q84 22 62 12Z"/>
				<path d="M62 12 Q42 28 32 56 M62 12 Q68 34 70 56" stroke="#5f7b39" stroke-width="2.4"/>
				<g data-part="left" style="transform-origin:32px 56px">
					<circle class="o" cx="30" cy="72" r="19" fill="#c8283a"/>
					<path d="M20 64 Q24 58 32 58" stroke="#ef8a93" stroke-width="2.6"/>
				</g>
				<g data-part="right" style="transform-origin:70px 56px">
					<circle class="o" cx="71" cy="74" r="19" fill="#d8344a"/>
					<path d="M61 66 Q65 60 73 60" stroke="#ef8a93" stroke-width="2.6"/>
				</g>
			</g>`,
		play: root => createTimeline({ defaults: { ease: 'inOut(2)' } })
			.add($(root, 'branch'), { rotate: [0, 5, -4, 2, 0], duration: 1500 }, 0)
			.add($(root, 'left'), { rotate: [0, -16, 8, -6, 0], duration: 1500 }, 0)
			.add($(root, 'right'), { rotate: [0, 16, -8, 6, 0], duration: 1500 }, 0),
	},
	{
		code: 7, name: '赤牛', lon: 139.93, lat: 37.488,
		svg: `
			<path class="o" fill="#c6352b" d="M36 56 Q60 46 84 56 Q92 64 88 76 L84 96 L74 96 L72 80 L48 80 L46 96 L36 96 L34 76 Q30 64 36 56Z"/>
			<g fill="#1d1916"><circle cx="58" cy="62" r="3"/><circle cx="70" cy="68" r="2.4"/><circle cx="48" cy="68" r="2.2"/></g>
			<path d="M42 58 Q60 50 80 58" stroke="#e8c24a" stroke-width="2"/>
			<path class="o thin" fill="#c6352b" d="M88 58 Q96 66 92 76 Q90 68 84 64Z"/>
			<g data-part="head" style="transform-origin:38px 50px">
				<path class="o" fill="#2b2420" d="M12 24 Q6 14 14 8 Q14 18 22 22Z M46 22 Q54 16 50 6 Q58 12 54 24Z"/>
				<path class="o" fill="#c6352b" d="M12 32 Q12 18 32 18 Q52 18 52 32 L50 50 Q48 62 32 62 Q16 62 14 50Z"/>
				<path class="o thin" fill="#f3e4c8" d="M18 48 Q32 42 46 48 Q46 60 32 60 Q18 60 18 48Z"/>
				<circle cx="23" cy="34" r="3" fill="#1d1916"/><circle cx="41" cy="34" r="3" fill="#1d1916"/>
				<circle cx="26" cy="53" r="1.4" fill="#1d1916"/><circle cx="38" cy="53" r="1.4" fill="#1d1916"/>
			</g>`,
		play: root => createTimeline({ defaults: { ease: 'inOut(2)' } })
			.add($(root, 'head'), { rotate: [0, -13, 11, -9, 7, -4, 2, 0], duration: 2200 }, 0),
	},
	{
		code: 15, name: '越光米飯糰', lon: 139.05, lat: 37.54,
		svg: `
			<g data-part="ear" style="transform-origin:82px 96px">
				<path d="M82 96 Q78 54 58 22" stroke="#a5913f" stroke-width="2.2"/>
				<g fill="#e3c557"><ellipse cx="60" cy="24" rx="5" ry="3" transform="rotate(50 60 24)"/><ellipse cx="65" cy="32" rx="5" ry="3" transform="rotate(50 65 32)"/><ellipse cx="70" cy="42" rx="5" ry="3" transform="rotate(60 70 42)"/><ellipse cx="55" cy="30" rx="5" ry="3" transform="rotate(20 55 30)"/><ellipse cx="62" cy="40" rx="5" ry="3" transform="rotate(30 62 40)"/></g>
			</g>
			<g data-part="rice" style="transform-origin:42px 94px">
				<path class="o" fill="#fffdf7" d="M42 34 Q52 34 62 52 L74 76 Q78 92 62 94 L22 94 Q6 92 10 76 L22 52 Q32 34 42 34Z"/>
				<g fill="#e7e1d3"><circle cx="38" cy="48" r="1.4"/><circle cx="48" cy="52" r="1.4"/><circle cx="30" cy="60" r="1.4"/><circle cx="56" cy="62" r="1.4"/></g>
				<path class="o" fill="#2d3a34" d="M26 72 H58 V94 H26Z"/>
				<path d="M33 76 V90 M42 76 V90 M51 76 V90" stroke="#3f4f47" stroke-width="1"/>
			</g>`,
		play: root => createTimeline({ defaults: { ease: 'inOut(2)' } })
			.add($(root, 'rice'), { translateY: [0, -12, 0, -5, 0], duration: 1100 }, 0)
			.add($(root, 'ear'), { rotate: [0, -10, 6, -3, 0], duration: 1500 }, 0),
	},
	{
		code: 16, name: '螢烏賊', lon: 137.34, lat: 36.77,
		svg: `
			<rect x="6" y="6" width="88" height="88" rx="8" class="o" fill="#1c2d42"/>
			<g data-part="squid" style="transform-origin:50px 50px">
				<path class="o" fill="#c9a8b4" d="M50 12 Q68 28 64 50 L36 50 Q32 28 50 12Z"/>
				<path class="o thin" fill="#c9a8b4" d="M36 26 Q24 34 34 44Z M64 26 Q76 34 66 44Z"/>
				<path d="M38 50 Q32 66 22 80 M44 50 Q42 68 36 86 M50 50 V88 M56 50 Q58 68 64 86 M62 50 Q68 66 78 80" stroke="#c9a8b4" stroke-width="2.4"/>
				<circle cx="43" cy="46" r="2.4" fill="#1d1916"/><circle cx="57" cy="46" r="2.4" fill="#1d1916"/>
				<g data-part="glow" fill="#7fd4ff" opacity="0.25">
					<circle cx="50" cy="26" r="2"/><circle cx="44" cy="34" r="2"/><circle cx="56" cy="34" r="2"/><circle cx="50" cy="40" r="2"/>
					<circle cx="28" cy="72" r="2.2"/><circle cx="38" cy="78" r="2.2"/><circle cx="50" cy="80" r="2.2"/><circle cx="62" cy="78" r="2.2"/><circle cx="72" cy="72" r="2.2"/>
				</g>
			</g>`,
		play: root => createTimeline({ defaults: { ease: 'inOut(2)' } })
			.add($(root, 'glow'), { opacity: [0.25, 1, 0.3, 1, 0.3, 1, 0.25], duration: 1800, ease: 'linear' }, 0)
			.add($(root, 'squid'), { translateY: [0, -5, 0], duration: 1800 }, 0),
	},
	{
		code: 17, name: '徽軫燈籠', lon: 136.662, lat: 36.562,
		svg: `
			<path class="o" fill="#8db7c7" d="M4 84 Q50 74 96 84 L96 97 L4 97Z"/>
			<path d="M16 90 H36 M58 88 H84" stroke="#d9edf3" stroke-width="1.6"/>
			<path class="o" fill="#8d8f8a" d="M36 86 L40 56 H48 L46 86Z"/>
			<path class="o" fill="#8d8f8a" d="M62 56 H70 L80 90 H70Z"/>
			<rect class="o" x="30" y="48" width="48" height="9" rx="2" fill="#a2a39d"/>
			<rect class="o" x="42" y="34" width="24" height="15" fill="#c8c7bf"/>
			<rect data-part="light" x="47" y="37" width="14" height="10" fill="#f6c84a" opacity="0.35"/>
			<path class="o" fill="#8d8f8a" d="M26 34 Q54 20 82 34 Q54 30 26 34Z"/>
			<circle class="o" cx="54" cy="20" r="4" fill="#a2a39d"/>
			<g data-part="snow" fill="#fff" opacity="0"><circle cx="30" cy="10" r="2"/><circle cx="60" cy="4" r="1.6"/><circle cx="82" cy="12" r="2"/><circle cx="16" cy="24" r="1.6"/><circle cx="90" cy="28" r="1.6"/></g>`,
		play: root => createTimeline()
			.add($(root, 'light'), { opacity: [0.35, 1, 0.35], duration: 1800, ease: 'inOut(2)' }, 0)
			.add($(root, 'snow'), { opacity: [0, 1, 1, 0], translateY: [0, 34], duration: 1800, ease: 'linear' }, 0)
			.add($(root, 'snow'), { translateY: 0, duration: 0 }),
	},
	{
		code: 18, name: '福井恐龍', lon: 136.5, lat: 36.08,
		svg: `
			<g data-part="tail" style="transform-origin:58px 64px"><path class="o" fill="#6f9a5a" d="M56 56 Q78 56 96 76 Q76 70 54 74Z"/></g>
			<path class="o" fill="#6f9a5a" d="M36 54 Q48 44 62 54 Q68 66 60 78 L62 96 L52 96 L50 82 L44 82 L44 96 L34 96 L34 76 Q30 64 36 54Z"/>
			<path d="M46 56 l-3 -5 l6 2 l1 -6 l4 6 l5 -3 l-1 6" stroke="#4d7340" stroke-width="1.3"/>
			<path d="M38 64 L26 66 L24 72 M38 64 L30 72" stroke="#3a2e26" stroke-width="1.8"/>
			<g data-part="head" style="transform-origin:42px 50px">
				<path class="o" fill="#6f9a5a" d="M38 54 Q32 30 26 24 Q14 18 8 26 Q4 34 12 38 L26 40 Q30 46 32 54Z"/>
				<circle cx="24" cy="27" r="2.2" fill="#1d1916"/>
				<g data-part="jaw" style="transform-origin:26px 40px"><path class="o" fill="#83ad6c" d="M12 38 L28 40 L26 48 Q16 48 10 42Z"/></g>
				<path d="M12 38 l2 3 l2 -3 l2 3 l2 -3 l2 3 l2 -3" stroke="#fffaf0" stroke-width="1"/>
			</g>`,
		play: root => createTimeline({ defaults: { ease: 'inOut(2)' } })
			.add($(root, 'head'), { rotate: [0, 12, -8, 0], duration: 1300 }, 0)
			.add($(root, 'jaw'), { rotate: [0, -26, -26, 0], duration: 1100 }, 100)
			.add($(root, 'tail'), { rotate: [0, -16, 12, 0], duration: 1300 }, 0),
	},
	{
		code: 19, name: '葡萄', lon: 138.36, lat: 35.60,
		svg: `
			<g data-part="grape" style="transform-origin:48px 14px">
				<path class="o" fill="#6e9a4f" d="M50 16 Q66 2 86 10 Q82 28 62 26 Q54 24 50 16Z"/>
				<path d="M48 4 V18 M66 12 Q72 16 72 22" stroke="#5f7b39" stroke-width="2.4"/>
				<g class="o" fill="#6a3f8c">
					<circle cx="32" cy="28" r="10"/><circle cx="50" cy="28" r="10"/><circle cx="68" cy="30" r="10"/>
					<circle cx="24" cy="44" r="10"/><circle cx="42" cy="44" r="10"/><circle cx="60" cy="46" r="10"/>
					<circle cx="33" cy="60" r="10"/><circle cx="51" cy="62" r="10"/><circle cx="42" cy="77" r="10"/>
				</g>
				<g fill="#b39ac8"><circle cx="29" cy="25" r="2"/><circle cx="47" cy="25" r="2"/><circle cx="21" cy="41" r="2"/><circle cx="39" cy="41" r="2"/><circle cx="30" cy="57" r="2"/><circle cx="48" cy="59" r="2"/><circle cx="39" cy="74" r="2"/></g>
			</g>
			<circle data-part="drop" class="o" cx="42" cy="77" r="9" fill="#6a3f8c" opacity="0"/>`,
		play: root => createTimeline({ defaults: { ease: 'inOut(2)' } })
			.add($(root, 'grape'), { rotate: [0, 8, -6, 3, 0], duration: 1500 }, 0)
			.add($(root, 'drop'), { opacity: [1, 1, 0], translateY: [0, 16], duration: 700, ease: 'in(2)' }, 300)
			.add($(root, 'drop'), { translateY: 0, duration: 0 }),
	},
	{
		code: 20, name: '泡湯雪猴', lon: 138.46, lat: 36.733,
		svg: `
			<g data-part="steam" opacity="0" stroke="#a3acb0" stroke-width="2.2">
				<path data-part="curl" d="M16 62 C12 52 20 48 16 38"/><path data-part="curl" d="M84 62 C80 52 88 48 84 38"/>
			</g>
			<g data-part="monkey" style="transform-origin:50px 80px">
				<path class="o" fill="#a79c8d" d="M24 78 Q24 58 50 56 Q76 58 76 78Z"/>
				<g data-part="head" style="transform-origin:50px 56px">
					<circle class="o" cx="26" cy="36" r="6" fill="#d98c82"/><circle class="o" cx="74" cy="36" r="6" fill="#d98c82"/>
					<circle class="o" cx="50" cy="34" r="25" fill="#a79c8d"/>
					<path class="o thin" fill="#d98c82" d="M33 30 Q42 24 50 30 Q58 24 67 30 Q70 46 50 50 Q30 46 33 30Z"/>
					<path d="M39 34 h6 M55 34 h6" stroke="#1d1916" stroke-width="2"/>
					<path d="M46 42 Q50 45 54 42" stroke="#3a2e26" stroke-width="1.2"/>
					<path class="o thin" fill="#fffaf0" d="M36 12 H64 L60 20 H40Z"/>
				</g>
			</g>
			<path class="o" fill="#8fc6cf" d="M6 76 Q50 66 94 76 L90 94 Q50 100 10 94Z"/>
			<path d="M20 82 Q30 78 40 82 M58 84 Q68 80 78 84" stroke="#d9edf3" stroke-width="1.6"/>`,
		play: root => {
			const curls = createDrawable($(root, 'curl'))
			return createTimeline()
				.add($(root, 'head'), { rotate: [0, -7, 7, -5, 0], duration: 1800, ease: 'inOut(2)' }, 0)
				.add($(root, 'monkey'), { translateY: [0, 3, 0], duration: 1800, ease: 'inOut(2)' }, 0)
				.add($(root, 'steam'), { opacity: [0, 1], duration: 150 }, 0)
				.add(curls, { draw: ['0 0', '0 1'], duration: 800, ease: 'out(2)' }, 0)
				.add(curls, { draw: '1 1', duration: 700, ease: 'in(2)' }, '+=250')
				.add($(root, 'steam'), { opacity: 0, duration: 100 })
		},
	},
	{
		code: 21, name: '合掌屋', lon: 136.906, lat: 36.257, rep: 'chubu', repLon: 134.2, repLat: 38.6,
		svg: `
			<rect class="o" x="24" y="66" width="52" height="30" fill="#6b4a35"/>
			<rect class="o thin" x="44" y="76" width="12" height="20" fill="#3a2e26"/>
			<rect class="o thin" x="30" y="72" width="9" height="9" fill="#f6d27a"/><rect class="o thin" x="61" y="72" width="9" height="9" fill="#f6d27a"/>
			<path class="o" fill="#a8824f" d="M50 8 L90 68 H10 Z"/>
			<path class="o" fill="#fffdf8" d="M50 8 L72 40 Q60 46 50 42 Q40 46 28 40 Z"/>
			<rect class="o thin" x="44" y="44" width="12" height="11" fill="#6b4a35"/>
			<path d="M50 44 V55 M44 49 H56" stroke="#3a2e26" stroke-width="0.9"/>
			<g data-part="snow" fill="#fff" stroke="#c4cfd6" stroke-width="0.4" opacity="0">
				<circle cx="14" cy="10" r="2.4"/><circle cx="30" cy="2" r="1.8"/><circle cx="72" cy="4" r="2.2"/><circle cx="88" cy="14" r="1.8"/><circle cx="6" cy="30" r="1.8"/><circle cx="94" cy="34" r="2.2"/>
			</g>`,
		play: root => createTimeline()
			.add($(root, 'snow'), { opacity: [0, 1, 1, 0], translateY: [0, 52], translateX: [0, 6, -4, 2], duration: 2200, ease: 'linear' }, 0)
			.add($(root, 'snow'), { translateY: 0, translateX: 0, duration: 0 }),
	},
	{
		code: 22, name: '富士山', lon: 138.727, lat: 35.361,
		svg: `
			<circle data-part="sun" class="o" cx="80" cy="24" r="11" fill="#e5553f"/>
			<path class="o" fill="#4b6f9a" d="M2 92 L38 22 Q50 14 62 22 L98 92 Z"/>
			<path class="o" fill="#fffdf8" d="M38 22 Q50 14 62 22 L74 46 L66 40 L58 50 L50 40 L42 50 L34 40 L26 46 Z"/>
			<g data-part="cloud" style="transform-origin:50px 76px">
				<path class="o" fill="#fffaf0" d="M2 82 Q6 70 18 74 Q26 62 40 70 Q52 66 56 78 Q66 78 66 88 H4 Q0 88 2 82Z"/>
			</g>
			<path class="o" fill="#6e9a4f" d="M2 88 Q50 80 98 88 V97 H2Z"/>`,
		play: root => createTimeline({ defaults: { ease: 'inOut(2)' } })
			.add($(root, 'cloud'), { translateX: [0, 30, 0], duration: 2400 }, 0)
			.add($(root, 'sun'), { translateY: [0, -7, 0], duration: 2400 }, 0),
	},
	{
		code: 23, name: '金鯱', lon: 136.9, lat: 35.185,
		svg: `
			<path class="o" fill="#3f4a4e" d="M18 88 Q50 80 82 88 L90 97 H10Z"/>
			<g data-part="fish" style="transform-origin:50px 88px">
				<path class="o" fill="#e0b73c" d="M34 88 Q26 62 34 42 Q42 26 58 20 Q70 34 66 50 Q62 72 66 88Z"/>
				<g data-part="tail" style="transform-origin:58px 24px">
					<path class="o" fill="#e8c652" d="M58 22 Q58 6 44 2 Q52 10 48 18 Q40 10 30 12 Q44 18 56 28Z"/>
				</g>
				<path d="M40 50 l6 4 l6 -4 M38 60 l6 4 l6 -4 l6 4 M38 70 l6 4 l6 -4 l6 4" stroke="#a9842a" stroke-width="1.1"/>
				<path class="o thin" fill="#fff0ae" d="M28 78 Q16 78 12 66 Q24 68 32 70Z M68 76 Q80 74 84 62 Q74 66 64 68Z"/>
				<circle cx="42" cy="38" r="3" fill="#fffaf0"/><circle cx="42.5" cy="38" r="1.4" fill="#1d1916"/>
			</g>
			<path data-part="glint" d="M78 18 L80 25 L87 27 L80 29 L78 36 L76 29 L69 27 L76 25Z" fill="#fff6c7" opacity="0"/>`,
		play: root => createTimeline({ defaults: { ease: 'inOut(2)' } })
			.add($(root, 'tail'), { rotate: [0, 16, -12, 8, 0], duration: 1400 }, 0)
			.add($(root, 'fish'), { rotate: [0, -3, 3, 0], duration: 1400 }, 0)
			.add($(root, 'glint'), { opacity: [0, 1, 0], scale: [0.4, 1.3, 0.4], duration: 800 }, 300),
	},
	{
		code: 31, name: '砂丘駱駝', lon: 134.228, lat: 35.54,
		svg: `
			<path class="o" fill="#e3c88f" d="M2 84 Q30 70 60 80 T98 76 V97 H2Z"/>
			<g data-part="camel">
				<path class="o" fill="#c49a62" d="M30 54 Q36 32 46 50 Q52 30 62 52 Q72 54 74 66 L74 90 L66 90 L64 72 L40 72 L38 90 L30 90 L30 68Z"/>
				<g data-part="head" style="transform-origin:32px 58px">
					<path class="o" fill="#c49a62" d="M34 60 Q26 44 26 32 Q24 22 14 24 Q6 26 8 34 Q16 36 20 38 Q20 50 26 64Z"/>
					<circle cx="16" cy="28" r="1.8" fill="#1d1916"/>
				</g>
			</g>`,
		play: root => createTimeline({ defaults: { ease: 'inOut(2)' } })
			.add($(root, 'camel'), { translateX: [0, -7, -7, 0], translateY: [0, -3, 0, 0], duration: 2000 }, 0)
			.add($(root, 'head'), { rotate: [0, 12, -6, 0], duration: 2000 }, 0),
	},
	{
		code: 32, name: '出雲大注連繩', lon: 132.685, lat: 35.402,
		svg: `
			<rect class="o" x="12" y="22" width="9" height="75" fill="#8a6a45"/>
			<rect class="o" x="79" y="22" width="9" height="75" fill="#8a6a45"/>
			<path class="o" fill="#6b5a3d" d="M4 16 Q50 6 96 16 L92 24 Q50 16 8 24Z"/>
			<g data-part="rope" style="transform-origin:50px 30px">
				<path class="o" fill="#d9c27a" d="M10 34 Q50 22 90 34 Q94 46 84 52 Q50 62 16 52 Q6 46 10 34Z"/>
				<path d="M22 32 L30 56 M36 28 L44 58 M50 27 L58 58 M64 28 L72 56 M78 31 L84 50" stroke="#ad9455" stroke-width="1.6"/>
				<path data-part="shide" class="o thin" fill="#fffdf8" style="transform-origin:34px 58px" d="M30 58 h8 l-3 7 h7 l-3 7 h7 l-4 8 l-8 -8 h-3 l3 -7 h-4Z"/>
				<path data-part="shide" class="o thin" fill="#fffdf8" style="transform-origin:66px 58px" d="M62 58 h8 l-3 7 h7 l-3 7 h7 l-4 8 l-8 -8 h-3 l3 -7 h-4Z"/>
			</g>`,
		play: root => createTimeline({ defaults: { ease: 'inOut(2)' } })
			.add($(root, 'rope'), { rotate: [0, 2, -2, 1, 0], duration: 1600 }, 0)
			.add($(root, 'shide'), { rotate: [0, 12, -10, 5, 0], duration: 1600, delay: (_, i) => i * 120 }, 0),
	},
	{
		code: 33, name: '岡山白桃', lon: 133.56, lat: 35.06,
		svg: `
			<g data-part="peach" style="transform-origin:50px 94px">
				<path class="o" fill="#6e9a4f" d="M50 28 Q34 8 12 16 Q22 36 50 32Z"/>
				<path class="o" fill="#7fac5d" d="M50 28 Q66 6 88 14 Q80 36 50 32Z"/>
				<path class="o" fill="#f7c9b7" d="M50 28 Q86 22 88 58 Q88 86 50 94 Q12 86 12 58 Q14 22 50 28Z"/>
				<path fill="#ee8f88" opacity="0.7" d="M50 28 Q86 22 88 58 Q88 86 50 94 Q72 66 50 28Z"/>
				<path d="M50 30 Q42 60 50 92" stroke="#c97a6e" stroke-width="1.6"/>
			</g>`,
		play: root => createTimeline({ defaults: { ease: 'inOut(2)' } })
			.add($(root, 'peach'), { rotate: [0, -12, 10, -6, 3, 0], translateY: [0, -5, 0, -3, 0, 0], duration: 1900 }, 0),
	},
	{
		code: 34, name: '宮島鳥居', lon: 132.32, lat: 34.296, rep: 'chugoku', repLon: 130.8, repLat: 36.9,
		svg: `
			<g data-part="gate">
				<path class="o" fill="#d0432e" d="M10 14 Q50 22 90 14 L92 24 Q50 30 8 24Z"/>
				<rect class="o" x="16" y="33" width="68" height="7" fill="#d0432e"/>
				<rect class="o thin" x="46" y="26" width="8" height="8" fill="#d0432e"/>
				<path class="o" fill="#d0432e" d="M24 26 H34 L36 88 H22Z M66 26 H76 L78 88 H64Z"/>
				<path class="o thin" fill="#b63623" d="M14 60 H22 L22 88 H14Z M78 60 H86 L86 88 H78Z"/>
			</g>
			<path class="o" fill="#7fb3c6" d="M2 78 Q12 72 25 78 T50 78 T75 78 T98 78 V97 H2Z"/>
			<g data-part="wave"><path d="M6 86 Q14 82 22 86 T38 86 M58 90 Q66 86 74 90 T90 90" stroke="#e1f0f5" stroke-width="1.8"/></g>`,
		play: root => createTimeline({ defaults: { ease: 'inOut(2)' } })
			.add($(root, 'gate'), { translateY: [0, -6, 0], duration: 2000 }, 0)
			.add($(root, 'wave'), { translateX: [0, 8, -6, 0], duration: 2000 }, 0),
	},
	{
		code: 35, name: '河豚', lon: 130.945, lat: 33.957,
		svg: `
			<path class="o" fill="#7fb3c6" d="M2 84 Q25 78 50 84 T98 84 V97 H2Z"/>
			<g data-part="fugu" style="transform-origin:48px 50px">
				<path class="o" fill="#d9a44a" d="M76 46 L92 34 L90 50 L94 64 L76 54Z"/>
				<ellipse class="o" cx="48" cy="50" rx="31" ry="26" fill="#e3b75b"/>
				<path fill="#fffaf0" d="M20 58 Q48 86 76 58 Q60 70 48 70 Q34 70 20 58Z"/>
				<g fill="#7b5a2b"><circle cx="50" cy="34" r="2.2"/><circle cx="62" cy="40" r="2.2"/><circle cx="58" cy="28" r="1.8"/><circle cx="68" cy="32" r="1.6"/></g>
				<path d="M18 40 l-5 -3 M30 24 l-3 -6 M48 22 v-6 M66 26 l3 -6 M26 72 l-4 5 M48 78 v6 M68 72 l4 5" stroke="#8f6a2f" stroke-width="1.8"/>
				<circle cx="30" cy="44" r="5" fill="#fffaf0" class="o thin"/><circle cx="29" cy="44" r="2.4" fill="#1d1916"/>
				<ellipse class="o thin" cx="17" cy="54" rx="4" ry="3" fill="#d97a5e"/>
				<g data-part="fin" style="transform-origin:48px 50px"><path class="o thin" fill="#d9a44a" d="M46 50 Q40 60 52 62 Q54 54 50 48Z"/></g>
			</g>`,
		play: root => createTimeline()
			.add($(root, 'fugu'), { scale: [1, 1.28, 1.28, 1], duration: 1800, ease: 'inOut(3)' }, 0)
			.add($(root, 'fin'), { rotate: [0, 25, -15, 25, 0], duration: 1800, ease: 'inOut(2)' }, 0),
	},
	{
		code: 36, name: '鳴門漩渦', lon: 134.65, lat: 34.238,
		svg: `
			<ellipse class="o" cx="50" cy="66" rx="46" ry="30" fill="#5b9ab2"/>
			<g data-part="swirl" style="transform-origin:50px 66px">
				<path d="M50 66 Q60 62 62 70 Q60 80 46 78 Q30 72 38 60 Q50 46 70 56 Q86 68 74 84" stroke="#e1f0f5" stroke-width="2.6"/>
				<path d="M50 66 Q40 70 38 62 Q40 52 54 54 Q70 60 62 72 Q50 86 30 76 Q14 64 26 48" stroke="#b5dce8" stroke-width="2.2"/>
				<ellipse cx="50" cy="66" rx="5" ry="3.4" fill="#2f5f73"/>
			</g>
			<g data-part="boat" style="transform-origin:50px 66px">
				<path class="o" fill="#fffaf0" d="M72 40 L88 38 L84 46 L72 46Z"/>
				<path d="M78 38 V26 L88 32 L78 34" stroke="#3a2e26" stroke-width="1.2"/>
			</g>`,
		play: root => createTimeline({ defaults: { ease: 'inOut(2)' } })
			.add($(root, 'swirl'), { rotate: [0, -360], duration: 2200 }, 0)
			.add($(root, 'boat'), { translateX: [0, -8, 0], translateY: [0, 8, 0], rotate: [0, -8, 0], duration: 2200 }, 0),
	},
	{
		code: 37, name: '讚岐烏龍麵', lon: 134.19, lat: 34.24, rep: 'shikoku', repLon: 134.1, repLat: 30.2,
		svg: `
			<path class="o" fill="#3f6f8c" d="M12 58 H88 Q86 88 62 94 H38 Q14 88 12 58Z"/>
			<path d="M20 74 Q50 84 80 74" stroke="#d9edf3" stroke-width="1.6"/>
			<ellipse class="o" cx="50" cy="58" rx="38" ry="9" fill="#e9dfc2"/>
			<path d="M20 58 Q32 52 44 58 T70 58 M26 62 Q40 56 54 62 T78 60" stroke="#fffdf7" stroke-width="2"/>
			<circle class="o thin" cx="72" cy="56" r="3" fill="#6e9a4f"/><circle class="o thin" cx="66" cy="60" r="2.4" fill="#6e9a4f"/>
			<g data-part="lift" style="transform-origin:50px 56px">
				<path d="M50 56 Q44 40 50 26 M56 56 Q50 40 56 26 M44 56 Q38 42 44 28" stroke="#fffdf7" stroke-width="3"/>
				<path d="M34 8 L62 30 M44 4 L68 26" stroke="#8a5a3b" stroke-width="2.6"/>
			</g>`,
		play: root => createTimeline({ defaults: { ease: 'inOut(2)' } })
			.add($(root, 'lift'), { translateY: [0, -14, -14, 0], duration: 1600 }, 0),
	},
	{
		code: 38, name: '愛媛蜜柑', lon: 132.91, lat: 33.66,
		svg: `
			<g data-part="mikan" style="transform-origin:50px 94px">
				<circle class="o" cx="50" cy="56" r="37" fill="#f09a2c"/>
				<path d="M26 40 Q34 28 46 26" stroke="#fbcd7e" stroke-width="3.4"/>
				<g fill="#d67f1c"><circle cx="66" cy="44" r="1.2"/><circle cx="72" cy="60" r="1.2"/><circle cx="58" cy="72" r="1.2"/><circle cx="38" cy="68" r="1.2"/><circle cx="50" cy="50" r="1.2"/></g>
				<circle cx="50" cy="20" r="4.6" fill="#6e9a4f" class="o thin"/>
				<path class="o" fill="#6e9a4f" d="M50 20 Q64 4 82 12 Q72 28 50 20Z"/>
			</g>
			<g data-part="drops" fill="#f9b84c" opacity="0"><circle cx="12" cy="30" r="2.6"/><circle cx="92" cy="34" r="2.6"/><circle cx="8" cy="52" r="2"/><circle cx="96" cy="56" r="2"/></g>`,
		play: root => createTimeline()
			.add($(root, 'mikan'), { translateY: [0, -14, 0], scaleY: [1, 1.06, 0.92, 1], duration: 900, ease: 'inOut(2)' }, 0)
			.add($(root, 'drops'), { opacity: [0, 1, 0], translateY: [0, -10], duration: 600, ease: 'out(2)' }, 600),
	},
	{
		code: 39, name: '鰹魚', lon: 133.02, lat: 33.21,
		svg: `
			<path class="o" fill="#6da7be" d="M2 84 Q12 74 25 84 T50 84 T75 84 T98 84 V97 H2Z"/>
			<g data-part="fish" style="transform-origin:50px 60px">
				<path class="o" fill="#3e566f" d="M8 50 Q30 26 62 36 Q76 40 84 50 L96 36 L94 56 L98 74 L84 60 Q70 72 48 72 Q22 70 8 50Z"/>
				<path fill="#e4edf2" d="M14 56 Q40 66 80 58 Q62 72 44 71 Q24 68 14 56Z"/>
				<path d="M36 58 Q44 60 60 56 M34 62 Q44 65 58 60 M38 66 Q46 68 54 65" stroke="#6b829a" stroke-width="1.2"/>
				<path class="o thin" fill="#3e566f" d="M44 34 L56 22 L60 38Z"/>
				<circle cx="22" cy="48" r="3" fill="#fffaf0"/><circle cx="21.5" cy="48" r="1.5" fill="#1d1916"/>
			</g>`,
		play: root => createTimeline({ defaults: { ease: 'inOut(2)' } })
			.add($(root, 'fish'), { translateY: [0, -18, 0], rotate: [0, 14, -10, 0], duration: 1300 }, 0),
	},
	{
		code: 40, name: '博多屋台', lon: 130.4, lat: 33.592,
		svg: `
			<rect class="o" x="10" y="26" width="5" height="60" fill="#5b3a29"/><rect class="o" x="85" y="26" width="5" height="60" fill="#5b3a29"/>
			<path class="o" fill="#8a5a3b" d="M4 28 L14 12 H86 L96 28Z"/>
			<g data-part="noren" style="transform-origin:50px 28px">
				<path class="o" fill="#c63a2c" d="M15 28 H85 V48 H72 L70 44 V48 H52 L50 44 V48 H31 L29 44 V48 H15Z"/>
				<text x="50" y="42" font-size="12" text-anchor="middle" fill="#fffaf0" font-weight="800" class="kanji">博多</text>
			</g>
			<rect class="o" x="8" y="66" width="84" height="8" fill="#a97f58"/>
			<path class="o" fill="#7a5238" d="M14 74 H86 V92 H14Z"/>
			<path d="M14 80 H86 M14 86 H86" stroke="#5b3a29" stroke-width="1"/>
			<circle class="o" cx="24" cy="93" r="3.6" fill="#3f3530"/><circle class="o" cx="76" cy="93" r="3.6" fill="#3f3530"/>
			<g data-part="lamp" style="transform-origin:80px 48px">
				<line x1="80" y1="48" x2="80" y2="53" stroke="#3a2e26" stroke-width="1"/>
				<ellipse class="o" cx="80" cy="59" rx="6" ry="7" fill="#f6c84a"/>
			</g>
			<g data-part="steam" opacity="0" stroke="#a3acb0" stroke-width="2"><path d="M38 64 C34 58 42 56 38 50"/><path d="M52 64 C48 58 56 56 52 50"/></g>`,
		play: root => createTimeline({ defaults: { ease: 'inOut(2)' } })
			.add($(root, 'noren'), { skewX: [0, 8, -5, 0], duration: 1600 }, 0)
			.add($(root, 'lamp'), { rotate: [0, 16, -12, 6, 0], duration: 1600 }, 0)
			.add($(root, 'steam'), { opacity: [0, 1, 0], translateY: [0, -8], duration: 1400 }, 0),
	},
	{
		code: 41, name: '佐賀熱氣球', lon: 130.3, lat: 33.245,
		svg: `
			<g data-part="balloon" style="transform-origin:50px 90px">
				<path class="o" fill="#e5553f" d="M50 4 Q86 4 86 38 Q86 58 58 72 L42 72 Q14 58 14 38 Q14 4 50 4Z"/>
				<path class="o thin" fill="#f6c84a" d="M50 4 Q68 6 68 38 Q68 58 54 72 L46 72 Q32 58 32 38 Q32 6 50 4Z"/>
				<path class="o thin" fill="#3f7f9a" d="M50 4 Q56 8 56 38 Q56 58 50 72 Q44 58 44 38 Q44 8 50 4Z"/>
				<path d="M43 72 L45 84 M57 72 L55 84" stroke="#3a2e26" stroke-width="1.2"/>
				<rect class="o" x="42" y="84" width="16" height="11" rx="1.5" fill="#a97f58"/>
				<path d="M42 89 H58" stroke="#7a5238" stroke-width="1"/>
				<g data-part="flame" opacity="0"><path fill="#f6a23c" d="M50 80 Q46 74 50 68 Q54 74 50 80Z"/></g>
			</g>`,
		play: root => createTimeline({ defaults: { ease: 'inOut(2)' } })
			.add($(root, 'flame'), { opacity: [0, 1, 0, 1, 0], duration: 800 }, 0)
			.add($(root, 'balloon'), { translateY: [0, -12, 0], rotate: [0, 2, -2, 0], duration: 2200 }, 200),
	},
	{
		code: 42, name: '眼鏡橋', lon: 129.879, lat: 32.746,
		svg: `
			<path class="o" fill="#8db7c7" d="M2 62 H98 V97 H2Z"/>
			<path class="o" fill="#a9a59a" d="M2 62 Q2 44 12 44 Q50 34 88 44 Q98 44 98 62 H82 Q82 44 67 44 Q52 44 52 62 H48 Q48 44 33 44 Q18 44 18 62Z"/>
			<path d="M8 50 H14 M46 40 H54 M86 50 H92 M28 40 l3 -1 M72 40 l-3 -1" stroke="#7d796f" stroke-width="1.2"/>
			<g data-part="mirror" style="transform-origin:50px 62px">
				<path class="o thin" fill="#6e8f9a" d="M18 62 Q18 80 33 80 Q48 80 48 62Z M52 62 Q52 80 67 80 Q82 80 82 62Z"/>
			</g>
			<g data-part="wave"><path d="M8 88 Q16 84 24 88 T40 88 M58 90 Q66 86 74 90 T90 90" stroke="#e1f0f5" stroke-width="1.6"/></g>`,
		play: root => createTimeline({ defaults: { ease: 'inOut(2)' } })
			.add($(root, 'mirror'), { scaleX: [1, 1.08, 0.94, 1.04, 1], scaleY: [1, 0.9, 1.08, 0.96, 1], duration: 1800 }, 0)
			.add($(root, 'wave'), { translateX: [0, 8, -6, 0], duration: 1800 }, 0),
	},
	{
		code: 43, name: '熊本城', lon: 130.706, lat: 32.806,
		svg: `
			<path class="o" fill="#8f8879" d="M10 96 Q22 80 24 66 H76 Q78 80 90 96Z"/>
			<path d="M20 86 H80 M24 76 H76 M34 67 L28 96 M50 67 V96 M66 67 L72 96" stroke="#6d675b" stroke-width="1"/>
			<g data-part="keep" style="transform-origin:50px 66px">
				<rect class="o" x="30" y="50" width="40" height="17" fill="#2e2c2c"/>
				<path class="o" fill="#3f3b3b" d="M20 52 Q50 42 80 52 L74 46 H26Z"/>
				<rect class="o" x="36" y="32" width="28" height="15" fill="#2e2c2c"/>
				<path class="o" fill="#3f3b3b" d="M26 34 Q50 24 74 34 L68 28 H32Z"/>
				<rect class="o" x="42" y="18" width="16" height="11" fill="#fffaf0"/>
				<path class="o" fill="#3f3b3b" d="M34 19 Q50 8 66 19 L58 14 H42Z"/>
				<path d="M34 8 Q36 12 40 13 M66 8 Q64 12 60 13" stroke="#e0b73c" stroke-width="2"/>
				<rect x="36" y="55" width="6" height="6" fill="#fffaf0"/><rect x="47" y="55" width="6" height="6" fill="#fffaf0"/><rect x="58" y="55" width="6" height="6" fill="#fffaf0"/>
			</g>
			<g data-part="crow" opacity="0"><path class="o thin" fill="#1d1916" d="M0 0 Q-5 -6 -9 -2 Q-4 0 0 2 Q4 0 9 -2 Q5 -6 0 0Z"/></g>`,
		play: root => createTimeline({ defaults: { ease: 'inOut(2)' } })
			.add($(root, 'keep'), { rotate: [0, -1.5, 1.5, 0], duration: 1500 }, 0)
			.add($(root, 'crow'), { opacity: [0, 1, 1, 0], translateX: [10, 92], translateY: [36, 10], duration: 1500, ease: 'linear' }, 0),
	},
	{
		code: 44, name: '別府溫泉', lon: 131.49, lat: 33.28,
		svg: `
			<g data-part="steam" opacity="0" stroke="#c63a2c" stroke-width="4.4">
				<path data-part="curl" d="M34 52 C26 42 42 36 34 24 C30 18 36 12 34 6"/>
				<path data-part="curl" d="M50 52 C42 42 58 36 50 24 C46 18 52 12 50 6"/>
				<path data-part="curl" d="M66 52 C58 42 74 36 66 24 C62 18 68 12 66 6"/>
			</g>
			<g data-part="tub" style="transform-origin:50px 96px">
				<path class="o" fill="#c49a62" d="M14 54 H86 L80 94 H20Z"/>
				<path d="M32 56 L34 92 M50 56 V92 M68 56 L66 92" stroke="#9c7746" stroke-width="1.2"/>
				<path class="o" fill="#7a5238" d="M13 64 H87 L86 70 H14Z M18 84 H82 L81 89 H19Z"/>
				<ellipse class="o" cx="50" cy="54" rx="37" ry="7" fill="#8fc6cf"/>
				<path class="o thin" fill="#fffdf7" d="M60 48 Q72 44 80 50 L76 56 Q68 56 60 54Z"/>
			</g>`,
		play: root => {
			const curls = createDrawable($(root, 'curl'))
			return createTimeline()
				.add($(root, 'steam'), { opacity: [0, 1], duration: 150 }, 0)
				.add(curls, { draw: ['0 0', '0 1'], duration: 800, delay: (_, i) => i * 140, ease: 'out(2)' }, 0)
				.add($(root, 'tub'), { scaleY: [1, 0.96, 1], duration: 500, ease: 'inOut(2)' }, 0)
				.add(curls, { draw: '1 1', duration: 700, delay: (_, i) => i * 100, ease: 'in(2)' }, '+=300')
				.add($(root, 'steam'), { opacity: 0, duration: 100 })
		},
	},
	{
		code: 45, name: '宮崎芒果', lon: 131.22, lat: 32.42,
		svg: `
			<g data-part="rays" style="transform-origin:50px 58px" opacity="0" stroke="#f6c84a" stroke-width="2.6">
				<path d="M92 26 l5 -5 M96 56 h4 M8 26 l-5 -5 M4 56 h-4 M88 90 l5 5 M12 90 l-5 5"/>
			</g>
			<g data-part="fruit" style="transform-origin:50px 18px">
				<path d="M50 18 V6" stroke="#5f7b39" stroke-width="2.6"/>
				<path class="o" fill="#6e9a4f" d="M50 12 Q66 0 84 8 Q74 22 50 12Z"/>
				<path class="o" fill="#e8513a" d="M50 18 Q84 16 86 50 Q88 88 56 94 Q18 96 14 62 Q12 24 50 18Z"/>
				<path fill="#f6a23c" opacity="0.85" d="M16 62 Q22 88 56 92 Q34 80 28 56 Q24 40 34 26 Q10 38 16 62Z"/>
				<path d="M60 30 Q72 34 76 48" stroke="#f59a85" stroke-width="3"/>
			</g>`,
		play: root => createTimeline({ defaults: { ease: 'inOut(2)' } })
			.add($(root, 'fruit'), { rotate: [0, 10, -8, 4, 0], duration: 1600 }, 0)
			.add($(root, 'rays'), { opacity: [0, 1, 0], scale: [0.85, 1.05, 0.85], duration: 1600 }, 0),
	},
	{
		code: 46, name: '櫻島', lon: 130.657, lat: 31.585, rep: 'kyushu', repLon: 127.9, repLat: 33.3,
		svg: `
			<g data-part="smoke" opacity="0" style="transform-origin:50px 30px">
				<path class="o thin" fill="#a3a099" d="M50 30 Q40 26 42 18 Q36 8 48 6 Q56 -2 66 6 Q78 6 74 16 Q72 26 58 26 Q54 30 50 30Z"/>
			</g>
			<path class="o" fill="#6b5a4e" d="M4 88 L40 30 L46 34 L52 28 L60 34 L96 88Z"/>
			<path d="M40 44 L34 60 M52 40 L54 62 M64 46 L70 64" stroke="#4f4238" stroke-width="1.3"/>
			<path d="M46 34 L52 28 L60 34 L52 38Z" fill="#d0432e"/>
			<path class="o" fill="#6e9a4f" d="M4 88 Q24 70 50 76 Q76 70 96 88Z"/>
			<path class="o" fill="#6da7be" d="M2 86 Q25 80 50 86 T98 86 V97 H2Z"/>`,
		play: root => createTimeline()
			.add($(root, 'smoke'), { opacity: [0, 1, 1, 0], scale: [0.4, 1.25], translateY: [10, -14], duration: 2000, ease: 'out(2)' }, 0)
			.add($(root, 'smoke'), { translateY: 0, duration: 0 }),
	},
	{
		code: 47, name: '風獅爺', lon: 128.21, lat: 26.71, rep: 'okinawa', repLon: 125.6, repLat: 27.5,
		svg: `
			<rect class="o" x="22" y="86" width="56" height="10" rx="2" fill="#c97a4a"/>
			<path class="o" fill="#d78a4e" d="M28 86 Q24 58 40 52 H66 Q78 60 74 86Z"/>
			<path class="o thin" fill="#d78a4e" d="M74 70 Q90 66 84 50 Q82 46 78 50 Q82 58 72 62Z"/>
			<g data-part="head" style="transform-origin:48px 58px">
				<path class="o" fill="#b5652e" d="M14 30 Q6 10 24 12 Q32 2 48 8 Q64 2 72 12 Q90 10 82 30 Q90 46 76 54 Q66 64 48 62 Q30 64 20 54 Q6 46 14 30Z"/>
				<path class="o" fill="#e0a067" d="M22 34 Q26 16 48 16 Q70 16 74 34 Q74 56 48 56 Q22 56 22 34Z"/>
				<circle class="o thin" cx="36" cy="30" r="6" fill="#fffaf0"/><circle class="o thin" cx="60" cy="30" r="6" fill="#fffaf0"/>
				<circle cx="37" cy="30" r="3" fill="#1d1916"/><circle cx="59" cy="30" r="3" fill="#1d1916"/>
				<ellipse class="o thin" cx="48" cy="38" rx="5" ry="3.6" fill="#b5652e"/>
				<g data-part="jaw" style="transform-origin:48px 44px"><path class="o" fill="#c63a2c" d="M34 44 Q48 40 62 44 Q60 56 48 56 Q36 56 34 44Z"/><path d="M38 44 l2 4 l2 -4 l2 4 l2 -4 l2 4 l2 -4 l2 4 l2 -4" stroke="#fffaf0" stroke-width="1"/></g>
			</g>`,
		play: root => createTimeline({ defaults: { ease: 'inOut(2)' } })
			.add($(root, 'head'), { rotate: [0, -10, 10, -6, 0], duration: 1500 }, 0)
			.add($(root, 'jaw'), { scaleY: [1, 1.35, 1.35, 1], duration: 1200 }, 150),
	},
]

export const standeeByCode = Object.fromEntries(STANDEES.map(s => [s.code, s]))
