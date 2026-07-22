# Issues - obsidian-blog-sync

## 2026-07-19
- `gh` CLI not installed - GitHub repo must be created via browser for T1
- No test framework (Vitest) in blog repo - dry-run mode + node --test for sync tool only

## 2026-07-19 Final Wave
- T1 BLOCKED on user action: must create `Azuxa616/blog-refactor` repo on GitHub, add remote, push, then create fine-grained PAT (`BLOG_REPO_PAT`). All code is ready — this is purely a GitHub web UI + git remote operation.
- Lines 113-119 (Definition of Done) and 2057-2064 (Final Checklist) are nested acceptance/evidence checkboxes — NOT implementation tasks. They will be verified when T1 is completed and real E2E sync can be tested.
