local addonName, MB = ...

MB.UI = MB.UI or {}
local UI = MB.UI
local API = MB.API
local L = MB.L

local DEFAULT_MAIN_WIDTH = 476
local HEADER_HEIGHT = 36
local MONEY_HEIGHT = 22
local SEARCH_HEIGHT = 30
local SLOT_SIZE = 40
local SLOT_GAP = 5
local MIN_SLOT_COLUMNS = 4
local CONTENT_PADDING = 12
local SLOT_TOP = 104
local MIN_MAIN_WIDTH =
    CONTENT_PADDING * 2 +
    MIN_SLOT_COLUMNS * SLOT_SIZE +
    (MIN_SLOT_COLUMNS - 1) * SLOT_GAP

local PANEL_WIDTH = 218
local BAG_SLOT_SIZE = 42
local BAG_GAP = 6
local AVAILABLE_COLUMNS = 4
local AVAILABLE_TOP = 126
local PANEL_BOTTOM_PADDING = 10
local PANEL_EMPTY_HEIGHT = 136
local PANEL_MAX_HEIGHT = 520

local COLORS = {
    background = {0.035, 0.045, 0.055, 0.97},
    panel = {0.050, 0.060, 0.070, 0.98},
    header = {0.030, 0.040, 0.050, 1.00},
    slot = {0.025, 0.032, 0.040, 0.94},
    border = {0.24, 0.28, 0.32, 1.00},
    borderStrong = {0.58, 0.43, 0.18, 1.00},
    accent = {0.18, 0.68, 0.94, 1.00},
    text = {0.95, 0.92, 0.82, 1.00},
    muted = {0.58, 0.62, 0.66, 1.00},
}

local function setTextureColor(texture, color)
    if not texture or not color then return end
    if texture.SetColorTexture then
        texture:SetColorTexture(color[1], color[2], color[3], color[4])
    else
        texture:SetTexture(color[1], color[2], color[3], color[4])
    end
end

local function addBackground(frame, color)
    local texture = frame:CreateTexture(nil, "BACKGROUND")
    texture:SetAllPoints(frame)
    setTextureColor(texture, color or COLORS.panel)
    frame._mbBackground = texture
end

local function addBorder(frame, size, color)
    size = size or 1
    frame._mbBorder = frame._mbBorder or {}

    local top = frame:CreateTexture(nil, "BORDER")
    top:SetPoint("TOPLEFT")
    top:SetPoint("TOPRIGHT")
    top:SetHeight(size)

    local bottom = frame:CreateTexture(nil, "BORDER")
    bottom:SetPoint("BOTTOMLEFT")
    bottom:SetPoint("BOTTOMRIGHT")
    bottom:SetHeight(size)

    local left = frame:CreateTexture(nil, "BORDER")
    left:SetPoint("TOPLEFT")
    left:SetPoint("BOTTOMLEFT")
    left:SetWidth(size)

    local right = frame:CreateTexture(nil, "BORDER")
    right:SetPoint("TOPRIGHT")
    right:SetPoint("BOTTOMRIGHT")
    right:SetWidth(size)

    frame._mbBorder.top = top
    frame._mbBorder.bottom = bottom
    frame._mbBorder.left = left
    frame._mbBorder.right = right

    local c = color or COLORS.border
    setTextureColor(top, c)
    setTextureColor(bottom, c)
    setTextureColor(left, c)
    setTextureColor(right, c)
end

local function setBorderColor(frame, color)
    if not frame or not frame._mbBorder then return end
    for _, texture in pairs(frame._mbBorder) do
        setTextureColor(texture, color)
    end
end

local function makeText(parent, template, size)
    local text = parent:CreateFontString(nil, "OVERLAY", template or "GameFontHighlight")
    if size and text.SetFont then
        local font, _, flags = text:GetFont()
        if font then text:SetFont(font, size, flags) end
    end
    return text
end

