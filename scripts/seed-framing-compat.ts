// Tags arrangement-category concepts with framingRequiresAnyOf so they only
// surface as Deep-mode framing when the picked template has at least one
// matching section. Universal arrangement concepts (subtractive, golden-ratio)
// are left untagged.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

type Concept = {
	id: string;
	category?: string;
	framingRequiresAnyOf?: string[];
	[k: string]: unknown;
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const PATH = resolve(__dirname, '..', 'src', 'lib', 'content', 'concepts.json');

const DROP_FAMILY = ['drop', 'drop1', 'drop2', 'main-drop', 'first-drop'];

const COMPAT: Record<string, string[]> = {
	'fake-drop': DROP_FAMILY,
	'half-drop': DROP_FAMILY,
	'dubstep-half-time-drop': ['drop', 'drop1', 'drop2'],
	'trance-double-drop': ['main-drop', 'first-drop'],
	'hardstyle-reverse-bass-entry': ['drop2'],
	'intro-build-drop-breakdown': DROP_FAMILY,
	'synthwave-gated-snare-arrival': ['verse2', 'chorus2', 'chorus3'],
	'acid-303-filter-sweep-build': ['filter-opens', 'filter-closes'],
	'ambient-long-form': ['opening', 'development', 'dissolution'],
	'dj-friendly-intro': ['intro'],
	'pre-drop-silence': DROP_FAMILY,
	'four-on-the-floor-anchor': ['drop', 'drop1', 'drop2', 'main-drop', 'peak', 'peak1', 'peak2', 'chorus', 'chorus1', 'chorus2', 'chorus3'],
	'uk-garage-two-step-structure': ['verse', 'chorus', 'chorus2'],
	'dnb-intro-break-drop': DROP_FAMILY
};

async function main() {
	const raw = await readFile(PATH, 'utf8');
	const concepts = JSON.parse(raw) as Concept[];
	const byId = new Map(concepts.map((c) => [c.id, c]));

	let tagged = 0;
	const missing: string[] = [];

	for (const [id, sections] of Object.entries(COMPAT)) {
		const c = byId.get(id);
		if (!c) {
			missing.push(id);
			continue;
		}
		if (c.category !== 'arrangement') {
			console.warn(`[skip] ${id} is category=${c.category}, not arrangement`);
			continue;
		}
		c.framingRequiresAnyOf = sections;
		tagged++;
	}

	if (missing.length) {
		console.warn('[warn] IDs not found:');
		for (const id of missing) console.warn('  - ' + id);
	}

	await writeFile(PATH, JSON.stringify(concepts, null, '\t') + '\n', 'utf8');
	console.log(`Done. Tagged ${tagged} arrangement concepts with framingRequiresAnyOf.`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
