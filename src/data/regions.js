const PREF_TABLE = `北海道|北海道|Hokkaidō
青森縣|青森県|Aomori
岩手縣|岩手県|Iwate
宮城縣|宮城県|Miyagi
秋田縣|秋田県|Akita
山形縣|山形県|Yamagata
福島縣|福島県|Fukushima
茨城縣|茨城県|Ibaraki
栃木縣|栃木県|Tochigi
群馬縣|群馬県|Gunma
埼玉縣|埼玉県|Saitama
千葉縣|千葉県|Chiba
東京都|東京都|Tōkyō
神奈川縣|神奈川県|Kanagawa
新潟縣|新潟県|Niigata
富山縣|富山県|Toyama
石川縣|石川県|Ishikawa
福井縣|福井県|Fukui
山梨縣|山梨県|Yamanashi
長野縣|長野県|Nagano
岐阜縣|岐阜県|Gifu
靜岡縣|静岡県|Shizuoka
愛知縣|愛知県|Aichi
三重縣|三重県|Mie
滋賀縣|滋賀県|Shiga
京都府|京都府|Kyōto
大阪府|大阪府|Ōsaka
兵庫縣|兵庫県|Hyōgo
奈良縣|奈良県|Nara
和歌山縣|和歌山県|Wakayama
鳥取縣|鳥取県|Tottori
島根縣|島根県|Shimane
岡山縣|岡山県|Okayama
廣島縣|広島県|Hiroshima
山口縣|山口県|Yamaguchi
德島縣|徳島県|Tokushima
香川縣|香川県|Kagawa
愛媛縣|愛媛県|Ehime
高知縣|高知県|Kōchi
福岡縣|福岡県|Fukuoka
佐賀縣|佐賀県|Saga
長崎縣|長崎県|Nagasaki
熊本縣|熊本県|Kumamoto
大分縣|大分県|Ōita
宮崎縣|宮崎県|Miyazaki
鹿兒島縣|鹿児島県|Kagoshima
沖繩縣|沖縄県|Okinawa`

export const prefs = {}
PREF_TABLE.split('\n').forEach((line, i) => {
	const [zh, ja, romaji] = line.split('|')
	const slug = romaji.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
	prefs[i + 1] = { code: i + 1, zh, ja, romaji, slug, region: null }
})

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i)

export const regions = [
	{
		id: 'hokkaido', name: '北海道', ja: '北海道', romaji: 'Hokkaidō',
		color: '#78C2C4', colorName: '白群', prefs: [1],
		intro: '日本最北的大地，夏天是薰衣草與花田，冬天是粉雪與流冰。城市之間距離遙遠，最適合自駕慢慢走。',
	},
	{
		id: 'tohoku', name: '東北', ja: '東北', romaji: 'Tōhoku',
		color: '#91AD70', colorName: '柳染', prefs: range(2, 7),
		intro: '溫泉、祭典與深山古道交織的土地。夏天的睡魔祭、竿燈祭熱鬧非凡，秋天的紅葉也是全日本最早報到的地方之一。',
	},
	{
		id: 'kanto', name: '關東', ja: '関東', romaji: 'Kantō',
		color: '#3A8FB7', colorName: '千草', prefs: range(8, 14),
		intro: '以東京為中心的首都圈，最新潮的街區與江戶老街並存。往外一兩個小時，就能抵達鎌倉、日光、箱根這些經典的小旅行目的地。',
	},
	{
		id: 'chubu', name: '中部', ja: '中部', romaji: 'Chūbu',
		color: '#EFBB24', colorName: '鬱金', prefs: range(15, 23),
		intro: '橫跨日本海到太平洋，富士山、日本阿爾卑斯山脈與合掌村都在這裡。金澤與高山保留了濃厚的城下町風情。',
	},
	{
		id: 'kansai', name: '關西', ja: '関西', romaji: 'Kansai',
		color: '#E16B8C', colorName: '紅梅', prefs: range(24, 30),
		intro: '千年古都京都、天下廚房大阪、鹿群漫步的奈良，是日本歷史與庶民美食的原點。主要城市之間搭電車約半小時到一小時。',
	},
	{
		id: 'chugoku', name: '中國地方', ja: '中国地方', romaji: 'Chūgoku',
		color: '#ED784A', colorName: '柿', prefs: range(31, 35),
		intro: '瀨戶內海的島嶼與山陰海岸各有風情，廣島的宮島鳥居、岡山的倉敷美觀地區都是代表景點。',
	},
	{
		id: 'shikoku', name: '四國', ja: '四国', romaji: 'Shikoku',
		color: '#8B81C3', colorName: '藤', prefs: range(36, 39),
		intro: '八十八所遍路串起的島嶼，讚岐烏龍麵、道後溫泉與四萬十川，節奏比本州慢上一拍。',
	},
	{
		id: 'kyushu', name: '九州', ja: '九州', romaji: 'Kyūshū',
		color: '#8E354A', colorName: '蘇芳', prefs: range(40, 46),
		intro: '火山與溫泉之國，別府、由布院湯煙裊裊；福岡的屋台與長崎的異國風情，讓美食與歷史一次滿足。',
	},
	{
		id: 'okinawa', name: '沖繩', ja: '沖縄', romaji: 'Okinawa',
		color: '#A5DEE4', colorName: '瓶覗', prefs: [47],
		intro: '亞熱帶的藍色海洋與琉球王國文化，和本州截然不同的節奏與飲食。從春天到秋天都是海島的季節。',
	},
]

export const regionById = Object.fromEntries(regions.map(r => [r.id, r]))
regions.forEach(r => r.prefs.forEach(code => { prefs[code].region = r.id }))

export const regionOf = code => regionById[prefs[code].region]
