import { describe, it, expect } from 'vitest';
import { encodeChallenge, decodeChallenge, type ChallengePayload } from './encode';

const quick: ChallengePayload = {
	mode: 'quick',
	genre: 'house',
	difficulty: 2,
	conceptIds: ['syncopation', 'dotted-rhythm-melody', 'authentic-cadence', 'half-drop', 'sidechain-compression']
};

const deep: ChallengePayload = {
	mode: 'deep',
	genre: 'dubstep',
	difficulty: 3,
	conceptIds: ['fake-drop', 'syncopation-hihat', 'shepard-tone', 'wobble-bass', 'half-cadence', 'pre-drop-silence'],
	templateId: 'standard',
	framingConceptId: 'fake-drop',
	deepSectionPicks: [
		{ sectionId: 'intro', conceptId: 'syncopation-hihat' },
		{ sectionId: 'build', conceptId: 'shepard-tone' },
		{ sectionId: 'drop1', conceptId: 'wobble-bass' },
		{ sectionId: 'break', conceptId: 'half-cadence' },
		{ sectionId: 'drop2', conceptId: 'pre-drop-silence' }
	],
	comboId: 'shepard-x-half-drop'
};

describe('encodeChallenge / decodeChallenge', () => {
	it('round-trips a Quick challenge', () => {
		const encoded = encodeChallenge(quick);
		const decoded = decodeChallenge(encoded);
		expect(decoded).toEqual({
			mode: 'quick',
			genre: 'house',
			difficulty: 2,
			conceptIds: quick.conceptIds,
			comboId: undefined
		});
	});

	it('round-trips a Deep challenge with framing + combo', () => {
		const encoded = encodeChallenge(deep);
		const decoded = decodeChallenge(encoded);
		expect(decoded?.mode).toBe('deep');
		expect(decoded?.genre).toBe('dubstep');
		expect(decoded?.difficulty).toBe(3);
		expect(decoded?.templateId).toBe('standard');
		expect(decoded?.framingConceptId).toBe('fake-drop');
		expect(decoded?.deepSectionPicks).toEqual(deep.deepSectionPicks);
		expect(decoded?.comboId).toBe('shepard-x-half-drop');
		// Flat conceptIds should include framing first + all section picks.
		expect(decoded?.conceptIds[0]).toBe('fake-drop');
		expect(decoded?.conceptIds.slice(1)).toEqual(
			deep.deepSectionPicks!.map((p) => p.conceptId)
		);
	});

	it('produces URL-safe output (no + / =)', () => {
		const encoded = encodeChallenge(deep);
		expect(encoded).not.toMatch(/[+/=]/);
	});

	it('returns null for malformed base64', () => {
		expect(decodeChallenge('not!!base64??')).toBeNull();
	});

	it('returns null for valid base64 but bad JSON', () => {
		// "ZGVmaW5pdGVseS1ub3QtanNvbg" decodes to "definitely-not-json"
		expect(decodeChallenge('ZGVmaW5pdGVseS1ub3QtanNvbg')).toBeNull();
	});

	it('returns null for wrong schema version', () => {
		const bad = encodeChallenge(quick).slice(0, 2) + 'XX'; // garble the version segment
		expect(decodeChallenge(bad)).toBeNull();
	});

	it('returns null for empty string', () => {
		expect(decodeChallenge('')).toBeNull();
	});

	it('preserves URL-safe characters across base64url variants', () => {
		// Tortured payload with chars that would produce + and / in standard base64.
		const torture: ChallengePayload = {
			mode: 'deep',
			genre: 'dubstep',
			difficulty: 3,
			conceptIds: ['~~~///+++', 'AAAA????'],
			deepSectionPicks: [{ sectionId: 'a', conceptId: '~~~///+++' }]
		};
		const encoded = encodeChallenge(torture);
		expect(encoded).not.toMatch(/[+/=]/);
		const decoded = decodeChallenge(encoded);
		expect(decoded?.deepSectionPicks?.[0].conceptId).toBe('~~~///+++');
	});

	it('stays under 500 characters for a worst-case Deep payload', () => {
		const longDeep: ChallengePayload = {
			mode: 'deep',
			genre: 'synthwave',
			difficulty: 3,
			conceptIds: [
				'synthwave-gated-snare-arrival',
				'syncopation-hihat',
				'shepard-tone',
				'wobble-bass',
				'half-cadence',
				'pre-drop-silence',
				'sidechain-compression',
				'subtractive-arrangement',
				'tension-and-release'
			],
			templateId: 'pop-form',
			framingConceptId: 'synthwave-gated-snare-arrival',
			deepSectionPicks: [
				{ sectionId: 'intro', conceptId: 'syncopation-hihat' },
				{ sectionId: 'verse1', conceptId: 'shepard-tone' },
				{ sectionId: 'chorus1', conceptId: 'wobble-bass' },
				{ sectionId: 'verse2', conceptId: 'half-cadence' },
				{ sectionId: 'chorus2', conceptId: 'pre-drop-silence' },
				{ sectionId: 'bridge', conceptId: 'sidechain-compression' },
				{ sectionId: 'chorus3', conceptId: 'subtractive-arrangement' },
				{ sectionId: 'outro', conceptId: 'tension-and-release' }
			],
			comboId: 'shepard-x-half-drop'
		};
		expect(encodeChallenge(longDeep).length).toBeLessThan(500);
	});
});