local function normalizeSearch(value)
    value = tostring(value or "")
    value = value:match("^%s*(.-)%s*$") or value
    if strlower then
        local ok, lowered = pcall(strlower, value)
        if ok and lowered then return lowered end
    end
    return string.lower(value)
end

local function makeIconButton(parent, size)
    local button = CreateFrame("Button", nil, parent)
    button:SetSize(size, size)
    addBackground(button, COLORS.slot)
    addBorder(button, 1, COLORS.border)

    button.icon = button:CreateTexture(nil, "ARTWORK")
    button.icon:SetPoint("TOPLEFT", 3, -3)
    button.icon:SetPoint("BOTTOMRIGHT", -3, 3)
    button.icon:SetTexCoord(0.08, 0.92, 0.08, 0.92)

    button.count = makeText(button, "NumberFontNormalSmall", 11)
    button.count:SetPoint("BOTTOMRIGHT", -3, 3)
    button.count:SetJustifyH("RIGHT")

    return button
end

local function showBagTooltip(button)
    if not GameTooltip or not button.bagID or not button.slotID then return end
    GameTooltip:SetOwner(button, "ANCHOR_RIGHT")

    local shown = false
    if GameTooltip.SetBagItem then
        local ok = pcall(GameTooltip.SetBagItem, GameTooltip, button.bagID, button.slotID)
        shown = ok
    end

    if not shown and button.itemLink and GameTooltip.SetHyperlink then
        pcall(GameTooltip.SetHyperlink, GameTooltip, button.itemLink)
    end
    GameTooltip:Show()
end

local function showInventoryTooltip(button)
    if not GameTooltip or not button.inventorySlot then return end
    GameTooltip:SetOwner(button, "ANCHOR_RIGHT")

    local shown = false
    if GameTooltip.SetInventoryItem then
        local ok = pcall(GameTooltip.SetInventoryItem, GameTooltip, "player", button.inventorySlot)
        shown = ok
    end

    if not shown and button.itemLink and GameTooltip.SetHyperlink then
        pcall(GameTooltip.SetHyperlink, GameTooltip, button.itemLink)
    end
    GameTooltip:Show()
end

local function showLinkTooltip(button)
    if not GameTooltip or not button.itemLink then return end
    GameTooltip:SetOwner(button, "ANCHOR_RIGHT")
    if GameTooltip.SetHyperlink then
        pcall(GameTooltip.SetHyperlink, GameTooltip, button.itemLink)
    end
    GameTooltip:Show()
end

local function hideTooltip()
    if GameTooltip then GameTooltip:Hide() end
end

function UI:GetSlotColumns()
    if not self.frame then return MIN_SLOT_COLUMNS end
    local available = math.max(0, (self.frame:GetWidth() or DEFAULT_MAIN_WIDTH) - CONTENT_PADDING * 2)
    local columns = math.floor((available + SLOT_GAP) / (SLOT_SIZE + SLOT_GAP))
    return math.max(MIN_SLOT_COLUMNS, columns)
end

function UI:SaveSize()
    if not self.frame or not MB.db then return end
    MB.db.windowWidth = math.max(MIN_MAIN_WIDTH, self.frame:GetWidth() or DEFAULT_MAIN_WIDTH)
end

function UI:RestoreSize()
    if not self.frame then return end
    local width = MB.db and tonumber(MB.db.windowWidth) or DEFAULT_MAIN_WIDTH
    width = math.max(MIN_MAIN_WIDTH, width or DEFAULT_MAIN_WIDTH)

    local parentWidth = UIParent and UIParent:GetWidth() or nil
    if parentWidth and parentWidth > 80 then
        width = math.min(width, parentWidth - 40)
    end

    self.frame:SetWidth(width)
end

