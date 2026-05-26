// One-shot merger: adds arrangement + sound-design entries to concepts.json
// without clobbering the existing rhythm/melody/harmony content the prior agent wrote.
//
// Runs once, then can be deleted (or kept around for re-runs since it dedupes by id).

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
	// === ARRANGEMENT — universal ===
	{
		id: 'intro-build-drop-breakdown',
		name: 'Intro / Build / Drop / Breakdown',
		category: 'arrangement',
		difficulty: 1,
		genres: ['house', 'techno', 'trance', 'dubstep', 'dnb', 'future-bass', 'hardstyle'],
		prompt:
			'Lay the entire track out in the classic intro / build / drop / breakdown / second drop / outro shape before adding any sound.',
		definition:
			'The dominant EDM song-form built around two energy peaks separated by a breakdown.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Song_structure'
	},
	{
		id: 'eight-bar-phrasing',
		name: '8-bar Phrasing',
		category: 'arrangement',
		difficulty: 1,
		genres: [],
		prompt:
			'Commit to changing at least one element every 8 bars and resist changing anything in between.',
		definition:
			'Organizing musical sections in groups of 8 bars, the most common phrasing unit in electronic music.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Musical_phrasing'
	},
	{
		id: 'sixteen-bar-phrasing',
		name: '16-bar Phrasing',
		category: 'arrangement',
		difficulty: 2,
		genres: [],
		prompt:
			'Resist the urge to switch sections every 8 bars and let each section breathe for a full 16 bars.',
		definition: 'A longer phrase length common in techno and progressive electronic music.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Musical_phrasing'
	},
	{
		id: 'thirty-two-bar-phrasing',
		name: '32-bar Phrasing',
		category: 'arrangement',
		difficulty: 3,
		genres: ['techno', 'progressive-house', 'ambient'],
		prompt: 'Make every section last exactly 32 bars. Patience over novelty for the entire track.',
		definition:
			'Extended phrase length favored by progressive and minimal styles where slow evolution is the point.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Musical_phrasing'
	},
	{
		id: 'tension-and-release',
		name: 'Tension and Release',
		category: 'arrangement',
		difficulty: 1,
		genres: [],
		prompt:
			'Identify one moment in your track where tension peaks; design the 8 bars before and after to amplify the contrast.',
		definition: 'The pacing of musical pressure and resolution that drives emotional arc.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Musical_tension'
	},
	{
		id: 'energy-curve',
		name: 'Energy Curve',
		category: 'arrangement',
		difficulty: 2,
		genres: [],
		prompt:
			'Sketch your track as a single line on paper — energy on Y, time on X — before opening the DAW. Build to that shape.',
		definition: 'The shape of perceived intensity across the duration of a track.',
		wikiUrl: null
	},
	{
		id: 'riser-transition',
		name: 'Riser Transition',
		category: 'arrangement',
		difficulty: 1,
		genres: ['trance', 'future-bass', 'dubstep', 'hardstyle', 'house'],
		prompt:
			'Use a single, slowly automated riser to carry the listener across the 8 bars before your drop. Nothing else moves.',
		definition:
			'A rising-pitch or rising-noise FX layer used to telegraph an incoming section change.',
		wikiUrl: null
	},
	{
		id: 'downlifter',
		name: 'Downlifter',
		category: 'arrangement',
		difficulty: 2,
		genres: ['trance', 'future-bass', 'dubstep'],
		prompt:
			'Place a reverse-cymbal or descending sweep exactly on the bar that ends your drop and snaps to silence.',
		definition: 'A descending or reversed FX used to mark the end of a high-energy section.',
		wikiUrl: null
	},
	{
		id: 'white-noise-sweep',
		name: 'White-noise Sweep',
		category: 'arrangement',
		difficulty: 1,
		genres: [],
		prompt:
			'Automate a band-passed noise riser across an entire 8-bar build, ducking everything else by 6dB underneath it.',
		definition: 'A filter-swept noise layer used as a transition lift.',
		wikiUrl: null
	},
	{
		id: 'golden-ratio-arrangement',
		name: 'Golden-ratio Arrangement Timing',
		category: 'arrangement',
		difficulty: 3,
		genres: [],
		prompt:
			'Place your main drop at the golden-ratio point of the track (61.8 percent through), not at the conventional midpoint.',
		definition:
			'A structural choice that places key musical events at golden-ratio proportions, used in classical and some electronic composition.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Golden_ratio'
	},
	{
		id: 'fake-drop',
		name: 'Fake Drop',
		category: 'arrangement',
		difficulty: 2,
		genres: ['dubstep', 'future-bass', 'trap', 'trance'],
		prompt:
			'Telegraph a full drop, then cut to silence or a misleading element for exactly 4 bars before delivering the real drop.',
		definition:
			'A misleading drop that subverts the listener’s expectation before the real one lands.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Drop_(music)'
	},
	{
		id: 'half-drop',
		name: 'Half Drop',
		category: 'arrangement',
		difficulty: 2,
		genres: ['dubstep', 'dnb', 'future-bass'],
		prompt:
			'Make your first drop a stripped-back version with only kick + bass + minimal lead; save the full drop for the second one.',
		definition:
			'A drop with reduced energy or sparser instrumentation, usually a setup for the full drop later.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Drop_(music)'
	},
	{
		id: 'pre-drop-silence',
		name: 'Pre-drop Silence',
		category: 'arrangement',
		difficulty: 1,
		genres: ['dubstep', 'trap', 'dnb', 'future-bass', 'hardstyle'],
		prompt:
			'Cut everything to silence for exactly 1 bar before your drop hits. No tail, no reverb wash, no cymbal — total silence.',
		definition: 'A deliberate gap of silence immediately before a drop to maximize contrast.',
		wikiUrl: null
	},
	{
		id: 'subtractive-arrangement',
		name: 'Subtractive Arrangement',
		category: 'arrangement',
		difficulty: 2,
		genres: [],
		prompt:
			'Start the track fully loaded and arrange by removing elements. Final 16 bars must have at most 3 layers playing.',
		definition:
			'Composing by starting dense and stripping back over time, rather than adding from sparse to dense.',
		wikiUrl: null
	},
	{
		id: 'aaba-form',
		name: 'AABA Form',
		category: 'arrangement',
		difficulty: 2,
		genres: [],
		prompt:
			'Structure your track in four 32-bar sections: A, A (variation), B (bridge), A (return).',
		definition: 'A 32-bar song form with a contrasting bridge between repeated A sections.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Thirty-two-bar_form'
	},
	{
		id: 'through-composed',
		name: 'Through-composed',
		category: 'arrangement',
		difficulty: 3,
		genres: ['ambient', 'experimental', 'idm'],
		prompt:
			'Write a track in which no section ever repeats. Every 16 bars introduces new material, building on but never recapitulating what came before.',
		definition:
			'A compositional approach where the music continuously evolves without literal repetition of sections.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Through-composed'
	},
	{
		id: 'bridge-middle-eight',
		name: 'Middle Eight Bridge',
		category: 'arrangement',
		difficulty: 2,
		genres: [],
		prompt:
			'After your second chorus or drop, drop into an 8-bar bridge that uses a chord progression and texture you have not used elsewhere.',
		definition:
			'A contrasting 8-bar section, often borrowed from pop song structure, used as a departure before returning.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Bridge_(music)'
	},
	{
		id: 'arrangement-call-response',
		name: 'Sectional Call & Response',
		category: 'arrangement',
		difficulty: 2,
		genres: [],
		prompt:
			'Structure your build as alternating 2-bar phrases between two contrasting sounds, doubling the rate each pass.',
		definition:
			'A back-and-forth structural pattern between two musical voices at the section level.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Call_and_response_(music)'
	},
	{
		id: 'modulation-as-arrangement',
		name: 'Modulation as Arrangement Device',
		category: 'arrangement',
		difficulty: 3,
		genres: [],
		prompt:
			'Modulate up a minor third for your final section to lift energy without changing tempo or instrumentation.',
		definition:
			'Using a key change to inject new energy late in a track when adding elements would feel cluttered.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Modulation_(music)'
	},
	{
		id: 'breakdown-bar-count',
		name: 'Patient Breakdown',
		category: 'arrangement',
		difficulty: 2,
		genres: ['trance', 'progressive-house', 'techno'],
		prompt: 'Make your mid-track breakdown last at least 32 bars before you start the rebuild.',
		definition: 'An extended low-energy section that lets the track breathe before the next peak.',
		wikiUrl: null
	},
	// === ARRANGEMENT — genre-specific ===
	{
		id: 'four-on-the-floor-anchor',
		name: 'Four-on-the-floor Anchor',
		category: 'arrangement',
		difficulty: 1,
		genres: ['house', 'techno', 'trance', 'hardstyle'],
		prompt:
			'Lock a single kick pattern on every downbeat and never break it for the entire track. The kick is the contract.',
		definition: 'A kick on every beat of a 4/4 bar; the defining pulse of much dance music.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Four_on_the_floor_(music)'
	},
	{
		id: 'dj-friendly-intro',
		name: 'DJ-friendly Intro',
		category: 'arrangement',
		difficulty: 1,
		genres: ['house', 'techno', 'trance'],
		prompt:
			'Build a 32-bar intro of just percussion and one filtered element — no melody, no bass — so a DJ can mix it cleanly.',
		definition: 'An extended percussive intro designed for DJ mixing into the previous track.',
		wikiUrl: null
	},
	{
		id: 'uk-garage-two-step-structure',
		name: 'UK Garage 2-Step Structure',
		category: 'arrangement',
		difficulty: 2,
		genres: ['uk-garage'],
		prompt:
			'Build the verse around skipping 2-step drums and the chorus around 4-to-the-floor, alternating every 16 bars.',
		definition:
			'UK garage’s signature structural toggle between syncopated 2-step and 4/4 sections.',
		wikiUrl: 'https://en.wikipedia.org/wiki/2-step_garage'
	},
	{
		id: 'dnb-intro-break-drop',
		name: 'DnB Intro–Break–Drop',
		category: 'arrangement',
		difficulty: 1,
		genres: ['dnb'],
		prompt:
			'Structure as 32 bars of intro (no breakbeat), 16-bar break (drums solo), then the drop. Repeat.',
		definition:
			'The conventional drum & bass arrangement: a long melodic intro, a drum solo break, then the bassline drop.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Drum_and_bass'
	},
	{
		id: 'ambient-long-form',
		name: 'Ambient Long-form Structure',
		category: 'arrangement',
		difficulty: 2,
		genres: ['ambient'],
		prompt:
			'Write a 7+ minute piece with no drums and no clear section boundaries. The only change allowed is one new texture every 90 seconds.',
		definition:
			'An ambient compositional approach where evolution is slow and structural boundaries are deliberately blurred.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Ambient_music'
	},
	{
		id: 'acid-303-filter-sweep-build',
		name: 'Acid 303 Filter Sweep Build',
		category: 'arrangement',
		difficulty: 2,
		genres: ['acid-house'],
		prompt:
			'Loop one 16-step 303 pattern unchanged for 64 bars and arrange purely by slowly opening the filter cutoff.',
		definition:
			'The classic acid arrangement technique of holding pattern static while sweeping the TB-303 filter.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Acid_house'
	},
	{
		id: 'trance-double-drop',
		name: 'Trance Double Drop',
		category: 'arrangement',
		difficulty: 2,
		genres: ['trance'],
		prompt:
			'Drop in twice — first at the standard 64-bar mark with a stripped lead, second time with full supersaw arpeggios layered on top of the same chord progression.',
		definition:
			'A trance staple where the second drop layers richer leads over the first drop’s progression.',
		wikiUrl: null
	},
	{
		id: 'dubstep-half-time-drop',
		name: 'Dubstep Half-time Drop',
		category: 'arrangement',
		difficulty: 1,
		genres: ['dubstep'],
		prompt:
			'Halve the snare rate at the drop (140 BPM track → snare on beat 3 only) and let the bass do all the rhythmic work.',
		definition:
			'Dubstep’s defining feel: drums slow to half-time at the drop while sub work continues.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Dubstep'
	},
	{
		id: 'synthwave-gated-snare-arrival',
		name: 'Synthwave Gated-snare Arrival',
		category: 'arrangement',
		difficulty: 2,
		genres: ['synthwave'],
		prompt:
			'Hold off introducing the gated-reverb snare until the second verse, then never remove it again.',
		definition:
			'Synthwave structural convention of saving the big 80s gated snare for impact mid-track.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Gated_reverb'
	},
	{
		id: 'hardstyle-reverse-bass-entry',
		name: 'Hardstyle Reverse-bass Entry',
		category: 'arrangement',
		difficulty: 2,
		genres: ['hardstyle'],
		prompt:
			'Bring in the reverse-bass exclusively at the second drop, never the first, so its arrival defines the track’s peak.',
		definition:
			'A hardstyle convention of holding the iconic reverse-bass back for impact at the second drop.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Hardstyle'
	},

	// === SOUND-DESIGN — universal ===
	{
		id: 'sidechain-compression',
		name: 'Sidechain Compression',
		category: 'sound-design',
		difficulty: 1,
		genres: ['house', 'techno', 'trance', 'future-bass', 'hardstyle'],
		prompt:
			'Sidechain every non-kick element to the kick with a 100ms release so the whole mix pumps in time.',
		definition:
			'Ducking one signal in response to another, typically the bass and pads ducking under the kick.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Dynamic_range_compression#Side-chaining'
	},
	{
		id: 'parallel-compression',
		name: 'Parallel Compression',
		category: 'sound-design',
		difficulty: 2,
		genres: [],
		prompt:
			'Bus your drums to two parallel sends — one untouched, one crushed at 10:1 ratio — and blend the crushed one in at -8dB.',
		definition:
			'Mixing a heavily compressed copy of a signal with the dry signal to add density without losing dynamics.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Parallel_compression'
	},
	{
		id: 'bus-compression',
		name: 'Bus Compression',
		category: 'sound-design',
		difficulty: 2,
		genres: [],
		prompt:
			'Put a 2:1 compressor across your drum bus that only catches 2-3dB on the loudest hits, and leave it on the whole track.',
		definition: 'Light compression on a group of signals to glue them together as a single unit.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Dynamic_range_compression'
	},
	{
		id: 'filter-sweep-automation',
		name: 'Filter Sweep Automation',
		category: 'sound-design',
		difficulty: 1,
		genres: [],
		prompt:
			'Automate a lowpass filter on your lead from 200Hz to fully open across an entire 16-bar build.',
		definition: 'Automating a filter cutoff over time to create movement or transition.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Audio_filter'
	},
	{
		id: 'layered-bass',
		name: 'Layered Bass',
		category: 'sound-design',
		difficulty: 2,
		genres: ['dubstep', 'dnb', 'bass', 'future-bass'],
		prompt:
			'Build your bass from three layers: a pure sine sub below 80Hz, a mid-range character layer 100-400Hz, and a top-end FM layer above 1kHz.',
		definition: 'Splitting bass into frequency-specific layers for control and weight.',
		wikiUrl: null
	},
	{
		id: 'frequency-masking-mitigation',
		name: 'Frequency Masking Mitigation',
		category: 'sound-design',
		difficulty: 2,
		genres: [],
		prompt:
			'Pick two elements competing in the 200-400Hz range and EQ one with a notch wherever the other has its peak.',
		definition:
			'Carving complementary EQ curves so two sounds occupy adjacent rather than overlapping bands.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Auditory_masking'
	},
	{
		id: 'sub-bass-mono',
		name: 'Mono Sub-bass Discipline',
		category: 'sound-design',
		difficulty: 1,
		genres: ['dubstep', 'dnb', 'house', 'techno'],
		prompt:
			'Force everything below 120Hz to mono. Use a utility plugin on the master to guarantee it.',
		definition:
			'Keeping low-frequency content centered to avoid phase issues and translation problems on club systems.',
		wikiUrl: null
	},
	{
		id: 'reverb-tail-pre-delay',
		name: 'Reverb Pre-delay',
		category: 'sound-design',
		difficulty: 2,
		genres: [],
		prompt:
			'Set your reverb pre-delay to match a 16th-note of the track tempo so the tail locks to the grid.',
		definition:
			'The gap between dry signal and the first reverb reflections — a key parameter for clarity and rhythmic feel.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Reverberation'
	},
	{
		id: 'granular-synthesis',
		name: 'Granular Synthesis',
		category: 'sound-design',
		difficulty: 3,
		genres: ['ambient', 'experimental', 'idm'],
		prompt:
			'Take a 4-second field recording and granulate it into the pad layer of your track. No other pad allowed.',
		definition:
			'Synthesis that breaks audio into tiny grains and recombines them to create textures.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Granular_synthesis'
	},
	{
		id: 'fm-synthesis',
		name: 'FM Synthesis',
		category: 'sound-design',
		difficulty: 3,
		genres: ['future-bass', 'dubstep', 'idm'],
		prompt:
			'Build your lead from a two-operator FM patch — sine carrier, sine modulator — and resist adding any other layers to it.',
		definition:
			'Frequency-modulation synthesis: one oscillator modulates the frequency of another to produce complex timbres.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Frequency_modulation_synthesis'
	},
	{
		id: 'wavetable-synthesis',
		name: 'Wavetable Synthesis',
		category: 'sound-design',
		difficulty: 2,
		genres: ['dubstep', 'future-bass', 'trance'],
		prompt:
			'Automate the wavetable position of your lead across the bar so the timbre morphs even on a held note.',
		definition:
			'A synthesis method that scans through stored single-cycle waveforms to produce evolving timbres.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Wavetable_synthesis'
	},
	{
		id: 'bitcrushing',
		name: 'Bitcrushing',
		category: 'sound-design',
		difficulty: 1,
		genres: ['idm', 'experimental', 'glitch'],
		prompt: 'Send your hi-hats to an 8-bit bitcrusher and leave the kick clean.',
		definition: 'Lo-fi distortion via bit-depth and sample-rate reduction.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Bitcrusher'
	},
	{
		id: 'resampling',
		name: 'Resampling',
		category: 'sound-design',
		difficulty: 2,
		genres: ['idm', 'experimental', 'dnb', 'dubstep'],
		prompt:
			'Bounce your bass to audio, chop the bounce into 16ths, and rearrange those chops into a new bassline.',
		definition:
			'Recording a synth or chain to audio so it can be processed, chopped, or reused as a new sound source.',
		wikiUrl: null
	},
	{
		id: 'saturation',
		name: 'Saturation',
		category: 'sound-design',
		difficulty: 1,
		genres: [],
		prompt:
			'Drive a tape or tube saturator hard on a single element to add harmonics, then balance with -3dB output gain.',
		definition: 'Soft-clipping distortion that adds harmonic richness without obvious overdrive.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Distortion_(music)'
	},
	{
		id: 'tape-emulation',
		name: 'Tape Emulation',
		category: 'sound-design',
		difficulty: 2,
		genres: ['lo-fi-house', 'ambient', 'synthwave'],
		prompt:
			'Put a tape emulation plugin on your master bus with wow + flutter on, and tune the saturation to taste.',
		definition:
			'Plugins that model the harmonic distortion, compression, and pitch instability of analog tape.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Tape_recorder'
	},
	{
		id: 'mid-side-processing',
		name: 'Mid/Side EQ',
		category: 'sound-design',
		difficulty: 3,
		genres: [],
		prompt:
			'Boost 8-12kHz on the side channel only of your master and watch the stereo image bloom without affecting punch.',
		definition:
			'Processing the center (mid) and stereo (side) channels independently for separate tonal control.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Joint_(audio_engineering)'
	},
	{
		id: 'convolution-reverb',
		name: 'Convolution Reverb',
		category: 'sound-design',
		difficulty: 2,
		genres: [],
		prompt:
			'Use an impulse response of a real physical space (cathedral, parking garage, stairwell) as your only reverb on the track.',
		definition:
			'Reverb generated by convolving the dry signal with an impulse response of a real or imagined space.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Convolution_reverb'
	},
	{
		id: 'gated-reverb',
		name: 'Gated Reverb',
		category: 'sound-design',
		difficulty: 2,
		genres: ['synthwave', 'pop', 'dnb'],
		prompt:
			'Place a long-tail reverb followed by a noise gate set to 200ms after the snare hit — get the 80s drum sound.',
		definition: 'A reverb tail cut short by a noise gate, defining the 80s snare sound.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Gated_reverb'
	},
	{
		id: 'comb-filter',
		name: 'Comb Filter',
		category: 'sound-design',
		difficulty: 3,
		genres: ['experimental', 'idm'],
		prompt:
			'Run your lead through a comb filter and modulate its delay time with an LFO synced to a dotted eighth.',
		definition:
			'A filter that creates a series of regularly-spaced notches or peaks across the frequency spectrum.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Comb_filter'
	},
	{
		id: 'phaser-modulation',
		name: 'Phaser Modulation',
		category: 'sound-design',
		difficulty: 1,
		genres: [],
		prompt:
			'Phase your pads with a 16-bar LFO rate so the modulation is barely perceptible until you hear the whole section breathe.',
		definition: 'A swept-notch modulation effect that creates a phasing/swooshing motion.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Phaser_(effect)'
	},
	{
		id: 'flanger-modulation',
		name: 'Flanger Modulation',
		category: 'sound-design',
		difficulty: 1,
		genres: [],
		prompt: 'Flange your hi-hats with feedback near max for a single 4-bar phrase, then bypass.',
		definition: 'A short, modulated delay effect creating a metallic sweeping sound.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Flanging'
	},
	{
		id: 'chorus-effect',
		name: 'Chorus',
		category: 'sound-design',
		difficulty: 1,
		genres: ['synthwave', 'house'],
		prompt:
			'Use a single instance of chorus on your lead, set the rate slow, and resist using it anywhere else.',
		definition:
			'A modulated short-delay effect that thickens a sound by simulating multiple voices.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Chorus_effect'
	},
	{
		id: 'vocoder',
		name: 'Vocoder',
		category: 'sound-design',
		difficulty: 3,
		genres: ['idm', 'experimental', 'synthwave'],
		prompt:
			'Vocode a chord pad with a rhythmic spoken-word vocal as the modulator. Use no other harmonic content for 16 bars.',
		definition:
			'An effect that imposes the spectral envelope of one signal onto the tone of another, classically used for "talking" synth sounds.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Vocoder'
	},

	// === SOUND-DESIGN — genre-specific ===
	{
		id: 'acid-303-bassline',
		name: 'Acid 303 Bassline',
		category: 'sound-design',
		difficulty: 2,
		genres: ['acid-house'],
		prompt:
			'Program a 16-step monophonic bassline with slides and accents that emulate the TB-303, and automate cutoff + resonance throughout.',
		definition: 'The squelchy, resonant bassline sound defined by the Roland TB-303 synthesizer.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Roland_TB-303'
	},
	{
		id: 'reese-bass',
		name: 'Reese Bass',
		category: 'sound-design',
		difficulty: 3,
		genres: ['dnb', 'neurofunk'],
		prompt:
			'Stack two detuned saws an octave apart and run them through a notch filter swept by an LFO. That growl is your only bass for the drop.',
		definition:
			'A detuned sawtooth-wave bass with a characteristic growling movement, originally by Kevin Saunderson as Reese.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Reese_bass'
	},
	{
		id: 'wobble-bass',
		name: 'Wobble Bass',
		category: 'sound-design',
		difficulty: 2,
		genres: ['dubstep'],
		prompt:
			'Modulate your bass filter cutoff with an LFO set to 1/4-note triplets for the entire drop. No straight rhythms allowed.',
		definition:
			'A dubstep bass technique using LFO-modulated filter cutoff to create the signature “wobble” movement.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Wobble_bass'
	},
	{
		id: 'mentasm-hoover',
		name: 'Mentasm / Hoover',
		category: 'sound-design',
		difficulty: 3,
		genres: ['hardstyle', 'dnb', 'breakbeat'],
		prompt:
			'Recreate the “Mentasm” hoover (detuned saws + pitch-bend portamento + heavy modulation) and use it for the lead of one full section.',
		definition:
			'The detuned-saw "hoover" lead originally from Joey Beltram’s "Mentasm", iconic to hardcore and early jungle.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Hoover_sound'
	},
	{
		id: 'supersaw',
		name: 'Supersaw',
		category: 'sound-design',
		difficulty: 2,
		genres: ['trance', 'hardstyle', 'future-bass'],
		prompt:
			'Build a supersaw lead from 7 detuned sawtooth oscillators, spread the detune wide, and play a long-held chord at the drop.',
		definition:
			'A stacked, detuned sawtooth synth voice popularized by the Roland JP-8000 and trance music.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Supersaw'
	},
	{
		id: 'fm-bass',
		name: 'FM Bass',
		category: 'sound-design',
		difficulty: 3,
		genres: ['future-bass', 'dubstep'],
		prompt:
			'Use FM synthesis to design a bass that scoops in pitch over its first 50ms and add a stable sub layer underneath.',
		definition:
			'Bass voices built with FM synthesis, producing aggressive, metallic, or vocal-like character.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Frequency_modulation_synthesis'
	},
	{
		id: 'pad-sidechain',
		name: 'Pad Sidechain Pump',
		category: 'sound-design',
		difficulty: 1,
		genres: ['house', 'trance', 'future-bass'],
		prompt:
			'Drown your pad in long-tail reverb, then sidechain it hard to the kick so it audibly breathes on every downbeat.',
		definition:
			'Heavy sidechaining applied specifically to pads to create the signature “pumping” pad breath of dance music.',
		wikiUrl: null
	},
	{
		id: 'kick-bass-sidechain',
		name: 'Kick-bass Ducking',
		category: 'sound-design',
		difficulty: 2,
		genres: ['dnb', 'dubstep', 'bass'],
		prompt:
			'Sidechain your sub bass to the kick with a 1ms attack and 30ms release so the kick punches through cleanly while the bass holds otherwise.',
		definition:
			'Tight ducking of the bass under each kick hit so the two never compete for headroom.',
		wikiUrl: null
	},
	{
		id: 'psytrance-rolling-bass',
		name: 'Psytrance Rolling Bass',
		category: 'sound-design',
		difficulty: 2,
		genres: ['psytrance'],
		prompt:
			'Lock a 16th-note rolling bass on the off-beats (every "and") for the whole track, ducked to the kick on each downbeat.',
		definition: 'The relentless 16th-note off-beat bass that defines psytrance momentum.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Psytrance'
	},
	{
		id: 'trap-808-glide',
		name: 'Trap 808 with Glide',
		category: 'sound-design',
		difficulty: 1,
		genres: ['trap', 'future-bass'],
		prompt:
			'Use a single 808 sample with portamento between pitches, and let it carry both the bass and chord function for the entire drop.',
		definition: 'The portamento-pitched 808 bass that doubles as bass + harmony in modern trap.',
		wikiUrl: 'https://en.wikipedia.org/wiki/Roland_TR-808'
	}
];

async function main() {
	const raw = await readFile(PATH, 'utf8');
	const existing = JSON.parse(raw) as Concept[];

	const seen = new Set(existing.map((c) => c.id));
	const added: Concept[] = [];
	for (const c of ADDITIONS) {
		if (!seen.has(c.id)) {
			existing.push(c);
			seen.add(c.id);
			added.push(c);
		}
	}

	await writeFile(PATH, JSON.stringify(existing, null, '\t') + '\n', 'utf8');

	console.log(`Added ${added.length} new concepts. Total now: ${existing.length}.`);
	const byCategory: Record<string, number> = {};
	for (const c of existing) byCategory[c.category] = (byCategory[c.category] ?? 0) + 1;
	console.log('By category:', byCategory);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
