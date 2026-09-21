local addonName, MG = ...

MG.GuideCompiler = MG.GuideCompiler or {}
local C = MG.GuideCompiler

C.schemaVersion = "mg-compiled-1"
C.compiledByID = C.compiledByID or {}

local function trim(value)
    value = tostring(value or "")
    return value:gsub("^%s+", ""):gsub("%s+$", "")
end

local function copy(value, seen)
    if type(value) ~= "table" then return value end
    seen = seen or {}
    if seen[value] then return seen[value] end
    local out = {}
    seen[value] = out
    for k, v in pairs(value) do out[copy(k, seen)] = copy(v, seen) end
    return out
end

local function splitCondition(args)
    args = trim(args)
    local pos = string.find(args, "<<", 1, true)
    if not pos then return args, nil end
    return trim(string.sub(args, 1, pos - 1)),
        trim(string.sub(args, pos + 2))
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
    local first, second = tonumber(values[2]), tonumber(values[3])
    if not mapID then
        return {mapName=mapSpec,source="RestedXPPublicRouteData"}
    end
    local out = {
        mapID = tonumber(mapID),
        floor = tonumber(floor),
        radius = tonumber(values[4]),
        source = "RestedXPPublicRouteData",
        verification = "RESTEDXP_PUBLIC",
    }
    if first and second then
        if floor or math.abs(first) > 100 or math.abs(second) > 100 then
            out.worldX, out.worldY = first, second
        else
            out.x, out.y = first / 100, second / 100
        end
    end
    return out
end

local function parseQuestAction(kind, args)
    local base, selector = splitCondition(args)
    local questID, objective = tostring(base or ""):match("^%s*(%d+)%s*,?%s*(%d*)")
    if not questID then return nil end
    return {
        questID = tonumber(questID),
        objectiveIndex = objective ~= "" and tonumber(objective) or nil,
        selector = selector,
        phase = kind == "complete" and "objectives" or kind,
    }
end

local function parseCollect(args)
    local base, selector = splitCondition(args)
    local itemID, amount = tostring(base or ""):match("^%s*(%d+)%s*,?%s*(%d*)")
    return tonumber(itemID), amount ~= "" and tonumber(amount) or nil, selector
end

local PASSIVE_KINDS = {
    goto=true, waypoint=true, target=true, mob=true, zone=true, subzone=true,
    line=true, link=true, itemStat=true, itemcount=true, cooldown=true,
    isOnQuest=true, isNotOnQuest=true, isQuestComplete=true,
    isQuestNotComplete=true, isQuestTurnedIn=true, isQuestAvailable=true,
    maxlevel=true, disablecheckbox=true,
}

local function normalizeGoalType(kind)
    if kind == "complete" then return "quest_objective" end
    if kind == "accept" then return "quest_accept" end
    if kind == "turnin" then return "quest_turnin" end
    if kind == "collect" then return "collect" end
    if kind == "mob" or kind == "target" or kind == "unitscan" then return "target" end
    if kind == "goto" or kind == "waypoint" or kind == "fly" or kind == "fp" or kind == "hs" then
        return "travel"
    end
    return tostring(kind or "action")
end

