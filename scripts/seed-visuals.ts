// Wave 1: visuals on ~10 high-traffic concepts.
// Covers the three implemented primitives: rhythm-grid, waveform, energy-curve.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

type Visual =
	| { type: 'none' }
	| { type: 'rhythm-grid'; steps: number; hits: number[]; accents?: number[] }
	| { type: 'waveform'; shape: 'sine' | 'saw' | 'square' | 'triangle' | 'noise' }
	| { type: 'energy-curve'; points: number[] };

type Concept = { id: string; visual?: Visual; [k: string]: unknown };

const __dirname = dirname(fileURLToPath(import.meta.url));
const PATH = resolve(__dirname, '..', 'src', 'lib', 'content', 'concepts.json');

const VISUALS: Record<string, Visual> = {
	// Rhythm
	'four-on-the-floor-anchor': {
		type: 'rhythm-grid',
		steps: 16,
		hits: [0, 4, 8, 12],
		accents: [0, 8]
	},
	syncopation: {
		type: 'rhythm-grid',
		steps: 16,
		hits: [2, 5, 7, 10, 13],
		accents: [2, 10]
	},
	'syncopation-hihat': {
		type: 'rhythm-grid',
		steps: 16,
		hits: [1, 3, 5, 7, 9, 11, 13, 15]
	},
	'dotted-rhythm-melody': {
		type: 'rhythm-grid',
		steps: 16,
		hits: [0, 3, 6, 9, 12],
		accents: [0, 6, 12]
	},
	'psytrance-rolling-bass': {
		type: 'rhythm-grid',
		steps: 16,
		hits: [1, 3, 5, 7, 9, 11, 13, 15]
	},
	'dubstep-half-time-drop': {
		type: 'rhythm-grid',
		steps: 16,
		hits: [0, 8],
		accents: [8]
	},

	// Waveform — sound design primitives
	supersaw: { type: 'waveform', shape: 'saw' },
	'fm-synthesis': { type: 'waveform', shape: 'sine' },

	// Energy curves — arrangement structure
	'intro-build-drop-breakdown': {
		type: 'energy-curve',
		points: [0.15, 0.2, 0.35, 0.8, 0.95, 0.3, 0.7, 0.95, 0.2]
	},
	'half-drop': {
		type: 'energy-curve',
		points: [0.2, 0.4, 0.85, 0.95, 0.55, 0.4, 0.95, 0.2]
	},
	'fake-drop': {
		type: 'energy-curve',
		points: [0.2, 0.45, 0.9, 0.1, 0.5, 0.95, 0.2]
	},
	'tension-and-release': {
		type: 'energy-curve',
		points: [0.3, 0.45, 0.6, 0.8, 0.95, 0.2]
	},
	'subtractive-arrangement': {
		type: 'energy-curve',
		points: [0.95, 0.8, 0.65, 0.5, 0.35, 0.15]
	}
};

async function main() {
	const raw = await readFile(PATH, 'utf8');
	const concepts = JSON.parse(raw) as Concept[];
	const byId = new Map(concepts.map((c) => [c.id, c]));
	let added = 0;
	let missing: string[] = [];

	for (const [id, visual] of Object.entries(VISUALS)) {
		const c = byId.get(id);
		if (!c) {
			missing.push(id);
			continue;
		}
		c.visual = visual;
		added++;
	}

	if (missing.length) {
		console.warn('[warn] IDs not found:');
		for (const id of missing) console.warn('  - ' + id);
	}

	await writeFile(PATH, JSON.stringify(concepts, null, '\t') + '\n', 'utf8');
	console.log(`Done. Added visuals to ${added} concepts.`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
