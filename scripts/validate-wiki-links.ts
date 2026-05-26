// Validates and canonicalizes Wikipedia links in concepts.json.
//
// For each concept with a non-null wikiUrl:
//   1. Extract the page title from the URL.
//   2. Hit the Wikipedia REST API summary endpoint (follows redirects server-side).
//   3. Overwrite wikiUrl with the canonical URL the API returns.
//   4. Cache the API's short extract into wikiSummary for inline display.
//
// Run with: npx tsx scripts/validate-wiki-links.ts
//
// Idempotent — safe to re-run. Skips concepts that already have a wikiSummary unless
// --force is passed.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

type Concept = {
	id: string;
	name: string;
	category: string;
	difficulty: number;
	genres: string[];
	prompt: string;
	definition: string;
	wikiUrl: string | null;
	wikiSummary?: string;
	relatedIds?: string[];
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONCEPTS_PATH = resolve(__dirname, '..', 'src', 'lib', 'content', 'concepts.json');
const FORCE = process.argv.includes('--force');

function extractTitle(url: string): string | null {
	const match = url.match(/wikipedia\.org\/wiki\/([^?#]+)/i);
	if (!match) return null;
	return decodeURIComponent(match[1]);
}

type SummaryOk = {
	type: string;
	title: string;
	extract: string;
	content_urls: { desktop: { page: string } };
};

async function fetchSummary(title: string): Promise<SummaryOk | null> {
	const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
	const res = await fetch(url, {
		headers: {
			Accept: 'application/json',
			'User-Agent': 'fyestarta-link-validator/1.0 (https://github.com/racormaz/fyestarta)'
		},
		redirect: 'follow'
	});
	if (!res.ok) return null;
	const json = (await res.json()) as SummaryOk;
	if (json.type === 'disambiguation') return null;
	return json;
}

async function run() {
	const raw = await readFile(CONCEPTS_PATH, 'utf8');
	const concepts = JSON.parse(raw) as Concept[];

	let updated = 0;
	let dropped = 0;
	let skipped = 0;

	for (const c of concepts) {
		if (!c.wikiUrl) continue;
		if (c.wikiSummary && !FORCE) {
			skipped++;
			continue;
		}

		const title = extractTitle(c.wikiUrl);
		if (!title) {
			console.warn(`[skip] ${c.id}: could not parse title from ${c.wikiUrl}`);
			continue;
		}

		try {
			const summary = await fetchSummary(title);
			if (!summary) {
				console.warn(`[drop] ${c.id}: no article for "${title}"`);
				c.wikiUrl = null;
				delete c.wikiSummary;
				dropped++;
			} else {
				c.wikiUrl = summary.content_urls.desktop.page;
				c.wikiSummary = summary.extract;
				updated++;
				console.log(`[ok]   ${c.id} → ${summary.title}`);
			}
		} catch (err) {
			console.error(`[err]  ${c.id}: ${(err as Error).message}`);
		}

		// be polite — 60 req/min cap on the public endpoint is the loose ceiling
		await new Promise((r) => setTimeout(r, 120));
	}

	await writeFile(CONCEPTS_PATH, JSON.stringify(concepts, null, '\t') + '\n', 'utf8');

	console.log('');
	console.log(`Done. Updated ${updated}, dropped ${dropped}, skipped ${skipped} (already cached).`);
}

run().catch((err) => {
	console.error(err);
	process.exit(1);
});
