local addonName, MG = ...

MG.GuideCompiler = MG.GuideCompiler or {}
local C = MG.GuideCompiler
C.schemaVersion = "mg1-compiled-1"
C.byID = C.byID or {}

local function first(value)
    if type(value) == "table" then return value[1] end
    return value
end

local function metadataValue(metadata, key)
    return first(metadata and metadata[key])
end

local function parseLevelRange(name)
    local a, b = tostring(name or ""):match("(%d+)%s*%-%s*(%d+)")
    return tonumber(a), tonumber(b)
end

local function hasTag(tags, name)
    for _, tag in ipairs(tags or {}) do
        if tag.name == name then return true end
    end
    return false
end

local function tagValue(tags, name)
    for _, tag in ipairs(tags or {}) do
        if tag.name == name then return tag.value end
    end
    return nil
end

local function parseCoordinate(args)
    local base = MG.Util:SplitCondition(args)
    local values = {}
    for token in string.gmatch(base or "", "[^,]+") do
        values[#values + 1] = MG.Util:Trim(token)
    end
    if #values < 3 then return nil end

    local mapSpec = values[1]
    local mapID, floor = mapSpec:match("^(%d+)/(%d+)$")
    if not mapID then mapID = mapSpec:match("^(%d+)$") end

    local firstCoord, secondCoord = tonumber(values[2]), tonumber(values[3])
    local out = {
        mapID = tonumber(mapID),
        mapName = mapID and nil or mapSpec,
        floor = tonumber(floor),
        radius = tonumber(values[4]),
        source = "RestedXP",
    }

    if firstCoord and secondCoord then
        if floor or math.abs(firstCoord) > 100 or math.abs(secondCoord) > 100 then
            out.worldX, out.worldY = firstCoord, secondCoord
        else
            out.x, out.y = firstCoord / 100, secondCoord / 100
        end
    end
    return out
end

local function numericArgs(value)
    local out = {}
    for token in string.gmatch(tostring(value or ""), "[^,]+") do
        local number = tonumber(MG.Util:Trim(token))
        out[#out + 1] = number
    end
    return out
end

local function classify(kind)
    if kind == "goto" or kind == "waypoint" then
        return "navigation", "position"
    end
    if kind == "target" or kind == "mob" or kind == "line" or
       kind == "link" or kind == "arrowtext" then
        return "annotation", "none"
    end
    if kind == "accept" then return "goal", "quest_accept" end
    if kind == "turnin" then return "goal", "quest_turnin" end
    if kind == "complete" then return "goal", "quest_objective" end
    if kind == "collect" then return "goal", "collect" end
    if kind == "itemcount" then return "goal", "itemcount" end
    if kind == "isOnQuest" then return "condition", "quest_active" end
    if kind == "isNotOnQuest" then return "condition", "quest_inactive" end
    if kind == "isQuestComplete" then return "condition", "quest_complete" end
    if kind == "isQuestTurnedIn" then return "condition", "quest_turned_in" end
    if kind == "isQuestNotComplete" then return "condition", "quest_not_complete" end
    if kind == "isQuestAvailable" then return "condition", "quest_available" end
    if kind == "xp" then return "goal", "xp" end
    if kind == "money" then return "goal", "money" end
    if kind == "skill" then return "goal", "skill" end
    if kind == "reputation" then return "goal", "reputation" end
    if kind == "zone" or kind == "subzone" or kind == "zoneskip" then
        return "goal", "location"
    end
    if kind == "train" or kind == "trainer" then return "goal", "train" end
    if kind == "vendor" then return "goal", "vendor" end
    if kind == "use" or kind == "usespell" or kind == "cast" then return "goal", "use" end
    if kind == "equip" then return "goal", "equip" end
    if kind == "tame" then return "goal", "tame" end
    if kind == "fly" or kind == "fp" or kind == "hs" or
       kind == "home" or kind == "bindlocation" or kind == "deathskip" then
        return "goal", "travel"
    end
    if kind == "group" or kind == "solo" or kind == "dungeon" or
       kind == "vehicle" then
        return "annotation", "activity"
    end
    return "goal", "action"
end

local function compileAction(stepID, rawStep, action, actionIndex, lastWaypoint)
    local base, selector = MG.Util:SplitCondition(action.args)
    local role, completionKind = classify(action.kind)
    local catalog = MG.RestEDXPActionCatalog and MG.RestEDXPActionCatalog:Get(action.kind) or nil
    local numbers = numericArgs(base)

    local node = {
        id = stepID .. ":goal:" .. tostring(actionIndex),
        order = actionIndex,
        action = action.kind,
        role = role,
        completionKind = completionKind,
        category = catalog and catalog.category or "unknown",
        visibleByDefault = catalog == nil or catalog.visible ~= false,
        rawArgs = action.args,
        args = base,
        requirements = {
            stepSelector = rawStep.selector or "",
            actionSelector = selector,
            tags = MG.Util:Copy(rawStep.tags or {}),
        },
        waypoint = lastWaypoint and MG.Util:Copy(lastWaypoint) or nil,
        raw = {
            line = action.rawLine,
            kind = action.kind,
        },
    }

    if action.kind == "goto" or action.kind == "waypoint" then
        node.waypoint = parseCoordinate(action.args)
    elseif action.kind == "accept" or action.kind == "turnin" or
           action.kind == "complete" then
        node.questID = numbers[1]
        node.objectiveIndex = numbers[2]
    elseif action.kind == "collect" then
        node.itemID = numbers[1]
        node.required = numbers[2]
        node.questID = numbers[3]
        node.objectiveIndex = numbers[4]
    elseif action.kind == "itemcount" then
        node.itemID = numbers[1]
        node.required = numbers[2]
    elseif action.kind == "use" or action.kind == "equip" or
           action.kind == "destroy" or action.kind == "addquestitem" or
           action.kind == "bankdeposit" or action.kind == "bankwithdraw" then
        node.itemID = numbers[1]
    elseif action.kind == "train" or action.kind == "cast" or
           action.kind == "usespell" then
        node.spellID = numbers[1]
    elseif action.kind == "isOnQuest" or action.kind == "isNotOnQuest" or
           action.kind == "isQuestComplete" or action.kind == "isQuestTurnedIn" or
           action.kind == "isQuestNotComplete" or action.kind == "isQuestAvailable" or
           action.kind == "abandon" then
        node.questID = numbers[1]
    elseif action.kind == "target" or action.kind == "mob" or
           action.kind == "unitscan" then
        node.targetName = MG.Util:Trim(base):gsub("^%+", ""):gsub("::.*$", "")
    elseif action.kind == "zone" or action.kind == "subzone" or
           action.kind == "zoneskip" then
        node.location = MG.Util:Trim(base)
    end

    return node
end

function C:CompileStep(guideID, rawStep, stepIndex)
    local stepID = guideID .. ":step:" .. tostring(stepIndex)
    local step = {
        id = stepID,
        order = stepIndex,
        rawStepIndex = stepIndex,
        requirements = {
            selector = rawStep.selector or "",
            tags = MG.Util:Copy(rawStep.tags or {}),
        },
        sticky = hasTag(rawStep.tags, "sticky"),
        optional = hasTag(rawStep.tags, "optional"),
        loop = hasTag(rawStep.tags, "loop"),
        hideWindow = hasTag(rawStep.tags, "hidewindow"),
        completeWith = tagValue(rawStep.tags, "completewith"),
        label = tagValue(rawStep.tags, "label"),
        requires = tagValue(rawStep.tags, "requires"),
        tags = MG.Util:Copy(rawStep.tags or {}),
        goals = {},
        annotations = {},
        waypoints = {},
        nodes = {},
        raw = MG.Util:Copy(rawStep.raw or {}),
    }

    local lastWaypoint, lastActionable = nil, nil
    for actionIndex, action in ipairs(rawStep.actions or {}) do
        local node = compileAction(stepID, rawStep, action, actionIndex, lastWaypoint)
        if node.action == "goto" or node.action == "waypoint" then
            lastWaypoint = node.waypoint and MG.Util:Copy(node.waypoint) or lastWaypoint
            if node.waypoint then step.waypoints[#step.waypoints + 1] = node.waypoint end
        end

        step.nodes[#step.nodes + 1] = node

        if node.role == "annotation" then
            step.annotations[#step.annotations + 1] = node
            if (node.action == "target" or node.action == "mob") and lastActionable then
                lastActionable.targetName = node.targetName
            end
        else
            step.goals[#step.goals + 1] = node
            if node.role == "goal" or node.role == "condition" then
                lastActionable = node
            end
        end
    end

    local substantive = 0
    for _, goal in ipairs(step.goals) do
        if goal.role ~= "navigation" then substantive = substantive + 1 end
    end
    for _, goal in ipairs(step.goals) do
        goal.passive = goal.role == "navigation" and substantive > 0
        goal.optional = step.optional and true or false
        goal.sticky = step.sticky and true or false
    end

    return step
end

function C:CompileGuide(rawGuide, rawIndex)
    local metadata = rawGuide.metadata or {}
    local name = metadataValue(metadata, "name")
    if not name or name == "" then return nil, "missing_name" end
    local minLevel, maxLevel = parseLevelRange(name)
    local id = "rxp-" .. MG.Util:Slug(name) .. "-" .. tostring(rawIndex)
    local selector = metadataValue(metadata, "selector") or ""
    local faction
    if string.find(selector, "Horde", 1, true) then faction = "Horde"
    elseif string.find(selector, "Alliance", 1, true) then faction = "Alliance" end

    local source = MG.RestEDXPForeverRaw and MG.RestEDXPForeverRaw.source or {}
    local guide = {
        schemaVersion = self.schemaVersion,
        id = id,
        title = name,
        displayName = metadataValue(metadata, "displayname"),
        group = metadataValue(metadata, "group"),
        subgroup = metadataValue(metadata, "subgroup"),
        nextGuide = metadataValue(metadata, "next"),
        defaultFor = metadataValue(metadata, "defaultfor"),
        selector = selector,
        faction = faction,
        minLevel = minLevel,
        maxLevel = maxLevel,
        sourceFile = rawGuide.sourceFile,
        source = source.repository or "RestedXP/RXPGuides",
        sourceCommit = source.commit,
        sourceLicense = source.license,
        metadata = MG.Util:Copy(metadata),
        steps = {},
        labels = {},
    }

    for stepIndex, rawStep in ipairs(rawGuide.steps or {}) do
        local step = self:CompileStep(id, rawStep, stepIndex)
        guide.steps[#guide.steps + 1] = step
        if step.label and step.label ~= "" then guide.labels[step.label] = stepIndex end
    end

    return guide
end

function C:CompileAll(force)
    if self.guides and not force then return self.guides end
    local rawGuides = MG.RestedXPParser:Parse(force)
    local out = {}
    self.byID = {}
    for rawIndex, rawGuide in ipairs(rawGuides) do
        local guide, reason = self:CompileGuide(rawGuide, rawIndex)
        if guide then
            out[#out + 1] = guide
            self.byID[guide.id] = guide
        else
            MG:Log("WARN", "compile.guide_skipped", "RestedXP-Guide wurde nicht kompiliert.", {
                rawIndex = rawIndex, reason = reason, sourceFile = rawGuide.sourceFile,
            })
        end
    end
    self.guides = out
    return out
end

function C:Get(id)
    if not self.guides then self:CompileAll() end
    return self.byID[tostring(id or "")]
end

function C:GetStats()
    local guides = self:CompileAll()
    local steps, goals, annotations, stickies, maxDataLevel = 0, 0, 0, 0, nil
    for _, guide in ipairs(guides) do
        if guide.maxLevel then maxDataLevel = math.max(maxDataLevel or 0, guide.maxLevel) end
        for _, step in ipairs(guide.steps) do
            steps = steps + 1
            goals = goals + #step.goals
            annotations = annotations + #step.annotations
            if step.sticky then stickies = stickies + 1 end
        end
    end
    return {
        schemaVersion = self.schemaVersion,
        guides = #guides,
        steps = steps,
        goals = goals,
        annotations = annotations,
        stickySteps = stickies,
        maxDataLevel = maxDataLevel,
        engineLevelCap = nil,
    }
end