function UI:Create()
    if self.frame then return end

    local frame = CreateFrame("Frame", "MewthischBagsFrame", UIParent)
    frame:SetSize(DEFAULT_MAIN_WIDTH, 420)
    frame:SetFrameStrata("HIGH")
    frame:SetClampedToScreen(true)
    frame:EnableMouse(true)
    frame:SetMovable(true)
    if frame.SetResizable then frame:SetResizable(true) end

    local maxWidth = math.max(MIN_MAIN_WIDTH, (UIParent:GetWidth() or 1600) - 40)
    local maxHeight = math.max(220, (UIParent:GetHeight() or 1000) - 40)
    if frame.SetResizeBounds then
        frame:SetResizeBounds(MIN_MAIN_WIDTH, 160, maxWidth, maxHeight)
    else
        if frame.SetMinResize then frame:SetMinResize(MIN_MAIN_WIDTH, 160) end
        if frame.SetMaxResize then frame:SetMaxResize(maxWidth, maxHeight) end
    end

    addBackground(frame, COLORS.background)
    addBorder(frame, 1, COLORS.borderStrong)
    self.frame = frame

    local header = CreateFrame("Frame", nil, frame)
    header:SetPoint("TOPLEFT", 1, -1)
    header:SetPoint("TOPRIGHT", -1, -1)
    header:SetHeight(HEADER_HEIGHT)
    header:EnableMouse(true)
    header:RegisterForDrag("LeftButton")
    addBackground(header, COLORS.header)
    self.header = header

    header:SetScript("OnDragStart", function()
        frame:StartMoving()
    end)
    header:SetScript("OnDragStop", function()
        frame:StopMovingOrSizing()
        UI:SavePosition()
        UI:UpdateBagPanelSide()
    end)

    local title = makeText(header, "GameFontNormalLarge", 17)
    title:SetPoint("CENTER", header, "CENTER", 0, 0)
    title:SetText(L.TITLE)
    title:SetTextColor(COLORS.text[1], COLORS.text[2], COLORS.text[3])
    self.title = title

    local close = CreateFrame("Button", nil, header)
    close:SetSize(28, 26)
    close:SetPoint("RIGHT", header, "RIGHT", -5, 0)
    addBackground(close, {0.20, 0.035, 0.025, 1})
    addBorder(close, 1, COLORS.borderStrong)
    close.label = makeText(close, "GameFontNormalLarge", 18)
    close.label:SetPoint("CENTER", 0, 1)
    close.label:SetText("×")
    close:SetScript("OnClick", function() UI:Hide() end)
    close:SetScript("OnEnter", function(self) setBorderColor(self, COLORS.accent) end)
    close:SetScript("OnLeave", function(self) setBorderColor(self, COLORS.borderStrong) end)
    self.closeButton = close

    local bagToggle = CreateFrame("Button", nil, header)
    bagToggle:SetSize(28, 26)
    bagToggle:SetPoint("RIGHT", close, "LEFT", -5, 0)
    addBackground(bagToggle, COLORS.slot)
    addBorder(bagToggle, 1, COLORS.border)
    bagToggle.icon = bagToggle:CreateTexture(nil, "ARTWORK")
    bagToggle.icon:SetPoint("TOPLEFT", 4, -4)
    bagToggle.icon:SetPoint("BOTTOMRIGHT", -4, 4)
    bagToggle.icon:SetTexture("Interface\\Buttons\\Button-Backpack-Up")
    bagToggle:SetScript("OnClick", function() UI:ToggleBagPanel() end)
    bagToggle:SetScript("OnEnter", function(self)
        setBorderColor(self, COLORS.accent)
        if GameTooltip then
            GameTooltip:SetOwner(self, "ANCHOR_TOP")
            GameTooltip:SetText(L.BAG_PANEL)
            GameTooltip:Show()
        end
    end)
    bagToggle:SetScript("OnLeave", function(self)
        setBorderColor(self, (MB.db and MB.db.panelOpen) and COLORS.accent or COLORS.border)
        hideTooltip()
    end)
    self.bagToggle = bagToggle

    local money = makeText(frame, "GameFontHighlight", 13)
    money:SetPoint("TOP", frame, "TOP", 0, -(HEADER_HEIGHT + 8))
    money:SetJustifyH("CENTER")
    self.money = money

    local searchFrame = CreateFrame("Frame", nil, frame)
    searchFrame:SetPoint("TOPLEFT", CONTENT_PADDING, -(HEADER_HEIGHT + MONEY_HEIGHT + 12))
    searchFrame:SetPoint("TOPRIGHT", -CONTENT_PADDING, -(HEADER_HEIGHT + MONEY_HEIGHT + 12))
    searchFrame:SetHeight(SEARCH_HEIGHT)
    addBackground(searchFrame, {0.025, 0.038, 0.050, 1})
    addBorder(searchFrame, 1, COLORS.border)
    self.searchFrame = searchFrame

    local search = CreateFrame("EditBox", nil, searchFrame)
    search:SetPoint("TOPLEFT", 10, -3)
    search:SetPoint("BOTTOMRIGHT", -10, 3)
    search:SetAutoFocus(false)
    search:SetFontObject("ChatFontNormal")
    search:SetTextInsets(0, 0, 0, 0)
    self.search = search

    local placeholder = makeText(searchFrame, "GameFontDisableSmall", 12)
    placeholder:SetPoint("LEFT", search, "LEFT", 0, 0)
    placeholder:SetText(L.SEARCH)
    placeholder:SetTextColor(COLORS.muted[1], COLORS.muted[2], COLORS.muted[3])
    self.searchPlaceholder = placeholder

    search:SetScript("OnTextChanged", function(self)
        local hasText = self:GetText() ~= ""
        placeholder:SetShown(not hasText)
        UI:ApplySearch()
    end)
    search:SetScript("OnEditFocusGained", function()
        setBorderColor(searchFrame, COLORS.accent)
    end)
    search:SetScript("OnEditFocusLost", function()
        setBorderColor(searchFrame, COLORS.border)
    end)
    search:SetScript("OnEscapePressed", function(self)
        self:SetText("")
        self:ClearFocus()
    end)
    search:SetScript("OnEnterPressed", function(self)
        self:ClearFocus()
    end)

    local resizeHandle = CreateFrame("Button", nil, frame)
    resizeHandle:SetSize(10, 56)
    resizeHandle:SetPoint("RIGHT", frame, "RIGHT", 0, 0)
    resizeHandle:EnableMouse(true)
    resizeHandle.line = resizeHandle:CreateTexture(nil, "ARTWORK")
    resizeHandle.line:SetWidth(2)
    resizeHandle.line:SetHeight(32)
    resizeHandle.line:SetPoint("CENTER")
    setTextureColor(resizeHandle.line, COLORS.border)
    resizeHandle:SetScript("OnEnter", function(self)
        setTextureColor(self.line, COLORS.accent)
    end)
    resizeHandle:SetScript("OnLeave", function(self)
        setTextureColor(self.line, COLORS.border)
    end)
    resizeHandle:SetScript("OnMouseDown", function(_, button)
        if button == "LeftButton" and frame.StartSizing then
            frame:StartSizing("RIGHT")
        end
    end)
    resizeHandle:SetScript("OnMouseUp", function()
        frame:StopMovingOrSizing()
        UI:SaveSize()
        UI:LayoutSlots()
        UI:UpdateBagPanelSide()
    end)
    self.resizeHandle = resizeHandle

    self.slotButtons = {}
    self.currentSlots = {}
    self:CreateBagPanel()
    self:RestoreSize()
    self:RestorePosition()

    frame:SetScript("OnSizeChanged", function()
        if UI._settingLayoutHeight then return end
        UI:LayoutSlots()
        UI:UpdateBagPanelSide()
    end)

    frame:SetScript("OnShow", function()
        UI:RefreshAll()
        UI:UpdateBagPanelSide()
    end)

    frame:Hide()
