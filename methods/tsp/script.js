/**
 * =============================================================================
 * TRAVELING SALESMAN PROBLEM (TSP) SOLVER
 * =============================================================================
 * 
 * This module solves the Traveling Salesman Problem using brute force
 * enumeration with visual tree representation of all routes.
 * 
 * PROBLEM:
 * Find the shortest route that visits each city exactly once and returns
 * to the starting city (Hamiltonian cycle).
 * 
 * ALGORITHM:
 * 1. Generate all permutations of cities (excluding start city)
 * 2. For each permutation, calculate total route distance
 * 3. Track the minimum distance route as optimal
 * 4. Visualize all routes as a decision tree
 * 
 * COMPLEXITY: O(n!) - Factorial time, practical for n <= 8
 * 
 * =============================================================================
 */

let distMatrix = [];  // Distance/cost matrix between cities
let n = 0;  // Number of cities
let cityNames = [];

function generateMatrix() {
    n = parseInt(document.getElementById('numCities').value);

    if (n < 3 || n > 8) {
        alert('Please enter a value between 3 and 8');
        return;
    }

    generateNameInputs();
    updateMatrixTable();
    updateStartCityDropdown();
    document.getElementById('resultsCard').classList.add('hidden');
}

function generateNameInputs() {
    const namesSection = document.getElementById('namesSection');
    namesSection.classList.remove('hidden');

    let html = '';
    for (let i = 0; i < n; i++) {
        html += `<input type="text" id="cityName_${i}" value="${String.fromCharCode(65 + i)}" onchange="updateAll()">`;
    }
    document.getElementById('cityNamesContainer').innerHTML = html;
}

function getNames() {
    cityNames = [];
    for (let i = 0; i < n; i++) {
        const el = document.getElementById(`cityName_${i}`);
        cityNames.push(el ? el.value : String.fromCharCode(65 + i));
    }
}

function updateAll() {
    getNames();
    updateMatrixTable();
    updateStartCityDropdown();
}

function updateStartCityDropdown() {
    getNames();
    let html = '';
    for (let i = 0; i < n; i++) {
        html += `<option value="${i}">${cityNames[i]}</option>`;
    }
    document.getElementById('startCity').innerHTML = html;
}

function updateMatrixTable() {
    getNames();

    let savedValues = [];
    for (let i = 0; i < n; i++) {
        savedValues[i] = [];
        for (let j = 0; j < n; j++) {
            const cell = document.getElementById(`dist_${i}_${j}`);
            savedValues[i][j] = cell ? cell.value : (i === j ? '0' : '0');
        }
    }

    let html = '<table>';

    html += '<tr><th></th>';
    for (let j = 0; j < n; j++) {
        html += `<th>${cityNames[j]}</th>`;
    }
    html += '</tr>';

    for (let i = 0; i < n; i++) {
        html += `<tr><td class="row-header">${cityNames[i]}</td>`;

        for (let j = 0; j < n; j++) {
            const isDiagonal = i === j;
            const val = isDiagonal ? '∞' : (savedValues[i] && savedValues[i][j] ? savedValues[i][j] : '0');
            const cls = isDiagonal ? 'diagonal' : '';
            const readonly = isDiagonal ? 'readonly' : '';
            html += `<td><input type="text" id="dist_${i}_${j}" value="${val}" class="${cls}" ${readonly}></td>`;
        }
        html += '</tr>';
    }

    html += '</table>';
    document.getElementById('matrixInput').innerHTML = html;
}

function getData() {
    distMatrix = [];
    for (let i = 0; i < n; i++) {
        distMatrix[i] = [];
        for (let j = 0; j < n; j++) {
            if (i === j) {
                distMatrix[i][j] = Infinity;
            } else {
                const val = document.getElementById(`dist_${i}_${j}`).value.trim();
                // Handle dash, infinity symbol, 'inf' text, or empty as Infinity
                if (val === '∞' || val === 'inf' || val === '-' || val === '') {
                    distMatrix[i][j] = Infinity;
                } else {
                    const num = parseFloat(val);
                    distMatrix[i][j] = isNaN(num) ? Infinity : num;
                }
            }
        }
    }
}

