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

// Pick a template for a genre. Weighted random when multiple templates exist.
export function pickTemplate(
	templates: SectionTemplate[] | undefined,
	random: () => number = Math.random
): SectionTemplate | null {
	if (!templates || templates.length === 0) return null;
	return templates[Math.floor(random() * templates.length)];
}

// Spread-first, affinity-second assignment of picked concepts to template sections.
// Returns a map of conceptId → sectionId.
export function assignSections(args: {
	conceptIds: string[];
	conceptsById: Map<string, Concept>;
	template: SectionTemplate;
	random?: () => number;
}): Record<string, SectionId> {
	const random = args.random ?? Math.random;
	const sectionIds = args.template.sections.map((s) => s.id);
	const result: Record<string, SectionId> = {};
	const used = new Set<SectionId>();

	// Build (concept, allowedSections[]) tuples.
	const items = args.conceptIds.map((id) => {
		const c = args.conceptsById.get(id);
		const affinity = c?.sections ?? [];
		const allowed = affinity.filter((s) => sectionIds.includes(s));
		return {
			id,
			allowed: allowed.length > 0 ? allowed : sectionIds.slice() // fall back to all sections
		};
	});

	// Most-constrained-first.
	items.sort((a, b) => a.allowed.length - b.allowed.length);

	for (const item of items) {
		// First try an unused allowed section.
		let chosen = item.allowed.find((s) => !used.has(s));
		if (!chosen) {
			// Fall back: any unused section.
			chosen = sectionIds.find((s) => !used.has(s));
		}
		if (!chosen) {
			// Pure overflow: pick a random section (shouldn't happen with 5 cards ≤ N sections).
			chosen = sectionIds[Math.floor(random() * sectionIds.length)];
		}
		result[item.id] = chosen;
		used.add(chosen);
	}

	return result;
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