end

function UI:CreateBagPanel()
    if self.bagPanel then return end

    local panel = CreateFrame("Frame", "MewthischBagsBagPanel", UIParent)
    panel:SetSize(PANEL_WIDTH, PANEL_EMPTY_HEIGHT)
    panel:SetFrameStrata("HIGH")
    panel:SetClampedToScreen(true)
    addBackground(panel, COLORS.panel)
    addBorder(panel, 1, COLORS.borderStrong)
    panel:Hide()
    self.bagPanel = panel

    local equippedTitle = makeText(panel, "GameFontNormal", 13)
    equippedTitle:SetPoint("TOPLEFT", 12, -12)
    equippedTitle:SetText(L.EQUIPPED_BAGS)
    equippedTitle:SetTextColor(COLORS.text[1], COLORS.text[2], COLORS.text[3])
    self.equippedTitle = equippedTitle

    self.equippedButtons = {}
    for bagID = 1, 4 do
        local button = makeIconButton(panel, BAG_SLOT_SIZE)
        button:SetPoint("TOPLEFT", 12 + (bagID - 1) * (BAG_SLOT_SIZE + BAG_GAP), -36)
        button.bagID = bagID
        button:RegisterForClicks("LeftButtonUp", "RightButtonUp")
        button:RegisterForDrag("LeftButton")
        button.capacity = makeText(button, "NumberFontNormalSmall", 10)
        button.capacity:SetPoint("BOTTOMRIGHT", -3, 3)
        button.capacity:SetJustifyH("RIGHT")

        button:SetScript("OnClick", function(self)
            if self.itemLink and IsModifiedClick and IsModifiedClick() and
                HandleModifiedItemClick and HandleModifiedItemClick(self.itemLink) then
                return
            end
            API:PickupInventoryBag(self.bagID)
        end)
        button:SetScript("OnDragStart", function(self)
            API:PickupInventoryBag(self.bagID)
        end)
        button:SetScript("OnReceiveDrag", function(self)
            API:PickupInventoryBag(self.bagID)
        end)
        button:SetScript("OnEnter", showInventoryTooltip)
        button:SetScript("OnLeave", hideTooltip)

        self.equippedButtons[bagID] = button
    end

    local divider = panel:CreateTexture(nil, "ARTWORK")
    divider:SetPoint("TOPLEFT", 12, -88)
    divider:SetPoint("TOPRIGHT", -12, -88)
    divider:SetHeight(1)
    setTextureColor(divider, COLORS.border)

    local availableTitle = makeText(panel, "GameFontNormal", 13)
    availableTitle:SetPoint("TOPLEFT", 12, -103)
    availableTitle:SetText(L.AVAILABLE_BAGS)
    availableTitle:SetTextColor(COLORS.text[1], COLORS.text[2], COLORS.text[3])
    self.availableTitle = availableTitle

    local scroll = CreateFrame("ScrollFrame", nil, panel)
    scroll:SetPoint("TOPLEFT", 10, -AVAILABLE_TOP)
    scroll:SetPoint("BOTTOMRIGHT", -10, PANEL_BOTTOM_PADDING)
    scroll:EnableMouseWheel(true)
    self.availableScroll = scroll

    local child = CreateFrame("Frame", nil, scroll)
    child:SetWidth(PANEL_WIDTH - 20)
    child:SetHeight(1)
    scroll:SetScrollChild(child)
    self.availableChild = child

    scroll:SetScript("OnMouseWheel", function(self, delta)
        local current = self:GetVerticalScroll() or 0
        local range = self:GetVerticalScrollRange() or 0
        local nextValue = current - delta * (BAG_SLOT_SIZE + BAG_GAP)
        if nextValue < 0 then nextValue = 0 end
        if nextValue > range then nextValue = range end
        self:SetVerticalScroll(nextValue)
    end)

    self.availableButtons = {}
