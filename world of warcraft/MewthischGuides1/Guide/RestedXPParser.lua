local addonName, MG = ...

MG.RestedXPParser = MG.RestedXPParser or {}
local P = MG.RestedXPParser

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

local function addMetadata(metadata, key, value)
    if metadata[key] == nil then
        metadata[key] = value
    elseif type(metadata[key]) == "table" then
        metadata[key][#metadata[key] + 1] = value
    else
        metadata[key] = { metadata[key], value }
    end
end

local function finishGuide(guides, guide)
    if not guide then return nil end
    if guide.sourceFile and #(guide.steps or {}) > 0 then
        guides[#guides + 1] = guide
    end
    return nil
end

function P:Parse(force)
    if self.guides and not force then return self.guides end
    local source = MG.RestEDXPForeverRaw
    if not source or type(source.chunks) ~= "table" then
        MG:Log("ERROR", "rxp.data_missing", "RestedXP-Datensätze wurden nicht geladen.")
        self.guides = {}
        return self.guides
    end

    local guides, guide, step = {}, nil, nil
    local rawLine = 0

    for chunkIndex, chunk in ipairs(source.chunks) do
        for line in string.gmatch(chunk or "", "[^\r\n]+") do
            rawLine = rawLine + 1
            local fields = splitTabs(line)
            local record = fields[1]

            if record == "G" then
                guide = finishGuide(guides, guide)
                guide = {
                    sourceFile = fields[2],
                    metadata = {},
                    steps = {},
                    raw = { chunk = chunkIndex, line = rawLine },
                }
                step = nil
            elseif record == "M" and guide then
                addMetadata(guide.metadata, fields[2], fields[3] or "")
            elseif record == "S" and guide then
                step = {
                    selector = fields[2] or "",
                    tags = {},
                    actions = {},
                    raw = { chunk = chunkIndex, line = rawLine },
                }
                guide.steps[#guide.steps + 1] = step
            elseif record == "T" and step then
                step.tags[#step.tags + 1] = {
                    name = fields[2] or "",
                    value = fields[3] or "",
                    rawLine = rawLine,
                }
            elseif record == "A" and step then
                step.actions[#step.actions + 1] = {
                    kind = fields[2] or "",
                    args = fields[3] or "",
                    rawLine = rawLine,
                }
            elseif record == "E" then
                guide = finishGuide(guides, guide)
                step = nil
            elseif record ~= "" then
                MG:Log("WARN", "rxp.unknown_record", "Unbekannter RestedXP-Datensatz.", {
                    record = record, line = rawLine, chunk = chunkIndex,
                })
            end
        end
    end
    finishGuide(guides, guide)

    self.guides = guides
    return guides
end

function P:GetStats()
    local guides = self:Parse()
    local steps, actions, tags = 0, 0, 0
    for _, guide in ipairs(guides) do
        steps = steps + #(guide.steps or {})
        for _, step in ipairs(guide.steps or {}) do
            actions = actions + #(step.actions or {})
            tags = tags + #(step.tags or {})
        end
    end
    return {
        guides = #guides,
        steps = steps,
        actions = actions,
        tags = tags,
        sourceCommit = MG.RestEDXPForeverRaw and MG.RestEDXPForeverRaw.source and
            MG.RestEDXPForeverRaw.source.commit or nil,
    }
end
