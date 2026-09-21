# Third-party notices

## RestedXP public Forever route data

Mewthisch Guides includes a transformed structured-data extract derived from the
public RestedXP/RXPGuides repository.

- Source: https://github.com/RestedXP/RXPGuides
- Source commit used for this extract:
  \`6f9cf44c09123e496366b3cb5ffe7383660e4bcb\`
- Upstream license: Creative Commons Attribution-NonCommercial-ShareAlike 4.0
  International (CC BY-NC-SA 4.0)
- License: https://creativecommons.org/licenses/by-nc-sa/4.0/
- Upstream license file:
  https://github.com/RestedXP/RXPGuides/blob/6f9cf44c09123e496366b3cb5ffe7383660e4bcb/LICENSE

### What is packaged

\`Data/RestedXPForeverData_01.lua\` through
\`Data/RestedXPForeverData_05.lua\` contain transformed structured directives
from the public Forever/Survival sources. They retain machine-readable facts
such as guide metadata, selectors, conditions, quest IDs, item/spell IDs,
targets, coordinates, travel directives and command arguments.

Narrative guide prose is intentionally not copied into the generated dataset.
The 1.0 rebuild compiles these facts into its own
\`CompiledGuide → CompiledStep → CompiledGoal\` model while preserving RestedXP
raw-step boundaries.

The transformed data remains subject to the applicable CC BY-NC-SA 4.0
attribution, non-commercial and share-alike requirements.

RestedXP is not affiliated with, sponsoring or endorsing Mewthisch Guides.