end

function UI:SavePosition()
    if not self.frame or not MB.db then return end
    local x, y = self.frame:GetCenter()
    local ux, uy = UIParent:GetCenter()
    if not x or not y or not ux or not uy then return end
    MB.db.positionX = x - ux
    MB.db.positionY = y - uy
end

function UI:RestorePosition()
    if not self.frame then return end
    self.frame:ClearAllPoints()
    local x = MB.db and tonumber(MB.db.positionX) or 0
    local y = MB.db and tonumber(MB.db.positionY) or 0
    self.frame:SetPoint("CENTER", UIParent, "CENTER", x or 0, y or 0)
end

function UI:ResetPosition()
    if MB.db then
        MB.db.positionX = 0
        MB.db.positionY = 0
        MB.db.windowWidth = DEFAULT_MAIN_WIDTH
    end
    self:RestoreSize()
    self:RestorePosition()
    self:LayoutSlots()
    self:UpdateBagPanelSide()
end

function UI:UpdateBagPanelSide()
    if not self.frame or not self.bagPanel then return end

    local mainCenterX = self.frame:GetCenter()
    local screenCenterX = UIParent:GetCenter()
    self.bagPanel:ClearAllPoints()

    if not mainCenterX or not screenCenterX or mainCenterX >= screenCenterX then
        self.bagPanel:SetPoint("TOPRIGHT", self.frame, "TOPLEFT", -6, 0)
        self.bagPanelSide = "LEFT"
    else
        self.bagPanel:SetPoint("TOPLEFT", self.frame, "TOPRIGHT", 6, 0)
        self.bagPanelSide = "RIGHT"
    end
