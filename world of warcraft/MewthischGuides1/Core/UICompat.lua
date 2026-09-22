local addonName, MG = ...

MG.UICompat = MG.UICompat or {}
local C = MG.UICompat

local function near(a,b,tolerance)
    return math.abs((tonumber(a) or 0)-(tonumber(b) or 0)) <= (tolerance or .025)
end

local function nearColor(r,g,b,rr,gg,bb,tolerance)
    return near(r,rr,tolerance) and near(g,gg,tolerance) and near(b,bb,tolerance)
end

local function solidRole(r,g,b)
    if nearColor(r,g,b,.008,.010,.014,.025) or
       nearColor(r,g,b,.012,.015,.020,.025) then return "background" end
    if nearColor(r,g,b,.028,.032,.040,.025) or
       nearColor(r,g,b,.035,.040,.050,.025) then return "header" end
    if nearColor(r,g,b,.10,.07,.03,.025) or
       nearColor(r,g,b,.03,.035,.045,.025) or
       nearColor(r,g,b,.05,.05,.05,.02) then return "panel" end
    if nearColor(r,g,b,.19,.11,.03,.035) or
       nearColor(r,g,b,.20,.12,.03,.035) or
       nearColor(r,g,b,.11,.08,.03,.035) or
       nearColor(r,g,b,.16,.10,.03,.035) then return "panelHover" end
    if nearColor(r,g,b,.95,.56,.06,.04) or
       nearColor(r,g,b,.96,.57,.05,.04) or
       nearColor(r,g,b,1,.62,.06,.04) then return "accent" end
    if nearColor(r,g,b,.78,.47,.08,.04) or
       nearColor(r,g,b,.82,.49,.07,.04) or
       nearColor(r,g,b,.52,.34,.10,.04) then return "border" end
    if nearColor(r,g,b,.18,.78,.32,.04) then return "progress" end
    return nil
end

local function mixed(a,b,ratio)
    ratio=ratio or .2
    return {
        a[1]*(1-ratio)+b[1]*ratio,
        a[2]*(1-ratio)+b[2]*ratio,
        a[3]*(1-ratio)+b[3]*ratio,
        (a[4] or 1)*(1-ratio)+(b[4] or 1)*ratio,
    }
end

local function themeColor(theme,role,fallback)
    if not theme or not role then return fallback end
    if role=="panelHover" then
        return theme.panelHover or mixed(theme.panel or fallback,theme.accent or fallback,.28)
    end
    return theme[role] or fallback
end

local function rawSolid(texture,value)
    if not texture or not value then return end
    local r,g,b,a=value[1],value[2],value[3],value[4]
    a=a==nil and 1 or a
    if texture.SetColorTexture then
        local ok=pcall(texture.SetColorTexture,texture,r,g,b,a)
        if ok then return end
    end
    if texture.SetTexture then
        local ok=pcall(texture.SetTexture,texture,r,g,b,a)
        if ok then return end
        pcall(texture.SetTexture,texture,"Interface\\Buttons\\WHITE8X8")
    end
    if texture.SetVertexColor then pcall(texture.SetVertexColor,texture,r,g,b,a) end
end

function C:SetSize(region,width,height)
    if not region then return end
    if region.SetSize then region:SetSize(width,height)
    else
        if region.SetWidth then region:SetWidth(width) end
        if region.SetHeight then region:SetHeight(height) end
    end
end

function C:SetShown(frame,shown)
    if not frame then return end
    if frame.SetShown then frame:SetShown(shown and true or false)
    elseif shown then if frame.Show then frame:Show() end
    else if frame.Hide then frame:Hide() end end
end

function C:SetSolid(texture,r,g,b,a)
    if not texture then return end
    local original={r,g,b,a==nil and 1 or a}
    local role=solidRole(r,g,b)
    if role then texture._mgThemeRole=role end
    texture._mgBaseColor=texture._mgBaseColor or original
    local theme=MG.ThemeManager and MG.ThemeManager.GetCurrent and
        select(1,MG.ThemeManager:GetCurrent()) or nil
    rawSolid(texture,themeColor(theme,texture._mgThemeRole,original))
end

function C:SetThemeRole(region,role)
    if not region then return end
    region._mgThemeRole=role
    local theme=MG.ThemeManager and MG.ThemeManager.GetCurrent and
        select(1,MG.ThemeManager:GetCurrent()) or nil
    if theme then rawSolid(region,themeColor(theme,role,region._mgBaseColor or {1,1,1,1})) end
end

function C:SetTextRole(font,role)
    if not font then return end
    font._mgThemeTextRole=role
end

local function textRole(font)
    if font._mgThemeTextRole then return font._mgThemeTextRole end
    if not font.GetTextColor then return nil end
    local ok,r,g,b=pcall(font.GetTextColor,font)
    if not ok then return nil end
    if r and g and b then
        if r>.80 and g>.38 and b<.42 then return "title" end
        if math.abs(r-g)<.12 and math.abs(g-b)<.12 then
            if r>.82 then return "text" end
            if r>.35 and r<.82 then return "muted" end
        end
    end
    return nil
end

local function applyFont(font,theme)
    local role=textRole(font)
    if role then font._mgThemeTextRole=role end
    local color=role and theme and theme[role]
    if color and font.SetTextColor then
        pcall(font.SetTextColor,font,color[1],color[2],color[3],color[4] or 1)
    end
    if theme and theme.font and font.GetFont and font.SetFont then
        local ok,current,size,flags=pcall(font.GetFont,font)
        if ok and size then pcall(font.SetFont,font,theme.font,size,flags) end
    end
end

function C:ApplyThemeTree(frame,theme,seen)
    if not frame or not theme then return end
    seen=seen or {}
    if seen[frame] then return end
    seen[frame]=true

    if frame._mgThemeRole then
        rawSolid(frame,themeColor(theme,frame._mgThemeRole,frame._mgBaseColor or {1,1,1,1}))
    end

    if frame.GetRegions then
        local regions={frame:GetRegions()}
        for _,region in ipairs(regions) do
            if region then
                if region._mgThemeRole then
                    rawSolid(region,themeColor(theme,region._mgThemeRole,
                        region._mgBaseColor or {1,1,1,1}))
                end
                local objectType=region.GetObjectType and region:GetObjectType() or nil
                if objectType=="FontString" then applyFont(region,theme) end
            end
        end
    end

    if frame.GetChildren then
        local children={frame:GetChildren()}
        for _,child in ipairs(children) do self:ApplyThemeTree(child,theme,seen) end
    end
end

function C:SetClampedToScreen(frame,enabled)
    if frame and frame.SetClampedToScreen then
        pcall(frame.SetClampedToScreen,frame,enabled and true or false)
    end
end

function C:SetWordWrap(fontString,enabled)
    if fontString and fontString.SetWordWrap then
        pcall(fontString.SetWordWrap,fontString,enabled and true or false)
    end
end

function C:SetTextInsets(editBox,left,right,top,bottom)
    if editBox and editBox.SetTextInsets then
        pcall(editBox.SetTextInsets,editBox,left,right,top,bottom)
    end
end

function C:SetFrameStrata(frame,strata)
    if frame and frame.SetFrameStrata then pcall(frame.SetFrameStrata,frame,strata) end
end

function C:SafeFont(preferred,fallback)
    if _G and _G[preferred] then return preferred end
    return fallback or "GameFontNormal"
end
