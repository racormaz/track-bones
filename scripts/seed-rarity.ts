// Tags select concepts with rarity. Everything else stays default (common).
// Per the v2 plan: legendary ≈ 2-3% of library, rare ≈ 8-10%.
//
// Run: npx tsx scripts/seed-rarity.ts
// Idempotent.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

type Concept = { id: string; rarity?: 'common' | 'rare' | 'legendary'; [k: string]: unknown };

const __dirname = dirname(fileURLToPath(import.meta.url));
const PATH = resolve(__dirname, '..', 'src', 'lib', 'content', 'concepts.json');

const LEGENDARY = new Set<string>([
	'shepard-tone',
	'shepard-risset-glissando',
	'isorhythm',
	'risset-rhythm',
	'reich-phasing',
	'klangfarbenmelodie',
	'mensural-canon'
]);

const RARE = new Set<string>([
	'sound-mass',
	'generative-music',
	'process-music',
	'tritone-paradox',
	'missing-fundamental',
	'pitch-class-set',
	'microtonality',
	'just-intonation',
	'sensory-dissonance',
	'stochastic-music',
	'acousmatic-sound',
	'aleatoric',
	'musique-concrete',
	'spectral-music',
	'combination-tone',
	'inharmonicity',
	'auditory-streaming',
	'critical-band',
	'mentasm-hoover',
	'hocket',
	'cantus-firmus',
	'heterophony',
	'metric-modulation',
	'tihai',
	'konnakol'
]);

async function main() {
	const raw = await readFile(PATH, 'utf8');
	const concepts = JSON.parse(raw) as Concept[];

	let legendary = 0;
	let rare = 0;
	let missing: string[] = [];
	const seen = new Set<string>();

	for (const c of concepts) {
		if (LEGENDARY.has(c.id)) {
			c.rarity = 'legendary';
			legendary++;
			seen.add(c.id);
		} else if (RARE.has(c.id)) {
			c.rarity = 'rare';
			rare++;
			seen.add(c.id);
		}
	}

	for (const id of [...LEGENDARY, ...RARE]) {
		if (!seen.has(id)) missing.push(id);
	}

	if (missing.length) {
		console.warn('[warn] These IDs were not found in concepts.json:');
		for (const id of missing) console.warn('  - ' + id);
	}

	await writeFile(PATH, JSON.stringify(concepts, null, '\t') + '\n', 'utf8');
	console.log(`Done. Tagged ${legendary} legendary, ${rare} rare. Total: ${concepts.length}.`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
