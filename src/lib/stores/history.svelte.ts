import { browser } from '$app/environment';
import type { Challenge, GenreId, Difficulty, Mode } from '../types';

const KEY = 'track-bones:history';
const CAP = 50;

function load(): Challenge[] {
	if (!browser) return [];
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? (parsed as Challenge[]) : [];
	} catch {
		return [];
	}
}

function persist(items: Challenge[]) {
	if (!browser) return;
	try {
		localStorage.setItem(KEY, JSON.stringify(items));
	} catch {
		// quota exceeded — drop the oldest half and retry once
		try {
			localStorage.setItem(KEY, JSON.stringify(items.slice(-Math.floor(CAP / 2))));
		} catch {
			// give up silently
		}
	}
}

const state = $state<{ items: Challenge[] }>({ items: load() });

export const history = state;

function uuid(): string {
	if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function saveChallenge(args: {
	mode: Mode;
	genre: GenreId;
	difficulty: Difficulty;
	conceptIds: string[];
}): Challenge {
	const entry: Challenge = {
		id: uuid(),
		timestamp: Date.now(),
		mode: args.mode,
		genre: args.genre,
		difficulty: args.difficulty,
		conceptIds: args.conceptIds
	};
	state.items = [entry, ...state.items].slice(0, CAP);
	persist(state.items);
	return entry;
}

export function deleteChallenge(id: string) {
	state.items = state.items.filter((c) => c.id !== id);
	persist(state.items);
}

export function clearHistory() {
	state.items = [];
	persist(state.items);
}

// Recent concept IDs across all saved challenges (used to bias reroll away from repeats).
export function recentConceptIds(limit = 10): string[] {
	const ids: string[] = [];
	for (const challenge of state.items) {
		for (const cid of challenge.conceptIds) {
			ids.push(cid);
			if (ids.length >= limit) return ids;
		}
	}
	return ids;
}
