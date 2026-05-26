import type {
	Concept,
	Category,
	Difficulty,
	GenreId,
	SectionTemplate,
	SectionId,
	Combo
} from '../types';
import { CATEGORIES } from '../types';

const GENRE_BIAS = 0.7;

export type GenerateInput = {
	concepts: Concept[];
	genre: GenreId;
	difficulty: Difficulty;
	excludeIds?: Iterable<string>;
	random?: () => number;
};

type FilterOpts = {
	concepts: Concept[];
	genre: GenreId;
	difficulty: Difficulty;
	category: Category;
	exclude: Set<string>;
};

function pickFromBucket(opts: FilterOpts, random: () => number): Concept | null {
	const { concepts, genre, difficulty, category, exclude } = opts;

	const inCat = concepts.filter((c) => c.category === category && c.difficulty <= difficulty);
	const allow = (c: Concept) => !exclude.has(c.id);

	const genreTagged = inCat.filter((c) => c.genres.includes(genre)).filter(allow);
	const universal = inCat.filter((c) => c.genres.length === 0).filter(allow);

	const prefersGenre = random() < GENRE_BIAS;
	const primary = prefersGenre ? genreTagged : universal;
	const secondary = prefersGenre ? universal : genreTagged;

	const chosen = primary.length > 0 ? primary : secondary;
	if (chosen.length > 0) return chosen[Math.floor(random() * chosen.length)];

	// Fallback 1: ignore recents within (genre+universal) for this category at this difficulty.
	const noExclude = inCat.filter((c) => c.genres.length === 0 || c.genres.includes(genre));
	if (noExclude.length > 0) return noExclude[Math.floor(random() * noExclude.length)];

	// Fallback 2: any concept in this category at any genre, at or below difficulty.
	if (inCat.length > 0) return inCat[Math.floor(random() * inCat.length)];

	// Fallback 3: any concept in this category at any difficulty.
	const cat = concepts.filter((c) => c.category === category);
	if (cat.length > 0) return cat[Math.floor(random() * cat.length)];

	return null;
}

export function generateChallenge(input: GenerateInput): string[] {
	const random = input.random ?? Math.random;
	const exclude = new Set(input.excludeIds ?? []);
	const picked: string[] = [];

	for (const category of CATEGORIES) {
		const c = pickFromBucket(
			{
				concepts: input.concepts,
				genre: input.genre,
				difficulty: input.difficulty,
				category,
				exclude
			},
			random
		);
		if (!c) {
			throw new Error(`No concept available for category "${category}". Content library is empty.`);
		}
		picked.push(c.id);
		exclude.add(c.id); // prevent the same concept landing in two slots of one challenge
	}

	return picked;
}

// Filter combos to those eligible for the given genre/difficulty + that reference
// concept IDs the library knows about (so a stale combo doesn't crash). Returns
// the eligible list. Caller decides whether to pick from it.
export function eligibleCombos(args: {
	combos: Combo[];
	conceptIds: Set<string>;
	genre: GenreId;
	difficulty: Difficulty;
}): Combo[] {
	return args.combos.filter((c) => {
		if (c.difficulty !== undefined && c.difficulty > args.difficulty) return false;
		if (c.genres && c.genres.length > 0 && !c.genres.includes(args.genre)) return false;
		return c.conceptIds.every((id) => args.conceptIds.has(id));
	});
}

// Look at a picked challenge's conceptIds and return any combo whose pair is fully
// represented in the picks. Null if none.
export function findActiveCombo(args: {
	combos: Combo[];
	picked: string[];
	genre: GenreId;
	difficulty: Difficulty;
	random?: () => number;
}): Combo | null {
	const random = args.random ?? Math.random;
	const pickedSet = new Set(args.picked);
	const matches = args.combos.filter((c) => {
		if (c.difficulty !== undefined && c.difficulty > args.difficulty) return false;
		if (c.genres && c.genres.length > 0 && !c.genres.includes(args.genre)) return false;
		return c.conceptIds.every((id) => pickedSet.has(id));
	});
	if (matches.length === 0) return null;
	return matches[Math.floor(random() * matches.length)];
}

