local addonName, MG = ...

MG.GuideCompiler = MG.GuideCompiler or {}
local C = MG.GuideCompiler

local function trim(value)
    value = tostring(value or "")
    return value:gsub("^%s+", ""):gsub("%s+$", "")
end

local function first(value)
    if type(value) == "table" then return value[1] end
    return value
end

local function slug(value)
    value = tostring(value or "guide"):lower():gsub("[^%w]+", "-")
    value = value:gsub("^%-+", ""):gsub("%-+$", "")
    return value ~= "" and value or "guide"
end

local function levelRange(name)
    local a, b = tostring(name or ""):match("(%d+)%s*%-%s*(%d+)")
    return tonumber(a), tonumber(b)
end

local function splitCondition(args)
    args = trim(args)
    local pos = string.find(args, "<<", 1, true)
    if not pos then return args, nil end
    return trim(string.sub(args, 1, pos - 1)), trim(string.sub(args, pos + 2))
end

local function questArgs(args)
    local base, selector = splitCondition(args)
    local questID, objective = base:match("^%s*(%d+)%s*,?%s*(%d*)")
    return tonumber(questID), objective ~= "" and tonumber(objective) or nil, selector
end

local function collectArgs(args)
    local base, selector = splitCondition(args)
    local itemID, amount, questID, objective = base:match("^%s*(%d+)%s*,?%s*(%d*)%s*,?%s*(%d*)%s*,?%s*(%d*)")
    return tonumber(itemID), amount ~= "" and tonumber(amount) or nil,
        questID ~= "" and tonumber(questID) or nil,
        objective ~= "" and tonumber(objective) or nil, selector
end

