import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: '404.html',
			strict: true
		}),
		paths: {
			// In production (GH Pages project page) set BASE_PATH=/<repo-name> in the build env.
			// Local dev leaves it empty so the app runs at the root.
			base: process.env.BASE_PATH ?? ''
		}
	}
};

export default config;
