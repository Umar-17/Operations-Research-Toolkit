/**
 * =============================================================================
 * SHORTEST PATH SOLVER (DIJKSTRA & BELLMAN-FORD)
 * =============================================================================
 * 
 * This module finds the shortest path between two nodes in a weighted graph.
 * Supports both Dijkstra's and Bellman-Ford algorithms.
 * 
 * DIJKSTRA'S ALGORITHM:
 * - Works for non-negative edge weights only
 * - Greedy approach: always process nearest unvisited node
 * - Time: O(V²) with simple implementation
 * 
 * BELLMAN-FORD ALGORITHM:
 * - Handles negative edge weights
 * - Relaxes all edges V-1 times
 * - Can detect negative cycles
 * - Time: O(V × E)
 * 
 * ALGORITHM STEPS (Both):
 * 1. Initialize distances: source = 0, others = ∞
 * 2. Iteratively relax edges to find shorter paths
 * 3. Track predecessors to reconstruct shortest path
 * 
 * =============================================================================
 */

let distMatrix = [];  // Adjacency matrix (distances between nodes)
let n = 0;  // Number of nodes
let nodeNames = [];

function generateMatrix() {
    n = parseInt(document.getElementById('numNodes').value);

    if (n < 3 || n > 12) {
        alert('Please enter a value between 3 and 12');
        return;
    }

    generateNameInputs();
    updateMatrixTable();
    updateNodeDropdowns();
    document.getElementById('resultsCard').classList.add('hidden');
}

function generateNameInputs() {
    const namesSection = document.getElementById('namesSection');
    namesSection.classList.remove('hidden');

    let html = '';
    for (let i = 0; i < n; i++) {
        html += `<input type="text" id="nodeName_${i}" value="${i + 1}" onchange="updateAll()">`;
    }
    document.getElementById('nodeNamesContainer').innerHTML = html;
}

function getNames() {
    nodeNames = [];
    for (let i = 0; i < n; i++) {
        const el = document.getElementById(`nodeName_${i}`);
        nodeNames.push(el ? el.value : `${i + 1}`);
    }
}

function updateAll() {
    getNames();
    updateMatrixTable();
    updateNodeDropdowns();
}

function updateNodeDropdowns() {
    getNames();
    let html = '';
    for (let i = 0; i < n; i++) {
        html += `<option value="${i}">${nodeNames[i]}</option>`;
    }
    document.getElementById('sourceNode').innerHTML = html;

    let destHtml = '';
    for (let i = 0; i < n; i++) {
        const selected = i === n - 1 ? 'selected' : '';
        destHtml += `<option value="${i}" ${selected}>${nodeNames[i]}</option>`;
    }
    document.getElementById('destNode').innerHTML = destHtml;
}

function updateMatrixTable() {
    getNames();

    let savedValues = [];
    for (let i = 0; i < n; i++) {
        savedValues[i] = [];
        for (let j = 0; j < n; j++) {
            const cell = document.getElementById(`dist_${i}_${j}`);
            savedValues[i][j] = cell ? cell.value : '0';
        }
    }

    let html = '<table>';

    html += '<tr><th>From \\ To</th>';
    for (let j = 0; j < n; j++) {
        html += `<th>${nodeNames[j]}</th>`;
    }
    html += '</tr>';

    for (let i = 0; i < n; i++) {
        html += `<tr><td class="row-header">${nodeNames[i]}</td>`;

        for (let j = 0; j < n; j++) {
            const isDiagonal = i === j;
            const val = isDiagonal ? '0' : (savedValues[i] && savedValues[i][j] ? savedValues[i][j] : '0');
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
            const val = document.getElementById(`dist_${i}_${j}`).value;
            if (val === '∞' || val === 'inf' || val === '') {
                distMatrix[i][j] = Infinity;
            } else {
                const num = parseFloat(val);
                distMatrix[i][j] = (num === 0 && i !== j) ? Infinity : num;
            }
        }
    }
}

/**
 * Dijkstra's shortest path algorithm.
 * Greedy approach that always selects the nearest unvisited node.
 * Only works correctly with non-negative edge weights.
 * @param {number} source - Starting node index
 * @param {number} dest - Destination node index
 * @returns {Object} { distance, path, steps } for visualization
 */
