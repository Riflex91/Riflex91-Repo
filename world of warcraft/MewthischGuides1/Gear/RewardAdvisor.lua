local addonName, MG = ...

MG.RewardAdvisor = MG.RewardAdvisor or {}
local R = MG.RewardAdvisor
R.current = nil

function R:Refresh()
    local settings = MG.db and MG.db.settings or {}
    if settings.showGearAdvisor == false then
        self.current=nil
        return nil
    end

    local choices = 0
    if GetNumQuestChoices then
        local ok, value = pcall(GetNumQuestChoices)
        if ok then choices=tonumber(value) or 0 end
    end
    if choices <= 0 then
        self.current=nil
        return nil
    end

    local rows, best = {}, nil
    for index=1,choices do
        local link
        if GetQuestItemLink then
            local ok,value=pcall(GetQuestItemLink,"choice",index)
            if ok then link=value end
        end
        local row=MG.GearScore:CompareToEquipped(link)
        row.index=index
        rows[#rows+1]=row
        if row.upgrade and (
           not best or row.delta>best.delta or
           (row.delta==best.delta and row.score>best.score)) then
            best=row
        end
    end

    self.current={
        choices=rows,
        recommended=best,
        reason=best and "safe_positive_item_level_delta" or "no_safe_upgrade",
        autoSelection=false,
    }
    return self.current
end

function R:Get()
    return self.current
end
