/**
 * =============================================================================
 * TRANSPORTATION PROBLEM SOLVER
 * =============================================================================
 * 
 * This module solves the Transportation Problem, which optimizes the cost
 * of shipping goods from suppliers (sources) to consumers (destinations).
 * 
 * INITIAL SOLUTION METHODS:
 * 1. North-West Corner (NWC): Start at top-left, allocate max possible
 * 2. Least Cost Method (LCM): Prioritize lowest cost cells first
 * 3. Vogel's Approximation (VAM): Use penalty-based allocation for better initial solution
 * 
 * OPTIMIZATION:
 * - MODI Method (Modified Distribution): Tests optimality using u-v multipliers
 * - Stepping Stone: Creates closed loops to improve non-optimal solutions
 * 
 * ALGORITHM FLOW:
 * 1. Balance problem (add dummy source/destination if unbalanced)
 * 2. Find initial basic feasible solution (NWC/LCM/VAM)
 * 3. Calculate u,v values for basic cells (u[i] + v[j] = c[i][j])
 * 4. Compute opportunity costs (Δ[i][j] = c[i][j] - u[i] - v[j])
 * 5. If all Δ >= 0, solution is optimal; else, find entering cell
 * 6. Trace closed loop and improve solution, repeat from step 3
 * 
 * =============================================================================
 */

let costMatrix = [];
let supply = [];
let demand = [];
let m = 0;  // Number of sources
let n = 0;  // Number of destinations
let originalM = 0;
let originalN = 0;
let sourceNames = [];
let destNames = [];
let isDummySource = false;
let isDummyDest = false;

function generateMatrix() {
    originalM = parseInt(document.getElementById('numSources').value);
    originalN = parseInt(document.getElementById('numDestinations').value);

    if (originalM < 2 || originalM > 10 || originalN < 2 || originalN > 10) {
        alert('Please enter values between 2 and 10');
        return;
    }

    m = originalM;
    n = originalN;
    isDummySource = false;
    isDummyDest = false;

    generateNameInputs();
    updateMatrixTable();
    document.getElementById('resultsCard').classList.add('hidden');
}

function generateNameInputs() {
    const namesSection = document.getElementById('namesSection');
    namesSection.classList.remove('hidden');

    let sourceHTML = '';
    for (let i = 0; i < m; i++) {
        sourceHTML += `<input type="text" id="sourceName_${i}" value="S${i + 1}" onchange="updateMatrixTable()">`;
    }
    document.getElementById('sourceNamesContainer').innerHTML = sourceHTML;

    let destHTML = '';
    for (let j = 0; j < n; j++) {
        destHTML += `<input type="text" id="destName_${j}" value="D${j + 1}" onchange="updateMatrixTable()">`;
    }
    document.getElementById('destNamesContainer').innerHTML = destHTML;
}

function getNames() {
    sourceNames = [];
    destNames = [];

    for (let i = 0; i < m; i++) {
        const el = document.getElementById(`sourceName_${i}`);
        sourceNames.push(el ? el.value : `S${i + 1}`);
    }

    for (let j = 0; j < n; j++) {
        const el = document.getElementById(`destName_${j}`);
        destNames.push(el ? el.value : `D${j + 1}`);
    }
}

function updateMatrixTable() {
    getNames();

    let savedCosts = [];
    let savedSupply = [];
    let savedDemand = [];

    for (let i = 0; i < m; i++) {
        savedCosts[i] = [];
        for (let j = 0; j < n; j++) {
            const cell = document.getElementById(`cost_${i}_${j}`);
            savedCosts[i][j] = cell ? cell.value : '0';
        }
        const supplyCell = document.getElementById(`supply_${i}`);
        savedSupply[i] = supplyCell ? supplyCell.value : '0';
    }

    for (let j = 0; j < n; j++) {
        const demandCell = document.getElementById(`demand_${j}`);
        savedDemand[j] = demandCell ? demandCell.value : '0';
    }

    let html = '<table>';

    html += '<tr><th></th>';
    for (let j = 0; j < n; j++) {
        html += `<th>${destNames[j]}</th>`;
    }
    html += '<th class="supply-header">Supply</th></tr>';

    for (let i = 0; i < m; i++) {
        html += `<tr><td class="row-header">${sourceNames[i]}</td>`;

        for (let j = 0; j < n; j++) {
            const val = savedCosts[i] && savedCosts[i][j] ? savedCosts[i][j] : '0';
            html += `<td><input type="number" id="cost_${i}_${j}" value="${val}"></td>`;
        }

        const supplyVal = savedSupply[i] || '0';
        html += `<td><input type="number" id="supply_${i}" value="${supplyVal}" class="supply-input"></td>`;
        html += '</tr>';
    }

    html += '<tr class="demand-row"><td class="row-header">Demand</td>';
    for (let j = 0; j < n; j++) {
        const demandVal = savedDemand[j] || '0';
        html += `<td><input type="number" id="demand_${j}" value="${demandVal}" class="demand-input"></td>`;
    }
    html += '<td></td></tr>';

    html += '</table>';
    document.getElementById('matrixInput').innerHTML = html;
}