// Build a tree structure for all paths
function buildPathTree(startCity, otherCities, path = [startCity]) {
    if (otherCities.length === 0) {
        const returnCost = distMatrix[path[path.length - 1]][startCity];
        const totalCost = calculateRouteDistance(path);
        return {
            city: startCity,
            label: cityNames[startCity], // Removed ' (Return)'
            edgeCost: returnCost,
            totalCost: totalCost,
            children: [],
            isLeaf: true,
            path: [...path, startCity]
        };
    }

    const node = {
        city: path[path.length - 1],
        label: cityNames[path[path.length - 1]],
        edgeCost: path.length > 1 ? distMatrix[path[path.length - 2]][path[path.length - 1]] : 0,
        children: [],
        isLeaf: false,
        path: [...path]
    };

    for (let i = 0; i < otherCities.length; i++) {
        const nextCity = otherCities[i];
        const remaining = otherCities.filter((_, idx) => idx !== i);
        const childNode = buildPathTree(startCity, remaining, [...path, nextCity]);
        childNode.edgeCost = distMatrix[path[path.length - 1]][nextCity];
        node.children.push(childNode);
    }

    return node;
}

// Count total leaf nodes for width calculation
function countLeaves(node) {
    if (node.children.length === 0) return 1;
    return node.children.reduce((sum, child) => sum + countLeaves(child), 0);
}

// Assign coordinates to nodes
function assignCoordinates(node, x, y, levelHeight, availableWidth) {
    node.x = x;
    node.y = y;

    if (node.children.length > 0) {
        const totalLeaves = countLeaves(node);
        let currentX = x - availableWidth / 2;

        // Calculate dynamic width based on sub-tree sizes
        node.children.forEach(child => {
            const childLeaves = countLeaves(child);
            const childWidth = (childLeaves / totalLeaves) * availableWidth;
            assignCoordinates(child, currentX + childWidth / 2, y + levelHeight, levelHeight, childWidth);
            currentX += childWidth;
        });
    }
}

// Draw the path tree visualization with SVG
function drawPathTree(allRoutes, optimalRoute, minDistance, startCity) {
    const container = document.getElementById('graphVizContainer');
    if (!container) return;

    // Build tree structure
    const otherCities = [];
    for (let i = 0; i < n; i++) {
        if (i !== startCity) otherCities.push(i);
    }

    const tree = buildPathTree(startCity, otherCities);
    const totalLeaves = countLeaves(tree);

    // Calculate dimensions
    const levelHeight = 100; // Increased veritcal space for slant
    const nodeSize = 60;
    const treeDepth = n + 1;
    const canvasHeight = treeDepth * levelHeight + 100;
    // Ensure enough width for nodes not to overlap
    const canvasWidth = Math.max(totalLeaves * 80, 800);

    // Assign Coordinates
    assignCoordinates(tree, canvasWidth / 2, 50, levelHeight, canvasWidth);

    let html = `<div class="tree-container" style="position: relative; width: ${canvasWidth}px; height: ${canvasHeight}px;">`;

    // SVG Layer for connections
    html += `<svg width="${canvasWidth}" height="${canvasHeight}" style="position: absolute; top: 0; left: 0; z-index: 1;">`;
    html += renderConnections(tree, optimalRoute, startCity);
    html += `</svg>`;

    // HTML Layer for Nodes
    html += `<div class="nodes-layer" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 2;">`;
    html += renderNodes(tree, optimalRoute, minDistance, startCity);
    html += `</div>`;

    html += '</div>';

    container.innerHTML = html + getLegendHTML();
}

