import { browser } from '$app/environment';
import type { Preferences, GenreId, Difficulty } from '../types';

const KEY = 'track-bones:preferences';
const DEFAULTS: Preferences = { lastGenre: null, lastDifficulty: null, theme: 'dark' };

function load(): Preferences {
	if (!browser) return { ...DEFAULTS };
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return { ...DEFAULTS };
		const parsed = JSON.parse(raw) as Partial<Preferences>;
		return { ...DEFAULTS, ...parsed };
	} catch {
		return { ...DEFAULTS };
	}
}

function persist(prefs: Preferences) {
	if (!browser) return;
	try {
		localStorage.setItem(KEY, JSON.stringify(prefs));
	} catch {
		// quota exceeded / disabled — silently drop
	}
}

const state = $state<Preferences>(load());

export const preferences = state;

export function setGenre(g: GenreId) {
	state.lastGenre = g;
	persist(state);
}

export function setDifficulty(d: Difficulty) {
	state.lastDifficulty = d;
	persist(state);
}

export function resetPreferences() {
	state.lastGenre = null;
	state.lastDifficulty = null;
	persist(state);
}
