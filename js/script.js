document.addEventListener('DOMContentLoaded', () => {
	'use strict';

	// Function to get the stored theme from localStorage
	const getStoredTheme = () => localStorage.getItem('theme');

	// Function to set the theme in localStorage
	const setStoredTheme = (theme) => localStorage.setItem('theme', theme);

	// Function to get the preferred theme based on stored value or system preference
	const getPreferredTheme = () => {
		const storedTheme = getStoredTheme();
		if (storedTheme) {
			return storedTheme;
		}
		return window.matchMedia('(prefers-color-scheme: dark)').matches
			? 'dark'
			: 'light';
	};

	// Function to set the theme on the document element
	const setTheme = (theme) => {
		if (theme === 'auto') {
			document.documentElement.setAttribute(
				'data-bs-theme',
				window.matchMedia('(prefers-color-scheme: dark)').matches
					? 'dark'
					: 'light'
			);
		} else {
			document.documentElement.setAttribute('data-bs-theme', theme);
		}
	};

	// Set the initial theme
	setTheme(getPreferredTheme());

	// Function to show the active theme in the UI
	const showActiveTheme = (theme, focus = false) => {
		const themeSwitcher = document.querySelector('#bd-theme');
		const themeIcon = document.getElementById('theme-icon');
		const themeIconOffcanvas = document.getElementById('theme-icon-offcanvas');

		if (!themeSwitcher) {
			return;
		}

		const btnToActive = document.querySelector(
			`[data-bs-theme-value="${theme}"]`
		);
		if (!btnToActive) {
			return;
		}
		const activeThemeIconName = btnToActive.querySelector('i').className;

		document.querySelectorAll('[data-bs-theme-value]').forEach((element) => {
			element.classList.remove('active');
			element.setAttribute('aria-pressed', 'false');
		});

		btnToActive.classList.add('active');
		btnToActive.setAttribute('aria-pressed', 'true');
		themeIcon.className = activeThemeIconName;
		themeIconOffcanvas.className = activeThemeIconName;

		if (focus) {
			themeSwitcher.focus();
		}
	};

	// Event listener for changes in system preference
	window
		.matchMedia('(prefers-color-scheme: dark)')
		.addEventListener('change', () => {
			const storedTheme = getStoredTheme();
			if (storedTheme !== 'light' && storedTheme !== 'dark') {
				setTheme(getPreferredTheme());
			}
		});

	// Event listener for DOMContentLoaded
	window.addEventListener('DOMContentLoaded', () => {
		const initialTheme = getPreferredTheme();
		setTheme(initialTheme);
		showActiveTheme(initialTheme);

		document.querySelectorAll('[data-bs-theme-value]').forEach((toggle) => {
			toggle.addEventListener('click', () => {
				const theme = toggle.getAttribute('data-bs-theme-value');
				setStoredTheme(theme);
				setTheme(theme);
				showActiveTheme(theme, true);
			});
		});
	});
});
