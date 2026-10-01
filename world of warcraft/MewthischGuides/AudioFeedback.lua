local addonName, MG = ...
MG.AudioFeedback=MG.AudioFeedback or {}; local A=MG.AudioFeedback
local function kit(name)
  if not SOUNDKIT then return nil end
  if name=="step" then return SOUNDKIT.IG_MAINMENU_OPTION_CHECKBOX_ON or SOUNDKIT.READY_CHECK end
  if name=="equip" then return SOUNDKIT.ITEM_REPAIR or SOUNDKIT.IG_CHARACTER_INFO_OPEN end
  return SOUNDKIT.IG_MAINMENU_OPTION_CHECKBOX_ON
end
function A:Play(kind)
  if not MG.db or not MG.db.settings.audioEnabled or not PlaySound then return false end
  if kind=="step" and not MG.db.settings.audioStepChange then return false end
  if kind=="equip" and not MG.db.settings.audioAutoEquip then return false end
  local id=kit(kind); if not id then return false end; local ok=pcall(PlaySound,id,"SFX"); return ok
end
