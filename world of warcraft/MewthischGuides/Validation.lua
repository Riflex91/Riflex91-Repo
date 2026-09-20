local addonName, MG = ...

MG.Validation = MG.Validation or {}
local V = MG.Validation

local function issue(list, code, message, data)
    list[#list + 1] = {
        code = code,
        message = message,
        data = data,
    }
end

function V:IsCoordinate(value)
    return type(value) == "table" and
        tonumber(value.mapID) ~= nil and
        tonumber(value.x) ~= nil and
        tonumber(value.y) ~= nil and
        tonumber(value.x) >= 0 and tonumber(value.x) <= 1 and
        tonumber(value.y) >= 0 and tonumber(value.y) <= 1
end

function V:ValidateGuide(guide)
    local errors, warnings = {}, {}

    if type(guide) ~= "table" then
        issue(errors, "guide.not_table", "Guide ist keine Tabelle.")
        return false, errors, warnings
    end

    if type(guide.id) ~= "string" or guide.id == "" then
        issue(errors, "guide.id_missing", "Guide-ID fehlt.")
    end

    if type(guide.steps) ~= "table" or #guide.steps == 0 then
        issue(errors, "guide.steps_missing", "Guide besitzt keine Schritte.")
    end

    local ids, orders = {}, {}
    for index, step in ipairs(guide.steps or {}) do
        if type(step) ~= "table" then
            issue(errors, "step.not_table", "Guide-Schritt ist keine Tabelle.", { index = index })
        else
            if type(step.id) ~= "string" or step.id == "" then
                issue(errors, "step.id_missing", "Schritt-ID fehlt.", { index = index })
            elseif ids[step.id] then
                issue(errors, "step.id_duplicate", "Schritt-ID ist doppelt.", { id = step.id })
            else
                ids[step.id] = true
            end

            if not tonumber(step.order) then
                issue(errors, "step.order_missing", "Schritt-Reihenfolge fehlt.", { id = step.id })
            elseif orders[tonumber(step.order)] then
                issue(warnings, "step.order_duplicate", "Schritt-Reihenfolge ist doppelt.", {
                    id = step.id,
                    order = step.order,
                })
            else
                orders[tonumber(step.order)] = true
            end

            if not tonumber(step.questID) then
                issue(errors, "step.quest_missing", "Quest-ID fehlt.", { id = step.id })
            end

            for _, key in ipairs({"acceptCoordinate", "objectiveCoordinate", "turninCoordinate"}) do
                if step[key] ~= nil and not self:IsCoordinate(step[key]) then
                    issue(errors, "step.coordinate_invalid", "Ungültige Guide-Koordinate.", {
                        id = step.id,
                        key = key,
                    })
                end
            end
        end
    end

    return #errors == 0, errors, warnings
end

function V:ValidateAll(guides)
    local report = {
        valid = true,
        guideCount = 0,
        errors = {},
        warnings = {},
    }

    for _, guide in ipairs(guides or {}) do
        report.guideCount = report.guideCount + 1
        local ok, errors, warnings = self:ValidateGuide(guide)
        if not ok then report.valid = false end
        for _, value in ipairs(errors) do report.errors[#report.errors + 1] = value end
        for _, value in ipairs(warnings) do report.warnings[#report.warnings + 1] = value end
    end

    if MG.db then
        MG.db.runtime = MG.db.runtime or {}
        MG.db.runtime.validation = {
            valid = report.valid,
            guideCount = report.guideCount,
            errors = #report.errors,
            warnings = #report.warnings,
        }
    end

    return report
end

function V:GetStatus()
    local value = MG.db and MG.db.runtime and MG.db.runtime.validation or nil
    return value or { valid = false, guideCount = 0, errors = 0, warnings = 0 }
end