function getLegendHTML() {
    return `
    <div class="legend-container" style="margin-top: 20px; padding: 15px; background: rgba(0,0,0,0.35); border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); position: relative; z-index: 10;">
        <h4 style="color: #a0aec0; margin-bottom: 12px; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px;">◈ Key / Legend</h4>
        <div style="display: flex; gap: 24px; flex-wrap: wrap; font-size: 0.85rem;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="width: 30px; height: 3px; background: #4ade80; border-radius: 2px;"></span>
                <span style="color: #c9d1d9;">Optimal Path</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="width: 30px; height: 2px; background: #6b6b6b; opacity: 0.7;"></span>
                <span style="color: #c9d1d9;">Explored Path</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="width: 14px; height: 14px; background: rgba(107,138,173,0.2); border: 2px solid #6b8aad; border-radius: 50%;"></span>
                <span style="color: #c9d1d9;">Node (City)</span>
            </div>
        </div>
    </div>
    `;
}

// Render SVG connections recursively
function renderConnections(node, optimalRoute, startCity) {
    let svg = '';

    // Check if current node is on the optimal path
    const isOnOptimalPath = node.path && optimalRoute.slice(0, node.path.length).every((c, i) => c === node.path[i]);

    if (node.children.length > 0) {
        for (const child of node.children) {
            // Check if this specific edge is part of the optimal path
            const isOptimalEdge = isOnOptimalPath && optimalRoute[node.path.length] === child.city;

            const color = isOptimalEdge ? '#4ade80' : 'var(--text-muted)';
            const width = isOptimalEdge ? 3 : 2;
            const opacity = isOptimalEdge ? 1 : 0.3;

            // Draw Line
            svg += `<line x1="${node.x}" y1="${node.y}" x2="${child.x}" y2="${child.y}" 
                    stroke="${color}" stroke-width="${width}" opacity="${opacity}" />`;

            // Draw Cost Label (midpoint)
            const midX = (node.x + child.x) / 2;
            const midY = (node.y + child.y) / 2;
            const cost = child.edgeCost === Infinity ? '∞' : child.edgeCost;

            // Text Color based on optimality
            const textColor = isOptimalEdge ? '#4ade80' : 'var(--text-secondary)';

            // Small background for text readability
            svg += `<rect x="${midX - 10}" y="${midY - 10}" width="20" height="20" fill="rgba(0,0,0,0.7)" rx="4" />`;

            svg += `<text x="${midX}" y="${midY}" dy="5" text-anchor="middle" 
                    fill="${textColor}" font-size="12px" font-weight="bold">${cost}</text>`;

            svg += renderConnections(child, optimalRoute, startCity);
        }
    }
    return svg;
}

// Render HTML nodes recursively
function renderNodes(node, optimalRoute, minDistance, startCity) {
    let html = '';

    // Determine Node Styling
    const isOnOptimalPath = node.path && optimalRoute.slice(0, node.path.length).every((c, i) => c === node.path[i]);

    let nodeClass = 'tree-node-abs';
    if (node.isLeaf) {
        if (node.totalCost === minDistance) nodeClass += ' leaf optimal';
        else nodeClass += ' leaf';
    } else if (isOnOptimalPath) {
        nodeClass += ' on-path';
    }

    // Position Style
    const style = `position: absolute; left: ${node.x}px; top: ${node.y}px; transform: translate(-50%, -50%);`;

    html += `<div class="${nodeClass}" style="${style}">
                <span class="node-label">${node.label}</span>`;

    if (node.isLeaf) {
        const costClass = node.totalCost === minDistance ? 'total-cost optimal' : 'total-cost';
        const costVal = node.totalCost === Infinity ? '∞' : node.totalCost;
        html += `<span class="${costClass}" style="position: absolute; top: 65px; background: rgba(0,0,0,0.8); padding: 2px 6px; border-radius: 4px; white-space: nowrap;">Total: ${costVal}</span>`;
    }

    html += `</div>`;

    if (node.children.length > 0) {
        for (const child of node.children) {
            html += renderNodes(child, optimalRoute, minDistance, startCity);
        }
    }

    return html;
}

/**
 * Generate all permutations of an array.
 * Used to enumerate all possible routes.
 * @param {Array} arr - Array of city indices
 * @returns {Array} Array of all permutations
 */
