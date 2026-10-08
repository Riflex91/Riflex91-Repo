# Third-party notices

## RestedXP public Forever route data

Mewthisch Guides includes a transformed structured-data extract derived from the
public RestedXP/RXPGuides repository.

- Source: https://github.com/RestedXP/RXPGuides
- Source commit used for this extract:
  `a688a75d595f5884dba8044a5ba4e7d7bd859c09`
- Upstream license: Creative Commons Attribution-NonCommercial-ShareAlike 4.0
  International (CC BY-NC-SA 4.0)
- License: https://creativecommons.org/licenses/by-nc-sa/4.0/
- Upstream license file:
  https://github.com/RestedXP/RXPGuides/blob/a688a75d595f5884dba8044a5ba4e7d7bd859c09/LICENSE

### What was transformed

The files `RestedXPForeverData_01.lua` through
`RestedXPForeverData_05.lua` are generated from the structured directives in
the public Forever/Survival guide sources. They retain machine-readable route
facts such as guide metadata, selectors, conditions, quest IDs, item/spell IDs,
targets, coordinates, travel directives and other command arguments.

Narrative guide prose is intentionally not copied into the generated dataset.
Mewthisch Guides converts the structured facts into its own GuideParser,
StepEngine and RouteEngine model at runtime.

The transformed RestedXP-derived dataset is intended for non-commercial use and
must remain subject to the applicable CC BY-NC-SA 4.0 attribution,
non-commercial and share-alike requirements. This notice identifies the
upstream source and records that the data has been transformed.

RestedXP is not affiliated with, sponsoring or endorsing Mewthisch Guides.


### RestedXP navigation textures

The following navigation textures are redistributed for the selectable navigator
skins under the same RestedXP public-source attribution and license noted above,
from source commit `a688a75d595f5884dba8044a5ba4e7d7bd859c09`:

- `Textures/rxp_navigation_arrow-1.blp`
- `Textures/Hardcore/rxp_navigation_arrow-1.blp`
- `Textures/GoldAssistant/rxp_navigation_arrow-1.blp`

Local packaged names:

- `Assets/ArrowBlue.blp`
- `Assets/ArrowRed.blp`
- `Assets/ArrowOrange.blp`
