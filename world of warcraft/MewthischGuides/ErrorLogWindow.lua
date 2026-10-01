local addonName, MG = ...

MG.ErrorLogWindow=MG.ErrorLogWindow or {}
local E=MG.ErrorLogWindow

local function scalar(value)
    if type(value)=="string" or type(value)=="number" or type(value)=="boolean" then return tostring(value) end
    return tostring(value or "")
end
local function flatten(value,prefix,out,depth)
    out=out or {};depth=depth or 0
    if depth>3 then return out end
    if type(value)~="table" then out[#out+1]=tostring(prefix or "").."="..scalar(value);return out end
    local keys={};for key in pairs(value) do keys[#keys+1]=key end
    table.sort(keys,function(a,b) return tostring(a)<tostring(b) end)
    for _,key in ipairs(keys) do
        local p=prefix and (prefix.."."..tostring(key)) or tostring(key)
        if type(value[key])=="table" then flatten(value[key],p,out,depth+1) else out[#out+1]=p.."="..scalar(value[key]) end
    end
    return out
end

function MG:GetErrorLogText()
    local db=self:EnsureDB()
    local lines={"MEWTHISCH GUIDES ERROR LOG","Version="..tostring(self.VERSION or "-"),
        "Interface="..tostring(self.INTERFACE or "-"),
        "Generated="..tostring(date and date("!%Y-%m-%dT%H:%M:%SZ") or "-")}
    local build=self.GetBuildInfoTable and self:GetBuildInfoTable() or {}
    lines[#lines+1]="Build="..tostring(build.version or "-").." / "..tostring(build.buildNumber or "-").." / interface "..tostring(build.interfaceVersion or "-")
    local runtime=self.RuntimeEngine and self.RuntimeEngine:GetDiagnostics() or {}
    lines[#lines+1]="RuntimeRevision="..tostring(runtime.revision or 0).." Guide="..tostring(runtime.guideID or "-")..
        " Step="..tostring(runtime.stepID or "-").." DestinationGoal="..tostring(runtime.destinationGoalID or "-")
    lines[#lines+1]=string.rep("-",72)
    local count=0
    for _,entry in ipairs(db.logs or {}) do
        if entry.level=="ERROR" or entry.level=="WARN" then
            count=count+1
            lines[#lines+1]=string.format("[%s] #%s %s %s",tostring(entry.level),tostring(entry.seq or "?"),tostring(entry.at or "-"),tostring(entry.event or "unknown"))
            lines[#lines+1]=tostring(entry.message or "")
            for _,detail in ipairs(flatten(entry.data)) do lines[#lines+1]="  "..detail end
            lines[#lines+1]=""
        end
    end
    if count==0 then lines[#lines+1]="Keine WARN/ERROR-Einträge vorhanden." end
    return table.concat(lines,"\n")
end

local function button(parent,text,width,callback)
    local b=CreateFrame("Button",nil,parent,"UIPanelButtonTemplate");b:SetSize(width,24);b:SetText(text);b:SetScript("OnClick",callback);return b
end

function E:Create()
    if self.frame or not CreateFrame then return self.frame end
    local f=CreateFrame("Frame","MewthischGuidesErrorLogFrame",UIParent);f:SetSize(760,520);f:SetPoint("CENTER");f:SetFrameStrata("FULLSCREEN_DIALOG");f:SetFrameLevel(260);f:SetMovable(true);f:SetClampedToScreen(true);f:EnableMouse(true)
    local bg=f:CreateTexture(nil,"BACKGROUND");bg:SetAllPoints();if bg.SetColorTexture then bg:SetColorTexture(0.025,0.03,0.04,0.98) end
    local title=f:CreateFontString(nil,"OVERLAY","GameFontNormalLarge");title:SetPoint("TOPLEFT",14,-12);title:SetText("Mewthisch Guides – Fehlerlog")
    local hint=f:CreateFontString(nil,"OVERLAY","GameFontHighlightSmall");hint:SetPoint("TOPLEFT",14,-38);hint:SetText("Strg+A und Strg+C zum Kopieren. Enthält Mewthisch WARN/ERROR inklusive Stack-Daten.")
    local drag=CreateFrame("Frame",nil,f);drag:SetPoint("TOPLEFT");drag:SetPoint("TOPRIGHT");drag:SetHeight(34);drag:EnableMouse(true);drag:RegisterForDrag("LeftButton")
    drag:SetScript("OnDragStart",function() if not (InCombatLockdown and InCombatLockdown()) then f:StartMoving() end end);drag:SetScript("OnDragStop",function() f:StopMovingOrSizing() end)
    local scroll=CreateFrame("ScrollFrame","MewthischGuidesErrorLogScroll",f,"UIPanelScrollFrameTemplate");scroll:SetPoint("TOPLEFT",14,-64);scroll:SetPoint("BOTTOMRIGHT",-34,50)
    local edit=CreateFrame("EditBox",nil,scroll);edit:SetMultiLine(true);edit:SetAutoFocus(false);edit:SetFontObject(ChatFontNormal);edit:SetWidth(690);edit:SetTextInsets(4,4,4,4)
    edit:SetScript("OnEscapePressed",function(self) self:ClearFocus() end);edit:SetHeight(1200);scroll:SetScrollChild(edit)
    local refresh=button(f,"Aktualisieren",110,function() E:Refresh() end);refresh:SetPoint("BOTTOMLEFT",14,14)
    local selectAll=button(f,"Alles markieren",120,function() edit:SetFocus();edit:HighlightText() end);selectAll:SetPoint("LEFT",refresh,"RIGHT",8,0)
    local clear=button(f,"Log leeren",100,function() if MG.db then MG.db.logs={};MG.db.logSequence=0 end;MG:Log("INFO","log.cleared","Diagnoselog über Fehlerfenster geleert.");E:Refresh() end);clear:SetPoint("LEFT",selectAll,"RIGHT",8,0)
    local close=button(f,"Schließen",100,function() f:Hide() end);close:SetPoint("BOTTOMRIGHT",-14,14)
    self.frame,self.edit=f,edit;f:Hide();return f
end
function E:Refresh() self:Create();if self.edit then self.edit:SetText(MG:GetErrorLogText());self.edit:SetCursorPosition(0) end end
function MG:ToggleErrorLogWindow(force)
    local f=E:Create();if not f then return end
    local show=force;if show==nil then show=not f:IsShown() end
    if show then E:Refresh();f:Show();if f.Raise then f:Raise() end else f:Hide() end
end
