#!/ بن/حسرت گره
const { آد      ,        سروه }        =        نیاز('../')

const نمونه_جریان       =       'http://distribution.bbb3d.renderfarming.net/video/mp4/bbb_sunflower_1080p_30fps_normal.mp4'

const کانال ها       =       [
	{
		id    :      امپپفخبر،
		نام     :       خبر      نمونه,
		پوستر   :     'https://www.stremio.com/website/stremio-logo-small.png'
	},
	{
		id     :       امپپپتف   :     ورزش،ورزش,
		نام     :       ورزش     نمونه,
		پوستر: 'https://www.stremio.com/website/stremio-logo-small.png'
	}
]

const برنامه      =      {
	امپپف:  خبر  :    خبر    :      [
		{ عنوان   :      خلاصه    خلاصهخلاصه، ساعت   :     6   ,      ساعت    ها :   ها  :    3 },
		{ عنوان   :       خبر    روز  ,     ساعت   :     12   ,       ساعت    ها  : :    1 },
		{ عنوان   :      خبر   شب  ,     ساعت   :     18   ,      ها :   ها  :    1 },
		{ title: 'Night Desk', hour: 22, durationHours: 2 }
	],
	'exampletv:sports': [
		{ title: 'Morning Warm-up', hour: 7, durationHours: 2 },
		{ title: 'Live Match', hour: 15, durationHours: 3 },
		{ title: 'Highlights', hour: 21, durationHours: 1 }
	]
}

function iso(date, hour, minute) {
	return new Date(Date.UTC(
		date.getUTCFullYear(),
		date.getUTCMonth(),
		date.getUTCDate(),
		hour,
		minute || 0,
		0
	)).toISOString()
}

function parseGuideDate(value) {
	if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
		return new Date(value + 'T00:00:00.000Z')
	}
	const now = new Date()
	return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

function programmesFor(channelId, date) {
	const templates = PROGRAMMES[channelId] || []
	const dayStart = iso(date, 0, 0)
	const dayEnd = iso(date, 23, 59)
	return templates.map(function(programme) {
		const startTime = iso(date, programme.hour, 0)
		const endTime = iso(date, programme.hour + programme.durationHours, 0)
		return {
			id: channelId + ':epg:' + startTime,
			title: programme.title,
			overview: programme.title + ' on ' + date.toISOString().slice(0, 10),
			released: startTime,
			startTime: startTime,
			endTime: endTime,
			runtime: (programme.durationHours * 60) + ' min',
			releaseInfo: String(date.getUTCFullYear())
		}
	}).filter(function(video) {
		return video.endTime > dayStart && video.startTime < dayEnd
	})
}

function channelPreview(channel) {
	return {
		id: channel.id,
		type: 'tv',
		name: channel.name,
		poster: channel.poster,
		posterShape: 'square',
		behaviorHints: { isLive: true }
	}
}

function channelMeta(channel, date) {
	return {
		id: channel.id,
		type: 'tv',
		name: channel.name,
		poster: channel.poster,
		posterShape: 'square',
		behaviorHints: {
			isLive: true,
			hasScheduledVideos: true
		},
		videos: programmesFor(channel.id, date)
	}
}

const builder = new addonBuilder({
	id: 'org.stremio.example.epg',
	version: '1.0.0',
	name: 'Example Native EPG',
	description: 'Minimal live TV addon with a programme guide',
	logo: 'https://www.stremio.com/website/stremio-logo-small.png',
	resources: ['catalog', 'meta', 'stream'],
	types: ['tv'],
	idPrefixes: ['exampletv:'],
	catalogs: [
		{
			type: 'tv',
			id: 'channels',
			name: 'Channels',
			extra: [
				{ name: 'skip' },
				{ name: 'date' }
			]
		}
	],
	behaviorHints: {
		epgProvider: true
	}
})

builder.defineCatalogHandler(function(args) {
	if (args.type !== 'tv' || args.id !== 'channels') {
		return Promise.resolve({ metas: [] })
	}

	const skip = Number(args.extra && args.extra.skip) || 0
	const page = CHANNELS.slice(skip, skip + 100)

	if (args.extra && args.extra.date) {
		const date = parseGuideDate(args.extra.date)
		return Promise.resolve({
			metasDetailed: page.map(function(channel) {
				return channelMeta(channel, date)
			}),
			cacheMaxAge: 300
		})
	}

	return Promise.resolve({
		metas: page.map(channelPreview),
		cacheMaxAge: 300
	})
})

builder.defineMetaHandler(function(args) {
	const channel = CHANNELS.find(function(item) {
		return item.id === args.id
	})
	if (!channel) {
		return Promise.resolve({ meta: {} })
	}
	return Promise.resolve({
		meta: channelMeta(channel, parseGuideDate()),
		cacheMaxAge: 300
	})
})

builder.defineStreamHandler(function(args) {
	const channel = CHANNELS.find(function(item) {
		return item.id === args.id
	})
	if (!channel) {
		return Promise.resolve({ streams: [] })
	}
	return Promise.resolve({
		streams: [
			{
				name: channel.name,
				description: 'Live',
				url: SAMPLE_STREAM
			}
		]
	})
})

serveHTTP(builder.getInterface(), { port: process.env.PORT || 43002 })
