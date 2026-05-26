import type { Concept, Category, Difficulty, GenreId } from '../types';
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
