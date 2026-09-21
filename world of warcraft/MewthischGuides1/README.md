# Mewthisch Guides 1.0

Clean-room rebuild of Mewthisch Guides around a semantic **Guide → Step → Goals**
runtime. The only guide source is the transformed public RestedXP
Forever/Survival dataset packaged in \`Data/\`.

The design follows the strongest architectural and UX lessons from mature guide
addons without copying proprietary code, assets or text.

## Architecture

~~~text
RestedXP structured data
        ↓
RestedXPParser
        ↓
GuideCompiler
        ↓
CompiledGuide → CompiledStep → CompiledGoal
        ↓
Facts (player / quest / inventory / position)
        ↓
Requirement / Visibility / Completion resolvers
        ↓
GoalState[] + StepState
        ↓
RuntimeStore (one RuntimeRevision)
        ↓
ViewerProjection / DestinationGoal / Navigator / diagnostics
~~~

### Core rules

- RestedXP raw-step boundaries are preserved exactly.
- A current step may contain multiple equally active goals.
- Sticky steps are runtime state parallel to the current step.
- Consumers never decide completion or visibility themselves.
- Initial state is not a completion transition.
- DestinationGoal and route/waypoint are separate concepts.
- Navigation arrival never completes a kill/collect goal.
- The engine has no level-20 cap. Available RestedXP data determines coverage.
- Unknown completion semantics fail closed and expose reason codes.

## First 1.0 development slice

Implemented:

- isolated current RestedXP transformed dataset
- RestedXP selector/tag evaluator
- raw parser
- CompiledGuide / CompiledStep / CompiledGoal
- guide catalog and suggestion scoring
- guide sessions and sticky tracking
- centralized quest/inventory/position facts
- RequirementResolver
- VisibilityResolver
- CompletionResolver
- GoalStateResolver
- StepStateResolver
- NavigationTargetResolver
- RuntimeStore with monotonic RuntimeRevision
- semantic TransitionDetector
- ViewerProjection
- recovery/resume policy
- compact in-game guide viewer
- navigator panel
- copyable diagnostics/error window
- \`/mg1\` development commands

Next slices deepen RestedXP directive semantics, waypoint/world-coordinate
conversion, route planning, guide browser, polished Zygor-like presentation,
safe quest automation, action buttons and full explainability.

## Commands

- \`/mg1\`
- \`/mg1 status\`
- \`/mg1 guides\`
- \`/mg1 start <guide-id>\`
- \`/mg1 next\`
- \`/mg1 prev\`
- \`/mg1 refresh\`
- \`/mg1 errors\`

## Data licensing

See \`THIRD_PARTY_NOTICES.md\`.
