local addonName, MG = ...

MG.RestEDXPImport = MG.RestEDXPImport or {}
local Import = MG.RestEDXPImport

local RACES = {
    Orc = "Orc",
    Troll = "Troll",
    Tauren = "Tauren",
    Undead = "Scourge",
    Scourge = "Scourge",
    Human = "Human",
    Dwarf = "Dwarf",
    Gnome = "Gnome",
    NightElf = "NightElf",
    ["Night Elf"] = "NightElf",
    Skyborne = "Skyborne",
}

local CLASSES = {
    Warrior = "WARRIOR",
    Paladin = "PALADIN",
    Hunter = "HUNTER",
    Rogue = "ROGUE",
    Priest = "PRIEST",
    Shaman = "SHAMAN",
    Mage = "MAGE",
    Warlock = "WARLOCK",
    Druid = "DRUID",
}

local function splitTabs(line)
    local out = {}
    local start = 1
    while true do
        local pos = string.find(line, "\t", start, true)
        if not pos then
            out[#out + 1] = string.sub(line, start)
            break
        end
        out[#out + 1] = string.sub(line, start, pos - 1)
        start = pos + 1
    end
    return out
end

local function trim(value)
    value = tostring(value or "")
    return value:gsub("^%s+", ""):gsub("%s+$", "")
end

local function shallowCopy(value)
    local out = {}
    for key, child in pairs(value or {}) do out[key] = child end
    return out
end

local function copyCoordinateList(list)
    local out = {}
    for _, value in ipairs(list or {}) do
        out[#out + 1] = shallowCopy(value)
    end
    return out
end

local function append(list, value)
    list[#list + 1] = value
    return value
end

local function slug(value)
    value = string.lower(tostring(value or "guide"))
    value = value:gsub("[^%w]+", "-")
    value = value:gsub("^%-+", ""):gsub("%-+$", "")
    if value == "" then value = "guide" end
    return value
end

local function parseLevelRange(name)
    local first, last = tostring(name or ""):match("(%d+)%s*%-%s*(%d+)")
    return tonumber(first), tonumber(last)
end

local function splitCondition(args)
    args = trim(args)
    local startPos = string.find(args, "<<", 1, true)
    if not startPos then return args, nil end
    return trim(string.sub(args, 1, startPos - 1)),
        trim(string.sub(args, startPos + 2))
end

local function parseTagCondition(value)
    value = trim(value)
    local base, selector = splitCondition(value)
    return base, selector
end

local function selectorAtomMatches(atom, profile)
    atom = trim(atom)
    if atom == "" then return true end

    local negative = string.sub(atom, 1, 1) == "!"
    if negative then atom = string.sub(atom, 2) end

    local settings = MG.db and MG.db.settings or {}
    local lower = string.lower(atom)
    local expected = RACES[atom] or CLASSES[atom]
    local matches = false

    if lower == "skip" then
        matches = false
    elseif lower == "sod" then
        matches = settings.rxpSoDMode and true or false
    elseif RACES[atom] then
        matches = tostring(profile.race or "") == expected
    elseif CLASSES[atom] then
        matches = tostring(profile.class or "") == expected
    elseif atom == "Horde" or atom == "Alliance" then
        matches = tostring(profile.faction or "") == atom
    else
        -- Unknown RXP predicates are preserved in the raw dataset but fail
        -- closed for automatic applicability.
        return false
    end

    if negative then return not matches end
    return matches
end

function Import:SelectorMatches(selector, profile)
    selector = trim(selector)
    selector = selector:gsub("^<<%s*", "")
    selector = selector:gsub("%s+%-%-.*$", "")
    selector = selector:gsub("%s+#.*$", "")
    selector = trim(selector)
    if selector == "" then return true end
    profile = profile or (MG.GetPlayerProfile and MG:GetPlayerProfile()) or {}

    -- RXP selector grammar used by the public Forever guides:
    -- slash separates OR branches; whitespace inside a branch is AND.
    for branch in string.gmatch(selector, "[^/]+") do
        local branchMatches = true
        local sawAtom = false
        for atom in string.gmatch(trim(branch), "%S+") do
            sawAtom = true
            if not selectorAtomMatches(atom, profile) then
                branchMatches = false
                break
            end
        end
        if sawAtom and branchMatches then return true end
    end

    return false
end

local function tagValue(tags, name)
    for _, tag in ipairs(tags or {}) do
        if tag.name == name then return tag.value end
    end
    return nil
end

function Import:TagsMatch(tags, profile)
    local settings = MG.db and MG.db.settings or {}
    local season = tonumber(settings.rxpSeason)
    if season == nil then season = 0 end
    local xpRate = tonumber(settings.rxpRate) or 1
    local hardcore = settings.rxpHardcoreMode and true or false

    for _, tag in ipairs(tags or {}) do
        local name = tag.name
        local value, tagSelector = parseTagCondition(tag.value)

        if tagSelector and tagSelector ~= "" and
           not self:SelectorMatches(tagSelector, profile) then
            -- Conditional tag does not apply to this character.
        elseif name == "hardcore" and not hardcore then
            return false
        elseif name == "softcore" and hardcore then
            return false
        elseif name == "season" then
            local accepted = false
            for number in string.gmatch(value, "%d+") do
                if tonumber(number) == season then accepted = true break end
            end
            if not accepted then return false end
        elseif name == "xprate" then
            local op, amount = value:match("^%s*([<>]=?)%s*([%d%.]+)")
            amount = tonumber(amount)
            if op and amount then
                if op == "<" and not (xpRate < amount) then return false end
                if op == ">" and not (xpRate > amount) then return false end
                if op == "<=" and not (xpRate <= amount) then return false end
                if op == ">=" and not (xpRate >= amount) then return false end
            end
        end
    end

    return true
end

function Import:OccurrenceMatches(occurrence, profile)
    if not occurrence then return false end
    profile = profile or (MG.GetPlayerProfile and MG:GetPlayerProfile()) or {}

    if occurrence.stepSelector and occurrence.stepSelector ~= "" and
       not self:SelectorMatches(occurrence.stepSelector, profile) then
        return false
    end

    if occurrence.actionSelector and occurrence.actionSelector ~= "" and
       not self:SelectorMatches(occurrence.actionSelector, profile) then
        return false
    end

    return self:TagsMatch(occurrence.tags, profile)
end

local function parseCoordinate(args)
    local base = splitCondition(args)
    local values = {}
    for token in string.gmatch(base or "", "[^,]+") do
        values[#values + 1] = trim(token)
    end
    if #values < 3 then return nil end

    local mapSpec = values[1]
    local mapID, floor = mapSpec:match("^(%d+)/(%d+)$")
    if not mapID then mapID = mapSpec:match("^(%d+)$") end

    local first = tonumber(values[2])
    local second = tonumber(values[3])
    if not mapID or not first or not second then
        return {
            mapName = mapSpec,
            source = "RestedXPPublicRouteData",
        }
    end

    mapID = tonumber(mapID)
    floor = tonumber(floor)

    local coordinate = {
        mapID = mapID,
        floor = floor,
        radius = tonumber(values[4]),
        source = "RestedXPPublicRouteData",
        verification = "RESTEDXP_PUBLIC",
    }

    if floor or math.abs(first) > 100 or math.abs(second) > 100 then
        coordinate.worldX = first
        coordinate.worldY = second
    else
        coordinate.x = first / 100
        coordinate.y = second / 100
    end

    return coordinate
end

local function parseQuestAction(kind, args)
    local base, selector = splitCondition(args)
    local questID, objective = tostring(base):match("^%s*(%d+)%s*,?%s*(%d*)")
    if not questID then return nil end

    return {
        kind = kind,
        questID = tonumber(questID),
        objective = objective ~= "" and tonumber(objective) or nil,
        selector = selector,
    }
end

local function metadataValues(metadata, key)
    local value = metadata and metadata[key]
    if value == nil then return {} end
    if type(value) == "table" then return value end
    return { value }
end

local function guideTagsFromMetadata(metadata)
    local tags = {}
    for _, name in ipairs({"hardcore", "softcore", "season", "xprate"}) do
        for _, value in ipairs(metadataValues(metadata, name)) do
            tags[#tags + 1] = {
                name = name,
                value = value,
            }
        end
    end
    return tags
end

local function parseDefaultFor(value)
    local races, classes = {}, {}
    local seenRace, seenClass = {}, {}

    for token in string.gmatch(tostring(value or ""), "[%a]+") do
        if RACES[token] and not seenRace[RACES[token]] then
            seenRace[RACES[token]] = true
            races[#races + 1] = RACES[token]
        elseif CLASSES[token] and not seenClass[CLASSES[token]] then
            seenClass[CLASSES[token]] = true
            classes[#classes + 1] = CLASSES[token]
        end
    end

    return #races > 0 and races or nil, #classes > 0 and classes or nil
end

local function positiveClassesForSelector(selector)
    selector = trim(selector)
    selector = selector:gsub("^<<%s*", "")
    selector = selector:gsub("%s+%-%-.*$", "")
    selector = selector:gsub("%s+#.*$", "")
    selector = trim(selector)
    if selector == "" then return nil end

    local allowed = {}
    local sawBranch = false
    for branch in string.gmatch(selector, "[^/]+") do
        sawBranch = true
        local branchHasPositiveClass = false
        for atom in string.gmatch(trim(branch), "%S+") do
            if string.sub(atom, 1, 1) ~= "!" and CLASSES[atom] then
                allowed[CLASSES[atom]] = true
                branchHasPositiveClass = true
            end
        end
        if not branchHasPositiveClass then return nil end
    end

    return sawBranch and next(allowed) and allowed or nil
end

local function intersectClassSets(a, b)
    if not a then return b end
    if not b then return a end
    local out = {}
    for classFile in pairs(a) do
        if b[classFile] then out[classFile] = true end
    end
    return next(out) and out or nil
end

local function occurrenceClassRestriction(stepSelector, actionSelector)
    return intersectClassSets(
        positiveClassesForSelector(stepSelector),
        positiveClassesForSelector(actionSelector))
end

local function sortedClassList(classSet)
    local out = {}
    for classFile in pairs(classSet or {}) do out[#out + 1] = classFile end
    table.sort(out)
    return out
end

local function deriveQuestClassRestriction(definition)
    local occurrences = definition and definition.rxpOccurrences or {}
    local authoritative = {}

    for _, occurrence in ipairs(occurrences) do
        if occurrence.phase == "accept" then
            authoritative[#authoritative + 1] = occurrence
        end
    end

    local source = "accept"
    if #authoritative == 0 then
        authoritative = occurrences
        source = "all_occurrences"
    end
    if #authoritative == 0 then return nil, nil end

    local union = {}
    for _, occurrence in ipairs(authoritative) do
        local classes = occurrence.classRestriction
        if not classes then return nil, nil end
        for classFile in pairs(classes) do union[classFile] = true end
    end

    if not next(union) then return nil, nil end
    return sortedClassList(union), source
end

function Import:ParseRaw()
    if self.rawGuides then return self.rawGuides end

    local root = MG.RestEDXPForeverRaw or {}
    local guides = {}
    local currentGuide, currentStep

    for _, chunk in ipairs(root.chunks or {}) do
        for line in string.gmatch(chunk .. "\n", "(.-)\n") do
            local fields = splitTabs(line)
            local recordType = fields[1]

            if recordType == "G" then
                currentGuide = {
                    sourceFile = fields[2],
                    metadata = {},
                    steps = {},
                }
                guides[#guides + 1] = currentGuide
                currentStep = nil
            elseif recordType == "M" and currentGuide then
                local key, value = fields[2], fields[3] or ""
                if currentGuide.metadata[key] == nil then
                    currentGuide.metadata[key] = value
                elseif type(currentGuide.metadata[key]) == "table" then
                    currentGuide.metadata[key][#currentGuide.metadata[key] + 1] = value
                else
                    currentGuide.metadata[key] = { currentGuide.metadata[key], value }
                end
            elseif recordType == "S" and currentGuide then
                currentStep = {
                    selector = fields[2] or "",
                    tags = {},
                    actions = {},
                }
                currentGuide.steps[#currentGuide.steps + 1] = currentStep
            elseif recordType == "T" and currentStep then
                currentStep.tags[#currentStep.tags + 1] = {
                    name = fields[2] or "",
                    value = fields[3] or "",
                }
            elseif recordType == "A" and currentStep then
                currentStep.actions[#currentStep.actions + 1] = {
                    kind = fields[2] or "",
                    args = fields[3] or "",
                }
            elseif recordType == "E" then
                currentStep = nil
                currentGuide = nil
            end
        end
    end

    self.rawGuides = guides
    return guides
end

local function guideFaction(metadata)
    local selector = metadata and metadata.selector
    if type(selector) == "table" then selector = selector[1] end
    selector = tostring(selector or "")
    if string.find(selector, "Alliance", 1, true) then return "Alliance" end
    if string.find(selector, "Horde", 1, true) then return "Horde" end
    return nil
end

function Import:BuildGuides()
    if self.guides then return self.guides end

    local normalized = {}
    local source = MG.RestEDXPForeverRaw and MG.RestEDXPForeverRaw.source or {}

    for rawIndex, rawGuide in ipairs(self:ParseRaw()) do
        local metadata = rawGuide.metadata or {}
        local name = type(metadata.name) == "table" and metadata.name[1] or metadata.name
        if name and name ~= "" then
            local minLevel, maxLevel = parseLevelRange(name)
            local races, classes = parseDefaultFor(metadata.defaultfor)
            local guide = {
                id = "rxp-" .. slug(name) .. "-" .. tostring(rawIndex),
                title = name,
                displayName = metadata.displayname,
                faction = guideFaction(metadata),
                races = races,
                classes = classes,
                minLevel = minLevel,
                maxLevel = maxLevel,
                verification = "RESTEDXP_PUBLIC",
                source = "RestedXP/RXPGuides",
                sourceCommit = source.commit,
                sourceFile = rawGuide.sourceFile,
                sourceLicense = source.license,
                nextGuide = metadata.next,
                group = metadata.group,
                subgroup = metadata.subgroup,
                rxpRawIndex = rawIndex,
                rxpGuideSelector = metadata.selector,
                rxpGuideTags = guideTagsFromMetadata(metadata),
                rxpDefaultForRaw = metadata.defaultfor,
                rxpAutoSelect = tostring(metadata.defaultfor or "") ~= "none",
                steps = {},
            }

            local definitions = {}
            local ordered = {}
            local lastGuideCoordinate = nil
            local lastQuestBearingStep = 0

            for stepIndex, rawStep in ipairs(rawGuide.steps or {}) do
                local lastCoordinate = nil
                local stepCoordinates = {}
                local stepHasQuestAction = false

                for actionIndex, action in ipairs(rawStep.actions or {}) do
                    if action.kind == "goto" or action.kind == "waypoint" then
                        lastCoordinate = parseCoordinate(action.args)
                        if lastCoordinate then
                            lastGuideCoordinate = shallowCopy(lastCoordinate)
                            if lastCoordinate.mapID and
                               (lastCoordinate.x or lastCoordinate.worldX) then
                                stepCoordinates[#stepCoordinates + 1] =
                                    shallowCopy(lastCoordinate)
                            end
                        end
                    elseif action.kind == "accept" or
                           action.kind == "turnin" or
                           action.kind == "complete" then
                        local parsed = parseQuestAction(action.kind, action.args)

                        if parsed then
                            stepHasQuestAction = true
                            local definition = definitions[parsed.questID]
                            if not definition then
                                definition = {
                                    id = guide.id .. "-q" .. tostring(parsed.questID),
                                    order = stepIndex * 100 + actionIndex,
                                    questID = parsed.questID,
                                    title = "Quest " .. tostring(parsed.questID),
                                    verification = "RESTEDXP_PUBLIC",
                                    source = "RestedXP/RXPGuides",
                                    rxpOccurrences = {},
                                }
                                definitions[parsed.questID] = definition
                                ordered[#ordered + 1] = definition
                            end

                            definition.rxpOccurrences[#definition.rxpOccurrences + 1] = {
                                phase = action.kind == "complete" and "objectives" or action.kind,
                                objective = parsed.objective,
                                stepSelector = rawStep.selector,
                                actionSelector = parsed.selector,
                                tags = shallowCopy(rawStep.tags),
                                coordinate = lastCoordinate and shallowCopy(lastCoordinate) or
                                    (lastGuideCoordinate and shallowCopy(lastGuideCoordinate) or nil),
                                routeCoordinates = copyCoordinateList(stepCoordinates),
                                rawGuideIndex = rawIndex,
                                leadFromStep = lastQuestBearingStep + 1,
                                sourceStep = stepIndex,
                                sourceAction = actionIndex,
                                classRestriction = occurrenceClassRestriction(
                                    rawStep.selector, parsed.selector),
                            }
                        end
                    end
                end

                if stepHasQuestAction then
                    lastQuestBearingStep = stepIndex
                end
            end

            for _, definition in ipairs(ordered) do
                local questClasses, restrictionSource =
                    deriveQuestClassRestriction(definition)
                if questClasses then
                    definition.classes = questClasses
                    definition.classSpecific = true
                    definition.classRestrictionSource = restrictionSource
                else
                    definition.classSpecific = false
                end
            end

            table.sort(ordered, function(a, b)
                return (a.order or 0) < (b.order or 0)
            end)

            guide.steps = ordered
            if #guide.steps > 0 then normalized[#normalized + 1] = guide end
        end
    end

    self.guides = normalized
    return normalized
end

function Import:GuideMatches(guide, profile)
    profile = profile or (MG.GetPlayerProfile and MG:GetPlayerProfile()) or {}

    local selector = guide and guide.rxpGuideSelector
    if type(selector) == "table" then
        local matched = false
        for _, value in ipairs(selector) do
            if self:SelectorMatches(value, profile) then
                matched = true
                break
            end
        end
        if not matched and #selector > 0 then return false end
    elseif selector and selector ~= "" and not self:SelectorMatches(selector, profile) then
        return false
    end

    return self:TagsMatch(guide and guide.rxpGuideTags or {}, profile)
end

function Import:QuestDefinitionApplies(definition, profile)
    local occurrences = definition and definition.rxpOccurrences
    if type(occurrences) ~= "table" or #occurrences == 0 then return true end

    for _, occurrence in ipairs(occurrences) do
        if self:OccurrenceMatches(occurrence, profile) then return true end
    end
    return false
end

local function occurrenceOrder(occurrence)
    return (tonumber(occurrence and occurrence.sourceStep) or 0) * 100 +
        (tonumber(occurrence and occurrence.sourceAction) or 0)
end

function Import:GetProgressOccurrence(definition, phase, profile, objectiveIndex)
    local occurrences = definition and definition.rxpOccurrences
    if type(occurrences) ~= "table" then return nil end

    profile = profile or (MG.GetPlayerProfile and MG:GetPlayerProfile()) or {}
    objectiveIndex = tonumber(objectiveIndex)

    local best = nil
    for _, occurrence in ipairs(occurrences) do
        local objectiveMatches =
            not objectiveIndex or
            not tonumber(occurrence.objective) or
            tonumber(occurrence.objective) == objectiveIndex

        local phaseMatches = occurrence.phase == phase or phase == "complete"
        if phaseMatches and objectiveMatches and
           self:OccurrenceMatches(occurrence, profile) then
            if not best or occurrenceOrder(occurrence) > occurrenceOrder(best) then
                best = occurrence
            end
        end
    end

    -- If RXP does not number this objective, fall back to the latest
    -- applicable occurrence for the phase instead of losing the route.
    if not best and objectiveIndex then
        for _, occurrence in ipairs(occurrences) do
            local phaseMatches = occurrence.phase == phase or phase == "complete"
            if phaseMatches and self:OccurrenceMatches(occurrence, profile) then
                if not best or occurrenceOrder(occurrence) > occurrenceOrder(best) then
                    best = occurrence
                end
            end
        end
    end

    return best
end

function Import:GetProgressOrder(definition, phase, profile, objectiveIndex)
    local occurrence = self:GetProgressOccurrence(
        definition, phase, profile, objectiveIndex)
    if not occurrence then return tonumber(definition and definition.order) end
    return occurrenceOrder(occurrence)
end

function Import:GetClassSpecificQuestStats(guides)
    local stats = {total = 0, classSpecific = 0, byClass = {}}
    for _, guide in ipairs(guides or self:BuildGuides() or {}) do
        for _, definition in ipairs(guide.steps or {}) do
            stats.total = stats.total + 1
            if definition.classSpecific and type(definition.classes) == "table" then
                stats.classSpecific = stats.classSpecific + 1
                for _, classFile in ipairs(definition.classes) do
                    stats.byClass[classFile] =
                        (stats.byClass[classFile] or 0) + 1
                end
            end
        end
    end
    return stats
end

local function cleanContextName(value)
    value = trim(value)
    value = value:gsub("^%+", "")
    value = value:gsub("::.*$", "")
    return trim(value)
end

local function rawActionApplies(rawStep, action, profile)
    if not rawStep or not action then return false end
    if not Import:SelectorMatches(rawStep.selector, profile) then return false end
    if not Import:TagsMatch(rawStep.tags, profile) then return false end

    local base, selector = splitCondition(action.args)
    if selector and selector ~= "" and
       not Import:SelectorMatches(selector, profile) then
        return false
    end
    return true, base
end

function Import:GetInstructionContext(definition, phase, profile, objectiveIndex)
    local occurrence = self:GetProgressOccurrence(
        definition, phase, profile, objectiveIndex)
    if not occurrence then return {} end

    profile = profile or (MG.GetPlayerProfile and MG:GetPlayerProfile()) or {}
    local rawGuide = self:ParseRaw()[tonumber(occurrence.rawGuideIndex or 0)]
    local rawStep = rawGuide and rawGuide.steps and
        rawGuide.steps[tonumber(occurrence.sourceStep or 0)] or nil
    if not rawStep then return {} end

    local context = {
        sourceStep = occurrence.sourceStep,
        sourceAction = occurrence.sourceAction,
    }

    for _, action in ipairs(rawStep.actions or {}) do
        local applies, base = rawActionApplies(rawStep, action, profile)
        if applies then
            local kind = tostring(action.kind or "")
            if kind == "target" then
                local name = cleanContextName(base)
                if name ~= "" then context.target = name end
            elseif kind == "mob" then
                local name = cleanContextName(base)
                if name ~= "" then context.mob = name end
            elseif kind == "collect" then
                local itemID, amount = tostring(base or ""):match(
                    "^%s*(%d+)%s*,%s*(%d+)")
                context.collectItemID = tonumber(itemID) or context.collectItemID
                context.collectAmount = tonumber(amount) or context.collectAmount
            elseif kind == "zone" or kind == "subzone" then
                local place = cleanContextName(base)
                if place ~= "" then context.location = place end
            end
        end
    end

    if phase == "accept" or phase == "turnin" then
        context.questGiver = context.target
    else
        context.source = context.mob or context.target
    end

    return context
end

local function distanceToCoordinate(coordinate, player)
    if not coordinate or not player then return nil end

    if tonumber(coordinate.mapID) == tonumber(player.mapID) and
       tonumber(coordinate.x) and tonumber(coordinate.y) and
       tonumber(player.x) and tonumber(player.y) then
        local dx = coordinate.x - player.x
        local dy = coordinate.y - player.y
        return math.sqrt(dx * dx + dy * dy)
    end

    if tonumber(coordinate.worldX) and tonumber(coordinate.worldY) and
       MG.ForeverAPI and MG.ForeverAPI.MapToRestedXPWorld then
        local playerWorld = MG.ForeverAPI:MapToRestedXPWorld(
            player.mapID, player.x, player.y)
        if playerWorld then
            local dx = tonumber(coordinate.worldX) - playerWorld.x
            local dy = tonumber(coordinate.worldY) - playerWorld.y
            return math.sqrt(dx * dx + dy * dy)
        end
    end

    return nil
end

function Import:GetCoordinate(definition, phase, profile, objectiveIndex)
    local occurrence = self:GetProgressOccurrence(
        definition, phase, profile, objectiveIndex)

    if not occurrence or not occurrence.coordinate then return nil end

    local best = occurrence.coordinate
    local routePointIndex = nil

    if phase == "objectives" and type(occurrence.routeCoordinates) == "table" and
       #occurrence.routeCoordinates > 1 and MG.ForeverAPI then
        local player = MG.ForeverAPI:GetPlayerPosition()
        local bestDistance = nil

        for index, coordinate in ipairs(occurrence.routeCoordinates) do
            local distance = distanceToCoordinate(coordinate, player)
            if distance and (bestDistance == nil or distance < bestDistance) then
                bestDistance = distance
                best = coordinate
                routePointIndex = index
            end
        end
    end

    best = shallowCopy(best)
    best.phaseMatch = true
    best.rxpSourceStep = occurrence.sourceStep
    best.rxpSourceAction = occurrence.sourceAction
    best.rxpObjective = occurrence.objective
    best.rxpRoutePointCount = type(occurrence.routeCoordinates) == "table" and
        #occurrence.routeCoordinates or 0
    best.rxpRoutePointIndex = routePointIndex
    return best
end

function Import:GetHints(definition, phase, profile, maximum, objectiveIndex)
    local occurrences = definition and definition.rxpOccurrences
    if type(occurrences) ~= "table" then return {} end

    profile = profile or (MG.GetPlayerProfile and MG:GetPlayerProfile()) or {}
    maximum = math.max(1, tonumber(maximum) or 4)

    local selected = self:GetProgressOccurrence(
        definition, phase, profile, objectiveIndex)
    if not selected then return {} end

    local rawGuide = self:ParseRaw()[tonumber(selected.rawGuideIndex or 0)]
    if not rawGuide then return {} end

    local hints, seen = {}, {}
    local firstStep = math.max(1, tonumber(selected.leadFromStep) or tonumber(selected.sourceStep) or 1)
    local lastStep = math.max(firstStep, tonumber(selected.sourceStep) or firstStep)

    for stepIndex = firstStep, lastStep do
        local rawStep = rawGuide.steps and rawGuide.steps[stepIndex] or nil
        if rawStep and self:SelectorMatches(rawStep.selector, profile) and
           self:TagsMatch(rawStep.tags, profile) then
            for _, action in ipairs(rawStep.actions or {}) do
                local actionArgs, selector = splitCondition(action.args)
                if (not selector or selector == "" or self:SelectorMatches(selector, profile)) and
                   MG.RestEDXPActionCatalog then
                    local text = MG.RestEDXPActionCatalog:Format(action.kind, actionArgs)
                    if text and not seen[text] then
                        seen[text] = true
                        hints[#hints + 1] = {
                            kind = action.kind,
                            text = text,
                            args = action.args,
                            sourceStep = stepIndex,
                        }
                        if #hints >= maximum then return hints end
                    end
                end
            end
        end
    end

    return hints
end

function Import:GetActionCoverage()
    local kinds = {}
    local knownActions, unknownActions = 0, 0

    for _, guide in ipairs(self:ParseRaw()) do
        for _, step in ipairs(guide.steps or {}) do
            for _, action in ipairs(step.actions or {}) do
                local kind = tostring(action.kind or "")
                local entry = kinds[kind]
                if not entry then
                    entry = {
                        kind = kind,
                        count = 0,
                        known = MG.RestEDXPActionCatalog and
                            MG.RestEDXPActionCatalog:IsKnown(kind) or false,
                    }
                    kinds[kind] = entry
                end
                entry.count = entry.count + 1
                if entry.known then knownActions = knownActions + 1
                else unknownActions = unknownActions + 1 end
            end
        end
    end

    local knownKinds, unknownKinds = 0, 0
    for _, entry in pairs(kinds) do
        if entry.known then knownKinds = knownKinds + 1
        else unknownKinds = unknownKinds + 1 end
    end

    return {
        knownActionKinds = knownKinds,
        unknownActionKinds = unknownKinds,
        knownActions = knownActions,
        unknownActions = unknownActions,
        catalogActionKinds = MG.RestEDXPActionCatalog and
            MG.RestEDXPActionCatalog:KnownCount() or 0,
    }
end

function Import:GetStats()
    local rawGuides = self:ParseRaw()
    local guides = self:BuildGuides()
    local rawSteps, actions, quests = 0, 0, 0
    local coverage = self:GetActionCoverage()
    local classStats = self:GetClassSpecificQuestStats(guides)
    local sourceFiles = {}

    for _, guide in ipairs(rawGuides) do
        sourceFiles[tostring(guide.sourceFile or "")] = true
        rawSteps = rawSteps + #(guide.steps or {})
        for _, step in ipairs(guide.steps or {}) do
            actions = actions + #(step.actions or {})
        end
    end
    for _, guide in ipairs(guides) do quests = quests + #(guide.steps or {}) end

    local sourceFileCount = 0
    for sourceFile in pairs(sourceFiles) do
        if sourceFile ~= "" then sourceFileCount = sourceFileCount + 1 end
    end

    return {
        sourceFiles = sourceFileCount,
        rawGuides = #rawGuides,
        rawSteps = rawSteps,
        structuredActions = actions,
        normalizedGuides = #guides,
        normalizedQuestDefinitions = quests,
        classSpecificQuests = classStats.classSpecific,
        classSpecificByClass = classStats.byClass,
        knownActionKinds = coverage.knownActionKinds,
        unknownActionKinds = coverage.unknownActionKinds,
        knownActions = coverage.knownActions,
        unknownActions = coverage.unknownActions,
        catalogActionKinds = coverage.catalogActionKinds,
        sourceCommit = MG.RestEDXPForeverRaw and
            MG.RestEDXPForeverRaw.source and
            MG.RestEDXPForeverRaw.source.commit or nil,
    }
end
