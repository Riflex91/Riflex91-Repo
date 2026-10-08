local addonName, MG = ...
MG.RestEDXPForeverRaw = MG.RestEDXPForeverRaw or { source = { repository = "RestedXP/RXPGuides", commit = "a688a75d595f5884dba8044a5ba4e7d7bd859c09", license = "CC BY-NC-SA 4.0", transformed = true, proseCopied = false }, chunks = {} }
MG.RestEDXPForeverRaw.chunks[#MG.RestEDXPForeverRaw.chunks + 1] = [=[
G	Guides/forever/Horde-1-12_Mulgore.lua
M	classic	
M	tbc	
M	xprate	<1.99
M	era/som--h	
M	selector	Horde
M	name	1-6 Mulgore
M	version	11
M	group	RestedXP Forever Guide (H)
M	subgroup	Speedrun Guide 1-22
M	defaultfor	Tauren
M	next	6-12 Mulgore;6-13 Mulgore
S	!Tauren
T	completewith	next
A	goto	1412/1,-259.85,-2914.28
S	
A	goto	1412/1,-259.85,-2914.28
A	accept	747
A	target	Grull Hawkwind
S	
A	goto	1412/1,-221.83,-2878.31
A	accept	752
A	target	Chief Hawkwind
S	Warrior/Shaman
T	completewith	next
A	goto	1412/1,-317.9,-2852.63,30,0
A	mob	Plainstrider
A	money	>0.01
S	Warrior/Shaman
A	goto	1412/1,-279.37,-2893.73
A	vendor	
A	target	Kawnie Softbreeze
A	money	>0.01
S	Warrior
A	goto	1412/1,-213.61,-2880.71
A	train	6673
A	target	Harutt Thunderhorn
S	Shaman
A	goto	1412/1,-264.47,-2874.20
A	train	8017
A	target	Meela Dawnstrider
S	
T	completewith	next
A	complete	747,1
A	complete	747,2
A	mob	Plainstrider
S	
A	goto	1412/1,-522.37,-3052.65
A	turnin	752
A	accept	753
A	target	Greatmother Hawkwind
S	
A	goto	1412/1,-532.14,-3059.84
A	complete	753,1
S	
T	loop	
A	goto	1412/1,-385.2,-3117.38,0
A	goto	1412/1,-532.65,-2991.68,50,0
A	goto	1412/1,-573.24,-2967.71,50,0
A	goto	1412/1,-564.5,-2864.96,50,0
A	goto	1412/1,-440.17,-2916.33,50,0
A	goto	1412/1,-371.85,-2894.41,50,0
A	goto	1412/1,-303.52,-3026.27,50,0
A	goto	1412/1,-292.73,-3094.77,50,0
A	goto	1412/1,-385.2,-3117.38,50,0
A	complete	747,1
A	complete	747,2
A	mob	Plainstrider
S	
A	goto	1412/1,-259.85,-2914.28
A	turnin	747,1
A	turnin	747
A	accept	3091
A	accept	3092
A	accept	3093
A	accept	3094
A	accept	750
A	target	Grull Hawkwind
S	
A	goto	1412/1,-279.37,-2893.73
A	collect	2516,1000,750,1 << Hunter
A	vendor	
A	target	Kawnie Softbreeze
S	
A	goto	1412/1,-221.83,-2878.31
A	turnin	753
A	accept	755
A	target	Chief Hawkwind
S	Shaman
A	goto	1412/1,-216.18,-2926.26
A	collect	2132,1,750,1
A	money	<0.0102
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<1.9
A	target	Marjak Keenblade
S	Shaman
T	optional	
T	completewith	RitesoftheEarthmother
A	use	2132
A	itemcount	2132,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<1.9
S	
T	completewith	next
A	complete	750,1
A	mob	Mountain Cougar
S	
T	label	RitesoftheEarthmother
A	goto	1412/1,-139.63,-3430.08
A	turnin	755
A	accept	757
A	target	Seer Graytongue
S	
T	loop	
A	goto	1412/1,-243.41,-3384.87,0
A	goto	1412/1,-172.0,-3330.07,50,0
A	goto	1412/1,-245.46,-3409.53,50,0
A	goto	1412/1,-306.09,-3373.23,50,0
A	goto	1412/1,-333.31,-3405.08,50,0
A	goto	1412/1,-420.65,-3418.09,50,0
A	goto	1412/1,-482.3,-3379.05,50,0
A	goto	1412/1,-571.18,-3368.09,50,0
A	goto	1412/1,-474.6,-3338.29,50,0
A	goto	1412/1,-369.79,-3308.84,50,0
A	goto	1412/1,-267.04,-3351.65,50,0
A	goto	1412/1,-243.41,-3384.87,50,0
A	complete	750,1
A	mob	Mountain Cougar
S	
T	xprate	<1.5
T	loop	
A	goto	1412/1,-292.73,-3285.2,40,0
A	goto	1412/1,-362.6,-3281.44,40,0
A	goto	1412/1,-452.5,-3246.84,40,0
A	goto	1412/1,-554.23,-3213.96,40,0
A	goto	1412/1,-572.72,-3139.98,40,0
A	goto	1412/1,-626.67,-3065.32,40,0
A	goto	1412/1,-616.9,-2998.53,40,0
A	goto	1412/1,-606.63,-2923.52,40,0
A	goto	1412/1,-621.01,-2847.15,40,0
A	goto	1412/1,-537.27,-2887.22,40,0
A	goto	1412/1,-461.75,-2869.75,40,0
A	goto	1412/1,-387.77,-2851.94,40,0
A	goto	1412/1,-356.43,-2951.61,40,0
A	goto	1412/1,-307.11,-3026.96,40,0
A	goto	1412/1,-265.5,-3086.55,40,0
A	goto	1412/1,-217.21,-3146.15,40,0
A	goto	1412/1,-207.45,-3221.16,40,0
A	xp	3+1150
A	mob	Plainstrider
S	
T	xprate	>1.49
T	loop	
A	goto	1412/1,-292.73,-3285.2,40,0
A	goto	1412/1,-362.6,-3281.44,40,0
A	goto	1412/1,-452.5,-3246.84,40,0
A	goto	1412/1,-554.23,-3213.96,40,0
A	goto	1412/1,-572.72,-3139.98,40,0
A	goto	1412/1,-626.67,-3065.32,40,0
A	goto	1412/1,-616.9,-2998.53,40,0
A	goto	1412/1,-606.63,-2923.52,40,0
A	goto	1412/1,-621.01,-2847.15,40,0
A	goto	1412/1,-537.27,-2887.22,40,0
A	goto	1412/1,-461.75,-2869.75,40,0
A	goto	1412/1,-387.77,-2851.94,40,0
A	goto	1412/1,-356.43,-2951.61,40,0
A	goto	1412/1,-307.11,-3026.96,40,0
A	goto	1412/1,-265.5,-3086.55,40,0
A	goto	1412/1,-217.21,-3146.15,40,0
A	goto	1412/1,-207.45,-3221.16,40,0
A	xp	3+1025
A	mob	Plainstrider
S	Warrior/Druid
T	completewith	GrullTurnin2
A	mob	Plainstrider
A	money	>0.02
S	!Warrior !Druid
T	completewith	next
A	mob	Plainstrider
A	money	>0.01
S	
T	label	GrullTurnin2
A	goto	1412/1,-259.85,-2914.28
A	turnin	750
A	accept	780
A	target	Grull Hawkwind
S	
A	goto	1412/1,-279.37,-2893.73
A	vendor	
A	target	Kawnie Softbreeze
S	
A	goto	1412/1,-247.0,-2899.21
A	accept	3376
A	target	Brave Windfeather
S	Warrior
T	season	2
A	goto	1412/1,-213.61,-2880.71
A	turnin	3091
A	accept	77651
A	train	100
A	train	772
A	target	Harutt Thunderhorn
A	money	<0.02
S	Warrior
T	season	2
A	goto	1412/1,-213.61,-2880.71
A	turnin	3091
A	accept	77651
A	train	772
A	target	Harutt Thunderhorn
S	Warrior
T	season	0
A	goto	1412/1,-213.61,-2880.71
A	turnin	3091
A	train	100
A	train	772
A	target	Harutt Thunderhorn
A	money	<0.02
S	Warrior
T	season	0
A	goto	1412/1,-213.61,-2880.71
A	turnin	3091
A	train	772
A	target	Harutt Thunderhorn
S	Hunter
T	season	2
A	goto	1412/1,-225.94,-2865.640
A	turnin	3092
A	accept	77649
A	train	1978
A	target	Lanka Farshot
S	Hunter
T	season	0
A	goto	1412/1,-225.94,-2865.640
A	turnin	3092
A	train	1978
A	target	Lanka Farshot
S	Druid
T	season	2
A	goto	1412/1,-268.58,-2873.52
A	turnin	3094
A	accept	77648
A	train	8921
A	target	Gart Mistrunner
S	Druid
T	season	0
A	goto	1412/1,-268.58,-2873.52
A	turnin	3094
A	train	8921
A	target	Gart Mistrunner
S	Shaman
A	goto	1412/1,-250.09,-2882.08
A	accept	1519
A	target	Seer Ravenfeather
S	Shaman
T	season	2
A	goto	1412/1,-264.47,-2874.20
A	turnin	3093
A	train	8042
A	target	Meela Dawnstrider
S	Shaman
T	season	0
A	goto	1412/1,-264.47,-2874.20
A	turnin	3093
A	train	8042
A	target	Meela Dawnstrider
S	
T	loop	
A	goto	1412/1,-828.57,-3199.92,0
A	goto	1412/1,-659.55,-2989.63,50,0
A	goto	1412/1,-736.09,-3007.09,50,0
A	goto	1412/1,-815.21,-3022.51,50,0
A	goto	1412/1,-853.74,-3070.11,50,0
A	goto	1412/1,-810.07,-3145.12,50,0
A	goto	1412/1,-830.62,-3202.32,50,0
A	goto	1412/1,-818.81,-3276.98,50,0
A	goto	1412/1,-866.07,-3330.41,50,0
A	goto	1412/1,-927.72,-3330.41,50,0
A	goto	1412/1,-915.91,-3244.79,50,0
A	goto	1412/1,-896.38,-3197.52,50,0
A	goto	1412/1,-828.57,-3199.92,50,0
A	complete	780,2
A	complete	780,1
A	mob	Battleboar
S	
T	completewith	BristlebackBelts
A	goto	1412/1,-1017.63,-3126.97,30
S	
T	completewith	DirtyMap
A	complete	757,1
A	mob	Bristleback Quilboar
S	Shaman
T	completewith	DirtyMap
A	complete	1519,1
A	mob	Bristleback Shaman
S	
A	goto	1412/1,-1062.33,-3048.54,35,0
A	goto	1412/1,-1155.31,-3056.41,35,0
A	goto	1412/1,-1162.51,-2971.13,35,0
A	goto	1412/1,-1276.56,-2933.11
A	complete	3376,1
A	mob	Chief Sharptusk Thornmantle
S	
T	completewith	next
A	goto	1412/1,-1201.04,-3105.39,40
S	
T	label	DirtyMap
A	goto	1412/1,-1201.04,-3105.390
A	collect	4851,1,781
A	accept	781
A	use	4851
S	Shaman
T	completewith	next
A	complete	1519,1
A	mob	Bristleback Shaman
S	
T	label	BristlebackBelts
T	loop	
A	goto	1412/1,-1236.49,-2956.06,0
A	goto	1412/1,-1230.32,-2898.18,40,0
A	goto	1412/1,-1184.60,-2907.08,40,0
A	goto	1412/1,-1101.88,-2917.70,40,0
A	goto	1412/1,-1115.76,-2974.90,40,0
A	goto	1412/1,-1164.56,-2996.48,40,0
A	goto	1412/1,-1250.36,-2979.01,40,0
A	goto	1412/1,-1333.59,-2948.87,40,0
A	goto	1412/1,-1236.49,-2956.06,40,0
A	complete	757,1
A	mob	Bristleback Quilboar
S	Shaman
T	loop	
A	goto	1412/1,-1232.89,-3017.71,0
A	goto	1412/1,-1226.73,-3053.33,40,0
A	goto	1412/1,-1232.89,-3011.89,40,0
A	goto	1412/1,-1291.46,-2964.97,40,0
A	goto	1412/1,-1345.40,-2938.59,40,0
A	goto	1412/1,-1339.24,-2913.590,40,0
A	goto	1412/1,-1217.99,-2884.48,40,0
A	goto	1412/1,-1232.89,-3017.71,40,0
A	complete	1519,1
A	mob	Bristleback Shaman
S	
T	xprate	<1.5
T	loop	
A	goto	1412/1,-1239.06,-3015.66,40,0
A	goto	1412/1,-1256.01,-2954.35,40,0
A	goto	1412/1,-1223.13,-2882.08,40,0
A	goto	1412/1,-1171.75,-2879.34,40,0
A	goto	1412/1,-1103.43,-2914.62,40,0
A	goto	1412/1,-1122.95,-2977.98,40,0
A	goto	1412/1,-1152.23,-3065.32,40,0
A	goto	1412/1,-1076.71,-3040.66,40,0
A	goto	1412/1,-1038.69,-3079.02,40,0
A	goto	1412/1,-1087.5,-3092.38,40,0
A	goto	1412/1,-1151.2,-3082.44,40,0
A	xp	5+880
A	xp	5
S	
T	xprate	>1.49
T	loop	
A	goto	1412/1,-1239.06,-3015.66,40,0
A	goto	1412/1,-1256.01,-2954.35,40,0
A	goto	1412/1,-1223.13,-2882.08,40,0
A	goto	1412/1,-1171.75,-2879.34,40,0
A	goto	1412/1,-1103.43,-2914.62,40,0
A	goto	1412/1,-1122.95,-2977.98,40,0
A	goto	1412/1,-1152.23,-3065.32,40,0
A	goto	1412/1,-1076.71,-3040.66,40,0
A	goto	1412/1,-1038.69,-3079.02,40,0
A	goto	1412/1,-1087.5,-3092.38,40,0
A	goto	1412/1,-1151.2,-3082.44,40,0
A	xp	5
A	xp	4+700
S	
T	completewith	next
A	hs	
A	use	6948
S	
A	turnin	780
A	target	+Grull Hawkwind
A	goto	1412/1,-259.85,-2914.28
A	turnin	3376
A	target	+Brave Windfeather
A	goto	1412/1,-247.0,-2899.21
A	turnin	1519
A	accept	1520
A	target	+Seer Ravenfeather << Shaman
A	goto	1412/1,-250.09,-2882.08 << Shaman
A	turnin	781
A	turnin	757
A	accept	763
A	target	+Chief Hawkwind
A	goto	1412/1,-221.83,-2878.31
S	Shaman
T	completewith	CallofEarth
T	label	Rock
A	goto	1412/1,-712.98,-3018.05,30
S	Shaman
T	completewith	next
T	requires	Rock
A	cast	8202
A	use	6635
S	Shaman
A	goto	1412/1,-712.98,-3018.05
A	turnin	1520
A	accept	1521
A	target	Minor Manifestation of Earth
S	Shaman
A	goto	1412/1,-250.09,-2882.08
A	turnin	1521
A	target	Seer Ravenfeather
S	Shaman
T	season	2
A	goto	1412/1,-264.47,-2874.20
A	turnin	77652
A	train	332
A	target	Shikrik
A	target	Meela Dawnstrider
S	Shaman
T	season	0
A	goto	1412/1,-264.47,-2874.20
A	train	332
A	target	Shikrik
A	target	Meela Dawnstrider
S	Hunter
T	season	2
A	goto	1412/1,-225.94,-2865.640
A	train	1130
A	train	3044
A	turnin	77649
A	target	Lanka Farshot
A	money	<0.02
S	Hunter
T	season	2
A	goto	1412/1,-225.94,-2865.640
A	train	3044
A	turnin	77649
A	target	Lanka Farshot
S	Hunter
T	season	0
A	goto	1412/1,-225.94,-2865.640
A	train	1130
A	train	3044
A	target	Lanka Farshot
A	money	<0.02
S	Hunter
T	season	0
A	goto	1412/1,-225.94,-2865.640
A	train	3044
A	target	Lanka Farshot
S	Druid
T	season	2
A	goto	1412/1,-268.58,-2873.52
A	train	467
A	train	5177
A	turnin	77648
A	target	Gart Mistrunner
A	money	<0.02
S	Druid
T	season	2
A	goto	1412/1,-268.58,-2873.52
A	train	5177
A	turnin	77648
A	target	Gart Mistrunner
S	Druid
T	season	0
A	goto	1412/1,-268.58,-2873.52
A	train	467
A	train	5177
A	target	Gart Mistrunner
A	money	<0.02
S	Druid
T	season	0
A	goto	1412/1,-268.58,-2873.52
A	train	5177
A	target	Gart Mistrunner
S	Warrior
T	season	2
A	goto	1412/1,-213.61,-2880.71
A	train	3127
A	train	6343
A	turnin	77651
A	target	Harutt Thunderhorn
A	money	<0.02
S	Warrior
T	season	2
A	goto	1412/1,-213.61,-2880.71
A	train	3127
A	turnin	77651
A	target	Harutt Thunderhorn
S	Warrior
T	season	0
A	goto	1412/1,-213.61,-2880.71
A	train	3127
A	train	6343
A	target	Harutt Thunderhorn
A	money	<0.02
S	Warrior
T	season	0
A	goto	1412/1,-213.61,-2880.71
A	train	3127
A	target	Harutt Thunderhorn
S	
A	goto	1412/1,69.47,-3065.66
A	accept	1656
A	target	Antur Fallow
E
G	Guides/forever/Horde-1-12_Mulgore.lua
M	classic	
M	tbc	
M	xprate	<1.99
M	selector	Horde
M	name	6-12 Mulgore
M	version	11
M	group	RestedXP Forever Guide (H)
M	subgroup	Speedrun Guide 1-22
M	defaultfor	Tauren
M	next	12-17 The Barrens
S	Druid
T	season	2
A	goto	1412/1,212.80,-2655.69
A	collect	206989,1
A	mob	Lunar Stone
A	train	416044,1
S	Druid
T	season	2
A	train	416044
A	use	206989
A	itemcount	206989,1
S	
T	completewith	BloodhoofHome
T	softcore	
A	deathskip	
S	
T	hardcore	
T	completewith	BloodhoofHome
A	goto	1412/1,-384.69,-2351.89,120
A	subzoneskip	222
S	
T	softcore	
A	goto	1412/1,-365.17,-2227.56
A	accept	766
A	target	Maur Raincaller
S	
A	accept	743
A	target	+Ruul Eagletalon
A	goto	1412/1,-385.2,-2396.76
A	turnin	763
A	accept	745
A	accept	767
A	accept	746
A	target	+Baine Bloodhoof
A	goto	1412/1,-392.91,-2333.40
S	
T	label	BloodhoofHome
A	goto	1412/1,-347.7,-2365.25
A	turnin	1656
A	home	
A	target	Innkeeper Kauth
A	bindlocation	222
A	subzoneskip	222,1
S	Shaman/Druid
A	goto	1412/1,-297.87,-2279.970
A	vendor	
A	target	Mahnott Roughwound
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Shaman/Druid
A	goto	1412/1,-297.87,-2279.970
A	collect	2495,1,761,1
A	money	<0.0504
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Warrior
A	goto	1412/1,-297.87,-2279.970
A	vendor	
A	target	Mahnott Roughwound
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.9
S	Warrior
A	goto	1412/1,-297.87,-2279.970
A	collect	2493,1,761,1
A	money	<0.0701
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.9
S	Hunter
A	goto	1412/1,-289.65,-2275.51
A	vendor	
A	target	Kennah Hawkseye
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.0
S	Hunter
A	goto	1412/1,-289.65,-2275.51
A	collect	2509,1,761,1
A	money	<0.0414
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.0
S	Hunter
A	goto	1412/1,-289.65,-2275.51
A	collect	2516,1000,750,1 << Hunter
A	target	Kennah Hawkseye
S	Shaman/Druid
T	optional	
T	completewith	Well
A	use	2495
A	itemcount	2495,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Warrior
T	optional	
T	completewith	Well
A	use	2493
A	itemcount	2493,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.9
S	Hunter
T	optional	
T	completewith	Well
A	use	2509
A	itemcount	2509,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.0
S	Tauren
A	accept	766
A	target	+Maur Raincaller
A	goto	1412/1,-365.17,-2227.56
A	turnin	767
A	accept	771
A	target	+Zarlman Two-Moons
A	goto	1412/1,-405.75,-2243.32
A	accept	761
A	target	+Harken Windtotem
A	goto	1412/1,-454.56,-2304.63
A	accept	748
A	target	+Mull Thunderhorn
A	goto	1412/1,-445.31,-2341.620
S	!Tauren
A	accept	766
A	target	+Maur Raincaller
A	goto	1412/1,-365.17,-2227.56
A	turnin	767
A	accept	771
A	target	+Zarlman Two-Moons
A	goto	1412/1,-405.75,-2243.32
A	accept	761
A	target	+Harken Windtotem
A	goto	1412/1,-454.56,-2304.63
S	
T	sticky	
T	completewith	Well
A	complete	766,1
A	complete	766,2
A	complete	766,3
A	complete	766,4
S	Tauren
T	completewith	Ambercorns
A	complete	748,1
A	mob	+Prairie Wolf
A	complete	748,2
A	mob	+Adult Plainstrider
S	Hunter
T	season	2
A	goto	1412/1,-984.24,-2134.75
A	collect	206155,1
A	mob	Rustling Bush
A	mob	Venture Co. Poacher
A	train	410113,1
S	Hunter
T	season	2
A	train	410113
A	use	206155
A	itemcount	206155,1
S	
T	label	Ambercorns
T	loop	
A	goto	1412/1,-539.33,-2550.2,0
A	goto	1412/1,-454.56,-2479.99,15,0
A	goto	1412/1,-539.33,-2550.2,15,0
A	goto	1412/1,-619.47,-2459.78,15,0
A	goto	1412/1,-578.89,-2706.72,15,0
A	goto	1412/1,-539.33,-2550.2,15,0
A	complete	771,2
S	
T	completewith	next
A	complete	761,1
A	mob	Wiry Swoop
A	mob	Swoop
S	Tauren
T	loop	
A	goto	1412/1,-562.96,-2556.02,0
A	goto	1412/1,-562.96,-2556.02,50,0
A	goto	1412/1,-575.29,-2452.24,50,0
A	goto	1412/1,-664.17,-2398.47,50,0
A	goto	1412/1,-725.31,-2385.46,50,0
A	goto	1412/1,-812.13,-2422.79,50,0
A	goto	1412/1,-852.72,-2496.77,50,0
A	goto	1412/1,-830.11,-2594.38,50,0
A	goto	1412/1,-778.74,-2658.43,50,0
A	goto	1412/1,-640.54,-2672.81,50,0
A	goto	1412/1,-541.38,-2678.64,50,0
A	goto	1412/1,-448.91,-2650.89,50,0
A	goto	1412/1,-314.31,-2660.14,50,0
A	goto	1412/1,-447.88,-2580.34,50,0
A	complete	748,1
A	mob	+Prairie Wolf
A	complete	748,2
A	mob	+Adult Plainstrider
S	Tauren
A	goto	1412/1,-445.31,-2341.620
A	turnin	748
A	timer	8,Poison Water RP
A	accept	754
A	target	Mull Thunderhorn
S	Tauren
T	completewith	next
A	complete	771,1
S	Tauren
T	label	Well
A	goto	1412/1,-709.89,-2543.01
A	complete	754,1
S	
T	label	Stones
T	loop	
A	goto	1412/1,-729.42,-2547.12,0
A	goto	1412/1,-692.94,-2525.88,10,0
A	goto	1412/1,-710.92,-2519.37,10,0
A	goto	1412/1,-725.31,-2531.36,10,0
A	goto	1412/1,-729.42,-2547.12,10,0
A	complete	771,1
S	
T	completewith	Gnolls
A	complete	766,1
A	complete	766,2
A	complete	766,3
A	complete	766,4
S	Warrior
T	season	2
T	loop	
A	goto	1412/1,-700.65,-2773.17,0
A	goto	1412/1,-433.50,-2738.92,0
A	goto	1412/1,-700.65,-2773.17,90,0
A	goto	1412/1,-433.50,-2738.92,90,0
A	complete	745,1
A	mob	+Palemane Tanner
A	complete	745,2
A	mob	+Palemane Skinner
A	complete	745,3
A	mob	+Palemane Poacher
A	collect	204478,1
A	unitscan	Snagglespear
A	train	403475,1
S	
T	label	Gnolls
T	loop	
A	goto	1412/1,-700.65,-2773.17,0
A	goto	1412/1,-433.50,-2738.92,0
A	goto	1412/1,-700.65,-2773.17,90,0
A	goto	1412/1,-433.50,-2738.92,90,0
A	complete	745,1
A	mob	+Palemane Tanner
A	complete	745,2
A	mob	+Palemane Skinner
A	complete	745,3
A	mob	+Palemane Poacher
A	unitscan	Snagglespear
S	
A	goto	1412/1,-399.07,-2378.95
A	vendor	
A	collect	1179,10,746,1 << Shaman/Druid
A	collect	4541,10,746,1 << Warrior
A	target	Jhawna Oatwind
A	money	<0.025
S	Tauren
A	turnin	754
A	accept	756
A	target	+Mull Thunderhorn
A	goto	1412/1,-445.31,-2341.620
A	turnin	745
A	target	+Baine Bloodhoof
A	goto	1412/1,-392.91,-2333.40
S	!Tauren
A	goto	1412/1,-392.91,-2333.40
A	turnin	745
A	target	Baine Bloodhoof
S	Warrior
A	goto	1412/1,-356.43,-2357.03
A	train	3273
A	money	<0.01
A	target	Vira Younghoof
S	Shaman/Druid
A	goto	1412/1,-297.87,-2279.970
A	vendor	
A	target	Mahnott Roughwound
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Shaman/Druid
A	goto	1412/1,-297.87,-2279.970
A	collect	2495,1,749,1
A	money	<0.0504
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Warrior
A	goto	1412/1,-297.87,-2279.970
A	vendor	
A	target	Mahnott Roughwound
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.9
S	Warrior
A	goto	1412/1,-297.87,-2279.970
A	collect	2493,1,749,1
A	money	<0.0701
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.9
S	Hunter
A	goto	1412/1,-289.65,-2275.51
A	vendor	
A	target	Kennah Hawkseye
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.0
S	Hunter
A	goto	1412/1,-289.65,-2275.51
A	collect	2509,1,749,1
A	money	<0.0414
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.0
S	Shaman/Druid
T	optional	
T	completewith	Clawsx
A	use	2495
A	itemcount	2495,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Warrior
T	optional	
T	completewith	Clawsx
A	use	2493
A	itemcount	2493,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.9
S	Hunter
T	optional	
T	completewith	Clawsx
A	use	2509
A	itemcount	2509,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.0
S	
T	label	Vision
A	goto	1412/1,-405.75,-2243.32
A	turnin	771
A	accept	772
A	target	Zarlman Two-Moons
S	Hunter
A	goto	1412/1,-408.32,-2180.30
A	train	5116
A	target	Yaw Sharpmane
A	xp	<8,1
S	Druid
A	goto	1412/1,-442.74,-2315.59
A	train	5186
A	target	Gennia Runetotem
A	xp	<8,1
S	Warrior
A	goto	1412/1,-496.17,-2347.78
A	train	284
A	target	Krang Stonehoof
A	xp	<8,1
S	Shaman
A	goto	1412/1,-437.61,-2298.80
A	train	8044
A	target	Narm Skychaser
A	xp	<8,1
S	
T	loop	
A	goto	1412/1,-784.9,-2350.18,0
A	goto	1412/1,-597.9,-2301.54,50,0
A	goto	1412/1,-674.96,-2336.14,50,0
A	goto	1412/1,-784.9,-2350.18,50,0
A	goto	1412/1,-904.6,-2371.07,50,0
A	goto	1412/1,-1016.6,-2410.12,50,0
A	goto	1412/1,-784.9,-2350.18,50,0
A	line	Mulgore,51.50,59.23,53.00,60.24,55.14,60.65,57.47,61.26,59.65,62.40
A	accept	749
A	unitscan	Morin Cloudstalker
S	
T	completewith	Clawsx
A	complete	766,1
A	complete	766,2
A	complete	766,3
A	complete	766,4
S	Tauren
T	completewith	RavagedCaravan1
A	complete	756,1
A	mob	+Prairie Stalker
A	complete	756,2
A	mob	+Flatland Cougar
S	
T	completewith	Clawsx
A	complete	761,1
A	mob	Wiry Swoop
A	mob	Swoop
S	
T	label	RavagedCaravan1
A	goto	1412/1,-712.98,-1922.74
A	turnin	749
A	accept	751
S	Tauren
T	loop	
A	goto	1412/1,-936.97,-1937.47,0
A	goto	1412/1,-936.97,-1937.47,60,0
A	goto	1412/1,-752.02,-1646.34,60,0
A	goto	1412/1,-335.88,-2009.39,60,0
A	complete	756,1
A	mob	+Prairie Stalker
A	complete	756,2
A	mob	+Flatland Cougar
S	
T	optional	
T	label	Clawsx
S	
T	softcore	
T	completewith	Thunderhorn
A	deathskip	
S	
T	hardcore	
T	completewith	Thunderhorn
A	goto	1412/1,-341.02,-2173.79,150
A	subzoneskip	222
S	Hunter
A	goto	1412/1,-408.32,-2180.30
A	train	5116
A	target	Yaw Sharpmane
A	xp	<8,1
S	
T	label	Mazzturnin
A	goto	1412/1,-365.17,-2227.56
A	turnin	766
A	target	Maur Raincaller
A	isQuestComplete	766
S	Shaman/Druid
A	goto	1412/1,-297.87,-2279.970
A	vendor	
A	target	Mahnott Roughwound
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Shaman/Druid
A	goto	1412/1,-297.87,-2279.970
A	collect	2495,1,743,1
A	money	<0.0504
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Warrior
A	goto	1412/1,-297.87,-2279.970
A	vendor	
A	target	Mahnott Roughwound
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.9
S	Warrior
A	goto	1412/1,-297.87,-2279.970
A	collect	2493,1,743,1
A	money	<0.0701
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.9
S	Hunter
A	goto	1412/1,-289.65,-2275.51
A	vendor	
A	target	Kennah Hawkseye
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.0
S	Hunter
A	goto	1412/1,-289.65,-2275.51
A	collect	2509,1,743,1
A	money	<0.0414
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.0
S	Hunter
A	goto	1412/1,-308.14,-2248.11
A	collect	2516,1000,743,1 << Hunter
A	target	Moorat Longstride
A	itemcount	2512,<800 << Hunter
S	Shaman/Druid
T	optional	
T	completewith	ThunderhornCleanse
A	use	2495
A	itemcount	2495,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Warrior
T	optional	
T	completewith	ThunderhornCleanse
A	use	2493
A	itemcount	2493,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.9
S	Hunter
T	optional	
T	completewith	ThunderhornCleanse
A	use	2509
A	itemcount	2509,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.0
S	
T	completewith	Thunderhorn
A	goto	1412/1,-310.2,-2284.42
A	vendor	
A	target	Harant Ironbrace
S	
A	goto	1412/1,-454.56,-2304.63
A	turnin	761
A	target	Harken Windtotem
A	isQuestComplete	761
S	Tauren
A	goto	1412/1,-445.31,-2341.620
A	turnin	756
A	timer	8,Thunderhorn Totem RP
A	accept	758
A	target	Mull Thunderhorn
S	
T	optional	
T	label	Thunderhorn
S	Shaman
A	goto	1412/1,-437.61,-2298.80
A	train	8044
A	target	Narm Skychaser
A	xp	<8,1
S	Druid
A	goto	1412/1,-442.74,-2315.59
A	train	5186
A	target	Gennia Runetotem
A	xp	<8,1
S	Warrior
A	goto	1412/1,-496.17,-2347.78
A	train	284
A	target	Krang Stonehoof
A	xp	<8,1
S	Hunter
A	goto	1412/1,-408.32,-2180.30
A	train	5116
A	target	Yaw Sharpmane
A	xp	<8,1
S	
A	goto	1412/1,-347.7,-2364.91
A	vendor	
A	collect	1179,10,746,1 << Shaman/Druid
A	collect	4541,10,746,1 << Warrior
A	target	Innkeeper Kauth
A	money	<0.025
S	
T	completewith	Burial
A	complete	766,1
A	complete	766,2
A	complete	766,3
A	complete	766,4
S	
T	completewith	Burial
A	complete	761,1
A	mob	Wiry Swoop
A	mob	Swoop
S	Tauren
T	era/som	
T	label	ThunderhornCleanse
A	goto	1412/1,-237.76,-1826.50
A	complete	758,1
S	Shaman
T	season	2
T	completewith	next
A	collect	206975,1
A	mob	Bael'dun Digger
A	mob	Bael'dun Appraiser
A	train	425344,1
A	xp	<3,1
S	
A	goto	1412/1,441.42,-1980.96
A	use	4702
A	complete	746,1
A	mob	Bael'dun Digger
A	mob	Bael'dun Appraiser
S	Shaman
T	season	2
T	loop	
A	goto	1412/1,284.21,-1901.16,0
A	goto	1412/1,284.21,-1901.16,40,0
A	goto	1412/1,320.69,-1972.06,40,0
A	goto	1412/1,374.12,-1949.80,40,0
A	goto	1412/1,410.08,-1991.24,40,0
A	goto	1412/1,448.10,-1988.16,40,0
A	goto	1412/1,456.32,-1925.14,40,0
A	goto	1412/1,424.98,-1923.42,40,0
A	goto	1412/1,347.4,-1906.3,40,0
A	collect	206975,1
A	mob	Bael'dun Digger
A	mob	Bael'dun Appraiser
A	train	425344,1
A	xp	<3,1
S	Shaman
T	season	2
A	goto	1412/1,426.52,-1969.66
A	collect	206388,1
A	train	425344,1
A	xp	<3,1
S	Shaman
T	season	2
A	equip	18,206388
A	use	206388
A	itemcount	206388,1
A	train	425344,1
A	xp	<3,1
S	Shaman
T	season	2
T	label	MoltenBlast
T	completewith	Burial
A	aura	408828
A	mob	Bael'dun Digger
A	mob	Bael'dun Appraiser
A	train	425344,1
A	xp	<3,1
A	xp	>13,1
S	Warrior
T	season	2
T	loop	
A	goto	1412/1,417.27,-1653.53,0
A	goto	1412/1,297.06,-1769.98,50,0
A	goto	1412/1,353.57,-1744.30,50,0
A	goto	1412/1,418.30,-1748.41,50,0
A	goto	1412/1,451.18,-1714.50,50,0
A	goto	1412/1,449.13,-1672.71,50,0
A	goto	1412/1,417.27,-1653.53,50,0
A	goto	1412/1,381.31,-1682.99,50,0
A	goto	1412/1,323.26,-1687.440,50,0
A	goto	1412/1,310.41,-1651.82,50,0
A	goto	1412/1,276.51,-1684.36,50,0
A	goto	1412/1,275.48,-1721.35,50,0
A	complete	743,1
A	collect	206995,1
A	mob	Windfury Wind Witch
A	mob	Windfury Harpy
A	train	403475,1
S	
T	loop	
A	goto	1412/1,417.27,-1653.53,0
A	goto	1412/1,297.06,-1769.98,50,0
A	goto	1412/1,353.57,-1744.30,50,0
A	goto	1412/1,418.30,-1748.41,50,0
A	goto	1412/1,451.18,-1714.50,50,0
A	goto	1412/1,449.13,-1672.71,50,0
A	goto	1412/1,417.27,-1653.53,50,0
A	goto	1412/1,381.31,-1682.99,50,0
A	goto	1412/1,323.26,-1687.440,50,0
A	goto	1412/1,310.41,-1651.82,50,0
A	goto	1412/1,276.51,-1684.36,50,0
A	goto	1412/1,275.48,-1721.35,50,0
A	complete	743,1
A	mob	Windfury Wind Witch
A	mob	Windfury Harpy
S	
T	completewith	next
A	goto	1412/1,333.53,-1523.73,50
S	
T	label	Burial
A	goto	1412/1,366.93,-1509.00
A	turnin	772
A	accept	773
A	target	Seer Wiserunner
S	Shaman
T	season	2
T	requires	MoltenBlast
A	cast	402265
A	use	206388
A	aura	-408828
A	itemStat	18,QUALITY,2
A	train	425344,1
A	xp	<3,1
S	
T	completewith	SacredBurial
A	destroy	4823
S	
T	completewith	SacredBurial
A	complete	766,1
A	complete	766,2
A	complete	766,3
A	complete	766,4
S	
T	completewith	SacredBurial
A	collect	4854,1,770
A	accept	770
A	use	4854
A	unitscan	Ghost Howl
S	
T	completewith	next
A	complete	761,1
A	mob	Wiry Swoop
A	mob	Swoop
A	mob	Taloned Swoop
S	
T	label	SacredBurial
A	goto	1412/1,-1026.88,-1150.40
A	accept	833
A	target	Lorekeeper Raintotem
S	Warrior
T	season	2
T	completewith	RiteofWisdom
A	collect	206994,1
A	mob	Bristleback Interloper
A	train	403475,1
S	
T	completewith	next
A	complete	833,1
A	mob	Bristleback Interloper
S	
T	label	RiteofWisdom
A	goto	1412/1,-1109.08,-992.51
A	turnin	773
A	accept	775
A	target	Ancestral Spirit
S	Warrior
T	season	2
T	loop	
A	goto	1412/1,-1026.88,-1150.40,0
A	goto	1412/1,-1026.88,-1150.40,25,0
A	goto	1412/1,-1093.15,-1058.27,25,0
A	goto	1412/1,-1125.52,-1043.20,25,0
A	goto	1412/1,-1146.58,-1028.13,25,0
A	goto	1412/1,-1153.77,-988.40,25,0
A	goto	1412/1,-1117.81,-940.790,25,0
A	goto	1412/1,-1057.19,-940.790,25,0
A	goto	1412/1,-1042.80,-994.22,25,0
A	goto	1412/1,-1055.65,-1025.05,25,0
A	goto	1412/1,-1092.12,-1056.56,25,0
A	complete	833,1
A	collect	206994,1
A	mob	Bristleback Interloper
A	train	403475,1
S	
T	loop	
A	goto	1412/1,-1026.88,-1150.40,0
A	goto	1412/1,-1026.88,-1150.40,25,0
A	goto	1412/1,-1093.15,-1058.27,25,0
A	goto	1412/1,-1125.52,-1043.20,25,0
A	goto	1412/1,-1146.58,-1028.13,25,0
A	goto	1412/1,-1153.77,-988.40,25,0
A	goto	1412/1,-1117.81,-940.790,25,0
A	goto	1412/1,-1057.19,-940.790,25,0
A	goto	1412/1,-1042.80,-994.22,25,0
A	goto	1412/1,-1055.65,-1025.05,25,0
A	goto	1412/1,-1092.12,-1056.56,25,0
A	complete	833,1
A	mob	Bristleback Interloper
S	
A	goto	1412/1,-1026.88,-1150.40
A	turnin	833
A	target	Lorekeeper Raintotem
S	
T	completewith	next
A	complete	766,1
A	complete	766,2
A	complete	766,3
A	complete	766,4
S	
T	loop	
A	goto	1412/1,-572.21,-903.12,0
A	goto	1412/1,-1009.92,-1073.0,60,0
A	goto	1412/1,-906.66,-926.41,60,0
A	goto	1412/1,-788.5,-912.36,60,0
A	goto	1412/1,-674.44,-866.81,60,0
A	goto	1412/1,-572.21,-903.12,60,0
A	goto	1412/1,-512.61,-983.26,60,0
A	goto	1412/1,-511.59,-1084.3,60,0
A	goto	1412/1,-496.17,-1166.84,60,0
A	goto	1412/1,-506.45,-1236.71,60,0
A	goto	1412/1,-561.42,-1278.84,60,0
A	goto	1412/1,-635.91,-1302.81,60,0
A	goto	1412/1,-737.12,-1315.14,60,0
A	goto	1412/1,-836.79,-1312.4,60,0
A	goto	1412/1,-920.02,-1316.86,60,0
A	goto	1412/1,-972.42,-1249.73,60,0
A	goto	1412/1,-1063.35,-1159.31,60,0
A	goto	1412/1,-1009.92,-1073.0,60,0
A	complete	761,1
A	mob	Wiry Swoop
A	mob	Swoop
A	mob	Taloned Swoop
S	
T	loop	
A	goto	1412/1,-780.79,-1385.36,0
A	goto	1412/1,-780.79,-1385.36,60,0
A	goto	1412/1,-718.11,-1670.32,60,0
A	goto	1412/1,-684.72,-1819.65,60,0
A	goto	1412/1,-903.58,-1946.37,60,0
A	goto	1412/1,-985.26,-2080.97,60,0
A	goto	1412/1,-989.37,-2262.5,60,0
A	goto	1412/1,-452.5,-1808.69,60,0
A	complete	766,1
A	mob	+Prairie Wolf Alpha
A	mob	+Prairie Stalker
A	mob	+Prairie Wolf Alpha
A	complete	766,2
A	mob	+Flatland Cougar
A	complete	766,3
A	mob	+Elder Plainstrider
A	mob	+Adult Plainstrider
A	complete	766,4
A	mob	+Taloned Swoop
A	mob	+Swoop
A	mob	+Wiry Swoop
S	
T	xprate	<1.5
T	optional	
T	loop	
A	goto	1412/1,-1009.92,-1073.0,60,0
A	goto	1412/1,-906.66,-926.41,60,0
A	goto	1412/1,-788.5,-912.36,60,0
A	goto	1412/1,-674.44,-866.81,60,0
A	goto	1412/1,-572.21,-903.12,60,0
A	goto	1412/1,-512.61,-983.26,60,0
A	goto	1412/1,-511.59,-1084.3,60,0
A	goto	1412/1,-496.17,-1166.84,60,0
A	goto	1412/1,-506.45,-1236.71,60,0
A	goto	1412/1,-561.42,-1278.84,60,0
A	goto	1412/1,-635.91,-1302.81,60,0
A	goto	1412/1,-737.12,-1315.14,60,0
A	goto	1412/1,-836.79,-1312.4,60,0
A	goto	1412/1,-920.02,-1316.86,60,0
A	goto	1412/1,-972.42,-1249.73,60,0
A	goto	1412/1,-1063.35,-1159.31,60,0
A	goto	1412/1,-1009.92,-1073.0,60,0
A	xp	9+3020
A	isQuestComplete	761
A	isQuestComplete	766
S	
T	xprate	<1.5
T	optional	
T	loop	
A	goto	1412/1,-1009.92,-1073.0,60,0
A	goto	1412/1,-906.66,-926.41,60,0
A	goto	1412/1,-788.5,-912.36,60,0
A	goto	1412/1,-674.44,-866.81,60,0
A	goto	1412/1,-572.21,-903.12,60,0
A	goto	1412/1,-512.61,-983.26,60,0
A	goto	1412/1,-511.59,-1084.3,60,0
A	goto	1412/1,-496.17,-1166.84,60,0
A	goto	1412/1,-506.45,-1236.71,60,0
A	goto	1412/1,-561.42,-1278.84,60,0
A	goto	1412/1,-635.91,-1302.81,60,0
A	goto	1412/1,-737.12,-1315.14,60,0
A	goto	1412/1,-836.79,-1312.4,60,0
A	goto	1412/1,-920.02,-1316.86,60,0
A	goto	1412/1,-972.42,-1249.73,60,0
A	goto	1412/1,-1063.35,-1159.31,60,0
A	goto	1412/1,-1009.92,-1073.0,60,0
A	xp	9+3720
A	isQuestComplete	761
S	
T	xprate	<1.5
T	optional	
T	loop	
A	goto	1412/1,-1009.92,-1073.0,60,0
A	goto	1412/1,-906.66,-926.41,60,0
A	goto	1412/1,-788.5,-912.36,60,0
A	goto	1412/1,-674.44,-866.81,60,0
A	goto	1412/1,-572.21,-903.12,60,0
A	goto	1412/1,-512.61,-983.26,60,0
A	goto	1412/1,-511.59,-1084.3,60,0
A	goto	1412/1,-496.17,-1166.84,60,0
A	goto	1412/1,-506.45,-1236.71,60,0
A	goto	1412/1,-561.42,-1278.84,60,0
A	goto	1412/1,-635.91,-1302.81,60,0
A	goto	1412/1,-737.12,-1315.14,60,0
A	goto	1412/1,-836.79,-1312.4,60,0
A	goto	1412/1,-920.02,-1316.86,60,0
A	goto	1412/1,-972.42,-1249.73,60,0
A	goto	1412/1,-1063.35,-1159.31,60,0
A	goto	1412/1,-1009.92,-1073.0,60,0
A	xp	9+3700
A	isQuestComplete	766
S	
T	xprate	<1.5
T	optional	
T	loop	
A	goto	1412/1,-1009.92,-1073.0,60,0
A	goto	1412/1,-906.66,-926.41,60,0
A	goto	1412/1,-788.5,-912.36,60,0
A	goto	1412/1,-674.44,-866.81,60,0
A	goto	1412/1,-572.21,-903.12,60,0
A	goto	1412/1,-512.61,-983.26,60,0
A	goto	1412/1,-511.59,-1084.3,60,0
A	goto	1412/1,-496.17,-1166.84,60,0
A	goto	1412/1,-506.45,-1236.71,60,0
A	goto	1412/1,-561.42,-1278.84,60,0
A	goto	1412/1,-635.91,-1302.81,60,0
A	goto	1412/1,-737.12,-1315.14,60,0
A	goto	1412/1,-836.79,-1312.4,60,0
A	goto	1412/1,-920.02,-1316.86,60,0
A	goto	1412/1,-972.42,-1249.73,60,0
A	goto	1412/1,-1063.35,-1159.31,60,0
A	goto	1412/1,-1009.92,-1073.0,60,0
A	xp	9+4400
S	
T	xprate	>1.49
T	optional	
T	loop	
A	goto	1412/1,-1009.92,-1073.0,60,0
A	goto	1412/1,-906.66,-926.41,60,0
A	goto	1412/1,-788.5,-912.36,60,0
A	goto	1412/1,-674.44,-866.81,60,0
A	goto	1412/1,-572.21,-903.12,60,0
A	goto	1412/1,-512.61,-983.26,60,0
A	goto	1412/1,-511.59,-1084.3,60,0
A	goto	1412/1,-496.17,-1166.84,60,0
A	goto	1412/1,-506.45,-1236.71,60,0
A	goto	1412/1,-561.42,-1278.84,60,0
A	goto	1412/1,-635.91,-1302.81,60,0
A	goto	1412/1,-737.12,-1315.14,60,0
A	goto	1412/1,-836.79,-1312.4,60,0
A	goto	1412/1,-920.02,-1316.86,60,0
A	goto	1412/1,-972.42,-1249.73,60,0
A	goto	1412/1,-1063.35,-1159.31,60,0
A	goto	1412/1,-1009.92,-1073.0,60,0
A	xp	9+1280
A	isQuestComplete	761
A	isQuestComplete	766
S	
T	xprate	>1.49
T	optional	
T	loop	
A	goto	1412/1,-1009.92,-1073.0,60,0
A	goto	1412/1,-906.66,-926.41,60,0
A	goto	1412/1,-788.5,-912.36,60,0
A	goto	1412/1,-674.44,-866.81,60,0
A	goto	1412/1,-572.21,-903.12,60,0
A	goto	1412/1,-512.61,-983.26,60,0
A	goto	1412/1,-511.59,-1084.3,60,0
A	goto	1412/1,-496.17,-1166.84,60,0
A	goto	1412/1,-506.45,-1236.71,60,0
A	goto	1412/1,-561.42,-1278.84,60,0
A	goto	1412/1,-635.91,-1302.81,60,0
A	goto	1412/1,-737.12,-1315.14,60,0
A	goto	1412/1,-836.79,-1312.4,60,0
A	goto	1412/1,-920.02,-1316.86,60,0
A	goto	1412/1,-972.42,-1249.73,60,0
A	goto	1412/1,-1063.35,-1159.31,60,0
A	goto	1412/1,-1009.92,-1073.0,60,0
A	xp	9+2330
A	isQuestComplete	761
S	
T	xprate	>1.49
T	optional	
T	loop	
A	goto	1412/1,-1009.92,-1073.0,60,0
A	goto	1412/1,-906.66,-926.41,60,0
A	goto	1412/1,-788.5,-912.36,60,0
A	goto	1412/1,-674.44,-866.81,60,0
A	goto	1412/1,-572.21,-903.12,60,0
A	goto	1412/1,-512.61,-983.26,60,0
A	goto	1412/1,-511.59,-1084.3,60,0
A	goto	1412/1,-496.17,-1166.84,60,0
A	goto	1412/1,-506.45,-1236.71,60,0
A	goto	1412/1,-561.42,-1278.84,60,0
A	goto	1412/1,-635.91,-1302.81,60,0
A	goto	1412/1,-737.12,-1315.14,60,0
A	goto	1412/1,-836.79,-1312.4,60,0
A	goto	1412/1,-920.02,-1316.86,60,0
A	goto	1412/1,-972.42,-1249.73,60,0
A	goto	1412/1,-1063.35,-1159.31,60,0
A	goto	1412/1,-1009.92,-1073.0,60,0
A	xp	9+2300
A	isQuestComplete	766
S	
T	xprate	>1.49
T	optional	
T	loop	
A	goto	1412/1,-1009.92,-1073.0,60,0
A	goto	1412/1,-906.66,-926.41,60,0
A	goto	1412/1,-788.5,-912.36,60,0
A	goto	1412/1,-674.44,-866.81,60,0
A	goto	1412/1,-572.21,-903.12,60,0
A	goto	1412/1,-512.61,-983.26,60,0
A	goto	1412/1,-511.59,-1084.3,60,0
A	goto	1412/1,-496.17,-1166.84,60,0
A	goto	1412/1,-506.45,-1236.71,60,0
A	goto	1412/1,-561.42,-1278.84,60,0
A	goto	1412/1,-635.91,-1302.81,60,0
A	goto	1412/1,-737.12,-1315.14,60,0
A	goto	1412/1,-836.79,-1312.4,60,0
A	goto	1412/1,-920.02,-1316.86,60,0
A	goto	1412/1,-972.42,-1249.73,60,0
A	goto	1412/1,-1063.35,-1159.31,60,0
A	goto	1412/1,-1009.92,-1073.0,60,0
A	xp	9+3350
S	!Druid
T	completewith	Bloodhoofturnins1
A	hs	
A	use	6948
A	bindlocation	222,1
A	subzoneskip	222
S	Druid
T	sofcore	
T	completewith	Bloodhoofturnins1
A	deathskip	
S	Druid
T	hardcore	
T	completewith	Bloodhoofturnins1
A	goto	1412/1,-383.66,-2230.99,120
A	subzoneskip	222
S	
A	goto	1412/1,-347.19,-2364.91
A	vendor	
A	target	Innkeeper Kauth
A	isQuestAvailable	870
S	
A	goto	1412/1,-353.86,-2336.14
A	turnin	770
A	target	Skorn Whitecloud
A	isOnQuest	770
S	Warrior
T	season	2
A	goto	1412/1,-330.23,-2388.20
A	collect	204688,1
A	collect	204689,1
A	collect	204690,1
A	target	Vateya Timberhoof
A	train	403475,1
S	Warrior
T	season	2
A	use	204688
A	collect	204703,1
A	train	403475,1
S	Warrior
T	season	2
A	train	403475
A	use	204703
A	itemcount	204703,1
S	Tauren
A	turnin	746
A	target	+Baine Bloodhoof
A	goto	1412/1,-392.91,-2333.40
A	turnin	743
A	target	+Ruul Eagletalon
A	goto	1412/1,-384.69,-2397.10
A	turnin	758
A	timer	8,Thunderhorn Cleansing RP
A	accept	759
A	target	+Mull Thunderhorn
A	goto	1412/1,-445.83,-2340.93
A	turnin	761
A	target	+Harken Windtotem
A	goto	1412/1,-454.56,-2304.63
A	isQuestComplete	761
S	Tauren
T	label	Bloodhoofturnins1
A	turnin	746
A	target	+Baine Bloodhoof
A	goto	1412/1,-392.91,-2333.40
A	turnin	743
A	target	+Ruul Eagletalon
A	goto	1412/1,-384.69,-2397.10
A	turnin	758
A	timer	8,Thunderhorn Cleansing RP
A	accept	759
A	target	+Mull Thunderhorn
A	goto	1412/1,-445.83,-2340.93
S	!Tauren
A	turnin	746
A	target	+Baine Bloodhoof
A	goto	1412/1,-392.91,-2333.40
A	turnin	743
A	target	+Ruul Eagletalon
A	goto	1412/1,-384.69,-2397.10
A	turnin	761
A	target	+Harken Windtotem
A	goto	1412/1,-454.56,-2304.63
A	isQuestComplete	761
S	!Tauren
A	turnin	746
A	target	+Baine Bloodhoof
A	goto	1412/1,-392.91,-2333.40
A	turnin	743
A	target	+Ruul Eagletalon
A	goto	1412/1,-384.69,-2397.10
S	
T	optional	
T	label	Bloodhoofturnins1
S	
T	completewith	AlphaTeeth
A	destroy	4702
S	Hunter
A	goto	1412/1,-289.65,-2275.51
A	collect	2519,1000,6061,1 << Hunter
A	target	Kennah Hawkseye
S	
A	goto	1412/1,-365.17,-2227.56
A	turnin	766
A	target	Maur Raincaller
A	isQuestComplete	766
S	Warrior
A	goto	1412/1,-496.17,-2347.78
A	trainer	
A	accept	1505
A	target	Krang Stonehoof
S	Shaman
A	goto	1412/1,-437.61,-2298.80
A	accept	2984
A	trainer	
A	target	Narm Skychaser
S	Hunter
A	goto	1412/1,-408.32,-2180.30
A	accept	6061
A	trainer	
A	target	Yaw Sharpmane
S	Druid
A	goto	1412/1,-442.74,-2315.59
A	trainer	
A	accept	5928
A	target	Gennia Runetotem
A	isQuestAvailable	5928
S	Druid
A	goto	1412/1,-442.74,-2315.59
A	train	8924
A	target	Gennia Runetotem
S	Hunter
T	loop	
A	goto	1412/1,24.77,-2239.89,0
A	goto	1412/1,-154.53,-2152.56,50,0
A	goto	1412/1,-44.59,-2177.22,50,0
A	goto	1412/1,24.77,-2239.89,50,0
A	use	15914
A	complete	6061,1
A	mob	Adult Plainstrider
S	Hunter
A	goto	1412/1,-408.32,-2180.30
A	turnin	6061
A	accept	6087
A	target	Yaw Sharpmane
S	Hunter
T	loop	
A	goto	1412/1,-494.63,-1720.66,0
A	goto	1412/1,-375.96,-1990.55,50,0
A	goto	1412/1,-348.73,-1890.2,50,0
A	goto	1412/1,-427.33,-1823.41,50,0
A	goto	1412/1,-494.63,-1720.66,50,0
A	use	15915
A	complete	6087,1
A	mob	Prairie Stalker
S	Hunter
A	goto	1412/1,-408.32,-2180.30
A	turnin	6087
A	accept	6088
A	target	Yaw Sharpmane
S	Hunter
T	loop	
A	goto	1412/1,-379.55,-1688.47,0
A	goto	1412/1,-379.55,-1688.47,80,0
A	goto	1412/1,-285.02,-1652.85,80,0
A	goto	1412/1,-601.49,-1793.62,80,0
A	use	15916
A	complete	6088,1
A	mob	Swoop
S	Hunter
A	goto	1412/1,-408.32,-2180.30
A	turnin	6088
A	accept	6089
A	target	Yaw Sharpmane
S	
A	goto	1412/1,-399.07,-2378.95
A	collect	1179,20,818,1 << Shaman/Druid
A	collect	4541,20,818,1 << Warrior
A	target	Innkeeper Grosk
A	money	<0.05
A	target	Jhawna Oatwind
S	
A	goto	1412/1,-353.86,-2336.14
A	accept	861
A	target	Skorn Whitecloud
S	
T	loop	
A	goto	1412/1,-784.9,-2350.18,0
A	goto	1412/1,-597.9,-2301.54,50,0
A	goto	1412/1,-674.96,-2336.14,50,0
A	goto	1412/1,-784.9,-2350.18,50,0
A	goto	1412/1,-904.6,-2371.07,50,0
A	goto	1412/1,-1016.6,-2410.12,50,0
A	goto	1412/1,-784.9,-2350.18,50,0
A	line	Mulgore,51.50,59.23,53.00,60.24,55.14,60.65,57.47,61.26,59.65,62.40
A	turnin	751
A	accept	764
A	accept	765
A	unitscan	Morin Cloudstalker
S	
T	completewith	AlphaTeeth
A	complete	861,1
A	mob	Flatland Prowler
S	Hunter
T	completewith	next
A	cast	1515
A	mob	Prairie Wolf Alpha
S	Tauren
T	label	AlphaTeeth
T	loop	
A	goto	1412/1,-1360.3,-2568.01,0
A	goto	1412/1,-1403.97,-2457.38,50,0
A	goto	1412/1,-1360.3,-2568.01,50,0
A	goto	1412/1,-1232.89,-2544.03,50,0
A	goto	1412/1,-1127.57,-2516.98,50,0
A	goto	1412/1,-1117.3,-2373.13,50,0
A	goto	1412/1,-1218.51,-2345.38,50,0
A	goto	1412/1,-1320.23,-2306.34,50,0
A	goto	1412/1,-1426.06,-2295.72,50,0
A	complete	759,1
A	mob	Prairie Wolf Alpha
S	Tauren
T	softcore	
T	completewith	Thunderhorn2
A	deathskip	
S	Tauren
T	hardcore	
T	completewith	Thunderhorn2
A	goto	1412/1,-341.02,-2173.79,150
A	subzoneskip	222
S	Tauren
T	label	Thunderhorn2
A	goto	1412/1,-445.31,-2341.620
A	turnin	759
A	accept	760
A	target	Mull Thunderhorn
S	
T	completewith	CampTFP
A	goto	1412/1,-1527.78,-2341.62,100,0
A	zone	The Barrens
S	!Druid
A	goto	1413/1,-1881.35,-2383.82
A	fp	Camp Taurajo
A	target	Omusa Thunderhorn
A	isQuestAvailable	848
S	Druid
A	goto	1413/1,-1881.35,-2383.82
A	fp	Camp Taurajo
A	fly	Thunder Bluff
A	target	Omusa Thunderhorn
A	isQuestAvailable	848
S	
T	optional	
T	label	CampTFP
S	Druid
A	goto	1456/1,38.32,-1300.48
A	home	
A	target	Innkeeper Pala
A	bindlocation	1638
A	isQuestAvailable	5932
S	Druid
A	goto	1456/1,-298.5,-1049.01
A	accept	886
A	target	Arch Druid Hamuul Runetotem
S	Druid
T	completewith	next
A	goto	1456/1,-230.66,-1059.79,80
S	Druid
A	goto	1456/1,-283.89,-1039.96
A	turnin	5928
A	accept	5922
A	target	Arch Druid Hamuul Runetotem
A	target	Turak Runetotem
A	isOnQuest	5928
S	Druid
A	goto	1456/1,-283.89,-1039.96
A	accept	5922
A	target	Arch Druid Hamuul Runetotem
A	target	Turak Runetotem
S	Druid
T	completewith	next
A	cast	18960
A	zoneskip	Moonglade
S	Druid
A	goto	1450/1,-2678.76,8019.94
A	turnin	5922
A	accept	5930
A	target	Dendrite Starblaze
S	Druid
A	goto	1450/1,-2286.12,8068.28
A	complete	5930,1
A	target	Great Bear Spirit
A	skipgossip	
S	Druid
T	completewith	next
A	cast	18960
S	Druid
A	goto	1450/1,-2678.76,8019.94
A	turnin	5930
A	accept	5932
A	target	Dendrite Starblaze
S	Druid
T	completewith	DruidBearForm
A	hs	
A	bindlocation	1638,1
A	zoneskip	Thunder Bluff
A	cooldown	item,6948,>0
A	use	6948
S	Druid
T	completewith	next
A	goto	1450/1,-2403.61,7785.46
A	fly	Thunder Bluff
A	target	Bunthen Plainswind
A	zoneskip	Thunder Bluff
A	cooldown	item,6948,<0
S	Druid
T	label	DruidBearForm
A	goto	1456/1,-283.89,-1039.96
A	turnin	5932
A	accept	6002
A	target	Turak Runetotem
S	Druid
T	completewith	next
A	goto	1456/1,26.1,-1196.66
A	fly	Camp Taurajo
A	target	Tal
A	zoneskip	The Barrens
S	Druid
A	goto	1413/1,-1633.08,-2499.35
A	use	15710
A	complete	6002,1
A	mob	Lunaclaw
A	target	Lunaclaw Spirit
A	skipgossip	
S	Tauren
A	goto	1413/1,-1926.95,-2346.66
A	accept	854
A	target	Kirge Sternhorn
S	
T	completewith	next
A	subzone	380
S	
A	goto	1413/1,-2672.76,-544.77
A	turnin	886
A	accept	870
A	target	Tonga Runetotem
S	Tauren
A	goto	1413/1,-2595.75,-468.43
A	turnin	854
A	target	Thork
S	
A	goto	1413/1,-2589.67,-424.51
A	accept	848
A	target	Apothecary Helbrim
S	
A	goto	1413/1,-2595.75,-437.35
A	fp	The Crossroads
A	target	Devrak
A	isQuestAvailable	848
S	
A	goto	1413/1,-2566.36,-350.19
A	accept	6361
A	target	Jahan Hawkwing
S	
T	completewith	next
A	complete	848,1
S	
A	goto	1413/1,-1943.16,89.64
A	complete	870,1
S	
T	loop	
A	goto	1413/1,-1957.35,38.29,0
A	goto	1413/1,-1957.35,38.29,40,0
A	goto	1413/1,-1957.35,126.12,40,0
A	goto	1413/1,-1896.55,92.34,40,0
A	goto	1413/1,-1825.62,-36.03,40,0
A	complete	848,1
S	
T	softcore	
T	completewith	ZamahPickup
A	deathskip	
S	
T	hardcore	
T	completewith	ZamahPickup
A	subzone	380
S	
A	goto	1413/1,-2672.76,-544.77
A	turnin	870
A	accept	877
A	target	Tonga Runetotem
A	isQuestComplete	870
S	
T	optional	
A	goto	1413/1,-2672.76,-544.77
A	accept	877
A	target	Tonga Runetotem
A	isQuestTurnedIn	877
S	
A	goto	1413/1,-2645.40,-406.94
A	home	
A	target	Innkeeper Boorand Plainswind
A	bindlocation	380
A	isQuestAvailable	853
S	
A	goto	1413/1,-2589.67,-424.51
A	turnin	848
A	timer	7,Fungal Spores RP
A	accept	853
A	target	Apothecary Helbrim
A	isQuestComplete	848
S	
T	optional	
T	label	ZamahPickup
A	goto	1413/1,-2589.67,-424.51
A	accept	853
A	target	Apothecary Helbrim
A	isQuestTurnedIn	848
S	
A	goto	1413/1,-2595.75,-437.35
A	turnin	6361
A	accept	6362
A	target	Devrak
S	
T	completewith	RideToTB
A	goto	1413/1,-2595.75,-437.35
A	fly	Thunder Bluff
A	target	Devrak
A	zoneskip	Thunder Bluff
S	
T	sticky	
T	completewith	CauldronStirrer
A	isOnQuest	853
S	
T	label	RideToTB
A	goto	1456/1,40.72,-1238.97
A	turnin	6362
A	accept	6363
A	target	Ahanu
S	Hunter
A	goto	1456/1,-123.15,-1412.93
A	turnin	861
A	accept	860
A	target	Melor Stonehoof
A	isQuestComplete	861
S	Hunter
A	goto	1456/1,-123.15,-1412.93
A	accept	860
A	target	Melor Stonehoof
A	isQuestTurnedIn	861
S	Hunter
A	goto	1456/1,-82.45,-1472.07
A	turnin	6089
A	target	Holt Thunderhorn
S	Hunter
A	goto	1456/1,-47.79,-1434.508
A	train	24547
A	target	Hesuwa Thunderhorn
S	Hunter
T	completewith	CauldronStirrer
S	Druid
A	goto	1456/1,89.46,-1286.50
A	train	199
A	target	Ansekhwa
A	money	<0.1154
S	Warrior/Hunter
A	goto	1456/1,89.46,-1286.50
A	train	227
A	target	Ansekhwa
S	
A	goto	1456/1,122.13,-1263.32
A	accept	744
A	target	Eyahn Eagletalon
S	Shaman
T	season	2
A	goto	1456/1,104.91,-1308.28
A	accept	76156
A	target	Boarton Shadetotem
A	train	410104,1
A	xp	<4,1
S	
T	completewith	next
A	goto	1456/1,222.96,-1079.42,40,0
A	goto	1456/1,219.09,-1051.44,10
S	
T	label	CauldronStirrer
A	goto	1456/1,278.48,-995.29
A	turnin	853
A	target	Apothecary Zamah
A	isOnQuest	853
S	
T	optional	
T	completewith	ReturntoJahan
A	use	5340
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<10.1
A	itemcount	5340,1
S	Warrior
T	season	2
T	completewith	next
A	goto	1456/1,216.80,-975.25,-1
A	goto	1456/1,243.31,-979.77,-1
A	target	Netali Proudwind
A	target	Mooart
A	skipgossip	
S	Warrior
T	season	2
A	goto	1456/1,216.80,-975.25
A	collect	204716,1
A	target	Netali
A	train	425447,1
A	skipgossip	
S	Warrior
T	season	2
A	train	425447
A	use	204716
A	itemcount	204716,1
S	
T	label	ReturntoJahan
A	goto	1456/1,26.1,-1196.66
A	turnin	6363
A	accept	6364
A	target	Tal
S	
A	goto	1456/1,-109.58,-1209.75
A	turnin	775
A	accept	776
A	target	Cairne Bloodhoof
S	Druid
T	completewith	next
A	goto	1456/1,-230.66,-1059.79,80
S	Druid
A	goto	1456/1,-281.56,-1039.41
A	turnin	6002
A	target	Turak Runetotem
S	
T	ah	
A	goto	1456/1,52.93,-1150.53
A	train	8613
A	target	Mooranta
S	
T	ah	
A	goto	1456/1,53.35,-1161.18
A	accept	768
A	target	Veren Tallstrider
A	skill	skinning,<1,1
S	
T	ah	
A	goto	1456/1,95.1,-1210.23
A	collect	2318,12,768,1
A	target	Auctioneer Stampi
A	skill	skinning,<1,1
S	
T	ah	
A	goto	1456/1,53.35,-1161.18
A	turnin	768
A	target	Veren Tallstrider
A	skill	skinning,<1,1
S	Hunter
A	goto	1456/1,-29.42,-1182.54
A	collect	117,5,744,1
A	target	Kaga Mistrunner
S	Shaman
T	season	2
T	loop	
T	completewith	VentureCoKills
A	complete	76156,1
A	train	410104,1
A	xp	<4,1
S	Shaman
T	season	2
T	era/som	
T	completewith	Fizsprocket1
A	goto	1412/1,-1112.16,-1892.6,20
S	Shaman
T	season	2
T	completewith	next
A	complete	764,1
A	mob	+Venture Co. Worker
A	complete	764,2
A	mob	+Venture Co. Supervisor
S	Shaman
T	season	2
T	label	Fizsprocket1
A	goto	1412/1,-1288.89,-1756.97
A	complete	765,1
A	mob	Supervisor Fizsprocket
S	Shaman
T	season	2
T	label	VentureCoKills
T	loop	
A	goto	1412/1,-1103.94,-1901.5,0
A	goto	1412/1,-1103.94,-1901.5,25,0
A	goto	1412/1,-1039.72,-1911.44,25,0
A	goto	1412/1,-1008.9,-1924.11,25,0
A	goto	1412/1,-1018.14,-1946.03,25,0
A	goto	1412/1,-1041.78,-1955.96,25,0
A	goto	1412/1,-1137.85,-1942.26,25,0
A	goto	1412/1,-1131.68,-1911.44,25,0
A	complete	764,1
A	mob	+Venture Co. Worker
A	complete	764,2
A	mob	+Venture Co. Supervisor
S	Shaman
T	season	2
T	loop	
A	goto	1412/1,-1228.27,-1778.89,15,0
A	goto	1412/1,-1178.95,-1739.16,15,0
A	goto	1412/1,-1054.11,-1738.13,15,0
A	goto	1412/1,-1118.84,-1688.47,15,0
A	goto	1412/1,-1214.91,-1618.60,15,0
A	goto	1412/1,-1208.74,-1670.320,15,0
A	goto	1412/1,-1085.44,-1540.17,15,0
A	goto	1412/1,-1016.09,-1507.63,15,0
A	goto	1412/1,-1122.95,-1476.80,15,0
A	complete	76156,1
A	train	410104,1
A	xp	<4,1
S	Shaman
T	season	2
T	completewith	next
A	zone	Thunder Bluff
A	train	410104,1
A	xp	<4,1
S	Shaman
T	season	2
A	goto	1456/1,104.91,-1308.28
A	turnin	76156
A	accept	76160
A	target	Boarton Shadetotem
A	train	410104,1
A	xp	<4,1
S	
T	sticky	
T	completewith	ThunderBluff
A	collect	4854,1,770
A	accept	770
A	use	4854
A	unitscan	Ghost Howl
S	Druid
T	season	2
T	completewith	ProwlerClaws
A	collect	206954,1
A	mob	Flatland Prowler
A	mob	Prairie Wolf Alpha
A	train	410025,1
S	
T	completewith	Arrachea
A	complete	861,1
A	mob	Flatland Prowler
S	Shaman
T	season	2
T	completewith	next
A	complete	744,1
A	mob	+Windfury Sorceress
A	complete	744,2
A	mob	+Windfury Matriarch
A	train	410104,1
S	Shaman
T	season	2
T	loop	
A	goto	1412/1,137.79,-696.25,0
A	goto	1412/1,54.57,-821.94,10,0
A	goto	1412/1,106.46,-644.87,10,0
A	goto	1412/1,95.15,-622.61,10,0
A	goto	1412/1,67.41,-550.340,10,0
A	goto	1412/1,92.58,-528.76,10,0
A	goto	1412/1,128.55,-615.07,10,0
A	goto	1412/1,131.12,-629.46,10,0
A	goto	1412/1,208.69,-656.86,10,0
A	goto	1412/1,188.14,-663.71,10,0
A	goto	1412/1,187.63,-704.470,10,0
A	goto	1412/1,170.16,-712.69,10,0
A	goto	1412/1,165.02,-727.07,10,0
A	goto	1412/1,137.79,-696.25,10,0
A	collect	206170,8,76160,1
A	train	410104,1
S	
T	loop	
A	goto	1412/1,419.33,-1238.77,0
A	goto	1412/1,496.39,-940.79,0
A	goto	1412/1,419.33,-1238.77,40,0
A	goto	1412/1,496.39,-940.79,40,0
A	complete	744,1
A	mob	+Windfury Sorceress
A	complete	744,2
A	mob	+Windfury Matriarch
S	Tauren
A	goto	1412/1,-135.52,-745.57
A	use	5416
A	complete	760,1
S	Warrior/Hunter
T	season	2
T	loop	
A	goto	1412/1,-654.41,-690.77,0
A	goto	1412/1,-654.41,-690.77,90,0
A	goto	1412/1,-448.91,-824.34,90,0
A	goto	1412/1,-613.31,-1430.57,90,0
A	goto	1412/1,-839.36,-1399.74,90,0
A	complete	776,1
A	collect	204809,1 << Warrior
A	collect	206169,1 << Hunter
A	unitscan	Arra'chea
A	train	403476,1 << Warrior
A	train	410123,1 << Hunter
S	Warrior
T	season	2
A	train	403476
A	use	204809
A	itemcount	204809,1
S	Hunter
T	season	2
A	train	410123
A	use	206169
A	itemcount	206169,1
S	
T	label	Arrachea
T	loop	
A	goto	1412/1,-654.41,-690.77,0
A	goto	1412/1,-654.41,-690.77,90,0
A	goto	1412/1,-448.91,-824.34,90,0
A	goto	1412/1,-613.31,-1430.57,90,0
A	goto	1412/1,-839.36,-1399.74,90,0
A	complete	776,1
A	unitscan	Arra'chea
S	
T	label	ProwlerClaws
T	loop	
A	goto	1412/1,-201.28,-648.30,0
A	goto	1412/1,-201.28,-648.30,90,0
A	goto	1412/1,12.44,-730.15,90,0
A	goto	1412/1,140.88,-849.69,90,0
A	goto	1412/1,-241.87,-868.52,90,0
A	goto	1412/1,-454.05,-987.03,90,0
A	complete	861,1
A	mob	Flatland Prowler
S	Druid
T	season	2
T	loop	
A	goto	1412/1,-201.28,-648.30,0
A	goto	1412/1,-201.28,-648.30,90,0
A	goto	1412/1,12.44,-730.15,90,0
A	goto	1412/1,140.88,-849.69,90,0
A	goto	1412/1,-241.87,-868.52,90,0
A	goto	1412/1,-454.05,-987.03,90,0
A	collect	206954,1
A	mob	Flatland Prowler
A	mob	Prairie Wolf Alpha
A	train	410025,1
S	Druid
T	season	2
A	equip	18,206954
A	use	206954
A	train	410025,1
S	Druid
T	season	2
T	completewith	next
S	Druid
T	season	2
A	train	410025
A	use	206954
A	itemcount	206954,1
S	
T	completewith	next
A	zone	Thunder Bluff
S	
T	label	RFCPickups1
A	goto	1456/1,-218.13,-1055.97
A	accept	5722
A	accept	5723
A	target	Rahauro
A	dungeon	RFC
S	
A	goto	1456/1,-109.58,-1209.75
A	turnin	776
A	target	Cairne Bloodhoof
A	isQuestComplete	776
S	
A	goto	1456/1,122.13,-1263.32
A	turnin	744
A	target	Eyahn Eagletalon
S	Shaman
T	season	2
A	goto	1456/1,104.91,-1308.28
A	turnin	76160
A	accept	76240
A	target	Boarton Shadetotem
A	train	410104,1
A	xp	<4,1
S	Shaman
T	season	2
T	ah	
A	goto	1456/1,44.58,-1263.320,0
A	goto	1456/1,94.89,-1210.30
A	collect	6291,1,76240,1
A	target	Auctioneer Stampi
A	train	410104,1
A	xp	<4,1
S	Shaman
T	season	2
T	ssf	
T	completewith	Sewa
A	goto	1456/1,35.18,-1208.98,12,0
A	goto	1456/1,25.16,-1198.40,4,0
A	goto	1456/1,31.43,-1192.07,4,0
A	goto	1456/1,36.02,-1196.11,4,0
A	goto	1456/1,32.99,-1201.400,4,0
A	goto	1456/1,-65.54,-1177.18,15
A	train	410104,1
A	xp	<4,1
S	Shaman
T	season	2
T	ssf	
T	sticky	
T	label	Kah
A	goto	1456/1,-69.19,-1172.80,-1
A	train	7734
A	target	Kah Mistrunner
A	train	410104,1
A	xp	<4,1
S	Shaman
T	season	2
T	ssf	
T	label	Sewa
A	goto	1456/1,-65.54,-1177.18,-1
A	collect	6256,1
A	collect	6529,1
A	target	Sewa Mistrunner
A	train	410104,1
A	xp	<4,1
S	Shaman
T	season	2
T	ssf	
T	completewith	Fish
T	requires	Kah
T	label	Pole
A	equip	16,6256
A	use	6256
A	train	410104,1
A	xp	<4,1
S	Shaman
T	season	2
T	ssf	
T	completewith	Fish
T	requires	Pole
A	aura	8087
A	use	6529
A	train	410104,1
A	xp	<4,1
S	Shaman
T	season	2
T	ssf	
T	label	Fish
T	requires	Kah
A	goto	1456/1,94.78,-1257.41
A	collect	6291,1,76240,1
A	train	410104,1
A	xp	<4,1
S	Shaman
T	season	2
A	complete	76240,1
A	use	206344
A	train	410104,1
A	xp	<4,1
S	Shaman
T	season	2
A	goto	1456/1,104.91,-1308.28
A	turnin	76240
A	target	Boarton Shadetotem
A	train	410104,1
A	xp	<4,1
S	
A	goto	1456/1,-123.15,-1412.93
A	turnin	861
A	accept	860
A	target	Melor Stonehoof
S	
T	completewith	WildManeTurnIn
A	subzone	222
S	
A	goto	1412/1,-353.86,-2336.14
A	turnin	770
A	target	Skorn Whitecloud
A	isOnQuest	770
S	Tauren
A	goto	1412/1,-445.31,-2341.620
A	turnin	760
A	target	Mull Thunderhorn
S	Shaman
A	goto	1412/1,-437.61,-2298.80
A	train	547
A	target	Narm Skychaser
A	xp	<12,1
S	Druid
A	goto	1412/1,-442.74,-2315.59
A	train	8936
A	target	Gennia Runetotem
A	xp	<12,1
S	Warrior
A	goto	1412/1,-496.17,-2347.78
A	train	7384
A	target	Krang Stonehoof
A	xp	<12,1
S	Hunter
A	goto	1412/1,-408.32,-2180.30
A	train	14281
A	target	Yaw Sharpmane
A	xp	<12,1
S	
T	optional	
T	label	WildManeTurnIn
S	
T	completewith	Fizsprocket
A	goto	1412/1,-1112.16,-1892.6,20
S	
T	completewith	next
A	complete	764,1
A	mob	+Venture Co. Worker
A	complete	764,2
A	mob	+Venture Co. Supervisor
S	
T	label	Fizsprocket
A	goto	1412/1,-1288.89,-1756.97
A	complete	765,1
A	mob	Supervisor Fizsprocket
S	
T	loop	
A	goto	1412/1,-1103.94,-1901.5,0
A	goto	1412/1,-1103.94,-1901.5,25,0
A	goto	1412/1,-1039.72,-1911.44,25,0
A	goto	1412/1,-1008.9,-1924.11,25,0
A	goto	1412/1,-1018.14,-1946.03,25,0
A	goto	1412/1,-1041.78,-1955.96,25,0
A	goto	1412/1,-1137.85,-1942.26,25,0
A	goto	1412/1,-1131.68,-1911.44,25,0
A	complete	764,1
A	mob	+Venture Co. Worker
A	complete	764,2
A	mob	+Venture Co. Supervisor
S	
T	xprate	<1.5
T	loop	
A	goto	1412/1,-1103.94,-1901.5,25,0
A	goto	1412/1,-1039.72,-1911.44,25,0
A	goto	1412/1,-1008.9,-1924.11,25,0
A	goto	1412/1,-1018.14,-1946.03,25,0
A	goto	1412/1,-1041.78,-1955.96,25,0
A	goto	1412/1,-1137.85,-1942.26,25,0
A	goto	1412/1,-1131.68,-1911.44,25,0
A	xp	11+7150
S	
T	xprate	>1.49
T	loop	
A	goto	1412/1,-1103.94,-1901.5,25,0
A	goto	1412/1,-1039.72,-1911.44,25,0
A	goto	1412/1,-1008.9,-1924.11,25,0
A	goto	1412/1,-1018.14,-1946.03,25,0
A	goto	1412/1,-1041.78,-1955.96,25,0
A	goto	1412/1,-1137.85,-1942.26,25,0
A	goto	1412/1,-1131.68,-1911.44,25,0
A	xp	11+6375
S	
T	loop	
A	goto	1412/1,-784.9,-2350.18,0
A	goto	1412/1,-597.9,-2301.54,50,0
A	goto	1412/1,-674.96,-2336.14,50,0
A	goto	1412/1,-784.9,-2350.18,50,0
A	goto	1412/1,-904.6,-2371.07,50,0
A	goto	1412/1,-1016.6,-2410.12,50,0
A	goto	1412/1,-784.9,-2350.18,50,0
A	line	Mulgore,51.50,59.23,53.00,60.24,55.14,60.65,57.47,61.26,59.65,62.40
A	turnin	764
A	turnin	765
A	unitscan	Morin Cloudstalker
S	Shaman
A	goto	1412/1,-437.61,-2298.80
A	train	547
A	target	Narm Skychaser
A	xp	<12,1
S	Druid
A	goto	1412/1,-442.74,-2315.59
A	train	8936
A	target	Gennia Runetotem
A	xp	<12,1
S	Warrior
A	goto	1412/1,-496.17,-2347.78
A	train	5242
A	target	Krang Stonehoof
A	xp	<12,1
S	Hunter
A	goto	1412/1,-408.32,-2180.30
A	train	14281
A	target	Yaw Sharpmane
A	xp	<12,1
S	
T	completewith	HidesTurnIn
A	hs	
A	use	6948
A	bindlocation	380,1
A	subzoneskip	380
A	cooldown	item,6948,>0
S	
T	completewith	next
A	subzone	378
A	cooldown	item,6948,<0,1
S	
A	goto	1413/1,-1881.35,-2383.82
A	fly	Crossroads
A	target	Omusa Thunderhorn
A	cooldown	item,6948,<0,1
S	
T	label	HidesTurnIn
A	goto	1413/1,-2566.36,-350.19
A	turnin	6364
A	target	Jahan Hawkwing
S	
A	goto	1413/1,-2589.67,-424.51
A	accept	1492
A	target	Apothecary Helbrim
S	
A	goto	1413/1,-2595.75,-473.15
A	accept	871
A	accept	5041
A	target	Thork
S	
A	goto	1413/1,-2607.91,-475.180
A	accept	867
A	target	Darsok Swiftdagger
S	
A	goto	1413/1,-2669.72,-481.94
A	turnin	860
A	accept	844
A	target	Sergra Darkthorn
S	
A	goto	1413/1,-2639.32,-436.00
A	accept	869
A	target	Gazrog
S	Shaman
T	completewith	next
A	collect	4926,1,819
A	accept	819
A	use	4926
S	Shaman
A	goto	1413/1,-3037.56,264.63
A	turnin	2984
A	accept	1524
A	target	Kranal Fiss
S	Shaman
T	completewith	next
A	goto	1411/1,-3905.13,-228.41,10,0
A	goto	1411/1,-3899.31,-241.45,8,0
A	goto	1411/1,-3899.31,-241.45,8,0
A	goto	1411/1,-3906.71,-270.71,8,0
A	goto	1411/1,-3910.94,-247.45,8,0
A	goto	1411/1,-3931.56,-240.75,8,0
A	goto	1411/1,-3964.35,-242.51,8,0
A	goto	1411/1,-3974.39,-228.76,8,0
A	goto	1411/1,-4020.92,-219.95,8,0
A	goto	1411/1,-4034.67,-232.64,8,0
A	goto	1411/1,-4033.08,-255.91,10
S	Shaman
T	label	CallofFire2
A	goto	1411/1,-3999.24,-268.95
A	turnin	1524
A	accept	1525
A	target	Telf Joolam
S	Warrior
A	goto	1413/1,-3598.95,186.93
A	turnin	1505
A	accept	1498
A	target	Uzzek
S	Warrior
T	loop	
A	goto	1411/1,-4042.6,812.52,0
A	goto	1411/1,-4030.44,724.04,40,0
A	goto	1411/1,-4042.6,812.52,40,0
A	goto	1411/1,-4030.44,875.62,40,0
A	goto	1411/1,-4045.25,925.32,40,0
A	goto	1411/1,-4077.5,960.22,40,0
A	goto	1411/1,-4210.22,952.11,40,0
A	goto	1411/1,-4042.6,812.52,40,0
A	complete	1498,1
A	mob	Lightning Hide
S	Warrior
A	goto	1413/1,-3598.95,186.93
A	turnin	1498
A	accept	1502
A	target	Uzzek
E
G	Guides/forever/Horde-1-12_Mulgore.lua
M	classic	
M	tbc	
M	selector	Horde
M	xprate	>1.99
M	version	1
M	group	RestedXP Forever Guide (H)
M	subgroup	Speedrun Guide 1-22
M	name	1-7 Mulgore
M	next	7-13 Mulgore
M	defaultfor	Tauren
S	!Tauren
T	completewith	next
A	goto	1412/1,-259.85,-2914.28
S	
A	goto	1412/1,-259.85,-2914.28
A	accept	747
A	target	Grull Hawkwind
S	
T	season	2
A	goto	1412/1,-230.56,-2899.21
A	collect	204716,1 << Warrior
A	collect	204806,1 << Warrior
A	collect	209852,1 << Hunter
A	collect	206168,1 << Hunter
A	collect	226401,1 << Hunter
A	collect	216770,1 << Hunter
A	collect	206387,1 << Shaman
A	collect	206381,1 << Shaman
A	collect	208414,1 << Druid
A	collect	210500,1 << Druid
A	collect	206989,1 << Druid
A	collect	227749,1 << Druid
A	target	Rune Broker
A	skipgossip	
S	
T	season	2
T	sticky	
T	optional	
A	use	204716 << Warrior
A	use	204806 << Warrior
A	use	209852 << Hunter
A	use	206168 << Hunter
A	use	226401 << Hunter
A	use	216770 << Hunter
A	use	206387 << Shaman
A	use	208414 << Druid
A	use	210500 << Druid
A	use	206989 << Druid
A	use	227749 << Druid
A	equip	18
A	equip	18
A	train	425447
A	train	403470
A	train	410111
A	train	410121
A	train	409580
A	train	415423
A	train	424718
A	train	416044
A	train	439770
A	engrave	7
A	engrave	7
A	engrave	7
S	Hunter
T	season	2
T	optional	
T	sticky	
A	aura	409583
S	Shaman
T	season	2
T	optional	
T	label	LavaBurst
T	sticky	
A	train	410095
S	Druid
T	season	2
T	optional	
T	sticky	
A	train	410061
A	engrave	5
S	Shaman
T	season	2
T	optional	
T	requires	LavaBurst
T	label	Overload
T	sticky	
A	equip	18,206381
A	train	410094
A	use	206381
S	
A	goto	1412/1,-221.83,-2878.31
A	accept	752
A	target	Chief Hawkwind
S	Warrior/Shaman
T	season	0
T	completewith	next
A	goto	1412/1,-317.9,-2852.63,30,0
A	mob	Plainstrider
A	money	>0.01
S	
T	season	2
A	goto	1412/1,-317.9,-2852.63
A	xp	2
A	xp	2
A	xp	2
A	mob	Plainstrider
S	Shaman/Druid
T	season	2
A	goto	1412/1,-333.83,-2872.15,50,0
T	completewith	next
A	money	>0.0042 << Shaman
A	money	>0.002 << Druid
S	Druid
T	season	2
A	goto	1412/1,-268.07,-2873.86
A	accept	77648
A	turnin	77648
A	target	Gart Mistrunner
S	Warrior/Shaman
T	season	0
A	goto	1412/1,-279.37,-2893.73
A	vendor	
A	target	Kawnie Softbreeze
A	money	>0.01
S	Warrior/Shaman
T	season	2
A	goto	1412/1,-279.37,-2893.73
A	vendor	
A	target	Kawnie Softbreeze
A	money	>0.01
S	Warrior
T	season	0
A	goto	1412/1,-213.61,-2880.71
A	train	6673
A	target	Harutt Thunderhorn
S	Warrior
T	season	2
A	goto	1412/1,-213.61,-2880.71
A	train	6673
A	accept	77651
A	turnin	77651
A	target	Harutt Thunderhorn
S	Shaman
T	season	0
A	goto	1412/1,-264.47,-2874.20
A	train	8017
A	target	Meela Dawnstrider
S	Shaman
T	season	2
A	goto	1412/1,-264.47,-2874.20
A	train	8017
A	accept	77652
A	turnin	77652
A	target	Meela Dawnstrider
S	Shaman/Druid
T	season	2
A	goto	1412/1,-220.29,-2918.73
A	collect	714,1
A	target	Varia Hardhide
S	Hunter
T	season	2
A	goto	1412/1,-225.94,-2865.640
A	accept	77649
A	turnin	77649
A	target	Lanka Farshot
S	Warrior/Shaman/Druid
T	season	2
A	equip	10
A	equip	10
A	engrave	10
A	equip	5
A	engrave	5
A	engrave	10
A	engrave	10
A	use	2127 << Shaman/Druid
A	use	2385 << Warrior
A	use	714 << Shaman
S	Hunter
T	season	2
A	goto	1412/1,-230.56,-2899.21
A	vendor	
A	collect	210818,1 << Hunter
A	collect	213124,1 << Hunter
A	collect	226252,1 << Hunter
A	target	Rune Broker
A	skipgossip	
S	Hunter
T	season	2
A	train	410122
A	train	416086
A	train	440563
A	use	210818 << Hunter
A	use	213124 << Hunter
A	use	226252 << Hunter
S	Hunter
A	equip	10
A	engrave	10
A	use	2125
S	Hunter
T	sticky	
T	optional	
A	engrave	5
A	engrave	6
A	engrave	15
S	Druid
T	sticky	
T	optional	
A	engrave	15
S	
T	completewith	next
A	complete	747,1
A	complete	747,2
A	mob	Plainstrider
S	
A	goto	1412/1,-522.37,-3052.65
A	turnin	752
A	accept	753
A	target	Greatmother Hawkwind
S	
A	goto	1412/1,-532.14,-3059.84
A	complete	753,1
S	
T	loop	
A	goto	1412/1,-385.2,-3117.38,0
A	goto	1412/1,-532.65,-2991.68,50,0
A	goto	1412/1,-573.24,-2967.71,50,0
A	goto	1412/1,-564.5,-2864.96,50,0
A	goto	1412/1,-440.17,-2916.33,50,0
A	goto	1412/1,-371.85,-2894.41,50,0
A	goto	1412/1,-303.52,-3026.27,50,0
A	goto	1412/1,-292.73,-3094.77,50,0
A	goto	1412/1,-385.2,-3117.38,50,0
A	complete	747,1
A	complete	747,2
A	mob	Plainstrider
S	
A	goto	1412/1,-259.85,-2914.28
A	turnin	747,1
A	turnin	747
A	accept	3091
A	accept	3092
A	accept	3093
A	accept	3094
A	accept	750
A	target	Grull Hawkwind
S	
A	goto	1412/1,-279.37,-2893.73
A	collect	2516,1000,750,1 << Hunter
A	vendor	
A	target	Kawnie Softbreeze
S	
A	goto	1412/1,-221.83,-2878.31
A	turnin	753
A	accept	755
A	target	Chief Hawkwind
S	Shaman
A	goto	1412/1,-216.18,-2926.26
A	collect	2132,1,750,1
A	money	<0.0102
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<1.9
A	target	Marjak Keenblade
S	Shaman
T	optional	
T	completewith	RitesoftheEarthmother
A	use	2132
A	itemcount	2132,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<1.9
S	
T	completewith	next
A	complete	750,1
A	mob	Mountain Cougar
S	
T	label	RitesoftheEarthmother
A	goto	1412/1,-139.63,-3430.08
A	turnin	755
A	accept	757
A	target	Seer Graytongue
S	
T	loop	
A	goto	1412/1,-243.41,-3384.87,0
A	goto	1412/1,-172.0,-3330.07,50,0
A	goto	1412/1,-245.46,-3409.53,50,0
A	goto	1412/1,-306.09,-3373.23,50,0
A	goto	1412/1,-333.31,-3405.08,50,0
A	goto	1412/1,-420.65,-3418.09,50,0
A	goto	1412/1,-482.3,-3379.05,50,0
A	goto	1412/1,-571.18,-3368.09,50,0
A	goto	1412/1,-474.6,-3338.29,50,0
A	goto	1412/1,-369.79,-3308.84,50,0
A	goto	1412/1,-267.04,-3351.65,50,0
A	goto	1412/1,-243.41,-3384.87,50,0
A	complete	750,1
A	mob	Mountain Cougar
S	
T	optional	
T	loop	
A	goto	1412/1,-292.73,-3285.2,40,0
A	goto	1412/1,-362.6,-3281.44,40,0
A	goto	1412/1,-452.5,-3246.84,40,0
A	goto	1412/1,-554.23,-3213.96,40,0
A	goto	1412/1,-572.72,-3139.98,40,0
A	goto	1412/1,-626.67,-3065.32,40,0
A	goto	1412/1,-616.9,-2998.53,40,0
A	goto	1412/1,-606.63,-2923.52,40,0
A	goto	1412/1,-621.01,-2847.15,40,0
A	goto	1412/1,-537.27,-2887.22,40,0
A	goto	1412/1,-461.75,-2869.75,40,0
A	goto	1412/1,-387.77,-2851.94,40,0
A	goto	1412/1,-356.43,-2951.61,40,0
A	goto	1412/1,-307.11,-3026.96,40,0
A	goto	1412/1,-265.5,-3086.55,40,0
A	goto	1412/1,-217.21,-3146.15,40,0
A	goto	1412/1,-207.45,-3221.16,40,0
A	xp	3+850
A	mob	Plainstrider
S	Warrior/Druid
T	completewith	GrullTurnin2
A	mob	Plainstrider
A	money	>0.02
S	!Warrior !Druid
T	completewith	next
A	mob	Plainstrider
A	money	>0.01
S	
T	label	GrullTurnin2
A	goto	1412/1,-259.85,-2914.28
A	turnin	750
A	accept	780
A	target	Grull Hawkwind
S	
A	goto	1412/1,-279.37,-2893.73
A	vendor	
A	target	Kawnie Softbreeze
S	
A	goto	1412/1,-247.0,-2899.21
A	accept	3376
A	target	Brave Windfeather
S	Warrior
T	season	2
A	goto	1412/1,-213.61,-2880.71
A	turnin	3091
A	train	100
A	train	772
A	target	Harutt Thunderhorn
A	money	<0.02
S	Warrior
T	season	2
A	goto	1412/1,-213.61,-2880.71
A	turnin	3091
A	train	772
A	target	Harutt Thunderhorn
S	Warrior
T	season	0
A	goto	1412/1,-213.61,-2880.71
A	turnin	3091
A	train	100
A	train	772
A	target	Harutt Thunderhorn
A	money	<0.02
S	Warrior
T	season	0
A	goto	1412/1,-213.61,-2880.71
A	turnin	3091
A	train	772
A	target	Harutt Thunderhorn
S	Hunter
T	season	2
A	goto	1412/1,-225.94,-2865.640
A	turnin	3092
A	train	1978
A	target	Lanka Farshot
S	Hunter
T	season	0
A	goto	1412/1,-225.94,-2865.640
A	turnin	3092
A	train	1978
A	target	Lanka Farshot
S	Druid
T	season	2
A	goto	1412/1,-268.58,-2873.52
A	turnin	3094
A	train	8921
A	target	Gart Mistrunner
S	Druid
T	season	0
A	goto	1412/1,-268.58,-2873.52
A	turnin	3094
A	train	8921
A	target	Gart Mistrunner
S	Shaman
A	goto	1412/1,-250.09,-2882.08
A	accept	1519
A	target	Seer Ravenfeather
S	Shaman
T	season	2
A	goto	1412/1,-264.47,-2874.20
A	turnin	3093
A	train	8042
A	target	Meela Dawnstrider
S	Shaman
T	season	0
A	goto	1412/1,-264.47,-2874.20
A	turnin	3093
A	train	8042
A	target	Meela Dawnstrider
S	
T	loop	
A	goto	1412/1,-828.57,-3199.92,0
A	goto	1412/1,-659.55,-2989.63,50,0
A	goto	1412/1,-736.09,-3007.09,50,0
A	goto	1412/1,-815.21,-3022.51,50,0
A	goto	1412/1,-853.74,-3070.11,50,0
A	goto	1412/1,-810.07,-3145.12,50,0
A	goto	1412/1,-830.62,-3202.32,50,0
A	goto	1412/1,-818.81,-3276.98,50,0
A	goto	1412/1,-866.07,-3330.41,50,0
A	goto	1412/1,-927.72,-3330.41,50,0
A	goto	1412/1,-915.91,-3244.79,50,0
A	goto	1412/1,-896.38,-3197.52,50,0
A	goto	1412/1,-828.57,-3199.92,50,0
A	complete	780,2
A	complete	780,1
A	mob	Battleboar
S	
T	completewith	BristlebackBelts
A	goto	1412/1,-1017.63,-3126.97,30
S	
T	completewith	DirtyMap
A	complete	757,1
A	mob	Bristleback Quilboar
S	Shaman
T	completewith	DirtyMap
A	complete	1519,1
A	mob	Bristleback Shaman
S	
A	goto	1412/1,-1062.33,-3048.54,35,0
A	goto	1412/1,-1155.31,-3056.41,35,0
A	goto	1412/1,-1162.51,-2971.13,35,0
A	goto	1412/1,-1276.56,-2933.11
A	complete	3376,1
A	mob	Chief Sharptusk Thornmantle
S	
T	completewith	next
A	goto	1412/1,-1201.04,-3105.39,40
S	
T	label	DirtyMap
A	goto	1412/1,-1201.04,-3105.390
A	collect	4851,1,781
A	accept	781
A	use	4851
S	Shaman
T	completewith	next
A	complete	1519,1
A	mob	Bristleback Shaman
S	
T	label	BristlebackBelts
T	loop	
A	goto	1412/1,-1236.49,-2956.06,0
A	goto	1412/1,-1230.32,-2898.18,40,0
A	goto	1412/1,-1184.60,-2907.08,40,0
A	goto	1412/1,-1101.88,-2917.70,40,0
A	goto	1412/1,-1115.76,-2974.90,40,0
A	goto	1412/1,-1164.56,-2996.48,40,0
A	goto	1412/1,-1250.36,-2979.01,40,0
A	goto	1412/1,-1333.59,-2948.87,40,0
A	goto	1412/1,-1236.49,-2956.06,40,0
A	complete	757,1
A	mob	Bristleback Quilboar
S	Shaman
T	loop	
A	goto	1412/1,-1232.89,-3017.71,0
A	goto	1412/1,-1226.73,-3053.33,40,0
A	goto	1412/1,-1232.89,-3011.89,40,0
A	goto	1412/1,-1291.46,-2964.97,40,0
A	goto	1412/1,-1345.40,-2938.59,40,0
A	goto	1412/1,-1339.24,-2913.590,40,0
A	goto	1412/1,-1217.99,-2884.48,40,0
A	goto	1412/1,-1232.89,-3017.71,40,0
A	complete	1519,1
A	mob	Bristleback Shaman
S	
T	completewith	next
A	hs	
A	use	6948
S	
A	turnin	780
A	target	+Grull Hawkwind
A	goto	1412/1,-259.85,-2914.28
A	turnin	3376
A	target	+Brave Windfeather
A	goto	1412/1,-247.0,-2899.21
A	turnin	1519
A	accept	1520
A	target	+Seer Ravenfeather << Shaman
A	goto	1412/1,-250.09,-2882.08 << Shaman
A	turnin	781
A	turnin	757
A	accept	763
A	target	+Chief Hawkwind
A	goto	1412/1,-221.83,-2878.31
S	Shaman
T	completewith	CallofEarth
T	label	Rock
A	goto	1412/1,-712.98,-3018.05,30
S	Shaman
T	completewith	next
T	requires	Rock
A	cast	8202
A	use	6635
S	Shaman
A	goto	1412/1,-712.98,-3018.05
A	turnin	1520
A	accept	1521
A	target	Minor Manifestation of Earth
S	Shaman
A	goto	1412/1,-250.09,-2882.08
A	turnin	1521
A	target	Seer Ravenfeather
S	Shaman
T	season	2
A	goto	1412/1,-264.47,-2874.20
A	turnin	77652
A	train	332
A	target	Shikrik
A	target	Meela Dawnstrider
S	Shaman
T	season	0
A	goto	1412/1,-264.47,-2874.20
A	train	332
A	target	Shikrik
A	target	Meela Dawnstrider
S	Hunter
T	season	2
A	goto	1412/1,-225.94,-2865.640
A	train	1130
A	target	Lanka Farshot
A	money	<0.02
S	Hunter
T	season	0
A	goto	1412/1,-225.94,-2865.640
A	train	1130
A	train	3044
A	target	Lanka Farshot
A	money	<0.02
S	Hunter
T	season	0
A	goto	1412/1,-225.94,-2865.640
A	train	3044
A	target	Lanka Farshot
S	Druid
T	season	2
A	goto	1412/1,-268.58,-2873.52
A	train	467
A	train	5177
A	target	Gart Mistrunner
A	money	<0.02
S	Druid
T	season	0
A	goto	1412/1,-268.58,-2873.52
A	train	467
A	train	5177
A	target	Gart Mistrunner
A	money	<0.02
S	Druid
T	season	0
A	goto	1412/1,-268.58,-2873.52
A	train	5177
A	target	Gart Mistrunner
S	Warrior
T	season	2
A	goto	1412/1,-213.61,-2880.71
A	train	3127
A	train	6343
A	target	Harutt Thunderhorn
A	money	<0.02
S	Warrior
T	season	2
A	goto	1412/1,-213.61,-2880.71
A	train	3127
A	target	Harutt Thunderhorn
S	Warrior
T	season	0
A	goto	1412/1,-213.61,-2880.71
A	train	3127
A	train	6343
A	target	Harutt Thunderhorn
A	money	<0.02
S	Warrior
T	season	0
A	goto	1412/1,-213.61,-2880.71
A	train	3127
A	target	Harutt Thunderhorn
S	
T	season	2
A	goto	1412/1,-230.56,-2899.21
A	vendor	
A	target	Rune Broker
A	skipgossip	
S	
A	goto	1412/1,69.47,-3065.66
A	accept	1656
A	target	Antur Fallow
E
G	Guides/forever/Horde-1-12_Mulgore.lua
M	classic	
M	tbc	
M	selector	Horde
M	xprate	>1.99
M	version	1
M	group	RestedXP Forever Guide (H)
M	subgroup	Speedrun Guide 1-22
M	name	7-13 Mulgore
M	next	13-20 The Barrens
M	defaultfor	Tauren
S	Druid
T	season	2
A	goto	1412/1,212.80,-2655.69
A	collect	206989,1
A	mob	Lunar Stone
A	train	416044,1
S	Druid
T	season	2
A	train	416044
A	use	206989
A	itemcount	206989,1
S	
T	completewith	BloodhoofHome
T	softcore	
A	deathskip	
S	
T	hardcore	
T	completewith	BloodhoofHome
A	goto	1412/1,-384.69,-2351.89,120
A	subzoneskip	222
S	
T	softcore	
A	goto	1412/1,-365.17,-2227.56
A	accept	766
A	target	Maur Raincaller
S	
T	xprate	<2.1
A	accept	743
A	target	+Ruul Eagletalon
A	goto	1412/1,-385.2,-2396.76
A	turnin	763
A	accept	745
A	accept	767
A	accept	746
A	target	+Baine Bloodhoof
A	goto	1412/1,-392.91,-2333.40
S	
T	xprate	>2.09
A	accept	743
A	target	+Ruul Eagletalon
A	goto	1412/1,-385.2,-2396.76
A	turnin	763
A	accept	767
A	accept	746
A	target	+Baine Bloodhoof
A	goto	1412/1,-392.91,-2333.40
S	
T	label	BloodhoofHome
A	goto	1412/1,-347.7,-2365.25
A	turnin	1656
A	home	
A	target	Innkeeper Kauth
A	bindlocation	222
A	subzoneskip	222,1
S	Shaman/Druid
A	goto	1412/1,-297.87,-2279.970
A	vendor	
A	target	Mahnott Roughwound
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Shaman/Druid
A	goto	1412/1,-297.87,-2279.970
A	collect	2495,1,761,1
A	money	<0.0504
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Warrior
A	goto	1412/1,-297.87,-2279.970
A	vendor	
A	target	Mahnott Roughwound
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.9
S	Warrior
A	goto	1412/1,-297.87,-2279.970
A	collect	2493,1,761,1
A	money	<0.0701
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.9
S	Hunter
A	goto	1412/1,-289.65,-2275.51
A	vendor	
A	target	Kennah Hawkseye
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.0
S	Hunter
A	goto	1412/1,-289.65,-2275.51
A	collect	2509,1,761,1
A	money	<0.0414
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.0
S	Hunter
A	goto	1412/1,-289.65,-2275.51
A	collect	2516,1000,750,1 << Hunter
A	target	Kennah Hawkseye
S	Shaman/Druid
T	optional	
T	completewith	Well
A	use	2495
A	itemcount	2495,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Warrior
T	optional	
T	completewith	Well
A	use	2493
A	itemcount	2493,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.9
S	Hunter
T	optional	
T	completewith	Well
A	use	2509
A	itemcount	2509,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.0
S	Tauren
A	accept	766
A	target	+Maur Raincaller
A	goto	1412/1,-365.17,-2227.56
A	turnin	767
A	accept	771
A	target	+Zarlman Two-Moons
A	goto	1412/1,-405.75,-2243.32
A	accept	761
A	target	+Harken Windtotem
A	goto	1412/1,-454.56,-2304.63
A	accept	748
A	target	+Mull Thunderhorn
A	goto	1412/1,-445.31,-2341.620
S	!Tauren
A	accept	766
A	target	+Maur Raincaller
A	goto	1412/1,-365.17,-2227.56
A	turnin	767
A	accept	771
A	target	+Zarlman Two-Moons
A	goto	1412/1,-405.75,-2243.32
A	accept	761
A	target	+Harken Windtotem
A	goto	1412/1,-454.56,-2304.63
S	
T	sticky	
T	completewith	Well
A	complete	766,1
A	complete	766,2
A	complete	766,3
A	complete	766,4
S	Tauren
T	completewith	Ambercorns
A	complete	748,1
A	mob	+Prairie Wolf
A	complete	748,2
A	mob	+Adult Plainstrider
S	Hunter
T	season	2
A	goto	1412/1,-984.24,-2134.75
A	collect	206155,1
A	mob	Rustling Bush
A	mob	Venture Co. Poacher
A	train	410113,1
S	Hunter
T	season	2
A	train	410113
A	use	206155
A	itemcount	206155,1
S	
T	label	Ambercorns
T	loop	
A	goto	1412/1,-539.33,-2550.2,0
A	goto	1412/1,-454.56,-2479.99,15,0
A	goto	1412/1,-539.33,-2550.2,15,0
A	goto	1412/1,-619.47,-2459.78,15,0
A	goto	1412/1,-578.89,-2706.72,15,0
A	goto	1412/1,-539.33,-2550.2,15,0
A	complete	771,2
S	
T	completewith	next
A	complete	761,1
A	mob	Wiry Swoop
A	mob	Swoop
S	Tauren
T	loop	
A	goto	1412/1,-562.96,-2556.02,0
A	goto	1412/1,-562.96,-2556.02,50,0
A	goto	1412/1,-575.29,-2452.24,50,0
A	goto	1412/1,-664.17,-2398.47,50,0
A	goto	1412/1,-725.31,-2385.46,50,0
A	goto	1412/1,-812.13,-2422.79,50,0
A	goto	1412/1,-852.72,-2496.77,50,0
A	goto	1412/1,-830.11,-2594.38,50,0
A	goto	1412/1,-778.74,-2658.43,50,0
A	goto	1412/1,-640.54,-2672.81,50,0
A	goto	1412/1,-541.38,-2678.64,50,0
A	goto	1412/1,-448.91,-2650.89,50,0
A	goto	1412/1,-314.31,-2660.14,50,0
A	goto	1412/1,-447.88,-2580.34,50,0
A	complete	748,1
A	mob	+Prairie Wolf
A	complete	748,2
A	mob	+Adult Plainstrider
S	Tauren
A	goto	1412/1,-445.31,-2341.620
A	turnin	748
A	timer	8,Poison Water RP
A	accept	754
A	target	Mull Thunderhorn
S	Tauren
T	completewith	next
A	complete	771,1
S	Tauren
T	label	Well
A	goto	1412/1,-709.89,-2543.01
A	complete	754,1
S	
T	label	Stones
T	loop	
A	goto	1412/1,-729.42,-2547.12,0
A	goto	1412/1,-692.94,-2525.88,10,0
A	goto	1412/1,-710.92,-2519.37,10,0
A	goto	1412/1,-725.31,-2531.36,10,0
A	goto	1412/1,-729.42,-2547.12,10,0
A	complete	771,1
S	
T	xprate	<2.1
T	completewith	Gnolls
A	complete	766,1
A	complete	766,2
A	complete	766,3
A	complete	766,4
S	Warrior
T	xprate	<2.1
T	season	2
T	loop	
A	goto	1412/1,-700.65,-2773.17,0
A	goto	1412/1,-433.50,-2738.92,0
A	goto	1412/1,-700.65,-2773.17,90,0
A	goto	1412/1,-433.50,-2738.92,90,0
A	complete	745,1
A	mob	+Palemane Tanner
A	complete	745,2
A	mob	+Palemane Skinner
A	complete	745,3
A	mob	+Palemane Poacher
A	collect	204478,1
A	unitscan	Snagglespear
A	train	403475,1
S	
T	xprate	<2.1
T	label	Gnolls
T	loop	
A	goto	1412/1,-700.65,-2773.17,0
A	goto	1412/1,-433.50,-2738.92,0
A	goto	1412/1,-700.65,-2773.17,90,0
A	goto	1412/1,-433.50,-2738.92,90,0
A	complete	745,1
A	mob	+Palemane Tanner
A	complete	745,2
A	mob	+Palemane Skinner
A	complete	745,3
A	mob	+Palemane Poacher
A	unitscan	Snagglespear
S	
A	goto	1412/1,-399.07,-2378.95
A	vendor	
A	collect	1179,10,746,1 << Shaman/Druid
A	collect	4541,10,746,1 << Warrior
A	target	Jhawna Oatwind
A	money	<0.025
S	Tauren
T	xprate	<2.1
A	turnin	754
A	accept	756
A	target	+Mull Thunderhorn
A	goto	1412/1,-445.31,-2341.620
A	turnin	745
A	target	+Baine Bloodhoof
A	goto	1412/1,-392.91,-2333.40
S	!Tauren
T	xprate	<2.1
A	goto	1412/1,-392.91,-2333.40
A	turnin	745
A	target	Baine Bloodhoof
S	Tauren
T	xprate	>2.09
A	goto	1412/1,-445.31,-2341.620
A	turnin	754
A	target	Mull Thunderhorn
S	Warrior
A	goto	1412/1,-356.43,-2357.03
A	train	3273
A	money	<0.01
A	target	Vira Younghoof
S	Shaman/Druid
A	goto	1412/1,-297.87,-2279.970
A	vendor	
A	target	Mahnott Roughwound
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Shaman/Druid
A	goto	1412/1,-297.87,-2279.970
A	collect	2495,1,749,1
A	money	<0.0504
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Warrior
A	goto	1412/1,-297.87,-2279.970
A	vendor	
A	target	Mahnott Roughwound
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.9
S	Warrior
A	goto	1412/1,-297.87,-2279.970
A	collect	2493,1,749,1
A	money	<0.0701
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.9
S	Hunter
A	goto	1412/1,-289.65,-2275.51
A	vendor	
A	target	Kennah Hawkseye
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.0
S	Hunter
A	goto	1412/1,-289.65,-2275.51
A	collect	2509,1,749,1
A	money	<0.0414
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.0
S	Shaman/Druid
T	optional	
T	completewith	Clawsx
A	use	2495
A	itemcount	2495,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Warrior
T	optional	
T	completewith	Clawsx
A	use	2493
A	itemcount	2493,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.9
S	Hunter
T	optional	
T	completewith	Clawsx
A	use	2509
A	itemcount	2509,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.0
S	
T	label	Vision
A	goto	1412/1,-405.75,-2243.32
A	turnin	771
A	accept	772
A	target	Zarlman Two-Moons
S	Hunter
T	xprate	<2.1
A	goto	1412/1,-408.32,-2180.30
A	train	5116
A	target	Yaw Sharpmane
A	xp	<8,1
S	Druid
T	xprate	<2.1
A	goto	1412/1,-442.74,-2315.59
A	train	5186
A	target	Gennia Runetotem
A	xp	<8,1
S	Warrior
T	xprate	<2.1
A	goto	1412/1,-496.17,-2347.78
A	train	284
A	target	Krang Stonehoof
A	xp	<8,1
S	Shaman
T	xprate	<2.1
A	goto	1412/1,-437.61,-2298.80
A	train	8044
A	target	Narm Skychaser
A	xp	<8,1
S	
T	xprate	<2.1
T	loop	
A	goto	1412/1,-784.9,-2350.18,0
A	goto	1412/1,-597.9,-2301.54,50,0
A	goto	1412/1,-674.96,-2336.14,50,0
A	goto	1412/1,-784.9,-2350.18,50,0
A	goto	1412/1,-904.6,-2371.07,50,0
A	goto	1412/1,-1016.6,-2410.12,50,0
A	goto	1412/1,-784.9,-2350.18,50,0
A	line	Mulgore,51.50,59.23,53.00,60.24,55.14,60.65,57.47,61.26,59.65,62.40
A	accept	749
A	unitscan	Morin Cloudstalker
S	
T	xprate	<2.1
T	completewith	Clawsx
A	complete	766,1
A	complete	766,2
A	complete	766,3
A	complete	766,4
S	
T	xprate	<2.1
T	completewith	Clawsx
A	complete	761,1
A	mob	Wiry Swoop
A	mob	Swoop
S	Tauren
T	xprate	<2.1
T	completewith	next
A	complete	756,1
A	mob	+Prairie Stalker
A	complete	756,2
A	mob	+Flatland Cougar
S	
T	xprate	<2.1
A	goto	1412/1,-712.98,-1922.74
A	turnin	749
A	accept	751
S	Tauren
T	xprate	<2.1
T	label	Clawsx
T	loop	
A	goto	1412/1,-936.97,-1937.47,0
A	goto	1412/1,-936.97,-1937.47,60,0
A	goto	1412/1,-752.02,-1646.34,60,0
A	goto	1412/1,-335.88,-2009.39,60,0
A	complete	756,1
A	mob	+Prairie Stalker
A	complete	756,2
A	mob	+Flatland Cougar
S	
T	xprate	<2.1
T	softcore	
T	completewith	Thunderhorn
A	deathskip	
S	
T	xprate	<2.1
T	hardcore	
T	completewith	Thunderhorn
A	goto	1412/1,-341.02,-2173.79,150
A	subzoneskip	222
S	Hunter
T	xprate	<2.1
A	goto	1412/1,-408.32,-2180.30
A	train	5116
A	target	Yaw Sharpmane
A	xp	<8,1
S	
T	xprate	<2.1
T	label	Mazzturnin
A	goto	1412/1,-365.17,-2227.56
A	turnin	766
A	target	Maur Raincaller
A	isQuestComplete	766
S	Shaman/Druid
T	xprate	<2.1
A	goto	1412/1,-297.87,-2279.970
A	vendor	
A	target	Mahnott Roughwound
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Shaman/Druid
T	xprate	<2.1
A	goto	1412/1,-297.87,-2279.970
A	collect	2495,1,743,1
A	money	<0.0504
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Warrior
T	xprate	<2.1
A	goto	1412/1,-297.87,-2279.970
A	vendor	
A	target	Mahnott Roughwound
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.9
S	Warrior
T	xprate	<2.1
A	goto	1412/1,-297.87,-2279.970
A	collect	2493,1,743,1
A	money	<0.0701
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.9
S	Hunter
T	xprate	<2.1
A	goto	1412/1,-289.65,-2275.51
A	vendor	
A	target	Kennah Hawkseye
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.0
S	Hunter
T	xprate	<2.1
A	goto	1412/1,-289.65,-2275.51
A	collect	2509,1,743,1
A	money	<0.0414
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.0
S	Hunter
T	xprate	<2.1
A	goto	1412/1,-308.14,-2248.11
A	collect	2516,1000,743,1 << Hunter
A	target	Moorat Longstride
A	itemcount	2512,<800 << Hunter
S	Shaman/Druid
T	xprate	<2.1
T	optional	
T	completewith	ThunderhornCleanse
A	use	2495
A	itemcount	2495,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Warrior
T	xprate	<2.1
T	optional	
T	completewith	ThunderhornCleanse
A	use	2493
A	itemcount	2493,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.9
S	Hunter
T	xprate	<2.1
T	optional	
T	completewith	ThunderhornCleanse
A	use	2509
A	itemcount	2509,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.0
S	
T	xprate	<2.1
T	completewith	Thunderhorn
A	goto	1412/1,-310.2,-2284.42
A	vendor	
A	target	Harant Ironbrace
S	
T	xprate	<2.1
A	goto	1412/1,-454.56,-2304.63
A	turnin	761
A	target	Harken Windtotem
A	isQuestComplete	761
S	Tauren
T	xprate	<2.1
A	goto	1412/1,-445.31,-2341.620
A	turnin	756
A	timer	8,Thunderhorn Totem RP
A	accept	758
A	target	Mull Thunderhorn
S	
T	optional	
T	label	Thunderhorn
S	Shaman
A	goto	1412/1,-437.61,-2298.80
A	train	8044
A	target	Narm Skychaser
A	xp	<8,1
A	xp	>10,1
S	Shaman
T	optional	
A	goto	1412/1,-437.61,-2298.80
A	accept	2984
A	trainer	
A	target	Narm Skychaser
A	xp	<10,1
S	Druid
A	goto	1412/1,-442.74,-2315.59
A	train	5186
A	target	Gennia Runetotem
A	xp	<8,1
A	xp	>10,1
S	Druid
T	optional	
A	goto	1412/1,-442.74,-2315.59
A	trainer	
A	accept	5928
A	target	Gennia Runetotem
A	isQuestAvailable	5928
A	xp	<10,1
S	Warrior
A	goto	1412/1,-496.17,-2347.78
A	train	284
A	target	Krang Stonehoof
A	xp	<8,1
A	xp	>10,1
S	Warrior
T	optional	
A	goto	1412/1,-496.17,-2347.78
A	trainer	
A	accept	1505
A	target	Krang Stonehoof
A	xp	<10,1
S	Hunter
A	goto	1412/1,-408.32,-2180.30
A	train	5116
A	target	Yaw Sharpmane
A	xp	<8,1
A	xp	>10,1
S	Hunter
T	optional	
A	goto	1412/1,-408.32,-2180.30
A	accept	6061
A	trainer	
A	target	Yaw Sharpmane
A	xp	<10,1
S	Hunter
T	optional	
T	loop	
A	goto	1412/1,24.77,-2239.89,0
A	goto	1412/1,-154.53,-2152.56,50,0
A	goto	1412/1,-44.59,-2177.22,50,0
A	goto	1412/1,24.77,-2239.89,50,0
A	use	15914
A	complete	6061,1
A	mob	Adult Plainstrider
A	isOnQuest	6061
S	Hunter
T	optional	
A	goto	1412/1,-408.32,-2180.30
A	turnin	6061
A	accept	6087
A	target	Yaw Sharpmane
A	isQuestComplete	6061
S	Hunter
T	optional	
A	goto	1412/1,-408.32,-2180.30
A	accept	6087
A	target	Yaw Sharpmane
A	isQuestTurnedIn	6061
S	Hunter
T	optional	
T	loop	
A	goto	1412/1,-494.63,-1720.66,0
A	goto	1412/1,-375.96,-1990.55,50,0
A	goto	1412/1,-348.73,-1890.2,50,0
A	goto	1412/1,-427.33,-1823.41,50,0
A	goto	1412/1,-494.63,-1720.66,50,0
A	use	15915
A	complete	6087,1
A	mob	Prairie Stalker
A	isQuestTurnedIn	6061
S	Hunter
T	optional	
A	goto	1412/1,-408.32,-2180.30
A	turnin	6087
A	accept	6088
A	target	Yaw Sharpmane
A	isQuestTurnedIn	6061
S	Hunter
T	optional	
T	loop	
A	goto	1412/1,-379.55,-1688.47,0
A	goto	1412/1,-379.55,-1688.47,80,0
A	goto	1412/1,-285.02,-1652.85,80,0
A	goto	1412/1,-601.49,-1793.62,80,0
A	use	15916
A	complete	6088,1
A	mob	Swoop
A	isQuestTurnedIn	6061
S	Hunter
T	optional	
A	goto	1412/1,-408.32,-2180.30
A	turnin	6088
A	accept	6089
A	target	Yaw Sharpmane
A	isQuestTurnedIn	6061
S	
A	goto	1412/1,-347.7,-2364.91
A	vendor	
A	collect	1179,10,746,1 << Shaman/Druid
A	collect	4541,10,746,1 << Warrior
A	target	Innkeeper Kauth
A	money	<0.025
S	
T	completewith	Burial
A	complete	766,1
A	complete	766,2
A	complete	766,3
A	complete	766,4
S	
T	completewith	Burial
A	complete	761,1
A	mob	Wiry Swoop
A	mob	Swoop
S	Tauren
T	xprate	<2.1
T	label	ThunderhornCleanse
A	goto	1412/1,-237.76,-1826.50
A	complete	758,1
S	Shaman
T	season	2
T	completewith	next
A	collect	206975,1
A	mob	Bael'dun Digger
A	mob	Bael'dun Appraiser
A	train	425344,1
S	
A	goto	1412/1,441.42,-1980.96
A	use	4702
A	complete	746,1
A	mob	Bael'dun Digger
A	mob	Bael'dun Appraiser
S	Shaman
T	season	2
T	loop	
A	goto	1412/1,284.21,-1901.16,0
A	goto	1412/1,284.21,-1901.16,40,0
A	goto	1412/1,320.69,-1972.06,40,0
A	goto	1412/1,374.12,-1949.80,40,0
A	goto	1412/1,410.08,-1991.24,40,0
A	goto	1412/1,448.10,-1988.16,40,0
A	goto	1412/1,456.32,-1925.14,40,0
A	goto	1412/1,424.98,-1923.42,40,0
A	goto	1412/1,347.4,-1906.3,40,0
A	collect	206975,1
A	mob	Bael'dun Digger
A	mob	Bael'dun Appraiser
A	train	425344,1
S	Shaman
T	season	2
A	goto	1412/1,426.52,-1969.66
A	collect	206388,1
A	train	425344,1
S	Shaman
T	season	2
A	equip	18,206388
A	use	206388
A	itemcount	206388,1
A	train	425344,1
S	Shaman
T	season	2
T	label	MoltenBlast
T	completewith	Burial
A	aura	408828
A	mob	Bael'dun Digger
A	mob	Bael'dun Appraiser
A	train	425344,1
S	Warrior
T	xprate	<2.1
T	season	2
T	loop	
A	goto	1412/1,417.27,-1653.53,0
A	goto	1412/1,297.06,-1769.98,50,0
A	goto	1412/1,353.57,-1744.30,50,0
A	goto	1412/1,418.30,-1748.41,50,0
A	goto	1412/1,451.18,-1714.50,50,0
A	goto	1412/1,449.13,-1672.71,50,0
A	goto	1412/1,417.27,-1653.53,50,0
A	goto	1412/1,381.31,-1682.99,50,0
A	goto	1412/1,323.26,-1687.440,50,0
A	goto	1412/1,310.41,-1651.82,50,0
A	goto	1412/1,276.51,-1684.36,50,0
A	goto	1412/1,275.48,-1721.35,50,0
A	complete	743,1
A	collect	206995,1
A	mob	Windfury Wind Witch
A	mob	Windfury Harpy
A	train	403475,1
S	
T	loop	
A	goto	1412/1,417.27,-1653.53,0
A	goto	1412/1,297.06,-1769.98,50,0
A	goto	1412/1,353.57,-1744.30,50,0
A	goto	1412/1,418.30,-1748.41,50,0
A	goto	1412/1,451.18,-1714.50,50,0
A	goto	1412/1,449.13,-1672.71,50,0
A	goto	1412/1,417.27,-1653.53,50,0
A	goto	1412/1,381.31,-1682.99,50,0
A	goto	1412/1,323.26,-1687.440,50,0
A	goto	1412/1,310.41,-1651.82,50,0
A	goto	1412/1,276.51,-1684.36,50,0
A	goto	1412/1,275.48,-1721.35,50,0
A	complete	743,1
A	mob	Windfury Wind Witch
A	mob	Windfury Harpy
S	
T	completewith	next
A	goto	1412/1,333.53,-1523.73,50
S	
T	xprate	<2.1
T	label	Burial
A	goto	1412/1,366.93,-1509.00
A	turnin	772
A	accept	773
A	target	Seer Wiserunner
S	
T	xprate	>2.09
T	label	Burial
A	goto	1412/1,366.93,-1509.00
A	turnin	772
A	target	Seer Wiserunner
S	Shaman
T	season	2
T	requires	MoltenBlast
A	cast	402265
A	use	206388
A	aura	-408828
A	itemStat	18,QUALITY,2
A	train	425344,1
A	xp	<3,1
S	
T	completewith	SacredBurial
A	destroy	4823
S	Druid/Hunter/Shaman
T	completewith	next
A	goto	1456/1,182.67,-1314.05
A	zone	Thunder Bluff
A	isOnQuest	6089 << Hunter
A	xp	<10,1 << Druid
S	Shaman
T	season	2
A	goto	1456/1,104.91,-1308.28
A	accept	76156
A	target	Boarton Shadetotem
A	train	410104,1
S	Druid
A	goto	1456/1,38.32,-1300.48
A	home	
A	target	Innkeeper Pala
A	bindlocation	1638
A	isQuestAvailable	5932
A	xp	<10,1
S	Druid
A	goto	1456/1,-298.5,-1049.01
A	accept	886
A	target	Arch Druid Hamuul Runetotem
A	xp	<10,1
S	Druid
A	goto	1456/1,-283.89,-1039.96
A	turnin	5928
A	accept	5922
A	target	Turak Runetotem
A	isOnQuest	5928
S	Druid
A	goto	1456/1,-283.89,-1039.96
A	accept	5922
A	target	Turak Runetotem
A	xp	<10,1
S	Druid
T	completewith	GreatBearS
A	cast	18960
A	zoneskip	Moonglade
S	Druid
A	goto	1450/1,-2678.76,8019.94
A	turnin	5922
A	accept	5930
A	target	Dendrite Starblaze
A	isOnQuest	5922
S	Druid
T	label	GreatBearS
A	goto	1450/1,-2678.76,8019.94
A	accept	5930
A	target	Dendrite Starblaze
A	isQuestTurnedIn	5922
S	Druid
A	goto	1450/1,-2286.12,8068.28
A	complete	5930,1
A	target	Great Bear Spirit
A	skipgossip	
A	isQuestTurnedIn	5922
S	Druid
T	completewith	next
A	cast	18960
S	Druid
A	goto	1450/1,-2678.76,8019.94
A	turnin	5930
A	accept	5932
A	target	Dendrite Starblaze
A	isQuestTurnedIn	5922
S	Druid
T	completewith	DruidBearForm
A	hs	
A	cooldown	item,6948,>0
A	use	6948
A	bindlocation	1638,1
A	zoneskip	Thunder Bluff
A	isQuestTurnedIn	5922
S	Druid
T	completewith	next
A	goto	1450/1,-2403.61,7785.46
A	fly	Thunder Bluff
A	target	Bunthen Plainswind
A	cooldown	item,6948,<0
S	Druid
T	label	DruidBearForm
A	goto	1456/1,-283.89,-1039.96
A	turnin	5932
A	accept	6002
A	target	Turak Runetotem
A	isQuestTurnedIn	5922
S	Hunter
A	goto	1456/1,-82.45,-1472.07
A	turnin	6089
A	target	Holt Thunderhorn
A	isOnQuest	6089
S	Hunter
A	goto	1456/1,-47.79,-1434.508
A	train	24547
A	target	Hesuwa Thunderhorn
A	isQuestTurnedIn	6089
S	Hunter
T	completewith	SacredBurial
A	isQuestTurnedIn	6089
S	Druid/Hunter/Shaman
T	xprate	<2.1
A	goto	1456/1,-44.98,-1043.58,30,0
A	goto	1412/1,-1026.88,-1150.40
A	zone	Mulgore
A	zoneskip	Thunder Bluff,1
A	isQuestTurnedIn	6089 << Hunter
A	isQuestTurnedIn	5932 << Druid
S	Hunter
T	xprate	<2.1
T	completewith	SacredBurial
A	cast	1515
A	mob	Prairie Wolf Alpha
S	
T	xprate	<2.1
T	completewith	SacredBurial
A	complete	766,1
A	complete	766,2
A	complete	766,3
A	complete	766,4
S	
T	xprate	<2.1
T	completewith	SacredBurial
A	collect	4854,1,770
A	accept	770
A	use	4854
A	unitscan	Ghost Howl
S	
T	xprate	<2.1
T	completewith	next
A	complete	761,1
A	mob	Wiry Swoop
A	mob	Swoop
A	mob	Taloned Swoop
S	
T	xprate	<2.1
A	goto	1412/1,-1026.88,-1150.40
A	accept	833
A	target	Lorekeeper Raintotem
S	
T	optional	
T	label	SacredBurial
S	Warrior
T	xprate	<2.1
T	season	2
T	completewith	RiteofWisdom
A	collect	206994,1
A	mob	Bristleback Interloper
A	train	403475,1
S	
T	xprate	<2.1
T	completewith	next
A	complete	833,1
A	mob	Bristleback Interloper
S	
T	xprate	<2.1
T	label	RiteofWisdom
A	goto	1412/1,-1109.08,-992.51
A	turnin	773
A	accept	775
A	target	Ancestral Spirit
S	Warrior
T	xprate	<2.1
T	season	2
T	loop	
A	goto	1412/1,-1026.88,-1150.40,0
A	goto	1412/1,-1026.88,-1150.40,25,0
A	goto	1412/1,-1093.15,-1058.27,25,0
A	goto	1412/1,-1125.52,-1043.20,25,0
A	goto	1412/1,-1146.58,-1028.13,25,0
A	goto	1412/1,-1153.77,-988.40,25,0
A	goto	1412/1,-1117.81,-940.790,25,0
A	goto	1412/1,-1057.19,-940.790,25,0
A	goto	1412/1,-1042.80,-994.22,25,0
A	goto	1412/1,-1055.65,-1025.05,25,0
A	goto	1412/1,-1092.12,-1056.56,25,0
A	complete	833,1
A	collect	206994,1
A	mob	Bristleback Interloper
A	train	403475,1
S	
T	xprate	<2.1
T	loop	
A	goto	1412/1,-1026.88,-1150.40,0
A	goto	1412/1,-1026.88,-1150.40,25,0
A	goto	1412/1,-1093.15,-1058.27,25,0
A	goto	1412/1,-1125.52,-1043.20,25,0
A	goto	1412/1,-1146.58,-1028.13,25,0
A	goto	1412/1,-1153.77,-988.40,25,0
A	goto	1412/1,-1117.81,-940.790,25,0
A	goto	1412/1,-1057.19,-940.790,25,0
A	goto	1412/1,-1042.80,-994.22,25,0
A	goto	1412/1,-1055.65,-1025.05,25,0
A	goto	1412/1,-1092.12,-1056.56,25,0
A	complete	833,1
A	mob	Bristleback Interloper
S	
T	xprate	<2.1
A	goto	1412/1,-1026.88,-1150.40
A	turnin	833
A	target	Lorekeeper Raintotem
S	
T	xprate	<2.1
T	completewith	next
A	complete	766,1
A	complete	766,2
A	complete	766,3
A	complete	766,4
S	
T	xprate	<2.1
T	loop	
A	goto	1412/1,-572.21,-903.12,0
A	goto	1412/1,-1009.92,-1073.0,60,0
A	goto	1412/1,-906.66,-926.41,60,0
A	goto	1412/1,-788.5,-912.36,60,0
A	goto	1412/1,-674.44,-866.81,60,0
A	goto	1412/1,-572.21,-903.12,60,0
A	goto	1412/1,-512.61,-983.26,60,0
A	goto	1412/1,-511.59,-1084.3,60,0
A	goto	1412/1,-496.17,-1166.84,60,0
A	goto	1412/1,-506.45,-1236.71,60,0
A	goto	1412/1,-561.42,-1278.84,60,0
A	goto	1412/1,-635.91,-1302.81,60,0
A	goto	1412/1,-737.12,-1315.14,60,0
A	goto	1412/1,-836.79,-1312.4,60,0
A	goto	1412/1,-920.02,-1316.86,60,0
A	goto	1412/1,-972.42,-1249.73,60,0
A	goto	1412/1,-1063.35,-1159.31,60,0
A	goto	1412/1,-1009.92,-1073.0,60,0
A	complete	761,1
A	mob	Wiry Swoop
A	mob	Swoop
A	mob	Taloned Swoop
S	
T	xprate	<2.1
T	loop	
A	goto	1412/1,-780.79,-1385.36,0
A	goto	1412/1,-780.79,-1385.36,60,0
A	goto	1412/1,-718.11,-1670.32,60,0
A	goto	1412/1,-684.72,-1819.65,60,0
A	goto	1412/1,-903.58,-1946.37,60,0
A	goto	1412/1,-985.26,-2080.97,60,0
A	goto	1412/1,-989.37,-2262.5,60,0
A	goto	1412/1,-452.5,-1808.69,60,0
A	complete	766,1
A	mob	+Prairie Wolf Alpha
A	mob	+Prairie Stalker
A	mob	+Prairie Wolf Alpha
A	complete	766,2
A	mob	+Flatland Cougar
A	complete	766,3
A	mob	+Elder Plainstrider
A	mob	+Adult Plainstrider
A	complete	766,4
A	mob	+Taloned Swoop
A	mob	+Swoop
A	mob	+Wiry Swoop
S	skip --Cannon removed from game
T	season	2
T	softcore	
T	completewith	Bloodhoofturnins1
A	goto	1456/1,86.95,-1320.80
A	zoneskip	Thunder Bluff,1
S	
T	completewith	Bloodhoofturnins1
A	zone	Mulgore
A	zoneskip	Thunder Bluff,1
S	
T	softcore	
T	completewith	Bloodhoofturnins1
A	goto	1412/1,-429.39,-1603.53
A	deathskip	
A	zoneskip	Thunder Bluff
S	
T	hardcore	
T	completewith	Bloodhoofturnins1
A	goto	1412/1,-383.66,-2230.99,120
A	subzoneskip	222
S	
A	goto	1412/1,-365.17,-2227.56
A	turnin	766
A	target	Maur Raincaller
A	isQuestComplete	766
S	
A	goto	1412/1,-353.86,-2336.14
A	turnin	770
A	target	Skorn Whitecloud
A	isOnQuest	770
S	Warrior
T	xprate	<2.1
T	season	2
A	goto	1412/1,-330.23,-2388.20
A	collect	204688,1
A	collect	204689,1
A	collect	204690,1
A	target	Vateya Timberhoof
A	train	403475,1
S	Warrior
T	xprate	<2.1
T	season	2
A	use	204688
A	collect	204703,1
A	train	403475,1
S	Warrior
T	xprate	<2.1
T	season	2
A	train	403475
A	use	204703
A	itemcount	204703,1
S	Tauren
T	xprate	<2.1
A	turnin	746
A	target	+Baine Bloodhoof
A	goto	1412/1,-392.91,-2333.40
A	turnin	743
A	target	+Ruul Eagletalon
A	goto	1412/1,-384.69,-2397.10
A	turnin	758
A	target	+Mull Thunderhorn
A	goto	1412/1,-445.83,-2340.93
A	turnin	761
A	target	+Harken Windtotem
A	goto	1412/1,-454.56,-2304.63
A	isQuestComplete	761
S	!Tauren
T	xprate	<2.1
A	turnin	746
A	target	+Baine Bloodhoof
A	goto	1412/1,-392.91,-2333.40
A	turnin	743
A	target	+Ruul Eagletalon
A	goto	1412/1,-384.69,-2397.10
A	turnin	761
A	target	+Harken Windtotem
A	goto	1412/1,-454.56,-2304.63
A	isQuestComplete	761
S	Tauren
T	xprate	<2.1
T	label	Bloodhoofturnins1
A	turnin	746
A	target	+Baine Bloodhoof
A	goto	1412/1,-392.91,-2333.40
A	turnin	743
A	target	+Ruul Eagletalon
A	goto	1412/1,-384.69,-2397.10
A	turnin	758
A	target	+Mull Thunderhorn
A	goto	1412/1,-445.83,-2340.93
S	!Tauren
T	xprate	<2.1
T	label	Bloodhoofturnins1
A	turnin	746
A	target	+Baine Bloodhoof
A	goto	1412/1,-392.91,-2333.40
A	turnin	743
A	target	+Ruul Eagletalon
A	goto	1412/1,-384.69,-2397.10
S	
T	xprate	>2.09
A	turnin	746
A	target	+Baine Bloodhoof
A	goto	1412/1,-392.91,-2333.40
A	turnin	743
A	target	+Ruul Eagletalon
A	goto	1412/1,-384.69,-2397.10
A	turnin	761
A	target	+Harken Windtotem
A	goto	1412/1,-454.56,-2304.63
A	isQuestComplete	761
S	
T	xprate	>2.09
T	label	Bloodhoofturnins1
A	turnin	746
A	target	+Baine Bloodhoof
A	goto	1412/1,-392.91,-2333.40
A	turnin	743
A	target	+Ruul Eagletalon
A	goto	1412/1,-384.69,-2397.10
S	
T	completewith	AlphaTeeth
A	destroy	4702
S	Hunter
A	goto	1412/1,-289.65,-2275.51
A	collect	2519,1000,6061,1 << Hunter
A	target	Kennah Hawkseye
S	Warrior
A	goto	1412/1,-496.17,-2347.78
A	train	2687
A	accept	1505
A	target	Krang Stonehoof
S	Warrior
T	optional	
A	goto	1412/1,-496.17,-2347.78
A	train	7384
A	target	Krang Stonehoof
A	xp	<12,1
S	Shaman
A	goto	1412/1,-437.61,-2298.80
A	train	8050
A	accept	2984
A	target	Narm Skychaser
S	Shaman
T	optional	
A	goto	1412/1,-437.61,-2298.80
A	train	547
A	target	Narm Skychaser
A	xp	<12,1
S	Hunter
A	goto	1412/1,-408.32,-2180.30
A	accept	6061
A	train	13165
A	target	Yaw Sharpmane
A	isQuestAvailable	6061
S	Hunter
T	optional	
A	goto	1412/1,-408.32,-2180.30
A	train	14281
A	target	Yaw Sharpmane
A	xp	<12,1
S	Druid
A	goto	1412/1,-442.74,-2315.59
A	train	8924
A	accept	5928
A	target	Gennia Runetotem
A	isQuestAvailable	5928
S	Druid
T	optional	
A	goto	1412/1,-442.74,-2315.59
A	train	8936
A	target	Gennia Runetotem
A	xp	<12,1
S	Hunter
T	loop	
A	goto	1412/1,24.77,-2239.89,0
A	goto	1412/1,-154.53,-2152.56,50,0
A	goto	1412/1,-44.59,-2177.22,50,0
A	goto	1412/1,24.77,-2239.89,50,0
A	use	15914
A	complete	6061,1
A	mob	Adult Plainstrider
S	Hunter
A	goto	1412/1,-408.32,-2180.30
A	turnin	6061
A	accept	6087
A	target	Yaw Sharpmane
S	Hunter
T	loop	
A	goto	1412/1,-494.63,-1720.66,0
A	goto	1412/1,-375.96,-1990.55,50,0
A	goto	1412/1,-348.73,-1890.2,50,0
A	goto	1412/1,-427.33,-1823.41,50,0
A	goto	1412/1,-494.63,-1720.66,50,0
A	use	15915
A	complete	6087,1
A	mob	Prairie Stalker
S	Hunter
A	goto	1412/1,-408.32,-2180.30
A	turnin	6087
A	accept	6088
A	target	Yaw Sharpmane
S	Hunter
T	loop	
A	goto	1412/1,-379.55,-1688.47,0
A	goto	1412/1,-379.55,-1688.47,80,0
A	goto	1412/1,-285.02,-1652.85,80,0
A	goto	1412/1,-601.49,-1793.62,80,0
A	use	15916
A	complete	6088,1
A	mob	Swoop
S	Hunter
A	goto	1412/1,-408.32,-2180.30
A	turnin	6088
A	accept	6089
A	target	Yaw Sharpmane
S	
A	goto	1412/1,-399.07,-2378.95
A	collect	1179,20,818,1 << Shaman/Druid
A	collect	4541,20,818,1 << Warrior
A	target	Innkeeper Grosk
A	money	<0.05
A	target	Jhawna Oatwind
S	skip
A	goto	1412/1,-353.86,-2336.14
A	accept	861
A	target	Skorn Whitecloud
S	
T	xprate	>2.09
T	loop	
A	goto	1412/1,-784.9,-2350.18,0
A	goto	1412/1,-597.9,-2301.54,50,0
A	goto	1412/1,-674.96,-2336.14,50,0
A	goto	1412/1,-784.9,-2350.18,50,0
A	goto	1412/1,-904.6,-2371.07,50,0
A	goto	1412/1,-1016.6,-2410.12,50,0
A	goto	1412/1,-784.9,-2350.18,50,0
A	line	Mulgore,51.50,59.23,53.00,60.24,55.14,60.65,57.47,61.26,59.65,62.40
A	accept	749
A	unitscan	Morin Cloudstalker
S	Hunter
T	xprate	>2.09
T	loop	
A	goto	1412/1,-1403.97,-2457.38,0
A	goto	1412/1,-1403.97,-2457.38,50,0
A	goto	1412/1,-1360.3,-2568.01,50,0
A	goto	1412/1,-1232.89,-2544.03,50,0
A	goto	1412/1,-1127.57,-2516.98,50,0
A	goto	1412/1,-1117.3,-2373.13,50,0
A	goto	1412/1,-1218.51,-2345.38,50,0
A	goto	1412/1,-1320.23,-2306.34,50,0
A	goto	1412/1,-1426.06,-2295.72,50,0
A	goto	1412/1,-1360.3,-2568.01,50,0
A	train	16828
A	link	https://www.wow-petopia.com/classic/training.php
A	mob	Prairie Wolf Alpha
S	
T	xprate	>2.09
A	goto	1412/1,-712.98,-1922.74
A	turnin	749
A	accept	751
S	
T	loop	
A	goto	1412/1,-784.9,-2350.18,0
A	goto	1412/1,-597.9,-2301.54,50,0
A	goto	1412/1,-674.96,-2336.14,50,0
A	goto	1412/1,-784.9,-2350.18,50,0
A	goto	1412/1,-904.6,-2371.07,50,0
A	goto	1412/1,-1016.6,-2410.12,50,0
A	goto	1412/1,-784.9,-2350.18,50,0
A	line	Mulgore,51.50,59.23,53.00,60.24,55.14,60.65,57.47,61.26,59.65,62.40
A	turnin	751
A	accept	764
A	accept	765
A	unitscan	Morin Cloudstalker
S	
T	season	2
T	completewith	Fizsprocket1
A	goto	1412/1,-1112.16,-1892.6,20
S	Shaman
T	season	2
T	completewith	VentureCoKills
A	complete	76156,1
A	train	410104,1
S	
T	completewith	next
A	complete	764,1
A	mob	+Venture Co. Worker
A	complete	764,2
A	mob	+Venture Co. Supervisor
S	
T	label	Fizsprocket1
A	goto	1412/1,-1288.89,-1756.97
A	complete	765,1
A	mob	Supervisor Fizsprocket
S	
T	label	VentureCoKills
T	loop	
A	goto	1412/1,-1103.94,-1901.5,0
A	goto	1412/1,-1103.94,-1901.5,25,0
A	goto	1412/1,-1039.72,-1911.44,25,0
A	goto	1412/1,-1008.9,-1924.11,25,0
A	goto	1412/1,-1018.14,-1946.03,25,0
A	goto	1412/1,-1041.78,-1955.96,25,0
A	goto	1412/1,-1137.85,-1942.26,25,0
A	goto	1412/1,-1131.68,-1911.44,25,0
A	complete	764,1
A	mob	+Venture Co. Worker
A	complete	764,2
A	mob	+Venture Co. Supervisor
S	Shaman
T	season	2
T	loop	
A	goto	1412/1,-1228.27,-1778.89,15,0
A	goto	1412/1,-1178.95,-1739.16,15,0
A	goto	1412/1,-1054.11,-1738.13,15,0
A	goto	1412/1,-1118.84,-1688.47,15,0
A	goto	1412/1,-1214.91,-1618.60,15,0
A	goto	1412/1,-1208.74,-1670.320,15,0
A	goto	1412/1,-1085.44,-1540.17,15,0
A	goto	1412/1,-1016.09,-1507.63,15,0
A	goto	1412/1,-1122.95,-1476.80,15,0
A	complete	76156,1
A	train	410104,1
S	
T	loop	
A	goto	1412/1,-784.9,-2350.18,0
A	goto	1412/1,-597.9,-2301.54,50,0
A	goto	1412/1,-674.96,-2336.14,50,0
A	goto	1412/1,-784.9,-2350.18,50,0
A	goto	1412/1,-904.6,-2371.07,50,0
A	goto	1412/1,-1016.6,-2410.12,50,0
A	goto	1412/1,-784.9,-2350.18,50,0
A	line	Mulgore,51.50,59.23,53.00,60.24,55.14,60.65,57.47,61.26,59.65,62.40
A	turnin	764
A	turnin	765
A	unitscan	Morin Cloudstalker
S	Druid
T	season	2
T	loop	
A	goto	1412/1,-1360.3,-2568.01,0
A	goto	1412/1,-1403.97,-2457.38,50,0
A	goto	1412/1,-1360.3,-2568.01,50,0
A	goto	1412/1,-1232.89,-2544.03,50,0
A	goto	1412/1,-1127.57,-2516.98,50,0
A	goto	1412/1,-1117.3,-2373.13,50,0
A	goto	1412/1,-1218.51,-2345.38,50,0
A	goto	1412/1,-1320.23,-2306.34,50,0
A	goto	1412/1,-1426.06,-2295.72,50,0
A	collect	206954,1
A	mob	Flatland Prowler
A	mob	Prairie Wolf Alpha
A	train	410025,1
S	Druid
T	season	2
A	equip	18,206954
A	use	206954
A	train	410025,1
A	itemcount	206954,1
S	Druid
T	season	2
T	completewith	next
S	Druid
T	season	2
A	train	410025
A	use	206954
A	itemcount	206954,1
S	skip
T	label	AlphaTeeth
A	goto	1412/1,-1403.97,-2457.38,50,0
A	goto	1412/1,-1360.3,-2568.01,50,0
A	goto	1412/1,-1232.89,-2544.03,50,0
A	goto	1412/1,-1127.57,-2516.98,50,0
A	goto	1412/1,-1117.3,-2373.13,50,0
A	goto	1412/1,-1218.51,-2345.38,50,0
A	goto	1412/1,-1320.23,-2306.34,50,0
A	goto	1412/1,-1426.06,-2295.72,50,0
A	goto	1412/1,-1360.3,-2568.01
A	complete	759,1
A	mob	Prairie Wolf Alpha
S	skip
T	softcore	
T	completewith	Thunderhorn2
A	deathskip	
S	skip
T	hardcore	
T	completewith	Thunderhorn2
A	goto	1412/1,-341.02,-2173.79,150
S	skip
T	label	Thunderhorn2
A	goto	1412/1,-445.31,-2341.620
A	turnin	759
A	accept	760
A	target	Mull Thunderhorn
S	
A	goto	1412/1,-1527.78,-2341.62,100,0
A	zone	The Barrens
A	isQuestAvailable	5922
S	Druid
A	goto	1413/1,-1881.35,-2383.82
A	fp	Camp Taurajo
A	fly	Thunder Bluff
A	target	Omusa Thunderhorn
A	isQuestAvailable	5922
S	Druid
A	goto	1456/1,38.32,-1300.48
A	home	
A	target	Innkeeper Pala
A	bindlocation	1638
A	isQuestAvailable	5922
S	Druid
A	goto	1456/1,-298.5,-1049.01
A	accept	886
A	target	Arch Druid Hamuul Runetotem
A	isQuestAvailable	5922
S	Druid
A	goto	1456/1,-283.89,-1039.96
A	turnin	5928
A	accept	5922
A	target	Arch Druid Hamuul Runetotem
A	target	Turak Runetotem
A	isOnQuest	5928
S	Druid
A	goto	1456/1,-283.89,-1039.96
A	accept	5922
A	target	Arch Druid Hamuul Runetotem
A	target	Turak Runetotem
S	Druid
T	completewith	next
A	cast	18960
A	zoneskip	Moonglade
S	Druid
A	goto	1450/1,-2678.76,8019.94
A	turnin	5922
A	accept	5930
A	target	Dendrite Starblaze
S	Druid
A	goto	1450/1,-2286.12,8068.28
A	complete	5930,1
A	target	Great Bear Spirit
A	skipgossip	
S	Druid
T	completewith	next
A	cast	18960
S	Druid
A	goto	1450/1,-2678.76,8019.94
A	turnin	5930
A	accept	5932
A	target	Dendrite Starblaze
S	Druid
T	completewith	DruidBearForm
A	hs	
A	cooldown	item,6948,>0
A	use	6948
A	bindlocation	1638,1
A	zoneskip	Thunder Bluff
S	Druid
T	completewith	next
A	goto	1450/1,-2403.61,7785.46
A	fly	Thunder Bluff
A	target	Bunthen Plainswind
A	zoneskip	Thunder Bluff
A	cooldown	item,6948,<0
S	Druid
T	label	DruidBearForm
A	goto	1456/1,-283.89,-1039.96
A	turnin	5932
A	accept	6002
A	target	Turak Runetotem
S	Druid
T	completewith	next
A	goto	1456/1,26.1,-1196.66
A	fly	Camp Taurajo
A	target	Tal
A	zoneskip	Thunder Bluff,1
S	Druid
A	goto	1413/1,-1633.08,-2499.35
A	use	15710
A	complete	6002,1
A	use	15710
A	mob	Lunaclaw
S	!Druid
A	goto	1413/1,-1881.35,-2383.82
A	fp	Camp Taurajo
A	target	Omusa Thunderhorn
A	isQuestAvailable	5922
S	Tauren
A	goto	1413/1,-1926.95,-2346.66
A	accept	854
A	target	Kirge Sternhorn
S	
T	completewith	next
A	subzone	380
S	
A	goto	1413/1,-2672.76,-544.77
A	turnin	886
A	accept	870
A	target	Tonga Runetotem
S	
A	goto	1413/1,-2645.40,-406.94
A	home	
A	target	Innkeeper Boorand Plainswind
A	bindlocation	380,1
A	subzoneskip	380
S	Tauren
A	goto	1413/1,-2595.75,-468.43
A	turnin	854
A	target	Thork
S	
A	goto	1413/1,-2566.36,-350.19
A	accept	6361
A	target	Jahan Hawkwing
S	
T	xprate	<2.1
A	goto	1413/1,-2589.67,-424.51
A	accept	848
A	accept	1492
A	target	Apothecary Helbrim
S	
T	xprate	<2.1
T	completewith	next
A	complete	848,1
S	
T	xprate	<2.1
A	goto	1413/1,-1943.16,89.64
A	complete	870,1
S	
T	xprate	<2.1
T	loop	
A	goto	1413/1,-1957.35,38.29,0
A	goto	1413/1,-1957.35,38.29,40,0
A	goto	1413/1,-1957.35,126.12,40,0
A	goto	1413/1,-1896.55,92.34,40,0
A	goto	1413/1,-1825.62,-36.03,40,0
A	complete	848,1
S	
T	xprate	<2.1
T	softcore	
T	completewith	ZamahPickup
A	deathskip	
S	
T	xprate	<2.1
T	hardcore	
T	completewith	ZamahPickup
A	subzone	380
S	
T	xprate	<2.1
A	goto	1413/1,-2672.76,-544.77
A	turnin	870
A	accept	877
A	target	Tonga Runetotem
A	isQuestComplete	870
S	
T	xprate	<2.1
T	optional	
A	goto	1413/1,-2672.76,-544.77
A	turnin	870
A	accept	877
A	target	Tonga Runetotem
A	isQuestTurnedIn	877
S	
T	xprate	<2.1
A	goto	1413/1,-2589.67,-424.51
A	turnin	848
A	timer	7,Fungal Spores RP
A	accept	853
A	target	Apothecary Helbrim
A	isQuestComplete	848
S	
T	xprate	<2.1
T	optional	
T	label	ZamahPickup
A	goto	1413/1,-2589.67,-424.51
A	accept	853
A	target	Apothecary Helbrim
A	isQuestTurnedIn	848
S	
T	xprate	<2.1
T	sticky	
T	completewith	CauldronStirrer
A	isOnQuest	853
S	
A	goto	1413/1,-2595.75,-437.35
A	turnin	6361
A	accept	6362
A	target	Devrak
S	
T	completewith	CauldronStirrer
A	goto	1413/1,-2595.75,-437.35
A	fly	Thunder Bluff
A	target	Devrak
A	zoneskip	Thunder Bluff
S	
A	goto	1456/1,40.72,-1238.97
A	turnin	6362
A	accept	6363
A	target	Ahanu
S	
A	goto	1456/1,-123.15,-1412.93
A	turnin	861
A	accept	860
A	target	Melor Stonehoof
A	isQuestComplete	861
S	
A	goto	1456/1,-123.15,-1412.93
A	accept	860
A	target	Melor Stonehoof
A	isQuestTurnedIn	861
S	Hunter
A	goto	1456/1,-82.45,-1472.07
A	turnin	6089
A	target	Holt Thunderhorn
S	Hunter
T	optional	
A	goto	1456/1,-82.45,-1472.07
A	train	14281
A	target	Holt Thunderhorn
A	xp	<12,1
S	Hunter
A	goto	1456/1,-47.79,-1434.508
A	train	24547
A	target	Hesuwa Thunderhorn
S	Warrior
T	optional	
A	goto	1456/1,-84.43,-1444.940
A	train	7384
A	target	Ker Ragetotem
A	xp	<12,1
S	Druid
A	goto	1456/1,89.46,-1286.50
A	train	199
A	target	Ansekhwa
A	money	<0.1154
S	Warrior/Hunter
A	goto	1456/1,89.46,-1286.50
A	train	227
A	target	Ansekhwa
S	Shaman
T	season	2
A	goto	1456/1,122.13,-1263.32
A	accept	744
A	target	Eyahn Eagletalon
S	Shaman
T	season	2
A	goto	1456/1,104.91,-1308.28
A	turnin	76156
A	accept	76160
A	target	Boarton Shadetotem
A	train	410104,1
S	
T	xprate	<2.1
T	completewith	next
A	goto	1456/1,222.96,-1079.42,40,0
A	goto	1456/1,219.09,-1051.44,10
S	
T	xprate	<2.1
T	label	CauldronStirrer
A	goto	1456/1,278.48,-995.29
A	turnin	853
A	target	Apothecary Zamah
A	isOnQuest	853
S	
T	xprate	<2.1
T	optional	
T	completewith	ReturntoJahan
A	use	5340
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<10.1
A	itemcount	5340,1
S	Shaman
T	optional	
A	goto	1456/1,269.92,-980.40
A	train	547
A	target	Tigor Skychaser
A	xp	<12,1
S	Warrior
T	season	2
T	completewith	next
A	goto	1456/1,216.80,-975.25,-1
A	goto	1456/1,243.31,-979.77,-1
A	target	Netali Proudwind
A	target	Mooart
A	skipgossip	
S	Warrior
T	season	2
A	goto	1456/1,216.80,-975.25
A	collect	204716,1
A	target	Netali
A	train	425447,1
A	skipgossip	
S	Warrior
T	season	2
A	train	425447
A	use	204716
A	itemcount	204716,1
S	
T	label	ReturntoJahan
A	goto	1456/1,26.1,-1196.66
A	turnin	6363
A	accept	6364
A	target	Tal
S	
T	xprate	<2.1
A	goto	1456/1,-109.58,-1209.75
A	turnin	775
A	target	Cairne Bloodhoof
S	Druid
A	goto	1456/1,-281.56,-1039.41
A	turnin	6002
A	target	Turak Runetotem
S	Druid
T	optional	
A	goto	1456/1,-281.56,-1039.41
A	train	8936
A	target	Turak Runetotem
A	xp	<12,1
S	
A	goto	1456/1,-218.13,-1055.97
A	accept	5722
A	accept	5723
A	target	Rahauro
A	dungeon	RFC
S	
T	ah	
A	goto	1456/1,52.93,-1150.53
A	train	8613
A	target	Mooranta
S	
T	optional	
T	ah	
A	goto	1456/1,53.35,-1161.18
A	accept	768
A	target	Veren Tallstrider
A	skill	skinning,<1,1
S	
T	optional	
T	ah	
A	goto	1456/1,95.1,-1210.23
A	collect	2318,12,768,1
A	target	Auctioneer Stampi
A	skill	skinning,<1,1
S	
T	optional	
T	ah	
A	goto	1456/1,53.35,-1161.18
A	turnin	768
A	target	Veren Tallstrider
A	skill	skinning,<1,1
S	Hunter
A	goto	1456/1,-29.42,-1182.54
A	collect	117,5,744,1
A	target	Kaga Mistrunner
S	Shaman
T	season	2
T	completewith	next
A	complete	744,1
A	mob	+Windfury Sorceress
A	complete	744,2
A	mob	+Windfury Matriarch
A	train	410104,1
S	Shaman
T	season	2
T	loop	
A	goto	1412/1,137.79,-696.25,0
A	goto	1412/1,54.57,-821.94,10,0
A	goto	1412/1,106.46,-644.87,10,0
A	goto	1412/1,95.15,-622.61,10,0
A	goto	1412/1,67.41,-550.340,10,0
A	goto	1412/1,92.58,-528.76,10,0
A	goto	1412/1,128.55,-615.07,10,0
A	goto	1412/1,131.12,-629.46,10,0
A	goto	1412/1,208.69,-656.86,10,0
A	goto	1412/1,188.14,-663.71,10,0
A	goto	1412/1,187.63,-704.470,10,0
A	goto	1412/1,170.16,-712.69,10,0
A	goto	1412/1,165.02,-727.07,10,0
A	goto	1412/1,137.79,-696.25,10,0
A	collect	206170,8,76160,1
A	train	410104,1
S	Shaman
T	season	2
T	loop	
A	goto	1412/1,419.33,-1238.77,0
A	goto	1412/1,496.39,-940.79,0
A	goto	1412/1,419.33,-1238.77,40,0
A	goto	1412/1,496.39,-940.79,40,0
A	complete	744,1
A	mob	+Windfury Sorceress
A	complete	744,2
A	mob	+Windfury Matriarch
S	Shaman
T	season	2
T	completewith	next
A	zone	Thunder Bluff
S	Shaman
T	season	2
A	goto	1456/1,122.13,-1263.32
A	turnin	744
A	target	Eyahn Eagletalon
S	Shaman
T	season	2
A	goto	1456/1,104.91,-1308.28
A	turnin	76160
A	accept	76240
A	target	Boarton Shadetotem
A	train	410104,1
S	Shaman
T	season	2
T	ah	
A	goto	1456/1,44.58,-1263.320,0
A	goto	1456/1,94.89,-1210.30
A	collect	6291,1,76240,1
A	target	Auctioneer Stampi
A	train	410104,1
S	Shaman
T	season	2
T	ssf	
T	completewith	Sewa
A	goto	1456/1,35.18,-1208.98,12,0
A	goto	1456/1,25.16,-1198.40,4,0
A	goto	1456/1,31.43,-1192.07,4,0
A	goto	1456/1,36.02,-1196.11,4,0
A	goto	1456/1,32.99,-1201.400,4,0
A	goto	1456/1,-65.54,-1177.18,15
A	train	410104,1
S	Shaman
T	season	2
T	ssf	
T	sticky	
T	label	Kah
A	goto	1456/1,-69.19,-1172.80,-1
A	train	7734
A	target	Kah Mistrunner
A	train	410104,1
S	Shaman
T	season	2
T	ssf	
T	label	Sewa
A	goto	1456/1,-65.54,-1177.18,-1
A	collect	6256,1
A	collect	6529,1
A	target	Sewa Mistrunner
A	train	410104,1
S	Shaman
T	season	2
T	ssf	
T	completewith	Fish
T	requires	Kah
T	label	Pole
A	equip	16,6256
A	use	6256
A	train	410104,1
S	Shaman
T	season	2
T	ssf	
T	completewith	Fish
T	requires	Pole
A	aura	8087
A	use	6529
A	train	410104,1
S	Shaman
T	season	2
T	ssf	
T	label	Fish
T	requires	Kah
A	goto	1456/1,94.78,-1257.41
A	collect	6291,1,76240,1
A	train	410104,1
S	Shaman
T	season	2
A	complete	76240,1
A	use	206344
A	train	410104,1
S	Shaman
T	season	2
A	goto	1456/1,104.91,-1308.28
A	turnin	76240
A	target	Boarton Shadetotem
A	train	410104,1
S	
T	completewith	HidesTurnIn
A	hs	
A	cooldown	item,6948,>0
A	use	6948
A	bindlocation	380,1
A	subzoneskip	380
S	
T	completewith	next
A	goto	1456/1,26.1,-1196.66
A	fly	Crossroads
A	target	Tal
A	zoneskip	The Barrens
A	cooldown	item,6948,<0
S	
T	label	HidesTurnIn
A	goto	1413/1,-2566.36,-350.19
A	turnin	6364
A	target	Jahan Hawkwing
S	
A	goto	1413/1,-2589.67,-424.51
A	accept	1492
A	target	Apothecary Helbrim
S	
A	goto	1413/1,-2595.75,-473.15
A	accept	871
A	accept	5041
A	target	Thork
S	
T	xprate	<2.1
A	goto	1413/1,-2607.91,-475.180
A	accept	867
A	target	Darsok Swiftdagger
S	
T	optional	
A	goto	1413/1,-2669.72,-481.94
A	turnin	860
A	accept	844
A	target	Sergra Darkthorn
A	isOnQuest	860
S	
A	goto	1413/1,-2669.72,-481.94
A	accept	844
A	target	Sergra Darkthorn
S	
A	goto	1413/1,-2639.32,-436.00
A	accept	869
A	target	Gazrog
S	Tauren Hunter
A	goto	1413/1,-2556.23,-351.54
A	collect	2511,1,871,1
A	money	<0.1324
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.9
A	target	Uthrok
S	Tauren Hunter
T	optional	
T	completewith	DisruptTheAttacks
A	use	2511
A	itemcount	2511,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.9
S	Shaman
T	completewith	next
A	collect	4926,1,819
A	accept	819
A	use	4926
S	Shaman
A	goto	1413/1,-3037.56,264.63
A	turnin	2984
A	accept	1524
A	target	Kranal Fiss
S	Shaman
T	completewith	next
A	goto	1411/1,-3905.13,-228.41,10,0
A	goto	1411/1,-3899.31,-241.45,8,0
A	goto	1411/1,-3899.31,-241.45,8,0
A	goto	1411/1,-3906.71,-270.71,8,0
A	goto	1411/1,-3910.94,-247.45,8,0
A	goto	1411/1,-3931.56,-240.75,8,0
A	goto	1411/1,-3964.35,-242.51,8,0
A	goto	1411/1,-3974.39,-228.76,8,0
A	goto	1411/1,-4020.92,-219.95,8,0
A	goto	1411/1,-4034.67,-232.64,8,0
A	goto	1411/1,-4033.08,-255.91,10
S	Shaman
T	label	CallofFire2
A	goto	1411/1,-3999.24,-268.95
A	turnin	1524
A	accept	1525
A	target	Telf Joolam
S	Shaman
A	goto	1411/1,-4648.55,271.43
A	accept	840
A	target	Takrin Pathseeker
S	Shaman
T	completewith	next
A	goto	1411/1,-4834.14,418.07,30,0
A	goto	1411/1,-4754.3,796.66,20
S	Shaman
T	loop	
A	goto	1411/1,-4774.39,780.80,0
A	goto	1411/1,-4774.39,780.80,20,0
A	goto	1411/1,-4749.01,822.39,12,0
A	goto	1411/1,-4767.52,825.92,12,0
A	goto	1411/1,-4772.28,848.12,12,0
A	goto	1411/1,-4756.41,863.630,12,0
A	goto	1411/1,-4715.70,861.87,12,0
A	goto	1411/1,-4706.71,902.41,12,0
A	complete	1525,2
A	mob	Burning Blade Cultist
S	Shaman
A	goto	1413/1,-3687.11,303.14
A	turnin	840
A	accept	842
A	target	Kargal Battlescar
S	Warrior
A	goto	1413/1,-3598.95,186.93
A	turnin	1505
A	accept	1498
A	target	Uzzek
S	Warrior
T	loop	
A	goto	1411/1,-4042.6,812.52,0
A	goto	1411/1,-4030.44,724.04,40,0
A	goto	1411/1,-4042.6,812.52,40,0
A	goto	1411/1,-4030.44,875.62,40,0
A	goto	1411/1,-4045.25,925.32,40,0
A	goto	1411/1,-4077.5,960.22,40,0
A	goto	1411/1,-4210.22,952.11,40,0
A	goto	1411/1,-4042.6,812.52,40,0
A	complete	1498,1
A	mob	Lightning Hide
S	Warrior
A	goto	1413/1,-3598.95,186.93
A	turnin	1498
A	accept	1502
A	target	Uzzek
S	
T	optional	
A	abandon	761
S	
T	optional	
A	abandon	766
E
G	Guides/forever/Horde-12-22_Barrens.lua
M	classic	
M	tbc	
M	xprate	<1.99
M	selector	Horde
M	name	12-17 The Barrens
M	displayname	14-18 The Barrens << Undead/Troll Rogue/Orc Rogue/Orc Warlock/Troll Mage/Troll Priest
M	version	11
M	group	RestedXP Forever Guide (H)
M	subgroup	Speedrun Guide 1-22
M	next	17-22 Stonetalon/Barrens/Ashenvale
S	Tauren Shaman
A	goto	1411/1,-4648.55,271.43
A	accept	840
A	target	Takrin Pathseeker
S	Tauren Shaman
T	completewith	next
A	goto	1411/1,-4834.14,418.07,30,0
A	goto	1411/1,-4754.3,796.66,20
S	Tauren Shaman
T	loop	
A	goto	1411/1,-4706.71,902.41,0
A	goto	1411/1,-4774.39,780.80,20,0
A	goto	1411/1,-4749.01,822.39,12,0
A	goto	1411/1,-4767.52,825.92,12,0
A	goto	1411/1,-4772.28,848.12,12,0
A	goto	1411/1,-4756.41,863.630,12,0
A	goto	1411/1,-4715.70,861.87,12,0
A	goto	1411/1,-4706.71,902.41,12,0
A	complete	1525,2
A	mob	Burning Blade Cultist
S	Tauren Shaman
A	goto	1413/1,-3687.11,303.14
A	turnin	840
A	accept	842
A	target	Kargal Battlescar
S	Warrior !Undead
T	xprate	<1.5
T	completewith	next
A	goto	1413/1,-2902.79,-276.55,30,0
A	goto	1413/1,-3004.12,-298.17,30,0
A	goto	1413/1,-3110.52,-320.46,30
S	Warrior !Undead
T	xprate	<1.5
A	goto	1413/1,-3176.39,-437.35
A	turnin	1502
A	accept	1503
A	target	Thun'grim Firegaze
S	Warrior !Undead
T	xprate	<1.5
A	goto	1413/1,-2955.48,-188.04
A	complete	1503,1
S	Warrior !Undead
T	xprate	<1.5
T	completewith	next
A	goto	1413/1,-2902.79,-276.55,30,0
A	goto	1413/1,-3004.12,-298.17,30,0
A	goto	1413/1,-3110.52,-320.46,30
S	Warrior !Undead
T	xprate	<1.5
A	goto	1413/1,-3176.39,-437.35
A	turnin	1503
A	target	Thun'grim Firegaze
S	!Shaman !Warrior/Undead
T	softcore	
T	completewith	ThievesPickup
A	goto	1413/1,-2516.71,-590.71
A	deathskip	
S	!Shaman !Warrior/Undead
T	hardcore	
T	completewith	ThievesPickup
A	subzone	380
S	!Shaman !Warrior/Undead
T	softcore	
A	goto	1413/1,-2672.76,-544.77
A	accept	870
A	target	Tonga Runetotem
S	Orc !Warrior !Shaman/Troll !Warrior !Shaman
T	hardcore	
A	goto	1413/1,-2709.24,-403.57
A	accept	6365
A	target	Zargh
S	!Shaman !Warrior/Undead
A	goto	1413/1,-2670.74,-482.61
A	turnin	842
A	accept	844
A	target	Sergra Darkthorn
A	isOnQuest	842
S	!Shaman !Warrior/Undead
A	goto	1413/1,-2670.74,-482.61
A	accept	844
A	target	Sergra Darkthorn
S	!Shaman !Warrior/Undead
T	hardcore	
A	goto	1413/1,-2672.76,-544.77
A	accept	870
A	target	Tonga Runetotem
S	!Shaman !Warrior/Undead
A	goto	1413/1,-2595.75,-473.15
A	accept	871
A	accept	5041
A	target	Thork
S	Orc !Warrior !Shaman/Troll !Warrior !Shaman
T	hardcore	
A	goto	1413/1,-2595.75,-437.35
A	fp	The Crossroads
A	turnin	6365
A	accept	6384
A	target	Devrak
S	Undead
A	goto	1413/1,-2595.75,-437.35
A	fp	The Crossroads
A	target	Devrak
A	isQuestAvailable	1492
S	
A	goto	1413/1,-2589.67,-424.51
A	accept	1492
A	accept	848
A	turnin	1358
A	target	Apothecary Helbrim
A	isQuestAvailable	848
S	
A	goto	1413/1,-2589.67,-424.51
A	accept	1492
A	turnin	1358
A	target	Apothecary Helbrim
S	Orc Hunter/Troll Hunter
A	goto	1413/1,-2556.23,-351.54
A	collect	2507,1,871,1
A	money	<0.1751
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<5.7
A	target	Uthrok
S	Orc Hunter/Troll Hunter
T	optional	
T	completewith	DisruptTheAttacks
A	use	2507
A	itemcount	2507,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<5.7
S	Tauren Hunter
A	goto	1413/1,-2556.23,-351.54
A	collect	2511,1,871,1
A	money	<0.1324
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.9
A	target	Uthrok
S	Tauren Hunter
T	optional	
T	completewith	DisruptTheAttacks
A	use	2511
A	itemcount	2511,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.9
S	!Shaman !Warrior/Undead
T	label	ThievesPickup
A	goto	1413/1,-2639.32,-436.00
A	accept	869
A	target	Gazrog
S	!Tauren !Shaman !Warrior/Undead
A	goto	1413/1,-2645.40,-406.94
A	home	
A	target	Innkeeper Boorand Plainswind
A	bindlocation	380
A	isQuestAvailable	1492
S	Orc !Warrior !Shaman/Troll !Warrior !Shaman
T	softcore	
A	goto	1413/1,-2709.24,-403.57
A	accept	6365
A	target	Zargh
S	
T	optional	
T	completewith	DisruptTheAttacks
A	complete	844,1
A	mob	Greater Plainstrider
A	mob	Fleeting Plainstrider
S	!Tauren !Undead
T	xprate	<1.5 << !Hunter
T	completewith	next
T	label	DemonMountain
A	goto	1413/1,-2554.2,80.18,40,0
A	goto	1413/1,-2477.19,136.26,40,0
A	goto	1413/1,-2363.7,232.87,40,0
A	goto	1413/1,-2205.62,314.62,100
A	isOnQuest	924
S	!Tauren !Undead
T	xprate	<1.5 << !Hunter
T	completewith	next
T	requires	DemonMountain
A	goto	1413/1,-2205.62,314.62,15
A	isOnQuest	924
S	!Tauren !Undead
T	xprate	<1.5 << !Hunter
T	label	DemonSeed
A	goto	1413/1,-2238.04,324.08
A	collect	4986,1,924
A	complete	924,1
A	isOnQuest	924
S	skip
T	xprate	<1.5 << !Hunter
T	completewith	DisruptTheAttacks
A	goto	1413/1,-2198.52,303.14,40,0
A	goto	1413/1,-2363.7,232.87,40,0
A	goto	1413/1,-2477.19,136.26,40,0
A	goto	1413/1,-2554.2,80.18,100
A	isQuestComplete	924
S	Shaman
T	sticky	
T	label	FireTar2
A	goto	1413/1,-2947.38,-92.1,50,0
A	goto	1413/1,-2869.35,-49.54,50,0
A	goto	1413/1,-2805.51,-111.02
A	complete	1525,1
A	mob	Razormane Water Seeker
A	mob	Razormane Thornweaver
S	
T	optional	
T	completewith	next
A	complete	871,1
A	mob	+Razormane Water Seeker
A	complete	871,2
A	mob	+Razormane Thornweaver
A	complete	871,3
A	mob	+Razormane Hunter
S	
A	goto	1413/1,-3021.35,-231.960
A	use	4926
A	collect	4926,1,819
A	accept	819
S	
T	requires	FireTar2 << Shaman
T	label	DisruptTheAttacks
T	loop	
A	goto	1413/1,-2811.59,-42.780,0
A	goto	1413/1,-2811.59,-42.780,50,0
A	goto	1413/1,-2875.43,-52.24,50,0
A	goto	1413/1,-2931.16,-89.40,50,0
A	goto	1413/1,-3001.08,-117.78,50,0
A	goto	1413/1,-3037.56,-164.390,50,0
A	goto	1413/1,-3034.52,-221.82,50,0
A	goto	1413/1,-2991.96,-239.39,50,0
A	goto	1413/1,-2899.75,-209.66,50,0
A	goto	1413/1,-2854.15,-151.56,50,0
A	goto	1413/1,-2799.43,-92.78,50,0
A	complete	871,1
A	mob	+Razormane Water Seeker
A	complete	871,2
A	mob	+Razormane Thornweaver
A	complete	871,3
A	mob	+Razormane Hunter
S	Warrior !Undead
T	xprate	>1.49
T	completewith	next
A	goto	1413/1,-2902.79,-276.55,30,0
A	goto	1413/1,-3004.12,-298.17,30,0
A	goto	1413/1,-3110.52,-320.46,30
S	Warrior !Undead
T	xprate	>1.49
A	goto	1413/1,-3176.39,-437.35
A	turnin	1502
A	accept	1503
A	target	Thun'grim Firegaze
S	Warrior !Undead
T	xprate	>1.49
A	goto	1413/1,-2955.48,-188.04
A	complete	1503,1
S	Warrior !Undead
T	xprate	>1.49
T	completewith	next
A	goto	1413/1,-2902.79,-276.55,30,0
A	goto	1413/1,-3004.12,-298.17,30,0
A	goto	1413/1,-3110.52,-320.46,30
S	Warrior !Undead
T	xprate	>1.49
A	goto	1413/1,-3176.39,-437.35
A	turnin	1503
A	target	Thun'grim Firegaze
S	!Undead !Tauren
T	sticky	
T	completewith	EnterRFC
A	subzone	2437
A	dungeon	RFC
S	
T	completewith	next
A	complete	869,1
A	mob	Sunscale Lashtail
A	mob	Sunscale Screecher
S	
T	loop	
A	goto	1413/1,-2819.70,-359.65,0
A	goto	1413/1,-2784.23,-163.04,80,0
A	goto	1413/1,-2771.06,-306.95,80,0
A	goto	1413/1,-2805.51,-386.00,80,0
A	goto	1413/1,-2738.63,-610.310,80,0
A	goto	1413/1,-2576.50,-610.98,80,0
A	goto	1413/1,-2494.42,-485.32,80,0
A	goto	1413/1,-2448.82,-398.84,80,0
A	goto	1413/1,-2537.99,-260.33,80,0
A	goto	1413/1,-2730.52,-273.17,80,0
A	goto	1413/1,-2819.70,-359.65,80,0
A	complete	844,1
A	mob	Greater Plainstrider
A	mob	Fleeting Plainstrider
S	Shaman Troll/Shaman Orc/Warrior Orc/Warrior Troll
A	goto	1413/1,-2709.24,-404.24
A	turnin	6386
A	target	Zargh
A	isOnQuest	6386
S	
A	turnin	842
A	turnin	844
A	accept	845
A	target	+Sergra Darkthorn
A	goto	1413/1,-2670.74,-482.61
A	turnin	871
A	accept	872
A	target	+Thork
A	goto	1413/1,-2595.75,-473.15
S	
A	goto	1413/1,-2607.91,-475.180
A	accept	867
A	target	Darsok Swiftdagger
S	Orc !Warrior !Shaman/Troll !Warrior !Shaman
T	softcore	
A	goto	1413/1,-2595.75,-437.35
A	turnin	6365
A	accept	6384
A	target	Devrak
S	Orc Hunter/Troll Hunter
T	optional	
A	goto	1413/1,-2556.23,-351.54
A	collect	2507,1,871,1
A	money	<0.1751
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<5.7
A	target	Uthrok
S	Tauren Hunter
T	optional	
A	goto	1413/1,-2556.23,-351.54
A	collect	2511,1,871,1
A	money	<0.1324
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.9
A	target	Uthrok
S	Orc Warrior/Troll Warrior/Orc Shaman/Troll Shaman
A	goto	1413/1,-2645.40,-406.94
A	home	
A	target	Innkeeper Boorand Plainswind
A	bindlocation	380
A	isQuestAvailable	1492
S	Orc Warrior/Troll Warrior/Tauren Warrior
T	sticky	
T	completewith	KreenigSnarlsnout
A	goto	1413/1,-2697.08,-461.67,0
A	vendor	
A	unitscan	Lizzarik
A	subzoneskip	380,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.5
S	!Undead !Tauren
T	completewith	HiddenEnemiesPickup
A	goto	1413/1,-2595.75,-437.35
A	fly	Orgrimmar
A	zoneskip	Orgrimmar
A	target	Devrak
A	dungeon	RFC
S	Tauren
A	goto	1413/1,-3021.35,-231.96,20,0
A	goto	1413/1,-3029.46,261.25
A	use	4926
A	collect	4926,1,819
A	accept	819
A	dungeon	RFC
S	Tauren
T	optional	
T	completewith	KreenigSnarlsnout1
A	goto	1413/1,-3127.75,-55.62,50,0
A	goto	1413/1,-3382.10,-54.27,50,0
A	complete	872,1
A	mob	+Razormane Geomancer
A	complete	872,2
A	mob	+Razormane Defender
A	dungeon	RFC
S	Tauren
T	optional	
T	completewith	next
A	complete	5041,1
A	dungeon	RFC
S	Tauren
T	label	KreenigSnarlsnout1
A	goto	1413/1,-3324.34,-217.09
A	complete	872,3
A	mob	Kreenig Snarlsnout
A	dungeon	RFC
S	Tauren
T	optional	
T	completewith	next
A	goto	1413/1,-3127.75,-55.62,50,0
A	goto	1413/1,-3382.10,-54.27,50,0
A	complete	872,1
A	mob	+Razormane Geomancer
A	complete	872,2
A	mob	+Razormane Defender
A	dungeon	RFC
S	Tauren
A	goto	1413/1,-3292.92,-212.36,30,0
A	goto	1413/1,-3402.36,-48.19
A	complete	5041,1
A	dungeon	RFC
S	Tauren
T	loop	
A	goto	1413/1,-3345.62,-101.56,0
A	goto	1413/1,-3393.24,-102.24,50,0
A	goto	1413/1,-3419.59,-40.08,50,0
A	goto	1413/1,-3419.59,-0.89,50,0
A	goto	1413/1,-3361.83,-1.57,50,0
A	goto	1413/1,-3317.24,-7.65,50,0
A	goto	1413/1,-3237.19,-27.92,50,0
A	goto	1413/1,-3139.91,-46.16,50,0
A	goto	1413/1,-3126.74,-101.56,50,0
A	goto	1413/1,-3178.42,-107.64,50,0
A	goto	1413/1,-3205.78,-119.13,50,0
A	goto	1413/1,-3218.95,-81.97,50,0
A	goto	1413/1,-3278.74,-75.21,50,0
A	goto	1413/1,-3345.62,-101.56,50,0
A	complete	872,1
A	mob	+Razormane Geomancer
A	complete	872,2
A	mob	+Razormane Defender
A	dungeon	RFC
S	Tauren
T	optional	
T	completewith	next
A	complete	845,1
A	mob	Zhevra Runner
A	dungeon	RFC
S	Tauren Shaman
T	completewith	next
A	goto	1411/1,-3905.13,-228.41,10,0
A	goto	1411/1,-3899.31,-241.45,8,0
A	goto	1411/1,-3899.31,-241.45,8,0
A	goto	1411/1,-3906.71,-270.71,8,0
A	goto	1411/1,-3910.94,-247.45,8,0
A	goto	1411/1,-3931.56,-240.75,8,0
A	goto	1411/1,-3964.35,-242.51,8,0
A	goto	1411/1,-3974.39,-228.76,8,0
A	goto	1411/1,-4020.92,-219.95,8,0
A	goto	1411/1,-4034.67,-232.64,8,0
A	goto	1411/1,-4033.08,-255.91,10
A	dungeon	RFC
S	Tauren Shaman
A	goto	1411/1,-3999.24,-268.95
A	turnin	1525
A	accept	1526
A	target	Telf Joolam
A	dungeon	RFC
S	Tauren Shaman
T	completewith	next
A	goto	1411/1,-3981.27,-256.61
A	cast	8898
A	use	6636
A	dungeon	RFC
S	Tauren Shaman
A	goto	1411/1,-4022.51,-243.92
A	complete	1526,1
A	mob	Minor Manifestation of Fire
A	dungeon	RFC
S	Tauren Shaman
A	goto	1411/1,-4022.51,-243.92
A	turnin	1526
A	accept	1527
A	dungeon	RFC
S	Tauren Shaman
A	goto	1413/1,-3037.56,264.63
A	turnin	1527
A	target	Kranal Fiss
A	dungeon	RFC
S	Tauren Shaman
A	goto	1413/1,-3029.46,261.25
A	use	4926
A	collect	4926,1,819
A	accept	819
A	dungeon	RFC
S	Tauren
T	sticky	
T	completewith	EnterRFC
A	subzone	2437
A	dungeon	RFC
S	Tauren
T	completewith	HiddenEnemiesPickup
A	goto	1454/1,-4367.46,1405.44,50,0
A	zone	Orgrimmar
A	dungeon	RFC
S	Tauren
A	goto	1454/1,-4313.60,1676.24
A	fp	Orgrimmar
A	target	Doras
A	isQuestAvailable	5728
A	dungeon	RFC
S	!Undead
A	goto	1454/1,-4125.79,1920.10
A	accept	5726
A	target	Thrall
A	dungeon	RFC
S	!Undead
A	goto	1411/1,-4769.10,1484.39,0
A	complete	5726,1
A	dungeon	RFC
S	!Undead
A	goto	1454/1,-4125.79,1920.10
A	turnin	5726
A	accept	5727
A	target	Thrall
A	dungeon	RFC
S	!Undead
A	goto	1454/1,-4376.29,1802.43
A	accept	5761
A	target	Neeru Fireblade
A	dungeon	RFC
S	!Undead
A	goto	1454/1,-4376.29,1802.43
A	complete	5727,1
A	skipgossip	
A	target	Neeru Fireblade
A	dungeon	RFC
S	!Undead
T	label	HiddenEnemiesPickup
A	goto	1454/1,-4125.79,1920.10
A	turnin	5727
A	accept	5728
A	target	Thrall
A	dungeon	RFC
S	!Undead
T	completewith	EnterRFC
A	destroy	14544
S	!Undead
T	label	EnterRFC
A	goto	1454/1,-4420.76,1815.80
A	subzone	2437
A	dungeon	RFC
S	!Undead
A	accept	5722
A	accept	5723
A	dungeon	RFC
S	!Undead
T	optional	
T	completewith	next
A	complete	5723,1
A	mob	+Ragefire Trogg
A	complete	5723,2
A	mob	+Ragefire Shaman
A	isOnQuest	5723
A	dungeon	RFC
S	!Undead
A	turnin	5722
A	accept	5724
A	target	Maur Grimtotem
A	isOnQuest	5722
A	dungeon	RFC
S	!Undead
T	optional	
A	accept	5724
A	target	Maur Grimtotem
A	isQuestTurnedIn	5722
A	dungeon	RFC
S	!Undead
T	label	TroggsShamans
A	complete	5723,1
A	mob	+Ragefire Trogg
A	complete	5723,2
A	mob	+Ragefire Shaman
A	isOnQuest	5723
A	dungeon	RFC
S	!Undead
T	optional	
T	requires	TroggsShamans
T	completewith	BazzalanandJergosh
A	complete	5725,1
A	complete	5725,2
A	mob	Searing Blade Cultist
A	mob	Searing Blade Warlock
A	isOnQuest	5725
A	dungeon	RFC
S	!Undead
A	complete	5761,1
A	mob	Taragaman the Hungerer
A	isOnQuest	5761
A	dungeon	RFC
S	!Undead
T	label	BazzalanandJergosh
A	complete	5728,1
A	mob	+Bazzalan
A	complete	5728,2
A	mob	+Jergosh the Invoker
A	isOnQuest	5728
A	dungeon	RFC
S	!Undead
A	complete	5725,1
A	complete	5725,2
A	mob	Searing Blade Cultist
A	mob	Searing Blade Warlock
A	isOnQuest	5725
A	dungeon	RFC
S	!Undead
A	goto	1454/1,-4376.29,1802.43
A	turnin	5761
A	target	Neeru Fireblade
A	isQuestComplete	5761
A	dungeon	RFC
S	!Undead
A	goto	1454/1,-4125.79,1920.10
A	turnin	5728
A	accept	5729
A	target	Thrall
A	isQuestComplete	5728
A	dungeon	RFC
S	!Undead
A	goto	1454/1,-4125.79,1920.10
A	accept	5729
A	target	Thrall
A	isQuestTurnedIn	5728
A	dungeon	RFC
S	!Undead
A	goto	1454/1,-4376.29,1802.43
A	turnin	5729
A	accept	5730
A	target	Neeru Fireblade
A	dungeon	RFC
A	isQuestTurnedIn	5728
S	!Undead
A	goto	1454/1,-4125.79,1920.10
A	turnin	5730
A	target	Thrall
A	isQuestTurnedIn	5728
A	dungeon	RFC
S	Tauren
T	completewith	RFCTurninsTB1
A	goto	Orgrimmar,45.120,63.889
A	fly	Thunder Bluff
A	target	Doras
A	zoneskip	Orgrimmar,1
A	isOnQuest	5724
A	isQuestComplete	5723
A	dungeon	RFC
S	!Tauren
T	completewith	KreenigSnarlsnout
A	hs	
A	use	6948
A	zoneskip	The Barrens
A	bindlocation	380,1
A	subzoneskip	380
A	dungeon	RFC
S	Orc Warrior/Troll Warrior/Orc Shaman/Troll Shaman
T	completewith	RFCTurninsTB1
A	goto	1413/1,-2595.75,-437.35
A	fly	Thunder Bluff
A	target	Devrak
A	isOnQuest	5724
A	isQuestComplete	5723
A	dungeon	RFC
A	zoneskip	Thunder Bluff
S	skip
T	completewith	RFCTurninsTB1
A	goto	1412/1,-1480.52,-2339.56,120,0
A	zone	Thunder Bluff
A	isOnQuest	5724
A	isQuestComplete	5723
A	dungeon	RFC
S	skip
A	goto	1413/1,-1881.35,-2384.50
A	fp	Camp Taurajo
A	target	Omusa Thunderhorn
A	dungeon	RFC
A	isOnQuest	5724
A	isQuestComplete	5723
S	Tauren/Orc Warrior/Troll Warrior/Orc Shaman/Troll Shaman
T	completewith	RFCTurninsTB1
A	goto	1456/1,-212.71,-1065.010,80
A	isOnQuest	5724
A	isQuestComplete	5723
A	dungeon	RFC
S	Tauren/Orc Warrior/Troll Warrior/Orc Shaman/Troll Shaman
A	goto	1456/1,-218.13,-1055.97
A	turnin	5724
A	turnin	5723
A	target	Rahauro
A	isOnQuest	5724
A	isQuestComplete	5723
A	dungeon	RFC
S	Tauren/Orc Warrior/Troll Warrior/Orc Shaman/Troll Shaman
A	goto	1456/1,-218.13,-1055.97
A	turnin	5724
A	target	Rahauro
A	isOnQuest	5724
A	dungeon	RFC
S	Tauren/Orc Warrior/Troll Warrior/Orc Shaman/Troll Shaman
T	label	RFCTurninsTB1
A	goto	1456/1,-218.13,-1055.97
A	turnin	5723
A	target	Rahauro
A	isQuestComplete	5723
A	dungeon	RFC
S	skip
A	goto	1456/1,26.1,-1196.66
A	fly	Thunder Bluff
A	target	Tal
A	zoneskip	Thunder Bluff,1
A	dungeon	RFC
S	
T	completewith	KreenigSnarlsnout
A	hs	
A	use	6948
A	zoneskip	Thunder Bluff,1
A	cooldown	item,6948,>0
A	dungeon	RFC
S	
T	completewith	KreenigSnarlsnout
A	goto	1456/1,26.1,-1196.66
A	fly	Crossroads
A	target	Tal
A	zoneskip	Thunder Bluff,1
A	cooldown	item,6948,<0
A	dungeon	RFC
S	
A	goto	1413/1,-3021.35,-231.96,20,0
A	goto	1413/1,-3029.46,261.25
A	use	4926
A	collect	4926,1,819
A	accept	819
S	
T	optional	
T	completewith	KreenigSnarlsnout
A	goto	1413/1,-3127.75,-55.62,50,0
A	goto	1413/1,-3382.10,-54.27,50,0
A	complete	872,1
A	mob	+Razormane Geomancer
A	complete	872,2
A	mob	+Razormane Defender
S	
T	optional	
T	completewith	next
A	complete	5041,1
S	
T	label	KreenigSnarlsnout
A	goto	1413/1,-3324.34,-217.09
A	complete	872,3
A	mob	Kreenig Snarlsnout
S	Warlock
T	season	2
A	train	403932,1
A	goto	1413/1,-3274.68,-191.42
A	cast	1454
A	cast	735
A	collect	208750,1
S	Warlock
T	season	2
A	use	208750
A	itemcount	208750,1
A	train	403932
S	
T	optional	
T	completewith	next
A	goto	1413/1,-3127.75,-55.62,0
A	goto	1413/1,-3382.10,-54.27,0
A	complete	872,1
A	mob	+Razormane Geomancer
A	complete	872,2
A	mob	+Razormane Defender
S	
T	loop	
A	goto	1413/1,-3292.92,-212.36,30,0
A	goto	1413/1,-3402.36,-48.19,30,0
A	goto	1413/1,-3292.92,-212.36,0
A	goto	1413/1,-3402.36,-48.19,0
A	complete	5041,1
S	
T	loop	
A	goto	1413/1,-3345.62,-101.56,0
A	goto	1413/1,-3393.24,-102.24,50,0
A	goto	1413/1,-3419.59,-40.08,50,0
A	goto	1413/1,-3419.59,-0.89,50,0
A	goto	1413/1,-3361.83,-1.57,50,0
A	goto	1413/1,-3317.24,-7.65,50,0
A	goto	1413/1,-3237.19,-27.92,50,0
A	goto	1413/1,-3139.91,-46.16,50,0
A	goto	1413/1,-3126.74,-101.56,50,0
A	goto	1413/1,-3178.42,-107.64,50,0
A	goto	1413/1,-3205.78,-119.13,50,0
A	goto	1413/1,-3218.95,-81.97,50,0
A	goto	1413/1,-3278.74,-75.21,50,0
A	goto	1413/1,-3345.62,-101.56,50,0
A	complete	872,1
A	mob	+Razormane Geomancer
A	complete	872,2
A	mob	+Razormane Defender
S	!Tauren !Undead
T	optional	
T	completewith	next
A	complete	845,1
A	mob	Zhevra Runner
A	isQuestComplete	924
S	!Tauren !Undead
T	xprate	<1.5 << !Hunter
A	goto	1413/1,-3694.2,256.52
A	turnin	924
A	target	Ak'Zeloth
A	isQuestComplete	924
S	Shaman
T	optional	
T	completewith	ShamanDurotar
A	complete	869,1
A	mob	Sunscale Lashtail
A	mob	Sunscale Screecher
S	Shaman
T	optional	
T	completewith	ShamanDurotar
A	complete	845,1
A	mob	Zhevra Runner
S	Shaman
T	completewith	CallofFire3
T	label	ShamanDurotar
A	goto	1411/1,-3905.13,-228.41
A	zone	Durotar
A	isOnQuest	1525
S	Shaman
T	requires	ShamanDurotar
T	completewith	next
A	goto	1411/1,-3905.13,-228.41,10,0
A	goto	1411/1,-3899.31,-241.45,8,0
A	goto	1411/1,-3899.31,-241.45,8,0
A	goto	1411/1,-3906.71,-270.71,8,0
A	goto	1411/1,-3910.94,-247.45,8,0
A	goto	1411/1,-3931.56,-240.75,8,0
A	goto	1411/1,-3964.35,-242.51,8,0
A	goto	1411/1,-3974.39,-228.76,8,0
A	goto	1411/1,-4020.92,-219.95,8,0
A	goto	1411/1,-4034.67,-232.64,8,0
A	goto	1411/1,-4033.08,-255.91,10
S	Shaman
T	label	CallofFire3
T	requires	ShamanDurotar
A	goto	1411/1,-3999.24,-268.95
A	turnin	1525
A	accept	1526
A	target	Telf Joolam
S	Shaman
T	completewith	next
A	goto	1411/1,-3981.27,-256.61
A	cast	8898
A	use	6636
S	Shaman
A	goto	1411/1,-4022.51,-243.92
A	complete	1526,1
A	mob	Minor Manifestation of Fire
S	Shaman
A	goto	1411/1,-4022.51,-243.92
A	turnin	1526
A	accept	1527
S	Shaman
T	optional	
T	completewith	FireEnd
A	complete	869,1
A	mob	Sunscale Lashtail
A	mob	Sunscale Screecher
S	Shaman
T	optional	
T	completewith	next
A	complete	845,1
A	mob	Zhevra Runner
A	dungeon	RFC
S	Shaman
T	label	FireEnd
A	goto	1413/1,-3037.56,264.63
A	turnin	1527
A	target	Kranal Fiss
S	Shaman
A	goto	1413/1,-3029.46,261.25
A	use	4926
A	collect	4926,1,819
A	accept	819
S	skip
T	completewith	RatchetEnter
A	complete	869,1
A	mob	Sunscale Screecher
S	
T	optional	
T	completewith	next
A	goto	1413/1,-3851.27,-526.53,100,0
A	complete	845,1
A	mob	Zhevra Runner
S	
T	label	RatchetEnter
A	goto	1413/1,-3728.66,-835.29
A	subzone	392
A	isOnQuest	845
S	
A	goto	1413/1,-3728.66,-835.29
A	accept	887
A	target	Gazlowe
S	
T	completewith	next
A	goto	1413/1,-3770.20,-898.12
A	fp	Ratchet
A	target	Bragok
S	
A	accept	894
A	goto	1413/1,-3759.06,-902.18
A	accept	895
A	goto	1413/1,-3719.54,-919.07
A	target	Sputtervalve
S	Undead Warrior
A	goto	1413/1,-3684.07,-919.74
A	collect	2024,1,895,1
A	money	<0.6397
A	target	Ironzar
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.5
S	Undead Warrior
T	optional	
T	completewith	BaronLongshore
A	use	2024
A	itemcount	2024,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.5
A	xp	>16,1
S	Undead Warrior
T	optional	
T	completewith	BaronLongshore
A	use	2024
A	itemcount	2024,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.5
A	xp	<16,1
S	Troll Warrior
A	goto	1413/1,-3684.07,-919.74
A	collect	2030,1,850,1
A	money	<0.5544
A	target	Ironzar
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.9
S	Troll Warrior
T	optional	
T	completewith	BaronLongshore
A	use	2030
A	itemcount	2030,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.9
S	Orc Warrior
A	goto	1413/1,-3684.07,-919.74
A	collect	2025,1,850,1
A	money	<0.5304
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.8
S	Orc Warrior
T	optional	
T	completewith	BaronLongshore
A	use	2025
A	itemcount	2025,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.8
S	Tauren Warrior
A	goto	1413/1,-3684.07,-919.74
A	collect	2026,1,850,1
A	money	<0.6286
A	target	Ironzar
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.5
S	Tauren Warrior
T	optional	
T	completewith	BaronLongshore
A	use	2026
A	itemcount	2026,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.5
A	xp	>16,1
S	Tauren Warrior
T	optional	
T	completewith	BaronLongshore
A	use	2026
A	itemcount	2026,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.5
A	xp	<16,1
S	Shaman
T	season	0
A	goto	1413/1,-3684.07,-919.74
A	collect	2030,1,895,1
A	money	<0.5544
A	target	Ironzar
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.9
S	Shaman
T	season	0
T	optional	
T	completewith	BaronLongshore
A	use	2030
A	itemcount	2030,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.9
S	Shaman
T	season	2
A	goto	1413/1,-3684.07,-919.74
A	collect	2028,1,895,1
A	money	<0.5065
A	target	Ironzar
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.5
S	Shaman
T	season	2
T	optional	
T	completewith	BaronLongshore
A	use	2028
A	itemcount	2028,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.5
S	Rogue
A	goto	1413/1,-3684.07,-919.74
A	collect	2027,1,895,1
A	money	<0.3815
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.6
A	target	Ironzar
S	Rogue
T	optional	
T	completewith	BaronLongshore
A	use	2027
A	itemcount	2027,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.6
S	Rogue
A	goto	1413/1,-3684.07,-919.74
A	collect	2027,2,895,1
A	money	<0.3815
A	itemStat	17,QUALITY,<7
A	itemStat	17,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.6
A	target	Ironzar
S	skip
T	optional	
T	completewith	BaronLongshore
A	use	2027
A	itemcount	2027,1
A	itemStat	17,QUALITY,<7
A	itemStat	17,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.6
S	
A	goto	1413/1,-3687.11,-981.22
A	turnin	819
A	accept	821
A	target	Brewmaster Drohn
S	
A	goto	1413/1,-3664.82,-1050.14
A	vendor	
A	collect	4592,20,895,1
A	collect	1205,10,895,1 << Mage/Warlock/Priest/Shaman/Druid
A	target	Innkeeper Wiley
A	isOnQuest	887
S	
T	completewith	BaronLongshore
A	destroy	5088
S	
T	optional	
T	completewith	BaronLongshore
A	complete	887,1
A	mob	+Southsea Brigand
A	complete	887,2
A	mob	+Southsea Cannoneer
S	Orc Rogue/Troll Rogue
T	optional	
T	completewith	SouthSea
A	complete	1963,1
A	unitscan	Tazan
S	
T	label	BaronLongshore
T	loop	
A	goto	1413/1,-3883.70,-1572.40,0
A	goto	1413/1,-3818.84,-1707.52,0
A	goto	1413/1,-3724.60,-1746.71,0
A	goto	1413/1,-3883.70,-1572.40,50,0
A	goto	1413/1,-3818.84,-1707.52,50,0
A	goto	1413/1,-3724.60,-1746.71,50,0
A	complete	895,1
A	unitscan	Baron Longshore
S	
T	label	SouthSea
T	loop	
A	goto	1413/1,-3885.72,-1569.690,0
A	goto	1413/1,-3902.95,-1366.33,50,0
A	goto	1413/1,-3823.91,-1512.94,50,0
A	goto	1413/1,-3885.72,-1569.690,50,0
A	complete	887,1
A	mob	+Southsea Brigand
A	complete	887,2
A	mob	+Southsea Cannoneer
S	Orc Rogue/Troll Rogue
A	goto	1413/1,-3832.02,-1381.87,50,0
A	goto	1413/1,-3730.68,-1364.98,50,0
A	goto	1413/1,-3677.99,-1392.00
A	complete	1963,1
A	unitscan	Tazan
S	
A	goto	1413/1,-3728.66,-835.29
A	turnin	887
A	turnin	895
A	accept	890
A	target	Gazlowe
S	
A	goto	1413/1,-3796.55,-985.28
A	turnin	1492
A	turnin	890
A	accept	892
A	accept	896
A	target	Wharfmaster Dizzywig
S	
A	goto	1413/1,-3728.66,-835.29
A	turnin	892
A	accept	888
A	target	Gazlowe
S	Undead Warrior
A	goto	1413/1,-3684.07,-919.74
A	collect	2024,1,850,1
A	money	<0.6397
A	target	Ironzar
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.5
S	Undead Warrior
T	optional	
T	completewith	FlyToXroads1
A	use	2024
A	itemcount	2024,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.5
A	xp	>16,1
S	Undead Warrior
T	optional	
T	completewith	FlyToXroads1
A	use	2024
A	itemcount	2024,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.5
A	xp	<16,1
S	Troll Warrior
A	goto	1413/1,-3684.07,-919.74
A	collect	2030,1,850,1
A	money	<0.5544
A	target	Ironzar
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.9
S	Troll Warrior
T	optional	
T	completewith	FlyToXroads1
A	use	2030
A	itemcount	2030,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.9
S	Orc Warrior
A	goto	1413/1,-3684.07,-919.74
A	collect	2025,1,850,1
A	money	<0.5304
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.8
S	Orc Warrior
T	optional	
T	completewith	FlyToXroads1
A	use	2025
A	itemcount	2025,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.8
S	Tauren Warrior
A	goto	1413/1,-3684.07,-919.74
A	collect	2026,1,850,1
A	money	<0.6286
A	target	Ironzar
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.5
S	Tauren Warrior
T	optional	
T	completewith	FlyToXroads1
A	use	2026
A	itemcount	2026,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.5
A	xp	>16,1
S	Tauren Warrior
T	optional	
T	completewith	FlyToXroads1
A	use	2026
A	itemcount	2026,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.5
A	xp	<16,1
S	Shaman
T	season	0
A	goto	1413/1,-3684.07,-919.74
A	collect	2030,1,850,1
A	money	<0.5544
A	target	Ironzar
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.9
S	Shaman
T	season	0
T	optional	
T	completewith	BaronLongshore
A	use	2030
A	itemcount	2030,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.9
S	Shaman
T	season	2
A	goto	1413/1,-3684.07,-919.74
A	collect	2028,1,850,1
A	money	<0.5065
A	target	Ironzar
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.5
S	Shaman
T	season	2
T	optional	
T	completewith	BaronLongshore
A	use	2028
A	itemcount	2028,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.5
S	Rogue
A	goto	1413/1,-3684.07,-919.74
A	collect	2027,1,850,1
A	money	<0.3815
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.6
A	target	Ironzar
S	Rogue
T	optional	
T	completewith	FlyToXroads1
A	use	2027
A	itemcount	2027,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.6
S	Rogue
A	goto	1413/1,-3684.07,-919.74
A	collect	2027,2,850,1
A	money	<0.3815
A	itemStat	17,QUALITY,<7
A	itemStat	17,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.6
A	target	Ironzar
S	skip
T	optional	
T	completewith	FlyToXroads1
A	use	2027
A	itemcount	2027,1
A	itemStat	17,QUALITY,<7
A	itemStat	17,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.6
S	
T	label	FlyToXroads1
T	completewith	XroadsTurnins3
A	goto	1413/1,-3770.20,-898.12
A	fly	Crossroads
A	target	Bragok
A	subzoneskip	380
A	isQuestComplete	845
S	
T	completewith	next
A	complete	869,1
A	mob	Sunscale Lashtail
A	mob	Sunscale Screecher
S	
T	loop	
A	goto	1413/1,-2977.78,-942.71,0
A	goto	1413/1,-2274.52,-870.42,0
A	goto	1413/1,-2977.78,-942.71,80,0
A	goto	1413/1,-2832.87,-990.01,80,0
A	goto	1413/1,-2710.26,-959.6,80,0
A	goto	1413/1,-2392.07,-900.83,80,0
A	goto	1413/1,-2274.52,-870.42,80,0
A	complete	845,1
A	mob	Zhevra Runner
S	
T	label	XroadsTurnins3
A	turnin	5041
A	turnin	872
A	target	+Thork
A	goto	1413/1,-2595.75,-473.15
A	turnin	845
A	accept	903
A	target	+Sergra Darkthorn
A	goto	1413/1,-2669.72,-481.94
S	Troll Hunter/Orc Hunter
A	goto	1413/1,-2612.98,-411.00
A	collect	2515,1200,850,1 << Hunter
A	target	Barg
S	Tauren Hunter
A	goto	1413/1,-2612.98,-411.00
A	collect	2519,1000,850,1 << Hunter
A	target	Barg
S	Troll Hunter/Orc Hunter
A	goto	1413/1,-2556.23,-351.54
A	vendor	
A	collect	2515,1200,870,1 << Hunter
A	target	Uthrok
A	isOnQuest	903
S	Tauren Hunter
A	goto	1413/1,-2556.23,-351.54
A	collect	2511,1,871,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.9
A	target	Uthrok
S	
T	optional	
T	completewith	RegtharDeathgate1
A	complete	821,2
A	mob	Greater Plainstrider
A	mob	Fleeting Plainstrider
S	
T	optional	
T	completewith	next
A	complete	869,1
A	mob	Sunscale Lashtail
A	mob	Sunscale Screecher
S	
T	xprate	<1.5
A	goto	1413/1,-1972.55,-306.95
A	accept	850
A	accept	855
A	target	Regthar Deathgate
S	
T	xprate	>1.49
A	goto	1413/1,-1972.55,-306.95
A	accept	850
A	target	Regthar Deathgate
S	
T	optional	
T	label	RegtharDeathgate1
A	goto	1413/1,-1972.55,-306.95
A	accept	850
A	target	Regthar Deathgate
S	
T	optional	
T	xprate	<1.5
T	completewith	KodobaneTurnin
A	complete	855,1
A	mob	Kolkar Wrangler
A	mob	Kolkar Stormer
A	isOnQuest	855
S	
T	optional	
T	completewith	Barak
A	complete	848,1
S	Druid
T	season	2
A	goto	1413/1,-1909.72,113.96
A	collect	208682,1
A	train	416049,1
S	
A	goto	1413/1,-1943.16,89.64
A	complete	870,1
S	
T	label	Barak
A	goto	1413/1,-1716.18,23.43
A	complete	850,1
A	mob	Barak Kodobane
S	
T	xprate	<1.5
A	goto	1413/1,-1972.55,-306.95
A	turnin	850
A	accept	851
A	turnin	855
A	target	Regthar Deathgate
A	isQuestComplete	855
S	
T	xprate	<1.5
T	label	KodobaneTurnin
A	goto	1413/1,-1972.55,-306.95
A	turnin	850
A	accept	851
A	target	Regthar Deathgate
S	
T	xprate	<1.5
T	optional	
A	goto	1413/1,-1972.55,-306.95
A	accept	851
A	target	Regthar Deathgate
A	isQuestTurnedIn	850
S	
T	optional	
T	completewith	next
A	complete	869,1
A	mob	Sunscale Lashtail
A	mob	Sunscale Screecher
S	
T	loop	
A	goto	1413/1,-1594.58,30.19,0
A	goto	1413/1,-1594.58,30.19,50,0
A	goto	1413/1,-1562.15,-29.94,50,0
A	goto	1413/1,-1483.11,66.67,50,0
A	goto	1413/1,-1531.75,180.85,50,0
A	goto	1413/1,-1462.84,214.63,50,0
A	complete	903,1
A	complete	821,1
A	mob	Savannah Prowler
S	
T	loop	
A	goto	1413/1,-1616.87,611.90,0
A	goto	1413/1,-1583.43,322.73,60,0
A	goto	1413/1,-1513.51,380.84,60,0
A	goto	1413/1,-1526.68,477.450,60,0
A	goto	1413/1,-1555.06,545.69,60,0
A	goto	1413/1,-1553.03,615.95,60,0
A	goto	1413/1,-1616.87,611.90,60,0
A	complete	867,1
A	mob	Witchwing Harpy
A	mob	Witchwing Roguefeather
S	skip --!Tauren
T	completewith	next
A	zone	Stonetalon Mountains
A	zoneskip	Stonetalon Mountains
A	dungeon	RFC
A	isOnQuest	5724
A	isQuestComplete	5723
S	skip --!Tauren
T	optional	
T	completewith	next
A	goto	1442/1,-786.33,-294.97,60,0
A	goto	1442/1,-665.72,-280.97,40,0
A	goto	1442/1,-522.63,-294.32,40
A	dungeon	RFC
A	isOnQuest	5724
A	isQuestComplete	5723
S	skip --!Tauren
A	goto	1442/1,-401.53,-277.710
A	goto	1456/1,-74.62,-981.93,30
A	link	https://www.youtube.com/watch?v=cp2YI86AO4Y&ab
A	dungeon	RFC
A	isOnQuest	5724
A	isQuestComplete	5723
S	skip --!Tauren
T	completewith	RFCPickups
A	goto	1456/1,-13.04,-1107.95,40
A	isOnQuest	5724
A	isQuestComplete	5723
A	dungeon	RFC
S	skip --!Tauren
T	completewith	next
A	goto	1456/1,-212.71,-1065.010,80
A	isOnQuest	5724
A	isQuestComplete	5723
A	dungeon	RFC
S	skip --!Tauren
A	goto	1456/1,-218.13,-1055.97
A	turnin	5724
A	turnin	5723
A	target	Rahauro
A	dungeon	RFC
A	isOnQuest	5724
A	isQuestComplete	5723
S	skip --!Tauren
A	goto	1456/1,-218.13,-1055.97
A	turnin	5724
A	target	Rahauro
A	dungeon	RFC
A	isOnQuest	5724
S	skip --!Tauren
A	goto	1456/1,-218.13,-1055.97
A	turnin	5723
A	target	Rahauro
A	dungeon	RFC
A	isQuestComplete	5723
S	skip --!Tauren
T	completewith	Samophlange
A	hs	
A	cooldown	item,6948,>0
A	use	6948
A	dungeon	RFC
S	skip --!Tauren
T	completewith	Samophlange
A	goto	1456/1,26.1,-1196.66
A	fly	Crossroads
A	target	Tal
A	cooldown	item,6948,<0
A	zoneskip	The Barrens
A	dungeon	RFC
S	
T	optional	
A	abandon	5723
A	dungeon	RFC
S	
T	optional	
A	abandon	5725
A	dungeon	RFC
S	
T	optional	
A	abandon	5728
A	dungeon	RFC
S	
T	optional	
A	abandon	5761
A	dungeon	RFC
S	skip --!Tauren Orc !Warrior !Shaman/Troll !Warrior !Shaman
A	goto	1413/1,-2589.67,-424.51
A	turnin	848
A	target	Apothecary Helbrim
A	isQuestComplete	848
A	dungeon	RFC
S	skip --!Tauren Orc !Warrior !Shaman/Troll !Warrior !Shaman
T	xprate	<1.5
A	goto	1413/1,-2607.91,-475.180
A	turnin	867
A	accept	875
A	target	Darsok Swiftdagger
A	dungeon	RFC
S	skip --!Tauren Orc !Warrior !Shaman/Troll !Warrior !Shaman
T	xprate	>1.49
A	goto	1413/1,-2607.91,-475.180
A	turnin	867
A	target	Darsok Swiftdagger
A	dungeon	RFC
S	skip --!Tauren Orc !Warrior !Shaman/Troll !Warrior !Shaman
A	goto	1413/1,-2672.76,-544.77
A	turnin	870
A	accept	877
A	target	Tonga Runetotem
A	dungeon	RFC
S	skip --!Tauren Orc !Warrior !Shaman/Troll !Warrior !Shaman
A	goto	1413/1,-2670.74,-482.61
A	turnin	903
A	accept	881
A	target	Sergra Darkthorn
A	dungeon	RFC
S	skip --!Tauren Orc !Warrior !Shaman/Troll !Warrior !Shaman
A	goto	1413/1,-3031.48,461.91
A	complete	881,1
A	mob	Echeyakee
A	use	10327
A	dungeon	RFC
S	skip --!Tauren Orc !Warrior !Shaman/Troll !Warrior !Shaman
A	goto	1413/1,-2669.72,-481.94
A	abandon	881
A	itemcount	5100,<1
A	dungeon	RFC
S	skip --!Tauren Orc !Warrior !Shaman/Troll !Warrior !Shaman
A	goto	1413/1,-2670.74,-482.61
A	accept	881
A	target	Sergra Darkthorn
A	itemcount	5100,<1
A	dungeon	RFC
S	skip --!Tauren Orc !Warrior !Shaman/Troll !Warrior !Shaman
A	goto	1413/1,-3031.48,461.91
A	complete	881,1
A	mob	Echeyakee
A	use	10327
A	dungeon	RFC
S	skip --!Tauren Orc !Warrior !Shaman/Troll !Warrior !Shaman
T	completewith	Samophlange
A	dungeon	RFC
A	xp	>17,1
S	skip --!Tauren Orc !Warrior !Shaman/Troll !Warrior !Shaman
T	completewith	Samophlange
A	complete	821,2
A	mob	Greater Plainstrider
A	mob	Fleeting Plainstrider
A	mob	Ornery Plainstrider
A	dungeon	RFC
S	
T	completewith	Samophlange
A	xp	>17,1
S	
T	optional	
T	completewith	Samophlange
A	complete	821,2
A	mob	Greater Plainstrider
A	mob	Fleeting Plainstrider
A	mob	Ornery Plainstrider
S	
A	goto	1413/1,-1815.48,786.89
A	vendor	
A	target	Vrang Wildgore
S	
T	label	Samophlange
A	goto	1413/1,-2686.95,825.40
A	turnin	894
A	accept	900
S	
A	goto	1413/1,-2679.86,830.80
A	complete	900,2
S	
A	goto	1413/1,-2675.80,842.290
A	complete	900,3
S	
A	goto	1413/1,-2686.95,842.290
A	complete	900,1
S	
A	goto	1413/1,-2686.95,825.40
A	turnin	900
A	accept	901
S	
A	goto	1413/1,-2731.54,909.850
A	complete	901,1
A	mob	Tinkerer Sniggles
S	
A	goto	1413/1,-2686.95,825.40
A	turnin	901
A	accept	902
S	
T	optional	
T	completewith	Ignition
A	complete	821,2
A	mob	Greater Plainstrider
A	mob	Fleeting Plainstrider
A	mob	Ornery Plainstrideridneys
S	
T	loop	
A	goto	1413/1,-2879.48,781.48,0
A	goto	1413/1,-2879.48,781.48,90,0
A	goto	1413/1,-2909.88,484.21,90,0
A	goto	1413/1,-1693.88,592.31,90,0
A	complete	869,1
A	mob	Sunscale Lashtail
A	mob	Sunscale Screecher
A	mob	Sunscale Scytheclaw
S	
T	optional	
A	goto	1413/1,-3102.42,1105.78
A	xp	16
S	
T	label	Ignition
A	goto	1413/1,-3104.44,1109.16
A	accept	858
A	target	Wizzlecrank's Shredder
S	
T	completewith	next
A	unitscan	Foreman Grills
A	unitscan	Sludge Beast
S	
A	goto	1413/1,-3104.44,1040.25,20,0
A	goto	1413/1,-3086.20,1055.78,12,0
A	goto	1413/1,-3063.91,1049.70,12,0
A	goto	1413/1,-3056.82,1038.89,12,0
A	goto	1413/1,-3064.92,1034.16,12,0
A	goto	1413/1,-3086.20,1055.78
A	complete	858,1
A	mob	Supervisor Lugwizzle
A	isOnQuest	858
S	
A	goto	1413/1,-3104.44,1109.16
A	turnin	858
A	accept	863,1
A	target	Wizzlecrank's Shredder
A	isQuestComplete	858
S	
T	optional	
A	goto	1413/1,-3104.44,1109.16
A	accept	863,1
A	target	Wizzlecrank's Shredder
A	isQuestTurnedIn	858
S	
T	label	Slugs
A	goto	1413/1,-3031.48,1088.21,30,0
A	goto	1413/1,-3002.10,1130.78
A	complete	863,1
A	mob	Venture Co. Mercenary
A	mob	Venture Co. Drudger
A	mob	Overseer Glibby
A	isOnQuest	863
S	
T	optional	
T	completewith	next
A	complete	821,2
A	mob	Greater Plainstrider
A	mob	Fleeting Plainstrider
A	mob	Ornery Plainstrider
S	
T	label	CatsEye
T	loop	
A	goto	1413/1,-3610.1,1313.2,0
A	goto	1413/1,-3605.03,1308.47,40,0
A	goto	1413/1,-3564.5,1367.25,40,0
A	goto	1413/1,-3622.26,1384.81,40,0
A	goto	1413/1,-3673.94,1374.68,40,0
A	goto	1413/1,-3653.67,1306.44,40,0
A	goto	1413/1,-3644.55,1249.69,40,0
A	goto	1413/1,-3603.0,1236.85,40,0
A	goto	1413/1,-3575.64,1271.31,40,0
A	goto	1413/1,-3610.1,1313.2,40,0
A	complete	896,1
A	mob	Venture Co. Enforcer
A	mob	Venture Co. Overseer
S	
T	ssf	
A	goto	1413/1,-3610.1,1313.2,0
A	goto	1413/1,-3605.03,1308.47,40,0
A	goto	1413/1,-3564.5,1367.25,40,0
A	goto	1413/1,-3622.26,1384.81,40,0
A	goto	1413/1,-3673.94,1374.68,40,0
A	goto	1413/1,-3653.67,1306.44,40,0
A	goto	1413/1,-3644.55,1249.69,40,0
A	goto	1413/1,-3603.0,1236.85,40,0
A	goto	1413/1,-3575.64,1271.31,40,0
A	goto	1413/1,-3610.1,1313.2,40,0
A	collect	814,5,103,1
A	dungeon	DM
S	
T	ah	
A	goto	1413/1,-3610.1,1313.2,0
A	goto	1413/1,-3605.03,1308.47,40,0
A	goto	1413/1,-3564.5,1367.25,40,0
A	goto	1413/1,-3622.26,1384.81,40,0
A	goto	1413/1,-3673.94,1374.68,40,0
A	goto	1413/1,-3653.67,1306.44,40,0
A	goto	1413/1,-3644.55,1249.69,40,0
A	goto	1413/1,-3603.0,1236.85,40,0
A	goto	1413/1,-3575.64,1271.31,40,0
A	goto	1413/1,-3610.1,1313.2,40,0
A	collect	814,5,103,1
A	dungeon	DM
S	skip
A	goto	1413/1,-3505.72,1358.46
A	goto	1454/1,-4242.34,1637.33,30
A	link	https://www.youtube.com/watch?v=U7YfoaO-X8E&ab_channel=RestedXP
A	zoneskip	Orgrimmar
S	
T	completewith	SpiritsPickup
A	goto	1414/1,-3839.37,1644.65
A	zone	Orgrimmar
S	
T	completewith	next
A	skill	firstaid,40
A	skill	firstaid,<1,1
S	
A	goto	1454/1,-4160.01,1483.17
A	train	3276
A	target	Arnok
A	skill	firstaid,<1,1
S	
T	completewith	next
A	skill	firstaid,50
A	skill	firstaid,<1,1
S	
A	goto	1454/1,-4160.01,1483.17
A	train	3274
A	target	Arnok
A	skill	firstaid,<40,1
S	
T	completewith	SpiritsPickup
A	itemcount	814,5
A	dungeon	DM
S	Priest
T	optional	
A	goto	1454/1,-4179.79,1452.580
A	train	8102
A	target	Ur'kyo
A	xp	<16,1
A	xp	>18,1
S	Priest
T	optional	
T	season	2
A	goto	1454/1,-4179.79,1452.580
A	train	527
A	target	Ur'kyo
A	xp	<18,1
S	Priest
T	optional	
T	season	0
A	goto	1454/1,-4179.79,1452.580
A	train	970
A	target	Ur'kyo
A	xp	<18,1
S	Mage
A	goto	1454/1,-4218.64,1473.72
A	train	2120
A	target	Pephredo
A	xp	<16,1
A	xp	>18,1
S	Mage
T	optional	
A	goto	1454/1,-4218.64,1473.72
A	train	3140
A	target	Pephredo
A	xp	<18,1
S	!Tauren !Undead !Shaman !Warrior
A	goto	1454/1,-4439.37,1633.99
A	turnin	6384
A	accept	6385
A	target	Innkeeper Gryshka
A	isOnQuest	6384
S	!Tauren !Undead !Shaman !Warrior
A	goto	Orgrimmar,45.120,63.889
A	turnin	6385
A	accept	6386
A	target	Doras
A	isOnQuest	6385
S	!Tauren !Undead !Shaman !Warrior
A	goto	Orgrimmar,45.120,63.889
A	accept	6386
A	target	Doras
A	isQuestTurnedIn	6385
S	Tauren/Undead
A	goto	1454/1,-4313.60,1676.24
A	fp	Orgrimmar
A	target	Doras
A	isQuestAvailable	4921
S	Shaman
T	season	2
A	goto	1454/1,-4225.09,1933.29
A	train	8019
A	target	Kardris Dreamseeker
A	xp	<16,1
A	xp	>18,1
S	Shaman
T	optional	
T	season	2
A	goto	1454/1,-4225.09,1933.29
A	train	913
A	target	Kardris Dreamseeker
A	xp	<18,1
S	Shaman
T	season	0
A	goto	1454/1,-4225.09,1933.29
A	train	8019
A	target	Kardris Dreamseeker
A	xp	<16,1
A	xp	>18,1
S	Shaman
T	optional	
T	season	0
A	goto	1454/1,-4225.09,1933.29
A	train	913
A	target	Kardris Dreamseeker
A	xp	<18,1
S	
A	goto	1454/1,-4226.78,1914.77
A	accept	1061
A	target	Zor Lonetree
S	Rogue
A	goto	1454/1,-4284.42,1771.28
A	train	1804
A	train	921
A	accept	2379
A	target	Shenthul
S	Orc Rogue/Troll Rogue
A	goto	1454/1,-4280.07,1772.96
A	turnin	1963
A	accept	1858
A	target	Therzok
S	Rogue
A	goto	1454/1,-4279.79,1778.57
A	turnin	2379
A	accept	2382
A	target	Zando'zan
S	Orc Rogue/Troll Rogue
T	optional	
T	completewith	next
A	goto	1454/1,-4271.1,1810.75
A	collect	5060,1,1858,1
A	target	Rekkul
A	money	<0.15
S	Orc Rogue/Troll Rogue
A	goto	1454/1,-4280.07,1773.24
A	complete	1858,1
A	money	<0.15
S	Orc Rogue/Troll Rogue
A	goto	1454/1,-4280.07,1772.96
A	turnin	1858
A	target	Therzok
S	Orc Rogue/Troll Rogue
A	goto	1454/1,-4437.87,1637.33
A	collect	7208,1,1858,1
A	complete	1858,1
A	isOnQuest	1858
S	Orc Rogue/Troll Rogue
A	goto	1454/1,-4280.07,1772.96
A	turnin	1858
A	target	Therzok
S	Warlock
A	goto	1454/1,-4362.55,1834.70
A	train	1455
A	target	Mirket
A	xp	<16,1
A	xp	>18,1
S	Warlock
T	optional	
A	goto	1454/1,-4362.55,1834.70
A	train	1014
A	target	Mirket
A	xp	<18,1
S	Warlock
A	goto	1454/1,-4347.4,1836.57
A	collect	16351,1,896,1
A	target	Kurgul
A	xp	<16,1
A	xp	>18,1
S	Warlock
A	goto	1454/1,-4347.4,1836.57
A	collect	16316,1,896,1
A	target	Kurgul
A	xp	<18,1
S	Warrior
A	goto	1454/1,-4801.42,1980.53
A	train	285
A	target	Grezz Ragefist
A	xp	<16,1
A	xp	>18,1
S	Warrior
T	optional	
A	goto	1454/1,-4801.42,1980.53
A	train	8198
A	target	Grezz Ragefist
A	xp	<18,1
S	Hunter
A	goto	1454/1,-4607.02,2100.64
A	train	13795
A	target	Ormak Grimshot
A	xp	<16,1
A	xp	>18,1
S	Hunter
T	optional	
A	goto	1454/1,-4607.02,2100.64
A	train	2643
A	target	Ormak Grimshot
A	xp	<18,1
S	Hunter
A	goto	1454/1,-4611.09,2135.15
A	train	24557
A	target	Xao'tsu
A	xp	<18,1
S	Troll Hunter/Orc Hunter/Priest
A	goto	1454/1,-4824.00,2090.540
A	train	227
A	target	Hanashi
A	money	<0.100
S	Tauren Hunter
A	goto	1454/1,-4824.00,2090.540
A	train	264
A	target	Hanashi
S	Troll Warrior/Tauren Warrior/Undead Warrior
A	goto	1454/1,-4824.00,2090.540
A	train	197
A	train	227
A	target	Hanashi
S	Hunter
A	goto	1454/1,-4819.1,2099.05
A	collect	3026,1,3281,1
A	money	<0.3588
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<7.4
A	target	Zendo'jian
A	train	227,3
S	Hunter
T	optional	
T	completewith	FoodandWater2
A	use	3026
A	itemcount	3026,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<7.4
S	Warrior
A	goto	1454/1,-4819.1,2099.05
A	collect	926,1,3281,1
A	money	<1.021
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.2
A	target	Zendo'jian
A	train	227,3
S	Warrior
T	optional	
T	completewith	FoodandWater2
A	use	926
A	itemcount	926,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.2
A	xp	>20,1
S	Warrior
T	optional	
T	completewith	FoodandWater2
A	use	926
A	itemcount	926,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.2
A	xp	<20,1
S	Druid/Mage
T	season	2
T	ah	
A	goto	1454/1,-4460.31,1685.31
A	collect	5020,1
A	target	Auctioneer Thathung
A	itemcount	208689,<1,1 << Druid
A	train	407988,1 << Druid
A	train	401767,1 << Mage
S	
T	optional	
T	label	SpiritsPickup
S	
T	completewith	FoodandWater2
A	hs	
A	cooldown	item,6948,>0
A	use	6948
A	bindlocation	380,1
A	subzoneskip	380
S	
T	completewith	FoodandWater2
A	goto	Orgrimmar,45.120,63.889
A	fly	Crossroads
A	target	Doras
A	cooldown	item,6948,<0
A	subzoneskip	380
S	
T	label	FoodandWater2
A	goto	1413/1,-2645.40,-406.94
A	vendor	
A	vendor	
A	target	Innkeeper Boorand Plainswind
A	isQuestAvailable	3281
S	
A	goto	1413/1,-2639.32,-436.00
A	turnin	869
A	accept	3281
A	target	Gazrog
S	
A	goto	1413/1,-2589.67,-424.51
A	turnin	848
A	target	Apothecary Helbrim
A	isQuestComplete	848
S	
T	xprate	<1.5
A	goto	1413/1,-2607.91,-475.180
A	turnin	867
A	accept	875
A	target	Darsok Swiftdagger
S	
T	xprate	>1.49
A	goto	1413/1,-2607.91,-475.180
A	turnin	867
A	target	Darsok Swiftdagger
S	
A	goto	1413/1,-2672.76,-544.77
A	turnin	870
A	accept	877
A	target	Tonga Runetotem
S	
T	label	EcheyakeePickup
A	goto	1413/1,-2670.74,-482.61
A	turnin	903
A	accept	881
A	target	Sergra Darkthorn
S	!Tauren !Undead !Warrior !Shaman
A	goto	1413/1,-2709.24,-404.24
A	turnin	6386
A	target	Zargh
A	isOnQuest	6386
S	
A	goto	1413/1,-3031.48,461.91
A	complete	881,1
A	mob	Echeyakee
A	use	10327
S	
T	optional	
A	goto	1413/1,-2669.72,-481.94
A	abandon	881
A	itemcount	5100,<1
S	
A	goto	1413/1,-2670.74,-482.61
A	accept	881
A	target	Sergra Darkthorn
A	itemcount	5100,<1
S	
A	goto	1413/1,-3031.48,461.91
A	complete	881,1
A	mob	Echeyakee
A	use	10327
S	
A	goto	1413/1,-2670.74,-482.61
A	turnin	881
A	accept	905
A	target	Sergra Darkthorn
S	
T	completewith	RapHornsPickup
A	destroy	10327
S	Warrior
T	season	2
A	goto	1413/1,-2673.78,-487.34,
A	aura	420667
A	train	403489,1
S	
A	goto	1413/1,-2641.35,-521.12
A	accept	899
A	accept	4921
A	target	Mankrik
S	Hunter
A	goto	1413/1,-2612.98,-411.00
A	collect	2515,1800,888,1 << Hunter
A	target	Barg
S	
T	completewith	RapHornsPickup
A	goto	1413/1,-2595.75,-437.35
A	fly	Ratchet
A	target	Devrak
A	subzoneskip	392
S	Rogue
A	goto	1413/1,-3768.18,-840.69
A	turnin	2382
A	accept	2381
A	target	Wrenix the Wretched
S	Rogue
A	goto	1413/1,-3773.24,-841.37
A	collect	7970,1,888,1
A	collect	5060,1,888,1
S	
A	turnin	902
A	turnin	863
A	accept	3921
A	accept	1483
A	target	+Sputtervalve
A	goto	1413/1,-3759.06,-902.18
A	turnin	896
A	target	+Wharfmaster Dizzywig
A	goto	1413/1,-3796.55,-985.28
A	isQuestComplete	896
A	isQuestComplete	863
S	
T	optional	
A	turnin	902
A	accept	3921
A	accept	1483
A	target	+Sputtervalve
A	goto	1413/1,-3759.06,-902.18
A	turnin	896
A	target	+Wharfmaster Dizzywig
A	goto	1413/1,-3796.55,-985.28
A	isQuestComplete	896
S	
T	optional	
A	goto	1413/1,-3759.06,-902.18
A	turnin	863
A	accept	1483
A	target	Sputtervalve
A	isQuestComplete	863
S	
T	optional	
A	goto	1413/1,-3759.06,-902.18
A	accept	1483
A	target	Sputtervalve
S	
T	label	RapHornsPickup
A	goto	1413/1,-3697.24,-929.20
A	accept	865
A	accept	1069
A	target	Mebok Mizzyrix
S	Warrior
T	season	2
A	goto	1413/1,-3737.78,-971.09
A	collect	208773,1
A	target	Kilxx
A	train	425443,1 << Warrior
S	Warrior
T	season	2
A	goto	1413/1,-3914.10,-1044.06
A	use	208773
A	collect	208778,1 << Warrior
A	unitscan	Bruuz
A	train	425443,1 << Warrior
S	Warrior
T	season	2
A	train	425443
A	use	208778
A	itemcount	208778,1
S	
A	goto	1413/1,-3664.82,-1050.14
A	vendor	
A	collect	4592,20,888,1
A	collect	1205,10,888,1 << Mage/Warlock/Priest/Shaman/Druid
A	target	Innkeeper Wiley
S	Rogue
T	completewith	next
A	goto	1413/1,-3967.8,-1457.54
S	Rogue
A	goto	1413/1,-3958.68,-1457.54
A	complete	2381,1
A	use	7970
A	mob	Polly
S	
T	label	LeaveRatchet
A	goto	1413/1,-3819.86,-1714.95
A	complete	888,2
S	
A	goto	1413/1,-3723.59,-1741.30
A	complete	888,1
S	Warrior
T	season	2
T	completewith	next
A	subzone	385
S	Warrior
T	season	2
A	goto	1413/1,-3715.48,-2191.94
A	collect	208741,1
A	mob	Lieutenant Stonebrew
A	train	403489,1
S	Warrior
T	season	2
A	train	403489
A	use	208741
A	itemcount	208741,1
S	
T	optional	
T	completewith	TestSeeds
A	complete	821,2
A	mob	Greater Plainstrider
A	mob	Fleeting Plainstrider
A	mob	Ornery Plainstrider
S	
T	optional	
T	completewith	TestSeeds
A	complete	865,1
A	collect	5165,3,905,3
A	mob	Sunscale Scytheclaw
S	
A	goto	1413/1,-3192.60,-1919.67,60,0
A	goto	1413/1,-3258.47,-2027.09
A	complete	3281,1
S	
T	optional	
T	xprate	<1.5
T	completewith	Verog
A	complete	848,1
S	
T	optional	
T	xprate	>1.49
T	completewith	next
A	complete	848,1
S	
T	label	TestSeeds
A	goto	1413/1,-3012.23,-1275.80
A	complete	877,1
S	Druid/Mage
T	optional	
T	season	2
T	completewith	Verog
A	collect	5020,1
A	mob	Kolkar Wrangler
A	mob	Kolkar Stormer
A	train	407988,1 << Druid
A	train	401767,1 << Mage
S	
T	optional	
T	xprate	<1.5
T	completewith	next
T	loop	
A	goto	1413/1,-3031.48,-1480.51,50,0
A	goto	1413/1,-3127.75,-1320.39,50,0
A	goto	1413/1,-3154.1,-1172.43,50,0
A	goto	1413/1,-2996.02,-1182.56,50,0
A	goto	1413/1,-2949.4,-1146.75,50,0
A	goto	1413/1,-2789.3,-1107.57,50,0
A	goto	1413/1,-2746.74,-1409.57,50,0
A	goto	1413/1,-2880.5,-1550.1,50,0
A	complete	855,1
A	mob	Kolkar Bloodcharger
A	mob	Kolkar Pack runner
A	mob	Kolkar Marauder
A	isOnQuest	851
S	
T	xprate	<1.5
T	label	Verog
A	goto	1413/1,-2742.68,-1208.23
A	complete	851,1
A	unitscan	Verog the Dervish
A	isOnQuest	851
S	Druid/Mage
T	season	2
T	loop	
A	goto	1413/1,-3031.48,-1480.51,0
A	goto	1413/1,-3031.48,-1480.51,50,0
A	goto	1413/1,-3127.75,-1320.39,50,0
A	goto	1413/1,-3154.1,-1172.43,50,0
A	goto	1413/1,-2996.02,-1182.56,50,0
A	goto	1413/1,-2949.4,-1146.75,50,0
A	goto	1413/1,-2789.3,-1107.57,50,0
A	goto	1413/1,-2746.74,-1409.57,50,0
A	goto	1413/1,-2880.5,-1550.1,50,0
A	collect	5020,1
A	mob	Kolkar Wrangler
A	mob	Kolkar Stormer
A	itemcount	208689,<1,1 << Druid
A	train	407988,1 << Druid
A	train	401767,1 << Mage
S	Druid/Mage
T	season	2
A	goto	1413/1,-2717.35,-1211.61
A	collect	5020,1
A	collect	208689,1 << Druid
A	collect	208754,1 << Mage
A	itemcount	208689,<1,1 << Druid
A	train	407988,1 << Druid
A	train	401767,1 << Mage
S	Druid
T	season	2
T	completewith	Nest
A	equip	18,208689
A	use	208689
A	itemcount	208689,1
A	train	407988,1 << Druid
A	train	401767,1 << Mage
S	Druid
T	season	2
T	completewith	Nest
A	train	407988
A	use	208689
A	itemcount	208689,1
S	Mage
T	season	2
A	train	401767
A	use	208754
A	itemcount	208754,1
S	
T	loop	
A	goto	1413/1,-3023.38,-1234.58,0
A	goto	1413/1,-3023.38,-1234.58,30,0
A	goto	1413/1,-3000.07,-1208.23,30,0
A	goto	1413/1,-2959.54,-1196.75,30,0
A	goto	1413/1,-2953.46,-1241.34,30,0
A	goto	1413/1,-2977.78,-1304.17,30,0
A	goto	1413/1,-3029.46,-1324.44,30,0
A	goto	1413/1,-3066.95,-1311.61,30,0
A	goto	1413/1,-3059.86,-1264.31,30,0
A	complete	848,1
S	
T	optional	
T	completewith	LakotaMani1
A	complete	821,2
A	mob	Greater Plainstrider
A	mob	Fleeting Plainstrider
A	mob	Ornery Plainstrider
S	
A	goto	1413/1,-2707.22,-1502.130
A	complete	905,1
A	collect	5165,3,905,7,3
A	mob	Sunscale Scytheclaw
S	
A	goto	1413/1,-2692.02,-1533.89
A	complete	905,3
A	collect	5165,3,905,7,3
A	mob	Sunscale Scytheclaw
S	
T	label	Nest
A	goto	1413/1,-2648.44,-1527.13
A	complete	905,2
A	collect	5165,3,905,7,3
A	mob	Sunscale Scytheclaw
S	
T	optional	
T	completewith	next
A	complete	865,1
A	mob	Sunscale Scytheclaw
S	
T	label	LostmyWife
A	goto	1413/1,-2375.86,-1787.24
A	complete	4921,1
A	target	Beaten Corpse
A	skipgossip	
S	
T	optional	
T	completewith	next
A	complete	821,3
A	mob	Stormsnout
S	
T	label	LakotaMani1
T	completewith	CampTArrive
A	goto	1413/1,-1951.27,-1956.15,0
A	goto	1413/1,-2031.32,-1703.47,0
A	goto	1413/1,-2183.32,-1858.19,0
A	goto	1413/1,-2453.88,-1991.28,0
A	collect	5099,1,883
A	accept	883
A	use	5099
A	unitscan	Lakota'mani
S	
T	optional	
T	completewith	CampTArrive
A	complete	821,3
A	mob	Stormsnout
S	Hunter
T	season	2
T	completewith	next
S	Hunter
T	season	2
T	loop	
A	goto	1413/1,-1746.58,-2263.56,0
A	goto	1413/1,-1896.55,-2137.89,40,0
A	goto	1413/1,-1840.82,-2184.510,40,0
A	goto	1413/1,-1746.58,-2263.56,40,0
A	line	The Barrens,44.60,55.51,44.60,55.51,43.12,57.37
A	collect	208701,1
A	mob	Patrolling Cheetah
A	train	410110,1
S	Hunter
T	season	2
A	train	410110
A	use	208701
A	itemcount	208701,1
S	
T	label	CampTArrive
T	completewith	next
A	goto	1413/1,-1960.39,-2333.83,120
A	subzoneskip	378
S	
T	requires	CampTArrive
T	label	SetCampTaurajoHS
A	goto	1413/1,-1995.86,-2376.39
A	home	
A	target	Innkeeper Byula
A	bindlocation	378
A	isQuestAvailable	1093
S	
A	goto	1413/1,-1921.88,-2383.15
A	turnin	883
A	target	Jorn Skyseer
A	isOnQuest	883
S	
A	goto	1413/1,-1891.48,-2391.93
A	accept	878
A	target	Mangletooth
S	
T	optional	
A	goto	1413/1,-1881.35,-2384.50
A	fp	Camp Taurajo
A	target	Omusa Thunderhorn
A	isOnQuest	5724
A	dungeon	RFC
S	
T	optional	
T	completewith	RFCTurninsTB1
A	goto	1412/1,-1480.52,-2339.56,120,0
A	zone	Mulgore
A	dungeon	RFC
S	
T	optional	
T	completewith	RFCTurninsTB1
A	goto	1456/1,184.96,-1308.69
A	zone	Thunder Bluff
A	dungeon	RFC
S	
T	optional	
T	completewith	RFCTurninsTB1
A	goto	1456/1,-212.71,-1065.010,80
A	isOnQuest	5724
A	isQuestComplete	5723
A	dungeon	RFC
S	
T	optional	
A	goto	1456/1,-218.13,-1055.97
A	turnin	5724
A	turnin	5723
A	target	Rahauro
A	isOnQuest	5724
A	isQuestComplete	5723
A	dungeon	RFC
S	
T	optional	
A	goto	1456/1,-218.13,-1055.97
A	turnin	5724
A	target	Rahauro
A	isOnQuest	5724
A	dungeon	RFC
S	
T	optional	
T	label	RFCTurninsTB1
A	goto	1456/1,-218.13,-1055.97
A	turnin	5723
A	target	Rahauro
A	isQuestComplete	5723
A	dungeon	RFC
S	
T	optional	
A	goto	1456/1,26.1,-1196.66
A	fly	Crossroads
A	target	Tal
A	zoneskip	Thunder Bluff,1
A	dungeon	RFC
S	
T	completewith	Xroadsturnins2
A	goto	1413/1,-1881.35,-2384.50
A	fp	Camp Taurajo
A	fly	Crossroads
A	target	Omusa Thunderhorn
A	zoneskip	The Barrens,1
A	subzoneskip	380
S	
A	goto	1413/1,-2589.67,-424.51
A	turnin	848
A	target	Apothecary Helbrim
A	isQuestComplete	848
S	
T	label	Xroadsturnins2
A	turnin	4921
A	target	+Mankrik
A	goto	1413/1,-2641.35,-521.12
A	turnin	877
A	accept	880
A	target	+Tonga Runetotem
A	goto	1413/1,-2672.76,-544.77
A	turnin	905
A	accept	3261
A	target	+Sergra Darkthorn
A	goto	1413/1,-2670.74,-482.61
A	turnin	3281
A	target	+Gazrog
A	goto	1413/1,-2639.32,-436.00
S	
A	destroy	5165
A	itemcount	5165,1
S	Hunter
A	goto	1413/1,-2556.23,-351.54
A	collect	11362,1,896,1
A	collect	2515,2200,896,1
A	target	Uthrok
S	
T	xprate	<1.5
A	goto	1413/1,-1972.55,-306.95
A	turnin	851
A	accept	852
A	turnin	855
A	target	Regthar Deathgate
A	isQuestComplete	855
S	
T	xprate	<1.5
T	label	Leaders
A	goto	1413/1,-1972.55,-306.95
A	turnin	851
A	accept	852
A	target	Regthar Deathgate
S	
T	xprate	>1.49
A	goto	1413/1,-1972.55,-306.95
A	turnin	850
A	target	Regthar Deathgate
S	
T	xprate	<1.5
T	completewith	Hezrul
A	subzone	387
A	isQuestTurnedIn	851
S	
T	optional	
T	xprate	<1.5
T	completewith	Hezrul
A	complete	880,1
A	mob	Oasis Snapjaw
S	
T	optional	
T	xprate	<1.5
T	completewith	next
A	complete	855,1
A	mob	Kolkar Bloodcharger
A	mob	Kolkar Pack runner
A	mob	Kolkar Marauder
A	isOnQuest	855
S	
T	xprate	<1.5
T	loop	
T	label	Hezrul
A	goto	1413/1,-2001.94,-965.69,0
A	goto	1413/1,-2001.94,-965.69,50,0
A	goto	1413/1,-2022.20,-945.42,50,0
A	goto	1413/1,-2016.12,-915.01,50,0
A	goto	1413/1,-2033.35,-894.74,50,0
A	goto	1413/1,-2031.32,-881.23,50,0
A	goto	1413/1,-2052.60,-877.18,50,0
A	goto	1413/1,-2057.67,-879.21,50,0
A	goto	1413/1,-2066.79,-877.85,50,0
A	goto	1413/1,-2085.03,-898.80,50,0
A	goto	1413/1,-2097.19,-908.26,50,0
A	goto	1413/1,-2102.26,-950.15,50,0
A	goto	1413/1,-2114.42,-981.22,50,0
A	goto	1413/1,-2167.11,-1021.09,50,0
A	goto	1413/1,-2187.38,-1040.68,50,0
A	goto	1413/1,-2261.35,-1060.95,50,0
A	goto	1413/1,-2281.62,-1061.62,50,0
A	goto	1413/1,-2301.88,-1056.89,50,0
A	goto	1413/1,-2295.80,-1087.30,50,0
A	goto	1413/1,-2299.86,-1125.13,50,0
A	goto	1413/1,-2268.44,-1145.40,50,0
A	goto	1413/1,-2247.16,-1145.40,50,0
A	goto	1413/1,-2226.90,-1166.35,50,0
A	goto	1413/1,-2189.40,-1179.86,50,0
A	goto	1413/1,-2174.20,-1198.78,50,0
A	goto	1413/1,-2162.04,-1200.80,50,0
A	goto	1413/1,-2124.55,-1228.50,50,0
A	goto	1413/1,-2095.16,-1220.40,50,0
A	goto	1413/1,-2065.78,-1208.91,50,0
A	goto	1413/1,-2041.46,-1167.70,50,0
A	goto	1413/1,-2024.23,-1179.18,50,0
A	goto	1413/1,-2047.54,-1156.21,50,0
A	goto	1413/1,-2046.52,-1135.94,50,0
A	goto	1413/1,-2009.03,-1127.84,50,0
A	goto	1413/1,-2001.94,-965.69,50,0
A	complete	852,1
A	unitscan	Hezrul Bloodmark
A	isQuestTurnedIn	851
S	
T	xprate	<1.5
A	goto	1413/1,-2001.94,-965.69,0
A	goto	1413/1,-2001.94,-965.69,50,0
A	goto	1413/1,-2022.20,-945.42,50,0
A	goto	1413/1,-2016.12,-915.01,50,0
A	goto	1413/1,-2033.35,-894.74,50,0
A	goto	1413/1,-2031.32,-881.23,50,0
A	goto	1413/1,-2052.60,-877.18,50,0
A	goto	1413/1,-2057.67,-879.21,50,0
A	goto	1413/1,-2066.79,-877.85,50,0
A	goto	1413/1,-2085.03,-898.80,50,0
A	goto	1413/1,-2097.19,-908.26,50,0
A	goto	1413/1,-2102.26,-950.15,50,0
A	goto	1413/1,-2114.42,-981.22,50,0
A	goto	1413/1,-2167.11,-1021.09,50,0
A	goto	1413/1,-2187.38,-1040.68,50,0
A	goto	1413/1,-2261.35,-1060.95,50,0
A	goto	1413/1,-2281.62,-1061.62,50,0
A	goto	1413/1,-2301.88,-1056.89,50,0
A	goto	1413/1,-2295.80,-1087.30,50,0
A	goto	1413/1,-2299.86,-1125.13,50,0
A	goto	1413/1,-2268.44,-1145.40,50,0
A	goto	1413/1,-2247.16,-1145.40,50,0
A	goto	1413/1,-2226.90,-1166.35,50,0
A	goto	1413/1,-2189.40,-1179.86,50,0
A	goto	1413/1,-2174.20,-1198.78,50,0
A	goto	1413/1,-2162.04,-1200.80,50,0
A	goto	1413/1,-2124.55,-1228.50,50,0
A	goto	1413/1,-2095.16,-1220.40,50,0
A	goto	1413/1,-2065.78,-1208.91,50,0
A	goto	1413/1,-2041.46,-1167.70,50,0
A	goto	1413/1,-2024.23,-1179.18,50,0
A	goto	1413/1,-2047.54,-1156.21,50,0
A	goto	1413/1,-2046.52,-1135.94,50,0
A	goto	1413/1,-2009.03,-1127.84,50,0
A	goto	1413/1,-2001.94,-965.69,50,0
A	complete	855,1
A	mob	Kolkar Bloodcharger
A	mob	Kolkar Pack runner
A	mob	Kolkar Marauder
A	itemcount	5030,5
A	isOnQuest	855
S	Druid
T	season	2
A	goto	1413/1,-2273.51,-1106.89
A	collect	208687,1
A	train	416049,1
S	Druid
T	season	2
A	train	416049
A	use	208687
A	itemcount	208687,1
S	
T	optional	
T	xprate	<1.5
T	completewith	CounterattackComplete
A	abandon	855
A	itemcount	5030,<5
S	
T	xprate	<1.5
A	goto	1413/1,-1972.55,-306.95
A	turnin	852
A	turnin	855
A	target	Regthar Deathgate
A	isQuestComplete	852
A	isQuestComplete	855
S	
T	xprate	<1.5
A	goto	1413/1,-1972.55,-306.95
A	turnin	852
A	target	Regthar Deathgate
A	isQuestComplete	852
S	
T	xprate	<1.5
A	goto	1413/1,-1972.55,-306.95
A	turnin	855
A	target	Regthar Deathgate
A	isQuestComplete	855
S	
T	xprate	<1.5
T	completewith	CounterattackComplete
A	isQuestTurnedIn	852
S	
T	xprate	<1.5
A	goto	1413/1,-1972.55,-306.95
A	accept	4021
A	target	Regthar Deathgate
A	isQuestTurnedIn	852
S	
T	xprate	<1.5
T	label	CounterattackComplete
A	goto	1413/1,-1884.39,-289.38
A	complete	4021,1
A	unitscan	Warlord Krom'zar
A	isOnQuest	4021
S	
T	xprate	<1.5
A	goto	1413/1,-1972.55,-306.95
A	turnin	4021
A	target	Regthar Deathgate
A	isQuestComplete	4021
S	
T	xprate	<1.5
A	goto	1413/1,-1972.55,-306.95
A	turnin	855
A	target	Regthar Deathgate
A	isQuestComplete	855
S	
T	xprate	<1.5
A	goto	1413/1,-1972.55,-306.95
A	turnin	4021
A	target	Regthar Deathgate
A	isQuestComplete	4021
S	
T	xprate	<1.5
A	goto	1413/1,-1972.55,-306.95
A	turnin	855
A	target	Regthar Deathgate
A	isQuestComplete	855
S	
T	optional	
T	xprate	<1.5
T	completewith	StonetalonPickups
A	complete	821,2
A	mob	Greater Plainstrider
A	mob	Fleeting Plainstrider
A	mob	Ornery Plainstrider
S	
T	xprate	<1.5
T	loop	
A	goto	1413/1,-1458.79,565.96,0
A	goto	1413/1,-1458.79,565.96,40,0
A	goto	1413/1,-1379.75,620.68,40,0
A	goto	1413/1,-1376.71,717.97,40,0
A	goto	1413/1,-1323.0,747.7,40,0
A	goto	1413/1,-1245.99,763.91,40,0
A	goto	1413/1,-1223.7,699.05,40,0
A	goto	1413/1,-1290.58,670.0,40,0
A	goto	1413/1,-1245.99,624.74,40,0
A	goto	1413/1,-1241.94,559.2,40,0
A	goto	1413/1,-1155.8,553.12,40,0
A	goto	1413/1,-1150.74,513.93,40,0
A	goto	1413/1,-1194.31,508.53,40,0
A	goto	1413/1,-1263.22,458.53,40,0
A	goto	1413/1,-1311.86,415.97,40,0
A	goto	1413/1,-1366.58,449.75,40,0
A	goto	1413/1,-1417.24,486.91,40,0
A	goto	1413/1,-1445.62,532.85,40,0
A	complete	875,1
A	mob	Witchwing Slayer
A	mob	Witchwing Ambusher
A	isOnQuest	875
S	
T	label	StonetalonPickups
T	completewith	next
A	goto	1413/1,-950.10,-271.14,30
A	zoneskip	Stonetalon Mountains
S	
T	map	Stonetalon Mountains
T	label	StonetalonPickups
A	turnin	1061
A	accept	1062
A	target	+Seereth Stonebreak
A	goto	1413/1,-950.10,-271.14
A	accept	6548
A	target	+Makaba Flathoof
A	goto	1413/1,-943.00,-265.06
A	maxlevel	20 << !Druid
S	
T	optional	
T	map	Stonetalon Mountains
T	label	StonetalonPickups
A	goto	1413/1,-950.10,-271.14
A	turnin	1061
A	accept	1062
A	target	Seereth Stonebreak
E
G	Guides/forever/Horde-12-22_Barrens.lua
M	classic	
M	tbc	
M	xprate	<1.99
M	selector	Horde
M	name	17-22 Stonetalon/Barrens/Ashenvale
M	displayname	18-22 Stonetalon/Barrens/Ashenvale << Undead/Troll Rogue/Orc Rogue/Orc Warlock/Troll Mage/Troll Priest
M	version	11
M	group	RestedXP Forever Guide (H)
M	subgroup	Speedrun Guide 1-22
M	next	RestedXP Horde 22-30\22-24 Hillsbrad
S	Druid
T	season	2
T	completewith	next
A	collect	210534,1
A	train	410021,1
S	
T	loop	
A	goto	1442/1,-691.11,-13.63,0
A	goto	1442/1,-691.11,-13.63,40,0
A	goto	1442/1,-650.58,26.74,40,0
A	goto	1442/1,-718.94,65.49,40,0
A	goto	1442/1,-743.85,101.96,40,0
A	goto	1442/1,-771.20,113.040,40,0
A	goto	1442/1,-785.36,141.69,40,0
A	goto	1442/1,-838.59,148.20,40,0
A	goto	1442/1,-865.93,142.34,40,0
A	goto	1442/1,-846.4,103.92,40,0
A	goto	1442/1,-819.54,76.24,40,0
A	goto	1442/1,-774.61,-5.17,40,0
A	goto	1442/1,-774.61,-27.96,40,0
A	goto	1442/1,-726.27,-39.36,40,0
A	complete	6548,1
A	mob	+Grimtotem Ruffian
A	complete	6548,2
A	mob	+Grimtotem Mercenary
A	isOnQuest	6548
S	Druid
T	season	2
T	loop	
A	goto	1442/1,-691.11,-13.63,0
A	goto	1442/1,-691.11,-13.63,40,0
A	goto	1442/1,-650.58,26.74,40,0
A	goto	1442/1,-718.94,65.49,40,0
A	goto	1442/1,-743.85,101.96,40,0
A	goto	1442/1,-771.20,113.040,40,0
A	goto	1442/1,-785.36,141.69,40,0
A	goto	1442/1,-838.59,148.20,40,0
A	goto	1442/1,-865.93,142.34,40,0
A	goto	1442/1,-846.4,103.92,40,0
A	goto	1442/1,-819.54,76.24,40,0
A	goto	1442/1,-774.61,-5.17,40,0
A	goto	1442/1,-774.61,-27.96,40,0
A	goto	1442/1,-726.27,-39.36,40,0
A	collect	210534,1
A	mob	Grimtotem Mercenary
A	mob	Grimtotem Brute
A	mob	Grimtotem Sorcerer
A	mob	Grimtotem Ruffian
A	train	410021,1
S	Druid
T	season	2
T	completewith	AvengeVillageTurnin
A	equip	18,210534
A	use	210534
A	itemcount	210534,1
A	train	410021,1
S	Druid
T	season	2
T	completewith	next
A	train	410021
A	itemcount	210534,1
S	
T	map	Stonetalon Mountains
A	goto	1413/1,-943.00,-265.06
A	turnin	6548
A	accept	6629
A	target	Makaba Flathoof
A	isQuestComplete	6548
S	
T	optional	
T	label	AvengeVillageTurnin
T	map	Stonetalon Mountains
A	goto	1413/1,-943.00,-265.06
A	accept	6629
A	target	Makaba Flathoof
A	isQuestTurnedIn	6548
S	
T	completewith	next
A	goto	1442/1,-460.13,67.77,30
A	isQuestTurnedIn	6548
S	
A	goto	1442/1,-350.74,112.06
A	complete	6629,1
A	mob	+Grundig Darkcloud
A	complete	6629,2
A	mob	+Grimtotem Brute
A	isQuestTurnedIn	6548
S	
A	goto	1442/1,-342.44,129.64
A	accept	6523,1
A	target	Kaya Flathoof
A	isQuestTurnedIn	6548
S	
A	goto	1442/1,-261.38,90.57,40,0
A	goto	1442/1,-261.86,-7.12,40,0
A	goto	1442/1,-501.15,-41.64
A	complete	6523,1
A	target	Kaya Flathoof
A	isQuestTurnedIn	6548
S	
A	goto	1442/1,-233.54,-177.42
A	accept	6461
A	target	Xen'Zilla
S	Priest/Mage/Warlock
T	completewith	next
A	goto	1442/1,-103.64,40.10,100,0
A	goto	1442/1,74.11,185.32,100,0
A	goto	1442/1,244.05,262.50,100,0
A	complete	6461,1
A	mob	Deepmoss Creeper
A	group	0 << Priest/Mage
S	Warlock/Priest/Mage
A	goto	1442/1,360.76,451.690
A	accept	6284
A	group	<< Priest/Mage
S	Warlock/Priest/Mage
T	completewith	Besseleth1
A	complete	6461,2
A	mob	+Deepmoss Venomspitter
A	complete	6461,1
A	mob	+Deepmoss Creeper
A	group	0 << Priest/Mage
S	Warlock/Priest/Mage
T	completewith	next
A	complete	1069,1
A	group	0 << Priest/Mage
S	Warlock/Priest/Mage
T	label	Besseleth1
T	loop	
A	goto	1442/1,569.77,573.79,0
A	goto	1442/1,711.87,513.23,50,0
A	goto	1442/1,684.04,582.91,50,0
A	goto	1442/1,569.77,573.79,50,0
A	complete	6284,1
A	unitscan	Besseleth
A	group	2 << Priest/Mage
S	Warlock/Priest/Mage
A	goto	1442/1,560.49,440.94
A	complete	6461,1
A	mob	Deepmoss Creeper
A	group	0 << Priest/Mage
S	!Warlock
A	goto	1442/1,-44.56,84.05,80,0
A	goto	1442/1,245.51,255.01,80,0
A	goto	1442/1,392.01,445.17,40,0
A	goto	1442/1,560.49,440.94
A	complete	6461,1
A	mob	Deepmoss Creeper
S	
T	completewith	next
A	goto	1442/1,735.8,925.8,50,0
A	goto	1442/1,806.12,929.05
A	subzone	460
S	
A	goto	1442/1,927.72,893.56
A	vendor	
A	vendor	
A	target	Innkeeper Jayka
A	isQuestAvailable	1093
S	
A	goto	1442/1,920.88,911.47
A	vendor	
A	vendor	
A	target	Jeeda
A	isQuestAvailable	1093
S	
A	goto	1442/1,940.9,925.14
A	turnin	6284
A	target	Maggran Earthbinder
A	isQuestComplete	6284
S	
T	label	SRRFP
A	goto	1442/1,1041.99,967.80
A	fp	Sun Rock Retreat
A	target	Tharm
A	subzoneskip	460,1
S	
T	completewith	next
A	goto	1442/1,365.16,878.250,15
S	
A	goto	1442/1,365.16,878.250
A	turnin	1483
A	accept	1093
A	target	Ziz Fizziks
S	
T	completewith	Windshear
A	complete	1069,1
S	
T	loop	
A	goto	1442/1,352.46,912.44,0
A	goto	1442/1,352.46,912.44,50,0
A	goto	1442/1,297.77,959.660,50,0
A	goto	1442/1,250.40,990.59,50,0
A	goto	1442/1,259.68,1032.93,50,0
A	goto	1442/1,246.98,1068.09,50,0
A	goto	1442/1,207.91,1010.13,50,0
A	goto	1442/1,163.47,962.27,50,0
A	goto	1442/1,86.81,961.94,50,0
A	goto	1442/1,181.05,907.89,50,0
A	goto	1442/1,193.75,867.83,50,0
A	goto	1442/1,194.73,827.78,50,0
A	goto	1442/1,225.49,765.26,50,0
A	goto	1442/1,281.16,763.63,50,0
A	goto	1442/1,268.95,832.99,50,0
A	goto	1442/1,303.63,858.39,50,0
A	complete	6461,2
A	mob	Deepmoss Venomspitter
S	Troll Warrior/Orc Warrior/Tauren Warrior
A	goto	1442/1,402.76,1231.88
A	collect	928,1,899,1
A	money	<0.9860
A	target	Veenix
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.2
S	Troll Warrior/Orc Warrior/Tauren Warrior
T	optional	
T	completewith	BluePrints
A	use	928
A	itemcount	928,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.2
A	xp	<20,1
S	Undead Warrior
A	goto	1442/1,402.76,1231.88
A	vendor	
A	money	<1.5024
A	target	Veenix
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.8
S	Undead Warrior
T	optional	
T	completewith	BluePrints
A	use	4818
A	itemcount	4818,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.8
A	xp	<19,1
S	Undead Warrior
T	optional	
T	completewith	BluePrints
A	use	922
A	itemcount	922,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.8
A	xp	<21,1
S	Shaman
T	season	0
A	goto	1442/1,402.76,1231.88
A	collect	928,1,899,1
A	money	<0.9860
A	target	Veenix
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.2
S	Shaman
T	season	0
T	optional	
T	completewith	BluePrints
A	use	928
A	itemcount	928,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.2
A	xp	<20,1
S	Shaman
T	season	2
A	goto	1442/1,402.76,1231.88
A	collect	925,1,899,1
A	money	<0.7797
A	target	Veenix
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.8
S	Shaman
T	season	2
T	optional	
T	completewith	BluePrints
A	use	925
A	itemcount	925,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.8
A	xp	<20,1
S	Rogue
A	goto	1442/1,402.76,1231.88
A	collect	923,1,899,1
A	money	<0.8743
A	target	Veenix
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.1
S	Rogue
T	optional	
T	completewith	BluePrints
A	use	923
A	itemcount	923,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.1
A	xp	<21,1
S	
T	label	Windshear
A	subzone	461
A	isOnQuest	1093
S	
T	completewith	next
A	complete	1062,1
A	mob	Venture Co. Logger
S	
T	label	BluePrints
T	loop	
A	goto	1442/1,179.10,1168.06,0
A	goto	1442/1,179.10,1168.06,100,0
A	goto	1442/1,232.82,1239.70,100,0
A	goto	1442/1,-16.23,1441.59,100,0
A	goto	1442/1,-255.52,1291.80,100,0
A	goto	1442/1,-382.48,1135.50,100,0
A	complete	1093,1
A	mob	Venture Co. Operator
S	
T	loop	
A	goto	1442/1,242.58,1121.82,0
A	goto	1442/1,242.58,1121.82,50,0
A	goto	1442/1,292.39,1122.470,50,0
A	goto	1442/1,325.6,1168.39,50,0
A	goto	1442/1,338.79,1206.48,50,0
A	goto	1442/1,276.77,1248.49,50,0
A	goto	1442/1,215.24,1145.59,50,0
A	goto	1442/1,187.40,1114.33,50,0
A	goto	1442/1,138.57,1144.62,50,0
A	goto	1442/1,51.16,1153.41,50,0
A	goto	1442/1,-17.70,1128.33,50,0
A	goto	1442/1,-106.09,1157.31,50,0
A	goto	1442/1,-165.66,1173.60,50,0
A	goto	1442/1,-189.10,1079.82,50,0
A	goto	1442/1,-69.95,1061.91,50,0
A	goto	1442/1,10.63,1072.33,50,0
A	goto	1442/1,57.51,1056.05,50,0
A	goto	1442/1,107.32,1040.09,50,0
A	complete	1062,1
A	mob	Venture Co. Logger
S	
T	loop	
A	goto	1442/1,246.98,1068.09,0
A	goto	1442/1,352.46,912.44,30,0
A	goto	1442/1,297.77,959.660,30,0
A	goto	1442/1,250.40,990.59,30,0
A	goto	1442/1,259.68,1032.93,30,0
A	goto	1442/1,246.98,1068.09,30,0
A	goto	1442/1,207.91,1010.13,30,0
A	goto	1442/1,163.47,962.27,30,0
A	goto	1442/1,86.81,961.94,30,0
A	goto	1442/1,181.05,907.89,30,0
A	goto	1442/1,193.75,867.83,30,0
A	goto	1442/1,194.73,827.78,30,0
A	goto	1442/1,225.49,765.26,30,0
A	goto	1442/1,281.16,763.63,30,0
A	goto	1442/1,268.95,832.99,30,0
A	goto	1442/1,303.63,858.39,30,0
A	complete	1069,1
S	
T	optional	
T	completewith	next
S	
A	goto	1442/1,365.16,878.250
A	turnin	1093
A	accept	1094
A	target	Ziz Fizziks
S	
T	loop	
A	goto	1442/1,362.71,539.28,0
A	goto	1442/1,275.30,577.38,80,0
A	goto	1442/1,362.71,539.28,80,0
A	goto	1442/1,298.25,432.80,80,0
A	goto	1442/1,244.05,262.50,80,0
A	goto	1442/1,74.11,185.32,80,0
A	goto	1442/1,-103.64,40.10,80,0
A	goto	1442/1,362.71,539.28,80,0
A	complete	6461,1
A	mob	Deepmoss Creeper
S	Druid
T	completewith	DruidTraining2
A	cast	18960
A	zoneskip	Moonglade
S	Druid
A	goto	1450/1,-2593.82,7866.90
A	train	1430
A	target	Loganaar
A	xp	<18,1
A	xp	>20,1
S	Druid
T	label	DruidTraining2
A	goto	1450/1,-2593.82,7866.90
A	train	768
A	target	Loganaar
A	xp	<20,1
S	
T	completewith	JornSkyseerTurnin
A	hs	
A	use	6948
A	bindlocation	378,1
A	subzoneskip	378
S	
A	goto	1413/1,-1995.86,-2375.71
A	vendor	
A	vendor	
A	target	Innkeeper Byula
A	isOnQuest	3261
S	
T	label	JornSkyseerTurnin
A	goto	1413/1,-1921.88,-2383.15
A	turnin	3261
A	accept	882
A	target	Jorn Skyseer
S	
T	completewith	LakotaMani2
A	complete	821,3
A	mob	Stormsnout
S	
T	completewith	next
A	complete	878,1
A	mob	+Bristleback Water Seeker
A	complete	878,2
A	mob	+Bristleback Thornweaver
A	complete	878,3
A	mob	+Bristleback Geomancer
A	complete	899,1
A	mob	+Bristleback Water Seeker
A	mob	+Bristleback Thornweaver
A	mob	+Bristleback Geomancer
S	
T	label	LakotaMani2
T	loop	
A	goto	1413/1,-1951.27,-1956.15,0
A	goto	1413/1,-2031.32,-1703.47,0
A	goto	1413/1,-2183.32,-1858.19,0
A	goto	1413/1,-2453.88,-1991.28,0
A	goto	1413/1,-1951.27,-1956.15,80,0
A	goto	1413/1,-2031.32,-1703.47,80,0
A	goto	1413/1,-2183.32,-1858.19,80,0
A	goto	1413/1,-2453.88,-1991.28,80,0
A	collect	5099,1,883
A	accept	883
A	use	5099
A	unitscan	Lakota'mani
S	
T	completewith	next
A	complete	821,3
A	mob	Stormsnout
S	
T	loop	
A	goto	1413/1,-2515.7,-2076.41,0
A	goto	1413/1,-2515.7,-2076.41,60,0
A	goto	1413/1,-2518.74,-2125.73,60,0
A	goto	1413/1,-2517.72,-2223.7,60,0
A	goto	1413/1,-2486.31,-2254.1,60,0
A	goto	1413/1,-2494.42,-2282.48,60,0
A	goto	1413/1,-2531.91,-2272.34,60,0
A	goto	1413/1,-2571.43,-2295.31,60,0
A	goto	1413/1,-2620.07,-2285.18,60,0
A	goto	1413/1,-2625.14,-2245.32,60,0
A	goto	1413/1,-2755.86,-2082.49,60,0
A	goto	1413/1,-2813.62,-2054.12,60,0
A	goto	1413/1,-2811.59,-2004.12,60,0
A	goto	1413/1,-2783.22,-1949.39,60,0
A	goto	1413/1,-2747.75,-1889.26,60,0
A	goto	1413/1,-2709.24,-1913.59,60,0
A	goto	1413/1,-2706.2,-1948.72,60,0
A	goto	1413/1,-2687.96,-1973.04,60,0
A	goto	1413/1,-2678.84,-2016.28,60,0
A	goto	1413/1,-2584.6,-2050.74,60,0
A	complete	878,1
A	mob	+Bristleback Water Seeker
A	complete	878,2
A	mob	+Bristleback Thornweaver
A	complete	878,3
A	mob	+Bristleback Geomancer
A	complete	899,1
A	mob	+Bristleback Water Seeker
A	mob	+Bristleback Thornweaver
A	mob	+Bristleback Geomancer
S	Warlock/Shaman
T	loop	
A	goto	1413/1,-2515.7,-2076.41,60,0
A	goto	1413/1,-2518.74,-2125.73,60,0
A	goto	1413/1,-2517.72,-2223.7,60,0
A	goto	1413/1,-2486.31,-2254.1,60,0
A	goto	1413/1,-2494.42,-2282.48,60,0
A	goto	1413/1,-2531.91,-2272.34,60,0
A	goto	1413/1,-2571.43,-2295.31,60,0
A	goto	1413/1,-2620.07,-2285.18,60,0
A	goto	1413/1,-2625.14,-2245.32,60,0
A	goto	1413/1,-2755.86,-2082.49,60,0
A	goto	1413/1,-2813.62,-2054.12,60,0
A	goto	1413/1,-2811.59,-2004.12,60,0
A	goto	1413/1,-2783.22,-1949.39,60,0
A	goto	1413/1,-2747.75,-1889.26,60,0
A	goto	1413/1,-2709.24,-1913.59,60,0
A	goto	1413/1,-2706.2,-1948.72,60,0
A	goto	1413/1,-2687.96,-1973.04,60,0
A	goto	1413/1,-2678.84,-2016.28,60,0
A	goto	1413/1,-2584.6,-2050.74,60,0
A	xp	19+11000
S	
T	loop	
A	goto	1413/1,-2532.92,-1965.61,0
A	goto	1413/1,-2532.92,-1965.61,50,0
A	goto	1413/1,-2449.83,-1953.45,50,0
A	goto	1413/1,-2377.88,-2018.31,50,0
A	goto	1413/1,-2397.14,-2108.84,50,0
A	goto	1413/1,-2345.46,-2187.21,50,0
A	goto	1413/1,-2415.38,-2179.78,50,0
A	complete	821,3
A	mob	Stormsnout
S	
T	completewith	next
A	complete	865,1
A	mob	Sunscale Scytheclaw
S	
T	loop	
A	goto	1413/1,-2847.06,-1879.13,0
A	goto	1413/1,-2847.06,-1879.13,50,0
A	goto	1413/1,-2859.22,-1804.81,50,0
A	goto	1413/1,-2833.88,-1749.41,50,0
A	goto	1413/1,-2881.51,-1723.74,50,0
A	goto	1413/1,-2932.18,-1698.06.0,50,0
A	goto	1413/1,-2973.72,-1627.8,50,0
A	complete	821,2
A	mob	Greater Plainstrider
S	
T	loop	
A	goto	1413/1,-3183.48,-2015.61,0
A	goto	1413/1,-2646.42,-1529.16,0
A	goto	1413/1,-3183.48,-2015.61,90,0
A	goto	1413/1,-2646.42,-1529.16,90,0
A	complete	865,1
A	mob	Sunscale Scytheclaw
S	
T	completewith	next
A	collect	10338,1
A	mob	Zhevra Charger
S	
T	loop	
A	goto	1413/1,-3010.20,-1319.04,0
A	goto	1413/1,-3010.20,-1319.04,40,0
A	goto	1413/1,-2959.54,-1292.69,40,0
A	goto	1413/1,-2953.46,-1239.31,40,0
A	goto	1413/1,-2998.04,-1192.02,40,0
A	goto	1413/1,-3050.74,-1225.13,40,0
A	goto	1413/1,-3066.95,-1260.93,40,0
A	goto	1413/1,-3052.76,-1319.710,40,0
A	complete	880,1
A	mob	Oasis Snapjaw
S	Shaman/Priest
T	season	2
T	loop	
A	goto	1413/1,-3028.44,-685.30,40,0
A	goto	1413/1,-3034.52,-698.81,40,0
A	goto	1413/1,-2931.16,-816.37,40,0
A	goto	1413/1,-2946.36,-800.83,40,0
A	goto	1413/1,-3200.71,-821.78,40,0
A	goto	1413/1,-3209.83,-804.89,40,0
A	goto	1413/1,-3199.70,-799.480,40,0
A	goto	1413/1,-3212.87,-979.20,40,0
A	goto	1413/1,-3202.74,-998.79,40,0
A	goto	1413/1,-3337.51,-932.58,40,0
A	goto	1413/1,-3347.64,-923.12,40,0
A	goto	1413/1,-3349.67,-936.63,40,0
A	collect	208758,1 << Shaman
A	collect	205932,1 << Priest
A	unitscan	Desert Mirage
A	train	410107,1 << Shaman
A	train	402849,1 << Priest
A	train	370,3 << Shaman
A	train	527,3 << Priest
S	
T	completewith	next
A	collect	10338,1
A	mob	Zhevra Charger
S	
T	label	IshamuhalesFang
A	goto	1413/1,-3427.70,-436.67
A	use	10338
A	complete	882,1
A	mob	Ishamuhale
S	
T	completewith	BootyTurnin
A	subzone	392
S	Rogue
A	goto	1413/1,-3768.18,-840.69
A	turnin	2381
A	target	Wrenix the Wretched
S	
T	label	BootyTurnin
A	goto	1413/1,-3728.66,-835.29
A	turnin	888
A	target	Gazlowe
S	
T	sticky	
T	completewith	FlytoXroads
T	season	2
A	goto	1413/1,-3639.48,-1049.46
A	use	210822 << Priest
A	use	210820 << Paladin
A	use	210654 << Mage
A	use	210818 << Hunter
A	use	210817 << Druid
A	use	210825 << Warrior
A	use	210824 << Warlock
A	use	210653 << Rogue
A	use	210823 << Shaman
A	train	415995
A	train	410010
A	train	401761
A	train	410122
A	train	416042
A	train	425445
A	train	425476
A	train	424990
A	train	410096
A	target	Grizzby
A	train	415995,1 << Priest
A	train	410010,1 << Paladin
A	train	401761,1 << Mage
A	train	410122,1 << Hunter
A	train	416042,1 << Druid
A	train	425445,1 << Warrior
A	train	425476,1 << Warlock
A	train	424990,1 << Rogue
A	train	410096,1 << Shaman
A	money	<3.0
S	
A	turnin	1094
A	accept	1095
A	target	+Sputtervalve
A	goto	1413/1,-3759.06,-902.18
A	turnin	865
A	turnin	1069
A	accept	1491
A	target	+Mebok Mizzyrix
A	goto	1413/1,-3697.24,-929.20
A	turnin	821
A	target	+Brewmaster Drohn
A	goto	1413/1,-3687.11,-981.22
A	dungeon	WC
S	
A	turnin	1094
A	accept	1095
A	target	+Sputtervalve
A	goto	1413/1,-3759.06,-902.18
A	turnin	865
A	turnin	1069
A	target	+Mebok Mizzyrix
A	goto	1413/1,-3697.24,-929.20
A	turnin	821
A	target	+Brewmaster Drohn
A	goto	1413/1,-3687.11,-981.22
S	Warrior
A	goto	1413/1,-3680.02,-982.58
A	vendor	
A	target	Grazlix
A	money	<0.619
A	itemStat	7,ITEM_MOD_ARMOR_SHORT,<155
A	equip	7,4800
A	isQuestTurnedIn	865
S	Rogue/Hunter/Warrior/Shaman/Druid
A	goto	1413/1,-3675.96,-985.28
A	vendor	
A	target	Vexspindle
A	money	<0.3515
A	itemStat	9,ITEM_MOD_ARMOR_SHORT,<37
A	equip	9,4794
A	isQuestTurnedIn	865
S	Warrior
T	optional	
T	completewith	FlytoXroads
A	use	4800
A	itemcount	4800,1
A	itemStat	7,ITEM_MOD_ARMOR_SHORT,<155
A	isQuestTurnedIn	865
A	equip	7,4800
S	Rogue/Hunter/Warrior/Shaman/Druid
T	optional	
T	completewith	FlytoXroads
A	use	4794
A	itemcount	4794,1
A	itemStat	9,ITEM_MOD_ARMOR_SHORT,<37
A	isQuestTurnedIn	865
A	xp	<20,1
A	equip	9,4794
S	
A	goto	1413/1,-3664.82,-1050.14
A	home	
A	target	Innkeeper Wiley
A	dungeon	WC
A	bindlocation	392
A	isQuestTurnedIn	865
S	
A	goto	1413/1,-3770.20,-928.53
A	accept	959
A	target	Crane Operator Bigglefuzz
A	dungeon	WC
S	
T	label	FlytoXroads
T	completewith	XroadsHS2
A	goto	1413/1,-3770.20,-898.12
A	fly	Crossroads
A	target	Bragok
A	subzoneskip	380
S	Hunter
A	goto	1413/1,-2595.75,-473.15
A	accept	6541
A	target	Thork
S	
T	xprate	<1.5
A	goto	1413/1,-2607.91,-475.180
A	turnin	875
A	accept	876
A	target	Darsok Swiftdagger
A	isQuestComplete	875
S	
T	xprate	<1.5
A	goto	1413/1,-2607.91,-475.180
A	accept	876
A	target	Darsok Swiftdagger
A	isQuestTurnedIn	875
S	
T	label	XroadsHS2
A	turnin	899
A	target	+Mankrik
A	goto	1413/1,-2641.35,-521.12
A	turnin	880
A	accept	1489
A	accept	3301
A	target	+Tonga Runetotem
A	goto	1413/1,-2672.76,-544.77
S	
A	destroy	5085
A	itemcount	5085,1
S	
A	goto	1413/1,-2645.40,-406.94
A	home	
A	vendor	
A	vendor	
A	target	Innkeeper Boorand Plainswind
A	dungeon	!WC
A	dungeon	DM
S	
A	goto	1413/1,-2555.22,-387.350
A	accept	868
A	target	Korran
S	Shaman
T	completewith	next
A	goto	1413/1,-2595.75,-437.35
A	fly	Orgrimmar
A	zoneskip	Orgrimmar
A	target	Devrak
S	Shaman
A	goto	1454/1,-4213.03,1920.94
A	accept	1528
A	target	Searn Firewarder
S	Shaman
A	goto	1454/1,-4225.09,1933.29
A	train	2645
A	target	Kardris Dreamseeker
S	Warlock
T	completewith	next
A	goto	1413/1,-2595.75,-437.35
A	fly	Orgrimmar
A	zoneskip	Orgrimmar
A	target	Devrak
S	Warlock
A	goto	1454/1,-4357.36,1850.41
A	trainer	
A	accept	1507
A	target	Gan'rul Bloodeye
S	Warlock
A	goto	1454/1,-4347.4,1836.57
A	collect	16346,1,1507,1
A	target	Kurgul
S	Warlock
A	goto	1454/1,-4340.53,1839.19
A	turnin	1507
A	accept	1508
A	target	Cazul
S	Warlock
A	goto	1454/1,-4299.99,1820.67
A	collect	5210,1,1507,1
A	money	<0.5808
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<17.4
A	target	Katis
S	Warlock
A	goto	1454/1,-4199.99,1717.49
A	turnin	1508
A	accept	1509
A	target	Zankaja
S	
T	completewith	EnterDM
A	subzone	1581
A	dungeon	DM
S	
T	completewith	ZepptoSTVforDM
A	fly	Orgrimmar
A	zoneskip	Orgrimmar
A	target	Devrak
A	dungeon	DM
S	Shaman
A	goto	1454/1,-4225.09,1933.29
A	train	8052
A	target	Kardris Dreamseeker
A	xp	<18,1
A	xp	>20,1
A	dungeon	DM
S	Shaman
T	optional	
A	goto	1454/1,-4225.09,1933.29
A	train	2645
A	target	Kardris Dreamseeker
A	xp	<20,1
A	dungeon	DM
S	Hunter
A	goto	1454/1,-4607.02,2100.64
A	train	14318
A	target	Ormak Grimshot
A	xp	<18,1
A	xp	>20,1
A	dungeon	DM
S	Hunter
T	optional	
A	goto	1454/1,-4607.02,2100.64
A	train	14290
A	target	Ormak Grimshot
A	xp	<20,1
A	dungeon	DM
S	Hunter
A	goto	1454/1,-4610.95,2135.15
A	train	5118
A	target	Xao'tsu
A	xp	<20,1
A	dungeon	DM
S	Warrior
A	goto	1454/1,-4801.42,1980.53
A	train	8198
A	target	Grezz Ragefist
A	xp	<18,1
A	xp	>20,1
A	dungeon	DM
S	Warrior
T	optional	
A	goto	1454/1,-4801.42,1980.53
A	train	845
A	target	Grezz Ragefist
A	xp	<20,1
A	dungeon	DM
S	Rogue
A	goto	1454/1,-4296.34,1762.67
A	train	1943
A	target	Ormok
A	xp	<20,1
A	dungeon	DM
S	Warlock
A	goto	1458/0,408.18,1587.21
A	train	1014
A	target	Zevrost
A	xp	<18,1
A	xp	>20,1
A	dungeon	DM
S	Warlock
T	optional	
A	goto	1458/0,408.18,1587.21
A	train	706
A	target	Zevrost
A	xp	<20,1
A	dungeon	DM
S	Mage
A	goto	1454/1,-4218.64,1473.72
A	train	3140
A	target	Pephredo
A	xp	<18,1
A	xp	>20,1
A	dungeon	DM
S	Mage
T	optional	
A	goto	1454/1,-4218.64,1473.72
A	train	1953
A	target	Pephredo
A	xp	<20,1
A	dungeon	DM
S	Priest
A	goto	1454/1,-4179.79,1452.580
A	train	970
A	target	Ur'kyo
A	xp	<18,1
A	xp	>20,1
A	dungeon	DM
S	Priest
T	optional	
A	goto	1454/1,-4179.79,1452.580
A	train	14914
A	target	Ur'kyo
A	xp	<20,1
A	dungeon	DM
S	
T	ah	
A	goto	1454/1,-4460.31,1685.31
A	collect	814,5,103,1
A	target	Auctioneer Thathung
A	dungeon	DM
S	
T	completewith	next
A	zone	Durotar
A	zoneskip	Durotar
A	dungeon	DM
S	
T	label	ZepptoSTVforDM
A	goto	1411/1,-4648.55,1321.88,40
A	zone	Stranglethorn Vale
A	zoneskip	Stranglethorn Vale
A	dungeon	DM
S	
A	goto	1434/0,273.91,-12406.71,40,0
A	goto	1434/0,492.15,-12499.03,40,0
A	goto	1434/0,759.53,-12494.77,60,0
A	goto	1434/0,1004.57,-12317.37.0,60,0
A	goto	1434/0,1178.78,-12166.78,60,0
A	goto	1434/0,1360.0,-11978.74,60,0
A	goto	1436/0,1578.87,-11699.5,60,0
A	goto	1436/0,1718.17,-11480.4,40,0
A	goto	1436/0,1966.32,-11407.13,200
A	dungeon	DM
S	
T	completewith	next
A	goto	1436/0,1966.32,-11407.13,40
A	dungeon	DM
S	
A	goto	1436/0,1966.32,-11407.13
A	accept	103
A	target	Captain Grayson
A	itemcount	814,5
A	dungeon	DM
S	
A	goto	1436/0,1966.32,-11407.13
A	turnin	103
A	itemcount	814,5
A	target	Captain Grayson
A	dungeon	DM
S	
A	goto	1436/0,1966.32,-11407.13
A	accept	104
A	target	Captain Grayson
A	dungeon	DM
S	
A	goto	1436/0,1811.62,-11358.37
A	line	Westfall,34.43,83.93,34.43,83.93,33.88,83.32,33.08,82.86,32.56,82.71,32.08,82.49,31.91,82.36,31.55,81.88,30.86,81.42,30.63,81.16,30.33,80.81,30.02,80.11,29.68,79.22,29.32,78.19,29.29,77.60,29.27,77.31,29.18,76.26,29.07,75.29,28.95,74.14,28.85,73.29,28.79,72.48,28.37,71.94,27.84,71.29,27.44,70.25,27.29,69.47,27.13,68.65,27.09,67.57,27.07,67.01,26.74,66.09,27.07,67.01,27.09,67.57,27.13,68.65,27.29,69.47,27.44,70.25,27.84,71.29,28.37,71.94,28.79,72.48,28.85,73.29,28.95,74.14,29.07,75.29,29.18,76.26,29.27,77.31,29.29,77.60,29.32,78.19,29.68,79.22,30.02,80.11,30.33,80.81,30.63,81.16,30.86,81.42,31.55,81.88,31.91,82.36,32.08,82.49,32.56,82.71,33.08,82.86,33.88,83.32,34.43,83.93
A	complete	104,1
A	unitscan	Old Murk-Eye
A	dungeon	DM
S	
A	goto	1436/0,1966.32,-11407.13
A	turnin	104
A	target	Captain Grayson
A	dungeon	DM
S	
T	optional	
A	abandon	103
A	dungeon	DM
S	
T	label	EnterDM
A	goto	1415/0,1596.2,-11768.97,8,0
A	goto	1415/0,1596.2,-11780.71,8,0
A	goto	1415/0,1606.76,-11797.13,8,0
A	goto	1415/0,1582.12,-11799.48,8,0
A	goto	1415/0,1596.2,-11813.56,15,0
A	goto	1415/0,1631.4,-11846.41,15,0
A	goto	1415/0,1649.0,-11898.04,15,0
A	goto	1415/0,1659.56,-11919.16,15,0
A	goto	1415/0,1698.28,-11891.0,15,0
A	goto	1415/0,1744.04,-11881.61
A	zone	291
A	dungeon	DM
S	
A	hs	
A	zone	The Barrens
A	use	6948
A	dungeon	DM
S	
T	optional	
A	goto	1413/1,-3664.82,-1050.14
A	vendor	
A	vendor	
A	target	Innkeeper Wiley
A	subzoneskip	392,1
A	dungeon	WC
S	
T	optional	
A	goto	1413/1,-2645.40,-406.94
A	vendor	
A	vendor	
A	target	Innkeeper Boorand Plainswind
A	subzoneskip	380,1
A	dungeon	DM
S	Warlock
T	completewith	TurninDogran
A	goto	1413/1,-3770.20,-898.12
A	fly	Crossroads
A	target	Bragok
A	subzoneskip	392,1
A	dungeon	WC
S	Warlock
T	completewith	TurninDogran
A	goto	1454/1,-4313.60,1676.24
A	fly	Crossroads
A	zoneskip	Orgrimmar,1
A	target	Doras
S	Warlock
T	label	TurninDogran
A	goto	1413/1,-2639.32,-436.00
A	turnin	1509
A	accept	1510
A	target	Gazrog
S	Shaman
T	completewith	CallofWater01
A	goto	1454/1,-4313.60,1676.24
A	fly	Ratchet
A	target	Doras
A	zoneskip	Orgrimmar,1
S	Shaman
T	label	CallofWater01
A	goto	1413/1,-4047.86,-1345.39
A	turnin	1528
A	accept	1530
A	target	Islen Waterseer
S	!Warlock !Shaman
T	completewith	next
A	goto	1413/1,-3770.20,-898.12
A	fly	Crossroads
A	target	Bragok
A	subzoneskip	392,1
A	dungeon	WC
S	Shaman
T	completewith	next
A	goto	1413/1,-3770.20,-898.12
A	fly	Crossroads
A	target	Bragok
A	subzoneskip	380
S	
A	goto	1413/1,-2589.67,-424.51
A	accept	853
A	target	Apothecary Helbrim
A	isQuestTurnedIn	848
A	isQuestAvailable	853
S	
T	sticky	
T	completewith	ZamahTurnin
A	isOnQuest	853
S	!Warlock !Shaman
T	completewith	TribesTurnin
A	goto	1413/1,-3770.20,-898.12
A	fly	Camp Taurajo
A	target	Bragok
A	subzoneskip	392,1
A	dungeon	WC
S	Shaman
T	completewith	TribesTurnin
A	goto	1413/1,-3770.20,-898.12
A	fly	Camp Taurajo
A	target	Bragok
A	subzoneskip	380
S	
T	completewith	TribesTurnin
A	goto	1413/1,-2595.75,-437.35
A	fly	Camp Taurajo
A	target	Devrak
A	subzoneskip	380,1
S	
A	goto	1413/1,-1891.48,-2391.93
A	collect	5075,1,5052,1
A	mob	Bristleback Water Seeker
A	mob	Bristleback Thornweaver
A	mob	Bristleback Geomancer
S	
T	label	TribesTurnin
A	goto	1413/1,-1891.48,-2391.93
A	turnin	878
A	accept	5052
A	turnin	5052
A	target	Mangletooth
S	
T	completewith	IshamuhaleTurnin
A	goto	1413/1,-1891.48,-2391.93,0
A	target	Mangletooth
S	
A	goto	1413/1,-1921.88,-2383.15
A	turnin	882
A	accept	907
A	turnin	883
A	target	Jorn Skyseer
A	isOnQuest	883
S	
T	label	IshamuhaleTurnin
A	goto	1413/1,-1921.88,-2383.15
A	turnin	882
A	accept	907
A	target	Jorn Skyseer
S	
T	completewith	next
A	goto	1413/1,-1899.59,-2624.34,0
A	goto	1413/1,-2016.12,-2650.02,0
A	goto	1413/1,-2400.18,-2398.01,0
A	goto	1413/1,-2363.70,-2537.19,0
A	goto	1413/1,-1899.59,-2624.34,80,0
A	goto	1413/1,-2016.12,-2650.02,80,0
A	goto	1413/1,-2363.70,-2537.19,80,0
A	goto	1413/1,-2400.18,-2398.01,80,0
A	collect	5102,1,884,1
A	accept	884
A	use	5102
A	unitscan	Owatanka
S	
T	loop	
A	goto	1413/1,-1868.18,-2498.00,0
A	goto	1413/1,-1868.18,-2498.00,60,0
A	goto	1413/1,-1861.08,-2561.51,60,0
A	goto	1413/1,-1842.84,-2618.94,60,0
A	goto	1413/1,-1888.44,-2650.690,60,0
A	goto	1413/1,-2004.98,-2683.80,60,0
A	goto	1413/1,-2133.67,-2590.56,60,0
A	goto	1413/1,-2182.31,-2479.76,60,0
A	goto	1413/1,-2232.98,-2478.41,60,0
A	goto	1413/1,-2273.51,-2456.79,60,0
A	goto	1413/1,-2356.60,-2513.54,60,0
A	goto	1413/1,-2428.55,-2517.60,60,0
A	goto	1413/1,-2406.26,-2424.36,60,0
A	goto	1413/1,-2363.70,-2395.98,60,0
A	goto	1413/1,-2253.24,-2345.99,60,0
A	complete	907,1
A	mob	Thunderhead
A	mob	Stormsnout
S	
A	goto	1413/1,-1921.88,-2383.15
A	turnin	884
A	turnin	907
A	accept	913
A	target	Jorn Skyseer
A	isOnQuest	884
S	
T	label	Thunderhawk
A	goto	1413/1,-1921.88,-2383.15
A	turnin	907
A	accept	913
A	target	Jorn Skyseer
S	Shaman
T	completewith	CallofWater2
A	goto	1413/1,-1899.59,-2624.34,0
A	goto	1413/1,-2016.12,-2650.02,0
A	goto	1413/1,-2400.18,-2398.01,0
A	goto	1413/1,-2363.70,-2537.19,0
A	goto	1413/1,-1899.59,-2624.34,80,0
A	goto	1413/1,-2016.12,-2650.02,80,0
A	goto	1413/1,-2363.70,-2537.19,80,0
A	goto	1413/1,-2400.18,-2398.01,80,0
A	collect	5102,1,884,1
A	accept	884
A	use	5102
A	unitscan	Owatanka
S	Shaman
T	completewith	CallofWater2
A	goto	1413/1,-1776.98,-3617.51,60
S	Shaman
T	completewith	next
A	complete	913,1
A	mob	Thunderhawk Hatchling
A	mob	Thunderhawk Cloudscraper
A	mob	Greater Thunderhawk
S	Shaman
T	label	CallofWater2
A	goto	1413/1,-1776.98,-3617.51
A	turnin	1530
A	accept	1535
A	target	Brine
S	Shaman
A	goto	1413/1,-1858.04,-3572.92
A	use	7766
A	complete	1535,1
S	Shaman
A	goto	1413/1,-1776.98,-3617.51
A	turnin	1535
A	accept	1536
A	target	Brine
S	Shaman
T	completewith	ThunderhawkTurnin
A	subzone	378
S	
T	completewith	next
A	goto	1413/1,-1899.59,-2624.34,0
A	goto	1413/1,-2016.12,-2650.02,0
A	goto	1413/1,-2400.18,-2398.01,0
A	goto	1413/1,-2363.70,-2537.19,0
A	goto	1413/1,-1899.59,-2624.34,80,0
A	goto	1413/1,-2016.12,-2650.02,80,0
A	goto	1413/1,-2363.70,-2537.19,80,0
A	goto	1413/1,-2400.18,-2398.01,80,0
A	collect	5102,1,884,1
A	accept	884
A	use	5102
A	unitscan	Owatanka
S	
T	loop	
A	goto	1413/1,-1919.86,-2652.04,0
A	goto	1413/1,-1919.86,-2652.04,60,0
A	goto	1413/1,-2096.18,-2531.11,60,0
A	goto	1413/1,-2341.4,-2352.74,60,0
A	goto	1413/1,-1982.68,-2217.62,60,0
A	goto	1413/1,-1775.96,-2235.86,60,0
A	complete	913,1
A	mob	Thunderhawk Hatchling
A	mob	Thunderhawk Cloudscraper
S	
A	goto	1413/1,-1921.88,-2383.15
A	turnin	884
A	turnin	913
A	accept	874
A	accept	6382
A	target	Jorn Skyseer
A	isOnQuest	884
S	
T	label	ThunderhawkTurnin
A	goto	1413/1,-1921.88,-2383.15
A	turnin	913
A	accept	874
A	accept	6382
A	target	Jorn Skyseer
S	!Tauren !Shaman !Warrior/Undead
A	goto	1413/1,-1891.48,-2391.93
A	aura	16618
A	itemcount	5075,10
A	target	Mangletooth
S	!Tauren !Shaman !Warrior/Undead
T	completewith	next
A	goto	1412/1,-1480.52,-2339.56,120,0
A	zone	Mulgore
S	!Tauren !Shaman !Warrior/Undead
T	completewith	DeathDUPpickup
A	goto	1456/1,184.96,-1308.69
A	zone	Thunder Bluff
S	Tauren/Shaman/Orc Warrior/Troll Warrior
T	completewith	DeathDUPpickup
A	goto	1413/1,-1881.35,-2384.50
A	fly	Thunder Bluff
A	target	Omusa Thunderhorn
A	zoneskip	Thunder Bluff
S	Undead Warrior/Orc Warrior/Troll Warrior
A	goto	1456/1,89.46,-1286.50
A	train	199
A	train	227
A	target	Ansekhwa
S	Troll Hunter/Orc Hunter/Undead Warrior/Warlock/Priest
A	goto	1456/1,89.46,-1286.50
A	train	227
A	target	Ansekhwa
S	Rogue
A	goto	1456/1,89.46,-1286.50
A	train	198
A	target	Ansekhwa
S	Rogue
A	goto	1456/1,110.13,-1299.65
A	collect	3137,200,6562,1
A	target	Kuruk
S	
A	goto	1456/1,24.85,-1252.75
A	bankdeposit	5075
A	bankdeposit	5059
A	target	Chesmu
A	isOnQuest	868
S	
T	optional	
A	goto	1456/1,24.85,-1252.75
A	bankdeposit	5075
A	target	Chesmu
S	
A	goto	1456/1,38.32,-1300.48
A	home	
A	target	Innkeeper Pala
A	bindlocation	1638
A	isQuestAvailable	6442
A	dungeon	!WC
S	
T	completewith	next
A	goto	1456/1,222.96,-1079.42,40,0
A	goto	1456/1,219.09,-1051.44,10
S	
T	sticky	
T	completewith	DeathDUPpickup
A	goto	1456/1,218.68,-1028.41
A	accept	264
A	target	Clarice Foster
S	
A	goto	1456/1,278.48,-995.29
A	turnin	853
A	accept	962
A	target	Apothecary Zamah
A	isOnQuest	853
A	dungeon	WC
S	
T	optional	
A	goto	1456/1,278.48,-995.29
A	accept	962
A	target	Apothecary Zamah
A	dungeon	WC
S	
T	optional	
T	label	ZamahTurnin
A	goto	1456/1,278.48,-995.29
A	turnin	853
A	target	Apothecary Zamah
A	isOnQuest	853
S	Priest
A	goto	1456/1,252.49,-956.04
A	accept	5644
A	accept	5642
A	trainer	
A	target	Miles Welsh
S	Mage
A	goto	1456/1,279.32,-950.76
A	train	12051
A	target	Archmage Shymm
A	xp	<20,1
A	xp	>22,1
S	Mage
T	optional	
A	goto	1456/1,279.32,-950.76
A	train	2138
A	target	Archmage Shymm
A	xp	<22,1
S	
T	optional	
T	label	DeathDUPpickup
S	Shaman
A	goto	1456/1,269.92,-980.40
A	train	2645
A	target	Tigor Skychaser
A	xp	<20,1
A	xp	>22,1
S	Shaman
T	optional	
A	goto	1456/1,269.92,-980.40
A	train	8498
A	target	Tigor Skychaser
A	xp	<22,1
S	
T	completewith	next
A	skill	firstaid,80
A	skill	firstaid,<1,1
S	
A	goto	1456/1,206.88,-997.45
A	train	3277
A	train	7934
A	target	Pand Stonebinder
A	skill	firstaid,<1,1
S	Rogue
A	collect	6452,1
A	itemcount	1475,1
S	
T	completewith	next
A	goto	1456/1,-212.71,-1065.010,80
S	
A	goto	1456/1,-303.83,-1048.66
A	turnin	1489
A	accept	1490
A	target	Arch Druid Hamuul Runetotem
S	
A	goto	1456/1,-272.93,-1069.67
A	turnin	1490
A	accept	914
A	target	Nara Wildmane
A	dungeon	WC
S	
A	goto	1456/1,-272.93,-1069.67
A	turnin	1490
A	target	Nara Wildmane
S	Druid
A	goto	1456/1,-281.59,-1039.61
A	trainer	
A	accept	27
A	target	Turak Runetotem
S	Druid
T	completewith	next
A	cast	18960
A	zoneskip	Moonglade
S	Druid
A	goto	1450/1,-2678.76,8019.94
A	turnin	27
A	accept	28
A	target	Dendrite Starblaze
S	Druid
T	completewith	next
A	goto	1450/1,-2634.67,7634.43
A	collect	15877,1,28,1
S	Druid
A	goto	1450/1,-2221.48,7844.89
A	cast	19719
A	complete	28,1
A	use	15877
S	Druid
A	goto	1450/1,-2224.25,7874.290
A	turnin	28
A	accept	30
A	target	Tajarri
S	Druid
A	hs	
A	use	6948
A	cooldown	item,6948,>0
A	bindlocation	1638,1
A	zoneskip	Thunder Bluff
A	dungeon	!WC
S	Druid
T	completewith	next
A	goto	1450/1,-2403.61,7785.31
A	fly	Thunder Bluff
A	target	Bunthen Plainswind
A	zoneskip	Thunder Bluff
A	dungeon	WC
S	Druid
T	completewith	next
A	goto	1450/1,-2403.61,7785.31
A	fly	Thunder Bluff
A	target	Bunthen Plainswind
A	zoneskip	Thunder Bluff
A	cooldown	item,6948,<0
A	dungeon	!WC
S	Hunter
T	completewith	HunterTraining2
A	goto	1456/1,-123.26,-1394.49,60
S	Hunter
A	goto	1456/1,-100.50,-1454.75
A	train	5118
A	target	Urek Thunderhorn
A	xp	<20,1
A	xp	>22,1
S	Hunter
T	label	HunterTraining2
T	optional	
A	goto	1456/1,-100.50,-1454.75
A	train	5118
A	target	Urek Thunderhorn
A	xp	<22,1
S	Hunter
A	goto	1456/1,-47.69,-1434.64
A	train	24494
A	target	Hesuwa Thunderhorn
S	Warrior
T	completewith	next
A	goto	1456/1,-123.26,-1394.49,60
S	Warrior
A	goto	1456/1,-81.09,-1457.74
A	train	845
A	accept	1823
A	target	Torm Ragetotem
S	Rogue
A	goto	1456/1,-36.52,-1244.05
A	collect	923,1,493,1
A	money	<0.8743
A	target	Kard Ragetotem
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.1
S	Rogue
T	optional	
T	completewith	KayaLives
A	use	923
A	itemcount	923,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.1
A	xp	<21,1
S	Warrior/Shaman
T	optional	
T	completewith	next
T	ah	
S	Warrior
A	goto	1456/1,-38.71,-1255.32
A	collect	928,1,493,1
A	money	<0.9860
A	target	Etu Ragetotem
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.2
S	Warrior
T	optional	
T	completewith	KayaLives
A	use	928
A	itemcount	928,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.2
A	xp	<20,1
S	Shaman
T	season	0
A	goto	1456/1,-38.71,-1255.32
A	collect	928,1,493,1
A	money	<0.9860
A	target	Etu Ragetotem
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.2
S	Shaman
T	season	0
T	optional	
T	completewith	KayaLives
A	use	928
A	itemcount	928,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.2
A	xp	<21,1
S	Shaman
T	season	2
A	goto	1456/1,-38.71,-1255.32
A	collect	925,1,493,1
A	money	<0.7797
A	target	Etu Ragetotem
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.8
S	Shaman
T	season	2
T	optional	
T	completewith	KayaLives
A	use	925
A	itemcount	925,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.8
A	xp	<20,1
S	Hunter
A	goto	1456/1,26.31,-1167.93
A	collect	3027,1,493,1
A	money	<0.5643
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.1
A	target	Kuna Thunderhorn
S	Hunter
T	completewith	KayaLives
T	optional	
A	use	3027
A	itemcount	3027,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.1
A	xp	<20,1
S	Hunter
A	goto	1456/1,26.31,-1167.93
A	collect	2515,1600,493,1 << Hunter
A	target	Kuna Thunderhorn
S	
T	completewith	next
A	goto	1456/1,26.1,-1196.66
A	fly	Crossroads
A	target	Tal
A	zoneskip	The Barrens
A	dungeon	WC
S	
T	sticky	
T	completewith	EnterWC
A	dungeon	WC
S	
A	goto	1413/1,-2053.62,-882.58,100
A	isOnQuest	914
A	dungeon	WC
S	
T	completewith	next
A	goto	1413/1,-2134.68,-764.35,0
A	goto	1413/1,-2134.68,-764.35,30,0
A	goto	1413/1,-2122.52,-734.62,20,0
A	goto	1414/1,-2061.94,-781.68,20,0
A	goto	1414/1,-2028.82,-828.29,10,0
A	goto	1414/1,-2021.46,-816.030,10
A	dungeon	WC
S	
A	accept	1486
A	target	+Nalpak
A	goto	1414/1,-2036.18,-796.40
A	accept	1487
A	target	+Ebru
A	goto	1414/1,-2039.86,-801.31
A	dungeon	WC
S	
T	optional	
T	hardcore	
T	completewith	EnterWC
A	complete	962,1
A	skill	herbalism,<1,1
A	isOnQuest	962
A	dungeon	WC
S	
T	hardcore	
T	completewith	EnterWC
A	complete	962,1
A	skill	herbalism,1,1
A	isOnQuest	962
A	dungeon	WC
S	
T	optional	
T	softcore	
T	completewith	EnterWC
A	complete	962,1
A	skill	herbalism,<1,1
A	isOnQuest	962
A	dungeon	WC
S	
T	softcore	
T	completewith	EnterWC
A	complete	962,1
A	skill	herbalism,1,1
A	isOnQuest	962
A	dungeon	WC
S	
T	hardcore	
T	completewith	EnterWC
A	complete	1486,1
A	dungeon	WC
A	isOnQuest	1486
S	
T	softcore	
T	completewith	EnterWC
A	complete	1486,1
A	dungeon	WC
A	isOnQuest	1486
S	
T	completewith	EnterWC
A	complete	1491,1
A	isOnQuest	1491
A	dungeon	WC
S	
T	label	MadMagg
T	loop	
A	goto	1414/1,-2058.26,-749.79,0
A	goto	1414/1,-2003.06,-659.01,0
A	goto	1414/1,-2072.98,-698.27,0
A	goto	1414/1,-2124.50,-730.16,0
A	goto	1414/1,-2058.26,-749.79,30,0
A	goto	1414/1,-2003.06,-659.01,30,0
A	goto	1414/1,-2072.98,-698.27,30,0
A	goto	1414/1,-2124.50,-730.16,30,0
A	complete	959,1
A	mob	Mad Magglish
A	isOnQuest	959
A	dungeon	WC
S	
T	label	EnterWC
A	goto	1414/1,-2028.82,-636.93,20,0
A	goto	1414/1,-2050.90,-585.41,20,0
A	goto	1414/1,-2168.66,-607.49,30,0
A	goto	1414/1,-2216.5,-742.43,30
A	dungeon	WC
S	
T	optional	
T	hardcore	
T	completewith	GlowingShard
A	complete	962,1
A	skill	herbalism,<1,1
A	isOnQuest	962
A	dungeon	WC
S	
T	optional	
T	hardcore	
T	completewith	GlowingShard
A	complete	962,1
A	skill	herbalism,1,1
A	isOnQuest	962
A	dungeon	WC
S	
T	optional	
T	softcore	
T	completewith	GlowingShard
A	complete	962,1
A	skill	herbalism,<1,1
A	isOnQuest	962
A	dungeon	WC
S	
T	optional	
T	softcore	
T	completewith	GlowingShard
A	complete	962,1
A	skill	herbalism,1,1
A	isOnQuest	962
A	dungeon	WC
S	
T	optional	
T	hardcore	
T	completewith	GlowingShard
A	complete	1491,1
A	isOnQuest	1491
A	dungeon	WC
S	
T	optional	
T	softcore	
T	completewith	GlowingShard
A	complete	1491,1
A	isOnQuest	1491
A	dungeon	WC
S	
T	completewith	GlowingShard
A	complete	1487,1
A	mob	+Deviate Ravager
A	complete	1487,2
A	mob	+Deviate Viper
A	complete	1487,3
A	mob	+Deviate Shambler
A	complete	1487,4
A	mob	+Deviate Dreadfang
A	complete	1486,1
A	isOnQuest	1487
A	dungeon	WC
S	
T	label	Gems
A	complete	914,1
A	mob	+Lord Cobrahn
A	complete	914,2
A	mob	+Lady Anacondra
A	complete	914,3
A	mob	+Lord Pythas
A	complete	914,4
A	mob	+Lord Serpentis
A	isOnQuest	914
A	dungeon	WC
S	
T	requires	Gems
T	completewith	next
A	target	Disciple of Naralex
A	skipgossip	
A	dungeon	WC
S	
T	label	GlowingShard
A	collect	10441,1
A	accept	6981
A	use	10441
A	mob	Mutanus the Devourer
A	dungeon	WC
S	
T	optional	
T	completewith	DeviateRaptors
A	complete	1491,1
A	isOnQuest	1491
A	dungeon	WC
S	
T	optional	
T	hardcore	
T	completewith	Ectoplasms
A	complete	962,1
A	skill	herbalism,<1,1
A	isOnQuest	962
A	dungeon	WC
S	
T	optional	
T	hardcore	
T	completewith	Ectoplasms
A	complete	962,1
A	skill	herbalism,1,1
A	isOnQuest	962
A	dungeon	WC
S	
T	optional	
T	softcore	
T	completewith	Ectoplasms
A	complete	962,1
A	skill	herbalism,<1,1
A	isOnQuest	962
A	dungeon	WC
S	
T	optional	
T	softcore	
T	completewith	Ectoplasms
A	complete	962,1
A	skill	herbalism,1,1
A	isOnQuest	962
A	dungeon	WC
S	
T	optional	
A	complete	1487,1
A	mob	+Deviate Ravager
A	complete	1487,2
A	mob	+Deviate Viper
A	complete	1487,3
A	mob	+Deviate Shambler
A	complete	1487,4
A	mob	+Deviate Dreadfang
A	complete	1486,1
A	disablecheckbox	
A	isOnQuest	1487
A	isOnQuest	1486
A	dungeon	WC
S	
A	complete	1487,1
A	mob	+Deviate Ravager
A	complete	1487,2
A	mob	+Deviate Viper
A	complete	1487,3
A	mob	+Deviate Shambler
A	complete	1487,4
A	mob	+Deviate Dreadfang
A	isOnQuest	1487
A	dungeon	WC
S	
T	label	DeviateRaptors
A	complete	1486,1
A	mob	Deviate Ravager
A	mob	Deviate Viper
A	mob	Deviate Shambler
A	mob	Deviate Dreadfang
A	isOnQuest	1486
A	dungeon	WC
S	
T	label	Ectoplasms
A	complete	1491,1
A	mob	Devouring Ectoplasm
A	mob	Evolving Ectoplasm
A	mob	Nightmare Ectoplasm
A	isOnQuest	1491
A	dungeon	WC
S	
T	optional	
T	hardcore	
A	complete	962,1
A	skill	herbalism,<1,1
A	isOnQuest	962
A	dungeon	WC
S	
T	hardcore	
A	complete	962,1
A	skill	herbalism,1,1
A	isOnQuest	962
A	dungeon	WC
S	
T	optional	
T	softcore	
A	complete	962,1
A	skill	herbalism,<1,1
A	isOnQuest	962
A	dungeon	WC
S	
T	softcore	
A	complete	962,1
A	skill	herbalism,1,1
A	isOnQuest	962
A	dungeon	WC
S	
T	completewith	GShard
A	hs	
A	bindlocation	392,1
A	subzoneskip	392
A	use	6948
A	dungeon	WC
S	
A	goto	1413/1,-3697.24,-929.20
A	turnin	1491
A	target	Mebok Mizzyrix
A	isQuestComplete	1491
A	dungeon	WC
S	
A	goto	1413/1,-3770.20,-928.53
A	turnin	959
A	target	Crane Operator Bigglefuzz
A	isQuestComplete	959
A	dungeon	WC
S	
T	label	GShard
A	goto	1413/1,-3760.07,-902.18
A	complete	6981,1
A	skipgossip	
A	target	Sputtervalve
A	isOnQuest	6981
A	dungeon	WC
S	
A	goto	1413/1,-3770.20,-898.12
A	fly	Crossroads
A	target	Bragok
A	subzoneskip	380
A	isOnQuest	6981
A	dungeon	WC
S	
T	completewith	next
A	goto	1413/1,-2493.40,-708.95,20,0
A	goto	1413/1,-2404.23,-721.11,20,0
A	goto	1413/1,-2356.60,-685.98,20,0
A	goto	1413/1,-2259.32,-602.20,50
A	dungeon	WC
S	
A	goto	1413/1,-2259.32,-602.20
A	turnin	6981
A	accept	3369
A	target	Falla Sagewind
A	isOnQuest	6981
A	dungeon	WC
S	
A	goto	1413/1,-2259.32,-602.20
A	accept	3369
A	target	Falla Sagewind
A	isQuestTurnedIn	6981
A	dungeon	WC
S	
A	turnin	1486
A	target	+Nalpak
A	goto	1414/1,-2036.18,-796.40
A	turnin	1487
A	target	+Ebru
A	goto	1414/1,-2039.86,-801.31
A	isQuestComplete	1487
A	isQuestComplete	1486
A	dungeon	WC
S	
A	goto	1414/1,-2039.86,-801.31
A	turnin	1487
A	target	Ebru
A	isQuestComplete	1487
A	dungeon	WC
S	
A	goto	1414/1,-2036.18,-796.40
A	turnin	1486
A	target	Nalpak
A	isQuestComplete	1486
A	dungeon	WC
S	
T	completewith	WCEnd
A	goto	1413/1,-2595.75,-437.35
A	fly	Thunder Bluff
A	target	Devrak
A	zoneskip	Thunder Bluff
A	dungeon	WC
S	skip
T	completewith	next
A	subzone	378
A	dungeon	WC
S	skip
A	goto	1413/1,-1881.35,-2384.50
A	fly	Thunder Bluff
A	target	Omusa Thunderhorn
A	dungeon	WC
S	
A	goto	1456/1,-272.93,-1069.67
A	turnin	914
A	target	Nara Wildmane
A	isQuestComplete	914
A	dungeon	WC
S	
A	goto	1456/1,-303.83,-1048.66
A	turnin	3369
A	target	Arch Druid Hamuul Runetotem
A	isOnQuest	3369
A	dungeon	WC
S	
T	completewith	next
A	goto	1456/1,219.09,-1051.44,10
A	isQuestComplete	962
A	dungeon	WC
S	
A	goto	1456/1,276.6,-996.12
A	turnin	962
A	target	Apothecary Zamah
A	isQuestComplete	962
A	dungeon	WC
S	
T	label	WCEnd
A	goto	1456/1,38.32,-1300.48
A	home	
A	target	Innkeeper Pala
A	bindlocation	1638
A	isQuestAvailable	6442
A	dungeon	WC
S	
T	optional	
A	abandon	1486
S	
T	optional	
A	abandon	1487
S	
T	optional	
A	abandon	1491
S	
T	optional	
A	abandon	959
S	
T	optional	
A	abandon	914
S	
T	optional	
A	abandon	962
S	
T	xprate	<1.5
T	completewith	Serena
A	goto	1456/1,26.1,-1196.66
A	fly	Crossroads
A	target	Tal
A	subzoneskip	380
A	isQuestTurnedIn	852 << !Hunter
S	
T	xprate	>1.49
T	completewith	CounterattackTurnin2
A	goto	1456/1,26.1,-1196.66
A	fly	Crossroads
A	subzoneskip	380
A	target	Tal
A	isQuestTurnedIn	852 << !Hunter
S	
A	goto	1413/1,-1972.55,-306.95
A	turnin	852
A	target	Regthar Deathgate
A	isQuestComplete	852
S	
T	xprate	<1.5
A	goto	1413/1,-1972.55,-306.95
A	turnin	855
A	target	Regthar Deathgate
A	isQuestComplete	855
S	
T	xprate	<1.5
T	optional	
T	completewith	Serena
A	abandon	855
S	
T	completewith	CounterattackTurnin2
S	
A	goto	1413/1,-1972.55,-306.95
A	accept	4021
A	target	Regthar Deathgate
A	isQuestTurnedIn	852
S	
A	goto	1413/1,-1884.39,-289.38
A	complete	4021,1
A	unitscan	Warlord Krom'zar
A	isQuestTurnedIn	852
S	
T	label	CounterattackTurnin2
A	goto	1413/1,-1972.55,-306.95
A	turnin	4021
A	target	Regthar Deathgate
A	isQuestComplete	4021
S	
T	xprate	<1.5
A	goto	1413/1,-1972.55,-306.95
A	turnin	855
A	target	Regthar Deathgate
A	isQuestComplete	855
S	
T	xprate	<1.5
T	label	Serena
A	goto	1413/1,-1345.3,790.94
A	complete	876,1
A	mob	Serena Bloodfeather
A	isQuestTurnedIn	875
S	Hunter
A	goto	1413/1,-2347.48,857.83
A	turnin	3921
A	target	Wenikee Boltbucket
A	isOnQuest	3921
S	Hunter
A	goto	1413/1,-2253.24,1246.31
A	turnin	6541
A	target	Kadrak
S	Hunter
A	goto	1440/1,-2240.94,1778.570
A	accept	6544
A	target	Torek
S	Hunter
A	goto	1440/1,-2110.61,1809.320,60,0
A	goto	1440/1,-2052.37,1776.27,20,0
A	goto	1440/1,-2006.81,1777.42,10,0
A	goto	1440/1,-2037.38,1777.04
A	complete	6544,1
A	mob	Silverwing Warrior
A	mob	Silverwing Sentinel
A	unitscan	Duriel Moonfire
S	Hunter
A	goto	1440/1,-2511.97,2271.73
A	turnin	6544
A	target	Ertog Ragetusk
A	isQuestComplete	6544
S	Hunter
A	goto	1440/1,-2554.65,2310.55
A	turnin	6382
A	turnin	6383
A	target	Senani Thunderheart
S	Hunter
A	goto	1440/1,-2520.05,2305.55
A	fp	Splintertree Post
A	target	Vhulgra
S	Hunter
T	completewith	EnterSTM2
A	goto	1440/1,-2520.05,2305.55
A	fly	Crossroads
A	target	Vhulgra
A	zoneskip	The Barrens
S	!Hunter
T	xprate	<1.5
T	softcore	
T	completewith	next
A	deathskip	
S	!Hunter
T	xprate	<1.5
T	hardcore	
T	completewith	next
A	subzone	380
S	
T	xprate	<1.5
A	goto	1413/1,-2607.91,-474.51
A	turnin	876
A	accept	1060
A	target	Darsok Swiftdagger
A	isQuestComplete	876
S	
T	xprate	<1.5
T	optional	
A	goto	1413/1,-2607.91,-474.51
A	accept	1060
A	target	Darsok Swiftdagger
A	isQuestTurnedIn	876
S	
A	goto	1413/1,-2555.22,-387.350
A	accept	868
A	target	Korran
S	
T	label	EnterSTM2
T	completewith	STMturnins1
A	zone	Stonetalon Mountains
A	zoneskip	Stonetalon Mountains
S	
T	map	Stonetalon Mountains
A	turnin	1062
A	timer	4,Goblin Invaders RP
A	accept	1063
A	accept	1068
A	target	+Seereth Stonebreak
A	goto	1413/1,-950.10,-271.14
A	turnin	6629
A	turnin	6523
A	accept	6401
A	target	+Makaba Flathoof
A	goto	1413/1,-943.00,-265.06
A	isQuestComplete	6629
A	isQuestComplete	6523
S	
T	optional	
T	map	Stonetalon Mountains
A	turnin	1062
A	timer	4,Goblin Invaders RP
A	accept	1063
A	accept	1068
A	target	+Seereth Stonebreak
A	goto	1413/1,-950.10,-271.14
A	turnin	6629
A	target	+Makaba Flathoof
A	goto	1413/1,-943.00,-265.06
A	isQuestComplete	6629
S	
T	optional	
T	map	Stonetalon Mountains
A	turnin	1062
A	timer	4,Goblin Invaders RP
A	accept	1063
A	accept	1068
A	target	+Seereth Stonebreak
A	goto	1413/1,-950.10,-271.14
A	turnin	6523
A	accept	6401
A	target	+Makaba Flathoof
A	goto	1413/1,-943.00,-265.06
A	isQuestComplete	6523
S	
T	label	STMturnins1
T	optional	
T	map	Stonetalon Mountains
A	turnin	1062
A	timer	4,Goblin Invaders RP
A	accept	1063
A	accept	1068
A	goto	1413/1,-950.10,-271.14
A	target	Seereth Stonebreak
S	
T	completewith	BloodFeedersTI
A	goto	1442/1,-786.33,-294.97,60,0
A	goto	1442/1,-665.72,-280.97,40,0
A	goto	1442/1,-522.63,-294.32,40
S	
A	goto	1442/1,-394.20,-272.50
A	turnin	1060
A	accept	1058
A	target	Witch Doctor Jin'Zil
A	isQuestTurnedIn	876
S	
A	goto	1442/1,-394.20,-272.50
A	accept	1058
A	target	Witch Doctor Jin'Zil
S	Warlock
A	goto	1442/1,-331.21,-181.00
A	turnin	1510
A	accept	1511
A	target	Ken'zigla
S	
T	label	BloodFeedersTI
A	goto	1442/1,-233.54,-177.42
A	turnin	6461
A	target	Xen'Zilla
S	skip
A	goto	1442/1,-401.53,-277.710
A	goto	1456/1,-74.62,-981.93,30
A	link	https://www.youtube.com/watch?v=cp2YI86AO4Y&ab
S	skip
T	completewith	ElderCroneTurnin
A	goto	1456/1,-48.84,-1037.94,20,0
A	goto	1456/1,-13.04,-1107.95,40
S	Hunter
A	goto	1442/1,360.76,451.690
A	accept	6284
S	Hunter
T	loop	
A	goto	1442/1,569.77,573.79,0
A	goto	1442/1,711.87,513.23,50,0
A	goto	1442/1,684.04,582.91,50,0
A	goto	1442/1,569.77,573.79,50,0
A	complete	6284,1
A	unitscan	Besseleth
S	
T	completewith	Tsunaman1
A	subzone	460
S	
A	goto	1442/1,940.9,925.14
A	turnin	6284
A	target	Maggran Earthbinder
A	isQuestComplete	6284
S	
T	label	KayaLives
A	goto	1442/1,928.20,1015.99
A	turnin	6401
A	target	Tammra Windfield
A	isQuestTurnedIn	6523
S	
A	goto	1442/1,927.72,893.56
A	vendor	
A	vendor	
A	vendor	
A	target	Innkeeper Jayka
A	isOnQuest	1095
S	
A	goto	1442/1,925.27,885.42,5,0
A	goto	1442/1,920.88,911.47
A	vendor	4083
A	vendor	4083
A	target	Jeeda
A	isOnQuest	1095
S	
T	xprate	<1.5
T	completewith	next
A	goto	1442/1,834.44,908.21,30,0
A	goto	1442/1,856.91,874.67,30,0
A	goto	1442/1,896.46,836.57,30,0
A	goto	1442/1,940.41,831.04,30
S	
T	xprate	<1.5
T	label	Tsunaman1
A	goto	1442/1,933.09,824.53
A	accept	6562
A	accept	6393
A	target	Tsunaman
S	
A	goto	1442/1,365.16,878.250
A	turnin	1095
A	target	Ziz Fizziks
S	
T	xprate	<1.5
T	loop	
A	line	Stonetalon Mountains,70.82,55.25,70.52,56.22,69.76,56.70,68.52,56.04,67.77,55.97,66.94,56.25,66.41,56.31,65.74,57.20,65.14,57.02,64.37,56.47,63.72,56.80,62.99,56.25,62.32,56.11,61.58,55.10,61.10,54.68,60.98,54.06,59.81,53.51,59.66,52.14,60.33,51.68
A	goto	1442/1,265.54,1213.00,50,0
A	goto	1442/1,299.72,1233.84,50,0
A	goto	1442/1,332.44,1218.86,50,0
A	goto	1442/1,325.11,1174.25,50,0
A	goto	1442/1,267.98,1156.34,50,0
A	goto	1442/1,262.12,1136.15,50,0
A	goto	1442/1,238.68,1122.470,50,0
A	goto	1442/1,202.54,1089.58,50,0
A	goto	1442/1,169.82,1085.03,50,0
A	goto	1442/1,134.17,1067.120,50,0
A	goto	1442/1,102.43,1077.86,50,0
A	goto	1442/1,64.83,1059.95,50,0
A	goto	1442/1,35.53,1054.090,50,0
A	goto	1442/1,2.81,1083.07,50,0
A	goto	1442/1,-23.07,1085.03,50,0
A	goto	1442/1,-63.60,1094.14,50,0
A	goto	1442/1,-100.23,1091.86,50,0
A	goto	1442/1,-160.78,1070.370,50,0
A	goto	1442/1,-197.89,1086.00,50,0
A	goto	1442/1,-212.54,1117.59,50,0
A	goto	1442/1,332.44,1218.86,0
A	complete	1068,2
A	unitscan	XT:9
S	
T	xprate	<1.5
T	loop	
A	line	Stonetalon Mountains,67.18,46.87,66.53,46.95,65.72,45.09,63.73,45.02,63.72,45.92,63.43,46.57,64.43,46.13,64.72,46.63,64.82,47.72,65.11,48.31,65.98,48.67,66.24,49.65,66.65,49.58,66.88,48.95,68.41,49.58,69.45,46.56,70.22,48.62,70.95,48.49,71.41,45.54,71.25,43.45
A	goto	1442/1,-34.79,1390.46,50,0
A	goto	1442/1,-3.05,1387.86,50,0
A	goto	1442/1,36.51,1448.42,50,0
A	goto	1442/1,133.69,1450.70,50,0
A	goto	1442/1,134.17,1421.40,50,0
A	goto	1442/1,148.34,1400.23,50,0
A	goto	1442/1,99.50,1414.56,50,0
A	goto	1442/1,85.34,1398.28,50,0
A	goto	1442/1,80.46,1362.78,50,0
A	goto	1442/1,66.30,1343.57,50,0
A	goto	1442/1,23.81,1331.85,50,0
A	goto	1442/1,11.11,1299.94,50,0
A	goto	1442/1,-8.91,1302.22,50,0
A	goto	1442/1,-20.14,1322.73,50,0
A	goto	1442/1,-94.85,1302.22,50,0
A	goto	1442/1,-145.64,1400.56,50,0
A	goto	1442/1,-183.24,1333.48,50,0
A	goto	1442/1,-218.89,1337.71,50,0
A	goto	1442/1,-241.35,1433.77,50,0
A	goto	1442/1,-233.54,1501.83,50,0
A	goto	1442/1,80.46,1378.74,50,0
A	goto	1442/1,80.46,1378.74,0
A	complete	1068,1
A	unitscan	XT:4
S	
T	xprate	<1.5
T	completewith	next
A	goto	1442/1,-357.09,978.55
A	subzone	2160
A	group	
S	
T	xprate	<1.5
A	goto	1442/1,-263.82,962.92
A	accept	1090
A	target	Piznik
A	group	2
S	
T	xprate	<1.5
A	goto	1442/1,-258.93,956.73
A	complete	1090,1
A	mob	Windshear Vermin
A	group	2
S	
T	xprate	<1.5
A	goto	1442/1,-263.82,962.92
A	turnin	1090
A	accept	1092
A	target	Piznik
A	group	
S	skip
T	xprate	<1.5
A	goto	1442/1,-261.86,951.85
A	goto	1442/1,434.5,898.12,30
A	link	https://www.youtube.com/watch?v=8s1SRza7qFg&ab_channel=RestedXP
A	group	
S	
T	xprate	<1.5
A	goto	1442/1,365.16,878.250
A	turnin	1092
A	target	Ziz Fizziks
A	isQuestTurnedIn	1090
A	group	
S	
T	xprate	<1.5
T	loop	
A	line	Stonetalon Mountains,70.82,55.25,70.52,56.22,69.76,56.70,68.52,56.04,67.77,55.97,66.94,56.25,66.41,56.31,65.74,57.20,65.14,57.02,64.37,56.47,63.72,56.80,62.99,56.25,62.32,56.11,61.58,55.10,61.10,54.68,60.98,54.06,59.81,53.51,59.66,52.14,60.33,51.68
A	goto	1442/1,265.54,1213.00,50,0
A	goto	1442/1,299.72,1233.84,50,0
A	goto	1442/1,332.44,1218.86,50,0
A	goto	1442/1,325.11,1174.25,50,0
A	goto	1442/1,267.98,1156.34,50,0
A	goto	1442/1,262.12,1136.15,50,0
A	goto	1442/1,238.68,1122.470,50,0
A	goto	1442/1,202.54,1089.58,50,0
A	goto	1442/1,169.82,1085.03,50,0
A	goto	1442/1,134.17,1067.120,50,0
A	goto	1442/1,102.43,1077.86,50,0
A	goto	1442/1,64.83,1059.95,50,0
A	goto	1442/1,35.53,1054.090,50,0
A	goto	1442/1,2.81,1083.07,50,0
A	goto	1442/1,-23.07,1085.03,50,0
A	goto	1442/1,-63.60,1094.14,50,0
A	goto	1442/1,-100.23,1091.86,50,0
A	goto	1442/1,-160.78,1070.370,50,0
A	goto	1442/1,-197.89,1086.00,50,0
A	goto	1442/1,-212.54,1117.59,50,0
A	goto	1442/1,332.44,1218.86,0
A	complete	1068,2
A	unitscan	XT:9
A	isQuestTurnedIn	1092
A	group	0
S	
T	xprate	<1.5
T	loop	
A	line	Stonetalon Mountains,67.18,46.87,66.53,46.95,65.72,45.09,63.73,45.02,63.72,45.92,63.43,46.57,64.43,46.13,64.72,46.63,64.82,47.72,65.11,48.31,65.98,48.67,66.24,49.65,66.65,49.58,66.88,48.95,68.41,49.58,69.45,46.56,70.22,48.62,70.95,48.49,71.41,45.54,71.25,43.45
A	goto	1442/1,-34.79,1390.46,50,0
A	goto	1442/1,-3.05,1387.86,50,0
A	goto	1442/1,36.51,1448.42,50,0
A	goto	1442/1,133.69,1450.70,50,0
A	goto	1442/1,134.17,1421.40,50,0
A	goto	1442/1,148.34,1400.23,50,0
A	goto	1442/1,99.50,1414.56,50,0
A	goto	1442/1,85.34,1398.28,50,0
A	goto	1442/1,80.46,1362.78,50,0
A	goto	1442/1,66.30,1343.57,50,0
A	goto	1442/1,23.81,1331.85,50,0
A	goto	1442/1,11.11,1299.94,50,0
A	goto	1442/1,-8.91,1302.22,50,0
A	goto	1442/1,-20.14,1322.73,50,0
A	goto	1442/1,-94.85,1302.22,50,0
A	goto	1442/1,-145.64,1400.56,50,0
A	goto	1442/1,-183.24,1333.48,50,0
A	goto	1442/1,-218.89,1337.71,50,0
A	goto	1442/1,-241.35,1433.77,50,0
A	goto	1442/1,-233.54,1501.83,50,0
A	goto	1442/1,80.46,1378.74,50,0
A	goto	1442/1,80.46,1378.74,0
A	complete	1068,1
A	unitscan	XT:4
A	isQuestTurnedIn	1092
A	group	0
S	
T	xprate	<1.5
T	completewith	next
A	goto	1442/1,-577.33,1532.43,30
S	skip
T	xprate	<1.5
A	goto	1442/1,-606.63,1573.79
A	goto	1440/1,-629.73,2633.42,30
A	link	https://www.youtube.com/watch?v=h2s4ZjFBLtg&ab_channel=RestedXP
A	zoneskip	Ashenvale
S	
T	xprate	<1.5
T	completewith	ZoramFP
A	goto	1440/1,-268.74,2612.28,50,0
A	goto	1440/1,637.2,3406.79,50,0
A	goto	1440/1,1010.31,3355.28,80
A	unitscan	Astranaar Sentinel
S	
T	xprate	<1.5
T	optional	
T	loop	
A	goto	1440/1,1073.74,3635.49,50,0
A	goto	1440/1,1052.4,3683.92,50,0
A	goto	1440/1,1017.8,3683.15,50,0
A	goto	1440/1,978.59,3746.96,50,0
A	goto	1440/1,882.29,3749.26,50,0
A	goto	1440/1,843.65,3785.78,50,0
A	goto	1440/1,885.17,3874.57,50,0
A	goto	1440/1,850.57,3921.08,50,0
A	goto	1440/1,858.64,3984.89,50,0
A	goto	1440/1,928.42,4042.93,50,0
A	goto	1440/1,914.58,4116.34,50,0
A	goto	1440/1,884.02,4084.44,50,0
A	goto	1440/1,784.25,4080.21,50,0
A	goto	1440/1,811.93,4021.02,50,0
A	goto	1440/1,822.31,3949.91,50,0
A	goto	1440/1,815.97,3874.19,50,0
A	goto	1440/1,815.97,3807.69,50,0
A	goto	1440/1,816.55,3715.82,50,0
A	goto	1440/1,848.84,3691.99,50,0
A	goto	1440/1,856.91,3654.71,50,0
A	goto	1440/1,862.68,3587.06,50,0
A	goto	1440/1,918.62,3544.39,50,0
A	goto	1440/1,984.36,3552.46,50,0
A	goto	1440/1,1052.98,3479.82,50,0
A	goto	1440/1,1101.42,3535.17,50,0
A	goto	1440/1,1065.09,3574.76,50,0
A	xp	21
S	
T	xprate	<1.5
T	label	ZoramFP
A	goto	1440/1,994.16,3373.730
A	fp	Zoram'gar Outpost
A	target	Andruk
A	isQuestAvailable	6442
S	
T	xprate	<1.5
A	turnin	6562
A	target	+Je'neu Sancrea
A	goto	1440/1,1033.37,3354.89
A	accept	216
A	target	+Karang Amakkar
A	goto	1440/1,1013.77,3345.67
A	accept	6462
A	target	+Mitsuwa
A	goto	1440/1,1028.18,3333.37
A	accept	6442
A	target	+Marukai
A	goto	1440/1,1025.88,3331.450
S	
T	xprate	<1.5
A	goto	1440/1,1004.54,3341.83
A	accept	6641,1
A	target	Muglash
S	
T	xprate	<1.5
T	completewith	next
A	complete	6442,1
A	mob	Wrathtail Razortail
A	mob	Wrathtail Wave Rider
A	mob	Wrathtail Sorceress
A	mob	Wrathtail Sea Witch
A	mob	Wrathtail Priestess
A	mob	Wrathtail Myrmidon
A	mob	Lady Vespia
S	
T	xprate	<1.5
A	goto	1440/1,1144.67,3610.89
A	complete	6641,1
A	mob	Vorsha the Lasher
S	Priest
T	xprate	<1.5
T	season	0,1
T	sticky	
T	completewith	EnterBFD
A	subzone	2797,2
A	dungeon	BFD
S	
T	xprate	<1.5
T	loop	
A	goto	1440/1,1065.09,3574.76,0
A	goto	1440/1,1073.74,3635.49,50,0
A	goto	1440/1,1052.4,3683.92,50,0
A	goto	1440/1,1017.8,3683.15,50,0
A	goto	1440/1,978.59,3746.96,50,0
A	goto	1440/1,882.29,3749.26,50,0
A	goto	1440/1,843.65,3785.78,50,0
A	goto	1440/1,885.17,3874.57,50,0
A	goto	1440/1,850.57,3921.08,50,0
A	goto	1440/1,858.64,3984.89,50,0
A	goto	1440/1,928.42,4042.93,50,0
A	goto	1440/1,914.58,4116.34,50,0
A	goto	1440/1,884.02,4084.44,50,0
A	goto	1440/1,784.25,4080.21,50,0
A	goto	1440/1,811.93,4021.02,50,0
A	goto	1440/1,822.31,3949.91,50,0
A	goto	1440/1,815.97,3874.19,50,0
A	goto	1440/1,815.97,3807.69,50,0
A	goto	1440/1,816.55,3715.82,50,0
A	goto	1440/1,848.84,3691.99,50,0
A	goto	1440/1,856.91,3654.71,50,0
A	goto	1440/1,862.68,3587.06,50,0
A	goto	1440/1,918.62,3544.39,50,0
A	goto	1440/1,984.36,3552.46,50,0
A	goto	1440/1,1052.98,3479.82,50,0
A	goto	1440/1,1101.42,3535.17,50,0
A	goto	1440/1,1065.09,3574.76,50,0
A	complete	6442,1
A	mob	Wrathtail Razortail
A	mob	Wrathtail Wave Rider
A	mob	Wrathtail Sorceress
A	mob	Wrathtail Sea Witch
A	mob	Wrathtail Priestess
A	mob	Wrathtail Myrmidon
A	mob	Lady Vespia
S	
T	xprate	<1.5
T	loop	
A	goto	1440/1,1073.74,3635.49,50,0
A	goto	1440/1,1052.4,3683.92,50,0
A	goto	1440/1,1017.8,3683.15,50,0
A	goto	1440/1,978.59,3746.96,50,0
A	goto	1440/1,882.29,3749.26,50,0
A	goto	1440/1,843.65,3785.78,50,0
A	goto	1440/1,885.17,3874.57,50,0
A	goto	1440/1,850.57,3921.08,50,0
A	goto	1440/1,858.64,3984.89,50,0
A	goto	1440/1,928.42,4042.93,50,0
A	goto	1440/1,914.58,4116.34,50,0
A	goto	1440/1,884.02,4084.44,50,0
A	goto	1440/1,784.25,4080.21,50,0
A	goto	1440/1,811.93,4021.02,50,0
A	goto	1440/1,822.31,3949.91,50,0
A	goto	1440/1,815.97,3874.19,50,0
A	goto	1440/1,815.97,3807.69,50,0
A	goto	1440/1,816.55,3715.82,50,0
A	goto	1440/1,848.84,3691.99,50,0
A	goto	1440/1,856.91,3654.71,50,0
A	goto	1440/1,862.68,3587.06,50,0
A	goto	1440/1,918.62,3544.39,50,0
A	goto	1440/1,984.36,3552.46,50,0
A	goto	1440/1,1052.98,3479.82,50,0
A	goto	1440/1,1101.42,3535.17,50,0
A	goto	1440/1,1065.09,3574.76,50,0
A	xp	21+21450
A	dungeon	!BFD << Priest
S	
T	xprate	<1.5
A	turnin	6641
A	target	+Warsong Runner
A	goto	1440/1,995.31,3357.97
A	turnin	6442
A	target	+Marukai
A	goto	1440/1,1025.88,3331.450
S	Priest
T	xprate	<1.5
T	season	0,1
A	goto	1440/1,1033.37,3354.89
A	accept	6563
A	accept	6921
A	accept	6565
A	target	Je'neu Sancrea
A	dungeon	BFD
A	isQuestTurnedIn	6564
S	Priest
T	xprate	<1.5
T	season	0,1
A	goto	1440/1,1033.37,3354.89
A	accept	6563
A	accept	6921
A	target	Je'neu Sancrea
A	dungeon	BFD
S	Priest
T	xprate	<1.5
T	season	0,1
A	goto	1414/1,915.16,4156.85,100
A	dungeon	BFD
S	Priest
T	xprate	<1.5
T	season	0,1
T	completewith	next
A	complete	6563,1
A	dungeon	BFD
A	isOnQuest	6563
S	Priest
T	xprate	<1.5
T	season	0,1
T	loop	
A	goto	1414/1,896.76,4247.63,0
A	goto	1414/1,944.60,4174.03,20,0
A	goto	1414/1,896.76,4247.63,20,0
A	goto	1414/1,911.48,4313.87,20,0
A	goto	1414/1,874.68,4318.77,20,0
A	goto	1414/1,815.80,4250.08,20,0
A	goto	1414/1,745.88,4220.64,20,0
A	goto	1414/1,679.64,4247.63,20,0
A	goto	1414/1,896.76,4247.63,20,0
A	collect	16790,1,6564
A	accept	6564
A	mob	Blackfathom Tide Priestess
A	use	16790
A	dungeon	BFD
S	Priest
T	xprate	<1.5
T	season	0,1
T	loop	
A	goto	1414/1,749.56,4186.29,0
A	goto	1414/1,679.64,4247.63,20,0
A	goto	1414/1,745.88,4220.64,20,0
A	goto	1414/1,815.80,4250.08,20,0
A	goto	1414/1,874.68,4318.77,20,0
A	goto	1414/1,911.48,4313.87,20,0
A	goto	1414/1,896.76,4247.63,20,0
A	goto	1414/1,944.60,4174.03,20,0
A	goto	1414/1,749.56,4186.29,20,0
A	complete	6563,1
A	dungeon	BFD
A	isOnQuest	6563
S	Priest
T	xprate	<1.5
T	season	0,1
T	label	EnterBFD
A	goto	1414/1,742.20,4247.63
A	subzone	2797,2
A	dungeon	BFD
S	Priest
T	xprate	<1.5
T	season	0,1
A	accept	6561
A	target	Argent Guard Thaelrid
A	dungeon	BFD
S	Priest
T	xprate	<1.5
T	season	0,1
A	complete	6565,1
A	mob	Lorgus Jett
A	isOnQuest	6565
A	dungeon	BFD
S	Priest
T	xprate	<1.5
T	season	0,1
T	completewith	next
A	complete	6921,1
A	isOnQuest	6921
A	dungeon	BFD
S	Priest
T	xprate	<1.5
T	season	0,1
A	collect	16782,1,6782
A	accept	6922
A	mob	Baron Aquanis
A	use	16782
A	dungeon	BFD
S	Priest
T	xprate	<1.5
T	season	0,1
A	complete	6921,1
A	isOnQuest	6921
A	dungeon	BFD
S	Priest
T	xprate	<1.5
T	season	0,1
A	complete	6561,1
A	mob	Twilight Lord Kelris
A	isOnQuest	6561
A	dungeon	BFD
S	Priest
T	xprate	<1.5
T	season	0,1
A	hs	
A	bindlocation	1638,1
A	zoneskip	Thunder Bluff
A	use	6948
A	dungeon	BFD
S	Priest
T	xprate	<1.5
T	season	0,1
A	goto	1456/1,-224.81,-1087.91
A	turnin	6561
A	target	Bashana Runetotem
A	isQuestComplete	6561
A	dungeon	BFD
S	Priest
T	xprate	<1.5
T	season	0,1
A	goto	1456/1,26.1,-1196.66
A	fly	Zoram'gar
A	target	Tal
A	zoneskip	Ashenvale
A	dungeon	BFD
S	Priest
T	xprate	<1.5
T	season	0,1
A	goto	1440/1,1033.37,3354.89
A	turnin	6564
A	target	Je'neu Sancrea
A	dungeon	BFD
A	isOnQuest	6564
S	Priest
T	xprate	<1.5
T	season	0,1
A	goto	1440/1,1033.37,3354.89
A	turnin	6565
A	target	Je'neu Sancrea
A	dungeon	BFD
A	isQuestComplete	6565
S	Priest
T	xprate	<1.5
T	season	0,1
A	goto	1440/1,1033.37,3354.89
A	turnin	6563
A	target	Je'neu Sancrea
A	dungeon	BFD
A	isQuestComplete	6563
S	Priest
T	xprate	<1.5
T	season	0,1
A	goto	1440/1,1033.37,3354.89
A	turnin	6921
A	target	Je'neu Sancrea
A	dungeon	BFD
A	isQuestComplete	6521
S	Priest
T	xprate	<1.5
T	season	0,1
A	goto	1440/1,1033.37,3354.89
A	turnin	6922
A	target	Je'neu Sancrea
A	dungeon	BFD
A	isQuestComplete	6922
S	
T	xprate	<1.5
A	goto	1440/1,1013.77,3345.67
A	accept	216
A	target	Karang Amakkar
S	
T	xprate	>1.49
T	completewith	JourneytoTM
A	goto	1442/1,1041.99,967.80
A	fly	Thunder Bluff
A	target	Tharm
A	zoneskip	Thunder Bluff
A	cooldown	item,6948,<0
S	
T	xprate	<1.5
T	completewith	JourneytoTM
A	goto	1440/1,994.16,3373.730
A	fly	Thunder Bluff
A	zoneskip	Thunder Bluff
A	target	Andruk
A	cooldown	item,6948,<0
S	
T	completewith	JourneytoTM
A	hs	
A	use	6948
A	zoneskip	Thunder Bluff
A	bindlocation	1638,1
A	cooldown	item,6948,>0
S	
T	completewith	next
A	goto	1456/1,-212.71,-1065.010,80
S	
A	goto	1456/1,-212.71,-1065.010
A	turnin	1063
A	timer	6,The Elder Crone RP
A	accept	1064
A	target	Magatha Grimtotem
S	
T	label	JourneytoTM
A	goto	1456/1,278.48,-995.29
A	turnin	1064
A	accept	1065
A	target	Apothecary Zamah
S	Warlock
A	goto	1456/1,26.1,-1196.66
A	fly	Camp Taurajo
A	target	Tal
A	zoneskip	Thunder Bluff,1
S	!Warlock
A	goto	1456/1,26.1,-1196.66
A	fly	Orgrimmar
A	target	Tal
A	zoneskip	Thunder Bluff,1
S	Warlock
T	optional	
A	goto	1440/1,994.16,3373.730
A	fly	Camp Taurajo
A	target	Andruk
A	zoneskip	Ashenvale,1
S	!Warlock
T	optional	
A	goto	1440/1,994.16,3373.730
A	fly	Orgrimmar
A	target	Andruk
A	zoneskip	Ashenvale,1
S	Warlock
A	goto	1413/1,-1898.58,-2391.93
A	turnin	1511
A	accept	1515
A	target	Grunt Logmar
S	Warlock
A	goto	1413/1,-1765.83,-1622.39
A	turnin	1515
A	accept	1512
A	target	Grunt Dogran
S	Warlock
A	goto	1413/1,-1881.35,-2384.50
A	fly	Orgrimmar
A	target	Omusa Thunderhorn
A	zoneskip	The Barrens,1
S	Warlock
A	goto	1454/1,-4357.36,1850.41
A	turnin	1512
A	accept	1513
A	target	Gan'rul Bloodeye
S	Warlock
T	completewith	next
A	cast	9224
A	use	6626
S	Warlock
A	goto	1454/1,-4377.13,1804.77
A	complete	1513,1
A	mob	Summoned Succubus
A	use	6626
S	Warlock
A	goto	1454/1,-4357.36,1850.41
A	turnin	1513
A	target	Gan'rul Bloodeye
S	Warlock
A	goto	1454/1,-4362.55,1834.70
A	train	6202
A	target	Mirket
A	xp	<22,1
A	xp	>24,1
S	Warlock
T	optional	
A	goto	1454/1,-4362.55,1834.70
A	train	6223
A	target	Mirket
A	xp	<24,1
S	Rogue
T	completewith	next
A	goto	1454/1,-4320.75,1750.51
A	collect	2207,1
A	target	Kareth
S	Rogue
A	goto	1454/1,-4284.42,1771.28
A	train	921
A	train	8676
A	train	1943
A	train	1856
A	train	1725
A	train	1785
A	accept	2460
A	target	Shenthul
S	Rogue
A	goto	1454/1,-4284.42,1771.28
A	complete	2460,1
A	target	Shenthul
S	Rogue
A	goto	1454/1,-4284.42,1771.28
A	turnin	2460
A	accept	2458
A	target	Shenthul
S	Rogue
A	goto	1454/1,-4271.1,1810.94
A	collect	2928,40,2479,1
A	collect	3371,40,2479,1
A	collect	5140,20,2479,1
A	target	Rekkul
S	Priest/Warlock
A	goto	1454/1,-4299.99,1820.67
A	collect	5210,1,1507,1
A	money	<0.5808
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<17.4
A	target	Katis
S	Mage
A	goto	1454/1,-4218.64,1473.72
A	train	2138
A	target	Pephredo
A	xp	<22,1
A	xp	>24,1
S	Mage
T	optional	
A	goto	1454/1,-4218.64,1473.72
A	train	2121
A	target	Pephredo
A	xp	<24,1
S	Mage
A	goto	1454/1,-4222.85,1474.94
A	train	3567
A	target	Thuul
S	Troll Priest
A	goto	1454/1,-4179.79,1452.580
A	turnin	5642
A	trainer	
A	target	Ur'kyo
S	Undead Priest
A	goto	1454/1,-4179.79,1452.580
A	train	8103
A	target	Ur'kyo
A	xp	<22,1
A	xp	>24,1
S	Undead Priest
T	optional	
A	goto	1454/1,-4179.79,1452.580
A	train	3747
A	target	Ur'kyo
A	xp	<24,1
S	Rogue/Druid
T	completewith	MissionProbable
A	goto	1454/1,-4048.36,1697.85,80,0
A	goto	1454/1,-3900.25,1681.48,30,0
A	goto	1454/1,-3933.49,1707.86,50
A	zoneskip	The Barrens
S	Rogue/Druid
T	completewith	MissionProbable
A	goto	1413/1,-3216.92,1107.13,120
S	Druid
A	goto	1413/1,-3119.64,1050.38
A	collect	15883,1,31,1
S	Rogue
T	completewith	next
A	goto	1413/1,-3021.35,1214.56
A	use	8051
A	target	Taskmaster Fizzule
S	Rogue
A	goto	1413/1,-2995.0,1236.85
A	turnin	2458
A	accept	2478
A	target	Taskmaster Fizzule
S	Rogue/Druid
T	optional	
T	label	MissionProbable
S	Rogue
A	goto	1413/1,-2930.15,1209.15
A	complete	2478,5
A	mob	Foreman Silixiz
S	Rogue
T	completewith	roguetowerq
S	Rogue
T	label	roguetowerq
A	goto	1413/1,-2922.04,1224.69
A	complete	2478,1
A	mob	+Mutated Venture Co. Drone
A	complete	2478,3
A	mob	+Venture Co. Patroller
A	complete	2478,2
A	mob	+Venture Co. Lookout
S	Rogue
A	goto	1413/1,-2927.11,1236.18
A	complete	2478,4
A	mob	Grand Foreman Puzik Gallywix
S	Rogue
A	goto	1413/1,-2927.11,1236.18
A	complete	2478,6
S	skip --Rogue/Druid
T	hardcore	
T	completewith	next
A	goto	1413/1,-3591.86,1328.06,120
S	skip --Rogue/Druid
T	hardcore	
A	goto	1413/1,-3505.72,1358.46
A	goto	1454/1,-4242.34,1637.33,30
A	link	https://www.youtube.com/watch?v=U7YfoaO-X8E&ab_channel=RestedXP
A	zoneskip	Orgrimmar
S	Rogue/Druid
T	softcore	
T	completewith	next
A	deathskip	
S	Rogue/Druid
T	softcore	
A	goto	1413/1,-2595.75,-437.35
A	fly	Orgrimmar
A	zoneskip	Orgrimmar
A	target	Devrak
S	Rogue/Druid
T	hardcore	
T	completewith	flytoORG
A	goto	1414/1,-3839.37,1644.65
A	zone	Orgrimmar
S	Rogue
A	goto	1454/1,-4284.42,1771.28
A	turnin	2478
A	accept	2479
A	target	Shenthul
S	Rogue
A	goto	1454/1,-4271.1,1810.94
A	collect	2928,20,2479,1
A	collect	3371,20,2479,1
A	target	Rekkul
S	Shaman
A	goto	1454/1,-4225.09,1933.29
A	train	8498
A	target	Kardris Dreamseeker
A	xp	<22,1
A	xp	>24,1
S	Shaman
T	optional	
A	goto	1454/1,-4225.09,1933.29
A	train	905
A	target	Kardris Dreamseeker
A	xp	<24,1
S	Troll Warrior/Undead Warrior/Tauren Warrior
A	goto	1454/1,-4824.00,2090.540
A	train	197
A	target	Hanashi
S	Warrior
A	goto	1454/1,-4801.42,1980.53
A	train	6192
A	target	Grezz Ragefist
A	xp	<22,1
A	xp	>24,1
S	Warrior
T	optional	
A	goto	1454/1,-4801.42,1980.53
A	train	5308
A	target	Grezz Ragefist
A	xp	<24,1
S	Hunter
A	goto	1454/1,-4607.02,2100.64
A	train	14323
A	target	Ormak Grimshot
A	xp	<22,1
A	xp	>24,1
S	Hunter
T	optional	
A	goto	1454/1,-4607.02,2100.64
A	train	14262
A	target	Ormak Grimshot
A	xp	<24,1
S	Hunter
A	goto	1454/1,-4611.09,2135.15
A	train	24558
A	target	Xao'tsu
A	xp	<24,1
S	Rogue
A	goto	1454/1,-4355.53,1520.68
A	collect	3137,200,6544,1
A	target	Trak'gen
S	Rogue
A	itemcount	6452,1
A	use	6452
A	aura	-9991
S	Rogue
A	destroy	8051
A	destroy	8066
S	
T	optional	
T	label	flytoORG
S	
T	optional	
A	abandon	6421
S	
T	optional	
A	abandon	4021
S	
T	optional	
A	abandon	6481
S	
T	optional	
A	abandon	6284
S	
T	optional	
A	abandon	6641
S	
T	optional	
A	abandon	6563
E
G	Guides/forever/Horde-12-22_Barrens.lua
M	classic	
M	tbc	
M	selector	Horde
M	xprate	>1.99
M	name	13-20 The Barrens
M	version	1
M	group	RestedXP Forever Guide (H)
M	subgroup	Speedrun Guide 1-22
M	next	20-24 Stonetalon/Barrens
S	!Tauren
T	xprate	<2.1 << !Undead
T	softcore	
T	completewith	ThievesPickup
A	goto	1413/1,-2516.71,-590.71
A	deathskip	
A	subzoneskip	380
S	!Tauren
T	xprate	<2.1 << !Undead
T	hardcore	
T	completewith	ThievesPickup
A	goto	1413/1,-2680.87,-365.05,150
A	subzoneskip	380
S	!Tauren
T	softcore	
A	goto	1413/1,-2672.76,-544.77
A	accept	870
A	target	Tonga Runetotem
S	!Undead !Tauren
T	xprate	<2.1
T	hardcore	
A	goto	1413/1,-2709.24,-403.57
A	accept	6365
A	target	Zargh
S	!Tauren
A	goto	1413/1,-2670.74,-482.61
A	turnin	842
A	accept	844
A	target	Sergra Darkthorn
A	isOnQuest	842
S	!Tauren
A	goto	1413/1,-2670.74,-482.61
A	accept	844
A	target	Sergra Darkthorn
S	!Tauren
T	hardcore	
A	goto	1413/1,-2672.76,-544.77
A	accept	870
A	target	Tonga Runetotem
S	!Tauren
A	goto	1413/1,-2595.75,-473.15
A	accept	871
A	accept	5041
A	target	Thork
A	maxlevel	15
S	!Undead !Tauren
T	xprate	<2.1
T	hardcore	
A	goto	1413/1,-2595.75,-437.35
A	fp	The Crossroads
A	turnin	6365
A	accept	6384
A	target	Devrak
S	Undead
A	goto	1413/1,-2595.75,-437.35
A	fp	The Crossroads
A	target	Devrak
A	isQuestAvailable	1492
S	!Tauren
A	goto	1413/1,-2589.67,-424.51
A	accept	1492
A	accept	848
A	target	Apothecary Helbrim
A	isQuestAvailable	848
S	!Tauren
A	goto	1413/1,-2589.67,-424.51
A	accept	1492
A	target	Apothecary Helbrim
S	Orc Hunter/Troll Hunter
A	goto	1413/1,-2556.23,-351.54
A	collect	2507,1,871,1
A	money	<0.1751
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<5.7
A	target	Uthrok
A	xp	>15,1
S	Orc Hunter/Troll Hunter
T	optional	
T	completewith	DisruptTheAttacks
A	use	2507
A	itemcount	2507,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<5.7
A	xp	>15,1
S	Troll Hunter/Orc Hunter
A	goto	1413/1,-2556.23,-351.54
A	vendor	
A	collect	2515,1200,870,1 << Hunter
A	target	Uthrok
A	xp	<16,1
S	Orc Warrior
A	goto	1413/1,-2568.39,-356.95
A	collect	1196,1,871,1
A	money	<0.2214
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.2
A	target	Nargal Deatheye
S	Orc Warrior
T	optional	
T	completewith	DisruptTheAttacks
A	use	1196
A	itemcount	1196,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.2
S	Troll Rogue/Orc Rogue
T	season	2
A	goto	1413/1,-2568.39,-356.95
A	collect	2207,1,871,1
A	money	<0.2390
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<7.1
A	target	Nargal Deatheye
S	Troll Rogue/Orc Rogue
T	season	2
T	optional	
T	completewith	DisruptTheAttacks
A	use	2207
A	itemcount	2207,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<7.1
S	Orc Shaman/Troll Shaman
T	xprate	<2.1
A	goto	1413/1,-2568.39,-356.95
A	collect	852,1,871,1
A	money	<0.1739
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.2
A	target	Nargal Deatheye
S	Orc Shaman/Troll Shaman
T	xprate	<2.1
T	optional	
T	completewith	DisruptTheAttacks
A	use	852
A	itemcount	852,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.2
S	Shaman
T	xprate	>2.09
A	goto	1413/1,-2568.39,-356.95
A	collect	852,1,871,1
A	money	<0.1739
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.2
A	target	Nargal Deatheye
S	Shaman
T	xprate	>2.09
T	optional	
T	completewith	DisruptTheAttacks
A	use	852
A	itemcount	852,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.2
S	!Tauren
T	label	ThievesPickup
A	goto	1413/1,-2639.32,-436.00
A	accept	869
A	target	Gazrog
S	!Tauren
T	xprate	<2.1
A	goto	1413/1,-2645.40,-406.94
A	home	
A	target	Innkeeper Boorand Plainswind
A	bindlocation	380
A	isQuestAvailable	1492
S	Undead
T	xprate	>2.09
A	goto	1413/1,-2645.40,-406.94
A	home	
A	target	Innkeeper Boorand Plainswind
A	bindlocation	380
A	isQuestAvailable	1492
S	!Undead !Tauren
T	xprate	>2.09
A	goto	1413/1,-2709.24,-404.24
A	turnin	6386
A	target	Zargh
S	!Undead !Tauren
T	xprate	<2.1
T	softcore	
A	goto	1413/1,-2709.24,-403.57
A	accept	6365
A	target	Zargh
S	Warlock
T	season	2
T	sticky	
T	completewith	BarrensEnd
T	label	ExplorerImp
A	train	445459
A	train	445459,1
A	train	1120,3
A	use	221978
S	Warlock/Mage
T	season	2
T	requires	ExplorerImp << Warlock
T	sticky	
T	completewith	BarrensEnd
T	label	FelPortalRune
A	collect	221499,1 << Warlock
A	collect	223147,1 << Mage
A	itemcount	220792,1 << Mage
A	use	223148 << Warlock
A	use	220792 << Mage
A	train	429311,1 << Mage
A	train	431756,1 << Warlock
A	train	1120,3 << Warlock
A	unitscan	Fel Sliver
A	unitscan	Fel Crack
A	unitscan	Fel Tear
A	unitscan	Fel Scar
A	unitscan	Fel Rift
S	Warlock/Mage
T	season	2
T	requires	FelPortalRune
T	sticky	
T	completewith	BarrensEnd
A	itemcount	221499,1 << Warlock
A	itemcount	223147,1 << Mage
A	train	431756
A	train	429311
A	use	221499 << Warlock
A	use	223147 << Mage
S	
T	completewith	DisruptTheAttacks
A	complete	844,1
A	mob	Greater Plainstrider
A	mob	Fleeting Plainstrider
S	!Tauren !Undead
T	xprate	<1.5
T	completewith	next
T	label	DemonMountain
A	goto	1413/1,-2554.2,80.18,40,0
A	goto	1413/1,-2477.19,136.26,40,0
A	goto	1413/1,-2363.7,232.87,40,0
A	goto	1413/1,-2205.62,314.62,100
A	isOnQuest	924
S	!Tauren !Undead
T	xprate	<1.5
T	completewith	next
T	requires	DemonMountain
A	goto	1413/1,-2205.62,314.62,15
A	isOnQuest	924
S	!Tauren !Undead
T	xprate	<1.5
T	label	DemonSeed
A	goto	1413/1,-2238.04,324.08
A	collect	4986,1,924
A	complete	924,1
A	isOnQuest	924
S	skip
T	xprate	<1.5
T	completewith	DisruptTheAttacks
A	goto	1413/1,-2198.52,303.14,40,0
A	goto	1413/1,-2363.7,232.87,40,0
A	goto	1413/1,-2477.19,136.26,40,0
A	goto	1413/1,-2554.2,80.18,100
A	isQuestComplete	924
S	Shaman
T	sticky	
T	label	FireTar1
A	goto	1413/1,-2947.38,-92.1,50,0
A	goto	1413/1,-2869.35,-49.54,50,0
A	goto	1413/1,-2805.51,-111.02
A	complete	1525,1
A	mob	Razormane Water Seeker
A	mob	Razormane Thornweaver
S	
T	optional	
T	completewith	next
A	complete	871,1
A	mob	+Razormane Water Seeker
A	complete	871,2
A	mob	+Razormane Thornweaver
A	complete	871,3
A	mob	+Razormane Hunter
A	maxlevel	15
S	
A	goto	1413/1,-3021.35,-231.960
A	use	4926
A	collect	4926,1,819
A	accept	819
A	maxlevel	15
S	
T	requires	FireTar1<< Shaman
T	label	DisruptTheAttacks
T	loop	
A	goto	1413/1,-2811.59,-42.780,25,0
A	goto	1413/1,-2875.43,-52.24,25,0
A	goto	1413/1,-2931.16,-89.40,25,0
A	goto	1413/1,-3001.08,-117.78,25,0
A	goto	1413/1,-3037.56,-164.390,25,0
A	goto	1413/1,-3034.52,-221.82,25,0
A	goto	1413/1,-2991.96,-239.39,25,0
A	goto	1413/1,-2899.75,-209.66,25,0
A	goto	1413/1,-2854.15,-151.56,25,0
A	goto	1413/1,-2799.43,-92.78,25,0
A	goto	1413/1,-2811.59,-42.780,25,0
A	complete	871,1
A	mob	+Razormane Water Seeker
A	complete	871,2
A	mob	+Razormane Thornweaver
A	complete	871,3
A	mob	+Razormane Hunter
A	maxlevel	15
S	Warrior !Undead
T	completewith	next
A	goto	1413/1,-2902.79,-276.55,30,0
A	goto	1413/1,-3004.12,-298.17,30,0
A	goto	1413/1,-3110.52,-320.46,30
S	Warrior !Undead
A	goto	1413/1,-3176.39,-437.35
A	turnin	1502
A	accept	1503
A	target	Thun'grim Firegaze
S	Warrior !Undead
A	goto	1413/1,-2955.48,-188.04
A	complete	1503,1
S	Warrior !Undead
T	completewith	next
A	goto	1413/1,-2902.79,-276.55,30,0
A	goto	1413/1,-3004.12,-298.17,30,0
A	goto	1413/1,-3110.52,-320.46,30
S	Warrior !Undead
A	goto	1413/1,-3176.39,-437.35
A	turnin	1503
A	target	Thun'grim Firegaze
S	!Undead !Tauren
T	sticky	
T	completewith	EnterRFC
A	subzone	2437
A	dungeon	RFC
S	
T	optional	
T	completewith	next
A	complete	869,1
A	mob	Sunscale Lashtail
A	mob	Sunscale Screecher
S	
T	label	PlainstriderBeaks
T	loop	
A	goto	1413/1,-2819.70,-359.65,0
A	goto	1413/1,-2784.23,-163.04,80,0
A	goto	1413/1,-2771.06,-306.95,80,0
A	goto	1413/1,-2805.51,-386.00,80,0
A	goto	1413/1,-2738.63,-610.310,80,0
A	goto	1413/1,-2576.50,-610.98,80,0
A	goto	1413/1,-2494.42,-485.32,80,0
A	goto	1413/1,-2448.82,-398.84,80,0
A	goto	1413/1,-2537.99,-260.33,80,0
A	goto	1413/1,-2730.52,-273.17,80,0
A	goto	1413/1,-2819.70,-359.65,80,0
A	complete	844,1
A	mob	Greater Plainstrider
A	mob	Fleeting Plainstrider
S	Tauren Warrior
T	sticky	
T	completewith	KreenigSnarlsnout
A	goto	1413/1,-2697.08,-461.67,0
A	vendor	
A	unitscan	Lizzarik
A	subzoneskip	380,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.5
S	
A	goto	1413/1,-2670.74,-482.61
A	turnin	842
A	turnin	844
A	accept	845
A	target	Sergra Darkthorn
S	
A	goto	1413/1,-2595.75,-473.15
A	turnin	871
A	accept	872
A	target	Thork
A	isQuestComplete	871
S	
T	optional	
A	goto	1413/1,-2595.75,-473.15
A	accept	872
A	target	Thork
A	isQuestTurnedIn	871
S	
T	xprate	<2.1
A	goto	1413/1,-2607.91,-475.180
A	accept	867
A	target	Darsok Swiftdagger
S	!Tauren !Undead
T	softcore	
T	xprate	<2.1
A	goto	1413/1,-2595.75,-437.35
A	turnin	6365
A	accept	6384
A	target	Devrak
S	Orc Hunter/Troll Hunter
T	optional	
A	goto	1413/1,-2556.23,-351.54
A	collect	2507,1,872,1
A	money	<0.1751
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<5.7
A	target	Uthrok
A	xp	>15,1
S	Orc Hunter/Troll Hunter
T	optional	
T	completewith	KreenigSnarlsnout
A	use	2507
A	itemcount	2507,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<5.7
A	xp	>15,1
S	Troll Hunter/Orc Hunter
A	goto	1413/1,-2556.23,-351.54
A	vendor	
A	collect	2515,1200,870,1 << Hunter
A	target	Uthrok
A	xp	<16,1
S	Tauren Hunter
T	optional	
A	goto	1413/1,-2556.23,-351.54
A	collect	2511,1,872,1
A	money	<0.1324
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.9
A	target	Uthrok
S	Tauren Hunter
T	optional	
T	completewith	KreenigSnarlsnout
A	use	2511
A	itemcount	2511,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.9
S	Orc Warrior
T	optional	
A	goto	1413/1,-2568.39,-356.95
A	collect	1196,1,872,1
A	money	<0.2214
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.2
A	target	Nargal Deatheye
S	Orc Warrior
T	optional	
T	completewith	KreenigSnarlsnout
A	use	1196
A	itemcount	1196,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.2
S	Troll Rogue/Orc Rogue
T	optional	
T	season	2
A	goto	1413/1,-2568.39,-356.95
A	collect	2207,1,872,1
A	money	<0.2390
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<7.1
A	target	Nargal Deatheye
S	Troll Rogue/Orc Rogue
T	optional	
T	season	2
T	completewith	KreenigSnarlsnout
A	use	2207
A	itemcount	2207,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<7.1
S	Orc Shaman/Troll Shaman
T	xprate	<2.1
T	optional	
A	goto	1413/1,-2568.39,-356.95
A	collect	852,1,871,1
A	money	<0.1739
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.2
A	target	Nargal Deatheye
S	Orc Shaman/Troll Shaman
T	xprate	<2.1
T	optional	
T	completewith	KreenigSnarlsnout1
A	use	852
A	itemcount	852,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.2
S	Shaman
T	xprate	>2.09
T	optional	
A	goto	1413/1,-2568.39,-356.95
A	collect	852,1,871,1
A	money	<0.1739
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.2
A	target	Nargal Deatheye
S	Shaman
T	xprate	>2.09
T	optional	
T	completewith	KreenigSnarlsnout1
A	use	852
A	itemcount	852,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.2
S	!Undead !Tauren
T	completewith	HiddenEnemiesPickup
A	goto	1413/1,-2595.75,-437.35
A	fly	Orgrimmar
A	zoneskip	Orgrimmar
A	target	Devrak
A	dungeon	RFC
S	Tauren
A	goto	1413/1,-3021.35,-231.96,20,0
A	goto	1413/1,-3029.46,261.25
A	use	4926
A	collect	4926,1,819
A	accept	819
A	dungeon	RFC
S	Tauren
T	completewith	KreenigSnarlsnout1
A	goto	1413/1,-3127.75,-55.62,50,0
A	goto	1413/1,-3382.10,-54.27,50,0
A	complete	872,1
A	mob	+Razormane Geomancer
A	complete	872,2
A	mob	+Razormane Defender
A	dungeon	RFC
A	isOnQuest	872
S	Tauren
T	completewith	next
A	complete	5041,1
A	dungeon	RFC
A	isOnQuest	872
S	Tauren
T	label	KreenigSnarlsnout1
A	goto	1413/1,-3324.34,-217.09
A	complete	872,3
A	mob	Kreenig Snarlsnout
A	dungeon	RFC
A	isOnQuest	872
S	Tauren
T	optional	
T	completewith	next
A	goto	1413/1,-3127.75,-55.62,50,0
A	goto	1413/1,-3382.10,-54.27,50,0
A	complete	872,1
A	mob	+Razormane Geomancer
A	complete	872,2
A	mob	+Razormane Defender
A	dungeon	RFC
A	isOnQuest	872
S	Tauren
A	goto	1413/1,-3292.92,-212.36,30,0
A	goto	1413/1,-3402.36,-48.19
A	complete	5041,1
A	dungeon	RFC
A	isOnQuest	872
S	Tauren
T	loop	
A	goto	1413/1,-3345.62,-101.56,0
A	goto	1413/1,-3393.24,-102.24,50,0
A	goto	1413/1,-3419.59,-40.08,50,0
A	goto	1413/1,-3419.59,-0.89,50,0
A	goto	1413/1,-3361.83,-1.57,50,0
A	goto	1413/1,-3317.24,-7.65,50,0
A	goto	1413/1,-3237.19,-27.92,50,0
A	goto	1413/1,-3139.91,-46.16,50,0
A	goto	1413/1,-3126.74,-101.56,50,0
A	goto	1413/1,-3178.42,-107.64,50,0
A	goto	1413/1,-3205.78,-119.13,50,0
A	goto	1413/1,-3218.95,-81.97,50,0
A	goto	1413/1,-3278.74,-75.21,50,0
A	goto	1413/1,-3345.62,-101.56,50,0
A	complete	872,1
A	mob	+Razormane Geomancer
A	complete	872,2
A	mob	+Razormane Defender
A	dungeon	RFC
A	isOnQuest	872
S	Tauren
T	optional	
T	completewith	next
A	complete	845,1
A	mob	Zhevra Runner
A	dungeon	RFC
S	Tauren Shaman
T	completewith	next
A	goto	1411/1,-3905.13,-228.41,10,0
A	goto	1411/1,-3899.31,-241.45,8,0
A	goto	1411/1,-3899.31,-241.45,8,0
A	goto	1411/1,-3906.71,-270.71,8,0
A	goto	1411/1,-3910.94,-247.45,8,0
A	goto	1411/1,-3931.56,-240.75,8,0
A	goto	1411/1,-3964.35,-242.51,8,0
A	goto	1411/1,-3974.39,-228.76,8,0
A	goto	1411/1,-4020.92,-219.95,8,0
A	goto	1411/1,-4034.67,-232.64,8,0
A	goto	1411/1,-4033.08,-255.91,10
A	dungeon	RFC
S	Tauren Shaman
A	goto	1411/1,-3999.24,-268.95
A	turnin	1525
A	accept	1526
A	target	Telf Joolam
A	dungeon	RFC
S	Tauren Shaman
T	completewith	next
A	goto	1411/1,-3981.27,-256.61
A	cast	8898
A	use	6636
A	dungeon	RFC
S	Tauren Shaman
A	goto	1411/1,-4022.51,-243.92
A	complete	1526,1
A	mob	Minor Manifestation of Fire
A	dungeon	RFC
S	Tauren Shaman
A	goto	1411/1,-4022.51,-243.92
A	turnin	1526
A	accept	1527
A	dungeon	RFC
S	Tauren Shaman
A	goto	1413/1,-3037.56,264.63
A	turnin	1527
A	target	Kranal Fiss
A	dungeon	RFC
S	Tauren Shaman
A	goto	1413/1,-3029.46,261.25
A	use	4926
A	collect	4926,1,819
A	accept	819
A	dungeon	RFC
S	Tauren
T	sticky	
T	completewith	EnterRFC
A	subzone	2437
A	dungeon	RFC
S	Tauren
T	completewith	HiddenEnemiesPickup
A	goto	1454/1,-4367.46,1405.44,50,0
A	zone	Orgrimmar
A	dungeon	RFC
S	Tauren
A	goto	1454/1,-4313.60,1676.24
A	fp	Orgrimmar
A	target	Doras
A	isQuestAvailable	5728
A	dungeon	RFC
S	!Undead
A	goto	1454/1,-4125.79,1920.10
A	accept	5726
A	target	Thrall
A	dungeon	RFC
S	!Undead
A	goto	1411/1,-4769.10,1484.39,0
A	complete	5726,1
A	dungeon	RFC
S	!Undead
A	goto	1454/1,-4125.79,1920.10
A	turnin	5726
A	accept	5727
A	target	Thrall
A	dungeon	RFC
S	!Undead
A	goto	1454/1,-4376.29,1802.43
A	accept	5761
A	target	Neeru Fireblade
A	dungeon	RFC
S	!Undead
A	goto	1454/1,-4376.29,1802.43
A	complete	5727,1
A	skipgossip	
A	target	Neeru Fireblade
A	dungeon	RFC
S	!Undead
T	label	HiddenEnemiesPickup
A	goto	1454/1,-4125.79,1920.10
A	turnin	5727
A	accept	5728
A	target	Thrall
A	dungeon	RFC
S	!Undead
T	completewith	EnterRFC
A	destroy	14544
S	!Undead
T	label	EnterRFC
A	goto	1454/1,-4420.76,1815.80
A	subzone	2437
A	dungeon	RFC
S	!Undead
A	accept	5722
A	accept	5723
A	dungeon	RFC
S	!Undead
T	optional	
T	completewith	next
A	complete	5723,1
A	mob	+Ragefire Trogg
A	complete	5723,2
A	mob	+Ragefire Shaman
A	isOnQuest	5723
A	dungeon	RFC
S	!Undead
A	turnin	5722
A	accept	5724
A	target	Maur Grimtotem
A	isOnQuest	5722
A	dungeon	RFC
S	!Undead
T	optional	
A	accept	5724
A	target	Maur Grimtotem
A	isQuestTurnedIn	5722
A	dungeon	RFC
S	!Undead
T	label	TroggsShamans
A	complete	5723,1
A	mob	+Ragefire Trogg
A	complete	5723,2
A	mob	+Ragefire Shaman
A	isOnQuest	5723
A	dungeon	RFC
S	!Undead
T	optional	
T	requires	TroggsShamans
T	completewith	BazzalanandJergosh
A	complete	5725,1
A	complete	5725,2
A	mob	Searing Blade Cultist
A	mob	Searing Blade Warlock
A	isOnQuest	5725
A	dungeon	RFC
S	!Undead
A	complete	5761,1
A	mob	Taragaman the Hungerer
A	isOnQuest	5761
A	dungeon	RFC
S	!Undead
T	label	BazzalanandJergosh
A	complete	5728,1
A	mob	+Bazzalan
A	complete	5728,2
A	mob	+Jergosh the Invoker
A	isOnQuest	5728
A	dungeon	RFC
S	!Undead
A	complete	5725,1
A	complete	5725,2
A	mob	Searing Blade Cultist
A	mob	Searing Blade Warlock
A	isOnQuest	5725
A	dungeon	RFC
S	!Undead
A	goto	1454/1,-4376.29,1802.43
A	turnin	5761
A	target	Neeru Fireblade
A	isQuestComplete	5761
A	dungeon	RFC
S	!Undead
A	goto	1454/1,-4125.79,1920.10
A	turnin	5728
A	accept	5729
A	target	Thrall
A	isQuestComplete	5728
A	dungeon	RFC
S	!Undead
A	goto	1454/1,-4125.79,1920.10
A	accept	5729
A	target	Thrall
A	isQuestTurnedIn	5728
A	dungeon	RFC
S	!Undead
A	goto	1454/1,-4376.29,1802.43
A	turnin	5729
A	accept	5730
A	target	Neeru Fireblade
A	dungeon	RFC
A	isQuestTurnedIn	5728
S	!Undead
A	goto	1454/1,-4125.79,1920.10
A	turnin	5730
A	target	Thrall
A	isQuestTurnedIn	5728
A	dungeon	RFC
S	Tauren
T	completewith	RFCTurninsTB1
A	goto	Orgrimmar,45.120,63.889
A	fly	Thunder Bluff
A	target	Doras
A	zoneskip	Orgrimmar,1
A	isOnQuest	5724
A	isQuestComplete	5723
A	dungeon	RFC
S	!Tauren
T	completewith	KreenigSnarlsnout
A	hs	
A	use	6948
A	bindlocation	380
A	zoneskip	The Barrens
A	dungeon	RFC
S	Orc Warrior/Troll Warrior/Orc Shaman/Troll Shaman
T	completewith	RFCTurninsTB1
A	goto	1413/1,-2595.75,-437.35
A	fly	Thunder Bluff
A	target	Devrak
A	isOnQuest	5724
A	isQuestComplete	5723
A	dungeon	RFC
A	zoneskip	Thunder Bluff
S	skip
T	completewith	RFCTurninsTB1
A	goto	1412/1,-1480.52,-2339.56,120,0
A	zone	Thunder Bluff
A	isOnQuest	5724
A	isQuestComplete	5723
A	dungeon	RFC
S	skip
A	goto	1413/1,-1881.35,-2384.50
A	fp	Camp Taurajo
A	target	Omusa Thunderhorn
A	dungeon	RFC
A	isOnQuest	5724
A	isQuestComplete	5723
S	Tauren/Orc Warrior/Troll Warrior/Orc Shaman/Troll Shaman
T	completewith	RFCTurninsTB1
A	goto	1456/1,-212.71,-1065.010,80
A	isOnQuest	5724
A	isQuestComplete	5723
A	dungeon	RFC
S	Tauren/Orc Warrior/Troll Warrior/Orc Shaman/Troll Shaman
A	goto	1456/1,-218.13,-1055.97
A	turnin	5724
A	turnin	5723
A	target	Rahauro
A	isOnQuest	5724
A	isQuestComplete	5723
A	dungeon	RFC
S	Tauren/Orc Warrior/Troll Warrior/Orc Shaman/Troll Shaman
A	goto	1456/1,-218.13,-1055.97
A	turnin	5724
A	target	Rahauro
A	isOnQuest	5724
A	zoneskip	Thunder Bluff,1
A	dungeon	RFC
S	Tauren/Orc Warrior/Troll Warrior/Orc Shaman/Troll Shaman
T	label	RFCTurninsTB1
A	goto	1456/1,-218.13,-1055.97
A	turnin	5723
A	target	Rahauro
A	isQuestComplete	5723
A	zoneskip	Thunder Bluff,1
A	dungeon	RFC
S	skip
A	goto	1456/1,26.1,-1196.66
A	fly	Thunder Bluff
A	target	Tal
A	zoneskip	Thunder Bluff,1
A	dungeon	RFC
S	
T	completewith	KreenigSnarlsnout
A	hs	
A	use	6948
A	zoneskip	Thunder Bluff,1
A	bindlocation	380
A	cooldown	item,6948,>0
A	dungeon	RFC
S	
T	optional	
T	completewith	KreenigSnarlsnout
A	goto	1456/1,26.1,-1196.66
A	fly	Crossroads
A	target	Tal
A	zoneskip	Thunder Bluff,1
A	cooldown	item,6948,<0
A	dungeon	RFC
S	
A	goto	1413/1,-3021.35,-231.96,20,0
A	goto	1413/1,-3029.46,261.25
A	use	4926
A	collect	4926,1,819
A	accept	819
S	
T	optional	
T	completewith	KreenigSnarlsnout
A	goto	1413/1,-3127.75,-55.62,50,0
A	goto	1413/1,-3382.10,-54.27,50,0
A	complete	872,1
A	mob	+Razormane Geomancer
A	complete	872,2
A	mob	+Razormane Defender
A	isOnQuest	872
S	
T	completewith	next
A	complete	5041,1
A	isOnQuest	872
S	
T	label	KreenigSnarlsnout
A	goto	1413/1,-3324.34,-217.09
A	complete	872,3
A	mob	Kreenig Snarlsnout
A	isOnQuest	872
S	Warlock
T	season	2
A	train	403932,1
A	goto	1413/1,-3274.68,-191.42
A	cast	1454
A	cast	735
A	collect	208750,1
A	isOnQuest	872
S	Warlock
T	season	2
A	use	208750
A	itemcount	208750,1
A	train	403932
A	isOnQuest	872
S	
T	completewith	next
A	goto	1413/1,-3127.75,-55.62,50,0
A	goto	1413/1,-3382.10,-54.27,50,0
A	complete	872,1
A	mob	+Razormane Geomancer
A	complete	872,2
A	mob	+Razormane Defender
A	isOnQuest	872
S	
A	goto	1413/1,-3292.92,-212.36,30,0
A	goto	1413/1,-3402.36,-48.19
A	complete	5041,1
A	isOnQuest	872
S	
T	loop	
A	goto	1413/1,-3345.62,-101.56,0
A	goto	1413/1,-3393.24,-102.24,50,0
A	goto	1413/1,-3419.59,-40.08,50,0
A	goto	1413/1,-3419.59,-0.89,50,0
A	goto	1413/1,-3361.83,-1.57,50,0
A	goto	1413/1,-3317.24,-7.65,50,0
A	goto	1413/1,-3237.19,-27.92,50,0
A	goto	1413/1,-3139.91,-46.16,50,0
A	goto	1413/1,-3126.74,-101.56,50,0
A	goto	1413/1,-3178.42,-107.64,50,0
A	goto	1413/1,-3205.78,-119.13,50,0
A	goto	1413/1,-3218.95,-81.97,50,0
A	goto	1413/1,-3278.74,-75.21,50,0
A	goto	1413/1,-3345.62,-101.56,50,0
A	complete	872,1
A	mob	+Razormane Geomancer
A	complete	872,2
A	mob	+Razormane Defender
A	isOnQuest	872
S	!Tauren !Undead
T	completewith	next
A	complete	845,1
A	mob	Zhevra Runner
A	isQuestComplete	924
S	!Tauren !Undead
T	xprate	<1.5
A	goto	1413/1,-3694.2,256.52
A	turnin	924
A	target	Ak'Zeloth
A	isQuestComplete	924
S	Shaman
T	completewith	ShamanDurotar
A	complete	869,1
A	mob	Sunscale Lashtail
A	mob	Sunscale Screecher
S	Shaman
T	completewith	ShamanDurotar
A	complete	845,1
A	mob	Zhevra Runner
S	Shaman
T	completewith	CallofFire3
T	label	ShamanDurotar
A	goto	1411/1,-3905.13,-228.41
A	zone	Durotar
A	isOnQuest	1525
S	Shaman
T	requires	ShamanDurotar
T	completewith	next
A	goto	1411/1,-3905.13,-228.41,10,0
A	goto	1411/1,-3899.31,-241.45,8,0
A	goto	1411/1,-3899.31,-241.45,8,0
A	goto	1411/1,-3906.71,-270.71,8,0
A	goto	1411/1,-3910.94,-247.45,8,0
A	goto	1411/1,-3931.56,-240.75,8,0
A	goto	1411/1,-3964.35,-242.51,8,0
A	goto	1411/1,-3974.39,-228.76,8,0
A	goto	1411/1,-4020.92,-219.95,8,0
A	goto	1411/1,-4034.67,-232.64,8,0
A	goto	1411/1,-4033.08,-255.91,10
S	Shaman
T	label	CallofFire3
T	requires	ShamanDurotar
A	goto	1411/1,-3999.24,-268.95
A	turnin	1525
A	accept	1526
A	target	Telf Joolam
S	Shaman
T	completewith	next
A	goto	1411/1,-3981.27,-256.61
A	cast	8898
A	use	6636
S	Shaman
A	goto	1411/1,-4022.51,-243.92
A	complete	1526,1
A	mob	Minor Manifestation of Fire
S	Shaman
A	goto	1411/1,-4022.51,-243.92
A	turnin	1526
A	accept	1527
S	Shaman
T	completewith	FireEnd
A	complete	869,1
A	mob	Sunscale Lashtail
A	mob	Sunscale Screecher
S	Shaman
T	completewith	next
A	complete	845,1
A	mob	Zhevra Runner
A	dungeon	RFC
S	Shaman
T	label	FireEnd
A	goto	1413/1,-3037.56,264.63
A	turnin	1527
A	target	Kranal Fiss
S	Shaman
A	goto	1413/1,-3029.46,261.25
A	use	4926
A	collect	4926,1,819
A	accept	819
S	skip
T	completewith	RatchetEnter
A	complete	869,1
A	mob	Sunscale Screecher
S	
T	completewith	next
A	goto	1413/1,-3851.27,-526.53,100,0
A	complete	845,1
A	mob	Zhevra Runner
S	
T	label	RatchetEnter
A	goto	1413/1,-3728.66,-835.29
A	subzone	392
A	isOnQuest	845
S	
A	goto	1413/1,-3728.66,-835.29
A	accept	887
A	target	Gazlowe
A	maxlevel	16
S	
T	completewith	next
A	goto	1413/1,-3770.20,-898.12
A	fp	Ratchet
A	target	Bragok
S	
A	goto	1413/1,-3759.06,-902.18
A	accept	894
A	target	Sputtervalve
A	maxlevel	16
S	
A	goto	1413/1,-3719.54,-919.07
A	accept	895
A	maxlevel	16
S	Undead Warrior
A	goto	1413/1,-3684.07,-919.74
A	collect	2024,1,895,1
A	money	<0.6397
A	target	Ironzar
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.5
S	Undead Warrior
T	optional	
T	completewith	BaronLongshore
A	use	2024
A	itemcount	2024,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.5
A	xp	>16,1
S	Undead Warrior
T	optional	
T	completewith	BaronLongshore
A	use	2024
A	itemcount	2024,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.5
A	xp	<16,1
S	Troll Warrior
A	goto	1413/1,-3684.07,-919.74
A	collect	2030,1,850,1
A	money	<0.5544
A	target	Ironzar
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.9
S	Troll Warrior
T	optional	
T	completewith	BaronLongshore
A	use	2030
A	itemcount	2030,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.9
S	Orc Warrior
A	goto	1413/1,-3684.07,-919.74
A	collect	2025,1,850,1
A	money	<0.5304
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.8
S	Orc Warrior
T	optional	
T	completewith	BaronLongshore
A	use	2025
A	itemcount	2025,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.8
S	Tauren Warrior
A	goto	1413/1,-3684.07,-919.74
A	collect	2026,1,850,1
A	money	<0.6286
A	target	Ironzar
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.5
S	Tauren Warrior
T	optional	
T	completewith	BaronLongshore
A	use	2026
A	itemcount	2026,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.5
A	xp	<16,1
S	Tauren Warrior
T	optional	
T	completewith	BaronLongshore
A	use	2026
A	itemcount	2026,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.5
A	xp	>16,1
S	Shaman
T	season	0
A	goto	1413/1,-3684.07,-919.74
A	collect	2030,1,895,1
A	money	<0.5544
A	target	Ironzar
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.9
S	Shaman
T	season	0
T	optional	
T	completewith	BaronLongshore
A	use	2030
A	itemcount	2030,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.9
S	Shaman
T	season	2
A	goto	1413/1,-3684.07,-919.74
A	collect	2028,1,895,1
A	money	<0.5065
A	target	Ironzar
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.5
S	Shaman
T	season	2
T	optional	
T	completewith	BaronLongshore
A	use	2028
A	itemcount	2028,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.5
S	Rogue
T	season	0
A	goto	1413/1,-3684.07,-919.74
A	collect	2027,1,895,1
A	money	<0.3815
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.6
A	target	Ironzar
S	Rogue
T	season	0
T	optional	
T	completewith	BaronLongshore
A	use	2027
A	itemcount	2027,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.6
S	Rogue
T	season	0
A	goto	1413/1,-3684.07,-919.74
A	collect	2027,2,895,1
A	money	<0.3815
A	itemStat	17,QUALITY,<7
A	itemStat	17,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.6
A	target	Ironzar
S	skip
T	season	0
T	optional	
T	completewith	BaronLongshore
A	use	2027
A	itemcount	2027,1
A	itemStat	17,QUALITY,<7
A	itemStat	17,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.6
S	Rogue
T	season	2
A	goto	1413/1,-3684.07,-919.74
A	collect	2208,1,895,1
A	money	<0.3842
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.4
A	target	Ironzar
S	Rogue
T	season	2
T	optional	
T	completewith	BaronLongshore
A	use	2208
A	itemcount	2208,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.4
S	
A	goto	1413/1,-3687.11,-981.22
A	turnin	819
A	accept	821
A	target	Brewmaster Drohn
S	
A	goto	1413/1,-3664.82,-1050.14
A	vendor	
A	collect	4592,20,895,1
A	collect	1205,10,895,1 << Mage/Warlock/Priest/Shaman/Druid
A	target	Innkeeper Wiley
A	isOnQuest	887
S	
T	completewith	BaronLongshore
A	destroy	5088
S	
T	completewith	BaronLongshore
A	complete	887,1
A	mob	+Southsea Brigand
A	complete	887,2
A	mob	+Southsea Cannoneer
S	Orc Rogue/Troll Rogue
T	completewith	Southsea
A	complete	1963,1
A	unitscan	Tazan
S	
T	label	BaronLongshore
T	loop	
A	goto	1413/1,-3883.70,-1572.40,0
A	goto	1413/1,-3818.84,-1707.52,0
A	goto	1413/1,-3724.60,-1746.71,0
A	goto	1413/1,-3883.70,-1572.40,50,0
A	goto	1413/1,-3818.84,-1707.52,50,0
A	goto	1413/1,-3724.60,-1746.71,50,0
A	complete	895,1
A	unitscan	Baron Longshore
A	isOnQuest	895
S	
T	label	Southsea
T	loop	
A	goto	1413/1,-3885.72,-1569.690,0
A	goto	1413/1,-3902.95,-1366.33,50,0
A	goto	1413/1,-3823.91,-1512.94,50,0
A	goto	1413/1,-3885.72,-1569.690,50,0
A	complete	887,1
A	mob	+Southsea Brigand
A	complete	887,2
A	mob	+Southsea Cannoneer
A	isOnQuest	887
S	Orc Rogue/Troll Rogue
A	goto	1413/1,-3832.02,-1381.87,50,0
A	goto	1413/1,-3730.68,-1364.98,50,0
A	goto	1413/1,-3677.99,-1392.00
A	complete	1963,1
A	unitscan	Tazan
A	isOnQuest	1963
A	maxlevel	16
S	
A	goto	1413/1,-3728.66,-835.29
A	turnin	887
A	turnin	895
A	accept	890
A	target	Gazlowe
A	isQuestComplete	887
A	isQuestComplete	895
S	
T	optional	
A	goto	1413/1,-3728.66,-835.29
A	accept	890
A	target	Gazlowe
A	isQuestTurnedIn	887
S	
A	goto	1413/1,-3796.55,-985.28
A	turnin	1492
A	turnin	890
A	accept	892
A	accept	896
A	target	Wharfmaster Dizzywig
A	isQuestTurnedIn	887
S	
A	goto	1413/1,-3796.55,-985.28
A	turnin	1492
A	accept	896
A	target	Wharfmaster Dizzywig
S	
A	goto	1413/1,-3728.66,-835.29
A	turnin	892
A	accept	888
A	target	Gazlowe
A	isQuestTurnedIn	887
S	Undead Warrior
A	goto	1413/1,-3684.07,-919.74
A	collect	2024,1,850,1
A	money	<0.6397
A	target	Ironzar
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.5
S	Undead Warrior
T	optional	
T	completewith	FlyToXroads1
A	use	2024
A	itemcount	2024,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.5
A	xp	>16,1
S	Undead Warrior
T	optional	
T	completewith	FlyToXroads1
A	use	2024
A	itemcount	2024,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.5
A	xp	<16,1
S	Troll Warrior
A	goto	1413/1,-3684.07,-919.74
A	collect	2030,1,850,1
A	money	<0.5544
A	target	Ironzar
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.9
S	Troll Warrior
T	optional	
T	completewith	FlyToXroads1
A	use	2030
A	itemcount	2030,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.9
S	Orc Warrior
A	goto	1413/1,-3684.07,-919.74
A	collect	2025,1,850,1
A	money	<0.5304
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.8
S	Orc Warrior
T	optional	
T	completewith	FlyToXroads1
A	use	2025
A	itemcount	2025,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.8
S	Tauren Warrior
A	goto	1413/1,-3684.07,-919.74
A	collect	2026,1,850,1
A	money	<0.6286
A	target	Ironzar
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.5
S	Tauren Warrior
T	optional	
T	completewith	FlyToXroads1
A	use	2026
A	itemcount	2026,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.5
A	xp	>16,1
S	Tauren Warrior
T	optional	
T	completewith	FlyToXroads1
A	use	2026
A	itemcount	2026,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.5
A	xp	<16,1
S	Shaman
T	season	0
A	goto	1413/1,-3684.07,-919.74
A	collect	2030,1,850,1
A	money	<0.5544
A	target	Ironzar
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.9
S	Shaman
T	season	0
T	optional	
T	completewith	FlyToXroads1
A	use	2030
A	itemcount	2030,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.9
S	Shaman
T	season	2
A	goto	1413/1,-3684.07,-919.74
A	collect	2028,1,850,1
A	money	<0.5065
A	target	Ironzar
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.5
S	Shaman
T	season	2
T	optional	
T	completewith	FlyToXroads1
A	use	2028
A	itemcount	2028,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.5
S	Rogue
T	season	0
A	goto	1413/1,-3684.07,-919.74
A	collect	2027,1,850,1
A	money	<0.3815
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.6
A	target	Ironzar
S	Rogue
T	season	0
T	optional	
T	completewith	FlyToXroads1
A	use	2027
A	itemcount	923,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.6
S	Rogue
T	season	0
A	goto	1413/1,-3684.07,-919.74
A	collect	2027,2,850,1
A	money	<0.3815
A	itemStat	17,QUALITY,<7
A	itemStat	17,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.6
A	target	Ironzar
S	Rogue
T	season	0
T	optional	
T	completewith	FlyToXroads1
A	use	2027
A	itemcount	2027,1
A	itemStat	17,QUALITY,<7
A	itemStat	17,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.6
S	Rogue
T	season	2
A	goto	1413/1,-3684.07,-919.74
A	collect	2208,1,850,1
A	money	<0.3842
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.4
A	target	Ironzar
S	Rogue
T	season	2
T	optional	
T	completewith	FlyToXroads1
A	use	2208
A	itemcount	2208,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.4
S	
T	label	FlyToXroads1
T	completewith	XroadsTurnins3
A	goto	1413/1,-3770.20,-898.12
A	fly	Crossroads
A	target	Bragok
A	subzoneskip	380
A	isQuestComplete	845
S	
T	completewith	next
A	complete	869,1
A	mob	Sunscale Lashtail
A	mob	Sunscale Screecher
S	
T	loop	
A	goto	1413/1,-2977.78,-942.71,0
A	goto	1413/1,-2274.52,-870.42,0
A	goto	1413/1,-2977.78,-942.71,80,0
A	goto	1413/1,-2832.87,-990.01,80,0
A	goto	1413/1,-2710.26,-959.6,80,0
A	goto	1413/1,-2392.07,-900.83,80,0
A	goto	1413/1,-2274.52,-870.42,80,0
A	complete	845,1
A	mob	Zhevra Runner
S	
A	goto	1413/1,-2595.75,-473.15
A	turnin	5041
A	turnin	872
A	target	Thork
A	isQuestComplete	5041
A	isQuestComplete	872
S	
T	optional	
A	goto	1413/1,-2595.75,-473.15
A	turnin	872
A	target	Thork
A	isQuestComplete	5041
S	
T	optional	
A	goto	1413/1,-2595.75,-473.15
A	turnin	5041
A	target	Thork
A	isQuestComplete	5041
S	
T	optional	
T	completewith	RegtharDeathgate1
A	abandon	871
A	abandon	5041
S	
T	label	XroadsTurnins3
A	goto	1413/1,-2669.72,-481.94
A	turnin	845
A	accept	903
A	target	Sergra Darkthorn
S	skip
A	goto	1413/1,-2612.98,-411.00
A	collect	2515,1200,850,1 << Hunter
A	target	Barg
S	Tauren Hunter
A	goto	1413/1,-2612.98,-411.00
A	collect	2519,1000,850,1 << Hunter
A	target	Barg
S	Troll Hunter/Orc Hunter
A	goto	1413/1,-2556.23,-351.54
A	vendor	
A	collect	2515,1200,870,1 << Hunter
A	target	Uthrok
S	Tauren Hunter
A	goto	1413/1,-2556.23,-351.54
A	collect	2511,1,871,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.9
A	target	Uthrok
S	
T	completewith	RegtharDeathgate1
A	complete	821,2
A	mob	Greater Plainstrider
A	mob	Fleeting Plainstrider
A	maxlevel	16
S	
T	completewith	next
A	complete	869,1
A	mob	Sunscale Lashtail
A	mob	Sunscale Screecher
S	
T	xprate	<2.1
A	goto	1413/1,-1972.55,-306.95
A	accept	850
A	accept	855
A	target	Regthar Deathgate
S	
T	xprate	>2.09
A	goto	1413/1,-1972.55,-306.95
A	accept	850
A	target	Regthar Deathgate
S	
T	optional	
T	label	RegtharDeathgate1
S	
T	xprate	<2.1
T	completewith	KodobaneTurnin
A	complete	855,1
A	mob	Kolkar Wrangler
A	mob	Kolkar Stormer
A	isOnQuest	855
S	
T	completewith	Barak
A	complete	848,1
S	Druid
T	season	2
A	goto	1413/1,-1909.72,113.96
A	collect	208682,1
A	train	416049,1
S	
A	goto	1413/1,-1943.16,89.64
A	complete	870,1
S	
T	label	Barak
A	goto	1413/1,-1716.18,23.43
A	complete	850,1
A	mob	Barak Kodobane
S	
T	completewith	KodobaneTurnin
A	complete	869,1
A	mob	Sunscale Lashtail
A	mob	Sunscale Screecher
S	
T	xprate	>2.09
T	loop	
A	goto	1413/1,-1594.58,30.19,0
A	goto	1413/1,-1594.58,30.19,50,0
A	goto	1413/1,-1562.15,-29.94,50,0
A	goto	1413/1,-1483.11,66.67,50,0
A	goto	1413/1,-1531.75,180.85,50,0
A	goto	1413/1,-1462.84,214.63,50,0
A	complete	903,1
A	complete	821,1
A	mob	Savannah Prowler
S	
T	xprate	<2.1
A	goto	1413/1,-1972.55,-306.95
A	turnin	850
A	accept	851
A	turnin	855
A	target	Regthar Deathgate
A	isQuestComplete	855
S	
T	xprate	<2.1
T	label	KodobaneTurnin
A	goto	1413/1,-1972.55,-306.95
A	turnin	850
A	accept	851
A	target	Regthar Deathgate
S	
T	xprate	<2.1
T	optional	
A	goto	1413/1,-1972.55,-306.95
A	accept	851
A	target	Regthar Deathgate
A	isQuestTurnedIn	850
S	
T	optional	
T	xprate	>2.09
A	goto	1413/1,-1972.55,-306.95
A	turnin	850
A	turnin	855
A	target	Regthar Deathgate
A	isQuestComplete	855
S	
T	xprate	>2.09
T	label	KodobaneTurnin
A	goto	1413/1,-1972.55,-306.95
A	turnin	850
A	target	Regthar Deathgate
S	
T	completewith	next
A	complete	869,1
A	mob	Sunscale Lashtail
A	mob	Sunscale Screecher
S	
T	loop	
A	goto	1413/1,-1594.58,30.19,0
A	goto	1413/1,-1594.58,30.19,50,0
A	goto	1413/1,-1562.15,-29.94,50,0
A	goto	1413/1,-1483.11,66.67,50,0
A	goto	1413/1,-1531.75,180.85,50,0
A	goto	1413/1,-1462.84,214.63,50,0
A	complete	903,1
A	complete	821,1
A	mob	Savannah Prowler
S	
T	xprate	<2.1
T	loop	
A	goto	1413/1,-1616.87,611.90,0
A	goto	1413/1,-1583.43,322.73,60,0
A	goto	1413/1,-1513.51,380.84,60,0
A	goto	1413/1,-1526.68,477.450,60,0
A	goto	1413/1,-1555.06,545.69,60,0
A	goto	1413/1,-1553.03,615.95,60,0
A	goto	1413/1,-1616.87,611.90,60,0
A	complete	867,1
A	mob	Witchwing Harpy
A	mob	Witchwing Roguefeather
S	skip --!Tauren
T	completewith	next
A	zone	Stonetalon Mountains
A	zoneskip	Stonetalon Mountains
A	dungeon	RFC
A	isOnQuest	5724
A	isQuestComplete	5723
S	skip --!Tauren
T	completewith	next
A	goto	1442/1,-786.33,-294.97,60,0
A	goto	1442/1,-665.72,-280.97,40,0
A	goto	1442/1,-522.63,-294.32,40
A	dungeon	RFC
A	isOnQuest	5724
A	isQuestComplete	5723
S	skip --!Tauren
A	goto	1442/1,-401.53,-277.710
A	goto	1456/1,-74.62,-981.93,30
A	link	https://www.youtube.com/watch?v=cp2YI86AO4Y&ab
A	dungeon	RFC
A	isOnQuest	5724
A	isQuestComplete	5723
S	skip --!Tauren
T	completewith	RFCPickups
A	goto	1456/1,-13.04,-1107.95,40
A	isOnQuest	5724
A	isQuestComplete	5723
A	dungeon	RFC
S	skip --!Tauren
T	completewith	next
A	goto	1456/1,-212.71,-1065.010,80
A	isOnQuest	5724
A	isQuestComplete	5723
A	dungeon	RFC
S	skip --!Tauren
A	goto	1456/1,-218.13,-1055.97
A	turnin	5724
A	turnin	5723
A	target	Rahauro
A	dungeon	RFC
A	isOnQuest	5724
A	isQuestComplete	5723
S	skip --!Tauren
A	goto	1456/1,-218.13,-1055.97
A	turnin	5724
A	target	Rahauro
A	dungeon	RFC
A	isOnQuest	5724
S	skip --!Tauren
A	goto	1456/1,-218.13,-1055.97
A	turnin	5723
A	target	Rahauro
A	dungeon	RFC
A	isQuestComplete	5723
S	skip --!Tauren
T	completewith	Samophlange
A	hs	
A	cooldown	item,6948,>0
A	use	6948
A	dungeon	RFC
S	skip --!Tauren
T	completewith	Samophlange
A	goto	1456/1,26.1,-1196.66
A	fly	Crossroads
A	target	Tal
A	cooldown	item,6948,<0
A	zoneskip	The Barrens
A	dungeon	RFC
S	
T	optional	
A	abandon	5723
A	dungeon	RFC
S	
T	optional	
A	abandon	5725
A	dungeon	RFC
S	
T	optional	
A	abandon	5728
A	dungeon	RFC
S	
T	optional	
A	abandon	5761
A	dungeon	RFC
S	skip --!Tauren Orc !Warrior !Shaman/Troll !Warrior !Shaman
T	xprate	<2.1
A	goto	1413/1,-2589.67,-424.51
A	turnin	848
A	target	Apothecary Helbrim
A	isQuestComplete	848
A	dungeon	RFC
S	skip --!Tauren Orc !Warrior !Shaman/Troll !Warrior !Shaman
T	xprate	<2.1
A	goto	1413/1,-2607.91,-475.180
A	turnin	867
A	accept	875
A	target	Darsok Swiftdagger
A	dungeon	RFC
S	skip --!Tauren Orc !Warrior !Shaman/Troll !Warrior !Shaman
T	xprate	<2.1
A	goto	1413/1,-2672.76,-544.77
A	turnin	870
A	accept	877
A	target	Tonga Runetotem
A	dungeon	RFC
S	skip --!Tauren Orc !Warrior !Shaman/Troll !Warrior !Shaman
T	xprate	<2.1
A	goto	1413/1,-2670.74,-482.61
A	turnin	903
A	accept	881
A	target	Sergra Darkthorn
A	dungeon	RFC
S	skip --!Tauren Orc !Warrior !Shaman/Troll !Warrior !Shaman
T	xprate	<2.1
A	goto	1413/1,-3031.48,461.91
A	complete	881,1
A	mob	Echeyakee
A	use	10327
A	dungeon	RFC
S	skip --!Tauren Orc !Warrior !Shaman/Troll !Warrior !Shaman
T	xprate	<2.1
A	goto	1413/1,-2669.72,-481.94
A	abandon	881
A	itemcount	5100,<1
A	dungeon	RFC
S	skip --!Tauren Orc !Warrior !Shaman/Troll !Warrior !Shaman
T	xprate	<2.1
A	goto	1413/1,-2670.74,-482.61
A	accept	881
A	target	Sergra Darkthorn
A	itemcount	5100,<1
A	dungeon	RFC
S	skip --!Tauren Orc !Warrior !Shaman/Troll !Warrior !Shaman
T	xprate	<2.1
A	goto	1413/1,-3031.48,461.91
A	complete	881,1
A	mob	Echeyakee
A	use	10327
A	dungeon	RFC
S	skip --!Tauren Orc !Warrior !Shaman/Troll !Warrior !Shaman
T	xprate	<2.1
T	completewith	Samophlange
A	dungeon	RFC
A	xp	>17,1
S	skip --!Tauren Orc !Warrior !Shaman/Troll !Warrior !Shaman
T	xprate	<2.1
T	completewith	Samophlange
A	complete	821,2
A	mob	Greater Plainstrider
A	mob	Fleeting Plainstrider
A	mob	Ornery Plainstrider
A	dungeon	RFC
S	
T	xprate	<2.1
T	completewith	Samophlange
A	xp	>17,1
S	
T	xprate	>2.09
A	goto	1413/1,-2589.67,-424.51
A	turnin	848
A	target	Apothecary Helbrim
A	isQuestComplete	848
S	
T	xprate	>2.09
A	goto	1413/1,-2672.76,-544.77
A	turnin	870
A	accept	877
A	target	Tonga Runetotem
S	
T	xprate	>2.09
A	goto	1413/1,-2670.74,-482.61
A	turnin	903
A	accept	881
A	target	Sergra Darkthorn
S	
T	xprate	>2.09
A	goto	1413/1,-3031.48,461.91
A	complete	881,1
A	mob	Echeyakee
A	use	10327
S	
T	xprate	>2.09
T	optional	
A	goto	1413/1,-2669.72,-481.94
A	abandon	881
A	itemcount	5100,<1
S	
T	xprate	>2.09
A	goto	1413/1,-2670.74,-482.61
A	accept	881
A	target	Sergra Darkthorn
A	itemcount	5100,<1
S	
T	optional	
A	goto	1413/1,-2670.74,-482.61
A	turnin	881
A	accept	905
A	target	Sergra Darkthorn
A	xp	<20,1
S	
T	optional	
A	goto	1413/1,-2595.75,-437.35
A	fly	Orgrimmar
A	zoneskip	Orgrimmar
A	target	Devrak
A	xp	<20,1
S	
T	optional	
A	maxlevel	19,NorthBarrensSkip
S	
T	xprate	<2.1
T	completewith	Samophlange
A	complete	821,2
A	mob	Greater Plainstrider
A	mob	Fleeting Plainstrider
A	mob	Ornery Plainstrider
S	
T	xprate	>2.09
T	completewith	Samophlange
A	complete	821,2
A	mob	Greater Plainstrider
A	mob	Fleeting Plainstrider
A	mob	Ornery Plainstrider
S	
T	xprate	<2.1
A	goto	1413/1,-1815.48,786.89
A	vendor	
A	target	Vrang Wildgore
S	
T	xprate	>2.09
T	completewith	next
A	complete	869,1
A	mob	Sunscale Lashtail
A	mob	Sunscale Screecher
S	
T	label	Samophlange
A	goto	1413/1,-2686.95,825.40
A	turnin	894
A	accept	900
S	
A	goto	1413/1,-2679.86,830.80
A	complete	900,2
A	isOnQuest	900
S	
A	goto	1413/1,-2675.80,842.290
A	complete	900,3
A	isOnQuest	900
S	
A	goto	1413/1,-2686.95,842.290
A	complete	900,1
A	isOnQuest	900
S	
A	goto	1413/1,-2686.95,825.40
A	turnin	900
A	accept	901
A	isQuestComplete	900
S	
T	optional	
A	goto	1413/1,-2686.95,825.40
A	accept	901
A	isQuestTurnedIn	900
S	
A	goto	1413/1,-2731.54,909.850
A	complete	901,1
A	mob	Tinkerer Sniggles
A	isQuestTurnedIn	900
S	
A	goto	1413/1,-2686.95,825.40
A	turnin	901
A	accept	902
A	isQuestTurnedIn	900
S	
T	completewith	Ignition
A	complete	821,2
A	mob	Greater Plainstrider
A	mob	Fleeting Plainstrider
A	mob	Ornery Plainstrideridneys
S	
T	loop	
A	goto	1413/1,-2879.48,781.48,0
A	goto	1413/1,-2879.48,781.48,90,0
A	goto	1413/1,-2909.88,484.21,90,0
A	goto	1413/1,-1693.88,592.31,90,0
A	complete	869,1
A	mob	Sunscale Lashtail
A	mob	Sunscale Screecher
A	mob	Sunscale Scytheclaw
S	
T	optional	
A	goto	1413/1,-3102.42,1105.78
A	xp	16
S	
T	label	Ignition
A	goto	1413/1,-3104.44,1109.16
A	accept	858
A	target	Wizzlecrank's Shredder
S	
T	completewith	next
A	unitscan	Foreman Grills
A	unitscan	Sludge Beast
S	
A	goto	1413/1,-3104.44,1040.25,20,0
A	goto	1413/1,-3086.20,1055.78,12,0
A	goto	1413/1,-3063.91,1049.70,12,0
A	goto	1413/1,-3056.82,1038.89,12,0
A	goto	1413/1,-3064.92,1034.16,12,0
A	goto	1413/1,-3086.20,1055.78
A	complete	858,1
A	mob	Supervisor Lugwizzle
A	isOnQuest	858
S	
A	goto	1413/1,-3104.44,1109.16
A	turnin	858
A	accept	863,1
A	target	Wizzlecrank's Shredder
A	isQuestComplete	858
S	
T	optional	
A	goto	1413/1,-3104.44,1109.16
A	accept	863,1
A	target	Wizzlecrank's Shredder
A	isQuestTurnedIn	858
S	
T	label	Slugs
A	goto	1413/1,-3031.48,1088.21,30,0
A	goto	1413/1,-3002.10,1130.78
A	complete	863,1
A	mob	Venture Co. Mercenary
A	mob	Venture Co. Drudger
A	mob	Overseer Glibby
A	isOnQuest	863
S	
T	completewith	next
A	complete	821,2
A	mob	Greater Plainstrider
A	mob	Fleeting Plainstrider
A	mob	Ornery Plainstrider
S	
T	label	CatsEye
T	loop	
A	goto	1413/1,-3610.1,1313.2,0
A	goto	1413/1,-3605.03,1308.47,40,0
A	goto	1413/1,-3564.5,1367.25,40,0
A	goto	1413/1,-3622.26,1384.81,40,0
A	goto	1413/1,-3673.94,1374.68,40,0
A	goto	1413/1,-3653.67,1306.44,40,0
A	goto	1413/1,-3644.55,1249.69,40,0
A	goto	1413/1,-3603.0,1236.85,40,0
A	goto	1413/1,-3575.64,1271.31,40,0
A	goto	1413/1,-3610.1,1313.2,40,0
A	complete	896,1
A	mob	Venture Co. Enforcer
A	mob	Venture Co. Overseer
S	
T	ssf	
T	loop	
A	goto	1413/1,-3610.1,1313.2,0
A	goto	1413/1,-3605.03,1308.47,40,0
A	goto	1413/1,-3564.5,1367.25,40,0
A	goto	1413/1,-3622.26,1384.81,40,0
A	goto	1413/1,-3673.94,1374.68,40,0
A	goto	1413/1,-3653.67,1306.44,40,0
A	goto	1413/1,-3644.55,1249.69,40,0
A	goto	1413/1,-3603.0,1236.85,40,0
A	goto	1413/1,-3575.64,1271.31,40,0
A	goto	1413/1,-3610.1,1313.2,40,0
A	collect	814,5,103,1
A	dungeon	DM
S	
T	ah	
T	loop	
A	goto	1413/1,-3610.1,1313.2,0
A	goto	1413/1,-3605.03,1308.47,40,0
A	goto	1413/1,-3564.5,1367.25,40,0
A	goto	1413/1,-3622.26,1384.81,40,0
A	goto	1413/1,-3673.94,1374.68,40,0
A	goto	1413/1,-3653.67,1306.44,40,0
A	goto	1413/1,-3644.55,1249.69,40,0
A	goto	1413/1,-3603.0,1236.85,40,0
A	goto	1413/1,-3575.64,1271.31,40,0
A	goto	1413/1,-3610.1,1313.2,40,0
A	collect	814,5,103,1
A	dungeon	DM
S	skip
A	goto	1413/1,-3505.72,1358.46
A	goto	1454/1,-4242.34,1637.33,30
A	link	https://www.youtube.com/watch?v=U7YfoaO-X8E&ab_channel=RestedXP
A	zoneskip	Orgrimmar
S	
T	completewith	SpiritsPickup
A	goto	1414/1,-3839.37,1644.65
A	zone	Orgrimmar
S	
T	optional	
T	label	NorthBarrensSkip
S	
T	completewith	next
A	skill	firstaid,40
A	skill	firstaid,<1,1
S	
A	goto	1454/1,-4160.01,1483.17
A	train	3276
A	target	Arnok
A	skill	firstaid,<1,1
S	
T	completewith	next
A	skill	firstaid,50
A	skill	firstaid,<1,1
S	
A	goto	1454/1,-4160.01,1483.17
A	train	3274
A	target	Arnok
A	skill	firstaid,<40,1
S	
T	completewith	next
A	itemcount	814,5
A	dungeon	DM
S	Priest
T	optional	
A	goto	1454/1,-4179.79,1452.580
A	train	8102
A	target	Ur'kyo
A	xp	<16,1
A	xp	>18,1
S	Priest
T	optional	
T	season	2
A	goto	1454/1,-4179.79,1452.580
A	train	527
A	target	Ur'kyo
A	xp	<18,1
S	Priest
T	optional	
T	season	0
A	goto	1454/1,-4179.79,1452.580
A	train	970
A	target	Ur'kyo
A	xp	<18,1
S	Mage
T	optional	
A	goto	1454/1,-4218.64,1473.72
A	train	3140
A	target	Pephredo
A	xp	<18,1
S	!Tauren !Undead
T	xprate	<2.1
A	goto	1454/1,-4439.37,1633.99
A	turnin	6384
A	accept	6385
A	target	Innkeeper Gryshka
A	isOnQuest	6384
S	!Tauren !Undead
T	xprate	<2.1
A	goto	Orgrimmar,45.120,63.889
A	turnin	6385
A	accept	6386
A	target	Doras
A	isOnQuest	6385
S	!Tauren !Undead
T	xprate	<2.1
A	goto	Orgrimmar,45.120,63.889
A	accept	6386
A	target	Doras
A	isQuestTurnedIn	6385
S	Tauren/Undead
A	goto	1454/1,-4313.60,1676.24
A	fp	Orgrimmar
A	target	Doras
A	isQuestAvailable	4921
S	Shaman
T	season	2
A	goto	1454/1,-4225.09,1933.29
A	train	8019
A	target	Kardris Dreamseeker
A	xp	<16,1
A	xp	>18,1
S	Shaman
T	optional	
T	season	2
A	goto	1454/1,-4225.09,1933.29
A	train	913
A	target	Kardris Dreamseeker
A	xp	<18,1
S	Shaman
T	season	0
A	goto	1454/1,-4225.09,1933.29
A	train	8019
A	target	Kardris Dreamseeker
A	xp	<16,1
A	xp	>18,1
S	Shaman
T	optional	
T	season	0
A	goto	1454/1,-4225.09,1933.29
A	train	913
A	target	Kardris Dreamseeker
A	xp	<18,1
S	
T	xprate	<2.1
A	goto	1454/1,-4226.78,1914.77
A	accept	1061
A	target	Zor Lonetree
S	Shaman/Hunter
T	season	2
A	goto	1454/1,-4226.54,1914.70
A	train	409580
A	train	425336
A	use	226401 << Hunter
A	use	226402 << Shaman
A	target	Zor Lonetree
A	money	<0.5
S	Rogue
A	goto	1454/1,-4284.42,1771.28
A	train	1804
A	train	921
A	accept	2379
A	target	Shenthul
S	Orc Rogue/Troll Rogue
A	goto	1454/1,-4280.07,1772.96
A	turnin	1963
A	accept	1858
A	target	Therzok
A	isQuestComplete	1963
S	Orc Rogue/Troll Rogue
T	optional	
A	goto	1454/1,-4280.07,1772.96
A	accept	1858
A	target	Therzok
A	isQuestTurnedIn	1963
S	Rogue
A	goto	1454/1,-4279.79,1778.57
A	turnin	2379
A	accept	2382
A	target	Zando'zan
S	Orc Rogue/Troll Rogue
T	completewith	next
A	goto	1454/1,-4271.1,1810.75
A	collect	5060,1,1858,1
A	target	Rekkul
A	money	<0.15
A	isQuestTurnedIn	1963
S	Orc Rogue/Troll Rogue
A	goto	1454/1,-4280.07,1773.24
A	complete	1858,1
A	itemcount	5060,1
A	isQuestTurnedIn	1963
S	Orc Rogue/Troll Rogue
A	goto	1454/1,-4437.87,1637.33
A	collect	7208,1,1858,1
A	complete	1858,1
A	isQuestTurnedIn	1963
S	Orc Rogue/Troll Rogue
A	goto	1454/1,-4280.07,1772.96
A	turnin	1858
A	target	Therzok
A	isQuestTurnedIn	1963
S	Rogue
A	goto	1454/1,-4320.75,1750.51
A	collect	2209,1,881,1
A	money	<0.7115
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<10.8
A	target	Kareth
S	Orc Rogue/Troll Rogue
T	optional	
T	completewith	FoodandWater2
A	abandon	1963
S	Rogue
T	optional	
T	completewith	FoodandWater2
A	use	2209
A	itemcount	2209,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<10.8
A	xp	<19,1
S	Rogue
T	optional	
T	completewith	FoodandWater2
A	use	2209
A	itemcount	2209,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<10.8
A	xp	>19,1
S	Warlock
A	goto	1454/1,-4362.55,1834.70
A	train	1455
A	target	Mirket
A	xp	<16,1
A	xp	>18,1
S	Warlock
T	optional	
A	goto	1454/1,-4362.55,1834.70
A	train	1014
A	target	Mirket
A	xp	<18,1
S	Warlock
A	goto	1454/1,-4347.4,1836.57
A	collect	16351,1,881,1
A	target	Kurgul
A	xp	<16,1
A	xp	>18,1
S	Warlock
A	goto	1454/1,-4347.4,1836.57
A	collect	16316,1,881,1
A	target	Kurgul
A	xp	<18,1
S	Warrior
A	goto	1454/1,-4801.42,1980.53
A	train	285
A	target	Grezz Ragefist
A	xp	<16,1
A	xp	>18,1
S	Warrior
T	optional	
A	goto	1454/1,-4801.42,1980.53
A	train	8198
A	target	Grezz Ragefist
A	xp	<18,1
S	Hunter
A	goto	1454/1,-4607.02,2100.64
A	train	13795
A	target	Ormak Grimshot
A	xp	<16,1
A	xp	>18,1
S	Hunter
T	optional	
A	goto	1454/1,-4607.02,2100.64
A	train	2643
A	target	Ormak Grimshot
A	xp	<18,1
S	Hunter
A	goto	1454/1,-4611.09,2135.15
A	train	24557
A	target	Xao'tsu
A	xp	<18,1
S	Troll Hunter/Orc Hunter/Priest
A	goto	1454/1,-4824.00,2090.540
A	train	227
A	target	Hanashi
A	money	<0.100
S	Tauren Hunter
A	goto	1454/1,-4824.00,2090.540
A	train	264
A	target	Hanashi
S	Tauren Warrior/Undead Warrior
A	goto	1454/1,-4824.00,2090.540
A	train	197
A	train	227
A	target	Hanashi
S	Hunter
A	goto	1454/1,-4819.1,2099.05
A	collect	3026,1,3281,1
A	money	<0.3588
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<7.4
A	target	Zendo'jian
A	train	227,3
S	Hunter
T	optional	
T	completewith	FoodandWater2
A	use	3026
A	itemcount	3026,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<7.4
S	Warrior
A	goto	1454/1,-4819.1,2099.05
A	collect	926,1,3281,1
A	money	<1.021
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.2
A	target	Zendo'jian
A	train	227,3
S	Warrior
T	optional	
T	completewith	FoodandWater2
A	use	926
A	itemcount	926,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.2
A	xp	>20,1
S	Warrior
T	optional	
T	completewith	FoodandWater2
A	use	926
A	itemcount	926,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.2
A	xp	<20,1
S	Druid
T	season	2
T	ah	
A	goto	1454/1,-4460.31,1685.31
A	collect	5020,1
A	target	Auctioneer Thathung
A	itemcount	208689,<1,1 << Druid
A	train	407988,1 << Druid
S	
T	optional	
T	label	SpiritsPickup
S	
T	completewith	FoodandWater2
A	hs	
A	cooldown	item,6948,>0
A	use	6948
A	bindlocation	380,1
A	subzoneskip	380
S	
T	completewith	FoodandWater2
A	goto	Orgrimmar,45.120,63.889
A	fly	Crossroads
A	target	Doras
A	cooldown	item,6948,<0
A	subzoneskip	380
S	
T	label	FoodandWater2
A	goto	1413/1,-2645.40,-406.94
A	vendor	
A	vendor	
A	target	Innkeeper Boorand Plainswind
A	isQuestAvailable	3281
S	
A	goto	1413/1,-2639.32,-436.00
A	turnin	869
A	accept	3281
A	target	Gazrog
S	
A	goto	1413/1,-2589.67,-424.51
A	turnin	848
A	target	Apothecary Helbrim
A	isQuestComplete	848
S	
T	xprate	<2.1
A	goto	1413/1,-2607.91,-475.180
A	turnin	867
A	accept	875
A	target	Darsok Swiftdagger
S	
A	goto	1413/1,-2672.76,-544.77
A	turnin	870
A	accept	877
A	target	Tonga Runetotem
S	
T	label	EcheyakeePickup
A	goto	1413/1,-2670.74,-482.61
A	turnin	903
A	accept	881
A	target	Sergra Darkthorn
S	!Tauren !Undead
T	xprate	<2.1
A	goto	1413/1,-2709.24,-404.24
A	turnin	6386
A	target	Zargh
A	isOnQuest	6386
S	
A	goto	1413/1,-3031.48,461.91
A	complete	881,1
A	mob	Echeyakee
A	use	10327
S	
T	optional	
A	goto	1413/1,-2669.72,-481.94
A	abandon	881
A	itemcount	5100,<1
S	
A	goto	1413/1,-2670.74,-482.61
A	accept	881
A	target	Sergra Darkthorn
A	itemcount	5100,<1
S	
A	goto	1413/1,-3031.48,461.91
A	complete	881,1
A	mob	Echeyakee
A	use	10327
S	
A	goto	1413/1,-2670.74,-482.61
A	turnin	881
A	accept	905
A	target	Sergra Darkthorn
S	
T	completewith	RapHornsPickup
A	destroy	10327
S	Warrior
T	season	2
A	goto	1413/1,-2673.78,-487.34,
A	aura	420667
A	train	403489,1
S	
A	goto	1413/1,-2641.35,-521.12
A	accept	899
A	accept	4921
A	target	Mankrik
S	Hunter
A	goto	1413/1,-2612.98,-411.00
A	collect	2515,1800,888,1 << Hunter
A	target	Barg
S	
T	completewith	RapHornsPickup
A	goto	1413/1,-2595.75,-437.35
A	fly	Ratchet
A	target	Devrak
A	subzoneskip	392
S	Rogue
A	goto	1413/1,-3768.18,-840.69
A	turnin	2382
A	accept	2381
A	target	Wrenix the Wretched
S	Rogue
A	goto	1413/1,-3773.24,-841.37
A	collect	7970,1,888,1
A	collect	5060,1,888,1
S	
A	goto	1413/1,-3759.06,-902.18
A	turnin	902
A	turnin	863
A	target	Sputtervalve
A	isQuestComplete	863
A	isOnQuest	902
S	
T	optional	
A	goto	1413/1,-3759.06,-902.18
A	turnin	902
A	target	Sputtervalve
A	isOnQuest	902
S	
T	optional	
A	goto	1413/1,-3759.06,-902.18
A	turnin	863
A	target	Sputtervalve
A	isQuestComplete	863
S	
T	xprate	<2.1
A	goto	1413/1,-3759.06,-902.18
A	accept	3921
A	accept	1483
A	target	Sputtervalve
A	isQuestTurnedIn	902 << Hunter
S	
A	goto	1413/1,-3796.55,-985.28
A	turnin	896
A	target	Wharfmaster Dizzywig
A	isQuestComplete	896
S	
T	xprate	<2.1
T	label	RapHornsPickup
A	goto	1413/1,-3697.24,-929.20
A	accept	865
A	accept	1069
A	target	Mebok Mizzyrix
S	
T	xprate	>2.09
T	label	RapHornsPickup
A	goto	1413/1,-3697.24,-929.20
A	accept	865
A	target	Mebok Mizzyrix
S	Warrior
T	season	2
A	goto	1413/1,-3737.78,-971.09
A	collect	208773,1
A	target	Kilxx
A	train	425443,1 << Warrior
S	Warrior
T	season	2
A	goto	1413/1,-3914.10,-1044.06
A	use	208773
A	collect	208778,1 << Warrior
A	unitscan	Bruuz
A	train	425443,1 << Warrior
S	Warrior
T	season	2
A	train	425443
A	use	208778
A	itemcount	208778,1
S	
T	sticky	
T	completewith	LeaveRatchet
T	season	2
A	goto	1413/1,-3639.48,-1049.46
A	use	210822 << Priest
A	use	210820 << Paladin
A	use	210654 << Mage
A	use	210818 << Hunter
A	use	210817 << Druid
A	use	210825 << Warrior
A	use	210824 << Warlock
A	use	210653 << Rogue
A	use	210823 << Shaman
A	train	415995
A	train	410010
A	train	401761
A	train	410122
A	train	416042
A	train	425445
A	train	425476
A	train	424990
A	train	410096
A	target	Grizzby
A	train	415995,1 << Priest
A	train	410010,1 << Paladin
A	train	401761,1 << Mage
A	train	410122,1 << Hunter
A	train	416042,1 << Druid
A	train	425445,1 << Warrior
A	train	425476,1 << Warlock
A	train	424990,1 << Rogue
A	train	410096,1 << Shaman
A	money	<3.0
S	
A	goto	1413/1,-3664.82,-1050.14
A	vendor	
A	collect	4592,20,888,1
A	collect	1205,10,888,1 << Mage/Warlock/Priest/Shaman/Druid
A	target	Innkeeper Wiley
S	Rogue
T	season	0
T	completewith	SSTreasure
A	goto	1413/1,-3967.8,-1457.54
S	Rogue
T	season	2
T	completewith	SSTreasure
A	goto	1413/1,-3967.8,-1457.54
A	train	424984,3
S	Rogue
T	season	2
T	completewith	SSTreasure
A	goto	1413/1,-3967.8,-1457.54
A	train	424984,1
S	Rogue
T	label	SSTreasure
A	goto	1413/1,-3958.68,-1457.54
A	complete	2381,1
A	use	7970
A	mob	Polly
S	
T	label	LeaveRatchet
A	goto	1413/1,-3819.86,-1714.95
A	complete	888,2
A	isOnQuest	888
S	
A	goto	1413/1,-3723.59,-1741.30
A	complete	888,1
A	isOnQuest	888
S	Warrior/Rogue
T	season	2
T	completewith	EndlessRageRune << Warrior
T	completewith	SaberSlashRune << Rogue
A	subzone	385
S	Warrior
T	season	2
A	goto	1413/1,-3715.48,-2191.94
A	collect	208741,1
A	mob	Lieutenant Stonebrew
A	train	403489,1
S	Warrior
T	season	2
T	label	EndlessRageRune
A	train	403489
A	use	208741
A	itemcount	208741,1
S	Rogue
T	season	2
A	goto	1413/1,-3691.16,-2050.74
A	collect	208772,1
A	train	424984,1
S	Rogue
T	season	2
T	label	SaberSlashRune
A	train	424984
A	use	208772
A	itemcount	208772,1
S	
T	completewith	TestSeeds
A	complete	821,2
A	mob	Greater Plainstrider
A	mob	Fleeting Plainstrider
A	mob	Ornery Plainstrider
S	
T	completewith	TestSeeds
A	complete	865,1
A	collect	5165,3,905,3
A	mob	Sunscale Scytheclaw
S	
A	goto	1413/1,-3192.60,-1919.67,60,0
A	goto	1413/1,-3258.47,-2027.09
A	complete	3281,1
S	
T	completewith	Verog
A	complete	848,1
S	
T	label	TestSeeds
A	goto	1413/1,-3012.23,-1275.80
A	complete	877,1
S	Druid
T	xprate	<2.1
T	season	2
T	completewith	Verog
A	collect	5020,1
A	mob	Kolkar Wrangler
A	mob	Kolkar Stormer
A	train	407988,1
S	
T	xprate	<2.1
T	completewith	next
T	loop	
A	goto	1413/1,-3031.48,-1480.51,50,0
A	goto	1413/1,-3127.75,-1320.39,50,0
A	goto	1413/1,-3154.1,-1172.43,50,0
A	goto	1413/1,-2996.02,-1182.56,50,0
A	goto	1413/1,-2949.4,-1146.75,50,0
A	goto	1413/1,-2789.3,-1107.57,50,0
A	goto	1413/1,-2746.74,-1409.57,50,0
A	goto	1413/1,-2880.5,-1550.1,50,0
A	goto	1413/1,-3031.48,-1480.51,50,0
A	complete	855,1
A	mob	Kolkar Bloodcharger
A	mob	Kolkar Pack runner
A	mob	Kolkar Marauder
A	isOnQuest	851
S	
T	xprate	<2.1
A	goto	1413/1,-2742.68,-1208.23
A	complete	851,1
A	unitscan	Verog the Dervish
A	isOnQuest	851
S	
T	optional	
T	label	Verog
S	Druid
T	season	2
T	loop	
A	goto	1413/1,-3031.48,-1480.51,0
A	goto	1413/1,-3031.48,-1480.51,50,0
A	goto	1413/1,-3127.75,-1320.39,50,0
A	goto	1413/1,-3154.1,-1172.43,50,0
A	goto	1413/1,-2996.02,-1182.56,50,0
A	goto	1413/1,-2949.4,-1146.75,50,0
A	goto	1413/1,-2789.3,-1107.57,50,0
A	goto	1413/1,-2746.74,-1409.57,50,0
A	goto	1413/1,-2880.5,-1550.1,50,0
A	collect	5020,1
A	mob	Kolkar Wrangler
A	mob	Kolkar Stormer
A	itemcount	208689,<1,1
A	train	407988,1
S	Druid
T	season	2
A	goto	1413/1,-2717.35,-1211.61
A	collect	5020,1
A	collect	208689,1
A	itemcount	208689,<1,1
A	train	407988,1
S	Druid
T	season	2
T	completewith	Nest
A	equip	18,208689
A	use	208689
A	itemcount	208689,1
A	train	407988,1
S	Druid
T	season	2
T	completewith	Nest
A	train	407988
A	use	208689
A	itemcount	208689,1
S	
T	loop	
A	goto	1413/1,-3023.38,-1234.58,0
A	goto	1413/1,-3023.38,-1234.58,30,0
A	goto	1413/1,-3000.07,-1208.23,30,0
A	goto	1413/1,-2959.54,-1196.75,30,0
A	goto	1413/1,-2953.46,-1241.34,30,0
A	goto	1413/1,-2977.78,-1304.17,30,0
A	goto	1413/1,-3029.46,-1324.44,30,0
A	goto	1413/1,-3066.95,-1311.61,30,0
A	goto	1413/1,-3059.86,-1264.31,30,0
A	goto	1413/1,-3023.38,-1234.58,30,0
A	complete	848,1
S	
T	completewith	LakotaMani1
A	complete	821,2
A	mob	Greater Plainstrider
A	mob	Fleeting Plainstrider
A	mob	Ornery Plainstrider
S	
A	goto	1413/1,-2707.22,-1502.130
A	complete	905,1
A	collect	5165,3,905,7,3
A	mob	Sunscale Scytheclaw
S	
A	goto	1413/1,-2692.02,-1533.89
A	complete	905,3
A	collect	5165,3,905,7,3
A	mob	Sunscale Scytheclaw
S	
T	label	Nest
A	goto	1413/1,-2648.44,-1527.13
A	complete	905,2
A	collect	5165,3,905,7,3
A	mob	Sunscale Scytheclaw
S	
T	completewith	next
A	complete	865,1
A	mob	Sunscale Scytheclaw
S	
T	label	LostmyWife
A	goto	1413/1,-2375.86,-1787.24
A	complete	4921,1
A	target	Beaten Corpse
A	skipgossip	
S	
T	completewith	next
A	complete	821,3
A	mob	Stormsnout
S	
T	label	LakotaMani1
T	completewith	CampTArrive
A	goto	1413/1,-1951.27,-1956.15,0
A	goto	1413/1,-2031.32,-1703.47,0
A	goto	1413/1,-2183.32,-1858.19,0
A	goto	1413/1,-2453.88,-1991.28,0
A	collect	5099,1,883
A	accept	883
A	use	5099
A	unitscan	Lakota'mani
S	
T	completewith	CampTArrive
A	complete	821,3
A	mob	Stormsnout
S	Hunter
T	season	2
T	completewith	next
S	Hunter
T	season	2
T	loop	
A	goto	1413/1,-1746.58,-2263.56,0
A	goto	1413/1,-1896.55,-2137.89,40,0
A	goto	1413/1,-1840.82,-2184.510,40,0
A	goto	1413/1,-1746.58,-2263.56,40,0
A	line	The Barrens,44.60,55.51,44.60,55.51,43.12,57.37
A	collect	208701,1
A	mob	Patrolling Cheetah
A	train	410110,1
S	Hunter
T	season	2
A	train	410110
A	use	208701
A	itemcount	208701,1
S	
T	label	CampTArrive
T	completewith	next
A	goto	1413/1,-1960.39,-2333.83,120
A	subzoneskip	378
S	
T	requires	CampTArrive
T	label	SetCampTaurajoHS
A	goto	1413/1,-1995.86,-2376.39
A	home	
A	target	Innkeeper Byula
A	bindlocation	378
A	isQuestAvailable	1093
S	
A	goto	1413/1,-1921.88,-2383.15
A	turnin	883
A	target	Jorn Skyseer
A	isOnQuest	883
S	
A	goto	1413/1,-1891.48,-2391.93
A	accept	878
A	target	Mangletooth
S	
T	completewith	Xroadsturnins2
A	goto	1413/1,-1881.35,-2384.50
A	fp	Camp Taurajo
A	fly	Crossroads
A	target	Omusa Thunderhorn
A	subzoneskip	380
S	
A	goto	1413/1,-2589.67,-424.51
A	turnin	848
A	target	Apothecary Helbrim
A	isQuestComplete	848
S	
T	label	Xroadsturnins2
A	turnin	4921
A	target	+Mankrik
A	goto	1413/1,-2641.35,-521.12
A	turnin	877
A	accept	880
A	target	+Tonga Runetotem
A	goto	1413/1,-2672.76,-544.77
A	turnin	905
A	accept	3261
A	target	+Sergra Darkthorn
A	goto	1413/1,-2670.74,-482.61
A	turnin	3281
A	goto	1413/1,-2639.32,-436.00
A	target	+Gazrog
S	
A	destroy	5165
A	itemcount	5165,1
S	Hunter
A	goto	1413/1,-2556.23,-351.54
A	collect	11362,1,896,1
A	collect	2515,2200,896,1
A	target	Uthrok
S	
T	xprate	<2.1
A	goto	1413/1,-1972.55,-306.95
A	turnin	851
A	accept	852
A	turnin	855
A	target	Regthar Deathgate
A	isQuestComplete	855
S	
T	xprate	<2.1
A	goto	1413/1,-1972.55,-306.95
A	turnin	851
A	accept	852
A	target	Regthar Deathgate
A	isQuestComplete	851
S	
T	optional	
T	label	Leaders
T	xprate	<2.1
A	goto	1413/1,-1972.55,-306.95
A	accept	852
A	target	Regthar Deathgate
A	isQuestTurnedIn	851
S	
T	xprate	<2.1
T	completewith	Hezrul
A	subzone	387
A	isQuestTurnedIn	851
S	
T	xprate	<2.1
T	completewith	Hezrul
A	complete	880,1
A	mob	Oasis Snapjaw
S	
T	xprate	<2.1
T	completewith	next
A	complete	855,1
A	mob	Kolkar Bloodcharger
A	mob	Kolkar Pack runner
A	mob	Kolkar Marauder
A	isOnQuest	855
S	
T	xprate	<2.1
T	loop	
T	label	Hezrul
A	goto	1413/1,-2001.94,-965.69,0
A	goto	1413/1,-2001.94,-965.69,50,0
A	goto	1413/1,-2022.20,-945.42,50,0
A	goto	1413/1,-2016.12,-915.01,50,0
A	goto	1413/1,-2033.35,-894.74,50,0
A	goto	1413/1,-2031.32,-881.23,50,0
A	goto	1413/1,-2052.60,-877.18,50,0
A	goto	1413/1,-2057.67,-879.21,50,0
A	goto	1413/1,-2066.79,-877.85,50,0
A	goto	1413/1,-2085.03,-898.80,50,0
A	goto	1413/1,-2097.19,-908.26,50,0
A	goto	1413/1,-2102.26,-950.15,50,0
A	goto	1413/1,-2114.42,-981.22,50,0
A	goto	1413/1,-2167.11,-1021.09,50,0
A	goto	1413/1,-2187.38,-1040.68,50,0
A	goto	1413/1,-2261.35,-1060.95,50,0
A	goto	1413/1,-2281.62,-1061.62,50,0
A	goto	1413/1,-2301.88,-1056.89,50,0
A	goto	1413/1,-2295.80,-1087.30,50,0
A	goto	1413/1,-2299.86,-1125.13,50,0
A	goto	1413/1,-2268.44,-1145.40,50,0
A	goto	1413/1,-2247.16,-1145.40,50,0
A	goto	1413/1,-2226.90,-1166.35,50,0
A	goto	1413/1,-2189.40,-1179.86,50,0
A	goto	1413/1,-2174.20,-1198.78,50,0
A	goto	1413/1,-2162.04,-1200.80,50,0
A	goto	1413/1,-2124.55,-1228.50,50,0
A	goto	1413/1,-2095.16,-1220.40,50,0
A	goto	1413/1,-2065.78,-1208.91,50,0
A	goto	1413/1,-2041.46,-1167.70,50,0
A	goto	1413/1,-2024.23,-1179.18,50,0
A	goto	1413/1,-2047.54,-1156.21,50,0
A	goto	1413/1,-2046.52,-1135.94,50,0
A	goto	1413/1,-2009.03,-1127.84,50,0
A	complete	852,1
A	unitscan	Hezrul Bloodmark
A	isQuestTurnedIn	851
S	
T	xprate	<2.1
A	goto	1413/1,-2001.94,-965.69,0
A	goto	1413/1,-2001.94,-965.69,50,0
A	goto	1413/1,-2022.20,-945.42,50,0
A	goto	1413/1,-2016.12,-915.01,50,0
A	goto	1413/1,-2033.35,-894.74,50,0
A	goto	1413/1,-2031.32,-881.23,50,0
A	goto	1413/1,-2052.60,-877.18,50,0
A	goto	1413/1,-2057.67,-879.21,50,0
A	goto	1413/1,-2066.79,-877.85,50,0
A	goto	1413/1,-2085.03,-898.80,50,0
A	goto	1413/1,-2097.19,-908.26,50,0
A	goto	1413/1,-2102.26,-950.15,50,0
A	goto	1413/1,-2114.42,-981.22,50,0
A	goto	1413/1,-2167.11,-1021.09,50,0
A	goto	1413/1,-2187.38,-1040.68,50,0
A	goto	1413/1,-2261.35,-1060.95,50,0
A	goto	1413/1,-2281.62,-1061.62,50,0
A	goto	1413/1,-2301.88,-1056.89,50,0
A	goto	1413/1,-2295.80,-1087.30,50,0
A	goto	1413/1,-2299.86,-1125.13,50,0
A	goto	1413/1,-2268.44,-1145.40,50,0
A	goto	1413/1,-2247.16,-1145.40,50,0
A	goto	1413/1,-2226.90,-1166.35,50,0
A	goto	1413/1,-2189.40,-1179.86,50,0
A	goto	1413/1,-2174.20,-1198.78,50,0
A	goto	1413/1,-2162.04,-1200.80,50,0
A	goto	1413/1,-2124.55,-1228.50,50,0
A	goto	1413/1,-2095.16,-1220.40,50,0
A	goto	1413/1,-2065.78,-1208.91,50,0
A	goto	1413/1,-2041.46,-1167.70,50,0
A	goto	1413/1,-2024.23,-1179.18,50,0
A	goto	1413/1,-2047.54,-1156.21,50,0
A	goto	1413/1,-2046.52,-1135.94,50,0
A	goto	1413/1,-2009.03,-1127.84,50,0
A	complete	855,1
A	mob	Kolkar Bloodcharger
A	mob	Kolkar Pack runner
A	mob	Kolkar Marauder
A	itemcount	5030,5
A	isOnQuest	855
S	Druid
T	season	2
A	goto	1413/1,-2273.51,-1106.89
A	collect	208687,1
A	train	416049,1
S	Druid
T	season	2
A	train	416049
A	use	208687
A	itemcount	208687,1
S	
T	xprate	<2.1
T	optional	
T	completewith	CounterattackComplete
A	abandon	855
A	itemcount	5030,<5
S	
T	xprate	<2.1
A	goto	1413/1,-1972.55,-306.95
A	turnin	852
A	turnin	855
A	target	Regthar Deathgate
A	isQuestComplete	852
A	isQuestComplete	855
S	
T	xprate	<2.1
A	goto	1413/1,-1972.55,-306.95
A	turnin	852
A	target	Regthar Deathgate
A	isQuestComplete	852
S	
T	xprate	<2.1
A	goto	1413/1,-1972.55,-306.95
A	turnin	855
A	target	Regthar Deathgate
A	isQuestComplete	855
S	
T	xprate	<2.1
T	completewith	CounterattackComplete
A	isQuestTurnedIn	852
S	
T	xprate	<2.1
A	goto	1413/1,-1972.55,-306.95
A	accept	4021
A	target	Regthar Deathgate
A	isQuestTurnedIn	852
S	
T	xprate	<2.1
T	label	CounterattackComplete
A	goto	1413/1,-1884.39,-289.38
A	complete	4021,1
A	unitscan	Warlord Krom'zar
A	isOnQuest	4021
S	
T	xprate	<2.1
A	goto	1413/1,-1972.55,-306.95
A	turnin	4021
A	target	Regthar Deathgate
A	isQuestComplete	4021
S	
T	xprate	<2.1
A	goto	1413/1,-1972.55,-306.95
A	turnin	855
A	target	Regthar Deathgate
A	isQuestComplete	855
S	
T	xprate	<2.1
A	goto	1413/1,-1972.55,-306.95
A	turnin	4021
A	target	Regthar Deathgate
A	isQuestComplete	4021
S	
T	xprate	<2.1
A	goto	1413/1,-1972.55,-306.95
A	turnin	855
A	target	Regthar Deathgate
A	isQuestComplete	855
S	
T	xprate	<2.1
T	completewith	StonetalonPickups
A	complete	821,2
A	mob	Greater Plainstrider
A	mob	Fleeting Plainstrider
A	mob	Ornery Plainstrider
S	
T	xprate	<2.1
T	loop	
A	goto	1413/1,-1458.79,565.96,0
A	goto	1413/1,-1458.79,565.96,40,0
A	goto	1413/1,-1379.75,620.68,40,0
A	goto	1413/1,-1376.71,717.97,40,0
A	goto	1413/1,-1323.0,747.7,40,0
A	goto	1413/1,-1245.99,763.91,40,0
A	goto	1413/1,-1223.7,699.05,40,0
A	goto	1413/1,-1290.58,670.0,40,0
A	goto	1413/1,-1245.99,624.74,40,0
A	goto	1413/1,-1241.94,559.2,40,0
A	goto	1413/1,-1155.8,553.12,40,0
A	goto	1413/1,-1150.74,513.93,40,0
A	goto	1413/1,-1194.31,508.53,40,0
A	goto	1413/1,-1263.22,458.53,40,0
A	goto	1413/1,-1311.86,415.97,40,0
A	goto	1413/1,-1366.58,449.75,40,0
A	goto	1413/1,-1417.24,486.91,40,0
A	goto	1413/1,-1445.62,532.85,40,0
A	complete	875,1
A	mob	Witchwing Slayer
A	mob	Witchwing Ambusher
A	isOnQuest	875
S	
T	xprate	<2.1
T	label	BarrensEnd
T	completewith	next
A	goto	1413/1,-950.10,-271.14,30
A	zoneskip	Stonetalon Mountains
S	
T	xprate	<2.1
T	map	Stonetalon Mountains
A	turnin	1061
A	accept	1062
A	target	+Seereth Stonebreak
A	goto	1413/1,-950.10,-271.14
A	accept	6548
A	target	+Makaba Flathoof
A	goto	1413/1,-943.00,-265.06
A	maxlevel	20
S	
T	xprate	<2.1
T	map	Stonetalon Mountains
T	label	StonetalonPickups
A	goto	1413/1,-950.10,-271.14
A	turnin	1061
A	accept	1062
A	target	Seereth Stonebreak
E
G	Guides/forever/Horde-12-22_Barrens.lua
M	classic	
M	tbc	
M	xprate	>1.99
M	selector	Horde
M	name	20-24 Stonetalon/Barrens
M	version	1
M	group	RestedXP Forever Guide (H)
M	subgroup	Speedrun Guide 1-22
M	next	24-26 Southern Barrens << !Rogue !Shaman
M	next	23-24 Hillsbrad Class Quests << Rogue/Shaman
S	Druid
T	xprate	<2.1
T	season	2
T	completewith	next
A	collect	210534,1
A	train	410021,1
S	
T	xprate	<2.1
T	optional	
T	loop	
A	goto	1442/1,-691.11,-13.63,0
A	goto	1442/1,-691.11,-13.63,40,0
A	goto	1442/1,-650.58,26.74,40,0
A	goto	1442/1,-718.94,65.49,40,0
A	goto	1442/1,-743.85,101.96,40,0
A	goto	1442/1,-771.20,113.040,40,0
A	goto	1442/1,-785.36,141.69,40,0
A	goto	1442/1,-838.59,148.20,40,0
A	goto	1442/1,-865.93,142.34,40,0
A	goto	1442/1,-846.4,103.92,40,0
A	goto	1442/1,-819.54,76.24,40,0
A	goto	1442/1,-774.61,-5.17,40,0
A	goto	1442/1,-774.61,-27.96,40,0
A	goto	1442/1,-726.27,-39.36,40,0
A	complete	6548,1
A	complete	6548,2
A	mob	Grimtotem Ruffian
A	mob	Grimtotem Mercenary
A	isOnQuest	6548
S	Druid
T	xprate	<2.1
T	season	2
T	loop	
A	goto	1442/1,-691.11,-13.63,0
A	goto	1442/1,-691.11,-13.63,40,0
A	goto	1442/1,-650.58,26.74,40,0
A	goto	1442/1,-718.94,65.49,40,0
A	goto	1442/1,-743.85,101.96,40,0
A	goto	1442/1,-771.20,113.040,40,0
A	goto	1442/1,-785.36,141.69,40,0
A	goto	1442/1,-838.59,148.20,40,0
A	goto	1442/1,-865.93,142.34,40,0
A	goto	1442/1,-846.4,103.92,40,0
A	goto	1442/1,-819.54,76.24,40,0
A	goto	1442/1,-774.61,-5.17,40,0
A	goto	1442/1,-774.61,-27.96,40,0
A	goto	1442/1,-726.27,-39.36,40,0
A	collect	210534,1
A	mob	Grimtotem Mercenary
A	mob	Grimtotem Brute
A	mob	Grimtotem Sorcerer
A	mob	Grimtotem Ruffian
A	train	410021,1
S	Druid
T	xprate	<2.1
T	season	2
T	completewith	BloodFeedersPickup
A	equip	18,210534
A	use	210534
A	itemcount	210534,1
A	train	410021,1
S	Druid
T	xprate	<2.1
T	season	2
T	completewith	BloodFeedersPickup
A	train	410021
A	itemcount	210534,1
S	
T	xprate	<2.1
T	optional	
T	map	Stonetalon Mountains
A	goto	1413/1,-943.00,-265.06
A	turnin	6548
A	accept	6629
A	target	Makaba Flathoof
A	isQuestComplete	6548
S	
T	xprate	<2.1
T	optional	
T	label	AvengeVillageTurnin
T	map	Stonetalon Mountains
A	goto	1413/1,-943.00,-265.06
A	accept	6629
A	target	Makaba Flathoof
A	isQuestTurnedIn	6548
S	
T	xprate	<2.1
T	optional	
T	completewith	next
A	goto	1442/1,-460.13,67.77,30
A	isQuestTurnedIn	6548
S	
T	xprate	<2.1
T	optional	
A	goto	1442/1,-350.74,112.06
A	complete	6629,1
A	mob	+Grundig Darkcloud
A	complete	6629,2
A	mob	+Grimtotem Brute
A	isQuestTurnedIn	6548
S	
T	xprate	<2.1
T	optional	
A	goto	1442/1,-342.44,129.64
A	accept	6523,1
A	target	Kaya Flathoof
A	isQuestTurnedIn	6548
S	
T	xprate	<2.1
T	optional	
A	goto	1442/1,-261.38,90.57,40,0
A	goto	1442/1,-261.86,-7.12,40,0
A	goto	1442/1,-501.15,-41.64
A	complete	6523,1
A	target	Kaya Flathoof
A	isQuestTurnedIn	6548
S	
T	xprate	<2.1
T	optional	
T	map	Stonetalon Mountains
A	goto	1413/1,-943.00,-265.06
A	turnin	6629
A	turnin	6523
A	accept	6401
A	target	Makaba Flathoof
A	isQuestComplete	6523
A	isQuestComplete	6629
S	
T	xprate	<2.1
T	optional	
T	map	Stonetalon Mountains
A	goto	1413/1,-943.00,-265.06
A	turnin	6523
A	accept	6401
A	target	Makaba Flathoof
A	isQuestComplete	6523
S	
T	xprate	<2.1
T	optional	
T	map	Stonetalon Mountains
A	goto	1413/1,-943.00,-265.06
A	turnin	6629
A	target	Makaba Flathoof
A	isQuestComplete	6629
S	
T	xprate	<2.1
T	optional	
T	map	Stonetalon Mountains
A	goto	1413/1,-943.00,-265.06
A	accept	6401
A	target	Makaba Flathoof
A	isQuestTurnedIn	6523
S	
T	xprate	<2.1
T	completewith	next
A	goto	1442/1,-786.33,-294.97,60,0
A	goto	1442/1,-665.72,-280.97,40,0
A	goto	1442/1,-522.63,-294.32,40
S	
T	xprate	<2.1
T	label	BloodFeedersPickup
A	goto	1442/1,-233.54,-177.42
A	accept	6461
A	target	Xen'Zilla
S	
T	xprate	<2.1
T	completewith	next
A	goto	1442/1,-103.64,40.10,100,0
A	goto	1442/1,74.11,185.32,100,0
A	goto	1442/1,244.05,262.50,100,0
A	complete	6461,1
A	mob	Deepmoss Creeper
S	
T	xprate	<2.1
A	goto	1442/1,360.76,451.690
A	accept	6284
S	
T	xprate	<2.1
T	completewith	Besseleth1
A	complete	6461,2
A	mob	+Deepmoss Venomspitter
A	complete	6461,1
A	mob	+Deepmoss Creeper
S	
T	xprate	<2.1
T	completewith	next
A	complete	1069,1
A	group	0 << Priest/Mage
S	
T	xprate	<2.1
T	label	Besseleth1
T	loop	
A	goto	1442/1,569.77,573.79,0
A	goto	1442/1,711.87,513.23,50,0
A	goto	1442/1,684.04,582.91,50,0
A	goto	1442/1,569.77,573.79,50,0
A	complete	6284,1
A	unitscan	Besseleth
S	
T	xprate	<2.1
A	goto	1442/1,-44.56,84.05,80,0
A	goto	1442/1,245.51,255.01,80,0
A	goto	1442/1,392.01,445.17,40,0
A	goto	1442/1,560.49,440.94
A	complete	6461,1
A	mob	Deepmoss Creeper
S	
T	xprate	<2.1
T	completewith	next
A	goto	1442/1,735.8,925.8,50,0
A	goto	1442/1,806.12,929.05
A	subzone	460
S	
T	xprate	<2.1
A	goto	1442/1,927.72,893.56
A	vendor	
A	vendor	
A	target	Innkeeper Jayka
A	isOnQuest	1483
S	
T	xprate	<2.1
A	goto	1442/1,920.88,911.47
A	vendor	
A	vendor	
A	target	Jeeda
A	isOnQuest	1483
S	
T	xprate	<2.1
T	label	KayaLives
A	goto	1442/1,928.20,1015.99
A	turnin	6401
A	target	Tammra Windfield
A	isQuestTurnedIn	6523
S	
T	xprate	<2.1
A	goto	1442/1,940.9,925.14
A	turnin	6284
A	target	Maggran Earthbinder
A	isQuestComplete	6284
S	
T	xprate	<2.1
T	label	SRRFP
A	goto	1442/1,1041.99,967.80
A	fp	Sun Rock Retreat
A	target	Tharm
A	subzoneskip	460,1
S	
T	xprate	<2.1
T	completewith	next
A	goto	1442/1,365.16,878.250,15
S	
T	xprate	<2.1
A	goto	1442/1,365.16,878.250
A	turnin	1483
A	accept	1093
A	target	Ziz Fizziks
S	
T	xprate	<2.1
T	completewith	Windshear
A	complete	1069,1
S	
T	xprate	<2.1
T	loop	
A	goto	1442/1,352.46,912.44,0
A	goto	1442/1,352.46,912.44,50,0
A	goto	1442/1,297.77,959.660,50,0
A	goto	1442/1,250.40,990.59,50,0
A	goto	1442/1,259.68,1032.93,50,0
A	goto	1442/1,246.98,1068.09,50,0
A	goto	1442/1,207.91,1010.13,50,0
A	goto	1442/1,163.47,962.27,50,0
A	goto	1442/1,86.81,961.94,50,0
A	goto	1442/1,181.05,907.89,50,0
A	goto	1442/1,193.75,867.83,50,0
A	goto	1442/1,194.73,827.78,50,0
A	goto	1442/1,225.49,765.26,50,0
A	goto	1442/1,281.16,763.63,50,0
A	goto	1442/1,268.95,832.99,50,0
A	goto	1442/1,303.63,858.39,50,0
A	complete	6461,2
A	mob	Deepmoss Venomspitter
S	Troll Warrior/Orc Warrior/Tauren Warrior
T	xprate	<2.1
A	goto	1442/1,402.76,1231.88
A	collect	928,1,899,1
A	money	<0.9860
A	target	Veenix
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.1
S	Troll Warrior/Orc Warrior/Tauren Warrior
T	xprate	<2.1
T	optional	
T	completewith	BluePrints
A	use	928
A	itemcount	928,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.1
A	xp	<20,1
S	Undead Warrior
T	xprate	<2.1
A	goto	1442/1,402.76,1231.88
A	vendor	
A	money	<1.5024
A	target	Veenix
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.1
S	Undead Warrior
T	xprate	<2.1
T	optional	
T	completewith	BluePrints
A	use	4818
A	itemcount	4818,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.1
S	Undead Warrior
T	xprate	<2.1
T	optional	
T	completewith	BluePrints
A	use	922
A	itemcount	922,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.1
A	xp	<21,1
S	Shaman
T	xprate	<2.1
T	season	0
A	goto	1442/1,402.76,1231.88
A	collect	928,1,899,1
A	money	<0.9860
A	target	Veenix
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.2
S	Shaman
T	xprate	<2.1
T	season	0
T	optional	
T	completewith	BluePrints
A	use	928
A	itemcount	928,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.2
A	xp	<20,1
S	Shaman
T	xprate	<2.1
T	season	2
A	goto	1442/1,402.76,1231.88
A	collect	925,1,899,1
A	money	<0.7797
A	target	Veenix
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.8
S	Shaman
T	xprate	<2.1
T	season	2
T	optional	
T	completewith	BluePrints
A	use	925
A	itemcount	925,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.8
A	xp	<20,1
S	Rogue
T	xprate	<2.1
T	season	0
A	goto	1442/1,402.76,1231.88
A	collect	923,1,899,1
A	money	<0.8743
A	target	Veenix
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.1
S	Rogue
T	xprate	<2.1
T	season	0
T	optional	
T	completewith	BluePrints
A	use	923
A	itemcount	923,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.1
A	xp	<21,1
S	Rogue
T	xprate	<2.1
T	season	2
A	goto	1442/1,402.76,1231.88
A	collect	2209,1,899,1
A	money	<0.7115
A	target	Veenix
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<10.8
S	Rogue
T	xprate	<2.1
T	season	2
T	optional	
T	completewith	BluePrints
A	use	2209
A	itemcount	2209,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<10.8
A	xp	<19,1
S	
T	xprate	<2.1
T	label	Windshear
A	subzone	461
A	isOnQuest	1093
S	
T	xprate	<2.1
T	completewith	next
A	complete	1062,1
A	mob	Venture Co. Logger
S	
T	xprate	<2.1
T	label	BluePrints
T	loop	
A	goto	1442/1,179.10,1168.06,0
A	goto	1442/1,179.10,1168.06,100,0
A	goto	1442/1,232.82,1239.70,100,0
A	goto	1442/1,-16.23,1441.59,100,0
A	goto	1442/1,-255.52,1291.80,100,0
A	goto	1442/1,-382.48,1135.50,100,0
A	complete	1093,1
A	mob	Venture Co. Operator
S	
T	xprate	<2.1
T	loop	
A	goto	1442/1,242.58,1121.82,0
A	goto	1442/1,242.58,1121.82,50,0
A	goto	1442/1,292.39,1122.470,50,0
A	goto	1442/1,325.6,1168.39,50,0
A	goto	1442/1,338.79,1206.48,50,0
A	goto	1442/1,276.77,1248.49,50,0
A	goto	1442/1,215.24,1145.59,50,0
A	goto	1442/1,187.40,1114.33,50,0
A	goto	1442/1,138.57,1144.62,50,0
A	goto	1442/1,51.16,1153.41,50,0
A	goto	1442/1,-17.70,1128.33,50,0
A	goto	1442/1,-106.09,1157.31,50,0
A	goto	1442/1,-165.66,1173.60,50,0
A	goto	1442/1,-189.10,1079.82,50,0
A	goto	1442/1,-69.95,1061.91,50,0
A	goto	1442/1,10.63,1072.33,50,0
A	goto	1442/1,57.51,1056.05,50,0
A	goto	1442/1,107.32,1040.09,50,0
A	complete	1062,1
A	mob	Venture Co. Logger
S	
T	xprate	<2.1
T	loop	
A	goto	1442/1,246.98,1068.09,0
A	goto	1442/1,352.46,912.44,30,0
A	goto	1442/1,297.77,959.660,30,0
A	goto	1442/1,250.40,990.59,30,0
A	goto	1442/1,259.68,1032.93,30,0
A	goto	1442/1,246.98,1068.09,30,0
A	goto	1442/1,207.91,1010.13,30,0
A	goto	1442/1,163.47,962.27,30,0
A	goto	1442/1,86.81,961.94,30,0
A	goto	1442/1,181.05,907.89,30,0
A	goto	1442/1,193.75,867.83,30,0
A	goto	1442/1,194.73,827.78,30,0
A	goto	1442/1,225.49,765.26,30,0
A	goto	1442/1,281.16,763.63,30,0
A	goto	1442/1,268.95,832.99,30,0
A	goto	1442/1,303.63,858.39,30,0
A	complete	1069,1
S	
T	optional	
T	xprate	<2.1
T	completewith	next
S	
T	xprate	<2.1
A	goto	1442/1,365.16,878.250
A	turnin	1093
A	accept	1094
A	target	Ziz Fizziks
S	
T	xprate	<2.1
T	loop	
A	goto	1442/1,362.71,539.28,0
A	goto	1442/1,275.30,577.38,80,0
A	goto	1442/1,362.71,539.28,80,0
A	goto	1442/1,298.25,432.80,80,0
A	goto	1442/1,244.05,262.50,80,0
A	goto	1442/1,74.11,185.32,80,0
A	goto	1442/1,-103.64,40.10,80,0
A	complete	6461,1
A	mob	Deepmoss Creeper
S	Druid
T	completewith	DruidTraining2
A	cast	18960
A	zoneskip	Moonglade
S	Druid
T	optional	
A	goto	1450/1,-2593.82,7866.90
A	train	1430
A	target	Loganaar
A	xp	<18,1
A	xp	>20,1
S	Druid
T	optional	
A	goto	1450/1,-2593.82,7866.90
A	train	768
A	target	Loganaar
A	xp	<20,1
A	xp	>22,1
S	Druid
T	label	DruidTraining2
A	goto	1450/1,-2593.82,7866.90
A	train	1075
A	target	Loganaar
A	xp	<22,1
S	
T	completewith	JornSkyseerTurnin
A	hs	
A	use	6948
A	cooldown	item,6948,>0
A	bindlocation	378,1
A	subzoneskip	378
S	
T	completewith	next
A	goto	1413/1,-2595.75,-437.35
A	fly	Camp Taurajo
A	target	Devrak
A	subzoneskip	380,1
A	cooldown	item,6948,<0
S	
T	label	JornSkyseerTurnin
A	goto	1413/1,-1921.88,-2383.15
A	turnin	3261
A	accept	882
A	target	Jorn Skyseer
S	Warlock
T	season	2
T	sticky	
T	completewith	CounterattackTurnin3
T	label	ExplorerImp
A	train	445459
A	train	445459,1
A	train	1120,3
A	use	221978
S	Warlock/Mage
T	season	2
T	requires	ExplorerImp << Warlock
T	sticky	
T	completewith	CounterattackTurnin3
T	label	FelPortalRune
A	collect	221499,1 << Warlock
A	collect	223147,1 << Mage
A	itemcount	220792,1 << Mage
A	use	223148 << Warlock
A	use	220792 << Mage
A	train	429311,1 << Mage
A	train	431756,1 << Warlock
A	train	1120,3 << Warlock
A	unitscan	Fel Sliver
A	unitscan	Fel Crack
A	unitscan	Fel Tear
A	unitscan	Fel Scar
A	unitscan	Fel Rift
S	Warlock/Mage
T	season	2
T	requires	FelPortalRune
T	sticky	
T	completewith	CounterattackTurnin3
A	itemcount	221499,1 << Warlock
A	itemcount	223147,1 << Mage
A	train	431756
A	train	429311
A	use	221499 << Warlock
A	use	223147 << Mage
S	
T	completewith	LakotaMani2
A	complete	821,3
A	mob	Stormsnout
S	
T	completewith	next
A	complete	878,1
A	mob	+Bristleback Water Seeker
A	complete	878,2
A	mob	+Bristleback Thornweaver
A	complete	878,3
A	mob	+Bristleback Geomancer
A	complete	899,1
S	
T	label	LakotaMani2
T	loop	
A	goto	1413/1,-1951.27,-1956.15,0
A	goto	1413/1,-2031.32,-1703.47,0
A	goto	1413/1,-2183.32,-1858.19,0
A	goto	1413/1,-2453.88,-1991.28,0
A	goto	1413/1,-1951.27,-1956.15,80,0
A	goto	1413/1,-2031.32,-1703.47,80,0
A	goto	1413/1,-2183.32,-1858.19,80,0
A	goto	1413/1,-2453.88,-1991.28,80,0
A	collect	5099,1,883
A	accept	883
A	use	5099
A	unitscan	Lakota'mani
S	
T	completewith	next
A	complete	821,3
A	mob	Stormsnout
S	
T	loop	
A	goto	1413/1,-2515.7,-2076.41,0
A	goto	1413/1,-2515.7,-2076.41,60,0
A	goto	1413/1,-2518.74,-2125.73,60,0
A	goto	1413/1,-2517.72,-2223.7,60,0
A	goto	1413/1,-2486.31,-2254.1,60,0
A	goto	1413/1,-2494.42,-2282.48,60,0
A	goto	1413/1,-2531.91,-2272.34,60,0
A	goto	1413/1,-2571.43,-2295.31,60,0
A	goto	1413/1,-2620.07,-2285.18,60,0
A	goto	1413/1,-2625.14,-2245.32,60,0
A	goto	1413/1,-2755.86,-2082.49,60,0
A	goto	1413/1,-2813.62,-2054.12,60,0
A	goto	1413/1,-2811.59,-2004.12,60,0
A	goto	1413/1,-2783.22,-1949.39,60,0
A	goto	1413/1,-2747.75,-1889.26,60,0
A	goto	1413/1,-2709.24,-1913.59,60,0
A	goto	1413/1,-2706.2,-1948.72,60,0
A	goto	1413/1,-2687.96,-1973.04,60,0
A	goto	1413/1,-2678.84,-2016.28,60,0
A	goto	1413/1,-2584.6,-2050.74,60,0
A	complete	878,1
A	mob	+Bristleback Water Seeker
A	complete	878,2
A	mob	+Bristleback Thornweaver
A	complete	878,3
A	mob	+Bristleback Geomancer
A	complete	899,1
S	Warlock/Shaman
T	optional	
T	loop	
A	goto	1413/1,-2515.7,-2076.41,60,0
A	goto	1413/1,-2518.74,-2125.73,60,0
A	goto	1413/1,-2517.72,-2223.7,60,0
A	goto	1413/1,-2486.31,-2254.1,60,0
A	goto	1413/1,-2494.42,-2282.48,60,0
A	goto	1413/1,-2531.91,-2272.34,60,0
A	goto	1413/1,-2571.43,-2295.31,60,0
A	goto	1413/1,-2620.07,-2285.18,60,0
A	goto	1413/1,-2625.14,-2245.32,60,0
A	goto	1413/1,-2755.86,-2082.49,60,0
A	goto	1413/1,-2813.62,-2054.12,60,0
A	goto	1413/1,-2811.59,-2004.12,60,0
A	goto	1413/1,-2783.22,-1949.39,60,0
A	goto	1413/1,-2747.75,-1889.26,60,0
A	goto	1413/1,-2709.24,-1913.59,60,0
A	goto	1413/1,-2706.2,-1948.72,60,0
A	goto	1413/1,-2687.96,-1973.04,60,0
A	goto	1413/1,-2678.84,-2016.28,60,0
A	goto	1413/1,-2584.6,-2050.74,60,0
A	xp	19
S	
T	loop	
A	goto	1413/1,-2532.92,-1965.61,0
A	goto	1413/1,-2532.92,-1965.61,50,0
A	goto	1413/1,-2449.83,-1953.45,50,0
A	goto	1413/1,-2377.88,-2018.31,50,0
A	goto	1413/1,-2397.14,-2108.84,50,0
A	goto	1413/1,-2345.46,-2187.21,50,0
A	goto	1413/1,-2415.38,-2179.78,50,0
A	complete	821,3
A	mob	Stormsnout
S	
T	completewith	next
A	complete	865,1
A	mob	Sunscale Scytheclaw
S	
T	loop	
A	goto	1413/1,-2847.06,-1879.13,0
A	goto	1413/1,-2847.06,-1879.13,50,0
A	goto	1413/1,-2859.22,-1804.81,50,0
A	goto	1413/1,-2833.88,-1749.41,50,0
A	goto	1413/1,-2881.51,-1723.74,50,0
A	goto	1413/1,-2932.18,-1698.06.0,50,0
A	goto	1413/1,-2973.72,-1627.8,50,0
A	complete	821,2
A	mob	Greater Plainstrider
S	
T	loop	
A	goto	1413/1,-3183.48,-2015.61,0
A	goto	1413/1,-2646.42,-1529.16,0
A	goto	1413/1,-3183.48,-2015.61,90,0
A	goto	1413/1,-2646.42,-1529.16,90,0
A	complete	865,1
A	mob	Sunscale Scytheclaw
S	
T	completewith	next
A	collect	10338,1
A	mob	Zhevra Charger
S	
T	loop	
A	goto	1413/1,-3010.20,-1319.04,0
A	goto	1413/1,-3010.20,-1319.04,40,0
A	goto	1413/1,-2959.54,-1292.69,40,0
A	goto	1413/1,-2953.46,-1239.31,40,0
A	goto	1413/1,-2998.04,-1192.02,40,0
A	goto	1413/1,-3050.74,-1225.13,40,0
A	goto	1413/1,-3066.95,-1260.93,40,0
A	goto	1413/1,-3052.76,-1319.710,40,0
A	complete	880,1
A	mob	Oasis Snapjaw
S	Shaman/Priest
T	season	2
T	loop	
A	goto	1413/1,-3028.44,-685.30,40,0
A	goto	1413/1,-3034.52,-698.81,40,0
A	goto	1413/1,-2931.16,-816.37,40,0
A	goto	1413/1,-2946.36,-800.83,40,0
A	goto	1413/1,-3200.71,-821.78,40,0
A	goto	1413/1,-3209.83,-804.89,40,0
A	goto	1413/1,-3199.70,-799.480,40,0
A	goto	1413/1,-3212.87,-979.20,40,0
A	goto	1413/1,-3202.74,-998.79,40,0
A	goto	1413/1,-3337.51,-932.58,40,0
A	goto	1413/1,-3347.64,-923.12,40,0
A	goto	1413/1,-3349.67,-936.63,40,0
A	collect	208758,1 << Shaman
A	collect	205932,1 << Priest
A	unitscan	Desert Mirage
A	train	410107,1 << Shaman
A	train	402849,1 << Priest
A	train	370,3 << Shaman
A	train	527,3 << Priest
S	
T	completewith	next
A	collect	10338,1
A	mob	Zhevra Charger
S	
T	label	IshamuhalesFang
A	goto	1413/1,-3427.70,-436.67
A	use	10338
A	complete	882,1
A	mob	Ishamuhale
S	
T	completewith	FlytoXroads
A	goto	1413/1,-3768.18,-840.69 << Rogue
A	goto	1413/1,-3728.66,-835.29 << !Rogue
A	subzone	392
S	Rogue
A	goto	1413/1,-3768.18,-840.69
A	turnin	2381
A	target	Wrenix the Wretched
S	
T	label	BootyTurnin
A	goto	1413/1,-3728.66,-835.29
A	turnin	888
A	target	Gazlowe
A	isQuestComplete	888
S	
T	sticky	
T	completewith	FlytoXroads
T	season	2
A	goto	1413/1,-3639.48,-1049.46
A	use	210822 << Priest
A	use	210820 << Paladin
A	use	210654 << Mage
A	use	210818 << Hunter
A	use	210817 << Druid
A	use	210825 << Warrior
A	use	210824 << Warlock
A	use	210653 << Rogue
A	use	210823 << Shaman
A	train	415995
A	train	410010
A	train	401761
A	train	410122
A	train	416042
A	train	425445
A	train	425476
A	train	424990
A	train	410096
A	target	Grizzby
A	train	415995,1 << Priest
A	train	410010,1 << Paladin
A	train	401761,1 << Mage
A	train	410122,1 << Hunter
A	train	416042,1 << Druid
A	train	425445,1 << Warrior
A	train	425476,1 << Warlock
A	train	424990,1 << Rogue
A	train	410096,1 << Shaman
A	money	<3.0
S	
T	xprate	<2.1
A	turnin	1094
A	target	+Sputtervalve
A	goto	1413/1,-3759.06,-902.18
A	turnin	865
A	turnin	1069
A	accept	1491
A	target	+Mebok Mizzyrix
A	goto	1413/1,-3697.24,-929.20
A	turnin	821
A	target	+Brewmaster Drohn
A	goto	1413/1,-3687.11,-981.22
A	dungeon	WC
S	
T	xprate	<2.1
A	turnin	1094
A	target	+Sputtervalve
A	goto	1413/1,-3759.06,-902.18
A	turnin	865
A	turnin	1069
A	target	+Mebok Mizzyrix
A	goto	1413/1,-3697.24,-929.20
A	turnin	821
A	target	+Brewmaster Drohn
A	goto	1413/1,-3687.11,-981.22
S	
T	xprate	>2.09
A	turnin	865
A	accept	1491
A	target	+Mebok Mizzyrix
A	goto	1413/1,-3697.24,-929.20
A	turnin	821
A	target	+Brewmaster Drohn
A	goto	1413/1,-3687.11,-981.22
A	dungeon	WC
S	
T	xprate	>2.09
A	turnin	865
A	target	+Mebok Mizzyrix
A	goto	1413/1,-3697.24,-929.20
A	turnin	821
A	target	+Brewmaster Drohn
A	goto	1413/1,-3687.11,-981.22
S	Warrior
A	goto	1413/1,-3680.02,-982.58
A	vendor	
A	target	Grazlix
A	money	<0.619
A	itemStat	7,ITEM_MOD_ARMOR_SHORT,<155
A	isQuestTurnedIn	865
A	equip	7,4800
S	Rogue/Hunter/Warrior/Shaman/Druid
A	goto	1413/1,-3675.96,-985.28
A	vendor	
A	target	Vexspindle
A	money	<0.3515
A	itemStat	9,ITEM_MOD_ARMOR_SHORT,<37
A	isQuestTurnedIn	865
A	equip	9,4794
S	Warrior
T	optional	
T	completewith	FlytoXroads
A	use	4800
A	itemcount	4800,1
A	itemStat	7,ITEM_MOD_ARMOR_SHORT,<155
A	isQuestTurnedIn	865
A	equip	7,4800
S	Rogue/Hunter/Warrior/Shaman/Druid #optional
T	completewith	FlytoXroads
A	use	4794
A	itemcount	4794,1
A	itemStat	9,ITEM_MOD_ARMOR_SHORT,<37
A	isQuestTurnedIn	865
A	xp	<20,1
A	equip	9,4794
S	
A	goto	1413/1,-3664.82,-1050.14
A	home	
A	target	Innkeeper Wiley
A	dungeon	WC
A	bindlocation	392
A	isQuestTurnedIn	865
S	
A	goto	1413/1,-3770.20,-928.53
A	accept	959
A	target	Crane Operator Bigglefuzz
A	dungeon	WC
S	
T	label	FlytoXroads
T	completewith	XroadsHS2
A	goto	1413/1,-3770.20,-898.12
A	fly	Crossroads
A	target	Bragok
A	subzoneskip	380
S	Hunter
T	xprate	<2.1
A	goto	1413/1,-2595.75,-473.15
A	accept	6541
A	target	Thork
S	
T	xprate	<2.1
A	goto	1413/1,-2607.91,-475.180
A	turnin	875
A	accept	876
A	target	Darsok Swiftdagger
A	isQuestComplete	875
S	
T	xprate	<2.1
A	goto	1413/1,-2607.91,-475.180
A	accept	876
A	target	Darsok Swiftdagger
A	isQuestTurnedIn	875
S	
T	label	XroadsHS2
A	turnin	899
A	target	+Tonga Runetotem
A	goto	1413/1,-2641.35,-521.12
A	turnin	880
A	accept	1489
A	accept	3301
A	target	+Mankrik
A	goto	1413/1,-2672.76,-544.77
S	
A	goto	1413/1,-2555.22,-387.350
A	accept	868
A	target	Korran
S	
A	destroy	5085
A	itemcount	5085,1
S	Shaman
T	completewith	next
A	goto	1413/1,-2595.75,-437.35
A	fly	Orgrimmar
A	zoneskip	Orgrimmar
A	target	Devrak
S	Shaman
A	goto	1454/1,-4213.03,1920.94
A	accept	1528
A	target	Searn Firewarder
S	Shaman
A	goto	1454/1,-4225.09,1933.29
A	train	2645
A	target	Kardris Dreamseeker
S	Warlock
T	completewith	next
A	goto	1413/1,-2595.75,-437.35
A	fly	Orgrimmar
A	zoneskip	Orgrimmar
A	target	Devrak
S	Warlock
A	goto	1454/1,-4357.36,1850.41
A	trainer	
A	accept	1507
A	target	Gan'rul Bloodeye
S	Warlock
A	goto	1454/1,-4347.4,1836.57
A	collect	16346,1,1507,1
A	target	Kurgul
S	Warlock
A	goto	1454/1,-4340.53,1839.19
A	turnin	1507
A	accept	1508
A	target	Cazul
S	Warlock
A	goto	1454/1,-4299.99,1820.67
A	collect	5210,1,1507,1
A	money	<0.5808
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<17.4
A	target	Katis
S	Warlock
A	goto	1454/1,-4199.99,1717.49
A	turnin	1508
A	accept	1509
A	target	Zankaja
S	
T	completewith	EnterDM
A	subzone	1581
A	dungeon	DM
S	
T	completewith	ZepptoSTVforDM
A	fly	Orgrimmar
A	zoneskip	Orgrimmar
A	target	Devrak
A	dungeon	DM
S	Shaman
A	goto	1454/1,-4225.09,1933.29
A	train	8052
A	target	Kardris Dreamseeker
A	xp	<18,1
A	xp	>20,1
A	dungeon	DM
S	Shaman
T	optional	
A	goto	1454/1,-4225.09,1933.29
A	train	2645
A	target	Kardris Dreamseeker
A	xp	<20,1
A	dungeon	DM
S	Hunter
A	goto	1454/1,-4607.02,2100.64
A	train	14318
A	target	Ormak Grimshot
A	xp	<18,1
A	xp	>20,1
A	dungeon	DM
S	Hunter
T	optional	
A	goto	1454/1,-4607.02,2100.64
A	train	14290
A	target	Ormak Grimshot
A	xp	<20,1
A	dungeon	DM
S	Hunter
A	goto	1454/1,-4610.95,2135.15
A	train	5118
A	target	Xao'tsu
A	xp	<20,1
A	dungeon	DM
S	Warrior
A	goto	1454/1,-4801.42,1980.53
A	train	8198
A	target	Grezz Ragefist
A	xp	<18,1
A	xp	>20,1
A	dungeon	DM
S	Warrior
T	optional	
A	goto	1454/1,-4801.42,1980.53
A	train	845
A	target	Grezz Ragefist
A	xp	<20,1
A	dungeon	DM
S	Rogue
A	goto	1454/1,-4296.34,1762.67
A	train	1943
A	target	Ormok
A	xp	<20,1
A	dungeon	DM
S	Warlock
A	goto	1458/0,408.18,1587.21
A	train	1014
A	target	Zevrost
A	xp	<18,1
A	xp	>20,1
A	dungeon	DM
S	Warlock
T	optional	
A	goto	1458/0,408.18,1587.21
A	train	706
A	target	Zevrost
A	xp	<20,1
A	dungeon	DM
S	Mage
A	goto	1454/1,-4218.64,1473.72
A	train	3140
A	target	Pephredo
A	xp	<18,1
A	xp	>20,1
A	dungeon	DM
S	Mage
T	optional	
A	goto	1454/1,-4218.64,1473.72
A	train	1953
A	target	Pephredo
A	xp	<20,1
A	dungeon	DM
S	Priest
A	goto	1454/1,-4179.79,1452.580
A	train	970
A	target	Ur'kyo
A	xp	<18,1
A	xp	>20,1
A	dungeon	DM
S	Priest
T	optional	
A	goto	1454/1,-4179.79,1452.580
A	train	14914
A	target	Ur'kyo
A	xp	<20,1
A	dungeon	DM
S	
T	ah	
A	goto	1454/1,-4460.31,1685.31
A	collect	814,5,103,1
A	target	Auctioneer Thathung
A	dungeon	DM
S	
T	completewith	next
A	zone	Durotar
A	zoneskip	Durotar
A	dungeon	DM
S	
T	label	ZepptoSTVforDM
A	goto	1411/1,-4648.55,1321.88,40
A	zone	Stranglethorn Vale
A	zoneskip	Stranglethorn Vale
A	dungeon	DM
S	
A	goto	1434/0,273.91,-12406.71,40,0
A	goto	1434/0,492.15,-12499.03,40,0
A	goto	1434/0,759.53,-12494.77,60,0
A	goto	1434/0,1004.57,-12317.37.0,60,0
A	goto	1434/0,1178.78,-12166.78,60,0
A	goto	1434/0,1360.0,-11978.74,60,0
A	goto	1436/0,1578.87,-11699.5,60,0
A	goto	1436/0,1718.17,-11480.4,40,0
A	goto	1436/0,1966.32,-11407.13,200
A	dungeon	DM
S	
T	completewith	next
A	goto	1436/0,1966.32,-11407.13,40
A	dungeon	DM
S	
A	goto	1436/0,1966.32,-11407.13
A	accept	104
A	accept	103
A	target	Captain Grayson
A	dungeon	DM
S	
A	goto	1436/0,1966.32,-11407.13
A	turnin	103
A	itemcount	814,5
A	target	Captain Grayson
A	dungeon	DM
S	
A	goto	1436/0,1811.62,-11358.37
A	line	Westfall,34.43,83.93,34.43,83.93,33.88,83.32,33.08,82.86,32.56,82.71,32.08,82.49,31.91,82.36,31.55,81.88,30.86,81.42,30.63,81.16,30.33,80.81,30.02,80.11,29.68,79.22,29.32,78.19,29.29,77.60,29.27,77.31,29.18,76.26,29.07,75.29,28.95,74.14,28.85,73.29,28.79,72.48,28.37,71.94,27.84,71.29,27.44,70.25,27.29,69.47,27.13,68.65,27.09,67.57,27.07,67.01,26.74,66.09,27.07,67.01,27.09,67.57,27.13,68.65,27.29,69.47,27.44,70.25,27.84,71.29,28.37,71.94,28.79,72.48,28.85,73.29,28.95,74.14,29.07,75.29,29.18,76.26,29.27,77.31,29.29,77.60,29.32,78.19,29.68,79.22,30.02,80.11,30.33,80.81,30.63,81.16,30.86,81.42,31.55,81.88,31.91,82.36,32.08,82.49,32.56,82.71,33.08,82.86,33.88,83.32,34.43,83.93
A	complete	104,1
A	unitscan	Old Murk-Eye
A	dungeon	DM
S	
A	goto	1436/0,1966.32,-11407.13
A	turnin	104
A	target	Captain Grayson
A	dungeon	DM
S	
T	optional	
A	abandon	103
A	dungeon	DM
S	
T	label	EnterDM
A	goto	1415/0,1596.2,-11768.97,8,0
A	goto	1415/0,1596.2,-11780.71,8,0
A	goto	1415/0,1606.76,-11785.4,8,0
A	goto	1415/0,1582.12,-11799.48,8,0
A	goto	1415/0,1596.2,-11813.56,15,0
A	goto	1415/0,1631.4,-11846.41,15,0
A	goto	1415/0,1649.0,-11898.04,15,0
A	goto	1415/0,1659.56,-11919.16,15,0
A	goto	1415/0,1698.28,-11891.0,15,0
A	goto	1415/0,1744.04,-11881.61
A	zone	291
A	dungeon	DM
S	
A	hs	
A	zone	The Barrens
A	use	6948
A	dungeon	DM
S	
T	optional	
A	goto	1413/1,-3664.82,-1050.14
A	vendor	
A	vendor	
A	target	Innkeeper Wiley
A	subzoneskip	392,1
A	dungeon	WC
S	
T	optional	
A	goto	1413/1,-2645.40,-406.94
A	vendor	
A	vendor	
A	target	Innkeeper Boorand Plainswind
A	subzoneskip	380,1
A	dungeon	DM
S	Warlock
T	completewith	TurninDogran
A	goto	1413/1,-3770.20,-898.12
A	fly	Crossroads
A	target	Bragok
A	subzoneskip	392,1
A	dungeon	WC
S	Warlock
T	completewith	TurninDogran
A	goto	1454/1,-4313.60,1676.24
A	fly	Crossroads
A	zoneskip	Orgrimmar,1
A	target	Doras
S	Warlock
T	label	TurninDogran
A	goto	1413/1,-2639.32,-436.00
A	turnin	1509
A	accept	1510
A	target	Gazrog
S	Shaman
T	completewith	CallofWater01
A	goto	1454/1,-4313.60,1676.24
A	fly	Ratchet
A	target	Doras
A	zoneskip	Orgrimmar,1
S	Shaman
T	label	CallofWater01
A	goto	1413/1,-4047.86,-1345.39
A	turnin	1528
A	accept	1530
A	target	Islen Waterseer
S	!Warlock !Shaman
T	completewith	next
A	goto	1413/1,-3770.20,-898.12
A	fly	Crossroads
A	target	Bragok
A	subzoneskip	392,1
A	dungeon	WC
S	Shaman
T	completewith	next
A	goto	1413/1,-3770.20,-898.12
A	fly	Crossroads
A	target	Bragok
A	subzoneskip	380
S	
A	goto	1413/1,-2589.67,-424.51
A	accept	853
A	target	Apothecary Helbrim
A	isQuestTurnedIn	848
A	isQuestAvailable	853
S	
T	sticky	
T	completewith	ZamahTurnin
A	isOnQuest	853
S	!Warlock !Shaman
T	completewith	TribesTurnin
A	goto	1413/1,-3770.20,-898.12
A	fly	Camp Taurajo
A	target	Bragok
A	subzoneskip	392,1
A	dungeon	WC
S	Shaman
T	completewith	TribesTurnin
A	goto	1413/1,-3770.20,-898.12
A	fly	Camp Taurajo
A	target	Bragok
A	subzoneskip	380
S	
T	xprate	<2.1 << Warlock
T	completewith	TribesTurnin
A	goto	1413/1,-2595.75,-437.35
A	fly	Camp Taurajo
A	target	Devrak
A	subzoneskip	380,1
S	Warlock
T	xprate	>2.09
T	label	EnterSTMWL
T	completewith	KenZiglaWL
A	zone	Stonetalon Mountains
A	zoneskip	Stonetalon Mountains
S	Warlock
T	xprate	>2.09
T	completewith	next
A	goto	1442/1,-786.33,-294.97,60,0
A	goto	1442/1,-665.72,-280.97,40,0
A	goto	1442/1,-522.63,-294.32,40
S	Warlock
T	xprate	>2.09
T	label	KenZiglaWL
A	goto	1442/1,-331.21,-181.00
A	turnin	1510
A	accept	1511
A	target	Ken'zigla
S	Warlock
T	xprate	>2.09
T	completewith	next
A	hs	
A	subzoneskip	378
A	bindlocation	378,1
A	cooldown	item,6948,>0
A	dungeon	!WC
S	Warlock
T	xprate	>2.09
T	completewith	next
A	subzone	378
S	Warlock
T	xprate	>2.09
A	goto	1413/1,-1898.58,-2391.93
A	turnin	1511
A	accept	1515
A	target	Grunt Logmar
S	
A	goto	1413/1,-1891.48,-2391.93
A	collect	5075,1,5052,1
A	mob	Bristleback Water Seeker
A	mob	Bristleback Thornweaver
A	mob	Bristleback Geomancer
S	
T	label	TribesTurnin
A	goto	1413/1,-1891.48,-2391.93
A	turnin	878
A	accept	5052
A	turnin	5052
A	target	Mangletooth
A	addquestitem	5075,5052
S	
T	optional	
T	completewith	IshamuhaleTurnin
A	goto	1413/1,-1891.48,-2391.93,0
A	target	Mangletooth
S	
A	goto	1413/1,-1921.88,-2383.15
A	turnin	882
A	accept	907
A	turnin	883
A	target	Jorn Skyseer
A	isOnQuest	883
S	
T	label	IshamuhaleTurnin
A	goto	1413/1,-1921.88,-2383.15
A	turnin	882
A	accept	907
A	target	Jorn Skyseer
S	Warlock
T	xprate	>2.09
A	goto	1413/1,-1765.83,-1622.39
A	turnin	1515
A	accept	1512
A	target	Grunt Dogran
S	
T	completewith	next
A	goto	1413/1,-1899.59,-2624.34,0
A	goto	1413/1,-2016.12,-2650.02,0
A	goto	1413/1,-2400.18,-2398.01,0
A	goto	1413/1,-2363.70,-2537.19,0
A	goto	1413/1,-1899.59,-2624.34,80,0
A	goto	1413/1,-2016.12,-2650.02,80,0
A	goto	1413/1,-2363.70,-2537.19,80,0
A	goto	1413/1,-2400.18,-2398.01,80,0
A	collect	5102,1,884,1
A	accept	884
A	use	5102
A	unitscan	Owatanka
S	
T	loop	
A	goto	1413/1,-1868.18,-2498.00,0
A	goto	1413/1,-1868.18,-2498.00,60,0
A	goto	1413/1,-1861.08,-2561.51,60,0
A	goto	1413/1,-1842.84,-2618.94,60,0
A	goto	1413/1,-1888.44,-2650.690,60,0
A	goto	1413/1,-2004.98,-2683.80,60,0
A	goto	1413/1,-2133.67,-2590.56,60,0
A	goto	1413/1,-2182.31,-2479.76,60,0
A	goto	1413/1,-2232.98,-2478.41,60,0
A	goto	1413/1,-2273.51,-2456.79,60,0
A	goto	1413/1,-2356.60,-2513.54,60,0
A	goto	1413/1,-2428.55,-2517.60,60,0
A	goto	1413/1,-2406.26,-2424.36,60,0
A	goto	1413/1,-2363.70,-2395.98,60,0
A	goto	1413/1,-2253.24,-2345.99,60,0
A	complete	907,1
A	mob	Thunderhead
A	mob	Stormsnout
S	
A	goto	1413/1,-1921.88,-2383.15
A	turnin	884
A	turnin	907
A	accept	913
A	accept	6382
A	target	Jorn Skyseer
A	isOnQuest	884
S	
T	label	Thunderhawk
A	goto	1413/1,-1921.88,-2383.15
A	turnin	907
A	accept	913
A	accept	6382
A	target	Jorn Skyseer
S	Shaman
T	completewith	CallofWater2
A	goto	1413/1,-1899.59,-2624.34,0
A	goto	1413/1,-2016.12,-2650.02,0
A	goto	1413/1,-2400.18,-2398.01,0
A	goto	1413/1,-2363.70,-2537.19,0
A	goto	1413/1,-1899.59,-2624.34,80,0
A	goto	1413/1,-2016.12,-2650.02,80,0
A	goto	1413/1,-2363.70,-2537.19,80,0
A	goto	1413/1,-2400.18,-2398.01,80,0
A	collect	5102,1,884,1
A	accept	884
A	use	5102
A	unitscan	Owatanka
S	Shaman
T	completewith	CallofWater2
A	goto	1413/1,-1776.98,-3617.51,60
S	Shaman
T	completewith	next
A	complete	913,1
A	mob	Thunderhawk Hatchling
A	mob	Thunderhawk Cloudscraper
A	mob	Greater Thunderhawk
S	Shaman
T	label	CallofWater2
A	goto	1413/1,-1776.98,-3617.51
A	turnin	1530
A	accept	1535
A	target	Brine
S	Shaman
A	goto	1413/1,-1858.04,-3572.92
A	use	7766
A	complete	1535,1
S	Shaman
A	goto	1413/1,-1776.98,-3617.51
A	turnin	1535
A	accept	1536
A	target	Brine
S	Shaman
T	completewith	ThunderhawkTurnin
A	subzoneskip	378
S	Shaman
T	completewith	next
A	goto	1413/1,-1899.59,-2624.34,0
A	goto	1413/1,-2016.12,-2650.02,0
A	goto	1413/1,-2400.18,-2398.01,0
A	goto	1413/1,-2363.70,-2537.19,0
A	goto	1413/1,-1899.59,-2624.34,80,0
A	goto	1413/1,-2016.12,-2650.02,80,0
A	goto	1413/1,-2363.70,-2537.19,80,0
A	goto	1413/1,-2400.18,-2398.01,80,0
A	collect	5102,1,884,1
A	accept	884
A	use	5102
A	unitscan	Owatanka
S	Shaman
T	completewith	next
A	collect	5102,1,884,1
A	accept	884
A	use	5102
A	unitscan	Owatanka
S	
T	loop	
A	goto	1413/1,-1919.86,-2652.04,0
A	goto	1413/1,-1919.86,-2652.04,60,0
A	goto	1413/1,-2096.18,-2531.11,60,0
A	goto	1413/1,-2341.4,-2352.74,60,0
A	goto	1413/1,-1982.68,-2217.62,60,0
A	goto	1413/1,-1775.96,-2235.86,60,0
A	complete	913,1
A	mob	Thunderhawk Hatchling
A	mob	Thunderhawk Cloudscraper
S	
A	goto	1413/1,-1921.88,-2383.15
A	turnin	884
A	turnin	913
A	accept	874
A	target	Jorn Skyseer
A	isOnQuest	884
S	
T	label	ThunderhawkTurnin
A	goto	1413/1,-1921.88,-2383.15
A	turnin	913
A	accept	874
A	target	Jorn Skyseer
A	isQuestComplete	913
S	!Tauren
A	goto	1413/1,-1891.48,-2391.93
A	aura	16618
A	itemcount	5075,10
A	target	Mangletooth
S	!Tauren
T	completewith	next
A	goto	1412/1,-1480.52,-2339.56,120,0
A	zone	Mulgore
S	!Tauren
T	completewith	DeathDUPpickup
A	goto	1456/1,184.96,-1308.69
A	zone	Thunder Bluff
S	Tauren
T	completewith	DeathDUPpickup
A	goto	1413/1,-1881.35,-2384.50
A	fly	Thunder Bluff
A	target	Omusa Thunderhorn
S	Undead Warrior/Orc Warrior/Troll Warrior
A	goto	1456/1,89.46,-1286.50
A	train	199
A	train	227
A	target	Ansekhwa
S	Troll Hunter/Orc Hunter/Undead Warrior/Warlock/Priest
A	goto	1456/1,89.46,-1286.50
A	train	227
A	target	Ansekhwa
S	Rogue
A	goto	1456/1,89.46,-1286.50
A	train	198
A	target	Ansekhwa
S	Rogue
A	goto	1456/1,110.13,-1299.65
A	collect	3137,200,6544,1
A	target	Kuruk
S	
T	completewith	next
A	goto	1456/1,222.96,-1079.42,40,0
A	goto	1456/1,219.09,-1051.44,10
S	Rogue/Shaman
T	sticky	
T	completewith	DeathDUPpickup
A	goto	1456/1,218.68,-1028.41
A	accept	264
A	target	Clarice Foster
S	
A	goto	1456/1,278.48,-995.29
A	turnin	853
A	accept	962
A	target	Apothecary Zamah
A	isOnQuest	853
A	dungeon	WC
S	
T	optional	
A	goto	1456/1,278.48,-995.29
A	accept	962
A	target	Apothecary Zamah
A	dungeon	WC
S	
A	goto	1456/1,278.48,-995.29
A	turnin	853
A	target	Apothecary Zamah
A	isOnQuest	853
S	
T	optional	
T	label	ZamahTurnin
S	Priest
A	goto	1456/1,252.49,-956.04
A	accept	5642
A	trainer	
A	target	Miles Welsh
S	Mage
T	optional	
A	goto	1456/1,279.32,-950.76
A	train	12051
A	target	Archmage Shymm
A	xp	<20,1
A	xp	>22,1
S	Mage
T	optional	
A	goto	1456/1,279.32,-950.76
A	train	2138
A	target	Archmage Shymm
A	xp	<22,1
A	xp	>24,1
S	Mage
A	goto	1456/1,279.32,-950.76
A	train	2121
A	target	Archmage Shymm
A	xp	<24,1
S	
T	optional	
T	label	DeathDUPpickup
S	Shaman
T	optional	
A	goto	1456/1,269.92,-980.40
A	train	2645
A	target	Tigor Skychaser
A	xp	<20,1
A	xp	>22,1
S	Shaman
T	optional	
A	goto	1456/1,269.92,-980.40
A	train	8498
A	target	Tigor Skychaser
A	xp	<22,1
A	xp	>24,1
S	Shaman
T	optional	
A	goto	1456/1,269.92,-980.40
A	train	8046
A	target	Tigor Skychaser
A	xp	<24,1
S	
T	xprate	<2.1 << Warlock
T	completewith	next
A	skill	firstaid,80
A	skill	firstaid,<1,1
S	
T	xprate	<2.1 << Warlock
T	label	FirstAid2
A	goto	1456/1,206.88,-997.45
A	train	3277
A	train	7934
A	target	Pand Stonebinder
A	skill	firstaid,<1,1
S	Rogue
A	collect	6452,1
A	itemcount	1475,1
S	
T	completewith	next
A	goto	1456/1,-212.71,-1065.010,80
S	
A	goto	1456/1,-303.83,-1048.66
A	turnin	1489
A	accept	1490
A	target	Arch Druid Hamuul Runetotem
S	
A	goto	1456/1,-272.93,-1069.67
A	turnin	1490
A	accept	914
A	target	Nara Wildmane
A	dungeon	WC
S	
A	goto	1456/1,-272.93,-1069.67
A	turnin	1490
A	target	Nara Wildmane
S	Druid
A	goto	1456/1,-281.59,-1039.61
A	trainer	
A	target	Turak Runetotem
S	
T	label	SacredFlame
A	goto	1456/1,-56.98,-1207.80
A	accept	1195
A	target	Zangen Stonehoof
S	Hunter
T	completewith	HunterTraining2
A	goto	1456/1,-123.26,-1394.49,60
S	Hunter
T	optional	
A	goto	1456/1,-100.50,-1454.75
A	train	5118
A	target	Urek Thunderhorn
A	xp	<20,1
A	xp	>22,1
S	Hunter
T	optional	
A	goto	1456/1,-100.50,-1454.75
A	train	5118
A	target	Urek Thunderhorn
A	xp	<22,1
A	xp	>24,1
S	Hunter
T	label	HunterTraining2
T	optional	
A	goto	1456/1,-100.50,-1454.75
A	train	19885
A	target	Urek Thunderhorn
A	xp	<24,1
S	Hunter
A	goto	1456/1,-47.69,-1434.64
A	train	24494
A	target	Hesuwa Thunderhorn
S	Warrior
T	completewith	next
A	goto	1456/1,-123.26,-1394.49,60
S	Warrior
A	goto	1456/1,-81.09,-1457.74
A	train	845
A	accept	1823
A	target	Torm Ragetotem
S	Rogue
T	season	0
A	goto	1456/1,-36.52,-1244.05
A	collect	923,1,493,1
A	money	<0.8743
A	target	Kard Ragetotem
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.1
S	Rogue
T	season	0
T	optional	
T	completewith	FlyOrgSR
A	use	923
A	itemcount	923,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.1
A	xp	<21,1
S	Rogue
T	season	2
A	goto	1456/1,-36.52,-1244.05
A	collect	2209,1,493,1
A	money	<0.7115
A	target	Kard Ragetotem
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<10.9
S	Rogue
T	season	2
T	optional	
T	completewith	FlyOrgSR
A	use	2209
A	itemcount	2209,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<10.9
A	xp	<19,1
S	Warrior/Shaman
T	completewith	next
T	ah	
S	Warrior
A	goto	1456/1,-38.71,-1255.32
A	collect	928,1,493,1
A	money	<0.9860
A	target	Etu Ragetotem
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.2
S	Warrior
T	optional	
T	completewith	FlyCampT
A	use	928
A	itemcount	928,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.2
A	xp	<20,1
S	Shaman
T	season	0
A	goto	1456/1,-38.71,-1255.32
A	collect	928,1,493,1
A	money	<0.9860
A	target	Etu Ragetotem
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.2
S	Shaman
T	season	0
T	optional	
T	completewith	CallofWater2
A	use	928
A	itemcount	928,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.2
A	xp	<20,1
S	Shaman
T	season	2
A	goto	1456/1,-38.71,-1255.32
A	collect	925,1,493,1
A	money	<0.7797
A	target	Etu Ragetotem
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.8
S	Shaman
T	season	2
T	optional	
T	completewith	CallofWater2
A	use	925
A	itemcount	925,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.8
A	xp	<20,1
S	Hunter
A	goto	1456/1,26.31,-1167.93
A	collect	3027,1,493,1
A	money	<0.5643
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.1
A	target	Kuna Thunderhorn
S	Hunter
T	optional	
T	completewith	FlyCampT
A	use	3027
A	itemcount	3027,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.1
A	xp	<20,1
S	Hunter
A	goto	1456/1,26.31,-1167.93
A	collect	2515,1600,493,1 << Hunter
A	target	Kuna Thunderhorn
S	
T	completewith	next
A	goto	1456/1,26.1,-1196.66
A	fly	Crossroads
A	target	Tal
A	zoneskip	The Barrens
A	dungeon	WC
S	
T	sticky	
T	completewith	EnterWC
A	subzone	718
A	dungeon	WC
S	
A	goto	1413/1,-2053.62,-882.58,100
A	isOnQuest	914
A	dungeon	WC
S	
T	completewith	next
A	goto	1413/1,-2134.68,-764.35,0
A	goto	1413/1,-2134.68,-764.35,30,0
A	goto	1413/1,-2122.52,-734.62,20,0
A	goto	1414/1,-2061.94,-781.68,20,0
A	goto	1414/1,-2028.82,-828.29,10,0
A	goto	1414/1,-2021.46,-816.030,10
A	dungeon	WC
S	
A	accept	1486
A	target	+Nalpak
A	goto	1414/1,-2036.18,-796.40
A	accept	1487
A	target	+Ebru
A	goto	1414/1,-2039.86,-801.31
A	dungeon	WC
S	
T	optional	
T	hardcore	
T	completewith	EnterWC
A	complete	962,1
A	skill	herbalism,<1,1
A	isOnQuest	962
A	dungeon	WC
S	
T	hardcore	
T	completewith	EnterWC
A	complete	962,1
A	skill	herbalism,1,1
A	isOnQuest	962
A	dungeon	WC
S	
T	optional	
T	softcore	
T	completewith	EnterWC
A	complete	962,1
A	skill	herbalism,<1,1
A	isOnQuest	962
A	dungeon	WC
S	
T	softcore	
T	completewith	EnterWC
A	complete	962,1
A	skill	herbalism,1,1
A	isOnQuest	962
A	dungeon	WC
S	
T	hardcore	
T	completewith	EnterWC
A	complete	1486,1
A	dungeon	WC
A	isOnQuest	1486
S	
T	softcore	
T	completewith	EnterWC
A	complete	1486,1
A	dungeon	WC
A	isOnQuest	1486
S	
T	completewith	EnterWC
A	complete	1491,1
A	isOnQuest	1491
A	dungeon	WC
S	
T	label	MadMagg
T	loop	
A	goto	1414/1,-2058.26,-749.79,0
A	goto	1414/1,-2003.06,-659.01,0
A	goto	1414/1,-2072.98,-698.27,0
A	goto	1414/1,-2124.50,-730.16,0
A	goto	1414/1,-2058.26,-749.79,30,0
A	goto	1414/1,-2003.06,-659.01,30,0
A	goto	1414/1,-2072.98,-698.27,30,0
A	goto	1414/1,-2124.50,-730.16,30,0
A	complete	959,1
A	mob	Mad Magglish
A	isOnQuest	959
A	dungeon	WC
S	
T	label	EnterWC
A	goto	1414/1,-2028.82,-636.93,20,0
A	goto	1414/1,-2050.90,-585.41,20,0
A	goto	1414/1,-2168.66,-607.49,30,0
A	goto	1414/1,-2216.5,-742.43,30
A	dungeon	WC
S	
T	optional	
T	hardcore	
T	completewith	GlowingShard
A	complete	962,1
A	skill	herbalism,<1,1
A	isOnQuest	962
A	dungeon	WC
S	
T	optional	
T	hardcore	
T	completewith	GlowingShard
A	complete	962,1
A	skill	herbalism,1,1
A	isOnQuest	962
A	dungeon	WC
S	
T	optional	
T	softcore	
T	completewith	GlowingShard
A	complete	962,1
A	skill	herbalism,<1,1
A	isOnQuest	962
A	dungeon	WC
S	
T	optional	
T	softcore	
T	completewith	GlowingShard
A	complete	962,1
A	skill	herbalism,1,1
A	isOnQuest	962
A	dungeon	WC
S	
T	optional	
T	hardcore	
T	completewith	GlowingShard
A	complete	1491,1
A	isOnQuest	1491
A	dungeon	WC
S	
T	optional	
T	softcore	
T	completewith	GlowingShard
A	complete	1491,1
A	isOnQuest	1491
A	dungeon	WC
S	
T	completewith	GlowingShard
A	complete	1487,1
A	mob	+Deviate Ravager
A	complete	1487,2
A	mob	+Deviate Viper
A	complete	1487,3
A	mob	+Deviate Shambler
A	complete	1487,4
A	mob	+Deviate Dreadfang
A	complete	1486,1
A	isOnQuest	1487
A	dungeon	WC
S	
T	label	Gems
A	complete	914,1
A	mob	+Lord Cobrahn
A	complete	914,2
A	mob	+Lady Anacondra
A	complete	914,3
A	mob	+Lord Pythas
A	complete	914,4
A	mob	+Lord Serpentis
A	isOnQuest	914
A	dungeon	WC
S	
T	requires	Gems
T	completewith	next
A	target	Disciple of Naralex
A	skipgossip	
A	dungeon	WC
S	
T	label	GlowingShard
A	collect	10441,1
A	accept	6981
A	use	10441
A	mob	Mutanus the Devourer
A	dungeon	WC
S	
T	optional	
T	completewith	DeviateRaptors
A	complete	1491,1
A	isOnQuest	1491
A	dungeon	WC
S	
T	optional	
T	hardcore	
T	completewith	Ectoplasms
A	complete	962,1
A	skill	herbalism,<1,1
A	isOnQuest	962
A	dungeon	WC
S	
T	optional	
T	hardcore	
T	completewith	Ectoplasms
A	complete	962,1
A	skill	herbalism,1,1
A	isOnQuest	962
A	dungeon	WC
S	
T	optional	
T	softcore	
T	completewith	Ectoplasms
A	complete	962,1
A	skill	herbalism,<1,1
A	isOnQuest	962
A	dungeon	WC
S	
T	optional	
T	softcore	
T	completewith	Ectoplasms
A	complete	962,1
A	skill	herbalism,1,1
A	isOnQuest	962
A	dungeon	WC
S	
T	optional	
A	complete	1487,1
A	mob	+Deviate Ravager
A	complete	1487,2
A	mob	+Deviate Viper
A	complete	1487,3
A	mob	+Deviate Shambler
A	complete	1487,4
A	mob	+Deviate Dreadfang
A	complete	1486,1
A	disablecheckbox	
A	isOnQuest	1487
A	isOnQuest	1486
A	dungeon	WC
S	
A	complete	1487,1
A	mob	+Deviate Ravager
A	complete	1487,2
A	mob	+Deviate Viper
A	complete	1487,3
A	mob	+Deviate Shambler
A	complete	1487,4
A	mob	+Deviate Dreadfang
A	isOnQuest	1487
A	dungeon	WC
S	
T	label	DeviateRaptors
A	complete	1486,1
A	mob	Deviate Ravager
A	mob	Deviate Viper
A	mob	Deviate Shambler
A	mob	Deviate Dreadfang
A	isOnQuest	1486
A	dungeon	WC
S	
T	label	Ectoplasms
A	complete	1491,1
A	mob	Devouring Ectoplasm
A	mob	Evolving Ectoplasm
A	mob	Nightmare Ectoplasm
A	isOnQuest	1491
A	dungeon	WC
S	
T	optional	
T	hardcore	
A	complete	962,1
A	skill	herbalism,<1,1
A	isOnQuest	962
A	dungeon	WC
S	
T	optional	
T	hardcore	
A	complete	962,1
A	skill	herbalism,1,1
A	isOnQuest	962
A	dungeon	WC
S	
T	optional	
T	softcore	
A	complete	962,1
A	skill	herbalism,<1,1
A	isOnQuest	962
A	dungeon	WC
S	
T	optional	
T	softcore	
A	complete	962,1
A	skill	herbalism,1,1
A	isOnQuest	962
A	dungeon	WC
S	
T	completewith	GShard
A	hs	
A	use	6948
A	dungeon	WC
S	
A	goto	1413/1,-3697.24,-929.20
A	turnin	1491
A	target	Mebok Mizzyrix
A	isQuestComplete	1491
A	dungeon	WC
S	
A	goto	1413/1,-3770.20,-928.53
A	turnin	959
A	target	Crane Operator Bigglefuzz
A	isQuestComplete	959
A	dungeon	WC
S	
T	label	GShard
A	goto	1413/1,-3760.07,-902.18
A	complete	6981,1
A	skipgossip	
A	target	Sputtervalve
A	isOnQuest	6981
A	dungeon	WC
S	
A	goto	1413/1,-3770.20,-898.12
A	fly	Crossroads
A	target	Bragok
A	isOnQuest	6981
A	dungeon	WC
S	
T	completewith	next
A	goto	1413/1,-2493.40,-708.95,20,0
A	goto	1413/1,-2404.23,-721.11,20,0
A	goto	1413/1,-2356.60,-685.98,20,0
A	goto	1413/1,-2259.32,-602.20,50
A	dungeon	WC
S	
A	goto	1413/1,-2259.32,-602.20
A	turnin	6981
A	accept	3369
A	target	Falla Sagewind
A	isOnQuest	6981
A	dungeon	WC
S	
A	goto	1413/1,-2259.32,-602.20
A	accept	3369
A	target	Falla Sagewind
A	isQuestTurnedIn	6981
A	dungeon	WC
S	
A	turnin	1486
A	target	+Nalpak
A	goto	1414/1,-2036.18,-796.40
A	turnin	1487
A	target	+Ebru
A	goto	1414/1,-2039.86,-801.31
A	isQuestComplete	1487
A	isQuestComplete	1486
A	dungeon	WC
S	
A	goto	1414/1,-2039.86,-801.31
A	turnin	1487
A	target	Ebru
A	isQuestComplete	1487
A	dungeon	WC
S	
A	goto	1414/1,-2036.18,-796.40
A	turnin	1486
A	target	Nalpak
A	isQuestComplete	1486
A	dungeon	WC
S	
T	completewith	WCEnd
A	goto	1413/1,-2595.75,-437.35
A	fly	Thunder Bluff
A	target	Devrak
A	zoneskip	Thunder Bluff
A	dungeon	WC
S	skip
T	completewith	next
A	goto	1413/1,-1881.35,-2384.50,100
A	subzoneskip	378
A	dungeon	WC
S	skip
A	goto	1413/1,-1881.35,-2384.50
A	fly	Thunder Bluff
A	target	Omusa Thunderhorn
A	dungeon	WC
S	
A	goto	1456/1,-272.93,-1069.67
A	turnin	914
A	target	Nara Wildmane
A	isQuestComplete	914
A	dungeon	WC
S	
A	goto	1456/1,-303.83,-1048.66
A	turnin	3369
A	target	Arch Druid Hamuul Runetotem
A	isOnQuest	3369
A	dungeon	WC
S	
T	completewith	next
A	goto	1456/1,219.09,-1051.44,10
A	isQuestComplete	962
A	dungeon	WC
S	
A	goto	1456/1,276.6,-996.12
A	turnin	962
A	target	Apothecary Zamah
A	isQuestComplete	962
A	dungeon	WC
S	
T	optional	
A	abandon	1486
S	
T	optional	
A	abandon	1487
S	
T	optional	
A	abandon	1491
S	
T	optional	
A	abandon	959
S	
T	optional	
A	abandon	914
S	
T	optional	
A	abandon	962
S	
T	xprate	<2.1
T	completewith	Serena
A	goto	1456/1,26.1,-1196.66
A	fly	Crossroads
A	target	Tal
A	subzoneskip	380
S	
T	xprate	<2.1
A	goto	1413/1,-1972.55,-306.95
A	turnin	852
A	target	Regthar Deathgate
A	isQuestComplete	852
S	
T	xprate	<2.1
A	goto	1413/1,-1972.55,-306.95
A	turnin	855
A	target	Regthar Deathgate
A	isQuestComplete	855
S	
T	xprate	<2.1
T	completewith	CounterattackTurnin2
S	
T	xprate	<2.1
A	goto	1413/1,-1972.55,-306.95
A	accept	4021
A	target	Regthar Deathgate
A	isQuestTurnedIn	852
S	
T	xprate	<2.1
A	goto	1413/1,-1884.39,-289.38
A	complete	4021,1
A	unitscan	Warlord Krom'zar
A	isQuestTurnedIn	852
S	
T	xprate	<2.1
T	label	CounterattackTurnin2
A	goto	1413/1,-1972.55,-306.95
A	turnin	4021
A	target	Regthar Deathgate
A	isQuestComplete	4021
S	
T	xprate	<2.1
A	goto	1413/1,-1972.55,-306.95
A	turnin	855
A	target	Regthar Deathgate
A	isQuestComplete	855
S	
T	xprate	<2.1
T	optional	
T	completewith	Serena
A	abandon	855
S	
T	xprate	<2.1
T	label	Serena
A	goto	1413/1,-1345.3,790.94
A	complete	876,1
A	mob	Serena Bloodfeather
A	isQuestTurnedIn	875
S	Hunter
T	xprate	<2.1
A	goto	1413/1,-2347.48,857.83
A	turnin	3921
A	target	Wenikee Boltbucket
A	isOnQuest	3921
S	Hunter
T	xprate	<2.1
A	goto	1413/1,-2253.24,1246.31
A	turnin	6541
A	target	Kadrak
S	Hunter
T	xprate	<2.1
A	goto	1440/1,-2240.94,1778.570
A	accept	6544
A	target	Torek
S	Hunter
T	xprate	<2.1
A	goto	1440/1,-2110.61,1809.320,60,0
A	goto	1440/1,-2052.37,1776.27,20,0
A	goto	1440/1,-2006.81,1777.42,10,0
A	goto	1440/1,-2037.38,1777.04
A	complete	6544,1
A	mob	Silverwing Warrior
A	mob	Silverwing Sentinel
A	unitscan	Duriel Moonfire
S	Hunter
T	xprate	<2.1
A	goto	1440/1,-2511.97,2271.73
A	turnin	6544
A	target	Ertog Ragetusk
A	isQuestComplete	6544
S	Hunter
T	xprate	<2.1
A	goto	1440/1,-2554.65,2310.55
A	turnin	6382
A	turnin	6383
A	target	Senani Thunderheart
S	Hunter
T	xprate	<2.1
A	goto	1440/1,-2520.05,2305.55
A	fp	Splintertree Post
A	target	Vhulgra
S	Hunter
T	xprate	<2.1
T	completewith	EnterSTM2
A	goto	1440/1,-2520.05,2305.55
A	fly	Crossroads
A	target	Vhulgra
A	zoneskip	The Barrens
S	!Hunter
T	xprate	<2.1
T	softcore	
T	completewith	next
A	deathskip	
S	!Hunter
T	xprate	<2.1
T	hardcore	
T	completewith	next
A	subzone	380
S	
T	xprate	<2.1
A	goto	1413/1,-2607.91,-474.51
A	turnin	876
A	accept	1060
A	target	Darsok Swiftdagger
A	isQuestComplete	876
S	
T	xprate	<2.1
T	optional	
A	goto	1413/1,-2607.91,-474.51
A	accept	1060
A	target	Darsok Swiftdagger
A	isQuestTurnedIn	876
S	
A	goto	1413/1,-2555.22,-387.350
A	accept	868
A	target	Korran
S	
T	xprate	<2.1
T	completewith	CounterattackTurnin3
S	
T	xprate	<2.1
A	goto	1413/1,-1972.55,-306.95
A	accept	4021
A	target	Regthar Deathgate
A	isQuestTurnedIn	852
S	
T	xprate	<2.1
A	goto	1413/1,-1884.39,-289.38
A	complete	4021,1
A	unitscan	Warlord Krom'zar
A	isQuestTurnedIn	852
S	
T	xprate	<2.1
T	label	CounterattackTurnin3
A	goto	1413/1,-1972.55,-306.95
A	turnin	4021
A	target	Regthar Deathgate
A	isQuestComplete	4021
S	
T	xprate	<2.1
T	label	EnterSTM2
T	completewith	STMturnins1
A	zone	Stonetalon Mountains
A	zoneskip	Stonetalon Mountains
S	
T	xprate	<2.1
T	label	STMturnins1
T	map	Stonetalon Mountains
A	goto	1413/1,-950.10,-271.14
A	turnin	1062
A	timer	4,Goblin Invaders RP
A	accept	1063
A	target	Seereth Stonebreak
S	
T	xprate	<2.1
T	completewith	next
A	goto	1442/1,-786.33,-294.97,60,0
A	goto	1442/1,-665.72,-280.97,40,0
A	goto	1442/1,-522.63,-294.32,40
S	
T	xprate	<2.1
A	goto	1442/1,-394.20,-272.50
A	turnin	1060
A	target	Witch Doctor Jin'Zil
A	isQuestTurnedIn	876
S	Warlock
T	xprate	<2.1
A	goto	1442/1,-331.21,-181.00
A	turnin	1510
A	accept	1511
A	target	Ken'zigla
S	
T	xprate	<2.1
A	goto	1442/1,-233.54,-177.42
A	turnin	6461
A	target	Xen'Zilla
S	skip
T	xprate	<2.1
A	goto	1442/1,-401.53,-277.710
A	goto	1456/1,-74.62,-981.93,30
A	link	https://www.youtube.com/watch?v=cp2YI86AO4Y&ab
S	skip
T	xprate	<2.1 << !Warlock
T	completewith	ElderCroneTurnin
A	goto	1456/1,-48.84,-1037.94,20,0
A	goto	1456/1,-13.04,-1107.95,40
S	
T	xprate	<2.1
A	hs	
A	bindlocation	1638,1
A	zoneskip	Thunder Bluff
A	use	6948
S	
T	xprate	<2.1
T	completewith	next
A	goto	1456/1,-212.71,-1065.010,80
S	
T	xprate	<2.1
T	label	ElderCroneTurnin
A	goto	1456/1,-212.71,-1065.010
A	turnin	1063
A	timer	6,The Elder Crone RP
A	accept	1064
A	target	Magatha Grimtotem
S	
T	xprate	<2.1
A	goto	1456/1,278.48,-995.29
A	turnin	1064
A	accept	1065
A	target	Apothecary Zamah
S	!Shaman !Rogue
A	goto	1456/1,26.1,-1196.66
A	fly	Camp Taurajo
A	target	Tal
A	subzoneskip	378
S	Warlock
T	xprate	<2.1
A	goto	1413/1,-1898.58,-2391.93
A	turnin	1511
A	accept	1515
A	target	Grunt Logmar
S	Warlock
T	xprate	<2.1
A	goto	1413/1,-1765.83,-1622.39
A	turnin	1515
A	accept	1512
A	target	Grunt Dogran
S	Shaman/Rogue
T	label	FlyOrgSR
A	goto	1456/1,26.1,-1196.66
A	fly	Orgrimmar
A	target	Tal
A	zoneskip	Thunder Bluff,1
S	Shaman
A	goto	1413/1,-1881.35,-2384.50
A	fly	Orgrimmar
A	target	Omusa Thunderhorn
A	zoneskip	The Barrens,1
S	Shaman
A	goto	1454/1,-4225.09,1933.29
A	train	8498
A	target	Kardris Dreamseeker
A	xp	<22,1
A	xp	>24,1
S	Shaman
T	optional	
A	goto	1454/1,-4225.09,1933.29
A	train	905
A	target	Kardris Dreamseeker
A	xp	<24,1
S	Rogue
T	completewith	next
A	goto	1454/1,-4320.75,1750.51
A	collect	2207,1
A	target	Kareth
S	Rogue
A	goto	1454/1,-4284.42,1771.28
A	train	921
A	train	8676
A	train	1943
A	train	1856
A	train	1725
A	train	1785
A	accept	2460
A	target	Shenthul
S	Rogue
A	goto	1454/1,-4284.42,1771.28
A	complete	2460,1
A	target	Shenthul
S	Rogue
A	goto	1454/1,-4284.42,1771.28
A	turnin	2460
A	accept	2458
A	target	Shenthul
S	Rogue
A	goto	1454/1,-4271.1,1810.94
A	collect	2928,40,2479,1
A	collect	3371,40,2479,1
A	collect	5140,20,2479,1
A	target	Rekkul
S	Rogue
T	completewith	MissionProbable
A	goto	1454/1,-4048.36,1697.85,80,0
A	goto	1454/1,-3900.25,1681.48,30,0
A	goto	1454/1,-3933.49,1707.86,50
A	zoneskip	The Barrens
S	Rogue
T	completewith	MissionProbable
A	goto	1413/1,-3216.92,1107.13,120
S	Rogue
T	completewith	next
A	goto	1413/1,-3021.35,1214.56
A	use	8051
A	target	Taskmaster Fizzule
S	Rogue
T	label	MissionProbable
A	goto	1413/1,-2995.0,1236.85
A	turnin	2458
A	accept	2478
A	target	Taskmaster Fizzule
S	Rogue
A	goto	1413/1,-2930.15,1209.15
A	complete	2478,5
A	mob	Foreman Silixiz
S	Rogue
T	completewith	roguetowerq
S	Rogue
T	label	roguetowerq
A	goto	1413/1,-2922.04,1224.69
A	complete	2478,1
A	mob	+Mutated Venture Co. Drone
A	complete	2478,3
A	mob	+Venture Co. Patroller
A	complete	2478,2
A	mob	+Venture Co. Lookout
S	Rogue
A	goto	1413/1,-2927.11,1236.18
A	complete	2478,4
A	mob	Grand Foreman Puzik Gallywix
S	Rogue
A	goto	1413/1,-2927.11,1236.18
A	complete	2478,6
S	skip --Rogue/Druid
T	hardcore	
T	completewith	next
A	goto	1413/1,-3591.86,1328.06,120
S	skip --Rogue
T	hardcore	
A	goto	1413/1,-3505.72,1358.46
A	goto	1454/1,-4242.34,1637.33,30
A	link	https://www.youtube.com/watch?v=U7YfoaO-X8E&ab_channel=RestedXP
A	zoneskip	Orgrimmar
S	Rogue
T	softcore	
T	completewith	next
A	deathskip	
S	Rogue
T	softcore	
A	goto	1413/1,-2595.75,-437.35
A	fly	Orgrimmar
A	zoneskip	Orgrimmar
A	target	Devrak
S	Rogue
T	hardcore	
A	goto	1414/1,-3839.37,1644.65
A	zone	Orgrimmar
A	isQuestComplete	2478
S	Rogue
A	goto	1454/1,-4284.42,1771.28
A	turnin	2478
A	accept	2479
A	target	Shenthul
S	Rogue
A	goto	1454/1,-4271.1,1810.94
A	collect	2928,20,2479,1
A	collect	3371,20,2479,1
A	target	Rekkul
S	Rogue
A	itemcount	6452,1
A	use	6452
A	aura	-9991
S	Rogue
A	destroy	8051
A	destroy	8066
S	
T	optional	
A	abandon	6421
S	
T	optional	
A	abandon	4021
S	
T	optional	
A	abandon	6481
S	
T	optional	
A	abandon	6284
S	
T	optional	
A	abandon	6641
S	
T	optional	
A	abandon	6563
E
G	Guides/forever/Alliance-Mage-1-12.lua
M	classic	
M	tbc	
M	selector	Human Mage
M	name	1-10 Elwynn Forest Mage AoE
M	version	1
M	group	RestedXP Forever Guide (A)
M	subgroup	Speedrun Guide Mage
M	defaultfor	Human
M	next	10-12 Loch Modan Mage AoE
S	
T	sticky	
T	completewith	next
A	goto	1429/0,-136.52,-8933.53
S	
A	goto	1429/0,-136.52,-8933.53
A	target	Deputy Willem
A	accept	783
S	
A	goto	1429/0,-162.62,-8902.59
A	turnin	783
A	target	Marshal McBride
A	accept	7
S	
A	goto	1429/0,-136.52,-8933.53
A	target	Deputy Willem
A	accept	5261
S	
A	goto	1429/0,-68.11,-8874.67
A	vendor	
A	collect	159,10
S	
A	xp	2
S	
A	goto	1429/0,-161.82,-8870.05
A	turnin	5261
A	target	Eagan Peltskinner
A	accept	33
S	
A	goto	1429/0,-64.64,-8881.62,40,0
A	goto	1429/0,-68.11,-8809.87,40,0
A	goto	1429/0,-116.70,-8800.61,40,0
A	goto	1429/0,-64.64,-8881.62,40,0
A	goto	1429/0,-68.11,-8809.87,40,0
A	goto	1429/0,-116.70,-8800.61,40,0
A	complete	33,1
S	
A	goto	1429/0,-109.76,-8756.63,40,0
A	goto	1429/0,-189.59,-8777.46,40,0
A	goto	1429/0,-109.76,-8756.63,40,0
A	goto	1429/0,-189.59,-8777.46,40,0
A	goto	1429/0,-109.76,-8756.63,40,0
A	goto	1429/0,-189.59,-8777.46,40,0
A	complete	7,1
S	
A	goto	1429/0,-161.82,-8870.05
A	target	Eagan Peltskinner
A	turnin	33
S	
A	goto	1429/0,-116.70,-8900.14
A	vendor	
S	
A	goto	1429/0,-162.62,-8902.59
A	turnin	7
A	target	Marshal McBride
A	accept	15
A	accept	3104
S	
A	xp	3
S	
A	goto	1429/0,-113.23,-8779.78,40,0
A	goto	1429/0,-81.99,-8684.88,40,0
A	goto	1429/0,-151.41,-8726.54,40,0
A	goto	1429/0,-113.23,-8779.78,40,0
A	goto	1429/0,-81.99,-8684.88,40,0
A	goto	1429/0,-151.41,-8726.54,40,0
A	complete	15,1
S	
A	goto	1429/0,-120.17,-8897.82
A	xp	3+1110
S	
A	goto	1429/0,-120.17,-8897.82
A	vendor	
S	
A	goto	1429/0,-162.62,-8902.59
A	turnin	15
A	target	Marshal McBride
A	accept	21
S	
A	goto	1429/0,-175.70,-8881.62,15,0
A	goto	1429/0,-182.65,-8865.42,15,0
A	goto	1429/0,-188.23,-8851.58
A	target	Khelden Bremen
A	turnin	3104
A	trainer	
S	
A	goto	1429/0,-136.52,-8933.53
A	target	Deputy Willem
A	accept	18
S	
A	goto	1429/0,-328.42,-9147.80,60,0
A	goto	1429/0,-397.84,-9036.70,60,0
A	goto	1429/0,-363.13,-8909.39,60,0
A	goto	1429/0,-328.42,-9147.80,60,0
A	goto	1429/0,-397.84,-9036.70,60,0
A	goto	1429/0,-363.13,-8909.39,60,0
A	complete	18,1
S	
A	goto	1429/0,-136.52,-8933.53
A	turnin	18
A	target	Deputy Willem
A	accept	6
A	accept	3903
S	
A	goto	1429/0,-120.17,-8897.82
A	vendor	
S	
A	goto	1429/0,-363.13,-8909.39,60,0
A	goto	1429/0,-120.17,-8673.31,60,0
A	goto	1429/0,-213.88,-8564.52,60,0
A	goto	1429/0,-120.17,-8673.31,60,0
A	goto	1429/0,-213.88,-8564.52,60,0
A	goto	1429/0,-120.17,-8673.31,60,0
A	goto	1429/0,-213.88,-8564.52,60,0
A	goto	1429/0,-120.17,-8673.31,60,0
A	goto	1429/0,-213.88,-8564.52,60,0
A	complete	21,1
S	
A	xp	5
S	
T	era/som	
A	goto	1429/0,-224.30,-8846.90
A	turnin	3903
A	target	Milly Osworth
A	accept	3904
S	
T	som	
T	phase	3-6
A	goto	1429/0,-224.30,-8846.90
A	target	Milly Osworth
A	turnin	3903
S	
T	era/som	
A	goto	1429/0,-356.19,-9082.99
A	complete	3904,1
S	
A	goto	1429/0,-460.31,-9055.21
A	complete	6,1
S	
A	xp	5+1175
A	goto	1429/0,-224.30,-8846.90
S	
T	era/som	
A	goto	1429/0,-224.30,-8846.90
A	turnin	3904
A	target	Milly Osworth
A	accept	3905
S	
A	goto	1429/0,-136.52,-8933.53
A	target	Deputy Willem
A	turnin	6
S	
A	goto	1429/0,-162.62,-8902.59
A	turnin	21
A	target	Marshal McBride
A	accept	54
S	
T	era/som	
A	goto	1429/0,-186.12,-8902.45,15,0
A	goto	1429/0,-161.82,-8895.51,15,0
A	goto	1429/0,-181.64,-8902.13
A	target	Brother Neals
A	turnin	3905
S	
A	goto	1429/0,-47.28,-9043.64
A	target	Falkhaan Isenstrider
A	accept	2158
S	
T	softcore	
T	sticky	
T	completewith	next
A	goto	1429/0,164.44,-9339.91,200
S	
A	goto	1429/0,88.08,-9464.89
A	vendor	
S	
A	goto	1429/0,74.02,-9465.52
A	turnin	54
A	target	Marshal Dughan
A	accept	62
S	
A	goto	1429/0,46.43,-9460.26,15,0
A	goto	1429/0,33.14,-9460.75
A	target	William Pestle
A	accept	60
S	
A	goto	1429/0,16.20,-9462.65
A	target	Innkeeper Farley
A	turnin	2158
A	home	
S	
A	xp	6
S	
A	goto	1429/0,18.66,-9476.47,12,0
A	goto	1429/0,36.02,-9471.84
A	trainer	
S	
A	goto	1429/0,74.20,-9497.30
A	target	Remy "Two Times"
A	accept	47
S	
T	sticky	
T	completewith	BoarMeat1
A	collect	769,4
S	
A	goto	1429/0,338.47,-9889.69
A	target	"Auntie" Bernice Stonefield
A	accept	85
A	goto	Elwynn Forest,34.660,84.482
A	target	Ma Stonefield
A	accept	88
S	
T	sticky	
T	completewith	Candles
A	complete	60,1
S	
T	sticky	
T	label	Candles
T	completewith	next
A	complete	47,1
S	
T	label	Dust
A	goto	1429/0,38.38,-9923.69
A	turnin	85
A	target	Billy Maclure
A	accept	86
S	
T	label	BoarMeat1
A	goto	1429/0,36.02,-10013.45
A	target	Maybell Maclure
A	accept	106
S	
A	goto	1429/0,63.78,-10008.82
A	vendor	
S	
T	sticky	
T	completewith	next
A	collect	769,4
S	
A	goto	Elwynn Forest,29.840,85.997
A	turnin	106
A	target	Tommy Joe Stonefield
A	accept	111
S	
A	goto	1429/0,407.40,-9918.55
A	complete	86,1
S	
A	goto	1429/0,338.47,-9889.69
A	turnin	86
A	target	"Auntie" Bernice Stonefield
A	accept	84
S	
A	goto	1429,34.945,83.855
A	turnin	111
A	target	Gramma Stonefield
A	accept	107
S	
T	sticky	
T	label	KoboldCandles
A	complete	60,1
S	
T	sticky	
T	label	GoldDust
A	complete	47,1
S	
A	goto	1429/0,38.38,-9923.69
A	turnin	84
A	target	Billy Maclure
A	accept	87
S	
A	goto	1429/0,129.73,-9844.49
A	complete	62,1
S	
A	goto	1429/0,88.08,-9744.96
A	complete	87,1
S	
A	xp	7+1600
S	
T	hidewindow	
T	requires	KoboldCandles
S	
T	label	Goldtooth
T	requires	GoldDust
A	goto	1429/0,338.47,-9889.69
A	target	"Auntie" Bernice Stonefield
A	turnin	87
S	
A	xp	7+2690
A	goto	1429/0,74.20,-9497.30
S	
A	goto	1429/0,74.20,-9497.30
A	turnin	47
A	target	Remy "Two Times"
A	accept	40
S	
A	goto	1429/0,88.08,-9464.89
A	vendor	
S	
A	goto	1429/0,74.02,-9465.52
A	turnin	40
A	target	Marshal Dughan
A	accept	35
A	turnin	62
A	accept	76
S	
A	goto	1429/0,88.08,-9464.89
A	vendor	
S	
A	goto	1429/0,33.14,-9460.75
A	turnin	60
A	target	William Pestle
A	accept	61
A	turnin	107
A	accept	112
S	
A	xp	8
S	
A	money	<0.1250
A	goto	1429/0,8.25,-9464.89
A	vendor	
S	
A	goto	1429/0,18.66,-9476.47,12,0
A	goto	1429/0,36.02,-9471.84
A	trainer	
S	
A	goto	1429/0,16.20,-9462.65
A	vendor	
S	
A	goto	1429/0,-116.70,-9404.71,60,0
A	goto	1429/0,-248.59,-9434.80,50,0
A	goto	1429/0,-463.78,-9393.14,50,0
A	goto	1429/0,-422.13,-9481.10,50,0
A	goto	1429/0,-331.89,-9485.73,50,0
A	complete	112,1
S	
A	goto	1429/0,-609.56,-9189.46,60,0
A	goto	1429/0,-560.97,-9101.50
A	complete	76,1
S	
A	goto	1429/0,-1032.06,-9610.23
A	turnin	35
A	target	Guard Thomas
A	accept	37
A	accept	52
S	
T	sticky	
T	completewith	Prowlers
A	complete	52,1
S	
T	sticky	
T	completewith	Bears
A	complete	52,2
S	
A	goto	1429/0,-987.88,-9335.28
A	turnin	37
A	accept	45
S	
A	goto	1429/0,-1289.22,-9469.80
A	target	Supervisor Raelen
A	accept	5545
S	
A	goto	1429/0,-1355.79,-9469.52
A	vendor	
S	
T	sticky	
T	completewith	Bundles
A	collect	13872,8
S	
T	label	Bundles
A	goto	1429/0,-1234.31,-9224.18,60
S	
A	goto	1429/0,-1234.31,-9224.18
A	turnin	45
A	accept	71
S	
A	goto	1429/0,-1130.18,-9383.88,40,0
A	goto	1429/0,-1369.67,-9314.45,40,0
A	goto	1429/0,-1130.18,-9383.88,40,0
A	goto	1429/0,-1369.67,-9314.45,40,0
A	goto	1429/0,-1130.18,-9383.88,40,0
A	goto	1429/0,-1369.67,-9314.45,40,0
A	collect	13872,8
S	
T	label	Bundles2
A	goto	1429/0,-1289.22,-9469.80
A	target	Supervisor Raelen
A	turnin	5545
S	
T	label	Prowlers
A	xp	9
S	
T	label	Bears
A	goto	1429/0,-1222.40,-9531.76
A	target	Sara Timberlain
A	accept	83
S	
A	goto	1429/0,-1126.71,-9689.41,40,0
A	goto	1429/0,-1230.84,-9876.89,40,0
A	goto	1429/0,-1310.67,-9717.18,40,0
A	goto	1429/0,-1126.71,-9689.41,40,0
A	goto	1429/0,-1230.84,-9876.89,40,0
A	goto	1429/0,-1310.67,-9717.18,40,0
A	complete	52,1
A	complete	52,2
S	
A	goto	1429/0,-1032.06,-9610.23
A	turnin	52
A	turnin	71
A	target	Guard Thomas
A	accept	39
A	target	Deputy Rainer
A	target	Marshal Haggard
A	target	Marshal Dughan
A	target	Farmer Furlbrow
A	target	Farmer Saldean
A	accept	109
S	
T	sticky	
T	completewith	Princess
A	collect	1972,1,184
A	accept	184
S	
A	goto	1429/0,-911.52,-9735.70,60,0
A	goto	1429/0,-828.22,-9733.39,60,0
A	goto	1429/0,-831.69,-9823.65,60,0
A	goto	1429/0,-921.93,-9812.08,60,0
A	goto	1429/0,-911.52,-9735.70,60,0
A	goto	1429/0,-828.22,-9733.39,60,0
A	goto	1429/0,-831.69,-9823.65,60,0
A	goto	1429/0,-921.93,-9812.08,60,0
A	goto	1429/0,-911.52,-9735.70,60,0
A	goto	1429/0,-828.22,-9733.39,60,0
A	goto	1429/0,-831.69,-9823.65,60,0
A	goto	1429/0,-921.93,-9812.08,60,0
A	complete	83,1
A	isOnQuest	83
S	
T	label	Princess
A	goto	1429/0,-873.34,-9772.73
A	complete	88,1
S	
T	softcore	
T	sticky	
T	completewith	next
A	goto	1429/0,-1366.20,-9552.85,120
S	
A	goto	1429/0,-1223.90,-9534.33
A	target	Sara Timberlain
A	turnin	83
A	isQuestComplete	83
S	
A	goto	1433/0,-1741.68,-9644.29
A	zone	Redridge Mountains
S	
T	softcore	
T	sticky	
T	completewith	next
A	goto	1433/0,-1813.97,-9710.17
S	
T	softcore	
A	goto	1433/0,-2022.37,-9394.52,100
S	
T	softcore	
A	goto	1433/0,-2235.11,-9435.06
A	fp	Redridge Mountains
S	
T	hardcore	
A	goto	1433/0,-2235.11,-9435.06
A	fp	Redridge Mountains
S	
A	hs	
S	
A	goto	1429/0,33.14,-9460.75
A	target	William Pestle
A	turnin	112
S	
A	goto	1429/0,70.72,-9462.58
A	turnin	39
A	turnin	76
A	target	Marshal Dughan
A	accept	239
S	
A	goto	1429/0,87.87,-9456.65
A	target	Smith Argus
A	target	Verner Osgood
A	accept	1097
S	
A	goto	1429/0,88.08,-9464.89
A	vendor	
S	
A	goto	1429/0,33.14,-9460.75
A	target	William Pestle
A	accept	114
S	
A	goto	1429/0,36.02,-10013.45
A	target	Maybell Maclure
A	turnin	114
S	
A	goto	Elwynn Forest,34.660,84.482
A	target	Ma Stonefield
A	turnin	88
S	
A	goto	1429/0,695.47,-9663.95
A	target	Deputy Rainer
A	turnin	239
S	
A	isOnQuest	184
A	goto	1436/0,916.67,-9852.67
A	target	Farmer Furlbrow
A	turnin	184
S	
A	goto	1436/0,919.54,-9853.04
A	target	Verna Furlbrow
A	accept	36
S	
A	goto	1436/0,1042.11,-10112.11
A	target	Salma Saldean
A	turnin	36
S	
T	softcore	
T	sticky	
T	completewith	next
A	goto	1436/0,1207.17,-10552.67,150
S	
A	goto	1436/0,1045.22,-10508.800
A	target	Gryan Stoutmantle
A	turnin	109
S	
A	goto	1436/0,1021.60,-10500.61
A	vendor	
A	target	Quartermaster Lewis
A	accept	6181
S	
T	phase	3-6
A	goto	1436/0,1042.11,-10112.11
A	xp	11+3750
S	
A	goto	1436/0,1035.67,-10627.33
A	fp	Sentinel Hill
A	turnin	6181
A	target	Thor
A	accept	6281
A	fly	Stormwind
S	
A	goto	1453/0,625.49,-8857.89
A	target	Morgan Pestle
A	turnin	61
S	
T	era/som	
A	goto	1453/0,613.39,-8796.05
A	trainer	
S	
A	goto	1453/0,382.18,-8701.93
A	target	Osric Strang
A	turnin	6281
S	
T	completewith	next
A	goto	1453/0,684.64,-8387.31
A	target	Grimand Elmore
A	turnin	1097
S	
A	goto	1453/0,684.64,-8387.31
A	target	Grimand Elmore
A	accept	353
S	
T	sticky	
T	completewith	next
A	goto	1453/0,521.98,-8353.25,20
S	
A	target	Monty
A	accept	6661
S	
A	complete	6661,1
S	
A	target	Monty
A	turnin	6661
S	
A	goto	1455/0,-1322.37,-4838.32,30
S	
A	goto	1455/0,-1152.40,-4821.13
A	fp	Ironforge
S	
T	phase	3-6
A	goto	1455/0,-928.40,-4614.46
A	trainer	
S	
T	sticky	
T	completewith	next
A	goto	1426/0,-832.79,-5022.97,100
S	
A	goto	1426/0,-1157.84,-5604.12,50,0
A	goto	1426/0,-1305.59,-5512.18
A	target	Rudra Amberstill
A	accept	314
S	
T	sticky	
T	completewith	next
A	goto	1426/0,-1266.19,-5528.60,14,0
A	goto	1426/0,-1261.27,-5499.05,12
S	
A	goto	1426/0,-1280.97,-5390.70
A	goto	1426/0,-1289.83,-5669.780,0
A	complete	314,1
S	
A	goto	1426/0,-1305.59,-5512.18
A	target	Rudra Amberstill
A	turnin	314
S	
A	goto	1426/0,-1576.47,-5673.07
A	vendor	
S	
A	goto	1426/0,-1581.39,-5715.75
A	target	Senator Mehr Stonehallow
A	accept	433
S	
A	goto	1426/0,-1600.30,-5726.590
A	target	Foreman Stonebrow
A	accept	432
S	
A	goto	1426/0,-1674.97,-5735.45,30,0
A	goto	1426/0,-1684.82,-5627.10,30,0
A	goto	1426/0,-1738.99,-5541.73,30,0
A	goto	1426/0,-1788.24,-5620.53,30,0
A	goto	1426/0,-1674.97,-5735.45,30,0
A	goto	1426/0,-1684.82,-5627.10,30,0
A	goto	1426/0,-1738.99,-5541.73,30,0
A	goto	1426/0,-1788.24,-5620.53,30,0
A	complete	432,1
A	complete	433,1
S	
T	era/som	
A	xp	10+6350
S	
A	goto	1426/0,-1600.30,-5726.590
A	target	Foreman Stonebrow
A	turnin	432
S	
T	completewith	next
A	goto	1426/0,-1591.24,-5712.47
A	vendor	
S	
A	goto	1426/0,-1581.39,-5715.75
A	target	Senator Mehr Stonehallow
A	turnin	433
S	
T	era/som--xpgate	
A	xp	11
S	
A	goto	1426/0,-1576.47,-5673.07
A	vendor	
A	trainer	
S	
A	goto	1426/0,-2329.60,-5163.76
A	target	Pilot Hammerfoot
A	accept	419
S	
A	goto	1426/0,-2123.14,-5065.65
A	turnin	419
A	accept	417
S	
A	goto	1426/0,-2137.92,-5072.22
A	complete	417,1
S	
A	goto	1426/0,-2329.60,-5163.76
A	target	Pilot Hammerfoot
A	turnin	417
S	
A	goto	1426/0,-2354.62,-4898.20,25
E
G	Guides/forever/Alliance-Mage-1-12.lua
M	classic	
M	tbc	
M	selector	Gnome Mage
M	name	1-10 Dun Morogh Mage AoE
M	version	1
M	group	RestedXP Forever Guide (A)
M	subgroup	Speedrun Guide Mage
M	defaultfor	Dwarf/Gnome
M	next	10-12 Loch Modan Mage AoE
S	
T	era/som	
T	sticky	
T	completewith	next
A	goto	1426/0,328.18,-6214.85
S	
T	phase	3-6
T	sticky	
T	completewith	next
A	goto	1426/0,328.18,-6214.85
S	
A	goto	1426/0,328.18,-6214.85
A	target	Sten Stoutarm
A	accept	179
S	
A	goto	1426/0,388.61,-6333.02
A	complete	179,1
S	
A	xp	2
S	
A	goto	1426/0,324.58,-6224.67
A	collect	159,15
S	
A	goto	1426/0,328.18,-6214.85
A	turnin	179
A	target	Sten Stoutarm
A	accept	233
A	accept	3114
S	
A	goto	1426/0,339.36,-6214.82
A	target	Balir Frosthammer
A	accept	170
S	
T	sticky	
T	completewith	Rockjaw
A	complete	170,1
S	
A	goto	1426/0,477.26,-6264.07,30,0
A	goto	1426/0,565.91,-6244.37,30,0
A	goto	1426/0,477.26,-6264.07,30,0
A	goto	1426/0,565.91,-6244.37,30,0
A	complete	170,2
S	
A	goto	1426/0,688.98,-6222.47
A	turnin	233
A	target	Talin Keeneye
A	accept	183
A	accept	234
S	
A	goto	1426/0,708.73,-6257.50,40,0
A	goto	1426/0,792.46,-6221.38,40,0
A	goto	1426/0,762.91,-6142.58,40,0
A	goto	1426/0,679.18,-6162.28,40,0
A	goto	1426/0,708.73,-6257.50,40,0
A	goto	1426/0,792.46,-6221.38,40,0
A	goto	1426/0,762.91,-6142.58,40,0
A	goto	1426/0,679.18,-6162.28,40,0
A	complete	183,1
S	
A	goto	1426/0,688.98,-6222.47
A	target	Talin Keeneye
A	turnin	183
S	
A	xp	3+860
A	goto	1426/0,669.33,-6339.58,40,0
A	goto	1426/0,610.23,-6257.50,40,0
A	goto	1426/0,437.86,-6382.27,40,0
A	goto	1426/0,669.33,-6339.58,40,0
A	goto	1426/0,610.23,-6257.50,40,0
A	goto	1426/0,437.86,-6382.27,40,0
S	
T	label	Rockjaw
A	goto	1426/0,567.09,-6362.99
A	turnin	234
A	target	Grelin Whitebeard
A	accept	182
S	
A	goto	1426/0,570.83,-6372.42
A	target	Nori Pridedrift
A	accept	3364
S	
A	goto	1426/0,388.61,-6421.67
A	complete	170,1
S	
T	sticky	
T	completewith	Scalding1
A	goto	1426/0,570.83,-6372.42,0
A	target	Nori Pridedrift
A	accept	3364
A	goto	1426/0,383.68,-6057.22
A	target	Durnan Furcutter
A	turnin	3364
S	
T	label	Scalding1
A	goto	1426/0,383.68,-6057.22
A	turnin	3364
A	target	Durnan Furcutter
A	accept	3365
A	vendor	
S	
A	goto	1426/0,388.17,-6056.10
A	target	Marryk Nurribit
A	turnin	3114
A	trainer	
S	
A	goto	1426/0,339.36,-6214.82
A	target	Balir Frosthammer
A	turnin	170
S	
A	goto	1426/0,324.58,-6224.67
A	vendor	
A	collect	159,10
S	
A	goto	1426/0,506.81,-6477.48,30,0
A	goto	1426/0,684.11,-6480.77,30,0
A	goto	1426/0,772.76,-6362.57,30,0
A	goto	1426/0,684.11,-6480.77,30,0
A	goto	1426/0,772.76,-6362.57,30,0
A	goto	1426/0,684.11,-6480.77,30,0
A	goto	1426/0,772.76,-6362.57,30,0
A	complete	182,1
S	
T	sticky	
T	label	Mug
A	goto	1426/0,570.83,-6372.42
A	target	Nori Pridedrift
A	turnin	3365
S	
A	goto	1426/0,567.09,-6362.99
A	turnin	182
A	target	Grelin Whitebeard
A	accept	218
S	
T	requires	Mug
A	goto	1426/0,482.18,-6500.47,30,0
A	goto	1426/0,373.83,-6470.92,15,0
A	goto	1426/0,295.03,-6513.60
A	complete	218,1
S	
A	goto	1426/0,565.91,-6365.85
A	turnin	218
A	target	Grelin Whitebeard
A	accept	282
S	
A	goto	1426/0,153.00,-6235.86
A	turnin	282
A	target	Mountaineer Thalos
A	accept	420
S	
A	goto	1426/0,132.51,-6247.65
A	target	Hands Springsprocket
A	accept	2160
S	
A	goto	1426/0,122.66,-6227.95,20,0
A	goto	1426/0,43.86,-6044.08,20
S	
T	sticky	
T	completewith	BoarMeat44
A	complete	317,1
S	
T	sticky	
T	completewith	Ribs
A	collect	2886,6
S	
A	goto	1426/0,9.38,-5942.30,45,0
A	goto	1426/0,-54.64,-5863.50,45,0
A	goto	1426/0,-359.99,-5705.90
A	xp	5+2415
S	
T	softcore	
A	goto	1426/0,-512.67,-5686.2,120
S	
A	goto	1426/0,-499.17,-5644.37
A	target	Senir Whitebeard
A	turnin	420
S	
T	completewith	next
A	goto	1426/0,-497.89,-5633.67
A	vendor	
S	
A	goto	1426/0,-502.82,-5597.55
A	target	Ragnar Thunderbrew
A	accept	384
S	
A	goto	1426/0,-576.69,-5748.58
A	xp	6
S	
A	goto	1426/0,-523.35,-5590.82
A	target	Tannok Frosthammer
A	turnin	2160
S	
A	goto	1426/0,-537.29,-5587.70
A	trainer	
S	
A	goto	1426/0,-532.37,-5600.83
A	home	
A	vendor	
S	
A	goto	1426/0,-464.45,-5573.78
A	target	Tharek Blackstone
A	accept	400
S	
A	goto	1426/0,-632.15,-5466.540
A	target	Pilot Bellowfiz
A	accept	317
S	
A	goto	1426/0,-641.80,-5473.18
A	target	Pilot Stonegear
A	accept	313
S	
A	goto	1426/0,-680.12,-5489.20
A	target	Beldin Steelgrill
A	turnin	400
S	
T	label	BoarMeat44
A	goto	1426/0,-664.55,-5499.710
A	target	Loslor Rudge
A	accept	5541
S	
A	goto	1426/0,-758.92,-5522.03,40,0
A	goto	1426/0,-734.29,-5646.80,40,0
A	goto	1426/0,-665.34,-5646.80,40,0
A	goto	1426/0,-655.49,-5548.30,40,0
A	goto	1426/0,-561.92,-5502.33,40,0
A	goto	1426/0,-571.77,-5416.97,40,0
A	goto	1426/0,-340.29,-5600.83,40,0
A	goto	1426/0,-758.92,-5522.03,40,0
A	goto	1426/0,-734.29,-5646.80,40,0
A	goto	1426/0,-665.34,-5646.80,40,0
A	goto	1426/0,-655.49,-5548.30,40,0
A	goto	1426/0,-561.92,-5502.33,40,0
A	goto	1426/0,-571.77,-5416.97,40,0
A	goto	1426/0,-340.29,-5600.83,40,0
A	goto	1426/0,-758.92,-5522.03,40,0
A	goto	1426/0,-734.29,-5646.80,40,0
A	goto	1426/0,-665.34,-5646.80,40,0
A	goto	1426/0,-655.49,-5548.30,40,0
A	goto	1426/0,-561.92,-5502.33,40,0
A	goto	1426/0,-571.77,-5416.97,40,0
A	goto	1426/0,-340.29,-5600.83,40,0
A	goto	1426/0,-758.92,-5522.03,40,0
A	goto	1426/0,-734.29,-5646.80,40,0
A	goto	1426/0,-665.34,-5646.80,40,0
A	goto	1426/0,-655.49,-5548.30,40,0
A	goto	1426/0,-561.92,-5502.33,40,0
A	goto	1426/0,-571.77,-5416.97,40,0
A	goto	1426/0,-340.29,-5600.83,40,0
A	complete	317,1
A	complete	317,2
S	
A	goto	1426/0,-632.15,-5466.540
A	turnin	317
A	target	Pilot Bellowfiz
A	accept	318
S	
A	goto	1426/0,-507.74,-5587.70,20,0
A	goto	1426/0,-532.37,-5600.83
A	vendor	
S	
A	goto	1426/0,-291.04,-5676.35,40,0
A	goto	1426/0,-286.12,-5590.98,40,0
A	goto	1426/0,-217.17,-5499.05,40,0
A	goto	1426/0,-291.04,-5676.35,40,0
A	goto	1426/0,-286.12,-5590.98,40,0
A	goto	1426/0,-217.17,-5499.05,40,0
A	goto	1426/0,-291.04,-5676.35,40,0
A	goto	1426/0,-286.12,-5590.98,40,0
A	goto	1426/0,-217.17,-5499.05,40,0
A	goto	1426/0,-291.04,-5676.35,40,0
A	goto	1426/0,-286.12,-5590.98,40,0
A	goto	1426/0,-217.17,-5499.05,40,0
A	complete	313,1
S	
A	goto	1426/0,-369.84,-5745.30
A	complete	5541,1
S	
T	label	BearFur
A	goto	1426/0,-197.47,-5932.45,30,0
A	goto	1426/0,-201.51,-6015.520
A	target	Hegnar Rumbleshot
A	turnin	5541
A	vendor	
S	
A	xp	7
S	
A	goto	1426/0,68.48,-5728.88,50,0
A	goto	1426/0,29.08,-5584.42,50,0
A	goto	1426/0,98.03,-5574.57
A	target	Tundra MacGrann
A	accept	312
S	
A	goto	1426/0,299.96,-5387.42
A	vendor	
S	
T	sticky	
T	label	Evershine
A	goto	1426/0,314.73,-5380.85
A	turnin	318
A	target	Rejold Barleybrew
A	accept	319
A	accept	315
S	
A	goto	1426/0,315.42,-5372.02
A	target	Marleth Barleybrew
A	accept	310
S	
T	label	Ribs
T	requires	Evershine
A	goto	1426/0,250.71,-5154.30,60,0
A	goto	1426/0,408.31,-5187.13,60,0
A	goto	1426/0,388.61,-5311.90,60,0
A	goto	1426/0,531.43,-5426.82,60,0
A	goto	1426/0,531.43,-5426.82,60,0
A	goto	1426/0,324.58,-5577.85,60,0
A	goto	1426/0,250.71,-5154.30,60,0
A	goto	1426/0,408.31,-5187.13,60,0
A	goto	1426/0,388.61,-5311.90,60,0
A	goto	1426/0,531.43,-5426.82,60,0
A	goto	1426/0,531.43,-5426.82,60,0
A	goto	1426/0,324.58,-5577.85,60,0
A	complete	319,1
A	complete	319,2
A	complete	319,3
S	
A	complete	384,1
S	
A	goto	1426/0,315.28,-5378.39
A	turnin	319
A	target	Rejold Barleybrew
A	accept	320
S	
A	isQuestTurnedIn	384
A	xp	7+4360
S	
A	xp	7+3735
S	
A	hs	
S	
A	goto	1426/0,-532.37,-5600.83
A	complete	384,2
A	collect	2686,1
S	
A	goto	1426/0,-542.22,-5597.55,10,0
A	goto	1426/0,-547.63,-5607.07
A	turnin	310
A	accept	311
S	
A	goto	1426/0,-502.82,-5597.55
A	target	Ragnar Thunderbrew
A	turnin	384
S	
A	xp	8
S	
A	goto	1426/0,-537.29,-5587.70
A	trainer	
S	
A	goto	1426/0,-532.37,-5600.83
A	vendor	
S	
A	goto	1426/0,-499.17,-5644.37
A	target	Senir Whitebeard
A	accept	287
S	
A	goto	1426/0,-641.80,-5473.18
A	target	Pilot Stonegear
A	turnin	313
S	
A	goto	1426/0,-632.15,-5466.540
A	target	Pilot Bellowfiz
A	turnin	320
S	
T	era/som	
A	goto	1426/0,-453.57,-5499.05
A	target	Razzle Sprysprocket
A	accept	412
S	
A	goto	1426/0,-320.59,-5354.58,25,0
A	goto	1426/0,-271.34,-5367.72,25
S	
A	goto	1426/0,-212.24,-5364.43,30,0
A	goto	1426/0,-241.79,-5308.62,30,0
A	goto	1426/0,-153.14,-5190.42,30,0
A	goto	1426/0,-271.34,-5003.27,30,0
A	complete	315,1
S	
A	goto	1426/0,-94.04,-5646.80
A	complete	312,1
S	
A	goto	1426/0,98.03,-5574.57
A	target	Tundra MacGrann
A	turnin	312
S	
A	goto	1426/0,304.88,-5380.85
A	vendor	
S	
T	sticky	
T	label	Stout
A	goto	1426/0,315.28,-5378.39
A	turnin	315
A	target	Rejold Barleybrew
A	accept	413
S	
A	goto	1426/0,315.42,-5372.02
A	target	Marleth Barleybrew
A	turnin	311
S	
T	era/som	
T	requires	Stout
A	goto	1426/0,462.48,-5288.92,40,0
A	goto	1426/0,580.68,-5167.43,40,0
A	goto	1426/0,541.28,-5302.05,40,0
A	goto	1426/0,605.31,-5321.75,40,0
A	goto	1426/0,551.13,-5367.72,40,0
A	complete	412,2
A	complete	412,1
S	
A	xp	9
S	
A	goto	1426/0,595.46,-5545.02,35
S	
A	goto	1426/0,713.66,-5528.60,40,0
A	goto	1426/0,753.06,-5613.97,40,0
A	complete	287,1
S	
T	hardcore	
A	goto	1426/0,669.33,-5590.98
A	complete	287,2
S	
T	softcore	
A	goto	1426/0,649.63,-5568.00,15
S	
T	softcore	
A	goto	1426/0,669.33,-5590.98
A	complete	287,2
S	
T	softcore	
A	deathskip	
S	
T	hardcore	
A	goto	1426/0,-499.17,-5644.37,150
S	
A	goto	1426/0,-499.17,-5644.37
A	turnin	287
A	target	Senir Whitebeard
A	accept	291
S	
T	era/som	
A	goto	1426/0,-453.57,-5499.05
A	target	Razzle Sprysprocket
A	turnin	412
S	
A	goto	1426/0,-1157.84,-5604.12,50,0
A	goto	1426/0,-1305.59,-5512.18
A	target	Rudra Amberstill
A	accept	314
S	
T	sticky	
T	completewith	next
A	goto	1426/0,-1266.19,-5528.60,14,0
A	goto	1426/0,-1261.27,-5499.05,10
S	
A	goto	1426/0,-1280.97,-5390.70
A	complete	314,1
S	
A	goto	1426/0,-1305.59,-5512.18
A	target	Rudra Amberstill
A	turnin	314
S	
A	goto	1426/0,-1576.47,-5673.07
A	vendor	
S	
A	goto	1426/0,-1581.39,-5715.75
A	target	Senator Mehr Stonehallow
A	accept	433
S	
T	completewith	next
A	goto	1426/0,-1591.24,-5712.47
A	vendor	
S	
A	goto	1426/0,-1600.30,-5726.590
A	target	Foreman Stonebrow
A	accept	432
S	
A	goto	1426/0,-1674.97,-5735.45,30,0
A	goto	1426/0,-1684.82,-5627.10,30,0
A	goto	1426/0,-1738.99,-5541.73,30,0
A	goto	1426/0,-1788.24,-5620.53,30,0
A	goto	1426/0,-1674.97,-5735.45,30,0
A	goto	1426/0,-1684.82,-5627.10,30,0
A	goto	1426/0,-1738.99,-5541.73,30,0
A	goto	1426/0,-1788.24,-5620.53,30,0
A	complete	432,1
A	complete	433,1
S	
A	goto	1426/0,-1600.30,-5726.590
A	target	Foreman Stonebrow
A	turnin	432
S	
T	completewith	next
A	goto	1426/0,-1591.24,-5712.47
A	vendor	
S	
A	goto	1426/0,-1581.39,-5715.75
A	target	Senator Mehr Stonehallow
A	turnin	433
S	
A	goto	1426/0,-1502.59,-5837.23,40,0
A	goto	1426/0,-1679.89,-5787.98,40,0
A	goto	1426/0,-1694.67,-5646.8,40,0
A	xp	10
S	
A	goto	1426/0,-1576.47,-5673.07
A	vendor	
A	trainer	
S	
A	goto	1426/0,-2325.07,-5164.15
A	target	Pilot Hammerfoot
A	accept	419
S	
A	goto	1426/0,-2123.14,-5065.65
A	turnin	419
A	accept	417
S	
A	goto	1426/0,-2137.92,-5072.22
A	complete	417,1
S	
A	goto	1426/0,-2329.60,-5163.76
A	target	Pilot Hammerfoot
A	turnin	417
S	
A	goto	1426/0,-2118.22,-5541.73,50,0
A	goto	1426/0,-2251.19,-5633.67,25,0
A	goto	1426/0,-2447.11,-5479.74
A	turnin	413
A	target	Mountaineer Barleybrew
A	accept	414
E
G	Guides/forever/Alliance-Mage-1-12.lua
M	classic	
M	tbc	
M	selector	Alliance Mage
M	name	10-12 Loch Modan Mage AoE
M	version	1
M	group	RestedXP Forever Guide (A)
M	subgroup	Speedrun Guide Mage
M	defaultfor	Human Mage/Gnome Mage
M	next	12-18 Darkshore Mage AoE
S	
T	era/som	
T	completewith	next
S	Gnome
A	goto	1432/0,-2602.54,-5832.73
A	target	Mountaineer Cobbleflint
A	accept	224
S	Gnome
A	goto	1432/0,-2634.59,-5842.81
A	target	Captain Rugelfuss
A	accept	267
S	Gnome
A	goto	1432/0,-2818.49,-5742.10,45
S	Gnome
A	goto	1432/0,-2821.25,-5819.36,50,0
A	goto	1432/0,-2950.89,-5804.64,50,0
A	goto	1432/0,-2846.07,-5979.40,50,0
A	goto	1432/0,-2821.25,-5819.36,50,0
A	goto	1432/0,-2950.89,-5804.64,50,0
A	goto	1432/0,-2846.07,-5979.40,50,0
A	complete	224,1
A	complete	224,2
A	complete	267,1
S	Gnome
A	goto	1432/0,-2602.54,-5832.73
A	target	Mountaineer Cobbleflint
A	turnin	224
S	Gnome
A	goto	1432/0,-2634.59,-5842.81
A	target	Captain Rugelfuss
A	turnin	267
S	Human
A	goto	1432/0,-2658.51,-4822.30
A	vendor	
S	Human
A	goto	1432/0,-2676.82,-4825.93
A	turnin	353
A	target	Mountaineer Stormpike
A	accept	307
S	Human
T	sticky	
T	completewith	next
A	collect	3174,3
A	collect	3173,3
A	collect	3172,3
S	Human
A	goto	1432/0,-2961.92,-5366.82,130
S	
A	goto	1432/0,-2954.42,-5394.10
A	target	Vidra Hearthstove
A	accept	418
S	Human
T	sticky	
A	abandon	1338
S	
A	goto	1432/0,-2953.65,-5381.54
A	vendor	
S	
A	goto	1432/0,-2972.96,-5377.86
A	vendor	
S	
A	goto	1432/0,-2892.97,-5405.45,80.0,0
A	goto	1432/0,-3019.85,-5335.55,80.0,0
A	goto	1432/0,-3006.06,-5252.77
A	target	Mountaineer Kadrell
A	accept	416
A	accept	1339
S	
T	sticky	
T	completewith	Thelsamar1
A	collect	3174,3,418,1
S	
T	sticky	
T	completewith	Thelsamar1
A	collect	3173,3,418,1
S	
T	sticky	
T	completewith	Thelsamar1
A	collect	3172,3,418,1
S	Gnome
A	goto	1432/0,-2658.51,-4822.30
A	vendor	
S	Gnome
A	goto	1432/0,-2676.82,-4825.93
A	turnin	1339
A	target	Mountaineer Stormpike
A	accept	1338
A	accept	307
S	Gnome
T	label	Thelsamar1
A	goto	1432/0,-2923.58,-4803.910,130
S	Human
T	label	Thelsamar1
A	goto	1432/0,-3077.77,-4984.19,130
S	
T	sticky	
T	completewith	Gear
A	complete	416,1
S	
A	goto	1432/0,-2972.96,-4822.30,45
S	
T	label	Gear
A	goto	1432/0,-2972.96,-4853.58,12,0
A	goto	1432/0,-2997.78,-4868.29,12,0
A	goto	1432/0,-2967.44,-4892.21,12,0
A	goto	1432/0,-2983.99,-4894.05,12,0
A	goto	1432/0,-2995.02,-4941.88,12,0
A	goto	1432/0,-2978.47,-4934.52,12,0
A	goto	1432/0,-2956.41,-4945.56,12,0
A	goto	1432/0,-2978.47,-4934.52,12,0
A	goto	1432/0,-2995.02,-4941.88,12,0
A	goto	1432/0,-2983.99,-4894.05,12,0
A	goto	1432/0,-2967.44,-4892.21,12,0
A	goto	1432/0,-2997.78,-4868.29,12,0
A	goto	1432/0,-2972.96,-4853.58,12,0
A	complete	307,1
S	
A	goto	1432/0,-3081.36,-4902.88
A	complete	416,1
S	
T	sticky	
T	completewith	Thelsamar2
A	collect	3174,3,418,1
S	
T	sticky	
T	completewith	Thelsamar2
A	collect	3173,3,418,1
S	
T	sticky	
T	completewith	Thelsamar2
A	collect	3172,3,418,1
S	
T	label	Thelsamar2
A	goto	1432/0,-2636.44,-4816.79,60
S	
A	goto	1432/0,-2658.51,-4822.30
A	vendor	
S	
A	goto	1432/0,-2675.06,-4824.14
A	turnin	307
A	turnin	1339
A	target	Mountaineer Stormpike
A	accept	1338
S	
T	sticky	
T	label	Meat9
A	goto	1432/0,-2735.74,-4684.34,40,0
A	goto	1432/0,-2846.07,-4682.50,40,0
A	goto	1432/0,-2782.63,-4770.80,40,0
A	goto	1432/0,-2835.04,-4976.83,40,0
A	goto	1432/0,-2915.03,-5044.89,40,0
A	goto	1432/0,-3080.53,-5100.08,40,0
A	goto	1432/0,-2735.74,-4684.34,40,0
A	goto	1432/0,-2846.07,-4682.50,40,0
A	goto	1432/0,-2782.63,-4770.80,40,0
A	goto	1432/0,-2835.04,-4976.83,40,0
A	goto	1432/0,-2915.03,-5044.89,40,0
A	goto	1432/0,-3080.53,-5100.08,40,0
A	goto	1432/0,-2735.74,-4684.34
A	collect	3173,3,418,1
S	
T	sticky	
T	label	Ichor9
A	goto	1432/0,-2873.66,-4789.19,40,0
A	goto	1432/0,-2766.08,-4866.45,40,0
A	goto	1432/0,-2926.07,-5232.53,40,0
A	goto	1432/0,-2992.27,-5055.93,40,0
A	goto	1432/0,-3069.5,-5078.01,40,0
A	goto	1432/0,-2873.66,-4789.19,40,0
A	goto	1432/0,-2766.08,-4866.45,40,0
A	goto	1432/0,-2926.07,-5232.53,40,0
A	goto	1432/0,-2992.27,-5055.93,40,0
A	goto	1432/0,-3069.5,-5078.01,40,0
A	goto	1432/0,-2873.66,-4789.19
A	collect	3174,3,418,1
S	
A	goto	1432/0,-3041.92,-5129.51,40,0
A	goto	1432/0,-3017.09,-5219.65,40,0
A	goto	1432/0,-2815.73,-5147.91,40,0
A	goto	1432/0,-2757.81,-4952.91,40,0
A	goto	1432/0,-2782.63,-4903.25,40,0
A	goto	1432/0,-3041.92,-5129.51,40,0
A	goto	1432/0,-3017.09,-5219.65,40,0
A	goto	1432/0,-2815.73,-5147.91,40,0
A	goto	1432/0,-2757.81,-4952.91,40,0
A	goto	1432/0,-2782.63,-4903.25,40,0
A	goto	1432/0,-3041.92,-5129.51
A	collect	3172,3,418,1
S	
T	hidewindow	
T	requires	Meat9
S	
T	sticky	
T	label	RatCatching
T	requires	Ichor9
A	goto	1432/0,-2892.97,-5405.45,80.0,0
A	goto	1432/0,-3019.85,-5335.55,80.0,0
A	goto	1432/0,-3006.06,-5252.77
A	target	Mountaineer Kadrell
A	turnin	416
S	
T	requires	Ichor9
A	goto	1432/0,-2954.42,-5394.10
A	target	Vidra Hearthstove
A	turnin	418
S	
T	era/som	
A	goto	1432/0,-2952.55,-5381.91
A	vendor	
A	collect	4470,2
A	collect	4471,1
S	
A	xp	12
S	Gnome
T	completewith	next
T	requires	RatCatching
A	goto	1432/0,-3781.70,-5702.36
A	vendor	
S	Gnome
T	requires	RatCatching
A	goto	1432/0,-3812.59,-5694.63
A	target	Prospector Ironband
A	accept	298
S	Gnome
T	softcore	
A	goto	1432/0,-3872.73,-5646.07
A	deathskip	
S	Gnome
T	hardcore	
A	goto	1432/0,-3018.75,-5350.08,20,0
A	goto	1432/0,-3014.88,-5367.00
A	target	Brock Stoneseeker
A	accept	6387
A	turnin	298
A	target	Jern Hornhelm
A	accept	301
S	Gnome
T	softcore	
A	goto	1432/0,-3018.75,-5350.08,20,0
A	goto	1432/0,-3014.88,-5367.00
A	target	Brock Stoneseeker
A	accept	6387
A	turnin	298
A	target	Jern Hornhelm
A	accept	301
S	
T	requires	RatCatching
A	goto	1432/0,-2929.93,-5424.95
A	fp	Thelsamar
A	turnin	6387
A	target	Thorgrum Borrelson
A	accept	6391
A	fly	Ironforge
S	Human
A	goto	1455/0,-928.25,-4614.46
A	trainer	
S	skip --logout skip << Human
T	completewith	next
A	link	https://www.youtube.com/watch?v=E8b90bzJMSI
S	Human
A	goto	1455/0,-810.36,-5039.71,120
S	Gnome
A	goto	1455/0,-1303.79,-4631.18
A	turnin	301
A	target	Prospector Stormpike
A	accept	302
S	Gnome
A	goto	1455/0,-1105.66,-4722.04,30,0
A	goto	1455/0,-1120.92,-4708.11
A	turnin	6391
A	target	Golnir Bouldertoe
A	accept	6388
S	Gnome
A	goto	1455/0,-1026.28,-4872.56
A	target	Senator Barin Redstone
A	turnin	291
S	Gnome
A	goto	1455/0,-1152.39,-4820.914
A	turnin	6388
A	target	Gryth Thurden
A	accept	6392
A	fly	Thelsamar
S	Gnome
A	goto	1432/0,-3018.75,-5350.08,20,0
A	goto	1432/0,-3014.88,-5367.00
A	target	Brock Stoneseeker
A	turnin	6392
A	target	Jern Hornhelm
A	turnin	302
S	Gnome
A	hs	
S	Gnome
A	goto	1426/0,-537.29,-5587.04
A	trainer	
S	
T	hardcore	
T	completewith	next
A	goto	1426/0,-1124.84,-5283.99,150
S	
T	hardcore	
A	goto	1426/0,-1128.29,-5282.35,40,0
A	goto	1426/0,-1172.62,-5325.03,40,0
A	goto	1426/0,-1207.09,-5325.03,40,0
A	goto	1426/0,-1212.02,-5265.93,40,0
A	goto	1426/0,-1192.32,-5219.97,40,0
A	goto	1426/0,-1103.67,-5174.0,40,0
A	goto	1426/0,-1167.69,-5144.45,40,0
A	goto	1426/0,-1236.64,-5147.73,40,0
A	goto	1426/0,-1433.64,-4586.28,40,0
A	goto	1426/0,-1438.57,-4287.50,40,0
A	goto	1426/0,-1428.72,-4231.68,40,0
A	goto	1426/0,-1473.04,-4205.42,40,0
A	goto	1426/0,-1492.74,-4156.17,40,0
A	goto	1437/0,-1241.48,-4000.12,50,0
A	goto	1437/0,-1121.55,-4013.90,40,0
A	goto	1437/0,-1084.33,-3947.75,40,0
A	goto	1437/0,-1014.03,-3911.92,40,0
A	goto	1437/0,-889.97,-3809.94,40,0
A	link	https://www.youtube.com/watch?v=9afQTimaiZQ
A	goto	1437/0,-889.97,-3809.94,80
S	
T	softcore	
A	goto	1426/0,309.81,-5108.33,50
S	
T	softcore	
A	goto	1426/0,280.26,-4963.87,15
S	
T	softcore	
A	goto	1426/0,206.38,-4832.53,15
S	
T	softcore	
A	goto	1426/0,176.83,-4770.15,15,0
A	goto	1426/0,176.83,-4704.48,15,0
A	goto	1437/0,-869.29,-3344.13,60,0
A	deathskip	
S	
T	softcore	
T	completewith	next
A	goto	1437/0,-914.78,-3435.09,60
S	
A	money	<0.08
A	goto	1437/0,-819.67,-3691.42,15,0
A	goto	1437/0,-807.26,-3716.22,15,0
A	goto	1437/0,-827.94,-3724.49,15,0
A	goto	1437,10.760,56.721
A	vendor	
S	
A	money	<0.04
A	goto	1437/0,-724.55,-3699.69
A	vendor	
S	
A	goto	1437/0,-782.45,-3793.40
A	fp	Menethil Harbor
S	
T	era/som	
T	sticky	
T	completewith	Darkshore1
A	goto	1437/0,-583.95,-3727.25
S	
T	era/som	
T	label	Darkshore1
A	zone	Darkshore
S	
T	som	
T	phase	3-6
T	label	Darkshore1
A	zone	Darkshore
E
G	Guides/forever/Alliance-Mage-12-21.lua
M	classic	
M	tbc	
M	selector	Alliance Mage
M	name	12-18 Darkshore Mage AoE
M	version	1
M	group	RestedXP Forever Guide (A)
M	subgroup	Speedrun Guide Mage
M	defaultfor	Alliance Mage
M	next	18-21 Redridge Mage AoE
S	
T	completewith	next
A	goto	1439/1,533.23,6399.77
A	vendor	
S	
A	goto	1439/1,519.48,6405.89
A	target	Wizbang Cranktoggle
A	accept	983
S	
A	goto	1439/1,515.55,6406.32
A	home	
S	
A	goto	1439/1,497.21,6427.72
A	target	Barithras Moonshade
A	accept	947
S	
A	goto	1439/1,473.63,6439.07
A	target	Sentinel Glynda Nal'Shea
A	accept	4811
S	
A	goto	1439/1,397.65,6437.76
A	target	Tharnariun Treetender
A	accept	2118
S	
A	goto	1439/1,362.93,6434.27
A	target	Terenthis
A	accept	984
S	
A	goto	1439/1,543.06,6342.57
A	target	Gwennyth Bly'Leggonde
A	accept	3524
S	
A	goto	1439/1,561.40,6343.01
A	fp	Auberdine
S	
T	completewith	Bear
A	complete	983,1
S	
A	goto	1439/1,558.78,6111.57
A	complete	3524,1
S	
T	sticky	
T	completewith	next
A	complete	2118,1
S	
A	goto	1439/1,386.51,5988.430
A	complete	984,1
S	
T	label	Bear
A	goto	1439/1,421.88,5804.16
A	complete	2118,1
S	
A	goto	1439/1,543.71,5962.67,150,0
A	goto	1439/1,577.12,6393.66
A	complete	983,1
S	
T	sticky	
T	completewith	ReadAndy
A	collect	5469,5,2178,1
S	
A	goto	1439/1,540.44,6313.31
A	turnin	983
A	accept	1001
S	
A	goto	1439/1,543.06,6342.57
A	turnin	3524
A	target	Gwennyth Bly'Leggonde
A	accept	4681
S	
A	goto	1439/1,535.85,6409.38,40,0
A	goto	1439/1,600.70,6425.100
A	target	Cerellean Whiteclaw
A	accept	963
S	
T	sticky	
T	completewith	Thundris
A	complete	1001,1
S	
T	completewith	next
A	goto	1439/1,734.32,6479.68,60
S	
A	goto	1439/1,854.84,6310.26
A	complete	4681,1
S	
A	goto	1439/1,543.06,6342.57
A	target	Gwennyth Bly'Leggonde
A	turnin	4681
S	
A	goto	1439/1,397.65,6437.76
A	turnin	2118
A	target	Tharnariun Treetender
A	accept	2138
S	
A	goto	1439/1,362.93,6434.27
A	turnin	984
A	target	Terenthis
A	accept	985
A	accept	4761
S	
A	goto	1439/1,332.80,5883.20
A	goto	1439/1,338.70,5985.81,0
A	complete	985,1
A	complete	985,2
S	
A	goto	1439/1,362.93,6434.71
A	turnin	985
A	target	Terenthis
A	accept	986
S	
A	goto	1439/1,384.55,6431.65
A	target	Sentinel Elissa Starbreeze
A	accept	965
S	
A	goto	1439/1,445.46,6536.01
A	target	Gorbold Steelhand
A	accept	982
S	
T	label	Thundris
A	goto	1439/1,492.62,6580.99
A	turnin	4761
A	target	Thundris Windweaver
A	accept	4762
A	accept	954
A	accept	958
S	
T	label	Threshers
T	sticky	
A	complete	1001,1
S	
A	goto	1439/1,391.75,7052.59,40,0
A	goto	1439/1,437.60,7076.17
A	complete	982,1
S	
T	requires	Threshers
A	goto	1439/1,302.02,7124.2,40,0
A	goto	1439/1,345.90,7134.68
A	complete	982,2
S	
A	goto	1439/1,193.29,7082.72
A	turnin	1001
A	accept	1002
S	
A	goto	1439/1,194.60,6959.14
A	accept	4723
S	
A	goto	1448/1,48.92,6748.85
A	turnin	954
A	target	Asterion
A	accept	955
S	
A	goto	1448/1,-33.31,6660.30
A	complete	955,1
S	
A	goto	1448/1,48.92,6748.85
A	turnin	955
A	target	Asterion
A	accept	956
S	
A	goto	1448/1,-60.33,6653.40
A	complete	956,1
S	
A	goto	1448/1,48.92,6748.85
A	turnin	956
A	target	Asterion
A	accept	957
S	
T	sticky	
T	completewith	ReadAndy
A	complete	1002,1
S	
T	sticky	
T	completewith	ReadAndy
A	complete	2138,1
S	
A	goto	1439/1,-383.77,7222.89
A	complete	4762,1
S	
T	sticky	
T	completewith	ReadAndy
S	
A	goto	1439/1,-144.04,6209.82
A	complete	4811,1
S	
T	label	ReadAndy
A	goto	1439/1,302.02,5726.433
A	target	Sentinel Tysha Moonblade
A	accept	953
S	
T	sticky	
T	label	anaya
A	goto	1439/1,171.67,5693.25,0
A	complete	963,1
A	unitscan	ANAYA DAWNRUNNER
S	
T	label	ghosts
T	sticky	
A	goto	1439/1,147.44,5630.370,0
A	complete	958,1
S	
A	goto	1448/1,147.82,5576.23
A	complete	953,2
S	
A	goto	1448/1,166.22,5634.12
A	complete	957,1
S	
A	goto	1448/1,105.84,5771.35
A	complete	953,1
S	
T	hidewindow	
T	requires	ghosts
S	
T	requires	anaya
A	goto	1439/1,302.02,5726.433
A	target	Sentinel Tysha Moonblade
A	turnin	953
S	
A	goto	1439/1,398.30,5677.53
A	complete	2138,1
A	collect	5469,5,2178,1
S	
A	goto	1439/1,509.00,5620.76
A	accept	4722
S	
A	goto	1439/1,582.36,5242.17
A	accept	4728
S	
A	hs	
S	
A	goto	1439/1,397.65,6437.33
A	turnin	2138
A	target	Tharnariun Treetender
A	accept	2139
S	
A	goto	1439/1,445.46,6535.58
A	target	Gorbold Steelhand
A	turnin	982
A	vendor	
S	
A	goto	1439/1,472.97,6557.85
A	target	Alanndarian Nightsong
A	accept	2178
A	turnin	2178
S	
A	goto	1439/1,491.97,6582.303
A	turnin	958
A	turnin	4762
A	target	Thundris Windweaver
A	accept	4763
S	
A	goto	1439/1,489.35,6506.32
A	target	Archaeologist Hollee
A	accept	729
S	
A	goto	1439/1,471.66,6439.95
A	turnin	4811
A	target	Sentinel Glynda Nal'Shea
A	accept	4812
S	
A	goto	1439/1,467.08,6409.38
A	complete	4812,1
A	collect	12347,1,4763,1
S	
T	completewith	next
A	goto	1439/1,529.30,6415.93
A	vendor	
S	
A	goto	1448/1,600.92,6424.93
A	target	Cerellean Whiteclaw
A	turnin	963
S	
A	goto	1439/1,577.77,6371.39
A	target	Gubber Blump
A	accept	1138
S	
A	goto	1439/1,543.06,6342.57
A	target	Gwennyth Bly'Leggonde
A	turnin	4722
A	turnin	4723
A	turnin	4728
S	
A	goto	1439/1,-157.79,6206.770
A	turnin	4812
A	accept	4813
S	
T	sticky	
T	label	MoonstalkersF
A	complete	1002,1
A	unitscan	Moonstalker;Moonstalker Runt
S	
A	goto	1439/1,47.88,6748.67
A	target	Asterion
A	turnin	957
S	
A	goto	1439/1,-376.56,6805.87
A	collect	12342,1
S	
A	goto	1439/1,-503.63,6732.95,45,0
A	goto	1439/1,-430.27,6662.65
A	complete	2139,1
S	
A	goto	1439/1,-451.23,6870.06
A	collect	12343,1
S	
A	goto	1439/1,-520.01,6873.99
A	collect	12341,1
S	
A	goto	1439/1,-489.22,6879.67
A	complete	4763,1
S	
T	completewith	next
A	goto	1439/1,-659.52,6901.50,35
S	
A	goto	1439/1,-704.06,6809.80
A	complete	947,1
A	complete	947,2
S	
A	goto	1439/1,-658.87,7246.47
A	turnin	965
A	target	Balthule Shadowstrike
A	accept	966
S	
A	goto	1439/1,-684.41,7161.32
A	complete	966,1
S	
A	goto	1439/1,-658.87,7246.47
A	turnin	966
A	target	Balthule Shadowstrike
A	accept	967
S	
T	requires	MoonstalkersF
A	goto	1439/1,-537.04,7540.35
A	accept	4727
S	
T	sticky	
T	completewith	Turtles
A	complete	1138,1
S	
A	goto	1439/1,-423.72,7277.04,25,0
A	goto	1439/1,-417.83,7262.19
A	turnin	1002
A	accept	1003
S	
T	softcore	
T	label	Turtles
A	goto	1439/1,47.88,7433.800
A	accept	4725
S	
T	hardcore	
T	label	Turtles
A	goto	1439/1,47.88,7433.800
A	accept	4725
S	
T	softcore	
A	deathskip	
S	
A	goto	1439/1,491.97,6582.303
A	target	Thundris Windweaver
A	turnin	4763
S	
A	goto	1439/1,397.65,6437.33
A	target	Tharnariun Treetender
A	turnin	2139
S	
A	goto	1439/1,471.66,6439.95
A	target	Sentinel Glynda Nal'Shea
A	turnin	4813
S	
A	goto	1439/1,497.21,6427.72
A	turnin	947
A	target	Barithras Moonshade
A	accept	948
S	
A	goto	1439/1,503.10,6401.96
A	accept	4740
S	
A	isQuestComplete	1138
A	goto	1439/1,577.77,6371.39
A	target	Gubber Blump
A	turnin	1138
S	
T	label	end
T	requires	bowl
A	goto	1448/1,543.42,6342.52
A	target	Gwennyth Bly'Leggonde
A	turnin	4727
A	turnin	4725
S	
T	completewith	Murkdeep
A	complete	986,1
A	unitscan	Moonstalker Sire;Moonstalker Matriarch
S	
T	completewith	Murkdeep
A	goto	1439/1,413.37,4818.17,0
A	complete	1003,1
S	
A	goto	1439/1,89.14,5002.00
A	turnin	948
A	target	Onu
A	accept	944
S	
T	completewith	next
A	goto	1439/1,79.97,4986.72
A	vendor	
S	Human
A	goto	1439/1,585.63,5237.370
A	accept	4728
S	
T	label	Murkdeep
A	goto	1439/1,549.61,4990.65
A	complete	4740,1
S	
A	complete	1138,1
S	
A	goto	1439/1,799.82,4808.12
A	accept	4730
S	
A	goto	1439/1,865.32,4678.432
A	accept	4731
S	
A	goto	1439/1,896.76,4597.21
A	accept	4732
S	
A	goto	1439/1,892.83,4517.30
A	accept	4733
S	
A	goto	1439/1,602.01,4678.87
A	target	Prospector Remtravel
A	turnin	729
S	
A	goto	1439/1,602.01,4678.87
A	target	Prospector Remtravel
A	accept	731,1
S	
A	complete	731,1
S	
T	completewith	Glaive
A	complete	986,1
A	unitscan	Moonstalker Sire;Moonstalker Matriarch
S	
A	collect	17056,1
S	
T	completewith	next
A	goto	1439/1,413.37,4818.17,0
A	complete	1003,1
S	
T	sticky	
T	completewith	Therylune
A	collect	5352,1,968
A	accept	968
S	
T	label	Glaive
A	goto	1439/1,433.02,4529.09
A	complete	944,1
S	
T	sticky	
T	label	TheryluneE
A	goto	1439/1,410.09,4519.49
A	target	Therylune
A	accept	945
S	
A	turnin	944
A	accept	949
S	
A	goto	1439/1,416.64,4576.69
A	turnin	949
A	accept	950
S	
T	label	Therylune
T	requires	TheryluneE
A	complete	945,1
S	
T	sticky	
T	label	MoonstalkerP
A	goto	1439/1,493.28,4321.68,100,0
A	goto	1439/1,389.79,4836.94,100,0
A	goto	1439/1,71.46,4749.17,100,0
A	goto	1439/1,389.79,4836.94,0
A	complete	986,1
A	unitscan	Moonstalker Sire;Moonstalker Matriarch
S	
A	goto	1439/1,413.37,4818.170
A	complete	1003,1
S	
A	goto	1439/1,229.97,4815.55
A	turnin	1003
S	
T	requires	MoonstalkerP
A	goto	1439/1,89.14,5002.00
A	target	Onu
A	turnin	950
S	
T	completewith	next
A	goto	1439/1,79.97,4987.16
A	vendor	
S	
A	goto	1439/1,33.47,4996.33
A	target	Kerlonian Evershade
A	accept	5321
S	
A	isOnQuest	5321
A	goto	1439/1,33.47,4996.33
A	complete	5321,2
S	
A	isOnQuest	5321
A	goto	1440/1,152.23,3260.72
A	complete	5321,1
S	
A	isOnQuest	5321
A	goto	1440/1,128.01,3305.31
A	target	Liladris Moonriver
A	turnin	5321
S	
A	goto	1440/1,189.71,3185.390
A	target	Delgren the Purifier
A	turnin	967
S	
T	softcore	
A	goto	1440/1,394.43,2677.63
A	target	Therysil
A	turnin	945
S	
T	hardcore	
A	goto	1440/1,394.43,2677.63
A	target	Therysil
A	turnin	945
S	
A	hs	
S	
A	goto	1439/1,577.77,6371.39
A	target	Gubber Blump
A	turnin	1138
S	
A	goto	1439/1,543.06,6342.130
A	target	Gwennyth Bly'Leggonde
A	turnin	4730
A	turnin	4731
A	turnin	4732
A	turnin	4733
S	
A	goto	1439/1,470.35,6439.07
A	target	Sentinel Glynda Nal'Shea
A	turnin	4740
S	
A	isQuestComplete	986
A	goto	1439/1,362.93,6434.71
A	turnin	986
A	target	Terenthis
A	accept	993
S	
A	goto	1439/1,489.35,6506.32
A	target	Archaeologist Hollee
A	turnin	731
A	isQuestComplete	731
S	
A	goto	1439/1,489.35,6506.32
A	target	Archaeologist Hollee
A	accept	741
A	isQuestTurnedIn	731
S	
T	completewith	next
A	isOnQuest	741
A	goto	1439/1,555.50,6418.99,30,0
A	goto	1439/1,769.03,6579.24,40
S	
A	isOnQuest	741
A	zone	Teldrassil
S	
A	isOnQuest	741
A	goto	1438/1,965.80,8781.63,30
S	
A	isOnQuest	741
A	goto	1457/1,2607.74,9642.04
A	turnin	741
A	target	Chief Archaeologist Greywhisker
A	accept	942
S	
A	goto	1438/1,841.05,8641.122
A	fp	Teldrassil
A	fly	Auberdine
S	
A	goto	1439/1,818.16,6422.92,50,0
A	zone	Wetlands
S	
T	completewith	next
A	money	<0.08
A	goto	1437/0,-819.67,-3691.42,15,0
A	goto	1437/0,-807.26,-3716.22,15,0
A	goto	1437/0,-827.94,-3724.49,15,0
A	goto	1437,10.760,56.721
A	collect	4371,1,175,1
S	
A	goto	1437/0,-782.03,-3793.12
A	fly	Ironforge
S	skip --logout skip
T	completewith	next
A	goto	1455/0,-1158.16,-4816.32,0
A	link	https://www.youtube.com/watch?v=PWMJhodh6Bw
S	
A	zone	Stormwind City
S	
T	completewith	FlyAndy
A	goto	1453/0,638.8,-8341.95
A	vendor	
A	bronzetube	
S	Human
T	label	FlyAndy
A	goto	1429/0,409.13,-9100.58
A	zone	Elwynn Forest
S	Gnome
A	goto	1429/0,622.93,-8830.700
A	zone	Stormwind City
S	Gnome
T	label	FlyAndy
A	goto	1453/0,606.4,-8812.0,50,0
A	goto	1453/0,490.12,-8835.76
A	fp	Stormwind City
S	Gnome
A	goto	1453/0,493.08,-8867.22,12,0
A	goto	1453/0,507.6,-8885.59,18
S	
A	goto	1429/0,44.00,-9459.11,15,0
A	goto	1429/0,14.84,-9477.86,15,0
A	goto	1429/0,34.28,-9471.61
A	trainer	
S	
A	goto	1429/0,-1637.62,-9642.89,125,0
A	zone	Redridge Mountains
E
G	Guides/forever/Alliance-Mage-12-21.lua
M	classic	
M	tbc	
M	selector	Alliance Mage
M	name	18-21 Redridge Mage AoE
M	version	1
M	group	RestedXP Forever Guide (A)
M	subgroup	Speedrun Guide Mage
M	defaultfor	Alliance Mage
M	next	21-22 Duskwood Mage AoE
S	
T	sticky	
T	completewith	Gnolls
A	link	https://youtu.be/SxMc2GoP33c?t=56
S	
A	goto	1429/0,-1902.44,-9609.56
A	target	Guard Parker
A	accept	244
S	
T	sticky	
T	label	Gnolls
A	goto	1433/0,-2238.15,-9443.60
A	turnin	244
A	target	Deputy Feldon
A	accept	246
S	
A	goto	1433/0,-2234.89,-9435.060
A	fp	Redridge Mountains
S	
T	requires	Gnolls
A	goto	1433/0,-2298.28,-9283.90
A	target	Marshal Marris
A	accept	20
S	
A	goto	1433/0,-2268.54,-9279.27
A	target	Foreman Oslow
A	accept	125
S	
A	goto	1433/0,-2242.49,-9259.00
A	target	Verner Osgood
A	accept	118
S	
A	goto	1433/0,-2216.00,-9215.85
A	target	Bailiff Conacher
A	accept	91
S	
A	goto	1433/0,-2221.87,-9218.60
A	target	Magistrate Solomon
A	accept	120
S	
A	goto	1433/0,-2172.59,-9261.02
A	target	Dockmaster Baren
A	accept	127
S	
A	goto	1433/0,-2151.53,-9247.12
A	accept	180
S	
A	goto	1433/0,-2158.91,-9235.97
A	target	Darcy
A	accept	129
S	
A	goto	1433/0,-2157.18,-9223.96
A	home	
S	
A	goto	1433/0,-2207.32,-9351.66
A	target	Shawn
A	accept	3741
S	
A	goto	1433/0,-2174.32,-9386.56,90,0
A	goto	1433/0,-2147.41,-9308.08,90,0
A	goto	1433/0,-2090.96,-9373.82,90,0
A	goto	1433/0,-1986.76,-9324.30,90,0
A	goto	1433/0,-2246.40,-9359.92,90,0
A	goto	1433/0,-2309.57,-9376.28,90,0
A	goto	1433/0,-2397.70,-9363.97,90,0
A	complete	3741,1
S	
T	completewith	next
A	goto	1433/0,-1906.66,-9478.500,0
S	
A	goto	1433/0,-1902.54,-9609.83
A	turnin	129
A	target	Guard Parker
A	accept	130
S	
A	goto	1433/0,-2234.89,-9435.21
A	fly	Stormwind
S	
A	goto	1453/0,612.99,-8796.14
A	trainer	
S	
T	softcore	
A	goto	1453/0,660.17,-8814.51,30,0
A	goto	1453/0,638.26,-8342.31
A	bronzetube	
S	
T	hardcore	
A	goto	1453/0,660.17,-8814.51,30,0
A	goto	1453/0,638.26,-8342.31
A	vendor	
A	bronzetube	
S	
A	goto	1453/0,520.77,-8954.16
A	turnin	120
A	target	General Marcus Jonathan
A	accept	121
S	
A	goto	1429/0,87.73,-9456.79
A	turnin	118
A	target	Smith Argus
A	accept	119
S	
A	goto	1436/0,1045.12,-10508.80
A	target	Gryan Stoutmantle
A	accept	65
S	
T	completewith	next
T	label	hsLakeshire
A	hs	Lakeshire
S	
T	completewith	hsLakeshire
T	label	WFFP
A	goto	1436/0,1037.42,-10628.50
A	fp	Westfall
A	fly	Redridge
S	
T	requires	WFFP
A	goto	1433/0,-2243.14,-9259.43
A	turnin	119
A	target	Verner Osgood
A	accept	122
A	accept	124
S	
A	goto	1433/0,-2220.56,-9218.74
A	turnin	121
A	target	Magistrate Solomon
A	accept	143
A	target	Bailiff Conacher
A	accept	91
S	
A	goto	1433/0,-2145.45,-9231.63
A	turnin	65
A	target	Wiley the Black
A	accept	132
S	
A	goto	1433/0,-2205.58,-9351.52
A	target	Hilary
A	turnin	3741
S	
T	era/som	
T	completewith	Murlocs
A	collect	2296,5,92,1
A	collect	1080,5,92,1
A	collect	1081,5,92,1
S	
T	completewith	Murlocs
A	complete	122,1
S	
A	goto	1433/0,-2211.45,-9793.71,50,0
A	goto	1433/0,-2321.94,-9776.63,50,0
A	goto	1433/0,-2513.84,-9604.61,50,0
A	goto	1433/0,-2211.45,-9793.71,50,0
A	goto	1433/0,-2321.94,-9776.63,50,0
A	goto	1433/0,-2513.84,-9604.61,50,0
A	complete	246,1
A	complete	246,2
S	
T	label	Murlocs
A	goto	1433/0,-2630.63,-9581.16
A	complete	127,1
A	collect	1468,8,150,1
S	
T	era/som	
A	goto	1433/0,-2895.91,-9697.86
A	collect	1080,5,92,1
A	complete	122,1
S	
T	som	
T	phase	3-6
A	goto	1433/0,-2895.91,-9697.86
A	complete	122,1
S	
A	goto	1433/0,-3226.75,-9789.51,50,0
A	goto	1433/0,-3210.46,-9637.19,50,0
A	goto	1433/0,-3226.75,-9789.51,50,0
A	goto	1433/0,-3210.46,-9637.19,50,0
A	collect	3014,8
S	
A	goto	1433/0,-2472.16,-9366.72
A	complete	125,1
S	
T	era/som	
A	goto	1433/0,-2267.02,-9596.36
A	collect	2296,5,92,1
S	
A	goto	1433/0,-2238.15,-9443.75
A	target	Deputy Feldon
A	turnin	246
S	
A	isQuestComplete	20
A	goto	1433/0,-2298.06,-9283.90
A	target	Marshal Marris
A	turnin	20
S	
A	goto	1433/0,-2268.54,-9279.12
A	turnin	125
A	target	Foreman Oslow
A	accept	89
S	
A	goto	1433/0,-2243.36,-9259.43
A	target	Verner Osgood
A	turnin	122
S	
T	level	20
A	goto	1433/0,-2172.59,-9261.02
A	turnin	127
A	target	Dockmaster Baren
A	accept	150
A	turnin	150
S	
A	goto	1433/0,-2172.59,-9261.02
A	target	Dockmaster Baren
A	turnin	127
S	
A	goto	1433/0,-2045.38,-9245.82
A	turnin	130
A	target	Martie Jainrose
A	accept	131
A	accept	34
S	
A	goto	1433/0,-1910.79,-9288.97
A	complete	34,1
S	
A	goto	1433/0,-2045.16,-9245.67
A	target	Martie Jainrose
A	turnin	34
S	
A	goto	1433/0,-2031.70,-9098.71,60,0
A	goto	1433/0,-2313.26,-9149.82,60,0
A	goto	1433/0,-2430.70,-9030.51,60,0
A	goto	1433/0,-2313.26,-9149.82,60,0
A	goto	1433/0,-2031.70,-9098.71,60,0
A	goto	1433/0,-2313.26,-9149.82,60,0
A	goto	1433/0,-2430.70,-9030.51,60,0
A	complete	89,1
A	complete	89,2
A	complete	124,1
A	complete	124,2
S	
T	completewith	next
A	goto	1433/0,-2375.13,-9228.73,50,0
A	goto	1433/0,-2401.83,-9180.95,50,0
A	goto	1433/0,-2449.15,-9161.70,50,0
A	complete	20,1
S	
T	era/som	
T	completewith	next
A	goto	1433/0,-2639.97,-9149.24,150
S	
T	era/som	
A	goto	1433/0,-2813.20,-9230.04
A	collect	1081,5,92,1
S	
A	goto	1433/0,-2911.11,-9195.00
A	complete	20,1
S	
A	goto	1433/0,-2298.06,-9283.90
A	target	Marshal Marris
A	turnin	20
S	
A	goto	1433/0,-2268.76,-9279.27
A	target	Foreman Oslow
A	turnin	89
S	
A	goto	1433/0,-2243.36,-9259.57
A	turnin	124
A	target	Verner Osgood
A	accept	126
S	
A	goto	1433/0,-2158.91,-9235.97
A	target	Darcy
A	turnin	131
S	
A	goto	1433/0,-2157.18,-9223.81
A	vendor	
S	
T	era/som	
A	goto	1433/0,-2063.61,-9212.080
A	target	Chef Breanna
A	accept	92
A	turnin	92
S	
T	era/som	
T	completewith	next
A	goto	1433/0,-2146.97,-9225.110
S	
A	goto	1433/0,-1711.94,-9895.21,90,0
A	zone	Duskwood
E
]=]
