local addonName, MG = ...

MG.RestEDXPParser = MG.RestEDXPParser or {}
local P = MG.RestEDXPParser

local function splitTabs(line)
    local out, start = {}, 1
    while true do
        local pos = string.find(line, "\t", start, true)
        if not pos then
            out[#out + 1] = string.sub(line, start)
            break
        end
        out[#out + 1] = string.sub(line, start, pos - 1)
        start = pos + 1
    end
    return out
end

local function trim(value)
    value = tostring(value or "")
    return value:gsub("^%s+", ""):gsub("%s+$", "")
end

local function appendMeta(meta, key, value)
    if meta[key] == nil then
        meta[key] = value
    elseif type(meta[key]) == "table" then
        meta[key][#meta[key] + 1] = value
    else
        meta[key] = { meta[key], value }
    end
end

function P:Parse()
    if self.cache then return self.cache end
    local guides, currentGuide, currentStep = {}, nil, nil
    local raw = MG.RestEDXPForeverRaw or {}

    local function finishStep()
        if currentGuide and currentStep then
            currentGuide.steps[#currentGuide.steps + 1] = currentStep
        end
        currentStep = nil
    end

    local function finishGuide()
        finishStep()
        if currentGuide then
            currentGuide.rawStepCount = #currentGuide.steps
            guides[#guides + 1] = currentGuide
        end
        currentGuide = nil
    end

    for chunkIndex, chunk in ipairs(raw.chunks or {}) do
        for line in tostring(chunk):gmatch("[^\r\n]+") do
            local fields = splitTabs(line)
            local record = fields[1]

            if record == "G" then
                finishGuide()
                currentGuide = {
                    sourceFile = trim(fields[2]),
                    metadata = {},
                    steps = {},
                    sourceChunk = chunkIndex,
                }
            elseif record == "M" and currentGuide then
                appendMeta(currentGuide.metadata, trim(fields[2]), trim(fields[3]))
            elseif record == "S" and currentGuide then
                finishStep()
                currentStep = {
                    selector = trim(fields[2]),
                    tags = {},
                    actions = {},
                    rawIndex = #currentGuide.steps + 1,
                }
            elseif record == "T" and currentStep then
                currentStep.tags[#currentStep.tags + 1] = {
                    name = trim(fields[2]),
                    value = trim(fields[3]),
                }
            elseif record == "A" and currentStep then
                currentStep.actions[#currentStep.actions + 1] = {
                    kind = trim(fields[2]),
                    args = trim(fields[3]),
                    rawIndex = #currentStep.actions + 1,
                }
            elseif record == "E" then
                finishGuide()
            end
        end
    end
    finishGuide()

    self.cache = guides
    return guides
end

function P:GetSource()
    return MG.RestEDXPForeverRaw and MG.RestEDXPForeverRaw.source or {}
end

function P:GetStats()
    local steps, actions = 0, 0
    for _, guide in ipairs(self:Parse()) do
        steps = steps + #(guide.steps or {})
        for _, step in ipairs(guide.steps or {}) do
            actions = actions + #(step.actions or {})
        end
    end
    return {
        guides = #self:Parse(),
        steps = steps,
        actions = actions,
        source = self:GetSource(),
    }
end