function getData() {
    costMatrix = [];
    supply = [];
    demand = [];

    for (let i = 0; i < m; i++) {
        costMatrix[i] = [];
        for (let j = 0; j < n; j++) {
            costMatrix[i][j] = parseFloat(document.getElementById(`cost_${i}_${j}`).value) || 0;
        }
        supply[i] = parseFloat(document.getElementById(`supply_${i}`).value) || 0;
    }

    for (let j = 0; j < n; j++) {
        demand[j] = parseFloat(document.getElementById(`demand_${j}`).value) || 0;
    }
}

function balanceProblem(steps) {
    const totalSupply = supply.reduce((a, b) => a + b, 0);
    const totalDemand = demand.reduce((a, b) => a + b, 0);

    const warningDiv = document.getElementById('balanceWarning');
    const warningMsg = document.getElementById('balanceMessage');

    if (totalSupply === totalDemand) {
        warningDiv.classList.add('hidden');
        steps.push({
            title: 'Step 0: Check Balance',
            description: `Total Supply = ${totalSupply}, Total Demand = ${totalDemand}. Problem is balanced.`,
            type: 'info'
        });
        return;
    }

    warningDiv.classList.remove('hidden');

    if (totalSupply > totalDemand) {
        const diff = totalSupply - totalDemand;
        warningMsg.innerHTML = `<strong>⚠️ Unbalanced:</strong> Supply (${totalSupply}) > Demand (${totalDemand}). Adding dummy destination with demand ${diff}.`;

        for (let i = 0; i < m; i++) {
            costMatrix[i].push(0);
        }
        demand.push(diff);
        destNames.push('Dummy');
        n++;
        isDummyDest = true;

        steps.push({
            title: 'Step 0: Balance Problem',
            description: `Supply (${totalSupply}) > Demand (${totalDemand - diff}). Added dummy destination with demand ${diff} and zero costs.`,
            type: 'info'
        });
    } else {
        const diff = totalDemand - totalSupply;
        warningMsg.innerHTML = `<strong>⚠️ Unbalanced:</strong> Demand (${totalDemand}) > Supply (${totalSupply}). Adding dummy source with supply ${diff}.`;

        costMatrix.push(new Array(n).fill(0));
        supply.push(diff);
        sourceNames.push('Dummy');
        m++;
        isDummySource = true;

        steps.push({
            title: 'Step 0: Balance Problem',
            description: `Demand (${totalDemand}) > Supply (${totalSupply - diff}). Added dummy source with supply ${diff} and zero costs.`,
            type: 'info'
        });
    }
}

/**
 * North-West Corner Method for initial solution.
 * Starts at top-left cell and allocates maximum possible,
 * moving right or down when supply/demand is exhausted.
 * Simple but may not give cost-efficient initial solution.
 * @param {Array} costs - Cost matrix
 * @param {Array} sup - Supply values
 * @param {Array} dem - Demand values
 * @returns {Object} Allocation matrix and step log
 */
