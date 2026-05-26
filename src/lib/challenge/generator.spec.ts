import { describe, it, expect } from 'vitest';
import { generateChallenge, rerollOne } from './generator';
import type { Concept, Category, GenreId } from '../types';
import { CATEGORIES } from '../types';

function makeConcept(
	id: string,
	category: Category,
	difficulty: 1 | 2 | 3,
	genres: GenreId[] = []
): Concept {
	return {
		id,
		name: id,
		category,
		difficulty,
		genres,
		prompt: `Do ${id}.`,
		definition: `${id} is a thing.`,
		wikiUrl: null
	};
}

function fixture(): Concept[] {
	const out: Concept[] = [];
	for (const cat of CATEGORIES) {
		// 3 universal per cat per difficulty
		for (let d = 1; d <= 3; d++) {
			for (let i = 0; i < 3; i++) {
				out.push(makeConcept(`${cat}-univ-d${d}-${i}`, cat, d as 1 | 2 | 3));
			}
		}
		// 2 house-specific per cat per difficulty
		for (let d = 1; d <= 3; d++) {
			for (let i = 0; i < 2; i++) {
				out.push(makeConcept(`${cat}-house-d${d}-${i}`, cat, d as 1 | 2 | 3, ['house']));
			}
		}
	}
	return out;
}

describe('generateChallenge', () => {
	it('returns one concept id per category in canonical order', () => {
		const concepts = fixture();
		const ids = generateChallenge({ concepts, genre: 'house', difficulty: 3 });
		expect(ids).toHaveLength(CATEGORIES.length);
		ids.forEach((id, i) => {
			const c = concepts.find((x) => x.id === id)!;
			expect(c.category).toBe(CATEGORIES[i]);
		});
	});

	it('respects difficulty ceiling (beginner only sees difficulty 1)', () => {
		const concepts = fixture();
		const ids = generateChallenge({ concepts, genre: 'house', difficulty: 1 });
		ids.forEach((id) => {
			const c = concepts.find((x) => x.id === id)!;
			expect(c.difficulty).toBeLessThanOrEqual(1);
		});
	});

	it('only picks concepts matching the genre filter (genre-tagged or universal)', () => {
		const concepts = fixture();
		const ids = generateChallenge({ concepts, genre: 'house', difficulty: 3 });
		ids.forEach((id) => {
			const c = concepts.find((x) => x.id === id)!;
			expect(c.genres.length === 0 || c.genres.includes('house')).toBe(true);
		});
	});

	it('excludes recent ids when alternatives exist', () => {
		const concepts = fixture();
		const exclude = concepts.map((c) => c.id).filter((id) => id.startsWith('rhythm-house-d3'));
		const ids = generateChallenge({
			concepts,
			genre: 'house',
			difficulty: 3,
			excludeIds: exclude
		});
		expect(ids.some((id) => exclude.includes(id))).toBe(false);
	});

	it('does not pick the same concept for two categories of one challenge', () => {
		const concepts = fixture();
		for (let i = 0; i < 50; i++) {
			const ids = generateChallenge({ concepts, genre: 'techno', difficulty: 3 });
			expect(new Set(ids).size).toBe(ids.length);
		}
	});

	it('throws when content library is empty', () => {
		expect(() => generateChallenge({ concepts: [], genre: 'house', difficulty: 3 })).toThrow();
	});

	it('falls back to universal when genre has nothing in a category', () => {
		// Only universal rhythm concepts, no psytrance ones.
		const concepts: Concept[] = [
			makeConcept('r1', 'rhythm', 1),
			makeConcept('m1', 'melody', 1, ['psytrance']),
			makeConcept('h1', 'harmony', 1, ['psytrance']),
			makeConcept('a1', 'arrangement', 1, ['psytrance']),
			makeConcept('s1', 'sound-design', 1, ['psytrance'])
		];
		const ids = generateChallenge({ concepts, genre: 'psytrance', difficulty: 1 });
		expect(ids).toContain('r1');
	});
});

describe('rerollOne', () => {
	it('returns a different concept than the current one', () => {
		const concepts = fixture();
		const newId = rerollOne({
			concepts,
			genre: 'house',
			difficulty: 3,
			category: 'rhythm',
			currentId: 'rhythm-univ-d1-0'
		});
		expect(newId).not.toBe('rhythm-univ-d1-0');
		const c = concepts.find((x) => x.id === newId)!;
		expect(c.category).toBe('rhythm');
	});

	it('honors excludeIds in addition to currentId', () => {
		const concepts = fixture();
		const exclude = concepts
			.filter((c) => c.category === 'melody' && c.id !== 'melody-univ-d1-0')
			.map((c) => c.id);
		const newId = rerollOne({
			concepts,
			genre: 'house',
			difficulty: 1,
			category: 'melody',
			currentId: 'never-current',
			excludeIds: exclude
		});
		// Only melody-univ-d1-0 should remain at difficulty=1 after exclusion.
		expect(newId).toBe('melody-univ-d1-0');
	});
});
