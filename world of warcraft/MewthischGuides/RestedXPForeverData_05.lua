local addonName, MG = ...
MG.RestEDXPForeverRaw = MG.RestEDXPForeverRaw or { source = { repository = "RestedXP/RXPGuides", commit = "a688a75d595f5884dba8044a5ba4e7d7bd859c09", license = "CC BY-NC-SA 4.0", transformed = true, proseCopied = false }, chunks = {} }
MG.RestEDXPForeverRaw.chunks[#MG.RestEDXPForeverRaw.chunks + 1] = [=[
G	Guides/SurvivalGuide/A-Hardcore-18-19 Loch Modan.lua
M	hardcore	
M	classic	
M	tbc	
M	selector	Alliance
M	name	18-19 Loch Modan
M	version	1
M	group	RestedXP Survival Guide (A)
M	subgroup	RXP Survival Guide 1-20
M	next	19-20 Redridge
S	
A	goto	Wetlands,7.95,56.38
A	vendor	
A	target	Dewin Shimmerdawn
S	
A	goto	Wetlands,10.4,56.0,25,0
A	goto	Wetlands,10.1,56.9,25,0
A	goto	Wetlands,10.6,57.2,25,0
A	goto	Wetlands,10.761,56.737
A	vendor	
A	target	Neal Allen
A	bronzetube	
S	Hunter
A	goto	Wetlands,11.113,58.316
A	vendor	
A	collect	11362,1
A	collect	2515,1800
A	target	Edwina Monzor
S	
A	goto	Wetlands,10.43,61.01,10,0
A	goto	Wetlands,10.496,60.201
A	vendor	
A	target	Samor Festivus
S	!Druid !Hunter
A	goto	Wetlands,9.49,59.69
A	fly	Ironforge
A	target	Shellei Brondir
A	zoneskip	Wetlands,1
A	xp	<18,1
S	!Druid !Hunter
A	goto	Ironforge,65.905,88.405 << Warrior
A	goto	Ironforge,51.1,8.7,15,0 << Warlock
A	goto	Ironforge,50.343,5.657 << Warlock
A	goto	Ironforge,51.495,15.330 << Rogue
A	goto	Ironforge,25.207,10.756 << Priest
A	goto	Ironforge,27.18,8.60 << Mage
A	goto	Ironforge,23.141,6.149 << Paladin
A	trainer	
A	target	Bilban Tosslespanner << Warrior
A	target	Briarthorn << Warlock
A	target	Fenthwick << Rogue
A	target	Toldren Deepiron << Priest
A	target	Dink << Mage
A	target	Brandur Ironhammer << Paladin
A	xp	<18,1
S	!Druid !Hunter
A	goto	Ironforge,55.501,47.742
A	fly	Loch Modan
A	target	Gryth Thurden
A	zoneskip	Ironforge,1
S	
A	goto	Wetlands,9.49,59.69
A	fly	Loch Modan
A	target	Shellei Brondir
A	zoneskip	Wetlands,1
S	
A	group	
A	goto	Loch Modan,34.53,43.72,10,0
A	goto	Loch Modan,34.69,43.18
A	accept	255
A	target	Magistrate Bluntnose
S	
A	goto	Loch Modan,37.17,47.94,8,0
A	goto	Loch Modan,37.24,47.38
A	accept	436
A	target	Jern Hornhelm
S	
T	completewith	next
A	goto	Loch Modan,23.85,17.92,100
S	
A	goto	Loch Modan,23.85,17.92,10,0
A	goto	Loch Modan,24.77,18.40
A	turnin	353
A	accept	307
A	target	Mountaineer Stormpike
S	
T	completewith	next
A	goto	Loch Modan,35.50,18.97,20
S	
A	goto	Loch Modan,35.93,22.55
A	complete	307,1
S	
A	goto	Loch Modan,23.85,17.92,10,0
A	goto	Loch Modan,24.77,18.40
A	turnin	307
A	target	Mountaineer Stormpike
S	
T	completewith	next
A	goto	Loch Modan,43.43,10.14,50
S	
A	goto	Loch Modan,46.05,13.61
A	accept	250
A	target	Chief Engineer Hinderweir VII
S	
A	goto	Loch Modan,56.05,13.24
A	turnin	250
A	accept	199
S	
A	goto	Loch Modan,46.05,13.61
A	turnin	199
A	target	Chief Engineer Hinderweir VII
S	
T	completewith	next
A	line	Loch Modan,55.5,67.1,60.2,62.0,62.9,57.6,63.7,54.3,64.2,51.8,64.5,46.1,64.2,35.9,63.4,33.7,59.3,24.4,60.2,22.4,57.3,19.4
A	unitscan	Haren Swifthoof
A	unitscan	Gradok
A	unitscan	Thragomm
S	
T	completewith	next
A	goto	Loch Modan,82.92,59.37,80,0
A	goto	Loch Modan,83.28,62.97,25
S	
A	accept	257
A	goto	Loch Modan,83.49,65.40
A	target	Daryl the Youngling
S	Hunter
A	goto	Loch Modan,82.225,62.842
A	trainer	
A	target	Claude Erksine
S	Hunter
A	goto	Loch Modan,82.391,62.393
A	trainer	
A	target	Dargh Trueaim
S	
A	accept	385
A	goto	Loch Modan,81.76,61.66
A	target	Marek Ironheart
S	
A	goto	Loch Modan,80.09,64.16,60,0
A	goto	Loch Modan,77.16,75.57,60,0
A	goto	Loch Modan,70.78,72.91,60,0
A	goto	Loch Modan,76.65,62.27,60,0
A	goto	Loch Modan,76.36,56.05,60,0
A	goto	Loch Modan,80.09,64.16,60,0
A	goto	Loch Modan,77.16,75.57,60,0
A	goto	Loch Modan,70.78,72.91,60,0
A	goto	Loch Modan,76.65,62.27,60,0
A	goto	Loch Modan,76.36,56.05,60,0
A	goto	Loch Modan,80.09,64.16
A	complete	257,1
A	mob	Mountain Buzzard
S	
T	completewith	next
A	goto	Loch Modan,82.92,59.37,80,0
A	goto	Loch Modan,83.28,62.97,25
S	
A	goto	Loch Modan,83.49,65.40
A	turnin	257
A	accept	258
A	target	Daryl the Youngling
S	
A	goto	Loch Modan,74.65,49.60,70,0
A	goto	Loch Modan,75.80,43.43,70,0
A	goto	Loch Modan,71.10,38.98,70,0
A	goto	Loch Modan,65.59,41.89,70,0
A	goto	Loch Modan,61.66,32.02,70,0
A	goto	Loch Modan,72.79,39.86,70,0
A	goto	Loch Modan,73.87,51.85,70,0
A	goto	Loch Modan,69.45,39.18
A	complete	258,1
A	mob	Elder Mountain Boar
S	
T	completewith	next
A	goto	Loch Modan,82.92,59.37,80,0
A	goto	Loch Modan,83.28,62.97,25
S	
A	goto	Loch Modan,83.49,65.40
A	turnin	258
A	target	Daryl the Youngling
S	
A	group	
A	goto	Loch Modan,81.73,64.15
A	accept	271
A	target	Vyrin Swiftwind
S	
T	completewith	next
A	line	Loch Modan,55.5,67.1,60.2,62.0,62.9,57.6,63.7,54.3,64.2,51.8,64.5,46.1,64.2,35.9,63.4,33.7,59.3,24.4,60.2,22.4,57.3,19.4
A	unitscan	Haren Swifthoof
A	unitscan	Gradok
A	unitscan	Thragomm
S	
T	completewith	next
A	goto	Loch Modan,54.7,38.3,200
S	
A	goto	Loch Modan,58.86,38.32,80,0
A	goto	Loch Modan,54.80,40.02,60,0
A	goto	Loch Modan,54.16,35.79,60,0
A	goto	Loch Modan,54.72,38.15
A	complete	385,1
A	complete	385,2
A	mob	Loch Crocolisk
S	
T	completewith	next
A	line	Loch Modan,55.5,67.1,60.2,62.0,62.9,57.6,63.7,54.3,64.2,51.8,64.5,46.1,64.2,35.9,63.4,33.7,59.3,24.4,60.2,22.4,57.3,19.4
A	unitscan	Haren Swifthoof
A	unitscan	Gradok
A	unitscan	Thragomm
S	
T	completewith	next
A	goto	Loch Modan,64.89,66.66,80
S	
A	goto	Loch Modan,64.89,66.66
A	turnin	436
A	accept	297
A	target	Magmar Fellhew
S	
A	goto	Loch Modan,65.934,65.622
A	accept	298
A	target	Prospector Ironband
S	
A	goto	Loch Modan,66.92,59.89,30,0
A	goto	Loch Modan,70.67,60.58,40,0
A	goto	Loch Modan,72.86,62.09,20,0
A	goto	Loch Modan,71.03,68.89,30,0
A	goto	Loch Modan,70.38,62.82
A	complete	297,1
A	mob	Stonesplinter Digger
A	mob	Stonesplinter Geomancer
A	mob	Berserk Trogg
S	
A	goto	Loch Modan,64.89,66.66
A	turnin	297
A	target	Magmar Fellhew
S	
A	group	
T	completewith	next
A	goto	Loch Modan,41.21,64.33,100
A	isOnQuest	271
S	
A	group	3
A	goto	Loch Modan,39.43,66.38,10,0
A	goto	Loch Modan,41.00,63.03,10,0
A	goto	Loch Modan,39.97,61.67,10,0
A	goto	Loch Modan,37.81,62.87,15,0
A	goto	Loch Modan,36.73,61.08
A	complete	271,1
A	unitscan	Ol' Sooty
A	isOnQuest	271
S	
T	completewith	next
A	goto	Loch Modan,82.92,59.37,80,0
A	goto	Loch Modan,83.28,62.97,25
S	
A	goto	Loch Modan,81.76,61.66
A	turnin	385
A	target	Marek Ironheart
S	
A	group	
A	goto	Loch Modan,83.49,65.40
A	turnin	271
A	target	Daryl the Youngling
A	isQuestComplete	271
S	
A	group	
A	goto	Loch Modan,83.49,65.40
A	accept	531
A	target	Daryl the Youngling
A	isQuestTurnedIn	271
S	
A	group	
A	goto	Loch Modan,81.73,64.15
A	turnin	531
A	target	Vyrin Swiftwind
A	isOnQuest	531
S	
A	group	
A	abandon	271
S	
A	group	
A	goto	Loch Modan,73.87,29.64,100
A	isOnQuest	255
S	
A	group	3
A	complete	255,1
A	mob	+Mo'grosh Ogre
A	goto	Loch Modan,73.87,29.64,60,0
A	goto	Loch Modan,73.57,25.15,60,0
A	goto	Loch Modan,73.61,20.23,60,0
A	goto	Loch Modan,68.97,21.14,60,0
A	goto	Loch Modan,68.86,28.05,60,0
A	goto	Loch Modan,70.51,23.73
A	complete	255,3
A	mob	+Mo'grosh Enforcer
A	goto	Loch Modan,73.87,29.64,60,0
A	goto	Loch Modan,73.57,25.15,60,0
A	goto	Loch Modan,73.61,20.23,60,0
A	goto	Loch Modan,68.97,21.14,60,0
A	goto	Loch Modan,68.86,28.05,60,0
A	goto	Loch Modan,70.51,23.73
A	complete	255,2
A	goto	Loch Modan,68.63,19.49,25,0
A	goto	Loch Modan,74.84,25.08,25,0
A	goto	Loch Modan,68.63,19.49,25,0
A	goto	Loch Modan,74.84,25.08
A	isOnQuest	255
A	mob	+Mo'grosh Brute
S	
T	completewith	next
A	line	Loch Modan,55.5,67.1,60.2,62.0,62.9,57.6,63.7,54.3,64.2,51.8,64.5,46.1,64.2,35.9,63.4,33.7,59.3,24.4,60.2,22.4,57.3,19.4
A	unitscan	Haren Swifthoof
A	unitscan	Gradok
A	unitscan	Thragomm
S	
T	completewith	FINISHED
A	goto	Loch Modan,36.77,46.20,150
S	
A	goto	Loch Modan,37.17,47.94,8,0
A	goto	Loch Modan,37.24,47.38
A	turnin	298
A	accept	301
A	target	Jern Hornhelm
S	
A	group	
A	goto	Loch Modan,34.53,43.72,10,0
A	goto	Loch Modan,34.69,43.18
A	turnin	255
A	target	Magistrate Bluntnose
A	isQuestComplete	255
S	
A	group	
A	abandon	255
S	
T	label	FINISHED
A	goto	Loch Modan,33.938,50.954
A	fly	Ironforge
A	target	Thorgrum Borrelson
S	
A	goto	Ironforge,74.645,11.742
A	turnin	301
A	target	Prospector Stormpike
S	
A	isQuestTurnedIn	2078
A	goto	Ironforge,35.90,60.17
A	bankdeposit	5996
A	target	Bailey Stonemantle
S	
T	completewith	next
A	goto	Ironforge,67.84,42.50
A	vendor	
A	bronzetube	
A	target	Gearcutter Cogspinner
S	
A	goto	Ironforge,78.00,52.00,5,0
A	zone	Stormwind City
E
G	Guides/SurvivalGuide/A-Hardcore-19-20 Redridge.lua
M	hardcore	
M	classic	
M	tbc	
M	selector	Alliance
M	name	19-20 Redridge
M	version	1
M	group	RestedXP Survival Guide (A)
M	subgroup	RXP Survival Guide 1-20
M	next	20-21 Darkshore/Ashenvale
S	Hunter
A	goto	StormwindClassic,61.609,15.269
A	trainer	
A	target	Einris Brightspear
S	Hunter
A	goto	StormwindClassic,61.576,15.996
A	trainer	
A	target	Karrina Mekenda
S	
T	completewith	BMenace
A	goto	StormwindClassic,55.21,7.04
A	vendor	
A	bronzetube	
A	target	Billibub Cogspinner
S	
A	isOnQuest	1338
A	goto	StormwindClassic,58.08,16.52
A	target	Furen Longbeard
A	turnin	1338
A	isOnQuest	1338
S	
A	dungeon	DM
A	accept	2040
A	target	+Shoni the Shilent
A	goto	StormwindClassic,55.510,12.504
A	accept	167
A	accept	168
A	goto	StormwindClassic,65.438,21.175
A	target	+Wilder Thistlenettle
S	Hunter
T	ssf	
T	completewith	ExitSW
A	goto	StormwindClassic,49.990,57.641
A	collect	3027,1
A	target	Frederick Stover
A	money	<0.6722
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.20
S	Hunter
T	ah	
T	completewith	ExitSW
A	goto	StormwindClassic,49.990,57.641
A	collect	3027,1
A	target	Frederick Stover
A	money	<0.6722
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.20
S	Hunter
A	goto	StormwindClassic,49.990,57.641
A	collect	2515,1800
A	target	Frederick Stover
S	Hunter
A	use	3027
A	itemcount	3027,1
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.19
A	xp	<20,1
S	Mage
T	completewith	next
A	goto	StormwindClassic,37.69,82.09,10
S	Mage
A	goto	StormwindClassic,36.87,81.14
A	trainer	
A	target	Elsharin
S	Paladin/Priest
T	completewith	next
A	goto	StormwindClassic,42.51,33.51,20
S	Paladin
A	goto	StormwindClassic,38.82,31.27,10,0
A	goto	StormwindClassic,38.67,32.82
A	trainer	
A	target	Arthur the Faithful
S	Priest
A	goto	StormwindClassic,38.54,26.86
A	trainer	
A	target	Brother Joshua
S	Warlock/Priest
A	goto	StormwindClassic,42.65,67.16,14,0
A	goto	StormwindClassic,42.88,65.11
A	collect	5210,1
A	target	Ardwyn Cailen
S	Warlock
T	completewith	next
A	goto	StormwindClassic,29.2,74.0,20,0
A	goto	StormwindClassic,27.2,78.1,15
S	Warlock
A	goto	StormwindClassic,26.11,77.22
A	trainer	
A	target	Ursula Deline
S	Rogue
A	goto	StormwindClassic,74.64,52.82
A	trainer	
A	target	Osborne the Night Man
S	Warrior
A	goto	StormwindClassic,76.08,50.14,15,0
A	goto	StormwindClassic,80.22,45.37,15,0
A	goto	StormwindClassic,78.68,45.79
A	trainer	
A	target	Wu Shen
A	target	Ilsa Corbin
S	Druid
A	goto	StormwindClassic,20.898,55.491
A	trainer	
A	target	Sheldras Moontree
S	!Hunter !Priest
A	goto	StormwindClassic,57.12,57.69
A	train	201
A	train	1180
A	train	202
A	target	Woo Ping
S	Rogue
A	goto	StormwindClassic,57.38,56.77
A	collect	923,1
A	collect	2209,1
A	target	Marda Weller
S	
T	ah	
A	goto	Stormwind City,53.612,59.764
A	collect	2296,5,92,1
A	collect	1080,5,92,1
A	collect	1081,5,92,1
A	collect	2798,5,347,1
A	target	Auctioneer Jaxon
S	!NightElf
A	goto	StormwindClassic,66.27,62.12
A	fly	Redridge
A	target	Dungar Longdrink
S	NightElf
T	label	ExitSW
A	goto	StormwindClassic,73.2,92.1
A	zone	Elwynn Forest
A	zoneskip	Redridge Mountains
S	NightElf
T	completewith	GParker
T	label	start
A	goto	Redridge Mountains,15.27,71.45
A	zone	Redridge Mountains
S	NightElf
T	label	GParker
A	goto	Redridge Mountains,15.27,71.45
A	accept	244
A	target	Guard Parker
S	NightElf
A	goto	Redridge Mountains,30.73,59.99
A	turnin	244
A	target	Deputy Feldon
A	accept	246
S	
A	goto	Redridge Mountains,32.13,48.63
A	accept	125
A	target	Foreman Oslow
S	
A	target	Verner Osgood
A	goto	Redridge Mountains,30.97,47.27
A	accept	118
S	
A	goto	Redridge Mountains,29.31,45.33,15,0
A	goto	Redridge Mountains,29.98,44.45
A	target	Magistrate Solomon
A	accept	120
S	
A	goto	Redridge Mountains,26.80,44.40
A	target	Darcy
A	accept	129
S	
A	goto	Redridge Mountains,27.35,44.07,8,0
A	goto	Redridge Mountains,26.48,45.34
A	turnin	65
A	accept	132
A	target	Wiley the Black
S	
T	era/som	
A	goto	Redridge Mountains,22.67,43.83
A	target	Chef Breanna
A	accept	92
S	
A	target	Shawn
A	goto	Redridge Mountains,29.31,53.63
A	accept	3741
S	
A	goto	Redridge Mountains,27.80,56.05,0
A	goto	Redridge Mountains,26.56,50.63,0
A	goto	Redridge Mountains,23.96,55.17,0
A	goto	Redridge Mountains,19.16,51.75,0
A	goto	Redridge Mountains,31.12,54.21,0
A	goto	Redridge Mountains,34.03,55.34,0
A	goto	Redridge Mountains,38.09,54.49,0
A	goto	Redridge Mountains,19.16,51.75,70,0
A	goto	Redridge Mountains,38.09,54.49,70,0
A	complete	3741,1
S	
A	goto	Redridge Mountains,29.24,53.63
A	turnin	3741
A	target	Hilary
S	
A	goto	Redridge Mountains,30.59,59.42
A	target	Ariena Stormfeather
A	fly	Westfall
S	
A	goto	Westfall,56.33,47.52
A	turnin	132
A	accept	135
A	target	Gryan Stoutmantle
S	
A	goto	Westfall,56.55,52.64
A	fly	Stormwind
A	target	Thor
S	
A	goto	StormwindClassic,63.982,75.338
A	turnin	120
A	accept	121
A	target	General Marcus Jonathan
S	
T	completewith	next
A	goto	StormwindClassic,74.90,54.00,20,0
A	goto	StormwindClassic,78.43,60.15,20,0
A	goto	StormwindClassic,78.67,60.13,10
S	
A	goto	StormwindClassic,75.78,59.84
A	turnin	135
A	accept	141
A	target	Master Mathias Shaw
S	
T	completewith	next
A	goto	StormwindClassic,66.27,62.12
A	fly	Westfall
A	target	Dungar Longdrink
S	
A	goto	Westfall,56.33,47.52
A	turnin	141
A	accept	142
A	target	Gryan Stoutmantle
S	
T	completewith	next
A	goto	Westfall,44.50,69.62,55
S	
A	goto	Westfall,44.50,69.62
A	line	Westfall,44.50,69.62,44.50,69.62,45.08,69.40,45.21,69.35,45.63,68.69,45.85,67.73,45.62,66.99,45.52,65.71,45.61,64.95,44.28,63.88,44.26,62.80,43.60,59.89,43.37,58.42,43.26,57.01,43.12,54.24,42.15,52.74,41.74,51.42,41.48,49.89,40.91,48.71,38.93,46.05,38.51,45.46,37.85,45.54,36.60,44.21,36.06,43.86,35.12,43.49,33.92,43.21,32.56,43.05,31.34,44.54,32.56,43.05,33.92,43.21,35.12,43.49,36.06,43.86,36.26,43.77,36.87,42.87,36.95,40.85,37.04,39.79,37.91,36.98,39.06,35.58,40.48,34.31,41.27,32.87,41.76,31.27,42.26,30.26,43.20,28.99,44.29,28.19,44.64,26.85,44.57,24.94,44.64,26.85,44.29,28.19,43.20,28.99,42.26,30.26,41.76,31.27,41.27,32.87,40.48,34.31,39.06,35.58,37.91,36.98,37.04,39.79,36.95,40.85,36.87,42.87,36.26,43.77,36.06,43.86,35.12,43.49,33.92,43.21,32.56,43.05,31.34,44.54,32.56,43.05,33.92,43.21,35.12,43.49,36.06,43.86,36.60,44.21,37.85,45.54,38.51,45.46,38.93,46.05,40.91,48.71,41.48,49.89,41.74,51.42,42.15,52.74,43.12,54.24,43.26,57.01,43.37,58.42,43.60,59.89,44.26,62.80,44.28,63.88,45.61,64.95,45.52,65.71,45.62,66.99,45.85,67.73,45.63,68.69,45.21,69.35,45.08,69.40,44.50,69.62
A	complete	142,1
A	unitscan	Defias Messenger
S	
T	completewith	next
A	goto	Westfall,30.01,86.02,40
S	
A	goto	Westfall,30.01,86.02
A	accept	104
A	accept	103
A	target	Captain Grayson
S	
A	goto	Westfall,30.01,86.02
A	turnin	103
A	itemcount	814,5
A	target	Captain Grayson
S	
A	goto	Westfall,34.43,83.93
A	line	Westfall,34.43,83.93,34.43,83.93,33.88,83.32,33.08,82.86,32.56,82.71,32.08,82.49,31.91,82.36,31.55,81.88,30.86,81.42,30.63,81.16,30.33,80.81,30.02,80.11,29.68,79.22,29.32,78.19,29.29,77.60,29.27,77.31,29.18,76.26,29.07,75.29,28.95,74.14,28.85,73.29,28.79,72.48,28.37,71.94,27.84,71.29,27.44,70.25,27.29,69.47,27.13,68.65,27.09,67.57,27.07,67.01,26.74,66.09,27.07,67.01,27.09,67.57,27.13,68.65,27.29,69.47,27.44,70.25,27.84,71.29,28.37,71.94,28.79,72.48,28.85,73.29,28.95,74.14,29.07,75.29,29.18,76.26,29.27,77.31,29.29,77.60,29.32,78.19,29.68,79.22,30.02,80.11,30.33,80.81,30.63,81.16,30.86,81.42,31.55,81.88,31.91,82.36,32.08,82.49,32.56,82.71,33.08,82.86,33.88,83.32,34.43,83.93
A	complete	104,1
A	unitscan	Old Murk-Eye
S	
A	goto	Westfall,30.01,86.02
A	turnin	104
A	target	Captain Grayson
S	
A	abandon	103
S	
A	goto	Westfall,56.33,47.52
A	turnin	142
A	target	Gryan Stoutmantle
S	
A	goto	Westfall,55.68,47.50
A	accept	155
A	target	The Defias Traitor
S	
A	goto	Westfall,42.56,71.71
A	complete	155,1
A	target	The Defias Traitor
S	
A	goto	Westfall,25.90,47.76
A	use	1357
A	accept	136
A	itemcount	1357,1
S	
A	goto	Westfall,25.90,47.76
A	turnin	136
A	itemcount	1357,1
S	
A	goto	Westfall,25.90,47.76
A	accept	138
A	isQuestTurnedIn	136
S	
A	goto	Westfall,40.51,47.80
A	turnin	138
A	accept	139
A	isQuestTurnedIn	136
S	
A	goto	Westfall,40.63,17.03
A	turnin	139
A	accept	140
A	isQuestTurnedIn	138
S	
T	completewith	next
A	goto	Westfall,25.97,16.90,30
A	isOnQuest	140
S	
A	goto	Westfall,25.97,16.90
A	turnin	140
A	isOnQuest	140
S	
A	goto	Westfall,56.33,47.52
A	turnin	155
A	target	Gryan Stoutmantle
S	
A	dungeon	DM
A	accept	166
A	target	+Gryan Stoutmantle
A	goto	Westfall,56.33,47.52
A	accept	214
A	goto	Westfall,56.67,47.35
A	target	+Scout Riell
S	
A	dungeon	DM
A	goto	Westfall,60.4,72.2
A	goto	Westfall,40.4,71.6
A	subzone	1581
S	
A	dungeon	DM
A	goto	Westfall,42.55,71.69
A	subzone	1581
S	
A	dungeon	DM
T	completewith	EnterDM
A	complete	214,1
S	
A	dungeon	DM
T	completewith	next
A	complete	168,1
A	mob	Skeletal Miner
A	mob	Undead Dynamiter
A	mob	Undead Excavator
S	
A	dungeon	DM
A	goto	1415,41.18,79.80,25,0
A	goto	1415,41.03,79.96,25,0
A	goto	1415,40.92,80.05,25,0
A	goto	1415,41.08,80.11
A	complete	167,1
A	unitscan	Foreman Thistlenettle
S	
A	dungeon	DM
A	goto	1415,41.18,79.80,25,0
A	goto	1415,41.03,79.96,25,0
A	goto	1415,40.92,80.05,25,0
A	goto	1415,41.08,80.11
A	complete	168,1
A	mob	Skeletal Miner
A	mob	Undead Dynamiter
A	mob	Undead Excavator
S	
A	dungeon	DM
T	label	EnterDM
A	goto	1415,40.94,79.76,25,0
A	goto	1415,40.86,79.62,20,0
A	goto	1415,40.678,79.578
A	subzone	1581,2
S	
A	dungeon	DM
T	completewith	DMend
A	complete	214,1
S	
A	dungeon	DM
A	complete	2040,1
S	
A	dungeon	DM
A	collect	2874,1,373
A	complete	166,1
A	accept	373
A	use	2874
S	
A	dungeon	DM
T	label	DMend
T	completewith	next
A	goto	Westfall,56.33,47.52,100
S	
A	dungeon	DM
A	turnin	166
A	target	+Gryan Stoutmantle
A	goto	Westfall,56.33,47.52
A	turnin	214
A	goto	Westfall,56.67,47.35
A	target	+Scout Riell
S	
A	dungeon	DM
T	completewith	next
A	goto	Westfall,56.55,52.64
A	fly	Stormwind
A	target	Thor
S	
A	dungeon	DM
A	target	Argos Nightwhisper
A	goto	StormwindClassic,21.40,55.80
A	accept	3765
S	
A	dungeon	DM
A	goto	StormwindClassic,45.694,38.416
A	accept	343
A	target	Brother Kristoff
A	xp	<20,1
S	
A	dungeon	DM
A	goto	StormwindClassic,48.079,30.913,10,0
A	goto	StormwindClassic,49.193,30.285
A	turnin	373
A	accept	389
A	target	Baros Alexston
S	
A	dungeon	DM
A	turnin	167
A	turnin	168
A	target	+Wilder Thistlenettle
A	goto	StormwindClassic,65.438,21.175
A	turnin	2040
A	goto	StormwindClassic,55.510,12.504
A	target	+Shoni the Shilent
S	
A	dungeon	DM
A	goto	StormwindClassic,45.694,38.416
A	accept	343
A	target	Brother Kristoff
A	xp	<20,1
S	
A	dungeon	DM
T	completewith	next
A	goto	StormwindClassic,70.439,27.097,15,0
A	goto	StormwindClassic,72.003,21.525,15,0
A	goto	StormwindClassic,70.713,10.717,15
A	xp	<20,1
S	
A	dungeon	DM
A	goto	StormwindClassic,74.182,7.465
A	turnin	343
A	accept	344
A	target	Milton Sheaf
A	xp	<20,1
S	
A	dungeon	DM
A	goto	StormwindClassic,42.435,59.236,10,0
A	goto	StormwindClassic,41.102,58.091
A	turnin	389
A	target	Warden Thelwater
S	
A	goto	Westfall,56.55,52.64
A	fly	Redridge
A	target	Thor
A	zoneskip	Westfall,1
S	
A	dungeon	DM
A	isQuestTurnedIn	343
T	completewith	next
A	goto	Elwynn Forest,32.240,49.723,60
A	xp	<20,1
S	
A	dungeon	DM
A	isQuestTurnedIn	343
A	goto	Elwynn Forest,41.71,65.55
A	target	Smith Argus
A	turnin	118
A	accept	119
A	xp	<20,1
S	
A	dungeon	DM
A	isQuestTurnedIn	343
T	completewith	next
A	goto	Elwynn Forest,45.81,47.73,20,0
A	goto	Elwynn Forest,48.61,41.80,15
A	xp	<20,1
S	
A	dungeon	DM
A	isQuestTurnedIn	343
A	goto	Elwynn Forest,49.60,40.41
A	turnin	344
A	accept	345
A	target	Brother Paxton
A	xp	<20,1
S	
A	dungeon	DM
A	isQuestTurnedIn	343
T	completewith	next
A	goto	Elwynn Forest,57.518,51.595,25,0
A	goto	Elwynn Forest,58.14,52.50,20,0
A	goto	Elwynn Forest,65.20,69.80,50
A	xp	<20,1
S	
A	dungeon	DM
A	isQuestTurnedIn	343
A	goto	Elwynn Forest,65.22,69.71
A	target	Theocritus
A	accept	94
A	xp	<20,1
S	
A	dungeon	DM
A	isQuestTurnedIn	343
A	goto	Elwynn Forest,64.880,69.192
A	vendor	
A	vendor	
A	target	Dawn Brightstar
A	subzoneskip	91,1
S	
A	dungeon	DM
A	isQuestTurnedIn	343
T	completewith	FlyR
A	goto	Redridge Mountains,6.7,72.4
A	zone	Redridge Mountains
A	zoneskip	Elwynn Forest,1
S	
A	goto	StormwindClassic,66.27,62.12,-1
A	fly	Redridge
A	target	Dungar Longdrink
A	zoneskip	Stormwind City,1
S	
A	target	Guard Parker
A	goto	Redridge Mountains,15.30,71.50
A	accept	244
S	
A	target	Guard Parker
A	goto	Redridge Mountains,15.27,71.45
A	turnin	129
A	accept	130
S	
A	target	Deputy Feldon
A	goto	Redridge Mountains,30.70,60.00
A	turnin	244
A	accept	246
S	
A	isQuestTurnedIn	343
A	goto	Redridge Mountains,32.13,48.63
A	turnin	345
A	target	Foreman Oslow
S	
A	isQuestTurnedIn	118
A	target	Verner Osgood
A	goto	Redridge Mountains,30.97,47.27
A	turnin	119
A	accept	124
A	accept	122
S	
T	era/som	
T	completewith	MongrelPoacher
A	collect	2296,5,92,1
A	mob	+Great Goretusk
A	collect	1080,5,92,1
A	mob	+Dire Condor
A	collect	1081,5,92,1
A	mob	+Tarantula
S	
A	isOnQuest	122
T	completewith	Toolbox
A	complete	122,1
A	mob	Black Dragon Whelp
S	
T	label	MongrelPoacher
A	goto	Redridge Mountains,15.91,62.76,0
A	goto	Redridge Mountains,43.44,70.61,0
A	goto	Redridge Mountains,29.49,82.80,45,0
A	goto	Redridge Mountains,32.52,81.78,45,0
A	goto	Redridge Mountains,43.18,72.22,45,0
A	goto	Redridge Mountains,31.13,82.18
A	complete	246,1
A	mob	+Redridge Mongrel
A	complete	246,2
A	mob	+Redridge Poacher
S	
T	era/som	
T	completewith	next
A	collect	2296,5,92,1
A	mob	+Great Goretusk
A	collect	1080,5,92,1
A	mob	+Dire Condor
S	
T	era/som	
A	goto	Redridge Mountains,21.22,67.77,45,0
A	goto	Redridge Mountains,17.70,73.39,45,0
A	goto	Redridge Mountains,11.20,76.31,45,0
A	goto	Redridge Mountains,13.37,81.48,45,0
A	goto	Redridge Mountains,18.86,73.63
A	collect	1081,5,92,1
A	mob	Tarantula
S	
T	era/som	
A	collect	1080,5,92,1
A	mob	+Dire Condor
A	goto	Redridge Mountains,66.4,76.6,60,0
A	goto	Redridge Mountains,35.6,69.6,60,0
A	goto	Redridge Mountains,45.4,76.6
A	goto	Redridge Mountains,35.6,69.6,0
A	collect	2296,5,92,1
A	goto	Redridge Mountains,15.73,52.83,60,0
A	goto	Redridge Mountains,32.25,70.20,60,0
A	goto	Redridge Mountains,31.02,72.14,60,0
A	goto	Redridge Mountains,15.73,52.83
A	mob	+Great Goretusk
S	
T	label	Toolbox
A	goto	Redridge Mountains,41.52,54.68
A	complete	125,1
S	
A	goto	Redridge Mountains,49.0,70.0
A	xp	20-3000
S	
T	completewith	next
A	goto	Redridge Mountains,30.73,59.99,150
S	
A	target	Foreman Oslow
A	goto	Redridge Mountains,32.13,48.63
A	turnin	125
A	accept	89
S	
T	era	
A	isQuestComplete	122
A	target	Verner Osgood
A	goto	Redridge Mountains,31.00,47.30
A	turnin	122
S	
A	target	Magistrate Solomon
A	goto	Redridge Mountains,29.31,45.33,15,0
A	goto	Redridge Mountains,29.98,44.45
A	turnin	121
S	
A	target	Martie Jainrose
A	goto	Redridge Mountains,21.86,46.33
A	turnin	130
A	accept	131
S	
T	era/som	
A	isQuestComplete	92
A	target	Chef Breanna
A	goto	Redridge Mountains,22.67,43.83
A	turnin	92
S	
A	target	Darcy
A	goto	Redridge Mountains,26.80,44.30
A	turnin	131
S	
A	target	Deputy Feldon
A	goto	Redridge Mountains,30.73,59.99
A	turnin	246
S	
A	xp	20
S	
A	goto	Redridge Mountains,30.59,59.42
A	target	Ariena Stormfeather
A	fly	Stormwind
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
S	Warlock
A	goto	StormwindClassic,25.25,78.59
A	accept	1716
A	target	Gakin the Darkbinder
S	Mage
T	completewith	next
A	goto	StormwindClassic,37.69,82.09,10
S	Mage
A	goto	StormwindClassic,36.87,81.14
A	trainer	
A	target	Elsharin
S	Mage
A	goto	StormwindClassic,39.68,79.55
A	train	3561
A	xp	<20,1
A	target	Larimaine Purdue
S	Druid
A	goto	StormwindClassic,20.89,55.50
A	trainer	
A	train	768
A	target	Sheldras Moontree
S	Rogue
T	ah	
A	goto	StormwindClassic,57.38,56.77
A	collect	923,1
A	target	Marda Weller
S	!Dwarf Rogue
T	ah	
A	goto	Stormwind City,53.612,59.764
A	collect	6452,1,2359,1
A	target	Auctioneer Jaxon
S	Rogue
T	hardcore	
A	goto	StormwindClassic,57.38,56.77
A	collect	923,1
A	target	Marda Weller
S	Warrior/Paladin
T	ah	
A	goto	StormwindClassic,57.54,57.07
A	collect	922,1
A	target	Gunther Weller
S	Warrior/Paladin
T	hardcore	
A	goto	StormwindClassic,57.54,57.07
A	collect	922,1
A	target	Gunther Weller
S	
A	target	Argos Nightwhisper
A	goto	StormwindClassic,21.40,55.80
A	accept	3765
S	
A	goto	StormwindClassic,45.694,38.416
A	accept	343
A	target	Brother Kristoff
S	Paladin/Priest
T	completewith	next
A	goto	StormwindClassic,42.51,33.51,20
S	Paladin
A	goto	StormwindClassic,39.80,29.77
A	use	6776
A	collect	6776,1,1649
A	accept	1649
A	target	Duthorian Rall
S	Paladin
A	goto	StormwindClassic,39.80,29.77
A	turnin	1649
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
T	completewith	next
A	goto	StormwindClassic,70.439,27.097,15,0
A	goto	StormwindClassic,72.003,21.525,15,0
A	goto	StormwindClassic,70.713,10.717,15
S	
A	goto	StormwindClassic,74.182,7.465
A	turnin	343
A	accept	344
A	target	Milton Sheaf
S	Hunter
A	goto	StormwindClassic,61.609,15.269
A	trainer	
A	target	Einris Brightspear
S	Rogue
A	goto	StormwindClassic,74.64,52.82
A	trainer	
A	train	1804
A	target	Osborne the Night Man
S	Rogue
T	completewith	next
A	goto	StormwindClassic,74.90,54.00,20,0
A	goto	StormwindClassic,78.43,60.15,20,0
A	goto	StormwindClassic,78.67,60.13,5
S	Rogue
A	accept	2281
A	target	+Renzik "The Shiv"
A	goto	StormwindClassic,75.76,60.35
A	accept	2360
A	goto	StormwindClassic,75.78,59.84
A	target	+Master Mathias Shaw
S	Warrior
A	goto	StormwindClassic,76.08,50.14,15,0
A	goto	StormwindClassic,80.22,45.37,15,0
A	goto	StormwindClassic,78.68,45.79
A	trainer	
A	target	Wu Shen
A	target	Ilsa Corbin
S	
T	completewith	next
A	goto	Elwynn Forest,32.240,49.723,60
S	
A	goto	Elwynn Forest,41.71,65.55
A	target	Smith Argus
A	turnin	118
A	accept	119
S	
T	completewith	next
A	goto	Elwynn Forest,45.81,47.73,20,0
A	goto	Elwynn Forest,48.61,41.80,15
S	
A	goto	Elwynn Forest,49.60,40.41
A	turnin	344
A	accept	345
A	target	Brother Paxton
S	
T	completewith	next
A	goto	Elwynn Forest,57.518,51.595,25,0
A	goto	Elwynn Forest,58.14,52.50,20,0
A	goto	Elwynn Forest,65.20,69.80,50
S	
A	goto	Elwynn Forest,65.22,69.71
A	target	Theocritus
A	accept	94
S	
A	goto	Elwynn Forest,64.880,69.192
A	vendor	
A	vendor	
A	target	Dawn Brightstar
A	subzoneskip	91,1
S	
T	completewith	TravelRM
A	goto	Redridge Mountains,6.7,72.4
A	zone	Redridge Mountains
A	zoneskip	Elwynn Forest,1
S	
A	goto	StormwindClassic,66.27,62.12,-1
A	fly	Redridge
A	target	Dungar Longdrink
A	zoneskip	Stormwind City,1
S	
A	target	Foreman Oslow
A	goto	Redridge Mountains,32.13,48.63
A	turnin	345
S	
A	target	Verner Osgood
A	goto	Redridge Mountains,30.97,47.27
A	turnin	119
A	accept	124
S	
T	era	
A	target	Verner Osgood
A	goto	Redridge Mountains,30.97,47.27
A	accept	122
S	Rogue
A	goto	Redridge Mountains,28.07,52.02
A	turnin	2281
A	target	Lucius
A	accept	2282
S	
T	era	
T	completewith	next
A	complete	122,1
A	mob	Black Dragon Whelp
S	
T	label	TravelRM
A	goto	Redridge Mountains,21.23,36.17,60,0
A	goto	Redridge Mountains,34.20,39.70,60,0
A	goto	Redridge Mountains,39.61,31.46,60,0
A	goto	Redridge Mountains,34.20,39.70,60,0
A	goto	Redridge Mountains,21.23,36.17,60,0
A	goto	Redridge Mountains,34.20,39.70,60,0
A	goto	Redridge Mountains,39.61,31.46,60,0
A	goto	Redridge Mountains,22.5,35.7,0
A	complete	124,1
A	mob	+Redridge Brute
A	complete	124,2
A	mob	+Redridge Mystic
A	complete	89,1
A	mob	+Redridge Mystic
A	mob	+Redridge Brute
A	complete	89,2
A	mob	+Redridge Mystic
A	mob	+Redridge Brute
S	Rogue
A	goto	Redridge Mountains,52.10,45.24
A	skill	lockpicking,80,1
S	Rogue
A	goto	Redridge Mountains,52.05,44.69
A	complete	2282,1
A	skill	lockpicking,<80,1
S	
T	era	
A	goto	Redridge Mountains,43.47,31.68,50,0
A	goto	Redridge Mountains,46.52,35.66,50,0
A	goto	Redridge Mountains,34.56,65.79,50,0
A	goto	Redridge Mountains,36.58,73.93
A	mob	Black Dragon Whelp
A	complete	122,1
S	
T	era	
T	completewith	next
A	goto	Redridge Mountains,15.55,50.06,0
A	goto	Redridge Mountains,19.24,41.53,0
A	goto	Redridge Mountains,16.90,55.02,0
A	goto	Redridge Mountains,26.52,44.95
A	skill	cooking,50,1
A	mob	Great Goretusk
S	
A	target	Foreman Oslow
A	goto	Redridge Mountains,32.10,48.70
A	turnin	89
S	
T	era	
A	target	Verner Osgood
A	goto	Redridge Mountains,31.00,47.30
A	turnin	124
A	turnin	122
S	
T	som	
A	target	Verner Osgood
A	goto	Redridge Mountains,30.97,47.27
A	turnin	124
S	Rogue
A	goto	Redridge Mountains,28.07,52.02
A	turnin	2282
A	target	Lucius
S	Rogue
T	sticky	
T	optional	
A	destroy	7907
S	NightElf Rogue
T	hardcore	
T	optional	
T	completewith	next
A	goto	Redridge Mountains,30.59,59.42
A	fly	Stormwind
A	target	Ariena Stormfeather
A	isOnQuest	2360
A	train	1856,3
S	NightElf Rogue
T	hardcore	
T	optional	
A	goto	Westfall,56.55,52.64,5,0
A	zone	Westfall
A	isOnQuest	2360
A	train	1856,3
S	NightElf Rogue
T	hardcore	
T	optional	
A	goto	Westfall,56.55,52.64
A	fp	Westfall
A	target	Thor
A	isOnQuest	2360
A	train	1856,3
S	!NightElf Rogue
T	hardcore	
T	optional	
A	goto	Redridge Mountains,30.59,59.42
A	fly	Westfall
A	target	Ariena Stormfeather
A	isOnQuest	2360
A	train	1856,3
S	!Dwarf Rogue
T	hardcore	
T	optional	
A	goto	Duskwood,15.90,72.10,60,0
A	goto	Duskwood,14.86,64.56,50,0
A	goto	Duskwood,10.43,53.97
A	collect	1475,1,2359,1
A	collect	2251,6,93,1,1
A	disablecheckbox	
A	mob	Pygmy Venom Web Spider
A	mob	Venom Web Spider
A	itemcount	6452,<1
A	isOnQuest	2360
A	train	1856,3
S	Rogue
T	hardcore	
T	optional	
T	completewith	TowerKey
A	train	1856,3
S	Rogue
T	hardcore	
T	optional	
A	goto	Westfall,68.50,70.08
A	turnin	2360
A	accept	2359
A	target	Agent Kearnen
A	isOnQuest	2360
A	train	1856,3
S	Rogue
T	hardcore	
T	optional	
A	goto	Westfall,68.50,70.08
A	accept	2359
A	target	Agent Kearnen
A	isQuestTurnedIn	2360
A	train	1856,3
S	Rogue
T	hardcore	
T	optional	
T	label	TowerKey
T	loop	
A	goto	Westfall,71.49,73.49,0
A	goto	Westfall,71.01,75.72,0
A	goto	Westfall,69.58,73.07,0
A	goto	Westfall,71.49,73.49,30,0
A	goto	Westfall,71.01,75.72,30,0
A	goto	Westfall,69.58,73.07,30,0
A	complete	2359,2
A	link	https://www.youtube.com/watch?v=5sIew15IcG0
A	mob	Malformed Defias Drone
A	isOnQuest	2359
A	train	1856,3
S	Rogue
T	hardcore	
T	optional	
T	completewith	Mortwake
A	use	15396
A	itemcount	15396,1
A	isOnQuest	2359
A	train	1856,3
S	Rogue
T	hardcore	
T	optional	
T	label	Mortwake
A	goto	1436,70.421,74.031
A	complete	2359,1
A	link	https://www.youtube.com/watch?v=5sIew15IcG0
A	mob	Defias Tower Patroller
A	mob	Defias Tower Sentry
A	isOnQuest	2359
A	train	1856,3
S	!Dwarf Rogue
T	hardcore	
T	optional	
T	sticky	
T	label	AntiVenomStart
A	collect	6452,1
A	aura	-9991
A	itemcount	6452,<1
A	train	7934,3
A	isQuestComplete	2359
S	!Dwarf Rogue
T	hardcore	
T	optional	
T	requires	AntiVenomStart
T	label	AntiVenomEnd
A	cast	7932
A	use	6452
A	aura	-9991
A	itemcount	6452,1
A	isQuestComplete	2359
S	Dwarf Rogue
T	hardcore	
T	optional	
T	sticky	
T	label	AntiVenomEnd2
A	cast	20594
A	aura	-9991
A	isQuestComplete	2359
S	Rogue
T	hardcore	
T	optional	
T	completewith	KlavenEnd
A	goto	Westfall,56.55,52.64
A	fly	Stormwind
A	target	Thor
A	isQuestComplete	2359
S	!Dwarf Rogue
T	hardcore	
T	optional	
T	requires	AntiVenomEnd
T	completewith	FirstAidEnd
A	goto	1453,42.938,33.878,20,0
A	goto	1453,41.544,31.330,20,0
A	goto	1453,41.688,28.049,20,0
A	goto	1453,43.070,26.155,15
A	aura	-9991
A	isQuestComplete	2359
S	!Dwarf Rogue
T	hardcore	
T	optional	
T	requires	AntiVenomEnd
A	goto	1453,43.070,26.155
A	skill	firstaid,80
A	aura	-9991
A	itemcount	6452,<1
A	isQuestComplete	2359
S	!Dwarf Rogue
T	hardcore	
T	optional	
T	label	FirstAidEnd
A	goto	1453,43.070,26.155
A	train	7934
A	aura	-9991
A	itemcount	6452,<1
A	isQuestComplete	2359
S	!Dwarf Rogue
T	hardcore	
T	optional	
T	sticky	
T	label	AntiVenomStart2
A	collect	6452,1
A	aura	-9991
A	itemcount	6452,<1
A	train	7934,3
A	isQuestComplete	2359
S	!Dwarf Rogue
T	hardcore	
T	optional	
T	sticky	
T	requires	AntiVenomStart2
T	label	AntiVenomEnd2
A	cast	7932
A	use	6452
A	aura	-9991
A	itemcount	6452,1
A	isQuestComplete	2359
S	Rogue
T	hardcore	
T	optional	
T	requires	AntiVenomEnd2 << Rogue
T	completewith	next
A	goto	StormwindClassic,74.90,54.00,20,0
A	goto	StormwindClassic,78.43,60.15,20,0
A	goto	StormwindClassic,78.67,60.13,5
A	isQuestComplete	2359
S	Rogue
T	hardcore	
T	optional	
T	label	KlavenEnd
T	requires	AntiVenomEnd2 << Rogue
A	goto	StormwindClassic,75.78,59.84
A	turnin	2359
A	target	Master Mathias Shaw
A	isQuestComplete	2359
E
G	Guides/SurvivalGuide/H-Classic-Horde-01-13_Durotar.lua
M	hardcore	
M	classic	
M	tbc	
M	selector	Horde
M	name	1-6 Orc/Troll
M	version	1
M	group	RestedXP Survival Guide (H)
M	subgroup	RXP Survival Guide 1-20
M	defaultfor	Troll/Orc
M	next	6-13 Orc/Troll
S	!Orc !Troll
T	completewith	next
S	
A	goto	Durotar,43.29,68.53
A	accept	4641
A	target	Kaltunk
S	Warrior/Shaman/Warlock
T	completewith	next
A	goto	Durotar,43.85,71.73,30,0 << Warlock
A	goto	Durotar,44.19,65.34,30,0 << Warrior/Shaman
A	mob	Mottled Boar
A	money	>0.01
S	Warlock
A	goto	Durotar,42.59,69.00
A	accept	1485
A	target	Ruzan
S	Warrior/Shaman
A	goto	Durotar,42.59,67.35
A	vendor	
A	target	Duokna
A	money	>0.01
S	
A	goto	Durotar,42.28,68.48,12,0 << !Warrior !Shaman
A	goto	Durotar,42.29,68.39,12,0 << Warrior/Shaman
A	goto	Durotar,42.06,68.32
A	turnin	4641
A	accept	788
A	target	Gornek
S	Warrior/Shaman
A	goto	Durotar,42.28,68.48,10,0
A	goto	Durotar,42.89,69.4 << Warrior
A	goto	Durotar,42.39,69.00 << Shaman
A	train	6673
A	train	8017
A	target	Frang << Warrior
A	target	Shikrik << Shaman
S	Warlock
T	completewith	next
A	goto	Durotar,41.52,68.36,12,0
A	goto	Durotar,41.24,68.16,12,0
A	goto	Durotar,40.82,68.03,12,0
A	goto	Durotar,40.56,68.44,12
S	Warlock
A	goto	Durotar,40.56,68.44
A	vendor	
A	target	Hraug
S	Warlock
T	label	Nartok
A	goto	Durotar,40.65,68.52
A	train	348
A	target	Nartok
S	!Warrior !Rogue
A	goto	Durotar,42.59,67.34
A	collect	159,30,6394,1 << !Hunter !Shaman
A	collect	2512,1000,6394,1 << Hunter
A	target	Duokna
A	money	<0.015 << !Hunter
A	money	<0.0040 << Hunter
S	Warlock
A	goto	Durotar,42.59,67.34
A	collect	159,5,6394,1
A	target	Duokna
A	money	<0.0025
S	Warlock
T	completewith	next
A	goto	Durotar,43.57,67.28,25,0
A	complete	788,1
A	mob	Mottled Boar
S	Warlock
A	goto	Durotar,45.30,56.42,100
A	isOnQuest	1485
S	Warlock
T	loop	
A	goto	Durotar,43.87,58.42,0
A	goto	Durotar,43.87,58.42,40,0
A	goto	Durotar,44.53,58.62,40,0
A	goto	Durotar,45.18,58.42,40,0
A	goto	Durotar,45.83,58.59,40,0
A	goto	Durotar,45.79,57.43,40,0
A	goto	Durotar,46.46,57.57,40,0
A	goto	Durotar,47.19,57.12,40,0
A	goto	Durotar,46.21,56.69,40,0
A	goto	Durotar,46.28,56.11,40,0
A	goto	Durotar,45.65,56.90,40,0
A	goto	Durotar,45.35,56.32,40,0
A	goto	Durotar,44.77,56.87,40,0
A	goto	Durotar,44.58,56.10,40,0
A	goto	Durotar,44.27,56.59,40,0
A	goto	Durotar,43.85,55.52,40,0
A	complete	1485,1
A	mob	Vile Familiar
S	
T	completewith	Sarkoth
A	goto	Durotar,43.57,67.28,35,0 << !Warlock
A	goto	Durotar,43.89,65.84,45,0 << !Warlock
A	complete	788,1
A	mob	Mottled Boar
S	
A	goto	Durotar,40.59,62.59
A	accept	790
A	target	Hana'zua
S	
T	label	Sarkoth
A	goto	Durotar,40.60,66.80
A	complete	790,1
A	mob	Sarkoth
S	
A	goto	Durotar,40.59,62.59
A	turnin	790
A	accept	804
A	target	Hana'zua
S	
T	loop	
A	goto	Durotar,41.30,65.03,0
A	goto	Durotar,41.30,65.03,40,0
A	goto	Durotar,41.92,64.74,40,0
A	goto	Durotar,42.66,64.92,40,0
A	goto	Durotar,43.31,65.02,40,0
A	goto	Durotar,43.90,65.96,40,0
A	goto	Durotar,44.54,65.96,40,0
A	goto	Durotar,45.16,65.77,40,0
A	goto	Durotar,45.72,65.93,40,0
A	goto	Durotar,45.72,65.04,40,0
A	goto	Durotar,45.21,63.95,40,0
A	goto	Durotar,45.83,63.01,40,0
A	goto	Durotar,45.81,62.17,40,0
A	goto	Durotar,45.78,61.14,40,0
A	goto	Durotar,45.15,60.20,40,0
A	goto	Durotar,44.50,59.45,40,0
A	goto	Durotar,43.86,60.43,40,0
A	goto	Durotar,43.07,60.24,40,0
A	goto	Durotar,42.58,60.09,40,0
A	goto	Durotar,42.02,61.19,40,0
A	goto	Durotar,42.02,62.15,40,0
A	goto	Durotar,42.00,62.92,40,0
A	goto	Durotar,41.99,64.03,40,0
A	complete	788,1
A	mob	Mottled Boar
S	!Warlock !Rogue !Mage
T	loop	
A	goto	Durotar,41.30,65.03,0
A	goto	Durotar,41.30,65.03,40,0
A	goto	Durotar,41.92,64.74,40,0
A	goto	Durotar,42.66,64.92,40,0
A	goto	Durotar,43.31,65.02,40,0
A	goto	Durotar,43.90,65.96,40,0
A	goto	Durotar,44.54,65.96,40,0
A	goto	Durotar,45.16,65.77,40,0
A	goto	Durotar,45.72,65.93,40,0
A	goto	Durotar,45.72,65.04,40,0
A	goto	Durotar,45.21,63.95,40,0
A	goto	Durotar,45.83,63.01,40,0
A	goto	Durotar,45.81,62.17,40,0
A	goto	Durotar,45.78,61.14,40,0
A	goto	Durotar,45.15,60.20,40,0
A	goto	Durotar,44.50,59.45,40,0
A	goto	Durotar,43.86,60.43,40,0
A	goto	Durotar,43.07,60.24,40,0
A	goto	Durotar,42.58,60.09,40,0
A	goto	Durotar,42.02,61.19,40,0
A	goto	Durotar,42.02,62.15,40,0
A	goto	Durotar,42.00,62.92,40,0
A	goto	Durotar,41.99,64.03,40,0
A	xp	3+1120
A	mob	Mottled Boar
S	Warlock
T	loop	
A	goto	Durotar,41.30,65.03,0
A	goto	Durotar,41.30,65.03,40,0
A	goto	Durotar,41.92,64.74,40,0
A	goto	Durotar,42.66,64.92,40,0
A	goto	Durotar,43.31,65.02,40,0
A	goto	Durotar,43.90,65.96,40,0
A	goto	Durotar,44.54,65.96,40,0
A	goto	Durotar,45.16,65.77,40,0
A	goto	Durotar,45.72,65.93,40,0
A	goto	Durotar,45.72,65.04,40,0
A	goto	Durotar,45.21,63.95,40,0
A	goto	Durotar,45.83,63.01,40,0
A	goto	Durotar,45.81,62.17,40,0
A	goto	Durotar,45.78,61.14,40,0
A	goto	Durotar,45.15,60.20,40,0
A	goto	Durotar,44.50,59.45,40,0
A	goto	Durotar,43.86,60.43,40,0
A	goto	Durotar,43.07,60.24,40,0
A	goto	Durotar,42.58,60.09,40,0
A	goto	Durotar,42.02,61.19,40,0
A	goto	Durotar,42.02,62.15,40,0
A	goto	Durotar,42.00,62.92,40,0
A	goto	Durotar,41.99,64.03,40,0
A	xp	3+760
A	mob	Mottled Boar
S	Warlock
T	completewith	Ruzan2
A	mob	Mottled Boar
A	money	>0.01
S	Warlock/Warrior/Shaman/Hunter
T	completewith	Ruzan2
A	mob	Mottled Boar
A	money	>0.02 << Warrior
A	money	>0.0175 << Warlock
A	money	>0.011 << Hunter
A	money	>0.01 << Shaman
S	Rogue
T	label	Duokna2
A	goto	Durotar,42.59,67.34
A	vendor	
A	target	Duokna
S	Warlock
T	label	Ruzan2
A	goto	Durotar,42.59,69.00
A	turnin	1485
A	accept	1499
A	target	Ruzan
S	Warlock
T	completewith	Gornek2
A	cast	688
S	Warlock
A	goto	Durotar,42.85,69.15
A	turnin	1499
A	accept	794
A	target	Zureetha Fargaze
S	
T	label	Gornek2
A	goto	Durotar,42.28,68.48,12,0 << Warlock
A	goto	Durotar,42.29,68.39,12,0 << !Warlock
A	goto	Durotar,42.06,68.32
A	turnin	788,2
A	turnin	788
A	accept	789
A	accept	2383
A	accept	3065
A	accept	3082
A	accept	3083
A	accept	3084
A	accept	3085
A	accept	3086
A	accept	3087
A	accept	3088
A	accept	3089
A	accept	3090
A	turnin	804,1
A	turnin	804
A	target	Gornek
S	Rogue
T	completewith	Rwag
A	goto	Durotar,41.52,68.36,12,0
A	goto	Durotar,41.27,68.00,12
S	Rogue
A	goto	Durotar,41.27,68.00
A	turnin	3083
A	turnin	3088
A	train	53
A	target	Rwag
A	money	<0.04
A	xp	<4,1
S	Rogue
T	label	Rwag
A	goto	Durotar,41.27,68.00
A	turnin	3083
A	turnin	3088
A	target	Rwag
S	Warlock
T	completewith	Nartok2
A	goto	Durotar,41.52,68.36,12,0
A	goto	Durotar,41.24,68.16,12,0
A	goto	Durotar,40.82,68.03,12,0
A	goto	Durotar,40.65,68.52,12
A	money	<0.01
S	Warlock
T	completewith	next
A	goto	Durotar,41.52,68.36,12,0
A	goto	Durotar,41.24,68.16,12,0
A	goto	Durotar,40.82,68.03,12,0
A	goto	Durotar,40.56,68.44,12
A	money	>0.01
S	Warlock
A	goto	Durotar,40.56,68.44
A	vendor	
A	target	Hraug
A	money	>0.01
S	Warlock
A	goto	Durotar,40.65,68.52
A	turnin	3090
A	train	172
A	target	Nartok
S	
T	label	Galgar
A	goto	Durotar,42.73,67.23,0,0
A	accept	4402
A	target	Galgar
S	!Rogue
A	goto	Durotar,42.59,67.34
A	collect	159,15,6394,1 << !Rogue !Warrior !Hunter
A	collect	2512,1000,6394,1 << Hunter
A	vendor	
A	target	Duokna
A	money	>0.1 << Warrior
A	itemcount	159,<15 << !Warrior !Hunter
S	Shaman
T	requires	Galgar
A	turnin	3084
A	turnin	3089
A	train	8042
A	goto	Durotar,42.39,69.00
A	accept	1516
A	goto	Durotar,42.40,69.17
A	target	Shikrik
A	target	Canaga Earthcaller
A	xp	<4,1
S	Shaman
T	requires	Galgar
A	goto	Durotar,42.39,69.00
A	turnin	3084
A	turnin	3089
A	target	Shikrik
S	Mage
T	requires	Galgar
A	goto	Durotar,42.51,69.04
A	turnin	3086
A	train	1459
A	target	Mai'ah
S	!Warlock
T	requires	Galgar
A	goto	Durotar,42.85,69.15
A	accept	792
A	target	Zureetha Fargaze
S	Hunter
A	goto	Durotar,42.84,69.32
A	turnin	3082
A	turnin	3087
A	train	1978
A	target	Jen'shan
A	xp	<4,1
S	Hunter
A	goto	Durotar,42.84,69.32
A	turnin	3082
A	turnin	3087
A	target	Jen'shan
S	Warrior
A	goto	Durotar,42.89,69.4
A	turnin	2383
A	turnin	3065
A	train	100
A	train	772
A	target	Frang
A	money	<0.02
A	xp	<4,1
S	Warrior
A	goto	Durotar,42.89,69.4
A	turnin	2383
A	turnin	3065
A	train	772
A	target	Frang
A	xp	<4,1
S	Warrior
A	goto	Durotar,42.89,69.4
A	turnin	2383
A	turnin	3065
A	target	Frang
S	
T	requires	Galgar << Warlock
A	goto	Durotar,44.63,68.65
A	accept	5441
A	target	Foreman Thazz'ril
S	
T	completewith	Sting
A	complete	4402,1
S	
T	completewith	Tails
A	goto	Durotar,44.98,69.13,45,0
A	goto	Durotar,45.64,65.70,45,0
A	goto	Durotar,47.37,65.67,45,0
A	complete	5441,1
A	target	Lazy Peon
A	use	16114
S	!Warlock
T	completewith	Imps
A	complete	789,1
A	mob	Scorpid Worker
S	!Warlock
T	label	Imps
T	loop	
A	goto	Durotar,43.87,58.42,0
A	goto	Durotar,43.87,58.42,40,0
A	goto	Durotar,44.53,58.62,40,0
A	goto	Durotar,45.18,58.42,40,0
A	goto	Durotar,45.83,58.59,40,0
A	goto	Durotar,45.79,57.43,40,0
A	goto	Durotar,46.46,57.57,40,0
A	goto	Durotar,47.19,57.12,40,0
A	goto	Durotar,46.21,56.69,40,0
A	goto	Durotar,46.28,56.11,40,0
A	goto	Durotar,45.65,56.90,40,0
A	goto	Durotar,45.35,56.32,40,0
A	goto	Durotar,44.77,56.87,40,0
A	goto	Durotar,44.58,56.10,40,0
A	goto	Durotar,44.27,56.59,40,0
A	goto	Durotar,43.85,55.52,40,0
A	complete	792,1
A	mob	Vile Familiar
S	
T	label	Tails
T	loop	
A	goto	Durotar,43.26,58.28,0
A	goto	Durotar,43.26,58.28,40,0
A	goto	Durotar,42.81,58.41,40,0
A	goto	Durotar,41.90,58.35,40,0
A	goto	Durotar,41.97,59.20,40,0
A	goto	Durotar,41.36,60.35,40,0
A	goto	Durotar,40.66,61.27,40,0
A	goto	Durotar,40.07,61.35,40,0
A	goto	Durotar,39.42,61.29,40,0
A	goto	Durotar,39.46,62.17,40,0
A	goto	Durotar,39.55,63.10,40,0
A	goto	Durotar,40.13,64.04,40,0
A	goto	Durotar,40.84,64.06,40,0
A	goto	Durotar,40.74,65.86,40,0
A	goto	Durotar,39.93,66.03,40,0
A	goto	Durotar,40.04,66.99,40,0
A	goto	Durotar,40.09,67.66,40,0
A	goto	Durotar,40.13,68.50,40,0
A	goto	Durotar,40.72,68.55,40,0
A	goto	Durotar,41.30,67.84,40,0
A	goto	Durotar,41.37,66.72,40,0
A	goto	Durotar,41.89,66.05,40,0
A	goto	Durotar,41.27,65.71,40,0
A	goto	Durotar,41.36,64.07,40,0
A	goto	Durotar,41.33,63.12,40,0
A	goto	Durotar,41.35,61.98,40,0
A	goto	Durotar,41.49,61.25,40,0
A	goto	Durotar,41.90,60.24,40,0
A	goto	Durotar,42.51,59.34,40,0
A	goto	Durotar,43.08,59.62,40,0
A	goto	Durotar,43.91,59.33,40,0
A	goto	Durotar,45.15,59.46,40,0
A	goto	Durotar,45.81,59.30,40,0
A	goto	Durotar,45.85,60.34,40,0
A	goto	Durotar,46.46,61.11,40,0
A	goto	Durotar,47.09,62.24,40,0
A	goto	Durotar,47.08,63.15,40,0
A	goto	Durotar,47.14,64.08,40,0
A	goto	Durotar,47.58,64.04,40,0
A	goto	Durotar,47.08,63.15,40,0
A	goto	Durotar,47.09,62.24,40,0
A	goto	Durotar,46.90,61.15,40,0
A	goto	Durotar,46.98,60.18,40,0
A	goto	Durotar,47.07,59.34,40,0
A	goto	Durotar,46.47,58.28,40,0
A	goto	Durotar,45.81,59.30,40,0
A	goto	Durotar,45.15,59.46,40,0
A	goto	Durotar,43.91,59.33,40,0
A	complete	789,1
A	mob	Scorpid Worker
S	
T	loop	
A	goto	Durotar,44.98,69.13,0
A	goto	Durotar,44.98,69.13,25,0
A	goto	Durotar,45.64,65.70,25,0
A	goto	Durotar,47.37,65.67,25,0
A	goto	Durotar,46.74,60.66,25,0
A	goto	Durotar,47.09,57.90,25,0
A	goto	Durotar,43.90,57.79,25,0
A	goto	Durotar,42.70,57.25,25,0
A	goto	Durotar,41.27,58.95,25,0
A	goto	Durotar,40.91,60.41,25,0
A	goto	Durotar,38.83,61.84,25,0
A	complete	5441,1
A	target	Lazy Peon
A	use	16114
S	
T	loop	
A	goto	Durotar,41.30,65.03,0
A	goto	Durotar,41.30,65.03,40,0
A	goto	Durotar,41.92,64.74,40,0
A	goto	Durotar,42.66,64.92,40,0
A	goto	Durotar,43.31,65.02,40,0
A	goto	Durotar,43.90,65.96,40,0
A	goto	Durotar,44.54,65.96,40,0
A	goto	Durotar,45.16,65.77,40,0
A	goto	Durotar,45.72,65.93,40,0
A	goto	Durotar,45.72,65.04,40,0
A	goto	Durotar,45.21,63.95,40,0
A	goto	Durotar,45.83,63.01,40,0
A	goto	Durotar,45.81,62.17,40,0
A	goto	Durotar,45.78,61.14,40,0
A	goto	Durotar,45.15,60.20,40,0
A	goto	Durotar,44.50,59.45,40,0
A	goto	Durotar,43.86,60.43,40,0
A	goto	Durotar,43.07,60.24,40,0
A	goto	Durotar,42.58,60.09,40,0
A	goto	Durotar,42.02,61.19,40,0
A	goto	Durotar,42.02,62.15,40,0
A	goto	Durotar,42.00,62.92,40,0
A	goto	Durotar,41.99,64.03,40,0
A	xp	4
A	mob	Mottled Boar
A	mob	Scorpid Worker
A	mob	Vile Familiar
S	
A	goto	Durotar,42.73,67.23
A	turnin	4402
A	target	Galgar
A	isQuestComplete	4402
S	
A	goto	Durotar,42.59,67.34
A	collect	159,5,6394,1 << !Rogue !Warrior !Hunter
A	collect	2512,1000,6394,1 << Hunter
A	vendor	
A	target	Duokna
A	money	>0.1 << Rogue/Warrior
A	itemcount	159,<5 << !Rogue !Warrior !Hunter
A	itemcount	2512,<600 << Hunter
S	
T	label	Sting
A	goto	Durotar,42.29,68.39,12,0
A	goto	Durotar,42.06,68.32
A	turnin	789,2
A	turnin	789
A	target	Gornek
S	Shaman
A	train	8042
A	goto	Durotar,42.39,69.00
A	accept	1516
A	goto	Durotar,42.40,69.17
A	target	Shikrik
A	target	Canaga Earthcaller
S	Mage
A	goto	Durotar,42.51,69.04
A	train	116,1
A	target	Mai'ah
S	Priest
A	goto	Durotar,42.36,68.81
A	train	589
A	money	<0.021
A	target	Ken'jai
S	Priest
A	goto	Durotar,42.36,68.81
A	train	1243
A	train	589
A	money	<0.011
A	target	Ken'jai
S	Priest
A	goto	Durotar,42.36,68.81
A	train	589,1
A	money	<0.01
A	target	Ken'jai
S	!Warlock
A	goto	Durotar,42.85,69.15
A	turnin	792
A	accept	794
A	target	Zureetha Fargaze
S	Hunter
A	goto	Durotar,42.84,69.32
A	train	1978,1
A	target	Jen'shan
S	Warrior
A	goto	Durotar,42.89,69.4
A	train	100
A	train	772
A	target	Frang
A	money	<0.02
S	Warrior
A	goto	Durotar,42.89,69.4
A	train	772
A	target	Frang
S	Warrior
A	goto	Durotar,42.89,69.4
A	train	100
A	target	Frang
A	money	<0.01
S	
A	goto	Durotar,44.63,68.65
A	turnin	5441
A	accept	6394
A	target	Foreman Thazz'ril
S	
T	completewith	next
A	xp	4+1720
A	mob	Mottled Boar
A	mob	Scorpid Worker
A	mob	Vile Familiar
A	isOnQuest	4402
S	
T	loop	
A	goto	Durotar,44.67,64.92,0
A	goto	Durotar,43.45,62.96,25,0
A	goto	Durotar,43.82,62.72,25,0
A	goto	Durotar,44.85,61.54,25,0
A	goto	Durotar,44.88,59.66,25,0
A	goto	Durotar,44.61,58.20,25,0
A	goto	Durotar,45.46,58.49,25,0
A	goto	Durotar,45.93,60.62,25,0
A	goto	Durotar,46.87,60.36,25,0
A	goto	Durotar,47.28,62.80,25,0
A	goto	Durotar,46.08,62.98,25,0
A	goto	Durotar,44.67,64.92,25,0
A	complete	4402,1
S	!Warrior !Rogue !Shaman
T	loop	
A	goto	Durotar,43.87,58.42,0
A	goto	Durotar,43.87,58.42,40,0
A	goto	Durotar,44.53,58.62,40,0
A	goto	Durotar,45.18,58.42,40,0
A	goto	Durotar,45.83,58.59,40,0
A	goto	Durotar,45.79,57.43,40,0
A	goto	Durotar,46.46,57.57,40,0
A	goto	Durotar,47.19,57.12,40,0
A	goto	Durotar,46.21,56.69,40,0
A	goto	Durotar,46.28,56.11,40,0
A	goto	Durotar,45.65,56.90,40,0
A	goto	Durotar,45.35,56.32,40,0
A	goto	Durotar,44.77,56.87,40,0
A	goto	Durotar,44.58,56.10,40,0
A	goto	Durotar,44.27,56.59,40,0
A	goto	Durotar,43.85,55.52,40,0
A	xp	4+1720
A	mob	Vile Familiar
A	isOnQuest	4402
S	!Warrior !Rogue !Shaman
T	loop	
A	goto	Durotar,43.87,58.42,40,0
A	goto	Durotar,44.53,58.62,40,0
A	goto	Durotar,45.18,58.42,40,0
A	goto	Durotar,45.83,58.59,40,0
A	goto	Durotar,45.79,57.43,40,0
A	goto	Durotar,46.46,57.57,40,0
A	goto	Durotar,47.19,57.12,40,0
A	goto	Durotar,46.21,56.69,40,0
A	goto	Durotar,46.28,56.11,40,0
A	goto	Durotar,45.65,56.90,40,0
A	goto	Durotar,45.35,56.32,40,0
A	goto	Durotar,44.77,56.87,40,0
A	goto	Durotar,44.58,56.10,40,0
A	goto	Durotar,44.27,56.59,40,0
A	goto	Durotar,43.85,55.52,40,0
A	xp	5
A	mob	Vile Familiar
A	isQuestTurnedIn	4402
S	
T	completewith	Thazz
T	label	Cave
A	goto	Durotar,45.35,56.27,30
A	isOnQuest	6394
S	Shaman
T	completewith	Yarrog
T	requires	Cave
A	complete	1516,1
A	mob	Felstalker
S	
T	label	Thazz
A	goto	Durotar,43.72,53.79
A	complete	6394,1
S	
T	completewith	next
A	goto	Durotar,44.43,54.51,15,0
A	goto	Durotar,44.77,53.3,15,0
A	goto	Durotar,43.88,52.71,15,0
A	goto	Durotar,43.39,52.07,15,0
A	goto	Durotar,42.90,52.34,15,0
A	goto	Durotar,42.70,52.99,35
S	
T	label	Yarrog
A	goto	Durotar,42.70,52.99
A	complete	794,1
A	mob	Yarrog Baneshadow
S	Shaman
T	loop	
A	goto	Durotar,42.70,52.99,0
A	goto	Durotar,42.70,52.99,25,0
A	goto	Durotar,42.97,51.14,25,0
A	goto	Durotar,43.56,52.05,25,0
A	goto	Durotar,43.74,52.65,25,0
A	goto	Durotar,44.13,52.85,25,0
A	goto	Durotar,44.82,52.51,25,0
A	goto	Durotar,44.83,53.40,25,0
A	goto	Durotar,44.78,54.57,25,0
A	goto	Durotar,45.14,55.02,25,0
A	goto	Durotar,45.51,55.23,25,0
A	goto	Durotar,45.14,55.02,25,0
A	goto	Durotar,44.51,55.03,25,0
A	goto	Durotar,44.21,54.12,25,0
A	goto	Durotar,43.92,54.30,25,0
A	goto	Durotar,43.87,55.22,25,0
A	goto	Durotar,43.46,55.56,25,0
A	goto	Durotar,43.05,55.24,25,0
A	goto	Durotar,42.38,54.22,25,0
A	goto	Durotar,42.53,53.48,25,0
A	goto	Durotar,43.27,53.82,25,0
A	complete	1516,1
A	mob	Felstalker
S	
T	optional	
T	loop	
A	goto	Durotar,42.70,52.99,25,0
A	goto	Durotar,42.97,51.14,25,0
A	goto	Durotar,43.56,52.05,25,0
A	goto	Durotar,43.74,52.65,25,0
A	goto	Durotar,44.13,52.85,25,0
A	goto	Durotar,44.82,52.51,25,0
A	goto	Durotar,44.83,53.40,25,0
A	goto	Durotar,44.78,54.57,25,0
A	goto	Durotar,45.14,55.02,25,0
A	goto	Durotar,45.51,55.23,25,0
A	goto	Durotar,45.14,55.02,25,0
A	goto	Durotar,44.51,55.03,25,0
A	goto	Durotar,44.21,54.12,25,0
A	goto	Durotar,43.92,54.30,25,0
A	goto	Durotar,43.87,55.22,25,0
A	goto	Durotar,43.46,55.56,25,0
A	goto	Durotar,43.05,55.24,25,0
A	goto	Durotar,42.38,54.22,25,0
A	goto	Durotar,42.53,53.48,25,0
A	goto	Durotar,43.27,53.82,25,0
A	xp	6
A	xp	5+1810
A	isQuestTurnedIn	4402
S	
T	optional	
T	loop	
A	goto	Durotar,42.70,52.99,25,0
A	goto	Durotar,42.97,51.14,25,0
A	goto	Durotar,43.56,52.05,25,0
A	goto	Durotar,43.74,52.65,25,0
A	goto	Durotar,44.13,52.85,25,0
A	goto	Durotar,44.82,52.51,25,0
A	goto	Durotar,44.83,53.40,25,0
A	goto	Durotar,44.78,54.57,25,0
A	goto	Durotar,45.14,55.02,25,0
A	goto	Durotar,45.51,55.23,25,0
A	goto	Durotar,45.14,55.02,25,0
A	goto	Durotar,44.51,55.03,25,0
A	goto	Durotar,44.21,54.12,25,0
A	goto	Durotar,43.92,54.30,25,0
A	goto	Durotar,43.87,55.22,25,0
A	goto	Durotar,43.46,55.56,25,0
A	goto	Durotar,43.05,55.24,25,0
A	goto	Durotar,42.38,54.22,25,0
A	goto	Durotar,42.53,53.48,25,0
A	goto	Durotar,43.27,53.82,25,0
A	xp	6
A	xp	5+1430
A	isQuestComplete	4402
S	skip
T	completewith	next
A	goto	Durotar,44.70,52.47
A	goto	Durotar,53.55,44.68,30
A	link	https://www.youtube.com/watch?v=7vmnvdjbUnM
S	skip
T	label	Betrayers
A	goto	Durotar,51.95,43.50
A	accept	784
A	target	Gar'thok
S	skip --Hunter
T	completewith	next
A	goto	Durotar,51.13,42.63
A	vendor	
A	target	Grimtak
S	skip
T	completewith	next
A	goto	Durotar,50.22,43.06,12,0
A	goto	Durotar,50.09,42.97,8,0
A	goto	Durotar,50.20,42.30,12,0
A	goto	Durotar,49.96,40.96,12,0
A	goto	Durotar,49.67,40.42,10
S	skip
T	completewith	next
A	goto	Durotar,49.75,40.38,6,0
A	goto	Durotar,49.77,40.24,6,0
A	goto	Durotar,49.69,40.21,6,0
A	goto	Durotar,49.68,40.30,6,0
A	goto	Durotar,49.78,40.34,6,0
A	goto	Durotar,49.79,39.96,6,0
A	goto	Durotar,49.60,40.04,8
S	skip
A	goto	Durotar,49.89,40.39
A	accept	791
A	target	Furl Scornbrow
S	skip --Warrior/Rogue
A	goto	Durotar,51.81,40.89
A	train	2575
A	target	Krunn
S	skip --Warrior/Rogue
A	goto	Durotar,51.90,41.14
A	collect	2901,1,9144,1
A	target	Wuark
S	skip --Warrior/Rogue
A	goto	Durotar,52.05,40.73
A	train	2018
A	target	Dwukk
A	skill	blacksmithing,1,1
S	
T	completewith	next
A	hs	
A	use	6948
S	
A	goto	Durotar,42.85,69.15
A	turnin	794
A	accept	805
A	target	Zureetha Fargaze
S	
A	goto	Durotar,42.73,67.23
A	turnin	4402
A	target	Galgar
S	
A	goto	Durotar,42.59,67.34
A	vendor	
A	target	Duokna
A	money	>0.03
S	Priest
A	goto	Durotar,42.36,68.81
A	accept	5649
A	train	591
A	train	17
A	target	Ken'jai
S	Mage
A	goto	Durotar,42.51,69.04
A	train	143
A	train	2136
A	target	Mai'ah
S	Shaman
A	train	332
A	target	+Shikrik
A	goto	Durotar,42.39,69.00
A	turnin	1516
A	accept	1517
A	target	+Canaga Earthcaller
A	goto	Durotar,42.40,69.17
A	xp	<6,1
S	Shaman
A	goto	Durotar,42.40,69.17
A	turnin	1516
A	accept	1517
A	target	Canaga Earthcaller
S	Hunter
A	goto	Durotar,42.84,69.32
A	train	1130
A	train	3044
A	target	Jen'shan
A	money	<0.02
S	Hunter
A	goto	Durotar,42.84,69.32
A	train	3044
A	target	Jen'shan
S	Warrior
A	goto	Durotar,42.89,69.4
A	train	3127
A	train	6343
A	target	Frang
A	money	<0.02
S	Warrior
A	goto	Durotar,42.89,69.4
A	train	3127
A	target	Frang
S	Rogue
T	completewith	Rwag2
A	goto	Durotar,42.13,68.41,15,0
A	goto	Durotar,41.52,68.36,12,0
A	goto	Durotar,41.27,68.00,12
S	Rogue
A	goto	Durotar,41.27,68.00
A	train	1757
A	train	1776
A	target	Rwag
A	money	<0.02
S	Rogue
A	goto	Durotar,41.27,68.00
A	train	1757
A	target	Rwag
S	Warlock
T	completewith	Hraug3
A	goto	Durotar,42.13,68.41,15,0
A	goto	Durotar,41.52,68.36,12,0
A	goto	Durotar,41.24,68.16,12,0
A	goto	Durotar,40.82,68.03,12,0
A	goto	Durotar,40.56,68.44,12
S	Warlock
T	label	Hraug3
A	goto	Durotar,40.56,68.44
A	collect	16321,1,817,1
A	vendor	
A	target	Hraug
A	money	<0.03
A	train	6307,1
S	Warlock
A	goto	Durotar,40.65,68.52
A	train	695
A	train	1454
A	target	Nartok
A	money	<0.02
S	Warlock
A	goto	Durotar,40.65,68.52
A	train	695
A	target	Nartok
S	Shaman
T	completewith	CallOE1
T	label	Shrine
A	goto	Durotar,43.36,69.60,25,0
A	goto	Durotar,43.18,70.93,25,0
A	goto	Durotar,41.31,73.63,12,0
A	goto	Durotar,40.82,74.37,8,0
A	goto	Durotar,42.71,75.18,10,0
A	goto	Durotar,43.57,75.51,15,0
A	goto	Durotar,44.13,76.36,25
A	isOnQuest	1517
S	Shaman
T	completewith	next
T	requires	Shrine
A	cast	8202
A	use	6635
S	Shaman
T	label	CallOE1
A	goto	Durotar,44.03,76.21
A	turnin	1517
A	accept	1518
A	target	Minor Manifestation of Earth
S	Shaman
A	goto	Durotar,42.40,69.17
A	turnin	1518
A	target	Canaga Earthcaller
S	Shaman
A	goto	Durotar,42.39,69.00
A	train	332
A	target	Shikrik
S	
A	goto	Durotar,44.63,68.65
A	turnin	6394
A	target	Foreman Thazz'ril
S	
T	label	Leave
T	completewith	next
A	goto	Durotar,47.09,69.21,25,0
A	goto	Durotar,49.02,69.13,20,0
A	goto	Durotar,49.90,68.43,25
A	isOnQuest	805
S	
A	goto	Durotar,52.06,68.30
A	accept	2161
A	target	Ukor
E
G	Guides/SurvivalGuide/H-Classic-Horde-01-13_Durotar.lua
M	hardcore	
M	classic	
M	tbc	
M	selector	Horde
M	name	6-13 Orc/Troll
M	version	1
M	group	RestedXP Survival Guide (H)
M	subgroup	RXP Survival Guide 1-20
M	defaultfor	Troll/Orc
M	next	13-15 Silverpine Forest
S	
T	loop	
A	goto	Durotar,54.20,73.36,0
A	goto	Durotar,54.09,76.31,25,0
A	goto	Durotar,54.52,74.83,25,0
A	goto	Durotar,54.20,73.36,25,0
A	accept	786
A	target	Lar Prowltusk
S	
T	label	SenjinPickups
A	accept	817
A	target	+Vel'rin Fang
A	goto	Durotar,55.95,73.93
A	accept	818
A	target	+Master Vornal
A	goto	Durotar,55.94,74.40
A	turnin	805
A	accept	808
A	accept	826
A	accept	823
A	target	+Master Gadrin
A	goto	Durotar,55.94,74.72
S	
T	completewith	next
A	goto	Durotar,56.16,74.43,8,0
A	goto	Durotar,56.31,73.8,8
S	Rogue
A	goto	Durotar,56.29,73.41
A	collect	3131,200,786,1
A	target	K'waii
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.9
S	Warlock/Mage/Priest
A	goto	Durotar,56.29,73.41
A	collect	159,20,786,1
A	target	K'waii
A	money	<0.010
S	Warlock/Mage/Priest
A	goto	Durotar,56.29,73.41
A	collect	159,10,786,1
A	target	K'waii
A	money	>0.001
A	money	<0.005
S	Shaman
A	goto	Durotar,56.47,73.12
A	vendor	
A	target	Trayexir
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Shaman
A	goto	Durotar,56.47,73.12
A	collect	2495,1,786,1
A	money	<0.0504
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Rogue
A	goto	Durotar,56.47,73.12
A	vendor	
A	target	Trayexir
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Rogue
A	goto	Durotar,56.47,73.12
A	collect	2494,1,786,1
A	money	<0.0401
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Orc Warrior
A	goto	Durotar,56.47,73.12
A	vendor	
A	target	Trayexir
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Orc Warrior
A	goto	Durotar,56.47,73.12
A	collect	2491,1,786,1
A	money	<0.0484
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Troll Warrior
A	goto	Durotar,56.47,73.12
A	vendor	
A	target	Trayexir
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.8
S	Troll Warrior
A	goto	Durotar,56.47,73.12
A	collect	2490,1,786,1
A	money	<0.0540
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.8
S	Hunter
A	goto	Durotar,56.47,73.12
A	vendor	
A	target	Trayexir
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.3
S	Hunter
A	goto	Durotar,56.47,73.12
A	collect	2506,1,786,1
A	money	<0.0283
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.3
S	Rogue
T	optional	
T	completewith	Bonfire
A	use	3131
A	itemcount	3131,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.9
S	Shaman
T	optional	
T	completewith	Bonfire
A	use	2495
A	itemcount	2495,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Rogue
T	optional	
T	completewith	Bonfire
A	use	2494
A	itemcount	2494,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Orc Warrior
T	optional	
T	completewith	Bonfire
A	use	2491
A	itemcount	2491,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Troll Warrior
T	optional	
T	completewith	Bonfire
A	use	2490
A	itemcount	2490,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.8
S	Hunter
T	optional	
T	completewith	Bonfire
A	use	2506
A	itemcount	2506,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.3
S	Mage
A	goto	Durotar,56.30,75.11
A	train	143
A	train	2136
A	target	Un'Thuwa
S	
T	completewith	next
A	goto	Durotar,58.54,75.89,40,0
A	goto	Durotar,57.73,77.91,40,0
A	goto	Durotar,55.72,79.62,40,0
A	goto	Durotar,54.23,82.26,40,0
A	goto	Durotar,52.20,83.00,40,0
A	complete	818,2,4
A	mob	+Pygmy Surf Crawler
A	mob	+Surf Crawler
A	complete	818,1,2
A	mob	+Makrura Shellhide
A	mob	+Makrura Clacker
S	
A	goto	Durotar,52.20,83.00,75
A	isOnQuest	818
S	
A	goto	Durotar,50.9,79.2,40
A	isOnQuest	786
S	Priest/Warlock
T	sticky	
T	label	Linen
T	completewith	HorrorsandSpirits
A	collect	2589,60
S	
T	sticky	
T	completewith	Bonfire
A	unitscan	Warlord Kolkanis
S	
A	goto	Durotar,49.8,81.2
A	complete	786,1
S	
A	goto	Durotar,47.7,77.4
A	complete	786,2
S	
T	label	Bonfire
A	goto	Durotar,46.3,79.0
A	complete	786,3
S	
T	completewith	next
A	goto	Durotar,50.95,79.14,30
A	isQuestComplete	786
S	
T	loop	
A	goto	Durotar,54.20,73.36,0
A	goto	Durotar,54.09,76.31,25,0
A	goto	Durotar,54.52,74.83,25,0
A	goto	Durotar,54.20,73.36,25,0
A	turnin	786,1
A	turnin	786
A	target	Lar Prowltusk
S	
T	optional	
A	goto	Durotar,55.95,74.39
A	turnin	818
A	target	Master Vornal
A	isQuestComplete	818
S	Warlock/Mage/Priest
A	goto	Durotar,56.29,73.41
A	collect	159,20,784,1
A	target	K'waii
A	money	<0.010
S	Warlock/Mage/Priest
A	goto	Durotar,56.29,73.41
A	collect	159,10,784,1
A	target	K'waii
A	money	<0.0050
S	Warrior/Rogue/Shaman
A	goto	Durotar,55.62,73.61
A	vendor	
A	collect	2287,10,823,1
A	money	<0.025
A	target	Hai'zan
S	Shaman
A	goto	Durotar,56.47,73.12
A	vendor	
A	target	Trayexir
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Shaman
A	goto	Durotar,56.47,73.12
A	collect	2495,1,823,1
A	money	<0.0504
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Rogue
A	goto	Durotar,56.47,73.12
A	vendor	
A	target	Trayexir
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Rogue
A	goto	Durotar,56.47,73.12
A	collect	2494,1,823,1
A	money	<0.0401
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Orc Warrior
A	goto	Durotar,56.47,73.12
A	vendor	
A	target	Trayexir
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Orc Warrior
A	goto	Durotar,56.47,73.12
A	collect	2491,1,823,1
A	money	<0.0484
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Troll Warrior
A	goto	Durotar,56.47,73.12
A	vendor	
A	target	Trayexir
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.8
S	Troll Warrior
A	goto	Durotar,56.47,73.12
A	collect	2490,1,823,1
A	money	<0.0540
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.8
S	Hunter
A	goto	Durotar,56.47,73.12
A	vendor	
A	target	Trayexir
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.3
S	Hunter
A	goto	Durotar,56.47,73.12
A	collect	2506,1,823,1
A	money	<0.0283
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.3
S	Rogue
T	optional	
T	completewith	TravelToTiragarde
A	use	3131
A	itemcount	3131,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.9
S	Shaman
T	optional	
T	completewith	TravelToTiragarde
A	use	2495
A	itemcount	2495,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Rogue
T	optional	
T	completewith	TravelToTiragarde
A	use	2494
A	itemcount	2494,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Orc Warrior
T	optional	
T	completewith	TravelToTiragarde
A	use	2491
A	itemcount	2491,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Troll Warrior
T	optional	
T	completewith	TravelToTiragarde
A	use	2490
A	itemcount	2490,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.8
S	Hunter
T	optional	
T	completewith	TravelToTiragarde
A	use	2506
A	itemcount	2506,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.3
S	
T	completewith	next
A	subzone	362
S	
T	label	Betrayers
A	goto	Durotar,51.95,43.50
A	accept	784
A	target	Gar'thok
S	Hunter
T	completewith	next
A	goto	Durotar,51.13,42.63
A	vendor	
A	target	Grimtak
S	
T	completewith	next
A	goto	Durotar,50.22,43.06,12,0
A	goto	Durotar,50.09,42.97,8,0
A	goto	Durotar,50.20,42.30,12,0
A	goto	Durotar,49.96,40.96,12,0
A	goto	Durotar,49.67,40.42,10
S	
T	completewith	next
A	goto	Durotar,49.75,40.38,6,0
A	goto	Durotar,49.77,40.24,6,0
A	goto	Durotar,49.69,40.21,6,0
A	goto	Durotar,49.68,40.30,6,0
A	goto	Durotar,49.78,40.34,6,0
A	goto	Durotar,49.79,39.96,6,0
A	goto	Durotar,49.60,40.04,8
S	
A	goto	Durotar,49.89,40.39
A	accept	791
A	target	Furl Scornbrow
S	Warrior/Rogue
A	goto	Durotar,51.81,40.89
A	target	Krunn
S	Warrior/Rogue
A	goto	Durotar,51.90,41.14
A	collect	2901,1,9144,1
A	target	Wuark
S	Warrior/Rogue
A	goto	Durotar,52.05,40.73
A	train	2018
A	target	Dwukk
A	skill	blacksmithing,1,1
S	Warrior/Rogue
T	completewith	TravelToTiragarde
A	collect	2862,1,786,1
A	skill	blacksmithing,<1,1
A	train	2575,3
S	
T	label	TravelToTiragarde
A	goto	Durotar,57.26,54.69,60,0
A	subzone	372
A	isOnQuest	784
S	
T	sticky	
T	completewith	AgedEnvelope
A	unitscan	Watch Commander Zalaphil
S	
T	completewith	Benedict
T	requires	TravelToTiragarde
A	goto	Durotar,59.81,58.22,8,0
A	goto	Durotar,59.64,58.44,8,0
A	goto	Durotar,59.55,57.89,8,0
A	goto	Durotar,59.29,57.89,8
S	
T	completewith	AgedEnvelope
A	complete	784,1
A	mob	+Kul Tiras Sailor
A	complete	784,2
A	mob	+Kul Tiras Marine
A	complete	791,1
A	mob	+Kul Tiras Marine
A	mob	+Kul Tiras Sailor
S	
T	label	Benedict
A	goto	Durotar,59.75,58.27
A	complete	784,3
A	collect	4882,1
A	mob	Lieutenant Benedict
S	
T	label	AgedEnvelope
A	goto	Durotar,59.87,57.87,5,0
A	goto	Durotar,59.83,57.58,5,0
A	goto	Durotar,59.80,57.82,5,0
A	goto	Durotar,59.94,57.82,5,0
A	goto	Durotar,59.94,57.61,5,0
A	goto	Durotar,59.27,57.65
A	collect	4881,1,830
A	accept	830
A	use	4881
S	
T	optional	
T	loop	
A	goto	Durotar,58.99,58.30,0
A	goto	Durotar,57.65,58.52,30,0
A	goto	Durotar,57.36,56.59,30,0
A	goto	Durotar,58.10,55.52,30,0
A	goto	Durotar,58.54,53.68,30,0
A	goto	Durotar,56.54,54.52,30,0
A	goto	Durotar,56.37,58.35,30,0
A	goto	Durotar,58.99,58.30,30,0
A	complete	784,1
A	mob	+Kul Tiras Sailor
A	complete	784,2
A	mob	+Kul Tiras Marine
A	complete	791,1
A	mob	+Kul Tiras Marine
A	mob	+Kul Tiras Sailor
A	itemcount	4870,<8
S	
T	loop	
A	goto	Durotar,58.99,58.30,0
A	goto	Durotar,57.65,58.52,30,0
A	goto	Durotar,57.36,56.59,30,0
A	goto	Durotar,58.10,55.52,30,0
A	goto	Durotar,58.54,53.68,30,0
A	goto	Durotar,56.54,54.52,30,0
A	goto	Durotar,56.37,58.35,30,0
A	goto	Durotar,58.99,58.30,30,0
A	complete	784,1
A	mob	+Kul Tiras Sailor
A	complete	784,2
A	mob	+Kul Tiras Marine
S	
T	label	ScrapsFinished
T	loop	
A	goto	Durotar,58.99,58.30,0
A	goto	Durotar,57.65,58.52,30,0
A	goto	Durotar,57.36,56.59,30,0
A	goto	Durotar,58.10,55.52,30,0
A	goto	Durotar,58.54,53.68,30,0
A	goto	Durotar,56.54,54.52,30,0
A	goto	Durotar,56.37,58.35,30,0
A	goto	Durotar,58.99,58.30,30,0
A	complete	791,1
A	mob	Kul Tiras Sailor
A	mob	Kul Tiras Marine
S	!Priest !Mage
T	loop	
A	goto	Durotar,59.02,50.24,50,0
A	goto	Durotar,57.93,47.71,50,0
A	goto	Durotar,59.20,44.30,50,0
A	goto	Durotar,57.96,42.46,50,0
A	goto	Durotar,56.47,43.45,50,0
A	goto	Durotar,55.50,48.97,50,0
A	xp	7+2200
S	Priest
T	loop	
A	goto	Durotar,59.02,50.24,50,0
A	goto	Durotar,57.93,47.71,50,0
A	goto	Durotar,59.20,44.30,50,0
A	goto	Durotar,57.96,42.46,50,0
A	goto	Durotar,56.47,43.45,50,0
A	goto	Durotar,55.50,48.97,50,0
A	xp	7+1750
S	
T	completewith	next
A	subzone	362
S	
A	turnin	823
A	accept	806
A	target	+Orgnil Soulscar
A	goto	Durotar,52.24,43.15
A	turnin	784
A	turnin	830
A	accept	825
A	accept	831
A	accept	837
A	target	+Gar'Thok
A	goto	Durotar,51.95,43.50
A	accept	815
A	target	+Cook Torka
A	goto	Durotar,51.09,42.49
A	group	
S	
A	turnin	823
A	target	+Orgnil Soulscar
A	goto	Durotar,52.24,43.15
A	turnin	784
A	turnin	830
A	accept	825
A	accept	831
A	accept	837
A	target	+Gar'Thok
A	goto	Durotar,51.95,43.50
A	accept	815
A	target	+Cook Torka
A	goto	Durotar,51.09,42.49
S	
T	completewith	next
A	goto	Durotar,50.22,43.06,12,0
A	goto	Durotar,50.09,42.97,8,0
A	goto	Durotar,50.20,42.30,12,0
A	goto	Durotar,49.96,40.96,12,0
A	goto	Durotar,49.67,40.42,10
S	
T	completewith	next
A	goto	Durotar,49.75,40.38,6,0
A	goto	Durotar,49.77,40.24,6,0
A	goto	Durotar,49.69,40.21,6,0
A	goto	Durotar,49.68,40.30,6,0
A	goto	Durotar,49.78,40.34,6,0
A	goto	Durotar,49.79,39.96,6,0
A	goto	Durotar,49.60,40.04,8
S	
A	goto	Durotar,49.89,40.39
A	turnin	791
A	target	Furl Scornbrow
S	Warrior/Rogue
A	goto	Durotar,51.81,40.89
A	train	2575
A	target	Krunn
S	Warrior/Rogue
A	goto	Durotar,51.90,41.14
A	collect	2901,1,9144,1
A	target	Wuark
S	Warrior/Rogue
A	goto	Durotar,52.05,40.73
A	train	2018
A	target	Dwukk
A	skill	blacksmithing,1,1
S	Shaman
A	goto	Durotar,52.02,40.46
A	vendor	
A	target	Uhgar
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Shaman
A	goto	Durotar,52.02,40.46
A	collect	2495,1,818,1
A	money	<0.0504
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Rogue
A	goto	Durotar,52.02,40.46
A	vendor	
A	target	Uhgar
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Rogue
A	goto	Durotar,52.02,40.46
A	collect	2494,1,818,1
A	money	<0.0401
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Orc Warrior
A	goto	Durotar,52.02,40.46
A	vendor	
A	target	Uhgar
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Orc Warrior
A	goto	Durotar,52.02,40.46
A	collect	2491,1,818,1
A	money	<0.0484
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Troll Warrior
A	goto	Durotar,52.02,40.46
A	vendor	
A	target	Uhgar
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.8
S	Troll Warrior
A	goto	Durotar,52.02,40.46
A	collect	2490,1,818,1
A	money	<0.0540
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.8
S	Rogue
T	optional	
T	completewith	Toolboxes
A	use	3131
A	itemcount	3131,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.9
S	Shaman
T	optional	
T	completewith	Toolboxes
A	use	2495
A	itemcount	2495,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Rogue
T	optional	
T	completewith	Toolboxes
A	use	2494
A	itemcount	2494,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Orc Warrior
T	optional	
T	completewith	Toolboxes
A	use	2491
A	itemcount	2491,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Troll Warrior
T	optional	
T	completewith	Toolboxes
A	use	2490
A	itemcount	2490,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.8
S	Hunter
A	goto	Durotar,52.97,41.04
A	vendor	
A	target	Ghrawt
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.3
S	Hunter
A	goto	Durotar,52.97,41.04
A	collect	2506,1,818,1
A	money	<0.0283
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.3
S	Hunter
T	optional	
T	completewith	Toolboxes
A	use	2506
A	itemcount	2506,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.3
S	Hunter
A	goto	Durotar,52.97,41.04
A	collect	2512,1000,818,1 << Hunter
A	target	Ghrawt
A	itemcount	2512,<600 << Hunter
S	
A	goto	Durotar,51.51,41.64
A	vendor	
A	home	
A	turnin	2161
A	target	Innkeeper Grosk
A	train	6760,1 << Rogue
A	train	139,1 << Priest
A	train	980,1 << Warlock
A	train	8044,1 << Shaman
A	train	284,1 << Warrior
A	bindlocation	362
S	!Mage !Hunter !Druid
T	optional	
A	goto	Durotar,51.51,41.64
A	vendor	
A	home	
A	turnin	2161
A	target	Innkeeper Grosk
A	train	6760,3 << Rogue
A	train	139,3 << Priest
A	train	980,3 << Warlock
A	train	8044,3 << Shaman
A	train	284,3 << Warrior
A	bindlocation	362
S	Warrior
A	goto	Durotar,54.18,42.46
A	train	284
A	target	Tarshaw Jaggedscar
S	Shaman
A	goto	Durotar,54.42,42.59
A	train	8044
A	target	Swart
S	Warlock
A	goto	Durotar,54.70,41.49
A	collect	16302,1,818,1
A	target	Kitha
A	money	<0.01
A	train	7799,1
S	Hunter
A	goto	Durotar,51.85,43.49
A	train	5116
A	target	Thotar
S	Rogue
A	goto	Durotar,51.98,43.69
A	train	6760
A	target	Kaplak
S	Troll Priest
A	goto	Durotar,54.26,42.93
A	turnin	5649
A	accept	5648
A	train	2052
A	target	Tai'jin
S	Troll Priest
A	goto	Durotar,53.10,46.46
A	complete	5648,1
A	target	Grunt Kor'ja
S	Priest
A	goto	Durotar,54.26,42.93
A	turnin	5648
A	trainer	
A	target	Tai'jin
S	
A	goto	Durotar,54.17,41.93
A	train	3273
A	money	<0.01
A	target	Rawrk
S	
A	goto	Durotar,54.39,42.18
A	collect	4496,1,818,1
A	target	Jark
A	money	<0.05
S	
T	completewith	next
A	complete	818,2
A	mob	+Pygmy Surf Crawler
A	mob	+Surf Crawler
A	complete	818,1
A	mob	+Makrura Shellhide
A	mob	+Makrura Clacker
S	
T	label	Tools
T	loop	
A	goto	Durotar,61.96,55.46,0
A	goto	Durotar,61.96,55.46,20,0
A	goto	Durotar,62.25,56.34,20,0
A	goto	Durotar,62.43,59.84,20,0
A	goto	Durotar,62.09,60.68,20,0
A	goto	Durotar,62.51,60.56,20,0
A	goto	Durotar,63.24,58.10,20,0
A	goto	Durotar,62.25,56.34,20,0
A	complete	825,1
S	
T	completewith	TaillasherEggs
A	goto	Durotar,67.10,69.29,100
S	
T	completewith	MinshinasSkull
A	complete	817,1
A	mob	Durotar Tiger
S	
T	completewith	next
A	complete	818,2
A	mob	+Pygmy Surf Crawler
A	mob	+Surf Crawler
A	complete	818,1
A	mob	+Makrura Shellhide
A	mob	+Makrura Clacker
S	
T	label	TaillasherEggs
T	loop	
A	goto	Durotar,67.04,71.40,0
A	goto	Durotar,70.23,70.84,0
A	goto	Durotar,67.04,71.40,40,0
A	goto	Durotar,67.66,73.86,40,0
A	goto	Durotar,68.67,74.47,40,0
A	goto	Durotar,69.76,74.69,40,0
A	goto	Durotar,70.29,73.31,40,0
A	goto	Durotar,70.23,70.84,40,0
A	goto	Durotar,69.69,70.35,40,0
A	goto	Durotar,69.21,69.69,40,0
A	goto	Durotar,67.74,69.86,40,0
A	complete	815,1
A	mob	Bloodtalon Taillasher
S	
T	completewith	next
A	complete	818,2
A	mob	+Pygmy Surf Crawler
A	mob	+Surf Crawler
A	complete	818,1
A	mob	+Makrura Shellhide
A	mob	+Makrura Clacker
S	
A	goto	Durotar,66.94,84.41,150
S	
T	completewith	ZalazaneKill
A	complete	826,1
A	mob	+Hexed Troll
A	complete	826,2
A	mob	+Voodoo Troll
S	
T	completewith	next
A	complete	826,3
A	mob	Zalazane
S	
T	label	MinshinasSkull
A	goto	Durotar,67.4,87.8
A	complete	808,1
S	
T	label	ZalazaneKill
A	goto	Durotar,67.4,87.8
A	complete	826,3
A	mob	Zalazane
S	
T	completewith	next
A	complete	817,1
A	mob	Durotar Tiger
S	
T	label	Fur
T	loop	
A	goto	Durotar,67.23,88.76,0
A	goto	Durotar,67.23,88.76,40,0
A	goto	Durotar,66.52,87.74,40,0
A	goto	Durotar,65.94,86.72,40,0
A	goto	Durotar,65.90,84.04,40,0
A	goto	Durotar,65.88,82.85,40,0
A	goto	Durotar,67.38,82.61,40,0
A	goto	Durotar,68.42,82.43,40,0
A	goto	Durotar,68.50,84.32,40,0
A	goto	Durotar,68.47,86.77,40,0
A	goto	Durotar,67.23,88.00,40,0
A	complete	826,1
A	mob	+Hexed Troll
A	complete	826,2
A	mob	+Voodoo Troll
S	
T	completewith	next
A	complete	818,2
A	mob	+Pygmy Surf Crawler
A	mob	+Surf Crawler
A	complete	818,1
A	mob	+Makrura Shellhide
A	mob	+Makrura Clacker
S	
T	loop	
A	goto	Durotar,59.79,83.44,0
A	goto	Durotar,65.27,87.86,50,0
A	goto	Durotar,64.72,88.53,50,0
A	goto	Durotar,64.70,84.89,50,0
A	goto	Durotar,64.68,80.80,50,0
A	goto	Durotar,65.35,80.11,50,0
A	goto	Durotar,65.87,81.23,50,0
A	goto	Durotar,60.28,80.04,50,0
A	goto	Durotar,60.60,82.26,50,0
A	goto	Durotar,59.88,83.51,50,0
A	goto	Durotar,59.56,84.86,50,0
A	goto	Durotar,60.84,88.79,50,0
A	goto	Durotar,61.41,89.69,50,0
A	goto	Durotar,61.48,91.37,50,0
A	goto	Durotar,60.37,91.36,50,0
A	goto	Durotar,59.04,90.51,50,0
A	goto	Durotar,59.79,83.44,50,0
A	complete	817,1
A	mob	Durotar Tiger
S	
T	loop	
A	goto	Durotar,59.64,73.84,0
A	goto	Durotar,59.64,73.84,60,0
A	goto	Durotar,58.11,77.30,60,0
A	goto	Durotar,57.27,79.38,60,0
A	goto	Durotar,55.66,80.47,60,0
A	goto	Durotar,53.8,83.14,60,0
A	complete	818,2
A	mob	+Pygmy Surf Crawler
A	mob	+Surf Crawler
A	complete	818,1
A	mob	+Makrura Shellhide
A	mob	+Makrura Clacker
S	
T	completewith	Zalazaneturnin
A	goto	Durotar,56.06,74.72,150
A	subzoneskip	367
S	
A	goto	Durotar,56.48,73.11
A	vendor	
A	target	Trayexir
A	isQuestAvailable	837
S	Mage
A	goto	Durotar,56.3,75.1
A	train	118
A	target	Un'Thuwa
S	
T	label	Zalazaneturnin
A	turnin	808
A	turnin	826,2
A	turnin	826
A	target	+Master Gadrin
A	goto	Durotar,55.95,74.73
A	turnin	818
A	target	+Master Vornal
A	goto	Durotar,55.95,74.39
A	turnin	817
A	target	+Vel'rin Fang
A	goto	Durotar,55.95,73.93
S	
T	completewith	Stolensupplies
S	
T	loop	
A	goto	Durotar,49.22,48.96,0
A	goto	Durotar,50.21,50.78,30,0
A	goto	Durotar,50.18,49.23,30,0
A	goto	Durotar,49.48,49.14,30,0
A	goto	Durotar,49.32,48.18,30,0
A	goto	Durotar,48.81,49.00,30,0
A	goto	Durotar,48.49,49.29,30,0
A	goto	Durotar,47.58,49.62,30,0
A	goto	Durotar,47.06,49.53,30,0
A	goto	Durotar,46.90,48.11,30,0
A	goto	Durotar,49.22,48.96,30,0
A	complete	837,1
A	mob	+Razormane Quilboar
A	complete	837,2
A	mob	+Razormane Scout
S	Shaman/Hunter
T	loop	
A	goto	Durotar,44.45,39.74,0
A	goto	Durotar,44.45,39.74,50,0
A	goto	Durotar,44.49,37.47,50,0
A	goto	Durotar,43.30,37.32,50,0
A	goto	Durotar,41.70,37.09,50,0
A	goto	Durotar,41.64,38.27,50,0
A	goto	Durotar,41.94,40.46,50,0
A	goto	Durotar,43.30,40.40,50,0
A	complete	837,3
A	mob	+Razormane Dustrunner
A	complete	837,4
A	mob	+Razormane Battleguard
S	Shaman/Hunter
T	loop	
A	goto	Durotar,47.52,48.67,0
A	goto	Durotar,47.52,48.67,50,0
A	goto	Durotar,46.12,45.47,50,0
A	goto	Durotar,43.65,43.91,50,0
A	goto	Durotar,41.68,44.69,50,0
A	goto	Durotar,41.00,46.13,50,0
A	goto	Durotar,42.47,48.50,50,0
A	goto	Durotar,44.21,49.68,50,0
A	goto	Durotar,47.17,49.44,50,0
A	xp	9+4470
S	
T	completewith	next
A	goto	Durotar,51.12,42.46,150
S	Shaman/Hunter
A	turnin	815
A	target	+Cook Torka
A	goto	Durotar,51.12,42.46
A	turnin	825
A	turnin	837
A	target	+Gar'Thok
A	goto	Durotar,51.95,43.50
S	!Shaman !Hunter
A	turnin	815
A	target	+Cook Torka
A	goto	Durotar,51.12,42.46
A	turnin	825
A	target	+Gar'Thok
A	goto	Durotar,51.95,43.50
S	Hunter
A	goto	Durotar,51.85,43.49
A	accept	6062
A	trainer	
A	target	Thotar
S	Hunter
A	goto	Durotar,52.97,41.04
A	collect	2515,1200,837,1 << Hunter
A	target	Ghrawt
A	itemcount	2515,<600 << Hunter
S	
A	goto	Durotar,54.17,41.93
A	train	3273
A	target	Rawrk
S	Warrior
A	goto	Durotar,54.18,42.46
A	train	6546
A	target	Tarshaw Jaggedscar
A	xp	<10,1
S	Shaman
A	goto	Durotar,54.42,42.59
A	train	8050
A	accept	2983
A	target	Swart
A	isNotOnQuest	1522
S	Shaman
A	goto	Durotar,54.42,42.59
A	train	8050
A	target	Swart
S	Warlock
A	goto	Durotar,54.37,41.20
A	train	1120
A	target	Dhugru Gorelust
A	xp	<10,1
S	Warlock
A	goto	Durotar,54.70,41.49
A	collect	16302,1,837,1
A	target	Kitha
A	money	<0.01
A	train	7799,1
S	Rogue
A	goto	Durotar,51.98,43.69
A	train	674
A	target	Kaplak
A	xp	<10,1
S	Priest
A	goto	Durotar,54.26,42.93
A	accept	5654
A	accept	5660
A	trainer	
A	target	Tai'jin
A	xp	<10,1
S	Hunter
T	loop	
A	goto	Durotar,51.65,56.51,0
A	goto	Durotar,51.76,48.41,40,0
A	goto	Durotar,51.70,50.23,40,0
A	goto	Durotar,51.65,51.34,40,0
A	goto	Durotar,51.80,53.18,40,0
A	goto	Durotar,50.82,53.65,40,0
A	use	15917
A	complete	6062,1
A	mob	Dire Mottled Boar
S	Hunter
A	goto	Durotar,51.85,43.49
A	turnin	6062
A	accept	6083
A	target	Thotar
S	Hunter
T	loop	
A	goto	Durotar,59.63,23.38,0
A	goto	Durotar,59.18,28.35,40,0
A	goto	Durotar,59.89,26.42,40,0
A	goto	Durotar,60.04,24.79,40,0
A	use	15919
A	complete	6083,1
A	mob	Surf Crawler
S	Hunter
A	goto	Durotar,51.85,43.49
A	turnin	6083
A	accept	6082
A	target	Thotar
S	Hunter
T	loop	
A	goto	Durotar,54.84,36.94,0
A	goto	Durotar,54.84,36.94,40,0
A	goto	Durotar,54.01,33.81,40,0
A	goto	Durotar,54.22,30.50,40,0
A	goto	Durotar,55.71,30.66,40,0
A	goto	Durotar,56.19,29.28,40,0
A	goto	Durotar,56.95,27.28,40,0
A	goto	Durotar,57.15,25.59,40,0
A	use	15920
A	complete	6082,1
A	mob	Armored Scorpid
S	Hunter
A	goto	Durotar,51.85,43.49
A	turnin	6082
A	accept	6081
A	target	Thotar
S	Hunter
A	goto	Durotar,51.13,42.63
A	vendor	
A	collect	117,5,828,1
A	target	Grimtak
S	
T	optional	
A	goto	Durotar,50.8,43.6
A	accept	840
A	target	Takrin Pathseeker
A	xp	<10,1
S	
T	loop	
A	goto	Durotar,44.45,39.74,0
A	goto	Durotar,44.45,39.74,50,0
A	goto	Durotar,44.49,37.47,50,0
A	goto	Durotar,43.30,37.32,50,0
A	goto	Durotar,41.70,37.09,50,0
A	goto	Durotar,41.64,38.27,50,0
A	goto	Durotar,41.94,40.46,50,0
A	goto	Durotar,43.30,40.40,50,0
A	complete	837,3
A	mob	+Razormane Dustrunner
A	complete	837,4
A	mob	+Razormane Battleguard
S	Shaman
T	completewith	next
A	zone	The Barrens
A	zoneskip	The Barrens
S	Shaman
A	goto	The Barrens,62.27,19.38
A	turnin	840
A	accept	842
A	target	Kargal Battlescar
S	Shaman
A	goto	The Barrens,55.86,19.95
A	turnin	2983
A	accept	1524
A	target	Kranal Fiss
S	Shaman
T	completewith	CallofFire2
A	zone	Durotar
A	zoneskip	Durotar
S	Shaman
T	completewith	next
A	goto	Durotar,36.74,57.78,10,0
A	goto	Durotar,36.63,58.15,8,0
A	goto	Durotar,36.63,58.15,8,0
A	goto	Durotar,36.77,58.98,8,0
A	goto	Durotar,36.85,58.32,8,0
A	goto	Durotar,37.24,58.13,8,0
A	goto	Durotar,37.86,58.18,8,0
A	goto	Durotar,38.05,57.79,8,0
A	goto	Durotar,38.93,57.54,8,0
A	goto	Durotar,39.19,57.90,8,0
A	goto	Durotar,39.16,58.56,10
S	Shaman
T	label	CallofFire2
A	goto	Durotar,38.52,58.93
A	turnin	1524
A	accept	1525
A	target	Telf Joolam
S	Shaman
T	completewith	next
A	goto	Durotar,39.13,58.63,10,0
A	goto	Durotar,39.17,57.93,10,0
A	goto	Durotar,38.95,57.58,8,0
A	goto	Durotar,38.61,57.67,8,0
A	goto	Durotar,38.06,57.78,8,0
A	goto	Durotar,37.76,58.19,8,0
A	goto	Durotar,36.96,58.07,15
S	Shaman
T	completewith	next
A	zone	The Barrens
A	zoneskip	The Barrens
S	Shaman
T	loop	
A	goto	The Barrens,53.57,25.51,0
A	goto	The Barrens,54.97,25.23,50,0
A	goto	The Barrens,54.2,24.60,50,0
A	goto	The Barrens,53.57,25.51,50,0
A	complete	1525,1
A	mob	Razormane Water Seeker
A	mob	Razormane Thornweaver
S	Shaman
T	completewith	next
A	goto	The Barrens,52.34,29.27,150
S	Shaman
A	accept	6365
A	target	+Zargh
A	goto	The Barrens,52.62,29.84
A	turnin	842
A	accept	844
A	target	+Sergra Darkthorn
A	goto	The Barrens,52.23,31.00
A	accept	871
A	accept	5041
A	target	+Thork
A	goto	The Barrens,51.50,30.87
A	accept	869
A	target	+Gazrog
A	goto	The Barrens,51.93,30.32
S	Shaman
A	goto	The Barrens,51.50,30.34
A	turnin	6365
A	accept	6384
A	target	Devrak
S	Shaman
T	completewith	NeedforaCureAccept
A	goto	The Barrens,51.50,30.34
A	fly	Orgrimmar
A	target	Devrak
A	zoneskip	Orgrimmar
S	Shaman
A	goto	Orgrimmar,47.54,68.39
A	collect	854,1,398,1
A	money	<0.3022
A	target	Zendo'jian
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.4
S	Shaman
T	optional	
T	completewith	NeedforaCureAccept
A	use	854
A	itemcount	854,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.4
S	Shaman
T	label	Gryhskaturnin1
A	goto	Orgrimmar,54.097,68.407
A	turnin	6384
A	accept	6385
A	target	Innkeeper Gryshka
S	Shaman
A	goto	Orgrimmar,45.120,63.889
A	turnin	6385
A	accept	6386
A	target	Doras
S	Shaman
T	label	LeaveOrg
T	completewith	next
A	zone	Durotar
A	zoneskip	Durotar
S	Shaman
T	label	NeedforaCureAccept
A	goto	Durotar,41.54,18.59
A	accept	812
A	target	Rhinag
S	Hunter
A	goto	Durotar,43.11,30.24
A	accept	816
A	target	Misha Tor'kren
S	
T	label	Stolensupplies
T	loop	
A	goto	Durotar,49.05,22.49,0
A	goto	Durotar,47.34,33.38,30,0
A	goto	Durotar,47.92,33.10,30,0
A	goto	Durotar,49.11,33.11,30,0
A	goto	Durotar,48.53,32.00,30,0
A	goto	Durotar,47.36,30.98,30,0
A	goto	Durotar,47.14,29.68,30,0
A	goto	Durotar,46.49,34.67,30,0
A	goto	Durotar,50.13,32.35,30,0
A	goto	Durotar,49.78,28.26,30,0
A	goto	Durotar,50.83,25.94,30,0
A	goto	Durotar,49.68,24.38,30,0
A	goto	Durotar,49.05,22.49,30,0
A	complete	834,1
A	isOnQuest	834
S	!Hunter
T	completewith	next
A	goto	Durotar,46.37,22.94,50
S	!Hunter
A	goto	Durotar,46.37,22.94
A	accept	834
A	target	Rezlak
S	!Hunter
T	loop	
A	goto	Durotar,49.70,21.90,0
A	goto	Durotar,49.70,21.90,40,0
A	goto	Durotar,49.70,24.33,40,0
A	goto	Durotar,50.13,25.70,40,0
A	goto	Durotar,50.85,25.96,40,0
A	goto	Durotar,51.65,27.67,40,0
A	goto	Durotar,49.85,27.07,40,0
A	goto	Durotar,50.68,31.55,40,0
A	goto	Durotar,48.10,34.36,40,0
A	goto	Durotar,47.35,33.40,40,0
A	goto	Durotar,48.49,32.01,40,0
A	goto	Durotar,47.19,30.87,40,0
A	complete	834,1
S	!Hunter
A	goto	Durotar,46.37,22.94
A	turnin	834
A	accept	835
A	target	Rezlak
S	Hunter
A	goto	Durotar,41.54,18.59
A	accept	812
A	target	Rhinag
S	Hunter
T	completewith	BeastTraining
A	goto	Orgrimmar,48.97,92.84,50,0
A	zone	Orgrimmar
A	zoneskip	Orgrimmar
S	Hunter
A	goto	Orgrimmar,32.28,35.80
A	turnin	831
A	target	Nazgrel
S	Hunter
A	goto	Orgrimmar,47.24,53.58
A	accept	813
A	target	Kor'ghan
A	isOnQuest	812
S	Hunter
T	completewith	BeastTraining
A	abandon	812
A	isOnQuest	812
S	Hunter
T	completewith	next
A	goto	Orgrimmar,68.02,38.69,30
S	Hunter
T	label	BeastTraining
A	goto	Orgrimmar,66.05,18.52
A	turnin	6081
A	target	Ormak Grimshot
S	Hunter
A	goto	Orgrimmar,66.34,14.83
A	train	24547
A	target	Xao'tsu
S	Hunter
T	completewith	Rezlak
S	Hunter
A	goto	Orgrimmar,81.17,18.69
A	collect	2507,1,835,1
A	money	<0.1751
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<5.7
A	target	Zendo'jian
S	Hunter
T	optional	
T	completewith	Rezlak
A	use	2507
A	itemcount	2507,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<5.7
S	Hunter
T	label	HuntLeaveOrg
T	completewith	next
A	zone	Durotar
A	zoneskip	Durotar
S	Hunter
T	completewith	Rezlak
A	goto	Durotar,43.8,17.20,40,0
A	goto	Durotar,43.53,18.35,40,0
A	goto	Durotar,42.19,19.70,40,0
A	goto	Durotar,41.08,20.42,40,0
A	goto	Durotar,42.76,21.08,40,0
A	goto	Durotar,40.44,17.51,40,0
A	mob	Venomtail Scorpid
A	mob	Bloodtalon Scythemaw
S	Hunter
T	completewith	next
A	goto	Durotar,46.37,22.94,50
S	Hunter
T	label	Rezlak
A	goto	Durotar,46.37,22.94
A	accept	834
A	target	Rezlak
S	Hunter
T	loop	
A	goto	Durotar,49.70,21.90,0
A	goto	Durotar,49.70,21.90,40,0
A	goto	Durotar,49.70,24.33,40,0
A	goto	Durotar,50.13,25.70,40,0
A	goto	Durotar,50.85,25.96,40,0
A	goto	Durotar,51.65,27.67,40,0
A	goto	Durotar,49.85,27.07,40,0
A	goto	Durotar,50.68,31.55,40,0
A	goto	Durotar,48.10,34.36,40,0
A	goto	Durotar,47.35,33.40,40,0
A	goto	Durotar,48.49,32.01,40,0
A	goto	Durotar,47.19,30.87,40,0
A	complete	834,1
S	Hunter
A	goto	Durotar,46.37,22.94
A	turnin	834
A	accept	835
A	target	Rezlak
S	
T	completewith	next
A	goto	Durotar,53.41,27.81,15
A	solo	
S	
T	loop	
A	goto	Durotar,53.98,23.70,0
A	goto	Durotar,54.02,27.23,40,0
A	goto	Durotar,52.82,24.27,40,0
A	goto	Durotar,51.85,23.95,40,0
A	goto	Durotar,54.01,23.63,40,0
A	goto	Durotar,52.13,20.77,40,0
A	goto	Durotar,51.26,19.19,40,0
A	goto	Durotar,53.98,23.70,40,0
A	complete	835,1
A	mob	+Dustwind Savage
A	complete	835,2
A	mob	+Dustwind Storm Witch
A	solo	
S	Troll Warrior/Undead Warrior
T	completewith	next
A	solo	
S	
A	goto	Durotar,46.37,22.94
A	turnin	835
A	target	Rezlak
A	solo	
S	Shaman
A	goto	Durotar,43.11,30.24
A	accept	816
A	target	Misha Tor'kren
S	
T	completewith	next
A	goto	Durotar,44.72,24.86,40,0
A	goto	Durotar,42.28,25.45,30,0
A	goto	Durotar,41.66,25.68,20
A	cast	2641
A	group	
S	
A	goto	Durotar,42.13,26.67
A	complete	806,1
A	mob	Fizzle Darkstorm
A	mob	Imp Minion
A	mob	Burning Blade Fanatic
A	mob	Lightning Hide
A	group	2
S	
A	hs	
A	isQuestComplete	806
A	use	6948
A	subzoneskip	362
A	bindlocation	362,1
A	group	
S	Shaman
A	hs	
A	use	6948
A	subzoneskip	362
A	bindlocation	362,1
A	solo	
S	
A	goto	Durotar,51.51,41.64
A	vendor	
A	collect	1179,15,818,1 << Mage/Warlock/Priest/Shaman
A	collect	2287,15,818,1 << Rogue/Warrior
A	target	Innkeeper Grosk
A	money	<0.0375
A	group	
S	Shaman
A	goto	Durotar,51.51,41.64
A	vendor	
A	collect	1179,15,818,1 << Mage/Warlock/Priest/Shaman
A	collect	2287,15,818,1 << Rogue/Warrior
A	target	Innkeeper Grosk
A	money	<0.0375
S	
A	goto	Durotar,52.24,43.15
A	turnin	806
A	accept	828
A	target	Orgnil Soulscar
A	isQuestComplete	806
A	group	
S	
T	optional	
A	goto	Durotar,52.24,43.15
A	accept	828
A	target	Orgnil Soulscar
A	isQuestTurnedIn	806
A	group	
S	!Shaman
A	goto	Durotar,51.95,43.50
A	turnin	837
A	target	Gar'Thok
A	group	
S	Shaman
A	goto	Durotar,51.95,43.50
A	turnin	837
A	target	Gar'Thok
S	Warrior
A	goto	Durotar,54.18,42.46
A	train	6546
A	target	Tarshaw Jaggedscar
A	group	
S	Shaman
A	goto	Durotar,54.42,42.59
A	train	8050
A	target	Swart
S	Warlock
A	goto	Durotar,54.37,41.20
A	train	1120
A	target	Dhugru Gorelust
A	group	
S	Hunter
A	goto	Durotar,51.85,43.49
A	train	13549
A	target	Thotar
A	group	
S	Rogue
A	goto	Durotar,51.98,43.69
A	train	674
A	target	Kaplak
A	group	
S	Priest
A	goto	Durotar,54.26,42.93
A	train	8092
A	target	Tai'jin
A	group	
S	Hunter
A	goto	Durotar,52.97,41.04
A	vendor	
A	target	Ghrawt
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<5.7
A	group	
S	Hunter
A	goto	Durotar,52.97,41.04
A	collect	2507,1,828,1
A	money	<0.1751
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<5.7
A	group	
S	Hunter
A	goto	Durotar,52.97,41.04
A	collect	2515,1200,828,1 << Hunter
A	target	Ghrawt
A	itemcount	2515,<600 << Hunter
A	group	
S	Hunter
T	optional	
T	completewith	MargozTurnIn
A	use	2507
A	itemcount	2507,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<5.7
A	group	
S	
T	completewith	next
A	goto	Durotar,55.40,36.73,80,0
A	goto	Durotar,56.07,30.05,80,0
A	goto	Durotar,56.41,20.04,50
A	isQuestTurnedIn	806
A	group	
S	
T	label	MargozTurnIn
A	goto	Durotar,56.41,20.04
A	turnin	828
A	accept	827
A	target	Margoz
A	isQuestTurnedIn	806
A	group	
S	Shaman
T	completewith	Collars1
A	goto	Durotar,53.18,29.15,50
S	!Shaman
T	completewith	next
A	goto	Durotar,56.49,25.04,50,0
A	goto	Durotar,56.11,27.94,50,0
A	goto	Durotar,53.18,29.15,50
A	isQuestTurnedIn	806
A	group	
S	!Shaman
T	loop	
A	goto	Durotar,53.18,29.15,0
A	goto	Durotar,53.18,29.15,20,0
A	goto	Durotar,52.70,27.97,12,0
A	goto	Durotar,53.05,27.87,12,0
A	goto	Durotar,53.14,27.24,12,0
A	goto	Durotar,52.84,26.80,12,0
A	goto	Durotar,52.07,26.85,12,0
A	goto	Durotar,52.70,27.97,12,0
A	complete	827,1
A	mob	Burning Blade Thug
A	mob	Burning Blade Neophyte
A	mob	Burning Blade Cultist
A	isQuestTurnedIn	806
A	group	
S	Shaman
T	loop	
A	goto	Durotar,53.18,29.15,0
A	goto	Durotar,53.18,29.15,20,0
A	goto	Durotar,52.70,27.97,12,0
A	goto	Durotar,53.05,27.87,12,0
A	goto	Durotar,53.14,27.24,12,0
A	goto	Durotar,52.84,26.80,12,0
A	goto	Durotar,52.07,26.85,12,0
A	goto	Durotar,52.70,27.97,12,0
A	complete	827,1
A	mob	+Burning Blade Thug
A	mob	+Burning Blade Neophyte
A	mob	+Burning Blade Cultist
A	complete	1525,2
A	mob	+Burning Blade Cultist
A	isQuestTurnedIn	806
A	group	
S	Shaman
T	loop	
A	goto	Durotar,53.18,29.15,0
A	goto	Durotar,53.18,29.15,20,0
A	goto	Durotar,52.70,27.97,12,0
A	goto	Durotar,53.05,27.87,12,0
A	goto	Durotar,53.14,27.24,12,0
A	goto	Durotar,52.84,26.80,12,0
A	goto	Durotar,52.07,26.85,12,0
A	goto	Durotar,52.70,27.97,12,0
A	complete	1525,2
A	mob	Burning Blade Cultist
A	solo	
S	
T	optional	
T	label	Collars1
S	skip --Shaman
A	goto	Durotar,53.03,26.82
A	goto	Durotar,47.31,17.89,30
A	link	https://www.youtube.com/watch?v=9A6LHcLZeTU&ab
A	solo	
S	
T	completewith	next
A	goto	Durotar,56.30,27.91,80,0
A	goto	Durotar,56.41,20.04,50
A	isQuestTurnedIn	806
A	group	
S	
A	goto	Durotar,56.41,20.04
A	turnin	827
A	accept	829
A	target	Margoz
A	isQuestTurnedIn	806
A	group	
S	
T	completewith	next
A	goto	Durotar,53.41,27.81,15
A	group	
S	
T	loop	
A	goto	Durotar,53.98,23.70,0
A	goto	Durotar,54.02,27.23,40,0
A	goto	Durotar,52.82,24.27,40,0
A	goto	Durotar,51.85,23.95,40,0
A	goto	Durotar,54.01,23.63,40,0
A	goto	Durotar,52.13,20.77,40,0
A	goto	Durotar,51.26,19.19,40,0
A	goto	Durotar,53.98,23.70,40,0
A	complete	835,1
A	mob	+Dustwind Savage
A	complete	835,2
A	mob	+Dustwind Storm Witch
A	group	
S	Troll Warrior/Undead Warrior
T	completewith	next
A	group	
S	
A	goto	Durotar,46.37,22.94
A	turnin	835
A	target	Rezlak
A	group	
S	
A	xp	10
S	Hunter
T	completewith	Admiralorders1
A	goto	Orgrimmar,48.97,92.84,50,0
A	zone	Orgrimmar
A	zoneskip	Orgrimmar
A	isOnQuest	829
A	group	
S	!Hunter
T	completewith	Admiralorders1
A	goto	Orgrimmar,48.97,92.84,50,0
A	zone	Orgrimmar
A	zoneskip	Orgrimmar
S	!Rogue
A	goto	Orgrimmar,48.12,80.52
A	vendor	
A	target	Trak'gen
S	Rogue
A	goto	Orgrimmar,48.12,80.52
A	collect	3135,200,354,1
A	vendor	
A	target	Trak'gen
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.3
S	Rogue
T	optional	
T	completewith	ZeptoUC1
A	use	3135
A	itemcount	3135,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.3
S	Shaman
A	goto	Orgrimmar,45.120,63.889
A	turnin	6385
A	accept	6386
A	target	Doras
A	isOnQuest	6385
S	Troll Priest
A	goto	Orgrimmar,35.59,87.80
A	turnin	5654
A	trainer	
A	target	Ur'kyo
A	isOnQuest	5654
S	Troll Priest
T	optional	
A	goto	Orgrimmar,35.59,87.80
A	turnin	5652
A	trainer	
A	target	Ur'kyo
S	Mage
A	goto	Orgrimmar,38.33,85.55
A	train	122
A	target	Pephredo
S	
T	label	Admiralorders1
A	goto	Orgrimmar,32.29,35.81
A	turnin	831
A	target	Nazgrel
S	Rogue
A	goto	Orgrimmar,42.75,53.53
A	accept	1963
A	trainer	
A	target	Therzok
S	Shaman
A	goto	Orgrimmar,47.24,53.58
A	accept	813
A	target	Kor'ghan
A	isOnQuest	812
S	Shaman
T	completewith	CallofFire3
A	abandon	812
A	isOnQuest	812
S	
T	label	NeeruFireblade
A	goto	Orgrimmar,49.49,50.56
A	turnin	829
A	accept	809
A	target	Neeru Fireblade
A	isOnQuest	829
A	group	
S	Warlock
A	goto	Orgrimmar,48.59,46.97
A	train	1120
A	target	Mirket
S	Troll Warrior/Undead Warrior
T	completewith	StaveTraining1
A	goto	Orgrimmar,68.02,38.69,30
S	Warrior
A	goto	Orgrimmar,79.93,31.26
A	train	6546
A	target	Grezz Ragefist
S	Troll Warrior/Undead Warrior
T	label	StaveTraining1
A	goto	Orgrimmar,81.52,19.60
A	train	227
A	target	Hanashi
S	Troll Warrior/Undead Warrior
A	goto	Orgrimmar,81.17,18.69
A	collect	854,1,398,1
A	money	<0.3022
A	target	Zendo'jian
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.4
S	Troll Warrior/Undead Warrior
T	optional	
T	completewith	ZeptoUC1
A	use	854
A	itemcount	854,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.4
S	Orc Warrior
A	goto	Orgrimmar,47.54,68.39
A	vendor	
A	target	Urtharo
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.2
S	Orc Warrior
A	goto	Orgrimmar,47.54,68.39
A	collect	1196,1,398,1
A	money	<0.2214
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.2
S	Orc Warrior
T	optional	
T	completewith	ZeptoUC1
A	use	1196
A	itemcount	1196,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.2
S	Shaman
A	goto	Orgrimmar,47.54,68.39
A	collect	854,1,398,1
A	money	<0.3022
A	target	Urtharo
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.4
S	Shaman
T	optional	
T	completewith	ZeptoUC1
A	use	854
A	itemcount	854,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.4
S	!Hunter !Shaman
T	label	LeaveOrg2
T	completewith	ZeptoUC1
A	zone	Durotar
A	zoneskip	Durotar
S	Hunter
T	completewith	HunterCrossRoadsVisit1
A	zone	Durotar
A	zoneskip	Durotar
A	group	
S	Shaman/Hunter
T	label	VenomPoisonSacs
T	loop	
A	goto	Durotar,36.40,30.95,0
A	goto	Durotar,42.47,19.99,50,0
A	goto	Durotar,41.07,19.85,50,0
A	goto	Durotar,40.21,17.21,50,0
A	goto	Durotar,38.89,16.91,50,0
A	goto	Durotar,38.13,19.90,50,0
A	goto	Durotar,38.67,22.13,50,0
A	goto	Durotar,36.91,25.63,50,0
A	goto	Durotar,36.64,28.18,50,0
A	goto	Durotar,36.40,30.95,50,0
A	complete	813,1
A	mob	Venomtail Scorpid
A	isOnQuest	813
S	Hunter
A	goto	Durotar,34.80,32.84,50,0
A	goto	Durotar,34.81,37.02,50,0
A	goto	Durotar,34.44,44.53,50,0
A	goto	Durotar,34.27,47.02,50,0
A	goto	Durotar,34.71,42.30
A	complete	816,1
A	mob	Dreadmaw Crocolisk
S	Shaman
T	completewith	CallofFire3
A	goto	Durotar,34.80,32.84,50,0
A	goto	Durotar,34.81,37.02,50,0
A	goto	Durotar,34.44,44.53,50,0
A	goto	Durotar,34.27,47.02,50,0
A	goto	Durotar,34.51,51.48,50,0
A	goto	Durotar,35.16,56.43,50,0
A	complete	816,1
A	mob	Dreadmaw Crocolisk
S	Shaman
T	completewith	next
A	goto	Durotar,36.74,57.78,10,0
A	goto	Durotar,36.63,58.15,8,0
A	goto	Durotar,36.63,58.15,8,0
A	goto	Durotar,36.77,58.98,8,0
A	goto	Durotar,36.85,58.32,8,0
A	goto	Durotar,37.24,58.13,8,0
A	goto	Durotar,37.86,58.18,8,0
A	goto	Durotar,38.05,57.79,8,0
A	goto	Durotar,38.93,57.54,8,0
A	goto	Durotar,39.19,57.90,8,0
A	goto	Durotar,39.16,58.56,10
S	Shaman
T	label	CallofFire3
A	goto	Durotar,38.52,58.93
A	turnin	1525
A	accept	1526
A	target	Telf Joolam
S	Shaman
T	completewith	next
A	goto	Durotar,38.18,58.58
A	cast	8898
A	use	6636
S	Shaman
A	goto	Durotar,38.96,58.22
A	complete	1526,1
A	mob	Minor Manifestation of Fire
S	Shaman
A	goto	Durotar,38.96,58.22
A	turnin	1526
A	accept	1527
S	Shaman
T	completewith	next
A	goto	Durotar,39.13,58.63,10,0
A	goto	Durotar,39.17,57.93,10,0
A	goto	Durotar,38.95,57.58,8,0
A	goto	Durotar,38.61,57.67,8,0
A	goto	Durotar,38.06,57.78,8,0
A	goto	Durotar,37.76,58.19,8,0
A	goto	Durotar,36.96,58.07,15
S	Shaman
A	goto	Durotar,34.92,54.87,50,0
A	goto	Durotar,34.58,51.64,50,0
A	goto	Durotar,34.33,48.97,50,0
A	goto	Durotar,34.31,44.24
A	complete	816,1
A	mob	Dreadmaw Crocolisk
S	Shaman/Hunter
A	goto	Durotar,43.11,30.24
A	turnin	816
A	target	Misha Tor'kren
A	isQuestComplete	816
S	Shaman/Hunter
T	label	FarWatchPost
A	goto	The Barrens,62.26,19.38,40
A	zoneskip	The Barrens
S	Shaman/Hunter
A	goto	The Barrens,62.27,19.38
A	turnin	840
A	accept	842
A	target	Kargal Battlescar
S	Shaman/Hunter
T	label	Akzeloth
A	goto	The Barrens,62.34,20.07
A	turnin	809
A	accept	924
A	target	Ak'Zeloth
A	isQuestTurnedIn	829
A	group	
S	Shaman/Hunter
A	goto	The Barrens,62.34,20.03
A	turnin	926
A	isOnQuest	924
A	group	
S	Shaman
A	goto	The Barrens,55.86,19.95
A	turnin	1527
A	target	Kranal Fiss
S	Hunter
T	completewith	next
A	goto	The Barrens,52.34,29.27,150
S	Hunter
T	label	HunterCrossRoadsVisit1
A	accept	6365
A	target	+Zargh
A	goto	The Barrens,52.62,29.84
A	turnin	842
A	accept	844
A	target	+Sergra Darkthorn
A	goto	The Barrens,52.23,31.00
A	accept	871
A	accept	5041
A	target	+Thork
A	goto	The Barrens,51.50,30.87
A	accept	869
A	target	+Gazrog
A	goto	The Barrens,51.93,30.32
S	Hunter
A	goto	The Barrens,51.11,29.07
A	collect	2507,1,871,1
A	money	<0.1751
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<5.7
A	target	Uthrok
S	Hunter
T	optional	
T	completewith	DisruptTheAttacks
A	use	2507
A	itemcount	2507,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<5.7
S	Shaman
A	goto	The Barrens,55.78,20.00
A	use	4926
A	collect	4926,1,819
A	accept	819
S	Shaman/Hunter
T	completewith	DemonSeed
A	complete	844,1
A	mob	Greater Plainstrider
A	mob	Fleeting Plainstrider
S	Shaman/Hunter
A	goto	The Barrens,51.09,22.68,40,0
A	goto	The Barrens,50.33,21.85,40,0
A	goto	The Barrens,49.21,20.42,40,0
A	goto	The Barrens,47.58,19.38,100
A	isOnQuest	924
S	Shaman/Hunter
T	completewith	next
A	unitscan	Rathorian
S	Shaman/Hunter
T	label	DemonSeed
A	goto	The Barrens,47.98,19.08
A	collect	4986,1,924
A	complete	924,1
A	isOnQuest	924
S	Shaman/Hunter
T	completewith	DisruptTheAttacks
A	goto	The Barrens,47.58,19.38,40,0
A	goto	The Barrens,49.21,20.42,40,0
A	goto	The Barrens,50.33,21.85,40,0
A	goto	The Barrens,51.09,22.68,40
A	isOnQuest	924
S	Shaman/Hunter
T	completewith	DisruptTheAttacks
A	complete	844,1
A	mob	Greater Plainstrider
A	mob	Fleeting Plainstrider
S	Hunter
T	completewith	next
A	complete	871,1
A	mob	+Razormane Water Seeker
A	complete	871,2
A	mob	+Razormane Thornweaver
A	complete	871,3
A	mob	+Razormane Hunter
S	Hunter
A	goto	The Barrens,55.70,27.30
A	use	4926
A	collect	4926,1,819
A	accept	819
S	Shaman/Hunter
T	label	DisruptTheAttacks
T	loop	
A	goto	The Barrens,53.63,24.50,0
A	goto	The Barrens,53.63,24.50,50,0
A	goto	The Barrens,54.26,24.64,50,0
A	goto	The Barrens,54.81,25.19,50,0
A	goto	The Barrens,55.50,25.61,50,0
A	goto	The Barrens,55.86,26.30,50,0
A	goto	The Barrens,55.83,27.15,50,0
A	goto	The Barrens,55.41,27.41,50,0
A	goto	The Barrens,54.50,26.97,50,0
A	goto	The Barrens,54.05,26.11,50,0
A	goto	The Barrens,53.51,25.24,50,0
A	complete	871,1
A	mob	+Razormane Water Seeker
A	complete	871,2
A	mob	+Razormane Thornweaver
A	complete	871,3
A	mob	+Razormane Hunter
S	Shaman/Hunter
T	loop	
A	goto	The Barrens,53.71,29.19,0
A	goto	The Barrens,53.36,26.28,80,0
A	goto	The Barrens,53.23,28.41,80,0
A	goto	The Barrens,53.57,29.58,80,0
A	goto	The Barrens,52.91,32.90,80,0
A	goto	The Barrens,51.31,32.91,80,0
A	goto	The Barrens,50.50,31.05,80,0
A	goto	The Barrens,50.05,29.77,80,0
A	goto	The Barrens,50.93,27.72,80,0
A	goto	The Barrens,52.83,27.91,80,0
A	goto	The Barrens,53.71,29.19,80,0
A	complete	844,1
A	mob	Greater Plainstrider
A	mob	Fleeting Plainstrider
S	Hunter
T	loop	
A	goto	The Barrens,53.12,28.72,0
A	goto	The Barrens,53.12,28.72,60,0
A	goto	The Barrens,53.97,28.10,60,0
A	goto	The Barrens,54.64,27.09,60,0
A	goto	The Barrens,55.47,26.94,60,0
A	goto	The Barrens,55.44,25.70,60,0
A	goto	The Barrens,55.51,24.54,60,0
A	goto	The Barrens,54.75,23.51,60,0
A	goto	The Barrens,53.74,23.66,60,0
A	goto	The Barrens,53.35,25.16,60,0
A	goto	The Barrens,52.99,26.88,60,0
A	xp	11+6980
S	Shaman/Hunter
A	turnin	6386
A	target	+Zargh
A	goto	The Barrens,52.62,29.84
A	turnin	844
A	accept	845
A	target	+Sergra Darkthorn
A	goto	The Barrens,52.23,31.00
A	turnin	871
A	accept	872
A	target	+Thork
A	goto	The Barrens,51.50,30.87
A	isOnQuest	6386
S	Shaman/Hunter
A	turnin	844
A	accept	845
A	target	+Sergra Darkthorn
A	goto	The Barrens,52.23,31.00
A	turnin	871
A	accept	872
A	target	+Thork
A	goto	The Barrens,51.50,30.87
S	Shaman/Hunter
A	goto	The Barrens,51.99,29.89
A	home	
A	target	Innkeeper Boorand Plainswind
A	bindlocation	380
A	subzoneskip	380,1
S	Hunter
A	goto	The Barrens,51.67,29.95
A	collect	2515,1200,398,1 << Hunter
A	target	Barg
A	itemcount	2515,<800 << Hunter
S	Hunter
A	goto	The Barrens,51.50,30.34
A	turnin	6365
A	accept	6384
A	target	Devrak
S	Hunter
T	completewith	ZeptoUC1
A	goto	The Barrens,51.50,30.34
A	fly	Orgrimmar
A	target	Devrak
A	zoneskip	Orgrimmar
S	Shaman
T	completewith	ZeptoUC1
A	goto	The Barrens,51.50,30.34
A	fly	Orgrimmar
A	target	Devrak
A	zoneskip	Orgrimmar
S	Hunter
T	label	Gryhskaturnin1
A	goto	Orgrimmar,54.097,68.407
A	turnin	6384
A	accept	6385
A	target	Innkeeper Gryshka
S	Hunter
A	goto	Orgrimmar,45.120,63.889
A	turnin	6385
A	accept	6386
A	target	Doras
S	Shaman/Hunter
T	label	FindingAntidoteTurnin
A	goto	Orgrimmar,47.24,53.58
A	turnin	813
A	target	Kor'ghan
A	isQuestComplete	813
A	isQuestAvailable	812
S	Shaman
T	label	Shaman12training
A	goto	Orgrimmar,38.82,36.41
A	train	547
A	target	Kardris Dreamseeker
A	xp	<12,1
S	Shaman
A	goto	Orgrimmar,47.54,68.39
A	vendor	
A	target	Urtharo
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.4
S	Shaman
A	goto	Orgrimmar,47.54,68.39
A	collect	854,1,398,1
A	money	<0.3022
A	target	Urtharo
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.4
S	Shaman
T	optional	
T	completewith	ZeptoUC1
A	use	854
A	itemcount	854,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.4
S	Hunter
T	completewith	next
A	goto	Orgrimmar,68.02,38.69,30
S	Hunter
A	goto	Orgrimmar,66.06,18.50
A	train	14281
A	target	Ormak Grimshot
A	xp	<12,1
S	Hunter
A	goto	Orgrimmar,66.34,14.83
A	train	24556
A	target	Xao'tsu
A	xp	<12,1
S	Hunter
A	goto	Orgrimmar,81.17,18.69
A	collect	2507,1,398,1
A	money	<0.1751
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<5.7
S	Hunter
T	optional	
T	completewith	ZeptoUC1
A	use	2507
A	itemcount	2507,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<5.7
S	Shaman/Hunter
T	label	Leaveorg2
T	completewith	next
A	zone	Durotar
A	zoneskip	Durotar
S	Shaman/Hunter
A	goto	Durotar,41.54,18.59
A	accept	812
A	turnin	812
A	target	Rhinag
S	
T	label	ZeptoUC1
A	goto	Durotar,50.8,13.8,40
A	zone	Tirisfal Glades
A	zoneskip	Tirisfal Glades
S	Orc Rogue/Troll Rogue
T	optional	
T	completewith	Swordtraining1
A	goto	Tirisfal Glades,61.80,65.06,20,0
A	zone	Undercity
A	zoneskip	Undercity
A	money	<0.3023
S	Orc Rogue/Troll Rogue
T	optional	
T	completewith	Swordtraining1
A	goto	Undercity,66.09,20.06,20,0
A	goto	Undercity,64.37,23.94,20,0
A	goto	Undercity,65.93,26.71,10,0
A	goto	Undercity,65.89,34.03,10,0
A	goto	Undercity,64.22,39.77,10,0
A	goto	Undercity,65.53,43.62,15
A	money	<0.3023
S	Orc Rogue/Troll Rogue
T	optional	
A	goto	Undercity,63.25,48.56
A	fp	Undercity
A	target	Michael Garrett
A	money	<0.3023
S	Orc Rogue/Troll Rogue
T	label	Swordtraining1
A	goto	Undercity,57.29,32.72
A	train	201
A	target	Archibald
A	money	<0.3023
S	Orc Rogue/Troll Rogue
T	ssf	
T	optional	
T	label	RogueCutlass1
A	goto	Undercity,61.15,40.89
A	collect	851,1,435,1
A	money	<0.2023
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
A	target	Louis Warren
A	zoneskip	Undercity,1
S	Orc Rogue/Troll Rogue
T	ah	
T	optional	
T	label	RogueCutlass1
A	goto	Undercity,61.15,40.89
A	collect	851,1,435,1
A	money	<0.2023
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
A	target	Louis Warren
A	zoneskip	Undercity,1
S	Orc Rogue/Troll Rogue
T	optional	
T	completewith	KillDevlin
A	use	851
A	itemcount	851,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
S	Orc Rogue/Troll Rogue
T	optional	
T	ah	
A	goto	Undercity,64.20,49.60
A	collect	3164,6,429,1
A	target	Auctioneer Rhyker
A	zoneskip	Undercity,1
S	skip --Orc Rogue/Troll Rogue
T	optional	
A	goto	Undercity,84.86,20.34
A	goto	Undercity,67.90,15.28,30
A	link	https://www.youtube.com/watch?v=-Bi95bCN8dM
A	zoneskip	Tirisfal Glades
S	Orc Rogue/Troll Rogue
T	completewith	next
A	zone	Tirisfal Glades
A	zoneskip	Undercity,1
S	
T	completewith	next
A	goto	Tirisfal Glades,61.52,53.20,80
A	subzoneskip	159
S	
T	optional	
A	accept	354
A	accept	362
A	target	+Coleman Farthing
A	goto	Tirisfal Glades,61.72,52.29
A	accept	375
A	target	+Gretchen Dedmar
A	goto	Tirisfal Glades,61.89,52.73
A	maxlevel	12
S	Warrior
T	optional	
A	abandon	1505
A	isOnQuest	1505
S	Warrior
T	optional	
A	abandon	1498
A	isOnQuest	1498
S	Warrior
A	goto	Tirisfal Glades,61.85,52.55
A	accept	1818
A	target	Austil de Mon
A	xp	<10,1
A	isQuestAvailable	1498
S	Warlock
A	goto	Tirisfal Glades,61.62,52.66
A	accept	1478
A	target	Ageron Kargal
A	isQuestAvailable	1504
A	xp	<10,1
S	Undead Rogue
A	goto	Tirisfal Glades,61.75,52.01
A	accept	1885
A	target	Marion Call
A	xp	<10,1
S	Mage
A	goto	Tirisfal Glades,61.96,52.47
A	accept	1881
A	target	Cain Firesong
A	xp	<10,1
S	!Mage
A	goto	Tirisfal Glades,61.71,52.06
A	vendor	
A	collect	1179,20,367,1 << Mage/Priest/Shaman
A	collect	4605,20,367,1 << Rogue/Warrior
A	collect	1179,15,367,1 << Warlock
A	collect	4605,15,367,1 << Warlock
A	money	<0.075 << Warlock
A	money	<0.05 << !Warlock
A	target	Innkeeper Renee
S	
A	goto	Tirisfal Glades,61.15,52.59
A	collect	4496,1,398,1
A	target	Mrs. Winters
A	money	<0.05
S	
T	optional	
A	goto	Tirisfal Glades,60.59,51.77
A	accept	427
A	target	Executor Zygand
A	maxlevel	11
S	
A	goto	Tirisfal Glades,60.74,51.52
A	accept	398
S	
T	optional	
A	goto	Tirisfal Glades,61.26,50.84
A	accept	358
A	target	Magistrate Sevren
A	maxlevel	12
S	
A	goto	Tirisfal Glades,59.45,52.40
A	accept	445
A	accept	367
A	target	Apothecary Johaan
S	
T	optional	
A	goto	Tirisfal Glades,58.20,51.45
A	accept	404
A	target	Deathguard Dillinger
A	maxlevel	11
S	Warrior
A	goto	Tirisfal Glades,58.19,51.44
A	turnin	1818
A	accept	1819
A	target	Deathguard Dillinger
A	isOnQuest	1818
S	Warrior
A	goto	Tirisfal Glades,59.16,48.51
A	complete	1819,1
A	mob	Ulag the Cleaver
A	isQuestTurnedIn	1818
S	Warrior
A	goto	Tirisfal Glades,58.19,51.44
A	turnin	1819
A	accept	1820
A	target	Deathguard Dillinger
A	isQuestTurnedIn	1818
S	
T	completewith	Pumpkins
A	complete	367,1
A	mob	Decrepit Darkhound
A	mob	Cursed Darkhound
S	
T	optional	
T	label	Claws
T	loop	
A	goto	Tirisfal Glades,52.63,56.98,0
A	goto	Tirisfal Glades,54.95,50.53,50,0
A	goto	Tirisfal Glades,53.35,50.29,50,0
A	goto	Tirisfal Glades,52.12,50.38,50,0
A	goto	Tirisfal Glades,51.28,51.63,50,0
A	goto	Tirisfal Glades,52.03,53.74,50,0
A	goto	Tirisfal Glades,52.29,56.72,50,0
A	goto	Tirisfal Glades,53.95,56.53,50,0
A	goto	Tirisfal Glades,53.55,58.25,50,0
A	goto	Tirisfal Glades,52.63,56.98,50,0
A	complete	404,1
A	mob	Rotting Dead
A	mob	Ravaged Corpse
A	isOnQuest	404
S	
T	optional	
T	completewith	Pumpkins
A	complete	375,1
A	mob	Greater Duskbat
A	mob	Vampiric Duskbat
A	isOnQuest	375
S	
T	optional	
T	label	Pumpkins
A	goto	Tirisfal Glades,40.91,54.17
A	accept	365
A	target	Deathguard Simmer
A	maxlevel	11
S	
T	optional	
T	loop	
A	goto	Tirisfal Glades,36.63,50.09,0
A	goto	Tirisfal Glades,37.20,52.17,50,0
A	goto	Tirisfal Glades,36.64,50.09,50,0
A	goto	Tirisfal Glades,36.10,49.07,50,0
A	goto	Tirisfal Glades,35.08,49.82,50,0
A	goto	Tirisfal Glades,35.30,50.91,50,0
A	goto	Tirisfal Glades,34.57,51.58,50,0
A	goto	Tirisfal Glades,36.63,50.09,50,0
A	complete	365,1
A	isOnQuest	365
S	
T	optional	
A	goto	Tirisfal Glades,31.78,51.36,0
A	goto	Tirisfal Glades,33.73,49.34,50,0
A	goto	Tirisfal Glades,33.65,51.07,50,0
A	goto	Tirisfal Glades,31.78,51.36,50,0
A	goto	Tirisfal Glades,30.02,50.48,50,0
A	goto	Tirisfal Glades,29.91,49.24,50,0
A	goto	Tirisfal Glades,30.62,47.53,50,0
A	goto	Tirisfal Glades,31.01,46.50,50,0
A	goto	Tirisfal Glades,32.15,44.83,50,0
A	goto	Tirisfal Glades,33.73,45.29,50,0
A	goto	Tirisfal Glades,34.10,47.88,50,0
A	complete	427,1
A	mob	Scarlet Warrior
A	isOnQuest	427
S	
T	completewith	next
A	complete	375,1
A	mob	Greater Duskbat
A	mob	Vampiric Duskbat
A	isOnQuest	375
S	
T	label	Darkhounds1
T	loop	
A	goto	Tirisfal Glades,50.36,49.51,0
A	goto	Tirisfal Glades,45.90,50.95,50,0
A	goto	Tirisfal Glades,45.11,48.06,50,0
A	goto	Tirisfal Glades,47.07,45.37,50,0
A	goto	Tirisfal Glades,50.36,49.51,50,0
A	complete	367,1
A	mob	Decrepit Darkhound
A	mob	Cursed Darkhound
S	
T	completewith	Brillturnins2
A	subzone	159
S	
A	goto	Tirisfal Glades,58.20,51.43
A	turnin	404
A	accept	426
A	target	Deathguard Dillinger
A	isQuestComplete	404
S	
T	optional	
A	goto	Tirisfal Glades,58.20,51.43
A	accept	426
A	target	Deathguard Dillinger
A	isQuestTurnedIn	404
S	
A	goto	Tirisfal Glades,59.45,52.40
A	turnin	367
A	turnin	365
A	accept	368
A	accept	407
A	target	Apothecary Johaan
A	isQuestComplete	365
S	
T	optional	
A	goto	Tirisfal Glades,59.45,52.40
A	accept	407
A	target	Apothecary Johaan
A	isQuestTurnedIn	365
S	
T	optional	
A	goto	Tirisfal Glades,59.45,52.40
A	turnin	367
A	accept	368
A	target	Apothecary Johaan
S	
A	goto	Tirisfal Glades,60.58,51.77
A	turnin	427
A	accept	370
A	target	Executor Zygand
A	isQuestComplete	427
S	
T	optional	
A	goto	Tirisfal Glades,60.58,51.77
A	accept	370
A	target	Executor Zygand
A	isQuestTurnedIn	427
S	
T	optional	
A	goto	Tirisfal Glades,60.93,52.01
A	accept	374
A	target	Deathguard Burgess
A	isQuestTurnedIn	427
S	
T	optional	
T	label	Brillturnins2
S	Warrior
T	optional	
A	abandon	1505
A	isOnQuest	1505
S	Warrior
T	optional	
A	abandon	1498
A	isOnQuest	1498
S	Warrior
A	goto	Tirisfal Glades,61.85,52.55
A	accept	1818
A	target	Austil de Mon
A	isQuestAvailable	1498
S	Warrior
A	goto	Tirisfal Glades,58.19,51.44
A	turnin	1818
A	accept	1819
A	target	Deathguard Dillinger
A	isQuestAvailable	1498
S	Warrior
A	goto	Tirisfal Glades,59.16,48.51
A	complete	1819,1
A	mob	Ulag the Cleaver
A	isQuestAvailable	1498
S	Warrior
A	goto	Tirisfal Glades,58.19,51.44
A	turnin	1819
A	accept	1820
A	target	Deathguard Dillinger
A	isQuestAvailable	1498
S	Warlock
A	goto	Tirisfal Glades,61.62,52.66
A	accept	1478
A	target	Ageron Kargal
A	isQuestAvailable	1504
S	Undead Rogue
A	goto	Tirisfal Glades,61.75,52.01
A	accept	1885
A	target	Marion Call
S	Mage
A	goto	Tirisfal Glades,61.96,52.47
A	accept	1881
A	target	Cain Firesong
S	Warlock/Mage
T	completewith	UCflightpath1
A	goto	Tirisfal Glades,61.80,65.06,20,0
A	zone	Undercity
A	zoneskip	Undercity
S	Warlock/Mage
T	completewith	UCflightpath1
A	goto	Undercity,66.09,20.06,35,0
A	goto	Undercity,64.37,23.94,35,0
A	goto	Undercity,65.93,26.71,10,0
A	goto	Undercity,65.89,34.03,10,0
A	goto	Undercity,64.22,39.77,10,0
A	goto	Undercity,65.53,43.62,15
S	Warlock/Mage
T	label	UCflightpath1
A	goto	Undercity,63.25,48.56
A	fp	Undercity
A	target	Michael Garrett
S	Warlock/Mage
T	optional	
T	ah	
A	goto	Undercity,64.20,49.60
A	collect	3164,6,429,1
A	target	Auctioneer Rhyker
A	zoneskip	Undercity,1
S	Warlock
A	goto	Undercity,85.07,25.96
A	turnin	1478
A	accept	1473
A	isQuestAvailable	1504
S	Mage
T	optional	
A	abandon	1883
A	isOnQuest	1883
S	Mage
A	goto	Undercity,85.12,10.07
A	turnin	1881
A	accept	1882
A	target	Anastasia Hartwell
S	Undead Priest
T	completewith	TouchofWeakness
A	goto	Tirisfal Glades,61.80,65.06,20,0
A	zone	Undercity
A	zoneskip	Undercity
S	Undead Priest
T	completewith	TouchofWeakness
A	goto	Undercity,66.09,20.06,35,0
A	goto	Undercity,64.37,23.94,35,0
A	goto	Undercity,65.93,26.71,10,0
A	goto	Undercity,65.89,34.03,10,0
A	goto	Undercity,64.22,39.77,10,0
A	goto	Undercity,65.53,43.62,15
S	Undead Priest
T	optional	
T	ah	
A	goto	Undercity,64.20,49.60
A	collect	3164,6,429,1
A	target	Auctioneer Rhyker
A	zoneskip	Undercity,1
S	Undead Priest
T	optional	
A	goto	Undercity,48.98,18.33
A	turnin	5660
A	target	Aelthalyste
A	isOnQuest	5660
S	Undead Priest
T	label	TouchofWeakness
A	goto	Undercity,48.98,18.33
A	accept	5658
A	turnin	5658
A	target	Aelthalyste
S	Rogue
T	completewith	Swordtraining2
A	goto	Tirisfal Glades,61.80,65.06,20,0
A	zone	Undercity
A	zoneskip	Undercity
A	money	<0.3023
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
S	Rogue
T	optional	
T	completewith	Swordtraining2
A	goto	Undercity,66.09,20.06,20,0
A	goto	Undercity,64.37,23.94,20,0
A	goto	Undercity,65.93,26.71,10,0
A	goto	Undercity,65.89,34.03,10,0
A	goto	Undercity,64.22,39.77,10,0
A	goto	Undercity,65.53,43.62,15
A	money	<0.3023
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
S	Rogue
T	optional	
A	goto	Undercity,63.25,48.56
A	fp	Undercity
A	target	Michael Garrett
A	money	<0.3023
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
S	Orc Rogue/Troll Rogue
T	ssf	
T	optional	
T	label	RogueCutlass2
A	goto	Undercity,61.15,40.89
A	collect	851,1,354,1
A	money	<0.3023
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
A	target	Louis Warren
A	zoneskip	Undercity,1
S	Orc Rogue/Troll Rogue
T	ah	
T	optional	
T	label	RogueCutlass2
A	goto	Undercity,61.15,40.89
A	collect	851,1,354,1
A	money	<0.3023
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
A	target	Louis Warren
A	zoneskip	Undercity,1
S	Undead Rogue
T	optional	
A	goto	Undercity,83.52,69.09
A	turnin	1885
A	accept	1886
A	target	Mennet Carkad
A	money	<0.3023
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
S	Rogue
T	optional	
T	label	Swordtraining2
A	goto	Undercity,57.29,32.72
A	train	201
A	target	Archibald
A	money	<0.1
A	zoneskip	Undercity,1
S	Rogue
T	optional	
T	completewith	KillDevlin
A	use	851
A	itemcount	851,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
S	Rogue
T	optional	
T	ah	
A	goto	Undercity,64.20,49.60
A	collect	3164,6,429,1
A	target	Auctioneer Rhyker
A	zoneskip	Undercity,1
S	Warlock/Mage/Rogue
T	optional	
A	goto	Undercity,47.25,39.12,50,0
A	goto	Undercity,46.35,43.86,10,0
A	goto	Undercity,45.24,39.35,10,0
A	goto	Undercity,41.32,38.40,10,0
A	goto	Undercity,40.74,33.95,10,0
A	goto	Undercity,34.80,33.19,15,0
A	goto	Undercity,27.39,30.23,35,0
A	goto	Undercity,21.89,43.35,35,0
A	goto	Tirisfal Glades,51.10,71.53,50,0
A	zone	Tirisfal Glades
A	zoneskip	Tirisfal Glades
S	Undead Priest
T	optional	
A	goto	Undercity,47.25,39.12,50,0
A	goto	Undercity,46.35,43.86,10,0
A	goto	Undercity,45.24,39.35,10,0
A	goto	Undercity,41.32,38.40,10,0
A	goto	Undercity,40.74,33.95,10,0
A	goto	Undercity,34.80,33.19,15,0
A	goto	Undercity,27.39,30.23,35,0
A	goto	Undercity,21.89,43.35,35,0
A	goto	Tirisfal Glades,51.10,71.53,50,0
A	zone	Tirisfal Glades
A	zoneskip	Tirisfal Glades
S	
T	optional	
T	completewith	ScarletCrusade1
A	complete	374,1
A	isOnQuest	374
S	Warlock
T	optional	
T	completewith	next
A	goto	Tirisfal Glades,51.06,67.57
A	complete	1473,1
A	isQuestAvailable	1504
S	
T	optional	
T	label	ScarletCrusade1
T	loop	
A	goto	Tirisfal Glades,51.03,69.55,0
A	goto	Tirisfal Glades,50.07,68.87,40,0
A	goto	Tirisfal Glades,50.23,66.94,40,0
A	goto	Tirisfal Glades,51.16,65.73,40,0
A	goto	Tirisfal Glades,51.75,66.04,40,0
A	goto	Tirisfal Glades,52.93,67.62,40,0
A	goto	Tirisfal Glades,52.72,69.33,40,0
A	goto	Tirisfal Glades,51.96,69.57,40,0
A	goto	Tirisfal Glades,51.03,69.55,40,0
A	complete	370,1
A	mob	+Captain Perrine
A	complete	370,2
A	mob	+Scarlet Zealot
A	complete	370,3
A	mob	+Scarlet Missionary
A	isOnQuest	370
S	Warlock
A	goto	Tirisfal Glades,51.06,67.57
A	complete	1473,1
A	isQuestAvailable	1504
S	Warlock
T	completewith	next
A	goto	Undercity,16.51,42.76,35,0
A	goto	Undercity,22.98,39.76,35,0
A	goto	Undercity,24.93,32.54,35,0
A	goto	Undercity,34.78,33.24,10,0
A	goto	Undercity,40.83,34.08,10,0
A	goto	Undercity,41.35,38.40,10,0
A	goto	Undercity,45.25,39.20,10,0
A	goto	Undercity,45.67,43.60,10,0
A	zone	Undercity
S	Warlock
A	goto	Undercity,85.07,25.96
A	turnin	1473
A	accept	1471
A	target	Carendin Halgar
A	isQuestAvailable	1504
S	Warlock
T	completewith	next
A	goto	Undercity,86.64,27.10
A	cast	9221
A	use	6284
S	Warlock
A	goto	Undercity,86.64,27.10
A	complete	1471,1
A	mob	Summoned Voidwalker
A	use	6284
A	isQuestAvailable	1504
S	Warlock
A	goto	Undercity,85.04,25.97
A	turnin	1471
A	target	Carendin Halgar
A	isQuestAvailable	1504
S	skip --Warlock
A	goto	Undercity,84.86,20.34
A	goto	Undercity,67.90,15.28,30
A	link	https://www.youtube.com/watch?v=-Bi95bCN8dM
S	Warlock
T	completewith	next
A	goto	Tirisfal Glades,61.92,64.85,50,0
A	zone	Tirisfal Glades
A	zoneskip	Tirisfal Glades
S	
T	optional	
T	completewith	next
A	complete	375,1
A	mob	Greater Duskbat
A	mob	Vampiric Duskbat
A	isOnQuest	375
S	
T	optional	
A	goto	Tirisfal Glades,47.60,44.03,150
A	isOnQuest	362
S	
T	optional	
T	completewith	MillsOverun
A	collect	2839,1,361
A	accept	361
A	use	2839
A	isOnQuest	362
S	
T	optional	
T	completewith	ThurmanGregor
A	complete	426,1
A	mob	+Rattlecage Soldier
A	mob	+Cracked Skull Soldier
A	complete	426,2
A	mob	+Darkeye Bonecaster
A	isOnQuest	426
S	
T	optional	
T	label	KillDevlin
A	goto	Tirisfal Glades,47.34,40.78
A	complete	362,1
A	mob	Devlin Agamand
A	isOnQuest	362
S	
T	optional	
A	goto	Tirisfal Glades,49.34,36.02
A	complete	354,2
A	mob	Nissa Agamand
A	isOnQuest	354
S	
T	optional	
T	label	ThurmanGregor
T	loop	
A	goto	Tirisfal Glades,45.08,31.15,0
A	goto	Tirisfal Glades,43.71,35.25,60,0
A	goto	Tirisfal Glades,45.03,30.99,60,0
A	goto	Tirisfal Glades,46.79,29.80,60,0
A	goto	Tirisfal Glades,42.82,31.93,60,0
A	goto	Tirisfal Glades,42.82,31.93,60,0
A	goto	Tirisfal Glades,45.08,31.15,60,0
A	complete	354,3
A	unitscan	+Thurman Agamand
A	complete	354,1
A	unitscan	+Gregor Agamand
A	isOnQuest	354
S	
T	loop	
T	label	MillsOverun
A	goto	Tirisfal Glades,45.08,31.15,0
A	goto	Tirisfal Glades,43.71,35.25,60,0
A	goto	Tirisfal Glades,45.03,30.99,60,0
A	goto	Tirisfal Glades,46.79,29.80,60,0
A	goto	Tirisfal Glades,42.82,31.93,60,0
A	goto	Tirisfal Glades,42.82,31.93,60,0
A	goto	Tirisfal Glades,45.08,31.15,60,0
A	complete	426,1
A	mob	+Rattlecage Soldier
A	mob	+Cracked Skull Soldier
A	complete	426,2
A	mob	+Darkeye Bonecaster
A	isOnQuest	426
S	
T	optional	
T	requires	MillsOverun
T	completewith	MaggotEye
A	goto	Tirisfal Glades,54.32,31.56,15,0
A	goto	Tirisfal Glades,54.78,32.75,15,0
A	goto	Tirisfal Glades,55.84,32.28,15,0
A	goto	Tirisfal Glades,56.55,32.43,40,0
A	goto	Tirisfal Glades,57.77,31.69,50
A	isQuestComplete	354
S	
T	optional	
T	requires	MillsOverun
T	completewith	next
A	complete	358,2
A	mob	+Rot Hide Mongrel
A	complete	358,1
A	mob	+Rot Hide Graverobber
A	complete	358,3
A	mob	+Rot Hide Mongrel
A	mob	+Rot Hide Graverobber
A	isOnQuest	358
S	
T	optional	
T	requires	MillsOverun
T	label	MaggotEye
A	goto	Tirisfal Glades,58.66,30.77
A	complete	398,1
A	mob	Maggot Eye
S	
T	loop	
A	goto	Tirisfal Glades,59.54,27.86,0
A	goto	Tirisfal Glades,59.38,29.05,50,0
A	goto	Tirisfal Glades,59.54,27.86,50,0
A	goto	Tirisfal Glades,60.64,28.66,50,0
A	goto	Tirisfal Glades,61.49,29.40,50,0
A	goto	Tirisfal Glades,62.96,29.46,50,0
A	goto	Tirisfal Glades,65.68,30.22,50,0
A	goto	Tirisfal Glades,67.48,28.97,50,0
A	goto	Tirisfal Glades,68.22,26.46,50,0
A	goto	Tirisfal Glades,59.54,27.86,50,0
A	complete	368,1
A	mob	Vile Fin Puddlejumper
A	mob	Vile Fin Minor Oracle
A	mob	Vile Fin Muckdweller
S	
T	optional	
T	completewith	RotHideGnolls
A	complete	375,1
A	mob	Greater Duskbat
A	mob	Vampiric Duskbat
A	isOnQuest	375
S	
T	optional	
T	label	RotHideGnolls
T	loop	
A	goto	Tirisfal Glades,56.43,43.92,0
A	goto	Tirisfal Glades,56.31,39.67,40,0
A	goto	Tirisfal Glades,54.71,41.19,40,0
A	goto	Tirisfal Glades,53.90,43.93,40,0
A	goto	Tirisfal Glades,55.24,42.54,40,0
A	goto	Tirisfal Glades,56.43,43.92,40,0
A	complete	358,2
A	mob	+Rot Hide Mongrel
A	complete	358,1
A	mob	+Rot Hide Graverobber
A	complete	358,3
A	mob	+Rot Hide Mongrel
A	mob	+Rot Hide Graverobber
A	isOnQuest	358
S	
T	optional	
A	goto	Tirisfal Glades,58.19,51.44
A	turnin	426
A	target	Deathguard Dillinger
A	isQuestComplete	426
S	
A	goto	Tirisfal Glades,59.45,52.40
A	turnin	368
A	accept	369
A	target	Apothecary Johaan
S	
T	optional	
A	goto	Tirisfal Glades,59.45,52.40
A	accept	369
A	target	Apothecary Johaan
A	isQuestTurnedIn	368
S	
T	optional	
A	goto	Tirisfal Glades,60.58,51.77
A	turnin	398
A	turnin	370
A	accept	371
A	target	Executor Zygand
A	isQuestComplete	370
S	
T	optional	
A	goto	Tirisfal Glades,60.58,51.77
A	turnin	398
A	target	Executor Zygand
A	isQuestComplete	398
S	
T	optional	
A	goto	Tirisfal Glades,60.58,51.77
A	accept	371
A	target	Executor Zygand
A	isQuestTurnedIn	370
S	
T	optional	
A	goto	Tirisfal Glades,61.26,50.84
A	turnin	358
A	accept	359
A	target	Magistrate Sevren
A	isQuestComplete	358
S	
T	optional	
A	goto	Tirisfal Glades,61.26,50.84
A	accept	359
A	target	Magistrate Sevren
A	isQuestTurnedIn	358
S	
T	completewith	HorrorsandSpirits
S	
T	optional	
A	goto	Tirisfal Glades,61.03,52.35
A	complete	375,2
A	target	Abigail Shiel
A	itemcount	2876,5
A	isOnQuest	375
S	
T	optional	
A	turnin	361
A	target	+Yvette Farthing
A	goto	Tirisfal Glades,61.58,52.60
A	turnin	354
A	turnin	362
A	accept	355
A	target	+Coleman Farthing
A	goto	Tirisfal Glades,61.72,52.29
A	turnin	375
A	target	+Gretchen Dedmar
A	goto	Tirisfal Glades,61.89,52.73
A	isQuestComplete	375
A	isOnQuest	361
A	group	
S	
T	optional	
A	turnin	354
A	turnin	362
A	accept	355
A	target	+Coleman Farthing
A	goto	Tirisfal Glades,61.72,52.29
A	turnin	375
A	target	+Gretchen Dedmar
A	goto	Tirisfal Glades,61.89,52.73
A	isQuestComplete	375
A	group	
S	
T	optional	
A	turnin	361
A	target	+Yvette Farthing
A	goto	Tirisfal Glades,61.58,52.60
A	turnin	354
A	turnin	362
A	accept	355
A	target	+Coleman Farthing
A	goto	Tirisfal Glades,61.72,52.29
A	isOnQuest	361
A	group	
S	
T	optional	
A	turnin	354
A	turnin	362
A	accept	355
A	goto	Tirisfal Glades,61.72,52.29
A	target	Coleman Farthing
A	group	
A	isQuestComplete	354
S	
T	optional	
A	turnin	361
A	target	+Yvette Farthing
A	goto	Tirisfal Glades,61.58,52.60
A	turnin	354
A	turnin	362
A	accept	355
A	target	+Coleman Farthing
A	goto	Tirisfal Glades,61.72,52.29
A	turnin	375
A	target	+Gretchen Dedmar
A	goto	Tirisfal Glades,61.89,52.73
A	isQuestComplete	375
A	isOnQuest	361
S	
T	optional	
A	turnin	354
A	turnin	362
A	accept	355
A	target	+Coleman Farthing
A	goto	Tirisfal Glades,61.72,52.29
A	turnin	375
A	target	+Gretchen Dedmar
A	goto	Tirisfal Glades,61.89,52.73
A	isQuestComplete	375
S	
T	optional	
A	turnin	361
A	target	+Yvette Farthing
A	goto	Tirisfal Glades,61.58,52.60
A	turnin	354
A	turnin	362
A	accept	355
A	target	+Coleman Farthing
A	goto	Tirisfal Glades,61.72,52.29
A	isOnQuest	361
S	
T	optional	
A	turnin	354
A	turnin	362
A	accept	355
A	goto	Tirisfal Glades,61.72,52.29
A	target	Coleman Farthing
A	isQuestComplete	354
S	Warrior
A	goto	Tirisfal Glades,61.72,52.29
A	turnin	1820
A	accept	1821
A	group	
A	isQuestTurnedIn	1819
S	Warrior
A	goto	Tirisfal Glades,61.72,52.29
A	turnin	1820
A	solo	
A	isQuestTurnedIn	1819
S	Priest
A	goto	Tirisfal Glades,61.57,52.19
A	train	588
A	target	Dark Cleric Beryl
A	xp	<12,1
S	Mage
A	goto	Tirisfal Glades,61.97,52.47
A	train	145
A	target	Cain Firesong
A	xp	<12,1
S	Warrior
A	goto	Tirisfal Glades,61.85,52.53
A	train	7384
A	target	Austil de Mon
A	xp	<12,1
S	Rogue
A	goto	Tirisfal Glades,61.75,52.00
A	train	1766
A	target	Marion Call
A	xp	<12,1
S	Warlock
A	goto	Tirisfal Glades,61.59,52.39
A	train	755
A	target	Rupert Boch
A	xp	<12,1
S	!Mage
A	goto	Tirisfal Glades,61.71,52.06
A	vendor	
A	collect	1179,20,359,1 << Mage/Priest/Shaman
A	collect	4605,20,359,1 << Rogue/Warrior
A	collect	1179,15,359,1 << Warlock/Hunter
A	collect	4605,15,359,1 << Warlock/Hunter
A	money	<0.050 << !Warlock !Hunter
A	money	<0.075 << Warlock/Hunter
A	target	Innkeeper Renee
S	
T	optional	
A	goto	Tirisfal Glades,65.49,60.25
A	turnin	359
A	accept	360
A	accept	356
A	target	Deathguard Linnea
A	isQuestTurnedIn	358
A	maxlevel	13
S	
T	optional	
A	goto	Tirisfal Glades,65.49,60.25
A	accept	356
A	target	Deathguard Linnea
A	maxlevel	13
S	
T	optional	
T	completewith	HorrorsandSpirits
A	complete	375,1
A	mob	Greater Duskbat
A	mob	Vampiric Duskbat
A	isOnQuest	375
S	Mage
T	optional	
T	completewith	next
A	complete	356,1
A	mob	+Bleeding Horror
A	complete	356,2
A	mob	+Wandering Spirit
A	isOnQuest	356
S	Mage
A	goto	Tirisfal Glades,77.48,62.00
A	complete	1882,1
S	
T	optional	
T	label	HorrorsandSpirits
T	loop	
A	goto	Tirisfal Glades,74.31,60.98,0
A	goto	Tirisfal Glades,74.31,60.98,50,0
A	goto	Tirisfal Glades,74.45,59.64,50,0
A	goto	Tirisfal Glades,75.08,58.56,50,0
A	goto	Tirisfal Glades,76.45,58.67,50,0
A	goto	Tirisfal Glades,77.41,58.66,50,0
A	goto	Tirisfal Glades,78.55,60.43,50,0
A	goto	Tirisfal Glades,77.45,61.46,50,0
A	goto	Tirisfal Glades,76.79,62.60,50,0
A	goto	Tirisfal Glades,74.99,61.98,50,0
A	complete	356,1
A	mob	+Bleeding Horror
A	complete	356,2
A	mob	+Wandering Spirit
A	isOnQuest	356
S	Priest/Warlock
T	optional	
T	completewith	Scarletrings
A	collect	2589,60,435,1
A	mob	Scarlet Friar
A	mob	Scarlet Zealot
A	isOnQuest	371
S	
T	optional	
T	completewith	next
A	complete	374,1
A	isOnQuest	374
S	
T	optional	
T	loop	
A	goto	Tirisfal Glades,79.82,56.40,0
A	goto	Tirisfal Glades,78.82,56.14,20,0
A	goto	Tirisfal Glades,80.95,57.21,40,0
A	goto	Tirisfal Glades,81.62,54.84,40,0
A	goto	Tirisfal Glades,81.56,53.07,40,0
A	goto	Tirisfal Glades,79.31,55.25,40,0
A	goto	Tirisfal Glades,77.14,54.92,40,0
A	goto	Tirisfal Glades,76.15,55.30,40,0
A	goto	Tirisfal Glades,76.12,57.22,40,0
A	goto	Tirisfal Glades,77.16,56.75,40,0
A	goto	Tirisfal Glades,79.82,56.40,40,0
A	complete	371,1
A	mob	+Captain Vachon
A	complete	371,2
A	mob	+Scarlet Friar
A	isOnQuest	371
S	
T	optional	
T	label	ScarletRings
T	loop	
A	goto	Tirisfal Glades,79.82,56.40,0
A	goto	Tirisfal Glades,80.95,57.21,40,0
A	goto	Tirisfal Glades,81.62,54.84,40,0
A	goto	Tirisfal Glades,81.56,53.07,40,0
A	goto	Tirisfal Glades,79.31,55.25,40,0
A	goto	Tirisfal Glades,77.14,54.92,40,0
A	goto	Tirisfal Glades,76.15,55.30,40,0
A	goto	Tirisfal Glades,76.12,57.22,40,0
A	goto	Tirisfal Glades,77.16,56.75,40,0
A	goto	Tirisfal Glades,79.82,56.40,40,0
A	complete	374,1
A	mob	Scarlet Friar
A	mob	Scarlet Zealot
A	isOnQuest	374
S	Priest/Warlock
T	loop	
A	goto	Tirisfal Glades,79.82,56.40,0
A	goto	Tirisfal Glades,80.95,57.21,40,0
A	goto	Tirisfal Glades,81.62,54.84,40,0
A	goto	Tirisfal Glades,81.56,53.07,40,0
A	goto	Tirisfal Glades,79.31,55.25,40,0
A	goto	Tirisfal Glades,77.14,54.92,40,0
A	goto	Tirisfal Glades,76.15,55.30,40,0
A	goto	Tirisfal Glades,76.12,57.22,40,0
A	goto	Tirisfal Glades,77.16,56.75,40,0
A	goto	Tirisfal Glades,79.82,56.40,40,0
A	collect	2589,60,435,1
A	mob	Scarlet Friar
A	mob	Scarlet Zealot
S	
T	optional	
T	completewith	next
A	complete	375,1
A	mob	Greater Duskbat
A	mob	Vampiric Duskbat
A	isOnQuest	375
S	
T	optional	
T	loop	
A	goto	Tirisfal Glades,85.03,54.72,0
A	goto	Tirisfal Glades,83.50,55.56,30,0
A	goto	Tirisfal Glades,85.03,54.72,30,0
A	goto	Tirisfal Glades,86.56,54.51,30,0
A	goto	Tirisfal Glades,88.06,54.99,30,0
A	goto	Tirisfal Glades,88.94,53.56,30,0
A	goto	Tirisfal Glades,89.70,51.88,30,0
A	goto	Tirisfal Glades,90.92,50.56,30,0
A	goto	Tirisfal Glades,90.87,48.33,30,0
A	goto	Tirisfal Glades,89.87,46.65,30,0
A	goto	Tirisfal Glades,85.04,46.68,30,0
A	goto	Tirisfal Glades,84.52,49.29,30,0
A	goto	Tirisfal Glades,83.46,52.09,30,0
A	complete	369,1
A	mob	Vicious Night Web Spider
A	isOnQuest	369
S	
T	optional	
T	completewith	LinneaTurnin
A	goto	Tirisfal Glades,65.49,60.25,60
A	isQuestComplete	356
S	
T	optional	
T	completewith	next
A	complete	375,1
A	mob	Greater Duskbat
A	mob	Vampiric Duskbat
A	isOnQuest	375
S	
T	optional	
T	label	LinneaTurnin
A	goto	Tirisfal Glades,65.49,60.25
A	turnin	356
A	target	Deathguard Linnea
A	isQuestComplete	356
S	
T	optional	
A	goto	Tirisfal Glades,61.03,52.35
A	complete	375,2
A	target	Abigail Shiel
A	itemcount	2876,5
A	isOnQuest	375
S	
T	optional	
A	turnin	374
A	target	+Deathguard Burgess
A	goto	Tirisfal Glades,60.93,52.01
A	turnin	371
A	target	+Executor Zygand
A	goto	Tirisfal Glades,60.58,51.77
A	turnin	360
A	turnin	355
A	accept	408
A	target	+Magistrate Sevren
A	goto	Tirisfal Glades,61.26,50.84
A	turnin	369
A	accept	492
A	accept	445
A	target	+Apothecary Johaan
A	goto	Tirisfal Glades,59.45,52.39
A	isQuestComplete	371
A	isQuestComplete	374
A	group	
S	
T	optional	
A	turnin	374
A	target	+Deathguard Burgess
A	goto	Tirisfal Glades,60.93,52.01
A	turnin	371
A	target	+Executor Zygand
A	goto	Tirisfal Glades,60.58,51.77
A	turnin	360
A	turnin	355
A	target	+Magistrate Sevren
A	goto	Tirisfal Glades,61.26,50.84
A	turnin	369
A	accept	492
A	accept	445
A	target	+Apothecary Johaan
A	goto	Tirisfal Glades,59.45,52.39
A	isQuestComplete	371
A	isQuestComplete	374
S	
T	optional	
A	turnin	360
A	turnin	355
A	accept	408
A	target	+Magistrate Sevren
A	goto	Tirisfal Glades,61.26,50.84
A	turnin	369
A	accept	492
A	accept	445
A	target	+Apothecary Johaan
A	goto	Tirisfal Glades,59.45,52.39
A	isOnQuest	360
A	isQuestComplete	369
A	group	
S	
T	optional	
A	turnin	360
A	turnin	355
A	target	+Magistrate Sevren
A	goto	Tirisfal Glades,61.26,50.84
A	turnin	369
A	accept	492
A	accept	445
A	target	+Apothecary Johaan
A	goto	Tirisfal Glades,59.45,52.39
A	isOnQuest	360
A	isQuestComplete	369
S	
A	goto	Tirisfal Glades,59.45,52.39
A	turnin	369
A	accept	492
A	accept	445
A	target	Apothecary Johaan
S	
T	optional	
A	goto	Tirisfal Glades,61.89,52.73
A	turnin	375
A	target	Gretchen Dedmar
A	isQuestComplete	375
S	Priest
A	goto	Tirisfal Glades,61.57,52.19
A	train	588,1
A	target	Dark Cleric Beryl
A	xp	<12,1
S	Mage
A	goto	Tirisfal Glades,61.97,52.47
A	train	145,1
A	target	Cain Firesong
A	xp	<12,1
S	Warrior
A	goto	Tirisfal Glades,61.85,52.53
A	train	7384,1
A	target	Austil de Mon
A	xp	<12,1
S	Rogue
A	goto	Tirisfal Glades,61.75,52.00
A	train	1766,1
A	target	Marion Call
A	xp	<12,1
S	Warlock
A	goto	Tirisfal Glades,61.59,52.39
A	train	755,1
A	target	Rupert Boch
A	xp	<12,1
S	
A	goto	Tirisfal Glades,47.39,43.64,150,0
A	goto	Tirisfal Glades,52.23,26.91,20,0
A	goto	Tirisfal Glades,52.29,26.40,8
A	isOnQuest	408
A	group	
S	Warrior
T	completewith	CaptainDargol
A	complete	1821,1
A	complete	1821,2
A	complete	1821,3
A	complete	1821,4
A	isOnQuest	1821
A	group	2
S	
T	completewith	next
A	complete	408,1
A	mob	+Wailing Ancestor
A	complete	408,2
A	mob	+Rotting Ancestor
A	isOnQuest	408
A	group	2
S	
T	label	CaptainDargol
A	goto	Tirisfal Glades,52.53,26.78,8,0
A	goto	Tirisfal Glades,52.08,26.81,8,0
A	goto	Tirisfal Glades,52.03,26.43,8,0
A	goto	Tirisfal Glades,52.81,26.36
A	complete	408,3
A	mob	Captain Dargol
A	isOnQuest	408
A	group	2
S	Warrior
T	completewith	next
A	complete	1821,1
A	complete	1821,2
A	complete	1821,3
A	complete	1821,4
A	isOnQuest	1821
A	group	2
S	
T	loop	
A	goto	Tirisfal Glades,51.90,26.87,0
A	goto	Tirisfal Glades,51.88,25.86,15,0
A	goto	Tirisfal Glades,52.61,25.85,15,0
A	goto	Tirisfal Glades,52.60,26.88,15,0
A	goto	Tirisfal Glades,51.90,26.87,15,0
A	complete	408,1
A	mob	+Wailing Ancestor
A	complete	408,2
A	mob	+Rotting Ancestor
A	isOnQuest	408
A	group	2
S	Warrior
T	loop	
A	goto	Tirisfal Glades,52.66,25.87,0
A	goto	Tirisfal Glades,51.70,25.69,12,0
A	goto	Tirisfal Glades,52.62,25.62,12,0
A	goto	Tirisfal Glades,52.65,27.02,12,0
A	goto	Tirisfal Glades,51.89,27.10,12,0
A	goto	Tirisfal Glades,52.66,25.87,12,0
A	complete	1821,1
A	complete	1821,2
A	complete	1821,3
A	complete	1821,4
A	isOnQuest	1821
A	group	2
S	skip
A	goto	Tirisfal Glades,51.68,25.67
A	goto	Tirisfal Glades,56.24,49.42,30
A	link	https://www.youtube.com/watch?v=bH_NYmWf8Lc&ab
A	isQuestComplete	408
A	group	
S	
T	completewith	NewPlagueFinal
A	subzone	159
A	group	
S	
A	goto	Tirisfal Glades,61.26,50.84
A	turnin	408
A	target	Magistrate Sevren
A	isQuestComplete	408
A	group	
S	Warrior
A	goto	Tirisfal Glades,61.72,52.29
A	turnin	1821
A	target	Coleman Farthing
A	isQuestComplete	1821
A	group	
S	Warrior
A	goto	Tirisfal Glades,61.72,52.29
A	turnin	1822
A	target	Coleman Farthing
A	isQuestTurnedIn	1821
A	group	
S	
T	optional	
A	goto	Tirisfal Glades,61.97,51.29
A	turnin	407
A	target	Captured Scarlet Zealot
A	isOnQuest	407
S	
T	label	NewPlagueFinal
T	optional	
A	goto	Tirisfal Glades,61.94,51.40
A	turnin	492
A	target	Captured Mountaineer
A	isOnQuest	492
S	Priest
A	goto	Tirisfal Glades,61.57,52.19
A	train	588,1
A	target	Dark Cleric Beryl
A	xp	<12,1
A	xp	>14,1
S	Priest
T	optional	
A	goto	Tirisfal Glades,61.57,52.19
A	train	6074
A	target	Dark Cleric Beryl
A	xp	<14,1
S	Mage
A	goto	Tirisfal Glades,61.97,52.47
A	train	145,1
A	target	Cain Firesong
A	xp	<12,1
A	xp	>14,1
S	Mage
T	optional	
A	goto	Tirisfal Glades,61.97,52.47
A	train	2137
A	target	Cain Firesong
A	xp	<14,1
S	Warrior
A	goto	Tirisfal Glades,61.85,52.53
A	train	7384,1
A	target	Austil de Mon
A	xp	<12,1
A	xp	>14,1
S	Warrior
T	optional	
A	goto	Tirisfal Glades,61.85,52.53
A	train	1160
A	target	Austil de Mon
A	xp	<14,1
S	Rogue
A	goto	Tirisfal Glades,61.75,52.00
A	train	1766,1
A	target	Marion Call
A	xp	<12,1
A	xp	>14,1
S	Rogue
T	optional	
A	goto	Tirisfal Glades,61.75,52.00
A	train	1758
A	target	Marion Call
A	xp	<14,1
S	Warlock
A	goto	Tirisfal Glades,61.59,52.39
A	train	755,1
A	target	Rupert Boch
A	xp	<12,1
A	xp	>14,1
S	Warlock
T	optional	
A	goto	Tirisfal Glades,61.59,52.39
A	train	6222
A	target	Rupert Boch
A	xp	<14,1
S	Mage
T	completewith	next
A	goto	Tirisfal Glades,61.80,65.06,20,0
A	zone	Undercity
A	zoneskip	Undercity
S	Mage
T	completewith	next
A	goto	Undercity,66.09,20.06,20,0
A	goto	Undercity,64.37,23.94,20,0
A	goto	Undercity,65.93,26.71,10,0
A	goto	Undercity,65.89,34.03,10,0
A	goto	Undercity,64.22,39.77,10,0
A	goto	Undercity,65.53,43.62,15
S	Mage
A	goto	Undercity,85.12,10.07
A	turnin	1882
A	target	Anastasia Hartwell
S	Rogue
T	completewith	Swordtraining3
A	goto	Tirisfal Glades,61.80,65.06,20,0
A	zone	Undercity
A	zoneskip	Undercity
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
S	Rogue
T	completewith	Swordtraining3
A	goto	Undercity,66.09,20.06,20,0
A	goto	Undercity,64.37,23.94,20,0
A	goto	Undercity,65.93,26.71,10,0
A	goto	Undercity,65.89,34.03,10,0
A	goto	Undercity,64.22,39.77,10,0
A	goto	Undercity,65.53,43.62,15
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
S	!Undead
T	completewith	UCflightpath3
A	goto	Tirisfal Glades,61.80,65.06,20,0
A	zone	Undercity
A	zoneskip	Undercity
S	!Undead
T	completewith	UCflightpath3
A	goto	Undercity,66.09,20.06,20,0
A	goto	Undercity,64.37,23.94,20,0
A	goto	Undercity,65.93,26.71,10,0
A	goto	Undercity,65.89,34.03,10,0
A	goto	Undercity,64.22,39.77,10,0
A	goto	Undercity,65.53,43.62,15
S	!Undead
T	label	UCflightpath3
A	goto	Undercity,63.25,48.56
A	fp	Undercity
A	target	Michael Garrett
S	Orc Rogue/Troll Rogue
T	ssf	
T	optional	
T	label	RogueCutlass3
A	goto	Undercity,61.15,40.89
A	collect	851,1
A	money	<0.2023
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
A	target	Louis Warren
A	zoneskip	Undercity,1
S	Orc Rogue/Troll Rogue
T	ah	
T	optional	
T	label	RogueCutlass3
A	goto	Undercity,61.15,40.89
A	collect	851,1
A	money	<0.2023
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
A	target	Louis Warren
A	zoneskip	Undercity,1
S	Rogue
T	label	Swordtraining3
A	goto	Undercity,57.29,32.72
A	train	201
A	target	Archibald
A	money	<0.1
A	zoneskip	Undercity,1
S	Rogue
A	goto	Undercity,77.08,49.40
A	collect	851,1,435,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
A	target	Charles Seaton
S	Rogue
T	optional	
T	completewith	Entersilverpine
A	use	851
A	itemcount	851,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
S	Undead Warrior
T	completewith	Entersilverpine
A	goto	Tirisfal Glades,61.80,65.06,20,0
A	zone	Undercity
A	zoneskip	Undercity
A	money	<0.3022
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.0
S	Undead Warrior
T	completewith	Entersilverpine
A	goto	Undercity,66.09,20.06,20,0
A	goto	Undercity,64.37,23.94,20,0
A	goto	Undercity,65.93,26.71,10,0
A	goto	Undercity,65.89,34.03,10,0
A	goto	Undercity,64.22,39.77,10,0
A	goto	Undercity,65.53,43.62,15
A	money	<0.3022
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.0
S	Troll Warrior/Undead Warrior/Tauren Shaman/Troll Shaman/Orc Shaman
A	goto	Undercity,58.82,32.83
A	collect	854,1,435,1
A	money	<0.3022
A	target	Benijah Fenner
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.0
S	Troll Warrior/Undead Warrior/Tauren Shaman/Troll Shaman/Orc Shaman
T	optional	
T	completewith	Entersilverpine
A	use	854
A	itemcount	854,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.0
S	
T	optional	
T	ah	
A	goto	Undercity,64.20,49.60
A	collect	3164,6,429,1
A	target	Auctioneer Rhyker
A	zoneskip	Undercity,1
S	Priest
A	goto	Undercity,62.47,61.80
A	train	7411
A	target	Lavinia Crowe
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3
S	Priest/Warlock
A	goto	Undercity,70.06,29.84
A	train	3908
A	target	Victor Ward
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3
S	Priest/Warlock
A	goto	Undercity,70.76,30.67
A	collect	2996,30,435,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3
S	Priest/Warlock
A	goto	Undercity,70.06,29.84
A	train	7623
A	target	Victor Ward
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3
S	Priest/Warlock
A	goto	Undercity,70.57,30.17
A	collect	2320,30,435,1
A	target	Millie Gregorian
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3
S	Priest/Warlock
A	collect	6238,9,398,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3
S	Priest/Warlock
A	goto	Undercity,62.35,60.99
A	collect	6218,1,435,1
A	collect	4470,1,435,1
A	target	Thaddeus Webb
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3
S	Priest/Warlock
A	goto	Undercity,62.54,60.34
A	train	14293
A	target	Malcomb Wynn
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3
S	Priest/Warlock
A	collect	11287,1,435,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3
S	Priest/Warlock
T	optional	
T	completewith	Entersilverpine
A	use	11287
A	itemcount	11287,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3
S	
T	optional	
A	abandon	806
A	isOnQuest	806
S	
T	optional	
A	abandon	408
A	isOnQuest	408
S	Warrior
T	optional	
A	abandon	1821
A	isOnQuest	1821
S	Shaman/Hunter
T	optional	
A	abandon	816
S	
T	label	LeaveUndercity3
A	goto	Undercity,47.25,39.12,50,0
A	goto	Undercity,46.35,43.86,10,0
A	goto	Undercity,45.24,39.35,10,0
A	goto	Undercity,41.32,38.40,10,0
A	goto	Undercity,40.74,33.95,10,0
A	goto	Undercity,34.80,33.19,15,0
A	goto	Undercity,27.39,30.23,35,0
A	goto	Undercity,21.89,43.35,35,0
A	goto	Tirisfal Glades,51.10,71.53,50,0
A	zone	Tirisfal Glades
A	zoneskip	Tirisfal Glades
A	zoneskip	Silverpine Forest
S	
T	label	Entersilverpine
A	zone	Silverpine Forest
A	zoneskip	Silverpine Forest
E
G	Guides/SurvivalGuide/H-Classic-Horde-01-13_Undead.lua
M	hardcore	
M	classic	
M	tbc	
M	selector	Horde
M	name	1-6 Undead
M	version	1
M	group	RestedXP Survival Guide (H)
M	subgroup	RXP Survival Guide 1-20
M	defaultfor	Undead
M	next	6-13 Undead
S	!Undead
T	completewith	next
S	
T	completewith	Zombies
A	destroy	6948
S	
T	completewith	next
A	goto	Tirisfal Glades,30.04,72.78,8,0
A	goto	Tirisfal Glades,30.27,72.78,8,0
A	goto	Tirisfal Glades,30.22,71.65,10
S	
A	goto	Tirisfal Glades,30.22,71.65
A	accept	363
A	target	Undertaker Mordo
S	Warrior/Warlock/Priest/Mage
T	completewith	Vendor
A	goto	Tirisfal Glades,30.70,69.28,0 << Warrior/Warlock
A	goto	Tirisfal Glades,29.92,70.30,40,0
A	goto	Tirisfal Glades,30.70,69.28,40,0
A	goto	Tirisfal Glades,29.18,68.94,40,0 << Priest/Mage
A	goto	Tirisfal Glades,29.10,67.66,40,0 << Priest/Mage
A	goto	Tirisfal Glades,30.19,65.32,40,0 << Priest/Mage
A	mob	Young Scavenger
A	mob	Duskbat
A	money	>0.01
S	Warrior/Priest/Mage
T	completewith	Training1
A	goto	Tirisfal Glades,32.22,65.64,8
S	Priest/Mage
T	label	Vendor
A	goto	Tirisfal Glades,32.29,65.44
A	vendor	
A	collect	159,10,383,1
A	target	Joshua Kien
S	Warlock/Mage
T	sticky	
T	label	Piercing
A	accept	1470
A	goto	Tirisfal Glades,30.98,66.41 << Warlock
A	target	+Venya Marthand << Warlock
A	turnin	363
A	accept	364
A	target	+Shadow Priest Sarvis
A	goto	Tirisfal Glades,30.84,66.20
S	Warlock/Mage
A	goto	Tirisfal Glades,31.35,66.21,10,0
A	accept	376
A	goto	Tirisfal Glades,30.86,66.05
A	target	Novice Elreth
A	xp	<2,1
S	Mage
T	requires	Percing
A	goto	Tirisfal Glades,30.94,66.06
A	train	1459
A	target	Isabella
S	Warlock
T	label	Vendor
A	goto	Tirisfal Glades,30.81,66.41
A	vendor	
A	target	Kayla Smithe
A	money	>0.1
S	Warlock
A	goto	Tirisfal Glades,30.91,66.34
A	train	348
A	target	Maximillion
S	!Warlock !Mage
A	goto	Tirisfal Glades,31.35,66.21,10,0
A	goto	Tirisfal Glades,30.84,66.20
A	turnin	363
A	accept	364
A	target	Shadow Priest Sarvis
S	!Warlock !Mage
A	accept	376
A	goto	Tirisfal Glades,30.86,66.05
A	target	Novice Elreth
A	xp	<2,1
S	Warrior
T	completewith	next
T	label	Vendor
A	goto	Tirisfal Glades,32.42,65.66
A	vendor	
A	target	Archibald Kava
A	money	>0.1
S	Warrior
T	label	Training1
A	goto	Tirisfal Glades,32.68,65.56
A	train	6673
A	target	Dannal Stern
S	Warlock
T	requires	Piercing
T	loop	
A	goto	Tirisfal Glades,31.82,61.48,0
A	goto	Tirisfal Glades,31.82,61.48,30,0
A	goto	Tirisfal Glades,31.11,60.71,30,0
A	goto	Tirisfal Glades,32.07,60.17,30,0
A	goto	Tirisfal Glades,32.26,59.21,30,0
A	goto	Tirisfal Glades,33.28,59.53,30,0
A	goto	Tirisfal Glades,33.66,60.76,30,0
A	goto	Tirisfal Glades,33.94,61.81,30,0
A	goto	Tirisfal Glades,34.21,63.05,30,0
A	goto	Tirisfal Glades,33.01,63.01,30,0
A	complete	1470,1
A	mob	Rattlecage Skeleton
S	Warlock
T	completewith	next
A	mob	Mindless Zombie
A	mob	Wretched Zombie
A	money	>0.0025
S	Warlock
A	goto	Tirisfal Glades,32.23,65.59,8,0
A	goto	Tirisfal Glades,32.29,65.44
A	collect	159,5,383,1
A	target	Joshua Kien
A	isOnQuest	1470
S	Warlock
A	goto	Tirisfal Glades,31.35,66.21,10,0
A	goto	Tirisfal Glades,30.98,66.41
A	turnin	1470
A	target	Venya Marthand
S	Warlock
T	completewith	next
A	cast	688
S	
T	label	Zombies
T	requires	Piercing << Warlock/Mage
T	loop	
A	goto	Tirisfal Glades,31.72,63.98,0
A	goto	Tirisfal Glades,31.72,63.98,40,0
A	goto	Tirisfal Glades,30.69,63.88,40,0
A	goto	Tirisfal Glades,30.90,62.20,40,0
A	goto	Tirisfal Glades,30.73,61.66,40,0
A	goto	Tirisfal Glades,31.14,61.41,40,0
A	goto	Tirisfal Glades,31.80,61.83,40,0
A	goto	Tirisfal Glades,32.85,63.02,40,0
A	goto	Tirisfal Glades,32.90,63.54,40,0
A	goto	Tirisfal Glades,33.41,63.06,40,0
A	goto	Tirisfal Glades,33.75,62.86,40,0
A	goto	Tirisfal Glades,33.51,63.82,40,0
A	goto	Tirisfal Glades,33.55,64.57,40,0
A	goto	Tirisfal Glades,33.29,64.96,40,0
A	complete	364,1
A	mob	+Mindless Zombie
A	complete	364,2
A	mob	+Wretched Zombie
S	Mage/Warlock/Priest
T	completewith	Vendor2
A	mob	Mindless Zombie
A	mob	Wretched Zombie
A	money	>0.0033
S	Mage/Warlock/Priest
A	goto	Tirisfal Glades,32.23,65.59,8,0
A	goto	Tirisfal Glades,32.29,65.44
A	collect	159,10,383,1
A	vendor	
A	target	Joshua Kien
A	isOnQuest	364
A	money	<0.0050
A	itemcount	159,<10
S	Mage/Warlock/Priest
T	label	Vendor2
A	goto	Tirisfal Glades,32.23,65.59,8,0
A	goto	Tirisfal Glades,32.29,65.44
A	collect	159,5,383,1
A	vendor	
A	target	Joshua Kien
A	isOnQuest	364
A	money	>0.0050
A	itemcount	159,<5
S	
A	turnin	364
A	accept	3095
A	accept	3096
A	accept	3097
A	accept	3098
A	accept	3099
A	accept	3901
A	target	+Shadow Priest Sarvis
A	goto	Tirisfal Glades,31.35,66.21,10,0
A	goto	Tirisfal Glades,30.84,66.20
A	accept	376
A	target	+Novice Elreth
A	goto	Tirisfal Glades,30.86,66.05
A	turnin	3099
A	goto	Tirisfal Glades,30.91,66.34 << Warlock
A	target	+Maximillion << Warlock
A	turnin	3098
A	goto	Tirisfal Glades,30.94,66.06 << Mage
A	target	+Isabella << Mage
A	turnin	3097
A	target	+Dark Cleric Duesten << Priest
A	goto	Tirisfal Glades,31.11,66.02 << Priest
S	Mage/Warlock/Priest
A	goto	Tirisfal Glades,32.23,65.59,8,0
A	goto	Tirisfal Glades,32.29,65.44
A	collect	159,10,383,1
A	target	Joshua Kien
A	isOnQuest	364
S	
T	loop	
A	goto	Tirisfal Glades,34.32,56.79,0
A	goto	Tirisfal Glades,29.21,66.68,40,0
A	goto	Tirisfal Glades,29.48,65.70,40,0
A	goto	Tirisfal Glades,29.60,64.04,40,0
A	goto	Tirisfal Glades,29.67,63.39,40,0
A	goto	Tirisfal Glades,30.09,61.51,40,0
A	goto	Tirisfal Glades,30.97,59.66,40,0
A	goto	Tirisfal Glades,31.61,58.57,40,0
A	goto	Tirisfal Glades,32.07,57.74,40,0
A	goto	Tirisfal Glades,32.85,58.35,40,0
A	goto	Tirisfal Glades,34.32,56.79,40,0
A	complete	376,1
A	mob	+Young Scavenger
A	mob	+Ragged Scavenger
A	complete	376,2
A	mob	+Duskbat
A	mob	+Mangy Duskbat
S	
T	loop	
A	goto	Tirisfal Glades,31.82,61.48,0
A	goto	Tirisfal Glades,31.82,61.48,30,0
A	goto	Tirisfal Glades,31.11,60.71,30,0
A	goto	Tirisfal Glades,32.07,60.17,30,0
A	goto	Tirisfal Glades,32.26,59.21,30,0
A	goto	Tirisfal Glades,33.28,59.53,30,0
A	goto	Tirisfal Glades,33.66,60.76,30,0
A	goto	Tirisfal Glades,33.94,61.81,30,0
A	goto	Tirisfal Glades,34.21,63.05,30,0
A	goto	Tirisfal Glades,33.01,63.01,30,0
A	complete	3901,1
A	mob	Rattlecage Skeleton
S	
T	som--xpgate	
T	loop	
A	goto	Tirisfal Glades,31.82,61.48,30,0
A	goto	Tirisfal Glades,31.11,60.71,30,0
A	goto	Tirisfal Glades,32.07,60.17,30,0
A	goto	Tirisfal Glades,32.26,59.21,30,0
A	goto	Tirisfal Glades,33.28,59.53,30,0
A	goto	Tirisfal Glades,33.66,60.76,30,0
A	goto	Tirisfal Glades,33.94,61.81,30,0
A	goto	Tirisfal Glades,34.21,63.05,30,0
A	goto	Tirisfal Glades,33.01,63.01,30,0
A	xp	3+480
A	xp	3+560
A	mob	Mindless Zombie
A	mob	Wretched Zombie
S	
T	era	
T	loop	
A	goto	Tirisfal Glades,31.82,61.48,30,0
A	goto	Tirisfal Glades,31.11,60.71,30,0
A	goto	Tirisfal Glades,32.07,60.17,30,0
A	goto	Tirisfal Glades,32.26,59.21,30,0
A	goto	Tirisfal Glades,33.28,59.53,30,0
A	goto	Tirisfal Glades,33.66,60.76,30,0
A	goto	Tirisfal Glades,33.94,61.81,30,0
A	goto	Tirisfal Glades,34.21,63.05,30,0
A	goto	Tirisfal Glades,33.01,63.01,30,0
A	xp	3+940
A	xp	3+980
A	mob	Mindless Zombie
A	mob	Wretched Zombie
S	Mage/Warlock/Priest
A	goto	Tirisfal Glades,32.25,65.59,8,0
A	goto	Tirisfal Glades,32.29,65.44
A	collect	159,15,380,1
A	target	Joshua Kien
A	money	>0.0075
A	isOnQuest	3901
A	itemcount	159,<20
S	
A	turnin	3901
A	target	+Shadow Priest Sarvis
A	goto	Tirisfal Glades,31.35,66.21,10,0
A	goto	Tirisfal Glades,30.84,66.20
A	turnin	376
A	accept	6395
A	target	+Novice Elreth
A	goto	Tirisfal Glades,30.86,66.05
S	Priest
A	goto	Tirisfal Glades,31.11,66.02
A	train	589
A	target	Dark Cleric Duesten
A	money	<0.021
S	Priest
A	goto	Tirisfal Glades,31.11,66.02
A	train	2052
A	train	589
A	target	Dark Cleric Duesten
A	money	<0.02
S	Priest
A	goto	Tirisfal Glades,31.11,66.02
A	train	1243
A	train	589
A	target	Dark Cleric Duesten
A	money	<0.011
S	Priest
A	goto	Tirisfal Glades,31.11,66.02
A	train	589
A	target	Dark Cleric Duesten
A	money	<0.01
S	Warlock
A	goto	Tirisfal Glades,30.91,66.34
A	train	172
A	target	Maximillion
S	Mage
A	goto	Tirisfal Glades,30.94,66.06
A	train	116
A	target	Isabella
S	
A	goto	Tirisfal Glades,31.35,66.21,10,0
A	accept	3902
A	target	+Deathguard Saltain
A	goto	Tirisfal Glades,31.61,65.62
A	accept	380
A	target	+Executor Arren
A	goto	Tirisfal Glades,32.15,66.01
S	Rogue/Warrior
A	goto	Tirisfal Glades,32.42,65.66
A	vendor	
A	target	Archibald Kava
A	money	>0.1
A	isOnQuest	3095 << Warrior
A	isOnQuest	3096 << Rogue
S	Warrior
A	goto	Tirisfal Glades,32.68,65.56
A	turnin	3095
A	train	100
A	train	772
A	target	Dannal Stern
A	money	<0.02
S	Warrior
T	label	Training2
A	goto	Tirisfal Glades,32.68,65.56
A	turnin	3095
A	train	772
A	target	Dannal Stern
A	money	<0.01
S	Rogue
A	goto	Tirisfal Glades,32.53,65.65
A	turnin	3096
A	train	53
A	money	<0.04
A	target	David Trias
S	Rogue
T	label	Training2
A	goto	Tirisfal Glades,32.53,65.65
A	turnin	3096
A	target	David Trias
S	
T	loop	
A	goto	Tirisfal Glades,32.37,64.37,0
A	goto	Tirisfal Glades,32.37,64.37,12,0
A	goto	Tirisfal Glades,32.81,64.39,12,0
A	goto	Tirisfal Glades,32.89,64.60,12,0
A	goto	Tirisfal Glades,33.01,65.38,12,0
A	goto	Tirisfal Glades,33.79,64.57,12,0
A	goto	Tirisfal Glades,33.13,63.08,12,0
A	goto	Tirisfal Glades,32.79,63.11,12,0
A	goto	Tirisfal Glades,31.86,61.49,12,0
A	goto	Tirisfal Glades,31.75,61.96,12,0
A	goto	Tirisfal Glades,31.70,62.53,12,0
A	goto	Tirisfal Glades,31.34,62.44,12,0
A	complete	3902,1
S	
T	loop	
A	goto	Tirisfal Glades,29.94,57.33,0
A	goto	Tirisfal Glades,29.94,57.33,40,0
A	goto	Tirisfal Glades,29.82,56.03,40,0
A	goto	Tirisfal Glades,29.25,55.77,40,0
A	goto	Tirisfal Glades,28.40,56.51,40,0
A	goto	Tirisfal Glades,27.68,57.10,40,0
A	goto	Tirisfal Glades,28.29,58.31,40,0
A	goto	Tirisfal Glades,28.25,59.41,40,0
A	goto	Tirisfal Glades,28.80,59.53,40,0
A	goto	Tirisfal Glades,29.29,59.40,40,0
A	goto	Tirisfal Glades,29.67,58.53,40,0
A	complete	380,1,6
A	mob	Young Night Web Spider
S	
T	loop	
A	goto	Tirisfal Glades,28.25,58.27,0
A	goto	Tirisfal Glades,28.25,58.27,25,0
A	goto	Tirisfal Glades,28.42,59.07,25,0
A	goto	Tirisfal Glades,27.86,60.57,25,0
A	goto	Tirisfal Glades,27.17,59.18,25,0
A	goto	Tirisfal Glades,27.30,57.97,25,0
A	goto	Tirisfal Glades,26.94,56.42,25,0
A	goto	Tirisfal Glades,27.51,56.00,25,0
A	complete	380,1
A	mob	Young Night Web Spider
S	
T	completewith	next
A	goto	Tirisfal Glades,26.80,59.40,15,0
A	goto	Tirisfal Glades,26.31,59.60,30
S	
T	loop	
A	goto	Tirisfal Glades,24.68,59.54,0
A	goto	Tirisfal Glades,26.31,59.60,30,0
A	goto	Tirisfal Glades,25.61,59.55,20,0
A	goto	Tirisfal Glades,25.11,60.33,20,0
A	goto	Tirisfal Glades,24.18,60.77,20,0
A	goto	Tirisfal Glades,23.23,59.91,20,0
A	goto	Tirisfal Glades,23.89,58.36,20,0
A	goto	Tirisfal Glades,24.68,59.54,20,0
A	complete	380,2
A	mob	Night Web Spider
S	Warlock
T	softcore	
T	completewith	ScarletC
A	cast	688
S	skip
T	hardcore	
T	completewith	next
A	link	https://www.youtube.com/watch?v=AOAlX9B5aO0
A	link	/camp
A	goto	Tirisfal Glades,31.08,64.88,30
S	
T	label	Scavenging
A	goto	Tirisfal Glades,31.61,65.62
A	turnin	3902
A	target	Deathguard Saltain
S	
T	sticky	
T	label	NightWebH
A	goto	Tirisfal Glades,32.15,66.01,0,0
A	turnin	380
A	accept	381
A	target	Executor Arren
S	Rogue/Warrior
A	goto	Tirisfal Glades,32.42,65.66
A	vendor	
A	target	Archibald Kava
A	isOnQuest	6395
S	Warlock/Mage/Priest
A	goto	Tirisfal Glades,32.29,65.44
A	collect	159,15,383,1 << Warlock/Mage/Priest
A	vendor	
A	target	Joshua Kien
A	isOnQuest	6395
A	itemcount	159,<15
S	
T	requires	NightWebH
T	loop	
A	goto	Tirisfal Glades,36.13,68.74,0
A	goto	Tirisfal Glades,36.13,68.74,40,0
A	goto	Tirisfal Glades,36.46,69.49,40,0
A	goto	Tirisfal Glades,36.85,70.02,40,0
A	goto	Tirisfal Glades,37.42,69.58,40,0
A	goto	Tirisfal Glades,38.05,69.79,40,0
A	goto	Tirisfal Glades,37.91,69.22,40,0
A	goto	Tirisfal Glades,38.03,68.77,40,0
A	goto	Tirisfal Glades,38.49,68.28,40,0
A	goto	Tirisfal Glades,38.72,67.07,40,0
A	goto	Tirisfal Glades,38.59,66.25,40,0
A	goto	Tirisfal Glades,38.65,65.07,40,0
A	goto	Tirisfal Glades,37.62,65.36,40,0
A	goto	Tirisfal Glades,36.93,65.38,40,0
A	goto	Tirisfal Glades,36.51,65.42,40,0
A	goto	Tirisfal Glades,36.85,66.59,40,0
A	goto	Tirisfal Glades,37.45,67.95,40,0
A	goto	Tirisfal Glades,36.93,68.16,40,0
A	complete	381,1
A	mob	Scarlet Initiate
A	mob	Scarlet Convert
S	
A	goto	Tirisfal Glades,36.69,61.67
A	collect	16333,1,6395,1
A	mob	Samuel Fipps
S	
A	goto	Tirisfal Glades,31.17,65.08
A	complete	6395,1
S	Warlock
T	softcore	
T	completewith	ScarletC
A	cast	688
S	
A	turnin	6395
A	target	+Novice Elreth
A	goto	Tirisfal Glades,31.35,66.21,10,0
A	goto	Tirisfal Glades,30.86,66.05
A	accept	5651
A	target	+Dark Cleric Duesten << Priest
A	goto	Tirisfal Glades,31.11,66.02 << Priest
S	
T	sticky	
T	label	ScarletC
A	goto	Tirisfal Glades,32.15,66.01,0,0
A	turnin	381
A	accept	382
A	target	Executor Arren
S	
A	goto	Tirisfal Glades,32.42,65.66
A	vendor	
A	target	Archibald Kava
S	
T	requires	ScarletC
A	goto	Tirisfal Glades,36.50,68.82
A	complete	382,1
A	mob	Meven Korgal
S	
A	goto	Tirisfal Glades,32.15,66.01
A	turnin	382
A	accept	383
A	target	Executor Arren
S	
T	loop	
A	goto	Tirisfal Glades,34.08,59.51,50,0
A	goto	Tirisfal Glades,35.34,56.55,50,0
A	goto	Tirisfal Glades,36.83,56.85,50,0
A	goto	Tirisfal Glades,37.76,59.38,50,0
A	goto	Tirisfal Glades,37.51,62.99,50,0
A	goto	Tirisfal Glades,36.13,68.74,50,0
A	goto	Tirisfal Glades,36.46,69.49,50,0
A	goto	Tirisfal Glades,36.85,70.02,50,0
A	goto	Tirisfal Glades,37.42,69.58,50,0
A	goto	Tirisfal Glades,38.05,69.79,50,0
A	goto	Tirisfal Glades,37.91,69.22,50,0
A	goto	Tirisfal Glades,38.03,68.77,50,0
A	goto	Tirisfal Glades,38.49,68.28,50,0
A	goto	Tirisfal Glades,38.72,67.07,50,0
A	goto	Tirisfal Glades,38.59,66.25,50,0
A	goto	Tirisfal Glades,38.65,65.07,50,0
A	goto	Tirisfal Glades,37.62,65.36,50,0
A	goto	Tirisfal Glades,36.93,65.38,50,0
A	goto	Tirisfal Glades,36.51,65.42,50,0
A	goto	Tirisfal Glades,36.85,66.59,50,0
A	goto	Tirisfal Glades,37.45,67.95,50,0
A	goto	Tirisfal Glades,36.93,68.16,50,0
A	goto	Tirisfal Glades,36.13,68.74,50,0
A	xp	5+2350
S	
A	goto	Tirisfal Glades,38.24,56.77
A	accept	8
A	target	Calvin Montague
E
G	Guides/SurvivalGuide/H-Classic-Horde-01-13_Undead.lua
M	hardcore	
M	classic	
M	tbc	
M	selector	Horde
M	name	6-13 Undead
M	version	1
M	group	RestedXP Survival Guide (H)
M	subgroup	RXP Survival Guide 1-20
M	defaultfor	Undead
M	next	13-15 Silverpine Forest
S	
A	goto	Tirisfal Glades,40.91,54.17
A	accept	365
A	target	Deathguard Simmer
S	
T	loop	
A	goto	Tirisfal Glades,56.13,52.48,0
A	goto	Tirisfal Glades,40.77,54.42,0
A	goto	Tirisfal Glades,40.77,54.42,40,0
A	goto	Tirisfal Glades,42.04,55.11,40,0
A	goto	Tirisfal Glades,43.59,54.30,40,0
A	goto	Tirisfal Glades,46.21,56.78,40,0
A	goto	Tirisfal Glades,48.88,57.93,40,0
A	goto	Tirisfal Glades,50.73,57.27,40,0
A	goto	Tirisfal Glades,52.52,54.48,40,0
A	goto	Tirisfal Glades,54.49,52.65,40,0
A	goto	Tirisfal Glades,56.13,52.48,40,0
A	accept	5481
A	target	Gordo
A	unitscan	Gordo
S	Priest/Warlock
A	goto	Tirisfal Glades,52.59,55.53
A	train	3908
A	target	Bowen Brisboise
S	
A	accept	404
A	target	+Deathguard Dillinger
A	goto	Tirisfal Glades,58.20,51.45
A	turnin	383
A	accept	427
A	target	+Executor Zygand
A	goto	Tirisfal Glades,60.59,51.77
S	Rogue
A	goto	Tirisfal Glades,61.15,52.59
A	collect	3131,200,786,1
A	target	Mrs. Winters
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.9
S	Rogue
A	goto	Tirisfal Glades,60.12,53.45
A	vendor	
A	target	Oliver Dwor
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Rogue
A	goto	Tirisfal Glades,60.12,53.45
A	collect	2494,1,404,1
A	money	<0.0401
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Rogue
T	optional	
T	completewith	Claws
A	use	3131
A	itemcount	3131,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.9
S	Rogue
T	optional	
T	completewith	Claws
A	use	2494
A	itemcount	2494,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Warrior
A	goto	Tirisfal Glades,60.12,53.45
A	vendor	
A	target	Oliver Dwor
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.7
S	Warrior
A	goto	Tirisfal Glades,60.12,53.45
A	collect	2488,1,404,1
A	money	<0.0536
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.7
S	Warrior
T	optional	
T	completewith	Claws
A	use	2488
A	itemcount	2488,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.7
S	
A	goto	Tirisfal Glades,61.71,52.06
A	turnin	8
A	home	
A	target	Innkeeper Renee
A	bindlocation	2119
S	Priest
A	goto	Tirisfal Glades,61.57,52.19
A	turnin	5651
A	accept	5650
A	train	591
A	train	17
A	train	2052
A	target	Dark Cleric Beryl
S	Mage
A	goto	Tirisfal Glades,61.97,52.47
A	train	143
A	train	2136
A	target	Cain Firesong
S	Warrior
A	goto	Tirisfal Glades,61.85,52.53
A	train	3127
A	target	Austil de Mon
A	money	<0.01
S	Rogue
A	goto	Tirisfal Glades,61.75,52.00
A	train	1757
A	target	Marion Call
A	money	<0.01
S	Warlock
A	goto	Tirisfal Glades,61.56,52.61
A	collect	16321,1,404,1
A	vendor	
A	target	Gina Lang
A	train	6307,1
S	Warlock
A	goto	Tirisfal Glades,61.59,52.39
A	train	695
A	train	1454
A	target	Rupert Boch
A	money	<0.02
S	Warlock
A	goto	Tirisfal Glades,61.59,52.39
A	train	695
A	target	Rupert Boch
S	Priest/Warlock
A	goto	Tirisfal Glades,61.76,51.56
A	train	7411
A	target	Vance Undergloom
S	
A	goto	Tirisfal Glades,61.71,52.06
A	vendor	
A	collect	1179,15,367,1 << Mage/Priest
A	collect	4605,10,367,1 << Rogue/Warrior
A	collect	1179,10,367,1 << Warlock
A	collect	4605,5,367,1 << Warlock
A	money	<0.025 << Warrior/Rogue
A	money	<0.0375 << Mage/Priest/Warlock
A	target	Innkeeper Renee
S	
A	goto	Tirisfal Glades,59.45,52.40
A	accept	367
A	target	Apothecary Johaan
S	Priest
A	goto	Tirisfal Glades,59.18,46.49
A	complete	5650,1
A	target	Deathguard Kel
S	
T	completewith	Claws
A	complete	5481,1
S	
T	completewith	next
A	complete	367,1
A	mob	Decrepit Darkhound
S	
T	label	Claws
T	loop	
A	goto	Tirisfal Glades,52.63,56.98,0
A	goto	Tirisfal Glades,54.95,50.53,50,0
A	goto	Tirisfal Glades,53.35,50.29,50,0
A	goto	Tirisfal Glades,52.12,50.38,50,0
A	goto	Tirisfal Glades,51.28,51.63,50,0
A	goto	Tirisfal Glades,52.03,53.74,50,0
A	goto	Tirisfal Glades,52.29,56.72,50,0
A	goto	Tirisfal Glades,53.95,56.53,50,0
A	goto	Tirisfal Glades,53.55,58.25,50,0
A	goto	Tirisfal Glades,52.63,56.98,50,0
A	complete	404,1
A	mob	Rotting Dead
A	mob	Ravaged Corpse
S	
T	completewith	next
A	complete	5481,1
S	
T	loop	
A	goto	Tirisfal Glades,41.70,44.01,0
A	goto	Tirisfal Glades,44.41,56.83,100,0
A	goto	Tirisfal Glades,42.64,53.40,100,0
A	goto	Tirisfal Glades,40.84,46.59,100,0
A	goto	Tirisfal Glades,38.69,44.10,100,0
A	goto	Tirisfal Glades,38.63,39.44,100,0
A	goto	Tirisfal Glades,41.70,44.01,100,0
A	complete	367,1
A	mob	Decrepit Darkhound
S	
T	loop	
A	goto	Tirisfal Glades,39.55,50.64,0
A	goto	Tirisfal Glades,44.43,57.33,0
A	goto	Tirisfal Glades,39.55,50.64,50,0
A	goto	Tirisfal Glades,44.43,57.33,50,0
A	complete	5481,1
S	Priest/Warlock
T	sticky	
T	label	Linen
T	completewith	HorrorsandSpirits
A	collect	2589,60
S	
T	loop	
A	goto	Tirisfal Glades,36.63,50.09,0
A	goto	Tirisfal Glades,37.20,52.17,50,0
A	goto	Tirisfal Glades,36.64,50.09,50,0
A	goto	Tirisfal Glades,36.10,49.07,50,0
A	goto	Tirisfal Glades,35.08,49.82,50,0
A	goto	Tirisfal Glades,35.30,50.91,50,0
A	goto	Tirisfal Glades,34.57,51.58,50,0
A	goto	Tirisfal Glades,36.63,50.09,50,0
A	complete	365,1
S	
T	loop	
A	goto	Tirisfal Glades,31.78,51.36,0
A	goto	Tirisfal Glades,33.73,49.34,50,0
A	goto	Tirisfal Glades,33.65,51.07,50,0
A	goto	Tirisfal Glades,31.78,51.36,50,0
A	goto	Tirisfal Glades,30.02,50.48,50,0
A	goto	Tirisfal Glades,29.91,49.24,50,0
A	goto	Tirisfal Glades,30.62,47.53,50,0
A	goto	Tirisfal Glades,31.01,46.50,50,0
A	goto	Tirisfal Glades,32.15,44.83,50,0
A	goto	Tirisfal Glades,33.73,45.29,50,0
A	goto	Tirisfal Glades,34.10,47.88,50,0
A	goto	Tirisfal Glades,33.73,49.34,50,0
A	complete	427,1
A	mob	Scarlet Warrior
S	
T	completewith	BrillTurnin1
A	hs	
A	use	6948
A	subzoneskip	159
A	bindlocation	2119,1
A	cooldown	item,6948,>0
S	Priest
A	goto	Tirisfal Glades,61.57,52.19
A	turnin	5650
A	train	591
A	train	17
A	target	Dark Cleric Beryl
S	
T	label	BrillTurnin1
A	turnin	427
A	accept	370
A	target	+Executor Zygand
A	goto	Tirisfal Glades,60.58,51.77
A	turnin	367
A	turnin	365
A	accept	368
A	accept	407
A	target	+Apothecary Johaan
A	goto	Tirisfal Glades,59.45,52.40
A	turnin	404
A	accept	426
A	target	+Deathguard Dillinger
A	goto	Tirisfal Glades,58.20,51.43
S	
T	loop	
A	goto	Tirisfal Glades,57.71,48.96,0
A	goto	Tirisfal Glades,58.29,49.80,30,0
A	goto	Tirisfal Glades,57.71,48.96,30,0
A	goto	Tirisfal Glades,59.26,46.73,30,0
A	turnin	5481
A	accept	5482
A	target	Junior Apothecary Holland
S	Rogue
A	goto	Tirisfal Glades,60.12,53.45
A	vendor	
A	target	Oliver Dwor
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Rogue
A	goto	Tirisfal Glades,60.12,53.45
A	collect	2494,1,404,1
A	money	<0.0401
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Rogue
T	optional	
T	completewith	ZeptoDurotar
A	use	2494
A	itemcount	2494,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Warrior
A	goto	Tirisfal Glades,60.12,53.45
A	vendor	
A	target	Oliver Dwor
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.7
S	Warrior
A	goto	Tirisfal Glades,60.12,53.45
A	collect	2488,1,404,1
A	money	<0.0536
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.7
S	Warrior
T	optional	
T	completewith	ZeptoDurotar
A	use	2488
A	itemcount	2488,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.7
S	
A	goto	Tirisfal Glades,61.71,52.06
A	vendor	
A	collect	1179,20,818,1 << Mage/Priest
A	collect	4605,10,818,1 << Rogue/Warrior/Warlock
A	collect	1179,10,818,1 << Warlock
A	money	<0.025 << Rogue/Warrior
A	money	<0.050 << Warlock/Mage/Priest
A	target	Innkeeper Renee
S	
T	label	ZeptoDurotar
A	goto	Tirisfal Glades,60.96,58.63,12,0
A	goto	Tirisfal Glades,61.51,59.01,10,0
A	goto	Tirisfal Glades,61.27,59.22,8,0
A	goto	Tirisfal Glades,61.13,58.84,8,0
A	goto	Tirisfal Glades,61.38,58.71,8,0
A	goto	Tirisfal Glades,61.34,59.17,8,0
A	goto	Tirisfal Glades,60.51,58.69,-1
A	goto	Tirisfal Glades,60.94,46.35,-1
A	zone	Durotar
A	zoneskip	Durotar
S	
A	goto	Durotar,46.37,22.94
A	accept	834
A	target	Rezlak
S	
T	completewith	next
A	goto	Durotar,47.40,22.57,60,0
A	goto	Durotar,49.08,28.48,60,0
A	goto	Durotar,52.19,33.49,120,0
A	goto	Durotar,52.25,40.17,60
A	subzoneskip	352
S	Warrior/Rogue
A	goto	Durotar,52.05,40.73
A	train	2018
A	target	Dwukk
A	skill	blacksmithing,1,1
S	Warrior/Rogue
A	goto	Durotar,51.81,40.89
A	train	2575
A	target	Krunn
S	Warrior/Rogue
A	goto	Durotar,51.90,41.14
A	collect	2901,1,784,1
A	target	Wuark
S	
A	goto	Durotar,51.51,41.64
A	home	
A	vendor	
A	target	Innkeeper Grosk
A	bindlocation	362
A	subzoneskip	362,1
S	
A	accept	784
A	accept	837
A	target	+Gar'thok
A	goto	Durotar,51.95,43.50
A	accept	815
A	target	+Cook Torka
A	goto	Durotar,51.09,42.49
S	
T	completewith	next
A	goto	Durotar,50.22,43.06,12,0
A	goto	Durotar,50.09,42.97,8,0
A	goto	Durotar,50.20,42.30,12,0
A	goto	Durotar,49.96,40.96,12,0
A	goto	Durotar,49.67,40.42,10
S	
T	completewith	next
A	goto	Durotar,49.75,40.38,6,0
A	goto	Durotar,49.77,40.24,6,0
A	goto	Durotar,49.69,40.21,6,0
A	goto	Durotar,49.68,40.30,6,0
A	goto	Durotar,49.78,40.34,6,0
A	goto	Durotar,49.79,39.96,6,0
A	goto	Durotar,49.60,40.04,8
S	
A	goto	Durotar,49.89,40.39
A	accept	791
A	target	Furl Scornbrow
S	
T	completewith	TravelToTiragarde
A	collect	2862,1,786,1
A	skill	blacksmithing,<1,1
A	train	2575,3
S	
T	completewith	next
A	goto	Durotar,52.06,68.30,50
A	subzoneskip	367
S	
A	goto	Durotar,52.06,68.30
A	accept	2161
A	target	Ukor
S	
T	loop	
A	goto	Durotar,54.20,73.36,0
A	goto	Durotar,54.09,76.31,25,0
A	goto	Durotar,54.52,74.83,25,0
A	goto	Durotar,54.20,73.36,25,0
A	accept	786
A	target	Lar Prowltusk
S	
T	label	SenjinPickups
A	accept	817
A	target	+Vel'rin Fang
A	goto	Durotar,55.95,73.93
A	accept	818
A	target	+Master Vornal
A	goto	Durotar,55.94,74.40
A	accept	808
A	accept	826
A	accept	823
A	target	+Master Gadrin
A	goto	Durotar,55.94,74.72
S	Rogue
A	goto	Durotar,56.29,73.41
A	collect	3131,200,786,1
A	target	K'waii
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.9
S	Rogue
A	goto	Durotar,56.47,73.12
A	vendor	
A	target	Trayexir
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Rogue
A	goto	Durotar,56.47,73.12
A	collect	2494,1,786,1
A	money	<0.0401
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Orc Warrior
A	goto	Durotar,56.47,73.12
A	vendor	
A	target	Trayexir
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Orc Warrior
A	goto	Durotar,56.47,73.12
A	collect	2491,1,786,1
A	money	<0.0484
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Troll Warrior
A	goto	Durotar,56.47,73.12
A	vendor	
A	target	Trayexir
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.8
S	Troll Warrior
A	goto	Durotar,56.47,73.12
A	collect	2490,1,786,1
A	money	<0.0540
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.8
S	Rogue
T	optional	
T	completewith	Bonfire
A	use	3131
A	itemcount	3131,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.9
S	Rogue
T	optional	
T	completewith	Bonfire
A	use	2494
A	itemcount	2494,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Orc Warrior
T	optional	
T	completewith	Bonfire
A	use	2491
A	itemcount	2491,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Troll Warrior
T	optional	
T	completewith	Bonfire
A	use	2490
A	itemcount	2490,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.8
S	Mage
A	goto	Durotar,56.30,75.11
A	train	143
A	train	2136
A	target	Un'Thuwa
S	
T	completewith	next
A	goto	Durotar,58.54,75.89,40,0
A	goto	Durotar,57.73,77.91,40,0
A	goto	Durotar,55.72,79.62,40,0
A	goto	Durotar,54.23,82.26,40,0
A	goto	Durotar,52.20,83.00,40,0
A	complete	818,2,4
A	mob	+Pygmy Surf Crawler
A	mob	+Surf Crawler
A	complete	818,1,2
A	mob	+Makrura Shellhide
A	mob	+Makrura Clacker
S	
A	goto	Durotar,52.20,83.00,75
A	isOnQuest	818
S	
A	goto	Durotar,50.9,79.2,40
A	isOnQuest	786
S	
T	sticky	
T	completewith	Bonfire
A	unitscan	Warlord Kolkanis
S	
A	goto	Durotar,49.8,81.2
A	complete	786,1
S	
A	goto	Durotar,47.7,77.4
A	complete	786,2
S	
T	label	Bonfire
A	goto	Durotar,46.3,79.0
A	complete	786,3
S	
T	completewith	next
A	goto	Durotar,50.95,79.14,30
A	isQuestComplete	786
S	
T	loop	
A	goto	Durotar,54.20,73.36,0
A	goto	Durotar,54.09,76.31,25,0
A	goto	Durotar,54.52,74.83,25,0
A	goto	Durotar,54.20,73.36,25,0
A	turnin	786
A	target	Lar Prowltusk
S	
T	optional	
A	goto	Durotar,55.95,74.39
A	turnin	818
A	target	Master Vornal
A	isQuestComplete	818
S	
A	goto	Durotar,55.62,73.61
A	vendor	3933
A	target	Hai'zan
A	money	>0.025 << Warrior/Rogue/Shaman
S	Warrior/Rogue/Shaman
A	goto	Durotar,55.62,73.61
A	vendor	
A	collect	2287,10,823,1
A	money	<0.025
A	target	Hai'zan
S	skip --Warlock/Mage/Priest
A	goto	Durotar,56.29,73.41
A	collect	159,20,784,1
A	target	K'waii
A	money	<0.010
S	skip --Warlock/Mage/Priest
A	goto	Durotar,56.29,73.41
A	collect	159,10,784,1
A	target	K'waii
A	money	<0.0050
S	Rogue
A	goto	Durotar,56.47,73.12
A	vendor	
A	target	Trayexir
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Rogue
A	goto	Durotar,56.47,73.12
A	collect	2494,1,823,1
A	money	<0.0401
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Orc Warrior
A	goto	Durotar,56.47,73.12
A	vendor	
A	target	Trayexir
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Orc Warrior
A	goto	Durotar,56.47,73.12
A	collect	2491,1,823,1
A	money	<0.0484
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Troll Warrior
A	goto	Durotar,56.47,73.12
A	vendor	
A	target	Trayexir
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.8
S	Troll Warrior
A	goto	Durotar,56.47,73.12
A	collect	2490,1,823,1
A	money	<0.0540
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.8
S	Rogue
T	optional	
T	completewith	TravelToTiragarde
A	use	3131
A	itemcount	3131,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.9
S	Rogue
T	optional	
T	completewith	TravelToTiragarde
A	use	2494
A	itemcount	2494,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Orc Warrior
T	optional	
T	completewith	TravelToTiragarde
A	use	2491
A	itemcount	2491,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Troll Warrior
T	optional	
T	completewith	TravelToTiragarde
A	use	2490
A	itemcount	2490,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.8
S	
T	label	TravelToTiragarde
A	goto	Durotar,57.26,54.69,60,0
A	subzone	372
A	isOnQuest	784
S	
T	sticky	
T	completewith	AgedEnvelope
A	unitscan	Watch Commander Zalaphil
S	
T	completewith	Benedict
T	requires	TravelToTiragarde
A	goto	Durotar,59.81,58.22,8,0
A	goto	Durotar,59.64,58.44,8,0
A	goto	Durotar,59.55,57.89,8,0
A	goto	Durotar,59.29,57.89,8
S	
T	completewith	AgedEnvelope
A	complete	784,1
A	mob	+Kul Tiras Sailor
A	complete	784,2
A	mob	+Kul Tiras Marine
A	complete	791,1
S	
T	label	Benedict
A	goto	Durotar,59.75,58.27
A	complete	784,3
A	collect	4882,1
A	mob	Lieutenant Benedict
S	
T	label	AgedEnvelope
A	goto	Durotar,59.87,57.87,5,0
A	goto	Durotar,59.83,57.58,5,0
A	goto	Durotar,59.80,57.82,5,0
A	goto	Durotar,59.94,57.82,5,0
A	goto	Durotar,59.94,57.61,5,0
A	goto	Durotar,59.27,57.65
A	collect	4881,1,830
A	accept	830
A	use	4881
S	
T	loop	
A	goto	Durotar,58.99,58.30,0
A	goto	Durotar,57.65,58.52,30,0
A	goto	Durotar,57.36,56.59,30,0
A	goto	Durotar,58.10,55.52,30,0
A	goto	Durotar,58.54,53.68,30,0
A	goto	Durotar,56.54,54.52,30,0
A	goto	Durotar,56.37,58.35,30,0
A	goto	Durotar,58.99,58.30,30,0
A	complete	784,1
A	mob	+Kul Tiras Sailor
A	complete	784,2
A	mob	+Kul Tiras Marine
A	complete	791,1
A	mob	+Kul Tiras Marine
A	mob	+Kul Tiras Sailor
A	itemcount	4870,<8
S	
T	optional	
T	loop	
A	goto	Durotar,58.99,58.30,0
A	goto	Durotar,57.65,58.52,30,0
A	goto	Durotar,57.36,56.59,30,0
A	goto	Durotar,58.10,55.52,30,0
A	goto	Durotar,58.54,53.68,30,0
A	goto	Durotar,56.54,54.52,30,0
A	goto	Durotar,56.37,58.35,30,0
A	goto	Durotar,58.99,58.30,30,0
A	complete	784,1
A	mob	+Kul Tiras Sailor
A	complete	784,2
A	mob	+Kul Tiras Marine
S	
T	optional	
T	label	ScrapsFinished
T	loop	
A	goto	Durotar,58.99,58.30,0
A	goto	Durotar,57.65,58.52,30,0
A	goto	Durotar,57.36,56.59,30,0
A	goto	Durotar,58.10,55.52,30,0
A	goto	Durotar,58.54,53.68,30,0
A	goto	Durotar,56.54,54.52,30,0
A	goto	Durotar,56.37,58.35,30,0
A	goto	Durotar,58.99,58.30,30,0
A	complete	791,1
A	mob	Kul Tiras Sailor
A	mob	Kul Tiras Marine
S	!Priest !Mage
T	loop	
A	goto	Durotar,59.02,50.24,50,0
A	goto	Durotar,57.93,47.71,50,0
A	goto	Durotar,59.20,44.30,50,0
A	goto	Durotar,57.96,42.46,50,0
A	goto	Durotar,56.47,43.45,50,0
A	goto	Durotar,55.50,48.97,50,0
A	xp	7+2180
S	Priest
T	loop	
A	goto	Durotar,59.02,50.24,50,0
A	goto	Durotar,57.93,47.71,50,0
A	goto	Durotar,59.20,44.30,50,0
A	goto	Durotar,57.96,42.46,50,0
A	goto	Durotar,56.47,43.45,50,0
A	goto	Durotar,55.50,48.97,50,0
A	xp	7+1730
S	
T	completewith	next
A	subzoneskip	362
S	
A	turnin	823
A	accept	806
A	target	+Orgnil Soulscar
A	goto	Durotar,52.24,43.15
A	turnin	784
A	turnin	830
A	accept	825
A	accept	831
A	accept	837
A	target	+Gar'Thok
A	goto	Durotar,51.95,43.50
A	accept	815
A	target	+Cook Torka
A	goto	Durotar,51.09,42.49
A	group	
S	
A	turnin	823
A	target	+Orgnil Soulscar
A	goto	Durotar,52.24,43.15
A	turnin	784
A	turnin	830
A	accept	825
A	accept	831
A	accept	837
A	target	+Gar'Thok
A	goto	Durotar,51.95,43.50
A	accept	815
A	target	+Cook Torka
A	goto	Durotar,51.09,42.49
S	
T	completewith	next
A	goto	Durotar,50.22,43.06,12,0
A	goto	Durotar,50.09,42.97,8,0
A	goto	Durotar,50.20,42.30,12,0
A	goto	Durotar,49.96,40.96,12,0
A	goto	Durotar,49.67,40.42,10
S	
T	completewith	next
A	goto	Durotar,49.75,40.38,6,0
A	goto	Durotar,49.77,40.24,6,0
A	goto	Durotar,49.69,40.21,6,0
A	goto	Durotar,49.68,40.30,6,0
A	goto	Durotar,49.78,40.34,6,0
A	goto	Durotar,49.79,39.96,6,0
A	goto	Durotar,49.60,40.04,8
S	
A	goto	Durotar,49.89,40.39
A	turnin	791
A	target	Furl Scornbrow
S	Warrior/Rogue
A	goto	Durotar,51.81,40.89
A	train	2575
A	target	Krunn
S	Warrior/Rogue
A	goto	Durotar,51.90,41.14
A	collect	2901,1,818,1
A	target	Wuark
S	Warrior/Rogue
A	goto	Durotar,52.05,40.73
A	train	2018
A	target	Dwukk
A	skill	blacksmithing,1,1
S	Rogue
A	goto	Durotar,52.02,40.46
A	vendor	
A	target	Uhgar
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Rogue
A	goto	Durotar,52.02,40.46
A	collect	2494,1,818,1
A	money	<0.0401
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Orc Warrior
A	goto	Durotar,52.02,40.46
A	vendor	
A	target	Uhgar
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Orc Warrior
A	goto	Durotar,52.02,40.46
A	collect	2491,1,818,1
A	money	<0.0484
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Troll Warrior
A	goto	Durotar,52.02,40.46
A	vendor	
A	target	Uhgar
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.8
S	Troll Warrior
A	goto	Durotar,52.02,40.46
A	collect	2490,1,818,1
A	money	<0.0540
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.8
S	Rogue
T	optional	
T	completewith	Toolboxes
A	use	3131
A	itemcount	3131,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.9
S	Rogue
T	optional	
T	completewith	Toolboxes
A	use	2494
A	itemcount	2494,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Orc Warrior
T	optional	
T	completewith	Toolboxes
A	use	2491
A	itemcount	2491,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Troll Warrior
T	optional	
T	completewith	Toolboxes
A	use	2490
A	itemcount	2490,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.8
S	
A	goto	Durotar,51.51,41.64
A	vendor	
A	turnin	2161
A	target	Innkeeper Grosk
A	train	6760,1 << Rogue
A	train	139,1 << Priest
A	train	980,1 << Warlock
A	train	8044,1 << Shaman
A	train	284,1 << Warrior
S	!Mage !Hunter !Druid
T	optional	
A	goto	Durotar,51.51,41.64
A	vendor	
A	turnin	2161
A	target	Innkeeper Grosk
A	train	6760,3 << Rogue
A	train	139,3 << Priest
A	train	980,3 << Warlock
A	train	8044,3 << Shaman
A	train	284,3 << Warrior
S	Warrior
A	goto	Durotar,54.18,42.46
A	train	284
A	target	Tarshaw Jaggedscar
S	Warlock
A	goto	Durotar,54.37,41.20
A	train	980
A	target	Dhugru Gorelust
S	Warlock
A	goto	Durotar,54.70,41.49
A	collect	16302,1,818,1
A	target	Kitha
A	money	<0.01
A	train	7799,1
S	Warlock
T	completewith	Tools
A	train	20270
A	use	16302
S	Rogue
A	goto	Durotar,51.98,43.69
A	train	6760
A	target	Kaplak
S	Priest
A	goto	Durotar,54.26,42.93
A	train	139
A	target	Tai'jin
S	
A	goto	Durotar,54.17,41.93
A	train	3273
A	money	<0.01
A	target	Rawrk
S	
A	goto	Durotar,54.39,42.18
A	collect	4496,1,818,1
A	target	Jark
A	money	<0.05
S	
T	completewith	next
A	complete	818,2
A	mob	+Pygmy Surf Crawler
A	mob	+Surf Crawler
A	complete	818,1
A	mob	+Makrura Shellhide
A	mob	+Makrura Clacker
S	
T	label	Tools
T	loop	
A	goto	Durotar,61.96,55.46,0
A	goto	Durotar,61.96,55.46,20,0
A	goto	Durotar,62.25,56.34,20,0
A	goto	Durotar,62.43,59.84,20,0
A	goto	Durotar,62.09,60.68,20,0
A	goto	Durotar,62.51,60.56,20,0
A	goto	Durotar,63.24,58.10,20,0
A	goto	Durotar,62.25,56.34,20,0
A	complete	825,1
S	
T	completewith	TaillasherEggs
A	goto	Durotar,67.10,69.29,100
S	
T	completewith	Fur
A	complete	817,1
A	mob	Durotar Tiger
S	
T	completewith	next
A	complete	818,2
A	mob	+Pygmy Surf Crawler
A	mob	+Surf Crawler
A	complete	818,1
A	mob	+Makrura Shellhide
A	mob	+Makrura Clacker
S	
T	label	TaillasherEggs
T	loop	
A	goto	Durotar,67.04,71.40,0
A	goto	Durotar,70.23,70.84,0
A	goto	Durotar,67.74,69.86,40,0
A	goto	Durotar,67.04,71.40,40,0
A	goto	Durotar,67.66,73.86,40,0
A	goto	Durotar,68.67,74.47,40,0
A	goto	Durotar,69.76,74.69,40,0
A	goto	Durotar,70.29,73.31,40,0
A	goto	Durotar,70.23,70.84,40,0
A	goto	Durotar,69.69,70.35,40,0
A	goto	Durotar,69.21,69.69,40,0
A	complete	815,1
A	mob	Bloodtalon Taillasher
S	
T	completewith	next
A	complete	818,2
A	mob	+Pygmy Surf Crawler
A	mob	+Surf Crawler
A	complete	818,1
A	mob	+Makrura Shellhide
A	mob	+Makrura Clacker
S	
A	goto	Durotar,66.94,84.41,150
S	
T	completewith	ZalazaneKill
A	complete	826,1
A	mob	+Hexed Troll
A	complete	826,2
A	mob	+Voodoo Troll
S	
T	completewith	next
A	complete	826,3
A	mob	Zalazane
S	
T	label	MinshinasSkull
A	goto	Durotar,67.4,87.8
A	complete	808,1
S	
T	label	ZalazaneKill
A	goto	Durotar,67.4,87.8
A	complete	826,3
A	mob	Zalazane
S	
T	completewith	next
A	complete	817,1
A	mob	Durotar Tiger
S	
T	label	Fur
T	loop	
A	goto	Durotar,67.23,88.76,0
A	goto	Durotar,67.23,88.76,40,0
A	goto	Durotar,66.52,87.74,40,0
A	goto	Durotar,65.94,86.72,40,0
A	goto	Durotar,65.90,84.04,40,0
A	goto	Durotar,65.88,82.85,40,0
A	goto	Durotar,67.38,82.61,40,0
A	goto	Durotar,68.42,82.43,40,0
A	goto	Durotar,68.50,84.32,40,0
A	goto	Durotar,68.47,86.77,40,0
A	goto	Durotar,67.23,88.00,40,0
A	complete	826,1
A	mob	+Hexed Troll
A	complete	826,2
A	mob	+Voodoo Troll
S	
T	completewith	next
A	complete	818,2
A	mob	+Pygmy Surf Crawler
A	mob	+Surf Crawler
A	complete	818,1
A	mob	+Makrura Shellhide
A	mob	+Makrura Clacker
S	
T	loop	
A	goto	Durotar,59.79,83.44,0
A	goto	Durotar,65.27,87.86,50,0
A	goto	Durotar,64.72,88.53,50,0
A	goto	Durotar,64.70,84.89,50,0
A	goto	Durotar,64.68,80.80,50,0
A	goto	Durotar,65.35,80.11,50,0
A	goto	Durotar,65.87,81.23,50,0
A	goto	Durotar,60.28,80.04,50,0
A	goto	Durotar,60.60,82.26,50,0
A	goto	Durotar,59.88,83.51,50,0
A	goto	Durotar,59.56,84.86,50,0
A	goto	Durotar,60.84,88.79,50,0
A	goto	Durotar,61.41,89.69,50,0
A	goto	Durotar,61.48,91.37,50,0
A	goto	Durotar,60.37,91.36,50,0
A	goto	Durotar,59.04,90.51,50,0
A	goto	Durotar,59.79,83.44,50,0
A	complete	817,1
A	mob	Durotar Tiger
S	
T	loop	
A	goto	Durotar,59.64,73.84,0
A	goto	Durotar,59.64,73.84,60,0
A	goto	Durotar,58.11,77.30,60,0
A	goto	Durotar,57.27,79.38,60,0
A	goto	Durotar,55.66,80.47,60,0
A	goto	Durotar,53.8,83.14,60,0
A	complete	818,2
A	mob	+Pygmy Surf Crawler
A	mob	+Surf Crawler
A	complete	818,1
A	mob	+Makrura Shellhide
A	mob	+Makrura Clacker
S	
T	completewith	Zalazaneturnin
A	goto	Durotar,56.06,74.72,150
A	subzoneskip	367
S	
A	goto	Durotar,56.48,73.11
A	vendor	
A	target	Trayexir
A	isQuestAvailable	837
S	Mage
A	goto	Durotar,56.3,75.1
A	train	118
A	target	Un'Thuwa
S	
T	label	Zalazaneturnin
A	turnin	808
A	turnin	826
A	target	+Master Gadrin
A	goto	Durotar,55.95,74.73
A	turnin	818
A	target	+Master Vornal
A	goto	Durotar,55.95,74.39
A	turnin	817
A	target	+Vel'rin Fang
A	goto	Durotar,55.95,73.93
S	
T	completewith	Stolensupplies
S	
T	loop	
A	goto	Durotar,49.22,48.96,0
A	goto	Durotar,50.21,50.78,30,0
A	goto	Durotar,50.18,49.23,30,0
A	goto	Durotar,49.48,49.14,30,0
A	goto	Durotar,49.32,48.18,30,0
A	goto	Durotar,48.81,49.00,30,0
A	goto	Durotar,48.49,49.29,30,0
A	goto	Durotar,47.58,49.62,30,0
A	goto	Durotar,47.06,49.53,30,0
A	goto	Durotar,46.90,48.11,30,0
A	goto	Durotar,49.22,48.96,30,0
A	complete	837,1
A	mob	+Razormane Quilboar
A	complete	837,2
A	mob	+Razormane Scout
S	
T	completewith	next
A	goto	Durotar,51.12,42.46,150
S	
A	turnin	815
A	target	+Cook Torka
A	goto	Durotar,51.12,42.46
A	turnin	825
A	target	+Gar'Thok
A	goto	Durotar,51.95,43.50
S	
A	goto	Durotar,54.17,41.93
A	train	3273
A	target	Rawrk
S	Warrior
A	goto	Durotar,54.18,42.46
A	train	6546
A	target	Tarshaw Jaggedscar
A	xp	<10,1
S	Warlock
A	goto	Durotar,54.37,41.20
A	train	1120
A	target	Dhugru Gorelust
A	xp	<10,1
S	Warlock
A	goto	Durotar,54.70,41.49
A	collect	16302,1,837,1
A	target	Kitha
A	money	<0.01
A	train	7799,1
S	Warlock
A	train	20270
A	use	16302
S	Rogue
A	goto	Durotar,51.98,43.69
A	train	674
A	target	Kaplak
A	xp	<10,1
S	Priest
A	goto	Durotar,54.26,42.93
A	accept	5654
A	accept	5660
A	trainer	
A	target	Tai'jin
A	xp	<10,1
S	
A	goto	Durotar,50.8,43.6
A	accept	840
A	target	Takrin Pathseeker
A	xp	<10,1
S	
T	loop	
A	goto	Durotar,44.45,39.74,0
A	goto	Durotar,44.45,39.74,50,0
A	goto	Durotar,44.49,37.47,50,0
A	goto	Durotar,43.30,37.32,50,0
A	goto	Durotar,41.70,37.09,50,0
A	goto	Durotar,41.64,38.27,50,0
A	goto	Durotar,41.94,40.46,50,0
A	goto	Durotar,43.30,40.40,50,0
A	complete	837,3
A	mob	+Razormane Dustrunner
A	complete	837,4
A	mob	+Razormane Battleguard
S	
T	label	Stolensupplies
T	loop	
A	goto	Durotar,47.92,33.10,0
A	goto	Durotar,47.34,33.38,30,0
A	goto	Durotar,47.92,33.10,30,0
A	goto	Durotar,49.11,33.11,30,0
A	goto	Durotar,48.53,32.00,30,0
A	goto	Durotar,47.36,30.98,30,0
A	goto	Durotar,47.14,29.68,30,0
A	goto	Durotar,46.49,34.67,30,0
A	goto	Durotar,50.13,32.35,30,0
A	goto	Durotar,49.78,28.26,30,0
A	goto	Durotar,50.83,25.94,30,0
A	goto	Durotar,49.68,24.38,30,0
A	goto	Durotar,49.05,22.49,30,0
A	complete	834,1
A	isOnQuest	834
S	
T	completewith	next
A	goto	Durotar,46.37,22.94,50
S	
A	goto	Durotar,46.37,22.94
A	accept	834
A	target	Rezlak
S	
T	loop	
A	goto	Durotar,47.92,33.10,0
A	goto	Durotar,47.34,33.38,30,0
A	goto	Durotar,47.92,33.10,30,0
A	goto	Durotar,49.11,33.11,30,0
A	goto	Durotar,48.53,32.00,30,0
A	goto	Durotar,47.36,30.98,30,0
A	goto	Durotar,47.14,29.68,30,0
A	goto	Durotar,46.49,34.67,30,0
A	goto	Durotar,50.13,32.35,30,0
A	goto	Durotar,49.78,28.26,30,0
A	goto	Durotar,50.83,25.94,30,0
A	goto	Durotar,49.68,24.38,30,0
A	goto	Durotar,49.05,22.49,30,0
A	complete	834,1
S	
A	goto	Durotar,46.37,22.94
A	turnin	834
A	accept	835
A	target	Rezlak
S	
T	completewith	next
A	goto	Durotar,53.41,27.81,15
A	solo	
S	
T	loop	
A	goto	Durotar,53.98,23.70,0
A	goto	Durotar,54.02,27.23,40,0
A	goto	Durotar,52.82,24.27,40,0
A	goto	Durotar,51.85,23.95,40,0
A	goto	Durotar,54.01,23.63,40,0
A	goto	Durotar,52.13,20.77,40,0
A	goto	Durotar,51.26,19.19,40,0
A	goto	Durotar,53.98,23.70,40,0
A	complete	835,1
A	mob	+Dustwind Savage
A	complete	835,2
A	mob	+Dustwind Storm Witch
A	solo	
S	Troll Warrior/Undead Warrior
T	completewith	next
A	solo	
S	
A	goto	Durotar,46.37,22.94
A	turnin	835
A	target	Rezlak
A	solo	
S	
T	completewith	next
A	goto	Durotar,44.72,24.86,40,0
A	goto	Durotar,42.28,25.45,30,0
A	goto	Durotar,41.66,25.68,20
A	cast	2641
A	group	
S	
A	goto	Durotar,42.13,26.67
A	complete	806,1
A	mob	Fizzle Darkstorm
A	mob	Imp Minion
A	mob	Burning Blade Fanatic
A	mob	Lightning Hide
A	group	2
S	
A	hs	
A	use	6948
A	cooldown	item,6948,>0
A	subzoneskip	362
A	bindlocation	362,1
A	isQuestComplete	806
A	group	
S	
A	goto	Durotar,51.51,41.64
A	vendor	
A	collect	1179,15,818,1 << Mage/Warlock/Priest/Shaman
A	collect	2287,15,818,1 << Rogue/Warrior
A	target	Innkeeper Grosk
A	money	<0.0375
A	group	
S	
A	goto	Durotar,52.24,43.15
A	turnin	806
A	accept	828
A	target	Orgnil Soulscar
A	isQuestComplete	806
A	group	
S	
A	goto	Durotar,52.24,43.15
A	accept	828
A	target	Orgnil Soulscar
A	isQuestTurnedIn	806
A	group	
S	
A	goto	Durotar,51.95,43.50
A	turnin	837
A	target	Gar'Thok
A	group	
S	Warrior
A	goto	Durotar,54.18,42.46
A	train	6546
A	target	Tarshaw Jaggedscar
A	group	
S	Warlock
A	goto	Durotar,54.37,41.20
A	train	1120
A	target	Dhugru Gorelust
A	group	
S	Warlock
A	goto	Durotar,54.70,41.49
A	collect	16302,1,818,1
A	target	Kitha
A	money	<0.01
A	train	7799,1
A	group	
S	Rogue
A	goto	Durotar,51.98,43.69
A	train	674
A	target	Kaplak
A	group	
S	Priest
A	goto	Durotar,54.26,42.93
A	train	8092
A	target	Tai'jin
A	group	
S	
T	completewith	next
A	goto	Durotar,55.40,36.73,80,0
A	goto	Durotar,56.07,30.05,80,0
A	goto	Durotar,56.41,20.04,50
A	isQuestTurnedIn	806
A	group	
S	
T	label	MargozTurnIn
A	goto	Durotar,56.41,20.04
A	turnin	828
A	accept	827
A	target	Margoz
A	isQuestTurnedIn	806
A	group	
S	
T	completewith	next
A	goto	Durotar,56.49,25.04,50,0
A	goto	Durotar,56.11,27.94,50,0
A	goto	Durotar,53.18,29.15,50
A	isQuestTurnedIn	806
A	group	
S	
T	label	Collars1
T	loop	
A	goto	Durotar,52.70,27.97,0
A	goto	Durotar,53.18,29.15,20,0
A	goto	Durotar,52.70,27.97,12,0
A	goto	Durotar,53.05,27.87,12,0
A	goto	Durotar,53.14,27.24,12,0
A	goto	Durotar,52.84,26.80,12,0
A	goto	Durotar,52.07,26.85,12,0
A	complete	827,1
A	mob	Burning Blade Thug
A	mob	Burning Blade Neophyte
A	mob	Burning Blade Cultist
A	isQuestTurnedIn	806
A	group	
S	
T	completewith	next
A	goto	Durotar,56.30,27.91,80,0
A	goto	Durotar,56.41,20.04,50
A	isQuestTurnedIn	806
A	group	
S	
A	goto	Durotar,56.41,20.04
A	turnin	827
A	accept	829
A	target	Margoz
A	isQuestTurnedIn	806
A	group	
S	
T	completewith	next
A	goto	Durotar,53.41,27.81,15
A	group	
S	
T	loop	
A	goto	Durotar,53.98,23.70,0
A	goto	Durotar,54.02,27.23,40,0
A	goto	Durotar,52.82,24.27,40,0
A	goto	Durotar,51.85,23.95,40,0
A	goto	Durotar,54.01,23.63,40,0
A	goto	Durotar,52.13,20.77,40,0
A	goto	Durotar,51.26,19.19,40,0
A	goto	Durotar,53.98,23.70,40,0
A	complete	835,1
A	mob	+Dustwind Savage
A	complete	835,2
A	mob	+Dustwind Storm Witch
A	group	
S	Troll Warrior/Undead Warrior
T	completewith	next
A	group	
S	
A	goto	Durotar,46.37,22.94
A	turnin	835
A	target	Rezlak
A	group	
S	
A	xp	10
S	
T	completewith	Admiralorders1
A	goto	Orgrimmar,48.97,92.84,50
A	zoneskip	Orgrimmar
S	Rogue
A	goto	Orgrimmar,48.12,80.52
A	collect	3135,200,354,1
A	target	Trak'gen
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.3
S	Rogue
T	optional	
T	completewith	ZeptoUC1
A	use	3135
A	itemcount	3135,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.3
S	Troll Priest
A	goto	Orgrimmar,35.59,87.80
A	turnin	5654
A	trainer	
A	target	Ur'kyo
A	isOnQuest	5654
S	Troll Priest
A	goto	Orgrimmar,35.59,87.80
A	turnin	5652
A	trainer	
A	target	Ur'kyo
S	Mage
A	goto	Orgrimmar,38.33,85.55
A	train	122
A	target	Pephredo
S	Undead
A	goto	Orgrimmar,45.13,63.89
A	fp	Orgrimmar
A	target	Doras
S	
T	label	Admiralorders1
A	goto	Orgrimmar,32.29,35.81
A	turnin	831
A	target	Nazgrel
S	Rogue
A	goto	Orgrimmar,42.75,53.53
A	accept	1963
A	target	Therzok
S	
T	label	NeeruFireblade
A	goto	Orgrimmar,49.49,50.56
A	turnin	829
A	accept	809
A	target	Neeru Fireblade
A	isOnQuest	829
A	group	
S	Warlock
A	goto	Orgrimmar,48.59,46.97
A	train	1120
A	target	Mirket
S	Troll Warrior/Undead Warrior
T	completewith	StaveTraining1
A	goto	Orgrimmar,68.02,38.69,30
S	Warrior
A	goto	Orgrimmar,79.93,31.26
A	train	6546
A	target	Grezz Ragefist
S	Troll Warrior/Undead Warrior
T	label	StaveTraining1
A	goto	Orgrimmar,81.52,19.60
A	train	227
A	target	Hanashi
S	Troll Warrior/Undead Warrior
A	goto	Orgrimmar,81.17,18.69
A	collect	854,1,398,1
A	money	<0.3022
A	target	Zendo'jian
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.4
S	Troll Warrior/Undead Warrior
T	optional	
T	completewith	ZeptoUC1
A	use	854
A	itemcount	854,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.4
S	Orc Warrior
A	goto	Orgrimmar,47.54,68.39
A	vendor	
A	target	Urtharo
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.2
S	Orc Warrior
A	goto	Orgrimmar,47.54,68.39
A	collect	1196,1,398,1
A	money	<0.2214
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.2
S	Orc Warrior
T	optional	
T	completewith	ZeptoUC1
A	use	1196
A	itemcount	1196,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.2
S	
T	label	LeaveOrg2
T	completewith	ZeptoUC1
A	zone	Durotar
A	zoneskip	Durotar
S	
T	label	ZeptoUC1
A	goto	Durotar,50.8,13.8,40
A	zone	Tirisfal Glades
A	zoneskip	Tirisfal Glades
S	
T	completewith	next
A	subzoneskip	359
S	
T	optional	
A	accept	354
A	accept	362
A	target	+Coleman Farthing
A	goto	Tirisfal Glades,61.72,52.29
A	accept	375
A	target	+Gretchen Dedmar
A	goto	Tirisfal Glades,61.89,52.73
A	maxlevel	12
S	Warrior
T	optional	
A	abandon	1505
A	isOnQuest	1505
S	Warrior
T	optional	
A	abandon	1498
A	isOnQuest	1498
S	Warrior
A	goto	Tirisfal Glades,61.85,52.55
A	accept	1818
A	target	Austil de Mon << Warrior
A	isQuestAvailable	1498
S	Warlock
A	goto	Tirisfal Glades,61.62,52.66
A	accept	1478
A	target	Ageron Kargal
S	Undead Rogue
A	goto	Tirisfal Glades,61.75,52.01
A	accept	1885
A	target	Marion Call
S	Mage
A	goto	Tirisfal Glades,61.96,52.47
A	accept	1881
A	target	Cain Firesong
S	!Mage
A	goto	Tirisfal Glades,61.71,52.06
A	vendor	
A	collect	1179,20,367,1 << Mage/Priest/Shaman
A	collect	4605,20,367,1 << Rogue/Warrior
A	collect	1179,15,367,1 << Warlock
A	collect	4605,15,367,1 << Warlock
A	money	<0.075 << Warlock
A	money	<0.05 << !Warlock
A	target	Innkeeper Renee
S	
A	accept	374
A	target	+Deathguard Burgess
A	goto	Tirisfal Glades,60.93,52.01
A	accept	398
A	goto	Tirisfal Glades,60.74,51.52
A	accept	358
A	target	+Magistrate Sevren
A	goto	Tirisfal Glades,61.26,50.84
A	maxlevel	11
S	
T	optional	
A	accept	374
A	target	+Deathguard Burgess
A	goto	Tirisfal Glades,60.93,52.01
A	accept	398
A	goto	Tirisfal Glades,60.74,51.52
S	Warrior
A	goto	Tirisfal Glades,58.19,51.44
A	turnin	1818
A	accept	1819
A	target	Deathguard Dillinger
A	isQuestAvailable	1498
S	Warrior
A	goto	Tirisfal Glades,59.16,48.51
A	complete	1819,1
A	mob	Ulag the Cleaver
A	isQuestAvailable	1498
S	Warrior
A	goto	Tirisfal Glades,58.19,51.44
A	turnin	1819
A	accept	1820
A	target	Deathguard Dillinger
A	isQuestAvailable	1498
S	Warlock/Mage/Priest
T	completewith	next
A	goto	Tirisfal Glades,61.80,65.06,20
A	zoneskip	Undercity
A	zoneskip	Undercity
S	Warlock/Mage/Priest
T	completewith	next
A	goto	Undercity,66.09,20.06,35,0
A	goto	Undercity,64.37,23.94,35,0
A	goto	Undercity,65.93,26.71,10,0
A	goto	Undercity,65.89,34.03,10,0
A	goto	Undercity,64.22,39.77,10,0
A	goto	Undercity,65.53,43.62,15
S	Warlock/Mage/Priest
T	optional	
T	ah	
A	goto	Undercity,64.20,49.60
A	collect	3164,6,429,1
A	target	Auctioneer Rhyker
A	zoneskip	Undercity,1
S	Warlock
A	goto	Undercity,85.07,25.96
A	turnin	1478
A	accept	1473
S	Mage
T	optional	
A	abandon	1883
A	isOnQuest	1883
S	Mage
A	goto	Undercity,85.12,10.07
A	turnin	1881
A	accept	1882
A	target	Anastasia Hartwell
S	Priest
T	optional	
A	goto	Undercity,48.98,18.33
A	turnin	5660
A	target	Aelthalyste
A	isOnQuest	5660
S	Priest
A	goto	Undercity,48.98,18.33
A	accept	5658
A	turnin	5658
A	target	Aelthalyste
S	Rogue
T	optional	
T	completewith	Swordtraining1
A	goto	Tirisfal Glades,61.80,65.06,20
A	zoneskip	Undercity
A	zoneskip	Undercity
A	money	<0.3023
S	Rogue
T	optional	
T	completewith	Swordtraining1
A	goto	Undercity,66.09,20.06,20,0
A	goto	Undercity,64.37,23.94,20,0
A	goto	Undercity,65.93,26.71,10,0
A	goto	Undercity,65.89,34.03,10,0
A	goto	Undercity,64.22,39.77,10,0
A	goto	Undercity,65.53,43.62,15
A	money	<0.3023
S	Undead Rogue
T	optional	
A	goto	Undercity,83.52,69.09
A	turnin	1885
A	accept	1886
A	target	Mennet Carkad
A	money	<0.3023
S	Rogue
T	optional	
T	label	Swordtraining1
A	goto	Undercity,57.29,32.72
A	train	201
A	target	Archibald
A	money	<0.3023
S	Rogue
T	optional	
A	goto	Undercity,77.08,49.40
A	collect	851,1,435,1
A	money	<0.2023
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
A	target	Charles Seaton
S	Rogue
T	optional	
T	completewith	ScarletCrusade1
A	use	851
A	itemcount	851,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
S	Undead Rogue
T	optional	
T	sticky	
T	completewith	UnluckyRogue
A	complete	1886,1
A	unitscan	Astor Hadren
A	isOnQuest	1886
S	Rogue
T	optional	
T	ah	
A	goto	Undercity,64.20,49.60
A	collect	3164,6,429,1
A	target	Auctioneer Rhyker
A	zoneskip	Undercity,1
S	Warlock/Mage/Rogue/Priest
A	goto	Undercity,47.25,39.12,50,0
A	goto	Undercity,46.35,43.86,10,0
A	goto	Undercity,45.24,39.35,10,0
A	goto	Undercity,41.32,38.40,10,0
A	goto	Undercity,40.74,33.95,10,0
A	goto	Undercity,34.80,33.19,15,0
A	goto	Undercity,27.39,30.23,35,0
A	goto	Undercity,21.89,43.35,35,0
A	goto	Tirisfal Glades,51.10,71.53,50,0
A	zone	Tirisfal Glades
A	zoneskip	Tirisfal Glades
S	Warlock
T	completewith	next
A	goto	Tirisfal Glades,51.06,67.57
A	complete	1473,1
S	
T	label	ScarletCrusade1
T	loop	
A	goto	Tirisfal Glades,50.07,68.87,40,0
A	goto	Tirisfal Glades,50.23,66.94,40,0
A	goto	Tirisfal Glades,51.16,65.73,40,0
A	goto	Tirisfal Glades,51.75,66.04,40,0
A	goto	Tirisfal Glades,52.93,67.62,40,0
A	goto	Tirisfal Glades,52.72,69.33,40,0
A	goto	Tirisfal Glades,51.96,69.57,40,0
A	goto	Tirisfal Glades,51.03,69.55,40,0
A	complete	370,1
A	mob	+Captain Perrine
A	complete	370,2
A	mob	+Scarlet Zealot
A	complete	370,3
A	mob	+Scarlet Missionary
A	complete	374,1
A	disablecheckbox	
S	Warlock
A	goto	Tirisfal Glades,51.06,67.57
A	complete	1473,1
S	Warlock
T	completewith	next
A	goto	Undercity,16.51,42.76,35,0
A	goto	Undercity,22.98,39.76,35,0
A	goto	Undercity,24.93,32.54,35,0
A	goto	Undercity,34.78,33.24,10,0
A	goto	Undercity,40.83,34.08,10,0
A	goto	Undercity,41.35,38.40,10,0
A	goto	Undercity,45.25,39.20,10,0
A	goto	Undercity,45.67,43.60,10,0
A	zone	Undercity
S	Warlock
A	goto	Undercity,85.07,25.96
A	turnin	1473
A	accept	1471
A	target	Carendin Halgar
S	Warlock
T	completewith	next
A	cast	9221
A	use	6284
S	Warlock
A	goto	Undercity,86.64,27.10
A	complete	1471,1
A	mob	Summoned Voidwalker
A	use	6284
S	Warlock
A	goto	Undercity,85.04,25.97
A	turnin	1471
A	target	Carendin Halgar
S	skip --Warlock
A	goto	Undercity,84.86,20.34
A	goto	Undercity,67.90,15.28,30
A	link	https://www.youtube.com/watch?v=-Bi95bCN8dM
S	Warlock
T	completewith	next
A	goto	Tirisfal Glades,61.92,64.85
A	zone	Tirisfal Glades
A	zoneskip	Tirisfal Glades
S	
T	completewith	next
A	complete	375,1
A	mob	Greater Duskbat
A	mob	Vampiric Duskbat
S	
A	goto	Tirisfal Glades,47.60,44.03,150
A	isOnQuest	362
S	
T	completewith	MillsOverun
A	collect	2839,1,361
A	accept	361
A	use	2839
S	
T	completewith	ThurmanGregor
A	complete	426,1
A	mob	+Rattlecage Soldier
A	mob	+Cracked Skull Soldier
A	complete	426,2
A	mob	+Darkeye Bonecaster
A	isOnQuest	426
S	
T	label	KillDevlin
A	goto	Tirisfal Glades,47.34,40.78
A	complete	362,1
A	mob	Devlin Agamand
S	
A	goto	Tirisfal Glades,49.34,36.02
A	complete	354,2
A	mob	Nissa Agamand
S	
T	label	ThurmanGregor
T	loop	
A	goto	Tirisfal Glades,45.08,31.15,0
A	goto	Tirisfal Glades,43.71,35.25,60,0
A	goto	Tirisfal Glades,45.03,30.99,60,0
A	goto	Tirisfal Glades,46.79,29.80,60,0
A	goto	Tirisfal Glades,42.82,31.93,60,0
A	goto	Tirisfal Glades,42.82,31.93,60,0
A	goto	Tirisfal Glades,45.08,31.15,60,0
A	complete	354,3
A	unitscan	+Thurman Agamand
A	complete	354,1
A	unitscan	+Gregor Agamand
S	
T	loop	
T	label	MillsOverun
A	goto	Tirisfal Glades,45.08,31.15,0
A	goto	Tirisfal Glades,43.71,35.25,60,0
A	goto	Tirisfal Glades,45.03,30.99,60,0
A	goto	Tirisfal Glades,46.79,29.80,60,0
A	goto	Tirisfal Glades,42.82,31.93,60,0
A	goto	Tirisfal Glades,42.82,31.93,60,0
A	goto	Tirisfal Glades,45.08,31.15,60,0
A	complete	426,1
A	mob	+Rattlecage Soldier
A	mob	+Cracked Skull Soldier
A	complete	426,2
A	mob	+Darkeye Bonecaster
A	isOnQuest	426
S	
T	requires	MillsOverun
T	completewith	MaggotEye
A	goto	Tirisfal Glades,54.32,31.56,15,0
A	goto	Tirisfal Glades,54.78,32.75,15,0
A	goto	Tirisfal Glades,55.84,32.28,15,0
A	goto	Tirisfal Glades,56.55,32.43,40,0
A	goto	Tirisfal Glades,57.77,31.69,50
S	
T	requires	MillsOverun
T	completewith	next
A	complete	358,2
A	mob	+Rot Hide Mongrel
A	complete	358,3
A	mob	+Rot Hide Gnoll
A	mob	+Rot Hide Mongrel
A	isOnQuest	358
A	maxlevel	11
S	
T	requires	MillsOverun
T	label	MaggotEye
A	goto	Tirisfal Glades,58.66,30.77
A	complete	398,1
A	mob	Maggot Eye
S	
A	goto	Tirisfal Glades,59.54,27.86,0
A	goto	Tirisfal Glades,59.38,29.05,50,0
A	goto	Tirisfal Glades,59.54,27.86,50,0
A	goto	Tirisfal Glades,60.64,28.66,50,0
A	goto	Tirisfal Glades,61.49,29.40,50,0
A	goto	Tirisfal Glades,62.96,29.46,50,0
A	goto	Tirisfal Glades,65.68,30.22,50,0
A	goto	Tirisfal Glades,67.48,28.97,50,0
A	goto	Tirisfal Glades,68.22,26.46,50,0
A	goto	Tirisfal Glades,59.54,27.86,50,0
A	complete	368,1
A	mob	Vile Fin Puddlejumper
A	mob	Vile Fin Minor Oracle
A	mob	Vile Fin Muckdweller
S	
T	completewith	RotHideGnolls
A	complete	375,1
A	mob	Greater Duskbat
A	mob	Vampiric Duskbat
S	
T	completewith	next
A	complete	358,2
A	mob	+Rot Hide Mongrel
A	complete	358,1
A	mob	+Rot Hide Graverobber
A	complete	358,3
A	mob	+Rot Hide Mongrel
A	mob	+Rot Hide Graverobber
A	isOnQuest	358
A	maxlevel	11
S	
T	optional	
T	loop	
A	goto	Tirisfal Glades,57.48,35.95,0
A	goto	Tirisfal Glades,57.68,34.37,30,0
A	goto	Tirisfal Glades,57.45,35.96,30,0
A	goto	Tirisfal Glades,56.79,37.79,30,0
A	goto	Tirisfal Glades,56.05,38.76,30,0
A	goto	Tirisfal Glades,55.09,38.74,30,0
A	goto	Tirisfal Glades,55.25,40.16,30,0
A	goto	Tirisfal Glades,54.68,42.12,30,0
A	goto	Tirisfal Glades,55.29,41.51,30,0
A	goto	Tirisfal Glades,56.58,41.99,30,0
A	goto	Tirisfal Glades,58.29,42.93,30,0
A	goto	Tirisfal Glades,58.83,40.68,30,0
A	goto	Tirisfal Glades,58.36,38.55,30,0
A	goto	Tirisfal Glades,57.48,35.95,30,0
A	complete	5482,1
A	isOnQuest	5482
A	maxlevel	11
S	
T	label	RotHideGnolls
T	loop	
A	goto	Tirisfal Glades,55.24,42.54,0
A	goto	Tirisfal Glades,56.31,39.67,40,0
A	goto	Tirisfal Glades,54.71,41.19,40,0
A	goto	Tirisfal Glades,53.90,43.93,40,0
A	goto	Tirisfal Glades,55.24,42.54,40,0
A	goto	Tirisfal Glades,56.43,43.92,40,0
A	complete	358,2
A	mob	+Rot Hide Mongrel
A	complete	358,1
A	mob	+Rot Hide Graverobber
A	complete	358,3
A	mob	+Rot Hide Mongrel
A	mob	+Rot Hide Graverobber
A	isOnQuest	358
A	maxlevel	11
S	
T	loop	
A	goto	Tirisfal Glades,57.71,48.96,0
A	goto	Tirisfal Glades,58.29,49.80,30,0
A	goto	Tirisfal Glades,57.71,48.96,30,0
A	goto	Tirisfal Glades,59.26,46.73,30,0
A	turnin	5482
A	target	Junior Apothecary Holland
A	isQuestComplete	5482
S	
T	optional	
A	abandon	5482
S	
A	turnin	426
A	target	+Deathguard Dillinger
A	goto	Tirisfal Glades,58.19,51.44
A	turnin	368
A	accept	369
A	target	+Apothecary Johaan
A	goto	Tirisfal Glades,59.45,52.40
A	turnin	398
A	turnin	370
A	accept	371
A	target	+Executor Zygand
A	goto	Tirisfal Glades,60.58,51.77
A	turnin	358
A	accept	359
A	target	+Magistrate Sevren
A	goto	Tirisfal Glades,61.26,50.84
A	isQuestComplete	358
S	
A	turnin	426
A	target	+Deathguard Dillinger
A	goto	Tirisfal Glades,58.19,51.44
A	turnin	368
A	accept	369
A	target	+Apothecary Johaan
A	goto	Tirisfal Glades,59.45,52.40
A	turnin	398
A	turnin	370
A	accept	371
A	target	+Executor Zygand
A	goto	Tirisfal Glades,60.58,51.77
S	
T	optional	
A	abandon	358
S	
T	completewith	HorrorsandSpirits
S	
A	goto	Tirisfal Glades,61.03,52.35
A	complete	375,2
A	target	Abigail Shiel
A	itemcount	2876,5
S	
T	optional	
A	turnin	361
A	target	+Yvette Farthing
A	goto	Tirisfal Glades,61.58,52.60
A	turnin	354
A	turnin	362
A	accept	355
A	target	+Coleman Farthing
A	goto	Tirisfal Glades,61.72,52.29
A	turnin	375
A	target	+Gretchen Dedmar
A	goto	Tirisfal Glades,61.89,52.73
A	isQuestComplete	375
A	isOnQuest	361
A	group	
S	
T	optional	
A	turnin	354
A	turnin	362
A	accept	355
A	target	+Coleman Farthing
A	goto	Tirisfal Glades,61.72,52.29
A	turnin	375
A	target	+Gretchen Dedmar
A	goto	Tirisfal Glades,61.89,52.73
A	isQuestComplete	375
A	group	
S	
T	optional	
A	turnin	361
A	target	+Yvette Farthing
A	goto	Tirisfal Glades,61.58,52.60
A	turnin	354
A	turnin	362
A	accept	355
A	target	+Coleman Farthing
A	goto	Tirisfal Glades,61.72,52.29
A	isOnQuest	361
A	group	
S	
A	turnin	354
A	turnin	362
A	accept	355
A	goto	Tirisfal Glades,61.72,52.29
A	target	Coleman Farthing
A	group	
S	
T	optional	
A	turnin	361
A	target	+Yvette Farthing
A	goto	Tirisfal Glades,61.58,52.60
A	turnin	354
A	turnin	362
A	accept	355
A	target	+Coleman Farthing
A	goto	Tirisfal Glades,61.72,52.29
A	turnin	375
A	target	+Gretchen Dedmar
A	goto	Tirisfal Glades,61.89,52.73
A	isQuestComplete	375
A	isOnQuest	361
S	
T	optional	
A	turnin	354
A	turnin	362
A	accept	355
A	target	+Coleman Farthing
A	goto	Tirisfal Glades,61.72,52.29
A	turnin	375
A	target	+Gretchen Dedmar
A	goto	Tirisfal Glades,61.89,52.73
A	isQuestComplete	375
S	
T	optional	
A	turnin	361
A	target	+Yvette Farthing
A	goto	Tirisfal Glades,61.58,52.60
A	turnin	354
A	turnin	362
A	accept	355
A	target	+Coleman Farthing
A	goto	Tirisfal Glades,61.72,52.29
A	isOnQuest	361
S	
A	turnin	354
A	turnin	362
A	accept	355
A	goto	Tirisfal Glades,61.72,52.29
A	target	Coleman Farthing
S	Warrior
A	goto	Tirisfal Glades,61.72,52.29
A	turnin	1820
A	accept	1821
A	group	
A	isQuestTurnedIn	1819
S	Warrior
A	goto	Tirisfal Glades,61.72,52.29
A	turnin	1820
A	solo	
A	isQuestTurnedIn	1819
S	Priest
A	goto	Tirisfal Glades,61.57,52.19
A	train	588
A	target	Dark Cleric Beryl
A	xp	<12,1
S	Mage
A	goto	Tirisfal Glades,61.97,52.47
A	train	145
A	target	Cain Firesong
A	xp	<12,1
S	Warrior
A	goto	Tirisfal Glades,61.85,52.53
A	train	7384
A	target	Austil de Mon
A	xp	<12,1
S	Rogue
A	goto	Tirisfal Glades,61.75,52.00
A	train	1766
A	target	Marion Call
A	xp	<12,1
S	Warlock
A	goto	Tirisfal Glades,61.59,52.39
A	train	755
A	target	Rupert Boch
A	xp	<12,1
S	!Mage
A	goto	Tirisfal Glades,61.71,52.06
A	vendor	
A	collect	1179,20,356,1 << Mage/Priest
A	collect	4605,20,356,1 << Rogue/Warrior
A	collect	1179,15,356,1 << Warlock
A	collect	4605,15,356,1 << Warlock
A	money	<0.050 << !Warlock
A	money	<0.075 << Warlock
A	target	Innkeeper Renee
S	
T	label	UnluckyRogue
A	goto	Tirisfal Glades,65.49,60.25
A	turnin	359
A	accept	360
A	accept	356
A	target	Deathguard Linnea
A	isQuestTurnedIn	358
S	
T	label	UnluckyRogue
A	goto	Tirisfal Glades,65.49,60.25
A	accept	356
A	target	Deathguard Linnea
S	
T	completewith	HorrorsandSpirits
A	complete	375,1
A	mob	Greater Duskbat
A	mob	Vampiric Duskbat
S	Mage
T	completewith	next
A	complete	356,1
A	mob	+Bleeding Horror
A	complete	356,2
A	mob	+Wandering Spirit
S	Mage
A	goto	Tirisfal Glades,77.48,62.00
A	complete	1882,1
S	
T	label	HorrorsandSpirits
T	loop	
A	goto	Tirisfal Glades,74.31,60.98,0
A	goto	Tirisfal Glades,74.31,60.98,50,0
A	goto	Tirisfal Glades,74.45,59.64,50,0
A	goto	Tirisfal Glades,75.08,58.56,50,0
A	goto	Tirisfal Glades,76.45,58.67,50,0
A	goto	Tirisfal Glades,77.41,58.66,50,0
A	goto	Tirisfal Glades,78.55,60.43,50,0
A	goto	Tirisfal Glades,77.45,61.46,50,0
A	goto	Tirisfal Glades,76.79,62.60,50,0
A	goto	Tirisfal Glades,74.99,61.98,50,0
A	complete	356,1
A	mob	+Bleeding Horror
A	complete	356,2
A	mob	+Wandering Spirit
S	Priest/Warlock
T	completewith	Scarletrings
A	collect	2589,60,435,1
A	mob	Scarlet Friar
A	mob	Scarlet Zealot
S	
T	completewith	next
A	complete	374,1
A	isOnQuest	374
S	
T	loop	
A	goto	Tirisfal Glades,79.82,56.40,0
A	goto	Tirisfal Glades,78.82,56.14,20,0
A	goto	Tirisfal Glades,80.95,57.21,40,0
A	goto	Tirisfal Glades,81.62,54.84,40,0
A	goto	Tirisfal Glades,81.56,53.07,40,0
A	goto	Tirisfal Glades,79.31,55.25,40,0
A	goto	Tirisfal Glades,77.14,54.92,40,0
A	goto	Tirisfal Glades,76.15,55.30,40,0
A	goto	Tirisfal Glades,76.12,57.22,40,0
A	goto	Tirisfal Glades,77.16,56.75,40,0
A	goto	Tirisfal Glades,79.82,56.40,40,0
A	complete	371,1
A	mob	+Captain Vachon
A	complete	371,2
A	mob	+Scarlet Friar
A	isOnQuest	371
S	
T	label	ScarletRings
T	loop	
A	goto	Tirisfal Glades,79.82,56.40,0
A	goto	Tirisfal Glades,80.95,57.21,40,0
A	goto	Tirisfal Glades,81.62,54.84,40,0
A	goto	Tirisfal Glades,81.56,53.07,40,0
A	goto	Tirisfal Glades,79.31,55.25,40,0
A	goto	Tirisfal Glades,77.14,54.92,40,0
A	goto	Tirisfal Glades,76.15,55.30,40,0
A	goto	Tirisfal Glades,76.12,57.22,40,0
A	goto	Tirisfal Glades,77.16,56.75,40,0
A	goto	Tirisfal Glades,79.82,56.40,40,0
A	complete	374,1
A	mob	Scarlet Friar
A	mob	Scarlet Zealot
A	isOnQuest	374
S	Priest/Warlock
T	loop	
A	goto	Tirisfal Glades,79.82,56.40,0
A	goto	Tirisfal Glades,80.95,57.21,40,0
A	goto	Tirisfal Glades,81.62,54.84,40,0
A	goto	Tirisfal Glades,81.56,53.07,40,0
A	goto	Tirisfal Glades,79.31,55.25,40,0
A	goto	Tirisfal Glades,77.14,54.92,40,0
A	goto	Tirisfal Glades,76.15,55.30,40,0
A	goto	Tirisfal Glades,76.12,57.22,40,0
A	goto	Tirisfal Glades,77.16,56.75,40,0
A	goto	Tirisfal Glades,79.82,56.40,40,0
A	collect	2589,60,435,1
A	mob	Scarlet Friar
A	mob	Scarlet Zealot
S	
T	completewith	next
A	complete	375,1
A	mob	Greater Duskbat
A	mob	Vampiric Duskbat
S	
T	loop	
A	goto	Tirisfal Glades,85.03,54.72,0
A	goto	Tirisfal Glades,83.50,55.56,30,0
A	goto	Tirisfal Glades,85.03,54.72,30,0
A	goto	Tirisfal Glades,86.56,54.51,30,0
A	goto	Tirisfal Glades,88.06,54.99,30,0
A	goto	Tirisfal Glades,88.94,53.56,30,0
A	goto	Tirisfal Glades,89.70,51.88,30,0
A	goto	Tirisfal Glades,90.92,50.56,30,0
A	goto	Tirisfal Glades,90.87,48.33,30,0
A	goto	Tirisfal Glades,89.87,46.65,30,0
A	goto	Tirisfal Glades,85.04,46.68,30,0
A	goto	Tirisfal Glades,84.52,49.29,30,0
A	goto	Tirisfal Glades,83.46,52.09,30,0
A	complete	369,1
A	mob	Vicious Night Web Spider
S	
T	completewith	LinneaTurnin
A	goto	Tirisfal Glades,65.49,60.25,60
S	
T	completewith	next
A	complete	375,1
A	mob	Greater Duskbat
A	mob	Vampiric Duskbat
S	
T	label	LinneaTurnin
A	goto	Tirisfal Glades,65.49,60.25
A	turnin	356
A	target	Deathguard Linnea
S	
A	goto	Tirisfal Glades,61.03,52.35
A	complete	375,2
A	target	Abigail Shiel
A	itemcount	2876,5
S	
A	turnin	374
A	target	+Deathguard Burgess
A	goto	Tirisfal Glades,60.93,52.01
A	turnin	371
A	target	+Executor Zygand
A	goto	Tirisfal Glades,60.58,51.77
A	turnin	360
A	turnin	355
A	accept	408
A	target	+Magistrate Sevren
A	goto	Tirisfal Glades,61.26,50.84
A	turnin	369
A	accept	445
A	accept	492
A	target	+Apothecary Johaan
A	goto	Tirisfal Glades,59.45,52.39
A	isOnQuest	360
A	group	
S	
T	optional	
A	turnin	374
A	target	+Deathguard Burgess
A	goto	Tirisfal Glades,60.93,52.01
A	turnin	371
A	target	+Executor Zygand
A	goto	Tirisfal Glades,60.58,51.77
A	turnin	355
A	accept	408
A	target	+Magistrate Sevren
A	goto	Tirisfal Glades,61.26,50.84
A	turnin	369
A	accept	445
A	accept	492
A	target	+Apothecary Johaan
A	goto	Tirisfal Glades,59.45,52.39
A	group	
S	
A	turnin	374
A	target	+Deathguard Burgess
A	goto	Tirisfal Glades,60.93,52.01
A	turnin	371
A	target	+Executor Zygand
A	goto	Tirisfal Glades,60.58,51.77
A	turnin	360
A	turnin	355
A	target	+Magistrate Sevren
A	goto	Tirisfal Glades,61.26,50.84
A	turnin	369
A	accept	445
A	accept	492
A	target	+Apothecary Johaan
A	goto	Tirisfal Glades,59.45,52.39
A	isOnQuest	360
S	
T	optional	
A	turnin	374
A	target	+Deathguard Burgess
A	goto	Tirisfal Glades,60.93,52.01
A	turnin	371
A	target	+Executor Zygand
A	goto	Tirisfal Glades,60.58,51.77
A	turnin	355
A	target	+Magistrate Sevren
A	goto	Tirisfal Glades,61.26,50.84
A	turnin	369
A	accept	445
A	accept	492
A	target	+Apothecary Johaan
A	goto	Tirisfal Glades,59.45,52.39
S	
A	goto	Tirisfal Glades,61.89,52.73
A	turnin	375
A	target	Gretchen Dedmar
A	isOnQuest	375
S	Priest
A	goto	Tirisfal Glades,61.57,52.19
A	train	588
A	target	Dark Cleric Beryl
A	xp	<12,1
S	Mage
A	goto	Tirisfal Glades,61.97,52.47
A	train	145
A	target	Cain Firesong
A	xp	<12,1
S	Warrior
A	goto	Tirisfal Glades,61.85,52.53
A	train	7384
A	target	Austil de Mon
A	xp	<12,1
S	Rogue
A	goto	Tirisfal Glades,61.75,52.00
A	train	1766
A	target	Marion Call
A	xp	<12,1
S	Warlock
A	goto	Tirisfal Glades,61.59,52.39
A	train	755
A	target	Rupert Boch
A	xp	<12,1
S	
A	goto	Tirisfal Glades,47.39,43.64,150,0
A	goto	Tirisfal Glades,52.23,26.91,20,0
A	goto	Tirisfal Glades,52.29,26.40,8
A	isOnQuest	408
A	group	
S	Warrior
T	completewith	CaptainDargol
A	complete	1821,1
A	complete	1821,2
A	complete	1821,3
A	complete	1821,4
A	isOnQuest	1821
A	group	2
S	
T	completewith	next
A	complete	408,1
A	mob	+Wailing Ancestor
A	complete	408,2
A	mob	+Rotting Ancestor
A	group	2
S	
T	label	CaptainDargol
A	goto	Tirisfal Glades,52.53,26.78,8,0
A	goto	Tirisfal Glades,52.08,26.81,8,0
A	goto	Tirisfal Glades,52.03,26.43,8,0
A	goto	Tirisfal Glades,52.81,26.36
A	complete	408,3
A	mob	Captain Dargol
A	isOnQuest	408
A	group	2
S	Warrior
T	completewith	next
A	complete	1821,1
A	complete	1821,2
A	complete	1821,3
A	complete	1821,4
A	isOnQuest	1821
A	group	2
S	
T	loop	
A	goto	Tirisfal Glades,51.90,26.87,0
A	goto	Tirisfal Glades,51.88,25.86,25,0
A	goto	Tirisfal Glades,52.61,25.85,25,0
A	goto	Tirisfal Glades,52.60,26.88,25,0
A	goto	Tirisfal Glades,51.90,26.87,25,0
A	complete	408,1
A	mob	+Wailing Ancestor
A	complete	408,2
A	mob	+Rotting Ancestor
A	isOnQuest	408
A	group	2
S	Warrior
T	loop	
A	goto	Tirisfal Glades,52.66,25.87,0
A	goto	Tirisfal Glades,51.70,25.69,12,0
A	goto	Tirisfal Glades,52.62,25.62,12,0
A	goto	Tirisfal Glades,52.65,27.02,12,0
A	goto	Tirisfal Glades,51.89,27.10,12,0
A	goto	Tirisfal Glades,52.66,25.87,12,0
A	complete	1821,1
A	complete	1821,2
A	complete	1821,3
A	complete	1821,4
A	isOnQuest	1821
A	group	2
S	skip
A	goto	Tirisfal Glades,51.68,25.67
A	goto	Tirisfal Glades,56.24,49.42,30
A	link	https://www.youtube.com/watch?v=bH_NYmWf8Lc&ab
A	isQuestComplete	408
A	group	
S	
T	completewith	NewPlagueFinal
A	subzone	159
A	isQuestComplete	408
A	group	
S	
A	goto	Tirisfal Glades,61.26,50.84
A	turnin	408
A	target	Magistrate Sevren
A	isQuestComplete	408
A	group	
S	Warrior
A	goto	Tirisfal Glades,61.72,52.29
A	turnin	1821
A	turnin	1822
A	target	Coleman Farthing
A	isQuestComplete	1821
A	group	
S	Warrior
A	goto	Tirisfal Glades,61.72,52.29
A	turnin	1822
A	target	Coleman Farthing
A	isQuestTurnedIn	1821
A	group	
S	
T	optional	
A	goto	Tirisfal Glades,61.97,51.29
A	turnin	407
A	target	Captured Scarlet Zealot
A	isQuestTurnedIn	365
S	
T	label	NewPlagueFinal
A	goto	Tirisfal Glades,61.94,51.40
A	turnin	492
A	target	Captured Mountaineer
S	Priest
A	goto	Tirisfal Glades,61.57,52.19
A	train	588,1
A	target	Dark Cleric Beryl
A	xp	<12,1
A	xp	>14,1
S	Priest
A	goto	Tirisfal Glades,61.57,52.19
A	train	6074
A	target	Dark Cleric Beryl
A	xp	<14,1
S	Mage
A	goto	Tirisfal Glades,61.97,52.47
A	train	145,1
A	target	Cain Firesong
A	xp	<12,1
A	xp	>14,1
S	Mage
A	goto	Tirisfal Glades,61.97,52.47
A	train	2137
A	target	Cain Firesong
A	xp	<14,1
S	Warrior
A	goto	Tirisfal Glades,61.85,52.53
A	train	7384,1
A	target	Austil de Mon
A	xp	<12,1
A	xp	>14,1
S	Warrior
A	goto	Tirisfal Glades,61.85,52.53
A	train	1160
A	target	Austil de Mon
A	xp	<14,1
S	Rogue
A	goto	Tirisfal Glades,61.75,52.00
A	train	1766,1
A	target	Marion Call
A	xp	<12,1
A	xp	>14,1
S	Rogue
A	goto	Tirisfal Glades,61.75,52.00
A	train	1758
A	target	Marion Call
A	xp	<14,1
S	Warlock
A	goto	Tirisfal Glades,61.59,52.39
A	train	755,1
A	target	Rupert Boch
A	xp	<12,1
A	xp	>14,1
S	Warlock
A	goto	Tirisfal Glades,61.59,52.39
A	train	6222
A	target	Rupert Boch
A	xp	<14,1
S	Mage
T	completewith	next
A	goto	Tirisfal Glades,61.80,65.06,20
A	zoneskip	Undercity
S	Mage
T	completewith	next
A	goto	Undercity,66.09,20.06,20,0
A	goto	Undercity,64.37,23.94,20,0
A	goto	Undercity,65.93,26.71,10,0
A	goto	Undercity,65.89,34.03,10,0
A	goto	Undercity,64.22,39.77,10,0
A	goto	Undercity,65.53,43.62,15
S	Mage
A	goto	Undercity,85.12,10.07
A	turnin	1882
A	target	Anastasia Hartwell
S	Undead Rogue
T	completewith	Swordtraining2
A	goto	Tirisfal Glades,61.80,65.06,20
A	zoneskip	Undercity
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
S	Undead Rogue
T	completewith	Swordtraining2
A	goto	Undercity,66.09,20.06,20,0
A	goto	Undercity,64.37,23.94,20,0
A	goto	Undercity,65.93,26.71,10,0
A	goto	Undercity,65.89,34.03,10,0
A	goto	Undercity,64.22,39.77,10,0
A	goto	Undercity,65.53,43.62,15
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
S	!Undead
T	completewith	UCflightpath
A	goto	Tirisfal Glades,61.80,65.06,20
A	zoneskip	Undercity
S	!Undead
T	completewith	UCflightpath
A	goto	Undercity,66.09,20.06,20,0
A	goto	Undercity,64.37,23.94,20,0
A	goto	Undercity,65.93,26.71,10,0
A	goto	Undercity,65.89,34.03,10,0
A	goto	Undercity,64.22,39.77,10,0
A	goto	Undercity,65.53,43.62,15
S	!Undead
T	label	UCflightpath
A	goto	Undercity,63.25,48.56
A	fp	Undercity
A	target	Michael Garrett
S	Undead Rogue
A	goto	Undercity,83.52,69.09
A	turnin	1885
A	accept	1886
A	target	Mennet Carkad
A	isOnQuest	1885
S	Rogue
T	label	Swordtraining2
A	goto	Undercity,57.29,32.72
A	train	201
A	target	Archibald
S	Rogue
A	goto	Undercity,77.08,49.40
A	collect	851,1,435,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
A	target	Charles Seaton
S	Rogue
T	optional	
T	completewith	Entersilverpine
A	use	851
A	itemcount	851,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
S	Undead Warrior
T	completewith	Entersilverpine
A	goto	Tirisfal Glades,61.80,65.06,20
A	zoneskip	Undercity
A	zoneskip	Undercity
A	money	<0.3022
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.0
S	Undead Warrior
T	completewith	Entersilverpine
A	goto	Undercity,66.09,20.06,20,0
A	goto	Undercity,64.37,23.94,20,0
A	goto	Undercity,65.93,26.71,10,0
A	goto	Undercity,65.89,34.03,10,0
A	goto	Undercity,64.22,39.77,10,0
A	goto	Undercity,65.53,43.62,15
A	money	<0.3022
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.0
S	Troll Warrior/Undead Warrior/Tauren Shaman/Troll Shaman/Orc Shaman
A	goto	Undercity,58.82,32.83
A	collect	854,1,435,1
A	money	<0.3022
A	target	Benijah Fenner
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.0
S	Troll Warrior/Undead Warrior/Tauren Shaman/Troll Shaman/Orc Shaman
T	optional	
T	completewith	Entersilverpine
A	use	854
A	itemcount	854,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.0
S	
T	optional	
T	ah	
A	goto	Undercity,64.20,49.60
A	collect	3164,6,429,1
A	target	Auctioneer Rhyker
A	zoneskip	Undercity,1
S	Priest/Warlock
A	goto	Undercity,62.47,61.80
A	train	7411
A	target	Lavinia Crowe
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3
S	Priest/Warlock
A	goto	Undercity,70.06,29.84
A	train	3908
A	target	Victor Ward
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3
S	Priest/Warlock
A	goto	Undercity,70.76,30.67
A	collect	2996,30,435,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3
S	Priest/Warlock
A	goto	Undercity,70.06,29.84
A	train	7623
A	target	Victor Ward
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3
S	Priest/Warlock
A	goto	Undercity,70.57,30.17
A	collect	2320,30,435,1
A	target	Millie Gregorian
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3
S	Priest/Warlock
A	collect	6238,9,398,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3
S	Priest/Warlock
A	goto	Undercity,62.35,60.99
A	collect	6218,1,435,1
A	collect	4470,1,435,1
A	target	Thaddeus Webb
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3
S	Priest/Warlock
A	goto	Undercity,62.54,60.34
A	train	14293
A	target	Malcomb Wynn
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3
S	Priest/Warlock
A	collect	11287,1,435,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3
S	Priest/Warlock
T	optional	
T	completewith	Entersilverpine
A	use	11287
A	itemcount	11287,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3
S	
T	optional	
A	abandon	806
A	isOnQuest	806
S	
T	optional	
A	abandon	408
A	isOnQuest	408
S	Warrior
T	optional	
A	abandon	1821
A	isOnQuest	1821
S	
T	label	LeaveUndercity3
A	goto	Undercity,47.25,39.12,50,0
A	goto	Undercity,46.35,43.86,10,0
A	goto	Undercity,45.24,39.35,10,0
A	goto	Undercity,41.32,38.40,10,0
A	goto	Undercity,40.74,33.95,10,0
A	goto	Undercity,34.80,33.19,15,0
A	goto	Undercity,27.39,30.23,35,0
A	goto	Undercity,21.89,43.35,35,0
A	goto	Tirisfal Glades,51.10,71.53,50
A	zoneskip	Tirisfal Glades
A	zoneskip	Tirisfal Glades
S	
T	label	Entersilverpine
A	zone	Silverpine Forest
A	zoneskip	Silverpine Forest
E
G	Guides/SurvivalGuide/H-Classic-Horde-1-13_Mulgore.lua
M	hardcore	
M	classic	
M	tbc	
M	era/som--h	
M	selector	Horde
M	name	1-6 Tauren
M	version	1
M	group	RestedXP Survival Guide (H)
M	subgroup	RXP Survival Guide 1-20
M	defaultfor	Tauren
M	next	6-13 Tauren
S	!Tauren
T	completewith	next
A	goto	Mulgore,44.92,77.12
S	
A	goto	Mulgore,44.92,77.12
A	accept	747
A	target	Grull Hawkwind
S	
A	goto	Mulgore,44.18,76.07
A	accept	752
A	target	Chief Hawkwind
S	Warrior/Shaman
T	completewith	next
A	goto	Mulgore,46.05,75.32,30,0
A	mob	Plainstrider
A	money	>0.01
S	Warrior/Shaman
A	goto	Mulgore,45.30,76.52
A	vendor	
A	target	Kawnie Softbreeze
A	money	>0.01
S	Warrior
A	goto	Mulgore,44.02,76.14
A	train	6673
A	target	Harutt Thunderhorn
S	Shaman
A	goto	Mulgore,45.01,75.95
A	train	8017
A	target	Meela Dawnstrider
S	
T	completewith	next
A	complete	747,1
A	complete	747,2
A	mob	Plainstrider
S	
A	goto	Mulgore,50.03,81.16
A	turnin	752
A	accept	753
A	target	Greatmother Hawkwind
S	
A	goto	Mulgore,50.22,81.37
A	complete	753,1
S	
T	loop	
A	goto	Mulgore,47.36,83.05,0
A	goto	Mulgore,50.23,79.38,50,0
A	goto	Mulgore,51.02,78.68,50,0
A	goto	Mulgore,50.85,75.68,50,0
A	goto	Mulgore,48.43,77.18,50,0
A	goto	Mulgore,47.10,76.54,50,0
A	goto	Mulgore,45.77,80.39,50,0
A	goto	Mulgore,45.56,82.39,50,0
A	goto	Mulgore,47.36,83.05,50,0
A	complete	747,1
A	complete	747,2
A	mob	Plainstrider
S	
A	goto	Mulgore,44.92,77.12
A	turnin	747,1
A	turnin	747
A	accept	3091
A	accept	3092
A	accept	3093
A	accept	3094
A	accept	750
A	target	Grull Hawkwind
S	
A	goto	Mulgore,45.30,76.52
A	collect	2516,1000,750,1 << Hunter
A	vendor	
A	target	Kawnie Softbreeze
S	
A	goto	Mulgore,44.18,76.07
A	turnin	753
A	accept	755
A	target	Chief Hawkwind
S	Shaman
A	goto	Mulgore,44.07,77.47
A	collect	2132,1,750,1
A	money	<0.0102
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<1.9
A	target	Marjak
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
A	goto	Mulgore,42.58,92.18
A	turnin	755
A	accept	757
A	target	Seer Graytongue
S	
T	loop	
A	goto	Mulgore,44.60,90.86,0
A	goto	Mulgore,43.21,89.26,50,0
A	goto	Mulgore,44.64,91.58,50,0
A	goto	Mulgore,45.82,90.52,50,0
A	goto	Mulgore,46.35,91.45,50,0
A	goto	Mulgore,48.05,91.83,50,0
A	goto	Mulgore,49.25,90.69,50,0
A	goto	Mulgore,50.98,90.37,50,0
A	goto	Mulgore,49.10,89.50,50,0
A	goto	Mulgore,47.06,88.64,50,0
A	goto	Mulgore,45.06,89.89,50,0
A	goto	Mulgore,44.60,90.86,50,0
A	complete	750,1
A	mob	Mountain Cougar
S	
T	loop	
A	goto	Mulgore,45.56,87.95,40,0
A	goto	Mulgore,46.92,87.84,40,0
A	goto	Mulgore,48.67,86.83,40,0
A	goto	Mulgore,50.65,85.87,40,0
A	goto	Mulgore,51.01,83.71,40,0
A	goto	Mulgore,52.06,81.53,40,0
A	goto	Mulgore,51.87,79.58,40,0
A	goto	Mulgore,51.67,77.39,40,0
A	goto	Mulgore,51.95,75.16,40,0
A	goto	Mulgore,50.32,76.33,40,0
A	goto	Mulgore,48.85,75.82,40,0
A	goto	Mulgore,47.41,75.30,40,0
A	goto	Mulgore,46.80,78.21,40,0
A	goto	Mulgore,45.84,80.41,40,0
A	goto	Mulgore,45.03,82.15,40,0
A	goto	Mulgore,44.09,83.89,40,0
A	goto	Mulgore,43.90,86.08,40,0
A	xp	3+1150
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
A	goto	Mulgore,44.92,77.12
A	turnin	750
A	accept	780
A	target	Grull Hawkwind
S	
A	goto	Mulgore,45.30,76.52
A	vendor	
A	target	Kawnie Softbreeze
S	
A	goto	Mulgore,44.67,76.68
A	accept	3376
A	target	Brave Windfeather
S	Warrior
A	goto	Mulgore,44.02,76.14
A	turnin	3091
A	train	100
A	train	772
A	target	Harutt Thunderhorn
A	money	<0.02
S	Warrior
A	goto	Mulgore,44.02,76.14
A	turnin	3091
A	train	772
A	target	Harutt Thunderhorn
S	Hunter
A	goto	Mulgore,44.26,75.70
A	turnin	3092
A	train	1978
A	target	Lanka Farshot
S	Druid
A	goto	Mulgore,45.09,75.93
A	turnin	3094
A	train	8921
A	target	Gart Mistrunner
S	Shaman
A	goto	Mulgore,44.73,76.18
A	accept	1519
A	target	Seer Ravenfeather
S	Shaman
A	goto	Mulgore,45.01,75.95
A	turnin	3093
A	train	8042
A	target	Meela Dawnstrider
S	
T	loop	
A	goto	Mulgore,55.99,85.46,0
A	goto	Mulgore,52.70,79.32,50,0
A	goto	Mulgore,54.19,79.83,50,0
A	goto	Mulgore,55.73,80.28,50,0
A	goto	Mulgore,56.48,81.67,50,0
A	goto	Mulgore,55.63,83.86,50,0
A	goto	Mulgore,56.03,85.53,50,0
A	goto	Mulgore,55.80,87.71,50,0
A	goto	Mulgore,56.72,89.27,50,0
A	goto	Mulgore,57.92,89.27,50,0
A	goto	Mulgore,57.69,86.77,50,0
A	goto	Mulgore,57.31,85.39,50,0
A	goto	Mulgore,55.99,85.46,50,0
A	complete	780,2
A	complete	780,1
A	mob	Battleboar
S	
T	completewith	next
A	goto	Mulgore,59.67,83.33,30
S	
T	completewith	DirtyMap
A	complete	757,1
A	mob	Bristleback Quilboar
S	Shaman
T	completewith	DirtyMap
A	complete	1519,1
A	mob	Bristleback Shaman
S	
A	goto	Mulgore,60.54,81.04,35,0
A	goto	Mulgore,62.35,81.27,35,0
A	goto	Mulgore,62.49,78.78,35,0
A	goto	Mulgore,64.71,77.67
A	complete	3376,1
A	mob	Chief Sharptusk Thornmantle
S	
T	label	DirtyMap
A	goto	Mulgore,63.24,82.70
A	collect	4851,1,781
A	accept	781
A	use	4851
S	Shaman
T	completewith	next
A	complete	1519,1
A	mob	Bristleback Shaman
S	
T	loop	
A	goto	Mulgore,63.93,78.34,0
A	goto	Mulgore,63.81,76.65,40,0
A	goto	Mulgore,62.92,76.91,40,0
A	goto	Mulgore,61.31,77.22,40,0
A	goto	Mulgore,61.58,78.89,40,0
A	goto	Mulgore,62.53,79.52,40,0
A	goto	Mulgore,64.20,79.01,40,0
A	goto	Mulgore,65.82,78.13,40,0
A	goto	Mulgore,63.93,78.34,40,0
A	complete	757,1
A	mob	Bristleback Quilboar
S	Shaman
T	loop	
A	goto	Mulgore,63.86,80.14,0
A	goto	Mulgore,63.74,81.18,40,0
A	goto	Mulgore,63.86,79.97,40,0
A	goto	Mulgore,65.00,78.60,40,0
A	goto	Mulgore,66.05,77.83,40,0
A	goto	Mulgore,65.93,77.10,40,0
A	goto	Mulgore,63.57,76.25,40,0
A	goto	Mulgore,63.86,80.14,40,0
A	complete	1519,1
A	mob	Bristleback Shaman
S	
T	loop	
A	goto	Mulgore,62.27,82.03,0
A	goto	Mulgore,63.98,80.08,40,0
A	goto	Mulgore,64.31,78.29,40,0
A	goto	Mulgore,63.67,76.18,40,0
A	goto	Mulgore,62.67,76.10,40,0
A	goto	Mulgore,61.34,77.13,40,0
A	goto	Mulgore,61.72,78.98,40,0
A	goto	Mulgore,62.29,81.53,40,0
A	goto	Mulgore,60.82,80.81,40,0
A	goto	Mulgore,60.08,81.93,40,0
A	goto	Mulgore,61.03,82.32,40,0
A	goto	Mulgore,62.27,82.03,40,0
A	xp	5+880
A	xp	5
S	
T	completewith	next
A	hs	
A	use	6948
S	
A	turnin	780
A	target	+Grull Hawkwind
A	goto	Mulgore,44.92,77.12
A	turnin	3376
A	target	+Brave Windfeather
A	goto	Mulgore,44.67,76.68
A	turnin	1519
A	accept	1520
A	target	+Seer Ravenfeather << Shaman
A	goto	Mulgore,44.73,76.18 << Shaman
A	turnin	781
A	turnin	757
A	accept	763
A	target	+Chief Hawkwind
A	goto	Mulgore,44.18,76.07
S	Shaman
T	completewith	CallofEarth
T	label	Rock
A	goto	Mulgore,53.74,80.15,30
S	Shaman
T	completewith	next
T	requires	Rock
A	cast	8202
A	use	6635
S	Shaman
A	goto	Mulgore,53.74,80.15
A	turnin	1520
A	accept	1521
A	target	Minor Manifestation of Earth
S	Shaman
A	goto	Mulgore,44.73,76.18
A	turnin	1521
A	target	Seer Ravenfeather
S	Shaman
A	goto	Mulgore,45.01,75.95
A	train	332
A	target	Shikrik
A	target	Meela Dawnstrider
S	Hunter
A	goto	Mulgore,44.26,75.70
A	train	1130
A	train	3044
A	target	Lanka Farshot
A	money	<0.02
S	Hunter
A	goto	Mulgore,44.26,75.70
A	train	3044
A	target	Lanka Farshot
S	Druid
A	goto	Mulgore,45.09,75.93
A	train	467
A	train	5177
A	target	Gart Mistrunner
A	money	<0.02
S	Druid
A	goto	Mulgore,45.09,75.93
A	train	5177
A	target	Gart Mistrunner
S	Warrior
A	goto	Mulgore,44.02,76.14
A	train	3127
A	train	6343
A	target	Harutt Thunderhorn
A	money	<0.02
S	Warrior
A	goto	Mulgore,44.02,76.14
A	train	3127
A	target	Harutt Thunderhorn
S	
A	goto	Mulgore,38.51,81.54
A	accept	1656
A	target	Antur Fallow
E
G	Guides/SurvivalGuide/H-Classic-Horde-1-13_Mulgore.lua
M	hardcore	
M	classic	
M	tbc	
M	era/som--h	
M	selector	Horde
M	name	6-13 Tauren
M	version	1
M	group	RestedXP Survival Guide (H)
M	subgroup	RXP Survival Guide 1-20
M	defaultfor	Tauren
M	next	13-15 Silverpine Forest
S	
T	completewith	next
A	goto	Mulgore,47.35,60.70,120
A	subzoneskip	222
S	
A	accept	743
A	target	+Ruul Eagletalon
A	goto	Mulgore,47.36,62.01
A	turnin	763
A	accept	745
A	accept	767
A	accept	746
A	target	+Baine Bloodhoof
A	goto	Mulgore,47.51,60.16
S	
A	goto	Mulgore,46.63,61.09
A	turnin	1656
A	home	
A	target	Innkeeper Kauth
A	bindlocation	222
A	subzoneskip	222,1
S	Shaman/Druid
A	goto	Mulgore,45.66,58.60
A	vendor	
A	target	Mahnott Roughwound
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Shaman/Druid
A	goto	Mulgore,45.66,58.60
A	collect	2495,1,761,1
A	money	<0.0504
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Warrior
A	goto	Mulgore,45.66,58.60
A	vendor	
A	target	Mahnott Roughwound
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.9
S	Warrior
A	goto	Mulgore,45.66,58.60
A	collect	2493,1,761,1
A	money	<0.0701
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.9
S	Hunter
A	goto	Mulgore,45.50,58.47
A	vendor	
A	target	Kennah Hawkseye
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.0
S	Hunter
A	goto	Mulgore,45.50,58.47
A	collect	2509,1,761,1
A	money	<0.0414
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.0
S	Hunter
A	goto	Mulgore,45.50,58.47
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
A	goto	Mulgore,46.97,57.07
A	turnin	767
A	accept	771
A	target	+Zarlman Two-Moons
A	goto	Mulgore,47.76,57.53
A	accept	761
A	target	+Harken Windtotem
A	goto	Mulgore,48.71,59.32
A	accept	748
A	target	+Mull Thunderhorn
A	goto	Mulgore,48.53,60.40
S	!Tauren
A	accept	766
A	target	+Maur Raincaller
A	goto	Mulgore,46.97,57.07
A	turnin	767
A	accept	771
A	target	+Zarlman Two-Moons
A	goto	Mulgore,47.76,57.53
A	accept	761
A	target	+Harken Windtotem
A	goto	Mulgore,48.71,59.32
S	
T	sticky	
T	completewith	Well
A	complete	766,1
A	complete	766,2
A	complete	766,3
A	complete	766,4
S	Tauren
T	completewith	next
A	complete	748,1
A	mob	+Prairie Wolf
A	complete	748,2
A	mob	+Adult Plainstrider
S	
T	loop	
A	goto	Mulgore,50.36,66.49,0
A	goto	Mulgore,48.71,64.44,15,0
A	goto	Mulgore,50.36,66.49,15,0
A	goto	Mulgore,51.92,63.85,15,0
A	goto	Mulgore,51.13,71.06,15,0
A	goto	Mulgore,50.36,66.49,15,0
A	complete	771,2
S	Tauren
T	loop	
A	goto	Mulgore,50.82,66.66,0
A	goto	Mulgore,50.82,66.66,50,0
A	goto	Mulgore,51.06,63.63,50,0
A	goto	Mulgore,52.79,62.06,50,0
A	goto	Mulgore,53.98,61.68,50,0
A	goto	Mulgore,55.67,62.77,50,0
A	goto	Mulgore,56.46,64.93,50,0
A	goto	Mulgore,56.02,67.78,50,0
A	goto	Mulgore,55.02,69.65,50,0
A	goto	Mulgore,52.33,70.07,50,0
A	goto	Mulgore,50.40,70.24,50,0
A	goto	Mulgore,48.60,69.43,50,0
A	goto	Mulgore,45.98,69.70,50,0
A	goto	Mulgore,48.58,67.37,50,0
A	complete	748,1
A	mob	+Prairie Wolf
A	complete	748,2
A	mob	+Adult Plainstrider
S	Tauren
A	goto	Mulgore,48.53,60.40
A	turnin	748
A	timer	8,Poison Water RP
A	accept	754
A	target	Mull Thunderhorn
S	Tauren
T	completewith	next
A	complete	771,1
S	Tauren
T	label	Well
A	goto	Mulgore,53.68,66.28
A	complete	754,1
S	
T	label	Stones
T	loop	
A	goto	Mulgore,54.06,66.40,0
A	goto	Mulgore,53.35,65.78,10,0
A	goto	Mulgore,53.70,65.59,10,0
A	goto	Mulgore,53.98,65.94,10,0
A	goto	Mulgore,54.06,66.40,10,0
A	complete	771,1
S	
T	completewith	next
A	complete	766,1
A	complete	766,2
A	complete	766,3
A	complete	766,4
S	
T	label	Gnolls
T	loop	
A	goto	Mulgore,53.5,73.0,0
A	goto	Mulgore,48.3,72.0,0
A	goto	Mulgore,53.5,73.0,90,0
A	goto	Mulgore,48.3,72.0,90,0
A	complete	745,1
A	mob	+Palemane Tanner
A	complete	745,2
A	mob	+Palemane Skinner
A	complete	745,3
A	mob	+Palemane Poacher
A	unitscan	Snagglespear
S	
A	goto	Mulgore,47.63,61.49
A	vendor	
A	collect	1179,10,746,1 << Shaman/Druid
A	collect	4541,10,746,1 << Warrior
A	target	Jhawna Oatwind
A	money	<0.025
S	Tauren
A	turnin	754
A	accept	756
A	target	+Mull Thunderhorn
A	goto	Mulgore,48.53,60.40
A	turnin	745
A	target	+Baine Bloodhoof
A	goto	Mulgore,47.51,60.16
S	!Tauren
A	goto	Mulgore,47.51,60.16
A	turnin	745
A	target	Baine Bloodhoof
S	
A	goto	Mulgore,46.80,60.85
A	train	3273
A	money	<0.01
A	target	Vira Younghoof
S	Shaman/Druid
A	goto	Mulgore,45.66,58.60
A	vendor	
A	target	Mahnott Roughwound
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Shaman/Druid
A	goto	Mulgore,45.66,58.60
A	collect	2495,1,749,1
A	money	<0.0504
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Warrior
A	goto	Mulgore,45.66,58.60
A	vendor	
A	target	Mahnott Roughwound
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.9
S	Warrior
A	goto	Mulgore,45.66,58.60
A	collect	2493,1,749,1
A	money	<0.0701
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.9
S	Hunter
A	goto	Mulgore,45.50,58.47
A	vendor	
A	target	Kennah Hawkseye
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.0
S	Hunter
A	goto	Mulgore,45.50,58.47
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
A	goto	Mulgore,47.76,57.53
A	turnin	771
A	target	Zarlman Two-Moons
A	accept	772
S	Hunter
A	goto	Mulgore,47.81,55.69
A	train	5116
A	target	Yaw Sharpmane
A	xp	<8,1
S	Druid
A	goto	Mulgore,48.48,59.64
A	train	5186
A	target	Gennia Runetotem
A	xp	<8,1
S	Warrior
A	goto	Mulgore,49.52,60.58
A	train	284
A	target	Krang Stonehoof
A	xp	<8,1
S	Shaman
A	goto	Mulgore,48.38,59.15
A	train	8044
A	target	Narm Skychaser
A	xp	<8,1
S	
T	loop	
A	goto	Mulgore,55.14,60.65,0
A	goto	Mulgore,51.50,59.23,50,0
A	goto	Mulgore,53.00,60.24,50,0
A	goto	Mulgore,55.14,60.65,50,0
A	goto	Mulgore,57.47,61.26,50,0
A	goto	Mulgore,59.65,62.40,50,0
A	goto	Mulgore,55.14,60.65,50,0
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
A	goto	Mulgore,53.74,48.17
A	turnin	749
A	accept	751
S	Tauren
T	loop	
A	goto	Mulgore,58.1,48.6,0
A	goto	Mulgore,58.1,48.6,60,0
A	goto	Mulgore,54.5,40.1,60,0
A	goto	Mulgore,46.4,50.7,60,0
A	complete	756,1
A	mob	+Prairie Stalker
A	complete	756,2
A	mob	+Flatland Cougar
S	
T	optional	
T	label	Clawsx
S	
T	completewith	Thunderhorn
A	goto	Mulgore,46.5,55.5,150
A	subzoneskip	222
S	Hunter
A	goto	Mulgore,47.81,55.69
A	train	5116
A	target	Yaw Sharpmane
A	xp	<8,1
S	
T	label	Mazzturnin
A	goto	Mulgore,46.97,57.07
A	turnin	766
A	target	Maur Raincaller
A	isQuestComplete	766
S	Shaman/Druid
A	goto	Mulgore,45.66,58.60
A	vendor	
A	target	Mahnott Roughwound
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Shaman/Druid
A	goto	Mulgore,45.66,58.60
A	collect	2495,1,743,1
A	money	<0.0504
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Warrior
A	goto	Mulgore,45.66,58.60
A	vendor	
A	target	Mahnott Roughwound
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.9
S	Warrior
A	goto	Mulgore,45.66,58.60
A	collect	2493,1,743,1
A	money	<0.0701
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.9
S	Hunter
A	goto	Mulgore,45.50,58.47
A	vendor	
A	target	Kennah Hawkseye
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.0
S	Hunter
A	goto	Mulgore,45.50,58.47
A	collect	2509,1,743,1
A	money	<0.0414
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.0
S	Hunter
A	goto	Mulgore,45.86,57.67
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
A	goto	Mulgore,45.90,58.73
A	vendor	
A	target	Harant Ironbrace
S	
A	goto	Mulgore,48.71,59.32
A	turnin	761
A	target	Harken Windtotem
A	isQuestComplete	761
S	Tauren
A	goto	Mulgore,48.53,60.40
A	turnin	756
A	timer	8,Thunderhorn Totem RP
A	accept	758
A	target	Mull Thunderhorn
S	
T	optional	
T	label	Thunderhorn
S	Shaman
A	goto	Mulgore,48.38,59.15
A	train	8044
A	target	Narm Skychaser
A	xp	<8,1
S	Druid
A	goto	Mulgore,48.48,59.64
A	train	5186
A	target	Gennia Runetotem
A	xp	<8,1
S	Warrior
A	goto	Mulgore,49.52,60.58
A	train	284
A	target	Krang Stonehoof
A	xp	<8,1
S	Hunter
A	goto	Mulgore,47.81,55.69
A	train	5116
A	target	Yaw Sharpmane
A	xp	<8,1
S	
A	goto	Mulgore,46.63,61.08
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
T	label	ThunderhornCleanse
A	goto	Mulgore,44.49,45.36
A	complete	758,1
S	
A	goto	Mulgore,31.27,49.87
A	use	4702
A	complete	746,1
A	mob	Bael'dun Digger
A	mob	Bael'dun Appraiser
S	
T	loop	
A	goto	Mulgore,31.74,40.31,0
A	goto	Mulgore,34.08,43.71,50,0
A	goto	Mulgore,32.98,42.96,50,0
A	goto	Mulgore,31.72,43.08,50,0
A	goto	Mulgore,31.08,42.09,50,0
A	goto	Mulgore,31.12,40.87,50,0
A	goto	Mulgore,31.74,40.31,50,0
A	goto	Mulgore,32.44,41.17,50,0
A	goto	Mulgore,33.57,41.30,50,0
A	goto	Mulgore,33.82,40.26,50,0
A	goto	Mulgore,34.48,41.21,50,0
A	goto	Mulgore,34.50,42.29,50,0
A	complete	743,1
A	mob	Windfury Wind Witch
A	mob	Windfury Harpy
S	
T	completewith	next
A	goto	Mulgore,33.37,36.52,50
S	
T	label	Burial
A	goto	Mulgore,32.72,36.09
A	turnin	772
A	accept	773
A	target	Seer Wiserunner
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
T	completewith	next
A	complete	761,1
A	mob	Wiry Swoop
A	mob	Swoop
A	mob	Taloned Swoop
S	
T	label	SacredBurial
A	goto	Mulgore,59.85,25.62
A	accept	833
A	target	Lorekeeper Raintotem
S	
T	completewith	next
A	complete	833,1
A	mob	Bristleback Interloper
S	
A	goto	Mulgore,61.45,21.01
A	turnin	773
A	accept	775
A	target	Ancestral Spirit
S	
T	loop	
A	goto	Mulgore,59.85,25.62,0
A	goto	Mulgore,59.85,25.62,25,0
A	goto	Mulgore,61.14,22.93,25,0
A	goto	Mulgore,61.77,22.49,25,0
A	goto	Mulgore,62.18,22.05,25,0
A	goto	Mulgore,62.32,20.89,25,0
A	goto	Mulgore,61.62,19.50,25,0
A	goto	Mulgore,60.44,19.50,25,0
A	goto	Mulgore,60.16,21.06,25,0
A	goto	Mulgore,60.41,21.96,25,0
A	goto	Mulgore,61.12,22.88,25,0
A	complete	833,1
A	mob	Bristleback Interloper
S	
A	goto	Mulgore,59.85,25.62
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
A	goto	Mulgore,51.00,18.40,0
A	goto	Mulgore,59.52,23.36,60,0
A	goto	Mulgore,57.51,19.08,60,0
A	goto	Mulgore,55.21,18.67,60,0
A	goto	Mulgore,52.99,17.34,60,0
A	goto	Mulgore,51.00,18.40,60,0
A	goto	Mulgore,49.84,20.74,60,0
A	goto	Mulgore,49.82,23.69,60,0
A	goto	Mulgore,49.52,26.10,60,0
A	goto	Mulgore,49.72,28.14,60,0
A	goto	Mulgore,50.79,29.37,60,0
A	goto	Mulgore,52.24,30.07,60,0
A	goto	Mulgore,54.21,30.43,60,0
A	goto	Mulgore,56.15,30.35,60,0
A	goto	Mulgore,57.77,30.48,60,0
A	goto	Mulgore,58.79,28.52,60,0
A	goto	Mulgore,60.56,25.88,60,0
A	goto	Mulgore,59.52,23.36,60,0
A	complete	761,1
A	mob	Wiry Swoop
A	mob	Swoop
A	mob	Taloned Swoop
S	
T	loop	
A	goto	Mulgore,55.06,32.48,0
A	goto	Mulgore,55.06,32.48,60,0
A	goto	Mulgore,53.84,40.80,60,0
A	goto	Mulgore,53.19,45.16,60,0
A	goto	Mulgore,57.45,48.86,60,0
A	goto	Mulgore,59.04,52.79,60,0
A	goto	Mulgore,59.12,58.09,60,0
A	goto	Mulgore,48.67,44.84,60,0
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
T	optional	
T	loop	
A	goto	Mulgore,59.52,23.36,60,0
A	goto	Mulgore,57.51,19.08,60,0
A	goto	Mulgore,55.21,18.67,60,0
A	goto	Mulgore,52.99,17.34,60,0
A	goto	Mulgore,51.00,18.40,60,0
A	goto	Mulgore,49.84,20.74,60,0
A	goto	Mulgore,49.82,23.69,60,0
A	goto	Mulgore,49.52,26.10,60,0
A	goto	Mulgore,49.72,28.14,60,0
A	goto	Mulgore,50.79,29.37,60,0
A	goto	Mulgore,52.24,30.07,60,0
A	goto	Mulgore,54.21,30.43,60,0
A	goto	Mulgore,56.15,30.35,60,0
A	goto	Mulgore,57.77,30.48,60,0
A	goto	Mulgore,58.79,28.52,60,0
A	goto	Mulgore,60.56,25.88,60,0
A	goto	Mulgore,59.52,23.36,60,0
A	xp	9+3020
A	isQuestComplete	761
A	isQuestComplete	766
S	
T	optional	
T	loop	
A	goto	Mulgore,59.52,23.36,60,0
A	goto	Mulgore,57.51,19.08,60,0
A	goto	Mulgore,55.21,18.67,60,0
A	goto	Mulgore,52.99,17.34,60,0
A	goto	Mulgore,51.00,18.40,60,0
A	goto	Mulgore,49.84,20.74,60,0
A	goto	Mulgore,49.82,23.69,60,0
A	goto	Mulgore,49.52,26.10,60,0
A	goto	Mulgore,49.72,28.14,60,0
A	goto	Mulgore,50.79,29.37,60,0
A	goto	Mulgore,52.24,30.07,60,0
A	goto	Mulgore,54.21,30.43,60,0
A	goto	Mulgore,56.15,30.35,60,0
A	goto	Mulgore,57.77,30.48,60,0
A	goto	Mulgore,58.79,28.52,60,0
A	goto	Mulgore,60.56,25.88,60,0
A	goto	Mulgore,59.52,23.36,60,0
A	xp	9+3720
A	isQuestComplete	761
S	
T	optional	
T	loop	
A	goto	Mulgore,59.52,23.36,60,0
A	goto	Mulgore,57.51,19.08,60,0
A	goto	Mulgore,55.21,18.67,60,0
A	goto	Mulgore,52.99,17.34,60,0
A	goto	Mulgore,51.00,18.40,60,0
A	goto	Mulgore,49.84,20.74,60,0
A	goto	Mulgore,49.82,23.69,60,0
A	goto	Mulgore,49.52,26.10,60,0
A	goto	Mulgore,49.72,28.14,60,0
A	goto	Mulgore,50.79,29.37,60,0
A	goto	Mulgore,52.24,30.07,60,0
A	goto	Mulgore,54.21,30.43,60,0
A	goto	Mulgore,56.15,30.35,60,0
A	goto	Mulgore,57.77,30.48,60,0
A	goto	Mulgore,58.79,28.52,60,0
A	goto	Mulgore,60.56,25.88,60,0
A	goto	Mulgore,59.52,23.36,60,0
A	xp	9+3700
A	isQuestComplete	766
S	
T	optional	
T	loop	
A	goto	Mulgore,59.52,23.36,60,0
A	goto	Mulgore,57.51,19.08,60,0
A	goto	Mulgore,55.21,18.67,60,0
A	goto	Mulgore,52.99,17.34,60,0
A	goto	Mulgore,51.00,18.40,60,0
A	goto	Mulgore,49.84,20.74,60,0
A	goto	Mulgore,49.82,23.69,60,0
A	goto	Mulgore,49.52,26.10,60,0
A	goto	Mulgore,49.72,28.14,60,0
A	goto	Mulgore,50.79,29.37,60,0
A	goto	Mulgore,52.24,30.07,60,0
A	goto	Mulgore,54.21,30.43,60,0
A	goto	Mulgore,56.15,30.35,60,0
A	goto	Mulgore,57.77,30.48,60,0
A	goto	Mulgore,58.79,28.52,60,0
A	goto	Mulgore,60.56,25.88,60,0
A	goto	Mulgore,59.52,23.36,60,0
A	xp	9+4400
S	!Druid
T	completewith	Bloodhooffinalturnins1
A	hs	
A	use	6948
A	bindlocation	222,1
A	subzoneskip	222
S	Druid
T	completewith	Bloodhooffinalturnins1
A	goto	Mulgore,47.33,57.17,120
A	subzoneskip	222
S	
A	goto	Mulgore,46.62,61.08
A	vendor	
A	target	Innkeeper Kauth
A	isQuestAvailable	870
S	Tauren
A	turnin	746
A	target	+Baine Bloodhoof
A	goto	Mulgore,47.51,60.16
A	turnin	743
A	target	+Ruul Eagletalon
A	goto	Mulgore,47.35,62.02
A	turnin	758
A	timer	8,Thunderhorn Cleansing RP
A	target	+Mull Thunderhorn
A	goto	Mulgore,48.54,60.38
A	turnin	761
A	target	+Harken Windtotem
A	goto	Mulgore,48.71,59.32
A	isQuestComplete	761
S	Tauren
T	label	Bloodhoofturnins1
A	turnin	746
A	target	+Baine Bloodhoof
A	goto	Mulgore,47.51,60.16
A	turnin	743
A	target	+Ruul Eagletalon
A	goto	Mulgore,47.35,62.02
A	turnin	758
A	timer	8,Thunderhorn Cleansing RP
A	target	+Mull Thunderhorn
A	goto	Mulgore,48.54,60.38
S	!Tauren
A	turnin	746
A	target	+Baine Bloodhoof
A	goto	Mulgore,47.51,60.16
A	turnin	743
A	target	+Ruul Eagletalon
A	goto	Mulgore,47.35,62.02
A	turnin	761
A	target	+Harken Windtotem
A	goto	Mulgore,48.71,59.32
A	isQuestComplete	761
S	!Tauren
A	turnin	746
A	target	+Baine Bloodhoof
A	goto	Mulgore,47.51,60.16
A	turnin	743
A	target	+Ruul Eagletalon
A	goto	Mulgore,47.35,62.02
S	
T	optional	
T	label	Bloodhoofturnins1
S	Hunter
A	goto	Mulgore,45.50,58.47
A	collect	2519,1000,6061,1 << Hunter
A	target	Kennah Hawkseye
S	
A	goto	Mulgore,46.97,57.07
A	turnin	766
A	target	Maur Raincaller
A	isQuestComplete	766
S	Warrior
A	goto	Mulgore,49.52,60.58
A	train	6546
A	target	Krang Stonehoof
S	Shaman
A	goto	Mulgore,48.38,59.15
A	accept	2984
A	trainer	
A	target	Narm Skychaser
S	Hunter
A	goto	Mulgore,47.81,55.69
A	accept	6061
A	trainer	
A	target	Yaw Sharpmane
S	Druid
A	goto	Mulgore,48.48,59.64
A	trainer	
A	accept	5928
A	target	Gennia Runetotem
A	isQuestAvailable	5928
S	Druid
A	goto	Mulgore,48.48,59.64
A	train	8924
A	target	Gennia Runetotem
S	Hunter
T	loop	
A	goto	Mulgore,39.38,57.43,0
A	goto	Mulgore,42.87,54.88,50,0
A	goto	Mulgore,40.73,55.60,50,0
A	goto	Mulgore,39.38,57.43,50,0
A	use	15914
A	complete	6061,1
A	mob	Adult Plainstrider
S	Hunter
A	goto	Mulgore,47.81,55.69
A	turnin	6061
A	accept	6087
A	target	Yaw Sharpmane
S	Hunter
T	loop	
A	goto	Mulgore,49.49,42.27,0
A	goto	Mulgore,47.18,50.15,50,0
A	goto	Mulgore,46.65,47.22,50,0
A	goto	Mulgore,48.18,45.27,50,0
A	goto	Mulgore,49.49,42.27,50,0
A	use	15915
A	complete	6087,1
A	mob	Prairie Stalker
S	Hunter
A	goto	Mulgore,47.81,55.69
A	turnin	6087
A	accept	6088
A	target	Yaw Sharpmane
S	Hunter
T	loop	
A	goto	Mulgore,47.25,41.33,0
A	goto	Mulgore,47.25,41.33,80,0
A	goto	Mulgore,45.41,40.29,80,0
A	goto	Mulgore,51.57,44.40,80,0
A	use	15916
A	complete	6088,1
A	mob	Swoop
S	Hunter
A	goto	Mulgore,47.81,55.69
A	turnin	6088
A	accept	6089
A	target	Yaw Sharpmane
S	
A	goto	Mulgore,47.63,61.49
A	collect	1179,20,818,1 << Shaman/Druid
A	collect	4541,20,818,1 << Warrior
A	target	Innkeeper Grosk
A	money	<0.05
A	target	Jhawna Oatwind
S	
T	loop	
A	goto	Mulgore,55.14,60.65,0
A	goto	Mulgore,51.50,59.23,50,0
A	goto	Mulgore,53.00,60.24,50,0
A	goto	Mulgore,55.14,60.65,50,0
A	goto	Mulgore,57.47,61.26,50,0
A	goto	Mulgore,59.65,62.40,50,0
A	goto	Mulgore,55.14,60.65,50,0
A	line	Mulgore,51.50,59.23,53.00,60.24,55.14,60.65,57.47,61.26,59.65,62.40
A	turnin	751
A	accept	764
A	accept	765
A	unitscan	Morin Cloudstalker
A	group	
S	
T	loop	
A	goto	Mulgore,55.14,60.65,0
A	goto	Mulgore,51.50,59.23,50,0
A	goto	Mulgore,53.00,60.24,50,0
A	goto	Mulgore,55.14,60.65,50,0
A	goto	Mulgore,57.47,61.26,50,0
A	goto	Mulgore,59.65,62.40,50,0
A	goto	Mulgore,55.14,60.65,50,0
A	line	Mulgore,51.50,59.23,53.00,60.24,55.14,60.65,57.47,61.26,59.65,62.40
A	turnin	751
A	unitscan	Morin Cloudstalker
S	
T	completewith	Fizsprocket
A	goto	Mulgore,61.51,47.29,20
A	group	
S	
T	completewith	next
A	complete	764,1
A	mob	+Venture Co. Worker
A	complete	764,2
A	mob	+Venture Co. Supervisor
A	group	2
S	
T	label	Fizsprocket
A	goto	Mulgore,64.95,43.33
A	complete	765,1
A	mob	Supervisor Fizsprocket
A	group	2
S	
T	loop	
A	goto	Mulgore,61.35,47.55,0
A	goto	Mulgore,61.35,47.55,25,0
A	goto	Mulgore,60.10,47.84,25,0
A	goto	Mulgore,59.50,48.21,25,0
A	goto	Mulgore,59.68,48.85,25,0
A	goto	Mulgore,60.14,49.14,25,0
A	goto	Mulgore,62.01,48.74,25,0
A	goto	Mulgore,61.89,47.84,25,0
A	complete	764,1
A	mob	+Venture Co. Worker
A	complete	764,2
A	mob	+Venture Co. Supervisor
A	group	2
S	
T	loop	
A	goto	Mulgore,55.14,60.65,0
A	goto	Mulgore,51.50,59.23,50,0
A	goto	Mulgore,53.00,60.24,50,0
A	goto	Mulgore,55.14,60.65,50,0
A	goto	Mulgore,57.47,61.26,50,0
A	goto	Mulgore,59.65,62.40,50,0
A	goto	Mulgore,55.14,60.65,50,0
A	line	Mulgore,51.50,59.23,53.00,60.24,55.14,60.65,57.47,61.26,59.65,62.40
A	turnin	764
A	turnin	765
A	unitscan	Morin Cloudstalker
A	group	
S	Hunter
T	loop	
A	goto	Mulgore,67.19,63.78,0
A	goto	Mulgore,67.19,63.78,50,0
A	goto	Mulgore,66.34,67.01,50,0
A	goto	Mulgore,63.86,66.31,50,0
A	goto	Mulgore,61.81,65.52,50,0
A	goto	Mulgore,61.61,61.32,50,0
A	goto	Mulgore,63.58,60.51,50,0
A	goto	Mulgore,65.56,59.37,50,0
A	goto	Mulgore,67.62,59.06,50,0
A	goto	Mulgore,66.34,67.01,50,0
A	cast	1515
A	mob	Prairie Wolf Alpha
S	
T	completewith	next
A	goto	Mulgore,69.6,60.4,100,0
A	zone	The Barrens
S	
A	goto	The Barrens,44.45,59.16
A	fp	Camp Taurajo
A	target	Omusa Thunderhorn
A	isQuestAvailable	5922
S	Tauren
A	goto	The Barrens,44.9,58.6
A	accept	854
A	target	Kirge Sternhorn
S	
T	completewith	next
A	subzone	380
S	
A	accept	870
A	target	+Tonga Runetotem
A	goto	The Barrens,52.26,31.93
A	accept	844
A	target	+Sergra Darkthorn
A	goto	The Barrens,52.24,31.00
A	accept	869
A	target	+Gazrog
A	goto	The Barrens,51.93,30.32
A	turnin	854
A	accept	871
A	accept	5041
A	target	+Thork
A	goto	The Barrens,51.50,30.87
A	accept	6361
A	target	+Jahan Hawkwing
A	goto	The Barrens,51.21,29.05
S	
A	goto	The Barrens,51.50,30.34
A	turnin	6361
A	accept	6362
A	target	Devrak
S	Hunter/Druid
T	completewith	next
A	goto	The Barrens,51.50,30.34
A	fly	Thunder Bluff
A	target	Devrak
A	zoneskip	Thunder Bluff
S	Hunter/Druid
A	goto	Thunder Bluff,45.6,55.9
A	turnin	6362
A	accept	6363
A	target	Ahanu
S	Druid
A	goto	Thunder Bluff,45.83,64.74
A	home	
A	target	Innkeeper Pala
A	bindlocation	1638
A	isQuestAvailable	5932
S	Hunter/Druid
A	goto	Thunder Bluff,60.0,51.7
A	turnin	775
A	target	Cairne Bloodhoof
S	Hunter
A	goto	Thunder Bluff,57.4,89.4
A	turnin	6089
A	target	Holt Thunderhorn
S	Hunter
A	goto	Thunder Bluff,54.08,84.08
A	train	24547
A	target	Hesuwa Thunderhorn
S	Hunter
T	completewith	ReturntoJahan
S	Druid
A	goto	Thunder Bluff,76.7,27.3
A	turnin	5928
A	accept	5922
A	target	Arch Druid Hamuul Runetotem
A	target	Turak Runetotem
A	isOnQuest	5928
S	Druid
A	goto	Thunder Bluff,76.7,27.3
A	accept	5922
A	target	Arch Druid Hamuul Runetotem
A	target	Turak Runetotem
S	Druid
T	completewith	next
A	cast	18960
A	zoneskip	Moonglade
S	Druid
A	goto	Moonglade,56.21,30.64
A	turnin	5922
A	accept	5930
A	target	Dendrite Starblaze
S	Druid
A	goto	Moonglade,39.2,27.5
A	complete	5930,1
A	target	Great Bear Spirit
A	skipgossip	
S	Druid
T	completewith	next
A	cast	18960
S	Druid
A	goto	Moonglade,56.21,30.64
A	turnin	5930
A	accept	5932
A	target	Dendrite Starblaze
S	Druid
T	completewith	DruidBearForm
A	hs	
A	cooldown	item,6948,>0
A	use	6948
A	bindlocation	1638,1
S	Druid
T	completewith	next
A	goto	Moonglade,44.29,45.87
A	fly	Thunder Bluff
A	target	Bunthen Plainswind
A	zoneskip	Thunder Bluff
A	cooldown	item,6948,<0
S	Druid
T	label	DruidBearForm
A	goto	Thunder Bluff,76.7,27.3
A	turnin	5932
A	accept	6002
A	target	Turak Runetotem
S	Druid/Hunter
A	goto	Thunder Bluff,47.00,49.82
A	turnin	6363
A	accept	6364
A	target	Tal
S	Druid/Hunter
T	ah	
A	goto	Thunder Bluff,44.43,43.19
A	train	8613
A	target	Mooranta
S	Druid/Hunter
T	ah	
A	goto	Thunder Bluff,44.39,44.72
A	accept	768
A	target	Veren Tallstrider
A	skill	skinning,1,1
S	Druid/Hunter
T	ah	
A	goto	Thunder Bluff,40.39,51.77
A	collect	2318,12,768,1
A	target	Auctioneer Stampi
A	skill	skinning,1,1
S	Druid/Hunter
T	ah	
A	goto	Thunder Bluff,44.39,44.72
A	turnin	768
A	target	Veren Tallstrider
A	skill	skinning,1,1
S	Hunter
T	completewith	ReturntoJahan
A	goto	Thunder Bluff,47.00,49.82
A	fly	Crossroads
A	target	Tal
A	zoneskip	The Barrens
S	Druid
T	completewith	next
A	goto	Thunder Bluff,47.00,49.82
A	fly	Camp Taurajo
A	target	Tal
A	zoneskip	The Barrens
S	Druid
A	goto	The Barrens,42.00,60.86
A	use	15710
A	complete	6002,1
A	mob	Lunaclaw
A	target	Lunaclaw Spirit
A	skipgossip	
S	Druid
T	completewith	next
A	goto	The Barrens,44.45,59.15
A	fly	Thunder Bluff
A	target	Omusa Thunderhorn
A	zoneskip	Thunder Bluff
S	Druid
A	goto	Thunder Bluff,76.477,27.221
A	turnin	6002
A	target	Turak Runetotem
S	Druid
T	completewith	next
A	goto	Thunder Bluff,47.00,49.82
A	fly	Crossroads
A	target	Tal
A	zoneskip	The Barrens
S	Hunter/Druid
T	label	ReturntoJahan
A	goto	The Barrens,51.21,29.05
A	turnin	6364
A	target	Jahan Hawkwing
S	Shaman/Druid
A	goto	The Barrens,51.24,29.15
A	collect	854,1,784,1
A	money	<0.3022
A	target	Nargal Deatheye
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.4
S	Shaman/Druid
T	optional	
T	completewith	FurlScornbrow
A	use	854
A	itemcount	854,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.4
S	Warrior
A	goto	The Barrens,51.24,29.15
A	collect	1197,1,784,1
A	money	<0.2666
A	target	Nargal Deatheye
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.0
S	Warrior
T	optional	
T	completewith	FurlScornbrow
A	use	1197
A	itemcount	1197,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.0
S	Tauren Hunter
A	goto	The Barrens,51.11,29.07
A	collect	2519,1600,6061,1
A	vendor	
A	target	Uthrok
S	Shaman
A	goto	The Barrens,55.86,19.95
A	turnin	2984
A	accept	1524
A	target	Kranal Fiss
S	Shaman
T	completewith	CallofFire2
A	zone	Durotar
A	zoneskip	Durotar
S	Shaman
T	completewith	next
A	goto	Durotar,36.74,57.78,10,0
A	goto	Durotar,36.63,58.15,8,0
A	goto	Durotar,36.63,58.15,8,0
A	goto	Durotar,36.77,58.98,8,0
A	goto	Durotar,36.85,58.32,8,0
A	goto	Durotar,37.24,58.13,8,0
A	goto	Durotar,37.86,58.18,8,0
A	goto	Durotar,38.05,57.79,8,0
A	goto	Durotar,38.93,57.54,8,0
A	goto	Durotar,39.19,57.90,8,0
A	goto	Durotar,39.16,58.56,10
S	Shaman
T	label	CallofFire2
A	goto	Durotar,38.52,58.93
A	turnin	1524
A	accept	1525
A	target	Telf Joolam
S	Shaman
T	completewith	next
A	goto	Durotar,39.13,58.63,10,0
A	goto	Durotar,39.17,57.93,10,0
A	goto	Durotar,38.95,57.58,8,0
A	goto	Durotar,38.61,57.67,8,0
A	goto	Durotar,38.06,57.78,8,0
A	goto	Durotar,37.76,58.19,8,0
A	goto	Durotar,36.96,58.07,15
S	Shaman
T	completewith	next
A	zone	The Barrens
A	zoneskip	The Barrens
S	Shaman
T	loop	
A	goto	The Barrens,53.57,25.51,0
A	goto	The Barrens,54.97,25.23,50,0
A	goto	The Barrens,54.2,24.60,50,0
A	goto	The Barrens,53.57,25.51,50,0
A	complete	1525,1
A	mob	Razormane Water Seeker
A	mob	Razormane Thornweaver
S	Shaman
T	completewith	FurlScornbrow
A	zone	Durotar
S	!Shaman
T	completewith	FurlScornbrow
A	zone	Durotar
S	
T	optional	
A	abandon	764
A	abandon	765
S	
T	completewith	next
A	goto	Durotar,49.75,40.38,6,0
A	goto	Durotar,49.77,40.24,6,0
A	goto	Durotar,49.69,40.21,6,0
A	goto	Durotar,49.68,40.30,6,0
A	goto	Durotar,49.78,40.34,6,0
A	goto	Durotar,49.79,39.96,6,0
A	goto	Durotar,49.60,40.04,8
S	
T	label	FurlScornbrow
A	goto	Durotar,49.89,40.39
A	accept	791
A	target	Furl Scornbrow
S	
A	goto	Durotar,51.51,41.64
A	vendor	
A	home	
A	bindlocation	362
A	isQuestAvailable	815
A	group	
S	
A	goto	Durotar,51.09,42.49
A	accept	815
A	target	Cook Torka
S	
A	goto	Durotar,51.95,43.50
A	accept	784
A	accept	837
A	target	Gar'thok
S	
T	completewith	Benedict
A	goto	Durotar,58.08,57.13,120
S	
T	completewith	Benedict
T	requires	TravelToTiragarde
A	goto	Durotar,59.81,58.22,8,0
A	goto	Durotar,59.64,58.44,8,0
A	goto	Durotar,59.55,57.89,8,0
A	goto	Durotar,59.29,57.89,8
S	
T	completewith	AgedEnvelope
A	complete	784,1
A	mob	+Kul Tiras Sailor
A	complete	784,2
A	mob	+Kul Tiras Marine
A	complete	791,1
S	
T	label	Benedict
A	goto	Durotar,59.75,58.27
A	complete	784,3
A	collect	4882,1
A	mob	Lieutenant Benedict
S	
T	label	AgedEnvelope
A	goto	Durotar,59.87,57.87,5,0
A	goto	Durotar,59.83,57.58,5,0
A	goto	Durotar,59.80,57.82,5,0
A	goto	Durotar,59.94,57.82,5,0
A	goto	Durotar,59.94,57.61,5,0
A	goto	Durotar,59.27,57.65
A	collect	4881,1,830
A	accept	830
A	use	4881
S	
T	loop	
A	goto	Durotar,58.99,58.30,0
A	goto	Durotar,57.65,58.52,30,0
A	goto	Durotar,57.36,56.59,30,0
A	goto	Durotar,58.10,55.52,30,0
A	goto	Durotar,58.54,53.68,30,0
A	goto	Durotar,56.54,54.52,30,0
A	goto	Durotar,56.37,58.35,30,0
A	goto	Durotar,58.99,58.30,30,0
A	complete	784,1
A	mob	+Kul Tiras Sailor
A	complete	784,2
A	mob	+Kul Tiras Marine
A	complete	791,1
A	mob	+Kul Tiras Sailor
A	mob	+Kul Tiras Marine
A	itemcount	4870,<8
S	
T	optional	
T	loop	
A	goto	Durotar,58.99,58.30,0
A	goto	Durotar,57.65,58.52,30,0
A	goto	Durotar,57.36,56.59,30,0
A	goto	Durotar,58.10,55.52,30,0
A	goto	Durotar,58.54,53.68,30,0
A	goto	Durotar,56.54,54.52,30,0
A	goto	Durotar,56.37,58.35,30,0
A	goto	Durotar,58.99,58.30,30,0
A	complete	784,1
A	mob	+Kul Tiras Sailor
A	complete	784,2
A	mob	+Kul Tiras Marine
S	
T	label	ScrapsFinished
T	loop	
A	goto	Durotar,58.99,58.30,0
A	goto	Durotar,57.65,58.52,30,0
A	goto	Durotar,57.36,56.59,30,0
A	goto	Durotar,58.10,55.52,30,0
A	goto	Durotar,58.54,53.68,30,0
A	goto	Durotar,56.54,54.52,30,0
A	goto	Durotar,56.37,58.35,30,0
A	goto	Durotar,58.99,58.30,30,0
A	complete	791,1
A	mob	Kul Tiras Sailor
A	mob	Kul Tiras Marine
S	
T	completewith	next
A	goto	Durotar,52.06,68.30,50
A	subzoneskip	367
S	
A	goto	Durotar,52.06,68.30
A	accept	2161
A	target	Ukor
S	
T	label	SenjinPickups
A	accept	817
A	target	+Vel'rin Fang
A	goto	Durotar,55.95,73.93
A	accept	818
A	target	+Master Vornal
A	goto	Durotar,55.94,74.40
A	accept	808
A	accept	826
A	accept	823
A	target	+Master Gadrin
A	goto	Durotar,55.94,74.72
S	
T	completewith	TaillasherEggs
A	complete	818,2
A	mob	+Pygmy Surf Crawler
A	mob	+Surf Crawler
A	complete	818,1
A	mob	+Makrura Shellhide
A	mob	+Makrura Clacker
S	
T	completewith	next
A	complete	817,1
A	mob	Durotar Tiger
S	
T	loop	
T	label	TaillasherEggs
A	goto	Durotar,59.49,83.77,0
A	goto	Durotar,60.28,80.02,60,0
A	goto	Durotar,60.28,82.74,60,0
A	goto	Durotar,59.62,84.76,60,0
A	goto	Durotar,60.02,87.94,60,0
A	goto	Durotar,59.06,90.71,60,0
A	goto	Durotar,61.50,91.55,60,0
A	goto	Durotar,61.88,95.43,60,0
A	goto	Durotar,62.69,97.21,60,0
A	goto	Durotar,63.00,94.40,60,0
A	goto	Durotar,59.85,89.56,60,0
A	goto	Durotar,59.49,83.77,60,0
A	complete	815,1
A	mob	Bloodtalon Taillasher
S	
T	completewith	MinshinasSkull
A	goto	Durotar,67.06,87.21,120
S	
T	completewith	MinshinasSkull
A	complete	818,2
A	mob	+Pygmy Surf Crawler
A	mob	+Surf Crawler
A	complete	818,1
A	mob	+Makrura Shellhide
A	mob	+Makrura Clacker
S	
T	completewith	MinshinasSkull
A	complete	826,1
A	mob	+Hexed Troll
A	complete	826,2
A	mob	+Voodoo Troll
S	
T	completewith	next
A	complete	826,3
A	mob	Zalazane
S	
T	label	MinshinasSkull
A	goto	Durotar,67.4,87.8
A	complete	808,1
S	
A	goto	Durotar,67.4,87.8
A	complete	826,3
A	mob	Zalazane
S	
T	completewith	next
A	complete	817,1
A	mob	Durotar Tiger
S	
T	label	Fur
T	loop	
A	goto	Durotar,67.23,88.76,0
A	goto	Durotar,67.23,88.76,40,0
A	goto	Durotar,66.52,87.74,40,0
A	goto	Durotar,65.94,86.72,40,0
A	goto	Durotar,65.90,84.04,40,0
A	goto	Durotar,65.88,82.85,40,0
A	goto	Durotar,67.38,82.61,40,0
A	goto	Durotar,68.42,82.43,40,0
A	goto	Durotar,68.50,84.32,40,0
A	goto	Durotar,68.47,86.77,40,0
A	goto	Durotar,67.23,88.00,40,0
A	complete	826,1
A	mob	+Hexed Troll
A	complete	826,2
A	mob	+Voodoo Troll
S	
T	completewith	next
A	complete	818,2
A	mob	+Pygmy Surf Crawler
A	mob	+Surf Crawler
A	complete	818,1
A	mob	+Makrura Shellhide
A	mob	+Makrura Clacker
S	
T	loop	
A	goto	Durotar,59.79,83.44,0
A	goto	Durotar,65.27,87.86,50,0
A	goto	Durotar,64.72,88.53,50,0
A	goto	Durotar,64.70,84.89,50,0
A	goto	Durotar,64.68,80.80,50,0
A	goto	Durotar,65.35,80.11,50,0
A	goto	Durotar,65.87,81.23,50,0
A	goto	Durotar,60.28,80.04,50,0
A	goto	Durotar,60.60,82.26,50,0
A	goto	Durotar,59.88,83.51,50,0
A	goto	Durotar,59.56,84.86,50,0
A	goto	Durotar,60.84,88.79,50,0
A	goto	Durotar,61.41,89.69,50,0
A	goto	Durotar,61.48,91.37,50,0
A	goto	Durotar,60.37,91.36,50,0
A	goto	Durotar,59.04,90.51,50,0
A	goto	Durotar,59.79,83.44,50,0
A	complete	817,1
A	mob	Durotar Tiger
S	
T	loop	
A	goto	Durotar,59.64,73.84,0
A	goto	Durotar,59.64,73.84,60,0
A	goto	Durotar,58.11,77.30,60,0
A	goto	Durotar,57.27,79.38,60,0
A	goto	Durotar,55.66,80.47,60,0
A	goto	Durotar,53.8,83.14,60,0
A	complete	818,2
A	mob	+Pygmy Surf Crawler
A	mob	+Surf Crawler
A	complete	818,1
A	mob	+Makrura Shellhide
A	mob	+Makrura Clacker
S	
T	completewith	Zalazaneturnin
A	goto	Durotar,56.06,74.72,150
A	subzoneskip	367
S	
T	completewith	next
A	goto	Durotar,56.48,73.11
A	vendor	
A	target	Trayexir
S	
T	label	Zalazaneturnin
A	turnin	808
A	turnin	826,2
A	turnin	826
A	target	+Master Gadrin
A	goto	Durotar,55.95,74.73
A	turnin	818
A	target	+Master Vornal
A	goto	Durotar,55.95,74.39
A	turnin	817
A	target	+Vel'rin Fang
A	goto	Durotar,55.95,73.93
S	
T	completewith	Stolensupplies
S	
T	loop	
A	goto	Durotar,49.22,48.96,0
A	goto	Durotar,50.21,50.78,30,0
A	goto	Durotar,50.18,49.23,30,0
A	goto	Durotar,49.48,49.14,30,0
A	goto	Durotar,49.32,48.18,30,0
A	goto	Durotar,48.81,49.00,30,0
A	goto	Durotar,48.49,49.29,30,0
A	goto	Durotar,47.58,49.62,30,0
A	goto	Durotar,47.06,49.53,30,0
A	goto	Durotar,46.90,48.11,30,0
A	goto	Durotar,49.22,48.96,30,0
A	complete	837,1
A	mob	+Razormane Quilboar
A	complete	837,2
A	mob	+Razormane Scout
S	
T	label	Encroachment
T	loop	
A	goto	Durotar,44.45,39.74,0
A	goto	Durotar,44.45,39.74,50,0
A	goto	Durotar,44.49,37.47,50,0
A	goto	Durotar,43.30,37.32,50,0
A	goto	Durotar,41.70,37.09,50,0
A	goto	Durotar,41.64,38.27,50,0
A	goto	Durotar,41.94,40.46,50,0
A	goto	Durotar,43.30,40.40,50,0
A	complete	837,3
A	mob	+Razormane Dustrunner
A	complete	837,4
A	mob	+Razormane Battleguard
S	
A	turnin	815
A	target	+Cook Torka
A	goto	Durotar,51.12,42.46
A	turnin	823
A	accept	806
A	target	+Orgnil Soulscar
A	goto	Durotar,52.25,43.18
A	turnin	784
A	turnin	837
A	turnin	830
A	accept	831
A	target	+Gar'Thok
A	goto	Durotar,51.95,43.50
A	group	
S	
A	turnin	815
A	target	+Cook Torka
A	goto	Durotar,51.12,42.46
A	turnin	823
A	target	+Orgnil Soulscar
A	goto	Durotar,52.25,43.18
A	turnin	784
A	turnin	837
A	turnin	830
A	accept	831
A	target	+Gar'Thok
A	goto	Durotar,51.95,43.50
S	Hunter
A	goto	Durotar,51.85,43.49
A	train	14281
A	target	Thotar
A	xp	<12,1
S	
A	goto	Durotar,51.51,41.64
A	turnin	2161
A	target	Innkeeper Grosk
S	
A	goto	Durotar,54.39,42.18
A	collect	4496,1,835,1
A	target	Jark
A	money	<0.05
S	Warrior
A	goto	Durotar,54.18,42.46
A	train	7384
A	target	Tarshaw Jaggedscar
A	xp	<12,1
S	Shaman
A	goto	Durotar,54.42,42.59
A	train	1535
A	target	Swart
A	xp	<12,1
S	
A	goto	Durotar,50.8,43.6
A	accept	840
A	target	Takrin Pathseeker
A	xp	<10,1
S	
T	completewith	next
A	goto	Durotar,50.22,43.06,12,0
A	goto	Durotar,50.09,42.97,8,0
A	goto	Durotar,50.20,42.30,12,0
A	goto	Durotar,49.96,40.96,12,0
A	goto	Durotar,49.67,40.42,10
S	
T	completewith	next
A	goto	Durotar,49.75,40.38,6,0
A	goto	Durotar,49.77,40.24,6,0
A	goto	Durotar,49.69,40.21,6,0
A	goto	Durotar,49.68,40.30,6,0
A	goto	Durotar,49.78,40.34,6,0
A	goto	Durotar,49.79,39.96,6,0
A	goto	Durotar,49.60,40.04,8
S	
A	goto	Durotar,49.89,40.39
A	turnin	791
A	target	Furl Scornbrow
S	
A	goto	Durotar,43.11,30.24
A	accept	816
A	target	Misha Tor'kren
S	
T	completewith	next
A	goto	Durotar,46.37,22.94,50
S	
A	goto	Durotar,46.37,22.94
A	accept	834
A	target	Rezlak
S	
T	loop	
A	goto	Durotar,49.70,21.90,0
A	goto	Durotar,49.70,21.90,40,0
A	goto	Durotar,49.70,24.33,40,0
A	goto	Durotar,50.13,25.70,40,0
A	goto	Durotar,50.85,25.96,40,0
A	goto	Durotar,51.65,27.67,40,0
A	goto	Durotar,49.85,27.07,40,0
A	goto	Durotar,50.68,31.55,40,0
A	goto	Durotar,48.10,34.36,40,0
A	goto	Durotar,47.35,33.40,40,0
A	goto	Durotar,48.49,32.01,40,0
A	goto	Durotar,47.19,30.87,40,0
A	complete	834,1
S	
A	goto	Durotar,46.37,22.94
A	turnin	834
A	accept	835
A	target	Rezlak
S	
T	completewith	next
A	goto	Durotar,53.41,27.81,15
S	
T	loop	
A	goto	Durotar,53.98,23.70,0
A	goto	Durotar,54.02,27.23,40,0
A	goto	Durotar,52.82,24.27,40,0
A	goto	Durotar,51.85,23.95,40,0
A	goto	Durotar,54.01,23.63,40,0
A	goto	Durotar,52.13,20.77,40,0
A	goto	Durotar,51.26,19.19,40,0
A	goto	Durotar,53.98,23.70,40,0
A	complete	835,1
A	mob	+Dustwind Savage
A	complete	835,2
A	mob	+Dustwind Storm Witch
S	Tauren Hunter
T	completewith	next
S	
A	goto	Durotar,46.37,22.94
A	turnin	835
A	target	Rezlak
S	
A	goto	Durotar,41.54,18.59
A	accept	812
A	target	Rhinag
S	
T	completewith	next
A	goto	Durotar,41.66,25.68,20
A	cast	2641
A	group	
S	
A	goto	Durotar,42.13,26.67
A	complete	806,1
A	mob	Fizzle Darkstorm
A	mob	Imp Minion
A	mob	Burning Blade Fanatic
A	mob	Lightning Hide
A	group	2
S	Druid
T	completewith	next
A	cast	18960
A	xp	<12,1
A	isQuestComplete	806
A	zoneskip	Moonglade
A	group	
S	Druid
A	goto	Moonglade,52.53,40.58
A	train	8936
A	target	Loganaar
A	xp	<12,1
A	isQuestComplete	806
A	group	
S	
T	completewith	next
A	hs	
A	cooldown	item,6948,>0
A	isQuestComplete	806
A	use	6948
A	group	
S	Shaman
T	completewith	next
A	hs	
A	cooldown	item,6948,>0
A	use	6948
A	solo	
S	
A	goto	Durotar,51.51,41.64
A	vendor	
A	collect	1179,20,818,1 << Mage/Warlock/Priest/Shaman
A	collect	2287,20,818,1 << Rogue/Warrior
A	target	Innkeeper Grosk
A	money	<0.05
A	group	
S	
A	goto	Durotar,52.24,43.15
A	turnin	806
A	accept	828
A	target	Orgnil Soulscar
A	isQuestComplete	806
A	group	
S	
A	goto	Durotar,52.24,43.15
A	accept	828
A	target	Orgnil Soulscar
A	isQuestTurnedIn	806
A	group	
S	
A	goto	Durotar,51.95,43.50
A	turnin	837
A	target	Gar'Thok
A	group	
S	Hunter
A	goto	Durotar,51.85,43.49
A	train	14281
A	target	Thotar
A	xp	<12,1
A	group	
S	Warrior
A	goto	Durotar,54.18,42.46
A	train	7384
A	target	Tarshaw Jaggedscar
A	xp	<12,1
A	group	
S	Shaman
A	goto	Durotar,54.42,42.59
A	train	1535
A	target	Swart
A	xp	<12,1
S	
T	completewith	next
A	goto	Durotar,55.40,36.73,80,0
A	goto	Durotar,56.07,30.05,80,0
A	goto	Durotar,56.41,20.04,50
A	isQuestTurnedIn	806
A	group	
S	
T	label	MargozTurnIn
A	goto	Durotar,56.41,20.04
A	turnin	828
A	accept	827
A	target	Margoz
A	isQuestTurnedIn	806
A	group	
S	Shaman
T	completewith	Collars1
A	goto	Durotar,53.18,29.15,50
A	solo	
S	
T	completewith	next
A	goto	Durotar,56.49,25.04,50,0
A	goto	Durotar,56.11,27.94,50,0
A	goto	Durotar,53.18,29.15,50
A	isQuestTurnedIn	806
A	group	
S	Shaman
T	loop	
A	goto	Durotar,51.90,25.70,0
A	goto	Durotar,53.18,29.15,20,0
A	goto	Durotar,52.70,27.97,12,0
A	goto	Durotar,53.05,27.87,12,0
A	goto	Durotar,53.14,27.24,12,0
A	goto	Durotar,52.84,26.80,12,0
A	goto	Durotar,52.07,26.85,12,0
A	goto	Durotar,51.90,25.70,12,0
A	complete	827,1
A	mob	+Burning Blade Thug
A	mob	+Burning Blade Neophyte
A	complete	1525,2
A	mob	+Burning Blade Cultist
A	isQuestTurnedIn	806
A	group	
S	!Shaman
T	label	Collars1
T	loop	
A	goto	Durotar,51.90,25.70,0
A	goto	Durotar,53.18,29.15,20,0
A	goto	Durotar,52.70,27.97,12,0
A	goto	Durotar,53.05,27.87,12,0
A	goto	Durotar,53.14,27.24,12,0
A	goto	Durotar,52.84,26.80,12,0
A	goto	Durotar,52.07,26.85,12,0
A	goto	Durotar,51.90,25.70,12,0
A	complete	827,1
A	mob	Burning Blade Thug
A	mob	Burning Blade Neophyte
A	mob	Burning Blade Cultist
A	isQuestTurnedIn	806
A	group	
S	Shaman
T	loop	
A	goto	Durotar,51.90,25.70,0
A	goto	Durotar,53.18,29.15,20,0
A	goto	Durotar,52.70,27.97,12,0
A	goto	Durotar,53.05,27.87,12,0
A	goto	Durotar,53.14,27.24,12,0
A	goto	Durotar,52.84,26.80,12,0
A	goto	Durotar,52.07,26.85,12,0
A	goto	Durotar,51.90,25.70,12,0
A	complete	1525,2
A	mob	Burning Blade Cultist
A	solo	
S	skip --logout skip Shaman
A	goto	Durotar,53.03,26.82
A	goto	Durotar,47.31,17.89,30
A	link	https://www.youtube.com/watch?v=9A6LHcLZeTU&ab
A	solo	
S	
T	completewith	next
A	goto	Durotar,56.30,27.91,80,0
A	goto	Durotar,56.41,20.04,50
A	isQuestTurnedIn	806
A	group	
S	
A	goto	Durotar,56.41,20.04
A	turnin	827
A	accept	829
A	target	Margoz
A	isQuestTurnedIn	806
A	group	
S	
T	completewith	Admiralorders1
A	goto	Orgrimmar,48.97,92.84,50
A	zoneskip	Orgrimmar
S	
A	goto	Orgrimmar,45.13,63.90
A	fp	Orgrimmar
A	target	Doras
A	isQuestAvailable	809
S	
T	label	Admiralorders1
A	goto	Orgrimmar,32.29,35.81
A	turnin	831
A	target	Nazgrel
S	Shaman
T	label	Shaman12training
A	goto	Orgrimmar,38.82,36.41
A	train	547
A	target	Kardris Dreamseeker
A	xp	<12,1
S	
A	goto	Orgrimmar,47.24,53.58
A	accept	813
A	target	Kor'ghan
A	isOnQuest	812
S	
T	completewith	FindingAntitode
A	abandon	812
A	isOnQuest	812
S	
T	label	NeeruFireblade
A	goto	Orgrimmar,49.49,50.56
A	turnin	829
A	accept	809
A	target	Neeru Fireblade
A	isOnQuest	829
A	group	
S	Hunter
T	completewith	HunterTraining
A	goto	Orgrimmar,68.02,38.69,30
S	Hunter
A	goto	Orgrimmar,66.34,14.83
A	train	24556
A	target	Xao'tsu
A	xp	<12,1
S	Hunter
A	goto	Orgrimmar,66.06,18.50
A	train	14281
A	target	Ormak Grimshot
A	xp	<12,1
S	Hunter
A	goto	Orgrimmar,81.52,19.60
A	train	227
A	target	Hanashi
S	Hunter
A	goto	Orgrimmar,81.17,18.69
A	collect	2507,1,813,1
A	money	<0.1751
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<5.7
S	Hunter
T	label	HunterTraining
A	goto	Orgrimmar,81.17,18.69
A	collect	2515,1600,828,1 << Hunter
A	collect	5439,1,813,1 << Hunter
A	target	Ghrawt
S	Hunter
T	optional	
T	completewith	FindingAntitode
A	use	2507
A	itemcount	2507,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<5.7
S	Tauren Warrior
A	goto	Orgrimmar,47.54,68.39
A	collect	1197,1,813,1
A	money	<0.2666
A	target	Urtharo
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.0
S	Tauren Warrior
T	optional	
T	completewith	FindingAntitode
A	use	1197
A	itemcount	1197,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.0
S	Shaman/Druid
A	goto	Orgrimmar,47.54,68.39
A	collect	854,1,813,1
A	money	<0.3022
A	target	Urtharo
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.4
S	Shaman/Druid
T	optional	
T	completewith	FindingAntitode
A	use	854
A	itemcount	854,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.4
S	
T	label	LeaveOrg2
T	completewith	Conscript
A	zone	Durotar
A	zoneskip	Durotar
S	
T	label	FindingAntitode
T	loop	
A	goto	Durotar,38.89,16.91,0
A	goto	Durotar,42.47,19.99,50,0
A	goto	Durotar,41.07,19.85,50,0
A	goto	Durotar,40.21,17.21,50,0
A	goto	Durotar,38.89,16.91,50,0
A	goto	Durotar,38.13,19.90,50,0
A	goto	Durotar,38.67,22.13,50,0
A	goto	Durotar,36.91,25.63,50,0
A	goto	Durotar,36.64,28.18,50,0
A	goto	Durotar,36.40,30.95,50,0
A	complete	813,1
A	mob	Venomtail Scorpid
A	isOnQuest	813
S	!Shaman
A	goto	Durotar,34.80,32.84,50,0
A	goto	Durotar,34.81,37.02,50,0
A	goto	Durotar,34.44,44.53,50,0
A	goto	Durotar,34.27,47.02,50,0
A	goto	Durotar,34.71,42.30
A	complete	816,1
A	mob	Dreadmaw Crocolisk
S	Shaman
T	completewith	CallofFire3
A	goto	Durotar,34.80,32.84,50,0
A	goto	Durotar,34.81,37.02,50,0
A	goto	Durotar,34.44,44.53,50,0
A	goto	Durotar,34.27,47.02,50,0
A	goto	Durotar,34.51,51.48,50,0
A	goto	Durotar,35.16,56.43,50,0
A	complete	816,1
A	mob	Dreadmaw Crocolisk
S	Shaman
T	completewith	next
A	goto	Durotar,36.74,57.78,10,0
A	goto	Durotar,36.63,58.15,8,0
A	goto	Durotar,36.63,58.15,8,0
A	goto	Durotar,36.77,58.98,8,0
A	goto	Durotar,36.85,58.32,8,0
A	goto	Durotar,37.24,58.13,8,0
A	goto	Durotar,37.86,58.18,8,0
A	goto	Durotar,38.05,57.79,8,0
A	goto	Durotar,38.93,57.54,8,0
A	goto	Durotar,39.19,57.90,8,0
A	goto	Durotar,39.16,58.56,10
S	Shaman
T	label	CallofFire3
A	goto	Durotar,38.52,58.93
A	turnin	1525
A	accept	1526
A	target	Telf Joolam
S	Shaman
T	completewith	next
A	goto	Durotar,38.18,58.58
A	cast	8898
A	use	6636
S	Shaman
A	goto	Durotar,38.96,58.22
A	complete	1526,1
A	mob	Minor Manifestation of Fire
S	Shaman
A	goto	Durotar,38.96,58.22
A	turnin	1526
A	accept	1527
S	Shaman
T	completewith	next
A	goto	Durotar,39.13,58.63,10,0
A	goto	Durotar,39.17,57.93,10,0
A	goto	Durotar,38.95,57.58,8,0
A	goto	Durotar,38.61,57.67,8,0
A	goto	Durotar,38.06,57.78,8,0
A	goto	Durotar,37.76,58.19,8,0
A	goto	Durotar,36.96,58.07,15
S	Shaman
A	goto	Durotar,34.92,54.87,50,0
A	goto	Durotar,34.58,51.64,50,0
A	goto	Durotar,34.33,48.97,50,0
A	goto	Durotar,34.31,44.24
A	complete	816,1
A	mob	Dreadmaw Crocolisk
S	
A	goto	Durotar,43.11,30.24
A	turnin	816
A	target	Misha Tor'kren
A	isQuestComplete	816
S	
T	label	FarWatchPost
A	goto	The Barrens,62.26,19.38,40
A	zoneskip	The Barrens
S	
T	label	Conscript
A	goto	The Barrens,62.27,19.38
A	turnin	840
A	accept	842
A	target	Kargal Battlescar
S	
T	label	Akzeloth
A	goto	The Barrens,62.34,20.07
A	turnin	809
A	accept	924
A	isOnQuest	809
A	target	Ak'Zeloth
A	group	
S	
A	goto	The Barrens,62.34,20.03
A	turnin	926
A	isOnQuest	924
A	group	
S	Shaman
A	goto	The Barrens,55.86,19.95
A	turnin	1527
A	target	Kranal Fiss
S	Shaman
A	goto	The Barrens,55.78,20.00
A	use	4926
A	collect	4926,1,819
A	accept	819
S	
T	completewith	DemonSeed
A	complete	844,1
A	mob	Greater Plainstrider
A	mob	Fleeting Plainstrider
S	
A	goto	The Barrens,51.09,22.68,40,0
A	goto	The Barrens,50.33,21.85,40,0
A	goto	The Barrens,49.21,20.42,40,0
A	goto	The Barrens,47.58,19.38,100
A	isOnQuest	924
S	
T	completewith	next
A	unitscan	Rathorian
S	
T	label	DemonSeed
A	goto	The Barrens,47.98,19.08
A	collect	4986,1,924
A	complete	924,1
A	isOnQuest	924
S	
T	completewith	DisruptTheAttacks
A	goto	The Barrens,47.58,19.38,40,0
A	goto	The Barrens,49.21,20.42,40,0
A	goto	The Barrens,50.33,21.85,40,0
A	goto	The Barrens,51.09,22.68,40
A	isOnQuest	924
S	
T	completewith	DisruptTheAttacks
A	complete	844,1
A	mob	Greater Plainstrider
A	mob	Fleeting Plainstrider
S	
T	completewith	next
A	complete	871,1
A	mob	+Razormane Water Seeker
A	complete	871,2
A	mob	+Razormane Thornweaver
A	complete	871,3
A	mob	+Razormane Hunter
S	
A	goto	The Barrens,55.70,27.30
A	use	4926
A	collect	4926,1,819
A	accept	819
S	
T	label	DisruptTheAttacks
T	loop	
A	goto	The Barrens,53.63,24.50,0
A	goto	The Barrens,53.63,24.50,50,0
A	goto	The Barrens,54.26,24.64,50,0
A	goto	The Barrens,54.81,25.19,50,0
A	goto	The Barrens,55.50,25.61,50,0
A	goto	The Barrens,55.86,26.30,50,0
A	goto	The Barrens,55.83,27.15,50,0
A	goto	The Barrens,55.41,27.41,50,0
A	goto	The Barrens,54.50,26.97,50,0
A	goto	The Barrens,54.05,26.11,50,0
A	goto	The Barrens,53.51,25.24,50,0
A	complete	871,1
A	mob	+Razormane Water Seeker
A	complete	871,2
A	mob	+Razormane Thornweaver
A	complete	871,3
A	mob	+Razormane Hunter
S	
T	loop	
A	goto	The Barrens,53.71,29.19,0
A	goto	The Barrens,53.36,26.28,80,0
A	goto	The Barrens,53.23,28.41,80,0
A	goto	The Barrens,53.57,29.58,80,0
A	goto	The Barrens,52.91,32.90,80,0
A	goto	The Barrens,51.31,32.91,80,0
A	goto	The Barrens,50.50,31.05,80,0
A	goto	The Barrens,50.05,29.77,80,0
A	goto	The Barrens,50.93,27.72,80,0
A	goto	The Barrens,52.83,27.91,80,0
A	goto	The Barrens,53.71,29.19,80,0
A	complete	844,1
A	mob	Greater Plainstrider
A	mob	Fleeting Plainstrider
S	Tauren
A	turnin	844
A	turnin	842
A	accept	845
A	target	+Sergra Darkthorn
A	goto	The Barrens,52.23,31.00
A	turnin	871
A	accept	872
A	target	+Thork
A	goto	The Barrens,51.50,30.87
S	
A	goto	The Barrens,51.99,29.89
A	home	
A	target	Innkeeper Boorand Plainswind
A	bindlocation	380
S	Druid
T	completewith	next
A	cast	18960
A	xp	<12,1
A	cooldown	item,6948,>0
A	zoneskip	Moonglade
A	solo	
S	Druid
A	goto	Moonglade,52.53,40.58
A	train	8936
A	target	Loganaar
A	xp	<12,1
A	cooldown	item,6948,>0
A	solo	
S	Druid
T	completewith	FlytoOrg
A	hs	
A	cooldown	item,6948,>0
A	xp	<12,1
A	use	6948
A	solo	
A	zoneskip	The Barrens
S	Hunter
A	goto	The Barrens,51.67,29.95
A	collect	2515,1200,398,1 << Hunter
A	target	Barg
A	itemcount	2515,<800 << Hunter
S	Shaman/Warrior
T	completewith	next
A	goto	The Barrens,51.50,30.34
A	fly	Thunder Bluff
A	zoneskip	Thunder Bluff
S	Shaman/Warrior
A	goto	Thunder Bluff,45.6,55.9
A	turnin	6362
A	accept	6363
A	target	Ahanu
S	Shaman/Warrior
A	goto	Thunder Bluff,60.0,51.7
A	turnin	775
A	target	Cairne Bloodhoof
S	Shaman/Warrior
A	goto	Thunder Bluff,47.00,49.82
A	turnin	6363
A	accept	6364
A	target	Tal
S	Shaman/Warrior
T	completewith	ReturntoJahan2
A	goto	Thunder Bluff,47.00,49.82
A	fly	Crossroads
A	target	Tal
A	cooldown	item,6948,<0
A	zoneskip	The Barrens
S	Shaman/Warrior
T	completewith	next
A	hs	
A	use	6948
A	cooldown	item,6948,>0
A	bindlocation	380,1
A	subzoneskip	380
S	Shaman/Warrior
T	label	ReturntoJahan2
A	goto	The Barrens,51.21,29.05
A	turnin	6364
A	target	Jahan Hawkwing
S	
T	label	FlytoOrg
T	completewith	SlumberSandPickup
A	goto	The Barrens,51.50,30.34
A	fly	Orgrimmar
A	target	Devrak
A	zoneskip	Orgrimmar
S	Shaman
A	goto	Orgrimmar,38.82,36.41
A	train	8045
A	target	Kardris Dreamseeker
A	xp	<14,1
S	
T	label	FindingAntidoteTurnin
A	goto	Orgrimmar,47.24,53.58
A	turnin	813
A	target	Kor'ghan
A	isQuestComplete	813
A	isQuestAvailable	812
S	Hunter
A	goto	Orgrimmar,81.17,18.69
A	collect	2507,1,398,1
A	money	<0.1751
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<5.7
S	Hunter
T	optional	
T	completewith	SlumberSandPickup
A	use	2507
A	itemcount	2507,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<5.7
S	Tauren Warrior
A	goto	Orgrimmar,47.54,68.39
A	collect	1197,1,398,1
A	money	<0.2666
A	target	Urtharo
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.0
S	Tauren Warrior
T	optional	
T	completewith	SlumberSandPickup
A	use	1197
A	itemcount	1197,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.0
S	Shaman/Druid
A	goto	Orgrimmar,47.54,68.39
A	collect	854,1,398,1
A	money	<0.3022
A	target	Urtharo
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.4
S	Shaman/Druid
T	optional	
T	completewith	SlumberSandPickup
A	use	854
A	itemcount	854,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.4
S	
T	completewith	SlumberSandPickup
T	label	LeaveOrg3
A	zone	Durotar
A	zoneskip	Durotar
S	Shaman/Hunter
A	goto	Durotar,41.6,18.7
A	accept	812
A	turnin	812
A	target	Rhinag
S	
A	goto	Durotar,50.8,13.8,40
A	zone	Tirisfal Glades
A	zoneskip	Tirisfal Glades
S	Warrior
T	optional	
A	abandon	1505
A	isOnQuest	1505
S	Warrior
T	optional	
A	abandon	1498
A	isOnQuest	1498
S	Warrior
A	goto	Tirisfal Glades,61.85,52.55
A	accept	1818
A	target	Austil de Mon
S	
T	label	SlumberSandPickup
A	goto	Tirisfal Glades,59.45,52.40
A	accept	367
A	accept	445
A	target	Apothecary Johaan
S	Warrior
A	goto	Tirisfal Glades,58.19,51.44
A	turnin	1818
A	accept	1819
A	target	Deathguard Dillinger
S	Warrior
A	goto	Tirisfal Glades,59.16,48.51
A	complete	1819,1
A	mob	Ulag the Cleaver
S	Warrior
A	goto	Tirisfal Glades,58.19,51.44
A	turnin	1819
A	accept	1820
A	target	Deathguard Dillinger
S	
T	loop	
A	goto	Tirisfal Glades,43.58,61.39,0
A	goto	Tirisfal Glades,56.77,59.83,60,0
A	goto	Tirisfal Glades,57.41,61.92,60,0
A	goto	Tirisfal Glades,55.03,63.17,60,0
A	goto	Tirisfal Glades,54.24,65.34,60,0
A	goto	Tirisfal Glades,50.74,62.38,60,0
A	goto	Tirisfal Glades,49.92,61.17,60,0
A	goto	Tirisfal Glades,47.92,60.42,60,0
A	goto	Tirisfal Glades,46.61,59.75,60,0
A	goto	Tirisfal Glades,44.02,60.11,60,0
A	goto	Tirisfal Glades,43.58,61.39,60,0
A	complete	367,1
A	mob	Decrepit Darkhound
A	mob	Cursed Darkhound`
S	
A	goto	Tirisfal Glades,60.59,51.77
A	accept	398
S	
A	turnin	367
A	accept	368
A	goto	Tirisfal Glades,59.45,52.40
A	target	Apothecary Johaan
A	isQuestComplete	367
S	
A	accept	368
A	goto	Tirisfal Glades,59.45,52.40
A	target	Apothecary Johaan
A	isQuestTurnedIn	367
S	
T	completewith	next
A	goto	Tirisfal Glades,58.66,30.77
A	complete	398,1
A	mob	Maggot Eye
A	isOnQuest	368
S	
T	loop	
A	goto	Tirisfal Glades,59.54,27.86,0
A	goto	Tirisfal Glades,59.38,29.05,50,0
A	goto	Tirisfal Glades,59.54,27.86,50,0
A	goto	Tirisfal Glades,60.64,28.66,50,0
A	goto	Tirisfal Glades,61.49,29.40,50,0
A	goto	Tirisfal Glades,62.96,29.46,50,0
A	goto	Tirisfal Glades,65.68,30.22,50,0
A	goto	Tirisfal Glades,67.48,28.97,50,0
A	goto	Tirisfal Glades,68.22,26.46,50,0
A	complete	368,1
A	mob	Vile Fin Puddlejumper
A	mob	Vile Fin Minor Oracle
A	mob	Vile Fin Muckdweller
A	isOnQuest	368
S	
A	goto	Tirisfal Glades,58.66,30.77
A	complete	398,1
A	mob	Maggot Eye
A	isOnQuest	368
S	
T	completewith	MaggetEyeTurnIn
A	goto	Tirisfal Glades,59.88,51.58,150
A	subzoneskip	159
S	
A	goto	Tirisfal Glades,59.45,52.40
A	turnin	368
A	target	Apothecary Johaan
A	isQuestComplete	368
S	
T	label	MaggetEyeTurnIn
A	goto	Tirisfal Glades,60.58,51.77
A	turnin	398
A	target	Executor Zygand
S	
T	completewith	UCflightpath2
A	isQuestComplete	368
S	Warrior
A	goto	Tirisfal Glades,61.72,52.29
A	turnin	1820
A	target	Coleman Farthing
S	Warrior
A	goto	Tirisfal Glades,61.85,52.53
A	train	1160
A	target	Austil de Mon
A	xp	<14,1
S	
T	completewith	UCflightpath2
A	goto	Tirisfal Glades,61.80,65.06,20
A	zoneskip	Undercity
A	zoneskip	Undercity
S	
T	completewith	UCflightpath2
A	goto	Undercity,66.09,20.06,20,0
A	goto	Undercity,64.37,23.94,20,0
A	goto	Undercity,65.93,26.71,10,0
A	goto	Undercity,65.89,34.03,10,0
A	goto	Undercity,64.22,39.77,10,0
A	goto	Undercity,65.53,43.62,15
S	
T	label	UCflightpath2
A	goto	Undercity,63.25,48.56
A	fp	Undercity
A	target	Michael Garrett
S	
T	optional	
T	ah	
A	goto	Undercity,64.20,49.60
A	collect	3164,6,429,1
A	target	Auctioneer Rhyker
A	zoneskip	Undercity,1
S	
T	optional	
A	abandon	806
A	isOnQuest	806
S	
T	optional	
A	abandon	408
A	isOnQuest	408
S	Warrior
T	optional	
A	abandon	1821
A	isOnQuest	1821
S	
T	label	LeaveUndercity3
T	completewith	EscortErland
A	goto	Undercity,47.25,39.12,50,0
A	goto	Undercity,46.35,43.86,10,0
A	goto	Undercity,45.24,39.35,10,0
A	goto	Undercity,41.32,38.40,10,0
A	goto	Undercity,40.74,33.95,10,0
A	goto	Undercity,34.80,33.19,15,0
A	goto	Undercity,27.39,30.23,35,0
A	goto	Undercity,21.89,43.35,35,0
A	goto	Tirisfal Glades,51.10,71.53,50
A	zoneskip	Tirisfal Glades
A	zoneskip	Tirisfal Glades
S	
T	label	Entersilverpine
A	zone	Silverpine Forest
A	zoneskip	Silverpine Forest
E
G	Guides/SurvivalGuide/H-Classic-Horde-13-15_Silverpine.lua
M	hardcore	
M	classic	
M	tbc	
M	selector	Horde
M	name	13-15 Silverpine Forest
M	version	1
M	group	RestedXP Survival Guide (H)
M	subgroup	RXP Survival Guide 1-20
M	next	15-19 The Barrens
S	Undead Rogue
T	sticky	
T	completewith	RotHideCluesTurnIn
A	complete	1886,1
A	unitscan	Astor Hadren
S	
T	label	WorgHearts
T	completewith	next
A	collect	3164,6,429,1
A	mob	Worg
A	mob	Mottled Worg
A	unitscan	Gorefang
S	
A	goto	Silverpine Forest,56.18,9.18
A	accept	435
A	target	Deathstalker Erland
S	
T	completewith	next
A	collect	3164,6,429,1
A	mob	Worg
A	mob	Mottled Worg
A	unitscan	Gorefang
S	
A	goto	Silverpine Forest,56.25,10.27,30,0
A	goto	Silverpine Forest,56.25,11.43,30,0
A	goto	Silverpine Forest,56.17,12.62,30,0
A	goto	Silverpine Forest,53.46,13.45
A	complete	435,1
A	mob	Worg
S	
A	goto	Silverpine Forest,53.46,13.45
A	turnin	435
A	accept	429
A	accept	449
A	target	Rane Yorick
S	
T	loop	
A	goto	Silverpine Forest,57.72,10.07,0
A	goto	Silverpine Forest,55.96,16.18,50,0
A	goto	Silverpine Forest,58.37,15.56,50,0
A	goto	Silverpine Forest,59.40,13.58,50,0
A	goto	Silverpine Forest,60.11,10.51,50,0
A	goto	Silverpine Forest,57.72,10.07,50,0
A	collect	3164,6,429,1
A	mob	Worg
A	mob	Mottled Worg
A	unitscan	Gorefang
S	
T	completewith	next
A	goto	Silverpine Forest,49.77,28.66,50,0
A	goto	Silverpine Forest,49.77,33.05,50,0
A	goto	Silverpine Forest,49.64,37.84,100,0
A	goto	Silverpine Forest,45.51,41.26,100
A	subzoneskip	228
S	
A	goto	Silverpine Forest,44.20,39.73
A	accept	421
A	target	Dalar Dawnweaver
S	!Mage !Priest
A	goto	Silverpine Forest,44.05,39.78
A	vendor	
A	collect	4605,20,421,1
A	target	Gwyn Farrow
A	money	<0.05
S	
A	goto	Silverpine Forest,43.98,39.89
A	vendor	
A	collect	1179,20,421,1 << Mage/Warlock/Priest/Shaman/Druid
A	target	Edwin Harly
A	money	<0.05 << Mage/Warlock/Priest/Shaman/Druid
S	Undead
A	accept	477
A	target	+Shadow Priest Allister
A	goto	Silverpine Forest,43.98,40.93
A	accept	6321
A	target	+Deathguard Podrig
A	goto	Silverpine Forest,43.43,41.67
S	
T	label	BorderCrossings
A	goto	Silverpine Forest,43.98,40.93
A	accept	477
A	target	Shadow Priest Allister
S	
T	completewith	next
A	goto	Silverpine Forest,43.09,41.33,8,0
A	goto	Silverpine Forest,42.75,41.30,8,0
A	goto	Silverpine Forest,42.76,40.90,8,0
A	goto	Silverpine Forest,43.43,40.87,2
S	
A	goto	Silverpine Forest,43.43,40.87
A	turnin	449
A	accept	3221
A	accept	437
A	target	High Executor Hadrec
S	
A	goto	Silverpine Forest,42.79,40.87
A	turnin	429
A	turnin	445
A	turnin	3221
A	accept	1359
A	accept	447
A	accept	430
A	target	Apothecary Renferrel
A	addquestitem	3164,429
S	
T	loop	
A	goto	Silverpine Forest,49.12,36.72,0
A	goto	Silverpine Forest,50.32,39.22,50,0
A	goto	Silverpine Forest,51.86,41.56,50,0
A	goto	Silverpine Forest,51.53,43.06,50,0
A	goto	Silverpine Forest,51.62,44.85,50,0
A	goto	Silverpine Forest,51.80,46.60,50,0
A	goto	Silverpine Forest,50.83,47.74,50,0
A	goto	Silverpine Forest,49.12,36.72,50,0
A	complete	421,1
A	mob	Moonrage Whitescalp
A	unitscan	Son of Arugal
S	
A	goto	Silverpine Forest,44.20,39.73
A	target	Dalar Dawnweaver
A	turnin	421
A	accept	422
S	
T	completewith	Remedy
A	goto	Silverpine Forest,52.74,27.70,80
S	
T	label	Remedy
A	goto	Silverpine Forest,52.74,27.70,8,0
A	goto	Silverpine Forest,53.13,27.92,8,0
A	goto	Silverpine Forest,52.94,27.88,8,0
A	goto	Silverpine Forest,52.83,28.56
A	complete	422,1
S	
T	completewith	next
A	goto	Silverpine Forest,53.39,13.32,80
S	
T	label	QuinnYorick
A	goto	Silverpine Forest,53.39,13.32,8,0
A	goto	Silverpine Forest,53.08,13.11,8,0
A	goto	Silverpine Forest,53.27,13.16,8,0
A	goto	Silverpine Forest,53.43,12.59
A	turnin	430
A	target	Quinn Yorick
S	
A	goto	Silverpine Forest,53.46,13.45
A	accept	425
A	target	Rane Yorick
S	
A	goto	Silverpine Forest,52.01,14.02,6,0
A	goto	Silverpine Forest,51.89,13.82,6,0
A	goto	Silverpine Forest,51.54,13.91
A	complete	425,1
A	target	Ivar the Foul
A	mob	Ravenclaw Slave
S	
A	goto	Silverpine Forest,53.46,13.45
A	turnin	425
A	target	Rane Yorick
S	
T	completewith	ArugalTurnin
A	unitscan	Son of Arugal
S	
T	completewith	Nightlash
A	complete	447,1
A	mob	Ferocious Grizzled Bear
A	mob	Giant Grizzled Bear
A	unitscan	Old VIcejaw
S	
T	label	Nightlash
A	goto	Silverpine Forest,45.44,21.01
A	complete	437,1
A	complete	437,2
A	unitscan	Nightlash
A	mob	Rot Hide Gladerunner
A	mob	Rot Hide Mystic
S	
T	completewith	KillianVendor
A	complete	447,1
A	mob	Ferocious Grizzled Bear
A	mob	Giant Grizzled Bear
A	unitscan	Old VIcejaw
A	unitscan	Son of Arugal
S	
T	completewith	next
A	complete	447,2
A	mob	Moss Stalker
A	unitscan	Krethis Shadowspinner
A	unitscan	Son of Arugal
S	
T	label	KillianVendor
A	goto	Silverpine Forest,33.00,17.84
A	vendor	
A	target	Killian Sanatha
A	isOnQuest	447
S	
T	loop	
A	goto	Silverpine Forest,36.33,14.20,0
A	goto	Silverpine Forest,37.25,15.99,50,0
A	goto	Silverpine Forest,35.67,16.01,50,0
A	goto	Silverpine Forest,34.96,16.34,50,0
A	goto	Silverpine Forest,33.99,17.24,50,0
A	goto	Silverpine Forest,34.14,15.26,50,0
A	goto	Silverpine Forest,35.06,14.50,50,0
A	goto	Silverpine Forest,35.85,13.83,50,0
A	goto	Silverpine Forest,36.33,14.20,50,0
A	complete	447,2
A	mob	Moss Stalker
A	unitscan	Krethis Shadowspinner
A	unitscan	Son of Arugal
S	
T	loop	
A	goto	Silverpine Forest,41.60,21.65,0
A	goto	Silverpine Forest,41.37,19.64,50,0
A	goto	Silverpine Forest,41.60,21.65,50,0
A	goto	Silverpine Forest,42.36,23.77,50,0
A	goto	Silverpine Forest,44.67,24.84,50,0
A	goto	Silverpine Forest,46.08,26.62,50,0
A	complete	447,1
A	mob	Ferocious Grizzled Bear
A	mob	Giant Grizzled Bear
A	unitscan	Old VIcejaw
A	unitscan	Son of Arugal
S	
T	completewith	next
A	goto	Silverpine Forest,45.51,41.26,100
A	subzoneskip	228
S	
T	label	ArugalTurnin
A	goto	Silverpine Forest,44.20,39.73
A	turnin	422
A	accept	423
A	target	Dalar Dawnweaver
S	
T	completewith	next
A	goto	Silverpine Forest,43.09,41.33,8,0
A	goto	Silverpine Forest,42.75,41.30,8,0
A	goto	Silverpine Forest,42.76,40.90,8,0
A	goto	Silverpine Forest,43.43,40.87,2
S	
A	goto	Silverpine Forest,43.43,40.87
A	turnin	437
A	accept	438
A	target	High Executor Hadrec
S	!Mage !Priest
A	goto	Silverpine Forest,44.05,39.78
A	vendor	
A	collect	4605,20,423,1
A	target	Gwyn Farrow
S	
A	goto	Silverpine Forest,43.98,39.89
A	vendor	
A	collect	1179,20,421,1 << Warlock/Priest/Shaman/Druid
A	target	Edwin Harly
S	Warlock/Mage/Priest
A	goto	Silverpine Forest,44.80,39.24
A	vendor	
A	target	Andrea Boynton
A	money	<0.1400
S	Hunter
A	goto	Silverpine Forest,45.01,39.30
A	collect	11304,1,438,1
A	collect	2515,1200,438,1 << Hunter
A	target	Nadia Vernon
A	money	<0.2633
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<10.5
A	equip	18,2515
S	Hunter/Rogue
A	goto	Silverpine Forest,44.61,39.11
A	vendor	
A	target	Alexandre Lefevre
A	money	<0.2633
S	Shaman/Warrior/Druid
A	goto	Silverpine Forest,44.61,39.11
A	vendor	
A	target	Alexandre Lefevre
A	money	<0.2000
S	Warlock/Mage/Priest
T	optional	
T	completewith	Shackles
A	use	4786
A	itemcount	4786,1
A	xp	<15,1
A	equip	6,4786
S	Hunter
T	optional	
T	completewith	Shackles
A	use	11304
A	itemcount	11304,1
A	xp	<14,1
A	equip	18,11304
S	Hunter/Rogue
T	optional	
T	completewith	Shackles
A	use	4788
A	itemcount	4788,1
A	xp	<15,1
A	equip	8,4788
S	Shaman/Warrior/Druid
T	optional	
T	completewith	Shackles
A	use	4788
A	itemcount	4788,1
A	xp	<15,1
A	equip	8,4788
S	Shaman/Warrior/Druid
T	optional	
T	completewith	Shackles
A	use	4789
A	itemcount	4789,1
A	equip	8,4789
S	
T	completewith	Shackles
A	goto	Silverpine Forest,44.20,38.17,15,0
A	goto	Silverpine Forest,44.46,36.65,15,0
A	goto	Silverpine Forest,44.91,33.14,30
S	
T	completewith	DecrepitFerry
A	unitscan	Son of Arugal
S	
T	label	Shackles
T	loop	
A	goto	Silverpine Forest,43.83,31.00,0
A	goto	Silverpine Forest,44.22,31.55,50,0
A	goto	Silverpine Forest,43.51,32.38,50,0
A	goto	Silverpine Forest,42.61,31.12,50,0
A	goto	Silverpine Forest,41.28,30.25,50,0
A	goto	Silverpine Forest,39.70,30.24,50,0
A	goto	Silverpine Forest,38.96,29.15,50,0
A	goto	Silverpine Forest,38.28,27.10,50,0
A	goto	Silverpine Forest,37.60,24.16,50,0
A	goto	Silverpine Forest,38.07,23.13,50,0
A	goto	Silverpine Forest,38.56,21.93,50,0
A	goto	Silverpine Forest,39.73,23.26,50,0
A	goto	Silverpine Forest,41.49,23.51,50,0
A	goto	Silverpine Forest,41.14,25.50,50,0
A	goto	Silverpine Forest,41.17,28.26,50,0
A	goto	Silverpine Forest,42.01,29.27,50,0
A	goto	Silverpine Forest,43.83,31.00,50,0
A	complete	423,1
A	mob	+Moonrage Glutton
A	complete	423,2
A	mob	+Moonrage Darksoul
A	unitscan	Son of Arugal
S	
T	label	DecrepitFerry
A	goto	Silverpine Forest,58.39,34.79
A	turnin	438
A	accept	439
S	
A	goto	Silverpine Forest,49.89,60.33
A	turnin	477
A	accept	478
A	mob	Dalaran Apprentice
S	
T	completewith	next
A	goto	Silverpine Forest,45.51,41.26,100
A	subzoneskip	228
S	
A	turnin	478
A	accept	481
A	target	+Shadow Priest Allister
A	goto	Silverpine Forest,43.98,40.93
A	turnin	423
A	turnin	481
A	accept	482
A	accept	424
A	target	+Dalar Dawnweaver
A	goto	Silverpine Forest,44.20,39.73
A	group	
S	
A	turnin	478
A	accept	481
A	target	+Shadow Priest Allister
A	goto	Silverpine Forest,43.98,40.93
A	turnin	423
A	turnin	481
A	accept	482
A	target	+Dalar Dawnweaver
A	goto	Silverpine Forest,44.20,39.73
S	
A	goto	Silverpine Forest,43.98,40.93
A	turnin	482
A	target	Shadow Priest Allister
S	
A	goto	Silverpine Forest,43.98,40.93
A	accept	479
A	target	Shadow Priest Allister
A	group	
S	
A	goto	Silverpine Forest,43.98,40.93
A	turnin	482
A	target	Shadow Priest Allister
S	
T	completewith	next
A	goto	Silverpine Forest,43.09,41.33,8,0
A	goto	Silverpine Forest,42.75,41.30,8,0
A	goto	Silverpine Forest,42.76,40.90,8,0
A	goto	Silverpine Forest,43.43,40.87,2
S	
T	label	RotHideCluesTurnIn
A	goto	Silverpine Forest,43.43,40.87
A	turnin	439
A	accept	440
A	target	High Executor Hadrec
S	Undead
A	goto	Silverpine Forest,45.62,42.58
A	turnin	6321
A	accept	6323
A	target	Karos Razok
S	
T	completewith	ZingeAndFaranell
A	goto	Silverpine Forest,45.62,42.58
A	fp	Sepulcher
A	fly	Undercity
A	target	Karos Razok
A	zoneskip	Undercity
S	Undead
A	goto	Undercity,61.48,41.81
A	turnin	6323
A	accept	6322
A	target	Gordon Wendham
S	Troll Warrior/Undead Warrior
A	goto	Undercity,61.15,40.89
A	collect	2030,1,479,1
A	money	<0.5544
A	target	Louis Warren
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.9
S	Troll Warrior/Undead Warrior
T	completewith	PyrewoodAmbush
A	use	2030
A	itemcount	2030,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.9
S	Orc Warrior
A	goto	Undercity,61.15,40.89
A	collect	2025,1,479,1
A	money	<0.5304
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.8
S	Orc Warrior
T	completewith	PyrewoodAmbush
A	use	2025
A	itemcount	2025,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.8
S	Tauren Warrior
A	goto	Undercity,61.15,40.89
A	collect	2026,1,479,1
A	money	<0.6286
A	target	Louis Warren
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.5
S	Tauren Warrior
T	optional	
T	completewith	PyrewoodAmbush
A	use	2026
A	itemcount	2026,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.5
S	Shaman
A	goto	Undercity,61.15,40.89
A	collect	2030,1,479,1
A	money	<0.5544
A	target	Louis Warren
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.9
S	Shaman
T	optional	
T	completewith	PyrewoodAmbush
A	use	2030
A	itemcount	2030,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.9
S	Rogue
A	goto	Undercity,61.15,40.89
A	collect	2027,1,479,1
A	money	<0.3815
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.6
A	target	Louis Warren
S	Rogue
T	optional	
T	completewith	PyrewoodAmbush
A	use	2027
A	itemcount	2027,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.6
S	
T	completewith	ZingeAndFaranell
A	goto	Undercity,47.20,59.69,0
A	goto	Undercity,47.20,59.69,12,0
A	goto	Undercity,43.55,68.11,12,0
A	goto	Undercity,45.20,71.67,12
S	
A	turnin	447
A	target	+Master Apothecary Faranell
A	goto	Undercity,48.84,69.25
A	turnin	1359
A	accept	1358
A	target	+Apothecary Zinge
A	goto	Undercity,50.16,67.97
A	solo	
S	
A	turnin	447
A	accept	450
A	target	+Master Apothecary Faranell
A	goto	Undercity,48.84,69.25
A	turnin	1359
A	accept	1358
A	target	+Apothecary Zinge
A	goto	Undercity,50.16,67.97
A	group	
S	
T	optional	
T	label	ZingeAndFaranell
S	Mage
A	goto	Undercity,85.14,10.02
A	train	2137
A	target	Anastasia Hartwell
A	xp	<14,1
A	xp	>16,1
S	Mage
T	optional	
A	goto	Undercity,85.14,10.02
A	train	2120
A	target	Anastasia Hartwell
A	xp	<16,1
S	Rogue
A	goto	Undercity,83.86,72.06
A	train	1758
A	target	Carolyn Ward
A	xp	<14,1
A	xp	>16,1
S	Rogue
T	optional	
A	goto	Undercity,83.86,72.06
A	train	6761
A	target	Carolyn Ward
A	xp	<16,1
S	Warlock
A	goto	Undercity,88.93,15.86
A	train	6222
A	target	Richard Kerwin
A	xp	<14,1
A	xp	>16,1
A	group	
S	Warlock
T	optional	
A	goto	Undercity,88.93,15.86
A	train	1455
A	target	Richard Kerwin
A	xp	<16,1
A	group	
S	Priest/Mage/Warlock
A	goto	Undercity,69.54,26.93
A	collect	5208,1
A	money	<0.3515
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<13.4
A	target	Zane Bradford
S	Undead Rogue
A	goto	Undercity,83.52,69.10
A	turnin	1886
A	target	Mennet Carkad
A	isQuestComplete	1886
S	Undead Rogue
A	goto	Undercity,83.52,69.10
A	accept	1898
A	target	Mennet Carkad
A	isQuestTurnedIn	1886
S	Undead Rogue
A	goto	Undercity,54.84,76.31
A	turnin	1898
A	accept	1899
A	target	Andron Gant
A	isQuestTurnedIn	1886
S	Undead Rogue
A	goto	Undercity,55.43,76.87
A	complete	1899,1
A	isQuestTurnedIn	1886
S	Undead Rogue
A	goto	Undercity,83.53,69.12
A	turnin	1899
A	accept	1978
A	target	Mennet Carkad
A	isQuestTurnedIn	1886
S	Undead Rogue
A	goto	Tirisfal Glades,58.86,78.76,40,0
A	goto	Tirisfal Glades,59.75,84.64
A	turnin	1978
A	target	Varimathras
A	isQuestTurnedIn	1886
S	
A	goto	Undercity,73.19,55.17
A	train	3276
A	target	Mary Edras
A	skill	firstaid,<40,1
S	
A	goto	Undercity,73.19,55.17
A	train	3274
A	target	Mary Edras
A	skill	firstaid,<50,1
S	Warrior
A	goto	Undercity,48.32,15.98
A	train	1160
A	target	Angela Curthas
A	xp	<14,1
A	xp	>16,1
S	Warrior
T	optional	
A	goto	Undercity,48.32,15.98
A	train	285
A	target	Angela Curthas
A	xp	<16,1
S	Priest
A	goto	Undercity,47.56,18.89
A	train	6074
A	target	Father Lazarus
A	xp	<14,1
A	xp	>16,1
A	group	
S	Priest
T	optional	
A	goto	Undercity,47.56,18.89
A	train	8102
A	target	Father Lazarus
A	xp	<16,1
A	group	
S	Undead Rogue
T	optional	
T	completewith	GrimsonthePale
A	abandon	1886
A	isOnQuest	1886
S	
A	goto	Undercity,56.2,96.2
A	accept	5725
A	target	Varimathras
A	dungeon	RFC
S	Undead
A	goto	Undercity,63.27,48.55
A	turnin	6322
A	accept	6324
A	target	Michael Garrett
S	
T	completewith	GrimsonthePale
A	goto	Undercity,63.27,48.55
A	fly	The Supulcher
A	target	Michael Garrett
A	zoneskip	Silverpine Forest
A	group	
S	Undead
T	completewith	next
A	goto	Undercity,63.27,48.55
A	fly	The Supulcher
A	target	Michael Garrett
A	zoneskip	Silverpine Forest
A	solo	
S	Undead
A	goto	Silverpine Forest,43.43,41.67
A	turnin	6324
S	
A	goto	Silverpine Forest,43.98,39.89
A	vendor	
A	target	Edwin Harly
A	group	
S	
T	completewith	next
A	goto	Silverpine Forest,56.48,45.94,10
A	group	
S	
T	label	GrimsonthePale
A	goto	Silverpine Forest,58.56,44.85
A	complete	424,1
A	target	Grimson the Pale
A	group	2
S	skip
A	goto	Silverpine Forest,58.12,45.50
A	goto	Silverpine Forest,44.29,41.09,30
A	link	https://www.youtube.com/watch?v=uD2CUb3rdQ0&ab
A	group	
S	
A	turnin	424
A	accept	99
A	goto	Silverpine Forest,44.20,39.73
A	target	Dalar Dawnweaver
A	group	
S	
T	completewith	next
A	goto	Silverpine Forest,57.90,63.10,120,0
A	subzone	233
A	group	
S	
T	loop	
A	goto	Silverpine Forest,57.12,63.39,0
A	goto	Silverpine Forest,57.91,62.48,50,0
A	goto	Silverpine Forest,59.10,61.88,50,0
A	goto	Silverpine Forest,59.79,63.08,50,0
A	goto	Silverpine Forest,60.79,62.55,50,0
A	goto	Silverpine Forest,61.98,62.56,50,0
A	goto	Silverpine Forest,61.00,64.89,50,0
A	goto	Silverpine Forest,60.10,65.93,50,0
A	goto	Silverpine Forest,59.02,67.10,50,0
A	goto	Silverpine Forest,57.56,67.57,50,0
A	goto	Silverpine Forest,57.62,65.17,50,0
A	goto	Silverpine Forest,57.12,63.39,50,0
A	complete	479,1
A	mob	Dalaran Mage
A	mob	Dalaran Protector
A	group	2
S	
T	completewith	BerardsJournal
A	goto	Silverpine Forest,48.20,71.94,50
A	isOnQuest	99
A	group	
S	
T	completewith	PyrewoodAmbush
A	complete	99,1
A	mob	Pyrewood Watcher
A	mob	Pyrewood Tailor
A	mob	Pyrewood Sentry
A	mob	Pyrewood Leatherworker
A	mob	Pyrewood Elder
A	mob	Pyrewood Armorer
A	isOnQuest	99
A	group	4
S	
T	completewith	BerardsJournal
A	goto	Silverpine Forest,43.97,73.23,10
A	isOnQuest	450
A	group	
S	
T	label	BerardsJournal
A	goto	Silverpine Forest,42.98,73.22
A	complete	450,1
A	mob	Apothecary Berard
A	isOnQuest	450
A	group	4
S	
T	completewith	next
A	goto	Silverpine Forest,45.89,74.17,10
A	isOnQuest	99
A	group	
S	
A	goto	Silverpine Forest,46.50,74.38
A	accept	452
A	mob	Deathstalker Faerleia
A	isOnQuest	99
A	group	4
S	
T	label	PyrewoodAmbush
A	goto	Silverpine Forest,46.48,74.10
A	complete	452,1
A	mob	Councilman Smithers
A	mob	Councilman Hendricks
A	mob	Councilman Thatcher
A	mob	Councilman Wilhelm
A	mob	Councilman Hartin
A	mob	Councilman Higarth
A	mob	Councilman Brunswick
A	mob	Councilman Cooper
A	mob	Lord Mayor Morrison
A	isOnQuest	452
A	group	4
S	
A	goto	Silverpine Forest,46.50,74.38
A	turnin	452
A	mob	Deathstalker Faerleia
A	isQuestComplete	452
A	group	
S	
T	loop	
A	goto	Silverpine Forest,45.48,73.43,0
A	goto	Silverpine Forest,45.66,74.90,40,0
A	goto	Silverpine Forest,44.11,73.50,40,0
A	goto	Silverpine Forest,45.41,72.42,40,0
A	goto	Silverpine Forest,46.61,73.00,40,0
A	goto	Silverpine Forest,45.48,73.43,40,0
A	complete	99,1
A	mob	Pyrewood Watcher
A	mob	Pyrewood Tailor
A	mob	Pyrewood Sentry
A	mob	Pyrewood Leatherworker
A	mob	Pyrewood Elder
A	mob	Pyrewood Armorer
A	isOnQuest	99
A	group	4
S	
T	completewith	AmbermillTurnin
A	goto	Silverpine Forest,45.51,41.26,100
A	subzoneskip	228
A	group	
S	
A	turnin	99
A	goto	Silverpine Forest,44.20,39.73
A	target	Dalar Dawnweaver
A	isQuestComplete	99
A	group	
S	
A	goto	Silverpine Forest,42.79,40.87
A	turnin	450
A	target	Apothecary Renferrel
A	isQuestComplete	450
A	group	
S	
T	label	AmbermillTurnin
A	goto	Silverpine Forest,43.98,40.93
A	turnin	479
A	target	Shadow Priest Allister
A	isQuestComplete	479
A	group	
S	Hunter
A	goto	Silverpine Forest,45.01,39.30
A	collect	11304,1,438,1
A	collect	2515,1200,438,1 << Hunter
A	target	Nadia Vernon
A	money	<0.2633
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<10.5
A	equip	18,2515
A	group	
S	Druid
T	completewith	next
A	cast	18960
S	Druid
A	goto	Moonglade,52.53,40.58
A	trainer	
A	target	Loganaar
S	
T	optional	
A	abandon	424
A	isOnQuest	424
S	
T	optional	
A	abandon	479
A	isOnQuest	479
S	
T	optional	
A	abandon	99
A	isOnQuest	99
S	
T	optional	
A	abandon	450
A	isOnQuest	450
S	
T	optional	
A	abandon	452
A	isOnQuest	452
S	Tauren/Shaman/Hunter
A	hs	
A	use	6948
A	bindlocation	380,1
A	subzoneskip	380
S	!Tauren !Shaman !Hunter
A	hs	
A	use	6948
A	bindlocation	362,1
A	subzoneskip	362
E
G	Guides/SurvivalGuide/H-Classic-Horde-15-23_Barrens.lua
M	hardcore	
M	classic	
M	tbc	
M	selector	Horde
M	name	15-19 The Barrens
M	version	1
M	group	RestedXP Survival Guide (H)
M	subgroup	RXP Survival Guide 1-20
M	next	19-23 Stonetalon/Barrens/Ashenvale
S	!Tauren !Hunter !Shaman
A	turnin	837
A	goto	Durotar,51.95,43.50
A	target	Gar'Thok
A	isQuestComplete	837
S	Priest
A	goto	Durotar,54.26,42.93
A	train	6074
A	target	Tai'jin
A	xp	<14,1
A	xp	>16,1
S	Priest
T	optional	
A	goto	Durotar,54.26,42.93
A	train	8102
A	target	Tai'jin
A	xp	<16,1
S	Orc Warrior/Troll Warrior
A	goto	Durotar,54.18,42.46
A	train	1160
A	target	Tarshaw Jaggedscar
A	xp	<14,1
A	xp	>16,1
S	Orc Warrior/Troll Warrior
T	optional	
A	goto	Durotar,54.18,42.46
A	train	285
A	target	Tarshaw Jaggedscar
A	xp	<16,1
S	Rogue
A	goto	Durotar,51.98,43.69
A	train	1758
A	target	Kaplak
A	xp	<14,1
A	xp	>16,1
S	Rogue
T	optional	
A	goto	Durotar,51.98,43.69
A	train	6761
A	target	Kaplak
A	xp	<16,1
S	Warlock
A	goto	Durotar,54.37,41.20
A	train	6222
A	target	Dhugru Gorelust
A	xp	<14,1
A	xp	>16,1
S	Warlock
A	goto	Durotar,54.70,41.49
A	collect	16351,1,842,1
A	target	Kitha
A	xp	<16,1
S	Warlock
T	optional	
A	goto	Durotar,54.37,41.20
A	train	1455
A	target	Dhugru Gorelust
A	xp	<16,1
S	!Tauren !Hunter !Shaman
A	goto	Durotar,50.8,43.6
A	accept	840
A	target	Takrin Pathseeker
A	isQuestAvailable	840
S	
T	optional	
A	abandon	480
A	isOnQuest	480
S	
T	completewith	next
A	zone	The Barrens
A	zoneskip	The Barrens
S	!Tauren !Hunter !Shaman
A	goto	The Barrens,62.27,19.38
A	turnin	840
A	accept	842
A	target	Kargal Battlescar
A	isOnQuest	840
S	!Tauren !Hunter !Shaman
T	label	Akzeloth
A	goto	The Barrens,62.34,20.07
A	turnin	809
A	accept	924
A	isOnQuest	809
A	target	Ak'Zeloth
A	group	
S	!Tauren !Hunter !Shaman
A	goto	The Barrens,62.34,20.03
A	turnin	926
A	isOnQuest	924
A	group	
S	!Tauren !Hunter !Shaman
T	completewith	next
A	goto	The Barrens,52.34,29.27,150
A	subzoneskip	380
S	!Undead !Tauren
A	accept	6365
A	target	+Zargh
A	goto	The Barrens,52.62,29.84
A	accept	869
A	target	+Gazrog
A	goto	The Barrens,51.93,30.32
A	turnin	842
A	accept	844
A	target	+Sergra Darkthorn
A	goto	The Barrens,52.23,31.00
A	accept	870
A	target	+Tonga Runetotem
A	goto	The Barrens,52.26,31.94
A	accept	899
A	accept	4921
A	target	+Mankrik
A	goto	The Barrens,52.00,31.60
A	accept	871
A	accept	5041
A	target	+Thork
A	goto	The Barrens,51.50,30.87
A	maxlevel	16
S	!Undead !Tauren
T	optional	
A	accept	6365
A	target	+Zargh
A	goto	The Barrens,52.62,29.84
A	accept	869
A	target	+Gazrog
A	goto	The Barrens,51.93,30.32
A	turnin	842
A	accept	844
A	target	+Sergra Darkthorn
A	goto	The Barrens,52.23,31.00
A	accept	870
A	target	+Tonga Runetotem
A	goto	The Barrens,52.26,31.94
A	accept	899
A	accept	4921
A	target	+Mankrik
A	goto	The Barrens,52.00,31.60
S	
A	accept	869
A	target	+Gazrog
A	goto	The Barrens,51.93,30.32
A	turnin	842
A	accept	844
A	target	+Sergra Darkthorn
A	goto	The Barrens,52.23,31.00
A	accept	870
A	target	+Tonga Runetotem
A	goto	The Barrens,52.26,31.94
A	accept	899
A	accept	4921
A	target	+Mankrik
A	goto	The Barrens,52.00,31.60
A	accept	871
A	accept	5041
A	target	+Thork
A	goto	The Barrens,51.50,30.87
A	maxlevel	16
S	
T	optional	
A	accept	869
A	target	+Gazrog
A	goto	The Barrens,51.93,30.32
A	turnin	842
A	accept	844
A	target	+Sergra Darkthorn
A	goto	The Barrens,52.23,31.00
A	accept	870
A	target	+Tonga Runetotem
A	goto	The Barrens,52.26,31.94
A	accept	899
A	accept	4921
A	target	+Mankrik
A	goto	The Barrens,52.00,31.60
S	
A	goto	The Barrens,51.62,30.90
A	accept	867
A	target	Darsok Swiftdagger
S	
A	goto	The Barrens,51.50,30.34
A	turnin	6365
A	accept	6384
A	zoneskip	Orgrimmar
A	target	Devrak
A	isOnQuest	6365
S	
A	goto	The Barrens,51.44,30.15
A	accept	848
A	accept	1492
A	turnin	1358
A	target	Apothecary Helbrim
S	
T	completewith	DemonSeed
A	complete	844,1
A	mob	Greater Plainstrider
A	mob	Fleeting Plainstrider
S	
A	group	
A	goto	The Barrens,51.09,22.68,40,0
A	goto	The Barrens,50.33,21.85,40,0
A	goto	The Barrens,49.21,20.42,40,0
A	goto	The Barrens,47.58,19.38,100
A	isOnQuest	924
S	
A	group	
T	label	DemonSeed
A	goto	The Barrens,47.98,19.08
A	collect	4986,1,924
A	complete	924,1
A	isOnQuest	924
S	
A	group	
T	completewith	DisruptTheAttacks
A	goto	The Barrens,47.58,19.38,40,0
A	goto	The Barrens,49.21,20.42,40,0
A	goto	The Barrens,50.33,21.85,40,0
A	goto	The Barrens,51.09,22.68,100
A	isOnQuest	924
S	
T	completewith	DisruptTheAttacks
A	complete	844,1
A	mob	Greater Plainstrider
A	mob	Fleeting Plainstrider
S	
T	completewith	next
A	complete	871,1
A	mob	+Razormane Water Seeker
A	complete	871,2
A	mob	+Razormane Thornweaver
A	complete	871,3
A	mob	+Razormane Hunter
A	isOnQuest	871
S	
A	goto	The Barrens,55.70,27.30
A	use	4926
A	collect	4926,1,819
A	accept	819
S	!Tauren !Hunter !Shaman
T	label	DisruptTheAttacks
T	loop	
A	goto	The Barrens,53.63,24.50,0
A	goto	The Barrens,53.63,24.50,50,0
A	goto	The Barrens,54.26,24.64,50,0
A	goto	The Barrens,54.81,25.19,50,0
A	goto	The Barrens,55.50,25.61,50,0
A	goto	The Barrens,55.86,26.30,50,0
A	goto	The Barrens,55.83,27.15,50,0
A	goto	The Barrens,55.41,27.41,50,0
A	goto	The Barrens,54.50,26.97,50,0
A	goto	The Barrens,54.05,26.11,50,0
A	goto	The Barrens,53.51,25.24,50,0
A	complete	871,1
A	mob	+Razormane Water Seeker
A	complete	871,2
A	mob	+Razormane Thornweaver
A	complete	871,3
A	mob	+Razormane Hunter
A	isOnQuest	871
S	
T	loop	
A	goto	The Barrens,53.71,29.19,0
A	goto	The Barrens,53.36,26.28,80,0
A	goto	The Barrens,53.23,28.41,80,0
A	goto	The Barrens,53.57,29.58,80,0
A	goto	The Barrens,52.91,32.90,80,0
A	goto	The Barrens,51.31,32.91,80,0
A	goto	The Barrens,50.50,31.05,80,0
A	goto	The Barrens,50.05,29.77,80,0
A	goto	The Barrens,50.93,27.72,80,0
A	goto	The Barrens,52.83,27.91,80,0
A	goto	The Barrens,53.71,29.19,80,0
A	complete	844,1
A	mob	Greater Plainstrider
A	mob	Fleeting Plainstrider
S	
A	goto	The Barrens,52.23,31.00
A	turnin	844
A	accept	845
A	target	Sergra Darkthorn
S	
A	goto	The Barrens,51.50,30.87
A	turnin	871
A	accept	872
A	target	Thork
A	isQuestComplete	871
S	
A	goto	The Barrens,51.50,30.87
A	accept	872
A	target	Thork
A	isQuestTurnedIn	871
S	!Tauren !Undead
A	goto	The Barrens,52.62,29.85
A	turnin	6386
A	target	Zargh
A	isOnQuest	6386
S	
T	sticky	
T	completewith	EnterRFC
A	subzone	2437
A	dungeon	RFC
S	
A	goto	The Barrens,51.99,29.89
A	home	
A	target	Innkeeper Boorand Plainswind
A	bindlocation	380
A	isQuestAvailable	845
A	dungeon	RFC
S	skip --!Tauren
T	completewith	next
A	zone	Stonetalon Mountains
A	zoneskip	Stonetalon Mountains
A	dungeon	RFC
S	skip --!Tauren
T	completewith	next
A	goto	Stonetalon Mountains,82.57,98.63,60,0
A	goto	Stonetalon Mountains,80.10,98.20,40,0
A	goto	Stonetalon Mountains,77.17,98.61,40
A	dungeon	RFC
S	skip --!Tauren
A	goto	Stonetalon Mountains,74.69,98.10
A	goto	Thunder Bluff,56.65,18.96,30
A	link	https://www.youtube.com/watch?v=cp2YI86AO4Y&ab
A	dungeon	RFC
S	skip --!Tauren
T	completewith	RFCPickups
A	goto	Thunder Bluff,50.75,37.07,40
A	dungeon	RFC
S	Tauren
T	completewith	RFCPickups
A	goto	The Barrens,51.50,30.34
A	fly	Thunder Bluff
A	zoneskip	Thunder Bluff
A	dungeon	RFC
S	!Tauren
T	completewith	RFCPickups
A	goto	Mulgore,68.68,60.34,120,0
A	zone	Thunder Bluff
A	dungeon	RFC
S	
T	completewith	next
A	goto	Thunder Bluff,69.88,30.90,80
A	dungeon	RFC
S	
T	label	RFCPickups
A	goto	Thunder Bluff,70.4,29.6
A	accept	5722
A	accept	5723
A	target	Rahauro
A	dungeon	RFC
S	
T	completewith	next
A	goto	Thunder Bluff,47.00,49.82
A	fp	Thunder Bluff
A	fly	Orgrimmar
A	zoneskip	Orgrimmar
A	target	Tal
A	dungeon	RFC
S	
A	goto	Orgrimmar,31.74,37.82
A	accept	5726
A	target	Thrall
A	dungeon	RFC
S	
A	goto	Durotar,53.08,9.19
A	complete	5726,1
A	dungeon	RFC
S	
A	goto	Orgrimmar,31.74,37.82
A	turnin	5726
A	accept	5727
A	target	Thrall
A	dungeon	RFC
S	
A	goto	Orgrimmar,49.6,50.4
A	accept	5761
A	target	Neeru Fireblade
A	dungeon	RFC
S	
A	goto	Orgrimmar,49.6,50.4
A	complete	5727,1
A	skipgossip	
A	target	Neeru Fireblade
A	dungeon	RFC
S	
A	goto	Orgrimmar,31.74,37.82
A	turnin	5727
A	accept	5728
A	target	Thrall
A	dungeon	RFC
S	
T	completewith	EnterRFC
A	destroy	14544
A	dungeon	RFC
S	
T	label	EnterRFC
A	goto	Orgrimmar,52.77,48.97
A	subzone	2437
A	dungeon	RFC
S	
T	completewith	next
A	complete	5723,1
A	mob	+Ragefire Trogg
A	complete	5723,2
A	mob	+Ragefire Shaman
A	isOnQuest	5723
A	dungeon	RFC
S	
A	turnin	5722
A	accept	5724
A	target	Maur Grimtotem
A	isOnQuest	5722
A	dungeon	RFC
S	
T	optional	
A	accept	5724
A	target	Maur Grimtotem
A	isQuestTurnedIn	5722
A	dungeon	RFC
S	
T	label	TroggsShamans
A	complete	5723,1
A	mob	+Ragefire Trogg
A	complete	5723,2
A	mob	+Ragefire Shaman
A	isOnQuest	5723
A	dungeon	RFC
S	
T	requires	TroggsShamans
T	completewith	BazzalanandJergosh
A	complete	5725,1
A	complete	5725,2
A	mob	Searing Blade Cultist
A	mob	Searing Blade Warlock
A	isOnQuest	5725
A	dungeon	RFC
S	
A	complete	5761,1
A	mob	Taragaman the Hungerer
A	isOnQuest	5761
A	dungeon	RFC
S	
T	label	BazzalanandJergosh
A	complete	5728,1
A	mob	+Bazzalan
A	complete	5728,2
A	mob	+Jergosh the Invoker
A	isOnQuest	5728
A	dungeon	RFC
S	
A	complete	5725,1
A	complete	5725,2
A	mob	Searing Blade Cultist
A	mob	Searing Blade Warlock
A	isOnQuest	5725
A	dungeon	RFC
S	
A	goto	Orgrimmar,49.6,50.4
A	turnin	5761
A	target	Neeru Fireblade
A	isQuestComplete	5761
A	dungeon	RFC
S	
A	goto	Orgrimmar,31.74,37.82
A	turnin	5728
A	accept	5729
A	target	Thrall
A	isQuestComplete	5728
A	dungeon	RFC
S	
A	goto	Orgrimmar,31.74,37.82
A	accept	5729
A	target	Thrall
A	isQuestTurnedIn	5728
A	dungeon	RFC
S	
A	goto	Orgrimmar,49.6,50.4
A	turnin	5729
A	accept	5730
A	target	Neeru Fireblade
A	dungeon	RFC
A	isQuestTurnedIn	5728
S	
A	goto	Orgrimmar,31.74,37.82
A	turnin	5730
A	target	Thrall
A	isQuestTurnedIn	5728
A	dungeon	RFC
S	
T	completewith	next
A	zone	Durotar
A	zoneskip	Durotar
A	dungeon	RFC
S	
A	goto	Durotar,50.8,13.8,40
A	zone	Tirisfal Glades
A	zoneskip	Tirisfal Glades
A	isQuestComplete	5725
A	dungeon	RFC
S	
T	completewith	Varimathras
A	goto	Tirisfal Glades,61.80,65.06,20,0
A	zone	Undercity
A	zoneskip	Undercity
A	dungeon	RFC
S	
T	completewith	next
A	goto	Undercity,66.09,20.06,20,0
A	goto	Undercity,64.37,23.94,20,0
A	goto	Undercity,65.93,26.71,10,0
A	goto	Undercity,65.89,34.03,10,0
A	goto	Undercity,64.22,39.77,10,0
A	goto	Undercity,65.53,43.62,15
A	goto	Undercity,56.2,96.2
A	dungeon	RFC
S	
T	label	Varimathras
A	turnin	5725
A	target	Varimathras
A	isQuestComplete	5725
A	dungeon	RFC
S	
T	completewith	next
A	hs	
A	use	6948
A	bindlocation	380,1
A	subzoneskip	380
A	dungeon	RFC
S	
T	completewith	FinalRFCTurnin
A	goto	The Barrens,51.50,30.34
A	fly	Thunder Bluff
A	target	Devrak
A	zoneskip	Thunder Bluff
A	dungeon	RFC
S	
A	goto	Thunder Bluff,70.4,29.6
A	turnin	5724
A	turnin	5723
A	target	Rahauro
A	dungeon	RFC
A	isOnQuest	5724
A	isQuestComplete	5723
S	
A	goto	Thunder Bluff,70.4,29.6
A	turnin	5724
A	target	Rahauro
A	dungeon	RFC
A	isOnQuest	5724
S	
T	label	FinalRFCTurnin
A	goto	Thunder Bluff,70.4,29.6
A	turnin	5723
A	target	Rahauro
A	dungeon	RFC
A	isQuestComplete	5723
S	
T	completewith	RatchetArrive
A	hs	
A	cooldown	item,6948,>0
A	use	6948
A	dungeon	RFC
A	zoneskip	Thunder Bluff,1
S	
T	completewith	RatchetArrive
A	goto	Thunder Bluff,47.00,49.82
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
S	
A	goto	The Barrens,55.70,27.30,20,0
A	goto	The Barrens,55.78,20.00
A	use	4926
A	collect	4926,1,819
A	accept	819
S	
T	completewith	KreenigSnarlsnout
A	goto	The Barrens,56.75,24.69,50,0
A	goto	The Barrens,59.26,24.67,50,0
A	complete	872,1
A	mob	+Razormane Geomancer
A	complete	872,2
A	mob	+Razormane Defender
A	isOnQuest	872
S	
T	completewith	next
A	complete	5041,1
A	isOnQuest	5041
S	
T	label	KreenigSnarlsnout
A	goto	The Barrens,58.69,27.08
A	complete	872,3
A	mob	Kreenig Snarlsnout
A	isOnQuest	872
S	
T	optional	
T	completewith	next
A	goto	The Barrens,56.75,24.69,0
A	goto	The Barrens,59.26,24.67,0
A	complete	872,1
A	mob	+Razormane Geomancer
A	complete	872,2
A	mob	+Razormane Defender
A	isOnQuest	872
S	
A	goto	The Barrens,58.38,27.01,30,0
A	goto	The Barrens,59.46,24.58
A	complete	5041,1
A	isOnQuest	5041
S	
T	loop	
A	goto	The Barrens,58.90,25.37,0
A	goto	The Barrens,59.37,25.38,50,0
A	goto	The Barrens,59.63,24.46,50,0
A	goto	The Barrens,59.63,23.88,50,0
A	goto	The Barrens,59.06,23.89,50,0
A	goto	The Barrens,58.62,23.98,50,0
A	goto	The Barrens,57.83,24.28,50,0
A	goto	The Barrens,56.87,24.55,50,0
A	goto	The Barrens,56.74,25.37,50,0
A	goto	The Barrens,57.25,25.46,50,0
A	goto	The Barrens,57.52,25.63,50,0
A	goto	The Barrens,57.65,25.08,50,0
A	goto	The Barrens,58.24,24.98,50,0
A	goto	The Barrens,58.90,25.37,50,0
A	complete	872,1
A	mob	+Razormane Geomancer
A	complete	872,2
A	mob	+Razormane Defender
A	isOnQuest	872
S	
T	completewith	next
A	complete	845,1
A	mob	Zhevra Runner
S	
A	group	
A	goto	The Barrens,62.34,20.07
A	turnin	924
A	target	Ak'Zeloth
A	isQuestComplete	924
S	
T	completewith	next
A	complete	845,1
A	mob	Zhevra Runner
S	
A	goto	The Barrens,63.08,36.56,120
A	subzoneskip	392
S	
T	label	RatchetArrive
A	goto	The Barrens,62.68,36.23
A	accept	887
A	target	Gazlowe
S	
T	completewith	next
A	goto	The Barrens,63.09,37.16
A	fp	Ratchet
A	target	Bragok
S	
A	accept	894
A	goto	The Barrens,62.98,37.22
A	accept	895
A	goto	The Barrens,62.59,37.47
A	target	Sputtervalve
S	Troll Warrior/Undead Warrior
A	goto	The Barrens,62.24,37.48
A	collect	2030,1,895,1
A	money	<0.5544
A	target	Ironzar
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.9
S	Troll Warrior/Undead Warrior
T	optional	
T	completewith	BarenLongshore
A	use	2030
A	itemcount	2030,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.9
S	Orc Warrior
A	goto	The Barrens,62.24,37.48
A	collect	2025,1,895,1
A	money	<0.5304
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.8
S	Orc Warrior
T	optional	
T	completewith	BarenLongshore
A	use	2025
A	itemcount	2025,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.8
S	Tauren Warrior
A	goto	The Barrens,62.24,37.48
A	collect	2026,1,895,1
A	money	<0.6286
A	target	Ironzar
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.5
S	Tauren Warrior
T	optional	
T	completewith	BarenLongshore
A	use	2026
A	itemcount	2026,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.5
S	Shaman
A	goto	The Barrens,62.24,37.48
A	collect	2030,1,895,1
A	money	<0.5544
A	target	Ironzar
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.9
S	Shaman
T	optional	
T	completewith	BarenLongshore
A	use	2030
A	itemcount	2030,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.9
S	Rogue
A	goto	The Barrens,62.24,37.48
A	collect	2027,1,895,1
A	money	<0.3815
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.6
A	target	Ironzar
S	Rogue
A	goto	The Barrens,62.24,37.48
A	collect	2027,2,895,1
A	money	<0.3815
A	itemStat	17,QUALITY,<7
A	itemStat	17,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.6
A	target	Ironzar
S	
A	goto	The Barrens,62.27,38.39
A	turnin	819
A	accept	821
A	target	Brewmaster Drohn
S	
A	goto	The Barrens,62.05,39.41
A	vendor	
A	collect	4592,40,895,1
A	collect	1205,20,895,1 << Mage/Warlock/Priest/Shaman/Druid
A	home	
A	target	Innkeeper Wiley
A	bindlocation	392
A	isQuestAvailable	887
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
T	completewith	next
A	complete	1963,1
A	unitscan	Tazan
S	
T	label	BaronLongshore
T	loop	
A	goto	The Barrens,64.21,47.14,0
A	goto	The Barrens,63.57,49.14,0
A	goto	The Barrens,62.64,49.72,0
A	goto	The Barrens,64.21,47.14,50,0
A	goto	The Barrens,63.57,49.14,50,0
A	goto	The Barrens,62.64,49.72,50,0
A	complete	895,1
A	unitscan	Baron Longshore
S	Orc Rogue/Troll Rogue
T	completewith	next
A	complete	1963,1
A	unitscan	Tazan
S	
T	loop	
A	goto	The Barrens,64.23,47.10,0
A	goto	The Barrens,64.40,44.09,50,0
A	goto	The Barrens,63.62,46.26,50,0
A	goto	The Barrens,64.23,47.10,50,0
A	complete	887,1
A	mob	+Southsea Brigand
A	complete	887,2
A	mob	+Southsea Cannoneer
S	Orc Rogue/Troll Rogue
A	goto	The Barrens,63.70,44.32,50,0
A	goto	The Barrens,62.70,44.07,50,0
A	goto	The Barrens,62.18,44.47
A	complete	1963,1
A	unitscan	Tazan
S	
A	goto	The Barrens,62.68,36.23
A	turnin	887
A	turnin	895
A	accept	890
A	target	Gazlowe
S	
A	goto	The Barrens,63.35,38.45
A	turnin	1492
A	turnin	890
A	accept	892
A	accept	896
A	target	Wharfmaster Dizzywig
S	
A	goto	The Barrens,62.68,36.23
A	turnin	892
A	accept	888
A	target	Gazlowe
S	Troll Warrior/Undead Warrior
A	goto	The Barrens,62.24,37.48
A	collect	2030,1,850,1
A	money	<0.5544
A	target	Ironzar
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.9
S	Troll Warrior/Undead Warrior
T	optional	
T	completewith	FlyToXroads1
A	use	2030
A	itemcount	2030,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.9
S	Orc Warrior
A	goto	The Barrens,62.24,37.48
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
A	goto	The Barrens,62.24,37.48
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
S	Shaman
A	goto	The Barrens,62.24,37.48
A	collect	2030,1,850,1
A	money	<0.5544
A	target	Ironzar
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.9
S	Shaman
T	optional	
T	completewith	FlyToXroads1
A	use	2030
A	itemcount	2030,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.9
S	Rogue
A	goto	The Barrens,62.24,37.48
A	collect	2027,1,850,1
A	money	<0.3815
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.6
A	target	Ironzar
S	Rogue
A	goto	The Barrens,62.24,37.48
A	collect	2027,2,850,1
A	money	<0.3815
A	itemStat	17,QUALITY,<7
A	itemStat	17,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.6
A	target	Ironzar
S	
T	label	FlyToXroads1
T	completewith	XroadsTurnins3
A	goto	The Barrens,63.09,37.16
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
A	goto	The Barrens,55.27,37.82,0
A	goto	The Barrens,48.33,36.75,0
A	goto	The Barrens,55.27,37.82,80,0
A	goto	The Barrens,53.84,38.52,80,0
A	goto	The Barrens,52.63,38.07,80,0
A	goto	The Barrens,49.49,37.20,80,0
A	goto	The Barrens,48.33,36.75,80,0
A	complete	845,1
A	mob	Zhevra Runner
S	
A	goto	The Barrens,51.50,30.87
A	turnin	5041
A	turnin	872
A	target	Thork
A	isQuestComplete	872
A	isQuestComplete	5041
S	
T	optional	
A	goto	The Barrens,51.50,30.87
A	turnin	5041
A	target	Thork
A	isQuestComplete	5041
S	
T	optional	
A	goto	The Barrens,51.50,30.87
A	turnin	872
A	target	Thork
A	isQuestComplete	872
S	
T	label	XroadsTurnins3
A	goto	The Barrens,52.23,31.00
A	turnin	845
A	accept	903
A	target	Sergra Darkthorn
S	Hunter
A	goto	The Barrens,51.67,29.95
A	collect	2515,1200,870,1 << Hunter
A	target	Barg
S	
T	completewith	RegtharDeathgate1
A	complete	821,2
A	mob	Greater Plainstrider
A	mob	Fleeting Plainstrider
S	
T	completewith	next
A	complete	869,1
A	mob	Sunscale Lashtail
A	mob	Sunscale Screecher
S	
T	label	RegtharDeathgate1
A	goto	The Barrens,45.35,28.41
A	accept	850
A	accept	855
A	target	Regthar Deathgate
S	
T	completewith	Leaders
A	complete	855,1
A	mob	Kolkar Wrangler
A	mob	Kolkar Stormer
S	
T	completewith	next
A	complete	848,1
S	
A	goto	The Barrens,45.06,22.54
A	complete	870,1
S	
A	goto	The Barrens,42.82,23.52
A	complete	850,1
A	mob	Barak Kodobane
S	
A	goto	The Barrens,45.35,28.41
A	turnin	850
A	accept	851
A	turnin	855
A	target	Regthar Deathgate
A	isQuestComplete	855
S	
T	label	Leaders
A	goto	The Barrens,45.35,28.41
A	turnin	850
A	accept	851
A	target	Regthar Deathgate
S	
T	completewith	next
A	complete	869,1
A	mob	Sunscale Lashtail
A	mob	Sunscale Screecher
S	
T	loop	
A	goto	The Barrens,41.62,23.42,0
A	goto	The Barrens,41.62,23.42,50,0
A	goto	The Barrens,41.30,24.31,50,0
A	goto	The Barrens,40.52,22.88,50,0
A	goto	The Barrens,41.00,21.19,50,0
A	goto	The Barrens,40.32,20.69,50,0
A	complete	903,1
A	complete	821,1
A	mob	Savannah Prowler
S	
T	loop	
A	goto	The Barrens,41.84,14.81,0
A	goto	The Barrens,41.51,19.09,60,0
A	goto	The Barrens,40.82,18.23,60,0
A	goto	The Barrens,40.95,16.80,60,0
A	goto	The Barrens,41.23,15.79,60,0
A	goto	The Barrens,41.21,14.75,60,0
A	goto	The Barrens,41.84,14.81,60,0
A	complete	867,1
A	mob	Witchwing Harpy
A	mob	Witchwing Roguefeather
S	
T	completewith	Samophlange
S	
T	sticky	
T	completewith	Samophlange
A	complete	821,2
A	mob	Greater Plainstrider
A	mob	Fleeting Plainstrider
A	mob	Ornery Plainstrider
S	
A	goto	The Barrens,43.80,12.22
A	vendor	
A	target	Vrang Wildgore
S	
T	label	Samophlange
A	goto	The Barrens,52.40,11.65
A	turnin	894
A	accept	900
S	
A	goto	The Barrens,52.33,11.57
A	complete	900,2
S	
A	goto	The Barrens,52.29,11.40
A	complete	900,3
S	
A	goto	The Barrens,52.40,11.40
A	complete	900,1
S	
A	goto	The Barrens,52.40,11.65
A	turnin	900
A	accept	901
S	
A	goto	The Barrens,52.84,10.40
A	complete	901,1
A	mob	Tinkerer Sniggles
S	
A	goto	The Barrens,52.40,11.65
A	turnin	901
A	accept	902
S	Druid
T	completewith	DruidTraining1
A	cast	18960
A	zoneskip	Moonglade
S	Druid
T	optional	
A	goto	Moonglade,52.53,40.58
A	train	5211
A	target	Loganaar
A	xp	<16,1
A	xp	>18,1
S	Druid
T	label	DruidTraining1
A	goto	Moonglade,52.53,40.58
A	train	1430
A	target	Loganaar
A	xp	<18,1
S	
T	completewith	next
A	hs	
A	bindlocation	392,1
A	subzoneskip	392
A	use	6948
S	
A	goto	The Barrens,62.05,39.41
A	vendor	
A	collect	4592,40,896,1
A	collect	1205,40,896,1 << Mage/Warlock/Priest/Shaman/Druid
A	target	Innkeeper Wiley
A	isQuestAvailable	896
S	
A	goto	The Barrens,62.98,37.22
A	turnin	902
A	accept	3921
A	accept	1483
A	target	Sputtervalve
S	
T	completewith	Crossroadsturnins2
A	goto	The Barrens,63.09,37.16
A	fly	Crossroads
A	target	Bragok
A	subzoneskip	380
S	
A	goto	The Barrens,51.44,30.15
A	turnin	848
A	target	Apothecary Helbrim
A	isQuestComplete	848
S	
T	optional	
A	turnin	867
A	accept	875
A	target	+Darsok Swiftdagger
A	goto	The Barrens,51.62,30.90
A	turnin	870
A	accept	877
A	target	+Tonga Runetotem
A	goto	The Barrens,52.26,31.93
A	turnin	903
A	accept	881
A	target	+Sergra Darkthorn
A	goto	The Barrens,52.24,31.01
A	turnin	869
A	accept	3281
A	target	+Gazrog
A	goto	The Barrens,51.93,30.32
A	isQuestComplete	869
S	
T	label	Crossroadsturnins2
A	turnin	867
A	accept	875
A	target	+Darsok Swiftdagger
A	goto	The Barrens,51.62,30.90
A	turnin	870
A	accept	877
A	target	+Tonga Runetotem
A	goto	The Barrens,52.26,31.93
A	turnin	903
A	accept	881
A	target	+Sergra Darkthorn
A	goto	The Barrens,52.24,31.01
S	Hunter
A	goto	The Barrens,51.11,29.07
A	collect	11362,1,896,1
A	collect	2515,1800,896,1
A	target	Uthrok
S	
A	goto	The Barrens,51.99,29.89
A	home	
A	target	Innkeeper Boorand Plainswind
A	bindlocation	380
A	isQuestAvailable	881
S	
T	completewith	CatsEye
A	goto	The Barrens,51.50,30.34
A	fly	Orgrimmar
A	zoneskip	Orgrimmar
A	target	Devrak
S	!Tauren !Undead
A	goto	Orgrimmar,54.097,68.407
A	turnin	6384
A	accept	6385
A	target	Innkeeper Gryshka
A	isOnQuest	6384
S	!Tauren !Undead
A	goto	Orgrimmar,45.120,63.889
A	turnin	6385
A	accept	6386
A	target	Doras
A	isOnQuest	6385
S	Shaman
A	goto	Orgrimmar,38.82,36.41
A	train	8019
A	target	Kardris Dreamseeker
A	xp	<16,1
A	xp	>18,1
S	Shaman
T	optional	
A	goto	Orgrimmar,38.82,36.41
A	train	913
A	target	Kardris Dreamseeker
A	xp	<18,1
S	
A	goto	Orgrimmar,38.94,38.39
A	accept	1061
A	target	Zor Lonetree
S	Rogue
A	goto	Orgrimmar,43.05,53.73
A	train	1804
A	train	921
A	accept	2379
A	target	Shenthul
S	Orc Rogue/Troll Rogue
A	goto	Orgrimmar,42.74,53.55
A	turnin	1963
A	accept	1858
A	target	Therzok
S	Rogue
A	goto	Orgrimmar,42.72,52.95
A	turnin	2379
A	accept	2382
A	target	Zando'zan
S	Orc Rogue/Troll Rogue
T	completewith	next
A	goto	Orgrimmar,42.10,49.51
A	collect	5060,1,1858,1
A	target	Rekkul
A	money	<0.15
S	Orc Rogue/Troll Rogue
A	goto	Orgrimmar,42.74,53.52
A	complete	1858,1
A	money	<0.15
S	Orc Rogue/Troll Rogue
A	goto	Orgrimmar,42.74,53.55
A	turnin	1858
A	target	Therzok
S	Orc Rogue/Troll Rogue
A	goto	Orgrimmar,53.99,68.05
A	collect	7208,1,1858,1
A	complete	1858,1
A	isOnQuest	1858
S	Orc Rogue/Troll Rogue
A	goto	Orgrimmar,42.74,53.55
A	turnin	1858
A	target	Therzok
S	Warlock
A	goto	Orgrimmar,48.62,46.95
A	train	1455
A	target	Mirket
A	xp	<16,1
A	xp	>18,1
S	Warlock
T	optional	
A	goto	Orgrimmar,48.62,46.95
A	train	1014
A	target	Mirket
A	xp	<18,1
S	Warlock
A	goto	Orgrimmar,47.54,46.75
A	collect	16351,1,896,1
A	target	Kurgul
A	xp	<16,1
A	xp	>18,1
S	Warlock
A	goto	Orgrimmar,47.54,46.75
A	collect	16316,1,896,1
A	target	Kurgul
A	xp	<18,1
S	Warrior
A	goto	Orgrimmar,79.91,31.36
A	train	285
A	target	Grezz Ragefist
A	xp	<16,1
A	xp	>18,1
S	Warrior
T	optional	
A	goto	Orgrimmar,79.91,31.36
A	train	8198
A	target	Grezz Ragefist
A	xp	<18,1
S	Hunter
A	goto	Orgrimmar,66.05,18.52
A	train	13795
A	target	Ormak Grimshot
A	xp	<16,1
A	xp	>18,1
S	Hunter
T	optional	
A	goto	Orgrimmar,66.05,18.52
A	train	2643
A	target	Ormak Grimshot
A	xp	<18,1
S	Hunter
A	goto	Orgrimmar,66.34,14.83
A	train	24557
A	target	Xao'tsu
A	xp	<18,1
S	Hunter
A	goto	Orgrimmar,81.52,19.60
A	train	227
A	target	Hanashi
S	Priest
A	goto	Orgrimmar,35.59,87.80
A	train	8102
A	target	Ur'kyo
A	xp	<16,1
A	xp	>18,1
S	Priest
T	optional	
A	goto	Orgrimmar,35.59,87.80
A	train	970
A	target	Ur'kyo
A	xp	<18,1
S	Mage
A	goto	Orgrimmar,38.36,85.54
A	train	2120
A	target	Pephredo
A	xp	<16,1
A	xp	>18,1
S	Mage
T	optional	
A	goto	Orgrimmar,38.36,85.54
A	train	3140
A	target	Pephredo
A	xp	<18,1
S	
T	completewith	next
A	skill	firstaid,40
A	skill	firstaid,<1,1
S	
A	goto	Orgrimmar,34.18,84.53
A	train	3276
A	target	Arnok
A	skill	firstaid,<1,1
S	
T	completewith	next
A	skill	firstaid,50
A	skill	firstaid,<1,1
S	
A	goto	Orgrimmar,34.18,84.53
A	train	3274
A	target	Arnok
A	skill	firstaid,<1,1
S	
A	goto	Orgrimmar,26.22,61.58,80,0
A	goto	Orgrimmar,15.66,63.33,30,0
A	goto	Orgrimmar,18.03,60.51,50
A	zoneskip	The Barrens
A	isOnQuest	896
S	
T	label	CatsEye
T	loop	
A	goto	The Barrens,61.51,4.43,0
A	goto	The Barrens,61.46,4.50,40,0
A	goto	The Barrens,61.06,3.63,40,0
A	goto	The Barrens,61.63,3.37,40,0
A	goto	The Barrens,62.14,3.52,40,0
A	goto	The Barrens,61.94,4.53,40,0
A	goto	The Barrens,61.85,5.37,40,0
A	goto	The Barrens,61.44,5.56,40,0
A	goto	The Barrens,61.17,5.05,40,0
A	goto	The Barrens,61.51,4.43,40,0
A	complete	896,1
A	mob	Venture Co. Enforcer
A	mob	Venture Co. Overseer
S	
T	ssf	
A	goto	The Barrens,61.51,4.43,0
A	goto	The Barrens,61.46,4.50,40,0
A	goto	The Barrens,61.06,3.63,40,0
A	goto	The Barrens,61.63,3.37,40,0
A	goto	The Barrens,62.14,3.52,40,0
A	goto	The Barrens,61.94,4.53,40,0
A	goto	The Barrens,61.85,5.37,40,0
A	goto	The Barrens,61.44,5.56,40,0
A	goto	The Barrens,61.17,5.05,40,0
A	goto	The Barrens,61.51,4.43,40,0
A	collect	814,5,103,1
A	dungeon	DM
S	
T	ah	
A	goto	The Barrens,61.51,4.43,0
A	goto	The Barrens,61.46,4.50,40,0
A	goto	The Barrens,61.06,3.63,40,0
A	goto	The Barrens,61.63,3.37,40,0
A	goto	The Barrens,62.14,3.52,40,0
A	goto	The Barrens,61.94,4.53,40,0
A	goto	The Barrens,61.85,5.37,40,0
A	goto	The Barrens,61.44,5.56,40,0
A	goto	The Barrens,61.17,5.05,40,0
A	goto	The Barrens,61.51,4.43,40,0
A	collect	814,5,103,1
A	dungeon	DM
S	
T	completewith	Wenikee
A	complete	869,1
A	mob	Sunscale Lashtail
A	mob	Sunscale Screecher
A	mob	Sunscale Scytheclaw
S	
T	completewith	next
A	complete	821,2
A	mob	Ornery Plainstrider
S	
T	label	Wenikee
A	goto	The Barrens,49.05,11.16
A	turnin	3921
A	accept	3922
A	target	Wenikee Boltbucket
S	
T	sticky	
T	completewith	Slugs
A	complete	3922,1
S	
A	goto	The Barrens,56.52,7.45
A	accept	858
A	target	Wizzlecrank's Shredder
S	
T	completewith	next
A	unitscan	Foreman Grills
A	unitscan	Sludge Beast
S	
A	goto	The Barrens,56.52,8.47,20,0
A	goto	The Barrens,56.34,8.24,12,0
A	goto	The Barrens,56.12,8.33,12,0
A	goto	The Barrens,56.05,8.49,12,0
A	goto	The Barrens,56.13,8.56,12,0
A	goto	The Barrens,56.34,8.24
A	complete	858,1
A	mob	Supervisor Lugwizzle
S	
A	goto	The Barrens,56.52,7.45
A	turnin	858
A	accept	863,1
A	target	Wizzlecrank's Shredder
S	
T	label	Slugs
A	goto	The Barrens,55.80,7.76,30,0
A	goto	The Barrens,55.51,7.13
A	complete	863,1
A	mob	Venture Co. Mercenary
A	mob	Venture Co. Drudger
A	mob	Overseer Glibby
S	
T	loop	
A	goto	The Barrens,55.69,6.94,0
A	goto	The Barrens,55.50,7.98,25,0
A	goto	The Barrens,55.60,8.85,25,0
A	goto	The Barrens,56.04,9.79,25,0
A	goto	The Barrens,56.68,8.82,25,0
A	goto	The Barrens,57.17,9.08,25,0
A	goto	The Barrens,57.61,8.41,25,0
A	goto	The Barrens,57.31,7.20,25,0
A	goto	The Barrens,56.72,6.92,25,0
A	goto	The Barrens,56.17,6.80,25,0
A	goto	The Barrens,55.69,6.94,25,0
A	complete	3922,1
S	
T	completewith	NuggetSlugsTurnIn
S	
T	sticky	
T	completewith	NuggetSlugsTurnIn
A	complete	869,1
A	mob	Sunscale Lashtail
A	mob	Sunscale Screecher
A	mob	Sunscale Scytheclaw
S	
T	sticky	
T	completewith	NuggetSlugsTurnIn
A	complete	821,2
A	mob	Greater Plainstrider
A	mob	Fleeting Plainstrider
A	mob	Ornery Plainstrider
S	
A	goto	The Barrens,55.80,17.03
A	complete	881,1
A	mob	Echeyakee
A	use	10327
S	
T	optional	
A	goto	The Barrens,52.23,31.00
A	abandon	881
A	itemcount	5100,<1
S	
A	goto	The Barrens,52.24,31.01
A	accept	881
A	target	Sergra Darkthorn
A	itemcount	5100,<1
S	
A	goto	The Barrens,55.80,17.03
A	complete	881,1
A	mob	Echeyakee
A	use	10327
S	
T	label	NuggetSlugsTurnIn
A	goto	The Barrens,49.05,11.16
A	turnin	3922
A	accept	3923
A	target	Wenikee Boltbucket
S	
T	loop	
A	goto	The Barrens,47.81,14.18,0
A	goto	The Barrens,47.81,14.18,50,0
A	goto	The Barrens,45.78,14.74,50,0
A	goto	The Barrens,44.60,15.04,50,0
A	complete	869,1
A	mob	Sunscale Lashtail
A	mob	Sunscale Screecher
A	mob	Sunscale Scytheclaw
S	
T	loop	
A	goto	The Barrens,40.15,15.98,0
A	goto	The Barrens,40.28,15.49,50,0
A	goto	The Barrens,39.50,14.68,50,0
A	goto	The Barrens,39.47,13.24,50,0
A	goto	The Barrens,38.94,12.80,50,0
A	goto	The Barrens,38.18,12.56,50,0
A	goto	The Barrens,37.96,13.52,50,0
A	goto	The Barrens,38.62,13.95,50,0
A	goto	The Barrens,38.18,14.62,50,0
A	goto	The Barrens,38.14,15.59,50,0
A	goto	The Barrens,37.29,15.68,50,0
A	goto	The Barrens,37.24,16.26,50,0
A	goto	The Barrens,37.67,16.34,50,0
A	goto	The Barrens,38.35,17.08,50,0
A	goto	The Barrens,38.83,17.71,50,0
A	goto	The Barrens,39.37,17.21,50,0
A	goto	The Barrens,39.87,16.66,50,0
A	goto	The Barrens,40.15,15.98,50,0
A	complete	875,1
A	mob	Witchwing Slayer
A	mob	Witchwing Ambusher
S	
T	completewith	FoodandWater1
A	hs	
A	use	6948
A	cooldown	item,6948,>0
A	bindlocation	380,1
A	subzoneskip	380
S	
T	completewith	FoodandWater1
A	goto	The Barrens,52.09,30.43,120
A	cooldown	item,6948,<0
A	subzoneskip	380
S	
T	completewith	next
A	itemcount	814,5
A	dungeon	DM
S	
T	label	FoodandWater1
A	goto	The Barrens,51.99,29.89
A	vendor	
A	vendor	
A	target	Innkeeper Boorand Plainswind
S	!Tauren !Undead
T	optional	
A	turnin	869
A	accept	3281
A	target	+Gazrog
A	goto	The Barrens,51.93,30.32
A	turnin	6386
A	target	+Zargh
A	goto	The Barrens,52.62,29.84
A	turnin	881
A	accept	905
A	target	+Sergra Darkthorn
A	goto	The Barrens,52.23,31.00
A	turnin	875
A	accept	876
A	target	+Darsok Swiftdagger
A	goto	The Barrens,51.62,30.90
A	isOnQuest	6386
S	
T	label	EcheyakeeTurnin
A	turnin	869
A	accept	3281
A	target	+Gazrog
A	goto	The Barrens,51.93,30.32
A	turnin	881
A	accept	905
A	target	+Sergra Darkthorn
A	goto	The Barrens,52.23,31.00
A	turnin	875
A	accept	876
A	target	+Darsok Swiftdagger
A	goto	The Barrens,51.62,30.90
S	
T	completewith	TheEscapeTurnIn
A	destroy	10327
S	Hunter
A	goto	The Barrens,51.67,29.95
A	collect	2515,1800,888,1 << Hunter
A	target	Barg
S	
T	completewith	TheEscapeTurnIn
A	goto	The Barrens,51.50,30.34
A	fly	Ratchet
A	target	Devrak
A	subzoneskip	392
S	Rogue
A	goto	The Barrens,63.07,36.31
A	turnin	2382
A	accept	2381
A	target	Wrenix the Wretched
S	Rogue
A	goto	The Barrens,63.12,36.32
A	collect	7970,1,888,1
A	collect	5060,1,888,1
S	
A	turnin	863
A	accept	1483
A	target	+Sputtervalve
A	goto	The Barrens,62.98,37.22
A	turnin	896
A	target	+Wharfmaster Dizzywig
A	goto	The Barrens,63.35,38.45
A	isQuestComplete	896
S	
T	label	TheEscapeTurnIn
A	goto	The Barrens,62.98,37.22
A	turnin	863
A	accept	1483
A	target	Sputtervalve
S	
A	goto	The Barrens,62.37,37.62
A	accept	865
A	accept	1069
A	target	Mebok Mizzyrix
S	
A	goto	The Barrens,62.05,39.41
A	vendor	
A	collect	4592,40,888,1
A	collect	1205,20,888,1 << Mage/Warlock/Priest/Shaman/Druid
A	target	Innkeeper Wiley
A	isQuestAvailable	888
S	Rogue
T	completewith	next
A	goto	The Barrens,65.04,45.44
S	Rogue
A	goto	The Barrens,64.95,45.44
A	complete	2381,1
A	use	7970
A	mob	Polly
S	
A	goto	The Barrens,63.58,49.25
A	complete	888,2
S	
A	goto	The Barrens,62.63,49.64
A	complete	888,1
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
A	goto	The Barrens,57.39,52.28,60,0
A	goto	The Barrens,58.04,53.87
A	complete	3281,1
S	
T	completewith	Verog
A	complete	848,1
S	
T	label	TestSeeds
A	goto	The Barrens,55.61,42.75
A	complete	877,1
S	
T	completewith	next
A	goto	The Barrens,52.95,41.75,0
A	complete	851,1
A	mob	Verog the Dervish
A	isOnQuest	851
S	
T	loop	
A	goto	The Barrens,55.80,45.78,0
A	goto	The Barrens,55.80,45.78,50,0
A	goto	The Barrens,56.75,43.41,50,0
A	goto	The Barrens,57.01,41.22,50,0
A	goto	The Barrens,55.45,41.37,50,0
A	goto	The Barrens,54.99,40.84,50,0
A	goto	The Barrens,53.41,40.26,50,0
A	goto	The Barrens,52.99,44.73,50,0
A	goto	The Barrens,54.31,46.81,50,0
A	complete	855,1
A	mob	Kolkar Bloodcharger
A	mob	Kolkar Pack runner
A	mob	Kolkar Marauder
A	isOnQuest	851
S	
T	label	Verog
T	loop	
A	goto	The Barrens,56.75,43.41,0
A	goto	The Barrens,55.80,45.78,50,0
A	goto	The Barrens,56.75,43.41,50,0
A	goto	The Barrens,57.01,41.22,50,0
A	goto	The Barrens,55.45,41.37,50,0
A	goto	The Barrens,54.99,40.84,50,0
A	goto	The Barrens,53.41,40.26,50,0
A	goto	The Barrens,52.99,44.73,50,0
A	goto	The Barrens,54.31,46.81,50,0
A	complete	851,1
A	mob	Verog the Dervish
S	
T	loop	
A	goto	The Barrens,55.72,42.14,0
A	goto	The Barrens,55.72,42.14,30,0
A	goto	The Barrens,55.49,41.75,30,0
A	goto	The Barrens,55.09,41.58,30,0
A	goto	The Barrens,55.03,42.24,30,0
A	goto	The Barrens,55.27,43.17,30,0
A	goto	The Barrens,55.78,43.47,30,0
A	goto	The Barrens,56.15,43.28,30,0
A	goto	The Barrens,56.08,42.58,30,0
A	complete	848,1
S	
T	completewith	LizardHorn
A	complete	821,2
A	mob	Greater Plainstrider
A	mob	Fleeting Plainstrider
A	mob	Ornery Plainstrider
S	
A	goto	The Barrens,52.60,46.10
A	complete	905,1
A	collect	5165,3,905,7,3
A	mob	Sunscale Scytheclaw
S	
A	goto	The Barrens,52.45,46.57
A	complete	905,3
A	collect	5165,3,905,7,3
A	mob	Sunscale Scytheclaw
S	
T	label	Nest
A	goto	The Barrens,52.02,46.47
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
A	goto	The Barrens,49.33,50.33
A	complete	4921,1
A	target	Beaten Corpse
S	
T	label	LizardHorn
T	completewith	SetCampTaurajoHS
A	complete	821,3
A	mob	Stormsnout
S	
T	completewith	next
A	goto	The Barrens,45.23,58.41,120
A	subzoneskip	378
S	
T	label	SetCampTaurajoHS
A	goto	The Barrens,45.58,59.04
A	home	
A	target	Innkeeper Byula
A	bindlocation	378
A	isQuestAvailable	1093
S	
A	goto	The Barrens,44.55,59.27
A	accept	878
A	target	Mangletooth
S	
T	completewith	Xroadsturnins2
A	goto	The Barrens,44.45,59.16
A	fp	Camp Taurajo
A	fly	Crossroads
A	subzoneskip	380
A	target	Omusa Thunderhorn
S	
A	goto	The Barrens,51.44,30.15
A	turnin	848
A	target	Apothecary Helbrim
A	isQuestComplete	848
S	
T	label	Xroadsturnins2
A	turnin	4921
A	target	+Mankrik
A	goto	The Barrens,52.00,31.60
A	turnin	877
A	accept	880
A	target	+Tonga Runetotem
A	goto	The Barrens,52.26,31.93
A	turnin	905
A	accept	3261
A	target	+Sergra Darkthorn
A	goto	The Barrens,52.24,31.01
A	turnin	3281
A	target	+Gazrog
A	goto	The Barrens,51.93,30.32
S	
A	destroy	5165
A	itemcount	5165,1
S	Hunter
A	goto	The Barrens,51.67,29.95
A	collect	2515,1800,888,1 << Hunter
A	target	Barg
S	
A	goto	The Barrens,45.35,28.41
A	turnin	855
A	target	Regthar Deathgate
A	isQuestComplete	855
S	
A	goto	The Barrens,45.35,28.41
A	turnin	851
A	accept	852
A	target	Regthar Deathgate
A	isQuestComplete	851
S	
A	goto	The Barrens,45.35,28.41
A	accept	852
A	target	Regthar Deathgate
A	isQuestTurnedIn	851
S	
T	completewith	next
A	goto	The Barrens,35.26,27.88,100
A	zoneskip	Stonetalon Mountains
S	
T	map	Stonetalon Mountains
A	turnin	1061
A	accept	1062
A	target	+Seereth Stonebreak
A	goto	The Barrens,35.26,27.88
A	accept	6548
A	target	+Makaba Flathoof
A	goto	The Barrens,35.19,27.79
E
G	Guides/SurvivalGuide/H-Classic-Horde-15-23_Barrens.lua
M	hardcore	
M	classic	
M	tbc	
M	selector	Horde
M	name	19-23 Stonetalon/Barrens/Ashenvale
M	version	1
M	group	RestedXP Survival Guide (H)
M	subgroup	RXP Survival Guide 1-20
M	next	23-25 Hillsbrad
S	
T	optional	
T	completewith	next
A	abandon	6541
A	isOnQuest	6541
S	
T	loop	
A	goto	Stonetalon Mountains,80.62,89.99,0
A	goto	Stonetalon Mountains,80.62,89.99,40,0
A	goto	Stonetalon Mountains,79.79,88.75,40,0
A	goto	Stonetalon Mountains,81.19,87.56,40,0
A	goto	Stonetalon Mountains,81.70,86.44,40,0
A	goto	Stonetalon Mountains,82.26,86.10,40,0
A	goto	Stonetalon Mountains,82.55,85.22,40,0
A	goto	Stonetalon Mountains,83.64,85.02,40,0
A	goto	Stonetalon Mountains,84.20,85.20,40,0
A	goto	Stonetalon Mountains,83.80,86.38,40,0
A	goto	Stonetalon Mountains,83.25,87.23,40,0
A	goto	Stonetalon Mountains,82.33,89.73,40,0
A	goto	Stonetalon Mountains,82.33,90.43,40,0
A	goto	Stonetalon Mountains,81.34,90.78,40,0
A	complete	6548,1
A	mob	+Grimtotem Ruffian
A	complete	6548,2
A	mob	+Grimtotem Mercenary
S	
T	map	Stonetalon Mountains
A	goto	The Barrens,35.19,27.79
A	turnin	6548
A	accept	6629
A	target	Makaba Flathoof
S	
T	completewith	next
A	goto	Stonetalon Mountains,75.89,87.49,30
S	
A	goto	Stonetalon Mountains,73.65,86.13
A	complete	6629,1
A	mob	+Grundig Darkcloud
A	complete	6629,2
A	mob	+Grimtotem Brute
S	
A	goto	Stonetalon Mountains,73.48,85.59
A	accept	6523,1
A	target	Kaya Flathoof
S	
A	goto	Stonetalon Mountains,71.82,86.79,40,0
A	goto	Stonetalon Mountains,71.83,89.79,40,0
A	goto	Stonetalon Mountains,76.73,90.85
A	complete	6523,1
A	target	Kaya Flathoof
S	
A	goto	Stonetalon Mountains,71.25,95.02
A	accept	6461
A	target	Xen'Zilla
S	
T	completewith	InDeepTrouble
A	goto	Stonetalon Mountains,68.59,88.34,80,0
A	goto	Stonetalon Mountains,64.95,83.88,80,0
A	goto	Stonetalon Mountains,61.47,81.51,80,0
A	goto	Stonetalon Mountains,60.36,76.28,80,0
A	goto	Stonetalon Mountains,59.04,73.01,80,0
A	goto	Stonetalon Mountains,60.83,71.84,80,0
A	complete	6461,1
A	mob	Deepmoss Creeper
S	
T	completewith	InDeepTrouble
A	goto	Stonetalon Mountains,51.40,61.14,50,0
A	goto	Stonetalon Mountains,49.96,61.04
A	subzone	460
S	
T	completewith	next
A	goto	Stonetalon Mountains,49.38,61.68,20,0
A	goto	Stonetalon Mountains,48.92,62.71,30,0
A	goto	Stonetalon Mountains,48.11,63.88,30,0
A	goto	Stonetalon Mountains,47.21,64.05,30
A	group	
S	
T	label	InDeepTrouble
A	goto	Stonetalon Mountains,47.21,64.05
A	accept	6421
A	target	Mor'Rogal
A	group	
S	
A	goto	Stonetalon Mountains,47.47,62.13
A	vendor	
A	vendor	
A	target	Innkeeper Jayka
A	isQuestAvailable	1093
S	
A	goto	Stonetalon Mountains,47.61,61.58
A	vendor	
A	vendor	
A	target	Jeeda
A	isQuestAvailable	1093
S	
A	goto	Stonetalon Mountains,45.13,59.85
A	fp	Sun Rock Retreat
A	target	Tharm
A	subzoneskip	460,1
S	
T	completewith	next
A	goto	Stonetalon Mountains,58.99,62.60,100
S	
A	goto	Stonetalon Mountains,58.99,62.60
A	turnin	1483
A	accept	1093
A	target	Ziz Fizziks
S	
T	completewith	next
A	complete	6461,2
A	mob	Deepmoss Venomspitter
S	
T	loop	
A	goto	Stonetalon Mountains,61.41,56.77,0
A	goto	Stonetalon Mountains,59.25,61.55,30,0
A	goto	Stonetalon Mountains,60.37,60.10,30,0
A	goto	Stonetalon Mountains,61.34,59.15,30,0
A	goto	Stonetalon Mountains,61.15,57.85,30,0
A	goto	Stonetalon Mountains,61.41,56.77,30,0
A	goto	Stonetalon Mountains,62.21,58.55,30,0
A	goto	Stonetalon Mountains,63.12,60.02,30,0
A	goto	Stonetalon Mountains,64.69,60.03,30,0
A	goto	Stonetalon Mountains,62.76,61.69,30,0
A	goto	Stonetalon Mountains,62.50,62.92,30,0
A	goto	Stonetalon Mountains,62.48,64.15,30,0
A	goto	Stonetalon Mountains,61.85,66.07,30,0
A	goto	Stonetalon Mountains,60.71,66.12,30,0
A	goto	Stonetalon Mountains,60.96,63.99,30,0
A	goto	Stonetalon Mountains,60.25,63.21,30,0
A	complete	1069,1
S	
T	loop	
A	goto	Stonetalon Mountains,60.25,63.21,0
A	goto	Stonetalon Mountains,59.25,61.55,50,0
A	goto	Stonetalon Mountains,60.37,60.10,50,0
A	goto	Stonetalon Mountains,61.34,59.15,50,0
A	goto	Stonetalon Mountains,61.15,57.85,50,0
A	goto	Stonetalon Mountains,61.41,56.77,50,0
A	goto	Stonetalon Mountains,62.21,58.55,50,0
A	goto	Stonetalon Mountains,63.12,60.02,50,0
A	goto	Stonetalon Mountains,64.69,60.03,50,0
A	goto	Stonetalon Mountains,62.76,61.69,50,0
A	goto	Stonetalon Mountains,62.50,62.92,50,0
A	goto	Stonetalon Mountains,62.48,64.15,50,0
A	goto	Stonetalon Mountains,61.85,66.07,50,0
A	goto	Stonetalon Mountains,60.71,66.12,50,0
A	goto	Stonetalon Mountains,60.96,63.99,50,0
A	goto	Stonetalon Mountains,60.25,63.21,50,0
A	complete	6461,2
A	mob	Deepmoss Venomspitter
S	Troll Warrior/Undead Warrior
A	goto	Stonetalon Mountains,58.22,51.74
A	collect	928,1,899,1
A	money	<0.9860
A	target	Veenix
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.2
S	Troll Warrior/Undead Warrior
T	optional	
T	completewith	BluePrints
A	use	928
A	itemcount	928,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.2
A	xp	<20,1
S	Orc Warrior
A	goto	Stonetalon Mountains,58.22,51.74
A	collect	926,1,899,1
A	money	<0.9784
A	target	Veenix
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.3
S	Orc Warrior
T	optional	
T	completewith	BluePrints
A	use	926
A	itemcount	926,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.3
A	xp	<20,1
S	Tauren Warrior
A	goto	Stonetalon Mountains,58.22,51.74
A	collect	924,1,899,1
A	money	<1.0972
A	target	Veenix
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<16.0
S	Tauren Warrior
T	optional	
T	completewith	BluePrints
A	use	924
A	itemcount	924,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<16.0
A	xp	<21,1
S	Shaman
A	goto	Stonetalon Mountains,58.22,51.74
A	collect	928,1,899,1
A	money	<0.9860
A	target	Veenix
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.2
S	Shaman
T	optional	
T	completewith	BluePrints
A	use	928
A	itemcount	928,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.2
A	xp	<20,1
S	Rogue
A	goto	Stonetalon Mountains,58.22,51.74
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
T	completewith	next
A	complete	1062,1
A	mob	Venture Co. Logger
S	
T	label	BluePrints
T	loop	
A	goto	Stonetalon Mountains,62.8,53.7,0
A	goto	Stonetalon Mountains,62.8,53.7,100,0
A	goto	Stonetalon Mountains,61.7,51.5,100,0
A	goto	Stonetalon Mountains,66.8,45.3,100,0
A	goto	Stonetalon Mountains,71.7,49.9,100,0
A	goto	Stonetalon Mountains,74.3,54.7,100,0
A	complete	1093,1
A	mob	Venture Co. Operator
S	
T	loop	
A	goto	Stonetalon Mountains,61.50,55.12,0
A	goto	Stonetalon Mountains,61.50,55.12,50,0
A	goto	Stonetalon Mountains,60.48,55.10,50,0
A	goto	Stonetalon Mountains,59.80,53.69,50,0
A	goto	Stonetalon Mountains,59.53,52.52,50,0
A	goto	Stonetalon Mountains,60.80,51.23,50,0
A	goto	Stonetalon Mountains,62.06,54.39,50,0
A	goto	Stonetalon Mountains,62.63,55.35,50,0
A	goto	Stonetalon Mountains,63.63,54.42,50,0
A	goto	Stonetalon Mountains,65.42,54.15,50,0
A	goto	Stonetalon Mountains,66.83,54.92,50,0
A	goto	Stonetalon Mountains,68.64,54.03,50,0
A	goto	Stonetalon Mountains,69.86,53.53,50,0
A	goto	Stonetalon Mountains,70.34,56.41,50,0
A	goto	Stonetalon Mountains,67.90,56.96,50,0
A	goto	Stonetalon Mountains,66.25,56.64,50,0
A	goto	Stonetalon Mountains,65.29,57.14,50,0
A	goto	Stonetalon Mountains,64.27,57.63,50,0
A	complete	1062,1
A	mob	Venture Co. Logger
S	
T	completewith	next
S	
A	goto	Stonetalon Mountains,58.99,62.60
A	turnin	1093
A	accept	1094
A	target	Ziz Fizziks
S	
T	loop	
A	goto	Stonetalon Mountains,68.59,88.34,0
A	goto	Stonetalon Mountains,60.83,71.84,80,0
A	goto	Stonetalon Mountains,59.04,73.01,80,0
A	goto	Stonetalon Mountains,60.36,76.28,80,0
A	goto	Stonetalon Mountains,61.47,81.51,80,0
A	goto	Stonetalon Mountains,64.95,83.88,80,0
A	goto	Stonetalon Mountains,68.59,88.34,80,0
A	complete	6461,1
A	mob	Deepmoss Creeper
S	Druid
T	completewith	DruidTraining2
A	cast	18960
A	zoneskip	Moonglade
S	Druid
T	optional	
A	goto	Moonglade,52.53,40.58
A	train	1430
A	target	Loganaar
A	xp	<18,1
A	xp	>20,1
S	Druid
T	label	DruidTraining2
A	goto	Moonglade,52.53,40.58
A	train	768
A	target	Loganaar
A	xp	<20,1
S	
T	completewith	next
A	hs	
A	use	6948
A	bindlocation	378,1
A	subzoneskip	378
S	
A	goto	The Barrens,45.58,59.03
A	vendor	
A	vendor	
A	target	Innkeeper Byula
A	isOnQuest	3261
S	
A	goto	The Barrens,44.85,59.14
A	turnin	3261
A	accept	882
A	target	Jorn Skyseer
S	
T	completewith	LakotaMani
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
T	label	LakotaMani
T	loop	
A	goto	The Barrens,45.14,52.82,0
A	goto	The Barrens,45.93,49.08,0
A	goto	The Barrens,47.43,51.37,0
A	goto	The Barrens,50.10,53.34,0
A	goto	The Barrens,45.14,52.82,80,0
A	goto	The Barrens,45.93,49.08,80,0
A	goto	The Barrens,47.43,51.37,80,0
A	goto	The Barrens,50.10,53.34,80,0
A	collect	5099,1,883,1
A	accept	883
A	use	5099
A	unitscan	Lakota'mani
S	
T	completewith	next
A	complete	821,3
A	mob	Stormsnout
S	
T	loop	
A	goto	The Barrens,50.71,54.60,0
A	goto	The Barrens,50.71,54.60,60,0
A	goto	The Barrens,50.74,55.33,60,0
A	goto	The Barrens,50.73,56.78,60,0
A	goto	The Barrens,50.42,57.23,60,0
A	goto	The Barrens,50.50,57.65,60,0
A	goto	The Barrens,50.87,57.50,60,0
A	goto	The Barrens,51.26,57.84,60,0
A	goto	The Barrens,51.74,57.69,60,0
A	goto	The Barrens,51.79,57.10,60,0
A	goto	The Barrens,53.08,54.69,60,0
A	goto	The Barrens,53.65,54.27,60,0
A	goto	The Barrens,53.63,53.53,60,0
A	goto	The Barrens,53.35,52.72,60,0
A	goto	The Barrens,53.00,51.83,60,0
A	goto	The Barrens,52.62,52.19,60,0
A	goto	The Barrens,52.59,52.71,60,0
A	goto	The Barrens,52.41,53.07,60,0
A	goto	The Barrens,52.32,53.71,60,0
A	goto	The Barrens,51.39,54.22,60,0
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
T	loop	
A	goto	The Barrens,50.88,52.96,0
A	goto	The Barrens,50.88,52.96,50,0
A	goto	The Barrens,50.06,52.78,50,0
A	goto	The Barrens,49.35,53.74,50,0
A	goto	The Barrens,49.54,55.08,50,0
A	goto	The Barrens,49.03,56.24,50,0
A	goto	The Barrens,49.72,56.13,50,0
A	complete	821,3
A	mob	Stormsnout
S	
T	completewith	next
A	complete	865,1
A	mob	Sunscale Scytheclaw
S	
T	loop	
A	goto	The Barrens,53.98,51.68,0
A	goto	The Barrens,53.98,51.68,50,0
A	goto	The Barrens,54.10,50.58,50,0
A	goto	The Barrens,53.85,49.76,50,0
A	goto	The Barrens,54.32,49.38,50,0
A	goto	The Barrens,54.82,49.00,50,0
A	goto	The Barrens,55.23,47.96,50,0
A	complete	821,2
A	mob	Greater Plainstrider
S	
T	loop	
A	goto	The Barrens,57.3,53.7,0
A	goto	The Barrens,52.0,46.5,0
A	goto	The Barrens,57.3,53.7,90,0
A	goto	The Barrens,52.0,46.5,90,0
A	complete	865,1
A	mob	Sunscale Scytheclaw
S	
T	loop	
A	goto	The Barrens,55.59,43.39,0
A	goto	The Barrens,55.59,43.39,40,0
A	goto	The Barrens,55.09,43.00,40,0
A	goto	The Barrens,55.03,42.21,40,0
A	goto	The Barrens,55.47,41.51,40,0
A	goto	The Barrens,55.99,42.00,40,0
A	goto	The Barrens,56.15,42.53,40,0
A	goto	The Barrens,56.01,43.40,40,0
A	complete	880,1
A	mob	Oasis Snapjaw
S	
T	completewith	next
A	collect	10338,1
A	mob	Zhevra Charger
S	
A	goto	The Barrens,59.71,30.33
A	use	10338
A	complete	882,1
A	mob	Ishamuhale
S	
T	completewith	BootyTurnin
A	subzone	392
S	Rogue
A	goto	The Barrens,63.07,36.31
A	turnin	2381
A	target	Wrenix the Wretched
S	
T	label	BootyTurnin
A	goto	The Barrens,62.68,36.23
A	turnin	888
A	target	Gazlowe
S	
A	turnin	1094
A	accept	1095
A	target	+Sputtervalve
A	goto	The Barrens,62.98,37.22
A	turnin	865
A	turnin	1069
A	accept	1491
A	target	+Mebok Mizzyrix
A	goto	The Barrens,62.37,37.62
A	turnin	821
A	accept	822
A	target	+Brewmaster Drohn
A	goto	The Barrens,62.27,38.39
A	dungeon	WC
S	
A	turnin	1094
A	accept	1095
A	target	+Sputtervalve
A	goto	The Barrens,62.98,37.22
A	turnin	865
A	turnin	1069
A	target	+Mebok Mizzyrix
A	goto	The Barrens,62.37,37.62
A	turnin	821
A	accept	822
A	target	+Brewmaster Drohn
A	goto	The Barrens,62.27,38.39
S	Warrior
A	goto	The Barrens,62.20,38.41
A	vendor	
A	target	Grazlix
A	money	<0.619
A	itemStat	7,ITEM_MOD_ARMOR_SHORT,<155
A	equip	7,4800
S	Rogue/Hunter/Warrior/Shaman/Druid
A	goto	The Barrens,62.16,38.45
A	vendor	
A	target	Vexspindle
A	money	<0.3515
A	itemStat	9,ITEM_MOD_ARMOR_SHORT,<37
A	equip	9,4794
S	
A	goto	The Barrens,62.05,39.41
A	home	
A	target	Innkeeper Wiley
A	bindlocation	392
A	isQuestAvailable	959
A	dungeon	WC
S	Warrior
T	optional	
T	completewith	FlytoXroads
A	use	4800
A	itemcount	4800,1
A	itemStat	7,ITEM_MOD_ARMOR_SHORT,<155
A	equip	7,4800
S	Rogue/Hunter/Warrior/Shaman/Druid
T	optional	
T	completewith	FlytoXroads
A	use	4794
A	itemcount	4794,1
A	itemStat	9,ITEM_MOD_ARMOR_SHORT,<37
A	equip	9,4794
S	
A	goto	The Barrens,63.09,37.61
A	accept	959
A	target	Crane Operator Bigglefuzz
A	dungeon	WC
S	
T	label	FlytoXroads
T	completewith	XroadsHS2
A	goto	The Barrens,63.09,37.16
A	fly	Crossroads
A	target	Bragok
A	subzoneskip	380
S	
A	turnin	899
A	target	+Mankrik
A	goto	The Barrens,51.95,31.58
A	turnin	880
A	accept	1489
A	accept	3301
A	target	+Tonga Runetotem
A	goto	The Barrens,52.26,31.93
S	
A	destroy	5085
A	itemcount	5085,1
S	
T	label	XroadsHS2
A	goto	The Barrens,51.99,29.89
A	home	
A	vendor	
A	vendor	
A	target	Innkeeper Boorand Plainswind
A	bindlocation	380
A	dungeon	!WC
S	Shaman
T	completewith	next
A	goto	The Barrens,51.50,30.34
A	fly	Orgrimmar
A	zoneskip	Orgrimmar
A	target	Devrak
S	Shaman
A	goto	Orgrimmar,37.96,37.73
A	accept	1528
A	target	Searn Firewarder
S	Shaman
A	goto	Orgrimmar,38.82,36.41
A	train	2645
A	target	Kardris Dreamseeker
S	Warlock
T	completewith	next
A	goto	The Barrens,51.50,30.34
A	fly	Orgrimmar
A	zoneskip	Orgrimmar
A	target	Devrak
S	Warlock
A	goto	Orgrimmar,48.25,45.27
A	trainer	
A	accept	1507
A	target	Gan'rul Bloodeye
S	Warlock
A	goto	Orgrimmar,47.54,46.75
A	collect	16346,1,1507,1
A	target	Kurgul
S	Warlock
A	goto	Orgrimmar,47.05,46.47
A	turnin	1507
A	accept	1508
A	target	Cazul
S	Warlock
A	goto	Orgrimmar,44.16,48.45
A	collect	5210,1,1507,1
A	money	<0.5808
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<17.4
A	target	Katis
S	Warlock
A	goto	Orgrimmar,37.03,59.48
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
A	goto	Orgrimmar,38.82,36.41
A	train	8052
A	target	Kardris Dreamseeker
A	xp	<18,1
A	xp	>20,1
A	dungeon	DM
S	Shaman
T	optional	
A	goto	Orgrimmar,38.82,36.41
A	train	2645
A	target	Kardris Dreamseeker
A	xp	<20,1
A	dungeon	DM
S	Hunter
A	goto	Orgrimmar,66.05,18.52
A	train	14318
A	target	Ormak Grimshot
A	xp	<18,1
A	xp	>20,1
A	dungeon	DM
S	Hunter
T	optional	
A	goto	Orgrimmar,66.05,18.52
A	train	14290
A	target	Ormak Grimshot
A	xp	<20,1
A	dungeon	DM
S	Hunter
A	goto	Orgrimmar,66.33,14.83
A	train	5118
A	target	Xao'tsu
A	xp	<20,1
A	dungeon	DM
S	Warrior
A	goto	Orgrimmar,79.91,31.36
A	train	8198
A	target	Grezz Ragefist
A	xp	<18,1
A	xp	>20,1
A	dungeon	DM
S	Warrior
T	optional	
A	goto	Orgrimmar,79.91,31.36
A	train	845
A	target	Grezz Ragefist
A	xp	<20,1
A	dungeon	DM
S	Rogue
A	goto	Orgrimmar,43.90,54.65
A	train	1943
A	target	Ormok
A	xp	<20,1
A	dungeon	DM
S	Warlock
A	goto	Undercity,48.47,45.42
A	train	1014
A	target	Zevrost
A	xp	<18,1
A	xp	>20,1
A	dungeon	DM
S	Warlock
T	optional	
A	goto	Undercity,48.47,45.42
A	train	706
A	target	Zevrost
A	xp	<20,1
A	dungeon	DM
S	Mage
A	goto	Orgrimmar,38.36,85.54
A	train	3140
A	target	Pephredo
A	xp	<18,1
A	xp	>20,1
A	dungeon	DM
S	Mage
T	optional	
A	goto	Orgrimmar,38.36,85.54
A	train	1953
A	target	Pephredo
A	xp	<20,1
A	dungeon	DM
S	Priest
A	goto	Orgrimmar,35.59,87.80
A	train	970
A	target	Ur'kyo
A	xp	<18,1
A	xp	>20,1
A	dungeon	DM
S	Priest
T	optional	
A	goto	Orgrimmar,35.59,87.80
A	train	14914
A	target	Ur'kyo
A	xp	<20,1
A	dungeon	DM
S	
T	ah	
A	goto	Orgrimmar,55.59,62.92
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
A	goto	Durotar,50.8,13.8,40
A	zone	Stranglethorn Vale
A	zoneskip	Stranglethorn Vale
A	dungeon	DM
S	
A	goto	Stranglethorn Vale,30.51,29.10,40,0
A	goto	Stranglethorn Vale,27.09,31.27,40,0
A	goto	Stranglethorn Vale,22.90,31.17,60,0
A	goto	Stranglethorn Vale,19.06,27.00,60,0
A	goto	Stranglethorn Vale,16.33,23.46,60,0
A	goto	Stranglethorn Vale,13.49,19.04,60,0
A	goto	Westfall,41.08,98.55,60,0
A	goto	Westfall,37.10,89.16,40,0
A	goto	Westfall,30.01,86.02,200
A	dungeon	DM
S	
T	completewith	next
A	goto	Westfall,30.01,86.02,40
A	dungeon	DM
S	
A	goto	Westfall,30.01,86.02
A	accept	103
A	target	Captain Grayson
A	itemcount	814,5
A	dungeon	DM
S	
A	goto	Westfall,30.01,86.02
A	turnin	103
A	itemcount	814,5
A	target	Captain Grayson
A	dungeon	DM
S	
A	goto	Westfall,30.01,86.02
A	accept	104
A	target	Captain Grayson
A	dungeon	DM
S	
A	goto	Westfall,34.43,83.93
A	line	Westfall,34.43,83.93,34.43,83.93,33.88,83.32,33.08,82.86,32.56,82.71,32.08,82.49,31.91,82.36,31.55,81.88,30.86,81.42,30.63,81.16,30.33,80.81,30.02,80.11,29.68,79.22,29.32,78.19,29.29,77.60,29.27,77.31,29.18,76.26,29.07,75.29,28.95,74.14,28.85,73.29,28.79,72.48,28.37,71.94,27.84,71.29,27.44,70.25,27.29,69.47,27.13,68.65,27.09,67.57,27.07,67.01,26.74,66.09,27.07,67.01,27.09,67.57,27.13,68.65,27.29,69.47,27.44,70.25,27.84,71.29,28.37,71.94,28.79,72.48,28.85,73.29,28.95,74.14,29.07,75.29,29.18,76.26,29.27,77.31,29.29,77.60,29.32,78.19,29.68,79.22,30.02,80.11,30.33,80.81,30.63,81.16,30.86,81.42,31.55,81.88,31.91,82.36,32.08,82.49,32.56,82.71,33.08,82.86,33.88,83.32,34.43,83.93
A	complete	104,1
A	unitscan	Old Murk-Eye
A	dungeon	DM
S	
A	goto	Westfall,30.01,86.02
A	turnin	104
A	target	Captain Grayson
A	dungeon	DM
S	
T	optional	
A	abandon	103
A	dungeon	DM
S	
T	label	EnterDM
A	goto	Eastern Kingdoms,40.92,81.97,8,0
A	goto	Eastern Kingdoms,40.92,82.02,8,0
A	goto	Eastern Kingdoms,40.89,82.04,8,0
A	goto	Eastern Kingdoms,40.96,82.10,8,0
A	goto	Eastern Kingdoms,40.92,82.16,15,0
A	goto	Eastern Kingdoms,40.82,82.30,15,0
A	goto	Eastern Kingdoms,40.77,82.52,15,0
A	goto	Eastern Kingdoms,40.74,82.61,15,0
A	goto	Eastern Kingdoms,40.63,82.49,15,0
A	goto	Eastern Kingdoms,40.50,82.45
A	zone	291
A	dungeon	DM
S	
A	hs	
A	zone	The Barrens
A	use	6948
A	dungeon	DM
S	
T	optional	
A	goto	The Barrens,62.05,39.41
A	vendor	
A	vendor	
A	target	Innkeeper Wiley
A	subzoneskip	392,1
A	dungeon	WC
S	
T	optional	
A	goto	The Barrens,51.99,29.89
A	vendor	
A	vendor	
A	target	Innkeeper Boorand Plainswind
A	subzoneskip	380,1
A	dungeon	DM
S	Warlock
T	optional	
T	completewith	TurninDogran
A	goto	The Barrens,63.09,37.16
A	fly	Crossroads
A	target	Bragok
A	subzoneskip	392,1
A	dungeon	WC
S	Warlock
T	completewith	TurninDogran
A	goto	Orgrimmar,45.13,63.89
A	fly	Crossroads
A	zoneskip	Orgrimmar,1
A	target	Doras
S	Warlock
T	label	TurninDogran
A	goto	The Barrens,51.93,30.32
A	turnin	1509
A	accept	1510
A	target	Gazrog
S	Shaman
T	optional	
T	completewith	CallofWater01
A	goto	Orgrimmar,45.13,63.89
A	fly	Ratchet
A	target	Doras
A	zoneskip	Orgrimmar,1
S	Shaman
T	optional	
T	completewith	CallofWater01
A	goto	The Barrens,63.09,37.16
A	fly	Ratchet
A	target	Bragok
A	subzoneskip	392,1
A	dungeon	DM
S	Shaman
T	label	CallofWater01
A	goto	The Barrens,65.83,43.78
A	turnin	1528
A	accept	1530
A	target	Islen Waterseer
S	Shaman
T	completewith	next
A	goto	The Barrens,63.09,37.16
A	fly	Crossroads
A	target	Bragok
A	subzoneskip	380
S	!Shaman
T	completewith	next
A	goto	The Barrens,63.09,37.16
A	fly	Crossroads
A	target	Bragok
A	subzoneskip	392,1
S	
A	goto	The Barrens,51.44,30.15
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
A	goto	The Barrens,63.09,37.16
A	fly	Camp Taurajo
A	target	Bragok
A	subzoneskip	392,1
A	dungeon	WC
S	Shaman
T	completewith	TribesTurnin
A	goto	The Barrens,63.09,37.16
A	fly	Camp Taurajo
A	subzoneskip	378
A	target	Bragok
S	!Shaman
T	completewith	TribesTurnin
A	goto	The Barrens,51.50,30.34
A	fly	Camp Taurajo
A	target	Devrak
A	subzoneskip	380,1
S	
A	goto	The Barrens,44.55,59.27
A	collect	5075,1,5052,1
A	mob	Bristleback Water Seeker
A	mob	Bristleback Thornweaver
A	mob	Bristleback Geomancer
S	
T	label	TribesTurnin
A	goto	The Barrens,44.55,59.27
A	turnin	878
A	accept	5052
A	turnin	5052
A	target	Mangletooth
A	addquestitem	5075,5052
S	
T	optional	
T	completewith	Thunderhawk
A	goto	The Barrens,44.55,59.27,0
A	target	Mangletooth
S	
T	label	IshamuhaleTurnin
A	goto	The Barrens,44.85,59.14
A	turnin	882
A	accept	907
A	target	Jorn Skyseer
S	
A	goto	The Barrens,44.85,59.14
A	accept	883
A	turnin	883
A	target	Jorn Skyseer
A	itemcount	5099,1
S	
T	loop	
A	goto	The Barrens,44.32,60.84,0
A	goto	The Barrens,44.32,60.84,60,0
A	goto	The Barrens,44.25,61.78,60,0
A	goto	The Barrens,44.07,62.63,60,0
A	goto	The Barrens,44.52,63.10,60,0
A	goto	The Barrens,45.67,63.59,60,0
A	goto	The Barrens,46.94,62.21,60,0
A	goto	The Barrens,47.42,60.57,60,0
A	goto	The Barrens,47.92,60.55,60,0
A	goto	The Barrens,48.32,60.23,60,0
A	goto	The Barrens,49.14,61.07,60,0
A	goto	The Barrens,49.85,61.13,60,0
A	goto	The Barrens,49.63,59.75,60,0
A	goto	The Barrens,49.21,59.33,60,0
A	goto	The Barrens,48.12,58.59,60,0
A	complete	907,1
A	mob	Thunderhead
A	mob	Stormsnout
S	
T	label	Thunderhawk
A	goto	The Barrens,44.85,59.14
A	turnin	907
A	accept	913
A	target	Jorn Skyseer
S	Shaman
T	completewith	CallofWater2
A	goto	The Barrens,43.42,77.41,60
S	Shaman
T	completewith	next
A	complete	913,1
A	mob	Thunderhawk Hatchling
A	mob	Thunderhawk Cloudscraper
A	mob	Greater Thunderhawk
S	Shaman
T	label	CallofWater2
A	goto	The Barrens,43.42,77.41
A	turnin	1530
A	accept	1535
A	target	Brine
S	Shaman
A	goto	The Barrens,44.22,76.75
A	use	7766
A	complete	1535,1
S	Shaman
A	goto	The Barrens,43.42,77.41
A	turnin	1535
A	accept	1536
A	target	Brine
S	Shaman
T	completewith	ThunderhawkTurnin
A	goto	The Barrens,44.85,59.14,200
S	
T	loop	
A	goto	The Barrens,44.83,63.12,0
A	goto	The Barrens,44.83,63.12,60,0
A	goto	The Barrens,46.57,61.33,60,0
A	goto	The Barrens,48.99,58.69,60,0
A	goto	The Barrens,45.45,56.69,60,0
A	goto	The Barrens,43.41,56.96,60,0
A	complete	913,1
A	mob	Thunderhawk Hatchling
A	mob	Thunderhawk Cloudscraper
S	
T	label	ThunderhawkTurnin
A	goto	The Barrens,44.85,59.14
A	turnin	913
A	accept	874
A	target	Jorn Skyseer
S	!Tauren
A	aura	16618
A	itemcount	5075,10
A	target	Mangletooth
S	!Tauren
T	completewith	next
A	goto	Mulgore,68.68,60.34,120,0
A	zone	Mulgore
S	!Tauren
T	completewith	DeathDUPpickup
A	goto	Thunder Bluff,31.78,65.92
A	zone	Thunder Bluff
S	Tauren
T	completewith	DeathDUPpickup
A	goto	The Barrens,44.45,59.16
A	fly	Thunder Bluff
A	target	Omusa Thunderhorn
S	Undead Warrior/Orc Warrior/Troll Warrior
A	goto	Thunder Bluff,40.93,62.73
A	train	199
A	train	227
A	target	Ansekhwa
S	Troll Hunter/Orc Hunter/Undead Warrior/Warlock/Priest
A	goto	Thunder Bluff,40.93,62.73
A	train	227
A	target	Ansekhwa
S	Rogue
A	goto	Thunder Bluff,40.93,62.73
A	train	198
A	target	Ansekhwa
S	Rogue
A	goto	Thunder Bluff,38.95,64.62
A	collect	3137,200,6544,1
A	target	Kuruk
S	
A	goto	Thunder Bluff,47.12,57.88
A	bankdeposit	5075
A	target	Chesmu
S	
A	goto	Thunder Bluff,45.83,64.74
A	home	
A	target	Innkeeper Pala
A	bindlocation	1638
A	dungeon	!WC
S	
T	completewith	next
A	goto	Thunder Bluff,28.14,32.97,40,0
A	goto	Thunder Bluff,28.51,28.95,10
S	
T	sticky	
T	completewith	DeathDUPpickup
A	goto	Thunder Bluff,28.55,25.64
A	accept	264
A	target	Clarice Foster
A	dungeon	!WC
S	
A	goto	Thunder Bluff,22.82,20.88
A	turnin	853
A	accept	962
A	target	Apothecary Zamah
A	isOnQuest	853
A	dungeon	WC
S	
T	optional	
A	goto	Thunder Bluff,22.82,20.88
A	accept	962
A	target	Apothecary Zamah
A	dungeon	WC
S	
T	optional	
T	label	ZamahTurnin
A	goto	Thunder Bluff,22.82,20.88
A	turnin	853
A	target	Apothecary Zamah
A	isOnQuest	853
S	Priest
A	goto	Thunder Bluff,25.31,15.24
A	accept	5644
A	accept	5642
A	trainer	
A	target	Miles Welsh
S	Mage
A	goto	Thunder Bluff,22.74,14.48
A	train	12051
A	target	Archmage Shymm
A	xp	<20,1
A	xp	>22,1
S	Mage
T	optional	
A	goto	Thunder Bluff,22.74,14.48
A	train	2138
A	target	Archmage Shymm
A	xp	<22,1
S	
T	optional	
T	label	DeathDUPpickup
S	Shaman
A	goto	Thunder Bluff,23.64,18.74
A	train	2645
A	target	Tigor Skychaser
A	xp	<20,1
A	xp	>22,1
S	Shaman
T	optional	
A	goto	Thunder Bluff,23.64,18.74
A	train	8498
A	target	Tigor Skychaser
A	xp	<22,1
S	
T	completewith	next
A	skill	firstaid,80
A	skill	firstaid,<1,1
S	
A	goto	Thunder Bluff,29.68,21.19
A	train	3277
A	train	7934
A	target	Pand Stonebinder
A	skill	firstaid,<1,1
S	Rogue
A	collect	6452,1
A	itemcount	1475,1
S	
T	completewith	next
A	goto	Thunder Bluff,69.88,30.90,80
S	
A	goto	Thunder Bluff,78.61,28.55
A	turnin	1489
A	accept	1490
A	target	Arch Druid Hamuul Runetotem
S	
A	goto	Thunder Bluff,75.65,31.57
A	turnin	1490
A	accept	914
A	target	Nara Wildmane
A	dungeon	WC
S	
A	goto	Thunder Bluff,75.65,31.57
A	turnin	1490
A	target	Nara Wildmane
S	Druid
A	goto	Thunder Bluff,76.48,27.25
A	trainer	
A	accept	27
A	target	Turak Runetotem
S	Druid
T	completewith	next
A	cast	18960
A	zoneskip	Moonglade
S	Druid
A	goto	Moonglade,56.21,30.64
A	turnin	27
A	accept	28
A	target	Dendrite Starblaze
S	Druid
T	completewith	next
A	goto	Moonglade,54.30,55.68
A	collect	15877,1,28,1
S	Druid
A	goto	Moonglade,36.40,42.01
A	cast	19719
A	complete	28,1
A	use	15877
S	Druid
A	goto	Moonglade,36.52,40.10
A	turnin	28
A	accept	30
A	target	Tajarri
S	Druid
T	completewith	FlyXroads2
A	hs	
A	use	6948
A	cooldown	item,6948,>0
A	dungeon	!WC
S	Druid
T	completewith	FlyXroads2
A	goto	Moonglade,44.29,45.88
A	fly	Thunder Bluff
A	target	Bunthen Plainswind
A	zoneskip	Thunder Bluff
A	dungeon	WC
S	Druid
T	completewith	FlyXroads2
A	goto	Moonglade,44.29,45.88
A	fly	Thunder Bluff
A	target	Bunthen Plainswind
A	cooldown	item,6948,<0
A	zoneskip	Thunder Bluff
A	dungeon	!WC
S	Hunter
T	completewith	HunterTraining2
A	goto	Thunder Bluff,61.31,78.25,60
S	Hunter
A	goto	Thunder Bluff,59.13,86.91
A	train	5118
A	target	Urek Thunderhorn
A	xp	<20,1
A	xp	>22,1
S	Hunter
T	label	HunterTraining2
T	optional	
A	goto	Thunder Bluff,59.13,86.91
A	train	5118
A	target	Urek Thunderhorn
A	xp	<22,1
S	Hunter
A	goto	Thunder Bluff,54.07,84.02
A	train	24494
A	target	Hesuwa Thunderhorn
S	Warrior
T	completewith	next
A	goto	Thunder Bluff,61.31,78.25,60
S	Warrior
A	goto	Thunder Bluff,57.27,87.34
A	train	845
A	accept	1823
A	target	Torm Ragetotem
S	Rogue
A	goto	Thunder Bluff,53.00,56.63
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
T	completewith	next
T	ah	
S	Warrior
A	goto	Thunder Bluff,53.21,58.25
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
S	Shaman
A	goto	Thunder Bluff,53.21,58.25
A	collect	928,1,493,1
A	money	<0.9860
A	target	Etu Ragetotem
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.2
S	Shaman
T	optional	
T	completewith	KayaLives
A	use	928
A	itemcount	928,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.2
S	Shaman
T	season	2
A	goto	Thunder Bluff,53.21,58.25
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
S	Hunter
A	goto	Thunder Bluff,46.98,45.69
A	collect	3027,1,493,1
A	money	<0.5643
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.1
A	target	Kuna Thunderhorn
S	Hunter
T	optional	
T	completewith	KayaLives
A	use	3027
A	itemcount	3027,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.1
S	Hunter
A	goto	Thunder Bluff,46.98,45.69
A	collect	2515,1600,493,1 << Hunter
A	target	Kuna Thunderhorn
S	
T	sticky	
T	completewith	EnterWC
A	subzone	718
A	dungeon	WC
S	
T	label	FlyXroads2
A	goto	Thunder Bluff,47.00,49.82
A	fly	Crossroads
A	target	Tal
A	zoneskip	The Barrens
S	
T	completewith	next
A	goto	The Barrens,45.66,40.34,120
A	isQuestTurnedIn	851
S	
T	loop	
A	goto	The Barrens,45.64,38.16,0
A	goto	The Barrens,45.64,38.16,50,0
A	goto	The Barrens,45.84,37.86,50,0
A	goto	The Barrens,45.78,37.41,50,0
A	goto	The Barrens,45.95,37.11,50,0
A	goto	The Barrens,45.93,36.91,50,0
A	goto	The Barrens,46.14,36.85,50,0
A	goto	The Barrens,46.19,36.88,50,0
A	goto	The Barrens,46.28,36.86,50,0
A	goto	The Barrens,46.46,37.17,50,0
A	goto	The Barrens,46.58,37.31,50,0
A	goto	The Barrens,46.63,37.93,50,0
A	goto	The Barrens,46.75,38.39,50,0
A	goto	The Barrens,47.27,38.98,50,0
A	goto	The Barrens,47.47,39.27,50,0
A	goto	The Barrens,48.20,39.57,50,0
A	goto	The Barrens,48.40,39.58,50,0
A	goto	The Barrens,48.60,39.51,50,0
A	goto	The Barrens,48.54,39.96,50,0
A	goto	The Barrens,48.58,40.52,50,0
A	goto	The Barrens,48.27,40.82,50,0
A	goto	The Barrens,48.06,40.82,50,0
A	goto	The Barrens,47.86,41.13,50,0
A	goto	The Barrens,47.49,41.33,50,0
A	goto	The Barrens,47.34,41.61,50,0
A	goto	The Barrens,47.22,41.64,50,0
A	goto	The Barrens,46.85,42.05,50,0
A	goto	The Barrens,46.56,41.93,50,0
A	goto	The Barrens,46.27,41.76,50,0
A	goto	The Barrens,46.03,41.15,50,0
A	goto	The Barrens,45.86,41.32,50,0
A	goto	The Barrens,46.09,40.98,50,0
A	goto	The Barrens,46.08,40.68,50,0
A	goto	The Barrens,45.71,40.56,50,0
A	complete	852,1
A	unitscan	Hezrul Bloodmark
A	isQuestTurnedIn	851
S	
A	goto	The Barrens,46.15,36.93,100
A	isOnQuest	914
A	dungeon	WC
S	
T	completewith	next
A	goto	The Barrens,46.95,35.18,0
A	goto	The Barrens,46.95,35.18,30,0
A	goto	The Barrens,46.83,34.74,20,0
A	goto	Kalimdor,51.98,55.36,20,0
A	goto	Kalimdor,51.89,55.55,10,0
A	goto	Kalimdor,51.87,55.50,10
A	dungeon	WC
S	
A	accept	1486
A	target	+Nalpak
A	goto	Kalimdor,51.91,55.42
A	accept	1487
A	goto	Kalimdor,51.92,55.44
A	target	+Ebru
A	dungeon	WC
S	
T	optional	
T	completewith	EnterWC
A	complete	962,1
A	skill	herbalism,<1,1
A	isOnQuest	962
A	dungeon	WC
S	
T	completewith	EnterWC
A	complete	962,1
A	skill	herbalism,1,1
A	isOnQuest	962
A	dungeon	WC
S	
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
A	goto	Kalimdor,51.97,55.23,0
A	goto	Kalimdor,51.82,54.86,0
A	goto	Kalimdor,52.01,55.02,0
A	goto	Kalimdor,52.15,55.15,0
A	goto	Kalimdor,51.97,55.23,30,0
A	goto	Kalimdor,51.82,54.86,30,0
A	goto	Kalimdor,52.01,55.02,30,0
A	goto	Kalimdor,52.15,55.15,30,0
A	complete	959,1
A	mob	Mad Magglish
A	isOnQuest	959
A	dungeon	WC
S	
T	label	EnterWC
A	goto	Kalimdor,51.89,54.77,20,0
A	goto	Kalimdor,51.95,54.56,20,0
A	goto	Kalimdor,52.27,54.65,30,0
A	goto	Kalimdor,52.40,55.20,30
A	dungeon	WC
S	
T	optional	
T	completewith	GlowingShard
A	complete	962,1
A	skill	herbalism,<1,1
A	isOnQuest	962
A	dungeon	WC
S	
T	optional	
T	completewith	GlowingShard
A	complete	962,1
A	skill	herbalism,1,1
A	isOnQuest	962
A	dungeon	WC
S	
T	optional	
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
T	completewith	Ectoplasms
A	complete	962,1
A	skill	herbalism,<1,1
A	isOnQuest	962
A	dungeon	WC
S	
T	optional	
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
T	completewith	GlowingShardRP
A	hs	
A	bindlocation	392,1
A	subzoneskip	392
A	use	6948
A	dungeon	WC
S	
A	goto	The Barrens,63.09,37.61
A	turnin	959
A	target	Crane Operator Bigglefuzz
A	isQuestComplete	959
A	dungeon	WC
S	
A	goto	The Barrens,62.37,37.62
A	turnin	1491
A	target	Mebok Mizzyrix
A	isQuestComplete	1491
A	dungeon	WC
S	
A	use	10441
A	accept	6981
A	itemcount	10441,1
A	dungeon	WC
S	
T	label	GlowingShardRP
A	goto	The Barrens,62.99,37.22
A	complete	6981,1
A	skipgossip	
A	target	Sputtervalve
A	isOnQuest	6981
A	dungeon	WC
S	
A	goto	The Barrens,63.09,37.16
A	fly	Crossroads
A	target	Bragok
A	subzoneskip	380
A	isOnQuest	6981
A	dungeon	WC
S	
T	completewith	next
A	goto	The Barrens,50.49,34.36,20,0
A	goto	The Barrens,49.61,34.54,20,0
A	goto	The Barrens,49.14,34.02,20,0
A	goto	The Barrens,48.18,32.78,50
A	dungeon	WC
S	
A	goto	The Barrens,48.18,32.78
A	turnin	6981
A	accept	3369
A	target	Falla Sagewind
A	isOnQuest	6981
A	dungeon	WC
S	
A	goto	The Barrens,48.18,32.78
A	accept	3369
A	target	Falla Sagewind
A	isQuestTurnedIn	6981
A	dungeon	WC
S	
A	turnin	1486
A	target	+Nalpak
A	goto	Kalimdor,51.91,55.42
A	turnin	1487
A	target	+Ebru
A	goto	Kalimdor,51.92,55.44
A	isQuestComplete	1487
A	isQuestComplete	1486
A	dungeon	WC
S	
A	goto	Kalimdor,51.92,55.44
A	turnin	1487
A	target	Ebru
A	isQuestComplete	1487
A	dungeon	WC
S	
A	goto	Kalimdor,51.91,55.42
A	turnin	1486
A	target	Nalpak
A	isQuestComplete	1486
A	dungeon	WC
S	
T	completewith	WCEnd
A	goto	The Barrens,51.50,30.34
A	fly	Thunder Bluff
A	target	Devrak
A	zoneskip	Thunder Bluff
A	dungeon	WC
S	
A	goto	Thunder Bluff,75.65,31.57
A	turnin	914
A	target	Nara Wildmane
A	isQuestComplete	914
A	dungeon	WC
S	
A	goto	Thunder Bluff,78.61,28.55
A	turnin	3369
A	target	Arch Druid Hamuul Runetotem
A	isOnQuest	3369
A	dungeon	WC
S	
A	goto	Thunder Bluff,23.0,21.0
A	turnin	962
A	target	Apothecary Zamah
A	isQuestComplete	962
A	dungeon	WC
S	
A	goto	Thunder Bluff,28.55,25.64
A	accept	264
A	target	Clarice Foster
A	dungeon	WC
S	
T	label	WCEnd
A	goto	Thunder Bluff,45.83,64.74
A	home	
A	target	Innkeeper Pala
A	bindlocation	1638
A	isQuestAvailable	6442
A	dungeon	WC
S	
T	completewith	SerenaKill
A	goto	Thunder Bluff,47.00,49.82
A	fly	Crossroads
A	target	Tal
A	zoneskip	Thunder Bluff,1
A	dungeon	WC
S	
A	goto	The Barrens,45.35,28.41
A	turnin	852
A	target	Regthar Deathgate
A	isQuestComplete	852
S	
A	goto	The Barrens,45.35,28.41
A	turnin	855
A	target	Regthar Deathgate
A	isQuestComplete	855
S	
A	goto	The Barrens,45.35,28.41
A	accept	4021
A	target	Regthar Deathgate
A	isQuestTurnedIn	852
A	group	
S	
A	goto	The Barrens,44.48,28.15
A	complete	4021,1
A	unitscan	Warlord Krom'zar
A	group	3
A	isQuestTurnedIn	852
S	
A	goto	The Barrens,45.35,28.41
A	turnin	4021
A	target	Regthar Deathgate
A	isQuestComplete	4021
A	group	
S	
A	goto	The Barrens,45.35,28.41
A	turnin	855
A	target	Regthar Deathgate
A	isQuestComplete	855
A	group	
S	
T	optional	
A	abandon	855
A	isOnQuest	855
S	
T	label	SerenaKill
A	goto	The Barrens,39.16,12.16
A	complete	876,1
A	mob	Serena Bloodfeather
S	
T	completewith	next
A	subzone	380
S	
T	label	ApothecaryPickup
A	turnin	876
A	accept	1060
A	target	+Darsok Swiftdagger
A	goto	The Barrens,51.62,30.90
A	accept	868
A	target	+Korran
A	goto	The Barrens,51.10,29.60
S	
T	completewith	next
A	zone	Stonetalon Mountains
A	zoneskip	Stonetalon Mountains
S	
T	map	Stonetalon Mountains
A	turnin	1062
A	timer	4,Goblin Invaders RP
A	accept	1063
A	accept	1068
A	target	+Seereth Stonebreak
A	goto	The Barrens,35.26,27.88
A	turnin	6629
A	turnin	6523
A	accept	6401
A	target	+Makaba Flathoof
A	goto	The Barrens,35.19,27.79
S	
T	completewith	next
A	goto	Stonetalon Mountains,82.57,98.63,60,0
A	goto	Stonetalon Mountains,80.10,98.20,40,0
A	goto	Stonetalon Mountains,77.17,98.61,40
S	
A	goto	Stonetalon Mountains,74.54,97.94
A	turnin	1060
A	accept	1058
A	target	Witch Doctor Jin'Zil
S	Warlock
A	goto	Stonetalon Mountains,73.25,95.13
A	turnin	1510
A	accept	1511
A	target	Ken'zigla
S	
A	goto	Stonetalon Mountains,71.25,95.02
A	turnin	6461
A	target	Xen'Zilla
S	skip
A	goto	Stonetalon Mountains,74.69,98.10
A	goto	Thunder Bluff,56.65,18.96,30
A	link	https://www.youtube.com/watch?v=cp2YI86AO4Y&ab
A	solo	
S	
T	completewith	next
A	goto	Stonetalon Mountains,67.41,87.92,60,0
A	goto	Stonetalon Mountains,65.93,89.87,40,0
A	goto	Stonetalon Mountains,63.66,93.80,40,0
A	goto	Stonetalon Mountains,61.75,93.06,40
A	group	
S	
A	goto	Stonetalon Mountains,60.16,90.92,30,0
A	goto	Stonetalon Mountains,58.44,89.90
A	complete	6421,1
A	complete	6421,2
A	isOnQuest	6421
A	group	
S	skip
T	completewith	next
A	goto	Stonetalon Mountains,64.62,93.86,25,0
A	goto	Stonetalon Mountains,64.80,95.27,20,0
A	goto	Stonetalon Mountains,64.32,95.84,15
A	group	
S	skip
A	goto	Stonetalon Mountains,64.28,96.60
A	goto	Thunder Bluff,56.65,18.96,30
A	link	https://www.youtube.com/watch?v=j_DRDkqWeuE&ab
A	group	
S	
T	completewith	next
A	subzone	460
S	
T	label	KayaLives
A	goto	Stonetalon Mountains,47.46,58.37
A	turnin	6401
A	target	Tammra Windfield
S	
A	goto	Stonetalon Mountains,47.47,62.13
A	vendor	
A	vendor	
A	target	Innkeeper Jayka
A	isQuestAvailable	6442
S	
A	goto	Stonetalon Mountains,47.61,61.58
A	vendor	
A	vendor	
A	target	Jeeda
A	isQuestAvailable	6442
S	
T	completewith	InDeepTrouble2
A	goto	Stonetalon Mountains,49.38,61.68,30,0
A	goto	Stonetalon Mountains,48.92,62.71,30,0
A	goto	Stonetalon Mountains,48.11,63.88,30,0
A	goto	Stonetalon Mountains,47.21,64.05,30
S	
A	accept	6562
A	target	+Tsunaman
A	goto	Stonetalon Mountains,47.36,64.25
A	turnin	6421
A	accept	6481
A	target	+Mor'Rogal
A	goto	Stonetalon Mountains,47.21,64.05
A	isQuestComplete	6421
A	group	
S	
A	goto	Stonetalon Mountains,47.21,64.05
A	accept	6481
A	target	Mor'Rogal
A	isQuestTurnedIn	6421
A	group	
S	
T	label	InDeepTrouble2
A	goto	Stonetalon Mountains,47.36,64.25
A	accept	6562
A	target	Tsunaman
S	
A	goto	Stonetalon Mountains,59.08,75.70
A	accept	6284
A	group	
S	
T	loop	
A	goto	Stonetalon Mountains,54.80,71.95,0
A	goto	Stonetalon Mountains,51.89,73.81,50,0
A	goto	Stonetalon Mountains,52.46,71.67,50,0
A	goto	Stonetalon Mountains,54.80,71.95,50,0
A	complete	6284,1
A	unitscan	Besseleth
A	group	3
S	
T	completewith	next
A	goto	Stonetalon Mountains,67.41,87.92,60,0
A	goto	Stonetalon Mountains,65.93,89.87,40,0
A	goto	Stonetalon Mountains,63.66,93.80,40,0
A	goto	Stonetalon Mountains,61.75,93.06,40
A	group	
A	isOnQuest	6481
S	
A	goto	Stonetalon Mountains,59.50,90.40,40,0
A	goto	Stonetalon Mountains,57.65,89.52
A	complete	6481,1
A	mob	Goggeroc
A	group	2
A	isOnQuest	6481
S	skip
A	goto	Stonetalon Mountains,58.24,89.81
A	goto	Stonetalon Mountains,57.57,61.99,30
A	link	https://www.youtube.com/watch?v=DGsL3FX9_TE&ab
A	group	
A	isQuestComplete	6481
S	
T	completewith	EarthenAriseTurnin
A	goto	Stonetalon Mountains,49.38,61.68,50
A	group	
A	isQuestComplete	6481
S	
T	completewith	next
A	goto	Stonetalon Mountains,49.38,61.68,20,0
A	goto	Stonetalon Mountains,48.92,62.71,30,0
A	goto	Stonetalon Mountains,48.11,63.88,30,0
A	goto	Stonetalon Mountains,47.21,64.05,30
A	group	
A	isQuestComplete	6481
S	
T	label	EarthenAriseTurnin
A	goto	Stonetalon Mountains,47.21,64.05
A	turnin	6481
A	target	Mor'Rogal
A	isQuestComplete	6481
A	group	
S	
A	goto	Stonetalon Mountains,47.20,61.16
A	turnin	6284
A	target	Maggran Earthbinder
A	isQuestComplete	6284
A	group	
S	
T	completewith	next
A	goto	Stonetalon Mountains,58.99,62.60,100
S	
A	goto	Stonetalon Mountains,58.99,62.60
A	turnin	1095
A	target	Ziz Fizziks
S	
T	loop	
A	line	Stonetalon Mountains,70.82,55.25,70.52,56.22,69.76,56.70,68.52,56.04,67.77,55.97,66.94,56.25,66.41,56.31,65.74,57.20,65.14,57.02,64.37,56.47,63.72,56.80,62.99,56.25,62.32,56.11,61.58,55.10,61.10,54.68,60.98,54.06,59.81,53.51,59.66,52.14,60.33,51.68
A	goto	Stonetalon Mountains,61.03,52.32,50,0
A	goto	Stonetalon Mountains,60.33,51.68,50,0
A	goto	Stonetalon Mountains,59.66,52.14,50,0
A	goto	Stonetalon Mountains,59.81,53.51,50,0
A	goto	Stonetalon Mountains,60.98,54.06,50,0
A	goto	Stonetalon Mountains,61.10,54.68,50,0
A	goto	Stonetalon Mountains,61.58,55.10,50,0
A	goto	Stonetalon Mountains,62.32,56.11,50,0
A	goto	Stonetalon Mountains,62.99,56.25,50,0
A	goto	Stonetalon Mountains,63.72,56.80,50,0
A	goto	Stonetalon Mountains,64.37,56.47,50,0
A	goto	Stonetalon Mountains,65.14,57.02,50,0
A	goto	Stonetalon Mountains,65.74,57.20,50,0
A	goto	Stonetalon Mountains,66.41,56.31,50,0
A	goto	Stonetalon Mountains,66.94,56.25,50,0
A	goto	Stonetalon Mountains,67.77,55.97,50,0
A	goto	Stonetalon Mountains,68.52,56.04,50,0
A	goto	Stonetalon Mountains,69.76,56.70,50,0
A	goto	Stonetalon Mountains,70.52,56.22,50,0
A	goto	Stonetalon Mountains,70.82,55.25,50,0
A	goto	Stonetalon Mountains,59.66,52.14,0
A	complete	1068,2
A	unitscan	XT:9
S	
T	loop	
A	line	Stonetalon Mountains,67.18,46.87,66.53,46.95,65.72,45.09,63.73,45.02,63.72,45.92,63.43,46.57,64.43,46.13,64.72,46.63,64.82,47.72,65.11,48.31,65.98,48.67,66.24,49.65,66.65,49.58,66.88,48.95,68.41,49.58,69.45,46.56,70.22,48.62,70.95,48.49,71.41,45.54,71.25,43.45
A	goto	Stonetalon Mountains,67.18,46.87,50,0
A	goto	Stonetalon Mountains,66.53,46.95,50,0
A	goto	Stonetalon Mountains,65.72,45.09,50,0
A	goto	Stonetalon Mountains,63.73,45.02,50,0
A	goto	Stonetalon Mountains,63.72,45.92,50,0
A	goto	Stonetalon Mountains,63.43,46.57,50,0
A	goto	Stonetalon Mountains,64.43,46.13,50,0
A	goto	Stonetalon Mountains,64.72,46.63,50,0
A	goto	Stonetalon Mountains,64.82,47.72,50,0
A	goto	Stonetalon Mountains,65.11,48.31,50,0
A	goto	Stonetalon Mountains,65.98,48.67,50,0
A	goto	Stonetalon Mountains,66.24,49.65,50,0
A	goto	Stonetalon Mountains,66.65,49.58,50,0
A	goto	Stonetalon Mountains,66.88,48.95,50,0
A	goto	Stonetalon Mountains,68.41,49.58,50,0
A	goto	Stonetalon Mountains,69.45,46.56,50,0
A	goto	Stonetalon Mountains,70.22,48.62,50,0
A	goto	Stonetalon Mountains,70.95,48.49,50,0
A	goto	Stonetalon Mountains,71.41,45.54,50,0
A	goto	Stonetalon Mountains,71.25,43.45,50,0
A	goto	Stonetalon Mountains,64.82,47.23,50,0
A	goto	Stonetalon Mountains,64.82,47.23,0
A	complete	1068,1
A	unitscan	XT:4
S	
T	completewith	next
A	subzone	2160
A	group	
S	
A	goto	Stonetalon Mountains,71.87,60.00
A	accept	1090
A	target	Piznik
A	group	3
S	
A	goto	Stonetalon Mountains,71.77,60.19
A	complete	1090,1
A	mob	Windshear Vermin
A	group	3
S	
A	goto	Stonetalon Mountains,71.87,60.00
A	turnin	1090
A	accept	1092
A	target	Piznik
A	group	
S	skip
A	goto	Stonetalon Mountains,71.83,60.34
A	goto	Stonetalon Mountains,57.57,61.99,30
A	link	https://www.youtube.com/watch?v=8s1SRza7qFg&ab_channel=RestedXP
A	group	
S	
A	goto	Stonetalon Mountains,58.99,62.60
A	turnin	1092
A	target	Ziz Fizziks
A	isQuestTurnedIn	1090
A	group	
S	
T	completewith	next
A	goto	Stonetalon Mountains,78.29,42.51,30
S	skip
A	goto	Stonetalon Mountains,78.89,41.24
A	goto	Ashenvale,40.40,53.06,30
A	link	https://www.youtube.com/watch?v=h2s4ZjFBLtg&ab_channel=RestedXP
A	zoneskip	Ashenvale
S	
T	completewith	ZoramFP
A	goto	Ashenvale,39.45,55.29,50,0
A	goto	Ashenvale,36.47,57.15,50,0
A	goto	Ashenvale,34.56,54.13,30,0
A	goto	Ashenvale,32.14,52.12,60,0
A	goto	Ashenvale,28.64,48.10,50,0
A	goto	Ashenvale,26.34,45.44,50,0
A	goto	Ashenvale,25.40,39.00,70,0
A	goto	Ashenvale,11.96,34.28,80
A	unitscan	Astranaar Sentinel
S	
T	optional	
T	loop	
A	goto	Ashenvale,10.86,26.99,50,0
A	goto	Ashenvale,11.23,25.73,50,0
A	goto	Ashenvale,11.83,25.75,50,0
A	goto	Ashenvale,12.51,24.09,50,0
A	goto	Ashenvale,14.18,24.03,50,0
A	goto	Ashenvale,14.85,23.08,50,0
A	goto	Ashenvale,14.13,20.77,50,0
A	goto	Ashenvale,14.73,19.56,50,0
A	goto	Ashenvale,14.59,17.90,50,0
A	goto	Ashenvale,13.38,16.39,50,0
A	goto	Ashenvale,13.62,14.48,50,0
A	goto	Ashenvale,14.15,15.31,50,0
A	goto	Ashenvale,15.88,15.42,50,0
A	goto	Ashenvale,15.40,16.96,50,0
A	goto	Ashenvale,15.22,18.81,50,0
A	goto	Ashenvale,15.33,20.78,50,0
A	goto	Ashenvale,15.33,22.51,50,0
A	goto	Ashenvale,15.32,24.90,50,0
A	goto	Ashenvale,14.76,25.52,50,0
A	goto	Ashenvale,14.62,26.49,50,0
A	goto	Ashenvale,14.52,28.25,50,0
A	goto	Ashenvale,13.55,29.36,50,0
A	goto	Ashenvale,12.41,29.15,50,0
A	goto	Ashenvale,11.22,31.04,50,0
A	goto	Ashenvale,10.38,29.60,50,0
A	goto	Ashenvale,11.01,28.57,50,0
A	xp	21
S	
T	label	ZoramFP
A	goto	Ashenvale,12.24,33.80
A	fp	Zoram'gar Outpost
A	target	Andruk
A	isQuestAvailable	6442
S	
A	turnin	6562
A	accept	6563
A	target	+Je'neu Sancrea
A	goto	Ashenvale,11.56,34.29
A	accept	216
A	target	+Karang Amakkar
A	goto	Ashenvale,11.90,34.53
A	accept	6462
A	target	+Mitsuwa
A	goto	Ashenvale,11.65,34.85
A	accept	6442
A	target	+Marukai
A	goto	Ashenvale,11.69,34.90
A	group	
S	
A	turnin	6562
A	target	+Je'neu Sancrea
A	goto	Ashenvale,11.56,34.29
A	accept	216
A	target	+Karang Amakkar
A	goto	Ashenvale,11.90,34.53
A	accept	6462
A	target	+Mitsuwa
A	goto	Ashenvale,11.65,34.85
A	accept	6442
A	target	+Marukai
A	goto	Ashenvale,11.69,34.90
S	
A	goto	Ashenvale,12.06,34.63
A	accept	6641,1
A	target	Muglash
A	group	2
S	
A	goto	Ashenvale,9.63,27.63
A	complete	6641,1
A	mob	Vorsha the Lasher
A	group	2
S	
T	loop	
A	goto	Ashenvale,11.01,28.57,0
A	goto	Ashenvale,10.86,26.99,50,0
A	goto	Ashenvale,11.23,25.73,50,0
A	goto	Ashenvale,11.83,25.75,50,0
A	goto	Ashenvale,12.51,24.09,50,0
A	goto	Ashenvale,14.18,24.03,50,0
A	goto	Ashenvale,14.85,23.08,50,0
A	goto	Ashenvale,14.13,20.77,50,0
A	goto	Ashenvale,14.73,19.56,50,0
A	goto	Ashenvale,14.59,17.90,50,0
A	goto	Ashenvale,13.38,16.39,50,0
A	goto	Ashenvale,13.62,14.48,50,0
A	goto	Ashenvale,14.15,15.31,50,0
A	goto	Ashenvale,15.88,15.42,50,0
A	goto	Ashenvale,15.40,16.96,50,0
A	goto	Ashenvale,15.22,18.81,50,0
A	goto	Ashenvale,15.33,20.78,50,0
A	goto	Ashenvale,15.33,22.51,50,0
A	goto	Ashenvale,15.32,24.90,50,0
A	goto	Ashenvale,14.76,25.52,50,0
A	goto	Ashenvale,14.62,26.49,50,0
A	goto	Ashenvale,14.52,28.25,50,0
A	goto	Ashenvale,13.55,29.36,50,0
A	goto	Ashenvale,12.41,29.15,50,0
A	goto	Ashenvale,11.22,31.04,50,0
A	goto	Ashenvale,10.38,29.60,50,0
A	goto	Ashenvale,11.01,28.57,50,0
A	complete	6442,1
A	mob	Wrathtail Razortail
A	mob	Wrathtail Wave Rider
A	mob	Wrathtail Sorceress
A	mob	Wrathtail Sea Witch
A	mob	Wrathtail Priestess
A	mob	Wrathtail Myrmidon
A	mob	Lady Vespia
S	
A	goto	Kalimdor,43.89,35.23,100
A	isOnQuest	6563
A	group	
S	
T	completewith	next
A	complete	6563,1
A	group	4
S	
T	loop	
A	goto	Kalimdor,43.94,34.86,0
A	goto	Kalimdor,43.81,35.16,20,0
A	goto	Kalimdor,43.94,34.86,20,0
A	goto	Kalimdor,43.90,34.59,20,0
A	goto	Kalimdor,44.00,34.57,20,0
A	goto	Kalimdor,44.16,34.85,20,0
A	goto	Kalimdor,44.35,34.97,20,0
A	goto	Kalimdor,44.53,34.86,20,0
A	goto	Kalimdor,43.94,34.86,20,0
A	collect	16790,1,6564
A	accept	6564
A	mob	Blackfathom Tide Priestess
A	use	16790
A	group	4
S	
T	loop	
A	goto	Kalimdor,44.34,35.11,0
A	goto	Kalimdor,44.53,34.86,20,0
A	goto	Kalimdor,44.35,34.97,20,0
A	goto	Kalimdor,44.16,34.85,20,0
A	goto	Kalimdor,44.00,34.57,20,0
A	goto	Kalimdor,43.90,34.59,20,0
A	goto	Kalimdor,43.94,34.86,20,0
A	goto	Kalimdor,43.81,35.16,20,0
A	goto	Kalimdor,44.34,35.11,20,0
A	complete	6563,1
A	group	4
S	
T	loop	
A	goto	Ashenvale,10.86,26.99,50,0
A	goto	Ashenvale,11.23,25.73,50,0
A	goto	Ashenvale,11.83,25.75,50,0
A	goto	Ashenvale,12.51,24.09,50,0
A	goto	Ashenvale,14.18,24.03,50,0
A	goto	Ashenvale,14.85,23.08,50,0
A	goto	Ashenvale,14.13,20.77,50,0
A	goto	Ashenvale,14.73,19.56,50,0
A	goto	Ashenvale,14.59,17.90,50,0
A	goto	Ashenvale,13.38,16.39,50,0
A	goto	Ashenvale,13.62,14.48,50,0
A	goto	Ashenvale,14.15,15.31,50,0
A	goto	Ashenvale,15.88,15.42,50,0
A	goto	Ashenvale,15.40,16.96,50,0
A	goto	Ashenvale,15.22,18.81,50,0
A	goto	Ashenvale,15.33,20.78,50,0
A	goto	Ashenvale,15.33,22.51,50,0
A	goto	Ashenvale,15.32,24.90,50,0
A	goto	Ashenvale,14.76,25.52,50,0
A	goto	Ashenvale,14.62,26.49,50,0
A	goto	Ashenvale,14.52,28.25,50,0
A	goto	Ashenvale,13.55,29.36,50,0
A	goto	Ashenvale,12.41,29.15,50,0
A	goto	Ashenvale,11.22,31.04,50,0
A	goto	Ashenvale,10.38,29.60,50,0
A	goto	Ashenvale,11.01,28.57,50,0
A	xp	23
S	
A	goto	Ashenvale,11.56,34.29
A	turnin	6563
A	turnin	6564
A	target	Je'neu Sancrea
A	group	
A	isQuestComplete	6563
A	isQuestComplete	6564
S	
A	goto	Ashenvale,11.56,34.29
A	turnin	6563
A	target	Je'neu Sancrea
A	group	
A	isQuestComplete	6563
S	
A	goto	Ashenvale,11.56,34.29
A	turnin	6564
A	target	Je'neu Sancrea
A	group	
A	isQuestComplete	6564
S	
A	turnin	6641
A	target	+Warsong Runner
A	goto	Ashenvale,12.22,34.21
A	turnin	6442
A	target	+Marukai
A	goto	Ashenvale,11.69,34.90
A	isQuestComplete	6641
A	group	
S	
A	goto	Ashenvale,11.69,34.90
A	turnin	6442
A	target	Marukai
S	
A	goto	Ashenvale,11.90,34.53
A	accept	216
A	target	Karang Amakkar
S	
T	completewith	flytoORG
A	hs	
A	use	6948
A	bindlocation	1638,1
A	zoneskip	Thunder Bluff
A	cooldown	item,6948,>0
S	
T	completewith	flytoORG
A	goto	Ashenvale,12.24,33.80
A	zoneskip	Thunder Bluff
A	fly	Thunder Bluff
A	target	Andruk
A	cooldown	item,6948,<0
S	
A	goto	Thunder Bluff,47.12,57.88
A	bankdeposit	5059
A	target	Chesmu
S	
T	completewith	next
A	goto	Thunder Bluff,69.88,30.90,80
S	
A	goto	Thunder Bluff,69.88,30.90
A	turnin	1063
A	timer	6,The Elder Crone RP
A	accept	1064
A	target	Magatha Grimtotem
S	
A	goto	Thunder Bluff,22.82,20.88
A	turnin	1064
A	accept	1065
A	target	Apothecary Zamah
S	Warlock
T	completewith	flytoORG
A	goto	Thunder Bluff,47.00,49.82
A	fly	Camp Taurajo
A	target	Tal
A	subzoneskip	378
S	!Warlock
A	goto	Thunder Bluff,47.00,49.82
A	fly	Orgrimmar
A	target	Tal
A	zoneskip	Orgrimmar
S	Warlock
A	goto	The Barrens,44.62,59.27
A	turnin	1511
A	accept	1515
A	target	Grunt Logmar
S	Warlock
A	goto	The Barrens,43.31,47.88
A	turnin	1515
A	accept	1512
A	target	Grunt Dogran
S	Warlock
A	goto	The Barrens,44.45,59.16
A	fly	Orgrimmar
A	target	Omusa Thunderhorn
A	zoneskip	The Barrens,1
S	
T	optional	
T	label	flytoORG
S	Warlock
A	goto	Orgrimmar,48.25,45.27
A	turnin	1512
A	accept	1513
A	target	Gan'rul Bloodeye
S	Warlock
T	completewith	next
A	cast	9224
A	use	6626
S	Warlock
A	goto	Orgrimmar,49.66,50.15
A	complete	1513,1
A	mob	Summoned Succubus
A	use	6626
S	Warlock
A	goto	Orgrimmar,48.25,45.27
A	turnin	1513
A	target	Gan'rul Bloodeye
S	Warlock
A	goto	Orgrimmar,48.62,46.95
A	train	6202
A	target	Mirket
A	xp	<22,1
A	xp	>24,1
S	Warlock
T	optional	
A	goto	Orgrimmar,48.62,46.95
A	train	6223
A	target	Mirket
A	xp	<24,1
S	Rogue
T	completewith	next
A	goto	Orgrimmar,45.64,55.95
A	collect	2207,1
A	target	Kareth
S	Rogue
A	goto	Orgrimmar,43.05,53.73
A	train	921
A	train	8676
A	train	1943
A	train	1856
A	train	1725
A	train	1785
A	accept	2460
A	target	Shenthul
S	Rogue
A	goto	Orgrimmar,43.05,53.73
A	complete	2460,1
A	target	Shenthul
S	Rogue
A	goto	Orgrimmar,43.05,53.73
A	turnin	2460
A	accept	2458
A	target	Shenthul
S	Rogue
A	goto	Orgrimmar,42.10,49.49
A	collect	2928,20,2479,1
A	collect	3371,20,2479,1
A	collect	5140,20,2479,1
A	target	Rekkul
S	
A	goto	Orgrimmar,76.50,24.42
A	turnin	3923
A	accept	3924
A	target	Rilli Greasygob
S	Priest/Warlock
A	goto	Orgrimmar,44.16,48.45
A	collect	5210,1,1507,1
A	money	<0.5808
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<17.4
A	target	Katis
S	Mage
A	goto	Orgrimmar,38.36,85.54
A	train	2138
A	target	Pephredo
A	xp	<22,1
A	xp	>24,1
S	Mage
T	optional	
A	goto	Orgrimmar,38.36,85.54
A	train	2121
A	target	Pephredo
A	xp	<24,1
S	Mage
A	goto	Orgrimmar,38.66,85.41
A	train	3567
A	target	Thuul
S	Troll Priest
A	goto	Orgrimmar,35.59,87.80
A	turnin	5642
A	trainer	
A	target	Ur'kyo
S	Undead Priest
A	goto	Orgrimmar,35.59,87.80
A	train	8103
A	target	Ur'kyo
A	xp	<22,1
A	xp	>24,1
S	Undead Priest
T	optional	
A	goto	Orgrimmar,35.59,87.80
A	train	3747
A	target	Ur'kyo
A	xp	<24,1
S	Rogue/Druid
T	completewith	MissionProbable
A	goto	Orgrimmar,26.22,61.58,80,0
A	goto	Orgrimmar,15.66,63.33,30,0
A	goto	Orgrimmar,18.03,60.51,50
A	zoneskip	The Barrens
S	Rogue/Druid
T	completewith	MissionProbable
A	goto	The Barrens,57.63,7.48,120
S	Druid
A	goto	The Barrens,56.67,8.32
A	collect	15883,1,3924,1
S	Rogue
T	completewith	next
A	goto	The Barrens,55.70,5.89
A	use	8051
A	target	Taskmaster Fizzule
S	Rogue
A	goto	The Barrens,55.44,5.56
A	turnin	2458
A	accept	2478
A	target	Taskmaster Fizzule
S	Rogue/Druid
T	optional	
T	label	MissionProbable
S	Rogue
A	goto	The Barrens,54.80,5.97
A	complete	2478,5
A	mob	Foreman Silixiz
S	Rogue
T	completewith	roguetowerq
S	Rogue
T	label	roguetowerq
A	goto	The Barrens,54.72,5.74
A	complete	2478,1
A	mob	+Mutated Venture Co. Drone
A	complete	2478,3
A	mob	+Venture Co. Patroller
A	complete	2478,2
A	mob	+Venture Co. Lookout
S	Rogue
A	goto	The Barrens,54.77,5.57
A	complete	2478,4
A	mob	Grand Foreman Puzik Gallywix
S	Rogue
A	goto	The Barrens,54.77,5.57
A	complete	2478,6
S	Rogue/Druid
T	completewith	SamophlangePages
A	goto	The Barrens,61.33,4.21,120
S	!Rogue/Druid
A	goto	Orgrimmar,26.22,61.58,80,0
A	goto	Orgrimmar,15.66,63.33,30,0
A	goto	Orgrimmar,18.03,60.51,50
A	zoneskip	The Barrens
A	isOnQuest	3924
S	
T	completewith	next
A	collect	11148,5
A	mob	Venture Co. Enforcer
A	mob	Venture Co. Overseer
S	
T	label	SamophlangePages
A	goto	The Barrens,60.90,3.84,20,0
A	goto	The Barrens,59.99,4.13
A	collect	11147,1
A	mob	Boss Copperplug
A	mob	Venture Co. Enforcer
A	mob	Venture Co. Overseer
S	
T	label	SamophlangePages2
T	loop	
A	goto	The Barrens,61.51,4.43,0
A	goto	The Barrens,61.46,4.50,40,0
A	goto	The Barrens,61.06,3.63,40,0
A	goto	The Barrens,61.63,3.37,40,0
A	goto	The Barrens,62.14,3.52,40,0
A	goto	The Barrens,61.94,4.53,40,0
A	goto	The Barrens,61.85,5.37,40,0
A	goto	The Barrens,61.44,5.56,40,0
A	goto	The Barrens,61.17,5.05,40,0
A	goto	The Barrens,61.51,4.43,40,0
A	collect	11148,5
A	mob	Venture Co. Enforcer
A	mob	Venture Co. Overseer
S	
T	requires	SamophlangePages
T	requires	SamophlangePages2
A	complete	3924,1
A	use	6626
A	goto	Kalimdor,56.81,45.47
A	zone	Orgrimmar
A	isQuestComplete	3924
S	skip
A	goto	The Barrens,60.00,4.09
A	goto	Orgrimmar,40.05,68.05,30
A	link	https://www.youtube.com/watch?v=cOxspH4RcI8&ab
S	Rogue
A	goto	Orgrimmar,43.05,53.73
A	turnin	2478
A	accept	2479
A	target	Shenthul
S	Rogue
A	goto	Orgrimmar,42.10,49.49
A	collect	2928,20,2479,1
A	collect	3371,20,2479,1
A	target	Rekkul
S	Shaman
A	goto	Orgrimmar,38.82,36.41
A	train	8498
A	target	Kardris Dreamseeker
A	xp	<22,1
A	xp	>24,1
S	Shaman
T	optional	
A	goto	Orgrimmar,38.82,36.41
A	train	905
A	target	Kardris Dreamseeker
A	xp	<24,1
S	
A	goto	Orgrimmar,76.50,24.42
A	turnin	3924
A	target	Rilli Greasygob
S	Troll Warrior/Undead Warrior/Tauren Warrior
A	goto	Orgrimmar,81.52,19.60
A	train	197
A	target	Hanashi
S	Warrior
A	goto	Orgrimmar,79.91,31.36
A	train	6192
A	target	Grezz Ragefist
A	xp	<22,1
A	xp	>24,1
S	Warrior
T	optional	
A	goto	Orgrimmar,79.91,31.36
A	train	5308
A	target	Grezz Ragefist
A	xp	<24,1
S	Hunter
A	goto	Orgrimmar,66.05,18.52
A	train	14323
A	target	Ormak Grimshot
A	xp	<22,1
A	xp	>24,1
S	Hunter
T	optional	
A	goto	Orgrimmar,66.05,18.52
A	train	14262
A	target	Ormak Grimshot
A	xp	<24,1
S	Hunter
A	goto	Orgrimmar,66.34,14.83
A	train	24558
A	target	Xao'tsu
A	xp	<24,1
S	Rogue
A	goto	Orgrimmar,48.12,80.52
A	collect	3137,200,6544,1
A	target	Trak'gen
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
T	completewith	next
A	zone	Durotar
A	zoneskip	Durotar
S	
A	goto	Durotar,50.8,13.8,40
A	zone	Tirisfal Glades
A	zoneskip	Tirisfal Glades
A	zoneskip	Undercity
E
]=]
