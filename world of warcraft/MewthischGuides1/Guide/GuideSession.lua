local addonName, MG = ...

MG.GuideSession = MG.GuideSession or {}
local S = MG.GuideSession

function S:Create(guide, startIndex)
    if not guide then return nil, "missing_guide" end
    local session = {
        guide = guide,
        guideID = guide.id,
        currentIndex = math.max(1, math.min(tonumber(startIndex) or 1, #guide.steps)),
        stickyIndexes = {},
    }
    self:SyncStickies(session)
    return session
end

function S:SyncStickies(session)
    session.stickyIndexes = session.stickyIndexes or {}
    for index = 1, session.currentIndex do
        local step = session.guide.steps[index]
        if step and step.sticky then session.stickyIndexes[index] = true end
    end
end

function S:GetCurrentStep(session)
    return session and session.guide and session.guide.steps[session.currentIndex] or nil
end

function S:GetStickySteps(session)
    local out = {}
    if not session or not session.guide then return out end
    for index in pairs(session.stickyIndexes or {}) do
        if index ~= session.currentIndex then
            local step = session.guide.steps[index]
            if step then out[#out + 1] = step end
        end
    end
    table.sort(out, function(a,b) return (a.order or 0) < (b.order or 0) end)
    return out
end

function S:SetIndex(session, index)
    if not session or not session.guide then return false end
    index = math.max(1, math.min(tonumber(index) or 1, #session.guide.steps))
    session.currentIndex = index
    self:SyncStickies(session)
    return true
end

function S:Move(session, delta)
    return self:SetIndex(session, (session.currentIndex or 1) + (tonumber(delta) or 0))
end

function S:PruneCompletedStickies(session, stickyRuntime)
    if not session then return end
    for _, entry in ipairs(stickyRuntime or {}) do
        if entry.stepState and entry.stepState.complete then
            local index = entry.step and entry.step.rawStepIndex
            if index then session.stickyIndexes[index] = nil end
        end
    end
end
