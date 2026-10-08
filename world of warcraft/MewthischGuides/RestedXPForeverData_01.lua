local addonName, MG = ...
MG.RestEDXPForeverRaw = MG.RestEDXPForeverRaw or {
    source = {
        repository = "RestedXP/RXPGuides",
        commit = "a688a75d595f5884dba8044a5ba4e7d7bd859c09",
        license = "CC BY-NC-SA 4.0",
        transformed = true,
        proseCopied = false,
    },
    chunks = {},
}
MG.RestEDXPForeverRaw.chunks[#MG.RestEDXPForeverRaw.chunks + 1] = [=[
G	Guides/Forever/RestedXP-Skyborne.lua
M	classic	
M	version	1
M	name	1-14 Zephras Isle
M	displayname	1-14 Skyborne << Alliance
M	displayname	1-14 Skyborne << Horde
M	group	RestedXP Forever Guide (A) << Alliance
M	group	RestedXP Forever Guide (H) << Horde
M	subgroup	Speedrun Guide 1-20 << Alliance
M	subgroup	Speedrun Guide 1-22 << Horde
M	defaultfor	Skyborne
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Ailee Farheart|r
A	goto	2521,42.82,23.41
A	accept	92460
A	target	Ailee Farheart
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Rorian the Dayseeker|r
A	goto	2521,42.07,23.49
A	turnin	92460
A	target	Rorian the Dayseeker
A	accept	92461
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Elatrell Featherlight|r
A	goto	2521,43.44,24.80
A	accept	92462
A	target	Elatrell Featherlight
S	!Shaman
T	hidewindow	
T	completewith	Juvenile Vuldren
T	loop	
T	arrowtext	Kill\n|cRXP_ENEMY_Juvenile Vuldren|r and\n|cRXP_ENEMY_Pesky Cirrusfly|r
A	goto	2521,44.23,26,35,0
A	goto	2521,45.24,25.9,35,0
A	goto	2521,46.06,25.33,35,0
A	goto	2521,46.77,27.83,35,0
A	goto	2521,45.27,28.36,35,0
A	goto	2521,43.84,28.39,35,0
A	goto	2521,42.88,27.52,35,0
S	Shaman
T	hidewindow	
T	completewith	Juvenile Vuldren Grind
T	loop	
T	arrowtext	Kill\n|cRXP_ENEMY_Juvenile Vuldren|r and\n|cRXP_ENEMY_Pesky Cirrusfly|r
A	goto	2521,44.23,26,35,0
A	goto	2521,45.24,25.9,35,0
A	goto	2521,46.06,25.33,35,0
A	goto	2521,46.77,27.83,35,0
A	goto	2521,45.27,28.36,35,0
A	goto	2521,43.84,28.39,35,0
A	goto	2521,42.88,27.52,35,0
S	
T	completewith	next
A	complete	92461,1
A	mob	Juvenile Vuldren
S	
A	complete	92462,1
A	mob	Pesky Cirrusfly
S	
T	label	Juvenile Vuldren
A	complete	92461,1
A	mob	Juvenile Vuldren
S	Shaman
T	label	Juvenile Vuldren Grind
A	xp	2+480
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Elatrell Featherlight|r
A	goto	2521,43.44,24.78
A	turnin	92462
A	accept	92463
A	target	Elatrell Featherlight
S	Warrior
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Blademaster Ren|r
A	goto	2521,43.66,24.13
A	train	6673
A	skipgossipid	136813,1
A	target	Blademaster Ren
A	money	<0.0010
S	
T	completewith	next
T	label	Anchors of Zephras
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Halaan Hawk-Eye|r
A	goto	2521,43.53,24.34,20,0
A	goto	2521,43.83,24.13,10,0
A	goto	2521,43.78,24.38,5,0
A	goto	2521,43.66,24.25,5,0
A	goto	2521,43.75,24.09,5,0
A	goto	2521,43.84,24.3,5,0
A	goto	2521,43.66,24.23,5,0
A	goto	2521,43.83,24.18,5,0
A	goto	2521,43.83,24.32,8,0
A	accept	94414
A	target	Halaan Hawk-Eye
S	
T	completewith	Anchors of Zephras
T	arrowtext	Enter the building\nand climb the spiral staircase
A	goto	2521,43.83,23.66,15
S	
T	requires	Anchors of Zephras
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Halaan Hawk-Eye|r
A	goto	2521,43.80,24.05
A	accept	94414
A	target	Halaan Hawk-Eye
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Halaan Hawk-Eye|r
A	goto	2521,43.80,24.05
A	complete	94414,1
A	skipgossipid	137720,1
A	target	Halaan Hawk-Eye
S	
T	arrowtext	Move to cancel the channel
A	goto	2521,43.80,24.05
A	turnin	94414
A	target	Halaan Hawk-Eye
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Myriaal Mistwake|r
A	goto	2521,43.64,24.04
A	accept	92474
A	target	Myriaal Mistwake
S	
T	completewith	next
T	label	Harmony in Balance
A	turnin	92461
A	target	Rorian the Dayseeker
S	
T	completewith	Harmony in Balance
T	arrowtext	Use |T132845:0|t[Walk on Air]\nwhile falling toward the quest giver
A	goto	2521,42.06,23.48
A	complete	92474,1
A	macro	Walk on Air, 132845
S	
T	requires	Harmony in Balance
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Rorian the Dayseeker|r
A	goto	2521,42.06,23.48
A	turnin	92461
A	target	Rorian the Dayseeker
A	turnin	92474
A	accept	92464
A	accept	92481
A	accept	92483
A	accept	92482
A	accept	92484
A	accept	92532
A	accept	92485
S	Druid
A	goto	2521,41.653,23.337
A	turnin	92485
A	target	Xyton Silverwind::251373
S	Druid
A	goto	2521,41.653,23.337
A	train	1126
A	target	Xyton Silverwind::251373
S	Mage
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Dorii Brightwhisper|r
A	goto	2521,41.55,23.67
A	train	1459
A	skipgossipid	136807,1
A	target	Dorii Brightwhisper
A	money	<0.0010
S	Shaman
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Windshaper Boro|r
A	goto	2521,42.790,23.566
A	target	Windshaper Boro::251374
A	turnin	92484
A	accept	92466
S	Shaman
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Windshaper Boro|r
A	goto	2521,42.79,23.57
A	train	8017
A	target	Windshaper Boro
S	Hunter
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Tai'ree Farsight|r
A	goto	2521,42.47,23.73
A	turnin	92482
A	target	Tai'ree Farsight
S	Horde
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Ventaari Brightwish|r
A	goto	2521,42.60,24.39
A	accept	92598
A	target	Ventaari Brightwish
S	!Warrior !Rogue
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Uualia Suncrest|r
A	goto	2521,42.749,24.496
A	collect	159,20,6394,1 << !Hunter !Shaman
A	collect	2512,1000,6394,1 << Hunter
A	target	Uualia Suncrest::251537
A	money	<0.01 << !Hunter
A	money	<0.0040 << Hunter
S	Horde
A	isNotOnQuest	93552
A	isQuestAvailable	93552
A	goto	2521,42.749,24.496
A	vendor	
A	target	Uualia Suncrest::251537
S	Alliance
T	completewith	next
T	label	Harvesting Windstones
A	accept	93552
A	target	Dalia the Collector
S	Alliance
T	completewith	Harvesting Windstones
T	arrowtext	Vendor trash
A	goto	2521,43.41,23.51
A	vendor	
S	
T	requires	Harvesting Windstones
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Dalia the Collector|r
A	goto	2521,43.37,23.99
A	accept	93552
A	target	Dalia the Collector
S	Alliance
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Falorne Fallwind|r
A	goto	2521,43.33,24.92
A	accept	92597
A	target	Falorne Fallwind
S	
T	completewith	next
T	arrowtext	Click on\n|cRXP_PICK_Crystals|r
A	goto	2521,43.82,25.41,10,0
A	goto	2521,44.23,24.96,10,0
A	goto	2521,44.28,27.32,25,0
A	goto	2521,45.33,29.15,30,0
A	goto	2521,46.77,27.96,30,0
A	complete	93552,1
S	
T	arrowtext	Don't use |T236219:0|t[Read Ley Line]\nwe need it soon << Alliance
T	arrowtext	Don't use |T1029587:0|t[Skysight]\nwe need it soon << Horde
A	goto	2521,48.41,28.37
A	complete	92463,1
A	mob	Cirrusfly Queen
S	
T	completewith	next
T	arrowtext	Click on\n|cRXP_PICK_Crystals|r
A	goto	2521,47.41,26.44,20,0
A	goto	2521,46.62,24.59,30,0
A	goto	2521,47.17,23.53,30,0
A	complete	93552,1
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Yala Windwatcher|r
A	goto	2521,47.29,21.90
A	turnin	92464
A	accept	92465
A	target	Yala Windwatcher
S	
T	completewith	UseRacialAbility
A	complete	93552,1
S	
T	completewith	UseRacialAbility
A	complete	92465,1
A	complete	92465,2
A	mob	Al'Aketh Convert
A	mob	Roiling Winds
S	Alliance
T	label	UseRacialAbility
T	arrowtext	Use |T236219:0|t[Read Ley Line]\nnear the Thendal Grove Ley Line
A	goto	2521,46.34,17.91
A	complete	92597,1
A	macro	Read Ley Line,236219
S	Horde
T	label	UseRacialAbility
T	arrowtext	Use |T1029587:0|t[Skysight]\nnear the |cRXP_PICK_Elemental Convergence|r
A	goto	2521,48.4,20.4
A	complete	92598,1
A	macro	Skysight,1029587
S	
T	hidewindow	
T	completewith	Windstone Cluster
T	loop	
T	arrowtext	Kill |cRXP_ENEMY_Al'Aketh Convert|r and\n|cRXP_ENEMY_Roiling Winds|r\nClick on |cRXP_PICK_Crystals|r
A	goto	2521,46.85,17.68,15,0
A	goto	2521,47.22,19,30,0
A	goto	2521,48.3,19.06,30,0
A	goto	2521,48.97,20.86,40,0
A	goto	2521,47.41,21.14,30,0
A	goto	2521,45.82,19.09,40,0
S	
T	completewith	next
A	complete	93552,1
S	
T	label	Al'Aketh Convert
A	complete	92465,1
A	complete	92465,2
A	complete	92466,1 << Shaman
A	mob	Al'Aketh Convert::251160
A	mob	Roiling Winds
S	
A	complete	93552,1
S	
T	label	Windstone Cluster
A	xp	3+300
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Yala Windwatcher|r
A	goto	2521,47.29,21.90
A	turnin	92465
A	accept	92469
A	target	Yala Windwatcher
S	
T	completewith	next
T	label	Harvesting Windstones2
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Dalia the Collector|r
A	goto	2521,43.89,22.27,40,0
A	turnin	93552
A	target	Dalia the Collector
S	
T	completewith	Harvesting Windstones2
T	hidewindow	
T	arrowtext	Go to\n|cRXP_FRIENDLY_Dalia the Collector|r
A	goto	2521,43.37,23.98,60
S	
T	requires	Harvesting Windstones2
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Dalia the Collector|r
A	goto	2521,43.37,23.98
A	turnin	93552
A	target	Dalia the Collector
S	
T	arrowtext	Use\n|T4625105:0|t[Mining for Dummies]
A	goto	2521,43.37,23.98
A	itemcount	247840,1
A	train	2575
A	use	247840
S	
T	arrowtext	Use\n|T4624731:0|t[Wild Harvest]
A	goto	2521,43.37,23.98
A	itemcount	247841,1
A	train	2366
A	use	247841
S	
T	arrowtext	Use\n|T4624731:0|t[Pelt Collecting for Beginners]
A	goto	2521,43.37,23.98
A	itemcount	247846,1
A	train	8613
A	use	247846
S	Alliance
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Falorne Fallwind|r
A	goto	2521,43.33,24.92
A	turnin	92597
A	target	Falorne Fallwind
S	Rogue
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Akeri Duskblade|r
A	goto	2521,43.74,24.34
A	turnin	92483
A	target	Akeri Duskblade
S	Warrior
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Blademaster Ren|r
A	goto	2521,43.66,24.14
A	train	100,1
A	skipgossipid	136813,1
A	target	Blademaster Ren
A	money	<0.01
A	xp	<4,1
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Elatrell Featherlight|r
A	goto	2521,43.44,24.80
A	turnin	92463
A	target	Elatrell Featherlight
S	Warrior
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Blademaster Ren|r
A	goto	2521,43.66,24.14
A	train	100,1
A	skipgossipid	136813,1
A	target	Blademaster Ren
A	money	<0.01
S	Warrior
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Blademaster Ren|r
A	goto	2521,43.66,24.14
A	turnin	92532
A	target	Blademaster Ren
S	Horde
T	completewith	next
T	label	TurnInGiftOfSkysightA
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Ventaari Brightwish|r
A	turnin	92598
A	target	Ventaari Brightwish::251487
S	Horde
T	completewith	TurnInGiftOfSkysightA
T	arrowtext	Buy\n|T133637:0|t[Apprentice's Herb Pouch]
A	train	2366,3
A	goto	2521,42.76,24.5
A	collect	277113,1
A	target	Uualia Suncrest::251537
S	Horde
T	completewith	TurnInGiftOfSkysightA
T	arrowtext	Buy |T134708:0|t[Mining Pick]\nand |T133635:0|t[Apprentice's Mining Pack]
A	train	2575,3
A	goto	2521,42.76,24.5
A	collect	2901,1
A	collect	277115,1
A	target	Uualia Suncrest::251537
S	Horde
T	completewith	TurnInGiftOfSkysightA
T	arrowtext	Buy |T135637:0|t[Skinning Knife]\nand |T133634:0|t[Apprentice's Skinning Satchel]
A	train	8613,3
A	goto	2521,42.76,24.5
A	collect	7005,1
A	collect	277114,1
A	target	Uualia Suncrest::251537
S	Horde
T	completewith	TurnInGiftOfSkysightA
T	arrowtext	Vendor trash
A	goto	2521,42.76,24.49
A	vendor	
S	Horde
T	requires	TurnInGiftOfSkysightA
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Ventaari Brightwish|r
A	goto	2521,42.607,24.393
A	turnin	92598
A	target	Ventaari Brightwish::251487
S	Hunter
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Tai'ree Farsight|r
A	goto	2521,42.467,23.731
A	train	13163
A	train	1978
A	target	Tai'ree Farsight::251376
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Rorian the Dayseeker|r
A	goto	2521,42.07,23.49
A	turnin	92469
A	accept	92471
A	target	Rorian the Dayseeker
S	Druid
A	goto	2521,41.653,23.337
A	train	8921
A	train	774
A	target	Xyton Silverwind::251373
S	Mage
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Dorii Brightwhisper|r
A	goto	2521,41.55,23.67
A	train	116
A	skipgossipid	136807,1
A	target	Dorii Brightwhisper
A	money	<0.01
S	Mage
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Dorii Brightwhisper|r
A	goto	2521,41.55,23.67
A	turnin	92481
A	target	Dorii Brightwhisper
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Aetheen of the Gales|r
A	goto	2521,42.76,23.65
A	turnin	92471
A	accept	92470
A	target	Aetheen of the Gales
S	Shaman
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Windshaper Boro|r
A	goto	2521,42.788,23.566
A	turnin	92466
A	accept	92467
A	target	Windshaper Boro::251374
S	Shaman
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Windshaper Boro|r
A	goto	2521,42.788,23.566
A	train	8042
A	target	Windshaper Boro
S	Shaman
T	arrowtext	Use |T134743:0|t[Earth Sapta]\nTalk to |cRXP_FRIENDLY_Minor Manifestation of Earth|r
A	goto	2521,48.802,25.869,25,0
A	goto	2521,49.677,23.806
A	turnin	92467
A	accept	92468
A	target	Minor Manifestation of Earth::251166
A	use	6635
S	Shaman
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Windshaper Boro|r
A	goto	2521,42.787,23.564
A	target	Windshaper Boro::251374
A	turnin	92468
S	Alliance
T	completewith	AggressiveVendor
T	label	Aggressive Encroachment
A	accept	92473
A	target	Valreaa Valewind
S	Alliance
T	completewith	Aggressive Encroachment
T	arrowtext	Buy\n|T133637:0|t[Apprentice's Herb Pouch]
A	train	2366,3
A	goto	2521,42.76,24.5
A	collect	277113,1
A	target	Uualia Suncrest::251537
S	Alliance
T	completewith	Aggressive Encroachment
T	arrowtext	Buy |T134708:0|t[Mining Pick]\nand |T133635:0|t[Apprentice's Mining Pack]
A	train	2575,3
A	goto	2521,42.76,24.5
A	collect	2901,1
A	collect	277115,1
A	target	Uualia Suncrest::251537
S	Alliance
T	completewith	Aggressive Encroachment
T	arrowtext	Buy |T135637:0|t[Skinning Knife]\nand |T133634:0|t[Apprentice's Skinning Satchel]
A	train	8613,3
A	goto	2521,42.76,24.5
A	collect	7005,1
A	collect	277114,1
A	target	Uualia Suncrest::251537
S	Alliance
T	label	AggressiveVendor
T	completewith	Aggressive Encroachment
T	arrowtext	Vendor trash\nBuy bags and profession tools if needed
A	goto	2521,42.76,24.5
A	vendor	
S	
T	requires	Aggressive Encroachment
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Valreaa Valewind|r
A	goto	2521,42.41,25.15
A	accept	92473
A	target	Valreaa Valewind
S	
T	loop	
T	arrowtext	Kill |cRXP_ENEMY_Scrawny Usera|r\nLoot for |T132136:0|t[|cRXP_LOOT_Scrawny Ursera Claw|r]
A	goto	2521,41.05,25.7,30,0
A	goto	2521,40.4,26.9,30,0
A	goto	2521,39.7,27.03,30,0
A	goto	2521,37.25,29.72,40,0
A	goto	2521,38.17,27.84,30,0
A	goto	2521,37.67,26.31,30,0
A	goto	2521,38.44,27.35,30,0
A	complete	92473,1
A	mob	Scrawny Ursera
S	
T	completewith	next
A	complete	92470,1
A	mob	Ursera Scavenger
S	
T	requires	Scrawny Ursera Claw2
T	label	Head of Urs'anah
T	arrowtext	Kill|cRXP_ENEMY_Ursera Scavenger|r\nand |cRXP_ENEMY_Urs'anah|r
A	goto	2521,37.52,25.6,30,0
A	goto	2521,37.36,24.63,30,0
A	goto	2521,35.88,23.31,10,0
A	goto	2521,35.65,26.06
A	complete	92470,2
A	mob	Urs'anah
S	
T	arrowtext	Kill\n|cRXP_ENEMY_Ursera Scavenger|r
T	loop	
A	goto	2521,36.2,25,30,0
A	goto	2521,36.39,23.79,30,0
A	goto	2521,37.33,24.26,30,0
A	goto	2521,36.9,24.54,30,0
A	goto	2521,37.34,25.13,30,0
A	goto	2521,38.12,27.71,30,0
A	goto	2521,37.7,29.46,30,0
A	goto	2521,40.79,26.64,30,0
A	complete	92470,1
A	mob	Ursera Scavenger
S	
T	completewith	next
T	label	Turn in Foul Matriarch
A	turnin	92470
S	
T	completewith	Turn in Foul Matriarch
T	arrowtext	Die to mobs\nand resurrect at the graveyard
T	loop	
A	goto	2521,36.47,23.67,30,0
A	goto	2521,35.88,23.79,30,0
A	goto	2521,35.71,25.7,30,0
A	deathskip	
A	subzoneskip	16673,1
S	
T	requires	Turn in Foul Matriarch
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Aetheen of the Gales|r
A	goto	2521,42.76,23.65
A	turnin	92470
A	accept	92472
A	accept	96638
A	target	Aetheen of the Gales
S	
T	completewith	next
T	label	Aggressive Encroachment2
A	turnin	92473
A	target	Valreaa Valewind
S	
T	completewith	Aggressive Encroachment2
T	arrowtext	Vendor trash
A	goto	2521,42.76,24.52
A	vendor	
S	
T	requires	Aggressive Encroachment2
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Valreaa Valewind|r
A	goto	2521,42.41,25.15
A	turnin	92473
A	target	Valreaa Valewind
S	
T	completewith	next
T	label	Al'Aketh Thugs
A	accept	92544
A	target	Hanaa Nightwind
S	
T	completewith	Al'Aketh Thugs
T	arrowtext	Go to |cRXP_FRIENDLY_Hanaa Nightwind|r\nKill mobs along the way
A	goto	2521,38.31,30.17,100
S	
T	requires	Al'Aketh Thugs
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Hanaa Nightwind|r
A	goto	2521,38.31,30.17
A	accept	92544
A	target	Hanaa Nightwind
S	
T	completewith	next
A	complete	92544,1
A	complete	92544,2
A	mob	Al'Aketh Brute::251145
A	mob	Al'Aketh Neophyte::251448
S	
T	completewith	next
T	label	Malduko Cloudcrush
T	arrowtext	Kill\n|cRXP_ENEMY_Malduko Cloudcrush|r
A	goto	2521,37.04,32.93,20,0
A	complete	92544,3
A	mob	Malduko Cloudcrush::256935
S	
T	completewith	Malduko Cloudcrush
T	arrowtext	Climb to the\nupper level of the temple
A	goto	2521,36.032,33.545,50
S	
T	requires	Malduko Cloudcrush
T	arrowtext	Kill\n|cRXP_ENEMY_Malduko Cloudcrush|r
A	goto	2521,36.032,33.545
A	complete	92544,3
A	mob	Malduko Cloudcrush::256935
S	Horde
A	isOnQuest	92544
A	goto	2521,35.910,33.605
A	cast	1259686
A	cooldown	spell,1259686,>0,1
S	
T	loop	
T	arrowtext	Kill\n|cRXP_ENEMY_Al'Aketh Brute|r and |cRXP_ENEMY_Al'Aketh Neophyte|r
A	goto	2521,35.75,31.93,40,0
A	goto	2521,35.33,34.19,30,0
A	goto	2521,36.34,31.56,40,0
A	goto	2521,37.3,32.89,40,0
A	goto	2521,37.16,34.72,40,0
A	goto	2521,38.08,35.01,40,0
A	complete	92544,1
A	complete	92544,2
A	mob	Al'Aketh Brute::251145
A	mob	Al'Aketh Neophyte::251448
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Hanaa Nightwind|r
A	goto	2521,38.32,30.18
A	turnin	92544
A	target	Hanaa Nightwind
S	
T	completewith	next
S	
A	isOnQuest	92472
T	completewith	next
T	label	The Next Step
T	hidewindow	
A	turnin	92472
S	
T	completewith	The Next Step
T	arrowtext	Vendor trash
A	goto	2521,44.72,45.47
A	vendor	
S	
T	requires	The Next Step
A	isOnQuest	92472
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Constable Aonda|r
A	goto	2521,45.67,45.51
A	turnin	92472
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Constable Aonda|r
A	goto	2521,45.67,45.51
A	accept	93461
A	accept	92514
A	target	Constable Aonda
S	Mage
A	goto	2521,45.1,45.87
A	train	143
A	train	2136
A	train	1296917
A	skipgossipid	136807,1
A	target	Dorii Brightwhisper
A	money	<0.03
A	xp	<6,1
S	Alliance
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Rathiril Sunlance|r
A	goto	2521,45.04,46.49
A	complete	93461,1
A	accept	92596
A	target	Rathiril Sunlance
S	Alliance
T	arrowtext	Listen to\n|cRXP_FRIENDLY_Rathiril Sunlance|r
A	goto	2521,45.04,46.49
A	complete	92596,1
A	skipgossipid	136139
A	skipgossipid	136138
A	skipgossipid	136137
A	skipgossipid	136136
A	skipgossipid	136135
A	skipgossipid	136134
A	skipgossipid	136133
S	Alliance
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Rathiril Sunlance|r
A	goto	2521,44.98,46.35
A	turnin	92596
A	accept	94413
A	target	Rathiril Sunlance
S	Horde
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Illaya Amberwind|r
A	goto	2521,43.52,44.78
A	complete	92514,1
A	accept	92595
A	target	Illaya Amberwind
S	Horde
T	arrowtext	Listen to\n|cRXP_FRIENDLY_Illaya Amberwind|r
A	goto	2521,43.52,44.78
A	complete	92595,1
A	target	Illaya Amberwind::251902
A	skipgossipid	135864
A	skipgossipid	135863
A	skipgossipid	135862
A	skipgossipid	135861
A	skipgossipid	135860
A	skipgossipid	135859
A	skipgossipid	135858
S	Horde
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Illaya Amberwind|r
A	goto	2521,43.52,44.78
A	turnin	92595
A	accept	94411
A	target	Illaya Amberwind
S	Shaman
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Aarnor Galestrike|r
A	goto	2521,43.454,44.872
A	trainer	
A	target	Aarnor Galestrike::254082
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Innkeeper|r
A	goto	2521,43.02,43.24
A	complete	92514,2 << Horde
A	target	the Innkeeper
S	Horde Rogue
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Miriaan Mistblade|r
A	goto	2521,43.16,43.26
A	train	1757
A	train	1776
A	skipgossipid	136810
A	target	Miriaan Mistblade
A	money	<0.02
A	xp	<6,1
S	Horde Rogue
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Miriaan Mistblade|r
A	goto	2521,43.16,43.26
A	train	1757
A	skipgossipid	136810
A	target	Miriaan Mistblade
A	xp	<6,1
S	Horde Mage
T	completewith	next
T	label	immediate wand
T	hidewindow	
A	train	7411
A	target	Nasalanna Windsinger
S	Horde Mage
T	completewith	immediate wand
A	goto	2521,43.24,43.18
A	collect	6217,1
A	collect	247786,1
A	collect	4470,1
A	skipgossipid	137558
A	target	Nasalanna Windsinger
S	Horde Mage
T	requires	immediate wand
A	goto	2521,43.24,43.18
A	train	7411
A	skipgossipid	137559
A	target	Nasalanna Windsinger
S	Horde Mage
A	isOnQuest	93461 << Alliance
A	isOnQuest	92514 << Horde
A	train	7411,3
A	collect	6218,3
A	collect	247789,1
S	Alliance Rogue
A	goto	2521,43.16,43.26
A	train	1757
A	train	1776
A	skipgossipid	136810
A	target	Miriaan Mistblade
A	money	<0.02
A	xp	<6,1
S	Alliance Rogue
A	goto	2521,43.16,43.26
A	train	1757
A	skipgossipid	136810
A	target	Miriaan Mistblade
A	xp	<6,1
S	Alliance Mage
T	completewith	next
T	label	immediate wand
T	hidewindow	
A	train	7411
A	target	Nasalanna Windsinger
S	Alliance Mage
T	completewith	immediate wand
A	goto	2521,43.24,43.18
A	collect	6217,1
A	collect	247786,3
A	collect	4470,1
A	skipgossipid	137558
A	target	Nasalanna Windsinger
S	Alliance Mage
T	requires	immediate wand
A	goto	2521,43.24,43.18
A	train	7411
A	skipgossipid	137559
A	target	Nasalanna Windsinger
S	Alliance Mage
A	isOnQuest	93461 << Alliance
A	isOnQuest	92514 << Horde
A	train	7411,3
A	collect	6218,1
A	collect	247789,1
S	Alliance
A	goto	2521,43.02,43.24
A	complete	93461,2 << Alliance
A	target	the Innkeeper
S	Warrior
A	goto	2521,44.95,45.1
A	train	3127
A	skipgossipid	136813
A	target	Corsan Earthrazer
A	money	<0.01
A	xp	<6,1
S	
A	goto	2521,45.67,45.50
A	turnin	93461
A	turnin	92514
A	accept	92517
A	target	Constable Aonda
S	Hunter
A	goto	2521,45.263,44.236
A	train	3044
A	train	1130
A	target	Elayaa Easewind::254084
S	Hunter
A	goto	2521,44.790,44.168
A	collect	2506,1
A	target	Tephri Tinderforged::257421
A	money	<0.0285
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.38
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Teeri Wellwind|r
A	goto	2521,44.47,44.98
A	accept	93319
A	accept	92516
A	target	Teeri Wellwind
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Indari Sunseam|r
A	goto	2521,44.68,44.53
A	accept	92515
A	target	Indari Sunseam
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Taleen Shimmerthread|r
A	goto	2521,44.88,44.19
A	accept	93951
A	target	Taleen Shimmerthread
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Zerril Softbreeze|r
A	goto	2521,43.850,43.840
A	accept	92553
A	target	Zerril Softbreeze::251905
S	
T	arrowtext	Click on\n|cRXP_PICK_Bounty Available: Vulgara the Insatiable!|r
A	goto	2521,43.37,45.86
A	accept	93318
A	target	Bounty Available: Vulgara the Insatiable!
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Naleeia Tattermend|r
A	goto	2521,43.073,46.306
A	train	3273
A	skipgossipid	137555
A	target	Naleeia Tattermend::257018
S	
T	completewith	BadwindBennicA
A	complete	92515,1
A	mob	Prideclaw::251245
S	
T	completewith	BadwindBennicA
A	complete	92553,2
A	complete	92553,1
A	mob	Galestrider::251661
S	Horde
T	arrowtext	Kill\n|cRXP_ENEMY_High Order Apprentices|r
A	goto	2521,46.411,38.562
A	complete	94411,1
A	mob	High Order Apprentice::257521
S	
T	completewith	BadwindBennicB
A	complete	92517,1
A	complete	93319,1
A	mob	Highlands Bandit::251918
S	
T	completewith	next
T	label	BadwindBennicA
A	complete	92517,2
A	mob	"Badwind" Bennic::255534
S	
T	completewith	BadwindBennicA
T	arrowtext	Enter the cave\nto reach |cRXP_ENEMY_"Badwind" Bennic|r
A	goto	2521,48.813,36.434,10,0
A	goto	2521,49.355,35.793,10,0
A	goto	2521,49.720,36.030,10,0
A	goto	2521,49.982,35.679,10,0
A	goto	2521,49.537,34.325,10
S	
T	requires	BadwindBennicA
T	label	BadwindBennicB
T	arrowtext	Kill\n|cRXP_ENEMY_"Badwind" Bennic|r
A	goto	2521,50.680,34.214
A	complete	92517,2
A	mob	"Badwind" Bennic::255534
S	
T	loop	
T	arrowtext	Kill\n|cRXP_ENEMY_Highlands Bandits|r
A	goto	2521,49.537,34.325,35,0
A	goto	2521,47.645,36.289,35,0
A	goto	2521,49.751,38.962,35,0
A	goto	2521,49.537,34.325,35,0
A	goto	2521,50.680,34.214,35,0
A	complete	92517,1
A	complete	93319,1
A	mob	Highlands Bandit::251918
S	
T	completewith	To Shendalar
A	complete	92553,2
A	complete	92553,1
A	mob	Galestrider::251661
S	
T	completewith	To Shendalar
A	complete	92515,1
A	mob	Prideclaw::251245
S	
T	completewith	next
T	hidewindow	
T	label	To Shendalar
A	train	2550
A	skipgossipid	137551
S	
T	completewith	To Shendalar
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Zerril Softbreeze|r
A	goto	2521,43.86,43.85
A	vendor	
A	target	Zerril Softbreeze::251905
S	
T	requires	To Shendalar
A	goto	2521,43.850,43.840
A	train	2550
A	skipgossipid	137551
A	target	Zerril Softbreeze::251905
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Raan Wildwind|r
A	goto	2521,41.67,44.79
A	turnin	96638
A	target	Raan Wildwind
A	accept	96101
S	
T	arrowtext	Use /sit\nnear the campfire
A	goto	2521,41.67,44.79
A	complete	96101,1
A	emote	SIT,263664
A	timer	60, RP
A	target	Raan Wildwind
S	
A	complete	96101,2
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Raan Wildwind|r
A	goto	2521,41.67,44.79
A	turnin	96101
A	target	Raan Wildwind
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Raan Wildwind|r
A	train	2575,3
A	goto	2521,41.658,44.784
A	accept	97970
A	target	Raan Wildwind::263664
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Raan Wildwind|r
A	train	8613,3
A	goto	2521,41.658,44.784
A	accept	97971
A	target	Raan Wildwind::263664
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Raan Wildwind|r
A	goto	2521,41.658,44.784
A	accept	96646
A	target	Raan Wildwind::263664
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Raan Wildwind|r
A	train	2366,3
A	goto	2521,41.658,44.784
A	accept	97968
A	target	Raan Wildwind::263664
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Raan Wildwind|r
A	train	3273,3
A	goto	2521,41.658,44.784
A	accept	97965
A	target	Raan Wildwind::263664
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Raan Wildwind|r
A	train	7620,3
A	goto	2521,41.658,44.784
A	accept	97967
A	target	Raan Wildwind::263664
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Raan Wildwind|r
A	train	2259,3
A	goto	2521,41.658,44.784
A	accept	97963
A	target	Raan Wildwind::263664
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Raan Wildwind|r
A	train	2018,3
A	goto	2521,41.658,44.784
A	accept	97964
A	target	Raan Wildwind::263664
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Raan Wildwind|r
A	train	3908,3
A	goto	2521,41.658,44.784
A	accept	97973
A	target	Raan Wildwind::263664
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Raan Wildwind|r
A	train	7411,3
A	goto	2521,41.658,44.784
A	accept	98286
A	target	Raan Wildwind::263664
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Raan Wildwind|r
A	train	2108,3
A	goto	2521,41.658,44.784
A	accept	97969
A	target	Raan Wildwind::263664
S	Horde
A	goto	2521,43.518,44.788
A	turnin	94411
A	target	Illaya Amberwind::251902
S	Horde
T	completewith	HippogryphHarrassmentA
T	hidewindow	
T	arrowtext	Kill |cRXP_ENEMY_Hippogryphs|r\nClick on |cRXP_PICK_Hippogryph Downs|r
T	loop	
A	goto	2521,36.44,50.93,40,0
A	goto	2521,35.16,51.07,40,0
A	goto	2521,34.12,51.6,40,0
A	goto	2521,34.52,52.76,40,0
A	goto	2521,35.12,54.08,40,0
A	goto	2521,35.58,53.08,40,0
A	goto	2521,36.02,54.28,40,0
A	goto	2521,35.72,55.36,40,0
A	goto	2521,35.63,57.34,40,0
A	goto	2521,37.13,56.6,40,0
A	goto	2521,36.61,58.64,40,0
A	goto	2521,38.61,56.89,40,0
A	goto	2521,40.22,56.94,40,0
S	
T	completewith	VulgarasHeadA
A	complete	92515,1
A	mob	Prideclaw::251245
S	
T	completewith	VulgarasHeadA
A	complete	92553,2
A	complete	92553,1
A	mob	Galestrider::251661
S	Alliance
T	arrowtext	Defeat\n|cRXP_ENEMY_Windshaper Novice Seer|r
T	loop	
A	goto	2521,39.56,47.18,35,0
A	goto	2521,38.73,47.62,35,0
A	goto	2521,37.56,47.25,35,0
A	goto	2521,38.67,46.55,35,0
A	complete	94413,1
A	mob	Windshaper Novice Seer
S	Alliance
T	completewith	HippogryphHarrassmentA
T	hidewindow	
T	arrowtext	Kill |cRXP_ENEMY_Hippogryphs|r\nClick on |cRXP_PICK_Hippogryph Downs|r
T	loop	
A	goto	2521,36.44,50.93,40,0
A	goto	2521,35.16,51.07,40,0
A	goto	2521,34.12,51.6,40,0
A	goto	2521,34.52,52.76,40,0
A	goto	2521,35.12,54.08,40,0
A	goto	2521,35.58,53.08,40,0
A	goto	2521,36.02,54.28,40,0
A	goto	2521,35.72,55.36,40,0
A	goto	2521,35.63,57.34,40,0
A	goto	2521,37.13,56.6,40,0
A	goto	2521,36.61,58.64,40,0
A	goto	2521,38.61,56.89,40,0
A	goto	2521,40.22,56.94,40,0
A	goto	2521,35.22,54.05,40,0
A	goto	2521,33.1,54.67,40,0
S	
T	completewith	next
A	complete	92516,1
A	complete	92516,2
A	complete	92516,3
A	mob	Hippogryph Matriarch::251261
A	mob	Hippogryph Protector::251284
A	mob	Hippogryph Youth::251291
S	
A	complete	93951,1
S	
T	label	HippogryphHarrassmentA
A	complete	92516,1
A	complete	92516,2
A	complete	92516,3
A	mob	Hippogryph Matriarch::251261
A	mob	Hippogryph Protector::251284
A	mob	Hippogryph Youth::251291
S	
T	completewith	next
A	complete	92553,2
A	complete	92553,1
A	mob	Galestrider::251661
S	
T	loop	
A	goto	2521,43.07,48.51,40,0
A	goto	2521,37.56,43.24,40,0
A	goto	2521,40.04,41.38,40,0
A	complete	92515,1
A	mob	Prideclaw::251245
S	
T	label	VulgarasHeadA
T	arrowtext	Kill\n|cRXP_ENEMY_Vulgara|r
A	goto	2521,43.079,51.028,15,0
A	goto	2521,42.978,51.803,15,0
A	goto	2521,42.75,52.68
A	complete	93318,1
A	mob	Vulgara
S	
A	isQuestComplete	97965
A	isQuestAvailable	92517
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Naleeia Tattermend|r
A	goto	2521,43.08,46.31
A	turnin	97965
A	target	Naleeia Tattermend::257018
S	
A	train	2366,3
A	isQuestComplete	97968
A	isQuestAvailable	92517
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Halassa Fernbreeze|r
A	goto	2521,42.97,43.54
A	turnin	97968
A	target	Halassa Fernbreeze::257021
S	
A	train	7411,3
A	isQuestComplete	98286
A	isQuestAvailable	92517
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Nasalanna Windsinger|r
A	goto	2521,43.25,43.16
A	turnin	98286
A	target	Nasalanna Windsinger::257020
S	
A	train	8613,3
A	isQuestComplete	97971
A	isQuestAvailable	92517
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Mendalass Tattermend|r
A	goto	2521,43.3,43.37
A	turnin	97971
A	target	Mendalass Tattermend::257024
S	
A	isOnQuest	93036
A	isQuestAvailable	92517
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Zerril Softbreeze|r\n Don't sell Strider meat &eggs
A	goto	2521,43.851,43.848
A	vendor	
A	collect	2678,5
A	skipgossipid	137550
A	target	Zerril Softbreeze::251905
S	
A	isQuestComplete	92553
A	isQuestAvailable	92517
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Zerril Softbreeze|r
A	goto	2521,43.851,43.848
A	turnin	92553
A	target	Zerril Softbreeze::251905
S	
A	isQuestComplete	96646
A	isQuestAvailable	92517
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Zerril Softbreeze|r
A	goto	2521,43.851,43.848
A	turnin	96646
A	target	Zerril Softbreeze::251905
S	
A	isOnQuest	92553
A	isQuestAvailable	92517
A	itemcount	1971,<3
T	arrowtext	Craft Herb Baked Egg \ Keep 3 Small Eggs
A	goto	2521,43.86,43.85
A	collect	6888,1
S	
A	isQuestTurnedIn	92553
A	isQuestAvailable	92517
A	itemcount	1971,<1
A	goto	2521,43.86,43.85
A	collect	6888,1
S	
A	isQuestComplete	97963
A	isQuestAvailable	92517
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Nyassa Swiftdraught|r
A	goto	2521,43.7,43.43
A	turnin	97963
A	target	Nyassa Swiftdraught::257019
S	Hunter
A	goto	2521,44.790,44.168
A	collect	2506,1
A	target	Tephri Tinderforged::257421
A	money	<0.0285
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.38
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Taleen Shimmerthread|r
A	goto	2521,44.873,44.187
A	target	Taleen Shimmerthread::251991
A	turnin	93951
S	
A	isQuestAvailable	92517
A	isQuestComplete	97973
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Taleen Shimmerthread|r
A	goto	2521,44.88,44.19
A	turnin	97973
A	target	Taleen Shimmerthread::251991
S	
A	isQuestAvailable	92517
A	isQuestComplete	97964
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Aedi Thriceforged|r
A	goto	2521,44.89,44.36
A	turnin	97964
A	target	Aedi Thriceforged::251913
S	
A	isQuestAvailable	92517
A	isQuestComplete	97970
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Messana Crestwind|r
A	goto	2521,44.77,44.57
A	turnin	97970
A	target	Messana Crestwind::257022
S	
A	isQuestAvailable	92517
A	isQuestComplete	92515
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Indari Sunseam|r
A	goto	2521,44.686,44.518
A	target	Indari Sunseam::251993
A	turnin	92515
S	
A	isQuestAvailable	92517
A	isQuestComplete	97969
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Indari Sunseam|r
A	goto	2521,44.69,44.53
A	turnin	97969
A	target	Indari Sunseam::251993
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Teeri Wellwind|r
A	goto	2521,44.465,44.966
A	target	Teeri Wellwind::251906
A	turnin	92516
A	turnin	93319
S	
A	isOnQuest	93318
A	isQuestComplete	93318
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Danarii Bellowveil|r
A	goto	2521,45.234,45.186
A	target	Danarii Bellowveil::252172
A	turnin	93318
S	
A	abandon	93318
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Constable Aonda|r
A	goto	2521,45.667,45.500
A	target	Constable Aonda::251523
A	turnin	92517
A	accept	93036
S	Hunter
A	goto	2521,45.263,44.236
A	train	5116
A	train	3127
A	target	Elayaa Easewind::254084
S	Druid
A	goto	2521,45.153,44.225
A	trainer	
A	target	Naeluna Swiftmend::254081
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Sania Silverstream|r
A	goto	2521,44.831,45.515
A	target	Sania Silverstream::251904
A	turnin	93036
A	accept	92529
S	
A	isOnQuest	92529
A	subzoneskip	16624,1
A	goto	2521,44.831,45.515
A	target	Sania Silverstream::251904
A	aura	1254832
A	skipgossipid	135874
S	Rogue
A	goto	2521,43.15,43.27
A	train	5277
A	train	6760
A	skipgossipid	136810
A	target	Miriaan Mistblade
A	money	<0.04
A	xp	<6,1
S	Shaman
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Aarnor Galestrike|r
A	goto	2521,43.454,44.872
A	trainer	
A	target	Aarnor Galestrike::254082
S	Alliance
A	goto	2521,44.979,46.365
A	target	Rathiril Sunlance::251903
A	turnin	94413
S	
A	isQuestComplete	97967
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Fenn Fairweather|r
A	goto	2521,45.03,48.45
A	turnin	97967
A	target	Fenn Fairweather::251992
S	
T	completewith	
A	complete	92553,2
A	complete	92553,1
A	mob	Galestrider::251661
S	
T	completewith	
A	complete	92515,1
A	mob	Prideclaw::251245
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Missionary Jasaan|r
A	goto	2521,46.880,56.242
A	target	Missionary Jasaan::257065
A	turnin	92529
A	accept	92528
S	
A	isOnQuest	92528
A	subzoneskip	16636,1
A	goto	2521,46.89,56.24
A	target	Missionary Jasaan::257065
A	aura	1254832
A	skipgossipid	137586
S	
T	completewith	next
T	label	plans
A	goto	2521,48.8,53.89,10,0
A	goto	2521,48.93,53.55,10,0
A	complete	92528,1
S	
T	completewith	plans
A	goto	2521,48.85,53.91
A	vehicle	
A	timer	14,RP
A	skipgossipid	136768
S	
T	requires	plans
T	arrowtext	Click on the |cRXP_PICK_Wardrobe|r
A	goto	2521,48.6,54.69,30,0
A	goto	2521,46.44,51.34,30,0
A	complete	92528,1
A	macro	Leave Vehicle,6656430
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Constable Aonda|r
A	goto	2521,46.44,51.34,30,0
A	goto	2521,44.37,46.69,30,0
A	goto	2521,44.49,45.95,30,0
A	goto	2521,44.93,46.85,30,0
A	goto	2521,45.21,46.63,30,0
A	goto	2521,45.04,46.23,15,0
A	goto	2521,45.67,45.50
A	turnin	92528
A	accept	92550
A	accept	93926
A	target	Constable Aonda
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Danarii Bellowveil|r
A	goto	2521,45.25,45.18
A	accept	92551
A	target	Danarii Bellowveil
S	
T	completewith	next
T	label	Western Watchtower
A	complete	93926,1
S	
T	completewith	Western W2tchtower
A	goto	2521,45.35,46.79,20,0
A	goto	2521,44.05,49.98,30,0
A	goto	2521,43.02,49.86
A	deathskip	
A	target	Spirit Healer
S	
T	requires	Western Watchtower
T	arrowtext	Talk to |cRXP_FRIENDLY_Piecekeeper Vaniel|r
A	goto	2521,42.32,62.03
A	complete	93926,1
A	target	Piecekeeper Vaniel::252155
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Peacekeeper Vaaniel|r
A	goto	2521,42.33,62.01
A	turnin	93926
A	accept	93927
A	target	Piecekeeper Vaniel::252155
S	
T	arrowtext	Click on the |cRXP_PICK_Note|r
A	goto	2521,42.38,62.07
A	complete	93927,1
S	
T	arrowtext	Click on |cRXP_PICK_Arvensus Shadowsong|r\n from afar
A	goto	2521,40.988,64.088
A	complete	93927,4
S	
T	arrowtext	Click on |cRXP_PICK_Raani Windgazer|r\n from afar
A	goto	2521,41.12,64.09
A	complete	93927,3
S	
T	arrowtext	Kill\n|cRXP_ENEMY_Skypriest Aanders|r
A	goto	2521,41.09,64.38
A	complete	93927,2
A	mob	Skypriest Aanders
S	
T	completewith	CommanderCyclasHeadA
A	complete	92550,2
A	mob	Living Lightning
S	
T	completewith	CommanderCyclasHeadA
A	complete	92550,1
A	complete	92551,1
A	mob	Al'Aketh Stormcaller
S	
T	label	CommanderCyclasHeadA
T	arrowtext	Kill |cRXP_ENEMY_Commander Cyclas|r\nLoot |T134161:0|t[|cRXP_LOOT_Commander Cyclas's Head|r]
A	goto	2521,50.29,56.95
A	complete	92550,3
S	
T	completewith	LivingLightningA
T	hidewindow	
T	loop	
A	goto	2521,49.765,57.237,15,0
A	goto	2521,49.877,56.539,25,0
A	goto	2521,49.629,54.728,25,0
A	goto	2521,48.823,54.315,15,0
A	goto	2521,49.058,53.545,15,0
A	goto	2521,47.641,54.140,30,0
S	
T	completewith	next
A	complete	92550,2
A	mob	Living Lightning
S	
A	complete	92550,1
A	complete	92551,1
A	mob	Al'Aketh Stormcaller
S	
T	label	LivingLightningA
A	complete	92550,2
A	mob	Living Lightning
S	
A	isQuestComplete	97967
A	isQuestAvailable	92550
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Fenn Fairweather|r
A	goto	2521,45.03,48.45
A	turnin	97967
A	target	Fenn Fairweather::251992
S	
A	isQuestComplete	97965
A	isQuestAvailable	92550
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Naleeia Tattermend|r
A	goto	2521,43.08,46.31
A	turnin	97965
A	target	Naleeia Tattermend::257018
S	
A	train	2366,3
A	isQuestComplete	97968
A	isQuestAvailable	92550
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Halassa Fernbreeze|r
A	goto	2521,42.97,43.54
A	turnin	97968
A	target	Halassa Fernbreeze::257021
S	
A	train	7411,3
A	isQuestComplete	98286
A	isQuestAvailable	92550
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Nasalanna Windsinger|r
A	goto	2521,43.25,43.16
A	turnin	98286
A	target	Nasalanna Windsinger::257020
S	
A	train	8613,3
A	isQuestComplete	97971
A	isQuestAvailable	92550
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Mendalass Tattermend|r
A	goto	2521,43.3,43.37
A	turnin	97971
A	target	Mendalass Tattermend::257024
S	
A	isQuestComplete	92553
A	isQuestAvailable	92550
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Zerril Softbreeze|r
A	goto	2521,43.851,43.848
A	turnin	92553
A	target	Zerril Softbreeze::251905
S	
A	isQuestComplete	96646
A	isQuestAvailable	92550
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Zerril Softbreeze|r
A	goto	2521,43.851,43.848
A	turnin	96646
A	target	Zerril Softbreeze::251905
S	
A	isQuestComplete	97963
A	isQuestAvailable	92550
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Nyassa Swiftdraught|r
A	goto	2521,43.7,43.43
A	turnin	97963
A	target	Nyassa Swiftdraught::257019
S	
A	isQuestComplete	97973
A	isQuestAvailable	92550
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Taleen Shimmerthread|r
A	goto	2521,44.88,44.19
A	turnin	97973
A	target	Taleen Shimmerthread::251991
S	
A	isQuestComplete	97964
A	isQuestAvailable	92550
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Aedi Thriceforged|r
A	goto	2521,44.89,44.36
A	turnin	97964
A	target	Aedi Thriceforged::251913
S	
A	isQuestComplete	97970
A	isQuestAvailable	92550
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Messana Crestwind|r
A	goto	2521,44.77,44.57
A	turnin	97970
A	target	Messana Crestwind::257022
S	
A	isQuestComplete	92515
A	isQuestAvailable	92550
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Indari Sunseam|r
A	goto	2521,44.686,44.518
A	target	Indari Sunseam::251993
A	turnin	92515
S	
A	isQuestComplete	97969
A	isQuestAvailable	92550
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Indari Sunseam|r
A	goto	2521,44.69,44.53
A	turnin	97969
A	target	Indari Sunseam::251993
S	
T	completewith	next
T	label	StolenSuppliesA
A	turnin	92551
A	target	Danarii Bellowveil
S	
T	arrowtext	Follow the way\nup the mountain
T	completewith	StolenSuppliesA
A	isQuestNotComplete	97967
A	isQuestNotComplete	97965
A	isQuestNotComplete	97968
A	isQuestNotComplete	98286
A	isQuestNotComplete	97971
A	isQuestNotComplete	97963
A	isQuestNotComplete	97973
A	isQuestNotComplete	97964
A	isQuestNotComplete	97970
A	isQuestNotComplete	97969
A	goto	2521,44.111,45.843,10
S	
T	requires	StolenSuppliesA
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Danarii Bellowveil|r
A	goto	2521,45.24,45.19
A	turnin	92551
A	target	Danarii Bellowveil
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Constable Aonda|r
A	goto	2521,45.67,45.50
A	turnin	92550
A	turnin	93927
A	accept	92701
A	accept	92579
A	accept	93948
A	target	Constable Aonda
S	
A	goto	2521,60.640,72.664
A	target	Nyalah Brightfire::257006
A	accept	93317
S	
A	target	Donaal Downbreeze::255940
A	bindlocation	16638
A	goto	2521,62.180,72.616
A	home	
S	
A	goto	2521,62.096,73.339
A	target	Alvarion Windfield::252448
A	accept	92679
S	
A	goto	2521,63.973,75.095
A	target	Lotheluum Starbreeze::252359
A	accept	94484
S	
A	goto	2521,65.956,74.309
A	target	Ealaane Nimbuswalker::259012
A	accept	94896
A	accept	94897
S	
T	completewith	next
T	label	DeliverTheSignetA
A	turnin	93948
A	target	Talaanis Shadowsong
S	
T	completewith	DeliverTheSignetA
T	arrowtext	Climb the tower
A	goto	2521,65.749,76.287,10,0
A	goto	2521,66.479,76.715,8,0
A	goto	2521,66.488,76.458,8,0
A	goto	2521,66.389,77.095,8,0
A	goto	2521,65.962,76.525,8,0
A	goto	2521,66.285,76.160,8,0
A	goto	2521,66.423,76.660,8
S	
T	requires	DeliverTheSignetA
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Talaanis Shadowsong|r
A	goto	2521,66.17,76.51
A	turnin	93948
A	target	Talaanis Shadowsong
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Valennia Stormfist|r
A	goto	2521,66.18,76.65
A	turnin	92701
A	turnin	92579
A	accept	92699
A	accept	92700
A	accept	93949
A	target	Valennia Stormfist
S	
T	completewith	LeavingValanaarA
A	complete	93949,1
A	mob	Skyhopper
S	Alliance
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Elaadrin Evengale|r
A	goto	2521,66.63,79.94
A	turnin	92699
A	accept	92709
A	target	Elaadrin Evengale
S	Alliance
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Dondallion Whisperwind|r
A	goto	2521,66.26,79.89
A	accept	92727
A	target	Dondallion Whisperwind
S	Alliance
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Iaadaria Bitterwind|r
A	goto	2521,66.35,79.51
A	accept	92741
A	target	Iaadaria Bitterwind
S	Alliance
T	arrowtext	Listen to\n|cRXP_FRIENDLY_Elaadrin Evengale|r
A	goto	2521,64.17,79.43
A	complete	92709,1
S	Alliance
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Elaadrin Evengale|r
A	goto	2521,66.63,79.94
A	turnin	92709
A	target	Elaadrin Evengale
S	Hunter
A	goto	2521,63.027,77.807
A	collect	2512,600,6394,1 << Hunter
A	target	Antelariaa Cloudgaze::252390
S	Horde
A	goto	2521,61.491,76.893,15,0
A	goto	2521,59.349,77.930,25,0
A	goto	2521,59.154,79.783
A	turnin	92700
A	accept	92708
A	accept	93735
A	target	Ayessa Dawnsinger::251968
S	Horde
A	goto	2521,58.128,78.307
A	accept	93736
A	target	Endaria Mistgaze::254344
S	Horde
A	goto	2521,59.265,79.977
A	complete	92708,1
S	Horde
A	goto	2521,59.150,79.790
A	target	Ayessa Dawnsinger::251968
A	turnin	92708
S	Horde
T	label	LeavingValanaarA
A	goto	2521,59.064,72.989
A	target	Riaani Nightwind::256083
A	turnin	93735
A	accept	93737
A	complete	93737,1
S	Alliance
T	arrowtext	Click on\n|cRXP_FRIENDLY_Bloodstained Satchel|r
A	goto	2521,53.33,72.15
A	turnin	92727
A	accept	92849
A	target	Bloodstained Satchel
S	Alliance
T	label	LeavingValanaarA
T	arrowtext	Follow the arrow
A	goto	2521,50.67,65.38
A	complete	92849,1
A	skipgossipid	136430
S	Alliance
T	arrowtext	Carry |cRXP_FRIENDLY_Fillion Flamebreeze|r\nto safety
A	goto	2521,52.05,69.40
A	complete	92849,2
S	Alliance
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Fillion Flamebreeze|r
A	goto	2521,52.07,69.40
A	turnin	92849
A	accept	92850
A	target	Fillion Flamebreeze
S	Alliance
T	arrowtext	Kill |cRXP_ENEMY_Shriekling Matriarch|r\nLoot for |cRXP_LOOT_Shriekling Matriarch's Head|r
A	goto	2521,52.02,65.51
A	complete	92850,1
S	
T	loop	
A	goto	2521,49.085,78.358,12,0
A	goto	2521,48.621,78.385,12,0
A	accept	92698
A	target	Malfunctioning Cyclone Construct::250929
S	
T	arrowtext	Follow the arrow
A	goto	2521,46.71,81.95
A	complete	92679,1
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Aamelia Windfield|r
T	loop	
A	goto	2521,46.71,81.94,10,0
A	goto	2521,47.511,78.490,10,0
A	turnin	92679
A	turnin	92698
A	accept	92682
A	accept	92684
A	accept	92683
A	target	Aamelia Windfield:252800
S	
T	completewith	RipBanditsA
A	complete	92683,1
A	mob	Flutterfly::251622
S	
T	completewith	RipBanditsA
A	complete	92684,1
A	mob	Ornery Galestrider::251707
S	
T	label	RipBanditsA
T	arrowtext	Kill |cRXP_ENEMY_Bandits|r|cRXP_WARN_(invisible)|r\nClick on |cRXP_LOOT_Ripe Stormapples|r
T	loop	
A	goto	2521,46.164,78.043,30,0
A	goto	2521,48.920,84.441,30,0
A	complete	92682,1
A	complete	92682,2
A	mob	Hungry Bandit::252802
S	
T	completewith	next
A	complete	92684,1
A	mob	Ornery Galestrider::251707
S	
T	loop	
A	goto	2521,51.686,83.417,45,0
A	goto	2521,50.017,77.659,35,0
A	goto	2521,46.692,76.947,35,0
T	arrowtext	Use |T537768:0|t[Swatter]\non |cRXP_ENEMY_Flutterflies|r
A	complete	92683,1
A	mob	Flutterfly::251622
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Aamelia Windfield|r
T	loop	
A	goto	2521,47.511,78.490,10,0
A	goto	2521,46.71,81.94,10,0
A	turnin	92682
A	turnin	92684
A	turnin	92698
A	turnin	92683
A	accept	92685
A	target	Aamelia Windfield:252800
S	Horde
T	completewith	next
A	complete	92685,1
A	mob	Bandit Highwayman::252820
S	Horde
T	loop	
A	goto	2521,44.970,73.377,35,0
A	goto	2521,44.921,73.382,35,0
A	complete	93737,4
S	
T	loop	
A	goto	2521,45.615,72.361,35,0
A	goto	2521,43.551,74.999,35,0
A	goto	2521,45.760,78.419,35,0
T	arrowtext	Kill |cRXP_ENEMY_Bandit Highwaymen|r\nLoot for |T133693:0|t[|cRXP_LOOT_Bandit Masks|r].
A	complete	92685,1
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Aamelia Windfield|r
T	loop	
A	goto	2521,47.511,78.490,10,0
A	goto	2521,46.71,81.94,10,0
A	turnin	92685
A	accept	92693
A	target	Aamelia Windfield:252800
S	
A	goto	2521,46.71,81.94
A	complete	92693,1
A	timer	75,Roleplay Duration
A	target	Aamelia Windfield
A	skipgossipid	136302
S	
T	arrowtext	Follow |cRXP_FRIENDLY_Aamelia Windfield|r\nWait for the roleplay
A	goto	2521,47.51,78.44
A	complete	92693,2
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Aamelia Windfield|r
T	loop	
A	goto	2521,47.511,78.490,10,0
A	goto	2521,46.71,81.94,10,0
A	turnin	92693
A	accept	92703
A	target	Aamelia Windfield:252800
S	
T	completewith	next
A	hs	
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Alvarion Windfield|r
A	goto	2521,62.11,73.33
A	turnin	92703
A	target	Alvarion Windfield
S	
T	loop	
A	goto	2521,65.577,76.650,25,0
A	goto	2521,64.174,78.274,25,0
A	goto	2521,62.345,76.662,25,0
A	goto	2521,60.762,73.034,25,0
A	goto	2521,58.001,75.831,25,0
A	complete	93949,1
A	mob	Skyhopper
S	Hunter
A	goto	2521,59.571,72.639
A	train	13165
A	train	13549
A	target	Quel'ana Quickgale::252389
S	Hunter
A	goto	2521,59.572,72.639
A	target	Quel'ana Quickgale::252389
A	accept	94978
S	Hunter
A	goto	2521,59.571,72.639
A	turnin	94978
A	accept	94979
A	target	Quel'ana Quickgale::252389
S	Hunter
T	loop	
A	goto	2521,60.905,69.414,35,0
A	goto	2521,58.339,68.476,35,0
A	goto	2521,53.799,72.161,35,0
A	complete	94979,1
A	mob	Ornery Galestrider
S	Hunter
A	goto	2521,59.571,72.639
A	turnin	94979
A	accept	94013
A	target	Quel'ana Quickgale::252389
S	Hunter
T	loop	
A	goto	2521,61.944,68.828,35,0
A	goto	2521,59.516,64.846,35,0
A	goto	2521,57.041,67.729,35,0
A	goto	2521,54.322,75.080,35,0
A	goto	2521,51.925,80.458,35,0
A	goto	2521,52.920,81.509,35,0
A	complete	94013,1
A	mob	Vuldren::250874
S	Hunter
A	goto	2521,59.571,72.639
A	turnin	94013
A	accept	94050
A	target	Quel'ana Quickgale::252389
S	Hunter
A	goto	2521,59.605,72.527
A	turnin	94050
A	target	Quel'dora Quickgale::254411
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Belann Windwood|r
A	goto	2521,62.90,77.45
A	accept	93791
A	turnin	93791
A	target	Belann Windwood
S	Mage
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Belann Windwood|r
A	goto	2521,62.90,77.45
A	accept	93797
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Dondallion Whisperwind|r
A	goto	2521,66.26,79.90
A	turnin	92850
A	target	Dondallion Whisperwind
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Elaadrin Evengale|r
A	goto	2521,66.63,79.94
A	accept	92840
A	target	Elaadrin Evengale
S	
T	arrowtext	Protect the Index
A	goto	2521,47.93,69.05
A	complete	92840,1
S	Magic
T	arrowtext	Collect\n|cRXP_LOOT_Wind-Infused Bough|r
A	goto	2521,48.49,67.81
A	complete	93797,1
S	
T	arrowtext	Collect\n|cRXP_LOOT_Windsong Crawler Meat|r
A	goto	2521,52.58,60.50
A	complete	93317,1
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Nyalah Brightfire|r
A	goto	2521,60.64,72.66
A	turnin	93317
A	target	Nyalah Brightfire
S	Magic
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Belann Windwood|r
A	goto	2521,62.89,77.44
A	turnin	93797
A	target	Belann Windwood
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Elaadrin Evengale|r
A	goto	2521,66.63,79.93
A	turnin	92840
A	accept	92834
A	accept	92860
A	target	Elaadrin Evengale
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Valennia Stormfist|r
A	goto	2521,66.18,76.66
A	turnin	92860
A	accept	93320
A	target	Valennia Stormfist
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Yorana Windyreed|r
A	goto	2521,69.64,67.07
A	turnin	93320
A	accept	92642
A	accept	92645
A	target	Yorana Windyreed
S	
T	arrowtext	Kill\n|cRXP_ENEMY_Commander Belguilos|r
A	goto	2521,65.67,65.58
A	complete	92645,1
A	mob	Commander Belguilos
S	
T	arrowtext	Kill\n|cRXP_ENEMY_Al'Aketh Healer|r
A	goto	2521,66.09,67.72
A	complete	92642,1
A	mob	Al'Aketh Healer
S	
T	arrowtext	Kill\n|cRXP_ENEMY_Al'Aketh Brawler|r
A	goto	2521,65.42,67.27
A	complete	92642,2
A	mob	Al'Aketh Brawler
S	
T	arrowtext	Collect\n|cRXP_LOOT_Al'Aketh Windstone Charm|r
A	goto	2521,65.43,67.44
A	complete	92834,1
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Yorana Windyreed|r
A	goto	2521,69.61,67.10
A	turnin	92645
A	turnin	92642
A	accept	92880
A	target	Yorana Windyreed
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Valennia Stormfist|r
A	goto	2521,66.20,76.66
A	turnin	92880
A	accept	92881
A	target	Valennia Stormfist
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Talaanis Shadowsong|r
A	goto	2521,66.17,76.50
A	turnin	92881
A	accept	92643
A	target	Talaanis Shadowsong
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Elaadrin Evengale|r
A	goto	2521,66.63,79.94
A	turnin	92834
A	target	Elaadrin Evengale
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Fendaal Windstone|r
A	goto	2521,56.81,61.11
A	accept	98512
A	target	Fendaal Windstone
S	
T	arrowtext	Follow the arrow
A	goto	2521,56.06,60.85
A	complete	92643,1
S	
T	arrowtext	Kill\n|cRXP_ENEMY_Al'Aketh Assassin|r
A	goto	2521,55.66,59.87
A	complete	98512,1
A	mob	Al'Aketh Assassin
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Fendaal Windstone|r
A	goto	2521,56.80,61.10
A	turnin	98512
A	target	Fendaal Windstone
S	
T	arrowtext	Follow the arrow
A	goto	2521,56.49,60.86
A	complete	92643,2
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Dead Cultist|r
A	goto	2521,56.03,58.80
A	turnin	92643
A	accept	92644
A	target	Dead Cultist
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Talaanis Shadowsong|r
A	goto	2521,66.17,76.52
A	turnin	92644
A	accept	94568
A	target	Talaanis Shadowsong
S	
A	skipgossipid	140111
A	complete	94568,1
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Talaanis Shadowsong|r
A	goto	2521,66.17,76.51
A	turnin	94568
A	accept	92640
A	target	Talaanis Shadowsong
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Valennia Stormfist|r
A	goto	2521,66.18,76.65
A	complete	92640,1
A	target	Valennia Stormfist
A	skipgossipid	137096
A	skipgossipid	137095
S	
T	arrowtext	Recruit the Windshapers
A	goto	2521,59.15,79.79
A	complete	92640,2
A	skipgossipid	136542
A	skipgossipid	136541
S	
T	arrowtext	Recruit the High Order
A	goto	2521,66.54,79.89
A	complete	92640,3
A	skipgossipid	136547
A	skipgossipid	136546
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Valennia Stormfist|r
A	goto	2521,66.18,76.65
A	turnin	92640
A	accept	93065
A	target	Valennia Stormfist
S	
T	arrowtext	Follow the arrow
A	goto	2521,61.15,70.91
A	complete	93065,1
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Valennia Stormfist|r
A	goto	2521,61.15,70.93
A	turnin	93065
A	accept	92947
A	target	Valennia Stormfist
S	
T	arrowtext	Kill |cRXP_ENEMY_Al'Aketh Guardian|r,\n|cRXP_ENEMY_Al'Aketh Spiritcaller|r and\n|cRXP_ENEMY_Al'Aketh Blademaster|r
A	goto	2521,61.29,49.50
A	complete	92947,1
A	complete	92947,2
A	complete	92947,3
A	mob	Al'Aketh Guardian
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Hyusaa Quickbreeze|r
A	goto	2521,63.79,50.55
A	complete	92947,4
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Hyusaa Quickbreeze|r
A	goto	2521,63.79,50.55
A	turnin	92947
A	accept	93958
A	target	Hyusaa Quickbreeze
S	
A	goto	2521,65.19,50.37
A	turnin	93958
S	
A	goto	2521,65.19,50.37
A	accept	93835
S	
T	arrowtext	Confront Lorthuna
A	goto	2521,75.34,53.32
A	complete	93835,1
A	skipgossipid	137230
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Elaadrin Evengale|r
A	goto	2521,66.63,79.93
A	turnin	93835
A	accept	94369
A	target	Elaadrin Evengale
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Talaanis Shadowsong|r
A	goto	2521,66.17,76.50
A	complete	94369,1
A	target	Talaanis Shadowsong
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Talaanis Shadowsong|r
A	goto	2521,66.18,76.51
A	turnin	94369
A	accept	93089
A	target	Talaanis Shadowsong
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Elaadrin Evengale|r
A	goto	2521,66.63,79.95
A	turnin	93089
A	accept	94946
A	target	Elaadrin Evengale
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Strange Hermit|r
A	goto	2521,53.95,38.90
A	accept	93159
A	target	Strange Hermit
S	
A	goto	2521,53.95,38.90
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Strange Hermit|r
A	complete	93159,1
A	target	Strange Hermit
A	skipgossipid	135787
A	skipgossipid	135786
A	skipgossipid	135785
A	skipgossipid	135784
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Strange Hermit|r
A	goto	2521,53.96,38.90
A	turnin	93159
A	accept	93160
A	accept	93172
A	target	Strange Hermit
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Strange Hermit|r
A	goto	2521,53.96,38.90
A	accept	98285
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Strange Hermit|r
A	goto	2521,53.96,38.90
A	complete	98285,1
S	
T	arrowtext	Collect\n|cRXP_LOOT_Zephyrseed|r
A	goto	2521,56.84,38.03
A	complete	93160,1
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Elegael Thornpaw|r
A	goto	2521,61.76,39.14
A	turnin	94484
A	accept	94485
A	accept	94486
A	accept	94487
S	
T	arrowtext	Collect\n|cRXP_LOOT_Zephyrseed|r
A	goto	2521,56.84,38.03
A	complete	93160,1
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Vayn Moongaze|r
A	goto	2521,63.80,36.03
A	accept	93165
A	target	Vayn Moongaze
S	
T	arrowtext	Collect\n|cRXP_LOOT_Shriekling Talons|r
A	goto	2521,59.36,40.07
A	complete	92741,1
S	
T	arrowtext	Collect\n|cRXP_LOOT_Lady's Tear Moss|r
A	goto	2521,59.80,40.38
A	complete	94485,1
S	
T	arrowtext	Collect\n|cRXP_LOOT_Pristine Shriekling Feathers|r
A	goto	2521,55.93,38.96
A	complete	94486,1
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Strange Hermit|r
A	goto	2521,53.97,38.92
A	turnin	93160
A	target	Strange Hermit
S	
T	arrowtext	Collect\n|cRXP_LOOT_Bloody Heirloom|r
A	goto	2521,62.69,36.46
A	complete	94487,1
S	
T	arrowtext	Collect\n|cRXP_LOOT_Al'Alketh Cultist's Ear|r
A	goto	2521,63.85,37.16
A	complete	93165,1
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Elegael Thornpaw|r
A	goto	2521,61.76,39.13
A	turnin	94485
A	turnin	94487
A	turnin	94486
A	accept	94488
A	accept	94489
A	target	Elegael Thornpaw
S	
T	arrowtext	Kill and loot\n|cRXP_ENEMY_Commander Haalien|r
A	goto	2521,65.05,36.66
A	complete	94488,1
S	
T	arrowtext	Find the\n|cRXP_PICK_Ripped Missive|r
A	goto	2521,64.77,37.11
A	accept	94490
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Elegael Thornpaw|r
A	goto	2521,61.76,39.13
A	turnin	94490
A	turnin	94488
A	accept	94491
A	target	Elegael Thornpaw
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Vayn Moongaze|r
A	goto	2521,63.80,36.00
A	turnin	93165
A	target	Vayn Moongaze
S	
T	arrowtext	Find\n|cRXP_FRIENDLY_Jorel Windsinger|r
A	goto	2521,64.49,34.74
A	complete	94489,2
A	skipgossipid	137859
S	
T	arrowtext	Heal\n|cRXP_FRIENDLY_Injured Druids|r
A	goto	2521,65.91,33.54
A	complete	94489,1
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Elegael Thornpaw|r
A	goto	2521,61.77,39.14
A	turnin	94489
A	target	Elegael Thornpaw
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Vayn Moongaze|r
A	goto	2521,63.80,35.99
A	turnin	93459
A	target	Vayn Moongaze
S	
T	arrowtext	Collect\n|cRXP_LOOT_Abandoned Belongings|r
A	goto	2521,56.65,29.37
A	complete	94896,1
S	
T	arrowtext	Free\n|cRXP_FRIENDLY_Wind Hollow|r
A	goto	2521,58.59,31.08
A	complete	93172,1
S	
T	arrowtext	Recover\n|cRXP_LOOT_Resaan's Heirloom|r
A	goto	2521,57.04,29.36
A	complete	94897,1
A	skipgossipid	138670
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Strange Hermit|r
A	goto	2521,53.97,38.90
A	turnin	93172
A	target	Strange Hermit
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Lotheluum Starbreeze|r
A	goto	2521,63.98,75.08
A	turnin	94491
A	target	Lotheluum Starbreeze
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Ealaane Nimbuswalker|r
A	goto	2521,65.95,74.31
A	turnin	94896
A	turnin	94897
A	target	Ealaane Nimbuswalker
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Iaadaria Bitterwind|r
A	goto	2521,66.34,79.51
A	turnin	92741
A	target	Iaadaria Bitterwind
S	
T	arrowtext	Talk to the quest giver\nin Dalaran
A	goto	1416/0,438.93,448.88
A	turnin	94946
S	
T	arrowtext	Talk to the quest giver\nin Dalaran
A	goto	1416/0,438.93,448.88
A	accept	94947
S	
T	arrowtext	Take the\n|cRXP_PICK_Skyborne Portal to Stormwind|r
A	goto	1416/0,445.93,450.00
A	complete	94947,1
S	
T	arrowtext	Talk to the quest giver\nin Stormwind
A	goto	1453/0,332.000,-8443.101
A	target	Highlord Bolvar Fordragon::1748
A	turnin	94947
A	accept	93963
A	accept	98021
S	
T	arrowtext	Talk to\n|cRXP_FRIENDLY_Randal Emerson|r
A	goto	1453/0,350.200,-8516.200
A	complete	93963,1
A	skipgossipid	142485
E
G	Guides/Forever/RestedXP-Skyborne.lua
M	classic	
M	version	1
M	name	Leylines
M	displayname	1-10 Skyborne222223
M	group	RestedXP Alliance 1-20
M	internal	
E
G	Guides/Forever/RestedXP-Skyborne.lua
M	classic	
M	version	1
M	name	Windstones
M	group	RestedXP Alliance 1-20
M	internal	
E
G	Guides/Forever/RestedXP-Skyborne.lua
M	classic	
M	version	1
M	name	Tronadoes
M	group	RestedXP Alliance 1-20
M	internal	
E
G	Guides/Forever/RestedXP-Skyborne.lua
M	classic	
M	version	1
M	name	Trainers
M	displayname	1-10 Skyborne22223423
M	group	RestedXP Alliance 1-20
M	internal	
E
G	Guides/Forever/RestedXP-Skyborne.lua
M	classic	
M	version	1
M	name	Treasures
M	displayname	1-10 Skyborne22223423
M	group	RestedXP Alliance 1-20
M	internal	
E
G	Guides/Forever/RestedXP-Skyborne.lua
M	classic	
M	version	1
M	name	101
M	displayname	1-10 Skyborne22223423
M	group	RestedXP Alliance 1-20
M	internal	
E
G	Guides/forever/Alliance-1-10_NightElf.lua
M	classic	
M	tbc	
M	season	0,1
M	selector	Alliance
M	name	1-6 Shadowglen
M	displayname	1-7 Shadowglen << sod
M	version	1
M	group	RestedXP Forever Guide (A)
M	subgroup	Speedrun Guide 1-20
M	defaultfor	NightElf
M	next	6-11 Teldrassil
S	!NightElf
T	sticky	
T	completewith	next
S	
A	goto	1438/1,826.03,10328.97
A	target	Conservator Ilthalaine
A	accept	456
S	
T	sticky	
T	label	balance1
T	completewith	GoodProtector
A	goto	1438/1,657.75,10385.51,0,0
A	complete	456,1
A	mob	+Young Nightsaber
A	complete	456,2
A	mob	+Young Thistle Boar
S	
A	xp	2
S	!sod/Warrior
T	label	GoodProtector
A	accept	4495
A	target	+Dirania Silvershine
A	goto	1438/1,713.81,10407.20
A	accept	458
A	goto	1438/1,763.45,10389.79
A	target	+Melithar Staghelm
S	
A	goto	1438/1,657.75,10385.51,0,0
A	complete	456,1
A	mob	+Young Nightsaber
A	complete	456,2
A	mob	+Young Thistle Boar
S	Hunter
T	xprate	>1.99
T	requires	balance1
A	goto	1438/1,826.03,10328.97
A	turnin	456,1
A	target	Conservator Ilthalaine
A	accept	457
S	Hunter
T	xprate	>1.99
A	goto	1438/1,769.77,10673.98
A	complete	457,1
A	mob	+Mangy Nightsaber
A	complete	457,2
A	mob	+Thistle Boar
S	Hunter
T	season	0,1
A	goto	1438/1,769.77,10673.98
A	xp	4-610
S	Hunter
A	goto	1438/1,1034.89,10711.58
A	turnin	4495
A	target	Iverron
A	accept	3519
S	Hunter
T	completewith	next
A	hs	
S	Hunter
A	goto	1438/1,866.51,10300.67
A	turnin	458
A	target	Tarindrella
A	accept	459
S	Hunter
T	xprate	>1.99
T	requires	balance1
A	goto	1438/1,826.03,10328.97
A	turnin	457
A	target	Conservator Ilthalaine
A	accept	3117
S	Druid
A	goto	1438/1,779.85,10450.13
A	vendor	
A	collect	159,15
A	target	Dellylah
S	
T	xprate	<1.99 << Hunter/Warrior
T	requires	balance1
A	goto	1438/1,826.03,10328.97
A	turnin	456,1
A	turnin	456
A	target	Conservator Ilthalaine
A	accept	457
A	accept	3116
A	accept	3117
A	accept	3119
A	accept	3120
S	Warrior
T	season	0
A	goto	1438/1,794.92,10436.72
A	vendor	
A	target	Keina
S	Warrior
T	season	0
A	goto	1438/1,778.07,10526.62
A	target	Alyissia
A	turnin	3116
A	trainer	
S	!Hunter
T	season	0 << Druid
A	goto	1438/1,769.77,10673.98
A	complete	457,1
A	mob	+Mangy Nightsaber
A	complete	457,2
A	mob	+Thistle Boar
S	!Hunter
T	season	0 << Warrior
A	goto	1438/1,1034.89,10711.58
A	turnin	4495
A	target	Iverron
A	accept	3519
S	!Hunter !Warrior
T	season	2
T	completewith	next
A	hs	
S	!Hunter
T	season	0
T	completewith	next
A	hs	
S	!Hunter
T	season	0 << Druid/Warrior
A	goto	1438/1,866.51,10300.67
A	turnin	458
A	target	Tarindrella
A	accept	459
S	!Hunter
T	season	0 << Druid
A	goto	1438/1,826.03,10328.97
A	target	Conservator Ilthalaine
A	turnin	457
S	
A	goto	1438/1,713.81,10407.20
A	turnin	3519
A	target	Dirania Silvershine
A	accept	3521
S	Hunter
T	season	0
T	completewith	htraining
A	goto	1438/1,794.92,10436.72
A	vendor	
A	target	Keina
S	Druid
T	season	0,1
A	goto	1438/1,779.85,10450.13
A	vendor	
A	collect	159,20
A	target	Dellylah
S	
A	goto	1438/1,871.24,10417.65
A	target	Gilshalan Windwalker
A	accept	916
S	Hunter
A	xp	4-40
S	Hunter
A	goto	1438/1,871.6,10440.83,25,0
A	goto	1438/1,827.86,10458.51
A	turnin	3117
A	train	1978
A	target	Ayanna Everstride
S	
A	goto	1438/1,863.96,10534.840,10,0
A	goto	1438/1,873.64,10566.40,10,0
A	goto	1438/1,850.72,10595.920,10,0
A	goto	1438/1,820.17,10547.39,10,0
A	goto	1438/1,863.96,10534.840
A	complete	3521,2
S	Hunter
T	optional	
T	season	2
T	completewith	next
A	complete	3521,3
A	complete	916,1
A	mob	Webwood Spider
S	
T	season	0 << Warrior
T	label	IchorVenomSac
A	goto	1438/1,922.52,10755.43
A	complete	3521,3
A	complete	916,1
A	mob	Webwood Spider
S	skip --logout skip Warrior
T	hardcore	
T	completewith	next
T	season	2
A	link	https://www.youtube.com/watch?v=TTZZT3jpv1s
S	skip --logout skip Hunter
T	hardcore	
T	season	2
T	completewith	next
A	link	https://www.youtube.com/watch?v=TTZZT3jpv1s
S	
A	goto	1438/1,1014.17,10348.18
A	complete	3521,1
A	complete	459,1
A	mob	Grell
A	mob	Grellkin
S	Warrior
T	season	2
A	goto	1438/1,871.24,10417.65
A	turnin	917
A	target	Gilshalan Windwalker
S	
A	goto	1438/1,871.60,10300.67
A	target	Tarindrella
A	turnin	459
S	
A	goto	1438/1,713.81,10407.20
A	turnin	3521
A	target	Dirania Silvershine
A	accept	3522
S	!Priest !Warrior
T	season	0 << Hunter
A	goto	1438/1,794.92,10436.72
A	vendor	
A	vendor	
A	target	Keina
S	Warrior
T	season	0
A	goto	1438/1,778.07,10526.62
A	trainer	
A	target	Alyissia
S	Priest
T	completewith	next
A	goto	1438/1,787.28,10438.120
A	vendor	
A	target	Janna Brightmoon
S	Priest
T	season	0,1,2
A	goto	1438/1,801.64,10458.75
A	target	Shanda
A	turnin	3119
A	turnin	77574
A	trainer	
S	
T	season	0 << Warrior
A	goto	1438/1,871.24,10417.65
A	turnin	916
A	target	Gilshalan Windwalker
A	accept	917
S	Hunter/Rogue
T	completewith	next
A	use	5392
A	itemcount	5392,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.05
S	Druid
T	season	0,1
A	goto	1438/1,871.6,10440.83,25,0
A	goto	1438/1,829.54,10464.01
A	target	Mardant Strongoak
A	turnin	3120
A	train	8921
S	
T	season	0 << Warrior
A	goto	1438/1,1034.89,10711.58
A	target	Iverron
A	turnin	3522
S	
T	season	0 << Warrior
T	completewith	next
A	goto	1438/1,926.08,10773.42,25
S	
A	goto	1438/1,912.33,10935.30
T	season	0 << Warrior
A	complete	917,1
S	
T	softcore	
T	completewith	next
T	season	0 << Warrior
A	deathskip	
A	target	Spirit Healer
S	skip --logout skip
T	hardcore	
T	completewith	next
T	season	0 << Warrior
A	link	https://www.youtube.com/watch?v=TTZZT3jpv1s
S	
T	xprate	<1.99
A	goto	1438/1,871.24,10417.65
A	turnin	917
A	target	Gilshalan Windwalker
A	accept	920
S	
T	xprate	<1.99
A	goto	1438/1,871.6,10440.83,25,0
A	goto	1438/1,807.34,10492.48
A	turnin	920
A	target	Tenaron Stormgrip
A	accept	921
S	
T	xprate	<1.99
T	sticky	
T	label	vial1
A	goto	1438/1,764.68,10711.31
A	use	5185
A	complete	921,1
S	Hunter
T	xprate	<1.99
A	goto	1438/1,769.77,10673.98
A	complete	457,1
A	mob	+Mangy Nightsaber
A	complete	457,2
A	mob	+Thistle Boar
S	
T	xprate	<1.99
T	requires	vial1
T	completewith	next
A	deathskip	
A	target	Spirit Healer
S	Hunter
T	xprate	<1.99
T	requires	vial1
A	goto	1438/1,826.03,10328.97
A	target	Conservator Ilthalaine
A	turnin	457,2
S	Priest
T	requires	vial1
A	goto	1438/1,800.32,10456.78
A	target	Shanda
A	accept	5622
S	
T	xprate	<1.99
T	requires	vial1
A	goto	1438/1,871.6,10440.83,25,0
A	goto	1438/1,807.34,10492.48
A	turnin	921
A	target	Tenaron Stormgrip
A	accept	928
S	
A	goto	1438/1,700.57,10214.33
A	target	Porthannius
A	accept	2159
E
G	Guides/forever/Alliance-1-10_NightElf.lua
M	classic	
M	tbc	
M	season	0,1
M	selector	Alliance
M	name	6-11 Teldrassil
M	displayname	7-13 Teldrassil << SoD
M	version	1
M	group	RestedXP Forever Guide (A)
M	subgroup	Speedrun Guide 1-20
M	defaultfor	NightElf
M	next	14-16 Darkshore
S	
A	goto	1438/1,734.13,9920.57
A	target	Zenn Foulhoof
A	accept	488
S	
T	label	HCHunterStart --hidden step for #include
S	
T	sticky	
T	completewith	DenlansEarth
A	complete	488,1
A	mob	+Nightsaber
A	complete	488,2
A	mob	+Strigid Owl
A	complete	488,3
A	mob	+Webwood Lurker
S	
T	sticky	
T	completewith	DenlansEarth
A	collect	5465,7,4161,1
A	mob	Webwood Lurker
A	mob	Webwood Venomfang
S	
T	label	DenlansEarth
A	goto	1438/1,959.18,9872.38
A	target	Syral Bladeleaf
A	accept	997
S	
A	goto	1438/1,965.59,9887.58
A	target	Athridas Bearmantle
A	accept	475
S	Priest
A	goto	1438/1,985.45,9905.43
A	turnin	5622
A	target	Laurna Morninglight
A	accept	5621
A	trainer	
S	Rogue
A	goto	1438/1,988.30,9891.89
A	vendor	
A	target	Aldia
S	
T	xprate	<1.99 << Hunter/Warrior/Druid
A	goto	1438/1,984.94,9898.58
A	target	Tallonkai Swiftroot
A	accept	932
A	accept	2438
S	Hunter/Warrior/Druid
T	xprate	>1.99
A	goto	1438/1,984.94,9898.58
A	target	Tallonkai Swiftroot
A	accept	2438
S	Hunter
A	goto	Teldrassil,55.890,59.205
A	collect	2506,1
A	target	Jeena Featherbow
A	money	<0.0285
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.38
S	Hunter
T	season	0
A	goto	Teldrassil,55.890,59.205
A	vendor	
A	target	Jeena Featherbow
S	Hunter
T	completewith	next
A	use	2506
A	itemcount	2506,1
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.37
S	Warrior
A	goto	1438/1,947.57,9812.38
A	collect	2488,1
A	target	Shalomon
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.80
S	Warrior
T	completewith	next
A	use	2488
A	itemcount	2488,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.79
S	Warrior
A	goto	1438/1,952.00,9822.22
A	trainer	
A	target	Kyra Windblade
S	Rogue
A	goto	1438/1,943.85,9790.28
A	trainer	
A	target	Jannok Breezesong
S	Rogue
A	goto	1438/1,947.57,9812.38
A	collect	2494,1
A	target	Shalomon
A	money	<0.0401
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Rogue
T	completewith	next
A	use	2494
A	itemcount	2494,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.29
S	Druid
A	goto	1438/1,947.57,9812.38
A	collect	2495,1
A	target	Shalomon
A	money	<0.0504
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.20
S	Druid
T	completewith	next
A	use	2495
A	itemcount	2495,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.19
S	
A	goto	1438/1,982.65,9802.19
A	target	Innkeeper Keldamyr
A	turnin	2159,2
A	turnin	2159
A	vendor	
A	home	
S	Hunter
A	goto	1438/1,928.83,9812.34
A	train	3044
A	train	5116
A	target	Dazalar
S	Druid
T	season	0
A	goto	1438/1,966.05,9741.85
A	trainer	
A	target	Kal
S	
T	xprate	<1.99
A	goto	1438/1,956.02,9736.83
A	turnin	928
A	target	Corithras Moonrage
A	accept	929
S	
T	sticky	
T	completewith	DenlanStart
A	complete	488,1
A	mob	+Nightsaber
A	complete	488,2
A	mob	+Strigid Owl
A	complete	488,3
A	mob	+Webwood Lurker
S	
T	sticky	
T	completewith	DenlanStart
A	collect	5465,7,4161,1
A	mob	Webwood Lurker
A	mob	Webwood Venomfang
S	Druid
T	ah	
T	season	0
A	goto	1438/1,875.62,9773.25
A	train	2366
A	target	Malorne Bladeleaf
A	itemcount	2449,<5
S	Druid
T	ssf	
T	season	0
A	goto	1438/1,875.62,9773.25
A	train	2366
A	target	Malorne Bladeleaf
A	itemcount	2449,<5
S	Druid
T	ssf	
T	optional	
T	completewith	end
T	label	GatheringQ
T	season	0
A	skill	herbalism,15
A	collect	2449,5,6123,1
A	disablecheckbox	
S	Druid
T	optional	
T	completewith	end
T	requires	GatheringQ
T	season	0
A	collect	2449,5,6123,1
A	skill	herbalism,<15,1
S	Priest
A	goto	1438/1,900.01,9675.85
A	complete	5621,1
A	target	Sentinel Shaya
S	
T	label	DenlanStart
A	goto	Teldrassil,60.900,68.489
A	turnin	997
A	target	Denalan
A	accept	918
A	accept	919
S	
A	goto	1438/1,676.59,9493.30,55,0
A	goto	1438/1,733.11,9439.67,55,0
A	goto	1438/1,808.46,9370.10,55,0
A	goto	1438/1,877.20,9458.34,55,0
A	goto	1438/1,997.36,9549.97,55,0
A	goto	1438/1,867.02,9630.74,55,0
A	goto	1438/1,697.97,9581.87
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
T	sticky	
T	completewith	Starbreeze
A	complete	488,1
A	mob	+Nightsaber
A	complete	488,2
A	mob	+Strigid Owl
A	complete	488,3
A	mob	+Webwood Lurkerr
S	
T	sticky	
T	completewith	Starbreeze
A	collect	5465,7,4161,1
A	mob	Webwood Lurker
A	mob	Webwood Venomfang
S	
T	label	Starbreeze
T	completewith	next
A	goto	1438/1,351.23,9806.54,120
S	
A	goto	1438/1,351.23,9806.54
A	complete	2438,1
S	
T	label	zenn
A	goto	1438/1,440.85,9845.23
A	turnin	475
A	target	Gaerolas Talvethren
A	accept	476
S	
T	xprate	<1.99
A	goto	1438/1,587.49,9859.480
A	complete	929,1
S	
T	sticky	
T	completewith	SeekRedemption
A	collect	5465,7,4161,1
A	mob	Webwood Lurker
A	mob	Webwood Venomfang
S	
A	complete	488,1
A	mob	+Nightsaber
A	goto	1438/1,448.99,10051.91,60,0
A	goto	1438/1,660.30,9758.69,50,0
A	goto	1438/1,803.37,9764.12
A	complete	488,2
A	mob	+Strigid Owl
A	goto	1438/1,448.99,10051.91,60,0
A	goto	1438/1,586.98,9651.78,50,0
A	goto	1438/1,803.37,9764.12
A	complete	488,3
A	mob	+Webwood Lurker
A	goto	1438/1,705.61,9976.23,50,0
A	goto	1438/1,750.93,9807.90,50,0
A	goto	1438/1,850.22,9919.89
S	
A	goto	1438/1,734.13,9920.57
A	target	Zenn Foulhoof
A	turnin	488
S	
T	label	HCHunterEnd --hidden step for #include
S	
T	xprate	< 1.5
A	goto	1438/1,723.94,9985.05
A	xp	7+3520
S	
T	xprate	>1.49
A	xp	7+2350
S	
T	label	SeekRedemption
A	goto	1438/1,959.28,9872.28
A	accept	489
A	target	Syral Bladeleaf
S	
A	goto	1438/1,965.59,9887.58
A	target	Athridas Bearmantle
A	turnin	476
S	Priest
A	goto	1438/1,985.45,9905.43
A	target	Laurna Morninglight
A	turnin	5621
A	trainer	
S	
A	goto	1438/1,984.94,9898.58
A	turnin	2438
A	target	Tallonkai Swiftroot
A	accept	2459
S	Hunter
A	goto	Teldrassil,55.890,59.205
A	collect	2506,1
A	target	Jeena Featherbow
A	money	<0.0285
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.38
S	Hunter
T	season	0
A	goto	Teldrassil,55.890,59.205
A	vendor	
A	target	Jeena Featherbow
S	Hunter
T	completewith	next
T	season	0
A	use	2506
A	itemcount	2506,1
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.37
S	Hunter
T	season	0
A	goto	1438/1,928.83,9812.34
A	trainer	
A	target	Dazalar
S	Rogue
A	goto	1438/1,943.85,9790.28
A	trainer	
A	target	Jannok Breezesong
S	Warrior
A	goto	1438/1,947.57,9812.38
A	collect	2488,1
A	target	Shalomon
A	money	<0.0536
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.80
S	Warrior
T	completewith	next
A	use	2488
A	itemcount	2488,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.79
S	Warrior
A	goto	1438/1,952.00,9822.22
A	trainer	
A	target	Kyra Windblade
S	Rogue
A	goto	1438/1,947.57,9812.38
A	collect	2494,1
A	target	Shalomon
A	money	<0.0401
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Rogue
T	completewith	next
A	use	2494
A	itemcount	2494,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.29
S	Druid
A	goto	1438/1,947.57,9812.38
A	collect	2495,1
A	target	Shalomon
A	money	<0.0504
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.20
S	Druid
T	completewith	next
A	use	2495
A	itemcount	2495,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.19
S	Druid
T	xprate	1.49-1.99
A	goto	1438/1,956.02,9736.83
A	turnin	929
A	target	Corithras Moonrage
S	Druid
T	xprate	<1.50
A	goto	1438/1,956.02,9736.83
A	turnin	929
A	target	Corithras Moonrage
A	accept	933
S	Druid
T	season	0
A	goto	1438/1,966.05,9741.85
A	trainer	
A	target	Kal
S	
T	sticky	
T	completewith	jewel
A	collect	5465,7,4161,1
A	mob	Webwood Lurker
A	mob	Webwood Venomfang
S	
T	loop	
A	goto	1438/1,854.400,9952.500,6
A	goto	1438/1,822.200,9948.500,6
A	goto	1438/1,809.800,9926.400,6
A	complete	489,1
A	isOnQuest	489
S	
T	label	SoDSpiderLegs
A	goto	1438/1,739.22,9917.17
A	target	Zenn Foulhoof
A	turnin	489
A	itemcount	3418,3
A	isOnQuest	489
S	
T	completewith	jewel
A	complete	489,1
A	isOnQuest	489
S	
T	completewith	next
A	complete	2459,1
A	mob	Gnarlpine Mystic
S	
A	goto	1438/1,282.49,10018.65
A	use	8049
A	complete	2459,2
A	mob	Ferocitas the Dream Eater
S	
T	label	jewel
A	goto	1438/1,332.90,10064.46,30,0
A	goto	1438/1,282.49,10018.65
A	complete	2459,1
A	mob	Gnarlpine Mystic
S	
T	softcore	
T	completewith	next
A	deathskip	
A	target	Spirit Healer
A	isQuestTurnedIn	489
S	
T	softcore	
A	goto	1438/1,953.07,9788.21
A	vendor	
A	target	Brannol Eaglemoon
A	isQuestTurnedIn	489
S	
A	goto	1438/1,810.5,9927.36,50,0
A	goto	1438/1,937.79,9608.34,50,0
A	goto	1438/1,1116.0,9811.97,50,0
A	goto	1438/1,576.28,9716.94,50,0
A	goto	1438/1,825.78,9940.93
A	complete	489,1
A	isOnQuest	489
S	
A	goto	1438/1,739.22,9917.17
A	target	Zenn Foulhoof
A	turnin	489
A	isOnQuest	489
S	
T	sticky	
T	completewith	next
A	collect	5465,7,4161,1
A	mob	Webwood Lurker
A	mob	Webwood Venomfang
S	
T	completewith	next
A	goto	1438/1,1030.46,10037.99,20,0
A	goto	1438/1,1043.70,10093.99,15
S	
A	goto	1438/1,1207.65,10114.01
A	complete	932,1
A	unitscan	Lord Melenas
S	
T	softcore	
T	completewith	next
A	deathskip	
A	target	Spirit Healer
S	!Druid
T	xprate	<1.99
A	goto	1438/1,956.02,9736.83
A	target	Corithras Moonrage
A	turnin	929
S	
T	xprate	<1.5
A	goto	1438/1,956.02,9736.83
A	target	Corithras Moonrage
A	accept	933
S	
T	sticky	
T	completewith	spiderLegs
A	collect	5465,7,4161,1
A	mob	Webwood Lurker
A	mob	Webwood Venomfang
S	
T	xprate	<1.5
T	completewith	next
A	goto	1438/1,1645.02,9245.89,50
S	
T	xprate	<1.5
A	goto	1438/1,1645.02,9245.89
A	accept	930
S	
T	xprate	<1.5
T	completewith	next
A	goto	1438/1,1655.21,9555.06,50
S	
T	xprate	<1.5
T	label	spiderLegs
A	goto	1438/1,1655.21,9555.06
A	use	5621
A	complete	933,1
S	
T	xprate	<1.5
A	goto	1438/1,1539.12,9437.98,40,0
A	goto	1438/1,1529.44,9325.64
A	collect	5465,7,4161,1
A	mob	Webwood Lurker
A	mob	Webwood Venomfang
S	
T	xprate	<1.5
T	hardcore	
T	completewith	next
A	goto	1438/1,956.02,9736.83,90
S	
T	xprate	<1.5
T	softcore	
T	completewith	next
A	goto	1438/1,1599.71,9509.25
A	deathskip	
S	
T	xprate	<1.5
A	goto	1438/1,956.02,9736.83
A	turnin	933
A	target	Corithras Moonrage
A	accept	7383
S	
T	xprate	<1.5
T	label	SpiderLegsEnd
A	goto	1438/1,906.17,9751.02
A	train	2550
A	accept	4161
A	turnin	4161
A	target	Zarrin
S	Warrior/Rogue
A	goto	1438/1,999.40,9902.92
A	train	3273
A	target	Byancie
S	
A	goto	1438/1,984.94,9898.58
A	target	Tallonkai Swiftroot
A	turnin	932
A	turnin	2459
S	
T	xprate	>1.99
A	xp	10
S	Priest
T	xprate	>1.99
A	goto	1438/1,985.45,9905.43
A	trainer	
A	accept	5629
A	target	Laurna Morninglight
S	Warrior
T	xprate	>1.99
A	goto	1438/1,952.00,9822.22
A	trainer	
A	target	Kyra Windblade
S	Rogue
T	xprate	>1.99
A	goto	1438/1,943.85,9790.28
A	trainer	
A	train	5171
A	train	921
A	target	Jannok Breezesong
S	Hunter
T	xprate	>1.99
A	goto	1438/1,928.83,9812.34
A	target	Dazalar
A	accept	6063
A	trainer	
S	Hunter
T	xprate	>1.99
A	goto	1438/1,764.68,9835.73
A	use	15921
A	complete	6063,1
A	mob	Webwood Lurker
S	Hunter
T	xprate	>1.99
A	goto	1438/1,928.83,9812.34
A	turnin	6063
A	target	Dazalar
A	accept	6101
S	Hunter
T	xprate	>1.99
A	goto	1438/1,627.20,9380.96
A	use	15922
A	complete	6101,1
A	mob	Nightsaber Stalker
S	Hunter
T	xprate	>1.99
A	goto	1438/1,928.83,9812.34
A	turnin	6101
A	target	Dazalar
A	accept	6102
S	Hunter
T	xprate	>1.99
A	goto	1438/1,520.28,9567.62
A	use	15923
A	complete	6102,1
A	mob	Strigid Screecher
S	Hunter
T	xprate	>1.99
A	goto	1438/1,928.83,9812.34
A	turnin	6102
A	target	Dazalar
A	accept	6103
A	train	1130
S	Warrior
T	xprate	>1.99
A	goto	1438/1,971.91,9852.35,40,0
A	goto	1438/1,1257.55,10004.39
A	goto	1438/1,971.91,9852.35,0
A	line	Teldrassil,50.4,54.2,50.4,55.4,50.4,55.6,50.6,56.2,51.2,56.6,52.2,56.4,52.4,56.6,52.8,57.0,53.4,57.6,54.4,58.4,55.2,58.6,55.4,58.4,55.6,58.4,55.8,58.6
A	accept	1684
A	accept	487
A	target	Moon Priestess Amara
S	Rogue
T	xprate	>1.99
A	goto	1438/1,943.85,9790.28
A	target	Jannok Breezesong
A	accept	2241
S	
T	season	0
A	goto	1438/1,971.91,9852.35,40,0
A	goto	1438/1,1257.55,10004.39
A	goto	1438/1,971.91,9852.35,0
A	line	Teldrassil,50.4,54.2,50.4,55.4,50.4,55.6,50.6,56.2,51.2,56.6,52.2,56.4,52.4,56.6,52.8,57.0,53.4,57.6,54.4,58.4,55.2,58.6,55.4,58.4,55.6,58.4,55.8,58.6
A	accept	487
A	target	Moon Priestess Amara
S	
T	season	0
A	goto	1438/1,1441.87,10032.56
A	complete	487,1
A	mob	Gnarlpine Ambusher
S	
T	xprate	< 1.5
T	completewith	next
A	goto	1438/1,1863.46,10665.16,50
S	
T	xprate	< 1.5
A	goto	1438/1,1863.46,10665.16
A	target	Sentinel Arynia Cloudsbreak
A	accept	937
S	
T	xprate	< 1.5
A	goto	1438/1,1857.86,10676.36
A	use	18152
A	complete	7383,1
S	
T	xprate	< 1.5
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
T	xprate	< 1.5
A	goto	1438/1,2052.36,10854.19
A	accept	931
S	Hunter
T	xprate	<1.5
T	completewith	xp10
T	label	mist1
A	goto	1438/1,2208.67,10758.15
A	accept	938
A	target	Mist
S	Hunter
T	xprate	<1.5
T	sticky	
T	label	xp10
A	xp	10-2670
S	Hunter
T	xprate	<1.5
T	completewith	xp10
T	requires	mist1
A	goto	1438/1,1863.46,10665.16
A	target	Sentinel Arynia Cloudsbreak
A	turnin	938
S	Hunter
T	xprate	<1.5
T	completewith	xp10
T	requires	harpies
A	goto	1438/1,1863.46,10665.16
A	turnin	937
A	target	Sentinel Arynia Cloudsbreak
A	accept	940
S	!Hunter
T	xprate	<1.5
T	label	mist1
A	goto	1438/1,2208.67,10758.15
A	accept	938
A	target	Mist
S	!Hunter
T	xprate	<1.5
A	goto	1438/1,1863.46,10665.16
A	turnin	937
A	target	Sentinel Arynia Cloudsbreak
A	accept	940
A	turnin	938
S	Druid
T	xprate	<1.5
T	label	xp10
T	season	2
A	xp	10
S	Druid
T	xprate	<1.5
T	season	0,1
T	label	xp10
A	xp	10-750
S	!Hunter !Druid
T	xprate	<1.5
T	label	xp10
A	xp	10-3110
S	
T	xprate	1.49-1.99
A	goto	1438/1,1849.20,9862.88
A	collect	5465,7,4161,1
S	Druid
T	xprate	1.49-1.99
T	label	xp10
A	xp	10-850
A	goto	1438/1,1864.47,10663.80
S	!Druid
T	xprate	1.49-1.99
T	label	xp10
A	xp	10-4415
S	!Rogue
T	softcore	
T	requires	xp10
T	completewith	next
A	deathskip	
A	target	Spirit Healer
S	!Rogue
T	hardcore	
T	xprate	< 1.5
T	completewith	next
A	complete	937,1
A	mob	Bloodfeather Harpy
A	mob	Bloodfeather Rogue
A	mob	Bloodfeather Sorceress
A	mob	Bloodfeather Fury
A	mob	Bloodfeather Wind Witch
A	mob	Bloodfeather Matriarch
S	!Rogue
T	hardcore	
T	requires	xp10
T	completewith	next
A	goto	1457/1,2070.42,9979.310,100
S	Warrior
T	xprate	>1.99
A	goto	1457/1,2331.89,9994.09
A	turnin	1684
A	target	Elanaria
A	accept	1683
S	!Rogue !Hunter !Warrior
T	xprate	>1.99
A	goto	1457/1,2224.76,10127.83
A	home	
A	vendor	
A	target	Innkeeper Saelienne
S	!Rogue
T	requires	xp10
A	goto	1457/1,2534.29,10085.60
A	turnin	922
A	target	Rellian Greenspyre
A	accept	923
S	!Hunter !Rogue
T	xprate	<1.5
A	goto	1457/1,2568.37,10174.73
A	turnin	940
A	isOnQuest	940
A	target	Arch Druid Fandral Staghelm
S	Druid
A	goto	1457/1,2563.92,10179.040
A	turnin	-5923
A	accept	5921
A	trainer	
A	target	Mathrengyl Bearwalker
S	Hunter
T	xprate	>1.99
A	goto	1457/1,2511.04,10178.01
A	target	Jocaste
A	turnin	6103
S	!Rogue
A	goto	1457/1,2517.99,9584.25,10,0
A	goto	1457/1,2550.48,9631.88
A	target	Priestess A'moora
A	accept	2518
S	Druid
T	completewith	next
A	cast	18960
A	zoneskip	Moonglade
S	Druid
A	goto	1450/1,-2678.76,8019.94
A	turnin	5921
A	target	Dendrite Starblaze
A	accept	5929
S	Druid
A	goto	1450/1,-2422.77,8079.37,15,0
A	goto	1450/1,-2285.42,8069.51
A	complete	5929,1
A	skipgossip	
A	target	Great Bear Spirit
S	Druid
T	completewith	next
A	cast	18960
S	Druid
A	goto	1450/1,-2678.76,8019.94
A	turnin	5929
A	target	Dendrite Starblaze
A	accept	5931
S	
T	xprate	<1.99
T	requires	xp10 << Rogue
A	hs	
A	subzoneskip	186
S	Hunter
T	xprate	<1.99
A	goto	Teldrassil,55.890,59.205
A	vendor	
A	target	Jeena Featherbow
S	
T	xprate	1.49-1.99
A	goto	1438/1,906.17,9751.02
A	train	2550
A	target	Zarrin
A	accept	4161
A	turnin	4161
S	
T	xprate	1.49-1.99
A	goto	1438/1,1172.01,9917.17
A	target	Moon Priestess Amara
A	turnin	487
A	maxlevel	9
S	Hunter
T	xprate	<1.99
T	optional	
T	completewith	L10
T	level	10
T	label	beast1
A	goto	1438/1,928.83,9812.34
A	target	Dazalar
A	accept	6063
A	train	13165
S	Hunter
T	xprate	<1.99
T	optional	
T	completewith	L10
T	level	10
T	requires	beast1
T	label	beast2
A	goto	1438/1,764.68,9835.73
A	use	15921
A	complete	6063,1
A	mob	Webwood Lurker
S	Hunter
T	xprate	<1.99
T	optional	
T	completewith	L10
T	level	10
T	requires	beast2
A	goto	1438/1,928.83,9812.34
A	turnin	6063
A	target	Dazalar
A	accept	6101
S	
T	xprate	<1.5
A	goto	1438/1,956.02,9736.83
A	turnin	7383
A	target	Corithras Moonrage
A	accept	935
S	
T	xprate	<1.5
A	goto	Teldrassil,60.900,68.489
A	target	Denalan
A	turnin	931
A	turnin	930
S	
T	xprate	<1.5
A	goto	Teldrassil,60.900,68.489
A	target	Denalan
A	turnin	927
A	isOnQuest	927
S	
T	xprate	<1.5
A	goto	1438/1,719.87,9503.48
A	turnin	941
A	isQuestTurnedIn	927
S	Hunter
T	xprate	<1.5
A	goto	1438/1,627.20,9380.96
A	use	15922
A	complete	6101,1
A	isOnQuest	6101
A	mob	Nightsaber Stalker
S	
T	xprate	<1.99
T	label	L10
A	xp	10
S	
T	xprate	<1.5
T	softcore	
T	sticky	
T	completewith	next
A	deathskip	
A	target	Spirit Healer
S	Priest
T	xprate	<1.99
A	goto	1438/1,985.45,9905.43
A	trainer	
A	target	Laurna Morninglight
S	Warrior
T	xprate	<1.99
A	goto	1438/1,952.00,9822.22
A	trainer	
A	target	Kyra Windblade
S	Rogue
T	xprate	<1.99
A	goto	1438/1,943.85,9790.28
A	trainer	
A	train	5171
A	train	921
A	target	Jannok Breezesong
S	Hunter
T	xprate	<1.99
A	goto	1438/1,928.83,9812.34
A	target	Dazalar
A	accept	6063
A	trainer	
S	Hunter
T	xprate	<1.99
A	goto	1438/1,764.68,9835.73
A	use	15921
A	complete	6063,1
A	mob	Webwood Lurker
S	Hunter
T	xprate	<1.99
A	goto	1438/1,928.83,9812.34
A	turnin	6063
A	target	Dazalar
A	accept	6101
S	Hunter
T	xprate	<1.99
A	goto	1438/1,627.20,9380.96
A	use	15922
A	complete	6101,1
A	mob	Nightsaber Stalker
S	Hunter
T	xprate	<1.99
A	goto	1438/1,928.83,9812.34
A	turnin	6101
A	target	Dazalar
A	accept	6102
S	Hunter
T	xprate	<1.99
A	goto	1438/1,520.28,9567.62
A	use	15923
A	complete	6102,1
A	mob	Strigid Screecher
S	Hunter
T	xprate	<1.99
A	goto	1438/1,928.83,9812.34
A	turnin	6102
A	target	Dazalar
A	accept	6103
S	Warrior
T	xprate	<1.99
A	goto	1438/1,971.91,9852.35,40,0
A	goto	1438/1,1257.55,10004.39
A	goto	1438/1,971.91,9852.35,0
A	accept	1684
A	target	Moon Priestess Amara
S	Rogue
T	xprate	<1.99
A	goto	1438/1,943.85,9790.28
A	target	Jannok Breezesong
A	accept	2241
S	Hunter
T	xprate	<1.5--money issues 1.5x
A	goto	1438/1,947.57,9812.38
A	money	<0.0504
A	collect	2495,1
A	target	Shalomon
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.20
S	!Druid
T	xprate	<1.99
A	goto	1438/1,971.91,9852.35,40,0
A	goto	1438/1,1257.55,10004.39
A	goto	1438/1,971.91,9852.35,0
A	turnin	487
A	target	Moon Priestess Amara
S	Rogue
T	xprate	<1.99
T	softcore	
T	completewith	next
A	goto	1438/1,1574.25,9978.26
A	deathskip	
A	target	Spirit Healer
S	Rogue
T	hardcore	
T	completewith	next
A	goto	1457/1,2070.42,9979.310,100
S	Rogue
A	goto	1457/1,2534.29,10085.60
A	turnin	922
A	target	Rellian Greenspyre
A	accept	923
S	Rogue
T	season	0
A	goto	1457/1,2568.37,10174.73
A	turnin	-935
A	turnin	-940
A	target	Arch Druid Fandral Staghelm
A	accept	952
S	Rogue
A	goto	1457/1,2608.06,10113.26,8,0
A	goto	1457/1,2546.89,10083.69
A	turnin	2241
A	target	Syurna
A	accept	2242
S	Rogue
A	goto	1457/1,2517.99,9584.25,10,0
A	goto	1457/1,2550.48,9631.88
A	target	Priestess A'moora
A	accept	2518
S	Warrior
T	xprate	>1.99
T	sticky	
T	completewith	next
A	goto	1438/1,1334.94,9720.34,18
S	Warrior
T	xprate	>1.99
A	goto	1438/1,1411.32,9669.43
A	complete	1683,1
A	mob	Vorlus Vilehoof
S	Hunter
T	sticky	
A	goto	1438/1,1716.82,10324.42,0
A	goto	1438/1,1564.07,10480.54,0
A	goto	1438/1,1492.78,10765.61,0
A	goto	1438/1,1900.12,10853.85,0
A	train	2981
A	link	https://www.wow-petopia.com/classic/training.php
A	unitscan	Strigid Hunter
S	
T	sticky	
T	completewith	Spinnerets
A	goto	1438/1,1691.36,10412.66,0
A	goto	1438/1,1584.43,10947.86,0
A	complete	923,1
A	mob	Elder Timberling
A	mob	Timberling Trampler
A	mob	Timberling Mire Beast
S	
T	label	Spinnerets
T	loop	
A	goto	1438/1,1691.36,10412.66,0
A	goto	1438/1,1370.58,10976.02,0
A	goto	1438/1,1676.08,10962.45,0
A	goto	1438/1,1798.28,10962.45,0
A	line	Teldrassil,41.70,41.82,41.97,39.03,42.20,35.71,43.33,33.27,43.79,30.65,44.18,27.80,46.09,26.55,47.72,25.57,46.25,25.62,44.42,26.09,42.83,26.15,42.0,25.6,39.6,25.6
A	complete	2518,1
A	mob	Lady Sathrah
S	
A	goto	1438/1,1691.36,10412.66
A	complete	923,1
A	mob	Elder Timberling
A	mob	Timberling Trampler
A	mob	Timberling Mire Beast
S	
A	goto	1438/1,1864.47,10667.19
A	target	Sentinel Arynia Cloudsbreak
A	accept	937
S	Rogue
A	goto	1438/1,1879.75,10976.02
A	complete	2242,1
A	mob	Sethir the Ancient
S	
T	sticky	
T	label	harpies2
A	goto	1438/1,2102.82,10819.27,0,0
A	complete	937,1
A	mob	Bloodfeather Harpy
A	mob	Bloodfeather Rogue
A	mob	Bloodfeather Sorceress
A	mob	Bloodfeather Fury
A	mob	Bloodfeather Wind Witch
A	mob	Bloodfeather Matriarch
S	
A	goto	1438/1,2208.67,10758.15
A	target	Mist
T	label	MistStart
A	accept	938
S	
A	goto	1438/1,1864.47,10663.80
A	target	Sentinel Arynia Cloudsbreak
A	turnin	938
A	isOnQuest	938
S	
T	requires	harpies2
T	label	TeldrassilEnd
A	goto	1438/1,1864.47,10663.80
A	turnin	937
A	target	Sentinel Arynia Cloudsbreak
A	accept	940
S	
T	softcore	
T	completewith	darn << era
T	completewith	darnSoD << sod
A	deathskip	
A	target	Spirit Healer
S	
T	hardcore	
T	completewith	next
A	goto	1457/1,2070.42,9979.310
A	zone	Darnassus
S	
T	hardcore	
T	completewith	next
T	season	2
A	goto	1457/1,2070.42,9979.310
A	zone	Darnassus
S	
A	goto	1457/1,2190.34,9918.06
A	target	Mydrannul
A	accept	6344
S	
T	softcore	
T	label	darn
T	optional	
A	goto	1457/1,2070.42,9979.310
A	zone	Darnassus
S	
A	abandon	927
S	Warrior
T	xprate	<1.99
A	goto	1457/1,2331.89,9994.09
A	turnin	1684
A	target	Elanaria
A	accept	1683
S	Warrior
T	xprate	<1.99
T	sticky	
T	completewith	next
A	goto	1438/1,1334.94,9720.34,18
S	Warrior
T	xprate	<1.99
A	goto	1438/1,1411.32,9669.43
A	complete	1683,1
A	mob	Vorlus Vilehoof
S	Warrior
T	xprate	<1.99
T	softcore	
T	sticky	
T	completewith	next
A	goto	1438/1,1594.62,9988.44
A	deathskip	
S	Warrior
T	xprate	<1.99
T	hardcore	
T	completewith	next
A	goto	1457/1,2070.42,9979.310,100
S	Warrior
A	goto	1457/1,2331.89,9994.09
A	target	Elanaria
A	turnin	1683
S	Druid
T	season	0
A	goto	1457/1,2563.92,10179.040
A	turnin	5931
A	target	Mathrengyl Bearwalker
A	accept	6001
S	
T	season	0
A	goto	1457/1,2569.91,10173.00
A	turnin	-935
A	turnin	-940
A	target	Arch Druid Fandral Staghelm
A	accept	952
S	Hunter
T	xprate	<1.99
A	goto	1457/1,2511.04,10178.01
A	target	Jocaste
A	turnin	6103
S	Hunter
A	goto	1457/1,2491.75,10176.21
A	trainer	
A	target	Silvaria
S	
T	season	0
A	goto	1457/1,2534.25,10085.60
A	target	Rellian Greenspyre
A	turnin	923
S	Rogue
A	goto	1457/1,2608.06,10113.26,8,0
A	goto	1457/1,2546.89,10083.69
A	target	Syurna
A	turnin	2242
S	
A	goto	1457/1,2517.99,9584.25,10,0
A	goto	1457/1,2550.48,9631.88
A	turnin	2518
A	target	Priestess A'moora
A	accept	2520
S	
A	goto	1457/1,2518.20,9632.80
A	use	8155
A	complete	2520,1
S	
T	label	end
A	goto	1457/1,2517.99,9584.25,10,0
A	goto	1457/1,2550.48,9631.88
A	target	Priestess A'moora
A	turnin	2520
S	Druid
T	ssf	
T	season	0
A	goto	1457/1,2430.89,9758.21
A	train	2366
A	target	Firodren Mooncaller
S	
T	ah	
A	goto	1457/1,2343.10,9856.95,-1
A	goto	1457/1,2341.74,9872.610,-1
A	collect	5469,5,2178,1
A	collect	12238,6,1141,1
A	collect	2449,5,6123,1 << Druid
A	target	Auctioneer Tolon
A	target	Auctioneer Golothas
S	Hunter
A	goto	1457/1,2258.91,9793.71
A	line	Darnassus,60.65,66.47,61.68,63.73,62.36,58.91,62.32,55.22,65.77,55.75,67.88,57.48,68.35,59.98,65.14,68.14,64.34,71.36,62.28,68.79,60.65,66.47
A	collect	117,15
A	target	Jaeana
S	Hunter/Warrior/Priest/Sod Rogue
A	goto	1457/1,2329.19,9908.53
A	skipgossip	11866,1
A	train	227
A	train	265
A	target	Ilyenia Moonfire
S	Hunter
T	optional	
T	completewith	end
A	use	2495
A	itemcount	2495,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.19
S	Hunter/Sod Rogue
A	goto	1457/1,2316.49,9924.41
A	collect	2507,1
A	target	Ariyell Skyshadow
A	money	<0.1751
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<5.77
S	Hunter
T	season	0
A	goto	1457/1,2316.49,9924.41
A	vendor	
A	target	Ariyell Skyshadow
S	Hunter
T	completewith	next
A	use	2507
A	itemcount	2507,1
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<5.76
S	Warrior
A	goto	1457/1,2316.49,9924.41
A	collect	2030,1
A	target	Ariyell Skyshadow
A	money	<0.5022
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.9
S	Warrior
A	goto	1457/1,2316.49,9924.41
A	collect	854,1
A	target	Ariyell Skyshadow
A	money	<0.3022
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.44
S	Warrior
A	goto	1457/1,2316.49,9924.41
A	collect	851,1
A	target	Ariyell Skyshadow
A	money	<0.2023
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.82
S	Warrior
T	completewith	next
A	use	851
A	itemcount	851,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.81
S	Warrior
T	completewith	next
A	use	854
A	itemcount	854,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.43
S	Rogue
T	season	0
A	goto	1457/1,2275.00,9775.50
A	collect	2946,1
A	target	Turian
S	
T	completewith	NessaShadowsong
A	goto	1457/1,2636.53,9956.80
A	zone	Teldrassil
A	zoneskip	Darkshore
A	subzoneskip	702
S	
A	goto	1438/1,950.52,8694.07
A	turnin	6344
A	target	Nessa Shadowsong
A	accept	6341
S	
T	label	NessaShadowsong
T	optional	
A	goto	1438/1,950.52,8694.07
A	turnin	6343
A	isOnQuest	6343
A	target	Nessa Shadowsong
S	
A	goto	1438/1,841.10,8640.58
A	turnin	6341
A	target	Vesprystus
A	accept	6342
S	
A	goto	1438/1,841.10,8640.58
A	fly	Darkshore
A	target	Vesprystus
E
G	Guides/forever/Alliance-1-13_Human.lua
M	classic	
M	tbc	
M	season	0,1
M	selector	Alliance
M	name	1-6 Northshire
M	version	1
M	group	RestedXP Forever Guide (A)
M	subgroup	Speedrun Guide 1-20
M	defaultfor	Human
M	next	6-11 Elwynn Forest
S	!Human
T	completewith	next
S	Mage
T	completewith	next
S	!Human Mage
T	season	2
T	completewith	next
S	
T	softcore	<< Warlock
T	optional	
T	completewith	Within
A	destroy	6948
S	
A	goto	1429/0,-136.48,-8933.47
A	accept	783
A	target	Deputy Willem
S	Warrior
A	goto	1429/0,-75.05,-8872.36,35,0
A	vendor	
A	target	+Brother Danil
A	goto	1429/0,-112.74,-8901.66
A	train	6673
A	target	+Llane Beshere
A	goto	1429/0,-208.40,-8918.35
A	mob	Young Wolf
S	
T	label	Within
A	goto	1429/0,-162.62,-8902.59
A	turnin	783
A	accept	7
A	target	Marshal McBride
S	
A	goto	1429/0,-136.52,-8933.53
A	accept	5261
A	target	Deputy Willem
S	
T	label	EaganWolves
A	goto	1429/0,-163.24,-8869.26
A	turnin	5261
A	accept	33
A	target	Eagan Peltskinner
S	Priest/Mage/Warlock
T	completewith	next
A	goto	1429/0,-68.11,-8874.67,40,0
A	goto	1429/0,-112.74,-8901.66
A	collect	159,10
A	target	Brother Danil
S	
T	sticky	
T	label	WolfMeatEnd
A	goto	1429,49.052,38.270,0
A	goto	1429,45.708,38.720,0
A	goto	1429,47.976,39.422,0
A	waypoint	1429,49.052,38.270,45,0
A	waypoint	1429,48.362,37.582,45,0
A	waypoint	1429,47.136,37.636,45,0
A	waypoint	1429,46.870,36.906,45,0
A	waypoint	1429,46.476,37.034,45,0
A	waypoint	1429,46.465,38.272,45,0
A	waypoint	1429,45.896,38.013,45,0
A	waypoint	1429,45.708,38.720,45,0
A	waypoint	1429,46.302,39.994,45,0
A	waypoint	1429,45.718,40.733,45,0
A	waypoint	1429,46.399,41.838,45,0
A	waypoint	1429,46.741,40.987,45,0
A	waypoint	1429,47.703,40.299,45,0
A	waypoint	1429,47.976,39.422,45,0
A	complete	33,1
A	mob	Young Wolf
A	mob	Timber Wolf
S	
T	loop	
A	goto	1429,47.601,36.720,0
A	goto	1429,49.215,37.010,0
A	goto	1429,47.569,34.967,0
A	goto	1429,47.601,36.720,45,0
A	goto	1429,47.381,36.314,45,0
A	goto	1429,47.611,35.863,45,0
A	goto	1429,48.314,36.487,45,0
A	goto	1429,49.070,36.438,45,0
A	goto	1429,49.215,37.010,45,0
A	goto	1429,49.838,36.413,45,0
A	goto	1429,50.105,35.668,45,0
A	goto	1429,49.823,35.161,45,0
A	goto	1429,48.845,35.066,45,0
A	goto	1429,47.569,34.967,45,0
A	use	247834
A	collect	247834,1,91741,1
A	accept	91741
A	complete	7,1
A	disablecheckbox	
A	mob	Kobold Vermin
S	
T	completewith	next
A	goto	1429/0,-136.900,-8913.800,10,0
A	goto	1429/0,-176.000,-8880.900,10
S	
A	goto	1429/0,-186.12,-8874.91
A	turnin	91741
A	accept	92124
A	target	Brother Paxton
S	
A	goto	1429/0,-182.65,-8881.62
A	turnin	92124
A	target	Daniel
S	
A	goto	1429/0,-186.12,-8874.91
A	accept	91743
A	target	Brother Paxton
S	
T	loop	
A	goto	1429,47.601,36.720,0
A	goto	1429,49.215,37.010,0
A	goto	1429,47.569,34.967,0
A	goto	1429,47.601,36.720,45,0
A	goto	1429,47.381,36.314,45,0
A	goto	1429,47.611,35.863,45,0
A	goto	1429,48.314,36.487,45,0
A	goto	1429,49.070,36.438,45,0
A	goto	1429,49.215,37.010,45,0
A	goto	1429,49.838,36.413,45,0
A	goto	1429,50.105,35.668,45,0
A	goto	1429,49.823,35.161,45,0
A	goto	1429,48.845,35.066,45,0
A	goto	1429,47.569,34.967,45,0
A	complete	7,1
A	complete	91743,1
A	disablecheckbox	
A	mob	Kobold Vermin
S	
T	requires	WolfMeatEnd
A	goto	1429/0,-163.24,-8869.26
A	turnin	33,2
A	turnin	33,1
A	target	Eagan Peltskinner
S	Priest/Mage/Warlock
A	goto	1429/0,-112.74,-8901.66
A	collect	159,10
A	target	Brother Danil
S	!Priest !Mage !Warlock !Rogue
A	goto	1429/0,-119.86,-8898.21
A	vendor	
A	target	Godric Rothgar
S	Rogue
T	season	0,1
A	goto	Elwynn Forest,47.240,41.900
A	vendor	78
A	collect	2139,1
A	disablecheckbox	
A	target	Janos Hammerknuckle
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<1.2
S	Rogue
T	season	0,1
T	completewith	next
A	use	2139
A	itemcount	2139,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<1.2
S	
T	label	CleanupEnd
A	goto	1429/0,-162.62,-8902.59
A	turnin	7
A	accept	15
A	accept	3100
A	accept	3101
A	accept	3102
A	accept	3103
A	accept	3104
A	accept	3105
A	accept	92479
A	target	Marshal McBride
S	Warlock
A	goto	1429/0,-136.52,-8933.53
A	accept	18
A	target	Deputy Willem
S	Warlock
A	goto	1429/0,-195.59,-8926.73
A	turnin	3105
A	accept	1598
A	train	348
A	target	Drusilla La Salle
S	Warlock
T	hardcore	
A	goto	1429/0,-432.55,-8958.00
A	complete	1598,1
S	Warlock
T	softcore	
A	goto	1429/0,-432.55,-8958.00
A	complete	1598,1
S	Warlock
T	softcore	
T	completewith	next
A	goto	1429,49.527,43.491,0
A	deathskip	
A	target	Spirit Healer
S	Warlock
T	season	0,1
A	goto	1429/0,-195.59,-8926.73
A	turnin	1598
A	target	Drusilla La Salle
S	Warlock
T	optional	
T	completewith	next
A	cast	688
A	usespell	688
S	
T	completewith	next
A	complete	91743,1
S	
T	season	0,1 << Priest/Warrior
T	loop	
A	goto	1429,47.468,36.298,0
A	goto	1429,50.224,34.125,0
A	goto	1429,50.835,38.046,0
A	goto	1429,47.468,36.298,45,0
A	goto	1429,47.247,35.164,45,0
A	goto	1429,47.012,33.828,45,0
A	goto	1429,46.774,33.271,45,0
A	goto	1429,46.271,32.489,45,0
A	goto	1429,47.663,32.058,45,0
A	goto	1429,48.038,33.075,45,0
A	goto	1429,48.795,33.815,45,0
A	goto	1429,49.278,34.610,45,0
A	goto	1429,50.224,34.125,45,0
A	goto	1429,50.245,34.884,45,0
A	goto	1429,51.058,35.582,45,0
A	goto	1429,52.062,35.801,45,0
A	goto	1429,51.505,38.064,45,0
A	goto	1429,50.835,38.046,45,0
A	complete	15,1
A	mob	Kobold Worker
S	
T	label	xp3
T	loop	
A	goto	1429,47.468,36.298,0
A	goto	1429,50.224,34.125,0
A	goto	1429,50.835,38.046,0
A	goto	1429,47.468,36.298,45,0
A	goto	1429,47.247,35.164,45,0
A	goto	1429,47.012,33.828,45,0
A	goto	1429,46.774,33.271,45,0
A	goto	1429,46.271,32.489,45,0
A	goto	1429,47.663,32.058,45,0
A	goto	1429,48.038,33.075,45,0
A	goto	1429,48.795,33.815,45,0
A	goto	1429,49.278,34.610,45,0
A	goto	1429,50.224,34.125,45,0
A	goto	1429,50.245,34.884,45,0
A	goto	1429,51.058,35.582,45,0
A	goto	1429,52.062,35.801,45,0
A	goto	1429,51.505,38.064,45,0
A	goto	1429,50.835,38.046,45,0
A	xp	3+1110
A	complete	91743,1
A	disablecheckbox	
A	mob	Kobold Worker
S	!Hunter
T	season	0,1 << Warrior
T	completewith	next
A	goto	1429/0,-119.86,-8898.21
A	vendor	
A	target	Godric Rothgar
S	Hunter
A	goto	1429/0,-112.800,-8901.601
A	vendor	
A	target	Brother Danil
S	
T	requires	xp3
T	label	Investigate
A	goto	1429/0,-162.62,-8902.59
A	turnin	15
A	accept	21
A	target	Marshal McBride
S	
A	isQuestComplete	91743
A	goto	1429/0,-186.12,-8874.91
A	turnin	91743
A	accept	91745
A	target	Brother Paxton
S	
A	isQuestTurnedIn	91743
A	goto	1429/0,-186.12,-8874.91
A	accept	91745
A	target	Brother Paxton
S	Mage
T	optional	
T	completewith	next
A	goto	1429,48.79,41.58,12,0
A	goto	1429,48.975,41.146,12,0
A	goto	1429,49.262,40.633,12,0
A	goto	1429,49.510,40.095,6,0
A	goto	1429,49.691,40.230,6,0
A	goto	1429,49.595,40.673,6,0
A	goto	1429,49.324,40.492,6,0
A	goto	1429,49.436,39.881,10,0
A	goto	1429/0,-188.23,-8851.58,12
S	Mage
T	season	0,1
A	goto	1429/0,-188.23,-8851.58
A	turnin	3104
A	trainer	
A	target	Khelden Bremen
S	Priest
T	optional	
T	completewith	next
A	goto	1429/0,-175.70,-8881.62,15,0
A	goto	1429/0,-193.06,-8870.05,10
S	Priest
A	goto	1429/0,-193.34,-8853.59
A	turnin	3103
A	trainer	
A	target	Priestess Anetta
S	Warrior/Paladin
T	optional	
T	completewith	next
A	goto	1429/0,-186.12,-8907.08,15
A	goto	1429/0,-186.12,-8907.08,15
S	Warrior
T	season	0,1
A	goto	1429/0,-208.40,-8918.35
A	turnin	3100
A	trainer	
A	target	Llane Beshere
S	Paladin
T	season	0,1
A	goto	1429/0,-215.03,-8914.58
A	turnin	3101
A	trainer	
A	target	Brother Sammuel
S	
T	season	0,1 << Warrior
A	goto	1429/0,-136.52,-8933.53
A	accept	18
A	target	Deputy Willem
S	Hunter
A	goto	1429/0,-242.100,-8884.200
A	target	Tordrin Sternblade::248415
A	turnin	92479
A	trainer	
S	Warlock
A	goto	1429/0,-195.59,-8926.73
A	train	172
A	target	Drusilla La Salle
S	
T	season	0,1
T	loop	
A	goto	1429/0,-288.51,-9068.87,0
A	goto	1429/0,-388.47,-9001.28,0
A	goto	1429/0,-288.51,-9068.87,30,0
A	goto	1429/0,-335.02,-9108.91,30,0
A	goto	1429/0,-376.67,-9073.73,30,0
A	goto	1429/0,-388.47,-9001.28,30,0
A	goto	1429/0,-333.97,-9028.59,30,0
A	complete	18,1
A	mob	Defias Thug
S	Rogue
T	optional	
T	loop	
A	goto	1429/0,-288.51,-9068.87,0
A	goto	1429/0,-388.47,-9001.28,0
A	goto	1429/0,-288.51,-9068.87,30,0
A	goto	1429/0,-335.02,-9108.91,30,0
A	goto	1429/0,-376.67,-9073.73,30,0
A	goto	1429/0,-388.47,-9001.28,30,0
A	goto	1429/0,-333.97,-9028.59,30,0
A	xp	4
S	
T	season	0,1
A	goto	1429/0,-136.48,-8933.47
A	turnin	18,1
A	turnin	18,2
A	turnin	18,3
A	turnin	18,4
A	turnin	18,5
A	turnin	18
A	accept	3903
A	accept	6
A	target	Deputy Willem
S	Paladin
T	season	0,1
T	completewith	RestandR
A	equip	16,5579
A	use	5579
A	itemcount	5579,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.6
S	Rogue
T	season	0,1
T	completewith	RestandR
A	equip	16,2224
A	use	2224
A	itemcount	2224,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.0
S	Warrior
T	completewith	RestandR
A	equip	16,1161
A	use	1161
A	itemcount	1161,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.0
S	
T	optional	
A	isOnQuest	91745
A	goto	1429/0,-102.300,-8684.500
A	target	Kelsey Fargo::247226
A	turnin	91745
A	accept	91752
S	
T	optional	
A	isQuestTurnedIn	91745
A	goto	1429/0,-102.300,-8684.500
A	target	Kelsey Fargo::247226
A	accept	91752
S	
T	optional	
T	completewith	KoboldLaborers
A	goto	1429/0,-117.74,-8681.87,20
S	
T	completewith	KoboldLaborers
A	isOnQuest	91752
A	goto	1429/0,-172.700,-8587.601
A	complete	91752,1
A	target	Shinyfinder Narf
S	
T	completewith	KoboldLaborers
A	isOnQuest	91743
A	complete	91743,1
S	
T	label	KoboldLaborers
T	loop	
A	goto	1429,47.784,31.540,0
A	goto	1429,48.659,29.161,0
A	goto	1429,50.491,26.867,0
A	goto	1429,47.784,31.540,30,0
A	goto	1429,47.909,30.850,30,0
A	goto	1429,48.107,30.271,30,0
A	goto	1429,48.428,30.248,30,0
A	goto	1429,48.398,29.842,30,0
A	goto	1429,48.659,29.161,30,0
A	goto	1429,48.245,28.598,30,0
A	goto	1429,48.637,27.354,30,0
A	goto	1429,48.501,26.700,30,0
A	goto	1429,49.979,25.620,30,0
A	goto	1429,50.491,26.867,30,0
A	complete	21,1
A	mob	Kobold Laborer
S	
A	isOnQuest	91743
T	loop	
A	goto	1429,47.784,31.540,0
A	goto	1429,48.659,29.161,0
A	goto	1429,50.491,26.867,0
A	goto	1429,47.784,31.540,30,0
A	goto	1429,47.909,30.850,30,0
A	goto	1429,48.107,30.271,30,0
A	goto	1429,48.428,30.248,30,0
A	goto	1429,48.398,29.842,30,0
A	goto	1429,48.659,29.161,30,0
A	goto	1429,48.245,28.598,30,0
A	goto	1429,48.637,27.354,30,0
A	goto	1429,48.501,26.700,30,0
A	goto	1429,49.979,25.620,30,0
A	goto	1429,50.491,26.867,30,0
A	complete	91743,1
A	mob	Kobold Laborer
A	mob	Kobold Worker
S	
A	isOnQuest	91752
A	goto	1429/0,-172.700,-8587.601
A	complete	91752,1
A	target	Shinyfinder Narf
S	
A	goto	1429/0,-224.02,-8850.30
A	turnin	3903
A	accept	3904
A	target	Milly Osworth
S	Rogue
T	season	0,1
A	goto	1429/0,-210.90,-8863.47
A	turnin	3102
A	train	1784
A	train	921
A	target	Jorik Kerridan
S	Priest/Mage
T	loop	
A	goto	1429/0,-288.51,-9068.87,0
A	goto	1429/0,-388.47,-9001.28,0
A	goto	1429/0,-288.51,-9068.87,30,0
A	goto	1429/0,-335.02,-9108.91,30,0
A	goto	1429/0,-376.67,-9073.73,30,0
A	goto	1429/0,-388.47,-9001.28,30,0
A	goto	1429/0,-333.97,-9028.59,30,0
A	complete	3904,1
S	
A	goto	1429,57.518,48.253
A	complete	6,1
A	mob	Garrick Padfoot
S	
T	requires	CuttyNote << Rogue --Season 2
T	optional	
T	loop	
A	goto	1429/0,-288.51,-9068.87,0
A	goto	1429/0,-388.47,-9001.28,0
A	goto	1429/0,-288.51,-9068.87,30,0
A	goto	1429/0,-335.02,-9108.91,30,0
A	goto	1429/0,-376.67,-9073.73,30,0
A	goto	1429/0,-388.47,-9001.28,30,0
A	goto	1429/0,-333.97,-9028.59,30,0
A	xp	5
A	mob	Defias Thug
S	
T	optional	
T	softcore	
T	completewith	next
A	deathskip	
A	target	Spirit Healer
S	Priest/Mage
A	goto	1429/0,-224.02,-8850.30
A	turnin	3904
A	accept	3905
A	target	Milly Osworth
S	
A	goto	1429/0,-136.48,-8933.47
A	turnin	6,2
A	turnin	6,1
A	target	Deputy Willem
S	
T	optional	
A	goto	1429/0,-162.62,-8902.59
A	turnin	91752
A	accept	91758
A	target	Marshal McBride
A	isOnQuest	91752
S	
T	optional	
A	goto	1429/0,-162.62,-8902.59
A	accept	91758
A	target	Marshal McBride
A	isQuestTurnedIn	91752
S	
T	label	RestandR
A	goto	1429/0,-162.62,-8902.59
A	turnin	21,1
A	turnin	21,2
A	turnin	21,3
A	accept	54
A	accept	96627
A	target	Marshal McBride
S	
T	optional	
A	isQuestComplete	91743
A	goto	1429/0,-186.12,-8874.91
A	turnin	91743
A	accept	91745
A	target	Brother Paxton
S	
T	optional	
A	isQuestTurnedIn	91743
A	goto	1429/0,-186.12,-8874.91
A	accept	91745
A	target	Brother Paxton
S	Priest/Mage
T	optional	
T	completewith	next
A	goto	1429/0,-186.12,-8902.45,15,0
A	goto	1429/0,-161.82,-8895.51,10
S	Priest/Mage
A	goto	1429/0,-181.64,-8902.13
A	turnin	3905,1
A	target	Brother Neals
S	Priest
T	season	0,1
A	goto	1429/0,-193.34,-8853.59
A	accept	5623
A	target	Priestess Anetta
S	
T	optional	
A	isOnQuest	91745
A	goto	1429/0,-102.300,-8684.500
A	target	Kelsey Fargo::247226
A	turnin	91745
A	accept	91752
S	
T	optional	
A	isQuestTurnedIn	91745
A	goto	1429/0,-102.300,-8684.500
A	target	Kelsey Fargo::247226
A	accept	91752
S	
T	optional	
T	completewith	KoboldLaborers
A	goto	1429/0,-117.74,-8681.87,20
S	
A	isOnQuest	91752
A	goto	1429/0,-172.700,-8587.601
A	complete	91752,1
A	target	Shinyfinder Narf
S	
T	completewith	next
A	deathskip	
A	target	Spirit Healer
S	
T	optional	
A	goto	1429/0,-162.62,-8902.59
A	turnin	91752
A	accept	91758
A	target	Marshal McBride
A	isOnQuest	91752
S	
T	optional	
A	goto	1429/0,-162.62,-8902.59
A	accept	91758
A	target	Marshal McBride
A	isQuestTurnedIn	91752
S	
A	isOnQuest	91758
A	goto	1429/0,-242.000,-8884.300
A	target	Tordrin Sternblade::248415
A	turnin	91758
A	accept	91772
S	
A	isQuestTurnedIn	91758
A	goto	1429/0,-242.000,-8884.300
A	target	Tordrin Sternblade::248415
A	accept	91772
S	
T	completewith	RnR
A	isOnQuest	91772
A	goto	1429/0,-46.00,-9044.61,5
A	use	247970
A	complete	91772,1
A	disablecheckbox	
S	
T	label	RnR
A	goto	1429/0,-46.00,-9044.61
A	accept	2158
A	target	Falkhaan Isenstrider
E
G	Guides/forever/Alliance-1-13_Human.lua
M	classic	
M	tbc	
M	season	0,1
M	version	1
M	selector	Alliance
M	group	RestedXP Forever Guide (A)
M	subgroup	Speedrun Guide 1-20
M	name	6-11 Elwynn Forest
M	displayname	6-13 Elwynn Forest << SoD
M	next	11-13 Loch Modan
M	defaultfor	Human
S	skip -- removing for now for camp fire buff/questline
T	season	0,1 << Rogue
T	softcore	
T	completewith	Goldshire
A	deathskip	
A	target	Spirit Healer
A	subzoneskip	87
S	
T	completewith	CampQuest
A	isOnQuest	91772
A	use	247970
A	complete	91772,1
S	
T	completewith	CampQuest
A	itemcount	247841,1
A	use	247841
S	
T	completewith	CampQuest
A	itemcount	247846,1
A	use	247846
S	
T	completewith	CampQuest
A	itemcount	247840,1
A	use	247840
S	
T	label	CampQuest
A	goto	1429/0,-22.99,-9404.71
A	turnin	96627
A	accept	95998
A	target	Sam Sarsaparilla
S	
A	goto	1429/0,-22.99,-9402.40
A	complete	95998,1
A	complete	95998,2
S	
A	goto	1429/0,-22.99,-9404.71
A	turnin	95998
A	accept	96626
A	accept	97924
A	target	Sam Sarsaparilla
A	skill	skinning,<1,1
S	
A	goto	1429/0,-22.99,-9404.71
A	turnin	95998
A	accept	96626
A	accept	97921
A	target	Sam Sarsaparilla
A	skill	herbalism,<1,1
S	
A	goto	1429/0,-22.99,-9404.71
A	turnin	95998
A	accept	96626
A	accept	97923
A	target	Sam Sarsaparilla
A	skill	mining,<1,1
S	
A	goto	1429/0,-22.99,-9404.71
A	turnin	95998
A	accept	96626
A	target	Sam Sarsaparilla
S	
A	isOnQuest	91772
T	loop	
A	goto	1429/0,-77.600,-9140.900,55,0
A	goto	1429/0,-44.100,-9246.500,55,0
A	goto	1429/0,8.800,-9327.900,55,0
A	goto	1429/0,66.000,-9374.000,55,0
A	use	247970
A	complete	91772,1
S	Warrior/Rogue/Paladin
A	goto	1429/0,87.87,-9456.65
A	train	2018
A	target	Smith Argus
S	Warrior
A	goto	1429/0,94.01,-9464.8900
A	vendor	54
A	collect	2488,1
A	disablecheckbox	
A	target	Corina Steele
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.8
S	Warrior
T	completewith	next
A	use	2488
A	itemcount	2488,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.8
S	Rogue
A	goto	1429/0,94.01,-9464.8900
A	vendor	54
A	collect	2494,1
A	disablecheckbox	
A	target	Corina Steele
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Rogue
T	completewith	GSHS
A	use	2494
A	itemcount	2494,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Paladin
A	goto	1429/0,94.01,-9464.8900
A	vendor	54
A	collect	2493,1
A	disablecheckbox	
A	target	Corina Steele
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<5.0
S	Paladin
T	completewith	next
A	use	2493
A	itemcount	2493,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<5.0
S	Mage/Priest/Warlock
T	optional	
T	completewith	next
A	goto	1429/0,87.87,-9462.26
A	vendor	
A	target	Andrew Krighton
S	
A	isOnQuest	91772
A	goto	1429/0,74.02,-9465.52
A	turnin	54
A	turnin	91772
A	accept	62
A	accept	91775
A	target	Marshal Dughan
S	
A	isQuestTurnedIn	91772
A	goto	1429/0,74.02,-9465.52
A	turnin	54
A	accept	62
A	accept	91775
A	target	Marshal Dughan
S	
T	label	Goldshire
A	goto	1429/0,74.02,-9465.52
A	turnin	54
A	accept	62
A	target	Marshal Dughan
S	
A	goto	1429/0,31.92,-9460.38
A	accept	60
A	target	William Pestle
S	
T	label	GSHS
A	goto	1429/0,16.20,-9462.65
A	turnin	2158,1
A	turnin	2158,2
A	home	
A	target	Innkeeper Farley
S	
A	goto	1429/0,-5.63,-9467.21
A	train	2550
A	turnin	96626
A	target	Tomas
S	
T	optional	
A	xp	6
S	Rogue
A	goto	1429/0,9.64,-9465.36
A	vendor	151
A	collect	2946,1
A	disablecheckbox	
A	target	Brog Hamfist
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.0
S	Rogue
T	optional	
T	sticky	
T	label	BalancedDaggers1
A	use	2946
A	itemcount	2946,1
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.0
S	Rogue
T	optional	
T	sticky	
T	requires	BalancedDaggers1
T	label	DeleteOldDaggers
A	destroy	2947
S	Warlock
T	optional	
T	completewith	next
A	goto	1429/0,-5.63,-9460.26,5
S	Warlock
A	goto	1429/0,-5.36,-9472.760
A	trainer	
A	target	Maximillian Crowe
S	Warlock
A	goto	1429/0,-5.53,-9466.95
A	vendor	6374
A	target	Cylina Darkheart
A	money	<0.0100
A	itemcount	16321,<1
A	train	20397,1
S	Mage/Rogue/Priest
T	optional	
T	completewith	next
A	goto	1429/0,12.52,-9479.85,9
S	Mage
A	target	Zaldimar Wefhellt
A	goto	1429/0,34.28,-9471.61
A	trainer	
S	Priest
A	target	Priestess Josetta
A	goto	1429/0,33.14,-9460.75
A	turnin	5623
A	accept	5624
A	trainer	
S	Rogue
A	money	<0.01
A	target	Keryn Sylvius
A	goto	1429/0,12.69,-9465.75
A	trainer	
S	Warrior/Rogue
A	goto	1429/0,16.20,-9462.65
A	vendor	295
A	vendor	295
A	collect	414,20
A	disablecheckbox	
A	target	Innkeeper Farley
A	itemcount	414,<7
S	Warrior
A	goto	1429/0,109.36,-9461.84
A	trainer	
A	target	Lyria Du Lac
S	Paladin
A	goto	1429/0,109.04,-9468.16
A	trainer	
A	target	Brother Wilhelm
S	
T	requires	DeleteOldDaggers << Rogue
A	goto	Elwynn Forest,42.140,67.254
A	accept	47
A	target	Remy "Two Times"
S	Hunter
A	goto	1429/0,75.400,-9480.300
A	collect	2506,1
A	target	Nordun Steadysight
A	money	<0.0281
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.38
S	Hunter
A	goto	Teldrassil,55.890,59.205
A	vendor	
A	target	Jeena Featherbow
S	Hunter
T	completewith	next
A	equip	18,2506
A	use	2506
A	itemcount	2506,1
S	Hunter
A	goto	1429/0,107.200,-9472.400
A	trainer	
A	target	Josephine Carson
S	Priest
A	goto	1429/0,-135.72,-9514.56
A	complete	5624,1
A	target	Guard Roberts
S	
T	sticky	
T	label	BoarMeatQuest
T	loop	
A	goto	1429/0,406.84,-9917.23,0
A	goto	1429/0,456.65,-9825.69,0
A	goto	1429/0,279.60,-9971.76,0
A	goto	1429/0,86.93,-9952.95,0
A	goto	1429/0,225.49,-9751.09,0
A	goto	1429/0,92.38,-9548.20,0
A	waypoint	1429/0,454.25,-9915.31,40,0
A	waypoint	1429/0,387.26,-9944.94,40,0
A	waypoint	1429/0,372.34,-9912.07,40,0
A	waypoint	1429/0,418.85,-9881.06,40,0
A	collect	769,4,86,1
A	mob	Stonetusk Boar
S	
T	optional	
T	requires	BoarMeatQuest
T	label	BoarMeatCooking1
T	completewith	Pie
A	goto	1429/0,406.84,-9917.23,0
A	goto	1429/0,456.65,-9825.69,0
A	goto	1429/0,279.60,-9971.76,0
A	goto	1429/0,86.93,-9952.95,0
A	goto	1429/0,225.49,-9751.09,0
A	goto	1429/0,92.38,-9548.20,0
A	collect	769,10,86,1,0x20,cooking
A	mob	Stonetusk Boar
A	skill	cooking,10,1
S	
T	optional	
T	requires	BoarMeatCooking1
T	completewith	Pie
A	goto	1429/0,406.84,-9917.23,0
A	goto	1429/0,456.65,-9825.69,0
A	goto	1429/0,279.60,-9971.76,0
A	goto	1429/0,86.93,-9952.95,0
A	goto	1429/0,225.49,-9751.09,0
A	goto	1429/0,92.38,-9548.20,0
A	collect	769,50,86,1,0x20,cooking
A	mob	Stonetusk Boar
A	skill	cooking,50,1
S	
A	accept	85
A	goto	1429/0,338.47,-9889.69
A	target	+"Auntie" Bernice Stonefield
A	accept	88
A	goto	Elwynn Forest,34.660,84.482
A	target	+Ma Stonefield
S	Warrior/Paladin/Rogue
T	optional	
T	label	RoughStone1
T	completewith	NecklaceStart
A	collect	2835,1
A	collect	2589,1 << Paladin
A	itemcount	2862,<1 << Rogue/Warrior
A	itemcount	3239,<1 << Paladin
A	train	2018,3
S	Warrior/Paladin/Rogue
T	optional	
T	requires	RoughStone1
T	label	RoughStoneCraft1
T	completewith	NecklaceStart
A	collect	2862,5 << Rogue/Warrior
A	disablecheckbox	
A	collect	3239,5 << Paladin
A	disablecheckbox	<< Paladin
A	collect	2835,5
A	disablecheckbox	
A	collect	2589,1 << Paladin
A	disablecheckbox	<< Paladin
A	itemcount	2835,1
A	itemcount	2589,1 << Paladin
A	usespell	2018
A	train	2018,3
S	Warrior/Paladin/Rogue
T	optional	
T	requires	RoughStoneCraft1
T	completewith	NecklaceStart
A	cast	2828
A	cast	3112
A	use	2862 << Rogue/Warrior
A	use	3239 << Paladin
A	itemcount	2862,1 << Rogue/Warrior
A	itemcount	3239,1 << Paladin
A	aura	2828 << Warrior/Rogue
A	aura	3112 << Paladin
A	train	2018,3
S	
A	isNotOnQuest	91775
T	optional	
T	completewith	NecklaceStart
A	goto	1429/0,223.09,-9916.240,0
A	complete	60,1
A	complete	47,1
A	mob	Kobold Tunneler
A	mob	Kobold Miner
S	
A	isOnQuest	91775
T	optional	
T	completewith	NecklaceStart
A	goto	1429/0,223.09,-9916.240,0
A	complete	60,1
A	complete	47,1
A	complete	91775,2
A	mob	Kobold Tunneler
A	mob	Kobold Miner
S	
T	label	NecklaceStart
A	goto	1429/0,38.41,-9923.69
A	turnin	85
A	accept	86
A	target	Billy Maclure
S	
A	goto	1429/0,37.61,-10014.03
A	accept	106
A	target	Maybell Maclure
S	
T	optional	
T	completewith	Lovers
A	goto	1429/0,65.28,-10008.20
A	vendor	
A	vendor	
A	target	Joshua Maclure
A	subzoneskip	64,1
S	Warrior/Paladin/Rogue
T	optional	
T	label	RoughStone2
T	completewith	Lovers
A	collect	2835,1
A	collect	2589,1 << Paladin
A	itemcount	2862,<1 << Rogue/Warrior
A	itemcount	3239,<1 << Paladin
A	train	2018,3
S	Warrior/Paladin/Rogue
T	optional	
T	requires	RoughStone2
T	label	RoughStoneCraft2
T	completewith	Lovers
A	collect	2862,5 << Rogue/Warrior
A	disablecheckbox	
A	collect	3239,5 << Paladin
A	disablecheckbox	<< Paladin
A	collect	2835,5
A	disablecheckbox	
A	collect	2589,1 << Paladin
A	disablecheckbox	<< Paladin
A	itemcount	2835,1
A	itemcount	2589,1 << Paladin
A	usespell	2018
A	train	2018,3
S	Warrior/Paladin/Rogue
T	optional	
T	requires	RoughStoneCraft2
T	completewith	Lovers
A	cast	2828
A	cast	3112
A	use	2862 << Rogue/Warrior
A	use	3239 << Paladin
A	itemcount	2862,1 << Rogue/Warrior
A	itemcount	3239,1 << Paladin
A	aura	2828 << Warrior/Rogue
A	aura	3112 << Paladin
A	train	2018,3
S	
A	isNotOnQuest	91775
T	optional	
T	completewith	Lovers
A	goto	1429/0,223.09,-9916.240,0
A	complete	60,1
A	complete	47,1
A	mob	Kobold Tunneler
A	mob	Kobold Miner
S	
A	isOnQuest	91775
T	optional	
T	completewith	Lovers
A	goto	1429/0,223.09,-9916.240,0
A	complete	60,1
A	complete	47,1
A	complete	91775,2
A	mob	Kobold Tunneler
A	mob	Kobold Miner
S	
T	label	Lovers
A	goto	Elwynn Forest,29.840,85.997
A	turnin	106
A	accept	111
A	target	Tommy Joe Stonefield
S	
T	requires	BoarMeatQuest
T	label	Pie
A	goto	1429/0,338.47,-9889.69
A	turnin	86
A	accept	84
A	target	"Auntie" Bernice Stonefield
S	
A	goto	1429,34.945,83.855
A	turnin	111
A	accept	107
A	target	Gramma Stonefield
S	Warrior/Paladin/Rogue
T	optional	
T	label	RoughStone3
T	completewith	Exchange
A	collect	2835,1
A	collect	2589,1 << Paladin
A	itemcount	2862,<1 << Rogue/Warrior
A	itemcount	3239,<1 << Paladin
A	train	2018,3
A	subzoneskip	87
S	Warrior/Paladin/Rogue
T	optional	
T	requires	RoughStone3
T	label	RoughStoneCraft3
T	completewith	Exchange
A	collect	2862,5 << Rogue/Warrior
A	disablecheckbox	
A	collect	3239,5 << Paladin
A	disablecheckbox	<< Paladin
A	collect	2835,5
A	disablecheckbox	
A	collect	2589,1 << Paladin
A	disablecheckbox	<< Paladin
A	itemcount	2835,1
A	itemcount	2589,1 << Paladin
A	usespell	2018
A	train	2018,3
A	subzoneskip	87
S	Warrior/Paladin/Rogue
T	optional	
T	requires	RoughStoneCraft3
T	completewith	Exchange
A	cast	2828
A	cast	3112
A	use	2862 << Rogue/Warrior
A	use	3239 << Paladin
A	itemcount	2862,1 << Rogue/Warrior
A	itemcount	3239,1 << Paladin
A	aura	2828 << Warrior/Rogue
A	aura	3112 << Paladin
A	train	2018,3
A	subzoneskip	87
S	
A	isNotOnQuest	91775
T	sticky	
T	label	KoboldEnd1
T	loop	
A	goto	1429/0,223.09,-9916.240,0
A	waypoint	1429/0,176.93,-9857.68,35,0
A	waypoint	1429/0,176.24,-9902.12,35,0
A	waypoint	1429/0,223.09,-9916.240,35,0
A	waypoint	1429/0,259.54,-9865.09,35,0
A	waypoint	1429/0,215.81,-9830.600,35,0
A	complete	60,1
A	complete	47,1
A	mob	Kobold Tunneler
A	mob	Kobold Miner
S	
A	isOnQuest	91775
T	sticky	
T	label	KoboldEnd2
T	loop	
A	goto	1429/0,223.09,-9916.240,0
A	waypoint	1429/0,176.93,-9857.68,35,0
A	waypoint	1429/0,176.24,-9902.12,35,0
A	waypoint	1429/0,223.09,-9916.240,35,0
A	waypoint	1429/0,259.54,-9865.09,35,0
A	waypoint	1429/0,215.81,-9830.600,35,0
A	complete	60,1
A	complete	47,1
A	complete	91775,2
A	mob	Kobold Tunneler
A	mob	Kobold Miner
S	
A	goto	1429/0,38.41,-9923.69
A	turnin	84
A	accept	87
A	target	Billy Maclure
S	
A	goto	1429/0,181.44,-9842.170,15,0
A	goto	1429/0,149.86,-9793.80
A	complete	62,1
S	
T	season	0,1
A	goto	1429,41.732,78.024
A	complete	87,1
A	mob	Goldtooth
S	
A	isOnQuest	91775
A	goto	1429/0,91.200,-9788.500
A	complete	91775,1
A	mob	Nimsy
S	Warrior
T	optional	
T	completewith	Exchange
A	subzoneskip	87
S	
T	requires	KoboldEnd1
S	
T	requires	KoboldEnd2
S	
T	loop	
A	goto	1429/0,223.09,-9916.240,0
A	goto	1429/0,176.93,-9857.68,35,0
A	goto	1429/0,176.24,-9902.12,35,0
A	goto	1429/0,223.09,-9916.240,35,0
A	goto	1429/0,259.54,-9865.09,35,0
A	goto	1429/0,215.81,-9830.600,35,0
A	xp	7+1140
A	mob	Kobold Tunneler
A	mob	Kobold Miner
A	isQuestComplete	91775
S	
T	loop	
A	goto	1429/0,223.09,-9916.240,0
A	goto	1429/0,176.93,-9857.68,35,0
A	goto	1429/0,176.24,-9902.12,35,0
A	goto	1429/0,223.09,-9916.240,35,0
A	goto	1429/0,259.54,-9865.09,35,0
A	goto	1429/0,215.81,-9830.600,35,0
A	xp	7+1815
A	mob	Kobold Tunneler
A	mob	Kobold Miner
A	isQuestNotComplete	91775
S	
T	label	Goldtooth
A	goto	1429/0,338.47,-9889.69
A	turnin	87
A	target	"Auntie" Bernice Stonefield
S	
T	optional	
T	label	BoarMeatCooking2
T	completewith	Exchange
A	goto	1429/0,406.84,-9917.23,0
A	goto	1429/0,456.65,-9825.69,0
A	goto	1429/0,279.60,-9971.76,0
A	goto	1429/0,86.93,-9952.95,0
A	goto	1429/0,225.49,-9751.09,0
A	goto	1429/0,92.38,-9548.20,0
A	collect	769,10,2178,1,0x20,cooking
A	mob	Stonetusk Boar
A	skill	cooking,10,1
A	subzoneskip	57
S	
T	optional	
T	requires	BoarMeatCooking2
T	completewith	Exchange
A	goto	1429/0,406.84,-9917.23,0
A	goto	1429/0,456.65,-9825.69,0
A	goto	1429/0,279.60,-9971.76,0
A	goto	1429/0,86.93,-9952.95,0
A	goto	1429/0,225.49,-9751.09,0
A	goto	1429/0,92.38,-9548.20,0
A	collect	769,50,2178,1,0x20,cooking
A	mob	Stonetusk Boar
A	skill	cooking,50,1
A	subzoneskip	57
S	
T	hardcore	
T	optional	
T	completewith	Exchange
A	goto	Elwynn Forest,42.140,67.254,125
A	subzoneskip	87
S	
T	softcore	
T	completewith	Exchange
A	deathskip	
A	target	Spirit Healer
S	
T	label	Exchange
A	goto	Elwynn Forest,42.140,67.254
A	turnin	47
A	accept	40
A	target	Remy "Two Times"
S	
A	isQuestComplete	91775
A	goto	1429/0,74.02,-9465.52
A	turnin	62
A	accept	76
A	turnin	40
A	accept	35
A	turnin	91775
A	accept	91777
A	target	Marshal Dughan
S	
A	isQuestTurnedIn	91775
A	goto	1429/0,74.02,-9465.52
A	accept	91777
A	target	Marshal Dughan
S	
A	goto	1429/0,74.02,-9465.52
A	turnin	62
A	accept	76
A	turnin	40
A	accept	35
A	target	Marshal Dughan
S	
T	optional	<< Warrior/Rogue/Paladin
T	completewith	CandlesEnd
A	goto	1429/0,94.01,-9464.8900
A	vendor	
A	target	Corina Steele
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,>3.3 << Rogue
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,>3.8 << Warrior
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,>5.0 << Paladin
S	Warrior
A	goto	1429/0,94.01,-9464.8900
A	vendor	54
A	collect	2488,1
A	disablecheckbox	
A	target	Corina Steele
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.8
S	Warrior
T	completewith	CandlesEnd
A	use	2488
A	itemcount	2488,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.8
S	Rogue
A	goto	1429/0,94.01,-9464.8900
A	vendor	54
A	collect	2494,1
A	disablecheckbox	
A	target	Corina Steele
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Rogue
T	completewith	CandlesEnd
A	use	2494
A	itemcount	2494,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Paladin
A	goto	1429/0,94.01,-9464.8900
A	vendor	54
A	collect	2493,1
A	disablecheckbox	
A	target	Corina Steele
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<5.0
S	Paladin
T	completewith	CandlesEnd
A	use	2493
A	itemcount	2493,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<5.0
S	
T	label	CandlesEnd
T	requires	GoldtoothRune << Warrior/Priest --Season 2
A	goto	1429/0,31.92,-9460.38
A	turnin	60
A	accept	61
A	turnin	107
A	accept	112
A	target	William Pestle
S	
T	optional	
A	xp	8
S	Hunter
A	goto	1429/0,107.200,-9472.400
A	trainer	
A	target	Josephine Carson
S	Warrior
A	goto	1429/0,109.36,-9461.84
A	trainer	
A	target	Lyria Du Lac
S	Paladin
T	season	0,1
A	goto	1429/0,109.04,-9468.16
A	trainer	
A	target	Brother Wilhelm
S	Warlock
T	optional	
T	completewith	next
A	goto	1429/0,4.78,-9467.21,10
S	Warlock
A	goto	1429/0,-5.36,-9472.760
A	target	Maximillian Crowe
A	trainer	
S	Warlock
A	goto	1429/0,-5.53,-9466.95
A	vendor	
A	target	Cylina Darkheart
A	money	<0.100
A	itemcount	16302,<1
A	train	20270,1
S	Mage/Priest/Rogue/Warrior/Paladin
T	optional	
T	completewith	next
A	goto	1429/0,12.52,-9479.85,9
S	Mage
A	target	Zaldimar Wefhellt
A	goto	1429/0,34.28,-9471.61
A	trainer	
S	Priest
A	goto	1429/0,33.14,-9460.75
A	target	Priestess Josetta
A	turnin	5624
A	trainer	
S	Rogue
A	target	Keryn Sylvius
A	goto	1429/0,12.69,-9465.75
A	trainer	
S	Rogue/Warrior/Paladin
A	money	<0.01
A	target	Michelle Belle
A	goto	1429/0,29.35,-9456.790
A	train	3273
S	
T	label	GoldshireEnd << Priest --Season 2
A	goto	1429/0,9.64,-9465.36
A	vendor	
A	target	Brog Hamfist
A	money	<0.1250
S	
T	completewith	next
A	goto	1429/0,16.20,-9462.65
A	vendor	
A	vendor	
A	vendor	
A	target	Innkeeper Farley
S	
T	optional	
T	label	WolfMeatCooking1
T	completewith	Jasperlode
A	goto	1429,52.242,62.919,0
A	goto	1429,53.837,60.950,0
A	goto	1429,56.793,60.340,0
A	goto	1429,59.033,60.673,0
A	collect	2672,10,2178,1,0x20,cooking
A	mob	Mangy Wolf
A	skill	cooking,10,1
A	subzoneskip	54
S	
T	optional	
T	requires	WolfMeatCooking1
T	completewith	Jasperlode
A	goto	1429,52.242,62.919,0
A	goto	1429,53.837,60.950,0
A	goto	1429,56.793,60.340,0
A	goto	1429,59.033,60.673,0
A	collect	2672,50,2178,1,0x20,cooking
A	mob	Mangy Wolf
A	skill	cooking,50,1
A	subzoneskip	54
S	
A	goto	1429,47.5,62.2
A	accept	99127
A	target	Jason Mathers
S	
T	softcore	
A	goto	1429,47.6,62.3
A	accept	99143
A	target	Lee Brown
S	
T	loop	
A	goto	1429,48.5,58.3,40,0
A	goto	1429,47.7,65.9,40,0
A	goto	1429,49.9,66.5,40,0
A	complete	99127,1
S	
A	goto	1429,47.5,62.2
A	turnin	99127
A	accept	99128
A	target	Jason Mathers
S	
T	softcore	
T	loop	
A	goto	1429,50.833,65.453,0
A	goto	1429,57.435,63.662,0
A	goto	1429,54.236,66.888,0
A	goto	1429,50.833,65.453,50,0
A	goto	1429,52.020,65.177,50,0
A	goto	1429,54.144,62.468,50,0
A	goto	1429,56.332,63.538,50,0
A	goto	1429,57.162,62.157,50,0
A	goto	1429,57.435,63.662,50,0
A	goto	1429,58.237,64.888,50,0
A	goto	1429,56.897,67.017,50,0
A	goto	1429,55.523,66.707,50,0
A	goto	1429,55.203,66.171,50,0
A	goto	1429,54.236,66.888,50,0
A	complete	99128,2
A	mob	+Murloc
A	complete	99128,1
A	mob	+Murloc Streamrunner
A	complete	112,1
A	mob	+Murloc
A	mob	+Murloc Streamrunner
A	complete	99143,1
A	disablecheckbox	
S	
T	hardcore	
T	loop	
A	goto	1429,50.833,65.453,0
A	goto	1429,57.435,63.662,0
A	goto	1429,54.236,66.888,0
A	goto	1429,50.833,65.453,50,0
A	goto	1429,52.020,65.177,50,0
A	goto	1429,54.144,62.468,50,0
A	goto	1429,56.332,63.538,50,0
A	goto	1429,57.162,62.157,50,0
A	goto	1429,57.435,63.662,50,0
A	goto	1429,58.237,64.888,50,0
A	goto	1429,56.897,67.017,50,0
A	goto	1429,55.523,66.707,50,0
A	goto	1429,55.203,66.171,50,0
A	goto	1429,54.236,66.888,50,0
A	complete	99128,2
A	mob	+Murloc
A	complete	99128,1
A	mob	+Murloc Streamrunner
A	complete	112,1
A	mob	+Murloc
A	mob	+Murloc Streamrunner
S	
T	softcore	
T	loop	
A	goto	1429,50.833,65.453,0
A	goto	1429,57.435,63.662,0
A	goto	1429,54.236,66.888,0
A	goto	1429,50.833,65.453,50,0
A	goto	1429,52.020,65.177,50,0
A	goto	1429,54.144,62.468,50,0
A	goto	1429,56.332,63.538,50,0
A	goto	1429,57.162,62.157,50,0
A	goto	1429,57.435,63.662,50,0
A	goto	1429,58.237,64.888,50,0
A	goto	1429,56.897,67.017,50,0
A	goto	1429,55.523,66.707,50,0
A	goto	1429,55.203,66.171,50,0
A	goto	1429,54.236,66.888,50,0
A	complete	99143,1
S	
A	isQuestComplete	99143
A	goto	1429,47.6,62.3
A	turnin	99143
A	target	Lee Brown
S	
A	goto	1429,47.5,62.2
A	turnin	99128
A	accept	99129
A	target	Jason Mathers
S	Warrior/Paladin/Rogue
T	optional	
T	label	RoughStone4
T	completewith	JasperlodeExplore
A	collect	2835,1
A	collect	2589,1 << Paladin
A	itemcount	2862,<1 << Rogue/Warrior
A	itemcount	3239,<1 << Paladin
A	train	2018,3
A	mob	Kobold Miner
S	Warrior/Paladin/Rogue
T	optional	
T	requires	RoughStone4
T	label	RoughStoneCraft4
T	completewith	JasperlodeExplore
A	collect	2862,5 << Rogue/Warrior
A	disablecheckbox	
A	collect	3239,5 << Paladin
A	disablecheckbox	<< Paladin
A	collect	2835,5
A	disablecheckbox	
A	collect	2589,1 << Paladin
A	disablecheckbox	<< Paladin
A	itemcount	2835,1
A	itemcount	2589,1 << Paladin
A	usespell	2018
A	train	2018,3
S	Warrior/Paladin/Rogue
T	optional	
T	requires	RoughStoneCraft4
T	completewith	JasperlodeExplore
A	cast	2828
A	cast	3112
A	use	2862 << Rogue/Warrior
A	use	3239 << Paladin
A	itemcount	2862,1 << Rogue/Warrior
A	itemcount	3239,1 << Paladin
A	aura	2828 << Warrior/Rogue
A	aura	3112 << Paladin
A	train	2018,3
S	
T	optional	
T	requires	MurlocRune << Warrior/Rogue --Season 2
T	label	Jasperlode
T	completewith	JasperlodeExplore
A	goto	1429/0,-604.49,-9180.39,15
S	
T	label	JasperlodeExplore
A	goto	1429/0,-588.73,-9130.67,15,0
A	goto	1429/0,-572.07,-9116.55,15,0
A	goto	1429/0,-560.62,-9100.58
A	complete	76,1
S	
A	isOnQuest	91777
A	goto	1429/0,-595.100,-9072.200
A	complete	91777,1
A	mob	Geosculptor Yip
S	
A	isOnQuest	91777
A	goto	1429/0,-620.200,-9050.800
A	complete	91777,2
A	mob	Mother Fang
S	
A	isQuestComplete	91777
T	completewith	next
A	goto	1429/0,-590.300,-9208.101,10,0
A	goto	1429/0,-508.400,-9249.101,10,0
A	goto	1429/0,-493.900,-9208.000,10,0
A	goto	1429/0,-493.000,-9157.400,18
S	
A	isQuestComplete	91777
A	goto	1429/0,-135.800,-8913.700,10,0
A	goto	1429/0,-186.200,-8874.800
A	target	Brother Paxton::951
A	turnin	91777
S	
A	isQuestTurnedIn	91777
T	completewith	Find
A	goto	1429/0,-439.500,-9118.500,25,0
A	goto	1429/0,-468.400,-9147.200,10,0
A	goto	1429/0,-497.100,-9173.000,20
S	Warrior/Paladin/Rogue
T	optional	
T	label	RoughStone5
T	completewith	Find
A	collect	2835,1
A	collect	2589,1 << Paladin
A	itemcount	2862,<1 << Rogue/Warrior
A	itemcount	3239,<1 << Paladin
A	train	2018,3
A	mob	Kobold Miner
A	subzoneskip	54,1
S	Warrior/Paladin/Rogue
T	optional	
T	requires	RoughStone5
T	label	RoughStoneCraft5
T	completewith	Find
A	collect	2862,5 << Rogue/Warrior
A	disablecheckbox	
A	collect	3239,5 << Paladin
A	disablecheckbox	<< Paladin
A	collect	2835,5
A	disablecheckbox	
A	collect	2589,1 << Paladin
A	disablecheckbox	<< Paladin
A	itemcount	2835,1
A	itemcount	2589,1 << Paladin
A	usespell	2018
A	train	2018,3
A	subzoneskip	54,1
S	Warrior/Paladin/Rogue
T	optional	
T	requires	RoughStoneCraft5
T	completewith	Find
A	cast	2828
A	cast	3112
A	use	2862 << Rogue/Warrior
A	use	3239 << Paladin
A	itemcount	2862,1 << Rogue/Warrior
A	itemcount	3239,1 << Paladin
A	aura	2828 << Warrior/Rogue
A	aura	3112 << Paladin
A	train	2018,3
A	subzoneskip	54,1
S	
T	optional	
T	label	ExitJasperlode
T	completewith	Find
A	goto	1429,61.820,53.871,15
A	subzoneskip	54,1
S	
T	optional	
T	requires	ExitJasperlode
T	label	WolfMeatCooking2
T	completewith	Find
A	goto	1429,69.348,67.452,0
A	goto	1429,67.244,63.880,0
A	goto	1429,63.748,64.710,0
A	collect	2672,10,2178,1,0x20,cooking
A	mob	Gray Forest Wolf
A	skill	cooking,10,1
S	
T	optional	
T	requires	WolfMeatCooking2
T	completewith	Find
A	goto	1429,69.348,67.452,0
A	goto	1429,67.244,63.880,0
A	goto	1429,63.748,64.710,0
A	collect	2672,50,2178,1,0x20,cooking
A	mob	Gray Forest Wolf
A	skill	cooking,50,1
S	
T	optional	
T	completewith	Find
A	mob	Young Forest Bear
S	
T	label	Find
T	requires	JasperlodeRune << Mage --Season 2
A	goto	1429/0,-1032.06,-9610.23
A	turnin	35
A	accept	37
A	accept	52
A	target	Guard Thomas
S	
T	season	0,1 << Rogue/Priest
T	completewith	AcceptBundle
A	complete	52,1
A	mob	+Prowler
A	complete	52,2
A	mob	+Young Forest Bear
S	
T	optional	
T	label	WolfMeatCooking3
T	completewith	LostGuards
A	goto	1429,73.679,67.978,0
A	goto	1429,72.275,65.278,0
A	goto	1429,71.605,61.294,0
A	collect	2672,10,2178,1,0x20,cooking
A	mob	Gray Forest Wolf
A	mob	Prowler
A	skill	cooking,10,1
S	
T	optional	
T	requires	WolfMeatCooking3
T	completewith	LostGuards
A	goto	1429,73.679,67.978,0
A	goto	1429,72.275,65.278,0
A	goto	1429,71.605,61.294,0
A	collect	2672,50,2178,1,0x20,cooking
A	mob	Gray Forest Wolf
A	mob	Prowler
A	skill	cooking,50,1
S	
T	label	LostGuards
A	goto	1429/0,-986.35,-9336.06
A	turnin	37
A	accept	45
S	
T	optional	
T	label	WolfMeatCooking4
T	completewith	AcceptBundle
A	goto	1429,73.679,67.978,0
A	goto	1429,72.275,65.278,0
A	goto	1429,71.605,61.294,0
A	collect	2672,10,2178,1,0x20,cooking
A	mob	Prowler
A	skill	cooking,10,1
A	subzoneskip	88
S	
T	optional	
T	requires	WolfMeatCooking4
T	completewith	AcceptBundle
A	goto	1429,73.679,67.978,0
A	goto	1429,72.275,65.278,0
A	goto	1429,71.605,61.294,0
A	collect	2672,50,2178,1,0x20,cooking
A	mob	Prowler
A	skill	cooking,50,1
A	subzoneskip	88
S	
T	label	AcceptBundle
A	goto	1429/0,-1289.22,-9469.80
A	accept	5545
A	target	Supervisor Raelen
S	
T	season	0,1 << Rogue
T	optional	
A	goto	1429/0,-1355.20,-9469.27
A	vendor	
A	target	Rallic Finn
A	subzoneskip	88,1
S	
T	optional	
T	label	WolfMeatCooking5
T	completewith	Prowlers
A	goto	1429,73.679,67.978,0
A	goto	1429,72.275,65.278,0
A	goto	1429,71.605,61.294,0
A	collect	2672,10,2178,1,0x20,cooking
A	mob	Prowler
A	skill	cooking,10,1
A	subzoneskip	86
S	
T	optional	
T	requires	WolfMeatCooking5
T	completewith	Prowlers
A	goto	1429,73.679,67.978,0
A	goto	1429,72.275,65.278,0
A	goto	1429,71.605,61.294,0
A	collect	2672,50,2178,1,0x20,cooking
A	mob	Prowler
A	skill	cooking,50,1
A	subzoneskip	86
S	
T	completewith	Prowlers
A	complete	52,1
A	mob	+Prowler
A	complete	52,2
A	mob	+Young Forest Bear
A	subzoneskip	86
S	
T	completewith	next
A	goto	1429/0,-1257.91,-9216.77,0
A	goto	1429/0,-1246.46,-9329.03,0
A	goto	1429/0,-1362.03,-9309.59,0
A	complete	5545,1
S	Paladin
T	softcore	
T	label	Prowlers
A	goto	1429/0,-1234.31,-9224.180
A	turnin	45
A	accept	71
S	Paladin
T	hardcore	
T	label	Prowlers
A	goto	1429/0,-1234.31,-9224.180
A	turnin	45
A	accept	71
S	!Paladin
T	label	Prowlers
A	goto	1429/0,-1234.31,-9224.180
A	turnin	45
A	accept	71
S	
T	optional	
T	label	WolfMeatCooking6
T	completewith	BundleOT
A	goto	1429,73.679,67.978,0
A	goto	1429,72.275,65.278,0
A	goto	1429,71.605,61.294,0
A	collect	2672,10,2178,1,0x20,cooking
A	mob	Prowler
A	skill	cooking,10,1
S	
T	optional	
T	requires	WolfMeatCooking6
T	completewith	BundleOT
A	goto	1429,73.679,67.978,0
A	goto	1429,72.275,65.278,0
A	goto	1429,71.605,61.294,0
A	collect	2672,50,2178,1,0x20,cooking
A	mob	Prowler
A	skill	cooking,50,1
S	
T	completewith	BundleOT
A	complete	52,1
A	mob	+Prowler
A	complete	52,2
A	mob	+Young Forest Bear
S	
T	loop	
A	goto	1429/0,-1257.91,-9216.77,0
A	goto	1429/0,-1246.46,-9329.03,0
A	goto	1429/0,-1362.03,-9309.59,0
A	goto	1429/0,-1257.91,-9216.77,40,0
A	goto	1429/0,-1271.79,-9186.68,40,0
A	goto	1429/0,-1230.14,-9150.34,40,0
A	goto	1429/0,-1271.10,-9147.10,40,0
A	goto	1429/0,-1271.79,-9186.68,40,0
A	goto	1429/0,-1257.91,-9216.77,40,0
A	goto	1429/0,-1232.92,-9251.950,40,0
A	goto	1429/0,-1246.46,-9329.03,40,0
A	goto	1429/0,-1249.58,-9362.13,40,0
A	goto	1429/0,-1285.33,-9365.14,40,0
A	goto	1429/0,-1296.09,-9389.44,40,0
A	goto	1429/0,-1338.09,-9331.11,40,0
A	goto	1429/0,-1354.05,-9354.26,40,0
A	goto	1429/0,-1362.03,-9309.59,40,0
A	goto	1429/0,-1302.68,-9309.12,40,0
A	goto	1429/0,-1257.91,-9216.77,40,0
A	goto	1429/0,-1354.05,-9354.26,40,0
A	goto	1429/0,-1362.03,-9309.59,40,0
A	complete	5545,1
S	
T	label	BundleOT
A	goto	1429/0,-1289.22,-9469.80
A	turnin	5545
A	target	Supervisor Raelen
S	
T	xprate	<1.5 << !Warlock
A	goto	1429/0,-1222.40,-9531.76
A	accept	83
A	target	Sara Timberlain
S	
T	optional	
T	label	WolfMeatCooking7
T	completewith	DeliverStart
A	goto	1429,73.679,67.978,0
A	goto	1429,72.275,65.278,0
A	goto	1429,71.605,61.294,0
A	collect	2672,10,2178,1,0x20,cooking
A	mob	Prowler
A	skill	cooking,10,1
S	
T	optional	
T	requires	WolfMeatCooking7
T	completewith	DeliverStart
A	goto	1429,73.679,67.978,0
A	goto	1429,72.275,65.278,0
A	goto	1429,71.605,61.294,0
A	collect	2672,50,2178,1,0x20,cooking
A	mob	Prowler
A	skill	cooking,50,1
S	
T	completewith	WaterloggedToolbox
A	complete	52,1
A	mob	+Prowler
A	complete	52,2
A	mob	+Young Forest Bear
S	
A	goto	1429,76.5,71.9
A	accept	91733
A	target	Ormin Pelford
S	
A	complete	91733,2
A	goto	1429,74.3,76.4
S	
A	complete	91733,1
A	goto	1429,76.7,82.5
S	
T	label	WaterloggedToolbox
A	complete	91733,3
A	goto	1429,77.3,86.8
S	
T	loop	
A	goto	1429,77.499,74.518,0
A	goto	1429,80.496,78.223,0
A	goto	1429,87.342,63.763,0
A	goto	1429,77.499,74.518,55,0
A	goto	1429,77.222,77.499,55,0
A	goto	1429,78.483,79.323,55,0
A	goto	1429,80.496,78.223,55,0
A	goto	1429,81.434,76.695,55,0
A	goto	1429,87.145,69.922,55,0
A	goto	1429,87.342,63.763,55,0
A	complete	52,1
A	mob	+Prowler
A	complete	52,2
A	mob	+Young Forest Bear
S	
T	completewith	Level9Grind << Warlock/Warrior/Rogue
T	completewith	DefiasBandits << !Warlock !Warrior !Rogue
A	use	1972
A	collect	1972,1,184
A	accept	184
S	
T	xprate	<1.5 << !Warlock
T	completewith	next
A	complete	83,1
A	mob	Defias Bandit
A	isOnQuest	83
S	
T	label	PrincessC
A	goto	1429/0,-869.87,-9768.10
A	link	https://www.youtube.com/watch?v=GRrXOV-UvD4
A	complete	88,1
A	mob	Princess
S	
T	label	DefiasBandits
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
A	goto	1429/0,-869.87,-9768.10
A	complete	83,1
A	mob	Defias Bandit
A	isOnQuest	83
S	
A	target	Guard Thomas
A	goto	1429/0,-1032.06,-9610.23
A	turnin	52
A	turnin	71
A	accept	39
A	accept	109
A	xp	<9,1
S	
T	label	DeliverStart
A	goto	1429/0,-1032.06,-9610.23
A	turnin	52
A	turnin	71
A	accept	39
A	target	Guard Thomas
S	
A	goto	1429,76.5,71.9
A	turnin	91733
A	target	Ormin Pelford
S	Warlock/Warrior/Rogue/Hunter
T	label	Level9Grind
A	goto	1429/0,-877.85,-9778.98
A	xp	9+3510
A	xp	9+3420
S	!Warlock
T	season	0,1 << Rogue
T	softcore	
T	label	EVDeathskip
T	completewith	RedridgeS
A	deathskip	
A	target	Spirit Healer
A	zoneskip	Redridge Mountains
A	xp	>10,1
S	
T	xprate	<1.5 << !Warlock
T	optional	<< Warlock
A	goto	1429/0,-1222.40,-9531.76
A	turnin	83
A	target	Sara Timberlain
A	isQuestComplete	83
S	!Warlock
T	optional	
T	label	WolfMeatCooking8
T	requires	EVDeathskip
T	completewith	RedridgeS
A	goto	1429,84.448,72.486,0
A	goto	1429,88.611,71.379,0
A	goto	1429,89.657,75.373,0
A	goto	1429,87.250,75.853,0
A	collect	2672,10,2178,1,0x20,cooking
A	mob	Prowler
A	skill	cooking,10,1
S	!Warlock
T	optional	
T	requires	WolfMeatCooking8
T	completewith	RedridgeS
A	goto	1429,84.448,72.486,0
A	goto	1429,88.611,71.379,0
A	goto	1429,89.657,75.373,0
A	goto	1429,87.250,75.853,0
A	collect	2672,50,2178,1,0x20,cooking
A	mob	Prowler
A	skill	cooking,50,1
S	!Warlock
T	label	RedridgeS
A	goto	1433/0,-1948.56,-9582.75
A	zone	Redridge Mountains
S	!Warlock
T	optional	
A	goto	1433/0,-1948.56,-9582.75
A	accept	244
A	target	Guard Parker
A	xp	<11,1
S	!Warlock
T	softcore	
T	completewith	RRFP
A	deathskip	
A	target	Spirit Healer
A	xp	>10,1
S	!Warlock
T	hardcore	
T	optional	
T	completewith	RRFP
A	goto	1433/0,-1974.20,-9577.07,15,0
A	goto	1433/0,-2077.18,-9608.42,25,0
A	goto	1433/0,-2212.64,-9558.570,25
S	!Warlock
T	optional	
A	goto	1433/0,-2237.93,-9443.60
A	turnin	244
A	target	Deputy Feldon
A	isOnQuest	244
A	xp	<11,1
S	!Warlock
T	season	0,1 << Paladin
T	label	RRFP
A	goto	1433/0,-2234.900,-9435.300
A	fp	Redridge Mountains
A	target	Ariena Stormfeather
S	
T	optional	
T	completewith	CollectKelp
A	hs	
S	Warrior/Rogue
T	optional	
T	completewith	Escape
A	money	>0.50
S	
T	label	CollectKelp
A	goto	1429/0,31.92,-9460.38
A	turnin	112
A	timer	9,Collecting Kelp RP
A	accept	114
A	target	William Pestle
S	Warrior/Rogue
T	optional	
T	completewith	next << Warrior
T	completewith	RogueOptTrain << Rogue
A	goto	1429/0,12.52,-9479.85,9
S	Warrior/Rogue
A	goto	1429/0,29.35,-9456.790
A	train	3273
A	target	Michelle Belle
S	Rogue
T	optional	
T	label	RogueOptTrain
A	goto	1429/0,12.69,-9465.75
A	train	674
A	train	2983
A	target	Keryn Sylvius
A	xp	<10,1
S	
A	goto	1429/0,74.02,-9465.52
A	turnin	39
A	turnin	76
A	accept	239
A	accept	59
A	accept	109
A	target	Marshal Dughan
S	
T	sticky	
T	label	GoldshireVendor
A	goto	1429/0,94.01,-9464.8900
A	vendor	
A	target	Corina Steele
A	money	>0.75
S	
A	goto	1429/0,87.87,-9456.65
A	accept	1097
A	target	Smith Argus
S	Warlock/Warrior/Hunter
T	requires	GoldshireVendor
T	optional	
A	xp	10
S	Hunter
A	goto	1429/0,107.200,-9472.400
A	target	Josephine Carson::251507
A	accept	94792
A	trainer	
S	Hunter
T	loop	
A	goto	1429/0,28.100,-9768.101,40,0
A	goto	1429/0,-36.100,-9814.500,40,0
A	use	266158
A	complete	94792,1
A	mob	Rockhide Boar
S	Hunter
A	goto	1429/0,107.200,-9472.400
A	target	Josephine Carson::251507
A	turnin	94792
A	accept	94863
S	Hunter
T	loop	
A	goto	1429/0,-556.600,-9524.300,40,0
A	goto	1429/0,-626.200,-9430.800,40,0
A	use	266253
A	complete	94863,1
A	mob	Gray Forest Wolf
S	Hunter
A	goto	1429/0,107.200,-9472.400
A	target	Josephine Carson::251507
A	turnin	94863
A	accept	94864
S	Hunter
T	loop	
A	goto	1429/0,-14.600,-9797.800,40,0
A	goto	1429/0,-146.800,-9784.500,40,0
A	goto	1429/0,-325.300,-9844.300,40,0
A	use	266254
A	complete	94864,1
A	mob	Young Forest Bear
S	Hunter
A	goto	1429/0,107.200,-9472.400
A	target	Josephine Carson::251507
A	turnin	94864
A	accept	94793
S	Hunter
A	goto	1429/0,85.000,-9475.800
A	target	Isaac Chan::258930
A	turnin	94793
A	trainer	
S	Warrior
A	goto	1429/0,109.36,-9461.84
A	accept	1638
A	trainer	
A	target	Lyria Du Lac
A	money	<0.5
S	Warrior
T	optional	
A	goto	1429/0,109.36,-9461.84
A	accept	1638
A	target	Lyria Du Lac
S	Paladin
T	optional	
T	requires	GoldshireVendor
A	goto	1429/0,109.04,-9468.16
A	trainer	
A	target	Brother Wilhelm
A	xp	<10,1
A	xp	>12,1
S	Paladin
T	optional	
T	requires	GoldshireVendor
A	goto	1429/0,109.04,-9468.16
A	accept	2998
A	trainer	
A	target	Brother Wilhelm
A	xp	<12,1
S	Warlock
T	optional	
T	completewith	next
A	goto	1429/0,4.78,-9467.21,10
S	Warlock
A	trainer	
A	goto	1429/0,-5.36,-9472.760
A	target	+Maximillian Crowe
A	accept	1685
A	goto	1429/0,-8.58,-9473.41
A	target	+Remen Marcot
S	Mage/Priest
T	optional	
T	requires	GoldshireVendor
T	completewith	next
A	goto	1429/0,18.66,-9476.47,10
A	xp	<10,1
S	Priest
T	optional	
T	requires	GoldshireVendor
A	goto	1429/0,33.14,-9460.75
A	accept	5635
A	trainer	
A	target	Priestess Josetta
A	xp	<10,1
S	Mage
T	optional	
T	requires	GoldshireVendor
A	goto	1429/0,34.28,-9471.61
A	trainer	
A	target	Zaldimar Wefhellt
A	xp	<10,1
S	skip --Rogue
T	optional	
T	requires	GoldshireVendor
A	goto	1429/0,12.69,-9465.75
A	train	674
A	train	2983
A	target	Keryn Sylvius
S	!Warlock
T	completewith	PrincessFinish
T	optional	
A	abandon	59
S	
A	goto	Elwynn Forest,42.140,67.254
A	turnin	99129
A	target	Remy "Two Times"
S	skip
A	complete	99130,1
A	complete	99130,2
A	mob	+Stonetusk Boar
S	skip
A	goto	Elwynn Forest,42.140,67.254
A	turnin	99130
A	accept	99131
A	target	Remy "Two Times"
A	goto	1429,47.5,62.2
A	turnin	99131
A	target	Jason Mathers
S	
T	optional	
T	label	BoarMeatCooking3
T	completewith	Garrison
A	goto	1429/0,406.84,-9917.23,0
A	goto	1429/0,456.65,-9825.69,0
A	goto	1429/0,279.60,-9971.76,0
A	goto	1429/0,86.93,-9952.95,0
A	goto	1429/0,225.49,-9751.09,0
A	goto	1429/0,92.38,-9548.20,0
A	collect	769,10,2178,1,0x20,cooking
A	mob	Stonetusk Boar
A	skill	cooking,10,1
S	
T	optional	
T	requires	BoarMeatCooking3
T	completewith	Garrison
A	goto	1429/0,406.84,-9917.23,0
A	goto	1429/0,456.65,-9825.69,0
A	goto	1429/0,279.60,-9971.76,0
A	goto	1429/0,86.93,-9952.95,0
A	goto	1429/0,225.49,-9751.09,0
A	goto	1429/0,92.38,-9548.20,0
A	collect	769,50,2178,1,0x20,cooking
A	mob	Stonetusk Boar
A	skill	cooking,50,1
S	
T	optional	
T	requires	GoldshireVendor
T	completewith	next
A	goto	1429/0,37.61,-10014.03,50
S	
T	label	Escape
T	requires	GoldshireVendor
A	goto	1429/0,37.61,-10014.03
A	turnin	114
A	target	Maybell Maclure
S	
T	label	PrincessFinish
A	goto	Elwynn Forest,34.660,84.482
A	turnin	88,1
A	turnin	88,2
A	turnin	88,3
A	target	Ma Stonefield
S	!Warrior !Warlock
T	optional	
T	completewith	Garrison
A	xp	9+4510
A	itemcount	1971,1
S	!Warrior !Warlock
T	optional	
T	completewith	Garrison
A	xp	9+5110
A	itemcount	1971,<1
S	
T	optional	
T	completewith	Garrison
A	goto	1429/0,673.96,-9704.45,80
S	
T	label	Garrison
T	season	0,1 << Warrior/Paladin
A	turnin	239
A	accept	11
A	goto	1429/0,694.29,-9662.790
A	target	+Deputy Rainer
A	accept	176
A	goto	1429/0,683.40,-9667.93 << Warlock
S	Warlock
T	completewith	GnollEnd
A	use	1307
A	collect	1307,1,123
A	accept	123
A	unitscan	Gruff Swiftbite
S	Warlock
T	completewith	next
A	complete	11,1
A	mob	Riverpaw Runt
A	mob	Riverpaw Outrunner
S	Warlock
A	goto	1429/0,598.29,-9946.33,70,0
A	goto	1429/0,629.53,-10020.39,70,0
A	goto	1429/0,660.77,-10085.20,70,0
A	goto	1429/0,598.29,-10112.98,70,0
A	goto	1429/0,598.29,-9946.33,70,0
A	goto	1429/0,629.53,-10020.39,70,0
A	goto	1429/0,660.77,-10085.20,70,0
A	goto	1429/0,598.29,-10112.98,70,0
A	goto	1429/0,598.29,-9946.33,70,0
A	goto	1429/0,629.53,-10020.39,70,0
A	goto	1429/0,660.77,-10085.20,70,0
A	goto	1429/0,598.29,-10112.98,70,0
A	goto	1429/0,636.47,-10112.98
A	complete	176,1
A	unitscan	Hogger
S	Warlock
T	label	GnollEnd
A	goto	1429/0,598.29,-9946.33,70,0
A	goto	1429/0,629.53,-10020.39,70,0
A	goto	1429/0,660.77,-10085.20,70,0
A	goto	1429/0,598.29,-10112.98,70,0
A	goto	1429/0,598.29,-9946.33,70,0
A	goto	1429/0,629.53,-10020.39,70,0
A	goto	1429/0,660.77,-10085.20,70,0
A	goto	1429/0,598.29,-10112.98,70,0
A	goto	1429/0,598.29,-9946.33,70,0
A	goto	1429/0,629.53,-10020.39,70,0
A	goto	1429/0,660.77,-10085.20,70,0
A	goto	1429/0,598.29,-10112.98,70,0
A	goto	1429/0,636.47,-10112.98
A	complete	11,1
A	mob	Riverpaw Runt
A	mob	Riverpaw Outrunner
A	isOnQuest	11
S	Warlock
A	goto	1429/0,694.29,-9662.790
A	turnin	11
A	target	Deputy Rainer
S	!Warrior !Warlock
T	xprate	<1.5
T	optional	
T	completewith	WestEntry
A	xp	9+4575
A	itemcount	1971,1
S	!Warrior !Warlock
T	xprate	<1.5
T	optional	
T	completewith	WestEntry
A	xp	9+5175
A	itemcount	1971,<1
S	!Warlock
T	optional	
T	completewith	WestEntry
A	abandon	123
S	Hunter
T	completewith	FlySW
A	train	14916
A	link	https://www.wow-petopia.com/classic/training.php
S	
T	completewith	WestEntry
A	goto	1436/0,918.42,-9851.50
A	zone	Westfall
S	
T	optional	
A	accept	64
A	turnin	184
A	goto	1436/0,918.42,-9851.50
A	target	+Farmer Furlbrow
A	accept	151
A	accept	36
A	goto	1436/0,919.47,-9853.13
A	target	+Verna Furlbrow
A	isOnQuest	184
S	
T	label	WestEntry
A	accept	64
A	goto	1436/0,918.42,-9851.50
A	target	+Farmer Furlbrow
A	accept	151
A	accept	36
A	goto	1436/0,919.47,-9853.13
A	target	+Verna Furlbrow
S	
T	optional	
T	completewith	next
A	isOnQuest	151
S	
T	sticky	
T	label	Fields
A	goto	1436/0,1055.27,-10128.70
A	accept	9
A	target	Farmer Saldean
S	
A	goto	1436/0,1042.11,-10112.11
A	turnin	36
A	accept	38
A	accept	22
A	target	Salma Saldean
S	
T	requires	Fields
A	goto	1436/0,1045.22,-10508.800
A	xp	9+5775
A	subzoneskip	108
S	
T	xprate	>1.49 << !Paladin
T	xprate	1.49-1.59 << Paladin
T	optional	
T	requires	Fields
A	goto	1436/0,1045.22,-10508.800
A	xp	9+5410
A	subzoneskip	108
S	Paladin
T	xprate	>1.59
T	optional	
A	goto	1436,48.249,46.729
A	xp	11+5360
S	skip
T	softcore	
T	completewith	next
A	deathskip	
A	target	Spirit Healer
S	
A	turnin	109
A	accept	12
A	goto	1436/0,1045.22,-10508.800
A	target	+Gryan Stoutmantle
A	accept	102
A	goto	1436/0,1041.93,-10511.20
A	target	+Captain Danuvin
S	Human
T	optional	
A	goto	1436/0,1055.27,-10128.70
A	xp	10
S	
A	goto	1436/0,1021.60,-10500.61
A	accept	6181
A	target	Quartermaster Lewis
A	isQuestAvailable	6181 << Human
S	Human
A	goto	1436/0,1037.42,-10628.27
A	turnin	6181
A	accept	6281
A	target	Thor
S	
T	label	FlySW
A	goto	1436/0,1037.42,-10628.27
A	fly	Stormwind
A	target	Thor
S	
T	season	0,1 << Paladin
A	goto	1453/0,625.48,-8857.76
A	turnin	61,1
A	link	https://www.youtube.com/watch?v=H-IwZ6P-ldY
A	target	Morgan Pestle
S	Rogue
A	goto	1453/0,596.43,-8831.70
A	collect	3107,1
A	target	Thurman Mullby
A	xp	<10+5890,1
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.3
S	Rogue
A	goto	1453/0,596.43,-8831.70
A	collect	2946,1
A	target	Thurman Mullby
A	xp	>10+5890,1
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.0
S	Rogue
T	optional	
T	completewith	Continue
A	use	3107
A	itemcount	3107,1
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.3
A	xp	<11,1
S	Rogue
T	optional	
T	completewith	Continue
A	use	2946
A	itemcount	2946,1
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.0
S	
T	optional	<< Warlock/Mage/Warrior
A	goto	1453/0,613.0,-8796.03
A	trainer	
A	trainer	
A	trainer	
A	trainer	
A	target	Woo Ping
A	money	<0.2 << Warlock/Mage
A	money	<0.3 << Warrior
S	Warlock/Mage
A	goto	1453/0,613.0,-8796.03
A	trainer	
A	target	Woo Ping
S	Rogue
T	ssf	
T	optional	
A	goto	1453/0,607.38,-8790.45
A	collect	851,1
A	target	Gunther Weller
A	money	<0.2623
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
A	train	2983,1
S	Rogue
T	ssf	
T	optional	
A	goto	1453/0,607.38,-8790.45
A	collect	851,1
A	target	Gunther Weller
A	money	<0.2023
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
A	train	2983,3
S	Rogue
T	optional	
T	ah	
A	goto	1453/0,607.38,-8790.45
A	collect	851,1
A	target	Gunther Weller
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
A	train	2983,1
A	money	<0.06
S	Rogue
T	optional	
T	ah	
A	goto	1453/0,607.38,-8790.45
A	collect	851,1
A	target	Gunther Weller
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
A	train	2983,3
S	Rogue
T	optional	
T	completewith	Continue
A	use	851
A	itemcount	851,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
S	
A	goto	1453/0,673.58,-8867.76
A	home	
A	target	Innkeeper Allison
S	Warlock
T	optional	
T	completewith	GakinStart
A	goto	1453/0,988.44,-8942.15,20,0
A	goto	1453/0,1015.33,-8978.9,15
S	Warlock
T	xprate	>1.59
A	goto	1453/0,1029.98,-8971.01
A	train	705
A	target	Ursula Deline
A	xp	<12,1
A	xp	>14,1
S	Warlock
T	xprate	>1.59
T	optional	
A	goto	1453/0,1029.98,-8971.01
A	train	689
A	target	Ursula Deline
A	xp	<14,1
S	Warlock
T	label	GakinStart
A	goto	1453/0,1041.54,-8983.29
A	turnin	1685
A	accept	1688
A	target	Gakin the Darkbinder
S	Warlock skip
T	softcore	
A	deathskip	
A	target	Spirit Healer
S	Warlock
T	hardcore	
T	completewith	WLHoggerEnd
A	goto	1429/0,74.02,-9465.52
A	zone	Elwynn Forest
S	Warlock
T	completewith	WLHoggerEnd
A	goto	1429/0,74.02,-9465.52
A	subzone	87
S	Warlock
A	goto	1429/0,74.02,-9465.52
A	turnin	176
A	turnin	123
A	target	Marshal Dughan
A	isOnQuest	123
S	Warlock
T	label	WLHoggerEnd
A	goto	1429/0,74.02,-9465.52
A	turnin	176
A	target	Marshal Dughan
S	Warlock
T	optional	
T	completewith	WLBandanaEnd
A	use	6215
A	itemcount	6215,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.9
S	Warlock
T	optional	
T	label	BoarMeatCooking4
T	completewith	SChoker
A	goto	1429,49.917,72.959,0
A	goto	1429,54.444,75.879,0
A	goto	1429,57.620,76.213,0
A	goto	1429,61.911,78.274,0
A	goto	1429,65.619,78.388,0
A	collect	769,10,2178,1,0x20,cooking
A	mob	Rockhide Boar
A	skill	cooking,10,1
A	subzoneskip	62
S	Warlock
T	optional	
T	requires	BoarMeatCooking4
T	completewith	SChoker
A	goto	1429,49.917,72.959,0
A	goto	1429,54.444,75.879,0
A	goto	1429,57.620,76.213,0
A	goto	1429,61.911,78.274,0
A	goto	1429,65.619,78.388,0
A	collect	769,50,2178,1,0x20,cooking
A	mob	Rockhide Boar
A	skill	cooking,50,1
A	subzoneskip	62
S	Warlock
T	optional	
T	completewith	SChoker
A	subzone	62
A	isOnQuest	1688
S	Warlock
T	optional	
T	completewith	SChoker
A	use	1972
A	collect	1972,1,184
A	accept	184
S	Warlock
T	sticky	
T	label	WLBandanaEnd
T	loop	
A	goto	1429/0,-911.52,-9735.70,0
A	goto	1429/0,-921.93,-9812.08,0
A	waypoint	1429/0,-911.52,-9735.70,60,0
A	waypoint	1429/0,-828.22,-9733.39,60,0
A	waypoint	1429/0,-831.69,-9823.65,60,0
A	waypoint	1429/0,-921.93,-9812.08,60,0
A	complete	83,1
A	mob	Defias Bandit
A	isOnQuest	83
S	Warlock
T	label	SChoker
A	goto	1429/0,-932.35,-9806.53
A	complete	1688,1
A	mob	Surena Caledon
S	Warlock
T	optional	
T	label	WolfMeatCooking9
T	completewith	WlockRedridge
A	goto	1429,84.448,72.486,0
A	goto	1429,88.611,71.379,0
A	goto	1429,89.657,75.373,0
A	goto	1429,87.250,75.853,0
A	collect	2672,10,2178,1,0x20,cooking
A	mob	Prowler
A	skill	cooking,10,1
S	Warlock
T	optional	
T	requires	WolfMeatCooking8
T	completewith	WlockRedridge
A	goto	1429,84.448,72.486,0
A	goto	1429,88.611,71.379,0
A	goto	1429,89.657,75.373,0
A	goto	1429,87.250,75.853,0
A	collect	2672,50,2178,1,0x20,cooking
A	mob	Prowler
A	skill	cooking,<10,1
A	skill	cooking,50,1
S	Warlock
T	requires	WLBandanaEnd
A	goto	1429/0,-1222.40,-9531.76
A	turnin	59
A	turnin	83
A	target	Sara Timberlain
A	isOnQuest	83
S	Warlock
T	optional	
T	requires	WLBandanaEnd
A	goto	1429/0,-1222.40,-9531.76
A	turnin	59
A	target	Sara Timberlain
S	Warlock
T	optional	
T	completewith	Gnolls
T	label	SoulShards
A	collect	6265,2
S	Warlock
T	optional	
T	label	WlockRedridge
T	completewith	next
A	goto	1433/0,-1948.56,-9582.75
A	zone	Redridge Mountains
S	Warlock
T	label	Gnolls
T	requires	SoulShards
A	goto	1433/0,-1948.56,-9582.75
A	accept	244
A	target	Guard Parker
S	Warlock
A	goto	1433/0,-1974.20,-9577.07,15,0
A	goto	1433/0,-2077.18,-9608.42,25,0
A	goto	1433/0,-2212.64,-9558.570,25,0
A	goto	1433/0,-2238.00,-9443.69,25
A	target	Deputy Feldon
S	Warlock
A	goto	1433/0,-2238.00,-9443.69
A	turnin	244
S	Warlock
A	goto	1433/0,-2234.900,-9435.300
A	fp	Redridge Mountains
A	fly	Stormwind
A	target	Ariena Stormfeather
S	Warlock
T	completewith	TheBinding
A	goto	1453/0,988.44,-8942.15,20,0
A	goto	1453/0,1015.33,-8978.9,15
S	Warlock
T	optional	
A	goto	1453/0,1029.89,-8971.06
A	trainer	
A	target	Ursula Deline
A	xp	<12,1
S	Warlock
T	label	TheBinding
A	goto	1453/0,1041.54,-8983.29
A	turnin	1688
A	accept	1689
A	target	Gakin the Darkbinder
S	Warlock
T	completewith	next
A	goto	1453/0,1042.22,-9002.21,18,0
A	goto	1453/0,1069.1,-8991.45,18,0
A	goto	1453/0,1027.43,-8991.45,18,0
A	goto	1453/0,1042.83,-8972.68
A	cast	7728
A	use	6928
S	Warlock
A	goto	1453/0,1042.83,-8972.68
A	use	6928
A	complete	1689,1
A	mob	Summoned Voidwalker
S	Warlock
A	target	Gakin the Darkbinder
A	goto	1453/0,1041.54,-8983.29
A	turnin	1689
S	Rogue
T	xprate	<1.59
A	goto	1453/0,377.47,-8752.39
A	train	674
A	train	2983
A	target	Osborne the Night Man
S	Rogue
T	xprate	>1.59
A	goto	1453/0,377.47,-8752.39
A	train	674
A	train	2983
A	target	Osborne the Night Man
A	xp	<10,1
A	xp	>12,1
S	Rogue
T	xprate	>1.59
A	goto	1453/0,377.47,-8752.39
A	train	1766
A	target	Osborne the Night Man
A	xp	<12,1
A	xp	>14,1
S	Rogue
T	xprate	>1.59
T	optional	
A	goto	1453/0,377.47,-8752.39
A	trainer	
A	target	Osborne the Night Man
A	xp	<14,1
S	Rogue
T	optional	
T	label	StilettoDW
T	completewith	Continue
A	use	2494
A	itemcount	2494,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,>6.7
A	itemStat	17,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Rogue
T	optional	
T	requires	StilettoDW
T	completewith	Continue
A	itemStat	17,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.4
S	Human
T	label	Continue
A	goto	1453/0,382.02,-8702.290
A	turnin	6281
A	accept	6261
A	target	Osric Strang
S	Warrior
A	goto	1453/0,382.86,-8612.69
A	turnin	1638
A	accept	1639
A	target	Harry Burlguard
S	Warrior
A	goto	1453/0,389.07,-8604.43
A	turnin	1639
A	accept	1640
A	target	Bartleby
S	Warrior
A	goto	1453/0,389.07,-8604.43
A	complete	1640,1
A	mob	Bartleby
S	Warrior
A	target	Bartleby
A	goto	1453/0,389.07,-8604.43
A	turnin	1640
A	accept	1665
S	Warrior
A	goto	1453/0,382.86,-8612.69
A	turnin	1665
A	target	Harry Burlguard
S	Priest
T	optional	
T	completewith	Prayer
A	goto	1453/0,809.52,-8579.22,20
S	Priest
T	optional	
A	goto	1453/0,862.89,-8519.61
A	turnin	5635
A	train	8092
A	target	High Priestess Laurena
A	isOnQuest	5635
S	Priest
A	goto	1453/0,862.89,-8519.61
A	turnin	5634
A	train	8092
A	target	High Priestess Laurena
A	train	13908,1
S	Priest
T	optional	
T	label	Prayer
A	goto	1453/0,862.89,-8519.61
A	trainer	
A	target	High Priestess Laurena
A	train	13908,3
S	
A	goto	1453/0,685.22,-8387.23
A	turnin	1097
A	accept	353
A	target	Grimand Elmore
S	Warrior
T	season	0,1
T	optional	
T	completewith	DeeprunEnter
S	Warrior/Paladin/Rogue
T	optional	
A	goto	1453/0,624.15,-8431.23
A	collect	2901,1,432,1
A	target	Kaita Deepforge
A	train	2018,3
S	
T	label	DeeprunEnter
A	goto	1453/0,562.300,-8385.300,20,0
A	goto	1453/0,522.000,-8352.101
A	subzone	2257
A	zoneskip	Ironforge
S	
T	optional	
T	label	TramCook1
T	completewith	TramEnd
A	cast	818
A	usespell	818
A	zoneskip	Ironforge
A	itemcount	769,1
A	itemcount	2672,1
A	itemcount	4470,1
A	itemcount	4471,1
A	skill	cooking,50,1
S	
T	optional	
T	requires	TramCook1
T	label	TramCook2
T	completewith	TramEnd
A	cast	818
A	usespell	818
A	zoneskip	Ironforge
A	itemcount	769,<1
A	itemcount	2672,1
A	itemcount	4470,1
A	itemcount	4471,1
A	skill	cooking,50,1
S	
T	optional	
T	requires	TramCook2
T	label	TramCook3
T	completewith	TramEnd
A	cast	818
A	usespell	818
A	zoneskip	Ironforge
A	itemcount	769,1
A	itemcount	2672,<1
A	itemcount	4470,1
A	itemcount	4471,1
A	skill	cooking,50,1
S	
T	optional	
T	requires	TramCook3
T	label	TramCook4
T	completewith	TramEnd
A	usespell	2550
A	zoneskip	Ironforge
A	itemcount	769,1
A	itemcount	2672,1
A	itemcount	4471,1
A	skill	cooking,50,1
S	
T	optional	
T	requires	TramCook4
T	label	TramCook5
T	completewith	TramEnd
A	usespell	2550
A	zoneskip	Ironforge
A	itemcount	769,<1
A	itemcount	2672,1
A	itemcount	4471,1
A	skill	cooking,50,1
S	
T	optional	
T	requires	TramCook5
T	label	TramCook6
T	completewith	TramEnd
A	usespell	2550
A	zoneskip	Ironforge
A	itemcount	769,1
A	itemcount	2672,<1
A	itemcount	4471,1
A	skill	cooking,50,1
S	
T	optional	
T	label	TramEnd
A	accept	6661
A	target	Monty
S	
T	xprate	<1.59
A	complete	6661,1
A	use	17117
A	mob	Deeprun Rat
S	
T	xprate	<1.59
A	turnin	6661
A	target	Monty
S	
A	zone	Ironforge
A	isQuestAvailable	314
S	Warrior
T	optional	
T	completewith	WarriorTrain
A	goto	1455,67.400,84.909,15,0
A	goto	1455/0,-1234.65,-5035.67,12
S	Warrior
A	goto	1455/0,-1234.65,-5035.67
A	train	2687
A	target	Bilban Tosslespanner
A	xp	<10,1
A	xp	>12,1
S	Warrior
T	xprate	>1.59
T	optional	
A	goto	1455/0,-1234.65,-5035.67
A	train	5242
A	target	Bilban Tosslespanner
A	xp	<12,1
S	Warrior
T	optional	
T	completewith	next
A	goto	1455,61.552,85.636,10,0
A	goto	1455,61.356,88.398,6
S	Warrior
A	train	2567
A	goto	1455/0,-1205.65,-5042.12
A	target	+Bixi Wobblebonk
A	train	199
A	goto	1455/0,-1197.27,-5041.49
A	target	+Buliwyf Stonehand
S	Warrior
A	goto	1455/0,-1206.74,-5037.12
A	collect	3107,1
A	target	Brenwyn Wintersteel
A	xp	<10+7405,1
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.3
S	Warrior
T	xprate	<1.5
A	goto	1455/0,-1206.74,-5037.12
A	collect	2946,1
A	target	Brenwyn Wintersteel
A	xp	>10+7405,1
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.0
S	Warrior
T	optional	
T	completewith	Rudra
A	use	3107
A	itemcount	3107,1
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.3
A	xp	<11,1
S	Warrior
T	optional	
T	completewith	Rudra
A	use	2946
A	itemcount	2946,1
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.0
S	Warrior
T	optional	
T	completewith	next
A	goto	1455,61.356,88.398,6
S	
A	goto	1455/0,-1152.40,-4821.13
A	fp	Ironforge
A	target	Gryth Thurden
S	Mage/Paladin
T	optional	
T	completewith	next
A	goto	1455/0,-1101.87,-4864.81,30,0
A	goto	1455/0,-1062.10,-4815.100,20,0
A	goto	1455/0,-1036.48,-4804.50,20,0
A	goto	1455/0,-992.68,-4742.08,20,0
A	goto	1455/0,-928.40,-4635.61,20,0 << Paladin
A	goto	1455/0,-931.8,-4627.59,20,0 << Mage
A	goto	1455/0,-928.40,-4614.51,12
A	goto	1455/0,-896.47,-4601.65,12
S	Mage
A	goto	1455/0,-928.40,-4614.51
A	train	122
A	target	Dink
S	Paladin
A	goto	1455/0,-896.47,-4601.65
A	train	633
A	target	Brandur Ironhammer
S	skip -- for dungeon route only
A	goto	1455/0,-856.69,-4841.490
A	home	
A	target	Innkeeper Firebrew
A	bindlocation	1537
S	
T	ah	
A	goto	Ironforge,25.800,75.500,-1
A	goto	Ironforge,24.200,74.600,-1
A	goto	Ironforge,23.800,71.800,-1
A	collect	3172,3,418,1
A	collect	3173,3,418,1
A	collect	3174,3,418,1
A	collect	769,50,2178,1,0x20,cooking
A	disablecheckbox	
A	collect	2672,50,2178,1,0x20,cooking
A	disablecheckbox	
A	target	Auctioneer Lympkin
A	target	Auctioneer Redmuse
A	target	Auctioneer Buckler
A	zoneskip	Dun Morogh
A	isQuestAvailable	418
A	skill	cooking,50,1
S	
T	ah	
T	optional	
A	goto	Ironforge,25.800,75.500,-1
A	goto	Ironforge,24.200,74.600,-1
A	goto	Ironforge,23.800,71.800,-1
A	collect	3172,3,418,1
A	collect	3173,3,418,1
A	collect	3174,3,418,1
A	target	Auctioneer Lympkin
A	target	Auctioneer Redmuse
A	target	Auctioneer Buckler
A	zoneskip	Dun Morogh
A	isQuestAvailable	418
A	skill	cooking,<50,1
S	
A	goto	1426,53.47,35.02
A	zone	Dun Morogh
S	
T	optional	
T	label	BoarMeatDunMorogh1
T	completewith	Dirt
A	goto	1426,57.936,50.787,0
A	collect	769,10,2178,1,0x20,cooking
A	mob	Elder Crag Boar
A	skill	cooking,10,1
S	
T	optional	
T	requires	BoarMeatDunMorogh1
T	completewith	Dirt
A	goto	1426,57.936,50.787,0
A	collect	769,50,2178,1,0x20,cooking
A	mob	Elder Crag Boar
A	skill	cooking,50,1
S	
T	optional	
T	label	Dirt
T	completewith	Rudra
A	goto	1426/0,-1145.04,-5504.30,40,0
A	goto	1426/0,-1219.90,-5422.55,40
A	isQuestAvailable	314
S	
T	completewith	next
T	requires	Dirt
A	goto	1426,62.778,54.591,0
A	goto	1426,62.538,46.195,0
A	link	https://youtu.be/Zg4FNWw-P5k?t=3815
A	link	https://www.youtube.com/watch?v=ZJX6sCkm5JY
A	mob	Vagash
S	Warrior/Rogue
T	optional	
T	requires	Dirt
T	completewith	VagashEnd
A	use	3107
A	itemcount	3107,1
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.3
A	xp	<11,1
S	
T	label	Rudra
A	goto	1426/0,-1304.71,-5513.86
A	accept	314
A	target	Rudra Amberstill
S	
T	label	VagashEnd
A	goto	1426,62.778,54.591,0
A	goto	1426,62.094,47.154,40,0
A	goto	1426,62.434,48.989,40,0
A	goto	1426,62.538,46.195
A	link	https://youtu.be/Zg4FNWw-P5k?t=3815
A	link	https://www.youtube.com/watch?v=ZJX6sCkm5JY
A	complete	314,1
A	mob	Vagash
S	
A	goto	1426/0,-1304.71,-5513.86
A	turnin	314
A	target	Rudra Amberstill
S	
T	optional	
T	label	BoarMeatDunMorogh2
T	completewith	QuarryStart
A	goto	1426,66.356,51.02,0
A	collect	769,10,2178,1,0x20,cooking
A	mob	Large Crag Boar
A	skill	cooking,10,1
A	subzoneskip	134
S	
T	optional	
T	requires	BoarMeatDunMorogh2
T	completewith	QuarryStart
A	goto	1426,66.356,51.02,0
A	collect	769,50,2178,1,0x20,cooking
A	mob	Large Crag Boar
A	skill	cooking,50,1
A	subzoneskip	134
S	
A	goto	1426/0,-1394.24,-5797.83
A	accept	96392
A	target	Earthseer Farsen
S	
A	complete	96392,1
A	skipgossip	
A	target	Earthseer Farsen
S	
A	goto	1426/0,-1394.24,-5797.83
A	turnin	96392
A	accept	96390
A	target	Earthseer Farsen
S	
A	goto	1426/0,-1565.58,-5666.24
A	train	2550
A	target	Cook Ghilm
S	!Human
A	goto	1426/0,-1577.16,-5671.20
A	vendor	
A	vendor	
A	target	Kazan Mogosh
A	xp	>15,1
S	Rogue
T	completewith	QuarryEnd
T	label	RogueWep
A	goto	1426,68.866,55.958,8,0
A	goto	1426,69.002,55.896
A	collect	2488,1
A	target	Frast Dokner
A	money	<0.0482
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.4
S	Rogue
T	optional	
T	completewith	QuarryEnd
T	requires	RogueWep
T	label	Gladius
A	equip	16,2488
A	use	2488
A	itemcount	2488,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.4
S	Rogue
T	optional	
T	completewith	QuarryEnd
T	requires	Gladius
A	equip	17,2494
A	use	2494
A	itemcount	2494,1
A	itemStat	17,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	
T	label	QuarryStart
A	accept	433
A	goto	1426/0,-1579.96,-5714.73
A	target	+Senator Mehr Stonehallow
A	accept	432
A	goto	1426/0,-1600.30,-5726.590
A	target	+Foreman Stonebrow
S	Warrior/Paladin/Rogue
A	goto	1426/0,-1612.12,-5697.89
T	requires	RogueWep << Rogue
A	train	2575
A	target	Dank Drizzlecut
A	train	2018,3
S	Warrior/Paladin/Rogue
T	optional	
T	completewith	QuarryEnd
A	cast	2580
A	usespell	2580
A	train	2575,3
S	
A	goto	1426/0,-1679.89,-5728.88,40,0
A	goto	1426/0,-1675.95,-5597.22,25,0
A	goto	1426/0,-1679.89,-5728.88
A	complete	432,1
A	mob	+Rockjaw Skullthumper
A	complete	433,1
A	mob	+Rockjaw Bonesnapper
S	
T	label	QuarryEnd
A	turnin	432
A	goto	1426/0,-1600.30,-5726.590
A	target	+Foreman Stonebrow
A	turnin	433
A	goto	1426/0,-1579.96,-5714.73
A	target	+Senator Mehr Stonehallow
S	!Warrior !Rogue !Paladin
A	goto	1426/0,-1577.16,-5671.20
A	vendor	
A	target	Kazan Mogosh
A	xp	>15,1
S	
T	loop	
A	goto	1426/0,-1881.82,-5735.45,50,0
A	goto	1426/0,-1832.57,-5571.28,50,0
A	goto	1426/0,-1724.22,-5636.95,50,0
A	goto	1426/0,-1881.82,-5735.45,0
A	goto	1426/0,-1832.57,-5571.28,0
A	goto	1426/0,-1724.22,-5636.95,0
A	use	268548
A	collect	268548,1,95213,1
A	accept	95213
A	mob	Rockjaw Ambusher
S	
A	goto	1426/0,-1606.02,-5676.35
A	turnin	95213
A	accept	95214
A	target	Quarrymaster Thesten
S	
T	completewith	next
A	complete	95214,1
A	mob	Rockjaw Ambusher
S	
A	goto	1426/0,-2009.87,-5860.22,40,0
A	goto	1426/0,-2034.49,-5922.60
A	use	274268
A	complete	96390,1
A	collect	274268,1,96391,1
A	accept	96391
A	mob	Dark Iron Spy
S	
T	loop	
A	goto	1426/0,-1881.82,-5735.45,50,0
A	goto	1426/0,-1832.57,-5571.28,50,0
A	goto	1426/0,-1724.22,-5636.95,50,0
A	goto	1426/0,-1881.82,-5735.45,0
A	goto	1426/0,-1832.57,-5571.28,0
A	goto	1426/0,-1724.22,-5636.95,0
A	complete	95214,1
A	mob	Rockjaw Ambusher
S	
A	goto	1426/0,-1606.02,-5676.35
A	turnin	95214
A	target	Quarrymaster Thesten
S	
A	goto	1426/0,-1394.24,-5797.83
A	turnin	96390
A	turnin	96391
A	accept	96393
A	target	Earthseer Farsen
S	
A	goto	1426/0,-2197.02,-5279.07,45,0
A	goto	1426/0,-2329.60,-5163.76
A	accept	419
A	target	Pilot Hammerfoot
S	
A	goto	1426/0,-2121.76,-5064.70
A	turnin	419
A	accept	417
S	
A	goto	1426/0,-2087.19,-5096.51
A	complete	417,1
A	mob	Mangeclaw
S	
T	label	Revenge
A	goto	1426/0,-2329.60,-5163.76
A	turnin	417,1
A	turnin	417
A	target	Pilot Hammerfoot
S	Rogue
T	optional	
T	completewith	next
A	use	2218
A	itemcount	2218,1
A	itemStat	17,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
S	
T	label	enterloch
A	goto	1426/0,-2354.62,-4898.20,25
A	zoneskip	Loch Modan
E
G	Guides/forever/Alliance-1-13_Human.lua
M	classic	
M	tbc	
M	season	0,1
M	version	1
M	selector	Alliance
M	group	RestedXP Forever Guide (A)
M	subgroup	Speedrun Guide 1-20
M	name	11-13 Loch Modan
M	displayname	13-15 Loch Modan << SoD
M	next	13-15 Westfall; 14-16 Darkshore
M	defaultfor	Human
S	
T	optional	
T	completewith	next
A	goto	1432/0,-2659.45,-4822.45
A	vendor	
A	target	Gothor Brumn
S	
A	goto	1432/0,-2676.82,-4825.93
A	turnin	353
A	accept	307
A	target	Mountaineer Stormpike
S	
T	optional	
T	label	BoarMeatLoch1
T	completewith	ThelsamarFirst
A	goto	1426,70.845,51.784,0
A	goto	1426,73.533,50.850,0
A	goto	1426,75.353,48.533,0
A	goto	1426,79.881,46.805,0
A	goto	1426,81.040,43.456,0
A	goto	1426,80.583,36.040,0
A	collect	769,10,2178,1,0x20,cooking
A	mob	Mountain Boar
A	skill	cooking,10,1
A	subzoneskip	144
S	
T	optional	
T	requires	BoarMeatLoch1
T	completewith	ThelsamarFirst
A	goto	1426,70.845,51.784,0
A	goto	1426,73.533,50.850,0
A	goto	1426,75.353,48.533,0
A	goto	1426,79.881,46.805,0
A	goto	1426,81.040,43.456,0
A	goto	1426,80.583,36.040,0
A	collect	769,50,2178,1,0x20,cooking
A	mob	Mountain Boar
A	skill	cooking,50,1
A	subzoneskip	144
S	
T	optional	
T	completewith	ThelsamarFirst
A	collect	3172,3,418,1
A	mob	+Mountain Boar
A	collect	3173,3,418,1
A	mob	+Elder Black Bear
A	collect	3174,3,418,1
A	mob	+Forest Lurker
A	subzoneskip	144
S	
T	optional	
T	completewith	next
T	label	Thelsamar
A	subzone	144
S	
T	requires	Thelsamar
T	completewith	next
T	optional	
A	accept	416
A	accept	1339
A	target	Mountaineer Kadrell
S	
A	goto	1432/0,-3003.30,-5376.02
A	accept	86667
A	target	Grenhild Darktalon
S	
T	label	ThelsamarFirst
A	goto	1432/0,-2954.42,-5394.10
A	accept	418
A	target	Vidra Hearthstove
S	
T	optional	
A	goto	1432/0,-2954.42,-5394.10
A	turnin	418
A	target	Vidra Hearthstove
A	isQuestComplete	418
S	
T	optional	
T	completewith	StormpikeO
A	abandon	1338
S	
T	completewith	next
A	goto	1432/0,-2952.46,-5381.87
A	vendor	1682
A	target	Yanni Stoutheart
S	
A	goto	1432/0,-2973.90,-5377.93
A	vendor	6734
A	target	Innkeeper Hearthstove
A	xp	>15,1
S	
T	label	StormpikeO
A	line	Loch Modan,36.72,41.97,37.24,43.19,37.33,45.63,36.77,46.20,35.19,46.88,32.67,49.71,35.19,46.88,36.77,46.20,37.33,45.63,37.24,43.19,36.72,41.97
A	goto	1432/0,-3006.61,-5259.57,15,0
A	goto	1432/0,-3020.95,-5282.02,15,0
A	goto	1432/0,-3023.44,-5326.90,15,0
A	goto	1432/0,-3007.99,-5337.390,15,0
A	goto	1432/0,-2964.41,-5349.90,15,0
A	goto	1432/0,-2894.90,-5401.96,20,0
A	goto	1432/0,-3007.99,-5337.390
A	accept	416
A	accept	1339
A	target	Mountaineer Kadrell
S	
A	goto	1432/0,-2929.87,-5424.84
A	fp	Thelsamar
A	target	Thorgrum Borrelson
S	
T	optional	
T	completewith	next
A	goto	1432/0,-2677.26,-5778.34,10,0
A	goto	1432/0,-2648.30,-5876.75,15
S	
A	goto	1432/0,-2634.59,-5842.81
A	accept	267
A	target	Captain Rugelfuss
S	
T	label	DefenseStart
A	goto	1432/0,-2602.54,-5832.73
A	accept	224
A	target	Mountaineer Cobbleflint
S	
T	completewith	next
A	goto	1432/0,-2534.38,-5648.28,5
S	
A	goto	1432/0,-2534.38,-5648.28
A	use	279380
A	complete	86667,1
S	
T	optional	
T	label	BoarMeatLoch2
T	completewith	SilverStream
A	goto	1426,70.845,51.784,0
A	goto	1426,73.533,50.850,0
A	goto	1426,75.353,48.533,0
A	goto	1426,79.881,46.805,0
A	goto	1426,81.040,43.456,0
A	goto	1426,80.583,36.040,0
A	collect	769,10,2178,1,0x20,cooking
A	mob	Mountain Boar
A	skill	cooking,10,1
A	subzoneskip	146
A	subzoneskip	149
S	
T	optional	
T	requires	BoarMeatLoch2
T	completewith	SilverStream
A	goto	1426,70.845,51.784,0
A	goto	1426,73.533,50.850,0
A	goto	1426,75.353,48.533,0
A	goto	1426,79.881,46.805,0
A	goto	1426,81.040,43.456,0
A	goto	1426,80.583,36.040,0
A	collect	769,50,2178,1,0x20,cooking
A	mob	Mountain Boar
A	skill	cooking,50,1
A	subzoneskip	146
A	subzoneskip	149
S	
T	optional	
T	completewith	SilverStream
A	collect	3172,3,418,1
A	mob	+Mountain Boar
A	collect	3173,3,418,1
A	mob	+Elder Black Bear
A	collect	3174,3,418,1
A	mob	+Forest Lurker
A	subzoneskip	146
A	subzoneskip	149
S	
T	completewith	MinerGear
A	complete	416,1
A	mob	Tunnel Rat Scout
A	mob	Tunnel Rat Vermin
A	mob	Tunnel Rat Forager
A	mob	Tunnel Rat Geomancer
A	mob	Tunnel Rat Digger
A	mob	Tunnel Rat Surveyor
S	
A	goto	1432/0,-3146.73,-4837.02
A	turnin	86667
A	target	Norric Lochthane
S	
T	optional	
T	label	SilverStream
T	completewith	MinerGear
A	goto	1432/0,-2972.96,-4835.187,20
S	
T	requires	SilverStream
T	label	MinerGear
A	goto	1432/0,-2984.82,-4902.33
A	complete	307,1
S	Paladin/Warrior
T	label	BuyMace
A	goto	1432/0,-3176.16,-4669.34
A	collect	4778,1,307,1
A	collect	4777,1,307,1
A	target	Nillen Andemar
A	itemcount	4778,<1
A	itemcount	4777,<1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.8
S	Paladin/Warrior
T	optional	
T	completewith	StormpikeDelivery
A	use	4778
A	itemcount	4778,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.5
A	xp	<14,1
S	Paladin/Warrior
T	optional	
T	completewith	StormpikeDelivery
A	use	4777
A	itemcount	4777,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.7
A	xp	<13,1
S	
A	goto	1432/0,-2684.71,-5042.87,0
A	goto	1432/0,-2712.57,-5286.61,0
A	goto	1432/0,-3033.92,-4797.29,0
A	goto	1432/0,-3033.92,-4797.29,50,0
A	goto	1432/0,-2972.41,-4796.92,50,0
A	goto	1432/0,-2684.71,-5042.87,50,0
A	goto	1432/0,-2712.57,-5286.61,50,0
A	goto	1432/0,-3033.92,-4797.29,50,0
A	goto	1432/0,-2972.41,-4796.92
A	complete	416,1
A	collect	2589,10,1644,1,1 << Human Paladin
A	mob	Tunnel Rat Scout
A	mob	Tunnel Rat Vermin
A	mob	Tunnel Rat Forager
A	mob	Tunnel Rat Geomancer
A	mob	Tunnel Rat Digger
A	mob	Tunnel Rat Surveyor
S	
T	optional	
T	completewith	StormpikeDelivery
A	collect	3172,3,418,1
A	mob	+Mountain Boar
A	collect	3173,3,418,1
A	mob	+Elder Black Bear
A	collect	3174,3,418,1
A	mob	+Forest Lurker
S	
T	completewith	StormpikeDelivery
T	label	StormpikeStop
A	goto	1432/0,-2659.45,-4822.45
A	vendor	
A	target	Gothor Brumn
S	Human
T	label	StormpikeDelivery
A	goto	1432/0,-2676.99,-4825.980
A	turnin	307
A	turnin	1339
A	accept	1338
A	target	Mountaineer Stormpike
A	dungeon	!DM
S	
T	optional	
T	label	BoarMeatLoch3
T	completewith	FlintTinder
A	goto	1426,70.845,51.784,0
A	goto	1426,73.533,50.850,0
A	goto	1426,75.353,48.533,0
A	goto	1426,79.881,46.805,0
A	goto	1426,81.040,43.456,0
A	goto	1426,80.583,36.040,0
A	collect	769,10,2178,1,0x20,cooking
A	mob	Mountain Boar
A	skill	cooking,10,1
A	subzoneskip	144
A	subzoneskip	925
S	
T	optional	
T	requires	BoarMeatLoch3
T	completewith	FlintTinder
A	goto	1426,70.845,51.784,0
A	goto	1426,73.533,50.850,0
A	goto	1426,75.353,48.533,0
A	goto	1426,79.881,46.805,0
A	goto	1426,81.040,43.456,0
A	goto	1426,80.583,36.040,0
A	collect	769,50,2178,1,0x20,cooking
A	mob	Mountain Boar
A	skill	cooking,<10,1
A	skill	cooking,50,1
A	subzoneskip	144
A	subzoneskip	925
S	
T	loop	
A	collect	3173,3,418,1
A	goto	1432/0,-2735.74,-4684.34,0
A	goto	1432/0,-2782.63,-4770.80,0
A	goto	1432/0,-3080.53,-5100.08,0
A	waypoint	1432/0,-2735.74,-4684.34,90,0
A	waypoint	1432/0,-2846.07,-4682.50,90,0
A	waypoint	1432/0,-2782.63,-4770.80,90,0
A	waypoint	1432/0,-2835.04,-4976.83,90,0
A	waypoint	1432/0,-2915.03,-5044.89,90,0
A	waypoint	1432/0,-3080.53,-5100.08,90,0
A	mob	+Elder Black Bear
A	collect	3172,3,418,1
A	goto	1432/0,-3041.92,-5129.51,0
A	goto	1432/0,-2815.73,-5147.91,0
A	goto	1432/0,-2782.63,-4903.25,0
A	waypoint	1432/0,-3041.92,-5129.51,90,0
A	waypoint	1432/0,-3017.09,-5219.65,90,0
A	waypoint	1432/0,-2815.73,-5147.91,90,0
A	waypoint	1432/0,-2757.81,-4952.91,90,0
A	waypoint	1432/0,-2782.63,-4903.25,90,0
A	mob	+Mountain Boar
A	collect	3174,3,418,1
A	goto	1432/0,-2873.66,-4789.19,0
A	goto	1432/0,-2926.07,-5232.53,0
A	goto	1432/0,-3069.5,-5078.01,0
A	waypoint	1432/0,-2873.66,-4789.19,90,0
A	waypoint	1432/0,-2766.08,-4866.45,90,0
A	waypoint	1432/0,-2926.07,-5232.53,90,0
A	waypoint	1432/0,-2992.27,-5055.93,90,0
A	waypoint	1432/0,-3069.5,-5078.01,90,0
A	mob	+Forest Lurker
S	
T	completewith	FlintTinder
A	subzone	144
S	
T	completewith	FlintTinder
A	target	Mountaineer Kadrell
A	turnin	416
A	isQuestComplete	416
S	
T	optional	
T	completewith	FlintTinder
A	goto	1432,35.273,47.750,10,0
A	goto	1432,35.433,48.243,12
S	
A	isQuestComplete	418
T	label	FlintTinder
A	goto	1432/0,-2954.42,-5394.10
A	turnin	418
A	target	Vidra Hearthstove
S	
A	line	Loch Modan,36.72,41.97,37.24,43.19,37.33,45.63,36.77,46.20,35.19,46.88,32.67,49.71,35.19,46.88,36.77,46.20,37.33,45.63,37.24,43.19,36.72,41.97
A	goto	1432/0,-3006.61,-5259.57,15,0
A	goto	1432/0,-3020.95,-5282.02,15,0
A	goto	1432/0,-3023.44,-5326.90,15,0
A	goto	1432/0,-3007.99,-5337.390,15,0
A	goto	1432/0,-2964.41,-5349.90,15,0
A	goto	1432/0,-2894.90,-5401.96,20,0
A	goto	1432/0,-3007.99,-5337.390
A	target	Mountaineer Kadrell
A	turnin	416
A	isQuestComplete	416
S	
A	goto	1432/0,-2747.60,-5530.540
A	complete	224,1
A	mob	+Stonesplinter Trogg
A	complete	224,2
A	mob	+Stonesplinter Scout
A	complete	267,1
A	mob	+Stonesplinter Trogg
A	mob	+Stonesplinter Scout
A	collect	2589,10,1644,1,1 << Human Paladin
A	mob	+Stonesplinter Trogg
A	mob	+Stonesplinter Scout
S	
T	optional	
T	completewith	next
A	goto	1432/0,-2677.26,-5778.34,10,0
A	goto	1432/0,-2648.30,-5876.75,15
S	
A	goto	1432/0,-2634.59,-5842.81
A	turnin	267
A	target	Captain Rugelfuss
A	isQuestComplete	267
S	
A	goto	1432/0,-2602.54,-5832.73
A	turnin	224
A	target	Mountaineer Cobbleflint
A	isQuestComplete	224
S	Warlock
T	optional	
T	completewith	next
A	goto	1432/0,-2747.60,-5530.540,0
A	money	>0.7579
S	Warlock
T	optional	
A	goto	1432/0,-2747.60,-5530.540
A	xp	14
S	!Warrior
T	optional	
A	goto	1432/0,-2747.60,-5530.540
A	cooldown	item,6948,<1
A	mob	Stonesplinter Trogg
A	mob	Stonesplinter Scout
S	Human Warrior -- flying IF to train thrown before going westfall/darkshore
T	completewith	next
A	goto	1432/0,-2929.87,-5424.84
A	fly	Ironforge
A	target	Thorgrum Borrelson
A	zoneskip	Ironforge
S	Human Warrior
A	goto	1455/0,-1203.78,-5041.97
A	train	2567
A	target	Bixi Wobblebonk
S	Human Warrior
S	skip -- dungeon route
A	hs	
A	bindlocation	1537,1
A	zoneskip	Ironforge
S	skip -- dungeon route
T	optional	
A	goto	1432/0,-2929.87,-5424.84
A	fly	Ironforge
A	target	Thorgrum Borrelson
A	zoneskip	Ironforge
S	skip
S	
A	hs	
A	zoneskip	Stormwind City
A	zoneskip	Darkshore
A	zoneskip	Westfall
S	
A	goto	1453/0,489.99,-8835.76
A	turnin	6261
A	target	Dungar Longdrink
A	xp	<15,1
S	Warlock/Priest
T	ssf	
A	goto	1453/0,807.64,-8880.84,14,0
A	goto	1453/0,804.55,-8862.47
A	collect	5208,1
A	target	Ardwyn Cailen
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<13.4
S	Warlock/Priest
T	ah	
A	goto	1453/0,807.64,-8880.84,14,0
A	goto	1453/0,804.55,-8862.47
A	collect	5208,1
A	target	Ardwyn Cailen
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<13.4
S	Warlock/Priest
T	optional	
T	completewith	next
A	use	5208
A	itemcount	5208,1
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<13.4
A	xp	<15,1
S	Warlock/Priest
T	optional	
T	completewith	next
A	use	5208
A	itemcount	5208,1
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<13.4
A	xp	>15,1
S	Warlock
T	optional	
T	completewith	next
A	goto	1453/0,988.44,-8942.15,20,0
A	goto	1453/0,1015.33,-8978.9,15
S	Warlock
A	goto	1453/0,1029.89,-8971.06
A	trainer	
A	target	Ursula Deline
S	Warlock
A	goto	1453/0,1035.96,-8974.86
A	vendor	
A	target	Spackle Thornberry
S	Mage
T	optional	
T	completewith	next
A	goto	1453/0,874.32,-9014.67,10
S	Mage
A	goto	1453/0,885.34,-9006.15
A	trainer	
A	target	Elsharin
S	Priest/Paladin
T	optional	
T	completewith	next
A	goto	1453/0,809.52,-8579.22,20
S	Human Paladin
A	goto	1453/0,845.95,-8545.70
A	accept	1641
A	turnin	1641
A	target	Duthorian Rall
S	Human Paladin
A	goto	1453/0,845.95,-8545.70
A	accept	1642
A	use	6775
S	Human Paladin
A	goto	1453/0,845.95,-8545.70
A	turnin	1642
A	accept	1643
A	target	Duthorian Rall
S	Paladin
A	goto	1453/0,859.13,-8559.14,10,0
A	goto	1453/0,861.14,-8573.03
A	trainer	
A	target	Arthur the Faithful
S	Priest
A	goto	1453/0,862.89,-8519.61
A	trainer	
A	target	Brother Joshua
S	
T	label	HumbleBeginnings
A	goto	1453/0,719.67,-8550.30
A	accept	399
A	target	Baros Alexston
A	xp	>15,1
S	
A	goto	1453/0,600.07,-8427.22
A	target	Furen Longbeard
A	turnin	1338
S	Rogue
A	goto	1453/0,377.47,-8752.39
A	trainer	
A	target	Osborne the Night Man
S	Warrior
A	goto	1453/0,358.25,-8728.28,15,0
A	goto	1453/0,302.6,-8685.53,15,0
A	goto	1453/0,323.3,-8689.29
A	trainer	
A	target	Wu Shen
A	target	Ilsa Corbin
S	Human Paladin
A	goto	1453/0,613.66,-8832.26
A	turnin	1643
A	target	Stephanie Turner
A	accept	1644
A	turnin	1644
S	Rogue
T	ah	
A	goto	1453/0,609.63,-8787.71
A	collect	2027,2
A	target	Marda Weller
A	money	<0.3815
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.7
S	Rogue
T	ssf	
A	goto	1453/0,609.63,-8787.71
A	collect	2027,2
A	money	<0.3815
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.7
A	target	Marda Weller
S	Rogue
T	optional	
T	completewith	next
A	use	2027
A	itemcount	2027,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.7
A	xp	<14,1
S	
T	ah	
A	goto	1453/0,660.28,-8814.55
A	collect	729,3,38,1
A	collect	730,3,38,1
A	collect	731,3,38,1
A	collect	732,3,38,1
A	collect	723,8,22,1
A	collect	5469,5,2178,1
A	collect	12238,6,1141,1
A	collect	769,50,2178,1,0x20,cooking
A	disablecheckbox	
A	collect	2672,50,2178,1,0x20,cooking
A	disablecheckbox	
A	target	Auctioneer Jaxon
A	skill	cooking,50,1
A	xp	>15,1
S	
T	ah	
T	optional	
A	goto	1453/0,660.28,-8814.55
A	collect	729,3,38,1
A	collect	730,3,38,1
A	collect	731,3,38,1
A	collect	732,3,38,1
A	collect	723,8,22,1
A	collect	5469,5,2178,1
A	collect	12238,6,1141,1
A	target	Auctioneer Jaxon
A	skill	cooking,<50,1
A	xp	>15,1
S	
A	goto	1453/0,489.99,-8835.76
A	turnin	6261
A	accept	6285
A	target	Dungar Longdrink
A	xp	>15,1
S	
A	goto	1453/0,490.03,-8835.82
A	fly	Westfall
A	target	Dungar Longdrink
A	xp	>15,1
E
G	Guides/forever/Alliance-1-14_DwarfGnome.lua
M	classic	
M	tbc	
M	season	0,1
M	version	1
M	selector	Alliance
M	group	RestedXP Forever Guide (A)
M	subgroup	Speedrun Guide 1-20
M	name	1-6 Coldridge Valley
M	displayname	1-6 Coldridge Valley << !SoD
M	displayname	1-7 Coldridge Valley << SoD
M	next	6-11 Dun Morogh << !Hunter
M	next	6-11 Dun Morogh (Hunter);6-11 Dun Morogh << Hunter
M	defaultfor	Dwarf/Gnome
S	!Gnome !Dwarf
T	completewith	next
S	Mage
T	completewith	next
S	!Gnome Mage
T	season	2
T	completewith	next
S	!Warlock
T	season	2 << Warrior
T	optional	
T	completewith	WolfMeat
A	destroy	6948
S	
A	goto	1426/0,328.18,-6214.85
A	accept	179
A	target	Sten Stoutarm
S	Warlock
T	sticky	
T	label	wlrune1
T	season	2
A	goto	1426/0,485.48,-6259.21
A	collect	205230,1
A	train	403919,1
S	Warlock
T	requires	wlrune1
T	sticky	
T	season	2
A	train	403919
A	use	205230
A	itemcount	205230,1
S	Warrior/Warlock
T	season	0,1
T	completewith	next
A	goto	1426,28.533,72.587,50,0
A	goto	1426,28.239,71.707,50,0
A	complete	179,1
A	disablecheckbox	
A	mob	Ragged Young Wolf
A	money	>0.001
S	Warrior/Warlock
T	season	0,1
T	optional	
T	completewith	next
A	goto	1426,28.792,68.804,12,0
A	goto	1426,28.939,68.387,12
S	Warrior/Warlock
T	season	0,1
A	goto	1426,28.792,67.837
A	vendor	
A	target	Grundel Harkin
A	train	6673,1 << Warrior
A	train	348,1 << Warlock
S	Warrior
T	season	0,1
A	goto	1426,28.831,67.238
A	train	6673
A	target	Thran Khorman
S	Warlock
T	season	0,1
A	goto	Dun Morogh,28.650,66.145
A	train	348
A	accept	1599
A	target	Alamar Grimm
S	Warrior/Warlock
T	season	0,1
T	softcore	<< Warlock
T	label	WarriorHS
T	completewith	WolfMeat
A	hs	
A	subzoneskip	77,1
S	Warrior/Warlock
T	season	0,1
T	softcore	<< Warlock
T	optional	
T	requires	WarriorHS
T	completewith	WolfMeat
A	destroy	6948
S	Warlock
T	season	0,1
T	optional	
T	completewith	next
A	goto	1426,28.938,68.358,12,0
A	goto	1426,28.831,68.698,12
A	subzoneskip	77,1
S	
T	label	WolfMeat
A	goto	1426,29.529,73.286,0
A	goto	1426,28.117,75.088,0
A	goto	1426,28.557,72.487,0
A	goto	1426,29.529,73.286,60,0
A	goto	1426,29.054,74.608,60,0
A	goto	1426,28.558,75.781,60,0
A	goto	1426,28.117,75.088,60,0
A	goto	1426,27.562,74.331,60,0
A	goto	1426,27.793,73.123,60,0
A	goto	1426,28.557,72.487,60,0
A	complete	179,1
A	mob	Ragged Young Wolf
S	
T	optional	
A	goto	1426,29.529,73.286,0
A	goto	1426,28.117,75.088,0
A	goto	1426,28.557,72.487,0
A	goto	1426,29.529,73.286,60,0
A	goto	1426,29.054,74.608,60,0
A	goto	1426,28.558,75.781,60,0
A	goto	1426,28.117,75.088,60,0
A	goto	1426,27.562,74.331,60,0
A	goto	1426,27.793,73.123,60,0
A	goto	1426,28.557,72.487,60,0
A	xp	2
A	mob	Ragged Young Wolf
S	Priest/Mage/Warlock
T	season	0,1
A	goto	1426/0,320.30,-6226.74
A	collect	159,15
A	target	Adlin Pridedrift
A	xp	>6,1
S	Mage
T	season	2
A	goto	1426/0,320.30,-6226.74
A	collect	159,15
A	target	Adlin Pridedrift
A	xp	>6,1
S	!Priest !Mage !Warlock
T	completewith	next << !Hunter
A	goto	1426/0,320.30,-6226.74
A	vendor	
A	collect	2516,600 << Hunter
A	target	Adlin Pridedrift
A	xp	>6,1
S	
A	goto	1426/0,328.18,-6214.85
A	turnin	179
A	accept	233
A	accept	3106
A	accept	3107
A	accept	3108
A	accept	3109
A	accept	3110
A	accept	3112
A	accept	3113
A	accept	3114
A	accept	3115
A	target	Sten Stoutarm
S	
T	xprate	<1.1
A	goto	1426/0,338.92,-6216.62
A	accept	170
A	target	Balir Frosthammer
S	Priest/Mage/Warlock
T	season	2
T	xprate	<1.1
T	completewith	EnterAnvilmar
A	goto	1426,27.096,72.545,0
A	goto	1426,26.620,73.548,0
A	goto	1426,25.722,72.261,0
A	goto	1426,24.878,72.329,0
A	goto	1426,24.100,73.749,0
A	goto	1426,24.920,74.697,0
A	goto	1426,21.813,72.584,0
A	goto	1426,19.578,72.086,0
A	goto	1426,20.627,70.415,0
A	complete	170,1
A	mob	+Rockjaw Trogg
A	complete	170,2
A	mob	+Burly Rockjaw Trogg
S	Priest
T	season	2
A	goto	1426/0,485.48,-6259.21
A	collect	205951,1
A	train	402862,1
S	Mage
T	season	2
A	goto	1426/0,485.48,-6259.21
A	collect	203751,1,77667,1
A	train	401760,1
S	!Paladin !Hunter
T	season	2
T	label	EnterAnvilmar
T	optional	
T	completewith	next
A	goto	1426,28.792,68.804,12,0
A	goto	1426,28.642,68.375,12
A	goto	1426,28.939,68.387,12
S	Warlock
T	season	2
A	goto	Dun Morogh,28.650,66.145
A	accept	1599
A	turnin	3115
A	accept	77666
A	turnin	77666
A	train	348
A	target	Alamar Grimm
S	Warrior
T	season	2
A	goto	1426/0,382.11,-6084.86
A	turnin	3106
A	turnin	3112
A	accept	77655
A	accept	77656
A	train	6673
A	trainer	
A	target	Thran Khorman
S	Rogue
T	season	2
A	goto	1426/0,404.91,-6093.76
A	turnin	3109
A	turnin	3113
A	accept	77658
A	accept	77659
A	train	1784
A	target	Solm Hargrin
S	Priest
T	season	2
A	goto	Dun Morogh,28.600,66.385
A	turnin	3110
A	accept	5626
A	accept	77661
A	train	1243
A	target	Branstock Khalder
S	Priest
T	season	2
A	goto	1426,28.922,66.378
A	aura	410935
A	target	Altar of the Light
A	emote	KNEEL,208565
A	train	402862,1
S	Priest
T	season	2
A	train	402862
A	aura	-410935
A	use	205951
S	Dwarf Priest
T	season	2
A	goto	Dun Morogh,28.600,66.385
A	turnin	77661
A	target	Branstock Khalder
A	isQuestComplete	77661
S	Gnome Warlock/Dwarf Priest
T	season	2
T	label	GlovesEquip
T	completewith	Observations
A	equip	10,711
A	use	711
A	train	402862,3 << Priest
A	train	403919,3 << Warlock
S	Gnome Warlock/Dwarf Priest
T	season	2
T	requires	GlovesEquip
T	completewith	Observations
A	engrave	10
A	engrave	10
A	train	402862,3 << Priest
A	train	403919,3 << Warlock
S	Warlock
T	season	0,1
T	requires	FrostmaneC1
T	completewith	next
A	goto	1426,30.146,74.521,0
A	goto	1426,28.322,77.854,0
A	goto	1426,28.747,74.380,0
A	goto	1426,27.018,77.305,0
A	complete	170,1
A	mob	+Rockjaw Trogg
A	complete	170,2
A	mob	+Rockjaw Trogg
A	mob	+Burly Rockjaw Trogg
A	mob	Ragged Young Wolf
A	mob	Ragged Timber Wolf
S	Warlock
T	season	0,1
T	optional	
T	requires	FrostmaneC1
T	label	FrostmaneC
T	completewith	Feathers
A	goto	1426/0,479.72,-6498.17,20
S	Warlock
T	season	0,1
T	optional	
T	requires	FrostmaneC
T	completewith	Feathers
A	goto	1426,27.095,80.702,20,0
A	goto	1426,27.265,80.848,20,0
A	goto	1426,27.857,81.067,20,0
A	goto	1426,28.696,83.148,50
S	Warlock
T	season	0,1
T	label	Feathers
A	goto	1426,28.696,83.148,0
A	goto	1426,30.216,80.254,0
A	goto	1426,28.696,83.148,40,0
A	goto	1426,28.999,82.504,40,0
A	goto	1426,29.298,81.579,15,0
A	goto	1426,29.041,81.168,40,0
A	goto	1426,30.055,82.385,40,0
A	goto	1426,30.381,80.766,40,0
A	goto	1426,30.216,80.254,40,0
A	complete	1599,1
A	mob	Frostmane Novice
S	Warlock
T	season	0,1
T	hardcore	
T	label	BeginningsHS
T	completewith	BeginningsEnd
A	hs	
A	subzoneskip	77,1
S	Warlock
T	season	0,1
T	hardcore	
T	optional	
T	requires	BeginningsHS
T	completewith	BeginningsEnd
A	destroy	6948
S	Warlock
T	season	0,1
T	softcore	
T	label	BeginningsHS
T	completewith	BeginningsEnd
A	deathskip	
A	target	Spirit Healer
S	Warlock
T	season	0,1
T	optional	
T	requires	BeginningsHS
T	completewith	next
A	goto	1426,28.792,68.804,12,0
A	goto	1426,28.939,68.387,12
S	Warlock
T	season	0,1
T	label	BeginningsEnd
A	goto	Dun Morogh,28.650,66.145
A	turnin	1599
A	turnin	-3115
A	target	Alamar Grimm
S	!Paladin !Hunter
T	season	2 << !Warlock --Only Warlock is inside Anvilmar in Era at this step
T	optional	
T	completewith	Talin
A	goto	1426,28.792,68.804,12
A	subzoneskip	77,1
S	
T	xprate	<1.1
T	completewith	Rockjaw
A	goto	1426,27.096,72.545,0
A	goto	1426,26.620,73.548,0
A	goto	1426,25.722,72.261,0
A	goto	1426,24.878,72.329,0
A	goto	1426,24.100,73.749,0
A	goto	1426,24.920,74.697,0
A	goto	1426,21.813,72.584,0
A	goto	1426,19.578,72.086,0
A	goto	1426,20.627,70.415,0
A	complete	170,1
A	mob	+Rockjaw Trogg
A	complete	170,2
A	mob	+Burly Rockjaw Trogg
S	
T	season	0,1
T	label	Talin
A	goto	1426/0,688.98,-6222.47
A	turnin	233
A	accept	183
A	accept	234
A	target	Talin Keeneye
S	
T	season	2
T	label	Talin
A	goto	1426/0,688.98,-6222.47
A	turnin	233
A	accept	234
A	target	Talin Keeneye
S	
T	season	0,1
T	loop	
A	goto	1426,22.276,72.549,0
A	goto	1426,20.924,70.393,0
A	goto	1426,22.662,69.331,0
A	goto	1426,24.358,72.591,0
A	goto	1426,22.276,72.549,45,0
A	goto	1426,21.209,72.266,45,0
A	goto	1426,20.880,71.470,45,0
A	goto	1426,20.924,70.393,45,0
A	goto	1426,21.330,69.261,45,0
A	goto	1426,22.035,69.231,45,0
A	goto	1426,22.662,69.331,45,0
A	goto	1426,24.317,68.026,45,0
A	goto	1426,24.754,69.257,45,0
A	goto	1426,24.878,71.191,45,0
A	goto	1426,24.358,72.591,45,0
A	complete	183,1
A	mob	Small Crag Boar
S	
T	season	0,1
A	goto	1426/0,688.98,-6222.47
A	turnin	183
A	target	Talin Keeneye
S	Paladin/Warlock/Hunter
T	xprate	<1.1
A	goto	1426,27.858,76.482,0
A	goto	1426,30.727,76.831,0
A	goto	1426,29.280,75.500,0
A	goto	1426,27.858,76.482,50,0
A	goto	1426,28.946,77.153,50,0
A	goto	1426,29.716,77.605,50,0
A	goto	1426,30.727,76.831,50,0
A	goto	1426,32.814,75.221,50,0
A	goto	1426,31.138,74.048,50,0
A	goto	1426,30.077,74.479,50,0
A	goto	1426,29.280,75.500,50,0
A	complete	170,1
A	mob	+Rockjaw Trogg
A	complete	170,2
A	mob	+Burly Rockjaw Trogg
S	Paladin/Warlock
T	xprate	<1.5
T	loop	
A	goto	1426,23.595,72.462,0
A	goto	1426,26.117,74.469,0
A	goto	1426,26.832,74.649,0
A	goto	1426,26.884,72.733,0
A	goto	1426,23.595,72.462,50,0
A	goto	1426,24.290,73.406,50,0
A	goto	1426,24.642,74.138,50,0
A	goto	1426,26.117,74.469,50,0
A	goto	1426,26.832,74.649,50,0
A	goto	1426,26.884,72.733,50,0
A	xp	3+1130
S	Paladin/Warlock
T	xprate	>1.49
T	loop	
A	goto	1426,23.595,72.462,0
A	goto	1426,26.117,74.469,0
A	goto	1426,26.832,74.649,0
A	goto	1426,26.884,72.733,0
A	goto	1426,23.595,72.462,50,0
A	goto	1426,24.290,73.406,50,0
A	goto	1426,24.642,74.138,50,0
A	goto	1426,26.117,74.469,50,0
A	goto	1426,26.832,74.649,50,0
A	goto	1426,26.884,72.733,50,0
A	xp	3+995
S	
T	label	Rockjaw
A	goto	1426,25.077,75.711
A	turnin	234
A	accept	182
A	target	Grelin Whitebeard
S	Hunter
T	completewith	next
A	goto	1426,25.861,78.197,0
A	goto	1426,23.716,80.257,0
A	goto	1426,20.671,75.838,0
A	goto	1426,25.861,78.197,45,0
A	goto	1426,26.382,78.409,45,0
A	goto	1426,26.031,79.854,45,0
A	goto	1426,23.716,80.257,45,0
A	goto	1426,22.836,79.962,45,0
A	goto	1426,22.684,78.888,45,0
A	goto	1426,21.029,76.459,45,0
A	goto	1426,20.671,75.838,45,0
A	complete	182,1
A	mob	Frostmane Troll Whelp
S	Hunter
A	goto	1426,25.861,78.197,0
A	goto	1426,23.716,80.257,0
A	goto	1426,20.671,75.838,0
A	xp	4
S	Paladin/Warlock/Hunter
A	goto	Dun Morogh,24.980,75.963
A	accept	3364
A	target	Nori Pridedrift
S	Warlock
T	season	2
T	completewith	next
A	goto	1426/0,479.72,-6498.17,20
S	Warlock
T	loop	
T	season	2
T	label	Feathers
A	goto	1426,28.696,83.148,0
A	goto	1426,30.216,80.254,0
A	goto	1426,28.696,83.148,40,0
A	goto	1426,28.999,82.504,40,0
A	goto	1426,29.298,81.579,15,0
A	goto	1426,29.041,81.168,40,0
A	goto	1426,30.055,82.385,40,0
A	goto	1426,30.381,80.766,40,0
A	goto	1426,30.216,80.254,40,0
A	complete	1599,1
A	mob	Frostmane Novice
S	Warlock
T	season	2
T	completewith	next
A	hs	
S	Paladin/Warlock/Hunter
T	optional	
T	completewith	next
A	goto	1426,28.792,68.804,12,0
A	goto	1426,28.939,68.387,12
S	Paladin/Warlock/Hunter
A	goto	1426/0,385.21,-6056.46
A	turnin	3364
A	accept	3365
A	vendor	
A	target	Durnan Furcutter
A	isQuestAvailable	317
S	Hunter
T	season	0,1
A	goto	1426/0,365.21,-6091.86
A	target	Thorgas Grimson
A	turnin	3108
A	train	1978
S	Hunter
T	season	2
A	goto	1426/0,365.21,-6091.86
A	target	Thorgas Grimson
A	turnin	3108
A	accept	77660
A	train	1978
S	Paladin
T	season	0,1
A	goto	1426/0,382.06,-6120.65
A	turnin	3107
A	train	19740
A	train	20271
A	target	Bromos Grummner
S	Paladin
T	season	2
A	goto	1426/0,382.06,-6120.65
A	turnin	3107
A	accept	77657
A	train	19740
A	train	20271
A	target	Bromos Grummner
S	Warlock
T	season	0,1
A	goto	Dun Morogh,28.650,66.145
A	turnin	3115
A	train	172
A	target	Alamar Grimm
S	Warlock
T	season	2
A	goto	Dun Morogh,28.650,66.145
A	train	172
A	turnin	1599
A	target	Alamar Grimm
S	Paladin/Warlock/Hunter
T	hardcore	
T	optional	
T	completewith	next
A	goto	1426,28.792,68.804,12
A	subzoneskip	77,1
S	Paladin/Warlock/Hunter
T	xprate	<1.1
A	goto	1426/0,338.92,-6216.62
A	turnin	170
A	target	Balir Frosthammer
S	Warlock
T	season	0,1
A	goto	1426/0,320.30,-6226.74
A	collect	159,15
A	target	Adlin Pridedrift
A	xp	>6,1
S	!Paladin !Warlock !Hunter
T	xprate	<1.1
T	sticky	
T	label	TroggEnd
A	goto	1426,24.193,77.305,0
A	goto	1426,22.529,74.512,0
A	goto	1426,24.288,73.154,0
A	goto	1426,29.303,77.337,0
A	waypoint	1426,24.193,77.305,55,0
A	waypoint	1426,23.497,76.707,55,0
A	waypoint	1426,22.828,76.017,55,0
A	waypoint	1426,22.529,74.512,55,0
A	waypoint	1426,22.735,73.285,55,0
A	waypoint	1426,23.616,72.634,55,0
A	waypoint	1426,24.288,73.154,55,0
A	waypoint	1426,24.619,74.280,55,0
A	waypoint	1426,25.920,74.571,55,0
A	waypoint	1426,28.812,76.397,55,0
A	waypoint	1426,29.303,77.337,55,0
A	complete	170,1
A	mob	+Rockjaw Trogg
A	complete	170,2
A	mob	+Burly Rockjaw Trogg
S	Warrior/Paladin
T	season	2
T	completewith	Observations
T	label	Victory1 << Warrior
T	label	Libram1 << Paladin
A	goto	1426,25.861,78.197,0
A	goto	1426,23.716,80.257,0
A	goto	1426,20.671,75.838,0
A	waypoint	1426,22.836,79.962,45,0
A	waypoint	1426,22.684,78.888,45,0
A	waypoint	1426,21.029,76.459,45,0
A	waypoint	1426,20.671,75.838,45,0
A	waypoint	1426,25.861,78.197,45,0
A	waypoint	1426,26.382,78.409,45,0
A	waypoint	1426,26.031,79.854,45,0
A	waypoint	1426,23.716,80.257,45,0
A	collect	204806,1 << Warrior
A	collect	205420,1 << Paladin
A	mob	Frostmane Troll Whelp
A	train	403470,1 << Warrior
A	train	410002,1 << Paladin
S	Warrior
T	season	2
T	completewith	Observations
T	label	Victory2
T	requires	Victory1
A	train	403470
A	use	204806
A	itemcount	204806,1
S	Warrior
T	season	2
T	completewith	Observations
T	label	Victory3
T	requires	Victory2
A	equip	10
A	train	403470,3
S	Warrior
T	season	2
T	completewith	Observations
T	requires	Victory3
A	engrave	10
A	train	403470,3
S	Paladin
T	season	2
T	completewith	Observations
T	label	Libram2
T	requires	Libram1
A	equip	18,205420
A	use	205420
A	itemcount	205420,1
A	train	410002,1
S	Paladin
T	season	2
T	completewith	Observations
T	label	Libram3
T	requires	Libram2
A	goto	1426,24.193,77.305,0
A	goto	1426,22.529,74.512,0
A	goto	1426,24.288,73.154,0
A	goto	1426,29.303,77.337,0
A	waypoint	1426,29.303,77.337,55,0
A	waypoint	1426,28.812,76.397,55,0
A	waypoint	1426,25.920,74.571,55,0
A	waypoint	1426,24.619,74.280,55,0
A	waypoint	1426,24.288,73.154,55,0
A	waypoint	1426,23.616,72.634,55,0
A	waypoint	1426,22.735,73.285,55,0
A	waypoint	1426,22.529,74.512,55,0
A	waypoint	1426,22.828,76.017,55,0
A	waypoint	1426,23.497,76.707,55,0
A	waypoint	1426,24.193,77.305,55,0
A	aura	408828
A	itemStat	18,QUALITY,2
A	train	410002,1
S	Paladin
T	season	2
T	completewith	Observations
T	label	Libram4
T	requires	Libram3
A	cast	409920
A	use	205420
A	aura	-408828
A	train	410002,1
S	Paladin
T	season	2
T	completewith	Observations
T	label	Libram5
T	requires	Libram4
A	equip	10
A	train	410002,3
S	Paladin
T	season	2
T	completewith	Observations
T	requires	Libram5
A	engrave	10
A	train	410002,3
S	
T	loop	
T	label	TrollWhelps
A	goto	1426,25.861,78.197,0
A	goto	1426,23.716,80.257,0
A	goto	1426,20.671,75.838,0
A	goto	1426,25.861,78.197,45,0
A	goto	1426,26.382,78.409,45,0
A	goto	1426,26.031,79.854,45,0
A	goto	1426,23.716,80.257,45,0
A	goto	1426,22.836,79.962,45,0
A	goto	1426,22.684,78.888,45,0
A	goto	1426,21.029,76.459,45,0
A	goto	1426,20.671,75.838,45,0
A	complete	182,1
A	mob	Frostmane Troll Whelp
S	Warrior/Paladin
T	season	2
T	optional	
T	requires	Victory2 << Warrior
T	requires	Libram4 << Paladin
S	
T	requires	TroggEnd << !Paladin !Warlock !Hunter
A	goto	1426/0,567.09,-6362.99
A	turnin	182
A	accept	218
A	target	Grelin Whitebeard
S	Paladin/Warlock/Hunter
A	goto	Dun Morogh,24.980,75.963
A	turnin	3365
A	target	Nori Pridedrift
S	!Paladin !Warlock !Hunter
T	softcore	
A	goto	Dun Morogh,24.980,75.963
A	accept	3364
A	target	Nori Pridedrift
S	!Paladin !Warlock !Hunter
T	softcore	
T	completewith	next
S	
T	optional	
T	label	FrostMCave1
T	completewith	Grelin
A	goto	1426,27.098,80.707,20
S	
T	optional	
T	requires	FrostMCave1
T	completewith	Grelin
A	goto	1426,28.298,79.836,15,0
A	goto	1426,29.252,79.043,15,0
A	goto	1426,30.489,80.165,50
S	
T	sticky	<< Rogue/Hunter
T	label	Grelin
A	goto	1426,30.489,80.165,0,0
A	complete	218,1
A	mob	Grik'nir the Cold
S	Rogue/Hunter
T	season	2
A	goto	1426/0,286.51,-6505.82
A	collect	204795,1 << Rogue
A	collect	206168,1 << Hunter
A	train	400105,1 << Rogue
A	train	410121,1 << Hunter
S	Rogue
T	season	2
T	hardcore	
A	train	400105
A	use	204795
A	itemcount	204795,1
S	Hunter
T	season	2
A	train	410121
A	use	206168
A	itemcount	206168,1
S	Rogue
T	season	2
T	hardcore	
T	completewith	Observations
T	label	Shadowstrike1
A	equip	10
A	train	400105,3
S	Hunter
T	season	2
T	completewith	Observations
T	label	Chimera1
A	equip	10
A	train	410121,1
S	Rogue
T	season	2
T	hardcore	
T	completewith	Observations
T	requires	Shadowstrike1
A	engrave	10
A	train	400105,3
S	Hunter
T	season	2
T	completewith	Observations
T	requires	Chimera1
A	engrave	10
A	train	410121,1
S	!Paladin !Warlock !Hunter
T	softcore	
T	requires	Grelin << Rogue
T	completewith	next
A	deathskip	
A	target	Spirit Healer
S	
T	hardcore	<< !Paladin !Warlock !Hunter
T	optional	
T	requires	Grelin << Rogue/Hunter
T	completewith	Stolen
A	goto	1426,29.252,79.043,15,0
A	goto	1426,28.298,79.836,15,0
A	goto	1426,27.098,80.707,20
A	subzoneskip	132
S	!Paladin !Warlock !Hunter
T	hardcore	
T	requires	Grelin << Rogue
A	goto	Dun Morogh,24.980,75.963
A	accept	3364
A	target	Nori Pridedrift
S	
T	hardcore	<< !Paladin !Warlock !Hunter
T	requires	Grelin << Rogue/Hunter
T	label	Stolen
A	goto	1426/0,567.14,-6363.06
A	turnin	218
A	accept	282
A	target	Grelin Whitebeard
S	!Paladin !Warlock !Hunter
T	softcore	
T	requires	Grelin << Rogue
A	goto	1426/0,385.21,-6056.46
A	turnin	3364
A	accept	3365
A	vendor	
A	target	Durnan Furcutter
A	isOnQuest	3364
S	!Paladin !Warlock !Hunter
T	optional	
T	softcore	
A	goto	1426/0,385.21,-6056.46
A	accept	3365
A	vendor	
A	target	Durnan Furcutter
A	isQuestTurnedIn	3364
A	isQuestAvailable	317
S	!Paladin !Warlock !Hunter
T	softcore	
T	requires	Grelin << Rogue
A	abandon	3364
S	Rogue
T	season	2
T	softcore	
A	train	400105
A	use	204795
A	itemcount	204795,1
S	Rogue
T	season	2
T	softcore	
T	completewith	Observations
T	label	Shadowstrike1
A	equip	10
A	train	400105,3
S	Rogue
T	season	2
T	softcore	
T	completewith	Observations
T	requires	Shadowstrike1
A	engrave	10
A	train	400105,3
S	!Paladin !Warlock !Hunter
T	softcore	
T	optional	
A	accept	3364
A	goto	Dun Morogh,24.980,75.963
A	target	+Nori Pridedrift
A	turnin	218
A	accept	282
A	goto	1426/0,567.14,-6363.06
A	target	+Grelin Whitebeard
A	isQuestAvailable	3364
S	!Paladin !Warlock !Hunter
T	softcore	
T	optional	
A	goto	1426/0,385.21,-6056.46
A	turnin	3364
A	accept	3365
A	target	Durnan Furcutter
S	!Paladin !Warlock !Hunter
T	hardcore	
A	goto	1426/0,385.21,-6056.46
A	turnin	3364
A	accept	3365
A	target	Durnan Furcutter
A	isQuestAvailable	317
S	Mage
T	xprate	>1.59
T	season	0,1
A	goto	1426/0,388.17,-6056.10
A	turnin	3114
A	trainer	
A	target	Marryk Nurribit
S	Mage
T	xprate	>1.59
T	season	2
A	goto	1426/0,388.17,-6056.10
A	turnin	3114
A	accept	77667
A	trainer	
A	target	Marryk Nurribit
S	Gnome Mage
T	xprate	>1.59
T	season	2
T	completewith	next
A	train	401760
A	use	203751
A	itemcount	203751,1
S	Gnome Mage
T	xprate	>1.59
T	season	2
A	goto	1426/0,388.17,-6056.10
A	turnin	77667
A	target	Marryk Nurribit
S	Gnome Mage
T	xprate	>1.59
T	season	2
T	label	GlovesEquip
T	completewith	Observations
A	equip	10,711
A	use	711
A	train	401760,3
S	Gnome Mage
T	xprate	>1.59
T	season	2
T	requires	GlovesEquip
T	completewith	Observations
A	engrave	10
A	train	401760,3
S	Rogue
T	xprate	>1.59
T	season	0,1
A	goto	1426/0,404.91,-6093.76
A	turnin	3113
A	turnin	3109
A	train	1784
A	trainer	
A	target	Solm Hargrin
S	Rogue
T	xprate	>1.59
T	season	2
A	goto	1426/0,404.91,-6093.76
A	turnin	77658
A	turnin	77659
A	train	921
A	trainer	
A	target	Solm Hargrin
S	Priest
T	xprate	>1.59
T	season	0,1
A	goto	Dun Morogh,28.600,66.385
A	turnin	3110
A	accept	5626
A	train	1243
A	train	2052
A	trainer	
A	target	Branstock Khalder
S	Priest
T	xprate	>1.59
T	season	2
A	goto	Dun Morogh,28.600,66.385
A	accept	5626
A	train	2052
A	trainer	
A	target	Branstock Khalder
S	Warrior
T	xprate	>1.59
T	season	0,1
A	goto	1426/0,382.11,-6084.86
A	turnin	3106
A	turnin	3112
A	trainer	
A	target	Thran Khorman
S	Warrior
T	xprate	>1.59
T	season	2
A	goto	1426/0,382.11,-6084.86
A	turnin	77655
A	turnin	77656
A	trainer	
A	target	Thran Khorman
S	Mage
T	xprate	<1.59
T	season	0,1
A	goto	1426/0,388.17,-6056.10
A	turnin	3114
A	train	1459
A	train	116
A	target	Marryk Nurribit
S	Mage
T	xprate	<1.59
T	season	2
A	goto	1426/0,388.17,-6056.10
A	turnin	3114
A	accept	77667
A	train	1459
A	train	116
A	target	Marryk Nurribit
S	Gnome Mage
T	xprate	<1.59
T	season	2
T	completewith	next
A	train	401760
A	use	203751
A	itemcount	203751,1
S	Gnome Mage
T	xprate	<1.59
T	season	2
A	goto	1426/0,388.17,-6056.10
A	turnin	77667
A	target	Marryk Nurribit
S	Gnome Mage
T	xprate	<1.59
T	season	2
T	label	GlovesEquip
T	completewith	Observations
A	equip	10,711
A	use	711
A	train	401760,3
S	Gnome Mage
T	xprate	<1.59
T	season	2
T	requires	GlovesEquip
T	completewith	Observations
A	engrave	10
A	train	401760,3
S	Rogue
T	xprate	<1.59
T	season	0,1
A	goto	1426/0,404.91,-6093.76
A	turnin	3113
A	turnin	3109
A	train	1784
A	target	Solm Hargrin
S	Rogue
T	xprate	<1.59
T	season	2
A	goto	1426/0,404.91,-6093.76
A	turnin	77658
A	turnin	77659
A	target	Solm Hargrin
S	Priest
T	xprate	<1.59
T	season	0,1
A	goto	Dun Morogh,28.600,66.385
A	turnin	3110
A	accept	5626
A	train	1243
A	train	2052
A	trainer	
A	target	Branstock Khalder
S	Priest
T	xprate	<1.59
T	season	2
A	goto	Dun Morogh,28.600,66.385
A	train	589
A	target	Branstock Khalder
S	Warrior
T	xprate	<1.59
T	season	0,1
A	goto	1426/0,382.11,-6084.86
A	turnin	3106
A	turnin	3112
A	train	100
A	train	772
A	target	Thran Khorman
S	Warrior
T	xprate	<1.59
T	season	2
A	goto	1426/0,382.11,-6084.86
A	turnin	77655
A	turnin	77656
A	train	100
A	train	772
A	target	Thran Khorman
S	!Paladin !Warlock !Hunter
T	optional	
T	completewith	Stolen
A	goto	1426,28.831,68.698,12
A	subzoneskip	77,1
S	!Paladin !Warlock !Hunter
T	xprate	<1.1
A	goto	1426/0,338.92,-6216.62
A	turnin	170
A	target	Balir Frosthammer
S	Priest/Mage
T	season	0,1
A	goto	1426/0,320.30,-6226.74
A	collect	159,5
A	target	Adlin Pridedrift
A	money	<0.0025
A	xp	>8,1
S	!Paladin !Warlock !Hunter
T	softcore	
T	label	Stolen
A	goto	1426/0,567.14,-6363.06
A	turnin	218
A	accept	282
A	target	Grelin Whitebeard
S	!Paladin !Warlock !Hunter
A	goto	Dun Morogh,24.980,75.963
A	turnin	3365
A	target	Nori Pridedrift
S	Dwarf Paladin/Dwarf Hunter
T	season	2
T	optional	
T	completewith	next
A	goto	1426,28.792,68.804,12,0
A	goto	1426,28.939,68.387,12
S	Dwarf Paladin
T	season	2
T	optional	
A	goto	1426/0,382.06,-6120.65
A	turnin	77657
A	target	Bromos Grummner
A	isQuestComplete	77657
A	equip	10
S	Dwarf Hunter
T	season	2
T	optional	
A	goto	1426/0,365.21,-6091.86
A	turnin	77660
A	target	Thorgas Grimson
A	isQuestComplete	77660
A	equip	10
S	Dwarf Paladin/Dwarf Hunter
T	season	2
T	optional	
T	completewith	ColdridgePass
A	abandon	77657
A	abandon	77660
S	
T	label	Observations
A	turnin	282
A	accept	420
A	goto	1426/0,153.00,-6235.86
A	target	+Mountaineer Thalos
A	accept	2160
A	goto	1426/0,134.97,-6248.96
A	target	+Hands Springsprocket
S	
T	label	ColdridgePass
A	goto	1426/0,111.82,-6206.61,15,0
A	goto	1426/0,46.32,-6037.19,15
A	subzoneskip	800,1
A	isOnQuest	2160
E
G	Guides/forever/Alliance-1-14_DwarfGnome.lua
M	xprate	>1.49 << Hunter
M	era/som--h	
M	classic	
M	tbc	
M	season	0,1
M	version	1
M	selector	Alliance --!Hunter
M	group	RestedXP Forever Guide (A)
M	subgroup	Speedrun Guide 1-20
M	name	6-11 Dun Morogh
M	displayname	6-12 Dun Morogh << sod !Warlock
M	next	11-12 Elwynn (Dwarf/Gnome);11-12 Voidwalker Quest;12-14 Loch Modan (Dwarf/Gnome);11-13 Loch Modan (Hunter)
M	defaultfor	Dwarf/Gnome
S	
T	optional	
T	label	BoarMeatQuest
T	completewith	SenirEnd
A	collect	769,4,317,1
A	collect	2886,6,384,1
A	mob	Crag Boar
A	subzoneskip	131
S	
T	xprate	<1.49
T	optional	
A	goto	1426,43.316,56.283,60,0
A	goto	1426,43.949,52.524,60,0
A	goto	1426,38.677,60.561,60,0
A	goto	1426/0,-499.17,-5644.37
A	xp	5+2145
A	xp	5+2415
A	subzoneskip	131
S	
T	xprate	1.49-1.59
T	optional	
A	goto	1426,43.316,56.283,60,0
A	goto	1426,43.949,52.524,60,0
A	goto	1426,38.677,60.561,60,0
A	goto	1426/0,-499.17,-5644.37
A	xp	5+1817
A	xp	5+2222
A	subzoneskip	131
S	
T	xprate	>1.59
T	optional	
A	goto	1426,43.316,56.283,60,0
A	goto	1426,43.949,52.524,60,0
A	goto	1426,38.677,60.561,60,0
A	goto	1426/0,-499.17,-5644.37
A	xp	5+1490
A	xp	5+2030
A	subzoneskip	131
S	
T	hardcore	
T	completewith	next
A	goto	1426/0,-499.17,-5644.37
A	subzone	131
A	mob	Crag Boar
S	
T	softcore	
T	completewith	next
A	deathskip	
A	target	Spirit Healer
S	
T	label	SenirEnd
A	goto	1426/0,-499.17,-5644.37
A	turnin	420
A	target	Senir Whitebeard
S	!Priest
T	xprate	<1.5
T	optional	
A	goto	1426/0,-576.69,-5748.58
A	xp	5+2690
S	!Priest
T	xprate	1.49-1.59
T	optional	
A	goto	1426/0,-576.69,-5748.58
A	xp	5+2635
S	!Priest
T	xprate	>1.99
T	optional	
A	goto	1426/0,-576.69,-5748.58
A	xp	5+2580
S	Warlock
A	goto	1426/0,-528.87,-5640.00
A	trainer	
A	target	Gimrizz Shadowcog
S	Warlock
A	goto	1426/0,-526.11,-5639.71
A	vendor	6328
A	target	Dannie Fizzwizzle
A	money	<0.0100
S	
A	goto	1426/0,-504.05,-5596.27
A	accept	384
A	target	Ragnar Thunderbrew
S	
T	optional	
T	completewith	next
A	goto	1426,46.952,52.050,8,0
A	goto	1426,47.153,51.939,8
S	
A	goto	1426/0,-523.35,-5590.82
A	turnin	2160,1
A	turnin	2160,2
A	target	Tannok Frosthammer
S	Rogue
A	goto	1426/0,-521.97,-5597.65
A	collect	2946,200
A	target	Kreg Bilmn
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.0
S	Rogue
T	optional	
T	sticky	
T	label	BalancedDaggers1
A	use	2946
A	itemcount	2946,1
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.0
S	Rogue
T	optional	
T	sticky	
T	requires	BalancedDaggers1
T	label	DeleteOldDaggers
A	destroy	2947
S	Rogue
T	xprate	<1.59
A	goto	1426/0,-540.39,-5604.38
A	trainer	
A	target	Hogral Bakkan
S	Mage
T	xprate	<1.59
A	goto	1426/0,-537.19,-5586.91
A	trainer	
A	target	Magis Sparkmantle
S	Paladin
T	xprate	<1.59
A	goto	1426/0,-542.07,-5586.720
A	trainer	
A	target	Azar Stronghammer
S	Priest
A	goto	1426/0,-529.51,-5590.660
A	accept	5625
A	target	Maxan Anvol
S	Priest
A	goto	1426/0,-453.81,-5668.73
A	complete	5625,1
A	target	Mountaineer Dolf
S	Priest
T	xprate	<1.59
A	goto	1426/0,-529.51,-5590.660
A	turnin	5625
A	trainer	
A	target	Maxan Anvol
S	Priest
T	xprate	>1.59
A	goto	1426/0,-529.51,-5590.660
A	turnin	5625
A	target	Maxan Anvol
S	
A	goto	1426/0,-531.23,-5601.59
A	home	
A	vendor	
A	target	Innkeeper Belm
S	Warrior
T	xprate	<1.59
A	goto	Dun Morogh,47.360,52.646
A	trainer	
A	target	Granis Swiftaxe
S	Paladin/Warrior/Rogue
T	optional	
T	completewith	Blacksmithing1
A	goto	1426,45.695,51.911,20
S	Gnome Warrior
A	goto	1426,45.288,52.193
A	target	Grawn Thromwyn
A	money	<0.0536
A	collect	2488,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.80
S	Gnome Warrior
T	completewith	next
A	use	2488
A	itemcount	2488,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.79
S	Dwarf Warrior
A	goto	1426,45.288,52.193
A	target	Grawn Thromwyn
A	money	<0.0460
A	collect	2491,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.30
S	Dwarf Warrior
T	completewith	next
A	use	2491
A	itemcount	2491,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.29
S	Rogue
A	goto	1426,45.288,52.193
A	target	Grawn Thromwyn
A	money	<0.0400
A	collect	2494,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Rogue
T	completewith	next
A	use	2494
A	itemcount	2494,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.29
S	Paladin
A	goto	1426,45.288,52.193
A	target	Grawn Thromwyn
A	money	<0.0631
A	goto	Dun Morogh,45.290,52.190
A	collect	2493,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<5.00
S	Paladin
T	completewith	next
A	use	2493
A	itemcount	2493,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.99
S	Warrior/Rogue/Paladin
T	label	Blacksmithing1
A	goto	1426,45.344,51.936
A	train	2018
A	target	Tognus Flintfire
S	
T	requires	DeleteOldDaggers << Rogue
A	goto	1426/0,-464.45,-5573.78
A	accept	400
A	target	Tharek Blackstone
S	Rogue
T	season	2
A	goto	1426/0,-545.07,-5574.76,5,0
A	goto	Dun Morogh,47.160,52.335,5,0
A	goto	1426/0,-508.58,-5584.25
A	collect	203993,1
A	train	424992,1
S	Rogue
T	season	2
A	train	424992
A	use	203993
A	itemcount	203993,1
S	
T	optional	
T	completewith	next
A	collect	769,4,317,1
A	collect	2886,6,384,1
A	mob	Crag Boar
A	subzoneskip	131
S	
T	xprate	<1.5
T	label	StartStocking
A	accept	317
A	goto	1426/0,-632.15,-5466.540
A	target	+Pilot Bellowfiz
A	accept	313
A	goto	1426/0,-641.80,-5473.18
A	target	+Pilot Stonegear
S	Warrior/Paladin/Rogue
T	xprate	1.49-1.59
T	label	StartStocking
A	accept	317
A	goto	1426/0,-632.15,-5466.540
A	target	+Pilot Bellowfiz
A	accept	313
A	goto	1426/0,-641.80,-5473.18
A	target	+Pilot Stonegear
S	
T	xprate	>1.49 << !Warrior !Paladin !Rogue
T	xprate	>1.59 << Warrior/Paladin/Rogue
T	label	StartStocking
A	goto	1426/0,-632.15,-5466.540
A	accept	317
A	target	Pilot Bellowfiz
S	Warrior/Paladin/Rogue
T	optional	
A	turnin	400
A	goto	1426/0,-682.23,-5488.94
A	target	+Beldin Steelgrill
A	accept	5541
A	collect	2901,1
A	goto	1426/0,-664.55,-5499.710
A	target	+Loslor Rudge
A	train	2018,3
S	
A	turnin	400
A	goto	1426/0,-682.23,-5488.94
A	target	+Beldin Steelgrill
A	accept	5541
A	goto	1426/0,-664.55,-5499.710
A	target	+Loslor Rudge
S	Warrior/Paladin/Rogue
T	optional	
A	goto	1426/0,-660.91,-5528.93
A	train	2575
A	target	Yarr Hammerstone
A	train	2018,3
S	Warrior/Paladin/Rogue
T	optional	
T	completewith	QuarryEnd
A	cast	2580
A	usespell	2580
A	train	2575,3
S	Warrior/Paladin/Rogue
T	xprate	<1.59
T	completewith	BearFur
A	complete	317,1
A	collect	2886,6,384,1
A	mob	Crag Boar
A	mob	Large Crag Boar
S	Warrior/Paladin/Rogue
T	xprate	<1.59
T	completewith	BearFur
A	complete	317,2
A	mob	Young Black Bear
S	Hunter
T	season	2
T	sticky	
T	label	pigmeat
A	collect	208192,1
A	mob	Crag Boar
A	mob	Elder Crag Boar
A	mob	Large Crag Boar
A	mob	Scarred Crag Boar
A	train	425762,1
S	
T	xprate	>1.59 << Paladin/Warrior/Rogue
T	loop	
A	goto	1426/0,-758.92,-5522.03,0
A	goto	1426/0,-340.29,-5600.83,0
A	goto	1426/0,-758.92,-5522.03,75,0
A	goto	1426/0,-734.29,-5646.80,75,0
A	goto	1426/0,-665.34,-5646.80,75,0
A	goto	1426/0,-655.49,-5548.30,75,0
A	goto	1426/0,-561.92,-5502.33,75,0
A	goto	1426/0,-571.77,-5416.97,75,0
A	goto	1426/0,-340.29,-5600.83,75,0
A	complete	317,2
A	mob	+Young Black Bear
A	complete	317,1
A	collect	2886,6,384,1
A	disablecheckbox	
A	mob	Large Crag Boar
A	mob	Crag Boar
S	
T	xprate	>1.59 << Paladin/Warrior/Rogue
T	optional	
T	completewith	EvershineEnd
A	collect	2886,6,384,1
A	mob	Large Crag Boar
A	mob	Crag Boar
S	
T	xprate	>1.59 << Paladin/Warrior/Rogue
A	goto	1426/0,-632.15,-5466.540
A	turnin	317
A	accept	318
A	target	Pilot Bellowfiz
S	Warrior/Paladin/Rogue
T	xprate	>1.59
T	optional	
A	goto	1426/0,-664.55,-5499.710
A	collect	2901,1
A	target	Loslor Rudge
A	train	2018,3
S	Warrior/Paladin/Rogue
T	xprate	>1.59
T	optional	
A	goto	1426/0,-660.91,-5528.93
A	train	2575
A	target	Yarr Hammerstone
A	train	2018,3
S	
T	xprate	>1.59 << Warrior/Paladin/Rogue
T	optional	
T	completewith	next
A	goto	1426,46.952,52.050,8,0
A	goto	1426,47.153,51.939,8
S	
T	xprate	>1.59 << Warrior/Paladin/Rogue
T	optional	
A	goto	1426/0,-531.23,-5601.59
A	complete	384,2
A	target	Innkeeper Belm
A	itemcount	2886,6
S	
T	xprate	>1.59 << Warrior/Paladin/Rogue
T	optional	
A	goto	1426/0,-504.05,-5596.27
A	turnin	384
A	target	Ragnar Thunderbrew
A	isQuestComplete	384
S	Paladin/Warrior/Rogue
T	optional	
T	completewith	Blacksmithing1
A	goto	1426,45.695,51.911,20
S	Gnome Warrior
A	goto	1426,45.288,52.193
A	target	Grawn Thromwyn
A	money	<0.0536
A	collect	2488,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.80
S	Gnome Warrior
T	completewith	next
A	use	2488
A	itemcount	2488,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.79
S	Dwarf Warrior
A	goto	1426,45.288,52.193
A	target	Grawn Thromwyn
A	money	<0.0460
A	collect	2491,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.30
S	Dwarf Warrior
T	completewith	next
A	use	2491
A	itemcount	2491,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.29
S	Rogue
A	goto	1426,45.288,52.193
A	target	Grawn Thromwyn
A	money	<0.0400
A	collect	2494,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Rogue
T	completewith	next
A	use	2494
A	itemcount	2494,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.29
S	Paladin
A	goto	1426,45.288,52.193
A	target	Grawn Thromwyn
A	money	<0.0631
A	goto	Dun Morogh,45.290,52.190
A	collect	2493,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<5.00
S	Paladin
T	completewith	next
A	use	2493
A	itemcount	2493,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.99
S	Hunter
T	optional	
A	xp	6
S	Hunter
T	optional	
A	goto	Dun Morogh,45.810,53.039
A	train	3044
A	train	1130
A	target	Grif Wildheart
A	money	<0.02
S	Hunter
T	season	0,1
A	goto	Dun Morogh,45.810,53.039
A	train	3044
A	target	Grif Wildheart
A	money	<0.01
S	Hunter
T	season	2
A	goto	Dun Morogh,45.810,53.039
A	train	1130
A	target	Grif Wildheart
S	Warrior/Rogue/Priest/Mage/Warlock
T	optional	
T	completewith	next
A	goto	1426,46.952,52.050,8,0
A	goto	1426,47.153,51.939,8
S	Warrior/Rogue
T	completewith	next
A	goto	1426/0,-531.23,-5601.59
A	vendor	1247
A	target	Innkeeper Belm
A	money	<0.0125
A	itemcount	4541,<1
A	xp	>10,1
S	Priest/Mage/Warlock
T	completewith	next
A	goto	1426/0,-531.23,-5601.59
A	vendor	1247
A	target	Innkeeper Belm
A	money	<0.0125
A	itemcount	1179,<1
A	xp	>10,1
S	
T	season	0,1 << Warrior
T	xprate	<1.49 << !Warrior !Paladin !Rogue
T	xprate	<1.59 << Warrior/Paladin/Rogue
T	optional	
T	completewith	next
A	goto	1426,42.982,54.755
A	subzone	136
A	isOnQuest	313
S	Warrior
T	season	2
T	optional	
T	completewith	next
A	goto	1426,42.982,54.755
A	subzone	136
A	isOnQuest	313
S	Warrior
T	season	2
T	sticky	
T	label	WendigoPaw
T	loop	
A	goto	1426,42.982,54.755,0
A	goto	1426,41.918,54.053,0
A	goto	1426,41.100,48.927,0
A	waypoint	1426,41.918,54.053,40,0
A	waypoint	1426,42.177,53.274,40,0
A	waypoint	1426,41.100,48.927,40,0
A	collect	208160,1
A	mob	Young Wendigo
A	mob	Wendigo
A	train	403475,1
S	
T	xprate	<1.49 << !Warrior !Paladin !Rogue
T	xprate	<1.59 << Warrior/Paladin/Rogue
T	optional	<< Warrior/Paladin/Rogue
T	loop	
A	goto	1426,42.982,54.755,0
A	goto	1426,41.918,54.053,0
A	goto	1426,41.100,48.927,0
A	goto	1426,42.982,54.755,40,0
A	goto	1426,41.901,55.217,40,0
A	goto	1426,41.918,54.053,40,0
A	goto	1426,42.177,53.274,40,0
A	goto	1426,41.100,48.927,40,0
A	complete	313,1
A	mob	Wendigo
A	mob	Young Wendigo
A	train	2018,3 << Warrior/Paladin/Rogue
S	Warrior/Paladin/Rogue
T	xprate	<1.59
T	loop	
A	goto	1426,42.982,54.755,0
A	goto	1426,41.918,54.053,0
A	goto	1426,41.100,48.927,0
A	goto	1426,42.982,54.755,40,0
A	goto	1426,41.901,55.217,40,0
A	goto	1426,41.918,54.053,40,0
A	goto	1426,42.177,53.274,40,0
A	goto	1426,41.100,48.927,40,0
A	complete	313,1
A	mob	Wendigo
A	mob	Young Wendigo
A	train	2018,1 << Warrior/Paladin/Rogue
S	
A	goto	1426/0,-371.32,-5746.94
A	complete	5541,1
S	
T	optional	
T	completewith	next
A	goto	1426,40.632,62.794,40,0
A	goto	1426/0,-201.51,-6015.520,15
S	Hunter
T	optional	
A	goto	1426/0,-201.51,-6015.520
A	turnin	5541
A	collect	2509,1
A	target	Hegnar Rumbleshot
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.95
S	
T	label	BearFur
A	goto	1426/0,-201.51,-6015.520
A	turnin	5541
A	target	Hegnar Rumbleshot
S	
T	xprate	>1.59 << Warrior/Paladin/Rogue
T	optional	
T	loop	
A	goto	1426,38.874,61.932,0
A	goto	1426,38.783,60.304,0
A	goto	1426,36.237,60.316,0
A	goto	1426,38.874,61.932,45,0
A	goto	1426,38.783,60.304,45,0
A	goto	1426,36.237,60.316,45,0
A	xp	7
A	mob	Juvenile Snow Leopard
A	mob	Young Black Bear
A	mob	Crag Boar
S	Warrior/Paladin/Rogue
T	xprate	<1.59
T	loop	
A	complete	317,1
A	mob	+Crag Boar
A	mob	+Large Crag Boar
A	goto	1426,43.704,65.296,0
A	goto	1426,47.657,64.039,0
A	goto	1426,46.285,59.797,0
A	goto	1426,43.704,65.296,60,0
A	goto	1426,44.729,65.685,60,0
A	goto	1426,45.128,64.702,60,0
A	goto	1426,46.111,64.349,60,0
A	goto	1426,47.657,64.039,60,0
A	goto	1426,49.484,62.370,60,0
A	goto	1426,49.156,59.842,60,0
A	goto	1426,49.403,58.855,60,0
A	goto	1426,48.523,57.088,60,0
A	goto	1426,46.285,59.797,60,0
A	collect	2886,6,384,1
A	disablecheckbox	
A	complete	317,2
A	mob	+Young Black Bear
A	goto	1426,43.452,58.760,0
A	goto	1426,44.898,50.142,0
A	goto	1426,50.555,51.778,0
A	goto	1426,43.452,58.760,60,0
A	goto	1426,44.969,55.078,60,0
A	goto	1426,43.748,51.885,60,0
A	goto	1426,44.243,50.923,60,0
A	goto	1426,44.898,50.142,60,0
A	goto	1426,45.395,49.347,60,0
A	goto	1426,48.092,49.904,60,0
A	goto	1426,49.177,51.013,60,0
A	goto	1426,50.555,51.778,60,0
A	mob	Crag Boar
A	mob	Large Crag Boar
S	Warrior/Paladin/Rogue
T	xprate	<1.59
T	completewith	Ribs
A	goto	1426,43.704,65.296,0
A	goto	1426,47.657,64.039,0
A	goto	1426,46.285,59.797,0
A	collect	2886,6,384,1
A	mob	Crag Boar
A	mob	Large Crag Boar
S	Warrior/Paladin/Rogue
T	xprate	<1.59
A	goto	1426/0,-632.15,-5466.540
A	turnin	317
A	accept	318
A	target	Pilot Bellowfiz
S	Warrior/Paladin/Rogue
T	xprate	<1.59
A	goto	1426/0,-641.80,-5473.18
A	turnin	313
A	target	Pilot Stonegear
S	Warrior/Paladin/Rogue
T	xprate	<1.59
T	optional	
A	goto	1426/0,-664.55,-5499.710
A	collect	2901,1
A	target	Loslor Rudge
A	train	2018,3
S	Warrior/Paladin/Rogue
T	xprate	<1.59
T	optional	
A	goto	1426/0,-660.91,-5528.93
A	train	2575
A	target	Yarr Hammerstone
A	train	2018,3
S	Warrior/Paladin/Rogue
T	xprate	<1.59
T	optional	
A	goto	1426/0,-531.23,-5601.59
A	complete	384,2
A	target	Innkeeper Belm
A	itemcount	2886,6
S	Warrior/Paladin/Rogue
T	xprate	<1.59
T	optional	
A	goto	1426/0,-504.05,-5596.27
A	turnin	384
A	target	Ragnar Thunderbrew
A	isQuestComplete	384
S	Warrior/Paladin/Rogue
T	xprate	<1.49
T	optional	
T	loop	
A	goto	1426,48.523,57.088,60,0
A	goto	1426,46.285,59.797,60,0
A	goto	1426,43.704,65.296,60,0
A	goto	1426,44.729,65.685,60,0
A	goto	1426,45.128,64.702,60,0
A	goto	1426,46.111,64.349,60,0
A	goto	1426,47.657,64.039,60,0
A	goto	1426,49.484,62.370,60,0
A	goto	1426,49.156,59.842,60,0
A	goto	1426,49.403,58.855,60,0
A	xp	7
S	Warrior/Rogue
T	xprate	<1.59
T	optional	
T	loop	
A	goto	1426,48.523,57.088,60,0
A	goto	1426,46.285,59.797,60,0
A	goto	1426,43.704,65.296,60,0
A	goto	1426,44.729,65.685,60,0
A	goto	1426,45.128,64.702,60,0
A	goto	1426,46.111,64.349,60,0
A	goto	1426,47.657,64.039,60,0
A	goto	1426,49.484,62.370,60,0
A	goto	1426,49.156,59.842,60,0
A	goto	1426,49.403,58.855,60,0
A	xp	8
S	Rogue
T	xprate	<1.59
A	goto	1426/0,-540.39,-5604.38
A	trainer	
A	target	Hogral Bakkan
A	xp	<8,1
S	Paladin
T	xprate	<1.59
A	goto	1426/0,-542.07,-5586.720
A	trainer	
A	target	Azar Stronghammer
A	xp	<8,1
S	Warrior
T	xprate	<1.59
A	goto	Dun Morogh,47.360,52.646
A	trainer	
A	target	Granis Swiftaxe
A	xp	<8,1
S	Paladin/Warrior/Rogue
T	xprate	<1.59
T	optional	
T	completewith	Blacksmithing1
A	goto	1426,45.695,51.911,20
S	Gnome Warrior
T	xprate	<1.59
A	target	Grawn Thromwyn
A	money	<0.0536
A	goto	Dun Morogh,45.290,52.190
A	collect	2488,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.80
S	Gnome Warrior
T	xprate	<1.59
T	completewith	Tundra
A	use	2488
A	itemcount	2488,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.79
S	Dwarf Warrior
T	xprate	<1.59
A	target	Grawn Thromwyn
A	money	<0.0460
A	goto	Dun Morogh,45.290,52.190
A	collect	2491,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.30
S	Dwarf Warrior
T	xprate	<1.59
T	completewith	Tundra
A	use	2491
A	itemcount	2491,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.29
S	Rogue
T	xprate	<1.59
A	target	Grawn Thromwyn
A	money	<0.0400
A	goto	Dun Morogh,45.290,52.190
A	collect	2494,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Rogue
T	xprate	<1.59
T	completewith	Tundra
A	use	2494
A	itemcount	2494,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.29
S	Paladin
T	xprate	<1.59
A	target	Grawn Thromwyn
A	money	<0.0631
A	goto	Dun Morogh,45.290,52.190
A	collect	2493,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<5.00
S	Paladin
T	xprate	<1.59
T	completewith	Tundra
A	use	2493
A	itemcount	2493,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.99
S	Warrior/Rogue
T	xprate	<1.59
T	optional	
T	completewith	next
A	goto	1426,46.952,52.050,8,0
A	goto	1426,47.153,51.939,8
S	Warrior/Rogue
T	xprate	<1.59
T	completewith	Tundra
A	goto	1426/0,-507.74,-5587.70,20,0
A	goto	1426/0,-531.23,-5601.59
A	vendor	1247 > |cRXP_BUY_Buy as much|r |T133968:0|t[Freshly Baked Bread] |cRXP_BUY_from him as you can afford|r
A	target	Innkeeper Belm
A	money	<0.0125
A	itemcount	4541,<1
A	xp	>10,1
S	Paladin/Warrior/Rogue
T	xprate	<1.59
T	optional	
T	completewith	Tundra
T	label	Chillbreeze
A	goto	1426,41.054,47.492
A	subzone	801
S	Paladin/Warrior/Rogue
T	xprate	<1.59
T	optional	
T	completewith	Tundra
T	requires	Chillbreeze
A	goto	1426,35.942,52.030,15,0
A	goto	1426/0,99.17,-5572.99,20
S	
T	xprate	>1.59 << Paladin/Warrior/Rogue
T	optional	
T	completewith	Tundra
T	label	Chillbreeze
A	goto	1426,35.237,56.815
A	subzone	801
S	
T	xprate	>1.59 << Paladin/Warrior/Rogue
T	optional	
T	completewith	Tundra
T	requires	Chillbreeze
A	goto	1426,36.368,52.354,20,0
A	goto	1426,35.942,52.030,15,0
A	goto	1426/0,99.17,-5572.99,20
S	
T	label	Tundra
A	goto	1426/0,99.17,-5572.99
A	accept	312
A	target	Tundra MacGrann
S	Hunter/Rogue
T	xprate	>1.59 << Rogue
T	season	0,1 << Hunter
A	goto	1426/0,-94.88,-5647.69
A	link	https://www.youtube.com/watch?v=o55Y3LjgKoE
A	complete	312,1
S	Hunter/Rogue
T	xprate	>1.59 << Rogue
T	season	0,1 << Hunter
A	goto	1426/0,99.17,-5572.99
A	turnin	312
A	target	Tundra MacGrann
S	Hunter
T	season	2
A	goto	1426/0,-94.88,-5647.69
A	link	https://www.youtube.com/watch?v=o55Y3LjgKoE
A	complete	312,1
S	Hunter
T	season	2
A	goto	1426/0,99.17,-5572.99
A	turnin	312
A	target	Tundra MacGrann
S	
T	completewith	next
A	goto	1426/0,302.27,-5387.58
A	subzone	137
S	!Mage !Priest
T	completewith	next
A	goto	1426/0,302.27,-5387.58
A	vendor	
A	target	Keeg Gibn
S	Priest/Mage/Warlock
T	completewith	next
A	goto	1426/0,302.27,-5387.58
A	collect	1179,20
A	target	Keeg Gibn
A	isOnQuest	318
S	
T	label	EvershineEnd
A	turnin	318
A	accept	319
A	accept	315
A	goto	Dun Morogh,30.190,45.726
A	target	+Rejold Barleybrew
A	accept	310
A	goto	1426/0,315.42,-5372.02
A	target	+Marleth Barleybrew
S	
T	sticky	
T	label	ForceFavorRibNo
T	loop	
A	goto	1426,31.212,39.189,0
A	goto	1426,27.876,45.549,0
A	goto	1426,29.443,50.102,0
A	goto	1426,31.691,46.837,0
A	waypoint	1426,31.212,39.189,60,0
A	waypoint	1426,30.049,38.561,60,0
A	waypoint	1426,29.198,40.458,60,0
A	waypoint	1426,29.362,42.975,60,0
A	waypoint	1426,28.298,44.441,60,0
A	waypoint	1426,27.876,45.549,60,0
A	waypoint	1426,26.294,46.484,60,0
A	waypoint	1426,27.562,47.657,60,0
A	waypoint	1426,28.020,48.267,60,0
A	waypoint	1426,27.874,49.402,60,0
A	waypoint	1426,29.443,50.102,60,0
A	waypoint	1426,28.412,52.449,60,0
A	waypoint	1426,27.650,53.709,60,0
A	waypoint	1426,26.769,55.778,60,0
A	waypoint	1426,29.294,54.249,60,0
A	waypoint	1426,31.767,49.790,60,0
A	waypoint	1426,33.832,48.153,60,0
A	waypoint	1426,31.691,46.837,60,0
A	complete	319,2
A	mob	+Elder Crag Boar
A	collect	2886,6,384,1
A	mob	+Elder Crag Boar
A	complete	319,1
A	mob	+Ice Claw Bear
A	complete	319,3
A	mob	+Snow Leopard
A	isQuestAvailable	384
S	
T	sticky	
T	label	ForceFavorRibYes
T	loop	
A	goto	1426,31.212,39.189,0
A	goto	1426,27.876,45.549,0
A	goto	1426,29.443,50.102,0
A	goto	1426,31.691,46.837,0
A	waypoint	1426,31.212,39.189,60,0
A	waypoint	1426,30.049,38.561,60,0
A	waypoint	1426,29.198,40.458,60,0
A	waypoint	1426,29.362,42.975,60,0
A	waypoint	1426,28.298,44.441,60,0
A	waypoint	1426,27.876,45.549,60,0
A	waypoint	1426,26.294,46.484,60,0
A	waypoint	1426,27.562,47.657,60,0
A	waypoint	1426,28.020,48.267,60,0
A	waypoint	1426,27.874,49.402,60,0
A	waypoint	1426,29.443,50.102,60,0
A	waypoint	1426,28.412,52.449,60,0
A	waypoint	1426,27.650,53.709,60,0
A	waypoint	1426,26.769,55.778,60,0
A	waypoint	1426,29.294,54.249,60,0
A	waypoint	1426,31.767,49.790,60,0
A	waypoint	1426,33.832,48.153,60,0
A	waypoint	1426,31.691,46.837,60,0
A	complete	319,1
A	mob	+Ice Claw Bear
A	complete	319,2
A	mob	+Elder Crag Boar
A	complete	319,3
A	mob	+Snow Leopard
A	isQuestTurnedIn	384
S	Hunter
T	season	2
T	sticky	
T	label	Marksmanship1
A	goto	1426/0,381.12,-5514.12
A	collect	206155,1
A	mob	Rustling Bush
A	mob	Razormane Poacher
A	train	410113,1
S	Hunter
T	season	2
T	sticky	
T	label	Marksmanship2
T	requires	Marksmanship1
A	cast	402265
A	use	206155
A	train	410113,1
S	Hunter/Mage/Warrior
T	season	2
T	requires	Marksmanship2 << Hunter
T	label	Fyodi1
T	loop	
A	goto	1426,31.87,38.45,0
A	goto	1426,30.42,39.84,0
A	goto	1426,30.02,39.08,0
A	goto	1426,33.82,37.26,0
A	goto	1426,31.87,38.45,50,0
A	goto	1426,30.42,39.84,50,0
A	goto	1426,30.02,39.08,50,0
A	goto	1426,33.82,37.26,50,0
A	collect	206169,1 << Hunter
A	collect	203753,1 << Mage
A	collect	204809,1 << Warrior
A	mob	Fyodi
A	train	410123,1 << Hunter
A	train	401765,1 << Mage
A	train	403476,1 << Warrior
S	Hunter
T	season	2
T	sticky	
T	requires	Fyodi1
T	label	FyodiEnd
A	train	410123
A	use	206169
A	itemcount	206169,1
S	Mage
T	season	2
T	sticky	
T	requires	Fyodi1
T	label	FyodiEnd
A	train	401765
A	use	203753
A	itemcount	203753,1
A	itemcount	211779,1
S	Warrior
T	season	2
T	sticky	
T	requires	Fyodi1
T	label	FyodiEnd
A	train	403476
A	use	204809
A	itemcount	204809,1
S	
T	optional	
T	requires	ForceFavorRibNo
S	
T	optional	
T	requires	ForceFavorRibYes
S	
T	requires	FyodiEnd << Hunter/Mage/Warrior --Season 2
A	goto	1426/0,315.28,-5378.39
A	turnin	319
A	accept	320
A	target	Rejold Barleybrew
S	
T	hardcore	
T	completewith	Distracting
A	goto	1426/0,-531.23,-5601.59
A	subzone	131
S	
T	xprate	<1.5
T	loop	
A	goto	1426,31.212,39.189,0
A	goto	1426,27.876,45.549,0
A	goto	1426,29.443,50.102,0
A	goto	1426,31.691,46.837,0
A	goto	1426,31.212,39.189,60,0
A	goto	1426,30.049,38.561,60,0
A	goto	1426,29.198,40.458,60,0
A	goto	1426,29.362,42.975,60,0
A	goto	1426,28.298,44.441,60,0
A	goto	1426,27.876,45.549,60,0
A	goto	1426,26.294,46.484,60,0
A	goto	1426,27.562,47.657,60,0
A	goto	1426,28.020,48.267,60,0
A	goto	1426,27.874,49.402,60,0
A	goto	1426,29.443,50.102,60,0
A	goto	1426,28.412,52.449,60,0
A	goto	1426,27.650,53.709,60,0
A	goto	1426,26.769,55.778,60,0
A	goto	1426,29.294,54.249,60,0
A	goto	1426,31.767,49.790,60,0
A	goto	1426,33.832,48.153,60,0
A	goto	1426,31.691,46.837,60,0
A	xp	7+3735
A	isQuestAvailable	384
S	
T	xprate	1.49-1.59
T	loop	
A	goto	1426,31.212,39.189,0
A	goto	1426,27.876,45.549,0
A	goto	1426,29.443,50.102,0
A	goto	1426,31.691,46.837,0
A	goto	1426,31.212,39.189,60,0
A	goto	1426,30.049,38.561,60,0
A	goto	1426,29.198,40.458,60,0
A	goto	1426,29.362,42.975,60,0
A	goto	1426,28.298,44.441,60,0
A	goto	1426,27.876,45.549,60,0
A	goto	1426,26.294,46.484,60,0
A	goto	1426,27.562,47.657,60,0
A	goto	1426,28.020,48.267,60,0
A	goto	1426,27.874,49.402,60,0
A	goto	1426,29.443,50.102,60,0
A	goto	1426,28.412,52.449,60,0
A	goto	1426,27.650,53.709,60,0
A	goto	1426,26.769,55.778,60,0
A	goto	1426,29.294,54.249,60,0
A	goto	1426,31.767,49.790,60,0
A	goto	1426,33.832,48.153,60,0
A	goto	1426,31.691,46.837,60,0
A	xp	7+3355
A	isQuestAvailable	384
S	Rogue/Hunter
T	xprate	>1.59
T	loop	
A	goto	1426,31.212,39.189,0
A	goto	1426,27.876,45.549,0
A	goto	1426,29.443,50.102,0
A	goto	1426,31.691,46.837,0
A	goto	1426,31.212,39.189,60,0
A	goto	1426,30.049,38.561,60,0
A	goto	1426,29.198,40.458,60,0
A	goto	1426,29.362,42.975,60,0
A	goto	1426,28.298,44.441,60,0
A	goto	1426,27.876,45.549,60,0
A	goto	1426,26.294,46.484,60,0
A	goto	1426,27.562,47.657,60,0
A	goto	1426,28.020,48.267,60,0
A	goto	1426,27.874,49.402,60,0
A	goto	1426,29.443,50.102,60,0
A	goto	1426,28.412,52.449,60,0
A	goto	1426,27.650,53.709,60,0
A	goto	1426,26.769,55.778,60,0
A	goto	1426,29.294,54.249,60,0
A	goto	1426,31.767,49.790,60,0
A	goto	1426,33.832,48.153,60,0
A	goto	1426,31.691,46.837,60,0
A	xp	9+6110
A	isQuestAvailable	384
S	
T	xprate	<1.5
T	loop	
A	goto	1426,31.212,39.189,0
A	goto	1426,27.876,45.549,0
A	goto	1426,29.443,50.102,0
A	goto	1426,31.691,46.837,0
A	goto	1426,31.212,39.189,60,0
A	goto	1426,30.049,38.561,60,0
A	goto	1426,29.198,40.458,60,0
A	goto	1426,29.362,42.975,60,0
A	goto	1426,28.298,44.441,60,0
A	goto	1426,27.876,45.549,60,0
A	goto	1426,26.294,46.484,60,0
A	goto	1426,27.562,47.657,60,0
A	goto	1426,28.020,48.267,60,0
A	goto	1426,27.874,49.402,60,0
A	goto	1426,29.443,50.102,60,0
A	goto	1426,28.412,52.449,60,0
A	goto	1426,27.650,53.709,60,0
A	goto	1426,26.769,55.778,60,0
A	goto	1426,29.294,54.249,60,0
A	goto	1426,31.767,49.790,60,0
A	goto	1426,33.832,48.153,60,0
A	goto	1426,31.691,46.837,60,0
A	xp	7+4360
A	isQuestTurnedIn	384
S	
T	xprate	1.49-1.59
T	loop	
A	goto	1426,31.212,39.189,0
A	goto	1426,27.876,45.549,0
A	goto	1426,29.443,50.102,0
A	goto	1426,31.691,46.837,0
A	goto	1426,31.212,39.189,60,0
A	goto	1426,30.049,38.561,60,0
A	goto	1426,29.198,40.458,60,0
A	goto	1426,29.362,42.975,60,0
A	goto	1426,28.298,44.441,60,0
A	goto	1426,27.876,45.549,60,0
A	goto	1426,26.294,46.484,60,0
A	goto	1426,27.562,47.657,60,0
A	goto	1426,28.020,48.267,60,0
A	goto	1426,27.874,49.402,60,0
A	goto	1426,29.443,50.102,60,0
A	goto	1426,28.412,52.449,60,0
A	goto	1426,27.650,53.709,60,0
A	goto	1426,26.769,55.778,60,0
A	goto	1426,29.294,54.249,60,0
A	goto	1426,31.767,49.790,60,0
A	goto	1426,33.832,48.153,60,0
A	goto	1426,31.691,46.837,60,0
A	xp	7+4290
A	isQuestTurnedIn	384
S	Rogue/Hunter
T	xprate	>1.59
T	loop	
A	goto	1426,31.212,39.189,0
A	goto	1426,27.876,45.549,0
A	goto	1426,29.443,50.102,0
A	goto	1426,31.691,46.837,0
A	goto	1426,31.212,39.189,60,0
A	goto	1426,30.049,38.561,60,0
A	goto	1426,29.198,40.458,60,0
A	goto	1426,29.362,42.975,60,0
A	goto	1426,28.298,44.441,60,0
A	goto	1426,27.876,45.549,60,0
A	goto	1426,26.294,46.484,60,0
A	goto	1426,27.562,47.657,60,0
A	goto	1426,28.020,48.267,60,0
A	goto	1426,27.874,49.402,60,0
A	goto	1426,29.443,50.102,60,0
A	goto	1426,28.412,52.449,60,0
A	goto	1426,27.650,53.709,60,0
A	goto	1426,26.769,55.778,60,0
A	goto	1426,29.294,54.249,60,0
A	goto	1426,31.767,49.790,60,0
A	goto	1426,33.832,48.153,60,0
A	goto	1426,31.691,46.837,60,0
A	xp	9+7320
A	isQuestTurnedIn	384
S	
T	softcore	
T	label	WetlandsDS1
T	completewith	next
A	goto	1426,30.741,34.269,15,0
A	goto	1426,30.812,33.548,15,0
A	goto	1426,31.060,32.543,15,0
A	goto	1426,31.439,32.356,15,0
A	goto	1426,31.675,29.636,15,0
A	goto	1426,32.209,28.777,15,0
A	goto	1426,32.645,27.740,15,0
A	goto	1415,44.910,52.022,15,0
A	goto	1415,44.910,52.030
A	zone	Wetlands
A	isQuestAvailable	983
S	
T	softcore	
T	requires	WetlandsDS1
T	label	WetlandsDS2
A	goto	1415,44.733,51.882,-1
A	goto	1437,11.730,43.304,-1
A	deathskip	
A	isQuestAvailable	983
A	target	Spirit Healer
S	
T	softcore	
T	optional	
T	requires	WetlandsDS2
T	completewith	next
A	goto	1437/0,-883.77,-3532.66,60
A	subzoneskip	150
S	
T	softcore	
A	goto	Wetlands,9.490,59.693
A	fp	Wetlands
A	target	Shellei Brondir
S	
T	softcore	
T	completewith	Distracting
A	hs	
A	subzoneskip	131
S	
T	optional	
A	goto	1426/0,-531.23,-5601.59
A	complete	384,2
A	collect	2686,1,311
A	target	Innkeeper Belm
A	isQuestAvailable	384
S	
A	goto	1426/0,-531.23,-5601.59
A	collect	2686,1,311
A	target	Innkeeper Belm
A	isQuestTurnedIn	384
S	
T	label	Distracting
T	completewith	next
A	goto	1426/0,-551.03,-5598.40,6,0
A	goto	1426/0,-544.38,-5605.92,3,0
A	turnin	308
A	target	Jarven Thunderbrew
S	
A	goto	1426/0,-547.93,-5607.27
A	turnin	310
A	accept	311
S	
A	goto	1426/0,-504.05,-5596.27
A	turnin	384
A	target	Ragnar Thunderbrew
S	Hunter
T	xprate	<1.59
A	goto	Dun Morogh,45.810,53.039
A	trainer	
A	target	Grif Wildheart
S	Hunter
T	xprate	>1.59
A	goto	Dun Morogh,45.810,53.039
A	trainer	
A	accept	6064
A	target	Grif Wildheart
S	Dwarf Hunter
T	xprate	>1.59
A	goto	1426/0,-576.69,-5745.30
A	complete	6064,1
A	mob	Large Crag Boar
S	Dwarf Hunter
T	xprate	>1.59
A	goto	Dun Morogh,45.810,53.039
A	turnin	6064
A	accept	6084
A	target	Grif Wildheart
S	Dwarf Hunter
T	xprate	>1.59
A	goto	1426/0,-630.87,-5827.38
A	complete	6084,1
A	mob	Snow Leopard
S	Dwarf Hunter
T	xprate	>1.59
A	goto	Dun Morogh,45.810,53.039
A	turnin	6084
A	accept	6085
A	target	Grif Wildheart
S	Dwarf Hunter
T	xprate	>1.59
A	goto	1426/0,-680.12,-5837.23
A	complete	6085,1
A	mob	Ice Claw Bear
S	Dwarf Hunter
T	xprate	>1.59
A	goto	Dun Morogh,45.810,53.039
A	turnin	6085
A	accept	6086
A	target	Grif Wildheart
S	Warlock
A	goto	1426/0,-528.77,-5640.00
A	trainer	
A	target	Gimrizz Shadowcog
S	Warlock
A	goto	1426/0,-526.11,-5638.85
A	vendor	6328
A	target	Gimrizz Shadowcog
A	money	<0.100
S	Rogue
T	xprate	>1.59
A	goto	1426/0,-540.39,-5604.38
A	train	674
A	train	2983
A	accept	2218
A	target	Hogral Bakkan
S	Rogue
T	xprate	<1.59
A	goto	1426/0,-540.39,-5604.38
A	trainer	
A	target	Hogral Bakkan
S	Paladin
A	goto	1426/0,-542.07,-5586.720
A	trainer	
A	target	Azar Stronghammer
S	Warrior
A	goto	Dun Morogh,47.360,52.646
A	trainer	
A	target	Granis Swiftaxe
S	Mage
A	goto	1426/0,-537.19,-5586.91
A	train	118
A	target	Magis Sparkmantle
S	Priest
A	goto	1426/0,-529.51,-5590.660
A	trainer	
A	target	Maxan Anvol
S	Warrior/Rogue/Paladin
A	goto	Dun Morogh,47.180,52.610
A	train	3273
A	target	Thamner Pol
A	money	<0.01
S	Gnome Warrior
A	target	Grawn Thromwyn
A	money	<0.0536
A	goto	Dun Morogh,45.290,52.190
A	collect	2488,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.80
S	Gnome Warrior
T	completewith	next
A	use	2488
A	itemcount	2488,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.79
S	Dwarf Warrior
A	target	Grawn Thromwyn
A	money	<0.0460
A	goto	Dun Morogh,45.290,52.190
A	collect	2491,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.30
S	Dwarf Warrior
T	completewith	next
A	use	2491
A	itemcount	2491,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.29
S	Rogue
T	xprate	<1.59
A	target	Grawn Thromwyn
A	money	<0.0400
A	goto	Dun Morogh,45.290,52.190
A	collect	2494,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Rogue
T	xprate	<1.59
T	completewith	next
A	use	2494
A	itemcount	2494,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.29
S	Paladin
A	target	Grawn Thromwyn
A	money	<0.0631
A	goto	Dun Morogh,45.290,52.190
A	collect	2493,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<5.00
S	Paladin
T	completewith	next
A	use	2493
A	itemcount	2493,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.99
S	Warrior/Rogue/Paladin
A	goto	1426/0,-531.23,-5601.59
A	vendor	1247
A	vendor	1247
A	money	<0.0125 << Paladin
A	target	Innkeeper Belm
S	Priest/Mage/Warlock
A	goto	1426/0,-531.23,-5601.59
A	vendor	1247
A	target	Innkeeper Belm
S	
A	goto	1426/0,-499.17,-5644.37
A	accept	287
A	target	Senir Whitebeard
S	!Rogue !Warrior !Paladin
T	xprate	<1.5
A	goto	1426/0,-641.80,-5473.18
A	turnin	313
A	target	Pilot Stonegear
S	
T	xprate	<1.49 << Rogue
A	goto	1426/0,-632.15,-5466.540
A	turnin	320
A	turnin	320,3
A	target	Pilot Bellowfiz
S	Rogue
T	xprate	>1.49
A	goto	1426/0,-632.15,-5466.540
A	turnin	320,3
A	target	Pilot Bellowfiz
S	Rogue
T	xprate	>1.49
T	completewith	ShimmerweedCollect
A	use	2494
A	itemcount	2494,1
A	itemStat	17,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.2
S	Gnome Rogue/Dwarf Rogue
T	xprate	>1.59
T	optional	
T	completewith	next
A	goto	1426,47.861,41.827,30,0
A	goto	1426,51.373,39.595,30,0
A	goto	1426,52.013,36.589,30,0
A	goto	1455,18.428,82.995,60
A	zoneskip	Ironforge
S	Gnome Rogue/Dwarf Rogue
T	xprate	>1.59
T	completewith	next
T	label	EnterIFRogue
A	goto	1455,18.428,82.995
A	zone	Ironforge
S	Gnome Rogue/Dwarf Rogue
T	xprate	>1.59
T	optional	
T	completewith	next
T	requires	EnterIFRogue
A	goto	1455,22.283,79.620,30,0
A	goto	1455,27.315,82.828,30,0
A	goto	1455,38.913,71.447,30,0
A	goto	1455,46.624,53.683,30,0
A	goto	1455,60.781,25.800,30,0
A	goto	1455,59.236,14.974,30,0
A	goto	1455,52.941,12.466,12,0
A	goto	1455,51.919,14.468,12,0
A	goto	1455,51.438,16.000,10
S	Gnome Rogue/Dwarf Rogue
T	xprate	>1.59
A	goto	1455/0,-1124.38,-4647.53
A	turnin	2218
A	accept	2238
A	target	Hulfdan Blackbeard
S	
T	xprate	<1.5
A	goto	1426/0,-463.66,-5474.00,10,0
A	goto	1426/0,-455.83,-5497.90
A	accept	412
A	target	Razzle Sprysprocket
S	
T	completewith	ShimmerweedCollect
T	optional	
T	label	RidgeRamp
A	goto	1426,42.935,45.216,20,0
A	goto	1426,42.254,45.301,15
S	
T	optional	
T	requires	RidgeRamp
T	completewith	ShimmerweedCollect
A	complete	287,1
A	mob	Frostmane Headhunter
S	
T	label	ShimmerweedCollect
A	goto	1426/0,-212.24,-5364.43,50,0
A	goto	1426/0,-241.79,-5308.62,50,0
A	goto	1426/0,-153.14,-5190.42,50,0
A	goto	1426/0,-271.34,-5003.27,50,0
A	goto	1426/0,-153.14,-5190.42,50,0
A	goto	1426/0,-241.79,-5308.62,50,0
A	goto	1426/0,-212.24,-5364.43
A	goto	1426/0,-143.29,-5288.92,0
A	goto	1426/0,-241.79,-5059.08,0
A	complete	315,1
A	mob	Frostmane Seer
S	Priest
T	season	2
A	goto	1426/0,-212.24,-5364.43,50,0
A	goto	1426/0,-241.79,-5308.62,50,0
A	goto	1426/0,-153.14,-5190.42,50,0
A	goto	1426/0,-271.34,-5003.27,50,0
A	goto	1426/0,-153.14,-5190.42,50,0
A	goto	1426/0,-241.79,-5308.62,50,0
A	goto	1426/0,-212.24,-5364.43
A	goto	1426/0,-143.29,-5288.92,0
A	goto	1426/0,-241.79,-5059.08,0
A	collect	205947,1
A	mob	Frostmane Seer
A	train	402852,1
S	Priest
T	season	2
A	train	402852
A	use	205947
A	itemcount	205947,1
S	Mage
T	season	2
A	goto	1426/0,-212.24,-5364.43,50,0
A	goto	1426/0,-241.79,-5308.62,50,0
A	goto	1426/0,-153.14,-5190.42,50,0
A	goto	1426/0,-271.34,-5003.27,50,0
A	goto	1426/0,-153.14,-5190.42,50,0
A	goto	1426/0,-241.79,-5308.62,50,0
A	goto	1426/0,-212.24,-5364.43
A	goto	1426/0,-143.29,-5288.92,0
A	goto	1426/0,-241.79,-5059.08,0
A	collect	203752,1
A	mob	Frostmane Seer
A	train	401768,1
S	Mage
T	season	2
A	collect	211779,1
A	train	401768
A	use	203752
S	Rogue
T	season	2
A	goto	1426/0,551.13,-5545.02
A	collect	208213,1
A	mob	Frostmane Seer
A	mob	Frostmane Headhunter
A	mob	Frostmane Snowstrider
A	train	398196,1
S	Warrior
T	season	2
A	collect	208159,1
A	goto	1426/0,-246.72,-5315.18,60,0
A	goto	1426/0,-276.27,-5026.25
A	mob	Frostmane Headhunter
A	mob	Frostmane Snowstrider
A	mob	Frostmane Seer
A	train	403475,1
S	Hunter
T	season	2
T	requires	pigmeat
A	train	425762,1
A	goto	1426/0,-58.58,-5274.14
A	collect	205979,1
A	use	208192
A	mob	Jorul
S	Hunter
T	season	2
A	train	425762
A	use	205979
A	itemcount	205979,1
S	!Mage !Warlock
T	season	0,1 << Hunter/Rogue
T	xprate	<1.59 << Hunter/Rogue
A	goto	1426/0,-94.88,-5647.69
A	link	https://www.youtube.com/watch?v=o55Y3LjgKoE
A	complete	312,1
S	Mage/Warlock
A	goto	1426/0,-94.88,-5647.69
A	complete	312,1
S	
T	season	0,1 << Hunter/Rogue
T	xprate	<1.59 << Hunter/Rogue
A	goto	1426/0,99.17,-5572.99
A	turnin	312
A	target	Tundra MacGrann
S	Mage/Priest/Warlock
T	completewith	next
A	goto	1426/0,302.27,-5387.58
A	vendor	
A	target	Keeg Gibn
S	Warrior/Paladin/Rogue
T	completewith	next
A	goto	1426/0,302.27,-5387.58
A	vendor	
A	target	Keeg Gibn
S	
A	turnin	315
A	accept	413
A	goto	1426/0,315.28,-5378.39
A	target	+Rejold Barleybrew
A	turnin	311
A	goto	1426/0,315.42,-5372.02
A	target	+Marleth Barleybrew
S	Rogue
T	season	2
T	completewith	next
A	collect	208218,1
A	mob	Leper Gnome
A	train	398196,1
S	Priest
T	season	2
A	collect	205940,1
A	mob	Leper Gnome
A	train	425216,1
S	Dwarf Rogue/Gnome Rogue
T	xprate	>1.59
A	goto	1426/0,562.76,-5336.850
A	turnin	2238
A	accept	2239
A	target	Onin MacHammar
S	
T	xprate	<1.5
T	loop	
A	goto	1426,26.653,43.844,0
A	goto	1426,24.601,40.790,0
A	goto	1426,25.540,45.374,0
A	goto	1426,26.653,43.844,55,0
A	goto	1426,26.587,42.702,55,0
A	goto	1426,26.175,41.822,55,0
A	goto	1426,26.052,40.769,55,0
A	goto	1426,24.739,39.481,55,0
A	goto	1426,24.601,40.790,55,0
A	goto	1426,24.662,41.770,55,0
A	goto	1426,24.487,43.265,55,0
A	goto	1426,24.805,43.848,55,0
A	goto	1426,24.871,44.693,55,0
A	goto	1426,25.540,45.374,55,0
A	goto	1426,25.950,43.930,55,0
A	complete	412,2
A	complete	412,1
A	mob	Leper Gnome
S	Priest
T	season	2
T	loop	
A	goto	1426,26.653,43.844,0
A	goto	1426,24.601,40.790,0
A	goto	1426,25.540,45.374,0
A	goto	1426,26.653,43.844,55,0
A	goto	1426,26.587,42.702,55,0
A	goto	1426,26.175,41.822,55,0
A	goto	1426,26.052,40.769,55,0
A	goto	1426,24.739,39.481,55,0
A	goto	1426,24.601,40.790,55,0
A	goto	1426,24.662,41.770,55,0
A	goto	1426,24.487,43.265,55,0
A	goto	1426,24.805,43.848,55,0
A	goto	1426,24.871,44.693,55,0
A	goto	1426,25.540,45.374,55,0
A	goto	1426,25.950,43.930,55,0
A	collect	205940,1
A	mob	Leper Gnome
A	train	425216,1
S	Priest
T	season	2
A	train	425216
A	use	205940
S	Rogue
T	season	2
T	loop	
A	goto	1426,26.653,43.844,0
A	goto	1426,24.601,40.790,0
A	goto	1426,25.540,45.374,0
A	goto	1426,26.653,43.844,55,0
A	goto	1426,26.587,42.702,55,0
A	goto	1426,26.175,41.822,55,0
A	goto	1426,26.052,40.769,55,0
A	goto	1426,24.739,39.481,55,0
A	goto	1426,24.601,40.790,55,0
A	goto	1426,24.662,41.770,55,0
A	goto	1426,24.487,43.265,55,0
A	goto	1426,24.805,43.848,55,0
A	goto	1426,24.871,44.693,55,0
A	goto	1426,25.540,45.374,55,0
A	goto	1426,25.950,43.930,55,0
A	collect	208218,1
A	mob	Leper Gnome
A	train	398196,1
S	
T	sticky	
T	label	Headhunters
T	loop	
A	goto	1426,22.390,51.701,0
A	goto	1426,23.136,50.886,0
A	goto	1426,24.301,50.898,0
A	waypoint	1426,22.390,51.701,30,0
A	waypoint	1426,21.113,51.717,30,0
A	waypoint	1426,21.131,51.024,30,0
A	waypoint	1426,22.067,50.215,30,0
A	waypoint	1426,23.136,50.886,30,0
A	waypoint	1426,23.373,51.385,30,0
A	waypoint	1426,23.568,50.924,30,0
A	waypoint	1426,24.301,50.898,30,0
A	complete	287,1
A	mob	Frostmane Headhunter
S	
T	optional	
A	goto	1426,24.975,50.473,20,0
A	goto	1426,24.682,50.836,20
A	isOnQuest	287
S	Hunter
T	xprate	1.49-1.59
T	loop	
A	goto	1426,22.390,51.701,0
A	goto	1426,23.136,50.886,0
A	goto	1426,24.301,50.898,0
A	goto	1426,22.390,51.701,30,0
A	goto	1426,21.113,51.717,30,0
A	goto	1426,21.131,51.024,30,0
A	goto	1426,22.067,50.215,30,0
A	goto	1426,23.136,50.886,30,0
A	goto	1426,23.373,51.385,30,0
A	goto	1426,23.568,50.924,30,0
A	goto	1426,24.301,50.898,30,0
A	xp	9+4280
S	
T	hardcore	
T	requires	Headhunters
A	goto	1426/0,676.23,-5589.67
A	link	https://youtu.be/70PX093soq4?si=YcTdPoKW-EplWQAn&t=3019
A	complete	287,2
S	
T	softcore	
T	requires	Headhunters
A	goto	1426/0,676.23,-5589.67
A	complete	287,2
S	
T	softcore	
T	optional	
T	completewith	next
A	deathskip	
A	target	Spirit Healer
S	
T	hardcore	
T	completewith	next
A	hs	
S	
A	goto	1426/0,-499.17,-5644.37
A	turnin	287
A	accept	291
A	target	Senir Whitebeard
S	Hunter
T	xprate	1.49-1.59
A	goto	Dun Morogh,45.810,53.039
A	accept	6064
A	target	Grif Wildheart
S	Hunter
T	xprate	1.49-1.59
A	goto	1426/0,-576.69,-5745.30
A	complete	6064,1
A	mob	Large Crag Boar
S	Hunter
T	xprate	1.49-1.59
A	goto	Dun Morogh,45.810,53.039
A	turnin	6064
A	accept	6084
A	target	Grif Wildheart
S	Hunter
T	xprate	1.49-1.59
A	goto	1426/0,-630.87,-5827.38
A	complete	6084,1
A	mob	Snow Leopard
S	Hunter
T	xprate	1.49-1.59
A	goto	Dun Morogh,45.810,53.039
A	turnin	6084
A	accept	6085
A	target	Grif Wildheart
S	Hunter
T	xprate	1.49-1.59
A	goto	1426/0,-680.12,-5837.23
A	complete	6085,1
A	mob	Ice Claw Bear
S	Hunter
T	xprate	1.49-1.59
A	goto	Dun Morogh,45.810,53.039
A	turnin	6085
A	accept	6086
A	target	Grif Wildheart
S	Rogue
T	xprate	<1.59
A	goto	1426/0,-540.39,-5604.38
A	accept	2218
A	target	Hogral Bakkan
A	xp	<10,1
S	!Warrior !Rogue !Paladin
A	goto	Dun Morogh,47.180,52.610
A	train	3273
A	target	Thamner Pol
S	
T	xprate	<1.5
A	goto	1426/0,-463.66,-5474.00,8,0
A	goto	1426/0,-455.83,-5497.90
A	turnin	412
A	target	Razzle Sprysprocket
S	Warrior
T	optional	
T	completewith	next
A	money	>0.1030
S	Warrior
A	goto	1426/0,-541.23,-5242.29,40,0
A	goto	1426/0,-669.77,-5216.35,20,0
A	goto	1455/0,-831.39,-5028.78,40
S	Warrior
A	goto	1455/0,-1205.65,-5042.12
A	trainer	
A	target	Bixi Wobblebonk
A	target	Buliwyf Stonehand
S	Warrior
A	goto	1455,62.378,88.671
A	collect	3107,200
A	target	Brenwyn Wintersteel
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.3
A	xp	<11,1
S	Warrior
A	goto	1455,62.378,88.671
A	collect	2946,200
A	target	Brenwyn Wintersteel
A	xp	>11,1
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.0
S	Warrior
T	optional	
T	completewith	Dirt
A	use	3107
A	itemcount	3107,1
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.3
A	xp	<11,1
S	Warrior
T	optional	
T	completewith	Dirt
A	use	2946
A	itemcount	2946,1
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.0
S	skip --logout skip << Warrior
T	optional	
A	goto	1455,48.046,83.707
A	zone	Dun Morogh
A	zoneskip	Ironforge,1
S	
T	optional	
T	label	BoarMeatDunMorogh1
T	completewith	Dirt
A	goto	1426,57.936,50.787,0
A	collect	769,10,2178,1,0x20,cooking
A	mob	Elder Crag Boar
A	skill	cooking,10,1
S	
T	optional	
T	requires	BoarMeatDunMorogh1
T	completewith	Dirt
A	goto	1426,57.936,50.787,0
A	collect	769,50,2178,1,0x20,cooking
A	mob	Elder Crag Boar
A	skill	cooking,50,1
S	
T	completewith	Rudra
T	label	Dirt
A	goto	1426/0,-1145.04,-5504.30,40,0
A	goto	1426/0,-1219.90,-5422.55,40
A	isQuestAvailable	314
S	
T	completewith	next
T	requires	Dirt
A	link	https://youtu.be/70PX093soq4?si=-cIoU8WWdbC0IdHZ&t=3193
A	link	https://www.youtube.com/watch?v=ZJX6sCkm5JY
A	mob	Vagash
S	
T	label	Rudra
A	goto	1426/0,-1304.71,-5513.86
A	accept	314
A	target	Rudra Amberstill
S	Warrior/Mage
T	season	2
T	sticky	
T	optional	
T	label	rune1
A	collect	204809,1 << Warrior
A	collect	203753,1 << Mage
A	train	403476,1 << Warrior
A	train	401765,1 << Mage
S	
A	goto	1426,62.094,47.154,40,0
A	goto	1426,62.434,48.989,40,0
A	goto	1426,62.538,46.195
A	link	https://youtu.be/70PX093soq4?si=-cIoU8WWdbC0IdHZ&t=3193
A	link	https://www.youtube.com/watch?v=ZJX6sCkm5JY
A	complete	314,1
A	mob	Vagash
S	Warrior
T	season	2
T	optional	
T	requires	rune1
A	train	403476
A	use	204809
A	itemcount	204809,1
S	Mage
T	optional	
T	season	2
T	requires	rune1
T	completewith	GolBolarQuarry
A	collect	211779,1
A	disablecheckbox	
A	train	401765
A	use	203753
S	
A	goto	1426/0,-1304.71,-5513.86
A	turnin	314
A	target	Rudra Amberstill
S	
T	optional	
T	label	BoarMeatDunMorogh2
T	completewith	QuarryStart
A	goto	1426,66.356,51.02,0
A	collect	769,10,2178,1,0x20,cooking
A	mob	Large Crag Boar
A	skill	cooking,10,1
A	subzoneskip	134
S	
T	optional	
T	requires	BoarMeatDunMorogh2
T	completewith	QuarryStart
A	goto	1426,66.356,51.02,0
A	collect	769,50,2178,1,0x20,cooking
A	mob	Large Crag Boar
A	skill	cooking,50,1
A	subzoneskip	134
S	
T	optional	
T	completewith	next
A	goto	1426/0,-1565.58,-5666.24,60
A	subzoneskip	134
S	
A	goto	1426/0,-1565.58,-5666.24
A	train	2550
A	target	Cook Ghilm
S	!Hunter
T	optional	
T	completewith	next
A	goto	1426/0,-1576.47,-5673.07
A	vendor	1237
A	vendor	1237
A	target	Kazan Mogosh
S	
T	label	QuarryStart
A	accept	433
A	target	+Senator Mehr Stonehallow
A	goto	1426/0,-1579.96,-5714.73
A	accept	432
A	goto	1426/0,-1600.30,-5726.590
A	target	+Foreman Stonebrow
S	Dwarf Paladin
T	xprate	>1.49
T	sticky	
T	label	PalaCloth
T	loop	
A	goto	1426,70.073,57.030,0
A	goto	1426,68.533,58.372,0
A	goto	1426,68.958,59.357,0
A	goto	1426,70.750,56.219,0
A	goto	1426,71.344,51.873,0
A	goto	1426,72.570,53.488,0
A	waypoint	1426,70.073,57.030,45,0
A	waypoint	1426,69.223,58.242,45,0
A	waypoint	1426,68.533,58.372,45,0
A	waypoint	1426,67.687,60.059,45,0
A	waypoint	1426,68.958,59.357,45,0
A	waypoint	1426,70.475,59.420,45,0
A	collect	2589,10,1648,1
A	mob	Rockjaw Skullthumper
A	mob	Rockjaw Bonesnapper
S	
T	sticky	
T	label	Skullthumpers
T	loop	
A	goto	1426,70.073,57.030,0
A	goto	1426,68.533,58.372,0
A	goto	1426,68.958,59.357,0
A	waypoint	1426,70.073,57.030,45,0
A	waypoint	1426,69.223,58.242,45,0
A	waypoint	1426,68.533,58.372,45,0
A	waypoint	1426,67.687,60.059,45,0
A	waypoint	1426,68.958,59.357,45,0
A	waypoint	1426,70.475,59.420,45,0
A	complete	432,1
A	mob	Rockjaw Skullthumper
S	
T	optional	
T	completewith	next
A	goto	1426,70.750,56.219,20
A	isOnQuest	433
S	
T	loop	
A	goto	1426,70.750,56.219,0
A	goto	1426,71.344,51.873,0
A	goto	1426,72.570,53.488,0
A	goto	1426,70.750,56.219,30,0
A	goto	1426,70.964,54.538,30,0
A	goto	1426,70.679,53.301,30,0
A	goto	1426,70.461,52.292,30,0
A	goto	1426,71.344,51.873,30,0
A	goto	1426,71.999,50.204,30,0
A	goto	1426,72.456,51.300,30,0
A	goto	1426,72.613,52.509,30,0
A	goto	1426,72.570,53.488,30,0
A	goto	1426,71.790,52.278,30,0
A	goto	1426,71.591,51.831,30,0
A	complete	433,1
A	mob	Rockjaw Bonesnapper
S	
T	optional	
T	label	RockjawEnd
T	requires	Skullthumpers
S	
T	requires	PalaCloth << Paladin -->1.49 or higher
A	turnin	432
A	target	+Senator Mehr Stonehallow
A	goto	1426/0,-1600.30,-5726.590
A	turnin	433
A	goto	1426/0,-1579.96,-5714.73
A	target	+Foreman Stonebrow
S	
T	optional	
T	loop	
A	goto	1426,70.073,57.030,0
A	goto	1426,68.533,58.372,0
A	goto	1426,68.958,59.357,0
A	goto	1426,70.073,57.030,45,0
A	goto	1426,69.223,58.242,45,0
A	goto	1426,68.533,58.372,45,0
A	goto	1426,67.687,60.059,45,0
A	goto	1426,68.958,59.357,45,0
A	goto	1426,70.475,59.420,45,0
A	xp	10
A	mob	Rockjaw Skullthumper
S	Rogue
T	season	2
A	goto	1426/0,-2032.52,-5901.59
A	collect	208205,1
A	collect	208219,1
A	mob	Dark Iron Spy
A	train	400094,1
A	train	398196,1
S	Rogue
T	season	2
T	optional	
A	goto	1426/0,-2032.52,-5901.59
A	collect	208205,1
A	mob	Dark Iron Spy
A	train	400094,1
S	Rogue
T	season	2
T	optional	
A	goto	1426/0,-2032.52,-5901.59
A	collect	208219,1
A	mob	Dark Iron Spy
A	train	398196,1
S	Rogue
T	season	2
A	cast	418600
A	collect	208220,1
A	itemcount	208219,1
A	itemcount	208213,1
A	itemcount	208215,1
A	itemcount	208218,1
A	use	208219
A	use	208213
A	use	208215
A	use	208218
A	train	398196,1
S	Warrior/Rogue
T	season	2
T	softcore	
T	optional	
T	completewith	next
A	deathskip	
A	target	Spirit Healer
A	train	403475,1 << Warrior
A	train	398196,1 << Rogue
S	Warrior
T	season	2
A	goto	1426/0,-493.51,-5628.25
A	train	403475
A	use	204703
A	skipgossip	
A	target	Junni Steelpass
S	Rogue
T	season	2
T	completewith	next
A	goto	1426/0,-511.93,-5309.67
A	cast	418599
A	use	208220
A	itemcount	208220,1
A	train	398196,1
S	Rogue
T	season	2
A	collect	203991,1
A	train	398196,1
S	Rogue
T	season	2
A	train	400095
A	use	203991
A	itemcount	203991,1
S	Rogue
T	season	2
A	goto	1426/0,-1017.77,-5362.04
A	collect	203990,1
A	skipgossip	
A	train	400094,1
S	Rogue
T	season	2
A	cast	402265
A	use	203990
A	train	400094,1
S	
T	optional	
T	label	BoarMeatDunMorogh3
T	completewith	LochEnter
A	goto	1426,70.845,51.784,0
A	goto	1426,73.533,50.850,0
A	goto	1426,75.353,48.533,0
A	goto	1426,79.881,46.805,0
A	goto	1426,81.040,43.456,0
A	goto	1426,80.583,36.040,0
A	collect	769,10,2178,1,0x20,cooking
A	mob	Scarred Crag Boar
A	mob	Elder Crag Boar
A	skill	cooking,10,1
S	
T	optional	
T	requires	BoarMeatDunMorogh3
T	completewith	LochEnter
A	goto	1426,70.845,51.784,0
A	goto	1426,73.533,50.850,0
A	goto	1426,75.353,48.533,0
A	goto	1426,79.881,46.805,0
A	goto	1426,81.040,43.456,0
A	goto	1426,80.583,36.040,0
A	collect	769,50,2178,1,0x20,cooking
A	mob	Scarred Crag Boar
A	mob	Elder Crag Boar
A	skill	cooking,50,1
S	
T	optional	
T	completewith	next
A	goto	1426,77.189,48.816,50,0
A	goto	1426,81.252,42.650,50,0
A	goto	1426/0,-2329.60,-5163.76,20
S	
A	goto	1426/0,-2329.60,-5163.76
A	accept	419
A	target	Pilot Hammerfoot
S	
A	goto	1426/0,-2121.76,-5064.70
A	turnin	419
A	accept	417
S	Warrior/Mage
T	season	2
T	optional	
T	completewith	next
A	collect	204809,1 << Warrior
A	collect	203753,1 << Mage
A	train	403476,1 << Warrior
A	train	401765,1 << Mage
S	
A	goto	1426/0,-2087.19,-5096.51
A	complete	417,1
A	mob	Mangeclaw
S	Warrior
T	season	2
A	train	403476
A	use	204809
A	itemcount	204809,1
S	Mage
T	season	2
T	completewith	next
A	collect	211779,1
A	disablecheckbox	
A	train	401765
A	use	203753
S	
T	xprate	<1.49 << Rogue
A	goto	1426/0,-2329.60,-5163.76
A	turnin	417
A	turnin	417,1
A	target	Pilot Hammerfoot
S	Rogue
T	xprate	>1.49
A	goto	1426/0,-2329.60,-5163.76
A	turnin	417,1
A	target	Pilot Hammerfoot
S	Rogue
T	xprate	>1.49
T	completewith	ShimmerStoutEnd
A	use	2218
A	itemcount	2218,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.7
S	
T	optional	
T	completewith	next
A	goto	1426,82.988,40.387,40,0
A	goto	1426,81.220,42.798,40,0
A	goto	1426,79.556,50.096,30,0
A	goto	1426/0,-2447.11,-5479.74,20
S	
T	label	ShimmerStoutEnd
A	goto	1426/0,-2447.11,-5479.74
A	turnin	413
A	accept	414
A	target	Mountaineer Barleybrew
S	
T	optional	
T	label	LochEnter
T	completewith	next
A	goto	1432,16.494,58.424,20,0
A	goto	1432,19.594,62.735,20,0
A	goto	1432,20.749,64.326,20,0
A	goto	1432,21.106,65.007,20,0
A	goto	1432,21.388,66.357,20,0
A	goto	1432,21.498,67.840
A	subzone	924
S	
A	goto	1432/0,-2602.54,-5832.73
A	accept	224
A	target	Mountaineer Cobbleflint
A	xp	>14,1 << !Warrior !Dwarf/!Paladin
S	
T	optional	
T	completewith	next
A	goto	1432/0,-2635.61,-5879.14,12,0
A	goto	1432/0,-2645.27,-5874.91,12,0
A	goto	1432/0,-2631.48,-5847.50,12
S	
A	goto	1432/0,-2634.59,-5842.81
A	accept	267
A	target	Captain Rugelfuss
A	xp	>14,1 << !Warrior !Dwarf/!Paladin
S	
T	optional	
A	goto	1432,23.522,70.102,40,0
A	goto	1432,27.501,65.367,30,0
A	goto	1432,34.405,48.276
A	subzone	144
A	isOnQuest	414
S	
T	completewith	HonorStudents << Dwarf/Gnome
T	completewith	ThelsaHS << !Dwarf !Gnome
A	line	Loch Modan,36.72,41.97,37.24,43.19,37.33,45.63,36.77,46.20,35.19,46.88,32.67,49.71,35.19,46.88,36.77,46.20,37.33,45.63,37.24,43.19,36.72,41.97
A	turnin	414
A	accept	416
A	accept	1339
A	target	Mountaineer Kadrell
S	
T	optional	
T	completewith	ThelsaHS
A	goto	1432,35.273,47.750,10,0
A	goto	1432,35.433,48.243,12
S	
A	goto	1432/0,-2954.42,-5394.10
A	accept	418
A	target	Vidra Hearthstove
A	xp	>14,1
S	
A	goto	1432/0,-2952.46,-5381.87
A	collect	4470,1
A	collect	4471,1
A	target	Yanni Stoutheart
A	skill	cooking,50,1
S	
T	xprate	>1.49 << Paladin
T	label	ThelsaHS
A	goto	1432/0,-2973.90,-5377.93
A	home	
A	target	Innkeeper Hearthstove
S	
T	optional	
T	completewith	next
A	goto	1432,35.273,47.750,10
S	Dwarf/Gnome
T	label	HonorStudents
A	goto	1432/0,-3019.02,-5369.40,8,0
A	goto	1432/0,-3014.86,-5366.93
A	accept	6387
A	target	Brock Stoneseeker
S	
A	line	Loch Modan,36.72,41.97,37.24,43.19,37.33,45.63,36.77,46.20,35.19,46.88,32.67,49.71,35.19,46.88,36.77,46.20,37.33,45.63,37.24,43.19,36.72,41.97
A	goto	1432/0,-3006.61,-5259.57,15,0
A	goto	1432/0,-3020.95,-5282.02,15,0
A	goto	1432/0,-3023.44,-5326.90,15,0
A	goto	1432/0,-3007.99,-5337.390,15,0
A	goto	1432/0,-2964.41,-5349.90,15,0
A	goto	1432/0,-2894.90,-5401.96,20,0
A	goto	1432/0,-3007.99,-5337.390
A	turnin	414
A	accept	416
A	accept	1339
A	target	Mountaineer Kadrell
S	
T	optional	
T	label	BoarMeatLoch1
T	completewith	Algaz
A	goto	1426,70.845,51.784,0
A	goto	1426,73.533,50.850,0
A	goto	1426,75.353,48.533,0
A	goto	1426,79.881,46.805,0
A	goto	1426,81.040,43.456,0
A	goto	1426,80.583,36.040,0
A	collect	769,10,2178,1,0x20,cooking
A	mob	Mountain Boar
A	skill	cooking,10,1
A	subzoneskip	925
S	
T	optional	
T	requires	BoarMeatLoch1
T	completewith	Algaz
A	goto	1426,70.845,51.784,0
A	goto	1426,73.533,50.850,0
A	goto	1426,75.353,48.533,0
A	goto	1426,79.881,46.805,0
A	goto	1426,81.040,43.456,0
A	goto	1426,80.583,36.040,0
A	collect	769,50,2178,1,0x20,cooking
A	mob	Mountain Boar
A	skill	cooking,50,1
A	subzoneskip	925
S	
T	optional	
T	completewith	Algaz
A	collect	3172,3,418,1
A	mob	+Mountain Boar
A	collect	3173,3,418,1
A	mob	+Elder Black Bear
A	collect	3174,3,418,1
A	mob	+Forest Lurker
A	isOnQuest	418
A	subzoneskip	925
S	
T	optional	
T	label	Algaz
T	completewith	Stormpike1
A	goto	1432,23.490,18.008
A	subzone	925
S	
T	optional	
T	requires	Algaz
T	completewith	Stormpike1
A	goto	1432,23.490,18.008,15,0
A	goto	1432,24.279,17.959,12
S	
T	label	Stormpike1
A	goto	1432/0,-2676.99,-4825.980
A	turnin	1339
A	accept	1338
A	accept	307
A	target	Mountaineer Stormpike
A	dungeon	DM << Human
S	Human
T	xprate	<1.59
T	label	Stormpike1
A	goto	1432/0,-2676.99,-4825.980
A	turnin	1339
A	accept	1338
A	accept	307
A	target	Mountaineer Stormpike
A	dungeon	!DM
S	Human
T	xprate	>1.59
T	label	Stormpike1
A	goto	1432/0,-2676.99,-4825.980
A	turnin	1339
A	accept	1338
A	accept	307
A	target	Mountaineer Stormpike
A	dungeon	!DM
S	
T	softcore	
T	completewith	flyIF
A	deathskip	
A	target	Spirit Healer
S	
T	optional	
T	completewith	next
A	goto	1432,35.273,47.750,10,0
A	goto	1432,35.433,48.243,12
S	
T	optional	
T	label	Thelsamar1
A	goto	1432/0,-2954.42,-5394.10
A	turnin	418
A	target	Vidra Hearthstove
A	isQuestComplete	418
S	Dwarf Paladin
T	xprate	1.49-1.59
T	optional	
A	goto	1432,26.186,49.030
A	xp	11+6885
S	Dwarf Paladin
T	xprate	>1.59
T	optional	
A	goto	1432,26.186,49.030
A	xp	11+6225
S	Dwarf/Gnome
A	goto	1432/0,-2929.87,-5424.84
A	turnin	6387
A	accept	6391
A	target	Thorgrum Borrelson
S	
T	label	flyIF
A	goto	1432/0,-2929.87,-5424.84
A	fly	Ironforge
A	target	Thorgrum Borrelson
A	zoneskip	Ironforge
S	Gnome Rogue/Dwarf Rogue
T	xprate	>1.59
T	optional	
T	completewith	next
A	goto	1455,60.781,25.800,30,0
A	goto	1455,59.236,14.974,30,0
A	goto	1455,52.941,12.466,12,0
A	goto	1455,51.919,14.468,12,0
A	goto	1455,51.438,16.000,10
S	Dwarf Rogue/Gnome Rogue
T	xprate	<1.59
T	season	2
T	optional	
T	completewith	next
A	goto	1455,60.781,25.800,30,0
A	goto	1455,59.236,14.974,30,0
A	goto	1455,52.941,12.466,12,0
A	goto	1455,51.919,14.468,12,0
A	goto	1455,51.438,16.000,10
S	Dwarf Rogue/Gnome Rogue
T	xprate	<1.59
T	season	2
T	optional	
A	goto	1455/0,-1124.38,-4647.53
A	turnin	2218
A	target	Hulfdan Blackbeard
A	isOnQuest	2218
S	Dwarf Rogue/Gnome Rogue
T	xprate	>1.59
A	goto	1455/0,-1124.38,-4647.53
A	turnin	2239
A	target	Hulfdan Blackbeard
S	Dwarf Rogue/Gnome Rogue
T	xprate	>1.59
T	label	Cunning
T	completewith	Ride
A	use	7298
A	itemcount	7298,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
S	Dwarf Rogue/Gnome Rogue
T	xprate	>1.59
T	requires	Cunning
T	completewith	Ride
A	use	2218
A	itemcount	2218,1
A	itemStat	17,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.7
S	Rogue
T	xprate	<1.59
T	season	2
A	goto	1455/0,-1124.03,-4639.85
A	collect	204174,1
A	mob	Cut-throat Mugger
A	train	400081,1
S	Rogue
T	xprate	<1.59
T	season	2
A	train	400081
A	use	204174
A	itemcount	204174,1
S	Dwarf Rogue/Gnome Rogue
T	xprate	>1.59
T	optional	
T	completewith	next
A	goto	1455,60.781,25.800,25,0
A	goto	1455,59.236,14.974,25,0
A	goto	1455,56.192,32.397,20,0
A	goto	1455,51.569,29.956,15,0
A	goto	1455,49.645,28.195,12,0
A	goto	1455/0,-1120.93,-4708.06,10
S	Dwarf Rogue/Gnome Rogue
T	xprate	<1.59
T	season	2
T	optional	
T	completewith	next
A	goto	1455,60.781,25.800,25,0
A	goto	1455,59.236,14.974,25,0
A	goto	1455,56.192,32.397,20,0
A	goto	1455,51.569,29.956,15,0
A	goto	1455,49.645,28.195,12,0
A	goto	1455/0,-1120.93,-4708.06,10
S	Dwarf/Gnome
T	xprate	<1.59 << Rogue
T	season	0,1 << Rogue
T	optional	
T	completewith	next
A	goto	1455,56.714,41.945,20,0
A	goto	1455,55.748,38.127,20,0
A	goto	1455,51.569,29.956,15,0
A	goto	1455,49.645,28.195,12,0
A	goto	1455/0,-1120.93,-4708.06,10
S	
T	label	Ride
A	goto	1455/0,-1120.93,-4708.06
A	turnin	6391
A	accept	6388
A	target	Golnir Bouldertoe
S	Dwarf Paladin
T	xprate	>1.49
A	goto	1455/0,-1152.40,-4821.13
A	turnin	6388
A	accept	6392
A	target	Gryth Thurden
S	
T	optional	
T	completewith	next
A	goto	1455,44.029,50.074,20,0
A	goto	Ironforge,39.550,57.490,12
S	
A	goto	Ironforge,39.550,57.490
A	turnin	291
A	target	Senator Barin Redstone
S	
T	xprate	<1.5 << Dwarf Paladin
A	goto	1455/0,-1152.40,-4821.13
A	turnin	6388
A	accept	6392
A	target	Gryth Thurden
S	Dwarf Paladin
T	xprate	>1.49
T	optional	
T	completewith	next
A	goto	1455,44.403,49.020,20,0
A	goto	1455,35.239,32.789,20,0
A	goto	1455,27.208,12.552,20,0
A	goto	1455/0,-896.47,-4601.65,12
S	Dwarf Paladin
T	xprate	>1.49
A	goto	1455/0,-896.47,-4601.65
A	accept	2999
A	target	Brandur Ironhammer
S	Dwarf Paladin
T	xprate	>1.49
T	optional	
T	completewith	next
A	goto	1455,25.400,2.676,10,0
A	goto	1455,23.621,2.544,10,0
A	goto	1455,22.014,4.533,10,0
A	goto	1455,21.831,7.651,10,0
A	goto	1455,23.766,11.636,10,0
A	goto	1455,27.622,12.177,12
S	Dwarf Paladin
T	xprate	>1.49
A	goto	1455,27.622,12.177
A	turnin	2999
A	accept	1645
A	turnin	1645
A	target	Tiza Battleforge
S	Dwarf Paladin
T	xprate	>1.49
A	goto	1455,27.622,12.177
A	accept	1646
A	use	6916
S	Dwarf Paladin
T	xprate	>1.49
A	goto	1455,27.622,12.177
A	turnin	1646
A	accept	1647
A	target	Tiza Battleforge
S	Dwarf Paladin
T	xprate	>1.49
T	loop	
A	line	Ironforge,21.750,51.733,22.015,54.945,23.328,61.865,23.723,63.824,26.021,68.382,27.495,71.320,31.352,77.807,32.405,78.563,37.256,82.159,39.204,83.202,42.944,84.113
A	goto	1455,21.750,51.733,0
A	goto	1455,26.021,68.382,0
A	goto	1455,42.944,84.113,0
A	goto	1455,21.750,51.733,20,0
A	goto	1455,22.015,54.945,20,0
A	goto	1455,23.328,61.865,20,0
A	goto	1455,23.723,63.824,20,0
A	goto	1455,26.021,68.382,20,0
A	goto	1455,27.495,71.320,20,0
A	goto	1455,31.352,77.807,20,0
A	goto	1455,32.405,78.563,20,0
A	goto	1455,37.256,82.159,20,0
A	goto	1455,39.204,83.202,20,0
A	goto	1455,42.944,84.113,20,0
A	turnin	1647
A	accept	1648
A	turnin	1648
A	accept	1778
A	unitscan	John Turner
S	Mage
T	season	2
A	goto	1455/0,-865.37,-4865.20
A	collect	211779,5
A	target	Barim Jurgenstaad
S	
T	ah	
A	goto	Ironforge,25.800,75.500,-1
A	goto	Ironforge,24.200,74.600,-1
A	goto	Ironforge,23.800,71.800,-1
A	collect	3172,3,418,1
A	collect	3173,3,418,1
A	collect	3174,3,418,1
A	collect	769,50,2178,1,0x20,cooking
A	disablecheckbox	
A	collect	2672,50,2178,1,0x20,cooking
A	disablecheckbox	
A	target	Auctioneer Lympkin
A	target	Auctioneer Redmuse
A	target	Auctioneer Buckler
A	zoneskip	Dun Morogh
A	isQuestAvailable	418
A	skill	cooking,50,1
S	
T	ah	
T	optional	
A	goto	Ironforge,25.800,75.500,-1
A	goto	Ironforge,24.200,74.600,-1
A	goto	Ironforge,23.800,71.800,-1
A	collect	3172,3,418,1
A	collect	3173,3,418,1
A	collect	3174,3,418,1
A	target	Auctioneer Lympkin
A	target	Auctioneer Redmuse
A	target	Auctioneer Buckler
A	zoneskip	Dun Morogh
A	isQuestAvailable	418
A	skill	cooking,<50,1
S	Dwarf Paladin
T	xprate	>1.49
T	optional	
T	label	Tiza1
T	completewith	Tiza2
A	goto	1455,27.228,12.724,15,0
A	goto	1455,25.400,2.676,12
S	Dwarf Paladin
T	xprate	>1.49
T	optional	
T	requires	Tiza1
T	completewith	Tiza2
A	goto	1455,25.400,2.676,10,0
A	goto	1455,23.621,2.544,10,0
A	goto	1455,22.014,4.533,10,0
A	goto	1455,21.831,7.651,10,0
A	goto	1455,23.766,11.636,10,0
A	goto	1455,27.622,12.177,12
S	Dwarf Paladin
T	xprate	>1.49
T	label	Tiza2
A	goto	1455,27.622,12.177
A	turnin	1778
A	accept	1779
A	target	Tiza Battleforge
S	Dwarf Paladin
T	xprate	>1.49
A	goto	1455/0,-899.70,-4613.0300
A	turnin	1779
A	accept	1783
A	target	Muiredon Battleforge
S	Dwarf Paladin
T	xprate	>1.49
A	goto	1455/0,-896.47,-4601.65
A	trainer	
A	target	Brandur Ironhammer
S	skip --logout skip << Dwarf Paladin
T	xprate	>1.49
T	optional	
T	completewith	DRT
A	goto	1455,27.611,8.074
A	goto	1455,76.414,51.226,20
S	skip --logout skip << !Hunter !Warrior --Hunter Class q, Warrior training Era SoD, Rune SoD
T	ah	
T	season	0,1 << Paladin --Rebuke Rune
T	xprate	<1.5 << Dwarf Paladin --XX 1.5x+ logout skips from trainers
T	optional	
T	completewith	DRT
A	goto	1455,35.743,74.853,30,0
A	goto	1455,39.105,78.213,30,0
A	goto	1455,49.422,81.849
A	goto	1455,76.414,51.226,20
A	zoneskip	Ironforge,1
A	isQuestAvailable	418
S	skip --logout skip << !Hunter !Warrior --Hunter Class q, Warrior training Era SoD, Rune SoD
T	ah	
T	season	0,1 << Paladin --Rebuke Rune
T	xprate	<1.5 << Dwarf Paladin --XX 1.5x+ logout skips from trainers
T	optional	
T	completewith	DRT
A	goto	1455,56.207,46.844
A	goto	1455,76.414,51.226,20
A	zoneskip	Ironforge,1
A	isQuestTurnedIn	418
S	skip --logout skip << !Hunter !Warrior --Hunter Class q, Warrior training Era SoD, Rune SoD
T	ssf	
T	season	0,1 << Paladin --Rebuke Rune
T	xprate	<1.5 << Dwarf Paladin --XX 1.5x+ logout skips from trainers
T	optional	
T	completewith	DRT
A	goto	1455,56.207,46.844
A	goto	1455,76.414,51.226,20
A	zoneskip	Ironforge,1
S	Paladin
T	season	2
T	completewith	next
A	goto	1455/0,-1279.20,-4956.82,10,0
A	goto	1455/0,-1287.03,-4975.18,10
A	train	425621,1
S	Paladin
T	season	2
A	goto	1455/0,-1287.03,-4975.18
A	gossipoption	110791
A	target	Bruuk Barleybeard
A	skipgossip	5570,1,1
A	train	425621,1
S	Paladin
T	season	2
A	goto	1455/0,-1286.0,-4957.72
A	gossipoption	109084
A	mob	Bruart
A	skipgossip	209004,1
A	train	425621,1
S	Paladin
T	season	2
A	goto	1455/0,-1286.0,-4957.72,-1
A	goto	1455/0,-1287.03,-4975.18,-1
A	collect	205683,1
A	target	Bruuk Barleybeard
A	skipgossip	5570,2,1
A	skipgossip	209004,1
A	train	425621,1
S	Paladin
T	season	2
A	cast	402265
A	use	205683
A	itemcount	205683,1
A	train	425621,1
S	Paladin
T	season	2
T	completewith	DRT
A	engrave	7
A	train	425621,3
S	Warrior
A	train	2567
A	target	+Bixi Wobblebonk
A	goto	1455/0,-1205.65,-5042.12
A	train	199
A	goto	1455/0,-1197.27,-5041.49
A	target	+Buliwyf Stonehand
S	Warrior
A	goto	1455,62.378,88.671
A	collect	3107,1
A	target	Brenwyn Wintersteel
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.3
A	xp	<11,1
S	Warrior
A	goto	1455,62.378,88.671
A	collect	2946,1
A	target	Brenwyn Wintersteel
A	xp	>11,1
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.0
S	Warrior
T	optional	
T	completewith	Dirt
A	use	3107
A	itemcount	3107,1
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.3
A	xp	<11,1
S	Warrior
T	optional	
T	completewith	Dirt
A	use	2946
A	itemcount	2946,1
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.0
S	Warrior
T	season	2
T	optional	
T	completewith	next
A	goto	1455/0,-1279.20,-4956.82,10,0
A	goto	1455/0,-1287.03,-4975.18,10
A	train	425447,1
S	Warrior
T	season	2
A	goto	1455/0,-1287.03,-4975.18
A	gossipoption	110791
A	target	Bruuk Barleybeard
A	skipgossip	5570,1,1
A	train	425447,1
S	Warrior
T	season	2
A	goto	1455/0,-1286.0,-4957.72
A	gossipoption	109084
A	mob	Bruart
A	skipgossip	209004,1
A	train	425447,1
S	Warrior
T	season	2
T	optional	
A	goto	1455/0,-1286.0,-4957.72,-1
A	goto	1455/0,-1287.03,-4975.18,-1
A	collect	204716,1
A	target	Bruuk Barleybeard
A	skipgossip	5570,2,1
A	skipgossip	209004,1
A	train	425447,1
S	Warrior
T	season	2
A	train	425447
A	use	204716
A	itemcount	204716,1
S	Warrior
T	season	2
T	completewith	DRT
A	engrave	7
A	train	425447,3
S	skip --logout skip << Paladin/Warrior
T	season	2
T	optional	
T	completewith	DRT
A	goto	1455,72.481,74.910
A	goto	1455,76.414,51.226,20
S	Hunter
T	optional	
T	completewith	next
A	goto	1455,66.847,83.366,15,0
A	goto	1455/0,-1273.83,-5022.08,15
S	Hunter
A	goto	1455/0,-1273.83,-5022.08
A	turnin	6086
A	target	Belia Thundergranite
S	skip --logout skip << Hunter
T	optional	
T	completewith	DRT
A	goto	1455,70.408,85.520
A	goto	1455,76.414,51.226,20
S	
T	label	DRT
T	completewith	TramEnd
A	goto	1455/0,-1330.28,-4840.430
A	subzone	2257
S	
A	accept	6661
A	target	Monty
S	
A	complete	6661,1
A	use	17117
A	mob	Deeprun Rat
S	
A	turnin	6661
A	timer	11,Deeprun Rat Roundup RP
A	accept	6662
A	target	Monty
S	
T	optional	
T	label	TramCook1
T	completewith	TramEnd
A	cast	818
A	usespell	818
A	zoneskip	Stormwind City
A	itemcount	769,1
A	itemcount	2672,1
A	itemcount	4470,1
A	itemcount	4471,1
A	skill	cooking,50,1
S	
T	optional	
T	requires	TramCook1
T	label	TramCook2
T	completewith	TramEnd
A	cast	818
A	usespell	818
A	zoneskip	Stormwind City
A	itemcount	769,<1
A	itemcount	2672,1
A	itemcount	4470,1
A	itemcount	4471,1
A	skill	cooking,50,1
S	
T	optional	
T	requires	TramCook2
T	label	TramCook3
T	completewith	TramEnd
A	cast	818
A	usespell	818
A	zoneskip	Stormwind City
A	itemcount	769,1
A	itemcount	2672,<1
A	itemcount	4470,1
A	itemcount	4471,1
A	skill	cooking,50,1
S	
T	optional	
T	requires	TramCook3
T	label	TramCook4
T	completewith	TramEnd
A	usespell	2550
A	zoneskip	Stormwind City
A	itemcount	769,1
A	itemcount	2672,1
A	itemcount	4471,1
A	skill	cooking,50,1
S	
T	optional	
T	requires	TramCook4
T	label	TramCook5
T	completewith	TramEnd
A	usespell	2550
A	zoneskip	Stormwind City
A	itemcount	769,<1
A	itemcount	2672,1
A	itemcount	4471,1
A	skill	cooking,50,1
S	
T	optional	
T	requires	TramCook5
T	label	TramCook6
T	completewith	TramEnd
A	usespell	2550
A	zoneskip	Stormwind City
A	itemcount	769,1
A	itemcount	2672,<1
A	itemcount	4471,1
A	skill	cooking,50,1
S	
T	label	TramEnd
A	turnin	6662
A	target	Nipsy
A	subzoneskip	2257,1
S	
T	optional	
T	completewith	Order
A	abandon	6662
S	
T	optional	
T	completewith	Order
A	zone	Stormwind City
A	isOnQuest	1338
S	
A	goto	1453/0,685.22,-8387.23
A	accept	353
A	target	Grimand Elmore
S	
T	label	Order
A	goto	1453/0,600.07,-8427.22
A	turnin	1338
A	target	Furen Longbeard
S	Paladin
T	season	2
T	optional	
T	completewith	next
A	goto	1453/0,809.52,-8579.22,20
S	Paladin
T	season	2
A	goto	1453/0,868.8,-8530.730
A	gossipoption	109653
A	target	Brother Romulus
A	train	410015,1
S	Paladin
T	season	2
T	completewith	next
A	goto	1453/0,878.35,-8545.61,5,0
A	goto	1453/0,871.9,-8539.69,5,0
A	goto	1453/0,890.04,-8571.69,8,0
A	goto	1453/0,889.64,-8578.68,8,0
A	goto	1453/0,897.71,-8584.06,8,0
A	goto	1453/0,904.29,-8574.92,8,0
A	goto	1453/0,897.71,-8561.56,8,0
A	goto	1453/0,913.3,-8541.57,8,0
A	goto	1453/0,928.09,-8544.98,8,0
A	goto	1453/0,943.14,-8525.26,8,0
A	goto	1453/0,931.85,-8508.41,8,0
A	goto	1453/0,939.24,-8500.88,8
A	train	410015,1
S	Paladin
T	season	2
A	goto	1453/0,939.24,-8501.77
A	collect	205864,1
A	train	410015,1
S	Priest
T	optional	
T	completewith	next
A	goto	1453/0,809.52,-8579.22,20
S	Priest
A	goto	1453/0,862.89,-8519.61
A	trainer	
A	turnin	5634
A	target	High Priestess Laurena
S	Priest
A	goto	1453/0,861.81,-8512.800
A	train	13908
A	target	High Priestess Laurena
S	Warrior
A	goto	1453/0,358.25,-8728.28,15,0
A	goto	1453/0,302.6,-8685.53,15,0
A	goto	1453/0,325.68,-8688.59
A	trainer	
A	accept	1638
A	target	Ilsa Corbin
S	Warrior
T	optional	
T	completewith	next
A	goto	1453/0,401.29,-8741.21,17,0
A	goto	1453/0,417.13,-8636.5,12
S	Warrior
A	goto	1453/0,382.86,-8612.69
A	turnin	1638
A	accept	1639
A	target	Harry Burlguard
S	Warrior
A	goto	1453/0,389.07,-8604.43
A	turnin	1639
A	accept	1640
A	target	Bartleby
S	Warrior
A	goto	1453/0,389.07,-8604.43
A	complete	1640,1
A	mob	Bartleby
S	Warrior
A	goto	1453/0,389.07,-8604.43
A	turnin	1640
A	accept	1665
A	target	Bartleby
S	Warrior
A	goto	1453/0,382.86,-8612.69
A	turnin	1665
A	target	Harry Burlguard
S	Warlock
T	optional	
T	completewith	next
A	goto	1453/0,988.44,-8942.15,20,0
A	goto	1453/0,1015.33,-8978.9,15
S	Warlock
A	goto	1453/0,1029.89,-8971.06
A	trainer	
A	target	Ursula Deline
S	Warlock
A	goto	1453/0,1041.54,-8983.29
A	accept	1688
A	target	Gakin the Darkbinder
S	
A	goto	1453/0,613.0,-8796.03
A	trainer	
A	trainer	
A	trainer	
A	trainer	
A	target	Woo Ping
S	Dwarf Paladin
T	xprate	<1.5
A	goto	1453/0,673.58,-8867.76
A	home	
A	target	Innkeeper Allison
E
G	Guides/forever/Alliance-1-14_DwarfGnome.lua
M	xprate	>1.49
M	classic	
M	tbc	
M	season	0,1
M	version	1
M	selector	Gnome Warlock
M	group	RestedXP Forever Guide (A)
M	subgroup	Speedrun Guide 1-20
M	name	11-12 Voidwalker Quest
M	displayname	12-13 Voidwalker Quest << SoD
M	next	12-14 Loch Modan (Dwarf/Gnome)
S	
T	completewith	next
A	goto	1453/0,988.44,-8942.15,20,0
A	goto	1453/0,1015.33,-8978.9,15
S	
A	goto	1453/0,1041.54,-8983.29
A	accept	1688
A	target	Gakin the Darkbinder
S	
A	goto	1453/0,490.03,-8835.82
A	fp	Stormwind
A	target	Dungar Longdrink
S	
T	optional	
T	completewith	next
A	goto	1453/0,396.97,-9104.39
A	zone	Elwynn Forest
S	
A	accept	176
A	goto	1429/0,683.40,-9667.93
A	target	Deputy Rainer
S	
A	goto	1429/0,598.29,-9946.33,70,0
A	goto	1429/0,629.53,-10020.39,70,0
A	goto	1429/0,660.77,-10085.20,70,0
A	goto	1429/0,598.29,-10112.98,70,0
A	goto	1429/0,598.29,-9946.33,70,0
A	goto	1429/0,629.53,-10020.39,70,0
A	goto	1429/0,660.77,-10085.20,70,0
A	goto	1429/0,598.29,-10112.98,70,0
A	goto	1429/0,598.29,-9946.33,70,0
A	goto	1429/0,629.53,-10020.39,70,0
A	goto	1429/0,660.77,-10085.20,70,0
A	goto	1429/0,598.29,-10112.98,70,0
A	goto	1429/0,636.47,-10112.98
A	complete	176,1
A	unitscan	Hogger
S	
T	softcore	
T	optional	
T	completewith	next
A	deathskip	
S	
A	goto	1429/0,73.92,-9465.54
A	turnin	176,3
A	target	Marshal Dughan
S	Warlock
T	optional	
T	label	BoarMeatElwynnCooking1
T	completewith	SChoker
A	goto	1429,49.917,72.959,0
A	goto	1429,54.444,75.879,0
A	goto	1429,57.620,76.213,0
A	goto	1429,61.911,78.274,0
A	goto	1429,65.619,78.388,0
A	collect	769,10,2178,1,0x20,cooking
A	mob	Rockhide Boar
A	skill	cooking,10,1
A	subzoneskip	62
S	Warlock
T	optional	
T	requires	BoarMeatElwynnCooking1
T	completewith	SChoker
A	goto	1429,49.917,72.959,0
A	goto	1429,54.444,75.879,0
A	goto	1429,57.620,76.213,0
A	goto	1429,61.911,78.274,0
A	goto	1429,65.619,78.388,0
A	collect	769,50,2178,1,0x20,cooking
A	mob	Rockhide Boar
A	skill	cooking,50,1
A	subzoneskip	62
S	Warlock
T	label	SChoker
A	goto	1429/0,-932.35,-9806.53
A	complete	1688,1
A	mob	Surena Caledon
S	Warlock
T	optional	
T	label	WolfMeatElwynnCooking1
T	completewith	WlockRedridge
A	goto	1429,84.448,72.486,0
A	goto	1429,88.611,71.379,0
A	goto	1429,89.657,75.373,0
A	goto	1429,87.250,75.853,0
A	collect	2672,10,2178,1,0x20,cooking
A	mob	Prowler
A	skill	cooking,10,1
S	Warlock
T	optional	
T	requires	WolfMeatElwynnCooking1
T	completewith	WlockRedridge
A	goto	1429,84.448,72.486,0
A	goto	1429,88.611,71.379,0
A	goto	1429,89.657,75.373,0
A	goto	1429,87.250,75.853,0
A	collect	2672,50,86,1,0x20,cooking
A	mob	Prowler
A	skill	cooking,50,1
S	
T	optional	
T	label	WlockRedridge
T	completewith	next
A	goto	1433/0,-1948.56,-9582.75
A	zone	Redridge Mountains
S	
A	goto	1433/0,-1948.56,-9582.75
A	accept	244
A	target	Guard Parker
S	
T	xprate	>1.49
A	goto	1433/0,-2207.10,-9351.52
A	accept	3741
A	target	Shawn
A	xp	<12,1
S	
T	xprate	>1.49
A	goto	1433/0,-2250.09,-9360.78,90,0
A	goto	1433/0,-2174.32,-9386.56,90,0
A	goto	1433/0,-2147.41,-9308.08,90,0
A	goto	1433/0,-2090.96,-9373.82,90,0
A	goto	1433/0,-1986.76,-9324.30,90,0
A	goto	1433/0,-2246.40,-9359.92,90,0
A	goto	1433/0,-2309.57,-9376.28,90,0
A	goto	1433/0,-2397.70,-9363.97
A	complete	3741,1
A	isOnQuest	3741
S	
T	xprate	>1.49
A	goto	1433/0,-2205.58,-9351.52
A	turnin	3741
A	target	Hilary
A	isQuestComplete	3741
S	
T	xprate	>1.49
A	goto	1433/0,-2238.00,-9443.69
A	turnin	244
A	target	Deputy Feldon
S	
T	xprate	<1.49
A	goto	1433/0,-2238.00,-9443.69
A	turnin	244
A	target	Deputy Feldon
S	
A	goto	Redridge Mountains,30.590,59.410
A	fp	Redridge Mountains
A	fly	Stormwind
A	target	Ariena Stormfeather
S	
T	ah	
A	goto	1453/0,660.28,-8814.55
A	collect	3172,3,418,1
A	collect	3173,3,418,1
A	collect	3174,3,418,1
A	collect	769,50,2178,1,0x20,cooking
A	disablecheckbox	
A	collect	2672,50,2178,1,0x20,cooking
A	disablecheckbox	
A	target	Auctioneer Jaxon
A	isQuestAvailable	418
A	skill	cooking,50,1
S	
T	ah	
T	optional	
A	goto	1453/0,660.28,-8814.55
A	collect	3172,3,418,1
A	collect	3173,3,418,1
A	collect	3174,3,418,1
A	target	Auctioneer Jaxon
A	isQuestAvailable	418
A	skill	cooking,<50,1
S	
T	optional	
T	completewith	next
A	goto	1453/0,988.44,-8942.15,20,0
A	goto	1453/0,1015.33,-8978.9,15
S	
A	goto	1453/0,1029.89,-8971.06
A	trainer	
A	target	Ursula Deline
S	
A	goto	1453/0,1041.54,-8983.29
A	turnin	1688
A	accept	1689
A	target	Gakin the Darkbinder
S	
T	optional	
T	completewith	next
A	goto	1453/0,1042.22,-9002.21,18,0
A	goto	1453/0,1069.1,-8991.45,18,0
A	goto	1453/0,1027.43,-8991.45,18,0
A	goto	1453/0,1042.83,-8972.68
A	cast	7728
A	use	6928
S	
A	goto	1453/0,1042.83,-8972.68
A	complete	1689,1
A	use	6928
A	mob	Summoned Voidwalker
S	
A	goto	1453/0,1041.54,-8983.29
A	turnin	1689
A	target	Gakin the Darkbinder
E
G	Guides/forever/Alliance-1-14_DwarfGnome.lua
M	xprate	<1.5
M	classic	
M	tbc	
M	season	0,1
M	selector	Alliance !Hunter
M	group	RestedXP Forever Guide (A)
M	subgroup	Speedrun Guide 1-20
M	name	11-12 Elwynn (Dwarf/Gnome)
M	version	1
M	defaultfor	Gnome/Dwarf
M	next	12-14 Loch Modan (Dwarf/Gnome)
S	Warlock
T	softcore	
T	optional	
T	completewith	next
S	
A	goto	1453/0,490.03,-8835.82
A	fp	Stormwind
A	target	Dungar Longdrink
S	Warlock
T	softcore	
T	optional	
T	completewith	next
A	deathskip	
A	target	Spirit Healer
S	
T	optional	
T	completewith	next
A	subzone	87
S	
A	goto	1429/0,73.95,-9465.590
A	target	Marshal Dughan
A	accept	62
S	
A	target	William Pestle
A	goto	1429/0,31.92,-9460.38
A	accept	60
S	Mage/Rogue
T	completewith	next
A	goto	1429/0,12.52,-9479.85,9
S	Mage
A	target	Zaldimar Wefhellt
A	goto	1429/0,34.28,-9471.61
A	trainer	
S	Rogue
A	target	Keryn Sylvius
A	goto	1429/0,12.69,-9465.75
A	trainer	
S	
A	target	Remy "Two Times"
A	goto	Elwynn Forest,42.140,67.254
A	accept	40
A	accept	47
S	Warlock
A	accept	176
A	goto	1429/0,683.40,-9667.93
A	target	Deputy Rainer
S	Paladin
T	season	2
A	accept	176
A	goto	1429/0,683.40,-9667.93
A	target	Deputy Rainer
S	Warlock
T	completewith	next
A	use	1307
A	collect	1307,1,123
A	accept	123
A	unitscan	Gruff Swiftbite
S	Warlock
A	goto	1429/0,598.29,-9946.33,70,0
A	goto	1429/0,629.53,-10020.39,70,0
A	goto	1429/0,660.77,-10085.20,70,0
A	goto	1429/0,598.29,-10112.98,70,0
A	goto	1429/0,598.29,-9946.33,70,0
A	goto	1429/0,629.53,-10020.39,70,0
A	goto	1429/0,660.77,-10085.20,70,0
A	goto	1429/0,598.29,-10112.98,70,0
A	goto	1429/0,598.29,-9946.33,70,0
A	goto	1429/0,629.53,-10020.39,70,0
A	goto	1429/0,660.77,-10085.20,70,0
A	goto	1429/0,598.29,-10112.98,70,0
A	goto	1429/0,636.47,-10112.98
A	complete	176,1
A	unitscan	Hogger
S	Paladin
T	season	2
T	completewith	next
A	use	1307
A	collect	1307,1,123
A	accept	123
A	unitscan	Gruff Swiftbite
S	Paladin
T	season	2
A	goto	1429/0,598.29,-9946.33,70,0
A	goto	1429/0,629.53,-10020.39,70,0
A	goto	1429/0,660.77,-10085.20,70,0
A	goto	1429/0,598.29,-10112.98,70,0
A	goto	1429/0,598.29,-9946.33,70,0
A	goto	1429/0,629.53,-10020.39,70,0
A	goto	1429/0,660.77,-10085.20,70,0
A	goto	1429/0,598.29,-10112.98,70,0
A	goto	1429/0,598.29,-9946.33,70,0
A	goto	1429/0,629.53,-10020.39,70,0
A	goto	1429/0,660.77,-10085.20,70,0
A	goto	1429/0,598.29,-10112.98,70,0
A	goto	1429/0,636.47,-10112.98
A	complete	176,1
A	unitscan	Hogger
S	Paladin
T	season	2
T	completewith	next
T	label	Island
A	goto	1431/0,716.42,-10225.35,50
A	train	410015,1
A	itemcount	205864,1
S	Paladin
T	season	2
T	completewith	next
A	goto	1431/0,716.42,-10225.35
A	gossipoption	109610
A	target	Ada Gelhardt
A	skipgossip	205153,1
A	train	410015,1
A	itemcount	205864,1
S	Paladin
T	season	2
T	requires	Island
A	goto	1431/0,716.42,-10225.35
A	collect	205897,1
A	target	Ada Gelhardt
A	skipgossip	205153,1
A	train	410015,1
A	itemcount	205864,1
S	Paladin
T	season	2
T	sticky	
A	destroy	205864
S	Paladin
T	season	2
A	cast	402265
A	use	205897
A	itemcount	205897,1
A	train	410015,1
S	Paladin
T	season	2
A	goto	1436/0,1748.27,-10672.13
A	engrave	5
A	train	410015,3
S	
A	accept	88
A	target	+Ma Stonefield
A	goto	Elwynn Forest,34.660,84.483
A	accept	85
A	target	+"Auntie" Bernice Stonefield
A	goto	1429/0,338.47,-9889.67
S	
A	target	Billy Maclure
A	goto	1429/0,38.41,-9923.69
A	turnin	85
A	accept	86
S	
T	completewith	next
A	complete	60,1
A	complete	47,1
A	mob	Kobold Tunneler
A	mob	Kobold Miner
S	
A	goto	1429/0,193.00,-9832.40,50,0
A	goto	1429/0,129.73,-9844.49
A	complete	62,1
S	
A	goto	1429/0,129.73,-9844.49,25,0
A	goto	1429/0,226.57,-9878.28,25,0
A	goto	1429/0,129.73,-9844.49,25,0
A	goto	1429/0,226.57,-9878.28,25,0
A	goto	1429/0,129.73,-9844.49
A	complete	60,1
A	complete	47,1
A	mob	Kobold Tunneler
A	mob	Kobold Miner
S	
T	softcore	
T	completewith	GoldshireTurnins
A	deathskip	
A	target	Spirit Healer
S	
T	hardcore	
T	completewith	GoldshireTurnins
A	subzone	87
S	
T	hardcore	
A	goto	Elwynn Forest,42.140,67.254
A	turnin	47
A	target	Remy "Two Times"
S	Paladin
T	season	2
A	target	Marshal Dughan
A	goto	1429/0,73.92,-9465.54
A	turnin	62
A	turnin	40
A	accept	35
A	turnin	176,2
A	isQuestComplete	176
S	Warlock
A	target	Marshal Dughan
A	goto	1429/0,73.92,-9465.54
A	turnin	62
A	turnin	40
A	accept	35
A	turnin	176,3
A	isQuestComplete	176
S	
A	target	Marshal Dughan
A	goto	1429/0,73.92,-9465.54
A	turnin	62
A	turnin	40
A	accept	35
S	
T	label	GoldshireTurnins
A	target	Marshal Dughan
A	goto	1429/0,74.02,-9465.52
A	turnin	123
A	isOnQuest	123
S	Warlock
A	isQuestTurnedIn	123
A	goto	1429/0,74.02,-9465.52
A	target	Marshal Dughan
A	accept	147
S	
A	target	William Pestle
A	goto	1429/0,31.92,-9460.38
A	turnin	60
A	accept	61
S	
T	softcore	
A	target	Remy "Two Times"
A	goto	Elwynn Forest,42.140,67.254
A	turnin	47
S	
T	completewith	next
A	goto	1429/0,-1032.06,-9610.23,30
S	
A	goto	1429/0,-1032.06,-9610.23
A	turnin	35
A	target	Guard Thomas
S	
T	era	
A	target	Guard Thomas
A	goto	1429/0,-1032.06,-9610.23
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
A	goto	1429/0,-986.35,-9336.06
A	turnin	37
A	accept	45
S	
T	era	
A	target	Supervisor Raelen
A	goto	1429/0,-1289.22,-9469.80
A	accept	5545
S	
T	era	
T	completewith	Bundles
A	complete	5545,1
S	
T	era	
T	label	Prowlers
A	goto	1429/0,-1234.31,-9224.180
A	turnin	45
A	accept	71
S	
T	era	
T	label	Bundles
A	goto	1429/0,-1126.71,-9689.41,60,0
A	goto	1429/0,-1230.84,-9876.89,60,0
A	goto	1429/0,-1310.67,-9717.18,60,0
A	goto	1429/0,-1126.71,-9689.41,60,0
A	goto	1429/0,-1230.84,-9876.89,60,0
A	goto	1429/0,-1310.67,-9717.18,60,0
A	goto	1429/0,-1483.86,-9440.13
A	complete	52,1
A	mob	+Prowler
A	complete	52,2
A	mob	+Young Forest Bear
S	
T	era	
A	goto	1429/0,-1130.18,-9383.88,40,0
A	goto	1429/0,-1369.67,-9314.45,40,0
A	goto	1429/0,-1130.18,-9383.88,40,0
A	goto	1429/0,-1369.67,-9314.45,40,0
A	goto	1429/0,-1130.18,-9383.88,40,0
A	goto	1429/0,-1369.67,-9314.45
A	complete	5545,1
S	
T	era	
A	target	Supervisor Raelen
A	goto	1429/0,-1289.22,-9469.80
A	turnin	5545
S	
T	era	
T	label	Bears
A	target	Sara Timberlain
A	goto	1429/0,-1222.40,-9531.76
A	accept	83
S	
T	era	
A	target	Guard Thomas
A	goto	1429/0,-1032.06,-9610.23
A	turnin	52
A	turnin	71
A	accept	39
A	accept	109
S	
T	completewith	Deed
A	use	1972
A	collect	1972,1,184
A	accept	184
S	Warlock
A	isOnQuest	147
A	goto	1429/0,-932.35,-9806.53
A	complete	1688,1
A	mob	+Surena Caledon
A	complete	147,1
A	mob	+Morgan the Collector
S	Warlock
A	goto	1429/0,-932.35,-9806.53
A	complete	1688,1
A	mob	Surena Caledon
S	
T	era	
T	completewith	next
A	complete	83,1
A	mob	Defias Bandit
A	isOnQuest	83
S	
A	goto	1429/0,-869.87,-9768.10
A	complete	88,1
A	mob	Princess
S	
T	era	
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
A	goto	1429/0,-869.87,-9768.10
A	complete	83,1
A	mob	Defias Bandit
A	isOnQuest	83
S	
T	era	
T	softcore	
T	sticky	
T	completewith	next
A	deathskip	
A	target	Spirit Healer
S	
T	label	Deed
A	target	Sara Timberlain
A	goto	1429/0,-1222.40,-9531.76
A	turnin	83
A	isQuestComplete	83
S	
T	completewith	next
A	goto	1433/0,-1948.56,-9582.75
A	zone	Redridge Mountains
S	
A	target	Guard Parker
A	goto	1433/0,-1948.56,-9582.75
A	accept	244
S	
A	goto	1433/0,-2238.00,-9443.69
A	turnin	244
A	target	Deputy Feldon
S	
A	goto	Redridge Mountains,30.590,59.410
A	fp	Redridge Mountains
A	fly	Stormwind
A	target	Ariena Stormfeather
S	
A	goto	1453/0,625.48,-8857.76
A	turnin	61,1
A	link	https://www.youtube.com/watch?v=H-IwZ6P-ldY
A	target	Morgan Pestle
S	
T	ah	
A	goto	1453/0,660.28,-8814.55
A	collect	3172,3,418,1
A	collect	3173,3,418,1
A	collect	3174,3,418,1
A	collect	769,50,2178,1,0x20,cooking
A	disablecheckbox	
A	collect	2672,50,2178,1,0x20,cooking
A	disablecheckbox	
A	target	Auctioneer Jaxon
A	isQuestAvailable	418
A	skill	cooking,50,1
S	
T	ah	
T	optional	
A	goto	1453/0,660.28,-8814.55
A	collect	3172,3,418,1
A	collect	3173,3,418,1
A	collect	3174,3,418,1
A	target	Auctioneer Jaxon
A	isQuestAvailable	418
A	skill	cooking,<50,1
S	Warlock
T	completewith	next
A	goto	1453/0,988.44,-8942.15,20,0
A	goto	1453/0,1015.33,-8978.9,15
S	Warlock
A	goto	1453/0,1029.89,-8971.06
A	trainer	
A	target	Ursula Deline
S	Warlock
A	goto	1453/0,1041.54,-8983.29
A	turnin	1688
A	accept	1689
A	target	Gakin the Darkbinder
S	Warlock
T	completewith	next
A	goto	1453/0,1042.22,-9002.21,18,0
A	goto	1453/0,1069.1,-8991.45,18,0
A	goto	1453/0,1027.43,-8991.45,18,0
A	goto	1453/0,1042.83,-8972.68
A	cast	7728
A	use	6928
S	Warlock
A	goto	1453/0,1042.83,-8972.68
A	use	6928
A	complete	1689,1
A	mob	Summoned Voidwalker
S	Warlock
T	softcore	
T	completewith	next
S	Warlock
A	target	Gakin the Darkbinder
A	goto	1453/0,1041.54,-8983.29
A	turnin	1689
S	Warlock
T	softcore	
A	deathskip	
A	target	Spirit Healer
S	
A	goto	1429/0,74.02,-9465.52
A	zone	Elwynn Forest
S	Warlock
T	era	
A	isOnQuest	147
A	goto	1429/0,74.02,-9465.52
A	target	Marshal Dughan
A	turnin	147
A	turnin	39
S	Warlock
A	isOnQuest	147
A	goto	1429/0,74.02,-9465.52
A	target	Marshal Dughan
A	turnin	147
S	
T	era	
A	goto	1429/0,74.02,-9465.52
A	turnin	39
A	target	Marshal Dughan
S	Warrior
A	goto	1429/0,109.25,-9461.88
A	target	Lyria Du Lac
A	trainer	
S	Mage/Rogue/Priest
T	completewith	next
A	goto	1429/0,12.52,-9479.85,9
S	Mage
A	target	Zaldimar Wefhellt
A	goto	1429/0,34.28,-9471.61
A	trainer	
S	Rogue
A	target	Keryn Sylvius
A	goto	1429/0,12.69,-9465.75
A	trainer	
S	Priest
A	goto	1429/0,33.14,-9460.70
A	target	Priestess Josetta
A	trainer	
S	
A	target	Ma Stonefield
A	turnin	88
A	goto	Elwynn Forest,34.660,84.483
S	
A	target	"Auntie" Bernice Stonefield
A	turnin	86
A	goto	1429/0,338.47,-9889.67
A	isQuestComplete	86
S	
T	sticky	
A	abandon	86
S	Dwarf Paladin
A	collect	2589,10,1648,1
A	mob	Riverpaw Runt
A	mob	Riverpaw Outrunner
S	
T	completewith	WestEntry
A	goto	1436/0,918.42,-9851.50
A	zone	Westfall
S	
A	target	Farmer Furlbrow
A	goto	1436/0,918.42,-9851.50
A	turnin	184
A	isOnQuest	184
S	
T	label	WestEntry
A	accept	64
A	target	+Farmer Furlbrow
A	goto	1436/0,918.42,-9851.50
A	accept	151
A	accept	36
A	goto	1436/0,919.47,-9853.13
A	target	+Verna Furlbrow
S	
A	target	Farmer Saldean
A	goto	1436/0,1055.27,-10128.70
A	accept	9
S	
A	target	Salma Saldean
A	goto	1436/0,1042.67,-10111.670
A	turnin	36
A	accept	38
A	accept	22
S	
T	softcore	
T	sticky	
T	completewith	next
A	deathskip	
A	target	Spirit Healer
S	
T	era	
A	target	Gryan Stoutmantle
A	goto	1436/0,1045.12,-10508.80
A	turnin	109
A	accept	12
S	
A	target	Gryan Stoutmantle
A	goto	1436/0,1045.12,-10508.80
A	accept	12
S	
T	era	
A	target	Captain Danuvin
A	goto	1436/0,1041.97,-10511.13
A	accept	102
S	
A	target	Scout Galiaan
A	goto	1436/0,1126.67,-10636.670
A	accept	153
S	
A	goto	1436/0,1037.42,-10628.27
A	fp	Sentinel Hill
A	fly	Stormwind
A	target	Thor
S	!Paladin
A	hs	
S	Dwarf Paladin
A	goto	1453/0,558.96,-8382.54,25,0
A	goto	1453/0,520.64,-8351.460
A	zone	Ironforge
E
G	Guides/forever/Alliance-1-14_DwarfGnome.lua
M	era/som--h	
M	classic	
M	tbc	
M	season	0,1
M	version	1
M	selector	Alliance !Hunter
M	group	RestedXP Forever Guide (A)
M	subgroup	Speedrun Guide 1-20
M	name	12-14 Loch Modan (Dwarf/Gnome)
M	displayname	12-15 Loch Modan << SoD !Warlock
M	displayname	13-15 Loch Modan << SoD Warlock
M	next	13-15 Westfall;14-16 Darkshore
M	defaultfor	Gnome/Dwarf
S	Rogue
T	xprate	>1.49
T	ah	
A	goto	1453/0,609.63,-8787.71
A	collect	2027,1
A	target	Marda Weller
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.7
S	Rogue
T	xprate	>1.49
T	ssf	
A	goto	1453/0,609.63,-8787.71
A	collect	2027,1
A	money	<0.3815
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.7
A	target	Marda Weller
S	Rogue
T	xprate	>1.49
T	optional	
T	label	Scimitar1
T	completewith	KeenT
A	use	2027
A	itemcount	2027,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.7
A	xp	<14,1
S	Rogue
T	xprate	>1.49
T	optional	
T	requires	Scimitar1
T	completewith	KeenT
A	use	2027
A	itemcount	2027,1
A	itemStat	17,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.7
A	xp	<14,1
S	Rogue
T	optional	
T	ah	
A	goto	1453/0,607.38,-8790.45
A	collect	851,1
A	target	Gunther Weller
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.7
S	Rogue
T	optional	
T	ssf	
A	goto	1453/0,607.38,-8790.45
A	collect	851,1
A	target	Gunther Weller
A	money	<0.2023
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.7
S	Rogue
T	optional	
T	label	CutlassE
T	completewith	KeenT
A	use	851
A	itemcount	851,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.7
S	Rogue
T	optional	
T	requires	CutlassE
T	completewith	KeenT
A	use	2218
A	itemcount	2218,1
A	itemStat	17,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.7
S	Rogue
T	optional	
T	label	KeenT
A	goto	1453/0,596.43,-8831.70
A	collect	3107,200
A	target	Thurman Mullby
A	xp	<11,1
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.3
S	Rogue
T	optional	
A	goto	1453/0,596.43,-8831.70
A	collect	2946,200
A	target	Thurman Mullby
A	xp	>11,1
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.0
S	Rogue
T	optional	
A	use	3107
A	itemcount	3107,1
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.3
A	xp	<11,1
S	Rogue
T	optional	
A	use	2946
A	itemcount	2946,1
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.0
S	
T	xprate	1.49-1.59
A	goto	1453/0,490.03,-8835.82
A	fp	Stormwind
A	target	Dungar Longdrink
S	
T	xprate	>1.59
A	goto	1453/0,490.03,-8835.82
A	fp	Stormwind
A	target	Dungar Longdrink
A	dungeon	!DM
S	
T	season	0,1 << Paladin
T	xprate	>1.49
A	hs	
A	cooldown	item,6948,>180
A	zoneskip	Loch Modan
A	zoneskip	Wetlands
S	
T	season	0,1 << Paladin
T	xprate	>1.49
T	optional	
A	goto	1453/0,558.96,-8382.54,25,0
A	goto	1453/0,520.64,-8351.460
A	zone	Ironforge
A	zoneskip	Loch Modan
A	zoneskip	Dun Morogh
A	zoneskip	Wetlands
S	
T	season	0,1 << Paladin
T	xprate	>1.49
A	goto	1455/0,-1152.40,-4821.13
A	fly	Loch Modan
A	target	Gryth Thurden
A	zoneskip	Loch Modan
A	zoneskip	Dun Morogh
A	zoneskip	Wetlands
S	Dwarf Paladin
T	xprate	<1.5
T	optional	
T	completewith	next
A	goto	1455,35.239,32.789,20,0
A	goto	1455,27.208,12.552,20,0
A	goto	1455/0,-896.47,-4601.65,12
S	Dwarf Paladin
T	xprate	<1.5
A	goto	1455/0,-896.47,-4601.65
A	accept	2999
A	target	Brandur Ironhammer
S	Dwarf Paladin
T	xprate	<1.5
T	optional	
T	completewith	next
A	goto	1455,25.400,2.676,10,0
A	goto	1455,23.621,2.544,10,0
A	goto	1455,22.014,4.533,10,0
A	goto	1455,21.831,7.651,10,0
A	goto	1455,23.766,11.636,10,0
A	goto	1455,27.622,12.177,12
S	Dwarf Paladin
T	xprate	<1.5
A	goto	1455,27.622,12.177
A	turnin	2999
A	accept	1645
A	turnin	1645
A	target	Tiza Battleforge
S	Dwarf Paladin
T	xprate	<1.5
A	goto	1455,27.622,12.177
A	accept	1646
A	use	6916
S	Dwarf Paladin
T	xprate	<1.5
A	goto	1455,27.622,12.177
A	turnin	1646
A	accept	1647
A	target	Tiza Battleforge
S	Dwarf Paladin
T	xprate	<1.5
T	loop	
A	line	Ironforge,21.750,51.733,22.015,54.945,23.328,61.865,23.723,63.824,26.021,68.382,27.495,71.320,31.352,77.807,32.405,78.563,37.256,82.159,39.204,83.202,42.944,84.113
A	goto	1455,21.750,51.733,0
A	goto	1455,26.021,68.382,0
A	goto	1455,42.944,84.113,0
A	goto	1455,21.750,51.733,20,0
A	goto	1455,22.015,54.945,20,0
A	goto	1455,23.328,61.865,20,0
A	goto	1455,23.723,63.824,20,0
A	goto	1455,26.021,68.382,20,0
A	goto	1455,27.495,71.320,20,0
A	goto	1455,31.352,77.807,20,0
A	goto	1455,32.405,78.563,20,0
A	goto	1455,37.256,82.159,20,0
A	goto	1455,39.204,83.202,20,0
A	goto	1455,42.944,84.113,20,0
A	turnin	1647
A	accept	1648
A	turnin	1648
A	accept	1778
A	unitscan	John Turner
S	Dwarf Paladin
T	xprate	<1.5
T	optional	
T	label	Tiza1
T	completewith	Tiza2
A	goto	1455,27.228,12.724,15,0
A	goto	1455,25.400,2.676,12
S	Dwarf Paladin
T	xprate	<1.5
T	optional	
T	requires	Tiza1
T	completewith	Tiza2
A	goto	1455,25.400,2.676,10,0
A	goto	1455,23.621,2.544,10,0
A	goto	1455,22.014,4.533,10,0
A	goto	1455,21.831,7.651,10,0
A	goto	1455,23.766,11.636,10,0
A	goto	1455,27.622,12.177,12
S	Dwarf Paladin
T	xprate	<1.5
T	label	Tiza2
A	goto	1455,27.622,12.177
A	turnin	1778
A	accept	1779
A	target	Tiza Battleforge
S	Dwarf Paladin
T	xprate	<1.5
A	goto	1455/0,-899.70,-4613.0300
A	turnin	1779
A	accept	1783
A	target	Muiredon Battleforge
S	Paladin
T	xprate	<1.5
A	goto	1455/0,-1152.40,-4821.13
A	fly	Loch Modan
A	target	Gryth Thurden
A	zoneskip	Ironforge,1
S	
T	optional	
A	goto	1432/0,-2954.42,-5394.10
A	turnin	418
A	target	Vidra Hearthstove
A	isQuestComplete	418
S	
A	goto	1432/0,-2952.46,-5381.87
A	vendor	1682
A	target	Yanni Stoutheart
S	!Hunter
A	goto	1432/0,-2973.90,-5377.93
A	vendor	6734
A	vendor	6734
A	target	Innkeeper Hearthstove
S	Dwarf/Gnome
A	goto	1432/0,-3019.02,-5369.40,8,0
A	goto	1432/0,-3014.86,-5366.93
A	turnin	6392
A	target	Brock Stoneseeker
S	
T	optional	
T	label	BoarMeatLoch3
T	completewith	SilverMine
A	goto	1426,70.845,51.784,0
A	goto	1426,73.533,50.850,0
A	goto	1426,75.353,48.533,0
A	goto	1426,79.881,46.805,0
A	goto	1426,81.040,43.456,0
A	goto	1426,80.583,36.040,0
A	collect	769,10,2178,1,0x20,cooking
A	mob	Mountain Boar
A	skill	cooking,10,1
A	subzoneskip	146
A	subzoneskip	149
S	
T	optional	
T	requires	BoarMeatLoch3
T	completewith	SilverMine
A	goto	1426,70.845,51.784,0
A	goto	1426,73.533,50.850,0
A	goto	1426,75.353,48.533,0
A	goto	1426,79.881,46.805,0
A	goto	1426,81.040,43.456,0
A	goto	1426,80.583,36.040,0
A	collect	769,50,2178,1,0x20,cooking
A	mob	Mountain Boar
A	skill	cooking,50,1
A	subzoneskip	146
A	subzoneskip	149
S	
T	optional	
T	completewith	SilverMine
A	collect	3172,3,418,1
A	mob	+Mountain Boar
A	collect	3173,3,418,1
A	mob	+Elder Black Bear
A	collect	3174,3,418,1
A	mob	+Forest Lurker
A	subzoneskip	146
A	subzoneskip	149
S	
T	xprate	<1.59
T	completewith	Gear
T	optional	
T	loop	
A	goto	1432/0,-2684.71,-5042.87,0
A	goto	1432/0,-2712.57,-5286.61,0
A	goto	1432/0,-3033.92,-4797.29,0
A	waypoint	1432/0,-3033.92,-4797.29,50,0
A	waypoint	1432/0,-2972.41,-4796.92,50,0
A	waypoint	1432/0,-2684.71,-5042.87,50,0
A	waypoint	1432/0,-2712.57,-5286.61,50,0
A	complete	416,1
A	mob	Tunnel Rat Scout
A	mob	Tunnel Rat Vermin
A	mob	Tunnel Rat Forager
A	mob	Tunnel Rat Geomancer
A	mob	Tunnel Rat Digger
A	mob	Tunnel Rat Surveyor
S	
T	xprate	>1.59
T	completewith	Gear
A	goto	1432/0,-2684.71,-5042.87,0
A	goto	1432/0,-2712.57,-5286.61,0
A	goto	1432/0,-3033.92,-4797.29,0
A	waypoint	1432/0,-3033.92,-4797.29,50,0
A	waypoint	1432/0,-2972.41,-4796.92,50,0
A	waypoint	1432/0,-2684.71,-5042.87,50,0
A	waypoint	1432/0,-2712.57,-5286.61,50,0
A	complete	416,1
A	mob	Tunnel Rat Scout
A	mob	Tunnel Rat Vermin
A	mob	Tunnel Rat Forager
A	mob	Tunnel Rat Geomancer
A	mob	Tunnel Rat Digger
A	mob	Tunnel Rat Surveyor
S	
T	optional	
T	label	SilverMine
T	completewith	next
A	goto	1432/0,-2972.96,-4835.187,20
S	Paladin/Warrior/Priest/Mage
T	xprate	>1.49 << Mage
T	season	2 << Priest/Mage
A	goto	1432/0,-2984.82,-4902.33
A	complete	307,1
S	!Paladin !Warrior
T	season	0,1 << Priest/Mage
T	label	Gear
A	goto	1432/0,-2984.82,-4902.33
A	complete	307,1
S	Paladin/Warrior
T	ssf	
T	label	Gear
A	goto	1432/0,-3176.16,-4669.34
A	collect	4778,1,307,1
A	collect	4777,1,307,1
A	target	Nillen Andemar
A	itemcount	4778,<1
A	itemcount	4777,<1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.8
S	Paladin/Warrior
T	ah	
T	label	Gear
A	goto	1432/0,-3176.16,-4669.34
A	collect	4778,1,307,1
A	collect	4777,1,307,1
A	target	Nillen Andemar
A	itemcount	4778,<1
A	itemcount	4777,<1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.8
S	Paladin/Warrior
T	optional	
T	completewith	PawsDelivery
A	use	4778
A	itemcount	4778,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.5
A	xp	<14,1
S	Paladin/Warrior
T	optional	
T	completewith	PawsDelivery
A	use	4777
A	itemcount	4777,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.7
A	xp	<13,1
S	
T	xprate	>1.59
T	loop	
A	goto	1432/0,-2684.71,-5042.87,0
A	goto	1432/0,-2712.57,-5286.61,0
A	goto	1432/0,-3033.92,-4797.29,0
A	goto	1432/0,-3033.92,-4797.29,50,0
A	goto	1432/0,-2972.41,-4796.92,50,0
A	goto	1432/0,-2684.71,-5042.87,50,0
A	goto	1432/0,-2712.57,-5286.61,50,0
A	complete	416,1
A	mob	Tunnel Rat Scout
A	mob	Tunnel Rat Vermin
A	mob	Tunnel Rat Forager
A	mob	Tunnel Rat Geomancer
A	mob	Tunnel Rat Digger
A	mob	Tunnel Rat Surveyor
A	itemcount	3110,8
S	
T	xprate	<1.59
A	goto	1432/0,-2684.71,-5042.87,0
A	goto	1432/0,-2712.57,-5286.61,0
A	goto	1432/0,-3033.92,-4797.29,0
A	goto	1432/0,-3033.92,-4797.29,50,0
A	goto	1432/0,-2972.41,-4796.92,50,0
A	goto	1432/0,-2684.71,-5042.87,50,0
A	goto	1432/0,-2712.57,-5286.61,50,0
A	goto	1432/0,-3033.92,-4797.29,50,0
A	goto	1432/0,-2972.41,-4796.92
A	complete	416,1
A	mob	Tunnel Rat Scout
A	mob	Tunnel Rat Vermin
A	mob	Tunnel Rat Forager
A	mob	Tunnel Rat Geomancer
A	mob	Tunnel Rat Digger
A	mob	Tunnel Rat Surveyor
S	
T	optional	
T	label	BoarMeatLoch4
T	completewith	PawsDelivery
A	goto	1426,70.845,51.784,0
A	goto	1426,73.533,50.850,0
A	goto	1426,75.353,48.533,0
A	goto	1426,79.881,46.805,0
A	goto	1426,81.040,43.456,0
A	goto	1426,80.583,36.040,0
A	collect	769,10,2178,1,0x20,cooking
A	mob	Mountain Boar
A	skill	cooking,10,1
A	subzoneskip	925
S	
T	optional	
T	requires	BoarMeatLoch4
T	completewith	PawsDelivery
A	goto	1426,70.845,51.784,0
A	goto	1426,73.533,50.850,0
A	goto	1426,75.353,48.533,0
A	goto	1426,79.881,46.805,0
A	goto	1426,81.040,43.456,0
A	goto	1426,80.583,36.040,0
A	collect	769,50,2178,1,0x20,cooking
A	mob	Mountain Boar
A	skill	cooking,50,1
A	subzoneskip	925
S	
T	optional	
T	completewith	PawsDelivery
A	collect	3172,3,418,1
A	mob	+Mountain Boar
A	collect	3173,3,418,1
A	mob	+Elder Black Bear
A	collect	3174,3,418,1
A	mob	+Forest Lurker
A	subzoneskip	925
S	
T	optional	
T	completewith	next
A	goto	1432,23.490,18.008,15,0
A	goto	1432,24.279,17.959,12
S	
T	optional	
T	completewith	next
A	goto	1432/0,-2659.45,-4822.45
A	vendor	1362
A	target	Gothor Brumn
S	
T	label	PawsDelivery
A	goto	1432/0,-2676.99,-4825.980
A	turnin	307
A	turnin	353
A	target	Mountaineer Stormpike
S	
T	optional	
T	label	BoarMeatLoch5
T	completewith	RatAbandon
A	goto	1426,70.845,51.784,0
A	goto	1426,73.533,50.850,0
A	goto	1426,75.353,48.533,0
A	goto	1426,79.881,46.805,0
A	goto	1426,81.040,43.456,0
A	goto	1426,80.583,36.040,0
A	collect	769,10,2178,1,0x20,cooking
A	mob	Mountain Boar
A	skill	cooking,10,1
A	subzoneskip	144
A	subzoneskip	925
S	
T	optional	
T	requires	BoarMeatLoch5
T	completewith	RatAbandon
A	goto	1426,70.845,51.784,0
A	goto	1426,73.533,50.850,0
A	goto	1426,75.353,48.533,0
A	goto	1426,79.881,46.805,0
A	goto	1426,81.040,43.456,0
A	goto	1426,80.583,36.040,0
A	collect	769,50,2178,1,0x20,cooking
A	mob	Mountain Boar
A	skill	cooking,50,1
A	subzoneskip	144
A	subzoneskip	925
S	
A	collect	3173,3,418,1
A	mob	+Elder Black Bear
A	goto	1432/0,-2735.74,-4684.34,90,0
A	goto	1432/0,-2846.07,-4682.50,90,0
A	goto	1432/0,-2782.63,-4770.80,90,0
A	goto	1432/0,-2835.04,-4976.83,90,0
A	goto	1432/0,-2915.03,-5044.89,90,0
A	goto	1432/0,-3080.53,-5100.08,90,0
A	goto	1432/0,-2735.74,-4684.34,90,0
A	goto	1432/0,-2846.07,-4682.50,90,0
A	goto	1432/0,-2782.63,-4770.80,90,0
A	goto	1432/0,-2835.04,-4976.83,90,0
A	goto	1432/0,-2915.03,-5044.89,90,0
A	goto	1432/0,-3080.53,-5100.08,90,0
A	goto	1432/0,-2735.74,-4684.34
A	collect	3172,3,418,1
A	mob	+Mountain Boar
A	goto	1432/0,-3041.92,-5129.51,90,0
A	goto	1432/0,-3017.09,-5219.65,90,0
A	goto	1432/0,-2815.73,-5147.91,90,0
A	goto	1432/0,-2757.81,-4952.91,90,0
A	goto	1432/0,-2782.63,-4903.25,90,0
A	goto	1432/0,-3041.92,-5129.51,90,0
A	goto	1432/0,-3017.09,-5219.65,90,0
A	goto	1432/0,-2815.73,-5147.91,90,0
A	goto	1432/0,-2757.81,-4952.91,90,0
A	goto	1432/0,-2782.63,-4903.25,90,0
A	goto	1432/0,-3041.92,-5129.51
A	collect	3174,3,418,1
A	mob	+Forest Lurker
A	goto	1432/0,-2873.66,-4789.19,90,0
A	goto	1432/0,-2766.08,-4866.45,90,0
A	goto	1432/0,-2926.07,-5232.53,90,0
A	goto	1432/0,-2992.27,-5055.93,90,0
A	goto	1432/0,-3069.5,-5078.01,90,0
A	goto	1432/0,-2873.66,-4789.19,90,0
A	goto	1432/0,-2766.08,-4866.45,90,0
A	goto	1432/0,-2926.07,-5232.53,90,0
A	goto	1432/0,-2992.27,-5055.93,90,0
A	goto	1432/0,-3069.5,-5078.01,90,0
A	goto	1432/0,-2873.66,-4789.19
S	
T	xprate	<1.59
A	line	Loch Modan,36.72,41.97,37.24,43.19,37.33,45.63,36.77,46.20,35.19,46.88,32.67,49.71,35.19,46.88,36.77,46.20,37.33,45.63,37.24,43.19,36.72,41.97
A	goto	1432/0,-3006.61,-5259.57,15,0
A	goto	1432/0,-3020.95,-5282.02,15,0
A	goto	1432/0,-3023.44,-5326.90,15,0
A	goto	1432/0,-3007.99,-5337.390,15,0
A	goto	1432/0,-2964.41,-5349.90,15,0
A	goto	1432/0,-2894.90,-5401.96,20,0
A	goto	1432/0,-3007.99,-5337.390
A	target	Mountaineer Kadrell
A	turnin	416
S	
T	xprate	>1.59
A	line	Loch Modan,36.72,41.97,37.24,43.19,37.33,45.63,36.77,46.20,35.19,46.88,32.67,49.71,35.19,46.88,36.77,46.20,37.33,45.63,37.24,43.19,36.72,41.97
A	goto	1432/0,-3006.61,-5259.57,15,0
A	goto	1432/0,-3020.95,-5282.02,15,0
A	goto	1432/0,-3023.44,-5326.90,15,0
A	goto	1432/0,-3007.99,-5337.390,15,0
A	goto	1432/0,-2964.41,-5349.90,15,0
A	goto	1432/0,-2894.90,-5401.96,20,0
A	goto	1432/0,-3007.99,-5337.390
A	target	Mountaineer Kadrell
A	turnin	416
A	isQuestComplete	416
S	
T	xprate	>1.59
T	optional	
T	sticky	
T	label	RatAbandon
A	abandon	416
S	
T	optional	
T	completewith	FlintTinder
A	goto	1432,35.273,47.750,10,0
A	goto	1432,35.433,48.243,12
S	
A	goto	1432/0,-2954.42,-5394.10
A	turnin	418
A	target	Vidra Hearthstove
S	!Dwarf/!Paladin --XX Dwarf palas need to do class q
T	season	0,1 << Warrior/Mage --SoD warriors and mages need to do rune (Quick Strike, Living Bomb)
T	optional	
T	sticky	
T	label	DefenseAbandon
A	abandon	224
A	xp	<14,1
S	!Dwarf/!Paladin
T	season	0,1 << Warrior/Mage
T	optional	
T	sticky	
T	label	TroggAbandon
A	abandon	267
A	xp	<14,1
S	
T	label	FlintTinder
A	goto	1432/0,-2952.46,-5381.87
A	collect	4470,1
A	collect	4471,1
A	target	Yanni Stoutheart
A	skill	cooking,50,1
S	!Dwarf/!Paladin
T	optional	
T	requires	DefenseAbandon
S	!Dwarf/!Paladin
T	optional	
T	requires	TroggAbandon
S	
T	season	0,1 << Warrior/Mage
A	goto	1432/0,-2729.40,-5534.96
A	complete	224,1
A	mob	+Stonesplinter Trogg
A	complete	224,2
A	mob	+Stonesplinter Scout
A	complete	267,1
A	mob	+Stonesplinter Trogg
A	mob	+Stonesplinter Scout
A	isOnQuest	224
A	isOnQuest	267
S	
T	season	0,1 << Warrior/Mage
T	xprate	<1.5
T	optional	
A	goto	1432/0,-2729.40,-5534.96
A	xp	13+9600
S	
T	season	0,1 << Warrior
T	xprate	1.49-1.59
T	optional	
A	goto	1432/0,-2729.40,-5534.96
A	xp	13+8700
S	
T	season	0,1 << Warrior
T	xprate	>1.59
T	optional	
A	goto	1432/0,-2729.40,-5534.96
A	xp	13+7800
S	
T	optional	
T	completewith	next
A	goto	1432/0,-2677.26,-5778.34,10,0
A	goto	1432/0,-2648.30,-5876.75,15
S	
T	label	TroggEnd
A	goto	1432/0,-2634.59,-5842.81
A	turnin	267
A	target	Captain Rugelfuss
A	isQuestComplete	267 << !Dwarf/!Paladin
S	
A	goto	1432/0,-2602.54,-5832.73
A	turnin	224
A	target	Mountaineer Cobbleflint
A	isQuestComplete	224 << !Dwarf/!Paladin
S	!Dwarf/!Paladin
A	goto	1432/0,-2929.87,-5424.84
A	fly	Ironforge
A	target	Thorgrum Borrelson
S	Dwarf Paladin
T	optional	
T	completewith	next
A	goto	1432,21.498,67.840,20,0
A	goto	1432,21.388,66.357,20,0
A	goto	1432,21.106,65.007,20,0
A	goto	1432,20.749,64.326,20,0
A	goto	1432,19.594,62.735,20,0
A	goto	1432,16.342,58.520,20,0
A	goto	1426,84.262,51.367
A	zone	Dun Morogh
S	Dwarf Paladin
T	completewith	next
A	goto	1426/0,-2055.23,-5784.31
A	cast	8593
A	use	6866
A	target	Narm Faulk
S	Dwarf Paladin
A	goto	1426/0,-2055.23,-5784.31
A	turnin	1783
A	accept	1784
A	use	6866
A	target	Narm Faulk
S	Dwarf Paladin
A	goto	1426/0,-2004.94,-5863.50,20,0
A	goto	1426/0,-2031.04,-5905.53
A	complete	1784,1
A	mob	Dark Iron Spy
S	Mage/Priest/Warlock
T	xprate	<1.5
T	ssf	
A	goto	1455/0,-894.15,-4659.43,8,0
A	goto	1455/0,-880.66,-4660.39,5,0
A	goto	1455/0,-896.50,-4653.32
A	collect	5208,1
A	target	Harick Boulderdrum
A	money	<0.3340
A	itemcount	11288,<1
S	Mage
T	xprate	<1.5
A	goto	1455/0,-928.48,-4614.620
A	trainer	
A	target	Dink
S	Priest
T	xprate	<1.5
A	goto	1455/0,-912.88,-4625.99
A	trainer	
A	target	Toldren Deepiron
S	skip --logout skip << Mage/Priest
T	xprate	<1.5
T	optional	
T	completewith	Deeprun
A	goto	1455,27.611,8.074
A	goto	1455,76.414,51.226,20
S	Dwarf Rogue/Gnome Rogue
T	xprate	<1.5
T	season	0,1
T	optional	
T	sticky	
T	label	Salvation
A	goto	1455/0,-1124.38,-4647.53
A	turnin	2218
A	target	Hulfdan Blackbeard
A	isOnQuest	2218
S	Rogue
T	xprate	<1.5
A	goto	1455/0,-1120.72,-4650.120
A	trainer	
A	target	Fenthwick
S	Warlock
T	xprate	<1.5
A	goto	1455/0,-1117.60,-4615.14,15,0
A	goto	1455/0,-1111.62,-4599.09
A	trainer	
A	target	Briarthorn
S	Warlock/Rogue
T	xprate	<1.5
T	optional	
T	label	Jubahl
T	requires	Salvation << Dwarf Rogue/Gnome Rogue
T	completewith	Deeprun
A	goto	1455,53.164,7.037,10
S	Warlock
T	xprate	<1.5
A	goto	1455/0,-1130.26,-4601.270
A	vendor	6382
A	target	Jubahl Corpseseeker
S	skip --logout skip << Warlock/Rogue
T	xprate	<1.5
T	optional	
T	requires	Jubahl
T	completewith	Deeprun
A	goto	1455,52.825,5.060
A	goto	1455,76.414,51.226,20
S	Warrior
T	xprate	<1.5
T	optional	
T	completewith	Deeprun
A	goto	1455,67.400,84.909,15,0
A	goto	1455/0,-1234.65,-5035.67,12
S	Warrior
T	xprate	<1.5
A	goto	1455/0,-1234.65,-5035.67
A	trainer	
A	target	Bilban Tosslespanner
S	skip --logout skip << Warrior
T	xprate	<1.5
T	optional	
T	completewith	Deeprun
A	goto	1455,68.198,89.713
A	goto	1455,76.414,51.226,20
S	!Paladin
T	xprate	<1.5
T	requires	Salvation << Dwarf Rogue/Gnome Rogue
T	completewith	Fly2WF
A	goto	1455,67.842,42.456
A	vendor	5175
A	bronzetube	
A	target	Gearcutter Cogspinner
A	subzoneskip	2257
S	!Paladin
T	xprate	<1.5
T	optional	
T	requires	Salvation << Dwarf Rogue/Gnome Rogue
T	label	Deeprun
A	goto	1455/0,-1330.28,-4840.430
A	subzone	2257
A	zoneskip	Stormwind City
S	!Paladin
T	xprate	<1.5
T	optional	
T	label	WestfallTramCook1
T	completewith	WestfallTramEnd
A	cast	818
A	usespell	818
A	zoneskip	Stormwind City
A	itemcount	769,1
A	itemcount	2672,1
A	itemcount	4470,1
A	itemcount	4471,1
A	skill	cooking,50,1
S	!Paladin
T	xprate	<1.5
T	optional	
T	requires	WestfallTramCook1
T	label	WestfallTramCook2
T	completewith	WestfallTramEnd
A	cast	818
A	usespell	818
A	zoneskip	Stormwind City
A	itemcount	769,<1
A	itemcount	2672,1
A	itemcount	4470,1
A	itemcount	4471,1
A	skill	cooking,50,1
S	!Paladin
T	xprate	<1.5
T	optional	
T	requires	WestfallTramCook2
T	label	WestfallTramCook3
T	completewith	WestfallTramEnd
A	cast	818
A	usespell	818
A	zoneskip	Stormwind City
A	itemcount	769,1
A	itemcount	2672,<1
A	itemcount	4470,1
A	itemcount	4471,1
A	skill	cooking,50,1
S	!Paladin
T	xprate	<1.5
T	optional	
T	requires	WestfallTramCook3
T	label	WestfallTramCook4
T	completewith	WestfallTramEnd
A	usespell	2550
A	zoneskip	Stormwind City
A	itemcount	769,1
A	itemcount	2672,1
A	itemcount	4471,1
A	skill	cooking,50,1
S	!Paladin
T	xprate	<1.5
T	optional	
T	requires	WestfallTramCook4
T	label	WestfallTramCook5
T	completewith	WestfallTramEnd
A	usespell	2550
A	zoneskip	Stormwind City
A	itemcount	769,<1
A	itemcount	2672,1
A	itemcount	4471,1
A	skill	cooking,50,1
S	!Paladin
T	xprate	<1.5
T	optional	
T	requires	WestfallTramCook5
T	label	WestfallTramCook6
T	completewith	WestfallTramEnd
A	usespell	2550
A	zoneskip	Stormwind City
A	itemcount	769,1
A	itemcount	2672,<1
A	itemcount	4471,1
A	skill	cooking,50,1
S	!Paladin
T	xprate	<1.5
T	optional	
T	label	WestfallTramEnd
A	zone	Stormwind City
S	Dwarf Paladin
T	xprate	<1.5
T	completewith	PaladinTrainSW
A	hs	
S	Paladin
T	xprate	<1.5
T	ah	
A	goto	1453/0,660.28,-8814.55
A	collect	729,3,38,1
A	collect	730,3,38,1
A	collect	731,3,38,1
A	collect	732,3,38,1
A	collect	723,8,22,1
A	collect	5469,5,2178,1
A	collect	12238,6,1141,1
A	collect	769,50,2178,1,0x20,cooking
A	disablecheckbox	
A	collect	2672,50,2178,1,0x20,cooking
A	disablecheckbox	
A	target	Auctioneer Jaxon
A	skill	cooking,50,1
S	Paladin
T	xprate	<1.5
T	ah	
T	optional	
A	goto	1453/0,660.28,-8814.55
A	collect	729,3,38,1
A	collect	730,3,38,1
A	collect	731,3,38,1
A	collect	732,3,38,1
A	collect	723,8,22,1
A	collect	5469,5,2178,1
A	collect	12238,6,1141,1
A	target	Auctioneer Jaxon
A	skill	cooking,<50,1
S	Paladin
T	xprate	<1.5
T	optional	
T	completewith	next
A	goto	1453/0,809.52,-8579.22,20
S	Paladin
T	xprate	<1.5
T	label	PaladinTrainSW
A	goto	1453/0,859.13,-8559.14,10,0
A	goto	1453/0,861.14,-8573.03
A	trainer	
A	target	Arthur the Faithful
S	Paladin
T	xprate	<1.5
A	goto	1453/0,719.67,-8550.30
A	accept	399
A	target	Baros Alexston
S	
T	xprate	<1.5
T	completewith	Fly2WF
A	goto	1453/0,638.8,-8341.95
A	vendor	5519
A	bronzetube	
A	target	Billibub Cogspinner
S	!Paladin
T	xprate	<1.5
A	goto	1453/0,719.67,-8550.30
A	accept	399
A	target	Baros Alexston
S	Rogue
T	xprate	<1.5
T	ah	
A	goto	1453/0,609.63,-8787.71
A	collect	2027,1
A	target	Marda Weller
A	money	<0.3815
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.7
S	Rogue
T	xprate	<1.5
T	ssf	
A	goto	1453/0,609.63,-8787.71
A	collect	2027,1
A	money	<0.3815
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.7
A	target	Marda Weller
S	Rogue
T	xprate	<1.5
T	optional	
T	completewith	next
A	use	2027
A	itemcount	2027,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.69
A	xp	<14,1
S	Mage/Priest/Warlock
T	xprate	<1.5
T	ah	
T	sticky	
T	label	Wand1
A	goto	1453/0,660.28,-8814.55
A	collect	11288,1
A	target	Auctioneer Jaxon
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<17.5
S	!Paladin
T	xprate	<1.5
T	ah	
A	goto	1453/0,660.28,-8814.55
A	collect	729,3,38,1
A	collect	730,3,38,1
A	collect	731,3,38,1
A	collect	732,3,38,1
A	collect	723,8,22,1
A	collect	5469,5,2178,1
A	collect	12238,6,1141,1
A	collect	769,50,2178,1,0x20,cooking
A	disablecheckbox	
A	collect	2672,50,2178,1,0x20,cooking
A	disablecheckbox	
A	target	Auctioneer Jaxon
A	skill	cooking,50,1
S	!Paladin
T	xprate	<1.5
T	ah	
T	optional	
A	goto	1453/0,660.28,-8814.55
A	collect	729,3,38,1
A	collect	730,3,38,1
A	collect	731,3,38,1
A	collect	732,3,38,1
A	collect	723,8,22,1
A	collect	5469,5,2178,1
A	collect	12238,6,1141,1
A	target	Auctioneer Jaxon
A	skill	cooking,<50,1
S	Mage/Priest/Warlock
T	xprate	<1.5
T	ah	
T	requires	Wand1
T	optional	
A	use	11288
A	itemcount	11288,1
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<17.49
S	Mage/Priest/Warlock
T	xprate	<1.5
T	ah	
T	optional	
A	use	11288
A	itemcount	11288,1
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<17.49
S	Mage/Priest/Warlock
T	xprate	<1.5
T	ah	
T	optional	
A	goto	1453/0,807.64,-8880.84,14,0
A	goto	1453/0,804.55,-8862.47
A	collect	5208,1
A	target	Ardwyn Cailen
A	money	<0.3340
A	itemcount	11288,<1
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<17.4
S	Mage/Priest/Warlock
T	xprate	<1.5
T	ah	
T	optional	
A	use	5208
A	itemcount	5208,1
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<17.4
S	
T	xprate	<1.5
T	label	Fly2WF
A	goto	1453/0,490.03,-8835.82
A	fly	Westfall
A	target	Dungar Longdrink
S	skip --logout skip << Dwarf Paladin
T	xprate	>1.49
A	goto	1426/0,-1677.92,-5738.730,40,0
A	goto	1426/0,-1674.97,-5678.65
A	zone	Ironforge
A	link	https://www.youtube.com/watch?v=kbUSo62CfAM
S	Dwarf Rogue/Gnome Rogue
T	xprate	1.49-1.59
T	season	0,1
T	optional	
T	sticky	
T	label	Salvation
A	goto	1455/0,-1124.38,-4647.53
A	turnin	2218
A	target	Hulfdan Blackbeard
A	isOnQuest	2218
S	Rogue
T	xprate	>1.49
A	goto	1455/0,-1120.72,-4650.120
A	trainer	
A	target	Fenthwick
S	Rogue
T	xprate	>1.49
T	optional	
T	requires	Salvation
S	Warlock
T	xprate	>1.49
A	goto	1455/0,-1117.60,-4615.14,15,0
A	goto	1455/0,-1111.62,-4599.09
A	trainer	
A	target	Briarthorn
S	Warlock
T	xprate	>1.49
T	optional	
T	label	Jubahl
T	completewith	next
A	goto	1455,53.164,7.037,10
S	Warlock
T	xprate	>1.49
A	goto	1455/0,-1130.26,-4601.270
A	vendor	6382
A	target	Jubahl Corpseseeker
S	Dwarf Paladin
T	xprate	>1.49
T	optional	
T	completewith	next
A	goto	1455,25.400,2.676,10,0
A	goto	1455,23.621,2.544,10,0
A	goto	1455,22.014,4.533,10,0
A	goto	1455,21.831,7.651,10,0
A	goto	1455,23.766,11.636,10
S	Dwarf Paladin
T	xprate	>1.49
A	goto	1455/0,-899.70,-4613.0300
A	turnin	1784
A	accept	1785
A	target	Muiredon Battleforge
S	Dwarf Paladin
T	xprate	>1.49
A	goto	1455/0,-932.04,-4633.56
A	turnin	1785
A	target	Tiza Battleforge
S	Paladin
T	xprate	>1.49
A	goto	1455/0,-907.69,-4592.93
A	trainer	
A	target	Beldruk Doombrow
S	skip --logout skip << Paladin
T	xprate	>1.49
T	ssf	
T	hardcore	<< !Human
T	optional	
A	goto	1455,25.254,10.981
A	zone	Dun Morogh
S	Mage
T	xprate	>1.49
A	goto	1455/0,-928.48,-4614.620
A	trainer	
A	target	Dink
S	Priest
T	xprate	>1.49
A	goto	1455/0,-912.88,-4625.99
A	trainer	
A	target	Toldren Deepiron
S	Mage/Priest/Warlock
T	xprate	>1.49
T	ssf	
A	goto	1455/0,-894.15,-4659.43,8,0
A	goto	1455/0,-880.66,-4660.39,5,0
A	goto	1455/0,-896.50,-4653.32
A	collect	5208,1
A	target	Harick Boulderdrum
A	money	<0.3340
A	itemcount	11288,<1
S	Warrior
T	xprate	>1.49
T	optional	
T	completewith	Deeprun
A	goto	1455,67.400,84.909,15,0
A	goto	1455/0,-1234.65,-5035.67,12
S	Warrior
T	xprate	>1.49
A	goto	1455/0,-1234.65,-5035.67
A	trainer	
A	target	Bilban Tosslespanner
S	Warrior
T	xprate	>1.49
T	optional	
A	goto	1455/0,-1203.78,-5041.97
A	train	2567
A	target	Bixi Wobblebonk
S	skip --logout skip << Warrior
T	xprate	>1.49
T	optional	
T	ssf	
T	hardcore	<< !Human
T	completewith	next
A	goto	1455,48.046,83.707
A	zone	Dun Morogh
A	zoneskip	Ironforge,1
S	Rogue
T	xprate	>1.49
T	ah	
A	goto	1455,35.969,65.346
A	collect	2027,1
A	target	Brenwyn Wintersteel
A	itemStat	17,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.7
S	Rogue
T	xprate	>1.49
T	ssf	
A	goto	1455,35.969,65.346
A	collect	2027,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.7
A	target	Brenwyn Wintersteel
S	Rogue
T	xprate	>1.49
T	optional	
T	completewith	next
A	use	2027
A	itemcount	2027,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.69
A	xp	<14,1
S	skip --logout skip << Rogue
T	xprate	>1.49
T	ssf	
T	hardcore	<< !Human
T	completewith	LeaveIF
A	goto	1455,35.959,66.597
A	zone	Dun Morogh
S	Mage/Priest/Warlock
T	xprate	>1.49
T	ah	
T	sticky	
T	label	Wand1
A	goto	1455,33.225,64.648,0
A	goto	Ironforge,25.800,75.500,-1
A	goto	Ironforge,24.200,74.600,-1
A	goto	Ironforge,23.800,71.800,-1
A	collect	11288,1
A	target	Auctioneer Lympkin
A	target	Auctioneer Redmuse
A	target	Auctioneer Buckler
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<17.5
S	
T	xprate	>1.49
T	ah	
A	goto	1455,33.225,64.648,0
A	goto	Ironforge,25.800,75.500,-1
A	goto	Ironforge,24.200,74.600,-1
A	goto	Ironforge,23.800,71.800,-1
A	collect	5469,5,2178,1
A	collect	12238,6,1141,1
A	collect	769,50,2178,1,0x20,cooking
A	disablecheckbox	
A	collect	2672,50,2178,1,0x20,cooking
A	disablecheckbox	
A	target	Auctioneer Lympkin
A	target	Auctioneer Redmuse
A	target	Auctioneer Buckler
A	skill	cooking,50,1
S	
T	xprate	>1.49
T	ah	
T	optional	
A	goto	1455,33.225,64.648,0
A	goto	Ironforge,25.800,75.500,-1
A	goto	Ironforge,24.200,74.600,-1
A	goto	Ironforge,23.800,71.800,-1
A	collect	5469,5,2178,1
A	collect	12238,6,1141,1
A	target	Auctioneer Lympkin
A	target	Auctioneer Redmuse
A	target	Auctioneer Buckler
A	skill	cooking,<50,1
S	Mage/Priest/Warlock
T	xprate	>1.49
T	ah	
T	requires	Wand1
T	optional	
A	use	11288
A	itemcount	11288,1
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<17.49
S	skip --logout skip
T	xprate	>1.49
T	ah	
T	hardcore	<< !Human
T	optional	
A	goto	1455,33.220,64.649
A	zone	Dun Morogh
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,>17.49 << Mage/Priest/Warlock
S	Mage/Priest/Warlock
T	xprate	>1.49
T	ah	
T	optional	
A	goto	1455/0,-894.15,-4659.43,8,0
A	goto	1455/0,-880.66,-4660.39,5,0
A	goto	1455/0,-896.50,-4653.32
A	collect	5208,1
A	target	Harick Boulderdrum
A	itemcount	11288,<1
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<13.44
S	skip --logout skip << Mage/Priest/Warlock
T	xprate	>1.49
T	ah	
T	hardcore	<< !Human
T	optional	
A	goto	1455,23.197,16.959
A	zone	Dun Morogh
A	zoneskip	Ironforge,1
S	skip --logout skip << Mage/Priest/Warlock
T	xprate	>1.49
T	ssf	
T	hardcore	<< !Human
A	goto	1455,23.197,16.959
A	zone	Dun Morogh
A	zoneskip	Ironforge,1
S	Dwarf/Gnome
T	xprate	>1.49
T	softcore	
T	completewith	DarkshoreBoat
A	goto	1455/0,-1152.40,-4821.13
A	fly	Wetlands
A	target	Gryth Thurden
S	
T	xprate	>1.49
T	optional	
T	hardcore	<< !Human
A	goto	1426,53.042,35.383
A	zone	Dun Morogh
S	
T	xprate	>1.49
T	hardcore	
T	completewith	next
A	goto	1426/0,-1124.84,-5283.99,150
S	
T	xprate	>1.49
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
A	mob	Wetlands Crocolisk
A	mob	Young Wetlands Crocolisk
A	mob	Bluegill Raider
S	Human
T	xprate	>1.49
T	softcore	
T	label	WetlandsDS1
T	completewith	next
A	goto	1426,30.741,34.269,15,0
A	goto	1426,30.812,33.548,15,0
A	goto	1426,31.060,32.543,15,0
A	goto	1426,31.439,32.356,15,0
A	goto	1426,31.675,29.636,15,0
A	goto	1426,32.209,28.777,15,0
A	goto	1426,32.645,27.740,15,0
A	goto	1415,44.910,52.022,15,0
A	goto	1415,44.910,52.030,15
A	zoneskip	Wetlands
A	subzoneskip	207
S	Human
T	xprate	>1.49
T	softcore	
T	requires	WetlandsDS1
T	label	WetlandsDS2
T	completewith	next
A	goto	1415,44.733,51.882,-1
A	goto	1437,11.730,43.304,-1
A	deathskip	
A	isQuestAvailable	984
A	target	Spirit Healer
S	Human
T	xprate	>1.49
T	softcore	
T	optional	
T	requires	WetlandsDS2
T	completewith	next
A	goto	1437/0,-883.77,-3532.66,60
A	subzoneskip	150
S	
T	xprate	>1.49
A	goto	1437/0,-819.67,-3691.42,15,0
A	goto	1437/0,-807.26,-3716.22,15,0
A	goto	1437/0,-827.94,-3724.49,15,0
A	goto	1437,10.760,56.721
A	vendor	1448
A	target	Neal Allen
A	bronzetube	
A	money	<0.08
S	
T	xprate	>1.49
T	optional	
T	completewith	next
A	goto	1437,10.233,56.201,15
A	subzoneskip	2103,1
S	
T	xprate	>1.49
T	hardcore	<< !Human
A	goto	1437/0,-782.03,-3793.12
A	fp	Wetlands
A	target	Shellei Brondir
S	
T	xprate	>1.49
A	goto	1437/0,-718.35,-3701.89
A	vendor	1453
A	target	Dewin Shimmerdawn
S	
T	xprate	>1.49
T	optional	
T	label	DockTravel
T	completewith	next
A	goto	1437/0,-683.2,-3745.44,30,0
A	goto	1437/0,-580.23,-3726.15,15
A	zoneskip	Darkshore
S	
T	xprate	>1.49
T	optional	
T	requires	DockTravel
T	label	DarkshoreCook1
T	completewith	DarkshoreBoat
A	cast	818
A	usespell	818
A	zoneskip	Darkshore
A	itemcount	769,1
A	itemcount	2672,1
A	itemcount	4470,1
A	itemcount	4471,1
A	skill	cooking,50,1
S	
T	xprate	>1.49
T	optional	
T	requires	DarkshoreCook1
T	label	DarkshoreCook2
T	completewith	DarkshoreBoat
A	cast	818
A	usespell	818
A	zoneskip	Darkshore
A	itemcount	769,<1
A	itemcount	2672,1
A	itemcount	4470,1
A	itemcount	4471,1
A	skill	cooking,50,1
S	
T	xprate	>1.49
T	optional	
T	requires	DarkshoreCook2
T	label	DarkshoreCook3
T	completewith	DarkshoreBoat
A	cast	818
A	usespell	818
A	zoneskip	Darkshore
A	itemcount	769,1
A	itemcount	2672,<1
A	itemcount	4470,1
A	itemcount	4471,1
A	skill	cooking,50,1
S	
T	xprate	>1.49
T	optional	
T	requires	DarkshoreCook3
T	label	DarkshoreCook4
T	completewith	DarkshoreBoat
A	usespell	2550
A	zoneskip	Darkshore
A	itemcount	769,1
A	itemcount	2672,1
A	itemcount	4471,1
A	skill	cooking,50,1
S	
T	xprate	>1.49
T	optional	
T	requires	DarkshoreCook4
T	label	DarkshoreCook5
T	completewith	DarkshoreBoat
A	usespell	2550
A	zoneskip	Darkshore
A	itemcount	769,<1
A	itemcount	2672,1
A	itemcount	4471,1
A	skill	cooking,50,1
S	
T	xprate	>1.49
T	optional	
T	requires	DarkshoreCook5
T	label	DarkshoreCook6
T	completewith	DarkshoreBoat
A	usespell	2550
A	zoneskip	Darkshore
A	itemcount	769,1
A	itemcount	2672,<1
A	itemcount	4471,1
A	skill	cooking,50,1
S	
T	xprate	>1.49
T	label	DarkshoreBoat
A	goto	1437,4.370,56.762
A	zone	Darkshore
E
G	Guides/forever/Alliance-1-14_DwarfGnome.lua
M	xprate	<1.5
M	classic	
M	tbc	
M	season	0,1
M	era/som--h	
M	version	1
M	selector	Alliance Hunter
M	group	RestedXP Forever Guide (A)
M	subgroup	Speedrun Guide 1-20
M	name	6-11 Dun Morogh (Hunter)
M	displayname	6-11 Dun Morogh
M	next	11-13 Loch Modan (Hunter)
M	defaultfor	Dwarf Hunter
S	
T	completewith	ribs1
A	collect	769,4,317,1
A	collect	2886,6,384,1
A	mob	Crag Boar
A	mob	Large Crag Boar
S	
T	completewith	next
A	goto	1426/0,-499.17,-5644.37,30
S	
A	goto	1426/0,-499.17,-5644.37
A	turnin	420
A	target	Senir Whitebeard
S	
T	label	ribs1
A	target	Ragnar Thunderbrew
A	goto	1426/0,-504.05,-5596.27
A	accept	384
S	
A	target	Tannok Frosthammer
A	goto	1426/0,-523.35,-5590.82
A	turnin	2160
S	
A	target	Innkeeper Belm
A	goto	1426/0,-531.23,-5601.59
A	home	
S	
A	target	Tharek Blackstone
A	goto	1426/0,-464.45,-5573.78
A	accept	400
S	
A	goto	1426/0,-632.15,-5466.540
A	target	Pilot Bellowfiz
A	accept	317
S	
T	xprate	<1.5
A	target	Pilot Stonegear
A	goto	1426/0,-641.80,-5473.18
A	accept	313
S	
A	target	Beldin Steelgrill
A	goto	1426/0,-682.23,-5488.94
A	turnin	400
S	
A	target	Loslor Rudge
A	goto	1426/0,-664.55,-5499.710
A	accept	5541
S	!Paladin !Warrior !Rogue
A	goto	1426/0,-758.92,-5522.03,75,0
A	goto	1426/0,-734.29,-5646.80,75,0
A	goto	1426/0,-665.34,-5646.80,75,0
A	goto	1426/0,-655.49,-5548.30,75,0
A	goto	1426/0,-561.92,-5502.33,75,0
A	goto	1426/0,-571.77,-5416.97,75,0
A	goto	1426/0,-340.29,-5600.83,75,0
A	goto	1426/0,-758.92,-5522.03,75,0
A	goto	1426/0,-734.29,-5646.80,75,0
A	goto	1426/0,-665.34,-5646.80,75,0
A	goto	1426/0,-655.49,-5548.30,75,0
A	goto	1426/0,-561.92,-5502.33,75,0
A	goto	1426/0,-571.77,-5416.97,75,0
A	goto	1426/0,-340.29,-5600.83,75,0
A	goto	1426/0,-758.92,-5522.03,75,0
A	goto	1426/0,-734.29,-5646.80,75,0
A	goto	1426/0,-665.34,-5646.80,75,0
A	goto	1426/0,-655.49,-5548.30,75,0
A	goto	1426/0,-561.92,-5502.33,75,0
A	goto	1426/0,-571.77,-5416.97,75,0
A	goto	1426/0,-340.29,-5600.83,75,0
A	goto	1426/0,-758.92,-5522.03,0
A	goto	1426/0,-734.29,-5646.80,0
A	goto	1426/0,-665.34,-5646.80,0
A	goto	1426/0,-655.49,-5548.30,0
A	goto	1426/0,-561.92,-5502.33,0
A	goto	1426/0,-571.77,-5416.97,0
A	goto	1426/0,-340.29,-5600.83
A	complete	317,2
A	mob	+Young Black Bear
A	complete	317,1
A	mob	+Crag Boar
A	mob	+Large Crag Boar
A	collect	2886,6,384,1,1
A	mob	+Crag Boar
A	mob	+Large Crag Boar
S	
T	completewith	BoarRibs2
A	collect	2886,6,384,1
A	mob	Crag Boar
A	mob	Large Crag Boar
S	
A	target	Pilot Bellowfiz
A	goto	1426/0,-632.15,-5466.540
A	turnin	317
A	accept	318
S	
A	xp	6
S	
A	goto	Dun Morogh,45.810,53.039
A	trainer	
A	train	3044
A	target	Grif Wildheart
S	
A	goto	1426/0,-371.32,-5746.94
A	complete	5541,1
S	
A	target	Hegnar Rumbleshot
A	goto	1426/0,-197.47,-5932.45,50,0
A	goto	1426/0,-201.51,-6015.520
A	turnin	5541
S	
A	goto	1426/0,-201.51,-6015.520
A	collect	2509,1
A	money	<0.0414
A	target	Hegnar Rumbleshot
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.95
S	
T	completewith	next
A	use	2509
A	itemcount	2509,1
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.94
S	
T	xprate	<1.5
A	goto	1426/0,-278.73,-5639.58,40,0
A	goto	1426/0,-220.61,-5487.23,50,0
A	goto	1426/0,-278.73,-5639.58
A	complete	313,1
A	mob	Wendigo
A	mob	Young Wendigo
S	
A	xp	7
S	
A	target	Tundra MacGrann
A	goto	1426/0,-315.67,-5433.38,60,0
A	goto	1426/0,-148.22,-5482.63,60,0
A	goto	1426/0,99.17,-5572.99
A	accept	312
S	
A	goto	1426/0,-94.88,-5647.69
A	link	https://www.youtube.com/watch?v=o55Y3LjgKoE
A	complete	312,1
S	
A	target	Tundra MacGrann
A	goto	1426/0,99.17,-5572.99
A	turnin	312
S	
T	completewith	next
A	goto	1426/0,302.27,-5387.58
A	vendor	
A	target	Keeg Gibn
S	
A	target	Rejold Barleybrew
A	goto	Dun Morogh,30.190,45.726
A	turnin	318
A	accept	319
A	accept	315
S	
T	label	BoarRibs2
A	target	Marleth Barleybrew
A	goto	1426/0,315.42,-5372.02
A	accept	310
S	
T	completewith	next
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
A	goto	1426/0,388.61,-5311.90
A	complete	319,1
A	mob	+Ice Claw Bear
A	complete	319,2
A	mob	+Elder Crag Boar
A	complete	319,3
A	mob	+Snow Leopard
S	
T	xprate	<1.5
A	goto	1426/0,-499.17,-5644.37
A	complete	384,1
A	xp	8-1400
S	
T	xprate	>1.49
A	goto	1426/0,-499.17,-5644.37
A	complete	384,1
A	xp	8-2100
S	
T	softcore	
A	goto	1426/0,309.81,-5108.33,60
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
A	goto	1437/0,-869.29,-3344.13,0
A	deathskip	
A	target	Spirit Healer
S	
T	softcore	
T	completewith	next
A	goto	1437/0,-914.78,-3435.09,30
S	
T	softcore	
A	goto	Wetlands,9.490,59.693
A	fp	Wetlands
A	target	Shellei Brondir
S	
T	softcore	
T	completewith	next
A	hs	
S	
T	hardcore	
T	completewith	next
A	goto	1426/0,-641.80,-5473.18,60
S	
T	xprate	<1.5
A	target	Pilot Stonegear
A	goto	1426/0,-641.80,-5473.18
A	turnin	313
S	
A	goto	1426/0,-531.23,-5601.59
A	complete	384,2
A	collect	2686,1,311
A	target	Innkeeper Belm
S	
T	completewith	next
A	goto	1426/0,-551.03,-5598.40,6,0
A	goto	1426/0,-544.38,-5605.92,3,0
A	turnin	308
A	target	Jarven Thunderbrew
S	
A	goto	1426/0,-547.93,-5607.27
A	turnin	310
A	accept	311
S	
A	target	Ragnar Thunderbrew
A	goto	1426/0,-504.05,-5596.27
A	turnin	384
S	
A	target	Senir Whitebeard
A	goto	1426/0,-499.17,-5644.37
A	accept	287
S	Hunter
A	goto	Dun Morogh,45.810,53.039
A	trainer	
A	train	5116
A	target	Grif Wildheart
S	
T	optional	
T	completewith	FinishShimmerweed
A	complete	319,1
A	mob	+Ice Claw Bear
A	complete	319,2
A	mob	+Elder Crag Boar
A	complete	319,3
A	mob	+Snow Leopard
S	
T	completewith	Rudra
T	label	Dirt
A	goto	1426/0,-1145.04,-5504.30,40,0
A	goto	1426/0,-1219.90,-5422.55,40
A	isQuestAvailable	314
S	
T	completewith	next
T	requires	Dirt
A	link	https://youtu.be/Zg4FNWw-P5k?t=3815
A	link	https://www.youtube.com/watch?v=ZJX6sCkm5JY
A	mob	Vagash
S	
T	label	Rudra
A	goto	1426/0,-1304.71,-5513.86
A	accept	314
A	target	Rudra Amberstill
S	Hunter
T	season	2
T	completewith	next
A	collect	206169,1
A	train	410123,1
S	
A	goto	1426,62.094,47.154,40,0
A	goto	1426,62.434,48.989,40,0
A	goto	1426,62.538,46.195
A	link	https://youtu.be/Zg4FNWw-P5k?t=3815
A	link	https://www.youtube.com/watch?v=ZJX6sCkm5JY
A	complete	314,1
A	mob	Vagash
S	Hunter
T	season	2
A	train	410123
A	use	206169
A	itemcount	206169,1
S	
A	target	Rudra Amberstill
A	goto	1426/0,-1304.71,-5513.86
A	turnin	314
S	
A	goto	1426/0,-1600.30,-5726.590
A	target	Foreman Stonebrow
A	accept	432
S	
T	loop	
A	goto	1426/0,-1522.29,-5827.38,40,0
A	goto	1426/0,-1655.27,-5768.28,40,0
A	goto	1426/0,-1522.29,-5827.38,0
A	goto	1426/0,-1655.27,-5768.28,0
A	complete	432,1
A	mob	Rockjaw Skullthumper
S	
A	goto	1426/0,-1600.30,-5726.590
A	target	Foreman Stonebrow
A	turnin	432
S	
A	target	Pilot Hammerfoot
A	goto	1426/0,-2329.60,-5163.76
A	accept	419
S	
A	goto	1426/0,-2121.76,-5064.70
A	turnin	419
A	accept	417
S	
A	goto	1426/0,-2087.19,-5096.51
A	complete	417,1
A	mob	Mangeclaw
S	
A	target	Pilot Hammerfoot
A	goto	1426/0,-2329.60,-5163.76
A	turnin	417
S	
T	hardcore	
A	hs	
S	
T	softcore	
A	goto	1426/0,-518.08,-5683.25
A	deathskip	
A	target	Spirit Healer
S	
T	xprate	>1.49
A	xp	10
S	Hunter
T	xprate	>1.49
A	goto	Dun Morogh,45.810,53.039
A	target	Grif Wildheart
A	accept	6064
S	Hunter
T	xprate	>1.49
A	goto	1426/0,-576.69,-5745.30
A	complete	6064,1
A	mob	Large Crag Boar
S	Hunter
T	xprate	>1.49
A	goto	Dun Morogh,45.810,53.039
A	turnin	6064
A	target	Grif Wildheart
A	accept	6084
S	Hunter
T	xprate	>1.49
A	goto	1426/0,-630.87,-5827.38
A	complete	6084,1
A	mob	Snow Leopard
S	Hunter
T	xprate	>1.49
A	goto	Dun Morogh,45.810,53.039
A	turnin	6084
A	target	Grif Wildheart
A	accept	6085
S	Hunter
T	xprate	>1.49
A	goto	1426/0,-680.12,-5837.23
A	complete	6085,1
A	mob	Ice Claw Bear
S	Hunter
T	xprate	>1.49
A	goto	Dun Morogh,45.810,53.039
A	turnin	6085
A	target	Grif Wildheart
A	accept	6086
S	
T	xprate	<1.5
A	target	Razzle Sprysprocket
A	goto	1426/0,-463.66,-5474.00,10,0
A	goto	1426/0,-455.83,-5497.90
A	accept	412
S	
T	completewith	next
A	goto	1426/0,-320.59,-5354.58,20,0
A	goto	1426/0,-271.34,-5367.72,20
S	
T	label	FinishShimmerweed
A	goto	1426/0,-212.24,-5364.43,50,0
A	goto	1426/0,-241.79,-5308.62,50,0
A	goto	1426/0,-153.14,-5190.42,50,0
A	goto	1426/0,-271.34,-5003.27,50,0
A	goto	1426/0,-153.14,-5190.42,50,0
A	goto	1426/0,-241.79,-5308.62,50,0
A	goto	1426/0,-212.24,-5364.43
A	goto	1426/0,-143.29,-5288.92,0
A	goto	1426/0,-241.79,-5059.08,0
A	complete	315,1
A	mob	Frostmane Seer
S	Hunter
T	optional	
T	season	2
T	completewith	next
A	goto	1426/0,381.12,-5514.12
A	collect	206155,1
A	mob	Rustling Bush
A	mob	Razormane Poacher
A	train	410113,1
S	
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
A	goto	1426/0,388.61,-5311.90
A	complete	319,1
A	mob	+Ice Claw Bear
A	complete	319,2
A	mob	+Elder Crag Boar
A	complete	319,3
A	mob	+Snow Leopard
S	Hunter
T	season	2
A	goto	1426/0,381.12,-5514.12
A	collect	206155,1
A	mob	Rustling Bush
A	mob	Razormane Poacher
A	train	410113,1
S	Hunter
T	season	2
A	cast	402265
A	use	206155
A	train	410113,1
S	
A	target	Rejold Barleybrew
A	goto	1426/0,315.28,-5378.39
A	turnin	319
A	accept	320
S	
A	target	Rejold Barleybrew
A	goto	1426/0,315.28,-5378.39
A	turnin	315
A	accept	413
S	
A	target	Marleth Barleybrew
A	goto	1426/0,315.42,-5372.02
A	turnin	311
S	
T	completewith	next
A	goto	1426/0,595.02,-5546.03,20
S	
T	sticky	
T	label	explore
A	goto	1426/0,676.23,-5589.67
A	complete	287,2
S	
A	goto	1426/0,595.46,-5545.02,40,0
A	goto	1426/0,713.66,-5528.60,40,0
A	goto	1426/0,753.06,-5613.97,40,0
A	goto	1426/0,595.46,-5545.02,0
A	goto	1426/0,713.66,-5528.60,0
A	goto	1426/0,753.06,-5613.97,0
A	complete	287,1
A	mob	Frostmane Headhunter
S	
T	requires	explore
T	xprate	<1.5
A	goto	1426/0,462.48,-5288.92,60,0
A	goto	1426/0,580.68,-5167.43,60,0
A	goto	1426/0,541.28,-5302.05,60,0
A	goto	1426/0,605.31,-5321.75,60,0
A	goto	1426/0,551.13,-5367.72,60,0
A	goto	1426/0,570.83,-5305.330
A	complete	412,2
A	complete	412,1
A	mob	Leper Gnome
S	
T	xprate	<1.5
A	xp	10-1470
S	
T	requires	explore
T	hardcore	
T	completewith	KharanosTurnins
A	goto	1426/0,-497.89,-5640.23,200
S	
T	requires	explore
T	completewith	next
T	softcore	
A	deathskip	
S	
T	requires	explore
T	label	KharanosTurnins
A	target	Senir Whitebeard
A	goto	1426/0,-499.17,-5644.37
A	turnin	287
A	accept	291
S	
T	xprate	<1.5
A	goto	1426/0,-463.66,-5474.00,8,0
A	goto	1426/0,-455.83,-5497.90
A	target	Razzle Sprysprocket
A	turnin	412
S	
A	target	Pilot Bellowfiz
A	goto	1426/0,-632.15,-5466.540
A	turnin	320
A	isOnQuest	320
S	Hunter
T	xprate	<1.5
A	goto	Dun Morogh,45.810,53.039
A	target	Grif Wildheart
A	accept	6064
S	Hunter
T	xprate	<1.5
A	goto	1426/0,-576.69,-5745.30
A	complete	6064,1
A	mob	Large Crag Boar
S	Hunter
T	xprate	<1.5
A	goto	Dun Morogh,45.810,53.039
A	turnin	6064
A	target	Grif Wildheart
A	accept	6084
S	Hunter
T	xprate	<1.5
A	goto	1426/0,-630.87,-5827.38
A	complete	6084,1
A	mob	Snow Leopard
S	Hunter
T	xprate	<1.5
A	goto	Dun Morogh,45.810,53.039
A	turnin	6084
A	target	Grif Wildheart
A	accept	6085
S	Hunter
T	xprate	<1.5
A	goto	1426/0,-680.12,-5837.23
A	complete	6085,1
A	mob	Ice Claw Bear
S	Hunter
T	xprate	<1.5
A	goto	Dun Morogh,45.810,53.039
A	turnin	6085
A	target	Grif Wildheart
A	accept	6086
S	
T	completewith	next
A	goto	1426/0,-1571.54,-5669.78,60
S	
A	goto	1426/0,-1579.96,-5714.73
A	accept	433
A	target	Senator Mehr Stonehallow
S	
A	goto	1426/0,-1679.89,-5728.88,40,0
A	goto	1426/0,-1675.95,-5597.22,25,0
A	goto	1426/0,-1679.89,-5728.88
A	complete	433,1
A	mob	+Rockjaw Bonesnapper
S	
A	goto	1426/0,-1600.30,-5726.590
A	turnin	433
A	target	+Senator Mehr Stonehallow
A	goto	1426/0,-1579.96,-5714.73
S	skip
A	goto	1426/0,-1566.62,-5666.50
A	train	2550
S	
A	target	Mountaineer Barleybrew
A	goto	1426/0,-2118.22,-5541.73,50,0
A	goto	1426/0,-2251.19,-5633.67,25,0
A	goto	1426/0,-2447.11,-5479.74
A	turnin	413
A	accept	414
E
G	Guides/forever/Alliance-1-14_DwarfGnome.lua
M	classic	
M	tbc	
M	season	0,1
M	era/som--h	
M	version	1
M	selector	Alliance Hunter
M	group	RestedXP Forever Guide (A)
M	subgroup	Speedrun Guide 1-20
M	name	11-13 Loch Modan (Hunter)
M	displayname	11-13 Loch Modan << !SoD
M	displayname	12-15 Loch Modan << SoD
M	next	14-16 Darkshore
M	defaultfor	Dwarf
S	
T	completewith	next
A	goto	1426/0,-2443.41,-5560.120,15,0
A	goto	1432/0,-2602.54,-5832.73,20
A	zoneskip	Loch Modan
S	
A	target	Mountaineer Cobbleflint
A	goto	1432/0,-2602.54,-5832.73
A	accept	224
S	
A	goto	1432/0,-2634.59,-5842.81
A	target	Captain Rugelfuss
A	accept	267
S	
T	sticky	
A	line	Loch Modan,36.72,41.97,37.24,43.19,37.33,45.63,36.77,46.20,35.19,46.88,32.67,49.71,35.19,46.88,36.77,46.20,37.33,45.63,37.24,43.19,36.72,41.97
A	goto	1432/0,-3006.61,-5259.57,15,0
A	goto	1432/0,-3020.95,-5282.02,15,0
A	goto	1432/0,-3023.44,-5326.90,15,0
A	goto	1432/0,-3007.99,-5337.390,15,0
A	goto	1432/0,-2964.41,-5349.90,15,0
A	goto	1432/0,-2894.90,-5401.96,20,0
A	goto	1432/0,-3007.99,-5337.390
A	turnin	-414
A	accept	416
A	accept	1339
A	target	Mountaineer Kadrell
S	
A	target	Vidra Hearthstove
A	goto	1432/0,-2954.42,-5394.10
A	accept	418
S	
A	goto	1432/0,-2973.90,-5377.93
A	home	
A	target	Innkeeper Hearthstove
S	
A	goto	1432/0,-3019.02,-5369.40,8,0
A	goto	1432/0,-3014.86,-5366.93
A	accept	6387
A	target	Brock Stoneseeker
S	
A	target	Thorgrum Borrelson
A	goto	1432/0,-2929.87,-5424.84
A	turnin	6387
A	accept	6391
S	
A	goto	1432/0,-2929.87,-5424.84
A	fly	Ironforge
A	target	Thorgrum Borrelson
S	
A	target	Golnir Bouldertoe
A	goto	1455/0,-1120.93,-4708.06
A	turnin	6391
A	accept	6388
S	
A	target	Senator Barin Redstone
A	goto	1455/0,-1058.62,-4836.37,20,0
A	goto	Ironforge,39.550,57.490
A	turnin	291
A	isOnQuest	291
S	Hunter
A	goto	1455/0,-1273.83,-5022.08
A	target	Belia Thundergranite
A	turnin	6086
S	Hunter
A	target	Gryth Thurden
A	goto	1455/0,-1152.40,-4821.13
A	turnin	6388
A	accept	6392
S	
A	goto	1455/0,-1152.40,-4821.13
A	fly	Loch Modan
A	target	Gryth Thurden
S	
A	goto	1432/0,-3019.02,-5369.40,8,0
A	goto	1432/0,-3014.86,-5366.93
A	turnin	6392
A	target	Brock Stoneseeker
S	Hunter
A	goto	1432/0,-2982.01,-5286.93
A	collect	2511,1
A	money	<0.1300
A	target	Vrok Blunderblast
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<5.00
S	Hunter
T	completewith	next
A	use	2511
A	itemcount	2511,1
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.99
S	
T	completewith	BraveSoul
A	collect	3172,3,418,1
A	mob	+Mountain Boar
A	collect	3173,3,418,1
A	mob	+Elder Black Bear
A	collect	3174,3,418,1
A	mob	+Forest Lurker
S	
T	completewith	next
A	goto	1432/0,-2651.61,-4817.15,100
S	
A	goto	1432/0,-2676.99,-4825.980
A	turnin	1339
A	accept	1338
A	accept	307
A	target	Mountaineer Stormpike
A	dungeon	DM << Human
S	Human
T	xprate	<1.59
A	goto	1432/0,-2676.99,-4825.980
A	turnin	1339
A	accept	1338
A	accept	307
A	target	Mountaineer Stormpike
A	dungeon	!DM
S	Human
T	xprate	>1.59
A	goto	1432/0,-2676.99,-4825.980
A	turnin	1339
A	accept	307
A	target	Mountaineer Stormpike
A	dungeon	!DM
S	
T	label	BraveSoul
T	completewith	next
A	goto	1432/0,-2972.96,-4835.187,20
S	
A	goto	1432/0,-2984.82,-4902.33
A	complete	307,1
S	
T	completewith	RatEar
A	collect	3172,3,418,1
A	mob	+Mountain Boar
A	collect	3173,3,418,1
A	mob	+Elder Black Bear
A	collect	3174,3,418,1
A	mob	+Forest Lurker
S	
A	goto	1432/0,-2676.99,-4825.980
A	turnin	307
A	target	Mountaineer Stormpike
S	
T	label	RatEar
A	goto	1432/0,-2684.71,-5042.87,0
A	goto	1432/0,-2712.57,-5286.61,0
A	goto	1432/0,-3033.92,-4797.29,0
A	goto	1432/0,-3033.92,-4797.29,50,0
A	goto	1432/0,-2972.41,-4796.92,50,0
A	goto	1432/0,-2684.71,-5042.87,50,0
A	goto	1432/0,-2712.57,-5286.61,50,0
A	goto	1432/0,-3033.92,-4797.29,50,0
A	goto	1432/0,-2972.41,-4796.92
A	complete	416,1
A	mob	Tunnel Rat Scout
A	mob	Tunnel Rat Vermin
A	mob	Tunnel Rat Forager
A	mob	Tunnel Rat Geomancer
A	mob	Tunnel Rat Digger
A	mob	Tunnel Rat Surveyor
S	
A	collect	3173,3,418,1
A	mob	+Elder Black Bear
A	goto	1432/0,-2735.74,-4684.34,90,0
A	goto	1432/0,-2846.07,-4682.50,90,0
A	goto	1432/0,-2782.63,-4770.80,90,0
A	goto	1432/0,-2835.04,-4976.83,90,0
A	goto	1432/0,-2915.03,-5044.89,90,0
A	goto	1432/0,-3080.53,-5100.08,90,0
A	goto	1432/0,-2735.74,-4684.34,90,0
A	goto	1432/0,-2846.07,-4682.50,90,0
A	goto	1432/0,-2782.63,-4770.80,90,0
A	goto	1432/0,-2835.04,-4976.83,90,0
A	goto	1432/0,-2915.03,-5044.89,90,0
A	goto	1432/0,-3080.53,-5100.08,90,0
A	goto	1432/0,-2735.74,-4684.34
A	collect	3172,3,418,1
A	mob	+Mountain Boar
A	goto	1432/0,-3041.92,-5129.51,90,0
A	goto	1432/0,-3017.09,-5219.65,90,0
A	goto	1432/0,-2815.73,-5147.91,90,0
A	goto	1432/0,-2757.81,-4952.91,90,0
A	goto	1432/0,-2782.63,-4903.25,90,0
A	goto	1432/0,-3041.92,-5129.51,90,0
A	goto	1432/0,-3017.09,-5219.65,90,0
A	goto	1432/0,-2815.73,-5147.91,90,0
A	goto	1432/0,-2757.81,-4952.91,90,0
A	goto	1432/0,-2782.63,-4903.25,90,0
A	goto	1432/0,-3041.92,-5129.51
A	collect	3174,3,418,1
A	mob	+Forest Lurker
A	goto	1432/0,-2873.66,-4789.19,90,0
A	goto	1432/0,-2766.08,-4866.45,90,0
A	goto	1432/0,-2926.07,-5232.53,90,0
A	goto	1432/0,-2992.27,-5055.93,90,0
A	goto	1432/0,-3069.5,-5078.01,90,0
A	goto	1432/0,-2873.66,-4789.19,90,0
A	goto	1432/0,-2766.08,-4866.45,90,0
A	goto	1432/0,-2926.07,-5232.53,90,0
A	goto	1432/0,-2992.27,-5055.93,90,0
A	goto	1432/0,-3069.5,-5078.01,90,0
A	goto	1432/0,-2873.66,-4789.19
S	
T	sticky	
A	line	Loch Modan,36.72,41.97,37.24,43.19,37.33,45.63,36.77,46.20,35.19,46.88,32.67,49.71,35.19,46.88,36.77,46.20,37.33,45.63,37.24,43.19,36.72,41.97
A	goto	1432/0,-3006.61,-5259.57,15,0
A	goto	1432/0,-3020.95,-5282.02,15,0
A	goto	1432/0,-3023.44,-5326.90,15,0
A	goto	1432/0,-3007.99,-5337.390,15,0
A	goto	1432/0,-2964.41,-5349.90,15,0
A	goto	1432/0,-2894.90,-5401.96,20,0
A	goto	1432/0,-3007.99,-5337.390
A	target	Mountaineer Kadrell
A	turnin	416
S	
A	target	Vidra Hearthstove
A	goto	1432/0,-2954.42,-5394.10
A	turnin	418
S	
A	goto	1432/0,-2738.78,-5384.11,0
A	goto	1432/0,-2757.26,-5532.94,0
A	goto	1432/0,-2913.65,-5804.46,0
A	goto	1432/0,-2863.73,-5866.45,0
A	goto	1432/0,-2738.78,-5384.11,40,0
A	goto	1432/0,-2757.26,-5532.94,40,0
A	goto	1432/0,-2913.65,-5804.46,40,0
A	goto	1432/0,-2863.73,-5866.45,40,0
A	goto	1432/0,-2928.27,-5896.25
A	complete	224,1
A	mob	+Stonesplinter Trogg
A	complete	224,2
A	mob	+Stonesplinter Scout
A	complete	267,1
A	mob	+Stonesplinter Trogg
A	mob	+Stonesplinter Scout
S	
A	target	Mountaineer Cobbleflint
A	goto	1432/0,-2602.54,-5832.73
A	turnin	224
S	
A	target	Captain Rugelfuss
A	goto	1432/0,-2634.59,-5842.81
A	turnin	267
S	
T	xprate	<1.5
T	completewith	next
A	goto	1432/0,-3783.63,-5713.77,80
S	
T	xprate	<1.5
A	goto	1432/0,-3812.43,-5694.67
A	accept	298
A	target	Prospector Ironband
S	
T	xprate	<1.5
T	completewith	next
A	goto	1432/0,-4280.96,-5579.66,80,0
A	goto	1432/0,-4290.89,-5645.89,25
S	
T	xprate	<1.5
A	accept	257
A	goto	1432/0,-4296.68,-5690.590
A	target	Daryl the Youngling
S	
T	xprate	<1.5
A	goto	1432/0,-4202.90,-5667.78,60,0
A	goto	1432/0,-4122.08,-5877.67,60,0
A	goto	1432/0,-3946.10,-5828.74,60,0
A	goto	1432/0,-4108.01,-5633.01,60,0
A	goto	1432/0,-4100.01,-5518.59,60,0
A	goto	1432/0,-4202.90,-5667.78,60,0
A	goto	1432/0,-4122.08,-5877.67,60,0
A	goto	1432/0,-3946.10,-5828.74,60,0
A	goto	1432/0,-4108.01,-5633.01,60,0
A	goto	1432/0,-4100.01,-5518.59,60,0
A	goto	1432/0,-4202.90,-5667.78
A	complete	257,1
A	mob	Mountain Buzzard
S	
T	xprate	<1.5
A	goto	1432/0,-4296.68,-5690.590
A	turnin	257
A	target	Daryl the Youngling
S	
T	xprate	<1.5
A	goto	1432/0,-4269.26,-5653.23
A	collect	4470,1
A	collect	4471,1
A	target	Xandar Goodbeard
A	skill	cooking,50,1
S	
T	xprate	<1.5
T	hardcore	
A	hs	
S	
T	xprate	<1.5
T	softcore	
T	completewith	next
A	deathskip	
A	target	Spirit Healer
S	
T	xprate	<1.5
A	goto	1432/0,-3019.02,-5369.40,8,0
A	goto	1432/0,-3020.95,-5359.09
A	turnin	298
A	accept	301
A	target	Jern Hornhelm
S	
A	goto	1432/0,-2929.87,-5424.84
A	fly	Ironforge
A	target	Thorgrum Borrelson
S	
A	goto	1455/0,-1188.54,-4761.37
A	target	Daryl Riknussun
A	train	2550
S	
T	xprate	<1.5
A	goto	1455/0,-1303.75,-4631.19
A	turnin	301
A	target	Prospector Stormpike
S	
A	goto	1455/0,-1301.82,-4838.85,30,0
A	goto	1455/0,-1301.82,-4838.85,0
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
T	softcore	
A	target	Grimand Elmore
A	goto	1453/0,685.22,-8387.23
A	accept	353
S	
A	target	Furen Longbeard
A	goto	1453/0,600.07,-8427.22
A	turnin	1338
S	Hunter
A	goto	1453/0,552.78,-8415.71
A	trainer	
A	target	Einris Brightspear
S	
A	target	Woo Ping
A	goto	1453/0,613.0,-8796.03
A	trainer	
S	
T	ah	
A	goto	1453/0,660.28,-8814.55
A	collect	5469,5,2178,1
A	collect	12238,6,1141,1
A	target	Auctioneer Jaxon
A	skill	cooking,50,1
S	
T	ah	
T	optional	
A	goto	1453/0,660.28,-8814.55
A	collect	5469,5,2178,1
A	collect	12238,6,1141,1
A	target	Auctioneer Jaxon
A	skill	cooking,<50,1
S	
T	softcore	
A	hs	
S	
T	softcore	
T	completewith	next
A	goto	1432/0,-2651.61,-4817.15,100
S	
T	softcore	
A	goto	1432/0,-2676.99,-4825.980
A	turnin	353
A	target	Mountaineer Stormpike
S	
T	softcore	
T	completewith	next
A	deathskip	
A	target	Spirit Healer
S	
T	softcore	
A	goto	1432/0,-2929.87,-5424.84
A	fly	Wetlands
A	target	Thorgrum Borrelson
S	skip --logout skip
T	hardcore	
A	goto	1453/0,558.96,-8382.54,25,0
A	goto	1453/0,520.64,-8351.460
A	zone	Ironforge
A	link	https://www.youtube.com/watch?v=M_tXROi9nMQ
S	
T	hardcore	
A	goto	1426/0,-832.79,-5022.97
A	zone	Dun Morogh
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
A	mob	Wetlands Crocolisk
A	mob	Young Wetlands Crocolisk
A	mob	Bluegill Raider
S	
A	money	<0.08
A	goto	1437/0,-819.67,-3691.42,15,0
A	goto	1437/0,-807.26,-3716.22,15,0
A	goto	1437/0,-827.94,-3724.49,15,0
A	goto	1437/0,-834.60,-3711.73
A	vendor	
A	target	Neal Allen
A	bronzetube	
S	
A	goto	1437/0,-820.91,-3829.50,10,0
A	goto	1437/0,-823.64,-3807.21
A	vendor	
A	target	Samor Festivus
S	
T	hardcore	
A	goto	1437/0,-782.03,-3793.12
A	fp	Wetlands
A	target	Shellei Brondir
S	
A	goto	1437/0,-718.35,-3701.89
A	vendor	
A	target	Dewin Shimmerdawn
S	
T	optional	
T	label	DockTravel
T	completewith	next
A	goto	1437/0,-683.2,-3745.44,30,0
A	goto	1437/0,-580.23,-3726.15,15
A	zoneskip	Darkshore
S	
T	optional	
T	requires	DockTravel
T	label	DarkshoreCook1
T	completewith	DarkshoreBoat
A	cast	818
A	usespell	818
A	zoneskip	Darkshore
A	itemcount	769,1
A	itemcount	2672,1
A	itemcount	4470,1
A	itemcount	4471,1
A	skill	cooking,50,1
S	
T	optional	
T	requires	DarkshoreCook1
T	label	DarkshoreCook2
T	completewith	DarkshoreBoat
A	cast	818
A	usespell	818
A	zoneskip	Darkshore
A	itemcount	769,<1
A	itemcount	2672,1
A	itemcount	4470,1
A	itemcount	4471,1
A	skill	cooking,50,1
S	
T	optional	
T	requires	DarkshoreCook2
T	label	DarkshoreCook3
T	completewith	DarkshoreBoat
A	cast	818
A	usespell	818
A	zoneskip	Darkshore
A	itemcount	769,1
A	itemcount	2672,<1
A	itemcount	4470,1
A	itemcount	4471,1
A	skill	cooking,50,1
S	
T	optional	
T	requires	DarkshoreCook3
T	label	DarkshoreCook4
T	completewith	DarkshoreBoat
A	usespell	2550
A	zoneskip	Darkshore
A	itemcount	769,1
A	itemcount	2672,1
A	itemcount	4471,1
A	skill	cooking,50,1
S	
T	optional	
T	requires	DarkshoreCook4
T	label	DarkshoreCook5
T	completewith	DarkshoreBoat
A	usespell	2550
A	zoneskip	Darkshore
A	itemcount	769,<1
A	itemcount	2672,1
A	itemcount	4471,1
A	skill	cooking,50,1
S	
T	optional	
T	requires	DarkshoreCook5
T	label	DarkshoreCook6
T	completewith	DarkshoreBoat
A	usespell	2550
A	zoneskip	Darkshore
A	itemcount	769,1
A	itemcount	2672,<1
A	itemcount	4471,1
A	skill	cooking,50,1
S	
T	label	DarkshoreBoat
A	goto	1437,4.370,56.762
A	zone	Darkshore
E
G	Guides/forever/Alliance-11-20.lua
M	xprate	<1.5
M	classic	
M	tbc	
M	season	0,1
M	version	1
M	selector	Alliance
M	name	13-15 Westfall
M	displayname	14-15 Westfall << Dwarf/Gnome
M	group	RestedXP Forever Guide (A)
M	subgroup	Speedrun Guide 1-20
M	next	14-16 Darkshore
M	defaultfor	!NightElf !Hunter
S	
T	optional	
A	maxlevel	14,endOfTheGuide
S	
T	completewith	SaldeanVendor
T	optional	
A	goto	1429/0,875.96,-9814.400
A	zone	Westfall
S	
A	goto	1436/0,918.42,-9851.50
A	accept	64
A	target	Farmer Furlbrow
S	
A	goto	1436/0,919.47,-9853.13
A	accept	36
A	accept	151
A	target	Verna Furlbrow
S	
T	completewith	SalmaS
A	goto	1436/0,1055.27,-10128.70,65
S	
A	goto	1436/0,1055.27,-10128.70
A	target	Farmer Saldean
A	accept	9
S	
T	label	SalmaS
A	goto	1436/0,1042.67,-10111.670
A	turnin	36
A	target	Salma Saldean
A	accept	38
A	accept	22
S	Human
T	label	Lewis
A	target	Quartermaster Lewis
A	goto	1436/0,1021.67,-10500.63
A	turnin	6285
S	Gnome/Dwarf
T	completewith	next
A	goto	1436/0,1045.12,-10508.80
A	target	Gryan Stoutmantle
A	turnin	109
A	isOnQuest	109
S	
A	goto	1436/0,1045.12,-10508.80
A	target	Gryan Stoutmantle
A	accept	12
S	
A	goto	1436/0,1041.97,-10511.13
A	target	Captain Danuvin
A	accept	102
S	Human
T	requires	Lewis
A	goto	1436/0,1126.67,-10636.670
A	target	Scout Galiaan
A	accept	153
S	!Human
A	target	Scout Galiaan
A	goto	1436/0,1126.67,-10636.670
A	accept	153
S	
A	goto	1436/0,1166.57,-10653.23
A	vendor	
A	target	Innkeeper Heather
S	
A	goto	1436/0,1179.800,-10635.601
A	target	Alba Fairmoon::253092
A	accept	92742
A	accept	92744
S	
T	completewith	GnollPaws
A	complete	151,1
S	
T	completewith	TravelCompass
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
T	completewith	TravelCompass
A	complete	12,1
A	mob	+Defias Trapper
A	complete	12,2
A	mob	+Defias Smuggler
A	complete	153,1
A	mob	+Defias Trapper
A	mob	+Defias Smuggler
S	
T	label	TravelCompass
A	isOnQuest	399
A	goto	1436/0,1602.67,-10629.67,75
S	skip -- quests drop rate is beyond dreadful. over 50 kills to complete
A	goto	1436/0,1213.400,-10153.800
A	target	Ozwin Ironsprocket::253395
A	accept	92909
S	
T	sticky	
T	completewith	bennytime
A	mob	Harvest Watcher
A	complete	9,1
A	collect	732,3,38,1
A	collect	814,5,103,1
S	
A	goto	1436/0,1748.27,-10672.13
A	complete	399,1
A	isOnQuest	399
S	
T	completewith	bennytime
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
T	completewith	bennytime
A	complete	12,1
A	mob	+Defias Trapper
A	complete	12,2
A	mob	+Defias Smuggler
A	complete	153,1
A	mob	+Defias Trapper
A	mob	+Defias Smuggler
S	
A	goto	1436/0,1266.67,-9927.33,75
S	
T	label	bennytime
A	goto	1436/0,1289.77,-9849.63
A	complete	64,1
S	
T	completewith	next
A	complete	102,1
A	mob	Riverpaw Gnoll
A	mob	Riverpaw Scout
S	
A	goto	1436/0,1035.300,-9835.101
A	use	254545
A	complete	92742,1
S	
A	goto	1436/0,1192.12,-9641.73,60,0
A	goto	1436/0,1042.67,-9619.33,60,0
A	goto	1436/0,1192.12,-9641.73,60,0
A	goto	1436/0,1042.67,-9619.33,60,0
A	goto	1436/0,1192.12,-9641.73
A	goto	1436/0,1042.67,-9619.33,0
A	collect	730,3,38,1
A	complete	92744,1
A	mob	Murloc Raider
A	mob	Murloc Coastrunner
S	
T	label	GnollPaws
A	goto	1436/0,1042.67,-9715.0,60,0
A	goto	1436/0,1517.97,-9743.000,60,0
A	goto	1436/0,1412.62,-9720.83,60,0
A	goto	1436/0,1184.07,-9745.80,60,0
A	goto	1436/0,1026.57,-9715.70,60,0
A	goto	1436/0,1026.57,-9715.70,60,0
A	goto	1436/0,1517.97,-9743.000,60,0
A	goto	1436/0,1184.07,-9745.80,60,0
A	goto	1436/0,1412.62,-9720.83
A	goto	1436/0,1517.97,-9743.000,0
A	goto	1436/0,1184.07,-9745.80,0
A	goto	1436/0,1028.32,-9710.330,0
A	complete	102,1
A	mob	Riverpaw Gnoll
A	mob	Riverpaw Scout
S	
A	goto	1436/0,1004.87,-9716.87,60,0
A	goto	1436/0,1013.62,-9861.53,60,0
A	goto	1436/0,1192.12,-10175.13,60,0
A	goto	1436/0,1019.57,-10204.30,60,0
A	goto	1436/0,1013.62,-9861.53
A	complete	151,1
S	Human Warlock
T	label	FurlbrowFarm
A	turnin	64
A	turnin	184
A	target	+Farmer Furlbrow
A	goto	1436/0,918.42,-9851.50
A	turnin	151
A	goto	1436/0,919.47,-9853.13
A	target	+Verna Furlbrow
A	isOnQuest	184
S	
T	optional	<< Human Warlock
T	label	FurlbrowFarm << !Human/!Warlock
A	turnin	64
A	target	+Farmer Furlbrow
A	goto	1436/0,918.42,-9851.50
A	turnin	151
A	target	+Verna Furlbrow
A	goto	1436/0,919.47,-9853.13
S	
T	completewith	SaldeanVendor
A	goto	1436/0,1055.27,-10128.70
A	vendor	
A	target	Farmer Saldean
S	
T	optional	
A	isQuestComplete	9
A	target	Farmer Saldean
A	goto	1436/0,1055.27,-10128.70
A	turnin	9
S	
T	optional	
A	goto	1436/0,1042.67,-10111.670
A	turnin	22
A	turnin	38
A	isQuestComplete	22
A	isQuestComplete	38
A	target	Salma Saldean
S	
T	optional	
A	goto	1436/0,1042.67,-10111.670
A	turnin	22
A	isQuestComplete	22
A	target	Salma Saldean
S	
T	optional	
A	goto	1436/0,1042.67,-10111.670
A	turnin	38
A	isQuestComplete	38
A	target	Salma Saldean
S	
A	isQuestAvailable	38
A	goto	1436/0,1132.27,-10146.67,60,0
A	goto	1436/0,1238.67,-9907.73,80,0
A	goto	1436/0,1460.22,-10224.83,80,0
A	goto	1436/0,1132.27,-10146.67,80,0
A	goto	1436/0,1238.67,-9907.73,80,0
A	goto	1436/0,1460.22,-10224.83,80,0
A	goto	1436/0,1132.27,-10146.67,60,0
A	goto	1436/0,1460.22,-10224.83,60,0
A	goto	1436/0,1238.67,-9907.73
A	complete	9,1
A	collect	732,3,38,1
A	collect	814,5,103,1
S	
A	isQuestTurnedIn	38
T	label	HarvestW
A	goto	1436/0,1132.27,-10146.67,60,0
A	goto	1436/0,1238.67,-9907.73,80,0
A	goto	1436/0,1460.22,-10224.83,80,0
A	goto	1436/0,1132.27,-10146.67,80,0
A	goto	1436/0,1238.67,-9907.73,80,0
A	goto	1436/0,1460.22,-10224.83,80,0
A	goto	1436/0,1132.27,-10146.67,60,0
A	goto	1436/0,1460.22,-10224.83,60,0
A	goto	1436/0,1238.67,-9907.73
A	complete	9,1
A	collect	814,5,103,1
S	
T	optional	
A	isQuestComplete	9
A	subzoneskip	107,1
A	target	Farmer Saldean
A	goto	1436/0,1055.27,-10128.70
A	turnin	9
S	skip
A	goto	1436/0,1213.400,-10153.800
A	isQuestComplete	92909
A	target	Ozwin Ironsprocket::253395
A	turnin	92909
S	
A	goto	1436/0,1179.52,-10382.57,75,0
A	goto	1436/0,1138.22,-10474.97,75,0
A	goto	1436/0,860.67,-10462.83,75,0
A	goto	1436/0,904.07,-10038.87,75,0
A	goto	1436/0,1104.62,-9848.000,75,0
A	goto	1436/0,1298.52,-10028.13,75,0
A	goto	1436/0,1340.52,-10401.93,75,0
A	goto	1436/0,1111.97,-10342.20
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
A	goto	1436/0,1055.27,-10128.70
A	turnin	9
S	
T	label	SaldeanVendor
A	target	Salma Saldean
A	goto	1436/0,1042.67,-10111.670
A	turnin	38
A	turnin	22
S	
T	completewith	next
A	complete	12,1
A	mob	+Defias Trapper
A	complete	12,2
A	mob	+Defias Smuggler
A	complete	153,1
A	mob	+Defias Trapper
A	mob	+Defias Smuggler
S	
A	goto	1436/0,1404.200,-10290.900
A	use	254545
A	complete	92742,2
S	
A	goto	1436/0,1324.200,-10490.400
A	complete	12,1
A	mob	+Defias Trapper
A	complete	12,2
A	mob	+Defias Smuggler
A	complete	153,1
A	mob	+Defias Trapper
A	mob	+Defias Smuggler
S	
A	target	Gryan Stoutmantle
A	goto	1436/0,1045.12,-10508.80
A	turnin	12
S	
A	xp	<14,1
A	target	Gryan Stoutmantle
A	goto	1436/0,1045.12,-10508.80
A	accept	65
S	
A	target	Captain Danuvin
A	goto	1436/0,1041.97,-10511.13
A	turnin	102
S	
A	target	Scout Galiaan
A	goto	1436/0,1126.67,-10636.670
A	turnin	153
S	
A	goto	1436/0,1179.800,-10635.601
A	target	Alba Fairmoon::253092
A	turnin	92742
A	turnin	92744
S	
A	hs	
A	bindlocation	1519,1
A	cooldown	item,6948,>2,1
A	zoneskip	Stormwind City
A	zoneskip	Darkshore
S	
T	completewith	DarkshoreBoat
A	goto	1436/0,1037.42,-10628.27
A	fly	Stormwind
A	target	Thor
A	zoneskip	Stormwind City
A	zoneskip	Darkshore
S	
T	optional	
T	label	endOfTheGuide
S	Rogue
T	ah	
A	goto	1453/0,609.63,-8787.71
A	vendor	1287
A	money	<0.3815
A	itemStat	17,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.7
A	target	Marda Weller
S	Rogue
T	ssf	
A	goto	1453/0,609.63,-8787.71
A	vendor	1287
A	money	<0.3815
A	itemStat	17,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.7
A	target	Marda Weller
S	
A	goto	1453/0,596.400,-8831.700
A	collect	4470,1
A	collect	4471,1
A	target	Thurman Mullby
A	skill	cooking,50,1
S	
T	ah	
A	goto	1453/0,660.28,-8814.55
A	collect	5469,5,2178,1
A	collect	12238,6,1141,1
A	collect	769,50,2178,1,0x20,cooking
A	disablecheckbox	
A	collect	2672,50,2178,1,0x20,cooking
A	disablecheckbox	
A	target	Auctioneer Jaxon
A	skill	cooking,50,1
S	
T	ah	
T	optional	
A	goto	1453/0,660.28,-8814.55
A	collect	5469,5,2178,1
A	collect	12238,6,1141,1
A	target	Auctioneer Jaxon
A	skill	cooking,<50,1
S	Rogue
A	goto	1453/0,377.47,-8752.39
A	train	1758,1
A	trainer	
A	target	Osborne the Night Man
S	Warrior
A	goto	1453/0,358.25,-8728.28,15,0
A	goto	1453/0,302.6,-8685.53,15,0
A	goto	1453/0,323.3,-8689.29
A	train	1160,1
A	trainer	
A	target	Wu Shen
A	target	Ilsa Corbin
S	Hunter
A	goto	1453/0,552.78,-8415.71
A	trainer	
A	target	Einris Brightspear
S	
A	goto	1453/0,719.67,-8550.30
A	turnin	399
A	target	Baros Alexston
A	isQuestComplete	399
S	Warlock
T	optional	
T	completewith	next
A	goto	1453/0,988.44,-8942.15,20,0
A	goto	1453/0,1015.33,-8978.9,15
S	Warlock
A	goto	1453/0,1029.89,-8971.06
A	trainer	
A	train	6222,1
A	target	Ursula Deline
S	Mage
T	optional	
T	completewith	next
A	goto	1453/0,874.32,-9014.67,10
S	Mage
A	goto	1453/0,885.34,-9006.15
A	train	2137,1
A	trainer	
A	target	Elsharin
S	Priest/Paladin
T	optional	
T	completewith	next
A	goto	1453/0,809.52,-8579.22,20
S	Paladin
A	goto	1453/0,859.13,-8559.14,10,0
A	goto	1453/0,861.14,-8573.03
A	trainer	
A	train	19742,1
A	target	Arthur the Faithful
S	Priest
A	goto	1453/0,862.89,-8519.61
A	trainer	
A	train	8122,1
A	target	Brother Joshua
S	
T	optional	
T	requires	DockTravel
T	label	DarkshoreCook1
T	completewith	DarkshoreBoat
A	cast	818
A	usespell	818
A	zoneskip	Darkshore
A	itemcount	769,1
A	itemcount	2672,1
A	itemcount	4470,1
A	itemcount	4471,1
A	skill	cooking,50,1
S	
T	optional	
T	requires	DarkshoreCook1
T	label	DarkshoreCook2
T	completewith	DarkshoreBoat
A	cast	818
A	usespell	818
A	zoneskip	Darkshore
A	itemcount	769,<1
A	itemcount	2672,1
A	itemcount	4470,1
A	itemcount	4471,1
A	skill	cooking,50,1
S	
T	optional	
T	requires	DarkshoreCook2
T	label	DarkshoreCook3
T	completewith	DarkshoreBoat
A	cast	818
A	usespell	818
A	zoneskip	Darkshore
A	itemcount	769,1
A	itemcount	2672,<1
A	itemcount	4470,1
A	itemcount	4471,1
A	skill	cooking,50,1
S	
T	optional	
T	requires	DarkshoreCook3
T	label	DarkshoreCook4
T	completewith	DarkshoreBoat
A	usespell	2550
A	zoneskip	Darkshore
A	itemcount	769,1
A	itemcount	2672,1
A	itemcount	4471,1
A	skill	cooking,50,1
S	
T	optional	
T	requires	DarkshoreCook4
T	label	DarkshoreCook5
T	completewith	DarkshoreBoat
A	usespell	2550
A	zoneskip	Darkshore
A	itemcount	769,<1
A	itemcount	2672,1
A	itemcount	4471,1
A	skill	cooking,50,1
S	
T	optional	
T	requires	DarkshoreCook5
T	label	DarkshoreCook6
T	completewith	DarkshoreBoat
A	usespell	2550
A	zoneskip	Darkshore
A	itemcount	769,1
A	itemcount	2672,<1
A	itemcount	4471,1
A	skill	cooking,50,1
S	
T	label	DarkshoreBoat
A	goto	1453/0,1330.100,-8645.400
A	zone	Darkshore
E
G	Guides/forever/Alliance-11-20.lua
M	classic	
M	tbc	
M	season	0,1
M	version	1
M	selector	Alliance
M	group	RestedXP Forever Guide (A)
M	subgroup	Speedrun Guide 1-20
M	name	14-16 Darkshore
M	displayname	11-16 Darkshore << NightElf
M	displayname	13-16 Darkshore << Dwarf Hunter
M	displayname	15-16 Darkshore << !NightElf/!Dwarf Hunter
M	next	16-19 Darkshore
S	NightElf
T	label	WashedA
A	goto	1439,36.621,45.596
A	accept	3524
A	target	Gwennyth Bly'Leggonde
S	NightElf
A	goto	1439,36.767,44.285
A	turnin	6342
A	target	Laird
S	NightElf
T	optional	
T	completewith	next
A	goto	1439,36.826,44.150,5,0
A	goto	1439,36.688,43.952,8
S	!NightElf
A	goto	1439,35.743,43.710
A	accept	963
A	target	Cerellean Whiteclaw
A	xp	<11,1
S	!NightElf
T	optional	
T	completewith	next
A	goto	1439/1,525.800,6414.800,8
S	
A	goto	1439,36.976,44.135
A	accept	983
A	target	Wizbang Cranktoggle
S	
A	goto	1439/1,515.55,6406.32
A	home	
A	target	Innkeeper Shaussiy
A	bindlocation	442
S	
A	goto	1439/1,503.100,6402.100
A	accept	98025
S	
T	optional	<< NightElf
A	goto	1439,37.322,43.640
A	accept	947
A	target	Barithras Moonshade
A	xp	<12,1
S	
T	optional	<< NightElf
A	goto	1439,37.703,43.393
A	accept	4811
A	target	Sentinel Glynda Nal'Shea
A	xp	<12,1
S	
A	goto	1439,38.843,43.416
A	accept	2118
A	target	Tharnariun Treetender
S	
A	goto	1439,39.373,43.483
A	accept	984
A	target	Terenthis
S	
T	ah	
T	optional	
A	goto	1439/1,577.38,6371.35
A	accept	1138
A	accept	1141
A	turnin	1141
A	itemcount	12238,6
A	target	Gubber Blump
A	xp	<15,1
S	
T	ah	
A	goto	1439/1,577.38,6371.35
A	accept	1141
A	turnin	1141
A	itemcount	12238,6
A	target	Gubber Blump
S	
T	optional	
T	season	0
A	goto	1439/1,577.38,6371.35
A	accept	1138
A	target	Gubber Blump
A	xp	<15,1
S	!NightElf
T	label	WashedA
A	goto	1439,36.701,45.122,8,0
A	goto	1439,36.621,45.596
A	accept	3524
A	target	Gwennyth Bly'Leggonde
S	!NightElf
A	goto	1439/1,561.66,6343.27
A	fp	Auberdine
A	target	Caylais Moonfeather
S	Dwarf Hunter
T	optional	
T	completewith	RabidThistle
T	loop	
A	goto	1439/1,272.54,5255.27,0
A	goto	1439/1,271.23,4902.88,0
A	goto	1439/1,438.91,5131.69,0
A	goto	1439/1,272.54,5255.27,40,0
A	goto	1439/1,271.23,4902.88,40,0
A	goto	1439/1,438.91,5131.69,40,0
A	tame	2163
A	target	Thistle Bear
S	
T	optional	
T	completewith	FirstWashed
A	goto	1439,43.509,33.207,0
A	collect	5469,5,2178,1
A	mob	Foreststrider Fledgling
A	subzoneskip	442
S	
T	sticky	
T	label	BuzzBox1
T	loop	
A	goto	1439,36.051,44.757,0
A	goto	1439,36.280,50.071,0
A	goto	1439,35.275,53.464,0
A	waypoint	1439,36.091,51.501,60,0
A	waypoint	1439,37.115,52.368,60,0
A	waypoint	1439,37.130,53.663,60,0
A	waypoint	1439,36.740,55.221,60,0
A	waypoint	1439,35.655,55.872,60,0
A	waypoint	1439,35.088,55.085,60,0
A	waypoint	1439,35.275,53.464,60,0
A	waypoint	1439,36.091,51.501,60,0
A	waypoint	1439,36.280,50.071,60,0
A	waypoint	1439,36.523,48.554,60,0
A	waypoint	1439,35.977,48.408,60,0
A	waypoint	1439,35.902,47.145,60,0
A	waypoint	1439,35.759,45.455,60,0
A	waypoint	1439,36.051,44.757,60,0
A	complete	983,1
A	mob	Pygmy Tide Crawler
A	mob	Young Reef Crawler
A	isOnQuest	983
S	
A	goto	1439,36.371,50.920
A	complete	3524,1
S	Druid
T	ah	
T	season	0
T	optional	
T	completewith	CliffspringEnd
T	label	GatheringQ
A	skill	herbalism,15
A	collect	2449,5,6123,1
A	disablecheckbox	
S	Druid
T	ssf	
T	season	0
T	optional	
T	completewith	CliffspringEnd
T	label	GatheringQ
A	skill	herbalism,15
A	collect	2449,5,6123,1
A	disablecheckbox	
S	Druid
T	optional	
T	season	0
T	completewith	CliffspringEnd
T	requires	GatheringQ
A	collect	2449,5,6123,1
A	skill	herbalism,<15,1
S	
T	completewith	next
A	complete	2118,1
A	unitscan	Rabid Thistle Bear
A	use	7586
S	
T	label	FurlbogCamp
A	goto	1439/1,393.72,5993.24
A	complete	984,1
S	
T	sticky	
T	label	RabidThistle
T	loop	
A	goto	1439,38.226,52.780,0
A	goto	1439,39.129,59.176,0
A	goto	1439,38.226,52.780,50,0
A	goto	1439,38.527,54.661,50,0
A	goto	1439,38.037,56.815,50,0
A	goto	1439,38.095,58.395,50,0
A	goto	1439,38.696,57.874,50,0
A	goto	1439,39.129,59.176,50,0
A	complete	2118,1
A	unitscan	Rabid Thistle Bear
A	use	7586
S	NightElf
T	loop	
A	goto	1439,36.051,44.757,0
A	goto	1439,36.280,50.071,0
A	goto	1439,35.275,53.464,0
A	goto	1439,36.051,44.757,60,0
A	goto	1439,35.759,45.455,60,0
A	goto	1439,35.902,47.145,60,0
A	goto	1439,35.977,48.408,60,0
A	goto	1439,36.523,48.554,60,0
A	goto	1439,36.280,50.071,60,0
A	goto	1439,36.091,51.501,60,0
A	goto	1439,37.115,52.368,60,0
A	goto	1439,37.130,53.663,60,0
A	goto	1439,36.740,55.221,60,0
A	goto	1439,35.655,55.872,60,0
A	goto	1439,35.088,55.085,60,0
A	goto	1439,35.275,53.464,60,0
A	goto	1439,36.091,51.501,60,0
A	xp	11+7300
S	
T	label	invisThistle
T	optional	
T	requires	RabidThistle
S	
T	requires	BuzzBox1
A	goto	1439,36.634,46.250
A	turnin	983
A	accept	1001
S	
T	label	FirstWashed
A	goto	1439,36.701,45.122,8,0
A	goto	1439,36.621,45.596
A	turnin	3524
A	accept	4681
A	target	Gwennyth Bly'Leggonde
S	
T	optional	
T	completewith	next
A	goto	1439,36.806,44.137,8,0
A	goto	1439,35.743,43.710,12
S	
A	goto	1439,35.743,43.710
A	accept	963
A	target	Cerellean Whiteclaw
S	
T	season	0,1 << Rogue
T	optional	
T	completewith	SeaT1
A	goto	1439,32.432,43.744,15
S	
T	optional	
T	completewith	washed1
A	goto	1439/1,741.52,6570.95,0
A	goto	1439/1,915.10,6333.84,0
A	goto	1439/1,778.20,6231.66,0
A	complete	1001,1
A	mob	Darkshore Thresher
A	isOnQuest	1001
S	
T	label	SeaT1
A	goto	1439,31.841,46.304
A	complete	4681,1
S	
T	optional	
T	season	0
A	goto	1439/1,577.38,6371.35
A	accept	1138
A	target	Gubber Blump
A	xp	<15,1
S	
T	label	washed1
A	goto	1439,36.701,45.122,8,0
A	goto	1439,36.621,45.596
A	turnin	4681
A	target	Gwennyth Bly'Leggonde
S	
A	goto	1439,37.322,43.640
A	accept	947
A	target	Barithras Moonshade
S	
A	goto	1439,37.703,43.393
A	accept	4811
A	target	Sentinel Glynda Nal'Shea
S	
A	goto	1439,38.843,43.416
A	turnin	2118
A	accept	2138
A	target	Tharnariun Treetender
S	
A	goto	1439,39.373,43.483
A	turnin	984
A	accept	985
A	accept	4761
A	target	Terenthis
S	NightElf Warrior/NightElf Rogue
T	sticky	
T	season	0
T	label	DeepOceanStart
A	goto	1439,38.107,41.165,0,0
A	accept	982
A	target	Gorbold Steelhand
A	xp	<13,1
S	NightElf Warrior/NightElf Rogue
A	train	2575
A	target	+Kurdram Stonehammer
A	goto	1439/1,436.36,6542.65
A	train	2018
A	target	+Delfrum Flintbeard
A	goto	1439/1,440.16,6545.84
S	NightElf Warrior/NightElf Rogue
T	optional	
A	goto	1439/1,443.37,6538.28
A	target	Elisa Steelhand
A	collect	2901,1
A	train	2575,3
S	NightElf Warrior/NightElf Rogue
T	optional	
T	completewith	Bashal1
A	cast	2580
A	usespell	2580
A	train	2575,3
S	!NightElf/!Warrior !Rogue
A	goto	1439,38.107,41.165
A	accept	982
A	target	Gorbold Steelhand
A	xp	<13,1
S	
T	optional	
T	requires	DeepOceanStart << NightElf Warrior/NightElf Rogue
A	goto	1439/1,472.32,6556.100
A	accept	2178
A	turnin	2178
A	target	Alanndarian Nightsong
A	itemcount	5469,5
A	skill	cooking,<10,1
S	NightElf Rogue
A	goto	1439,37.575,40.348
A	vendor	4183
A	collect	2207,1
A	disablecheckbox	
A	itemStat	17,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<7.10
A	target	Naram Longclaw
S	
T	optional	
T	completewith	next
A	goto	1439/1,488.69,6564.830
A	vendor	4182
A	target	Dalmond
S	
A	goto	1439,37.394,40.128
A	turnin	4761
A	accept	4762
A	accept	954
A	accept	958
A	target	Thundris Windweaver
A	xp	>16,1
S	
T	optional	
A	goto	1439,37.394,40.128
A	turnin	4761
A	accept	4762
A	accept	954
A	target	Thundris Windweaver
A	xp	>18,1
S	
T	optional	
A	goto	1439,37.394,40.128
A	turnin	4761
A	accept	4762
S	
T	completewith	MistVeil
A	goto	1439/1,620.35,6768.76,0
A	goto	1439/1,602.66,6924.21,0
A	goto	1439/1,537.82,7023.33,0
A	goto	1439/1,404.85,7099.75,0
A	goto	1439/1,310.53,7077.48,0
A	goto	1439/1,620.35,6768.76,55,0
A	goto	1439/1,602.66,6924.21,55,0
A	complete	1001,1
A	mob	Darkshore Thresher
A	isOnQuest	1001
A	isOnQuest	982
S	
T	optional	
T	completewith	next
S	
A	goto	1439,38.213,28.754
A	complete	982,1
A	isOnQuest	982
S	
T	label	MistVeil
A	goto	1439,39.581,27.487
A	complete	982,2
A	isOnQuest	982
S	
T	loop	
A	goto	1439/1,310.53,7077.48,0
A	goto	1439/1,404.85,7099.75,0
A	goto	1439/1,537.82,7023.33,0
A	goto	1439/1,310.53,7077.48,55,0
A	goto	1439/1,404.85,7099.75,55,0
A	goto	1439/1,537.82,7023.33,55,0
A	goto	1439/1,602.66,6924.21,55,0
A	goto	1439/1,620.35,6768.76,55,0
A	goto	1439/1,602.66,6924.21,55,0
A	goto	1439/1,620.35,6768.76,55,0
A	complete	1001,1
A	mob	Darkshore Thresher
A	isOnQuest	1001
S	
T	optional	
A	goto	1439,41.901,31.339
A	accept	4723
A	isOnQuest	1001
S	
T	optional	
A	goto	1439,41.901,31.339
A	accept	4723
A	isOnQuest	982
S	
A	goto	1439,41.960,28.616
A	turnin	1001
A	accept	1002
A	isQuestComplete	1001
S	
T	optional	
A	goto	1439,41.960,28.616
A	accept	1002
A	isQuestTurnedIn	1001
S	
T	optional	
T	completewith	AsterionTravel
A	goto	1439,44.190,33.697,0
A	complete	1002,1
A	mob	Moonstalker Runt
A	isQuestTurnedIn	1001
S	
T	optional	
T	completewith	AsterionTravel
A	goto	1439,43.509,33.207,0
A	collect	5469,5,2178,1
A	mob	Foreststrider Fledgling
S	
T	optional	
T	label	AsterionTravel
T	completewith	Bashal1
A	goto	1439,44.629,36.316,20,0
A	goto	1439,44.168,36.289,15
S	
A	goto	1439,44.168,36.289
A	turnin	954
A	accept	955
A	target	Asterion
A	isOnQuest	954
A	xp	>16,1
S	
T	optional	
T	label	Bashal1
A	goto	1439,44.168,36.289
A	turnin	954
A	target	Asterion
A	isOnQuest	954
S	
T	loop	
A	goto	1439,44.528,36.587,0
A	goto	1439,45.334,39.393,0
A	goto	1439,46.096,36.541,0
A	goto	1439,44.528,36.587,50,0
A	goto	1439,44.435,37.404,50,0
A	goto	1439,44.443,38.202,50,0
A	goto	1439,44.493,39.008,50,0
A	goto	1439,44.821,39.711,50,0
A	goto	1439,45.334,39.393,50,0
A	goto	1439,45.167,38.652,50,0
A	goto	1439,45.091,37.865,50,0
A	goto	1439,45.495,37.019,50,0
A	goto	1439,45.831,36.790,50,0
A	goto	1439,46.096,36.541,50,0
A	goto	1439,46.906,36.171,50,0
A	goto	1439,47.431,36.151,50,0
A	goto	1439,47.022,37.083,50,0
A	goto	1439,47.166,37.580,50,0
A	goto	1439,45.827,36.812,50,0
A	complete	955,1
A	mob	Wild Grell
A	mob	Vile Sprite
A	isOnQuest	955
S	
A	goto	1439,44.168,36.289
A	turnin	955
A	accept	956
A	target	Asterion
A	isQuestComplete	955
S	
T	optional	
A	goto	1439,44.168,36.289
A	accept	956
A	target	Asterion
A	isQuestTurnedIn	955
S	
T	completewith	MeatFangEgg1
T	optional	
A	abandon	955
A	isQuestAvailable	955
S	
T	loop	
A	goto	1439,45.393,36.472,0
A	goto	1439,45.429,39.773,0
A	goto	1439,47.368,36.774,0
A	goto	1439,45.393,36.472,45,0
A	goto	1439,45.938,37.800,45,0
A	goto	1439,45.938,38.040,45,0
A	goto	1439,46.531,39.134,45,0
A	goto	1439,45.429,39.773,45,0
A	goto	1439,47.262,37.674,45,0
A	goto	1439,47.920,37.228,45,0
A	goto	1439,47.368,36.774,45,0
A	complete	956,1
A	mob	Deth'ryll Satyr
A	isQuestTurnedIn	955
S	
A	goto	1439,44.168,36.289
A	turnin	956
A	accept	957
A	target	Asterion
A	isQuestComplete	956
S	
A	goto	1439,44.168,36.289
A	accept	957
A	target	Asterion
A	isQuestTurnedIn	956
S	NightElf/Dwarf Hunter
T	optional	
A	goto	1439,44.528,36.587,0
A	goto	1439,45.334,39.393,0
A	goto	1439,46.096,36.541,0
A	goto	1439,44.528,36.587,50,0
A	goto	1439,44.435,37.404,50,0
A	goto	1439,44.443,38.202,50,0
A	goto	1439,44.493,39.008,50,0
A	goto	1439,44.821,39.711,50,0
A	goto	1439,45.334,39.393,50,0
A	goto	1439,45.167,38.652,50,0
A	goto	1439,45.091,37.865,50,0
A	goto	1439,45.495,37.019,50,0
A	goto	1439,45.831,36.790,50,0
A	goto	1439,46.096,36.541,50,0
A	goto	1439,46.906,36.171,50,0
A	goto	1439,47.431,36.151,50,0
A	goto	1439,47.022,37.083,50,0
A	goto	1439,47.166,37.580,50,0
A	goto	1439,45.827,36.812,50,0
A	xp	13
S	
T	optional	
T	label	HCHunterEnd --hidden step for #include
S	
T	optional	
T	completewith	AuberdineTurnin2 << NightElf/Hunter/Druid/Warrior
T	completewith	AmethStart << !NightElf !Hunter !Druid !Warrior
A	goto	1439,43.509,33.207,0
A	collect	5469,5,2178,1
A	mob	Foreststrider Fledgling
A	subzoneskip	442
S	
T	optional	
T	completewith	AuberdineTurnin2 << NightElf/Hunter/Druid/Warrior
T	completewith	EndFirstMoonstalker << !NightElf !Hunter !Druid !Warrior
A	complete	1002,1
A	mob	Moonstalker Runt
A	isQuestTurnedIn	1001
S	
T	completewith	RedCrystal
A	collect	6889,10,2178,1
A	mob	Young Moonkin
A	mob	Raging Moonkin
A	mob	Moonkin Oracle
A	mob	Moonkin
A	skill	cooking,10,1
A	skill	cooking,<1,1
S	
T	completewith	AuberdineTurnin2 << NightElf/Hunter/Druid/Warrior
A	collect	6889,50,90,1,0x20,cooking
A	mob	Young Moonkin
A	mob	Raging Moonkin
A	mob	Moonkin Oracle
A	mob	Moonkin
A	skill	cooking,<10,1
A	skill	cooking,50,1
S	
T	season	0
T	completewith	LateTurtleStart
A	collect	6889,50,90,1,0x20,cooking
A	mob	Young Moonkin
A	mob	Raging Moonkin
A	mob	Moonkin Oracle
A	mob	Moonkin
A	skill	cooking,<10,1
A	skill	cooking,50,1
A	subzoneskip	442
A	subzoneskip	447
S	
T	season	0
T	label	RedCrystal
A	goto	1439,47.314,48.676
A	complete	4811,1
S	Druid
T	optional	
T	season	0
T	completewith	Lunaclaw
A	goto	1439,43.126,45.593,15
S	Druid
T	optional	
T	season	0
T	completewith	Lunaclaw
A	goto	1439/1,92.42,6325.98
A	cast	18974
A	timer	4,Body and Heart RP
A	use	15208
A	isOnQuest	6001
S	Druid
T	label	Lunaclaw
T	season	0
A	goto	1439/1,119.27,6344.32
A	complete	6001,1
A	use	15208
A	mob	Lunaclaw
S	NightElf/Hunter/Warrior/Druid
T	optional	
T	completewith	Cascade
T	season	0
A	hs	
A	cooldown	item,6948,>0,1
A	subzoneskip	442
A	isQuestTurnedIn	6001 << Druid
S	NightElf/Hunter/Druid/Warrior
T	optional	
T	label	AuberdineTurnin2
T	completewith	Cascade
A	goto	1439,37.703,43.393
A	subzone	442
A	cooldown	item,6948,<0,1 << !Druid
S	NightElf/Hunter/Druid/Warrior
T	optional	
A	goto	1439,37.703,43.393
A	turnin	4811
A	accept	4812
A	target	Sentinel Glynda Nal'Shea
A	xp	>14,1 << Hunter/Druid
S	Hunter/Druid/Warrior
T	season	0,1 << Druid
A	goto	1439,37.703,43.393
A	turnin	4811
A	accept	4812
A	target	Sentinel Glynda Nal'Shea
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.5 << Hunter/Druid
S	NightElf/Hunter/Druid/Warrior
T	optional	
T	label	Cascade
A	goto	1439,37.703,43.393
A	accept	4812
A	target	Sentinel Glynda Nal'Shea
A	isQuestTurnedIn	4811
S	NightElf/Hunter/Druid
T	optional	
T	season	0
A	goto	1439/1,518.17,6429.47
A	collect	1179,35
A	target	Allyndia
A	subzoneskip	442,1
A	isQuestTurnedIn	4811
S	NightElf/Hunter/Druid/Warrior
T	optional	
A	goto	1439,37.767,44.001
A	complete	4812,1
A	use	14338
A	isQuestTurnedIn	4811
S	NightElf Hunter
T	optional	
T	season	0
A	goto	1439/1,491.97,6560.47
A	collect	2515,2000
A	target	Dalmond
A	subzoneskip	442,1
A	isQuestTurnedIn	4811
S	NightElf/Hunter/Druid/Warrior
T	optional	
T	completewith	EndFirstMoonstalker
A	collect	5469,5,2178,1
A	mob	Foreststrider Fledgling
A	isQuestTurnedIn	4811
S	NightElf/Hunter/Druid/Warrior
T	optional	
T	completewith	EarlyCrystalEnd
A	collect	6889,10,2178,1,0x20,cooking
A	mob	Young Moonkin
A	mob	Raging Moonkin
A	mob	Moonkin Oracle
A	mob	Moonkin
A	skill	cooking,10,1
A	skill	cooking,<1,1
A	isQuestTurnedIn	4811
S	NightElf/Hunter/Druid/Warrior
T	optional	
T	completewith	EarlyCrystalEnd
T	season	0
A	collect	6889,50,90,1,0x20,cooking
A	mob	Young Moonkin
A	mob	Raging Moonkin
A	mob	Moonkin Oracle
A	mob	Moonkin
A	skill	cooking,<10,1
A	skill	cooking,50,1
A	isQuestTurnedIn	4811
S	NightElf/Hunter/Druid/Warrior
T	optional	
T	completewith	EndFirstMoonstalker
A	complete	1002,1
A	mob	Moonstalker Runt
A	isOnQuest	1002
A	isQuestTurnedIn	4811
S	NightElf/Hunter/Druid/Warrior
T	season	0
A	goto	1439,47.314,48.676
T	label	EarlyCrystalEnd
A	turnin	4812
A	accept	4813
A	isQuestTurnedIn	4811
S	NightElf/Hunter/Druid/Warrior
T	optional	
T	season	0
T	loop	
A	goto	1439,46.918,48.630,0
A	goto	1439,45.338,54.337,0
A	goto	1439,45.108,49.184,0
A	goto	1439,45.322,44.756,0
A	goto	1439,46.918,48.630,60,0
A	goto	1439,46.233,49.578,60,0
A	goto	1439,46.110,50.828,60,0
A	goto	1439,45.766,51.560,60,0
A	goto	1439,45.652,52.729,60,0
A	goto	1439,45.338,54.337,60,0
A	goto	1439,44.817,53.601,60,0
A	goto	1439,44.398,52.137,60,0
A	goto	1439,44.424,50.766,60,0
A	goto	1439,45.090,50.415,60,0
A	goto	1439,45.108,49.184,60,0
A	goto	1439,44.578,48.547,60,0
A	goto	1439,44.311,47.903,60,0
A	goto	1439,43.577,46.772,60,0
A	goto	1439,42.237,46.108,60,0
A	goto	1439,42.715,45.372,60,0
A	goto	1439,43.101,44.400,60,0
A	goto	1439,45.322,44.756,60,0
A	collect	6889,10,2178,1,0x20,cooking
A	mob	Young Moonkin
A	mob	Raging Moonkin
A	mob	Moonkin Oracle
A	mob	Moonkin
A	skill	cooking,10,1
A	skill	cooking,<1,1
A	isQuestTurnedIn	4811
S	NightElf/Hunter/Warrior/Druid
T	optional	
T	completewith	EndFirstMoonstalker
A	hs	
A	cooldown	item,6948,>0,1
A	subzoneskip	442
A	isQuestTurnedIn	6001 << Druid
A	isQuestTurnedIn	4811
S	NightElf/Hunter/Druid/Warrior
T	optional	
T	completewith	EndFirstMoonstalker
A	goto	1439,37.703,43.393
A	subzone	442
A	cooldown	item,6948,<0,1 << !Druid
A	isQuestTurnedIn	4811
S	NightElf/Hunter/Druid/Warrior
T	season	0
A	goto	1439/1,472.32,6438.64
A	turnin	4813,3
A	target	Sentinel Glynda Nal'Shea
A	isQuestTurnedIn	4811
S	Hunter/Druid/Warrior
T	completewith	AmethStart
A	use	15397
A	itemcount	15397,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.5
A	isQuestTurnedIn	4811
S	Druid
T	season	0
A	goto	1439,36.767,44.285
A	accept	6343
A	target	Laird
S	Druid
T	optional	
T	loop	
A	goto	1439,36.051,44.757,0
A	goto	1439,36.280,50.071,0
A	goto	1439,35.275,53.464,0
A	goto	1439,36.051,44.757,60,0
A	goto	1439,35.759,45.455,60,0
A	goto	1439,35.902,47.145,60,0
A	goto	1439,35.977,48.408,60,0
A	goto	1439,36.523,48.554,60,0
A	goto	1439,36.280,50.071,60,0
A	goto	1439,36.091,51.501,60,0
A	goto	1439,37.115,52.368,60,0
A	goto	1439,37.130,53.663,60,0
A	goto	1439,36.740,55.221,60,0
A	goto	1439,35.655,55.872,60,0
A	goto	1439,35.088,55.085,60,0
A	goto	1439,35.275,53.464,60,0
A	goto	1439,36.091,51.501,60,0
A	xp	13+9500
S	Druid
T	season	0
A	goto	1439/1,561.66,6343.27
A	fly	Teldrassil
A	target	Caylais Moonfeather
S	Druid
A	goto	1438/1,950.52,8694.07
T	season	0
A	turnin	6343
A	target	Nessa Shadowsong
S	Druid
T	optional	
T	completewith	next
T	season	0
A	goto	1438/1,965.80,8780.95
A	zone	Darnassus
S	Druid
A	goto	1457/1,2563.98,10179.00
T	season	0
A	turnin	6001
A	accept	6121
A	trainer	
A	target	Mathrengyl Bearwalker
S	Druid
T	optional	
T	season	0
A	goto	1457/1,2563.98,10179.00
A	accept	6121
A	trainer	
A	target	Mathrengyl Bearwalker
A	isQuestTurnedIn	6001
A	zoneskip	Darnassus,1
S	Druid
T	optional	
T	season	0
T	completewith	next
A	cast	18960
A	zoneskip	Moonglade
S	Druid
T	season	0
A	goto	1450/1,-2678.76,8020.09
A	turnin	6121
A	accept	6122
A	target	Dendrite Starblaze
S	Druid
T	season	0
T	optional	
T	completewith	AmethStart
A	hs	
A	zoneskip	Darkshore
S	Druid
T	season	0
T	optional	
T	completewith	AmethStart
A	collect	5469,5,2178,1
A	mob	Foreststrider Fledgling
A	subzoneskip	447
S	NightElf/Hunter/Druid/Warrior
T	completewith	EarlyBlackwood
T	optional	
A	complete	1002,1
A	mob	Moonstalker Runt
A	isOnQuest	1002
A	isQuestTurnedIn	4811
S	NightElf/Hunter/Druid/Warrior
T	optional	
T	loop	
T	season	0
T	label	EarlyBlackwood
A	goto	1439,39.899,54.745,0
A	goto	1439,40.181,56.229,0
A	goto	1439,39.267,53.092,50,0
A	goto	1439,39.754,53.444,50,0
A	goto	1439,40.234,54.325,50,0
A	goto	1439,39.899,54.745,50,0
A	goto	1439,40.181,56.229,50,0
A	goto	1439,39.388,56.671,50,0
A	goto	1439,39.191,56.382,50,0
A	goto	1439,39.957,55.300,50,0
A	goto	1439,39.332,54.079,50,0
A	complete	985,1
A	mob	+Blackwood Pathfinder
A	complete	985,2
A	mob	+Blackwood Windtalker
A	isQuestTurnedIn	4811
S	
T	optional	
T	label	HCHunterStart --hidden step for #include
S	NightElf/Hunter/Druid/Warrior
T	optional	
T	requires	EarlyTreats3 << Druid --Season 2
T	completewith	EarlyTurtleStart
A	complete	1002,1
A	mob	Moonstalker
A	subzoneskip	447
A	isOnQuest	1002
A	isQuestTurnedIn	4811
S	NightElf/Hunter/Druid/Warrior
T	optional	
T	season	0
T	completewith	Anaya
T	requires	EarlyTreats3 << Druid --Season 2
A	complete	2138,1
A	mob	Rabid Thistle Bear
A	isQuestTurnedIn	4811
A	subzoneskip	447
S	NightElf/Hunter/Druid/Warrior
T	optional	
T	season	0
T	label	EarlyTurtleStart
T	requires	EarlyTreats3 << Druid --Season 2
A	goto	1439,37.105,62.167
A	accept	4722
A	isQuestTurnedIn	4811
S	
T	optional	
T	season	0
T	label	EarlyAmethStart
A	goto	1439,40.302,59.731
A	accept	953
A	target	Sentinel Tysha Moonblade
A	isQuestTurnedIn	4811
A	xp	>17,1
S	
T	label	EndFirstMoonstalker
S	
T	optional	
T	completewith	AmethStart
A	complete	1002,1
A	mob	Moonstalker Runt
A	isQuestTurnedIn	1001
A	isQuestAvailable	4811
S	
T	season	0
T	loop	
A	goto	1439,46.918,48.630,0
A	goto	1439,45.338,54.337,0
A	goto	1439,45.108,49.184,0
A	goto	1439,45.322,44.756,0
A	goto	1439,46.918,48.630,60,0
A	goto	1439,46.233,49.578,60,0
A	goto	1439,46.110,50.828,60,0
A	goto	1439,45.766,51.560,60,0
A	goto	1439,45.652,52.729,60,0
A	goto	1439,45.338,54.337,60,0
A	goto	1439,44.817,53.601,60,0
A	goto	1439,44.398,52.137,60,0
A	goto	1439,44.424,50.766,60,0
A	goto	1439,45.090,50.415,60,0
A	goto	1439,45.108,49.184,60,0
A	goto	1439,44.578,48.547,60,0
A	goto	1439,44.311,47.903,60,0
A	goto	1439,43.577,46.772,60,0
A	goto	1439,42.237,46.108,60,0
A	goto	1439,42.715,45.372,60,0
A	goto	1439,43.101,44.400,60,0
A	goto	1439,45.322,44.756,60,0
A	collect	6889,10,2178,1,0x20,cooking
A	mob	Young Moonkin
A	mob	Raging Moonkin
A	mob	Moonkin Oracle
A	mob	Moonkin
A	skill	cooking,10,1
A	skill	cooking,<1,1
S	
T	sticky	
T	optional	
T	label	Anaya
A	goto	1439,42.017,58.866,0
A	goto	1439,43.222,59.693,0
A	goto	1439,43.069,62.448,0
A	goto	1439,42.489,60.677,0
A	waypoint	1439,42.017,58.866,50,0
A	waypoint	1439,42.311,58.645,50,0
A	waypoint	1439,42.448,58.236,50,0
A	waypoint	1439,43.222,59.693,50,0
A	waypoint	1439,43.447,60.131,50,0
A	waypoint	1439,43.780,60.275,50,0
A	waypoint	1439,43.069,62.448,50,0
A	waypoint	1439,43.104,62.563,50,0
A	waypoint	1439,42.794,62.166,50,0
A	waypoint	1439,42.489,60.677,50,0
A	complete	963,1
A	unitscan	Anaya Dawnrunner
A	solo	
S	
T	sticky	
T	optional	
T	label	Anaya
A	goto	1439,42.017,58.866,0
A	goto	1439,43.222,59.693,0
A	goto	1439,43.069,62.448,0
A	goto	1439,42.489,60.677,0
A	waypoint	1439,42.017,58.866,50,0
A	waypoint	1439,42.311,58.645,50,0
A	waypoint	1439,42.448,58.236,50,0
A	waypoint	1439,43.222,59.693,50,0
A	waypoint	1439,43.447,60.131,50,0
A	waypoint	1439,43.780,60.275,50,0
A	waypoint	1439,43.069,62.448,50,0
A	waypoint	1439,43.104,62.563,50,0
A	waypoint	1439,42.794,62.166,50,0
A	waypoint	1439,42.489,60.677,50,0
A	complete	963,1
A	unitscan	Anaya Dawnrunner
A	group	
S	
T	season	0
T	sticky	
T	label	Relics
A	goto	1439,42.670,57.390,0
A	goto	1439,41.986,62.462,0
A	goto	1439,44.072,60.507,0
A	waypoint	1439,42.670,57.390,55,0
A	waypoint	1439,41.708,57.888,55,0
A	waypoint	1439,41.597,59.765,55,0
A	waypoint	1439,42.058,61.199,55,0
A	waypoint	1439,41.986,62.462,55,0
A	waypoint	1439,42.773,63.420,55,0
A	waypoint	1439,43.253,63.287,55,0
A	waypoint	1439,43.945,62.188,55,0
A	waypoint	1439,44.072,60.507,55,0
A	waypoint	1439,43.410,59.784,55,0
A	waypoint	1439,43.787,58.959,55,0
A	complete	958,1
A	mob	Cursed Highborne
A	mob	Writhing Highborne
A	mob	Wailing Highborne
A	isOnQuest	958
S	
A	isOnQuest	98025
A	waypoint	1439/1,-12.800,5791.300
A	complete	98025,1
A	mob	Jai'vhanel
S	
T	season	0
T	label	AmethStart
A	goto	1439,40.302,59.731
A	accept	953
A	target	Sentinel Tysha Moonblade
A	isQuestAvailable	4811
A	xp	>17,1
S	
T	season	0
A	goto	1439,42.652,63.145
A	complete	953,2
A	isOnQuest	953
S	!sod/Warrior/Rogue/Priest
A	goto	1439,42.373,61.815
A	complete	957,1
A	isOnQuest	957
S	
T	season	0
T	label	TheLay
A	goto	1439/1,105.52,5770.100
A	complete	953,1
A	isOnQuest	953
S	
T	optional	
T	requires	Relics
S	
T	optional	
T	requires	Anaya
S	
A	goto	1439,40.302,59.731
A	turnin	953
A	target	Sentinel Tysha Moonblade
S	
T	optional	
T	label	HCHunterEndTwo --hidden step for #include
S	!sod/Warrior/Rogue
T	optional	
T	completewith	FurbolgGrind
A	collect	5469,5,2178,1
A	mob	Foreststrider Fledgling
S	
T	optional	
T	completewith	FurbolgGrind
A	complete	1002,1
A	mob	Moonstalker Runt
A	mob	Moonstalker
A	isOnQuest	1002
S	
T	optional	
T	completewith	FurbolgGrind
T	season	0
A	complete	2138,1
A	mob	Rabid Thistle Bear
S	
T	label	LateTurtleStart
A	goto	1439,37.105,62.167
A	accept	4722
S	
T	loop	
T	label	FurbolgGrind
A	goto	1439,39.899,54.745,0
A	goto	1439,40.181,56.229,0
A	goto	1439,39.267,53.092,50,0
A	goto	1439,39.754,53.444,50,0
A	goto	1439,40.234,54.325,50,0
A	goto	1439,39.899,54.745,50,0
A	goto	1439,40.181,56.229,50,0
A	goto	1439,39.388,56.671,50,0
A	goto	1439,39.191,56.382,50,0
A	goto	1439,39.957,55.300,50,0
A	goto	1439,39.332,54.079,50,0
A	complete	985,1
A	mob	+Blackwood Pathfinder
A	complete	985,2
A	mob	+Blackwood Windtalker
S	
T	optional	
T	loop	
A	goto	1439,39.899,54.745,0
A	goto	1439,40.181,56.229,0
A	goto	1439,39.267,53.092,50,0
A	goto	1439,39.754,53.444,50,0
A	goto	1439,40.234,54.325,50,0
A	goto	1439,39.899,54.745,50,0
A	goto	1439,40.181,56.229,50,0
A	goto	1439,39.388,56.671,50,0
A	goto	1439,39.191,56.382,50,0
A	goto	1439,39.957,55.300,50,0
A	goto	1439,39.332,54.079,50,0
A	xp	15+11875
A	mob	Blackwood Pathfinder
A	mob	Blackwood Windtalker
A	itemcount	5382,<1
S	
T	optional	
T	loop	
A	goto	1439,39.899,54.745,0
A	goto	1439,40.181,56.229,0
A	goto	1439,39.267,53.092,50,0
A	goto	1439,39.754,53.444,50,0
A	goto	1439,40.234,54.325,50,0
A	goto	1439,39.899,54.745,50,0
A	goto	1439,40.181,56.229,50,0
A	goto	1439,39.388,56.671,50,0
A	goto	1439,39.191,56.382,50,0
A	goto	1439,39.957,55.300,50,0
A	goto	1439,39.332,54.079,50,0
A	xp	15+11000
A	mob	Blackwood Pathfinder
A	mob	Blackwood Windtalker
A	itemcount	5382,1
S	
T	optional	
T	completewith	FurbolgGrindEnd
A	collect	5469,5,2178,1
A	mob	Foreststrider Fledgling
A	isQuestAvailable	2178
S	
T	optional	
T	completewith	FurbolgGrindEnd
A	complete	1002,1
A	mob	Moonstalker Runt
A	isOnQuest	1002
S	
T	label	FurbolgGrindEnd
T	completewith	TOTH
T	optional	
A	goto	1439,36.701,45.122
A	subzone	442
A	isOnQuest	4722
S	
A	goto	1439,36.701,45.122,8,0
A	goto	1439,36.621,45.596
A	turnin	4722
A	turnin	4723
A	target	Gwennyth Bly'Leggonde
A	isOnQuest	4723
S	
T	season	0
A	goto	1439/1,577.38,6371.35
A	accept	1138
A	target	Gubber Blump
S	
T	optional	
T	completewith	next
A	goto	1439,36.806,44.137,8,0
A	goto	1439,35.743,43.710,12
S	
T	optional	
A	goto	1439,35.743,43.710
A	turnin	963
A	target	Cerellean Whiteclaw
A	isQuestComplete	963
S	
A	isOnQuest	98025
A	goto	1439/1,472.900,6439.800
A	target	Sentinel Glynda Nal'Shea::2930
A	turnin	98025
S	
T	season	0
A	goto	1439,37.703,43.393
A	turnin	4811
A	accept	4812
A	target	Sentinel Glynda Nal'Shea
A	isOnQuest	4811
S	
A	goto	1439,37.703,43.393
A	turnin	4812
A	target	Sentinel Glynda Nal'Shea
A	isQuestComplete	4812
S	
T	season	0
A	goto	1439,37.767,44.001
A	complete	4812,1
A	use	14338
S	
T	optional	
A	goto	1439,38.843,43.416
A	turnin	2138
A	accept	2139
A	target	Tharnariun Treetender
A	isQuestComplete	2138
S	
T	optional	
A	goto	1439,38.843,43.416
A	accept	2139
A	target	Tharnariun Treetender
A	isQuestTurnedIn	2138
S	
A	goto	1439,39.373,43.483
A	turnin	985
A	accept	986
A	target	Terenthis
S	
T	optional	
T	completewith	next
A	goto	1439,39.280,43.121,6,0
A	goto	1439,39.162,43.194,6
S	
A	goto	1439,39.043,43.555
A	accept	965
A	target	Sentinel Elissa Starbreeze
S	!Hunter
T	optional	
T	completewith	Level10CookEnd
A	goto	1439,38.107,41.165
A	vendor	6301
A	collect	2678,50,90,1,0x20,cooking
A	disablecheckbox	
A	collect	6889,50,90,1,0x20,cooking
A	disablecheckbox	
A	target	Gorbold Steelhand
A	skill	cooking,50,1
A	itemcount	6889,1
S	
A	goto	1439,38.107,41.165
A	accept	982
A	target	Gorbold Steelhand
S	
T	optional	
A	goto	1439,38.107,41.165
A	turnin	982
A	target	Gorbold Steelhand
A	isQuestComplete	982
S	
T	label	Level10CookEnd
A	goto	1439,37.511,41.670
A	skill	cooking,50,1
A	itemcount	6889,1
S	
T	optional	
A	goto	1439/1,472.32,6556.100
A	accept	2178
A	turnin	2178
A	target	Alanndarian Nightsong
A	itemcount	5469,5
A	skill	cooking,<10,1
S	!sod/Rogue
T	label	TOTH
A	goto	1439,37.394,40.128
A	turnin	958
A	turnin	4762
A	accept	4763
A	target	Thundris Windweaver
A	isQuestComplete	958
S	
T	optional	
T	completewith	next
S	
A	goto	1439,38.213,28.754
A	complete	982,1
A	isOnQuest	982
S	
T	label	MistVeil
A	goto	1439,39.581,27.487
A	complete	982,2
A	isOnQuest	982
S	
T	optional	
A	goto	1439,41.901,31.339
A	accept	4723
A	isOnQuest	982
S	
T	optional	
T	completewith	BoatSeaCreature
A	goto	1439,44.190,33.697,0
A	complete	1002,1
A	mob	Moonstalker Runt
A	isOnQuest	1002
S	
T	season	0
T	optional	
T	completewith	BoatSeaCreature
A	goto	1439,43.509,33.207,0
A	collect	5469,5,2178,1
A	mob	Foreststrider Fledgling
S	
T	season	0
T	optional	
T	completewith	BoatSeaCreature
A	collect	6889,50,90,1,0x20,cooking
A	mob	Young Moonkin
A	mob	Raging Moonkin
A	mob	Moonkin Oracle
A	mob	Moonkin
A	subzoneskip	446
A	subzoneskip	452
A	skill	cooking,50,1
S	
T	season	0
A	goto	1439,47.314,48.676
A	turnin	4812
A	accept	4813
S	
T	season	0 << !Warrior !Rogue
T	label	BashalEnd
A	goto	1439,44.168,36.289
A	turnin	957
A	isOnQuest	957
A	target	Asterion
S	
T	optional	
T	season	0 << !Warrior !Rogue
T	completewith	CrabTurtle
A	complete	2138,1
A	mob	Rabid Thistle Bear
S	
T	label	BoatSeaCreature
T	season	0
A	goto	1439,41.901,31.339
A	accept	4723
S	
T	optional	
T	season	0 << !Warrior !Rogue
T	completewith	CrabTurtle
A	collect	5469,5,2178,1
A	mob	Foreststrider Fledgling
A	mob	Foreststrider
S	
T	optional	
T	completewith	CrabTurtle
A	complete	1002,1
A	mob	Moonstalker Runt
A	mob	Moonstalker
A	isOnQuest	1002
S	
T	label	CrabTurtle
T	season	0 << !Warrior !Rogue
A	goto	1439/1,47.88,7433.800
A	accept	4725
S	
T	optional	
T	completewith	next
T	season	0 << !Warrior !Rogue
A	goto	1439,45.004,21.344,0
A	goto	1439,48.013,21.409,0
A	goto	1439,49.680,22.468,0
A	goto	1439,45.004,21.344,55,0
A	goto	1439,45.468,20.336,55,0
A	goto	1439,47.356,20.559,55,0
A	goto	1439,48.013,21.409,55,0
A	goto	1439,48.612,20.745,55,0
A	goto	1439,49.680,22.468,55,0
A	goto	1439,49.313,24.271,55,0
A	complete	1138,1
A	mob	Reef Crawler
S	
A	goto	1439/1,-386.39,7219.830
T	season	0 << !Warrior !Rogue
A	complete	4762,1
A	use	12350
S	
T	optional	
T	completewith	next
A	goto	1439,51.118,23.670,20,0
A	goto	1439,51.288,24.554,12
A	isQuestComplete	1002
S	
T	optional	
A	goto	1439,51.288,24.554
A	turnin	1002
A	accept	1003
A	isQuestComplete	1002
S	
A	goto	1439,51.288,24.554
A	accept	1003
A	isQuestTurnedIn	1002
S	Hunter/Druid
T	optional	
T	completewith	Tower1
A	complete	2138,1
A	mob	Rabid Thistle Bear
S	Hunter/Druid
T	optional	
T	completewith	Tower1
A	collect	5469,5,2178,1
A	mob	Foreststrider
S	Hunter/Druid
T	optional	
T	completewith	Tower1
A	complete	1002,1
A	mob	Moonstalker
A	isOnQuest	1002
S	Hunter/Druid
T	optional	
T	completewith	Tower1
A	goto	1439,51.118,23.670,20,0
A	goto	1439,51.490,24.368,30,0
A	goto	1439,54.973,24.885,15
A	isQuestAvailable	1002 << !NightElf/Hunter
S	Hunter/Druid
T	label	Tower1
A	goto	1439,54.973,24.885
A	turnin	965
A	accept	966
A	target	Balthule Shadowstrike
S	Hunter/Druid
T	loop	
A	goto	1439,55.231,26.508,0
A	goto	1439,56.194,27.071,0
A	goto	1439,56.047,26.586,0
A	goto	1439,55.231,26.508,50,0
A	goto	1439,55.369,27.025,50,0
A	goto	1439,55.763,26.695,50,0
A	goto	1439,55.815,26.972,50,0
A	goto	1439,56.194,27.071,50,0
A	goto	1439,56.790,27.621,50,0
A	goto	1439,57.278,26.311,50,0
A	goto	1439,57.046,26.234,50,0
A	goto	1439,56.544,26.598,50,0
A	goto	1439,56.047,26.586,50,0
A	goto	1439,55.743,25.915,50,0
A	complete	966,1
A	mob	Dark Strand Fanatic
S	Hunter/Druid
A	goto	1439,54.973,24.885
A	turnin	966
A	accept	967
A	target	Balthule Shadowstrike
S	Hunter/Druid
T	loop	
A	goto	1439,53.629,26.054,0
A	goto	1439,54.204,30.475,0
A	goto	1439,49.775,30.351,0
A	goto	1439,48.894,26.514,0
A	goto	1439,53.629,26.054,60,0
A	goto	1439,52.764,26.312,60,0
A	goto	1439,53.049,27.983,60,0
A	goto	1439,53.899,28.638,60,0
A	goto	1439,54.204,30.475,60,0
A	goto	1439,51.267,32.319,60,0
A	goto	1439,50.689,32.001,60,0
A	goto	1439,50.818,30.486,60,0
A	goto	1439,49.775,30.351,60,0
A	goto	1439,49.776,28.393,60,0
A	goto	1439,49.902,27.511,60,0
A	goto	1439,49.558,26.087,60,0
A	goto	1439,48.894,26.514,60,0
A	goto	1439,48.022,27.199,60,0
A	collect	5469,5,2178,1
A	mob	Foreststrider
S	
T	optional	
T	completewith	CliffCave
T	season	0 << !Warrior !Rogue
A	complete	2138,1
A	mob	Rabid Thistle Bear
S	
T	optional	
T	completewith	CliffCave
A	complete	1002,1
A	mob	Moonstalker
A	isOnQuest	1002
S	
T	optional	
T	season	0 << !Warrior !Rogue
T	loop	
A	goto	1439,53.629,26.054,0
A	goto	1439,54.204,30.475,0
A	goto	1439,49.775,30.351,0
A	goto	1439,48.894,26.514,0
A	goto	1439,53.629,26.054,60,0
A	goto	1439,52.764,26.312,60,0
A	goto	1439,53.049,27.983,60,0
A	goto	1439,53.899,28.638,60,0
A	goto	1439,54.204,30.475,60,0
A	goto	1439,51.267,32.319,60,0
A	goto	1439,50.689,32.001,60,0
A	goto	1439,50.818,30.486,60,0
A	goto	1439,49.775,30.351,60,0
A	goto	1439,49.776,28.393,60,0
A	goto	1439,49.902,27.511,60,0
A	goto	1439,49.558,26.087,60,0
A	goto	1439,48.894,26.514,60,0
A	goto	1439,48.022,27.199,60,0
A	collect	5469,5,2178,1
A	mob	Foreststrider
A	itemcount	5469,3
S	
T	season	0 << !Warrior !Rogue
T	loop	
A	goto	1439,53.629,26.054,0
A	goto	1439,54.204,30.475,0
A	goto	1439,49.775,30.351,0
A	goto	1439,48.894,26.514,0
A	goto	1439,48.022,27.199,60,0
A	goto	1439,48.894,26.514,60,0
A	goto	1439,49.558,26.087,60,0
A	goto	1439,49.902,27.511,60,0
A	goto	1439,49.776,28.393,60,0
A	goto	1439,49.775,30.351,60,0
A	goto	1439,50.818,30.486,60,0
A	goto	1439,50.689,32.001,60,0
A	goto	1439,51.267,32.319,60,0
A	goto	1439,54.204,30.475,60,0
A	goto	1439,53.899,28.638,60,0
A	goto	1439,53.049,27.983,60,0
A	goto	1439,52.764,26.312,60,0
A	goto	1439,53.629,26.054,60,0
A	collect	5469,5,2178,1
A	mob	Foreststrider
S	
T	optional	
A	goto	1439,51.288,24.554
A	turnin	1002
A	accept	1003
A	isQuestComplete	1002
A	subzoneskip	456,1
S	
T	optional	
T	completewith	next
T	season	0 << !Warrior !Rogue
T	label	CliffCave
A	goto	1439,54.934,32.721,20,0
A	goto	1439,55.108,33.600,40
S	Druid
A	goto	1439/1,-660.18,6874.43
T	season	0
A	complete	6122,1
S	
T	label	CaveMushrooms
A	goto	1439/1,-690.31,6751.29,12,0
A	goto	1439/1,-706.68,6748.23,12,0
A	goto	1439/1,-719.13,6787.530,12,0
T	season	0 << !Warrior !Rogue
A	complete	947,1
A	goto	1439/1,-663.45,6877.49,8,0
A	goto	1439/1,-679.17,6848.67,8,0
A	goto	1439/1,-666.73,6819.41,8,0
A	goto	1439/1,-680.48,6779.67,8,0
A	goto	1439/1,-663.45,6877.49,8,0
A	goto	1439/1,-679.17,6848.67,8,0
A	goto	1439/1,-666.73,6819.41,8,0
A	goto	1439/1,-680.48,6779.67,8,0
A	goto	1439/1,-663.45,6877.49
A	complete	947,2
A	goto	1439/1,-685.72,6746.49
S	NightElf !Druid
T	softcore	
T	optional	
T	completewith	CavetoAuber
T	season	0
A	deathskip	
A	target	Spirit Healer
S	skip --logout skip
T	hardcore	<< NightElf !Druid
T	optional	
T	label	MushroomLS
T	completewith	CavetoAuber
T	season	0
A	goto	1439,54.964,34.536
A	goto	1439,41.705,36.507,20
S	
T	hardcore	<< NightElf !Druid
T	completewith	CavetoAuber
A	collect	5469,5,2178,1
A	mob	Foreststrider Fledgling
A	isQuestAvailable	2178
S	
T	hardcore	<< NightElf !Druid
T	requires	MushroomLS
T	completewith	CavetoAuber
A	complete	1002,1
A	mob	Moonstalker Runt
A	isOnQuest	1002
S	
T	optional	
T	label	CavetoAuber
T	completewith	CliffspringEnd
A	subzone	442
S	
T	label	CliffspringEnd
T	season	0
A	goto	1439,37.394,40.128
A	turnin	4762
A	accept	4763
A	target	Thundris Windweaver
S	
A	goto	1439/1,472.32,6556.100
T	season	0
A	accept	2178
A	turnin	2178
A	turnin	6122
A	accept	6123
A	target	Alanndarian Nightsong
A	skill	cooking,<10,1
A	isQuestAvailable	2178 << Druid
S	Druid
T	optional	
T	season	0
A	goto	1439/1,472.32,6556.100
A	turnin	6122
A	accept	6123
A	target	Alanndarian Nightsong
S	!NightElf
T	optional	
A	goto	1439,37.439,41.839
A	accept	729
A	target	Archaeologist Hollee
A	isQuestComplete	2138
S	
A	goto	1439,38.107,41.165
A	turnin	982
A	target	Gorbold Steelhand
S	!NightElf
T	season	0
A	goto	1439,37.439,41.839
A	accept	729
A	target	Archaeologist Hollee
S	
A	goto	1439,38.843,43.416
T	season	0
A	turnin	2138
A	accept	2139
A	target	Tharnariun Treetender
A	isQuestComplete	2138
S	
A	goto	1439,38.843,43.416
T	season	0
A	accept	2139
A	target	Tharnariun Treetender
A	isQuestTurnedIn	2138
S	
A	goto	1439/1,472.32,6438.64
T	season	0
A	turnin	4813
A	target	Sentinel Glynda Nal'Shea
S	
A	goto	1439/1,467.08,6409.38
T	season	0
A	collect	12347,1,4763,1
A	use	12346
A	isOnQuest	4763
S	
A	goto	1439,37.322,43.640
T	season	0
A	turnin	947
A	accept	948
A	target	Barithras Moonshade
S	
A	goto	1439/1,504.41,6402.39
T	season	0
A	accept	4740
S	NightElf !Druid
A	goto	1439,36.767,44.285
T	season	0
T	optional	
A	accept	6343
A	isQuestAvailable	6343
A	target	Laird
S	
T	optional	
A	goto	1439/1,577.38,6371.35
T	season	0
A	turnin	1138
A	target	Gubber Blump
A	isQuestComplete	1138
S	
T	optional	
A	goto	1439,36.701,45.122,8,0
A	goto	1439,36.621,45.596
T	season	0
A	turnin	4723
A	turnin	4725
A	target	Gwennyth Bly'Leggonde
A	isOnQuest	4723
S	
T	optional	
T	season	0
T	label	End
A	goto	1439,36.701,45.122,8,0
A	goto	1439,36.621,45.596
A	turnin	4725
A	target	Gwennyth Bly'Leggonde
S	Druid
T	optional	
T	season	0
A	goto	1439,39.899,54.745,0
A	goto	1439,40.181,56.229,0
A	goto	1439,39.267,53.092,50,0
A	goto	1439,39.754,53.444,50,0
A	goto	1439,40.234,54.325,50,0
A	goto	1439,39.899,54.745,50,0
A	goto	1439,40.181,56.229,50,0
A	goto	1439,39.388,56.671,50,0
A	goto	1439,39.191,56.382,50,0
A	goto	1439,39.957,55.300,50,0
A	goto	1439,39.332,54.079,50,0
A	xp	16
A	mob	Blackwood Pathfinder
A	mob	Blackwood Windtalker
S	Druid
T	optional	
T	season	0
T	completewith	DruidLesson
A	goto	1439/1,561.66,6343.27
A	fly	Teldrassil
A	target	Caylais Moonfeather
S	Druid
T	optional	
T	season	0
A	goto	1438/1,950.52,8694.07
A	turnin	6343
A	target	Nessa Shadowsong
S	Druid
T	optional	
T	season	0
T	label	DruidLesson
T	completewith	next
A	goto	1438/1,965.80,8780.95
A	zone	Darnassus
S	Druid
A	goto	1457/1,2563.98,10179.00
T	season	0
A	accept	26
A	trainer	
A	target	Mathrengyl Bearwalker
S	Druid
T	optional	
T	season	0
T	completewith	next
A	abandon	729
S	Druid
A	goto	1438/1,2607.86,9641.94
T	season	0
A	accept	730
A	target	Chief Archaeologist Greywhisker
S	Druid
T	optional	
T	completewith	TotL
T	season	0
A	cast	18960
A	zoneskip	Moonglade
S	Druid
T	season	0
A	goto	1450/1,-2676.22,8019.01
A	turnin	26
A	accept	29
A	target	Dendrite Starblaze
S	Druid
T	season	0
A	goto	1450/1,-2595.43,7697.24
A	collect	15877,1,29,1
S	Druid
T	optional	
T	season	0
T	completewith	next
A	cast	18960
A	itemcount	15877,1
S	Druid
T	season	0
A	goto	1450/1,-2212.85,7854.68
A	complete	29,1
A	use	15877
S	Druid
T	label	TotL
T	season	0
A	goto	1450/1,-2224.18,7874.23
A	turnin	29
A	accept	272
A	target	Tajarri
S	Druid
T	optional	
T	season	0
A	hs	
A	zoneskip	Darkshore
E
G	Guides/forever/Alliance-11-20.lua
M	classic	
M	tbc	
M	season	0,1
M	version	1
M	selector	Alliance
M	group	RestedXP Forever Guide (A)
M	subgroup	Speedrun Guide 1-20
M	name	16-19 Darkshore
M	next	19-20 Redridge;20-21 Darkshore/Ashenvale << !Hunter
M	next	19-21 Darkshore/Ashenvale << Hunter
S	NightElf !Druid
T	optional	
T	completewith	PortalDarn
T	season	0
A	goto	1439/1,561.66,6343.27
A	fly	Teldrassil
A	target	Caylais Moonfeather
A	zoneskip	Teldrassil
S	NightElf !Druid
A	goto	1438/1,950.52,8694.07
T	season	0
A	turnin	6343
A	target	Nessa Shadowsong
S	NightElf !Druid
T	completewith	next
T	season	0
T	label	PortalDarn
A	goto	1438/1,965.80,8780.95
A	zone	Darnassus
S	NightElf Warrior
A	goto	1457/1,2316.91,9991.88
T	season	0
A	trainer	
A	target	Arias'ta Bladesinger
S	NightElf Warrior
A	goto	1457/1,2329.19,9908.60
T	season	0
A	skipgossip	11866,1
A	train	2567
A	target	Ilyenia Moonfire
S	NightElf Hunter
T	completewith	start
T	season	0
A	goto	1457/1,2511.01,10178.05
A	trainer	
A	target	Jocaste
S	NightElf Hunter
T	completewith	start
T	season	0
T	label	RecruveReinforced
A	goto	1457/1,2268.76,9770.63
A	collect	3027,1
A	target	Landria
A	money	<0.3812
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<7.50
S	Hunter
T	requires	RecruveReinforced
T	season	0
T	completewith	next
A	use	3027
A	itemcount	3027,1
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.19
A	xp	<20,1
S	Hunter
T	requires	RecruveReinforced
T	season	0
T	completewith	next
A	use	3026
A	itemcount	3026,1
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<7.49
S	NightElf Rogue
T	season	0
A	goto	1457/1,2601.39,10120.53,15,0
A	goto	1457/1,2546.78,10083.62
A	trainer	
A	target	Syurna
S	NightElf !Druid
T	optional	
T	season	0
T	completewith	next
A	abandon	729
S	NightElf !Druid
A	goto	1438/1,2607.86,9641.94
T	season	0
A	accept	730
A	target	Chief Archaeologist Greywhisker
S	NightElf Priest
A	goto	1457/1,2537.25,9654.40
T	season	0
A	trainer	
A	target	Jandria
S	NightElf !Druid
T	label	start
T	season	0
A	hs	
S	
A	goto	1439/1,504.41,6402.39
T	season	0
A	accept	4740
S	NightElf
A	goto	1439,37.439,41.839
T	season	0
A	turnin	730
A	accept	729
A	target	Archaeologist Hollee
A	isOnQuest	730
S	NightElf
T	optional	
A	goto	1439,37.439,41.839
T	season	0
A	accept	729
A	target	Archaeologist Hollee
S	
A	goto	1439,37.394,40.128
T	season	0
A	turnin	4762
A	accept	4763
A	target	Thundris Windweaver
S	
A	goto	1439/1,467.08,6409.38
T	season	0
A	use	12346
A	collect	12347,1,4763,1
A	isOnQuest	4763
S	
T	season	0
A	goto	1439,42.017,58.866,0
A	goto	1439,43.222,59.693,0
A	goto	1439,43.069,62.448,0
A	goto	1439,42.489,60.677,0
A	waypoint	1439,42.017,58.866,50,0
A	waypoint	1439,42.311,58.645,50,0
A	waypoint	1439,42.448,58.236,50,0
A	waypoint	1439,43.222,59.693,50,0
A	waypoint	1439,43.447,60.131,50,0
A	waypoint	1439,43.780,60.275,50,0
A	waypoint	1439,43.069,62.448,50,0
A	waypoint	1439,43.104,62.563,50,0
A	waypoint	1439,42.794,62.166,50,0
A	waypoint	1439,42.489,60.677,50,0
A	complete	963,1
A	unitscan	Anaya Dawnrunner
A	solo	
S	
T	season	0
A	goto	1439,42.017,58.866,0
A	goto	1439,43.222,59.693,0
A	goto	1439,43.069,62.448,0
A	goto	1439,42.489,60.677,0
A	waypoint	1439,42.017,58.866,50,0
A	waypoint	1439,42.311,58.645,50,0
A	waypoint	1439,42.448,58.236,50,0
A	waypoint	1439,43.222,59.693,50,0
A	waypoint	1439,43.447,60.131,50,0
A	waypoint	1439,43.780,60.275,50,0
A	waypoint	1439,43.069,62.448,50,0
A	waypoint	1439,43.104,62.563,50,0
A	waypoint	1439,42.794,62.166,50,0
A	waypoint	1439,42.489,60.677,50,0
A	complete	963,1
A	unitscan	Anaya Dawnrunner
A	group	
S	
T	xprate	<1.5 --<< !NightElf/Hunter
T	optional	
T	completewith	CompleteFangs
A	complete	1002,1
A	mob	Moonstalker Runt
A	mob	Moonstalker
A	isOnQuest	1002
S	
T	season	0
T	loop	
A	waypoint	1439/1,385.20,5393.69,0
A	waypoint	1439/1,155.30,5374.48,0
A	waypoint	1439/1,322.32,4907.25,0
A	waypoint	1439/1,385.20,5393.69,70,0
A	waypoint	1439/1,155.30,5374.48,70,0
A	waypoint	1439/1,322.32,4907.25,70,0
A	complete	2138,1
A	mob	Rabid Thistle Bear
S	Druid
T	xprate	<1.5
T	sticky	
T	label	earthroot
A	complete	6123,1
A	isOnQuest	6123
S	Druid
T	xprate	<1.5
A	goto	1439/1,98.97,6329.03,90,0
A	goto	1439/1,105.52,6189.30,90,0
A	goto	1439/1,164.47,6036.47,90,0
A	goto	1439/1,-51.68,6136.90,90,0
A	goto	1439/1,-25.48,6005.90
A	goto	1439/1,98.97,6329.03,0
A	goto	1439/1,105.52,6189.30,0
A	goto	1439/1,164.47,6036.47,0
A	goto	1439/1,-51.68,6136.90,0
A	complete	6123,2
A	isOnQuest	6123
S	
T	completewith	OnuGrove
T	season	0
A	goto	1439,43.555,76.293,80
S	
T	label	OnuGrove
T	season	0
A	goto	1439,43.555,76.293
A	turnin	952
A	turnin	948
A	accept	944
A	target	Onu
S	
T	completewith	MasterG
T	season	0
A	complete	986,1
A	unitscan	Moonstalker Sire
A	isOnQuest	986
S	
T	xprate	<1.5 --<< !NightElf/Hunter
T	completewith	MasterG
T	optional	
A	goto	1439/1,413.37,4818.17,0
A	complete	1003,1
A	isOnQuest	1003
A	mob	Grizzled Thistle Bear
S	
T	xprate	<1.5 --<< !NightElf/Hunter
T	optional	
A	goto	1439,41.390,80.563
A	turnin	1003
A	isQuestComplete	1003
S	
T	label	MasterG
T	season	0
A	goto	1439/1,417.30,4575.82,100
A	subzoneskip	449
A	isOnQuest	944
S	
T	optional	
T	completewith	TheryluneEnd
T	season	0
A	collect	5352,1,968,1
A	mob	Twilight Disciple
A	mob	Twilight Thug
S	
T	optional	
T	season	0
A	goto	1439,38.537,86.050
A	complete	944,1
S	
T	optional	
T	completewith	next
T	season	0
A	cast	5809
A	use	5251
S	
A	goto	1439,38.537,86.050
T	season	0
A	turnin	944
A	accept	949
A	use	5251
S	
A	goto	1439,38.537,86.050
T	season	0
A	turnin	949
A	accept	950
S	
A	goto	1439,38.660,87.305
T	season	0
A	accept	945
A	target	Therylune
S	
T	label	TheryluneEnd
T	season	0
A	goto	1439/1,288.26,4530.40
A	complete	945,1
A	isOnQuest	945
S	
T	optional	
T	season	0
T	sticky	
A	isQuestTurnedIn	949
A	destroy	5251
S	
T	optional	
T	season	0
T	completewith	TurtleSouth
T	completewith	prospector << Hunter
A	complete	986,1
A	isOnQuest	986
A	unitscan	Moonstalker Sire
S	
T	xprate	<1.5 --<< !NightElf/Hunter
T	optional	
A	goto	1439/1,227.35,4575.38,50,0
A	goto	1439/1,205.73,4639.130,50,0
A	goto	1439/1,129.10,4741.75,50,0
A	goto	1439/1,86.52,4839.13,50,0
A	goto	1439/1,338.70,4821.22,50,0
A	goto	1439/1,452.67,4684.98
A	complete	1003,1
A	isOnQuest	1003
A	mob	Grizzled Thistle Bear
S	
T	xprate	<1.5 --<< !NightElf/Hunter
T	label	LastBuzz
A	goto	1439,41.390,80.563
A	turnin	1003
A	isQuestComplete	1003
S	
A	goto	1439,43.555,76.293
T	season	0
A	turnin	950
A	timer	11.5,Return to Onu RP
A	accept	951
A	target	Onu
S	Hunter
T	optional	
T	season	0
A	goto	1439/1,417.30,4575.82
A	xp	17
S	Hunter
T	sticky	
T	season	0
T	label	prospector
A	goto	1439,35.724,83.696
A	turnin	729
A	target	Prospector Remtravel
S	Hunter
A	goto	1439/1,602.01,4678.87
T	season	0
A	accept	731,1
A	link	https://www.youtube.com/watch?v=crQAvyRIceU
A	target	Prospector Remtravel
S	Hunter
T	requires	prospector
T	season	0
A	link	https://www.youtube.com/watch?v=crQAvyRIceU
A	complete	731,1
A	isOnQuest	731
S	Hunter
T	xprate	<1.5
T	season	0
A	goto	1439,31.251,87.419
A	accept	4733
A	link	https://youtu.be/lfQM3Q-Ag5A
S	
T	completewith	CompleteThistleBears
T	season	0
A	complete	1138,1
A	mob	Reef Crawler
A	mob	Encrusted Tide Crawler
S	Hunter
T	xprate	<1.5
T	season	0
A	goto	1439,31.229,85.564
A	accept	4732
S	
T	label	TurtleSouth
T	xprate	<1.5
T	season	0
A	goto	1439,31.690,83.700
A	accept	4731
S	!Hunter
T	xprate	<1.5
T	season	0
A	goto	1439,32.644,80.711
A	accept	4730
S	Hunter
T	xprate	<1.5
T	season	0
A	goto	1439,32.644,80.711
A	accept	4730
S	Druid
T	optional	
T	season	0
A	complete	6123,1
A	isOnQuest	6123
A	skill	herbalism,<15,1
S	
T	label	Murk
T	season	0
A	goto	1439,35.429,76.566,0
A	goto	1439,35.429,76.566,60,0
A	goto	1439/1,541.75,4991.52
A	complete	4740,1
A	unitscan	Murkdeep
A	mob	Greymist Warrior
A	mob	Greymist Hunter
A	mob	Greymist Coastrunner
S	
T	label	CompleteThistleBears
T	season	0
A	goto	1439,35.968,70.807
A	accept	4728
S	Druid
T	label	Southcrabs
T	season	0
T	requires	earthroot
T	completewith	FlyDarkshore
A	cast	18960
A	zoneskip	Moonglade
S	Druid
T	requires	earthroot
T	season	0
A	goto	1450/1,-2593.82,7867.06
A	trainer	
A	target	Loganaar
A	xp	<18,1
S	Druid
T	label	FlyDarkshore
T	season	0
A	goto	1450/1,-2491.79,7454.76
A	fly	Auberdine
A	target	Sindrayl
A	zoneskip	Darkshore
S	NightElf !Druid/Dwarf Hunter
T	label	Southcrabs
T	season	0
T	completewith	CleansingTharnariun
A	subzone	442
S	
T	optional	
T	completewith	next
T	season	0
A	goto	1439,36.806,44.137,8,0
A	goto	1439,35.743,43.710,12
S	
T	optional	
T	season	0
A	goto	1439,35.743,43.710
A	turnin	963
A	target	Cerellean Whiteclaw
A	isQuestComplete	963
S	
T	optional	
T	season	0
T	completewith	CleansingTharnariun
A	abandon	963
S	
T	xprate	<1.5
T	season	0
T	label	BeachedTurnins
A	goto	1439,36.701,45.122,8,0
A	goto	1439,36.621,45.596
A	turnin	4728
A	turnin	4730
A	turnin	4731
A	turnin	4732
A	turnin	4733
A	target	Gwennyth Bly'Leggonde
S	
T	optional	
T	season	0
A	goto	1439/1,577.38,6371.35
A	turnin	1138
A	isQuestComplete	1138
A	target	Gubber Blump
S	
A	goto	1439/1,531.27,6403.27
A	vendor	
A	target	Laird
A	target	Allyndia
S	
A	goto	1439,37.703,43.393
T	season	0
A	turnin	4740
A	target	Sentinel Glynda Nal'Shea
S	
T	label	CleansingTharnariun
T	season	0
A	goto	1439,38.843,43.416
A	turnin	2138
A	accept	2139
A	target	Tharnariun Treetender
S	Hunter
A	goto	1439,37.439,41.839
T	season	0
A	turnin	731
A	accept	741
A	target	Archaeologist Hollee
A	isQuestComplete	731
S	Hunter
T	optional	
T	season	0
A	goto	1439,37.439,41.839
A	accept	741
A	target	Archaeologist Hollee
A	isQuestTurnedIn	731
S	Hunter
T	optional	
T	season	0
A	goto	1439/1,491.97,6560.47
A	vendor	
A	target	Dalmond
S	Druid
T	xprate	<1.5
T	season	0
A	goto	1439/1,472.32,6556.100
A	turnin	6123
A	accept	6124
A	isQuestComplete	6123
S	Druid
T	xprate	<1.5
T	optional	
T	season	0
A	goto	1439/1,472.32,6556.100
A	accept	6124
A	target	Alanndarian Nightsong
A	isQuestTurnedIn	6123
S	Druid
T	optional	
T	season	0
T	completewith	Buzzbox323End
A	abandon	6123
S	Druid
T	xprate	<1.5
T	optional	
T	season	0
T	completewith	Buzzbox323End
A	goto	1439/1,-313.68,6883.60,0
A	goto	1439/1,98.97,7237.30,0
A	goto	1439/1,347.87,6813.73,0
A	complete	6124,1
A	mob	Sickly Deer
A	isQuestAvailable	1138
S	Druid
T	xprate	<1.5
T	season	0
T	sticky	
T	label	SicklyDeers
T	loop	
A	goto	1439/1,-313.68,6883.60,0
A	goto	1439/1,98.97,7237.30,0
A	goto	1439/1,347.87,6813.73,0
A	waypoint	1439/1,-313.68,6883.60,40,0
A	waypoint	1439/1,98.97,7237.30,40,0
A	waypoint	1439/1,347.87,6813.73,40,0
A	complete	6124,1
A	mob	Sickly Deer
A	use	15826
A	isQuestTurnedIn	1138
S	
T	sticky	
T	label	Blackwood1
T	completewith	Xabraxxis
A	goto	1439/1,-489.22,6875.30,0
A	goto	1439/1,-376.56,6807.62
A	collect	12342,1,4763,1
A	complete	4763,1
A	disablecheckbox	
A	itemcount	12355,<1
S	
A	goto	1439/1,-503.63,6732.95,45,0
A	goto	1439/1,-430.27,6662.65
A	complete	2139,1
A	mob	Den Mother
S	
T	sticky	
T	requires	Blackwood1
T	label	Blackwood2
T	completewith	Xabraxxis
A	goto	1439/1,-489.22,6875.30,0
A	goto	1439/1,-453.20,6870.500
A	collect	12343,1,4763,1
A	complete	4763,1
A	disablecheckbox	
A	itemcount	12355,<1
S	
T	sticky	
T	requires	Blackwood2
T	label	Blackwood3
T	completewith	Xabraxxis
A	goto	1439/1,-489.22,6875.30,0
A	goto	1439/1,-520.66,6874.43
A	collect	12341,1,4763,1
A	complete	4763,1
A	disablecheckbox	
A	itemcount	12355,<1
S	
T	optional	
T	requires	Blackwood3
T	completewith	Xabraxxis
A	goto	1439/1,-489.22,6875.30
A	cast	16072
A	timer	17,The Blackwood Corrupted RP
A	use	12347
S	
T	requires	Blackwood3
T	label	Xabraxxis
A	goto	1439/1,-489.22,6875.30
A	use	12347
A	complete	4763,1
A	mob	Xabraxxis
S	!Hunter
T	xprate	<1.5
T	label	CompleteFangs
A	goto	1439/1,-503.63,6866.13
A	xp	18
S	Hunter
T	label	CompleteFangs
T	season	0
A	goto	1439/1,-503.63,6866.13
A	xp	18.75
S	
T	label	LateStalkerFangs
T	xprate	<1.5 --<< !NightElf/Hunter
T	optional	
T	loop	
A	goto	1439,53.629,26.054,0
A	goto	1439,54.204,30.475,0
A	goto	1439,49.775,30.351,0
A	goto	1439,48.894,26.514,0
A	goto	1439,48.022,27.199,60,0
A	goto	1439,48.894,26.514,60,0
A	goto	1439,49.558,26.087,60,0
A	goto	1439,49.902,27.511,60,0
A	goto	1439,49.776,28.393,60,0
A	goto	1439,49.775,30.351,60,0
A	goto	1439,50.818,30.486,60,0
A	goto	1439,50.689,32.001,60,0
A	goto	1439,51.267,32.319,60,0
A	goto	1439,54.204,30.475,60,0
A	goto	1439,53.899,28.638,60,0
A	goto	1439,53.049,27.983,60,0
A	goto	1439,52.764,26.312,60,0
A	goto	1439,53.629,26.054,60,0
A	complete	1002,1
A	mob	Moonstalker Runt
A	mob	Moonstalker
A	isOnQuest	1002
S	
T	xprate	<1.5 --<< !NightElf/Hunter
T	label	Buzzbox323End
T	requires	SicklyDeers << Druid --xprate <1.5
A	goto	1439,51.288,24.554
A	turnin	1002
A	accept	1003
S	
T	xprate	>1.49 << Hunter/Druid
A	goto	1439,54.973,24.885
A	turnin	965
A	accept	966
A	target	Balthule Shadowstrike
S	
T	xprate	>1.49 << Hunter/Druid
T	loop	
A	goto	1439,55.231,26.508,0
A	goto	1439,56.194,27.071,0
A	goto	1439,56.047,26.586,0
A	goto	1439,55.231,26.508,50,0
A	goto	1439,55.369,27.025,50,0
A	goto	1439,55.763,26.695,50,0
A	goto	1439,55.815,26.972,50,0
A	goto	1439,56.194,27.071,50,0
A	goto	1439,56.790,27.621,50,0
A	goto	1439,57.278,26.311,50,0
A	goto	1439,57.046,26.234,50,0
A	goto	1439,56.544,26.598,50,0
A	goto	1439,56.047,26.586,50,0
A	goto	1439,55.743,25.915,50,0
A	complete	966,1
A	mob	Dark Strand Fanatic
S	
T	xprate	>1.59
T	loop	
T	optional	
A	goto	1439,55.231,26.508,0
A	goto	1439,56.194,27.071,0
A	goto	1439,56.047,26.586,0
A	goto	1439,55.743,25.915,50,0
A	goto	1439,56.047,26.586,50,0
A	goto	1439,56.544,26.598,50,0
A	goto	1439,57.046,26.234,50,0
A	goto	1439,57.278,26.311,50,0
A	goto	1439,56.790,27.621,50,0
A	goto	1439,56.194,27.071,50,0
A	goto	1439,55.815,26.972,50,0
A	goto	1439,55.763,26.695,50,0
A	goto	1439,55.369,27.025,50,0
A	goto	1439,55.231,26.508,50,0
A	xp	18+15000
A	mob	Dark Strand Fanatic
S	
T	xprate	>1.49 << Hunter/Druid
A	goto	1439,54.973,24.885
A	turnin	966
A	accept	967
A	target	Balthule Shadowstrike
S	
T	season	0
A	goto	1439/1,-800.35,7370.92,55,0
A	goto	1439/1,-855.37,7449.96,55,0
A	goto	1439/1,-880.91,7302.36,55,0
A	goto	1439/1,-950.34,7258.26,55,0
A	goto	1439/1,-1005.36,7383.58
A	complete	951,1
S	
A	goto	1439,56.654,13.484
A	accept	2098
A	target	Gelkak Gyromast
S	
T	optional	
T	completewith	next
A	goto	1439/1,-732.88,7596.24,0
A	complete	2098,3
A	mob	Raging Reef Crawler
A	mob	Encrusted Tide Crawler
S	
A	goto	1439/1,-656.25,7801.04
A	complete	2098,2
A	mob	Greymist Tidehunter
A	mob	Greymist Oracle
S	
A	goto	1439/1,-699.48,7591.87,45,0
A	goto	1439/1,-579.61,7505.41,45,0
A	goto	1439/1,-421.10,7372.67,45,0
A	goto	1439/1,-767.60,7805.84
A	complete	2098,3
A	mob	Raging Reef Crawler
A	mob	Encrusted Tide Crawler
S	
T	sticky	
T	label	foreststriders
A	goto	1439/1,-941.83,7756.06,55,0
A	goto	1439/1,-1080.03,7922.87,50,0
A	goto	1439/1,-1087.24,7780.51,50,0
A	goto	1439/1,-1069.55,7661.74,50,0
A	goto	1439/1,-1080.03,7922.870
A	complete	2098,1
A	mob	Giant Foreststrider
S	
T	xprate	<1.59
T	label	NorthStalkerPelts
A	goto	1439/1,-1080.03,7922.87,45,0
A	goto	1439/1,-1146.84,7998.41
A	complete	986,1
A	mob	Moonstalker Sire
A	mob	Moonstalker Matriarch
A	mob	Moonstalker Runt
S	Warrior/Paladin/Rogue
T	season	0
T	requires	foreststriders
A	goto	1439,56.654,13.484
A	turnin	2098
A	accept	2078
A	target	Gelkak Gyromast
A	solo	
S	
T	requires	foreststriders
A	group	2 << Warrior/Paladin/Rogue
A	goto	1439,56.654,13.484
A	turnin	2098
A	accept	2078
A	target	Gelkak Gyromast
S	
T	optional	
T	completewith	next
A	goto	1439,55.802,18.290
A	gossipoption	95406
A	target	The Threshwackonator 4100
A	isOnQuest	2078 << Warrior/Paladin/Rogue
S	
T	label	Turtle4727
A	goto	1439,53.113,18.099
A	accept	4727
S	
A	goto	1439,56.654,13.484
T	optional	
A	complete	2078,1
A	link	https://youtu.be/1WRRmKYBr9s
A	mob	The Threshwackonator 4100
A	isOnQuest	2078 << Warrior/Paladin/Rogue
S	
T	optional	<< Warrior/Paladin/Rogue
A	goto	1439,56.654,13.484
A	turnin	2078
A	target	Gelkak Gyromast
A	isQuestComplete	2078
S	
T	optional	
T	completewith	BeachedCloak
A	abandon	2078
S	Druid
T	xprate	<1.5
T	optional	
T	completewith	DeerComplete
A	complete	1138,1
A	mob	Encrusted Tide Crawler
S	
T	sticky	
T	label	DeleteGyromast
T	optional	
A	destroy	7442
S	!NightElf !Dwarf Hunter !Druid
T	completewith	BeachedCloak
T	map	Darkshore
A	goto	1448/1,577.92,6371.65,100
A	cooldown	item,6948,<0
S	!NightElf !Dwarf Hunter !Druid
T	xprate	<1.59
T	optional	
T	completewith	next
A	hs	
A	cooldown	item,6948,>0,1
S	Druid
T	label	Turtle4727
A	goto	1439,53.113,18.099
A	accept	4727
S	Druid
T	xprate	<1.5
T	label	DeerComplete
T	loop	
A	goto	1439/1,-313.68,6883.60,0
A	goto	1439/1,98.97,7237.30,0
A	goto	1439/1,347.87,6813.73,0
A	goto	1439/1,-313.68,6883.60,40,0
A	goto	1439/1,98.97,7237.30,40,0
A	goto	1439/1,347.87,6813.73,40,0
A	complete	6124,1
A	mob	Sickly Deer
A	use	15826
S	Druid
A	goto	1439/1,-259.32,7839.03
A	collect	15883,1,272,1
S	Druid
T	xprate	>1.59
T	optional	
T	completewith	next
A	cast	18960
A	zoneskip	Moonglade
A	xp	<20,1
S	Druid
T	xprate	>1.59
T	optional	
A	goto	1450/1,-2593.82,7867.06
A	trainer	
A	target	Loganaar
A	xp	<20,1
S	Druid
T	xprate	>1.59
T	optional	
T	completewith	next
A	hs	
A	zoneskip	Darkshore
A	subzoneskip	442
A	xp	<20,1
S	
T	xprate	>1.59
T	label	BlackwoodSod
A	goto	1439,37.394,40.128
A	turnin	4763
A	target	Thundris Windweaver
S	
T	xprate	>1.59
T	optional	
T	completewith	BeachedCloak
A	destroy	12342
S	
T	xprate	>1.59
T	optional	
T	completewith	BeachedCloak
A	destroy	12343
S	
T	xprate	>1.59
T	optional	
T	completewith	BeachedCloak
A	destroy	12341
S	
T	season	1
T	xprate	>1.59
T	optional	
A	goto	1439/1,488.69,6564.830
A	collect	4470,1
A	collect	4471,1
A	itemcount	6889,1
A	skill	cooking,50,1
A	target	Dalmond
S	
T	season	1
T	xprate	>1.59
T	optional	
A	goto	1439,38.107,41.165
A	vendor	6301
A	collect	2678,50,90,1,0x20,cooking
A	disablecheckbox	
A	collect	6889,50,90,1,0x20,cooking
A	disablecheckbox	
A	target	Gorbold Steelhand
A	skill	cooking,50,1
A	itemcount	6889,1
S	
T	xprate	>1.59
A	goto	1439,38.843,43.416
A	turnin	2139
A	target	Tharnariun Treetender
S	
T	xprate	>1.59
T	optional	
T	label	PeltEnd
A	goto	1439,39.373,43.483
A	turnin	986
A	target	Terenthis
A	isQuestTurnedIn	986
S	
T	xprate	>1.59
T	optional	
T	completewith	BeachedCloak
A	equip	15,5387
A	itemcount	5387,1
A	itemStat	15,QUALITY,<7
S	
T	xprate	>1.59
T	requires	DeleteGyromast
A	goto	1439/1,577.38,6371.35
A	turnin	1138
A	target	Gubber Blump
A	isQuestComplete	1138
S	
T	xprate	>1.59
T	label	BeachedCloak
A	goto	1439,36.701,45.122,8,0
A	goto	1439,36.621,45.596
A	turnin	4727
A	target	Gwennyth Bly'Leggonde
S	Warrior/Paladin/Mage/Warlock/Rogue
T	xprate	>1.59
T	label	TravelMenethilNoDMBoat
T	completewith	MenethilNoDMBoat
A	goto	1439/1,816.85,6424.66,15
A	zoneskip	Wetlands
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	dungeon	!DM
S	Warrior/Paladin/Mage/Warlock/Rogue
T	season	1
T	xprate	>1.59
T	optional	
T	label	DarkshoreNoDMCook1
T	requires	TravelMenethilNoDMBoat
T	completewith	MenethilNoDMBoat
A	cast	818
A	usespell	818
A	zoneskip	Wetlands
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	itemcount	6889,1
A	itemcount	4470,1
A	itemcount	4471,1
A	skill	cooking,50,1
A	dungeon	!DM
S	Warrior/Paladin/Mage/Warlock/Rogue
T	season	1
T	xprate	>1.59
T	optional	
T	requires	DarkshoreNoDMCook1
T	completewith	MenethilNoDMBoat
A	usespell	2550
A	zoneskip	Wetlands
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	itemcount	6889,1
A	itemcount	4471,1
A	skill	cooking,50,1
A	dungeon	!DM
S	Warrior/Paladin
T	xprate	>1.59
T	ah	
T	label	MenethilNoDMBoat
A	goto	1439/1,826.67,6409.82
A	zone	Wetlands
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.8 << Paladin/Warrior
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	dungeon	!DM
S	Warrior/Paladin/Mage/Warlock/Rogue
T	xprate	>1.59
T	ssf	<< Paladin/Warrior
T	label	MenethilNoDMBoat
A	goto	1439/1,826.67,6409.82
A	zone	Wetlands
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.8 << Paladin/Warrior
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	dungeon	!DM
S	Warrior/Paladin
T	ah	
T	xprate	>1.59
T	optional	
T	label	PalWarSkip20
A	goto	1437,11.579,59.540,6,0
A	goto	1437,11.435,59.696
A	vendor	1441
A	collect	4818,1,2040,1
A	disablecheckbox	
A	target	Brak Durnad
A	zoneskip	Darkshore
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.8
A	itemcount	4818,<1
A	dungeon	!DM
S	Warrior/Paladin
T	ssf	
T	xprate	>1.59
A	goto	1437,11.579,59.540,6,0
A	goto	1437,11.435,59.696
A	collect	4818,1,2040,1
A	disablecheckbox	
A	collect	922,1,2040,1
A	target	Brak Durnad
A	zoneskip	Darkshore
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.8
A	itemcount	922,<1
A	itemcount	4818,<1
A	dungeon	!DM
S	!NightElf Warrior/Paladin
T	xprate	>1.59
T	optional	
A	use	4818
A	itemcount	4818,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.8
A	dungeon	!DM
S	!NightElf Warrior/Paladin
T	xprate	>1.59
T	optional	
A	use	922
A	itemcount	922,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.8
A	xp	<21,1
A	dungeon	!DM
S	!NightElf Warrior/Paladin/Mage/Warlock/!NightElf Rogue
T	xprate	>1.59
A	goto	Wetlands,9.490,59.694
A	fly	Ironforge
A	target	Shellei Brondir
A	zoneskip	Darkshore << Warrior/Paladin
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	dungeon	!DM
S	NightElf Rogue
T	xprate	>1.59
A	goto	Wetlands,9.490,59.694
A	fp	Menethil Harbor
A	target	Shellei Brondir
A	dungeon	!DM
S	NightElf Rogue
T	xprate	>1.59
T	optional	
T	completewith	next
A	goto	1437/0,-616.41,-3916.22,40
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Ironforge
A	zoneskip	Westfall
A	dungeon	!DM
S	NightElf Rogue
T	xprate	>1.59
A	goto	1437/0,-490.20,-4316.78,-1
A	goto	1455/0,-848.70,-5009.12,-1
A	zone	Ironforge
A	link	https://www.youtube.com/watch?v=oVoxsr4zcg4
A	link	https://us.battle.net/support/en/help/product/wow/197/834/solution
A	subzoneskip	809
A	subzoneskip	2257
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Ironforge
A	zoneskip	Westfall
A	dungeon	!DM
S	NightElf Rogue
T	xprate	>1.59
T	optional	
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
A	goto	1453/0,1320.57,-8540.2,20,0
A	goto	1453/0,1242.03,-8638.88,10,0
A	goto	StormwindClassic,7,45.471,10,0
A	goto	StormwindClassic,5.560,50.125,10,0
A	goto	1453/0,1197.22,-8946.62,20,0
A	goto	1436/0,1545.83,-11056.200
A	zone	Westfall
A	zoneskip	Ironforge
A	subzoneskip	809
A	subzoneskip	2257
A	zoneskip	Stormwind City
A	dungeon	!DM
S	NightElf Rogue
T	xprate	>1.59
T	optional	
T	completewith	next
A	goto	1436/0,1116.87,-9616.07,100,0
A	goto	1436/0,1037.42,-10628.27,100
A	zoneskip	Ironforge
A	subzoneskip	809
A	subzoneskip	2257
A	zoneskip	Stormwind City
A	dungeon	!DM
S	NightElf Rogue
T	xprate	>1.59
T	optional	
A	goto	1436/0,1037.42,-10628.27
A	fp	Sentinel Hill
A	target	Thor
A	zoneskip	Ironforge
A	subzoneskip	809
A	subzoneskip	2257
A	zoneskip	Stormwind City
A	dungeon	!DM
S	NightElf Rogue
T	xprate	>1.59
T	optional	
A	goto	1436/0,1045.12,-10508.80
A	accept	65
A	target	Gryan Stoutmantle
A	zoneskip	Westfall,1
A	dungeon	!DM
S	NightElf Rogue
T	xprate	>1.59
T	optional	
A	goto	1429/0,257.84,-9616.01,100,0
A	goto	1453/0,440.51,-9054.94
A	zone	Stormwind City
A	zoneskip	Ironforge
A	subzoneskip	809
A	subzoneskip	2257
A	dungeon	!DM
S	NightElf Rogue
T	xprate	>1.59 << !Hunter
T	label	WepTrainNoDM
T	optional	<< NightElf
A	goto	1453/0,613.12,-8795.96
A	train	201
A	train	202
A	target	Woo Ping
A	subzoneskip	809
A	subzoneskip	2257
A	zoneskip	Darkshore
A	zoneskip	Wetlands
A	zoneskip	Ironforge
A	dungeon	!DM
S	NightElf Warrior
T	xprate	>1.59
T	season	1 --Not loading for now
T	optional	
A	goto	1455/0,-1197.27,-5041.49
A	train	197
A	train	199
A	target	Buliwyf Stonehand
A	zoneskip	Wetlands
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	dungeon	!DM
S	NightElf Warrior
T	xprate	>1.59
T	season	1 --Not loading for now
T	optional	
A	goto	1455,62.378,88.671
A	collect	3107,1
A	target	Brenwyn Wintersteel
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.3
A	zoneskip	Wetlands
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	dungeon	!DM
S	Paladin/Warrior
T	xprate	>1.59
T	season	1 --Not loading for now
T	ah	
T	optional	<< NightElf
A	goto	1455,62.378,88.671
A	collect	922,1,2040,1
A	target	Brenwyn Wintersteel
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.0
A	train	202,3 << NightElf Warrior
A	dungeon	!DM
S	Paladin/Warrior
T	xprate	>1.59
T	season	1 --Not loading for now
T	optional	
A	use	922
A	itemcount	922,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.8
A	xp	<21,1
A	dungeon	!DM
S	NightElf Warrior
T	xprate	>1.59
T	season	1 --Not loading for now
T	optional	<< NightElf
T	completewith	DeeprunDM
A	use	3107
A	itemcount	3107,1
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.3
A	zoneskip	Wetlands
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	dungeon	!DM
S	Warrior
T	xprate	>1.59
T	season	1 --Not loading for now
T	optional	
T	completewith	next
A	goto	1455,67.400,84.909,15,0
A	goto	1455/0,-1234.65,-5035.67,12
A	zoneskip	Darkshore
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	train	202,3 << NightElf Warrior
A	dungeon	!DM
S	Warrior
T	xprate	>1.59
T	season	1 --Not loading for now
T	optional	<< NightElf
A	goto	1455/0,-1234.65,-5035.67
A	trainer	
A	target	Bilban Tosslespanner
A	zoneskip	Darkshore
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	train	202,3 << NightElf Warrior
A	dungeon	!DM
S	NightElf Rogue
T	xprate	>1.59
A	goto	1455/0,-1152.32,-4821.18
A	fp	Ironforge
A	target	Gryth Thurden
A	zoneskip	Wetlands
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	dungeon	!DM
S	
T	optional	
A	goto	1455/0,-1115.43,-4598.86
A	accept	968
A	use	5352
A	itemcount	5352,1
A	zoneskip	Darkshore << Warrior/Paladin
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	dungeon	!DM
S	Paladin/Mage/Warlock/Rogue
T	xprate	>1.59
A	goto	1455/0,-1115.43,-4598.86
A	turnin	968
A	target	Gerrig Bonegrip
A	isOnQuest	968
A	zoneskip	Darkshore << Warrior/Paladin
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	dungeon	!DM
S	Mage
T	xprate	>1.59
T	optional	
T	completewith	next
A	goto	1455/0,-940.5,-4704.2,12,0
A	goto	1455/0,-947.62,-4709.69,10,0
A	goto	1455/0,-954.73,-4709.48,10,0
A	goto	1455/0,-961.22,-4715.920,12
A	dungeon	!DM
S	Mage
T	xprate	>1.59
A	goto	1455/0,-961.22,-4715.920
A	collect	17031,4
A	target	Ginny Longberry
A	dungeon	!DM
S	Mage
T	xprate	>1.59
T	label	MilstaffNoDM
A	goto	1455/0,-915.2,-4606.38
A	train	3562
A	target	Milstaff Stormeye
A	dungeon	!DM
S	Mage
T	xprate	>1.59
A	goto	1455/0,-928.48,-4614.620
A	trainer	
A	target	Dink
A	dungeon	!DM
S	Paladin
T	xprate	>1.59
A	goto	1455/0,-896.47,-4601.65
A	trainer	
A	target	Brandur Ironhammer
A	zoneskip	Darkshore
A	dungeon	!DM
S	skip --logout skip Mage
T	xprate	>1.59
T	optional	
T	completewith	DeeprunNoDM
A	goto	1455,27.611,8.074
A	goto	1455,76.414,51.226,20
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	dungeon	!DM
S	Warlock/Rogue
T	xprate	>1.59
T	optional	
T	completewith	next
A	goto	1455,53.164,7.037,10
A	zoneskip	Darkshore << Warrior
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	isQuestTurnedIn	968
A	train	202,1 << Warrior
A	dungeon	!DM
S	skip --logout skip Warlock/Rogue
T	xprate	>1.59
T	optional	
T	completewith	DeeprunNoDM
A	goto	1455,52.825,5.060
A	goto	1455,76.414,51.226,20
A	zoneskip	Darkshore << Warrior
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	isQuestTurnedIn	968
A	train	202,1 << Warrior
A	dungeon	!DM
S	skip --logout skip Warlock/Rogue
T	xprate	>1.59
T	optional	
T	completewith	DeeprunNoDM
A	goto	1455,56.207,46.844
A	goto	1455,76.414,51.226,20
A	zoneskip	Darkshore << Warrior
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	isQuestAvailable	968
A	train	202,1 << Warrior
A	dungeon	!DM
S	Mage/Warlock/Rogue
T	xprate	>1.59
T	requires	MilstaffNoDM << Mage
A	goto	1455,67.842,42.456
A	vendor	5175
A	target	Gearcutter Cogspinner
A	zoneskip	Darkshore << Warrior
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	subzoneskip	2257
A	bronzetube	
A	train	202,1 << Warrior
A	dungeon	!DM
S	Mage/Warlock/Rogue
T	xprate	>1.59
T	requires	MilstaffNoDM << Mage
T	label	DeeprunNoDM
A	goto	1455/0,-1330.28,-4840.430
A	subzone	2257
A	zoneskip	Darkshore << Warrior
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	train	202,1 << Warrior
A	dungeon	!DM
S	Mage/Warlock/Rogue
T	xprate	>1.59
T	completewith	WepTrainNoDM << !Warrior
A	zone	Stormwind City
A	zoneskip	Darkshore << Warrior
A	zoneskip	Elwynn Forest
A	zoneskip	Westfall
A	train	202,1 << Warrior
A	dungeon	!DM
S	Mage/Warlock/Rogue
T	xprate	>1.59
A	goto	1453/0,638.8,-8341.95
A	vendor	5519
A	target	Billibub Cogspinner
A	zoneskip	Darkshore << Warrior/Paladin
A	bronzetube	
A	train	201,1 << NightElf Rogue
A	train	202,1 << Warrior
A	dungeon	!DM
S	Mage/Warlock/Rogue
T	xprate	>1.59
A	goto	1453/0,600.22,-8426.93
A	turnin	1338
A	target	Furen Longbeard
A	isOnQuest	1338
A	dungeon	!DM
S	NightElf Warrior
T	xprate	>1.59
T	season	1 --Not loading for now
T	optional	
T	completewith	next
A	goto	1453,74.592,51.567,15,0
A	goto	1453,78.011,47.797,15,0
A	goto	1453,80.030,45.591,12
A	zoneskip	Darkshore
A	zoneskip	Ironforge
A	dungeon	!DM
S	NightElf Warrior
T	xprate	>1.59
T	season	1 --Not loading for now
A	goto	1453,78.673,45.791
A	trainer	
A	target	Wu Shen
A	zoneskip	Darkshore
A	zoneskip	Ironforge
A	dungeon	!DM
S	Rogue
T	xprate	>1.59
T	optional	
T	completewith	RogueTrainNoDMEnd
A	goto	1453/0,377.47,-8752.39
A	train	8676
A	target	Osborne the Night Man
A	dungeon	!DM
S	Rogue
T	xprate	>1.59
T	optional	
A	goto	1453/0,377.47,-8752.39
A	train	1784
A	train	921
A	train	1804
A	trainer	
A	target	Osborne the Night Man
A	dungeon	!DM
A	train	1784,1
A	train	921,1
S	Rogue
T	xprate	>1.59
T	optional	
A	goto	1453/0,377.47,-8752.39
A	train	921
A	train	1804
A	trainer	
A	target	Osborne the Night Man
A	dungeon	!DM
A	train	921,1
S	Rogue
T	xprate	>1.59
T	label	RogueTrainNoDMEnd
A	goto	1453/0,377.47,-8752.39
A	train	1804
A	trainer	
A	target	Osborne the Night Man
A	dungeon	!DM
S	Rogue
T	xprate	>1.59
T	optional	
T	completewith	next
A	goto	1453,74.799,53.815,15,0
A	goto	1453,77.290,58.138,12,0
A	goto	1453,78.466,60.034,12,0
A	goto	1453,78.560,58.435,6,0
A	goto	1453,75.754,60.369,12
A	dungeon	!DM
S	Rogue
T	xprate	>1.59
A	accept	2281
A	goto	1453/0,362.55,-8819.80
A	target	+Renzik "The Shiv"
A	accept	2360
A	goto	1453/0,362.28,-8815.23
A	target	+Master Mathias Shaw
A	dungeon	!DM
S	NightElf Rogue/Mage/Warlock
T	xprate	>1.59 << !Hunter
T	season	1 << Rogue sod
T	label	WepTrainNoDM
T	optional	<< NightElf
A	goto	1453/0,613.12,-8795.96
A	train	201
A	train	1180
A	train	202
A	target	Woo Ping
A	dungeon	!DM
S	NightElf Warrior
T	xprate	>1.59
T	season	1 --Not loading for now
T	optional	
T	completewith	NoDMStockadeEnd
A	use	4818
A	itemcount	4818,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.8
A	dungeon	!DM
S	NightElf Warrior
T	xprate	>1.59
T	season	1 --Not loading for now
T	ah	
T	optional	
A	goto	1453/0,609.63,-8787.71
A	collect	922,1,2040,1
A	target	Marda Weller
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.0
A	zoneskip	Stormwind City,1
A	dungeon	!DM
S	NightElf Warrior
T	xprate	>1.59
T	season	1 --Not loading for now
T	optional	
A	use	922
A	itemcount	922,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.8
A	xp	<21,1
A	dungeon	!DM
S	Rogue
T	xprate	>1.59
T	ah	
A	goto	1453/0,609.63,-8787.71
A	collect	2209,2
A	target	Marda Weller
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<10.93
A	dungeon	!DM
S	Rogue
T	xprate	>1.59
T	ssf	
A	goto	1453/0,609.63,-8787.71
A	collect	2209,1
A	target	Marda Weller
A	money	<0.8743
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<10.93
A	dungeon	!DM
S	Rogue
T	xprate	>1.59
T	optional	
T	completewith	NoDMStockadeEnd
A	use	2209
A	itemcount	923,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<10.93
A	xp	<21,1
A	dungeon	!DM
S	Rogue
T	xprate	>1.59
T	ah	
A	goto	1453/0,660.28,-8814.55
A	collect	6452,1,2359,1 << !Dwarf
A	collect	2296,5,92,1
A	collect	1080,5,92,1
A	collect	1081,5,92,1
A	target	Auctioneer Jaxon
A	dungeon	!DM
S	Rogue
T	xprate	>1.59
T	completewith	GryanAll << Human
T	optional	<< Human
A	goto	1453/0,603.77,-8801.7,30,0
A	goto	1453/0,530.03,-8835.51,30,0
A	goto	1453/0,533.45,-8868.15,15,0
A	goto	1453/0,490.04,-8835.80
A	fp	Stormwind
A	fly	Westfall
A	target	Dungar Longdrink
A	zoneskip	Westfall << Human
A	dungeon	!DM
S	Rogue
T	xprate	>1.59
T	optional	
T	completewith	next
A	zone	Westfall
A	dungeon	!DM
S	Rogue
T	xprate	>1.59
T	label	GryanAll << Human
A	goto	1436/0,1045.12,-10508.80
A	accept	65
A	target	Gryan Stoutmantle
A	dungeon	!DM
S	Rogue
T	xprate	>1.59
A	goto	1436/0,1037.42,-10628.27
A	fp	Sentinel Hill
A	fly	Redridge
A	target	Thor
A	dungeon	!DM
S	Human Rogue
T	xprate	>1.59
T	optional	
T	completewith	WileyStart
A	goto	1453/0,603.77,-8801.7,30,0
A	goto	1453/0,530.03,-8835.51,30,0
A	goto	1453/0,533.45,-8868.15,15,0
A	goto	1453/0,490.04,-8835.80
A	fly	Redridge
A	target	Dungar Longdrink
A	zoneskip	Stormwind City,1
A	isOnQuest	65
A	dungeon	!DM
S	!Human Rogue
T	xprate	>1.59
A	goto	1429/0,-727.57,-9555.160
A	accept	94
A	target	Theocritus
A	dungeon	!DM
A	xp	<20,1
S	!Human Rogue
T	xprate	>1.59
T	optional	
T	completewith	WileyStart
A	goto	1433/0,-1902.32,-9609.54
A	zone	Redridge Mountains
A	dungeon	!DM
S	Rogue
T	xprate	>1.59 << !Hunter
T	optional	
A	goto	1433/0,-2062.96,-9209.62
A	accept	92
A	turnin	92
A	itemcount	2296,5
A	itemcount	1080,5
A	itemcount	1081,5
A	target	Chef Breanna
A	dungeon	!DM
S	Rogue
T	xprate	>1.59
T	label	WileyStart
A	goto	1433/0,-2164.56,-9213.10,8,0
A	goto	1433/0,-2145.67,-9231.49
A	turnin	65
A	accept	132
A	target	Wiley the Black
A	dungeon	!DM
S	Rogue
T	xprate	>1.59
T	label	Rendevous
A	goto	1433/0,-2180.19,-9328.21
A	turnin	2281
A	accept	2282
A	target	Lucius
A	dungeon	!DM
S	Rogue
T	xprate	>1.59
A	goto	1433/0,-2269.84,-9278.69
A	accept	89
A	target	Foreman Oslow
A	xp	21.4,1
A	dungeon	!DM
S	Rogue
T	xprate	>1.59
T	sticky	
T	completewith	next
A	goto	1433/0,-2430.48,-9055.71,0
A	goto	1433/0,-2400.09,-9091.91,0
A	goto	1433/0,-2334.97,-9122.31,0
A	goto	1433/0,-2263.33,-9146.93,0
A	goto	1433/0,-2189.52,-9135.34,0
A	goto	1433/0,-2115.71,-9120.86,0
A	complete	89,1
A	complete	89,2
A	isOnQuest	89
A	dungeon	!DM
A	mob	Redridge Brute
A	mob	Redridge Mystic
A	mob	Redridge Basher
S	Rogue
T	xprate	>1.59
A	goto	1433,51.846,45.116,100
S	Rogue
T	xprate	>1.59
A	goto	1433,51.846,45.116
A	skill	lockpicking,80
A	dungeon	!DM
S	Rogue
T	xprate	>1.59
A	goto	1433/0,-2700.75,-9222.07
A	complete	2282,1
A	dungeon	!DM
S	Rogue
T	xprate	>1.59
A	goto	1433/0,-2430.48,-9055.71
A	goto	1433/0,-2400.09,-9091.91,0
A	goto	1433/0,-2334.97,-9122.31,0
A	goto	1433/0,-2263.33,-9146.93,0
A	goto	1433/0,-2189.52,-9135.34,0
A	goto	1433/0,-2115.71,-9120.86,0
A	complete	89,1
A	complete	89,2
A	isOnQuest	89
A	dungeon	!DM
A	mob	Redridge Brute
A	mob	Redridge Mystic
A	mob	Redridge Basher
S	Rogue
T	xprate	>1.59
A	goto	1433/0,-2269.84,-9278.69
A	turnin	89
A	isQuestComplete	89
A	target	Foreman Oslow
A	dungeon	!DM
S	Rogue
T	xprate	>1.59
A	goto	1433/0,-2180.19,-9328.21
A	turnin	2282
A	target	Lucius
A	dungeon	!DM
S	Rogue
T	xprate	>1.59
T	optional	
T	completewith	DefiasWestfall2
A	destroy	7907
A	dungeon	!DM
S	Rogue
T	xprate	>1.59
A	xp	21+14325
A	dungeon	!DM
S	Rogue
T	xprate	>1.59
T	completewith	next
A	goto	1433/0,-2234.89,-9435.35
A	fp	Redridge Mountains
A	fly	Westfall
A	target	Ariena Stormfeather
A	dungeon	!DM
S	Rogue
T	xprate	>1.59
T	label	DefiasWestfall2
A	goto	1436/0,1045.29,-10508.78
A	turnin	132
A	accept	135
A	target	Gryan Stoutmantle
A	dungeon	!DM
S	Rogue
T	xprate	>1.59
T	optional	
T	completewith	KlavenFinish
A	use	923
A	itemcount	923,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.19
A	xp	<21,1
A	dungeon	!DM
S	!Dwarf Rogue
T	xprate	>1.59
A	goto	1431/0,404.03,-11014.47,60,0
A	goto	1431/0,432.11,-10878.75,50,0
A	goto	1431/0,551.72,-10688.13
A	collect	1475,1,2359,1
A	collect	2251,6,93,1,1
A	disablecheckbox	
A	mob	Pygmy Venom Web Spider
A	mob	Venom Web Spider
A	itemcount	6452,<1
A	isQuestAvailable	2359
A	dungeon	!DM
S	Rogue
T	xprate	>1.59
T	optional	
T	completewith	TowerKey
A	dungeon	!DM
S	Rogue
T	xprate	>1.59
A	goto	1436/0,619.17,-11035.20
A	turnin	2360
A	accept	2359
A	target	Agent Kearnen
A	dungeon	!DM
S	Rogue
T	xprate	>1.59
T	label	TowerKey
T	loop	
A	goto	1436/0,514.52,-11114.77,0
A	goto	1436/0,531.32,-11166.80,0
A	goto	1436/0,581.37,-11104.97,0
A	goto	1436/0,514.52,-11114.77,30,0
A	goto	1436/0,531.32,-11166.80,30,0
A	goto	1436/0,581.37,-11104.97,30,0
A	complete	2359,2
A	link	https://www.youtube.com/watch?v=5sIew15IcG0
A	mob	Malformed Defias Drone
A	dungeon	!DM
S	Rogue
T	xprate	>1.59
T	optional	
T	completewith	Mortwake
A	use	15396
A	itemcount	15396,1
A	dungeon	!DM
S	Rogue
T	xprate	>1.59
T	label	Mortwake
A	goto	1436,70.421,74.031
A	complete	2359,1
A	link	https://www.youtube.com/watch?v=5sIew15IcG0
A	mob	Defias Tower Patroller
A	mob	Defias Tower Sentry
A	dungeon	!DM
S	!Dwarf Rogue
T	xprate	>1.59
T	sticky	
T	label	AntiVenomStart
A	collect	6452,1
A	aura	-9991
A	itemcount	6452,<1
A	train	7934,3
A	dungeon	!DM
S	!Dwarf Rogue
T	xprate	>1.59
T	optional	
T	requires	AntiVenomStart
T	label	AntiVenomEnd
A	cast	7932
A	use	6452
A	aura	-9991
A	itemcount	6452,1
A	dungeon	!DM
S	Dwarf Rogue
T	xprate	>1.59
T	optional	
T	sticky	
T	label	AntiVenomEnd2
A	cast	20594
A	aura	-9991
A	dungeon	!DM
S	Rogue
T	xprate	>1.59
T	optional	
T	completewith	KlavenFinish
A	goto	1436/0,1037.42,-10628.27
A	fly	Stormwind
A	target	Thor
A	dungeon	!DM
S	!Dwarf Rogue
T	xprate	>1.59
T	optional	
T	requires	AntiVenomEnd
T	completewith	FirstAidEnd
A	goto	1453,42.938,33.878,20,0
A	goto	1453,41.544,31.330,20,0
A	goto	1453,41.688,28.049,20,0
A	goto	1453,43.070,26.155,15
A	aura	-9991
A	dungeon	!DM
S	!Dwarf Rogue
T	xprate	>1.59
T	requires	AntiVenomEnd
A	goto	1453,43.070,26.155
A	skill	firstaid,80
A	aura	-9991
A	itemcount	6452,<1
A	dungeon	!DM
S	!Dwarf Rogue
T	xprate	>1.59
T	label	FirstAidEnd
A	goto	1453,43.070,26.155
A	train	7934
A	aura	-9991
A	itemcount	6452,<1
A	dungeon	!DM
S	!Dwarf Rogue
T	xprate	>1.59
T	sticky	
T	label	AntiVenomStart2
A	collect	6452,1
A	aura	-9991
A	itemcount	6452,<1
A	train	7934,3
A	dungeon	!DM
S	!Dwarf Rogue
T	xprate	>1.59
T	sticky	
T	requires	AntiVenomStart2
T	label	AntiVenomEnd2
A	cast	7932
A	use	6452
A	aura	-9991
A	itemcount	6452,1
A	dungeon	!DM
S	Rogue
T	xprate	>1.59
T	optional	
T	completewith	next
A	goto	1453/0,374.11,-8762.88,20,0
A	goto	1453/0,326.66,-8818.01,20,0
A	goto	1453/0,323.43,-8817.83,10
A	dungeon	!DM
S	Rogue
T	xprate	>1.59 << !Hunter
T	label	KlavenFinish
A	goto	1453/0,362.28,-8815.23
A	turnin	135
A	turnin	2359
A	target	Master Mathias Shaw
A	dungeon	!DM
S	Rogue
T	xprate	>1.59
A	goto	1453/0,329.75,-8805.91
A	collect	3371,20
A	collect	2928,20 -Dust of Decay (20)
A	collect	5140,20
A	target	Jasper Fel
S	Rogue
T	xprate	>1.59
A	collect	6947,20
S	Rogue
T	xprate	>1.59
A	goto	1453/0,377.47,-8752.39
A	train	1856
A	train	1785
A	target	Osborne the Night Man
A	dungeon	!DM
S	Warlock
T	xprate	>1.59
T	ah	
A	goto	1453/0,807.64,-8880.84,14,0
A	goto	1453/0,804.55,-8862.47
A	vendor	1312
A	collect	5211,1
A	disablecheckbox	
A	target	Ardwyn Cailen
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<13.4
A	itemcount	11288,<1
A	dungeon	!DM
S	Warlock
T	xprate	>1.59
T	ssf	
A	goto	1453/0,807.64,-8880.84,14,0
A	goto	1453/0,804.55,-8862.47
A	collect	5211,1
A	target	Ardwyn Cailen
A	money	<0.5247
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<13.4
A	itemcount	11288,<1
A	dungeon	!DM
S	Warlock
T	xprate	>1.59
T	optional	
T	completewith	NoDMStockadeEnd
A	use	5211
A	itemcount	5211,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<13.4
A	dungeon	!DM
S	Warlock
T	xprate	>1.59
T	optional	
T	completewith	NoDMStockadeEnd
A	use	11288
A	itemcount	11288,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<13.4
A	dungeon	!DM
S	Warlock
T	xprate	>1.59
T	optional	
T	completewith	next
A	goto	1453/0,988.44,-8942.15,20,0
A	goto	1453/0,1015.33,-8978.9,15
A	dungeon	!DM
S	Warlock
T	xprate	>1.59
A	goto	1453/0,1029.89,-8971.06
A	trainer	
A	target	Ursula Deline
A	dungeon	!DM
S	Warlock
T	xprate	>1.59
T	sticky	
T	label	Torment2NoDM
A	goto	1453/0,1035.96,-8974.86
A	vendor	
A	target	Spackle Thornberry
A	itemcount	16346,<1
A	train	20317,1
A	dungeon	!DM
S	Warlock
T	xprate	>1.59
A	goto	1453/0,1041.54,-8983.29
A	accept	1716
A	target	Gakin the Darkbinder
A	dungeon	!DM
S	Warlock
T	xprate	>1.59
T	sticky	
T	label	Torment2NoDMEnd
T	requires	Torment2NoDM
A	train	20317
A	target	Spackle Thornberry
A	use	16346
A	itemcount	16346,1
A	train	20317,1
A	dungeon	!DM
S	Mage
T	xprate	>1.59
T	optional	
T	completewith	next
A	goto	1453,38.589,81.879,20,0
A	goto	1453,37.278,81.918,12,0
A	goto	1453,36.715,80.265,12,0
A	goto	1453,37.267,78.871,12,0
A	goto	1453,38.051,78.664,12,0
A	goto	1453,38.562,79.269,12,0
A	goto	1453,38.324,80.965,12,0
A	goto	1453,37.550,81.405,8,0
A	goto	1453,38.035,81.729,6,0
A	goto	1453,37.550,82.500,10,0
A	goto	1453/0,847.55,-8991.79,15
A	dungeon	!DM
S	Mage
T	xprate	>1.59
A	goto	1453/0,847.55,-8991.79
A	train	3561
A	target	Larimaine Purdue
A	dungeon	!DM
S	Mage/Warlock/Rogue
T	xprate	>1.59
T	season	1 >> Rogue
T	requires	Torment2NoDMEnd << Warlock
A	goto	1453/0,1093.3,-8779.020
A	accept	3765
A	zoneskip	Ironforge << Warrior
A	zoneskip	Darkshore << Warrior
A	target	Argos Nightwhisper
A	dungeon	!DM
S	Rogue
T	xprate	>1.59
T	optional	
T	completewith	next
A	hs	
S	Rogue
T	xprate	>1.59
A	goto	1453/0,845.49,-8766.110
A	link	/run InviteUnit("aa");C_Timer.After(1,function() LeaveParty() end)
A	zone	Darkshore
A	zoneskip	Teldrassil
A	zoneskip	Darnassus
A	zoneskip	Ironforge
A	zoneskip	Wetlands
A	cooldown	item,6948,<0
A	dungeon	!DM
S	NightElf Rogue
T	xprate	>1.59
T	optional	
T	completewith	NEWarRogNoDMIFPP
A	goto	1453,60.972,11.690,30,0
A	goto	1453,65.933,5.771
A	subzone	2257
A	zoneskip	Darkshore
A	zoneskip	Teldrassil
A	zoneskip	Darnassus
A	zoneskip	Ironforge
A	zoneskip	Wetlands
A	dungeon	!DM
S	NightElf Rogue
T	xprate	>1.59
T	optional	
T	label	NEWarRogNoDMNoFP1
T	completewith	NEWarRogNoDMIFPP
A	zone	Ironforge
A	zoneskip	Darkshore
A	zoneskip	Teldrassil
A	zoneskip	Darnassus
A	zoneskip	Wetlands
A	dungeon	!DM
S	NightElf Rogue
T	xprate	>1.59
T	optional	
T	requires	NEWarRogNoDMNoFP1
T	label	NEWarRogNoDMNoFP2
T	completewith	NEWarRogNoDMIFPP
A	goto	1455,67.842,42.456
A	vendor	5175
A	target	Gearcutter Cogspinner
A	zoneskip	Darkshore
A	zoneskip	Teldrassil
A	zoneskip	Darnassus
A	zoneskip	Wetlands
A	bronzetube	
A	dungeon	!DM
S	NightElf Warrior
T	xprate	>1.59
T	season	1 --Not loading for now
T	requires	NEWarRogNoDMNoFP2
T	label	NEWarRogNoDMNoFP3
T	completewith	NEWarRogNoDMIFPP
A	goto	1455/0,-1197.27,-5041.49
A	train	197
A	train	199
A	target	Buliwyf Stonehand
A	zoneskip	Darkshore
A	zoneskip	Teldrassil
A	zoneskip	Darnassus
A	zoneskip	Wetlands
A	dungeon	!DM
S	NightElf Warrior
T	xprate	>1.59
T	season	1 --Not loading for now
T	requires	NEWarRogNoDMNoFP3
T	label	NEWarRogNoDMNoFP4
T	completewith	NEWarRogNoDMIFPP
A	goto	1455,62.378,88.671
A	collect	3108,200
A	target	Brenwyn Wintersteel
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.7
A	zoneskip	Darkshore
A	zoneskip	Teldrassil
A	zoneskip	Darnassus
A	zoneskip	Wetlands
A	dungeon	!DM
S	NightElf Warrior
T	xprate	>1.59
T	season	1 --Not loading for now
T	requires	NEWarRogNoDMNoFP4
T	label	NEWarRogNoDMNoFP5
T	completewith	NEWarRogNoDMIFPP
A	use	3108
A	itemcount	3108,1
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.7
A	zoneskip	Darkshore
A	zoneskip	Teldrassil
A	zoneskip	Darnassus
A	zoneskip	Wetlands
A	dungeon	!DM
S	NightElf Rogue
T	xprate	>1.59
T	label	NEWarRogNoDMIFPP
A	goto	1455/0,-1152.32,-4821.18
A	fp	Ironforge
A	target	Gryth Thurden
A	zoneskip	Darkshore
A	zoneskip	Teldrassil
A	zoneskip	Darnassus
A	zoneskip	Wetlands
A	dungeon	!DM
S	NightElf Rogue
T	xprate	>1.59
T	optional	
A	goto	1455/0,-1115.43,-4598.86
A	accept	968
A	use	5352
A	itemcount	5352,1
A	zoneskip	Ironforge,1
A	zoneskip	Wetlands
A	dungeon	!DM
S	NightElf Rogue
T	xprate	>1.59
A	goto	1455/0,-1115.43,-4598.86
A	turnin	968
A	target	Gerrig Bonegrip
A	zoneskip	Ironforge,1
A	zoneskip	Wetlands
A	isOnQuest	968
A	dungeon	!DM
S	Mage/Warlock/Rogue
T	xprate	>1.59
T	label	NoDMStockadeEnd
T	requires	Torment2NoDMEnd << Warlock
A	goto	1453/0,845.49,-8766.110
A	link	/run InviteUnit("aa");C_Timer.After(1,function() LeaveParty() end)
A	zone	Darkshore
A	zoneskip	Teldrassil << Warrior
A	zoneskip	Darnassus << Warrior
A	zoneskip	Ironforge
A	cooldown	item,6948,<0
A	dungeon	!DM
S	NightElf Rogue
T	xprate	>1.59
T	optional	
T	completewith	next
A	goto	1455/0,-1152.32,-4821.18
A	fly	Menethil
A	zoneskip	Ironforge,1
A	cooldown	item,6948,<0
A	dungeon	!DM
S	Warrior/NightElf Rogue
T	xprate	>1.59
T	optional	
A	zone	Wetlands
A	zoneskip	Teldrassil
A	zoneskip	Darnassus
A	zoneskip	Darkshore
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	cooldown	item,6948,<0
A	dungeon	!DM
S	Warrior/NightElf Rogue
T	xprate	>1.59
T	optional	
T	completewith	next
A	goto	1437/0,-683.2,-3745.44,30,0
A	goto	1437/0,-580.23,-3726.15,15
A	zoneskip	Teldrassil
A	zoneskip	Darnassus
A	zoneskip	Darkshore
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	cooldown	item,6948,<0
A	dungeon	!DM
S	Warrior/NightElf Rogue
T	xprate	>1.59
T	optional	
A	goto	1437,4.370,56.762
A	zone	Darkshore
A	zoneskip	Teldrassil
A	zoneskip	Darnassus
A	zoneskip	Darkshore
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	cooldown	item,6948,<0
A	dungeon	!DM
S	!Druid
T	xprate	>1.59
T	optional	
T	completewith	next
A	hs	
A	zoneskip	Darkshore
A	subzoneskip	442
A	cooldown	item,6948,>0,1
A	dungeon	!DM << !Dwarf/!Hunter
S	Dwarf Hunter
T	xprate	<1.59
T	softcore	
T	optional	
T	completewith	next
A	deathskip	
S	Dwarf Hunter
T	xprate	<1.59
T	hardcore	
T	optional	
T	completewith	next
S	!NightElf !Hunter
T	xprate	<1.59
T	softcore	
T	optional	
T	completewith	next
A	deathskip	
A	target	Spirit Healer
S	!NightElf
T	xprate	<1.59
A	goto	1439,37.394,40.128
A	turnin	4763
A	target	Thundris Windweaver
S	!NightElf
T	xprate	<1.59
T	optional	
T	completewith	BeachedCloak
A	destroy	12342
S	!NightElf
T	xprate	<1.59
T	optional	
T	completewith	BeachedCloak
A	destroy	12343
S	!NightElf
T	xprate	<1.59
T	optional	
T	completewith	BeachedCloak
A	destroy	12341
S	!NightElf
T	xprate	<1.59
A	goto	1439,38.843,43.416
A	turnin	2139
A	target	Tharnariun Treetender
S	!NightElf
T	xprate	<1.59
A	goto	1439,39.373,43.483
A	turnin	986
A	accept	993
A	target	Terenthis
S	!NightElf
T	xprate	<1.59
T	optional	
T	completewith	BeachedCloak
A	equip	15,5387
A	itemcount	5387,1
A	itemStat	15,QUALITY,<7
S	Dwarf Hunter
T	xprate	<1.59
T	label	TravelDarnDwarfHBoat
T	completewith	DarnDwarfHBoat
A	goto	1439,33.169,40.179,15
A	zoneskip	Teldrassil
A	zoneskip	Darnassus
S	Dwarf Hunter
T	xprate	<1.59
T	optional	
T	label	DarnDwarfHCook1
T	requires	TravelDarnDwarfHBoat
T	completewith	DarnDwarfHBoat
A	cast	818
A	usespell	818
A	zoneskip	Teldrassil
A	zoneskip	Darnassus
A	itemcount	6889,1
A	itemcount	4470,1
A	itemcount	4471,1
A	skill	cooking,50,1
S	Dwarf Hunter
T	xprate	<1.59
T	optional	
T	requires	DarnDwarfHCook1
T	completewith	DarnDwarfHBoat
A	usespell	2550
A	zoneskip	Teldrassil
A	zoneskip	Darnassus
A	itemcount	6889,1
A	itemcount	4471,1
A	skill	cooking,50,1
S	Dwarf Hunter
T	xprate	<1.59
T	label	DarnDwarfHBoat
A	goto	1439,33.213,39.883
A	zone	Teldrassil
A	zoneskip	Darnassus
S	Dwarf Hunter
T	xprate	<1.59
A	goto	1438/1,841.56,8640.79
A	fp	Teldrassil
A	target	Vesprystus
S	Dwarf Hunter
T	xprate	<1.59
T	optional	
T	completewith	next
A	goto	1438/1,965.80,8780.95
A	zone	Darnassus
S	Dwarf Hunter
T	xprate	<1.59
T	completewith	next
A	goto	1457/1,2511.01,10178.05
A	trainer	
A	target	Jocaste
A	dungeon	!DM
S	Dwarf Hunter
T	xprate	<1.59
A	skipgossip	11866,1
A	goto	1457/1,2329.19,9908.60
A	train	264
A	train	227
A	target	Ilyenia Moonfire
S	Dwarf Hunter
T	xprate	<1.59
A	goto	1457/1,2268.76,9770.63
A	collect	3027,1
A	collect	11362,1
A	target	Landria
A	money	<0.7349
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.20
S	Hunter
T	xprate	<1.59
T	completewith	next
A	use	3027
A	itemcount	3027,1
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.19
A	xp	<20,1
S	Dwarf Hunter
T	xprate	<1.59
A	goto	1438/1,2607.86,9641.94
A	turnin	741
A	accept	942
A	target	Chief Archaeologist Greywhisker
A	isOnQuest	741
S	Dwarf Hunter
T	xprate	<1.59
T	optional	
A	goto	1438/1,2607.86,9641.94
A	accept	942
A	target	Chief Archaeologist Greywhisker
A	isQuestTurnedIn	741
S	Druid
T	xprate	<1.59
T	optional	
T	completewith	MoongladeTrain
A	cast	18960
A	zoneskip	Moonglade
S	Druid
T	xprate	<1.5
A	goto	1450/1,-2678.53,8023.63
A	turnin	6124
A	accept	6125
A	target	Dendrite Starblaze
A	isQuestTurnedIn	6123
S	Druid
T	xprate	<1.59
T	label	MoongladeTrain
A	goto	1450/1,-2593.82,7867.06
A	trainer	
A	target	Loganaar
S	NightElf/Dwarf Hunter
T	completewith	BeachedCloak
T	map	Darkshore
A	goto	1448/1,577.92,6371.65,100
A	cooldown	item,6948,<0
S	NightElf/Dwarf Hunter
T	xprate	<1.59
T	optional	
T	completewith	next
A	hs	
A	cooldown	item,6948,>0,1
S	
T	xprate	<1.59
T	label	BeachedCloak
A	goto	1439,36.701,45.122,8,0
A	goto	1439,36.621,45.596
A	turnin	4727
A	target	Gwennyth Bly'Leggonde
S	
T	xprate	<1.59
T	requires	DeleteGyromast
A	goto	1439/1,577.38,6371.35
A	turnin	1138
A	target	Gubber Blump
A	isQuestComplete	1138
S	NightElf
T	xprate	<1.59
A	goto	1439,37.394,40.128
A	turnin	4763
A	target	Thundris Windweaver
S	NightElf
T	xprate	<1.59
T	optional	
T	completewith	LostMasters
A	destroy	12342
S	NightElf
T	xprate	<1.59
T	optional	
T	completewith	LostMasters
A	destroy	12343
S	NightElf
T	xprate	<1.59
T	optional	
T	completewith	LostMasters
A	destroy	12341
S	NightElf Hunter
T	xprate	<1.59
A	goto	1439/1,488.69,6564.830
A	vendor	
A	target	Dalmond
S	NightElf
T	xprate	<1.59
A	goto	1439,38.843,43.416
A	turnin	2139
A	target	Tharnariun Treetender
S	NightElf
T	xprate	<1.59
T	label	LostMasters
A	goto	1439,39.373,43.483
A	turnin	986
A	accept	993
A	target	Terenthis
S	NightElf
T	optional	
A	equip	15,5387
A	itemcount	5387,1
A	itemStat	15,QUALITY,<7
S	
T	xprate	<1.59 << !Hunter
T	label	TravelMenethilDMBoat
T	completewith	MenethilDMBoat
A	goto	1439,32.432,43.744,15
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	zoneskip	Wetlands
A	dungeon	DM
S	
T	optional	
T	label	DarkshoreDMCook1
T	requires	TravelMenethilDMBoat
T	completewith	MenethilDMBoat
A	cast	818
A	usespell	818
A	itemcount	6889,1
A	itemcount	4470,1
A	itemcount	4471,1
A	skill	cooking,50,1
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	zoneskip	Wetlands
A	dungeon	DM
S	
T	optional	
T	requires	DarkshoreDMCook1
T	completewith	DarnDMBoat
A	usespell	2550
A	itemcount	6889,1
A	itemcount	4471,1
A	skill	cooking,50,1
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	zoneskip	Wetlands
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
T	optional	
T	label	DarnDMBoat
A	goto	1439/1,826.67,6409.82
A	zone	Wetlands
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	dungeon	DM
S	Paladin/Warrior
T	ah	
T	xprate	>1.59
A	goto	1437,11.579,59.540,6,0
A	goto	1437,11.435,59.696
A	vendor	1441
A	collect	4818,1,2040,1
A	disablecheckbox	
A	target	Brak Durnad
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.8
A	itemcount	4818,<1
A	dungeon	DM
S	Paladin/Warrior
T	ssf	
T	optional	
T	xprate	>1.59
A	goto	1437,11.579,59.540,6,0
A	goto	1437,11.435,59.696
A	collect	4818,1,2040,1
A	disablecheckbox	
A	collect	922,1,2040,1
A	target	Brak Durnad
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.8
A	itemcount	922,<1
A	itemcount	4818,<1
A	dungeon	DM
S	Paladin/Warrior !NightElf
T	xprate	>1.59
T	optional	
T	completewith	DeeprunDM
A	use	4818
A	itemcount	4818,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.8
A	dungeon	DM
S	Paladin/Warrior !NightElf
T	xprate	>1.59
T	optional	
T	completewith	DeeprunDM
A	use	922
A	itemcount	922,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.8
A	dungeon	DM
A	xp	<21,1
S	!NightElf
T	xprate	>1.59 << !Hunter
T	optional	
T	completewith	next
A	goto	Wetlands,9.490,59.694
A	fly	Ironforge
A	target	Shellei Brondir
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	dungeon	DM
S	NightElf
T	xprate	>1.59 << !Hunter
A	goto	Wetlands,9.490,59.694
A	fp	Menethil Harbor
A	target	Shellei Brondir
A	dungeon	DM
S	NightElf
T	xprate	>1.59 << !Hunter
T	optional	
T	completewith	next
A	goto	1437/0,-616.41,-3916.22,40
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Ironforge
A	zoneskip	Westfall
A	dungeon	DM
S	NightElf
T	xprate	>1.59 << !Hunter
A	goto	1437/0,-490.20,-4316.78,-1
A	goto	1455/0,-848.70,-5009.12,-1
A	zone	Ironforge
A	link	https://www.youtube.com/watch?v=oVoxsr4zcg4
A	link	https://us.battle.net/support/en/help/product/wow/197/834/solution
A	subzoneskip	809
A	subzoneskip	2257
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Ironforge
A	zoneskip	Westfall
A	dungeon	DM
S	NightElf
T	xprate	>1.59 << !Hunter
T	optional	
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
A	goto	1453/0,1320.57,-8540.2,20,0
A	goto	1453/0,1242.03,-8638.88,10,0
A	goto	StormwindClassic,7,45.471,10,0
A	goto	StormwindClassic,5.560,50.125,10,0
A	goto	1453/0,1197.22,-8946.62,20,0
A	goto	1436/0,1545.83,-11056.200
A	zone	Westfall
A	zoneskip	Ironforge
A	subzoneskip	809
A	subzoneskip	2257
A	zoneskip	Stormwind City
A	dungeon	DM
S	NightElf
T	xprate	>1.59 << !Hunter
T	optional	
T	completewith	next
A	goto	1436/0,1116.87,-9616.07,100,0
A	goto	1436/0,1037.42,-10628.27,100
A	zoneskip	Ironforge
A	subzoneskip	809
A	subzoneskip	2257
A	zoneskip	Stormwind City
A	dungeon	DM
S	NightElf
T	xprate	>1.59 << !Hunter
T	optional	
A	goto	1436/0,1037.42,-10628.27
A	fp	Sentinel Hill
A	target	Thor
A	zoneskip	Ironforge
A	subzoneskip	809
A	subzoneskip	2257
A	zoneskip	Stormwind City
A	dungeon	DM
S	NightElf
T	xprate	>1.59 << !Hunter
T	optional	
A	goto	1436/0,1045.12,-10508.80
A	accept	65
A	target	Gryan Stoutmantle
A	zoneskip	Westfall,1
A	dungeon	DM
S	NightElf
T	xprate	>1.59 << !Hunter
T	optional	
A	goto	1429/0,257.84,-9616.01,100,0
A	goto	1453/0,440.51,-9054.94
A	zone	Stormwind City
A	zoneskip	Ironforge
A	subzoneskip	809
A	subzoneskip	2257
A	dungeon	DM
S	NightElf Priest
T	xprate	>1.59 << !Hunter
T	optional	
T	completewith	next
A	goto	1453/0,809.52,-8579.22,20,0
A	goto	1453/0,862.89,-8519.61,20
A	zoneskip	Stormwind City,1
A	dungeon	DM
S	NightElf Priest
T	xprate	>1.59 << !Hunter
A	goto	1453/0,862.89,-8519.61
A	trainer	
A	target	High Priestess Laurena
A	zoneskip	Stormwind City,1
A	dungeon	DM
S	NightElf Warrior/NightElf Hunter
T	xprate	>1.59 << !Hunter
T	optional	
A	goto	1455/0,-1197.27,-5041.49
A	train	197
A	train	199
A	train	266
A	target	Buliwyf Stonehand
A	zoneskip	Wetlands
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	dungeon	DM
S	NightElf Warrior
T	xprate	>1.59
T	optional	
A	goto	1455,62.378,88.671
A	collect	3107,1
A	target	Brenwyn Wintersteel
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.3
A	zoneskip	Wetlands
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	dungeon	DM
S	NightElf Warrior
T	xprate	>1.59
T	optional	
T	completewith	DeeprunDM
A	use	3107
A	itemcount	3107,1
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.3
A	zoneskip	Wetlands
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	dungeon	DM
S	NightElf
T	xprate	>1.59 << !Hunter
A	goto	1455/0,-1152.32,-4821.18
A	fp	Ironforge
A	target	Gryth Thurden
A	zoneskip	Wetlands
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
T	optional	
A	goto	1455/0,-1115.43,-4598.86
A	accept	968
A	use	5352
A	itemcount	5352,1
A	zoneskip	Wetlands << NightElf
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
T	optional	<< NightElf
A	goto	1455/0,-1115.43,-4598.86
A	turnin	968
A	target	Gerrig Bonegrip
A	zoneskip	Wetlands << NightElf
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	isOnQuest	968
A	dungeon	DM
S	Mage
T	xprate	>1.59
T	optional	
T	completewith	next
A	goto	1455/0,-940.5,-4704.2,12,0
A	goto	1455/0,-947.62,-4709.69,10,0
A	goto	1455/0,-954.73,-4709.48,10,0
A	goto	1455/0,-961.22,-4715.920,12
A	dungeon	DM
S	Mage
T	xprate	>1.59
A	goto	1455/0,-961.22,-4715.920
A	collect	17031,4
A	target	Ginny Longberry
A	dungeon	DM
S	Mage
T	xprate	>1.59
T	label	MilstaffDM
A	goto	1455/0,-915.2,-4606.38
A	train	3562
A	target	Milstaff Stormeye
A	dungeon	DM
S	Mage
T	xprate	>1.59
A	goto	1455/0,-928.48,-4614.620
A	trainer	
A	target	Dink
A	dungeon	DM
S	Priest
T	xprate	>1.59
T	optional	<< NightElf
A	goto	1455/0,-912.88,-4625.99
A	trainer	
A	target	Toldren Deepiron
A	zoneskip	Wetlands << NightElf
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	dungeon	DM
S	skip --logout skip Mage/Priest
T	xprate	>1.59
T	optional	
T	requires	MilstaffDM << Mage
T	completewith	DeeprunDM
A	goto	1455,27.611,8.074
A	goto	1455,76.414,51.226,20
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	dungeon	DM
S	skip --Warlock
T	xprate	>1.59
A	goto	1455/0,-1117.60,-4615.14,15,0
A	goto	1455/0,-1111.62,-4599.09
A	trainer	
A	target	Briarthorn
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	dungeon	DM
S	skip --Warlock
T	xprate	>1.59
T	optional	
T	completewith	DeeprunDM
A	goto	1455,53.164,7.037,10
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
S	skip --Warlock
T	xprate	>1.59
A	goto	1455/0,-1130.26,-4601.270
A	vendor	6382
A	target	Jubahl Corpseseeker
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	dungeon	DM
S	skip --logout skip skip --Warlock
T	xprate	>1.59
T	optional	
T	completewith	DeeprunDM
A	goto	1455,52.825,5.060
A	goto	1455,76.414,51.226,20
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	dungeon	DM
S	!Mage !Priest
T	xprate	>1.59 << !Hunter
T	completewith	DeeprunDM
T	optional	
A	goto	1455,53.164,7.037,10
A	zoneskip	Wetlands << NightElf
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	isQuestTurnedIn	968
A	dungeon	DM
S	skip --logout skip !Mage !Priest
T	xprate	>1.59 << !Hunter
T	completewith	DeeprunDM
T	optional	
A	goto	1455,52.825,5.060
A	goto	1455,76.414,51.226,20
A	zoneskip	Wetlands << NightElf
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	isQuestTurnedIn	968
A	dungeon	DM
S	skip --NightElf Hunter/NightElf Warrior
T	xprate	>1.59 << !Hunter
T	optional	
T	completewith	DeeprunDM
A	goto	1455,60.975,90.479
A	goto	1455,76.414,51.226,20 |cRXP_WARN_Walk onto the railing next to |cRXP_FRIENDLY_Buliwyf Stonehand|r on the arrow position. Position your character until it looks like they're floating, then perform a Logout Skip by logging out and back in|r
A	zoneskip	Wetlands
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	isQuestAvailable	968
A	dungeon	DM
S	skip --logout skip !Mage !Priest
T	xprate	>1.59 << !Hunter
T	completewith	DeeprunDM
T	optional	
A	goto	1455,56.207,46.844
A	goto	1455,76.414,51.226,20
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	isQuestAvailable	968
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
T	optional	
T	requires	MilstaffDM << Mage
A	goto	1455,67.842,42.456
A	vendor	5175
A	target	Gearcutter Cogspinner
A	zoneskip	Wetlands << NightElf
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	subzoneskip	2257
A	bronzetube	
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
T	optional	
T	requires	MilstaffDM << Mage
T	label	DeeprunDM
A	goto	1455/0,-1330.28,-4840.430
A	subzone	2257
A	zoneskip	Wetlands << NightElf
A	zoneskip	Elwynn Forest
A	zoneskip	Stormwind City
A	zoneskip	Westfall
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
T	optional	<< NightElf
T	completewith	ShoniAccept
A	zone	Stormwind City
A	zoneskip	Wetlands << NightElf
A	zoneskip	Elwynn Forest
A	zoneskip	Westfall
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
A	goto	1453/0,638.8,-8341.95
A	vendor	5519
A	bronzetube	
A	target	Billibub Cogspinner
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
T	label	ShoniAccept
A	goto	1453/0,634.700,-8390.800
A	accept	2040
A	target	Shoni the Shilent
A	dungeon	DM
S	Human
T	xprate	>1.59
A	goto	1453/0,600.22,-8426.93
A	turnin	1338
A	target	Furen Longbeard
A	isOnQuest	1338
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
A	accept	167
A	accept	+168
A	goto	1453/0,501.31,-8468.65
A	target	Wilder Thistlenettle
A	dungeon	DM
S	Hunter
T	sticky	
T	label	DMPetTrain
A	goto	1453,61.576,15.998
A	trainer	2879
A	target	Karrina Mekenda
A	dungeon	DM
S	Hunter
A	goto	1453/0,552.78,-8415.71
A	trainer	5515
A	target	Einris Brightspear
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
T	requires	DMPetTrain << Hunter
A	goto	1453/0,501.31,-8468.65
A	accept	167
A	accept	168
A	target	Wilder Thistlenettle
A	dungeon	DM
S	Rogue
T	xprate	>1.59
T	optional	
T	completewith	RogueTrainDMEnd
A	goto	1453/0,377.47,-8752.39
A	train	8676
A	target	Osborne the Night Man
A	dungeon	DM
S	Rogue
T	xprate	>1.59
T	optional	
A	goto	1453/0,377.47,-8752.39
A	train	1784
A	train	921
A	train	1804
A	trainer	
A	target	Osborne the Night Man
A	dungeon	DM
A	train	1784,1
A	train	921,1
S	Rogue
T	xprate	>1.59
T	optional	
A	goto	1453/0,377.47,-8752.39
A	train	921
A	train	1804
A	trainer	
A	target	Osborne the Night Man
A	dungeon	DM
A	train	921,1
S	Rogue
T	xprate	>1.59
T	label	RogueTrainDMEnd
A	goto	1453/0,377.47,-8752.39
A	train	1804
A	trainer	
A	target	Osborne the Night Man
A	dungeon	DM
S	Rogue
T	xprate	>1.59
T	optional	
T	completewith	next
A	goto	1453,74.799,53.815,15,0
A	goto	1453,77.290,58.138,12,0
A	goto	1453,78.466,60.034,12,0
A	goto	1453,78.560,58.435,6,0
A	goto	1453,75.754,60.369,12
A	dungeon	DM
S	Rogue
T	xprate	>1.59
A	accept	2281
A	goto	1453/0,362.55,-8819.80
A	target	+Renzik "The Shiv"
A	accept	2360
A	goto	1453/0,362.28,-8815.23
A	target	+Master Mathias Shaw
A	dungeon	DM
S	Warrior
T	xprate	>1.59
T	optional	
T	completewith	next
A	goto	1453,74.592,51.567,15,0
A	goto	1453,78.011,47.797,15,0
A	goto	1453,80.030,45.591,12
A	dungeon	DM
S	Warrior
T	xprate	>1.59
A	goto	1453,78.673,45.791
A	trainer	
A	target	Wu Shen
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
A	goto	1453/0,613.12,-8795.96
A	train	201
A	train	1180
A	train	202
A	target	Woo Ping
A	dungeon	DM
S	NightElf Warrior
T	xprate	>1.59
T	optional	
T	completewith	WileyStart
A	use	4818
A	itemcount	4818,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.8
A	dungeon	DM
S	Rogue
T	xprate	>1.59
T	ah	
A	goto	1453/0,609.63,-8787.71
A	collect	923,1
A	target	Marda Weller
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.2
A	dungeon	DM
S	Rogue
T	xprate	>1.59
T	ssf	
A	goto	1453/0,609.63,-8787.71
A	collect	923,1
A	target	Marda Weller
A	money	<0.8743
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.2
A	dungeon	DM
S	Rogue
T	xprate	>1.59
T	optional	
T	completewith	WileyStart
A	use	923
A	itemcount	923,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.19
A	xp	<21,1
A	dungeon	DM
S	Paladin
T	xprate	>1.59
T	optional	
T	completewith	next
A	goto	1453,42.917,34.221,15,0
A	goto	1453,41.385,31.547,15,0
A	goto	1453,39.810,29.788,15
A	goto	1453/0,809.52,-8579.22,20
A	dungeon	DM
S	Paladin
T	xprate	>1.59
A	goto	1453/0,845.95,-8545.70
A	use	6776
A	collect	6776,1,1649
A	accept	1649
A	target	Duthorian Rall
A	dungeon	DM
S	Paladin
T	xprate	>1.59
A	goto	1453/0,845.95,-8545.70
A	turnin	1649
A	accept	1650
A	target	Duthorian Rall
A	dungeon	DM
S	Paladin
T	xprate	>1.59
A	goto	1453/0,862.35,-8565.68,12,0
A	goto	1453/0,861.14,-8573.03
A	trainer	
A	target	Arthur the Faithful
A	dungeon	DM
S	Paladin
T	xprate	>1.59
A	goto	1453/0,1093.3,-8779.020
A	accept	3765
A	target	Argos Nightwhisper
A	dungeon	DM
S	Paladin/Warrior
T	xprate	>1.59
T	ah	
T	optional	
A	goto	1453/0,609.63,-8787.71
A	collect	922,1,2040,1
A	target	Marda Weller
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.0
A	dungeon	DM
S	Paladin/Warrior
T	xprate	>1.59
T	optional	
A	use	922
A	itemcount	922,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.8
A	xp	<21,1
A	dungeon	DM
S	Warlock/Priest
T	xprate	>1.59
T	ah	
A	goto	1453/0,807.64,-8880.84,14,0
A	goto	1453/0,804.55,-8862.47
A	vendor	1312
A	collect	5211,1
A	disablecheckbox	
A	target	Ardwyn Cailen
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<13.4
A	itemcount	11288,<1
A	dungeon	DM
S	Warlock/Priest
T	xprate	>1.59
T	ssf	
A	goto	1453/0,807.64,-8880.84,14,0
A	goto	1453/0,804.55,-8862.47
A	collect	5211,1
A	target	Ardwyn Cailen
A	money	<0.5247
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<13.4
A	itemcount	11288,<1
A	dungeon	DM
S	Warlock/Priest
T	xprate	>1.59
T	optional	
T	completewith	WileyStart
A	use	5211
A	itemcount	5211,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<13.4
A	dungeon	DM
S	Warlock/Priest
T	xprate	>1.59
T	optional	
T	completewith	WileyStart
A	use	11288
A	itemcount	11288,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<13.4
A	dungeon	DM
S	Warlock
T	xprate	>1.59
T	optional	
T	completewith	next
A	goto	1453/0,988.44,-8942.15,20,0
A	goto	1453/0,1015.33,-8978.9,15
A	dungeon	DM
S	Warlock
T	xprate	>1.59
A	goto	1453/0,1029.89,-8971.06
A	trainer	
A	target	Ursula Deline
A	dungeon	DM
S	Warlock
T	xprate	>1.59
T	sticky	
T	label	Torment2DM
A	goto	1453/0,1035.96,-8974.86
A	vendor	
A	target	Spackle Thornberry
A	itemcount	16346,<1
A	train	20317,1
A	dungeon	DM
S	Warlock
T	xprate	>1.59
A	goto	1453/0,1041.54,-8983.29
A	accept	1716
A	target	Gakin the Darkbinder
A	dungeon	DM
S	Warlock
T	xprate	>1.59
T	sticky	
T	label	Torment2DMEnd
T	requires	Torment2DM
A	train	20317
A	target	Spackle Thornberry
A	use	16346
A	itemcount	16346,1
A	train	20317,1
A	dungeon	DM
S	Mage
T	xprate	>1.59
T	optional	
T	completewith	next
A	goto	1453,38.589,81.879,20,0
A	goto	1453,37.278,81.918,12,0
A	goto	1453,36.715,80.265,12,0
A	goto	1453,37.267,78.871,12,0
A	goto	1453,38.051,78.664,12,0
A	goto	1453,38.562,79.269,12,0
A	goto	1453,38.324,80.965,12,0
A	goto	1453,37.550,81.405,8,0
A	goto	1453,38.035,81.729,6,0
A	goto	1453,37.550,82.500,10,0
A	goto	1453/0,847.55,-8991.79,15
A	dungeon	DM
S	Mage
T	xprate	>1.59
A	goto	1453/0,847.55,-8991.79
A	train	3561
A	target	Larimaine Purdue
A	dungeon	DM
S	!Paladin
T	xprate	>1.59
A	goto	1453/0,1093.3,-8779.020
A	accept	3765
A	target	Argos Nightwhisper
A	dungeon	DM
S	Druid
T	xprate	>1.59
A	goto	1453,20.883,55.505
A	train	6756
A	target	Sheldras Moontree
A	dungeon	DM
S	Hunter
T	optional	
T	completewith	next
A	goto	1453,50.929,57.781,10
A	dungeon	DM
S	Hunter
T	ssf	
A	goto	1453,49.962,57.638
A	collect	3027,1
A	collect	11362,1
A	target	Landria
A	money	<0.7349
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.20
A	dungeon	DM
S	Hunter
T	ah	
A	goto	1453,49.962,57.638
A	collect	3027,1
A	collect	11362,1
A	target	Landria
A	money	<0.7349
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.20
A	dungeon	DM
S	
T	xprate	>1.59
T	ah	
T	softcore	
A	goto	1453/0,660.28,-8814.55
A	collect	6452,1,2359,1 << !Dwarf Rogue
A	collect	814,5,103,1 << Paladin
A	collect	2296,5,92,1
A	collect	1080,5,92,1
A	collect	1081,5,92,1
A	target	Auctioneer Jaxon
A	dungeon	DM
S	
T	xprate	>1.59
T	ah	
T	hardcore	
A	goto	1453/0,660.28,-8814.55
A	collect	6452,1,2359,1 << !Dwarf Rogue
A	collect	814,5,103,1
A	collect	2296,5,92,1
A	collect	1080,5,92,1
A	collect	1081,5,92,1
A	target	Auctioneer Jaxon
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
T	completewith	GryanAll << Human
T	optional	<< Human
A	goto	1453/0,603.77,-8801.7,30,0
A	goto	1453/0,530.03,-8835.51,30,0
A	goto	1453/0,533.45,-8868.15,15,0
A	goto	1453/0,490.04,-8835.80
A	fp	Stormwind
A	fly	Westfall
A	target	Dungar Longdrink
A	zoneskip	Westfall << Human
A	dungeon	DM
S	!Human
T	xprate	>1.59 << !Hunter
T	optional	
T	completewith	next
A	zone	Westfall
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
T	label	GryanAll << Human
A	goto	1436/0,1045.12,-10508.80
A	accept	65
A	target	Gryan Stoutmantle
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
T	optional	<< Human/Warlock
T	requires	Torment2DMEnd << Warlock
A	goto	1436/0,1037.42,-10628.27
A	fp	Sentinel Hill
A	fly	Redridge
A	target	Thor
A	zoneskip	Westfall,1
A	dungeon	DM
S	Human
T	xprate	>1.59
T	optional	
T	completewith	WileyStart
A	goto	1453/0,603.77,-8801.7,30,0
A	goto	1453/0,530.03,-8835.51,30,0
A	goto	1453/0,533.45,-8868.15,15,0
A	goto	1453/0,490.04,-8835.80
A	fly	Redridge
A	target	Dungar Longdrink
A	zoneskip	Stormwind City,1
A	dungeon	DM
A	isOnQuest	65
S	!Human !Warlock
T	xprate	>1.59 << !Hunter
A	goto	1429/0,-727.57,-9555.160
A	accept	94
A	target	Theocritus
A	dungeon	DM
A	xp	<20,1
S	!Human !Warlock
T	xprate	>1.59 << !Hunter
T	optional	
T	completewith	WileyStart
A	goto	1433/0,-1902.32,-9609.54
A	zone	Redridge Mountains
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
T	optional	
A	goto	1433/0,-2062.96,-9209.62
A	accept	92
A	turnin	92
A	itemcount	2296,5
A	itemcount	1080,5
A	itemcount	1081,5
A	target	Chef Breanna
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
T	label	WileyStart
A	goto	1433/0,-2164.56,-9213.10,8,0
A	goto	1433/0,-2145.67,-9231.49
A	turnin	65
A	accept	132
A	target	Wiley the Black
A	dungeon	DM
S	Rogue
T	xprate	>1.59
A	goto	1433/0,-2180.19,-9328.21
A	turnin	2281
A	accept	2282
A	target	Lucius
A	dungeon	DM
S	Rogue
T	xprate	>1.59
A	goto	1433,51.846,45.116
A	skill	lockpicking,80
A	dungeon	DM
S	Rogue
T	xprate	>1.59
A	goto	1433/0,-2700.75,-9222.07
A	complete	2282,1
A	dungeon	DM
S	Rogue
T	xprate	>1.59
A	goto	1433/0,-2180.19,-9328.21
A	turnin	2282
A	target	Lucius
A	dungeon	DM
S	Rogue
T	xprate	>1.59
T	optional	
T	completewith	DefiasWestfall2
A	destroy	7907
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
T	optional	<< Human/Warlock
T	completewith	next
A	goto	1433/0,-2234.89,-9435.35
A	fp	Redridge Mountains
A	fly	Westfall
A	target	Ariena Stormfeather
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
T	label	DefiasWestfall2
A	goto	1436/0,1045.29,-10508.78
A	turnin	132
A	accept	135
A	target	Gryan Stoutmantle
A	dungeon	DM
S	Rogue
T	xprate	>1.59
T	optional	
T	completewith	KlavenFinish
A	use	923
A	itemcount	923,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.19
A	xp	<21,1
A	dungeon	DM
S	!Dwarf Rogue
T	xprate	>1.59
A	goto	1431/0,404.03,-11014.47,60,0
A	goto	1431/0,432.11,-10878.75,50,0
A	goto	1431/0,551.72,-10688.13
A	collect	1475,1,2359,1
A	collect	2251,6,93,1,1
A	disablecheckbox	
A	mob	Pygmy Venom Web Spider
A	mob	Venom Web Spider
A	itemcount	6452,<1
A	isQuestAvailable	2359
A	dungeon	DM
S	Rogue
T	xprate	>1.59
T	optional	
T	completewith	TowerKey
A	dungeon	DM
S	Rogue
T	xprate	>1.59
A	goto	1436/0,619.17,-11035.20
A	turnin	2360
A	accept	2359
A	target	Agent Kearnen
A	dungeon	DM
S	Rogue
T	xprate	>1.59
T	label	TowerKey
T	loop	
A	goto	1436/0,514.52,-11114.77,0
A	goto	1436/0,531.32,-11166.80,0
A	goto	1436/0,581.37,-11104.97,0
A	goto	1436/0,514.52,-11114.77,30,0
A	goto	1436/0,531.32,-11166.80,30,0
A	goto	1436/0,581.37,-11104.97,30,0
A	complete	2359,2
A	link	https://www.youtube.com/watch?v=5sIew15IcG0
A	mob	Malformed Defias Drone
A	dungeon	DM
S	Rogue
T	xprate	>1.59
T	optional	
T	completewith	Mortwake
A	use	15396
A	itemcount	15396,1
A	dungeon	DM
S	Rogue
T	xprate	>1.59
T	label	Mortwake
A	goto	1436,70.421,74.031
A	complete	2359,1
A	link	https://www.youtube.com/watch?v=5sIew15IcG0
A	mob	Defias Tower Patroller
A	mob	Defias Tower Sentry
A	dungeon	DM
S	!Dwarf Rogue
T	xprate	>1.59
T	sticky	
T	label	AntiVenomStart
A	collect	6452,1
A	aura	-9991
A	itemcount	6452,<1
A	train	7934,3
A	dungeon	DM
S	!Dwarf Rogue
T	xprate	>1.59
T	optional	
T	requires	AntiVenomStart
T	label	AntiVenomEnd
A	cast	7932
A	use	6452
A	aura	-9991
A	itemcount	6452,1
A	dungeon	DM
S	Dwarf Rogue
T	xprate	>1.59
T	optional	
T	sticky	
T	label	AntiVenomEnd2
A	cast	20594
A	aura	-9991
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
T	optional	
T	completewith	KlavenFinish
A	goto	1436/0,1037.42,-10628.27
A	fly	Stormwind
A	target	Thor
A	dungeon	DM
S	!Dwarf Rogue
T	xprate	>1.59
T	optional	
T	requires	AntiVenomEnd
T	completewith	FirstAidEnd
A	goto	1453,42.938,33.878,20,0
A	goto	1453,41.544,31.330,20,0
A	goto	1453,41.688,28.049,20,0
A	goto	1453,43.070,26.155,15
A	aura	-9991
A	dungeon	DM
S	!Dwarf Rogue
T	xprate	>1.59
T	requires	AntiVenomEnd
A	goto	1453,43.070,26.155
A	skill	firstaid,80
A	aura	-9991
A	itemcount	6452,<1
A	dungeon	DM
S	!Dwarf Rogue
T	xprate	>1.59
T	label	FirstAidEnd
A	goto	1453,43.070,26.155
A	train	7934
A	aura	-9991
A	itemcount	6452,<1
A	dungeon	DM
S	!Dwarf Rogue
T	xprate	>1.59
T	sticky	
T	label	AntiVenomStart2
A	collect	6452,1
A	aura	-9991
A	itemcount	6452,<1
A	train	7934,3
A	dungeon	DM
S	!Dwarf Rogue
T	xprate	>1.59
T	sticky	
T	requires	AntiVenomStart2
T	label	AntiVenomEnd2
A	cast	7932
A	use	6452
A	aura	-9991
A	itemcount	6452,1
A	dungeon	DM
S	
T	xprate	>1.59
T	optional	
T	completewith	next
A	goto	1453/0,374.11,-8762.88,20,0
A	goto	1453/0,326.66,-8818.01,20,0
A	goto	1453/0,323.43,-8817.83,10
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
T	label	KlavenFinish
A	goto	1453/0,362.28,-8815.23
A	turnin	135
A	accept	141
A	turnin	2359
A	target	Master Mathias Shaw
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
T	optional	
T	completewith	BandanaStart
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
T	optional	
T	completewith	next
A	goto	1453/0,490.03,-8835.82
A	fly	Westfall
A	target	Dungar Longdrink
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
A	goto	1436/0,1045.29,-10508.78
A	turnin	141
A	accept	142
A	target	Gryan Stoutmantle
A	dungeon	DM
S	Rogue
T	xprate	>1.59
T	optional	
T	completewith	next
A	use	923
A	itemcount	923,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.19
A	xp	<21,1
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
T	optional	
T	completewith	next
A	goto	1436/0,1459.17,-11024.47,55
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
A	goto	1436/0,1459.17,-11024.47
A	line	Westfall,44.50,69.62,44.50,69.62,45.08,69.40,45.21,69.35,45.63,68.69,45.85,67.73,45.62,66.99,45.52,65.71,45.61,64.95,44.28,63.88,44.26,62.80,43.60,59.89,43.37,58.42,43.26,57.01,43.12,54.24,42.15,52.74,41.74,51.42,41.48,49.89,40.91,48.71,38.93,46.05,38.51,45.46,37.85,45.54,36.60,44.21,36.06,43.86,35.12,43.49,33.92,43.21,32.56,43.05,31.34,44.54,32.56,43.05,33.92,43.21,35.12,43.49,36.06,43.86,36.26,43.77,36.87,42.87,36.95,40.85,37.04,39.79,37.91,36.98,39.06,35.58,40.48,34.31,41.27,32.87,41.76,31.27,42.26,30.26,43.20,28.99,44.29,28.19,44.64,26.85,44.57,24.94,44.64,26.85,44.29,28.19,43.20,28.99,42.26,30.26,41.76,31.27,41.27,32.87,40.48,34.31,39.06,35.58,37.91,36.98,37.04,39.79,36.95,40.85,36.87,42.87,36.26,43.77,36.06,43.86,35.12,43.49,33.92,43.21,32.56,43.05,31.34,44.54,32.56,43.05,33.92,43.21,35.12,43.49,36.06,43.86,36.60,44.21,37.85,45.54,38.51,45.46,38.93,46.05,40.91,48.71,41.48,49.89,41.74,51.42,42.15,52.74,43.12,54.24,43.26,57.01,43.37,58.42,43.60,59.89,44.26,62.80,44.28,63.88,45.61,64.95,45.52,65.71,45.62,66.99,45.85,67.73,45.63,68.69,45.21,69.35,45.08,69.40,44.50,69.62
A	complete	142,1
A	unitscan	Defias Messenger
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
A	goto	1436/0,1045.12,-10508.80
A	turnin	142
A	target	Gryan Stoutmantle
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
A	goto	1436/0,1067.87,-10508.330
A	accept	155
A	target	The Defias Traitor
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
A	goto	1436/0,1527.07,-11073.23
A	complete	155,1
A	target	The Defias Traitor
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
A	goto	1436/0,1045.12,-10508.80
A	turnin	155
A	accept	166
A	target	Gryan Stoutmantle
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
T	label	BandanaStart
A	goto	1436/0,1033.22,-10504.83
A	accept	214
A	target	Scout Riell
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
A	goto	1436,56.454,69.982,0
A	goto	1436,56.434,74.339,0
A	goto	1436,59.384,74.184,0
A	goto	1436,60.871,74.362,0
A	goto	1436,60.902,77.640,0
A	goto	1436,63.442,77.339,0
A	goto	1436,65.203,75.286,0
A	goto	1436,63.594,72.862,0
A	goto	1436,63.825,70.125,0
A	goto	1436,42.649,71.376
A	subzone	20
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
A	goto	1436/0,1527.42,-11072.77
A	subzone	1581
A	dungeon	DM
S	Paladin/Warrior
T	xprate	>1.59
T	optional	
T	completewith	EnterDM
A	use	922
A	itemcount	922,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.8
A	dungeon	DM
A	xp	<21,1
S	Rogue
T	xprate	>1.59
T	optional	
T	completewith	EnterDM
A	use	923
A	itemcount	923,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.19
A	xp	<21,1
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
T	completewith	EnterDM
A	complete	214,1
A	isOnQuest	214
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
T	completewith	next
A	complete	168,1
A	mob	Skeletal Miner
A	mob	Undead Dynamiter
A	mob	Undead Excavator
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
A	goto	1415,41.18,79.80,25,0
A	goto	1415,41.03,79.96,25,0
A	goto	1415,40.92,80.05,25,0
A	goto	1415,41.08,80.11
A	complete	167,1
A	unitscan	Foreman Thistlenettle
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
A	goto	1415,41.18,79.80,25,0
A	goto	1415,41.03,79.96,25,0
A	goto	1415,40.92,80.05,25,0
A	goto	1415,41.08,80.11
A	complete	168,1
A	mob	Skeletal Miner
A	mob	Undead Dynamiter
A	mob	Undead Excavator
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
T	label	EnterDM
A	goto	1415,40.94,79.76,25,0
A	goto	1415,40.86,79.62,20,0
A	goto	1415,40.678,79.578
A	subzone	1581,2
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
T	softcore	
T	optional	
T	completewith	VanCleef << !Paladin
T	completewith	DeadminesBackdoor << Paladin
A	complete	214,1
A	isOnQuest	214
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
T	hardcore	
T	optional	
T	completewith	DeadminesBackdoor
A	complete	214,1
A	isOnQuest	214
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
A	complete	2040,1
A	dungeon	DM
S	Paladin/Warrior
T	xprate	>1.59
T	optional	
T	completewith	VanCleef
A	use	922
A	itemcount	922,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.8
A	dungeon	DM
A	xp	<21,1
S	Rogue
T	xprate	>1.59
T	optional	
T	completewith	VanCleef
A	use	923
A	itemcount	923,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.19
A	xp	<21,1
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
T	label	VanCleef
A	collect	2874,1,373,1
A	complete	166,1
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
T	hardcore	<< !Paladin
T	optional	
T	label	DeadminesBackdoor
T	completewith	DeadminesEnd
A	goto	1436,38.909,84.014
A	subzone	920
A	dungeon	DM
S	Paladin
T	xprate	>1.59
T	optional	
T	completewith	next
A	goto	1436,39.444,85.755
A	goto	1436,40.010,86.514,20
A	dungeon	DM
S	Paladin
T	xprate	>1.59
T	loop	
A	goto	1436,41.645,88.729,0
A	goto	1436,41.196,89.173,10,0
A	goto	1436,41.696,89.244,10,0
A	goto	1436,41.645,88.729,10,0
A	goto	1436,41.461,88.498,10,0
A	goto	1436,41.311,88.506,10,0
A	turnin	1650
A	accept	1651,1
A	link	https://youtu.be/1-nnLcqIIlQ?si=kZi41eXT8ZQmSBY2&t=10
A	target	Daphne Stilwell
A	dungeon	DM
S	Paladin
T	xprate	>1.59
A	goto	1436,41.311,88.506
A	complete	1651,1
A	dungeon	DM
S	Paladin
T	xprate	>1.59
T	loop	
A	goto	1436,41.645,88.729,0
A	goto	1436,41.196,89.173,10,0
A	goto	1436,41.696,89.244,10,0
A	goto	1436,41.645,88.729,10,0
A	goto	1436,41.461,88.498,10,0
A	goto	1436,41.311,88.506,10,0
A	turnin	1651
A	accept	1652
A	target	Daphne Stilwell
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
T	hardcore	<< !Paladin
T	optional	
T	completewith	next
A	goto	1436/0,1966.32,-11407.13,40
A	dungeon	DM
S	
T	xprate	>1.59
T	ah	
T	hardcore	<< !Paladin
A	goto	1436/0,1966.32,-11407.13
A	accept	104
A	accept	103
A	turnin	103
A	target	Captain Grayson
A	itemcount	814,5
A	dungeon	DM
S	
T	xprate	>1.59
T	ssf	
T	hardcore	<< !Paladin
A	goto	1436/0,1966.32,-11407.13
A	accept	104
A	target	Captain Grayson
A	dungeon	DM
S	
T	xprate	>1.59
T	ah	
T	optional	
T	hardcore	<< !Paladin
A	goto	1436/0,1966.32,-11407.13
A	accept	104
A	target	Captain Grayson
A	dungeon	DM
S	
T	xprate	>1.59
T	hardcore	<< !Paladin
A	goto	1436/0,1811.62,-11358.37
A	line	Westfall,34.43,83.93,34.43,83.93,33.88,83.32,33.08,82.86,32.56,82.71,32.08,82.49,31.91,82.36,31.55,81.88,30.86,81.42,30.63,81.16,30.33,80.81,30.02,80.11,29.68,79.22,29.32,78.19,29.29,77.60,29.27,77.31,29.18,76.26,29.07,75.29,28.95,74.14,28.85,73.29,28.79,72.48,28.37,71.94,27.84,71.29,27.44,70.25,27.29,69.47,27.13,68.65,27.09,67.57,27.07,67.01,26.74,66.09,27.07,67.01,27.09,67.57,27.13,68.65,27.29,69.47,27.44,70.25,27.84,71.29,28.37,71.94,28.79,72.48,28.85,73.29,28.95,74.14,29.07,75.29,29.18,76.26,29.27,77.31,29.29,77.60,29.32,78.19,29.68,79.22,30.02,80.11,30.33,80.81,30.63,81.16,30.86,81.42,31.55,81.88,31.91,82.36,32.08,82.49,32.56,82.71,33.08,82.86,33.88,83.32,34.43,83.93
A	complete	104,1
A	unitscan	Old Murk-Eye
A	dungeon	DM
S	
T	xprate	>1.59
T	hardcore	<< !Paladin
A	goto	1436/0,1966.32,-11407.13
A	turnin	104
A	target	Captain Grayson
A	isQuestComplete	104
A	dungeon	DM
S	
T	xprate	>1.59
T	optional	
T	hardcore	<< !Paladin
T	completewith	DeadminesEnd
A	abandon	103
A	dungeon	DM
S	Paladin
T	xprate	>1.59
T	optional	
T	completewith	next
A	goto	1436/0,1527.42,-11072.77
A	subzone	1581
A	dungeon	DM
S	Paladin
T	xprate	>1.59
A	goto	1415,40.678,79.578
A	complete	214,1
A	isOnQuest	214
A	dungeon	DM
S	!Paladin
T	xprate	>1.59 << !Hunter
A	complete	214,1
A	isOnQuest	214
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
T	softcore	
T	completewith	DeadminesEnd
A	deathskip	
A	target	Spirit Healer
A	dungeon	DM
S	Paladin/Warrior
T	xprate	>1.59
T	optional	
T	completewith	DeadminesEnd
A	use	922
A	itemcount	922,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.8
A	dungeon	DM
A	xp	<21,1
S	Rogue
T	xprate	>1.59
T	optional	
T	completewith	DeadminesEnd
A	use	923
A	itemcount	923,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.19
A	xp	<21,1
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
T	label	DeadminesEnd
A	goto	1436/0,1045.12,-10508.80
A	turnin	166
A	target	Gryan Stoutmantle
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
A	goto	1436/0,1033.22,-10504.83
A	turnin	214
A	target	Scout Riell
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
T	optional	
T	sticky	
T	label	LetterLater
A	abandon	373
A	dungeon	DM
S	Mage
T	xprate	>1.59
T	optional	
T	completewith	next
A	cast	3561
A	zoneskip	Stormwind City
A	dungeon	DM
S	Mage
T	xprate	>1.59
T	optional	
A	goto	1453,36.863,81.132
A	train	2138
A	target	Elsharin
A	xp	<22,1
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
T	optional	<< Mage
T	completewith	ShoniEnd
A	goto	1436/0,1037.42,-10628.27
A	fly	Stormwind
A	zoneskip	Stormwind City
A	target	Thor
A	dungeon	DM
S	Warlock
T	xprate	>1.59
T	optional	
T	completewith	next
A	goto	1453/0,988.44,-8942.15,20,0
A	goto	1453/0,1015.33,-8978.9,15
A	xp	<22,1
A	dungeon	DM
S	Warlock
T	xprate	>1.59
T	optional	
A	goto	1453/0,1029.89,-8971.06
A	train	6202
A	target	Ursula Deline
A	xp	<22,1
A	dungeon	DM
S	Paladin
T	xprate	>1.59
T	optional	
T	completewith	next
A	goto	1453,42.917,34.221,15,0
A	goto	1453,41.385,31.547,15,0
A	goto	1453,39.810,29.788,15
A	goto	1453/0,809.52,-8579.22,20
A	xp	<22,1
A	dungeon	DM
S	Paladin
T	xprate	>1.59
T	optional	
A	goto	1453/0,845.95,-8545.70
A	turnin	1652
A	accept	1653
A	target	Duthorian Rall
A	xp	<22,1
A	dungeon	DM
S	Paladin
T	xprate	>1.59
T	optional	
A	goto	1453/0,862.35,-8565.68,12,0
A	goto	1453/0,861.14,-8573.03
A	train	19835
A	target	Arthur the Faithful
A	xp	<22,1
A	dungeon	DM
S	Priest
T	xprate	>1.59
T	optional	
T	completewith	next
A	goto	1453/0,809.52,-8579.22,20,0
A	goto	1453/0,862.89,-8519.61,20
A	xp	<22,1
A	dungeon	DM
S	Priest
T	xprate	>1.59
T	optional	
A	goto	1453/0,862.89,-8519.61
A	train	8103
A	target	High Priestess Laurena
A	xp	<22,1
A	dungeon	DM
S	Rogue
T	xprate	>1.59
T	optional	
A	goto	1453/0,377.47,-8752.39
A	train	1856
A	target	Osborne the Night Man
A	xp	<22,1
A	dungeon	DM
S	Warrior
T	xprate	>1.59
T	optional	
T	completewith	next
A	goto	1453,74.592,51.567,15,0
A	goto	1453,78.011,47.797,15,0
A	goto	1453,80.030,45.591,12
A	xp	<22,1
A	dungeon	DM
S	Warrior
T	xprate	>1.59
T	optional	
A	goto	1453,78.673,45.791
A	train	6192
A	target	Wu Shen
A	xp	<22,1
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
A	goto	1453/0,501.31,-8468.65
A	turnin	167
A	turnin	168
A	target	Wilder Thistlenettle
A	dungeon	DM
S	skip --Hunter - nothing good to train at 22
T	xprate	>1.59
A	goto	1453/0,552.78,-8415.71
A	trainer	
A	target	Einris Brightspear
A	xp	<22,1
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
T	label	ShoniEnd
A	turnin	2040
A	goto	1453/0,634.700,-8390.800
A	target	Shoni the Shilent
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
A	goto	1453/0,638.8,-8341.95
A	vendor	5519
A	bronzetube	
A	target	Billibub Cogspinner
A	dungeon	DM
S	Paladin
T	xprate	>1.59
T	optional	
T	completewith	next
A	goto	1453,42.917,34.221,15,0
A	goto	1453,41.385,31.547,15,0
A	goto	1453,39.810,29.788,15
A	goto	1453/0,809.52,-8579.22,20
A	dungeon	DM
S	Paladin
T	xprate	>1.59
A	goto	1453/0,845.95,-8545.70
A	turnin	1652
A	accept	1653
A	target	Duthorian Rall
A	dungeon	DM
S	Paladin
T	xprate	>1.59
A	goto	1453/0,862.35,-8565.68,12,0
A	goto	1453/0,861.14,-8573.03
A	train	19835
A	target	Arthur the Faithful
A	xp	<22,1
A	dungeon	DM
S	Priest
T	xprate	>1.59
T	optional	
T	completewith	next
A	goto	1453/0,809.52,-8579.22,20,0
A	goto	1453/0,862.89,-8519.61,20
A	xp	<22,1
A	dungeon	DM
S	Priest
T	xprate	>1.59
A	goto	1453/0,862.89,-8519.61
A	train	8103
A	target	High Priestess Laurena
A	xp	<22,1
A	dungeon	DM
S	Rogue
T	xprate	>1.59
A	goto	1453/0,377.47,-8752.39
A	train	1856
A	target	Osborne the Night Man
A	xp	<22,1
A	dungeon	DM
S	Warrior
T	xprate	>1.59
T	optional	
T	completewith	next
A	goto	1453,74.592,51.567,15,0
A	goto	1453,78.011,47.797,15,0
A	goto	1453,80.030,45.591,12
A	xp	<22,1
A	dungeon	DM
S	Warrior
T	xprate	>1.59
A	goto	1453,78.673,45.791
A	train	6192
A	target	Wu Shen
A	xp	<22,1
A	dungeon	DM
S	Mage
T	xprate	>1.59
T	optional	
T	completewith	next
A	cast	3561
A	dungeon	DM
S	Mage
T	xprate	>1.59
T	optional	
A	goto	1453,36.863,81.132
A	train	2138
A	target	Elsharin
A	xp	<22,1
A	dungeon	DM
S	Druid
T	xprate	>1.59
T	optional	
T	completewith	next
A	cast	18960
A	zoneskip	Moonglade
S	Druid
T	xprate	>1.59
T	optional	
T	completewith	next
A	goto	1450/1,-2593.82,7867.06
A	train	8926
A	target	Loganaar
A	xp	<22,1
S	NightElf
T	xprate	>1.59 << !Hunter
T	optional	
T	completewith	NEIFFP
A	goto	1453,60.972,11.690,30,0
A	goto	1453,65.933,5.771
A	subzone	2257
A	zoneskip	Ironforge
A	dungeon	DM
S	NightElf
T	xprate	>1.59 << !Hunter
T	optional	
T	label	DeeprunDMNoFP1
T	completewith	NEIFFP
A	zone	Ironforge
A	zoneskip	Ironforge
A	dungeon	DM
S	NightElf
T	xprate	>1.59 << !Hunter
T	optional	
T	requires	DeeprunDMNoFP1
T	label	DeeprunDMNoFP2
T	completewith	NEIFFP
A	goto	1455,67.842,42.456
A	vendor	5175
A	target	Gearcutter Cogspinner
A	bronzetube	
A	dungeon	DM
S	NightElf Warrior/NightElf Hunter
T	xprate	>1.59 << !Hunter
T	requires	DeeprunDMNoFP2
T	label	DeeprunDMNoFP3
T	completewith	NEIFFP
A	goto	1455/0,-1197.27,-5041.49
A	train	197
A	train	199
A	train	266
A	target	Buliwyf Stonehand
A	dungeon	DM
S	NightElf Warrior
T	xprate	>1.59
T	requires	DeeprunDMNoFP3
T	label	DeeprunDMNoFP4
T	completewith	NEIFFP
A	goto	1455,62.378,88.671
A	collect	3108,200
A	target	Brenwyn Wintersteel
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.7
A	dungeon	DM
S	NightElf Warrior
T	xprate	>1.59
T	requires	DeeprunDMNoFP4
T	label	DeeprunDMNoFP5
T	completewith	NEIFFP
A	use	3108
A	itemcount	3108,1
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.7
A	dungeon	DM
S	NightElf
T	xprate	>1.59 << !Hunter
T	label	NEIFFP
A	goto	1455/0,-1152.32,-4821.18
A	fp	Ironforge
A	target	Gryth Thurden
A	dungeon	DM
S	NightElf
T	xprate	>1.59 << !Hunter
T	optional	
A	goto	1455/0,-1115.43,-4598.86
A	accept	968
A	use	5352
A	itemcount	5352,1
A	zoneskip	Ironforge,1
A	dungeon	DM
S	NightElf
T	xprate	>1.59 << !Hunter
A	goto	1455/0,-1115.43,-4598.86
A	turnin	968
A	target	Gerrig Bonegrip
A	zoneskip	Ironforge,1
A	isOnQuest	968
A	dungeon	DM
S	
T	xprate	>1.59 << !Hunter
T	requires	LetterLater
T	optional	
A	hs	
A	zoneskip	Darkshore
A	dungeon	DM
S	!Hunter
T	xprate	<1.59
A	goto	1439/1,488.69,6564.830
A	collect	4470,1
A	collect	4471,1
A	itemcount	6889,1
A	skill	cooking,50,1
A	target	Dalmond
S	!Hunter
T	xprate	<1.59
T	completewith	next
A	goto	1439,38.107,41.165
A	vendor	6301
A	collect	2678,50,90,1,0x20,cooking
A	disablecheckbox	
A	collect	6889,50,90,1,0x20,cooking
A	disablecheckbox	
A	target	Gorbold Steelhand
A	skill	cooking,50,1
A	itemcount	6889,1
S	!Hunter
T	xprate	<1.59
T	label	TravelMenethilRRBoat
T	completewith	MenethilRRBoat
A	goto	1439,32.432,43.744,15
A	zoneskip	Loch Modan
A	zoneskip	Dun Morogh
A	zoneskip	Ironforge
A	zoneskip	Wetlands
S	!Hunter
T	xprate	<1.59
T	optional	
T	label	DarkshoreRRCook1
T	requires	TravelMenethilRRBoat
T	completewith	MenethilRRBoat
A	cast	818
A	usespell	818
A	zoneskip	Loch Modan
A	zoneskip	Dun Morogh
A	zoneskip	Ironforge
A	zoneskip	Wetlands
A	itemcount	6889,1
A	itemcount	4470,1
A	itemcount	4471,1
A	skill	cooking,50,1
S	!Hunter
T	xprate	<1.59
T	optional	
T	requires	DarkshoreRRCook1
T	completewith	MenethilRRBoat
A	usespell	2550
A	zoneskip	Loch Modan
A	zoneskip	Dun Morogh
A	zoneskip	Ironforge
A	zoneskip	Wetlands
A	itemcount	6889,1
A	itemcount	4471,1
A	skill	cooking,50,1
S	!Hunter
T	xprate	<1.59
T	label	MenethilRRBoat
A	goto	1439/1,826.67,6409.82
A	zone	Wetlands
A	zoneskip	Loch Modan
A	zoneskip	Dun Morogh
A	zoneskip	Ironforge
S	!NightElf !Hunter
T	xprate	<1.59
A	money	<0.08
A	goto	1437/0,-819.67,-3691.42,25,0
A	goto	1437/0,-807.26,-3716.22,25,0
A	goto	1437/0,-827.94,-3724.49,25,0
A	goto	1437,10.760,56.721
A	vendor	
A	target	Neal Allen
A	bronzetube	
S	!NightElf !Hunter
T	xprate	<1.59
A	goto	1437/0,-782.03,-3793.12
A	fly	Ironforge
A	target	Shellei Brondir
S	!Hunter NightElf
T	xprate	<1.59
A	goto	1437/0,-741.47,-3683.07
A	target	James Halloran
A	accept	484
S	!Hunter NightElf
T	xprate	<1.59
A	goto	1437/0,-782.03,-3793.12
A	fp	Wetlands
A	target	Shellei Brondir
S	!Hunter NightElf
T	xprate	<1.59
A	money	<0.08
A	goto	1437/0,-819.67,-3691.42,25,0
A	goto	1437/0,-807.26,-3716.22,25,0
A	goto	1437/0,-827.94,-3724.49,25,0
A	goto	1437,10.760,56.721
A	vendor	
A	target	Neal Allen
A	bronzetube	
S	!Hunter NightElf !Warrior
T	xprate	<1.59
T	completewith	crocs
A	complete	484,1
A	mob	Young Wetlands Crocolisk
A	xp	<19,1
S	!Hunter NightElf
T	xprate	<1.59
T	completewith	next
A	goto	1437/0,-2453.57,-3232.78,50
S	!Hunter NightElf
T	xprate	<1.59
T	label	crocs
A	goto	1437/0,-2453.57,-3232.78
A	target	Einar Stonegrip
A	accept	469
S	!Hunter NightElf !Warrior
T	xprate	<1.59
A	goto	1437/0,-2589.63,-3286.25,55,0
A	goto	1437/0,-2808.80,-3548.09,55,0
A	goto	1437/0,-2957.68,-3840.25,55,0
A	goto	1437/0,-3036.25,-4137.93
A	complete	484,1
A	mob	Young Wetlands Crocolisk
A	xp	<19,1
S	skip --logout skip !Hunter NightElf
T	xprate	1.49-1.59
T	completewith	next
A	goto	1437/0,-3032.11,-4314.33
A	zone	Loch Modan
A	link	https://www.youtube.com/watch?v=21CuGto26Mk
S	!Hunter NightElf
T	xprate	<1.5
T	completewith	next
A	goto	1437/0,-2587.14,-4087.77,30,0
A	goto	1437/0,-2387.82,-3996.53,35,0
A	goto	1437/0,-2463.08,-4135.170,30,0
A	goto	1432/0,-2694.37,-4682.50,30
A	zone	Loch Modan
S	!Hunter NightElf
T	xprate	<1.5
A	goto	1432/0,-3263.96,-4737.87
A	target	Chief Engineer Hinderweir VII
A	accept	250
S	!Hunter NightElf
T	xprate	<1.5
A	goto	1432/0,-3539.80,-4731.06
A	turnin	250
A	accept	199
S	!Hunter NightElf
T	xprate	<1.5
A	goto	1432/0,-3263.96,-4737.87
A	target	Chief Engineer Hinderweir VII
A	turnin	199
S	!Hunter NightElf
T	xprate	<1.5
T	softcore	
T	completewith	next
A	deathskip	
S	!Hunter NightElf
T	xprate	<1.59
A	goto	1432/0,-2929.87,-5424.84
A	fp	Thelsamar
A	target	Thorgrum Borrelson
S	!Hunter NightElf
T	xprate	<1.59
A	goto	1432/0,-2581.27,-5749.45,40,0
A	goto	1432/0,-2520.87,-5630.07,25,0
A	goto	1426/0,-2435.39,-5553.23,20
A	zoneskip	Ironforge
A	zoneskip	Dun Morogh
S	!Hunter NightElf
T	xprate	<1.59
A	goto	1426/0,-913.07,-5023.29
A	zone	Ironforge
S	skip --logout skip !Hunter NightElf
T	xprate	<1.59
A	goto	1426/0,-1677.92,-5738.730,40,0
A	goto	1426/0,-1674.97,-5678.65
A	zone	Ironforge
A	link	https://www.youtube.com/watch?v=kbUSo62CfAM
S	!Hunter NightElf
T	xprate	<1.59
A	goto	1455/0,-1152.47,-4821.17
A	fp	Ironforge
A	target	Gryth Thurden
S	skip --logout skip !Hunter
T	xprate	<1.59
T	completewith	next
T	optional	
A	goto	1455/0,-1158.16,-4816.32,0
A	goto	1455/0,-1330.28,-4843.6,20
A	link	https://www.youtube.com/watch?v=PWMJhodh6Bw
S	!Hunter
T	xprate	<1.59
T	completewith	next
A	goto	1455/0,-1249.95,-4793.470
A	vendor	
A	bronzetube	
A	target	Gearcutter Cogspinner
S	!Hunter
T	xprate	<1.59
A	goto	1455/0,-1330.28,-4843.6,5,0
A	zone	Stormwind City
E
G	Guides/forever/Alliance-11-20.lua
M	xprate	<1.59
M	classic	
M	tbc	
M	season	0,1
M	version	1
M	selector	Alliance !Hunter
M	group	RestedXP Forever Guide (A)
M	subgroup	Speedrun Guide 1-20
M	name	19-20 Redridge
M	next	20-21 Darkshore/Ashenvale
S	
T	completewith	BMenace
A	goto	1453/0,638.8,-8341.95
A	vendor	
A	bronzetube	
A	target	Billibub Cogspinner
S	
A	goto	1453/0,634.700,-8390.800
A	accept	2040
A	target	Shoni the Shilent
A	dungeon	DM
S	!NightElf
A	goto	1453/0,600.22,-8426.93
A	turnin	1338
A	target	Furen Longbeard
A	isOnQuest	1338
S	
A	goto	1453/0,501.31,-8468.65
A	accept	167
A	accept	168
A	target	Wilder Thistlenettle
A	dungeon	DM
S	!NightElf
T	xprate	<1.5
A	goto	1453/0,719.67,-8550.30
A	turnin	399
A	target	Baros Alexston
A	isQuestComplete	399
S	Mage
T	completewith	next
A	goto	1453/0,874.32,-9014.67,10
S	Mage
A	goto	1453/0,885.34,-9006.15
A	trainer	
A	target	Elsharin
S	Paladin/Priest !NightElf
T	completewith	next
A	goto	1453/0,809.52,-8579.22,20
S	Paladin
T	label	PalTrainer
A	goto	1453/0,859.13,-8559.14,10,0
A	goto	1453/0,861.14,-8573.03
A	trainer	
A	target	Arthur the Faithful
S	Priest !NightElf
A	goto	1453/0,862.89,-8519.61
A	trainer	
A	target	Brother Joshua
S	Warlock/Priest
A	goto	1453/0,807.64,-8880.84,14,0
A	goto	1453/0,804.55,-8862.47
A	collect	5210,1
A	target	Ardwyn Cailen
S	Warlock
T	completewith	next
A	goto	1453/0,988.44,-8942.15,20,0
A	goto	1453/0,1015.33,-8978.9,15
S	Warlock
A	goto	1453/0,1029.98,-8971.01
A	trainer	
A	target	Ursula Deline
S	Rogue
A	goto	1453/0,377.61,-8752.30
A	trainer	
A	train	1804
A	target	Osborne the Night Man
S	Rogue
T	completewith	next
A	goto	1453/0,374.11,-8762.88,20,0
A	goto	1453/0,326.66,-8818.01,20,0
A	goto	1453/0,323.43,-8817.83,5
S	Rogue
A	accept	2281
A	goto	1453/0,362.55,-8819.80
A	target	Renzik "The Shiv"
S	Warrior !NightElf
A	goto	1453/0,358.25,-8728.28,15,0
A	goto	1453/0,302.6,-8685.53,15,0
A	goto	1453/0,323.3,-8689.29
A	trainer	
A	target	Wu Shen
A	target	Ilsa Corbin
S	
A	goto	1453/0,613.12,-8795.96
A	train	201
A	train	1180
A	train	202
A	target	Woo Ping
S	Human Paladin
A	goto	1453/0,613.66,-8832.26
A	turnin	1643
A	target	Stephanie Turner
A	accept	1644
A	turnin	1644
S	Rogue
T	ah	
A	goto	1453/0,609.63,-8787.71
A	collect	2209,1
A	target	Marda Weller
A	money	<0.7115
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<10.9
S	Rogue
T	ssf	
A	goto	1453/0,609.63,-8787.71
A	collect	2209,1
A	money	<0.7115
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<10.9
A	target	Marda Weller
S	Rogue
T	optional	
T	completewith	next
A	use	2209
A	itemcount	2209,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<10.89
A	xp	<19,1
S	
T	ah	
A	goto	1453/0,660.28,-8814.55
A	collect	6452,1,2359,1 << !Dwarf Rogue
A	collect	2296,5,92,1
A	collect	1080,5,92,1
A	collect	1081,5,92,1
A	target	Auctioneer Jaxon
A	dungeon	!DM
S	!Human !Warlock
T	completewith	start
A	goto	1453/0,490.12,-8835.67
A	fp	Stormwind
A	target	Dungar Longdrink
S	NightElf
A	goto	1453/0,396.97,-9104.39
A	zone	Elwynn Forest
S	!NightElf
T	xprate	<1.5 << Dwarf/Gnome
A	dungeon	DM
T	completewith	next
A	goto	1453/0,490.12,-8835.67
A	fly	Westfall
A	target	Dungar Longdrink
A	zoneskip	Westfall
S	!NightElf
T	xprate	<1.5 << Dwarf/Gnome
A	dungeon	DM
A	accept	65
A	goto	1436/0,1045.12,-10508.80
A	target	Gryan Stoutmantle
S	!NightElf
T	xprate	<1.5 << Dwarf/Gnome
A	dungeon	DM
A	goto	1436/0,1037.42,-10628.27,-1
A	goto	1453/0,490.12,-8835.67,-1
A	fly	Redridge
A	target	Thor
A	target	Dungar Longdrink
S	!Human
T	xprate	>1.49 << Dwarf/Gnome
A	dungeon	DM
T	completewith	WestEntry
A	goto	1436/0,918.42,-9851.50
A	zone	Westfall
S	!Human
T	xprate	>1.49 << Dwarf/Gnome
A	dungeon	DM
A	goto	1436/0,1037.42,-10628.27
A	fp	Sentinel Hill
A	target	Thor
S	Gnome Warlock
T	xprate	>1.49
A	dungeon	DM
A	goto	1436/0,1037.42,-10628.27
A	fly	Redridge
A	target	Thor
S	!Human
T	xprate	>1.49 << Dwarf/Gnome
A	dungeon	DM
A	accept	65
A	goto	1436/0,1045.12,-10508.80
A	target	Gryan Stoutmantle
S	NightElf Warrior/NightElf Priest
T	completewith	next
A	goto	1429/0,109.60,-9461.65,25
A	goto	1429/0,37.06,-9460.260,15
S	NightElf Warrior
A	goto	1429/0,109.60,-9461.65
A	trainer	
A	target	Lyria Du Lac
S	NightElf Priest
A	goto	1429/0,37.06,-9460.260,12,0
A	goto	1429/0,15.19,-9478.09,8,0
A	goto	1429/0,33.24,-9460.73
A	trainer	
A	target	Priestess Josetta
S	!Human !Warlock
T	xprate	>1.49 << !NightElf
A	xp	<20,1
A	goto	1429/0,-727.57,-9555.160
A	target	Theocritus
A	accept	94
S	!NightElf
A	dungeon	!DM
T	xprate	<1.5 << !Human
T	completewith	next
A	goto	1453/0,490.12,-8835.76
A	fly	Redridge
A	target	Dungar Longdrink
S	!Human !Warlock
T	xprate	>1.49 << Gnome/Dwarf
T	completewith	next
T	label	start
A	goto	1433/0,-1902.32,-9609.54
A	zone	Redridge Mountains
S	!Human !Warlock
T	xprate	>1.49 << Gnome/Dwarf
A	goto	1433/0,-1902.32,-9609.54
A	accept	244
A	target	Guard Parker
S	!Human !Warlock
T	xprate	>1.49 << Gnome/Dwarf
A	goto	1433/0,-2237.93,-9443.60
A	turnin	244
A	target	Deputy Feldon
S	NightElf
T	xprate	<1.5
A	goto	1433/0,-2237.93,-9443.60
A	target	Deputy Feldon
A	accept	246
S	
A	dungeon	DM
A	goto	1433/0,-2164.56,-9213.10,8,0
A	goto	1433/0,-2145.67,-9231.49
A	turnin	65
A	accept	132
A	target	Wiley the Black
S	
A	dungeon	DM
A	goto	1433/0,-2207.10,-9231.34,15,0
A	goto	1433/0,-2221.65,-9218.60
A	target	Magistrate Solomon
A	accept	120
S	
A	dungeon	DM
A	target	Verner Osgood
A	goto	1433/0,-2243.14,-9259.43
A	accept	118
S	
A	dungeon	DM
T	completewith	next
A	goto	1433/0,-2234.89,-9435.35
A	fly	Westfall
A	target	Ariena Stormfeather
S	
A	dungeon	DM
A	goto	1436/0,1045.29,-10508.78
A	turnin	132
A	accept	135
A	target	Gryan Stoutmantle
S	
A	dungeon	DM
T	completewith	next
A	goto	1436/0,1037.42,-10628.27
A	fly	Stormwind
A	target	Thor
S	
A	dungeon	DM
A	goto	1453/0,362.28,-8815.23
A	turnin	135
A	accept	141
A	target	Master Mathias Shaw
S	
A	dungeon	DM
A	goto	1453/0,490.03,-8835.82
A	fly	Westfall
A	target	Dungar Longdrink
S	
A	dungeon	DM
A	goto	1436/0,1045.29,-10508.78
A	turnin	141
A	accept	142
A	target	Gryan Stoutmantle
S	
A	dungeon	DM
T	completewith	next
A	goto	1436/0,1459.17,-11024.47,55
S	
A	dungeon	DM
A	goto	1436/0,1459.17,-11024.47
A	line	Westfall,44.50,69.62,44.50,69.62,45.08,69.40,45.21,69.35,45.63,68.69,45.85,67.73,45.62,66.99,45.52,65.71,45.61,64.95,44.28,63.88,44.26,62.80,43.60,59.89,43.37,58.42,43.26,57.01,43.12,54.24,42.15,52.74,41.74,51.42,41.48,49.89,40.91,48.71,38.93,46.05,38.51,45.46,37.85,45.54,36.60,44.21,36.06,43.86,35.12,43.49,33.92,43.21,32.56,43.05,31.34,44.54,32.56,43.05,33.92,43.21,35.12,43.49,36.06,43.86,36.26,43.77,36.87,42.87,36.95,40.85,37.04,39.79,37.91,36.98,39.06,35.58,40.48,34.31,41.27,32.87,41.76,31.27,42.26,30.26,43.20,28.99,44.29,28.19,44.64,26.85,44.57,24.94,44.64,26.85,44.29,28.19,43.20,28.99,42.26,30.26,41.76,31.27,41.27,32.87,40.48,34.31,39.06,35.58,37.91,36.98,37.04,39.79,36.95,40.85,36.87,42.87,36.26,43.77,36.06,43.86,35.12,43.49,33.92,43.21,32.56,43.05,31.34,44.54,32.56,43.05,33.92,43.21,35.12,43.49,36.06,43.86,36.60,44.21,37.85,45.54,38.51,45.46,38.93,46.05,40.91,48.71,41.48,49.89,41.74,51.42,42.15,52.74,43.12,54.24,43.26,57.01,43.37,58.42,43.60,59.89,44.26,62.80,44.28,63.88,45.61,64.95,45.52,65.71,45.62,66.99,45.85,67.73,45.63,68.69,45.21,69.35,45.08,69.40,44.50,69.62
A	complete	142,1
A	unitscan	Defias Messenger
S	
A	dungeon	DM
A	goto	1436/0,1045.12,-10508.80
A	turnin	142
A	target	Gryan Stoutmantle
S	
A	dungeon	DM
A	goto	1436/0,1067.87,-10508.330
A	accept	155
A	target	The Defias Traitor
S	
A	dungeon	DM
A	goto	1436/0,1527.07,-11073.23
A	complete	155,1
A	target	The Defias Traitor
S	
A	dungeon	DM
A	goto	1436/0,1045.12,-10508.80
A	turnin	155
A	accept	166
A	target	Gryan Stoutmantle
S	
A	dungeon	DM
A	accept	214
A	goto	1436/0,1033.22,-10504.83
A	target	Scout Riell
S	
A	dungeon	DM
A	goto	1436/0,902.67,-11084.67
A	goto	1436/0,1602.67,-11070.67
A	subzone	1581
S	
A	dungeon	DM
A	goto	1436/0,1527.42,-11072.77
A	subzone	1581
S	
A	dungeon	DM
T	completewith	EnterDM
A	complete	214,1
A	isOnQuest	214
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
A	isOnQuest	214
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
A	goto	1436/0,1045.12,-10508.80,100
S	
A	dungeon	DM
A	turnin	166
A	target	+Gryan Stoutmantle
A	goto	1436/0,1045.12,-10508.80
A	turnin	-214
A	target	+Scout Riell
A	goto	1436/0,1033.22,-10504.83
S	
A	dungeon	DM
T	completewith	next
A	goto	1436/0,1037.42,-10628.27
A	fly	Stormwind
A	target	Thor
S	
A	dungeon	DM
A	goto	1453/0,520.88,-8954.15
A	turnin	120
A	accept	121
A	target	General Marcus Jonathan
S	Mage
A	dungeon	DM
T	completewith	next
A	goto	1453/0,874.32,-9014.67,10
S	Mage
A	dungeon	DM
A	goto	1453/0,885.34,-9006.15
A	trainer	
A	target	Elsharin
S	Mage
A	dungeon	DM
A	goto	1453/0,847.56,-8991.90
A	train	3561
A	xp	<20,1
A	target	Larimaine Purdue
S	Warlock
A	dungeon	DM
T	completewith	next
A	goto	1453/0,988.44,-8942.15,20,0
A	goto	1453/0,1015.33,-8978.9,15
S	Warlock
A	dungeon	DM
A	goto	1453/0,1029.98,-8971.01
A	trainer	
A	target	Ursula Deline
S	Warlock
A	dungeon	DM
A	goto	1453/0,1041.54,-8983.29
A	accept	1716
A	target	Gakin the Darkbinder
A	xp	<20,1
S	
A	goto	1453/0,1093.3,-8779.020
A	accept	3765
A	target	Argos Nightwhisper
A	dungeon	DM
S	Druid
A	dungeon	DM
A	goto	1453/0,1100.15,-8776.330
A	trainer	
A	train	768
A	target	Sheldras Moontree
S	Paladin/Priest
A	dungeon	DM
T	completewith	next
A	goto	1453/0,809.52,-8579.22,20
S	Paladin
A	dungeon	DM
A	goto	1453/0,845.95,-8545.70
A	collect	6776,1,1649
A	accept	1649
A	target	Duthorian Rall
S	Paladin
A	dungeon	DM
A	goto	1453/0,845.95,-8545.70
A	turnin	1649
A	accept	1650
A	target	Duthorian Rall
S	Paladin
A	dungeon	DM
A	goto	1453/0,859.13,-8559.14,10,0
A	goto	1453/0,861.14,-8573.03
A	trainer	
A	target	Arthur the Faithful
S	Priest
A	dungeon	DM
A	goto	1453/0,862.89,-8519.61
A	trainer	
A	target	Brother Joshua
S	
A	dungeon	DM
A	goto	1453/0,734.66,-8555.94,10,0
A	goto	1453/0,719.68,-8550.31
A	turnin	373
A	accept	389
A	target	Baros Alexston
S	
A	dungeon	DM
A	turnin	167
A	turnin	168
A	target	+Wilder Thistlenettle
A	goto	1453/0,501.31,-8468.65
A	turnin	2040
A	target	+Shoni the Shilent
A	goto	1453/0,634.700,-8390.800
S	Rogue
A	dungeon	DM
A	goto	1453/0,377.61,-8752.30
A	trainer	
A	target	Osborne the Night Man
S	Rogue
A	dungeon	DM
T	completewith	next
A	goto	1453/0,374.11,-8762.88,20,0
A	goto	1453/0,326.66,-8818.01,20,0
A	goto	1453/0,323.43,-8817.83,5
S	Rogue
A	dungeon	DM
A	accept	2360
A	goto	1453/0,362.28,-8815.23
A	target	Master Mathias Shaw
S	Warrior
A	dungeon	DM
A	goto	1453/0,358.25,-8728.28,15,0
A	goto	1453/0,302.6,-8685.53,15,0
A	goto	1453/0,323.3,-8689.29
A	trainer	
A	target	Wu Shen
A	target	Ilsa Corbin
S	Rogue
A	dungeon	DM
T	ah	
A	goto	1453/0,609.63,-8787.71
A	collect	923,1
A	target	Marda Weller
A	money	<0.8743
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.2
S	Rogue
A	dungeon	DM
T	ssf	
A	goto	1453/0,609.63,-8787.71
A	collect	923,1
A	target	Marda Weller
A	money	<0.8743
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.2
S	Rogue
A	dungeon	DM
T	optional	
T	completewith	next
A	use	923
A	itemcount	923,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.19
A	xp	<21,1
S	Warrior/Paladin
A	dungeon	DM
T	ah	
A	goto	1453/0,607.48,-8790.40
A	collect	922,1
A	target	Gunther Weller
A	money	<1.2038
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<16.0
S	Warrior/Paladin
A	dungeon	DM
T	ssf	
A	goto	1453/0,607.48,-8790.40
A	collect	922,1
A	target	Gunther Weller
A	money	<1.2038
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<16.0
S	Warrior/Paladin
A	dungeon	DM
T	optional	
T	completewith	next
A	use	922
A	itemcount	922,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.89
A	xp	<21,1
S	
A	dungeon	DM
A	goto	1453/0,810.53,-8809.81,10,0
A	goto	1453/0,828.45,-8799.55
A	turnin	389
A	target	Warden Thelwater
S	
T	ah	
A	goto	1453/0,660.28,-8814.55
A	collect	6452,1,2359,1 << !Dwarf Rogue
A	collect	2296,5,92,1
A	collect	1080,5,92,1
A	collect	1081,5,92,1
A	target	Auctioneer Jaxon
A	dungeon	DM
S	
A	dungeon	DM
T	completewith	next
A	goto	Elwynn Forest,32.240,49.723,60
A	isOnQuest	118
A	xp	<20,1
S	
A	dungeon	DM
A	goto	1429/0,87.73,-9456.79
A	target	Smith Argus
A	turnin	118
A	accept	119
A	isOnQuest	118
A	xp	<20,1
S	
A	dungeon	DM
A	isQuestTurnedIn	118
A	goto	1429/0,87.73,-9456.79
A	target	Smith Argus
A	accept	119
A	xp	<20,1
S	
A	dungeon	DM
T	completewith	next
A	subzone	91
A	xp	<20,1
S	
A	dungeon	DM
A	goto	1429/0,-728.26,-9553.08
A	target	Theocritus
A	accept	94
A	xp	<20,1
S	
A	dungeon	DM
A	goto	Elwynn Forest,64.880,69.192
A	vendor	
A	vendor	
A	target	Dawn Brightstar
A	subzoneskip	91,1
S	
A	dungeon	DM
T	completewith	FlyR
A	goto	1433/0,-1716.28,-9623.29
A	zone	Redridge Mountains
S	
A	dungeon	DM
T	xprate	<1.5
T	label	GParker
A	goto	1433/0,-1902.32,-9609.54
A	accept	244
A	target	Guard Parker
S	
A	dungeon	DM
T	xprate	<1.5
A	goto	1433/0,-2237.93,-9443.60
A	turnin	244
A	target	Deputy Feldon
S	
T	label	BMenace
A	goto	1433/0,-2298.06,-9284.04
A	accept	20
A	target	Marshal Marris
S	
A	goto	1433/0,-2268.32,-9279.12
A	accept	125
A	target	Foreman Oslow
S	
A	target	Verner Osgood
A	goto	1433/0,-2243.14,-9259.43
A	accept	118
S	
A	dungeon	DM
T	xprate	>1.49
A	target	Verner Osgood
A	goto	1433/0,-2243.14,-9259.43
A	turnin	119
A	accept	124
S	
A	dungeon	DM
T	xprate	<1.5
A	target	Verner Osgood
A	goto	1433/0,-2243.14,-9259.43
A	turnin	119
A	accept	124
A	accept	122
S	
A	dungeon	DM
A	target	General Marcus Jonathan
A	goto	1453/0,520.88,-8954.15
A	turnin	120
A	accept	121
S	
A	dungeon	!DM
A	goto	1433/0,-2207.10,-9231.34,15,0
A	goto	1433/0,-2221.65,-9218.60
A	target	Magistrate Solomon
A	accept	120
S	
A	target	Dockmaster Baren
A	goto	1433/0,-2172.15,-9261.310
A	accept	127
S	
T	xprate	<1.5
A	goto	1433/0,-2152.62,-9217.870
A	target	Darcy
A	accept	129
S	
A	goto	1433/0,-2164.56,-9213.10,8,0
A	goto	1433/0,-2145.67,-9231.49
A	target	Wiley the Black
A	turnin	65
A	isOnQuest	65
S	
T	optional	
A	goto	1433/0,-2062.96,-9209.62
A	accept	92
A	turnin	92
A	itemcount	2296,5
A	itemcount	1080,5
A	itemcount	1081,5
A	target	Chef Breanna
S	Warlock
A	target	Martie Jainrose
A	goto	1433/0,-2045.16,-9245.67
A	accept	34
S	Warlock
A	goto	1433/0,-1911.22,-9288.820
A	complete	34,1
A	link	https://youtu.be/6JE967OG3CU?t=1845
A	mob	Bellygrub
S	Warlock
A	goto	1433/0,-2045.16,-9245.67
A	target	Martie Jainrose
A	turnin	34
S	Rogue
A	goto	1433/0,-2180.19,-9328.21
A	turnin	2281
A	accept	2282
A	target	Lucius
S	
A	target	Shawn
A	goto	1433/0,-2207.10,-9351.52
A	accept	3741
S	
A	goto	1433/0,-2174.32,-9386.56,0
A	goto	1433/0,-2147.41,-9308.08,0
A	goto	1433/0,-2090.96,-9373.82,0
A	goto	1433/0,-1986.76,-9324.30,0
A	goto	1433/0,-2246.40,-9359.92,0
A	goto	1433/0,-2309.57,-9376.28,0
A	goto	1433/0,-2397.70,-9363.97,0
A	goto	1433/0,-1986.76,-9324.30,70,0
A	goto	1433/0,-2397.70,-9363.97,70,0
A	complete	3741,1
S	Druid
A	target	Hilary
A	goto	1433/0,-2205.58,-9351.52
A	turnin	3741
S	
T	softcore	
A	goto	1433/0,-2472.16,-9366.72
A	complete	125,1
S	
T	xprate	<1.5
T	sticky	
T	completewith	orcs
A	collect	2296,5,92,1
A	collect	1080,5,92,1
A	collect	1081,5,92,1
A	mob	Great Goretusk
A	mob	Tarantula
A	mob	Dire Condor
S	
T	xprate	<1.5
A	target	Guard Parker
A	goto	1433/0,-1902.97,-9610.260
A	accept	244
S	
T	xprate	<1.5
A	target	Guard Parker
A	goto	1433/0,-1902.32,-9609.54
A	turnin	129
A	accept	130
S	
T	xprate	<1.5
A	target	Deputy Feldon
A	goto	1433/0,-2237.28,-9443.750
A	turnin	244
A	accept	246
S	
T	xprate	<1.5
A	goto	1433/0,-2031.48,-9556.25,45,0
A	goto	1433/0,-1955.07,-9637.63,45,0
A	goto	1433/0,-1813.97,-9679.9,45,0
A	goto	1433/0,-1861.07,-9754.76,45,0
A	goto	1433/0,-1980.25,-9641.10
A	collect	1081,5,92,1
A	mob	Tarantula
S	
T	xprate	<1.5
A	goto	1433/0,-2211.01,-9773.870,45,0
A	goto	1433/0,-2276.79,-9759.11,45,0
A	goto	1433/0,-2508.20,-9620.68,45,0
A	goto	1433/0,-2246.61,-9764.90
A	complete	246,1
A	mob	+Redridge Mongrel
A	complete	246,2
A	mob	+Redridge Poacher
S	
A	goto	1433/0,-2634.54,-9588.54
A	complete	127,1
A	collect	1468,8,150,1
A	mob	Murloc Shorestriker
A	mob	Murloc Minor Tidecaller
S	
T	xprate	<1.5
A	goto	1433/0,-2903.07,-9691.340
A	collect	1080,5,92,1
A	mob	Dire Condor
S	
T	label	orcs
A	goto	1433/0,-3177.25,-9718.85,60,0
A	goto	1433/0,-3224.57,-9782.42,60,0
A	goto	1433/0,-3259.74,-9566.82,60,0
A	goto	1433/0,-3092.80,-9694.82,60,0
A	goto	1433/0,-3177.25,-9718.850
A	complete	20,1
A	mob	Blackrock Grunt
A	mob	Blackrock Outrunner
S	
T	xprate	<1.5
A	goto	1433/0,-2903.07,-9691.340
A	collect	1080,5,92,1
A	mob	Dire Condor
S	
T	hardcore	
A	goto	1433/0,-2472.16,-9366.72
A	complete	125,1
S	
A	goto	1433/0,-2634.54,-9588.54
A	xp	20-7687
A	xp	20-10012
S	Rogue
T	completewith	next
A	subzone	97
S	Rogue
A	goto	1433,51.846,45.116
A	skill	lockpicking,80
S	Rogue
A	goto	1433/0,-2700.75,-9222.07
A	complete	2282,1
A	skill	lockpicking,<80,1
S	
T	completewith	next
A	goto	1433/0,-2298.06,-9284.04,150
S	
A	target	Marshal Marris
A	goto	1433/0,-2298.06,-9284.04
A	turnin	20
S	
A	target	Foreman Oslow
A	goto	1433/0,-2268.32,-9279.12
A	turnin	125
A	accept	89
S	
A	target	Dockmaster Baren
A	goto	1433/0,-2172.59,-9261.02
A	turnin	127
A	accept	150
A	turnin	150
A	xp	<20,1
S	
A	target	Dockmaster Baren
A	goto	1433/0,-2172.59,-9261.02
A	turnin	127
S	
T	optional	
A	target	Chef Breanna
A	goto	1433/0,-2062.96,-9209.62
A	accept	92
A	turnin	92
A	itemcount	2296,5
A	itemcount	1080,5
A	itemcount	1081,5
S	
T	xprate	<1.5
A	target	Martie Jainrose
A	goto	1433/0,-2045.38,-9245.82
A	turnin	130
A	accept	131
S	
T	xprate	<1.5
A	target	Darcy
A	goto	1433/0,-2152.62,-9216.430
A	turnin	131
S	Rogue
A	target	Lucius
A	goto	1433/0,-2180.19,-9328.21
A	turnin	2282
S	
A	target	Hilary
A	goto	1433/0,-2205.58,-9351.52
A	turnin	3741
S	Rogue
T	optional	
T	completewith	InRR
A	destroy	7907
S	
T	xprate	<1.5
A	target	Deputy Feldon
A	goto	1433/0,-2237.93,-9443.60
A	turnin	246
S	
A	goto	1433/0,-2634.54,-9588.54
A	xp	20
S	Rogue
A	dungeon	DM
T	softcore	
A	isOnQuest	2360
A	goto	1433/0,-2234.89,-9435.35
A	fp	Redridge Mountains
A	fly	Westfall
A	target	Ariena Stormfeather
S	
A	dungeon	!DM << Rogue
T	completewith	InRR
A	goto	1433/0,-2234.89,-9435.35
A	target	Ariena Stormfeather
A	fp	Redridge Mountains
A	fly	Stormwind
S	Rogue
A	dungeon	!DM
T	ah	
A	goto	1453/0,609.63,-8787.71
A	collect	923,1
A	target	Marda Weller
A	money	<0.8743
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.2
S	Rogue
A	dungeon	!DM
T	ssf	
A	goto	1453/0,609.63,-8787.71
A	collect	923,1
A	target	Marda Weller
A	money	<0.8743
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.2
S	Rogue
A	dungeon	!DM
T	optional	
T	completewith	next
A	use	923
A	itemcount	923,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<12.19
A	xp	<21,1
S	Warrior/Paladin
A	dungeon	!DM
T	ah	
A	goto	1453/0,607.48,-8790.40
A	collect	922,1
A	target	Gunther Weller
A	money	<1.2038
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<16.0
S	Warrior/Paladin
A	dungeon	!DM
T	ssf	
A	goto	1453/0,607.48,-8790.40
A	collect	922,1
A	target	Gunther Weller
A	money	<1.2038
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<16.0
S	Warrior/Paladin
A	dungeon	!DM
T	optional	
T	completewith	next
A	use	922
A	itemcount	922,1
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<15.89
A	xp	<21,1
S	Warlock
A	dungeon	!DM
T	completewith	next
A	goto	1453/0,988.44,-8942.15,20,0
A	goto	1453/0,1015.33,-8978.9,15
S	Warlock
A	dungeon	!DM
A	goto	1453/0,1029.98,-8971.01
A	trainer	
A	target	Ursula Deline
S	Warlock
A	goto	1453/0,1041.54,-8983.29
A	accept	1716
A	target	Gakin the Darkbinder
S	Mage
A	dungeon	!DM
T	completewith	next
A	goto	1453/0,874.32,-9014.67,10
S	Mage
A	dungeon	!DM
A	goto	1453/0,885.34,-9006.15
A	trainer	
A	target	Elsharin
S	Mage
A	dungeon	!DM
A	goto	1453/0,847.56,-8991.90
A	train	3561
A	xp	<20,1
A	target	Larimaine Purdue
S	
A	goto	1453/0,1093.3,-8779.020
A	accept	3765
A	target	Argos Nightwhisper
A	dungeon	!DM
S	Druid
A	dungeon	!DM
A	goto	1453/0,1100.15,-8776.330
A	trainer	
A	train	768
A	target	Sheldras Moontree
S	Paladin/Priest
A	dungeon	!DM
T	completewith	next
A	goto	1453/0,809.52,-8579.22,20
S	Paladin
A	dungeon	!DM
A	goto	1453/0,845.95,-8545.70
A	collect	6776,1,1649
A	accept	1649
A	target	Duthorian Rall
S	Paladin
A	dungeon	!DM
A	goto	1453/0,845.95,-8545.70
A	turnin	1649
A	accept	1650
A	target	Duthorian Rall
S	Paladin
A	dungeon	!DM
A	goto	1453/0,859.13,-8559.14,10,0
A	goto	1453/0,861.14,-8573.03
A	trainer	
A	target	Arthur the Faithful
S	Priest
A	dungeon	!DM
A	goto	1453/0,862.89,-8519.61
A	trainer	
A	target	Brother Joshua
S	Rogue
A	dungeon	!DM
A	goto	1453/0,377.61,-8752.30
A	trainer	
A	target	Osborne the Night Man
S	Rogue
A	dungeon	!DM
T	completewith	next
A	goto	1453/0,374.11,-8762.88,20,0
A	goto	1453/0,326.66,-8818.01,20,0
A	goto	1453/0,323.43,-8817.83,5
S	Rogue
A	dungeon	!DM
A	accept	2360
A	goto	1453/0,362.28,-8815.23
A	target	Master Mathias Shaw
S	Warrior
A	dungeon	!DM
A	goto	1453/0,358.25,-8728.28,15,0
A	goto	1453/0,302.6,-8685.53,15,0
A	goto	1453/0,323.3,-8689.29
A	trainer	
A	target	Wu Shen
A	target	Ilsa Corbin
S	NightElf Rogue
A	goto	1436/0,1037.42,-10628.27,5,0
A	zone	Westfall
A	isOnQuest	2360
S	NightElf Rogue
A	goto	1436/0,1037.42,-10628.27
A	fp	Westfall
A	target	Thor
A	isOnQuest	2360
S	!NightElf Rogue
A	goto	1453/0,490.03,-8835.82
A	fly	Westfall
A	target	Dungar Longdrink
S	!Dwarf Rogue
A	goto	1431/0,404.03,-11014.47,60,0
A	goto	1431/0,432.11,-10878.75,50,0
A	goto	1431/0,551.72,-10688.13
A	collect	1475,1,2359,1
A	collect	2251,6,93,1,1
A	disablecheckbox	
A	mob	Pygmy Venom Web Spider
A	mob	Venom Web Spider
A	itemcount	6452,<1
S	Rogue
T	optional	
T	completewith	TowerKey
S	Rogue
A	goto	1436/0,619.17,-11035.20
A	turnin	2360
A	accept	2359
A	target	Agent Kearnen
S	Rogue
T	label	TowerKey
T	loop	
A	goto	1436/0,514.52,-11114.77,0
A	goto	1436/0,531.32,-11166.80,0
A	goto	1436/0,581.37,-11104.97,0
A	goto	1436/0,514.52,-11114.77,30,0
A	goto	1436/0,531.32,-11166.80,30,0
A	goto	1436/0,581.37,-11104.97,30,0
A	complete	2359,2
A	link	https://www.youtube.com/watch?v=5sIew15IcG0
A	mob	Malformed Defias Drone
S	Rogue
T	optional	
T	completewith	Mortwake
A	use	15396
A	itemcount	15396,1
S	Rogue
T	label	Mortwake
A	goto	1436,70.421,74.031
A	complete	2359,1
A	link	https://www.youtube.com/watch?v=5sIew15IcG0
A	mob	Defias Tower Patroller
A	mob	Defias Tower Sentry
S	!Dwarf Rogue
T	sticky	
T	label	AntiVenomStart
A	collect	6452,1
A	aura	-9991
A	itemcount	6452,<1
A	train	7934,3
S	!Dwarf Rogue
T	optional	
T	requires	AntiVenomStart
T	label	AntiVenomEnd
A	cast	7932
A	use	6452
A	aura	-9991
A	itemcount	6452,1
S	Dwarf Rogue
T	optional	
T	sticky	
T	label	AntiVenomEnd2
A	cast	20594
A	aura	-9991
S	Rogue
T	optional	
T	completewith	KlavenEnd
A	goto	1436/0,1037.42,-10628.27
A	fly	Stormwind
A	target	Thor
S	!Dwarf Rogue
T	optional	
T	requires	AntiVenomEnd
T	completewith	FirstAidEnd
A	goto	1453,42.938,33.878,20,0
A	goto	1453,41.544,31.330,20,0
A	goto	1453,41.688,28.049,20,0
A	goto	1453,43.070,26.155,15
A	aura	-9991
S	!Dwarf Rogue
T	requires	AntiVenomEnd
A	goto	1453,43.070,26.155
A	skill	firstaid,80
A	aura	-9991
A	itemcount	6452,<1
S	!Dwarf Rogue
T	label	FirstAidEnd
A	goto	1453,43.070,26.155
A	train	7934
A	aura	-9991
A	itemcount	6452,<1
S	!Dwarf Rogue
T	sticky	
T	label	AntiVenomStart2
A	collect	6452,1
A	aura	-9991
A	itemcount	6452,<1
A	train	7934,3
S	!Dwarf Rogue
T	sticky	
T	requires	AntiVenomStart2
T	label	AntiVenomEnd2
A	cast	7932
A	use	6452
A	aura	-9991
A	itemcount	6452,1
S	Rogue
T	optional	
T	requires	AntiVenomEnd2 << Rogue
T	completewith	next
A	goto	1453/0,374.11,-8762.88,20,0
A	goto	1453/0,326.66,-8818.01,20,0
A	goto	1453/0,323.43,-8817.83,10
S	Rogue
T	label	KlavenEnd
T	requires	AntiVenomEnd2 << Rogue
A	goto	1453/0,362.28,-8815.23
A	turnin	2359
A	target	Master Mathias Shaw
S	
A	target	General Marcus Jonathan
A	goto	1453/0,520.88,-8954.15
A	turnin	120
A	accept	121
S	
T	completewith	next
A	goto	1429/0,84.61,-9457.95,60
S	
A	goto	1429/0,87.73,-9456.79
A	target	Smith Argus
A	turnin	118
A	accept	119
S	
T	completewith	next
A	goto	1429/0,-727.57,-9555.16,50
S	
A	goto	1429/0,-728.26,-9553.08
A	target	Theocritus
A	accept	94
A	xp	<20,1
S	
T	label	InRR
T	completewith	FlyR
A	goto	1453/0,489.72,-8837.28,-1
A	goto	1433/0,-1716.28,-9623.29,-1
A	zone	Redridge Mountains
A	fly	Redridge
S	
A	target	Verner Osgood
A	goto	1433/0,-2243.14,-9259.43
A	turnin	119
A	accept	124
S	
T	xprate	<1.2
A	target	Verner Osgood
A	goto	1433/0,-2243.14,-9259.43
A	accept	122
S	
T	label	FlyR
A	target	Magistrate Solomon
A	goto	1433/0,-2207.10,-9231.34,15,0
A	goto	1433/0,-2221.65,-9218.60
A	turnin	121
S	
A	target	Hilary
A	goto	1433/0,-2205.58,-9351.52
A	turnin	3741
S	
A	target	Dockmaster Baren
A	goto	1433/0,-2172.59,-9261.02
A	turnin	127
A	accept	150
A	turnin	150
S	
T	optional	
T	xprate	>1.49
A	target	Chef Breanna
A	goto	1433/0,-2062.96,-9209.62
A	accept	92
A	turnin	92
A	itemcount	2296,5
A	itemcount	1080,5
A	itemcount	1081,5
S	
T	xprate	<1.5
A	target	Chef Breanna
A	goto	1433/0,-2062.96,-9209.62
A	accept	92
A	turnin	92
S	
T	xprate	<1.5
A	target	Martie Jainrose
A	goto	1433/0,-2045.38,-9245.82
A	turnin	130
A	accept	131
S	
T	xprate	<1.2
T	completewith	next
A	complete	122,1
A	mob	Black Dragon Whelp
S	
T	xprate	<1.5
A	goto	1433/0,-1912.31,-9339.93,60,0
A	goto	1433/0,-2270.93,-9591.440,60,0
A	goto	1433/0,-2244.23,-9619.53,60,0
A	goto	1433/0,-1912.31,-9339.93
A	collect	2296,5,92,1
A	mob	Great Goretusk
S	
T	optional	
A	target	Chef Breanna
A	goto	1433/0,-2062.96,-9209.62
A	accept	92
A	turnin	92
A	itemcount	2296,5
A	itemcount	1080,5
A	itemcount	1081,5
S	
T	xprate	<1.2
T	completewith	next
A	complete	122,1
A	mob	Black Dragon Whelp
S	
A	goto	1433/0,-2031.70,-9098.71,60,0
A	goto	1433/0,-2313.26,-9149.82,60,0
A	goto	1433/0,-2430.70,-9030.51,60,0
A	goto	1433/0,-2313.26,-9149.82,60,0
A	goto	1433/0,-2031.70,-9098.71,60,0
A	goto	1433/0,-2313.26,-9149.82,60,0
A	goto	1433/0,-2430.70,-9030.51,60,0
A	goto	1433/0,-2059.27,-9091.91,0
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
S	
T	xprate	<1.2
A	goto	1433/0,-2514.49,-9033.70,50,0
A	goto	1433/0,-2580.70,-9091.33,50,0
A	goto	1433/0,-2321.07,-9527.58,50,0
A	goto	1433/0,-2364.92,-9645.44
A	mob	Black Dragon Whelp
A	complete	122,1
S	
T	xprate	<1.5
A	target	Darcy
A	goto	1433/0,-2152.62,-9216.430
A	turnin	131
S	
T	xprate	<1.2
T	completewith	next
A	goto	1433/0,-1908.40,-9299.83,0
A	goto	1433/0,-1988.50,-9176.32,0
A	goto	1433/0,-1937.7,-9371.64,0
A	goto	1433/0,-2146.54,-9225.84
A	skill	cooking,50,1
A	mob	Great Goretusk
S	
T	xprate	<1.2
A	target	Verner Osgood
A	goto	1433/0,-2243.79,-9259.860
A	turnin	124
A	turnin	122
S	
T	xprate	>1.0
A	target	Verner Osgood
A	goto	1433/0,-2243.14,-9259.43
A	turnin	124
S	
A	target	Foreman Oslow
A	goto	1433/0,-2267.67,-9280.140
A	turnin	89
E
G	Guides/forever/Alliance-11-20.lua
M	classic	
M	tbc	
M	season	0,1
M	version	1
M	season	0
M	selector	Alliance Hunter
M	group	RestedXP Forever Guide (A)
M	subgroup	Speedrun Guide 1-20
M	name	19-21 Darkshore/Ashenvale
M	next	RestedXP Alliance 20-30\21-23 Ashenvale/Stonetalon
S	
T	xprate	>1.59
A	goto	1439,38.325,43.039
A	turnin	3765
A	target	Gershala Nightwhisper
A	isOnQuest	3765
A	dungeon	DM
S	
T	xprate	>1.49
T	optional	
T	completewith	next
A	complete	1138,1
A	mob	Encrusted Tide Crawler
A	mob	Reef Crawler
S	
T	xprate	>1.49
A	goto	1439,32.644,80.711
A	accept	4730
S	
T	xprate	>1.49
T	optional	
T	completewith	next
A	complete	1138,1
A	mob	Encrusted Tide Crawler
S	
T	xprate	>1.49
A	goto	1439,31.690,83.700
A	accept	4731
S	
T	xprate	>1.49
T	loop	
A	goto	1439,32.674,81.752,0
A	goto	1439,36.327,73.408,0
A	goto	1439,35.195,71.864,0
A	goto	1439,32.674,81.752,60,0
A	goto	1439,33.284,80.330,60,0
A	goto	1439,34.174,80.488,60,0
A	goto	1439,35.432,79.052,60,0
A	goto	1439,36.327,73.408,60,0
A	goto	1439,35.412,73.176,60,0
A	goto	1439,35.033,72.432,60,0
A	goto	1439,35.195,71.864,60,0
A	complete	1138,1
A	mob	Encrusted Tide Crawler
A	mob	Reef Crawler
S	
T	xprate	>1.49
A	goto	1439,31.229,85.564
A	accept	4732
S	
T	xprate	>1.49
T	label	SeaCreatureEnd
A	goto	1439,31.251,87.419
A	accept	4733
A	link	https://youtu.be/lfQM3Q-Ag5A
S	
T	optional	
A	goto	1439,43.555,76.293
A	turnin	951
A	target	Onu
A	isQuestTurnedIn	731
S	
T	optional	
A	goto	1439,44.401,76.425
A	accept	5321
A	target	Kerlonian Evershade
A	isQuestTurnedIn	731
S	
T	optional	
A	isOnQuest	5321
A	goto	1439/1,34.78,5001.570
A	complete	5321,1
A	isQuestTurnedIn	731
S	
T	sticky	
T	label	prospector
A	goto	1439,35.724,83.696
A	turnin	729
A	isOnQuest	729
A	target	Prospector Remtravel
S	
A	goto	1439/1,602.01,4678.87
A	accept	731,1
A	link	https://www.youtube.com/watch?v=crQAvyRIceU
A	target	Prospector Remtravel
A	isQuestAvailable	731
S	
T	requires	prospector
A	link	https://www.youtube.com/watch?v=crQAvyRIceU
A	complete	731,1
A	isOnQuest	731
S	
T	optional	
T	completewith	TheryluneEnd
A	collect	5352,1,968,1
A	mob	Twilight Disciple
A	mob	Twilight Thug
S	
A	goto	1439,38.660,87.305
A	accept	945
A	target	Therylune
S	
T	label	TheryluneEnd
A	goto	1439/1,288.26,4530.40
A	complete	945,1
A	isOnQuest	945
S	
T	xprate	<1.5
T	optional	
A	goto	1439,31.251,87.419
A	accept	4733
A	link	https://youtu.be/lfQM3Q-Ag5A
S	
T	xprate	<1.5
T	optional	
A	goto	1439,31.229,85.564
A	accept	4732
S	
T	xprate	<1.5
T	optional	
A	goto	1439,31.690,83.700
A	accept	4731
S	
T	xprate	<1.5
T	optional	
A	goto	1439,32.644,80.711
A	accept	4730
S	
T	xprate	<1.5
T	optional	
A	goto	1439/1,227.35,4575.38,50,0
A	goto	1439/1,205.73,4639.130,50,0
A	goto	1439/1,129.10,4741.75,50,0
A	goto	1439/1,86.52,4839.13,50,0
A	goto	1439/1,338.70,4821.22,50,0
A	goto	1439/1,452.67,4684.98
A	complete	1003,1
A	isOnQuest	1003
A	mob	Grizzled Thistle Bear
S	
T	xprate	<1.5
A	goto	1439/1,230.69,4815.33
A	turnin	1003
A	isOnQuest	1003
S	
T	xprate	<1.5
A	goto	1439/1,-5.83,4608.570
A	turnin	993
A	accept	994
A	target	Volcor
A	isOnQuest	993
S	
T	xprate	<1.5
T	optional	
A	goto	1439/1,-5.83,4608.570
A	accept	994
A	target	Volcor
A	isQuestTurnedIn	993
S	
T	xprate	>1.59
T	optional	
T	completewith	Escaped
A	goto	1439/1,374.07,6438.20
A	accept	990
A	target	Sentinel Selarin
S	
T	xprate	>1.49
A	goto	1439/1,-5.83,4608.570
A	turnin	993
A	accept	995
A	target	Volcor
A	isOnQuest	993
S	
T	xprate	>1.49
T	optional	
T	label	Escaped
A	goto	1439/1,-5.83,4608.570
A	accept	995
A	target	Volcor
A	isQuestTurnedIn	993
S	
T	xprate	<1.5
A	goto	1439,43.594,84.489,0
A	goto	1439,42.576,82.897,0
A	goto	1439,43.594,84.489,15,0
A	goto	1439,42.576,82.897,15,0
A	goto	1439,42.004,81.688
A	complete	994,1
A	isQuestTurnedIn	993
S	
T	xprate	>1.49
A	goto	1439/1,30.85,4635.20
A	complete	995,1
A	isQuestTurnedIn	993
S	
T	xprate	>1.49
T	optional	
T	completewith	tower
A	equip	15
A	itemStat	15,QUALITY,<7
A	isOnQuest	995
S	
A	goto	1439,43.555,76.293
A	turnin	951
A	target	Onu
A	isOnQuest	951
S	
A	goto	1439,44.401,76.425
A	accept	5321
A	target	Kerlonian Evershade
A	itemcount	13536,<1
S	
A	isOnQuest	5321
A	goto	1439/1,34.78,5001.570
A	complete	5321,1
A	itemcount	13536,<1
S	
T	label	AshenStart
T	completewith	tower
A	zone	Ashenvale
A	goto	1440/1,-12.70,4150.17
S	
T	sticky	
T	completewith	Kerlonian
A	collect	1015,10
A	mob	Ghostpaw Runner
S	
T	label	Kerlonian
A	goto	1440/1,128.01,3305.31
A	use	13536
A	complete	5321,2
A	isOnQuest	5321
S	
A	target	Liladris Moonriver
A	goto	1440/1,128.01,3305.31
A	turnin	5321
A	isQuestComplete	5321
S	
T	label	tower
A	target	Delgren the Purifier
A	goto	1440/1,189.71,3185.77
A	turnin	967
S	
T	xprate	<1.5
A	target	Delgren the Purifier
A	goto	1440/1,189.71,3185.77
A	accept	970
S	
A	target	Orendil Broadleaf
A	goto	1440/1,175.87,3189.61
A	accept	1010
A	xp	<20,1
S	
T	xprate	<1.5
A	goto	1440/1,-102.08,3492.890
A	complete	970,1
A	mob	Dark Strand Cultist
A	mob	Dark Strand Adept
A	mob	Dark Strand Enforcer
A	mob	Dark Strand Excavator
S	
A	goto	1440/1,-203.58,3849.97,50,0
A	goto	1440/1,-2.90,3737.73,40,0
A	goto	1440/1,-138.99,3806.92
A	complete	1010,1
A	isOnQuest	1010
S	
A	goto	1440/1,-102.08,3492.890
A	xp	20-1650
A	mob	Dark Strand Cultist
A	mob	Dark Strand Adept
A	mob	Dark Strand Enforcer
A	mob	Dark Strand Excavator
S	
T	xprate	<1.5
A	target	Delgren the Purifier
A	goto	1440/1,189.71,3185.77
A	turnin	970
S	
A	goto	1440/1,-138.99,3806.92
A	xp	20
S	
A	target	Orendil Broadleaf
A	goto	1440/1,175.87,3189.61
A	accept	1010
S	
A	goto	1440/1,-203.58,3849.97,50,0
A	goto	1440/1,-2.90,3737.73,40,0
A	goto	1440/1,-138.99,3806.92
A	complete	1010,1
A	isOnQuest	1010
S	
A	target	Orendil Broadleaf
A	goto	1440/1,175.87,3189.61
A	turnin	1010
A	accept	1020
S	
T	xprate	<1.5
A	goto	1440/1,189.71,3185.77
A	turnin	970
A	accept	973
A	target	Delgren the Purifier
S	
T	sticky	
T	completewith	Astranaar
A	collect	1015,10
A	mob	Ghostpaw Runner
S	
A	target	Therysil
A	goto	1440/1,394.43,2677.63
A	turnin	945
A	isQuestComplete	945
S	Hunter
T	xprate	<1.59
A	goto	1440/1,522.900,2716.100,30
S	
T	xprate	<1.59
T	completewith	Astranaar
A	collect	2251,6,93,1
S	Hunter
T	xprate	<1.59
T	sticky	
A	goto	1440/1,663.38,2365.17
A	trainer	
A	target	Bolyun
S	Hunter
T	xprate	<1.59
A	goto	Ashenvale,18.010,59.832
A	trainer	
A	train	5118
A	target	Alenndaar Lapidaar
S	
T	label	Astranaar
A	goto	1440/1,-283.73,2827.920
A	fp	Astranaar
A	target	Daelyshia
S	
A	target	Shindrell Swiftfire
A	goto	1440/1,-299.30,2796.01
A	accept	1008
S	
T	xprate	<1.59
A	target	Sentinel Thenysil
A	goto	1440/1,-311.99,2759.11
A	accept	1070
S	
T	xprate	<1.59
A	target	Faldreas Goeth'Shael
A	goto	1440/1,-362.16,2785.640
A	accept	1056
S	
T	xprate	<1.59
A	target	Raene Wolfrunner
A	goto	1440/1,-411.18,2767.19
A	accept	991
A	accept	1054
S	
T	label	HCHunterNoHS --hidden step for #include
S	!Dwarf/!Hunter
T	xprate	<1.59
A	goto	1440/1,-433.09,2781.02
A	home	
A	target	Innkeeper Kimlya
S	
T	label	HCHunterNoHSStart --hidden step for #include
S	
T	xprate	<1.59
A	goto	1440/1,-410.60,2758.73
A	vendor	
A	target	Maliynn
S	
T	xprate	<1.59
A	goto	1440/1,-454.43,2682.24
A	target	Pelturas Whitemoon
A	turnin	1020
A	timer	24,Orendil's Cure RP
A	accept	1033
S	Hunter
T	xprate	<1.59
A	goto	1440/1,-306.80,2720.29
A	vendor	
A	target	Haljan Oakheart
S	
T	xprate	<1.59
T	completewith	ElunesTear
A	collect	2251,6,93,1
S	
T	xprate	<1.59
A	goto	1440/1,-974.00,2890.19
A	complete	1033,1
S	
T	xprate	<1.59
T	label	ElunesTear
A	goto	1440/1,-454.43,2682.24
A	target	Pelturas Whitemoon
A	turnin	1033
A	timer	17,Elune's Tear RP
A	accept	1034
S	
T	xprate	<1.59
A	goto	1440/1,-220.3,2067.24
A	complete	1034,1
S	
T	xprate	<1.59
T	completewith	next
A	goto	1440/1,-126.30,2203.69,15
A	goto	1440/1,-99.78,2305.170,15
S	
T	xprate	<1.59
T	completewith	next
A	goto	1440/1,114.17,2337.45,8
S	
T	xprate	<1.5
A	goto	1440/1,242.76,2340.53
A	complete	973,1
A	link	https://youtu.be/03nTrdcQiKY
A	isOnQuest	973
A	mob	Ilkrud Magthrull
S	
T	xprate	<1.5
A	isQuestComplete	973
A	goto	1440/1,189.71,3185.77
A	target	Delgren the Purifier
A	turnin	973
S	
T	label	HCHunterEnd --hidden step for #include
S	
T	xprate	<1.59
T	sticky	
T	completewith	StatuetteStart
A	collect	2251,6,93,1
S	
T	sticky	
T	completewith	StatuetteStart
A	collect	1015,10
A	mob	Ghostpaw Runner
S	
T	label	StatuetteStart
T	xprate	<1.59
A	target	Talen
A	goto	1440/1,847.11,3470.21
A	accept	1007
S	
T	xprate	<1.59
T	completewith	nagas
A	mob	Wrathtail Wave Rider
A	mob	Wrathtail Sorceress
A	complete	1008,1
S	
T	xprate	<1.59
A	goto	1440/1,881.13,3879.57
A	complete	1007,1
S	
T	xprate	<1.59
A	target	Talen
A	goto	1440/1,847.11,3470.21
A	turnin	1007
A	timer	22,The Ancient Statuette RP
A	accept	1009
S	
T	xprate	<1.59
A	goto	1440/1,1323.55,4159.35
A	link	https://www.youtube.com/watch?v=H-IwZ6P-ldY
A	unitscan	Lady Vespia
A	mob	Ruuzel
A	complete	1009,1
A	skill	engineering,<1,1
S	
T	xprate	<1.59
T	label	nagas
A	goto	1440/1,1323.55,4159.35
A	unitscan	Lady Vespia
A	mob	Ruuzel
A	complete	1009,1
S	
T	xprate	<1.59
A	goto	1440/1,1296.33,4088.67,0
A	goto	1440/1,866.14,4013.71,0
A	goto	1440/1,843.07,3863.42,0
A	goto	1440/1,942.84,3710.83,0
A	goto	1440/1,1072.01,3518.64,0
A	goto	1440/1,1296.33,4088.67,70,0
A	goto	1440/1,866.14,4013.71,70,0
A	goto	1440/1,843.07,3863.42,70,0
A	goto	1440/1,942.84,3710.83,70,0
A	goto	1440/1,1072.01,3518.64,70,0
A	goto	1440/1,942.84,3710.83,70,0
A	goto	1440/1,843.07,3863.42,70,0
A	goto	1440/1,866.14,4013.71,70,0
A	mob	Wrathtail Wave Rider
A	mob	Wrathtail Sorceress
A	mob	Wrathtail Myrmidon
A	mob	Wrathtail Priestess
A	mob	Wrathtail Razortail
A	mob	Wrathtail Sea Witch
A	complete	1008,1
S	
T	xprate	<1.59
A	target	Talen
A	goto	1440/1,847.11,3470.21
A	turnin	1009
S	
T	xprate	<1.59
T	sticky	
T	completewith	SoulGemStart
A	collect	2251,6,93,1
S	
T	sticky	
T	completewith	SoulGemStart
A	collect	1015,10
A	mob	Ghostpaw Runner
S	
T	label	SoulGemStart
T	xprate	<1.59
A	target	Teronis' Corpse
A	goto	1440/1,528.79,3045.86
A	turnin	991
A	accept	1023
S	
T	sticky	
T	completewith	GlowingGem
A	collect	1468,8
S	
T	label	GlowingGem
T	xprate	<1.59
A	goto	1440/1,523.02,2988.59,50,0
A	goto	1440/1,579.54,3055.08,50,0
A	goto	1440/1,488.42,3073.53,50,0
A	goto	1440/1,528.79,3045.86
A	mob	Saltspittle Warrior
A	mob	Saltspittle Muckdweller
A	mob	Saltspittle Oracle
A	mob	Saltspittle Puddlejumper
A	complete	1023,1
S	Dwarf Hunter
T	xprate	<1.59
A	hs	
S	!Dwarf/!Hunter
T	xprate	<1.59
T	softcore	
T	completewith	next
A	deathskip	
S	!Dwarf/!Hunter
T	xprate	<1.59
T	hardcore	
T	completewith	next
A	goto	1440/1,-283.73,2827.92,200
S	!Dwarf/!Hunter
T	xprate	<1.59
A	goto	1440/1,-284.31,2828.69
A	fly	Darkshore
A	target	Daelyshia
S	
T	xprate	<1.59
A	goto	1439/1,489.35,6506.76
A	turnin	731
A	accept	741
A	target	Archaeologist Hollee
S	
T	xprate	<1.59
T	completewith	end
A	vendor	
S	
T	xprate	<1.59
A	goto	1439,39.373,43.483
A	turnin	995
A	target	Terenthis
A	isOnQuest	995
S	
T	xprate	<1.59
A	goto	1439,39.373,43.483
A	turnin	994
A	target	Terenthis
A	isOnQuest	994
S	
T	xprate	<1.59
A	goto	1439,36.621,45.596
A	turnin	4730
A	turnin	4731
A	turnin	4732
A	turnin	4733
A	target	Gwennyth Bly'Leggonde
S	
T	xprate	<1.59
A	goto	1439/1,561.66,6343.27
A	fly	Teldrassil
A	target	Caylais Moonfeather
S	
T	xprate	<1.59
T	optional	
T	completewith	next
A	goto	1438/1,968.90,8795.34
A	zone	Darnassus
S	Hunter
A	goto	1457/1,2511.04,10178.01
A	target	Jocaste
A	trainer	
A	xp	<22,1
S	
T	xprate	<1.59
A	goto	1457/1,2515.03,9940.50
A	bankdeposit	5996,1468,2251,1015
A	target	Garryeth
S	Dwarf Hunter
T	xprate	<1.59
A	skipgossip	11866,1
A	goto	1457/1,2329.19,9908.60
A	train	264
A	train	227
A	target	Ilyenia Moonfire
A	dungeon	DM
S	
T	xprate	<1.59
A	target	Chief Archaeologist Greywhisker
A	goto	1438/1,2607.86,9641.94
A	turnin	741
A	accept	942
A	isOnQuest	741
S	
T	optional	
T	xprate	<1.59
A	target	Chief Archaeologist Greywhisker
A	goto	1438/1,2607.86,9641.94
A	accept	942
A	isQuestTurnedIn	741
S	!Dwarf/!Hunter
T	xprate	<1.59
T	label	end
A	hs	
S	Dwarf Hunter
T	xprate	<1.59
A	goto	1457/1,2626.51,9946.11
A	zone	Teldrassil
A	zoneskip	Ashenvale
A	zoneskip	Darkshore
S	Dwarf Hunter
T	xprate	<1.59
T	label	end
A	goto	1438/1,841.56,8640.79
A	fly	Ashenvale
A	target	Vesprystus
A	zoneskip	Ashenvale
E
G	Guides/forever/Alliance-11-20.lua
M	classic	
M	tbc	
M	season	0
M	version	1
M	selector	Alliance !Hunter
M	season	0
M	group	RestedXP Forever Guide (A)
M	subgroup	Speedrun Guide 1-20
M	name	20-21 Darkshore/Ashenvale
M	next	RestedXP Alliance 20-30\21-23 Stonetalon/Ashenvale;RestedXP Alliance 20-30\21-22 Ashenvale SoD
S	Druid
T	xprate	<1.59
T	completewith	next
A	cast	18960
A	zoneskip	Moonglade
S	Druid
T	xprate	<1.59
A	goto	1450/1,-2593.82,7867.06
A	trainer	
A	target	Loganaar
S	
T	xprate	<1.59
T	optional	
T	completewith	TheryluneE
A	hs	
S	
A	goto	1439/1,504.41,6402.39
A	accept	4740
S	
A	goto	1439,37.322,43.640
A	accept	948
A	target	Barithras Moonshade
S	
A	goto	1439/1,489.35,6506.76
A	accept	729
A	target	Archaeologist Hollee
S	
T	xprate	<1.59
A	goto	1439,38.325,43.039
A	turnin	3765
A	target	Gershala Nightwhisper
A	isOnQuest	3765
S	
T	xprate	>1.59
A	goto	1439,38.325,43.039
A	turnin	3765
A	target	Gershala Nightwhisper
A	isOnQuest	3765
A	dungeon	!DM << NightElf Warrior/Mage/Warlock/Rogue
S	
A	goto	1439,39.373,43.483
A	accept	993
A	target	Terenthis
A	isQuestTurnedIn	986
S	
T	optional	
T	completewith	OnuGrove
A	equip	15,5387
A	itemcount	5387,1
A	itemStat	15,QUALITY,<7
S	
T	xprate	<1.5 --<< !NightElf/Hunter
T	completewith	MasterG
T	optional	
A	goto	1439/1,306.60,4784.11,0
A	complete	1003,1
A	isOnQuest	1003
A	mob	Grizzled Thistle Bear
S	
T	optional	
T	completewith	OnuGrove
A	goto	1439,43.555,76.293,80
S	
T	xprate	>1.49
A	goto	1439,43.555,76.293
A	turnin	951
A	target	Onu
A	isQuestComplete	951
S	
T	xprate	>1.49
T	label	OnuGrove
T	optional	
A	goto	1439,43.555,76.293
A	turnin	948
A	target	Onu
A	isOnQuest	948
S	
T	xprate	>1.49
A	goto	1439/1,-5.83,4608.570
A	turnin	993
A	accept	995
A	timer	20,Escape Through Stealth RP
A	target	Volcor
A	isOnQuest	993
S	
T	xprate	>1.49
T	optional	
A	goto	1439/1,-5.83,4608.570
A	accept	995
A	timer	20,Escape Through Stealth RP
A	target	Volcor
A	isQuestTurnedIn	993
S	
T	xprate	>1.49
A	goto	1439/1,30.85,4635.20
A	complete	995,1
A	isOnQuest	995
S	
T	xprate	>1.49
T	optional	
T	completewith	Murkdeep
A	equip	15
A	itemStat	15,QUALITY,<7
A	isOnQuest	995
S	
T	xprate	<1.5
T	label	OnuGrove
A	goto	1439,43.555,76.293
A	turnin	952
A	turnin	948
A	accept	944
A	target	Onu
S	
T	xprate	<1.5
T	label	MasterG
A	goto	1439/1,417.30,4575.82,100
A	subzoneskip	449
A	isOnQuest	944
S	
T	optional	
T	completewith	TheryluneEnd
A	collect	5352,1,968,1
A	mob	Twilight Disciple
A	mob	Twilight Thug
S	
T	xprate	<1.5
T	optional	
A	goto	1439/1,417.30,4575.82
A	complete	944,1
S	
T	xprate	<1.5
T	completewith	next
A	cast	5809
A	use	5251
S	
T	xprate	<1.5
A	goto	1439/1,417.30,4575.82
A	turnin	944
A	accept	949
A	use	5251
S	
T	xprate	<1.5
A	goto	1439,38.537,86.050
A	turnin	949
A	accept	950
S	
A	goto	1439,38.660,87.305
A	accept	945
A	target	Therylune
S	
T	label	TheryluneEnd
A	goto	1439/1,288.26,4530.40
A	complete	945,1
A	isOnQuest	945
S	
T	xprate	<1.5 --<< !NightElf/Hunter
T	completewith	prospectorEscort
T	optional	
A	goto	1439/1,306.60,4784.11,0
A	complete	1003,1
A	isOnQuest	1003
A	mob	Grizzled Thistle Bear
S	
T	sticky	
T	label	prospector
A	goto	1439,35.724,83.696
A	turnin	729
A	target	Prospector Remtravel
A	isOnQuest	729
S	
T	label	prospectorEscort
A	goto	1439/1,602.01,4678.87
A	accept	731,1
A	link	https://www.youtube.com/watch?v=crQAvyRIceU
A	target	Prospector Remtravel
A	isQuestAvailable	731
S	
T	requires	prospector
A	link	https://www.youtube.com/watch?v=crQAvyRIceU
A	complete	731,1
A	isOnQuest	731
S	
T	xprate	<1.5
T	optional	
T	completewith	Murkdeep
A	complete	1138,1
A	mob	Encrusted Tide Crawler
A	mob	Reef Crawler
S	
T	xprate	>1.49
T	optional	
T	completewith	next
A	complete	1138,1
A	mob	Encrusted Tide Crawler
A	mob	Reef Crawler
S	
T	xprate	>1.49
A	goto	1439,32.644,80.711
A	accept	4730
S	
T	xprate	>1.49
T	optional	
T	completewith	next
A	complete	1138,1
A	mob	Encrusted Tide Crawler
S	
T	xprate	>1.49
A	goto	1439,31.690,83.700
A	accept	4731
S	
T	xprate	>1.49
T	loop	
A	goto	1439,32.674,81.752,0
A	goto	1439,36.327,73.408,0
A	goto	1439,35.195,71.864,0
A	goto	1439,32.674,81.752,60,0
A	goto	1439,33.284,80.330,60,0
A	goto	1439,34.174,80.488,60,0
A	goto	1439,35.432,79.052,60,0
A	goto	1439,36.327,73.408,60,0
A	goto	1439,35.412,73.176,60,0
A	goto	1439,35.033,72.432,60,0
A	goto	1439,35.195,71.864,60,0
A	complete	1138,1
A	mob	Encrusted Tide Crawler
A	mob	Reef Crawler
S	
T	xprate	>1.49
A	goto	1439,31.229,85.564
A	accept	4732
S	
A	goto	1439,31.251,87.419
A	accept	4733
A	link	https://youtu.be/lfQM3Q-Ag5A
S	
T	xprate	<1.5
A	goto	1439,31.229,85.564
A	accept	4732
S	
T	xprate	<1.5
T	optional	
A	goto	1439,31.690,83.700
A	accept	4731
S	
T	xprate	<1.5
T	optional	
A	goto	1439,32.644,80.711
A	accept	4730
S	
T	xprate	<1.5
T	optional	
T	label	Murkdeep
A	goto	1439,35.429,76.566,0
A	goto	1439,35.429,76.566,60,0
A	goto	1439/1,541.75,4991.52
A	complete	4740,1
A	unitscan	Murkdeep
A	mob	Greymist Warrior
A	mob	Greymist Hunter
A	mob	Greymist Coastrunner
S	
T	xprate	<1.5
T	loop	
A	goto	1439,32.674,81.752,0
A	goto	1439,36.327,73.408,0
A	goto	1439,35.195,71.864,0
A	goto	1439,32.674,81.752,60,0
A	goto	1439,33.284,80.330,60,0
A	goto	1439,34.174,80.488,60,0
A	goto	1439,35.432,79.052,60,0
A	goto	1439,36.327,73.408,60,0
A	goto	1439,35.412,73.176,60,0
A	goto	1439,35.033,72.432,60,0
A	goto	1439,35.195,71.864,60,0
A	complete	1138,1
A	mob	Encrusted Tide Crawler
A	mob	Reef Crawler
S	
T	xprate	<1.5 --<< !NightElf/Hunter
T	optional	
A	goto	1439/1,227.35,4575.38,50,0
A	goto	1439/1,205.73,4639.130,50,0
A	goto	1439/1,129.10,4741.75,50,0
A	goto	1439/1,86.52,4839.13,50,0
A	goto	1439/1,338.70,4821.22,50,0
A	goto	1439/1,452.67,4684.98
A	complete	1003,1
A	isOnQuest	1003
A	mob	Grizzled Thistle Bear
S	
T	xprate	<1.5 --<< !NightElf/Hunter
A	goto	1439/1,230.69,4815.33
A	turnin	1003
A	isOnQuest	1003
S	
T	xprate	<1.5
A	goto	1439,43.555,76.293
A	turnin	951
A	target	Onu
A	isQuestComplete	951
S	
T	xprate	<1.5
A	goto	1439,43.555,76.293
A	turnin	950
A	target	Onu
S	
T	xprate	<1.5
A	goto	1439,44.401,76.425
A	accept	5321
A	target	Kerlonian Evershade
S	
T	xprate	<1.5
A	goto	1439/1,34.78,5001.570
A	complete	5321,1
A	isOnQuest	5321
S	
T	xprate	<1.5
T	completewith	volcorEnd
A	goto	1440/1,128.01,3305.31
A	use	13536
A	isOnQuest	5321
S	
T	xprate	<1.5
T	completewith	next
A	goto	1439/1,-5.83,4608.57,30
A	isOnQuest	993
S	
T	xprate	<1.5
A	goto	1439/1,-5.83,4608.570
A	turnin	993
A	accept	995
A	timer	20,Escape Through Stealth RP
A	target	Volcor
S	
T	xprate	<1.5
T	label	volcorEnd
A	goto	1439/1,30.85,4635.20
A	complete	995,1
A	isOnQuest	995
S	
T	xprate	>1.49
T	completewith	tower
A	zone	Ashenvale
A	goto	1440/1,213.93,4113.65
S	
T	xprate	<1.50
T	completewith	tower
A	zone	Ashenvale
A	goto	1440/1,-12.70,4150.17
S	
T	xprate	<1.5
A	goto	1440/1,128.01,3305.31
A	use	13536
A	complete	5321,2
A	isOnQuest	5321
S	
T	xprate	<1.5
A	target	Liladris Moonriver
A	goto	1440/1,128.01,3305.31
A	turnin	5321
A	isQuestComplete	5321
S	!Warlock
T	season	0,1 << Paladin
T	xprate	>1.49
T	label	tower
A	goto	1440/1,189.71,3185.77
A	turnin	967
A	target	Delgren the Purifier
S	
T	season	0,1 << Paladin
T	xprate	<1.5 << !Warlock
T	label	tower
A	goto	1440/1,189.71,3185.77
A	turnin	967
A	accept	970
A	target	Delgren the Purifier
S	
T	xprate	<1.59
T	optional	
A	target	Orendil Broadleaf
A	goto	1440/1,175.87,3189.61
A	accept	1010
A	xp	<20,1
S	
T	xprate	<1.5
A	goto	1440/1,-102.08,3492.890
A	complete	970,1
A	mob	Dark Strand Cultist
A	mob	Dark Strand Adept
S	
A	goto	1440/1,-102.08,3492.890
A	xp	20-1650
A	mob	Dark Strand Cultist
A	mob	Dark Strand Adept
A	mob	Dark Strand Enforcer
A	mob	Dark Strand Excavator
S	
T	xprate	<1.59
T	optional	
A	goto	1440/1,-203.58,3849.97,50,0
A	goto	1440/1,-2.90,3737.73,40,0
A	goto	1440/1,-138.99,3806.92
A	complete	1010,1
A	isOnQuest	1010
A	skill	herbalism,<1,1
S	
T	xprate	<1.59
T	optional	
A	goto	1440/1,-203.58,3849.97,50,0
A	goto	1440/1,-2.90,3737.73,40,0
A	goto	1440/1,-138.99,3806.92
A	complete	1010,1
A	isOnQuest	1010
A	skill	herbalism,1,1
S	
T	xprate	<1.59
T	optional	
A	goto	1440/1,175.87,3189.61
A	turnin	1010
A	accept	1020
A	target	Orendil Broadleaf
A	isQuestComplete	1010
S	
T	optional	
T	xprate	<1.59
A	goto	1440/1,175.87,3189.61
A	accept	1020
A	target	Orendil Broadleaf
A	isQuestTurnedIn	1010
S	
T	xprate	<1.5
A	target	Delgren the Purifier
A	goto	1440/1,189.71,3185.77
A	turnin	970
A	accept	973
S	
T	xprate	<1.59
A	goto	1440/1,-138.99,3806.92
A	xp	20
S	
A	goto	1440/1,175.87,3189.61
A	accept	1010
A	target	Orendil Broadleaf
S	
T	optional	
A	goto	1440/1,-203.58,3849.97,50,0
A	goto	1440/1,-2.90,3737.73,40,0
A	goto	1440/1,-138.99,3806.92
A	complete	1010,1
A	skill	herbalism,<1,1
S	
A	goto	1440/1,-203.58,3849.97,50,0
A	goto	1440/1,-2.90,3737.73,40,0
A	goto	1440/1,-138.99,3806.92
A	complete	1010,1
A	skill	herbalism,1,1
S	
A	goto	1440/1,175.87,3189.61
A	turnin	1010
A	accept	1020
A	target	Orendil Broadleaf
S	
T	xprate	>1.59
A	target	Therysil
A	goto	1440/1,394.43,2677.63
A	turnin	945
A	isQuestComplete	945
S	
T	optional	
T	completewith	TZS
A	subzone	415
S	
T	label	AshenvaleEnd
A	goto	1440/1,-283.73,2827.920
A	fp	Astranaar
A	target	Daelyshia
S	
T	label	TZS
A	goto	1440/1,-299.30,2796.01
A	accept	1008
A	target	Shindrell Swiftfire
S	
T	xprate	<1.59
A	goto	1440/1,-311.99,2759.11
A	accept	1070
A	target	Sentinel Thenysil
S	
T	xprate	<1.59
A	goto	1440/1,-362.16,2785.640
A	accept	1056
A	target	Faldreas Goeth'Shael
S	
T	xprate	<1.59
A	goto	1440/1,-411.18,2767.19
A	accept	991
A	accept	1054
A	target	Raene Wolfrunner
S	!Warlock
T	xprate	<1.59
A	goto	1440/1,-433.09,2781.02
A	home	415
A	target	Innkeeper Kimlya
S	
T	xprate	<1.59
A	goto	1440/1,-454.43,2682.24
A	target	Pelturas Whitemoon
A	turnin	1020
A	timer	24,Orendil's Cure RP
A	accept	1033
E
G	Guides/forever/Horde-01-12_Durotar.lua
M	classic	
M	tbc	
M	xprate	<1.99
M	selector	Horde
M	name	1-6 Durotar
M	version	11
M	group	RestedXP Forever Guide (H)
M	subgroup	Speedrun Guide 1-22
M	defaultfor	Troll/Orc
M	next	6-10 Durotar
S	!Orc !Troll
T	completewith	next
S	!Troll Mage
T	season	2
T	completewith	next
S	
A	goto	1411/1,-4251.46,-607.35
A	accept	4641
A	target	Kaltunk
S	Warrior/Shaman/Warlock
T	completewith	next
A	goto	1411/1,-4281.07,-720.15,30,0 << Warlock
A	goto	1411/1,-4299.05,-494.9,30,0 << Warrior/Shaman
A	mob	Mottled Boar
A	money	>0.01
S	Warlock
A	goto	1411/1,-4214.45,-623.92.00
A	accept	1485
A	target	Ruzan
S	Warrior/Shaman
A	goto	1411/1,-4214.45,-565.75
A	vendor	
A	target	Duokna
A	money	>0.01
S	
A	goto	1411/1,-4198.05,-605.59,12,0 << !Warrior !Shaman
A	goto	1411/1,-4198.58,-602.41,12,0 << Warrior/Shaman
A	goto	1411/1,-4186.42,-599.95
A	turnin	4641
A	accept	788
A	accept	97279
A	target	Gornek
S	Warrior/Shaman
A	goto	1411/1,-4198.05,-605.59,10,0
A	goto	1411/1,-4230.31,-639.43 << Warrior
A	goto	1411/1,-4203.87,-623.92 << Shaman
A	train	6673
A	train	8017
A	target	Frang << Warrior
A	target	Shikrik << Shaman
S	Warlock
T	softcore	
T	completewith	Nartok
A	goto	1411/1,-4157.87,-601.36,12,0
A	goto	1411/1,-4143.06,-594.31,12,0
A	goto	1411/1,-4120.86,-589.72,12,0
A	goto	1411/1,-4111.87,-607.00,12
A	money	<0.01
S	Warlock
T	softcore	
T	completewith	next
A	goto	1411/1,-4157.87,-601.36,12,0
A	goto	1411/1,-4143.06,-594.31,12,0
A	goto	1411/1,-4120.86,-589.72,12,0
A	goto	1411/1,-4107.11,-604.18,12
A	money	>0.01
S	Warlock
T	hardcore	
T	completewith	next
A	goto	1411/1,-4157.87,-601.36,12,0
A	goto	1411/1,-4143.06,-594.31,12,0
A	goto	1411/1,-4120.86,-589.72,12,0
A	goto	1411/1,-4107.11,-604.18,12
S	Warlock
T	softcore	
A	goto	1411/1,-4107.11,-604.18
A	vendor	
A	target	Hraug
A	money	>0.01
S	Warlock
T	hardcore	
A	goto	1411/1,-4107.11,-604.18
A	vendor	
A	target	Hraug
S	Warlock
T	season	2
T	label	Nartok
A	goto	1411/1,-4111.87,-607.00
A	accept	77586
A	train	348
A	target	Nartok
S	Warlock
T	season	0
T	label	Nartok
A	goto	1411/1,-4111.87,-607.00
A	train	348
A	target	Nartok
S	!Warrior !Rogue
T	softcore	
A	goto	1411/1,-4214.45,-565.40
A	collect	159,30,6394,1 << !Hunter !Shaman
A	collect	2512,1000,6394,1 << Hunter
A	target	Duokna
A	money	<0.015 << !Hunter
A	money	<0.0040 << Hunter
S	Warlock
A	goto	1411/1,-4214.45,-565.40
A	collect	159,5,6394,1
A	target	Duokna
A	money	<0.0025
S	
T	completewith	Boars
A	complete	97279,1
S	Warlock
T	completewith	next
A	goto	1411/1,-4266.26,-563.29,25,0
A	complete	788,1
A	mob	Mottled Boar
S	Warlock
A	goto	1411/1,-4357.74,-180.47,100
A	isOnQuest	1485
S	Warlock
T	loop	
A	goto	1411/1,-4282.13,-250.97,0
A	goto	1411/1,-4282.13,-250.97,40,0
A	goto	1411/1,-4317.02,-258.02,40,0
A	goto	1411/1,-4351.39,-250.97,40,0
A	goto	1411/1,-4385.76,-256.96,40,0
A	goto	1411/1,-4383.65,-216.07,40,0
A	goto	1411/1,-4419.07,-221.01,40,0
A	goto	1411/1,-4457.67,-205.15,40,0
A	goto	1411/1,-4405.85,-189.99,40,0
A	goto	1411/1,-4409.55,-169.54,40,0
A	goto	1411/1,-4376.24,-197.390,40,0
A	goto	1411/1,-4360.38,-176.95,40,0
A	goto	1411/1,-4329.71,-196.33,40,0
A	goto	1411/1,-4319.67,-169.190,40,0
A	goto	1411/1,-4303.28,-186.46,40,0
A	goto	1411/1,-4281.07,-148.75,40,0
A	complete	1485,1
A	mob	Vile Familiar
S	
T	completewith	Sarkoth
A	goto	1411/1,-4266.26,-563.29,35,0 << !Warlock
A	goto	1411/1,-4283.18,-512.53,45,0 << !Warlock
A	complete	788,1
A	mob	Mottled Boar
S	
A	goto	1411/1,-4108.70,-397.96
A	accept	790
A	target	Hana'zua
S	
T	season	2
T	label	Sarkoth
A	goto	1411/1,-4109.22,-546.370
A	complete	790,1
A	mob	Sarkoth
S	
T	season	0
T	label	Sarkoth
A	goto	1411/1,-4109.22,-546.370
A	complete	790,1
A	mob	Sarkoth
S	
A	goto	1411/1,-4108.70,-397.96
A	turnin	790
A	accept	804
A	target	Hana'zua
S	
T	loop	
A	goto	1411/1,-4146.24,-483.97,0
A	goto	1411/1,-4146.24,-483.97,40,0
A	goto	1411/1,-4179.02,-473.75,40,0
A	goto	1411/1,-4218.15,-480.10,40,0
A	goto	1411/1,-4252.52,-483.62,40,0
A	goto	1411/1,-4283.71,-516.76,40,0
A	goto	1411/1,-4317.55,-516.76,40,0
A	goto	1411/1,-4350.33,-510.06,40,0
A	goto	1411/1,-4379.94,-515.70,40,0
A	goto	1411/1,-4379.94,-484.33,40,0
A	goto	1411/1,-4352.98,-445.90,40,0
A	goto	1411/1,-4385.76,-412.77,40,0
A	goto	1411/1,-4384.70,-383.16,40,0
A	goto	1411/1,-4383.12,-346.85,40,0
A	goto	1411/1,-4349.81,-313.720,40,0
A	goto	1411/1,-4315.44,-287.28,40,0
A	goto	1411/1,-4281.60,-321.82,40,0
A	goto	1411/1,-4239.83,-315.13,40,0
A	goto	1411/1,-4213.92,-309.84,40,0
A	goto	1411/1,-4184.31,-348.61,40,0
A	goto	1411/1,-4184.31,-382.45,40,0
A	goto	1411/1,-4183.25,-409.6,40,0
A	goto	1411/1,-4182.72,-448.72,40,0
A	complete	788,1
A	mob	Mottled Boar
S	Warlock/Warrior/Shaman/Hunter
T	xprate	>1.49
T	loop	
A	goto	1411/1,-4146.24,-483.97,0
A	goto	1411/1,-4146.24,-483.97,40,0
A	goto	1411/1,-4179.02,-473.75,40,0
A	goto	1411/1,-4218.15,-480.10,40,0
A	goto	1411/1,-4252.52,-483.62,40,0
A	goto	1411/1,-4283.71,-516.76,40,0
A	goto	1411/1,-4317.55,-516.76,40,0
A	goto	1411/1,-4350.33,-510.06,40,0
A	goto	1411/1,-4379.94,-515.70,40,0
A	goto	1411/1,-4379.94,-484.33,40,0
A	goto	1411/1,-4352.98,-445.90,40,0
A	goto	1411/1,-4385.76,-412.77,40,0
A	goto	1411/1,-4384.70,-383.16,40,0
A	goto	1411/1,-4383.12,-346.85,40,0
A	goto	1411/1,-4349.81,-313.720,40,0
A	goto	1411/1,-4315.44,-287.28,40,0
A	goto	1411/1,-4281.60,-321.82,40,0
A	goto	1411/1,-4239.83,-315.13,40,0
A	goto	1411/1,-4213.92,-309.84,40,0
A	goto	1411/1,-4184.31,-348.61,40,0
A	goto	1411/1,-4184.31,-382.45,40,0
A	goto	1411/1,-4183.25,-409.6,40,0
A	goto	1411/1,-4182.72,-448.72,40,0
A	xp	3+325
A	xp	3+925
A	mob	Mottled Boar
S	Warlock
T	xprate	<1.5
T	loop	
A	goto	1411/1,-4146.24,-483.97,0
A	goto	1411/1,-4146.24,-483.97,40,0
A	goto	1411/1,-4179.02,-473.75,40,0
A	goto	1411/1,-4218.15,-480.10,40,0
A	goto	1411/1,-4252.52,-483.62,40,0
A	goto	1411/1,-4283.71,-516.76,40,0
A	goto	1411/1,-4317.55,-516.76,40,0
A	goto	1411/1,-4350.33,-510.06,40,0
A	goto	1411/1,-4379.94,-515.70,40,0
A	goto	1411/1,-4379.94,-484.33,40,0
A	goto	1411/1,-4352.98,-445.90,40,0
A	goto	1411/1,-4385.76,-412.77,40,0
A	goto	1411/1,-4384.70,-383.16,40,0
A	goto	1411/1,-4383.12,-346.85,40,0
A	goto	1411/1,-4349.81,-313.720,40,0
A	goto	1411/1,-4315.44,-287.28,40,0
A	goto	1411/1,-4281.60,-321.82,40,0
A	goto	1411/1,-4239.83,-315.13,40,0
A	goto	1411/1,-4213.92,-309.84,40,0
A	goto	1411/1,-4184.31,-348.61,40,0
A	goto	1411/1,-4184.31,-382.45,40,0
A	goto	1411/1,-4183.25,-409.6,40,0
A	goto	1411/1,-4182.72,-448.72,40,0
A	xp	3+685
A	mob	Mottled Boar
S	
T	optional	
T	label	Boars
S	
A	goto	1411/1,-4260.000,-404.200
A	complete	97279,1
S	Warlock
T	xprate	<1.5
T	completewith	Ruzan2
A	mob	Mottled Boar
A	money	>0.01
S	Warlock/Warrior/Shaman/Hunter
T	xprate	>1.49
T	completewith	Ruzan2
A	mob	Mottled Boar
A	money	>0.02 << Warrior
A	money	>0.0175 << Warlock
A	money	>0.011 << Hunter
A	money	>0.01 << Shaman
S	Rogue
T	label	Duokna2
A	goto	1411/1,-4214.45,-565.40
A	vendor	
A	target	Duokna
S	Warlock
T	label	Ruzan2
A	goto	1411/1,-4214.45,-623.92.00
A	turnin	1485
A	accept	1499
A	target	Ruzan
S	Warlock
T	completewith	Gornek2
A	cast	688
S	Warlock
A	goto	1411/1,-4228.19,-629.20
A	turnin	1499
A	accept	794
A	target	Zureetha Fargaze
S	
T	label	Gornek2
A	goto	1411/1,-4198.05,-605.59,12,0 << Warlock
A	goto	1411/1,-4198.58,-602.41,12,0 << !Warlock
A	goto	1411/1,-4186.42,-599.95
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
T	season	0
T	completewith	Rwag
A	goto	1411/1,-4157.87,-601.36,12,0
A	goto	1411/1,-4144.65,-588.67,12
S	Rogue
T	season	0
A	goto	1411/1,-4144.65,-588.67
A	turnin	3083
A	turnin	3088
A	train	53
A	target	Rwag
A	money	<0.04
A	xp	<4,1
S	Rogue
T	season	0
T	label	Rwag
A	goto	1411/1,-4144.65,-588.67
A	turnin	3083
A	turnin	3088
A	target	Rwag
S	
A	goto	1411/1,-4102.400,-588.900
A	turnin	97279
A	target	Kzan Thornslash
S	Rogue/Warrior
A	goto	1411/1,-4106.000,-593.400
A	train	2575
A	collect	2901,1,792,1
A	target	Norzsh
S	Warlock
A	goto	1411/1,-4107.11,-604.18
A	vendor	
A	target	Hraug
A	money	>0.01
S	Warlock
T	season	2
T	label	Nartok2
A	goto	1411/1,-4111.87,-607.00
A	turnin	3090
A	accept	77586
A	target	Nartok
S	Warlock
T	season	0
T	label	Nartok2
A	goto	1411/1,-4111.87,-607.00
A	turnin	3090
A	train	172
A	target	Nartok
S	
T	label	Galgar
A	goto	1411/1,-4221.85,-561.52,0,0
A	accept	4402
A	target	Galgar
S	!Rogue
T	xprate	<1.5
A	goto	1411/1,-4214.45,-565.40
A	collect	159,15,6394,1 << !Rogue !Warrior !Hunter !Shaman
A	collect	2512,1000,6394,1 << Hunter
A	vendor	
A	target	Duokna
A	money	>0.1 << Rogue/Warrior
A	itemcount	159,<15 << !Rogue !Warrior !Hunter !Shaman
S	!Rogue
T	xprate	>1.49
A	goto	1411/1,-4214.45,-565.40
A	collect	159,15,6394,1 << !Rogue !Warrior !Hunter !Shaman
A	collect	2512,1000,6394,1 << Hunter
A	vendor	
A	target	Duokna
A	money	<0.005 << Hunter
A	money	>0.1 << Rogue/Warrior/Shaman
A	itemcount	159,<15 << !Rogue !Warrior !Hunter !Shaman
S	Hunter
T	optional	
T	xprate	>1.49
A	goto	1411/1,-4214.45,-565.40
A	collect	2512,400,6394,1
A	vendor	
A	target	Duokna
A	money	<0.002
A	itemcount	2512,<200
S	Hunter
T	optional	
T	xprate	>1.49
A	goto	1411/1,-4214.45,-565.40
A	collect	2512,200,6394,1
A	vendor	
A	target	Duokna
A	money	<0.001
A	itemcount	2512,<200
S	Shaman
T	season	2
T	xprate	>1.49
T	requires	Galgar
A	turnin	3084
A	turnin	3089
A	accept	77587
A	accept	77585
A	train	8042
A	goto	1411/1,-4203.87,-623.92
A	accept	1516
A	goto	1411/1,-4204.4,-629.91
A	target	Shikrik
A	target	Canaga Earthcaller
S	Shaman
T	season	2
T	xprate	<1.5
T	requires	Galgar
A	goto	1411/1,-4203.87,-623.92
A	turnin	3084
A	turnin	3089
A	accept	77587
A	accept	77585
A	target	Shikrik
S	Shaman
T	season	0
T	requires	Galgar
A	goto	1411/1,-4203.87,-623.92
A	turnin	3084
A	turnin	3089
A	target	Shikrik
S	Mage
T	season	2
T	requires	Galgar
A	goto	1411/1,-4210.22,-625.33
A	turnin	3086
A	accept	77643
A	train	1459
A	target	Mai'ah
S	Mage
T	season	0
T	requires	Galgar
A	goto	1411/1,-4210.22,-625.33
A	turnin	3086
A	train	1459
A	target	Mai'ah
S	!Warlock
T	requires	Galgar
A	goto	1411/1,-4228.19,-629.20
A	accept	792
A	target	Zureetha Fargaze
S	Hunter
T	season	2
T	xprate	>1.49
A	goto	1411/1,-4227.66,-635.20
A	turnin	3082
A	turnin	3087
A	accept	77590
A	accept	77584
A	train	1978
A	target	Jen'shan
A	money	<0.01
S	Hunter
T	season	2
T	xprate	>1.49
A	goto	1411/1,-4227.66,-635.20
A	turnin	3082
A	turnin	3087
A	accept	77590
A	accept	77584
A	target	Jen'shan
S	Hunter
T	xprate	<1.5
T	season	2
A	goto	1411/1,-4227.66,-635.20
A	turnin	3082
A	turnin	3087
A	accept	77590
A	accept	77584
A	target	Jen'shan
S	Hunter
T	xprate	>1.49
T	season	0
A	goto	1411/1,-4227.66,-635.20
A	turnin	3082
A	turnin	3087
A	train	1978
A	target	Jen'shan
A	money	<0.01
S	Hunter
T	xprate	>1.49
T	season	0
A	goto	1411/1,-4227.66,-635.20
A	turnin	3082
A	turnin	3087
A	target	Jen'shan
S	Hunter
T	xprate	<1.5
T	season	0
A	goto	1411/1,-4227.66,-635.20
A	turnin	3082
A	turnin	3087
A	target	Jen'shan
S	Warrior
T	xprate	>1.49
T	season	2
A	goto	1411/1,-4230.31,-639.43
A	turnin	2383
A	turnin	3065
A	accept	77588
A	accept	77582
A	train	772
A	target	Frang
A	money	<0.01
S	Warrior
T	xprate	>1.49
T	season	2
A	goto	1411/1,-4230.31,-639.43
A	turnin	2383
A	turnin	3065
A	accept	77588
A	accept	77582
A	target	Frang
S	Warrior
T	xprate	>1.49
T	season	0
A	goto	1411/1,-4230.31,-639.43
A	turnin	2383
A	turnin	3065
A	train	772
A	target	Frang
A	money	<0.01
S	Warrior
T	xprate	>1.49
T	season	0
A	goto	1411/1,-4230.31,-639.43
A	turnin	2383
A	turnin	3065
A	target	Frang
S	Warrior
T	xprate	<1.5
T	season	2
A	goto	1411/1,-4230.31,-639.43
A	turnin	2383
A	turnin	3065
A	accept	77588
A	accept	77582
A	target	Frang
S	Warrior
T	xprate	<1.5
T	season	0
A	goto	1411/1,-4230.31,-639.43
A	turnin	2383
A	turnin	3065
A	target	Frang
S	Priest
T	season	2
A	goto	1411/1,-4202.28,-617.22
A	turnin	3085
A	accept	77642
A	target	Ken'jai
S	Shaman
A	goto	1411/1,-4102.35,-588.67.00
A	collect	2132,1,5441,1
A	money	<0.0102
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<1.9
A	target	Kzan Thornslash
S	
T	requires	Galgar << Warlock
A	goto	1411/1,-4322.31,-611.58
A	accept	5441
A	target	Foreman Thazz'ril
S	Priest
T	season	2
A	goto	1411/1,-4892.30,-759.28
A	use	205951
A	complete	77642,1
A	target	Serpent Loa
A	skipgossip	
S	Priest
T	season	2
A	goto	1411/1,-4202.28,-617.22
A	turnin	77642
A	target	Ken'jai
S	
T	completewith	Sting
A	complete	4402,1
S	
T	completewith	Tails
A	goto	1411/1,-4340.82,-628.50,20,0
A	goto	1411/1,-4375.71,-507.590,45,0
A	goto	1411/1,-4467.19,-506.53,45,0
A	complete	5441,1
A	target	Lazy Peon
A	use	16114
S	!Warlock
T	completewith	Imps
A	complete	789,1
A	mob	Scorpid Worker
S	skip --Shaman
T	season	2
T	completewith	OverloadRune
A	complete	792,1
A	mob	Vile Familiar
S	Shaman
T	season	2
T	loop	
A	goto	1411/1,-4249.87,-246.04,0
A	goto	1411/1,-4249.87,-246.04,40,0
A	goto	1411/1,-4226.08,-250.62,40,0
A	goto	1411/1,-4177.96,-248.5,40,0
A	goto	1411/1,-4181.66,-278.470,40,0
A	goto	1411/1,-4149.41,-319.00,40,0
A	goto	1411/1,-4112.40,-351.43,40,0
A	goto	1411/1,-4081.20,-354.25,40,0
A	goto	1411/1,-4046.83,-352.14,40,0
A	goto	1411/1,-4048.95,-383.16,40,0
A	goto	1411/1,-4053.71,-415.940,40,0
A	goto	1411/1,-4084.37,-449.08,40,0
A	goto	1411/1,-4121.91,-449.78,40,0
A	goto	1411/1,-4116.63,-513.23,40,0
A	goto	1411/1,-4073.80,-519.22,40,0
A	goto	1411/1,-4079.61,-553.06,40,0
A	goto	1411/1,-4082.26,-576.68,40,0
A	goto	1411/1,-4084.37,-606.290,40,0
A	goto	1411/1,-4115.57,-608.05,40,0
A	goto	1411/1,-4146.24,-583.03,40,0
A	goto	1411/1,-4149.94,-543.55,40,0
A	goto	1411/1,-4177.43,-519.93,40,0
A	goto	1411/1,-4144.65,-507.94,40,0
A	goto	1411/1,-4149.41,-450.13,40,0
A	goto	1411/1,-4147.82,-416.65,40,0
A	goto	1411/1,-4148.88,-376.46,40,0
A	goto	1411/1,-4156.28,-350.73,40,0
A	goto	1411/1,-4177.96,-315.13,40,0
A	goto	1411/1,-4210.22,-283.40,40,0
A	goto	1411/1,-4240.35,-293.27,40,0
A	goto	1411/1,-4284.24,-283.05,40,0
A	goto	1411/1,-4349.81,-287.63,40,0
A	goto	1411/1,-4384.70,-281.990,40,0
A	goto	1411/1,-4386.82,-318.65,40,0
A	goto	1411/1,-4419.07,-345.79,40,0
A	goto	1411/1,-4452.38,-385.63,40,0
A	goto	1411/1,-4451.85,-417.70,40,0
A	goto	1411/1,-4455.03,-450.49,40,0
A	goto	1411/1,-4478.29,-449.08,40,0
A	goto	1411/1,-4451.85,-417.70,40,0
A	goto	1411/1,-4452.38,-385.63,40,0
A	goto	1411/1,-4442.34,-347.2,40,0
A	goto	1411/1,-4446.57,-313.01,40,0
A	goto	1411/1,-4451.33,-283.40,40,0
A	goto	1411/1,-4419.60,-246.04,40,0
A	goto	1411/1,-4384.70,-281.990,40,0
A	goto	1411/1,-4349.81,-287.63,40,0
A	goto	1411/1,-4284.24,-283.05,40,0
A	collect	206381,1,77587,1 << Troll Shaman
A	collect	206381,1,77585,1 << Orc Shaman
A	mob	Scorpid Worker
A	train	410094,1
S	Shaman
T	season	2
A	equip	18,206381
A	use	206381
A	itemcount	206381,1
A	train	410094,1
A	xp	<3,1
S	Shaman
T	season	2
T	loop	
A	goto	1411/1,-4249.87,-246.04,0
A	goto	1411/1,-4249.87,-246.04,40,0
A	goto	1411/1,-4226.08,-250.62,40,0
A	goto	1411/1,-4177.96,-248.5,40,0
A	goto	1411/1,-4181.66,-278.470,40,0
A	goto	1411/1,-4149.41,-319.00,40,0
A	goto	1411/1,-4112.40,-351.43,40,0
A	goto	1411/1,-4081.20,-354.25,40,0
A	goto	1411/1,-4046.83,-352.14,40,0
A	goto	1411/1,-4048.95,-383.16,40,0
A	goto	1411/1,-4053.71,-415.940,40,0
A	goto	1411/1,-4084.37,-449.08,40,0
A	goto	1411/1,-4121.91,-449.78,40,0
A	goto	1411/1,-4116.63,-513.23,40,0
A	goto	1411/1,-4073.80,-519.22,40,0
A	goto	1411/1,-4079.61,-553.06,40,0
A	goto	1411/1,-4082.26,-576.68,40,0
A	goto	1411/1,-4084.37,-606.290,40,0
A	goto	1411/1,-4115.57,-608.05,40,0
A	goto	1411/1,-4146.24,-583.03,40,0
A	goto	1411/1,-4149.94,-543.55,40,0
A	goto	1411/1,-4177.43,-519.93,40,0
A	goto	1411/1,-4144.65,-507.94,40,0
A	goto	1411/1,-4149.41,-450.13,40,0
A	goto	1411/1,-4147.82,-416.65,40,0
A	goto	1411/1,-4148.88,-376.46,40,0
A	goto	1411/1,-4156.28,-350.73,40,0
A	goto	1411/1,-4177.96,-315.13,40,0
A	goto	1411/1,-4210.22,-283.40,40,0
A	goto	1411/1,-4240.35,-293.27,40,0
A	goto	1411/1,-4284.24,-283.05,40,0
A	goto	1411/1,-4349.81,-287.63,40,0
A	goto	1411/1,-4384.70,-281.990,40,0
A	goto	1411/1,-4386.82,-318.65,40,0
A	goto	1411/1,-4419.07,-345.79,40,0
A	goto	1411/1,-4452.38,-385.63,40,0
A	goto	1411/1,-4451.85,-417.70,40,0
A	goto	1411/1,-4455.03,-450.49,40,0
A	goto	1411/1,-4478.29,-449.08,40,0
A	goto	1411/1,-4451.85,-417.70,40,0
A	goto	1411/1,-4452.38,-385.63,40,0
A	goto	1411/1,-4442.34,-347.2,40,0
A	goto	1411/1,-4446.57,-313.01,40,0
A	goto	1411/1,-4451.33,-283.40,40,0
A	goto	1411/1,-4419.60,-246.04,40,0
A	goto	1411/1,-4384.70,-281.990,40,0
A	goto	1411/1,-4349.81,-287.63,40,0
A	goto	1411/1,-4284.24,-283.05,40,0
A	aura	408828
A	mob	Scorpid Worker
A	train	410094,1
S	skip --Hunter
T	season	2
T	completewith	ChimeraRune
A	complete	792,1
A	mob	Vile Familiar
S	!Warlock
T	label	Imps
T	loop	
A	goto	1411/1,-4282.13,-250.97,0
A	goto	1411/1,-4282.13,-250.97,40,0
A	goto	1411/1,-4317.02,-258.02,40,0
A	goto	1411/1,-4351.39,-250.97,40,0
A	goto	1411/1,-4385.76,-256.96,40,0
A	goto	1411/1,-4383.65,-216.07,40,0
A	goto	1411/1,-4419.07,-221.01,40,0
A	goto	1411/1,-4457.67,-205.15,40,0
A	goto	1411/1,-4405.85,-189.99,40,0
A	goto	1411/1,-4409.55,-169.54,40,0
A	goto	1411/1,-4376.24,-197.390,40,0
A	goto	1411/1,-4360.38,-176.95,40,0
A	goto	1411/1,-4329.71,-196.33,40,0
A	goto	1411/1,-4319.67,-169.190,40,0
A	goto	1411/1,-4303.28,-186.46,40,0
A	goto	1411/1,-4281.07,-148.75,40,0
A	complete	792,1
A	mob	Vile Familiar
S	
T	label	Tails
T	loop	
A	goto	1411/1,-4249.87,-246.04,0
A	goto	1411/1,-4249.87,-246.04,40,0
A	goto	1411/1,-4226.08,-250.62,40,0
A	goto	1411/1,-4177.96,-248.5,40,0
A	goto	1411/1,-4181.66,-278.470,40,0
A	goto	1411/1,-4149.41,-319.00,40,0
A	goto	1411/1,-4112.40,-351.43,40,0
A	goto	1411/1,-4081.20,-354.25,40,0
A	goto	1411/1,-4046.83,-352.14,40,0
A	goto	1411/1,-4048.95,-383.16,40,0
A	goto	1411/1,-4053.71,-415.940,40,0
A	goto	1411/1,-4084.37,-449.08,40,0
A	goto	1411/1,-4121.91,-449.78,40,0
A	goto	1411/1,-4116.63,-513.23,40,0
A	goto	1411/1,-4073.80,-519.22,40,0
A	goto	1411/1,-4079.61,-553.06,40,0
A	goto	1411/1,-4082.26,-576.68,40,0
A	goto	1411/1,-4084.37,-606.290,40,0
A	goto	1411/1,-4115.57,-608.05,40,0
A	goto	1411/1,-4146.24,-583.03,40,0
A	goto	1411/1,-4149.94,-543.55,40,0
A	goto	1411/1,-4177.43,-519.93,40,0
A	goto	1411/1,-4144.65,-507.94,40,0
A	goto	1411/1,-4149.41,-450.13,40,0
A	goto	1411/1,-4147.82,-416.65,40,0
A	goto	1411/1,-4148.88,-376.46,40,0
A	goto	1411/1,-4156.28,-350.73,40,0
A	goto	1411/1,-4177.96,-315.13,40,0
A	goto	1411/1,-4210.22,-283.40,40,0
A	goto	1411/1,-4240.35,-293.27,40,0
A	goto	1411/1,-4284.24,-283.05,40,0
A	goto	1411/1,-4349.81,-287.63,40,0
A	goto	1411/1,-4384.70,-281.990,40,0
A	goto	1411/1,-4386.82,-318.65,40,0
A	goto	1411/1,-4419.07,-345.79,40,0
A	goto	1411/1,-4452.38,-385.63,40,0
A	goto	1411/1,-4451.85,-417.70,40,0
A	goto	1411/1,-4455.03,-450.49,40,0
A	goto	1411/1,-4478.29,-449.08,40,0
A	goto	1411/1,-4451.85,-417.70,40,0
A	goto	1411/1,-4452.38,-385.63,40,0
A	goto	1411/1,-4442.34,-347.2,40,0
A	goto	1411/1,-4446.57,-313.01,40,0
A	goto	1411/1,-4451.33,-283.40,40,0
A	goto	1411/1,-4419.60,-246.04,40,0
A	goto	1411/1,-4384.70,-281.990,40,0
A	goto	1411/1,-4349.81,-287.63,40,0
A	goto	1411/1,-4284.24,-283.05,40,0
A	complete	789,1
A	mob	Scorpid Worker
S	
T	loop	
A	goto	1411/1,-4340.82,-628.50,0
A	goto	1411/1,-4340.82,-628.50,25,0
A	goto	1411/1,-4375.71,-507.590,25,0
A	goto	1411/1,-4467.19,-506.53,25,0
A	goto	1411/1,-4433.88,-329.93,25,0
A	goto	1411/1,-4452.38,-232.640,25,0
A	goto	1411/1,-4283.71,-228.76,25,0
A	goto	1411/1,-4220.26,-209.73,25,0
A	goto	1411/1,-4144.65,-269.65,25,0
A	goto	1411/1,-4125.62,-321.12,25,0
A	goto	1411/1,-4015.64,-371.53,25,0
A	complete	5441,1
A	target	Lazy Peon
A	use	16114
S	
T	xprate	<1.5
T	loop	
A	goto	1411/1,-4146.24,-483.97,0
A	goto	1411/1,-4146.24,-483.97,40,0
A	goto	1411/1,-4179.02,-473.75,40,0
A	goto	1411/1,-4218.15,-480.10,40,0
A	goto	1411/1,-4252.52,-483.62,40,0
A	goto	1411/1,-4283.71,-516.76,40,0
A	goto	1411/1,-4317.55,-516.76,40,0
A	goto	1411/1,-4350.33,-510.06,40,0
A	goto	1411/1,-4379.94,-515.70,40,0
A	goto	1411/1,-4379.94,-484.33,40,0
A	goto	1411/1,-4352.98,-445.90,40,0
A	goto	1411/1,-4385.76,-412.77,40,0
A	goto	1411/1,-4384.70,-383.16,40,0
A	goto	1411/1,-4383.12,-346.85,40,0
A	goto	1411/1,-4349.81,-313.720,40,0
A	goto	1411/1,-4315.44,-287.28,40,0
A	goto	1411/1,-4281.60,-321.82,40,0
A	goto	1411/1,-4239.83,-315.13,40,0
A	goto	1411/1,-4213.92,-309.84,40,0
A	goto	1411/1,-4184.31,-348.61,40,0
A	goto	1411/1,-4184.31,-382.45,40,0
A	goto	1411/1,-4183.25,-409.6,40,0
A	goto	1411/1,-4182.72,-448.72,40,0
A	xp	4
A	mob	Mottled Boar
A	mob	Scorpid Worker
A	mob	Vile Familiar
S	
A	goto	1411/1,-4221.85,-561.52
A	turnin	4402
A	target	Galgar
A	isQuestComplete	4402
S	
A	goto	1411/1,-4214.45,-565.40
A	collect	159,5,6394,1 << !Rogue !Warrior !Hunter !Shaman
A	collect	2512,1000,6394,1 << Hunter
A	vendor	
A	target	Duokna
A	money	>0.1 << Rogue/Warrior
A	itemcount	159,<5 << !Rogue !Warrior !Hunter !Shaman
A	itemcount	2512,<600 << Hunter
S	
T	label	Sting
A	goto	1411/1,-4198.58,-602.41,12,0
A	goto	1411/1,-4186.42,-599.95
A	turnin	789,2
A	turnin	789
A	target	Gornek
S	Shaman
T	season	2
A	train	8042
A	turnin	77587
A	turnin	77585
A	goto	1411/1,-4203.87,-623.92
A	accept	1516
A	goto	1411/1,-4204.4,-629.91
A	target	Shikrik
A	target	Canaga Earthcaller
S	Shaman
T	season	0
A	train	8042
A	goto	1411/1,-4203.87,-623.92
A	accept	1516
A	goto	1411/1,-4204.4,-629.91
A	target	Shikrik
A	target	Canaga Earthcaller
S	Mage
T	season	0
A	goto	1411/1,-4210.22,-625.33
A	train	116
A	target	Mai'ah
S	Priest
T	season	0
A	goto	1411/1,-4202.28,-617.22
A	train	1243
A	train	589
A	money	<0.011
A	target	Ken'jai
S	Priest
T	season	0
A	goto	1411/1,-4202.28,-617.22
A	train	589
A	money	<0.01
A	target	Ken'jai
S	Priest
T	season	0
A	goto	1411/1,-4202.28,-617.22
A	train	589
A	turnin	3085
A	money	<0.021
A	target	Ken'jai
S	Priest
T	season	0
A	goto	1411/1,-4202.28,-617.22
A	train	1243
A	train	589
A	turnin	3085
A	money	<0.011
A	target	Ken'jai
S	Priest
T	season	0
A	goto	1411/1,-4202.28,-617.22
A	train	589
A	turnin	3085
A	money	<0.01
A	target	Ken'jai
S	!Warlock
A	goto	1411/1,-4228.19,-629.20
A	turnin	792
A	accept	794
A	target	Zureetha Fargaze
S	Hunter
T	season	2
T	optional	
A	goto	1411/1,-4227.66,-635.20
A	train	1978
A	turnin	77590
A	turnin	77584
A	target	Jen'shan
A	xp	<4,1
A	money	<0.01
S	Hunter
T	season	2
A	goto	1411/1,-4227.66,-635.20
A	turnin	77590
A	turnin	77584
A	target	Jen'shan
S	Hunter
T	season	0
A	goto	1411/1,-4227.66,-635.20
A	train	1978
A	target	Jen'shan
A	xp	<4,1
A	money	<0.01
S	Warrior
T	xprate	<1.5
A	goto	1411/1,-4230.31,-639.43
A	train	100
A	train	772
A	target	Frang
A	money	<0.02
A	train	772,1
S	Warrior
T	xprate	<1.5
A	goto	1411/1,-4230.31,-639.43
A	train	772
A	target	Frang
S	Warrior
A	goto	1411/1,-4230.31,-639.43
A	train	100
A	target	Frang
A	money	<0.01
S	
A	goto	1411/1,-4322.31,-611.58
A	turnin	5441
A	accept	6394
A	target	Foreman Thazz'ril
S	
T	xprate	<1.5
T	completewith	next
A	xp	4+1720
A	mob	Mottled Boar
A	mob	Scorpid Worker
A	mob	Vile Familiar
A	isOnQuest	4402
S	
T	loop	
A	goto	1411/1,-4324.43,-480.10,0
A	goto	1411/1,-4259.92,-411.01,25,0
A	goto	1411/1,-4279.48,-402.55,25,0
A	goto	1411/1,-4333.94,-360.95,25,0
A	goto	1411/1,-4335.53,-294.68,25,0
A	goto	1411/1,-4321.25,-243.220,25,0
A	goto	1411/1,-4366.20,-253.44,25,0
A	goto	1411/1,-4391.05,-328.52,25,0
A	goto	1411/1,-4440.75,-319.36,25,0
A	goto	1411/1,-4462.43,-405.370,25,0
A	goto	1411/1,-4398.98,-411.71,25,0
A	goto	1411/1,-4324.43,-480.10,25,0
A	complete	4402,1
S	!Warrior !Rogue !Shaman
T	optional	
T	xprate	<1.5
T	loop	
A	goto	1411/1,-4282.13,-250.97,0
A	goto	1411/1,-4282.13,-250.97,40,0
A	goto	1411/1,-4317.02,-258.02,40,0
A	goto	1411/1,-4351.39,-250.97,40,0
A	goto	1411/1,-4385.76,-256.96,40,0
A	goto	1411/1,-4383.65,-216.07,40,0
A	goto	1411/1,-4419.07,-221.01,40,0
A	goto	1411/1,-4457.67,-205.15,40,0
A	goto	1411/1,-4405.85,-189.99,40,0
A	goto	1411/1,-4409.55,-169.54,40,0
A	goto	1411/1,-4376.24,-197.390,40,0
A	goto	1411/1,-4360.38,-176.95,40,0
A	goto	1411/1,-4329.71,-196.33,40,0
A	goto	1411/1,-4319.67,-169.190,40,0
A	goto	1411/1,-4303.28,-186.46,40,0
A	goto	1411/1,-4281.07,-148.75,40,0
A	xp	4+1720
A	mob	Vile Familiar
A	isOnQuest	4402
S	!Warrior !Rogue !Shaman
T	xprate	<1.5
T	optional	
T	loop	
A	goto	1411/1,-4282.13,-250.97,40,0
A	goto	1411/1,-4317.02,-258.02,40,0
A	goto	1411/1,-4351.39,-250.97,40,0
A	goto	1411/1,-4385.76,-256.96,40,0
A	goto	1411/1,-4383.65,-216.07,40,0
A	goto	1411/1,-4419.07,-221.01,40,0
A	goto	1411/1,-4457.67,-205.15,40,0
A	goto	1411/1,-4405.85,-189.99,40,0
A	goto	1411/1,-4409.55,-169.54,40,0
A	goto	1411/1,-4376.24,-197.390,40,0
A	goto	1411/1,-4360.38,-176.95,40,0
A	goto	1411/1,-4329.71,-196.33,40,0
A	goto	1411/1,-4319.67,-169.190,40,0
A	goto	1411/1,-4303.28,-186.46,40,0
A	goto	1411/1,-4281.07,-148.75,40,0
A	xp	5
A	mob	Vile Familiar
A	isQuestTurnedIn	4402
S	
T	completewith	Thazz
T	label	Cave
A	goto	1411/1,-4360.38,-175.18,30
A	isOnQuest	6394
S	
T	completewith	Thazz
T	requires	Cave
A	goto	1411/1,-4361.44,-144.16,15,0
A	goto	1411/1,-4311.74,-113.14,15,0
A	goto	1411/1,-4274.19,-87.76,10
A	isOnQuest	6394
S	Shaman
T	completewith	Yarrog
T	requires	Cave
A	complete	1516,1
A	mob	Felstalker
S	
T	label	Thazz
A	goto	1411/1,-4274.19,-87.76
A	complete	6394,1
S	
T	label	Yarrog
A	goto	1411/1,-4220.26,-59.56
A	complete	794,1
A	mob	Yarrog Baneshadow
S	Shaman
T	loop	
A	goto	1411/1,-4220.26,-59.56,0
A	goto	1411/1,-4220.26,-59.56,25,0
A	goto	1411/1,-4234.54,5.65,25,0
A	goto	1411/1,-4265.73,-26.43,25,0
A	goto	1411/1,-4275.25,-47.58,25,0
A	goto	1411/1,-4295.87,-54.63,25,0
A	goto	1411/1,-4332.36,-42.64,25,0
A	goto	1411/1,-4332.89,-74.020,25,0
A	goto	1411/1,-4330.24,-115.26,25,0
A	goto	1411/1,-4349.28,-131.12,25,0
A	goto	1411/1,-4368.84,-138.52,25,0
A	goto	1411/1,-4349.28,-131.12,25,0
A	goto	1411/1,-4315.97,-131.47,25,0
A	goto	1411/1,-4300.10,-99.40,25,0
A	goto	1411/1,-4284.77,-105.740,25,0
A	goto	1411/1,-4282.13,-138.17,25,0
A	goto	1411/1,-4260.45,-150.16,25,0
A	goto	1411/1,-4238.77,-138.88,25,0
A	goto	1411/1,-4203.34,-102.92,25,0
A	goto	1411/1,-4211.27,-76.84,25,0
A	goto	1411/1,-4250.40,-88.82,25,0
A	complete	1516,1
A	mob	Felstalker
S	
T	optional	
T	xprate	<1.5
T	loop	
A	goto	1411/1,-4220.26,-59.56,25,0
A	goto	1411/1,-4234.54,5.65,25,0
A	goto	1411/1,-4265.73,-26.43,25,0
A	goto	1411/1,-4275.25,-47.58,25,0
A	goto	1411/1,-4295.87,-54.63,25,0
A	goto	1411/1,-4332.36,-42.64,25,0
A	goto	1411/1,-4332.89,-74.020,25,0
A	goto	1411/1,-4330.24,-115.26,25,0
A	goto	1411/1,-4349.28,-131.12,25,0
A	goto	1411/1,-4368.84,-138.52,25,0
A	goto	1411/1,-4349.28,-131.12,25,0
A	goto	1411/1,-4315.97,-131.47,25,0
A	goto	1411/1,-4300.10,-99.40,25,0
A	goto	1411/1,-4284.77,-105.740,25,0
A	goto	1411/1,-4282.13,-138.17,25,0
A	goto	1411/1,-4260.45,-150.16,25,0
A	goto	1411/1,-4238.77,-138.88,25,0
A	goto	1411/1,-4203.34,-102.92,25,0
A	goto	1411/1,-4211.27,-76.84,25,0
A	goto	1411/1,-4250.40,-88.82,25,0
A	xp	5+1680
A	xp	5+690
A	isQuestTurnedIn	4402
S	
T	xprate	<1.5
T	optional	
T	loop	
A	goto	1411/1,-4220.26,-59.56,25,0
A	goto	1411/1,-4234.54,5.65,25,0
A	goto	1411/1,-4265.73,-26.43,25,0
A	goto	1411/1,-4275.25,-47.58,25,0
A	goto	1411/1,-4295.87,-54.63,25,0
A	goto	1411/1,-4332.36,-42.64,25,0
A	goto	1411/1,-4332.89,-74.020,25,0
A	goto	1411/1,-4330.24,-115.26,25,0
A	goto	1411/1,-4349.28,-131.12,25,0
A	goto	1411/1,-4368.84,-138.52,25,0
A	goto	1411/1,-4349.28,-131.12,25,0
A	goto	1411/1,-4315.97,-131.47,25,0
A	goto	1411/1,-4300.10,-99.40,25,0
A	goto	1411/1,-4284.77,-105.740,25,0
A	goto	1411/1,-4282.13,-138.17,25,0
A	goto	1411/1,-4260.45,-150.16,25,0
A	goto	1411/1,-4238.77,-138.88,25,0
A	goto	1411/1,-4203.34,-102.92,25,0
A	goto	1411/1,-4211.27,-76.84,25,0
A	goto	1411/1,-4250.40,-88.82,25,0
A	xp	5+1300
A	xp	5+310
A	isOnQuest	4402
S	skip
T	completewith	next
A	goto	1411/1,-4326.01,-41.23
A	goto	1411/1,-4793.96,233.36,30
A	link	https://www.youtube.com/watch?v=7vmnvdjbUnM
S	
T	softcore	
T	completewith	next
A	goto	1411/1,-4326.01,-41.23
A	deathskip	
A	target	Spirit Healer
S	
T	softcore	
T	label	Betrayers
A	goto	1411/1,-4709.36,274.960
A	accept	784
A	target	Gar'thok
S	
A	goto	1411/1,-4665.400,311.900
A	accept	96825
A	target	Cook Torka
S	
T	softcore	
T	completewith	next
A	goto	1411/1,-4617.88,290.47,12,0
A	goto	1411/1,-4611.01,293.64,8,0
A	goto	1411/1,-4616.82,317.26,12,0
A	goto	1411/1,-4604.13,364.49,12,0
A	goto	1411/1,-4588.80,383.53,10
S	
T	softcore	
T	completewith	next
A	goto	1411/1,-4593.03,384.94,6,0
A	goto	1411/1,-4594.09,389.87,6,0
A	goto	1411/1,-4589.86,390.93,6,0
A	goto	1411/1,-4589.33,387.760,6,0
A	goto	1411/1,-4594.62,386.35,6,0
A	goto	1411/1,-4595.15,399.74,6,0
A	goto	1411/1,-4585.1,396.92,8
S	
T	softcore	
A	goto	1411/1,-4600.43,384.59
A	accept	791
A	target	Furl Scornbrow
S	Warrior/Rogue
T	softcore	
A	goto	1411/1,-4701.95,366.96
A	train	2575
A	target	Krunn
S	Warrior/Rogue
T	softcore	
A	goto	1411/1,-4706.71,358.15
A	collect	2901,1,784,1
A	target	Wuark
S	Warrior/Rogue
T	softcore	
A	goto	1411/1,-4714.64,372.60
A	train	2018
A	target	Dwukk
A	skill	blacksmithing,1,1
S	
A	goto	1411/1,-4815.200,306.800
A	accept	96822
A	target	Turroc
S	
T	completewith	next
A	hs	
A	use	6948
S	
T	xprate	<1.5
A	goto	1411/1,-4322.31,-611.58
A	turnin	6394
A	target	Foreman Thazz'ril
S	
A	goto	1411/1,-4221.85,-561.52
A	turnin	4402
A	target	Galgar
S	
A	goto	1411/1,-4214.45,-565.40
A	vendor	
A	target	Duokna
A	money	>0.03
S	
A	goto	1411/1,-4228.19,-629.20
A	turnin	794
A	accept	805
A	target	Zureetha Fargaze
S	Priest
A	goto	1411/1,-4202.28,-617.22
A	accept	5649
A	train	591
A	train	17
A	target	Ken'jai
S	Mage
T	season	2
A	goto	1411/1,-4210.22,-625.33
A	train	143
A	train	2136
A	turnin	77643
A	target	Mai'ah
A	isQuestComplete	77643
S	Mage
T	season	0
A	goto	1411/1,-4210.22,-625.33
A	train	143
A	train	2136
A	target	Mai'ah
S	Shaman
A	train	332
A	target	+Shikrik
A	goto	1411/1,-4203.87,-623.92
A	turnin	1516
A	accept	1517
A	target	+Canaga Earthcaller
A	goto	1411/1,-4204.4,-629.91
A	xp	<6,1
S	Shaman
A	goto	1411/1,-4204.4,-629.91
A	turnin	1516
A	accept	1517
A	target	Canaga Earthcaller
S	Hunter
A	goto	1411/1,-4227.66,-635.20
A	train	1130
A	train	3044
A	target	Jen'shan
A	money	<0.02
S	Hunter
A	goto	1411/1,-4227.66,-635.20
A	train	3044
A	target	Jen'shan
S	Warrior
A	goto	1411/1,-4230.31,-639.43
A	train	3127
A	train	6343
A	target	Frang
A	money	<0.02
S	Warrior
A	goto	1411/1,-4230.31,-639.43
A	train	3127
A	target	Frang
S	Rogue
T	completewith	RogueTraining
A	goto	1411/1,-4190.12,-603.12,15,0
A	goto	1411/1,-4157.87,-601.36,12,0
A	goto	1411/1,-4144.65,-588.67,12
S	Rogue
A	goto	1411/1,-4144.65,-588.67
A	train	1757
A	train	1776
A	target	Rwag
A	money	<0.02
A	xp	<6,1
S	Rogue
T	label	RogueTraining
A	goto	1411/1,-4144.65,-588.67
A	train	1757
A	target	Rwag
A	xp	<6,1
S	Warlock
T	completewith	Hraug3
A	goto	1411/1,-4190.12,-603.12,15,0
A	goto	1411/1,-4157.87,-601.36,12,0
A	goto	1411/1,-4143.06,-594.31,12,0
A	goto	1411/1,-4120.86,-589.72,12,0
A	goto	1411/1,-4107.11,-604.18,12
S	Warlock
T	label	Hraug3
A	goto	1411/1,-4107.11,-604.18
A	collect	16321,1,817,1
A	vendor	
A	target	Hraug
A	money	<0.03
A	train	6307,1
S	Warlock
T	season	2
A	goto	1411/1,-4111.87,-607.00
A	train	695
A	train	1454
A	turnin	77586
A	target	Nartok
A	money	<0.02
S	Warlock
T	season	2
A	goto	1411/1,-4111.87,-607.00
A	train	695
A	turnin	77586
A	target	Nartok
S	Warlock
T	season	0
A	goto	1411/1,-4111.87,-607.00
A	train	695
A	train	1454
A	target	Nartok
A	money	<0.02
S	Warlock
T	season	0
A	goto	1411/1,-4111.87,-607.00
A	train	695
A	target	Nartok
S	Shaman
T	completewith	CallOE1
T	label	Shrine
A	goto	1411/1,-4255.16,-645.07,25,0
A	goto	1411/1,-4245.64,-691.95,25,0
A	goto	1411/1,-4146.77,-787.12,12,0
A	goto	1411/1,-4120.86,-813.21,8,0
A	goto	1411/1,-4220.79,-841.76,10,0
A	goto	1411/1,-4266.26,-853.39,15,0
A	goto	1411/1,-4295.87,-883.36,25
A	isOnQuest	1517
S	Shaman
T	completewith	next
T	requires	Shrine
A	cast	8202
A	use	6635
S	Shaman
T	label	CallOE1
A	goto	1411/1,-4290.59,-878.07
A	turnin	1517
A	accept	1518
A	target	Minor Manifestation of Earth
S	Shaman
A	goto	1411/1,-4204.4,-629.91
A	turnin	1518
A	target	Canaga Earthcaller
S	Shaman
A	goto	1411/1,-4203.87,-623.92
A	train	332
A	target	Shikrik
S	
T	xprate	>1.49
A	goto	1411/1,-4322.31,-611.58
A	turnin	6394
A	target	Foreman Thazz'ril
S	
T	label	Leave
A	goto	1411/1,-4452.38,-631.32,25,0
A	goto	1411/1,-4554.43,-628.50,20,0
A	goto	1411/1,-4600.96,-603.82,25
A	isOnQuest	805
E
G	Guides/forever/Horde-01-12_Durotar.lua
M	classic	
M	tbc	
M	xprate	<1.99
M	selector	Horde
M	name	6-10 Durotar
M	version	11
M	group	RestedXP Forever Guide (H)
M	subgroup	Speedrun Guide 1-22
M	defaultfor	Troll/Orc
M	next	10-12 Durotar
S	
A	goto	1411/1,-4715.17,-599.240
A	accept	2161
A	target	Ukor
S	
T	completewith	next
A	subzone	367
S	
T	xprate	<1.5
T	loop	
A	goto	1411/1,-4828.32,-777.61,0
A	goto	1411/1,-4822.51,-881.59,25,0
A	goto	1411/1,-4845.24,-829.42,25,0
A	goto	1411/1,-4828.32,-777.61,25,0
A	accept	786
A	target	Lar Prowltusk
S	
A	goto	1411/1,-4885.200,-852.500
A	accept	97223
A	target	Xar'Ti
S	
T	label	SenjinPickups
A	accept	817
A	accept	96821
A	target	+Vel'rin Fang
A	goto	1411/1,-4920.86,-797.70
A	accept	818
A	accept	97225
A	target	+Master Vornal
A	goto	1411/1,-4920.33,-814.270
A	turnin	805
A	accept	808
A	accept	826
A	accept	823
A	target	+Master Gadrin
A	goto	1411/1,-4920.33,-825.55
S	
T	completewith	next
A	goto	1411/1,-4931.96,-815.32,8,0
A	goto	1411/1,-4939.89,-793.12,8
S	Rogue
A	goto	1411/1,-4938.83,-779.37
A	collect	3131,1,786,1
A	target	K'waii
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.9
S	Warlock/Mage/Priest
A	goto	1411/1,-4938.83,-779.37
A	collect	159,20,786,1
A	target	K'waii
A	money	<0.010
S	Warlock/Mage/Priest
A	goto	1411/1,-4938.83,-779.37
A	collect	159,10,786,1
A	target	K'waii
A	money	<0.0050
S	Shaman
A	goto	1411/1,-4948.35,-769.15
A	vendor	
A	target	Trayexir
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Shaman
A	goto	1411/1,-4948.35,-769.15
A	collect	2495,1,786,1
A	money	<0.0504
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Rogue
A	goto	1411/1,-4948.35,-769.15
A	vendor	
A	target	Trayexir
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Rogue
A	goto	1411/1,-4948.35,-769.15
A	collect	2494,1,786,1
A	money	<0.0401
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Orc Warrior
A	goto	1411/1,-4948.35,-769.15
A	vendor	
A	target	Trayexir
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Orc Warrior
A	goto	1411/1,-4948.35,-769.15
A	collect	2491,1,786,1
A	money	<0.0484
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Troll Warrior
A	goto	1411/1,-4948.35,-769.15
A	vendor	
A	target	Trayexir
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.8
S	Troll Warrior
A	goto	1411/1,-4948.35,-769.15
A	collect	2490,1,786,1
A	money	<0.0540
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.8
S	Hunter
A	goto	1411/1,-4948.35,-769.15
A	vendor	
A	target	Trayexir
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.3
S	Hunter
A	goto	1411/1,-4948.35,-769.15
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
A	goto	1411/1,-4939.36,-838.941
A	train	143
A	train	2136
A	target	Un'Thuwa
S	Warrior/Rogue
T	softcore	
T	completewith	TravelToTiragarde
A	collect	2862,1,786,1
A	skill	blacksmithing,<1,1
A	train	2575,3
S	
T	xprate	>1.49
T	completewith	next
A	goto	1411/1,-5057.80,-866.79,40,0
A	goto	1411/1,-5014.97,-937.99,40,0
A	goto	1411/1,-4908.69,-998.27,40,0
A	goto	1411/1,-4829.91,-1091.33,40,0
A	goto	1411/1,-4722.57,-1117.42,40,0
A	complete	818,2,4
A	mob	+Pygmy Surf Crawler
A	mob	+Surf Crawler
A	complete	818,1,2
A	mob	+Makrura Shellhide
A	mob	+Makrura Clacker
S	
T	xprate	>1.49
A	goto	1411/1,-4826.74,-1103.32,75
S	
T	xprate	<1.5
T	completewith	next
A	goto	1411/1,-5057.80,-866.79,40,0
A	goto	1411/1,-5014.97,-937.99,40,0
A	goto	1411/1,-4908.69,-998.27,40,0
A	goto	1411/1,-4829.91,-1091.33,40,0
A	goto	1411/1,-4722.57,-1117.42,40,0
A	complete	818,2
A	mob	+Pygmy Surf Crawler
A	mob	+Surf Crawler
A	complete	818,1
A	mob	+Makrura Shellhide
A	mob	+Makrura Clacker
S	
T	xprate	<1.5
A	goto	1411/1,-4722.57,-1117.42,75
A	isOnQuest	818
S	
T	xprate	<1.5
T	completewith	Bonfire
A	complete	791,1
A	isOnQuest	791
S	
T	xprate	<1.5
A	goto	1411/1,-4653.84,-983.47,30
A	isOnQuest	786
S	Priest
T	xprate	<1.5
T	sticky	
T	softcore	
T	label	Linen
T	completewith	HorrorsandSpirits
A	collect	2589,60
S	Priest
T	xprate	<1.5
T	sticky	
T	hardcore	
T	label	Linen
T	completewith	HorrorsandSpirits
A	collect	2589,60
S	
T	sticky	
T	xprate	<1.5
T	completewith	Bonfire
A	unitscan	Warlord Kolkanis
S	Warrior
T	xprate	<1.5
T	season	2
T	completewith	Bonfire
A	collect	207062,1
A	mob	Kolkar Drudge
A	mob	Kolkar Outrunner
A	train	403475,1
S	
T	xprate	<1.5
A	goto	1411/1,-4596.20,-1057.14
A	complete	786,1
S	
T	xprate	<1.5
A	goto	1411/1,-4482.52,-917.90
A	complete	786,2
S	
T	xprate	<1.5
T	label	Bonfire
A	goto	1411/1,-4406.91,-974.30
A	complete	786,3
S	Warrior
T	season	2
T	loop	
A	goto	1411/1,-4611.54,-984.88,0
A	goto	1411/1,-4611.54,-984.88,40,0
A	goto	1411/1,-4486.75,-1024.00,40,0
A	goto	1411/1,-4423.30,-1015.90,40,0
A	collect	207062,1
A	mob	Kolkar Drudge
A	mob	Kolkar Outrunner
A	train	403475,1
S	
T	xprate	<1.5
T	softcore	
A	goto	1411/1,-4417.49,-985.23,-1
A	goto	1411/1,-5002.81,-774.08,-1
A	deathskip	
A	isQuestComplete	786
S	
T	xprate	<1.5
T	hardcore	
T	completewith	next
A	goto	1411/1,-4656.48,-981.35,30
A	isQuestComplete	786
S	
T	hardcore	
T	xprate	<1.5
T	loop	
A	goto	1411/1,-4828.32,-777.61,0
A	goto	1411/1,-4822.51,-881.59,25,0
A	goto	1411/1,-4845.24,-829.42,25,0
A	goto	1411/1,-4828.32,-777.61,25,0
A	turnin	786,1
A	turnin	786
A	target	Lar Prowltusk
A	isQuestComplete	786
S	Shaman
T	xprate	<1.5
A	goto	1411/1,-4948.35,-769.15
A	vendor	
A	target	Trayexir
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Shaman
T	xprate	<1.5
A	goto	1411/1,-4948.35,-769.15
A	collect	2495,1,823,1
A	money	<0.0504
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Rogue
T	xprate	<1.5
A	goto	1411/1,-4948.35,-769.15
A	vendor	
A	target	Trayexir
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Rogue
T	xprate	<1.5
A	goto	1411/1,-4948.35,-769.15
A	collect	2494,1,823,1
A	money	<0.0401
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Orc Warrior
T	xprate	<1.5
A	goto	1411/1,-4948.35,-769.15
A	vendor	
A	target	Trayexir
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Orc Warrior
T	xprate	<1.5
A	goto	1411/1,-4948.35,-769.15
A	collect	2491,1,823,1
A	money	<0.0484
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Troll Warrior
T	xprate	<1.5
A	goto	1411/1,-4948.35,-769.15
A	vendor	
A	target	Trayexir
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.8
S	Troll Warrior
T	xprate	<1.5
A	goto	1411/1,-4948.35,-769.15
A	collect	2490,1,823,1
A	money	<0.0540
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.8
S	Hunter
T	xprate	<1.5
A	goto	1411/1,-4948.35,-769.15
A	vendor	
A	target	Trayexir
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.3
S	Hunter
T	xprate	<1.5
A	goto	1411/1,-4948.35,-769.15
A	collect	2506,1,823,1
A	money	<0.0283
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.3
S	Rogue
T	xprate	<1.5
T	optional	
T	completewith	TravelToTiragarde
A	use	3131
A	itemcount	3131,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.9
S	Shaman
T	xprate	<1.5
T	optional	
T	completewith	TravelToTiragarde
A	use	2495
A	itemcount	2495,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Rogue
T	xprate	<1.5
T	optional	
T	completewith	TravelToTiragarde
A	use	2494
A	itemcount	2494,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Orc Warrior
T	xprate	<1.5
T	optional	
T	completewith	TravelToTiragarde
A	use	2491
A	itemcount	2491,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Troll Warrior
T	xprate	<1.5
T	optional	
T	completewith	TravelToTiragarde
A	use	2490
A	itemcount	2490,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.8
S	Hunter
T	xprate	<1.5
T	optional	
T	completewith	TravelToTiragarde
A	use	2506
A	itemcount	2506,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.3
S	
T	xprate	<1.5
T	optional	
A	goto	1411/1,-4920.86,-813.91
A	turnin	818
A	target	Master Vornal
A	isQuestComplete	818
S	Warrior/Rogue/Shaman
T	xprate	<1.5
A	goto	1411/1,-4903.41,-786.42
A	vendor	
A	collect	2287,10,823,1
A	money	<0.025
A	target	Hai'zan
S	Warlock/Mage/Priest
T	xprate	<1.5
A	goto	1411/1,-4938.83,-779.37
A	collect	159,20,784,1
A	target	K'waii
A	money	<0.010
S	Warlock/Mage/Priest
T	xprate	<1.5
A	goto	1411/1,-4938.83,-779.37
A	collect	159,10,784,1
A	target	K'waii
A	money	<0.0050
S	
T	xprate	<1.5
T	softcore	
T	loop	
A	goto	1411/1,-4828.32,-777.61,0
A	goto	1411/1,-4822.51,-881.59,25,0
A	goto	1411/1,-4845.24,-829.42,25,0
A	goto	1411/1,-4828.32,-777.61,25,0
A	turnin	786,1
A	turnin	786
A	target	Lar Prowltusk
S	Rogue
T	season	2
A	goto	1411/1,-4702.48,-259.78
A	collect	203990,1
A	target	Ba'so
A	skipgossip	
A	itemcount	207098,1
A	train	400094,1
S	Rogue
T	season	2
A	train	400094
A	use	203990
A	itemcount	203990,1
S	
T	hardcore	
T	completewith	next
A	subzone	362
S	
T	hardcore	
T	label	Betrayers
A	turnin	823
A	accept	806
A	target	+Orgnil Soulscar
A	goto	1411/1,-4724.69,287.30
A	accept	784
A	accept	837
A	target	+Gar'Thok
A	goto	1411/1,-4709.36,274.960
A	accept	815
A	target	+Cook Torka
A	goto	1411/1,-4663.88,310.56
S	
T	hardcore	
T	completewith	next
A	goto	1411/1,-4617.88,290.47,12,0
A	goto	1411/1,-4611.01,293.64,8,0
A	goto	1411/1,-4616.82,317.26,12,0
A	goto	1411/1,-4604.13,364.49,12,0
A	goto	1411/1,-4588.80,383.53,10
S	
T	hardcore	
T	completewith	next
A	goto	1411/1,-4593.03,384.94,6,0
A	goto	1411/1,-4594.09,389.87,6,0
A	goto	1411/1,-4589.86,390.93,6,0
A	goto	1411/1,-4589.33,387.760,6,0
A	goto	1411/1,-4594.62,386.35,6,0
A	goto	1411/1,-4595.15,399.74,6,0
A	goto	1411/1,-4585.1,396.92,8
S	
T	hardcore	
A	goto	1411/1,-4600.43,384.59
A	accept	791
A	target	Furl Scornbrow
S	Warrior/Rogue
T	hardcore	
A	goto	1411/1,-4701.95,366.96
A	train	2575
A	target	Krunn
S	Warrior/Rogue
T	hardcore	
A	goto	1411/1,-4706.71,358.15
A	collect	2901,1,784,1
A	target	Wuark
S	Warrior/Rogue
T	hardcore	
A	goto	1411/1,-4714.64,372.60
A	train	2018
A	target	Dwukk
A	skill	blacksmithing,1,1
S	Warrior/Rogue
T	hardcore	
T	completewith	TravelToTiragarde
A	collect	2862,1,786,1
A	skill	blacksmithing,<1,1
A	train	2575,3
S	
A	goto	1411/1,-4710.400,-209.400
A	complete	96821,2
A	mob	+Ridgeshade Lurker
A	complete	96821,1
A	mob	+Ridgeshade Creeper
S	
T	softcore	
T	label	TravelToTiragarde
A	goto	1411/1,-4839.96,-399.73,60,0
A	subzone	372
A	isOnQuest	784
S	
T	hardcore	
T	label	TravelToTiragarde
A	goto	1411/1,-4990.12,-119.49,60,0
A	subzone	372
A	isOnQuest	784
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
A	goto	1411/1,-4992.700,-234.400
A	complete	96822,1
S	
A	goto	1411/1,-4994.900,-182.300
A	complete	96822,2
S	
T	sticky	
T	completewith	AgedEnvelope
A	unitscan	Watch Commander Zalaphil
S	
T	completewith	Benedict
T	requires	TravelToTiragarde
A	goto	1411/1,-5124.95,-243.92,8,0
A	goto	1411/1,-5115.96,-251.68,8,0
A	goto	1411/1,-5111.21,-232.29,8,0
A	goto	1411/1,-5097.46,-232.29,8
S	Priest
T	season	2
T	completewith	ScrapsFinished
A	collect	205940,1
A	train	425216,1
S	
T	label	Benedict
A	goto	1411/1,-5121.78,-245.68
A	complete	784,3
A	collect	4882,1,830,1
A	mob	Lieutenant Benedict
S	
T	label	AgedEnvelope
A	goto	1411/1,-5128.13,-231.58,5,0
A	goto	1411/1,-5126.01,-221.36,5,0
A	goto	1411/1,-5124.42,-229.82,5,0
A	goto	1411/1,-5131.83,-229.82,5,0
A	goto	1411/1,-5131.83,-222.42,5,0
A	goto	1411/1,-5096.40,-223.83
A	collect	4881,1,830
A	accept	830
A	use	4881
S	
T	loop	
A	goto	1411/1,-5081.60,-246.740,0
A	goto	1411/1,-5010.74,-254.50,30,0
A	goto	1411/1,-4995.41,-186.46,30,0
A	goto	1411/1,-5034.54,-148.75,30,0
A	goto	1411/1,-5057.80,-83.89,30,0
A	goto	1411/1,-4952.05,-113.50,30,0
A	goto	1411/1,-4943.06,-248.50,30,0
A	goto	1411/1,-5081.60,-246.740,30,0
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
A	goto	1411/1,-5081.60,-246.740,0
A	goto	1411/1,-5010.74,-254.50,30,0
A	goto	1411/1,-4995.41,-186.46,30,0
A	goto	1411/1,-5034.54,-148.75,30,0
A	goto	1411/1,-5057.80,-83.89,30,0
A	goto	1411/1,-4952.05,-113.50,30,0
A	goto	1411/1,-4943.06,-248.50,30,0
A	goto	1411/1,-5081.60,-246.740,30,0
A	complete	784,1
A	mob	+Kul Tiras Sailor
A	complete	784,2
A	mob	+Kul Tiras Marine
S	
T	optional	
T	label	ScrapsFinished
T	loop	
A	goto	1411/1,-5081.60,-246.740,0
A	goto	1411/1,-5010.74,-254.50,30,0
A	goto	1411/1,-4995.41,-186.46,30,0
A	goto	1411/1,-5034.54,-148.75,30,0
A	goto	1411/1,-5057.80,-83.89,30,0
A	goto	1411/1,-4952.05,-113.50,30,0
A	goto	1411/1,-4943.06,-248.50,30,0
A	goto	1411/1,-5081.60,-246.740,30,0
A	complete	791,1
A	mob	Kul Tiras Sailor
A	mob	Kul Tiras Marine
S	
A	goto	1411/1,-4951.500,-59.600
A	complete	96822,3
S	Priest
T	season	2
T	loop	
A	goto	1411/1,-5081.60,-246.740,0
A	goto	1411/1,-5010.74,-254.50,30,0
A	goto	1411/1,-4995.41,-186.46,30,0
A	goto	1411/1,-5034.54,-148.75,30,0
A	goto	1411/1,-5057.80,-83.89,30,0
A	goto	1411/1,-4952.05,-113.50,30,0
A	goto	1411/1,-4943.06,-248.50,30,0
A	goto	1411/1,-5081.60,-246.740,30,0
A	collect	205940,1
A	train	425216,1
A	mob	Kul Tiras Sailor
A	mob	Kul Tiras Marine
S	Priest
T	season	2
T	completewith	next
A	goto	1411/1,-4887.54,-752.93
A	emote	KNEEL,208309
A	aura	417316
A	skipgossip	208307,1
A	target	Serpent Loa
A	train	425216,1
S	Priest
T	season	2
A	use	205940
A	itemcount	205940,1
A	train	425216
S	!Priest !Mage
T	xprate	<1.5
T	optional	
T	loop	
A	goto	1411/1,-5083.18,37.37,50,0
A	goto	1411/1,-5025.55,126.56,50,0
A	goto	1411/1,-5092.7,246.76,50,0
A	goto	1411/1,-5027.13,311.62,50,0
A	goto	1411/1,-4948.35,276.72,50,0
A	goto	1411/1,-4897.06,82.14,50,0
A	xp	7+2520
A	isNotOnQuest	823
S	!Priest !Mage
T	xprate	<1.5
T	optional	
T	loop	
A	goto	1411/1,-5083.18,37.37,50,0
A	goto	1411/1,-5025.55,126.56,50,0
A	goto	1411/1,-5092.7,246.76,50,0
A	goto	1411/1,-5027.13,311.62,50,0
A	goto	1411/1,-4948.35,276.72,50,0
A	goto	1411/1,-4897.06,82.14,50,0
A	xp	7+2200
A	isOnQuest	823
S	!Priest !Mage
T	xprate	>1.49
T	optional	
T	loop	
A	goto	1411/1,-5083.18,37.37,50,0
A	goto	1411/1,-5025.55,126.56,50,0
A	goto	1411/1,-5092.7,246.76,50,0
A	goto	1411/1,-5027.13,311.62,50,0
A	goto	1411/1,-4948.35,276.72,50,0
A	goto	1411/1,-4897.06,82.14,50,0
A	xp	7+1530
A	isNotOnQuest	823
S	!Priest !Mage
T	xprate	>1.49
T	optional	
T	loop	
A	goto	1411/1,-5083.18,37.37,50,0
A	goto	1411/1,-5025.55,126.56,50,0
A	goto	1411/1,-5092.7,246.76,50,0
A	goto	1411/1,-5027.13,311.62,50,0
A	goto	1411/1,-4948.35,276.72,50,0
A	goto	1411/1,-4897.06,82.14,50,0
A	xp	7+1050
A	isOnQuest	823
S	Priest
T	xprate	<1.5
T	optional	
T	loop	
A	goto	1411/1,-5083.18,37.37,50,0
A	goto	1411/1,-5025.55,126.56,50,0
A	goto	1411/1,-5092.7,246.76,50,0
A	goto	1411/1,-5027.13,311.62,50,0
A	goto	1411/1,-4948.35,276.72,50,0
A	goto	1411/1,-4897.06,82.14,50,0
A	xp	7+2070
A	isNotOnQuest	823
S	Priest
T	xprate	<1.5
T	optional	
T	loop	
A	goto	1411/1,-5083.18,37.37,50,0
A	goto	1411/1,-5025.55,126.56,50,0
A	goto	1411/1,-5092.7,246.76,50,0
A	goto	1411/1,-5027.13,311.62,50,0
A	goto	1411/1,-4948.35,276.72,50,0
A	goto	1411/1,-4897.06,82.14,50,0
A	xp	7+1750
A	isOnQuest	823
S	Priest
T	xprate	>1.49
T	optional	
T	loop	
A	goto	1411/1,-5083.18,37.37,50,0
A	goto	1411/1,-5025.55,126.56,50,0
A	goto	1411/1,-5092.7,246.76,50,0
A	goto	1411/1,-5027.13,311.62,50,0
A	goto	1411/1,-4948.35,276.72,50,0
A	goto	1411/1,-4897.06,82.14,50,0
A	xp	7+855
A	isNotOnQuest	823
S	Priest
T	xprate	>1.49
T	optional	
T	loop	
A	goto	1411/1,-5083.18,37.37,50,0
A	goto	1411/1,-5025.55,126.56,50,0
A	goto	1411/1,-5092.7,246.76,50,0
A	goto	1411/1,-5027.13,311.62,50,0
A	goto	1411/1,-4948.35,276.72,50,0
A	goto	1411/1,-4897.06,82.14,50,0
A	xp	7+375
A	isOnQuest	823
S	skip
T	softcore	
T	completewith	RazorTurnins1
A	goto	1411/1,-4992.24,-77.54,120,0
A	deathskip	
S	
A	goto	1411/1,-4713.000,140.600
A	accept	96604
A	target	Brakk
S	
A	goto	1411/1,-4715.200,140.100
A	complete	96604,1
A	complete	96604,2
S	
A	goto	1411/1,-4713.000,140.600
A	turnin	96604
A	target	Brakk
S	
T	completewith	next
A	subzone	362
S	
T	softcore	
T	label	RazorTurnins1
A	turnin	823
A	accept	806
A	target	+Orgnil Soulscar
A	goto	1411/1,-4724.69,287.30
A	turnin	784
A	turnin	830
A	turnin	96821
A	accept	825
A	accept	831
A	accept	837
A	target	+Gar'Thok
A	goto	1411/1,-4709.36,274.960
A	accept	815
A	target	+Cook Torka
A	goto	1411/1,-4663.88,310.56
S	
T	hardcore	
T	label	RazorTurnins1
A	goto	1411/1,-4709.36,274.960
A	turnin	784
A	turnin	830
A	accept	825
A	accept	831
A	target	+Gar'Thok
S	
T	completewith	next
A	goto	1411/1,-4617.88,290.47,12,0
A	goto	1411/1,-4611.01,293.64,8,0
A	goto	1411/1,-4616.82,317.26,12,0
A	goto	1411/1,-4604.13,364.49,12,0
A	goto	1411/1,-4588.80,383.53,10
S	
T	completewith	next
A	goto	1411/1,-4593.03,384.94,6,0
A	goto	1411/1,-4594.09,389.87,6,0
A	goto	1411/1,-4589.86,390.93,6,0
A	goto	1411/1,-4589.33,387.760,6,0
A	goto	1411/1,-4594.62,386.35,6,0
A	goto	1411/1,-4595.15,399.74,6,0
A	goto	1411/1,-4585.1,396.92,8
S	
A	goto	1411/1,-4600.43,384.59
A	turnin	791
A	target	Furl Scornbrow
S	Warrior/Rogue
A	goto	1411/1,-4701.95,366.96
A	train	2575
A	target	Krunn
S	Warrior/Rogue
A	goto	1411/1,-4706.71,358.15
A	collect	2901,1,825,1
A	target	Wuark
S	Warrior/Rogue
A	goto	1411/1,-4714.64,372.60
A	train	2018
A	target	Dwukk
A	skill	blacksmithing,1,1
S	Shaman
A	goto	1411/1,-4713.06,382.12
A	vendor	
A	target	Uhgar
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Shaman
A	goto	1411/1,-4713.06,382.12
A	collect	2495,1,825,1
A	money	<0.0504
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Rogue
A	goto	1411/1,-4713.06,382.12
A	vendor	
A	target	Uhgar
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Rogue
A	goto	1411/1,-4713.06,382.12
A	collect	2494,1,825,1
A	money	<0.0401
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Orc Warrior
A	goto	1411/1,-4713.06,382.12
A	vendor	
A	target	Uhgar
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Orc Warrior
A	goto	1411/1,-4713.06,382.12
A	collect	2491,1,825,1
A	money	<0.0484
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Troll Warrior
A	goto	1411/1,-4713.06,382.12
A	vendor	
A	target	Uhgar
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.8
S	Troll Warrior
A	goto	1411/1,-4713.06,382.12
A	collect	2490,1,825,1
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
A	goto	1411/1,-4763.29,361.67
A	vendor	
A	target	Ghrawt
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.3
S	Hunter
A	goto	1411/1,-4763.29,361.67
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
A	goto	1411/1,-4763.29,361.67
A	collect	2512,1000,825,1 << Hunter
A	target	Ghrawt
A	itemcount	2512,<800 << Hunter
S	
A	goto	1411/1,-4686.09,340.52
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
A	goto	1411/1,-4686.09,340.52
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
S	
A	goto	1411/1,-4815.400,306.500
A	turnin	96822
A	target	Turroc
S	Warrior
A	goto	1411/1,-4827.27,311.62
A	train	284
A	target	Tarshaw Jaggedscar
S	Shaman
A	goto	1411/1,-4839.96,307.04
A	train	8044
A	target	Swart
S	Warlock
A	goto	1411/1,-4837.31,356.030
A	train	1120
A	target	Dhugru Gorelust
S	Warlock
A	goto	1411/1,-4854.76,345.81
A	collect	16302,1,825,1
A	target	Kitha
A	money	<0.01
A	train	7799,1
S	Hunter
A	goto	1411/1,-4704.07,275.31
A	train	5116
A	target	Thotar
S	Rogue
A	goto	1411/1,-4710.94,268.26
A	train	6760
A	target	Kaplak
S	Priest
A	goto	1411/1,-4831.5,295.05
A	turnin	5649
A	accept	5648
A	train	2052
A	target	Tai'jin
S	Priest
A	goto	1411/1,-4770.16,170.62
A	complete	5648,1
A	target	Grunt Kor'ja
S	Priest
A	goto	1411/1,-4831.5,295.05
A	turnin	5648
A	trainer	
A	target	Tai'jin
S	Rogue/Warrior
A	goto	1411/1,-4826.74,330.30
A	train	3273
A	money	<0.01
A	target	Rawrk
S	
A	goto	1411/1,-4838.37,321.49
A	collect	4496,1,825,1
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
A	goto	1411/1,-5238.63,-146.63,0
A	goto	1411/1,-5238.63,-146.63,20,0
A	goto	1411/1,-5253.97,-177.65,20,0
A	goto	1411/1,-5263.49,-301.03,20,0
A	goto	1411/1,-5245.51,-330.64,20,0
A	goto	1411/1,-5267.72,-326.41,20,0
A	goto	1411/1,-5306.31,-239.690,20,0
A	goto	1411/1,-5253.97,-177.65,20,0
A	complete	825,1
S	
T	completewith	TaillasherEggs
A	goto	1411/1,-5510.41,-634.14,100
S	
T	completewith	MartEgg
A	complete	815,1
A	mob	Bloodtalon Taillasher
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
T	label	MartEgg
A	goto	1411/1,-5599.500,-716.700
A	complete	97223,1
A	mob	Bloodtalon Martriarch
S	
T	label	TaillasherEggs
T	loop	
A	goto	1411/1,-5507.24,-708.520,0
A	goto	1411/1,-5675.91,-688.78,0
A	goto	1411/1,-5507.24,-708.520,40,0
A	goto	1411/1,-5540.02,-795.23,40,0
A	goto	1411/1,-5593.43,-816.73,40,0
A	goto	1411/1,-5651.06,-824.49,40,0
A	goto	1411/1,-5679.08,-775.84,40,0
A	goto	1411/1,-5675.91,-688.78,40,0
A	goto	1411/1,-5647.36,-671.50,40,0
A	goto	1411/1,-5621.98,-648.24,40,0
A	goto	1411/1,-5544.25,-654.23,40,0
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
A	goto	1411/1,-5501.95,-1167.12,150
A	isOnQuest	826
S	
T	completewith	MinshinasSkull
A	complete	826,1
A	mob	+Hexed Troll
A	complete	826,2
A	mob	+Voodoo Troll
A	complete	97225,1
S	Priest
T	season	2
T	completewith	Fur
A	collect	205947,1
A	mob	Voodoo Troll
A	train	402852,1
S	Mage
T	season	2
T	completewith	ZalazaneKill
A	collect	203753,1
A	mob	Zalazane
A	train	401765,1
S	
T	completewith	next
A	complete	826,3
A	mob	Zalazane
S	
T	label	MinshinasSkull
A	goto	1411/1,-5526.27,-1286.62
A	complete	808,1
S	
T	label	ZalazaneKill
A	goto	1411/1,-5526.27,-1286.62
A	complete	826,3
A	mob	Zalazane
S	Mage
T	season	2
A	goto	1411/1,-5526.27,-1286.62
A	collect	203753,1
A	mob	Zalazane
A	train	401765,1
S	Mage
T	season	2
A	collect	211779,1
A	train	401765
A	use	203753
S	
T	completewith	next
A	complete	817,1
A	mob	Durotar Tiger
S	
T	label	Fur
T	loop	
A	goto	1411/1,-5517.29,-1320.46,0
A	goto	1411/1,-5517.29,-1320.46,40,0
A	goto	1411/1,-5479.74,-1284.50,40,0
A	goto	1411/1,-5449.08,-1248.55,40,0
A	goto	1411/1,-5446.96,-1154.08,40,0
A	goto	1411/1,-5445.90,-1112.13,40,0
A	goto	1411/1,-5525.22,-1103.67,40,0
A	goto	1411/1,-5580.21,-1097.32,40,0
A	goto	1411/1,-5584.44,-1163.95,40,0
A	goto	1411/1,-5582.85,-1250.31,40,0
A	goto	1411/1,-5517.29,-1293.67,40,0
A	complete	826,1
A	mob	+Hexed Troll
A	complete	826,2
A	mob	+Voodoo Troll
A	complete	97225,1
S	Priest
T	season	2
T	loop	
A	goto	1411/1,-5517.29,-1320.46,0
A	goto	1411/1,-5517.29,-1320.46,40,0
A	goto	1411/1,-5479.74,-1284.50,40,0
A	goto	1411/1,-5449.08,-1248.55,40,0
A	goto	1411/1,-5446.96,-1154.08,40,0
A	goto	1411/1,-5445.90,-1112.13,40,0
A	goto	1411/1,-5525.22,-1103.67,40,0
A	goto	1411/1,-5580.21,-1097.32,40,0
A	goto	1411/1,-5584.44,-1163.95,40,0
A	goto	1411/1,-5582.85,-1250.31,40,0
A	goto	1411/1,-5517.29,-1293.67,40,0
A	collect	205947,1
A	mob	Voodoo Troll
A	train	402852,1
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
A	goto	1411/1,-5123.90,-1132.93,0
A	goto	1411/1,-5413.65,-1288.73,50,0
A	goto	1411/1,-5384.57,-1312.35,50,0
A	goto	1411/1,-5383.51,-1184.04,50,0
A	goto	1411/1,-5382.45,-1039.870,50,0
A	goto	1411/1,-5417.88,-1015.54,50,0
A	goto	1411/1,-5445.38,-1055.02,50,0
A	goto	1411/1,-5149.80,-1013.08,50,0
A	goto	1411/1,-5166.72,-1091.33,50,0
A	goto	1411/1,-5128.65,-1135.39,50,0
A	goto	1411/1,-5111.73,-1182.98,50,0
A	goto	1411/1,-5179.41,-1321.51,50,0
A	goto	1411/1,-5209.55,-1353.24,50,0
A	goto	1411/1,-5213.25,-1412.46,50,0
A	goto	1411/1,-5154.56,-1412.11,50,0
A	goto	1411/1,-5084.24,-1382.14,50,0
A	goto	1411/1,-5123.90,-1132.93,50,0
A	complete	817,1
A	mob	Durotar Tiger
S	
T	loop	
A	goto	1411/1,-5115.96,-794.53,0
A	goto	1411/1,-5115.96,-794.53,60,0
A	goto	1411/1,-5035.07,-916.490,60,0
A	goto	1411/1,-4990.65,-989.81,60,0
A	goto	1411/1,-4905.52,-1028.23,60,0
A	goto	1411/1,-4807.17,-1122.35,60,0
A	complete	818,2
A	mob	+Pygmy Surf Crawler
A	mob	+Surf Crawler
A	complete	818,1
A	mob	+Makrura Shellhide
A	mob	+Makrura Clacker
S	
T	softcore	
T	completewith	next
A	goto	1411/1,-5002.81,-774.08,50,0
A	deathskip	
S	
T	hardcore	
T	completewith	Zalazaneturnin
A	subzone	367
S	
A	goto	1411/1,-4948.88,-768.79
A	vendor	
A	target	Trayexir
A	isOnQuest	808
S	Mage
A	goto	1411/1,-4939.36,-838.94
A	train	118
A	target	Un'Thuwa
S	
T	label	Zalazaneturnin
A	turnin	808
A	turnin	826,2
A	turnin	826
A	turnin	97225
A	target	+Master Gadrin
A	goto	1411/1,-4920.86,-825.90
A	turnin	818
A	target	+Master Vornal
A	goto	1411/1,-4920.86,-813.91
A	turnin	817
A	target	+Vel'rin Fang
A	goto	1411/1,-4920.86,-797.70
S	
A	goto	1411/1,-4885.400,-852.400
A	turnin	97223
A	target	Xar'Ti
S	Priest
T	season	2
A	emote	KNEEL,208309
A	goto	1411/1,-4887.54,-752.93
A	skipgossip	208307,1
A	aura	417316
A	train	402852,1
S	Priest
T	season	2
T	completewith	QuilboarsScouts
A	aura	418459
A	use	205947
A	train	402852
A	itemcount	205947,1
S	
T	completewith	QuilboarsScouts
S	
T	completewith	QuilboarsScouts
A	complete	96825,1
S	Warrior
T	season	2
T	loop	
A	goto	1411/1,-4565.01,82.49,0
A	goto	1411/1,-4617.35,18.34,30,0
A	goto	1411/1,-4615.77,72.98,30,0
A	goto	1411/1,-4578.75,76.15,30,0
A	goto	1411/1,-4570.29,109.99,30,0
A	goto	1411/1,-4543.33,81.08,30,0
A	goto	1411/1,-4526.41,70.86,30,0
A	goto	1411/1,-4478.29,59.23,30,0
A	goto	1411/1,-4450.80,62.40,30,0
A	goto	1411/1,-4442.34,112.46,30,0
A	goto	1411/1,-4565.01,82.49,30,0
A	collect	206994,1
A	complete	837,1
A	mob	+Razormane Quilboar
A	complete	837,2
A	mob	+Razormane Scout
A	train	403475,1
S	
T	label	QuilboarsScouts
T	loop	
A	goto	1411/1,-4565.01,82.49,0
A	goto	1411/1,-4617.35,18.34,30,0
A	goto	1411/1,-4615.77,72.98,30,0
A	goto	1411/1,-4578.75,76.15,30,0
A	goto	1411/1,-4570.29,109.99,30,0
A	goto	1411/1,-4543.33,81.08,30,0
A	goto	1411/1,-4526.41,70.86,30,0
A	goto	1411/1,-4478.29,59.23,30,0
A	goto	1411/1,-4450.80,62.40,30,0
A	goto	1411/1,-4442.34,112.46,30,0
A	goto	1411/1,-4565.01,82.49,30,0
A	complete	837,1
A	mob	+Razormane Quilboar
A	complete	837,2
A	mob	+Razormane Scout
S	
A	goto	1411/1,-4543.300,82.500
A	complete	96825,1
S	
T	xprate	<1.5
T	loop	
A	goto	1411/1,-4312.79,407.50,0
A	goto	1411/1,-4312.79,407.50,50,0
A	goto	1411/1,-4314.91,487.52,50,0
A	goto	1411/1,-4251.99,492.8,50,0
A	goto	1411/1,-4167.39,500.91,50,0
A	goto	1411/1,-4164.21,459.32,50,0
A	goto	1411/1,-4180.08,382.12,50,0
A	goto	1411/1,-4251.99,384.23,50,0
A	complete	837,3
A	mob	+Razormane Dustrunner
A	complete	837,4
A	mob	+Razormane Battleguard
S	Hunter
T	optional	
T	xprate	<1.5
T	loop	
A	goto	1411/1,-4475.12,92.72,0
A	goto	1411/1,-4475.12,92.72,50,0
A	goto	1411/1,-4401.09,205.52,50,0
A	goto	1411/1,-4270.49,260.51,50,0
A	goto	1411/1,-4166.33,233.01,50,0
A	goto	1411/1,-4130.37,182.25,50,0
A	goto	1411/1,-4208.1,98.71,50,0
A	goto	1411/1,-4300.1,57.11,50,0
A	goto	1411/1,-4456.61,65.57,50,0
A	xp	9+4470
S	
T	optional	
T	xprate	>1.49
T	loop	
A	goto	1411/1,-4560.78,84.96,0
A	goto	1411/1,-4560.78,84.96,30,0
A	goto	1411/1,-4470.36,74.74,30,0
A	xp	9+4400
S	
T	xprate	>1.49 << !Hunter
T	softcore	
T	completewith	RazorTurnins015
A	deathskip	
A	xp	>10,1
S	
T	xprate	>1.49 << !Hunter
T	hardcore	
T	completewith	RazorTurnins015
A	goto	1411/1,-4709.36,274.960,100
S	Shaman
T	xprate	>1.49
A	goto	1411/1,-4839.96,307.04
A	train	8050
A	accept	2983
A	target	Swart
A	isNotOnQuest	1522
A	xp	<10,1
S	Hunter
T	xprate	<1.5
A	turnin	815
A	turnin	96825
A	target	+Cook Torka
A	goto	1411/1,-4665.47,311.62
A	turnin	825
A	turnin	837
A	target	+Gar'Thok
A	goto	1411/1,-4709.36,274.960
S	
T	xprate	>1.49
T	label	RazorTurnins015
A	turnin	815
A	target	+Cook Torka
A	goto	1411/1,-4665.47,311.62
A	turnin	825
A	target	+Gar'Thok
A	goto	1411/1,-4709.36,274.960
S	Shaman
T	xprate	>1.49
A	goto	1411/1,-4839.96,307.04
A	train	8050
A	accept	2983
A	target	Swart
A	isNotOnQuest	1522
S	Warrior
T	xprate	>1.49
A	goto	1411/1,-4827.27,311.62
A	accept	1505
A	trainer	
A	target	Tarshaw Jaggedscar
S	Warlock
T	xprate	>1.49
A	goto	1411/1,-4837.31,356.030
A	train	1120
A	target	Dhugru Gorelust
S	Warlock
T	xprate	>1.49
A	goto	1411/1,-4854.76,345.81
A	collect	16302,1,837,1
A	target	Kitha
A	money	<0.01
A	train	7799,1
S	Priest
T	xprate	>1.49
A	goto	1411/1,-4831.5,295.05
A	accept	5654
A	accept	5660
A	trainer	
A	target	Tai'jin
S	Rogue
T	xprate	>1.49
A	goto	1411/1,-4710.94,268.26
A	train	674
A	target	Kaplak
S	Hunter
A	goto	1411/1,-4704.07,275.31
A	accept	6062
A	trainer	
A	target	Thotar
S	Hunter
A	goto	1411/1,-4763.29,361.67
A	collect	2515,1200,6082,1
A	target	Ghrawt
S	Hunter
A	goto	1411/1,-4763.29,361.67
A	collect	2515,1200,6082,1
A	target	Ghrawt
A	itemcount	2515,<600
S	Hunter
T	loop	
A	goto	1411/1,-4693.49,-183.64,0
A	goto	1411/1,-4699.31,101.88,40,0
A	goto	1411/1,-4696.14,37.73,40,0
A	goto	1411/1,-4693.49,-1.4,40,0
A	goto	1411/1,-4701.42,-66.26,40,0
A	goto	1411/1,-4649.61,-82.83,40,0
A	use	15917
A	complete	6062,1
A	mob	Dire Mottled Boar
A	isOnQuest	6062
S	Hunter
A	goto	1411/1,-4704.07,275.31
A	turnin	6062
A	accept	6083
A	target	Thotar
A	isQuestComplete	6062
S	Hunter
A	goto	1411/1,-4704.07,275.31
A	accept	6083
A	target	Thotar
A	isQuestTurnedIn	6062
S	Hunter
T	completewith	next
S	Hunter
T	loop	
A	goto	1411/1,-5115.44,984.19,0
A	goto	1411/1,-5091.64,809.0,40,0
A	goto	1411/1,-5129.18,877.03,40,0
A	goto	1411/1,-5137.11,934.49,40,0
A	use	15919
A	complete	6083,1
A	mob	Surf Crawler
A	isQuestTurnedIn	6062
S	Hunter
A	goto	1411/1,-4704.07,275.31
A	turnin	6083
A	accept	6082
A	target	Thotar
A	isQuestTurnedIn	6062
S	Hunter
T	completewith	next
S	Hunter
T	loop	
A	goto	1411/1,-4862.16,506.2,0
A	goto	1411/1,-4862.16,506.2,40,0
A	goto	1411/1,-4818.28,616.53,40,0
A	goto	1411/1,-4829.38,733.21,40,0
A	goto	1411/1,-4908.17,727.57,40,0
A	goto	1411/1,-4933.55,776.21,40,0
A	goto	1411/1,-4973.73,846.71,40,0
A	goto	1411/1,-4984.31,906.29,40,0
A	use	15920
A	complete	6082,1
A	mob	Armored Scorpid
A	isQuestTurnedIn	6062
S	Hunter
A	goto	1411/1,-4704.07,275.31
A	turnin	6082
A	accept	6081
A	target	Thotar
A	isQuestTurnedIn	6062
S	Hunter
T	completewith	ConscriptH
S	Hunter
A	goto	1411/1,-4666.0,305.63
A	vendor	
A	collect	117,5,828,1
A	target	Grimtak
A	isQuestTurnedIn	6062
A	isQuestAvailable	834
S	
T	label	ConscriptH
T	xprate	>1.49 << !Hunter
A	goto	1411/1,-4648.55,271.43
A	accept	840
A	target	Takrin Pathseeker
S	
T	xprate	>1.49
T	loop	
A	goto	1411/1,-4312.79,407.50,0
A	goto	1411/1,-4312.79,407.50,50,0
A	goto	1411/1,-4314.91,487.52,50,0
A	goto	1411/1,-4251.99,492.8,50,0
A	goto	1411/1,-4167.39,500.91,50,0
A	goto	1411/1,-4164.21,459.32,50,0
A	goto	1411/1,-4180.08,382.12,50,0
A	goto	1411/1,-4251.99,384.23,50,0
A	complete	837,3
A	mob	+Razormane Dustrunner
A	complete	837,4
A	mob	+Razormane Battleguard
S	Warrior/Shaman
T	xprate	>1.49
A	goto	1413/1,-3686.10,303.14,40
A	zoneskip	The Barrens
S	Warrior/Shaman
T	xprate	>1.49
A	goto	1413/1,-3687.11,303.14
A	turnin	840
A	accept	842
A	target	Kargal Battlescar
S	Warrior
T	xprate	>1.49
A	goto	1413/1,-3598.95,186.93
A	turnin	1505
A	accept	1498
A	target	Uzzek
S	Shaman
T	xprate	>1.49
A	goto	1413/1,-3037.56,264.63
A	turnin	2983
A	accept	1524
A	target	Kranal Fiss
S	Shaman
T	xprate	>1.49
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
T	xprate	>1.49
T	label	CallofFire3
A	goto	1411/1,-3999.24,-268.95
A	turnin	1524
A	accept	1525
A	target	Telf Joolam
S	Hunter/Shaman/Warrior
T	xprate	<1.5 << Shaman/Warrior
A	goto	1411/1,-4241.94,742.37
A	accept	816
A	target	Misha Tor'kren
S	Warrior
T	xprate	>1.49
T	loop	
A	goto	1411/1,-4246.17,950.35,0
A	goto	1411/1,-4033.08,721.22,40,0
A	goto	1411/1,-4036.79,807.94,40,0
A	goto	1411/1,-4047.36,929.2,40,0
A	goto	1411/1,-4151.0,952.46,40,0
A	goto	1411/1,-4246.17,950.35,40,0
A	complete	1498,1
A	mob	Lightning Hide
S	Shaman
T	xprate	>1.49
T	completewith	next
A	goto	1411/1,-4165.27,903.11,20
S	Warrior/Shaman
T	xprate	>1.49
T	softcore	
A	goto	1411/1,-4190.12,868.22
A	complete	806,1
A	mob	Fizzle Darkstorm
A	mob	Imp Minion
A	mob	Burning Blade Fanatic
A	mob	Lightning Hide
S	Warrior/Shaman
T	xprate	>1.49
T	hardcore	
A	goto	1411/1,-4190.12,868.22
A	complete	806,1
A	mob	Fizzle Darkstorm
A	mob	Imp Minion
A	mob	Burning Blade Fanatic
A	mob	Lightning Hide
S	Warrior/Shaman
T	xprate	>1.49
T	softcore	
A	goto	1411/1,-4449.74,1188.64
A	deathskip	
A	isQuestComplete	806
S	Warrior/Shaman
T	xprate	>1.49
T	hardcore	
A	goto	1411/1,-4035.2,679.63,60
A	isQuestComplete	806
S	
T	completewith	next
A	goto	1411/1,-4414.31,999.70,50
S	
A	goto	1411/1,-4414.31,999.70
A	accept	834
A	target	Rezlak
S	Warrior
T	season	2
T	completewith	next
A	collect	206995,1
A	mob	Dustwind Savage
A	mob	Dustwind Storm Witch
A	mob	Dustwind Pillager
A	mob	Dustwind Harpy
A	train	403475,1
S	
T	loop	
A	goto	1411/1,-4590.39,1036.36,0
A	goto	1411/1,-4590.39,1036.36,40,0
A	goto	1411/1,-4590.39,950.7,40,0
A	goto	1411/1,-4613.12,902.410,40,0
A	goto	1411/1,-4651.19,893.24,40,0
A	goto	1411/1,-4693.49,832.97,40,0
A	goto	1411/1,-4598.32,854.12,40,0
A	goto	1411/1,-4642.20,696.20,40,0
A	goto	1411/1,-4505.79,597.14,40,0
A	goto	1411/1,-4466.13,630.980,40,0
A	goto	1411/1,-4526.41,679.98,40,0
A	goto	1411/1,-4457.67,720.17,40,0
A	complete	834,1
S	Warrior
T	season	2
T	loop	
A	goto	1411/1,-4816.69,972.910,0
A	goto	1411/1,-4818.81,848.48,40,0
A	goto	1411/1,-4755.36,952.82,40,0
A	goto	1411/1,-4704.07,964.10,40,0
A	goto	1411/1,-4818.28,975.38,40,0
A	goto	1411/1,-4718.87,1076.19,40,0
A	goto	1411/1,-4672.87,1131.89,40,0
A	goto	1411/1,-4816.69,972.910,40,0
A	collect	206995,1
A	mob	Dustwind Savage
A	mob	Dustwind Storm Witch
A	mob	Dustwind Pillager
A	mob	Dustwind Harpy
A	train	403475,1
S	
T	xprate	<1.5
A	goto	1411/1,-4414.31,999.70
A	turnin	834
A	accept	835
A	target	Rezlak
S	
T	xprate	>1.49
A	goto	1411/1,-4414.31,999.70
A	turnin	834
A	target	Rezlak
S	Shaman
T	xprate	>1.49
T	completewith	next
A	goto	1411/1,-4575.58,1157.27,40,0
A	goto	1411/1,-4677.63,1217.54,40,0
A	goto	1411/1,-4852.12,1137.88,40,0
A	goto	1411/1,-4916.1,810.41,40,0
A	subzone	371
S	Shaman
T	xprate	>1.49
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
S	
T	xprate	<1.5 << Shaman/Warrior
T	completewith	next
A	goto	1411/1,-4327.07,932.02,40,0
A	goto	1411/1,-4198.05,911.22,30,0
A	goto	1411/1,-4165.27,903.11,20
A	goto	1411/1,-4165.27,903.11,20
A	cast	2641 |cRXP_WARN_Cast|r |T136095:0|t[Dismiss Pet] |cRXP_WARN_and then jump into Thunder Ridge|r << Hunter
S	
T	xprate	<1.5 << Shaman/Warrior
T	softcore	
A	goto	1411/1,-4190.12,868.22
A	complete	806,1
A	mob	Fizzle Darkstorm
A	mob	Imp Minion
A	mob	Burning Blade Fanatic
A	mob	Lightning Hide
S	
T	xprate	<1.5 << Shaman/Warrior
T	hardcore	
A	goto	1411/1,-4190.12,868.22
A	complete	806,1
A	mob	Fizzle Darkstorm
A	mob	Imp Minion
A	mob	Burning Blade Fanatic
A	mob	Lightning Hide
S	Warrior/Shaman/Hunter
T	xprate	<1.5 << Shaman/Warrior
T	softcore	
A	goto	1411/1,-4449.74,1188.64
A	deathskip	
A	isQuestComplete	806
A	xp	>10,1
S	Warrior/Shaman/Hunter
T	xprate	<1.5 << Shaman/Warrior
T	softcore	
A	goto	1411/1,-4035.2,679.63,60
A	isQuestComplete	806
A	xp	<10,1
S	Warrior/Shaman/Hunter
T	xprate	<1.5 << Shaman/Warrior
T	hardcore	
A	goto	1411/1,-4035.2,679.63,60
A	isQuestComplete	806
S	!Warrior !Shaman !Hunter
T	xprate	>1.49
T	softcore	
A	goto	1411/1,-4449.74,1188.64
A	deathskip	
A	isQuestComplete	806
S	!Warrior !Shaman !Hunter
T	xprate	>1.49
T	hardcore	
A	goto	1411/1,-4035.2,679.63,60
A	isQuestComplete	806
S	Warrior/Shaman/Hunter
T	xprate	<1.5 << Shaman/Warrior
A	goto	1411/1,-4158.93,1153.04
A	accept	812
A	target	Rhinag
S	Warrior/Shaman
T	optional	
T	xprate	<1.5
T	loop	
A	goto	1411/1,-4265.73,1276.76,0
A	goto	1411/1,-4297.46,1131.89,60,0
A	goto	1411/1,-4295.87,1208.38,60,0
A	goto	1411/1,-4265.73,1276.76,60,0
A	xp	9+2930
S	Warrior/Shaman
T	optional	
T	xprate	<1.5
T	loop	
A	goto	1411/1,-4265.73,1276.76,0
A	goto	1411/1,-4297.46,1131.89,60,0
A	goto	1411/1,-4295.87,1208.38,60,0
A	goto	1411/1,-4265.73,1276.76,60,0
A	cooldown	item,6948,<0
S	Warrior/Shaman/Hunter
T	xprate	<1.5 << Shaman
T	label	EnterOrg
T	completewith	next
A	goto	1454/1,-4367.46,1405.44,50,0
A	zone	Orgrimmar
A	zoneskip	Orgrimmar
S	Warrior/Shaman/Hunter
T	xprate	<1.5 << Shaman
A	goto	1454/1,-4133.36,1939.000
A	turnin	831
A	target	Nazgrel
S	Warrior/Shaman/Hunter
T	xprate	<1.5 << Shaman
A	goto	1454/1,-4125.79,1920.10
A	accept	5726
A	target	Thrall
S	Hunter
T	completewith	next
A	goto	1454/1,-4634.65,1911.96,30
S	Hunter
A	goto	1454/1,-4607.02,2100.64
A	turnin	6081
A	target	Ormak Grimshot
S	Hunter
A	goto	1454/1,-4611.09,2135.15
A	train	24547
A	target	Xao'tsu
S	Hunter
T	completewith	FindAntidote
S	Hunter
A	goto	1454/1,-4819.1,2099.05
A	collect	2507,1,835,1
A	money	<0.1751
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<5.7
A	target	Zendo'jian
S	Hunter
T	optional	
T	completewith	FindAntidote
A	use	2507
A	itemcount	2507,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<5.7
A	xp	<11,1
S	Hunter
T	optional	
T	completewith	FindAntidote
A	use	2507
A	itemcount	2507,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<5.7
A	xp	>11,1
S	Warrior/Shaman/Hunter
T	xprate	<1.5 << Shaman/Warrior
T	label	FindAntidote
A	goto	1454/1,-4343.19,1772.68
A	accept	813
A	target	Kor'ghan
A	isOnQuest	812
S	Warrior/Shaman/Hunter
T	xprate	<1.5 << Shaman/Warrior
T	completewith	RazorTurnins2
T	label	NeedACure
A	abandon	812
A	isOnQuest	812
S	Warrior
T	season	2
T	completewith	next
A	goto	1454/1,-4485.7,1769.41,-1
A	goto	1454/1,-4494.81,1793.070,-1
A	target	Zamja
A	target	Gru'ark
A	skipgossip	
S	Warrior
T	season	2
A	goto	1454/1,-4501.41,1780.63
A	collect	204716,1
A	target	Zamja
A	train	425447,1
A	skipgossip	
S	Warrior
T	season	2
A	train	425447
A	use	204716
A	itemcount	204716,1
S	
T	xprate	<1.5 << Mage/Warlock/Priest/Rogue
T	completewith	RazorTurnins2
A	hs	
A	isQuestComplete	806
A	use	6948
A	subzoneskip	362
A	bindlocation	362,1
S	
T	xprate	<1.5 << Mage/Warlock/Priest/Rogue
T	requires	NeedACure
A	goto	1411/1,-4686.09,340.52
A	vendor	
A	collect	1179,15,818,1 << Mage/Warlock/Priest/Shaman
A	collect	2287,15,818,1 << Rogue/Warrior
A	target	Innkeeper Grosk
A	money	<0.0375
S	Warrior
T	season	2
A	goto	1411/1,-4772.28,274.960
A	collect	204688,1
A	collect	204689,1
A	collect	204690,1
A	target	Vahi Bonesplitter
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
S	Hunter
T	xprate	<1.5
A	goto	1411/1,-4724.69,287.30
A	turnin	806
A	accept	828
A	target	Orgnil Soulscar
S	!Hunter
T	xprate	<1.5
A	turnin	815
A	turnin	96825
A	target	+Cook Torka
A	goto	1411/1,-4665.47,311.62
A	turnin	806
A	accept	828
A	target	+Orgnil Soulscar
A	goto	1411/1,-4724.69,287.30
A	turnin	825
A	turnin	837
A	target	+Gar'Thok
A	goto	1411/1,-4709.36,274.960
S	Hunter/Shaman/Warrior
T	xprate	>1.49
T	label	RazorTurnins2
A	turnin	806
A	target	+Orgnil Soulscar
A	goto	1411/1,-4724.69,287.30
A	turnin	837
A	target	+Gar'Thok
A	goto	1411/1,-4709.36,274.960
S	Warrior
T	xprate	<1.5
A	goto	1411/1,-4827.27,311.62
A	train	6546
A	accept	1505
A	target	Tarshaw Jaggedscar
S	Shaman
T	xprate	<1.5
A	goto	1411/1,-4839.96,307.04
A	train	8050
A	accept	2983
A	target	Swart
A	isNotOnQuest	1522
S	Shaman
T	xprate	<1.5
A	goto	1411/1,-4839.96,307.04
A	train	8050
A	target	Swart
S	Warlock
T	xprate	<1.5
A	goto	1411/1,-4837.31,356.030
A	train	1120
A	target	Dhugru Gorelust
S	Warlock
T	xprate	<1.5
A	goto	1411/1,-4854.76,345.81
A	collect	16302,1,837,1
A	target	Kitha
A	money	<0.01
A	train	7799,1
S	Priest
T	xprate	<1.5
A	goto	1411/1,-4831.5,295.05
A	accept	5654
A	accept	5660
A	trainer	
A	target	Tai'jin
S	Hunter
A	goto	1411/1,-4704.07,275.31
A	train	13549
A	target	Thotar
S	Rogue
T	xprate	<1.5
A	goto	1411/1,-4710.94,268.26
A	train	674
A	target	Kaplak
E
G	Guides/forever/Horde-01-12_Durotar.lua
M	classic	
M	tbc	
M	xprate	<1.99
M	selector	Horde
M	name	10-12 Durotar
M	version	11
M	group	RestedXP Forever Guide (H)
M	subgroup	Speedrun Guide 1-22
M	defaultfor	Troll/Orc
M	next	10-12 Tirisfal << Troll Rogue/Orc Rogue/Orc Warlock/Troll Mage/Troll Priest
M	next	12-17 The Barrens << Troll !Rogue !Mage !Priest/Orc !Rogue !Warlock
S	Warrior/Shaman
A	goto	1411/1,-4648.55,271.43
A	accept	840
A	target	Takrin Pathseeker
S	Warrior/Shaman
T	label	FarWatchPost
A	goto	1413/1,-3686.10,303.14,40
A	zoneskip	The Barrens
S	Warrior/Shaman
A	goto	1413/1,-3687.11,303.14
A	turnin	840
A	accept	842
A	target	Kargal Battlescar
S	Warrior
T	xprate	<1.5
A	goto	1413/1,-3598.95,186.93
A	turnin	1505
A	accept	1498
A	target	Uzzek
S	Warrior
T	xprate	>1.49
A	goto	1413/1,-3598.95,186.93
A	turnin	1498
A	accept	1502
A	target	Uzzek
S	Shaman
T	xprate	<1.5
A	goto	1413/1,-3037.56,264.63
A	turnin	2983
A	accept	1524
A	target	Kranal Fiss
S	Warrior/Shaman
T	hardcore	
T	completewith	PoolsPickup
A	goto	1413/1,-2680.87,-365.05,150,0
A	subzone	380
S	skip --Warrior/Shaman
T	softcore	
T	completewith	next
A	deathskip	
S	Warrior/Shaman
T	label	PoolsPickup
A	goto	1413/1,-2672.76,-544.77
A	accept	870
A	target	Tonga Runetotem
S	Warrior/Shaman
A	goto	1413/1,-2669.72,-481.94
A	turnin	842
A	accept	844
A	target	Sergra Darkthorn
S	Warrior/Shaman
A	goto	1413/1,-2709.24,-403.57
A	accept	6365
A	target	Zargh
S	Warrior/Shaman
A	goto	1413/1,-2639.32,-436.00
A	accept	869
A	target	Gazrog
S	Warrior/Shaman
T	xprate	>1.49
A	goto	1413/1,-2645.40,-406.94
A	home	
A	target	Innkeeper Boorand Plainswind
A	bindlocation	380
A	subzoneskip	380,1
S	Warrior/Shaman
A	goto	1413/1,-2595.75,-473.15
A	accept	871
A	accept	5041
A	target	Thork
S	Warrior/Shaman
A	goto	1413/1,-2595.75,-437.35
A	fp	The Crossroads
A	turnin	6365
A	accept	6384
A	target	Devrak
A	zoneskip	Orgrimmar
S	Warrior/Shaman
A	goto	1413/1,-2589.67,-424.51
A	accept	848
A	accept	1492
A	target	Apothecary Helbrim
S	Warrior/Shaman
T	completewith	next
A	complete	848,1
S	Warrior/Shaman
A	goto	1413/1,-1943.16,89.64
A	complete	870,1
S	Warrior/Shaman
T	loop	
A	goto	1413/1,-1957.35,38.29,0
A	goto	1413/1,-1957.35,38.29,40,0
A	goto	1413/1,-1957.35,126.12,40,0
A	goto	1413/1,-1896.55,92.34,40,0
A	goto	1413/1,-1825.62,-36.03,40,0
A	complete	848,1
S	Warrior/Shaman
T	completewith	FungalSporesComplete
A	goto	1413/1,-2680.87,-365.05,150,0
A	subzone	380
S	skip --Warrior/Shaman
T	softcore	
T	completewith	next
A	deathskip	
S	Warrior/Shaman
T	label	FungalSporesComplete
A	goto	1413/1,-2589.67,-424.51
A	turnin	848
A	timer	7,Fungal Spores RP
A	accept	853
A	target	Apothecary Helbrim
S	Warrior/Shaman
A	goto	1413/1,-2612.98,-411.00
A	collect	4496,1,853,1
A	target	Jark
A	money	<0.05
S	Warrior/Shaman
T	sticky	
T	completewith	ZamahTurnin2
A	isOnQuest	853
S	Warrior/Shaman
A	goto	1413/1,-2672.76,-544.77
A	turnin	870
A	target	Tonga Runetotem
S	Warrior/Shaman
T	completewith	next
A	goto	1413/1,-2184.34,-2203.43,70,0
A	subzone	378
S	Warrior/Shaman
A	goto	1413/1,-1881.35,-2384.50
A	fp	Camp Taurajo
A	target	Omusa Thunderhorn
S	Warrior/Shaman
T	loop	
A	goto	1412/1,-784.9,-2350.18,0
A	goto	1412/1,-1016.6,-2410.12,50,0
A	goto	1412/1,-904.6,-2371.07,50,0
A	goto	1412/1,-784.9,-2350.18,50,0
A	goto	1412/1,-674.96,-2336.14,50,0
A	goto	1412/1,-597.9,-2301.54,50,0
A	goto	1412/1,-784.9,-2350.18,50,0
A	line	Mulgore,51.50,59.23,53.00,60.24,55.14,60.65,57.47,61.26,59.65,62.40
A	accept	749
A	unitscan	Morin Cloudstalker
S	Warrior/Shaman
T	xprate	<1.5
A	goto	1412/1,-454.82,-2304.80
A	accept	761
A	target	Harken Windtotem
S	Warrior/Shaman
A	goto	1412/1,-393.06,-2333.53
A	accept	767
A	accept	746
A	target	Baine Bloodhoof
S	Warrior/Shaman
A	goto	1412/1,-382.12,-2396.42.0
A	accept	743
A	target	Ruul Eagletalon
S	Warrior/Shaman
A	goto	1412/1,-407.81,-2245.72
A	turnin	767
A	accept	771
A	target	Zarlman Two-Moons
S	Warrior/Shaman
A	goto	1412/1,-366.71,-2225.17
A	accept	766
A	target	Maur Raincaller
S	Warrior/Shaman
T	xprate	<1.5
T	completewith	EnterTB
A	complete	766,1
A	complete	766,2
A	complete	766,3
A	complete	766,4
A	complete	761,1
S	Warrior/Shaman
T	xprate	>1.49
T	completewith	EnterTB
A	complete	766,1
A	complete	766,2
A	complete	766,3
A	complete	766,4
S	Warrior/Shaman
T	completewith	EnterTB
A	collect	4854,1,770
A	use	4854
A	unitscan	Ghost Howl
S	Warrior/Shaman
T	loop	
A	goto	1412/1,-539.33,-2550.2,0
A	goto	1412/1,-454.56,-2479.99,15,0
A	goto	1412/1,-539.33,-2550.2,15,0
A	goto	1412/1,-619.47,-2459.78,15,0
A	goto	1412/1,-578.89,-2706.72,15,0
A	goto	1412/1,-539.33,-2550.2,15,0
A	complete	771,2
S	Warrior/Shaman
T	loop	
A	goto	1412/1,-729.42,-2547.12,0
A	goto	1412/1,-692.94,-2525.88,10,0
A	goto	1412/1,-710.92,-2519.37,10,0
A	goto	1412/1,-725.31,-2531.36,10,0
A	goto	1412/1,-729.42,-2547.12,10,0
A	complete	771,1
S	Warrior/Shaman
A	goto	1412/1,-405.75,-2243.32
A	turnin	771
A	accept	772
A	target	Zarlman Two-Moons
S	Warrior/Shaman
T	label	EnterTB
T	completewith	ZamahTurnin2
A	goto	1456/1,182.67,-1315.51,60,0
A	zone	Thunder Bluff
S	Warrior
A	goto	1456/1,89.46,-1286.50
A	train	227
A	train	199
A	target	Ansekhwa
A	money	<0.020
S	Warrior
A	goto	1456/1,89.46,-1286.50
A	train	227
A	target	Ansekhwa
A	money	<0.010
S	Shaman
T	season	2
A	goto	1456/1,104.91,-1308.28
A	accept	76156
A	target	Boarton Shadetotem
A	train	410104,1
A	xp	<4,1
S	Warrior/Shaman
A	goto	1456/1,26.1,-1196.66
A	fp	Thunder Bluff
A	target	Tal
S	Warrior/Shaman
T	completewith	next
A	goto	1456/1,222.96,-1079.42,40,0
A	goto	1456/1,219.09,-1051.44,10
S	Warrior/Shaman
T	label	ZamahTurnin2
A	goto	1456/1,278.48,-995.29
A	turnin	853
A	target	Apothecary Zamah
A	isOnQuest	853
S	Warrior/Shaman
T	optional	
T	completewith	RiteofWisdomTurnin
A	use	5340
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<10.1
A	itemcount	5340,1
S	Warrior/Shaman
T	completewith	RiteofWisdomTurnin
A	goto	1456/1,213.56,-1112.19,55,0
A	goto	1412/1,327.88,-1529.21,40
A	zoneskip	Mulgore
S	Warrior/Shaman
T	xprate	<1.5
T	completewith	SacredBurialTurnIn
A	complete	766,1
A	complete	766,2
A	complete	766,3
A	complete	766,4
A	complete	761,1
S	Warrior/Shaman
T	xprate	>1.49
T	completewith	SacredBurialTurnIn
A	complete	766,1
A	complete	766,2
A	complete	766,3
A	complete	766,4
S	Warrior/Shaman
T	completewith	SacredBurialTurnIn
A	collect	4854,1,770
A	unitscan	Ghost Howl
S	Warrior/Shaman
T	label	RiteofWisdomTurnin
A	goto	1412/1,366.93,-1509.00
A	turnin	772
A	accept	773
A	target	Seer Wiserunner
S	Warrior/Shaman
T	completewith	next
A	destroy	4823
S	Warrior/Shaman
T	loop	
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
S	Shaman
T	season	2
T	completewith	next
A	collect	206975,1
A	mob	Bael'dun Digger
A	mob	Bael'dun Appraiser
A	train	425344,1
A	xp	<3,1
S	Warrior/Shaman
A	goto	1412/1,441.42,-1980.96
A	use	4702
A	complete	746,1
A	mob	Bael'dun Digger
A	mob	Bael'dun Appraiser
S	Shaman
T	season	2
T	loop	
A	goto	1412/1,347.4,-1906.3,0
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
T	completewith	SacredBurialTurnIn
A	aura	408828
A	mob	Bael'dun Digger
A	mob	Bael'dun Appraiser
A	train	425344,1
S	Warrior/Shaman
T	label	SacredBurial
A	goto	1412/1,-1026.88,-1150.40
A	accept	833
A	target	Lorekeeper Raintotem
S	Warrior/Shaman
T	completewith	next
A	complete	833,1
A	mob	Bristleback Interloper
S	Warrior/Shaman
A	goto	1412/1,-1109.08,-992.51
A	turnin	773
A	target	Ancestral Spirit
S	Warrior/Shaman
T	loop	
A	goto	1412/1,-1092.12,-1056.56,0
A	goto	1412/1,-1026.88,-1150.40,40,0
A	goto	1412/1,-1093.15,-1058.27,40,0
A	goto	1412/1,-1125.52,-1043.20,40,0
A	goto	1412/1,-1146.58,-1028.13,40,0
A	goto	1412/1,-1153.77,-988.40,40,0
A	goto	1412/1,-1117.81,-940.790,40,0
A	goto	1412/1,-1057.19,-940.790,40,0
A	goto	1412/1,-1042.80,-994.22,40,0
A	goto	1412/1,-1055.65,-1025.05,40,0
A	goto	1412/1,-1092.12,-1056.56,40,0
A	complete	833,1
A	mob	Bristleback Interloper
S	Warrior/Shaman
T	label	SacredBurialTurnIn
A	goto	1412/1,-1026.88,-1150.40
A	turnin	833
A	target	Lorekeeper Raintotem
S	Shaman
T	season	2
T	requires	MoltenBlast
A	cast	402265
A	use	206388
A	aura	-408828
A	itemStat	18,QUALITY,2
A	train	425344,1
A	xp	<3,1
S	Warrior/Shaman
T	xprate	<1.5
T	completewith	next
A	complete	766,1
A	complete	766,2
A	complete	766,3
A	complete	766,4
A	complete	761,1
S	Warrior/Shaman
T	xprate	>1.49
T	completewith	next
A	complete	766,1
A	complete	766,2
A	complete	766,3
A	complete	766,4
S	Warrior/Shaman
A	goto	1412/1,-712.98,-1922.74
A	turnin	749
A	accept	751
S	Warrior/Shaman
A	goto	1412/1,-365.17,-2227.56
A	turnin	766
A	target	Maur Raincaller
A	isQuestComplete	766
S	Warrior/Shaman
A	goto	1412/1,-353.86,-2336.14
A	accept	770
A	turnin	770
A	target	Skorn
A	target	Skorn Whitecloud
A	use	4854
A	itemcount	4854,1
S	Warrior/Shaman
A	goto	1412/1,-392.91,-2333.40
A	turnin	746
A	target	Baine Bloodhoof
S	Warrior/Shaman
A	goto	1412/1,-384.69,-2397.10
A	turnin	743
A	target	Ruul Eagletalon
S	Warrior/Shaman
T	xprate	<1.5
A	goto	1412/1,-454.56,-2304.63
A	turnin	761
A	target	Harken Windtotem
A	isQuestComplete	761
S	Shaman
A	goto	1412/1,-437.61,-2298.80
A	train	547
A	target	Narm Skychaser
A	xp	<12,1
S	Warrior
A	goto	1412/1,-496.17,-2347.78
A	train	7384
A	target	Krang Stonehoof
A	xp	<12,1
S	Warrior/Shaman
T	loop	
A	goto	1412/1,-784.9,-2350.18,0
A	goto	1412/1,-1016.6,-2410.12,50,0
A	goto	1412/1,-904.6,-2371.07,50,0
A	goto	1412/1,-784.9,-2350.18,50,0
A	goto	1412/1,-674.96,-2336.14,50,0
A	goto	1412/1,-597.9,-2301.54,50,0
A	goto	1412/1,-784.9,-2350.18,50,0
A	line	Mulgore,51.50,59.23,53.00,60.24,55.14,60.65,57.47,61.26,59.65,62.40
A	turnin	751
A	accept	764
A	accept	765
A	unitscan	Morin Cloudstalker
S	Warrior/Shaman
T	completewith	Fizsprocket
A	goto	1412/1,-1112.16,-1892.6,20
S	Shaman
T	season	2
T	completewith	VentureCoKills
A	complete	76156,1
A	train	410104,1
A	xp	<4,1
S	Warrior/Shaman
T	completewith	next
A	complete	764,1
A	mob	+Venture Co. Worker
A	complete	764,2
A	mob	+Venture Co. Supervisor
S	Warrior/Shaman
T	label	Fizsprocket
A	goto	1412/1,-1288.89,-1756.97
A	complete	765,1
A	mob	Supervisor Fizsprocket
S	Warrior/Shaman
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
A	goto	1412/1,-1122.95,-1476.80,0
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
S	Warrior/Shaman
T	optional	
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
S	Warrior/Shaman
T	optional	
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
S	Warrior/Shaman
T	loop	
A	goto	1412/1,-784.9,-2350.18,0
A	goto	1412/1,-1016.6,-2410.12,50,0
A	goto	1412/1,-904.6,-2371.07,50,0
A	goto	1412/1,-784.9,-2350.18,50,0
A	goto	1412/1,-674.96,-2336.14,50,0
A	goto	1412/1,-597.9,-2301.54,50,0
A	goto	1412/1,-784.9,-2350.18,50,0
A	line	Mulgore,51.50,59.23,53.00,60.24,55.14,60.65,57.47,61.26,59.65,62.40
A	turnin	764
A	turnin	765
A	unitscan	Morin Cloudstalker
S	Warrior
T	xprate	>1.49
A	goto	1412/1,-496.17,-2347.78
A	train	7384
A	target	Krang Stonehoof
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
S	Shaman
T	season	2
A	goto	1456/1,122.13,-1263.32
A	accept	744
A	target	Eyahn Eagletalon
A	train	410104,1
S	Shaman
T	season	2
T	completewith	next
A	zone	Mulgore
A	train	410104,1
A	xp	<4,1
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
T	loop	
A	goto	1412/1,460.94,-1040.46,0
A	goto	1412/1,460.94,-1040.46,20,0
A	goto	1412/1,528.76,-1075.39,20,0
A	goto	1412/1,525.68,-1174.38,20,0
A	collect	206170,8,76160,1
A	train	410104,1
A	xp	<4,1
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
A	train	410104,1
S	Shaman
T	season	2
A	complete	76160,1
A	use	206176
A	train	410104,1
A	xp	<4,1
S	Shaman
T	season	2
A	goto	1456/1,122.13,-1263.32
A	turnin	744
A	target	Eyahn Eagletalon
A	train	410104,1
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
S	Warrior/Shaman
T	optional	
A	abandon	766
S	Warrior/Shaman
T	xprate	>1.49
A	hs	
A	subzoneskip	380
A	bindlocation	380,1
A	use	6948
S	Warrior/Shaman
T	xprate	<1.5
T	completewith	MargozTurnIn
A	hs	
A	subzoneskip	362
A	bindlocation	362,1
A	use	6948
S	Warrior
T	xprate	<1.5
A	goto	1411/1,-4827.27,311.62
A	train	6546
A	target	Tarshaw Jaggedscar
A	xp	<12,1
S	Shaman
T	xprate	<1.5
A	goto	1411/1,-4839.96,307.04
A	train	8050
A	target	Swart
A	xp	<12,1
S	Shaman
T	xprate	<1.5
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
T	xprate	<1.5
T	label	CallofFire3
A	goto	1411/1,-3999.24,-268.95
A	turnin	1524
A	accept	1525
A	target	Telf Joolam
S	Warrior
T	xprate	<1.5
A	goto	1411/1,-4838.37,321.49
A	vendor	
A	target	Jark
S	Hunter
T	completewith	MargozTurnIn
A	mob	Venomtail Scorpid
A	train	16828,1
S	Shaman
T	xprate	<1.5
T	completewith	next
A	subzone	371
S	Shaman
T	xprate	<1.5
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
S	
T	xprate	<1.5 << !Hunter
T	completewith	next
A	goto	1411/1,-4939.36,824.51,80,0
A	goto	1411/1,-4945.18,1101.92,50
A	isQuestTurnedIn	806
S	
T	xprate	<1.5 << !Hunter
T	label	MargozTurnIn
A	goto	1411/1,-4945.18,1101.92
A	turnin	828
A	accept	827
A	target	Margoz
A	isQuestTurnedIn	806
S	!Warrior !Shaman !Hunter
T	xprate	<1.5
T	completewith	next
A	goto	1411/1,-4949.41,925.67,50,0
A	goto	1411/1,-4929.32,823.45,50,0
A	goto	1411/1,-4774.39,780.80,50
A	isQuestTurnedIn	828
S	Mage
T	xprate	<1.5
T	season	2
T	completewith	next
A	collect	203752,1
A	train	401768,1
S	!Warrior !Shaman !Hunter
T	xprate	<1.5
T	loop	
A	goto	1411/1,-4774.39,780.80,0
A	goto	1411/1,-4774.39,780.80,20,0
A	goto	1411/1,-4749.01,822.39,12,0
A	goto	1411/1,-4767.52,825.92,12,0
A	goto	1411/1,-4772.28,848.12,12,0
A	goto	1411/1,-4756.41,863.630,12,0
A	goto	1411/1,-4715.70,861.87,12,0
A	goto	1411/1,-4749.01,822.39,12,0
A	complete	827,1
A	mob	Burning Blade Thug
A	mob	Burning Blade Neophyte
A	mob	Burning Blade Cultist
A	isQuestTurnedIn	828
S	Mage
T	season	2
T	xprate	<1.5
T	loop	
A	goto	1411/1,-4774.39,780.80,0
A	goto	1411/1,-4774.39,780.80,20,0
A	goto	1411/1,-4749.01,822.39,12,0
A	goto	1411/1,-4767.52,825.92,12,0
A	goto	1411/1,-4772.28,848.12,12,0
A	goto	1411/1,-4756.41,863.630,12,0
A	goto	1411/1,-4715.70,861.87,12,0
A	goto	1411/1,-4749.01,822.39,12,0
A	collect	203752,1
A	mob	Burning Blade Thug
A	mob	Burning Blade Neophyte
A	mob	Burning Blade Cultist
A	train	401768,1
S	Mage
T	xprate	<1.5
T	season	2
A	collect	211779,1
A	train	401768
A	use	203752
A	itemcount	203752,1
S	Warrior/Shaman/Hunter
T	xprate	<1.5 << !Hunter
T	completewith	Gazzuz
A	goto	1411/1,-4876.97,1452.310,60
S	Warrior/Shaman/Hunter
T	xprate	<1.5 << !Hunter
T	completewith	Gazzuz
A	complete	813,1
A	mob	Venomtail Scorpid
A	itemcount	4904,<1
S	Warrior/Shaman/Hunter
T	xprate	<1.5 << !Hunter
T	completewith	Gazzuz
A	goto	1411/1,-4855.82,1498.84,15,0
A	goto	1411/1,-4833.08,1494.96,15,0
A	goto	1411/1,-4805.59,1495.67,15,0
A	goto	1411/1,-4784.44,1535.85,15,0
A	goto	1411/1,-4750.60,1531.62,15,0
A	goto	1411/1,-4734.21,1505.54,15,0
A	goto	1411/1,-4693.49,1519.64,15,0
A	goto	1411/1,-4679.75,1501.31,15,0
A	goto	1411/1,-4684.50,1466.06,15,0
A	complete	827,1
A	complete	5726,1
A	mob	Burning Blade Fanatic
A	mob	Burning Blade Apprentice
S	Warrior/Shaman/Hunter
T	xprate	<1.5 << !Hunter
T	label	Gazzuz
A	goto	1411/1,-4701.42,1455.83
A	collect	4903,1,832,1
A	accept	832
A	use	4903
A	unitscan	Gazz'uz
S	Warrior/Shaman/Hunter
T	xprate	<1.5 << !Hunter
T	loop	
A	goto	1411/1,-4805.59,1495.67,0
A	goto	1411/1,-4855.82,1498.84,15,0
A	goto	1411/1,-4833.08,1494.96,15,0
A	goto	1411/1,-4805.59,1495.67,15,0
A	goto	1411/1,-4784.44,1535.85,15,0
A	goto	1411/1,-4750.60,1531.62,15,0
A	goto	1411/1,-4734.21,1505.54,15,0
A	goto	1411/1,-4693.49,1519.64,15,0
A	goto	1411/1,-4679.75,1501.31,15,0
A	goto	1411/1,-4684.50,1466.06,15,0
A	goto	1411/1,-4805.59,1495.67,15,0
A	complete	827,1
A	complete	5726,1
A	mob	Burning Blade Fanatic
A	mob	Burning Blade Apprentice
S	Warrior/Shaman/Hunter
T	xprate	<1.5 << !Hunter
T	completewith	Ravine
A	complete	813,1
A	mob	Venomtail Scorpid
A	itemcount	4904,<1
S	
T	xprate	<1.5 << !Hunter
A	goto	1411/1,-4945.18,1101.92
A	turnin	827
A	accept	829
A	target	Margoz
A	isQuestTurnedIn	806
S	
T	xprate	<1.5
T	label	Ravine
T	completewith	next
A	subzone	370
S	
T	xprate	<1.5
T	loop	
A	goto	1411/1,-4816.69,972.910,0
A	goto	1411/1,-4818.81,848.48,40,0
A	goto	1411/1,-4755.36,952.82,40,0
A	goto	1411/1,-4704.07,964.10,40,0
A	goto	1411/1,-4818.28,975.38,40,0
A	goto	1411/1,-4718.87,1076.19,40,0
A	goto	1411/1,-4672.87,1131.89,40,0
A	goto	1411/1,-4816.69,972.910,40,0
A	complete	835,1
A	mob	+Dustwind Savage
A	complete	835,2
A	mob	+Dustwind Storm Witch
S	skip
T	xprate	<1.5
T	softcore	
T	completewith	SecuringLinesTurnIn
A	deathskip	
A	isQuestComplete	813 << Warrior/Shaman/Hunter
S	
T	xprate	<1.5
T	completewith	next
A	goto	1411/1,-4804.53,830.5,60,0
A	goto	1411/1,-4698.78,842.48,60,0
A	goto	1411/1,-4414.31,999.70,60
S	
T	xprate	<1.5
T	label	SecuringLinesTurnIn
A	goto	1411/1,-4414.31,999.70
A	turnin	835
A	target	Rezlak
S	Warrior/Shaman/Hunter
T	xprate	<1.5 << !Hunter
T	loop	
A	goto	1411/1,-4010.35,1031.42,0
A	goto	1411/1,-4217.09,1087.47,60,0
A	goto	1411/1,-4100.24,1113.2,60,0
A	goto	1411/1,-4108.7,1229.88,60,0
A	goto	1411/1,-4013.52,1209.08,60,0
A	goto	1411/1,-4010.35,1031.42,60,0
A	complete	813,1
A	mob	Venomtail Scorpid
A	itemcount	4904,<1
S	
T	xprate	<1.5 << Warrior/Shaman/Hunter
T	completewith	Admiralorders1 << !Warrior !Shaman !Hunter
T	completewith	NeeruFireblade << Warrior/Shaman/Hunter
A	goto	1454/1,-4367.46,1405.44,50,0
A	zone	Orgrimmar
S	!Rogue
T	xprate	<1.5 << Shaman/Warrior
A	goto	1454/1,-4342.77,1616.56,15,0
A	goto	1454/1,-4347.54,1634.33
A	vendor	
A	target	Urtharo
S	Shaman/Warrior
T	xprate	<1.5
T	label	Gryhskaturnin1
A	goto	1454/1,-4439.37,1633.99
A	turnin	6384
A	accept	6385
A	target	Innkeeper Gryshka
S	Shaman/Warrior
T	xprate	<1.5
A	goto	Orgrimmar,45.120,63.889
A	turnin	6385
A	accept	6386
A	target	Doras
S	Shaman
T	xprate	<1.5
A	goto	1454/1,-4225.09,1933.29
A	train	8050
A	target	Kardris Dreamseeker
S	Rogue
A	goto	1454/1,-4355.53,1520.68
A	collect	3135,1,354,1
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
S	Troll Priest
A	goto	1454/1,-4179.79,1452.580
A	turnin	5654
A	trainer	
A	target	Ur'kyo
A	isOnQuest	5654
S	Troll Priest
A	goto	1454/1,-4179.79,1452.580
A	turnin	5652
A	trainer	
A	target	Ur'kyo
S	Mage
A	goto	1454/1,-4218.22,1473.63
A	train	122
A	target	Pephredo
S	Warrior
T	xprate	<1.5
T	completewith	next
A	goto	1454/1,-4634.65,1911.96,30
S	Warrior
T	xprate	<1.5
A	goto	1454/1,-4801.7,1981.47
A	train	6546
A	target	Grezz Ragefist
S	!Warrior !Shaman !Hunter
T	label	Admiralorders1
A	goto	1454/1,-4133.36,1939.000
A	turnin	831
A	target	Nazgrel
S	Warrior/Shaman/Hunter
T	xprate	<1.5 << !Hunter
A	goto	1454/1,-4125.79,1920.10
A	turnin	5726
A	accept	5727
A	target	Thrall
A	isQuestComplete	5726
A	dungeon	RFC
S	Warrior/Shaman/Hunter
T	xprate	<1.5 << !Hunter
A	goto	1454/1,-4125.79,1920.10
A	turnin	5726
A	target	Thrall
A	isQuestComplete	5726
A	dungeon	!RFC
S	Rogue
A	goto	1454/1,-4280.21,1773.15
A	accept	1963
A	target	Therzok
S	Warrior/Shaman/Hunter
T	xprate	<1.5 << !Hunter
A	goto	1454/1,-4343.19,1772.68
A	turnin	813
A	target	Kor'ghan
A	itemcount	4904,<1
S	Warlock
A	goto	1454/1,-4362.13,1834.51
A	train	1120
A	target	Mirket
S	
T	xprate	<1.5 << !Hunter
A	goto	1454/1,-4374.75,1800.93
A	turnin	829
A	turnin	832
A	accept	809
A	target	Neeru Fireblade
A	isQuestTurnedIn	827
A	isOnQuest	832
S	
T	xprate	<1.5 << !Hunter
T	label	NeeruFireblade
A	goto	1454/1,-4374.75,1800.93
A	turnin	829
A	accept	809
A	target	Neeru Fireblade
A	isQuestTurnedIn	827
S	Rogue
T	season	2
A	goto	1454/1,-4464.24,1853.97
A	collect	204174,1
A	train	400081,1
S	Rogue
T	season	2
A	train	400081
A	use	204174
A	itemcount	204174,1
S	skip --!Warrior !Shaman !Hunter
T	softcore	
T	completewith	ZeptoUC1
A	goto	1454/1,-4424.40,1817.58
A	subzone	2437
S	skip --!Warrior !Shaman !Hunter
T	softcore	
T	completewith	ZeptoUC1
A	goto	1411/1,-4450.27,1188.64
A	deathskip	
S	!Warrior !Shaman !Hunter
T	completewith	ZeptoUC1
A	zone	Durotar
A	zoneskip	Durotar
S	skip --Warrior/Shaman/Hunter
T	xprate	<1.5 << !Hunter
T	softcore	
T	completewith	FoundtheCure
A	goto	1454/1,-4424.40,1817.58
A	subzone	2437
S	skip --Warrior/Shaman/Hunter
T	xprate	<1.5 << !Hunter
T	softcore	
T	completewith	FoundtheCure
A	goto	1411/1,-4450.27,1188.64
A	deathskip	
S	Warrior/Shaman/Hunter
T	xprate	<1.5 << !Hunter
T	completewith	FoundtheCure
A	zone	Durotar
A	zoneskip	Durotar
S	Warrior/Shaman/Hunter
T	xprate	<1.5 << !Hunter
T	label	FoundtheCure
A	goto	1411/1,-4158.93,1153.04
A	accept	812
A	turnin	812
A	target	Rhinag
S	Warrior
T	xprate	<1.5 << !Hunter
A	goto	1411/1,-4183.78,950.7,90,0
A	goto	1411/1,-4034.14,692.67
A	complete	1498,1
A	mob	Lightning Hide
S	Warrior/Shaman/Hunter
T	xprate	<1.5 << !Hunter
A	goto	1411/1,-3802.55,650.72,50,0 << !Warrior
A	goto	1411/1,-3803.08,503.38,50,0 << !Warrior
A	goto	1411/1,-3783.51,238.65,50,0
A	goto	1411/1,-3774.53,150.88,50,0
A	goto	1411/1,-3797.79,317.260
A	complete	816,1
A	mob	Dreadmaw Crocolisk
S	Warrior/Shaman/Hunter
T	xprate	<1.5 << !Hunter
A	goto	1411/1,-4241.94,742.37
A	turnin	816
A	target	Misha Tor'kren
A	isQuestComplete	816
S	Warrior/Shaman/Hunter
T	xprate	<1.5 << !Hunter
T	label	FarWatchPost
A	goto	1413/1,-3686.10,303.14,40
A	zoneskip	The Barrens
S	Hunter
A	goto	1413/1,-3687.11,303.14
A	turnin	840
A	accept	842
A	target	Kargal Battlescar
S	Warrior/Shaman/Hunter
T	xprate	<1.5 << !Hunter
T	label	Akzeloth
A	goto	1413/1,-3694.2,256.52
A	turnin	809
A	accept	924
A	target	Ak'Zeloth
A	isQuestTurnedIn	829
S	Warrior/Shaman/Hunter
T	xprate	<1.5 << !Hunter
A	goto	1413/1,-3694.2,259.22
A	turnin	926
A	isOnQuest	924
S	Warrior
A	goto	1413/1,-3598.95,186.93
A	turnin	1498
A	accept	1502
A	target	Uzzek
S	Mage
T	xprate	>1.49
T	season	2
T	loop	
A	goto	1411/1,-4761.17,1490.73,0
A	goto	1411/1,-4868.51,1466.76,30,0
A	goto	1411/1,-4854.23,1500.6,30,0
A	goto	1411/1,-4806.12,1486.15,30,0
A	goto	1411/1,-4761.17,1490.73,30,0
A	collect	203752,1
A	mob	Burning Blade Thug
A	mob	Burning Blade Neophyte
A	mob	Burning Blade Cultist
A	train	401768,1
S	Mage
T	xprate	>1.49
T	season	2
A	collect	211779,1
A	train	401768
A	use	203752
A	itemcount	203752,1
S	Rogue/Mage/Priest/Warlock
T	label	ZeptoUC1
A	goto	1411/1,-4648.55,1321.88,40
A	zone	Tirisfal Glades
A	zoneskip	Tirisfal Glades
S	
T	optional	
A	abandon	816
E
G	Guides/forever/Horde-01-12_Durotar.lua
M	classic	
M	tbc	
M	selector	Horde
M	xprate	<1.99
M	name	10-12 Tirisfal
M	version	11
M	group	RestedXP Forever Guide (H)
M	subgroup	Speedrun Guide 1-22
M	defaultfor	Troll Rogue/Orc Rogue/Orc Warlock/Troll Mage/Troll Priest
M	next	12-14 Silverpine Forest << Undead/Troll Rogue/Orc Rogue/Orc Warlock/Troll Mage/Troll Priest
S	Orc Rogue/Troll Rogue
T	completewith	Swordtraining1
A	goto	1420/0,240.75,1877.57,20,0
A	zone	Undercity
A	zoneskip	Undercity
A	money	<0.3023
S	Orc Rogue/Troll Rogue
T	completewith	Swordtraining1
A	goto	1458/0,239.14,1749.54,20,0
A	goto	1458/0,255.64,1724.70,20,0
A	goto	1458/0,240.68,1706.97,10,0
A	goto	1458/0,241.06,1660.12,10,0
A	goto	1458/0,257.08,1623.38,10,0
A	goto	1458/0,244.51,1598.73,15
A	money	<0.3023
S	Orc Rogue/Troll Rogue
A	goto	1458/0,266.39,1567.11
A	fp	Undercity
A	target	Michael Garrett
A	money	<0.3023
S	Orc Rogue/Troll Rogue
T	label	Swordtraining1
A	goto	1458/0,323.57,1668.50
A	train	201
A	target	Archibald
A	money	<0.3023
S	Orc Rogue/Troll Rogue
T	ssf	
T	optional	
T	label	RogueCutlass1
A	goto	1458/0,286.53,1616.21
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
A	goto	1458/0,286.53,1616.21
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
A	goto	1458/0,257.27,1560.450
A	collect	3164,6,429,1
A	target	Auctioneer Rhyker
A	zoneskip	Undercity,1
S	skip --Orc Rogue/Troll Rogue
A	goto	1458/0,59.07,1747.75
A	goto	1458/0,221.78,1780.14,30
A	link	https://www.youtube.com/watch?v=-Bi95bCN8dM
A	zoneskip	Undercity,1
S	
T	completewith	next
A	zone	Tirisfal Glades
A	zoneskip	Undercity,1
S	
T	completewith	DeliverytoSPF
A	goto	1420/0,253.4,2234.85,80
S	
A	accept	354
A	accept	362
A	target	+Coleman Farthing
A	goto	1420/0,244.36,2262.26
A	accept	375
A	target	+Gretchen Dedmar
A	goto	1420/0,236.68,2249.01
A	maxlevel	11 << !Warrior !Warlock
A	maxlevel	12 << Warlock
A	maxlevel	13 << Warrior
S	Warrior
T	optional	
A	abandon	1505
A	isOnQuest	1505
S	Warrior
T	optional	
A	abandon	1498
A	isOnQuest	1498
S	Warrior
A	goto	1420/0,238.49,2254.43
A	accept	1818
A	target	Austil de Mon
A	isQuestAvailable	1498
S	Warlock
A	goto	1420/0,248.88,2251.12
A	accept	1478
A	target	Ageron Kargal
A	isQuestAvailable	1504
S	Undead Rogue
A	goto	1420/0,243.01,2270.70
A	accept	1885
A	target	Marion Call
S	Mage
A	goto	1420/0,233.52,2256.84
A	accept	1881
A	target	Cain Firesong
S	!Mage
A	goto	1420/0,244.81,2269.19
A	vendor	
A	collect	1179,20,367,1 << Mage/Priest/Shaman
A	collect	4605,20,367,1 << Rogue/Warrior
A	collect	1179,15,367,1 << Warlock
A	collect	4605,15,367,1 << Warlock
A	money	<0.075 << Warlock
A	money	<0.05 << !Warlock
A	target	Innkeeper Renee
S	
A	goto	1420/0,270.12,2253.23
A	collect	4496,1,398,1
A	target	Mrs. Winters
A	money	<0.05
S	
T	season	0,1
A	goto	1420/0,295.42,2277.93
A	accept	427
A	target	Executor Zygand
A	maxlevel	10 << !Warlock
A	maxlevel	11 << Warlock
S	
T	season	2
A	goto	1420/0,295.42,2277.93
A	accept	427
A	target	Executor Zygand
A	maxlevel	10 << !Warlock !Rogue
A	maxlevel	11 << Warlock
A	train	400095,1 << Rogue
S	Rogue
T	season	2
T	optional	
A	goto	1420/0,295.42,2277.93
A	accept	427
A	target	Executor Zygand
A	maxlevel	10
S	
T	season	0,1
A	goto	1420/0,288.64,2285.46
A	accept	398
A	maxlevel	11 << !Warrior !Warlock
A	maxlevel	12 << Warlock
A	maxlevel	13 << Warrior
S	
T	season	2
A	goto	1420/0,288.64,2285.46
A	accept	398
A	maxlevel	11 << !Warrior !Warlock !Rogue
A	maxlevel	12 << Warlock/Rogue
A	maxlevel	13 << Warrior
A	train	400095,1 << Rogue
S	
A	goto	1420/0,265.15,2305.94
A	accept	358
A	target	Magistrate Sevren
A	maxlevel	10
S	
A	goto	1420/0,346.94,2258.950
A	accept	445
A	accept	367
A	target	Apothecary Johaan
A	maxlevel	10 << !Warlock
A	maxlevel	11 << Warlock
S	
T	label	DeliverytoSPF
A	goto	1420/0,346.94,2258.950
A	accept	445
A	target	Apothecary Johaan
S	
A	goto	1420/0,403.42,2287.57
A	accept	404
A	target	Deathguard Dillinger
A	maxlevel	10 << !Warlock
A	maxlevel	11 << Warlock
S	Warrior
A	goto	1420/0,403.87,2287.87
A	turnin	1818
A	accept	1819
A	target	Deathguard Dillinger
A	isQuestAvailable	1498
S	Warrior
A	goto	1420/0,360.04,2376.14
A	complete	1819,1
A	mob	Ulag the Cleaver
A	isQuestAvailable	1498
S	Warrior
A	goto	1420/0,403.87,2287.87
A	turnin	1819
A	accept	1820
A	target	Deathguard Dillinger
A	isQuestAvailable	1498
S	
T	optional	
T	completewith	Pumpkins
A	complete	367,1
A	mob	Decrepit Darkhound
A	mob	Cursed Darkhound
A	isOnQuest	367
S	
T	optional	
T	label	Claws
T	loop	
A	goto	1420/0,655.12,2120.98,0
A	goto	1420/0,550.28,2315.28,50,0
A	goto	1420/0,622.58,2322.51,50,0
A	goto	1420/0,678.16,2319.80,50,0
A	goto	1420/0,716.12,2282.15,50,0
A	goto	1420/0,682.23,2218.58,50,0
A	goto	1420/0,670.48,2128.81,50,0
A	goto	1420/0,595.47,2134.53,50,0
A	goto	1420/0,613.54,2082.72,50,0
A	goto	1420/0,655.12,2120.98,50,0
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
A	goto	1420/0,1184.71,2205.63
A	accept	365
A	target	Deathguard Simmer
A	maxlevel	10 << !Warlock
A	maxlevel	11 << Warlock
S	Rogue
T	season	2
T	optional	
A	goto	1420/0,1184.71,2205.63
A	accept	365
A	target	Deathguard Simmer
A	maxlevel	10
S	Mage
T	season	2
T	completewith	next
A	goto	1420/0,1374.05,2302.93,0
A	goto	1420/0,1461.71,2293.89,0
A	collect	208183,6
A	mob	Odd Melon
A	train	415942,1
A	train	118,3
S	
T	optional	
T	loop	
A	goto	1420/0,1378.12,2328.54,0
A	goto	1420/0,1352.36,2265.88,50,0
A	goto	1420/0,1377.66,2328.54,50,0
A	goto	1420/0,1402.06,2359.27,50,0
A	goto	1420/0,1448.16,2336.67,50,0
A	goto	1420/0,1438.21,2303.84,50,0
A	goto	1420/0,1471.20,2283.65,50,0
A	goto	1420/0,1378.12,2328.54,50,0
A	complete	365,1
A	isOnQuest	365
S	
T	optional	
T	loop	
A	goto	1420/0,1597.27,2290.28,0
A	goto	1420/0,1509.16,2351.13,50,0
A	goto	1420/0,1512.77,2299.02,50,0
A	goto	1420/0,1597.27,2290.28,50,0
A	goto	1420/0,1676.80,2316.79,50,0
A	goto	1420/0,1681.78,2354.14,50,0
A	goto	1420/0,1649.69,2405.66,50,0
A	goto	1420/0,1632.07,2436.690,50,0
A	goto	1420/0,1580.56,2487.00,50,0
A	goto	1420/0,1509.16,2473.14,50,0
A	goto	1420/0,1492.44,2395.11,50,0
A	goto	1420/0,1509.16,2351.13,50,0
A	complete	427,1
A	mob	Scarlet Warrior
A	isOnQuest	427
S	
T	optional	
T	completewith	next
A	complete	375,1
A	mob	Greater Duskbat
A	mob	Vampiric Duskbat
A	isOnQuest	375
S	
T	optional	
T	label	Darkhounds1
T	loop	
A	goto	1420/0,757.69,2346.01,0
A	goto	1420/0,959.23,2302.63,50,0
A	goto	1420/0,994.93,2389.69,50,0
A	goto	1420/0,906.36,2470.73,50,0
A	goto	1420/0,757.69,2346.01,50,0
A	complete	367,1
A	mob	Decrepit Darkhound
A	mob	Cursed Darkhound`
A	isOnQuest	367
S	
T	optional	
T	softcore	
T	completewith	ProofofDemiseTurnin
A	deathskip	
A	isQuestComplete	427
A	xp	>10,1
S	
T	optional	
T	softcore	
T	completewith	ProofofDemiseTurnin
A	goto	1420/0,403.42,2288.17,120
A	isQuestComplete	427
A	xp	<10,1
S	
T	optional	
T	hardcore	
T	completewith	ProofofDemiseTurnin
A	goto	1420/0,403.42,2288.17,120
A	isQuestComplete	427
S	
T	optional	
A	goto	1420/0,403.42,2288.17
A	turnin	404
A	accept	426
A	isQuestComplete	404
A	target	Deathguard Dillinger
S	
T	optional	
A	goto	1420/0,403.42,2288.17
A	accept	426
A	isQuestTurnedIn	404
A	target	Deathguard Dillinger
S	
T	optional	
A	goto	1420/0,346.94,2258.950
A	turnin	367
A	accept	368
A	isQuestComplete	367
A	target	Apothecary Johaan
S	
T	optional	
A	goto	1420/0,346.94,2258.950
A	accept	368
A	isQuestTurnedIn	367
A	target	Apothecary Johaan
S	
T	optional	
A	goto	1420/0,346.94,2258.950
A	turnin	365
A	accept	407
A	isQuestComplete	365
A	target	Apothecary Johaan
S	
T	optional	
A	goto	1420/0,346.94,2258.950
A	accept	407
A	isQuestTurnedIn	365
A	target	Apothecary Johaan
S	
T	optional	
A	goto	1420/0,295.87,2277.93
A	turnin	427
A	accept	370
A	target	Executor Zygand
A	isQuestComplete	427
S	
T	optional	
A	goto	1420/0,295.87,2277.93
A	accept	370
A	target	Executor Zygand
A	isQuestTurnedIn	427
S	
T	optional	
T	label	ProofofDemiseTurnin
A	goto	1420/0,280.06,2270.70
A	accept	374
A	target	Deathguard Burgess
A	isQuestTurnedIn	427
S	Warlock/Mage
T	completewith	UCflightpath1
A	goto	1420/0,240.75,1877.57,20,0
A	zone	Undercity
A	zoneskip	Undercity
S	Warlock/Mage
T	completewith	UCflightpath1
A	goto	1458/0,239.14,1749.54,35,0
A	goto	1458/0,255.64,1724.70,35,0
A	goto	1458/0,240.68,1706.97,10,0
A	goto	1458/0,241.06,1660.12,10,0
A	goto	1458/0,257.08,1623.38,10,0
A	goto	1458/0,244.51,1598.73,15
S	Warlock/Mage
T	label	UCflightpath1
A	goto	1458/0,266.39,1567.11
A	fp	Undercity
A	target	Michael Garrett
S	Warlock/Mage
T	optional	
T	ah	
A	goto	1458/0,257.27,1560.450
A	collect	3164,6,429,1
A	target	Auctioneer Rhyker
A	zoneskip	Undercity,1
S	Warlock
A	goto	1458/0,57.05,1711.77
A	turnin	1478
A	accept	1473
A	isQuestAvailable	1504
S	Mage
T	optional	
A	abandon	1883
A	isOnQuest	1883
S	Mage
A	goto	1458/0,56.57,1813.49
A	turnin	1881
A	accept	1882
A	target	Anastasia Hartwell
S	Undead Priest
T	completewith	TouchofWeakness
A	goto	1420/0,240.75,1877.57,20,0
A	zone	Undercity
A	zoneskip	Undercity
S	Undead Priest
T	completewith	TouchofWeakness
A	goto	1458/0,239.14,1749.54,35,0
A	goto	1458/0,255.64,1724.70,35,0
A	goto	1458/0,240.68,1706.97,10,0
A	goto	1458/0,241.06,1660.12,10,0
A	goto	1458/0,257.08,1623.38,10,0
A	goto	1458/0,244.51,1598.73,15
S	Undead Priest
T	optional	
T	ah	
A	goto	1458/0,257.27,1560.450
A	collect	3164,6,429,1
A	target	Auctioneer Rhyker
A	zoneskip	Undercity,1
S	Undead Priest
T	optional	
A	goto	1458/0,403.29,1760.61
A	turnin	5660
A	target	Aelthalyste
A	isOnQuest	5660
S	Undead Priest
T	label	TouchofWeakness
A	goto	1458/0,403.29,1760.61
A	accept	5658
A	turnin	5658
A	target	Aelthalyste
S	Rogue
T	completewith	Swordtraining2
A	goto	1420/0,240.75,1877.57,20,0
A	zone	Undercity
A	zoneskip	Undercity
A	money	<0.3023
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
S	Rogue
T	completewith	Swordtraining2
A	goto	1458/0,239.14,1749.54,20,0
A	goto	1458/0,255.64,1724.70,20,0
A	goto	1458/0,240.68,1706.97,10,0
A	goto	1458/0,241.06,1660.12,10,0
A	goto	1458/0,257.08,1623.38,10,0
A	goto	1458/0,244.51,1598.73,15
A	money	<0.3023
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
S	Rogue
A	goto	1458/0,266.39,1567.11
A	fp	Undercity
A	target	Michael Garrett
A	money	<0.3023
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
S	Orc Rogue/Troll Rogue
T	ssf	
T	optional	
T	label	RogueCutlass2
A	goto	1458/0,286.53,1616.21
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
A	goto	1458/0,286.53,1616.21
A	collect	851,1,354,1
A	money	<0.3023
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
A	target	Louis Warren
A	zoneskip	Undercity,1
S	Undead Rogue
A	goto	1458/0,71.92,1435.70
A	turnin	1885
A	accept	1886
A	target	Mennet Carkad
A	money	<0.2023
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
A	zoneskip	Undercity,1
S	Rogue
T	label	Swordtraining2
A	goto	1458/0,323.57,1668.50
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
A	goto	1458/0,257.27,1560.450
A	collect	3164,6,429,1
A	target	Auctioneer Rhyker
A	zoneskip	Undercity,1
S	Warlock/Mage/Rogue
T	optional	
A	goto	1458/0,419.89,1627.54,50,0
A	goto	1458/0,428.52,1597.20,10,0
A	goto	1458/0,439.17,1626.06,10,0
A	goto	1458/0,476.78,1632.150,10,0
A	goto	1458/0,482.34,1660.63,10,0
A	goto	1458/0,539.33,1665.49,15,0
A	goto	1458/0,610.42,1684.44,35,0
A	goto	1458/0,663.19,1600.46,35,0
A	goto	1420/0,724.25,1682.66,50,0
A	zone	Tirisfal Glades
A	zoneskip	Tirisfal Glades
S	Undead Priest
T	optional	
A	goto	1458/0,419.89,1627.54,50,0
A	goto	1458/0,428.52,1597.20,10,0
A	goto	1458/0,439.17,1626.06,10,0
A	goto	1458/0,476.78,1632.150,10,0
A	goto	1458/0,482.34,1660.63,10,0
A	goto	1458/0,539.33,1665.49,15,0
A	goto	1458/0,610.42,1684.44,35,0
A	goto	1458/0,663.19,1600.46,35,0
A	goto	1420/0,724.25,1682.66,50,0
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
A	goto	1420/0,726.06,1801.95
A	complete	1473,1
A	isQuestAvailable	1504
S	
T	optional	
T	label	ScarletCrusade1
T	loop	
A	goto	1420/0,727.42,1742.31,0
A	goto	1420/0,770.80,1762.79,40,0
A	goto	1420/0,763.57,1820.93,40,0
A	goto	1420/0,721.54,1857.38,40,0
A	goto	1420/0,694.88,1848.04,40,0
A	goto	1420/0,641.56,1800.45,40,0
A	goto	1420/0,651.05,1748.93,40,0
A	goto	1420/0,685.39,1741.70,40,0
A	goto	1420/0,727.42,1742.31,40,0
A	complete	370,1
A	mob	+Captain Perrine
A	complete	370,2
A	mob	+Scarlet Zealot
A	complete	370,3
A	mob	+Scarlet Missionary
A	isOnQuest	370
S	Warlock
A	goto	1420/0,726.06,1801.95
A	complete	1473,1
A	isQuestAvailable	1504
S	Warlock
T	completewith	next
A	goto	1458/0,714.8,1604.24,35,0
A	goto	1458/0,652.73,1623.44,35,0
A	goto	1458/0,634.02,1669.66,35,0
A	goto	1458/0,539.52,1665.17,10,0
A	goto	1458/0,481.48,1659.8,10,0
A	goto	1458/0,476.49,1632.15,10,0
A	goto	1458/0,439.08,1627.02,10,0
A	goto	1458/0,435.05,1598.86,10,0
A	zone	Undercity
S	Warlock
A	goto	1458/0,57.05,1711.77
A	turnin	1473
A	accept	1471
A	target	Carendin Halgar
A	isQuestAvailable	1504
S	Warlock
T	completewith	next
A	goto	1458/0,41.99,1704.480
A	cast	9221
A	use	6284
S	Warlock
A	goto	1458/0,41.99,1704.480
A	complete	1471,1
A	mob	Summoned Voidwalker
A	use	6284
A	isQuestAvailable	1504
S	Warlock
A	goto	1458/0,57.34,1711.71
A	turnin	1471
A	target	Carendin Halgar
A	isQuestAvailable	1504
S	skip --Warlock
A	goto	1458/0,59.07,1747.75
A	goto	1458/0,221.78,1780.14,30
A	link	https://www.youtube.com/watch?v=-Bi95bCN8dM
A	zoneskip	Undercity,1
S	Warlock
T	completewith	next
A	goto	1420/0,235.32,1883.89,50,0
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
A	goto	1420/0,882.41,2511.1,150
A	isOnQuest	362
S	
T	optional	
T	completewith	ThurmanGregor
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
T	optional	
T	label	KillDevlin
A	goto	1420/0,894.16,2609.00
A	complete	362,1
A	mob	Devlin Agamand
A	isOnQuest	362
S	
T	optional	
A	goto	1420/0,803.78,2752.40
A	complete	354,2
A	mob	Nissa Agamand
A	isOnQuest	354
S	
T	optional	
T	label	ThurmanGregor
T	loop	
A	goto	1420/0,996.28,2899.11,0
A	goto	1420/0,1058.19,2775.59,60,0
A	goto	1420/0,998.54,2903.93,60,0
A	goto	1420/0,919.01,2939.770,60,0
A	goto	1420/0,1098.40,2875.61,60,0
A	goto	1420/0,1098.40,2875.61,60,0
A	goto	1420/0,996.28,2899.11,60,0
A	complete	354,3
A	unitscan	+Thurman Agamand
A	complete	354,1
A	unitscan	+Gregor Agamand
A	isOnQuest	354
S	
T	loop	
T	label	MillsOverun
A	goto	1420/0,996.28,2899.11,0
A	goto	1420/0,1058.19,2775.59,60,0
A	goto	1420/0,998.54,2903.93,60,0
A	goto	1420/0,919.01,2939.770,60,0
A	goto	1420/0,1098.40,2875.61,60,0
A	goto	1420/0,1098.40,2875.61,60,0
A	goto	1420/0,996.28,2899.11,60,0
A	complete	426,1
A	mob	+Rattlecage Soldier
A	mob	+Cracked Skull Soldier
A	complete	426,2
A	mob	+Darkeye Bonecaster
A	isOnQuest	426
S	
T	requires	MillsOverun
T	optional	
T	completewith	MaggotEye
A	goto	1420/0,578.75,2886.75,15,0
A	goto	1420/0,557.96,2850.91,15,0
A	goto	1420/0,510.06,2865.06,15,0
A	goto	1420/0,477.98,2860.55,40,0
A	goto	1420/0,422.85,2882.84,50
A	isQuestComplete	354
S	
T	optional	
T	requires	MillsOverun
T	completewith	next
A	complete	358,2
A	complete	358,3
A	mob	Rot Hide Gnoll
A	mob	Rot Hide Mongrel
A	isOnQuest	358
S	
T	optional	
T	requires	MillsOverun
T	label	MaggotEye
A	goto	1420/0,382.63,2910.55
A	complete	398,1
A	mob	Maggot Eye
S	
T	optional	
T	loop	
A	goto	1420/0,342.87,2998.22,0
A	goto	1420/0,350.10,2962.37,50,0
A	goto	1420/0,342.87,2998.22,50,0
A	goto	1420/0,293.16,2974.12,50,0
A	goto	1420/0,254.75,2951.820,50,0
A	goto	1420/0,188.33,2950.02,50,0
A	goto	1420/0,65.42,2927.12,50,0
A	goto	1420/0,-15.92,2964.78,50,0
A	goto	1420/0,-49.36,3040.39,50,0
A	goto	1420/0,342.87,2998.22,50,0
A	complete	368,1
A	mob	Vile Fin Puddlejumper
A	mob	Vile Fin Minor Oracle
A	mob	Vile Fin Muckdweller
A	isOnQuest	368
S	
T	optional	
T	completewith	RotHideGnolls
A	complete	375,1
A	mob	Greater Duskbat
A	mob	Vampiric Duskbat
A	isOnQuest	375
S	Mage
T	season	2
T	optional	
T	completewith	RotHideGnolls
A	goto	1420/0,329.31,2838.25,0
A	goto	1420/0,395.29,2774.69,0
A	goto	1420/0,318.02,2722.57,0
A	collect	208183,6
A	mob	Odd Melon
A	train	415942,1
A	train	118,3
S	
T	optional	
T	label	RotHideGnolls
T	loop	
A	goto	1420/0,537.18,2555.98,0
A	goto	1420/0,488.83,2642.44,40,0
A	goto	1420/0,561.13,2596.65,40,0
A	goto	1420/0,597.73,2514.11,40,0
A	goto	1420/0,537.18,2555.98,40,0
A	goto	1420/0,483.40,2514.41,40,0
A	goto	1420/0,537.18,2555.98,40,0
A	complete	358,2
A	complete	358,1
A	complete	358,3
A	mob	Rot Hide Mongrel
A	mob	Rot Hide Graverobber
A	isOnQuest	358
S	
T	optional	
T	softcore	
T	completewith	MillsTurnin
A	deathskip	
A	xp	>10,1
S	
T	optional	
T	softcore	
T	completewith	MillsTurnin
A	subzone	159
A	xp	<10,1
S	
T	optional	
T	hardcore	
T	completewith	MillsTurnin
A	subzone	159
S	
T	optional	
A	goto	1420/0,403.87,2287.87
A	turnin	426
A	target	Deathguard Dillinger
A	isQuestComplete	426
S	
T	optional	
A	goto	1420/0,346.94,2258.950
A	turnin	368
A	accept	369
A	target	Apothecary Johaan
A	isQuestComplete	368
S	
T	optional	
A	goto	1420/0,346.94,2258.950
A	accept	369
A	target	Apothecary Johaan
A	isQuestTurnedIn	368
S	
T	optional	
A	goto	1420/0,295.87,2277.93
A	turnin	398
A	turnin	370
A	accept	371
A	target	Executor Zygand
A	isQuestComplete	370
S	Rogue
T	season	2
A	goto	1420/0,289.10,2313.170
A	use	208085
A	collect	208086,1
A	train	400094,1
S	Rogue
T	season	2
A	goto	1420/0,289.10,2313.170
A	collect	203990,1
A	target	Jamie Nore
A	skipgossip	
A	train	400094,1
S	Rogue
T	season	2
A	train	400094
A	use	203990
A	itemcount	203990,1
S	
T	optional	
A	goto	1420/0,295.87,2277.93
A	turnin	398
A	accept	371
A	target	Executor Zygand
A	isQuestTurnedIn	370
S	
T	optional	
A	goto	1420/0,295.87,2277.93
A	turnin	398
A	target	Executor Zygand
A	isQuestComplete	398
S	
T	optional	
A	goto	1420/0,265.15,2305.94
A	turnin	358
A	accept	359
A	target	Magistrate Sevren
A	isQuestComplete	358
S	
T	optional	
A	goto	1420/0,265.15,2305.94
A	accept	359
A	target	Magistrate Sevren
A	isQuestTurnedIn	358
S	
T	optional	
A	goto	1420/0,275.54,2260.46
A	complete	375,2
A	target	Abigail Shiel
A	itemcount	2876,5
A	isOnQuest	375
S	
T	optional	
A	goto	1420/0,250.69,2252.920
A	turnin	361
A	target	Yvette Farthing
A	isOnQuest	361
S	
T	optional	
A	goto	1420/0,244.36,2262.26
A	turnin	354
A	turnin	362
A	accept	355
A	target	Coleman Farthing
A	isQuestComplete	354
S	
T	optional	
T	label	MillsTurnin
A	goto	1420/0,244.36,2262.26
A	turnin	354
A	turnin	362
A	accept	355
A	target	Coleman Farthing
A	isQuestComplete	362
S	
T	optional	
A	goto	1420/0,244.36,2262.26
A	accept	355
A	target	Coleman Farthing
A	isQuestTurnedIn	354
S	Warrior
A	goto	1420/0,244.36,2262.26
A	turnin	1820
A	accept	1821
A	accept	355
A	target	Coleman Farthing
A	isQuestTurnedIn	1819
S	
T	optional	
A	goto	1420/0,236.68,2249.01
A	turnin	375
A	target	Gretchen Dedmar
A	isQuestComplete	375
S	Priest
A	goto	1420/0,251.14,2265.28
A	train	588
A	target	Dark Cleric Beryl
A	xp	<12,1
S	Mage
A	goto	1420/0,233.06,2256.84
A	train	145
A	target	Cain Firesong
A	xp	<12,1
S	Warrior
A	goto	1420/0,238.49,2255.03
A	train	7384
A	target	Austil de Mon
A	xp	<12,1
S	Rogue
A	goto	1420/0,243.01,2271.00
A	train	1766
A	target	Marion Call
A	xp	<12,1
S	Warlock
A	goto	1420/0,250.24,2259.25
A	train	755
A	target	Rupert Boch
A	xp	<12,1
S	!Mage
A	goto	1420/0,244.81,2269.19
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
A	goto	1420/0,74.00,2022.47
A	turnin	359
A	accept	360
A	accept	356
A	target	Deathguard Linnea
A	isQuestTurnedIn	358
A	maxlevel	13 << !Warrior !Warlock !Mage
S	
T	optional	
A	goto	1420/0,74.00,2022.47
A	accept	356
A	target	Deathguard Linnea
A	maxlevel	13 << !Warrior !Warlock !Mage
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
T	season	2
T	completewith	HorrorsandSpirits
A	collect	208183,6
A	mob	Odd Melon
A	train	415942,1
A	train	118,3
S	Mage
A	goto	1420/0,-467.79,1969.75
A	complete	1882,1
S	
T	optional	
T	label	HorrorsandSpirits
T	loop	
A	goto	1420/0,-324.55,2000.48,0
A	goto	1420/0,-324.55,2000.48,50,0
A	goto	1420/0,-330.88,2040.84,50,0
A	goto	1420/0,-359.34,2073.38,50,0
A	goto	1420/0,-421.25,2070.07,50,0
A	goto	1420/0,-464.63,2070.37,50,0
A	goto	1420/0,-516.14,2017.05,50,0
A	goto	1420/0,-466.44,1986.02,50,0
A	goto	1420/0,-436.61,1951.670,50,0
A	goto	1420/0,-355.28,1970.35,50,0
A	complete	356,1
A	mob	+Bleeding Horror
A	complete	356,2
A	mob	+Wandering Spirit
A	isOnQuest	356
S	Mage
T	season	2
T	loop	
A	goto	1420/0,-423.96,1976.68,0
A	goto	1420/0,-361.15,1985.11,20,0
A	goto	1420/0,-423.96,1976.68,20,0
A	goto	1420/0,-402.72,2050.79,20,0
A	collect	208183,6
A	mob	Odd Melon
A	train	415942,1
A	train	118,3
S	Mage
T	season	2
A	collect	203749,1
A	use	208183
A	train	415942,1
A	itemcount	208183,6
S	Mage
T	season	2
A	train	415942
A	use	203749
A	itemcount	203749,1
S	Priest
T	optional	
T	completewith	Scarletrings
A	collect	2589,60,435,1
A	mob	Scarlet Friar
A	mob	Scarlet Zealot
S	
T	optional	
T	completewith	next
A	complete	374,1
A	isOnQuest	374
S	
T	optional	
T	loop	
A	goto	1420/0,-573.53,2138.450,0
A	goto	1420/0,-528.35,2146.28,20,0
A	goto	1420/0,-624.59,2114.05,40,0
A	goto	1420/0,-654.87,2185.44,40,0
A	goto	1420/0,-652.16,2238.77,40,0
A	goto	1420/0,-550.49,2173.09,40,0
A	goto	1420/0,-452.43,2183.03,40,0
A	goto	1420/0,-407.69,2171.590,40,0
A	goto	1420/0,-406.34,2113.75,40,0
A	goto	1420/0,-453.33,2127.91,40,0
A	goto	1420/0,-573.53,2138.450,40,0
A	complete	371,1
A	mob	+Captain Vachon
A	complete	371,2
A	mob	+Scarlet Friar
A	isOnQuest	371
S	
T	optional	
T	label	ScarletRings
T	loop	
A	goto	1420/0,-573.53,2138.450,0
A	goto	1420/0,-624.59,2114.05,40,0
A	goto	1420/0,-654.87,2185.44,40,0
A	goto	1420/0,-652.16,2238.77,40,0
A	goto	1420/0,-550.49,2173.09,40,0
A	goto	1420/0,-452.43,2183.03,40,0
A	goto	1420/0,-407.69,2171.590,40,0
A	goto	1420/0,-406.34,2113.75,40,0
A	goto	1420/0,-453.33,2127.91,40,0
A	goto	1420/0,-573.53,2138.450,40,0
A	complete	374,1
A	mob	Scarlet Friar
A	mob	Scarlet Zealot
A	isOnQuest	374
S	Priest
T	loop	
A	goto	1420/0,-573.53,2138.450,0
A	goto	1420/0,-624.59,2114.05,40,0
A	goto	1420/0,-654.87,2185.44,40,0
A	goto	1420/0,-652.16,2238.77,40,0
A	goto	1420/0,-550.49,2173.09,40,0
A	goto	1420/0,-452.43,2183.03,40,0
A	goto	1420/0,-407.69,2171.590,40,0
A	goto	1420/0,-406.34,2113.75,40,0
A	goto	1420/0,-453.33,2127.91,40,0
A	goto	1420/0,-573.53,2138.450,40,0
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
A	goto	1420/0,-808.96,2189.06,0
A	goto	1420/0,-739.82,2163.75,30,0
A	goto	1420/0,-808.96,2189.06,30,0
A	goto	1420/0,-878.10,2195.39,30,0
A	goto	1420/0,-945.88,2180.93,30,0
A	goto	1420/0,-985.64,2224.00,30,0
A	goto	1420/0,-1019.99,2274.61,30,0
A	goto	1420/0,-1075.11,2314.38,30,0
A	goto	1420/0,-1072.85,2381.56,30,0
A	goto	1420/0,-1027.67,2432.17,30,0
A	goto	1420/0,-809.41,2431.26,30,0
A	goto	1420/0,-785.91,2352.64,30,0
A	goto	1420/0,-738.02,2268.29,30,0
A	complete	369,1
A	mob	Vicious Night Web Spider
A	isOnQuest	369
S	
T	optional	
T	completewith	LinneaTurnin
A	goto	1420/0,74.00,2022.47,60
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
A	goto	1420/0,74.00,2022.47
A	turnin	356
A	target	Deathguard Linnea
A	isQuestComplete	356
S	
T	optional	
A	goto	1420/0,275.54,2260.46
A	complete	375,2
A	target	Abigail Shiel
A	itemcount	2876,5
A	isOnQuest	375
S	
T	optional	
A	goto	1420/0,280.06,2270.70
A	turnin	374
A	target	Deathguard Burgess
A	isQuestComplete	374
S	
T	optional	
A	goto	1420/0,295.87,2277.93
A	turnin	371
A	target	Executor Zygand
A	isQuestComplete	371
S	
T	optional	
A	goto	1420/0,265.15,2305.94
A	turnin	360
A	target	Magistrate Sevren
A	isQuestTurnedIn	359
S	
T	optional	
A	goto	1420/0,265.15,2305.94
A	turnin	355
A	target	Magistrate Sevren
A	isQuestTurnedIn	354
S	Warrior
A	goto	1420/0,265.15,2305.94
A	turnin	355
A	accept	408
A	target	Magistrate Sevren
A	isQuestTurnedIn	354
S	
T	optional	
A	goto	1420/0,346.94,2259.25
A	turnin	369
A	accept	492
A	accept	445
A	target	Apothecary Johaan
A	isQuestTurnedIn	368
S	
A	goto	1420/0,346.94,2259.25
A	accept	445
A	target	Apothecary Johaan
S	
T	optional	
A	goto	1420/0,236.68,2249.01
A	turnin	375
A	target	Gretchen Dedmar
A	isQuestComplete	375
S	Priest
A	goto	1420/0,251.14,2265.28
A	train	588,1
A	target	Dark Cleric Beryl
A	xp	<12,1
S	Mage
A	goto	1420/0,233.06,2256.84
A	train	145,1
A	target	Cain Firesong
A	xp	<12,1
S	Warrior
A	goto	1420/0,238.49,2255.03
A	train	7384,1
A	target	Austil de Mon
A	xp	<12,1
S	Rogue
A	goto	1420/0,243.01,2271.00
A	train	1766,1
A	target	Marion Call
A	xp	<12,1
S	Warlock
A	goto	1420/0,250.24,2259.25
A	train	755,1
A	target	Rupert Boch
A	xp	<12,1
S	Warrior
A	goto	1420/0,891.90,2522.84,150,0
A	goto	1420/0,673.19,3026.84,20,0
A	goto	1420/0,670.48,3042.200,8
A	isOnQuest	1821
S	Warrior
T	completewith	CaptainDargol
A	complete	1821,1
A	complete	1821,2
A	complete	1821,3
A	complete	1821,4
A	isOnQuest	1821
S	Warrior
T	completewith	next
A	complete	408,1
A	mob	+Wailing Ancestor
A	complete	408,2
A	mob	+Rotting Ancestor
A	isOnQuest	408
S	Warrior
T	label	CaptainDargol
A	goto	1420/0,659.63,3030.75,8,0
A	goto	1420/0,679.97,3029.85,8,0
A	goto	1420/0,682.23,3041.3,8,0
A	goto	1420/0,646.98,3043.40
A	complete	408,3
A	mob	Captain Dargol
A	isOnQuest	408
S	Warrior
T	completewith	next
A	complete	1821,1
A	complete	1821,2
A	complete	1821,3
A	complete	1821,4
A	isOnQuest	1821
S	Warrior
T	loop	
A	goto	1420/0,688.1,3028.04,0
A	goto	1420/0,689.01,3058.47,15,0
A	goto	1420/0,656.02,3058.77,15,0
A	goto	1420/0,656.47,3027.74,15,0
A	goto	1420/0,688.1,3028.04,15,0
A	complete	408,1
A	mob	+Wailing Ancestor
A	complete	408,2
A	mob	+Rotting Ancestor
A	isOnQuest	408
S	Warrior
T	loop	
A	goto	1420/0,653.76,3058.17,0
A	goto	1420/0,697.14,3063.59,12,0
A	goto	1420/0,655.57,3065.7,12,0
A	goto	1420/0,654.21,3023.52,12,0
A	goto	1420/0,688.55,3021.11,12,0
A	goto	1420/0,653.76,3058.17,12,0
A	complete	1821,1
A	complete	1821,2
A	complete	1821,3
A	complete	1821,4
A	isOnQuest	1821
S	skip --Warrior
A	goto	1420/0,698.04,3064.19
A	goto	1420/0,491.99,2348.72,30
A	link	https://www.youtube.com/watch?v=bH_NYmWf8Lc&ab
A	isQuestComplete	408
S	skip --Warrior
T	softcore	
T	completewith	next
A	deathskip	
S	Warrior
T	completewith	next
A	subzone	159
S	Warrior
A	goto	1420/0,265.15,2305.94
A	turnin	408
A	target	Magistrate Sevren
A	isQuestComplete	408
S	Warrior
A	goto	1420/0,244.36,2262.26
A	turnin	1821
A	target	Coleman Farthing
A	isQuestComplete	1821
S	Warrior
A	goto	1420/0,244.36,2262.26
A	turnin	1822
A	target	Coleman Farthing
A	isQuestTurnedIn	1821
S	
T	optional	
A	goto	1420/0,233.06,2292.39
A	turnin	407
A	target	Captured Scarlet Zealot
A	isQuestTurnedIn	365
S	
T	optional	
A	goto	1420/0,234.42,2289.070
A	turnin	492
A	target	Captured Mountaineer
A	isOnQuest	492
S	Priest
A	goto	1420/0,251.14,2265.28
A	train	588,1
A	target	Dark Cleric Beryl
A	xp	<12,1
A	xp	>14,1
S	Priest
A	goto	1420/0,251.14,2265.28
A	train	6074
A	target	Dark Cleric Beryl
A	xp	<14,1
S	Mage
A	goto	1420/0,233.06,2256.84
A	train	145,1
A	target	Cain Firesong
A	xp	<12,1
A	xp	>14,1
S	Mage
A	goto	1420/0,233.06,2256.84
A	train	2137
A	target	Cain Firesong
A	xp	<14,1
S	Warrior
A	goto	1420/0,238.49,2255.03
A	train	7384,1
A	target	Austil de Mon
A	xp	<12,1
A	xp	>14,1
S	Warrior
A	goto	1420/0,238.49,2255.03
A	train	1160
A	target	Austil de Mon
A	xp	<14,1
S	Rogue
A	goto	1420/0,243.01,2271.00
A	train	1766,1
A	target	Marion Call
A	xp	<12,1
A	xp	>14,1
S	Rogue
A	goto	1420/0,243.01,2271.00
A	train	1758
A	target	Marion Call
A	xp	<14,1
S	Warlock
A	goto	1420/0,250.24,2259.25
A	train	755,1
A	target	Rupert Boch
A	xp	<12,1
A	xp	>14,1
S	Warlock
A	goto	1420/0,250.24,2259.25
A	train	6222
A	target	Rupert Boch
A	xp	<14,1
S	Mage
T	completewith	next
A	goto	1420/0,240.75,1877.57,20,0
A	zone	Undercity
A	zoneskip	Undercity
S	Mage
T	completewith	next
A	goto	1458/0,239.14,1749.54,20,0
A	goto	1458/0,255.64,1724.70,20,0
A	goto	1458/0,240.68,1706.97,10,0
A	goto	1458/0,241.06,1660.12,10,0
A	goto	1458/0,257.08,1623.38,10,0
A	goto	1458/0,244.51,1598.73,15
S	Mage
A	goto	1458/0,56.57,1813.49
A	turnin	1882
A	target	Anastasia Hartwell
S	Rogue
T	completewith	Swordtraining3
A	goto	1420/0,240.75,1877.57,20,0
A	zone	Undercity
A	zoneskip	Undercity
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
S	Rogue
T	completewith	Swordtraining3
A	goto	1458/0,239.14,1749.54,20,0
A	goto	1458/0,255.64,1724.70,20,0
A	goto	1458/0,240.68,1706.97,10,0
A	goto	1458/0,241.06,1660.12,10,0
A	goto	1458/0,257.08,1623.38,10,0
A	goto	1458/0,244.51,1598.73,15
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
S	!Rogue !Mage
T	completewith	UCflightpath3
A	goto	1420/0,240.75,1877.57,20,0
A	zone	Undercity
A	zoneskip	Undercity
S	!Rogue !Mage
T	completewith	UCflightpath3
A	goto	1458/0,239.14,1749.54,20,0
A	goto	1458/0,255.64,1724.70,20,0
A	goto	1458/0,240.68,1706.97,10,0
A	goto	1458/0,241.06,1660.12,10,0
A	goto	1458/0,257.08,1623.38,10,0
A	goto	1458/0,244.51,1598.73,15
S	!Undead
T	label	UCflightpath3
A	goto	1458/0,266.39,1567.11
A	fp	Undercity
A	target	Michael Garrett
S	Orc Rogue/Troll Rogue
T	ssf	
T	optional	
T	label	RogueCutlass3
A	goto	1458/0,286.53,1616.21
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
A	goto	1458/0,286.53,1616.21
A	collect	851,1
A	money	<0.2023
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
A	target	Louis Warren
A	zoneskip	Undercity,1
S	Undead Rogue
A	goto	1458/0,71.92,1435.70
A	turnin	1885
A	accept	1886
A	target	Mennet Carkad
A	isOnQuest	1885
S	Rogue
T	label	Swordtraining3
A	goto	1458/0,323.57,1668.50
A	train	201
A	target	Archibald
A	money	<0.1
S	Rogue
T	optional	
T	completewith	Entersilverpine
A	use	851
A	itemcount	851,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
A	train	201,1
S	Undead Warrior
T	completewith	Entersilverpine
A	goto	1420/0,240.75,1877.57,20,0
A	zone	Undercity
A	zoneskip	Undercity
A	money	<0.3022
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.0
S	Undead Warrior
T	completewith	Entersilverpine
A	goto	1458/0,239.14,1749.54,20,0
A	goto	1458/0,255.64,1724.70,20,0
A	goto	1458/0,240.68,1706.97,10,0
A	goto	1458/0,241.06,1660.12,10,0
A	goto	1458/0,257.08,1623.38,10,0
A	goto	1458/0,244.51,1598.73,15
A	money	<0.3022
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.0
S	Troll Warrior/Undead Warrior/Tauren Shaman/Troll Shaman/Orc Shaman
A	goto	1458/0,308.89,1667.80
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
A	goto	1458/0,257.27,1560.450
A	collect	3164,6,429,1
A	target	Auctioneer Rhyker
A	zoneskip	Undercity,1
S	Priest
A	goto	1458/0,273.87,1482.360
A	train	7411
A	target	Lavinia Crowe
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3
S	Priest
A	goto	1458/0,194.24,1681.50
A	train	3908
A	target	Josef Gregorian
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3
S	Priest
A	goto	1458/0,194.34,1681.63
A	collect	2996,30,435,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3
S	Priest
A	goto	1458/0,194.34,1681.63
A	train	7623
A	target	Josef Gregorian
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3
S	Priest
A	goto	1458/0,196.16,1684.83
A	collect	2320,30,435,1
A	target	Millie Gregorian
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3
S	Priest
A	collect	6238,9,398,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3
S	Priest
A	goto	1458/0,275.02,1487.55
A	collect	6218,1,435,1
A	collect	4470,1,435,1
A	target	Thaddeus Webb
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3
S	Priest
A	goto	1458/0,273.2,1491.71
A	train	14293
A	target	Malcomb Wynn
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3
S	Priest
A	collect	11287,1,435,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3
S	Priest
T	optional	
T	completewith	Entersilverpine
A	use	11287
A	itemcount	11287,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3
S	
T	xprate	<1.5
T	optional	
A	abandon	806
S	
T	optional	
A	abandon	408
S	Warrior
T	optional	
A	abandon	1821
S	
T	optional	
T	xprate	>1.49
A	abandon	830
S	
T	label	LeaveUndercity3
A	goto	1458/0,419.89,1627.54,50,0
A	goto	1458/0,428.52,1597.20,10,0
A	goto	1458/0,439.17,1626.06,10,0
A	goto	1458/0,476.78,1632.150,10,0
A	goto	1458/0,482.34,1660.63,10,0
A	goto	1458/0,539.33,1665.49,15,0
A	goto	1458/0,610.42,1684.44,35,0
A	goto	1458/0,663.19,1600.46,35,0
A	goto	1420/0,724.25,1682.66,50,0
A	zone	Tirisfal Glades
A	zoneskip	Tirisfal Glades
S	
T	label	Entersilverpine
A	goto	1420/0,629.36,1553.42
A	zone	Silverpine Forest
A	zoneskip	Silverpine Forest
E
G	Guides/forever/Horde-01-12_Durotar.lua
M	classic	
M	tbc	
M	xprate	>1.99
M	selector	Horde
M	name	1-7 Durotar
M	version	1
M	group	RestedXP Forever Guide (H)
M	subgroup	Speedrun Guide 1-22
M	defaultfor	Troll/Orc
M	next	7-13 Durotar
S	!Orc !Troll
T	completewith	next
S	
A	goto	1411/1,-4251.46,-607.35
A	accept	4641
A	target	Kaltunk
S	
T	season	2
A	xp	2
A	goto	1411/1,-4305.92,-700.06
A	mob	Mottled Boar
S	
T	season	2
A	goto	1411/1,-4221.85,-589.37
A	collect	206387,1 << Shaman
A	collect	206381,1 << Shaman
A	collect	204806,1 << Warrior
A	collect	204716,1 << Orc Warrior
A	collect	208799,1 << Mage
A	collect	203746,1 << Mage
A	collect	203748,1 << Mage
A	collect	225690,1 << Mage
A	collect	203745,1 << Mage
A	collect	209852,1 << Hunter
A	collect	226401,1 << Hunter
A	collect	216770,1 << Hunter
A	collect	206168,1 << Hunter
A	collect	210818,1 << Hunter
A	collect	213124,1 << Hunter
A	collect	226252,1 << Hunter
A	collect	205215,1 << Warlock
A	collect	210824,1 << Warlock
A	collect	211477,1 << Warlock
A	collect	205230,1 << Warlock
A	collect	228797,1 << Warlock
A	collect	210979,1 << Rogue
A	collect	221428,1 << Rogue
A	collect	204795,1 << Rogue
A	collect	208772,1 << Rogue
A	collect	227922,1 << Rogue
A	collect	212552,1 << Priest
A	collect	205940,1 << Priest
A	collect	205951,1 << Priest
A	collect	205932,1 << Priest
A	collect	205947,1 << Priest
A	target	Rune Broker
A	skipgossip	
S	
T	season	2
A	train	403470
A	train	415936
A	train	401759
A	train	440858
A	train	401760
A	train	401768
A	train	410121
A	train	410122
A	train	416086
A	train	440563
A	train	415423
A	train	416009
A	train	425476
A	train	416015
A	train	403919
A	train	403619
A	train	402852
A	train	425447
A	train	410111
A	train	409580
A	train	400101
A	train	432301
A	train	400105
A	train	424984
A	train	415922
A	equip	18
A	train	431663
A	train	425216
A	train	402862
A	train	402849
A	use	206387 << Shaman
A	use	205947 << Priest
A	use	212552 << Priest
A	use	205940 << Priest
A	use	205951 << Priest
A	use	205932 << Priest
A	use	204716 << Orc Warrior
A	use	203746 << Mage
A	use	209852 << Hunter
A	use	226401 << Hunter
A	use	208799 << Mage
A	use	203748 << Mage
A	use	225690 << Mage
A	use	203746 << Mage
A	use	203745 << Mage
A	use	204716 << Orc Warrior
A	use	206168 << Hunter
A	use	210818 << Hunter
A	use	213124 << Hunter
A	use	226252 << Hunter
A	use	216770 << Hunter
A	use	204806 << Warrior
A	use	205215 << Warlock
A	use	210824 << Warlock
A	use	211477 << Warlock
A	use	205230 << Warlock
A	use	228797 << Warlock
A	use	210979 << Rogue
A	use	221428 << Rogue
A	use	204795 << Rogue
A	use	208772 << Rogue
A	use	227922 << Rogue
S	Warlock
T	optional	
T	sticky	
A	aura	403619
S	Warlock
A	goto	1411/1,-4214.45,-623.92.00
A	accept	1485
A	target	Ruzan
S	Shaman
T	season	2
T	optional	
T	label	LavaBurst
T	sticky	
A	train	410095
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
A	goto	1411/1,-4198.05,-605.59,12,0 << !Warrior !Shaman
A	goto	1411/1,-4198.58,-602.41,12,0 << Warrior/Shaman
A	goto	1411/1,-4186.42,-599.95
A	turnin	4641
A	accept	788
A	target	Gornek
S	Priest
T	season	2
A	goto	1411/1,-4109.75,-581.97
A	vendor	
A	collect	3595,1
A	target	Huklah
S	Priest
T	season	2
A	goto	1411/1,-4202.28,-617.22
A	accept	77642
A	turnin	77642
A	target	Ken'jai
S	Priest
T	season	2
A	equip	10,711
A	equip	6,3595
A	use	711
A	use	3595
A	engrave	6
A	engrave	10
A	engrave	7
S	Mage
T	season	2
T	requires	Galgar
A	goto	1411/1,-4210.22,-625.33
A	accept	77643
A	turnin	77643
A	train	1459
A	target	Mai'ah
S	Mage
T	season	2
T	optional	
A	equip	10,711
A	use	711
A	engrave	10
A	engrave	7
A	engrave	5
S	Mage
T	season	2
T	optional	
T	sticky	
A	engrave	15
S	Hunter
T	season	2
T	xprate	>1.49
A	goto	1411/1,-4227.66,-635.20
A	accept	77590
A	accept	77584
A	turnin	77590
A	turnin	77584
A	target	Jen'shan
S	Rogue
T	season	2
A	goto	1411/1,-4144.65,-588.67
A	accept	77592
A	accept	77583
A	turnin	77592
A	turnin	77583
A	train	1784
A	target	Rwag
S	Rogue
T	season	2
T	optional	
A	equip	10
A	engrave	10
A	use	2125
S	Warrior/Shaman
T	season	0
A	goto	1411/1,-4198.05,-605.59,10,0
A	goto	1411/1,-4230.31,-639.43 << Warrior
A	goto	1411/1,-4203.87,-623.92 << Shaman
A	train	6673
A	train	8017
A	target	Frang << Warrior
A	target	Shikrik << Shaman
S	Warrior/Shaman
T	season	2
A	goto	1411/1,-4198.05,-605.59,10,0
A	goto	1411/1,-4230.31,-639.43 << Warrior
A	goto	1411/1,-4203.87,-623.92 << Shaman
A	train	6673
A	train	8017
A	accept	77588
A	accept	77582
A	turnin	77588
A	turnin	77582
A	target	Frang << Warrior
A	target	Shikrik << Shaman
S	Warrior
T	season	2
A	equip	10
A	engrave	10
A	engrave	7
A	use	2385 << Warrior
S	Warlock
T	softcore	
T	completewith	Nartok
A	goto	1411/1,-4157.87,-601.36,12,0
A	goto	1411/1,-4143.06,-594.31,12,0
A	goto	1411/1,-4120.86,-589.72,12,0
A	goto	1411/1,-4111.87,-607.00,12
A	money	<0.01
S	Warlock
T	softcore	
T	completewith	next
A	goto	1411/1,-4157.87,-601.36,12,0
A	goto	1411/1,-4143.06,-594.31,12,0
A	goto	1411/1,-4120.86,-589.72,12,0
A	goto	1411/1,-4107.11,-604.18,12
A	money	>0.01
S	Warlock
T	hardcore	
T	completewith	next
A	goto	1411/1,-4157.87,-601.36,12,0
A	goto	1411/1,-4143.06,-594.31,12,0
A	goto	1411/1,-4120.86,-589.72,12,0
A	goto	1411/1,-4107.11,-604.18,12
S	Warlock
T	softcore	
T	season	0
A	goto	1411/1,-4107.11,-604.18
A	vendor	
A	target	Hraug
A	money	>0.01
S	Warlock
T	hardcore	
T	season	0
A	goto	1411/1,-4107.11,-604.18
A	vendor	
A	target	Hraug
S	Warlock
T	season	2
T	label	Nartok
A	goto	1411/1,-4111.87,-607.00
A	accept	77586
A	turnin	77586
A	target	Nartok
S	Warlock
T	season	2
A	goto	1411/1,-4109.75,-581.97
A	vendor	
A	collect	3596,1
A	target	Huklah
S	Warlock
T	season	2
A	equip	10,711
A	equip	9,3596
A	use	711
A	use	3596
A	engrave	10
A	engrave	9
A	engrave	7
S	Warlock
T	season	0
T	label	Nartok
A	goto	1411/1,-4111.87,-607.00
A	train	348
A	target	Nartok
S	!Warrior !Rogue
T	softcore	
A	goto	1411/1,-4214.45,-565.40
A	collect	159,30,6394,1 << !Hunter !Shaman
A	collect	2512,1000,6394,1 << Hunter
A	target	Duokna
A	money	<0.005 << !Hunter
A	money	<0.0040 << Hunter
S	Warlock
A	goto	1411/1,-4214.45,-565.40
A	collect	159,5,6394,1
A	target	Duokna
A	money	<0.0025
S	Warlock
T	completewith	next
A	goto	1411/1,-4266.26,-563.29,25,0
A	complete	788,1
A	mob	Mottled Boar
S	Warlock
A	goto	1411/1,-4357.74,-180.47,100
A	isOnQuest	1485
S	Warlock
T	loop	
A	goto	1411/1,-4282.13,-250.97,0
A	goto	1411/1,-4282.13,-250.97,40,0
A	goto	1411/1,-4317.02,-258.02,40,0
A	goto	1411/1,-4351.39,-250.97,40,0
A	goto	1411/1,-4385.76,-256.96,40,0
A	goto	1411/1,-4383.65,-216.07,40,0
A	goto	1411/1,-4419.07,-221.01,40,0
A	goto	1411/1,-4457.67,-205.15,40,0
A	goto	1411/1,-4405.85,-189.99,40,0
A	goto	1411/1,-4409.55,-169.54,40,0
A	goto	1411/1,-4376.24,-197.390,40,0
A	goto	1411/1,-4360.38,-176.95,40,0
A	goto	1411/1,-4329.71,-196.33,40,0
A	goto	1411/1,-4319.67,-169.190,40,0
A	goto	1411/1,-4303.28,-186.46,40,0
A	goto	1411/1,-4281.07,-148.75,40,0
A	complete	1485,1
A	mob	Vile Familiar
S	Hunter
T	season	2
T	optional	
T	completewith	sarkoth
A	equip	10
A	engrave	7
A	engrave	10
A	aura	409583
A	use	2125
S	Hunter
T	season	2
T	sticky	
T	optional	
A	engrave	5
A	engrave	6
A	engrave	15
S	Rogue
T	season	2
T	sticky	
T	optional	
A	engrave	6
A	engrave	15
A	engrave	9
S	
T	completewith	Sarkoth
A	goto	1411/1,-4266.26,-563.29,35,0 << !Warlock
A	goto	1411/1,-4283.18,-512.53,45,0 << !Warlock
A	complete	788,1
A	mob	Mottled Boar
S	
A	goto	1411/1,-4108.70,-397.96
A	accept	790
A	target	Hana'zua
S	
T	label	Sarkoth
A	goto	1411/1,-4109.22,-546.370
A	complete	790,1
A	mob	Sarkoth
S	
A	goto	1411/1,-4108.70,-397.96
A	turnin	790
A	accept	804
A	target	Hana'zua
S	
T	loop	
A	goto	1411/1,-4146.24,-483.97,0
A	goto	1411/1,-4146.24,-483.97,40,0
A	goto	1411/1,-4179.02,-473.75,40,0
A	goto	1411/1,-4218.15,-480.10,40,0
A	goto	1411/1,-4252.52,-483.62,40,0
A	goto	1411/1,-4283.71,-516.76,40,0
A	goto	1411/1,-4317.55,-516.76,40,0
A	goto	1411/1,-4350.33,-510.06,40,0
A	goto	1411/1,-4379.94,-515.70,40,0
A	goto	1411/1,-4379.94,-484.33,40,0
A	goto	1411/1,-4352.98,-445.90,40,0
A	goto	1411/1,-4385.76,-412.77,40,0
A	goto	1411/1,-4384.70,-383.16,40,0
A	goto	1411/1,-4383.12,-346.85,40,0
A	goto	1411/1,-4349.81,-313.720,40,0
A	goto	1411/1,-4315.44,-287.28,40,0
A	goto	1411/1,-4281.60,-321.82,40,0
A	goto	1411/1,-4239.83,-315.13,40,0
A	goto	1411/1,-4213.92,-309.84,40,0
A	goto	1411/1,-4184.31,-348.61,40,0
A	goto	1411/1,-4184.31,-382.45,40,0
A	goto	1411/1,-4183.25,-409.6,40,0
A	goto	1411/1,-4182.72,-448.72,40,0
A	complete	788,1
A	mob	Mottled Boar
S	Warlock
T	xprate	<1.5
T	completewith	Ruzan2
A	mob	Mottled Boar
A	money	>0.01
S	Warlock/Warrior/Shaman/Hunter
T	xprate	>1.49
T	completewith	Ruzan2
A	mob	Mottled Boar
A	money	>0.02 << Warrior
A	money	>0.0175 << Warlock
A	money	>0.011 << Hunter
A	money	>0.01 << Shaman
S	Rogue
T	label	Duokna2
A	goto	1411/1,-4214.45,-565.40
A	vendor	
A	target	Duokna
S	Warlock
T	label	Ruzan2
A	goto	1411/1,-4214.45,-623.92.00
A	turnin	1485
A	accept	1499
A	target	Ruzan
S	Warlock
T	completewith	Gornek2
A	cast	688
S	Warlock
A	goto	1411/1,-4228.19,-629.20
A	turnin	1499
A	accept	794
A	target	Zureetha Fargaze
S	
T	label	Gornek2
A	goto	1411/1,-4198.05,-605.59,12,0 << Warlock
A	goto	1411/1,-4198.58,-602.41,12,0 << !Warlock
A	goto	1411/1,-4186.42,-599.95
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
T	season	0
T	completewith	Rwag
A	goto	1411/1,-4157.87,-601.36,12,0
A	goto	1411/1,-4144.65,-588.67,12
S	Rogue
T	season	0
A	goto	1411/1,-4144.65,-588.67
A	turnin	3083
A	turnin	3088
A	train	53
A	target	Rwag
A	money	<0.04
A	xp	<4,1
S	Rogue
T	season	0
T	label	Rwag
A	goto	1411/1,-4144.65,-588.67
A	turnin	3083
A	turnin	3088
A	target	Rwag
S	Warlock
T	completewith	Nartok2
A	goto	1411/1,-4157.87,-601.36,12,0
A	goto	1411/1,-4143.06,-594.31,12,0
A	goto	1411/1,-4120.86,-589.72,12,0
A	goto	1411/1,-4111.87,-607.00,12
A	money	<0.01
S	Warlock
T	completewith	next
A	goto	1411/1,-4157.87,-601.36,12,0
A	goto	1411/1,-4143.06,-594.31,12,0
A	goto	1411/1,-4120.86,-589.72,12,0
A	goto	1411/1,-4107.11,-604.18,12
A	money	>0.01
S	Warlock
A	goto	1411/1,-4107.11,-604.18
A	vendor	
A	target	Hraug
A	money	>0.01
S	Warlock
T	season	2
T	label	Nartok2
A	goto	1411/1,-4111.87,-607.00
A	turnin	3090
A	target	Nartok
S	Warlock
T	season	0
T	label	Nartok2
A	goto	1411/1,-4111.87,-607.00
A	turnin	3090
A	train	172
A	target	Nartok
S	
T	label	Galgar
A	goto	1411/1,-4221.85,-561.52,0,0
A	accept	4402
A	target	Galgar
A	xp	>4,1
S	!Rogue
T	xprate	<1.5
A	goto	1411/1,-4214.45,-565.40
A	collect	159,15,6394,1 << !Rogue !Warrior !Hunter !Shaman
A	collect	2512,1000,6394,1 << Hunter
A	vendor	
A	target	Duokna
A	money	>0.01 << Rogue/Warrior
A	itemcount	159,<15 << !Rogue !Warrior !Hunter !Shaman
S	!Rogue
T	xprate	>1.49
T	season	0 << Mage
A	goto	1411/1,-4214.45,-565.40
A	collect	159,15,6394,1 << !Rogue !Warrior !Hunter !Shaman
A	collect	2512,1000,6394,1 << Hunter
A	vendor	
A	target	Duokna
A	money	<0.005 << Hunter
A	money	>0.1 << Rogue/Warrior/Shaman
A	itemcount	159,<15 << !Rogue !Warrior !Hunter !Shaman
S	Hunter
T	optional	
T	xprate	>1.49
A	goto	1411/1,-4214.45,-565.40
A	collect	2512,400,6394,1
A	vendor	
A	target	Duokna
A	money	<0.002
A	itemcount	2512,<200
S	Hunter
T	optional	
T	xprate	>1.49
A	goto	1411/1,-4214.45,-565.40
A	collect	2512,200,6394,1
A	vendor	
A	target	Duokna
A	money	<0.001
A	itemcount	2512,<200
S	Shaman
T	season	2
T	xprate	>1.49
T	requires	Galgar
A	turnin	3084
A	turnin	3089
A	accept	77587
A	accept	77585
A	train	8042
A	goto	1411/1,-4203.87,-623.92
A	accept	1516
A	goto	1411/1,-4204.4,-629.91
A	target	Shikrik
A	target	Canaga Earthcaller
S	Shaman
T	season	2
T	xprate	<1.5
T	requires	Galgar
A	goto	1411/1,-4203.87,-623.92
A	turnin	3084
A	turnin	3089
A	accept	77587
A	accept	77585
A	target	Shikrik
S	Shaman
T	season	0
T	requires	Galgar
A	goto	1411/1,-4203.87,-623.92
A	turnin	3084
A	turnin	3089
A	target	Shikrik
S	Mage
T	season	2
T	requires	Galgar
A	goto	1411/1,-4210.22,-625.33
A	turnin	3086
A	target	Mai'ah
S	Mage
T	season	0
T	requires	Galgar
A	goto	1411/1,-4210.22,-625.33
A	turnin	3086
A	train	1459
A	target	Mai'ah
S	!Warlock
T	requires	Galgar
A	goto	1411/1,-4228.19,-629.20
A	accept	792
A	target	Zureetha Fargaze
S	Hunter
T	season	2
T	xprate	>1.49
A	goto	1411/1,-4227.66,-635.20
A	turnin	3082
A	turnin	3087
A	train	1978
A	target	Jen'shan
A	money	<0.01
S	Hunter
T	optional	
T	season	2
T	xprate	>1.49
A	goto	1411/1,-4227.66,-635.20
A	turnin	3082
A	turnin	3087
A	target	Jen'shan
S	Hunter
T	xprate	<1.5
T	season	2
A	goto	1411/1,-4227.66,-635.20
A	turnin	3082
A	turnin	3087
A	target	Jen'shan
S	Hunter
T	xprate	>1.49
T	season	0
A	goto	1411/1,-4227.66,-635.20
A	turnin	3082
A	turnin	3087
A	train	1978
A	target	Jen'shan
A	money	<0.01
S	Hunter
T	optional	
T	xprate	>1.49
T	season	0
A	goto	1411/1,-4227.66,-635.20
A	turnin	3082
A	turnin	3087
A	target	Jen'shan
S	Hunter
T	xprate	<1.5
T	season	0
A	goto	1411/1,-4227.66,-635.20
A	turnin	3082
A	turnin	3087
A	target	Jen'sha
S	Warrior
T	xprate	>1.49
A	goto	1411/1,-4230.31,-639.43
A	turnin	2383
A	turnin	3065
A	train	100
A	train	772
A	target	Frang
A	money	<0.02
S	Warrior
T	xprate	>1.49
T	season	2
A	goto	1411/1,-4230.31,-639.43
A	turnin	2383
A	turnin	3065
A	train	772
A	target	Frang
A	money	<0.01
S	Warrior
T	xprate	>1.49
T	season	2
A	goto	1411/1,-4230.31,-639.43
A	turnin	2383
A	turnin	3065
A	target	Frang
S	Warrior
T	xprate	>1.49
T	season	0
A	goto	1411/1,-4230.31,-639.43
A	turnin	2383
A	turnin	3065
A	train	772
A	target	Frang
A	money	<0.01
S	Warrior
T	xprate	>1.49
T	season	0
A	goto	1411/1,-4230.31,-639.43
A	turnin	2383
A	turnin	3065
A	target	Frang
S	Warrior
T	xprate	<1.5
T	season	2
A	goto	1411/1,-4230.31,-639.43
A	turnin	2383
A	turnin	3065
A	target	Frang
S	Warrior
T	xprate	<1.5
T	season	0
A	goto	1411/1,-4230.31,-639.43
A	turnin	2383
A	turnin	3065
A	target	Frang
S	Priest
T	season	2
A	goto	1411/1,-4202.28,-617.22
A	turnin	3085
A	accept	77642
A	target	Ken'jai
S	Shaman
A	goto	1411/1,-4102.35,-588.67.00
A	collect	2132,1,5441,1
A	money	<0.0102
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<1.9
A	target	Kzan Thornslash
S	
T	requires	Galgar << Warlock
A	goto	1411/1,-4322.31,-611.58
A	accept	5441
A	target	Foreman Thazz'ril
S	
T	completewith	Sting
A	complete	4402,1
A	isOnQuest	4402
S	
T	completewith	Tails
A	goto	1411/1,-4340.82,-628.50,45,0
A	goto	1411/1,-4375.71,-507.590,45,0
A	goto	1411/1,-4467.19,-506.53,45,0
A	complete	5441,1
A	target	Lazy Peon
A	use	16114
S	!Warlock
T	completewith	Imps
A	complete	789,1
A	mob	Scorpid Worker
S	skip --Shaman
T	season	2
T	completewith	OverloadRune
A	complete	792,1
A	mob	Vile Familiar
S	<< skip --Hunter
T	season	2
T	completewith	ChimeraRune
A	complete	792,1
A	mob	Vile Familiar
S	!Warlock
T	label	Imps
T	loop	
A	goto	1411/1,-4282.13,-250.97,0
A	goto	1411/1,-4282.13,-250.97,40,0
A	goto	1411/1,-4317.02,-258.02,40,0
A	goto	1411/1,-4351.39,-250.97,40,0
A	goto	1411/1,-4385.76,-256.96,40,0
A	goto	1411/1,-4383.65,-216.07,40,0
A	goto	1411/1,-4419.07,-221.01,40,0
A	goto	1411/1,-4457.67,-205.15,40,0
A	goto	1411/1,-4405.85,-189.99,40,0
A	goto	1411/1,-4409.55,-169.54,40,0
A	goto	1411/1,-4376.24,-197.390,40,0
A	goto	1411/1,-4360.38,-176.95,40,0
A	goto	1411/1,-4329.71,-196.33,40,0
A	goto	1411/1,-4319.67,-169.190,40,0
A	goto	1411/1,-4303.28,-186.46,40,0
A	goto	1411/1,-4281.07,-148.75,40,0
A	complete	792,1
A	mob	Vile Familiar
S	
T	label	Tails
T	loop	
A	goto	1411/1,-4249.87,-246.04,0
A	goto	1411/1,-4249.87,-246.04,40,0
A	goto	1411/1,-4226.08,-250.62,40,0
A	goto	1411/1,-4177.96,-248.5,40,0
A	goto	1411/1,-4181.66,-278.470,40,0
A	goto	1411/1,-4149.41,-319.00,40,0
A	goto	1411/1,-4112.40,-351.43,40,0
A	goto	1411/1,-4081.20,-354.25,40,0
A	goto	1411/1,-4046.83,-352.14,40,0
A	goto	1411/1,-4048.95,-383.16,40,0
A	goto	1411/1,-4053.71,-415.940,40,0
A	goto	1411/1,-4084.37,-449.08,40,0
A	goto	1411/1,-4121.91,-449.78,40,0
A	goto	1411/1,-4116.63,-513.23,40,0
A	goto	1411/1,-4073.80,-519.22,40,0
A	goto	1411/1,-4079.61,-553.06,40,0
A	goto	1411/1,-4082.26,-576.68,40,0
A	goto	1411/1,-4084.37,-606.290,40,0
A	goto	1411/1,-4115.57,-608.05,40,0
A	goto	1411/1,-4146.24,-583.03,40,0
A	goto	1411/1,-4149.94,-543.55,40,0
A	goto	1411/1,-4177.43,-519.93,40,0
A	goto	1411/1,-4144.65,-507.94,40,0
A	goto	1411/1,-4149.41,-450.13,40,0
A	goto	1411/1,-4147.82,-416.65,40,0
A	goto	1411/1,-4148.88,-376.46,40,0
A	goto	1411/1,-4156.28,-350.73,40,0
A	goto	1411/1,-4177.96,-315.13,40,0
A	goto	1411/1,-4210.22,-283.40,40,0
A	goto	1411/1,-4240.35,-293.27,40,0
A	goto	1411/1,-4284.24,-283.05,40,0
A	goto	1411/1,-4349.81,-287.63,40,0
A	goto	1411/1,-4384.70,-281.990,40,0
A	goto	1411/1,-4386.82,-318.65,40,0
A	goto	1411/1,-4419.07,-345.79,40,0
A	goto	1411/1,-4452.38,-385.63,40,0
A	goto	1411/1,-4451.85,-417.70,40,0
A	goto	1411/1,-4455.03,-450.49,40,0
A	goto	1411/1,-4478.29,-449.08,40,0
A	goto	1411/1,-4451.85,-417.70,40,0
A	goto	1411/1,-4452.38,-385.63,40,0
A	goto	1411/1,-4442.34,-347.2,40,0
A	goto	1411/1,-4446.57,-313.01,40,0
A	goto	1411/1,-4451.33,-283.40,40,0
A	goto	1411/1,-4419.60,-246.04,40,0
A	goto	1411/1,-4384.70,-281.990,40,0
A	goto	1411/1,-4349.81,-287.63,40,0
A	goto	1411/1,-4284.24,-283.05,40,0
A	complete	789,1
A	mob	Scorpid Worker
S	
T	loop	
A	goto	1411/1,-4340.82,-628.50,0
A	goto	1411/1,-4340.82,-628.50,25,0
A	goto	1411/1,-4375.71,-507.590,25,0
A	goto	1411/1,-4467.19,-506.53,25,0
A	goto	1411/1,-4433.88,-329.93,25,0
A	goto	1411/1,-4452.38,-232.640,25,0
A	goto	1411/1,-4283.71,-228.76,25,0
A	goto	1411/1,-4220.26,-209.73,25,0
A	goto	1411/1,-4144.65,-269.65,25,0
A	goto	1411/1,-4125.62,-321.12,25,0
A	goto	1411/1,-4015.64,-371.53,25,0
A	complete	5441,1
A	target	Lazy Peon
A	use	16114
S	
A	goto	1411/1,-4221.85,-561.52
A	turnin	4402
A	target	Galgar
A	isQuestComplete	4402
S	
A	goto	1411/1,-4214.45,-565.40
A	collect	159,5,6394,1 << !Rogue !Warrior !Hunter !Shaman
A	collect	2512,1000,6394,1 << Hunter
A	vendor	
A	target	Duokna
A	money	>0.1 << Rogue/Warrior
A	itemcount	159,<5 << !Rogue !Warrior !Hunter !Shaman
A	itemcount	2512,<600 << Hunter
S	
T	label	Sting
A	goto	1411/1,-4198.58,-602.41,12,0
A	goto	1411/1,-4186.42,-599.95
A	turnin	789,2
A	turnin	789
A	target	Gornek
S	Shaman
T	season	2
A	train	8042
A	turnin	77587
A	turnin	77585
A	goto	1411/1,-4203.87,-623.92
A	accept	1516
A	goto	1411/1,-4204.4,-629.91
A	target	Shikrik
A	target	Canaga Earthcaller
S	Shaman
T	season	0
A	train	8042
A	goto	1411/1,-4203.87,-623.92
A	accept	1516
A	goto	1411/1,-4204.4,-629.91
A	target	Shikrik
A	target	Canaga Earthcaller
S	Mage
T	season	0
A	goto	1411/1,-4210.22,-625.33
A	train	116
A	target	Mai'ah
S	Priest
T	season	0
A	goto	1411/1,-4202.28,-617.22
A	train	589
A	money	<0.021
A	target	Ken'jai
S	Priest
T	season	0
A	goto	1411/1,-4202.28,-617.22
A	train	1243
A	train	589
A	money	<0.011
A	target	Ken'jai
S	Priest
T	season	0
A	goto	1411/1,-4202.28,-617.22
A	train	589
A	money	<0.01
A	target	Ken'jai
S	Priest
T	season	0
A	goto	1411/1,-4202.28,-617.22
A	train	589
A	turnin	3085
A	money	<0.021
A	target	Ken'jai
S	Priest
T	season	0
A	goto	1411/1,-4202.28,-617.22
A	train	1243
A	train	589
A	turnin	3085
A	money	<0.011
A	target	Ken'jai
S	Priest
T	season	0
A	goto	1411/1,-4202.28,-617.22
A	train	589
A	turnin	3085
A	money	<0.01
A	target	Ken'jai
S	!Warlock
A	goto	1411/1,-4228.19,-629.20
A	turnin	792
A	accept	794
A	target	Zureetha Fargaze
S	Hunter
T	season	2
T	optional	
A	goto	1411/1,-4227.66,-635.20
A	train	1978
A	turnin	77590
A	turnin	77584
A	target	Jen'shan
A	xp	<4,1
S	Hunter
T	season	2
A	goto	1411/1,-4227.66,-635.20
A	turnin	77590
A	turnin	77584
A	target	Jen'shan
S	Hunter
T	season	0
A	goto	1411/1,-4227.66,-635.20
A	train	1978
A	target	Jen'shan
A	xp	<4,1
A	money	<0.01
S	Warrior
T	xprate	<1.5
A	goto	1411/1,-4230.31,-639.43
A	train	100
A	train	772
A	target	Frang
A	money	<0.02
A	train	772,1
S	Warrior
T	xprate	<1.5
A	goto	1411/1,-4230.31,-639.43
A	train	772
A	target	Frang
S	Warrior
A	goto	1411/1,-4230.31,-639.43
A	train	100
A	target	Frang
A	money	<0.01
S	
A	goto	1411/1,-4322.31,-611.58
A	turnin	5441
A	accept	6394
A	target	Foreman Thazz'ril
S	
T	loop	
A	goto	1411/1,-4324.43,-480.10,0
A	goto	1411/1,-4324.43,-480.10,25,0
A	goto	1411/1,-4259.92,-411.01,25,0
A	goto	1411/1,-4279.48,-402.55,25,0
A	goto	1411/1,-4333.94,-360.95,25,0
A	goto	1411/1,-4335.53,-294.68,25,0
A	goto	1411/1,-4321.25,-243.220,25,0
A	goto	1411/1,-4366.20,-253.44,25,0
A	goto	1411/1,-4391.05,-328.52,25,0
A	goto	1411/1,-4440.75,-319.36,25,0
A	goto	1411/1,-4462.43,-405.370,25,0
A	goto	1411/1,-4398.98,-411.71,25,0
A	complete	4402,1
A	isOnQuest	4402
S	
T	completewith	Thazz
T	label	Cave
A	goto	1411/1,-4360.38,-175.18,30
A	isOnQuest	6394
S	
T	completewith	Thazz
T	requires	Cave
A	goto	1411/1,-4361.44,-144.16,15,0
A	goto	1411/1,-4311.74,-113.14,15,0
A	goto	1411/1,-4274.19,-87.76,10
A	isOnQuest	6394
S	Shaman
T	completewith	Yarrog
T	requires	Cave
A	complete	1516,1
A	mob	Felstalker
S	
T	label	Thazz
A	goto	1411/1,-4274.19,-87.76
A	complete	6394,1
S	
T	label	Yarrog
A	goto	1411/1,-4220.26,-59.56
A	complete	794,1
A	mob	Yarrog Baneshadow
S	Shaman
T	loop	
A	goto	1411/1,-4220.26,-59.56,0
A	goto	1411/1,-4220.26,-59.56,25,0
A	goto	1411/1,-4234.54,5.65,25,0
A	goto	1411/1,-4265.73,-26.43,25,0
A	goto	1411/1,-4275.25,-47.58,25,0
A	goto	1411/1,-4295.87,-54.63,25,0
A	goto	1411/1,-4332.36,-42.64,25,0
A	goto	1411/1,-4332.89,-74.020,25,0
A	goto	1411/1,-4330.24,-115.26,25,0
A	goto	1411/1,-4349.28,-131.12,25,0
A	goto	1411/1,-4368.84,-138.52,25,0
A	goto	1411/1,-4349.28,-131.12,25,0
A	goto	1411/1,-4315.97,-131.47,25,0
A	goto	1411/1,-4300.10,-99.40,25,0
A	goto	1411/1,-4284.77,-105.740,25,0
A	goto	1411/1,-4282.13,-138.17,25,0
A	goto	1411/1,-4260.45,-150.16,25,0
A	goto	1411/1,-4238.77,-138.88,25,0
A	goto	1411/1,-4203.34,-102.92,25,0
A	goto	1411/1,-4211.27,-76.84,25,0
A	goto	1411/1,-4250.40,-88.82,25,0
A	complete	1516,1
A	mob	Felstalker
S	skip
T	completewith	next
A	goto	1411/1,-4326.01,-41.23
A	goto	1411/1,-4793.96,233.36,30
A	link	https://www.youtube.com/watch?v=7vmnvdjbUnM
S	
T	softcore	
T	completewith	next
A	goto	1411/1,-4326.01,-41.23
A	deathskip	
A	target	Spirit Healer
S	
T	softcore	
T	label	Betrayers
A	goto	1411/1,-4709.36,274.960
A	accept	784
A	target	Gar'thok
S	
T	softcore	
A	goto	1411/1,-4663.88,310.56
A	accept	815
A	target	Cook Torka
S	
T	softcore	
T	completewith	next
A	goto	1411/1,-4617.88,290.47,12,0
A	goto	1411/1,-4611.01,293.64,8,0
A	goto	1411/1,-4616.82,317.26,12,0
A	goto	1411/1,-4604.13,364.49,12,0
A	goto	1411/1,-4588.80,383.53,10
S	
T	softcore	
T	completewith	next
A	goto	1411/1,-4593.03,384.94,6,0
A	goto	1411/1,-4594.09,389.87,6,0
A	goto	1411/1,-4589.86,390.93,6,0
A	goto	1411/1,-4589.33,387.760,6,0
A	goto	1411/1,-4594.62,386.35,6,0
A	goto	1411/1,-4595.15,399.74,6,0
A	goto	1411/1,-4585.1,396.92,8
S	
T	softcore	
A	goto	1411/1,-4600.43,384.59
A	accept	791
A	target	Furl Scornbrow
S	Warrior/Rogue
T	softcore	
A	goto	1411/1,-4701.95,366.96
A	train	2575
A	target	Krunn
S	Warrior/Rogue
T	softcore	
A	goto	1411/1,-4706.71,358.15
A	collect	2901,1,784,1
A	target	Wuark
S	Warrior/Rogue
T	softcore	
A	goto	1411/1,-4714.64,372.60
A	train	2018
A	target	Dwukk
A	skill	blacksmithing,1,1
S	
T	completewith	BurningBladeTurnin
A	hs	
A	use	6948
S	
T	xprate	<1.5
A	goto	1411/1,-4322.31,-611.58
A	turnin	6394
A	target	Foreman Thazz'ril
S	
A	goto	1411/1,-4221.85,-561.52
A	turnin	4402
A	target	Galgar
A	isQuestComplete	4402
S	
A	goto	1411/1,-4214.45,-565.40
A	vendor	
A	target	Duokna
A	money	>0.03
S	
T	season	2
A	goto	1411/1,-4222.38,-589.02
A	vendor	
A	target	Rune Broker
A	skipgossip	
S	
T	label	BurningBladeTurnin
A	goto	1411/1,-4228.19,-629.20
A	turnin	794
A	accept	805
A	target	Zureetha Fargaze
S	Priest
T	season	0
A	goto	1411/1,-4202.28,-617.22
A	accept	5649
A	train	591
A	train	17
A	target	Ken'jai
S	Priest
T	season	2
A	goto	1411/1,-4202.28,-617.22
A	accept	5649
A	train	17
A	target	Ken'jai
S	Mage
T	season	0
A	goto	1411/1,-4210.22,-625.33
A	train	143
A	train	2136
A	target	Mai'ah
S	Shaman
A	train	332
A	target	+Shikrik
A	goto	1411/1,-4203.87,-623.92
A	turnin	1516
A	accept	1517
A	target	+Canaga Earthcaller
A	goto	1411/1,-4204.4,-629.91
A	xp	<6,1
S	Shaman
A	goto	1411/1,-4204.4,-629.91
A	turnin	1516
A	accept	1517
A	target	Canaga Earthcaller
S	Hunter
T	season	2
A	goto	1411/1,-4227.66,-635.20
A	train	1130
A	target	Jen'shan
A	money	<0.01
S	Warrior
A	goto	1411/1,-4230.31,-639.43
A	train	3127
A	train	6343
A	target	Frang
A	money	<0.02
S	Warrior
A	goto	1411/1,-4230.31,-639.43
A	train	3127
A	target	Frang
S	Rogue
T	completewith	RogueTraining
A	goto	1411/1,-4190.12,-603.12,15,0
A	goto	1411/1,-4157.87,-601.36,12,0
A	goto	1411/1,-4144.65,-588.67,12
S	Rogue
A	goto	1411/1,-4144.65,-588.67
A	train	1757
A	train	1776
A	target	Rwag
A	money	<0.02
A	xp	<6,1
S	Rogue
T	label	RogueTraining
A	goto	1411/1,-4144.65,-588.67
A	train	1757
A	target	Rwag
A	xp	<6,1
S	Warlock
T	completewith	Hraug3
A	goto	1411/1,-4190.12,-603.12,15,0
A	goto	1411/1,-4157.87,-601.36,12,0
A	goto	1411/1,-4143.06,-594.31,12,0
A	goto	1411/1,-4120.86,-589.72,12,0
A	goto	1411/1,-4107.11,-604.18,12
S	Warlock
T	label	Hraug3
A	goto	1411/1,-4107.11,-604.18
A	collect	16321,1,817,1
A	vendor	
A	target	Hraug
A	money	<0.03
A	train	6307,1
S	Warlock
T	season	2
A	goto	1411/1,-4111.87,-607.00
A	train	695
A	train	1454
A	turnin	77586
A	target	Nartok
A	money	<0.02
S	Warlock
T	season	2
A	goto	1411/1,-4111.87,-607.00
A	train	695
A	turnin	77586
A	target	Nartok
S	Warlock
T	season	0
A	goto	1411/1,-4111.87,-607.00
A	train	695
A	train	1454
A	target	Nartok
A	money	<0.02
S	Warlock
T	season	0
A	goto	1411/1,-4111.87,-607.00
A	train	695
A	target	Nartok
S	Shaman
T	completewith	CallOE1
T	label	Shrine
A	goto	1411/1,-4255.16,-645.07,25,0
A	goto	1411/1,-4245.64,-691.95,25,0
A	goto	1411/1,-4146.77,-787.12,12,0
A	goto	1411/1,-4120.86,-813.21,8,0
A	goto	1411/1,-4220.79,-841.76,10,0
A	goto	1411/1,-4266.26,-853.39,15,0
A	goto	1411/1,-4295.87,-883.36,25
A	isOnQuest	1517
S	Shaman
T	completewith	next
T	requires	Shrine
A	cast	8202
A	use	6635
S	Shaman
T	label	CallOE1
A	goto	1411/1,-4290.59,-878.07
A	turnin	1517
A	accept	1518
A	target	Minor Manifestation of Earth
S	Shaman
A	goto	1411/1,-4204.4,-629.91
A	turnin	1518
A	target	Canaga Earthcaller
S	Shaman
A	goto	1411/1,-4203.87,-623.92
A	train	332
A	target	Shikrik
S	
T	xprate	>1.49
A	goto	1411/1,-4322.31,-611.58
A	turnin	6394
A	target	Foreman Thazz'ril
S	
T	label	Leave
A	goto	1411/1,-4452.38,-631.32,25,0
A	goto	1411/1,-4554.43,-628.50,20,0
A	goto	1411/1,-4600.96,-603.82,25
A	isOnQuest	805
E
G	Guides/forever/Horde-01-12_Durotar.lua
M	classic	
M	tbc	
M	xprate	>1.99
M	selector	Horde
M	name	7-13 Durotar
M	version	1
M	group	RestedXP Forever Guide (H)
M	subgroup	Speedrun Guide 1-22
M	defaultfor	Troll/Orc
M	next	13-20 The Barrens
S	
A	goto	1411/1,-4715.17,-599.240
A	accept	2161
A	target	Ukor
S	
T	completewith	next
A	subzone	367
S	
T	xprate	<1.5
T	loop	
A	goto	1411/1,-4828.32,-777.61,0
A	goto	1411/1,-4822.51,-881.59,25,0
A	goto	1411/1,-4845.24,-829.42,25,0
A	goto	1411/1,-4828.32,-777.61,25,0
A	accept	786
A	target	Lar Prowltusk
S	
T	label	SenjinPickups
A	accept	817
A	target	+Vel'rin Fang
A	goto	1411/1,-4920.86,-797.70
A	accept	818
A	target	+Master Vornal
A	goto	1411/1,-4920.33,-814.270
A	turnin	805
A	accept	808
A	accept	826
A	accept	823
A	target	+Master Gadrin
A	goto	1411/1,-4920.33,-825.55
S	
T	completewith	next
A	goto	1411/1,-4931.96,-815.32,8,0
A	goto	1411/1,-4939.89,-793.12,8
S	Rogue
A	goto	1411/1,-4938.83,-779.37
A	collect	3131,1,786,1
A	target	K'waii
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.9
S	Warlock/Mage/Priest
A	goto	1411/1,-4938.83,-779.37
A	collect	159,20,786,1
A	target	K'waii
A	money	<0.010
S	Warlock/Mage/Priest
A	goto	1411/1,-4938.83,-779.37
A	collect	159,10,786,1
A	target	K'waii
A	money	>0.001
A	money	<0.005
S	Shaman
A	goto	1411/1,-4948.35,-769.15
A	vendor	
A	target	Trayexir
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Shaman
A	goto	1411/1,-4948.35,-769.15
A	collect	2495,1,786,1
A	money	<0.0504
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Rogue
A	goto	1411/1,-4948.35,-769.15
A	vendor	
A	target	Trayexir
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Rogue
A	goto	1411/1,-4948.35,-769.15
A	collect	2494,1,786,1
A	money	<0.0401
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Orc Warrior
A	goto	1411/1,-4948.35,-769.15
A	vendor	
A	target	Trayexir
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Orc Warrior
A	goto	1411/1,-4948.35,-769.15
A	collect	2491,1,786,1
A	money	<0.0484
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Troll Warrior
A	goto	1411/1,-4948.35,-769.15
A	vendor	
A	target	Trayexir
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.8
S	Troll Warrior
A	goto	1411/1,-4948.35,-769.15
A	collect	2490,1,786,1
A	money	<0.0540
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.8
S	Hunter
A	goto	1411/1,-4948.35,-769.15
A	vendor	
A	target	Trayexir
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.3
S	Hunter
A	goto	1411/1,-4948.35,-769.15
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
A	goto	1411/1,-4939.36,-838.941
A	train	143
A	train	2136
A	target	Un'Thuwa
S	Warrior/Rogue
T	completewith	TravelToTiragarde
A	collect	2862,1,786,1
A	skill	blacksmithing,<1,1
A	train	2575,3
S	Warrior
T	xprate	<2.1
T	season	2
T	loop	
A	goto	1411/1,-4611.54,-984.88,0
A	goto	1411/1,-4611.54,-984.88,40,0
A	goto	1411/1,-4486.75,-1024.00,40,0
A	goto	1411/1,-4423.30,-1015.90,40,0
A	collect	207062,1
A	mob	Kolkar Drudge
A	mob	Kolkar Outrunner
A	train	403475,1
S	
T	completewith	MainIsle
A	complete	818,2,4
A	mob	+Pygmy Surf Crawler
A	mob	+Surf Crawler
A	complete	818,1,2
A	mob	+Makrura Shellhide
A	mob	+Makrura Clacker
S	
T	completewith	MainIsle
A	complete	817,1
A	mob	Durotar Tiger
S	
T	softcore	
T	completewith	MainIsle
A	complete	815,1
A	mob	Bloodtalon Taillasher
S	
T	label	MainIsle
A	goto	1411/1,-5501.95,-1167.12,150
A	isOnQuest	826
S	
T	completewith	ZalazaneKill1
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
A	goto	1411/1,-5526.27,-1286.62
A	complete	808,1
S	
T	label	ZalazaneKill1
A	goto	1411/1,-5526.27,-1286.62
A	complete	826,3
A	mob	Zalazane
S	Mage
T	season	2
A	goto	1411/1,-5526.27,-1286.62
A	collect	203753,1
A	mob	Zalazane
A	train	401765,1
S	Mage
T	season	2
A	collect	211779,1
A	train	401765
A	use	203753
S	
T	completewith	TrollsDone
A	complete	817,1
A	mob	Durotar Tiger
S	
T	completewith	TigerFur
A	complete	818,2
A	mob	+Pygmy Surf Crawler
A	mob	+Surf Crawler
A	complete	818,1
A	mob	+Makrura Shellhide
A	mob	+Makrura Clacker
S	
T	softcore	
T	completewith	CrawlMakru
A	complete	815,1
A	mob	Bloodtalon Taillasher
S	
T	label	TrollsDone
T	loop	
A	goto	1411/1,-5517.29,-1320.46,0
A	goto	1411/1,-5517.29,-1320.46,40,0
A	goto	1411/1,-5479.74,-1284.50,40,0
A	goto	1411/1,-5449.08,-1248.55,40,0
A	goto	1411/1,-5446.96,-1154.08,40,0
A	goto	1411/1,-5445.90,-1112.13,40,0
A	goto	1411/1,-5525.22,-1103.67,40,0
A	goto	1411/1,-5580.21,-1097.32,40,0
A	goto	1411/1,-5584.44,-1163.95,40,0
A	goto	1411/1,-5582.85,-1250.31,40,0
A	goto	1411/1,-5517.29,-1293.67,40,0
A	complete	826,1
A	mob	+Hexed Troll
A	complete	826,2
A	mob	+Voodoo Troll
S	Priest
T	season	2
T	loop	
A	goto	1411/1,-5517.29,-1320.46,0
A	goto	1411/1,-5517.29,-1320.46,40,0
A	goto	1411/1,-5479.74,-1284.50,40,0
A	goto	1411/1,-5449.08,-1248.55,40,0
A	goto	1411/1,-5446.96,-1154.08,40,0
A	goto	1411/1,-5445.90,-1112.13,40,0
A	goto	1411/1,-5525.22,-1103.67,40,0
A	goto	1411/1,-5580.21,-1097.32,40,0
A	goto	1411/1,-5584.44,-1163.95,40,0
A	goto	1411/1,-5582.85,-1250.31,40,0
A	goto	1411/1,-5517.29,-1293.67,40,0
A	collect	205947,1
A	mob	Voodoo Troll
A	train	402852,1
S	
T	label	TigerFur
T	loop	
A	goto	1411/1,-5123.90,-1132.93,0
A	goto	1411/1,-5413.65,-1288.73,50,0
A	goto	1411/1,-5384.57,-1312.35,50,0
A	goto	1411/1,-5383.51,-1184.04,50,0
A	goto	1411/1,-5382.45,-1039.870,50,0
A	goto	1411/1,-5417.88,-1015.54,50,0
A	goto	1411/1,-5445.38,-1055.02,50,0
A	goto	1411/1,-5149.80,-1013.08,50,0
A	goto	1411/1,-5166.72,-1091.33,50,0
A	goto	1411/1,-5128.65,-1135.39,50,0
A	goto	1411/1,-5111.73,-1182.98,50,0
A	goto	1411/1,-5179.41,-1321.51,50,0
A	goto	1411/1,-5209.55,-1353.24,50,0
A	goto	1411/1,-5213.25,-1412.46,50,0
A	goto	1411/1,-5154.56,-1412.11,50,0
A	goto	1411/1,-5084.24,-1382.14,50,0
A	goto	1411/1,-5123.90,-1132.93,50,0
A	complete	817,1
A	mob	Durotar Tiger
S	
T	label	CrawlMakru
T	loop	
A	goto	1411/1,-5287.28,-1486.84,0
A	goto	1411/1,-5107.5,-1234.8,0
A	goto	1411/1,-5130.77,-1039.87,0
A	goto	1411/1,-5023.96,-945.75,0
A	goto	1411/1,-4779.15,-1119.18,0
A	goto	1411/1,-5287.28,-1486.84,50,0
A	goto	1411/1,-5107.5,-1234.8,50,0
A	goto	1411/1,-5130.77,-1039.87,50,0
A	goto	1411/1,-5023.96,-945.75,50,0
A	goto	1411/1,-4779.15,-1119.18,50,0
A	complete	818,2
A	mob	+Pygmy Surf Crawler
A	mob	+Surf Crawler
A	complete	818,1
A	mob	+Makrura Shellhide
A	mob	+Makrura Clacker
S	
T	softcore	
A	goto	1411/1,-5127.6,-1351.48,0
A	goto	1411/1,-5109.09,-1139.98,0
A	goto	1411/1,-5184.7,-967.6,0
A	goto	1411/1,-5322.18,-811.8,0
A	goto	1411/1,-5507.24,-708.520,0
A	goto	1411/1,-5127.6,-1351.48,40,0
A	goto	1411/1,-5109.09,-1139.98,40,0
A	goto	1411/1,-5184.7,-967.6,40,0
A	goto	1411/1,-5322.18,-811.8,40,0
A	goto	1411/1,-5507.24,-708.520,40,0
A	goto	1411/1,-5540.02,-795.23,40,0
A	goto	1411/1,-5593.43,-816.73,40,0
A	goto	1411/1,-5651.06,-824.49,40,0
A	goto	1411/1,-5679.08,-775.84,40,0
A	goto	1411/1,-5675.91,-688.78,40,0
A	goto	1411/1,-5647.36,-671.50,40,0
A	goto	1411/1,-5621.98,-648.24,40,0
A	goto	1411/1,-5544.25,-654.23,40,0
A	complete	815,1
A	mob	Bloodtalon Taillasher
S	
T	softcore	
T	completewith	next
A	goto	1411/1,-5002.81,-774.08,50,0
A	deathskip	
S	
T	hardcore	
T	completewith	Zalazaneturnin
A	subzone	367
S	
A	goto	1411/1,-4948.88,-768.79
A	vendor	
A	target	Trayexir
A	isOnQuest	808
S	Mage
A	goto	1411/1,-4939.36,-838.94
A	train	118
A	target	Un'Thuwa
S	
T	label	Zalazaneturnin
A	turnin	808
A	turnin	826,2
A	turnin	826
A	target	+Master Gadrin
A	goto	1411/1,-4920.86,-825.90
A	turnin	818
A	target	+Master Vornal
A	goto	1411/1,-4920.86,-813.91
A	turnin	817
A	target	+Vel'rin Fang
A	goto	1411/1,-4920.86,-797.70
S	Priest
T	season	2
A	emote	KNEEL,208309
A	goto	1411/1,-4887.54,-752.93
A	skipgossip	208307,1
A	aura	417316
A	train	402852,1
S	Priest
T	season	2
T	completewith	TravelToTiragarde
A	aura	418459
A	use	205947
A	train	402852
A	itemcount	205947,1
S	
T	completewith	TravelToTiragarde
S	Rogue
T	season	2
A	goto	1411/1,-4702.48,-259.78
A	collect	203990,1
A	target	Ba'so
A	skipgossip	
A	itemcount	207098,1
A	train	400094,1
S	Rogue
T	season	2
A	train	400094
A	use	203990
A	itemcount	203990,1
S	
T	hardcore	
T	completewith	next
A	subzone	362
S	
T	hardcore	
T	label	Betrayers
A	goto	1411/1,-4709.36,274.960
A	accept	784
A	target	Gar'thok
S	
T	hardcore	
T	completewith	next
A	goto	1411/1,-4617.88,290.47,12,0
A	goto	1411/1,-4611.01,293.64,8,0
A	goto	1411/1,-4616.82,317.26,12,0
A	goto	1411/1,-4604.13,364.49,12,0
A	goto	1411/1,-4588.80,383.53,10
S	
T	hardcore	
T	completewith	next
A	goto	1411/1,-4593.03,384.94,6,0
A	goto	1411/1,-4594.09,389.87,6,0
A	goto	1411/1,-4589.86,390.93,6,0
A	goto	1411/1,-4589.33,387.760,6,0
A	goto	1411/1,-4594.62,386.35,6,0
A	goto	1411/1,-4595.15,399.74,6,0
A	goto	1411/1,-4585.1,396.92,8
S	
T	hardcore	
A	goto	1411/1,-4600.43,384.59
A	accept	791
A	target	Furl Scornbrow
S	Warrior/Rogue
T	hardcore	
A	goto	1411/1,-4701.95,366.96
A	train	2575
A	target	Krunn
S	Warrior/Rogue
T	hardcore	
A	goto	1411/1,-4706.71,358.15
A	collect	2901,1,784,1
A	target	Wuark
S	Warrior/Rogue
T	hardcore	
A	goto	1411/1,-4714.64,372.60
A	train	2018
A	target	Dwukk
A	skill	blacksmithing,1,1
S	
T	softcore	
T	xprate	<1.5
T	label	TravelToTiragarde
A	goto	1411/1,-5092.7,-249.56,60,0
A	subzone	372
A	isOnQuest	784
S	
T	softcore	
T	xprate	>1.49
T	label	TravelToTiragarde
A	goto	1411/1,-5092.7,-249.56,60,0
A	subzone	372
A	isOnQuest	784
A	maxlevel	11
S	
T	sticky	
T	completewith	AgedEnvelope
A	unitscan	Watch Commander Zalaphil
S	
T	completewith	Benedict
T	requires	TravelToTiragarde
A	goto	1411/1,-5124.95,-243.92,8,0
A	goto	1411/1,-5115.96,-251.68,8,0
A	goto	1411/1,-5111.21,-232.29,8,0
A	goto	1411/1,-5097.46,-232.29,8
S	Priest
T	season	2
T	completewith	ScrapsFinished
A	collect	205940,1
A	train	425216,1
S	
T	completewith	AgedEnvelope
A	complete	784,1
A	mob	+Kul Tiras Sailor
A	complete	784,2
A	mob	+Kul Tiras Marine
A	complete	791,1
S	
T	label	Benedict
A	goto	1411/1,-5121.78,-245.68
A	complete	784,3
A	collect	4882,1,830,1
A	mob	Lieutenant Benedict
A	maxlevel	11
S	
T	label	AgedEnvelope
A	goto	1411/1,-5128.13,-231.58,5,0
A	goto	1411/1,-5126.01,-221.36,5,0
A	goto	1411/1,-5124.42,-229.82,5,0
A	goto	1411/1,-5131.83,-229.82,5,0
A	goto	1411/1,-5131.83,-222.42,5,0
A	goto	1411/1,-5096.40,-223.83
A	collect	4881,1,830
A	accept	830
A	use	4881
A	maxlevel	11
S	
T	loop	
A	goto	1411/1,-5081.60,-246.740,0
A	goto	1411/1,-5010.74,-254.50,30,0
A	goto	1411/1,-4995.41,-186.46,30,0
A	goto	1411/1,-5034.54,-148.75,30,0
A	goto	1411/1,-5057.80,-83.89,30,0
A	goto	1411/1,-4952.05,-113.50,30,0
A	goto	1411/1,-4943.06,-248.50,30,0
A	goto	1411/1,-5081.60,-246.740,30,0
A	complete	784,1
A	mob	+Kul Tiras Sailor
A	complete	784,2
A	mob	+Kul Tiras Marine
A	complete	791,1
A	mob	+Kul Tiras Marine
A	mob	+Kul Tiras Sailor
A	itemcount	4870,<8
A	maxlevel	11
S	
T	optional	
T	loop	
A	goto	1411/1,-5081.60,-246.740,0
A	goto	1411/1,-5010.74,-254.50,30,0
A	goto	1411/1,-4995.41,-186.46,30,0
A	goto	1411/1,-5034.54,-148.75,30,0
A	goto	1411/1,-5057.80,-83.89,30,0
A	goto	1411/1,-4952.05,-113.50,30,0
A	goto	1411/1,-4943.06,-248.50,30,0
A	goto	1411/1,-5081.60,-246.740,30,0
A	complete	784,1
A	mob	+Kul Tiras Sailor
A	complete	784,2
A	mob	+Kul Tiras Marine
A	maxlevel	11
S	
T	label	ScrapsFinished
T	loop	
A	goto	1411/1,-5081.60,-246.740,0
A	goto	1411/1,-5010.74,-254.50,30,0
A	goto	1411/1,-4995.41,-186.46,30,0
A	goto	1411/1,-5034.54,-148.75,30,0
A	goto	1411/1,-5057.80,-83.89,30,0
A	goto	1411/1,-4952.05,-113.50,30,0
A	goto	1411/1,-4943.06,-248.50,30,0
A	goto	1411/1,-5081.60,-246.740,30,0
A	complete	791,1
A	mob	Kul Tiras Sailor
A	mob	Kul Tiras Marine
A	maxlevel	11
S	Priest
T	season	2
T	loop	
A	goto	1411/1,-5081.60,-246.740,0
A	goto	1411/1,-5010.74,-254.50,30,0
A	goto	1411/1,-4995.41,-186.46,30,0
A	goto	1411/1,-5034.54,-148.75,30,0
A	goto	1411/1,-5057.80,-83.89,30,0
A	goto	1411/1,-4952.05,-113.50,30,0
A	goto	1411/1,-4943.06,-248.50,30,0
A	goto	1411/1,-5081.60,-246.740,30,0
A	collect	205940,1
A	train	425216,1
A	mob	Kul Tiras Sailor
A	mob	Kul Tiras Marine
A	maxlevel	11
S	Priest
T	season	2
T	completewith	next
A	goto	1411/1,-4887.54,-752.93
A	emote	KNEEL,208309
A	aura	417316
A	skipgossip	208307,1
A	target	Serpent Loa
A	train	425216,1
S	Priest
T	season	2
A	use	205940
A	itemcount	205940,1
A	train	425216
S	
T	softcore	
T	completewith	RazorTurnins1
A	goto	1411/1,-4992.24,-77.54,120,0
A	deathskip	
S	
T	hardcore	
T	completewith	next
A	subzone	362
S	
T	xprate	<2.1
A	goto	1411/1,-4724.69,287.30
A	turnin	823
A	accept	806
A	target	Orgnil Soulscar
S	
T	xprate	>2.09
A	goto	1411/1,-4724.69,287.30
A	turnin	823
A	target	Orgnil Soulscar
S	
T	xprate	<2.1
A	goto	1411/1,-4709.36,274.960
A	turnin	784
A	turnin	830
A	accept	831
A	accept	837
A	target	Gar'Thok
A	isQuestComplete	784
A	isOnQuest	830
S	
T	xprate	<2.1
A	goto	1411/1,-4709.36,274.960
A	accept	831
A	accept	837
A	target	Gar'Thok
A	isQuestTurnedIn	830
S	
T	xprate	>2.09
A	goto	1411/1,-4709.36,274.960
A	turnin	784
A	turnin	830
A	accept	831
A	target	Gar'Thok
A	isQuestComplete	784
A	isOnQuest	830
S	
T	xprate	>2.09
A	goto	1411/1,-4709.36,274.960
A	accept	831
A	target	Gar'Thok
A	isQuestTurnedIn	830
S	
A	goto	1411/1,-4663.88,310.56
A	turnin	815
A	target	Cook Torka
A	isQuestComplete	815
S	
T	completewith	next
A	goto	1411/1,-4617.88,290.47,12,0
A	goto	1411/1,-4611.01,293.64,8,0
A	goto	1411/1,-4616.82,317.26,12,0
A	goto	1411/1,-4604.13,364.49,12,0
A	goto	1411/1,-4588.80,383.53,10
S	
T	completewith	next
A	goto	1411/1,-4593.03,384.94,6,0
A	goto	1411/1,-4594.09,389.87,6,0
A	goto	1411/1,-4589.86,390.93,6,0
A	goto	1411/1,-4589.33,387.760,6,0
A	goto	1411/1,-4594.62,386.35,6,0
A	goto	1411/1,-4595.15,399.74,6,0
A	goto	1411/1,-4585.1,396.92,8
S	
A	goto	1411/1,-4600.43,384.59
A	turnin	791
A	target	Furl Scornbrow
S	Warrior/Rogue
A	goto	1411/1,-4701.95,366.96
A	train	2575
A	target	Krunn
S	Warrior/Rogue
A	goto	1411/1,-4706.71,358.15
A	collect	2901,1,825,1
A	target	Wuark
S	Warrior/Rogue
A	goto	1411/1,-4714.64,372.60
A	train	2018
A	target	Dwukk
A	skill	blacksmithing,1,1
S	Shaman
A	goto	1411/1,-4713.06,382.12
A	vendor	
A	target	Uhgar
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Shaman
A	goto	1411/1,-4713.06,382.12
A	collect	2495,1,825,1
A	money	<0.0504
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Rogue
A	goto	1411/1,-4713.06,382.12
A	vendor	
A	target	Uhgar
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Rogue
A	goto	1411/1,-4713.06,382.12
A	collect	2494,1,825,1
A	money	<0.0401
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Orc Warrior
A	goto	1411/1,-4713.06,382.12
A	vendor	
A	target	Uhgar
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Orc Warrior
A	goto	1411/1,-4713.06,382.12
A	collect	2491,1,825,1
A	money	<0.0484
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<4.2
S	Troll Warrior
A	goto	1411/1,-4713.06,382.12
A	vendor	
A	target	Uhgar
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.8
S	Troll Warrior
A	goto	1411/1,-4713.06,382.12
A	collect	2490,1,825,1
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
A	goto	1411/1,-4763.29,361.67
A	vendor	
A	target	Ghrawt
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.3
S	Hunter
A	goto	1411/1,-4763.29,361.67
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
A	goto	1411/1,-4763.29,361.67
A	collect	2515,1200,6082,1
A	target	Ghrawt
S	Hunter
A	goto	1411/1,-4763.29,361.67
A	collect	2515,1200,6082,1
A	target	Ghrawt
A	itemcount	2515,<600
S	
A	goto	1411/1,-4686.09,340.52
A	vendor	
A	home	
A	turnin	2161
A	target	Innkeeper Grosk
A	bindlocation	362
S	Priest
A	goto	1411/1,-4831.5,295.05
A	turnin	5649
A	accept	5648
A	train	2052
A	target	Tai'jin
S	Priest
A	goto	1411/1,-4770.16,170.62
A	complete	5648,1
A	target	Grunt Kor'ja
S	Priest
A	goto	1411/1,-4831.5,295.05
A	turnin	5648
A	trainer	
A	target	Tai'jin
S	Rogue/Warrior
A	goto	1411/1,-4826.74,330.30
A	train	3273
A	money	<0.01
A	target	Rawrk
S	
A	goto	1411/1,-4838.37,321.49
A	collect	4496,1,825,1
A	target	Jark
A	money	<0.05
S	Shaman
T	xprate	>1.49
A	goto	1411/1,-4839.96,307.04
A	train	8050
A	accept	2983
A	target	Swart
A	isNotOnQuest	1522
S	Warrior
T	xprate	>1.49
A	goto	1411/1,-4827.27,311.62
A	accept	1505
A	trainer	
A	target	Tarshaw Jaggedscar
S	Warlock
T	xprate	>1.49
A	goto	1411/1,-4837.31,356.030
A	accept	1506
A	trainer	
A	target	Dhugru Gorelust
S	Warlock
T	xprate	>1.49
A	goto	1411/1,-4854.76,345.81
A	collect	16302,1,837,1
A	target	Kitha
A	money	<0.01
A	train	7799,1
S	Priest
T	xprate	>1.49
A	goto	1411/1,-4831.5,295.05
A	accept	5654
A	accept	5660
A	trainer	
A	target	Tai'jin
S	Rogue
T	xprate	>1.49
A	goto	1411/1,-4710.94,268.26
A	train	674
A	target	Kaplak
S	Hunter
A	goto	1411/1,-4704.07,275.31
A	accept	6062
A	trainer	
A	target	Thotar
S	Hunter
T	loop	
A	goto	1411/1,-4693.49,-183.64,0
A	goto	1411/1,-4699.31,101.88,40,0
A	goto	1411/1,-4696.14,37.73,40,0
A	goto	1411/1,-4693.49,-1.4,40,0
A	goto	1411/1,-4701.42,-66.26,40,0
A	goto	1411/1,-4649.61,-82.83,40,0
A	use	15917
A	complete	6062,1
A	mob	Dire Mottled Boar
S	Hunter
A	goto	1411/1,-4704.07,275.31
A	turnin	6062
A	accept	6083
A	target	Thotar
S	Hunter
A	goto	1411/1,-4704.07,275.31
A	accept	6083
A	target	Thotar
S	Hunter
T	completewith	next
S	Hunter
T	loop	
A	goto	1411/1,-5115.44,984.19,0
A	goto	1411/1,-5091.64,809.0,40,0
A	goto	1411/1,-5129.18,877.03,40,0
A	goto	1411/1,-5137.11,934.49,40,0
A	use	15919
A	complete	6083,1
A	mob	Surf Crawler
S	Hunter
A	goto	1411/1,-4704.07,275.31
A	turnin	6083
A	accept	6082
A	target	Thotar
S	Hunter
T	completewith	next
S	Hunter
T	loop	
A	goto	1411/1,-4862.16,506.2,0
A	goto	1411/1,-4862.16,506.2,40,0
A	goto	1411/1,-4818.28,616.53,40,0
A	goto	1411/1,-4829.38,733.21,40,0
A	goto	1411/1,-4908.17,727.57,40,0
A	goto	1411/1,-4933.55,776.21,40,0
A	goto	1411/1,-4973.73,846.71,40,0
A	goto	1411/1,-4984.31,906.29,40,0
A	use	15920
A	complete	6082,1
A	mob	Armored Scorpid
S	Hunter
A	goto	1411/1,-4704.07,275.31
A	turnin	6082
A	accept	6081
A	target	Thotar
S	Hunter
T	completewith	ConscriptH
S	Hunter
A	goto	1411/1,-4666.0,305.63
A	vendor	
A	collect	117,5,828,1
A	target	Grimtak
A	isQuestAvailable	834
S	!Hunter
A	goto	1411/1,-4666.0,305.63
A	vendor	
A	vendor	
A	target	Grimtak
S	
T	label	ConscriptH
T	xprate	>1.49
A	goto	1411/1,-4648.55,271.43
A	accept	840
A	target	Takrin Pathseeker
S	
T	xprate	<2.1
T	loop	
A	goto	1411/1,-4312.79,407.50,0
A	goto	1411/1,-4312.79,407.50,50,0
A	goto	1411/1,-4314.91,487.52,50,0
A	goto	1411/1,-4251.99,492.8,50,0
A	goto	1411/1,-4167.39,500.91,50,0
A	goto	1411/1,-4164.21,459.32,50,0
A	goto	1411/1,-4180.08,382.12,50,0
A	goto	1411/1,-4251.99,384.23,50,0
A	complete	837,3
A	mob	+Razormane Dustrunner
A	complete	837,4
A	mob	+Razormane Battleguard
S	Warrior
T	season	2
T	loop	
A	goto	1411/1,-4565.01,82.49,0
A	goto	1411/1,-4617.35,18.34,30,0
A	goto	1411/1,-4615.77,72.98,30,0
A	goto	1411/1,-4578.75,76.15,30,0
A	goto	1411/1,-4570.29,109.99,30,0
A	goto	1411/1,-4543.33,81.08,30,0
A	goto	1411/1,-4526.41,70.86,30,0
A	goto	1411/1,-4478.29,59.23,30,0
A	goto	1411/1,-4450.80,62.40,30,0
A	goto	1411/1,-4442.34,112.46,30,0
A	goto	1411/1,-4565.01,82.49,30,0
A	collect	206994,1
A	complete	837,1
A	mob	+Razormane Quilboar
A	complete	837,2
A	mob	+Razormane Scout
A	train	403475,1
S	Warrior/Shaman
T	xprate	<2.1
T	completewith	next
A	goto	1413/1,-3686.10,303.14,40
A	zoneskip	The Barrens
S	Warrior/Shaman
T	xprate	<2.1
A	goto	1413/1,-3687.11,303.14
A	turnin	840
A	accept	842
A	target	Kargal Battlescar
S	
T	xprate	>2.09
T	completewith	next
A	goto	1413/1,-3686.10,303.14,40
A	zoneskip	The Barrens
S	
T	xprate	>2.09
A	goto	1413/1,-3687.11,303.14
A	turnin	840
A	accept	842
A	target	Kargal Battlescar
S	Warrior
T	xprate	>1.49
A	goto	1413/1,-3598.95,186.93
A	turnin	1505
A	accept	1498
A	target	Uzzek
S	Shaman
T	xprate	>1.49
A	goto	1413/1,-3037.56,264.63
A	turnin	2983
A	accept	1524
A	target	Kranal Fiss
S	Shaman
T	xprate	>1.49
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
T	xprate	>1.49
T	label	CallofFire3
A	goto	1411/1,-3999.24,-268.95
A	turnin	1524
A	accept	1525
A	target	Telf Joolam
S	Warrior
T	xprate	>1.49
T	loop	
A	goto	1411/1,-4246.17,950.35,0
A	goto	1411/1,-4033.08,721.22,40,0
A	goto	1411/1,-4036.79,807.94,40,0
A	goto	1411/1,-4047.36,929.2,40,0
A	goto	1411/1,-4151.0,952.46,40,0
A	goto	1411/1,-4246.17,950.35,40,0
A	complete	1498,1
A	mob	Lightning Hide
S	!Warrior
T	xprate	<2.1
T	completewith	next
A	goto	1411/1,-4165.27,903.11,20
A	goto	1411/1,-4165.27,903.11,20
A	goto	1411/1,-4165.27,903.11,20
S	
T	xprate	<2.1
T	softcore	
A	goto	1411/1,-4190.12,868.22
A	complete	806,1
A	mob	Fizzle Darkstorm
A	mob	Imp Minion
A	mob	Burning Blade Fanatic
A	mob	Lightning Hide
S	
T	xprate	<2.1
T	hardcore	
A	goto	1411/1,-4190.12,868.22
A	complete	806,1
A	mob	Fizzle Darkstorm
A	mob	Imp Minion
A	mob	Burning Blade Fanatic
A	mob	Lightning Hide
S	
T	xprate	<2.1
T	softcore	
A	goto	1411/1,-4449.74,1188.64
A	deathskip	
A	isQuestComplete	806
S	
T	xprate	<2.1
T	hardcore	
A	goto	1411/1,-4035.2,679.63,60
A	isQuestComplete	806
S	
T	xprate	<2.1
T	completewith	next
A	goto	1411/1,-4414.31,999.70,50
S	
T	xprate	<2.1
A	goto	1411/1,-4414.31,999.70
A	accept	834
A	target	Rezlak
S	Warrior
T	xprate	<2.1
T	season	2
T	completewith	next
A	collect	206995,1
A	mob	Dustwind Savage
A	mob	Dustwind Storm Witch
A	mob	Dustwind Pillager
A	mob	Dustwind Harpy
A	train	403475,1
S	
T	xprate	<2.1
T	loop	
A	goto	1411/1,-4590.39,1036.36,0
A	goto	1411/1,-4590.39,1036.36,40,0
A	goto	1411/1,-4590.39,950.7,40,0
A	goto	1411/1,-4613.12,902.410,40,0
A	goto	1411/1,-4651.19,893.24,40,0
A	goto	1411/1,-4693.49,832.97,40,0
A	goto	1411/1,-4598.32,854.12,40,0
A	goto	1411/1,-4642.20,696.20,40,0
A	goto	1411/1,-4505.79,597.14,40,0
A	goto	1411/1,-4466.13,630.980,40,0
A	goto	1411/1,-4526.41,679.98,40,0
A	goto	1411/1,-4457.67,720.17,40,0
A	complete	834,1
S	Warrior
T	xprate	<2.1
T	season	2
T	loop	
A	goto	1411/1,-4816.69,972.910,0
A	goto	1411/1,-4818.81,848.48,40,0
A	goto	1411/1,-4755.36,952.82,40,0
A	goto	1411/1,-4704.07,964.10,40,0
A	goto	1411/1,-4818.28,975.38,40,0
A	goto	1411/1,-4718.87,1076.19,40,0
A	goto	1411/1,-4672.87,1131.89,40,0
A	goto	1411/1,-4816.69,972.910,40,0
A	collect	206995,1
A	mob	Dustwind Savage
A	mob	Dustwind Storm Witch
A	mob	Dustwind Pillager
A	mob	Dustwind Harpy
A	train	403475,1
S	
T	xprate	<2.1
A	goto	1411/1,-4414.31,999.70
A	turnin	834
A	target	Rezlak
S	Shaman
T	xprate	<2.1
T	completewith	next
A	goto	1411/1,-4575.58,1157.27,40,0
A	goto	1411/1,-4677.63,1217.54,40,0
A	goto	1411/1,-4852.12,1137.88,40,0
A	goto	1411/1,-4916.1,810.41,40,0
A	subzone	371
S	Shaman
T	xprate	<2.1
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
S	Mage
T	xprate	<2.1
T	season	2
T	loop	
A	goto	1411/1,-4761.17,1490.73,0
A	goto	1411/1,-4868.51,1466.76,30,0
A	goto	1411/1,-4854.23,1500.6,30,0
A	goto	1411/1,-4806.12,1486.15,30,0
A	goto	1411/1,-4761.17,1490.73,30,0
A	collect	203752,1
A	mob	Burning Blade Thug
A	mob	Burning Blade Neophyte
A	mob	Burning Blade Cultist
A	train	401768,1
S	Warrior/Shaman
T	xprate	>2.09
T	completewith	next
A	goto	1413/1,-3686.10,303.14,40
A	zoneskip	The Barrens
S	Warrior
T	xprate	>2.09
A	goto	1413/1,-3598.95,186.93
A	turnin	1498
A	accept	1502
A	target	Uzzek
S	
T	xprate	>2.09
T	softcore	
T	completewith	
A	goto	1413/1,-2516.71,-590.71
A	deathskip	
A	subzoneskip	380
S	
T	xprate	>2.09
T	hardcore	
T	completewith	
A	goto	1413/1,-2680.87,-365.05,150
S	
T	xprate	>2.09
A	goto	1413/1,-2595.75,-473.15
A	accept	871
A	accept	5041
A	target	Thork
S	
T	xprate	>2.09
A	goto	1413/1,-2670.74,-482.61
A	turnin	842
A	accept	844
A	target	Sergra Darkthorn
S	
T	xprate	>2.09
A	goto	1413/1,-2709.24,-403.57
A	accept	6365
A	target	Zargh
S	
T	xprate	>2.09
A	goto	1413/1,-2645.40,-406.94
A	home	
A	target	Innkeeper Boorand Plainswind
A	bindlocation	380
A	subzoneskip	380,1
S	
T	xprate	>2.09
A	goto	1413/1,-2595.75,-437.35
A	fp	The Crossroads
A	turnin	6365
A	accept	6384
A	target	Devrak
S	
T	xprate	>2.09
A	goto	1413/1,-2595.75,-437.35
A	fly	Orgrimmar
A	target	Devrak
A	zoneskip	Orgrimmar
S	
T	xprate	>2.09
A	goto	1454/1,-4439.37,1633.99
A	turnin	6384
A	accept	6385
A	target	Innkeeper Gryshka
S	Rogue
A	goto	1454/1,-4355.53,1520.68
A	collect	3135,1
A	vendor	
A	target	Trak'gen
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.3
S	Rogue
T	optional	
T	completewith	AdmiralTurnin
A	use	3135
A	itemcount	3135,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.3
S	
T	xprate	>2.09
A	goto	Orgrimmar,45.120,63.889
A	turnin	6385
A	accept	6386
A	target	Doras
S	Warlock/Hunter/Rogue/Priest/Warrior
T	xprate	<2.1
T	season	2 << Warrior
T	completewith	AdmiralTurnin
A	goto	1454/1,-4367.46,1405.44,50,0
A	zone	Orgrimmar
A	zoneskip	Orgrimmar
S	Troll Priest
A	goto	1454/1,-4179.79,1452.580
A	turnin	5654
A	trainer	
A	target	Ur'kyo
A	isOnQuest	5654
S	Troll Priest
A	goto	1454/1,-4179.79,1452.580
A	turnin	5652
A	trainer	
A	target	Ur'kyo
S	Rogue
A	goto	1454/1,-4280.21,1773.15
A	accept	1963
A	target	Therzok
S	Rogue
A	goto	1454/1,-4320.75,1750.51
A	collect	2207,1
A	money	<0.2390
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<7.1
A	target	Kareth
S	Rogue
T	optional	
T	completewith	RazorTurnins2
A	use	2207
A	itemcount	2207,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<7.1
S	Rogue
T	season	2
A	goto	1454/1,-4464.24,1853.97
A	collect	204174,1
A	train	400081,1
S	Rogue
T	season	2
A	train	400081
A	use	204174
A	itemcount	204174,1
S	Warlock/Hunter/Rogue/Priest/Warrior
T	xprate	<2.1
T	season	2 << Warrior
T	label	AdmiralTurnin
A	goto	1454/1,-4133.36,1939.000
A	turnin	831
A	target	Nazgrel
S	
T	xprate	>2.09
T	label	AdmiralTurnin
A	goto	1454/1,-4133.36,1939.000
A	turnin	831
A	target	Nazgrel
S	Warlock
A	goto	1454/1,-4125.79,1920.10
A	accept	5726
A	target	Thrall
S	Shaman/Hunter
T	season	2
A	goto	1454/1,-4226.54,1914.70
A	train	409580
A	train	425336
A	use	226401 << Hunter
A	use	226402 << Shaman
A	target	Zor Lonetree
A	xp	<10,1
A	money	<0.5
S	Warrior
T	season	2
T	completewith	next
A	goto	1454/1,-4485.7,1769.41,-1
A	goto	1454/1,-4494.81,1793.070,-1
A	target	Zamja
A	target	Gru'ark
A	skipgossip	
S	Warrior
T	season	2
A	goto	1454/1,-4501.41,1780.63
A	collect	204716,1
A	target	Zamja
A	train	425447,1
A	skipgossip	
S	Warrior
T	season	2
A	train	425447
A	use	204716
A	itemcount	204716,1
S	Troll Warrior
A	goto	1454/1,-4824.00,2090.540
A	train	227
A	target	Hanashi
A	money	<0.100
S	Troll Warrior
A	goto	1454/1,-4819.1,2099.05
A	collect	854,1,1502,1
A	money	<0.3022
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.0
A	target	Zendo'jian
A	train	227,3
S	Troll Warrior
T	optional	
T	completewith	RazorTurnins2
A	use	854
A	itemcount	854,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.0
A	train	227,3
S	Hunter
T	completewith	next
A	goto	1454/1,-4634.65,1911.96,30
S	Hunter
A	goto	1454/1,-4607.02,2100.64
A	turnin	6081
A	target	Ormak Grimshot
S	Hunter
A	goto	1454/1,-4611.09,2135.15
A	train	24547
A	target	Xao'tsu
S	Hunter
T	season	0
T	completewith	RazorTurnins2
S	Hunter
T	season	2
T	completewith	End
S	Hunter
A	goto	1454/1,-4819.1,2099.05
A	collect	2507,1,835,1
A	money	<0.1751
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<5.7
A	target	Zendo'jian
S	Hunter
T	optional	
T	completewith	RazorTurnins2
A	use	2507
A	itemcount	2507,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<5.7
A	xp	<11,1
S	Hunter
T	optional	
T	completewith	RazorTurnins2
A	use	2507
A	itemcount	2507,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<5.7
A	xp	>11,1
S	Warlock
A	goto	1454/1,-4357.3,1850.31
A	turnin	1506
A	accept	1501
A	target	Gan'rul Bloodeye
S	Warlock
T	softcore	
T	completewith	next
A	goto	1454/1,-4424.40,1817.58
A	subzone	2437
S	Warlock
T	softcore	
A	goto	1411/1,-4450.27,1188.64
A	deathskip	
A	isOnQuest	1501
S	Warlock
T	hardcore	
T	completewith	SkullRockWarlock
A	zone	Durotar
A	zoneskip	Durotar
S	Warlock
T	label	SkullRockWarlock
A	goto	1411/1,-4867.98,1469.58
A	subzone	817
A	isOnQuest	1501
S	Warlock
T	completewith	VergaTablet
A	collect	4903,1,832
A	accept	832
A	unitscan	Gazz'uz
S	Warlock
T	completewith	next
A	complete	5726,1
A	mob	Burning Blade Fanatic
A	mob	Burning Blade Apprentice
S	Warlock
T	label	VergaTablet
A	goto	1411/1,-4826.21,1492.85,15,0
A	goto	1411/1,-4691.91,1464.29
A	complete	1501,1
S	Warlock
T	softcore	
A	goto	1411/1,-4450.27,1188.64
A	deathskip	
A	isQuestComplete	1501
S	Warlock
A	goto	1454/1,-4367.46,1405.44,50,0
A	zone	Orgrimmar
A	zoneskip	Orgrimmar
A	isQuestComplete	1501
S	Warlock
A	goto	1454/1,-4125.79,1920.10
A	turnin	5726
A	accept	5727
A	target	Thrall
A	isQuestComplete	5726
S	Warlock
T	optional	
A	goto	1454/1,-4125.79,1920.10
A	accept	5727
A	target	Thrall
A	isQuestTurnedIn	5726
S	Warlock
A	goto	1454/1,-4357.3,1850.31
A	turnin	1501
A	accept	1504
A	target	Gan'rul Bloodeye
S	Warlock
A	goto	1454/1,-4374.75,1800.93
A	accept	832
A	turnin	832
A	target	Neeru Fireblade
A	skipgossip	
A	itemcount	4903,1
S	Warlock
A	goto	1454/1,-4376.29,1802.43
A	complete	5727,1
A	skipgossip	
A	target	Neeru Fireblade
A	isQuestTurnedIn	5726
S	Warlock
T	completewith	next
A	cast	9221
A	use	6284
S	Warlock
A	goto	1454/1,-4374.19,1805.98
A	complete	1504,1
A	mob	Summoned Voidwalker
A	use	6284
S	Warlock
A	goto	1454/1,-4357.3,1850.31
A	turnin	1504
A	target	Gan'rul Bloodeye
S	Warlock
A	goto	1454/1,-4125.79,1920.10
A	turnin	5727
A	target	Thrall
A	isQuestTurnedIn	5726
S	Warlock
A	destroy	14544
S	Shaman/Mage/Hunter
T	xprate	>2.09
T	completewith	next
A	goto	1411/1,-4370.43,1380.40
A	zone	Durotar
S	Hunter
T	xprate	>2.09
T	completewith	next
T	loop	
A	goto	1411/1,-4274.72,1229.53,0
A	goto	1411/1,-4274.72,1229.53,50,0
A	goto	1411/1,-4157.87,1101.22,50,0
A	goto	1411/1,-3994.49,1186.17,50,0
A	cast	1515
A	mob	Venomtail Scorpid
A	train	16828,1
S	Shaman
T	xprate	>2.09
T	completewith	next
A	goto	1411/1,-4677.63,1217.54,40,0
A	goto	1411/1,-4852.12,1137.88,40,0
A	goto	1411/1,-4916.1,810.41,40,0
A	subzone	371
S	Shaman
T	xprate	>2.09
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
S	Mage
T	xprate	>2.09
T	season	2
A	goto	1411/1,-4761.17,1490.73,0
A	goto	1411/1,-4868.51,1466.76,30,0
A	goto	1411/1,-4854.23,1500.6,30,0
A	goto	1411/1,-4806.12,1486.15,30,0
A	goto	1411/1,-4761.17,1490.73,30,0
A	collect	203752,1
A	mob	Burning Blade Thug
A	mob	Burning Blade Neophyte
A	mob	Burning Blade Cultist
A	train	401768,1
S	
T	xprate	>2.09
A	hs	
A	use	6948
A	subzoneskip	380
A	bindlocation	380,1
A	cooldown	item,6948,>0
S	
T	xprate	>2.09
A	goto	1454/1,-4313.46,1676.24
A	fly	Crossroads
A	target	Doras
A	subzoneskip	380
A	cooldown	item,6948,<0
S	
T	xprate	<2.1
T	completewith	RazorTurnins2
A	hs	
A	use	6948
A	subzoneskip	362
A	bindlocation	362,1
S	
T	xprate	<2.1
A	goto	1411/1,-4686.09,340.52
A	vendor	
A	collect	1179,15,818,1 << Mage/Warlock/Priest/Shaman
A	collect	2287,15,818,1 << Rogue/Warrior
A	target	Innkeeper Grosk
A	money	<0.0375
S	Warrior
T	xprate	<2.1
T	season	2
A	goto	1411/1,-4772.28,274.960
A	collect	204688,1
A	collect	204689,1
A	collect	204690,1
A	target	Vahi Bonesplitter
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
S	
T	xprate	<2.1
T	label	RazorTurnins2
A	turnin	806
A	target	+Orgnil Soulscar
A	goto	1411/1,-4724.69,287.30
A	turnin	837
A	target	+Gar'Thok
A	goto	1411/1,-4709.36,274.960
S	Warrior
T	xprate	<2.1
A	goto	1411/1,-4827.27,311.62
A	train	6546
A	target	Tarshaw Jaggedscar
A	xp	<12,1
S	Shaman
T	xprate	<2.1
A	goto	1411/1,-4839.96,307.04
A	train	8050
A	target	Swart
A	xp	<12,1
S	Hunter
T	xprate	<2.1
T	completewith	next
A	goto	1411/1,-3881.33,138.19,0
A	goto	1411/1,-3881.33,-27.84,0
A	goto	1411/1,-3881.33,138.19,40,0
A	mob	Venomtail Scorpid
A	train	16828,1
S	
T	xprate	<2.1
T	label	FarWatchPost
A	goto	1413/1,-3686.10,303.14,40
A	zoneskip	The Barrens
S	
T	xprate	<2.1
A	goto	1413/1,-3687.11,303.14
A	turnin	840
A	accept	842
A	target	Kargal Battlescar
S	Warrior
T	xprate	<2.1
A	goto	1413/1,-3598.95,186.93
A	turnin	1498
A	accept	1502
A	target	Uzzek
S	
T	optional	
T	label	End
E
G	Guides/forever/Horde-01-14_Undead.lua
M	classic	
M	tbc	
M	selector	Horde
M	version	11
M	group	RestedXP Forever Guide (H)
M	subgroup	Speedrun Guide 1-22
M	defaultfor	Undead
M	name	1-6 Tirisfal Glades
M	next	6-11 Tirisfal Glades
S	!Undead
T	completewith	next
S	
T	completewith	Zombies
A	destroy	6948
S	
T	completewith	next
A	goto	1420/0,1675.90,1645.00,8,0
A	goto	1420/0,1665.51,1645.00,8,0
A	goto	1420/0,1667.77,1679.04,10
S	
A	goto	1420/0,1667.77,1679.04
A	accept	363
A	target	Undertaker Mordo
S	Warrior/Warlock/Priest/Mage
T	completewith	Vendor
A	goto	1420/0,1646.08,1750.44,0 << Warrior/Warlock
A	goto	1420/0,1681.32,1719.710,40,0
A	goto	1420/0,1646.08,1750.44,40,0
A	goto	1420/0,1714.76,1760.68,40,0 << Priest/Mage
A	goto	1420/0,1718.38,1799.24,40,0 << Priest/Mage
A	goto	1420/0,1669.12,1869.73,40,0 << Priest/Mage
A	mob	Young Scavenger
A	mob	Duskbat
A	money	>0.01
S	Warrior/Priest/Mage
T	completewith	Training1
A	goto	1420/0,1577.39,1860.09,8
S	Priest/Mage
T	label	Vendor
A	goto	1420/0,1574.23,1866.12
A	vendor	
A	collect	159,10,383,1
A	target	Joshua Kien
S	Warlock/Mage
T	sticky	
T	label	Piercing
A	accept	1470
A	goto	1420/0,1633.42,1836.9 << Warlock
A	target	+Venya Marthand << Warlock
A	turnin	363
A	accept	364
A	target	+Shadow Priest Sarvis
A	goto	1420/0,1639.75,1843.220
S	Warlock/Mage
A	goto	1420/0,1616.71,1842.92,10,0
A	accept	376
A	goto	1420/0,1638.85,1847.74
A	target	Novice Elreth
A	xp	<2,1
S	Mage
T	requires	Percing
A	goto	1420/0,1635.23,1847.44
A	train	1459
A	target	Isabella
S	Warlock
T	label	Vendor
A	goto	1420/0,1641.11,1836.90
A	vendor	
A	target	Kayla Smithe
A	money	>0.1
S	Warlock
A	goto	1420/0,1636.59,1839.01
A	train	348
A	target	Maximillion
S	!Warlock !Mage
A	goto	1420/0,1616.71,1842.92,10,0
A	goto	1420/0,1639.75,1843.220
A	turnin	363
A	accept	364
A	target	Shadow Priest Sarvis
S	!Warlock !Mage
A	accept	376
A	goto	1420/0,1638.85,1847.74
A	target	Novice Elreth
A	xp	<2,1
S	Warrior
T	completewith	next
T	label	Vendor
A	goto	1420/0,1568.35,1859.49
A	vendor	
A	target	Archibald Kava
A	money	>0.1
S	Warrior
T	label	Training1
A	goto	1420/0,1556.61,1862.50
A	train	6673
A	target	Dannal Stern
S	Warlock
T	requires	Piercing
T	loop	
A	goto	1420/0,1595.47,1985.41,0
A	goto	1420/0,1595.47,1985.41,30,0
A	goto	1420/0,1627.55,2008.61,30,0
A	goto	1420/0,1584.17,2024.88,30,0
A	goto	1420/0,1575.58,2053.8,30,0
A	goto	1420/0,1529.49,2044.16,30,0
A	goto	1420/0,1512.32,2007.1,30,0
A	goto	1420/0,1499.67,1975.47,30,0
A	goto	1420/0,1487.47,1938.12,30,0
A	goto	1420/0,1541.69,1939.32,30,0
A	complete	1470,1
A	mob	Rattlecage Skeleton
S	Warlock
T	completewith	next
A	mob	Mindless Zombie
A	mob	Wretched Zombie
A	money	>0.0025
S	Warlock
A	goto	1420/0,1576.94,1861.6,8,0
A	goto	1420/0,1574.23,1866.12
A	collect	159,5,383,1
A	target	Joshua Kien
A	isOnQuest	1470
S	Warlock
A	goto	1420/0,1616.71,1842.92,10,0
A	goto	1420/0,1633.42,1836.90
A	turnin	1470
A	target	Venya Marthand
S	Warlock
T	completewith	next
A	cast	688
S	
T	label	Zombies
T	requires	Piercing << Warlock/Mage
T	loop	
A	goto	1420/0,1599.99,1910.1,0
A	goto	1420/0,1599.99,1910.1,40,0
A	goto	1420/0,1646.53,1913.11,40,0
A	goto	1420/0,1637.04,1963.72,40,0
A	goto	1420/0,1644.72,1979.99,40,0
A	goto	1420/0,1626.19,1987.52,40,0
A	goto	1420/0,1596.37,1974.87,40,0
A	goto	1420/0,1548.92,1939.02,40,0
A	goto	1420/0,1546.66,1923.36,40,0
A	goto	1420/0,1523.62,1937.82,40,0
A	goto	1420/0,1508.26,1943.84,40,0
A	goto	1420/0,1519.1,1914.92,40,0
A	goto	1420/0,1517.29,1892.33,40,0
A	goto	1420/0,1529.04,1880.58,40,0
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
A	goto	1420/0,1576.94,1861.6,8,0
A	goto	1420/0,1574.23,1866.12
A	collect	159,10,383,1
A	vendor	
A	target	Joshua Kien
A	isOnQuest	364
A	money	<0.0050
A	itemcount	159,<10
S	Mage/Warlock/Priest
T	label	Vendor2
A	goto	1420/0,1576.94,1861.6,8,0
A	goto	1420/0,1574.23,1866.12
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
A	accept	98601
A	accept	3901
A	target	+Shadow Priest Sarvis
A	goto	1420/0,1616.71,1842.92,10,0
A	goto	1420/0,1639.75,1843.220
A	accept	376
A	target	+Novice Elreth
A	goto	1420/0,1638.85,1847.74
A	turnin	3099
A	goto	1420/0,1636.59,1839.01 << Warlock
A	target	+Maximillion << Warlock
A	turnin	3098
A	goto	1420/0,1635.23,1847.44 << Mage
A	target	+Isabella << Mage
A	turnin	3097
A	target	+Dark Cleric Duesten << Priest
A	goto	1420/0,1627.55,1848.65 << Priest
S	Paladin
A	goto	1420/0,1628.400,1837.400
A	turnin	98601
A	target	Aramis Hammerhand
S	Mage/Warlock/Priest
A	goto	1420/0,1576.94,1861.6,8,0
A	goto	1420/0,1574.23,1866.12
A	collect	159,10,383,1
A	target	Joshua Kien
A	isOnQuest	364
S	
T	loop	
A	goto	1420/0,1482.50,2126.70,0
A	goto	1420/0,1713.41,1828.76,40,0
A	goto	1420/0,1701.21,1858.290,40,0
A	goto	1420/0,1695.78,1908.29,40,0
A	goto	1420/0,1692.62,1927.88,40,0
A	goto	1420/0,1673.64,1984.51,40,0
A	goto	1420/0,1633.88,2040.24,40,0
A	goto	1420/0,1604.96,2073.08,40,0
A	goto	1420/0,1584.17,2098.08,40,0
A	goto	1420/0,1548.92,2079.71,40,0
A	goto	1420/0,1482.50,2126.70,40,0
A	complete	376,1
A	mob	+Young Scavenger
A	mob	+Ragged Scavenger
A	complete	376,2
A	mob	+Duskbat
A	mob	+Mangy Duskbat
S	
T	loop	
A	goto	1420/0,1595.47,1985.41,0
A	goto	1420/0,1595.47,1985.41,30,0
A	goto	1420/0,1627.55,2008.61,30,0
A	goto	1420/0,1584.17,2024.88,30,0
A	goto	1420/0,1575.58,2053.8,30,0
A	goto	1420/0,1529.49,2044.16,30,0
A	goto	1420/0,1512.32,2007.1,30,0
A	goto	1420/0,1499.67,1975.47,30,0
A	goto	1420/0,1487.47,1938.12,30,0
A	goto	1420/0,1541.69,1939.32,30,0
A	complete	3901,1
A	mob	Rattlecage Skeleton
S	
T	optional	
T	loop	
A	goto	1420/0,1595.47,1985.41,30,0
A	goto	1420/0,1627.55,2008.61,30,0
A	goto	1420/0,1584.17,2024.88,30,0
A	goto	1420/0,1575.58,2053.8,30,0
A	goto	1420/0,1529.49,2044.16,30,0
A	goto	1420/0,1512.32,2007.1,30,0
A	goto	1420/0,1499.67,1975.47,30,0
A	goto	1420/0,1487.47,1938.12,30,0
A	goto	1420/0,1541.69,1939.32,30,0
A	xp	3+940
A	xp	3+980
A	mob	Mindless Zombie
A	mob	Wretched Zombie
S	Mage/Warlock/Priest/Paladin
A	goto	1420/0,1576.04,1861.60,8,0
A	goto	1420/0,1574.23,1866.12
A	vendor	
A	target	Joshua Kien
A	money	>0.1 << !Paladin
A	money	>0.2 << Paladin
A	isOnQuest	3901
A	itemcount	159,<20
S	
A	turnin	3901
A	target	+Shadow Priest Sarvis
A	goto	1420/0,1616.71,1842.92,10,0
A	goto	1420/0,1639.75,1843.220
A	turnin	376
A	accept	6395
A	target	+Novice Elreth
A	goto	1420/0,1638.85,1847.74
S	
A	goto	1420/0,1628.300,1837.300
A	accept	91208
A	accept	91209
A	accept	98389
A	target	Aramis Hammerhand
S	Paladin
A	goto	1420/0,1628.300,1837.300
A	train	20271
A	train	19740
A	target	Aramis Hammerhand
A	money	<0.02
S	Paladin
T	optional	
A	goto	1420/0,1628.300,1837.300
A	train	20271
A	target	Aramis Hammerhand
A	money	<0.01
S	Priest
A	goto	1420/0,1627.55,1848.65
A	train	589
A	target	Dark Cleric Duesten
A	money	<0.021
S	Priest
A	goto	1420/0,1627.55,1848.65
A	train	2052
A	train	589
A	target	Dark Cleric Duesten
A	money	<0.02
S	Priest
A	goto	1420/0,1627.55,1848.65
A	train	1243
A	train	589
A	target	Dark Cleric Duesten
A	money	<0.011
S	Priest
T	optional	
A	goto	1420/0,1627.55,1848.65
A	train	589
A	target	Dark Cleric Duesten
A	money	<0.01
S	Warlock
A	goto	1420/0,1636.59,1839.01
A	train	172
A	target	Maximillion
S	Mage
A	goto	1420/0,1635.23,1847.44
A	train	116
A	target	Isabella
S	
A	goto	1420/0,1616.71,1842.92,10,0
A	accept	3902
A	goto	1420/0,1604.96,1860.70
A	target	+Deathguard Saltain
A	accept	380
A	goto	1420/0,1580.56,1848.95
A	target	+Executor Arren
S	Rogue/Warrior
A	goto	1420/0,1568.35,1859.49
A	vendor	
A	target	Archibald Kava
A	money	>0.1
A	isOnQuest	3095 << Warrior
A	isOnQuest	3096 << Rogue
S	Warrior
A	goto	1420/0,1556.61,1862.50
A	turnin	3095
A	train	100
A	train	772
A	target	Dannal Stern
A	money	<0.02
S	Warrior
T	optional	
T	label	Training2
A	goto	1420/0,1556.61,1862.50
A	turnin	3095
A	train	772
A	target	Dannal Stern
A	money	<0.01
S	Rogue
T	optional	
T	label	Training2
A	goto	1420/0,1563.38,1859.79
A	turnin	3096
A	target	David Trias
S	Rogue/Warrior/Paladin
A	goto	1420/0,1577.100,1854.600
A	train	2575
A	collect	2901,1,792,1
A	target	Walter Mason
S	
T	loop	
A	goto	1420/0,1570.61,1898.35,0
A	goto	1420/0,1570.61,1898.35,12,0
A	goto	1420/0,1550.73,1897.75,12,0
A	goto	1420/0,1547.12,1891.42,12,0
A	goto	1420/0,1541.69,1867.93,12,0
A	goto	1420/0,1506.45,1892.33,12,0
A	goto	1420/0,1536.27,1937.21,12,0
A	goto	1420/0,1551.64,1936.31,12,0
A	goto	1420/0,1593.66,1985.11,12,0
A	goto	1420/0,1598.63,1970.95,12,0
A	goto	1420/0,1600.89,1953.78,12,0
A	goto	1420/0,1617.16,1956.49,12,0
A	complete	3902,1
S	Paladin
A	complete	91208,1
A	skipgossip	
A	mob	Frightened Paladin
S	
T	label	NightWebStart
T	loop	
A	goto	1420/0,1680.42,2110.43,0
A	goto	1420/0,1680.42,2110.43,40,0
A	goto	1420/0,1685.84,2149.6,40,0
A	goto	1420/0,1711.6,2157.43,40,0
A	goto	1420/0,1750.01,2135.14,40,0
A	goto	1420/0,1782.54,2117.36,40,0
A	goto	1420/0,1754.98,2080.91,40,0
A	goto	1420/0,1756.79,2047.77,40,0
A	goto	1420/0,1731.93,2044.16,40,0
A	goto	1420/0,1709.79,2048.07,40,0
A	goto	1420/0,1692.62,2074.28,40,0
A	complete	380,1,6
A	mob	Young Night Web Spider
S	
T	loop	
A	goto	1420/0,1756.79,2082.12,0
A	goto	1420/0,1756.79,2082.12,25,0
A	goto	1420/0,1749.1,2058.02,25,0
A	goto	1420/0,1774.41,2012.83,25,0
A	goto	1420/0,1805.59,2054.7,25,0
A	goto	1420/0,1799.71,2091.15,25,0
A	goto	1420/0,1815.98,2137.85,25,0
A	goto	1420/0,1790.23,2150.5,25,0
A	complete	380,1
A	mob	Young Night Web Spider
S	
T	completewith	next
A	goto	1420/0,1822.31,2048.07,15,0
A	goto	1420/0,1844.45,2042.050,30
S	
T	completewith	next
A	complete	98389,1
A	mob	Webbed Forsaken
S	
T	loop	
A	goto	1420/0,1918.11,2043.86,0
A	goto	1420/0,1844.45,2042.050,30,0
A	goto	1420/0,1876.08,2043.56,20,0
A	goto	1420/0,1898.68,2020.06,20,0
A	goto	1420/0,1940.70,2006.80,20,0
A	goto	1420/0,1983.63,2032.71,20,0
A	goto	1420/0,1953.80,2079.40,20,0
A	goto	1420/0,1918.11,2043.86,20,0
A	complete	380,2
A	mob	Night Web Spider
S	
A	goto	1420/0,1921.500,2046.500
A	complete	98389,1
A	mob	Webbed Forsaken
S	
T	softcore	
T	completewith	Scavenging
A	deathskip	
A	target	Spirit Healer
S	Warlock
T	softcore	
T	completewith	ScarletC
A	cast	688
S	skip
T	hardcore	
T	completewith	next
A	goto	1420,26.027,60.607,-1
A	goto	1420,24.508,59.360,-1
A	goto	1420,23.572,59.239,-1
A	goto	1420/0,1628.91,1882.99,30
S	
T	label	Scavenging
A	goto	1420/0,1604.96,1860.70
A	turnin	3902
A	target	Deathguard Saltain
S	
T	label	NightWebH
A	goto	1420/0,1580.56,1848.95,0,0
A	turnin	380
A	accept	381
A	target	Executor Arren
S	
A	goto	1420/0,1628.400,1837.000
A	turnin	91208
A	turnin	98389
A	target	Aramis Hammerhand
S	Rogue/Warrior
A	goto	1420/0,1568.35,1859.49
A	vendor	
A	target	Archibald Kava
A	isOnQuest	6395
S	Warlock/Mage/Priest
A	goto	1420/0,1574.23,1866.12
A	collect	159,15,383,1 << Warlock/Mage/Priest
A	vendor	
A	target	Joshua Kien
A	isOnQuest	6395
A	itemcount	159,<15
S	
T	requires	NightWebH
T	loop	
A	goto	1420/0,1400.71,1766.71,0
A	goto	1420/0,1400.71,1766.71,40,0
A	goto	1420/0,1385.80,1744.11,40,0
A	goto	1420/0,1368.17,1728.15,40,0
A	goto	1420/0,1342.42,1741.40,40,0
A	goto	1420/0,1313.95,1735.08,40,0
A	goto	1420/0,1320.28,1752.25,40,0
A	goto	1420/0,1314.85,1765.80,40,0
A	goto	1420/0,1294.07,1780.56,40,0
A	goto	1420/0,1283.67,1817.02,40,0
A	goto	1420/0,1289.55,1841.72,40,0
A	goto	1420/0,1286.84,1877.27,40,0
A	goto	1420/0,1333.38,1868.53,40,0
A	goto	1420/0,1364.56,1867.93,40,0
A	goto	1420/0,1383.54,1866.72,40,0
A	goto	1420/0,1368.17,1831.48,40,0
A	goto	1420/0,1341.06,1790.51,40,0
A	goto	1420/0,1364.56,1784.18,40,0
A	complete	381,1
A	mob	Scarlet Initiate
A	mob	Scarlet Convert
S	
A	goto	1420/0,1375.40,1979.69
A	collect	16333,1,6395,1
A	mob	Samuel Fipps
S	
T	softcore	
T	completewith	next
A	deathskip	
A	target	Spirit Healer
S	
A	goto	1420/0,1624.84,1876.96
A	complete	6395,1
S	Warlock
T	softcore	
T	completewith	ScarletC
A	cast	688
S	
A	turnin	6395
A	target	+Novice Elreth
A	goto	1420/0,1616.71,1842.92,10,0
A	goto	1420/0,1638.85,1847.74
A	accept	5651
A	target	+Dark Cleric Duesten << Priest
A	goto	1420/0,1627.55,1848.65 << Priest
S	
T	sticky	
T	label	ScarletC
A	goto	1420/0,1580.56,1848.95,0,0
A	turnin	381
A	accept	382
A	target	Executor Arren
S	
A	goto	1420/0,1568.35,1859.49
A	vendor	
A	target	Archibald Kava
S	
T	requires	ScarletC
A	goto	1420/0,1383.99,1764.30
A	complete	382,1
A	mob	Meven Korgal
S	
A	goto	1420/0,1580.56,1848.95
A	turnin	382
A	accept	383
A	accept	96656
A	target	Executor Arren
S	
T	loop	
A	goto	1420/0,1493.34,2044.76,50,0
A	goto	1420/0,1436.41,2133.93,50,0
A	goto	1420/0,1369.08,2124.89,50,0
A	goto	1420/0,1327.05,2048.68,50,0
A	goto	1420/0,1338.35,1939.93,50,0
A	goto	1420/0,1400.71,1766.71,50,0
A	goto	1420/0,1385.80,1744.11,50,0
A	goto	1420/0,1368.17,1728.15,50,0
A	goto	1420/0,1342.42,1741.40,50,0
A	goto	1420/0,1313.95,1735.08,50,0
A	goto	1420/0,1320.28,1752.25,50,0
A	goto	1420/0,1314.85,1765.80,50,0
A	goto	1420/0,1294.07,1780.56,50,0
A	goto	1420/0,1283.67,1817.02,50,0
A	goto	1420/0,1289.55,1841.72,50,0
A	goto	1420/0,1286.84,1877.27,50,0
A	goto	1420/0,1333.38,1868.53,50,0
A	goto	1420/0,1364.56,1867.93,50,0
A	goto	1420/0,1383.54,1866.72,50,0
A	goto	1420/0,1368.17,1831.48,50,0
A	goto	1420/0,1341.06,1790.51,50,0
A	goto	1420/0,1364.56,1784.18,50,0
A	goto	1420/0,1400.71,1766.71,50,0
A	xp	5+1940
A	xp	5+1850
S	
A	goto	1420/0,1305.36,2127.30
A	accept	8
A	target	Calvin Montague
E
G	Guides/forever/Horde-01-14_Undead.lua
M	classic	
M	tbc	
M	selector	Horde
M	name	6-11 Tirisfal Glades
M	version	11
M	group	RestedXP Forever Guide (H)
M	subgroup	Speedrun Guide 1-22
M	defaultfor	Undead
M	next	12-14 Silverpine Forest; 12-17 The Barrens
S	
A	goto	1420/0,1184.71,2205.63
A	accept	365
A	target	Deathguard Simmer
S	
T	loop	
A	goto	1420/0,496.96,2256.54,0
A	goto	1420/0,1191.04,2198.10,0
A	goto	1420/0,1191.04,2198.10,40,0
A	goto	1420/0,1133.65,2177.31,40,0
A	goto	1420/0,1063.61,2201.710,40,0
A	goto	1420/0,945.22,2127.00,40,0
A	goto	1420/0,824.57,2092.36,40,0
A	goto	1420/0,740.97,2112.24,40,0
A	goto	1420/0,660.09,2196.29,40,0
A	goto	1420/0,571.07,2251.42,40,0
A	goto	1420/0,496.96,2256.54,40,0
A	accept	5481
A	unitscan	Gordo
S	Priest
A	goto	1420/0,656.92,2164.66
A	train	3908
A	target	Bowen Brisboise
S	
T	softcore	
T	completewith	next
A	deathskip	
A	target	Spirit Healer
S	
A	accept	404
A	target	+Deathguard Dillinger
A	goto	1420/0,403.42,2287.57
A	turnin	383
A	accept	427
A	target	+Executor Zygand
A	goto	1420/0,295.42,2277.93
S	Rogue
A	goto	1420/0,270.12,2253.23
A	collect	3131,200,786,1
A	target	Mrs. Winters
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.9
S	Rogue
A	goto	1420/0,316.66,2227.32
A	vendor	
A	target	Oliver Dwor
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Rogue
A	goto	1420/0,316.66,2227.32
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
A	goto	1420/0,316.66,2227.32
A	vendor	
A	target	Oliver Dwor
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.7
S	Warrior
A	goto	1420/0,316.66,2227.32
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
A	goto	1420/0,244.81,2269.19
A	turnin	8
A	home	
A	target	Innkeeper Renee
A	bindlocation	2119
S	
T	xprate	>1.49
A	goto	1420/0,236.68,2249.01
A	accept	375
A	target	Gretchen Dedmar
A	xp	<7,1
S	Priest
A	goto	1420/0,251.14,2265.28
A	turnin	5651
A	accept	5650
A	train	591
A	train	17
A	train	2052
A	target	Dark Cleric Beryl
S	Mage
A	goto	1420/0,233.06,2256.84
A	train	143
A	train	2136
A	target	Cain Firesong
S	Warrior
A	goto	1420/0,238.49,2255.03
A	train	3127
A	target	Austil de Mon
A	money	<0.01
S	Rogue
A	goto	1420/0,243.01,2271.00
A	train	1757
A	target	Marion Call
A	money	<0.01
S	Warlock
A	goto	1420/0,251.59,2252.62
A	collect	16321,1,404,1
A	vendor	
A	target	Gina Lang
A	train	6307,1
S	Warlock
A	goto	1420/0,250.24,2259.25
A	train	695
A	train	1454
A	target	Rupert Boch
A	money	<0.02
S	Warlock
A	goto	1420/0,250.24,2259.25
A	train	695
A	target	Rupert Boch
S	Priest/Warlock
A	goto	1420/0,242.55,2284.25
A	train	7411
A	target	Vance Undergloom
S	
A	goto	1420/0,244.81,2269.19
A	vendor	
A	collect	1179,15,367,1 << Mage/Priest
A	collect	4605,10,367,1 << Rogue/Warrior
A	collect	1179,10,367,1 << Warlock
A	collect	4605,5,367,1 << Warlock
A	money	<0.025 << Warrior/Rogue
A	money	<0.0375 << Mage/Priest/Warlock
A	target	Innkeeper Renee
S	
A	goto	1420/0,346.94,2258.950
A	accept	367
A	target	Apothecary Johaan
S	Priest
A	goto	1420/0,359.14,2436.99
A	complete	5650,1
A	target	Deathguard Kel
S	
T	completewith	Claws
A	complete	5481,1
S	
T	completewith	Pumkpins
A	complete	367,1
A	mob	Decrepit Darkhound
S	
T	label	Claws
T	loop	
A	goto	1420/0,655.12,2120.98,0
A	goto	1420/0,550.28,2315.28,50,0
A	goto	1420/0,622.58,2322.51,50,0
A	goto	1420/0,678.16,2319.80,50,0
A	goto	1420/0,716.12,2282.15,50,0
A	goto	1420/0,682.23,2218.58,50,0
A	goto	1420/0,670.48,2128.81,50,0
A	goto	1420/0,595.47,2134.53,50,0
A	goto	1420/0,613.54,2082.72,50,0
A	goto	1420/0,655.12,2120.98,50,0
A	complete	404,1
A	mob	Rotting Dead
A	mob	Ravaged Corpse
S	
T	label	GloomWeed
T	loop	
A	goto	1420/0,1246.17,2311.97,0
A	goto	1420/0,1025.65,2110.43,0
A	goto	1420/0,1246.17,2311.97,50,0
A	goto	1420/0,1025.65,2110.43,50,0
A	complete	5481,1
S	Priest
T	ah	
T	completewith	FinishRings
A	collect	2589,60
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3
S	Priest
T	ssf	
T	completewith	FinishRings
A	collect	2589,60
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3
S	
T	label	Pumkpins
T	loop	
A	goto	1420/0,1378.12,2328.54,0
A	goto	1420/0,1352.36,2265.88,50,0
A	goto	1420/0,1377.66,2328.54,50,0
A	goto	1420/0,1402.06,2359.27,50,0
A	goto	1420/0,1448.16,2336.67,50,0
A	goto	1420/0,1438.21,2303.84,50,0
A	goto	1420/0,1471.20,2283.65,50,0
A	goto	1420/0,1378.12,2328.54,50,0
A	complete	365,1
S	
T	loop	
A	goto	1420/0,1597.27,2290.28,0
A	goto	1420/0,1509.16,2351.13,50,0
A	goto	1420/0,1512.77,2299.02,50,0
A	goto	1420/0,1597.27,2290.28,50,0
A	goto	1420/0,1676.80,2316.79,50,0
A	goto	1420/0,1681.78,2354.14,50,0
A	goto	1420/0,1649.69,2405.66,50,0
A	goto	1420/0,1632.07,2436.690,50,0
A	goto	1420/0,1580.56,2487.00,50,0
A	goto	1420/0,1509.16,2473.14,50,0
A	goto	1420/0,1492.44,2395.11,50,0
A	goto	1420/0,1509.16,2351.13,50,0
A	complete	427,1
A	mob	Scarlet Warrior
S	
T	hardcore	
T	completewith	BrillTurnin1
A	hs	
A	subzoneskip	159
A	bindlocation	1497,1
A	cooldown	item,6948,>0,1
S	
T	hardcore	
T	completewith	BrillTurnin1
A	subzone	159
A	subzoneskip	159
A	cooldown	item,6948,<0
S	
T	softcore	
T	completewith	BrillTurnin1
A	deathskip	
S	
T	softcore	
T	loop	
A	goto	1420/0,425.56,2362.58,0
A	goto	1420/0,399.35,2337.270,30,0
A	goto	1420/0,425.56,2362.58,30,0
A	goto	1420/0,355.52,2429.76,30,0
A	turnin	5481
A	accept	5482
A	target	Junior Apothecary Holland
S	
A	turnin	404
A	accept	426
A	target	+Deathguard Dillinger
A	goto	1420/0,403.42,2288.17
A	turnin	367
A	turnin	365
A	accept	368
A	accept	407
A	target	+Apothecary Johaan
A	goto	1420/0,346.94,2258.950
A	turnin	427
A	accept	370
A	target	+Executor Zygand
A	goto	1420/0,295.87,2277.93
A	isQuestComplete	367
S	
T	label	BrillTurnin1
A	turnin	404
A	accept	426
A	target	+Deathguard Dillinger
A	goto	1420/0,403.42,2288.17
A	turnin	365
A	accept	407
A	target	+Apothecary Johaan
A	goto	1420/0,346.94,2258.950
A	turnin	427
A	accept	370
A	target	+Executor Zygand
A	goto	1420/0,295.87,2277.93
S	Priest
A	goto	1420/0,251.14,2265.28
A	turnin	5650
A	train	591
A	train	17
A	target	Dark Cleric Beryl
S	
A	goto	1420/0,236.68,2249.01
A	accept	375
A	target	Gretchen Dedmar
S	Priest
A	goto	1420/0,251.14,2265.28
A	train	139
A	target	Dark Cleric Beryl
A	xp	<8,1
S	Mage
A	goto	1420/0,233.06,2256.84
A	train	205
A	target	Cain Firesong
A	xp	<8,1
S	Warrior
A	goto	1420/0,238.49,2255.03
A	train	284
A	target	Austil de Mon
A	xp	<8,1
S	Rogue
A	goto	1420/0,243.01,2271.00
A	train	6760
A	target	Marion Call
A	xp	<8,1
S	Warlock
A	goto	1420/0,250.24,2259.25
A	train	980
A	target	Rupert Boch
A	xp	<8,1
S	Rogue/Warrior
A	goto	1420/0,240.29,2246.30
A	train	3273
A	target	Nurse Neela
S	Rogue
A	goto	1420/0,316.66,2227.32
A	vendor	
A	target	Oliver Dwor
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Rogue
A	goto	1420/0,316.66,2227.32
A	collect	2494,1,367,1
A	money	<0.0401
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Rogue
T	optional	
T	completewith	NewPlague1
A	use	2494
A	itemcount	2494,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Warrior
A	goto	1420/0,316.66,2227.32
A	vendor	
A	target	Oliver Dwor
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.7
S	Warrior
A	goto	1420/0,316.66,2227.32
A	collect	2488,1,367,1
A	money	<0.0536
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.7
S	Warrior
T	optional	
T	completewith	NewPlague1
A	use	2488
A	itemcount	2488,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.7
S	
T	hardcore	
T	loop	
A	goto	1420/0,425.56,2362.58,0
A	goto	1420/0,399.35,2337.270,30,0
A	goto	1420/0,425.56,2362.58,30,0
A	goto	1420/0,355.52,2429.76,30,0
A	turnin	5481
A	accept	5482
A	target	Junior Apothecary Holland
S	
T	completewith	next
A	complete	375,1
A	mob	Greater Duskbat
A	mob	Vampiric Duskbat
S	
T	loop	
A	goto	1420/0,482.50,1951.07,0
A	goto	1420/0,403.42,2085.73,50,0
A	goto	1420/0,413.36,1979.99,50,0
A	goto	1420/0,482.50,1951.07,50,0
A	goto	1420/0,560.22,1901.06,50,0
A	goto	1420/0,645.63,1961.92,50,0
A	goto	1420/0,750.46,1993.55,50,0
A	goto	1420/0,869.76,2003.79,50,0
A	goto	1420/0,950.64,2039.040,50,0
A	goto	1420/0,1068.13,1975.47,50,0
A	complete	367,1
A	mob	Decrepit Darkhound
S	Rogue/Warrior
T	optional	
T	loop	
A	goto	1420/0,482.50,1951.07,0
A	goto	1420/0,403.42,2085.73,50,0
A	goto	1420/0,413.36,1979.99,50,0
A	goto	1420/0,482.50,1951.07,50,0
A	goto	1420/0,560.22,1901.06,50,0
A	goto	1420/0,645.63,1961.92,50,0
A	goto	1420/0,750.46,1993.55,50,0
A	goto	1420/0,869.76,2003.79,50,0
A	goto	1420/0,950.64,2039.040,50,0
A	goto	1420/0,1068.13,1975.47,50,0
A	complete	375,1
A	mob	Greater Duskbat
A	mob	Vampiric Duskbat
A	xp	>7+3960,1
S	Rogue/Warrior
T	optional	
T	label	DuskbatTrophy1
T	loop	
A	goto	1420/0,482.50,1951.07,0
A	goto	1420/0,403.42,2085.73,50,0
A	goto	1420/0,413.36,1979.99,50,0
A	goto	1420/0,482.50,1951.07,50,0
A	goto	1420/0,560.22,1901.06,50,0
A	goto	1420/0,645.63,1961.92,50,0
A	goto	1420/0,750.46,1993.55,50,0
A	goto	1420/0,869.76,2003.79,50,0
A	goto	1420/0,950.64,2039.040,50,0
A	goto	1420/0,1068.13,1975.47,50,0
A	xp	7+3260
S	
T	hardcore	
T	completewith	NewPlague1
A	subzone	159
A	subzoneskip	159
S	
T	softcore	
T	completewith	NewPlague1
A	deathskip	
S	
T	label	NewPlague1
A	goto	1420/0,346.94,2258.950
A	turnin	367
A	accept	368
A	target	Apothecary Johaan
S	
A	accept	374
A	target	+Deathguard Burgess
A	goto	1420/0,280.06,2270.70
A	accept	398
A	goto	1420/0,288.64,2285.46
A	accept	358
A	target	+Magistrate Sevren
A	goto	1420/0,265.15,2305.94
S	
T	optional	
A	goto	1420/0,275.54,2260.46
A	complete	375,2
A	target	Abigail Shiel
A	itemcount	2876,5
A	isQuestAvailable	375
S	
T	optional	
A	goto	1420/0,236.68,2249.01
A	turnin	375
A	target	Gretchen Dedmar
A	isQuestComplete	375
S	Priest
A	goto	1420/0,251.14,2265.28
A	train	139
A	target	Dark Cleric Beryl
A	xp	<8,1
S	Mage
A	goto	1420/0,233.06,2256.84
A	train	205
A	target	Cain Firesong
A	xp	<8,1
S	Warrior
A	goto	1420/0,238.49,2255.03
A	train	284
A	target	Austil de Mon
A	xp	<8,1
S	Rogue
A	goto	1420/0,243.01,2271.00
A	train	6760
A	target	Marion Call
A	xp	<8,1
S	Warlock
A	goto	1420/0,250.24,2259.25
A	train	980
A	target	Rupe
S	Rogue
A	goto	1420/0,316.66,2227.32
A	vendor	
A	target	Oliver Dwor
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Rogue
A	goto	1420/0,316.66,2227.32
A	collect	2494,1,398,1
A	money	<0.0401
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Rogue
T	optional	
T	completewith	Doomweed
A	use	2494
A	itemcount	2494,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Warrior
A	goto	1420/0,316.66,2227.32
A	vendor	
A	target	Oliver Dwor
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.7
S	Warrior
A	goto	1420/0,316.66,2227.32
A	collect	2488,1,398,1
A	money	<0.0536
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.7
S	Warrior
T	optional	
T	completewith	Doomweed
A	use	2488
A	itemcount	2488,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.7
S	
T	completewith	next
A	complete	5482,1
A	isOnQuest	5482
S	
T	loop	
A	goto	1420/0,537.18,2555.98,0
A	goto	1420/0,488.83,2642.44,40,0
A	goto	1420/0,561.13,2596.65,40,0
A	goto	1420/0,597.73,2514.11,40,0
A	goto	1420/0,537.18,2555.98,40,0
A	goto	1420/0,483.40,2514.41,40,0
A	complete	358,1
A	complete	358,3
A	disablecheckbox	
A	mob	Rot Hide Graverobber
S	
T	completewith	next
A	complete	358,2
A	complete	358,3
A	disablecheckbox	
A	mob	Rot Hide Mongrel
S	
T	label	Doomweed
T	loop	
A	goto	1420/0,435.96,2754.51,0
A	goto	1420/0,426.92,2802.10,30,0
A	goto	1420/0,437.31,2754.20,30,0
A	goto	1420/0,467.14,2699.08,30,0
A	goto	1420/0,500.57,2669.85,30,0
A	goto	1420/0,543.95,2670.46,30,0
A	goto	1420/0,536.72,2627.68,30,0
A	goto	1420/0,562.48,2568.63,30,0
A	goto	1420/0,534.92,2587.01,30,0
A	goto	1420/0,476.62,2572.55,30,0
A	goto	1420/0,399.35,2544.23,30,0
A	goto	1420/0,374.95,2612.01,30,0
A	goto	1420/0,396.19,2676.18,30,0
A	goto	1420/0,435.96,2754.51,30,0
A	complete	5482,1
A	isOnQuest	5482
S	
T	completewith	MaggotEye
A	complete	358,2
A	complete	358,3
A	disablecheckbox	
A	mob	Rot Hide Mongrel
S	
T	label	MaggotEye
A	goto	1420/0,382.63,2910.55
A	complete	398,1
A	mob	Maggot Eye
S	
T	loop	
A	goto	1420/0,332.48,2862.35,0
A	goto	1420/0,380.38,2768.97,50,0
A	goto	1420/0,332.48,2862.35,50,0
A	goto	1420/0,401.16,2895.19,50,0
A	goto	1420/0,318.47,2696.36,50,0
A	complete	358,2
A	complete	358,3
A	disablecheckbox	
A	mob	Rot Hide Mongrel
S	
T	loop	
A	goto	1420/0,332.48,2862.35,0
A	goto	1420/0,380.38,2768.97,50,0
A	goto	1420/0,332.48,2862.35,50,0
A	goto	1420/0,401.16,2895.19,50,0
A	goto	1420/0,318.47,2696.36,50,0
A	complete	358,3
A	mob	Rot Hide Mongrel
A	mob	Rot Hide Gnoll
A	mob	Rot Hide Graverobber
S	
T	label	MurlocVins
T	loop	
A	goto	1420/0,342.87,2998.22,0
A	goto	1420/0,350.10,2962.37,50,0
A	goto	1420/0,342.87,2998.22,50,0
A	goto	1420/0,293.16,2974.12,50,0
A	goto	1420/0,254.75,2951.820,50,0
A	goto	1420/0,188.33,2950.02,50,0
A	goto	1420/0,65.42,2927.12,50,0
A	goto	1420/0,-15.92,2964.78,50,0
A	goto	1420/0,-49.36,3040.39,50,0
A	complete	368,1
A	mob	Vile Fin Puddlejumper
A	mob	Vile Fin Minor Oracle
A	mob	Vile Fin Muckdweller
S	
T	hardcore	
T	completewith	Brill3
A	subzone	159
A	subzoneskip	159
S	
T	softcore	
T	completewith	Brill3
A	goto	1420/0,118.74,2951.52
A	deathskip	
S	
T	label	DoomedWeed
T	loop	
A	goto	1420/0,425.56,2362.58,0
A	goto	1420/0,399.35,2337.270,30,0
A	goto	1420/0,425.56,2362.58,30,0
A	goto	1420/0,355.52,2429.76,30,0
A	turnin	5482
A	target	Junior Apothecary Holland
S	
A	turnin	368
A	accept	369
A	target	+Apothecary Johaan
A	goto	1420/0,346.94,2258.950
A	turnin	398
A	target	+Executor Zygand
A	goto	1420/0,295.87,2277.93
A	turnin	358
A	accept	405
A	accept	359
A	target	+Magistrate Sevren
A	goto	1420/0,265.15,2305.94
S	
T	optional	
A	goto	1420/0,275.54,2260.46
A	complete	375,2
A	target	Abigail Shiel
A	itemcount	2876,5
A	isQuestAvailable	375
S	
A	goto	1420/0,244.36,2262.26
A	accept	354
A	accept	362
A	target	Coleman Farthing
S	
T	optional	
A	goto	1420/0,236.68,2249.01
A	turnin	375
A	target	Gretchen Dedmar
A	isQuestComplete	375
S	Priest
A	goto	1420/0,251.14,2265.28
A	train	139
A	target	Dark Cleric Beryl
A	xp	<8,1
S	Mage
A	goto	1420/0,233.06,2256.84
A	train	205
A	target	Cain Firesong
A	xp	<8,1
S	Warrior
A	goto	1420/0,238.49,2255.03
A	train	284
A	target	Austil de Mon
A	xp	<8,1
S	Rogue
A	goto	1420/0,243.01,2271.00
A	train	6760
A	target	Marion Call
A	xp	<8,1
S	Warlock
A	goto	1420/0,250.24,2259.25
A	train	980
A	target	Rupert Boch
A	xp	<8,1
S	Rogue/Warrior
A	goto	1420/0,240.29,2246.30
A	train	3273
A	target	Nurse Neela
S	Rogue
A	goto	1420/0,316.66,2227.32
A	vendor	
A	target	Oliver Dwor
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Rogue
A	goto	1420/0,316.66,2227.32
A	collect	2494,1,354,1
A	money	<0.0401
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Rogue
T	optional	
T	completewith	MillsOverun
A	use	2494
A	itemcount	2494,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.3
S	Warrior
A	goto	1420/0,316.66,2227.32
A	vendor	
A	target	Oliver Dwor
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.7
S	Warrior
A	goto	1420/0,316.66,2227.32
A	collect	2488,1,354,1
A	money	<0.0536
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.7
S	Warrior
T	optional	
T	completewith	MillsOverun
A	use	2488
A	itemcount	2488,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<3.7
S	
T	label	Brill3
A	goto	1420/0,244.81,2269.19
A	vendor	
A	collect	1179,20,426,1 << Mage/Priest/Paladin
A	collect	4605,20,426,1 << Rogue/Warrior
A	collect	1179,10,426,1 << Warlock
A	collect	4605,10,426,1 << Warlock
A	money	<0.025 << Warrior/Rogue
A	money	<0.0375 << Mage/Priest/Warlock
A	target	Innkeeper Renee
S	Rogue/Warrior
T	softcore	
A	goto	1420/0,308.08,2246.30
A	vendor	
A	target	Eliza Callen
S	
T	completewith	next
A	complete	375,1
A	mob	Greater Duskbat
A	mob	Vampiric Duskbat
S	
T	label	AgamandStart
A	goto	1420/0,882.41,2511.1,100,0
A	goto	1420/0,892.80,2520.74
A	subzone	157
A	isOnQuest	362
S	
T	completewith	ThurmanGregor
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
S	
T	label	KillDevlin
A	goto	1420/0,894.16,2609.00
A	complete	362,1
A	mob	Devlin Agamand
S	
A	goto	1420/0,803.78,2752.40
A	complete	354,2
A	mob	Nissa Agamand
S	
T	label	ThurmanGregor
T	loop	
A	goto	1420/0,996.28,2899.11,0
A	goto	1420/0,1058.19,2775.59,60,0
A	goto	1420/0,998.54,2903.93,60,0
A	goto	1420/0,919.01,2939.770,60,0
A	goto	1420/0,1098.40,2875.61,60,0
A	goto	1420/0,1098.40,2875.61,60,0
A	goto	1420/0,996.28,2899.11,60,0
A	complete	354,3
A	unitscan	+Thurman Agamand
A	complete	354,1
A	unitscan	+Gregor Agamand
S	
T	label	MillsOverun
T	loop	
A	goto	1420/0,996.28,2899.11,0
A	goto	1420/0,1058.19,2775.59,60,0
A	goto	1420/0,998.54,2903.93,60,0
A	goto	1420/0,919.01,2939.770,60,0
A	goto	1420/0,1098.40,2875.61,60,0
A	goto	1420/0,1098.40,2875.61,60,0
A	goto	1420/0,996.28,2899.11,60,0
A	complete	426,1
A	mob	+Rattlecage Soldier
A	mob	+Cracked Skull Soldier
A	complete	426,2
A	mob	+Darkeye Bonecaster
S	
T	loop	
A	goto	1420/0,953.35,2926.22,0
A	goto	1420/0,857.56,2793.97,60,0
A	goto	1420/0,880.15,2884.04,60,0
A	goto	1420/0,953.35,2926.22,60,0
A	goto	1420/0,1025.2,2908.44,60,0
A	goto	1420/0,1040.56,2793.07,60,0
A	goto	1420/0,918.56,2780.11,60,0
A	goto	1420/0,953.35,2926.22,60,0
A	collect	2839,1,361
A	accept	361
A	use	2839
A	mob	Rattlecage Soldier
A	mob	Darkeye Bonecaster
A	mob	Cracked Skull Soldier
A	xp	>9+3620,1
A	isOnQuest	375
S	
T	optional	
T	loop	
A	goto	1420/0,953.35,2926.22,0
A	goto	1420/0,857.56,2793.97,60,0
A	goto	1420/0,880.15,2884.04,60,0
A	goto	1420/0,953.35,2926.22,60,0
A	goto	1420/0,1025.2,2908.44,60,0
A	goto	1420/0,1040.56,2793.07,60,0
A	goto	1420/0,918.56,2780.11,60,0
A	goto	1420/0,953.35,2926.22,60,0
A	collect	2839,1,361
A	accept	361
A	use	2839
A	mob	Rattlecage Soldier
A	mob	Darkeye Bonecaster
A	mob	Cracked Skull Soldier
A	xp	>9+4320,1
A	isQuestTurnedIn	375
S	
T	optional	
T	loop	
A	goto	1420/0,857.56,2793.97,60,0
A	goto	1420/0,880.15,2884.04,60,0
A	goto	1420/0,953.35,2926.22,60,0
A	goto	1420/0,1025.2,2908.44,60,0
A	goto	1420/0,1040.56,2793.07,60,0
A	goto	1420/0,918.56,2780.11,60,0
A	goto	1420/0,953.35,2926.22,60,0
A	xp	9+3620
A	itemcount	2839,<1
A	isOnQuest	375
S	
T	optional	
T	loop	
A	goto	1420/0,857.56,2793.97,60,0
A	goto	1420/0,880.15,2884.04,60,0
A	goto	1420/0,953.35,2926.22,60,0
A	goto	1420/0,1025.2,2908.44,60,0
A	goto	1420/0,1040.56,2793.07,60,0
A	goto	1420/0,918.56,2780.11,60,0
A	goto	1420/0,953.35,2926.22,60,0
A	xp	9+4320
A	itemcount	2839,<1
A	isQuestTurnedIn	375
S	
T	optional	
T	loop	
A	goto	1420/0,857.56,2793.97,60,0
A	goto	1420/0,880.15,2884.04,60,0
A	goto	1420/0,953.35,2926.22,60,0
A	goto	1420/0,1025.2,2908.44,60,0
A	goto	1420/0,1040.56,2793.07,60,0
A	goto	1420/0,918.56,2780.11,60,0
A	goto	1420/0,953.35,2926.22,60,0
A	xp	9+3840
A	itemcount	2839,1
A	isQuestTurnedIn	375
S	
T	optional	
T	loop	
A	goto	1420/0,857.56,2793.97,60,0
A	goto	1420/0,880.15,2884.04,60,0
A	goto	1420/0,953.35,2926.22,60,0
A	goto	1420/0,1025.2,2908.44,60,0
A	goto	1420/0,1040.56,2793.07,60,0
A	goto	1420/0,918.56,2780.11,60,0
A	goto	1420/0,953.35,2926.22,60,0
A	xp	9+3140
A	itemcount	2839,1
A	isOnQuest	375
S	
T	hardcore	
T	completewith	FoodandWater2
A	subzone	159
S	
T	softcore	
T	completewith	FoodandWater2
A	deathskip	
S	
A	goto	1420/0,403.42,2287.87
A	turnin	426
A	target	Deathguard Dillinger
S	
T	optional	
A	goto	1420/0,275.54,2260.46
A	complete	375,2
A	target	Abigail Shiel
A	itemcount	2876,5
A	isQuestAvailable	375
S	
A	turnin	361
A	target	+Yvette Farthing
A	goto	1420/0,250.69,2252.920
A	turnin	354
A	turnin	362
A	accept	355
A	target	+Coleman Farthing
A	goto	1420/0,244.36,2262.26
A	isOnQuest	361
S	
A	goto	1420/0,244.36,2262.26
A	turnin	354
A	turnin	362
A	accept	355
A	target	Coleman Farthing
S	
T	optional	
A	goto	1420/0,236.68,2249.01
A	turnin	375
A	target	Gretchen Dedmar
A	isQuestComplete	375
S	Priest
A	goto	1420/0,251.14,2265.28
A	trainer	
A	target	Dark Cleric Beryl
S	Warrior
T	optional	
A	abandon	1505
A	isOnQuest	1505
S	Warrior
T	optional	
A	abandon	1498
A	isOnQuest	1498
S	Warrior
A	goto	1420/0,238.49,2254.43
A	trainer	
A	accept	1818
A	target	Austil de Mon << Warrior
A	isQuestAvailable	1498
S	Warlock
A	goto	1420/0,248.88,2251.12
A	accept	1478
A	target	Ageron Kargal
S	Warlock
A	goto	1420/0,250.24,2259.25
A	train	707
A	target	Rupert Boch
S	Rogue
A	goto	1420/0,243.01,2270.70
A	trainer	
A	accept	1885
A	target	Marion Call
S	Mage
A	goto	1420/0,233.52,2256.84
A	accept	1881
A	target	Cain Firesong
S	
T	label	FoodandWater2
A	goto	1420/0,244.81,2269.19
A	vendor	
A	collect	1179,20,370,1 << Mage/Priest/Shaman
A	collect	4605,20,370,1 << Rogue/Warrior
A	collect	1179,15,370,1 << Warlock
A	collect	4605,15,370,1 << Warlock
A	money	<0.075 << Warlock
A	money	<0.05 << !Warlock
A	target	Innkeeper Renee
S	Warrior
A	goto	1420/0,403.87,2287.87
A	turnin	1818
A	accept	1819
A	target	Deathguard Dillinger
A	isQuestAvailable	1498
S	Warrior
A	goto	1420/0,360.04,2376.14
A	complete	1819,1
A	mob	Ulag the Cleaver
S	Warrior
A	goto	1420/0,403.87,2287.87
A	turnin	1819
A	accept	1820
A	target	Deathguard Dillinger
S	Warlock
T	completewith	next
A	goto	1420/0,240.75,1877.57,20
A	zoneskip	Undercity
S	Warlock
T	completewith	next
A	goto	1458/0,239.14,1749.54,35,0
A	goto	1458/0,255.64,1724.70,35,0
A	goto	1458/0,240.68,1706.97,10,0
A	goto	1458/0,241.06,1660.12,10,0
A	goto	1458/0,257.08,1623.38,10,0
A	goto	1458/0,244.51,1598.73,15
S	Warlock
A	goto	1458/0,57.05,1711.77
A	turnin	1478
A	accept	1473
S	Warlock
A	goto	1458/0,419.89,1627.54,50,0
A	goto	1458/0,428.52,1597.20,10,0
A	goto	1458/0,439.17,1626.06,10,0
A	goto	1458/0,476.78,1632.150,10,0
A	goto	1458/0,482.34,1660.63,10,0
A	goto	1458/0,539.33,1665.49,15,0
A	goto	1458/0,610.42,1684.44,35,0
A	goto	1458/0,663.19,1600.46,35,0
A	goto	1420/0,724.25,1682.66,50,0
A	zone	Tirisfal Glades
A	zoneskip	Tirisfal Glades
S	Warlock
T	completewith	next
A	goto	1420/0,726.06,1801.95
A	complete	1473,1
S	
T	label	ScarletCrusade1
T	loop	
A	goto	1420/0,770.80,1762.79,40,0
A	goto	1420/0,763.57,1820.93,40,0
A	goto	1420/0,721.54,1857.38,40,0
A	goto	1420/0,694.88,1848.04,40,0
A	goto	1420/0,641.56,1800.45,40,0
A	goto	1420/0,651.05,1748.93,40,0
A	goto	1420/0,685.39,1741.70,40,0
A	goto	1420/0,727.42,1742.31,40,0
A	complete	370,1
A	mob	+Captain Perrine
A	complete	370,2
A	mob	+Scarlet Zealot
A	complete	370,3
A	mob	+Scarlet Missionary
A	complete	374,1
A	disablecheckbox	
S	Warlock
A	goto	1420/0,726.06,1801.95
A	complete	1473,1
S	
T	completewith	UCHome
A	goto	1458/0,714.8,1604.24,35,0
A	goto	1458/0,652.73,1623.44,35,0
A	goto	1458/0,634.02,1669.66,35,0
A	goto	1458/0,539.52,1665.17,10,0
A	goto	1458/0,481.48,1659.8,10,0
A	goto	1458/0,476.49,1632.15,10,0
A	goto	1458/0,439.08,1627.02,10,0
A	goto	1458/0,435.05,1598.86,10,0
A	zone	Undercity
A	zoneskip	Undercity
S	Rogue
A	goto	1458/0,323.57,1668.50
A	train	201
A	target	Archibald
S	Warrior/Rogue
A	goto	1458/0,335.37,1638.29
A	train	2575
A	target	Brom Killian
S	Warrior/Rogue
A	goto	1458/0,329.04,1641.62
A	collect	2901,1,371,1
A	target	Sarah Killian
A	train	2575,3
S	Warrior/Rogue
A	goto	1458/0,295.94,1691.61
A	train	2018
A	target	Basil Frye
A	train	2575,3
S	Warlock
A	goto	1458/0,57.05,1711.77
A	turnin	1473
A	accept	1471
A	target	Carendin Halgar
S	Warlock
T	completewith	next
A	cast	9221
A	use	6284
S	Warlock
A	goto	1458/0,41.99,1704.480
A	complete	1471,1
A	mob	Summoned Voidwalker
A	use	6284
S	Warlock
A	goto	1458/0,57.34,1711.71
A	turnin	1471
A	target	Carendin Halgar
S	Warrior
T	ssf	
A	goto	1458/0,133.71,1561.730
A	collect	1198,1,371,1
A	money	<0.2676
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.0
A	target	Charles Seaton
S	Warrior
T	ah	
A	goto	1458/0,133.71,1561.730
A	collect	1198,1,371,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.0
A	target	Charles Seaton
S	Warrior
T	optional	
T	completewith	LogoutSkip1
A	use	1198
A	itemcount	1198,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.0
S	Rogue
T	ssf	
A	goto	1458/0,133.71,1561.730
A	collect	851,1,371,1
A	money	<0.2023
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
A	target	Charles Seaton
S	Rogue
T	ah	
A	goto	1458/0,133.71,1561.730
A	collect	851,1,371,1
A	money	<0.2023
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
A	target	Charles Seaton
S	Rogue
T	optional	
T	completewith	LogoutSkip1
A	use	851
A	itemcount	851,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
S	Rogue
A	goto	1458/0,129.68,1560.26
A	collect	3107,200,371,1
A	target	Nathaniel Steenwick
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.3
S	Rogue
T	optional	
T	completewith	LogoutSkip1
A	use	3107
A	itemcount	3107,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.3
A	xp	>11,1
S	Rogue
T	optional	
T	completewith	LogoutSkip1
A	use	3107
A	itemcount	3107,1
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.3
A	xp	<11,1
S	Rogue
A	goto	1458/0,71.92,1435.70
A	turnin	1885
A	accept	1886
A	target	Mennet Carkad
S	Mage
T	optional	
A	abandon	1883
A	isOnQuest	1883
S	Mage
A	goto	1458/0,56.57,1813.49
A	turnin	1881
A	accept	1882
A	target	Anastasia Hartwell
S	
A	goto	1458/0,66.74,1766.31
A	turnin	405
A	accept	357
A	target	Bethor Iceshard
S	!Warlock
T	label	UCHome
A	goto	1458/0,223.31,1634.96
A	home	
A	target	Innkeeper Norman
A	bindlocation	1497
S	
T	optional	
T	label	LogoutSkip1
S	skip
T	xprate	<1.5 << !Mage !Warlock
A	goto	1458/0,59.07,1747.75
A	goto	1458/0,221.78,1780.14,30
A	link	https://www.youtube.com/watch?v=-Bi95bCN8dM
S	skip -- !Mage !Warlock
T	xprate	>1.49
T	ah	<< Priest
A	goto	1458/0,287.01,1531.59 << Priest
A	goto	1458/0,124.59,1555.59 << Warrior
A	goto	1458/0,79.31,1460.41 << Rogue
A	goto	1458/0,221.78,1780.14,30
A	goto	1458/0,221.78,1780.14,30
A	zoneskip	Undercity,1
S	
T	completewith	AtWarS
A	goto	1420/0,235.32,1883.89
A	zone	Tirisfal Glades
A	zoneskip	Tirisfal Glades
S	Undead Rogue
T	sticky	
T	completewith	UnluckyRogue
A	complete	1886,1
A	unitscan	Astor Hadren
A	isOnQuest	1886
S	
T	optional	
A	goto	1420/0,280.06,2270.70
A	turnin	374
A	target	Deathguard Burgess
A	isQuestComplete	374
S	
T	label	AtWarS
A	goto	1420/0,295.87,2277.93
A	turnin	370
A	accept	371
A	target	Executor Zygand
S	
A	goto	1420/0,270.12,2253.23
A	collect	4496,1,356,1
A	target	Mrs. Winters
A	money	<0.05
S	Warrior
A	goto	1420/0,244.36,2262.26
A	turnin	1820
A	target	Coleman Farthing
S	Warrior
T	season	2
T	completewith	UnluckyRogue
A	collect	207975,1
A	mob	Greater Duskbat
A	mob	Vampiric Duskbat
A	train	403475,1
S	
T	completewith	next
A	complete	375,1
A	mob	Greater Duskbat
A	mob	Vampiric Duskbat
S	
T	label	UnluckyRogue
A	goto	1420/0,74.00,2022.47
A	turnin	359
A	accept	360
A	accept	356
A	target	Deathguard Linnea
S	
T	completewith	ArriveBalnir
A	complete	375,1
A	mob	Greater Duskbat
A	mob	Vampiric Duskbat
S	
T	label	ArriveBalnir
A	goto	1420/0,-423.96,1976.68
A	subzone	165
A	isOnQuest	356
S	Mage
T	completewith	next
A	complete	356,1
A	mob	+Bleeding Horror
A	complete	356,2
A	mob	+Wandering Spirit
S	Mage
A	goto	1420/0,-467.79,1969.75
A	complete	1882,1
S	
T	label	HorrorsandSpirits
T	loop	
A	goto	1420/0,-324.55,2000.48,0
A	goto	1420/0,-324.55,2000.48,50,0
A	goto	1420/0,-330.88,2040.84,50,0
A	goto	1420/0,-359.34,2073.38,50,0
A	goto	1420/0,-421.25,2070.07,50,0
A	goto	1420/0,-464.63,2070.37,50,0
A	goto	1420/0,-516.14,2017.05,50,0
A	goto	1420/0,-466.44,1986.02,50,0
A	goto	1420/0,-436.61,1951.670,50,0
A	goto	1420/0,-355.28,1970.35,50,0
A	complete	356,1
A	mob	+Bleeding Horror
A	complete	356,2
A	mob	+Wandering Spirit
S	
T	sticky	
T	label	Friars
T	loop	
T	optional	
A	goto	1420/0,-624.59,2114.05,0
A	goto	1420/0,-452.43,2183.03,0
A	goto	1420/0,-573.53,2138.450,0
A	goto	1420/0,-624.59,2114.05,40,0
A	goto	1420/0,-654.87,2185.44,40,0
A	goto	1420/0,-652.16,2238.77,40,0
A	goto	1420/0,-550.49,2173.09,40,0
A	goto	1420/0,-452.43,2183.03,40,0
A	goto	1420/0,-407.69,2171.590,40,0
A	goto	1420/0,-406.34,2113.75,40,0
A	goto	1420/0,-453.33,2127.91,40,0
A	goto	1420/0,-573.53,2138.450,40,0
A	complete	371,2
A	complete	374,1
A	disablecheckbox	
A	mob	Scarlet Friar
A	mob	Scarlet Zealot
A	isOnQuest	374
S	
T	loop	
T	sticky	
T	requires	Friars
T	label	Friars2
A	goto	1420/0,-624.59,2114.05,0
A	goto	1420/0,-452.43,2183.03,0
A	goto	1420/0,-573.53,2138.450,0
A	goto	1420/0,-624.59,2114.05,40,0
A	goto	1420/0,-654.87,2185.44,40,0
A	goto	1420/0,-652.16,2238.77,40,0
A	goto	1420/0,-550.49,2173.09,40,0
A	goto	1420/0,-452.43,2183.03,40,0
A	goto	1420/0,-407.69,2171.590,40,0
A	goto	1420/0,-406.34,2113.75,40,0
A	goto	1420/0,-453.33,2127.91,40,0
A	goto	1420/0,-573.53,2138.450,40,0
A	complete	371,2
A	mob	Scarlet Friar
A	isQuestTurnedIn	374
S	
A	goto	1420/0,-528.35,2146.28
A	complete	371,1
A	mob	Captain Vachon
S	
T	completewith	ViciousVenom
A	complete	375,1
A	mob	Greater Duskbat
A	mob	Vampiric Duskbat
S	
T	label	ViciousVenom
T	requires	Friars2
T	loop	
A	goto	1420/0,-808.96,2189.06,0
A	goto	1420/0,-739.82,2163.75,30,0
A	goto	1420/0,-808.96,2189.06,30,0
A	goto	1420/0,-878.10,2195.39,30,0
A	goto	1420/0,-945.88,2180.93,30,0
A	goto	1420/0,-985.64,2224.00,30,0
A	goto	1420/0,-1019.99,2274.61,30,0
A	goto	1420/0,-1075.11,2314.38,30,0
A	goto	1420/0,-1072.85,2381.56,30,0
A	goto	1420/0,-1027.67,2432.17,30,0
A	goto	1420/0,-809.41,2431.26,30,0
A	goto	1420/0,-785.91,2352.64,30,0
A	goto	1420/0,-738.02,2268.29,30,0
A	complete	369,1
A	mob	Vicious Night Web Spider
S	
A	goto	1420/0,-38.06,2569.54
A	complete	357,1
S	
T	hardcore	
T	completewith	ANewPlagueFinal
A	subzone	159
A	subzoneskip	159
S	
T	softcore	
T	completewith	ANewPlagueFinal
A	goto	1420/0,23.85,2483.38
A	deathskip	
S	
A	goto	1420/0,346.94,2259.25
A	turnin	369
A	accept	492
A	accept	445
A	target	Apothecary Johaan
S	
A	goto	1420/0,295.87,2277.93
A	turnin	371
A	accept	372
A	target	Executor Zygand
S	
A	goto	1420/0,265.15,2305.94
A	turnin	360
A	turnin	355
A	target	Magistrate Sevren
S	
T	optional	
A	goto	1420/0,280.06,2270.70
A	turnin	374
A	target	Deathguard Burgess
A	isQuestComplete	374
S	
T	optional	
A	goto	1420/0,275.54,2260.46
A	complete	375,2
A	target	Abigail Shiel
A	itemcount	2876,5
A	isQuestAvailable	375
S	
A	goto	1420/0,270.12,2253.23
A	collect	4496,1,356,1
A	target	Mrs. Winters
A	money	<0.05
S	
T	optional	
A	goto	1420/0,236.68,2249.01
A	turnin	375
A	target	Gretchen Dedmar
A	isQuestComplete	375
S	
A	goto	1420/0,244.81,2269.19
A	vendor	
A	vendor	
A	target	Innkeeper Renee
S	
T	label	ANewPlagueFinal
A	turnin	407
A	goto	1420/0,233.06,2292.39
A	target	+Captured Scarlet Zealot
A	turnin	492
A	goto	1420/0,234.42,2289.070
A	target	+Captured Mountaineer
S	
T	completewith	UndercityLS2
A	hs	
A	cooldown	item,6948,>0,1
A	bindlocation	1497,1
A	zoneskip	Undercity
S	
T	completewith	UndercityLS2
A	zone	Undercity
A	cooldown	item,6948,<0
S	
T	ah	
A	goto	1458/0,257.27,1560.450
A	collect	3164,6,429,1
A	target	Auctioneer Rhyker
S	Mage
A	goto	1458/0,56.57,1813.49
A	turnin	1882
A	target	Anastasia Hartwell
S	
T	optional	<< Rogue
A	goto	1458/0,66.74,1766.18
A	turnin	357
A	accept	366
A	target	Bethor Iceshard
A	isQuestComplete	1886 << Rogue
S	Rogue
T	ssf	
A	goto	1458/0,133.71,1561.730
A	collect	851,1,372,1
A	money	<0.2023
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
A	target	Charles Seaton
S	Rogue
T	ah	
A	goto	1458/0,133.71,1561.730
A	collect	851,1,372,1
A	money	<0.2023
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
A	target	Charles Seaton
S	Rogue
T	optional	
T	completewith	CaptainMelrache
A	use	851
A	itemcount	851,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
S	Warrior
T	ssf	
A	goto	1458/0,133.71,1561.730
A	collect	1198,1,372,1
A	money	<0.2950
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.0
A	target	Charles Seaton
S	Warrior
T	ah	
A	goto	1458/0,133.71,1561.730
A	collect	1198,1,372,1
A	money	<0.2950
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.0
A	target	Charles Seaton
S	Warrior
T	optional	
T	completewith	CaptainMelrache
A	use	1198
A	itemcount	1198,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.0
S	Rogue
A	goto	1458/0,71.92,1435.630
A	turnin	1886
A	target	Mennet Carkad
A	isQuestComplete	1886
S	Rogue
A	goto	1458/0,71.92,1435.630
A	accept	1898
A	target	Mennet Carkad
A	isQuestTurnedIn	1886
S	Rogue
A	goto	1458/0,347.07,1389.48
A	turnin	1898
A	accept	1899
A	target	Andron Gant
A	isQuestTurnedIn	1886
S	Rogue
A	goto	1458/0,341.41,1385.90
A	complete	1899,1
A	isQuestTurnedIn	1886
S	Rogue
A	goto	1458/0,71.83,1435.51
A	turnin	1899
A	accept	1978
A	target	Mennet Carkad
A	isQuestTurnedIn	1886
S	Rogue
A	goto	1420/0,373.60,1464.85,40,0
A	goto	1420/0,333.38,1287.72
A	turnin	1978
A	target	Varimathras
A	isQuestTurnedIn	1886
S	skip --Rogue
T	optional	
A	goto	1458/0,343.43,1296.22
A	goto	1458/0,221.78,1780.14,30
A	link	https://www.youtube.com/watch?v=jj85AXyF1XE
A	isQuestTurnedIn	1886
S	Rogue
A	goto	1458/0,66.74,1766.18
A	turnin	357
A	accept	366
A	target	Bethor Iceshard
A	isOnQuest	1886
S	skip
T	label	UndercityLS2
A	goto	1458/0,59.07,1747.75
A	goto	1458/0,221.78,1780.14,30
A	link	https://www.youtube.com/watch?v=-Bi95bCN8dM
A	zoneskip	Undercity,1
A	isOnQuest	1886 << Rogue
S	
T	completewith	next
A	goto	1420/0,235.32,1883.89
A	zone	Tirisfal Glades
A	zoneskip	Tirisfal Glades
S	
A	goto	1420/0,74.00,2022.47
A	turnin	356
A	target	Deathguard Linnea
S	
T	label	CaptainMelrache
A	goto	1420/0,-559.98,3080.16
A	complete	372,1
A	mob	+Captain Melrache
A	complete	372,2
A	mob	+Scarlet Bodyguard
A	complete	374,1
A	disablecheckbox	
S	
T	label	FinishRings
T	loop	
A	goto	1420/0,-538.29,2977.73,0
A	goto	1420/0,-552.75,3047.92,40,0
A	goto	1420/0,-538.29,2977.73,40,0
A	goto	1420/0,-532.86,2890.97,40,0
A	goto	1420/0,-486.32,2768.36,40,0
A	goto	1420/0,-520.66,2750.29,40,0
A	complete	374,1
S	Priest
T	optional	
T	loop	
A	goto	1420/0,-538.29,2977.73,0
A	goto	1420/0,-552.75,3047.92,40,0
A	goto	1420/0,-538.29,2977.73,40,0
A	goto	1420/0,-532.86,2890.97,40,0
A	goto	1420/0,-486.32,2768.36,40,0
A	goto	1420/0,-520.66,2750.29,40,0
A	collect	2589,60,435,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3
S	
T	loop	
A	goto	1420/0,-226.94,2838.25,0
A	goto	1420/0,-300.6,2852.11,50,0
A	goto	1420/0,-226.94,2838.25,50,0
A	goto	1420/0,-135.67,2799.39,50,0
A	goto	1420/0,-7.33,2785.53,50,0
A	goto	1420/0,18.88,2696.67,50,0
A	goto	1420/0,-300.6,2852.11,50,0
A	complete	375,1
A	mob	Greater Duskbat
A	mob	Vampiric Duskbat
S	
A	goto	1420/0,-48.0,2574.66
A	turnin	366
A	accept	409
A	target	Gunther Arcanus
S	
T	optional	
T	label	CandleBeckoning
T	completewith	Nefara
A	goto	1420/0,-46.65,2571.95
A	collect	3080,1,409,1
A	isOnQuest	409
S	
T	optional	
T	requires	CandleBeckoning
T	completewith	next
A	goto	1420/0,22.04,2485.19
A	isOnQuest	409
S	
T	label	Nefara
A	goto	1420/0,19.33,2480.37
A	complete	409,1
A	target	Lillith Nefara
S	
A	goto	1420/0,-48.45,2574.66
A	turnin	409
A	accept	411
A	target	Gunther Arcanus
S	
A	xp	11+4900
A	isOnQuest	374
A	isOnQuest	375
S	
T	optional	
A	xp	11+5525
A	isQuestTurnedIn	374
A	isOnQuest	375
S	
T	optional	
A	xp	11+5600
A	isOnQuest	374
A	isQuestTurnedIn	375
S	
T	optional	
A	xp	11+6225
A	isQuestTurnedIn	374
A	isQuestTurnedIn	375
S	
T	hardcore	
T	completewith	CrusadewarWon
A	subzone	159
A	subzoneskip	159
S	
T	softcore	
T	completewith	CrusadewarWon
A	goto	1420/0,123.26,2552.67
A	deathskip	
S	
T	label	CrusadewarWon
A	goto	1420/0,295.87,2277.93
A	turnin	372
A	target	Executor Zygand
S	
A	goto	1420/0,280.06,2270.70
A	turnin	374
A	target	Deathguard Burgess
S	
A	goto	1420/0,275.54,2260.46
A	complete	375,2
A	target	Abigail Shiel
A	isQuestAvailable	375
S	
A	goto	1420/0,236.68,2249.01
A	turnin	375
A	target	Gretchen Dedmar
S	Priest
A	goto	1420/0,251.14,2265.28
A	train	588
A	target	Dark Cleric Beryl
A	xp	<12,1
S	Mage
A	goto	1420/0,233.06,2256.84
A	train	145
A	target	Cain Firesong
A	xp	<12,1
S	Warrior
A	goto	1420/0,238.49,2255.03
A	train	7384
A	target	Austil de Mon
A	xp	<12,1
S	Rogue
A	goto	1420/0,243.01,2271.00
A	train	1766
A	target	Marion Call
A	xp	<12,1
S	Warlock
A	goto	1420/0,250.24,2259.25
A	train	755
A	target	Rupert Boch
A	xp	<12,1
S	Rogue
T	completewith	Entersilverpine
A	complete	1886,1
A	unitscan	Astor Hadren
S	Priest/Rogue/Warrior
T	optional	
T	completewith	LesserMagicWand << Priest
T	completewith	RogueCutlass << Rogue
T	completewith	WarriorClaymore << Warrior
A	goto	1420/0,240.75,1877.57,20
A	zoneskip	Undercity
S	Priest/Rogue/Warrior
T	optional	
T	completewith	LesserMagicWand << Priest
T	completewith	RogueCutlass << Rogue
T	completewith	WarriorClaymore << Warrior
A	goto	1458/0,239.14,1749.54,35,0
A	goto	1458/0,255.64,1724.70,35,0
A	goto	1458/0,240.68,1706.97,10,0
A	goto	1458/0,241.06,1660.12,10,0
A	goto	1458/0,257.08,1623.38,10,0
A	goto	1458/0,244.51,1598.73,15
S	Priest
T	ah	
A	goto	1458/0,257.27,1560.450
A	collect	11287,1,435,1
A	target	Auctioneer Rhyker
A	itemStat	18,QUALITY,<7 << Priest/Mage/Warlock
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3 << Priest/Mage/Warlock
S	Rogue
T	ssf	
T	optional	
T	label	RogueCutlass
A	goto	1458/0,286.53,1616.21
A	collect	851,1,435,1
A	money	<0.2023
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
A	target	Louis Warren
S	Rogue
T	ah	
T	optional	
T	label	RogueCutlass
A	goto	1458/0,286.53,1616.21
A	collect	851,1,435,1
A	money	<0.2023
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
A	target	Louis Warren
S	Rogue
T	optional	
T	completewith	Entersilverpine
A	use	851
A	itemcount	851,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<6.8
S	Warrior
T	ssf	
T	optional	
T	label	WarriorClaymore
A	goto	1458/0,286.53,1616.21
A	collect	1198,1,435,1
A	money	<0.2950
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.0
A	target	Louis Warren
S	Warrior
T	ah	
T	optional	
T	label	WarriorClaymore
A	goto	1458/0,286.53,1616.21
A	collect	1198,1,435,1
A	money	<0.2950
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.0
A	target	Louis Warren
S	Warrior
T	optional	
T	completewith	Entersilverpine
A	use	1198
A	itemcount	1198,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<9.0
S	Priest
T	optional	
A	goto	1458/0,403.29,1760.61
A	turnin	5658
A	target	Aelthalyste
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3
A	train	2652,1
S	Rogue/Warrior/Priest
T	optional	
A	goto	1458/0,66.74,1766.18
A	turnin	411
A	target	Bethor Iceshard
A	zoneskip	Undercity,1
S	skip --Rogue/Warrior
T	optional	
T	label	UndercityLS3
A	goto	1458/0,59.07,1747.75
A	goto	1458/0,221.78,1780.14,30
A	link	https://www.youtube.com/watch?v=-Bi95bCN8dM
A	zoneskip	Undercity,1
A	itemcount	7231,<1 << Rogue
S	Priest
T	optional	
A	goto	1458/0,201.05,1686.94
A	train	3908
A	target	Victor Ward
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3
S	Priest
T	optional	
A	goto	1458/0,194.34,1681.63
A	collect	2996,30,435,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3
S	Priest
T	optional	
A	goto	1458/0,201.05,1686.94
A	train	7623
A	target	Victor Ward
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3
S	Priest
T	optional	
A	goto	1458/0,196.16,1684.83
A	collect	2320,30,435,1
A	target	Millie Gregorian
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3
S	Priest
T	optional	
A	collect	6238,9,398,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3
S	Priest
T	optional	
A	goto	1458/0,273.87,1482.360
A	train	7411
A	target	Lavinia Crowe
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3
S	Priest
T	optional	
A	goto	1458/0,275.02,1487.55
A	collect	6218,1,435,1
A	collect	4470,1,435,1
A	target	Thaddeus Webb
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3
S	Priest
T	optional	
A	goto	1458/0,273.2,1491.71
A	train	14293
A	target	Malcomb Wynn
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3
S	Priest
T	optional	
T	label	LesserMagicWand
A	collect	11287,1,435,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3
S	Priest
T	optional	
T	completewith	Entersilverpine
A	use	11287
A	itemcount	11287,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<11.3
S	skip --Priest
T	optional	
T	label	UndercityLS3
A	goto	1458,61.990,62.272
A	goto	1458/0,221.78,1780.14,30
A	zoneskip	Undercity,1
S	Rogue
T	optional	
A	goto	1458/0,71.92,1435.630
A	turnin	1886
A	target	Mennet Carkad
A	isQuestComplete	1886
A	zoneskip	Undercity,1
S	Rogue
T	optional	
A	goto	1458/0,71.92,1435.630
A	accept	1898
A	target	Mennet Carkad
A	isQuestTurnedIn	1886
S	Rogue
T	optional	
A	goto	1458/0,347.07,1389.48
A	turnin	1898
A	accept	1899
A	target	Andron Gant
A	isQuestTurnedIn	1886
S	Rogue
T	optional	
A	goto	1458/0,341.41,1385.90
A	complete	1899,1
A	isQuestTurnedIn	1886
S	Rogue
T	optional	
A	goto	1458/0,71.83,1435.51
A	turnin	1899
A	accept	1978
A	target	Mennet Carkad
A	isQuestTurnedIn	1886
S	Rogue
T	optional	
A	goto	1420/0,373.60,1464.85,40,0
A	goto	1420/0,333.38,1287.72
A	turnin	1978
A	target	Varimathras
A	isQuestTurnedIn	1886
S	skip --Rogue
T	optional	
A	goto	1458/0,343.43,1296.22
A	goto	1458/0,221.78,1780.14,30
A	link	https://www.youtube.com/watch?v=jj85AXyF1XE
A	isQuestTurnedIn	1886
A	zoneskip	Undercity,1
S	Rogue
T	optional	
T	completewith	Entersilverpine
A	goto	1420/0,235.32,1883.89
A	zone	Tirisfal Glades
A	zoneskip	Tirisfal Glades
A	isQuestTurnedIn	1886
S	Rogue/Warrior/Priest
T	optional	
A	goto	1458/0,419.89,1627.54,50,0
A	goto	1458/0,428.52,1597.20,10,0
A	goto	1458/0,439.17,1626.06,10,0
A	goto	1458/0,476.78,1632.150,10,0
A	goto	1458/0,482.34,1660.63,10,0
A	goto	1458/0,539.33,1665.49,15,0
A	goto	1458/0,610.42,1684.44,35,0
A	goto	1458/0,663.19,1600.46,35,0
A	goto	1420/0,724.25,1682.66,50,0
A	zone	Tirisfal Glades
A	zoneskip	Tirisfal Glades
A	isQuestAvailable	1978
S	
T	label	Entersilverpine
A	goto	1420/0,629.36,1553.42
A	zone	Silverpine Forest
A	zoneskip	Silverpine Forest
E
G	Guides/forever/Horde-01-14_Undead.lua
M	group	RestedXP Forever Guide (H)
M	subgroup	Speedrun Guide 1-22
M	selector	Horde
M	version	11
M	defaultfor	Undead/Troll Rogue/Orc Rogue/Orc Warlock/Troll Mage/Troll Priest
M	classic	
M	tbc	
M	era/som--h	
M	name	12-14 Silverpine Forest
M	next	12-17 The Barrens
S	Undead Rogue
T	sticky	
T	completewith	Rot HideCluesTurnIn
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
A	goto	1421/0,1090.44,1409.63
A	accept	435,1
A	target	Deathstalker Erland
S	
T	completewith	next
A	collect	3164,6,429,1
A	mob	Worg
A	mob	Mottled Worg
A	unitscan	Gorefang
S	
A	goto	1421/0,1087.50,1379.11,30,0
A	goto	1421/0,1087.50,1346.63,30,0
A	goto	1421/0,1090.86,1313.31,30,0
A	goto	1421/0,1204.68,1290.07
A	complete	435,1
A	mob	Worg
S	
A	goto	1421/0,1204.68,1290.07
A	turnin	435
A	accept	429
A	accept	449
A	target	Rane Yorick
S	
T	loop	
A	goto	1421/0,1025.76,1384.71,0
A	goto	1421/0,1099.68,1213.63,50,0
A	goto	1421/0,998.46,1230.99,50,0
A	goto	1421/0,955.2,1286.43,50,0
A	goto	1421/0,925.38,1372.39,50,0
A	goto	1421/0,1025.76,1384.71,50,0
A	collect	3164,6,429,1
A	mob	Worg
A	mob	Mottled Worg
A	unitscan	Gorefang
S	
T	softcore	
T	completewith	ProveyourWorth
A	deathskip	
S	
T	hardcore	
T	completewith	next
A	goto	1421/0,1359.66,864.19,50,0
A	goto	1421/0,1359.66,741.27,50,0
A	goto	1421/0,1365.12,607.15,100,0
A	goto	1421/0,1538.58,511.39,100
A	subzoneskip	228
S	
T	label	ProveyourWorth
A	goto	1421/0,1593.6,554.23
A	accept	421
A	target	Dalar Dawnweaver
S	!Mage !Priest
A	goto	1421/0,1599.90,552.83
A	vendor	
A	collect	4605,20,421,1
A	target	Gwyn Farrow
A	money	<0.05
S	
A	goto	1421/0,1602.84,549.75
A	vendor	
A	collect	1179,20,421,1 << Mage/Warlock/Priest/Shaman/Druid
A	target	Edwin Harly
A	money	<0.05 << Mage/Warlock/Priest/Shaman/Druid
S	Undead
A	accept	477
A	target	+Shadow Priest Allister
A	goto	1421/0,1602.84,520.63
A	accept	6321
A	target	+Deathguard Podrig
A	goto	1421/0,1625.94,499.91
S	
T	label	BorderCrossings
A	goto	1421/0,1602.84,520.63
A	accept	477
A	target	Shadow Priest Allister
S	
T	completewith	next
A	goto	1421/0,1640.22,509.43,8,0
A	goto	1421/0,1654.50,510.270,8,0
A	goto	1421/0,1654.08,521.470,8,0
A	goto	1421/0,1625.94,522.31,2
S	
A	goto	1421/0,1625.94,522.31
A	turnin	449
A	accept	3221
A	accept	437
A	target	High Executor Hadrec
S	
A	goto	1421/0,1652.82,522.31
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
A	goto	1421/0,1386.96,638.51,0
A	goto	1421/0,1336.56,568.51,50,0
A	goto	1421/0,1271.88,502.99,50,0
A	goto	1421/0,1285.74,460.99,50,0
A	goto	1421/0,1281.96,410.87,50,0
A	goto	1421/0,1274.4,361.87,50,0
A	goto	1421/0,1315.14,329.95,50,0
A	goto	1421/0,1386.96,638.51,50,0
A	complete	421,1
A	mob	Moonrage Whitescalp
A	unitscan	Son of Arugal
S	
A	goto	1421/0,1593.6,554.23
A	target	Dalar Dawnweaver
A	turnin	421
A	accept	422
S	
T	completewith	Remedy
A	goto	1421/0,1234.92,891.070,80
S	
T	label	Remedy
A	goto	1421/0,1234.92,891.070,8,0
A	goto	1421/0,1218.54,884.91,8,0
A	goto	1421/0,1226.52,886.03,8,0
A	goto	1421/0,1231.14,866.99
A	complete	422,1
S	
T	completewith	next
A	goto	1421/0,1207.62,1293.71,80,0
A	subzone	239
S	
T	label	QuinnYorick
A	goto	1421/0,1207.62,1293.71,8,0
A	goto	1421/0,1220.64,1299.59,8,0
A	goto	1421/0,1212.66,1298.19,8,0
A	goto	1421/0,1205.94,1314.15
A	turnin	430
A	target	Quinn Yorick
S	
A	goto	1421/0,1204.68,1290.07
A	accept	425
A	target	Rane Yorick
S	
A	goto	1421/0,1265.58,1274.11,6,0
A	goto	1421/0,1270.62,1279.71,6,0
A	goto	1421/0,1285.32,1277.19
A	complete	425,1
A	target	Ivar the Foul
A	mob	Ravenclaw Slave
S	
A	goto	1421/0,1204.68,1290.07
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
A	goto	1421/0,1541.52,1078.39
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
A	goto	1421/0,2064.0,1167.15
A	vendor	
A	target	Killian Sanatha
A	isOnQuest	447
S	
T	loop	
A	goto	1421/0,1924.14,1269.070,0
A	goto	1421/0,1885.50,1218.95,50,0
A	goto	1421/0,1951.86,1218.39,50,0
A	goto	1421/0,1981.68,1209.15,50,0
A	goto	1421/0,2022.42,1183.95,50,0
A	goto	1421/0,2016.12,1239.39,50,0
A	goto	1421/0,1977.48,1260.670,50,0
A	goto	1421/0,1944.30,1279.43,50,0
A	goto	1421/0,1924.14,1269.070,50,0
A	complete	447,2
A	mob	Moss Stalker
A	unitscan	Krethis Shadowspi
S	
T	loop	
A	goto	1421/0,1702.8,1060.47,0
A	goto	1421/0,1712.46,1116.75,50,0
A	goto	1421/0,1702.8,1060.47,50,0
A	goto	1421/0,1670.88,1001.11,50,0
A	goto	1421/0,1573.86,971.15,50,0
A	goto	1421/0,1514.64,921.31,50,0
A	complete	447,1
A	mob	Ferocious Grizzled Bear
A	mob	Giant Grizzled Bear
A	unitscan	Old VIcejaw
A	unitscan	Son of Arugal
S	
T	softcore	
T	completewith	ArugalTurnin
A	deathskip	
S	
T	hardcore	
T	completewith	next
A	goto	1421/0,1538.58,511.39,100,0
A	subzone	228
S	
A	goto	1421/0,1593.6,554.23
A	turnin	422
A	accept	423
A	target	Dalar Dawnweaver
S	
T	optional	
T	label	ArugalTurnin
S	
T	completewith	next
A	goto	1421/0,1640.22,509.43,8,0
A	goto	1421/0,1654.50,510.270,8,0
A	goto	1421/0,1654.08,521.470,8,0
A	goto	1421/0,1625.94,522.31,2
S	
A	goto	1421/0,1625.94,522.31
A	turnin	437
A	accept	438
A	target	High Executor Hadrec
S	!Mage !Priest
A	goto	1421/0,1599.90,552.83
A	vendor	
A	collect	4605,20,423,1
A	target	Gwyn Farrow
S	
A	goto	1421/0,1602.84,549.75
A	vendor	
A	collect	1179,20,423,1 << Warlock/Priest/Shaman/Druid
A	target	Edwin Harly
S	Warlock/Mage/Priest
A	goto	1421/0,1568.4,567.95
A	vendor	
A	target	Andrea Boynton
A	money	<0.1400
S	Rogue
A	goto	1421/0,1576.38,571.59
A	vendor	
A	target	Alexandre Lefevre
A	money	<0.2633
S	Warlock/Mage/Priest
T	optional	
T	completewith	Shackles
A	use	4786
A	itemcount	4786,1
A	xp	<15,1
A	equip	6,4786
S	Rogue
T	optional	
T	completewith	Shackles
A	use	4788
A	itemcount	4788,1
A	xp	<15,1
A	equip	8,4788
S	
T	label	DecrepitFerry
A	goto	1421/0,997.62,692.55
A	turnin	438
A	accept	439
S	
T	loop	
A	goto	1421/0,1095.48,385.67,0
A	goto	1421/0,1095.48,385.67,40,0
A	goto	1421/0,1121.1,289.63,40,0
A	goto	1421/0,1064.4,382.59,40,0
A	complete	423,1
A	mob	+Moonrage Glutton
A	complete	423,2
A	mob	+Moonrage Darksoul
S	
T	hardcore	
A	goto	1421/0,1354.62,-22.57
A	turnin	477
A	accept	478
A	mob	Dalaran Apprentice
S	
T	label	BorderCrossings
T	softcore	
A	goto	1421/0,1354.62,-22.57
A	turnin	477
A	accept	478
A	mob	Dalaran Apprentice
S	
T	completewith	next
T	hardcore	
A	goto	1421/0,1538.58,511.39,100
A	subzoneskip	228
S	
T	softcore	
T	completewith	next
A	deathskip	
S	
A	turnin	478
A	accept	481
A	target	+Shadow Priest Allister
A	goto	1421/0,1602.84,520.63
A	turnin	423
A	turnin	481
A	accept	482
A	target	+Dalar Dawnweaver
A	goto	1421/0,1593.6,554.23
S	
A	goto	1421/0,1602.84,520.63
A	turnin	482
A	target	Shadow Priest Allister
S	
T	completewith	next
A	goto	1421/0,1640.22,509.43,8,0
A	goto	1421/0,1654.50,510.270,8,0
A	goto	1421/0,1654.08,521.470,8,0
A	goto	1421/0,1625.94,522.31,2
S	
T	label	Rot HideCluesTurnIn
A	goto	1421/0,1625.94,522.31
A	turnin	439
A	target	High Executor Hadrec
S	
A	goto	1421/0,1533.96,474.43
A	turnin	6321
A	accept	6323
A	fp	Sepulcher
A	fly	Undercity
A	target	Karos Razok
A	zoneskip	Undercity
S	Undead
A	hs	
A	use	6948
A	zoneskip	Undercity
A	bindlocation	1497,1
S	Undead
A	goto	1458/0,283.37,1610.32
A	turnin	6323
A	accept	6322
A	target	Gordon Wendham
S	Rogue
T	ssf	
A	goto	1458/0,286.53,1616.21
A	collect	2027,1,809,1
A	money	<0.3815
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.6
A	target	Louis Warren
S	Rogue
T	ah	
A	goto	1458/0,286.53,1616.21
A	collect	2027,1,809,1
A	money	<0.3815
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.6
A	target	Louis Warren
S	Rogue
T	optional	
T	completewith	Conscript
A	use	2027
A	itemcount	2027,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<8.6
S	Undead
A	goto	1458/0,266.20,1567.17
A	turnin	6322
A	target	Michael Garrett
S	Undead Warrior
T	optional	
A	goto	1458/0,418.35,1767.02
A	train	285
A	target	Baltus Fowler
A	dungeon	RFC
A	xp	<16,1
S	Undead Rogue/Undead Warrior
A	goto	1458/0,66.74,1766.18
A	turnin	411
A	target	Bethor Iceshard
A	isQuestComplete	411
S	Rogue/Warrior
A	goto	1458/0,171.03,1524.80
A	train	3273
A	target	Mary Edras
S	Rogue/Warrior
T	optional	
A	goto	1458/0,171.03,1524.80
A	skill	firstaid,40
A	itemcount	2589,1
S	Rogue/Warrior
T	optional	
A	goto	1458/0,171.03,1524.80
A	train	3276
A	target	Mary Edras
A	skill	firstaid,<40,1
S	Rogue/Warrior
T	optional	
A	goto	1458/0,171.03,1524.80
A	skill	firstaid,50
A	itemcount	2589,2
S	Rogue/Warrior
A	goto	1458/0,171.03,1524.80
A	train	3274
A	target	Mary Edras
A	skill	firstaid,<50,1
S	Undead Rogue
A	goto	1458/0,71.92,1435.630
A	turnin	1886
A	accept	1898
A	target	Mennet Carkad
A	isQuestComplete	1886
S	Undead Rogue
A	goto	1458/0,71.92,1435.630
A	accept	1898
A	target	Mennet Carkad
A	isQuestTurnedIn	1886
S	Undead Rogue
T	optional	
A	goto	1458/0,68.66,1416.69
A	train	1758
A	target	Carolyn Ward
A	xp	<14,1
A	xp	>16,1
A	isOnQuest	1898 << Undead
S	Undead Rogue
T	optional	
A	goto	1458/0,68.66,1416.69
A	train	6761
A	target	Carolyn Ward
A	xp	<16,1
A	isOnQuest	1898 << Undead
S	Undead Rogue
A	goto	1458/0,68.66,1416.69
A	train	1758
A	target	Carolyn Ward
A	xp	<14,1
A	xp	>16,1
A	dungeon	RFC
S	Undead Rogue
T	optional	
A	goto	1458/0,68.66,1416.69
A	train	6761
A	target	Carolyn Ward
A	xp	<16,1
A	dungeon	RFC
S	Undead Rogue
A	goto	1458/0,347.07,1389.48
A	turnin	1898
A	accept	1899
A	target	Andron Gant
A	isQuestTurnedIn	1886
S	Undead Rogue
A	goto	1458/0,341.41,1385.90
A	complete	1899,1
A	isQuestTurnedIn	1886
S	
T	completewith	next
T	optional	
A	goto	1458,54.383,73.014,50,0 << !Undead/!Rogue
A	goto	1458,52.837,77.725,20,0
A	goto	1458,52.275,79.254,15,0
A	goto	1458,51.279,79.923,15,0
A	goto	1458,49.693,78.903,15,0
A	goto	1458,47.951,76.171,15,0
A	goto	1458/0,404.63,1434.67,12
S	
A	turnin	447
A	target	+Master Apothecary Faranell
A	goto	1458/0,404.63,1434.67
A	turnin	1359
A	accept	1358
A	target	+Apothecary Zinge
A	goto	1458/0,391.97,1442.87
S	skip --Undead Rogue/Undead Warrior
T	optional	
A	goto	1458,48.906,70.156
A	goto	1458/0,221.78,1780.14,30
A	zoneskip	Undercity,1
A	isQuestTurnedIn	1886 << Rogue
S	Undead Rogue
A	goto	1458/0,71.83,1435.51
A	turnin	1899
A	accept	1978
A	target	Mennet Carkad
A	isQuestTurnedIn	1886
S	Undead Rogue
T	optional	
A	goto	1458/0,68.66,1416.69
A	train	1758
A	target	Carolyn Ward
A	xp	<14,1
A	xp	>16,1
A	dungeon	RFC
S	Undead Rogue
T	optional	
A	goto	1458/0,68.66,1416.69
A	train	6761
A	target	Carolyn Ward
A	xp	<16,1
A	dungeon	RFC
S	Undead Rogue
A	goto	1420/0,373.60,1464.85,40,0
A	goto	1420/0,333.38,1287.72
A	turnin	1978
A	target	Varimathras
A	isQuestTurnedIn	1886
S	skip --Undead Rogue
T	optional	
A	goto	1458/0,343.43,1296.22
A	goto	1458/0,221.78,1780.14,30
A	link	https://www.youtube.com/watch?v=jj85AXyF1XE
A	zoneskip	Undercity,1
A	isQuestTurnedIn	1886
S	!Rogue !Warrior
T	optional	
A	goto	1458/0,171.03,1524.80
A	train	3273
A	target	Mary Edras
S	!Rogue !Warrior
T	optional	
A	goto	1458/0,171.03,1524.80
A	skill	firstaid,40
A	itemcount	2589,1
S	!Rogue !Warrior
T	optional	
A	goto	1458/0,171.03,1524.80
A	train	3276
A	target	Mary Edras
A	skill	firstaid,<40,1
S	!Rogue !Warrior
T	optional	
A	goto	1458/0,171.03,1524.80
A	skill	firstaid,50
A	itemcount	2589,2
S	!Rogue !Warrior
T	optional	
A	goto	1458/0,171.03,1524.80
A	train	3274
A	target	Mary Edras
A	skill	firstaid,<50,1
S	Undead !Rogue !Warrior
A	goto	1458/0,66.74,1766.18
A	turnin	411
A	target	Bethor Iceshard
A	isQuestComplete	411
S	Mage
A	goto	1458/0,56.38,1813.81
A	train	2137
A	target	Anastasia Hartwell
A	xp	<14,1
A	xp	>16,1
S	Mage
T	optional	
A	goto	1458/0,56.38,1813.81
A	train	2120
A	target	Anastasia Hartwell
A	xp	<16,1
S	Undead Warlock
A	goto	1458/0,20.02,1776.42
A	train	6222
A	target	Richard Kerwin
A	xp	<14,1
A	xp	>16,1
S	Undead Warlock
T	optional	
A	goto	1458/0,20.02,1776.42
A	train	1455
A	target	Richard Kerwin
A	xp	<16,1
S	Priest/Mage/Warlock
T	ssf	
A	goto	1458/0,206.04,1705.57
A	collect	5208,1
A	money	<0.3515
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<13.4
A	target	Zane Bradford
S	Priest/Mage/Warlock
T	ah	
A	goto	1458/0,206.04,1705.57
A	collect	5208,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<13.4
A	target	Zane Bradford
S	Priest/Mage/Warlock
T	optional	
T	completewith	Conscript
A	use	5208
A	itemcount	5208,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<13.4
A	xp	>15,1
S	Priest/Mage/Warlock
T	optional	
T	completewith	Conscript
A	use	5208
A	itemcount	5208,1
A	itemStat	18,QUALITY,<7
A	itemStat	18,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<13.4
A	xp	<15,1
S	Undead Priest
T	xprate	<1.5
T	sticky	
T	label	TouchOW
A	goto	1458/0,403.29,1760.61
A	turnin	5658
A	target	Aelthalyste
A	train	2652,1
A	dungeon	RFC
S	!Undead Priest
T	sticky	
T	label	TouchOW
A	goto	1458/0,403.29,1760.61
A	turnin	5660
A	target	Aelthalyste
A	train	2652,1
A	dungeon	RFC
A	isOnQuest	5660
S	Undead Priest
A	goto	1458/0,416.91,1757.03
A	train	6074
A	target	Father Lazarus
A	xp	<14,1
A	xp	>16,1
A	dungeon	RFC
S	Undead Priest
T	optional	
A	goto	1458/0,416.91,1757.03
A	train	8102
A	target	Father Lazarus
A	xp	<16,1
A	dungeon	RFC
S	Undead Rogue
T	optional	
T	completewith	Conscript
A	abandon	1886
A	isOnQuest	1886
S	skip --Undead !Rogue !Warrior
T	requires	TouchOW << Undead Priest
A	goto	1458/0,327.4,1770.6 << Priest
A	goto	1458/0,206.81,1712.48 << Mage/Warlock
A	goto	1458/0,221.78,1780.14,30
A	goto	1458/0,221.78,1780.14,30
A	zoneskip	Undercity,1
A	dungeon	RFC
S	skip --Undead !Rogue !Warrior
A	goto	1458/0,206.81,1712.48 << Priest/Mage/Warlock
A	goto	1458/0,221.78,1780.14,30
A	link	https://www.youtube.com/watch?v=-Bi95bCN8dM
A	zoneskip	Undercity,1
A	dungeon	!RFC
S	Undead
T	sticky	
T	completewith	EnterRFC
A	subzone	2437
A	dungeon	RFC
S	Undead
T	completewith	next
A	goto	1420/0,235.32,1883.89,50,0
A	zone	Tirisfal Glades
A	zoneskip	Tirisfal Glades
S	Undead
T	label	ZeptoDurotar
A	goto	1420/0,278.70,2071.27,12,0
A	goto	1420/0,253.85,2059.82,10,0
A	goto	1420/0,264.70,2053.50,8,0
A	goto	1420/0,271.02,2064.94,8,0
A	goto	1420/0,259.72,2068.86,8,0
A	goto	1420/0,261.53,2055.00,8,0
A	goto	1420/0,299.04,2069.46,-1
A	goto	1420/0,279.61,2441.21,-1
A	zone	Durotar
A	zoneskip	Durotar
S	Undead
T	completewith	HiddenEnemiesPickup
A	goto	1454/1,-4367.46,1405.44,50,0
A	zone	Orgrimmar
A	dungeon	RFC
S	Undead
A	goto	1454/1,-4313.60,1676.24
A	fp	Orgrimmar
A	target	Doras
A	dungeon	RFC
S	Undead
A	goto	1454/1,-4125.79,1920.10
A	accept	5726
A	target	Thrall
A	dungeon	RFC
S	Undead
A	goto	1411/1,-4769.10,1484.39,0
A	complete	5726,1
A	dungeon	RFC
S	Undead
A	goto	1454/1,-4125.79,1920.10
A	turnin	5726
A	accept	5727
A	target	Thrall
A	dungeon	RFC
S	Undead
A	goto	1454/1,-4376.29,1802.43
A	accept	5761
A	target	Neeru Fireblade
A	dungeon	RFC
S	Undead
A	goto	1454/1,-4376.29,1802.43
A	complete	5727,1
A	skipgossip	
A	target	Neeru Fireblade
A	dungeon	RFC
S	Undead
T	label	HiddenEnemiesPickup
A	goto	1454/1,-4125.79,1920.10
A	turnin	5727
A	accept	5728
A	target	Thrall
A	dungeon	RFC
S	Undead
T	completewith	EnterRFC
A	destroy	14544
S	Undead
T	label	EnterRFC
A	goto	1454/1,-4420.76,1815.80
A	subzone	2437
A	dungeon	RFC
S	Undead
A	accept	5722
A	accept	5723
A	disablecheckbox	
A	dungeon	RFC
S	Undead
T	completewith	next
A	complete	5723,1
A	mob	+Ragefire Trogg
A	complete	5723,2
A	mob	+Ragefire Shaman
A	isOnQuest	5723
A	dungeon	RFC
S	Undead
A	turnin	5722
A	accept	5724
A	target	Maur Grimtotem
A	isOnQuest	5722
A	dungeon	RFC
S	Undead
T	optional	
A	accept	5724
A	target	Maur Grimtotem
A	isQuestTurnedIn	5722
A	dungeon	RFC
S	Undead
T	label	TroggsShamans
A	complete	5723,1
A	mob	+Ragefire Trogg
A	complete	5723,2
A	mob	+Ragefire Shaman
A	isOnQuest	5723
A	dungeon	RFC
S	Undead
T	requires	TroggsShamans
T	completewith	BazzalanandJergosh
A	complete	5725,1
A	complete	5725,2
A	mob	Searing Blade Cultist
A	mob	Searing Blade Warlock
A	isOnQuest	5725
A	dungeon	RFC
S	Undead
A	complete	5761,1
A	mob	Taragaman the Hungerer
A	isOnQuest	5761
A	dungeon	RFC
S	Undead
T	label	BazzalanandJergosh
A	complete	5728,1
A	mob	+Bazzalan
A	complete	5728,2
A	mob	+Jergosh the Invoker
A	isOnQuest	5728
A	dungeon	RFC
S	Undead
A	complete	5725,1
A	complete	5725,2
A	mob	Searing Blade Cultist
A	mob	Searing Blade Warlock
A	isOnQuest	5725
A	dungeon	RFC
S	Undead
A	goto	1454/1,-4376.29,1802.43
A	turnin	5761
A	target	Neeru Fireblade
A	isQuestComplete	5761
A	dungeon	RFC
S	Undead
A	goto	1454/1,-4125.79,1920.10
A	turnin	5728
A	accept	5729
A	target	Thrall
A	isQuestComplete	5728
A	dungeon	RFC
S	Undead
A	goto	1454/1,-4125.79,1920.10
A	accept	5729
A	target	Thrall
A	isQuestTurnedIn	5728
A	dungeon	RFC
S	Undead
A	goto	1454/1,-4376.29,1802.43
A	turnin	5729
A	accept	5730
A	target	Neeru Fireblade
A	dungeon	RFC
A	isQuestTurnedIn	5728
S	Undead
A	goto	1454/1,-4125.79,1920.10
A	turnin	5730
A	target	Thrall
A	isQuestTurnedIn	5728
A	dungeon	RFC
S	Undead
T	completewith	Conscript
A	subzone	362
S	!Undead
A	hs	
A	use	6948
A	subzoneskip	362
A	bindlocation	362,1
S	Rogue
T	optional	<< Undead
A	goto	1411/1,-4710.94,268.26
A	train	1758
A	target	Kaplak
A	xp	<14,1
A	xp	>16,1
S	Rogue
T	optional	<< Undead
A	goto	1411/1,-4710.94,268.26
A	train	6761
A	target	Kaplak
A	xp	<16,1
S	Priest
T	optional	<< Undead
A	goto	1411/1,-4831.5,295.05
A	train	8122
A	target	Tai'jin
A	xp	<14,1
A	xp	>16,1
S	Priest
T	optional	<< Undead
A	goto	1411/1,-4831.5,295.05
A	train	8102
A	target	Tai'jin
A	xp	<16,1
S	Warrior
T	optional	<< Undead
A	goto	1411/1,-4827.27,311.62
A	train	285
A	target	Tarshaw Jaggedscar
A	xp	<16,1
S	Warlock
T	optional	<< Undead
A	goto	1411/1,-4837.31,356.030
A	train	6222
A	target	Dhugru Gorelust
A	xp	<14,1
A	xp	>16,1
S	Warlock
T	optional	<< Undead
A	goto	1411/1,-4837.31,356.030
A	train	1455
A	target	Dhugru Gorelust
A	xp	<16,1
S	
T	label	Conscript
A	goto	1411/1,-4648.55,271.43
A	accept	840
A	target	Takrin Pathseeker
S	
T	completewith	next
A	subzone	379
S	
A	goto	1413/1,-3687.11,303.14
A	turnin	840
A	accept	842
A	target	Kargal Battlescar
S	!Undead
A	goto	1413/1,-3694.2,256.52
A	turnin	809
A	accept	924
A	target	Ak'Zeloth
A	isQuestTurnedIn	829
S	!Undead
A	goto	1413/1,-3694.2,259.22
A	turnin	926
A	isOnQuest	924
E
]=]
