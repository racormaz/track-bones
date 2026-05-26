// Removes the generic `motif` concept and adds ~50 specific motif entries
// sourced from the v2.3 research pass. Genres normalized against the actual
// GenreId set (entries referencing genres we don't support get those tags
// stripped, falling back to universal []).

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

type Concept = {
	id: string;
	name: string;
	category: string;
	difficulty: 1 | 2 | 3;
	genres: string[];
	prompt: string;
	definition: string;
	wikiUrl: string | null;
	[k: string]: unknown;
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const PATH = resolve(__dirname, '..', 'src', 'lib', 'content', 'concepts.json');

// Our supported GenreIds.
const VALID_GENRES = new Set([
	'house', 'techno', 'dnb', 'ambient', 'experimental', 'idm', 'bass',
	'dubstep', 'trance', 'acid-house', 'uk-garage', 'psytrance', 'trap',
	'future-bass', 'synthwave', 'hardstyle'
]);

// Mapping from research-file genre tags (broader vocabulary) to our actual
// GenreIds. `null` means "no clean mapping — drop this tag from the entry."
const GENRE_MAP: Record<string, string | null> = {
	// House family
	'house': 'house', 'deep-house': 'house', 'tech-house': 'house',
	'progressive-house': 'house', 'jazz-house': 'house', 'lo-fi-house': 'house',
	'latin-house': 'house', 'afro-house': 'house', 'tribal-house': 'house',
	'piano-house': 'house', 'electro-house': 'house', 'tropical-house': 'house',
	'future-funk': 'house',
	// Techno family
	'techno': 'techno', 'minimal-techno': 'techno', 'dub-techno': 'techno',
	'industrial-techno': 'techno', 'acid-techno': 'techno', 'industrial': 'techno',
	'electro': 'techno',
	// DnB family
	'dnb': 'dnb', 'drum-and-bass': 'dnb', 'neurofunk': 'dnb', 'jungle': 'dnb',
	'jump-up': 'dnb', 'liquid-dnb': 'dnb', 'breakbeat': 'dnb', 'big-beat': 'dnb',
	// Ambient family
	'ambient': 'ambient', 'drone': 'ambient', 'dark-ambient': 'ambient',
	'downtempo': 'ambient', 'ambient-jazz': 'ambient', 'world-fusion': 'ambient',
	'folk-electronica': 'ambient', 'post-rock': 'ambient', 'raga-influenced': 'ambient',
	'ethno-trance': 'ambient',
	// Experimental / IDM
	'experimental': 'experimental', 'glitch': 'experimental', 'noise': 'experimental',
	'idm': 'idm', 'breakcore': 'idm',
	// Bass / dubstep / future-bass
	'bass': 'bass', 'dubstep': 'dubstep', 'brostep': 'dubstep', 'riddim': 'dubstep',
	'melodic-dubstep': 'dubstep', 'future-bass': 'future-bass',
	// Trance
	'trance': 'trance', 'uplifting-trance': 'trance', 'progressive-trance': 'trance',
	'goa-trance': 'trance', 'hard-trance': 'trance',
	// Other
	'acid-house': 'acid-house', 'uk-garage': 'uk-garage', 'garage': 'uk-garage',
	'psytrance': 'psytrance', 'trap': 'trap', 'hip-hop': 'trap',
	'synthwave': 'synthwave', 'vaporwave': 'synthwave',
	'hardstyle': 'hardstyle', 'gabber': 'hardstyle', 'hardcore': 'hardstyle',
	'rave': 'hardstyle',
	// Outside our universe — drop the tag, fall back to universal [].
	'pop': null, 'dance-pop': null, 'edm': null, 'rock': null, 'funk': null,
	'electronic-rock': null, 'nu-jazz': null, 'broken-beat': null, 'lo-fi': null,
	'jazz-fusion': null, 'future-jazz': null, 'big-room': null,
	'orchestral-edm': null, 'trailer-music': null, 'horror-soundtrack': null,
	'electronic-metal': null, 'neoclassical-edm': null, 'jersey-club': null,
	'blues-rock': null, 'classical-crossover': null, 'classical': null
};

function normalizeGenres(input: string[]): string[] {
	const out = new Set<string>();
	for (const g of input) {
		const mapped = GENRE_MAP[g];
		if (mapped && VALID_GENRES.has(mapped)) out.add(mapped);
	}
	return Array.from(out);
}

type NewEntry = Omit<Concept, 'genres'> & { genres: string[] };

const NEW_ENTRIES: NewEntry[] = [
	// ===== A1. Pop / EDM =====
	{
		id: 'pop-hook', name: 'Pop Hook', category: 'melody', difficulty: 1,
		genres: normalizeGenres(['pop', 'edm', 'dance-pop', 'future-bass']),
		prompt: 'Write a 4-bar vocal hook that lands its highest pitch on beat 1 of bar 3, uses no more than 5 distinct pitches, and is sung at least 3 times in the chorus.',
		definition: "A short, immediately memorable melodic or lyrical phrase engineered to be the song's primary point of recognition.",
		wikiUrl: 'https://en.wikipedia.org/wiki/Hook_(music)'
	},
	{
		id: 'ear-candy-fill', name: 'Ear Candy Fill', category: 'melody', difficulty: 2,
		genres: normalizeGenres(['edm', 'pop', 'future-bass', 'deep-house']),
		prompt: 'Place a 1-bar non-repeating ornamental fill (FX riser, reversed cymbal, vocal chop spray, or pitched stab) at the last bar of every 8-bar phrase, never the same twice.',
		definition: 'A brief, non-repeating decorative element placed at section seams to reward close listening without becoming a recurring motif.',
		wikiUrl: null
	},
	{
		id: 'lead-riff', name: 'Lead Riff (Synth Lead)', category: 'melody', difficulty: 1,
		genres: normalizeGenres(['trance', 'big-room', 'progressive-house', 'electro-house']),
		prompt: 'Compose an 8-note monosynth lead phrase over 2 bars, repeat it identically for the first 16 bars of the drop, then transpose up a minor third for the next 8.',
		definition: 'A foreground synthesizer melodic phrase that carries the main melodic identity of a section, typically on a saw, square, or supersaw timbre.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Riff'
	},
	{
		id: 'vocal-chop-motif', name: 'Vocal Chop Motif', category: 'melody', difficulty: 2,
		genres: normalizeGenres(['future-bass', 'tropical-house', 'edm', 'melodic-dubstep']),
		prompt: 'Take a single sung syllable, pitch it across 4 notes spanning a perfect fifth, and arrange those 4 chops as a 2-bar pattern that repeats 8 times in the drop.',
		definition: 'A melodic figure built from short, repitched fragments of a vocal recording treated as a sample-instrument motif.',
		wikiUrl: null
	},
	// ===== A2. Rock / funk =====
	{
		id: 'signature-riff', name: 'Signature Riff', category: 'melody', difficulty: 1,
		genres: normalizeGenres(['rock', 'funk', 'electronic-rock', 'big-beat']),
		prompt: 'Write a single 2-bar guitar/bass riff that opens the track, returns unchanged before every chorus, and is the last thing heard in the outro.',
		definition: "A short instrumental phrase so identified with a song that it serves as the song's primary recognition cue across multiple sections.",
		wikiUrl: 'https://en.wikipedia.org/wiki/Riff'
	},
	{
		id: 'lick', name: 'Lick', category: 'melody', difficulty: 1,
		genres: normalizeGenres(['funk', 'jazz-house', 'nu-disco', 'blues-rock']),
		prompt: 'Drop a 6-12 note improvisatory phrase into a gap between vocal lines exactly once per verse, never landing on the downbeat.',
		definition: "A stock or improvisatory melodic phrase used as a filler or solo fragment, often borrowed from a player's vocabulary.",
		wikiUrl: 'https://en.wikipedia.org/wiki/Lick_(music)'
	},
	{
		id: 'power-chord-riff', name: 'Power-Chord Riff', category: 'melody', difficulty: 1,
		genres: normalizeGenres(['electronic-rock', 'industrial', 'big-beat', 'dubstep']),
		prompt: 'Build a 4-bar riff using only root-fifth dyads on three pitches, palm-muted 16ths under sustained chord hits on beats 1 and 3.',
		definition: 'A riff built primarily from two-note root-fifth dyads (power chords) rather than single notes, giving harmonic weight without modal commitment.',
		wikiUrl: null
	},
	{
		id: 'gallop-riff', name: 'Gallop Riff', category: 'melody', difficulty: 2,
		genres: normalizeGenres(['industrial', 'neurofunk', 'drum-and-bass', 'electronic-metal']),
		prompt: 'Write a riff whose rhythm is strictly eighth-two-sixteenths (long-short-short) repeated for 4 bars on a single pitch, then transpose the same rhythm down a whole step for 4 bars.',
		definition: 'A riff defined by a galloping long-short-short rhythmic cell (typically dotted-eighth or eighth + two sixteenths) repeated as the primary rhythmic identity.',
		wikiUrl: null
	},
	// ===== A3. Jazz =====
	{
		id: 'head', name: 'Head', category: 'melody', difficulty: 2,
		genres: normalizeGenres(['nu-jazz', 'broken-beat', 'jazz-house', 'lo-fi']),
		prompt: 'Compose a 16-bar AABA melody that states the tune\'s theme, then improvise/develop for 32 bars, then return to the head unchanged for the final 16.',
		definition: 'The primary stated melody of a jazz tune, played at the top and tail of the performance around improvised choruses.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Head_(music)'
	},
	{
		id: 'ii-v-lick', name: 'ii-V Lick', category: 'melody', difficulty: 3,
		genres: normalizeGenres(['nu-jazz', 'future-jazz', 'broken-beat']),
		prompt: 'Write an 8-note phrase that targets the 3rd of the V chord on the downbeat of the V bar, and resolves to the 5th of the I chord on the downbeat of the I bar, all 16th notes.',
		definition: 'A pre-formed melodic phrase shaped to navigate the ii-V-I progression with strong chord-tone targeting.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Ii%E2%80%93V%E2%80%93I_progression'
	},
	{
		id: 'comping-figure', name: 'Comping Figure', category: 'melody', difficulty: 2,
		genres: normalizeGenres(['nu-jazz', 'broken-beat', 'deep-house', 'jazz-house']),
		prompt: 'Write a 2-bar rhythmic chord pattern (chord stabs only, no held notes) that lands on the and-of-2 and the and-of-4, repeating identically for 32 bars under a soloist.',
		definition: 'A rhythmic chordal accompaniment pattern played behind a soloist, defined by its rhythmic shape rather than its melodic content.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Comping_(jazz)'
	},
	{
		id: 'montuno', name: 'Montuno', category: 'melody', difficulty: 2,
		genres: normalizeGenres(['latin-house', 'afro-house', 'tribal-house']),
		prompt: 'Write a 2-bar syncopated piano figure in clave-aligned 16ths using only chord tones of i-iv-V-i, and loop it identically for 64 bars.',
		definition: 'An Afro-Cuban syncopated piano vamp built on chord tones in clave-aligned rhythm, sustained as the rhythmic-harmonic engine of a section.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Montuno'
	},
	{
		id: 'guide-tone-line', name: 'Guide Tone Line', category: 'melody', difficulty: 3,
		genres: normalizeGenres(['nu-jazz', 'ambient-jazz', 'downtempo']),
		prompt: 'Write a slow melody where each chord change is voiced by its 3rd or 7th, with stepwise motion between adjacent chord tones across 8 bars.',
		definition: 'A connective melodic line built from the 3rds and 7ths of successive chords, moving by step to outline harmonic motion.',
		wikiUrl: null
	},
	// ===== A4. Classical / concert =====
	{
		id: 'head-motif', name: 'Head Motif (Kopfmotiv)', category: 'melody', difficulty: 2,
		genres: [],
		prompt: 'Compose a 3- to 5-note opening cell that appears as the literal first sound of every major section of the piece, untransposed each time.',
		definition: 'The opening melodic cell of a piece used as a recurring identifier at the start of subsequent movements or sections.',
		wikiUrl: null
	},
	{
		id: 'basic-idea', name: 'Basic Idea (Schoenbergian)', category: 'melody', difficulty: 3,
		genres: [],
		prompt: 'Write a 2-bar phrase, then derive every subsequent phrase in the section by transforming only that 2-bar cell (no new pitch material introduced).',
		definition: "Schoenberg's term for the foundational 2-bar musical idea from which an entire piece's material is derived through transformation.",
		wikiUrl: null
	},
	{
		id: 'transition-motif', name: 'Transition Motif', category: 'melody', difficulty: 2,
		genres: normalizeGenres(['progressive-house', 'progressive-trance', 'ambient']),
		prompt: 'Write a 4-bar phrase that appears only when modulating between sections, never inside a stable section, and whose contour rises by step across its full length.',
		definition: 'A motif reserved for connecting passages between sections, signaling motion or modulation rather than statement.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Transition_(music)'
	},
	{
		id: 'codetta', name: 'Codetta', category: 'melody', difficulty: 2,
		genres: normalizeGenres(['ambient', 'progressive-house', 'classical-crossover']),
		prompt: 'Write a 4-bar phrase using only the tonic and dominant pitches that appears exclusively to close each section, never inside one.',
		definition: 'A small closing phrase that concludes a section (not the whole piece) with cadential weight.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Coda_(music)'
	},
	{
		id: 'incipit', name: 'Incipit', category: 'melody', difficulty: 2,
		genres: [],
		prompt: 'Compose a distinctive 5-7 note opening figure that you commit to as the track\'s literal identifier (intro logo), and never reuse it inside the track.',
		definition: 'The first few notes of a piece used as its unique identifying signature, like a melodic logo.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Incipit'
	},
	// ===== A5. World / folk =====
	{
		id: 'drone-and-motif', name: 'Drone-and-Motif Pairing', category: 'melody', difficulty: 2,
		genres: normalizeGenres(['psytrance', 'ambient', 'drone', 'dark-ambient', 'ethno-trance']),
		prompt: 'Hold a single root-fifth drone in the bass for the entire track, and let a melodic motif of 7-9 notes ornament that drone in the top voice, returning every 16 bars.',
		definition: 'A pairing in which a sustained drone anchors pitch space while a melodic motif rotates above it as the only source of variation.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Drone_(music)'
	},
	{
		id: 'alap-style-motif', name: 'Alap-Style Melodic Call', category: 'melody', difficulty: 3,
		genres: normalizeGenres(['ambient', 'raga-influenced', 'ethno-trance', 'world-fusion']),
		prompt: 'Write a melodically free, unmetered intro that introduces 5 pitches one at a time, where each new pitch never appears more than one scale step above or below previously introduced ones.',
		definition: 'A free-meter, gradually unfolding melodic invocation that exposes a scale one note at a time within strict adjacency limits.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Alap'
	},
	{
		id: 'adhan-style-call', name: 'Adhan-Style Melodic Call', category: 'melody', difficulty: 3,
		genres: normalizeGenres(['ambient', 'world-fusion', 'ethno-trance', 'downtempo']),
		prompt: 'Sing or synth-voice a phrase, then immediately repeat it longer, ornamented, and ranging an octave wider; alternate 12 such pairs without metric pulse.',
		definition: 'A call-style phrase that returns as an ornamented, wider-range version of itself in alternation, drawn from Islamic call-to-prayer tradition.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Adhan'
	},
	{
		id: 'pibroch-ground', name: 'Pibroch Ground (Urlar)', category: 'melody', difficulty: 3,
		genres: normalizeGenres(['ambient', 'folk-electronica', 'world-fusion']),
		prompt: 'Write a slow 16-bar theme, then produce 4 successive variations of it where each variation adds one ornamental layer while preserving the original note placements.',
		definition: 'A slow stated theme (urlar) followed by a series of progressively more ornamented variations, drawn from the Scottish piobaireachd tradition.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Pibroch'
	},
	// ===== A6. Electronic genre-specific =====
	{
		id: 'trance-lead-hook', name: 'Trance Lead Hook', category: 'melody', difficulty: 2,
		genres: normalizeGenres(['trance', 'uplifting-trance', 'psytrance', 'progressive-trance']),
		prompt: 'Write a 16-bar supersaw melody in a minor key, introduce a stripped-down 8-bar preview before the breakdown, then deliver it fully after the build.',
		definition: 'The signature melodic phrase of a trance track, previewed in stripped form pre-breakdown and stated in full post-build.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Trance_music'
	},
	{
		id: 'growl-motif', name: 'Dubstep Growl Motif', category: 'melody', difficulty: 3,
		genres: normalizeGenres(['dubstep', 'riddim', 'brostep', 'future-bass']),
		prompt: 'Write a 2-bar bass phrase using only 3 pitches at 70-75% wavetable position, modulated by an envelope-driven LFO with rhythm 16th-16th-8th-rest-8th-16th-16th.',
		definition: 'A short bass-synth phrase whose identity is the timbral growl shape as much as the pitch sequence, typical of dubstep drops.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Dubstep'
	},
	{
		id: 'dnb-stab-motif', name: 'DnB Stab Motif', category: 'melody', difficulty: 2,
		genres: normalizeGenres(['drum-and-bass', 'neurofunk', 'jungle']),
		prompt: 'Write a 1-bar pattern of 3 short pitched stabs (Reese or sub) at positions 1, 2.5, and 4, looping for 32 bars over a Think break.',
		definition: 'A short, sharply attacked sub or Reese-bass motif arranged as 2-3 staccato stabs per bar over a break.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Reese_bass'
	},
	{
		id: 'techno-blip-motif', name: 'Techno Blip Motif', category: 'melody', difficulty: 1,
		genres: normalizeGenres(['techno', 'minimal-techno', 'dub-techno']),
		prompt: 'Loop a single 16th-note pitched blip on offbeats only for 32 bars, then add one neighbor pitch a minor third away for the next 32.',
		definition: 'A minimal pitched-percussive motif of 1-2 pitches, sustained by repetition rather than melodic development.',
		wikiUrl: null
	},
	{
		id: 'house-piano-riff', name: 'House Piano Riff', category: 'melody', difficulty: 1,
		genres: normalizeGenres(['house', 'deep-house', 'piano-house', 'garage']),
		prompt: 'Write a 2-bar piano figure of root-position 7th-chord stabs on the and-of-1 and the and-of-3, looping for 16 bars under a 4-on-the-floor kick.',
		definition: 'A syncopated piano-chord motif anchored on the offbeats, foundational to classic house music.',
		wikiUrl: null
	},
	{
		id: 'hoover-motif', name: 'Hoover Motif', category: 'melody', difficulty: 2,
		genres: normalizeGenres(['hardstyle', 'hard-trance', 'rave', 'gabber', 'hardcore']),
		prompt: 'Write a 1-bar pitched-hoover phrase of 4 notes spanning a fifth, repeat 8 times rising chromatically each pair, then drop back to the original.',
		definition: 'A motif voiced on the detuned saw/PWM "hoover" patch, treated as a sequence of pitched hits.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Hoover_sound'
	},
	{
		id: 'acid-303-motif', name: 'Acid 303 Squelch Motif', category: 'melody', difficulty: 2,
		genres: normalizeGenres(['acid-house', 'acid-techno', 'electro']),
		prompt: 'Sequence 16 sixteenth-notes from a single root pitch with 3-4 accents, 2-3 slides, and 1-2 octave jumps; let filter cutoff sweep across 32 bars without changing the pitch sequence.',
		definition: 'A monophonic 16th-note pattern with accent/slide/octave features driven by a 303-style synth, whose identity is the filter sweep over a fixed note sequence.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Acid_house'
	},
	{
		id: 'breakbeat-hit-motif', name: 'Breakbeat Hit Motif', category: 'melody', difficulty: 2,
		genres: normalizeGenres(['breakbeat', 'big-beat', 'drum-and-bass', 'jungle']),
		prompt: 'Pick 4 single drum hits from a break (kick, snare, ghost, crash) and arrange them as a 2-bar pattern, looping unchanged for 32 bars.',
		definition: 'A motif constructed from individually placed drum hits sliced from a breakbeat, treated as a melodic-rhythmic figure.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Breakbeat'
	},
	// ===== B. Shape =====
	{
		id: 'three-note-cell', name: 'Three-Note Cell', category: 'melody', difficulty: 2,
		genres: [],
		prompt: 'Compose a 3-note cell (rhythm + interval shape) and base every section\'s melodic material on transformations of only those 3 notes for the entire track.',
		definition: "A 3-pitch generative cell (a la Beethoven 5th's short-short-short-long) from which all melodic material in a piece is derived.",
		wikiUrl: null
	},
	{
		id: 'two-note-cell', name: 'Two-Note Cell', category: 'melody', difficulty: 1,
		genres: normalizeGenres(['dark-ambient', 'horror-soundtrack', 'industrial', 'drone']),
		prompt: 'Alternate two pitches a tritone or minor second apart in a Jaws-style binary pattern, slowly accelerating from 1/4 to 1/16 notes over 32 bars.',
		definition: 'A binary two-pitch alternation whose identity comes from the interval and the acceleration/deceleration of the alternation.',
		wikiUrl: null
	},
	{
		id: 'arch-motif', name: 'Arch Motif', category: 'melody', difficulty: 1,
		genres: [],
		prompt: 'Write a single 4-bar phrase whose pitch peak is at exactly the midpoint, rising stepwise to it and descending stepwise from it.',
		definition: 'A phrase whose contour rises to a single midpoint apex and then symmetrically descends within one statement.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Arch_form'
	},
	{
		id: 'descending-motif', name: 'Descending Motif', category: 'melody', difficulty: 1,
		genres: [],
		prompt: 'Write a 2-bar motif whose every successive pitch is lower than the last, spanning a full octave from top to bottom.',
		definition: 'A motif whose pitches descend monotonically across the phrase, defining the figure by its downward direction.',
		wikiUrl: null
	},
	{
		id: 'ascending-motif', name: 'Ascending Motif', category: 'melody', difficulty: 1,
		genres: [],
		prompt: 'Write a 2-bar motif whose every successive pitch is higher than the last, spanning a full octave from bottom to top.',
		definition: 'A motif whose pitches ascend monotonically across the phrase, defining the figure by its upward direction.',
		wikiUrl: null
	},
	{
		id: 'leaping-motif', name: 'Leaping (Disjunct) Motif', category: 'melody', difficulty: 2,
		genres: [],
		prompt: 'Write a motif of 6-8 notes where every interval is at least a perfect 4th; no stepwise motion allowed.',
		definition: 'A motif built primarily from large intervallic leaps (perfect 4th or wider) rather than scalar motion.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Steps_and_skips'
	},
	{
		id: 'stepwise-motif', name: 'Stepwise (Conjunct) Motif', category: 'melody', difficulty: 1,
		genres: [],
		prompt: 'Write a motif of 8-10 notes where every interval is exactly a 2nd (major or minor); no leaps allowed.',
		definition: 'A motif built entirely from scale steps (no skips), tracing a continuous scalar shape.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Steps_and_skips'
	},
	{
		id: 'pivot-tone-motif', name: 'Pivot-Tone Motif', category: 'melody', difficulty: 2,
		genres: normalizeGenres(['ambient', 'post-rock', 'progressive-house']),
		prompt: 'Hold one pitch (e.g. A4) as a constant top note across 4 chord changes, where each new chord assigns that pitch a different scale degree.',
		definition: 'A motif consisting of a single held or repeated pitch whose function changes as the harmony around it shifts.',
		wikiUrl: null
	},
	{
		id: 'fanfare-motif', name: 'Fanfare Motif', category: 'melody', difficulty: 1,
		genres: normalizeGenres(['big-room', 'hardstyle', 'orchestral-edm', 'trailer-music']),
		prompt: 'Write a 1-bar motif using only the notes of a major triad, with at least one perfect-5th leap and a dotted long-short-short rhythm.',
		definition: 'A brassy declarative motif built from triadic arpeggios and dotted rhythms, evoking heraldic announcement.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Fanfare'
	},
	{
		id: 'question-answer-motif', name: 'Question-and-Answer Motif', category: 'melody', difficulty: 2,
		genres: [],
		prompt: 'Write a single 8-bar phrase as two 4-bar halves: the first ends on the dominant (half cadence, "question"), the second restates with new ending on tonic ("answer").',
		definition: 'A self-contained antecedent-consequent motif where one phrase poses an open cadence and a related phrase resolves it.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Period_(music)'
	},
	{
		id: 'pickup-motif', name: 'Pickup Motif', category: 'melody', difficulty: 2,
		genres: normalizeGenres(['funk', 'nu-disco', 'future-funk']),
		prompt: 'Build a recurring 1-bar motif that always starts on the and-of-4 of the previous bar and lands its accent on the downbeat of bar 1, every time it appears.',
		definition: 'A motif whose identifying feature is an anacrusic launch into a strong downbeat landing, treated as the full phrase shape (not just the pickup itself).',
		wikiUrl: null
	},
	{
		id: 'cadenza-flourish-motif', name: 'Cadenza-Style Flourish', category: 'melody', difficulty: 3,
		genres: normalizeGenres(['progressive-trance', 'neoclassical-edm', 'drum-and-bass']),
		prompt: 'Insert a single unmetered or tempo-free virtuosic run of 16-32 notes between the build and the drop, never repeating within the track.',
		definition: 'A virtuosic, often rhythmically free flourish placed at a structural seam as a one-time display.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Cadenza'
	},
	// ===== C. Development =====
	{
		id: 'real-sequence', name: 'Real Sequence', category: 'melody', difficulty: 2,
		genres: [],
		prompt: 'State a 2-bar motif, then transpose it exactly (preserving all intervals chromatically) up a minor 3rd, then up another minor 3rd, then a final minor 3rd.',
		definition: 'Repetition of a motif at successive transpositions where intervals are preserved exactly (chromatic transposition).',
		wikiUrl: 'https://en.wikipedia.org/wiki/Sequence_(music)'
	},
	{
		id: 'tonal-sequence', name: 'Tonal Sequence', category: 'melody', difficulty: 2,
		genres: [],
		prompt: 'State a 2-bar motif in C major, then repeat it stepwise up the scale (D-E-F-G), letting interval qualities adjust to stay in the key.',
		definition: 'Repetition of a motif at successive scale-step transpositions where intervals adjust diatonically rather than preserving chromatically.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Sequence_(music)'
	},
	{
		id: 'modulating-sequence', name: 'Modulating Sequence', category: 'melody', difficulty: 3,
		genres: normalizeGenres(['progressive-trance', 'neoclassical-edm']),
		prompt: 'State a 2-bar motif, then re-state it each time transposed into a new key, modulating through 4 keys over 8 bars before resolving home.',
		definition: 'A sequence whose successive statements move the music into different key centers rather than staying in one tonal region.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Sequence_(music)'
	},
	{
		id: 'melodic-inversion', name: 'Melodic Inversion', category: 'melody', difficulty: 2,
		genres: [],
		prompt: 'Write an 8-note motif, then write its mirror image where every interval reverses direction (up becomes down by the same amount), and alternate the two versions every 4 bars.',
		definition: 'A motif transformation where the pitch contour is flipped upside-down, reversing the direction of every interval.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Inversion_(music)'
	},
	{
		id: 'tonal-inversion', name: 'Tonal Inversion', category: 'melody', difficulty: 2,
		genres: [],
		prompt: 'Write a diatonic 8-note motif, then invert it so the contour flips but every pitch stays in the home scale (let interval qualities change as needed).',
		definition: 'Inversion where the contour reverses but each pitch is constrained to the diatonic scale, so interval qualities adjust.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Inversion_(music)'
	},
	{
		id: 'truncation', name: 'Truncation', category: 'melody', difficulty: 2,
		genres: [],
		prompt: 'State an 8-note motif twice, then state only its first 4 notes twice, then only its first 2 notes four times, before the section ends.',
		definition: 'Successive shortening of a motif by lopping notes off its tail (or head) across restatements.',
		wikiUrl: null
	},
	{
		id: 'expansion', name: 'Expansion / Extension', category: 'melody', difficulty: 2,
		genres: [],
		prompt: 'State a 4-note motif twice, then re-state it with 2 extra notes appended; restate again with 4 extra notes; finally with 8 extra notes.',
		definition: 'Progressive lengthening of a motif by appending new notes to extend its end across restatements.',
		wikiUrl: null
	},
	{
		id: 'liquidation', name: 'Liquidation', category: 'melody', difficulty: 3,
		genres: [],
		prompt: 'Across 16 bars, gradually strip every defining feature of an initial motif until only a generic scalar gesture remains by bar 16.',
		definition: "Schoenberg's term for the gradual neutralization of a motif's characteristic features into generic material to prepare new material.",
		wikiUrl: null
	},
	{
		id: 'motif-combination', name: 'Motif Combination', category: 'melody', difficulty: 3,
		genres: [],
		prompt: 'Write motif A (4 notes, rhythm A) and motif B (4 notes, rhythm B), then state a third motif built by interleaving them note-by-note into a single 8-note phrase.',
		definition: 'Fusion of two distinct motifs into a single combined statement (interleaved, stacked, or concatenated).',
		wikiUrl: null
	},
	{
		id: 'pitch-permutation', name: 'Pitch Permutation', category: 'melody', difficulty: 3,
		genres: [],
		prompt: "Write a 6-note motif. Then write 3 restatements where the pitch order is permuted (e.g. reverse pairs, swap halves, rotate by 2) while keeping the rhythm identical.",
		definition: "Reordering of a motif's pitches while preserving its rhythm, drawn from 12-tone practice.",
		wikiUrl: 'https://en.wikipedia.org/wiki/Permutation_(music)'
	},
	{
		id: 'rotation', name: 'Rotation', category: 'melody', difficulty: 2,
		genres: [],
		prompt: 'Write an 8-note motif, then restate it starting from note 3 (notes 3-4-5-6-7-8-1-2), then starting from note 5, then starting from note 7.',
		definition: 'Cyclical reordering of a motif so it starts on a different note each time while preserving the internal sequence.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Permutation_(music)'
	},
	{
		id: 'interpolation', name: 'Interpolation', category: 'melody', difficulty: 2,
		genres: [],
		prompt: 'Take a 4-note motif. Restate it with one neighboring pitch inserted between each pair of original notes (yielding 7 notes). Restate again with two inserts between each pair (10 notes).',
		definition: "Insertion of additional pitches between a motif's original notes, expanding it from within without changing the anchor notes.",
		wikiUrl: null
	},
	{
		id: 'ornamentation', name: 'Ornamentation / Embellishment', category: 'melody', difficulty: 2,
		genres: [],
		prompt: 'State a 4-bar motif plain on first appearance. On its second appearance, decorate every note with a trill, grace note, or short turn without changing the underlying pitches or rhythm.',
		definition: 'Decoration of a motif with trills, grace notes, turns, or slides on restatement while preserving its skeletal pitches and rhythm.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Ornament_(music)'
	},
	// ===== D. Production / synth =====
	{
		id: 'arp-motif', name: 'Arpeggiator Motif', category: 'melody', difficulty: 1,
		genres: normalizeGenres(['trance', 'synthwave', 'progressive-house', 'edm']),
		prompt: 'Hold a 4-note chord through an arpeggiator set to up-down 16ths over 2 octaves, change the chord every 2 bars, and let the arp pattern itself be the motif for 16 bars.',
		definition: 'A motif generated by an arpeggiator running over held chords, where the arp pattern (not the held chord) carries the melodic identity.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Arpeggio'
	},
	{
		id: 'stutter-motif', name: 'Stutter Motif', category: 'melody', difficulty: 2,
		genres: normalizeGenres(['glitch', 'idm', 'dubstep', 'breakcore', 'future-bass']),
		prompt: 'Take a single pitched sample and stutter-repeat it in 16th-32nd-64th accelerating subdivisions over 1 bar, treating that 1-bar stutter as a recurring motif every 8 bars.',
		definition: 'A motif built from rapid granular re-triggering of a single sound, where the stutter rhythm itself is the figure.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Stutter_edit'
	},
	{
		id: 'chord-stab-motif', name: 'Chord Stab Motif', category: 'melody', difficulty: 1,
		genres: normalizeGenres(['house', 'hip-hop', 'breakbeat', 'big-beat']),
		prompt: 'Pick one chord voicing. Play it as a 1-bar 4-stab rhythmic pattern (positions 1, 1.75, 2.5, 4) and loop unchanged for 16 bars.',
		definition: 'A motif built from short staccato chord hits on a fixed voicing, where the rhythm is the identity and the harmony is static.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Stab_(music)'
	},
	{
		id: 'pitch-bend-motif', name: 'Pitch-Bend Motif', category: 'melody', difficulty: 2,
		genres: normalizeGenres(['dubstep', 'future-bass', 'vaporwave', 'trap']),
		prompt: "Hold a single note for 2 bars while bending it down a perfect 5th and back up over its duration. Repeat this gesture every 4 bars as the section's identifying figure.",
		definition: 'A motif defined by continuous pitch glide rather than discrete note placement.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Pitch_bend'
	},
	{
		id: 'resampled-motif', name: 'Resampled Motif', category: 'melody', difficulty: 3,
		genres: normalizeGenres(['glitch', 'idm', 'breakcore', 'future-bass', 'jersey-club']),
		prompt: 'Render a 4-bar melody. Reimport it as a sample, chop it into 8 slices, rearrange the slices in a new order, and use that rearrangement as the motif for the next section.',
		definition: 'A motif created by sampling a rendered melodic phrase and reconstructing a new sequence from its chopped pieces.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Chopped_and_screwed'
	},
	{
		id: 'one-shot-stab-motif', name: 'One-Shot Stab Motif', category: 'melody', difficulty: 1,
		genres: normalizeGenres(['big-beat', 'hip-hop', 'breakbeat', 'drum-and-bass']),
		prompt: 'Trigger a single pitched one-shot sample (orchestra hit, vocal "hey", or risers stab) on beat 1 of every 4th bar across the entire track, never anywhere else.',
		definition: 'A motif consisting of a single sampled hit deployed at a strict periodic placement.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Stab_(music)'
	},
	{
		id: 'wobble-motif', name: 'Wobble Motif', category: 'melody', difficulty: 2,
		genres: normalizeGenres(['dubstep', 'drum-and-bass', 'brostep', 'riddim']),
		prompt: 'Hold a 1-bar bass note, modulate its filter cutoff with an LFO synced to 1/4 notes, then change the LFO sync to 1/8 for bar 2, 1/16 for bar 3, 1/8 for bar 4. Loop this 4-bar wobble pattern.',
		definition: 'A motif whose pitch is mostly static but whose identity comes from a structured LFO-modulation pattern over time.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Wobble_bass'
	}
];

async function main() {
	const raw = await readFile(PATH, 'utf8');
	const concepts = JSON.parse(raw) as Concept[];

	// Remove the generic 'motif' entry.
	const beforeCount = concepts.length;
	const filtered = concepts.filter((c) => c.id !== 'motif');
	const removed = beforeCount - filtered.length;

	// Append new entries, dedupe by id.
	const seen = new Set(filtered.map((c) => c.id));
	let added = 0;
	let dupes = 0;

	for (const entry of NEW_ENTRIES) {
		if (seen.has(entry.id)) {
			dupes++;
			console.warn(`[dupe] ${entry.id} already exists, skipping`);
			continue;
		}
		filtered.push(entry as Concept);
		seen.add(entry.id);
		added++;
	}

	await writeFile(PATH, JSON.stringify(filtered, null, '\t') + '\n', 'utf8');

	console.log(`Removed ${removed} (generic 'motif')`);
	console.log(`Added ${added} new motif entries`);
	console.log(`Skipped ${dupes} duplicates`);
	console.log(`Total now: ${filtered.length}`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
