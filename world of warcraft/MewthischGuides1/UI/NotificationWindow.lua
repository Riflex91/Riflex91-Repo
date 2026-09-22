local addonName, MG = ...

MG.NotificationWindow = MG.NotificationWindow or {}
local N = MG.NotificationWindow
local UI = MG.UICompat

local function solid(parent,layer,r,g,b,a)
    local t=parent:CreateTexture(nil,layer or "BACKGROUND");UI:SetSolid(t,r,g,b,a);return t
end
local function shadow(font)
    if font.SetShadowColor then font:SetShadowColor(0,0,0,1) end
    if font.SetShadowOffset then font:SetShadowOffset(1,-1) end
end
local function button(parent,text,width,callback)
    local b=CreateFrame("Button",nil,parent);UI:SetSize(b,width,24)
    local bg=solid(b,"BACKGROUND",.10,.07,.03,1);bg:SetAllPoints()
    local l=b:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontNormal","GameFontNormal"))
    l:SetPoint("CENTER");l:SetText(text);shadow(l);if l.SetTextColor then l:SetTextColor(1,.74,.12) end
    b:SetScript("OnEnter",function() UI:SetSolid(bg,.19,.11,.03,1) end)
    b:SetScript("OnLeave",function() UI:SetSolid(bg,.10,.07,.03,1) end)
    b:SetScript("OnClick",callback);b.label=l;return b
end

function N:CreateToast()
    if self.toast then return self.toast end
    local frame=CreateFrame("Frame","MewthischGuides1NotificationToast",UIParent)
    UI:SetSize(frame,420,86);frame:SetPoint("TOP",UIParent,"TOP",0,-95)
    UI:SetFrameStrata(frame,"TOOLTIP");UI:SetClampedToScreen(frame,true)
    local bg=solid(frame,"BACKGROUND",.012,.015,.02,.98);bg:SetAllPoints()
    local top=solid(frame,"ARTWORK",.95,.56,.06,1);top:SetPoint("TOPLEFT");top:SetPoint("TOPRIGHT");top:SetHeight(2)
    local title=frame:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontNormal","GameFontNormal"))
    title:SetPoint("TOPLEFT",12,-12);title:SetPoint("RIGHT",-82,0);title:SetJustifyH("LEFT");shadow(title)
    if title.SetTextColor then title:SetTextColor(1,.74,.1) end
    local message=frame:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontHighlightSmall","GameFontNormalSmall"))
    message:SetPoint("TOPLEFT",12,-36);message:SetPoint("RIGHT",-12,0);message:SetJustifyH("LEFT");UI:SetWordWrap(message,true);shadow(message)
    local archive=button(frame,"ARCHIV",64,function() frame:Hide();N:Toggle(true) end);archive:SetPoint("TOPRIGHT",-8,-8)
    frame.elapsed=0
    frame:SetScript("OnUpdate",function(self,delta)
        if not self:IsShown() then return end
        self.elapsed=self.elapsed+(tonumber(delta) or 0)
        local duration=tonumber(MG:EnsureDB().settings.notificationDuration) or 6
        if self.elapsed>=duration then self:Hide() end
    end)
    self.toast=frame;self.toastTitle=title;self.toastMessage=message
    frame:Hide();return frame
end

function N:Create()
    if self.frame then return self.frame end
    self:CreateToast()
    local frame=CreateFrame("Frame","MewthischGuides1Notifications",UIParent)
    UI:SetSize(frame,560,450);frame:SetPoint("CENTER",0,30)
    UI:SetFrameStrata(frame,"FULLSCREEN_DIALOG");UI:SetClampedToScreen(frame,true)
    frame:SetMovable(true);frame:EnableMouse(true)
    if frame.RegisterForDrag then frame:RegisterForDrag("LeftButton") end
    frame:SetScript("OnDragStart",function(self) if self.StartMoving then self:StartMoving() end end)
    frame:SetScript("OnDragStop",function(self) if self.StopMovingOrSizing then self:StopMovingOrSizing() end end)
    local bg=solid(frame,"BACKGROUND",.012,.015,.02,1);bg:SetAllPoints()
    local head=solid(frame,"BORDER",.035,.04,.05,1);head:SetPoint("TOPLEFT",1,-1);head:SetPoint("TOPRIGHT",-1,-1);head:SetHeight(38)
    local top=solid(frame,"ARTWORK",.95,.56,.06,1);top:SetPoint("TOPLEFT",1,-1);top:SetPoint("TOPRIGHT",-1,-1);top:SetHeight(1)
    local title=frame:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontNormalLarge","GameFontNormal"))
    title:SetPoint("TOPLEFT",14,-11);title:SetText("Meldungen");shadow(title);if title.SetTextColor then title:SetTextColor(1,.74,.1) end
    local close=button(frame,"x",26,function() frame:Hide() end);close:SetPoint("TOPRIGHT",-7,-7)

    local rows={}
    for i=1,11 do
        local row=CreateFrame("Frame",nil,frame);UI:SetSize(row,524,31);row:SetPoint("TOPLEFT",18,-52-(i-1)*33)
        local rowbg=solid(row,"BACKGROUND",.03,.035,.045,.92);rowbg:SetAllPoints()
        local text=row:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontHighlightSmall","GameFontNormalSmall"))
        text:SetPoint("LEFT",8,0);text:SetPoint("RIGHT",-8,0);text:SetJustifyH("LEFT");UI:SetWordWrap(text,false);shadow(text)
        rows[i]={frame=row,text=text}
    end
    local clear=button(frame,"ARCHIV LEEREN",116,function() if MG.NotificationCenter then MG.NotificationCenter:Clear() end;N:Refresh() end)
    clear:SetPoint("BOTTOMLEFT",14,14)
    local settings=button(frame,"EINSTELLUNGEN",116,function() if MG.SettingsWindow then MG.SettingsWindow.page="notifications";MG.SettingsWindow:Toggle(true) end end)
    settings:SetPoint("LEFT",clear,"RIGHT",6,0)

    self.frame=frame;self.rows=rows
    frame:SetScript("OnShow",function()
        if MG.NotificationCenter then MG.NotificationCenter:MarkAllRead() end
        N:Refresh()
    end)
    frame:Hide()
    if MG.ThemeManager then MG.ThemeManager:ApplyAll() end
    return frame
end

function N:ShowToast(entry)
    local frame=self:CreateToast()
    self.toastTitle:SetText(tostring(entry and entry.title or "Mewthisch Guides"))
    self.toastMessage:SetText(tostring(entry and entry.message or ""))
    frame.elapsed=0;frame:Show()
    if MG.ThemeManager then MG.ThemeManager:ApplyAll() end
end

function N:Refresh()
    self:Create()
    local history=MG.NotificationCenter and MG.NotificationCenter:GetHistory() or {}
    local cursor=#history
    for i,row in ipairs(self.rows) do
        local entry=history[cursor-i+1]
        if entry then
            row.frame:Show()
            local prefix=entry.unread and "|cffffb000NEU|r  " or ""
            row.text:SetText(prefix..tostring(entry.title or "").."  |cff888888- "..tostring(entry.message or "").."|r")
        else row.frame:Hide() end
    end
end

function N:Toggle(force)
    local frame=self:Create()
    local show=force;if show==nil then show=not frame:IsShown() end
    if show then frame:Show();self:Refresh() else frame:Hide() end
end
