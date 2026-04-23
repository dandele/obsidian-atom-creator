var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => AtomCreator
});
module.exports = __toCommonJS(main_exports);
var import_obsidian3 = require("obsidian");

// src/settings.ts
var import_obsidian = require("obsidian");
var DEFAULT_SUPERTAGS = [
  {
    id: "atom",
    tag: "#atom",
    name: "Atom",
    color: "#7c3aed",
    folder: "Notes/",
    frontmatterTemplate: [
      "type:",
      "  - atom",
      "status:",
      "  - seedling",
      "up: []",
      "created: {{date}}",
      'day: "[[{{dateLink}}]]"'
    ].join("\n"),
    bodyTemplate: [
      "> {{title}}",
      "",
      "{{content}}",
      "## North",
      "*Where X comes from*",
      "-",
      "",
      "## West",
      "*What's similar to X*",
      "-",
      "",
      "## East",
      "*What's opposite of X*",
      "-",
      "",
      "## South",
      "*Where this idea can be linked to*",
      "-",
      "",
      "### Reference",
      "-"
    ].join("\n")
  }
];
var DEFAULT_SETTINGS = {
  supertags: DEFAULT_SUPERTAGS,
  debounceMs: 2e3,
  watchFolders: "Calendar/"
};
function randomId() {
  return Math.random().toString(36).slice(2, 8);
}
var AtomCreatorSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian.Setting(containerEl).setName("Watch folders").setDesc("Comma-separated folders monitored for supertags (e.g. calendar/, inbox/).").addText((text) => text.setPlaceholder("Calendar/").setValue(this.plugin.settings.watchFolders).onChange(async (value) => {
      this.plugin.settings.watchFolders = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Debounce delay (ms)").setDesc("Wait time after last edit before processing (minimum 500 ms).").addText((text) => text.setPlaceholder("2000").setValue(String(this.plugin.settings.debounceMs)).onChange(async (value) => {
      const n = parseInt(value);
      if (!isNaN(n) && n >= 500) {
        this.plugin.settings.debounceMs = n;
        await this.plugin.saveSettings();
      }
    }));
    new import_obsidian.Setting(containerEl).setName("Tag definitions").setHeading();
    containerEl.createEl("p", {
      text: "Each supertag defines a trigger tag, a destination folder, and templates for the frontmatter and body of the created note.",
      cls: "setting-item-description"
    });
    const supertagsContainer = containerEl.createDiv();
    this.renderSupertags(supertagsContainer);
    new import_obsidian.Setting(containerEl).addButton((btn) => btn.setButtonText("+ Add supertag").setCta().onClick(async () => {
      this.plugin.settings.supertags.push({
        id: randomId(),
        tag: "#newtag",
        name: "New tag",
        color: "#0ea5e9",
        folder: "Notes/",
        frontmatterTemplate: "type:\n  - note\ncreated: {{date}}",
        bodyTemplate: "> {{title}}\n\n{{content}}"
      });
      await this.plugin.saveSettings();
      this.display();
    }));
  }
  renderSupertags(container) {
    container.empty();
    for (const [index, supertag] of this.plugin.settings.supertags.entries()) {
      const card = container.createDiv({ cls: "st-card" });
      const header = card.createDiv({ cls: "st-card-header" });
      const chip = header.createEl("span", { cls: "st-settings-chip" });
      chip.textContent = supertag.tag;
      chip.setCssProps({ "--st-chip-bg": supertag.color });
      const deleteBtn = header.createEl("button", { text: "\u2715 Remove", cls: "st-delete-btn" });
      deleteBtn.onclick = () => void (async () => {
        this.plugin.settings.supertags.splice(index, 1);
        await this.plugin.saveSettings();
        this.display();
      })();
      const row1 = card.createDiv({ cls: "st-grid-2" });
      this.inlineInput(row1, "Tag", supertag.tag, async (v) => {
        supertag.tag = v.startsWith("#") ? v : "#" + v;
        chip.textContent = supertag.tag;
        await this.plugin.saveSettings();
        this.plugin.refreshDecorations();
      });
      this.inlineInput(row1, "Name", supertag.name, async (v) => {
        supertag.name = v;
        await this.plugin.saveSettings();
      });
      const row2 = card.createDiv({ cls: "st-grid-color" });
      const colorWrap = row2.createDiv();
      colorWrap.createEl("small", { text: "Color", cls: "setting-item-description" });
      const colorInput = colorWrap.createEl("input", { type: "color" });
      colorInput.addClass("st-color-input");
      colorInput.value = supertag.color;
      colorInput.oninput = () => void (async () => {
        supertag.color = colorInput.value;
        chip.setCssProps({ "--st-chip-bg": supertag.color });
        await this.plugin.saveSettings();
        this.plugin.refreshDecorations();
      })();
      this.inlineInput(row2, "Destination folder", supertag.folder, async (v) => {
        supertag.folder = v.endsWith("/") ? v : v + "/";
        await this.plugin.saveSettings();
      });
      this.inlineTextarea(card, "Frontmatter template", supertag.frontmatterTemplate, async (v) => {
        supertag.frontmatterTemplate = v;
        await this.plugin.saveSettings();
      });
      this.inlineTextarea(card, "Body template", supertag.bodyTemplate, async (v) => {
        supertag.bodyTemplate = v;
        await this.plugin.saveSettings();
      });
      card.createEl("small", {
        text: "Variables: {{title}}, {{date}} (YYYY-MM-DD), {{dateLink}} (DD-MM-YYYY), {{content}} (sub-bullets)",
        cls: "setting-item-description"
      });
    }
  }
  inlineInput(container, label, value, onChange) {
    const wrap = container.createDiv();
    wrap.createEl("small", { text: label, cls: "setting-item-description" });
    const input = wrap.createEl("input", { type: "text" });
    input.addClass("st-full-input");
    input.value = value;
    input.oninput = () => {
      void onChange(input.value);
    };
  }
  inlineTextarea(container, label, value, onChange) {
    const wrap = container.createDiv({ cls: "st-textarea-wrap" });
    wrap.createEl("small", { text: label, cls: "setting-item-description" });
    const ta = wrap.createEl("textarea");
    ta.addClass("st-textarea");
    ta.value = value;
    ta.rows = 4;
    ta.oninput = () => {
      void onChange(ta.value);
    };
  }
};

