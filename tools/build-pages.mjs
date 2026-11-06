import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'dist')
const SITE = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).homepage.replace(/\/$/, '')

const vite = await createServer({ root: ROOT, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const { pageMeta } = await vite.ssrLoadModule('/src/pageMeta.js')
const { regions, prefs } = await vite.ssrLoadModule('/src/data/regions.js')
const { spots } = await vite.ssrLoadModule('/src/data/spots.js')
await vite.close()

const routes = [
	{ url: '', name: 'map', params: {} },
	{ url: 'wishlist', name: 'wishlist', params: {} },
	...regions.flatMap(r => [
		{ url: r.id, name: 'map', params: { region: r.id } },
		...r.prefs.map(c => ({ url: `${r.id}/${prefs[c].slug}`, name: 'map', params: { region: r.id, pref: prefs[c].slug } })),
	]),
	...spots.map(s => ({ url: `spot/${s.id}`, name: 'spot', params: { id: s.id } })),
]

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8')

function render(meta, url) {
	const t = esc(meta.title), d = esc(meta.description), image = `${SITE}/${meta.image}`
	const tags = [
		`<meta name="description" content="${d}" />`,
		...(meta.noindex ? ['<meta name="robots" content="noindex" />'] : url !== null ? [`<link rel="canonical" href="${SITE}/${url}${url && '/'}" />`] : []),
		'<meta name="theme-color" content="#f3eee3" />',
		`<meta property="og:type" content="${meta.article ? 'article' : 'website'}" />`,
		'<meta property="og:site_name" content="旅帖 TABICHŌ" />',
		'<meta property="og:locale" content="zh_TW" />',
		...(url !== null ? [`<meta property="og:url" content="${SITE}/${url}${url && '/'}" />`] : []),
		`<meta property="og:title" content="${t}" />`,
		`<meta property="og:description" content="${d}" />`,
		`<meta property="og:image" content="${image}" />`,
		'<meta property="og:image:width" content="1200" />',
		'<meta property="og:image:height" content="630" />',
		`<meta property="og:image:alt" content="${t}" />`,
		'<meta name="twitter:card" content="summary_large_image" />',
	].join('\n\t\t')
	return template
		.replace(/<title>.*?<\/title>/, `<title>${t}</title>`)
		.replace(/<meta name="description"[^>]*>/, tags)
		.replace('<div id="app"></div>', `<div id="app"></div>\n\t\t<noscript><h1>${t}</h1><p>${d}</p><p>這個網站需要開啟 JavaScript 才能瀏覽。</p></noscript>`)
}

for (const r of routes) {
	const dir = path.join(DIST, r.url)
	fs.mkdirSync(dir, { recursive: true })
	fs.writeFileSync(path.join(dir, 'index.html'), render(pageMeta(r), r.url))
}
fs.writeFileSync(path.join(DIST, '404.html'), render({ ...pageMeta({ name: 'map', params: {} }), noindex: true }, null))

const urls = routes.filter(r => !pageMeta(r).noindex).map(r => `\t<url><loc>${SITE}/${r.url}${r.url && '/'}</loc></url>`)
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`)

const missing = routes.map(r => pageMeta(r).image).filter((f, i, a) => a.indexOf(f) === i && !fs.existsSync(path.join(DIST, f)))
console.log(`靜態頁 ${routes.length} 個、sitemap ${urls.length} 筆`)
if (missing.length) console.warn(`⚠ 缺少 ${missing.length} 張分享圖（例如 ${missing[0]}），請執行 npm run og`)
if (SITE.includes('USERNAME')) console.warn('⚠ package.json 的 homepage 還沒填 GitHub 帳號，分享預覽圖在部署前不會生效')
