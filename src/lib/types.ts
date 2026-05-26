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
	relatedIds?: string[];
};

export type Genre = {
	id: GenreId;
	label: string;
	subgenres?: { id: string; label: string }[];
};

export type Mode = 'quick' | 'deep';

export const MODE_LABELS: Record<Mode, string> = {
	quick: 'Quick',
	deep: 'Deep'
};

export type Challenge = {
	id: string; // uuid-ish
	timestamp: number; // epoch ms
	mode?: Mode; // optional for backward-compat with v1 saves
	genre: GenreId;
	difficulty: Difficulty;
	conceptIds: string[]; // one per category, in CATEGORIES order
};

export type Preferences = {
	lastMode: Mode | null;
	lastGenre: GenreId | null;
	lastDifficulty: Difficulty | null;
	theme: 'dark'; // reserved for future light mode
};