// src/processor.ts
var import_obsidian2 = require("obsidian");
function renderTemplate(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    var _a;
    return (_a = vars[key]) != null ? _a : "";
  });
}
function buildNote(supertag, title, subLines) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const dateLink = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;
  const content = subLines.length ? subLines.join("\n") + "\n\n" : "";
  const vars = { title, date, dateLink, content };
  const frontmatter = renderTemplate(supertag.frontmatterTemplate, vars);
  const body = renderTemplate(supertag.bodyTemplate, vars);
  return `---
${frontmatter}
---

${body}
`;
}
function showUndoNotice(action, vault, workspace) {
  for (const created of action.created) {
    const fragment = document.createDocumentFragment();
    const container = fragment.createEl("div", { cls: "st-notice-container" });
    const header = container.createEl("div", { cls: "st-notice-header" });
    const chip = header.createEl("span", { cls: "st-notice-chip" });
    chip.textContent = created.supertag.tag;
    chip.setCssProps({ "--st-chip-bg": created.supertag.color });
    header.createEl("span", { text: `"${created.title}"` });
    const btnRow = container.createEl("div", { cls: "st-notice-btn-row" });
    const viewBtn = btnRow.createEl("button", { text: "Open", cls: "st-notice-btn" });
    const undoBtn = btnRow.createEl("button", { text: "Undo", cls: "st-notice-btn" });
    const notice = new import_obsidian2.Notice(fragment, 8e3);
    viewBtn.onclick = () => void (async () => {
      const file = vault.getAbstractFileByPath(created.path);
      if (file instanceof import_obsidian2.TFile) {
        const leaf = workspace.getLeaf("tab");
        await leaf.openFile(file);
      }
      notice.hide();
    })();
    undoBtn.onclick = () => void (async () => {
      notice.hide();
      await undoAction(action, vault);
    })();
  }
}
async function undoAction(action, vault) {
  for (const created of action.created) {
    const file = vault.getAbstractFileByPath(created.path);
    if (file instanceof import_obsidian2.TFile) {
      await vault.delete(file);
    }
  }
  const sourceFile = vault.getAbstractFileByPath(action.filePath);
  if (sourceFile instanceof import_obsidian2.TFile) {
    await vault.modify(sourceFile, action.originalContent);
  }
  new import_obsidian2.Notice("\u21A9 Undo successful");
}
async function processFile(file, settings, vault, workspace) {
  var _a, _b, _c;
  let content;
  try {
    content = await vault.read(file);
  } catch (e) {
    return;
  }
  const originalContent = content;
  const lines = content.split("\n");
  let modified = false;
  let i = 0;
  const created = [];
  while (i < lines.length) {
    const line = lines[i];
    const matchedTag = settings.supertags.find(
      (st) => line.toLowerCase().includes(st.tag.toLowerCase())
    );
    if (!matchedTag) {
      i++;
      continue;
    }
    const tagRegex = new RegExp(matchedTag.tag.replace(/[#.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const title = line.replace(/^[\s*+>-]+/, "").replace(tagRegex, "").trim();
    if (!title) {
      i++;
      continue;
    }
    const notePath = matchedTag.folder + title + ".md";
    if (vault.getAbstractFileByPath(notePath)) {
      i++;
      continue;
    }
    const baseIndent = ((_a = line.match(/^(\s*)/)) != null ? _a : ["", ""])[1].length;
    const subLines = [];
    let lastSub = i;
    let j = i + 1;
    while (j < lines.length) {
      const sub = lines[j];
      if (sub.trim() === "") {
        j++;
        continue;
      }
      if (((_b = sub.match(/^(\s*)/)) != null ? _b : ["", ""])[1].length <= baseIndent)
        break;
      subLines.push(sub.replace(/^[\s*+>-]+/, "").trim());
      lastSub = j;
      j++;
    }
    try {
      await vault.create(notePath, buildNote(matchedTag, title, subLines));
    } catch (e) {
      i++;
      continue;
    }
    created.push({ path: notePath, supertag: matchedTag, title });
    const prefix = ((_c = line.match(/^(\s*[*+-]?\s*)/)) != null ? _c : ["", ""])[1];
    lines.splice(i, lastSub - i + 1, `${prefix}[[${title}]]`);
    modified = true;
    i++;
  }
  if (!modified)
    return;
  await vault.modify(file, lines.join("\n"));
  const action = { filePath: file.path, originalContent, created };
  showUndoNotice(action, vault, workspace);
}

// src/decorations.ts
var import_view = require("@codemirror/view");
var import_state = require("@codemirror/state");
var SupertagChip = class extends import_view.WidgetType {
  constructor(label, color) {
    super();
    this.label = label;
    this.color = color;
  }
  toDOM() {
    const chip = document.createElement("span");
    chip.className = "atom-creator-chip";
    chip.textContent = this.label;
    chip.setCssProps({ "--st-chip-bg": this.color });
    return chip;
  }
  eq(other) {
    return other.label === this.label && other.color === this.color;
  }
  ignoreEvent() {
    return true;
  }
};
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function buildSupertagPlugin(getSupertags) {
  return import_view.ViewPlugin.fromClass(
    class {
      constructor(view) {
        this.decorations = this.build(view);
      }
      update(update) {
        if (update.docChanged || update.viewportChanged || update.selectionSet) {
          this.decorations = this.build(update.view);
        }
      }
      build(view) {
        const supertags = getSupertags();
        if (!supertags.length)
          return import_view.Decoration.none;
        const builder = new import_state.RangeSetBuilder();
        const cursorLine = view.state.doc.lineAt(
          view.state.selection.main.head
        ).number;
        const matches = [];
        for (const { from, to } of view.visibleRanges) {
          let pos = from;
          while (pos <= to) {
            const line = view.state.doc.lineAt(pos);
            if (line.number !== cursorLine) {
              const lineText = line.text;
              for (const tag of supertags) {
                const re = new RegExp(escapeRegex(tag.tag), "gi");
                let m;
                while ((m = re.exec(lineText)) !== null) {
                  matches.push({
                    from: line.from + m.index,
                    to: line.from + m.index + m[0].length,
                    tag
                  });
                }
              }
            }
            if (line.to >= to)
              break;
            pos = line.to + 1;
          }
        }
        matches.sort((a, b) => a.from - b.from);
        let lastTo = -1;
        for (const { from, to, tag } of matches) {
          if (from < lastTo)
            continue;
          builder.add(
            from,
            to,
            import_view.Decoration.replace({
              widget: new SupertagChip(tag.tag, tag.color)
            })
          );
          lastTo = to;
        }
        return builder.finish();
      }
    },
    { decorations: (v) => v.decorations }
  );
}

// src/main.ts
var AtomCreator = class extends import_obsidian3.Plugin {
  constructor() {
    super(...arguments);
    this.debounceMap = {};
    this.processing = /* @__PURE__ */ new Set();
    this.editorExtension = [];
  }
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new AtomCreatorSettingTab(this.app, this));
    this.editorExtension = [buildSupertagPlugin(() => this.settings.supertags)];
    this.registerEditorExtension(this.editorExtension);
    this.registerEvent(
      this.app.vault.on("modify", (file) => {
        if (!(file instanceof import_obsidian3.TFile))
          return;
        if (!this.isWatched(file.path))
          return;
        if (this.processing.has(file.path))
          return;
        clearTimeout(this.debounceMap[file.path]);
        const run = async () => {
          this.processing.add(file.path);
          try {
            await processFile(file, this.settings, this.app.vault, this.app.workspace);
          } finally {
            setTimeout(() => this.processing.delete(file.path), 1e3);
          }
        };
        this.debounceMap[file.path] = setTimeout(() => void run(), this.settings.debounceMs);
      })
    );
    console.debug("SuperTags loaded");
  }
  onunload() {
    Object.values(this.debounceMap).forEach(clearTimeout);
  }
  isWatched(path) {
    const folders = this.settings.watchFolders.split(",").map((f) => f.trim()).filter(Boolean);
    return folders.some((f) => path.startsWith(f));
  }
  // Called from SettingTab when tag or color changes
  refreshDecorations() {
    this.app.workspace.updateOptions();
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    if (!Array.isArray(this.settings.supertags)) {
      this.settings.supertags = DEFAULT_SETTINGS.supertags;
    }
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
