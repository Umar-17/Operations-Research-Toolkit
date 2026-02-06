/**
 * =============================================================================
 * BRANCH AND BOUND (INTEGER LINEAR PROGRAMMING)
 * =============================================================================
 * 
 * This module solves Integer Linear Programming (ILP) problems using the
 * Branch and Bound algorithm with LP relaxation.
 * 
 * ALGORITHM OVERVIEW:
 * 1. Solve the LP relaxation (ignore integer constraints)
 * 2. If all integer vars are integral, solution is optimal
 * 3. If some vars are fractional, pick one and branch:
 *    - Left child: x_i <= floor(x_i)
 *    - Right child: x_i >= ceil(x_i)
 * 4. Use best known integer solution to prune dominated branches
 * 5. Repeat until all nodes are processed (BFS exploration)
 * 
 * KEY CONCEPTS:
 * - Bounding: LP relaxation provides upper bound (maximization)
 * - Pruning: Discard branches worse than current best integer solution
 * - Branching: Split on fractional variable to force integrality
 * 
 * COMPLEXITY: Worst case exponential, but pruning often makes it practical
 * 
 * =============================================================================
 */

let numVars = 0;
let numConstraints = 0;
let integerVars = [];  // Indices of variables that must be integers
let isMaximization = true;
let bestSolution = null;  // Best integer solution found so far
let bestZ = null;  // Objective value of best solution
let nodes = [];  // Tree nodes for visualization

function generateInputs() {
    numVars = parseInt(document.getElementById('numVars').value);
    numConstraints = parseInt(document.getElementById('numConstraints').value);

    if (numVars < 1 || numVars > 6 || numConstraints < 1 || numConstraints > 6) {
        alert('Values must be between 1 and 6');
        return;
    }

    generateObjectiveInputs();
    generateConstraintInputs();
    generateIntegerVarInputs();
    document.getElementById('resultsCard').classList.add('hidden');
}

function generateObjectiveInputs() {
    let html = '';
    for (let j = 0; j < numVars; j++) {
        if (j > 0) html += '<span class="plus-sign">+</span>';
        html += `
            <div class="var-input">
                <input type="number" id="obj_${j}" value="${5 - j}">
                <span class="var-label">x<sub>${j + 1}</sub></span>
            </div>
        `;
    }
    document.getElementById('objectiveInputs').innerHTML = html;
}

function generateConstraintInputs() {
    let html = '';
    for (let i = 0; i < numConstraints; i++) {
        html += `<div class="constraint-row">`;
        html += `<span class="constraint-label">C${i + 1}:</span>`;

        for (let j = 0; j < numVars; j++) {
            if (j > 0) html += '<span class="plus-sign">+</span>';
            html += `
                <div class="var-input">
                    <input type="number" id="con_${i}_${j}" value="${Math.floor(Math.random() * 4) + 1}">
                    <span class="var-label">x<sub>${j + 1}</sub></span>
                </div>
            `;
        }

        html += `
            <select id="con_type_${i}">
                <option value="<=">&le;</option>
                <option value=">=">&ge;</option>
                <option value="=">=</option>
            </select>
            <input type="number" id="rhs_${i}" value="${(i + 1) * 6}" class="rhs-input">
        `;
        html += '</div>';
    }
    document.getElementById('constraintsContainer').innerHTML = html;
}

function generateIntegerVarInputs() {
    let html = '<div class="integer-vars">';
    for (let j = 0; j < numVars; j++) {
        html += `
            <label class="integer-checkbox">
                <input type="checkbox" id="int_${j}" checked>
                <span>x<sub>${j + 1}</sub> is integer</span>
            </label>
        `;
    }
    html += '</div>';
    document.getElementById('integerVarsContainer').innerHTML = html;
}

function collectData() {
    const objType = document.getElementById('objectiveType').value;
    isMaximization = objType === 'max';

    const objCoeffs = [];
    for (let j = 0; j < numVars; j++) {
        objCoeffs.push(parseFloat(document.getElementById(`obj_${j}`).value) || 0);
    }

    const constraints = [];
    for (let i = 0; i < numConstraints; i++) {
        const coeffs = [];
        for (let j = 0; j < numVars; j++) {
            coeffs.push(parseFloat(document.getElementById(`con_${i}_${j}`).value) || 0);
        }
        constraints.push({
            coeffs: coeffs,
            type: document.getElementById(`con_type_${i}`).value,
            rhs: parseFloat(document.getElementById(`rhs_${i}`).value) || 0
        });
    }

    integerVars = [];
    for (let j = 0; j < numVars; j++) {
        if (document.getElementById(`int_${j}`).checked) {
            integerVars.push(j);
        }
    }

    return { objCoeffs, constraints };
}

