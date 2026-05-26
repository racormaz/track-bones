// Adds novelty/lesser-known concepts the user explicitly asked to keep
// (the "didn't know that had a name" category from the research file).
//
// Run once: npx tsx scripts/seed-novelty.ts
// Idempotent (dedupes by id) so a second run is a no-op.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

type Concept = {
	id: string;
	name: string;
	category: 'rhythm' | 'melody' | 'harmony' | 'arrangement' | 'sound-design';
	difficulty: 1 | 2 | 3;
	genres: string[];
	prompt: string;
	definition: string;
	wikiUrl: string | null;
	wikiSummary?: string;
	relatedIds?: string[];
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const PATH = resolve(__dirname, '..', 'src', 'lib', 'content', 'concepts.json');

const ADDITIONS: Concept[] = [
	{
		id: 'shepard-tone',
		name: 'Shepard Tone',
		category: 'sound-design',
		difficulty: 3,
		genres: ['trance', 'dubstep', 'experimental', 'idm'],
		prompt:
			'Build your build-up around a Shepard tone so the riser appears to rise forever without ever actually going up in pitch.',
		definition:
			'An auditory illusion of an endlessly ascending or descending pitch, created by stacked octaves crossfading in volume.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Shepard_tone'
	},
	{
		id: 'shepard-risset-glissando',
		name: 'Shepard-Risset Glissando',
		category: 'sound-design',
		difficulty: 3,
		genres: ['experimental', 'idm', 'ambient'],
		prompt:
			'Use a continuous Shepard-Risset glissando as the only transition element through your breakdown.',
		definition:
			'A continuous (rather than stepwise) version of the Shepard tone, perpetually gliding in pitch.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Shepard_tone'
	},
	{
		id: 'reich-phasing',
		name: 'Reich-style Phasing',
		category: 'arrangement',
		difficulty: 3,
		genres: ['experimental', 'idm', 'ambient'],
		prompt:
			'Start two identical loops in sync and slowly nudge one out of phase across 60 seconds. Let the resulting interference be a full section.',
		definition:
			'Steve Reich’s compositional technique of two identical patterns drifting in and out of phase to generate new patterns.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Phasing_(music)'
	},
	{
		id: 'tape-loop',
		name: 'Tape Loop',
		category: 'sound-design',
		difficulty: 2,
		genres: ['ambient', 'experimental', 'idm'],
		prompt:
			'Pick a 4-second sample, loop it raw with no edits, and let it run unaltered for an entire 32-bar section as your only harmonic content.',
		definition:
			'A short audio loop, originally a physical loop of magnetic tape, used as a compositional building block.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Tape_loop'
	},
	{
		id: 'musique-concrete',
		name: 'Musique Concrète',
		category: 'sound-design',
		difficulty: 3,
		genres: ['experimental', 'ambient', 'idm'],
		prompt:
			'Build a section using only field-recorded source material (no synths, no drum samples). Process it however you want.',
		definition:
			'Composition assembled from recorded real-world sounds rather than from notated instruments or pure synthesis.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Musique_concr%C3%A8te'
	},
	{
		id: 'acousmatic-sound',
		name: 'Acousmatic Sound',
		category: 'sound-design',
		difficulty: 3,
		genres: ['experimental', 'ambient'],
		prompt:
			'Use a single sound whose physical source the listener cannot identify. Make it the harmonic anchor of your piece.',
		definition:
			'A sound heard without seeing or knowing its physical source — a whole tradition of electroacoustic music is built on it.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Acousmatic_music'
	},
	{
		id: 'generative-music',
		name: 'Generative Music',
		category: 'arrangement',
		difficulty: 3,
		genres: ['ambient', 'experimental', 'idm'],
		prompt:
			'Define one simple rule (e.g. "trigger a random pitch from D dorian every 1.7 seconds") and let it run untouched for 4 minutes.',
		definition:
			'Music created by a set of rules or processes that produce ongoing output without manual composition of each moment. Term coined by Brian Eno.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Generative_music'
	},
	{
		id: 'process-music',
		name: 'Process Music',
		category: 'arrangement',
		difficulty: 3,
		genres: ['ambient', 'experimental'],
		prompt:
			'Pick a single process (e.g. one note drops out every 16 bars) and let it run to completion as the entire track.',
		definition:
			'A compositional approach where a simple process is established and audibly runs to completion. Strongly associated with Steve Reich.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Process_music'
	},
	{
		id: 'aleatoric',
		name: 'Aleatoric / Chance Music',
		category: 'arrangement',
		difficulty: 3,
		genres: ['experimental', 'idm'],
		prompt:
			'Use a dice roll (or random plugin) to determine the chord progression at each section boundary. Commit to the result.',
		definition:
			'Music incorporating chance or randomness into composition or performance decisions.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Aleatoric_music'
	},
	{
		id: 'stochastic-music',
		name: 'Stochastic Music',
		category: 'arrangement',
		difficulty: 3,
		genres: ['experimental', 'idm'],
		prompt:
			'Design a section where pitch density, register and dynamics are controlled by probability distributions rather than written notes.',
		definition:
			'Music composed using statistical distributions to determine its parameters — pioneered by Iannis Xenakis.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Stochastic_music'
	},
	{
		id: 'sound-mass',
		name: 'Sound Mass',
		category: 'arrangement',
		difficulty: 3,
		genres: ['ambient', 'experimental'],
		prompt:
			'Stack 16 voices playing micro-detuned versions of the same pitch and crossfade their relative volumes for a minute. No rhythm, no chord change.',
		definition:
			'A compositional approach where individual pitches and rhythms dissolve into a continuous textural mass (Ligeti, Penderecki).',
		wikiUrl: 'https://en.wikipedia.org/wiki/Sound_mass'
	},
	{
		id: 'pitch-class-set',
		name: 'Pitch-Class Set',
		category: 'melody',
		difficulty: 3,
		genres: ['idm', 'experimental'],
		prompt:
			'Pick an unordered set of 4 pitch classes (e.g. {C, D♭, E, G♭}) and restrict your entire melody to permutations of that set.',
		definition:
			'Set theory applied to music: treating chords and melodies as unordered collections of pitch classes for analysis and composition.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Set_theory_(music)'
	},
	{
		id: 'mensural-canon',
		name: 'Mensural / Prolation Canon',
		category: 'melody',
		difficulty: 3,
		genres: ['idm', 'experimental'],
		prompt:
			'Have two voices play the same melody but at different speed ratios (e.g. 1:2). The slow voice is the lead, the fast voice is its echo.',
		definition:
			'A strict canon where voices proceed through the same line at different speed ratios.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Mensuration_canon'
	},
	{
		id: 'sensory-dissonance',
		name: 'Sensory Dissonance',
		category: 'harmony',
		difficulty: 3,
		genres: [],
		prompt:
			'Stack two pitches inside the critical band (within ~15 percent of each other) and ride that beating roughness as a lead voice for 8 bars.',
		definition:
			'Roughness perceived when two tones interfere within the critical band, independent of music-theoretic dissonance.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Consonance_and_dissonance'
	},
	{
		id: 'auditory-streaming',
		name: 'Auditory Streaming',
		category: 'melody',
		difficulty: 3,
		genres: ['idm', 'experimental'],
		prompt:
			'Write a fast single-line melody that leaps wide between two registers so the brain hears it as two interlocked voices instead of one.',
		definition:
			'The brain’s tendency to group successive tones into distinct perceptual streams based on pitch proximity.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Auditory_scene_analysis'
	},
	{
		id: 'earworm-motif',
		name: 'Earworm Motif',
		category: 'melody',
		difficulty: 1,
		genres: [],
		prompt:
			'Compose a 3-note motif simple enough that you can hum it after one listen. Use it as the head of every section.',
		definition:
			'A short, simple, highly memorable melodic fragment built to stick in the listener’s head.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Earworm'
	}
];

async function main() {
	const raw = await readFile(PATH, 'utf8');
	const existing = JSON.parse(raw) as Concept[];
	const seen = new Set(existing.map((c) => c.id));
	let added = 0;
	for (const c of ADDITIONS) {
		if (!seen.has(c.id)) {
			existing.push(c);
			seen.add(c.id);
			added++;
		}
	}
	await writeFile(PATH, JSON.stringify(existing, null, '\t') + '\n', 'utf8');
	console.log(`Added ${added}. Total now: ${existing.length}.`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
