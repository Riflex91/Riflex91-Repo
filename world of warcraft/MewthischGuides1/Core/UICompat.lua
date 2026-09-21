local addonName, MG = ...

MG.UICompat = MG.UICompat or {}
local C = MG.UICompat

function C:SetSize(region, width, height)
    if not region then return end
    if region.SetSize then
        region:SetSize(width, height)
    else
        if region.SetWidth then region:SetWidth(width) end
        if region.SetHeight then region:SetHeight(height) end
    end
end

function C:SetShown(frame, shown)
    if not frame then return end
    if frame.SetShown then
        frame:SetShown(shown and true or false)
    elseif shown then
        if frame.Show then frame:Show() end
    else
        if frame.Hide then frame:Hide() end
    end
end

function C:SetSolid(texture, r, g, b, a)
    if not texture then return end
    a = a == nil and 1 or a
    if texture.SetColorTexture then
        texture:SetColorTexture(r, g, b, a)
        return
    end

    if texture.SetTexture then
        local ok = pcall(texture.SetTexture, texture, r, g, b, a)
        if ok then return end
        pcall(texture.SetTexture, texture, "Interface\\Buttons\\WHITE8X8")
    end
    if texture.SetVertexColor then
        pcall(texture.SetVertexColor, texture, r, g, b, a)
    end
end

function C:SetClampedToScreen(frame, enabled)
    if frame and frame.SetClampedToScreen then
        pcall(frame.SetClampedToScreen, frame, enabled and true or false)
    end
end

function C:SetWordWrap(fontString, enabled)
    if fontString and fontString.SetWordWrap then
        pcall(fontString.SetWordWrap, fontString, enabled and true or false)
    end
end

function C:SetTextInsets(editBox, left, right, top, bottom)
    if editBox and editBox.SetTextInsets then
        pcall(editBox.SetTextInsets, editBox, left, right, top, bottom)
    end
end

function C:SetFrameStrata(frame, strata)
    if frame and frame.SetFrameStrata then
        pcall(frame.SetFrameStrata, frame, strata)
    end
end

function C:SafeFont(preferred, fallback)
    if _G and _G[preferred] then return preferred end
    return fallback or "GameFontNormal"
end