function dijkstra(source, dest) {
    const dist = new Array(n).fill(Infinity);
    const prev = new Array(n).fill(-1);
    const visited = new Array(n).fill(false);
    const steps = [];

    dist[source] = 0;

    steps.push({
        title: 'Initialization',
        description: `Set distance to source node ${nodeNames[source]} = 0, all others = ∞`,
        dist: [...dist],
        visited: [...visited]
    });

    for (let count = 0; count < n - 1; count++) {
        let minDist = Infinity;
        let u = -1;

        for (let v = 0; v < n; v++) {
            if (!visited[v] && dist[v] < minDist) {
                minDist = dist[v];
                u = v;
            }
        }

        if (u === -1) break;

        visited[u] = true;

        let updateDetails = [];

        for (let v = 0; v < n; v++) {
            if (!visited[v] && distMatrix[u][v] !== Infinity) {
                const newDist = dist[u] + distMatrix[u][v];
                if (newDist < dist[v]) {
                    updateDetails.push({
                        from: u,
                        to: v,
                        oldDist: dist[v],
                        newDist: newDist,
                        edge: distMatrix[u][v]
                    });
                    dist[v] = newDist;
                    prev[v] = u;
                }
            }
        }

        steps.push({
            title: `Stage ${count + 1}: Process Node ${nodeNames[u]}`,
            description: `Selected node ${nodeNames[u]} with distance ${minDist}. Relaxing edges.`,
            currentNode: u,
            dist: [...dist],
            prev: [...prev],
            visited: [...visited],
            updates: updateDetails
        });
    }

    const path = [];
    let current = dest;
    while (current !== -1) {
        path.unshift(current);
        current = prev[current];
    }

    return {
        distance: dist[dest],
        path: path,
        steps: steps,
        prev: prev
    };
}

/**
 * Bellman-Ford shortest path algorithm.
 * Dynamic programming approach that relaxes all edges V-1 times.
 * Handles negative edge weights (but not negative cycles).
 * @param {number} source - Starting node index
 * @param {number} dest - Destination node index
 * @returns {Object} { distance, path, steps } for visualization
 */
function bellmanFord(source, dest) {
    const dist = new Array(n).fill(Infinity);
    const prev = new Array(n).fill(-1);
    const steps = [];

    dist[source] = 0;

    steps.push({
        title: 'Initialization (Stage 0)',
        description: `f₀(${nodeNames[source]}) = 0, f₀(all others) = ∞`,
        dist: [...dist],
        stage: 0
    });

    for (let stage = 1; stage < n; stage++) {
        const prevDist = [...dist];
        let updates = [];
        let changed = false;

        for (let u = 0; u < n; u++) {
            for (let v = 0; v < n; v++) {
                if (distMatrix[u][v] !== Infinity && dist[u] !== Infinity) {
                    const newDist = dist[u] + distMatrix[u][v];
                    if (newDist < dist[v]) {
                        updates.push({
                            v: v,
                            via: u,
                            oldDist: dist[v],
                            newDist: newDist,
                            formula: `f${stage}(${nodeNames[v]}) = min(f${stage - 1}(${nodeNames[v]}), f${stage - 1}(${nodeNames[u]}) + c(${nodeNames[u]},${nodeNames[v]})) = min(${prevDist[v] === Infinity ? '∞' : prevDist[v]}, ${dist[u]} + ${distMatrix[u][v]}) = ${newDist}`
                        });
                        dist[v] = newDist;
                        prev[v] = u;
                        changed = true;
                    }
                }
            }
        }

        steps.push({
            title: `Stage ${stage}: Dynamic Programming Iteration`,
            description: `Computing f${stage}(j) = min{f${stage - 1}(j), min over i [f${stage - 1}(i) + c(i,j)]}`,
            dist: [...dist],
            prev: [...prev],
            updates: updates,
            stage: stage
        });

        if (!changed) break;
    }

    const path = [];
    let current = dest;
    while (current !== -1) {
        path.unshift(current);
        current = prev[current];
    }

    return {
        distance: dist[dest],
        path: path,
        steps: steps,
        prev: prev
    };
}

/**
 * Main solve function - executes selected shortest path algorithm.
 * @returns {void} Displays step-by-step results in the UI
 */
function solve() {
    getNames();
    getData();

    const source = parseInt(document.getElementById('sourceNode').value);
    const dest = parseInt(document.getElementById('destNode').value);

    if (source === dest) {
        alert('Source and destination must be different!');
        return;
    }

    const result = bellmanFord(source, dest);

    displayResults(result, source, dest);

    document.getElementById('resultsCard').classList.remove('hidden');
}