// Generate a challenge that's biased toward triggering a combo. Picks a combo first,
// locks its two concepts into their categories, then fills the remaining 3 slots.
// Falls back to plain generation if no combos match.
export function generateChallengeWithCombo(input: GenerateInput & { combos: Combo[] }): {
	conceptIds: string[];
	comboId?: string;
} {
	const random = input.random ?? Math.random;
	const allKnownIds = new Set(input.concepts.map((c) => c.id));

	const eligible = eligibleCombos({
		combos: input.combos,
		conceptIds: allKnownIds,
		genre: input.genre,
		difficulty: input.difficulty
	});

	if (eligible.length === 0) {
		// No combos available — fall back.
		return { conceptIds: generateChallenge(input) };
	}

	const combo = eligible[Math.floor(random() * eligible.length)];
	const [aId, bId] = combo.conceptIds;
	const a = input.concepts.find((c) => c.id === aId);
	const b = input.concepts.find((c) => c.id === bId);
	if (!a || !b) {
		return { conceptIds: generateChallenge(input) };
	}

	// Build the 5-card result by locking a and b into their categories, then filling.
	const exclude = new Set(input.excludeIds ?? []);
	exclude.add(aId);
	exclude.add(bId);

	const result: Record<Category, string> = {} as Record<Category, string>;
	result[a.category] = aId;
	if (b.category !== a.category) {
		result[b.category] = bId;
	}

	for (const category of CATEGORIES) {
		if (result[category]) continue;
		const c = pickFromBucket(
			{
				concepts: input.concepts,
				genre: input.genre,
				difficulty: input.difficulty,
				category,
				exclude
			},
			random
		);
		if (!c) {
			throw new Error(`No concept available for category "${category}".`);
		}
		result[category] = c.id;
		exclude.add(c.id);
	}

	// If b's category collides with a's, the second concept never made it in.
	// That breaks the combo — fall back to standard generation in that case.
	if (b.category === a.category) {
		return { conceptIds: generateChallenge(input) };
	}

	const ordered = CATEGORIES.map((cat) => result[cat]);
	return { conceptIds: ordered, comboId: combo.id };
}

// ----- Deep mode (v2.1): one card per section + framing layer -----

const SECTION_CATEGORIES: Category[] = ['rhythm', 'melody', 'harmony', 'sound-design'];

// Pick an eligible arrangement concept to use as the OVERALL framing for a Deep challenge.
// Returns null when the filtered pool is empty (the UI degrades gracefully without a framing card).
export function pickFraming(args: {
	concepts: Concept[];
	template: SectionTemplate;
	genre: GenreId;
	difficulty: Difficulty;
	excludeIds?: Iterable<string>;
	random?: () => number;
}): Concept | null {
	const random = args.random ?? Math.random;
	const exclude = new Set(args.excludeIds ?? []);
	const templateSectionIds = new Set(args.template.sections.map((s) => s.id));

	const candidates = args.concepts.filter((c) => {
		if (c.category !== 'arrangement') return false;
		if (c.difficulty > args.difficulty) return false;
		if (c.genres.length > 0 && !c.genres.includes(args.genre)) return false;
		if (exclude.has(c.id)) return false;
		if (c.framingRequiresAnyOf && c.framingRequiresAnyOf.length > 0) {
			return c.framingRequiresAnyOf.some((id) => templateSectionIds.has(id));
		}
		return true;
	});

	if (candidates.length === 0) return null;
	return candidates[Math.floor(random() * candidates.length)];
}

// For a given section, pick the best concept from the four non-arrangement categories.
// Rotation logic: prefer (1) any concept with section affinity to this section,
// (2) failing that, the least-used category so far, (3) within that, the usual
// genre-bias-then-difficulty rules from pickFromBucket.
export function pickForSection(args: {
	concepts: Concept[];
	sectionId: SectionId;
	categoriesUsed: Map<Category, number>;
	genre: GenreId;
	difficulty: Difficulty;
	exclude: Set<string>;
	random?: () => number;
}): Concept | null {
	const random = args.random ?? Math.random;

	// Step 1: try affinity-matched concepts across the 4 non-arrangement categories.
	const affinityMatches = args.concepts.filter((c) => {
		if (!SECTION_CATEGORIES.includes(c.category)) return false;
		if (c.difficulty > args.difficulty) return false;
		if (c.genres.length > 0 && !c.genres.includes(args.genre)) return false;
		if (args.exclude.has(c.id)) return false;
		return c.sections ? c.sections.includes(args.sectionId) : false;
	});

	if (affinityMatches.length > 0) {
		return affinityMatches[Math.floor(random() * affinityMatches.length)];
	}

	// Step 2: no affinity match — pick the least-used category and pull from it.
	const sorted = [...SECTION_CATEGORIES].sort((a, b) => {
		const ua = args.categoriesUsed.get(a) ?? 0;
		const ub = args.categoriesUsed.get(b) ?? 0;
		if (ua !== ub) return ua - ub;
		return random() < 0.5 ? -1 : 1; // tiebreak: random
	});

	for (const category of sorted) {
		const c = pickFromBucket(
			{
				concepts: args.concepts,
				genre: args.genre,
				difficulty: args.difficulty,
				category,
				exclude: args.exclude
			},
			random
		);
		if (c) return c;
	}

	return null;
}

