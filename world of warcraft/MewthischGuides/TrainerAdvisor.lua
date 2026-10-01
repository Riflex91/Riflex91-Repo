local addonName, MG = ...
MG.TrainerAdvisor=MG.TrainerAdvisor or {}; local T=MG.TrainerAdvisor
local function priority(text)
  text=tostring(text or ""):lower()
  if text:find("train") or text:find("learn") or text:find("trainer") then return "recommended" end
  return "optional"
end
function T:Refresh(reason)
  local actions=MG.RestEDXPActionEngine and MG.RestEDXPActionEngine:GetTrainerActions() or {}
  local hints={}
  for _,a in ipairs(actions) do hints[#hints+1]={text=a.text,kind=a.kind,priority=priority(a.text),source="RestedXP"} end
  self.hints=hints
  if MG.db then MG.db.runtime=MG.db.runtime or {}; MG.db.runtime.trainer={reason=reason,count=#hints,hints=hints} end
  return hints
end
function T:GetHints() return self.hints or {} end
