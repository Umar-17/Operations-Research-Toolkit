
const methodsData = [
    {
        id: 'simplex',
        name: 'Simplex Method',
        icon: '📊',
        description: 'Solve Linear Programming problems using the Simplex algorithm with Big-M method support.',
        path: 'methods/simplex/index.html',
        keywords: ['linear', 'programming', 'optimization', 'lp', 'maximize', 'minimize']
    },
    {
        id: 'transportation',
        name: 'Transportation Problem',
        icon: '🚚',
        description: 'Find optimal shipping routes using NWC, Least Cost, or Vogel\'s Approximation methods.',
        path: 'methods/transportation/index.html',
        keywords: ['shipping', 'allocation', 'supply', 'demand', 'nwc', 'vam', 'modi']
    },
    {
        id: 'hungarian',
        name: 'Hungarian Method',
        icon: '🎯',
        description: 'Solve assignment problems to optimally assign workers to jobs.',
        path: 'methods/hungarian/index.html',
        keywords: ['assignment', 'workers', 'jobs', 'matching', 'kuhn']
    },
    {
        id: 'branch-and-bound',
        name: 'Branch and Bound',
        icon: '🌳',
        description: 'Solve Integer Linear Programming problems using branch and bound algorithm.',
        path: 'methods/branch-and-bound/index.html',
        keywords: ['integer', 'ilp', 'mip', 'discrete', 'optimization']
    },
    {
        id: 'tsp',
        name: 'Traveling Salesman',
        icon: '🗺️',
        description: 'Find the shortest route visiting all cities exactly once and returning to start.',
        path: 'methods/tsp/index.html',
        keywords: ['traveling', 'salesman', 'route', 'tour', 'cities', 'path']
    },
    {
        id: 'shortest-route',
        name: 'Shortest Route',
        icon: '🛤️',
        description: 'Find shortest path between nodes using Bellman-Ford dynamic programming.',
        path: 'methods/shortest-route/index.html',
        keywords: ['dijkstra', 'bellman', 'ford', 'path', 'graph', 'network']
    },
    {
        id: 'knapsack',
        name: '0/1 Knapsack',
        icon: '🎒',
        description: 'Maximize value while respecting capacity constraints using dynamic programming.',
        path: 'methods/knapsack/index.html',
        keywords: ['dynamic', 'programming', 'dp', 'capacity', 'items', 'value', 'weight']
    }
];


function getBasePath() {
    const path = window.location.pathname;
    if (path.includes('/methods/')) {
        return '../../';
    }
    return './';
}


function injectNavbar(activePage = 'home') {
    const basePath = getBasePath();
    const navbar = document.createElement('nav');
    navbar.className = 'navbar';
    navbar.innerHTML = `
        <a href="${basePath}index.html" class="navbar-brand">
            <span>OR Toolkit</span>
        </a>
        <div class="navbar-links">
            <a href="${basePath}index.html" class="nav-link ${activePage === 'home' ? 'active' : ''}">
                <span>Home</span>
            </a>
            <div class="methods-dropdown">
                <button class="methods-dropdown-btn">
                    <span>Methods</span>
                    <span class="dropdown-arrow">▼</span>
                </button>
                <div class="methods-dropdown-content">
                    <a href="${basePath}methods/simplex/index.html">Simplex Method</a>
                    <a href="${basePath}methods/transportation/index.html">Transportation Problem</a>
                    <a href="${basePath}methods/hungarian/index.html">Hungarian Method</a>
                    <a href="${basePath}methods/branch-and-bound/index.html">Branch and Bound</a>
                    <a href="${basePath}methods/tsp/index.html">Traveling Salesman</a>
                    <a href="${basePath}methods/shortest-route/index.html">Shortest Route</a>
                    <a href="${basePath}methods/knapsack/index.html">0/1 Knapsack</a>
                </div>
            </div>
            <a href="${basePath}about.html" class="nav-link ${activePage === 'about' ? 'active' : ''}">
                <span>About</span>
            </a>
            <div class="search-container" id="searchContainer">
                <div class="search-input-wrapper">
                    <input type="text" id="navSearchInput" placeholder="Search methods..." onkeyup="handleNavSearch(event)">
                </div>
                <button class="search-icon-btn" onclick="toggleSearch()">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </button>
            </div>

        </div>
    `;
    document.body.insertBefore(navbar, document.body.firstChild);


    createThemeButton();
}


function toggleTheme() {
    document.body.classList.toggle('light-mode');
    localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
}


function loadTheme() {
    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-mode');
    }
}


function toggleSearch() {
    const container = document.getElementById('searchContainer');
    container.classList.toggle('expanded');
    if (container.classList.contains('expanded')) {
        document.getElementById('navSearchInput').focus();
    }
}


