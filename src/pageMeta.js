import { prefs, regionById } from './data/regions.js'
import { spotById, spotsOfPref, spotsOfRegion, spots } from './data/spots.js'

const SITE = '旅帖'
const home = {
	title: `${SITE} TABICHŌ｜日本旅行手帖`,
	description: `把日本攤開在桌上：立體和紙地圖導覽，9 個地方、47 都道府縣、${spots.length} 處景點，一個地方一個地方慢慢讀。`,
	image: 'og/home.jpg',
}

const chain = (pref, region) => pref.zh.startsWith(region.name) ? pref.zh : `${pref.zh}｜${region.name}`

export function pageMeta({ name, params }) {
	if (name === 'wishlist') return { ...home, title: `想去清單｜${SITE}`, noindex: true }
	if (name === 'spot') {
		const s = spotById[params.id]
		if (!s) return home
		const pref = prefs[s.pref]
		return {
			title: `${s.name}｜${pref.zh}｜${SITE}`,
			description: `${s.summary}${pref.zh}・${regionById[s.region].name}，建議停留 ${s.stay}。`,
			image: `og/spot/${s.id}.jpg`,
			article: true,
		}
	}
	const region = regionById[params.region]
	if (!region) return home
	const pref = region.prefs.map(c => prefs[c]).find(p => p.slug === params.pref)
	if (pref) {
		const list = spotsOfPref(pref.code)
		return {
			title: `${chain(pref, region)}｜${SITE}`,
			description: `${pref.zh}的 ${list.length} 處景點：${list.slice(0, 4).map(s => s.name).join('、')}等。在立體和紙地圖上找到位置，看交通與建議停留時間。`,
			image: `og/pref/${pref.slug}.jpg`,
		}
	}
	return {
		title: `${region.name}｜${SITE}`,
		description: `${region.intro}共 ${spotsOfRegion(region.id).length} 處景點。`,
		image: `og/region/${region.id}.jpg`,
	}
}
