# Decisions - obsidian-blog-sync

## 2026-07-19 Planning Decisions
- Trigger: GitHub Actions on notes repo push (not a persistent service)
- Publish marker: `publish: true` in frontmatter (renamed from `published`)
- Output: Cross-repo PR (not auto-merge, for future agent review hook)
- Slug generation: LLM inference with 6-step fallback chain (manifest cache > ASCII slugify > LLM > pinyin > hash > collision suffix)
- State: `.blog-sync/manifest.json` committed to notes repo
- PAT: Fine-grained, contents:write on blog repo only
- Mermaid: rehype-mermaid with pre-mermaid strategy (client-side rendering)
- Image dedup: sha256 content-addressed naming
- publishDate: git first-commit date of the note
- Blog repo visibility: private (consistent with notes repo)
- v1 excludes: Excalidraw, PDF/video/audio, heading/block wikilink refs, agent review hook, deploy automation