/**
 * Solve the LP relaxation using Simplex method.
 * Ignores integer constraints to get an upper/lower bound.
 * @param {Array} objCoeffs - Objective function coefficients
 * @param {Array} constraints - Problem constraints
 * @param {Array} extraConstraints - Additional branching constraints
 * @returns {Object} { feasible, solution, zValue } or { feasible: false }
 */
function solveLP(objCoeffs, constraints, extraConstraints = []) {
    const allConstraints = [...constraints, ...extraConstraints];

    let slackCount = 0;
    let surplusCount = 0;
    let artificialCount = 0;

    for (let con of allConstraints) {
        if (con.type === '<=') slackCount++;
        else if (con.type === '>=') { surplusCount++; artificialCount++; }
        else if (con.type === '=') artificialCount++;
    }

    const M = 1000000;
    const totalVars = numVars + slackCount + surplusCount + artificialCount;
    const artificialVarIndices = [];

    const tableau = [];
    const basicVars = [];
    let varIndex = numVars;

    for (let i = 0; i < allConstraints.length; i++) {
        const con = allConstraints[i];
        const row = new Array(totalVars + 1).fill(0);

        for (let j = 0; j < numVars; j++) {
            row[j] = con.coeffs[j];
        }

        if (con.type === '<=') {
            row[varIndex] = 1;
            basicVars.push(varIndex);
            varIndex++;
        } else if (con.type === '>=') {
            row[varIndex] = -1;
            varIndex++;
            row[varIndex] = 1;
            artificialVarIndices.push(varIndex);
            basicVars.push(varIndex);
            varIndex++;
        } else if (con.type === '=') {
            row[varIndex] = 1;
            artificialVarIndices.push(varIndex);
            basicVars.push(varIndex);
            varIndex++;
        }

        row[totalVars] = con.rhs;
        tableau.push(row);
    }

    const zRow = new Array(totalVars + 1).fill(0);
    for (let j = 0; j < numVars; j++) {
        zRow[j] = isMaximization ? -objCoeffs[j] : objCoeffs[j];
    }

    for (let artIdx of artificialVarIndices) {
        zRow[artIdx] = M;
    }

    for (let i = 0; i < basicVars.length; i++) {
        if (artificialVarIndices.includes(basicVars[i])) {
            for (let j = 0; j <= totalVars; j++) {
                zRow[j] -= M * tableau[i][j];
            }
        }
    }

    let iteration = 0;
    const maxIterations = 100;

    while (iteration < maxIterations) {
        iteration++;

        let pivotCol = -1;
        let minVal = -1e-10;
        for (let j = 0; j < totalVars; j++) {
            if (zRow[j] < minVal) {
                minVal = zRow[j];
                pivotCol = j;
            }
        }

        if (pivotCol === -1) break;

        let pivotRow = -1;
        let minRatio = Infinity;
        for (let i = 0; i < tableau.length; i++) {
            if (tableau[i][pivotCol] > 1e-10) {
                const ratio = tableau[i][totalVars] / tableau[i][pivotCol];
                if (ratio >= 0 && ratio < minRatio) {
                    minRatio = ratio;
                    pivotRow = i;
                }
            }
        }

        if (pivotRow === -1) {
            return { feasible: false, unbounded: true };
        }

        const pivotElement = tableau[pivotRow][pivotCol];
        for (let j = 0; j <= totalVars; j++) {
            tableau[pivotRow][j] /= pivotElement;
        }

        for (let i = 0; i < tableau.length; i++) {
            if (i !== pivotRow) {
                const factor = tableau[i][pivotCol];
                for (let j = 0; j <= totalVars; j++) {
                    tableau[i][j] -= factor * tableau[pivotRow][j];
                }
            }
        }

        const zFactor = zRow[pivotCol];
        for (let j = 0; j <= totalVars; j++) {
            zRow[j] -= zFactor * tableau[pivotRow][j];
        }

        basicVars[pivotRow] = pivotCol;
    }

    for (let i = 0; i < basicVars.length; i++) {
        if (artificialVarIndices.includes(basicVars[i])) {
            if (Math.abs(tableau[i][totalVars]) > 1e-10) {
                return { feasible: false };
            }
        }
    }

    const solution = new Array(numVars).fill(0);
    for (let i = 0; i < basicVars.length; i++) {
        if (basicVars[i] < numVars) {
            solution[basicVars[i]] = tableau[i][totalVars];
        }
    }

    let zValue = zRow[totalVars];
    if (!isMaximization) zValue = -zValue;

    return { feasible: true, solution, zValue };
}

/**
 * Find the first fractional integer variable for branching.
 * Returns the variable index and its fractional value.
 * @param {Array} solution - Current LP solution
 * @returns {Object|null} { index, value } or null if all integers
 */