function northWestCorner(costs, sup, dem) {
    const allocation = Array(m).fill(null).map(() => Array(n).fill(0));
    const supplyLeft = [...sup];
    const demandLeft = [...dem];
    const steps = [];

    let i = 0, j = 0;

    while (i < m && j < n) {
        const qty = Math.min(supplyLeft[i], demandLeft[j]);
        allocation[i][j] = qty;

        steps.push({
            i, j, qty,
            desc: `Allocate min(${supplyLeft[i]}, ${demandLeft[j]}) = ${qty} to (${sourceNames[i]}, ${destNames[j]})`
        });

        supplyLeft[i] -= qty;
        demandLeft[j] -= qty;

        if (supplyLeft[i] === 0) i++;
        if (demandLeft[j] === 0) j++;
    }

    return { allocation, steps };
}

/**
 * Least Cost Method for initial solution.
 * Iteratively selects the cell with minimum cost among
 * all available cells and allocates maximum possible.
 * Generally gives better initial solution than NWC.
 * @param {Array} costs - Cost matrix
 * @param {Array} sup - Supply values
 * @param {Array} dem - Demand values
 * @returns {Object} Allocation matrix and step log
 */
function leastCostMethod(costs, sup, dem) {
    const allocation = Array(m).fill(null).map(() => Array(n).fill(0));
    const supplyLeft = [...sup];
    const demandLeft = [...dem];
    const steps = [];
    const used = Array(m).fill(null).map(() => Array(n).fill(false));

    while (true) {
        let minCost = Infinity;
        let minI = -1, minJ = -1;

        for (let i = 0; i < m; i++) {
            if (supplyLeft[i] <= 0) continue;
            for (let j = 0; j < n; j++) {
                if (demandLeft[j] <= 0) continue;
                if (costs[i][j] < minCost) {
                    minCost = costs[i][j];
                    minI = i;
                    minJ = j;
                }
            }
        }

        if (minI === -1) break;

        const qty = Math.min(supplyLeft[minI], demandLeft[minJ]);
        allocation[minI][minJ] = qty;

        steps.push({
            i: minI, j: minJ, qty, cost: minCost,
            desc: `Min cost ${minCost} at (${sourceNames[minI]}, ${destNames[minJ]}). Allocate ${qty}.`
        });

        supplyLeft[minI] -= qty;
        demandLeft[minJ] -= qty;
    }

    return { allocation, steps };
}

/**
 * Vogel's Approximation Method (VAM) for initial solution.
 * Calculates "penalties" for each row and column (difference between
 * two lowest costs). Allocates to the cell with minimum cost in the
 * row/column with highest penalty. Often produces near-optimal initial solution.
 * @param {Array} costs - Cost matrix
 * @param {Array} sup - Supply values
 * @param {Array} dem - Demand values
 * @returns {Object} Allocation matrix and step log
 */
function vogelApproximation(costs, sup, dem) {
    const allocation = Array(m).fill(null).map(() => Array(n).fill(0));
    const supplyLeft = [...sup];
    const demandLeft = [...dem];
    const steps = [];

    while (true) {
        const activeRows = [];
        const activeCols = [];

        for (let i = 0; i < m; i++) if (supplyLeft[i] > 0) activeRows.push(i);
        for (let j = 0; j < n; j++) if (demandLeft[j] > 0) activeCols.push(j);

        if (activeRows.length === 0 || activeCols.length === 0) break;

        const rowPenalties = [];
        const colPenalties = [];

        for (let i of activeRows) {
            const costs_in_row = activeCols.map(j => costs[i][j]).sort((a, b) => a - b);
            const penalty = costs_in_row.length > 1 ? costs_in_row[1] - costs_in_row[0] : costs_in_row[0];
            rowPenalties.push({ index: i, penalty, type: 'row' });
        }

        for (let j of activeCols) {
            const costs_in_col = activeRows.map(i => costs[i][j]).sort((a, b) => a - b);
            const penalty = costs_in_col.length > 1 ? costs_in_col[1] - costs_in_col[0] : costs_in_col[0];
            colPenalties.push({ index: j, penalty, type: 'col' });
        }

        const allPenalties = [...rowPenalties, ...colPenalties];
        allPenalties.sort((a, b) => b.penalty - a.penalty);
        const maxPenalty = allPenalties[0];

        let selI, selJ;

        if (maxPenalty.type === 'row') {
            selI = maxPenalty.index;
            let minCost = Infinity;
            for (let j of activeCols) {
                if (costs[selI][j] < minCost) {
                    minCost = costs[selI][j];
                    selJ = j;
                }
            }
        } else {
            selJ = maxPenalty.index;
            let minCost = Infinity;
            for (let i of activeRows) {
                if (costs[i][selJ] < minCost) {
                    minCost = costs[i][selJ];
                    selI = i;
                }
            }
        }

        const qty = Math.min(supplyLeft[selI], demandLeft[selJ]);
        allocation[selI][selJ] = qty;

        steps.push({
            i: selI, j: selJ, qty,
            rowPenalties: rowPenalties.map(p => ({ name: sourceNames[p.index], val: p.penalty })),
            colPenalties: colPenalties.map(p => ({ name: destNames[p.index], val: p.penalty })),
            maxPenalty: maxPenalty,
            desc: `Max penalty ${maxPenalty.penalty} in ${maxPenalty.type === 'row' ? sourceNames[maxPenalty.index] : destNames[maxPenalty.index]}. Allocate ${qty} to (${sourceNames[selI]}, ${destNames[selJ]}).`
        });

        supplyLeft[selI] -= qty;
        demandLeft[selJ] -= qty;
    }

    return { allocation, steps };
}