end

function UI:ToggleBagPanel()
    if not MB.db then return end
    MB.db.panelOpen = not MB.db.panelOpen
    self:SetBagPanelOpen(MB.db.panelOpen)
end

function UI:SetBagPanelOpen(open)
    if not self.bagPanel then return end
    if MB.db then MB.db.panelOpen = open and true or false end

    if open then
        self:UpdateBagPanelSide()
        self:RefreshBagPanel()
        self.bagPanel:Show()
        setBorderColor(self.bagToggle, COLORS.accent)
    else
        self.bagPanel:Hide()
        setBorderColor(self.bagToggle, COLORS.border)
    end
end

function UI:RefreshMoney()
    if not self.money then return end
    local gold, silver, copper = API:GetMoney()
    self.money:SetText(
        API:FormatLargeNumber(gold) .. " " .. API:GetMoneySymbol("gold") ..
        "   " .. tostring(silver) .. " " .. API:GetMoneySymbol("silver") ..
        "   " .. tostring(copper) .. " " .. API:GetMoneySymbol("copper")
    )
end

function UI:AcquireSlotButton(index)
    local button = self.slotButtons[index]
    if button then return button end

    button = makeIconButton(self.frame, SLOT_SIZE)
    button:RegisterForClicks("LeftButtonUp", "RightButtonUp")
    button:RegisterForDrag("LeftButton")

    button:SetScript("OnClick", function(self, mouseButton)
        if not self.bagID or not self.slotID then return end

        if self.itemLink and IsModifiedClick and IsModifiedClick() and
            HandleModifiedItemClick and HandleModifiedItemClick(self.itemLink) then
            return
        end

        if mouseButton == "RightButton" then
            API:UseContainerItem(self.bagID, self.slotID)
        else
            API:PickupContainerItem(self.bagID, self.slotID)
        end
    end)
    button:SetScript("OnDragStart", function(self)
        if self.bagID and self.slotID then
            API:PickupContainerItem(self.bagID, self.slotID)
        end
    end)
    button:SetScript("OnReceiveDrag", function(self)
        if self.bagID and self.slotID then
            API:PickupContainerItem(self.bagID, self.slotID)
        end
    end)
    button:SetScript("OnEnter", showBagTooltip)
    button:SetScript("OnLeave", hideTooltip)

    self.slotButtons[index] = button
    return button
end