function displayResults(result, source, dest) {
    let stepsHTML = '';

    for (let step of result.steps) {
        stepsHTML += `
            <div class="step-container">
                <div class="step-title">${step.title}</div>
                <p style="color: rgba(255,255,255,0.7); margin-bottom: 10px;">${step.description}</p>
        `;

        stepsHTML += '<table class="dp-table"><tr><th>Node</th>';
        for (let i = 0; i < n; i++) {
            stepsHTML += `<th>${nodeNames[i]}</th>`;
        }
        stepsHTML += `</tr><tr><td><strong>f${step.stage !== undefined ? step.stage : ''}()</strong></td>`;

        for (let i = 0; i < n; i++) {
            const isUpdated = step.updates && step.updates.some(u => u.v === i);
            const isPath = result.path.includes(i);
            const isSource = i === source;
            const isDestination = i === dest;

            let cls = '';
            if (isSource) {
                cls = 'source';
            } else if (isDestination) {
                cls = 'destination';
            } else if (isUpdated) {
                cls = 'updated';
            } else if (isPath) {
                cls = 'path';
            } else if (step.stage > 0) {
                cls = 'no-change';
            }

            const val = step.dist[i] === Infinity ? '∞' : step.dist[i];
            stepsHTML += `<td class="${cls}">${val}</td>`;
        }
        stepsHTML += '</tr></table>';

        if (step.updates && step.updates.length > 0) {
            stepsHTML += '<div class="iteration-detail" style="margin-top: 10px; padding: 10px 15px; background: rgba(0,0,0,0.3); border-radius: 8px; border-left: 3px solid #6b8aad;">';
            for (let u of step.updates) {
                stepsHTML += `<p style="margin: 4px 0;"><span style="color: #6b8aad; margin-right: 6px;">→</span><code style="background: rgba(107,138,173,0.15); padding: 2px 6px; border-radius: 4px; color: #9fc1e5;">${u.formula}</code></p>`;
            }
            stepsHTML += '</div>';
        }

        stepsHTML += '</div>';
    }

    document.getElementById('stepsContainer').innerHTML = stepsHTML + getLegendHTML();

    let finalHTML = '';

    if (result.distance === Infinity) {
        finalHTML = `<h3 style="color: #ff6b6b !important;">❌ No Path Exists</h3>
                         <p>There is no path from ${nodeNames[source]} to ${nodeNames[dest]}</p>`;
    } else {
        finalHTML = '<h3><svg class="tick-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Shortest Path Found</h3>';

        finalHTML += '<div class="path-display">';
        for (let i = 0; i < result.path.length; i++) {
            finalHTML += `<span class="path-node">${nodeNames[result.path[i]]}</span>`;

            if (i < result.path.length - 1) {
                const cost = distMatrix[result.path[i]][result.path[i + 1]];
                finalHTML += `<span class="path-arrow">→</span><span class="path-cost">${cost}</span><span class="path-arrow">→</span>`;
            }
        }
        finalHTML += '</div>';

        finalHTML += `<div class="total-distance">Shortest Distance: ${result.distance}</div>`;
    }

    document.getElementById('finalResult').innerHTML = finalHTML;
}

function getLegendHTML() {
    return `
    <div class="legend-container" style="margin-top: 20px; padding: 15px; background: rgba(0,0,0,0.35); border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
        <h4 style="color: #a0aec0; margin-bottom: 12px; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px;">◈ Key / Legend</h4>
        <div style="display: flex; gap: 24px; flex-wrap: wrap; font-size: 0.85rem;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="width: 22px; height: 22px; background: rgba(107, 138, 173, 0.35); border: 2px solid #6b8aad; border-radius: 4px;"></span>
                <span style="color: #c9d1d9;">Source Node</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="width: 22px; height: 22px; background: rgba(129, 178, 154, 0.35); border: 2px solid #81b29a; border-radius: 4px;"></span>
                <span style="color: #c9d1d9;">Destination Node</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="width: 22px; height: 22px; background: rgba(255, 182, 193, 0.35); border: 2px solid #e8a0a8; border-radius: 4px;"></span>
                <span style="color: #c9d1d9;">Shortest Path</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="width: 22px; height: 22px; background: rgba(230, 200, 100, 0.25); border: 2px solid #d4b94e; border-radius: 4px;"></span>
                <span style="color: #c9d1d9;">Updated Distance</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="width: 22px; height: 22px; background: rgba(196, 122, 122, 0.25); border: 2px solid #c47a7a; border-radius: 4px;"></span>
                <span style="color: #c9d1d9;">No Change</span>
            </div>
        </div>
    </div>
    `;
}

document.addEventListener('DOMContentLoaded', function () {
    generateMatrix();
});