export type DeepChallengeInput = {
	concepts: Concept[];
	template: SectionTemplate;
	genre: GenreId;
	difficulty: Difficulty;
	excludeIds?: Iterable<string>;
	random?: () => number;
};

export type DeepChallengeResult = {
	framingConceptId: string | null;
	sectionPicks: { sectionId: SectionId; conceptId: string }[];
};

export function generateDeepChallenge(input: DeepChallengeInput): DeepChallengeResult {
	const random = input.random ?? Math.random;
	const exclude = new Set(input.excludeIds ?? []);

	const framing = pickFraming({
		concepts: input.concepts,
		template: input.template,
		genre: input.genre,
		difficulty: input.difficulty,
		excludeIds: exclude,
		random
	});
	if (framing) exclude.add(framing.id);

	const categoriesUsed = new Map<Category, number>();
	const sectionPicks: { sectionId: SectionId; conceptId: string }[] = [];

	for (const section of input.template.sections) {
		const pick = pickForSection({
			concepts: input.concepts,
			sectionId: section.id,
			categoriesUsed,
			genre: input.genre,
			difficulty: input.difficulty,
			exclude,
			random
		});
		if (!pick) {
			throw new Error(`No concept available for section "${section.id}". Library is too sparse.`);
		}
		sectionPicks.push({ sectionId: section.id, conceptId: pick.id });
		exclude.add(pick.id);
		categoriesUsed.set(pick.category, (categoriesUsed.get(pick.category) ?? 0) + 1);
	}

	return {
		framingConceptId: framing?.id ?? null,
		sectionPicks
	};
}

// Reroll a single section's pick. Excludes current + other section picks + recents.
export function rerollSectionPick(args: {
	concepts: Concept[];
	template: SectionTemplate;
	sectionId: SectionId;
	currentId: string;
	otherPickedIds: string[];
	framingId?: string | null;
	genre: GenreId;
	difficulty: Difficulty;
	excludeIds?: Iterable<string>;
	random?: () => number;
}): string {
	const exclude = new Set(args.excludeIds ?? []);
	exclude.add(args.currentId);
	for (const id of args.otherPickedIds) exclude.add(id);
	if (args.framingId) exclude.add(args.framingId);

	// Build categoriesUsed from the other picked concepts so rotation tries to
	// preserve diversity (don't reroll into a category that's already saturated).
	const categoriesUsed = new Map<Category, number>();
	for (const id of args.otherPickedIds) {
		const c = args.concepts.find((x) => x.id === id);
		if (c && SECTION_CATEGORIES.includes(c.category)) {
			categoriesUsed.set(c.category, (categoriesUsed.get(c.category) ?? 0) + 1);
		}
	}

	const pick = pickForSection({
		concepts: args.concepts,
		sectionId: args.sectionId,
		categoriesUsed,
		genre: args.genre,
		difficulty: args.difficulty,
		exclude,
		random: args.random
	});
	if (!pick) {
		throw new Error(`No alternative concept available for section "${args.sectionId}".`);
	}
	return pick.id;
}

// Reroll only the framing (OVERALL) card.
export function rerollFraming(args: {
	concepts: Concept[];
	template: SectionTemplate;
	currentId: string | null;
	pickedIds: string[];
	genre: GenreId;
	difficulty: Difficulty;
	excludeIds?: Iterable<string>;
	random?: () => number;
}): string | null {
	const exclude = new Set(args.excludeIds ?? []);
	if (args.currentId) exclude.add(args.currentId);
	for (const id of args.pickedIds) exclude.add(id);

	const next = pickFraming({
		concepts: args.concepts,
		template: args.template,
		genre: args.genre,
		difficulty: args.difficulty,
		excludeIds: exclude,
		random: args.random
	});
	return next?.id ?? null;
}

// Pick a template for a genre. Weighted random when multiple templates exist.
export function pickTemplate(
	templates: SectionTemplate[] | undefined,
	random: () => number = Math.random
): SectionTemplate | null {
	if (!templates || templates.length === 0) return null;
	return templates[Math.floor(random() * templates.length)];
}

export function rerollOne(
	input: GenerateInput & { category: Category; currentId: string }
): string {
	const random = input.random ?? Math.random;
	const exclude = new Set(input.excludeIds ?? []);
	exclude.add(input.currentId);

	const c = pickFromBucket(
		{
			concepts: input.concepts,
			genre: input.genre,
			difficulty: input.difficulty,
			category: input.category,
			exclude
		},
		random
	);

	if (!c) {
		throw new Error(`No alternative concept available for category "${input.category}".`);
	}
	return c.id;
}
