import type {
	Concept,
	Category,
	Difficulty,
	GenreId,
	SectionTemplate,
	SectionId
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
