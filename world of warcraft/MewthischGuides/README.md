# Mewthisch Guides v0.5.1 - Navigator hotfix

This test build keeps roadmap steps 1-4 from v0.5 and fixes the live Navigator initialization crash reported on Forever build 69913.

## Navigator fix

- removes the Button-only `RegisterForClicks()` call from the normal Navigator frame
- right-click Options continues to use the frame's existing `OnMouseUp` handler
- separate transparent Navigator behavior is retained
- reliable-direction / fail-closed waypoint logic is unchanged
- CI now fails if `RegisterForClicks` is reintroduced into `Navigator.lua`

## Window transparency

Options now include a `Fenster-Transparenz` slider.

- range: 0% to 80% transparency
- applies immediately
- saved in `MewthischGuidesDB`
- affects the backgrounds of:
  - main Guide Viewer
  - Info
  - Options
- text, buttons and the separate navigation arrow remain fully readable/opaque

Info and Options continue to open centered on the screen.

## Existing roadmap steps retained

- Goal Engine
- Guide Step Engine
- automatic Resync
- safe quest-ID-bound Auto-Accept / Auto-Turn-In
- compact viewer
- separate movable transparent Navigator
- metric distance
- movable minimap button
- diagnostic logging

## Test evidence

After testing, use `/reload` or log out and send:

`WTF/Account/<account>/SavedVariables/MewthischGuides.lua`

If the arrow is still missing after this hotfix, the SavedVariables navigation diagnostics will tell us whether the remaining cause is waypoint resolution rather than UI initialization.
