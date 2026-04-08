# Atom Creator

An Obsidian plugin that transforms tagged lines into structured atom notes — inspired by Tana's supertags.

## How it works

Write a line with `#atom` in any note inside your configured watch folder (default: `Calendar/`).
Add sub-bullets for context. After a short pause, the plugin automatically:

1. Creates a structured atom note in your notes folder
2. Replaces the tagged line with a `[[wikilink]]`
3. Opens the new atom in a new tab

**Works on all devices** (desktop + mobile) via Obsidian Sync.

## Example

Write this in your daily note:

```
- Conway's Law applies to Notion workspaces too #atom
  - orgs mirror their communication structure in the tools they build
  - seen this with every Paradygma client
```

After 2 seconds, it becomes:

```
- [[Conway's Law applies to Notion workspaces too]]
```

And a new note is created in `Notes/` with the full atom template:

```markdown
---
type:
  - atom
status:
  - seedling
up: []
created: 2026-04-08
day: "[[08-04-2026]]"
---

> Conway's Law applies to Notion workspaces too

orgs mirror their communication structure in the tools they build
seen this with every Paradygma client

## North
*Where X comes from*
-
...
```

## Settings

| Setting | Default | Description |
|---|---|---|
| Watch folder | `Calendar/` | Folder monitored for the atom tag |
| Notes folder | `Notes/` | Folder where atom notes are created |
| Atom tag | `#atom` | Tag that triggers atom creation |
| Debounce delay | `2000` ms | Wait time after last edit before processing |

## Installation

### From Community Plugins
Search for "Atom Creator" in Settings → Community Plugins.

### Manual
1. Download `main.js` and `manifest.json` from the latest release
2. Copy to `.obsidian/plugins/atom-creator/` in your vault
3. Enable the plugin in Settings → Community Plugins

## Development

```bash
npm install
npm run dev     # watch mode
npm run build   # production build
```
