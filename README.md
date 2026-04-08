# SuperTags — Tana-style supertags for Obsidian

> Tag a line, get a structured note. Instantly, on every device.

---

## The problem

Tana users know the feeling: you type a tag on a line and it *becomes* something — a structured node with its own fields, its own shape, its own place in the graph. It's one of the most powerful capture workflows in any PKM tool.

Obsidian doesn't have this natively. Until now.

**SuperTags** brings the supertag model to Obsidian. Write a line, add a tag, and the plugin automatically creates a fully structured note — with the exact frontmatter and body you've defined — and replaces your line with a wikilink. Works on desktop, mobile, and every device synced via Obsidian Sync.

---

## How it works

Write this in your daily note (or any watched folder):

```
- Conway's Law applies to Notion workspaces too #atom
  - orgs mirror their communication structure in the tools they build
  - I've seen this with every consulting client I've worked with
```

After a short pause, SuperTags:

1. **Creates** a structured note in your configured folder with your exact template
2. **Replaces** the tagged line with a `[[wikilink]]`
3. **Shows** an Undo notice in case you change your mind

Your daily note becomes:

```
- [[Conway's Law applies to Notion workspaces too]]
```

And the new note is ready to develop, fully pre-structured:

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
I've seen this with every consulting client I've worked with

## North
*Where this idea comes from*
-

## West
*What's similar*
-

## East
*What's opposite*
-

## South
*Where this leads*
-
```

---

## Features

### Multiple supertags
Define as many supertags as you need — one per note type. Each supertag is fully independent:

| Supertag | Creates | Template |
|---|---|---|
| `#atom` | Evergreen notes | Zettelkasten / Idea Compass |
| `#project` | Project notes | Goals, milestones, status |
| `#person` | Contact notes | Role, context, last contact |
| `#meeting` | Meeting notes | Agenda, decisions, actions |

You define the tags, the folders, and the templates. SuperTags just makes them happen.

### Visual chips
Every supertag renders as a colored chip in the editor — the same visual language as Tana. You see at a glance what type of note a line will become. The chip disappears when your cursor is on the line so you can edit without friction.

### Undo
Made a mistake? Every creation comes with an **Undo** button that lasts 8 seconds. One click deletes the created note and restores your original line exactly as it was.

### Sub-bullets become content
Anything indented under the tagged line becomes the body of the created note. Use it to capture context, links, and initial thoughts — they'll be waiting for you when you open the note.

### Works everywhere
SuperTags runs entirely inside Obsidian. No external scripts, no background processes, no server. It works on Mac, Windows, Linux, and iOS/Android via Obsidian Sync.

---

## Settings

### Global
| Setting | Default | Description |
|---|---|---|
| Watch folders | `Calendar/` | Comma-separated folders monitored for supertags |
| Debounce delay | `2000ms` | How long after your last keystroke before processing runs |

### Per supertag
| Field | Description |
|---|---|
| Tag | The trigger tag (e.g. `#atom`) |
| Name | Human-readable label shown in settings |
| Color | Chip color in the editor |
| Destination folder | Where the created note will be saved |
| Frontmatter template | YAML frontmatter for the created note |
| Body template | Content structure for the created note |

### Template variables
Use these in your frontmatter and body templates:

| Variable | Output |
|---|---|
| `{{title}}` | The line text (without the tag) |
| `{{date}}` | Creation date in `YYYY-MM-DD` format |
| `{{dateLink}}` | Creation date in `DD-MM-YYYY` format (for wikilinks) |
| `{{content}}` | Sub-bullets collected under the tagged line |

---

## Installation

### Beta (via BRAT)
SuperTags is currently in beta. To install:

1. Install [BRAT](https://github.com/TfTHacker/obsidian42-brat) from the Community Plugins browser
2. Open BRAT settings → **Add Beta Plugin**
3. Paste: `dandele/obsidian-atom-creator`
4. Click **Add Plugin** — BRAT handles updates automatically

### Manual
1. Download `main.js`, `manifest.json`, and `versions.json` from the [latest release](https://github.com/dandele/obsidian-atom-creator/releases/latest)
2. Copy the files to `.obsidian/plugins/supertags/` in your vault
3. Enable **SuperTags** in Settings → Community Plugins

---

## Comparison with Tana

| Feature | Tana | SuperTags |
|---|---|---|
| Tag triggers note creation | ✓ | ✓ |
| Custom templates per tag | ✓ | ✓ |
| Visual chip in editor | ✓ | ✓ |
| Sub-content becomes note body | ✓ | ✓ |
| Works on mobile | ✓ | ✓ |
| Undo creation | ✗ | ✓ |
| Inline field editing | ✓ | Planned |
| Tag queries / views | ✓ | Via Obsidian Bases |
| Block-level graph | ✓ | Note-level via links |
| Local-first, self-hosted | ✗ | ✓ |

Tana is a remarkable tool. SuperTags doesn't try to replicate it entirely — it brings the most valuable capture mechanic to Obsidian, where your notes live in plain markdown files you own forever.

---

## Roadmap

- [ ] Inline field editing (click a chip → edit frontmatter fields inline)
- [ ] Tag autocomplete in the editor
- [ ] Multi-device undo history
- [ ] Import/export supertag definitions

---

## Contributing

Issues and PRs welcome at [dandele/obsidian-atom-creator](https://github.com/dandele/obsidian-atom-creator).

If SuperTags is useful to you, consider starring the repo — it helps surface the plugin to other Obsidian users who'd benefit from it.

---

## License

MIT © [Daniele D'Amico](https://github.com/dandele)
