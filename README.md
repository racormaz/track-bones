# Track Bones

Constraint-based track ideation challenges for electronic music producers.

Pick a genre and a difficulty, get five starting constraints (one each for rhythm, melody, harmony, arrangement, sound design). Use them as the bones of a new track. Tap a card to see the definition and a link to Wikipedia.

The point isn't to generate music — it's to unstick you and grow your vocabulary. Concepts you didn't know had names ("Shepard tone", "isorhythm", "Reese bass") get surfaced and linked so you can dig in.

**Live:** https://racormaz.github.io/track-bones/

## Why

Generative AI for music has a creative-cost problem: you stop deciding. Constraints have the opposite effect — they force decisions and surface the parts of your toolkit you never use.

Every prompt is hand-authored. No LLM at runtime. No music or MIDI is ever generated.

## Stack

- SvelteKit 5 + Svelte runes
- Tailwind v4 (CSS-first tokens, dark by default)
- `@sveltejs/adapter-static` deployed to GitHub Pages
- `localStorage` for preferences + history (no backend)
- Vitest for the generator
- Wikipedia REST API for cached summaries (validated at author time, not runtime)

## Genres

House, techno, drum & bass / jungle, ambient / downtempo, experimental, IDM, bass music, dubstep, trance, acid house, UK garage, psytrance, trap, future bass, synthwave, hardstyle.

## Content library

The seed library has ~230 concepts covering universal music theory plus genre-specific tropes. To add or edit:

1. Edit `src/lib/content/concepts.json` directly (each entry is a `Concept` from `src/lib/types.ts`).
2. Run `npm run validate:wiki` to resolve Wikipedia redirects and cache fresh summaries.
3. Commit.

Each concept has:

- `category`: one of rhythm / melody / harmony / arrangement / sound-design
- `difficulty`: 1 (beginner), 2 (intermediate), 3 (advanced)
- `genres`: list of genres it applies to (empty = universal)
- `prompt`: imperative challenge phrasing for the producer
- `definition`: neutral one-sentence explanation
- `wikiUrl` + `wikiSummary`: optional, validated against the live Wikipedia API

The generator picks one concept per category at or below the chosen difficulty, biased 70/30 toward genre-tagged over universal, excluding anything from the last ten saved entries.

## Development

```sh
npm install
npm run dev
```

Other scripts:

```sh
npm run test            # vitest on the generator
npm run check           # svelte-check (TypeScript)
npm run build           # static production build into ./build
npm run validate:wiki   # re-validate all Wikipedia links (mutates concepts.json in place)
npm run format          # prettier
```

## Deploying

Push to `main`. The workflow in `.github/workflows/deploy.yml` builds with `BASE_PATH=/track-bones` and publishes to GitHub Pages via the official Pages actions.

For a fork, change the workflow's `BASE_PATH` and update the live URL above.
