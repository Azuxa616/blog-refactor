# Learnings - obsidian-blog-sync

## 2026-07-19 Session Start
- `gh` CLI is NOT installed on this machine. GitHub repo creation must be done via web browser.
- Notes repo: `F:\MarkDown\Markdown_Repository` (Azuxa616/Markdown_Repository, private, main)
- Blog repo: `F:\MyProjects\blog-Azx616\blog-refactor` (local only, NO remote)
- Obsidian attachment path: `zob-source/images/` (from .obsidian/app.json)
- Blog content schema: title/slug/description/publishDate/category required (src/content.config.ts)
- Blog markdown pipeline: remarkMath→remarkGfm→remarkEmoji→remarkCallout→remarkToc→rehypeSlug→rehypeAutolinkHeadings→rehypeExternalLinks→rehypeCodeHeader→rehypeKatex→rehypePresetMinify
- No mermaid plugin currently. Need rehype-mermaid with strategy: 'pre-mermaid' (client-side)
- Project uses pnpm, no semicolons, single quotes, @/ alias
- No Vitest/test framework installed

## 2026-07-19 Mermaid Integration
- `rehype-mermaid` 依赖 `mermaid-isomorphic`，后者硬依赖 Playwright（构建时渲染）
- `rehype-mermaid` 的 `pre-mermaid` 策略虽然支持客户端渲染，但仍会加载 `mermaid-isomorphic`
- 使用 `rehype-mermaid-lite` 代替 `rehype-mermaid`，无需 Playwright，纯客户端渲染
- 客户端 mermaid.js 从 CDN 加载：`https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs`
- 在 Astro markdown 配置中排除 mermaid 语言的高亮：`markdown.syntaxHighlight.excludeLangs: ['mermaid']`
- rehype-mermaid-lite 在 rehypePlugins 中的正确位置：在 rehypeSlug 之前
- dark mode 配置：在 Layout.astro 中 `mermaid.initialize({ theme: 'dark' })`

## 2026-07-19 Schema and Config (T5)
- Created 4 Zod schemas in `scripts/sync-to-blog/src/schemas.js`: ManifestEntrySchema, ManifestSchema, LLMOutputSchema, BlogPostFrontmatterSchema
- BlogPostFrontmatterSchema vendors a copy of the blog's schema (11 fields: title, slug, description, publishDate, updatedDate, category, tags, coverImage, isRepost, originalAuthor, originalLink)
- Critical: `z.coerce.date()` required for date fields to match blog's schema
- Config uses deep merge strategy: defaults in `config.js`, user overrides in `.blog-sync/config.json`
- Manifest structure: version 1, entries array, updatedAt datetime
- Config includes LLM settings (model, cost limits) and sync settings (max notes, repo paths)
- Schema coupling documented in `docs/schema-coupling.md` - requires manual update when blog schema changes

