local addonName, MG = ...

MG.PresentationResolver = MG.PresentationResolver or {}
local P = MG.PresentationResolver
local questTitleCache = {}

function P:CleanText(value)
    value=tostring(value or "")
    value=value:gsub("\\n","\n")
    value=value:gsub("|cRXP_[%w_]+_","")
    value=value:gsub("|cRXP_[%w_]+","")
    value=value:gsub("|r","")
    value=value:gsub("||","|")
    return MG.Util:Trim(value)
end

local function apiQuestTitle(questID)
    questID=tonumber(questID)
    if not questID then return nil end
    if questTitleCache[questID]~=nil then return questTitleCache[questID] or nil end
    local title
    if C_QuestLog and C_QuestLog.GetTitleForQuestID then
        local ok,value=pcall(C_QuestLog.GetTitleForQuestID,questID)
        if ok and type(value)=="string" and value~="" then title=value end
    end
    questTitleCache[questID]=title or false
    return title
end

local function questTitle(state,facts)
    local quest=state.questID and facts and facts.quests and facts.quests[state.questID]
    return quest and quest.title or apiQuestTitle(state.questID) or
        (state.questID and ("Quest "..tostring(state.questID)) or nil)
end

local function objectiveText(state,facts)
    local quest=state.questID and facts and facts.quests and facts.quests[state.questID]
    local objective=quest and quest.objectives and state.objectiveIndex and
        quest.objectives[state.objectiveIndex]
    return objective and objective.text or nil
end

local function targetName(state)
    local goal=state.sourceGoal or {}
    return goal.targetName or state.targetName
end

