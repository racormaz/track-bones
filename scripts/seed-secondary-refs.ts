// One-shot: adds curated SecondaryRef entries to concepts.json on production-focused
// concepts where Wikipedia is thin and a targeted resource teaches faster.
// Sourced from the v2 sources research.
//
// Run: npx tsx scripts/seed-secondary-refs.ts
// Idempotent (skips concepts that already have secondaryRef).

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

type RefKind = 'article' | 'video' | 'interactive';
type SecondaryRef = { kind: RefKind; label: string; url: string };

type Concept = {
	id: string;
	[k: string]: unknown;
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const PATH = resolve(__dirname, '..', 'src', 'lib', 'content', 'concepts.json');

const REFS: Record<string, SecondaryRef> = {
	'reese-bass': {
		kind: 'article',
		label: 'Attack Magazine — Reese Bass Redux',
		url: 'https://www.attackmagazine.com/technique/tutorials/reese-bass-redux/'
	},
	'fm-bass': {
		kind: 'article',
		label: 'Attack Magazine — Dirty FM Bass',
		url: 'https://www.attackmagazine.com/technique/tutorials/dirty-fm-bass/'
	},
	'wavetable-synthesis': {
		kind: 'article',
		label: 'Attack Magazine — Wavetable Foghorn Bass',
		url: 'https://www.attackmagazine.com/technique/synth-secrets/drum-n-bass-foghorn-bass-with-wavetable/'
	},
	'sidechain-compression': {
		kind: 'article',
		label: 'Black Ghost Audio — Sidechain in Ableton',
		url: 'https://www.blackghostaudio.com/blog/how-to-use-sidechain-compression-in-ableton'
	},
	'kick-bass-sidechain': {
		kind: 'article',
		label: 'dsokolovskiy — How to fit kick and bass',
		url: 'https://dsokolovskiy.com/blog/all/how-to-fit-kick-and-bass-together/'
	},
	'shepard-tone': {
		kind: 'article',
		label: 'iZotope — Shepard Tone',
		url: 'https://www.izotope.com/en/learn/shepard-tone'
	},
	'shepard-risset-glissando': {
		kind: 'article',
		label: "Cycling '74 — Risset Glissandos",
		url: 'https://cycling74.com/2013/11/20/risset-glissandos-and-strange-loops-2/'
	},
	'fm-synthesis': {
		kind: 'interactive',
		label: 'Ableton — Learn Synths',
		url: 'https://learningsynths.ableton.com/'
	},
	'authentic-cadence': {
		kind: 'interactive',
		label: 'muted.io — Cadences',
		url: 'https://muted.io/cadence/'
	},
	'plagal-cadence': {
		kind: 'interactive',
		label: 'muted.io — Cadences',
		url: 'https://muted.io/cadence/'
	},
	'deceptive-cadence': {
		kind: 'interactive',
		label: 'muted.io — Cadences',
		url: 'https://muted.io/cadence/'
	},
	'half-cadence': {
		kind: 'interactive',
		label: 'muted.io — Cadences',
		url: 'https://muted.io/cadence/'
	},
	'modal-interchange': {
		kind: 'interactive',
		label: 'Hooktheory — TheoryTab',
		url: 'https://www.hooktheory.com/theorytab'
	},
	'subtractive-synthesis': {
		kind: 'article',
		label: 'Sound on Sound — Synth Secrets',
		url: 'https://www.soundonsound.com/series/synth-secrets-sound-sound'
	},
	'acid-303-bassline': {
		kind: 'interactive',
		label: 'Ableton — Learn Synths',
		url: 'https://learningsynths.ableton.com/'
	}
};

async function main() {
	const raw = await readFile(PATH, 'utf8');
	const concepts = JSON.parse(raw) as Concept[];
	const byId = new Map(concepts.map((c) => [c.id, c]));

	let added = 0;
	let missing: string[] = [];

	for (const [id, ref] of Object.entries(REFS)) {
		const concept = byId.get(id);
		if (!concept) {
			missing.push(id);
			continue;
		}
		if (concept.secondaryRef) {
			console.log(`[skip] ${id} already has a secondaryRef`);
			continue;
		}
		concept.secondaryRef = ref;
		added++;
		console.log(`[ok]   ${id} → ${ref.label}`);
	}

	if (missing.length) {
		console.warn(`\n[warn] These ids weren't found in concepts.json (typo?):`);
		for (const id of missing) console.warn(`  - ${id}`);
	}

	await writeFile(PATH, JSON.stringify(concepts, null, '\t') + '\n', 'utf8');
	console.log(`\nDone. Added ${added} secondary refs.`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
