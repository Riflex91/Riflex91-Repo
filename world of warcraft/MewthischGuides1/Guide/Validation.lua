local addonName, MG = ...

MG.GuideValidation = MG.GuideValidation or {}
local V = MG.GuideValidation

function V:ValidateGuide(guide)
    local issues={errors={},warnings={}}
    if not guide or not guide.id then
        issues.errors[#issues.errors+1]="missing_guide_id"
        return issues
    end
    if #(guide.steps or {})==0 then issues.errors[#issues.errors+1]="empty_guide" end

    for index,step in ipairs(guide.steps or {}) do
        if not step.id then issues.errors[#issues.errors+1]="step_"..index..":missing_id" end
        if step.completeWith and step.completeWithReason=="unresolved_label" then
            issues.warnings[#issues.warnings+1]=step.id..":completewith_unresolved:"..tostring(step.completeWith)
        end
        if step.requires and step.requiresResolved==false then
            issues.warnings[#issues.warnings+1]=step.id..":requires_unresolved:"..tostring(step.requires)
        end
        for _,entry in ipairs(step.entries or {}) do
            if not MG.RestEDXPActionCatalog:IsKnown(entry.action) then
                issues.errors[#issues.errors+1]=entry.id..":unknown_action:"..tostring(entry.action)
            end
            local wp=entry.waypoint
            if wp and not (
                (tonumber(wp.x) and tonumber(wp.y)) or
                (tonumber(wp.worldX) and tonumber(wp.worldY))) then
                issues.warnings[#issues.warnings+1]=entry.id..":invalid_waypoint"
            end
        end
    end
    return issues
end

function V:ValidateAll()
    local summary={guides=0,errors=0,warnings=0,samples={}}
    for _,guide in ipairs(MG.GuideCatalog:Load()) do
        summary.guides=summary.guides+1
        local result=self:ValidateGuide(guide)
        summary.errors=summary.errors+#result.errors
        summary.warnings=summary.warnings+#result.warnings
        for _,value in ipairs(result.errors) do
            if #summary.samples<20 then summary.samples[#summary.samples+1]=value end
        end
        for _,value in ipairs(result.warnings) do
            if #summary.samples<20 then summary.samples[#summary.samples+1]=value end
        end
    end
    if MG.db then
        MG.db.runtime=MG.db.runtime or {}
        MG.db.runtime.validation=MG.Util:Copy(summary)
    end
    return summary
end