function getFractionalVar(solution) {
    for (let j of integerVars) {
        const val = solution[j];
        const frac = val - Math.floor(val);
        if (frac > 1e-6 && frac < 1 - 1e-6) {
            return { index: j, value: val };
        }
    }
    return null;
}

/**
 * Main Branch and Bound algorithm.
 * Uses BFS exploration with LP-based bounding and pruning.
 * Creates branching constraints for fractional variables.
 * @param {Array} objCoeffs - Objective function coefficients
 * @param {Array} constraints - Problem constraints
 * @returns {Object} { bestSolution, bestZ, nodes } tree structure
 */
function branchAndBound(objCoeffs, constraints) {
    nodes = [];
    bestSolution = null;
    bestZ = isMaximization ? -Infinity : Infinity;

    let nodeId = 0;
    const queue = [{ id: nodeId++, extraConstraints: [], depth: 0, parent: null, branchInfo: null }];

    while (queue.length > 0) {
        const node = queue.shift();
        const result = solveLP(objCoeffs, constraints, node.extraConstraints);

        const nodeInfo = {
            id: node.id,
            depth: node.depth,
            parent: node.parent,
            branchInfo: node.branchInfo,
            extraConstraints: node.extraConstraints
        };

        if (!result.feasible) {
            nodeInfo.status = 'infeasible';
            nodeInfo.message = result.unbounded ? 'Unbounded' : 'Infeasible';
            nodes.push(nodeInfo);
            continue;
        }

        nodeInfo.solution = result.solution.map(v => Math.round(v * 10000) / 10000);
        nodeInfo.zValue = Math.round(result.zValue * 10000) / 10000;

        const dominated = isMaximization
            ? result.zValue <= bestZ + 1e-6
            : result.zValue >= bestZ - 1e-6;

        if (bestSolution !== null && dominated) {
            nodeInfo.status = 'pruned';
            nodeInfo.message = `Pruned (bound ${nodeInfo.zValue} worse than best ${bestZ})`;
            nodes.push(nodeInfo);
            continue;
        }

        const fractional = getFractionalVar(result.solution);

        if (fractional === null) {
            const better = isMaximization
                ? result.zValue > bestZ
                : result.zValue < bestZ;

            if (better) {
                bestSolution = result.solution.map(v => Math.round(v * 10000) / 10000);
                bestZ = Math.round(result.zValue * 10000) / 10000;
            }

            nodeInfo.status = 'integer';
            nodeInfo.message = 'Integer solution found';
            nodes.push(nodeInfo);
            continue;
        }

        nodeInfo.status = 'branched';
        nodeInfo.fractionalVar = fractional;
        nodes.push(nodeInfo);

        const floorVal = Math.floor(fractional.value);
        const ceilVal = Math.ceil(fractional.value);

        const leftConstraint = {
            coeffs: new Array(numVars).fill(0),
            type: '<=',
            rhs: floorVal
        };
        leftConstraint.coeffs[fractional.index] = 1;

        const rightConstraint = {
            coeffs: new Array(numVars).fill(0),
            type: '>=',
            rhs: ceilVal
        };
        rightConstraint.coeffs[fractional.index] = 1;

        queue.push({
            id: nodeId++,
            extraConstraints: [...node.extraConstraints, leftConstraint],
            depth: node.depth + 1,
            parent: node.id,
            branchInfo: `x${fractional.index + 1} ≤ ${floorVal}`
        });

        queue.push({
            id: nodeId++,
            extraConstraints: [...node.extraConstraints, rightConstraint],
            depth: node.depth + 1,
            parent: node.id,
            branchInfo: `x${fractional.index + 1} ≥ ${ceilVal}`
        });
    }

    return { bestSolution, bestZ, nodes };
}

function solve() {
    const { objCoeffs, constraints } = collectData();

    if (integerVars.length === 0) {
        alert('Please select at least one integer variable');
        return;
    }

    const result = branchAndBound(objCoeffs, constraints);
    displayResults(result);
    document.getElementById('resultsCard').classList.remove('hidden');
}

