local addonName, MG = ...

MG.QuestHintResolver = MG.QuestHintResolver or {}
local H = MG.QuestHintResolver

local function trim(value)
    return MG.Util:Trim(value)
end

local function cleanObjectiveName(value)
    value=trim(value)
    value=value:gsub(":%s*%d+%s*/%s*%d+%s*$","")
    value=value:gsub("%s+%d+%s*/%s*%d+%s*$","")
    value=value:gsub("%s+[Gg]etötet%s*$","")
    value=value:gsub("%s+[Kk]illed%s*$","")
    value=value:gsub("%s+[Ss]lain%s*$","")
    value=value:gsub("%s+[Gg]esammelt%s*$","")
    return trim(value)
end

local function objectiveFor(state,facts)
    local quest=state and state.questID and facts and facts.quests and facts.quests[state.questID]
    if not quest then return nil end
    local index=tonumber(state.objectiveIndex)
    return index and quest.objectives and quest.objectives[index] or nil
end

local function nearestTarget(step,state)
    local goal=state and state.sourceGoal or {}
    if goal.targetName and trim(goal.targetName)~="" then return trim(goal.targetName) end
    local wanted=tonumber(goal.order) or math.huge
    local before,beforeDistance,after,afterDistance
    for _,entry in ipairs(step and step.entries or {}) do
        if (entry.action=="target" or entry.action=="mob" or entry.action=="unitscan") and
           entry.targetName and trim(entry.targetName)~="" then
            local order=tonumber(entry.order) or 0
            if order<=wanted then
                local d=wanted-order
                if not beforeDistance or d<beforeDistance then before,beforeDistance=entry.targetName,d end
            else
                local d=order-wanted
                if not afterDistance or d<afterDistance then after,afterDistance=entry.targetName,d end
            end
        end
    end
    return trim(before or after or "")
end

local function waypointFor(state,navigation,step)
    if navigation and navigation.goalState and state and
       navigation.goalState.id==state.id and navigation.waypoint then
        return navigation.waypoint
    end
    local goal=state and state.sourceGoal or {}
    if goal.waypoint then return goal.waypoint end
    if state and state.waypoint then return state.waypoint end
    return step and step.route and step.route[1] or nil
end

local function locationText(waypoint)
    if not waypoint then return nil end
    local x,y=tonumber(waypoint.x),tonumber(waypoint.y)
    if x and y and x>=0 and x<=1 and y>=0 and y<=1 then
        return string.format("Karte %.1f / %.1f",x*100,y*100)
    end
    if tonumber(waypoint.worldX) and tonumber(waypoint.worldY) then
        return "Folge dem Pfeil zum markierten Zielgebiet"
    end
    return "Folge dem Pfeil zum markierten Ziel"
end

local function currentState(goalStates,navigation)
    local id=navigation and navigation.goalState and navigation.goalState.id
    if id then
        for _,state in ipairs(goalStates or {}) do if state.id==id then return state end end
    end
    for _,state in ipairs(goalStates or {}) do
        if state.visible and state.possible and not state.passive and not state.complete and
           state.role=="goal" then return state end
    end
    for _,state in ipairs(goalStates or {}) do
        if state.visible and state.role=="goal" then return state end
    end
    return nil
end

local function progressText(state)
    local current,required=tonumber(state and state.current),tonumber(state and state.required)
    if current and required and required>0 then
        return tostring(current).."/"..tostring(required)
    end
    return nil
end

function H:Resolve(step,goalStates,facts,navigation)
    local state=currentState(goalStates,navigation)
    if not state then return nil end
    local goal=state.sourceGoal or {}
    local objective=objectiveFor(state,facts)
    local objectiveName=objective and cleanObjectiveName(objective.text) or ""
    local objectiveType=string.lower(tostring(objective and objective.type or ""))
    local target=nearestTarget(step,state)
    local action=tostring(state.action or "")
    local text,kind

    if action=="complete" then
        local name=objectiveName~="" and objectiveName or target
        if objectiveType=="monster" or objectiveType=="player" then
            text="Töte: "..tostring(name~="" and name or "Questgegner");kind="kill"
        elseif objectiveType=="item" or objectiveType=="currency" then
            text="Sammle: "..tostring(name~="" and name or "Questgegenstand");kind="collect"
        elseif objectiveType=="object" then
            text="Interagiere mit: "..tostring(name~="" and name or "Questobjekt");kind="interact"
        elseif objectiveType=="event" or objectiveType=="progressbar" then
            text="Questziel: "..tostring(name~="" and name or objective and objective.text or "Fortschritt");kind="progress"
        elseif target~="" then
            text="Ziel: "..target;kind="objective"
        else
            text="Erledige das aktuelle Questziel";kind="objective"
        end
    elseif action=="collect" or action=="itemcount" then
        text="Sammle: "..tostring(target~="" and target or
            (goal.itemID and ("Gegenstand "..tostring(goal.itemID)) or "Questgegenstand"))
        kind="collect"
    elseif action=="accept" then
        text=target~="" and ("Questgeber: "..target) or "Finde den Questgeber am markierten Ziel"
        kind="npc"
    elseif action=="turnin" then
        text=target~="" and ("Quest abgeben bei: "..target) or "Kehre zum markierten Quest-NPC zurück"
        kind="npc"
    elseif action=="vendor" then
        text=target~="" and ("Händler: "..target) or "Finde den markierten Händler";kind="npc"
    elseif action=="trainer" or action=="train" then
        text=target~="" and ("Trainer: "..target) or "Finde den markierten Trainer";kind="npc"
    elseif action=="tame" then
        text="Zähme: "..tostring(target~="" and target or goal.targetID or "das markierte Ziel");kind="tame"
    elseif action=="goto" or action=="waypoint" then
        text="Reise zum markierten Ziel";kind="travel"
    elseif action=="fly" or action=="fp" or action=="hs" or action=="home" then
        text="Reise weiter: "..tostring(goal.location or goal.args or "folge der Route");kind="travel"
    elseif target~="" then
        text="Ziel: "..target;kind="objective"
    end

    local arrowText=trim(step and step.arrowText or "")
    if arrowText~="" then
        text=(text and text~="") and (text.." · "..arrowText) or arrowText
    end

    local location=locationText(waypointFor(state,navigation,step))
    if location and location~="" and (not text or not string.find(text,location,1,true)) then
        text=(text and text~="") and (text.." · "..location) or location
    end

    local progress=progressText(state)
    if progress and text and not string.find(text,progress,1,true) then
        text=text.." · "..progress
    end

    if not text or trim(text)=="" then return nil end
    return {
        text=trim(text),
        kind=kind or "objective",
        goalID=state.id,
        questID=state.questID,
        targetName=target~="" and target or nil,
        progress=progress,
    }
end
