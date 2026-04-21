import { EditorView, ViewPlugin, ViewUpdate, Decoration, DecorationSet, WidgetType } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import type { Supertag } from './settings';

// ── Chip widget ────────────────────────────────────────────────────────────────

class SupertagChip extends WidgetType {
	constructor(
		readonly label: string,
		readonly color: string,
	) { super(); }

	toDOM(): HTMLElement {
		const chip = document.createElement('span');
		chip.className = 'atom-creator-chip';
		chip.textContent = this.label;
		chip.setCssProps({ '--st-chip-bg': this.color });
		return chip;
	}

	eq(other: SupertagChip) {
		return other.label === this.label && other.color === this.color;
	}

	ignoreEvent() { return true; }
}

// ── Escape helper ──────────────────────────────────────────────────────────────

function escapeRegex(s: string) {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── ViewPlugin factory ─────────────────────────────────────────────────────────

export function buildSupertagPlugin(getSupertags: () => Supertag[]) {
	return ViewPlugin.fromClass(
		class {
			decorations: DecorationSet;

			constructor(view: EditorView) {
				this.decorations = this.build(view);
			}

			update(update: ViewUpdate) {
				if (update.docChanged || update.viewportChanged || update.selectionSet) {
					this.decorations = this.build(update.view);
				}
			}

			build(view: EditorView): DecorationSet {
				const supertags = getSupertags();
				if (!supertags.length) return Decoration.none;

				const builder = new RangeSetBuilder<Decoration>();
				const cursorLine = view.state.doc.lineAt(
					view.state.selection.main.head
				).number;

				const matches: Array<{ from: number; to: number; tag: Supertag }> = [];

				for (const { from, to } of view.visibleRanges) {
					let pos = from;
					while (pos <= to) {
						const line = view.state.doc.lineAt(pos);
						if (line.number !== cursorLine) {
							const lineText = line.text;
							for (const tag of supertags) {
								const re = new RegExp(escapeRegex(tag.tag), 'gi');
								let m;
								while ((m = re.exec(lineText)) !== null) {
									matches.push({
										from: line.from + m.index,
										to: line.from + m.index + m[0].length,
										tag,
									});
								}
							}
						}
						if (line.to >= to) break;
						pos = line.to + 1;
					}
				}

				matches.sort((a, b) => a.from - b.from);
				let lastTo = -1;
				for (const { from, to, tag } of matches) {
					if (from < lastTo) continue;
					builder.add(
						from,
						to,
						Decoration.replace({
							widget: new SupertagChip(tag.tag, tag.color),
						})
					);
					lastTo = to;
				}

				return builder.finish();
			}
		},
		{ decorations: v => v.decorations }
	);
}