local function rowText(state,facts)
    local goal=state.sourceGoal or {}
    local action=state.action
    local title=questTitle(state,facts)
    local target=targetName(state)

    if action=="accept" then return 'Nimm "'..tostring(title or "Quest")..'" an' end
    if action=="acceptmultiple" then
        return "Nimm "..tostring(#(goal.questIDs or {})).." Quests an"
    end
    if action=="turnin" then return 'Gib "'..tostring(title or "Quest")..'" ab' end
    if action=="complete" then
        return objectiveText(state,facts) or
            ('Schließe Questziel '..tostring(state.objectiveIndex or "")..
             ' von "'..tostring(title or "Quest")..'" ab')
    end
    if action=="collect" then
        return "Sammle "..tostring(state.required or "")..
            (state.required and "x " or "")..
            tostring(target or (state.itemID and ("Item "..state.itemID) or "Gegenstand"))
    end
    if action=="goto" or action=="waypoint" then return "Gehe zum markierten Punkt" end
    if action=="target" or action=="mob" or action=="unitscan" then return tostring(target or "Ziel") end
    if action=="train" then
        return "Trainiere"..(target and (" bei "..target) or "")
    end
    if action=="trainer" then return "Sprich mit dem Trainer"..(target and (" "..target) or "") end
    if action=="vendor" then return "Besuche den Händler"..(target and (" "..target) or "") end
    if action=="fly" then return "Fliege nach "..tostring(goal.location or goal.args or "") end
    if action=="fp" then return "Nutze/lerne Flugpunkt "..tostring(goal.location or goal.args or "") end
    if action=="hs" then return goal.location and goal.location~="" and
        ("Benutze den Ruhestein nach "..goal.location) or "Benutze deinen Ruhestein" end
    if action=="home" then return "Reise zum Heimatpunkt"..((goal.location and goal.location~="") and (" "..goal.location) or "") end
    if action=="deathskip" then return "Folge der markierten Geist-/Todesroute" end
    if action=="zone" or action=="subzone" or action=="zoneskip" or action=="subzoneskip" then
        return "Reise nach "..tostring(goal.location or goal.args or "")
    end
    if action=="xp" then return "Erreiche das Erfahrungsziel "..tostring(goal.args or "") end
    if action=="money" then return "Erreiche das Goldziel "..tostring(goal.args or "") end
    if action=="skill" then
        local t=goal.skillTarget or {}
        return "Fertigkeit "..tostring(t.name or "").." "..tostring(t.operator or ">=").." "..tostring(t.amount or "")
    end
    if action=="reputation" then
        local t=goal.reputationTarget or {}
        return "Rufziel bei Fraktion "..tostring(t.factionID or "")
    end
    if action=="aura" then
        return (goal.auraWanted and "Erhalte " or "Entferne ").."Aura "..tostring(goal.auraSpellID or "")
    end
    if action=="timer" then
        return "Warte "..tostring(goal.timerSeconds or "?").."s"..
            (goal.timerLabel and (" - "..goal.timerLabel) or "")
    end
    if action=="equip" then
        return goal.itemID and ("Rüste Item "..tostring(goal.itemID).." aus") or "Rüste den Gegenstand aus"
    end
    if action=="use" then return "Benutze Item "..tostring(goal.itemID or "") end
    if action=="cast" or action=="usespell" then return "Wirke Zauber "..tostring(goal.spellID or "") end
    if action=="bindlocation" then return "Setze deinen Ruhestein" end
    if action=="gossipoption" then return "Wähle die markierte Dialogoption" end
    if action=="bankdeposit" then return "Lagere die markierten Gegenstände ein" end
    if action=="bankwithdraw" then return "Nimm die markierten Gegenstände aus der Bank" end
    if action=="abandon" then return "Brich die markierte Quest ab" end
    if action=="destroy" then return "Zerstöre den markierten Gegenstand" end
    if action=="engrave" then return "Führe die Gravur durch" end
    if action=="tame" then return "Zähme "..tostring(target or goal.targetID or "das Ziel") end
    if action=="macro" then return "Führe Aktion "..tostring(goal.macroName or "Makro").." aus" end
    if action=="vehicle" then return "Benutze das Fahrzeug" end

    local definition=MG.RestEDXPActionCatalog and MG.RestEDXPActionCatalog:Get(action)
    if definition then
        return definition.label..((goal.args and goal.args~="") and (": "..goal.args) or "")
    end
    return tostring(action or "Guide-Ziel")
end

function P:GoalRow(state,facts,source)
    local text=self:CleanText(rowText(state,facts))
    local progress
    if state.current~=nil or state.required~=nil then
        local current=tostring(state.current or 0)
        local required=tostring(state.required or "?")
        local pattern=current.."%s*/%s*"..required
        if not string.find(text,pattern) then progress=current.." / "..required end
    end
    return {
        id=state.id,
        source=source or "step",
        status=state.status,
        text=text,
        progress=progress,
        passive=state.passive,
        optional=state.optional,
        warning=not state.completionKnown and not state.passive,
        manualCompletable=state.manualCompletable,
        explanation=state.explanation,
        navigated=false,
    }
end

function P:Build(step,goalStates,stickyRuntime,facts,navigation)
    local projection={
        stepID=step and step.id or nil,
        arrowText=self:CleanText(step and step.arrowText or ""),
        mapHint=step and step.mapHint or nil,
        rows={},
        stickies={},
    }
    local destinationID=navigation and navigation.goalState and navigation.goalState.id

    for _,state in ipairs(goalStates or {}) do
        if state.visible then
            local row=self:GoalRow(state,facts,"step")
            row.navigated=row.id==destinationID
            projection.rows[#projection.rows+1]=row
        end
    end

    for _,sticky in ipairs(stickyRuntime or {}) do
        local block={stepID=sticky.step.id,label=sticky.step.label,rows={}}
        for _,state in ipairs(sticky.goalStates or {}) do
            if state.visible then
                local row=self:GoalRow(state,facts,"sticky")
                row.navigated=row.id==destinationID
                block.rows[#block.rows+1]=row
            end
        end
        if #block.rows>0 then projection.stickies[#projection.stickies+1]=block end
    end
    return projection
end
