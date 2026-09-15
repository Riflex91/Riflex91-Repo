# Smartphone Clientless

Android-first, browser-free runtime for the AiO v3 bot.

## Status

The complete `v3/` implementation is mirrored under `smartphone-clientless/v3/` as the behavior baseline. Do not edit the original `v3/` while porting: clientless-specific work belongs here.

The original v3 `GameAdapter` reads Adventure Land browser globals (`character`, `parent.entities`, `G`) and invokes browser functions (`attack`, `move`, `smart_move`, `use_skill`, ...). Those dependencies must not exist in the final smartphone runtime.

## Architecture

`src/runtime/ClientlessGameAdapter.js` is the compatibility boundary between the copied v3 bot logic and a native/network Adventure Land session. Bot modules continue to consume snapshots and commands; Android/network code supplies state and implements commands through a transport.

`src/runtime/ClientlessSession.js` owns one selected character. A future Android host creates one session per selected character and assigns its Farmer or Merchant role. No WebView is part of this contract.

`src/runtime/CharacterRuntimeManager.js` supervises the selected-character sessions and exposes aggregate status.

## Required transport contract

A transport passed to `ClientlessSession` must implement:

- `connect({ characterName, role })`
- `disconnect()`
- `snapshot()` returning normalized character/entities/objects/party/game state
- `command(action, args)`
- optional `canAttack(targetId)`, `canUseSkill(skillName)`, `isSkillInRange(targetId, skillName)`, `getGameData()`
- optional `status()`

The transport is intentionally injected. Authentication credentials/session tokens must stay in Android secure storage and must never be committed to this repository.

## Porting rule

Copied v3 strategy, Farmer, Merchant, planner, economy and brain logic remains the source behavior. Any direct browser/global access discovered during the port must be replaced by this adapter/session boundary rather than emulated with a hidden WebView.
