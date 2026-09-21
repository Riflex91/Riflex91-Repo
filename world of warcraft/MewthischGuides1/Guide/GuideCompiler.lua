local addonName, MG = ...

MG.GuideCompiler = MG.GuideCompiler or {}
local C = MG.GuideCompiler

local function first(value)
    if type(value) == "table" then return value[1] end
    return value
end

local function levelRange(name)
    local a, b = tostring(name or ""):match("(%d+)%s*%-%s*(%d+)")
    return tonumber(a), tonumber(b)
end

local function splitCondition(args)
    return MG.Util:SplitCondition(args)
end

local function parseQuestArgs(args)
    local base, selector = splitCondition(args)
    local questID, objective = tostring(base or ""):match("^%s*(%d+)%s*,?%s*(%d*)")
    return tonumber(questID), objective ~= "" and tonumber(objective) or nil, selector
end

local function parseCollectArgs(args)
    local base, selector = splitCondition(args)
    local itemID, amount, questID, objective =
        tostring(base or ""):match("^%s*(%d+)%s*,?%s*(%d*)%s*,?%s*(%d*)%s*,?%s*(%d*)")
    return tonumber(itemID),
        amount ~= "" and tonumber(amount) or nil,
        questID ~= "" and tonumber(questID) or nil,
        objective ~= "" and tonumber(objective) or nil,
        selector
end