function getBasicCells(allocation) {
    const basic = [];
    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            if (allocation[i][j] > 0) {
                basic.push({ i, j, qty: allocation[i][j] });
            }
        }
    }
    return basic;
}

/**
 * Calculate u and v values using MODI method.
 * For basic cells: u[i] + v[j] = cost[i][j]
 * Sets u[0] = 0 as starting point and solves iteratively.
 * Used to test optimality of current solution.
 * @param {Array} allocation - Current allocation matrix
 * @param {Array} costs - Cost matrix
 * @returns {Object} u values, v values, and basic cells list
 */
function calculateUV(allocation, costs) {
    const u = new Array(m).fill(null);
    const v = new Array(n).fill(null);
    const basic = getBasicCells(allocation);

    if (basic.length < m + n - 1) {
        for (let i = 0; i < m && basic.length < m + n - 1; i++) {
            for (let j = 0; j < n && basic.length < m + n - 1; j++) {
                if (allocation[i][j] === 0) {
                    let valid = true;
                    for (let b of basic) {
                        if (b.i === i && b.j === j) {
                            valid = false;
                            break;
                        }
                    }
                    if (valid) {
                        basic.push({ i, j, qty: 0, epsilon: true });
                    }
                }
            }
        }
    }

    u[0] = 0;

    let changed = true;
    let iterations = 0;
    while (changed && iterations < 100) {
        changed = false;
        iterations++;

        for (let cell of basic) {
            if (u[cell.i] !== null && v[cell.j] === null) {
                v[cell.j] = costs[cell.i][cell.j] - u[cell.i];
                changed = true;
            } else if (u[cell.i] === null && v[cell.j] !== null) {
                u[cell.i] = costs[cell.i][cell.j] - v[cell.j];
                changed = true;
            }
        }
    }

    return { u, v, basic };
}

/**
 * Calculate opportunity costs (delta values) for non-basic cells.
 * Delta[i][j] = cost[i][j] - u[i] - v[j]
 * Negative delta indicates potential for improvement.
 * @param {Array} allocation - Current allocation matrix
 * @param {Array} costs - Cost matrix
 * @param {Array} u - Row multipliers
 * @param {Array} v - Column multipliers
 * @returns {Object} Delta matrix and most negative cell
 */
function calculateOpportunityCosts(allocation, costs, u, v) {
    const delta = [];
    let mostNegative = null;

    for (let i = 0; i < m; i++) {
        delta[i] = [];
        for (let j = 0; j < n; j++) {
            if (allocation[i][j] === 0) {
                delta[i][j] = costs[i][j] - u[i] - v[j];
                if (mostNegative === null || delta[i][j] < mostNegative.value) {
                    mostNegative = { i, j, value: delta[i][j] };
                }
            } else {
                delta[i][j] = null;
            }
        }
    }

    return { delta, mostNegative };
}

/**
 * Find the closed loop (stepping stone path) starting from a non-basic cell.
 * Loop alternates between horizontal and vertical moves,
 * using only basic cells as stepping stones.
 * Used to reallocate and improve the solution.
 * @param {Array} allocation - Current allocation matrix
 * @param {number} startI - Starting row (entering variable)
 * @param {number} startJ - Starting column (entering variable)
 * @returns {Array} Loop path as array of {i, j} positions
 */