function injectFooter() {

    const divider = document.createElement('div');
    divider.className = 'divider';
    divider.style.marginBottom = '30px';
    document.body.appendChild(divider);

    const footer = document.createElement('footer');
    footer.className = 'footer';
    footer.innerHTML = `
        <p>OR Toolkit © 2025</p>
        <p style="font-size: 0.8rem; margin-top: 5px;">Educational use only. Verify results before real-world application.</p>
        <p style="margin-top: 12px; display: flex; align-items: center; justify-content: center; gap: 8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #93B1A6;">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg>
            <a href="https://github.com/Umar-17/Operations-Research-Toolkit" target="_blank" style="color: #93B1A6; text-decoration: underline; font-size: 0.9rem; font-weight: 500;">
                View source on GitHub
            </a>
        </p>
    `;
    document.body.appendChild(footer);
}


function handleNavSearch(event) {
    if (event.key === 'Enter') {
        const query = event.target.value.trim();
        if (query) {
            const basePath = getBasePath();
            window.location.href = `${basePath}index.html?search=${encodeURIComponent(query)}`;
        }
    }
}


function filterMethods(query) {
    const cards = document.querySelectorAll('.method-card');
    const normalizedQuery = query.toLowerCase().trim();

    cards.forEach(card => {
        const methodId = card.dataset.methodId;
        const method = methodsData.find(m => m.id === methodId);

        if (!method) {
            card.style.display = 'block';
            return;
        }

        const matchesName = method.name.toLowerCase().includes(normalizedQuery);
        const matchesDesc = method.description.toLowerCase().includes(normalizedQuery);
        const matchesKeywords = method.keywords.some(k => k.includes(normalizedQuery));

        card.style.display = (matchesName || matchesDesc || matchesKeywords) ? 'block' : 'none';
    });
}




function parseInputValue(value, defaultValue = 0, allowInfinity = true) {
    if (value === null || value === undefined) return defaultValue;

    const trimmed = String(value).trim();


    if (trimmed === '' || trimmed === '-' || trimmed === '∞' || trimmed.toLowerCase() === 'inf') {
        return allowInfinity ? Infinity : defaultValue;
    }


    const num = parseFloat(trimmed);
    return isNaN(num) ? defaultValue : num;
}


function parseMatrixCell(value) {
    const trimmed = String(value).trim();

    if (trimmed === '' || trimmed === '-') {
        return null;
    }

    if (trimmed === '∞' || trimmed.toLowerCase() === 'inf') {
        return Infinity;
    }

    const num = parseFloat(trimmed);
    return isNaN(num) ? null : num;
}


function formatNumber(value, decimals = 4) {
    if (value === Infinity || value === -Infinity) return '∞';
    if (value === null || value === undefined || isNaN(value)) return '-';


    const rounded = Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);


    return String(rounded);
}


function createValidationMessage(message, type = 'error') {
    const div = document.createElement('div');
    div.className = `validation-message validation-${type}`;
    div.style.cssText = `
        padding: 10px 15px;
        margin: 10px 0;
        border-radius: 8px;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        gap: 8px;
    `;

    const icons = { error: '❌', warning: '⚠️', info: 'ℹ️' };
    const colors = {
        error: 'rgba(248, 113, 113, 0.2)',
        warning: 'rgba(251, 191, 36, 0.2)',
        info: 'rgba(96, 165, 250, 0.2)'
    };

    div.style.background = colors[type] || colors.error;
    div.innerHTML = `<span>${icons[type] || icons.error}</span><span>${message}</span>`;

    return div;
}


function showError(message, containerId = null) {
    if (containerId) {
        const container = document.getElementById(containerId);
        if (container) {

            container.querySelectorAll('.validation-message').forEach(el => el.remove());
            container.insertBefore(createValidationMessage(message, 'error'), container.firstChild);
            return;
        }
    }
    alert(message);
}




function createLegend(items) {
    return `
        <div class="legend">
            ${items.map(item => `
                <div class="legend-item">
                    ${item.emoji ? `<span class="legend-emoji">${item.emoji}</span>` : ''}
                    ${item.colorClass ? `<span class="legend-color ${item.colorClass}"></span>` : ''}
                    <span>${item.label}</span>
                </div>
            `).join('')}
        </div>
    `;
}



document.addEventListener('DOMContentLoaded', function () {

    loadTheme();


    const existingNavbar = document.querySelector('.navbar');
    const isMethodPage = window.location.pathname.includes('/methods/');


    if (!existingNavbar && isMethodPage) {
        injectNavbar('methods');
        injectFooter();
    } else {

        if (!document.querySelector('.floating-theme-btn')) {
            createThemeButton();
        }
    }


    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    if (searchQuery) {
        if (searchInput) {
            searchInput.value = searchQuery;
            filterMethods(searchQuery);
        }
    }


    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = `${getBasePath()}favicon.svg`;
    link.type = 'image/svg+xml';
    document.head.appendChild(link);
});


function createThemeButton() {
    const themeBtn = document.createElement('button');
    themeBtn.className = 'theme-toggle-btn floating-theme-btn';
    themeBtn.onclick = toggleTheme;
    themeBtn.title = "Toggle Light/Dark Mode";
    themeBtn.innerHTML = `
        <svg class="sun-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
        <svg class="moon-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
    `;
    document.body.appendChild(themeBtn);
}


if (typeof window !== 'undefined') {
    window.ORToolkit = {
        parseInputValue,
        parseMatrixCell,
        formatNumber,
        showError,
        createLegend,
        methodsData,
        filterMethods
    };
}