local function parseCoordinate(args)
    local base, selector = splitCondition(args)
    local parts = {}
    for token in tostring(base or ""):gmatch("[^,]+") do
        parts[#parts + 1] = MG.Util:Trim(token)
    end
    if #parts < 3 then return nil, selector end

    local mapSpec = parts[1]
    local mapID, floor = mapSpec:match("^(%d+)/(%d+)$")
    if not mapID then mapID = mapSpec:match("^(%d+)$") end

    local a, b = tonumber(parts[2]), tonumber(parts[3])
    local waypoint = {
        mapID = tonumber(mapID),
        mapName = mapID and nil or mapSpec,
        floor = tonumber(floor),
        radius = tonumber(parts[4]),
        source = "RestedXP",
    }

    if a and b then
        if floor or math.abs(a) > 100 or math.abs(b) > 100 then
            waypoint.worldX, waypoint.worldY = a, b
        else
            waypoint.x, waypoint.y = a / 100, b / 100
        end
    end
    return waypoint, selector
end

local COMPLETION_KIND = {
    accept="quest_accept",
    turnin="quest_turnin",
    complete="quest_objective",
    collect="collect",
    itemcount="itemcount",
    isOnQuest="quest_active",
    isNotOnQuest="quest_inactive",
    isQuestComplete="quest_complete",
    isQuestNotComplete="quest_not_complete",
    isQuestTurnedIn="quest_turned_in",
    goto="position",
    waypoint="position",
    xp="xp",
    money="money",
    skill="skill",
    reputation="reputation",
    train="train",
    trainer="train",
    vendor="vendor",
    use="use",
    equip="equip",
    tame="tame",
    fly="travel",
    fp="travel",
    hs="travel",
    home="travel",
    bindlocation="action",
    cast="action",
    usespell="action",
    abandon="action",
    emote="action",
    bankdeposit="action",
    bankwithdraw="action",
    macro="action",
    vehicle="action",
    gossipoption="action",
    acceptmultiple="action",
}

local PRIMARY_ACTION = {
    accept=true, turnin=true, complete=true, collect=true, itemcount=true,
    xp=true, money=true, skill=true, reputation=true,
    train=true, trainer=true, vendor=true, use=true, equip=true, tame=true,
    fly=true, fp=true, hs=true, home=true, bindlocation=true, cast=true,
    usespell=true, abandon=true, emote=true, bankdeposit=true,
    bankwithdraw=true, macro=true, vehicle=true, gossipoption=true,
    acceptmultiple=true,
}

local CONDITION_ACTION = {
    isOnQuest=true, isNotOnQuest=true, isQuestComplete=true,
    isQuestNotComplete=true, isQuestTurnedIn=true, isQuestAvailable=true,
    maxlevel=true,
}

local PASSIVE_ACTION = {
    target=true, mob=true, goto=true, waypoint=true, zone=true, subzone=true,
    zoneskip=true, line=true, unitscan=true, group=true, dungeon=true,
    itemStat=true, cooldown=true, link=true, disablecheckbox=true,
}

local function hasTag(tags, name)
    for _, tag in ipairs(tags or {}) do
        if tag.name == name then return true end
    end
    return false
end

local function lastTagValue(tags, name)
    local value
    for _, tag in ipairs(tags or {}) do
        if tag.name == name then value = tag.value end
    end
    return value
end

function C:CompileEntry(step, rawStep, action, actionIndex, lastWaypoint)
    local kind = tostring(action.kind or "")
    local base, selector = splitCondition(action.args)
    local role =
        PRIMARY_ACTION[kind] and "goal" or
        CONDITION_ACTION[kind] and "condition" or
        "annotation"

    local entry = {
        id = step.id .. ":entry:" .. tostring(actionIndex),
        order = actionIndex,
        action = kind,
        kind = kind,
        args = base,
        rawArgs = action.args,
        role = role,
        passive = PASSIVE_ACTION[kind] and true or false,
        optional = step.optional,
        sticky = step.sticky,
        visibleByDefault =
            role == "goal" or PASSIVE_ACTION[kind] == true,
        completionKind = COMPLETION_KIND[kind] or
            (role == "annotation" and "none" or "action"),
        waypoint = lastWaypoint and MG.Util:Copy(lastWaypoint) or nil,
        requirements = {
            stepSelector = rawStep.selector or "",
            actionSelector = selector or "",
            tags = MG.Util:Copy(rawStep.tags or {}),
        },
        source = "RestedXP",
        raw = {
            stepIndex = rawStep.rawIndex,
            actionIndex = action.rawIndex or actionIndex,
        },
    }

    if kind == "accept" or kind == "turnin" or kind == "complete" or
       kind == "isOnQuest" or kind == "isNotOnQuest" or
       kind == "isQuestComplete" or kind == "isQuestNotComplete" or
       kind == "isQuestTurnedIn" or kind == "isQuestAvailable" then
        entry.questID, entry.objectiveIndex, entry.requirements.actionSelector =
            parseQuestArgs(action.args)
    elseif kind == "collect" then
        entry.itemID, entry.required, entry.questID, entry.objectiveIndex,
            entry.requirements.actionSelector = parseCollectArgs(action.args)
    elseif kind == "itemcount" then
        local itemID, amount = tostring(base or ""):match("^%s*(%d+)%s*,?%s*(%d*)")
        entry.itemID = tonumber(itemID)
        entry.required = amount ~= "" and tonumber(amount) or nil
    elseif kind == "goto" or kind == "waypoint" then
        entry.waypoint, entry.requirements.actionSelector = parseCoordinate(action.args)
    elseif kind == "target" or kind == "mob" or kind == "unitscan" then
        entry.targetName = MG.Util:Trim(base):gsub("^%+", ""):gsub("::.*$", "")
    elseif kind == "use" or kind == "equip" or kind == "destroy" or
           kind == "addquestitem" or kind == "bankdeposit" or kind == "bankwithdraw" then
        entry.itemID = tonumber(tostring(base or ""):match("^%s*(%d+)"))
    elseif kind == "train" or kind == "cast" or kind == "usespell" then
        entry.spellID = tonumber(tostring(base or ""):match("^%s*(%d+)"))
    elseif kind == "zone" or kind == "subzone" or kind == "zoneskip" then
        entry.location = MG.Util:Trim(base)
    end

    return entry
end

function C:CompileStep(guide, rawStep, stepIndex)
    local step = {
        id = guide.id .. ":step:" .. tostring(stepIndex),
        order = stepIndex,
        rawStepIndex = rawStep.rawIndex or stepIndex,
        selector = rawStep.selector or "",
        tags = MG.Util:Copy(rawStep.tags or {}),
        sticky = hasTag(rawStep.tags, "sticky"),
        optional = hasTag(rawStep.tags, "optional"),
        completeWith = lastTagValue(rawStep.tags, "completewith"),
        label = lastTagValue(rawStep.tags, "label"),
        requires = lastTagValue(rawStep.tags, "requires"),
        loop = hasTag(rawStep.tags, "loop"),
        hideWindow = hasTag(rawStep.tags, "hidewindow"),
        entries = {},
        goals = {},
        annotations = {},
        conditions = {},
        route = {},
    }

    local lastWaypoint = nil
    for actionIndex, action in ipairs(rawStep.actions or {}) do
        local entry = self:CompileEntry(step, rawStep, action, actionIndex, lastWaypoint)
        step.entries[#step.entries + 1] = entry

        if entry.action == "goto" or entry.action == "waypoint" then
            lastWaypoint = entry.waypoint
            if lastWaypoint then
                step.route[#step.route + 1] = MG.Util:Copy(lastWaypoint)
            end
        end

        if entry.role == "goal" then
            step.goals[#step.goals + 1] = entry
        elseif entry.role == "condition" then
            step.conditions[#step.conditions + 1] = entry
        else
            step.annotations[#step.annotations + 1] = entry
        end
    end

    -- Preserve travel-only RXP steps as real semantic steps. A route entry is
    -- promoted only when there is no other blocking goal in the step.
    if #step.goals == 0 then
        for _, entry in ipairs(step.entries) do
            if entry.action == "goto" or entry.action == "waypoint" then
                local promoted = MG.Util:Copy(entry)
                promoted.id = entry.id .. ":travel-goal"
                promoted.role = "goal"
                promoted.passive = false
                promoted.visibleByDefault = true
                promoted.completionKind = "position"
                step.goals[#step.goals + 1] = promoted
            end
        end
    end

    return step
end

function C:CompileGuide(rawGuide, index)
    local metadata = rawGuide.metadata or {}
    local name = first(metadata.name) or ("RestedXP Guide " .. tostring(index))
    local minLevel, maxLevel = levelRange(name)
    local guide = {
        id = "rxp:" .. MG.Util:Slug(rawGuide.sourceFile) .. ":" ..
            MG.Util:Slug(name) .. ":" .. tostring(index),
        title = name,
        displayName = first(metadata.displayname),
        sourceFile = rawGuide.sourceFile,
        source = "RestedXP",
        sourceCommit = MG.RestEDXPParser:GetSource().commit,
        group = first(metadata.group),
        subgroup = first(metadata.subgroup),
        selector = first(metadata.selector),
        defaultFor = first(metadata.defaultfor),
        nextGuide = first(metadata.next),
        minLevel = minLevel,
        maxLevel = maxLevel,
        metadata = MG.Util:Copy(metadata),
        steps = {},
    }

    for stepIndex, rawStep in ipairs(rawGuide.steps or {}) do
        guide.steps[#guide.steps + 1] =
            self:CompileStep(guide, rawStep, stepIndex)
    end
    return guide
end

function C:CompileAll(force)
    if self.cache and not force then return self.cache end
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
        for _, step in ipairs(guide.steps or {}) do
            steps = steps + 1
            entries = entries + #(step.entries or {})
            goals = goals + #(step.goals or {})
            if step.sticky then stickies = stickies + 1 end
        end
    end
    return {
        guides=guides, steps=steps, entries=entries,
        goals=goals, stickies=stickies, levelCapAssumption=false,
    }
end