function findLoop(allocation, startI, startJ) {
    const basic = [];
    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            if (allocation[i][j] > 0 || (i === startI && j === startJ)) {
                basic.push({ i, j });
            }
        }
    }

    function findPath(path, horizontal) {
        const current = path[path.length - 1];

        if (path.length > 3 && current.i === startI && current.j === startJ) {
            return path.slice(0, -1);
        }

        if (horizontal) {
            for (let cell of basic) {
                if (cell.i === current.i && cell.j !== current.j) {
                    if (path.length > 1 && path[path.length - 2].i === cell.i && path[path.length - 2].j === cell.j) continue;
                    const newPath = [...path, cell];
                    const result = findPath(newPath, false);
                    if (result) return result;
                }
            }
        } else {
            for (let cell of basic) {
                if (cell.j === current.j && cell.i !== current.i) {
                    if (path.length > 1 && path[path.length - 2].i === cell.i && path[path.length - 2].j === cell.j) continue;
                    const newPath = [...path, cell];
                    const result = findPath(newPath, true);
                    if (result) return result;
                }
            }
        }

        return null;
    }

    let loop = findPath([{ i: startI, j: startJ }], true);
    if (!loop) {
        loop = findPath([{ i: startI, j: startJ }], false);
    }

    return loop;
}

/**
 * Improve solution by reallocating along the loop.
 * Alternates + and - at loop corners.
 * Theta = minimum value at minus positions.
 * @param {Array} allocation - Current allocation matrix
 * @param {Array} loop - Loop path from findLoop()
 * @returns {Object} New allocation, theta value, loop used
 */
function improveSolution(allocation, loop) {
    const minusPositions = loop.filter((_, idx) => idx % 2 === 1);
    const theta = Math.min(...minusPositions.map(p => allocation[p.i][p.j]));

    const newAllocation = allocation.map(row => [...row]);

    for (let idx = 0; idx < loop.length; idx++) {
        const pos = loop[idx];
        if (idx % 2 === 0) {
            newAllocation[pos.i][pos.j] += theta;
        } else {
            newAllocation[pos.i][pos.j] -= theta;
        }
    }

    return { newAllocation, theta, loop };
}

/**
 * Main solve function - executes the Transportation algorithm.
 * 1. Gets initial solution using selected method (NWC/LCM/VAM)
 * 2. Iteratively applies MODI method until optimal
 * @returns {void} Displays results in the UI
 */
function solve() {
    getNames();
    getData();

    const method = document.querySelector('input[name="method"]:checked').value;
    const steps = [];

    balanceProblem(steps);

    let result;
    let methodName;

    switch (method) {
        case 'nwc':
            methodName = 'North-West Corner Method';
            result = northWestCorner(costMatrix, supply, demand);
            break;
        case 'lcm':
            methodName = 'Least Cost Method';
            result = leastCostMethod(costMatrix, supply, demand);
            break;
        case 'vam':
            methodName = "Vogel's Approximation Method";
            result = vogelApproximation(costMatrix, supply, demand);
            break;
    }

    addInitialSolutionSteps(steps, methodName, result);

    let allocation = result.allocation;
    let iteration = 0;
    const maxIterations = 50;

    while (iteration < maxIterations) {
        iteration++;

        const { u, v, basic } = calculateUV(allocation, costMatrix);
        const { delta, mostNegative } = calculateOpportunityCosts(allocation, costMatrix, u, v);

        addMODIStep(steps, allocation, u, v, delta, mostNegative, iteration);

        if (!mostNegative || mostNegative.value >= 0) {
            steps.push({
                title: '<svg class="tick-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Optimal Solution Found',
                description: 'All opportunity costs are non-negative. Solution is optimal.',
                type: 'optimal',
                allocation: allocation.map(row => [...row])
            });
            break;
        }

        const loop = findLoop(allocation, mostNegative.i, mostNegative.j);

        if (!loop) {
            steps.push({
                title: '⚠️ Could not find improvement loop',
                description: 'Algorithm terminated.',
                type: 'error'
            });
            break;
        }

        const improvement = improveSolution(allocation, loop);
        allocation = improvement.newAllocation;

        addImprovementStep(steps, improvement, iteration);
    }

    displaySteps(steps);
    displayFinalResult(allocation);

    document.getElementById('resultsCard').classList.remove('hidden');
}

