local addonName, MGR = ...

local lastProfileSignature

local function buildTalentProfile()
    local _, classFile, classID = UnitClass("player")
    local profile = {
        class = classFile,
        classID = classID,
        trees = {},
        learnedTalents = {},
        inferredSpecID = nil,
        inferredSpecName = nil,
        confidence = "none",
    }

    local specApi = C_SpecializationInfo
    local count = 0
    if specApi and specApi.GetNumSpecializationsForClassID and classID then
        local ok, value = pcall(specApi.GetNumSpecializationsForClassID, classID)
        if ok and type(value) == "number" then count = value end
    end

    if count == 0 and GetNumTalentTabs then
        local ok, value = pcall(GetNumTalentTabs)
        if ok and type(value) == "number" then count = value end
    end

    local bestPoints, bestIndex, tied = -1, nil, false

    for index = 1, count do
        local tree
        if specApi and specApi.GetSpecializationInfo then
            local ok, specID, name, description, icon, role, primaryStat, pointsSpent, background, previewPointsSpent, isUnlocked =
                pcall(specApi.GetSpecializationInfo, index, false, false, nil, UnitSex("player"), nil, classID)

            if ok and (specID or name) then
                tree = {
                    index = index,
                    specID = specID,
                    name = name,
                    role = role,
                    primaryStat = primaryStat,
                    pointsSpent = tonumber(pointsSpent) or 0,
                    isUnlocked = isUnlocked,
                }
            end
        end

        if not tree and GetTalentTabInfo then
            local ok, specID, name, description, icon, pointsSpent, background, previewPointsSpent, isUnlocked =
                pcall(GetTalentTabInfo, index)
            if ok and (specID or name) then
                tree = {
                    index = index,
                    specID = specID,
                    name = name,
                    pointsSpent = tonumber(pointsSpent) or 0,
                    isUnlocked = isUnlocked,
                }
            end
        end

        if tree then
            profile.trees[#profile.trees + 1] = tree
            local points = tree.pointsSpent or 0
            if points > bestPoints then
                bestPoints, bestIndex, tied = points, #profile.trees, false
            elseif points == bestPoints then
                tied = true
            end

            if specApi and specApi.GetTalentInfo then
                local emptyRun = 0
                for talentIndex = 1, 200 do
                    local ok, info = pcall(specApi.GetTalentInfo, {
                        specializationIndex = index,
                        talentIndex = talentIndex,
                    })

                    if ok and info and (info.talentID or info.spellID or info.name) then
                        emptyRun = 0
                        local rank = tonumber(info.rank) or 0
                        if rank > 0 or info.known or info.selected then
                            profile.learnedTalents[#profile.learnedTalents + 1] = {
                                specializationIndex = index,
                                talentIndex = talentIndex,
                                talentID = info.talentID,
                                spellID = info.spellID,
                                name = info.name,
                                tier = info.tier,
                                column = info.column,
                                rank = rank,
                                maxRank = info.maxRank,
                                known = info.known,
                                selected = info.selected,
                            }
                        end
                    else
                        emptyRun = emptyRun + 1
                        if talentIndex > 40 and emptyRun >= 30 then break end
                    end
                end
            end
        end
    end

    if bestIndex and bestPoints > 0 and not tied then
        local best = profile.trees[bestIndex]
        profile.inferredSpecID = best.specID
        profile.inferredSpecName = best.name
        profile.confidence = "high"
    elseif bestIndex and bestPoints > 0 then
        profile.confidence = "low"
    end

    return profile
end

local function signature(profile)
    local parts = { tostring(profile.classID), tostring(profile.inferredSpecID), tostring(profile.confidence) }
    for _, tree in ipairs(profile.trees) do
        parts[#parts + 1] = table.concat({
            tostring(tree.index), tostring(tree.specID), tostring(tree.pointsSpent)
        }, ":")
    end
    for _, talent in ipairs(profile.learnedTalents) do
        parts[#parts + 1] = table.concat({
            tostring(talent.specializationIndex), tostring(talent.talentID or talent.spellID),
            tostring(talent.rank)
        }, ":")
    end
    return table.concat(parts, "|")
end

function MGR:RecordTalentProfile(reason)
    local profile = buildTalentProfile()
    local current = signature(profile)
    if current == lastProfileSignature and reason ~= "login" then return end

    lastProfileSignature = current
    self:Record("player.build_profile", profile.inferredSpecID, {
        reason = reason,
        profile = profile,
        position = self:GetPosition(),
    }, "gameplay-api")
end

local frame = CreateFrame("Frame")
for _, event in ipairs({
    "PLAYER_LOGIN",
    "PLAYER_TALENT_UPDATE",
    "CHARACTER_POINTS_CHANGED",
    "PLAYER_LEVEL_UP",
}) do
    frame:RegisterEvent(event)
end

frame:SetScript("OnEvent", function(_, event)
    if event == "PLAYER_LOGIN" then
        C_Timer.After(3, function() MGR:RecordTalentProfile("login") end)
    else
        C_Timer.After(0.5, function() MGR:RecordTalentProfile(event) end)
    end
end)