function displayResults(result) {
    let html = '<div class="tree-container">';

    const nodeMap = {};
    for (let node of result.nodes) {
        nodeMap[node.id] = node;
    }

    for (let node of result.nodes) {
        let statusClass = '';
        let statusText = '';
        let statusIcon = '';

        if (node.status === 'infeasible') {
            statusClass = 'infeasible';
            statusText = '<span class="node-status status-infeasible">✗ Infeasible</span>';
            statusIcon = '🚫';
        } else if (node.status === 'pruned') {
            statusClass = 'pruned';
            statusText = '<span class="node-status status-pruned">✂ Pruned</span>';
            statusIcon = '✂️';
        } else if (node.status === 'integer') {
            statusClass = 'integer';
            statusText = '<span class="node-status status-integer">✓ Integer</span>';
            statusIcon = '<svg class="tick-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        } else if (node.status === 'branched') {
            statusClass = 'branched';
            statusText = '<span class="node-status status-active">↓ Branched</span>';
            statusIcon = '🔀';
        }

        const indent = node.depth * 40;
        const isLeft = node.branchInfo && node.branchInfo.includes('≤');

        html += `<div class="tree-node ${statusClass}" style="margin-left: ${indent}px;">`;

        if (node.depth > 0) {
            html += `<div class="tree-connector">`;
            html += `<span class="connector-line"></span>`;
            html += `<span class="connector-branch ${isLeft ? 'left-branch' : 'right-branch'}">${node.branchInfo}</span>`;
            html += `</div>`;
        }

        html += `<div class="node-box">`;
        html += `<div class="node-header">`;
        html += `<span class="node-icon">${statusIcon}</span>`;
        html += `<span class="node-title">Node ${node.id}</span>`;
        html += statusText;
        html += `</div>`;

        html += `<div class="node-body">`;

        if (node.status === 'infeasible') {
            html += `<p class="node-message">${node.message}</p>`;
        } else if (node.status === 'pruned') {
            html += `<p class="node-message">${node.message}</p>`;
        } else {
            html += `<div class="solution-row">`;
            for (let j = 0; j < numVars; j++) {
                const val = node.solution[j];
                const isFrac = integerVars.includes(j) && (val - Math.floor(val) > 1e-6) && (val - Math.floor(val) < 1 - 1e-6);
                html += `<span class="sol-var ${isFrac ? 'fractional' : ''}">x<sub>${j + 1}</sub>=${val}</span>`;
            }
            html += `</div>`;
            html += `<div class="z-row">Z = ${node.zValue}</div>`;

            if (node.fractionalVar) {
                html += `<div class="branch-on">`;
                html += `Branch on x<sub>${node.fractionalVar.index + 1}</sub> = ${Math.round(node.fractionalVar.value * 10000) / 10000}`;
                html += `</div>`;
            }
        }

        html += `</div></div></div>`;
    }

    html += '</div>';

    html += getLegendHTML();

    document.getElementById('treeContainer').innerHTML = html;

    let finalHTML = '';
    if (result.bestSolution === null) {
        finalHTML = `<div class="final-result infeasible">
            <h3>❌ No Integer Solution</h3>
            <p>No feasible integer solution exists.</p>
        </div>`;
    } else {
        finalHTML = '<h3><svg class="tick-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Optimal Integer Solution</h3>';
        finalHTML += '<div class="final-solution">';
        for (let j = 0; j < numVars; j++) {
            finalHTML += `
                <div class="final-var">
                    <div class="var-name">x<sub>${j + 1}</sub></div>
                    <div class="var-value">${result.bestSolution[j]}</div>
                </div>
            `;
        }
        finalHTML += '</div>';
        finalHTML += `<div class="optimal-value">Z = ${result.bestZ}</div>`;
    }

    document.getElementById('finalResult').innerHTML = finalHTML;
}

function getLegendHTML() {
    return `
    <div class="legend-container" style="margin-top: 20px; padding: 15px; background: rgba(0,0,0,0.35); border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
        <h4 style="color: #a0aec0; margin-bottom: 12px; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px;">◈ Key / Legend</h4>
        <div style="display: flex; gap: 24px; flex-wrap: wrap; font-size: 0.85rem;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="width: 22px; height: 22px; background: rgba(129,178,154,0.25); border: 2px solid #81b29a; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #81b29a; font-size: 12px;">✓</span>
                <span style="color: #c9d1d9;">Integer Solution</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="width: 22px; height: 22px; background: rgba(107,138,173,0.2); border: 2px solid #6b8aad; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #6b8aad; font-size: 12px;">↓</span>
                <span style="color: #c9d1d9;">Branched Node</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="width: 22px; height: 22px; background: rgba(181,137,99,0.2); border: 2px solid #b58963; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #b58963; font-size: 12px;">✂</span>
                <span style="color: #c9d1d9;">Pruned Node</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="width: 22px; height: 22px; background: rgba(207,106,106,0.2); border: 2px solid #cf6a6a; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #cf6a6a; font-size: 12px;">✗</span>
                <span style="color: #c9d1d9;">Infeasible Node</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="width: 22px; height: 22px; background: rgba(175,130,196,0.2); border: 2px solid #af82c4; border-radius: 4px;"></span>
                <span style="color: #c9d1d9;">Fractional Value</span>
            </div>
        </div>
    </div>
    `;
}

document.addEventListener('DOMContentLoaded', function () {
    generateInputs();
});