function addInitialSolutionSteps(steps, methodName, result) {
    steps.push({
        title: `Initial Solution: ${methodName}`,
        description: `Finding initial basic feasible solution using ${methodName}.`,
        type: 'method',
        subSteps: result.steps,
        allocation: result.allocation
    });
}

function addMODIStep(steps, allocation, u, v, delta, mostNegative, iteration) {
    steps.push({
        title: `MODI Check - Iteration ${iteration}`,
        description: mostNegative && mostNegative.value < 0
            ? `Most negative Δ = ${mostNegative.value} at (${sourceNames[mostNegative.i]}, ${destNames[mostNegative.j]}). Not optimal.`
            : 'All Δ ≥ 0. Solution is optimal!',
        type: mostNegative && mostNegative.value < 0 ? 'modi' : 'optimal',
        u, v, delta, mostNegative,
        allocation: allocation.map(row => [...row])
    });
}

function addImprovementStep(steps, improvement, iteration) {
    steps.push({
        title: `Improvement - Iteration ${iteration}`,
        description: `θ = ${improvement.theta}. Adjusting allocations along the loop.`,
        type: 'improvement',
        loop: improvement.loop,
        theta: improvement.theta,
        allocation: improvement.newAllocation
    });
}

function allocationToHTML(alloc, highlights = {}) {
    let html = '<table>';

    html += '<tr><th></th>';
    for (let j = 0; j < n; j++) {
        const isDummy = isDummyDest && j === n - 1;
        html += `<th class="${isDummy ? 'dummy' : ''}">${destNames[j]}</th>`;
    }
    html += '<th class="supply-header">Supply</th></tr>';

    for (let i = 0; i < m; i++) {
        const isRowDummy = isDummySource && i === m - 1;
        html += `<tr><td class="row-header ${isRowDummy ? 'dummy' : ''}">${sourceNames[i]}</td>`;

        for (let j = 0; j < n; j++) {
            let cellClass = '';
            const isDummy = (isDummySource && i === m - 1) || (isDummyDest && j === n - 1);

            if (highlights.selected && highlights.selected.i === i && highlights.selected.j === j) {
                cellClass = 'selected';
            } else if (highlights.loop) {
                const loopIdx = highlights.loop.findIndex(p => p.i === i && p.j === j);
                if (loopIdx !== -1) {
                    cellClass = loopIdx % 2 === 0 ? 'loop-plus' : 'loop-minus';
                }
            } else if (highlights.negative && highlights.negative.i === i && highlights.negative.j === j) {
                cellClass = 'negative';
            } else if (alloc[i][j] > 0) {
                cellClass = 'allocated';
            } else if (isDummy) {
                cellClass = 'dummy';
            }

            const costStr = `<span style="font-size:0.7rem;color:#888;">${costMatrix[i][j]}</span>`;
            const allocStr = alloc[i][j] > 0 ? `<strong>${alloc[i][j]}</strong>` : '-';
            html += `<td class="${cellClass}">${allocStr}<br>${costStr}</td>`;
        }

        html += `<td>${supply[i]}</td></tr>`;
    }

    html += '<tr class="demand-row"><td>Demand</td>';
    for (let j = 0; j < n; j++) {
        html += `<td>${demand[j]}</td>`;
    }
    html += '<td></td></tr>';

    html += '</table>';
    return html;
}

