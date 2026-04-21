import { App, PluginSettingTab, Setting } from 'obsidian';
import type AtomCreator from './main';

export interface Supertag {
	id: string;
	tag: string;
	name: string;
	color: string;
	folder: string;
	frontmatterTemplate: string;
	bodyTemplate: string;
}

export interface AtomCreatorSettings {
	supertags: Supertag[];
	debounceMs: number;
	watchFolders: string;
}

export const DEFAULT_SUPERTAGS: Supertag[] = [
	{
		id: 'atom',
		tag: '#atom',
		name: 'Atom',
		color: '#7c3aed',
		folder: 'Notes/',
		frontmatterTemplate: [
			'type:',
			'  - atom',
			'status:',
			'  - seedling',
			'up: []',
			'created: {{date}}',
			'day: "[[{{dateLink}}]]"',
		].join('\n'),
		bodyTemplate: [
			'> {{title}}',
			'',
			'{{content}}',
			'## North',
			'*Where X comes from*',
			'-',
			'',
			'## West',
			"*What's similar to X*",
			'-',
			'',
			'## East',
			"*What's opposite of X*",
			'-',
			'',
			'## South',
			'*Where this idea can be linked to*',
			'-',
			'',
			'### Reference',
			'-',
		].join('\n'),
	},
];

export const DEFAULT_SETTINGS: AtomCreatorSettings = {
	supertags: DEFAULT_SUPERTAGS,
	debounceMs: 2000,
	watchFolders: 'Calendar/',
};

function randomId() {
	return Math.random().toString(36).slice(2, 8);
}

export class AtomCreatorSettingTab extends PluginSettingTab {
	plugin: AtomCreator;

	constructor(app: App, plugin: AtomCreator) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl).setName('SuperTags').setHeading();

		new Setting(containerEl)
			.setName('Watch folders')
			.setDesc('Comma-separated folders monitored for supertags (e.g. Calendar/, Inbox/).')
			.addText(text => text
				.setPlaceholder('Calendar/')
				.setValue(this.plugin.settings.watchFolders)
				.onChange(async value => {
					this.plugin.settings.watchFolders = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Debounce delay (ms)')
			.setDesc('Wait time after last edit before processing. Min 500ms.')
			.addText(text => text
				.setPlaceholder('2000')
				.setValue(String(this.plugin.settings.debounceMs))
				.onChange(async value => {
					const n = parseInt(value);
					if (!isNaN(n) && n >= 500) {
						this.plugin.settings.debounceMs = n;
						await this.plugin.saveSettings();
					}
				}));

		new Setting(containerEl).setName('Supertags').setHeading();
		containerEl.createEl('p', {
			text: 'Each supertag defines a trigger tag, a destination folder, and templates for the frontmatter and body of the created note.',
			cls: 'setting-item-description',
		});

		const supertagsContainer = containerEl.createDiv();
		this.renderSupertags(supertagsContainer);

		new Setting(containerEl)
			.addButton(btn => btn
				.setButtonText('+ Add supertag')
				.setCta()
				.onClick(async () => {
					this.plugin.settings.supertags.push({
						id: randomId(),
						tag: '#newtag',
						name: 'New tag',
						color: '#0ea5e9',
						folder: 'Notes/',
						frontmatterTemplate: 'type:\n  - note\ncreated: {{date}}',
						bodyTemplate: '> {{title}}\n\n{{content}}',
					});
					await this.plugin.saveSettings();
					this.display();
				}));
	}

	private renderSupertags(container: HTMLElement) {
		container.empty();

		for (const [index, supertag] of this.plugin.settings.supertags.entries()) {
			const card = container.createDiv({ cls: 'st-card' });

			const header = card.createDiv({ cls: 'st-card-header' });

			const chip = header.createEl('span', { cls: 'st-settings-chip' });
			chip.textContent = supertag.tag;
			chip.setCssProps({ '--st-chip-bg': supertag.color });

			const deleteBtn = header.createEl('button', { text: '✕ Remove', cls: 'st-delete-btn' });
			deleteBtn.onclick = () => void (async () => {
				this.plugin.settings.supertags.splice(index, 1);
				await this.plugin.saveSettings();
				this.display();
			})();

			const row1 = card.createDiv({ cls: 'st-grid-2' });

			this.inlineInput(row1, 'Tag', supertag.tag, async v => {
				supertag.tag = v.startsWith('#') ? v : '#' + v;
				chip.textContent = supertag.tag;
				await this.plugin.saveSettings();
				this.plugin.refreshDecorations();
			});
			this.inlineInput(row1, 'Name', supertag.name, async v => {
				supertag.name = v;
				await this.plugin.saveSettings();
			});

			const row2 = card.createDiv({ cls: 'st-grid-color' });

			const colorWrap = row2.createDiv();
			colorWrap.createEl('small', { text: 'Color', cls: 'setting-item-description' });
			const colorInput = colorWrap.createEl('input', { type: 'color' });
			colorInput.addClass('st-color-input');
			colorInput.value = supertag.color;
			colorInput.oninput = () => void (async () => {
				supertag.color = colorInput.value;
				chip.setCssProps({ '--st-chip-bg': supertag.color });
				await this.plugin.saveSettings();
				this.plugin.refreshDecorations();
			})();

			this.inlineInput(row2, 'Destination folder', supertag.folder, async v => {
				supertag.folder = v.endsWith('/') ? v : v + '/';
				await this.plugin.saveSettings();
			});

			this.inlineTextarea(card, 'Frontmatter template', supertag.frontmatterTemplate, async v => {
				supertag.frontmatterTemplate = v;
				await this.plugin.saveSettings();
			});

			this.inlineTextarea(card, 'Body template', supertag.bodyTemplate, async v => {
				supertag.bodyTemplate = v;
				await this.plugin.saveSettings();
			});

			card.createEl('small', {
				text: 'Variables: {{title}}, {{date}} (YYYY-MM-DD), {{dateLink}} (DD-MM-YYYY), {{content}} (sub-bullets)',
				cls: 'setting-item-description',
			});
		}
	}

	private inlineInput(container: HTMLElement, label: string, value: string, onChange: (v: string) => Promise<void>) {
		const wrap = container.createDiv();
		wrap.createEl('small', { text: label, cls: 'setting-item-description' });
		const input = wrap.createEl('input', { type: 'text' });
		input.addClass('st-full-input');
		input.value = value;
		input.oninput = () => { void onChange(input.value); };
	}

	private inlineTextarea(container: HTMLElement, label: string, value: string, onChange: (v: string) => Promise<void>) {
		const wrap = container.createDiv({ cls: 'st-textarea-wrap' });
		wrap.createEl('small', { text: label, cls: 'setting-item-description' });
		const ta = wrap.createEl('textarea');
		ta.addClass('st-textarea');
		ta.value = value;
		ta.rows = 4;
		ta.oninput = () => { void onChange(ta.value); };
	}
}
