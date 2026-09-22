local addonName, MG = ...

MG.ActionPolicy = MG.ActionPolicy or {}
local P = MG.ActionPolicy

local LABEL = {
    use="Benutzen",
    equip="Ausrüsten",
    vendor="Händler geöffnet",
    trainer="Trainer geöffnet",
    gossipoption="Dialog gewählt",
    deathskip="Route bestätigt",
    bindlocation="Gebunden",
    engrave="Erledigt",
    abandon="Erledigt",
    destroy="Erledigt",
    bankdeposit="Erledigt",
    bankwithdraw="Erledigt",
    macro="Erledigt",
    vehicle="Erledigt",
    tame="Erledigt",
    addquestitem="Erledigt",
    bronzetube="Erledigt",
}

function P:Build(runtime)
    local goal = runtime and runtime.destinationGoal
    if not goal or goal.complete or not goal.possible then return nil end
    local source = goal.sourceGoal or {}
    local action = tostring(goal.action or "")

    local model = {
        goalID=goal.id,
        action=action,
        text=runtime.presentation and runtime.presentation.rows and
            runtime.presentation.rows[1] and runtime.presentation.rows[1].text or action,
        iconItemID=source.itemID,
        iconSpellID=source.spellID,
        manual=goal.manualCompletable,
    }

    if action == "use" and source.itemID and UseItemByName then
        model.buttonLabel="Benutzen"
        model.execute=function()
            pcall(UseItemByName, source.itemID)
            if MG.ActionMemory then MG.ActionMemory:Record("use", source.itemID, {button=true}) end
        end
    elseif action == "equip" and source.itemID and EquipItemByName then
        model.buttonLabel="Ausrüsten"
        model.execute=function()
            pcall(EquipItemByName, source.itemID)
            if MG.ActionMemory then MG.ActionMemory:Record("equip", source.itemID, {button=true}) end
        end
    elseif LABEL[action] or goal.manualCompletable then
        model.buttonLabel=LABEL[action] or "Erledigt"
        model.execute=function()
            if MG.ActionMemory then MG.ActionMemory:MarkManual(goal.id, "action_bar") end
            if MG.RuntimeEngine then MG.RuntimeEngine:Refresh("manual_action") end
            if MG.RefreshUI then MG:RefreshUI() end
        end
    elseif action == "accept" then
        model.buttonLabel=nil
        model.hint="Quest beim NPC annehmen"
    elseif action == "turnin" then
        model.buttonLabel=nil
        model.hint="Quest beim NPC abgeben"
    end

    if not model.buttonLabel and not model.hint and not model.iconItemID and not model.iconSpellID then
        return nil
    end
    return model
end
