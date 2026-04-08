import { App, Plugin, PluginSettingTab, Setting, Notice, TFile, TAbstractFile } from 'obsidian';

interface AtomCreatorSettings {
	watchFolder: string;
	notesFolder: string;
	debounceMs: number;
	atomTag: string;
}

const DEFAULT_SETTINGS: AtomCreatorSettings = {
	watchFolder: 'Calendar/',
	notesFolder: 'Notes/',
	debounceMs: 2000,
	atomTag: '#atom',
};

export default class AtomCreator extends Plugin {
	settings: AtomCreatorSettings;
	private debounceMap: Record<string, ReturnType<typeof setTimeout>> = {};
	private processing: Set<string> = new Set();

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new AtomCreatorSettingTab(this.app, this));

		this.registerEvent(
			this.app.vault.on('modify', (file: TAbstractFile) => {
				if (!(file instanceof TFile)) return;
				if (!file.path.startsWith(this.settings.watchFolder)) return;
				if (this.processing.has(file.path)) return;

				clearTimeout(this.debounceMap[file.path]);
				this.debounceMap[file.path] = setTimeout(() => {
					this.processFile(file);
				}, this.settings.debounceMs);
			})
		);

		console.log('Atom Creator loaded');
	}

	onunload() {
		Object.values(this.debounceMap).forEach(clearTimeout);
	}

	async processFile(file: TFile) {
		let content: string;
		try { content = await this.app.vault.read(file); }
		catch { return; }

		const tag    = this.settings.atomTag.toLowerCase();
		const lines  = content.split('\n');
		let modified = false;
		let i        = 0;
		const created: string[] = [];

		while (i < lines.length) {
			const line = lines[i];

			if (!line.toLowerCase().includes(tag)) { i++; continue; }

			// Extract title
			const tagRegex = new RegExp(tag.replace('#', '\\#'), 'gi');
			const title = line
				.replace(/^[\s\-\*\+>]+/, '')
				.replace(tagRegex, '')
				.trim();

			if (!title) { i++; continue; }

			// Skip if atom already exists
			const atomPath = this.settings.notesFolder + title + '.md';
			if (this.app.vault.getAbstractFileByPath(atomPath)) { i++; continue; }

			// Collect sub-bullets
			const baseIndent = (line.match(/^(\s*)/) ?? ['', ''])[1].length;
			const subLines: string[] = [];
			let lastSub = i;
			let j = i + 1;

			while (j < lines.length) {
				const sub = lines[j];
				if (sub.trim() === '') { j++; continue; }
				if ((sub.match(/^(\s*)/) ?? ['', ''])[1].length <= baseIndent) break;
				subLines.push(sub.replace(/^[\s\-\*\+>]+/, '').trim());
				lastSub = j;
				j++;
			}

			// Create atom note
			await this.app.vault.create(atomPath, this.buildAtom(title, subLines));
			created.push(title);

			// Replace block with wikilink
			const prefix = (line.match(/^(\s*[\-\*\+]?\s*)/) ?? ['', ''])[1];
			lines.splice(i, lastSub - i + 1, `${prefix}[[${title}]]`);
			modified = true;
			i++;
		}

		if (!modified) return;

		// Write updated file without re-triggering the loop
		this._lockAndWrite(file, lines.join('\n'));

		// Open each new atom in a new tab and show notice
		for (const title of created) {
			const atomFile = this.app.vault.getAbstractFileByPath(
				this.settings.notesFolder + title + '.md'
			);
			if (atomFile instanceof TFile) {
				const leaf = this.app.workspace.getLeaf('tab');
				await leaf.openFile(atomFile);
			}
			new Notice(`✓ Atom: ${title}`);
		}
	}

	private async _lockAndWrite(file: TFile, content: string) {
		this.processing.add(file.path);
		await this.app.vault.modify(file, content);
		setTimeout(() => this.processing.delete(file.path), 1000);
	}

	private buildAtom(title: string, subLines: string[]): string {
		const now  = new Date();
		const pad  = (n: number) => String(n).padStart(2, '0');
		const iso  = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
		const link = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;
		const body = subLines.length ? subLines.join('\n') + '\n\n' : '';

		return `---
type:
  - atom
status:
  - seedling
up: []
created: ${iso}
day: "[[${link}]]"
---

> ${title}

${body}## North
*Where X comes from*
-

## West
*What's similar to X*
-

## East
*What's opposite of X*
-

## South
*Where this idea can be linked to*
-

### Reference
-
`;
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class AtomCreatorSettingTab extends PluginSettingTab {
	plugin: AtomCreator;

	constructor(app: App, plugin: AtomCreator) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl('h2', { text: 'Atom Creator' });

		new Setting(containerEl)
			.setName('Watch folder')
			.setDesc('Folder monitored for the atom tag. Include trailing slash.')
			.addText(text => text
				.setPlaceholder('Calendar/')
				.setValue(this.plugin.settings.watchFolder)
				.onChange(async (value) => {
					this.plugin.settings.watchFolder = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Notes folder')
			.setDesc('Folder where atom notes are created. Include trailing slash.')
			.addText(text => text
				.setPlaceholder('Notes/')
				.setValue(this.plugin.settings.notesFolder)
				.onChange(async (value) => {
					this.plugin.settings.notesFolder = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Atom tag')
			.setDesc('Tag that triggers atom creation (default: #atom).')
			.addText(text => text
				.setPlaceholder('#atom')
				.setValue(this.plugin.settings.atomTag)
				.onChange(async (value) => {
					this.plugin.settings.atomTag = value.startsWith('#') ? value : '#' + value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Debounce delay (ms)')
			.setDesc('Wait time after last edit before processing. Increase if you notice lag.')
			.addText(text => text
				.setPlaceholder('2000')
				.setValue(String(this.plugin.settings.debounceMs))
				.onChange(async (value) => {
					const num = parseInt(value);
					if (!isNaN(num) && num >= 500) {
						this.plugin.settings.debounceMs = num;
						await this.plugin.saveSettings();
					}
				}));
	}
}