function C:CompileRawStep(guideID, rawGuideIndex, stepIndex, rawStep)
    local step = {
        id = tostring(guideID) .. ":step:" .. tostring(stepIndex),
        order = stepIndex * 10,
        rawStepIndex = stepIndex,
        selector = rawStep.selector or "",
        tags = copy(rawStep.tags or {}),
        requirements = {selector=rawStep.selector or "",tags=copy(rawStep.tags or {})},
        goals = {}, routeTargets = {}, questIDs = {},
        source = "RestedXP/RXPGuides",
        verification = "RESTEDXP_PUBLIC",
        raw = {guideIndex=rawGuideIndex,stepIndex=stepIndex},
    }

    local questSeen, lastCoordinate = {}, nil
    for actionIndex, action in ipairs(rawStep.actions or {}) do
        local kind = tostring(action.kind or "")
        local base, actionSelector = splitCondition(action.args)
        local catalog = MG.RestEDXPActionCatalog and MG.RestEDXPActionCatalog:Get(kind) or nil
        local goal = {
            id = step.id .. ":goal:" .. tostring(actionIndex),
            order = actionIndex,
            action = kind,
            goalType = normalizeGoalType(kind),
            category = catalog and catalog.category or "unknown",
            visibleByDefault = not catalog or catalog.visible ~= false,
            passive = PASSIVE_KINDS[kind] and true or false,
            rawArgs = action.args or "",
            args = base,
            requirements = {
                stepSelector = rawStep.selector or "",
                actionSelector = actionSelector,
                tags = copy(rawStep.tags or {}),
            },
            raw = {guideIndex=rawGuideIndex,stepIndex=stepIndex,actionIndex=actionIndex,kind=kind},
        }

        if kind == "goto" or kind == "waypoint" then
            lastCoordinate = parseCoordinate(action.args)
            goal.navigationTarget = copy(lastCoordinate)
            if lastCoordinate then step.routeTargets[#step.routeTargets + 1] = copy(lastCoordinate) end
        elseif kind == "accept" or kind == "turnin" or kind == "complete" then
            local parsed = parseQuestAction(kind, action.args)
            if parsed then
                goal.questID = parsed.questID
                goal.objectiveIndex = parsed.objectiveIndex
                goal.phase = parsed.phase
                goal.requirements.actionSelector = parsed.selector
                goal.navigationTarget = copy(lastCoordinate)
                if not questSeen[parsed.questID] then
                    questSeen[parsed.questID] = true
                    step.questIDs[#step.questIDs + 1] = parsed.questID
                end
            end
        elseif kind == "collect" then
            local itemID, amount, selector = parseCollect(action.args)
            goal.itemID, goal.required = itemID, amount
            goal.requirements.actionSelector = selector
            goal.navigationTarget = copy(lastCoordinate)
        elseif kind == "target" or kind == "mob" then
            goal.targetName = trim(base):gsub("^%+", ""):gsub("::.*$", "")
            goal.navigationTarget = copy(lastCoordinate)
        elseif kind == "use" or kind == "equip" or kind == "destroy" or
               kind == "addquestitem" or kind == "bankdeposit" or kind == "bankwithdraw" then
            goal.itemID = tonumber(tostring(base or ""):match("^%s*(%d+)"))
            goal.navigationTarget = copy(lastCoordinate)
        else
            goal.navigationTarget = copy(lastCoordinate)
        end

        step.goals[#step.goals + 1] = goal
    end
    return step
end

function C:CompileRestedXPGuide(rawGuide, rawIndex, legacyGuide)
    legacyGuide = legacyGuide or {}
    local guideID = legacyGuide.id or ("rxp-compiled-" .. tostring(rawIndex))
    local out = {
        schemaVersion=self.schemaVersion,id=guideID,title=legacyGuide.title or guideID,
        displayName=legacyGuide.displayName,providerID="restedxp-forever",
        source=legacyGuide.source or "RestedXP/RXPGuides",sourceFile=legacyGuide.sourceFile or rawGuide.sourceFile,
        sourceCommit=legacyGuide.sourceCommit,sourceLicense=legacyGuide.sourceLicense,
        verification=legacyGuide.verification or "RESTEDXP_PUBLIC",
        faction=legacyGuide.faction,races=copy(legacyGuide.races),classes=copy(legacyGuide.classes),
        minLevel=tonumber(legacyGuide.minLevel),maxLevel=tonumber(legacyGuide.maxLevel),
        nextGuide=legacyGuide.nextGuide,metadata=copy(rawGuide.metadata or {}),
        requirements={guideSelector=legacyGuide.rxpGuideSelector,tags=copy(legacyGuide.rxpGuideTags or {})},
        capabilities={browse=true,select=true,autoRoute=true,compiledDomain=true},
        steps={},questIndex={},rawGuideIndex=rawIndex,
    }
    for stepIndex, rawStep in ipairs(rawGuide.steps or {}) do
        local step = self:CompileRawStep(guideID, rawIndex, stepIndex, rawStep)
        out.steps[#out.steps + 1] = step
        for _, questID in ipairs(step.questIDs or {}) do
            out.questIndex[questID] = out.questIndex[questID] or {}
            out.questIndex[questID][#out.questIndex[questID] + 1] = step
        end
    end
    return out
end

function C:BuildRestedXPCompiledGuides()
    if not MG.RestEDXPImport then return {} end
    local rawGuides = MG.RestEDXPImport:ParseRaw() or {}
    local legacyGuides = MG.RestEDXPImport:BuildGuides() or {}
    local legacyByRaw = {}
    for _, guide in ipairs(legacyGuides) do legacyByRaw[tonumber(guide.rxpRawIndex)] = guide end
    local out = {}
    for rawIndex, rawGuide in ipairs(rawGuides) do
        local legacy = legacyByRaw[rawIndex]
        if legacy then
            local compiled = self:CompileRestedXPGuide(rawGuide, rawIndex, legacy)
            out[#out + 1] = compiled
            self.compiledByID[compiled.id] = compiled
        end
    end
    return out
end

function C:CompileLegacyGuide(guide)
    if type(guide) ~= "table" then return nil end
    local out = {
        schemaVersion=self.schemaVersion,id=tostring(guide.id or ""),title=guide.title,
        providerID=guide.providerID or "legacy",source=guide.source,verification=guide.verification,
        faction=guide.faction,races=copy(guide.races),classes=copy(guide.classes),
        minLevel=tonumber(guide.minLevel),maxLevel=tonumber(guide.maxLevel),
        categories=copy(guide.categories),
        capabilities=copy(guide.capabilities or {browse=true,select=true,autoRoute=false,compiledDomain=true}),
        steps={},questIndex={},
    }
    for index, legacyStep in ipairs(guide.steps or {}) do
        local step = {
            id=tostring(legacyStep.id or (out.id..":step:"..index)),
            order=tonumber(legacyStep.order) or index*10,rawStepIndex=index,
            requirements={faction=legacyStep.faction,races=copy(legacyStep.races),classes=copy(legacyStep.classes),
              minLevel=legacyStep.minLevel,maxLevel=legacyStep.maxLevel,prerequisiteQuestIDs=copy(legacyStep.prerequisiteQuestIDs)},
            goals={},routeTargets={},questIDs={},verification=legacyStep.verification or guide.verification,
            source=legacyStep.source or guide.source,legacyDefinition=legacyStep,
        }
        if legacyStep.questID then
            local questID=tonumber(legacyStep.questID)
            step.questIDs[1]=questID
            step.goals[1]={id=step.id..":goal:1",order=1,action="quest",goalType="quest",questID=questID,
              passive=false,visibleByDefault=true,legacy=true}
            out.questIndex[questID]=out.questIndex[questID] or {}
            out.questIndex[questID][#out.questIndex[questID]+1]=step
        end
        out.steps[#out.steps+1]=step
    end
    self.compiledByID[out.id]=out
    return out
end

function C:GetGuide(id) return id and self.compiledByID[tostring(id)] or nil end
function C:GetQuestSteps(guideID, questID)
    local guide=self:GetGuide(guideID)
    return guide and guide.questIndex and guide.questIndex[tonumber(questID)] or {}
end
function C:GetStats()
    local guides,steps,goals,maxLevel=0,0,0,nil
    for _,guide in pairs(self.compiledByID or {}) do
        guides=guides+1
        if tonumber(guide.maxLevel) then maxLevel=math.max(maxLevel or 0,tonumber(guide.maxLevel)) end
        for _,step in ipairs(guide.steps or {}) do steps=steps+1;goals=goals+#(step.goals or {}) end
    end
    return {schemaVersion=self.schemaVersion,guides=guides,steps=steps,goals=goals,maxDataLevel=maxLevel,levelCapAssumption=false}
end