function displaySteps(steps) {
    let html = '';

    for (let step of steps) {
        const typeClass = step.type === 'optimal' ? 'optimal' : (step.type === 'improvement' ? 'improvement' : '');

        html += `<div class="step-container ${typeClass}">`;
        html += `<div class="step-title">${step.title}</div>`;
        html += `<p style="color: #8892b0; margin-bottom: 10px;">${step.description}</p>`;

        if (step.subSteps) {
            html += '<div style="margin-left: 15px; font-size: 0.9rem; color: #ccd6f6;">';
            for (let sub of step.subSteps) {
                html += `<p>• ${sub.desc}</p>`;
            }
            html += '</div>';
        }

        if (step.allocation) {
            html += '<div class="step-matrix">';
            html += allocationToHTML(step.allocation, {
                negative: step.mostNegative,
                loop: step.loop
            });
            html += '</div>';
        }

        if (step.u && step.v) {
            html += '<div class="uv-table" style="margin-top: 12px; padding: 10px 15px; background: rgba(0,0,0,0.3); border-radius: 8px; border-left: 3px solid #7c9885; font-size: 0.9rem;">';
            html += '<p><span style="color: #7c9885;">▸</span> <strong>u values:</strong> ' + step.u.map((val, i) => `u<sub>${sourceNames[i]}</sub>=<code style="color: #9fc5a8;">${val}</code>`).join(', ') + '</p>';
            html += '<p><span style="color: #7c9885;">▸</span> <strong>v values:</strong> ' + step.v.map((val, j) => `v<sub>${destNames[j]}</sub>=<code style="color: #9fc5a8;">${val}</code>`).join(', ') + '</p>';
            html += '</div>';
        }

        html += '</div>';
    }

    document.getElementById('stepsContainer').innerHTML = html + getLegendHTML();
}

function getLegendHTML() {
    return `
    <div class="legend-container" style="margin-top: 20px; padding: 15px; background: rgba(0,0,0,0.35); border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
        <h4 style="color: #a0aec0; margin-bottom: 12px; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px;">◈ Key / Legend</h4>
        <div style="display: flex; gap: 24px; flex-wrap: wrap; font-size: 0.85rem;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="width: 22px; height: 22px; background: rgba(212, 185, 78, 0.35); border: 2px solid #d4b94e; border-radius: 4px;"></span>
                <span style="color: #c9d1d9;">Allocated Cell</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="width: 22px; height: 22px; background: rgba(107,138,173,0.2); border: 2px dashed #6b8aad; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #6b8aad; font-weight: bold;">+</span>
                <span style="color: #c9d1d9;">Loop (+)</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="width: 22px; height: 22px; background: rgba(207,106,106,0.2); border: 2px dashed #cf6a6a; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #cf6a6a; font-weight: bold;">−</span>
                <span style="color: #c9d1d9;">Loop (−)</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="width: 22px; height: 22px; background: rgba(255, 182, 193, 0.3); border: 2px solid #e8a0a8; border-radius: 4px;"></span>
                <span style="color: #c9d1d9;">Most Negative</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="width: 22px; height: 22px; background: rgba(200, 200, 200, 0.2); border: 2px solid #c0c0c0; border-radius: 4px;"></span>
                <span style="color: #c9d1d9;">Dummy</span>
            </div>
        </div>
    </div>
    `;
}

function displayFinalResult(allocation) {
    let totalCost = 0;
    let allocations = [];

    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            if (allocation[i][j] > 0) {
                const isDummy = (isDummySource && i === m - 1) || (isDummyDest && j === n - 1);
                const cost = allocation[i][j] * costMatrix[i][j];

                if (!isDummy) {
                    totalCost += cost;
                }

                allocations.push({
                    from: sourceNames[i],
                    to: destNames[j],
                    qty: allocation[i][j],
                    cost: cost,
                    isDummy: isDummy
                });
            }
        }
    }

    let html = '<h3><svg class="tick-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Optimal Allocation</h3>';
    html += '<ul class="allocation-list">';

    for (let a of allocations) {
        const cls = a.isDummy ? 'dummy-alloc' : '';
        html += `<li class="${cls}">${a.from} → ${a.to}: ${a.qty} units${a.isDummy ? ' (dummy)' : ` @ ${costMatrix[allocations.indexOf(a) < m ? 0 : 1][0]} = ${a.cost}`}</li>`;
    }

    html += '</ul>';
    html += `<div class="total-cost">Total Transportation Cost: ${totalCost}</div>`;

    if (isDummySource || isDummyDest) {
        html += `<p style="color: #888; margin-top: 10px; font-size: 0.9rem;"><em>Dummy allocations excluded from total cost.</em></p>`;
    }

    document.getElementById('finalResult').innerHTML = html;
}

document.addEventListener('DOMContentLoaded', function () {
    generateMatrix();
});
