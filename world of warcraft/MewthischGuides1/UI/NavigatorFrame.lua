local addonName, MG = ...

MG.NavigatorFrame = MG.NavigatorFrame or {}
local N = MG.NavigatorFrame
local UI = MG.UICompat
local UPDATE_INTERVAL = 0.06
local DEFAULT_TEXTURE_ZERO_OFFSET = -math.pi / 2

local function shadow(font)
    if font.SetShadowColor then font:SetShadowColor(0,0,0,1) end
    if font.SetShadowOffset then font:SetShadowOffset(1,-1) end
end

local function findNavigatedRow(runtime)
    for _,candidate in ipairs(runtime and runtime.presentation and runtime.presentation.rows or {}) do
        if candidate.navigated then return candidate end
    end
    for _,sticky in ipairs(runtime and runtime.presentation and runtime.presentation.stickies or {}) do
        for _,candidate in ipairs(sticky.rows or {}) do
            if candidate.navigated then return candidate end
        end
    end
    return nil
end

local function savePosition(frame)
    if not MG.db or not frame.GetCenter or not UIParent or not UIParent.GetCenter then return end
    local x,y=frame:GetCenter();local ux,uy=UIParent:GetCenter()
    if x and y and ux and uy then
        MG.db.ui.navigatorX=x-ux;MG.db.ui.navigatorY=y-uy
    end
end

function N:ResetPosition()
    local frame=self:Create()
    if frame.ClearAllPoints then frame:ClearAllPoints() end
    frame:SetPoint("CENTER",UIParent,"CENTER",330,210)
    if MG.db and MG.db.ui then MG.db.ui.navigatorX=nil;MG.db.ui.navigatorY=nil end
end

local function applyPosition(frame)
    local x=MG.db and MG.db.ui and tonumber(MG.db.ui.navigatorX)
    local y=MG.db and MG.db.ui and tonumber(MG.db.ui.navigatorY)
    if frame.ClearAllPoints then frame:ClearAllPoints() end
    if x and y then frame:SetPoint("CENTER",UIParent,"CENTER",x,y)
    else frame:SetPoint("CENTER",UIParent,"CENTER",330,210) end
end

function N:Create()
    if self.frame then return self.frame end

    local frame=CreateFrame("Frame","MewthischGuides1Navigator",UIParent)
    UI:SetSize(frame,170,118)
    UI:SetFrameStrata(frame,"HIGH");UI:SetClampedToScreen(frame,true)
    frame:SetMovable(true);frame:EnableMouse(true);applyPosition(frame)
    if frame.RegisterForDrag then frame:RegisterForDrag("LeftButton") end
    frame:SetScript("OnDragStart",function(self)
        local settings=MG.db and MG.db.settings or {}
        if settings.navigatorLocked then return end
        if not (InCombatLockdown and InCombatLockdown()) and self.StartMoving then self:StartMoving() end
    end)
    frame:SetScript("OnDragStop",function(self)
        if self.StopMovingOrSizing then self:StopMovingOrSizing() end
        savePosition(self)
    end)

    local glow=frame:CreateTexture(nil,"BACKGROUND")
    glow:SetPoint("TOP",0,2);UI:SetSize(glow,76,76);UI:SetSolid(glow,0,0,0,.18)

    local arrow=frame:CreateTexture(nil,"ARTWORK")
    arrow:SetTexture("Interface\\Minimap\\MinimapArrow")
    UI:SetSize(arrow,64,64);arrow:SetPoint("TOP",0,7)

    local unavailable=frame:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontNormalLarge","GameFontNormal"))
    unavailable:SetPoint("TOP",0,-9);unavailable:SetText("");shadow(unavailable)
    if unavailable.SetTextColor then unavailable:SetTextColor(1,.72,.08) end

    local distance=frame:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontNormalLarge","GameFontNormal"))
    distance:SetPoint("TOP",0,-55);shadow(distance)
    if distance.SetTextColor then distance:SetTextColor(1,.82,.18) end

    local target=frame:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontHighlightSmall","GameFontNormalSmall"))
    target:SetPoint("TOP",distance,"BOTTOM",0,-3);target:SetWidth(168);target:SetJustifyH("CENTER")
    UI:SetWordWrap(target,true);shadow(target)

    local route=frame:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontHighlightSmall","GameFontNormalSmall"))
    route:SetPoint("TOP",target,"BOTTOM",0,-2);route:SetWidth(168);route:SetJustifyH("CENTER")
    shadow(route);if route.SetTextColor then route:SetTextColor(.62,.62,.62) end

    self.frame=frame;self.arrow=arrow;self.glow=glow;self.unavailable=unavailable
    self.distance=distance;self.target=target;self.route=route
    if MG.ThemeManager then MG.ThemeManager:ApplyNavigator(self) end

    local elapsed=0
    frame:SetScript("OnUpdate",function(_,delta)
        elapsed=elapsed+(tonumber(delta) or 0)
        if elapsed<UPDATE_INTERVAL then return end
        elapsed=0;N:RefreshLive()
    end)
    return frame
