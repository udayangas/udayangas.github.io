document.addEventListener('DOMContentLoaded', function () {
	const projectContainer = document.getElementById('project-container');
	const paginationContainer = document.querySelector('.pagination');
	const prevPageButton = document.getElementById('prevPage');
	const nextPageButton = document.getElementById('nextPage');

	const projectsPerPage = 5;
	const projectsPerFile = 100;
	let totalProjects = 0;
	const visiblePageLinks = 3;

	let currentPage = 1;

	/**
	 * Generates the HTML for a single project card.
	 * @param {object} project - The project object from the JSON data.
	 * @returns {string} The HTML string for the project card.
	 */
	function generateProjectCard(project) {
		let projectLinkButton = '';
		let githubLinkButton = '';

		if (project.projectLink && project.projectLink !== '#') {
			projectLinkButton = `<a href="${project.projectLink}" class="btn btn-primary me-2">Project Link</a>`;
		}
		if (project.githubLink && project.githubLink !== '#') {
			githubLinkButton = `<a href="${project.githubLink}" class="btn btn-secondary">GitHub Link</a>`;
		}

		return `<div class="col-12">
                   <div class="card">
                       <div class="row g-0">
                           <div class="col-md-4">
                               <img src="${project.imageUrl}" class="card-img rounded-start img-fluid" alt="${project.title}">
                           </div>
                           <div class="col-md-8 d-flex flex-column">
                               <div class="card-body flex-grow-1">
                                   <h5 class="card-title">${project.title}</h5>
                                   <p class="card-text">${project.description}</p>
                                   <p class="card-text"><small class="text-body-secondary">Last updated: ${project.lastUpdated}</small></p>
                               </div>
                               <div class="card-footer d-flex justify-content-end">
                                   ${projectLinkButton}
                                   ${githubLinkButton}
                               </div>
                           </div>
                       </div>
                   </div>
               </div>`;
	}

	/**
	 * Determines the project IDs to display on the given page, in reverse order.
	 * @param {number} page - The page number.
	 * @returns {number[]} An array of project IDs for the page.
	 */
	function getProjectIdsForPage(page) {
		const start = totalProjects - page * projectsPerPage + 1;
		const end = totalProjects - (page - 1) * projectsPerPage;
		const ids = [];
		for (let i = start; i <= end; i++) {
			if (i > 0) {
				ids.push(i);
			}
		}
		return ids;
	}

	/**
	 * Determines the JSON file names needed for a given page.
	 * @param {number} page - The page number.
	 * @returns {string[]} An array of JSON file names to load.
	 */
	function getJsonFilesForPage(page) {
		const projectIds = getProjectIdsForPage(page);
		const files = new Set();
		projectIds.forEach((id) => {
			if (id <= 100) {
				files.add('data/projects-1-100.json');
			} else if (id <= 200) {
				files.add('data/projects-101-200.json');
			} else if (id <= 300) {
				files.add('data/projects-201-300.json');
			}
		});
		return Array.from(files);
	}

	/**
	 * Loads and displays projects for a given page.
	 * @param {number} page - The page number.
	 */
	function loadProjects(page) {
		const jsonFiles = getJsonFilesForPage(page);
		let allProjects = [];
		let displayableProjects = [];

		// Fetch all required JSON files
		const fetchPromises = jsonFiles.map((file) =>
			fetch(file).then((response) => response.json())
		);

		Promise.all(fetchPromises)
			.then((dataArrays) => {
				// Combine the project arrays from all files
				dataArrays.forEach((projects) => {
					allProjects = allProjects.concat(projects);
				});

				// Filter for active projects
				const activeProjects = allProjects.filter(
					(project) => project.display === 'active'
				);

				// Sort the active projects by ID in descending order
				activeProjects.sort((a, b) => b.id - a.id);

				// Calculate totalPages based on active projects
				totalPages = Math.ceil(activeProjects.length / projectsPerPage);

				// Adjust currentPage if it exceeds totalPages
				if (page > totalPages) {
					page = totalPages;
				}

				// Get the projects for the current page
				const start = (page - 1) * projectsPerPage;
				const end = start + projectsPerPage;
				displayableProjects = activeProjects.slice(start, end);

				// If there are fewer than projectsPerPage, fetch more from the next pages
				let currentPageCounter = page;
				while (
					displayableProjects.length < projectsPerPage &&
					currentPageCounter <= totalPages
				) {
					currentPageCounter++;
					const nextJsonFiles = getJsonFilesForPage(currentPageCounter);
					const nextFetchPromises = nextJsonFiles.map((file) =>
						fetch(file).then((response) => response.json())
					);

					Promise.all(nextFetchPromises).then((nextDataArrays) => {
						nextDataArrays.forEach((nextProjects) => {
							allProjects = allProjects.concat(nextProjects);
						});
						const nextActiveProjects = allProjects.filter(
							(project) => project.display === 'active'
						);
						nextActiveProjects.sort((a, b) => b.id - a.id);
						const nextProjectsToAdd = nextActiveProjects.slice(start, end);
						displayableProjects = displayableProjects.concat(nextProjectsToAdd);
					});
				}
				displayableProjects = displayableProjects.slice(0, projectsPerPage); //trim the array to the required page limit

				const projectsHtml = displayableProjects
					.map((project) => generateProjectCard(project))
					.join('');

				projectContainer.innerHTML = projectsHtml;
				renderPagination(page);
				updatePaginationButtons(page);
				currentPage = page;

				// Update URL to reflect current page.
				const newUrl = new URL(window.location.href);
				newUrl.searchParams.set('page', page);
				history.pushState({ page: page }, '', newUrl);
			})
			.catch((error) => {
				console.error('Error loading projects:', error);
				projectContainer.innerHTML = '<p>Failed to load projects.</p>';
			});
	}

	/**
	 * Dynamically generates the pagination links.
	 * @param {number} currentPage - The current page number.
	 */
	function renderPagination(currentPage) {
		const paginationList =
			paginationContainer.querySelector('#nextPage').parentNode;
		const existingLinks = paginationContainer.querySelectorAll(
			'.page-item:not(#prevPage):not(#nextPage)'
		);
		existingLinks.forEach((link) => link.remove());

		let startPage = Math.max(1, currentPage - Math.floor(visiblePageLinks / 2));
		let endPage = Math.min(
			totalPages,
			currentPage + Math.floor(visiblePageLinks / 2)
		);

		// Adjust start and end page to always show 3 links if possible
		if (totalPages <= visiblePageLinks) {
			startPage = 1;
			endPage = totalPages;
		} else if (currentPage <= Math.ceil(visiblePageLinks / 2)) {
			endPage = visiblePageLinks;
		} else if (currentPage >= totalPages - Math.floor(visiblePageLinks / 2)) {
			startPage = totalPages - visiblePageLinks + 1;
		}

		for (let i = startPage; i <= endPage; i++) {
			const listItem = document.createElement('li');
			listItem.classList.add('page-item');
			if (i === currentPage) {
				listItem.classList.add('active');
			}
			const link = document.createElement('a');
			link.classList.add('page-link');
			link.href = `?page=${i}`;
			link.textContent = i;
			link.dataset.page = i;
			listItem.appendChild(link);
			paginationContainer.insertBefore(listItem, nextPageButton);
		}
	}

	/**
	 * Updates the state of the "Previous" and "Next" buttons.
	 * @param {number} currentPage - The current page number.
	 */
	function updatePaginationButtons(currentPage) {
		prevPageButton.classList.remove('disabled');
		nextPageButton.classList.remove('disabled');

		if (currentPage === 1) {
			prevPageButton.classList.add('disabled');
		}
		if (currentPage === totalPages) {
			nextPageButton.classList.add('disabled');
		}
	}

	/**
	 * Gets the highest project ID from the loaded JSON data.
	 * @param {Array<any>} dataArrays - Array of project arrays from JSON files.
	 * @returns {number} The highest project ID.
	 */
	function getHighestProjectId(dataArrays) {
		let highestId = 0;
		dataArrays.forEach((projects) => {
			projects.forEach((project) => {
				if (project.id > highestId) {
					highestId = project.id;
				}
			});
		});
		return highestId;
	}

	/**
	 * Gets the page number from the URL query string.
	 * @returns {number} The page number, or 1 if not found.
	 */
	function getPageFromUrl() {
		const urlParams = new URLSearchParams(window.location.search);
		const pageParam = urlParams.get('page');
		return pageParam ? parseInt(pageParam) : 1;
	}

	// Initialize the page
	const initialPage = getPageFromUrl();

	// Fetch initial data and calculate totalProjects
	const initialJsonFiles = [
		'data/projects-1-100.json',
		'data/projects-101-200.json',
		'data/projects-201-300.json',
	];
	Promise.all(
		initialJsonFiles.map((file) => fetch(file).then((res) => res.json()))
	).then((initialDataArrays) => {
		totalProjects = getHighestProjectId(initialDataArrays);
		totalPages = Math.ceil(totalProjects / projectsPerPage);
		loadProjects(initialPage);
		renderPagination(initialPage);
		updatePaginationButtons(initialPage);

		// Event listeners for prev/next buttons
		prevPageButton.querySelector('a').addEventListener('click', (event) => {
			event.preventDefault();
			if (currentPage > 1) {
				loadProjects(currentPage - 1);
			}
		});

		nextPageButton.querySelector('a').addEventListener('click', (event) => {
			event.preventDefault();
			if (currentPage < totalPages) {
				loadProjects(currentPage + 1);
			}
		});

		// Event listener for page number links
		paginationContainer.addEventListener('click', (event) => {
			const target = event.target;
			if (target.classList.contains('page-link') && target.dataset.page) {
				event.preventDefault();
				const page = parseInt(target.dataset.page);
				loadProjects(page);
			}
		});
	});
});
