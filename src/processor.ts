import { TFile, Vault, Workspace, Notice } from 'obsidian';
import type { Supertag, AtomCreatorSettings } from './settings';

// ── Types ──────────────────────────────────────────────────────────────────────

interface CreatedNote {
	path: string;
	supertag: Supertag;
	title: string;
}

interface UndoAction {
	filePath: string;
	originalContent: string;
	created: CreatedNote[];
}

// ── Template rendering ─────────────────────────────────────────────────────────

function renderTemplate(template: string, vars: Record<string, string>): string {
	return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');
}

function buildNote(supertag: Supertag, title: string, subLines: string[]): string {
	const now = new Date();
	const pad = (n: number) => String(n).padStart(2, '0');
	const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
	const dateLink = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;
	const content = subLines.length ? subLines.join('\n') + '\n\n' : '';

	const vars = { title, date, dateLink, content };
	const frontmatter = renderTemplate(supertag.frontmatterTemplate, vars);
	const body = renderTemplate(supertag.bodyTemplate, vars);

	return `---\n${frontmatter}\n---\n\n${body}\n`;
}

// ── Undo notice ────────────────────────────────────────────────────────────────

function showUndoNotice(
	action: UndoAction,
	vault: Vault,
	workspace: Workspace,
) {
	for (const created of action.created) {
		const fragment = document.createDocumentFragment();

		const container = fragment.createEl('div');
		container.style.cssText = 'display:flex;flex-direction:column;gap:6px;';

		const header = container.createEl('div');
		header.style.cssText = 'display:flex;align-items:center;gap:6px;';

		const chip = header.createEl('span');
		chip.textContent = created.supertag.tag;
		chip.style.cssText = [
			`background:${created.supertag.color}`,
			'color:#fff',
			'border-radius:4px',
			'padding:1px 7px',
			'font-size:0.82em',
			'font-weight:600',
		].join(';');

		header.createEl('span', { text: `"${created.title}"` });

		const btnRow = container.createEl('div');
		btnRow.style.cssText = 'display:flex;gap:6px;margin-top:2px;';

		const viewBtn = btnRow.createEl('button', { text: 'Open' });
		viewBtn.style.cssText = 'font-size:0.82em;padding:2px 8px;cursor:pointer;';

		const undoBtn = btnRow.createEl('button', { text: 'Undo' });
		undoBtn.style.cssText = 'font-size:0.82em;padding:2px 8px;cursor:pointer;';

		const notice = new Notice(fragment, 8000);

		viewBtn.onclick = async () => {
			const file = vault.getAbstractFileByPath(created.path);
			if (file instanceof TFile) {
				const leaf = workspace.getLeaf('tab');
				await leaf.openFile(file);
			}
			notice.hide();
		};

		undoBtn.onclick = async () => {
			notice.hide();
			await undoAction(action, vault);
		};
	}
}

async function undoAction(action: UndoAction, vault: Vault) {
	// Delete created files
	for (const created of action.created) {
		const file = vault.getAbstractFileByPath(created.path);
		if (file instanceof TFile) {
			await vault.delete(file);
		}
	}
	// Restore original content
	const sourceFile = vault.getAbstractFileByPath(action.filePath);
	if (sourceFile instanceof TFile) {
		await vault.modify(sourceFile, action.originalContent);
	}
	new Notice('↩ Undo successful');
}

// ── Core processor ─────────────────────────────────────────────────────────────

export async function processFile(
	file: TFile,
	settings: AtomCreatorSettings,
	vault: Vault,
	workspace: Workspace,
): Promise<void> {
	let content: string;
	try { content = await vault.read(file); }
	catch { return; }

	const originalContent = content;
	const lines = content.split('\n');
	let modified = false;
	let i = 0;
	const created: CreatedNote[] = [];

	while (i < lines.length) {
		const line = lines[i];

		// Find which supertag (if any) is on this line
		const matchedTag = settings.supertags.find(st =>
			line.toLowerCase().includes(st.tag.toLowerCase())
		);
		if (!matchedTag) { i++; continue; }

		// Extract title (remove bullet + tag)
		const tagRegex = new RegExp(matchedTag.tag.replace(/[#.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
		const title = line
			.replace(/^[\s\-\*\+>]+/, '')
			.replace(tagRegex, '')
			.trim();

		if (!title) { i++; continue; }

		// Skip if note already exists
		const notePath = matchedTag.folder + title + '.md';
		if (vault.getAbstractFileByPath(notePath)) { i++; continue; }

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

		// Create note
		try {
			await vault.create(notePath, buildNote(matchedTag, title, subLines));
		} catch {
			i++;
			continue;
		}

		created.push({ path: notePath, supertag: matchedTag, title });

		// Replace block with wikilink
		const prefix = (line.match(/^(\s*[\-\*\+]?\s*)/) ?? ['', ''])[1];
		lines.splice(i, lastSub - i + 1, `${prefix}[[${title}]]`);
		modified = true;
		i++;
	}

	if (!modified) return;

	// Write updated source file
	await vault.modify(file, lines.join('\n'));

	// Show undo notice for each created note
	const action: UndoAction = { filePath: file.path, originalContent, created };
	showUndoNotice(action, vault, workspace);
}
