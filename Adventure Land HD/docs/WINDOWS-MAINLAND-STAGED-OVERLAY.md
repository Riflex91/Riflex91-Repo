# Windows Mainland staged overlay

This updater is the local handoff path for the complete Adventure Land HD Mainland staging set. It does not merge or activate the 46 new candidates in the repository manifest.

## Safety model

The updater derives the pinned upstream commit from UPSTREAM.lock.json, requires the real Adventure Land checkout to remain on that exact commit, creates a detached temporary worktree, and builds and verifies the complete staging set there first.

It never runs git reset --hard, git clean, or a permanent git config --global command. Git safe-directory settings are passed only through temporary environment variables inherited by the updater's child processes.

After staging succeeds, it writes only the managed ALHD surface into the real checkout:

- js/adventure-land-hd-manifest.js
- js/adventure-land-hd-bootstrap.js
- exactly 48 staged files below images/alhd/
- the two ALHD script tags next to the existing data.js tag in htmls/index.html

The real index.html is patched in place rather than replaced by the clean worktree copy. Existing files touched by the updater are backed up inside the temporary workspace and restored if copying or final verification fails.

## Usage

From the repository checkout on Windows, run:

Adventure Land HD\tools\windows\Prepare-Mainland-Staged-Overlay.cmd

The script auto-detects a sibling adventureland checkout, matching the normal D:\ALHD-Test\Riflex91-Repo plus D:\ALHD-Test\adventureland layout.

An explicit checkout can be supplied:

Prepare-Mainland-Staged-Overlay.cmd -UpstreamPath "D:\ALHD-Test\adventureland"

Validation-only mode builds and verifies the 48-asset staging set without modifying the real checkout:

Prepare-Mainland-Staged-Overlay.cmd -CheckOnly

Use -KeepWorkspace when the generated reports, promotion manifests, and staged PNGs should remain available for inspection.

## Scope

The staged set contains 14 Mainland terrain sheets plus 34 NPC, cosmetic, monster and target sheets. Doors and Jubchan retain their already validated pilot assets; the remaining candidates are deterministic technical baselines. This is a presentation-only staging path and does not change gameplay, geometry, collision, networking, server behavior, or persistence.
