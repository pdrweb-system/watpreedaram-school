---
name: ui-ux-pro-max
description: "UI/UX design intelligence for web, mobile, and desktop. This skill should be used when designing, building, reviewing, or fixing interfaces, including pages, components, design systems, accessibility, interaction, responsive layout, typography, color, charts, and stack-specific UI implementation. Searchable local data: 80 searchable styles (51 active), 192 product palettes and reasoning profiles, 74 font pairings, 120 UX guidelines, 105 icons, 17 GSAP presets, 25 chart types, and 22 stacks."
---

# UI/UX Pro Max (Claude Code entry point)

This repository keeps one copy of the skill, in `.agents/skills/ui-ux-pro-max/`, where Codex reads it. That folder holds the instructions, the search script and the data. This file only points Claude Code there.

1. Read `.agents/skills/ui-ux-pro-max/SKILL.md` and follow it.
2. Paths in that file (`scripts/search.py`, `references/...`) are relative to `.agents/skills/ui-ux-pro-max/`. From the repository root, run the search as:

   ```bash
   python .agents/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain <domain>
   ```

3. For this school website, use only the skill's style and UX guidance. Keep the colors, fonts and other rules in the "ดีไซน์" section of `CLAUDE.md`, even when the skill suggests another palette or font pairing.
