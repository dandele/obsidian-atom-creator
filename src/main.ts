import { Plugin, TFile, TAbstractFile } from 'obsidian';
import { AtomCreatorSettings, DEFAULT_SETTINGS, AtomCreatorSettingTab } from './settings';
import { processFile } from './processor';
import { buildSupertagPlugin } from './decorations';

export default class AtomCreator extends Plugin {
	settings: AtomCreatorSettings;

	private debounceMap: Record<string, ReturnType<typeof setTimeout>> = {};
	private processing: Set<string> = new Set();
	private editorExtension: ReturnType<typeof buildSupertagPlugin>[] = [];

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new AtomCreatorSettingTab(this.app, this));

		// Register CM6 decoration extension
		this.editorExtension = [buildSupertagPlugin(() => this.settings.supertags)];
		this.registerEditorExtension(this.editorExtension);

		// Watch for file modifications
		this.registerEvent(
			this.app.vault.on('modify', (file: TAbstractFile) => {
				if (!(file instanceof TFile)) return;
				if (!this.isWatched(file.path)) return;
				if (this.processing.has(file.path)) return;

				clearTimeout(this.debounceMap[file.path]);
				this.debounceMap[file.path] = setTimeout(async () => {
					this.processing.add(file.path);
					try {
						await processFile(file, this.settings, this.app.vault, this.app.workspace);
					} finally {
						setTimeout(() => this.processing.delete(file.path), 1000);
					}
				}, this.settings.debounceMs);
			})
		);

		console.log('Atom Creator loaded');
	}

	onunload() {
		Object.values(this.debounceMap).forEach(clearTimeout);
	}

	private isWatched(path: string): boolean {
		const folders = this.settings.watchFolders
			.split(',')
			.map(f => f.trim())
			.filter(Boolean);
		return folders.some(f => path.startsWith(f));
	}

	// Called from SettingTab when tag or color changes
	refreshDecorations() {
		this.app.workspace.updateOptions();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		// Ensure supertags array always exists
		if (!Array.isArray(this.settings.supertags)) {
			this.settings.supertags = DEFAULT_SETTINGS.supertags;
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
