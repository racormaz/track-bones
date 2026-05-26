// Encode/decode the rendered state of a challenge into a URL-safe slug.
// Used for the /c/[encoded] route to make every brief shareable + permalinkable.

import type { Mode, GenreId, Difficulty, SectionId } from '../types';

const SCHEMA_VERSION = 1;

export type ChallengePayload = {
	mode: Mode;
	genre: GenreId;
	difficulty: Difficulty;
	conceptIds: string[]; // Quick: 5 in CATEGORIES order. Deep: flat list (framing + section picks).
	templateId?: string;
	framingConceptId?: string | null;
	deepSectionPicks?: { sectionId: SectionId; conceptId: string }[];
	comboId?: string;
};

type EncodedShape = {
	v: 1;
	m: Mode;
	g: GenreId;
	d: Difficulty;
	ids?: string[];
	t?: string;
	fr?: string;
	p?: [string, string][];
	c?: string;
};

// base64url variants (URL-safe, no padding).
function toBase64Url(input: string): string {
	const b64 =
		typeof btoa !== 'undefined'
			? btoa(unescape(encodeURIComponent(input)))
			: Buffer.from(input, 'utf-8').toString('base64');
	return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(input: string): string {
	const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
	const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
	const padded = b64 + pad;
	if (typeof atob !== 'undefined') {
		return decodeURIComponent(escape(atob(padded)));
	}
	return Buffer.from(padded, 'base64').toString('utf-8');
}

export function encodeChallenge(c: ChallengePayload): string {
	const shape: EncodedShape = {
		v: SCHEMA_VERSION,
		m: c.mode,
		g: c.genre,
		d: c.difficulty
	};

	if (c.mode === 'quick') {
		shape.ids = c.conceptIds;
	} else {
		if (c.templateId) shape.t = c.templateId;
		if (c.framingConceptId) shape.fr = c.framingConceptId;
		if (c.deepSectionPicks && c.deepSectionPicks.length > 0) {
			shape.p = c.deepSectionPicks.map((p) => [p.sectionId, p.conceptId]);
		}
	}
	if (c.comboId) shape.c = c.comboId;

	return toBase64Url(JSON.stringify(shape));
}

export function decodeChallenge(encoded: string): ChallengePayload | null {
	if (!encoded || typeof encoded !== 'string') return null;

	let json: string;
	try {
		json = fromBase64Url(encoded);
	} catch {
		return null;
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(json);
	} catch {
		return null;
	}

	if (!parsed || typeof parsed !== 'object') return null;
	const obj = parsed as Partial<EncodedShape>;

	if (obj.v !== SCHEMA_VERSION) return null;
	if (obj.m !== 'quick' && obj.m !== 'deep') return null;
	if (typeof obj.g !== 'string') return null;
	if (obj.d !== 1 && obj.d !== 2 && obj.d !== 3) return null;

	if (obj.m === 'quick') {
		if (!Array.isArray(obj.ids) || obj.ids.length === 0) return null;
		return {
			mode: 'quick',
			genre: obj.g as GenreId,
			difficulty: obj.d,
			conceptIds: obj.ids,
			comboId: typeof obj.c === 'string' ? obj.c : undefined
		};
	}

	// Deep
	const deepPicks =
		Array.isArray(obj.p) && obj.p.every((p) => Array.isArray(p) && p.length === 2)
			? obj.p.map(([sectionId, conceptId]) => ({ sectionId, conceptId }))
			: [];

	const flatIds = [
		...(typeof obj.fr === 'string' ? [obj.fr] : []),
		...deepPicks.map((p) => p.conceptId)
	];

	if (flatIds.length === 0) return null;

	return {
		mode: 'deep',
		genre: obj.g as GenreId,
		difficulty: obj.d,
		conceptIds: flatIds,
		templateId: typeof obj.t === 'string' ? obj.t : undefined,
		framingConceptId: typeof obj.fr === 'string' ? obj.fr : null,
		deepSectionPicks: deepPicks,
		comboId: typeof obj.c === 'string' ? obj.c : undefined
	};
}