local function parseCoordinate(args)
    local base, selector = splitCondition(args)
    local parts = {}
    for token in base:gmatch("[^,]+") do parts[#parts + 1] = trim(token) end
    if #parts < 3 then return nil, selector end
    local map = parts[1]
    local mapID, floor = map:match("^(%d+)/(%d+)$")
    if not mapID then mapID = map:match("^(%d+)$") end
    local a, b = tonumber(parts[2]), tonumber(parts[3])
    local out = {
        mapID = tonumber(mapID),
        mapName = mapID and nil or map,
        floor = tonumber(floor),
        radius = tonumber(parts[4]),
        source = "RestedXP",
    }
    if a and b then
        if floor or math.abs(a) > 100 or math.abs(b) > 100 then
            out.worldX, out.worldY = a, b
        else
            out.x, out.y = a / 100, b / 100
        end
    end
    return out, selector
end

local ACTIVE_ACTIONS = {
    accept=true, turnin=true, complete=true, collect=true, xp=true, use=true,
    vendor=true, trainer=true, train=true, fly=true, fp=true, hs=true,
    home=true, bindlocation=true, cast=true, equip=true, abandon=true,
    reputation=true, emote=true, bankdeposit=true, bankwithdraw=true,
    macro=true, vehicle=true, tame=true, gossipoption=true, acceptmultiple=true,
}

local PASSIVE_ACTIONS = {
    target=true, mob=true, goto=true, waypoint=true, zone=true, subzone=true,
    line=true, itemStat=true, itemcount=true, cooldown=true, unitscan=true,
    group=true, dungeon=true,
}

local CONDITION_ACTIONS = {
    isOnQuest=true,isNotOnQuest=true,isQuestComplete=true,isQuestNotComplete=true,
    isQuestTurnedIn=true,isQuestAvailable=true,maxlevel=true,skill=true,money=true,
}

local function tagMap(tags)
    local out = {}
    for _, tag in ipairs(tags or {}) do
        out[tag.name] = out[tag.name] or {}
        out[tag.name][#out[tag.name] + 1] = tag.value
    end
    return out
end

function C:CompileAction(step, action, actionIndex, lastWaypoint)
    local kind = tostring(action.kind or "")
    local base, selector = splitCondition(action.args)
    local entry = {
        id = step.id .. ":entry:" .. tostring(actionIndex),
        order = actionIndex,
        kind = kind,
        rawArgs = action.args,
        args = base,
        selector = selector,
        role = ACTIVE_ACTIONS[kind] and "goal" or CONDITION_ACTIONS[kind] and "condition" or "annotation",
        passive = PASSIVE_ACTIONS[kind] and true or false,
        visible = ACTIVE_ACTIONS[kind] or PASSIVE_ACTIONS[kind] or false,
        navigation = lastWaypoint and MG:CopyTable(lastWaypoint) or nil,
        source = "RestedXP",
    }

    if kind == "accept" or kind == "turnin" or kind == "complete" then
        entry.questID, entry.objectiveIndex, entry.selector = questArgs(action.args)
    elseif kind == "collect" then
        entry.itemID, entry.required, entry.questID, entry.objectiveIndex, entry.selector = collectArgs(action.args)
    elseif kind == "goto" or kind == "waypoint" then
        entry.navigation, entry.selector = parseCoordinate(action.args)
    elseif kind == "target" or kind == "mob" then
        entry.target = trim(base):gsub("^%+", ""):gsub("::.*$", "")
    elseif kind == "use" or kind == "equip" or kind == "destroy" or kind == "addquestitem" then
        entry.itemID = tonumber(base:match("^%s*(%d+)"))
    elseif kind == "train" or kind == "cast" or kind == "usespell" then
        entry.spellID = tonumber(base:match("^%s*(%d+)"))
    end
    return entry
end

function C:CompileStep(guide, rawStep, stepIndex)
    local tags = tagMap(rawStep.tags)
    local step = {
        id = guide.id .. ":step:" .. tostring(stepIndex),
        order = stepIndex,
        selector = rawStep.selector,
        tags = tags,
        sticky = tags.sticky ~= nil,
        optional = tags.optional ~= nil,
        completeWith = tags.completewith and tags.completewith[#tags.completewith] or nil,
        label = tags.label and tags.label[#tags.label] or nil,
        requires = tags.requires and tags.requires[#tags.requires] or nil,
        loop = tags.loop ~= nil,
        hideWindow = tags.hidewindow ~= nil,
        entries = {},
        goals = {},
        annotations = {},
        conditions = {},
        route = {},
        rawStepIndex = rawStep.rawIndex,
    }

    local lastWaypoint = nil
    for actionIndex, action in ipairs(rawStep.actions or {}) do
        local entry = self:CompileAction(step, action, actionIndex, lastWaypoint)
        step.entries[#step.entries + 1] = entry
        if entry.kind == "goto" or entry.kind == "waypoint" then
            lastWaypoint = entry.navigation
            if lastWaypoint then step.route[#step.route + 1] = MG:CopyTable(lastWaypoint) end
        end
        if entry.role == "goal" then
            step.goals[#step.goals + 1] = entry
        elseif entry.role == "condition" then
            step.conditions[#step.conditions + 1] = entry
        else
            step.annotations[#step.annotations + 1] = entry
        end
    end
    return step
end

function C:CompileGuide(rawGuide, index)
    local meta = rawGuide.metadata or {}
    local name = first(meta.name) or ("RestedXP Guide " .. tostring(index))
    local minLevel, maxLevel = levelRange(name)
    local guide = {
        id = "rxp:" .. slug(rawGuide.sourceFile) .. ":" .. slug(name) .. ":" .. tostring(index),
        title = name,
        displayName = first(meta.displayname),
        sourceFile = rawGuide.sourceFile,
        source = "RestedXP",
        sourceCommit = MG.RestEDXPParser:GetSource().commit,
        group = first(meta.group),
        subgroup = first(meta.subgroup),
        selector = first(meta.selector),
        defaultFor = first(meta.defaultfor),
        nextGuide = first(meta.next),
        minLevel = minLevel,
        maxLevel = maxLevel,
        metadata = MG:CopyTable(meta),
        steps = {},
    }

    for stepIndex, rawStep in ipairs(rawGuide.steps or {}) do
        guide.steps[#guide.steps + 1] = self:CompileStep(guide, rawStep, stepIndex)
    end
    return guide
end

function C:CompileAll()
    if self.cache then return self.cache end
    local out = {}
    for index, rawGuide in ipairs(MG.RestEDXPParser:Parse()) do
        out[#out + 1] = self:CompileGuide(rawGuide, index)
    end
    self.cache = out
    return out
end

function C:GetStats()
    local guides, steps, entries, goals, stickies = 0, 0, 0, 0, 0
    for _, guide in ipairs(self:CompileAll()) do
        guides = guides + 1
        for _, step in ipairs(guide.steps) do
            steps = steps + 1
            entries = entries + #step.entries
            goals = goals + #step.goals
            if step.sticky then stickies = stickies + 1 end
        end
    end
    return {guides=guides,steps=steps,entries=entries,goals=goals,stickies=stickies}
end
