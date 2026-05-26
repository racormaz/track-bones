# FyeStarta

Constraint cards for electronic producers. Break the wall.

Pick a genre and a difficulty, get a hand of constraints across rhythm, melody, harmony, arrangement, and sound design. Tap a card for the definition, a per-concept diagram, and a link to Wikipedia. Use the cards as the bones of a new track.

The point isn't to generate music. It's to unstick you and grow your vocabulary. Concepts you didn't know had names (Shepard tone, isorhythm, Reese bass) get surfaced and linked so you can dig in.

**Live:** https://racormaz.github.io/fyestarta/

## Why

Generative AI for music has a creative-cost problem: you stop deciding. Constraints have the opposite effect. They force decisions, surface the parts of your toolkit you never use, and break the writer's-block wall by handing you a spark rather than a finished idea.

Every prompt is hand-authored. No LLM at runtime. No music or MIDI is ever generated.

## Modes

- **Quick.** A random card per category at or below your difficulty. Fast inspiration.
- **Deep.** Same constraints, fitted to a genre-specific section template (intro, drop, breakdown, etc.) with a framing arrangement concept and section-by-section picks. Surfaces *combos* (explicit synergies between two concepts) when one fires.

## Combos

Some concept pairings have hand-authored *synergy prompts*. When the picked cards happen to include a combo's pair (and the active genre/difficulty matches the combo's gate), the combo card surfaces alongside the regular cards, suggesting how to compound the two. Combos default on for Advanced difficulty, off otherwise; toggleable in preferences.

## Diagrams

Many concepts include a small inline visual: rhythm grid, waveform, ADSR envelope, filter sweep, energy curve, arrangement form block, or cadence arrow. Diagrams are static SVG, picked per concept in `concepts.json`. Text-only is the fallback.

## Shareable challenges

Every generated hand has a base64url-encoded permalink at `/c/[encoded]`. The encoding holds the full challenge state (mode, genre, difficulty, picked concept IDs, template, framing, combo). Saved challenges live in `localStorage` and can be reopened from the history drawer.

## Content library

The seed library has ~290 concepts plus 17 combos across 16 genres. To add or edit:

1. Edit `src/lib/content/concepts.json` directly (each entry is a `Concept` from `src/lib/types.ts`).
2. Run `npm run validate:wiki` to resolve Wikipedia redirects and cache fresh summaries.
3. Commit.

Each concept has:

- `category`: rhythm / melody / harmony / arrangement / sound-design.
- `difficulty`: 1 (beginner), 2 (intermediate), 3 (advanced).
- `genres`: list of genres it applies to (empty = universal).
- `prompt`: imperative challenge phrasing for the producer.
- `definition`: neutral one-sentence explanation.
- `wikiUrl` + `wikiSummary`: optional, validated against the live Wikipedia API.
- `visual`: optional inline diagram (rhythm-grid, waveform, envelope, filter-sweep, energy-curve, arrangement-form, cadence).
- `rarity`: optional (`common` default, `rare`, `legendary`).
- `sections` / `framingRequiresAnyOf`: optional Deep-mode hints for section affinity and framing eligibility.

The generator picks one concept per category at or below the chosen difficulty, biased 70/30 toward genre-tagged over universal, excluding anything from the last ten saved entries to keep rerolls fresh.

Combos live in `src/lib/content/combos.json` as `{ id, conceptIds: [a, b], synergyPrompt, genres?, difficulty? }`. Genres in `src/lib/content/genres.json` carry optional Deep-mode `templates` (each a named ordered list of sections like intro/build/drop/outro).

## Stack

- SvelteKit 5 + Svelte runes.
- Tailwind v4 (CSS-first tokens, dark by default; `--color-spark` accent for ignition states).
- `@sveltejs/adapter-static` deployed to GitHub Pages.
- `localStorage` for preferences + history (no backend).
- Vitest for the generator.
- Wikipedia REST API for cached summaries (validated at author time, not runtime).

## Genres

House, techno, drum & bass / jungle, ambient / downtempo, experimental, IDM, bass music, dubstep, trance, acid house, UK garage, psytrance, trap, future bass, synthwave, hardstyle.

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

Push to `main`. The workflow in `.github/workflows/deploy.yml` builds with `BASE_PATH=/${{ github.event.repository.name }}` and publishes to GitHub Pages via the official Pages actions, so the base path auto-derives from the repo name. Rename the repo and the deploy follows.