function permute(arr) {
    if (arr.length <= 1) return [arr];

    const result = [];
    for (let i = 0; i < arr.length; i++) {
        const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
        const perms = permute(rest);
        for (let perm of perms) {
            result.push([arr[i], ...perm]);
        }
    }
    return result;
}

/**
 * Calculate total distance of a complete TSP route.
 * Includes return distance to starting city.
 * @param {Array} route - Array of city indices in visit order
 * @returns {number} Total route distance
 */
function calculateRouteDistance(route) {
    let distance = 0;
    for (let i = 0; i < route.length - 1; i++) {
        const d = distMatrix[route[i]][route[i + 1]];
        if (d === Infinity) return Infinity;
        distance += d;
    }
    const returnDist = distMatrix[route[route.length - 1]][route[0]];
    if (returnDist === Infinity) return Infinity;
    distance += returnDist;

    return distance;
}

/**
 * Main solve function - finds optimal TSP route.
 * Generates all permutations and finds minimum distance tour.
 * @returns {void} Displays results with tree visualization
 */
function solve() {
    getNames();
    getData();

    const startCity = parseInt(document.getElementById('startCity').value);

    const otherCities = [];
    for (let i = 0; i < n; i++) {
        if (i !== startCity) otherCities.push(i);
    }

    const perms = permute(otherCities);

    const allRoutes = [];
    let minDistance = Infinity;
    let optimalRoute = null;

    for (let perm of perms) {
        const route = [startCity, ...perm];
        const distance = calculateRouteDistance(route);

        allRoutes.push({ route, distance });

        if (distance < minDistance) {
            minDistance = distance;
            optimalRoute = route;
        }
    }

    allRoutes.sort((a, b) => a.distance - b.distance);

    displayResults(allRoutes, optimalRoute, minDistance, startCity);

    document.getElementById('resultsCard').classList.remove('hidden');
}

function displayResults(allRoutes, optimalRoute, minDistance, startCity) {
    let stepsHTML = '';

    stepsHTML += `
        <div class="step-container">
            <div class="step-title">All Possible Routes (${allRoutes.length} routes)</div>
            <div class="all-routes">
    `;

    for (let r of allRoutes) {
        const isOptimal = r.distance === minDistance;
        const routeStr = [...r.route, r.route[0]].map(i => cityNames[i]).join(' → ');
        const distStr = r.distance === Infinity ? '∞ (No path)' : r.distance;

        stepsHTML += `
            <div class="route-item ${isOptimal ? 'optimal' : ''}">
                <span class="route-path">${routeStr}</span>
                <span class="route-distance">${distStr}</span>
            </div>
        `;
    }

    stepsHTML += '</div></div>';

    document.getElementById('stepsContainer').innerHTML = stepsHTML;

    let finalHTML = '<h3><svg class="tick-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Optimal Route</h3>';

    finalHTML += '<div class="route-display">';
    for (let i = 0; i < optimalRoute.length; i++) {
        finalHTML += `<span class="route-city">${cityNames[optimalRoute[i]]}</span>`;

        if (i < optimalRoute.length - 1) {
            const cost = distMatrix[optimalRoute[i]][optimalRoute[i + 1]];
            finalHTML += `<span class="route-arrow">→</span><span class="route-cost">${cost}</span><span class="route-arrow">→</span>`;
        }
    }
    const returnCost = distMatrix[optimalRoute[optimalRoute.length - 1]][optimalRoute[0]];
    finalHTML += `<span class="route-arrow">→</span><span class="route-cost">${returnCost}</span><span class="route-arrow">→</span>`;
    finalHTML += `<span class="route-city">${cityNames[optimalRoute[0]]}</span>`;
    finalHTML += '</div>';

    finalHTML += `<div class="total-distance">Total Distance: ${minDistance}</div>`;

    document.getElementById('finalResult').innerHTML = finalHTML;

    // Draw tree visualization
    drawPathTree(allRoutes, optimalRoute, minDistance, startCity);
}

document.addEventListener('DOMContentLoaded', function () {
    generateMatrix();
});
