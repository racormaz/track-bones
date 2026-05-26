// Lightweight UI state shared across routes. Drawer + toast lift here so any
// route can trigger them while the layout owns the actual mount points.

const ui = $state<{ drawerOpen: boolean; toast: string | null }>({
	drawerOpen: false,
	toast: null
});

export const uiState = ui;

export function openDrawer() {
	ui.drawerOpen = true;
}

export function closeDrawer() {
	ui.drawerOpen = false;
}

export function showToast(msg: string, ms = 1600) {
	ui.toast = msg;
	setTimeout(() => {
		if (ui.toast === msg) ui.toast = null;
	}, ms);
}
