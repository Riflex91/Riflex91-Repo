local addonName, MG = ...

MG.Data = {
    schemaVersion = "fgds-1.0",
    generatedUtc = "2026-09-20T10:48:26Z",
    source = "ForeverDataMiner + ForeverGuideRecorder",
    build = {
        version = "1.60.1.69913",
        buildNumber = "69913",
        interfaceVersion = 16001,
        product = "wow_classic_beta",
        buildKey = "6c0df97e8e481a9a41600e373367c200",
        cdnKey = "5525ea1ce6668e895569c89c2d6a154c",
    },
    tableStats = {
        QuestV2 = 6600, QuestInfo = 7, QuestLine = 3, QuestLineXQuest = 22,
        QuestPOIBlob = 54, QuestPOIPoint = 99, QuestXP = 100, QuestMoneyReward = 100,
        Item = 31600, ItemSparse = 23420, ItemEffect = 12571, ChrClasses = 9,
        ChrRaces = 58, Map = 73, AreaTable = 1372, TaxiNodes = 100, Talent = 432,
        SpellName = 31767, SpellEffect = 42449,
    },

    observedQuests = {
        [97279] = { title = "Verlorene Waffen", order = 10, status = "RECORDED" },
        [4402]  = { title = "Galgars Kaktusapfel Surprise", order = 20, status = "RECORDED" },
        [789]   = { title = "Stich des Skorpiden", order = 30, status = "RECORDED" },
        [792]   = { title = "Üble Familiare", order = 40, status = "RECORDED" },
    },

    -- First route seed built only from evidence already captured by the
    -- DataMiner/Recorder test. The StepEngine can consume much larger
    -- generated route files later without changing its state model.
    guide = {
        id = "durotar-recorder-seed-v1",
        title = "Durotar - Recorder Seed",
        verification = "RECORDED",
        steps = {
            {
                id = "durotar-97279",
                order = 10,
                questID = 97279,
                title = "Verlorene Waffen",
                faction = "Horde",
                minLevel = 1,
                mapID = 1411,
                verification = "RECORDED",
            },
            {
                id = "durotar-4402",
                order = 20,
                questID = 4402,
                title = "Galgars Kaktusapfel Surprise",
                faction = "Horde",
                minLevel = 1,
                mapID = 1411,
                verification = "RECORDED",
            },
            {
                id = "durotar-789",
                order = 30,
                questID = 789,
                title = "Stich des Skorpiden",
                faction = "Horde",
                minLevel = 1,
                mapID = 1411,
                verification = "RECORDED",
            },
            {
                id = "durotar-792",
                order = 40,
                questID = 792,
                title = "Üble Familiare",
                faction = "Horde",
                minLevel = 1,
                mapID = 1411,
                verification = "RECORDED",
            },
        },
    },

    -- Empty extension points are intentional. DataMiner/Recorder importers can
    -- populate these without changing the runtime architecture.
    guides = {},
    travelGraph = {
        nodes = {},
        edges = {},
    },
    buildProfiles = {},
    gearProfiles = {},

    firstObservedPlayer = {
        faction = "Horde",
        race = "Troll",
        class = "HUNTER",
        mapID = 1411,
    },

    featureModel = {
        engineStage = "roadmap-complete-pre-runtime-fix",
        guideDataCoverage = "recorder-seed-only",
        externalTelemetry = false,
    },
}
