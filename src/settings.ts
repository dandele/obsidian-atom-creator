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
		containerEl.createEl('h2', { text: 'Atom Creator' });

		// ── Global settings ──────────────────────────────────────────
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

		// ── Supertags ─────────────────────────────────────────────────
		containerEl.createEl('h3', { text: 'Supertags' });
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
						name: 'New Tag',
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
			const card = container.createDiv({ cls: 'atom-creator-supertag-card' });
			card.style.cssText = 'border: 1px solid var(--background-modifier-border); border-radius: 8px; padding: 12px 16px; margin-bottom: 12px;';

			// Header row with chip preview + delete button
			const header = card.createDiv({ cls: 'atom-creator-supertag-header' });
			header.style.cssText = 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;';

			const chip = header.createEl('span');
			chip.textContent = supertag.tag;
			chip.style.cssText = `background: ${supertag.color}; color: white; border-radius: 4px; padding: 2px 10px; font-weight: 600; font-size: 0.85em;`;

			const deleteBtn = header.createEl('button', { text: '✕ Remove' });
			deleteBtn.style.cssText = 'font-size: 0.8em; color: var(--text-muted);';
			deleteBtn.onclick = async () => {
				this.plugin.settings.supertags.splice(index, 1);
				await this.plugin.saveSettings();
				this.display();
			};

			// Tag + Name row
			const row1 = card.createDiv();
			row1.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;';

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

			// Color + Folder row
			const row2 = card.createDiv();
			row2.style.cssText = 'display: grid; grid-template-columns: 80px 1fr; gap: 8px; margin-bottom: 8px; align-items: end;';

			const colorWrap = row2.createDiv();
			colorWrap.createEl('small', { text: 'Color', cls: 'setting-item-description' });
			const colorInput = colorWrap.createEl('input', { type: 'color' } as DomElementInfo) as HTMLInputElement;
			colorInput.value = supertag.color;
			colorInput.style.cssText = 'width: 100%; height: 32px; border: none; cursor: pointer; border-radius: 4px;';
			colorInput.oninput = async () => {
				supertag.color = colorInput.value;
				chip.style.background = supertag.color;
				await this.plugin.saveSettings();
				this.plugin.refreshDecorations();
			};

			this.inlineInput(row2, 'Destination folder', supertag.folder, async v => {
				supertag.folder = v.endsWith('/') ? v : v + '/';
				await this.plugin.saveSettings();
			});

			// Frontmatter template
			this.inlineTextarea(card, 'Frontmatter template', supertag.frontmatterTemplate, async v => {
				supertag.frontmatterTemplate = v;
				await this.plugin.saveSettings();
			});

			// Body template
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
		const input = wrap.createEl('input', { type: 'text' } as DomElementInfo) as HTMLInputElement;
		input.value = value;
		input.style.cssText = 'width: 100%; box-sizing: border-box;';
		input.oninput = () => onChange(input.value);
	}

	private inlineTextarea(container: HTMLElement, label: string, value: string, onChange: (v: string) => Promise<void>) {
		const wrap = container.createDiv();
		wrap.style.cssText = 'margin-bottom: 8px;';
		wrap.createEl('small', { text: label, cls: 'setting-item-description' });
		const ta = wrap.createEl('textarea') as HTMLTextAreaElement;
		ta.value = value;
		ta.rows = 4;
		ta.style.cssText = 'width: 100%; box-sizing: border-box; font-family: monospace; font-size: 0.85em; resize: vertical;';
		ta.oninput = () => onChange(ta.value);
	}
}
