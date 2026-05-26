// Domain types. Imported by the generator, the components, and the content tooling
// so there is exactly one source of truth for every string literal.

export type Category = 'rhythm' | 'melody' | 'harmony' | 'arrangement' | 'sound-design';

export const CATEGORIES: readonly Category[] = [
	'rhythm',
	'melody',
	'harmony',
	'arrangement',
	'sound-design'
] as const;

export const CATEGORY_LABELS: Record<Category, string> = {
	rhythm: 'Rhythm',
	melody: 'Melody',
	harmony: 'Harmony',
	arrangement: 'Arrangement',
	'sound-design': 'Sound Design'
};

export type Difficulty = 1 | 2 | 3;

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
	1: 'Beginner',
	2: 'Intermediate',
	3: 'Advanced'
};

export type GenreId =
	| 'house'
	| 'techno'
	| 'dnb'
	| 'ambient'
	| 'experimental'
	| 'idm'
	| 'bass'
	| 'dubstep'
	| 'trance'
	| 'acid-house'
	| 'uk-garage'
	| 'psytrance'
	| 'trap'
	| 'future-bass'
	| 'synthwave'
	| 'hardstyle';

export type RefKind = 'article' | 'video' | 'interactive';

export type SecondaryRef = {
	kind: RefKind;
	label: string;
	url: string;
};

export type Rarity = 'common' | 'rare' | 'legendary';

// Discriminated union of per-concept visual diagrams. Wave 1 implements the first 3.
// Remaining types are reserved so concepts.json can be authored ahead of components.
export type Visual =
	| { type: 'none' }
	| { type: 'rhythm-grid'; steps: number; hits: number[]; accents?: number[] }
	| { type: 'waveform'; shape: 'sine' | 'saw' | 'square' | 'triangle' | 'noise' }
	| { type: 'energy-curve'; points: number[] }
	| { type: 'arrangement-form'; blocks: { label: string; color?: string }[] }
	| { type: 'envelope'; attack: number; decay: number; sustain: number; release: number }
	| { type: 'filter-sweep'; filter: 'lowpass' | 'highpass' | 'bandpass'; direction: 'up' | 'down' | 'both' }
	| { type: 'cadence'; from: string; to: string; mode: 'authentic' | 'plagal' | 'deceptive' | 'half' };

export type Concept = {
	id: string;
	name: string;
	category: Category;
	difficulty: Difficulty;
	genres: GenreId[]; // empty = applies to all genres
	prompt: string;
	definition: string;
	wikiUrl: string | null;
	wikiSummary?: string;
	secondaryRef?: SecondaryRef;
	sections?: SectionId[]; // section affinity for Deep mode (non-arrangement concepts)
	framingRequiresAnyOf?: SectionId[]; // arrangement concepts only: template must include one of these to be eligible as Deep-mode framing
	rarity?: Rarity; // missing = common
	visual?: Visual; // missing = no diagram (renders text-only)
	relatedIds?: string[];
};

export type Genre = {
	id: GenreId;
	label: string;
	subgenres?: { id: string; label: string }[];
	templates?: SectionTemplate[]; // optional during incremental rollout
};

export type Combo = {
	id: string;
	conceptIds: [string, string];
	synergyPrompt: string;
	genres?: GenreId[]; // empty/missing = any genre
	difficulty?: Difficulty; // optional gate
};

export type Mode = 'quick' | 'deep';

export const MODE_LABELS: Record<Mode, string> = {
	quick: 'Quick',
	deep: 'Deep'
};

export type SectionId = string;

export type Section = {
	id: SectionId;
	label: string;
	description: string; // one-sentence inline explanation; every section has one
	ref?: SecondaryRef; // optional learn-more link, same shape as concept refs
	barHint?: string;
};

export type SectionTemplate = {
	id: string;
	label: string;
	description?: string;
	sections: Section[];
};

export type Challenge = {
	id: string; // uuid-ish
	timestamp: number; // epoch ms
	mode: Mode;
	genre: GenreId;
	difficulty: Difficulty;
	conceptIds: string[]; // Quick mode: 5 cards in CATEGORIES order. Deep mode: flat list of all picks including framing.
	templateId?: string; // deep mode only
	deepSectionPicks?: { sectionId: SectionId; conceptId: string }[]; // deep mode only, ordered per template
	framingConceptId?: string; // deep mode only, arrangement concept used as overall framing
	comboId?: string;
};

export type Preferences = {
	lastMode: Mode | null;
	lastGenre: GenreId | null;
	lastDifficulty: Difficulty | null;
	combosEnabled: boolean | null; // null = use difficulty default
	theme: 'dark'; // reserved for future light mode
};