## 2026-07-19 14:47 Parser and Transformer (T6)
- Used regex preprocessing + unified pipeline hybrid approach for transformer (regex does the actual Obsidian-specific transforms, unified normalizes via parse+stringify)
- remark-parse parses ![[xxx.png]] and [[note]] as plain text nodes (not standard Markdown syntax), making regex preprocessing the natural choice
- unified's remark-stringify escapes [[ to \[\[ because bare [[ could be interpreted as link syntax; rendered output still shows as [[...]] visually
- gray-matter returns content with a leading newline after the frontmatter delimiter — tests need multiline regex or substring match, not ^...
- alidatePublishMarker must use strict equality === true to reject truthy values like 'true', 1, 'yes'
- Wikilink slug resolution: [[My Cool Note]] → slugify → my-cool-note; strip .md extension before slugifying
- Image regex must run BEFORE wikilink regex, or ![[x]] gets partially consumed by wikilink [[x]] pattern (used negative lookbehind (?<!!) in WIKILINK_REGEX as extra safety)
- pnpm strict mode would normally block direct imports of transitive deps like unist-util-visit; avoided by using regex instead of custom remark plugins
- Node 24 
ode --test test/ tries to import the directory as a module; correct invocation is 
ode --test (auto-discovery) or explicit file paths
- Section/block references ([[note#section]], [[note^block]]) are preserved as-is with warnings (v1 limitation per spec)
- Frontmatter mapping only strips publish field; LLM-inferred metadata (slug, description, category) is merged by upstream caller before transform
- All 45 tests pass (17 parser + 28 transformer)

## 2026-07-19 LLM Metadata Inference (T7)
- pinyin-pro API: `pinyin(text, { type: 'array', toneType: 'none' })` returns `string[]`; default returns space-separated string. Must use `type: 'array'` to `.join('-')`.
- pinyin-pro leaves non-Chinese chars (emojis, symbols) as-is, so `slugify()` of those produces empty string → triggers hash fallback (step 5) naturally.
- AbortController pattern for fetch timeout: `const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), ms); try { ... } finally { clearTimeout(timer) }` — must clear in `finally` to avoid hanging timers on success.
- Zod `.parse()` throws `ZodError` on validation failure — caught generically in the retry loop; `.name === 'AbortError'` distinguishes timeouts from validation errors in user-facing warnings.
- Token estimation (rough): input ≈ prompt.length / 4, output ≈ response.length / 4 — sufficient for budget tracking; real usage would parse `data.usage.total_tokens` if API provides it.
- Dependency injection pattern for testability: `callLLMFn = callLLM` as default parameter; tests pass a mock function. Avoids `fetch` mocking complexity.
- LLM JSON parsing must handle 3 forms: bare JSON, ```json fenced, JSON embedded in prose (regex `\{[\s\S]*\}` fallback).
- 6-step chain order is strict: cache → ASCII → LLM (retry+cost) → pinyin → hash → uniqueness. Uniqueness applies to ALL paths (including cached and ASCII).
- Cache hit returns `fromCache: true` but still re-runs uniqueness check against current `allSlugs` (slug may have collided since last sync).
- Pre-existing test failure: `test/images.test.js:299` "copyImages: dedupes" fails on Windows due to path separator mismatch (`\` vs `/`). NOT my task — needs separate fix.
- All 22 llm tests pass; full suite shows 92/93 (the 1 failure is the Windows path bug above).

## 2026-07-19 Image Handler (T7)
- esolveImagePath uses 3-tier Obsidian resolution: same-dir > zob-source/images > global recursive search (shortest path wins, ties broken by segment count then string length)
- Always merge 
ode_modules + .git into config excludeDirs at call time (config defaults don't include them)
- s.readdirSync(rootPath, { recursive: true }) returns string paths relative to root using platform separator; basename matching + segment-wise excludeDir filter is cross-platform safe
- computeImageHash is async (readFile), so planImageCopy MUST be async too despite spec signature not explicitly marking it Promise
- Spec contradiction warning: planImageCopy destFileName embeds BOTH hash prefix AND original filename (${hash16}-), so "dedupe same-hash files" only triggers when source filename also matches. Two different filenames with identical content produce DIFFERENT destPaths (no dedup). True content-addressing would use only hash; spec opted for human-readable names with hash-prefixed collision avoidance.
- copyImages dryRun still does existsSync read (allowed) but skips mkdir AND copyFile (no writes). Returns planned paths in written to communicate intent.
- In-batch dedup works because copyFile writes synchronously-before-next-iteration: second plan with same destPath sees it exists and skips.
- indOrphanImages semantics: orphans = (all images across ALL manifest entries) - (images in entries where slug �� currentNoteSlugs). An image referenced by ANY published note is NOT an orphan, even if also referenced by unpublished notes.
- alidateImageFormat extracts ext via path.extname().slice(1).toLowerCase() �� case-insensitive, throws Error (not silent) per spec.
- All 26 new tests pass; total suite 93 tests pass (no regressions in parser/transformer/inferMetadata/CostTracker).

## 2026-07-19 Manifest State Manager (T13)
- ManifestSchema 校验语义：publishedAt/lastSyncedAt 必须是 Zod datetime（含时区后缀 Z），contentHash/transformedHash 为任意字符串，slug 强制小写+连字符正则。
- loadManifest 在 ENOENT 时调用 saveManifestAtomic 写默认空 manifest，再返回——递归自调用是安全的（默认对象一定能通过校验）。
- saveManifestAtomic 原子写入三步：write .tmp → rename → 重读校验。try/catch 包住 write/rename 阶段，失败时 unlink .tmp 并 rethrow；校验失败不在 cleanup 路径内（此时文件已 rename 成功）。
- applyChanges 不可变更新：先 filter 出未移除条目，再 map 做条件更新（按 notePath 匹配 updatedByPath Map），最后 spread added；返回 {...manifest, entries, updatedAt}。共享未变条目的引用是安全的（只要不 mutate）。
- updated 字段选择性覆盖：spec 要求仅替换 contentHash/transformedHash/lastSyncedAt/llmResult/blogImagePath；notePath/slug/publishedAt 必须保留。用条件 spread 处理可选字段（...(x !== undefined ? {x} : {})）以避免用 undefined 覆盖默认值。
- validateManifestIntegrity 用同步 fs.existsSync，返回字符串数组而非抛错——纯只读检查函数。
- 跨平台 failure 测试：在 os.tmpdir() 下 mkdtemp 创建临时工作区，再构造 nonexistent-subdir/manifest.json 触发 ENOENT；Windows 上 fs.rename 到目录路径会失败（EPERM/ENOTDIR），可用于测 .tmp 清理。
- node:test 中没有 beforeEach/afterEach，每个 test 用 mkdtemp 生成独立临时目录避免相互污染。
- All 25 manifest tests pass; lsp_diagnostics clean on both files.

## 2026-07-19 Notes Template Migration
- Notes repo template file: `F:\MarkDown\Markdown_Repository\template\通用笔记模板.md`
- Changed frontmatter field `published:` → `publish:` with YAML comment
- No changes to `template\通用日记模板.md` (doesn't have frontmatter)
- Migration report created at `docs/published-field-migration.md` with 11 affected files
- Added "Blog Sync" section to notes repo README
- Commit: `01dc41e` - "chore(template): rename frontmatter field published → publish and document sync flow"
- PowerShell grep pattern: `Get-ChildItem -Recurse -Filter '*.md' | Select-String -Pattern '^published:' | Select-Object -ExpandProperty Path`
- Required UTF-8 encoding for proper Chinese character display in PowerShell output
## 2026-07-19 PR Creator (T14)
- @octokit/rest v21 API: `octokit.rest.pulls.list/create/update({...})`, `octokit.rest.issues.addLabels({...})`, `octokit.rest.repos.compareCommitsWithBasehead({...})` — NOT generic `octokit.request()`. REST namespace is the modern pattern.
- PR labels via `issues.addLabels` (PRs are issues in GitHub REST). `pulls.create` does NOT accept labels param.
- `compareCommitsWithBasehead` uses `basehead: 'main...branchName'` (3 dots). Returns `{ data: { behind_by, ahead_by, status } }`.
- `sanitizeError` pattern: redact `gh[pousr]_xxx`, `token=xxx`, `access_token=xxx`, `Authorization: xxx`, `bearer xxx` via regex replace to `[REDACTED]`. Preserve status code and host/diagnostic info. Critical because Octokit errors may serialize request URL/headers into message.
- Label-adding is treated as NON-fatal after PR creation: caught + `console.warn`, PR number still returned. Rationale: PR creation is the main goal; labels can be manually applied later. This is a deliberate soft-failure design.
- `findOpenSyncPR` filters client-side by `head.ref.startsWith('sync/')` OR labels contains `'sync-to-blog'`. GitHub's `pulls.list` returns labels by default — no extra fetch needed.
- `ensureBranchUpToDate` semantics: stale iff `behind_by > 5` (STALE_BEHIND_THRESHOLD). Exactly 5 is OK (boundary inclusive). Returns `{ stale: false, behindBy: 0 }` on healthy, `{ stale: true, behindBy: N }` on stale. Caller handles close+recreate.
- Mock Octokit pattern: object literal `{ rest: { pulls: { list, create, update }, issues: { addLabels }, repos: { compareCommitsWithBasehead } } }` + `_calls` array. Cleaner than mocking the constructor — avoids ESM module mocking complexity.
- Defensive `behind_by` parsing: `Number(...) ?? 0`, reject `NaN` via `Number.isFinite()`. Trust nothing from network.
- Test initial approach used unrealistic error string (`secret_token`) — must use real PAT format (`ghp_xxx`) when testing redaction regex, otherwise regex won't match and tests fail misleadingly.
- Pre-existing failure: `test/blog-git.test.js:490` "pushManifestUpdate: 无变化时返回当前 HEAD" — relies on real git remote which doesn't exist (T1 blocked). NOT my concern.
- All 39 pr tests pass; full adjacent suite (parser/transformer/llm/manifest/images/pr) = 157 tests pass. lsp_diagnostics clean on both new files.
- Code style verified: no semicolons, single quotes, ESM imports, Chinese JSDoc comments — matches project conventions.

## 2026-07-19 CLI Entry Point (T14)
- Commander v12 `.parseAsync(process.argv)` returns Promise, handles async action handlers automatically
- Exit codes: 0 = success/skip, 1 = partial failure (some ops succeeded), 2 = all failed or fatal error
- Successful ops = added + updated + removed (skipped doesn't count)
- --note filter limitation: orchestrator doesn't support single-note filtering; CLI filters output after runSync completes
- --batch-size limitation: orchestrator loads config internally and doesn't accept batch size override via _inject; option accepted but shows warning
- CLI filtering logic: normalize path (path.sep → '/') then check includes() for case-insensitive match
- All 217 tests pass; no regressions from index.js replacement
- simple-git commit signature: commit(message, files?, options?, callback?). Third arg is options object. Pass [] for files when relying on prior git.add to stage. Format: git.commit(msg, [], { '--author': 'name <email>' }).
- simple-git git.add('-A') works - the library just joins args into git add -A. No need for git.raw(['add','-A']).
- simple-git's commit returns { commit, branch, summary, root }. commit is the full 40-char hash. **Caveat**: when git exits 0 with "nothing to commit", esult.commit can be empty string/undefined — must fall back to git.raw(['rev-parse', 'HEAD']).trim().
- **Regex chaining anti-pattern**: Using multiple sequential .replace() calls with overlapping patterns causes the second regex to consume the first regex's output. E.g., eplace(/x-access-token:[^@]+@/, 'x-access-token:***@').replace(/(https?:\/\/)[^/@:]+:[^/@]+@/, '***:***@') — the second regex matches x-access-token:***@ and re-replaces it. **Fix**: use single-pass regex with callback function that decides replacement based on capture group value.
- Windows cmd.exe + child_process.execSync pitfalls: < and > are I/O redirection, ' is literal (NOT a quote). --format='%an <%ae>' is interpreted as: literal '%an  followed by input-redirect from file %ae> (env var nonexistent). **Fix**: use --pretty=format:%an and --pretty=format:%ae as two separate calls, then concatenate. Avoids all special chars.
- simple-git checkout on Windows: git.checkoutBranch('name', 'from') works fine for local branches. Bare repo clone from local file path works without ile:// prefix.
- s.rmSync/sp.rm({ force: true }) silently skips ENOENT — perfect for deleteFiles semantics.
- git status from simple-git returns object with arrays: staged, created, modified, deleted, 
ot_added, conflicted. To detect any-pending-change, check union of these.
- Exponential backoff pattern: BACKOFF_BASE_MS * Math.pow(2, attempt-1) gives 1s, 2s, 4s for attempts 1/2/3.
- Tests using local bare git repos: git init --bare <path> + work repo with git remote add origin <bare-path> + git push -u origin main. Use mkdtempSync for isolated temp dirs (auto-cleanup on test run end via OS, no manual cleanup needed).
- All 25 blog-git tests + 23 pr-body tests pass; full suite 205 tests pass (no regressions).
- Deploy gap warning text includes full-width Chinese punctuation (。): 合并此 PR 不会自动部署博客。请手动执行部署步骤。 — test regex uses alternation \.|。 to handle both ASCII and CJK periods for forward-compat.
- TODO comment convention: // TODO: verify with actual GitHub remote after T1 marks tests/code paths that need real GitHub remote validation (deferred per T1 blocked status).
