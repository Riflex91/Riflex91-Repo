local addonName, MG = ...
MG.RestEDXPForeverRaw = MG.RestEDXPForeverRaw or { source = { repository = "RestedXP/RXPGuides", commit = "a688a75d595f5884dba8044a5ba4e7d7bd859c09", license = "CC BY-NC-SA 4.0", transformed = true, proseCopied = false }, chunks = {} }
MG.RestEDXPForeverRaw.chunks[#MG.RestEDXPForeverRaw.chunks + 1] = [=[
G	Guides/forever/Horde-Mage-12-21.lua
M	classic	
M	tbc	
M	selector	Horde Mage
M	name	12-17 The Barrens AoE
M	version	1
M	group	RestedXP Forever Guide (H)
M	subgroup	Speedrun Guide Mage AoE
M	defaultfor	Horde Mage
M	next	17-21 Stonetalon/Barrens AoE
S	Mage
T	era/som	
T	completewith	next
S	Mage
T	som	
T	phase	3-6
T	completewith	next
S	
A	goto	1413/1,-2666.68,-481.94
A	target	Tonga Runetotem
A	accept	870
S	
A	goto	1413/1,-2666.68,-481.94
A	turnin	842
A	target	Sergra Darkthorn
A	accept	844
S	Troll Mage
A	goto	1413/1,-2697.08,-400.86
A	target	Zargh
A	accept	6365
S	
A	goto	1413/1,-2636.28,-434.64
A	target	Gazrog
A	accept	869
S	
A	goto	1413/1,-2645.40,-406.94
A	home	
A	target	Innkeeper Boorand Plainswind
S	
A	goto	1413/1,-2595.75,-468.43
A	target	Thork
A	accept	871
A	accept	5041
S	
A	goto	1413/1,-2595.75,-441.40
A	fp	The Crossroads
S	Troll Mage
A	goto	1413/1,-2595.75,-434.64
A	turnin	6365
A	target	Devrak
A	accept	6384
S	
A	goto	1413/1,-2595.75,-421.13
A	target	Apothecary Helbrim
A	accept	848
A	accept	1492
S	
T	sticky	
T	completewith	next
A	goto	1413/1,-3021.35,-231.96
A	collect	4926,1,819
A	accept	819
S	
A	goto	1413/1,-3011.22,-184.66
A	complete	871,2
A	complete	871,1
A	complete	871,3
S	!Undead
T	sticky	
T	completewith	next
A	turnin	926
S	!Undead
T	sticky	
T	completewith	BeakCave
A	complete	844,1
S	!Undead
A	goto	1413/1,-2484.28,126.12,20
S	!Undead
T	label	BeakCave
A	goto	1413/1,-2200.55,315.3,20
S	!Undead
A	goto	1413/1,-2241.08,322.06
A	collect	4986,1,924
A	complete	924,1
S	
T	sticky	
T	completewith	next
A	complete	869,1
S	
A	goto	1413/1,-2524.82,-556.26
A	complete	844,1
S	
A	goto	1413/1,-2595.75,-475.18
A	turnin	871
A	target	Thork
A	accept	872
A	target	Darsok Swiftdagger
A	accept	867
S	
A	goto	1413/1,-2666.68,-481.94
A	turnin	844
A	target	Sergra Darkthorn
A	accept	845
S	
T	sticky	
T	completewith	Crates
A	complete	872,1
A	complete	872,2
S	
T	sticky	
T	completewith	next
A	complete	5041,1
S	
T	label	Kreenig
A	goto	1413/1,-3315.22,-218.44
A	complete	872,3
S	
T	label	Crates
A	goto	1413/1,-3305.08,-231.96,40,0
A	goto	1413/1,-3294.95,-211.69.0,40,0
A	goto	1413/1,-3305.08,-130.61,40,0
A	goto	1413/1,-3396.28,-63.05,40,0
A	complete	5041,1
S	
A	goto	1413/1,-3122.68,-96.83
A	complete	872,1
A	complete	872,2
S	!Undead
T	sticky	
T	completewith	next
A	complete	845,1
S	!Undead
A	goto	1413/1,-3690.15,254.49
A	target	Ak'Zeloth
A	turnin	924
S	
A	goto	1413/1,-3257.46,277.46,150,0 << Undead
A	goto	1413/1,-3852.28,-806.24
A	complete	845,1
S	
A	goto	1413/1,-3730.68,-840.02
A	target	Gazlowe
A	accept	887
S	
A	goto	1413/1,-3771.22,-894.07
A	fp	Ratchet
S	
A	goto	1413/1,-3761.08,-900.83
A	target	Sputtervalve
A	accept	894
S	
A	goto	1413/1,-3720.55,-921.09
A	accept	895
S	
A	goto	1413/1,-3700.28,-934.61
A	target	Mebok Mizzyrix
A	accept	865
S	
A	goto	1413/1,-3690.15,-981.90
A	turnin	819
A	target	Brewmaster Drohn
A	accept	821
S	
T	sticky	
T	label	Southsea
A	complete	887,1
A	complete	887,2
S	
A	goto	1413/1,-3882.68,-1569.69,40,0
A	goto	1413/1,-3821.88,-1704.82,40,0
A	goto	1413/1,-3720.55,-1745.36,40,0
A	goto	1413/1,-3882.68,-1569.69,40,0
A	goto	1413/1,-3821.88,-1704.82,40,0
A	goto	1413/1,-3720.55,-1745.36,40,0
A	goto	1413/1,-3882.68,-1569.69,40,0
A	goto	1413/1,-3821.88,-1704.82,40,0
A	goto	1413/1,-3720.55,-1745.36,40,0
A	complete	895,1
S	
T	requires	Southsea
A	goto	1413/1,-3730.68,-840.02
A	turnin	887
A	target	Gazlowe
A	accept	890
A	turnin	895
S	
A	goto	1413/1,-3791.48,-981.90
A	turnin	1492
A	turnin	890
A	target	Wharfmaster Dizzywig
A	accept	892
A	accept	896
S	
A	goto	1413/1,-3730.68,-840.02
A	turnin	892
A	target	Gazlowe
A	accept	888
S	
A	goto	1413/1,-3769.19,-898.12
A	fly	Crossroads
S	
A	goto	1413/1,-2595.75,-468.43
A	target	Thork
A	turnin	5041
A	turnin	872
S	
A	goto	1413/1,-2666.68,-481.94
A	turnin	845
A	target	Sergra Darkthorn
A	accept	903
S	
T	sticky	
T	completewith	next
A	complete	821,2
S	
T	label	RegtharDeathgate1
A	goto	1413/1,-1972.55,-306.95
A	accept	850
A	accept	855
A	target	Regthar Deathgate
S	
T	completewith	KodobaneTurnin
A	complete	855,1
A	mob	Kolkar Wrangler
A	mob	Kolkar Stormer
S	
T	completewith	Barak
A	complete	848,1
S	
A	goto	1413/1,-1943.16,89.64
A	complete	870,1
S	
T	label	Barak
A	goto	1413/1,-1716.18,23.43
A	complete	850,1
A	mob	Barak Kodobane
S	
A	goto	1413/1,-1972.55,-306.95
A	turnin	850
A	accept	851
A	turnin	855
A	target	Regthar Deathgate
A	isQuestComplete	855
S	
T	label	KodobaneTurnin
A	goto	1413/1,-1972.55,-306.95
A	turnin	850
A	accept	851
A	target	Regthar Deathgate
S	
T	sticky	
T	completewith	Claws
A	complete	869,1
S	
T	sticky	
T	completewith	next
A	goto	1413/1,-1572.28,-42.78,40,0
A	goto	1413/1,-1470.95,261.25,40,0
A	goto	1413/1,-1572.28,-42.78,40,0
A	goto	1413/1,-1470.95,261.25,40,0
A	complete	821,1
S	
T	label	Claws
A	goto	1413/1,-1572.28,-42.78
A	complete	903,1
S	
A	goto	1413/1,-1450.68,335.57,40,0
A	goto	1413/1,-1501.35,626.09,40,0
A	goto	1413/1,-1693.88,592.31,40,0
A	goto	1413/1,-1450.68,335.57,40,0
A	goto	1413/1,-1501.35,626.09,40,0
A	goto	1413/1,-1693.88,592.31,40,0
A	complete	867,1
S	
T	completewith	next
A	goto	1413/1,-1815.48,788.24
A	vendor	
S	
T	sticky	
T	completewith	next
A	complete	821,2
S	
A	goto	1413/1,-2879.48,781.48,40,0
A	goto	1413/1,-2909.88,484.21,40,0
A	goto	1413/1,-1693.88,592.31,40,0
A	goto	1413/1,-2879.48,781.48,40,0
A	goto	1413/1,-2909.88,484.21,40,0
A	goto	1413/1,-1693.88,592.31,40,0
A	complete	869,1
S	
A	goto	1413/1,-2686.95,828.77
A	turnin	894
A	accept	900
S	
A	goto	1413/1,-2686.95,842.29
A	complete	900,2
S	
A	goto	1413/1,-2676.82,842.29
A	complete	900,3
A	goto	1413/1,-2676.82,828.77
A	complete	900,1
S	
A	goto	1413/1,-2686.95,828.77
A	turnin	900
A	accept	901
S	
A	goto	1413/1,-2727.48,909.85
A	complete	901,1
S	
A	goto	1413/1,-2686.95,828.77
A	turnin	901
A	accept	902
S	
A	goto	1413/1,-3102.42,1105.78
A	target	Wizzlecrank's Shredder
A	accept	858
S	
A	xp	16
S	
A	goto	1413/1,-3082.15,1031.46
A	complete	858,1
S	
A	goto	1413/1,-3102.42,1105.78
A	turnin	858
A	target	Wizzlecrank's Shredder
A	accept	863
S	
T	label	Slugs
A	goto	1413/1,-2980.82,1085.51
A	complete	863,1
S	
A	goto	1413/1,-3609.08,1321.98
A	complete	896,1
S	
T	completewith	next
A	goto	1454/1,-3841.9,1647.15,40
S	
A	goto	1454/1,-4224.67,1472.41
A	trainer	
S	Troll Mage
A	goto	1454/1,-4440.81,1632.18
A	turnin	6384
A	target	Innkeeper Gryshka
A	accept	6385
S	
A	goto	Orgrimmar,45.120,63.889
A	fp	Orgrimmar
A	turnin	6385
A	target	Doras
A	accept	6386
S	
A	goto	1454/1,-4229.02,1917.48
A	target	Zor Lonetree
A	accept	1061
S	
T	completewith	next
A	hs	
S	Troll Mage
A	goto	1413/1,-2707.22,-407.62
A	target	Zargh
A	turnin	6386
S	
A	goto	1413/1,-2636.28,-434.64
A	turnin	869
A	target	Gazrog
A	accept	3281
S	
A	goto	1413/1,-2676.82,-481.94.0
A	turnin	903
A	target	Sergra Darkthorn
A	accept	881
S	
A	goto	1413/1,-3001.08,443.67
A	complete	881,1
S	
A	goto	1413/1,-2666.68,-481.94
A	turnin	881
A	target	Sergra Darkthorn
A	accept	905
S	
A	goto	1413/1,-2666.68,-481.94.90
A	turnin	870
A	target	Tonga Runetotem
A	accept	877
S	
A	goto	1413/1,-2646.42,-522.480
A	target	Mankrik
A	accept	899
A	accept	4921
S	
A	goto	1413/1,-2605.88,-475.18
A	turnin	867
A	target	Darsok Swiftdagger
A	accept	875
S	
A	goto	1413/1,-2595.75,-427.890
A	target	Apothecary Helbrim
A	turnin	848
S	
A	goto	1413/1,-2595.75,-434.64
A	fly	Ratchet
S	
A	goto	1413/1,-3761.08,-900.83
A	turnin	902
A	turnin	863
A	target	Sputtervalve
A	accept	1483
S	
A	goto	1413/1,-3791.48,-981.900
A	target	Wharfmaster Dizzywig
A	turnin	896
S	
A	goto	1413/1,-3700.28,-934.610
A	target	Mebok Mizzyrix
A	accept	1069
S	
A	goto	1413/1,-3821.88,-1711.58
A	complete	888,2
S	
A	goto	1413/1,-3720.55,-1738.60
S	
T	sticky	
T	completewith	Nest
A	complete	865,1
S	
A	goto	1413/1,-3193.62,-1927.77,90,0
A	goto	1413/1,-3254.42,-2029.12
A	complete	3281,1
S	
T	completewith	Verog
A	complete	848,1
S	
A	goto	1413/1,-3011.22,-1272.42
A	complete	877,1
S	
T	sticky	
T	completewith	next
A	complete	855,1
S	
T	label	Verog
A	goto	1413/1,-2742.68,-1209.59
A	complete	851,1
S	
T	loop	
A	line	The Barrens,55.72,42.14,55.49,41.75,55.09,41.58,55.03,42.24,55.27,43.17,55.78,43.47,56.15,43.28,56.08,42.58,55.72,42.14
A	goto	1413/1,-3023.38,-1234.58,25,0
A	goto	1413/1,-3000.07,-1208.23,25,0
A	goto	1413/1,-2959.54,-1196.75,25,0
A	goto	1413/1,-2953.46,-1241.34,25,0
A	goto	1413/1,-2977.78,-1304.17,25,0
A	goto	1413/1,-3029.46,-1324.44,25,0
A	goto	1413/1,-3066.95,-1311.61,25,0
A	goto	1413/1,-3059.86,-1264.31,25,0
A	goto	1413/1,-3023.38,-1234.58,25,0
A	complete	848,1
S	
A	goto	1413/1,-2707.22,-1508.89
A	complete	905,1
S	
A	goto	1413/1,-2697.08,-1535.91
A	complete	905,3
S	
T	label	Nest
A	goto	1413/1,-2646.42,-1529.16
A	complete	905,2
S	
A	goto	1413/1,-3183.48,-2015.61,40,0
A	goto	1413/1,-2646.42,-1529.16,40,0
A	goto	1413/1,-3183.48,-2015.61,40,0
A	goto	1413/1,-2646.42,-1529.16,40,0
A	goto	1413/1,-3183.48,-2015.61,40,0
A	goto	1413/1,-2646.42,-1529.16,40,0
A	goto	1413/1,-3183.48,-2015.61,40,0
A	goto	1413/1,-2646.42,-1529.16,40,0
A	complete	865,1
S	
A	goto	1413/1,-2372.82,-1792.65
A	complete	4921,1
S	
A	goto	1413/1,-1997.88,-2373.69
A	home	
S	
A	goto	1413/1,-1886.42,-2387.20
A	target	Mangletooth
A	accept	878
S	
A	goto	1413/1,-1886.42,-2387.20
A	fp	Camp Taurajo
A	fly	Crossroads
S	
A	goto	1413/1,-2636.28,-434.64
A	target	Gazrog
A	turnin	3281
S	
A	goto	1413/1,-2666.68,-481.94
A	turnin	905
A	target	Sergra Darkthorn
A	accept	3261
S	
A	goto	1413/1,-2666.68,-481.94
A	turnin	877
A	target	Tonga Runetotem
A	accept	880
S	
A	goto	1413/1,-2646.42,-522.48
A	target	Mankrik
A	turnin	4921
S	
T	sticky	
T	completewith	next
A	complete	821,2
S	
A	goto	1413/1,-1976.6,-308.30
A	turnin	851
A	target	Regthar Deathgate
A	accept	852
S	
A	goto	1413/1,-1976.6,-308.30
A	target	Regthar Deathgate
A	turnin	855
A	isQuestComplete	855
S	
A	goto	1413/1,-1976.6,-308.30
A	turnin	851
A	target	Regthar Deathgate
A	accept	852
S	
T	sticky	
T	label	CeBracers
A	complete	855,1
S	
A	goto	1413/1,-2025.24,-1144.050
A	complete	852,1
S	
T	requires	CeBracers
A	goto	1413/1,-1974.58,-308.30
A	target	Regthar Deathgate
A	turnin	852
A	turnin	855
S	
A	goto	1413/1,-1974.58,-308.30
A	target	Regthar Deathgate
A	accept	4021
S	
A	goto	1413/1,-1869.19,-288.71
A	complete	4021,1
S	
A	isQuestComplete	4021
A	goto	1413/1,-1976.6,-308.98
A	target	Regthar Deathgate
A	turnin	4021
S	
A	goto	1413/1,-1410.15,443.67,80,0
A	goto	1413/1,-1166.95,545.01,80,0
A	goto	1413/1,-1460.82,585.55,80,0
A	goto	1413/1,-1410.15,443.67,80,0
A	goto	1413/1,-1166.95,545.01,80,0
A	goto	1413/1,-1460.82,585.55,80,0
A	goto	1413/1,-1410.15,443.67,80,0
A	goto	1413/1,-1166.95,545.01,80,0
A	goto	1413/1,-1460.82,585.55,80,0
A	goto	1413/1,-1410.15,443.67
A	complete	875,1
S	
A	goto	1413/1,-1572.28,-42.78
A	complete	821,1
S	
A	goto	1413/1,-954.15,-272.49
A	turnin	1061
A	target	Seereth Stonebreak
A	accept	1062
A	target	Makaba Flathoof
A	accept	6548
E
G	Guides/forever/Horde-Mage-12-21.lua
M	classic	
M	tbc	
M	selector	Horde Mage
M	name	17-21 Stonetalon/Barrens AoE
M	version	1
M	group	RestedXP Forever Guide (H)
M	subgroup	Speedrun Guide Mage AoE
M	defaultfor	Horde Mage
M	next	21-30 Silverpine/Hillsbrad AoE
S	
A	goto	1442/1,-695.02,12.09,50,0
A	goto	1442/1,-758.5,116.29,50,0
A	goto	1442/1,-890.35,171.65,50,0
A	goto	1442/1,-773.15,-13.96.0,50,0
A	goto	1442/1,-695.02,12.09,50,0
A	goto	1442/1,-758.5,116.29,50,0
A	goto	1442/1,-890.35,171.65,50,0
A	goto	1442/1,-773.15,-13.96.0,50,0
A	complete	6548,2
A	complete	6548,1
S	
A	goto	1413/1,-943.1,-265.13
A	turnin	6548
A	target	Makaba Flathoof
A	accept	6629
S	
A	goto	1442/1,-255.52,93.5,60,0
A	goto	1442/1,-367.83,109.78
A	complete	6629,1
A	complete	6629,2
S	
A	goto	1442/1,-343.42,122.80
A	target	Kaya Flathoof
A	accept	6523
S	
A	goto	1442/1,-455.73,-59.55
A	complete	6523,1
S	
A	goto	1442/1,-240.87,-180.03
A	target	Xen'Zilla
A	accept	6461
S	
T	sticky	
T	label	deepmossegg
A	complete	1069,1
S	
A	goto	1442/1,437.92,435.4,60,0
A	goto	1442/1,574.65,575.42,60,0
A	goto	1442/1,677.2,578.68,60,0
A	goto	1442/1,696.73,454.94,60,0
A	goto	1442/1,613.72,500.53,60,0
A	goto	1442/1,574.65,575.42,60,0
A	goto	1442/1,677.2,578.68,60,0
A	goto	1442/1,696.73,454.94,60,0
A	goto	1442/1,613.72,500.53,60,0
A	goto	1442/1,574.65,575.42
A	complete	6461,1
A	complete	6461,2
S	
A	goto	1442/1,365.2,878.29
A	turnin	1483
A	target	Ziz Fizziks
A	accept	1093
S	
T	sticky	
T	requires	deepmossegg
T	completewith	next
A	complete	1062,1
S	
T	requires	deepmossegg
A	goto	1442/1,179.10,1168.06,40,0
A	goto	1442/1,232.82,1239.70,40,0
A	goto	1442/1,-16.23,1441.59,40,0
A	goto	1442/1,-255.52,1291.80,40,0
A	goto	1442/1,-382.48,1135.50,40,0
A	goto	1442/1,179.10,1168.06,40,0
A	complete	1093,1
S	
A	goto	1442/1,115.62,1070.37,40,0
A	goto	1442/1,-338.53,1148.52,40,0
A	goto	1442/1,115.62,1070.37,40,0
A	goto	1442/1,-338.53,1148.52,40,0
A	goto	1442/1,115.62,1070.37,40,0
A	goto	1442/1,-338.53,1148.52,40,0
A	goto	1442/1,115.62,1070.37,40,0
A	goto	1442/1,-338.53,1148.52,40,0
A	complete	1062,1
S	
A	goto	1442/1,365.2,878.29
A	turnin	1093
A	target	Ziz Fizziks
A	accept	1094
S	
A	hs	
S	
A	goto	1413/1,-1926.95,-2380.44
A	turnin	3261
A	target	Jorn Skyseer
A	accept	882
S	
T	sticky	
T	label	Lizard
A	complete	821,3
S	
T	sticky	
T	label	Lakota1
T	completewith	next
A	goto	1413/1,-2443.75,-1975.07,0
A	goto	1413/1,-2038.42,-1711.58,0
A	goto	1413/1,-1967.48,-1934.53,0
A	goto	1413/1,-1937.08,-1887.24,0
A	collect	5099,1,883
A	accept	883
S	
A	goto	1413/1,-1866.15,-1921.02,50,0
A	goto	1413/1,-2149.88,-1988.58,50,0
A	goto	1413/1,-1957.35,-2056.14,50,0
A	goto	1413/1,-1866.15,-1921.02,50,0
A	goto	1413/1,-2149.88,-1988.58,50,0
A	goto	1413/1,-1957.35,-2056.14,50,0
A	goto	1413/1,-1866.15,-1921.02,50,0
A	goto	1413/1,-2149.88,-1988.58,50,0
A	goto	1413/1,-1957.35,-2056.14,50,0
A	goto	1413/1,-1866.15,-1921.02,50,0
A	goto	1413/1,-2149.88,-1988.58,50,0
A	goto	1413/1,-1957.35,-2056.14,50,0
A	complete	878,1
A	complete	878,2
A	complete	878,3
A	complete	899,1
S	
T	sticky	
T	completewith	Ishamuhale
A	complete	821,2
S	
T	requires	Lizard
A	goto	1413/1,-3001.08,-1265.66
A	complete	880,1
S	
T	completewith	next
A	goto	1413/1,-3558.42,-563.01
A	collect	10338,1
S	
T	label	Ishamuhale
A	goto	1413/1,-3446.95,-441.40
A	complete	882,1
S	
A	complete	821,2
S	
A	goto	1413/1,-3730.68,-840.02
A	target	Gazlowe
A	turnin	888
S	
A	goto	1413/1,-3761.08,-900.83
A	turnin	1094
A	target	Sputtervalve
A	accept	1095
S	
A	goto	1413/1,-3700.28,-927.85
A	target	Mebok Mizzyrix
A	turnin	865
A	turnin	1069
S	
A	goto	1413/1,-3690.15,-981.90
A	target	Brewmaster Drohn
A	turnin	821
S	
A	goto	1413/1,-3771.22,-894.07
A	fly	Crossroads
S	
A	goto	1413/1,-2666.68,-481.94
A	turnin	880
A	target	Tonga Runetotem
A	accept	1489
A	accept	3301
S	
A	goto	1413/1,-2646.42,-522.48
A	target	Mankrik
A	turnin	899
S	
A	goto	1413/1,-2605.88,-475.180
A	turnin	875
A	target	Darsok Swiftdagger
A	accept	876
S	
A	goto	1413/1,-2585.62,-427.89
A	turnin	848
A	target	Apothecary Helbrim
A	accept	853
S	
A	goto	1413/1,-2595.75,-434.64
A	fly	Camp Taurajo
S	
A	goto	1413/1,-2747.75,-1907.51
A	collect	5075
S	
A	goto	1413/1,-1896.55,-2387.20
A	turnin	878
A	target	Mangletooth
A	accept	5052
A	turnin	5052
S	
A	goto	1413/1,-1916.82,-2380.44
A	turnin	882
A	target	Jorn Skyseer
A	accept	907
A	accept	1130
S	
A	goto	1413/1,-1916.82,-2380.44
A	isOnQuest	883
A	target	Jorn Skyseer
A	turnin	883
S	
A	goto	1413/1,-1916.82,-2380.44
A	turnin	882
A	target	Jorn Skyseer
A	accept	907
A	accept	1130
S	
T	sticky	
T	label	Owatanka2
T	completewith	next
A	goto	1413/1,-1856.02,-2583.13,0
A	goto	1413/1,-2362.68,-2616.91,0
A	goto	1413/1,-2403.22,-2441.25.0,0
A	collect	5102,1,884
A	accept	884
S	
A	goto	1413/1,-1683.75,-2461.52,30,0
A	goto	1413/1,-2149.88,-2691.23,30,0
A	goto	1413/1,-2443.75,-2515.57,30,0
A	complete	907,1
S	
A	goto	1413/1,-1926.95,-2380.44
A	turnin	907
A	target	Jorn Skyseer
A	accept	913
S	
A	goto	1413/1,-1926.95,-2380.44
A	target	Jorn Skyseer
A	turnin	884
A	isOnQuest	884
S	
A	goto	1413/1,-1926.95,-2380.44
A	turnin	907
A	target	Jorn Skyseer
A	accept	913
S	
A	goto	1413/1,-1916.82,-2657.45,30,0
A	goto	1413/1,-2139.75,-2549.35,30,0
A	goto	1413/1,-1916.82,-2657.45,30,0
A	goto	1413/1,-2139.75,-2549.35,30,0
A	goto	1413/1,-1916.82,-2657.45,30,0
A	goto	1413/1,-2139.75,-2549.35,30,0
A	complete	913,1
S	
A	goto	1413/1,-1916.82,-2380.44
A	target	Jorn Skyseer
A	turnin	913
S	
T	completewith	next
A	goto	1413/1,-1890.47,-2391.93
A	target	Mangletooth
A	turnin	889
S	
A	goto	1456/1,182.67,-1315.51,60
S	
A	goto	1456/1,38.48,-1300.28
A	home	
S	
A	goto	1456/1,-125.64,-1413.06
A	turnin	1130
A	target	Melor Stonehoof
A	accept	1131
S	
A	goto	1456/1,202.5,-1058.75.0,30,0
A	goto	1456/1,276.6,-996.120
A	target	Apothecary Zamah
A	turnin	853
S	
A	goto	1456/1,254.06,-995.78
A	trainer	
S	
A	goto	1456/1,220.24,-1042.75
A	target	Clarice Foster
A	accept	264
S	
A	goto	1456/1,26.07,-1196.75
A	fp	Thunder Bluff
A	fly	Crossroads
S	
A	goto	1413/1,-1349.35,788.24
A	complete	876,1
S	
A	goto	1413/1,-954.15,-272.49
A	turnin	1062
A	turnin	6629
A	turnin	6523
A	target	Makaba Flathoof
A	accept	6401
A	target	Seereth Stonebreak
A	accept	1063
S	
A	goto	1442/1,-235.98,-180.03
A	target	Xen'Zilla
A	turnin	6461
S	
A	goto	1442/1,365.2,878.29
A	target	Ziz Fizziks
A	turnin	1095
S	
A	goto	1442/1,926.25,1015.02
A	target	Tammra Windfield
A	turnin	6401
S	
A	goto	1442/1,1042.47,968.13
A	fp	Sun Rock
S	
T	completewith	next
A	hs	
S	
A	goto	1456/1,-213.96,-1065.010
A	turnin	1063
A	target	Magatha Grimtotem
A	accept	1064
S	
A	goto	1456/1,-303.93,-1048.73
A	turnin	1489
A	target	Arch Druid Hamuul Runetotem
A	accept	1490
S	
A	goto	1456/1,-272.93,-1070.02
A	target	Nara Wildmane
A	turnin	1490
S	
A	goto	1456/1,276.6,-996.12
A	turnin	1064
A	target	Apothecary Zamah
A	accept	1065
S	
A	goto	1456/1,254.06,-995.78
A	trainer	
S	
A	goto	1456/1,28.19,-1197.92.0
A	fly	The Crossroads
S	
A	goto	1413/1,-2605.88,-475.180
A	target	Darsok Swiftdagger
A	turnin	876
S	
A	goto	1413/1,-2595.75,-437.35
A	fly	Orgrimmar
E
G	Guides/forever/Alliance-ADV-AoE-Mage-1-22.lua
M	classic	
M	tbc	
M	selector	Human Mage
M	name	1-10 ADV Elwynn Forest Human Mage AoE
M	version	2
M	group	RestedXP ADV AoE Alliance Mage
M	defaultfor	Human Mage
M	next	10-11 ADV Dun Morogh Human Mage AoE
S	!Human Mage
T	season	2
T	completewith	next
S	
T	completewith	next
S	
T	completewith	next
A	goto	1429/0,-146.20,-8999.660,50,0
A	mob	Young Wolf
S	
A	goto	1429/0,-136.52,-8933.53
A	accept	783
A	target	Deputy Willem
S	
A	goto	1429/0,-112.54,-8899.21
A	vendor	
A	target	Brother Danil
S	
A	goto	1429/0,-139.61,-8910.09,15,0
A	goto	1429/0,-162.62,-8902.59
A	turnin	783
A	accept	7
A	target	Marshal McBride
S	
T	completewith	next
A	goto	1429/0,-164.25,-8891.80,10,0
A	goto	1429/0,-174.32,-8880.92,10,0
A	goto	1429/0,-188.20,-8868.89,10,0
A	goto	1429/0,-180.56,-8862.87,5,0
A	goto	1429/0,-188.20,-8851.76,10
S	
A	goto	1429/0,-188.20,-8851.76
A	train	1459
A	target	Khelden Bremen
S	
T	completewith	next
A	goto	1429/0,-188.20,-8868.89,10,0
A	goto	1429/0,-174.32,-8880.92,10,0
A	goto	1429/0,-164.25,-8891.80,10,0
A	goto	1429/0,-136.52,-8933.53,10
S	
A	goto	1429/0,-136.52,-8933.53
A	accept	5261
A	target	Deputy Willem
S	
T	completewith	next
A	goto	1429/0,-64.64,-8924.9,70,0
A	goto	1429/0,-81.64,-8850.37
A	mob	Young Wolf
S	
A	goto	1429/0,-112.54,-8899.21
A	vendor	
A	collect	159,10,7,1
A	target	Brother Danil
S	
A	goto	1429/0,-163.21,-8869.12
A	turnin	5261
A	accept	33
A	target	Eagan Peltskinner
S	
T	completewith	next
A	complete	33,1
A	mob	Young Wolf
A	mob	Timber Wolf
S	
T	loop	
A	line	Elwynn Forest,47.01,35.68,47.70,35.04,49.81,35.14,49.82,36.23,49.18,37.16,47.01,35.68
A	goto	1429/0,-96.22,-8765.43,35,0
A	goto	1429/0,-120.17,-8750.61,35,0
A	goto	1429/0,-193.41,-8752.93,35,0
A	goto	1429/0,-193.75,-8778.16,35,0
A	goto	1429/0,-171.54,-8799.68,35,0
A	goto	1429/0,-96.22,-8765.43,35,0
A	complete	7,1
A	mob	Kobold Vermin
S	
T	loop	
A	line	Elwynn Forest,49.32,37.91,48.24,37.88,46.18,37.29,45.69,39.05,46.03,40.91,48.04,39.55,49.32,37.91
A	goto	1429/0,-176.40,-8817.04,35,0
A	goto	1429/0,-138.91,-8816.35,35,0
A	goto	1429/0,-67.41,-8802.69,35,0
A	goto	1429/0,-50.41,-8843.43,35,0
A	goto	1429/0,-62.21,-8886.48,35,0
A	goto	1429/0,-131.97,-8855.00,35,0
A	goto	1429/0,-176.40,-8817.04,35,0
A	complete	33,1
A	mob	Young Wolf
A	mob	Timber Wolf
S	
A	goto	1429/0,-163.21,-8869.12
A	turnin	33,1
A	target	Eagan Peltskinner
S	
A	goto	1429/0,-112.54,-8899.21
A	vendor	
A	collect	159,10,15,1
A	target	Brother Danil
S	
A	goto	1429/0,-162.62,-8902.59
A	turnin	7
A	accept	15
A	accept	3104
A	target	Marshal McBride
S	
T	loop	
A	line	Elwynn Forest,47.25,36.41,47.39,35.77,47.35,34.06,46.29,32.42,47.75,32.77,50.11,34.98,47.25,36.41
A	goto	1429/0,-104.55,-8782.32,35,0
A	goto	1429/0,-109.41,-8767.51,35,0
A	goto	1429/0,-108.02,-8727.93,35,0
A	goto	1429/0,-71.23,-8689.97,35,0
A	goto	1429/0,-121.91,-8698.07,35,0
A	goto	1429/0,-203.82,-8749.22,35,0
A	goto	1429/0,-104.55,-8782.32,35,0
A	complete	15,1
A	mob	Kobold Worker
S	
T	loop	
A	line	Elwynn Forest,49.32,37.91,48.24,37.88,46.18,37.29,45.69,39.05,46.03,40.91,48.04,39.55,49.32,37.91
A	goto	1429/0,-176.40,-8817.04,35,0
A	goto	1429/0,-138.91,-8816.35,35,0
A	goto	1429/0,-67.41,-8802.69,35,0
A	goto	1429/0,-50.41,-8843.43,35,0
A	goto	1429/0,-62.21,-8886.48,35,0
A	goto	1429/0,-131.97,-8855.00,35,0
A	goto	1429/0,-176.40,-8817.04,35,0
A	xp	3+1110
A	mob	Young Wolf
A	mob	Kobold Vermin
A	mob	Timber Wolf
S	
A	goto	1429/0,-112.54,-8899.21
A	vendor	
A	collect	159,10,15,1
A	target	Brother Danil
S	
A	goto	1429/0,-162.62,-8902.59
A	turnin	15
A	accept	21
A	target	Marshal McBride
S	
T	completewith	next
A	goto	1429/0,-164.25,-8891.80,10,0
A	goto	1429/0,-174.32,-8880.92,10,0
A	goto	1429/0,-188.20,-8868.89,10,0
A	goto	1429/0,-180.56,-8862.87,5,0
A	goto	1429/0,-188.20,-8851.76,10
S	
T	season	0
A	goto	1429/0,-188.20,-8851.76
A	turnin	3104
A	train	116
A	target	Khelden Bremen
S	
T	season	2
A	goto	1429/0,-188.20,-8851.76
A	accept	77620
A	turnin	3104
A	train	116
A	target	Khelden Bremen
S	
T	completewith	next
A	goto	1429/0,-188.20,-8868.89,10,0
A	goto	1429/0,-174.32,-8880.92,10,0
A	goto	1429/0,-164.25,-8891.80,10,0
A	goto	1429/0,-136.52,-8933.53,10
S	
A	goto	1429/0,-136.52,-8933.53
A	accept	18
A	target	Deputy Willem
S	
T	season	2
T	loop	
T	label	CALEENCI
T	completewith	RedBurlapBandana
A	goto	1429/0,-288.51,-9068.87,0
A	goto	1429/0,-388.47,-9001.28,0
A	collect	203751,1,77620,1
A	mob	Defias Thug
A	train	401760,1
S	Human
T	season	2
T	requires	CALEENCI
T	completewith	RedBurlapBandana
A	train	401760
A	use	203751
A	itemcount	203751,1
S	
T	loop	
T	label	RedBurlapBandana
A	goto	1429/0,-288.51,-9068.87,0
A	goto	1429/0,-388.47,-9001.28,0
A	goto	1429/0,-288.51,-9068.87,30,0
A	goto	1429/0,-335.02,-9108.91,30,0
A	goto	1429/0,-376.67,-9073.73,30,0
A	goto	1429/0,-388.47,-9001.28,30,0
A	goto	1429/0,-333.97,-9028.59,30,0
T	loop	
A	line	Elwynn Forest,51.14,49.29,52.55,48.75,53.81,48.09,54.58,49.02,55.15,47.86,54.76,45.96,53.81,44.79,,51.14,49.29
A	goto	1429/0,-239.57,-9080.44,35,0
A	goto	1429/0,-288.51,-9067.94,35,0
A	goto	1429/0,-332.24,-9052.67,35,0
A	goto	1429/0,-358.96,-9074.19,35,0
A	goto	1429/0,-378.75,-9047.34,35,0
A	goto	1429/0,-365.21,-9003.37,35,0
A	goto	1429/0,-332.24,-8976.29,35,0
A	goto	1429/0,-239.57,-9080.44,35,0
A	complete	18,1
A	mob	Defias Thug
S	
T	optional	
T	season	2
T	loop	
A	goto	1429/0,-288.51,-9068.87,0
A	goto	1429/0,-388.47,-9001.28,0
A	goto	1429/0,-288.51,-9068.87,50,0
A	goto	1429/0,-335.02,-9108.91,50,0
A	goto	1429/0,-376.67,-9073.73,50,0
A	goto	1429/0,-388.47,-9001.28,50,0
A	goto	1429/0,-333.97,-9028.59,50,0
A	collect	203751,1,77620,1
A	mob	Defias Thug
A	train	401760,1
S	Human
T	optional	
T	season	2
A	train	401760
A	use	203751
A	itemcount	203751,1
S	
A	goto	1429/0,-136.52,-8933.53
A	turnin	18,5
A	accept	6
A	accept	3903
A	target	Deputy Willem
S	
T	completewith	Laborer
A	use	1159
A	itemcount	1159,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.7
S	
A	goto	1429/0,-112.54,-8899.21
A	vendor	
A	collect	159,10,21,1
A	target	Brother Danil
S	
T	completewith	next
A	goto	1429/0,-122.25,-8671.45,40
S	
T	label	Laborer
A	goto	1429/0,-130.24,-8649.23,40,0
A	goto	1429/0,-141.69,-8607.11,40,0
A	goto	1429/0,-150.71,-8554.57,40,0
A	goto	1429/0,-198.26,-8535.36,40,0
A	goto	1429/0,-209.37,-8560.59
A	complete	21,1
A	mob	Kobold Laborer
S	
A	goto	1429/0,-224.3,-8850.37
A	turnin	3903
A	accept	3904
A	target	Milly Osworth
S	
T	completewith	Harvest
T	loop	
A	line	Elwynn Forest,53.68,47.29,52.82,48.78,54.43,48.10,54.52,49.58,53.85,50.68,54.52,49.58,54.43,48.10,53.68,47.29
A	goto	1429/0,-327.73,-9034.15,35,0
A	goto	1429/0,-297.88,-9068.64,35,0
A	goto	1429/0,-353.76,-9052.900,35,0
A	goto	1429/0,-356.88,-9087.15,35,0
A	goto	1429/0,-333.63,-9112.61,35,0
A	goto	1429/0,-356.88,-9087.15,35,0
A	goto	1429/0,-353.76,-9052.900,35,0
A	goto	1429/0,-327.73,-9034.15,35,0
A	xp	5+1175
A	mob	Defias Thug
S	
T	completewith	next
T	loop	
A	line	Elwynn Forest,53.68,47.29,52.82,48.78,54.43,48.10,54.52,49.58,53.85,50.68,54.52,49.58,54.43,48.10,53.68,47.29
A	goto	1429/0,-327.73,-9034.15,35,0
A	goto	1429/0,-297.88,-9068.64,35,0
A	goto	1429/0,-353.76,-9052.900,35,0
A	goto	1429/0,-356.88,-9087.15,35,0
A	goto	1429/0,-333.63,-9112.61,35,0
A	goto	1429/0,-356.88,-9087.15,35,0
A	goto	1429/0,-353.76,-9052.900,35,0
A	goto	1429/0,-327.73,-9034.15,35,0
A	complete	3904,1
S	
A	goto	1429/0,-461.01,-9056.37
A	complete	6,1
A	mob	Garrick Padfoot
S	
T	label	Harvest
T	loop	
A	line	Elwynn Forest,53.68,47.29,52.82,48.78,54.43,48.10,54.52,49.58,53.85,50.68,54.52,49.58,54.43,48.10,53.68,47.29
A	goto	1429/0,-327.73,-9034.15,35,0
A	goto	1429/0,-297.88,-9068.64,35,0
A	goto	1429/0,-353.76,-9052.900,35,0
A	goto	1429/0,-356.88,-9087.15,35,0
A	goto	1429/0,-333.63,-9112.61,35,0
A	goto	1429/0,-356.88,-9087.15,35,0
A	goto	1429/0,-353.76,-9052.900,35,0
A	goto	1429/0,-327.73,-9034.15,35,0
A	complete	3904,1
S	
T	loop	
A	line	Elwynn Forest,53.68,47.29,52.82,48.78,54.43,48.10,54.52,49.58,53.85,50.68,54.52,49.58,54.43,48.10,53.68,47.29
A	goto	1429/0,-327.73,-9034.15,35,0
A	goto	1429/0,-297.88,-9068.64,35,0
A	goto	1429/0,-353.76,-9052.900,35,0
A	goto	1429/0,-356.88,-9087.15,35,0
A	goto	1429/0,-333.63,-9112.61,35,0
A	goto	1429/0,-356.88,-9087.15,35,0
A	goto	1429/0,-353.76,-9052.900,35,0
A	goto	1429/0,-327.73,-9034.15,35,0
A	xp	5+1175
A	mob	Defias Thug
S	
A	goto	1429/0,-224.3,-8850.37
A	turnin	3904
A	accept	3905
A	target	Milly Osworth
S	
A	goto	1429/0,-136.52,-8933.53
A	turnin	6,1
A	target	Deputy Willem
S	
A	goto	1429/0,-162.62,-8902.59
A	turnin	21,3
A	accept	54
A	target	Marshal McBride
S	
T	completewith	next
A	goto	1429/0,-171.54,-8908.00,10,0
A	goto	1429/0,-184.38,-8901.52,10,0
A	goto	1429/0,-178.83,-8888.10,10,0
A	goto	1429/0,-164.60,-8892.50,10,0
A	goto	1429/0,-172.23,-8907.31,10,0
A	goto	1429/0,-185.08,-8899.21,10,0
A	goto	1429/0,-176.75,-8886.94,10,0
A	goto	1429/0,-181.64,-8902.13,10
S	
A	goto	1429/0,-181.64,-8902.13
A	turnin	3905,1
A	target	Brother Neals
S	Human
T	season	2
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
A	isQuestComplete	77620
S	Human
T	season	2
A	goto	1429/0,-188.23,-8851.58
A	turnin	77620
A	target	Khelden Bremen
A	isQuestComplete	77620
S	
A	goto	1429/0,-45.90,-9044.80
A	accept	2158
A	target	Falkhaan Isenstrider
S	
A	goto	1429/0,74.02,-9465.52
A	turnin	54
A	accept	62
A	target	Marshal Dughan
S	
A	goto	1429/0,33.14,-9460.75
A	accept	60
A	target	William Pestle
S	
T	completewith	next
A	home	
S	
A	goto	1429/0,16.20,-9462.65
A	turnin	2158,2
A	vendor	295
A	target	Innkeeper Farley
S	
A	goto	1429/0,34.28,-9472.99
A	trainer	
A	target	Zaldimar Wefhellt
S	
A	goto	1429/0,72.81,-9496.37
A	accept	47
A	target	Remy "Two Times"
S	
T	completewith	BoarMeat1
A	collect	769,4,86,1
A	mob	Stonetusk Boar
S	
A	accept	85
A	target	+"Auntie" Bernice Stonefield
A	goto	1429/0,338.47,-9889.69
A	accept	88
A	goto	Elwynn Forest,34.660,84.482
A	target	+Ma Stonefield
S	
T	completewith	next
A	complete	47,1
A	complete	60,1
A	mob	Kobold Tunneler
S	
A	goto	1429/0,38.38,-9923.69
A	turnin	85
A	accept	86
A	target	Billy Maclure
S	
T	label	BoarMeat1
A	goto	1429/0,37.40,-10014.14
A	accept	106
A	target	Maybell Maclure
S	
A	goto	1429/0,65.17,-10008.13
A	vendor	258
A	target	Joshua Maclure
S	
T	completewith	next
A	collect	769,4,86,1
A	mob	Stonetusk Boar
S	
A	goto	Elwynn Forest,29.840,85.997
A	turnin	106
A	accept	111
A	target	Tommy Joe Stonefield
S	
T	loop	
A	line	Elwynn Forest,31.15,85.36,33.08,86.64,33.51,85.22,32.17,83.88,31.15,85.36
A	goto	1429/0,454.25,-9915.31,35,0
A	goto	1429/0,387.26,-9944.94,35,0
A	goto	1429/0,372.34,-9912.07,35,0
A	goto	1429/0,418.85,-9881.06,35,0
A	goto	1429/0,454.25,-9915.31,35,0
A	collect	769,4,86,1
A	mob	Stonetusk Boar
S	
A	goto	1429/0,338.47,-9889.69
A	turnin	86
A	accept	84
A	target	+"Auntie" Bernice Stonefield
A	goto	1429/0,338.47,-9889.69
A	turnin	111
A	accept	107
A	target	+Gramma Stonefield
A	goto	1429/0,322.71,-9880.59
S	
T	completewith	next
A	complete	47,1
A	complete	60,1
A	mob	Kobold Tunneler
S	
A	goto	1429/0,38.38,-9923.69
A	turnin	84
A	accept	87
A	target	Billy Maclure
S	
A	goto	1429/0,65.17,-10008.13
A	vendor	258
A	target	Joshua Maclure
A	itemcount	1179,<8
S	
T	completewith	Mine
A	goto	1429/0,181.79,-9843.79,15
S	
T	completewith	Goldtooth
A	complete	47,1
A	complete	60,1
A	mob	Kobold Tunneler
A	mob	Kobold Miner
S	
T	label	Mine
A	goto	1429/0,179.36,-9811.39,12,0
A	goto	1429/0,157.15,-9789.40
A	complete	62,1
S	
T	completewith	next
A	goto	1429/0,148.82,-9763.71,12,0
A	goto	1429/0,132.16,-9752.60,12,0
A	goto	1429/0,87.04,-9745.65,40
S	
T	label	Goldtooth
A	goto	1429/0,87.04,-9745.65
A	complete	87,1
A	mob	Goldtooth
S	
T	loop	
A	line	Elwynn Forest,39.14,82.87,39.16,84.79,37.81,85.40,36.76,83.19,38.02,81.70,39.14,82.87
A	goto	1429/0,176.93,-9857.68,35,0
A	goto	1429/0,176.24,-9902.12,35,0
A	goto	1429/0,223.09,-9916.240,35,0
A	goto	1429/0,259.54,-9865.09,35,0
A	goto	1429/0,215.81,-9830.600,35,0
A	goto	1429/0,176.93,-9857.68,35,0
A	complete	47,1
A	complete	60,1
A	mob	Kobold Tunneler
A	mob	Kobold Miner
S	skip
T	completewith	next
A	goto	1429/0,102.31,-9787.78,-1
A	goto	1429/0,86.34,-9756.30,-1
A	goto	1429/0,80.79,-9740.56,-1
A	goto	1429/0,141.88,-9794.03,-1
A	goto	1429/0,150.55,-9825.04,-1
A	goto	1429/0,117.23,-9819.95,-1
A	goto	1429/0,135.98,-9775.28,-1
A	goto	1429/0,171.38,-9339.44,30
A	link	https://www.youtube.com/watch?v=SWBtPqm5M0Q
S	
T	completewith	next
A	subzone	87
S	
A	goto	1429/0,72.81,-9496.37
A	turnin	47
A	accept	40
A	target	Remy "Two Times"
S	
A	goto	1429/0,74.02,-9465.52
A	turnin	40
A	accept	35
A	turnin	62
A	accept	76
A	target	Marshal Dughan
S	
A	goto	1429/0,33.14,-9460.75
A	turnin	60
A	accept	61
A	turnin	107
A	accept	112
A	target	William Pestle
S	
A	goto	1429/0,16.20,-9462.65
A	vendor	
A	collect	1179,35,432,1
A	target	Innkeeper Farley
S	
A	goto	1429/0,9.64,-9465.36
A	vendor	
A	target	Brog Hamfist
A	money	<0.05
S	
T	completewith	next
A	goto	1429/0,34.63,-9466.28,10,0
A	goto	1429/0,47.12,-9456.10,12
S	
A	goto	1429/0,-215.62,-9390.60,50,0
A	goto	1429/0,-237.83,-9438.28,50,0
A	goto	1429/0,-292.32,-9442.91,50,0
A	goto	1429/0,-342.3,-9391.75,50,0
A	goto	1429/0,-459.62,-9402.63,50,0
A	goto	1429/0,-421.09,-9478.780
A	complete	112,1
A	mob	Murloc Streamrunner
A	mob	Murloc
S	
T	completewith	next
A	goto	1429/0,-604.70,-9188.53,12
S	
A	goto	1429/0,-588.39,-9130.90,12,0
A	goto	1429/0,-570.68,-9116.32,12,0
A	goto	1429/0,-560.97,-9100.58
A	complete	76,1
S	
T	completewith	next
A	goto	1429/0,-570.68,-9116.32,12,0
A	goto	1429/0,-588.39,-9130.90,12,0
A	goto	1429/0,-609.91,-9186.91,15
S	
A	goto	1429/0,-1032.06,-9610.23
A	turnin	35
A	accept	37
A	accept	52
A	target	Guard Thomas
S	
T	completewith	next
A	goto	1429/0,-1063.89,-9494.980,45,0
A	goto	1429/0,-984.06,-9457.950,45,0
A	goto	1429/0,-950.05,-9347.31,50,0
A	complete	52,2
A	unitscan	+Young Forest Bear
A	complete	52,1
A	mob	+Prowler
S	
A	goto	1429/0,-986.14,-9335.97
A	turnin	37
A	accept	45
S	
T	completewith	Bears
A	goto	1429/0,-1198.91,-9350.09,70,0
A	complete	52,2
A	unitscan	+Young Forest Bear
A	complete	52,1
A	mob	+Prowler
S	
A	goto	1429/0,-1289.22,-9469.80
A	accept	5545
A	target	Supervisor Raelen
S	
T	completewith	next
A	complete	5545,1
S	
A	goto	1429/0,-1233.96,-9224.41,45
A	isOnQuest	45
S	
A	goto	1429/0,-1233.96,-9224.41
A	turnin	45
A	accept	71
S	
T	loop	
A	line	Elwynn Forest,80.48,55.18,80.88,53.88,79.68,52.31,80.86,52.17,80.88,53.88,80.48,55.18,79.76,56.70,80.15,60.03,80.24,61.46,81.27,61.59,81.58,62.64,82.79,60.12,83.25,61.12,83.48,59.19,81.77,59.17,80.48,55.18
A	goto	1429/0,-1257.91,-9216.77,35,0
A	goto	1429/0,-1271.79,-9186.68,35,0
A	goto	1429/0,-1230.14,-9150.34,35,0
A	goto	1429/0,-1271.10,-9147.10,35,0
A	goto	1429/0,-1271.79,-9186.68,35,0
A	goto	1429/0,-1257.91,-9216.77,35,0
A	goto	1429/0,-1232.92,-9251.950,35,0
A	goto	1429/0,-1246.46,-9329.03,35,0
A	goto	1429/0,-1249.58,-9362.13,35,0
A	goto	1429/0,-1285.33,-9365.14,35,0
A	goto	1429/0,-1296.09,-9389.44,35,0
A	goto	1429/0,-1338.09,-9331.11,35,0
A	goto	1429/0,-1354.05,-9354.26,35,0
A	goto	1429/0,-1362.03,-9309.59,35,0
A	goto	1429/0,-1302.68,-9309.12,35,0
A	goto	1429/0,-1257.91,-9216.77,35,0
A	complete	5545,1
S	
A	goto	1429/0,-1289.22,-9469.80
A	turnin	5545
A	target	Supervisor Raelen
S	
T	label	Bears
A	goto	1429/0,-1222.40,-9531.76
A	accept	83
A	target	Sara Timberlain
S	
A	goto	1429/0,-1069.44,-9618.58,0
A	goto	1429/0,-1063.89,-9494.980,45,0
A	goto	1429/0,-1093.74,-9665.57,45,0
A	goto	1429/0,-1125.32,-9714.41,45,0
A	goto	1429/0,-1215.91,-9778.29,45,0
A	goto	1429/0,-1295.74,-9718.34,45,0
A	goto	1429/0,-1063.89,-9494.980,45,0
A	goto	1429/0,-1093.74,-9665.57,45,0
A	goto	1429/0,-1125.32,-9714.41,45,0
A	goto	1429/0,-1215.91,-9778.29,45,0
A	goto	1429/0,-1295.74,-9718.34
A	complete	52,2
A	complete	52,1
A	unitscan	Young Forest Bear
A	mob	Prowler
S	
A	goto	1429/0,-1032.06,-9610.23
A	turnin	52
A	turnin	71
A	accept	39
A	accept	109
A	target	Guard Thomas
A	xp	<9,1
S	
A	goto	1429/0,-1032.06,-9610.23
A	turnin	52
A	turnin	71
A	accept	39
A	target	Guard Thomas
S	
T	loop	
A	line	Elwynn Forest,70.45,76.94,68.68,76.69,68.23,77.78,67.80,80.76,68.49,82.68,70.71,81.48,70.63,80.66,71.51,78.96,70.95,77.25,71.38,76.77,70.95,77.25,70.45,76.94
A	goto	1429/0,-909.79,-9720.42,40,0
A	goto	1429/0,-848.35,-9714.64,40,0
A	goto	1429/0,-832.73,-9739.87,40,0
A	goto	1429/0,-817.81,-9808.84,40,0
A	goto	1429/0,-841.76,-9853.28,40,0
A	goto	1429/0,-918.81,-9825.51,40,0
A	goto	1429/0,-916.03,-9806.53,40,0
A	goto	1429/0,-946.58,-9767.18,40,0
A	goto	1429/0,-927.14,-9727.60,40,0
A	goto	1429/0,-942.06,-9716.49,40,0
A	goto	1429/0,-927.14,-9727.60,40,0
A	goto	1429/0,-909.79,-9720.42,40,0
A	complete	83,1
A	collect	1972,1,184,1
A	disablecheckbox	
A	mob	Defias Bandit
A	isOnQuest	83
S	
T	label	Deed
A	accept	184
A	itemcount	1972,1
S	
A	goto	1429/0,-890.35,-9780.14
A	complete	88,1
A	mob	Princess
S	
A	goto	1429/0,-1222.40,-9531.76
A	turnin	83
A	target	Sara Timberlain
A	isQuestComplete	83
S	skip
A	goto	1433/0,-1779.67,-9608.23
A	zone	Redridge Mountains
A	isOnQuest	88
S	skip
T	completewith	next
A	mob	Black Dragon Whelp
A	mob	Tarantula
S	skip
A	goto	1433/0,-2234.89,-9435.21
A	fp	Redridge Mountains
A	target	Ariena Stormfeather
S	
T	completewith	next
A	hs	
S	
A	goto	1429/0,33.14,-9460.75
A	turnin	112
A	accept	114
A	target	William Pestle
S	
A	turnin	39
A	turnin	76
A	accept	239
A	accept	109
A	target	+Marshal Dughan
A	goto	1429/0,74.02,-9465.52
A	accept	1097
A	target	+Smith Argus
A	goto	1429/0,87.87,-9456.65
S	
A	goto	1429/0,37.40,-10014.14
A	turnin	114
A	target	Maybell Maclure
S	
A	turnin	88,3
A	target	+Ma Stonefield
A	goto	Elwynn Forest,34.660,84.482
A	turnin	87
A	goto	1429/0,338.47,-9889.69
A	target	+"Auntie" Bernice Stonefield
S	
T	loop	
A	line	Elwynn Forest,31.15,85.36,33.08,86.64,33.51,85.22,32.17,83.88,31.15,85.36
A	goto	1429/0,454.25,-9915.31,35,0
A	goto	1429/0,387.26,-9944.94,35,0
A	goto	1429/0,372.34,-9912.07,35,0
A	goto	1429/0,418.85,-9881.06,35,0
A	goto	1429/0,454.25,-9915.31,35,0
A	xp	9+4825
A	mob	Stonetusk Boar
A	isOnQuest	184
S	
T	loop	
A	line	Elwynn Forest,31.15,85.36,33.08,86.64,33.51,85.22,32.17,83.88,31.15,85.36
A	goto	1429/0,454.25,-9915.31,35,0
A	goto	1429/0,387.26,-9944.94,35,0
A	goto	1429/0,372.34,-9912.07,35,0
A	goto	1429/0,418.85,-9881.06,35,0
A	goto	1429/0,454.25,-9915.31,35,0
A	xp	9+4825
A	mob	Stonetusk Boar
A	itemcount	1972,<1
S	
A	goto	1429/0,694.43,-9662.79
A	turnin	239
A	target	Deputy Rainer
S	
A	accept	64
A	turnin	184
A	target	+Farmer Furlbrow
A	goto	1436/0,918.42,-9851.50
A	accept	36
A	accept	151
A	goto	1436/0,919.82,-9852.90
A	target	+Verna Furlbrow
A	isOnQuest	184
S	
A	accept	64
A	target	+Farmer Furlbrow
A	goto	1436/0,918.42,-9851.50
A	accept	36
A	accept	151
A	target	+Verna Furlbrow
A	goto	1436/0,919.82,-9852.90
S	
T	completewith	next
A	complete	151,1
S	
A	accept	9
A	target	+Farmer Saldean
A	goto	1436/0,1055.27,-10128.70
A	turnin	36
A	accept	38
A	accept	22
A	target	+Salma Saldean
A	goto	1436/0,1041.97,-10112.13
S	
T	completewith	next
A	goto	1436/0,1045.12,-10508.80,20
S	
A	turnin	109
A	accept	12
A	target	+Gryan Stoutmantle
A	goto	1436/0,1045.12,-10508.80
A	accept	102
A	target	+Captain Danuvin
A	goto	1436/0,1041.97,-10511.13
A	accept	6181
A	goto	1436/0,1021.60,-10500.61
A	target	+Quartermaster Lewis
S	
A	goto	1436/0,1037.07,-10628.27
A	turnin	6181
A	accept	6281
A	target	Thor
S	
T	completewith	next
A	goto	1436/0,1037.07,-10628.27
A	fly	Stormwind
A	target	Thor
S	
T	completewith	next
A	goto	1453/0,532.74,-8863.09,20,0
A	goto	1453/0,599.55,-8811.28,20,0
A	goto	1453/0,613.93,-8833.07,20,0
A	goto	1453/0,620.79,-8859.6,12,0
A	goto	1453/0,625.49,-8857.89,12
S	
A	goto	1453/0,625.49,-8857.890
A	turnin	61,1
A	target	Morgan Pestle
S	
A	goto	1453/0,635.44,-8863.81
A	vendor	1257
A	target	Keldric Boucher
S	skip
T	completewith	next
A	goto	1453/0,686.25,-8815.41,8,0
A	goto	1453/0,684.24,-8820.34,4,0
A	goto	1453/0,687.46,-8818.01,6,0
A	goto	1453/0,854.42,-8965.28,12,0
A	goto	1453/0,861.95,-8990.47,10
S	skip
A	goto	1453/0,861.95,-8990.47
A	trainer	
A	target	Jennea Cannon
S	skip
T	completewith	next
A	goto	1453/0,893.0,-9021.93,6
S	
T	completewith	next
A	goto	1453/0,610.44,-8809.04,10,0
A	goto	1453/0,599.01,-8797.84,12,0
A	goto	1453/0,603.85,-8769.42,12,0
A	goto	1453/0,573.74,-8741.37,12,0
A	goto	1453/0,473.05,-8699.06,12,0
A	goto	1453/0,426.4,-8714.66,12,0
A	goto	1453/0,382.04,-8702.11,12
S	
A	goto	1453/0,382.04,-8702.11
A	turnin	6281
A	accept	6261
A	target	Osric Strang
S	
T	completewith	next
A	goto	1453/0,450.74,-8644.11,15,0
A	goto	1453/0,479.91,-8639.81,15,0
A	goto	1453/0,514.05,-8608.26,15,0
A	goto	1453/0,507.6,-8541.66,15,0
A	goto	1453/0,683.43,-8397.08,12,0
A	goto	1453/0,685.18,-8387.13,12
S	
A	goto	1453/0,685.18,-8387.13
A	turnin	1097
A	accept	353
A	target	Grimand Elmore
S	
A	goto	1453/0,638.26,-8342.22
A	vendor	5519
A	target	Billibub Cogspinner
A	itemcount	4371,<1
A	money	<0.08
S	
T	completewith	next
A	goto	1453/0,522.12,-8352.80,20
S	
T	completewith	next
S	
T	label	Monty
A	goto	1455/0,-1317.71,-4839.48,30,0
A	accept	6661
A	target	Monty
S	
A	complete	6661,1
A	target	Deeprun Rat
A	use	17117
S	
A	turnin	6661
A	target	Monty
A	zoneskip	Stormwind City
S	
A	zone	Ironforge
A	isQuestAvailable	314
S	
A	goto	1455/0,-1249.87,-4793.31
A	vendor	5175
A	target	Gearcutter Cogspinner
A	itemcount	4371,<1
A	isQuestAvailable	174
S	
T	completewith	next
A	goto	1455/0,-1266.48,-4749.31,30,0
A	goto	1455/0,-1211.92,-4728.00,30,0
A	goto	1455/0,-1170.41,-4754.48,30,0
A	goto	1455/0,-1152.31,-4821.12,10
S	
A	goto	1455/0,-1152.39,-4820.914
A	fp	Ironforge
A	target	Gryth Thurden
S	
T	completewith	next
A	goto	1455/0,-1101.87,-4864.81,30,0
A	goto	1455/0,-1062.10,-4815.100,20,0
A	goto	1455/0,-1036.48,-4804.50,20,0
A	goto	1455/0,-992.68,-4742.08,20,0
A	goto	1455/0,-931.8,-4627.59,20,0
A	goto	1455/0,-928.40,-4614.51,10
S	
A	goto	1455/0,-928.40,-4614.51
A	trainer	
A	target	Dink
S	
T	completewith	next
A	goto	1455/0,-929.04,-4636.72,20,0
A	goto	1455/0,-892.19,-4770.42,20,0
A	goto	1455/0,-874.88,-4849.87,20,0
A	goto	1455/0,-857.01,-4840.69,10
S	
T	label	IFHS
A	goto	1455/0,-857.01,-4840.69
A	home	
A	target	Innkeeper Firebrew
S	
T	completewith	BankDeposit
A	goto	1455/0,-974.89,-4902.21,20,0
A	goto	1455/0,-997.66,-4886.49,30
S	
A	goto	1455/0,-997.66,-4886.49
A	bankdeposit	4371,16115
A	target	Bailey Stonemantle
S	skip
A	goto	1455/0,-1000.98,-4874.62
A	goto	1426/0,-809.64,-5049.56,10
A	isQuestAvailable	314
S	
A	goto	1455/0,-833.45,-5021.400,20,0
A	goto	1426/0,-1145.04,-5504.30
A	zone	Dun Morogh
E
G	Guides/forever/Alliance-ADV-AoE-Mage-1-22.lua
M	classic	
M	tbc	
M	selector	Human Mage
M	name	10-11 ADV Dun Morogh Human Mage AoE
M	version	2
M	group	RestedXP ADV AoE Alliance Mage
M	defaultfor	Human Mage
M	next	10-12 ADV Darkshore 1 Mage AoE
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
A	mob	Vagash
S	
T	label	Rudra
A	goto	1426/0,-1304.61,-5513.82
A	accept	314
A	target	Rudra Amberstill
S	
A	goto	1426/0,-1279.49,-5392.01,0
A	goto	1426/0,-1289.83,-5669.780,40,0
A	goto	1426/0,-1291.80,-5706.89
A	complete	314,1
A	mob	Vagash
S	
A	goto	1426/0,-1304.61,-5513.82
A	turnin	314,3
A	target	Rudra Amberstill
S	
T	completewith	Ghilm
S	
T	completewith	next
A	goto	1426/0,-1465.16,-5548.96,50,0
A	goto	1426/0,-1533.13,-5638.92,30,0
A	mob	Ice Claw Bear
S	
T	sticky	
T	label	Ghilm
A	goto	1426/0,-1566.62,-5664.86,0,0
A	train	2550
A	target	Cook Ghilm
S	
A	goto	1426/0,-1568.09,-5665.19,8,0
A	goto	1426/0,-1573.02,-5671.10
A	collect	1179,15,432,1
A	target	Kazan Mogosh
A	money	<0.0395
S	
A	goto	1426/0,-1568.09,-5665.19,8,0
A	goto	1426/0,-1573.02,-5671.10
A	collect	1179,10,432,1
A	target	Kazan Mogosh
A	money	<0.0260
S	
A	goto	1426/0,-1568.09,-5665.19,8,0
A	goto	1426/0,-1573.02,-5671.10
A	collect	1179,5,432,1
A	target	Kazan Mogosh
A	money	<0.0135
S	
T	requires	Ghilm
A	accept	433
A	target	+Senator Mehr Stonehallow
A	goto	1426/0,-1579.91,-5714.77
A	accept	432
A	goto	1426/0,-1600.30,-5726.590
A	target	+Foreman Stonebrow
S	
T	completewith	Bonesnappers
A	complete	432,1
A	mob	Rockjaw Skullthumper
S	
T	completewith	next
A	goto	1426/0,-1681.86,-5723.30,30
S	
T	label	Bonesnappers
A	goto	1426/0,-1693.68,-5660.26,40,0
A	goto	1426/0,-1686.29,-5622.83,40,0
A	goto	1426/0,-1740.96,-5534.51,40,0
A	goto	1426/0,-1771.00,-5568.000,40,0
A	goto	1426/0,-1774.45,-5602.80
A	complete	433,1
A	mob	Rockjaw Bonesnapper
S	
A	goto	1426/0,-1681.86,-5723.30,30,0
T	loop	
A	line	Dun Morogh,69.93,57.29,70.57,58.61,69.68,59.37,68.36,59.57,69.16,57.51,69.93,57.29
A	goto	1426/0,-1641.97,-5758.11,30,0
A	goto	1426/0,-1673.49,-5801.45,30,0
A	goto	1426/0,-1629.66,-5826.40,30,0
A	goto	1426/0,-1564.65,-5832.97,30,0
A	goto	1426/0,-1604.05,-5765.33,30,0
A	goto	1426/0,-1641.97,-5758.11,30,0
A	complete	432,1
A	mob	Rockjaw Skullthumper
S	
T	sticky	
T	label	Frast
A	goto	1426/0,-1589.76,-5714.44,0,0
A	vendor	
A	target	Frast Dokner
A	isQuestAvailable	419
S	
A	turnin	432
A	target	+Foreman Stonebrow
A	goto	1426/0,-1600.30,-5726.590
A	turnin	433
A	goto	1426/0,-1579.91,-5714.77
A	target	+Senator Mehr Stonehallow
S	
T	requires	Frast
A	goto	1426/0,-1612.42,-5698.02
A	train	2575
A	target	Dank Drizzlecut
S	
T	label	Shortcut1
T	completewith	Pilot
A	goto	1426/0,-1662.65,-5692.11,5,0
A	link	https://youtu.be/G2IscpFZVeQ?t=4034
A	goto	1426/0,-1671.03,-5674.71,12
S	
T	completewith	Pilot
T	requires	Shortcut1
T	label	Shortcut2
A	goto	1426/0,-1693.19,-5541.730,50,0
A	goto	1426/0,-1788.24,-5511.85,50,0
A	goto	1426/0,-1995.58,-5480.01,50
A	mob	Rockjaw Ambusher
A	unitscan	Ironforge Mountaineer
S	
T	requires	Shortcut2
T	completewith	next
A	goto	1426/0,-2198.49,-5277.75,50,0
A	goto	1426/0,-2286.16,-5200.59,30
A	mob	Scarred Crag Boar
S	
T	label	Pilot
A	goto	1426/0,-2329.50,-5163.82
A	accept	419
A	target	Pilot Hammerfoot
S	
A	goto	1426/0,-2205.39,-5092.57,30,0
A	goto	1426/0,-2121.66,-5064.66
A	turnin	419
A	accept	417
S	
A	goto	1426/0,-2059.61,-5118.180,60,0
A	goto	1426/0,-2329.50,-5163.82
A	complete	417,1
A	mob	Mangeclaw
A	target	Pilot Hammerfoot
S	
A	goto	1426/0,-2329.60,-5163.76
A	turnin	417,1
A	target	Pilot Hammerfoot
S	
T	label	Tunnel1
T	completewith	Barleybrew
A	goto	1426/0,-2286.16,-5200.59,30,0
A	goto	1426/0,-2198.49,-5277.75,30
S	
T	requires	Tunnel1
T	completewith	Barleybrew
A	goto	1426/0,-2118.71,-5516.78,20,0
A	goto	1426/0,-2192.09,-5510.87,20,0
A	goto	1426/0,-2216.72,-5519.08,20,0
A	goto	1426/0,-2314.72,-5491.83,20,0
A	goto	1426/0,-2347.72,-5483.62,20
A	mob	Scarred Crag Boar
S	
A	goto	1432/0,-2518.11,-5625.83
A	zone	Loch Modan
A	mob	Scarred Crag Boar
S	
T	completewith	Rugelfuss
A	collect	3173,3,418,1
A	disablecheckbox	
A	collect	3174,3,418,1
A	disablecheckbox	
A	mob	Elder Black Bear
A	mob	Forest Lurker
S	
T	label	Cobbleflint
A	goto	1432/0,-2602.54,-5832.73
A	accept	224
A	target	Mountaineer Cobbleflint
S	
T	optional	
T	completewith	next
A	goto	1432/0,-2635.61,-5879.14,12,0
A	goto	1432/0,-2645.27,-5874.91,12,0
A	goto	1432/0,-2631.48,-5847.50,12
S	
T	label	Rugelfuss
A	goto	1432/0,-2634.59,-5842.81
A	accept	267
A	target	Captain Rugelfuss
S	skip
T	completewith	next
A	goto	1432/0,-2586.52,-5740.99,20,0
A	goto	1432/0,-2569.14,-5673.30,20,0
A	goto	1432/0,-2531.62,-5638.34,30
S	skip
A	goto	1432/0,-2513.42,-5618.48
A	link	https://www.youtube.com/watch?v=AOAlX9B5aO0
A	goto	1432/0,-2881.66,-5351.18,30
A	isOnQuest	267
S	
T	completewith	next
A	subzone	144
S	
A	goto	1432/0,-2902.07,-5398.28,40,0
A	goto	1432/0,-2945.10,-5360.20,40,0
A	goto	1432/0,-3015.71,-5335.73,40,0
A	goto	1432/0,-3025.09,-5318.44,40,0
A	goto	1432/0,-3017.64,-5274.66
A	accept	416
A	accept	1339
A	target	Mountaineer Kadrell
S	
T	completewith	next
A	goto	1432/0,-2929.93,-5424.95
A	fp	Thelsamar
A	fly	Ironforge
A	target	Thorgrum Borrelson
S	
A	zone	Ironforge
A	isOnQuest	416
S	skip
T	completewith	next
A	goto	1455/0,-1060.12,-4883.59,20,0
A	goto	1455/0,-1016.16,-4946.11,20,0
A	goto	1455/0,-980.03,-4971.49,10
S	skip
A	goto	1455/0,-980.03,-4971.49
A	zone	Dun Morogh
A	isOnQuest	416
E
G	Guides/forever/Alliance-ADV-AoE-Mage-1-22.lua
M	classic	
M	tbc	
M	selector	Gnome Mage
M	name	1-10 ADV Dun Morogh Gnome Mage AoE
M	version	2
M	group	RestedXP ADV AoE Alliance Mage
M	defaultfor	Gnome Mage
M	next	10-12 ADV Darkshore 1 Mage AoE
S	!Gnome Mage
T	season	2
T	completewith	next
S	
T	completewith	next
S	
T	completewith	Adlin
A	destroy	6948
S	
A	goto	1426/0,328.18,-6214.85
A	accept	179
A	target	Sten Stoutarm
S	
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
T	season	0
T	sticky	
T	label	Adlin
A	goto	1426/0,320.30,-6226.74
A	collect	159,15
A	target	Adlin Pridedrift
A	xp	>6,1
S	
T	season	2
A	goto	1426/0,320.30,-6226.74
A	collect	159,15
A	target	Adlin Pridedrift
A	xp	>6,1
S	
T	xprate	<1.1
A	turnin	179,3
A	accept	233
A	accept	3114
A	target	+Sten Stoutarm
A	goto	1426/0,328.18,-6214.85
A	accept	170
A	goto	1426/0,338.87,-6216.46
A	target	+Balir Frosthammer
S	
T	xprate	>1.09
A	goto	1426/0,328.18,-6214.85
A	turnin	179,3
A	accept	233
A	accept	3114
A	target	Sten Stoutarm
S	
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
A	isOnQuest	170
S	
T	season	2
A	goto	1426/0,485.48,-6259.21
A	collect	203751,1,77667,1
A	train	401760,1
S	Gnome
T	season	2
A	train	401760
A	use	203751
A	itemcount	203751,1
S	
T	season	2
T	label	EnterAnvilmar
T	optional	
T	completewith	next
A	goto	1426,28.792,68.804,12,0
A	goto	1426,28.642,68.375,12
S	
T	season	2
A	goto	1426/0,388.17,-6056.10
A	turnin	3114
A	accept	77667
A	turnin	77667
A	train	1459
A	target	Marryk Nurribit
S	Gnome
T	season	2
T	label	GlovesEquip
T	completewith	Observations
A	equip	10,711
A	use	711
A	train	401760,1
S	Gnome
T	season	2
T	requires	GlovesEquip
T	completewith	Observations
A	engrave	10
A	train	401760,1
S	
T	season	2
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
A	isOnQuest	170
S	
T	label	Talin
A	goto	1426/0,688.98,-6222.47
A	turnin	233
A	accept	183
A	accept	234
A	target	Talin Keeneye
S	
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
A	goto	1426/0,688.98,-6222.47
A	turnin	183
A	target	Talin Keeneye
S	
T	label	Rockjaw
A	goto	1426,25.077,75.711
A	turnin	234
A	accept	182
A	target	Grelin Whitebeard
S	
T	completewith	next
A	complete	182,1
A	mob	Frostmane Troll Whelp
S	
A	goto	1426/0,485.63,-6494.56,30
A	isOnQuest	182
S	
A	goto	1426/0,457.56,-6531.66,20,0
A	goto	1426/0,408.80,-6498.83,20,0
A	goto	1426/0,357.09,-6473.87,30,0
A	goto	1426/0,408.80,-6498.83,20,0
A	goto	1426/0,457.56,-6531.66,20,0
A	goto	1426/0,408.80,-6498.83,20,0
A	goto	1426/0,357.09,-6473.87,30,0
A	goto	1426/0,408.80,-6498.83,20,0
A	goto	1426/0,457.56,-6531.66,20,0
A	goto	1426/0,408.80,-6498.83,20,0
A	goto	1426/0,357.09,-6473.87,30,0
A	goto	1426/0,408.80,-6498.83
A	complete	182,1,10
A	mob	Frostmane Troll Whelp
S	
A	goto	1426/0,408.80,-6498.83,50,0
A	goto	1426/0,457.56,-6531.66,40,0
A	goto	1426/0,532.42,-6448.26,40,0
A	goto	1426/0,466.42,-6460.41,40,0
A	goto	1426/0,524.05,-6516.56,40,0
A	goto	1426/0,532.42,-6448.26
A	complete	182,1
A	mob	Frostmane Troll Whelp
S	skip
T	completewith	next
A	link	https://www.youtube.com/watch?v=SWBtPqm5M0Q
S	skip
A	turnin	182,4
A	accept	218
A	goto	1426/0,567.09,-6362.99,-1
A	target	+Grelin Whitebeard
A	accept	3364
A	goto	1426/0,571.82,-6371.10,-1
A	target	+Nori Pridedrift
S	
A	turnin	182,4
A	accept	218
A	goto	1426/0,567.09,-6362.99
A	target	+Grelin Whitebeard
S	
A	goto	1426/0,485.63,-6494.56,40,0
A	goto	1426/0,357.09,-6473.87,30,0
A	goto	1426/0,340.84,-6493.24,10
A	isOnQuest	218
S	
A	goto	1426/0,300.94,-6509.00
A	complete	218,1
A	mob	Grik'nir the Cold
S	skip
T	completewith	Rybrad
T	label	LogoutSkip1
A	goto	1426/0,342.81,-6487.330
A	goto	1426/0,336.40,-6164.25,30
A	isOnQuest	218
S	
A	turnin	218
A	accept	282
A	goto	1426/0,567.09,-6362.99,-1
A	target	+Grelin Whitebeard
A	accept	3364
A	goto	1426/0,571.82,-6371.10,-1
A	target	+Nori Pridedrift
S	
T	completewith	Rybrad
T	requires	LogoutSkip1
T	label	LogoutSkip2
A	goto	1426/0,384.18,-6143.90,20,0
A	goto	1426/0,392.06,-6123.87,10
A	isOnQuest	218,3364
S	
T	label	Rybrad
A	goto	1426/0,390.58,-6101.21
A	vendor	
A	target	Rybrad Coldbank
A	isOnQuest	218,3364
S	
A	turnin	3364
A	accept	3365
A	goto	1426/0,385.16,-6056.23
A	target	+Durnan Furcutter
A	turnin	3114
A	trainer	
A	goto	1426/0,388.17,-6056.10
A	target	+Marryk Nurribit
A	isQuestAvailable	420
S	
T	optional	
T	xprate	<1.1
A	goto	1426/0,338.87,-6216.46
A	turnin	170,3
A	target	Balir Frosthammer
A	isQuestComplete	170
S	
T	xprate	<1.1
T	sticky	
T	label	TroggEnd
A	goto	1426,27.858,76.482,0
A	goto	1426,30.727,76.831,0
A	goto	1426,29.280,75.500,0
A	waypoint	1426,27.858,76.482,50,0
A	waypoint	1426,28.946,77.153,50,0
A	waypoint	1426,29.716,77.605,50,0
A	waypoint	1426,30.727,76.831,50,0
A	waypoint	1426,32.814,75.221,50,0
A	waypoint	1426,31.138,74.048,50,0
A	waypoint	1426,30.077,74.479,50,0
A	waypoint	1426,29.280,75.500,50,0
A	complete	170,1
A	mob	+Rockjaw Trogg
A	complete	170,2
A	mob	+Burly Rockjaw Trogg
A	isOnQuest	170
S	
T	label	StolenJ
A	turnin	3365
A	goto	1426/0,571.82,-6371.10
A	target	+Nori Pridedrift
S	
T	xprate	<1.1
T	requires	TroggEnd
A	goto	1426/0,338.87,-6216.46
A	turnin	170,3
A	target	Balir Frosthammer
A	isQuestComplete	170
S	
T	requires	TroggEnd
T	label	Observations
A	turnin	282
A	accept	420
A	goto	1426/0,153.00,-6235.86
A	target	+Mountaineer Thalos
A	accept	2160
A	goto	1426/0,134.97,-6248.96
A	target	+Hands Springsprocket
S	
T	xprate	<1.1
T	optional	
T	completewith	StockingJ
A	abandon	170
S	
A	goto	1426/0,111.82,-6206.61,15,0
A	goto	1426/0,46.32,-6037.19,15
A	subzoneskip	800,1
A	isOnQuest	2160
S	
T	completewith	StockingJ
A	goto	1426/0,3.97,-5943.61,40,0
A	collect	769,4,317,1
A	collect	2886,6,384,1
A	mob	Crag Boar
S	
A	goto	1426/0,-67.94,-5908.48,30,0
A	goto	1426/0,-162.50,-5822.79,45
A	mob	Juvenile Snow Leopard
A	mob	Young Black Bear
A	target	Ironforge Mountaineer
A	isOnQuest	2160
S	
T	completewith	next
A	goto	1426/0,-337.34,-5703.93,50,0
A	goto	1426/0,-371.81,-5605.43,50,0
A	goto	1426/0,-464.45,-5573.78,20
S	
A	goto	1426/0,-464.45,-5573.78
A	accept	400
A	target	Tharek Blackstone
S	
T	label	StockingJ
A	goto	1426/0,-632.15,-5466.540
A	accept	317
A	mob	Young Black Bear
A	target	Pilot Bellowfiz
S	
A	accept	313
A	target	+Pilot Stonegear
A	goto	1426/0,-641.80,-5473.18
A	turnin	400
A	target	+Beldin Steelgrill
A	goto	1426/0,-682.58,-5488.87
A	accept	5541
A	vendor	
A	goto	1426/0,-664.55,-5499.710
A	target	+Loslor Rudge
A	isQuestAvailable	312
S	
T	completewith	next
A	complete	317,1
A	collect	2886,6,384,1
A	mob	Crag Boar
A	mob	Large Crag Boar
S	
A	goto	1426/0,-679.62,-5573.58,50,0
A	goto	1426/0,-678.64,-5618.89,50,0
A	goto	1426/0,-620.03,-5550.60,50,0
A	goto	1426/0,-432.39,-5502.330,50,0
A	goto	1426/0,-349.65,-5586.06,50,0
A	goto	1426/0,-423.03,-5662.56,50,0
A	goto	1426/0,-422.05,-5775.18,50,0
A	goto	1426/0,-679.62,-5573.58,50,0
A	goto	1426/0,-678.64,-5618.89,50,0
A	goto	1426/0,-620.03,-5550.60,50,0
A	goto	1426/0,-432.39,-5502.330,50,0
A	goto	1426/0,-349.65,-5586.06,50,0
A	goto	1426/0,-423.03,-5662.56,50,0
A	goto	1426/0,-422.05,-5775.18,50,0
A	goto	1426/0,-679.62,-5573.58,50,0
A	goto	1426/0,-678.64,-5618.89,50,0
A	goto	1426/0,-620.03,-5550.60,50,0
A	goto	1426/0,-432.39,-5502.330,50,0
A	goto	1426/0,-349.65,-5586.06,50,0
A	goto	1426/0,-423.03,-5662.56
A	complete	317,2
A	mob	Young Black Bear
A	mob	Ice Claw Bear
S	
T	loop	
A	line	Dun Morogh,51.70,49.66,51.08,52.42,51.43,53.21,50.06,51.66,49.56,50.82,48.12,49.10,48.21,46.93,45.48,50.04,44.07,52.50,43.69,55.59,42.78,56.86,44.45,59.33,46.31,61.85,46.26,59.49,48.08,59.05,49.40,58.97,48.30,56.86,49.09,54.74,49.61,54.32,51.43,53.21
A	goto	1426/0,-744.14,-5507.59,40,0
A	goto	1426/0,-713.61,-5598.21,40,0
A	goto	1426/0,-730.84,-5624.15,40,0
A	goto	1426/0,-663.37,-5573.25,40,0
A	goto	1426/0,-638.75,-5545.67,40,0
A	goto	1426/0,-567.83,-5489.200,40,0
A	goto	1426/0,-572.26,-5417.95,40,0
A	goto	1426/0,-437.81,-5520.06,40,0
A	goto	1426/0,-368.36,-5600.830,40,0
A	goto	1426/0,-349.65,-5702.29,40,0
A	goto	1426/0,-304.83,-5743.99,40,0
A	goto	1426/0,-387.08,-5825.09,40,0
A	goto	1426/0,-478.68,-5907.83,40,0
A	goto	1426/0,-476.22,-5830.34,40,0
A	goto	1426/0,-565.86,-5815.89,40,0
A	goto	1426/0,-630.87,-5813.27,40,0
A	goto	1426/0,-576.69,-5743.99,40,0
A	goto	1426/0,-615.60,-5674.38,40,0
A	goto	1426/0,-641.21,-5660.59,40,0
A	goto	1426/0,-730.84,-5624.15,40,0
A	complete	317,1
A	collect	2886,6,384,1
A	disablecheckbox	
A	mob	Crag Boar
A	mob	Large Crag Boar
S	
A	goto	1426/0,-632.15,-5466.540
A	turnin	317
A	accept	318
A	target	Pilot Bellowfiz
S	
T	loop	
A	line	Dun Morogh,51.70,49.66,51.08,52.42,51.43,53.21,50.06,51.66,49.56,50.82,48.12,49.10,48.21,46.93,45.48,50.04,44.07,52.50,43.69,55.59,42.78,56.86,44.45,59.33,46.31,61.85,46.26,59.49,48.08,59.05,49.40,58.97,48.30,56.86,49.09,54.74,49.61,54.32,51.43,53.21
A	goto	1426/0,-744.14,-5507.59,40,0
A	goto	1426/0,-713.61,-5598.21,40,0
A	goto	1426/0,-730.84,-5624.15,40,0
A	goto	1426/0,-663.37,-5573.25,40,0
A	goto	1426/0,-638.75,-5545.67,40,0
A	goto	1426/0,-567.83,-5489.200,40,0
A	goto	1426/0,-572.26,-5417.95,40,0
A	goto	1426/0,-437.81,-5520.06,40,0
A	goto	1426/0,-368.36,-5600.830,40,0
A	goto	1426/0,-349.65,-5702.29,40,0
A	goto	1426/0,-304.83,-5743.99,40,0
A	goto	1426/0,-387.08,-5825.09,40,0
A	goto	1426/0,-478.68,-5907.83,40,0
A	goto	1426/0,-476.22,-5830.34,40,0
A	goto	1426/0,-565.86,-5815.89,40,0
A	goto	1426/0,-630.87,-5813.27,40,0
A	goto	1426/0,-576.69,-5743.99,40,0
A	goto	1426/0,-615.60,-5674.38,40,0
A	goto	1426/0,-641.21,-5660.59,40,0
A	goto	1426/0,-730.84,-5624.15,40,0
A	xp	5+2690
A	mob	Young Black Bear
A	mob	Crag Boar
S	
T	completewith	InnLS1
S	
T	completewith	Tannok
A	cast	1459
A	cast	168
S	
A	goto	1426/0,-504.29,-5596.24
A	accept	384
A	target	Ragnar Thunderbrew
S	
T	completewith	next
A	goto	1426/0,-511.19,-5584.09,10,0
A	goto	1426/0,-537.29,-5587.04,12
S	
A	goto	1426/0,-523.35,-5590.82
A	turnin	2160,2
A	target	Tannok Frosthammer
A	xp	>6,1
S	
T	completewith	next
A	goto	1426/0,-511.19,-5584.09,10,0
A	goto	1426/0,-537.29,-5587.04,12
S	
T	sticky	
T	label	Tannok
A	goto	1426/0,-523.35,-5590.82,0,0
A	turnin	2160,2
A	target	Tannok Frosthammer
S	
A	goto	1426/0,-537.29,-5587.04
A	trainer	
A	target	Magis Sparkmantle
A	isQuestAvailable	312
S	
T	completewith	Golorn
A	goto	1426/0,-531.38,-5601.49
A	home	
A	target	Innkeeper Belm
A	isQuestAvailable	312
S	
T	requires	Tannok
A	goto	1426/0,-531.38,-5601.49
A	complete	384,2
A	target	Innkeeper Belm
A	itemcount	2886,6
A	money	<0.0050
S	
T	requires	Tannok
A	goto	1426/0,-504.29,-5596.24
A	turnin	384
A	target	Ragnar Thunderbrew
A	isQuestComplete	384
S	
T	requires	Tannok
A	goto	1426/0,-531.38,-5601.49
A	collect	1179,20,312,1
A	target	Innkeeper Belm
A	money	<0.0582
S	
T	requires	Tannok
A	goto	1426/0,-531.38,-5601.49
A	collect	1179,15,312,1
A	target	Innkeeper Belm
A	money	<0.0457
S	
T	requires	Tannok
A	goto	1426/0,-531.38,-5601.49
A	collect	1179,10,312,1
A	target	Innkeeper Belm
A	money	<0.0332
S	
T	label	InnLS1
T	requires	Tannok
A	goto	1426/0,-531.38,-5601.49
A	collect	1179,5,312,1
A	target	Innkeeper Belm
A	money	<0.0207
S	
T	requires	Tannok
A	goto	1426/0,-531.38,-5601.49
A	collect	159,20,312,1
A	itemcount	1179,<1
A	target	Innkeeper Belm
A	money	<0.0182
S	
T	requires	Tannok
A	goto	1426/0,-531.38,-5601.49
A	collect	159,15,312,1
A	itemcount	1179,<1
A	target	Innkeeper Belm
A	money	<0.0157
S	
T	requires	Tannok
A	goto	1426/0,-531.38,-5601.49
A	collect	159,10,312,1
A	itemcount	1179,<1
A	target	Innkeeper Belm
A	money	<0.0132
S	
T	requires	Tannok
A	goto	1426/0,-531.38,-5601.49
A	collect	159,5,312,1
A	itemcount	1179,<1
A	target	Innkeeper Belm
A	money	<0.0107
S	skip
T	completewith	SenirO
A	goto	1426/0,-535.32,-5604.120,-1
A	goto	1426/0,-519.07,-5679.96,35
S	
T	sticky	
T	label	Golorn
A	goto	1426/0,-501.34,-5640.89,-1
A	collect	7005,1,312,1
A	target	Golorn Frostbeard
S	
T	label	SenirO
A	goto	1426/0,-499.17,-5644.37,-1
A	turnin	420
A	target	Senir Whitebeard
S	
T	completewith	next
T	requires	Golorn
A	use	7005
A	itemcount	7005,1
A	itemStat	16,QUALITY,<7
A	itemStat	16,ITEM_MOD_DAMAGE_PER_SECOND_SHORT,<2.2
S	
T	requires	Golorn
T	loop	
A	line	Dun Morogh,42.57,54.80,41.89,54.51,42.13,52.68,42.46,51.96,41.91,51.43,42.46,51.96,42.13,52.68,42.57,54.80
A	goto	1426/0,-294.49,-5676.350,10,0
A	goto	1426/0,-261.00,-5666.83,10,0
A	goto	1426/0,-272.82,-5606.74,10,0
A	goto	1426/0,-289.07,-5583.10,10,0
A	goto	1426/0,-261.98,-5565.70,10,0
A	goto	1426/0,-289.07,-5583.10,10,0
A	goto	1426/0,-272.82,-5606.74,10,0
A	goto	1426/0,-294.49,-5676.350,10,0
A	complete	313,1
A	mob	Young Wendigo
A	mob	Wendigo
S	
A	goto	1426/0,-371.32,-5746.94
A	complete	5541,1
S	
T	completewith	Ammo
A	goto	1426/0,-197.47,-5920.63,45,0
A	complete	384,1
A	disablecheckbox	
A	goto	1426/0,-201.51,-6015.520,20
A	mob	Crag Boar
A	mob	Juvenile Snow Leopard
A	xp	>7-1000,1
A	isQuestAvailable	384
S	
T	completewith	Ammo
A	goto	1426/0,-197.47,-5920.63,45,0
A	goto	1426/0,-201.51,-6015.520,20
A	mob	Crag Boar
A	mob	Juvenile Snow Leopard
A	xp	>7-1000,1
A	isQuestTurnedIn	384
S	
T	completewith	next
A	goto	1426/0,-197.47,-5920.63,45,0
A	goto	1426/0,-201.51,-6015.520,20
A	xp	<7-1000,1
S	
T	label	Ammo
A	goto	1426/0,-201.51,-6015.520
A	turnin	5541
A	vendor	
A	target	Hegnar Rumbleshot
A	isQuestAvailable	312
S	
T	completewith	TundraOne
A	goto	1426/0,-68.43,-5909.470,50,0
A	goto	1426/0,72.92,-5741.36,45,0
A	goto	1426/0,47.80,-5674.05,50,0
A	goto	1426/0,10.37,-5600.51,40,0
A	complete	384,1
A	disablecheckbox	
A	xp	7
A	target	Ironforge Mountaineer
A	mob	Crag Boar
A	mob	Juvenile Snow Leopard
A	isQuestAvailable	384
S	
T	completewith	next
A	goto	1426/0,-68.43,-5909.470,50,0
A	goto	1426/0,72.92,-5741.36,45,0
A	goto	1426/0,47.80,-5674.05,50,0
A	goto	1426/0,10.37,-5600.51,40,0
A	xp	7
A	target	Ironforge Mountaineer
A	mob	Crag Boar
A	mob	Juvenile Snow Leopard
A	isQuestTurnedIn	384
S	
T	label	TundraOne
A	goto	1426/0,99.51,-5573.25
A	accept	312
A	target	Tundra MacGrann
S	
T	completewith	next
A	mob	Ice Claw Bear
S	
A	turnin	318
A	accept	319
A	accept	315
A	target	+Rejold Barleybrew
A	goto	1426/0,315.23,-5378.55
A	accept	310
A	goto	1426/0,315.42,-5372.02
A	target	+Marleth Barleybrew
S	
A	goto	1426/0,302.42,-5387.74,0,0
A	vendor	
A	collect	1179,10,312,1
A	target	Keeg Gibn
A	itemcount	1179,10
A	money	<0.0350
A	isOnQuest	319
S	
A	goto	1426/0,302.42,-5387.74,0,0
A	vendor	
A	collect	1179,5,312,1
A	target	Keeg Gibn
A	itemcount	1179,5
A	money	<0.0225
A	isOnQuest	319
S	
T	completewith	CaveLS
A	goto	1426/0,151.72,-5436.670,50,0
A	goto	1426/0,-12.78,-5370.34,50,0
A	complete	319,1
A	mob	+Ice Claw Bear
A	complete	319,2
A	mob	+Elder Crag Boar
A	complete	319,3
A	mob	+Snow Leopard
A	complete	384,1
A	mob	+Elder Crag Boar
A	isQuestAvailable	384
S	
T	completewith	CaveLS
A	goto	1426/0,151.72,-5436.670,50,0
A	goto	1426/0,-12.78,-5370.34,50,0
A	complete	319,1
A	mob	+Ice Claw Bear
A	complete	319,2
A	mob	+Elder Crag Boar
A	complete	319,3
A	mob	+Snow Leopard
A	isQuestTurnedIn	384
S	skip
T	completewith	next
A	goto	1426/0,-69.42,-5281.36,30
A	isOnQuest	319
S	skip
T	label	CaveLS
A	goto	1426/0,-85.18,-5300.74
A	goto	1426/0,-519.07,-5679.96,30
A	isOnQuest	319
S	
A	goto	1426/0,-499.17,-5644.37
A	accept	287
A	target	Senir Whitebeard
S	
T	completewith	Rhapsody1
A	goto	1426/0,-511.19,-5584.09,10,0
A	goto	1426/0,-522.02,-5585.07,12
S	
A	goto	1426/0,-531.38,-5601.49
A	complete	384,2
A	collect	2686,1,311,1
A	target	Innkeeper Belm
A	itemcount	2886,6
A	isQuestAvailable	384
S	
T	label	Rhapsody1
A	goto	1426/0,-531.38,-5601.49
A	collect	2686,1,311,1
A	target	Innkeeper Belm
A	itemcount	2886,<6
S	
T	completewith	next
A	goto	1426/0,-537.29,-5597.55,8,0
A	goto	1426/0,-548.13,-5598.54,8
S	
T	completewith	next
A	goto	1426/0,-544.68,-5606.09
A	turnin	308
A	target	Jarven Thunderbrew
S	
A	goto	1426/0,-548.13,-5607.400
A	turnin	310
A	accept	311
S	
A	goto	1426/0,-531.38,-5601.49
A	collect	1179,10,312,1
A	target	Innkeeper Belm
A	money	<0.0250
S	
A	goto	1426/0,-531.38,-5601.49
A	collect	1179,5,312,1
A	target	Innkeeper Belm
A	money	<0.0125
S	
A	goto	1426/0,-522.02,-5585.07,12,0
A	goto	1426/0,-511.19,-5584.09,10,0
A	goto	1426/0,-504.29,-5596.24,20
A	isOnQuest	287
S	
A	goto	1426/0,-504.29,-5596.24
A	turnin	384
A	target	Ragnar Thunderbrew
A	isQuestComplete	384
S	
T	completewith	next
A	goto	1426/0,-495.43,-5434.04,40,0
A	mob	Snow Tracker Wolf
A	mob	Winter Wolf
A	mob	Young Black Bear
A	target	Ironforge Mountaineer
S	
A	goto	1426/0,-311.23,-5360.16,25,0
A	goto	1426/0,-282.18,-5363.45,45
A	isOnQuest	315
S	
T	requires	SeerRamp
T	completewith	next
A	complete	287,1
A	mob	Frostmane Headhunter
S	
T	label	ShimmerB
A	goto	1426/0,-269.86,-5370.34,40,0
A	goto	1426/0,-271.83,-5342.43,40,0
A	goto	1426/0,-250.16,-5306.32,40,0
A	goto	1426/0,-230.46,-5333.90,20,0
A	goto	1426/0,-240.81,-5354.91,30,0
A	goto	1426/0,-221.11,-5349.99,30,0
A	goto	1426/0,-224.06,-5372.31,40,0
A	goto	1426/0,-184.66,-5283.66,40,0
A	goto	1426/0,-151.66,-5186.15,20,0
A	goto	1426/0,-164.96,-5114.900,20,0
A	goto	1426/0,-258.54,-5046.93
A	complete	315,1
A	mob	Frostmane Seer
S	
T	completewith	IBCave
A	complete	384,1
A	mob	Large Crag Boar
A	mob	Elder Crag Boar
S	
T	completewith	next
A	goto	1426/0,-190.08,-5427.80,40,0
A	goto	1426/0,-55.63,-5580.48,40,0
A	complete	319,2
A	mob	Elder Crag Boar
S	
T	label	IBCave
A	goto	1426/0,-62.03,-5640.56,50
A	isOnQuest	312
S	
T	completewith	next
S	
A	goto	1426/0,-94.53,-5647.79
A	link	https://youtu.be/Zg4FNWw-P5k?t=3120
A	complete	312,1
A	mob	Old Icebeard
S	
A	goto	1426/0,99.51,-5573.25
A	turnin	312,1
A	target	Tundra MacGrann
S	
A	goto	1426/0,220.67,-5509.56,40,0
A	goto	1426/0,355.12,-5644.50,40,0
A	goto	1426/0,378.27,-5520.39,40,0
A	goto	1426/0,402.40,-5359.18,40,0
A	goto	1426/0,381.22,-5247.87,40,0
A	goto	1426/0,260.56,-5163.16,40,0
A	goto	1426/0,220.67,-5509.56,40,0
A	goto	1426/0,355.12,-5644.50,40,0
A	goto	1426/0,378.27,-5520.39,40,0
A	goto	1426/0,402.40,-5359.18,40,0
A	goto	1426/0,381.22,-5247.87,40,0
A	goto	1426/0,260.56,-5163.16
A	complete	319,1
A	mob	+Ice Claw Bear
A	complete	319,2
A	mob	+Elder Crag Boar
A	complete	319,3
A	mob	+Snow Leopard
A	complete	384,1
A	disablecheckbox	
A	mob	Elder Crag Boar
A	isQuestAvailable	384
S	
A	goto	1426/0,220.67,-5509.56,40,0
A	goto	1426/0,355.12,-5644.50,40,0
A	goto	1426/0,378.27,-5520.39,40,0
A	goto	1426/0,402.40,-5359.18,40,0
A	goto	1426/0,381.22,-5247.87,40,0
A	goto	1426/0,260.56,-5163.16,40,0
A	goto	1426/0,220.67,-5509.56,40,0
A	goto	1426/0,355.12,-5644.50,40,0
A	goto	1426/0,378.27,-5520.39,40,0
A	goto	1426/0,402.40,-5359.18,40,0
A	goto	1426/0,381.22,-5247.87,40,0
A	goto	1426/0,260.56,-5163.16
A	complete	319,1
A	mob	+Ice Claw Bear
A	complete	319,2
A	mob	+Elder Crag Boar
A	complete	319,3
A	mob	+Snow Leopard
A	isQuestTurnedIn	384
S	
A	turnin	315,1
A	accept	413
A	turnin	319
A	accept	320
A	goto	1426/0,315.28,-5378.39
A	turnin	311
A	goto	1426/0,315.42,-5372.02
A	target	Rejold Barleybrew
S	
A	goto	1426/0,302.42,-5387.74
A	collect	1179,10,287,1
A	target	Keeg Gibn
A	money	<0.0250
S	
A	goto	1426/0,302.42,-5387.74
A	collect	1179,5,287,1
A	target	Keeg Gibn
A	money	<0.0125
S	
A	goto	1426/0,220.67,-5509.56,40,0
A	goto	1426/0,355.12,-5644.50,40,0
A	goto	1426/0,378.27,-5520.39,40,0
A	goto	1426/0,402.40,-5359.18,40,0
A	goto	1426/0,381.22,-5247.87,40,0
A	goto	1426/0,260.56,-5163.16,40,0
A	goto	1426/0,220.67,-5509.56,40,0
A	goto	1426/0,355.12,-5644.50,40,0
A	goto	1426/0,378.27,-5520.39,40,0
A	goto	1426/0,402.40,-5359.18,40,0
A	goto	1426/0,381.22,-5247.87,40,0
A	goto	1426/0,260.56,-5163.16
A	complete	384,1
A	mob	Elder Crag Boar
S	
T	completewith	Explore
A	goto	1426/0,564.92,-5503.65,35,0
A	goto	1426/0,573.79,-5538.78,12
S	
A	goto	1426/0,605.80,-5545.020,40,0
A	goto	1426/0,654.07,-5563.40
A	complete	287,1
A	mob	Frostmane Headhunter
S	
T	label	Explore
A	goto	1426/0,668.84,-5585.73,8,0
A	goto	1426/0,674.26,-5587.37
A	link	https://youtu.be/Zg4FNWw-P5k?t=3619
A	complete	287,2
S	skip
T	completewith	next
S	
T	completewith	Senir2
A	hs	
S	
A	goto	1426/0,-531.38,-5601.49
A	complete	384,2
A	target	Innkeeper Belm
S	
A	goto	1426/0,-537.29,-5587.04
A	trainer	
A	target	Magis Sparkmantle
A	isQuestAvailable	314
S	
T	completewith	Senir2
S	
A	goto	1426/0,-504.29,-5596.24
A	turnin	384
A	target	Ragnar Thunderbrew
S	
T	label	Senir2
A	goto	1426/0,-499.17,-5644.37
A	turnin	287,2
A	accept	291
A	target	Senir Whitebeard
S	
T	completewith	next
A	cast	1459
A	cast	168
S	
A	turnin	320,2
A	target	+Pilot Bellowfiz
A	goto	1426/0,-632.15,-5466.540
A	turnin	313
A	goto	1426/0,-641.80,-5473.18
A	target	+Pilot Stonegear
S	
T	completewith	next
A	mob	Winter Wolf
A	target	Ironforge Mountaineer
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
A	mob	Vagash
S	
T	label	Rudra
A	goto	1426/0,-1304.61,-5513.82
A	accept	314
A	target	Rudra Amberstill
S	
A	goto	1426/0,-1279.49,-5392.01,0
A	goto	1426/0,-1289.83,-5669.780,40,0
A	goto	1426/0,-1291.80,-5706.89
A	link	https://youtu.be/Zg4FNWw-P5k?t=3815
A	complete	314,1
A	mob	Vagash
S	
A	goto	1426/0,-1304.61,-5513.82
A	turnin	314,3
A	target	Rudra Amberstill
S	skip
T	completewith	Ghilm
S	
T	completewith	next
A	goto	1426/0,-1465.16,-5548.96,50,0
A	goto	1426/0,-1533.13,-5638.92,30,0
A	mob	Ice Claw Bear
S	
T	sticky	
T	label	Ghilm
A	goto	1426/0,-1566.62,-5664.86,0,0
A	train	2550
A	target	Cook Ghilm
S	
A	goto	1426/0,-1568.09,-5665.19,8,0
A	goto	1426/0,-1573.02,-5671.10
A	collect	1179,15,432,1
A	target	Kazan Mogosh
A	money	<0.0395
S	
A	goto	1426/0,-1568.09,-5665.19,8,0
A	goto	1426/0,-1573.02,-5671.10
A	collect	1179,10,432,1
A	target	Kazan Mogosh
A	money	<0.0260
S	
A	goto	1426/0,-1568.09,-5665.19,8,0
A	goto	1426/0,-1573.02,-5671.10
A	collect	1179,5,432,1
A	target	Kazan Mogosh
A	money	<0.0135
S	
T	requires	Ghilm
A	accept	433
A	target	+Senator Mehr Stonehallow
A	goto	1426/0,-1579.91,-5714.77
A	accept	432
A	goto	1426/0,-1600.30,-5726.590
A	target	+Foreman Stonebrow
S	
T	completewith	Bonesnappers
A	complete	432,1
A	mob	Rockjaw Skullthumper
S	
T	completewith	next
A	goto	1426/0,-1681.86,-5723.30,30
S	
T	label	Bonesnappers
A	goto	1426/0,-1693.68,-5660.26,40,0
A	goto	1426/0,-1686.29,-5622.83,40,0
A	goto	1426/0,-1740.96,-5534.51,40,0
A	goto	1426/0,-1771.00,-5568.000,40,0
A	goto	1426/0,-1774.45,-5602.80
A	complete	433,1
A	mob	Rockjaw Bonesnapper
S	
A	goto	1426/0,-1681.86,-5723.30,30,0
T	loop	
A	line	Dun Morogh,69.93,57.29,70.57,58.61,69.68,59.37,68.36,59.57,69.16,57.51,69.93,57.29
A	goto	1426/0,-1641.97,-5758.11,30,0
A	goto	1426/0,-1673.49,-5801.45,30,0
A	goto	1426/0,-1629.66,-5826.40,30,0
A	goto	1426/0,-1564.65,-5832.97,30,0
A	goto	1426/0,-1604.05,-5765.33,30,0
A	goto	1426/0,-1641.97,-5758.11,30,0
A	complete	432,1
A	mob	Rockjaw Skullthumper
S	
T	sticky	
T	label	Frast
A	goto	1426/0,-1589.76,-5714.44,0,0
A	vendor	
A	target	Frast Dokner
S	
A	turnin	432
A	target	+Foreman Stonebrow
A	goto	1426/0,-1600.30,-5726.590
A	turnin	433
A	goto	1426/0,-1579.91,-5714.77
A	target	+Senator Mehr Stonehallow
S	
T	requires	Frast
A	goto	1426/0,-1612.42,-5698.02
A	train	2575
A	target	Dank Drizzlecut
S	
T	label	Shortcut1
T	completewith	Pilot
A	goto	1426/0,-1662.65,-5692.11,5,0
A	link	https://youtu.be/G2IscpFZVeQ?t=4034
A	goto	1426/0,-1671.03,-5674.71,12
S	
T	completewith	Pilot
T	requires	Shortcut1
T	label	Shortcut2
A	goto	1426/0,-1693.19,-5541.730,50,0
A	goto	1426/0,-1788.24,-5511.85,50,0
A	goto	1426/0,-1995.58,-5480.01,50
A	mob	Rockjaw Ambusher
A	unitscan	Ironforge Mountaineer
S	
T	requires	Shortcut2
T	completewith	next
A	goto	1426/0,-2198.49,-5277.75,50,0
A	goto	1426/0,-2286.16,-5200.59,30
A	mob	Scarred Crag Boar
S	
T	label	Pilot
A	goto	1426/0,-2329.50,-5163.82
A	accept	419
A	target	Pilot Hammerfoot
A	isQuestAvailable	419
S	
A	goto	1426/0,-2205.39,-5092.57,30,0
A	goto	1426/0,-2121.66,-5064.66
A	turnin	419
A	accept	417
S	
A	goto	1426/0,-2059.61,-5118.180,60,0
A	goto	1426/0,-2329.50,-5163.82
A	complete	417,1
A	mob	Mangeclaw
A	target	Pilot Hammerfoot
S	
A	goto	1426/0,-2329.60,-5163.76
A	turnin	417,1
A	target	Pilot Hammerfoot
S	
T	label	Tunnel1
T	completewith	Barleybrew
A	goto	1426/0,-2286.16,-5200.59,30,0
A	goto	1426/0,-2198.49,-5277.75,30
S	
A	goto	1426/0,-2075.37,-5511.20
A	xp	9+5450
A	mob	Ice Claw Bear
A	mob	Elder Crag Boar
A	mob	Scarred Crag Boar
S	
T	requires	Tunnel1
T	label	Tunnel2
T	completewith	Barleybrew
A	goto	1426/0,-2118.71,-5516.78,20,0
A	goto	1426/0,-2192.09,-5510.87,20,0
A	goto	1426/0,-2216.72,-5519.08,20,0
A	goto	1426/0,-2314.72,-5491.83,20,0
A	goto	1426/0,-2347.72,-5483.62,20
A	mob	Scarred Crag Boar
S	
T	requires	Tunnel2
T	completewith	next
A	xp	9+5990
A	mob	Scarred Crag Boar
S	
T	label	Barleybrew
A	goto	1426/0,-2447.11,-5479.74
A	turnin	413
A	accept	414
A	target	Mountaineer Barleybrew
S	
A	goto	1426/0,-2469.86,-5504.96,40,0
A	goto	1426/0,-2451.15,-5432.07
A	xp	9+6320
A	mob	Scarred Crag Boar
S	
T	label	CragB1
T	completewith	Cobbleflint
A	goto	1432/0,-2447.50,-5564.39,20,0
A	goto	1432/0,-2534.11,-5642.02,30
A	mob	Scarred Crag Boar
S	
T	loop	
A	line	Loch Modan,21.14,71.62,19.06,75.46,20.91,77.67,21.14,71.62
A	goto	1432/0,-2576.86,-5805.01,35,0
A	goto	1432/0,-2519.49,-5875.65,35,0
A	goto	1432/0,-2570.52,-5916.30,35,0
A	goto	1432/0,-2576.86,-5805.01,35,0
A	xp	10
A	mob	Elder Black Bear
A	mob	Forest Lurker
S	
T	requires	CragB1
T	completewith	Rugelfuss
A	collect	3173,3,418,1
A	disablecheckbox	
A	collect	3174,3,418,1
A	disablecheckbox	
A	mob	Elder Black Bear
A	mob	Forest Lurker
S	
T	label	Cobbleflint
A	goto	1432/0,-2602.54,-5832.73
A	accept	224
A	target	Mountaineer Cobbleflint
S	
T	completewith	next
A	goto	1432/0,-2635.61,-5879.14,12,0
A	goto	1432/0,-2645.27,-5874.91,12,0
A	goto	1432/0,-2631.48,-5847.50,12
S	
T	label	Rugelfuss
A	goto	1432/0,-2634.59,-5842.81
A	accept	267
A	target	Captain Rugelfuss
S	skip
T	completewith	next
A	goto	1432/0,-2586.52,-5740.99,20,0
A	goto	1432/0,-2569.14,-5673.30,20,0
A	goto	1432/0,-2531.62,-5638.34,30
S	skip
A	goto	1432/0,-2513.42,-5618.48
A	link	https://www.youtube.com/watch?v=AOAlX9B5aO0
A	goto	1432/0,-2881.66,-5351.18,30
A	isOnQuest	414
S	
A	goto	1432/0,-2902.07,-5398.28,40,0
A	goto	1432/0,-2945.10,-5360.20,40,0
A	goto	1432/0,-3015.71,-5335.73,40,0
A	goto	1432/0,-3025.09,-5318.44,40,0
A	goto	1432/0,-3017.64,-5274.66
A	turnin	414
A	accept	416
A	accept	1339
A	target	Mountaineer Kadrell
S	
A	goto	1432/0,-3019.30,-5354.50,10,0
A	goto	1432/0,-3014.88,-5366.820
A	accept	6387
A	target	Brock Stoneseeker
S	
A	goto	1432/0,-2929.93,-5424.95
A	fp	Thelsamar
A	turnin	6387
A	accept	6391
A	target	Thorgrum Borrelson
S	
T	completewith	next
A	goto	1432/0,-2929.93,-5424.95
A	fly	Ironforge
A	target	Thorgrum Borrelson
S	
A	zone	Ironforge
A	isOnQuest	6391
S	
T	completewith	next
A	goto	1455/0,-1154.84,-4771.58,30,0
A	goto	1455/0,-1123.37,-4726.31,15,0
A	goto	1455/0,-1106.29,-4718.18,12,0
A	goto	1455/0,-1121.08,-4708.000,10
S	
A	goto	1455/0,-1121.08,-4708.000
A	turnin	6391
A	accept	6388
A	vendor	
A	target	Golnir Bouldertoe
A	isOnQuest	291
S	
T	completewith	next
A	goto	1455/0,-1106.29,-4718.18,12,0
A	goto	1455/0,-1154.84,-4771.58,30,0
A	goto	1455/0,-1152.31,-4821.12,10
S	
A	goto	1455/0,-1152.39,-4820.914
A	turnin	6388
A	target	Gryth Thurden
S	
T	completewith	next
A	goto	1455/0,-1148.99,-4840.22,30,0
A	goto	1455/0,-1101.87,-4864.81,30,0
A	goto	1455/0,-1082.58,-4836.00,20,0
A	goto	1455/0,-1062.42,-4835.00,20,0
A	goto	1455/0,-1026.28,-4872.56,10
S	
A	goto	1455/0,-1026.28,-4872.56
A	turnin	291
A	target	Senator Barin Redstone
S	
T	completewith	next
A	goto	1455/0,-1064.87,-4828.19,20,0
A	goto	1455/0,-1062.10,-4815.100,20,0
A	goto	1455/0,-1036.48,-4804.50,20,0
A	goto	1455/0,-992.68,-4742.08,20,0
A	goto	1455/0,-931.8,-4627.59,20,0
A	goto	1455/0,-928.40,-4614.51,10
S	
A	goto	1455/0,-928.40,-4614.51
A	trainer	
A	target	Dink
S	skip
T	completewith	IFHS
S	
T	completewith	next
A	goto	1455/0,-857.01,-4840.69,10
S	
T	label	IFHS
A	goto	1455/0,-857.01,-4840.69
A	home	
A	target	Innkeeper Firebrew
S	skip
A	goto	1455/0,-864.68,-4847.820
A	zone	Dun Morogh
A	isOnQuest	416
E
G	Guides/forever/Alliance-ADV-AoE-Mage-1-22.lua
M	classic	
M	tbc	
M	selector	Alliance Mage
M	name	10-12 ADV Darkshore 1 Mage AoE
M	version	2
M	group	RestedXP ADV AoE Alliance Mage
M	defaultfor	Human Mage/Gnome Mage
M	next	12-14 ADV Loch Modan Mage AoE
S	
T	completewith	DeathlessSkip
A	goto	1455/0,-833.45,-5021.400,20,0
A	goto	1426/0,-1145.04,-5504.30
A	zone	Dun Morogh
S	
T	completewith	next
A	goto	1426/0,-831.81,-5108.330,30,0
A	goto	1426/0,-859.39,-5144.450,30,0
A	goto	1426/0,-1124.84,-5283.99,150
S	
T	label	DeathlessSkip
A	goto	1426/0,-1161.78,-5289.24,12,0
A	goto	1426/0,-1173.60,-5313.54,12,0
A	goto	1426/0,-1187.88,-5327.66,4,0
A	goto	1426/0,-1199.70,-5327.00,6,0
A	goto	1426/0,-1224.33,-5245.58,10,0
A	goto	1426/0,-1239.60,-5239.670,4,0
A	goto	1426/0,-1243.54,-5243.93,4,0
A	goto	1426/0,-1251.91,-5233.100,8,0
A	goto	1426/0,-1241.07,-5180.89,15,0
A	goto	1426/0,-1225.81,-5086.99,12,0
A	goto	1426/0,-1224.82,-4952.70,15,0
A	goto	1426/0,-1220.88,-4826.62,30,0
A	goto	1426/0,-1197.73,-4626.34,30,0
A	goto	1426/0,-1178.03,-4408.980,5,0
A	goto	1426/0,-1178.53,-4396.18,5,0
A	goto	1426/0,-1189.36,-4374.84,15,0
A	goto	1426/0,-1173.11,-4348.24,8,0
A	goto	1426/0,-1184.44,-4333.14,6,0
A	goto	1426/0,-1221.87,-4312.78,10,0
A	goto	1426/0,-1227.78,-4290.13,8,0
A	link	https://youtu.be/QcEUvwu49KI?t=73
A	goto	1426/0,-1184.93,-4250.73,20
A	isQuestAvailable	983
S	
A	goto	1426/0,-1192.32,-4216.25,10,0
A	goto	1426/0,-1182.96,-4196.55,8,0
A	goto	1437/0,-1166.63,-4147.02,12,0
A	goto	1437/0,-1162.91,-4104.03,12,0
A	goto	1437/0,-1154.64,-4060.48,12,0
A	goto	1437/0,-1118.24,-4031.81,15,0
A	goto	1437/0,-1092.6,-4013.35,12,0
A	goto	1437/0,-1049.60,-3998.74,12,0
A	goto	1437/0,-1012.79,-3978.34,20,0
A	goto	1437/0,-1022.72,-3952.43,20,0
A	goto	1437/0,-1014.03,-3904.2,12,0
A	link	https://youtu.be/QcEUvwu49KI?t=336
A	goto	1437/0,-914.37,-3828.40,15
A	mob	Young Wetlands Crocolisk
A	mob	Bluegill Raider
A	unitscan	Sludginn
A	isQuestAvailable	983
S	
T	completewith	next
A	goto	1437/0,-836.21,-3796.15,10,0
A	goto	1437/0,-829.18,-3804.420,10
S	
A	goto	1437/0,-823.8,-3807.180
A	vendor	1457
A	target	Samor Festivus
A	money	<0.03
S	
A	goto	1437/0,-782.03,-3793.12
A	fp	Menethil Harbor
A	target	Shellei Brondir
S	
T	completewith	DarkshoreBoat
A	goto	1437/0,-715.87,-3697.48
A	itemcount	769,1
S	
A	goto	1437/0,-715.87,-3697.48
A	vendor	1453
A	target	Dewin Shimmerdawn
A	money	<0.03
S	
T	completewith	Darkshore
T	label	DarkshoreBoat
A	goto	1437/0,-641.43,-3758.94,20,0
A	goto	1437/0,-575.68,-3719.53,20
S	
T	completewith	next
T	requires	DarkshoreBoat
S	
T	label	Darkshore
A	goto	1437/0,-565.34,-3724.77
A	zone	Darkshore
S	
T	label	Darkshoreshore
T	completewith	Wizbang
A	goto	1439/1,601.35,6358.29,60
S	
T	requires	Darkshoreshore
T	completewith	Wizbang
A	mob	Pygmy Tide Crawler
S	
T	requires	Darkshoreshore
T	completewith	next
A	goto	1439/1,533.23,6399.77,0,0
A	vendor	
A	collect	4592,20,983,1
A	isQuestAvailable	983
S	
T	requires	Darkshoreshore
T	completewith	next
A	goto	1439/1,536.51,6389.29,20,0
A	goto	1439/1,528.65,6404.14,10,0
A	goto	1439/1,537.16,6417.68,10,0
A	goto	1439/1,519.48,6405.89,8
S	
T	label	Wizbang
A	goto	1439/1,519.48,6405.89
A	accept	983
A	target	Wizbang Cranktoggle
S	
T	completewith	next
A	complete	983,1
A	mob	Pygmy Tide Crawler
S	
T	completewith	next
A	goto	1439/1,489.35,6450.43,20,0
A	goto	1439/1,470.35,6525.530,20,0
A	goto	1439/1,492.62,6580.99,10
S	
T	sticky	
T	label	DalmondBags
A	goto	1439/1,488.69,6564.830
A	vendor	4182
A	target	Dalmond
A	money	<0.0500
A	isQuestAvailable	954
S	
A	goto	1439/1,492.62,6580.99
A	accept	954
A	accept	958
A	target	Thundris Windweaver
A	skill	cooking,10,1
S	
A	accept	954
A	accept	958
A	target	+Thundris Windweaver
A	goto	1439/1,492.62,6580.99
A	accept	2178
A	goto	1439/1,472.97,6557.85
A	target	+Alanndarian Nightsong
A	skill	cooking,<10,1
S	
T	requires	DalmondBags
T	completewith	next
A	goto	1439/1,462.49,6525.97,20,0
A	goto	1439/1,414.68,6472.70,20,0
A	goto	1439/1,383.89,6445.62,20,0
A	goto	1439/1,362.93,6434.27,12
S	
T	requires	DalmondBags
A	accept	984
A	target	+Terenthis
A	goto	1439/1,362.93,6434.27
A	accept	2118
A	goto	1439/1,397.65,6437.76
A	target	+Tharnariun Treetender
S	
A	goto	1439/1,533.23,6399.77
A	vendor	
A	collect	4592,20,983,1
A	isQuestAvailable	983
A	itemcount	4592,<20
S	
T	completewith	next
A	goto	1439/1,569.26,6373.14,50,0
A	goto	1439/1,596.11,6334.27,50,0
A	goto	1439/1,592.84,6265.72,50,0
A	goto	1439/1,600.70,6228.600,50,0
A	goto	1439/1,567.29,6154.370,50,0
A	complete	983,1
A	mob	Pygmy Tide Crawler
S	
T	completewith	next
A	goto	1439/1,437.60,6025.99,75,0
A	complete	2118,1
A	use	7586
A	unitscan	Rabid Thistle Bear
S	
A	goto	1439/1,393.72,5993.24
A	complete	984,1
S	
A	goto	1439/1,411.40,5873.15,60,0
A	goto	1439/1,400.27,5788.0,60,0
A	goto	1439/1,427.78,5680.58,60,0
A	goto	1439/1,415.33,5434.30
A	complete	2118,1
A	use	7586
A	unitscan	Rabid Thistle Bear
S	
A	goto	1439/1,302.02,5726.433
A	accept	953
A	target	Sentinel Tysha Moonblade
S	
T	completewith	Relics
A	unitscan	Lady Moongazer
S	
T	completewith	Fall
A	complete	958,1
A	mob	Cursed Highborne
A	mob	Writhing Highborne
S	
A	goto	1439/1,148.09,5575.78
A	complete	953,2
S	
A	goto	1439/1,105.52,5770.100
A	complete	953,1
S	
T	label	Fall
A	goto	1439/1,302.02,5726.433
A	turnin	953
A	target	Sentinel Tysha Moonblade
S	
T	label	Relics
A	goto	1439/1,206.39,5802.41,50,0
A	goto	1439/1,117.96,5820.32,50,0
A	goto	1439/1,71.46,5788.00,50,0
A	goto	1439/1,87.18,5713.77,50,0
A	goto	1439/1,93.07,5585.83,50,0
A	goto	1439/1,165.78,5564.870,50,0
A	goto	1439/1,242.41,5641.72,50,0
A	goto	1439/1,206.39,5802.41
A	complete	958,1
A	mob	Cursed Highborne
A	mob	Writhing Highborne
S	
T	completewith	next
A	mob	Vile Sprite
S	
A	goto	1439/1,48.53,6748.67
A	turnin	954
A	accept	955
A	target	Asterion
S	
T	completewith	BashalF
A	unitscan	Licillin
S	
T	loop	
A	line	Darkshore,44.57,36.57,44.47,38.11,44.02,38.55,45.01,39.62,45.61,38.81,45.18,37.51,45.86,36.96,46.91,37.11,45.47,36.01,44.57,36.57
A	goto	1439/1,22.33,6736.44,35,0
A	goto	1439/1,28.88,6669.20,35,0
A	goto	1439/1,58.36,6649.98,35,0
A	goto	1439/1,-6.49,6603.26,35,0
A	goto	1439/1,-45.79,6638.63,35,0
A	goto	1439/1,-17.62,6695.40,35,0
A	goto	1439/1,-62.16,6719.41,35,0
A	goto	1439/1,-130.94,6712.86,35,0
A	goto	1439/1,-36.62,6760.90,35,0
A	goto	1439/1,22.33,6736.44,35,0
A	complete	955,1
A	mob	Vile Sprite
A	mob	Wild Grell
S	
A	goto	1439/1,48.53,6748.67
A	turnin	955
A	accept	956
A	target	Asterion
S	
A	goto	1439/1,-38.58,6739.5,45,0
A	goto	1439/1,-66.75,6683.61,45,0
A	goto	1439/1,-67.40,6672.25,45,0
A	goto	1439/1,-34.00,6601.51,45,0
A	goto	1439/1,-115.22,6626.40,45,0
A	goto	1439/1,-160.41,6690.16,45,0
A	goto	1439/1,-187.27,6708.930,45,0
A	goto	1439/1,-165.65,6728.15,45,0
A	goto	1439/1,-38.58,6739.5,45,0
A	goto	1439/1,-66.75,6683.61,45,0
A	goto	1439/1,-67.40,6672.25,45,0
A	goto	1439/1,-34.00,6601.51,45,0
A	goto	1439/1,-115.22,6626.40,45,0
A	goto	1439/1,-160.41,6690.16,45,0
A	goto	1439/1,-187.27,6708.930,45,0
A	goto	1439/1,-165.65,6728.15
A	complete	956,1
A	mob	Deth'ryll Satyr
S	
T	loop	
A	line	Darkshore,44.57,36.57,44.47,38.11,44.02,38.55,45.01,39.62,45.61,38.81,45.18,37.51,45.86,36.96,46.91,37.11,45.47,36.01,44.57,36.57
A	goto	1439/1,22.33,6736.44,35,0
A	goto	1439/1,28.88,6669.20,35,0
A	goto	1439/1,58.36,6649.98,35,0
A	goto	1439/1,-6.49,6603.26,35,0
A	goto	1439/1,-45.79,6638.63,35,0
A	goto	1439/1,-17.62,6695.40,35,0
A	goto	1439/1,-62.16,6719.41,35,0
A	goto	1439/1,-130.94,6712.86,35,0
A	goto	1439/1,-36.62,6760.90,35,0
A	goto	1439/1,22.33,6736.44,35,0
A	xp	11+1100
A	mob	Vile Sprite
A	mob	Wild Grell
S	
T	label	BashalF
A	goto	1439/1,48.53,6748.67
A	turnin	956
A	accept	957
A	target	Asterion
S	
T	sticky	
T	label	DalmondBags1
A	goto	1439/1,488.69,6564.830,0,0
A	vendor	
A	target	Dalmond
A	isQuestAvailable	3524
S	
A	goto	1439/1,491.97,6582.303
A	turnin	958
A	target	Thundris Windweaver
S	
T	requires	DalmondBags1
A	goto	1439/1,472.97,6557.85
A	turnin	2178
A	target	Alanndarian Nightsong
A	itemcount	5469,5
A	skill	cooking,<10,1
S	
A	turnin	984
A	accept	985
A	accept	4761
A	target	+Terenthis
A	goto	1439/1,362.93,6434.27
A	turnin	2118
A	accept	2138
A	goto	1439/1,397.65,6437.76
A	target	+Tharnariun Treetender
S	
T	sticky	
T	label	Gwennyth
A	goto	1439/1,543.06,6342.57
A	accept	3524
A	target	Gwennyth Bly'Leggonde
S	
A	goto	1439/1,561.40,6343.01
A	fp	Auberdine
A	target	Caylais Moonfeather
S	
T	requires	Gwennyth
T	completewith	Bones
A	goto	1439/1,569.26,6373.14,50,0
A	goto	1439/1,596.11,6334.27,50,0
A	goto	1439/1,592.84,6265.72,50,0
A	goto	1439/1,600.70,6228.600,50,0
A	goto	1439/1,567.29,6154.370,50,0
A	complete	983,1
A	mob	Pygmy Tide Crawler
A	mob	Young Reef Crawler
S	
T	requires	Gwennyth
T	completewith	next
A	collect	730,3,38,1
A	mob	Greymist Coastrunner
A	mob	Greymist Raider
S	
T	requires	Gwennyth
T	label	Bones
A	goto	1439/1,558.78,6111.57
A	complete	3524,1
S	
A	goto	1439/1,569.26,6373.14
A	complete	983,1
A	mob	Pygmy Tide Crawler
A	mob	Young Reef Crawler
S	
A	goto	1439/1,541.75,6313.31
A	turnin	983
A	accept	1001
S	
A	goto	1439/1,536.51,6365.28,12,0
A	goto	1439/1,543.06,6342.57
A	turnin	3524
A	accept	4681
A	target	Gwennyth Bly'Leggonde
S	
A	goto	1439/1,533.23,6399.77
A	collect	4592,40,4681,1
A	target	Laird
S	
A	goto	1439/1,539.13,6409.82,12,0
A	goto	1439/1,600.70,6425.100
A	accept	963
A	target	Cerellean Whiteclaw
S	
T	completewith	Gwen
A	complete	1001,1
A	mob	Darkshore Thresher
S	
T	completewith	next
A	goto	1439/1,786.06,6488.85,15,0
A	goto	1439/1,818.81,6419.86,25
S	
A	goto	1439/1,854.84,6310.26
A	complete	4681,1
S	
A	goto	1439/1,575.81,6381.430,50,0
A	goto	1439/1,596.77,6329.91,50,0
A	goto	1439/1,581.05,6209.82,50,0
A	goto	1439/1,575.15,6144.32,50,0
A	goto	1439/1,545.68,6010.270,50,0
A	goto	1439/1,634.10,5983.63,50,0
A	goto	1439/1,634.76,5915.51,50,0
A	goto	1439/1,537.82,5840.4,50,0
A	goto	1439/1,575.81,6381.430,50,0
A	goto	1439/1,596.77,6329.91,50,0
A	goto	1439/1,581.05,6209.82,50,0
A	goto	1439/1,575.15,6144.32,50,0
A	goto	1439/1,545.68,6010.270,50,0
A	goto	1439/1,634.10,5983.63,50,0
A	goto	1439/1,634.76,5915.51,50,0
A	goto	1439/1,537.82,5840.40
A	xp	11+7825
A	mob	Pygmy Tide Crawler
A	mob	Young Reef Crawler
S	
T	label	Gwen
A	goto	1439/1,539.78,6364.84,12,0
A	goto	1439/1,543.06,6342.57
A	turnin	4681,1
A	target	Gwennyth Bly'Leggonde
S	skip
T	completewith	next
A	use	15398
A	itemcount	15398,1
A	itemStat	8,LEVEL,<14
S	
A	goto	1439/1,515.55,6406.32
A	hs	
A	link	https://www.youtube.com/watch?v=Is-h2TJpL3M
A	target	Innkeeper Shaussiy
A	zoneskip	Ironforge
S	
A	goto	1455/0,-928.40,-4614.51
A	trainer	
A	target	Dink
S	skip
A	goto	1455/0,-928.80,-4614.51,-1
A	goto	1455/0,-1249.87,-4793.31,-1
A	vendor	5175
A	itemcount	4371,<1
A	isQuestAvailable	418
S	
T	completewith	next
S	Gnome
A	goto	1455/0,-1152.39,-4820.914
A	accept	6392
A	target	Gryth Thurden
S	
A	goto	1455/0,-1152.39,-4820.914
A	fly	Thelsamar
A	target	Gryth Thurden
E
G	Guides/forever/Alliance-ADV-AoE-Mage-1-22.lua
M	classic	
M	tbc	
M	selector	Alliance Mage
M	name	10-12 LAUNCH ADV Darkshore 1 Mage AoE
M	version	2
M	group	RestedXP ADV AoE Alliance Mage
M	defaultfor	none
M	next	12-14 ADV Loch Modan Mage AoE
S	
T	completewith	next
S	
T	completewith	next
A	goto	1426/0,-831.81,-5108.330,30,0
A	goto	1426/0,-859.39,-5144.450,30,0
A	goto	1426/0,-1124.84,-5283.99,150
S	
A	goto	1426/0,-1161.78,-5289.24,12,0
A	goto	1426/0,-1173.60,-5313.54,12,0
A	goto	1426/0,-1187.88,-5327.66,4,0
A	goto	1426/0,-1199.70,-5327.00,6,0
A	goto	1426/0,-1224.33,-5245.58,10,0
A	goto	1426/0,-1239.60,-5239.670,4,0
A	goto	1426/0,-1243.54,-5243.93,4,0
A	goto	1426/0,-1251.91,-5233.100,8,0
A	goto	1426/0,-1241.07,-5180.89,15,0
A	goto	1426/0,-1225.81,-5086.99,12,0
A	goto	1426/0,-1224.82,-4952.70,15,0
A	goto	1426/0,-1220.88,-4826.62,30,0
A	goto	1426/0,-1197.73,-4626.34,30,0
A	goto	1426/0,-1178.03,-4408.980,5,0
A	goto	1426/0,-1178.53,-4396.18,5,0
A	goto	1426/0,-1189.36,-4374.84,15,0
A	goto	1426/0,-1173.11,-4348.24,8,0
A	goto	1426/0,-1184.44,-4333.14,6,0
A	goto	1426/0,-1221.87,-4312.78,10,0
A	goto	1426/0,-1227.78,-4290.13,8,0
A	link	https://youtu.be/QcEUvwu49KI?t=73
A	goto	1426/0,-1184.93,-4250.73,20
A	isQuestAvailable	983
S	
A	goto	1426/0,-1192.32,-4216.25,10,0
A	goto	1426/0,-1182.96,-4196.55,8,0
A	goto	1437/0,-1166.63,-4147.02,12,0
A	goto	1437/0,-1162.91,-4104.03,12,0
A	goto	1437/0,-1154.64,-4060.48,12,0
A	goto	1437/0,-1118.24,-4031.81,15,0
A	goto	1437/0,-1092.6,-4013.35,12,0
A	goto	1437/0,-1049.60,-3998.74,12,0
A	goto	1437/0,-1012.79,-3978.34,20,0
A	goto	1437/0,-1022.72,-3952.43,20,0
A	goto	1437/0,-1014.03,-3904.2,12,0
A	link	https://youtu.be/QcEUvwu49KI?t=336
A	goto	1437/0,-914.37,-3828.40,15
A	mob	Young Wetlands Crocolisk
A	mob	Bluegill Raider
A	unitscan	Sludginn
A	isQuestAvailable	983
S	
T	completewith	next
A	goto	1437/0,-836.21,-3796.15,10,0
A	goto	1437/0,-829.18,-3804.420,10
S	
A	goto	1437/0,-823.8,-3807.180
A	vendor	1457
A	target	Samor Festivus
A	money	<0.03
S	
A	goto	1437/0,-782.03,-3793.12
A	fp	Menethil Harbor
A	target	Shellei Brondir
S	
T	completewith	DarkshoreBoat
A	goto	1437/0,-715.87,-3697.48
A	itemcount	769,1
S	
A	goto	1437/0,-715.87,-3697.48
A	vendor	1453
A	target	Dewin Shimmerdawn
A	money	<0.03
S	
T	completewith	Darkshore
T	label	DarkshoreBoat
A	goto	1437/0,-641.43,-3758.94,20,0
A	goto	1437/0,-575.68,-3719.53,20
S	
T	completewith	next
T	requires	DarkshoreBoat
S	
T	label	Darkshore
A	goto	1437/0,-565.34,-3724.77
A	zone	Darkshore
S	
T	label	Darkshoreshore
T	completewith	Wizbang
A	goto	1439/1,601.35,6358.29,60
S	
T	requires	Darkshoreshore
T	completewith	Wizbang
A	mob	Pygmy Tide Crawler
S	
T	requires	Darkshoreshore
T	completewith	next
A	goto	1439/1,533.23,6399.77,0,0
A	vendor	
A	collect	4592,20,983,1
A	isQuestAvailable	983
S	
T	requires	Darkshoreshore
T	completewith	next
A	goto	1439/1,536.51,6389.29,20,0
A	goto	1439/1,528.65,6404.14,10,0
A	goto	1439/1,537.16,6417.68,10,0
A	goto	1439/1,519.48,6405.89,8
S	
T	label	Wizbang
A	goto	1439/1,519.48,6405.89
A	accept	983
A	target	Wizbang Cranktoggle
S	
T	completewith	DalmondBags
A	complete	983,1
A	mob	Pygmy Tide Crawler
S	
A	goto	1439/1,533.23,6399.77
A	vendor	
A	collect	4592,20,983,1
A	isQuestAvailable	983
A	itemcount	4592,<20
S	skip
T	requires	DalmondBags
T	completewith	next
A	goto	1439/1,462.49,6525.97,20,0
A	goto	1439/1,414.68,6472.70,20,0
A	goto	1439/1,383.89,6445.62,20,0
A	goto	1439/1,362.93,6434.27,12
S	
A	accept	984
A	target	+Terenthis
A	goto	1439/1,362.93,6434.27,-1
A	accept	2118
A	goto	1439/1,397.65,6437.76,-1
A	target	+Tharnariun Treetender
S	skip
T	completewith	next
A	goto	1439/1,489.35,6450.43,20,0
A	goto	1439/1,470.35,6525.530,20,0
A	goto	1439/1,492.62,6580.99,10
S	
T	sticky	
T	label	DalmondBags
A	goto	1439/1,488.69,6564.830
A	vendor	4182
A	target	Dalmond
A	money	<0.0500
A	isQuestAvailable	954
S	
A	goto	1439/1,492.62,6580.99
A	accept	954
A	accept	958
A	target	Thundris Windweaver
A	skill	cooking,10,1
S	
A	accept	954
A	accept	958
A	target	+Thundris Windweaver
A	goto	1439/1,492.62,6580.99,-1
A	accept	2178
A	goto	1439/1,472.97,6557.85,-1
A	target	+Alanndarian Nightsong
A	skill	cooking,<10,1
S	
A	goto	1439/1,-117.84,6820.72
A	complete	2118,1
A	use	7586
A	unitscan	Rabid Thistle Bear
S	
T	completewith	next
A	mob	Vile Sprite
S	
T	label	Bash1
A	goto	1439/1,48.53,6748.67
A	turnin	954
A	accept	955
A	target	Asterion
S	
T	completewith	BashalF
A	unitscan	Licillin
S	
T	loop	
A	line	Darkshore,44.57,36.57,44.47,38.11,44.02,38.55,45.01,39.62,45.61,38.81,45.18,37.51,45.86,36.96,46.91,37.11,45.47,36.01,44.57,36.57
A	goto	1439/1,22.33,6736.44,35,0
A	goto	1439/1,28.88,6669.20,35,0
A	goto	1439/1,58.36,6649.98,35,0
A	goto	1439/1,-6.49,6603.26,35,0
A	goto	1439/1,-45.79,6638.63,35,0
A	goto	1439/1,-17.62,6695.40,35,0
A	goto	1439/1,-62.16,6719.41,35,0
A	goto	1439/1,-130.94,6712.86,35,0
A	goto	1439/1,-36.62,6760.90,35,0
A	goto	1439/1,22.33,6736.44,35,0
A	complete	955,1
A	mob	Vile Sprite
A	mob	Wild Grell
S	
A	goto	1439/1,48.53,6748.67
A	turnin	955
A	accept	956
A	target	Asterion
S	
A	goto	1439/1,-38.58,6739.5,45,0
A	goto	1439/1,-66.75,6683.61,45,0
A	goto	1439/1,-67.40,6672.25,45,0
A	goto	1439/1,-34.00,6601.51,45,0
A	goto	1439/1,-115.22,6626.40,45,0
A	goto	1439/1,-160.41,6690.16,45,0
A	goto	1439/1,-187.27,6708.930,45,0
A	goto	1439/1,-165.65,6728.15,45,0
A	goto	1439/1,-38.58,6739.5,45,0
A	goto	1439/1,-66.75,6683.61,45,0
A	goto	1439/1,-67.40,6672.25,45,0
A	goto	1439/1,-34.00,6601.51,45,0
A	goto	1439/1,-115.22,6626.40,45,0
A	goto	1439/1,-160.41,6690.16,45,0
A	goto	1439/1,-187.27,6708.930,45,0
A	goto	1439/1,-165.65,6728.15
A	complete	956,1
A	mob	Deth'ryll Satyr
S	
T	label	BashalF
A	goto	1439/1,48.53,6748.67
A	turnin	956
A	accept	957
A	target	Asterion
S	
A	goto	1439/1,397.65,6437.76
A	xp	10+6625
S	
A	goto	1439/1,397.65,6437.76
A	turnin	2118
A	accept	2138
A	target	Tharnariun Treetender
S	
A	goto	1439/1,539.13,6409.82,12,0
A	goto	1439/1,600.70,6425.100
A	accept	963
A	target	Cerellean Whiteclaw
S	
T	completewith	next
A	complete	983,1
A	mob	Pygmy Tide Crawler
S	
T	sticky	
T	label	Gwennyth
A	goto	1439/1,543.06,6342.57
A	accept	3524
A	target	Gwennyth Bly'Leggonde
S	
A	goto	1439/1,561.40,6343.01
A	fp	Auberdine
A	target	Caylais Moonfeather
S	
T	requires	Gwennyth
T	completewith	Bones
A	goto	1439/1,569.26,6373.14,50,0
A	goto	1439/1,596.11,6334.27,50,0
A	goto	1439/1,592.84,6265.72,50,0
A	goto	1439/1,600.70,6228.600,50,0
A	goto	1439/1,567.29,6154.370,50,0
A	complete	983,1
A	mob	Pygmy Tide Crawler
A	mob	Young Reef Crawler
S	
T	requires	Gwennyth
T	completewith	next
A	collect	730,3,38,1
A	mob	Greymist Coastrunner
A	mob	Greymist Raider
S	
T	requires	Gwennyth
T	label	Bones
A	goto	1439/1,558.78,6111.57
A	complete	3524,1
S	
A	goto	1439/1,569.26,6373.14
A	complete	983,1
A	mob	Pygmy Tide Crawler
A	mob	Young Reef Crawler
S	
T	requires	Gwennyth
A	goto	1439/1,393.72,5993.24
A	complete	984,1
S	
A	goto	1439/1,302.02,5726.433
A	accept	953
A	target	Sentinel Tysha Moonblade
S	
T	completewith	Anaya
A	unitscan	Lady Moongazer
S	
T	completewith	Relics
A	goto	1439/1,161.19,5684.51,0
A	complete	963,1
A	unitscan	Anaya Dawnrunner
S	
T	completewith	Fall
A	complete	958,1
A	mob	Cursed Highborne
A	mob	Writhing Highborne
S	
A	goto	1439/1,166.43,5633.86
A	complete	957,1
S	
A	goto	1439/1,148.09,5575.78
A	complete	953,2
S	
A	goto	1439/1,105.52,5770.100
A	complete	953,1
S	
T	label	Fall
A	goto	1439/1,302.02,5726.433
A	turnin	953
A	target	Sentinel Tysha Moonblade
S	
T	label	Relics
A	goto	1439/1,206.39,5802.41,50,0
A	goto	1439/1,117.96,5820.32,50,0
A	goto	1439/1,71.46,5788.00,50,0
A	goto	1439/1,87.18,5713.77,50,0
A	goto	1439/1,93.07,5585.83,50,0
A	goto	1439/1,165.78,5564.870,50,0
A	goto	1439/1,242.41,5641.72,50,0
A	goto	1439/1,206.39,5802.41
A	complete	958,1
A	mob	Cursed Highborne
A	mob	Writhing Highborne
S	
T	label	Anaya
A	goto	1439/1,161.19,5684.51
A	complete	963,1
A	unitscan	Anaya Dawnrunner
S	
T	completewith	next
A	goto	1439/1,-22.21,5999.79,30
A	isOnQuest	958
S	
A	goto	1439/1,-54.96,6015.51
A	goto	1439/1,210.32,6739.501,30
A	mob	Moonkin Oracle
A	isOnQuest	958
S	
A	goto	1439/1,47.88,6748.67
A	turnin	957,3
A	target	Asterion
S	
T	sticky	
T	label	DalmondBags1
A	goto	1439/1,488.69,6564.830,0,0
A	vendor	
A	target	Dalmond
A	isQuestAvailable	3524
S	
A	goto	1439/1,491.97,6582.303
A	turnin	958
A	target	Thundris Windweaver
S	
T	requires	DalmondBags1
A	goto	1439/1,472.97,6557.85
A	turnin	2178
A	target	Alanndarian Nightsong
A	itemcount	5469,5
A	skill	cooking,<10,1
S	
A	goto	1439/1,362.93,6434.27
A	turnin	984
A	accept	985
A	accept	4761
A	target	Terenthis
S	
A	goto	1439/1,541.75,6313.31
A	turnin	983
A	accept	1001
S	
A	goto	1439/1,536.51,6365.28,12,0
A	goto	1439/1,543.06,6342.57
A	turnin	3524
A	accept	4681
A	target	Gwennyth Bly'Leggonde
S	
A	goto	1439/1,533.23,6399.77
A	collect	4592,40,4681,1
A	target	Laird
S	
A	goto	1439/1,539.13,6409.82,12,0
A	goto	1439/1,600.70,6425.100
A	turnin	963
A	target	Cerellean Whiteclaw
S	
T	completewith	Gwen
A	complete	1001,1
A	mob	Darkshore Thresher
S	
T	completewith	next
A	goto	1439/1,786.06,6488.85,15,0
A	goto	1439/1,818.81,6419.86,25
S	
A	goto	1439/1,854.84,6310.26
A	complete	4681,1
S	
A	goto	1439/1,575.81,6381.430,50,0
A	goto	1439/1,596.77,6329.91,50,0
A	goto	1439/1,581.05,6209.82,50,0
A	goto	1439/1,575.15,6144.32,50,0
A	goto	1439/1,545.68,6010.270,50,0
A	goto	1439/1,634.10,5983.63,50,0
A	goto	1439/1,634.76,5915.51,50,0
A	goto	1439/1,537.82,5840.4,50,0
A	goto	1439/1,575.81,6381.430,50,0
A	goto	1439/1,596.77,6329.91,50,0
A	goto	1439/1,581.05,6209.82,50,0
A	goto	1439/1,575.15,6144.32,50,0
A	goto	1439/1,545.68,6010.270,50,0
A	goto	1439/1,634.10,5983.63,50,0
A	goto	1439/1,634.76,5915.51,50,0
A	goto	1439/1,537.82,5840.40
A	xp	11+7825
A	mob	Pygmy Tide Crawler
A	mob	Young Reef Crawler
S	
T	label	Gwen
A	goto	1439/1,539.78,6364.84,12,0
A	goto	1439/1,543.06,6342.57
A	turnin	4681,1
A	target	Gwennyth Bly'Leggonde
S	skip
T	completewith	next
A	use	15398
A	itemcount	15398,1
A	itemStat	8,LEVEL,<14
S	
A	goto	1439/1,515.55,6406.32
A	hs	
A	link	https://www.youtube.com/watch?v=Is-h2TJpL3M
A	target	Innkeeper Shaussiy
A	zoneskip	Ironforge
S	
A	goto	1455/0,-928.40,-4614.51
A	trainer	
A	target	Dink
S	skip
A	goto	1455/0,-928.80,-4614.51,-1
A	goto	1455/0,-1249.87,-4793.31,-1
A	vendor	5175
A	itemcount	4371,<1
A	isQuestAvailable	418
S	
T	completewith	next
S	Gnome
A	goto	1455/0,-1152.39,-4820.914
A	accept	6392
A	target	Gryth Thurden
S	
A	goto	1455/0,-1152.39,-4820.914
A	fly	Thelsamar
A	target	Gryth Thurden
E
G	Guides/forever/Alliance-ADV-AoE-Mage-1-22.lua
M	classic	
M	tbc	
M	selector	Alliance Mage
M	name	12-14 ADV Loch Modan Mage AoE
M	version	2
M	group	RestedXP ADV AoE Alliance Mage
M	defaultfor	Human Mage/Gnome Mage
M	next	14-16 ADV Darkshore 2 Mage AoE
S	
T	completewith	next
S	
A	zone	Loch Modan
A	isOnQuest	6392 << Gnome
S	
A	goto	1432/0,-2602.54,-5832.73
A	accept	224
A	target	Mountaineer Cobbleflint
S	
T	completewith	next
A	goto	1432/0,-2635.61,-5879.14,12,0
A	goto	1432/0,-2645.27,-5874.91,12,0
A	goto	1432/0,-2631.48,-5847.50,12
S	
A	goto	1432/0,-2634.59,-5842.81
A	accept	267
A	target	Captain Rugelfuss
S	
T	completewith	Rugel2
A	collect	3172,3,418,1
A	mob	+Mountain Boar
A	collect	3173,3,418,1
A	mob	+Elder Black Bear
A	collect	3174,3,418,1
A	mob	+Forest Lurker
S	
A	goto	1432/0,-2729.40,-5534.96
A	complete	224,1
A	mob	+Stonesplinter Trogg
A	complete	224,2
A	mob	+Stonesplinter Scout
A	complete	267,1
A	mob	+Stonesplinter Trogg
A	mob	+Stonesplinter Scout
S	
A	goto	1432/0,-2602.54,-5832.73
A	turnin	224
A	target	Mountaineer Cobbleflint
S	
T	completewith	next
A	goto	1432/0,-2635.61,-5879.14,12,0
A	goto	1432/0,-2645.27,-5874.91,12,0
A	goto	1432/0,-2631.48,-5847.50,12
S	
T	label	Rugel2
A	goto	1432/0,-2634.59,-5842.81
A	turnin	267
A	target	Captain Rugelfuss
S	skip
T	completewith	next
A	goto	1432/0,-2586.52,-5740.99,20,0
A	goto	1432/0,-2569.14,-5673.30,20,0
A	goto	1432/0,-2531.62,-5638.34,30
S	skip
A	goto	1432/0,-2513.42,-5618.48
A	goto	1432/0,-2881.66,-5351.18,30
A	isOnQuest	1339
S	
T	completewith	next
A	collect	3172,3,418,1
A	mob	+Mountain Boar
A	collect	3173,3,418,1
A	mob	+Elder Black Bear
A	collect	3174,3,418,1
A	mob	+Forest Lurker
S	
A	goto	1432/0,-2643.89,-4817.34,30
A	isOnQuest	1339
S	
A	goto	1432/0,-2659.34,-4822.300
A	vendor	
A	target	Gothor Brumn
A	isOnQuest	1339
S	
A	goto	1432/0,-2676.82,-4825.93
A	turnin	353
A	turnin	1339
A	accept	1338
A	accept	307
A	target	Mountaineer Stormpike
S	
T	completewith	Entrance
A	collect	3172,3,418,1
A	mob	+Mountain Boar
A	collect	3173,3,418,1
A	mob	+Elder Black Bear
A	collect	3174,3,418,1
A	mob	+Forest Lurker
S	
T	completewith	Exit
A	complete	416,1
A	mob	Tunnel Rat Vermin
A	mob	Tunnel Rat Kobold
A	mob	Tunnel Rat Scout
A	mob	Tunnel Rat Forager
A	mob	Tunnel Rat Geomancer
A	mob	Tunnel Rat Digger
S	
T	label	Entrance
A	goto	1432/0,-2972.13,-4836.10,40
A	isOnQuest	307
S	
T	label	Gear
A	goto	1432/0,-2971.58,-4854.31,12,0
A	goto	1432/0,-2998.33,-4868.66,12,0
A	goto	1432/0,-2965.79,-4891.84,12,0
A	goto	1432/0,-2983.99,-4892.58,12,0
A	goto	1432/0,-2955.86,-4919.99,12,0
A	goto	1432/0,-2989.51,-4910.05,12,0
A	goto	1432/0,-2993.09,-4945.19,12,0
A	goto	1432/0,-2957.24,-4945.37,12,0
A	goto	1432/0,-2971.58,-4854.31,12,0
A	goto	1432/0,-2998.33,-4868.66,12,0
A	goto	1432/0,-2965.79,-4891.84,12,0
A	goto	1432/0,-2983.99,-4892.58,12,0
A	goto	1432/0,-2955.86,-4919.99,12,0
A	goto	1432/0,-2989.51,-4910.05,12,0
A	goto	1432/0,-2993.09,-4945.19,12,0
A	goto	1432/0,-2957.24,-4945.37
A	complete	307,1
S	
T	label	Exit
A	goto	1432/0,-2972.13,-4836.10,40
A	isOnQuest	307
S	
T	loop	
A	line	Loch Modan,34.38,17.67,35.44,15.34,37.15,10.53,39.38,10.92,38.46,14.43,39.67,18.12,39.84,24.83,37.34,26.82,37.15,24.53,38.85,21.25,37.89,18.88,34.38,17.67
A	goto	1432/0,-2942.06,-4812.55,40,0
A	goto	1432/0,-2971.30,-4769.69,40,0
A	goto	1432/0,-3018.47,-4681.21,40,0
A	goto	1432/0,-3079.98,-4688.38,40,0
A	goto	1432/0,-3054.60,-4752.95,40,0
A	goto	1432/0,-3087.98,-4820.83,40,0
A	goto	1432/0,-3092.67,-4944.27,40,0
A	goto	1432/0,-3023.71,-4980.88,40,0
A	goto	1432/0,-3018.47,-4938.75,40,0
A	goto	1432/0,-3065.36,-4878.41,40,0
A	goto	1432/0,-3038.88,-4834.81,40,0
A	goto	1432/0,-2942.06,-4812.55,40,0
A	complete	416,1
A	mob	Tunnel Rat Vermin
A	mob	Tunnel Rat Kobold
A	mob	Tunnel Rat Scout
A	mob	Tunnel Rat Forager
S	
T	completewith	next
A	collect	3172,3,418,1
A	mob	+Mountain Boar
A	collect	3173,3,418,1
A	mob	+Elder Black Bear
A	collect	3174,3,418,1
A	mob	+Forest Lurker
S	
A	goto	1432/0,-2643.89,-4817.34,30
A	isOnQuest	307
S	
A	goto	1432/0,-2659.34,-4822.300
A	vendor	
A	target	Gothor Brumn
A	isOnQuest	307
S	
A	goto	1432/0,-2676.82,-4825.93
A	turnin	307,2
A	target	Mountaineer Stormpike
S	
T	loop	
A	line	Loch Modan,31.01,24.84,32.69,28.67,34.93,31.55,36.78,33.19,39.65,32.82,38.15,38.16,33.53,40.53,29.87,53.51,29.58,46.54,29.95,39.84,27.09,40.10,29.03,33.44,27.19,29.01,25.77,25.60,23.64,22.20,31.01,24.84
A	goto	1432/0,-2849.11,-4944.45,35,0
A	goto	1432/0,-2895.45,-5014.91,35,0
A	goto	1432/0,-2957.24,-5067.89,35,0
A	goto	1432/0,-3008.26,-5098.06,35,0
A	goto	1432/0,-3087.43,-5091.25,35,0
A	goto	1432/0,-3046.05,-5189.48,35,0
A	goto	1432/0,-2918.62,-5233.08,35,0
A	goto	1432/0,-2817.66,-5471.86,35,0
A	goto	1432/0,-2809.66,-5343.64,35,0
A	goto	1432/0,-2819.87,-5220.39,35,0
A	goto	1432/0,-2740.98,-5225.170,35,0
A	goto	1432/0,-2794.49,-5102.66,35,0
A	goto	1432/0,-2743.74,-5021.16,35,0
A	goto	1432/0,-2704.57,-4958.430,35,0
A	goto	1432/0,-2645.82,-4895.890,35,0
A	goto	1432/0,-2849.11,-4944.45,35,0
A	collect	3172,3,418,1
A	mob	+Mountain Boar
A	collect	3173,3,418,1
A	mob	+Elder Black Bear
A	collect	3174,3,418,1
A	mob	+Forest Lurker
A	xp	<13+5500,1 << Gnome
S	
T	completewith	Boast
A	collect	3172,3,418,1
A	mob	+Mangy Mountain Boar
A	mob	+Mountain Boar
A	collect	3173,3,418,1
A	mob	+Grizzled Black Bear
A	mob	+Elder Black Bear
A	collect	3174,3,418,1
A	mob	+Cliff Lurker
A	mob	+Forest Lurker
A	xp	>13+5500,1 << Gnome
S	
A	goto	1432/0,-3019.30,-5354.50,10,0
A	turnin	6392
A	target	+Brock Stoneseeker
A	goto	1432/0,-3014.88,-5366.820
A	accept	436
A	goto	1432/0,-3020.68,-5358.91
A	target	+Jern Hornhelm
A	xp	>13+5500,1 << Gnome
S	
A	goto	1432/0,-3020.68,-5358.91
A	accept	436
A	target	Jern Hornhelm
A	xp	>13+6550,1 << Gnome
A	isQuestTurnedIn	6392
S	Human
T	loop	
A	line	Loch Modan,31.01,24.84,32.69,28.67,34.93,31.55,36.78,33.19,39.65,32.82,38.15,38.16,33.53,40.53,29.87,53.51,29.58,46.54,29.95,39.84,27.09,40.10,29.03,33.44,27.19,29.01,25.77,25.60,23.64,22.20,31.01,24.84
A	goto	1432/0,-2849.11,-4944.45,50,0
A	goto	1432/0,-2895.45,-5014.91,50,0
A	goto	1432/0,-2957.24,-5067.89,50,0
A	goto	1432/0,-3008.26,-5098.06,50,0
A	goto	1432/0,-3087.43,-5091.25,50,0
A	goto	1432/0,-3046.05,-5189.48,50,0
A	goto	1432/0,-2918.62,-5233.08,50,0
A	goto	1432/0,-2817.66,-5471.86,50,0
A	goto	1432/0,-2809.66,-5343.64,50,0
A	goto	1432/0,-2819.87,-5220.39,50,0
A	goto	1432/0,-2740.98,-5225.170,50,0
A	goto	1432/0,-2794.49,-5102.66,50,0
A	goto	1432/0,-2743.74,-5021.16,50,0
A	goto	1432/0,-2704.57,-4958.430,50,0
A	goto	1432/0,-2645.82,-4895.890,50,0
A	goto	1432/0,-2849.11,-4944.45,50,0
A	xp	13+8675
S	Gnome
T	loop	
A	line	Loch Modan,31.01,24.84,32.69,28.67,34.93,31.55,36.78,33.19,39.65,32.82,38.15,38.16,33.53,40.53,29.87,53.51,29.58,46.54,29.95,39.84,27.09,40.10,29.03,33.44,27.19,29.01,25.77,25.60,23.64,22.20,31.01,24.84
A	goto	1432/0,-2849.11,-4944.45,50,0
A	goto	1432/0,-2895.45,-5014.91,50,0
A	goto	1432/0,-2957.24,-5067.89,50,0
A	goto	1432/0,-3008.26,-5098.06,50,0
A	goto	1432/0,-3087.43,-5091.25,50,0
A	goto	1432/0,-3046.05,-5189.48,50,0
A	goto	1432/0,-2918.62,-5233.08,50,0
A	goto	1432/0,-2817.66,-5471.86,50,0
A	goto	1432/0,-2809.66,-5343.64,50,0
A	goto	1432/0,-2819.87,-5220.39,50,0
A	goto	1432/0,-2740.98,-5225.170,50,0
A	goto	1432/0,-2794.49,-5102.66,50,0
A	goto	1432/0,-2743.74,-5021.16,50,0
A	goto	1432/0,-2704.57,-4958.430,50,0
A	goto	1432/0,-2645.82,-4895.890,50,0
A	goto	1432/0,-2849.11,-4944.45,50,0
A	xp	13+6545
A	xp	<13+5500,1
A	isOnQuest	6392
S	Gnome
T	completewith	next
A	goto	1432/0,-3266.44,-5656.19,50,0
A	goto	1432/0,-3354.99,-5726.64,50,0
A	goto	1432/0,-3425.60,-5738.42,50,0
A	goto	1432/0,-3781.98,-5702.54,20
S	Gnome
T	completewith	Boast
A	goto	1432/0,-3781.98,-5702.54
A	vendor	1214
A	isQuestAvailable	298
S	Gnome
A	accept	298
A	target	+Prospector Ironband
A	goto	1432/0,-3812.59,-5694.63
A	turnin	436
A	goto	1432/0,-3783.63,-5713.77
A	target	+Magmar Fellhew
A	isOnQuest	436
S	Gnome
T	label	ExcavationP
A	goto	1432/0,-3812.59,-5694.63
A	accept	298
A	target	Prospector Ironband
A	isQuestTurnedIn	436
S	Gnome
T	completewith	next
A	goto	1432/0,-3816.18,-5786.250,30,0
A	goto	1432/0,-4013.68,-5791.58,40,0
A	goto	1432/0,-4124.56,-5742.100,40,0
A	goto	1432/0,-4258.62,-5650.48,15,0
A	goto	1432/0,-4296.41,-5694.63,20
S	Gnome
T	label	Boast
A	goto	1432/0,-4296.41,-5694.63
A	accept	257
A	target	Daryl The Youngling
A	isOnQuest	298
S	Gnome
T	loop	
A	line	Loch Modan,79.89,65.91,76.70,74.44,74.74,69.21,77.03,60.55,76.09,57.94,77.39,55.98,79.63,59.85,79.89,65.91
A	goto	1432/0,-4197.38,-5699.97,45,0
A	goto	1432/0,-4109.39,-5856.89,45,0
A	goto	1432/0,-4055.33,-5760.68,45,0
A	goto	1432/0,-4118.49,-5601.37,45,0
A	goto	1432/0,-4092.57,-5553.35,45,0
A	goto	1432/0,-4128.42,-5517.30,45,0
A	goto	1432/0,-4190.21,-5588.49,45,0
A	goto	1432/0,-4197.38,-5699.97,45,0
A	complete	257,1
A	mob	Mountain Buzzard
A	isOnQuest	257
S	Gnome
T	completewith	next
A	goto	1432/0,-4258.62,-5650.48,15,0
A	goto	1432/0,-4296.41,-5694.63,20
S	Gnome
A	goto	1432/0,-4296.41,-5694.63
A	turnin	257,2
A	target	Daryl The Youngling
A	isQuestComplete	257
S	Gnome
T	loop	
A	line	Loch Modan,31.01,24.84,32.69,28.67,34.93,31.55,36.78,33.19,39.65,32.82,38.15,38.16,33.53,40.53,29.87,53.51,29.58,46.54,29.95,39.84,27.09,40.10,29.03,33.44,27.19,29.01,25.77,25.60,23.64,22.20,31.01,24.84
A	goto	1432/0,-2849.11,-4944.45,50,0
A	goto	1432/0,-2895.45,-5014.91,50,0
A	goto	1432/0,-2957.24,-5067.89,50,0
A	goto	1432/0,-3008.26,-5098.06,50,0
A	goto	1432/0,-3087.43,-5091.25,50,0
A	goto	1432/0,-3046.05,-5189.48,50,0
A	goto	1432/0,-2918.62,-5233.08,50,0
A	goto	1432/0,-2817.66,-5471.86,50,0
A	goto	1432/0,-2809.66,-5343.64,50,0
A	goto	1432/0,-2819.87,-5220.39,50,0
A	goto	1432/0,-2740.98,-5225.170,50,0
A	goto	1432/0,-2794.49,-5102.66,50,0
A	goto	1432/0,-2743.74,-5021.16,50,0
A	goto	1432/0,-2704.57,-4958.430,50,0
A	goto	1432/0,-2645.82,-4895.890,50,0
A	goto	1432/0,-2849.11,-4944.45,50,0
A	collect	3172,3,418,1
A	mob	+Mangy Mountain Boar
A	mob	+Mountain Boar
A	collect	3173,3,418,1
A	mob	+Grizzled Black Bear
A	mob	+Elder Black Bear
A	collect	3174,3,418,1
A	mob	+Cliff Lurker
A	mob	+Forest Lurker
S	Gnome
T	loop	
A	line	Loch Modan,31.01,24.84,32.69,28.67,34.93,31.55,36.78,33.19,39.65,32.82,38.15,38.16,33.53,40.53,29.87,53.51,29.58,46.54,29.95,39.84,27.09,40.10,29.03,33.44,27.19,29.01,25.77,25.60,23.64,22.20,31.01,24.84
A	goto	1432/0,-2849.11,-4944.45,50,0
A	goto	1432/0,-2895.45,-5014.91,50,0
A	goto	1432/0,-2957.24,-5067.89,50,0
A	goto	1432/0,-3008.26,-5098.06,50,0
A	goto	1432/0,-3087.43,-5091.25,50,0
A	goto	1432/0,-3046.05,-5189.48,50,0
A	goto	1432/0,-2918.62,-5233.08,50,0
A	goto	1432/0,-2817.66,-5471.86,50,0
A	goto	1432/0,-2809.66,-5343.64,50,0
A	goto	1432/0,-2819.87,-5220.39,50,0
A	goto	1432/0,-2740.98,-5225.170,50,0
A	goto	1432/0,-2794.49,-5102.66,50,0
A	goto	1432/0,-2743.74,-5021.16,50,0
A	goto	1432/0,-2704.57,-4958.430,50,0
A	goto	1432/0,-2645.82,-4895.890,50,0
A	goto	1432/0,-2849.11,-4944.45,50,0
A	xp	13+6780
A	isOnQuest	298
S	
T	sticky	
T	label	Kadrell
A	goto	1432/0,-2902.07,-5398.28,40,0
A	goto	1432/0,-2945.10,-5360.20,40,0
A	goto	1432/0,-3015.71,-5335.73,40,0
A	goto	1432/0,-3025.09,-5318.44,40,0
A	goto	1432/0,-3017.64,-5274.66
A	turnin	416,2
A	target	Mountaineer Kadrell
S	Gnome
A	goto	1432/0,-3019.30,-5354.50,10,0
A	turnin	6392
A	target	+Brock Stoneseeker
A	goto	1432/0,-3014.88,-5366.820
A	turnin	298
A	accept	301
A	goto	1432/0,-3020.68,-5358.91
A	target	+Jern Hornhelm
A	isOnQuest	298
S	Gnome
A	goto	1432/0,-3019.30,-5354.50,10,0
A	turnin	6392
A	target	Brock Stoneseeker
A	goto	1432/0,-3014.88,-5366.820
A	accept	301
A	goto	1432/0,-3020.68,-5358.91
A	target	+Jern Hornhelm
A	isQuestTurnedIn	298
S	Gnome
A	goto	1432/0,-3019.30,-5354.50,10,0
A	goto	1432/0,-3014.88,-5366.820
A	turnin	6392
A	target	Brock Stoneseeker
S	
T	completewith	next
A	goto	1432/0,-2966.06,-5365.72,12,0
A	goto	1432/0,-2969.92,-5377.12,12,0
A	goto	1432/0,-2954.42,-5394.10,10
S	
A	goto	1432/0,-2954.42,-5394.10
A	accept	418
A	turnin	418
A	target	Vidra Hearthstove
S	
A	goto	1432/0,-2952.55,-5381.91
A	skill	cooking,10
S	
A	goto	1432/0,-2952.55,-5381.91
A	vendor	
A	isOnQuest	1338
S	
T	completewith	next
T	requires	Kadrell
S	
T	requires	Kadrell
A	goto	1432/0,-2929.93,-5424.95
A	fly	Ironforge
A	target	Thorgrum Borrelson
A	isOnQuest	1338
S	Gnome
A	goto	1455/0,-1303.71,-4631.08
A	turnin	301
A	target	Prospector Stormpike
A	isOnQuest	301
S	skip
T	completewith	Monty
A	goto	1455/0,-1305.14,-4615.09,-1
A	goto	1455/0,-1158.00,-4816.48,-1
A	goto	1455/0,-1317.71,-4839.48,30
S	
A	goto	1455/0,-1249.87,-4793.31
A	vendor	5175
A	target	Gearcutter Cogspinner
A	itemcount	4371,<1
S	Gnome
T	label	Monty
A	goto	1455/0,-1317.71,-4839.48,30,0
A	accept	6661
A	target	Monty
S	Gnome
A	complete	6661,1
A	target	Deeprun Rat
A	use	17117
S	
A	turnin	6661
A	timer	13,Deeprun Rat Roundup RP << Gnome
A	accept	6662
A	target	Monty
A	zoneskip	Stormwind City
S	
A	turnin	6662
A	target	Nipsy
A	isOnQuest	6662
S	
T	label	Monty << Human
A	zone	Stormwind City
A	isOnQuest	1338
S	
T	completewith	next
A	goto	1453/0,574.95,-8388.30,20,0
A	goto	1453/0,614.33,-8380.77,20,0
A	goto	1453/0,638.26,-8342.22,15
S	
A	goto	1453/0,638.26,-8342.22
A	vendor	5519
A	target	Billibub Cogspinner
A	itemcount	4371,<1
S	
A	goto	1453/0,600.08,-8427.20
A	turnin	1338
A	target	Furen Longbeard
S	
T	completewith	next
A	goto	1453/0,663.94,-8451.76,20,0
A	goto	1453/0,686.79,-8473.27,20,0
A	goto	1453/0,678.86,-8562.64,20,0
A	goto	1453/0,711.26,-8587.38,20,0
A	goto	1453/0,737.60,-8557.89,12,0
A	goto	1453/0,719.86,-8550.36,12
S	
A	goto	1453/0,719.86,-8550.36
A	accept	399
A	target	Baros Alexston
S	
T	completewith	next
A	goto	1453/0,739.49,-8661.68,15,0
A	goto	1453/0,720.67,-8699.06,15,0
A	goto	1453/0,728.33,-8718.06,15,0
A	goto	1453/0,699.16,-8743.88,15,0
A	goto	1453/0,674.29,-8775.79,15,0
A	goto	1453/0,686.25,-8815.41,8,0
A	goto	1453/0,684.24,-8820.34,4,0
A	goto	1453/0,687.46,-8818.01,6,0
A	goto	1453/0,854.42,-8965.28,12,0
A	link	https://youtu.be/gV8-wgQEomc
A	goto	1453/0,861.95,-8990.47,10
S	
A	goto	1453/0,861.95,-8990.47
A	accept	1861
A	trainer	
A	target	Jennea Cannon
S	
T	completewith	next
A	goto	1453/0,887.22,-9017.80,10,0
A	goto	1453/0,871.36,-9013.14,10,0
A	goto	1453/0,868.8,-9004.27,8,0
A	goto	1453/0,877.00,-9008.03,6,0
A	goto	1453/0,863.96,-9001.40,8,0
A	goto	1453/0,928.62,-9010.10,15,0
A	goto	1453/0,962.63,-8990.73,15,0
A	goto	1453/0,949.86,-9009.380,10,0
A	goto	1453/0,942.34,-9001.49,8,0
A	goto	1453/0,948.65,-8994.50,10
S	
A	goto	1453/0,948.65,-8994.50
A	vendor	1307
A	money	<0.0120
A	target	Charys Yserian
S	
T	completewith	next
A	goto	1453/0,852.40,-8920.10,20,0
A	goto	1453/0,829.01,-8901.28,20,0
A	goto	1453/0,789.22,-8904.59,20,0
A	goto	1453/0,758.31,-8878.78,20,0
A	goto	1453/0,810.33,-8832.44,20,0
A	goto	1453/0,827.54,-8850.19,15,0
A	goto	1453/0,822.16,-8865.60,10
A	money	<0.0090
S	
A	goto	1453/0,822.16,-8865.60
A	vendor	1316
A	money	<0.0090
A	target	Adair Gilroy
S	skip
T	completewith	next
A	goto	1453/0,661.38,-8858.16,12,0
A	goto	1453/0,680.61,-8829.39,12,0
A	goto	1453/0,717.44,-8847.32,12,0
A	goto	1453/0,693.24,-8891.51,12,0
A	goto	1453/0,681.28,-8888.01,10
S	skip
A	goto	1453/0,681.28,-8888.01
A	collect	1941,1,116,1
A	target	Roberto Pupellyverbos
S	
T	completewith	next
A	goto	1453/0,680.61,-8828.67,15,0
A	goto	1453/0,635.44,-8863.81,8
A	money	<0.01
S	
A	goto	1453/0,635.44,-8863.81
A	vendor	1257
A	money	<0.01
A	target	Keldric Boucher
S	
T	completewith	Bank
A	goto	1453/0,637.59,-8889.81,10
S	
A	goto	1453/0,614.33,-8932.92
A	bankdeposit	769,4371,730,7207,1941,1711,1478,1712,3012,1180,1181,3013,6889
A	target	Newton Burnside
S	skip
A	goto	1453/0,614.33,-8932.92
A	bankdeposit	769,4371,7207
A	target	Newton Burnside
A	itemcount	769,1
A	itemcount	4371,1
A	itemcount	7207,1
S	skip
A	goto	1453/0,614.33,-8932.92
A	bankdeposit	769,730,7207
A	target	Newton Burnside
A	itemcount	769,1
A	itemcount	730,1
A	itemcount	7207,1
S	skip
A	goto	1453/0,614.33,-8932.92
A	bankdeposit	4371,730,7207
A	target	Newton Burnside
A	itemcount	4371,1
A	itemcount	730,1
A	itemcount	7207,1
S	skip
A	goto	1453/0,614.33,-8932.92
A	bankdeposit	769,7207
A	target	Newton Burnside
A	itemcount	769,1
A	itemcount	7207,1
S	skip
A	goto	1453/0,614.33,-8932.92
A	bankdeposit	4371,7207
A	target	Newton Burnside
A	itemcount	4371,1
A	itemcount	7207,1
S	skip
A	goto	1453/0,614.33,-8932.92
A	bankdeposit	730,7207
A	target	Newton Burnside
A	itemcount	730,1
A	itemcount	7207,1
S	skip
A	goto	1453/0,614.33,-8932.92
A	bankdeposit	7207
A	target	Newton Burnside
A	itemcount	7207,1
S	
T	completewith	next
A	goto	1453/0,662.46,-8860.76,10,0
A	goto	1453/0,673.75,-8867.93,10
A	target	Innkeeper Allison
S	
A	goto	1453/0,673.75,-8867.93
A	hs	
A	target	Innkeeper Allison
A	zoneskip	Darkshore
E
G	Guides/forever/Alliance-ADV-AoE-Mage-1-22.lua
M	classic	
M	tbc	
M	selector	Alliance Mage
M	name	14-16 ADV Darkshore 2 Mage AoE
M	version	2
M	group	RestedXP ADV AoE Alliance Mage
M	defaultfor	Human Mage/Gnome Mage
M	next	16-18 ADV Westfall Mage AoE
S	
T	completewith	DeepO
S	
A	goto	1439/1,533.23,6399.77
A	collect	4592,20,982,1
A	target	Laird
A	isQuestAvailable	982
S	
A	accept	947
A	target	+Barithras Moonshade
A	goto	1439/1,497.21,6427.72
A	accept	4811
A	goto	1439/1,473.63,6439.07
A	target	+Sentinel Glynda Nal'Shea
S	
T	label	DeepO
A	goto	1439/1,445.46,6536.01
A	accept	982
A	target	Gorbold Steelhand
S	
A	goto	1439/1,492.62,6580.99
A	turnin	4761
A	accept	4762
A	target	Thundris Windweaver
S	
T	completewith	MistV
A	goto	1439/1,592.18,6666.14,50,0
A	goto	1439/1,565.33,6925.96,50,0
A	goto	1439/1,478.21,6985.78,50,0
A	complete	1001,1
A	mob	Darkshore Thresher
S	
A	goto	1439/1,438.91,7077.48
A	complete	982,1
S	
T	label	MistV
A	goto	1439/1,349.18,7133.81
A	complete	982,2
S	
A	goto	1439/1,292.85,7083.16,50,0
A	goto	1439/1,592.18,6666.14,50,0
A	goto	1439/1,565.33,6925.96,50,0
A	goto	1439/1,478.21,6985.78,50,0
A	goto	1439/1,292.85,7083.16,50,0
A	goto	1439/1,592.18,6666.14,50,0
A	goto	1439/1,565.33,6925.96,50,0
A	goto	1439/1,478.21,6985.78
A	complete	1001,1
A	mob	Darkshore Thresher
S	
T	completewith	next
S	
A	goto	1439/1,196.56,6958.71
A	accept	4723
S	
A	goto	1439/1,193.29,7084.03
A	turnin	1001
A	accept	1002
S	
T	completewith	SeaTurtle1
A	goto	1439/1,81.28,7118.96,50,0
A	collect	5469,5,2178,1
A	mob	Foreststrider Fledgeling
S	
T	completewith	SeaTurtle1
A	complete	1002,1
A	mob	Moonstalker Runt
A	mob	Moonstalker
S	
T	completewith	next
A	complete	2138,1
A	mob	Rabid Thistle Bear
S	
T	label	SeaTurtle1
A	goto	1439/1,46.57,7433.8,80
A	isQuestAvailable	4725
S	
T	completewith	next
S	
A	goto	1439/1,46.57,7433.800
A	accept	4725
S	
T	completewith	River
A	collect	5469,5,2178,1
A	mob	Foreststrider Fledgeling
S	
T	completewith	River
A	complete	1002,1
A	mob	Moonstalker Runt
A	mob	Moonstalker
S	
T	completewith	RedC
A	complete	2138,1
A	mob	Rabid Thistle Bear
S	
T	label	River
A	goto	1439/1,-383.77,7222.89
A	complete	4762,1
A	use	12350
S	
T	completewith	RedC
A	collect	5469,5,2178,1
A	mob	Foreststrider
S	
T	completewith	RedC
A	complete	1002,1
A	mob	Moonstalker Runt
A	mob	Moonstalker
S	
T	label	RedC
A	goto	1439/1,-144.04,6209.82,400
A	isOnQuest	4811
S	
T	completewith	Bash
A	collect	5469,5,2178,1
A	mob	Foreststrider Fledgling
S	
T	completewith	Bash
A	complete	1002,1
A	mob	Moonstalker Runt
S	
A	goto	1439/1,-144.04,6209.82
A	complete	4811,1
S	
T	label	Bash
A	goto	1439/1,166.43,5633.86,175
A	isOnQuest	957
S	
T	completewith	next
A	goto	1439/1,161.19,5684.51,0
A	complete	963,1
A	unitscan	Anaya Dawnrunner
S	
A	goto	1439/1,166.43,5633.86
A	complete	957,1
S	
A	goto	1439/1,161.19,5684.51,50,0
A	goto	1439/1,108.79,5608.10,50,0
A	goto	1439/1,155.95,5757.00,50,0
A	goto	1439/1,161.19,5684.51,50,0
A	goto	1439/1,108.79,5608.10,50,0
A	goto	1439/1,155.95,5757.00,50,0
A	goto	1439/1,161.19,5684.51,50,0
A	goto	1439/1,108.79,5608.10
A	complete	963,1
A	unitscan	Anaya Dawnrunner
S	
T	completewith	RBears
A	collect	5469,5,2178,1
A	mob	Foreststrider Fledgling
S	
T	completewith	RBears
A	complete	1002,1
A	mob	Moonstalker Runt
A	mob	Moonstalker
S	
T	completewith	next
S	
T	label	BeachedST
A	goto	1439/1,511.62,5618.58
A	accept	4722
S	
T	loop	
A	line	Darkshore,38.74,58.10,39.91,58.50,39.23,63.60,39.87,66.31,39.98,70.55,37.40,70.05,38.63,67.72,38.50,63.73,38.74,58.10
A	goto	1439/1,404.20,5796.300,45,0
A	goto	1439/1,327.56,5778.830,45,0
A	goto	1439/1,372.10,5556.130,45,0
A	goto	1439/1,330.18,5437.80,45,0
A	goto	1439/1,322.98,5252.65,45,0
A	goto	1439/1,491.97,5274.48,45,0
A	goto	1439/1,411.40,5376.23,45,0
A	goto	1439/1,419.92,5550.46,45,0
A	goto	1439/1,404.20,5796.300,45,0
A	complete	2138,1
A	mob	Rabid Thistle Bear
S	
T	label	RBears
T	loop	
A	line	Darkshore,39.26,56.72,40.21,56.23,39.96,55.22,39.90,54.38,40.24,53.47,39.21,53.01,39.90,54.38
A	goto	1439/1,370.14,5856.56,50,0
A	goto	1439/1,307.91,5877.96,50,0
A	goto	1439/1,324.29,5922.06,50,0
A	goto	1439/1,328.22,5958.74,50,0
A	goto	1439/1,305.95,5998.48,50,0
A	goto	1439/1,373.41,6018.56,50,0
A	goto	1439/1,328.22,5958.74,50,0
A	complete	985,1
A	mob	+Blackwood Pathfinder
A	complete	985,2
A	mob	+Blackwood Windtalker
S	
T	completewith	Auberdine
A	complete	1002,1
A	mob	Moonstalker Runt
S	
T	loop	
A	line	Darkshore,38.63,51.25,38.33,50.00,38.18,48.42,38.73,47.62,39.49,47.65,41.40,47.13,41.67,49.47,41.45,50.84,38.63,51.25
A	goto	1439/1,411.40,6095.42,50,0
A	goto	1439/1,431.05,6150.00,50,0
A	goto	1439/1,440.88,6218.99,50,0
A	goto	1439/1,404.85,6253.93,50,0
A	goto	1439/1,355.07,6252.62,50,0
A	goto	1439/1,229.97,6275.32,50,0
A	goto	1439/1,212.28,6173.14,50,0
A	goto	1439/1,226.69,6113.32,50,0
A	goto	1439/1,411.40,6095.42,50,0
A	collect	5469,5,2178,1
A	mob	Foreststrider Fledgling
S	
T	label	Auberdine
A	goto	1439/1,543.06,6342.57,150
A	isOnQuest	982
S	
A	goto	1439/1,536.51,6365.28,12,0
A	goto	1439/1,543.06,6342.57
A	turnin	4722
A	turnin	4723
A	turnin	4725
A	target	Gwennyth Bly'Leggonde
S	
A	goto	1439/1,533.23,6399.77
A	vendor	
A	collect	4592,20,4763,1
A	target	Laird
A	isOnQuest	982
S	
A	goto	1439/1,539.13,6409.82,12,0
A	goto	1439/1,600.70,6425.100
A	turnin	963
A	target	Cerellean Whiteclaw
S	
T	completewith	CliffRi
A	use	5611
A	itemcount	5611,1
A	itemStat	17,LEVEL,<16
S	
A	goto	1439/1,533.23,6399.77
A	collect	1205,15,4763,1
A	target	Allyndia
A	money	<0.1500
S	
A	goto	1439/1,533.23,6399.77
A	collect	1205,10,4763,1
A	target	Allyndia
A	money	<0.1000
S	
A	goto	1439/1,533.23,6399.77
A	collect	1205,5,4763,1
A	target	Allyndia
A	money	<0.0500
S	
T	completewith	next
A	goto	1439/1,488.69,6451.300,20,0
A	goto	1439/1,487.38,6481.870,20,0
A	goto	1439/1,489.35,6506.32,15
S	
A	goto	1439/1,489.35,6506.32
A	accept	729
A	target	Archaeologist Hollee
S	
A	goto	1439/1,488.69,6564.830
A	vendor	4182
A	target	Dalmond
A	money	<0.0500
A	money	>0.2500
S	
A	goto	1439/1,488.69,6564.830
A	vendor	4182
A	target	Dalmond
A	money	<0.2500
S	
T	label	CliffRi
A	goto	1439/1,492.62,6580.99
A	turnin	4762
A	accept	4763
A	target	Thundris Windweaver
S	
A	goto	1439/1,472.97,6557.85
A	accept	2178
A	turnin	2178
A	target	Alanndarian Nightsong
S	
T	label	DeepO
A	goto	1439/1,445.46,6536.01
A	turnin	982,2
A	target	Gorbold Steelhand
S	
T	completewith	next
A	goto	1439/1,476.25,6479.25,15,0
A	goto	1439/1,478.21,6446.50,15,0
A	goto	1439/1,473.63,6439.07,20
S	
A	goto	1439/1,473.63,6439.07
A	turnin	4811
A	accept	4812
A	target	Sentinel Glynda Nal'Shea
S	
A	goto	1439/1,465.11,6416.80
A	collect	12347,1,4763,1
A	collect	14339,1,4812,1
A	use	12346
A	use	14338
S	
A	turnin	2138
A	accept	2139
A	target	+Tharnariun Treetender
A	goto	1439/1,397.65,6437.33
A	turnin	985
A	accept	986
A	target	+Terenthis
A	goto	1439/1,362.93,6434.27
A	accept	965
A	goto	1439/1,369.48,6449.99,8,0
A	goto	1439/1,384.55,6431.65
A	target	+Sentinel Elissa Starbreeze
S	Gnome
T	completewith	next
A	use	4786
A	itemcount	4786,1
A	itemStat	6,LEVEL,<20
S	
A	goto	1439/1,-157.79,6206.770
A	turnin	4812
A	accept	4813
S	
T	completewith	GrainSample
A	complete	1002,1
A	mob	Moonstalker Runt
A	mob	Moonstalker
S	
A	goto	1439/1,47.88,6748.67
A	turnin	957,3
A	target	Asterion
S	
T	label	GrainSample
A	goto	1439/1,-376.56,6805.87
A	collect	12342,1,4673,1
S	
T	completewith	next
A	complete	1002,1
A	mob	Moonstalker
S	
T	completewith	DenM
A	goto	1439/1,-485.95,6763.95,20,0
A	goto	1439/1,-489.88,6724.22,20,0
A	goto	1439/1,-436.82,6694.96,30
S	
A	goto	1439/1,-432.24,6664.39
A	complete	2139,1
A	mob	Den Mother
A	itemcount	4358,<1
S	
T	label	DenM
A	goto	1439/1,-432.24,6664.39
A	complete	2139,1
A	mob	Den Mother
A	itemcount	4358,1
S	
T	completewith	Talisman
A	complete	1002,1
A	mob	Moonstalker
S	
A	goto	1439/1,-451.23,6870.06
A	collect	12343,1,4673,1
S	
A	goto	1439/1,-520.01,6873.99
A	collect	12341,1,4673,1
S	
T	completewith	next
A	goto	1439/1,-497.74,6887.53
A	cast	16072
A	timer	20,The Blackwood Corrupted RP
A	use	12347
S	
T	label	Talisman
A	goto	1439/1,-480.05,6888.84
A	complete	4763,1
A	mob	Xabraxxis
S	
A	goto	1439/1,-417.83,7262.19
A	turnin	1002
A	accept	1003
A	isQuestComplete	1002
S	
A	goto	1439/1,-417.83,7262.19
A	accept	1003
A	isQuestTurnedIn	1002
S	
T	completewith	next
A	goto	1439/1,-578.30,6956.96,60,0
A	goto	1439/1,-629.39,7042.98,60,0
A	goto	1439/1,-538.35,7099.75,60,0
A	goto	1439/1,-499.70,7221.14,60,0
A	goto	1439/1,-674.59,7333.80,60,0
A	goto	1439/1,-637.91,7415.02,60,0
A	complete	1002,1
A	mob	Moonstalker
S	
A	goto	1439/1,-537.04,7542.970
A	accept	4727
S	
A	goto	1439/1,-578.30,6956.96,60,0
A	goto	1439/1,-629.39,7042.98,60,0
A	goto	1439/1,-538.35,7099.75,60,0
A	goto	1439/1,-499.70,7221.14,60,0
A	goto	1439/1,-674.59,7333.80,60,0
A	goto	1439/1,-637.91,7415.02,60,0
A	goto	1439/1,-578.30,6956.96,60,0
A	goto	1439/1,-629.39,7042.98,60,0
A	goto	1439/1,-538.35,7099.75,60,0
A	goto	1439/1,-499.70,7221.14,60,0
A	goto	1439/1,-674.59,7333.80,60,0
A	goto	1439/1,-637.91,7415.02
A	complete	1002,1
A	mob	Moonstalker
S	
A	goto	1439/1,-417.83,7262.19
A	turnin	1002
A	accept	1003
S	
A	goto	1439/1,-658.87,7246.47
A	turnin	965
A	accept	966
A	target	Balthule Shadowstrike
S	
A	goto	1439/1,-684.41,7176.60,50,0
A	goto	1439/1,-749.91,7153.90,50,0
A	goto	1439/1,-875.02,7228.570,50,0
A	goto	1439/1,-684.41,7176.60,50,0
A	goto	1439/1,-749.91,7153.90
A	complete	966,1
A	mob	Dark Strand Fanatic
S	
A	goto	1439/1,-658.87,7246.47
A	turnin	966
A	accept	967
A	target	Balthule Shadowstrike
S	
T	label	CapCave
T	completewith	CapCave1
A	goto	1439/1,-660.83,6873.99,30
S	skip
T	requires	CapCave
T	completewith	CapCave1
S	
T	completewith	next
A	goto	1439/1,-663.45,6877.49,8,0
A	goto	1439/1,-679.17,6848.67,8,0
A	goto	1439/1,-666.73,6819.41,8,0
A	goto	1439/1,-680.48,6779.67,8,0
A	complete	947,1,4
S	
A	goto	1439/1,-690.31,6751.29,12,0
A	goto	1439/1,-706.68,6748.23,12,0
A	goto	1439/1,-719.13,6787.530,12,0
A	complete	947,2
S	
T	label	CapCave1
A	goto	1439/1,-663.45,6877.49,8,0
A	goto	1439/1,-679.17,6848.67,8,0
A	goto	1439/1,-666.73,6819.41,8,0
A	goto	1439/1,-680.48,6779.67
A	complete	947,1
S	skip
A	goto	1439/1,-658.21,6825.96
A	goto	1439/1,210.32,6739.501,30
A	isOnQuest	4763
S	
T	completewith	next
A	subzone	442
A	isOnQuest	4763
S	
A	goto	1439/1,492.62,6580.99
A	turnin	4763,1
A	target	Thundris Windweaver
S	
A	goto	1439/1,488.69,6564.830
A	vendor	4182
A	target	Dalmond
S	
A	goto	1439/1,397.65,6437.33
A	turnin	2139,1
A	target	Tharnariun Treetender
S	
A	turnin	4813,2
A	target	+Sentinel Glynda Nal'Shea
A	goto	1439/1,473.63,6439.07
A	turnin	947
A	accept	948
A	target	+Barithras Moonshade
A	goto	1439/1,497.21,6427.72
A	accept	4740
A	goto	1439/1,503.76,6402.39
S	
A	goto	1439/1,533.23,6399.77
A	collect	4592,40,729,1
A	target	Laird
S	
A	goto	1439/1,543.06,6342.57
A	turnin	4727
A	target	Gwennyth Bly'Leggonde
S	
A	goto	1439/1,515.55,6406.32
A	hs	
A	target	Innkeeper Shaussiy
A	zoneskip	Stormwind City
E
G	Guides/forever/Alliance-ADV-AoE-Mage-1-22.lua
M	classic	
M	tbc	
M	selector	Alliance Mage
M	name	16-18 ADV Westfall Mage AoE
M	version	2
M	group	RestedXP ADV AoE Alliance Mage
M	defaultfor	Human Mage/Gnome Mage
M	next	18-20 ADV Darkshore 3 Mage AoE
S	
T	completewith	JenneaT
S	skip
T	completewith	next
A	goto	1453/0,661.38,-8858.16,12,0
A	goto	1453/0,680.61,-8829.39,12,0
A	goto	1453/0,717.44,-8847.32,12,0
A	goto	1453/0,693.24,-8891.51,12,0
A	goto	1453/0,681.28,-8888.01,10
S	skip
A	goto	1453/0,681.28,-8888.01
A	collect	1941,1,116,1
A	target	Roberto Pupellyverbos
S	
T	sticky	
T	label	Bank2
A	bankdeposit	17056,5354,2592,6889
A	target	Newton Burnside
S	
A	goto	1453/0,614.33,-8932.92
A	bankwithdraw	730,7207
A	bankwithdraw	730,16115
A	target	Newton Burnside
S	
T	requires	Bank2
T	completewith	next
A	goto	1453/0,686.25,-8815.41,8,0
A	goto	1453/0,684.24,-8820.34,4,0
A	goto	1453/0,687.46,-8818.01,6,0
A	goto	1453/0,854.42,-8965.28,12,0
A	link	https://youtu.be/gV8-wgQEomc
A	goto	1453/0,861.95,-8990.47,10
S	
T	requires	Bank2
T	label	JenneaT
A	goto	1453/0,861.95,-8990.47
A	trainer	
A	target	Jennea Cannon
S	
A	goto	1453/0,635.44,-8863.81
A	vendor	1257
A	target	Keldric Boucher
A	money	<0.14
S	
T	completewith	next
A	goto	1453/0,618.90,-8796.58,12,0
A	goto	1453/0,612.99,-8795.96,10
S	
A	goto	1453/0,612.99,-8795.96
A	train	1180
A	target	Woo Ping
S	
T	completewith	next
A	goto	1453/0,612.45,-8806.18,12,0
A	goto	1453/0,528.43,-8850.28,20,0
A	goto	1453/0,532.20,-8863.72,15,0
A	goto	1453/0,490.12,-8835.67,10
S	Human
A	goto	1453/0,490.12,-8835.67
A	turnin	6261
A	accept	6285
A	target	Dungar Longdrink
S	
T	completewith	next << Human
A	goto	1453/0,490.12,-8835.67
A	fp	Stormwind City
A	fly	Westfall
A	target	Dungar Longdrink
A	zoneskip	Westfall << Human
S	Gnome
T	completewith	next
T	label	Stormwind1
A	goto	1453/0,494.56,-8865.78,12,0
A	goto	1453/0,495.77,-8870.44,8,0
A	goto	1453/0,504.24,-8956.31,40
S	Gnome
T	completewith	next
A	goto	1429/0,421.28,-9104.28,40
S	skip
T	completewith	next
T	requires	Stormwind1
A	goto	1429/0,44.35,-9458.41,30
S	skip
T	label	GoldshireTrain
A	goto	1429/0,34.28,-9472.99
A	accept	1919
A	trainer	
S	skip
A	goto	1429/0,8.25,-9460.03
A	collect	1939,1,116,1
A	target	Barkeep Dobbins
S	skip
A	goto	1429/0,16.23,-9462.580
A	collect	1205,45,64,1
A	target	Innkeeper Farley
A	money	<0.45
S	Gnome
A	goto	1429/0,529.57,-9363.050
A	use	7207
A	complete	1861,1
S	
A	accept	64
A	accept	109
A	target	+Farmer Furlbrow
A	goto	1436/0,918.42,-9851.50
A	accept	36
A	accept	151
A	goto	1436/0,919.82,-9852.90
A	target	+Verna Furlbrow
S	Gnome
T	completewith	Gryan
A	complete	151,1
S	
A	accept	9
A	target	+Farmer Saldean
A	goto	1436/0,1055.27,-10128.70
A	turnin	36
A	accept	38
A	accept	22
A	goto	1436/0,1041.97,-10112.13
A	target	+Salma Saldean
S	Gnome
T	completewith	Gryan
A	goto	1436/0,1142.77,-10140.13,60,0
A	complete	9,1
A	collect	814,5,103,1
A	collect	1274,5,117,1
A	mob	Harvest Watcher
A	mob	Harvest Golem
S	Gnome
T	completewith	next
A	collect	723,8,22,1
A	mob	+Young Goretusk
A	collect	731,3,38,1
A	mob	+Young Goretusk
A	collect	729,3,38,1
A	mob	+Young Fleshripper
S	
T	label	Gryan << Gnome
A	turnin	109
A	accept	65
A	accept	12
A	target	+Gryan Stoutmantle
A	goto	1436/0,1045.12,-10508.80
A	turnin	6285
A	goto	1436/0,1021.60,-10500.61 << Human
A	accept	102
A	goto	1436/0,1041.97,-10511.13 << Gnome
A	target	+Captain Danuvin << Gnome
A	target	+Quartermaster Lewis << Human
S	
A	goto	1436/0,1127.37,-10636.43
A	accept	153
A	target	Scout Galiaan
S	
A	goto	1436/0,1166.57,-10653.47
A	collect	1205,45,64,1
A	target	Innkeeper Heather
A	money	<0.45
S	
A	goto	1436/0,1166.57,-10653.47
A	collect	1205,40,64,1
A	target	Innkeeper Heather
A	money	<0.40
S	
A	goto	1436/0,1166.57,-10653.47
A	collect	1205,35,64,1
A	target	Innkeeper Heather
A	money	<0.35
S	
A	goto	1436/0,1166.57,-10653.47
A	collect	1205,30,64,1
A	target	Innkeeper Heather
A	money	<0.30
S	
A	goto	1436/0,1166.57,-10653.47
A	collect	1205,25,64,1
A	target	Innkeeper Heather
A	money	<0.25
S	
A	goto	1436/0,1166.57,-10653.47
A	collect	1205,20,64,1
A	target	Innkeeper Heather
A	money	<0.20
S	
A	goto	1436/0,1166.57,-10653.47
A	collect	1205,15,64,1
A	target	Innkeeper Heather
A	money	<0.15
S	
A	goto	1436/0,1166.57,-10653.47
A	collect	1205,10,64,1
A	target	Innkeeper Heather
A	money	<0.10
S	
A	goto	1436/0,1166.57,-10653.47
A	collect	1205,5,64,1
A	target	Innkeeper Heather
A	money	<0.05
S	
T	completewith	Grayson
A	complete	151,1
S	
T	completewith	Oil
A	collect	723,8,22,1
A	mob	+Goretusk
A	collect	731,3,38,1
A	mob	+Goretusk
A	collect	729,3,38,1
A	mob	+Fleshripper
S	
T	completewith	Compass
A	goto	1436/0,1635.92,-10621.27,60,0
A	complete	9,1
A	collect	814,5,103,1
A	collect	1274,5,117,1
A	mob	Harvest Watcher
S	
T	completewith	Oil
A	complete	153,1
A	mob	Defias Smuggler
A	mob	Defias Trapper
A	mob	Defias Looter
A	mob	Defias Pillager
S	
T	label	Compass
A	goto	1436/0,1748.27,-10672.13
A	complete	399,1
S	
T	label	Oil
A	goto	1436/0,1708.02,-10578.80,60,0
A	goto	1436/0,1772.07,-10493.63,60,0
A	goto	1436/0,1839.27,-10496.90,60,0
A	goto	1436/0,1863.07,-10251.20,60,0
A	goto	1436/0,1635.92,-10621.27,60,0
A	goto	1436/0,1708.02,-10578.80,60,0
A	goto	1436/0,1772.07,-10493.63,60,0
A	goto	1436/0,1839.27,-10496.90,60,0
A	goto	1436/0,1863.07,-10251.20,60,0
A	goto	1436/0,1635.92,-10621.27
A	collect	814,5,103,1
A	collect	1274,5,117,1
A	mob	Harvest Watcher
A	mob	Harvest Golem
S	
T	completewith	next
A	unitscan	Old Murk-Eye
S	
A	goto	1436/0,1952.67,-10751.7,60,0
A	goto	1436/0,1991.52,-10927.40,60,0
A	goto	1436/0,1874.97,-10996.000,60,0
A	goto	1436/0,1929.22,-11019.80,60,0
A	goto	1436/0,1917.67,-11086.77,30
A	complete	102,1
A	mob	Riverpaw Herbalist
A	mob	Riverpaw Mongrel
A	mob	Riverpaw Brute
S	
T	completewith	next
A	unitscan	Old Murk-Eye
S	
T	label	Grayson
A	goto	1436/0,1965.97,-11407.13
A	accept	104
A	target	Captain Grayson
S	
A	goto	1436/0,1829.47,-11357.20,70,0
A	goto	1436/0,1795.87,-11402.47,70,0
A	goto	1436/0,1778.37,-11374.70,70,0
A	goto	1436/0,1829.47,-11357.20,70,0
A	goto	1436/0,1900.52,-11319.87,70,0
A	goto	1436/0,1955.12,-11284.17,70,0
A	goto	1436/0,1984.17,-11236.33,70,0
A	goto	1436/0,1999.57,-11160.50,70,0
A	goto	1436/0,2009.37,-11093.53,70,0
A	goto	1436/0,2042.27,-11064.37,70,0
A	goto	1436/0,2062.22,-11032.40,70,0
A	goto	1436/0,2076.57,-10959.13,70,0
A	goto	1436/0,2097.22,-10934.40,70,0
A	goto	1436/0,1829.47,-11357.20,70,0
A	goto	1436/0,1795.87,-11402.47,70,0
A	goto	1436/0,1778.37,-11374.70,70,0
A	goto	1436/0,1829.47,-11357.20,70,0
A	goto	1436/0,1900.52,-11319.87,70,0
A	goto	1436/0,1955.12,-11284.17,70,0
A	goto	1436/0,1984.17,-11236.33,70,0
A	goto	1436/0,1999.57,-11160.50,70,0
A	goto	1436/0,2009.37,-11093.53,70,0
A	goto	1436/0,2042.27,-11064.37,70,0
A	goto	1436/0,2062.22,-11032.40,70,0
A	goto	1436/0,2076.57,-10959.13,70,0
A	goto	1436/0,2097.22,-10934.40
A	complete	104,1
A	unitscan	Old Murk-Eye
S	
A	goto	1436/0,1965.97,-11407.13
A	accept	103
A	turnin	103,1
A	turnin	104,3
A	target	Captain Grayson
S	
T	completewith	next
A	complete	153,1
A	mob	Defias Knuckleduster
A	mob	Defias Highwaymen
S	
A	goto	1436/0,1454.97,-11272.73
A	accept	117
A	turnin	117
A	target	Grimbooze Thunderbrew
S	
T	completewith	next
A	goto	1436/0,1309.72,-11213.000,60,0
A	goto	1436/0,1206.12,-11142.30,60,0
A	goto	1436/0,1177.07,-11100.30,60,0
A	complete	153,1
A	mob	Defias Knuckleduster
A	mob	Defias Highwaymen
S	
A	goto	1436/0,1193.87,-11078.60,60
A	isOnQuest	153
S	
T	completewith	Footpads
A	complete	151,1
S	
T	completewith	AoE1
A	collect	723,8,22,1
A	mob	+Great Goretusk
A	mob	+Goretusk
A	mob	+Young Goretusk
A	collect	731,3,38,1
A	mob	+Great Goretusk
A	mob	+Goretusk
A	mob	+Young Goretusk
A	collect	729,3,38,1
A	mob	+Fleshripper
S	
T	completewith	next
A	complete	153,1
A	mob	Defias Trapper
A	mob	Defias Smuggler
S	
T	label	AoE1
A	goto	1436/0,1383.92,-10636.43,60,0
A	goto	1436/0,1328.97,-10454.90,60,0
A	goto	1436/0,1414.72,-10314.43,60,0
A	goto	1436/0,1389.52,-10270.330,60,0
A	goto	1436/0,1457.77,-10209.90,150
A	isOnQuest	153
S	
T	completewith	Watch
A	goto	1436/0,1457.77,-10209.90,60,0
A	complete	9,1
A	mob	Harvest Watcher
S	
T	completewith	Furlbrows
A	collect	723,8,22,1
A	mob	+Young Goretusk
A	collect	731,3,38,1
A	mob	+Young Goretusk
A	collect	729,3,38,1
A	mob	+Fleshripper
A	mob	+Young Fleshripper
S	
A	goto	1436/0,1471.77,-10022.07,60,0
A	goto	1436/0,1402.12,-10018.80,60,0
A	goto	1436/0,1310.77,-9885.10
A	complete	153,1,1
A	mob	+Defias Trapper
A	mob	+Defias Smuggler
A	complete	12,1
A	mob	+Defias Trapper
A	complete	12,2
A	mob	+Defias Smuggler
S	
T	completewith	next
A	goto	1436/0,1310.77,-9885.10,60,0
A	complete	153,1
A	mob	Defias Trapper
A	mob	Defias Smuggler
S	
T	label	Watch
A	goto	1436/0,1290.12,-9849.40
A	complete	64,1
S	
T	completewith	Oats
A	goto	1436/0,1249.17,-9898.87,60,0
A	goto	1436/0,1207.17,-9940.4,60,0
A	complete	9,1
A	mob	Harvest Watcher
S	
A	goto	1436/0,1195.97,-9750.00,60,0
A	goto	1436/0,1024.12,-9697.50
A	complete	102,1
A	mob	Riverpaw Scout
A	mob	Riverpaw Gnoll
S	
A	goto	1436/0,1184.07,-9623.77,60,0
A	goto	1436/0,1133.67,-9649.43,60,0
A	goto	1436/0,1058.07,-9591.80
A	collect	730,3,38,1
A	mob	Murloc Coastrunner
A	mob	Murloc Raider
S	
T	label	Footpads
A	goto	1436/0,1037.07,-9849.17
A	complete	153,1
A	mob	Defias Footpad
S	
T	label	Oats
A	goto	1436/0,1037.07,-9849.17
A	complete	151,1
S	
T	label	Furlbrows
A	turnin	64
A	target	+Farmer Furlbrow
A	goto	1436/0,918.42,-9851.50
A	turnin	151
A	goto	1436/0,919.82,-9852.90
A	target	+Verna Furlbrow
S	
A	goto	1436/0,926.47,-10207.80,80,0
A	goto	1436/0,908.27,-10506.000
A	collect	723,8,22,1
A	mob	+Goretusk
A	mob	+Young Goretusk
A	collect	731,3,38,1
A	mob	+Goretusk
A	mob	+Young Goretusk
A	collect	729,3,38,1
A	mob	+Fleshripper
A	mob	+Young Fleshripper
S	
A	goto	1436/0,1167.27,-10110.73,60,0
A	goto	1436/0,1207.17,-9940.40
A	complete	9,1
A	mob	Harvest Watcher
S	
A	goto	1436/0,1207.17,-9940.40
A	xp	17+11890
A	isQuestComplete	12
S	
A	goto	1436/0,1207.17,-9940.40
A	xp	17+12800
S	
A	turnin	9,1
A	vendor	
A	target	+Farmer Saldean
A	goto	1436/0,1055.27,-10128.70
A	turnin	22
A	turnin	38
A	goto	1436/0,1041.97,-10112.13
A	target	+Salma Saldean
S	
A	turnin	12
A	target	+Gryan Stoutmantle
A	goto	1436/0,1045.12,-10508.80
A	turnin	102,1
A	goto	1436/0,1041.97,-10511.13
A	target	+Captain Danuvin
A	isQuestComplete	12
S	
A	goto	1436/0,1041.97,-10511.13
A	turnin	102,1
A	target	Captain Danuvin
S	
A	goto	1436/0,1127.37,-10636.43
A	turnin	153,2
A	target	Scout Galiaan
S	
T	completewith	next
S	
T	completewith	next
A	goto	1436/0,1037.07,-10628.27
A	fly	Stormwind
A	target	Thor
S	
T	completewith	next
A	goto	1453/0,686.25,-8815.41,8,0
A	goto	1453/0,684.24,-8820.34,4,0
A	goto	1453/0,687.46,-8818.01,6,0
A	goto	1453/0,854.42,-8965.28,12,0
A	link	https://youtu.be/gV8-wgQEomc
A	goto	1453/0,861.95,-8990.47,10
S	
A	goto	1453/0,861.95,-8990.47
A	turnin	1861,1
A	trainer	
A	target	Jennea Cannon
S	
T	completewith	next
A	goto	1453/0,887.22,-9017.80,10,0
A	goto	1453/0,871.36,-9013.14,10,0
A	goto	1453/0,868.8,-9004.27,8,0
A	goto	1453/0,877.00,-9008.03,6,0
A	goto	1453/0,863.96,-9001.40,8,0
A	goto	1453/0,928.62,-9010.10,15,0
A	goto	1453/0,962.63,-8990.73,15,0
A	goto	1453/0,949.86,-9009.380,10,0
A	goto	1453/0,942.34,-9001.49,8,0
A	goto	1453/0,948.65,-8994.50,10
S	
A	goto	1453/0,948.65,-8994.50
A	vendor	1307
A	target	Charys Yserian
S	
T	completewith	next
A	goto	1453/0,958.74,-8987.870,20,0
A	goto	1453/0,941.80,-8918.49,20,0
A	goto	1453/0,916.79,-8891.960,20,0
A	goto	1453/0,948.65,-8816.30,20,0
A	goto	1453/0,946.64,-8803.31,20,0
A	goto	1453/0,970.57,-8772.740,20,0
A	goto	1453/0,1030.92,-8747.20,20,0
A	goto	1453/0,1049.34,-8750.330,20,0
A	goto	1453/0,1093.16,-8779.020,10
S	
A	goto	1453/0,1093.16,-8779.020
A	accept	3765
A	target	Argos Nightwhisper
S	
A	goto	1453/0,822.16,-8865.60
A	vendor	1316
A	target	Adair Gilroy
S	
T	completewith	next
A	goto	1453/0,661.38,-8858.16,12,0
A	goto	1453/0,680.61,-8829.39,12,0
A	goto	1453/0,717.44,-8847.32,12,0
A	goto	1453/0,693.24,-8891.51,12,0
A	goto	1453/0,681.28,-8888.01,10
S	
A	goto	1453/0,681.28,-8888.01
A	collect	1941,1,116,1
A	target	Roberto Pupellyverbos
S	
T	completewith	next
A	goto	1453/0,680.61,-8828.67,15,0
A	goto	1453/0,635.44,-8863.81,8
S	
A	goto	1453/0,635.44,-8863.81
A	vendor	1257
A	target	Keldric Boucher
S	
T	completewith	Bank3
A	goto	1453/0,637.59,-8889.81,10
S	
T	sticky	
T	label	Bank4
A	goto	1453/0,614.33,-8932.92
A	bankwithdraw	769,5354,6889
S	
T	label	Bank3
A	goto	1453/0,614.33,-8932.92
A	bankdeposit	2998,4371,1711,1478,1712,3012,1180,1181,3013,17056,2592,2998,1941
A	target	Newton Burnside
S	
T	completewith	next
A	goto	1453/0,662.46,-8860.76,10,0
A	goto	1453/0,673.75,-8867.93,10
A	target	Innkeeper Allison
S	
A	goto	1453/0,673.75,-8867.93
A	hs	
A	target	Innkeeper Allison
A	zoneskip	Darkshore
E
G	Guides/forever/Alliance-ADV-AoE-Mage-1-22.lua
M	classic	
M	tbc	
M	selector	Alliance Mage
M	name	18-20 ADV Darkshore 3 Mage AoE
M	version	2
M	group	RestedXP ADV AoE Alliance Mage
M	defaultfor	Human Mage/Gnome Mage
M	next	20-22 ADV Redridge 1 Mage AoE
S	
A	goto	1439/1,529.30,6415.93
A	collect	1205,45,4740,1
A	target	Taldan
A	money	<0.45
S	
A	goto	1439/1,529.30,6415.93
A	collect	1205,40,4740,1
A	target	Taldan
A	money	<0.40
S	
A	goto	1439/1,529.30,6415.93
A	collect	1205,35,4740,1
A	target	Taldan
A	money	<0.35
S	
A	goto	1439/1,529.30,6415.93
A	collect	1205,30,4740,1
A	target	Taldan
A	money	<0.30
S	
A	goto	1439/1,529.30,6415.93
A	collect	1205,25,4740,1
A	target	Taldan
A	money	<0.25
S	
A	goto	1439/1,529.30,6415.93
A	collect	1205,20,4740,1
A	target	Taldan
A	money	<0.20
S	
A	goto	1439/1,529.30,6415.93
A	collect	1205,15,4740,1
A	target	Taldan
A	money	<0.15
S	
A	goto	1439/1,529.30,6415.93
A	collect	1205,10,4740,1
A	target	Taldan
A	money	<0.10
S	
A	goto	1439/1,529.30,6415.93
A	collect	1205,5,4740,1
A	target	Taldan
A	money	<0.05
S	
A	goto	1439/1,533.23,6399.77
A	collect	4592,40,4740,1
A	target	Laird
S	
A	accept	4740
A	goto	1439/1,503.76,6402.39
S	
A	goto	1439/1,577.77,6371.39
A	accept	1138
A	target	Gubber Blump
S	
A	goto	1439/1,89.14,5002.00
A	turnin	948
A	accept	944
A	target	Onu
S	
A	goto	1439/1,33.47,4996.33
A	accept	5321
A	target	Kerlonian Evershade
S	
A	goto	1439/1,34.12,5001.570
A	complete	5321,1
A	isOnQuest	5321
S	
T	completewith	Glaive1
A	complete	986,1
A	mob	Moonstalker Sire
A	use	13536
A	isOnQuest	5321
S	
T	completewith	next
A	complete	1003,1
A	mob	Grizzled Thistle Bear
A	use	13536
A	isOnQuest	5321
S	
T	label	Glaive1
A	goto	1439/1,410.09,4519.49
A	complete	944,1
A	use	13536
A	isOnQuest	5321
S	
T	completewith	Therylune1
A	collect	5352,1,968,1
A	accept	968
A	mob	Twilight Disciple
A	mob	Twilight Thug
A	use	13536
A	isOnQuest	5321
S	
T	completewith	next
A	goto	1439/1,410.09,4519.49
A	turnin	944
A	accept	949
A	use	13536
A	use	5251
A	isOnQuest	5321
S	
A	goto	1439/1,410.09,4519.49
A	accept	945
A	target	Therylune
A	use	13536
A	isOnQuest	5321
S	
T	completewith	Tome1
A	complete	945,1
A	use	13536
A	target	Therylune
A	isOnQuest	5321
S	
A	goto	1439/1,416.64,4576.69
A	turnin	944
A	accept	949
A	use	13536
A	use	5251
A	isOnQuest	5321
S	
T	label	Tome1
A	goto	1439/1,416.64,4576.69
A	turnin	949
A	accept	950
A	use	13536
A	isOnQuest	5321
S	
T	label	Therylune1
A	complete	945,1
A	use	13536
A	target	Therylune
A	isOnQuest	950
S	
T	completewith	Remtravel1
A	complete	986,1
A	mob	Moonstalker Sire
A	use	13536
A	isOnQuest	950
S	
T	completewith	next
A	complete	1003,1
A	mob	Grizzled Thistle Bear
A	use	13536
A	isOnQuest	950
S	
T	label	Remtravel1
A	goto	1439/1,602.01,4678.87
A	turnin	729
A	accept	731
A	target	Prospector Remtravel
A	use	13536
A	isOnQuest	950
S	
A	goto	1439/1,626.24,4633.89,40,0
A	goto	1439/1,569.26,4572.76,40,0
A	goto	1439/1,626.24,4633.89,40,0
A	goto	1439/1,602.01,4678.87,40,0
A	goto	1439/1,892.83,4517.30
A	complete	731,1
A	target	Prospector Remtravel
A	mob	Gravelflint Geomancer
A	mob	Gravelflint Bonesnapper
A	use	13536
A	isOnQuest	950
S	
T	completewith	SeaC
A	complete	986,1
A	mob	Moonstalker Sire
A	use	13536
A	isOnQuest	950
S	
T	completewith	SeaC
A	complete	1003,1
A	mob	Grizzled Thistle Bear
A	use	13536
A	isOnQuest	950
S	
T	completewith	next
A	unitscan	Strider Clutchmother
A	isOnQuest	950
S	
T	label	SeaC
A	goto	1439/1,892.83,4517.30
A	accept	4733
A	isOnQuest	950
S	
T	completewith	next
A	abandon	5321
A	isOnQuest	950
S	
A	goto	1439/1,896.76,4597.21
A	accept	4732
A	isOnQuest	950
S	
T	completewith	SeaCreature
A	complete	1138,1
A	mob	Encrusted Tide Crawler
A	isOnQuest	950
S	
A	goto	1439/1,865.32,4678.432
A	accept	4731
A	isOnQuest	950
S	
T	label	SeaCreature
A	goto	1439/1,799.82,4808.12
A	accept	4730
A	isOnQuest	950
S	
T	completewith	next
A	complete	1138,1
A	mob	Reef Crawler
A	isOnQuest	950
S	
A	goto	1439/1,549.61,4990.65
A	complete	4740,1
A	unitscan	Murkdeep
A	isOnQuest	950
S	
T	completewith	next
A	goto	1439/1,586.29,5048.73,60,0
A	goto	1439/1,583.01,5124.71,60,0
A	goto	1439/1,647.86,5180.600,60,0
A	goto	1439/1,621.66,5210.29,60,0
A	complete	1138,1
A	mob	Reef Crawler
A	isOnQuest	950
S	
A	goto	1439/1,585.63,5237.370
A	accept	4728
A	isOnQuest	950
S	
A	goto	1439/1,621.66,5210.29,60,0
A	goto	1439/1,647.86,5180.600,60,0
A	goto	1439/1,583.01,5124.71,60,0
A	goto	1439/1,586.29,5048.73,60,0
A	goto	1439/1,609.21,4921.66,60,0
A	goto	1439/1,631.48,4858.78,60,0
A	goto	1439/1,702.88,4809.00
A	complete	1138,1
A	mob	Reef Crawler
A	isOnQuest	950
S	
T	completewith	SeaCreatureGiga
A	complete	986,1
A	mob	Moonstalker Sire
A	use	13536
S	
T	completewith	SeaCreatureGiga
A	complete	1003,1
A	mob	Grizzled Thistle Bear
A	use	13536
S	
T	label	Onu2
A	goto	1439/1,89.14,5002.00
A	turnin	950
A	target	Onu
A	isQuestComplete	950
S	
T	label	SeaCreatureGiga
A	goto	1439/1,585.63,5237.370
A	accept	4728
S	
T	completewith	next
A	goto	1439/1,621.66,5210.29,60,0
A	goto	1439/1,647.86,5180.600,60,0
A	goto	1439/1,583.01,5124.71,60,0
A	goto	1439/1,586.29,5048.73,60,0
A	complete	1138,1
A	mob	Reef Crawler
S	
A	goto	1439/1,549.61,4990.65
A	complete	4740,1
A	unitscan	Murkdeep
S	
T	completewith	next
A	goto	1439/1,609.21,4921.66,60,0
A	goto	1439/1,631.48,4858.78,60,0
A	goto	1439/1,702.88,4809.00,60,0
A	complete	1138,1
A	mob	Reef Crawler
S	
A	goto	1439/1,799.82,4808.12
A	accept	4730
S	
A	goto	1439/1,793.27,4764.89,60,0
A	goto	1439/1,840.43,4696.77
A	complete	1138,1
A	mob	Encrusted Tide Crawler
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
T	completewith	Remtravel3
A	complete	986,1
A	mob	Moonstalker Sire
A	use	13536
S	
T	completewith	Remtravel3
A	complete	1003,1
A	mob	Grizzled Thistle Bear
A	use	13536
S	
T	completewith	next
A	unitscan	Strider Clutchmother
S	
T	label	Remtravel3
A	goto	1439/1,602.01,4678.87
A	turnin	729
A	accept	731
A	target	Prospector Remtravel
S	
A	goto	1439/1,626.24,4633.89,40,0
A	goto	1439/1,569.26,4572.76,40,0
A	goto	1439/1,626.24,4633.89,40,0
A	goto	1439/1,602.01,4678.87,40,0
A	goto	1439/1,410.09,4519.49
A	complete	731,1
A	target	Prospector Remtravel
A	mob	Gravelflint Geomancer
A	mob	Gravelflint Bonesnapper
S	
T	completewith	Glaive2
A	complete	986,1
A	mob	Moonstalker Sire
S	
T	completewith	next
A	complete	1003,1
A	mob	Grizzled Thistle Bear
S	
T	label	Glaive2
A	goto	1439/1,410.09,4519.49
A	complete	944,1
S	
T	completewith	Therylune2
A	collect	5352,1,968,1
A	accept	968
A	mob	Twilight Disciple
A	mob	Twilight Thug
S	
T	completewith	next
A	goto	1439/1,410.09,4519.49
A	turnin	944
A	accept	949
A	use	5251
S	
A	goto	1439/1,410.09,4519.49
A	accept	945
A	target	Therylune
S	
T	completewith	Tome2
A	complete	945,1
A	target	Therylune
S	
A	goto	1439/1,416.64,4576.69
A	turnin	944
A	accept	949
A	use	5251
S	
T	label	Tome2
A	goto	1439/1,416.64,4576.69
A	turnin	949
A	accept	950
A	use	13536
S	
T	label	Therylune2
A	complete	945,1
A	use	13536
A	target	Therylune
S	
T	completewith	Onu3
A	complete	986,1
A	mob	Moonstalker Sire
S	
T	completewith	Onu3
T	label	Scalps2
A	complete	1003,1
A	mob	Grizzled Thistle Bear
S	
T	requires	Scalps2
T	completewith	next
A	goto	1439/1,229.97,4815.55,-1
A	turnin	1003
S	
T	label	Onu3
A	goto	1439/1,89.14,5002.00,-1
A	turnin	950
A	target	Onu
S	
A	goto	1439/1,33.47,4996.33
A	accept	5321
A	target	Kerlonian Evershade
S	
A	goto	1439/1,34.12,5001.570
A	complete	5321,1
A	isOnQuest	5321
S	
T	completewith	525
A	complete	986,1
A	mob	Moonstalker Sire
S	
A	goto	1439/1,63.60,4833.89,60,0
A	goto	1439/1,119.27,4764.89,60,0
A	goto	1439/1,217.52,4686.29,60,0
A	goto	1439/1,311.84,4708.13,60,0
A	goto	1439/1,406.82,4733.45,60,0
A	goto	1439/1,444.15,4850.92,60,0
A	goto	1439/1,287.61,4815.11,60,0
A	goto	1439/1,63.60,4833.89,60,0
A	goto	1439/1,119.27,4764.89,60,0
A	goto	1439/1,217.52,4686.29,60,0
A	goto	1439/1,311.84,4708.13,60,0
A	goto	1439/1,406.82,4733.45,60,0
A	goto	1439/1,444.15,4850.92,60,0
A	goto	1439/1,287.61,4815.11
A	complete	1003,1
A	mob	Grizzled Thistle Bear
A	use	13536
S	
T	label	525
A	goto	1439/1,229.97,4815.55
A	turnin	1003
A	use	13536
S	
A	goto	1439/1,249.62,4657.91,70,0
A	goto	1439/1,296.78,4381.94,70,0
A	goto	1439/1,545.68,4379.32,70,0
A	goto	1439/1,537.82,4202.47,70,0
A	goto	1439/1,140.89,4372.770,70,0
A	goto	1439/1,205.73,4495.91,70,0
A	goto	1439/1,22.33,4271.02,70,0
A	goto	1439/1,249.62,4657.91,70,0
A	goto	1439/1,296.78,4381.94,70,0
A	goto	1439/1,545.68,4379.32,70,0
A	goto	1439/1,537.82,4202.47,70,0
A	goto	1439/1,140.89,4372.770,70,0
A	goto	1439/1,205.73,4495.91,70,0
A	goto	1439/1,22.33,4271.02
A	complete	986,1
A	unitscan	Moonstalker Sire
A	unitscan	Moonstalker Matriarch
A	use	13536
S	
T	completewith	Sleeper
A	xp	19+4635
A	isOnQuest	5321
S	
T	completewith	Delgren
A	collect	1015,10,90,1
A	mob	Ghostpaw Runner
S	
T	label	Sleeper
A	goto	1440/1,128.01,3305.31
A	turnin	5321,1
A	target	Liladris Moonriver
A	use	13536
A	isOnQuest	5321
S	
T	label	Delgren
A	goto	1440/1,189.71,3185.390
A	turnin	967
A	target	Delgren the Purifier
S	
A	goto	1440/1,394.43,2677.63
A	turnin	945
A	target	Therysil
S	
A	goto	1440/1,-284.31,2828.30
A	xp	19+8720
S	skip
T	completewith	next
S	
T	completewith	next
A	goto	1440/1,-284.31,2828.30
A	fly	Auberdine
A	target	Daelyshia
S	
A	turnin	4728
A	turnin	4730
A	turnin	4731
A	turnin	4732
A	turnin	4733
A	target	+Gwennyth Bly'Leggonde
A	goto	1439/1,543.06,6342.130
A	turnin	1138,2
A	goto	1439/1,577.77,6371.39
A	target	+Gubber Blump
S	
A	goto	1439/1,470.35,6439.07
A	turnin	4740
A	target	Sentinel Glynda Nal'Shea
S	
A	turnin	986
A	target	+Terenthis
A	goto	1439/1,362.93,6434.71
A	turnin	3765
A	goto	1439/1,431.71,6453.92
A	target	+Gershala Nightwhisper
S	
A	goto	1439/1,445.46,6536.01
A	collect	2678,20,90,1
A	target	Gorbold Steelhand
A	itemcount	6889,20
A	skill	cooking,50,1
S	
A	goto	1439/1,445.46,6536.01
A	collect	2678,15,90,1
A	target	Gorbold Steelhand
A	itemcount	6889,15
A	skill	cooking,50,1
S	
A	goto	1439/1,445.46,6536.01
A	collect	2678,10,90,1
A	target	Gorbold Steelhand
A	itemcount	6889,10
A	skill	cooking,50,1
S	
A	goto	1439/1,445.46,6536.01
A	collect	2678,5,90,1
A	target	Gorbold Steelhand
A	itemcount	6889,5
A	skill	cooking,50,1
S	
A	goto	1439/1,488.69,6564.830
A	collect	4470,1,90,1
A	collect	4471,1,90,1
A	target	Dalmond
A	skill	cooking,50,1
S	
A	goto	1439/1,489.35,6506.32
A	turnin	731
A	accept	741
A	target	Archaeologist Hollee
S	
T	completewith	Teldrassil
T	label	BoatT
A	goto	1439/1,487.38,6479.68,20,0
A	goto	1439/1,489.35,6454.36,20,0
A	goto	1439/1,527.99,6409.82,20,0
A	goto	1439/1,782.79,6504.57,20,0
A	goto	1439/1,765.10,6590.60,50
S	
T	completewith	Teldrassil
T	requires	BoatT
A	cast	818
A	skill	cooking,50,1
S	
T	completewith	Teldrassil
T	requires	BoatT
T	label	BoarM
A	itemcount	769,1
A	skill	cooking,50,1
S	
T	completewith	next
T	requires	BoarM
S	
T	label	Teldrassil
A	goto	1438/1,1018.75,8564.77,100
S	
T	completewith	next
A	goto	1438/1,987.69,8651.99,60,0
A	goto	1438/1,922.52,8678.46,40,0
A	goto	1438/1,888.40,8676.08,20,0
A	goto	1438/1,841.05,8641.121,20
S	
A	goto	1438/1,841.05,8641.121
A	fp	Rut'theran
A	target	Vesprystus
S	
T	completewith	next
A	goto	1438,55.885,89.350
A	zone	Darnassus
S	
T	completewith	next
A	goto	1457/1,2536.83,9898.58,30,0
A	goto	1457/1,2534.08,9772.82,30,0
A	goto	1457/1,2549.00,9727.09,30,0
A	goto	1457/1,2607.74,9642.04,20
S	
A	goto	1457/1,2607.74,9642.04
A	turnin	741,3
A	accept	942
A	target	Chief Archaeologist Greywhisker
E
G	Guides/forever/Alliance-ADV-AoE-Mage-1-22.lua
M	classic	
M	tbc	
M	selector	Alliance Mage
M	name	20-22 ADV Redridge 1 Mage AoE
M	version	2
M	group	RestedXP ADV AoE Alliance Mage
M	defaultfor	Human Mage/Gnome Mage
M	next	22-26 ADV Wetlands 1 Mage AoE
S	
T	completewith	next
A	hs	
A	zoneskip	Stormwind City
S	
A	goto	1453/0,635.44,-8863.81
A	vendor	1257
A	target	Keldric Boucher
S	
T	completewith	Bank
A	goto	1453/0,637.59,-8889.81,10
S	
T	sticky	
T	label	Bank1
A	goto	1453/0,614.33,-8932.92
A	bankwithdraw	4371,1941,1711,1478,1712,3012,1180,1181,3013,2998
A	target	Newton Burnside
S	
T	label	Bank
A	goto	1453/0,614.33,-8932.92
A	bankdeposit	17056,2592,1015,4654
A	target	Newton Burnside
S	
T	completewith	next
T	requires	Bank1
A	goto	1453/0,679.80,-8829.57,12,0
A	goto	1453/0,716.77,-8847.23,12,0
A	goto	1453/0,693.24,-8891.33,12
S	
T	requires	Bank1
A	goto	1453/0,681.28,-8888.01
A	collect	1941,1,116,1
A	target	Roberto Pupellyverbos
S	
T	completewith	next
T	requires	Bank1
A	goto	1453/0,686.25,-8815.41,8,0
A	goto	1453/0,684.24,-8820.34,4,0
A	goto	1453/0,687.46,-8818.01,6,0
A	goto	1453/0,854.42,-8965.28,12,0
A	link	https://youtu.be/gV8-wgQEomc
A	goto	1453/0,861.95,-8990.47,10
S	
T	requires	Bank1
A	goto	1453/0,847.43,-8991.99
A	train	3561
A	target	Larimaine Purdue
S	
A	goto	1453/0,861.95,-8990.47
A	trainer	
A	target	Jennea Cannon
S	
T	completewith	Charys
A	goto	1453/0,887.22,-9017.80,10,0
A	goto	1453/0,871.36,-9013.14,10,0
A	goto	1453/0,868.8,-9004.27,8,0
A	goto	1453/0,877.00,-9008.03,6,0
A	goto	1453/0,863.96,-9001.40,8,0
A	goto	1453/0,928.62,-9010.10,15,0
A	goto	1453/0,962.63,-8990.73,15,0
A	goto	1453/0,949.86,-9009.380,10,0
A	goto	1453/0,942.34,-9001.49,8,0
A	goto	1453/0,948.65,-8994.50,10
S	
A	goto	1453/0,948.65,-8994.50
A	collect	17031,2,344,1
A	target	Charys Yserian
A	itemcount	4371,1
S	
T	label	Charys
A	goto	1453/0,948.65,-8994.50
A	collect	17031,2,344,1
A	target	Charys Yserian
A	itemcount	4371,<1
S	
T	completewith	Adair
A	goto	1453/0,852.40,-8920.10,20,0
A	goto	1453/0,829.01,-8901.28,20,0
A	goto	1453/0,789.22,-8904.59,20,0
A	goto	1453/0,758.31,-8878.78,20,0
A	goto	1453/0,810.33,-8832.44,20,0
A	goto	1453/0,827.54,-8850.19,15,0
A	goto	1453/0,822.16,-8865.60,10
S	
A	goto	1453/0,822.16,-8865.60
A	vendor	1316
A	money	<0.1831
A	target	Adair Gilroy
S	
T	label	Adair
A	goto	1453/0,822.16,-8865.60
A	vendor	1316
A	money	<0.2631
A	target	Adair Gilroy
S	
T	completewith	next
A	goto	1453/0,872.30,-8803.220,5,0
A	goto	1453/0,872.70,-8682.39,20
S	
A	goto	1453/0,766.64,-8623.23
A	accept	343
A	target	Brother Kristoff
S	
T	completewith	next
A	goto	1453/0,737.74,-8571.69,15,0
A	goto	1453/0,736.26,-8558.06,12,0
A	goto	1453/0,719.86,-8550.36,12
S	
A	goto	1453/0,719.86,-8550.36
A	turnin	399
A	target	Baros Alexston
S	
A	goto	1453/0,638.26,-8342.22
A	vendor	5519
A	target	Billibub Cogspinner
A	itemcount	4371,<1
S	
T	completewith	next
A	goto	1453/0,453.16,-8533.33,30,0
A	goto	1453/0,405.03,-8486.89,20,0
A	goto	1453/0,442.94,-8427.47,20,0
A	goto	1453/0,435.41,-8381.66,20,0
A	goto	1453/0,383.66,-8345.63,12
S	
A	goto	1453/0,383.66,-8345.63
A	turnin	343
A	accept	344
A	target	Milton Sheaf
S	
T	completewith	next
A	goto	1453/0,435.41,-8381.66,20,0
A	goto	1453/0,442.94,-8427.47,20,0
A	goto	1453/0,405.03,-8486.89,20,0
A	goto	1453/0,450.74,-8539.51,30,0
A	goto	1453/0,551.02,-8658.37,20,0
A	goto	1453/0,509.88,-8819.71,12,0
A	goto	1453/0,518.35,-8822.040,12
S	
A	goto	1453/0,518.35,-8822.040
A	collect	2665,1,90,1
A	target	Felicia Gump
S	
T	completewith	next
A	goto	1453/0,508.41,-8803.04,30,0
A	goto	1453/0,575.62,-8741.370,30,0
A	goto	1453/0,603.58,-8771.67,30,0
A	goto	1453/0,530.45,-8847.41,20,0
A	goto	1453/0,532.33,-8863.54,20,0
A	goto	1453/0,494.56,-8865.78,12,0
A	goto	1453/0,495.77,-8870.44,8,0
A	goto	1453/0,504.24,-8956.31,40
S	
T	completewith	next
A	goto	1429/0,44.35,-9458.41,30
S	skip
T	completewith	Paxton
T	requires	PaxtonT
A	goto	1429/0,398.72,-9085.76,50,0
A	goto	1429/0,125.22,-9079.98,20,0
A	goto	1429/0,-139.95,-8910.09,50,0
A	goto	1429/0,-158.00,-8901.52,10,0
A	goto	1429/0,-174.32,-8881.39,10,0
A	goto	1429/0,-186.46,-8874.91,10
S	
A	goto	1429/0,8.25,-9460.03
A	collect	1939,1,116,1
A	target	Barkeep Dobbins
S	
T	sticky	
T	label	FarleyHome
A	goto	1429/0,16.23,-9462.580,0,0
A	home	
A	target	Innkeeper Farley
S	
T	completewith	next
T	requires	FarleyHome
A	goto	1429/0,-158.00,-8901.52,10,0
A	goto	1429/0,-174.32,-8881.39,10,0
A	goto	1429/0,-186.46,-8874.91,10
S	
T	requires	FarleyHome
A	goto	1429/0,-186.46,-8874.91
A	turnin	344
A	accept	345
A	target	Brother Paxton
S	
T	completewith	Theo
A	goto	1429/0,-174.32,-8881.39,10,0
A	goto	1429/0,-158.00,-8901.52,10,0
A	goto	1429/0,-140.30,-8916.57,10,0
A	goto	1429/0,-464.48,-9142.47,30,0
A	goto	1429/0,-701.54,-9538.960,15
S	
T	sticky	
T	label	Dawn
A	goto	1429/0,-716.46,-9541.04,0,0
A	vendor	958
A	money	<0.1138
A	target	Dawn Brightstar
A	itemcount	4371,1
S	
T	sticky	
T	label	Dawn2
A	goto	1429/0,-716.46,-9541.04,0,0
A	vendor	958
A	money	<0.1938
A	target	Dawn Brightstar
A	itemcount	4371,<1
S	
T	label	Theo
A	goto	1429/0,-728.26,-9553.08
A	accept	94
A	target	Theocritus
S	
T	requires	Dawn
S	
T	completewith	next
T	requires	Dawn2
A	goto	1431/0,-1159.00,-10544.31,20,0
A	goto	1431/0,-1164.94,-10533.15,10
S	
T	requires	Dawn2
A	goto	1431/0,-1159.54,-10509.03
A	collect	1942,1,116,1
A	target	Barkeep Hann
S	
T	completewith	Viktori
A	goto	1431/0,-1164.94,-10533.15,10,0
A	goto	1431/0,-1159.00,-10544.31,10
S	
T	completewith	next
A	goto	1431/0,-1197.61,-10585.35,12
S	
A	goto	1431/0,-1200.85,-10593.99
A	accept	163
A	accept	164
A	accept	165
A	target	Elaine Carevin
S	
A	goto	1431/0,-1272.67,-10586.073
A	vendor	3133
A	target	Herble Baubbletump
A	itemcount	4371,<1
S	
A	goto	1431/0,-1320.73,-10581.75
A	accept	174
A	turnin	174
A	accept	175
A	target	Viktori Prism'Antras
A	itemcount	4371,1
S	
T	label	Viktori
A	goto	1431/0,-1320.73,-10581.75
A	accept	175
A	target	Viktori Prism'Antras
A	isQuestTurnedIn	174
S	
A	goto	1431/0,-1366.09,-10779.03
A	turnin	175
A	accept	177
A	target	Blind Mary
A	isQuestTurnedIn	174
S	
A	goto	1431/0,-1258.63,-10513.89
A	fp	Duskwood
A	target	Felicia Mane
S	
T	completewith	Kzixx
A	goto	1431/0,-1236.49,-10139.49,60,0
A	goto	1431/0,-1375.81,-10072.35,20
S	
A	goto	1431/0,-1375.81,-10072.35
A	vendor	3134
A	itemcount	4827,1
A	target	Kzixx
S	
A	goto	1431/0,-1375.81,-10072.35
A	vendor	3134
A	itemcount	4828,1
A	target	Kzixx
S	
A	goto	1431/0,-1375.81,-10072.35
A	vendor	3134
A	itemcount	4829,1
A	target	Kzixx
S	
T	label	Kzixx
A	goto	1431/0,-1375.81,-10072.35
A	vendor	3134
A	itemcount	4827,<1
A	itemcount	4828,<1
A	itemcount	4829,<1
A	target	Kzixx
S	
T	completewith	Gnolls
A	collect	1081,5,92,1
A	mob	+Tarantula
A	collect	2296,5,92,1
A	mob	+Great Goretusk
A	collect	769,50,90,1,1
A	mob	+Great Goretusk
A	skill	cooking,50,1
S	
T	completewith	Gnolls
A	collect	1081,5,92,1
A	mob	+Tarantula
A	collect	2296,5,92,1
A	mob	+Great Goretusk
A	skill	cooking,<50,1
S	
A	goto	1433/0,-1907.75,-9625.90,60,0
A	goto	1433/0,-1893.64,-9592.880,60,0
A	goto	1433/0,-1938.36,-9591.440
A	accept	244
A	target	Guard Parker
S	skip
T	label	AoE1
A	goto	1433/0,-1912.31,-9479.51,60
A	isOnQuest	244
S	skip
T	completewith	Gnolls
A	collect	2296,5,92,1
A	collect	769,50,90,1,1
A	mob	Great Goretusk
A	skill	cooking,50,1
S	skip
T	completewith	next
A	collect	2296,5,92,1
A	mob	Great Goretusk
A	skill	cooking,50
S	
T	label	Gnolls
A	goto	1433/0,-2238.15,-9443.60
A	turnin	244
A	accept	246
A	target	Deputy Feldon
S	
A	goto	1433/0,-2234.89,-9435.060
A	fp	Redridge Mountains
S	
A	accept	20
A	target	+Marshal Marris
A	goto	1433/0,-2298.28,-9283.90
A	accept	125
A	turnin	345
A	accept	347
A	goto	1433/0,-2268.54,-9279.27
A	target	+Foreman Oslow
S	
A	goto	1433/0,-2219.70,-9260.73
A	collect	2901,1,125,1
A	target	Karen Taylor
S	
A	accept	91
A	goto	1433/0,-2216.00,-9215.85
A	target	Bailiff Conacher
S	
A	accept	127
A	goto	1433/0,-2172.59,-9261.02
A	accept	180
A	goto	1433/0,-2151.53,-9247.12
A	target	Dockmaster Baren
S	
T	sticky	
T	label	Darcy1
A	goto	1433/0,-2155.22,-9225.84,0,0
A	accept	129
A	target	Darcy
S	
A	goto	1433/0,-2145.89,-9211.36
A	accept	116
A	turnin	116
A	target	Barkeep Daniels
S	
A	goto	1433/0,-2145.45,-9231.34
A	turnin	65
A	target	Wiley the Black
S	
A	goto	1433/0,-2207.32,-9351.66
A	accept	3741
A	target	Shawn
S	
A	goto	1433/0,-2250.09,-9360.78,90,0
A	goto	1433/0,-2174.32,-9386.56,90,0
A	goto	1433/0,-2147.41,-9308.08,90,0
A	goto	1433/0,-2090.96,-9373.82,90,0
A	goto	1433/0,-1986.76,-9324.30,90,0
A	goto	1433/0,-2246.40,-9359.92,90,0
A	goto	1433/0,-2309.57,-9376.28,90,0
A	goto	1433/0,-2397.70,-9363.97
A	complete	3741,1
S	
A	goto	1433/0,-2205.58,-9351.52
A	turnin	3741
A	target	Hilary
S	
T	completewith	Gnolls2
A	collect	2296,5,92,1
A	collect	769,50,90,1,1
A	mob	Great Goretusk
A	skill	cooking,50,1
S	
T	completewith	next
A	collect	2296,5,92,1
A	mob	Great Goretusk
A	skill	cooking,<50,1
S	
T	label	Gnolls2
A	goto	1433/0,-1912.31,-9479.51
A	complete	246,1,1
A	mob	Redridge Mongrel
A	mob	Redridge Thrasher
S	
T	completewith	Gnolls3
A	collect	1081,5,92,1
A	mob	+Tarantula
A	collect	2296,5,92,1
A	mob	+Great Goretusk
A	collect	769,50,90,1,1
A	mob	+Great Goretusk
A	skill	cooking,50,1
S	
T	completewith	Gnolls3
A	collect	1081,5,92,1
A	mob	+Tarantula
A	collect	2296,5,92,1
A	mob	+Great Goretusk
A	skill	cooking,<50,1
S	
A	goto	1433/0,-1907.75,-9625.90,60,0
A	goto	1433/0,-1893.64,-9592.880,60,0
A	goto	1433/0,-1938.36,-9591.440
A	turnin	129
A	accept	130
A	target	Guard Parker
S	
T	label	Gnolls3
A	goto	1433/0,-2209.06,-9790.24,60,0
A	goto	1433/0,-2242.71,-9792.700,60,0
A	goto	1433/0,-2271.14,-9774.31,60,0
A	goto	1433/0,-2321.94,-9776.63,60,0
A	goto	1433/0,-2512.32,-9603.17,60,0
A	goto	1433/0,-2209.06,-9790.24,60,0
A	goto	1433/0,-2242.71,-9792.700,60,0
A	goto	1433/0,-2271.14,-9774.31,60,0
A	goto	1433/0,-2321.94,-9776.63,60,0
A	goto	1433/0,-2512.32,-9603.17
A	complete	246,1
A	mob	+Redridge Mongrel
A	complete	246,2
A	mob	+Redridge Poacher
S	
A	goto	1433/0,-2238.15,-9443.60
A	turnin	246
A	target	Deputy Feldon
S	
A	goto	1433/0,-2472.16,-9366.72,-1
A	complete	125,1
S	
T	completewith	next
A	goto	1433/0,-2445.68,-9240.75,60,0
A	complete	127,1
A	collect	1468,8,150,1
A	mob	Murloc Flesheater
A	mob	Murloc Scout
S	
A	goto	1433/0,-2268.54,-9279.12
A	turnin	125
A	accept	89
A	target	Foreman Oslow
S	
A	goto	1433/0,-2240.10,-9248.14
A	vendor	
A	target	Dorin Songblade
A	isOnQuest	89
S	skip
T	completewith	next
A	goto	1433/0,-2205.58,-9232.350,10,0
A	goto	1433/0,-2197.99,-9224.68,8
S	
A	goto	1433/0,-2377.51,-9229.460,60,0
A	goto	1433/0,-2403.56,-9173.57,60,0
A	goto	1433/0,-2415.07,-9034.28,60,0
A	goto	1433/0,-2509.72,-9067.73,60,0
A	goto	1433/0,-2599.16,-9078.44,60,0
A	goto	1433/0,-2772.39,-9226.85,60,0
A	goto	1433/0,-2808.64,-9313.58,60,0
A	goto	1433/0,-2791.71,-9355.86,60,0
A	goto	1433/0,-2838.17,-9350.50,60,0
A	goto	1433/0,-2840.12,-9220.92,60,0
A	goto	1433/0,-2854.01,-9211.65,60,0
A	goto	1433/0,-2867.69,-9183.27,60,0
A	goto	1433/0,-2924.13,-9179.65,60,0
A	goto	1433/0,-2928.91,-9231.77,60,0
A	complete	20,1
T	loop	
A	line	Redridge Mountains,37.16,45.20,38.36,41.34,40.09,40.64,42.89,39.26,59.36,44.56,59.79,42.05,62.58,41.46,62.57,45.48,59.36,44.56
A	goto	1433/0,-2377.51,-9229.460,30,0
A	goto	1433/0,-2403.56,-9173.57,30,0
A	goto	1433/0,-2441.12,-9163.43,30,0
A	goto	1433/0,-2501.90,-9143.45,30,0
A	goto	1433/0,-2859.44,-9220.19,30,0
A	goto	1433/0,-2868.77,-9183.85,30,0
A	goto	1433/0,-2929.34,-9175.31,30,0
A	goto	1433/0,-2929.12,-9233.51,30,0
A	goto	1433/0,-2859.44,-9220.19,30,0
A	complete	127,1
A	collect	1468,8,150,1
A	goto	1433/0,-2831.22,-9328.06,40,0
A	goto	1433/0,-2809.95,-9313.87,40,0
A	goto	1433/0,-2789.11,-9350.36,40,0
A	goto	1433/0,-2831.22,-9328.06
A	collect	1080,5,92,1
T	loop	
A	line	Redridge Mountains,43.25,34.03,47.37,34.77,47.37,34.77,49.97,33.60,51.90,39.75,54.81,40.66,54.70,44.93,57.63,46.48
A	goto	1433/0,-2509.72,-9067.73,30,0
A	goto	1433/0,-2599.16,-9078.44,30,0
A	goto	1433/0,-2599.16,-9078.44,30,0
A	goto	1433/0,-2655.60,-9061.500,30,0
A	goto	1433/0,-2697.5,-9150.55,30,0
A	goto	1433/0,-2760.67,-9163.72,30,0
A	goto	1433/0,-2758.28,-9225.55,30,0
A	goto	1433/0,-2821.88,-9247.99,30,0
A	collect	1081,5,92,1
T	loop	
A	line	Redridge Mountains,52.26,36.56,54.08,38.28,54.98,40.31,56.79,41.36,57.26,47.60,54.76,45.58,52.67,42.73,50.50,41.55,52.26,36.56
A	goto	1433/0,-2705.31,-9104.36,30,0
A	goto	1433/0,-2744.82,-9129.26,30,0
A	goto	1433/0,-2764.36,-9158.65,30,0
A	goto	1433/0,-2803.65,-9173.86,30,0
A	goto	1433/0,-2813.85,-9264.210,30,0
A	goto	1433/0,-2759.58,-9234.96,30,0
A	goto	1433/0,-2714.21,-9193.69,30,0
A	goto	1433/0,-2667.1,-9176.61,30,0
A	goto	1433/0,-2705.31,-9104.36,30,0
A	collect	2296,5,92,1
A	disablecheckbox	
A	complete	89,1
A	disablecheckbox	
A	complete	89,2
A	disablecheckbox	
A	goto	1433/0,-2415.07,-9034.28
A	mob	Blackrock Outrunner
A	mob	Blackrock Grunt
A	mob	Blackrock Renegade
A	mob	Murloc Scout
A	mob	Murloc Tidecaller
A	mob	Dire Condor
A	mob	Greater Tarantula
A	mob	Great Goretusk
A	mob	Redridge Mystic
A	mob	Redridge Brute
S	
T	completewith	Herbalist
A	goto	1433/0,-2366.23,-9110.87,60,0
A	goto	1433/0,-2270.06,-9155.47,60,0
A	complete	89,1
A	complete	89,2
A	mob	Redridge Mystic
A	mob	Redridge Brute
S	
A	goto	1433/0,-2063.18,-9209.62
A	accept	92
A	turnin	92
A	target	Chef Breanna
A	itemcount	1080,5
A	itemcount	1081,5
A	itemcount	2296,5
S	
T	label	Herbalist
A	goto	1433/0,-2045.38,-9245.82
A	turnin	130
A	accept	131
A	accept	34
A	target	Martie Jainrose
S	
T	completewith	next
A	goto	1433/0,-1955.50,-9381.63,60,0
A	goto	1433/0,-1920.12,-9343.55,60,0
A	collect	2296,5,92,1
A	mob	Great Goretusk
S	
A	goto	1433/0,-1910.79,-9288.97
A	complete	34,1
A	mob	Bellygrub
A	target	Lamar Veisilli
S	
A	goto	1433/0,-2045.38,-9245.82
A	turnin	34
A	target	Martie Jainrose
S	
A	goto	1433/0,-1950.08,-9206.58,60,0
A	goto	1433/0,-2024.97,-9145.04,60,0
A	goto	1433/0,-1955.50,-9381.63,60,0
A	goto	1433/0,-1920.12,-9343.55,60,0
A	goto	1433/0,-1950.08,-9206.58,60,0
A	goto	1433/0,-2024.97,-9145.04,60,0
A	goto	1433/0,-1955.50,-9381.63,60,0
A	goto	1433/0,-1920.12,-9343.55
A	collect	2296,5,92,1
A	mob	Great Goretusk
S	
T	completewith	next
A	goto	1433/0,-2034.31,-9101.17,60,0
A	complete	89,1
A	complete	89,2
A	mob	Redridge Mystic
A	mob	Redridge Brute
S	
A	goto	1433/0,-1994.15,-9037.03,60,0
A	goto	1433/0,-2017.59,-8984.62,40
A	isOnQuest	347
S	
T	loop	
A	line	Redridge Mountains,18.95,24.50,21.62,23.72,21.89,15.06,20.21,13.25,18.82,15.03,16.06,17.08,17.48,19.55,16.05,21.04,18.95,24.50
A	goto	1433/0,-1982.21,-8929.740,20,0
A	goto	1433/0,-2040.17,-8918.45,20,0
A	goto	1433/0,-2046.03,-8793.06,20,0
A	goto	1433/0,-2009.56,-8766.85,20,0
A	goto	1433/0,-1979.38,-8792.62,20,0
A	goto	1433/0,-1919.47,-8822.30,20,0
A	goto	1433/0,-1950.29,-8858.07,20,0
A	goto	1433/0,-1919.25,-8879.64,20,0
A	goto	1433/0,-1982.21,-8929.740,20,0
A	complete	347,1
A	mob	+Redridge Drudger
A	complete	89,1
A	mob	+Redridge Basher
A	complete	89,2
A	mob	+Redridge Basher
S	
T	loop	
A	line	Redridge Mountains,18.95,24.50,21.62,23.72,21.89,15.06,20.21,13.25,18.82,15.03,16.06,17.08,17.48,19.55,16.05,21.04,18.95,24.50
A	goto	1433/0,-1982.21,-8929.740,20,0
A	goto	1433/0,-2040.17,-8918.45,20,0
A	goto	1433/0,-2046.03,-8793.06,20,0
A	goto	1433/0,-2009.56,-8766.85,20,0
A	goto	1433/0,-1979.38,-8792.62,20,0
A	goto	1433/0,-1919.47,-8822.30,20,0
A	goto	1433/0,-1950.29,-8858.07,20,0
A	goto	1433/0,-1919.25,-8879.64,20,0
A	goto	1433/0,-1982.21,-8929.740,20,0
A	xp	21+14365
A	isQuestAvailable	92
S	
T	loop	
A	line	Redridge Mountains,18.95,24.50,21.62,23.72,21.89,15.06,20.21,13.25,18.82,15.03,16.06,17.08,17.48,19.55,16.05,21.04,18.95,24.50
A	goto	1433/0,-1982.21,-8929.740,20,0
A	goto	1433/0,-2040.17,-8918.45,20,0
A	goto	1433/0,-2046.03,-8793.06,20,0
A	goto	1433/0,-2009.56,-8766.85,20,0
A	goto	1433/0,-1979.38,-8792.62,20,0
A	goto	1433/0,-1919.47,-8822.30,20,0
A	goto	1433/0,-1950.29,-8858.07,20,0
A	goto	1433/0,-1919.25,-8879.64,20,0
A	goto	1433/0,-1982.21,-8929.740,20,0
A	xp	21+15715
A	isQuestTurnedIn	92
S	skip
T	completewith	next
A	goto	1433/0,-1978.73,-8775.39,-1
A	goto	1433/0,-2049.28,-8823.17,-1
A	goto	1433/0,-1970.27,-8924.38,-1
A	goto	1433/0,-2033.00,-8923.37,-1
A	goto	1433/0,-1930.76,-8878.63,-1
A	goto	1433/0,-2305.01,-9271.01,30
S	
T	completewith	next
A	subzone	69
S	
A	turnin	20
A	accept	19
A	target	+Marshal Marris
A	goto	1433/0,-2298.28,-9283.90
A	turnin	89,1
A	goto	1433/0,-2268.54,-9279.27
A	target	+Foreman Oslow
S	
A	goto	1433/0,-2242.49,-9259.00
A	accept	118
A	target	Verner Osgood
S	
A	goto	1433/0,-2172.59,-9261.02
A	turnin	127
A	accept	150
A	turnin	150
A	goto	1433/0,-2172.59,-9261.02
A	target	Dockmaster Baren
S	
T	sticky	
T	label	Kimberly
A	goto	1433/0,-2158.69,-9234.38,0,0
A	vendor	
A	target	Kimberly Hiett
S	
A	goto	1433/0,-2155.22,-9225.84
A	turnin	131
A	target	Darcy
S	
T	completewith	next
A	goto	1433/0,-2146.54,-9246.54,12,0
A	goto	1433/0,-2067.09,-9220.34,12,0
S	
A	goto	1433/0,-2063.18,-9209.62
A	accept	92
A	turnin	92
A	target	Chef Breanna
S	
T	completewith	next
A	hs	
S	
A	goto	1429/0,87.73,-9456.79
A	turnin	118
A	accept	119
A	target	Smith Argus
S	
T	completewith	next
A	goto	1429/0,-158.00,-8901.52,10,0
A	goto	1429/0,-174.32,-8881.39,10,0
A	goto	1429/0,-186.46,-8874.91,10
S	
A	goto	1429/0,-186.46,-8874.91
A	turnin	347
A	accept	346
A	target	Brother Paxton
S	
T	completewith	CharysEnd
A	cast	3561
A	zoneskip	Stormwind City
S	
T	completewith	CharysEnd
A	xp	<22,1
S	
A	goto	1453/0,867.06,-9012.61
A	train	10
A	target	Maginor Dumas
A	xp	<22,1
S	
T	completewith	CharysEnd
A	goto	1453/0,887.22,-9017.80,10,0
A	goto	1453/0,871.36,-9013.14,10,0
A	goto	1453/0,868.8,-9004.27,8,0
A	goto	1453/0,877.00,-9008.03,6,0
A	goto	1453/0,863.96,-9001.40,8,0
A	goto	1453/0,928.62,-9010.10,15,0
A	goto	1453/0,962.63,-8990.73,15,0
A	goto	1453/0,949.86,-9009.380,10,0
A	goto	1453/0,942.34,-9001.49,8,0
A	goto	1453/0,948.65,-8994.50,10
S	
T	completewith	BankDeposit
A	xp	>22,1
S	
A	goto	1453/0,948.65,-8994.50
A	vendor	1307
A	itemcount	4827,1
A	target	Charys Yserian
S	
A	goto	1453/0,948.65,-8994.50
A	vendor	1307
A	itemcount	4828,1
A	target	Charys Yserian
S	
A	goto	1453/0,948.65,-8994.50
A	vendor	1307
A	itemcount	4829,1
A	target	Charys Yserian
S	
T	label	CharysEnd
A	goto	1453/0,948.65,-8994.50
A	vendor	1307
A	itemcount	4827,<1
A	itemcount	4828,<1
A	itemcount	4829,<1
A	target	Charys Yserian
S	
T	completewith	next
A	goto	1453/0,852.40,-8920.10,20,0
A	goto	1453/0,829.01,-8901.28,20,0
A	goto	1453/0,789.22,-8904.59,20,0
A	goto	1453/0,758.31,-8878.78,20,0
A	goto	1453/0,810.33,-8832.44,20,0
A	goto	1453/0,827.54,-8850.19,15,0
A	goto	1453/0,822.16,-8865.60,10
S	
T	label	AdairX
A	goto	1453/0,822.16,-8865.60
A	vendor	1316
A	target	Adair Gilroy
S	
T	completewith	next
A	goto	1453/0,872.30,-8803.220,5,0
A	goto	1453/0,872.70,-8682.39,20
S	
A	goto	1453/0,766.64,-8623.23
A	turnin	346
A	target	Brother Kristoff
S	
A	goto	1453/0,638.26,-8342.22
A	vendor	5519
A	target	Billibub Cogspinner
A	itemcount	4371,<1
A	isQuestAvailable	174
S	
T	completewith	next
A	goto	1453/0,522.12,-8352.80,20
S	
T	completewith	next
S	
A	zone	Ironforge
S	
A	goto	1455/0,-1249.87,-4793.31
A	vendor	5175
A	target	Gearcutter Cogspinner
A	itemcount	4371,<1
A	isQuestAvailable	174
S	
T	completewith	BankDeposit
A	goto	1455/0,-977.98,-4904.59,30
S	
A	goto	1455/0,-997.66,-4886.49
A	bankdeposit	17056,2592,1015,1083,2665,1922,1284
A	target	Bailey Stonemantle
S	
T	label	BankDeposit
A	goto	1455/0,-997.66,-4886.49
A	bankwithdraw	4654
A	target	Bailey Stonemantle
S	
A	goto	1455/0,-915.2,-4606.38
A	train	3562
A	target	Milstaff Stormeye
S	
T	completewith	FlyMene
S	
A	goto	1455/0,-928.48,-4614.620
A	train	10
A	target	Dink
S	
T	completewith	next
S	
T	completewith	next
T	label	FlyMene
A	goto	1455/0,-1152.39,-4820.914
A	fly	Menethil
A	target	Gryth Thurden
S	
A	zone	Wetlands
E
G	Guides/forever/Attunements.lua
M	classic	
M	tbc	
M	selector	Alliance
M	group	RestedXP Endgame Guides
M	subgroup	Attunements
M	name	Onyxia Attunement (A)
S	
T	completewith	next
A	zone	Burning Steppes
S	
A	goto	Burning Steppes,85.820,68.948
A	accept	4182
A	target	Helendis Riverhorn
S	
T	loop	
A	goto	1428/0,-2920.49,-7882.36,0
A	goto	1428/0,-2662.73,-7573.93,70,0
A	goto	1428/0,-2943.93,-7667.63,70,0
A	goto	1428/0,-2897.06,-8097.09,70,0
A	goto	1428/0,-2662.73,-8202.50,70,0
A	goto	1428/0,-2897.06,-8097.09,70,0
A	goto	1428/0,-2943.93,-7667.63,70,0
A	goto	1428/0,-2662.73,-7573.93,70,0
A	goto	1428/0,-2920.49,-7882.36,70,0
A	complete	4182,1
A	mob	+Black Broodling
A	complete	4182,2
A	mob	+Black Dragonspawn
A	complete	4182,4
A	mob	+Black Drake
A	complete	4182,3
A	mob	+Black Wyrmkin
S	
A	isQuestComplete	4182
A	goto	Burning Steppes,85.820,68.948
A	turnin	4182
A	accept	4183
A	target	Helendis Riverhorn
S	
A	isQuestTurnedIn	4182
A	goto	Burning Steppes,85.820,68.948
A	accept	4183
A	target	Helendis Riverhorn
S	
A	isQuestTurnedIn	4182
T	completewith	next
A	goto	1428/0,-2736.92,-8365.07
A	fly	Redridge
A	target	Borgus Stoutarm
S	
A	isQuestTurnedIn	4182
A	goto	1433/0,-2221.65,-9218.60
A	turnin	4183
A	accept	4184
A	target	Magistrate Solomon
S	
A	isQuestTurnedIn	4182
A	goto	Redridge Mountains,30.590,59.410
A	fly	Stormwind
A	target	Ariena Stormfeather
A	zoneskip	Redridge Mountains,1
S	
A	isQuestTurnedIn	4182
A	goto	1453/0,329.58,-8440.010
A	turnin	4184
A	accept	4185
A	target	Highlord Bolvar Fordragon
S	
A	isQuestTurnedIn	4182
A	goto	1453/0,331.07,-8437.950
A	complete	4185,1
A	skipgossip	
A	target	Lady Katrana Prestor
S	
A	isQuestTurnedIn	4182
A	goto	1453/0,329.58,-8440.010
A	turnin	4185
A	accept	4186
A	target	Highlord Bolvar Fordragon
S	
A	isQuestTurnedIn	4182
T	completewith	next
A	goto	1453/0,490.03,-8835.82
A	fly	Redridge
A	target	Dungar Longdrink
S	
A	isQuestTurnedIn	4182
A	goto	1433/0,-2221.65,-9218.60
A	turnin	4186
A	accept	4223
A	target	Magistrate Solomon
S	
A	isQuestTurnedIn	4182
T	completewith	next
A	goto	Redridge Mountains,30.590,59.410
A	fly	Burning Steppes
A	target	Ariena Stormfeather
S	
A	isQuestTurnedIn	4182
A	goto	1428/0,-2748.96,-8378.48
A	turnin	4223
A	accept	4224
A	target	Marshal Maxwell
S	
A	isQuestTurnedIn	4182
T	completewith	WindsorPickup
A	goto	1428/0,-2177.54,-7499.89
A	subzone	251
S	
A	isQuestTurnedIn	4182
A	goto	1428/0,-2170.98,-7495.01
A	complete	4224,1
A	skipgossip	
A	target	Ragged John
S	
T	label	WindsorPickup
A	isQuestTurnedIn	4182
A	goto	1428/0,-2748.96,-8378.48
A	turnin	4224
A	accept	4241
A	target	Marshal Maxwell
S	
T	completewith	next
A	subzone	254
S	
A	isQuestTurnedIn	4182
T	completewith	next
A	goto	1415/0,-920.59,-7181.25
A	subzone	1584,2
S	
A	isQuestTurnedIn	4182
A	turnin	4241
A	accept	4242
S	
A	isQuestTurnedIn	4182
T	completewith	next
A	subzone	2418
S	
A	isQuestTurnedIn	4182
A	goto	1428/0,-2748.96,-8378.48
A	turnin	4242
A	target	Marshal Maxwell
S	
T	completewith	next
A	subzone	254
S	
A	isQuestTurnedIn	4242
A	goto	1415/0,-920.59,-7181.25
T	completewith	next
A	subzone	1584,2
S	
A	isQuestTurnedIn	4242
A	use	11446
A	collect	11446,1,4264,1
A	accept	4264
S	
A	isOnQuest	4264
A	turnin	4264
A	accept	4282
S	
A	isQuestTurnedIn	4264
A	accept	4282
S	
A	isOnQuest	4282
A	complete	4282,1
A	complete	4282,2
S	
A	isQuestTurnedIn	4264
A	turnin	4282
A	accept	4322,1
S	
A	isOnQuest	4322
A	complete	4322,1
S	
T	completewith	Rendezvoes
A	subzone	2418
S	
A	isQuestComplete	4322
A	goto	1428/0,-2748.96,-8378.48
A	turnin	4322
A	accept	6402
A	target	Marshal Maxwell
S	
A	isQuestTurnedIn	4322
T	label	Rendezvoes
A	goto	1428/0,-2748.96,-8378.48
A	accept	6402
A	target	Marshal Maxwell
S	
A	isQuestTurnedIn	4322
T	completewith	next
A	goto	1453/0,434.28,-9042.28,5,0
A	goto	1453/0,443.89,-9050.46
A	turnin	6402
A	accept	6403,1
A	skipgossip	
A	target	Squire Rowe
A	target	Reginald Windsor
S	
A	isQuestTurnedIn	4322
A	goto	1453/0,359.93,-8450.18,-1
A	goto	1453/0,347.7,-8465.560,-1
A	complete	6403,1
A	target	Reginald Windsor
S	
A	isQuestComplete	6403
A	goto	1453/0,338.23,-8447.94
A	turnin	6403
A	accept	6501
A	target	Highlord Bolvar Fordragon
S	
A	isQuestTurnedIn	6403
A	goto	1453/0,338.23,-8447.94
A	accept	6501
A	target	Highlord Bolvar Fordragon
S	
T	completewith	next
A	zone	Winterspring
S	
A	isQuestTurnedIn	6403
T	completewith	next
A	goto	1452/1,-4335.27,6035.08,0
A	goto	1452/1,-4335.27,6035.08,50,0
A	goto	1452/1,-4318.23,5996.270,30,0
A	goto	1452/1,-4243.68,5984.91,20,0
A	goto	1452/1,-4206.05,6010.470,20,0
A	goto	1452/1,-4186.88,6003.84,20,0
A	goto	1452/1,-4160.61,6032.24,10,0
A	goto	1452/1,-4131.50,6070.11,10,0
A	goto	1452/1,-4189.01,6109.39,30
A	link	https://www.youtube.com/watch?v=qjmkIzbfBbQ&ab_channel=RestedXP
S	
A	isQuestTurnedIn	6403
A	goto	1452/1,-4189.01,6109.39
A	turnin	6501
A	accept	6502
A	target	Haleh
S	
T	completewith	next
A	subzone	254
S	
T	completewith	next
A	goto	1415/0,-1230.35,-7526.21
A	subzone	1583
S	
A	isQuestTurnedIn	6403
A	complete	6502,1
A	mob	General Drakkisath
S	
T	completewith	next
A	zone	Winterspring
S	
T	completewith	next
A	goto	1452/1,-4335.27,6035.08,0
A	goto	1452/1,-4335.27,6035.08,50,0
A	goto	1452/1,-4318.23,5996.270,30,0
A	goto	1452/1,-4243.68,5984.91,20,0
A	goto	1452/1,-4206.05,6010.470,20,0
A	goto	1452/1,-4186.88,6003.84,20,0
A	goto	1452/1,-4160.61,6032.24,10,0
A	goto	1452/1,-4131.50,6070.11,10,0
A	goto	1452/1,-4189.01,6109.39,30
A	link	https://www.youtube.com/watch?v=qjmkIzbfBbQ&ab_channel=RestedXP
S	
T	softcore	
A	isQuestTurnedIn	6403
A	goto	1452/1,-4189.01,6109.39
A	turnin	6502
A	target	Haleh
S	
T	hardcore	
A	isQuestTurnedIn	6403
A	goto	1452/1,-4189.01,6109.39
A	turnin	6502
A	target	Haleh
E
G	Guides/forever/Attunements.lua
M	classic	
M	tbc	
M	selector	Horde
M	group	RestedXP Endgame Guides
M	subgroup	Attunements
M	name	Onyxia Attunement (H)
S	
T	completewith	next
A	subzone	340
S	
A	goto	1418/0,-2223.69,-6677.62
A	collect	12563,1,4903
A	accept	4903
A	target	Warlord Goretooth
A	skipgossip	0,1,1,1,1,1
S	
T	completewith	next
A	subzone	254
S	
T	completewith	next
A	goto	1415/0,-1230.35,-7526.21
A	subzone	1583
S	
T	sticky	
T	label	ImportantDocuments
A	complete	4903,4
S	
A	complete	4903,2
A	mob	+Highlord Omokk
A	complete	4903,3
A	mob	+War Master Voone
A	complete	4903,1
A	mob	+Overlord Wyrmthalak
S	
T	requires	ImportantDocuments
T	completewith	next
A	subzone	340
S	
T	requires	ImportantDocuments
A	goto	1418/0,-2223.69,-6677.62
A	turnin	4903
A	accept	4941
A	target	Warlord Goretooth
S	
T	completewith	next
A	zone	Orgrimmar
S	
A	goto	1454/1,-4161.27,1905.79,10,0
A	goto	1454/1,-4125.79,1920.10
A	turnin	4941
A	accept	4974
A	target	Eitrigg
A	target	Thrall
A	skipgossip	
S	
T	completewith	next
A	subzone	254
S	
T	completewith	next
A	subzone	1583,2
S	
A	complete	4974,1
A	mob	Rend Blackhand
S	
T	completewith	next
A	zone	Orgrimmar
S	
A	goto	1454/1,-4125.79,1920.10
A	turnin	4974
A	accept	6566
A	target	Thrall
S	
A	goto	1454/1,-4125.79,1920.10
A	complete	6566,1
A	target	Thrall
A	skipgossip	
S	
A	goto	1454/1,-4125.79,1920.10
A	turnin	6566
A	accept	6567
A	target	Thrall
S	
T	completewith	next
A	goto	Orgrimmar,45.120,63.889
A	fly	Sun Rock Retreat
A	target	Doras
A	zoneskip	Stonetalon Mountains
A	zoneskip	Desolace
A	zoneskip	Feralas
S	
T	loop	
A	line	Desolace,55.50,0.50,53.37,5.77,54.61,10.71,56.20,13.14,60.42,16.17,62.27,19.48,63.38,26.21,62.14,32.17,60.49,37.07,57.27,38.21,53.34,37.51,50.46,42.48,49.55,48.56,49.10,54.18,52.25,59.36,54.52,63.72,55.63,67.41,52.04,71.54,50.53,75.40,47.03,75.15,39.99,78.28,39.79,81.92,41.79,85.27,40.68,89.43,41.44,93.66,41.95,96.04
A	line	Feralas,45.47,2.89,45.91,4.75,44.95,7.04,45.03,8.93,45.75,10.64,45.94,12.52,46.43,15.18,46.34,20.94,48.19,23.23
A	goto	1443/1,1738.15,437.09,60,0
A	goto	1443/1,1833.91,279.10,60,0
A	goto	1443/1,1778.16,131.01,60,0
A	goto	1443/1,1706.67,58.16,60,0
A	goto	1443/1,1516.95,-32.68,60,0
A	goto	1443/1,1433.78,-131.91,60,0
A	goto	1443/1,1383.87,-333.67,60,0
A	goto	1443/1,1439.62,-512.35,60,0
A	goto	1443/1,1513.80,-659.24,60,0
A	goto	1443/1,1658.57,-693.42,60,0
A	goto	1443/1,1835.26,-672.44,60,0
A	goto	1443/1,1964.74,-821.43,60,0
A	goto	1443/1,2005.65,-1003.71,60,0
A	goto	1443/1,2025.88,-1172.19,60,0
A	goto	1443/1,1884.26,-1327.48,60,0
A	goto	1443/1,1782.20,-1458.19,60,0
A	goto	1443/1,1732.30,-1568.81,60,0
A	goto	1443/1,1893.70,-1692.63,60,0
A	goto	1443/1,1961.59,-1808.350,60,0
A	goto	1443/1,2118.94,-1800.85,60,0
A	goto	1443/1,2435.45,-1894.69,60,0
A	goto	1443/1,2444.44,-2003.81,60,0
A	goto	1443/1,2354.52,-2104.24,60,0
A	goto	1443/1,2404.43,-2228.95,60,0
A	goto	1443/1,2370.26,-2355.77,60,0
A	goto	1443/1,2347.33,-2427.12,60,0
A	goto	1444/1,2281.50,-2500.57,60,0
A	goto	1444/1,2250.92,-2586.75,60,0
A	goto	1444/1,2317.64,-2692.85,60,0
A	goto	1444/1,2312.08,-2780.42,60,0
A	goto	1444/1,2262.04,-2859.65,60,0
A	goto	1444/1,2248.84,-2946.76,60,0
A	goto	1444/1,2214.78,-3070.01,60,0
A	goto	1444/1,2221.04,-3336.89,60,0
A	goto	1444/1,2092.46,-3442.99,60,0
A	turnin	6567
A	accept	6568
A	unitscan	Rexxar
S	
T	completewith	next
A	zone	Western Plaguelands
S	
A	goto	1422/0,-1767.30,1134.97
A	turnin	6568
A	accept	6569
A	target	Myranda the Hag
S	
T	completewith	next
A	subzone	254
S	
T	completewith	next
A	goto	1415/0,-1230.35,-7526.21
A	subzone	1583
S	
A	complete	6569,1
S	
T	completewith	next
A	zone	Western Plaguelands
S	
A	goto	1422/0,-1767.30,1134.97
A	turnin	6569
A	accept	6570
A	target	Myranda the Hag
S	
T	completewith	next
A	zone	Dustwallow Marsh
S	
T	completewith	Emberstrife1
A	goto	1445/1,-3829.43,-4981.03
A	subzone	2158
S	
T	hardcore	
T	completewith	next
A	cast	19937
A	use	16787
S	
T	label	Emberstrife1
A	goto	1445/1,-3950.18,-5100.73
A	use	16787
A	turnin	6570
A	accept	6582
A	accept	6583
A	accept	6584
A	target	Emberstrife
S	
T	sticky	
T	label	SkullofDragons
A	complete	6582,1
A	goto	1452/1,-4073.28,5893.55,0
A	complete	6583,1
A	goto	1435/0,-4192.10,-10420.28,0
A	line	Swamp of Sorrows,85.85,52.28,84.66,48.44,80.35,45.41,78.44,50.46,79.44,57.58,77.47,62.39,76.08,66.50,76.25,70.23,82.55,72.08,85.42,63.68,86.68,55.89,85.85,52.28
A	complete	6584,1
A	goto	1446/1,-4693.40,-8198.92
A	unitscan	Scryer
A	unitscan	Somnus
A	unitscan	Chronalis
S	
T	completewith	next
A	zone	Winterspring
S	
T	completewith	next
A	goto	1452/1,-4368.64,6168.09
A	subzone	2245
S	
A	goto	1452/1,-4073.28,5893.55
A	complete	6582,1
A	unitscan	Scryer
S	
T	completewith	next
A	zone	Swamp of Sorrows
S	
T	loop	
A	goto	1435/0,-4192.10,-10420.28,0
A	line	Swamp of Sorrows,85.85,52.28,84.66,48.44,80.35,45.41,78.44,50.46,79.44,57.58,77.47,62.39,76.08,66.50,76.25,70.23,82.55,72.08,85.42,63.68,86.68,55.89,85.85,52.28
A	goto	1435/0,-4192.10,-10420.28,50,0
A	goto	1435/0,-4164.81,-10361.56,50,0
A	goto	1435/0,-4065.94,-10315.23,50,0
A	goto	1435/0,-4022.13,-10392.45,50,0
A	goto	1435/0,-4045.07,-10501.33,50,0
A	goto	1435/0,-3999.88,-10574.88,50,0
A	goto	1435/0,-3968.00,-10637.730,50,0
A	goto	1435/0,-3971.90,-10694.77,50,0
A	goto	1435/0,-4116.41,-10723.06,50,0
A	goto	1435/0,-4182.24,-10594.61,50,0
A	goto	1435/0,-4211.14,-10475.48,50,0
A	complete	6583,1
A	unitscan	Somnus
S	
T	completewith	next
A	zone	Tanaris
S	
T	completewith	next
A	goto	1446/1,-4465.70,-8199.84
A	subzone	1941
S	
A	goto	1446/1,-4693.40,-8198.92
A	complete	6584,1
A	unitscan	Chronalis
S	
T	requires	SkullofDragons
T	completewith	next
A	zone	Dustwallow Marsh
S	
T	requires	SkullofDragons
T	completewith	Emberstrife2
A	goto	1445/1,-3829.43,-4981.03
A	subzone	2158
S	
T	requires	SkullofDragons
T	hardcore	
T	completewith	next
A	cast	19937
A	use	16787
S	
T	label	Emberstrife2
T	requires	SkullofDragons
A	goto	1445/1,-3950.18,-5100.73
A	use	16787
A	turnin	6582
A	turnin	6583
A	turnin	6584
A	accept	6585
A	target	Emberstrife
S	
T	completewith	next
A	zone	Wetlands
S	
T	completewith	next
A	goto	1437/0,-3509.34,-3436.74
A	subzone	1038
S	
T	loop	
A	goto	1437/0,-3841.42,-3492.42,0
A	line	Wetlands,81.41,48.41,83.47,48.78,85.61,50.89
A	goto	1437/0,-3756.23,-3482.22,30,0
A	goto	1437/0,-3841.42,-3492.42,30,0
A	goto	1437/0,-3929.91,-3550.57,30,0
A	complete	6585,1
A	unitscan	Axtroz
S	
T	completewith	next
A	zone	Dustwallow Marsh
S	
T	completewith	Emberstrife3
A	goto	1445/1,-3829.43,-4981.03
A	subzone	2158
S	
T	hardcore	
T	completewith	next
A	cast	19937
A	use	16787
S	
T	label	Emberstrife3
A	goto	1445/1,-3950.18,-5100.73
A	use	16787
A	turnin	6585
A	accept	6601
A	target	Emberstrife
S	
T	completewith	next
A	zone	Desolace
S	
T	loop	
A	line	Desolace,55.50,0.50,53.37,5.77,54.61,10.71,56.20,13.14,60.42,16.17,62.27,19.48,63.38,26.21,62.14,32.17,60.49,37.07,57.27,38.21,53.34,37.51,50.46,42.48,49.55,48.56,49.10,54.18,52.25,59.36,54.52,63.72,55.63,67.41,52.04,71.54,50.53,75.40,47.03,75.15,39.99,78.28,39.79,81.92,41.79,85.27,40.68,89.43,41.44,93.66,41.95,96.04
A	line	Feralas,45.47,2.89,45.91,4.75,44.95,7.04,45.03,8.93,45.75,10.64,45.94,12.52,46.43,15.18,46.34,20.94,48.19,23.23
A	goto	1443/1,1738.15,437.09,60,0
A	goto	1443/1,1833.91,279.10,60,0
A	goto	1443/1,1778.16,131.01,60,0
A	goto	1443/1,1706.67,58.16,60,0
A	goto	1443/1,1516.95,-32.68,60,0
A	goto	1443/1,1433.78,-131.91,60,0
A	goto	1443/1,1383.87,-333.67,60,0
A	goto	1443/1,1439.62,-512.35,60,0
A	goto	1443/1,1513.80,-659.24,60,0
A	goto	1443/1,1658.57,-693.42,60,0
A	goto	1443/1,1835.26,-672.44,60,0
A	goto	1443/1,1964.74,-821.43,60,0
A	goto	1443/1,2005.65,-1003.71,60,0
A	goto	1443/1,2025.88,-1172.19,60,0
A	goto	1443/1,1884.26,-1327.48,60,0
A	goto	1443/1,1782.20,-1458.19,60,0
A	goto	1443/1,1732.30,-1568.81,60,0
A	goto	1443/1,1893.70,-1692.63,60,0
A	goto	1443/1,1961.59,-1808.350,60,0
A	goto	1443/1,2118.94,-1800.85,60,0
A	goto	1443/1,2435.45,-1894.69,60,0
A	goto	1443/1,2444.44,-2003.81,60,0
A	goto	1443/1,2354.52,-2104.24,60,0
A	goto	1443/1,2404.43,-2228.95,60,0
A	goto	1443/1,2370.26,-2355.77,60,0
A	goto	1443/1,2347.33,-2427.12,60,0
A	goto	1444/1,2281.50,-2500.57,60,0
A	goto	1444/1,2250.92,-2586.75,60,0
A	goto	1444/1,2317.64,-2692.85,60,0
A	goto	1444/1,2312.08,-2780.42,60,0
A	goto	1444/1,2262.04,-2859.65,60,0
A	goto	1444/1,2248.84,-2946.76,60,0
A	goto	1444/1,2214.78,-3070.01,60,0
A	goto	1444/1,2221.04,-3336.89,60,0
A	goto	1444/1,2092.46,-3442.99,60,0
A	turnin	6601
A	accept	6602
A	unitscan	Rexxar
S	
T	completewith	next
A	subzone	254
S	
T	completewith	next
A	goto	1415/0,-1230.35,-7526.21
A	subzone	1583
S	
A	isQuestTurnedIn	6601
A	complete	6602,1
A	mob	General Drakkisath
S	
T	completewith	next
A	zone	Desolace
S	
A	isQuestComplete	6602
T	loop	
A	line	Desolace,55.50,0.50,53.37,5.77,54.61,10.71,56.20,13.14,60.42,16.17,62.27,19.48,63.38,26.21,62.14,32.17,60.49,37.07,57.27,38.21,53.34,37.51,50.46,42.48,49.55,48.56,49.10,54.18,52.25,59.36,54.52,63.72,55.63,67.41,52.04,71.54,50.53,75.40,47.03,75.15,39.99,78.28,39.79,81.92,41.79,85.27,40.68,89.43,41.44,93.66,41.95,96.04
A	line	Feralas,45.47,2.89,45.91,4.75,44.95,7.04,45.03,8.93,45.75,10.64,45.94,12.52,46.43,15.18,46.34,20.94,48.19,23.23
A	goto	1443/1,1738.15,437.09,60,0
A	goto	1443/1,1833.91,279.10,60,0
A	goto	1443/1,1778.16,131.01,60,0
A	goto	1443/1,1706.67,58.16,60,0
A	goto	1443/1,1516.95,-32.68,60,0
A	goto	1443/1,1433.78,-131.91,60,0
A	goto	1443/1,1383.87,-333.67,60,0
A	goto	1443/1,1439.62,-512.35,60,0
A	goto	1443/1,1513.80,-659.24,60,0
A	goto	1443/1,1658.57,-693.42,60,0
A	goto	1443/1,1835.26,-672.44,60,0
A	goto	1443/1,1964.74,-821.43,60,0
A	goto	1443/1,2005.65,-1003.71,60,0
A	goto	1443/1,2025.88,-1172.19,60,0
A	goto	1443/1,1884.26,-1327.48,60,0
A	goto	1443/1,1782.20,-1458.19,60,0
A	goto	1443/1,1732.30,-1568.81,60,0
A	goto	1443/1,1893.70,-1692.63,60,0
A	goto	1443/1,1961.59,-1808.350,60,0
A	goto	1443/1,2118.94,-1800.85,60,0
A	goto	1443/1,2435.45,-1894.69,60,0
A	goto	1443/1,2444.44,-2003.81,60,0
A	goto	1443/1,2354.52,-2104.24,60,0
A	goto	1443/1,2404.43,-2228.95,60,0
A	goto	1443/1,2370.26,-2355.77,60,0
A	goto	1443/1,2347.33,-2427.12,60,0
A	goto	1444/1,2281.50,-2500.57,60,0
A	goto	1444/1,2250.92,-2586.75,60,0
A	goto	1444/1,2317.64,-2692.85,60,0
A	goto	1444/1,2312.08,-2780.42,60,0
A	goto	1444/1,2262.04,-2859.65,60,0
A	goto	1444/1,2248.84,-2946.76,60,0
A	goto	1444/1,2214.78,-3070.01,60,0
A	goto	1444/1,2221.04,-3336.89,60,0
A	goto	1444/1,2092.46,-3442.99,60,0
A	turnin	6602
A	unitscan	Rexxar
E
G	Guides/forever/Attunements.lua
M	classic	
M	tbc	
M	subgroup	Attunements
M	group	RestedXP Endgame Guides
M	name	Molten Core Attunement
S	
T	completewith	next
A	subzone	254
S	
A	goto	1415/0,-1040.27,-7509.78
A	accept	7848
A	target	Lothos Riftwaker
S	
T	completewith	next
A	goto	1415/0,-920.59,-7181.25
A	subzone	1584,2
S	
T	softcore	
A	complete	7848,1
S	
T	hardcore	
A	complete	7848,1
S	
T	completewith	next
A	subzone	254
S	
A	goto	1415/0,-1040.27,-7509.78
A	turnin	7848
A	target	Lothos Riftwaker
A	isQuestComplete	7848
E
G	Guides/forever/Attunements.lua
M	classic	
M	tbc	
M	group	RestedXP Endgame Guides
M	subgroup	Attunements
M	name	Blackwing Lair Attunement
S	
T	completewith	next
A	subzone	254
S	
T	hardcore	
A	goto	1415/0,-1226.83,-7533.25,10,0
A	goto	1415/0,-1251.47,-7580.18,10,0
A	goto	1415/0,-1290.19,-7573.14
A	use	18987
A	collect	18987,1,7761
A	accept	7761
A	unitscan	Scarshield Quartermaster
S	
T	softcore	
A	goto	1415/0,-1226.83,-7533.25,10,0
A	goto	1415/0,-1251.47,-7580.18,10,0
A	goto	1415/0,-1290.19,-7573.14
A	use	18987
A	collect	18987,1,7761
A	accept	7761
A	unitscan	Scarshield Quartermaster
S	
T	completewith	next
A	goto	1415/0,-1230.35,-7526.21
A	subzone	1583
S	
A	turnin	7761
E
G	Guides/forever/Attunements.lua
M	classic	
M	tbc	
M	group	RestedXP Endgame Guides
M	subgroup	Keys
M	name	Upper Blackrock Spire Key
S	
T	completewith	next
A	subzone	254
S	
T	completewith	next
A	goto	1415/0,-920.59,-7181.25
A	subzone	1583
S	
A	collect	12219,1,4742
S	
A	accept	4742
A	target	Scarshield Infiltrator
A	target	Vaelan
S	
A	complete	4742,1
A	target	+Highlord Omokk
A	complete	4742,2
A	target	+War Master Voone
A	complete	4742,3
A	target	+Overlord Wyrmthalak
S	
A	turnin	4742
A	accept	4743
A	target	Scarshield Infiltrator
A	target	Vaelan
S	
T	completewith	ForgedSeal
A	use	12339
A	collect	12323,1,4743,1
A	collect	12300,1,4743,1
S	
T	completewith	next
A	zone	Dustwallow Marsh
S	
T	softcore	
A	goto	1445/1,-3829.43,-4981.03
A	subzone	2158
S	
T	hardcore	
A	goto	1445/1,-3829.43,-4981.03
A	subzone	2158
S	
T	completewith	next
A	cast	16057
A	use	12323
S	
T	label	ForgedSeal
A	goto	1445/1,-3950.18,-5100.73
A	use	12300
A	complete	4743,1
A	mob	Emberstrife
S	
T	completewith	next
A	subzone	254
S	
T	completewith	next
A	goto	1415/0,-920.59,-7181.25
A	subzone	1583
S	
A	turnin	4743
A	target	Scarshield Infiltrator
A	target	Vaelan
E
G	Guides/forever/Attunements.lua
M	classic	
M	tbc	
M	selector	Alliance
M	group	RestedXP Endgame Guides
M	subgroup	Keys
M	name	Scholomance Key (A)
S	
T	sticky	
T	label	ThoriumBars
A	collect	12359,2,5801,1
S	
T	completewith	next
A	zone	Ironforge
S	
T	loop	
A	goto	1455/0,-977.66,-4674.76,0
A	goto	1455/0,-977.66,-4674.76,70,0
A	goto	1455/0,-915.99,-4894.25,70,0
A	goto	1455/0,-1225.92,-4979.72,70,0
A	goto	1455/0,-1271.77,-4822.49,70,0
A	goto	1455/0,-1227.5,-4688.48,70,0
A	goto	1455/0,-1112.07,-4624.11,70,0
A	goto	1455/0,-971.34,-4680.04,70,0
A	goto	1455/0,-1036.17,-4777.12,70,0
A	goto	1455/0,-1118.39,-4867.87,70,0
A	goto	1455/0,-1154.76,-4754.96,70,0
A	goto	1455/0,-974.5,-4687.42,70,0
A	acceptmultiple	5091,5090,5066
A	unitscan	Courier Hammerfall
A	unitscan	Herald Moonstalker
A	unitscan	Crier Goodman
A	isQuestAvailable	5092
S	
T	requires	ThoriumBars
T	completewith	ClearTheWayPU
A	subzone	3197
S	
T	requires	ThoriumBars
T	optional	
A	isOnQuest	5066
A	goto	1422/0,-1419.52,957.78
A	turnin	5066
A	accept	5092
A	target	Commander Ashlam Valorfist
S	
T	requires	ThoriumBars
T	optional	
A	isQuestTurnedIn	5066
A	goto	1422/0,-1419.52,957.78
A	accept	5092
A	target	Commander Ashlam Valorfist
S	
T	requires	ThoriumBars
T	optional	
A	isOnQuest	5091
A	goto	1422/0,-1419.52,957.78
A	turnin	5091
A	accept	5092
A	target	Commander Ashlam Valorfist
S	
T	requires	ThoriumBars
T	optional	
A	isQuestTurnedIn	5091
A	goto	1422/0,-1419.52,957.78
A	accept	5092
A	target	Commander Ashlam Valorfist
S	
T	requires	ThoriumBars
A	isOnQuest	5090
A	goto	1422/0,-1419.52,957.78
A	turnin	5090
A	accept	5092
A	target	Commander Ashlam Valorfist
S	
T	requires	ThoriumBars
T	label	ClearTheWayPU
A	isQuestTurnedIn	5090
A	goto	1422/0,-1419.52,957.78
A	accept	5092
A	target	Commander Ashlam Valorfist
S	
T	loop	
A	goto	1422/0,-1729.03,1172.52,0
A	goto	1422/0,-1677.43,1062.73,60,0
A	goto	1422/0,-1729.03,1172.52,60,0
A	goto	1422/0,-1771.17,1183.99,60,0
A	goto	1422/0,-1735.48,1052.12,60,0
A	complete	5092,1
A	mob	+Skeletal Flayer
A	complete	5092,2
A	mob	+Slavering Ghoul
S	
A	goto	1422/0,-1419.52,957.78
A	accept	5098
A	target	Commander Ashlam Valorfist
S	
A	goto	1422/0,-1590.62,1327.46,-1
A	goto	1422/0,-1585.33,1326.86,-1
A	use	12815
A	complete	5098,4
S	
A	goto	1422/0,-1484.66,1551.52,-1
A	goto	1422/0,-1485.95,1556.91,-1
A	use	12815
A	complete	5098,3
S	
A	goto	1422/0,-1403.35,1471.66,-1
A	goto	1422/0,-1407.48,1468.30,-1
A	use	12815
A	complete	5098,2
S	
A	goto	1422/0,-1308.32,1315.25,-1
A	goto	1422/0,-1304.97,1310.89,-1
A	use	12815
A	complete	5098,1
S	
A	goto	1422/0,-1419.52,957.78
A	turnin	5098
A	accept	5533
A	target	Commander Ashlam Valorfist
S	
T	completewith	SkeletalFragments
A	isQuestTurnedIn	5098
A	destroy	12815
S	
A	goto	1422/0,-1417.93,965.15
A	turnin	5533
A	accept	5537
A	target	Alchemist Arbington
S	
T	label	SkeletalFragments
T	loop	
A	line	Western Plaguelands,46.4,70.0,45.6,72.2,42.6,71.4,41.6,73.2,38.8,71.0,38.8,68.2,40.4,66.4,42.6,70.0,43.4,64.4,45.8,65.8,46.4,70.0
A	goto	1422/0,-1578.53,1360.0,60,0
A	goto	1422/0,-1544.13,1296.93,60,0
A	goto	1422/0,-1415.13,1319.87,60,0
A	goto	1422/0,-1372.13,1268.27,60,0
A	goto	1422/0,-1251.73,1331.33,60,0
A	goto	1422/0,-1251.73,1411.6,60,0
A	goto	1422/0,-1320.53,1463.2,60,0
A	goto	1422/0,-1415.13,1360.0,60,0
A	goto	1422/0,-1449.53,1520.53,60,0
A	goto	1422/0,-1552.73,1480.4,60,0
A	goto	1422/0,-1578.53,1360.0,60,0
A	complete	5537,1
A	mob	Skeletal Executioner
A	mob	Skeletal Acolyte
S	
A	goto	1422/0,-1417.93,965.15
A	turnin	5537
A	accept	5538
A	target	Alchemist Arbington
S	
T	completewith	next
A	subzone	976
S	
A	goto	1446/1,-3769.49,-7200.26
A	turnin	5538
A	accept	5801
A	target	Krinkle Goodsteel
S	
A	collect	12359,2,5801,1
S	
T	completewith	next
A	goto	1446/1,-3738.16,-7224.87
A	fly	Un'Goro
A	target	Bera Stonehammer
A	zoneskip	Un'Goro Crater
S	
T	completewith	next
A	goto	1449/1,-1302.61,-7139.81,100
S	
A	goto	1449/1,-1290.03,-7126.99
A	use	14644
A	complete	5801,1
S	
T	completewith	next
A	subzone	3197
S	
A	goto	1422/0,-1417.93,965.15
A	turnin	5801
A	accept	5803
A	target	Alchemist Arbington
S	
T	completewith	ArajTheSummoner
A	goto	1422/0,-1544.13,1380.64,100
S	
T	softcore	
A	goto	1422/0,-1544.13,1380.64
A	use	12650
A	complete	5803,1
A	mob	Araj the Summoner
A	itemcount	12650,1
S	
T	softcore	
T	label	ArajTheSummoner
A	goto	1422/0,-1544.13,1380.64
A	complete	5803,1
A	mob	Araj the Summoner
S	
T	hardcore	
A	goto	1422/0,-1544.13,1380.64
A	use	12650
A	complete	5803,1
A	mob	Araj the Summoner
A	itemcount	12650,1
S	
T	hardcore	
T	label	ArajTheSummoner
A	goto	1422/0,-1544.13,1380.64
A	complete	5803,1
A	mob	Araj the Summoner
S	
A	goto	1422/0,-1417.93,965.15
A	turnin	5803
A	target	Alchemist Arbington
S	
A	goto	1422/0,-1417.93,965.15
A	turnin	5505
A	target	Alchemist Arbington
E
G	Guides/forever/Attunements.lua
M	classic	
M	tbc	
M	selector	Horde
M	group	RestedXP Endgame Guides
M	subgroup	Keys
M	name	Scholomance Key (H)
S	
T	sticky	
T	label	ThoriumBars
A	collect	12359,2,5801,1
S	
T	completewith	next
A	zone	Undercity
S	
T	loop	
A	goto	1458/0,226.29,1582.54,0
A	goto	1458/0,226.29,1582.54,50,0
A	goto	1458/0,189.83,1547.40,50,0
A	goto	1458/0,172.94,1595.08,50,0
A	goto	1458/0,192.90,1645.91,50,0
A	goto	1458/0,241.54,1663.25,50,0
A	goto	1458/0,288.93,1643.92,50,0
A	goto	1458/0,308.22,1594.380,50,0
A	goto	1458/0,288.17,1547.08,50,0
A	goto	1458/0,239.33,1528.19,50,0
A	goto	1458/0,193.86,1548.36,50,0
A	acceptmultiple	5093,5094,5095
A	unitscan	Warcaller Gorlach
A	unitscan	Harbinger Balthazadd
A	unitscan	Bluff Runner Windstrider
A	isQuestAvailable	5096
S	
T	requires	ThoriumBars
T	completewith	ScarletDiversionsPU
A	subzone	152
S	
T	optional	
T	requires	ThoriumBars
A	goto	1420/0,-724.01,1761.28
A	turnin	5093
A	accept	5096
A	target	High Executor Derrington
A	isOnQuest	5093
S	
T	optional	
T	requires	ThoriumBars
A	goto	1420/0,-724.01,1761.28
A	accept	5096
A	target	High Executor Derrington
A	isQuestTurnedIn	5093
S	
T	optional	
T	requires	ThoriumBars
A	goto	1420/0,-724.01,1761.28
A	turnin	5094
A	accept	5096
A	target	High Executor Derrington
A	isOnQuest	5094
S	
T	optional	
T	requires	ThoriumBars
A	goto	1420/0,-724.01,1761.28
A	accept	5096
A	target	High Executor Derrington
A	isQuestTurnedIn	5094
S	
T	requires	ThoriumBars
A	goto	1420/0,-724.01,1761.28
A	turnin	5095
A	accept	5096
A	target	High Executor Derrington
A	isOnQuest	5095
S	
A	goto	1422/0,-724.98,1756.17
A	collect	12814,1,5095,1
A	isOnQuest	5095
S	
T	label	ScarletDiversionsPU
T	requires	ThoriumBars
A	goto	1420/0,-724.01,1761.28
A	accept	5096
A	target	High Executor Derrington
A	isQuestTurnedIn	5095
S	
A	goto	1422/0,-1324.83,1881.73
A	use	12807
A	complete	5096,1
S	
A	goto	1420/0,-724.01,1761.28
A	turnin	5096
A	accept	5098
A	target	High Executor Derrington
S	
A	goto	1422/0,-1590.62,1327.46,-1
A	goto	1422/0,-1585.33,1326.86,-1
A	use	12815
A	complete	5098,4
S	
A	goto	1422/0,-1484.66,1551.52,-1
A	goto	1422/0,-1485.95,1556.91,-1
A	use	12815
A	complete	5098,3
S	
A	goto	1422/0,-1403.35,1471.66,-1
A	goto	1422/0,-1407.48,1468.30,-1
A	use	12815
A	complete	5098,2
S	
A	goto	1422/0,-1308.32,1315.25,-1
A	goto	1422/0,-1304.97,1310.89,-1
A	use	12815
A	complete	5098,1
S	
A	goto	1420/0,-724.01,1761.28
A	turnin	5098
A	accept	838
A	target	High Executor Derrington
S	
T	completewith	SkeletalFragments
A	isQuestTurnedIn	5098
A	destroy	12815
S	
T	era/som	
A	goto	1420/0,-729.88,1751.95
A	turnin	838
A	accept	964
A	target	Apothecary Dithers
S	
T	label	SkeletalFragments
T	loop	
A	line	Western Plaguelands,46.4,70.0,45.6,72.2,42.6,71.4,41.6,73.2,38.8,71.0,38.8,68.2,40.4,66.4,42.6,70.0,43.4,64.4,45.8,65.8,46.4,70.0
A	goto	1422/0,-1578.53,1360.0,60,0
A	goto	1422/0,-1544.13,1296.93,60,0
A	goto	1422/0,-1415.13,1319.87,60,0
A	goto	1422/0,-1372.13,1268.27,60,0
A	goto	1422/0,-1251.73,1331.33,60,0
A	goto	1422/0,-1251.73,1411.6,60,0
A	goto	1422/0,-1320.53,1463.2,60,0
A	goto	1422/0,-1415.13,1360.0,60,0
A	goto	1422/0,-1449.53,1520.53,60,0
A	goto	1422/0,-1552.73,1480.4,60,0
A	goto	1422/0,-1578.53,1360.0,60,0
A	complete	964,1
A	mob	Skeletal Executioner
A	mob	Skeletal Acolyte
S	
A	goto	1420/0,-729.88,1751.95
A	turnin	964
A	accept	5514
A	target	Apothecary Dithers
S	
T	completewith	next
A	subzone	976
S	
A	goto	1446/1,-3769.49,-7200.26
A	turnin	5514
A	accept	5802
A	target	Krinkle Goodsteel
S	
A	collect	12359,2,5802,1
S	
T	completewith	next
A	goto	1451/1,841.46,-6810.15
A	fly	Un'Goro
A	target	Runk Windtamer
A	zoneskip	Un'Goro Crater
S	
T	completewith	next
A	goto	1449/1,-1302.61,-7139.81,100
S	
A	goto	1449/1,-1290.03,-7126.99
A	use	14644
A	complete	5802,1
S	
T	completewith	next
A	subzone	152
S	
A	goto	1420/0,-729.88,1751.95
A	turnin	5802
A	accept	5804
A	target	Apothecary Dithers
S	
T	completewith	ArajTheSummoner
A	goto	1422/0,-1544.13,1380.64,100
S	
T	softcore	
A	goto	1422/0,-1544.13,1380.64
A	use	12650
A	complete	5804,1
A	mob	Araj the Summoner
A	itemcount	12650,1
S	
T	softcore	
T	label	ArajTheSummoner
A	goto	1422/0,-1544.13,1380.64
A	complete	5804,1
A	mob	Araj the Summoner
S	
T	hardcore	
A	goto	1422/0,-1544.13,1380.64
A	use	12650
A	complete	5804,1
A	mob	Araj the Summoner
A	itemcount	12650,1
S	
T	hardcore	
T	label	ArajTheSummoner
A	goto	1422/0,-1544.13,1380.64
A	complete	5804,1
A	mob	Araj the Summoner
S	
A	goto	1420/0,-729.88,1751.95
A	turnin	5804
A	target	Apothecary Dithers
S	
A	goto	1420/0,-729.88,1751.95
A	turnin	5511
A	target	Apothecary Dithers
E
G	Guides/forever/Attunements.lua
M	classic	
M	tbc	
M	group	RestedXP Endgame Guides
M	subgroup	Keys
M	name	Blackrock Depths Key
S	
T	completewith	next
A	subzone	254
S	
T	softcoreserver	
T	softcore	
A	goto	1415,48.624,64.186
A	accept	3801
A	turnin	3801
A	accept	3802
A	target	Franclorn Forgewright
S	
T	hardcoreserver	
T	completewith	next
A	goto	1415,48.656,64.134
A	cast	417803
S	
T	hardcoreserver	
A	goto	1415,48.624,64.186
A	accept	3801
A	turnin	3801
A	accept	3802
A	target	Franclorn Forgewright
S	
T	softcore	
T	completewith	next
A	goto	1415/0,-920.59,-7181.25
A	subzone	1584,2
S	
T	hardcoreserver	
T	completewith	next
A	goto	1415/0,-920.59,-7181.25
A	subzone	1584,2
S	
A	complete	3802,1
A	target	Fineous Darkvire
A	isOnQuest	3802
S	
A	turnin	3802
A	isQuestComplete	3802
E
G	Guides/forever/Attunements.lua
M	classic	
M	tbc	
M	group	RestedXP Endgame Guides
M	subgroup	Keys
M	name	Dire Maul Key
S	
T	completewith	next
A	zone	Feralas
A	subzoneskip	2557
S	
T	completewith	next
A	goto	1414/1,933.56,-3737.93,20
S	
T	completewith	next
A	skipgossip	
A	unitscan	Pusillin
S	
A	collect	18249,1
A	unitscan	Pusillin
E
G	Guides/forever/Attunements.lua
M	classic	
M	tbc	
M	group	RestedXP Endgame Guides
M	name	Naxxramas Attunement
M	subgroup	Attunements
S	
A	collect	12363,5
A	collect	20725,2
A	collect	12811,1
A	reputation	529,revered,>0,1
A	isQuestAvailable	9121
S	
A	collect	12363,2
A	collect	20725,1
A	reputation	529,exalted,>0,1
A	reputation	529,revered,<0,1
A	isQuestAvailable	9122
S	
T	completewith	AttuneComplete
A	zone	Eastern Plaguelands
S	
T	optional	
A	reputation	529,honored
S	
A	goto	1423/0,-5341.04,2295.93
A	accept	9121
A	turnin	9121
A	target	Archmage Angela Dosantos
A	reputation	529,revered,>0,1
A	isQuestAvailable	9121
S	
A	goto	1423/0,-5341.04,2295.93
A	accept	9122
A	turnin	9122
A	target	Archmage Angela Dosantos
A	reputation	529,exalted,>0,1
A	reputation	529,revered,<0,1
A	isQuestAvailable	9122
S	
T	label	AttuneComplete
A	goto	1423/0,-5341.04,2295.93
A	accept	9123
A	turnin	9123
A	target	Archmage Angela Dosantos
A	reputation	529,exalted,<0,1
A	isQuestAvailable	9123
E
G	Guides/forever/Attunements.lua
M	classic	
M	tbc	
M	group	RestedXP Endgame Guides
M	name	Demon Fall Canyon Attunement
M	subgroup	Attunements
S	
A	goto	1448/1,-1313.83,3990.00
A	accept	84384
A	target	Shadowtooth Emissary
A	itemcount	228172,<1
S	
T	completewith	next
A	zone	Winterspring
A	itemcount	228172,<1
S	
A	line	Winterspring,64.0,22.6,65.6,23.2,67.6,22.6,65.6,19.6,63.6,16.2,65.6,19.6,64.0,20.8,64.0,22.6
A	goto	1452/1,-4860.67,7463.6,25,0
A	goto	1452/1,-4974.27,7435.2,25,0
A	goto	1452/1,-5116.27,7463.6,25,0
A	goto	1452/1,-4974.27,7605.6,25,0
A	goto	1452/1,-4832.27,7766.53,25,0
A	goto	1452/1,-4974.27,7605.6,25,0
A	goto	1452/1,-4860.67,7548.8,25,0
A	goto	1452/1,-4860.67,7463.6,25,0
A	complete	84384,1
A	mob	Berserk Owlbeast
A	itemcount	228172,<1
S	
T	completewith	next
A	subzone	2479
A	itemcount	228172,<1
S	
A	goto	1448/1,-1313.83,3990.00
A	turnin	84384
A	target	Shadowtooth Emissary
A	itemcount	228172,<1
E
G	Guides/forever/0.5.lua
M	classic	
M	tbc	
M	group	RestedXP Endgame Guides
M	subgroup	Feralheart Set Guide << Druid
M	subgroup	Beastmaster Set Guide << Hunter
M	subgroup	Sorcerer's Set Guide << Mage
M	subgroup	Soulforge Set Guide << Paladin
M	subgroup	Darkmantle Set Guide << Rogue
M	subgroup	The Five Thunders Set Guide << Shaman
M	subgroup	Deathmist Set Guide << Warlock
M	subgroup	Heroism Set Guide << Warrior
M	subgroup	Virtuous Set Guide << Priest
M	name	Part 1: Bracers
M	next	Part 2: Belt & Gloves
S	
A	collect	16714,1,8905,1 << Alliance Druid
A	collect	16681,1,8906,1 << Alliance Hunter
A	collect	16683,1,8907,1 << Alliance Mage
A	collect	16722,1,8908,1 << Alliance Paladin
A	collect	16697,1,8909,1 << Alliance Priest
A	collect	16710,1,8910,1 << Alliance Rogue
A	collect	16703,1,8911,1 << Alliance Warlock
A	collect	16735,1,8912,1 << Alliance Warrior
A	collect	16714,1,8913,1 << Horde Druid
A	collect	16681,1,8914,1 << Horde Hunter
A	collect	16683,1,8915,1 << Horde Mage
A	collect	16697,1,8916,1 << Horde Priest
A	collect	16710,1,8917,1 << Horde Rogue
A	collect	16671,1,8918,1 << Horde Shaman
A	collect	16703,1,8919,1 << Horde Warlock
A	collect	16735,1,8920,1 << Horde Warrior
A	equip	9,16714 << Druid
A	equip	9,16681 << Hunter
A	equip	9,16683 << Mage
A	equip	9,16722 << Paladin
A	equip	9,16697 << Priest
A	equip	9,16710 << Rogue
A	equip	9,16703 << Warlock
A	equip	9,16735 << Warrior
A	equip	9,16671 << Shaman
S	Alliance
T	completewith	next
A	zone	Ironforge
S	Alliance
A	goto	1455/0,-1057.83,-4847.18
A	accept	8905
A	accept	8906
A	accept	8907
A	accept	8908
A	accept	8909
A	accept	8910
A	accept	8911
A	accept	8912
A	target	Deliana
S	Alliance
T	completewith	next
A	zone	Winterspring
S	Alliance
T	loop	
A	goto	1452/1,-3905.01,7857.89,0
A	goto	1452/1,-3905.01,7857.89,50,0
A	goto	1452/1,-3761.59,7958.23,50,0
A	goto	1452/1,-3846.79,8114.91,50,0
A	goto	1452/1,-3763.01,8159.87,50,0
A	goto	1452/1,-3843.24,8200.58,50,0
A	goto	1452/1,-4004.41,8092.66,50,0
A	goto	1452/1,-3983.11,7996.57,50,0
A	complete	8905,1 << Druid
A	complete	8906,1 << Hunter
A	complete	8907,1 << Mage
A	complete	8908,1 << Paladin
A	complete	8909,1 << Priest
A	complete	8910,1 << Rogue
A	complete	8911,1 << Warlock
A	complete	8912,1 << Warrior
A	mob	Frostsaber Cub
A	mob	Frostsaber
A	mob	Frostsaber Stalker
A	mob	Frostsaber Huntress
A	mob	Frostsaber Pride Watcher
A	mob	Shardtooth Mauler
A	mob	Elder Shardtooth
A	mob	Rabid Shardtooth
A	mob	Shardtooth Bear
S	Alliance
T	completewith	next
A	zone	Ironforge
S	Alliance
A	goto	1455/0,-1057.83,-4847.18
A	collect	16714,1,8905,1 << Druid
A	collect	16681,1,8906,1 << Hunter
A	collect	16683,1,8907,1 << Mage
A	collect	16722,1,8908,1 << Paladin
A	collect	16697,1,8909,1 << Priest
A	collect	16710,1,8910,1 << Rogue
A	collect	16703,1,8911,1 << Warlock
A	collect	16735,1,8912,1 << Warrior
A	turnin	8905
A	turnin	8906
A	turnin	8907
A	turnin	8908
A	turnin	8909
A	turnin	8910
A	turnin	8911
A	turnin	8912
A	accept	8922
A	target	Deliana
S	Horde
T	completewith	next
A	zone	Orgrimmar
S	Horde
A	goto	1454/1,-4170.95,1915.80
A	accept	8913
A	accept	8914
A	accept	8915
A	accept	8916
A	accept	8917
A	accept	8918
A	accept	8919
A	accept	8920
A	target	Mokvar
S	Horde
T	completewith	next
A	zone	Silithus
S	Horde
T	loop	
A	goto	1451/1,279.60,-6921.65,0
A	goto	1451/1,503.93,-6448.470,0
A	goto	1451/1,1376.16,-6777.63,0
A	goto	1451/1,1260.86,-7415.50,0
A	goto	1451/1,1544.05,-7763.94,0
A	goto	1451/1,956.07,-7821.31,0
A	goto	1451/1,489.3,-7398.31,0
A	goto	1451/1,279.60,-6921.65,90,0
A	goto	1451/1,503.93,-6448.470,90,0
A	goto	1451/1,1376.16,-6777.63,90,0
A	goto	1451/1,1260.86,-7415.50,90,0
A	goto	1451/1,1544.05,-7763.94,90,0
A	goto	1451/1,956.07,-7821.31,90,0
A	goto	1451/1,489.3,-7398.31,90,0
A	complete	8913,1 << Druid
A	complete	8914,1 << Hunter
A	complete	8915,1 << Mage
A	complete	8916,1 << Priest
A	complete	8917,1 << Rogue
A	complete	8918,1 << Shaman
A	complete	8919,1 << Warlock
A	complete	8920,1 << Warrior
A	mob	Sand Skitterer
A	mob	Stonelash Pincer
A	mob	Stonelash Scorpid
A	mob	Stonelash Flayer
A	mob	Rock Stalker
S	Horde
T	completewith	next
A	zone	Orgrimmar
S	Horde
A	goto	1454/1,-4170.95,1915.80
A	collect	16714,1,8913,1 << Druid
A	collect	16681,1,8914,1 << Hunter
A	collect	16683,1,8915,1 << Mage
A	collect	16697,1,8916,1 << Priest
A	collect	16710,1,8917,1 << Rogue
A	collect	16671,1,8918,1 << Shaman
A	collect	16703,1,8919,1 << Warlock
A	collect	16735,1,8920,1 << Warrior
A	turnin	8913
A	turnin	8914
A	turnin	8915
A	turnin	8916
A	turnin	8917
A	turnin	8918
A	turnin	8919
A	turnin	8920
A	accept	8923
A	target	Mokvar
E
G	Guides/forever/0.5.lua
M	classic	
M	tbc	
M	group	RestedXP Endgame Guides
M	subgroup	Feralheart Set Guide << Druid
M	subgroup	Beastmaster Set Guide << Hunter
M	subgroup	Sorcerer's Set Guide << Mage
M	subgroup	Soulforge Set Guide << Paladin
M	subgroup	Darkmantle Set Guide << Rogue
M	subgroup	The Five Thunders Set Guide << Shaman
M	subgroup	Deathmist Set Guide << Warlock
M	subgroup	Heroism Set Guide << Warrior
M	subgroup	Virtuous Set Guide << Priest
M	name	Part 2: Belt & Gloves
M	next	Part 3: Pants, Shoulders & Boots
S	
T	optional	
A	isQuestAvailable	8905 << Alliance Druid
A	isQuestAvailable	8906 << Alliance Hunter
A	isQuestAvailable	8907 << Alliance Mage
A	isQuestAvailable	8908 << Alliance Paladin
A	isQuestAvailable	8909 << Alliance Priest
A	isQuestAvailable	8910 << Alliance Rogue
A	isQuestAvailable	8911 << Alliance Warlock
A	isQuestAvailable	8912 << Alliance Warrior
A	isQuestAvailable	8913 << Horde Druid
A	isQuestAvailable	8914 << Horde Hunter
A	isQuestAvailable	8915 << Horde Mage
A	isQuestAvailable	8916 << Horde Priest
A	isQuestAvailable	8917 << Horde Rogue
A	isQuestAvailable	8918 << Horde Shaman
A	isQuestAvailable	8919 << Horde Warlock
A	isQuestAvailable	8920 << Horde Warrior
S	
A	collect	16716,1,8926,1 << Alliance Druid
A	collect	16680,1,8931,1 << Alliance Hunter
A	collect	16685,1,8932,1 << Alliance Mage
A	collect	16723,1,8933,1 << Alliance Paladin
A	collect	16696,1,8934,1 << Alliance Priest
A	collect	16713,1,8935,1 << Alliance Rogue
A	collect	16702,1,8936,1 << Alliance Warlock
A	collect	16736,1,8937,1 << Alliance Warrior
A	collect	16716,1,8927,1 << Horde Druid
A	collect	16680,1,8938,1 << Horde Hunter
A	collect	16685,1,8939,1 << Horde Mage
A	collect	16696,1,8940,1 << Horde Priest
A	collect	16713,1,8941,1 << Horde Rogue
A	collect	16673,1,8942,1 << Horde Shaman
A	collect	16702,1,8943,1 << Horde Warlock
A	collect	16736,1,8944,1 << Horde Warrior
A	equip	6,16716 << Druid
A	equip	6,16680 << Hunter
A	equip	6,16685 << Mage
A	equip	6,16723 << Paladin
A	equip	6,16696 << Priest
A	equip	6,16713 << Rogue
A	equip	6,16702 << Warlock
A	equip	6,16736 << Warrior
A	equip	6,16673 << Shaman
S	
A	collect	16717,1,8926,1 << Alliance Druid
A	collect	16676,1,8931,1 << Alliance Hunter
A	collect	16684,1,8932,1 << Alliance Mage
A	collect	16724,1,8933,1 << Alliance Paladin
A	collect	16692,1,8934,1 << Alliance Priest
A	collect	16712,1,8935,1 << Alliance Rogue
A	collect	16705,1,8936,1 << Alliance Warlock
A	collect	16737,1,8937,1 << Alliance Warrior
A	collect	16717,1,8927,1 << Horde Druid
A	collect	16676,1,8938,1 << Horde Hunter
A	collect	16684,1,8939,1 << Horde Mage
A	collect	16692,1,8940,1 << Horde Priest
A	collect	16712,1,8941,1 << Horde Rogue
A	collect	16672,1,8942,1 << Horde Shaman
A	collect	16705,1,8943,1 << Horde Warlock
A	collect	16737,1,8944,1 << Horde Warrior
A	equip	10,16717 << Druid
A	equip	10,16676 << Hunter
A	equip	10,16684 << Mage
A	equip	10,16724 << Paladin
A	equip	10,16692 << Priest
A	equip	10,16712 << Rogue
A	equip	10,16705 << Warlock
A	equip	10,16737 << Warrior
A	equip	10,16672 << Shaman
S	
A	collect	16006,1,8921,1
A	collect	16203,4,8921,1
A	collect	13423,10,8921,1
A	collect	9061,6,8924,1
S	Alliance
T	completewith	next
A	zone	Ironforge
S	Alliance
A	goto	1455/0,-1057.83,-4847.18
A	accept	8922
A	target	Deliana
S	Horde
T	completewith	next
A	zone	Orgrimmar
S	Horde
A	goto	1454/1,-4170.95,1915.80
A	accept	8923
A	target	Mokvar
S	
T	completewith	next
A	subzone	976
S	
A	goto	1446/1,-3839.18,-7127.58
A	turnin	8922
A	turnin	8923
A	accept	8921
A	target	Mux Manascrambler
S	
T	completewith	next
A	zone	Burning Steppes
S	
T	loop	
A	goto	1428/0,-2371.86,-7608.48,0
A	goto	1428/0,-2163.01,-7686.37,0
A	goto	1428/0,-1741.50,-7719.16,0
A	goto	1428/0,-1792.18,-7862.45,0
A	goto	1428/0,-1457.67,-7885.87,0
A	goto	1428/0,-1290.41,-7960.64,0
A	goto	1428/0,-952.09,-7934.67,0
A	goto	1428/0,-1271.96,-8178.68,0
A	goto	1428/0,-1885.32,-7966.300,0
A	goto	1428/0,-2371.86,-7608.48,60,0
A	goto	1428/0,-2163.01,-7686.37,60,0
A	goto	1428/0,-1741.50,-7719.16,60,0
A	goto	1428/0,-1792.18,-7862.45,60,0
A	goto	1428/0,-1457.67,-7885.87,60,0
A	goto	1428/0,-1290.41,-7960.64,60,0
A	goto	1428/0,-952.09,-7934.67,60,0
A	goto	1428/0,-1271.96,-8178.68,60,0
A	goto	1428/0,-1885.32,-7966.300,60,0
A	collect	22338,25,8921,1
S	
A	collect	16006,1,8921,1
A	collect	16203,4,8921,1
A	collect	13423,10,8921,1
A	collect	9061,6,8924,1
S	
T	completewith	next
A	subzone	976
S	
A	goto	1446/1,-3839.18,-7127.58
A	turnin	8921
A	accept	8924
A	target	Mux Manascrambler
S	
T	optional	
A	collect	9061,3,8924,1
S	
T	completewith	next
A	subzone	2738
S	
T	completewith	next
A	cast	27433
A	use	21946
S	
T	loop	
A	goto	1451/1,391.77,-7087.27,0
A	goto	1451/1,391.77,-7087.27,60,0
A	goto	1451/1,315.13,-7087.27,60,0
A	goto	1451/1,322.1,-7156.96,60,0
A	goto	1451/1,356.93,-7249.88,60,0
A	goto	1451/1,356.93,-7319.56,60,0
A	goto	1451/1,447.5,-7254.52,60,0
A	goto	1451/1,426.6,-7184.83,60,0
A	complete	8924,1
A	mob	Tortured Druid
A	mob	Tortured Sentinel
S	
T	completewith	next
A	zone	Winterspring
S	
T	completewith	next
A	cast	27433
A	use	21946
S	
T	loop	
A	goto	1452/1,-4251.49,6478.59,0
A	goto	1452/1,-4100.26,6459.19,0
A	goto	1452/1,-4051.27,6612.07,0
A	goto	1452/1,-4251.49,6478.59,50,0
A	goto	1452/1,-4100.26,6459.19,50,0
A	goto	1452/1,-4051.27,6612.07,50,0
A	complete	8924,2
A	mob	Suffering Highborne
A	mob	Anguished Highborne
S	
T	completewith	FelElemRod
A	subzone	2256
S	
T	hardcore	
T	completewith	next
S	
T	label	FelElemRod
A	goto	1452/1,-4496.44,4822.400
A	collect	21939,1,8928,1
A	target	Vi'el
S	
T	optional	
A	collect	9061,2,8924,1
S	
T	completewith	next
A	subzone	2264
S	
T	completewith	next
A	cast	27433
A	use	21946
S	
T	loop	
A	goto	1423/0,-4533.85,2061.53,0
A	goto	1423/0,-4533.85,2061.53,50,0
A	goto	1423/0,-4451.79,1980.220,50,0
A	complete	8924,3
A	mob	Unseen Servant
A	mob	Hate Shrieker
S	
T	completewith	next
A	subzone	976
S	
A	goto	1446/1,-3839.18,-7127.58
A	turnin	8924
A	accept	8925
A	target	Mux Manascrambler
S	
T	completewith	next
A	zone	Burning Steppes
S	
A	goto	1428/0,-1303.01,-8158.19
A	complete	8925,1
A	mob	Magma Lord Bokk
S	
T	completewith	next
A	subzone	976
S	
A	goto	1446/1,-3839.18,-7127.58
A	turnin	8925
A	accept	8928
A	target	Mux Manascrambler
S	
T	optional	
T	completewith	FelElemRod2
A	subzone	2256
S	
T	optional	
T	hardcore	
T	completewith	next
S	
T	label	FelElemRod2
T	optional	--user should already have bought this during .complete 8924,2 earlier in Winterspring
A	goto	1452/1,-4496.44,4822.400
A	collect	21939,1,8928,1
A	target	Vi'el
S	
T	optional	
T	completewith	next
A	subzone	976
A	zoneskip	Winterspring,1
S	
A	goto	1446/1,-3839.18,-7127.58
A	turnin	8928
A	accept	8977
A	accept	8978
A	target	Mux Manascrambler
S	Alliance
T	completewith	next
A	zone	Ironforge
S	Alliance
A	goto	1455/0,-1057.83,-4847.18
A	turnin	8977
A	accept	8926
A	accept	8931
A	accept	8932
A	accept	8933
A	accept	8934
A	accept	8935
A	accept	8936
A	accept	8937
A	target	Deliana
S	Alliance
A	goto	1455/0,-1057.83,-4847.18
A	collect	16716,1,8926,1 << Alliance Druid
A	collect	16717,1,8926,1 << Alliance Druid
A	collect	16680,1,8931,1 << Alliance Hunter
A	collect	16676,1,8931,1 << Alliance Hunter
A	collect	16685,1,8932,1 << Alliance Mage
A	collect	16684,1,8932,1 << Alliance Mage
A	collect	16723,1,8933,1 << Alliance Paladin
A	collect	16724,1,8933,1 << Alliance Paladin
A	collect	16696,1,8934,1 << Alliance Priest
A	collect	16692,1,8934,1 << Alliance Priest
A	collect	16713,1,8935,1 << Alliance Rogue
A	collect	16712,1,8935,1 << Alliance Rogue
A	collect	16702,1,8936,1 << Alliance Warlock
A	collect	16705,1,8936,1 << Alliance Warlock
A	collect	16736,1,8937,1 << Alliance Warrior
A	collect	16737,1,8937,1 << Alliance Warrior
A	turnin	8926
A	turnin	8931
A	turnin	8932
A	turnin	8933
A	turnin	8934
A	turnin	8935
A	turnin	8936
A	turnin	8937
A	accept	8929
A	target	Deliana
S	Horde
T	completewith	next
A	zone	Orgrimmar
S	Horde
A	goto	1454/1,-4170.95,1915.80
A	turnin	8978
A	accept	8927
A	accept	8938
A	accept	8939
A	accept	8940
A	accept	8941
A	accept	8942
A	accept	8943
A	accept	8944
A	target	Mokvar
S	Horde
A	goto	1454/1,-4170.95,1915.80
A	collect	16716,1,8927,1 << Horde Druid
A	collect	16717,1,8927,1 << Horde Druid
A	collect	16680,1,8938,1 << Horde Hunter
A	collect	16676,1,8938,1 << Horde Hunter
A	collect	16685,1,8939,1 << Horde Mage
A	collect	16684,1,8939,1 << Horde Mage
A	collect	16696,1,8940,1 << Horde Priest
A	collect	16692,1,8940,1 << Horde Priest
A	collect	16713,1,8941,1 << Horde Rogue
A	collect	16712,1,8941,1 << Horde Rogue
A	collect	16673,1,8942,1 << Horde Shaman
A	collect	16672,1,8942,1 << Horde Shaman
A	collect	16702,1,8943,1 << Horde Warlock
A	collect	16705,1,8943,1 << Horde Warlock
A	collect	16736,1,8944,1 << Horde Warrior
A	collect	16737,1,8944,1 << Horde Warrior
A	turnin	8927
A	turnin	8938
A	turnin	8939
A	turnin	8940
A	turnin	8941
A	turnin	8942
A	turnin	8943
A	turnin	8944
A	accept	8930
A	target	Mokvar
E
G	Guides/forever/0.5.lua
M	classic	
M	tbc	
M	group	RestedXP Endgame Guides
M	subgroup	Feralheart Set Guide << Druid
M	subgroup	Beastmaster Set Guide << Hunter
M	subgroup	Sorcerer's Set Guide << Mage
M	subgroup	Soulforge Set Guide << Paladin
M	subgroup	Darkmantle Set Guide << Rogue
M	subgroup	The Five Thunders Set Guide << Shaman
M	subgroup	Deathmist Set Guide << Warlock
M	subgroup	Heroism Set Guide << Warrior
M	subgroup	Virtuous Set Guide << Priest
M	name	Part 3: Pants, Shoulders & Boots
M	next	Part 4: Helm & Chest
S	
T	optional	
A	isQuestAvailable	8926 << Alliance Druid
A	isQuestAvailable	8931 << Alliance Hunter
A	isQuestAvailable	8932 << Alliance Mage
A	isQuestAvailable	8933 << Alliance Paladin
A	isQuestAvailable	8934 << Alliance Priest
A	isQuestAvailable	8935 << Alliance Rogue
A	isQuestAvailable	8936 << Alliance Warlock
A	isQuestAvailable	8937 << Alliance Warrior
A	isQuestAvailable	8927 << Horde Druid
A	isQuestAvailable	8938 << Horde Hunter
A	isQuestAvailable	8939 << Horde Mage
A	isQuestAvailable	8940 << Horde Priest
A	isQuestAvailable	8941 << Horde Rogue
A	isQuestAvailable	8942 << Horde Shaman
A	isQuestAvailable	8943 << Horde Warlock
A	isQuestAvailable	8944 << Horde Warrior
S	
A	collect	16715,1,8951,1 << Alliance Druid
A	collect	16675,1,8952,1 << Alliance Hunter
A	collect	16682,1,8953,1 << Alliance Mage
A	collect	16725,1,8954,1 << Alliance Paladin
A	collect	16691,1,8955,1 << Alliance Priest
A	collect	16711,1,8956,1 << Alliance Rogue
A	collect	16704,1,8958,1 << Alliance Warlock
A	collect	16734,1,8959,1 << Alliance Warrior
A	collect	16670,1,8957,1 << Horde Shaman
A	collect	16715,1,9016,1 << Horde Druid
A	collect	16675,1,9017,1 << Horde Hunter
A	collect	16682,1,9018,1 << Horde Mage
A	collect	16691,1,9019,1 << Horde Priest
A	collect	16711,1,9020,1 << Horde Rogue
A	collect	16704,1,9021,1 << Horde Warlock
A	collect	16734,1,9022,1 << Horde Warrior
A	equip	8,16715 << Druid
A	equip	8,16675 << Hunter
A	equip	8,16682 << Mage
A	equip	8,16725 << Paladin
A	equip	8,16691 << Priest
A	equip	8,16711 << Rogue
A	equip	8,16704 << Warlock
A	equip	8,16734 << Warrior
A	equip	8,16670 << Shaman
S	
A	collect	16719,1,8951,1 << Alliance Druid
A	collect	16678,1,8952,1 << Alliance Hunter
A	collect	16687,1,8953,1 << Alliance Mage
A	collect	16728,1,8954,1 << Alliance Paladin
A	collect	16694,1,8955,1 << Alliance Priest
A	collect	16709,1,8956,1 << Alliance Rogue
A	collect	16699,1,8958,1 << Alliance Warlock
A	collect	16732,1,8959,1 << Alliance Warrior
A	collect	16668,1,8957,1 << Horde Shaman
A	collect	16719,1,9016,1 << Horde Druid
A	collect	16678,1,9017,1 << Horde Hunter
A	collect	16687,1,9018,1 << Horde Mage
A	collect	16694,1,9019,1 << Horde Priest
A	collect	16709,1,9020,1 << Horde Rogue
A	collect	16699,1,9021,1 << Horde Warlock
A	collect	16732,1,9022,1 << Horde Warrior
A	equip	7,16719 << Druid
A	equip	7,16678 << Hunter
A	equip	7,16687 << Mage
A	equip	7,16728 << Paladin
A	equip	7,16694 << Priest
A	equip	7,16709 << Rogue
A	equip	7,16699 << Warlock
A	equip	7,16732 << Warrior
A	equip	7,16668 << Shaman
S	
A	collect	16718,1,8951,1 << Alliance Druid
A	collect	16679,1,8952,1 << Alliance Hunter
A	collect	16689,1,8953,1 << Alliance Mage
A	collect	16729,1,8954,1 << Alliance Paladin
A	collect	16695,1,8955,1 << Alliance Priest
A	collect	16708,1,8956,1 << Alliance Rogue
A	collect	16701,1,8958,1 << Alliance Warlock
A	collect	16733,1,8959,1 << Alliance Warrior
A	collect	16669,1,8957,1 << Horde Shaman
A	collect	16718,1,9016,1 << Horde Druid
A	collect	16679,1,9017,1 << Horde Hunter
A	collect	16689,1,9018,1 << Horde Mage
A	collect	16695,1,9019,1 << Horde Priest
A	collect	16708,1,9020,1 << Horde Rogue
A	collect	16701,1,9021,1 << Horde Warlock
A	collect	16733,1,9022,1 << Horde Warrior
A	equip	3,16718 << Druid
A	equip	3,16679 << Hunter
A	equip	3,16689 << Mage
A	equip	3,16729 << Paladin
A	equip	3,16695 << Priest
A	equip	3,16708 << Rogue
A	equip	3,16701 << Warlock
A	equip	3,16733 << Warrior
A	equip	3,16669 << Shaman
S	
A	collect	11371,3,8947,1
A	collect	12810,20,8947,1
A	collect	14344,8,8950,1
A	collect	14342,3,8947,1
A	collect	15407,4,8947,1
A	collect	20520,4,8950,1
S	Alliance
T	completewith	next
A	zone	Ironforge
S	Alliance
A	goto	1455/0,-1057.83,-4847.18
A	accept	8929
A	target	Deliana
S	Horde
T	completewith	next
A	zone	Orgrimmar
S	Horde
A	goto	1454/1,-4170.95,1915.80
A	accept	8930
A	target	Mokvar
S	
T	completewith	FindingAnthion
S	
T	completewith	next
A	zone	Eastern Plaguelands
S	
T	label	FindingAnthion
A	goto	1415/0,-3381.07,3357.60
A	use	22115
A	turnin	8929
A	turnin	8930
A	accept	8945
A	target	Anthion Harmon
S	
T	completewith	next
A	subzone	2017
S	
A	complete	8945,1
A	mob	Baron Rivendare
A	target	Ysida Harmon
S	
A	turnin	8945
A	accept	8946
A	target	Ysida Harmon
S	
A	goto	1415/0,-3381.07,3357.60
A	use	22115
A	turnin	8946
A	accept	8947
A	target	Anthion Harmon
S	
A	collect	11371,3,8947,1
A	collect	12810,20,8947,1
A	collect	14344,8,8950,1
A	collect	14342,3,8947,1
A	collect	15407,4,8947,1
A	collect	20520,4,8950,1
S	
A	goto	1415/0,-3381.07,3357.60
A	use	22115
A	turnin	8947
A	accept	8948
A	target	Anthion Harmon
S	
T	softcore	
T	completewith	AnthionsFriend
A	zone	Feralas
A	subzoneskip	2557
S	
T	hardcore	
T	completewith	AnthionsFriend
A	zone	Feralas
A	subzoneskip	2557
S	
T	completewith	AnthionsFriend
A	goto	1414/1,1099.16,-3519.58,20
A	itemcount	18249,<1 << !Rogue
A	skill	lockpicking,300,1 << Rogue
S	
T	optional	
T	completewith	AnthionsFriend
A	goto	1414/1,1099.16,-3519.58,20
A	itemcount	18249,1 << !Rogue
A	skill	lockpicking,<300,1 << Rogue
S	
T	label	AnthionsFriend
A	turnin	8948
A	accept	8949
A	target	Falrin Treeshaper
S	
A	complete	8949,1
A	mob	Gordok Mage-Lord
A	mob	Gordok Brute
A	mob	Gordok Ogre-Mage
A	mob	Gordok Enforcer
A	mob	Gordok Mauler
A	mob	Gordok Warlock
A	mob	Gordok Captain
A	mob	Gordok Reaver
A	mob	Spirestone Battle Mage
A	mob	Spirestone Reaver
A	mob	Spirestone Enforcer
A	mob	Spirestone Ogre Magus
A	mob	Spirestone Mystic
A	mob	Spirestone Warlord
S	
A	turnin	8949
A	accept	8950
A	target	Falrin Treeshaper
S	
T	completewith	SpectreEssence
A	goto	1414/1,1250.04,-3816.44,20
A	itemcount	18249,<1 << !Rogue
A	skill	lockpicking,300,1 << Rogue
S	
T	completewith	SpectreEssence
A	goto	1414/1,1250.04,-3816.44,20
A	itemcount	18249,1 << !Rogue
A	skill	lockpicking,<300,1 << Rogue
S	
T	label	SpectreEssence
A	complete	8950,1
A	mob	Eldreth Wraith
A	mob	Eldreth Seether
A	mob	Eldreth Spectre
A	mob	Eldreth Spirit
A	mob	Eldreth Phantasm
A	mob	Eldreth Apparition
A	mob	Eldreth Sorcerer
S	
A	collect	14344,8,8950,1
A	collect	20520,4,8950,1
S	
T	completewith	AnthionsFriend2
A	goto	1414/1,1099.16,-3519.58,20
A	itemcount	18249,<1 << !Rogue
A	skill	lockpicking,300,1 << Rogue
S	
T	optional	
T	completewith	AnthionsFriend2
A	goto	1414/1,1099.16,-3519.58,20
A	itemcount	18249,1 << !Rogue
A	skill	lockpicking,<300,1 << Rogue
S	
T	label	AnthionsFriend2
A	turnin	8950
A	accept	9015
A	target	Falrin Treeshaper
S	
T	completewith	next
A	subzone	254
S	
T	completewith	next
A	goto	1415/0,-920.59,-7181.25
A	subzone	1584,2
S	
A	use	21986
A	complete	9015,1
A	complete	9015,2
A	mob	Theldren
S	
T	completewith	next
A	zone	Eastern Plaguelands
S	
A	goto	1415/0,-3381.07,3357.60
A	use	22115
A	turnin	9015
A	accept	8951
A	accept	8952
A	accept	8953
A	accept	8954
A	accept	8955
A	accept	8956
A	accept	8958
A	accept	8959
A	accept	8957
A	accept	9016
A	accept	9017
A	accept	9018
A	accept	9019
A	accept	9020
A	accept	9021
A	accept	9022
A	target	Anthion Harmon
S	Alliance
T	completewith	next
A	zone	Ironforge
S	Alliance
A	goto	1455/0,-1057.83,-4847.18
A	collect	16715,1,8951,1 << Alliance Druid
A	collect	16719,1,8951,1 << Alliance Druid
A	collect	16718,1,8951,1 << Alliance Druid
A	collect	16675,1,8952,1 << Alliance Hunter
A	collect	16678,1,8952,1 << Alliance Hunter
A	collect	16679,1,8952,1 << Alliance Hunter
A	collect	16682,1,8953,1 << Alliance Mage
A	collect	16687,1,8953,1 << Alliance Mage
A	collect	16689,1,8953,1 << Alliance Mage
A	collect	16725,1,8954,1 << Alliance Paladin
A	collect	16728,1,8954,1 << Alliance Paladin
A	collect	16729,1,8954,1 << Alliance Paladin
A	collect	16691,1,8955,1 << Alliance Priest
A	collect	16694,1,8955,1 << Alliance Priest
A	collect	16695,1,8955,1 << Alliance Priest
A	collect	16711,1,8956,1 << Alliance Rogue
A	collect	16709,1,8956,1 << Alliance Rogue
A	collect	16708,1,8956,1 << Alliance Rogue
A	collect	16704,1,8958,1 << Alliance Warlock
A	collect	16699,1,8958,1 << Alliance Warlock
A	collect	16701,1,8958,1 << Alliance Warlock
A	collect	16734,1,8959,1 << Alliance Warrior
A	collect	16732,1,8959,1 << Alliance Warrior
A	collect	16733,1,8959,1 << Alliance Warrior
A	turnin	8951
A	turnin	8952
A	turnin	8953
A	turnin	8954
A	turnin	8955
A	turnin	8956
A	turnin	8958
A	turnin	8959
A	accept	8960
A	target	Deliana
S	Horde
T	completewith	next
A	zone	Orgrimmar
S	Horde
A	goto	1454/1,-4170.95,1915.80
A	collect	16670,1,8957,1 << Horde Shaman
A	collect	16668,1,8957,1 << Horde Shaman
A	collect	16669,1,8957,1 << Horde Shaman
A	collect	16715,1,9016,1 << Horde Druid
A	collect	16719,1,9016,1 << Horde Druid
A	collect	16718,1,9016,1 << Horde Druid
A	collect	16675,1,9017,1 << Horde Hunter
A	collect	16678,1,9017,1 << Horde Hunter
A	collect	16679,1,9017,1 << Horde Hunter
A	collect	16682,1,9018,1 << Horde Mage
A	collect	16687,1,9018,1 << Horde Mage
A	collect	16689,1,9018,1 << Horde Mage
A	collect	16691,1,9019,1 << Horde Priest
A	collect	16694,1,9019,1 << Horde Priest
A	collect	16695,1,9019,1 << Horde Priest
A	collect	16711,1,9020,1 << Horde Rogue
A	collect	16709,1,9020,1 << Horde Rogue
A	collect	16708,1,9020,1 << Horde Rogue
A	collect	16704,1,9021,1 << Horde Warlock
A	collect	16699,1,9021,1 << Horde Warlock
A	collect	16701,1,9021,1 << Horde Warlock
A	collect	16734,1,9022,1 << Horde Warrior
A	collect	16732,1,9022,1 << Horde Warrior
A	collect	16733,1,9022,1 << Horde Warrior
A	turnin	8957
A	turnin	9016
A	turnin	9017
A	turnin	9018
A	turnin	9019
A	turnin	9020
A	turnin	9021
A	turnin	9022
A	accept	8960
A	target	Mokvar
E
G	Guides/forever/0.5.lua
M	classic	
M	tbc	
M	group	RestedXP Endgame Guides
M	subgroup	Feralheart Set Guide << Druid
M	subgroup	Beastmaster Set Guide << Hunter
M	subgroup	Sorcerer's Set Guide << Mage
M	subgroup	Soulforge Set Guide << Paladin
M	subgroup	Darkmantle Set Guide << Rogue
M	subgroup	The Five Thunders Set Guide << Shaman
M	subgroup	Deathmist Set Guide << Warlock
M	subgroup	Heroism Set Guide << Warrior
M	subgroup	Virtuous Set Guide << Priest
M	name	Part 4: Helm & Chest
S	
T	optional	
A	isQuestAvailable	8951 << Alliance Druid
A	isQuestAvailable	8952 << Alliance Hunter
A	isQuestAvailable	8953 << Alliance Mage
A	isQuestAvailable	8954 << Alliance Paladin
A	isQuestAvailable	8955 << Alliance Priest
A	isQuestAvailable	8956 << Alliance Rogue
A	isQuestAvailable	8958 << Alliance Warlock
A	isQuestAvailable	8959 << Alliance Warrior
A	isQuestAvailable	8957 << Horde Shaman
A	isQuestAvailable	9016 << Horde Druid
A	isQuestAvailable	9017 << Horde Hunter
A	isQuestAvailable	9018 << Horde Mage
A	isQuestAvailable	9019 << Horde Priest
A	isQuestAvailable	9020 << Horde Rogue
A	isQuestAvailable	9021 << Horde Warlock
A	isQuestAvailable	9022 << Horde Warrior
S	
A	collect	16727,1,9002,1 << Alliance Paladin
A	collect	16720,1,8999,1 << Alliance Druid
A	collect	16677,1,9000,1 << Alliance Hunter
A	collect	16693,1,9003,1 << Alliance Priest
A	collect	16707,1,9004,1 << Alliance Rogue
A	collect	16698,1,9005,1 << Alliance Warlock
A	collect	16731,1,9006,1 << Alliance Warrior
A	collect	16686,1,9001,1 << Alliance Mage
A	collect	16720,1,9007,1 << Horde Druid
A	collect	16677,1,9008,1 << Horde Hunter
A	collect	16693,1,9009,1 << Horde Priest
A	collect	16707,1,9010,1 << Horde Rogue
A	collect	16667,1,9011,1 << Horde Shaman
A	collect	16698,1,9012,1 << Horde Warlock
A	collect	16731,1,9013,1 << Horde Warrior
A	collect	16686,1,9014,1 << Horde Mage
A	equip	1,16727 << Paladin
A	equip	1,16720 << Druid
A	equip	1,16677 << Hunter
A	equip	1,16693 << Priest
A	equip	1,16707 << Rogue
A	equip	1,16698 << Warlock
A	equip	1,16731 << Warrior
A	equip	1,16686 << Mage
A	equip	1,16667 << Shaman
S	
A	collect	16726,1,9002,1 << Alliance Paladin
A	collect	16706,1,8999,1 << Alliance Druid
A	collect	16674,1,9000,1 << Alliance Hunter
A	collect	16690,1,9003,1 << Alliance Priest
A	collect	16721,1,9004,1 << Alliance Rogue
A	collect	16700,1,9005,1 << Alliance Warlock
A	collect	16730,1,9006,1 << Alliance Warrior
A	collect	16688,1,9001,1 << Alliance Mage
A	collect	16706,1,9007,1 << Horde Druid
A	collect	16674,1,9008,1 << Horde Hunter
A	collect	16690,1,9009,1 << Horde Priest
A	collect	16721,1,9010,1 << Horde Rogue
A	collect	16666,1,9011,1 << Horde Shaman
A	collect	16700,1,9012,1 << Horde Warlock
A	collect	16730,1,9013,1 << Horde Warrior
A	collect	16688,1,9014,1 << Horde Mage
A	equip	5,16726 << Paladin
A	equip	5,16706 << Druid
A	equip	5,16674 << Hunter
A	equip	5,16690 << Priest
A	equip	5,16721 << Rogue
A	equip	5,16700 << Warlock
A	equip	5,16730 << Warrior
A	equip	5,16688 << Mage
A	equip	5,16666 << Shaman
S	Alliance
T	completewith	next
A	zone	Ironforge
S	Alliance
A	goto	1455/0,-1057.83,-4847.18
A	accept	8960
A	target	Deliana
S	Horde
T	completewith	next
A	zone	Orgrimmar
S	Horde
A	goto	1454/1,-4170.95,1915.80
A	accept	8960
A	target	Mokvar
S	
A	collect	14344,1,8961,1
A	collect	13512,1,8994,1
S	
A	reputation	529,honored
S	Alliance
T	completewith	next
A	subzone	3197
S	Alliance
A	goto	1422/0,-1425.45,966.98
A	collect	22014,1,8961,1
A	target	Argent Quartermaster Lightspark
S	Horde
T	completewith	next
A	subzone	2268
S	Horde
A	goto	1423/0,-5345.18,2251.25
A	collect	22014,1,8961,1
A	target	Quartermaster Miranda Breechlock
S	
T	completewith	next
A	subzone	254
S	
A	goto	1415/0,-1212.75,-7535.60
A	use	22115
A	turnin	8960
A	accept	8961
A	target	Bodley
S	
T	completewith	next
A	goto	1415/0,-1230.35,-7526.21
A	subzone	1583
S	
A	complete	8961,2
A	mob	Pyroguard Emberseer
S	
T	completewith	next
A	goto	1415/0,-920.59,-7181.25
A	subzone	1584,2
S	
A	complete	8961,1
A	mob	Lord Incendius
S	
T	completewith	DukeofCynders
A	zone	Silithus
S	
T	loop	
A	goto	1451/1,1203.03,-7036.63,0
A	goto	1451/1,1564.60,-6670.54,0
A	goto	1451/1,1824.46,-7958.60,0
A	goto	1451/1,1203.03,-7036.63,80,0
A	goto	1451/1,1564.60,-6670.54,80,0
A	goto	1451/1,1824.46,-7958.60,80,0
A	collect	20407,1,8961,1
A	collect	20406,1,8961,1
A	collect	20408,1,8961,1
A	mob	Twilight Marauder
A	mob	Twilight Marauder Morna
A	mob	Twilight Avenger
A	mob	Twilight Geolord
A	mob	Twilight Stonecaller
A	mob	Twilight Overlord
A	mob	Twilight Flamereaver
A	mob	Twilight Master
S	
A	reputation	609,friendly
S	
A	goto	1451/1,843.90,-6838.02
A	accept	8331
A	target	Huum Wildmane
A	itemcount	20422,<1
S	
A	goto	1451/1,727.56,-6843.36
A	turnin	8331
A	accept	8332
A	target	Aurel Goldleaf
A	itemcount	20422,<1
S	
A	goto	1451/1,1203.03,-7036.63
A	goto	1451/1,1203.03,-7036.63,0
A	goto	1451/1,1564.60,-6670.54,0
A	goto	1451/1,1824.46,-7958.60,0
A	collect	20513,3
A	itemcount	20422,<1
A	mob	Earthen Templar
A	mob	Crimson Templar
A	mob	Hoary Templar
A	mob	Azure Templar
S	
A	goto	1451/1,727.56,-6843.36
A	turnin	8332
A	target	Aurel Goldleaf
A	itemcount	20513,3
S	
A	goto	1451/1,727.56,-6843.36
A	turnin	8333
A	target	Aurel Goldleaf
A	itemcount	20513,3
S	
T	label	DukeofCynders
A	goto	1451/1,1225.33,-6999.23
A	goto	1451/1,1225.33,-6999.23,0
A	goto	1451/1,1675.72,-6717.46,0
A	goto	1451/1,1936.97,-7927.01,0
A	complete	8961,3
A	mob	The Duke of Cynders
S	
T	completewith	next
A	subzone	254
S	
A	goto	1415/0,-1212.75,-7535.60
A	use	22115
A	turnin	8961
A	acceptmultiple	8962,8963,8964,8965
A	target	Bodley
S	
T	completewith	next
A	subzone	2744
A	isOnQuest	8962
S	
T	loop	
A	goto	1451/1,594.84,-7624.10,0
A	goto	1451/1,415.45,-7864.05,0
A	goto	1451/1,432.52,-8044.310,0
A	goto	1451/1,566.98,-7973.23,0
A	goto	1451/1,637.34,-7882.64,0
A	goto	1451/1,594.84,-7624.10,70,0
A	goto	1451/1,415.45,-7864.05,70,0
A	goto	1451/1,432.52,-8044.310,70,0
A	goto	1451/1,566.98,-7973.23,70,0
A	goto	1451/1,637.34,-7882.64,70,0
A	complete	8962,1
A	mob	Hive'Regal Spitfire
A	mob	Hive'Regal Hive Lord
A	mob	Hive'Regal Slavemaker
A	mob	Hive'Regal Ambusher
A	mob	Hive'Regal Burrower
A	isOnQuest	8962
S	
T	completewith	next
A	subzone	2249
A	isOnQuest	8963
S	
T	loop	
A	goto	1452/1,-4678.91,5302.36,0
A	goto	1452/1,-4551.11,5346.85,60,0
A	goto	1452/1,-4678.91,5302.36,60,0
A	goto	1452/1,-4833.69,5253.130,60,0
A	goto	1452/1,-4678.91,5302.36,60,0
A	goto	1452/1,-4551.11,5346.85,60,0
A	goto	1452/1,-4590.16,5458.56,60,0
A	goto	1452/1,-4864.93,5371.470,60,0
A	goto	1452/1,-4989.18,5260.23,60,0
A	goto	1452/1,-4938.77,5122.02,60,0
A	goto	1452/1,-4683.17,5095.04,60,0
A	goto	1452/1,-4548.27,5232.31,60,0
A	goto	1452/1,-4448.87,5334.07,60,0
A	complete	8963,1
A	mob	Frostmaul Giant
A	mob	Frostmaul Preserver
A	isOnQuest	8963
S	
T	completewith	next
A	subzone	2266
A	isOnQuest	8964
S	
T	loop	
A	goto	1423/0,-5443.50,1647.75,0
A	goto	1423/0,-5443.50,1647.75,60,0
A	goto	1423/0,-5529.43,1609.55,20,0
A	goto	1423/0,-5566.98,1591.22,15,0
A	goto	1423/0,-5484.53,1559.480,30,0
A	goto	1423/0,-5559.23,1544.25,30,0
A	goto	1423/0,-5528.27,1662.730,30,0
A	goto	1423/0,-5579.75,1703.25,40,0
A	complete	8964,1
A	mob	Scarlet Praetorian
A	isOnQuest	8964
S	
T	completewith	next
A	goto	1424/0,437.23,-1240.96
A	subzone	896
A	isOnQuest	8965
S	
T	loop	
A	goto	1424/0,563.63,-1336.75,0
A	goto	1424/0,437.23,-1240.96,30,0
A	goto	1424/0,570.67,-1256.32,30,0
A	goto	1424/0,645.55,-1339.31,30,0
A	goto	1424/0,601.71,-1399.04,30,0
A	goto	1424/0,550.19,-1394.77,30,0
A	goto	1424/0,527.79,-1338.24,30,0
A	goto	1424/0,563.63,-1336.75,40,0
A	complete	8965,1
A	mob	Cursed Paladin
A	mob	Writhing Mage
A	mob	Condemned Acolyte
A	mob	Condemned Monk
A	mob	Cursed Justicar
A	isOnQuest	8965
S	
T	completewith	LeftPiecePU
A	subzone	254
S	
T	optional	
A	goto	1415/0,-1212.75,-7535.60
A	use	22115
A	turnin	8962
A	target	Bodley
A	isQuestComplete	8962
S	
T	optional	
A	goto	1415/0,-1212.75,-7535.60
A	use	22115
A	turnin	8963
A	target	Bodley
A	isQuestComplete	8963
S	
T	optional	
A	goto	1415/0,-1212.75,-7535.60
A	use	22115
A	turnin	8964
A	target	Bodley
A	isQuestComplete	8964
S	
A	goto	1415/0,-1212.75,-7535.60
A	use	22115
A	turnin	8965
A	target	Bodley
A	isQuestComplete	8965
S	
T	optional	
A	goto	1415/0,-1212.75,-7535.60
A	use	22115
A	acceptmultiple	8966,8967,8968,8969
A	target	Bodley
A	isQuestTurnedIn	8962
S	
T	optional	
A	goto	1415/0,-1212.75,-7535.60
A	use	22115
A	acceptmultiple	8966,8967,8968,8969
A	target	Bodley
A	isQuestTurnedIn	8963
S	
T	optional	
A	goto	1415/0,-1212.75,-7535.60
A	use	22115
A	acceptmultiple	8966,8967,8968,8969
A	target	Bodley
A	isQuestTurnedIn	8964
S	
T	label	LeftPiecePU
A	goto	1415/0,-1212.75,-7535.60
A	use	22115
A	acceptmultiple	8966,8967,8968,8969
A	target	Bodley
A	isQuestTurnedIn	8965
S	
T	completewith	next
A	goto	1415/0,-1230.35,-7526.21
A	subzone	1583
A	isOnQuest	8966
S	
A	use	22049
A	complete	8966,1
A	complete	8966,2
A	mob	War Master Voone
A	mob	Mor Grayhoof
A	isOnQuest	8966
S	
T	completewith	next
A	zone	Feralas
A	subzoneskip	2557
A	isOnQuest	8967
S	
T	completewith	next
A	goto	1414/1,933.56,-3737.93,20
A	isOnQuest	8967
S	
A	use	22050
A	complete	8967,1
A	complete	8967,2
A	mob	Alzzin the Wildshaper
A	mob	Isalien
A	isOnQuest	8967
S	
T	completewith	next
A	zone	Eastern Plaguelands
A	subzoneskip	2017
A	isOnQuest	8968
S	
T	completewith	next
A	goto	1415/0,-3381.07,3357.60
A	subzone	2017
A	isOnQuest	8968
S	
A	use	22051
A	complete	8968,1
A	complete	8968,2
A	complete	8968,3
A	mob	Balnazzara
A	mob	Jarien
A	mob	Sothos
A	isOnQuest	8968
S	
T	completewith	next
A	zone	Western Plaguelands
A	subzoneskip	2057
A	isOnQuest	8969
S	
T	completewith	next
A	goto	1415/0,-2567.95,1269.07
A	subzone	2057
A	isOnQuest	8969
S	
A	use	22052
A	complete	8969,1
A	complete	8969,2
A	mob	Ras Frostwhisper
A	mob	Kormok
A	isOnQuest	8969
S	
T	completewith	AlcazIslandPU
A	subzone	254
S	
T	optional	
A	goto	1415/0,-1212.75,-7535.60
A	use	22115
A	turnin	8966
A	accept	8970
A	target	Bodley
A	isQuestComplete	8966
S	
T	optional	
A	goto	1415/0,-1212.75,-7535.60
A	use	22115
A	turnin	8967
A	accept	8970
A	target	Bodley
A	isQuestComplete	8967
S	
T	optional	
A	goto	1415/0,-1212.75,-7535.60
A	use	22115
A	turnin	8968
A	accept	8970
A	target	Bodley
A	isQuestComplete	8968
S	
A	goto	1415/0,-1212.75,-7535.60
A	use	22115
A	turnin	8969
A	accept	8970
A	target	Bodley
A	isQuestComplete	8969
S	
T	optional	
A	goto	1415/0,-1212.75,-7535.60
A	use	22115
A	accept	8970
A	target	Bodley
A	isQuestTurnedIn	8966
S	
T	optional	
A	goto	1415/0,-1212.75,-7535.60
A	use	22115
A	accept	8970
A	target	Bodley
A	isQuestTurnedIn	8967
S	
T	optional	
A	goto	1415/0,-1212.75,-7535.60
A	use	22115
A	accept	8970
A	target	Bodley
A	isQuestTurnedIn	8968
S	
T	label	AlcazIslandPU
A	goto	1415/0,-1212.75,-7535.60
A	use	22115
A	accept	8970
A	target	Bodley
A	isQuestTurnedIn	8969
S	
T	completewith	next
A	goto	1445/1,-4768.65,-2673.13
A	subzone	2079
S	
T	loop	
A	goto	1445/1,-5012.78,-2671.73,0
A	goto	1445/1,-4879.95,-2662.98,50,0
A	goto	1445/1,-4906.73,-2547.13,50,0
A	goto	1445/1,-4879.95,-2662.98,50,0
A	goto	1445/1,-5012.78,-2671.73,50,0
A	goto	1445/1,-4994.40,-2808.58,50,0
A	goto	1445/1,-4938.23,-2794.58,50,0
A	complete	8970,1
A	mob	Strashaz Warrior
A	mob	Strashaz Myrmidon
A	mob	Strashaz Siren
A	mob	Strashaz Sorceress
A	mob	Strashaz Serpent Guard
S	
T	completewith	next
A	subzone	254
S	
A	goto	1415/0,-1212.75,-7535.60
A	use	22115
A	turnin	8970
A	target	Bodley
S	
A	goto	1415/0,-1212.75,-7535.60
A	use	22115
A	acceptmultiple	8985,8986,8987,8988
A	target	Bodley
A	isQuestTurnedIn	8970
S	
T	completewith	next
A	subzone	2744
A	isOnQuest	8986
S	
T	loop	
A	goto	1451/1,594.84,-7624.10,0
A	goto	1451/1,415.45,-7864.05,0
A	goto	1451/1,432.52,-8044.310,0
A	goto	1451/1,566.98,-7973.23,0
A	goto	1451/1,637.34,-7882.64,0
A	goto	1451/1,594.84,-7624.10,70,0
A	goto	1451/1,415.45,-7864.05,70,0
A	goto	1451/1,432.52,-8044.310,70,0
A	goto	1451/1,566.98,-7973.23,70,0
A	goto	1451/1,637.34,-7882.64,70,0
A	complete	8986,1
A	mob	Hive'Regal Spitfire
A	mob	Hive'Regal Hive Lord
A	mob	Hive'Regal Slavemaker
A	mob	Hive'Regal Ambusher
A	mob	Hive'Regal Burrower
A	isOnQuest	8986
S	
T	completewith	next
A	subzone	2249
A	isOnQuest	8985
S	
T	loop	
A	goto	1452/1,-4678.91,5302.36,0
A	goto	1452/1,-4551.11,5346.85,60,0
A	goto	1452/1,-4678.91,5302.36,60,0
A	goto	1452/1,-4833.69,5253.130,60,0
A	goto	1452/1,-4678.91,5302.36,60,0
A	goto	1452/1,-4551.11,5346.85,60,0
A	goto	1452/1,-4590.16,5458.56,60,0
A	goto	1452/1,-4864.93,5371.470,60,0
A	goto	1452/1,-4989.18,5260.23,60,0
A	goto	1452/1,-4938.77,5122.02,60,0
A	goto	1452/1,-4683.17,5095.04,60,0
A	goto	1452/1,-4548.27,5232.31,60,0
A	goto	1452/1,-4448.87,5334.07,60,0
A	complete	8985,1
A	mob	Frostmaul Giant
A	mob	Frostmaul Preserver
A	isOnQuest	8985
S	
T	completewith	next
A	subzone	2266
A	isOnQuest	8987
S	
T	loop	
A	goto	1423/0,-5443.50,1647.75,0
A	goto	1423/0,-5443.50,1647.75,60,0
A	goto	1423/0,-5529.43,1609.55,20,0
A	goto	1423/0,-5566.98,1591.22,15,0
A	goto	1423/0,-5484.53,1559.480,30,0
A	goto	1423/0,-5559.23,1544.25,30,0
A	goto	1423/0,-5528.27,1662.730,30,0
A	goto	1423/0,-5579.75,1703.25,40,0
A	complete	8987,1
A	mob	Scarlet Praetorian
A	isOnQuest	8987
S	
T	completewith	next
A	goto	1424/0,437.23,-1240.96
A	subzone	896
A	isOnQuest	8988
S	
T	loop	
A	goto	1424/0,563.63,-1336.75,0
A	goto	1424/0,437.23,-1240.96,30,0
A	goto	1424/0,570.67,-1256.32,30,0
A	goto	1424/0,645.55,-1339.31,30,0
A	goto	1424/0,601.71,-1399.04,30,0
A	goto	1424/0,550.19,-1394.77,30,0
A	goto	1424/0,527.79,-1338.24,30,0
A	goto	1424/0,563.63,-1336.75,40,0
A	complete	8988,1
A	mob	Cursed Paladin
A	mob	Writhing Mage
A	mob	Condemned Acolyte
A	mob	Condemned Monk
A	mob	Cursed Justicar
A	isOnQuest	8988
S	
T	completewith	RightPiecePU
A	subzone	254
S	
T	optional	
A	goto	1415/0,-1212.75,-7535.60
A	use	22115
A	turnin	8985
A	target	Bodley
A	isQuestComplete	8985
S	
T	optional	
A	goto	1415/0,-1212.75,-7535.60
A	use	22115
A	turnin	8986
A	target	Bodley
A	isQuestComplete	8986
S	
T	optional	
A	goto	1415/0,-1212.75,-7535.60
A	use	22115
A	turnin	8987
A	target	Bodley
A	isQuestComplete	8987
S	
A	goto	1415/0,-1212.75,-7535.60
A	use	22115
A	turnin	8988
A	target	Bodley
A	isQuestComplete	8988
S	
T	optional	
A	goto	1415/0,-1212.75,-7535.60
A	use	22115
A	acceptmultiple	8989,8990,8991,8992
A	target	Bodley
A	isQuestTurnedIn	8985
S	
T	optional	
A	goto	1415/0,-1212.75,-7535.60
A	use	22115
A	acceptmultiple	8989,8990,8991,8992
A	target	Bodley
A	isQuestTurnedIn	8986
S	
T	optional	
A	goto	1415/0,-1212.75,-7535.60
A	use	22115
A	acceptmultiple	8989,8990,8991,8992
A	target	Bodley
A	isQuestTurnedIn	8987
S	
T	label	RightPiecePU
A	goto	1415/0,-1212.75,-7535.60
A	use	22115
A	acceptmultiple	8989,8990,8991,8992
A	target	Bodley
A	isQuestTurnedIn	8988
S	
T	completewith	next
A	goto	1415/0,-1230.35,-7526.21
A	subzone	1583
A	isOnQuest	8989
S	
A	use	22049
A	complete	8989,1
A	collect	22046,1,8989,1
A	mob	War Master Voone
A	mob	Mor Grayhoof
A	isOnQuest	8989
S	
T	optional	
A	use	22046
A	complete	8989,2
A	use	22047
A	use	21984
A	itemcount	22047,1
A	isOnQuest	8989
S	
A	use	22046
A	complete	8989,2
A	use	22047
A	use	21984
A	itemcount	22047,<1
A	isOnQuest	8989
S	
T	completewith	next
A	zone	Feralas
A	subzoneskip	2557
A	isOnQuest	8990
S	
T	completewith	next
A	goto	1414/1,933.56,-3737.93,20
A	isOnQuest	8990
S	
A	use	22050
A	complete	8990,1
A	collect	22046,1,8990,1
A	mob	Alzzin the Wildshaper
A	mob	Isalien
A	isOnQuest	8990
S	
T	optional	
A	use	22046
A	complete	8990,2
A	use	22047
A	use	21984
A	itemcount	22047,1
A	isOnQuest	8990
S	
A	use	22046
A	complete	8990,2
A	use	22047
A	use	21984
A	itemcount	22047,<1
A	isOnQuest	8990
S	
T	completewith	next
A	zone	Eastern Plaguelands
A	subzoneskip	2017
A	isOnQuest	8991
S	
T	completewith	next
A	goto	1415/0,-3381.07,3357.60
A	subzone	2017
A	isOnQuest	8991
S	
A	use	22051
A	complete	8991,1
A	complete	8991,2
A	collect	22046,1,8991,1
A	mob	Balnazzara
A	mob	Jarien
A	mob	Sothos
A	isOnQuest	8991
S	
T	optional	
A	use	22046
A	complete	8991,3
A	use	22047
A	use	21984
A	itemcount	22047,1
A	isOnQuest	8991
S	
A	use	22046
A	complete	8991,3
A	use	22047
A	use	21984
A	itemcount	22047,<1
A	isOnQuest	8991
S	
T	completewith	next
A	zone	Western Plaguelands
A	subzoneskip	2057
A	isOnQuest	8992
S	
T	completewith	next
A	goto	1415/0,-2567.95,1269.07
A	subzone	2057
A	isOnQuest	8992
S	
A	use	22052
A	complete	8992,1
A	collect	22046,1,8992,1
A	mob	Ras Frostwhisper
A	mob	Kormok
A	isOnQuest	8992
S	
T	optional	
A	use	22046
A	complete	8992,2
A	use	22047
A	use	21984
A	itemcount	22047,1
A	isOnQuest	8992
S	
A	use	22046
A	complete	8992,2
A	use	22047
A	use	21984
A	itemcount	22047,<1
A	isOnQuest	8992
S	
T	completewith	FinalPrepPU
A	subzone	254
S	
T	optional	
A	goto	1415/0,-1212.75,-7535.60
A	use	22115
A	turnin	8989
A	accept	8994
A	target	Bodley
A	isQuestComplete	8989
S	
T	optional	
A	goto	1415/0,-1212.75,-7535.60
A	use	22115
A	turnin	8990
A	accept	8994
A	target	Bodley
A	isQuestComplete	8990
S	
T	optional	
A	goto	1415/0,-1212.75,-7535.60
A	use	22115
A	turnin	8991
A	accept	8994
A	target	Bodley
A	isQuestComplete	8991
S	
A	goto	1415/0,-1212.75,-7535.60
A	use	22115
A	turnin	8992
A	accept	8994
A	target	Bodley
A	isQuestComplete	8992
S	
T	optional	
A	goto	1415/0,-1212.75,-7535.60
A	use	22115
A	accept	8994
A	target	Bodley
A	isQuestTurnedIn	8989
S	
T	optional	
A	goto	1415/0,-1212.75,-7535.60
A	use	22115
A	accept	8994
A	target	Bodley
A	isQuestTurnedIn	8990
S	
T	optional	
A	goto	1415/0,-1212.75,-7535.60
A	use	22115
A	accept	8994
A	target	Bodley
A	isQuestTurnedIn	8991
S	
T	label	FinalPrepPU
A	goto	1415/0,-1212.75,-7535.60
A	use	22115
A	accept	8994
A	target	Bodley
A	isQuestTurnedIn	8992
S	
T	completewith	next
A	goto	1415/0,-1230.35,-7526.21
A	subzone	1583
S	
A	complete	8994,1
S	
A	collect	13512,1,8994,1
S	
T	completewith	next
A	subzone	254
S	
A	goto	1415/0,-1212.75,-7535.60
A	use	22115
A	turnin	8994
A	accept	8995
A	target	Bodley
S	
T	completewith	next
A	goto	1415/0,-1230.35,-7526.21
A	subzone	1583
S	
A	use	22048
A	use	22056
A	complete	8995,1
A	complete	8995,2
A	mob	The Beast
A	mob	Lord Valthalak
S	
A	turnin	8995
A	accept	8996
A	target	Spirit of Lord Valthalak
S	
T	completewith	next
A	subzone	254
S	
A	goto	1415/0,-1212.75,-7535.60
A	use	22115
A	turnin	8996
A	accept	8997
A	accept	8998
A	target	Bodley
S	Alliance
T	completewith	next
A	zone	Ironforge
S	Alliance
A	goto	1455/0,-1057.83,-4847.18
A	turnin	8997
A	accept	8999
A	accept	9000
A	accept	9001
A	accept	9002
A	accept	9003
A	accept	9004
A	accept	9005
A	accept	9006
A	target	Deliana
S	Alliance
A	goto	1455/0,-1057.83,-4847.18
A	collect	16720,1,8999,1 << Alliance Druid
A	collect	16677,1,9000,1 << Alliance Hunter
A	collect	16686,1,9001,1 << Alliance Mage
A	collect	16727,1,9002,1 << Alliance Paladin
A	collect	16693,1,9003,1 << Alliance Priest
A	collect	16707,1,9004,1 << Alliance Rogue
A	collect	16698,1,9005,1 << Alliance Warlock
A	collect	16731,1,9006,1 << Alliance Warrior
A	collect	16726,1,9002,1 << Alliance Paladin
A	collect	16688,1,9001,1 << Alliance Mage
A	collect	16706,1,8999,1 << Alliance Druid
A	collect	16674,1,9000,1 << Alliance Hunter
A	collect	16690,1,9003,1 << Alliance Priest
A	collect	16721,1,9004,1 << Alliance Rogue
A	collect	16700,1,9005,1 << Alliance Warlock
A	collect	16730,1,9006,1 << Alliance Warrior
A	turnin	8999
A	turnin	9000
A	turnin	9001
A	turnin	9002
A	turnin	9003
A	turnin	9004
A	turnin	9005
A	turnin	9006
A	target	Deliana
S	Horde
T	completewith	next
A	zone	Orgrimmar
S	Horde
A	goto	1454/1,-4170.95,1915.80
A	turnin	8998
A	accept	9007
A	accept	9008
A	accept	9009
A	accept	9010
A	accept	9011
A	accept	9012
A	accept	9013
A	accept	9014
A	target	Mokvar
S	Horde
A	goto	1454/1,-4170.95,1915.80
A	collect	16720,1,9007,1 << Horde Druid
A	collect	16677,1,9008,1 << Horde Hunter
A	collect	16693,1,9009,1 << Horde Priest
A	collect	16707,1,9010,1 << Horde Rogue
A	collect	16667,1,9011,1 << Horde Shaman
A	collect	16698,1,9012,1 << Horde Warlock
A	collect	16731,1,9013,1 << Horde Warrior
A	collect	16686,1,9014,1 << Horde Mage
A	collect	16706,1,9007,1 << Horde Druid
A	collect	16674,1,9008,1 << Horde Hunter
A	collect	16690,1,9009,1 << Horde Priest
A	collect	16721,1,9010,1 << Horde Rogue
A	collect	16666,1,9011,1 << Horde Shaman
A	collect	16700,1,9012,1 << Horde Warlock
A	collect	16730,1,9013,1 << Horde Warrior
A	collect	16688,1,9014,1 << Horde Mage
A	turnin	9007
A	turnin	9008
A	turnin	9009
A	turnin	9010
A	turnin	9011
A	turnin	9012
A	turnin	9013
A	turnin	9014
A	target	Mokvar
E
]=]
