local addonName, MG = ...

MG.GearAdvisor = MG.GearAdvisor or {}
local G = MG.GearAdvisor

function G:Refresh(reason)
    local inventory=MG.InventoryScanner and MG.InventoryScanner:Refresh(reason) or {bags={}}
    local best
    for _,item in ipairs(inventory.bags or {}) do
        local result=MG.GearScore:CompareToEquipped(item.link)
        if result and result.upgrade then
            result.bag=item.bag
            result.bagSlot=item.slot
            result.isBound=item.isBound
            if not best or result.delta>best.delta then best=result end
        end
    end
    self.bestUpgrade=best
    if MG.db then
        MG.db.runtime=MG.db.runtime or {}
        MG.db.runtime.gear={
            reason=reason,
            itemID=best and best.itemID or nil,
            link=best and best.link or nil,
            delta=best and best.delta or nil,
            confidence=best and best.confidence or nil,
            autoEquip=false,
        }
    end
    return best
end

function G:Get()
    return self.bestUpgrade
end
