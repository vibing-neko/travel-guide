import { regions, prefs } from './regions.js'

export const CATS = { 社: '神社', 寺: '寺院', 城: '城郭', 街: '街區', 景: '景觀', 湯: '溫泉', 食: '美食', 館: '設施' }

export const FILTERS = [
	{ id: 'all', label: '全部', cats: null },
	{ id: 'shrine', label: '寺社', cats: ['社', '寺'] },
	{ id: 'castle', label: '城郭', cats: ['城'] },
	{ id: 'town', label: '街區', cats: ['街'] },
	{ id: 'view', label: '景觀', cats: ['景'] },
	{ id: 'onsen', label: '溫泉', cats: ['湯'] },
	{ id: 'food', label: '美食', cats: ['食'] },
	{ id: 'facility', label: '設施', cats: ['館'] },
]
export const matchFilter = (s, id) => id === 'all' || FILTERS.find(f => f.id === id).cats.includes(s.cat)

const lists = import.meta.glob('./spots/*.js', { eager: true, import: 'default' })
export const spots = regions.flatMap(r => lists[`./spots/${r.id}.js`] ?? [])

const group = k => {
	const m = {}
	for (const s of spots) (m[s[k]] ??= []).push(s)
	return m
}
const byRegion = group('region')
const byPref = group('pref')

export const spotById = Object.fromEntries(spots.map(s => [s.id, s]))
export const spotsOfRegion = id => byRegion[id] ?? []
export const spotsOfPref = code => byPref[code] ?? []
export const mapUrlOf = s => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.ja},${prefs[s.pref].ja}`)}`

const detailFiles = import.meta.glob('./details/*.js', { import: 'default' })
const details = {}
export async function loadDetails(region) {
	details[region] ??= await detailFiles[`./details/${region}.js`]()
}
export const detailOf = s => details[s.region][s.id]
