import { browser } from '$app/environment';
import type { Preferences, GenreId, Difficulty, Mode } from '../types';

const KEY = 'track-bones:preferences';
const DEFAULTS: Preferences = {
	lastMode: null,
	lastGenre: null,
	lastDifficulty: null,
	combosEnabled: null,
	theme: 'dark'
};

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

export function setMode(m: Mode) {
	state.lastMode = m;
	persist(state);
}

export function setGenre(g: GenreId) {
	state.lastGenre = g;
	persist(state);
}

export function setDifficulty(d: Difficulty) {
	state.lastDifficulty = d;
	persist(state);
}

export function setCombosEnabled(enabled: boolean | null) {
	state.combosEnabled = enabled;
	persist(state);
}

// Resolved combo-enabled state: explicit user choice wins, else difficulty default.
// Difficulty 3 = on by default. Others = off.
export function combosResolved(): boolean {
	if (state.combosEnabled !== null) return state.combosEnabled;
	return state.lastDifficulty === 3;
}

export function resetPreferences() {
	state.lastMode = null;
	state.lastGenre = null;
	state.lastDifficulty = null;
	persist(state);
}
