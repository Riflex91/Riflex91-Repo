local addonName, MG = ...
MG.RestEDXPForeverRaw = MG.RestEDXPForeverRaw or { source = { repository = "RestedXP/RXPGuides", commit = "a688a75d595f5884dba8044a5ba4e7d7bd859c09", license = "CC BY-NC-SA 4.0", transformed = true, proseCopied = false }, chunks = {} }
MG.RestEDXPForeverRaw.chunks[#MG.RestEDXPForeverRaw.chunks + 1] = [=[
G	Guides/SurvivalGuide/A-Classic-Alliance-1-10_NightElf.lua
M	hardcore	
M	classic	
M	tbc	
M	selector	Alliance
M	name	1-6 Shadowglen
M	version	1
M	group	RestedXP Survival Guide (A)
M	subgroup	RXP Survival Guide 1-20
M	defaultfor	NightElf
M	next	6-11 Teldrassil
S	!NightElf
T	sticky	
T	completewith	next
S	
A	goto	Teldrassil,58.695,44.266
A	target	Conservator Ilthalaine
A	accept	456
S	
T	sticky	
T	label	balance1
A	goto	Teldrassil,62.0,42.6
A	complete	456,1
A	mob	+Young Nightsaber
A	complete	456,2
A	mob	+Young Thistle Boar
S	
A	xp	2
S	
A	accept	4495
A	target	+Dirania Silvershine
A	goto	Teldrassil,60.899,41.961
A	accept	458
A	goto	Teldrassil,59.924,42.474
A	target	+Melithar Staghelm
S	Hunter
T	era	
A	goto	Teldrassil,59.8,34.1
A	xp	4-610
S	Hunter
T	som--xpgate	
A	goto	Teldrassil,59.8,34.1
A	xp	4-755
S	Hunter
A	goto	Teldrassil,54.593,32.992
A	turnin	4495
A	target	Iverron
A	accept	3519
S	Hunter
T	completewith	next
A	hs	
S	Hunter
A	goto	Teldrassil,57.9,45.1
A	turnin	458
A	target	Tarindrella
A	accept	459
S	
T	requires	balance1
A	goto	Teldrassil,58.695,44.266
A	turnin	456,1
A	turnin	456
A	target	Conservator Ilthalaine
A	accept	457
A	accept	3116
A	accept	3117
A	accept	3119
A	accept	3120
S	Warrior
A	goto	Teldrassil,59.306,41.091
A	vendor	
A	target	Keina
S	Warrior
A	goto	Teldrassil,59.637,38.442
A	target	Alyissia
A	turnin	3116
A	trainer	
S	!Hunter
A	goto	Teldrassil,59.8,34.1
A	complete	457,1
A	mob	+Mangy Nightsaber
A	complete	457,2
A	mob	+Thistle Boar
S	!Hunter
A	goto	Teldrassil,54.593,32.992
A	turnin	4495
A	target	Iverron
A	accept	3519
S	!Hunter
T	completewith	next
A	hs	
S	!Hunter
A	goto	Teldrassil,57.9,45.1
A	turnin	458
A	target	Tarindrella
A	accept	459
S	!Hunter
A	goto	Teldrassil,58.6,44.3
A	target	Conservator Ilthalaine
A	turnin	457
S	
A	goto	Teldrassil,60.899,41.961
A	turnin	3519
A	target	Dirania Silvershine
A	accept	3521
S	Hunter
T	completewith	htraining
A	goto	Teldrassil,59.306,41.091
A	vendor	
A	target	Keina
S	
A	goto	Teldrassil,57.807,41.653
A	target	Gilshalan Windwalker
A	accept	916
S	Hunter
T	era	
A	xp	4-40
S	Hunter
T	som--xpgate	
A	xp	4-50
S	Hunter
A	goto	Teldrassil,57.80,40.97,25,0
A	goto	Teldrassil,58.659,40.449
A	turnin	3117
A	train	1978
A	target	Ayanna Everstride
S	
A	goto	Teldrassil,57.95,38.20,10,0
A	goto	Teldrassil,57.76,37.27,10,0
A	goto	Teldrassil,58.21,36.40,10,0
A	goto	Teldrassil,58.81,37.83,10,0
A	goto	Teldrassil,57.95,38.20
A	complete	3521,2
S	
A	goto	Teldrassil,56.8,31.7
A	complete	3521,3
A	complete	916,1
A	mob	Webwood Spider
S	
A	goto	Teldrassil,55.0,43.7
A	complete	3521,1
A	complete	459,1
A	mob	Grell
A	mob	Grellkin
S	
A	goto	Teldrassil,57.8,45.1
A	target	Tarindrella
A	turnin	459
S	
A	goto	Teldrassil,60.899,41.961
A	turnin	3521
A	target	Dirania Silvershine
A	accept	3522
S	!Priest
T	completewith	next
A	goto	Teldrassil,59.306,41.091
A	vendor	
A	vendor	
A	target	Keina
S	Warrior
A	goto	Teldrassil,59.637,38.442
A	trainer	
A	target	Alyissia
S	Priest
T	completewith	next
A	goto	Teldrassil,59.456,41.050
A	vendor	
A	target	Janna Brightmoon
S	Priest
A	goto	Teldrassil,59.174,40.442
A	target	Shanda
A	turnin	3119
A	trainer	
S	
A	goto	Teldrassil,57.807,41.653
A	turnin	916
A	target	Gilshalan Windwalker
A	accept	917
S	Druid
A	goto	Teldrassil,57.80,40.97,25,0
A	goto	Teldrassil,58.626,40.287
A	target	Mardant Strongoak
A	turnin	3120
A	train	8921
S	
A	goto	Teldrassil,54.593,32.992
A	target	Iverron
A	turnin	3522
S	
T	completewith	next
A	goto	Teldrassil,56.73,31.17,25
S	
A	goto	Teldrassil,57.0,26.4
A	complete	917,1
S	
T	softcore	
T	completewith	next
A	deathskip	
S	skip --logout skip
T	hardcore	
T	completewith	next
A	link	https://www.youtube.com/watch?v=TTZZT3jpv1s
S	
A	goto	Teldrassil,57.807,41.653
A	turnin	917
A	target	Gilshalan Windwalker
A	accept	920
S	
A	goto	Teldrassil,57.80,40.97,25,0
A	goto	Teldrassil,59.062,39.448
A	turnin	920
A	target	Tenaron Stormgrip
A	accept	921
S	
T	sticky	
T	label	vial1
A	goto	Teldrassil,59.9,33.0
A	use	5185
A	complete	921,1
S	Hunter
A	goto	Teldrassil,59.8,34.1
A	complete	457,1
A	mob	+Mangy Nightsaber
A	complete	457,2
A	mob	+Thistle Boar
S	
T	requires	vial1
T	completewith	next
A	deathskip	
S	Hunter
T	requires	vial1
A	goto	Teldrassil,58.6,44.3
A	target	Conservator Ilthalaine
A	turnin	457,2
S	Priest
T	requires	vial1
A	goto	Teldrassil,59.2,40.5
A	target	Shanda
A	accept	5622
S	
T	requires	vial1
A	goto	Teldrassil,57.80,40.97,25,0
A	goto	Teldrassil,59.062,39.448
A	turnin	921
A	target	Tenaron Stormgrip
A	accept	928
S	
A	goto	Teldrassil,61.159,47.644
A	target	Porthannius
A	accept	2159
E
G	Guides/SurvivalGuide/A-Classic-Alliance-1-10_NightElf.lua
M	hardcore	
M	classic	
M	tbc	
M	selector	Alliance
M	name	6-11 Teldrassil
M	version	1
M	group	RestedXP Survival Guide (A)
M	subgroup	RXP Survival Guide 1-20
M	defaultfor	NightElf
M	next	11-13 Darkshore (Night Elf)
S	
A	goto	Teldrassil,60.5,56.3
A	target	Zenn Foulhoof
A	accept	488
S	
T	sticky	
T	completewith	zenn
A	complete	488,1
A	mob	+Nightsaber
A	complete	488,2
A	mob	+Strigid Owl
A	complete	488,3
A	mob	+Webwood Lurker
S	
T	sticky	
T	completewith	spiderLegs
A	collect	5465,7,4161,1
A	mob	Webwood Lurker
A	mob	Webwood Venomfang
S	
A	goto	Teldrassil,56.08,57.72
A	target	Syral Bladeleaf
A	accept	997
S	
A	goto	Teldrassil,55.954,57.272
A	target	Athridas Bearmantle
A	accept	475
S	Priest
A	goto	Teldrassil,55.564,56.746
A	turnin	5622
A	target	Laurna Morninglight
A	accept	5621
A	trainer	
S	Rogue
A	goto	Teldrassil,55.508,57.145
A	vendor	
A	target	Aldia
S	
T	era	
A	goto	Teldrassil,55.574,56.948
A	target	Tallonkai Swiftroot
A	accept	932
A	accept	2438
S	
T	som	
A	goto	Teldrassil,55.574,56.948
A	target	Tallonkai Swiftroot
A	accept	932
A	accept	2438
S	Hunter
A	goto	Teldrassil,55.890,59.205
A	collect	2506,1
A	target	Jeena Featherbow
S	Warrior
A	goto	Teldrassil,56.221,59.198
A	trainer	
A	target	Kyra Windblade
S	Rogue
A	goto	Teldrassil,56.381,60.139
A	trainer	
A	target	Jannok Breezesong
S	Warrior
A	goto	Teldrassil,56.308,59.488
A	collect	2488,1
A	target	Shalomon
S	Rogue
A	goto	Teldrassil,56.308,59.488
A	collect	2494,1
A	target	Shalomon
S	Druid
A	goto	Teldrassil,56.308,59.488
A	collect	2495,1
A	target	Shalomon
S	
A	goto	Teldrassil,55.619,59.788
A	target	Innkeeper Keldamyr
A	turnin	2159,2
A	turnin	2159
A	home	
S	Hunter
A	goto	Teldrassil,56.676,59.489
A	train	3044
A	target	Dazalar
S	Druid
A	goto	Teldrassil,55.945,61.566
A	trainer	
A	target	Kal
S	
A	goto	Teldrassil,56.142,61.714
A	turnin	928
A	target	Corithras Moonrage
A	accept	929
S	Druid
A	goto	Teldrassil,57.721,60.641
A	train	2366
A	target	Malorne Bladeleaf
S	Druid
T	completewith	end
A	collect	2449,5
S	Priest
A	goto	Teldrassil,57.242,63.511
A	complete	5621,1
A	target	Sentinel Shaya
S	
A	goto	Teldrassil,60.900,68.489
A	turnin	997
A	target	Denalan
A	accept	918
A	accept	919
S	
A	goto	Teldrassil,61.63,68.89,55,0
A	goto	Teldrassil,60.52,70.47,55,0
A	goto	Teldrassil,59.04,72.52,55,0
A	goto	Teldrassil,57.69,69.92,55,0
A	goto	Teldrassil,55.33,67.22,55,0
A	goto	Teldrassil,57.89,64.84,55,0
A	goto	Teldrassil,61.21,66.28
A	complete	918,1
A	complete	919,1
A	mob	Timberling
S	
A	goto	Teldrassil,60.900,68.489
A	turnin	918
A	target	Denalan
A	accept	922
A	turnin	919
S	
T	completewith	next
A	goto	Teldrassil,68.02,59.66,120
S	
A	goto	Teldrassil,68.02,59.66
A	complete	2438,1
S	
A	goto	Teldrassil,66.26,58.52
A	turnin	475
A	target	Gaerolas Talvethren
A	accept	476
S	
T	label	zenn
A	goto	Teldrassil,63.38,58.10
A	complete	929,1
S	
A	complete	488,1
A	mob	+Nightsaber
A	goto	Teldrassil,66.10,52.43,60,0
A	goto	Teldrassil,61.95,61.07,50,0
A	goto	Teldrassil,59.14,60.91
A	complete	488,2
A	mob	+Strigid Owl
A	goto	Teldrassil,66.10,52.43,60,0
A	goto	Teldrassil,63.39,64.22,50,0
A	goto	Teldrassil,59.14,60.91
A	complete	488,3
A	goto	Teldrassil,61.06,54.66,50,0
A	goto	Teldrassil,60.17,59.62,50,0
A	goto	Teldrassil,58.22,56.32
A	mob	+Webwood Lurker
S	
T	era	
A	goto	Teldrassil,60.7,54.4
A	xp	7+3500
S	
T	som--xpgate	
A	goto	Teldrassil,60.7,54.4
A	xp	7+2900
S	
A	goto	Teldrassil,60.5,56.3
A	target	Zenn Foulhoof
A	turnin	488
S	
A	goto	Teldrassil,56.078,57.723
A	accept	489
A	target	Syral Bladeleaf
S	
A	goto	Teldrassil,55.954,57.272
A	target	Athridas Bearmantle
A	turnin	476
S	Priest
A	goto	Teldrassil,55.564,56.746
A	target	Laurna Morninglight
A	turnin	5621
A	trainer	
S	
A	goto	Teldrassil,55.574,56.948
A	turnin	2438
A	target	Tallonkai Swiftroot
A	accept	2459
S	Hunter
A	goto	Teldrassil,55.890,59.205
A	collect	2506,1
A	target	Jeena Featherbow
S	Hunter
A	goto	Teldrassil,55.890,59.205
A	vendor	
A	target	Jeena Featherbow
S	Hunter
A	goto	Teldrassil,56.676,59.489
A	trainer	
A	target	Dazalar
S	Warrior
A	goto	Teldrassil,56.221,59.198
A	trainer	
A	target	Kyra Windblade
S	Rogue
A	goto	Teldrassil,56.381,60.139
A	trainer	
A	target	Jannok Breezesong
S	Warrior
A	goto	Teldrassil,56.308,59.488
A	collect	2488,1
A	target	Shalomon
S	Rogue
A	goto	Teldrassil,56.308,59.488
A	collect	2494,1
A	target	Shalomon
S	Druid
A	goto	Teldrassil,56.308,59.488
A	collect	2495,1
A	target	Shalomon
S	Druid
A	goto	Teldrassil,56.142,61.714
A	turnin	929
A	target	Corithras Moonrage
A	accept	933
S	Druid
A	goto	Teldrassil,55.945,61.566
A	trainer	
A	target	Kal
S	
T	completewith	jewel
A	complete	489,1
S	
T	completewith	next
A	complete	2459,1
A	mob	Gnarlpine Mystic
S	
A	goto	Teldrassil,69.37,53.41
A	use	8049
A	complete	2459,2
A	mob	Ferocitas the Dream Eater
S	
T	label	jewel
A	goto	Teldrassil,68.38,52.06,30,0
A	goto	Teldrassil,69.37,53.41
A	complete	2459,1
A	mob	Gnarlpine Mystic
S	
A	goto	Teldrassil,59.0,56.1,50,0
A	goto	Teldrassil,56.5,65.5,50,0
A	goto	Teldrassil,53.0,59.5,50,0
A	goto	Teldrassil,63.6,62.3,50,0
A	goto	Teldrassil,58.7,55.7
A	complete	489,1
S	
A	goto	Teldrassil,60.4,56.4
A	target	Zenn Foulhoof
A	turnin	489
S	
T	completewith	next
A	goto	Teldrassil,54.68,52.84,20,0
A	goto	Teldrassil,54.42,51.19,15
S	Hunter
T	era	
A	goto	Teldrassil,51.2,50.6
A	complete	932,1
A	unitscan	Lord Melenas
S	!Hunter
A	goto	Teldrassil,51.2,50.6
A	complete	932,1
A	unitscan	Lord Melenas
S	
T	softcore	
T	completewith	next
A	deathskip	
S	!Druid
A	goto	Teldrassil,56.142,61.714
A	target	Corithras Moonrage
A	turnin	929
S	
T	era/som	
A	goto	Teldrassil,56.142,61.714
A	target	Corithras Moonrage
A	accept	933
S	
T	completewith	next
A	goto	Teldrassil,42.61,76.18,50
S	
T	era/som	
A	goto	Teldrassil,42.61,76.18
A	accept	930
S	
T	completewith	next
A	goto	Teldrassil,42.41,67.07,50
S	
T	era/som	
T	label	spiderLegs
A	goto	Teldrassil,42.41,67.07
A	use	5621
A	complete	933,1
S	
T	era/som	
A	goto	Teldrassil,44.69,70.52,40,0
A	goto	Teldrassil,44.88,73.83
A	collect	5465,7,4161,1
A	mob	Webwood Lurker
A	mob	Webwood Venomfang
S	
T	completewith	next
A	goto	Teldrassil,56.142,61.714,90
S	
T	era/som	
A	goto	Teldrassil,56.142,61.714
A	turnin	933
A	target	Corithras Moonrage
A	accept	7383
S	
T	era/som	
A	goto	Teldrassil,57.121,61.296
A	train	2550
A	accept	4161
A	turnin	4161
A	target	Zarrin
S	
A	goto	Teldrassil,55.29,56.82
A	train	3273
A	target	Byancie
S	
T	som	
A	goto	Teldrassil,55.574,56.948
A	target	Tallonkai Swiftroot
A	turnin	932
A	turnin	2459
S	
T	era	
A	goto	Teldrassil,55.574,56.948
A	target	Tallonkai Swiftroot
A	turnin	932
A	turnin	2459
S	
A	goto	Teldrassil,55.83,58.31,40,0
A	goto	Teldrassil,50.22,53.83
A	goto	Teldrassil,55.83,58.31,0
A	accept	487
A	target	Moon Priestess Amara
S	
A	goto	Teldrassil,46.6,53.0
A	complete	487,1
A	mob	Gnarlpine Ambusher
S	Druid
A	goto	Teldrassil,55.83,58.31,40,0
A	goto	Teldrassil,50.22,53.83
A	goto	Teldrassil,55.83,58.31,0
A	turnin	487
A	target	Moon Priestess Amara
S	
T	completewith	next
A	goto	Teldrassil,38.32,34.36,50
S	
T	era/som	
A	goto	Teldrassil,38.32,34.36
A	target	Sentinel Arynia Cloudsbreak
A	accept	937
S	
T	era/som	
A	goto	Teldrassil,38.43,34.03
A	use	18152
A	complete	7383,1
S	
T	era/som	
T	completewith	xp10
T	label	harpies
A	complete	937,1
A	mob	Bloodfeather Harpy
A	mob	Bloodfeather Rogue
A	mob	Bloodfeather Sorceress
A	mob	Bloodfeather Fury
A	mob	Bloodfeather Wind Witch
A	mob	Bloodfeather Matriarch
S	
T	era/som	
A	goto	Teldrassil,34.61,28.79
A	accept	931
S	Hunter
T	era/som	
T	completewith	xp10
T	label	mist1
A	goto	Teldrassil,31.54,31.62
A	accept	938
A	target	Mist
S	Hunter
T	era	
T	sticky	
T	label	xp10
A	xp	10-2670
S	Hunter skip
T	era/som--xpgate	
T	sticky	
T	label	xp10
A	xp	10-3330
S	Hunter
T	era/som	
T	completewith	xp10
T	requires	mist1
A	goto	Teldrassil,38.32,34.36
A	target	Sentinel Arynia Cloudsbreak
A	turnin	938
S	Hunter
T	era/som	
T	completewith	xp10
T	requires	harpies
A	goto	Teldrassil,38.32,34.36
A	turnin	937
A	target	Sentinel Arynia Cloudsbreak
A	accept	940
S	!Hunter
T	era/som	
T	label	mist1
A	goto	Teldrassil,31.54,31.62
A	accept	938
A	target	Mist
S	!Hunter
T	era/som	
A	goto	Teldrassil,38.32,34.36
A	turnin	937
A	target	Sentinel Arynia Cloudsbreak
A	accept	940
A	turnin	938
S	!Hunter
T	era	
T	label	xp10
A	xp	10-750 << Druid
A	xp	10-3110 << !Druid
S	!Hunter
T	som--xpgate	
T	phase	1-2
T	label	xp10
A	xp	10-930 << Druid
A	xp	10-3880 << !Druid
S	
T	som--xpgate	
T	phase	3-6
A	goto	Teldrassil,38.6,58.0
A	collect	5465,7,4161,1
S	Druid
T	som--xpgate	
T	phase	3-6
T	label	xp10
A	xp	10-640
A	goto	Teldrassil,38.3,34.4
S	!Druid
T	som--xpgate	
T	phase	3-6
T	label	xp10
A	xp	10-3300
S	!Rogue
T	requires	xp10
T	completewith	next
A	goto	Darnassus,82.01,36.70,100
S	!Rogue
T	requires	xp10
A	goto	Darnassus,38.18,21.64
A	turnin	922
A	target	Rellian Greenspyre
A	accept	923
S	!Hunter !Rogue
T	era/som	
A	goto	Darnassus,34.96,9.01
A	turnin	940
A	isOnQuest	940
A	target	Arch Druid Fandral Staghelm
S	Druid
A	goto	Darnassus,35.38,8.40
A	accept	5921
A	trainer	
A	target	Mathrengyl Bearwalker
S	!Rogue
A	goto	Darnassus,39.72,92.68,10,0
A	goto	Darnassus,36.65,85.93
A	target	Priestess A'moora
A	accept	2518
S	Druid
T	completewith	next
A	cast	18960
A	zoneskip	Moonglade
S	Druid
A	goto	Moonglade,56.21,30.64
A	turnin	5921
A	target	Dendrite Starblaze
A	accept	5929
S	Druid
A	goto	Moonglade,45.12,26.78,15,0
A	goto	Moonglade,39.17,27.42
A	complete	5929,1
A	skipgossip	
A	target	Great Bear Spirit
S	Druid
T	completewith	next
A	cast	18960
S	Druid
A	goto	Moonglade,56.21,30.64
A	turnin	5929
A	target	Dendrite Starblaze
A	accept	5931
S	
T	requires	xp10 << Rogue
T	completewith	next << !Rogue
A	hs	
S	Hunter
A	goto	Teldrassil,55.890,59.205
A	vendor	
A	target	Jeena Featherbow
S	
T	som	
T	phase	3-6
A	goto	Teldrassil,57.121,61.296
A	train	2550
A	target	Zarrin
A	accept	4161
A	turnin	4161
S	
T	som	
T	phase	3-6
A	goto	Teldrassil,51.9,56.4
A	target	Moon Priestess Amara
A	turnin	487
A	maxlevel	9
S	Hunter
T	completewith	L10
T	level	10
T	label	beast1
A	goto	Teldrassil,56.676,59.489
A	target	Dazalar
A	accept	6063
A	train	13165
S	Hunter
T	completewith	L10
T	level	10
T	requires	beast1
T	label	beast2
A	goto	Teldrassil,59.9,58.8
A	use	15921
A	complete	6063,1
A	mob	Webwood Lurker
S	Hunter
T	completewith	L10
T	level	10
T	requires	beast2
A	goto	Teldrassil,56.676,59.489
A	turnin	6063
A	target	Dazalar
A	accept	6101
S	
T	era/som	
A	goto	Teldrassil,56.142,61.714
A	turnin	7383
A	target	Corithras Moonrage
A	accept	935
S	
T	era/som	
A	goto	Teldrassil,60.900,68.489
A	target	Denalan
A	turnin	931
A	turnin	930
S	
T	era/som	
A	goto	Teldrassil,60.900,68.489
A	target	Denalan
A	turnin	927
A	isOnQuest	927
S	
T	era/som	
A	goto	Teldrassil,60.78,68.59
A	turnin	941
A	isQuestTurnedIn	927
S	Hunter
T	era/som	
A	goto	Teldrassil,62.6,72.2
A	use	15922
A	complete	6101,1
A	isOnQuest	6101
A	mob	Nightsaber Stalker
S	
T	label	L10
A	xp	10
S	Priest
A	goto	Teldrassil,55.564,56.746
A	trainer	
A	target	Laurna Morninglight
S	Warrior
A	goto	Teldrassil,56.221,59.198
A	trainer	
A	target	Kyra Windblade
S	Rogue
A	goto	Teldrassil,56.381,60.139
A	trainer	
A	target	Jannok Breezesong
S	Hunter
A	goto	Teldrassil,56.676,59.489
A	target	Dazalar
A	accept	6063
A	trainer	
S	Hunter
A	goto	Teldrassil,59.9,58.8
A	use	15921
A	complete	6063,1
A	mob	Webwood Lurker
S	Hunter
A	goto	Teldrassil,56.676,59.489
A	turnin	6063
A	target	Dazalar
A	accept	6101
S	Hunter
A	goto	Teldrassil,62.6,72.2
A	use	15922
A	complete	6101,1
A	mob	Nightsaber Stalker
S	Hunter
A	goto	Teldrassil,56.676,59.489
A	turnin	6101
A	target	Dazalar
A	accept	6102
S	Hunter
A	goto	Teldrassil,64.7,66.7
A	use	15923
A	complete	6102,1
A	mob	Strigid Screecher
S	Hunter
A	goto	Teldrassil,56.676,59.489
A	turnin	6102
A	target	Dazalar
A	accept	6103
S	Warrior
A	goto	Teldrassil,55.83,58.31,40,0
A	goto	Teldrassil,50.22,53.83
A	goto	Teldrassil,55.83,58.31,0
A	accept	1684
A	target	Moon Priestess Amara
S	Rogue
A	goto	Teldrassil,56.381,60.139
A	target	Jannok Breezesong
A	accept	2241
S	Hunter
A	goto	Teldrassil,56.308,59.488
A	money	<0.0504
A	collect	2495,1
A	target	Shalomon
S	!Druid
A	goto	Teldrassil,55.83,58.31,40,0
A	goto	Teldrassil,50.22,53.83
A	goto	Teldrassil,55.83,58.31,0
A	turnin	487
A	target	Moon Priestess Amara
S	Rogue
T	completewith	next
A	goto	Darnassus,82.01,36.70,100
S	Rogue
A	goto	Darnassus,38.18,21.64
A	turnin	922
A	target	Rellian Greenspyre
A	accept	923
S	Rogue
A	goto	Darnassus,34.96,9.01
A	turnin	935
A	turnin	940
A	target	Arch Druid Fandral Staghelm
A	accept	952
S	Rogue
A	goto	Darnassus,31.21,17.72,8,0
A	goto	Darnassus,36.99,21.91
A	turnin	2241
A	target	Syurna
A	accept	2242
S	Rogue
A	goto	Darnassus,39.72,92.68,10,0
A	goto	Darnassus,36.65,85.93
A	target	Priestess A'moora
A	accept	2518
S	Hunter
T	sticky	
A	goto	Teldrassil,41.2,44.4,0
A	goto	Teldrassil,44.2,39.8,0
A	goto	Teldrassil,45.6,31.4,0
A	goto	Teldrassil,37.6,28.8,0
A	train	2981
A	link	https://www.wow-petopia.com/classic/training.php
A	unitscan	Strigid Hunter
S	
A	goto	Teldrassil,43.2,42.8,55,0
A	goto	Teldrassil,43.2,32.8,55,0
A	goto	Teldrassil,43.6,26.0,55,0
A	goto	Teldrassil,43.2,42.8
A	complete	923,1
A	mob	Elder Timberling
A	mob	Timberling Trampler
A	mob	Timberling Mire Beast
S	
T	label	Spinnerets
A	goto	Teldrassil,47.3,26.0,0
A	goto	Teldrassil,37.9,25.1,0
A	goto	Teldrassil,47.3,26.0,30,0
A	goto	Teldrassil,37.9,25.1,30,0
A	goto	Teldrassil,40.7,25.4
A	complete	2518,1
A	mob	Lady Sathrah
S	Rogue
A	goto	Teldrassil,38.0,25.2
A	complete	2242,1
A	mob	Sethir the Ancient
S	
T	som	<< !Hunter
T	phase	3-6 << !Hunter
A	goto	Teldrassil,38.3,34.3
A	target	Sentinel Arynia Cloudsbreak
A	accept	937
S	
T	som	<< !Hunter
T	phase	3-6 << !Hunter
T	sticky	
T	label	harpies2
A	goto	Teldrassil,33.619,29.819
A	complete	937,1
A	mob	Bloodfeather Harpy
A	mob	Bloodfeather Rogue
A	mob	Bloodfeather Sorceress
A	mob	Bloodfeather Fury
A	mob	Bloodfeather Wind Witch
A	mob	Bloodfeather Matriarch
S	
T	som	<< !Hunter
T	phase	3-6 << !Hunter
A	goto	Teldrassil,31.54,31.62
A	target	Mist
A	accept	938
S	
T	som	<< !Hunter
T	phase	3-6 << !Hunter
A	goto	Teldrassil,38.3,34.4
A	target	Sentinel Arynia Cloudsbreak
A	turnin	938
S	
T	som	<< !Hunter
T	phase	3-6 << !Hunter
T	requires	harpies2
A	goto	Teldrassil,38.3,34.4
A	turnin	937
A	target	Sentinel Arynia Cloudsbreak
A	accept	940
S	
T	completewith	NessaShadowsong
A	goto	Darnassus,82.01,36.70,100
S	
T	ah	
A	goto	Darnassus,56.245,54.039,-1
A	goto	Darnassus,56.374,51.820,-1
A	collect	5469,5,2178,1
A	collect	12238,6,1141,1
A	target	Auctioneer Tolon
A	target	Auctioneer Golothas
S	
T	label	NessaShadowsong
A	goto	Darnassus,70.679,45.379
A	target	Mydrannul
A	accept	6344
S	
A	abandon	927
S	Warrior
A	goto	Darnassus,57.305,34.606
A	turnin	1684
A	target	Elanaria
A	accept	1683
S	Warrior
T	sticky	
T	completewith	next
A	goto	Teldrassil,48.7,62.2,18
S	Warrior
A	goto	Teldrassil,47.2,63.7
A	complete	1683,1
A	mob	Vorlus Vilehoof
S	Warrior
T	completewith	next
A	goto	Darnassus,82.01,36.70,100
S	Warrior
A	goto	Darnassus,57.305,34.606
A	target	Elanaria
A	turnin	1683
S	Druid
A	goto	Darnassus,35.38,8.40
A	turnin	5931
A	target	Mathrengyl Bearwalker
A	accept	6001
S	
A	goto	Darnassus,34.814,9.255
A	turnin	935
A	turnin	940
A	target	Arch Druid Fandral Staghelm
A	accept	952
S	Hunter
A	goto	Darnassus,40.377,8.545
A	target	Jocaste
A	turnin	6103
S	Rogue
A	goto	Darnassus,31.21,17.72,8,0
A	goto	Darnassus,36.99,21.91
A	target	Syurna
A	turnin	2242
S	
A	goto	Darnassus,38.184,21.639
A	target	Rellian Greenspyre
A	turnin	923
S	Rogue
T	completewith	next
A	goto	Darnassus,62.68,65.58,30
S	Rogue
A	goto	Darnassus,62.68,65.58
A	collect	2946,1
A	target	Turian
S	
A	goto	Darnassus,39.72,92.68,10,0
A	goto	Darnassus,36.65,85.93
A	turnin	2518
A	target	Priestess A'moora
A	accept	2520
S	
A	goto	Darnassus,39.7,85.8
A	use	8155
A	complete	2520,1
S	
T	label	end
A	goto	Darnassus,39.72,92.68,10,0
A	goto	Darnassus,36.65,85.93
A	target	Priestess A'moora
A	turnin	2520
S	Druid
A	goto	Darnassus,47.95,68.03
A	train	2366
A	target	Firodren Mooncaller
S	Hunter/Warrior/Priest
A	goto	Darnassus,57.56,46.73
A	skipgossip	11866,1
A	train	227
A	target	Ilyenia Moonfire
S	Hunter
T	completewith	FlyDS
A	use	2495
A	itemcount	2495,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.19
S	Hunter
A	goto	Darnassus,58.76,44.48
A	money	<0.1751
A	collect	2507,1
A	target	Ariyell Skyshadow
S	Warrior
A	goto	Darnassus,58.76,44.48
A	money	<0.3022
A	collect	854,1
A	target	Ariyell Skyshadow
S	Warrior
A	goto	Darnassus,58.76,44.48
A	money	<0.2023
A	collect	851,1
A	target	Ariyell Skyshadow
S	
T	completewith	next
A	goto	Darnassus,30.00,41.43,10
S	
A	goto	Teldrassil,56.25,92.44
A	turnin	6344
A	target	Nessa Shadowsong
A	accept	6341
S	
A	goto	Teldrassil,58.399,94.016
A	turnin	6341
A	target	Vesprystus
A	accept	6342
S	
T	label	FlyDS
A	goto	Teldrassil,58.399,94.016
A	fly	Darkshore
A	target	Vesprystus
E
G	Guides/SurvivalGuide/A-Classic-Alliance-1-13_Human.lua
M	hardcore	
M	classic	
M	tbc	
M	selector	Alliance
M	name	1-6 Northshire
M	version	1
M	group	RestedXP Survival Guide (A)
M	subgroup	RXP Survival Guide 1-20
M	defaultfor	Human
M	next	6-11 Elwynn Forest; 6-13 Elwynn Forest
S	!Human
T	sticky	
T	completewith	next
A	goto	Elwynn Forest,48.171,42.943
S	Warlock
T	completewith	next
A	goto	Elwynn Forest,50.051,42.689
A	vendor	
A	target	Dane Winslow
S	Warlock
A	goto	Elwynn Forest,49.873,42.649
A	accept	1598
A	train	348
A	target	Drusilla La Salle
S	Warlock
T	hardcore	
A	goto	Elwynn Forest,52.9,44.3,60,0
A	goto	Elwynn Forest,56.7,44.0
A	link	https://youtu.be/3qQwsJhAZIk
A	complete	1598,1
S	Warlock
T	completewith	next
A	goto	Elwynn Forest,56.828,43.734
A	hs	
S	Warlock
A	goto	Elwynn Forest,49.873,42.649
A	turnin	1598
A	target	Drusilla La Salle
S	Warlock
T	completewith	next
A	cast	688
S	
A	target	Deputy Willem
A	goto	Elwynn Forest,48.17,42.94
A	accept	783
S	Warrior
A	goto	Elwynn Forest,46.4,40.3,35,0
A	vendor	
A	target	+Brother Danil
A	goto	Elwynn Forest,47.486,41.566
A	train	6673
A	target	+Llane Beshere
A	goto	Elwynn Forest,50.242,42.287
A	mob	Young Wolf
S	
A	target	Marshal McBride
A	goto	Elwynn Forest,48.923,41.606
A	turnin	783
A	accept	7
S	
A	target	Deputy Willem
A	goto	Elwynn Forest,48.171,42.943
A	accept	5261
S	
A	target	Eagan Peltskinner
A	goto	Elwynn Forest,48.941,40.166
A	turnin	5261
A	accept	33
S	Priest/Mage/Warlock
T	completewith	next
A	goto	Elwynn Forest,46.2,40.4,40,0
A	goto	Elwynn Forest,47.486,41.566
A	vendor	
A	target	Brother Danil
A	collect	159,10
S	
T	completewith	next
A	mob	Young Wolf
A	mob	Timber Wolf
A	complete	33,1
S	
A	goto	Elwynn Forest,47.6,35.9,40,0
A	goto	Elwynn Forest,49.6,35.8,40,0
A	goto	Elwynn Forest,51.6,37.0,40,0
A	goto	Elwynn Forest,49.6,35.8
A	mob	Kobold Vermin
A	complete	7,1
S	
A	goto	Elwynn Forest,46.41,41.94,40,0
A	goto	Elwynn Forest,46.61,35.09,40,0
A	goto	Elwynn Forest,51.91,37.85,40,0
A	goto	Elwynn Forest,46.61,35.09,40,0
A	goto	Elwynn Forest,46.41,41.94
A	mob	Young Wolf
A	mob	Timber Wolf
A	complete	33,1
S	
A	goto	Elwynn Forest,48.941,40.166
A	target	Eagan Peltskinner
A	turnin	33,2
A	turnin	33,1
S	Priest/Mage/Warlock
A	goto	Elwynn Forest,47.486,41.566
A	vendor	
A	target	Brother Danil
A	collect	159,10
S	!Priest !Mage !Warlock !Rogue
A	target	Godric Rothgar
A	goto	Elwynn Forest,47.691,41.417
A	vendor	
S	Rogue
A	goto	Elwynn Forest,47.240,41.900
A	vendor	
A	target	Janos Hammerknuckle
S	Rogue
T	completewith	next
A	use	2139
A	itemcount	2139,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<1.3
S	
A	target	Marshal McBride
A	goto	Elwynn Forest,48.923,41.606
A	turnin	7
A	accept	15
A	accept	3100
A	accept	3101
A	accept	3102
A	accept	3103
A	accept	3104
A	accept	3105
S	
A	xp	3
S	
A	goto	Elwynn Forest,47.2,35.1,40,0
A	goto	Elwynn Forest,48.9,32.8,40,0
A	goto	Elwynn Forest,51.7,37.7,40,0
A	goto	Elwynn Forest,47.2,35.1
A	mob	Kobold Worker
A	complete	15,1
S	
T	sticky	
T	label	xp3
A	xp	3+1110
S	
T	completewith	next
A	goto	Elwynn Forest,47.691,41.417
A	target	Godric Rothgar
A	vendor	
S	
T	requires	xp3
A	target	Marshal McBride
A	goto	Elwynn Forest,48.923,41.606
A	turnin	15
A	accept	21
S	Priest/Mage
T	completewith	next
A	goto	Elwynn Forest,49.52,39.99,10
A	goto	Elwynn Forest,49.3,40.7,15
S	Mage
A	target	Khelden Bremen
A	goto	Elwynn Forest,49.661,39.402
A	turnin	3104
A	trainer	
S	Priest
T	completewith	next
A	goto	Elwynn Forest,49.8,40.2,10
S	Priest
A	target	Priestess Anetta
A	goto	Elwynn Forest,49.808,39.489
A	turnin	3103
A	trainer	
S	Warrior/Paladin
T	completewith	next
A	goto	Elwynn Forest,49.6,41.8,15
A	goto	Elwynn Forest,49.6,41.8,15
S	Warrior
A	target	Llane Beshere
A	goto	Elwynn Forest,50.242,42.287
A	turnin	3100
A	trainer	
S	Paladin
A	target	Brother Sammuel
A	goto	Elwynn Forest,50.433,42.124
A	turnin	3101
A	trainer	
S	
A	target	Deputy Willem
A	goto	Elwynn Forest,48.171,42.943
A	accept	18
S	Warlock
A	target	Drusilla La Salle
A	goto	Elwynn Forest,49.873,42.649
A	turnin	3105
A	xp	4
A	trainer	
S	
A	goto	Elwynn Forest,53.9,49.2,50,0
A	goto	Elwynn Forest,55.5,42.1,50,0
A	goto	Elwynn Forest,53.9,49.2
A	goto	Elwynn Forest,54.57,49.03
A	mob	Defias Thug
A	complete	18,1
S	Rogue
A	xp	4
S	
T	completewith	next
T	softcore	
A	deathskip	
S	
A	target	Deputy Willem
A	goto	Elwynn Forest,48.17,42.94
A	turnin	18,4
A	turnin	18,1
A	turnin	18,5
A	turnin	18,2
A	turnin	18,3
A	turnin	18
A	accept	6
A	accept	3903
S	Paladin
T	completewith	next
A	use	5579
A	itemcount	5579,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.6
S	skip
A	target	Godric Rothgar
A	goto	Elwynn Forest,47.7,41.4
A	vendor	
S	
T	completewith	next
A	goto	Elwynn Forest,47.63,32.07,20
S	
A	goto	Elwynn Forest,48.61,27.63
A	mob	Kobold Laborer
A	complete	21,1
S	
A	xp	5
S	!Priest !Mage
A	goto	Elwynn Forest,50.692,39.347
A	turnin	3903
A	target	Milly Osworth
S	Priest/Mage
A	target	Milly Osworth
A	goto	Elwynn Forest,50.692,39.347
A	turnin	3903
A	accept	3904
S	Rogue
A	target	Jorik Kerridan
A	goto	Elwynn Forest,50.314,39.916
A	turnin	3102
S	Priest/Mage
A	goto	Elwynn Forest,54.5,49.4
A	complete	3904,1
S	
A	goto	Elwynn Forest,57.5,48.2
A	mob	Garrick Padfoot
A	complete	6,1
S	!Priest !Mage
T	sticky	
A	abandon	3904
S	!Priest !Mage
A	xp	5+1715
A	goto	Elwynn Forest,48.171,42.943
S	Priest/Mage
A	xp	5+1175
A	goto	Elwynn Forest,50.7,39.2
S	
T	completewith	next
T	softcore	
A	deathskip	
S	Priest/Mage
A	target	Milly Osworth
A	goto	Elwynn Forest,50.692,39.347
A	turnin	3904
A	accept	3905
S	
A	target	Deputy Willem
A	goto	Elwynn Forest,48.17,42.94
A	turnin	6,2
A	turnin	6,1
S	
A	target	Marshal McBride
A	goto	Elwynn Forest,48.923,41.606
A	turnin	21,1
A	turnin	21,2
A	turnin	21,3
A	accept	54
S	Priest/Mage
T	sticky	
T	completewith	next
A	goto	Elwynn Forest,49.6,41.6,15,0
A	goto	Elwynn Forest,48.9,41.3,10
S	Priest/Mage
A	target	Brother Neals
A	goto	Elwynn Forest,49.471,41.586
A	turnin	3905,1
S	Priest
A	target	Priestess Anetta
A	goto	Elwynn Forest,49.808,39.489
A	accept	5623
S	
A	target	Falkhaan Isenstrider
A	goto	Elwynn Forest,45.563,47.742
A	accept	2158
E
G	Guides/SurvivalGuide/A-Classic-Alliance-1-13_Human.lua
M	hardcore	
M	classic	
M	tbc	
M	era/som	
M	selector	Alliance
M	name	6-11 Elwynn Forest
M	version	1
M	group	RestedXP Survival Guide (A)
M	subgroup	RXP Survival Guide 1-20
M	defaultfor	Human
M	next	11-13 Loch Modan
S	
T	completewith	next
A	subzone	87
S	
T	hardcore	
A	target	Marshal Dughan
A	goto	Elwynn Forest,42.105,65.927
A	turnin	54
A	accept	62
S	Warrior/Rogue/Paladin
A	target	Smith Argus
A	goto	Elwynn Forest,41.706,65.544
A	trainer	
S	Warrior
A	target	Corina Steele
A	money	<0.0536
A	goto	Elwynn Forest,41.529,65.900
A	collect	2488,1
S	Rogue
A	target	Corina Steele
A	money	<0.0400
A	goto	Elwynn Forest,41.529,65.900
A	collect	2494,1
S	Paladin
A	target	Corina Steele
A	money	<0.0631
A	goto	Elwynn Forest,41.529,65.900
A	collect	2493,1
S	Mage/Priest/Warlock
T	completewith	next
A	target	Andrew Krighton
A	goto	Elwynn Forest,41.706,65.786
A	vendor	
S	
T	label	Goldshire
A	target	Marshal Dughan
A	goto	Elwynn Forest,42.105,65.927
A	turnin	54
A	accept	62
S	
A	target	William Pestle
A	goto	Elwynn Forest,43.318,65.705
A	accept	60
S	
A	goto	Elwynn Forest,43.771,65.803
A	target	Innkeeper Farley
A	turnin	2158,1
A	turnin	2158,2
A	home	
S	
A	xp	6
S	Rogue
A	target	Brog Hamfist
A	goto	Elwynn Forest,43.96,65.92
A	vendor	151
S	Warlock
T	completewith	next
A	goto	Elwynn Forest,44.1,66.0,10
S	Warlock
A	goto	Elwynn Forest,44.392,66.240
A	target	Maximillian Crowe
A	trainer	
S	Warlock
A	goto	Elwynn Forest,44.397,65.989
A	vendor	
A	target	Cylina Darkheart
S	Mage/Rogue/Priest
T	completewith	next
A	goto	Elwynn Forest,43.877,66.546,9
S	Mage
A	target	Zaldimar Wefhellt
A	goto	Elwynn Forest,43.25,66.19
A	trainer	
S	Priest
A	target	Priestess Josetta
A	goto	Elwynn Forest,43.283,65.721
A	turnin	5623
A	accept	5624
A	trainer	
S	Rogue
A	money	<0.01
A	target	Keryn Sylvius
A	goto	Elwynn Forest,43.872,65.937
A	trainer	
S	Rogue/Warrior
A	money	<0.01
A	goto	Elwynn Forest,43.877,66.546,9,0 << Warrior
A	goto	Elwynn Forest,43.392,65.550
A	target	Michelle Belle
A	train	3273
S	Warrior/Rogue
A	goto	Elwynn Forest,43.771,65.803
A	vendor	
A	vendor	
A	target	Innkeeper Farley
S	Warrior
A	target	Lyria Du Lac
A	goto	Elwynn Forest,41.087,65.768
A	trainer	
S	Paladin
A	target	Brother Wilhelm
A	goto	Elwynn Forest,41.096,66.041
A	trainer	
S	
A	target	Remy "Two Times"
A	goto	Elwynn Forest,42.140,67.254
A	accept	47
S	Priest
A	target	Guard Roberts
A	goto	Elwynn Forest,48.148,68.046
A	complete	5624,1
S	
T	completewith	BoarMeat1
A	collect	769,4
A	mob	Stonetusk Boar
S	
A	accept	85
A	target	+"Auntie" Bernice Stonefield
A	goto	Elwynn Forest,34.486,84.253
A	accept	88
A	target	+Ma Stonefield
A	goto	Elwynn Forest,34.660,84.482
S	
T	completewith	next
A	complete	60,1
A	complete	47,1
A	mob	Kobold Tunneler
A	mob	Kobold Miner
S	
A	target	Billy Maclure
A	goto	Elwynn Forest,43.131,85.722
A	turnin	85
A	accept	86
S	
A	goto	Elwynn Forest,43.154,89.625
A	accept	106
A	target	Maybell Maclure
S	
T	completewith	next
A	goto	Elwynn Forest,42.357,89.373
A	target	Joshua Maclure
A	vendor	
A	vendor	
S	
T	completewith	next
A	complete	60,1
A	complete	47,1
A	mob	Kobold Tunneler
A	mob	Kobold Miner
S	
T	label	BoarMeat1
A	goto	Elwynn Forest,29.840,85.997
A	turnin	106
A	accept	111
A	target	Tommy Joe Stonefield
S	
A	goto	Elwynn Forest,32.5,85.5
A	complete	86,1
A	mob	Stonetusk Boar
S	
A	target	"Auntie" Bernice Stonefield
A	goto	Elwynn Forest,34.486,84.253
A	turnin	86
A	accept	84
S	
A	target	Gramma Stonefield
A	goto	1429,34.945,83.855
A	turnin	111
A	accept	107
S	
T	completewith	next
A	complete	60,1
A	complete	47,1
A	mob	Kobold Tunneler
A	mob	Kobold Miner
S	
A	target	Billy Maclure
A	goto	Elwynn Forest,43.131,85.722
A	turnin	84
A	accept	87
S	
T	completewith	KillGoldtooth
A	complete	60,1
A	complete	47,1
A	mob	Kobold Tunneler
A	mob	Kobold Miner
S	
T	completewith	next
A	goto	Elwynn Forest,38.677,81.778,50,0
A	goto	Elwynn Forest,40.5,82.3
A	complete	62,1
S	
T	label	KillGoldtooth
A	goto	Elwynn Forest,41.7,78.1
A	complete	87,1
A	unitscan	Goldtooth
S	
T	completewith	next
A	complete	60,1
A	complete	47,1
A	mob	Kobold Tunneler
A	mob	Kobold Miner
S	
A	goto	Elwynn Forest,40.5,82.3
A	complete	62,1
S	
A	goto	Elwynn Forest,40.5,82.3,25,0
A	goto	Elwynn Forest,37.71,83.76,25,0
A	goto	Elwynn Forest,40.5,82.3,25,0
A	goto	Elwynn Forest,37.71,83.76,25,0
A	goto	Elwynn Forest,40.5,82.3
A	complete	60,1
A	complete	47,1
A	mob	Kobold Tunneler
A	mob	Kobold Miner
S	Warrior
T	completewith	Goldtooth
S	Warrior/Rogue
A	xp	7+1600
S	Paladin
A	xp	7+1600
S	!Priest !Paladin !Warrior !Rogue
A	xp	7+1600
S	Priest
A	xp	7+1260
S	
T	label	Goldtooth
A	target	"Auntie" Bernice Stonefield
A	goto	Elwynn Forest,34.486,84.253
A	turnin	87
S	
A	xp	7+2690
A	xp	7+2350
A	goto	Elwynn Forest,42.1,67.3
S	
T	completewith	next
A	goto	Elwynn Forest,42.20,66.00,100
S	
A	target	Remy "Two Times"
A	goto	Elwynn Forest,42.140,67.254
A	turnin	47
A	accept	40
S	
A	target	Marshal Dughan
A	goto	Elwynn Forest,42.105,65.927
A	turnin	40
A	accept	35
A	turnin	62
A	accept	76
S	
T	completewith	next
A	goto	Elwynn Forest,41.529,65.900
A	vendor	
A	target	Corina Steele
S	Warrior
A	target	Corina Steele
A	money	<0.0536
A	goto	Elwynn Forest,41.529,65.900
A	collect	2488,1
S	Rogue
A	target	Corina Steele
A	money	<0.0400
A	goto	Elwynn Forest,41.529,65.900
A	collect	2494,1
S	Paladin
A	target	Corina Steele
A	money	<0.0631
A	goto	Elwynn Forest,41.529,65.900
A	collect	2493,1
S	
A	target	William Pestle
A	goto	Elwynn Forest,43.318,65.705
A	turnin	60
A	accept	61
A	turnin	107
A	accept	112
S	
A	xp	8
S	Warrior
A	target	Lyria Du Lac
A	goto	Elwynn Forest,41.087,65.768
A	trainer	
S	Paladin
A	target	Brother Wilhelm
A	goto	Elwynn Forest,41.096,66.041
A	trainer	
S	Warlock
T	completewith	next
A	goto	Elwynn Forest,44.1,66.0,10
S	Warlock
A	goto	Elwynn Forest,44.392,66.240
A	target	Maximillian Crowe
A	trainer	
S	Warlock
A	goto	Elwynn Forest,44.397,65.989
A	vendor	
A	target	Cylina Darkheart
S	Mage/Priest/Rogue/Warrior/Paladin
T	completewith	next
A	goto	Elwynn Forest,43.877,66.546,9
S	Mage
A	target	Zaldimar Wefhellt
A	goto	Elwynn Forest,43.25,66.19
A	trainer	
S	Priest
A	goto	Elwynn Forest,43.283,65.721
A	target	Priestess Josetta
A	turnin	5624
A	trainer	
S	Rogue
A	target	Keryn Sylvius
A	goto	Elwynn Forest,43.872,65.937
A	trainer	
S	Rogue/Warrior/Paladin
A	money	<0.01
A	target	Michelle Belle
A	goto	Elwynn Forest,43.392,65.550
A	train	3273
S	
A	money	<0.1250
A	goto	Elwynn Forest,43.96,65.92
A	vendor	
A	target	Brog Hamfist
S	
T	completewith	next
A	goto	Elwynn Forest,43.771,65.803
A	vendor	
A	vendor	
A	vendor	
A	target	Innkeeper Farley
S	
A	goto	Elwynn Forest,47.6,63.3,60,0
A	goto	Elwynn Forest,51.4,64.6,60,0
A	goto	Elwynn Forest,57.6,62.8,60,0
A	goto	Elwynn Forest,56.4,66.6,60,0
A	goto	Elwynn Forest,53.8,66.8,60,0
A	goto	Elwynn Forest,57.6,62.8
A	complete	112,1
A	mob	Murloc
A	mob	Murloc Streamrunner
S	
T	completewith	next
A	goto	Elwynn Forest,61.654,53.608,15
S	
A	goto	Elwynn Forest,60.4,50.2
A	complete	76,1
S	
A	target	Guard Thomas
A	goto	Elwynn Forest,73.973,72.179
A	turnin	35
A	accept	37
A	accept	52
S	
T	completewith	AcceptBundle
A	complete	52,1
A	mob	+Prowler
A	complete	52,2
A	mob	+Young Forest Bear
S	
A	goto	Elwynn Forest,72.656,60.334
A	turnin	37
A	accept	45
S	
T	label	AcceptBundle
A	target	Supervisor Raelen
A	goto	Elwynn Forest,81.382,66.112
A	accept	5545
S	
A	target	Rallic Finn
A	goto	Elwynn Forest,83.283,66.089
A	vendor	
A	zoneskip	Elwynn Forest,1
S	
T	completewith	Prowlers
A	complete	52,1
A	mob	+Prowler
A	complete	52,2
A	mob	+Young Forest Bear
S	
T	completewith	Bundles
A	complete	5545,1
S	
T	label	Prowlers
A	goto	Elwynn Forest,79.80,55.50
A	turnin	45
A	accept	71
S	
T	label	Bundles
A	goto	Elwynn Forest,76.7,75.6,60,0
A	goto	Elwynn Forest,79.7,83.7,60,0
A	goto	Elwynn Forest,82.0,76.8,60,0
A	goto	Elwynn Forest,76.7,75.6,60,0
A	goto	Elwynn Forest,79.7,83.7,60,0
A	goto	Elwynn Forest,82.0,76.8,60,0
A	goto	Elwynn Forest,86.99,64.83
A	complete	52,1
A	mob	+Prowler
A	complete	52,2
A	mob	+Young Forest Bear
S	
A	goto	Elwynn Forest,76.8,62.4,40,0
A	goto	Elwynn Forest,83.7,59.4,40,0
A	goto	Elwynn Forest,76.8,62.4,40,0
A	goto	Elwynn Forest,83.7,59.4,40,0
A	goto	Elwynn Forest,76.8,62.4,40,0
A	goto	Elwynn Forest,83.7,59.4
A	complete	5545,1
S	
A	target	Supervisor Raelen
A	goto	Elwynn Forest,81.382,66.112
A	turnin	5545
S	
A	goto	Elwynn Forest,76.8,62.4,90,0
A	goto	Elwynn Forest,83.7,59.4,90,0
A	goto	Elwynn Forest,76.8,62.4,90,0
A	goto	Elwynn Forest,83.7,59.4,90,0
A	goto	Elwynn Forest,76.8,62.4,90,0
A	goto	Elwynn Forest,83.7,59.4,90,0
A	goto	Elwynn Forest,76.8,62.4
A	xp	9
S	
A	target	Sara Timberlain
A	goto	Elwynn Forest,79.457,68.789
A	accept	83
S	
A	target	Guard Thomas
A	goto	Elwynn Forest,73.973,72.179
A	turnin	52
A	turnin	71
A	accept	39
A	accept	109
A	xp	<9,1
S	
A	target	Guard Thomas
A	goto	Elwynn Forest,73.973,72.179
A	turnin	52
A	turnin	71
A	accept	39
S	
T	era	
T	completewith	next
A	complete	83,1
A	mob	Defias Bandit
A	isOnQuest	83
S	
A	goto	Elwynn Forest,69.3,79.0
A	link	https://www.youtube.com/watch?v=GRrXOV-UvD4
A	complete	88,1
A	mob	Princess
S	
T	completewith	Level9Grind
A	use	1972
A	collect	1972,1,184
A	accept	184
S	
T	era	
A	goto	Elwynn Forest,70.5,77.6,60,0
A	goto	Elwynn Forest,68.1,77.5,60,0
A	goto	Elwynn Forest,68.2,81.4,60,0
A	goto	Elwynn Forest,70.8,80.9,60,0
A	goto	Elwynn Forest,70.5,77.6,60,0
A	goto	Elwynn Forest,68.1,77.5,60,0
A	goto	Elwynn Forest,68.2,81.4,60,0
A	goto	Elwynn Forest,70.8,80.9,60,0
A	goto	Elwynn Forest,70.5,77.6,60,0
A	goto	Elwynn Forest,68.1,77.5,60,0
A	goto	Elwynn Forest,68.2,81.4,60,0
A	goto	Elwynn Forest,70.8,80.9,60,0
A	goto	Elwynn Forest,69.3,79.0
A	complete	83,1
A	mob	Defias Bandit
A	isOnQuest	83
S	
T	label	Level9Grind
A	goto	Elwynn Forest,69.53,79.47
A	xp	9+3400
S	
A	target	Sara Timberlain
A	goto	Elwynn Forest,79.457,68.789
A	turnin	83
A	isQuestComplete	83
S	!Warlock
A	goto	Redridge Mountains,8.5,72.0
A	xp	9+4475
S	!Warlock
T	completewith	next
A	goto	Redridge Mountains,17.4,69.6
A	zone	Redridge Mountains
S	!Warlock
A	goto	Redridge Mountains,18.581,69.208,15,0
A	goto	Redridge Mountains,23.325,71.373,25,0
A	goto	Redridge Mountains,29.565,67.930,25,0
A	goto	Redridge Mountains,30.590,59.410
A	fp	Redridge Mountains
A	target	Ariena Stormfeather
S	
T	completewith	next
A	hs	
S	
A	goto	Elwynn Forest,43.318,65.705
A	turnin	112
A	accept	114
A	target	William Pestle
S	
T	completewith	next
A	goto	Elwynn Forest,43.877,66.546,9
S	
A	target	Michelle Belle
A	goto	Elwynn Forest,43.392,65.550
A	train	3273
S	
A	target	Marshal Dughan
A	goto	Elwynn Forest,42.105,65.927
A	turnin	39
A	turnin	76
A	accept	239
A	accept	59
A	accept	109
S	
A	target	Smith Argus
A	goto	Elwynn Forest,41.706,65.544
A	accept	1097
S	
A	xp	10
S	
T	softcore	
A	goto	Elwynn Forest,41.7,65.9
A	vendor	
S	Warrior
A	goto	Elwynn Forest,41.087,65.768
A	target	Ilsa Corbin
A	target	Lyria Du Lac
A	accept	1638
A	trainer	
S	Paladin
A	target	Brother Wilhelm
A	goto	Elwynn Forest,41.096,66.041
A	trainer	
S	Warlock
T	completewith	next
A	goto	Elwynn Forest,44.1,66.0,10
S	Warlock
A	goto	Elwynn Forest,44.392,66.240
A	target	Maximillian Crowe
A	trainer	
S	Warlock
A	goto	Elwynn Forest,44.485,66.268
A	target	Remen Marcot
A	accept	1685
S	Mage/Priest/Rogue
T	sticky	
T	completewith	next
A	goto	Elwynn Forest,43.7,66.4,10
S	Priest
A	goto	Elwynn Forest,43.283,65.721
A	target	Priestess Josetta
A	accept	5635
A	trainer	
S	Mage
A	target	Zaldimar Wefhellt
A	goto	Elwynn Forest,43.25,66.19
A	trainer	
S	Rogue
A	target	Keryn Sylvius
A	goto	Elwynn Forest,43.872,65.937
A	trainer	
A	train	674
A	train	2983
S	Rogue
T	som	
A	goto	Elwynn Forest,41.7,65.9
A	money	>0.3197
A	vendor	
S	Rogue
T	era	
A	target	Corina Steele
A	money	>0.3152
A	goto	Elwynn Forest,41.529,65.900
A	collect	2494,1
S	
T	completewith	next
A	goto	Elwynn Forest,43.154,89.625,50
S	
A	goto	Elwynn Forest,43.154,89.625
A	turnin	114
A	target	Maybell Maclure
S	
A	goto	Elwynn Forest,34.660,84.482
A	target	Ma Stonefield
A	turnin	88,1
A	turnin	88,2
A	turnin	88,3
S	
T	completewith	next
A	goto	Elwynn Forest,24.82,76.25,80
S	Warlock
A	turnin	239
A	accept	11
A	goto	Elwynn Forest,24.234,74.450
A	accept	176
A	goto	Elwynn Forest,24.548,74.672
A	target	Deputy Rainer
S	
A	group	
A	turnin	239
A	accept	11
A	goto	Elwynn Forest,24.234,74.450
A	accept	176
A	goto	Elwynn Forest,24.548,74.672
A	target	Deputy Rainer
S	
A	solo	
A	goto	Elwynn Forest,24.234,74.450
A	turnin	239
A	accept	11
A	target	Deputy Rainer
S	
T	completewith	GnollEnd
A	use	1307
A	collect	1307,1,123
A	accept	123
A	unitscan	Gruff Swiftbite
S	!Warlock
A	group	
T	completewith	next
A	complete	11,1
A	mob	Riverpaw Runt
A	mob	Riverpaw Outrunner
S	!Warlock
A	group	
A	goto	Elwynn Forest,27.0,86.7,70,0
A	goto	Elwynn Forest,26.1,89.9,70,0
A	goto	Elwynn Forest,25.2,92.7,70,0
A	goto	Elwynn Forest,27.0,93.9,70,0
A	goto	Elwynn Forest,27.0,86.7,70,0
A	goto	Elwynn Forest,26.1,89.9,70,0
A	goto	Elwynn Forest,25.2,92.7,70,0
A	goto	Elwynn Forest,27.0,93.9,70,0
A	goto	Elwynn Forest,27.0,86.7,70,0
A	goto	Elwynn Forest,26.1,89.9,70,0
A	goto	Elwynn Forest,25.2,92.7,70,0
A	goto	Elwynn Forest,27.0,93.9,70,0
A	goto	Elwynn Forest,25.9,93.9
A	complete	176,1
A	unitscan	Hogger
S	Warlock
T	completewith	next
A	complete	11,1
A	mob	Riverpaw Runt
A	mob	Riverpaw Outrunner
S	Warlock
A	goto	Elwynn Forest,27.0,86.7,70,0
A	goto	Elwynn Forest,26.1,89.9,70,0
A	goto	Elwynn Forest,25.2,92.7,70,0
A	goto	Elwynn Forest,27.0,93.9,70,0
A	goto	Elwynn Forest,27.0,86.7,70,0
A	goto	Elwynn Forest,26.1,89.9,70,0
A	goto	Elwynn Forest,25.2,92.7,70,0
A	goto	Elwynn Forest,27.0,93.9,70,0
A	goto	Elwynn Forest,27.0,86.7,70,0
A	goto	Elwynn Forest,26.1,89.9,70,0
A	goto	Elwynn Forest,25.2,92.7,70,0
A	goto	Elwynn Forest,27.0,93.9,70,0
A	goto	Elwynn Forest,25.9,93.9
A	complete	176,1
A	unitscan	Hogger
S	
T	label	GnollEnd
A	goto	Elwynn Forest,27.0,86.7,70,0
A	goto	Elwynn Forest,26.1,89.9,70,0
A	goto	Elwynn Forest,25.2,92.7,70,0
A	goto	Elwynn Forest,27.0,93.9,70,0
A	goto	Elwynn Forest,27.0,86.7,70,0
A	goto	Elwynn Forest,26.1,89.9,70,0
A	goto	Elwynn Forest,25.2,92.7,70,0
A	goto	Elwynn Forest,27.0,93.9,70,0
A	goto	Elwynn Forest,27.0,86.7,70,0
A	goto	Elwynn Forest,26.1,89.9,70,0
A	goto	Elwynn Forest,25.2,92.7,70,0
A	goto	Elwynn Forest,27.0,93.9,70,0
A	goto	Elwynn Forest,25.9,93.9
A	complete	11,1
A	mob	Riverpaw Runt
A	mob	Riverpaw Outrunner
S	Warrior
A	money	>0.3129
T	era	
A	goto	Elwynn Forest,27.0,86.7,70,0
A	goto	Elwynn Forest,26.1,89.9,70,0
A	goto	Elwynn Forest,25.2,92.7,70,0
A	goto	Elwynn Forest,27.0,93.9,70,0
A	goto	Elwynn Forest,27.0,86.7,70,0
A	goto	Elwynn Forest,26.1,89.9,70,0
A	goto	Elwynn Forest,25.2,92.7,70,0
A	goto	Elwynn Forest,27.0,93.9,70,0
A	goto	Elwynn Forest,27.0,86.7,70,0
A	goto	Elwynn Forest,26.1,89.9,70,0
A	goto	Elwynn Forest,25.2,92.7,70,0
A	goto	Elwynn Forest,27.0,93.9,70,0
A	goto	Elwynn Forest,25.9,93.9
S	!Warlock
A	target	Marshal Dughan
A	goto	Elwynn Forest,42.105,65.927
A	turnin	176
A	isQuestComplete	176
S	!Warlock
A	target	Marshal Dughan
A	goto	Elwynn Forest,42.105,65.927
A	turnin	123
A	isOnQuest	123
S	
A	goto	Elwynn Forest,24.234,74.450
A	turnin	11
A	target	Deputy Rainer
S	
T	completewith	WestEntry
A	goto	Westfall,59.95,19.35
A	zone	Westfall
S	
A	target	Farmer Furlbrow
A	goto	Westfall,59.95,19.35
A	turnin	184
A	isOnQuest	184
S	
T	label	WestEntry
A	accept	64
A	target	+Farmer Furlbrow
A	goto	Westfall,59.95,19.35
A	accept	151
A	accept	36
A	goto	Westfall,59.92,19.42
A	target	+Verna Furlbrow
S	
A	target	Farmer Saldean
A	goto	Westfall,56.04,31.23
A	accept	9
S	
A	goto	Westfall,56.416,30.519
A	turnin	36
A	target	Salma Saldean
A	accept	38
A	accept	22
S	
T	softcore	
T	completewith	next
A	deathskip	
A	target	Spirit Healer
S	
A	goto	Westfall,56.327,47.520
A	turnin	109
A	target	Gryan Stoutmantle
A	accept	12
S	
T	era	
A	goto	Westfall,56.421,47.623
A	target	Captain Danuvin
A	accept	102
S	Human
A	goto	Westfall,57.002,47.169
A	target	Quartermaster Lewis
A	accept	6181
A	vendor	
S	Rogue
T	era	
A	money	>0.3152
S	Rogue
T	som	
A	money	>0.3197
S	Human
A	goto	Westfall,56.55,52.64
A	turnin	6181
A	accept	6281
A	target	Thor
S	
A	goto	Westfall,56.55,52.64
A	fly	Stormwind
A	target	Thor
S	Rogue
T	som	
A	goto	StormwindClassic,57.32,62.08,20,0
A	goto	StormwindClassic,58.37,61.69
A	vendor	
S	Rogue
T	era	
A	goto	StormwindClassic,57.32,62.08,20,0
A	goto	StormwindClassic,58.362,61.678
A	vendor	
A	target	Thurman Mullby
S	
A	goto	StormwindClassic,56.201,64.585
A	turnin	61,1
A	link	https://www.youtube.com/watch?v=H-IwZ6P-ldY
A	target	Morgan Pestle
S	
A	target	Woo Ping
A	goto	StormwindClassic,57.129,57.698
A	trainer	
A	trainer	
A	trainer	
S	Rogue
A	goto	StormwindClassic,57.547,57.076
A	target	Gunther Weller
A	vendor	
S	
A	goto	StormwindClassic,52.623,65.701
A	home	
A	target	Innkeeper Allison
S	Warlock
T	completewith	next
A	goto	StormwindClassic,29.2,74.0,20,0
A	goto	StormwindClassic,27.2,78.1,15
S	Warlock
A	goto	StormwindClassic,25.25,78.59
A	turnin	1685
A	target	Gakin the Darkbinder
A	accept	1688
S	Warlock
T	softcore	
A	deathskip	
S	Warlock
A	goto	Elwynn Forest,42.105,65.927
A	zone	Elwynn Forest
S	Warlock
A	isOnQuest	123
A	goto	Elwynn Forest,42.105,65.927
A	target	Marshal Dughan
A	turnin	176
A	turnin	123
A	accept	147
S	Warlock
A	goto	Elwynn Forest,42.105,65.927
A	target	Marshal Dughan
A	turnin	176
S	Warlock
A	isQuestTurnedIn	123
A	goto	Elwynn Forest,42.105,65.927
A	target	Marshal Dughan
A	accept	147
S	Warlock
A	xp	11
S	Warlock
T	completewith	LockVW
A	goto	Elwynn Forest,71.0,80.8,150
S	Warlock
A	isOnQuest	147
A	goto	Elwynn Forest,71.10,80.66
A	complete	1688,1
A	mob	+Surena Caledon
A	complete	147,1
A	mob	+Morgan the Collector
S	Warlock
T	label	LockVW
A	goto	Elwynn Forest,71.10,80.66
A	complete	1688,1
A	mob	Surena Caledon
S	Warlock
A	goto	Elwynn Forest,79.457,68.789
A	target	Sara Timberlain
A	turnin	59
S	Warlock
T	completewith	next
A	goto	Redridge Mountains,17.4,69.6
A	zone	Redridge Mountains
A	collect	6265,2
S	Warlock
A	target	Guard Parker
A	goto	Redridge Mountains,17.4,69.6
A	accept	244
S	Warlock
A	goto	Redridge Mountains,18.581,69.208,15,0
A	goto	Redridge Mountains,23.325,71.373,25,0
A	goto	Redridge Mountains,29.565,67.930,25,0
A	goto	Redridge Mountains,30.733,59.996
A	turnin	244
A	target	Deputy Feldon
S	Warlock
A	goto	Redridge Mountains,30.590,59.410
A	fp	Redridge Mountains
A	fly	Stormwind
A	target	Ariena Stormfeather
S	Warlock
A	isQuestComplete	147
T	completewith	next
A	goto	Elwynn Forest,42.105,65.927,100
S	Warlock
A	isQuestComplete	147
A	goto	Elwynn Forest,42.105,65.927
A	target	Marshal Dughan
A	turnin	147
S	Warlock
T	completewith	TravelIF
A	isQuestTurnedIn	147
A	goto	StormwindClassic,70.07,86.82
A	zone	Stormwind City
A	zoneskip	Elwynn Forest,1
S	Warlock
T	completewith	next
A	goto	StormwindClassic,29.2,74.0,20,0
A	goto	StormwindClassic,27.2,78.1,15
S	Warlock
A	goto	StormwindClassic,26.117,77.225
A	trainer	
A	target	Ursula Deline
S	Warlock
A	goto	StormwindClassic,25.25,78.59
A	turnin	1688
A	accept	1689
A	target	Gakin the Darkbinder
S	Warlock
T	completewith	next
A	goto	StormwindClassic,25.2,80.7,18,0
A	goto	StormwindClassic,23.2,79.5,18,0
A	goto	StormwindClassic,26.3,79.5,18,0
A	goto	StormwindClassic,25.154,77.406
A	cast	7728
A	use	6928
S	Warlock
A	goto	StormwindClassic,25.154,77.406
A	use	6928
A	complete	1689,1
A	mob	Summoned Voidwalker
S	Warlock
A	target	Gakin the Darkbinder
A	goto	StormwindClassic,25.25,78.59
A	turnin	1689
S	Human
A	goto	StormwindClassic,74.312,47.240
A	turnin	6281
A	target	Osric Strang
A	accept	6261
S	Warrior
A	target	Harry Burlguard
A	goto	StormwindClassic,74.249,37.244
A	turnin	1638
A	accept	1639
S	Warrior
A	target	Bartleby
A	goto	StormwindClassic,73.787,36.323
A	turnin	1639
A	accept	1640
S	Warrior
A	goto	StormwindClassic,73.787,36.323
A	complete	1640,1
A	mob	Bartleby
S	Warrior
A	target	Bartleby
A	goto	StormwindClassic,73.787,36.323
A	turnin	1640
A	accept	1665
S	Warrior
A	target	Harry Burlguard
A	goto	StormwindClassic,74.249,37.244
A	turnin	1665
S	Priest
T	completewith	next
A	goto	StormwindClassic,42.51,33.51,20
S	Priest
A	target	High Priestess Laurena
A	goto	StormwindClassic,38.54,26.86
A	trainer	
A	turnin	5635
S	Priest
A	goto	StormwindClassic,38.62,26.10
A	train	13908
A	target	High Priestess Laurena
S	
A	goto	StormwindClassic,51.757,12.091
A	target	Grimand Elmore
A	turnin	1097
S	
A	goto	StormwindClassic,51.757,12.091
A	target	Grimand Elmore
A	accept	353
S	Warrior
T	completewith	next
S	Warrior/Paladin/Rogue
A	goto	StormwindClassic,56.3,17.0
A	vendor	
A	target	Kaita Deepforge
S	
T	label	TravelIF
T	completewith	next
A	goto	StormwindClassic,61.149,11.568,25,0
A	goto	StormwindClassic,64.0,8.10
A	zone	Ironforge
S	
A	accept	6661
A	target	Monty
S	
A	use	17117
A	complete	6661,1
A	mob	Deeprun Rat
S	
A	target	Monty
A	turnin	6661
S	
A	zone	Ironforge
S	
A	goto	Ironforge,55.501,47.742
A	fp	Ironforge
A	target	Gryth Thurden
S	Warrior
A	train	2567
A	target	+Bixi Wobblebonk
A	goto	Ironforge,62.237,89.628
A	train	199
A	goto	Ironforge,61.177,89.508
A	target	+Buliwyf Stonehand
S	Warrior
A	goto	Ironforge,62.375,88.679
A	vendor	
A	target	Brenwyn Wintersteel
S	
T	ah	
A	goto	Ironforge,25.800,75.500,-1
A	goto	Ironforge,24.200,74.600,-1
A	goto	Ironforge,23.800,71.800,-1
A	collect	3172,3,418,1
A	collect	3173,3,418,1
A	collect	3174,3,418,1
A	target	Auctioneer Lympkin
A	target	Auctioneer Redmuse
A	target	Auctioneer Buckler
S	skip
T	sticky	
T	som	
T	completewith	next
A	goto	Dun Morogh,53.5,34.9,100
S	skip
T	sticky	
T	era	
T	completewith	next
A	goto	Dun Morogh,53.5,34.9,100
S	
A	goto	Dun Morogh,53.5,34.9,60,0
A	goto	Dun Morogh,52.251,37.592,150
S	
T	completewith	next
A	goto	Dun Morogh,46.005,48.637,50
S	
A	target	Razzle Sprysprocket
A	goto	Dun Morogh,46.005,48.637,10,0
A	goto	Dun Morogh,45.846,49.365
A	accept	412
S	
A	target	Senir Whitebeard
A	goto	Dun Morogh,46.726,53.826
A	accept	287
S	
A	target	Tundra MacGrann
A	goto	Dun Morogh,34.578,57.732,100,0
A	goto	Dun Morogh,36.654,51.906,40,0
A	goto	Dun Morogh,34.577,51.652
A	accept	312
S	!Mage !Warlock
A	goto	Dun Morogh,38.517,53.927
A	link	https://www.youtube.com/watch?v=o55Y3LjgKoE
A	complete	312,1
S	Mage/Warlock
A	goto	Dun Morogh,38.517,53.927
A	complete	312,1
S	
A	target	Tundra MacGrann
A	goto	Dun Morogh,34.577,51.652
A	turnin	312
S	
A	goto	Dun Morogh,27.2,43.0,60,0
A	goto	Dun Morogh,24.8,39.3,60,0
A	goto	Dun Morogh,25.6,43.4,60,0
A	goto	Dun Morogh,24.3,44.0,60,0
A	goto	Dun Morogh,25.4,45.4,60,0
A	goto	Dun Morogh,25.00,43.50
A	complete	412,2
A	complete	412,1
A	mob	Leper Gnome
S	
T	completewith	next
A	goto	Dun Morogh,24.509,50.831,20
S	
T	completewith	next
A	complete	287,1
A	mob	Frostmane Headhunter
S	
A	goto	Dun Morogh,22.86,52.16
A	complete	287,2
S	
A	goto	Dun Morogh,24.5,50.8,40,0
A	goto	Dun Morogh,22.1,50.3,40,0
A	goto	Dun Morogh,21.3,52.9,40,0
A	goto	Dun Morogh,24.5,50.8,0
A	goto	Dun Morogh,22.1,50.3,0
A	goto	Dun Morogh,21.3,52.9,0
A	complete	287,1
A	mob	Frostmane Headhunter
S	
T	completewith	next
A	goto	Dun Morogh,45.846,49.365,150
S	
A	goto	Dun Morogh,46.005,48.637,8,0
A	goto	Dun Morogh,45.846,49.365
A	target	Razzle Sprysprocket
A	turnin	412
S	
A	target	Senir Whitebeard
A	goto	Dun Morogh,46.726,53.826
A	turnin	287
A	accept	291
S	
A	target	Rudra Amberstill
A	goto	Dun Morogh,60.1,52.6,50,0
A	goto	Dun Morogh,63.082,49.851
A	accept	314
S	
T	completewith	next
A	goto	Dun Morogh,62.3,50.3,14,0
A	goto	Dun Morogh,62.2,49.4,10
S	
A	goto	Dun Morogh,62.6,46.1
A	link	https://www.youtube.com/watch?v=ZJX6sCkm5JY
A	complete	314,1
A	mob	Vagash
S	
A	target	Rudra Amberstill
A	goto	Dun Morogh,63.082,49.851
A	turnin	314
S	
A	goto	Dun Morogh,68.379,54.492
A	train	2550
A	target	Cook Ghilm
S	
A	goto	Dun Morogh,68.614,54.643
A	vendor	
A	vendor	
A	target	Kazan Mogosh
S	
A	accept	433
A	target	+Senator Mehr Stonehallow
A	goto	Dun Morogh,68.671,55.969
A	accept	432
A	goto	Dun Morogh,69.084,56.330
A	target	+Foreman Stonebrow
S	Warrior/Paladin/Rogue
A	goto	Dun Morogh,69.324,55.456
A	train	2575
S	Warrior/Paladin/Rogue
A	cast	2580
S	
A	goto	Dun Morogh,70.7,56.4,40,0
A	goto	Dun Morogh,70.62,52.39,25,0
A	goto	Dun Morogh,70.7,56.4
A	complete	432,1
A	mob	+Rockjaw Skullthumper
A	complete	433,1
A	mob	+Rockjaw Bonesnapper
S	!Warlock
A	xp	10+6350
S	Warlock
A	xp	12
S	
A	turnin	432
A	target	+Foreman Stonebrow
A	goto	Dun Morogh,69.084,56.330
A	turnin	433
A	target	+Senator Mehr Stonehallow
A	goto	Dun Morogh,68.671,55.969
S	
A	goto	Dun Morogh,68.614,54.643
A	vendor	
A	vendor	
A	target	Kazan Mogosh
S	!Warlock
A	xp	11
S	
A	goto	Dun Morogh,81.2,42.7,45,0
A	goto	Dun Morogh,83.892,39.188
A	target	Pilot Hammerfoot
A	accept	419
S	
A	goto	Dun Morogh,79.672,36.171
A	turnin	419
A	accept	417
S	
A	goto	Dun Morogh,78.97,37.14
A	complete	417,1
A	unitscan	Mangeclaw
S	
T	som	
A	goto	Dun Morogh,83.892,39.188
A	target	Pilot Hammerfoot
A	turnin	417
S	
T	era	
A	target	Pilot Hammerfoot
A	goto	Dun Morogh,83.892,39.188
A	turnin	417
S	
A	goto	Dun Morogh,84.4,31.1,25
E
G	Guides/SurvivalGuide/A-Classic-Alliance-1-13_Human.lua
M	hardcore	
M	classic	
M	tbc	
M	era/som--h	
M	selector	Alliance
M	name	11-13 Loch Modan
M	version	1
M	group	RestedXP Survival Guide (A)
M	subgroup	RXP Survival Guide 1-20
M	defaultfor	Human
M	next	13-15 Westfall
S	
T	completewith	next
A	goto	Loch Modan,24.134,18.208
A	vendor	
A	target	Gothor Brumn
S	
A	group	
A	goto	Loch Modan,24.764,18.397
A	turnin	353
A	target	Mountaineer Stormpike
A	accept	307
S	
A	solo	
A	goto	Loch Modan,24.764,18.397
A	turnin	353
A	target	Mountaineer Stormpike
S	
T	completewith	ThelsamarFirst
A	collect	3172,3,418,1
A	mob	+Mountain Boar
A	collect	3173,3,418,1
A	mob	+Elder Black Bear
A	collect	3174,3,418,1
A	mob	+Forest Lurker
S	
T	completewith	next
A	goto	Loch Modan,34.828,49.283,130
S	
T	label	ThelsamarFirst
A	goto	Loch Modan,34.828,49.283
A	target	Vidra Hearthstove
A	accept	418
S	
T	completewith	StormpikeO
A	abandon	1338
S	
T	completewith	next
A	goto	Loch Modan,34.757,48.618
A	vendor	
A	target	Yanni Stoutheart
S	
T	label	StormpikeO
A	goto	Loch Modan,35.534,48.404
A	vendor	6734
A	vendor	6734
A	target	Innkeeper Hearthstove
S	
A	line	Loch Modan,36.72,41.97,37.24,43.19,37.33,45.63,36.77,46.20,35.19,46.88,32.67,49.71,35.19,46.88,36.77,46.20,37.33,45.63,37.24,43.19,36.72,41.97
A	goto	Loch Modan,36.72,41.97,15,0
A	goto	Loch Modan,37.24,43.19,15,0
A	goto	Loch Modan,37.33,45.63,15,0
A	goto	Loch Modan,36.77,46.20,15,0
A	goto	Loch Modan,35.19,46.88,15,0
A	goto	Loch Modan,32.67,49.71,20,0
A	goto	Loch Modan,36.77,46.20
A	accept	416
A	accept	1339
A	target	Mountaineer Kadrell
S	
A	group	
T	completewith	BraveSoul
A	collect	3172,3,418,1
A	mob	+Mountain Boar
A	collect	3173,3,418,1
A	mob	+Elder Black Bear
A	collect	3174,3,418,1
A	mob	+Forest Lurker
S	
A	solo	
T	completewith	StormpikeStop
A	collect	3172,3,418,1
A	mob	+Mountain Boar
A	collect	3173,3,418,1
A	mob	+Elder Black Bear
A	collect	3174,3,418,1
A	mob	+Forest Lurker
S	
A	group	
T	completewith	MinerGear
A	complete	416,1
A	mob	Tunnel Rat Scout
A	mob	Tunnel Rat Vermin
A	mob	Tunnel Rat Forager
A	mob	Tunnel Rat Geomancer
A	mob	Tunnel Rat Digger
A	mob	Tunnel Rat Surveyor
S	
A	group	
T	label	BraveSoul
T	completewith	next
A	goto	Loch Modan,35.50,18.97,20
S	
A	group	
T	label	MinerGear
A	goto	Loch Modan,35.93,22.55
A	complete	307,1
S	
A	group	
T	completewith	StormpikeStop
A	collect	3172,3,418,1
A	mob	+Mountain Boar
A	collect	3173,3,418,1
A	mob	+Elder Black Bear
A	collect	3174,3,418,1
A	mob	+Forest Lurker
S	Paladin/Warrior
A	goto	Loch Modan,42.867,9.885
A	vendor	
A	target	Nillen Andemar
S	
A	goto	Loch Modan,25.05,30.19,0
A	goto	Loch Modan,26.06,43.44,0
A	goto	Loch Modan,37.71,16.84,0
A	goto	Loch Modan,37.71,16.84,50,0
A	goto	Loch Modan,35.48,16.82,50,0
A	goto	Loch Modan,25.05,30.19,50,0
A	goto	Loch Modan,26.06,43.44,50,0
A	goto	Loch Modan,37.71,16.84,50,0
A	goto	Loch Modan,35.48,16.82
A	complete	416,1
A	collect	2589,10,1644,1,1 << Paladin
A	mob	Tunnel Rat Scout
A	mob	Tunnel Rat Vermin
A	mob	Tunnel Rat Forager
A	mob	Tunnel Rat Geomancer
A	mob	Tunnel Rat Digger
A	mob	Tunnel Rat Surveyor
S	
T	completewith	StormpikeDelivery
T	label	StormpikeStop
A	goto	Loch Modan,24.134,18.208
A	vendor	
A	target	Gothor Brumn
S	
A	group	
A	goto	Loch Modan,24.77,18.40
A	turnin	307
A	target	Mountaineer Stormpike
S	
T	label	StormpikeDelivery
A	goto	Loch Modan,24.77,18.40
A	turnin	1339
A	accept	1338
A	target	Mountaineer Stormpike
S	
A	collect	3173,3,418,1
A	mob	+Elder Black Bear
A	goto	Loch Modan,26.9,10.7,90,0
A	goto	Loch Modan,30.9,10.6,90,0
A	goto	Loch Modan,28.6,15.4,90,0
A	goto	Loch Modan,30.5,26.6,90,0
A	goto	Loch Modan,33.4,30.3,90,0
A	goto	Loch Modan,39.4,33.3,90,0
A	goto	Loch Modan,26.9,10.7,90,0
A	goto	Loch Modan,30.9,10.6,90,0
A	goto	Loch Modan,28.6,15.4,90,0
A	goto	Loch Modan,30.5,26.6,90,0
A	goto	Loch Modan,33.4,30.3,90,0
A	goto	Loch Modan,39.4,33.3,90,0
A	goto	Loch Modan,26.9,10.7
A	collect	3172,3,418,1
A	mob	+Mountain Boar
A	goto	Loch Modan,38.0,34.9,90,0
A	goto	Loch Modan,37.1,39.8,90,0
A	goto	Loch Modan,29.8,35.9,90,0
A	goto	Loch Modan,27.7,25.3,90,0
A	goto	Loch Modan,28.6,22.6,90,0
A	goto	Loch Modan,38.0,34.9,90,0
A	goto	Loch Modan,37.1,39.8,90,0
A	goto	Loch Modan,29.8,35.9,90,0
A	goto	Loch Modan,27.7,25.3,90,0
A	goto	Loch Modan,28.6,22.6,90,0
A	goto	Loch Modan,38.0,34.9
A	collect	3174,3,418,1
A	mob	+Forest Lurker
A	goto	Loch Modan,31.9,16.4,90,0
A	goto	Loch Modan,28.0,20.6,90,0
A	goto	Loch Modan,33.8,40.5,90,0
A	goto	Loch Modan,36.2,30.9,90,0
A	goto	Loch Modan,39.0,32.1,90,0
A	goto	Loch Modan,31.9,16.4,90,0
A	goto	Loch Modan,28.0,20.6,90,0
A	goto	Loch Modan,33.8,40.5,90,0
A	goto	Loch Modan,36.2,30.9,90,0
A	goto	Loch Modan,39.0,32.1,90,0
A	goto	Loch Modan,31.9,16.4
S	
A	line	Loch Modan,36.72,41.97,37.24,43.19,37.33,45.63,36.77,46.20,35.19,46.88,32.67,49.71,35.19,46.88,36.77,46.20,37.33,45.63,37.24,43.19,36.72,41.97
A	goto	Loch Modan,36.72,41.97,15,0
A	goto	Loch Modan,37.24,43.19,15,0
A	goto	Loch Modan,37.33,45.63,15,0
A	goto	Loch Modan,36.77,46.20,15,0
A	goto	Loch Modan,35.19,46.88,15,0
A	goto	Loch Modan,32.67,49.71,20,0
A	goto	Loch Modan,36.77,46.20
A	target	Mountaineer Kadrell
A	turnin	416
S	
A	target	Vidra Hearthstove
A	goto	Loch Modan,34.828,49.283
A	turnin	418
S	
A	goto	Loch Modan,34.757,48.618
A	collect	4470,2
A	collect	4471,1
A	target	Yanni Stoutheart
S	
A	goto	Loch Modan,33.938,50.954
A	fp	Thelsamar
A	target	Thorgrum Borrelson
S	
A	goto	Loch Modan,22.071,73.127
A	target	Mountaineer Cobbleflint
A	accept	224
S	
A	goto	Loch Modan,23.233,73.675
A	target	Captain Rugelfuss
A	accept	267
S	
T	completewith	next
A	goto	Loch Modan,29.9,68.2,45,0
A	goto	Loch Modan,30.76,69.97,20
S	
A	goto	Loch Modan,27.01,48.74,0
A	goto	Loch Modan,27.68,56.83,0
A	goto	Loch Modan,33.35,71.59,0
A	goto	Loch Modan,31.54,74.96,0
A	goto	Loch Modan,33.35,71.59,50,0
A	goto	Loch Modan,31.54,74.96,45,0
A	goto	Loch Modan,33.88,76.58,45,0
A	goto	Loch Modan,27.01,48.74,40,0
A	goto	Loch Modan,27.68,56.83,40,0
A	goto	Loch Modan,33.35,71.59,50,0
A	goto	Loch Modan,31.54,74.96,45,0
A	goto	Loch Modan,33.88,76.58
A	complete	224,1
A	mob	+Stonesplinter Trogg
A	complete	224,2
A	mob	+Stonesplinter Scout
A	complete	267,1
A	mob	+Stonesplinter Trogg
A	mob	+Stonesplinter Scout
A	collect	2589,10,1644,1,1 << Paladin
A	mob	+Stonesplinter Trogg
A	mob	+Stonesplinter Scout
S	Warlock
T	completewith	TroggT
A	money	>0.7579
A	goto	Loch Modan,32.7,76.5,0
S	Warlock
T	era	
A	goto	Loch Modan,32.7,76.5,0
A	xp	13+9600
S	Warlock
T	som--xpgate	
A	xp	14-2520
S	
A	target	Mountaineer Cobbleflint
A	goto	Loch Modan,22.071,73.127
A	turnin	224
S	
T	label	TroggT
A	goto	Loch Modan,23.233,73.675
A	target	Captain Rugelfuss
A	turnin	267
S	Warlock
A	xp	14
S	
T	completewith	next
A	hs	
S	Warlock/Priest
A	goto	StormwindClassic,42.65,67.16,14,0
A	goto	StormwindClassic,42.88,65.11
A	collect	5208,1
A	target	Ardwyn Cailen
S	Warlock
T	completewith	next
A	goto	StormwindClassic,29.2,74.0,20,0
A	goto	StormwindClassic,27.2,78.1,15
S	Warlock
A	goto	StormwindClassic,26.117,77.225
A	trainer	
A	target	Ursula Deline
S	Warlock
A	goto	StormwindClassic,25.665,77.649
A	vendor	
A	target	Spackle Thornberry
S	Mage
T	completewith	next
A	goto	StormwindClassic,37.69,82.09,10
S	Mage
A	goto	StormwindClassic,36.87,81.14
A	trainer	
A	target	Elsharin
S	Priest/Paladin
T	completewith	next
A	goto	StormwindClassic,42.51,33.51,20
S	Human Paladin
A	goto	StormwindClassic,39.80,29.77
A	accept	1641
A	turnin	1641
A	target	Duthorian Rall
S	Human Paladin
A	goto	StormwindClassic,39.80,29.77
A	use	6775
A	accept	1642
S	Human Paladin
A	goto	StormwindClassic,39.80,29.77
A	turnin	1642
A	accept	1643
A	target	Duthorian Rall
S	Paladin
A	goto	StormwindClassic,38.82,31.27,10,0
A	goto	StormwindClassic,38.67,32.82
A	trainer	
A	target	Arthur the Faithful
S	Priest
A	goto	StormwindClassic,38.54,26.86
A	trainer	
A	target	Brother Joshua
S	
A	goto	StormwindClassic,58.091,16.552
A	target	Furen Longbeard
A	turnin	1338
S	Rogue
A	goto	StormwindClassic,74.65,52.83
A	trainer	
A	target	Osborne the Night Man
S	Warrior
A	goto	StormwindClassic,76.08,50.14,15,0
A	goto	StormwindClassic,80.22,45.37,15,0
A	goto	StormwindClassic,78.68,45.79
A	trainer	
A	target	Wu Shen
A	target	Ilsa Corbin
S	Human Paladin
A	goto	StormwindClassic,57.08,61.74
A	turnin	1643
A	target	Stephanie Turner
A	accept	1644
A	turnin	1644
S	
A	goto	StormwindClassic,66.28,62.13
A	turnin	6261
A	target	Dungar Longdrink
A	accept	6285
S	
T	ah	
A	goto	Stormwind City,53.612,59.764
A	collect	729,3,38,1
A	collect	730,3,38,1
A	collect	731,3,38,1
A	collect	732,3,38,1
A	collect	723,8,22,1
A	collect	814,5,103,1
A	target	Auctioneer Jaxon
S	
A	goto	StormwindClassic,66.277,62.137
A	fly	Westfall
A	target	Dungar Longdrink
E
G	Guides/SurvivalGuide/A-Classic-Alliance-1-14_DwarfGnome.lua
M	hardcore	
M	classic	
M	tbc	
M	era/som--h	
M	selector	Alliance
M	name	1-6 Coldridge Valley
M	version	1
M	group	RestedXP Survival Guide (A)
M	subgroup	RXP Survival Guide 1-20
M	defaultfor	Dwarf/Gnome
M	next	6-10 Dun Morogh
S	!Gnome !Dwarf
T	sticky	
T	completewith	next
A	goto	Dun Morogh,29.927,71.201
S	!Warlock
T	completewith	next
A	destroy	6948
S	
A	goto	Dun Morogh,29.927,71.201
A	accept	179
A	target	Sten Stoutarm
S	Warrior
A	goto	Dun Morogh,29.68,74.20,40,0
A	vendor	
A	target	+Grundel Harkin
A	goto	Dun Morogh,28.793,67.838
A	train	6673
A	target	+Thran Khorman
A	goto	Dun Morogh,28.832,67.242
A	mob	Ragged Young Wolf
A	mob	Ragged Timber Wolf
S	Warlock
T	completewith	next
A	goto	Dun Morogh,28.792,68.497,20
S	Warlock
A	goto	Dun Morogh,28.769,66.377
A	vendor	
A	target	Durnan Furcutter
S	Warlock
A	goto	Dun Morogh,28.650,66.145
A	train	348
A	accept	1599
A	target	Alamar Grimm
S	
A	goto	Dun Morogh,30.79,74.48,50,0
A	goto	Dun Morogh,29.02,76.38,50,0
A	goto	Dun Morogh,26.68,75.57
A	complete	179,1
A	mob	Ragged Young Wolf
A	mob	Ragged Timber Wolf
S	
A	xp	2
S	Warlock
A	goto	Dun Morogh,29.927,71.201
A	turnin	179
A	accept	3115
A	accept	233
A	target	Sten Stoutarm
S	Warlock
A	goto	Dun Morogh,29.709,71.255
A	accept	170
A	target	Balir Frosthammer
S	Warlock
A	goto	Dun Morogh,30.087,71.563
A	vendor	
A	collect	159,15
A	target	Adlin Pridedrift
S	Warlock
T	completewith	next
A	goto	Dun Morogh,27.28,81.09,20
S	Warlock
A	goto	Dun Morogh,29.0,82.6,50,0
A	goto	Dun Morogh,29.0,81.2,60,0
A	goto	Dun Morogh,30.1,82.4
A	complete	1599,1
A	mob	Frostmane Novice
S	Warlock
T	hardcore	
T	completewith	next
A	hs	
S	Warlock
A	goto	Dun Morogh,28.650,66.145
A	turnin	1599
A	turnin	3115
A	target	Alamar Grimm
S	Priest/Mage
A	goto	Dun Morogh,30.087,71.563
A	vendor	
A	collect	159,15
A	target	Adlin Pridedrift
S	Paladin/Warrior
T	completewith	next
A	goto	Dun Morogh,30.087,71.563
A	vendor	
A	target	Adlin Pridedrift
S	!Warlock
A	goto	Dun Morogh,29.927,71.201
A	turnin	179
A	accept	233
A	accept	3106
A	accept	3107
A	accept	3109
A	accept	3110
A	accept	3112
A	accept	3113
A	accept	3114
A	accept	3108
A	target	Sten Stoutarm
S	!Warlock
T	era	
A	goto	Dun Morogh,29.709,71.255
A	accept	170
A	target	Balir Frosthammer
S	
T	era	
T	completewith	Rockjaw
A	complete	170,1
A	mob	+Rockjaw Trogg
A	complete	170,2
A	mob	+Burly Rockjaw Trogg
S	
A	target	Talin Keeneye
A	goto	Dun Morogh,22.601,71.433
A	turnin	233
A	accept	183
A	accept	234
S	
A	goto	Dun Morogh,22.2,72.5,40,0
A	goto	Dun Morogh,20.5,71.4,40,0
A	goto	Dun Morogh,21.1,69.0,40,0
A	goto	Dun Morogh,22.8,69.6,40,0
A	goto	Dun Morogh,22.2,72.5,40,0
A	goto	Dun Morogh,20.5,71.4,40,0
A	goto	Dun Morogh,21.79,71.60
A	complete	183,1
A	mob	Small Crag Boar
S	
A	target	Talin Keeneye
A	goto	Dun Morogh,22.601,71.433
A	turnin	183
S	Paladin/Mage/Warlock/Hunter
T	era	
A	xp	3+1130
A	goto	Dun Morogh,23.0,75.0,50,0
A	goto	Dun Morogh,24.2,72.5,50,0
A	goto	Dun Morogh,27.7,76.3,50,0
A	goto	Dun Morogh,23.0,75.0,50,0
A	goto	Dun Morogh,24.2,72.5
S	
T	label	Rockjaw
A	target	Grelin Whitebeard
A	goto	Dun Morogh,25.076,75.713
A	turnin	234
A	accept	182
S	Paladin/Mage/Warlock/Hunter
A	xp	4
S	Paladin/Mage/Warlock/Hunter
T	era	
A	goto	Dun Morogh,31.37,75.63
A	complete	170,1
A	mob	+Rockjaw Trogg
A	complete	170,2
A	mob	+Burly Rockjaw Trogg
S	Paladin/Mage/Warlock/Hunter
A	target	Nori Pridedrift
A	goto	Dun Morogh,24.980,75.963
A	accept	3364
S	Paladin/Mage/Warlock/Hunter
T	completewith	next
A	goto	Dun Morogh,28.792,68.497,20
S	Paladin/Mage/Warlock/Hunter
A	goto	Dun Morogh,28.769,66.377
A	turnin	3364
A	accept	3365
A	target	Durnan Furcutter
S	Hunter
A	goto	Dun Morogh,29.175,67.455
A	target	Thorgas Grimson
A	turnin	3108
A	train	1978
S	Dwarf Paladin
A	target	Bromos Grummner
A	goto	Dun Morogh,28.833,68.332
A	turnin	3107
A	trainer	
S	Gnome Mage
A	target	Marryk Nurribit
A	goto	Dun Morogh,28.709,66.366
A	turnin	3114
A	trainer	
S	Warlock
A	target	Alamar Grimm
A	goto	Dun Morogh,28.650,66.145
A	trainer	
S	Paladin/Mage/Warlock/Hunter
T	era	
A	target	Balir Frosthammer
A	goto	Dun Morogh,29.709,71.255
A	turnin	170
S	Hunter
T	completewith	next
A	goto	Dun Morogh,30.087,71.563
A	vendor	
A	collect	2516,400
A	target	Adlin Pridedrift
S	Mage/Warlock
A	goto	Dun Morogh,30.087,71.563
A	vendor	
A	collect	159,10
A	target	Adlin Pridedrift
S	!Paladin !Mage !Warlock !Hunter
T	era	
T	completewith	next
A	complete	170,1
A	mob	+Rockjaw Trogg
A	complete	170,2
A	mob	+Burly Rockjaw Trogg
S	Paladin/Mage/Warlock/Hunter
A	goto	Dun Morogh,26.3,79.2,40,0
A	goto	Dun Morogh,22.7,79.3,40,0
A	goto	Dun Morogh,20.9,75.7,40,0
A	goto	Dun Morogh,22.7,79.3,40,0
A	goto	Dun Morogh,20.9,75.7
A	complete	182,1
A	mob	Frostmane Troll Whelp
S	!Paladin !Mage !Warlock !Hunter
A	goto	Dun Morogh,22.7,79.3,40,0
A	goto	Dun Morogh,20.9,75.7,40,0
A	goto	Dun Morogh,22.7,79.3,40,0
A	goto	Dun Morogh,20.9,75.7,40,0
A	goto	Dun Morogh,22.7,79.3,40,0
A	goto	Dun Morogh,20.9,75.7,40,0
A	goto	Dun Morogh,22.7,79.3
A	complete	182,1
A	mob	Frostmane Troll Whelp
S	!Paladin !Mage
T	label	TrollTroggs
A	goto	Dun Morogh,28.7,77.5
A	complete	170,1
A	mob	+Rockjaw Trogg
A	complete	170,2
A	mob	+Burly Rockjaw Trogg
S	!Paladin !Mage !Warlock !Hunter
A	xp	4
S	!Paladin !Mage !Warlock !Hunter
T	era	
T	requires	TrollTroggs
A	target	Grelin Whitebeard
A	goto	Dun Morogh,25.076,75.713
A	turnin	182
A	accept	218
S	!Paladin !Mage !Warlock !Hunter
T	som	
A	target	Grelin Whitebeard
A	goto	Dun Morogh,25.076,75.713
A	turnin	182
A	accept	218
S	Paladin/Mage/Warlock/Hunter
A	target	Grelin Whitebeard
A	goto	Dun Morogh,25.076,75.713
A	turnin	182
A	accept	218
S	Paladin/Mage/Warlock/Hunter
A	target	Nori Pridedrift
A	goto	Dun Morogh,24.980,75.963
A	turnin	3365
S	
T	completewith	next
A	goto	Dun Morogh,27.28,81.09,20
S	
A	goto	Dun Morogh,26.8,79.9,30,0
A	goto	Dun Morogh,29.0,79.0,15,0
A	goto	Dun Morogh,30.6,80.3
A	complete	218,1
A	mob	Grik'nir the Cold
S	!Paladin !Mage !Warlock !Hunter
A	target	Nori Pridedrift
A	goto	Dun Morogh,24.980,75.963
A	accept	3364
S	!Paladin !Mage !Warlock !Hunter
A	target	Grelin Whitebeard
A	goto	Dun Morogh,25.075,75.715
A	turnin	218
A	accept	282
S	!Paladin !Mage !Warlock !Hunter
T	completewith	next
A	goto	Dun Morogh,28.792,68.497,20
S	!Paladin !Mage !Warlock !Hunter
A	goto	Dun Morogh,28.769,66.377
A	turnin	3364
A	accept	3365
A	target	Durnan Furcutter
S	Rogue
A	target	Solm Hargrin
A	goto	Dun Morogh,28.4,67.5
A	turnin	3113
A	turnin	3109
S	Dwarf Priest
A	target	Branstock Khalder
A	goto	Dun Morogh,28.600,66.385
A	turnin	3110
A	trainer	
S	Warrior
A	target	Thran Khorman
A	goto	Dun Morogh,28.832,67.242
A	turnin	3106
A	turnin	3112
A	trainer	
S	!Paladin !Mage !Warlock !Hunter
T	era	
A	target	Balir Frosthammer
A	goto	Dun Morogh,29.709,71.255
A	turnin	170
S	Priest
A	money	<0.0025
A	goto	Dun Morogh,30.087,71.563
A	vendor	
A	collect	159,10
A	target	Adlin Pridedrift
S	Paladin/Mage/Warlock/Hunter
A	target	Grelin Whitebeard
A	goto	Dun Morogh,25.075,75.715
A	turnin	218
A	accept	282
S	!Paladin !Mage !Warlock
A	target	Nori Pridedrift
A	goto	Dun Morogh,24.980,75.963
A	turnin	3365
S	
A	target	Mountaineer Thalos
A	goto	Dun Morogh,33.484,71.841
A	turnin	282
A	accept	420
S	
A	target	Hands Springsprocket
A	goto	Dun Morogh,33.847,72.236
A	accept	2160
S	
A	goto	Dun Morogh,34.32,70.95,15,0
A	goto	Dun Morogh,35.65,65.79,15
E
G	Guides/SurvivalGuide/A-Classic-Alliance-1-14_DwarfGnome.lua
M	hardcore	
M	era/som--h	
M	classic	
M	tbc	
M	selector	Alliance
M	name	6-10 Dun Morogh
M	version	1
M	group	RestedXP Survival Guide (A)
M	subgroup	RXP Survival Guide 1-20
M	defaultfor	Dwarf/Gnome
M	next	10-11 Elwynn (Dwarf/Gnome)
S	
T	completewith	BoarMeat44 << !Paladin !Warrior !Rogue
T	completewith	BearFur << Paladin/Warrior/Rogue
A	collect	769,4,317,1
A	mob	Crag Boar
A	mob	Large Crag Boar
S	
T	completewith	BoarMeat44 << !Paladin !Warrior !Rogue
T	completewith	BearFur << Paladin/Warrior/Rogue
A	collect	2886,6,384,1
A	mob	Crag Boar
A	mob	Large Crag Boar
S	
A	goto	Dun Morogh,36.4,62.9,45,0
A	goto	Dun Morogh,37.7,60.5,45,0
A	goto	Dun Morogh,46.726,53.826
A	xp	5+2145
A	xp	5+2415
A	mob	Crag Boar
A	mob	Large Crag Boar
S	
T	completewith	next
A	goto	Dun Morogh,46.726,53.826,30
A	mob	Crag Boar
A	mob	Large Crag Boar
S	
A	goto	Dun Morogh,46.726,53.826
A	turnin	420
A	target	Senir Whitebeard
S	Warlock
A	goto	Dun Morogh,47.329,53.693
A	trainer	
A	target	Gimrizz Shadowcog
S	Warlock
A	goto	Dun Morogh,47.273,53.684
A	vendor	
A	target	Dannie Fizzwizzle
S	!Priest
A	goto	Dun Morogh,48.3,57.0
A	xp	6
S	Hunter
A	goto	Dun Morogh,45.810,53.039
A	trainer	
A	train	3044
A	target	Grif Wildheart
S	
A	target	Ragnar Thunderbrew
A	goto	Dun Morogh,46.825,52.361
A	accept	384
S	
A	target	Tannok Frosthammer
A	goto	Dun Morogh,47.217,52.195
A	turnin	2160
S	Rogue
A	goto	Dun Morogh,47.189,52.403
A	vendor	
A	target	Kreg Bilmn
S	Rogue
A	target	Hogral Bakkan
A	goto	Dun Morogh,47.563,52.608
A	trainer	
S	Mage
A	target	Magis Sparkmantle
A	goto	Dun Morogh,47.498,52.076
A	trainer	
S	Paladin
A	target	Azar Stronghammer
A	goto	Dun Morogh,47.597,52.070
A	trainer	
S	Priest
A	target	Maxan Anvol
A	goto	Dun Morogh,47.342,52.190
A	accept	5625
S	Priest
A	target	Mountaineer Dolf
A	goto	Dun Morogh,45.805,54.568
A	complete	5625,1
S	Priest
A	target	Maxan Anvol
A	goto	Dun Morogh,47.342,52.190
A	turnin	5625
A	trainer	
S	Priest
A	xp	6
S	Priest/Mage/Warlock
A	target	Innkeeper Belm
A	goto	Dun Morogh,47.377,52.523
A	home	
A	vendor	
S	!Mage !Priest !Warlock
A	target	Innkeeper Belm
A	goto	Dun Morogh,47.377,52.523
A	home	
S	Warrior
A	target	Granis Swiftaxe
A	goto	Dun Morogh,47.360,52.646
A	trainer	
S	Paladin/Warrior
T	completewith	next
A	goto	Dun Morogh,45.8,51.8,20
S	Gnome Warrior
A	target	Grawn Thromwyn
A	money	<0.0536
A	goto	Dun Morogh,45.290,52.190
A	collect	2488,1
S	Dwarf Warrior
A	target	Grawn Thromwyn
A	money	<0.0460
A	goto	Dun Morogh,45.290,52.190
A	collect	2491,1
S	Rogue
A	target	Grawn Thromwyn
A	money	<0.0400
A	goto	Dun Morogh,45.290,52.190
A	collect	2494,1
S	Paladin
A	target	Grawn Thromwyn
A	money	<0.0631
A	goto	Dun Morogh,45.290,52.190
A	collect	2493,1
S	Warrior/Rogue/Paladin
A	target	Tognus Flintfire
A	goto	Dun Morogh,45.3,51.9
A	trainer	
S	
A	target	Tharek Blackstone
A	goto	Dun Morogh,46.021,51.676
A	accept	400
S	
A	goto	Dun Morogh,49.426,48.410
A	target	Pilot Bellowfiz
A	accept	317
S	
A	target	Pilot Stonegear
A	goto	Dun Morogh,49.622,48.612
A	accept	313
S	
A	target	Beldin Steelgrill
A	goto	Dun Morogh,50.443,49.092
A	turnin	400
S	
T	label	BoarMeat44
A	target	Loslor Rudge
A	goto	Dun Morogh,50.084,49.420
A	accept	5541
S	Warrior/Paladin/Rogue
T	completewith	next
A	money	<0.0091
A	goto	Dun Morogh,50.084,49.420
A	collect	2901,1
A	target	Loslor Rudge
S	Warrior/Paladin/Rogue
A	goto	Dun Morogh,50.01,50.31
A	trainer	
A	target	Yarr Hammerstone
S	Warrior/Paladin/Rogue
A	cast	2580
S	Paladin/Warrior/Rogue
T	completewith	BearFur
A	complete	317,2
A	mob	Young Black Bear
S	!Paladin !Warrior !Rogue
A	goto	Dun Morogh,52.0,50.1,75,0
A	goto	Dun Morogh,51.5,53.9,75,0
A	goto	Dun Morogh,50.1,53.9,75,0
A	goto	Dun Morogh,49.9,50.9,75,0
A	goto	Dun Morogh,48.0,49.5,75,0
A	goto	Dun Morogh,48.2,46.9,75,0
A	goto	Dun Morogh,43.5,52.5,75,0
A	goto	Dun Morogh,52.0,50.1,75,0
A	goto	Dun Morogh,51.5,53.9,75,0
A	goto	Dun Morogh,50.1,53.9,75,0
A	goto	Dun Morogh,49.9,50.9,75,0
A	goto	Dun Morogh,48.0,49.5,75,0
A	goto	Dun Morogh,48.2,46.9,75,0
A	goto	Dun Morogh,43.5,52.5,75,0
A	goto	Dun Morogh,52.0,50.1,75,0
A	goto	Dun Morogh,51.5,53.9,75,0
A	goto	Dun Morogh,50.1,53.9,75,0
A	goto	Dun Morogh,49.9,50.9,75,0
A	goto	Dun Morogh,48.0,49.5,75,0
A	goto	Dun Morogh,48.2,46.9,75,0
A	goto	Dun Morogh,43.5,52.5,75,0
A	goto	Dun Morogh,52.0,50.1,0
A	goto	Dun Morogh,51.5,53.9,0
A	goto	Dun Morogh,50.1,53.9,0
A	goto	Dun Morogh,49.9,50.9,0
A	goto	Dun Morogh,48.0,49.5,0
A	goto	Dun Morogh,48.2,46.9,0
A	goto	Dun Morogh,43.5,52.5
A	complete	317,2
A	mob	+Young Black Bear
A	complete	317,1
A	mob	+Crag Boar
A	mob	+Large Crag Boar
A	collect	2886,6,384,1,1
A	mob	+Crag Boar
A	mob	+Large Crag Boar
S	!Paladin !Warrior !Rogue
T	completewith	Ribs
A	collect	2886,6,384,1
A	mob	Crag Boar
A	mob	Large Crag Boar
S	!Paladin !Warrior !Rogue
A	target	Pilot Bellowfiz
A	goto	Dun Morogh,49.426,48.410
A	turnin	317
A	accept	318
S	Warrior
T	completewith	next
A	goto	Dun Morogh,46.9,52.1,20,0
A	goto	Dun Morogh,47.377,52.523
A	vendor	
A	target	Innkeeper Belm
S	Priest/Mage/Warlock
T	completewith	next
A	goto	Dun Morogh,46.9,52.1,20,0
A	goto	Dun Morogh,47.377,52.523
A	vendor	
A	target	Innkeeper Belm
S	
T	completewith	next
A	goto	Dun Morogh,42.38,55.28,40
S	
A	goto	Dun Morogh,42.25,53.68,40,0
A	goto	Dun Morogh,41.07,49.04,50,0
A	goto	Dun Morogh,42.25,53.68
A	complete	313,1
A	mob	Wendigo
A	mob	Young Wendigo
S	
A	goto	Dun Morogh,44.13,56.95
A	complete	5541,1
S	
T	label	BearFur
A	target	Hegnar Rumbleshot
A	goto	Dun Morogh,40.6,62.6,50,0
A	goto	Dun Morogh,40.682,65.130
A	turnin	5541
S	Hunter
A	goto	Dun Morogh,40.682,65.130
A	collect	2509,1
A	money	<0.0414
A	target	Hegnar Rumbleshot
S	!Paladin !Warrior !Rogue
A	xp	7
S	Paladin/Warrior/Rogue
A	goto	Dun Morogh,51.4,50.4
A	complete	317,2
A	mob	+Young Black Bear
A	complete	317,1
A	mob	+Crag Boar
A	mob	+Large Crag Boar
A	collect	2886,6,384,1,1
A	mob	+Crag Boar
A	mob	+Large Crag Boar
S	Paladin/Warrior/Rogue
T	completewith	Ribs
A	collect	2886,6,384,1
A	mob	Crag Boar
A	mob	Large Crag Boar
S	Warrior/Paladin/Rogue
A	target	Pilot Bellowfiz
A	goto	Dun Morogh,49.426,48.410
A	turnin	317
A	accept	318
S	Warrior/Paladin/Rogue
A	target	Pilot Stonegear
A	goto	Dun Morogh,49.622,48.612
A	turnin	313
S	Warrior/Paladin/Rogue
A	goto	Dun Morogh,50.084,49.420
A	collect	2901,1
S	Warrior/Paladin/Rogue
T	era	
A	xp	7
S	Warrior/Rogue
T	som	
A	xp	8
S	Rogue
A	xp	<8,1
A	target	Hogral Bakkan
A	goto	Dun Morogh,47.563,52.608
A	trainer	
S	Paladin
A	xp	<8,1
A	target	Azar Stronghammer
A	goto	Dun Morogh,47.597,52.070
A	trainer	
S	Warrior
A	xp	<8,1
A	target	Granis Swiftaxe
A	goto	Dun Morogh,47.360,52.646
A	trainer	
S	Gnome Warrior
A	target	Grawn Thromwyn
A	money	<0.0536
A	goto	Dun Morogh,45.290,52.190
A	collect	2488,1
S	Dwarf Warrior
A	target	Grawn Thromwyn
A	money	<0.0460
A	goto	Dun Morogh,45.290,52.190
A	collect	2491,1
S	Rogue
A	target	Grawn Thromwyn
A	money	<0.0400
A	goto	Dun Morogh,45.290,52.190
A	collect	2494,1
S	Paladin
A	target	Grawn Thromwyn
A	money	<0.0631
A	goto	Dun Morogh,45.290,52.190
A	collect	2493,1
S	Warrior/Rogue/Paladin
T	completewith	next
A	goto	Dun Morogh,47.377,52.523
A	vendor	
A	vendor	
A	target	Innkeeper Belm
S	Paladin/Warrior/Rogue
T	completewith	next
A	goto	Dun Morogh,43.0,47.4,60,0
A	goto	Dun Morogh,39.6,48.9,60,0
A	goto	Dun Morogh,37.9,50.8,60,0
A	goto	Dun Morogh,34.577,51.652,40
S	Paladin/Warrior/Rogue
A	target	Tundra MacGrann
A	goto	Dun Morogh,43.0,47.4,60,0
A	goto	Dun Morogh,39.6,48.9,60,0
A	goto	Dun Morogh,34.577,51.652
A	accept	312
S	!Paladin !Warrior !Rogue
T	completewith	next
A	goto	Dun Morogh,35.2,56.4,60,0
A	goto	Dun Morogh,36.0,52.0,60,0
A	goto	Dun Morogh,34.577,51.652,40
S	!Paladin !Warrior !Rogue
A	target	Tundra MacGrann
A	goto	Dun Morogh,35.2,56.4,100,0
A	goto	Dun Morogh,36.0,52.0,100,0
A	goto	Dun Morogh,34.577,51.652
A	accept	312
S	
T	completewith	next
A	goto	Dun Morogh,30.5,46.0,50
S	!Mage !Priest
T	completewith	next
A	goto	Dun Morogh,30.453,46.005
A	vendor	
A	target	Keeg Gibn
S	Priest/Mage/Warlock
T	completewith	next
A	goto	Dun Morogh,30.453,46.005
A	vendor	
A	target	Keeg Gibn
S	
A	target	Rejold Barleybrew
A	goto	Dun Morogh,30.190,45.726
A	turnin	318
A	accept	319
A	accept	315
S	
A	target	Marleth Barleybrew
A	goto	Dun Morogh,30.186,45.531
A	accept	310
S	
T	label	Ribs
A	goto	Dun Morogh,31.5,38.9,60,0
A	goto	Dun Morogh,28.3,39.9,60,0
A	goto	Dun Morogh,28.7,43.7,60,0
A	goto	Dun Morogh,25.8,47.2,60,0
A	goto	Dun Morogh,25.8,47.2,60,0
A	goto	Dun Morogh,30.0,51.8,60,0
A	goto	Dun Morogh,31.5,38.9,60,0
A	goto	Dun Morogh,28.3,39.9,60,0
A	goto	Dun Morogh,28.7,43.7,60,0
A	goto	Dun Morogh,25.8,47.2,60,0
A	goto	Dun Morogh,25.8,47.2,60,0
A	goto	Dun Morogh,30.0,51.8,60,0
A	goto	Dun Morogh,28.7,43.7
A	complete	319,1
A	mob	+Ice Claw Bear
A	complete	319,2
A	mob	+Elder Crag Boar
A	complete	319,3
A	mob	+Snow Leopard
S	
A	goto	Dun Morogh,31.5,38.9,60,0
A	goto	Dun Morogh,28.3,39.9,60,0
A	goto	Dun Morogh,28.7,43.7,60,0
A	goto	Dun Morogh,25.8,47.2,60,0
A	goto	Dun Morogh,25.8,47.2,60,0
A	goto	Dun Morogh,30.0,51.8,60,0
A	goto	Dun Morogh,31.5,38.9,60,0
A	goto	Dun Morogh,28.3,39.9,60,0
A	goto	Dun Morogh,28.7,43.7,60,0
A	goto	Dun Morogh,25.8,47.2,60,0
A	goto	Dun Morogh,25.8,47.2,60,0
A	goto	Dun Morogh,30.0,51.8,60,0
A	goto	Dun Morogh,28.7,43.7
A	complete	384,1
A	mob	Elder Crag Boar
S	
A	target	Rejold Barleybrew
A	goto	Dun Morogh,30.189,45.725
A	turnin	319
A	accept	320
S	
A	isQuestTurnedIn	384
A	xp	7+4360
A	goto	Dun Morogh,31.5,38.9,60,0
A	goto	Dun Morogh,28.3,39.9,60,0
A	goto	Dun Morogh,28.7,43.7,60,0
A	goto	Dun Morogh,25.8,47.2,60,0
A	goto	Dun Morogh,25.8,47.2,60,0
A	goto	Dun Morogh,30.0,51.8,60,0
A	goto	Dun Morogh,31.5,38.9,60,0
A	goto	Dun Morogh,28.3,39.9,60,0
A	goto	Dun Morogh,28.7,43.7,60,0
A	goto	Dun Morogh,25.8,47.2,60,0
A	goto	Dun Morogh,25.8,47.2,60,0
A	goto	Dun Morogh,30.0,51.8
S	
A	xp	7+3735
A	goto	Dun Morogh,31.5,38.9,60,0
A	goto	Dun Morogh,28.3,39.9,60,0
A	goto	Dun Morogh,28.7,43.7,60,0
A	goto	Dun Morogh,25.8,47.2,60,0
A	goto	Dun Morogh,25.8,47.2,60,0
A	goto	Dun Morogh,30.0,51.8,60,0
A	goto	Dun Morogh,31.5,38.9,60,0
A	goto	Dun Morogh,28.3,39.9,60,0
A	goto	Dun Morogh,28.7,43.7,60,0
A	goto	Dun Morogh,25.8,47.2,60,0
A	goto	Dun Morogh,25.8,47.2,60,0
A	goto	Dun Morogh,30.0,51.8
S	
T	softcore	
A	goto	Dun Morogh,30.3,37.5,60
S	
T	softcore	
A	goto	Dun Morogh,30.9,33.1,15
S	
T	softcore	
A	goto	Dun Morogh,32.4,29.1,15
S	
T	softcore	
A	goto	Dun Morogh,33.0,27.2,15,0
A	goto	Dun Morogh,33.0,25.2,15,0
A	goto	Wetlands,11.6,43.4,60,0
A	goto	Wetlands,11.6,43.4,0
A	deathskip	
S	
T	softcore	
T	completewith	next
A	goto	Wetlands,12.7,46.7,30
S	
T	softcore	
A	goto	Wetlands,9.5,59.7
A	fp	Wetlands
S	
T	completewith	next
A	hs	
S	
A	goto	Dun Morogh,47.377,52.523
A	complete	384,2
A	collect	2686,1,311
A	target	Innkeeper Belm
S	
T	completewith	next
A	goto	Dun Morogh,47.779,52.426,6,0
A	goto	Dun Morogh,47.644,52.655,3,0
A	turnin	308
A	target	Jarven Thunderbrew
S	
A	goto	Dun Morogh,47.716,52.696
A	turnin	310
A	accept	311
S	
A	target	Ragnar Thunderbrew
A	goto	Dun Morogh,46.825,52.361
A	turnin	384
S	!Paladin !Rogue !Warrior
A	xp	8
S	Hunter
A	goto	Dun Morogh,45.810,53.039
A	trainer	
A	train	5116
A	target	Grif Wildheart
S	Warlock
A	goto	Dun Morogh,47.327,53.693
A	target	Gimrizz Shadowcog
A	trainer	
A	train	5782
S	Warlock
A	goto	Dun Morogh,47.273,53.658
A	vendor	
A	target	Gimrizz Shadowcog
S	Rogue
A	xp	<8,1
A	target	Hogral Bakkan
A	goto	Dun Morogh,47.563,52.608
A	trainer	
S	Paladin
A	xp	<8,1
A	target	Azar Stronghammer
A	goto	Dun Morogh,47.597,52.070
A	trainer	
S	Warrior
A	xp	<8,1
A	target	Granis Swiftaxe
A	goto	Dun Morogh,47.360,52.646
A	trainer	
S	Mage
A	xp	<8,1
A	target	Magis Sparkmantle
A	goto	Dun Morogh,47.498,52.076
A	trainer	
A	train	118
S	Priest
A	xp	<8,1
A	target	Maxan Anvol
A	goto	Dun Morogh,47.342,52.190
A	trainer	
S	
A	goto	Dun Morogh,47.180,52.610
A	train	3273
A	target	Thamner Pol
S	Gnome Warrior
A	target	Grawn Thromwyn
A	money	<0.0536
A	goto	Dun Morogh,45.290,52.190
A	collect	2488,1
S	Dwarf Warrior
A	target	Grawn Thromwyn
A	money	<0.0460
A	goto	Dun Morogh,45.290,52.190
A	collect	2491,1
S	Rogue
A	target	Grawn Thromwyn
A	money	<0.0400
A	goto	Dun Morogh,45.290,52.190
A	collect	2494,1
S	Paladin
A	target	Grawn Thromwyn
A	money	<0.0631
A	goto	Dun Morogh,45.290,52.190
A	collect	2493,1
S	Warrior/Rogue/Paladin
A	goto	Dun Morogh,47.377,52.523
A	vendor	
A	vendor	
A	target	Innkeeper Belm
S	Priest/Mage/Warlock
A	target	Innkeeper Belm
A	goto	Dun Morogh,47.377,52.523
A	vendor	
S	
A	target	Senir Whitebeard
A	goto	Dun Morogh,46.726,53.826
A	accept	287
S	
A	target	Pilot Stonegear
A	goto	Dun Morogh,49.622,48.612
A	turnin	313
S	
A	target	Pilot Bellowfiz
A	goto	Dun Morogh,49.426,48.410
A	turnin	320
S	
T	era	<< Warlock
A	target	Razzle Sprysprocket
A	goto	Dun Morogh,46.005,48.637,10,0
A	goto	Dun Morogh,45.846,49.365
A	accept	412
S	
T	completewith	next
A	goto	Dun Morogh,43.1,45.0,20,0
A	goto	Dun Morogh,42.1,45.4,20
S	
A	goto	Dun Morogh,40.9,45.3,50,0
A	goto	Dun Morogh,41.5,43.6,50,0
A	goto	Dun Morogh,39.7,40.0,50,0
A	goto	Dun Morogh,42.1,34.3,50,0
A	goto	Dun Morogh,39.7,40.0,50,0
A	goto	Dun Morogh,41.5,43.6,50,0
A	goto	Dun Morogh,40.9,45.3
A	goto	Dun Morogh,39.5,43.0,0
A	goto	Dun Morogh,41.5,36.0,0
A	complete	315,1
A	mob	Frostmane Seer
S	!Mage !Warlock
A	goto	Dun Morogh,38.517,53.927
A	link	https://www.youtube.com/watch?v=o55Y3LjgKoE
A	complete	312,1
S	Mage/Warlock
A	goto	Dun Morogh,38.517,53.927
A	complete	312,1
S	
A	target	Tundra MacGrann
A	goto	Dun Morogh,34.577,51.652
A	turnin	312
S	Mage/Priest/Warlock
T	completewith	next
A	goto	Dun Morogh,30.453,46.005
A	vendor	
A	target	Keeg Gibn
S	Warrior/Paladin/Rogue
T	completewith	next
A	goto	Dun Morogh,30.453,46.005
A	vendor	
A	target	Keeg Gibn
S	
A	target	Rejold Barleybrew
A	goto	Dun Morogh,30.189,45.725
A	turnin	315
A	accept	413
S	
A	target	Marleth Barleybrew
A	goto	Dun Morogh,30.186,45.531
A	turnin	311
S	
T	era	<< Warlock
A	goto	Dun Morogh,27.2,43.0,60,0
A	goto	Dun Morogh,24.8,39.3,60,0
A	goto	Dun Morogh,25.6,43.4,60,0
A	goto	Dun Morogh,24.3,44.0,60,0
A	goto	Dun Morogh,25.4,45.4,60,0
A	goto	Dun Morogh,25.00,43.50
A	complete	412,2
A	complete	412,1
A	mob	Leper Gnome
S	
T	era	
A	xp	9
S	
T	completewith	next
A	goto	Dun Morogh,24.509,50.831,20
S	
T	completewith	next
A	complete	287,1
A	mob	Frostmane Headhunter
S	
T	hardcore	
A	goto	Dun Morogh,22.86,52.16
A	complete	287,2
S	Hunter
T	completewith	next
A	xp	10-2325
S	
A	goto	Dun Morogh,24.5,50.8,40,0
A	goto	Dun Morogh,22.1,50.3,40,0
A	goto	Dun Morogh,21.3,52.9,40,0
A	goto	Dun Morogh,24.5,50.8,0
A	goto	Dun Morogh,22.1,50.3,0
A	goto	Dun Morogh,21.3,52.9,0
A	complete	287,1
A	mob	Frostmane Headhunter
S	Hunter
A	xp	10-1400
S	
T	hardcore	
T	completewith	next
A	hs	
A	cooldown	item,6948,>0,1
S	
T	hardcore	
T	completewith	next
A	goto	Dun Morogh,46.726,53.826,150
S	Hunter
A	goto	Dun Morogh,46.005,48.637,8,0
A	goto	Dun Morogh,45.846,49.365
A	target	Razzle Sprysprocket
A	turnin	412
S	
A	target	Senir Whitebeard
A	goto	Dun Morogh,46.726,53.826
A	turnin	287
A	accept	291
S	Rogue
T	level	10
A	target	Hogral Bakkan
A	goto	Dun Morogh,47.563,52.608
A	accept	2218
S	
A	goto	Dun Morogh,47.180,52.610
A	train	3273
A	target	Thamner Pol
S	!Hunter
A	goto	Dun Morogh,46.005,48.637,8,0
A	goto	Dun Morogh,45.846,49.365
A	target	Razzle Sprysprocket
A	turnin	412
S	Hunter
A	goto	Dun Morogh,45.810,53.039
A	target	Grif Wildheart
A	accept	6064
S	Hunter
A	goto	Dun Morogh,48.3,56.9
A	complete	6064,1
A	mob	Large Crag Boar
S	Hunter
A	goto	Dun Morogh,45.810,53.039
A	turnin	6064
A	target	Grif Wildheart
A	accept	6084
S	Hunter
A	goto	Dun Morogh,49.4,59.4
A	complete	6084,1
A	mob	Snow Leopard
S	Hunter
A	goto	Dun Morogh,45.810,53.039
A	turnin	6084
A	target	Grif Wildheart
A	accept	6085
S	Hunter
A	goto	Dun Morogh,50.4,59.7
A	complete	6085,1
A	mob	Ice Claw Bear
S	Hunter
A	goto	Dun Morogh,45.810,53.039
A	turnin	6085
A	target	Grif Wildheart
A	accept	6086
S	Warrior
T	sticky	
T	completewith	next
A	money	>0.1030
S	Warrior/Hunter
A	goto	Dun Morogh,47.58,41.58,40,0
A	goto	Dun Morogh,50.19,40.79,20,0
A	goto	Ironforge,14.90,87.10,40
S	Hunter
A	goto	Ironforge,70.86,85.83
A	target	Belia Thundergranite
A	turnin	6086
S	Warrior
A	goto	Ironforge,62.237,89.628
A	trainer	
A	target	Bixi Wobblebonk
S	Warrior
A	goto	Ironforge,62.375,88.679
A	target	Brenwyn Wintersteel
S	Warrior/Hunter
T	completewith	next
A	goto	Dun Morogh,53.5,34.9,60,0
A	goto	Dun Morogh,52.90,35.62
A	zone	Dun Morogh
S	
A	target	Rudra Amberstill
A	goto	Dun Morogh,60.1,52.6,50,0
A	goto	Dun Morogh,63.082,49.851
A	accept	314
S	
T	completewith	next
A	goto	Dun Morogh,62.3,50.3,14,0
A	goto	Dun Morogh,62.2,49.4,10
S	
A	goto	Dun Morogh,62.6,46.1
A	link	https://www.youtube.com/watch?v=ZJX6sCkm5JY
A	complete	314,1
A	mob	Vagash
S	
A	target	Rudra Amberstill
A	goto	Dun Morogh,63.082,49.851
A	turnin	314
S	
T	completewith	next
A	goto	Dun Morogh,68.5,54.6,60
S	
A	goto	Dun Morogh,68.379,54.492
A	train	2550
A	target	Cook Ghilm
S	
A	goto	Dun Morogh,68.6,54.7
A	vendor	
A	vendor	
A	target	Kazan Mogosh
S	
A	accept	433
A	target	+Senator Mehr Stonehallow
A	goto	Dun Morogh,68.671,55.969
A	accept	432
A	goto	Dun Morogh,69.084,56.330
A	target	+Foreman Stonebrow
S	
A	goto	Dun Morogh,70.7,56.4,40,0
A	goto	Dun Morogh,70.62,52.39,25,0
A	goto	Dun Morogh,70.7,56.4
A	complete	432,1
A	mob	+Rockjaw Skullthumper
A	complete	433,1
A	mob	+Rockjaw Bonesnapper
S	
A	turnin	432
A	target	+Foreman Stonebrow
A	goto	Dun Morogh,69.084,56.330
A	turnin	433
A	goto	Dun Morogh,68.671,55.969
A	target	+Senator Mehr Stonehallow
S	
T	era	
A	goto	Dun Morogh,67.1,59.7
A	xp	10
S	
A	target	Pilot Hammerfoot
A	goto	Dun Morogh,83.892,39.188
A	accept	419
S	
A	goto	Dun Morogh,79.672,36.171
A	turnin	419
A	accept	417
S	
A	goto	Dun Morogh,78.97,37.14
A	complete	417,1
A	mob	Mangeclaw
S	
A	target	Pilot Hammerfoot
A	goto	Dun Morogh,83.892,39.188
A	turnin	417
S	
A	target	Mountaineer Barleybrew
A	goto	Dun Morogh,79.6,50.7,50,0
A	goto	Dun Morogh,82.3,53.5,25,0
A	goto	Dun Morogh,86.278,48.812
A	turnin	413
A	accept	414
S	
T	completewith	next
A	goto	Dun Morogh,86.203,51.260,15,0
A	goto	Loch Modan,22.071,73.127,200
S	
A	target	Mountaineer Cobbleflint
A	goto	Loch Modan,22.071,73.127
A	accept	224
S	
A	goto	Loch Modan,23.233,73.675
A	target	Captain Rugelfuss
A	accept	267
S	
T	completewith	HonorStudents
A	line	Loch Modan,36.72,41.97,37.24,43.19,37.33,45.63,36.77,46.20,35.19,46.88,32.67,49.71,35.19,46.88,36.77,46.20,37.33,45.63,37.24,43.19,36.72,41.97
A	turnin	414
A	accept	416
A	accept	1339
A	target	Mountaineer Kadrell
S	
A	target	Vidra Hearthstove
A	goto	Loch Modan,34.828,49.283
A	accept	418
S	
T	completewith	next
A	goto	Loch Modan,34.757,48.618
A	vendor	
A	target	Yanni Stoutheart
S	!Paladin
A	goto	Loch Modan,35.534,48.404
A	home	
A	target	Innkeeper Hearthstove
S	
T	label	HonorStudents
A	goto	Loch Modan,37.17,47.94,8,0
A	goto	Loch Modan,37.019,47.806
A	accept	6387
A	target	Brock Stoneseeker
S	
A	line	Loch Modan,36.72,41.97,37.24,43.19,37.33,45.63,36.77,46.20,35.19,46.88,32.67,49.71,35.19,46.88,36.77,46.20,37.33,45.63,37.24,43.19,36.72,41.97
A	goto	Loch Modan,36.72,41.97,15,0
A	goto	Loch Modan,37.24,43.19,15,0
A	goto	Loch Modan,37.33,45.63,15,0
A	goto	Loch Modan,36.77,46.20,15,0
A	goto	Loch Modan,35.19,46.88,15,0
A	goto	Loch Modan,32.67,49.71,20,0
A	goto	Loch Modan,36.77,46.20
A	turnin	414
A	accept	416
A	accept	1339
A	target	Mountaineer Kadrell
S	skip
T	sticky	
T	completewith	next
S	
T	completewith	Thelsamar1
A	collect	3172,3,418,1
A	mob	+Mountain Boar
A	collect	3173,3,418,1
A	mob	+Elder Black Bear
A	collect	3174,3,418,1
A	mob	+Forest Lurker
S	
T	completewith	next
A	goto	Loch Modan,23.85,17.92,100
S	
A	group	
A	goto	Loch Modan,24.764,18.397
A	turnin	1339
A	accept	1338
A	accept	307
A	target	Mountaineer Stormpike
S	
A	solo	
A	goto	Loch Modan,24.764,18.397
A	turnin	1339
A	accept	1338
A	target	Mountaineer Stormpike
S	
T	softcore	
T	completewith	next
A	deathskip	
S	
A	isQuestComplete	418
A	target	Vidra Hearthstove
A	goto	Loch Modan,34.828,49.283
A	turnin	418
S	
T	label	Thelsamar1
A	target	Thorgrum Borrelson
A	goto	Loch Modan,33.938,50.954
A	turnin	6387
A	accept	6391
S	
A	goto	Loch Modan,33.938,50.954
A	fly	Ironforge
A	target	Thorgrum Borrelson
S	
A	target	Golnir Bouldertoe
A	goto	Ironforge,51.521,26.311
A	turnin	6391
A	accept	6388
S	Hunter
A	target	Gryth Thurden
A	goto	Ironforge,55.501,47.742
A	turnin	6388
A	accept	6392
S	
A	target	Senator Barin Redstone
A	goto	Ironforge,43.64,50.63,20,0
A	goto	Ironforge,39.550,57.490
A	turnin	291
S	Warrior
A	target	Buliwyf Stonehand
A	goto	Ironforge,61.181,89.514
A	trainer	
S	!Hunter
A	target	Gryth Thurden
A	goto	Ironforge,55.501,47.742
A	turnin	6388
A	accept	6392
S	!Hunter skip
T	completewith	next
A	link	https://www.youtube.com/watch?v=PWMJhodh6Bw
A	zoneskip	Ironforge,1
S	
A	goto	Ironforge,78.00,52.00,5,0
A	target	Monty
A	accept	6661
S	
A	use	17117
A	complete	6661,1
A	mob	Deeprun Rat
S	
A	target	Monty
A	turnin	6661
A	timer	11,Deeprun Rat Roundup RP
A	accept	6662
S	
T	completewith	next
A	zone	Stormwind City
S	
A	turnin	6662
A	target	Nipsy
S	
A	zone	Stormwind City
S	
A	target	Grimand Elmore
A	goto	StormwindClassic,51.757,12.091
A	accept	353
S	
A	target	Furen Longbeard
A	goto	StormwindClassic,58.091,16.552
A	turnin	1338
S	Priest
T	completewith	next
A	goto	StormwindClassic,42.51,33.51,20
S	Priest
A	target	High Priestess Laurena
A	goto	StormwindClassic,38.54,26.86
A	trainer	
A	turnin	5634
S	Priest
A	goto	StormwindClassic,38.62,26.10
A	train	13908
A	target	High Priestess Laurena
S	Warrior
A	goto	StormwindClassic,76.08,50.14,15,0
A	goto	StormwindClassic,80.22,45.37,15,0
A	goto	StormwindClassic,78.503,45.712
A	trainer	
A	accept	1638
A	target	Ilsa Corbin
S	Warrior
T	completewith	next
A	goto	StormwindClassic,72.878,51.582,17,0
A	goto	StormwindClassic,71.7,39.9,12
S	Warrior
A	target	Harry Burlguard
A	goto	StormwindClassic,74.249,37.244
A	turnin	1638
A	accept	1639
S	Warrior
A	target	Bartleby
A	goto	StormwindClassic,73.787,36.323
A	turnin	1639
A	accept	1640
S	Warrior
A	goto	StormwindClassic,73.787,36.323
A	complete	1640,1
A	mob	Bartleby
S	Warrior
A	target	Bartleby
A	goto	StormwindClassic,73.787,36.323
A	turnin	1640
A	accept	1665
S	Warrior
A	target	Harry Burlguard
A	goto	StormwindClassic,74.249,37.244
A	turnin	1665
S	Warlock
T	completewith	next
A	goto	StormwindClassic,29.2,74.0,20,0
A	goto	StormwindClassic,27.2,78.1,15
S	Warlock
A	goto	StormwindClassic,26.117,77.225
A	trainer	
A	target	Ursula Deline
S	Warlock
A	goto	StormwindClassic,25.25,78.59
A	accept	1688
A	target	Gakin the Darkbinder
S	
A	target	Woo Ping
A	goto	StormwindClassic,57.129,57.698
A	trainer	
A	trainer	
A	trainer	
A	trainer	
S	Dwarf Paladin
A	goto	StormwindClassic,52.623,65.701
A	home	
A	target	Innkeeper Allison
S	Rogue
A	money	<0.2000
A	goto	StormwindClassic,57.547,57.076
A	target	Gunther Weller
A	vendor	
S	Rogue
A	goto	StormwindClassic,57.32,62.08,20,0
A	goto	StormwindClassic,58.362,61.678
A	vendor	
A	target	Thurman Mullby
E
G	Guides/SurvivalGuide/A-Classic-Alliance-1-14_DwarfGnome.lua
M	hardcore	
M	era/som--h	
M	classic	
M	tbc	
M	selector	Alliance
M	name	10-11 Elwynn (Dwarf/Gnome)
M	version	1
M	group	RestedXP Survival Guide (A)
M	subgroup	RXP Survival Guide 1-20
M	defaultfor	Gnome/Dwarf
M	next	11-13 Loch Modan (Dwarf/Gnome)
S	
A	goto	StormwindClassic,66.277,62.137
A	fp	Stormwind
A	target	Dungar Longdrink
S	
T	completewith	next
A	goto	Elwynn Forest,42.107,65.930,100
S	
A	goto	Elwynn Forest,42.107,65.930
A	target	Marshal Dughan
A	accept	62
S	
A	target	William Pestle
A	goto	Elwynn Forest,43.318,65.705
A	accept	60
S	Mage/Rogue
T	completewith	next
A	goto	Elwynn Forest,43.877,66.546,9
S	Mage
A	target	Zaldimar Wefhellt
A	goto	Elwynn Forest,43.25,66.19
A	trainer	
S	Rogue
A	target	Keryn Sylvius
A	goto	Elwynn Forest,43.872,65.937
A	trainer	
S	
A	target	Remy "Two Times"
A	goto	Elwynn Forest,42.140,67.254
A	accept	40
A	accept	47
S	
A	accept	88
A	target	+Ma Stonefield
A	goto	Elwynn Forest,34.660,84.483
A	accept	85
A	target	+"Auntie" Bernice Stonefield
A	goto	Elwynn Forest,34.486,84.252
S	
A	target	Billy Maclure
A	goto	Elwynn Forest,43.131,85.722
A	turnin	85
A	accept	86
S	
A	goto	Elwynn Forest,43.154,89.625
A	accept	106
A	target	Maybell Maclure
S	
A	goto	Elwynn Forest,29.840,85.997
A	turnin	106
A	accept	111
A	target	Tommy Joe Stonefield
S	
A	goto	Elwynn Forest,34.486,84.252
A	turnin	86
A	isQuestComplete	86
A	target	"Auntie" Bernice Stonefield
S	
A	goto	Elwynn Forest,34.943,83.861
A	turnin	111
A	accept	107
A	target	Gramma Stonefield
S	
T	completewith	next
A	complete	60,1
A	complete	47,1
A	mob	Kobold Tunneler
A	mob	Kobold Miner
S	
A	goto	Elwynn Forest,40.5,82.3
A	complete	62,1
S	
A	goto	Elwynn Forest,40.5,82.3,25,0
A	goto	Elwynn Forest,37.71,83.76,25,0
A	goto	Elwynn Forest,40.5,82.3,25,0
A	goto	Elwynn Forest,37.71,83.76,25,0
A	goto	Elwynn Forest,40.5,82.3
A	complete	60,1
A	complete	47,1
A	mob	Kobold Tunneler
A	mob	Kobold Miner
S	
T	completewith	next
A	goto	Elwynn Forest,42.20,66.00,100
S	
A	target	Remy "Two Times"
A	goto	Elwynn Forest,42.140,67.254
A	turnin	47
S	
A	target	Marshal Dughan
A	goto	Elwynn Forest,42.108,65.928
A	turnin	62
A	accept	76
A	turnin	40
A	accept	35
S	
A	target	William Pestle
A	goto	Elwynn Forest,43.318,65.705
A	turnin	60
A	accept	61
A	turnin	107
A	accept	112
S	
A	goto	Elwynn Forest,47.6,63.3,60,0
A	goto	Elwynn Forest,51.4,64.6,60,0
A	goto	Elwynn Forest,57.6,62.8,60,0
A	goto	Elwynn Forest,56.4,66.6,60,0
A	goto	Elwynn Forest,53.8,66.8,60,0
A	goto	Elwynn Forest,57.6,62.8
A	complete	112,1
A	mob	Murloc
A	mob	Murloc Streamrunner
S	
T	completewith	next
A	goto	Elwynn Forest,61.654,53.608,15
S	
A	goto	Elwynn Forest,60.4,50.2
A	complete	76,1
S	
A	target	Guard Thomas
A	goto	Elwynn Forest,73.973,72.179
A	turnin	35
S	
T	era	
A	target	Guard Thomas
A	goto	Elwynn Forest,73.973,72.179
A	accept	37
A	accept	52
S	
T	era	
T	completewith	Prowlers
A	complete	52,1
A	mob	+Prowler
A	complete	52,2
A	mob	+Young Forest Bear
S	
T	era	
A	goto	Elwynn Forest,72.656,60.334
A	turnin	37
A	accept	45
S	
T	era	
A	target	Supervisor Raelen
A	goto	Elwynn Forest,81.382,66.112
A	accept	5545
S	
T	era	
T	completewith	Bundles
A	complete	5545,1
S	
T	era	
T	label	Prowlers
A	goto	Elwynn Forest,79.80,55.50
A	turnin	45
A	accept	71
S	
T	era	
T	label	Bundles
A	goto	Elwynn Forest,76.7,75.6,60,0
A	goto	Elwynn Forest,79.7,83.7,60,0
A	goto	Elwynn Forest,82.0,76.8,60,0
A	goto	Elwynn Forest,76.7,75.6,60,0
A	goto	Elwynn Forest,79.7,83.7,60,0
A	goto	Elwynn Forest,82.0,76.8,60,0
A	goto	Elwynn Forest,86.99,64.83
A	complete	52,1
A	mob	+Prowler
A	complete	52,2
A	mob	Young Forest Bear
S	
T	era	
A	goto	Elwynn Forest,76.8,62.4,40,0
A	goto	Elwynn Forest,83.7,59.4,40,0
A	goto	Elwynn Forest,76.8,62.4,40,0
A	goto	Elwynn Forest,83.7,59.4,40,0
A	goto	Elwynn Forest,76.8,62.4,40,0
A	goto	Elwynn Forest,83.7,59.4
A	complete	5545,1
S	
T	era	
A	target	Supervisor Raelen
A	goto	Elwynn Forest,81.382,66.112
A	turnin	5545
S	
T	era	
T	label	Bears
A	target	Sara Timberlain
A	goto	Elwynn Forest,79.457,68.789
A	accept	83
S	
T	era	
A	target	Guard Thomas
A	goto	Elwynn Forest,73.973,72.179
A	turnin	52
A	turnin	71
A	accept	39
A	accept	109
S	Warlock
A	goto	Elwynn Forest,71.10,80.66
A	complete	1688,1
A	mob	Surena Caledon
S	
T	era	
T	completewith	next
A	complete	83,1
A	mob	Defias Bandit
S	
A	goto	Elwynn Forest,69.3,79.0
A	complete	88,1
A	mob	Princess
S	
T	completewith	next
A	use	1972
A	collect	1972,1,184
A	accept	184
S	
T	era	
A	goto	Elwynn Forest,70.5,77.6,60,0
A	goto	Elwynn Forest,68.1,77.5,60,0
A	goto	Elwynn Forest,68.2,81.4,60,0
A	goto	Elwynn Forest,70.8,80.9,60,0
A	goto	Elwynn Forest,70.5,77.6,60,0
A	goto	Elwynn Forest,68.1,77.5,60,0
A	goto	Elwynn Forest,68.2,81.4,60,0
A	goto	Elwynn Forest,70.8,80.9,60,0
A	goto	Elwynn Forest,70.5,77.6,60,0
A	goto	Elwynn Forest,68.1,77.5,60,0
A	goto	Elwynn Forest,68.2,81.4,60,0
A	goto	Elwynn Forest,70.8,80.9,60,0
A	goto	Elwynn Forest,69.3,79.0
A	complete	83,1
A	mob	Defias Bandit
S	
T	era	
T	softcore	
T	sticky	
T	completewith	next
A	goto	Elwynn Forest,83.6,69.7,120
S	
T	era	
T	label	Deed
A	target	Sara Timberlain
A	goto	Elwynn Forest,79.457,68.789
A	turnin	83
S	
T	completewith	next
A	goto	Redridge Mountains,17.4,69.6
A	zone	Redridge Mountains
S	
A	target	Guard Parker
A	goto	Redridge Mountains,17.4,69.6
A	accept	244
S	
A	goto	Redridge Mountains,18.581,69.208,15,0
A	goto	Redridge Mountains,23.325,71.373,25,0
A	goto	Redridge Mountains,29.565,67.930,25,0
A	goto	Redridge Mountains,30.733,59.996
A	turnin	244
A	target	Deputy Feldon
S	
A	goto	Redridge Mountains,30.590,59.410
A	fp	Redridge Mountains
A	fly	Stormwind
A	target	Ariena Stormfeather
S	
T	ah	
A	goto	Stormwind City,53.612,59.764
A	collect	3172,3,418,1
A	collect	3173,3,418,1
A	collect	3174,3,418,1
A	collect	769,4,86,1
A	target	Auctioneer Jaxon
S	
A	goto	StormwindClassic,56.201,64.585
A	turnin	61,1
A	link	https://www.youtube.com/watch?v=H-IwZ6P-ldY
A	target	Morgan Pestle
S	Warlock
T	completewith	next
A	goto	StormwindClassic,29.2,74.0,20,0
A	goto	StormwindClassic,27.2,78.1,15
S	Warlock
A	goto	StormwindClassic,25.25,78.59
A	trainer	
A	turnin	1688
A	accept	1689
A	target	Gakin the Darkbinder
S	Warlock
T	completewith	next
A	goto	StormwindClassic,25.2,80.7,18,0
A	goto	StormwindClassic,23.2,79.5,18,0
A	goto	StormwindClassic,26.3,79.5,18,0
A	goto	StormwindClassic,25.154,77.406
A	cast	7728
A	use	6928
S	Warlock
A	goto	StormwindClassic,25.154,77.406
A	use	6928
A	complete	1689,1
A	mob	Summoned Voidwalker
S	Warlock
T	softcore	
A	target	Gakin the Darkbinder
A	goto	StormwindClassic,25.2,78.5
A	turnin	1689
S	Warlock
T	hardcore	
A	target	Gakin the Darkbinder
A	goto	StormwindClassic,25.25,78.59
A	turnin	1689
S	Warlock
T	softcore	
T	completewith	next
A	goto	StormwindClassic,25.2,78.5
A	deathskip	
S	
T	completewith	next
A	goto	Elwynn Forest,42.20,66.00,100
S	Warrior
A	goto	Elwynn Forest,41.09,65.77
A	target	Lyria Du Lac
A	trainer	
S	
T	era	
A	goto	Elwynn Forest,42.105,65.927
A	turnin	39
A	turnin	76
A	accept	239
A	target	Marshal Dughan
S	
A	goto	Elwynn Forest,43.318,65.705
A	turnin	112
A	accept	114
A	target	William Pestle
S	Mage/Rogue/Priest
T	completewith	next
A	goto	Elwynn Forest,43.877,66.546,9
S	Mage
A	target	Zaldimar Wefhellt
A	goto	Elwynn Forest,43.25,66.19
A	trainer	
S	Rogue
A	target	Keryn Sylvius
A	goto	Elwynn Forest,43.872,65.937
A	trainer	
S	Priest
A	goto	Elwynn Forest,43.283,65.719
A	target	Priestess Josetta
A	trainer	
S	
T	completewith	next
A	goto	Elwynn Forest,43.154,89.625,50
S	
A	goto	Elwynn Forest,43.154,89.625
A	turnin	114
A	target	Maybell Maclure
S	
A	target	Ma Stonefield
A	turnin	88
A	goto	Elwynn Forest,34.660,84.483
S	
A	target	"Auntie" Bernice Stonefield
A	turnin	86
A	goto	Elwynn Forest,34.486,84.252
A	isQuestComplete	86
S	
T	sticky	
A	abandon	86
S	
T	completewith	next
A	goto	Elwynn Forest,24.82,76.25,80
S	Warlock
A	turnin	239
A	accept	11
A	goto	Elwynn Forest,24.234,74.450
A	accept	176
A	goto	Elwynn Forest,24.548,74.672
A	target	Deputy Rainer
S	
A	group	
A	turnin	239
A	accept	11
A	goto	Elwynn Forest,24.234,74.450
A	accept	176
A	goto	Elwynn Forest,24.548,74.672
A	target	Deputy Rainer
S	
A	solo	
A	goto	Elwynn Forest,24.234,74.450
A	turnin	239
A	accept	11
A	target	Deputy Rainer
S	
T	completewith	GnollEnd
A	use	1307
A	collect	1307,1,123
A	accept	123
A	unitscan	Gruff Swiftbite
S	!Warlock
A	group	
T	completewith	next
A	complete	11,1
A	collect	2589,10,1648,1,1 << Dwarf Paladin
A	mob	Riverpaw Runt
A	mob	Riverpaw Outrunner
S	Warlock
T	completewith	next
A	complete	11,1
A	collect	2589,10,1648,1,1 << Dwarf Paladin
A	mob	Riverpaw Runt
A	mob	Riverpaw Outrunner
S	Warlock
A	goto	Elwynn Forest,27.0,86.7,70,0
A	goto	Elwynn Forest,26.1,89.9,70,0
A	goto	Elwynn Forest,25.2,92.7,70,0
A	goto	Elwynn Forest,27.0,93.9,70,0
A	goto	Elwynn Forest,27.0,86.7,70,0
A	goto	Elwynn Forest,26.1,89.9,70,0
A	goto	Elwynn Forest,25.2,92.7,70,0
A	goto	Elwynn Forest,27.0,93.9,70,0
A	goto	Elwynn Forest,27.0,86.7,70,0
A	goto	Elwynn Forest,26.1,89.9,70,0
A	goto	Elwynn Forest,25.2,92.7,70,0
A	goto	Elwynn Forest,27.0,93.9,70,0
A	goto	Elwynn Forest,25.9,93.9
A	complete	176,1
A	unitscan	Hogger
S	
A	group	
A	goto	Elwynn Forest,27.0,86.7,70,0
A	goto	Elwynn Forest,26.1,89.9,70,0
A	goto	Elwynn Forest,25.2,92.7,70,0
A	goto	Elwynn Forest,27.0,93.9,70,0
A	goto	Elwynn Forest,27.0,86.7,70,0
A	goto	Elwynn Forest,26.1,89.9,70,0
A	goto	Elwynn Forest,25.2,92.7,70,0
A	goto	Elwynn Forest,27.0,93.9,70,0
A	goto	Elwynn Forest,27.0,86.7,70,0
A	goto	Elwynn Forest,26.1,89.9,70,0
A	goto	Elwynn Forest,25.2,92.7,70,0
A	goto	Elwynn Forest,27.0,93.9,70,0
A	goto	Elwynn Forest,25.9,93.9
A	complete	176,1
A	unitscan	Hogger
S	
T	label	GnollEnd
A	goto	Elwynn Forest,27.0,86.7,70,0
A	goto	Elwynn Forest,26.1,89.9,70,0
A	goto	Elwynn Forest,25.2,92.7,70,0
A	goto	Elwynn Forest,27.0,93.9,70,0
A	goto	Elwynn Forest,27.0,86.7,70,0
A	goto	Elwynn Forest,26.1,89.9,70,0
A	goto	Elwynn Forest,25.2,92.7,70,0
A	goto	Elwynn Forest,27.0,93.9,70,0
A	goto	Elwynn Forest,27.0,86.7,70,0
A	goto	Elwynn Forest,26.1,89.9,70,0
A	goto	Elwynn Forest,25.2,92.7,70,0
A	goto	Elwynn Forest,27.0,93.9,70,0
A	goto	Elwynn Forest,25.9,93.9
A	complete	11,1
A	collect	2589,10,1648,1,1 << Dwarf Paladin
A	mob	Riverpaw Runt
A	mob	Riverpaw Outrunner
S	
A	target	Marshal Dughan
A	goto	Elwynn Forest,42.105,65.927
A	turnin	176
A	isQuestComplete	176
S	
A	target	Marshal Dughan
A	goto	Elwynn Forest,42.105,65.927
A	turnin	123
A	isOnQuest	123
S	
A	goto	Elwynn Forest,24.234,74.450
A	turnin	11
A	target	Deputy Rainer
S	
T	completewith	WestEntry
A	goto	Westfall,59.95,19.35
A	zone	Westfall
S	
A	target	Farmer Furlbrow
A	goto	Westfall,59.95,19.35
A	turnin	184
A	isOnQuest	184
S	
T	label	WestEntry
A	accept	64
A	target	+Farmer Furlbrow
A	goto	Westfall,59.95,19.35
A	accept	151
A	accept	36
A	goto	Westfall,59.92,19.42
A	target	+Verna Furlbrow
S	
A	target	Farmer Saldean
A	goto	Westfall,56.04,31.23
A	accept	9
S	
A	target	Salma Saldean
A	goto	Westfall,56.40,30.50
A	turnin	36
A	accept	38
A	accept	22
S	
T	softcore	
T	sticky	
T	completewith	next
A	deathskip	
S	
T	era	
A	target	Gryan Stoutmantle
A	goto	Westfall,56.33,47.52
A	turnin	109
A	accept	12
S	
T	era	
A	target	Captain Danuvin
A	goto	Westfall,56.42,47.62
A	accept	102
S	
A	target	Scout Galiaan
A	goto	Westfall,54.00,53.00
A	accept	153
S	
A	goto	Westfall,56.55,52.64
A	fp	Sentinel Hill
A	fly	Stormwind
A	target	Thor
S	!Paladin
A	hs	
S	Dwarf Paladin
A	goto	StormwindClassic,61.149,11.568,25,0
A	goto	StormwindClassic,64.0,8.10
A	zone	Ironforge
E
G	Guides/SurvivalGuide/A-Classic-Alliance-1-14_DwarfGnome.lua
M	hardcore	
M	era/som--h	
M	classic	
M	tbc	
M	selector	Alliance
M	name	11-13 Loch Modan (Dwarf/Gnome)
M	version	1
M	group	RestedXP Survival Guide (A)
M	subgroup	RXP Survival Guide 1-20
M	defaultfor	Gnome/Dwarf
M	next	13-15 Westfall
S	Dwarf Paladin
A	target	Brandur Ironhammer
A	goto	Ironforge,23.131,6.143
A	accept	2999
S	Dwarf Paladin
T	completewith	next
A	goto	Ironforge,25.27,1.53,9,0
A	goto	Ironforge,24.35,11.90,10
S	Dwarf Paladin
A	goto	Ironforge,27.628,12.183
A	turnin	2999
A	accept	1645
A	turnin	1645
A	target	Tiza Battleforge
S	Dwarf Paladin
A	goto	Ironforge,27.628,12.183
A	use	6916
A	accept	1646
S	Dwarf Paladin
A	goto	Ironforge,27.628,12.183
A	turnin	1646
A	accept	1647
S	Dwarf Paladin
A	goto	Ironforge,21.643,36.199,20,0
A	goto	Ironforge,23.401,62.898,20,0
A	goto	Ironforge,32.057,78.286,20,0
A	goto	Ironforge,47.132,84.932,20,0
A	goto	Ironforge,26.719,69.884
A	turnin	1647
A	accept	1648
A	turnin	1648
A	accept	1778
A	unitscan	John Turner
S	Dwarf Paladin
A	goto	Ironforge,25.27,1.53,9,0
A	goto	Ironforge,24.35,11.90,10,0
A	goto	Ironforge,27.628,12.183
A	target	Tiza Battleforge
A	turnin	1778
A	accept	1779
S	Dwarf Paladin
A	goto	Ironforge,23.539,8.300
A	target	Muiredon Battleforge
A	turnin	1779
A	accept	1783
S	Paladin
A	goto	Ironforge,55.501,47.742
A	fly	Loch Modan
A	target	Gryth Thurden
A	zoneskip	Ironforge,1
S	
T	optional	
A	isQuestComplete	418
A	target	Vidra Hearthstove
A	goto	Loch Modan,34.828,49.283
A	turnin	418
S	
T	completewith	RTB
A	goto	Loch Modan,34.757,48.618
A	vendor	1682
A	target	Yanni Stoutheart
S	
T	completewith	RTB
A	goto	Loch Modan,35.534,48.404
A	vendor	6734
A	vendor	6734
A	target	Innkeeper Hearthstove
S	
A	goto	Loch Modan,37.17,47.94,8,0
A	goto	Loch Modan,37.019,47.806
A	turnin	6392
A	target	Brock Stoneseeker
S	Hunter
A	goto	Loch Modan,35.828,43.457
A	collect	2511,1
A	money	<0.1300
A	target	Vrok Blunderblast
S	
A	group	
T	completewith	BraveSoul
A	collect	3172,3,418,1
A	mob	+Mountain Boar
A	collect	3173,3,418,1
A	mob	+Elder Black Bear
A	collect	3174,3,418,1
A	mob	+Forest Lurker
S	
A	solo	
T	completewith	StormpikeStop
A	collect	3172,3,418,1
A	mob	+Mountain Boar
A	collect	3173,3,418,1
A	mob	+Elder Black Bear
A	collect	3174,3,418,1
A	mob	+Forest Lurker
S	
A	group	
T	completewith	MinerGear
A	complete	416,1
A	mob	Tunnel Rat Scout
A	mob	Tunnel Rat Vermin
A	mob	Tunnel Rat Forager
A	mob	Tunnel Rat Geomancer
A	mob	Tunnel Rat Digger
A	mob	Tunnel Rat Surveyor
S	
A	group	
T	label	BraveSoul
T	completewith	next
A	goto	Loch Modan,35.50,18.97,20
S	
A	group	
T	label	MinerGear
A	goto	Loch Modan,35.93,22.55
A	complete	307,1
S	
A	group	
T	completewith	StormpikeStop
A	collect	3172,3,418,1
A	mob	+Mountain Boar
A	collect	3173,3,418,1
A	mob	+Elder Black Bear
A	collect	3174,3,418,1
A	mob	+Forest Lurker
S	Paladin/Warrior
A	goto	Loch Modan,42.867,9.885
A	vendor	
A	target	Nillen Andemar
S	
A	goto	Loch Modan,25.05,30.19,0
A	goto	Loch Modan,26.06,43.44,0
A	goto	Loch Modan,37.71,16.84,0
A	goto	Loch Modan,37.71,16.84,50,0
A	goto	Loch Modan,35.48,16.82,50,0
A	goto	Loch Modan,25.05,30.19,50,0
A	goto	Loch Modan,26.06,43.44,50,0
A	goto	Loch Modan,37.71,16.84,50,0
A	goto	Loch Modan,35.48,16.82
A	complete	416,1
A	mob	Tunnel Rat Scout
A	mob	Tunnel Rat Vermin
A	mob	Tunnel Rat Forager
A	mob	Tunnel Rat Geomancer
A	mob	Tunnel Rat Digger
A	mob	Tunnel Rat Surveyor
S	
T	completewith	StormpikeDelivery
T	label	StormpikeStop
A	goto	Loch Modan,24.134,18.208
A	vendor	
A	target	Gothor Brumn
S	
A	group	
A	goto	Loch Modan,24.77,18.40
A	turnin	307
A	target	Mountaineer Stormpike
S	
T	label	StormpikeDelivery
A	goto	Loch Modan,24.77,18.40
A	turnin	353
A	target	Mountaineer Stormpike
S	
A	collect	3173,3,418,1
A	mob	+Elder Black Bear
A	goto	Loch Modan,26.9,10.7,90,0
A	goto	Loch Modan,30.9,10.6,90,0
A	goto	Loch Modan,28.6,15.4,90,0
A	goto	Loch Modan,30.5,26.6,90,0
A	goto	Loch Modan,33.4,30.3,90,0
A	goto	Loch Modan,39.4,33.3,90,0
A	goto	Loch Modan,26.9,10.7,90,0
A	goto	Loch Modan,30.9,10.6,90,0
A	goto	Loch Modan,28.6,15.4,90,0
A	goto	Loch Modan,30.5,26.6,90,0
A	goto	Loch Modan,33.4,30.3,90,0
A	goto	Loch Modan,39.4,33.3,90,0
A	goto	Loch Modan,26.9,10.7
A	collect	3172,3,418,1
A	mob	+Mountain Boar
A	goto	Loch Modan,38.0,34.9,90,0
A	goto	Loch Modan,37.1,39.8,90,0
A	goto	Loch Modan,29.8,35.9,90,0
A	goto	Loch Modan,27.7,25.3,90,0
A	goto	Loch Modan,28.6,22.6,90,0
A	goto	Loch Modan,38.0,34.9,90,0
A	goto	Loch Modan,37.1,39.8,90,0
A	goto	Loch Modan,29.8,35.9,90,0
A	goto	Loch Modan,27.7,25.3,90,0
A	goto	Loch Modan,28.6,22.6,90,0
A	goto	Loch Modan,38.0,34.9
A	collect	3174,3,418,1
A	goto	Loch Modan,31.9,16.4,90,0
A	goto	Loch Modan,28.0,20.6,90,0
A	goto	Loch Modan,33.8,40.5,90,0
A	goto	Loch Modan,36.2,30.9,90,0
A	goto	Loch Modan,39.0,32.1,90,0
A	goto	Loch Modan,31.9,16.4,90,0
A	goto	Loch Modan,28.0,20.6,90,0
A	goto	Loch Modan,33.8,40.5,90,0
A	goto	Loch Modan,36.2,30.9,90,0
A	goto	Loch Modan,39.0,32.1,90,0
A	goto	Loch Modan,31.9,16.4
A	mob	+Forest Lurker
S	
A	line	Loch Modan,36.72,41.97,37.24,43.19,37.33,45.63,36.77,46.20,35.19,46.88,32.67,49.71,35.19,46.88,36.77,46.20,37.33,45.63,37.24,43.19,36.72,41.97
A	goto	Loch Modan,36.72,41.97,15,0
A	goto	Loch Modan,37.24,43.19,15,0
A	goto	Loch Modan,37.33,45.63,15,0
A	goto	Loch Modan,36.77,46.20,15,0
A	goto	Loch Modan,35.19,46.88,15,0
A	goto	Loch Modan,32.67,49.71,20,0
A	goto	Loch Modan,36.77,46.20
A	target	Mountaineer Kadrell
A	turnin	416
S	
A	target	Vidra Hearthstove
A	goto	Loch Modan,34.828,49.283
A	turnin	418
S	
A	goto	Loch Modan,34.757,48.618
A	collect	4470,2
A	collect	4471,1
A	target	Yanni Stoutheart
S	
A	goto	Loch Modan,27.01,48.74,0
A	goto	Loch Modan,27.68,56.83,0
A	goto	Loch Modan,33.35,71.59,0
A	goto	Loch Modan,31.54,74.96,0
A	goto	Loch Modan,27.01,48.74,40,0
A	goto	Loch Modan,27.68,56.83,40,0
A	goto	Loch Modan,33.35,71.59,40,0
A	goto	Loch Modan,31.54,74.96,40,0
A	goto	Loch Modan,33.88,76.58
A	complete	224,1
A	mob	+Stonesplinter Trogg
A	complete	224,2
A	mob	+Stonesplinter Scout
A	complete	267,1
A	mob	+Stonesplinter Trogg
A	mob	+Stonesplinter Scout
S	
T	era	
A	goto	Loch Modan,27.4,48.4
A	xp	13+9600
S	
T	som--xpgate	
A	goto	Loch Modan,27.4,48.4
A	xp	14-2300
S	
T	completewith	next
A	goto	Loch Modan,24.78,70.17,10,0
A	goto	Loch Modan,23.73,75.52,15
S	
A	target	Captain Rugelfuss
A	goto	Loch Modan,23.233,73.675
A	turnin	267
S	
A	target	Mountaineer Cobbleflint
A	goto	Loch Modan,22.071,73.127
A	turnin	224
S	!Dwarf/!Paladin
A	goto	Loch Modan,33.938,50.954
A	fly	Ironforge
A	target	Thorgrum Borrelson
S	Dwarf Paladin
T	completewith	next
A	goto	Dun Morogh,86.09,51.15
A	zone	Dun Morogh
S	Dwarf Paladin
T	completewith	next
A	goto	Dun Morogh,78.321,58.088
A	cast	8593
A	use	6866
A	target	Narm Faulk
S	Dwarf Paladin
A	goto	Dun Morogh,78.321,58.088
A	use	6866
A	turnin	1783
A	accept	1784
A	target	Narm Faulk
S	Dwarf Paladin
A	goto	Dun Morogh,77.3,60.5,20,0
A	goto	Dun Morogh,77.83,61.78
A	complete	1784,1
A	mob	Dark Iron Spy
S	Dwarf Paladin
T	completewith	next
A	hs	
S	Paladin
T	completewith	next
A	goto	StormwindClassic,42.51,33.51,20
S	Paladin
A	goto	StormwindClassic,38.82,31.27,10,0
A	goto	StormwindClassic,38.67,32.82
A	trainer	
A	target	Arthur the Faithful
S	Hunter
A	goto	Ironforge,69.872,82.890
A	trainer	
A	target	Regnus Thundergranite
S	Warrior
A	goto	Ironforge,65.905,88.405
A	trainer	
A	target	Bilban Tosslespanner
S	Mage
A	goto	Ironforge,27.18,8.60
A	trainer	
A	target	Dink
S	Mage/Priest/Warlock
T	ah	
A	goto	Ironforge,25.800,75.500,-1
A	goto	Ironforge,24.200,74.600,-1
A	goto	Ironforge,23.800,71.800,-1
A	collect	11288,1
A	target	Auctioneer Lympkin
A	target	Auctioneer Redmuse
A	target	Auctioneer Buckler
S	Mage/Priest/Warlock
A	goto	Ironforge,22.837,17.094,8,0
A	goto	Ironforge,21.131,17.276,5,0
A	goto	Ironforge,23.135,15.936
A	collect	5208,1
A	target	Harick Boulderdrum
S	Warlock
T	softcore	
T	requires	Wand2
A	goto	Ironforge,51.1,8.7,15,0
A	goto	Ironforge,50.4,6.3
A	trainer	
S	Warlock
T	hardcore	
A	goto	Ironforge,51.1,8.7,15,0
A	goto	Ironforge,50.343,5.657
A	trainer	
A	target	Briarthorn
S	Warlock
A	goto	Ironforge,53.2,7.8,15,0
A	goto	Ironforge,52.701,6.070
A	vendor	
A	target	Jubahl Corpseseeker
S	Rogue
T	optional	
A	goto	Ironforge,51.958,14.838
A	turnin	-2218
A	target	Hulfdan Blackbeard
S	Rogue
A	goto	Ironforge,51.495,15.330
A	trainer	
A	target	Fenthwick
S	Priest
A	goto	Ironforge,25.207,10.756
A	trainer	
A	target	Toldren Deepiron
S	!Paladin !Warrior !Hunter !Warlock skip
T	completewith	next
A	link	https://www.youtube.com/watch?v=PWMJhodh6Bw
A	zoneskip	Ironforge,1
S	!Paladin
A	goto	Ironforge,78.00,52.00,5,0
A	zone	Stormwind City
S	
T	completewith	Fly2WF
A	goto	StormwindClassic,55.21,7.04
A	vendor	5519
A	bronzetube	
A	target	Billibub Cogspinner
S	Rogue
T	ah	
A	goto	StormwindClassic,57.38,56.77
A	collect	2027,2
A	target	Marda Weller
A	money	<0.3815
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.7
S	Rogue
T	ssf	
A	goto	StormwindClassic,57.38,56.77
A	collect	2027,2
A	money	<0.3815
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.7
A	target	Marda Weller
S	Rogue
T	optional	
T	completewith	next
A	use	2027
A	itemcount	2027,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.69
A	xp	<14,1
S	
T	ah	
A	goto	Stormwind City,53.612,59.764
A	collect	729,3,38,1
A	collect	730,3,38,1
A	collect	731,3,38,1
A	collect	732,3,38,1
A	collect	723,8,22,1
A	collect	814,5,103,1
A	target	Auctioneer Jaxon
S	
T	label	Fly2WF
A	goto	StormwindClassic,66.277,62.137
A	fly	Westfall
A	target	Dungar Longdrink
E
G	Guides/SurvivalGuide/A-Classic-Alliance-11-16_NightElf.lua
M	hardcore	
M	classic	
M	tbc	
M	selector	Alliance
M	name	11-13 Darkshore (Night Elf)
M	version	1
M	group	RestedXP Survival Guide (A)
M	subgroup	RXP Survival Guide 1-20
M	next	13-13 Loch Modan (Night Elf)
M	defaultfor	NightElf
S	NightElf
A	goto	Teldrassil,56.25,92.44
A	turnin	6344
A	accept	6341
A	target	Nessa Shadowsong
S	NightElf
A	goto	Teldrassil,58.39,94.01
A	turnin	6341
A	accept	6342
A	target	Vesprystus
S	NightElf
T	completewith	WashedA
A	goto	Teldrassil,58.39,94.01
A	fly	Auberdine
A	target	Vesprystus
S	!NightElf
T	map	Darkshore
T	completewith	next
A	goto	Darkshore,36.71,44.98,5,0
A	goto	Felwood,19.10,20.63
A	fp	Auberdine
A	target	Gwennyth Bly'Leggonde
S	NightElf
T	map	Darkshore
T	label	WashedA
A	goto	Felwood,19.10,20.63
A	accept	3524
A	target	Gwennyth Bly'Leggonde
S	!NightElf
T	map	Darkshore
T	label	WashedA
A	goto	Darkshore,36.71,44.98,5,0
A	goto	Felwood,19.10,20.63
A	accept	3524
A	target	Gwennyth Bly'Leggonde
S	NightElf
T	map	Darkshore
A	goto	Felwood,19.27,19.14
A	turnin	6342
A	target	Laird
S	
T	map	Darkshore
T	completewith	next
A	goto	Felwood,19.27,19.14
A	vendor	
A	target	Laird
S	
T	completewith	next
A	goto	Darkshore,36.70,43.78,5
S	
T	map	Darkshore
A	goto	Felwood,19.51,18.97
A	accept	983
A	target	Wizbang Cranktoggle
S	!Warrior !Rogue
T	completewith	next
A	goto	Darkshore,37.120,43.616
A	target	Allyndia
S	
T	completewith	BigThreat
A	goto	Darkshore,37.04,44.13
A	home	
A	target	Innkeeper Shaussiy
S	Warrior/Rogue/Paladin
A	goto	Darkshore,38.250,41.008
A	train	2581
A	skill	mining,1,1
A	target	Kurdram Stonehammer
S	Warrior/Rogue/Paladin
A	goto	Darkshore,38.191,40.934
A	train	2020
A	train	2020
A	skill	blacksmithing,1,1
A	target	Delfrum Flintbeard
S	Warrior/Rogue/Paladin
A	goto	Darkshore,38.225,41.199
A	collect	2901,1,9144,1
A	target	Thelgrum Stonehammer
S	
A	goto	Darkshore,38.844,43.416
A	accept	2118
A	target	Tharnariun Treetender
S	
T	map	Darkshore
T	label	BigThreat
A	goto	Felwood,22.24,18.22
A	accept	984
A	target	Terenthis
S	
T	optional	
A	goto	Darkshore,36.096,44.931
A	accept	1141
A	turnin	1141
A	itemcount	12238,6
A	target	Gubber Blump
S	
T	completewith	RabidThistle
A	goto	Darkshore,35.88,47.01,0
A	goto	Darkshore,36.50,53.30,0
A	goto	Darkshore,35.72,55.84,0
A	complete	983,1
A	mob	Pygmy Tide Crawler
A	mob	Young Reef Crawler
S	
T	map	Darkshore
A	goto	Felwood,18.81,26.69
A	complete	3524,1
S	Druid
T	completewith	end
A	collect	2449,5,6123,1
S	
T	map	Darkshore
A	goto	Felwood,22.39,29.45
A	complete	984,1
S	
T	label	RabidThistle
A	goto	Darkshore,38.47,57.92,50,0
A	goto	Darkshore,39.79,58.33,50,0
A	goto	Darkshore,38.86,60.72,50,0
A	goto	Darkshore,38.47,57.92
A	use	7586
A	complete	2118,1
A	unitscan	Rabid Thistle Bear
S	
A	goto	Darkshore,36.53,53.39,55,0
A	goto	Darkshore,36.38,55.96,55,0
A	goto	Darkshore,35.11,54.69,55,0
A	goto	Darkshore,35.79,47.35,55,0
A	goto	Darkshore,36.53,53.39
A	complete	983,1
A	mob	Pygmy Tide Crawler
A	mob	Young Reef Crawler
S	
A	xp	12-3550
S	
T	map	Darkshore
A	goto	Felwood,19.13,21.39
A	turnin	983
S	
T	map	Darkshore
T	era/som	
A	goto	Felwood,19.13,21.39
A	accept	1001
S	
T	map	Darkshore
A	goto	Darkshore,36.71,44.98,10,0
A	goto	Felwood,19.10,20.63
A	turnin	3524
A	accept	4681
A	target	Gwennyth Bly'Leggonde
S	
T	map	Darkshore
A	goto	Felwood,21.63,18.15
A	turnin	2118
A	accept	2138
A	target	Tharnariun Treetender
S	
T	map	Darkshore
A	goto	Felwood,22.24,18.22
A	turnin	984
A	accept	985
A	accept	4761
A	target	Terenthis
S	!Warrior !Rogue
T	completewith	next
A	goto	Darkshore,37.45,40.50
A	vendor	
A	target	Dalmond
S	
T	map	Darkshore
A	goto	Felwood,19.98,14.40
A	turnin	4761
A	accept	958
A	accept	954
A	target	Thundris Windweaver
S	Druid
T	completewith	next
A	goto	Darkshore,42.97,45.47,15,0
A	goto	Darkshore,43.50,45.97
A	cast	18974
A	use	15208
S	Druid
A	goto	Darkshore,42.97,45.47,15,0
A	goto	Darkshore,43.50,45.97
A	use	15208
A	skipgossip	
A	complete	6001,1
A	mob	Lunaclaw
A	target	Lunaclaw Spirit
S	NightElf
T	map	Darkshore
A	goto	Felwood,19.27,19.14
A	accept	6343
A	target	Laird
S	NightElf
T	completewith	next
A	goto	Darkshore,36.71,44.98,5,0
A	goto	Darkshore,36.336,45.574
A	fly	Teldrassil
A	target	Caylais Moonfeather
S	NightElf
A	goto	Teldrassil,56.25,92.44
A	turnin	6343
A	target	Nessa Shadowsong
S	NightElf
T	completewith	next
A	goto	Teldrassil,55.889,89.456
A	zone	Darnassus
S	Druid
A	goto	Darnassus,35.375,8.405
A	turnin	6001
A	trainer	
A	target	Mathrengyl Bearwalker
S	NightElf Warrior
T	completewith	next
A	goto	Darnassus,58.72,34.92
A	trainer	
A	target	Arias'ta Bladesinger
S	NightElf Warrior
A	skipgossip	11866,1
A	goto	Darnassus,57.56,46.72
A	train	2567
A	target	Ilyenia Moonfire
S	NightElf Warrior
T	completewith	next
A	goto	Darnassus,58.765,44.494
A	collect	3107,200
A	target	Ariyell Skyshadow
S	NightElf Priest
A	goto	Darnassus,37.90,82.74
A	trainer	
A	target	Jandria
S	NightElf Rogue
A	goto	Darnassus,31.84,16.69,30,0
A	goto	Darnassus,37.00,21.92
A	trainer	
A	target	Syurna
S	NightElf Hunter
T	completewith	start
A	goto	Darnassus,40.377,8.545
A	trainer	
A	target	Jocaste
S	
T	completewith	next
A	hs	
S	
T	completewith	next
A	goto	Darkshore,36.88,44.10,8,0
A	goto	Darkshore,36.01,43.77,10
S	
A	goto	Darkshore,35.743,43.708
A	accept	963
A	target	Cerellean Whiteclaw
S	
T	completewith	next
A	goto	1439,32.432,43.744,15
S	
T	map	Darkshore
A	goto	Felwood,13.63,21.44
A	complete	4681,1
S	
T	map	Darkshore
A	goto	Darkshore,36.71,44.98,10,0
A	goto	Felwood,19.10,20.63
A	turnin	4681
A	target	Gwennyth Bly'Leggonde
S	Warrior/Rogue
T	map	Darkshore
T	completewith	next
A	goto	Felwood,19.27,19.14
A	vendor	
A	target	Laird
S	
A	goto	Darkshore,37.708,43.431
A	accept	4811
A	target	Sentinel Glynda Nal'Shea
S	
T	map	Darkshore
T	label	Bashal1
A	goto	Felwood,27.70,10.03
A	turnin	954
A	accept	955
A	target	Asterion
S	
A	goto	Darkshore,44.78,37.91,40,0
A	goto	Darkshore,45.43,39.15,40,0
A	goto	Darkshore,46.30,39.01,40,0
A	goto	Darkshore,47.36,36.86,40,0
A	goto	Darkshore,44.80,36.91,40,0
A	goto	Darkshore,46.30,39.01
A	complete	955,1
A	mob	Wild Grell
A	mob	Vile Sprite
S	
T	map	Darkshore
A	goto	Felwood,27.70,10.03
A	turnin	955
A	accept	956
A	target	Asterion
S	
A	goto	Darkshore,45.88,38.56,40,0
A	goto	Darkshore,46.76,39.13,40,0
A	goto	Darkshore,47.69,36.73,40,0
A	goto	Darkshore,45.07,36.76
A	complete	956,1
A	mob	Deth'ryll Satyr
S	
T	map	Darkshore
A	goto	Felwood,27.70,10.03
A	turnin	956
A	accept	957
A	target	Asterion
S	
T	completewith	Tysha
A	collect	5469,5
A	mob	Foreststrider Fledgling
S	
T	label	Tysha
A	goto	Darkshore,40.30,59.70
A	accept	953
A	target	Sentinel Tysha Moonblade
S	
T	completewith	TheLay
A	complete	958,1
A	mob	Cursed Highborne
A	mob	Writhing Highborne
A	mob	Wailing Highborne
S	
A	goto	Darkshore,43.30,58.70
A	complete	953,1
S	
T	map	Darkshore
A	goto	Felwood,25.66,39.11
A	complete	957,1
S	
T	map	Darkshore
T	label	TheLay
A	goto	Felwood,25.98,40.62
A	complete	953,2
S	
A	goto	Darkshore,41.91,57.92,50,0
A	goto	Darkshore,41.81,59.77,50,0
A	goto	Darkshore,41.98,62.13,50,0
A	goto	Darkshore,42.92,62.50,50,0
A	goto	Darkshore,43.30,58.70,50,0
A	goto	Darkshore,41.91,57.92,50,0
A	goto	Darkshore,41.81,59.77,50,0
A	goto	Darkshore,41.98,62.13,50,0
A	goto	Darkshore,42.92,62.50,50,0
A	goto	Darkshore,43.30,58.70
A	complete	958,1
A	mob	Cursed Highborne
A	mob	Writhing Highborne
A	mob	Wailing Highborne
S	
T	map	Darkshore
A	goto	Felwood,23.29,36.73
A	target	Sentinel Tysha Moonblade
A	turnin	953
S	
T	completewith	BashalFinal
A	collect	5469,5
A	mob	Foreststrider Fledgling
S	
T	map	Darkshore
T	completewith	BashalFinal
A	goto	Felwood,27.70,10.03,60
S	
T	map	Darkshore
T	label	BashalFinal
A	goto	Felwood,27.70,10.03
A	target	Asterion
A	turnin	957
S	
A	goto	Darkshore,45.34,49.70,60,0
A	goto	Darkshore,45.48,45.24,60,0
A	goto	Darkshore,42.73,45.67,60,0
A	goto	Darkshore,45.34,49.70,60,0
A	goto	Darkshore,45.48,45.24,60,0
A	goto	Darkshore,42.73,45.67
A	collect	6889,10,2178
A	skill	cooking,10,1
A	mob	Young Moonkin
A	mob	Raging Moonkin
A	mob	Moonkin Oracle
A	mob	Moonkin
S	
A	goto	Darkshore,42.014,33.796,80,0
A	goto	Darkshore,38.717,33.659,100,0
A	goto	Darkshore,46.254,42.955,100,0
A	goto	Darkshore,41.216,50.191,100,0
A	goto	Darkshore,37.662,49.162,100,0
A	goto	Darkshore,46.254,42.955
A	collect	5469,5
A	mob	Foreststrider Fledgling
S	
A	goto	Darkshore,38.109,41.170,5,0
A	goto	Darkshore,37.512,41.674
A	skill	cooking,10,1
A	target	Gorbold Steelhand
S	
A	goto	Darkshore,37.70,40.70
A	accept	2178
A	turnin	2178
A	skill	cooking,<10,1
A	target	Alanndarian Nightsong
S	
T	label	ToolsTurnin
T	map	Darkshore
A	goto	Felwood,19.98,14.40
A	target	Thundris Windweaver
A	turnin	958
S	
T	label	end
A	goto	Darkshore,32.417,43.809,15,0
A	goto	Darkshore,32.417,43.809,0
A	zone	Wetlands
S	
A	goto	Wetlands,9.490,59.694
A	fp	Menethil Harbor
A	target	Shellei Brondir
S	
T	completewith	next
A	goto	Wetlands,5.485,64.156,40
S	
A	goto	Wetlands,2.433,78.689,-1
A	goto	Ironforge,17.089,83.373,-1
A	zone	Ironforge
A	link	https://www.youtube.com/watch?v=oVoxsr4zcg4
A	subzoneskip	809
A	subzoneskip	2257
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Ironforge
A	zoneskip	Westfall
E
G	Guides/SurvivalGuide/A-Classic-Alliance-11-16_NightElf.lua
M	hardcore	
M	classic	
M	tbc	
M	selector	Alliance
M	name	13-13 Loch Modan (Night Elf)
M	version	1
M	group	RestedXP Survival Guide (A)
M	subgroup	RXP Survival Guide 1-20
M	next	13-15 Westfall
M	defaultfor	NightElf
S	
A	goto	1415,44.720,49.200,60,0
A	goto	1415,43.162,49.946,60,0
A	goto	1415,42.564,50.884,20,0
A	goto	1415,42.363,50.812,20,0
A	goto	1415,41.682,50.232,20,0
A	goto	1415,40.959,50.142,20,0
A	goto	1415,39.818,51.078,20,0
A	goto	1415,39.778,51.615,30,0
A	goto	1415,39.505,52.636,30,0
A	goto	1415,40.160,54.451,20,0
A	goto	1415,40.505,54.507,20,0
A	goto	1415,41.370,57.126,40,0
A	goto	1415,41.988,59.434,30,0
A	goto	1415,41.342,61.214,30,0
A	goto	1415,41.309,61.938,20,0
A	goto	1415,40.545,64.111,30,0
A	goto	1415,41.066,65.878,20,0
A	goto	1415,41.349,66.265,30,0
A	goto	1415,41.363,66.995,30,0
A	goto	1415,41.625,67.689,30,0
A	goto	StormwindClassic,4.493,29.157,20,0
A	goto	StormwindClassic,10.336,40.166,10,0
A	goto	StormwindClassic,7,45.471,10,0
A	goto	StormwindClassic,5.560,50.125,10,0
A	goto	StormwindClassic,13.669,74.499,20,0
A	goto	Westfall,42.024,70.980
A	zone	Westfall
A	zoneskip	Ironforge
A	subzoneskip	809
A	subzoneskip	2257
S	
A	goto	Westfall,54.28,9.26,50,0
A	goto	Westfall,55.12,14.64,40,0
A	goto	Westfall,56.36,17.81,65,0
A	goto	Elwynn Forest,23.24,77.80
A	zone	Elwynn Forest
A	zoneskip	Ironforge
A	subzoneskip	809
A	subzoneskip	2257
A	zoneskip	Stormwind City
S	
A	goto	Elwynn Forest,36.809,72.429,100,0
A	goto	StormwindClassic,69.961,86.583
A	zone	Stormwind City
A	zoneskip	Ironforge
A	subzoneskip	809
A	subzoneskip	2257
S	
A	goto	StormwindClassic,55.724,65.401
A	vendor	
A	target	Keldric Boucher
A	zoneskip	Ironforge
A	subzoneskip	809
A	subzoneskip	2257
S	
A	goto	StormwindClassic,57.816,58.331,30,0
A	goto	StormwindClassic,63.301,62.103,30,0
A	goto	StormwindClassic,63.047,65.744,15,0
A	goto	StormwindClassic,66.276,62.135
A	fp	Stormwind
A	target	Dungar Longdrink
A	zoneskip	Ironforge
A	subzoneskip	809
A	subzoneskip	2257
S	
A	goto	StormwindClassic,61.149,11.568,25,0
A	goto	StormwindClassic,64.0,8.10
A	zone	Ironforge
A	zoneskip	Ironforge
A	subzoneskip	809
A	subzoneskip	2257
S	
A	accept	6661
A	target	Monty
A	zoneskip	Ironforge
A	subzoneskip	809
A	subzoneskip	2257
S	
A	use	17117
A	complete	6661,1
A	mob	Deeprun Rat
A	zoneskip	Ironforge
A	subzoneskip	809
A	subzoneskip	2257
S	
A	turnin	6661
A	timer	11,Deeprun Rat Roundup RP
A	accept	6662
A	target	Monty
A	zoneskip	Ironforge
A	subzoneskip	809
A	subzoneskip	2257
S	
T	completewith	next
A	goto	Ironforge,77.0,51.0
A	zone	Ironforge
S	Warrior
A	goto	Ironforge,70.774,90.279
A	accept	1680
A	target	Muren Stormpike
S	
A	goto	Ironforge,55.491,47.751
A	fp	Ironforge
A	target	Gryth Thurden
S	Warrior
A	goto	Ironforge,48.640,42.488
A	turnin	1680
A	target	Tormus Deepforge
S	
T	ah	
A	goto	Ironforge,25.800,75.500,-1
A	goto	Ironforge,24.200,74.600,-1
A	goto	Ironforge,23.800,71.800,-1
A	collect	3172,3,418,1
A	collect	3173,3,418,1
A	collect	3174,3,418,1
A	target	Auctioneer Lympkin
A	target	Auctioneer Redmuse
A	target	Auctioneer Buckler
S	
A	goto	Dun Morogh,53.305,35.112,10,0
A	zone	Dun Morogh
S	
A	target	Rudra Amberstill
A	goto	Dun Morogh,56.503,47.923,100,0
A	goto	Dun Morogh,60.1,52.6,50,0
A	goto	Dun Morogh,63.082,49.851
A	accept	314
S	
T	completewith	next
A	goto	Dun Morogh,62.3,50.3,14,0
A	goto	Dun Morogh,62.2,49.4,10
S	
A	goto	Dun Morogh,62.6,46.1
A	link	https://www.youtube.com/watch?v=ZJX6sCkm5JY
A	complete	314,1
A	mob	Vagash
S	
A	target	Rudra Amberstill
A	goto	Dun Morogh,63.082,49.851
A	turnin	314
S	
T	completewith	next
A	goto	Dun Morogh,68.614,54.643
A	vendor	
A	vendor	
A	target	Kazan Mogosh
S	
A	accept	433
A	target	+Senator Mehr Stonehallow
A	goto	Dun Morogh,68.671,55.969
A	accept	432
A	goto	Dun Morogh,69.084,56.330
A	target	+Foreman Stonebrow
S	Warrior/Paladin/Rogue
A	goto	Dun Morogh,69.324,55.456
A	train	2575
S	Warrior/Paladin/Rogue
A	cast	2580
S	
A	goto	Dun Morogh,70.7,56.4,40,0
A	goto	Dun Morogh,70.62,52.39,25,0
A	goto	Dun Morogh,70.7,56.4
A	complete	432,1
A	mob	+Rockjaw Skullthumper
A	complete	433,1
A	mob	+Rockjaw Bonesnapper
S	
A	turnin	432
A	target	+Foreman Stonebrow
A	goto	Dun Morogh,69.084,56.330
A	turnin	433
A	target	+Senator Mehr Stonehallow
A	goto	Dun Morogh,68.671,55.969
S	
A	goto	Dun Morogh,81.2,42.7,45,0
A	goto	Dun Morogh,83.892,39.188
A	target	Pilot Hammerfoot
A	accept	419
S	
A	goto	Dun Morogh,79.672,36.171
A	turnin	419
A	accept	417
S	
A	goto	Dun Morogh,78.97,37.14
A	complete	417,1
A	unitscan	Mangeclaw
S	
T	som	
A	goto	Dun Morogh,83.892,39.188
A	target	Pilot Hammerfoot
A	turnin	417
S	
T	era	
A	target	Pilot Hammerfoot
A	goto	Dun Morogh,83.892,39.188
A	turnin	417
S	
T	completewith	next
A	goto	Dun Morogh,84.4,31.1,25
S	
T	completewith	next
A	goto	Loch Modan,24.134,18.208
A	vendor	
A	target	Gothor Brumn
S	
A	group	
A	goto	Loch Modan,24.764,18.397
A	target	Mountaineer Stormpike
A	accept	307
S	
T	completewith	ThelsamarFirst
A	collect	3172,3,418,1
A	mob	+Mountain Boar
A	collect	3173,3,418,1
A	mob	+Elder Black Bear
A	collect	3174,3,418,1
A	mob	+Forest Lurker
S	
T	completewith	next
A	goto	Loch Modan,34.828,49.283,130
S	
T	label	ThelsamarFirst
A	goto	Loch Modan,34.828,49.283
A	target	Vidra Hearthstove
A	accept	418
S	
T	completewith	StormpikeO
A	abandon	1338
S	
T	completewith	next
A	goto	Loch Modan,34.757,48.618
A	vendor	
A	target	Yanni Stoutheart
S	
T	label	StormpikeO
A	goto	Loch Modan,35.534,48.404
A	vendor	
A	vendor	
A	target	Innkeeper Hearthstove
S	
A	line	Loch Modan,36.72,41.97,37.24,43.19,37.33,45.63,36.77,46.20,35.19,46.88,32.67,49.71,35.19,46.88,36.77,46.20,37.33,45.63,37.24,43.19,36.72,41.97
A	goto	Loch Modan,36.72,41.97,15,0
A	goto	Loch Modan,37.24,43.19,15,0
A	goto	Loch Modan,37.33,45.63,15,0
A	goto	Loch Modan,36.77,46.20,15,0
A	goto	Loch Modan,35.19,46.88,15,0
A	goto	Loch Modan,32.67,49.71,20,0
A	goto	Loch Modan,36.77,46.20
A	accept	416
A	accept	1339
A	target	Mountaineer Kadrell
S	
A	group	
T	completewith	BraveSoul
A	collect	3172,3,418,1
A	mob	+Mountain Boar
A	collect	3173,3,418,1
A	mob	+Elder Black Bear
A	collect	3174,3,418,1
A	mob	+Forest Lurker
S	
A	solo	
T	completewith	StormpikeStop
A	collect	3172,3,418,1
A	mob	+Mountain Boar
A	collect	3173,3,418,1
A	mob	+Elder Black Bear
A	collect	3174,3,418,1
A	mob	+Forest Lurker
S	
A	group	
T	completewith	MinerGear
A	complete	416,1
A	mob	Tunnel Rat Scout
A	mob	Tunnel Rat Vermin
A	mob	Tunnel Rat Forager
A	mob	Tunnel Rat Geomancer
A	mob	Tunnel Rat Digger
A	mob	Tunnel Rat Surveyor
S	
A	group	
T	label	BraveSoul
T	completewith	next
A	goto	Loch Modan,35.50,18.97,20
S	
A	group	
T	label	MinerGear
A	goto	Loch Modan,35.93,22.55
A	complete	307,1
S	
A	group	
T	completewith	StormpikeStop
A	collect	3172,3,418,1
A	mob	+Mountain Boar
A	collect	3173,3,418,1
A	mob	+Elder Black Bear
A	collect	3174,3,418,1
A	mob	+Forest Lurker
S	Paladin/Warrior
A	goto	Loch Modan,42.867,9.885
A	vendor	
A	target	Nillen Andemar
S	
A	goto	Loch Modan,25.05,30.19,0
A	goto	Loch Modan,26.06,43.44,0
A	goto	Loch Modan,37.71,16.84,0
A	goto	Loch Modan,37.71,16.84,50,0
A	goto	Loch Modan,35.48,16.82,50,0
A	goto	Loch Modan,25.05,30.19,50,0
A	goto	Loch Modan,26.06,43.44,50,0
A	goto	Loch Modan,37.71,16.84,50,0
A	goto	Loch Modan,35.48,16.82
A	complete	416,1
A	collect	2589,10,1644,1,1 << Paladin
A	mob	Tunnel Rat Scout
A	mob	Tunnel Rat Vermin
A	mob	Tunnel Rat Forager
A	mob	Tunnel Rat Geomancer
A	mob	Tunnel Rat Digger
A	mob	Tunnel Rat Surveyor
S	
T	completewith	StormpikeDelivery
T	label	StormpikeStop
A	goto	Loch Modan,24.134,18.208
A	vendor	
A	target	Gothor Brumn
S	
A	group	
A	goto	Loch Modan,24.77,18.40
A	turnin	307
A	target	Mountaineer Stormpike
S	
T	label	StormpikeDelivery
A	goto	Loch Modan,24.77,18.40
A	turnin	1339
A	accept	1338
A	target	Mountaineer Stormpike
S	
A	collect	3173,3,418,1
A	mob	+Elder Black Bear
A	goto	Loch Modan,26.9,10.7,90,0
A	goto	Loch Modan,30.9,10.6,90,0
A	goto	Loch Modan,28.6,15.4,90,0
A	goto	Loch Modan,30.5,26.6,90,0
A	goto	Loch Modan,33.4,30.3,90,0
A	goto	Loch Modan,39.4,33.3,90,0
A	goto	Loch Modan,26.9,10.7,90,0
A	goto	Loch Modan,30.9,10.6,90,0
A	goto	Loch Modan,28.6,15.4,90,0
A	goto	Loch Modan,30.5,26.6,90,0
A	goto	Loch Modan,33.4,30.3,90,0
A	goto	Loch Modan,39.4,33.3,90,0
A	goto	Loch Modan,26.9,10.7
A	collect	3172,3,418,1
A	mob	+Mountain Boar
A	goto	Loch Modan,38.0,34.9,90,0
A	goto	Loch Modan,37.1,39.8,90,0
A	goto	Loch Modan,29.8,35.9,90,0
A	goto	Loch Modan,27.7,25.3,90,0
A	goto	Loch Modan,28.6,22.6,90,0
A	goto	Loch Modan,38.0,34.9,90,0
A	goto	Loch Modan,37.1,39.8,90,0
A	goto	Loch Modan,29.8,35.9,90,0
A	goto	Loch Modan,27.7,25.3,90,0
A	goto	Loch Modan,28.6,22.6,90,0
A	goto	Loch Modan,38.0,34.9
A	collect	3174,3,418,1
A	goto	Loch Modan,31.9,16.4,90,0
A	goto	Loch Modan,28.0,20.6,90,0
A	goto	Loch Modan,33.8,40.5,90,0
A	goto	Loch Modan,36.2,30.9,90,0
A	goto	Loch Modan,39.0,32.1,90,0
A	goto	Loch Modan,31.9,16.4,90,0
A	goto	Loch Modan,28.0,20.6,90,0
A	goto	Loch Modan,33.8,40.5,90,0
A	goto	Loch Modan,36.2,30.9,90,0
A	goto	Loch Modan,39.0,32.1,90,0
A	goto	Loch Modan,31.9,16.4
A	mob	+Forest Lurker
S	
A	line	Loch Modan,36.72,41.97,37.24,43.19,37.33,45.63,36.77,46.20,35.19,46.88,32.67,49.71,35.19,46.88,36.77,46.20,37.33,45.63,37.24,43.19,36.72,41.97
A	goto	Loch Modan,36.72,41.97,15,0
A	goto	Loch Modan,37.24,43.19,15,0
A	goto	Loch Modan,37.33,45.63,15,0
A	goto	Loch Modan,36.77,46.20,15,0
A	goto	Loch Modan,35.19,46.88,15,0
A	goto	Loch Modan,32.67,49.71,20,0
A	goto	Loch Modan,36.77,46.20
A	target	Mountaineer Kadrell
A	turnin	416
S	
A	target	Vidra Hearthstove
A	goto	Loch Modan,34.828,49.283
A	turnin	418
S	
A	goto	Loch Modan,34.757,48.618
A	collect	4470,1
A	collect	4471,1
A	target	Yanni Stoutheart
S	
A	goto	Loch Modan,33.938,50.954
A	fp	Thelsamar
A	target	Thorgrum Borrelson
S	
A	goto	Loch Modan,22.071,73.127
A	target	Mountaineer Cobbleflint
A	accept	224
S	
A	goto	Loch Modan,23.233,73.675
A	target	Captain Rugelfuss
A	accept	267
S	
T	completewith	next
A	goto	Loch Modan,29.9,68.2,45,0
A	goto	Loch Modan,30.76,69.97,20
S	
A	goto	Loch Modan,27.01,48.74,0
A	goto	Loch Modan,27.68,56.83,0
A	goto	Loch Modan,33.35,71.59,0
A	goto	Loch Modan,31.54,74.96,0
A	goto	Loch Modan,33.35,71.59,50,0
A	goto	Loch Modan,31.54,74.96,45,0
A	goto	Loch Modan,33.88,76.58,45,0
A	goto	Loch Modan,27.01,48.74,40,0
A	goto	Loch Modan,27.68,56.83,40,0
A	goto	Loch Modan,33.35,71.59,50,0
A	goto	Loch Modan,31.54,74.96,45,0
A	goto	Loch Modan,33.88,76.58
A	complete	224,1
A	mob	+Stonesplinter Trogg
A	complete	224,2
A	mob	+Stonesplinter Scout
A	complete	267,1
A	mob	+Stonesplinter Trogg
A	mob	+Stonesplinter Scout
A	collect	2589,10,1644,1,1 << Paladin
A	mob	+Stonesplinter Trogg
A	mob	+Stonesplinter Scout
S	
A	target	Mountaineer Cobbleflint
A	goto	Loch Modan,22.071,73.127
A	turnin	224
S	
T	label	TroggT
A	goto	Loch Modan,23.233,73.675
A	target	Captain Rugelfuss
A	turnin	267
S	
A	goto	Loch Modan,33.938,50.954
A	fly	Ironforge
A	target	Thorgrum Borrelson
S	Priest
A	goto	Ironforge,23.141,15.922
A	collect	5208,1
A	target	Ardwyn Cailen
S	Priest
A	goto	Ironforge,25.204,10.749
A	trainer	
A	target	Toldren Deepiron
S	Rogue
A	goto	Ironforge,51.494,15.335
A	trainer	
A	target	Fenthwick
S	Rogue
A	goto	Ironforge,61.170,89.539
A	train	198
A	target	Buliwyf Stonehand
S	Hunter
A	goto	Ironforge,69.865,82.886
A	trainer	
A	target	Regnus Thundergranite
S	Warrior
A	goto	Ironforge,65.907,88.409
A	trainer	
A	target	Bilban Tosslespanner
S	Warrior
A	goto	Ironforge,61.170,89.539
A	train	199
A	target	Buliwyf Stonehand
S	Warrior
A	goto	Ironforge,62.551,88.699
A	vendor	
A	target	Kelomir Ironhand
S	
A	goto	Ironforge,74.40,51.10,30,0
A	goto	Ironforge,74.40,51.10,0
A	target	Monty
A	accept	6661
S	
A	use	17117
A	complete	6661,1
A	mob	Deeprun Rat
S	
A	target	Monty
A	turnin	6661
A	timer	11,Deeprun Rat Roundup RP
A	accept	6662
S	
T	completewith	next
A	zone	Stormwind City
S	
A	turnin	6662
S	
T	completewith	next
A	zone	Stormwind City
S	
A	target	Grimand Elmore
A	goto	StormwindClassic,51.757,12.091
A	accept	353
S	
A	target	Furen Longbeard
A	goto	StormwindClassic,58.091,16.552
A	turnin	1338
S	Druid
A	goto	StormwindClassic,20.898,55.491
A	trainer	
A	target	Sheldras Moontree
S	Druid
T	ah	
A	goto	Stormwind City,53.612,59.764
A	collect	2449,5,6123,1
A	collect	729,3,38,1
A	collect	730,3,38,1
A	collect	731,3,38,1
A	collect	732,3,38,1
A	collect	723,8,22,1
A	collect	814,5,103,1
A	target	Auctioneer Jaxon
S	!Druid
T	ah	
A	goto	Stormwind City,53.612,59.764
A	collect	729,3,38,1
A	collect	730,3,38,1
A	collect	731,3,38,1
A	collect	732,3,38,1
A	collect	723,8,22,1
A	collect	814,5,103,1
A	target	Auctioneer Jaxon
S	
A	goto	StormwindClassic,55.724,65.401
A	vendor	
A	target	Keldric Boucher
S	
A	goto	StormwindClassic,66.277,62.137
A	fp	Stormwind
A	target	Dungar Longdrink
E
G	Guides/SurvivalGuide/A-Classic-Alliance-11-20.lua
M	hardcore	
M	classic	
M	tbc	
M	selector	Alliance
M	name	13-15 Westfall
M	version	1
M	group	RestedXP Survival Guide (A)
M	subgroup	RXP Survival Guide 1-20
M	defaultfor	Human/Gnome/Dwarf/NightElf
M	next	15-18 Darkshore
S	
T	sticky	
A	goto	Elwynn Forest,19.00,81.00
A	zone	Westfall
S	
A	goto	Westfall,59.95,19.35
A	target	Farmer Furlbrow
A	accept	64
A	accept	109
S	
A	goto	Westfall,59.92,19.42
A	target	Verna Furlbrow
A	accept	36
A	accept	151
S	
T	completewith	SalmaS
A	goto	Westfall,56.04,31.23,65
S	
A	goto	Westfall,56.04,31.23
A	target	Farmer Saldean
A	accept	9
S	
T	label	SalmaS
A	goto	Westfall,56.40,30.50
A	turnin	36
A	target	Salma Saldean
A	accept	38
A	accept	22
S	Human
T	label	Lewis
A	target	Quartermaster Lewis
A	goto	Westfall,57.00,47.17
A	turnin	6285
S	
A	goto	Westfall,56.33,47.52
A	target	Gryan Stoutmantle
A	turnin	109
A	isOnQuest	109
S	
A	goto	Westfall,56.33,47.52
A	target	Gryan Stoutmantle
A	accept	12
S	
T	era	
A	goto	Westfall,56.42,47.62
A	target	Captain Danuvin
A	accept	102
S	Human
T	requires	Lewis
A	goto	Westfall,54.00,53.00
A	target	Scout Galiaan
A	accept	153
S	!Human
A	target	Scout Galiaan
A	goto	Westfall,54.00,53.00
A	accept	153
S	
A	goto	Westfall,52.86,53.71
A	vendor	
A	target	Innkeeper Heather
S	
T	completewith	bennytime
A	complete	151,1
S	
T	completewith	HarvestW
A	collect	729,3,38,1
A	mob	+Young Fleshripper
A	mob	+Fleshripper
A	collect	731,3,38,1
A	mob	+Young Goretusk
A	mob	+Goretusk
A	collect	723,8,22,1
A	mob	+Young Goretusk
A	mob	+Goretusk
S	
A	goto	Westfall,48.21,46.70,60,0
A	goto	Westfall,46.74,52.87,60,0
A	goto	Westfall,50.74,40.07,60,0
A	goto	Westfall,46.21,38.26,60,0
A	goto	Westfall,41.21,40.75,60,0
A	goto	Westfall,44.57,26.09,60,0
A	goto	Westfall,48.21,46.70
A	goto	Westfall,41.21,40.75
A	complete	12,1
A	mob	+Defias Trapper
A	complete	12,2
A	mob	+Defias Smuggler
A	complete	153,1
A	mob	+Defias Trapper
A	mob	+Defias Smuggler
S	
T	label	bennytime
A	goto	Westfall,49.34,19.27
A	complete	64,1
S	
T	completewith	next
A	complete	151,1
S	
T	era	
A	goto	Westfall,56.40,13.50,60,0
A	goto	Westfall,42.82,14.70,60,0
A	goto	Westfall,45.83,13.75,60,0
A	goto	Westfall,52.36,14.82,60,0
A	goto	Westfall,56.86,13.53,60,0
A	goto	Westfall,56.86,13.53,60,0
A	goto	Westfall,42.82,14.70,60,0
A	goto	Westfall,52.36,14.82,60,0
A	goto	Westfall,45.83,13.75
A	complete	102,1
A	mob	Riverpaw Gnoll
A	mob	Riverpaw Scout
S	
A	goto	Westfall,56.40,9.40,60,0
A	goto	Westfall,52.13,10.36,60,0
A	goto	Westfall,56.40,9.40,60,0
A	goto	Westfall,52.13,10.36,60,0
A	goto	Westfall,56.40,9.40
A	collect	730,3,38,1
A	mob	Murloc Raider
A	mob	Murloc Coastrunner
S	
A	goto	Westfall,57.48,13.58,60,0
A	goto	Westfall,57.23,19.78,60,0
A	goto	Westfall,52.13,33.22,60,0
A	goto	Westfall,57.06,34.47,60,0
A	goto	Westfall,57.23,19.78
A	complete	151,1
S	
T	era	
A	turnin	64
A	target	+Farmer Furlbrow
A	goto	Westfall,59.95,19.35
A	turnin	151
A	goto	Westfall,59.92,19.42
A	target	+Verna Furlbrow
S	
T	som	
A	turnin	64
A	target	+Farmer Furlbrow
A	goto	Westfall,59.95,19.35
A	turnin	151
A	goto	Westfall,59.92,19.42
A	target	+Verna Furlbrow
S	
A	goto	Westfall,56.40,30.50
A	turnin	22
A	isQuestComplete	22
A	target	Salma Saldean
S	
T	completewith	next
A	goto	Westfall,56.04,31.23
A	vendor	
A	target	Farmer Saldean
S	
T	label	HarvestW
A	goto	Westfall,53.84,32.00,60,0
A	goto	Westfall,50.80,21.76,80,0
A	goto	Westfall,44.47,35.35,80,0
A	goto	Westfall,53.84,32.00,80,0
A	goto	Westfall,50.80,21.76,80,0
A	goto	Westfall,44.47,35.35,80,0
A	goto	Westfall,53.84,32.00,60,0
A	goto	Westfall,44.47,35.35,60,0
A	goto	Westfall,50.80,21.76
A	complete	9,1
A	collect	732,3,38,1
A	collect	814,5,103,1
A	mob	Harvest Watcher
S	
A	goto	Westfall,52.49,42.11,75,0
A	goto	Westfall,53.67,46.07,75,0
A	goto	Westfall,61.60,45.55,75,0
A	goto	Westfall,60.36,27.38,75,0
A	goto	Westfall,54.63,19.20,75,0
A	goto	Westfall,49.09,26.92,75,0
A	goto	Westfall,47.89,42.94,75,0
A	goto	Westfall,54.42,40.38
A	collect	729,3,38,1
A	mob	+Young Fleshripper
A	mob	+Fleshripper
A	collect	731,3,38,1
A	mob	+Young Goretusk
A	mob	+Goretusk
A	collect	723,8,22,1
A	mob	+Young Goretusk
A	mob	+Goretusk
S	
A	target	Farmer Saldean
A	goto	Westfall,56.04,31.23
A	turnin	9
S	
A	target	Salma Saldean
A	goto	Westfall,56.40,30.50
A	turnin	38
A	turnin	22
S	
A	target	Gryan Stoutmantle
A	goto	Westfall,56.33,47.52
A	turnin	12
S	
A	target	Gryan Stoutmantle
A	goto	Westfall,56.33,47.52
A	accept	65
S	
A	target	Captain Danuvin
A	goto	Westfall,56.42,47.62
A	turnin	102
S	
A	target	Scout Galiaan
A	goto	Westfall,54.00,53.00
A	turnin	153
S	Druid
A	goto	Westfall,32.6,22.6,30,0
A	goto	Westfall,38.8,18.2,30,0
A	goto	Westfall,41.0,12.0,30,0
A	goto	Westfall,47.6,9.0,30,0
A	goto	Westfall,51.8,9.4,30,0
A	goto	Westfall,32.6,22.6
A	goto	Westfall,38.8,18.2,0
A	goto	Westfall,41.0,12.0,0
A	goto	Westfall,47.6,9.0,0
A	goto	Westfall,51.8,9.4,0
A	xp	16
S	Dwarf !Paladin/Gnome
T	label	end
A	hs	
S	Dwarf !Paladin/Gnome
T	hardcore	
A	goto	Loch Modan,33.94,50.95
A	fly	Ironforge
A	target	Thorgrum Borrelson
S	Human/Dwarf Paladin
T	label	end
A	goto	Westfall,56.55,52.64
A	fly	Ironforge
A	target	Thor
S	!NightElf
A	goto	Ironforge,55.093,58.269
A	train	3274
A	target	Nissa Firestone
S	Human Warrior
A	goto	Ironforge,62.0,89.6
A	train	2567
A	target	Bixi Wobblebonk
S	Dwarf Paladin
A	goto	Ironforge,24.55,4.49
A	trainer	
A	target	Beldruk Doombrow
S	Dwarf Paladin
T	completewith	next
A	goto	Ironforge,25.27,1.53,6,0
A	goto	Ironforge,24.35,11.90,10
S	Dwarf Paladin
A	goto	Ironforge,23.539,8.300
A	turnin	1784
A	accept	1785
A	target	Muiredon Battleforge
S	Dwarf Paladin
A	goto	Ironforge,27.63,12.19
A	turnin	1785
A	target	Tiza Battleforge
S	
A	goto	Ironforge,39.553,57.478
A	turnin	291
A	target	Senator Barin Redstone
A	isOnQuest	291
S	
T	ah	
A	goto	Ironforge,25.800,75.500,-1
A	goto	Ironforge,24.200,74.600,-1
A	goto	Ironforge,23.800,71.800,-1
A	collect	5469,5,2178,1
A	collect	12238,6,1141,1
A	target	Auctioneer Lympkin
A	target	Auctioneer Redmuse
A	target	Auctioneer Buckler
A	zoneskip	Ironforge,1
S	!NightElf
T	hardcore	
A	goto	Dun Morogh,53.5,34.9
A	zone	Dun Morogh
S	!NightElf
T	hardcore	
T	completewith	next
A	goto	Dun Morogh,59.43,42.85,150
S	!NightElf
T	hardcore	
A	goto	Dun Morogh,59.5,42.8,40,0
A	goto	Dun Morogh,60.4,44.1,40,0
A	goto	Dun Morogh,61.1,44.1,40,0
A	goto	Dun Morogh,61.2,42.3,40,0
A	goto	Dun Morogh,60.8,40.9,40,0
A	goto	Dun Morogh,59.0,39.5,40,0
A	goto	Dun Morogh,60.3,38.6,40,0
A	goto	Dun Morogh,61.7,38.7,40,0
A	goto	Dun Morogh,65.7,21.6,40,0
A	goto	Dun Morogh,65.8,12.5,40,0
A	goto	Dun Morogh,65.6,10.8,40,0
A	goto	Dun Morogh,66.5,10.0,40,0
A	goto	Dun Morogh,66.9,8.5,40,0
A	goto	Wetlands,20.6,67.2,50,0
A	goto	Wetlands,17.7,67.7,40,0
A	goto	Wetlands,16.8,65.3,40,0
A	goto	Wetlands,15.1,64.0,40,0
A	goto	Wetlands,12.1,60.3,40,0
A	link	https://www.youtube.com/watch?v=9afQTimaiZQ
A	goto	Wetlands,12.1,60.3,80
A	mob	Wetlands Crocolisk
A	mob	Young Wetlands Crocolisk
A	mob	Bluegill Raider
S	!NightElf
A	money	<0.08
A	goto	Wetlands,10.4,56.0,15,0
A	goto	Wetlands,10.1,56.9,15,0
A	goto	Wetlands,10.6,57.2,15,0
A	goto	Wetlands,10.761,56.737
A	vendor	
A	target	Neal Allen
A	bronzetube	
S	!NightElf
A	goto	Wetlands,10.43,61.01,10,0
A	goto	Wetlands,10.496,60.201
A	vendor	
A	target	Samor Festivus
S	!NightElf
A	goto	Wetlands,9.49,59.69
A	fp	Wetlands
A	target	Shellei Brondir
S	Hunter !NightElf
A	goto	Wetlands,11.334,59.554
A	collect	3023,1
A	target	Murndan Derth
S	!NightElf
A	goto	Wetlands,7.95,56.38
A	vendor	
A	target	Dewin Shimmerdawn
S	!NightElf
T	completewith	next
A	goto	Wetlands,7.10,57.96,30,0
A	goto	Wetlands,4.61,57.26,15
S	!NightElf
A	zone	Darkshore
S	NightElf !Druid
A	goto	Westfall,56.556,52.643
A	fp	Westfall
A	fly	Stormwind
A	target	Thor
S	Druid
T	completewith	next
A	cast	18960
A	zoneskip	Moonglade
S	Druid
A	goto	Moonglade,44.1444,45.227
A	skipgossip	1
A	fly	Teldrassil
A	target	Silva Fil'naveth
S	Druid
T	completewith	next
A	goto	Teldrassil,55.889,89.456
A	zone	Darnassus
S	Druid
A	goto	Darnassus,35.375,8.405
A	accept	6121
A	accept	26
A	trainer	
A	target	Mathrengyl Bearwalker
S	Druid
T	completewith	next
A	cast	18960
A	zoneskip	Moonglade
S	Druid
A	goto	Moonglade,56.21,30.63
A	turnin	6121
A	accept	6122
A	turnin	26
A	accept	29
A	target	Dendrite Starblaze
S	Druid
A	goto	Moonglade,52.6,51.6
A	collect	15877,1,29,1
S	Druid
T	completewith	next
A	cast	18960
S	Druid
A	goto	Moonglade,36.026,41.374
A	use	15877
A	complete	29,1
S	Druid
A	goto	Moonglade,36.517,40.104
A	turnin	29
A	target	Tajarri
A	accept	272
S	NightElf Priest
A	goto	StormwindClassic,38.550,26.853
A	trainer	
A	target	Brother Joshua
S	NightElf Warrior
A	goto	StormwindClassic,57.547,57.076
A	vendor	
A	target	Gunther Weller
S	NightElf Rogue
A	goto	StormwindClassic,57.547,57.076
A	vendor	
A	target	Gunther Weller
S	NightElf Rogue
A	target	Woo Ping
A	goto	StormwindClassic,57.130,57.704
A	train	201
S	NightElf Hunter
A	goto	StormwindClassic,49.990,57.641
A	collect	3026,1
A	target	Frederick Stover
S	NightElf
A	goto	StormwindClassic,43.065,26.156
A	train	3274
A	target	Shaina Fuller
S	NightElf Warrior
A	goto	StormwindClassic,76.08,50.14,15,0
A	goto	StormwindClassic,80.22,45.37,15,0
A	goto	StormwindClassic,78.68,45.79
A	trainer	
A	target	Wu Shen
A	target	Ilsa Corbin
S	NightElf Rogue
A	goto	StormwindClassic,74.64,52.82
A	trainer	
A	target	Osborne the Night Man
S	NightElf Hunter
A	goto	StormwindClassic,61.609,15.269
A	trainer	
A	target	Einris Brightspear
S	NightElf
A	hs	
E
G	Guides/SurvivalGuide/A-Classic-Alliance-11-20.lua
M	hardcore	
M	classic	
M	tbc	
M	selector	Alliance
M	name	15-18 Darkshore
M	version	1
M	group	RestedXP Survival Guide (A)
M	subgroup	RXP Survival Guide 1-20
M	next	18-19 Loch Modan
S	
T	map	Darkshore
A	target	Gwennyth Bly'Leggonde
A	goto	Darkshore,36.71,44.98,5,0
A	goto	Felwood,19.10,20.63
A	accept	3524
S	!NightElf
A	target	Caylais Moonfeather
A	goto	Darkshore,36.336,45.574
A	fp	Auberdine
S	!NightElf
A	goto	Darkshore,37.04,44.13
A	home	
A	target	Innkeeper Shaussiy
S	
T	completewith	next
A	goto	Darkshore,36.70,43.78,5
S	
T	map	Darkshore
A	goto	Felwood,19.51,18.97
A	accept	983
A	target	Wizbang Cranktoggle
S	
T	map	Darkshore
A	goto	Felwood,21.63,18.15
A	accept	2118
A	target	Tharnariun Treetender
S	
T	map	Darkshore
T	label	BigThreat
A	goto	Felwood,22.24,18.22
A	accept	984
A	target	Terenthis
S	
T	optional	
A	goto	Darkshore,36.096,44.931
A	accept	1141
A	turnin	1141
A	itemcount	12238,6
A	target	Gubber Blump
S	
T	completewith	RabidThistle
A	goto	Darkshore,35.88,47.01,0
A	goto	Darkshore,36.50,53.30,0
A	goto	Darkshore,35.72,55.84,0
A	complete	983,1
A	mob	Pygmy Tide Crawler
A	mob	Young Reef Crawler
S	
T	map	Darkshore
A	goto	Felwood,18.81,26.69
A	complete	3524,1
S	
T	map	Darkshore
A	goto	Felwood,22.39,29.45
A	complete	984,1
S	
T	label	RabidThistle
A	goto	Darkshore,38.47,57.92,50,0
A	goto	Darkshore,39.79,58.33,50,0
A	goto	Darkshore,38.86,60.72,50,0
A	goto	Darkshore,38.47,57.92
A	use	7586
A	complete	2118,1
A	unitscan	Rabid Thistle Bear
S	
A	goto	Darkshore,36.53,53.39,55,0
A	goto	Darkshore,36.38,55.96,55,0
A	goto	Darkshore,35.11,54.69,55,0
A	goto	Darkshore,35.79,47.35,55,0
A	goto	Darkshore,36.53,53.39
A	complete	983,1
A	mob	Pygmy Tide Crawler
A	mob	Young Reef Crawler
S	
T	map	Darkshore
A	goto	Felwood,19.13,21.39
A	turnin	983
S	
T	map	Darkshore
T	era/som	
A	goto	Felwood,19.13,21.39
A	accept	1001
S	
T	map	Darkshore
A	target	Gwennyth Bly'Leggonde
A	goto	Darkshore,36.71,44.98,10,0
A	goto	Felwood,19.10,20.63
A	turnin	3524
A	accept	4681
S	
T	completewith	next
A	goto	Darkshore,36.88,44.10,8,0
A	goto	Darkshore,36.01,43.77,10
S	
T	map	Darkshore
A	goto	Felwood,18.10,18.48
A	accept	963
A	target	Cerellean Whiteclaw
S	
T	completewith	next
A	goto	1439,32.432,43.744,15
S	
T	completewith	washed1
A	goto	Darkshore,33.59,40.36,0
A	goto	Darkshore,30.94,45.79,0
A	goto	Darkshore,33.03,48.13,0
A	complete	1001,1
A	mob	Darkshore Thresher
S	
T	map	Darkshore
A	goto	Felwood,13.63,21.44
A	complete	4681,1
S	
T	map	Darkshore
T	label	washed1
A	goto	Darkshore,36.71,44.98,10,0
A	goto	Felwood,19.10,20.63
A	turnin	4681
A	target	Gwennyth Bly'Leggonde
S	
A	group	
T	map	Darkshore
A	target	Barithras Moonshade
A	goto	Felwood,19.90,18.40
A	accept	947
S	
T	map	Darkshore
A	target	Sentinel Glynda Nal'Shea
A	goto	Felwood,20.34,18.12
A	accept	4811
S	
T	map	Darkshore
A	target	Tharnariun Treetender
A	goto	Felwood,21.63,18.15
A	turnin	2118
A	accept	2138
S	
T	map	Darkshore
A	target	Terenthis
A	goto	Felwood,22.24,18.22
A	turnin	984
A	accept	985
A	accept	4761
S	
T	map	Darkshore
A	target	Gorbold Steelhand
A	goto	Felwood,20.80,15.58
A	accept	982
S	
T	map	Darkshore
A	target	Thundris Windweaver
A	goto	Felwood,19.98,14.40
A	turnin	4761
A	accept	4762
A	accept	958
A	accept	954
S	
T	era/som	
T	completewith	MistVeil
A	goto	Darkshore,35.44,35.83,55,0
A	goto	Darkshore,35.71,32.27,55,0
A	goto	Darkshore,35.44,35.83,0
A	goto	Darkshore,35.71,32.27,0
A	goto	Darkshore,36.70,30.00,0
A	goto	Darkshore,38.73,28.25,0
A	goto	Darkshore,40.17,28.76,0
A	complete	1001,1
A	mob	Darkshore Thresher
S	
T	completewith	next
A	goto	Darkshore,38.95,29.36,30
S	
T	map	Darkshore
A	goto	Darkshore,38.95,29.36,10,0
A	goto	Felwood,20.94,1.49
A	complete	982,1
S	
T	completewith	next
A	goto	Darkshore,40.30,27.56,30
S	
T	label	MistVeil
A	goto	Darkshore,40.30,27.56,10,0
A	goto	Darkshore,39.63,27.45
A	complete	982,2
S	
A	goto	Darkshore,40.17,28.76,0
A	goto	Darkshore,38.73,28.25,0
A	goto	Darkshore,36.70,30.00,0
A	goto	Darkshore,40.17,28.76,55,0
A	goto	Darkshore,38.73,28.25,55,0
A	goto	Darkshore,36.70,30.00,55,0
A	goto	Darkshore,35.71,32.27,55,0
A	goto	Darkshore,35.44,35.83,55,0
A	goto	Darkshore,35.71,32.27,55,0
A	goto	Darkshore,35.44,35.83
A	complete	1001,1
A	mob	Darkshore Thresher
S	
T	map	Darkshore
T	era/som	
A	goto	Felwood,25.19,1.29
A	turnin	1001
A	accept	1002
S	
T	map	Darkshore
A	goto	Felwood,25.15,4.61
A	accept	4723
S	Druid
T	completewith	cure1
A	collect	2449,5,6123,1
S	
T	completewith	Ameth
A	collect	5469,5,2178,1
A	mob	Foreststrider Fledgling
A	mob	Foreststrider
S	
T	era/som	
T	completewith	Ameth
A	complete	1002,1
A	unitscan	Moonstalker;Moonstalker Runt
S	
T	completewith	bears1
A	complete	2138,1
A	mob	Rabid Thistle Bear
S	
A	goto	Darkshore,44.18,20.60
A	accept	4725
S	
A	goto	Darkshore,50.81,25.50
A	use	12350
A	complete	4762,1
S	
T	map	Darkshore
T	completewith	next
A	goto	Felwood,27.70,10.03,60
S	
T	map	Darkshore
T	label	bears1
A	goto	Felwood,27.70,10.03
A	turnin	954
A	accept	955
A	target	Asterion
S	
A	goto	Darkshore,44.78,37.91,40,0
A	goto	Darkshore,45.43,39.15,40,0
A	goto	Darkshore,46.30,39.01,40,0
A	goto	Darkshore,47.36,36.86,40,0
A	goto	Darkshore,44.80,36.91,40,0
A	goto	Darkshore,46.30,39.01
A	complete	955,1
A	mob	Wild Grell
A	mob	Vile Sprite
S	
T	map	Darkshore
A	goto	Felwood,27.70,10.03
A	turnin	955
A	accept	956
A	target	Asterion
S	
A	goto	Darkshore,45.88,38.56,40,0
A	goto	Darkshore,46.76,39.13,40,0
A	goto	Darkshore,47.69,36.73,40,0
A	goto	Darkshore,45.07,36.76
A	complete	956,1
A	mob	Deth'ryll Satyr
S	
T	map	Darkshore
A	goto	Felwood,27.70,10.03
A	turnin	956
A	accept	957
A	target	Asterion
S	!NightElf
T	map	Darkshore
A	goto	Felwood,31.29,24.14
A	collect	6889,10,2178,1,0x21,cooking
A	complete	4811,1
S	NightElf
T	map	Darkshore
A	goto	Felwood,31.29,24.14
A	complete	4811,1
S	
A	goto	Darkshore,45.34,49.70,60,0
A	goto	Darkshore,45.48,45.24,60,0
A	goto	Darkshore,42.73,45.67,60,0
A	goto	Darkshore,45.34,49.70,60,0
A	goto	Darkshore,45.48,45.24,60,0
A	goto	Darkshore,42.73,45.67
A	collect	6889,10,2178,1,0x20,cooking
A	mob	Young Moonkin
A	mob	Raging Moonkin
A	mob	Moonkin Oracle
A	mob	Moonkin
S	
T	completewith	next
A	goto	Darkshore,40.30,59.70,70
S	
T	label	Ameth
A	target	Sentinel Tysha Moonblade
A	goto	Darkshore,40.30,59.70
A	accept	953
S	
T	completewith	TheLay
A	complete	963,1
A	unitscan	Anaya Dawnrunner
S	
T	completewith	TheLay
A	complete	958,1
A	mob	Cursed Highborne
A	mob	Writhing Highborne
A	mob	Wailing Highborne
S	
T	map	Darkshore
A	goto	Felwood,25.98,40.62
A	complete	953,2
S	
T	map	Darkshore
A	goto	Felwood,25.66,39.11
A	complete	957,1
S	
T	label	TheLay
A	goto	Darkshore,43.30,58.70
A	complete	953,1
S	
T	completewith	next
A	complete	963,1
A	unitscan	Anaya Dawnrunner
S	
A	goto	Darkshore,41.91,57.92,50,0
A	goto	Darkshore,41.81,59.77,50,0
A	goto	Darkshore,41.98,62.13,50,0
A	goto	Darkshore,42.92,62.50,50,0
A	goto	Darkshore,43.30,58.70,50,0
A	goto	Darkshore,41.91,57.92,50,0
A	goto	Darkshore,41.81,59.77,50,0
A	goto	Darkshore,41.98,62.13,50,0
A	goto	Darkshore,42.92,62.50,50,0
A	goto	Darkshore,43.30,58.70
A	complete	958,1
A	mob	Cursed Highborne
A	mob	Writhing Highborne
A	mob	Wailing Highborne
S	
A	goto	Darkshore,41.91,57.92,50,0
A	goto	Darkshore,41.81,59.77,50,0
A	goto	Darkshore,41.98,62.13,50,0
A	goto	Darkshore,42.92,62.50,50,0
A	goto	Darkshore,43.30,58.70,50,0
A	goto	Darkshore,41.91,57.92,50,0
A	goto	Darkshore,41.81,59.77,50,0
A	goto	Darkshore,41.98,62.13,50,0
A	goto	Darkshore,42.92,62.50,50,0
A	goto	Darkshore,43.30,58.70
A	complete	963,1
A	unitscan	Anaya Dawnrunner
S	
T	map	Darkshore
A	goto	Felwood,23.29,36.73
A	target	Sentinel Tysha Moonblade
A	turnin	953
S	
T	era/som	
T	completewith	ReturnAuber
A	complete	1002,1
A	unitscan	Moonstalker;Moonstalker Runt
S	
T	completewith	BearComplete
A	collect	5469,5,2178,1
A	mob	Foreststrider Fledgling
A	mob	Foreststrider
S	
T	completewith	Beached4728
A	complete	2138,1
A	mob	Rabid Thistle Bear
S	
A	goto	Darkshore,39.84,53.82,50,0
A	goto	Darkshore,40.03,56.24,50,0
A	goto	Darkshore,39.34,56.58,50,0
A	goto	Darkshore,39.84,53.82
A	complete	985,1
A	mob	+Blackwood Pathfinder
A	complete	985,2
A	mob	+Blackwood Windtalker
S	
T	map	Darkshore
A	goto	Felwood,22.39,29.45
A	xp	16
S	
T	map	Darkshore
A	goto	Felwood,19.64,39.52
A	accept	4722
S	
T	map	Darkshore
T	label	Beached4728
A	goto	Felwood,18.41,49.43
A	accept	4728
S	
T	label	BearComplete
A	goto	Darkshore,40.11,69.39,60,0
A	goto	Darkshore,43.37,68.78,70,0
A	goto	Darkshore,41.97,64.81,70,0
A	goto	Darkshore,38.51,64.72,70,0
A	goto	Darkshore,38.67,59.54,60,0
A	goto	Darkshore,40.11,69.39
A	complete	2138,1
A	mob	Rabid Thistle Bear
S	
A	goto	Darkshore,40.11,69.39,60,0
A	goto	Darkshore,43.37,68.78,70,0
A	goto	Darkshore,41.97,64.81,70,0
A	goto	Darkshore,38.51,64.72,70,0
A	goto	Darkshore,38.67,59.54,60,0
A	goto	Darkshore,40.11,69.39
A	collect	5469,5,2178,1
A	mob	Foreststrider Fledgling
A	mob	Foreststrider
S	
T	map	Darkshore
T	label	ReturnAuber
T	completewith	ManyBeached
A	goto	Felwood,18.50,19.87,100
S	
T	map	Darkshore
A	target	Gubber Blump
A	goto	Felwood,18.50,19.87
A	accept	1138
S	
T	map	Darkshore
T	label	ManyBeached
A	target	Gwennyth Bly'Leggonde
A	goto	Darkshore,36.71,44.98,5,0
A	goto	Felwood,19.10,20.63
A	turnin	4723
A	turnin	4728
A	turnin	4722
A	turnin	4725
S	
T	completewith	next
A	goto	Darkshore,36.88,44.10,8,0
A	goto	Darkshore,36.01,43.77,10
S	
T	map	Darkshore
A	isQuestComplete	963
A	target	Cerellean Whiteclaw
A	goto	Felwood,18.10,18.48
A	turnin	963
S	!NightElf !Mage !Paladin !Warlock
A	goto	Darkshore,33.17,40.17,40,0
A	goto	Darkshore,33.17,40.17,0
A	zone	Teldrassil
A	zoneskip	Darnassus
S	!NightElf !Mage !Paladin !Warlock
T	completewith	next
A	goto	Teldrassil,55.889,89.456
A	zone	Darnassus
S	!NightElf Hunter
A	goto	Darnassus,40.377,8.545
A	trainer	
A	target	Jocaste
S	!NightElf Priest
A	goto	Darnassus,37.901,82.742
A	trainer	
A	target	Jandria
S	!NightElf Warrior
A	goto	Darnassus,58.945,35.336
A	trainer	
A	target	Darnath Bladesinger
S	!NightElf Rogue
A	goto	Darnassus,31.21,17.72,8,0
A	goto	Darnassus,36.99,21.91
A	trainer	
A	target	Syurna
S	!NightElf Hunter/!NightElf Warrior
T	sticky	
A	skipgossip	11866,1
A	goto	Darnassus,57.56,46.72
A	train	264
A	train	227
A	target	Ilyenia Moonfire
S	!NightElf !Mage !Paladin !Warlock
A	goto	Darnassus,30.7,41.3,15
A	zoneskip	Darkshore
A	zoneskip	Teldrassil
S	!NightElf !Mage !Paladin !Warlock
A	goto	Teldrassil,58.39,94.01
A	fly	Darkshore
A	target	Vesprystus
S	
T	completewith	next
A	goto	Darkshore,38.109,41.170,5,0
A	goto	Darkshore,37.512,41.674
A	skill	cooking,10,1
A	target	Gorbold Steelhand
S	
T	completewith	ezstrider
A	skill	cooking,10,1
A	target	Gorbold Steelhand
S	
T	map	Darkshore
A	target	Gorbold Steelhand
A	goto	Felwood,20.80,15.58
A	turnin	982
S	
T	label	ezstrider
A	target	Alanndarian Nightsong
A	goto	Darkshore,37.70,40.70
A	accept	2178
A	turnin	2178
A	skill	cooking,<10,1
S	
T	map	Darkshore
A	target	Thundris Windweaver
A	goto	Felwood,19.98,14.40
A	turnin	958
A	turnin	4762
A	accept	4763
S	
T	map	Darkshore
A	target	Sentinel Glynda Nal'Shea
A	goto	Felwood,20.34,18.12
A	turnin	4811
A	accept	4812
S	
T	sticky	
T	label	tube1
A	goto	Darkshore,37.78,44.06
A	use	14338
A	complete	4812,1
S	
A	goto	Darkshore,37.78,44.06
A	use	12346
A	collect	12347,1,4763,1
S	
T	requires	tube1
T	map	Darkshore
A	target	Tharnariun Treetender
A	goto	Felwood,21.63,18.15
A	turnin	2138
A	accept	2139
S	
T	map	Darkshore
A	target	Terenthis
A	goto	Felwood,22.24,18.22
A	turnin	985
S	
T	map	Darkshore
A	target	Terenthis
A	goto	Felwood,22.24,18.22
A	accept	986
A	group	
S	
T	map	Darkshore
A	goto	Darkshore,39.26,43.04,5,0
A	goto	Felwood,21.86,18.30
A	accept	965
A	target	Sentinel Elissa Starbreeze
S	
T	era/som	
T	completewith	CliffCave
A	complete	1002,1
A	unitscan	Moonstalker;Moonstalker Runt
S	
T	map	Darkshore
T	completewith	next
A	goto	Felwood,31.29,24.14,15
S	
T	map	Darkshore
A	goto	Felwood,31.29,24.14
A	turnin	4812
A	accept	4813
S	
T	map	Darkshore
T	completewith	next
A	goto	Felwood,27.70,10.03,70
S	
T	map	Darkshore
A	target	Asterion
A	goto	Felwood,27.70,10.03
A	turnin	957
S	Paladin
A	goto	Darkshore,50.74,34.68
A	collect	2589,10,1,1644
A	mob	Blackwood Warrior
A	mob	Blackwood Totemic
S	
A	group	
A	goto	Darkshore,50.66,34.94
A	collect	12342,1,4763,1
S	
A	group	
A	goto	Darkshore,52.60,36.65,45,0
A	goto	Darkshore,51.48,38.26
A	complete	2139,1
A	mob	Den Mother
A	mob	Thistle Cub
S	
A	group	
A	goto	Darkshore,51.83,33.50
A	collect	12343,1,4763,1
S	
A	group	
T	label	Fruit
A	goto	Darkshore,52.86,33.41
A	collect	12341,1,4763,1
S	
A	group	
T	completewith	next
A	goto	Darkshore,52.38,33.39
A	cast	16072
A	timer	17,The Blackwood Corrupted RP
A	use	12347
S	
A	group	
A	goto	Darkshore,52.38,33.39
A	use	12347
A	complete	4763,1
A	mob	Xabraxxis
S	
A	group	<< !Druid
T	map	Darkshore
T	label	CliffCave
T	completewith	next
A	goto	Darkshore,54.99,32.04,30,0
A	goto	Darkshore,54.99,33.41,15
S	Druid
A	goto	Darkshore,54.99,33.41
A	complete	6122,1
S	
A	group	
A	goto	Darkshore,55.66,34.89
A	complete	947,1
A	complete	947,2
S	
A	group	
A	isQuestComplete	947
A	goto	Darkshore,54.81,32.92,30
S	
T	completewith	next
A	complete	1002,1
A	unitscan	Moonstalker;Moonstalker Runt
S	
T	map	Darkshore
A	target	Balthule Shadowstrike
A	goto	Winterspring,4.82,27.18
A	turnin	965
A	accept	966
S	!Paladin
A	goto	Darkshore,55.27,27.74,40,0
A	goto	Darkshore,56.92,27.27,40,0
A	goto	Darkshore,57.54,25.99,40,0
A	goto	Darkshore,56.92,27.27,40,0
A	goto	Darkshore,55.27,27.74
A	complete	966,1
A	mob	Dark Strand Fanatic
S	Paladin
A	goto	Darkshore,55.27,27.74,40,0
A	goto	Darkshore,56.92,27.27,40,0
A	goto	Darkshore,57.54,25.99,40,0
A	goto	Darkshore,56.92,27.27,40,0
A	goto	Darkshore,55.27,27.74
A	complete	966,1
A	collect	2589,10,1,1644
A	mob	Dark Strand Fanatic
S	
T	map	Darkshore
A	target	Balthule Shadowstrike
A	goto	Winterspring,4.82,27.18
A	turnin	966
A	accept	967
S	
A	group	3
T	map	Darkshore
T	completewith	next
A	goto	Winterspring,6.37,16.66,50
S	
A	group	3
T	map	Darkshore
A	goto	Winterspring,6.37,16.66
A	accept	2098
A	target	Gelkak Gyromast
S	
A	group	3
T	completewith	next
A	goto	Darkshore,56.10,16.88,0
A	complete	2098,3
A	mob	Raging Reef Crawler
A	mob	Encrusted Tide Crawler
S	
A	group	3
A	goto	Darkshore,54.93,12.19
A	complete	2098,2
A	mob	Greymist Oracle
A	mob	Greymist Tidehunter
S	
A	group	3
A	goto	Darkshore,55.59,16.98,45,0
A	goto	Darkshore,53.76,18.96,45,0
A	goto	Darkshore,51.34,22.00,45,0
A	goto	Darkshore,56.63,12.08
A	complete	2098,3
A	mob	Raging Reef Crawler
A	mob	Encrusted Tide Crawler
S	
A	group	3
T	sticky	
T	label	foreststriders
A	goto	Darkshore,59.29,13.22,55,0
A	goto	Darkshore,61.40,9.40,50,0
A	goto	Darkshore,61.51,12.66,50,0
A	goto	Darkshore,61.24,15.38,50,0
A	goto	Darkshore,61.40,9.40
A	complete	2098,1
A	mob	Giant Foreststrider
S	
A	group	
A	goto	Darkshore,61.40,9.40,45,0
A	goto	Darkshore,62.42,7.67
A	complete	986,1
A	complete	1002,1
A	mob	Moonstalker Sire
A	mob	Moonstalker Matriarch
A	mob	Moonstalker Runt
A	isOnQuest	986,1002
S	
A	group	3
T	map	Darkshore
T	requires	foreststriders
A	goto	Winterspring,6.37,16.66
A	turnin	2098
A	accept	2078
A	target	Gelkak Gyromast
S	
A	group	3
T	map	Darkshore
A	goto	Winterspring,5.59,21.09,10,0
A	goto	Winterspring,6.37,16.66
A	skipgossip	
A	complete	2078,1
A	link	https://youtu.be/1WRRmKYBr9s
A	mob	The Threshwackonator 4100
S	
A	group	3
T	map	Darkshore
A	goto	Winterspring,6.37,16.66
A	target	Gelkak Gyromast
A	turnin	2078
A	isQuestComplete	2078
S	
A	group	
T	sticky	
A	destroy	7442
S	
T	map	Darkshore
A	goto	Winterspring,3.10,20.90
A	accept	4727
S	Druid
A	goto	Darkshore,48.87,11.32
A	collect	15883,1,272,1
S	
T	completewith	next
A	complete	1138,1
A	mob	Encrusted Tide Crawler
A	mob	Reef Crawler
S	
T	map	Darkshore
A	goto	Winterspring,1.42,26.89
A	turnin	1002
A	accept	1003
S	
A	goto	Darkshore,51.50,22.26,50,0
A	goto	Darkshore,49.66,21.39
A	complete	1138,1
A	mob	Encrusted Tide Crawler
A	mob	Reef Crawler
S	
A	goto	Darkshore,50.74,34.68
A	xp	18-2750
A	mob	Blackwood Warrior
A	mob	Blackwood Totemic
S	
T	completewith	NorthDarkshore
T	map	Darkshore
A	goto	Felwood,18.50,19.87,100
A	cooldown	item,6948,<0
S	
T	completewith	next
A	hs	
A	cooldown	item,6948,>0,1
S	
T	map	Darkshore
A	target	Gwennyth Bly'Leggonde
A	goto	Darkshore,36.71,44.98,5,0
A	goto	Felwood,19.10,20.63
A	turnin	4727
S	
T	map	Darkshore
A	target	Gubber Blump
A	goto	Felwood,18.50,19.87
A	turnin	1138
S	
A	group	
T	map	Darkshore
A	target	Barithras Moonshade
A	goto	Felwood,19.90,18.40
A	turnin	947
A	accept	948
S	
T	map	Darkshore
T	label	NorthDarkshore
A	target	Sentinel Glynda Nal'Shea
A	goto	Darkshore,37.70,43.39
A	turnin	4813
S	
A	group	
T	map	Darkshore
A	target	Tharnariun Treetender
A	goto	Felwood,21.63,18.15
A	turnin	2139
S	
A	group	
A	target	Terenthis
A	goto	Darkshore,39.37,43.48
A	turnin	986
A	accept	993
S	
A	target	Alanndarian Nightsong
A	goto	Darkshore,37.70,40.70
A	accept	2178
A	turnin	2178
A	skill	cooking,<10,1
S	
A	group	
T	map	Darkshore
A	target	Thundris Windweaver
A	goto	Felwood,19.98,14.40
A	turnin	4763
S	Druid
A	goto	Darkshore,37.7,40.7
A	turnin	6122
A	target	Alanndarian Nightsong
A	accept	6123
S	Druid
T	label	cure1
A	goto	Darkshore,43.4,45.9,90,0
A	goto	Darkshore,43.3,49.1,90,0
A	goto	Darkshore,42.4,52.6,90,0
A	goto	Darkshore,45.7,50.3,90,0
A	goto	Darkshore,45.3,53.3
A	goto	Darkshore,43.4,45.9,0
A	goto	Darkshore,43.3,49.1,0
A	goto	Darkshore,42.4,52.6,0
A	goto	Darkshore,45.7,50.3,0
A	collect	6889,40,90,1,0x21,cooking
A	complete	6123,2
S	
A	goto	Darkshore,45.34,49.70,60,0
A	goto	Darkshore,45.48,45.24,60,0
A	goto	Darkshore,42.73,45.67,60,0
A	goto	Darkshore,45.34,49.70,60,0
A	goto	Darkshore,45.48,45.24,60,0
A	goto	Darkshore,42.73,45.67
A	collect	6889,40,90,1,0x20,cooking
A	mob	Young Moonkin
A	mob	Raging Moonkin
A	mob	Moonkin Oracle
A	mob	Moonkin
S	Druid
A	collect	2449,5,6123,1
S	Druid
T	requires	earthroot
A	goto	Darkshore,37.7,40.7
A	turnin	6123
A	accept	6124
A	target	Alanndarian Nightsong
S	Druid
A	goto	Darkshore,41.0,79.6
A	complete	6124,1
A	unitscan	Sickly Deer
S	Druid
T	completewith	next
A	cast	18960
A	zoneskip	Moonglade
S	Druid
A	goto	Moonglade,56.2,30.4
A	turnin	6124
A	accept	6125
A	target	Dendrite Starblaze
S	Druid
A	goto	Moonglade,52.53,40.57
A	trainer	
A	target	Loganaar
S	Druid
A	goto	Moonglade,44.1444,45.227
A	skipgossip	1
A	fly	Teldrassil
A	target	Silva Fil'naveth
A	zoneskip	Teldrassil
A	zoneskip	Darnassus
S	Druid
T	completewith	next
A	goto	Teldrassil,55.889,89.456
A	zone	Darnassus
S	Druid
A	goto	Darnassus,35.375,8.405
A	target	Mathrengyl Bearwalker
A	turnin	6125
S	Druid
A	goto	Darnassus,30.7,41.3
A	zoneskip	Darkshore
A	zoneskip	Teldrassil
S	Druid
A	goto	Teldrassil,58.39,94.01
A	fly	Darkshore
A	target	Vesprystus
S	
T	completewith	next
A	goto	1439,32.432,43.744,15
S	
A	goto	Darkshore,32.44,43.71
A	zone	Wetlands
A	zoneskip	Loch Modan
A	zoneskip	Dun Morogh
A	zoneskip	Ironforge
E
G	Guides/SurvivalGuide/A-Classic-Alliance-11-20.lua
M	hardcore	
M	classic	
M	tbc	
M	selector	Alliance
M	name	20-21 Darkshore/Ashenvale
M	version	1
M	group	RestedXP Survival Guide (A)
M	subgroup	RXP Survival Guide 1-20
M	next	21-23 Stonetalon/Ashenvale
S	Druid
T	completewith	next
A	cast	18960
A	zoneskip	Moonglade
S	Druid
A	goto	Moonglade,52.53,40.57
A	trainer	
A	target	Loganaar
S	
T	completewith	TheryluneE
A	hs	
A	zoneskip	Darkshore
A	zoneskip	Ashenvale
S	
A	goto	Darkshore,37.21,44.22
A	accept	4740
S	
T	map	Darkshore
A	target	Barithras Moonshade
A	goto	Felwood,19.90,18.40
A	accept	947
S	
A	goto	Darkshore,37.44,41.83
A	target	Archaeologist Hollee
A	accept	729
S	
T	map	Darkshore
A	target	Thundris Windweaver
A	goto	Felwood,19.98,14.40
A	accept	4763
S	
A	goto	Darkshore,37.78,44.06
A	use	12346
A	collect	12347,1,4763,1
S	
A	goto	Darkshore,38.326,43.040
A	turnin	3765
A	target	Gershala Nightwhisper
S	
T	map	Darkshore
A	target	Tharnariun Treetender
A	goto	Felwood,21.63,18.15
A	accept	2139
S	
A	goto	Darkshore,50.66,34.94
A	collect	12342,1,4763,1
S	
A	goto	Darkshore,52.60,36.65,45,0
A	goto	Darkshore,51.48,38.26
A	complete	2139,1
A	mob	Den Mother
A	mob	Thistle Cub
S	
A	goto	Darkshore,51.83,33.50
A	collect	12343,1,4763,1
S	
T	label	Fruit
A	goto	Darkshore,52.86,33.41
A	collect	12341,1,4763,1
S	
T	completewith	next
A	goto	Darkshore,52.38,33.39
A	cast	16072
A	timer	17,The Blackwood Corrupted RP
A	use	12347
S	
A	goto	Darkshore,52.38,33.39
A	use	12347
A	complete	4763,1
A	mob	Xabraxxis
S	
A	goto	Darkshore,55.66,34.89
A	complete	947,1
A	complete	947,2
S	
T	map	Darkshore
A	target	Thundris Windweaver
A	goto	Felwood,19.98,14.40
A	turnin	4763
S	
T	map	Darkshore
A	target	Barithras Moonshade
A	goto	Felwood,19.90,18.40
A	turnin	947
A	accept	948
S	
T	map	Darkshore
A	target	Tharnariun Treetender
A	goto	Felwood,21.63,18.15
A	turnin	2139
S	
A	target	Terenthis
A	goto	Darkshore,39.37,43.48
A	accept	986
S	
T	completewith	moonstalkers
A	complete	986,1
A	mob	Moonstalker Sire
A	mob	Moonstalker Matriarch
A	mob	Moonstalker Runt
S	
T	era/som	
T	completewith	Murkdeep
T	optional	
A	goto	Darkshore,40.23,81.28,0
A	complete	1003,1
A	isOnQuest	1003
A	mob	Grizzled Thistle Bear
S	
T	map	Darkshore
T	completewith	OnuGrove
A	goto	Felwood,27.00,55.59,80
S	
T	map	Darkshore
T	label	OnuGrove
A	goto	Felwood,27.00,55.59
A	turnin	952
A	turnin	948
A	accept	944
A	target	Onu
S	
T	completewith	next
T	label	MasterG
A	goto	Darkshore,38.54,86.05,60
S	
T	label	moonstalkers
A	goto	Darkshore,38.54,86.05
A	complete	944,1
S	
T	completewith	next
A	cast	5809
A	use	5251
S	
A	goto	Darkshore,38.54,86.05
A	use	5251
A	turnin	944
A	accept	949
S	
A	goto	Ashenvale,22.24,2.52
A	turnin	949
A	accept	950
S	
A	goto	Ashenvale,22.36,3.98
A	accept	945
A	target	Therylune
S	
A	goto	Darkshore,40.51,87.09
A	complete	945,1
A	isOnQuest	945
S	
A	destroy	5251
S	
A	goto	Darkshore,39.3,91.8,60,0
A	goto	Darkshore,37.38,91.87,100,0
A	goto	Darkshore,38.96,80.07,100,0
A	goto	Darkshore,43.82,82.08,100,0
A	goto	Darkshore,38.96,80.07,0
A	goto	Darkshore,39.3,91.8
A	complete	986,1
A	mob	Moonstalker Sire
A	mob	Moonstalker Matriarch
A	mob	Moonstalker Runt
S	
T	map	Darkshore
T	sticky	
T	label	prospector
A	goto	Felwood,18.08,64.03
A	turnin	729
A	target	Prospector Remtravel
S	
A	goto	Darkshore,35.72,83.69
A	accept	731,1
A	link	https://www.youtube.com/watch?v=crQAvyRIceU
A	target	Prospector Remtravel
S	
T	requires	prospector
A	link	https://www.youtube.com/watch?v=crQAvyRIceU
A	complete	731,1
A	isOnQuest	731
S	
A	goto	Ashenvale,13.97,4.10
A	accept	4733
A	link	https://youtu.be/lfQM3Q-Ag5A
S	
A	goto	Ashenvale,13.93,2.01
A	accept	4732
S	
T	map	Darkshore
A	goto	Felwood,13.47,64.01
A	accept	4731
S	
T	map	Darkshore
A	goto	Felwood,14.62,60.72
A	accept	4730
S	
T	label	Murkdeep
A	goto	Darkshore,36.64,76.53
A	complete	4740,1
A	unitscan	Murkdeep
A	mob	Greymist Warrior
A	mob	Greymist Hunter
A	mob	Greymist Coastrunner
S	
T	era/som	
A	goto	Darkshore,41.44,86.06,50,0
A	goto	Darkshore,41.77,84.60,50,0
A	goto	Darkshore,42.94,82.25,50,0
A	goto	Darkshore,43.59,80.02,50,0
A	goto	Darkshore,39.74,80.43,50,0
A	goto	Darkshore,38.00,83.55
T	optional	
A	complete	1003,1
A	isOnQuest	1003
A	mob	Grizzled Thistle Bear
S	
T	era/som	
A	goto	Darkshore,41.389,80.565
A	turnin	1003
A	isOnQuest	1003
S	
A	group	
T	completewith	next
A	goto	Darkshore,45.00,85.30,30
S	
A	group	
A	goto	Darkshore,45.00,85.30
A	turnin	993
A	accept	995
A	timer	20,Escape Through Stealth RP
A	target	Volcor
A	isQuestTurnedIn	986
S	
A	group	
A	goto	Darkshore,44.44,84.69
A	complete	995,1
A	isQuestTurnedIn	986
S	
T	map	Darkshore
A	goto	Felwood,27.00,55.59
A	target	Onu
A	turnin	951
A	isQuestComplete	951
S	
T	map	Darkshore
A	goto	Felwood,27.00,55.59
A	target	Onu
A	turnin	950
S	
T	map	Darkshore
A	goto	Felwood,27.96,55.76
A	target	Kerlonian Evershade
A	accept	5321
S	
A	isOnQuest	5321
A	goto	Darkshore,44.38,76.30
A	complete	5321,1
S	
T	completewith	tower
A	zone	Ashenvale
A	goto	Ashenvale,29.7,13.6
S	
A	goto	Ashenvale,27.26,35.58
A	use	13536
A	complete	5321,2
A	isOnQuest	5321
S	
A	target	Liladris Moonriver
A	goto	Ashenvale,27.26,35.58
A	turnin	5321
A	isQuestComplete	5321
S	
T	label	tower
A	target	Delgren the Purifier
A	goto	Ashenvale,26.19,38.69
A	turnin	967
S	
T	era/som	
A	target	Delgren the Purifier
A	goto	Ashenvale,26.19,38.69
A	accept	970
S	
A	target	Orendil Broadleaf
A	goto	Ashenvale,26.43,38.59
A	accept	1010
A	xp	<20,1
S	
T	era/som	
A	goto	Ashenvale,31.25,30.70
A	complete	970,1
A	mob	Dark Strand Cultist
A	mob	Dark Strand Adept
A	mob	Dark Strand Enforcer
A	mob	Dark Strand Excavator
S	
A	goto	Ashenvale,33.01,21.41,50,0
A	goto	Ashenvale,29.53,24.33,40,0
A	goto	Ashenvale,31.89,22.53
A	complete	1010,1
A	isOnQuest	1010
S	
T	era/som	
A	target	Delgren the Purifier
A	goto	Ashenvale,26.19,38.69
A	turnin	970
A	accept	973
S	
A	goto	Ashenvale,31.89,22.53
A	xp	20
S	
A	target	Orendil Broadleaf
A	goto	Ashenvale,26.43,38.59
A	accept	1010
S	
A	goto	Ashenvale,33.01,21.41,50,0
A	goto	Ashenvale,29.53,24.33,40,0
A	goto	Ashenvale,31.89,22.53
A	complete	1010,1
A	isOnQuest	1010
S	
A	target	Orendil Broadleaf
A	goto	Ashenvale,26.43,38.59
A	turnin	1010
A	accept	1020
S	
T	era/som	
A	target	Delgren the Purifier
A	goto	Ashenvale,26.19,38.69
A	turnin	970
A	accept	973
S	
T	completewith	next
A	goto	Ashenvale,25.49,39.59,25,0
A	goto	Ashenvale,25.98,41.72,25,0
A	goto	Ashenvale,26.88,44.47,30,0
A	goto	Ashenvale,28.16,47.68,60,0
A	goto	Ashenvale,34.40,48.00
A	subzone	415
S	
A	goto	Ashenvale,34.40,48.00
A	fp	Astranaar
A	target	Daelyshia
S	
A	target	Shindrell Swiftfire
A	goto	Ashenvale,34.67,48.83
A	accept	1008
S	
A	target	Sentinel Thenysil
A	goto	Ashenvale,34.89,49.79
A	accept	1070
S	
A	target	Faldreas Goeth'Shael
A	goto	Ashenvale,35.76,49.10
A	accept	1056
S	
A	target	Raene Wolfrunner
A	goto	Ashenvale,36.61,49.58
A	accept	991
S	
A	goto	Ashenvale,36.99,49.22
A	home	
A	target	Innkeeper Kimlya
S	
A	goto	Ashenvale,37.36,51.79
A	target	Pelturas Whitemoon
A	turnin	1020
S	
A	dungeon	WC
T	completewith	TravelRatchet
A	goto	Ashenvale,20.31,42.33,0
A	zone	The Barrens
A	mob	Saltspittle Warrior
A	mob	Saltspittle Muckdweller
A	mob	Saltspittle Oracle
A	mob	Saltspittle Puddlejumper
S	
A	dungeon	WC
T	label	TravelRatchet
A	goto	Ashenvale,69.71,86.87,50,0
A	goto	The Barrens,48.98,5.42,35,0
A	goto	The Barrens,49.07,12.80,50,0
A	goto	The Barrens,53.87,21.52,120,0
A	goto	The Barrens,59.15,25.48,120,0
A	goto	The Barrens,63.087,37.607
A	subzone	392
S	
A	dungeon	WC
A	goto	The Barrens,63.084,37.163
A	fp	Ratchet
A	target	Bragok
S	
A	dungeon	WC
A	goto	The Barrens,63.087,37.607
A	accept	959
A	target	Crane Operator Bigglefuzz
S	
A	dungeon	WC
T	completewith	next
A	goto	The Barrens,46.95,35.44,0
A	goto	The Barrens,46.95,35.44,20,0
A	goto	The Barrens,47.01,34.67,15,0
A	goto	1414,51.92,55.27,45,0
A	goto	1414,51.82,55.56,20
S	
A	dungeon	WC
A	accept	1486
A	target	+Nalpak
A	goto	1414,51.912,55.422
A	accept	1487
A	goto	1414,51.918,55.444
A	target	+Ebru
S	
A	dungeon	WC
T	completewith	EnterWC
A	complete	1486,1
A	isOnQuest	1486
S	
A	dungeon	WC
A	goto	1414,52.04,55.37,20,0
A	goto	1414,52.14,55.14,20,0
A	goto	1414,51.82,54.85,20,0
A	goto	1414,52.04,55.37,20,0
A	goto	1414,52.14,55.14,20,0
A	goto	1414,51.82,54.85,20,0
A	goto	1414,52.04,55.37,20,0
A	goto	1414,52.14,55.14,20,0
A	goto	1414,51.82,54.85
A	complete	959,1
A	isOnQuest	959
A	mob	Mad Magglish
S	
A	dungeon	WC
T	label	EnterWC
A	goto	1414,52.37,55.20
A	zoneskip	1414,1
S	
A	dungeon	WC
A	complete	1487,1
A	complete	1487,2
A	complete	1487,3
A	complete	1487,4
A	complete	1486,1
A	disablecheckbox	
A	isOnQuest	1487
A	isOnQuest	1486
S	
A	dungeon	WC
A	complete	1487,1
A	complete	1487,2
A	complete	1487,3
A	complete	1487,4
A	isOnQuest	1487
S	
A	dungeon	WC
T	completewith	next
A	complete	1486,1
A	isOnQuest	1486
S	
A	dungeon	WC
A	collect	10441,1,6981,1
A	accept	6981
A	use	10441
A	skipgossip	
A	target	Disciple of Naralex
A	mob	Mutanus the Devourer
S	
A	dungeon	WC
A	complete	1486,1
A	isOnQuest	1486
S	
A	dungeon	WC
T	completewith	RatchetTurnin
A	goto	The Barrens,62.984,37.218
A	subzone	392
A	isOnQuest	6981,959
S	
A	dungeon	WC
A	goto	The Barrens,62.984,37.218
A	complete	6981,1
A	skipgossip	1
A	target	Sputtervalve
A	isOnQuest	6981
S	
A	dungeon	WC
T	label	RatchetTurnin
A	goto	The Barrens,63.087,37.607
A	turnin	959
A	target	Crane Operator Bigglefuzz
A	isQuestComplete	959
S	
A	dungeon	WC
T	completewith	next
A	goto	The Barrens,50.11,35.21,35,0
A	goto	The Barrens,48.60,33.34,35,0
A	goto	The Barrens,48.184,32.781,15
A	isQuestComplete	6981
S	
A	dungeon	WC
A	goto	The Barrens,48.184,32.781
A	turnin	6981
A	target	Falla Sagewind
A	isQuestComplete	6981
S	
A	dungeon	WC
T	completewith	NalpakEbru
A	goto	1414,51.92,55.27,45,0
A	goto	1414,51.82,55.56,20
S	
A	dungeon	WC
A	turnin	1486
A	goto	1414,51.912,55.422
A	target	+Nalpak
A	turnin	1487
A	goto	1414,51.918,55.444
A	target	+Ebru
A	isQuestComplete	1486
A	isQuestComplete	1487
S	
A	dungeon	WC
A	turnin	1487
A	goto	1414,51.918,55.444
A	target	Ebru
A	isQuestComplete	1487
S	
A	dungeon	WC
T	label	NalpakEbru
A	turnin	1486
A	goto	1414,51.912,55.422
A	target	Nalpak
A	isQuestComplete	1486
S	
A	dungeon	WC
A	hs	
E
]=]