end

function N:RefreshLive()
    local frame=self:Create()
    local settings=MG.db and MG.db.settings or {}
    if frame.SetScale then
        pcall(frame.SetScale,frame,tonumber(settings.navigatorScale) or 1)
    end
    local runtime=MG.RuntimeStore and MG.RuntimeStore:Get() or nil
    local nav=runtime and runtime.navigation

    if not nav or not nav.waypoint then
        self.arrow:Hide();self.glow:Hide();self.unavailable:SetText("")
        self.distance:SetText("");self.target:SetText("");self.route:SetText("")
        UI:SetShown(frame,false);return
    end

    local position=MG.PositionFacts and MG.PositionFacts:Snapshot() or {}
    local d,mode,detail
    if MG.NavigationDistance then d,mode,detail=MG.NavigationDistance:Between(position,nav.waypoint) end

    if d and (mode=="restedxp_world_coordinates" or mode=="world_coordinates" or mode=="map_world_size") then
        local meters=d*.9144
        self.distance:SetText(meters>=1000 and string.format("%.2f km",meters/1000) or string.format("%.0f m",meters))
    elseif d and mode=="normalized_map_distance" then
        self.distance:SetText(string.format("%.1f%% Karte",d*100))
    else self.distance:SetText("") end

    local facing
    if GetPlayerFacing then local ok,value=pcall(GetPlayerFacing);if ok then facing=value end end
    local bearing,bearingReason
    if MG.NavigationBearing then bearing,bearingReason=MG.NavigationBearing:Resolve(position,nav.waypoint,facing) end

    local arrowShown=false
    if bearing and bearing.reliable and bearing.relative~=nil and self.arrow.SetRotation then
        local degrees=tonumber(settings.navigatorArrowCalibration)
        local offset=degrees and math.rad(degrees) or DEFAULT_TEXTURE_ZERO_OFFSET
        local ok=pcall(self.arrow.SetRotation,self.arrow,bearing.relative+offset)
        if ok then
            self.unavailable:SetText("");self.glow:Show();self.arrow:Show();arrowShown=true
        else self.arrow:Hide();self.glow:Hide();self.unavailable:SetText("?") end
    else
        self.arrow:Hide();self.glow:Hide();self.unavailable:SetText("?")
    end

    local row=findNavigatedRow(runtime)
    local arrowText=runtime and runtime.presentation and runtime.presentation.arrowText
    if arrowText and arrowText~="" then self.target:SetText(arrowText)
    else self.target:SetText(row and row.text or "Aktuelles Ziel") end

    local segment=runtime and runtime.currentRouteSegment
    if segment and segment.count and segment.count>1 then
        self.route:SetText((segment.loop and "Loop " or "Route ")..
            tostring(segment.index).."/"..tostring(segment.count))
    else self.route:SetText("") end

    if MG.db then
        MG.db.runtime=MG.db.runtime or {}
        local diagnostic={
            build=MG.BUILD,runtimeRevision=runtime.revision,stepID=runtime.stepID,
            stepIndex=runtime.stepIndex,goalID=nav.goalState and nav.goalState.id or nil,
            goalAction=nav.goalState and nav.goalState.action or nil,
            position=position,waypoint=nav.waypoint,destinationWaypoint=runtime.destinationWaypoint,
            route=runtime.route,currentRouteSegment=segment,
            distance=d,distanceMode=mode,distanceDetail=detail,playerFacing=facing,
            arrowHasSetRotation=self.arrow.SetRotation and true or false,arrowShown=arrowShown,
            bearing=bearing,bearingReason=bearingReason,
            arrowCalibration=tonumber(settings.navigatorArrowCalibration) or -90,
            targetText=self.target:GetText(),
        }
        MG.db.runtime.navigator=diagnostic
        local signature=table.concat({
            tostring(diagnostic.runtimeRevision or "-"),tostring(diagnostic.stepID or "-"),
            tostring(diagnostic.goalID or "-"),tostring(diagnostic.distanceMode or "-"),
            tostring(bearing and bearing.reason or bearingReason or "-"),tostring(arrowShown),
            tostring(segment and segment.index or "-"),
        },"|")
        if self.lastDiagnosticSignature~=signature then
            self.lastDiagnosticSignature=signature
            MG:Log("INFO","navigator.snapshot","Live-Navigatorzustand erfasst.",diagnostic)
        end
    end

    UI:SetShown(frame,MG.db and MG.db.settings and MG.db.settings.showNavigator~=false)
end

function N:Refresh()
    self:Create();self:RefreshLive()
end