function UI:LayoutSlots()
    if not self.frame or not self.currentSlots then return end

    local columns = self:GetSlotColumns()
    local slotCount = #self.currentSlots

    for index = 1, slotCount do
        local button = self.slotButtons[index]
        if button then
            local col = (index - 1) % columns
            local row = math.floor((index - 1) / columns)

            button:ClearAllPoints()
            button:SetPoint(
                "TOPLEFT",
                self.frame,
                "TOPLEFT",
                CONTENT_PADDING + col * (SLOT_SIZE + SLOT_GAP),
                -(SLOT_TOP + row * (SLOT_SIZE + SLOT_GAP))
            )
        end
    end

    local rows = math.max(1, math.ceil(slotCount / columns))
    local requiredHeight =
        SLOT_TOP +
        rows * (SLOT_SIZE + SLOT_GAP) +
        CONTENT_PADDING -
        SLOT_GAP

    self._settingLayoutHeight = true
    self.frame:SetHeight(requiredHeight)
    self._settingLayoutHeight = false
end

function UI:RefreshSlots()
    if not self.frame then return end

    local slots = {}
    for bagID = 0, 4 do
        local numSlots = API:GetContainerNumSlots(bagID)
        for slotID = 1, numSlots do
            slots[#slots + 1] = API:GetContainerItemInfo(bagID, slotID)
        end
    end
    self.currentSlots = slots

    for index, info in ipairs(slots) do
        local button = self:AcquireSlotButton(index)

        button.bagID = info.bagID
        button.slotID = info.slotID
        button.itemLink = info.link
        button.itemName = API:GetItemName(info.link or info.itemID)

        if info.icon then
            button.icon:SetTexture(info.icon)
            button.icon:Show()
        else
            button.icon:SetTexture(nil)
            button.icon:Hide()
        end

        if info.count and info.count > 1 then
            button.count:SetText(info.count)
            button.count:Show()
        else
            button.count:SetText("")
            button.count:Hide()
        end

        button:SetAlpha(1)
        setBorderColor(button, COLORS.border)
        button:Show()
    end

    for index = #slots + 1, #self.slotButtons do
        self.slotButtons[index]:Hide()
    end

    self:LayoutSlots()
    self:ApplySearch()
end

function UI:ApplySearch()
    local query = normalizeSearch(self.search and self.search:GetText() or "")

    for _, button in ipairs(self.slotButtons or {}) do
        if button:IsShown() then
            if query == "" then
                button:SetAlpha(1)
                setBorderColor(button, COLORS.border)
            elseif not button.itemLink then
                button:SetAlpha(0.12)
                setBorderColor(button, COLORS.border)
            else
                local haystack = normalizeSearch(
                    tostring(button.itemName or "") .. " " .. tostring(button.itemLink or "")
                )
                local match = haystack:find(query, 1, true) ~= nil
                if match then
                    button:SetAlpha(1)
                    setBorderColor(button, COLORS.accent)
                else
                    button:SetAlpha(0.18)
                    setBorderColor(button, COLORS.border)
                end
            end
        end
    end
end

function UI:AcquireAvailableBagButton(index)
    local button = self.availableButtons[index]
    if button then return button end

    button = makeIconButton(self.availableChild, BAG_SLOT_SIZE)
    button:RegisterForClicks("LeftButtonUp", "RightButtonUp")
    button:RegisterForDrag("LeftButton")
    button.capacity = makeText(button, "NumberFontNormalSmall", 10)
    button.capacity:SetPoint("BOTTOMRIGHT", -3, 3)
    button.capacity:SetJustifyH("RIGHT")

    button:SetScript("OnClick", function(self)
        if self.itemLink and IsModifiedClick and IsModifiedClick() and
            HandleModifiedItemClick and HandleModifiedItemClick(self.itemLink) then
            return
        end
        if self.bagID and self.slotID then
            API:PickupContainerItem(self.bagID, self.slotID)
        end
    end)
    button:SetScript("OnDragStart", function(self)
        if self.bagID and self.slotID then
            API:PickupContainerItem(self.bagID, self.slotID)
        end
    end)
    button:SetScript("OnEnter", showLinkTooltip)
    button:SetScript("OnLeave", hideTooltip)

    self.availableButtons[index] = button
    return button
end

function UI:ResizeBagPanelForAvailableCount(count)
    if not self.bagPanel or not self.availableScroll or not self.availableChild then return end

    count = math.max(0, tonumber(count) or 0)
    if count == 0 then
        self.availableChild:SetHeight(1)
        self.availableScroll:SetVerticalScroll(0)
        self.availableScroll:Hide()
        self.bagPanel:SetHeight(PANEL_EMPTY_HEIGHT)
        return
    end

    local rows = math.ceil(count / AVAILABLE_COLUMNS)
    local contentHeight =
        rows * BAG_SLOT_SIZE +
        math.max(0, rows - 1) * BAG_GAP

    self.availableChild:SetHeight(math.max(1, contentHeight))
    self.availableScroll:Show()

    local desiredHeight = AVAILABLE_TOP + contentHeight + PANEL_BOTTOM_PADDING
    local screenLimit = (UIParent:GetHeight() or PANEL_MAX_HEIGHT) - 40
    local maxHeight = math.max(PANEL_EMPTY_HEIGHT, math.min(PANEL_MAX_HEIGHT, screenLimit))
    self.bagPanel:SetHeight(math.max(PANEL_EMPTY_HEIGHT, math.min(desiredHeight, maxHeight)))
end

function UI:RefreshBagPanel()
    if not self.bagPanel then return end

    for bagID = 1, 4 do
        local info = API:GetEquippedBagInfo(bagID)
        local button = self.equippedButtons[bagID]
        button.inventorySlot = info and info.inventorySlot or nil
        button.itemLink = info and info.link or nil

        if info and info.icon then
            button.icon:SetTexture(info.icon)
            button.icon:Show()
        else
            button.icon:SetTexture(nil)
            button.icon:Hide()
        end

        local capacity = info and tonumber(info.capacity) or 0
        if capacity > 0 then
            button.capacity:SetText(capacity)
        else
            button.capacity:SetText("")
        end
        button.count:Hide()
        button:SetAlpha(API:IsInCombat() and 0.45 or 1)
    end

    local available = API:GetAvailableBags()
    for index, info in ipairs(available) do
        local button = self:AcquireAvailableBagButton(index)
        local col = (index - 1) % AVAILABLE_COLUMNS
        local row = math.floor((index - 1) / AVAILABLE_COLUMNS)

        button:ClearAllPoints()
        button:SetPoint(
            "TOPLEFT",
            self.availableChild,
            "TOPLEFT",
            2 + col * (BAG_SLOT_SIZE + BAG_GAP),
            -row * (BAG_SLOT_SIZE + BAG_GAP)
        )

        button.bagID = info.bagID
        button.slotID = info.slotID
        button.itemLink = info.link

        if info.icon then
            button.icon:SetTexture(info.icon)
            button.icon:Show()
        else
            button.icon:SetTexture(nil)
            button.icon:Hide()
        end

        if tonumber(info.capacity) and tonumber(info.capacity) > 0 then
            button.capacity:SetText(info.capacity)
        else
            button.capacity:SetText("?")
        end

        button.count:Hide()
        button:SetAlpha(API:IsInCombat() and 0.45 or 1)
        button:Show()
    end

    for index = #available + 1, #self.availableButtons do
        self.availableButtons[index]:Hide()
    end

    self:ResizeBagPanelForAvailableCount(#available)
end

function UI:RefreshAll()
    self:RefreshMoney()
    self:RefreshSlots()
    self:RefreshBagPanel()

    if MB.db and MB.db.panelOpen then
        self:SetBagPanelOpen(true)
    else
        self:SetBagPanelOpen(false)
    end
end

function UI:Show()
    if not self.frame then self:Create() end
    self.frame:Show()
    self:RefreshAll()
end

function UI:Hide()
    if self.bagPanel then self.bagPanel:Hide() end
    if self.frame then self.frame:Hide() end
end

function UI:Toggle()
    if not self.frame then self:Create() end
    if self.frame:IsShown() then
        self:Hide()
    else
        self:Show()
    end
end

function UI:IsShown()
    return self.frame and self.frame:IsShown()
end
