/**
 * =============================================================================
 * SIMPLEX METHOD SOLVER
 * =============================================================================
 * 
 * This module implements the Simplex algorithm for solving Linear Programming
 * problems. It supports:
 * - Maximization and Minimization objectives
 * - ≤, ≥, and = constraints using Big-M method
 * - Slack, Surplus, and Artificial variables
 * - Dual Simplex for infeasible solutions
 * - Sensitivity (What-If) analysis
 * 
 * ALGORITHM OVERVIEW:
 * 1. Convert problem to standard form (all ≤ constraints)
 * 2. Add slack/surplus/artificial variables as needed
 * 3. Build initial tableau with objective row (Z-row)
 * 4. Iterate: Find pivot column (most negative in Z-row)
 * 5. Find pivot row using minimum ratio test (RHS/pivot column)
 * 6. Perform pivot operation to update tableau
 * 7. Repeat until optimal (no negative values in Z-row)
 * 
 * =============================================================================
 */

let numVars = 0;
let numConstraints = 0;
let M = 1000000;  // Big-M constant for artificial variables

function generateInputs() {
    numVars = parseInt(document.getElementById('numVars').value);
    numConstraints = parseInt(document.getElementById('numConstraints').value);

    if (numVars < 1 || numVars > 10 || numConstraints < 1 || numConstraints > 10) {
        alert('Values must be between 1 and 10');
        return;
    }

    generateObjectiveInputs();
    generateConstraintInputs();
    document.getElementById('resultsCard').classList.add('hidden');
}

function generateObjectiveInputs() {
    let html = '';
    for (let j = 0; j < numVars; j++) {
        if (j > 0) html += '<span class="plus-sign">+</span>';
        html += `
            <div class="var-input">
                <input type="number" id="obj_${j}" value="${j === 0 ? 3 : 2}">
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
                    <input type="number" id="con_${i}_${j}" value="${Math.floor(Math.random() * 3) + 1}">
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
            <input type="number" id="rhs_${i}" value="${(i + 1) * 4}" class="rhs-input">
        `;
        html += '</div>';
    }
    document.getElementById('constraintsContainer').innerHTML = html;
}

function collectData() {
    const objType = document.getElementById('objectiveType').value;
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

    return { objType, objCoeffs, constraints };
}

/**
 * Build the initial Simplex tableau from problem data.
 * Handles constraint conversion (≤, ≥, =) and adds appropriate
 * slack, surplus, and artificial variables.
 * @param {Object} data - Problem data with objCoeffs, constraints, objType
 * @returns {Object} Initial tableau setup with variable tracking
 */
function buildTableau(data) {
    let { objType, objCoeffs, constraints } = data;
    const steps = [];
    const methodsUsed = [];

    let wasMinimization = false;
    if (objType === 'min') {
        wasMinimization = true;
        objCoeffs = objCoeffs.map(c => -c);
        methodsUsed.push({ type: 'converted', text: 'MIN → MAX' });
    }

    let slackCount = 0;
    let surplusCount = 0;
    let artificialCount = 0;

    for (let con of constraints) {
        if (con.type === '<=') slackCount++;
        else if (con.type === '>=') { surplusCount++; artificialCount++; }
        else if (con.type === '=') artificialCount++;
    }

    if (artificialCount > 0) {
        methodsUsed.push({ type: 'bigm', text: 'Big-M Method' });
    }

    const totalVars = numVars + slackCount + surplusCount + artificialCount;
    const varNames = [];

    for (let j = 0; j < numVars; j++) {
        varNames.push(`x${j + 1}`);
    }

    let slackIdx = 1, surplusIdx = 1, artificialIdx = 1;
    const artificialVarIndices = [];

    for (let con of constraints) {
        if (con.type === '<=') {
            varNames.push(`s${slackIdx++}`);
        } else if (con.type === '>=') {
            varNames.push(`e${surplusIdx++}`);
            varNames.push(`a${artificialIdx}`);
            artificialVarIndices.push(varNames.length - 1);
            artificialIdx++;
        } else if (con.type === '=') {
            varNames.push(`a${artificialIdx}`);
            artificialVarIndices.push(varNames.length - 1);
            artificialIdx++;
        }
    }

    const tableau = [];
    const basicVars = [];
    let varIndex = numVars;

    for (let i = 0; i < constraints.length; i++) {
        const con = constraints[i];
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
            basicVars.push(varIndex);
            varIndex++;
        } else if (con.type === '=') {
            row[varIndex] = 1;
            basicVars.push(varIndex);
            varIndex++;
        }

        row[totalVars] = con.rhs;

        tableau.push(row);
    }

    const zRow = new Array(totalVars + 1).fill(0);

    for (let j = 0; j < numVars; j++) {
        zRow[j] = -objCoeffs[j];
    }

    for (let artIdx of artificialVarIndices) {
        zRow[artIdx] = M;
    }

    for (let i = 0; i < basicVars.length; i++) {
        const basicVar = basicVars[i];
        if (artificialVarIndices.includes(basicVar)) {
            for (let j = 0; j <= totalVars; j++) {
                zRow[j] -= M * tableau[i][j];
            }
        }
    }

    return {
        tableau,
        zRow,
        varNames,
        basicVars,
        artificialVarIndices,
        methodsUsed,
        wasMinimization,
        totalVars
    };
}

/**
 * Check if current solution is optimal.
 * Optimal when all values in Z-row are non-negative (for maximization).
 * @param {Array} zRow - The objective function row
 * @param {number} totalVars - Total number of variables
 * @returns {boolean} True if optimal solution found
 */
function isOptimal(zRow, totalVars) {
    for (let j = 0; j < totalVars; j++) {
        if (zRow[j] < -1e-10) return false;
    }
    return true;
}

function hasNegativeRHS(tableau) {
    for (let row of tableau) {
        if (row[row.length - 1] < -1e-10) return true;
    }
    return false;
}

/**
 * Find the pivot column (entering variable).
 * Selects the column with the most negative value in Z-row.
 * This variable will enter the basis to improve the objective.
 * @param {Array} zRow - The objective function row
 * @param {number} totalVars - Total number of variables
 * @returns {number} Index of pivot column, or -1 if optimal
 */
function findPivotColumn(zRow, totalVars) {
    let minVal = 0;
    let pivotCol = -1;

    for (let j = 0; j < totalVars; j++) {
        if (zRow[j] < minVal) {
            minVal = zRow[j];
            pivotCol = j;
        }
    }

    return pivotCol;
}

/**
 * Find the pivot row (leaving variable) using Minimum Ratio Test.
 * For each row, calculates RHS / pivot column value.
 * Row with smallest positive ratio leaves the basis.
 * @param {Array} tableau - Current simplex tableau
 * @param {number} pivotCol - Index of entering variable column
 * @param {number} totalVars - Total number of variables
 * @returns {Object} Pivot row index and ratio values
 */
function findPivotRow(tableau, pivotCol, totalVars) {
    let minRatio = Infinity;
    let pivotRow = -1;
    const ratios = [];

    for (let i = 0; i < tableau.length; i++) {
        const rhs = tableau[i][totalVars];
        const coeff = tableau[i][pivotCol];

        if (coeff > 1e-10) {
            const ratio = rhs / coeff;
            ratios.push({ row: i, ratio: ratio });
            if (ratio >= 0 && ratio < minRatio) {
                minRatio = ratio;
                pivotRow = i;
            }
        } else {
            ratios.push({ row: i, ratio: null });
        }
    }

    return { pivotRow, ratios };
}

function findDualPivotRow(tableau, totalVars) {
    let minRHS = 0;
    let pivotRow = -1;

    for (let i = 0; i < tableau.length; i++) {
        const rhs = tableau[i][totalVars];
        if (rhs < minRHS) {
            minRHS = rhs;
            pivotRow = i;
        }
    }

    return pivotRow;
}

function findDualPivotCol(tableau, zRow, pivotRow, totalVars) {
    let minRatio = Infinity;
    let pivotCol = -1;

    for (let j = 0; j < totalVars; j++) {
        const aij = tableau[pivotRow][j];
        if (aij < -1e-10) {
            const ratio = Math.abs(zRow[j] / aij);
            if (ratio < minRatio) {
                minRatio = ratio;
                pivotCol = j;
            }
        }
    }

    return pivotCol;
}

/**
 * Perform pivot operation on the tableau.
 * Makes pivot element = 1 and all other elements in pivot column = 0
 * using elementary row operations.
 * @param {Array} tableau - Current simplex tableau
 * @param {Array} zRow - Objective function row
 * @param {number} pivotRow - Row index of leaving variable
 * @param {number} pivotCol - Column index of entering variable
 * @param {Array} basicVars - Current basic variable indices
 * @param {number} totalVars - Total number of variables
 */
function pivot(tableau, zRow, pivotRow, pivotCol, basicVars, totalVars) {
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

/**
 * Main solve function - executes the Simplex algorithm.
 * Handles both Primal and Dual Simplex methods.
 * Iterates until optimal solution or infeasibility detected.
 * @returns {void} Displays results in the UI
 */
function solve() {
    const data = collectData();
    const state = buildTableau(data);

    let { tableau, zRow, varNames, basicVars, artificialVarIndices, methodsUsed, wasMinimization, totalVars } = state;

    const steps = [];
    let iteration = 0;
    const maxIterations = 100;

    steps.push({
        type: 'initial',
        title: 'Initial Tableau',
        description: 'Tableau after adding slack, surplus, and artificial variables.',
        tableau: copyTableau(tableau),
        zRow: [...zRow],
        basicVars: [...basicVars],
        varNames: [...varNames]
    });

    let useDualSimplex = hasNegativeRHS(tableau);
    if (useDualSimplex) {
        methodsUsed.push({ type: 'dual', text: 'Dual Simplex' });
    } else {
        methodsUsed.push({ type: 'normal', text: 'Primal Simplex' });
    }

    while (iteration < maxIterations) {
        iteration++;

        if (useDualSimplex && hasNegativeRHS(tableau)) {
            const pivotRow = findDualPivotRow(tableau, totalVars);
            if (pivotRow === -1) {
                useDualSimplex = false;
                continue;
            }

            const pivotCol = findDualPivotCol(tableau, zRow, pivotRow, totalVars);
            if (pivotCol === -1) {
                steps.push({
                    type: 'infeasible',
                    title: 'Problem is Infeasible',
                    description: 'Dual Simplex cannot find a valid pivot column. No feasible solution exists.'
                });
                break;
            }

            steps.push({
                type: 'pivot',
                title: `Dual Simplex Iteration ${iteration}`,
                description: `Pivot Row: ${varNames[basicVars[pivotRow]]} (row ${pivotRow + 1}), Pivot Column: ${varNames[pivotCol]}`,
                tableau: copyTableau(tableau),
                zRow: [...zRow],
                basicVars: [...basicVars],
                varNames: [...varNames],
                pivotRow,
                pivotCol,
                pivotElement: tableau[pivotRow][pivotCol]
            });

            pivot(tableau, zRow, pivotRow, pivotCol, basicVars, totalVars);

        } else {
            if (isOptimal(zRow, totalVars)) {
                let hasArtificialInBasis = false;
                for (let i = 0; i < basicVars.length; i++) {
                    if (artificialVarIndices.includes(basicVars[i])) {
                        const val = tableau[i][totalVars];
                        if (Math.abs(val) > 1e-10) {
                            hasArtificialInBasis = true;
                            break;
                        }
                    }
                }

                if (hasArtificialInBasis) {
                    steps.push({
                        type: 'infeasible',
                        title: 'Problem is Infeasible',
                        description: 'Artificial variable(s) remain in the optimal basis with positive value.',
                        tableau: copyTableau(tableau),
                        zRow: [...zRow],
                        basicVars: [...basicVars],
                        varNames: [...varNames]
                    });
                } else {
                    steps.push({
                        type: 'optimal',
                        title: 'Optimal Solution Found',
                        description: 'All coefficients in Z row are non-negative.',
                        tableau: copyTableau(tableau),
                        zRow: [...zRow],
                        basicVars: [...basicVars],
                        varNames: [...varNames]
                    });
                }
                break;
            }

            const pivotCol = findPivotColumn(zRow, totalVars);
            if (pivotCol === -1) {
                steps.push({
                    type: 'optimal',
                    title: 'Optimal Solution Found',
                    description: 'No negative coefficient in Z row.',
                    tableau: copyTableau(tableau),
                    zRow: [...zRow],
                    basicVars: [...basicVars],
                    varNames: [...varNames]
                });
                break;
            }

            const { pivotRow, ratios } = findPivotRow(tableau, pivotCol, totalVars);
            if (pivotRow === -1) {
                steps.push({
                    type: 'unbounded',
                    title: 'Problem is Unbounded',
                    description: `No positive coefficient in pivot column ${varNames[pivotCol]}. Solution is unbounded.`,
                    tableau: copyTableau(tableau),
                    zRow: [...zRow],
                    basicVars: [...basicVars],
                    varNames: [...varNames]
                });
                break;
            }

            steps.push({
                type: 'pivot',
                title: `Iteration ${iteration}`,
                description: `Entering: ${varNames[pivotCol]}, Leaving: ${varNames[basicVars[pivotRow]]}`,
                tableau: copyTableau(tableau),
                zRow: [...zRow],
                basicVars: [...basicVars],
                varNames: [...varNames],
                pivotRow,
                pivotCol,
                pivotElement: tableau[pivotRow][pivotCol],
                ratios
            });

            pivot(tableau, zRow, pivotRow, pivotCol, basicVars, totalVars);
        }
    }

    const solution = extractSolution(tableau, basicVars, varNames, totalVars, numVars);
    const zValue = zRow[totalVars];
    const finalZ = wasMinimization ? -zValue : zValue;

    const sensitivity = performSensitivityAnalysis(tableau, zRow, basicVars, varNames, totalVars, numVars);

    storeSolutionData(data, tableau, zRow, basicVars, varNames, solution, finalZ);

    displayResults(steps, methodsUsed, solution, finalZ, wasMinimization, varNames, sensitivity);

    document.getElementById('resultsCard').classList.remove('hidden');

    const lastStep = steps[steps.length - 1];
    if (lastStep.type === 'optimal') {
        document.getElementById('whatIfSection').classList.remove('hidden');
        updateWhatIfInputs();
    } else {
        document.getElementById('whatIfSection').classList.add('hidden');
    }
}

function copyTableau(tableau) {
    return tableau.map(row => [...row]);
}

function extractSolution(tableau, basicVars, varNames, totalVars, numVars) {
    const solution = {};

    for (let j = 0; j < numVars; j++) {
        solution[`x${j + 1}`] = 0;
    }

    for (let i = 0; i < basicVars.length; i++) {
        const varIdx = basicVars[i];
        const varName = varNames[varIdx];
        if (varName.startsWith('x')) {
            solution[varName] = Math.round(tableau[i][totalVars] * 10000) / 10000;
        }
    }

    return solution;
}

function performSensitivityAnalysis(tableau, zRow, basicVars, varNames, totalVars, numVars) {
    const analysis = {
        reducedCosts: [],
        shadowPrices: []
    };

    for (let j = 0; j < totalVars; j++) {
        if (!basicVars.includes(j)) {
            analysis.reducedCosts.push({
                variable: varNames[j],
                value: Math.round(zRow[j] * 10000) / 10000
            });
        }
    }

    let slackIdx = 0;
    for (let j = numVars; j < totalVars; j++) {
        if (varNames[j].startsWith('s')) {
            slackIdx++;
            analysis.shadowPrices.push({
                constraint: `C${slackIdx}`,
                value: Math.round(-zRow[j] * 10000) / 10000
            });
        }
    }

    return analysis;
}

function displayResults(steps, methodsUsed, solution, finalZ, wasMinimization, varNames, sensitivity) {
    let methodHTML = '';
    for (let m of methodsUsed) {
        methodHTML += `<span class="method-badge ${m.type}">${m.text}</span>`;
    }
    document.getElementById('methodInfo').innerHTML = methodHTML;

    let stepsHTML = '';
    for (let step of steps) {
        const stepClass = step.type === 'optimal' ? 'optimal' :
            step.type === 'infeasible' ? 'infeasible' :
                step.type === 'pivot' ? 'pivot' : '';

        stepsHTML += `<div class="step-container ${stepClass}">`;
        stepsHTML += `<div class="step-title">${step.title}</div>`;
        stepsHTML += `<p style="color: rgba(255,255,255,0.7); margin-bottom: 10px;">${step.description}</p>`;

        if (step.tableau) {
            stepsHTML += tableauToHTML(step.tableau, step.zRow, step.basicVars, step.varNames,
                step.pivotRow, step.pivotCol, step.ratios);
        }

        if (step.pivotElement !== undefined) {
            stepsHTML += `<div class="pivot-info" style="margin-top: 12px; padding: 10px 15px; background: rgba(0,0,0,0.3); border-radius: 8px; border-left: 3px solid #6b8aad;">
                <span style="color: #6b8aad;">◉</span> <strong>Pivot Element:</strong> <code style="background: rgba(107,138,173,0.2); padding: 2px 8px; border-radius: 4px; color: #8fb3de;">${roundNum(step.pivotElement)}</code>
            </div>`;
        }

        stepsHTML += '</div>';
    }
    document.getElementById('stepsContainer').innerHTML = stepsHTML + getLegendHTML();

    let sensHTML = '';
    if (sensitivity.reducedCosts.length > 0 || sensitivity.shadowPrices.length > 0) {
        sensHTML = '<div class="sensitivity-section">';
        sensHTML += '<h3>Sensitivity Analysis</h3>';

        if (sensitivity.reducedCosts.length > 0) {
            sensHTML += '<h4 style="color: var(--accent-primary); margin: 10px 0;">Reduced Costs (Non-Basic Variables)</h4>';
            sensHTML += '<table class="sensitivity-table"><tr><th>Variable</th><th>Reduced Cost</th></tr>';
            for (let rc of sensitivity.reducedCosts) {
                sensHTML += `<tr><td>${rc.variable}</td><td>${rc.value}</td></tr>`;
            }
            sensHTML += '</table>';
        }

        if (sensitivity.shadowPrices.length > 0) {
            sensHTML += '<h4 style="color: var(--accent-primary); margin: 10px 0;">Shadow Prices (Dual Values)</h4>';
            sensHTML += '<table class="sensitivity-table"><tr><th>Constraint</th><th>Shadow Price</th></tr>';
            for (let sp of sensitivity.shadowPrices) {
                sensHTML += `<tr><td>${sp.constraint}</td><td>${sp.value}</td></tr>`;
            }
            sensHTML += '</table>';
        }

        sensHTML += '</div>';
    }
    document.getElementById('sensitivityContainer').innerHTML = sensHTML;
    document.getElementById('sensitivityContainer').classList.remove('hidden');

    const lastStep = steps[steps.length - 1];
    let finalHTML = '';

    if (lastStep.type === 'infeasible') {
        finalHTML = `<div class="final-result infeasible">
            <h3>❌ No Feasible Solution</h3>
            <p>The problem has no feasible solution.</p>
        </div>`;
    } else if (lastStep.type === 'unbounded') {
        finalHTML = `<div class="final-result unbounded">
            <h3>⚠️ Unbounded Solution</h3>
            <p>The objective function can increase indefinitely.</p>
        </div>`;
    } else {
        finalHTML = '<h3><svg class="tick-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Optimal Solution</h3>';
        finalHTML += '<div class="solution-values">';
        for (let key in solution) {
            finalHTML += `
                <div class="solution-var">
                    <div class="var-name">${key}</div>
                    <div class="var-value">${solution[key]}</div>
                </div>
            `;
        }
        finalHTML += '</div>';
        finalHTML += `<div class="optimal-value">Z${wasMinimization ? ' (min)' : ' (max)'} = ${roundNum(finalZ)}</div>`;
    }

    document.getElementById('finalResult').innerHTML = finalHTML;
}

function getLegendHTML() {
    return `
    <div class="legend-container" style="margin-top: 20px; padding: 15px; background: rgba(0,0,0,0.35); border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
        <h4 style="color: #a0aec0; margin-bottom: 12px; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px;">◈ Key / Legend</h4>
        <div style="display: flex; gap: 24px; flex-wrap: wrap; font-size: 0.85rem;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="width: 22px; height: 22px; background: rgba(212, 185, 78, 0.4); border: 2px solid #d4b94e; border-radius: 4px;"></span>
                <span style="color: #c9d1d9;">Pivot Element</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="width: 22px; height: 22px; background: rgba(107, 138, 173, 0.25); border: 2px solid #6b8aad; border-radius: 4px;"></span>
                <span style="color: #c9d1d9;">Pivot Row/Column</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="width: 22px; height: 22px; background: rgba(196, 122, 122, 0.25); border: 2px solid #c47a7a; border-radius: 4px;"></span>
                <span style="color: #c9d1d9;">Negative Value</span>
            </div>
        </div>
    </div>
    `;
}

function tableauToHTML(tableau, zRow, basicVars, varNames, pivotRow, pivotCol, ratios) {
    const totalVars = varNames.length;
    let html = '<div class="tableau-container"><table class="tableau">';

    html += '<tr><th>Basic</th>';
    for (let j = 0; j < totalVars; j++) {
        const isPivotCol = pivotCol === j;
        html += `<th class="${isPivotCol ? 'pivot-col' : ''}">${varNames[j]}</th>`;
    }
    html += '<th>RHS</th>';
    if (ratios) html += '<th>Ratio</th>';
    html += '</tr>';

    for (let i = 0; i < tableau.length; i++) {
        const isPivotRow = pivotRow === i;
        html += '<tr>';
        html += `<td class="basic-var">${varNames[basicVars[i]]}</td>`;

        for (let j = 0; j < totalVars; j++) {
            let cls = '';
            if (pivotRow === i && pivotCol === j) cls = 'pivot-element';
            else if (pivotRow === i) cls = 'pivot-row';
            else if (pivotCol === j) cls = 'pivot-col';

            html += `<td class="${cls}">${roundNum(tableau[i][j])}</td>`;
        }

        const rhs = tableau[i][totalVars];
        const rhsCls = rhs < 0 ? 'negative' : '';
        html += `<td class="${isPivotRow ? 'pivot-row' : ''} ${rhsCls}">${roundNum(rhs)}</td>`;

        if (ratios) {
            const ratioInfo = ratios.find(r => r.row === i);
            const ratioVal = ratioInfo && ratioInfo.ratio !== null ? roundNum(ratioInfo.ratio) : '-';
            html += `<td class="ratio">${ratioVal}</td>`;
        }

        html += '</tr>';
    }

    html += '<tr style="border-top: 2px solid rgba(102, 126, 234, 0.5);">';
    html += '<td class="basic-var">Z</td>';
    for (let j = 0; j < totalVars; j++) {
        const val = zRow[j];
        const cls = val < -1e-10 ? 'negative' : '';
        html += `<td class="${cls}">${roundNum(val)}</td>`;
    }
    html += `<td>${roundNum(zRow[totalVars])}</td>`;
    if (ratios) html += '<td></td>';
    html += '</tr>';

    html += '</table></div>';
    return html;
}

function roundNum(num) {
    if (Math.abs(num) < 1e-10) return 0;
    if (Math.abs(num) >= M / 2) return num > 0 ? 'M' : '-M';
    return Math.round(num * 10000) / 10000;
}

let lastSolveData = null;
let lastOptimalTableau = null;
let lastOptimalZRow = null;
let lastOptimalBasicVars = null;
let lastVarNames = null;
let lastSolution = null;
let lastFinalZ = null;

function storeSolutionData(data, tableau, zRow, basicVars, varNames, solution, finalZ) {
    lastSolveData = data;
    lastOptimalTableau = tableau;
    lastOptimalZRow = zRow;
    lastOptimalBasicVars = basicVars;
    lastVarNames = varNames;
    lastSolution = solution;
    lastFinalZ = finalZ;
}

function updateWhatIfInputs() {
    const type = document.querySelector('input[name="whatifType"]:checked').value;
    let html = '';

    if (type === 'changeC') {
        html = '<div class="whatif-input-group">';
        html += '<label>Select Variable:</label>';
        html += '<select id="whatifVar">';
        for (let j = 0; j < numVars; j++) {
            html += `<option value="${j}">x${j + 1}</option>`;
        }
        html += '</select>';
        html += '<label>New Value:</label>';
        html += '<input type="number" id="whatifValue" value="0">';
        html += '</div>';
    } else if (type === 'changeB') {
        html = '<div class="whatif-input-group">';
        html += '<label>Select Constraint:</label>';
        html += '<select id="whatifConstraint">';
        for (let i = 0; i < numConstraints; i++) {
            html += `<option value="${i}">C${i + 1}</option>`;
        }
        html += '</select>';
        html += '<label>New RHS Value:</label>';
        html += '<input type="number" id="whatifValue" value="0">';
        html += '</div>';
    } else if (type === 'addConstraint') {
        html = '<div class="whatif-input-group">';
        html += '<label>New Constraint Coefficients:</label>';
        html += '<div class="new-constraint-row">';
        for (let j = 0; j < numVars; j++) {
            if (j > 0) html += '<span class="plus-sign">+</span>';
            html += `<input type="number" id="newCon_${j}" value="1" class="coef-input">`;
            html += `<span class="var-label">x<sub>${j + 1}</sub></span>`;
        }
        html += '<select id="newConType"><option value="<=">≤</option><option value=">=">≥</option><option value="=">=</option></select>';
        html += '<input type="number" id="newConRHS" value="10" class="rhs-input">';
        html += '</div></div>';
    } else if (type === 'addVariable') {
        html = '<div class="whatif-input-group">';
        html += `<label>New Variable x${numVars + 1}:</label>`;
        html += '<div class="new-var-inputs">';
        html += '<div class="var-row"><span>Objective coefficient (c):</span><input type="number" id="newVarObj" value="1"></div>';
        for (let i = 0; i < numConstraints; i++) {
            html += `<div class="var-row"><span>Constraint C${i + 1} coefficient:</span><input type="number" id="newVarCon_${i}" value="1"></div>`;
        }
        html += '</div></div>';
    }

    document.getElementById('whatIfInputs').innerHTML = html;
    document.getElementById('whatIfResult').innerHTML = '';
}

function analyzeChange() {
    const type = document.querySelector('input[name="whatifType"]:checked').value;
    let resultHTML = '<div class="whatif-result-box">';

    if (type === 'changeC') {
        resultHTML += analyzeChangeCj();
    } else if (type === 'changeB') {
        resultHTML += analyzeChangeBi();
    } else if (type === 'addConstraint') {
        resultHTML += analyzeAddConstraint();
    } else if (type === 'addVariable') {
        resultHTML += analyzeAddVariable();
    }

    resultHTML += '</div>';
    document.getElementById('whatIfResult').innerHTML = resultHTML;
}

function analyzeChangeCj() {
    const varIdx = parseInt(document.getElementById('whatifVar').value);
    const newValue = parseFloat(document.getElementById('whatifValue').value) || 0;
    const originalValue = parseFloat(document.getElementById(`obj_${varIdx}`).value) || 0;
    const delta = newValue - originalValue;

    let html = `<h4>Changing c<sub>${varIdx + 1}</sub> from ${originalValue} to ${newValue} (Δ = ${delta})</h4>`;

    const isBasic = lastOptimalBasicVars.some(bv => bv === varIdx);

    if (isBasic) {
        html += '<p class="info">x<sub>' + (varIdx + 1) + '</sub> is a <strong>basic variable</strong>.</p>';
        html += '<p>For basic variables, changing c<sub>j</sub> affects the reduced costs of non-basic variables.</p>';

        let rowIdx = -1;
        for (let i = 0; i < lastOptimalBasicVars.length; i++) {
            if (lastOptimalBasicVars[i] === varIdx) {
                rowIdx = i;
                break;
            }
        }

        html += '<p>The reduced costs need to be recalculated. If any become negative, re-optimization is needed.</p>';
        html += '<p class="action">⚠️ <strong>Recommendation:</strong> Re-solve the problem with the new c<sub>j</sub> value.</p>';
    } else {
        html += '<p class="info">x<sub>' + (varIdx + 1) + '</sub> is a <strong>non-basic variable</strong>.</p>';
        const currentReducedCost = lastOptimalZRow[varIdx];
        const newReducedCost = currentReducedCost + delta;

        html += `<p>Current reduced cost: ${roundNum(currentReducedCost)}</p>`;
        html += `<p>New reduced cost: ${roundNum(currentReducedCost)} + ${delta} = ${roundNum(newReducedCost)}</p>`;

        if (newReducedCost >= -1e-10) {
            html += '<p class="success"><svg class="tick-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Current basis remains optimal. Z = ' + roundNum(lastFinalZ) + '</p>';
        } else {
            html += '<p class="warning">❌ Reduced cost becomes negative. x<sub>' + (varIdx + 1) + '</sub> should enter the basis.</p>';
            html += '<p class="action">⚠️ <strong>Re-optimization required.</strong></p>';
        }
    }

    return html;
}

function analyzeChangeBi() {
    const conIdx = parseInt(document.getElementById('whatifConstraint').value);
    const newValue = parseFloat(document.getElementById('whatifValue').value) || 0;
    const originalValue = parseFloat(document.getElementById(`rhs_${conIdx}`).value) || 0;
    const deltab = newValue - originalValue;

    let html = `<h4>Changing b<sub>${conIdx + 1}</sub> from ${originalValue} to ${newValue} (Δb = ${deltab})</h4>`;

    let slackVar = -1;
    let slackCount = 0;
    for (let i = 0; i <= conIdx; i++) {
        const conType = document.getElementById(`con_type_${i}`).value;
        if (conType === '<=') {
            if (i === conIdx) slackVar = numVars + slackCount;
            slackCount++;
        }
    }

    if (slackVar !== -1) {
        const shadowPrice = -lastOptimalZRow[slackVar];
        html += `<p>Shadow price for C${conIdx + 1}: <strong>${roundNum(shadowPrice)}</strong></p>`;

        const deltaZ = shadowPrice * deltab;
        const newZ = lastFinalZ + deltaZ;

        html += `<p>Change in Z: ${roundNum(shadowPrice)} × ${deltab} = ${roundNum(deltaZ)}</p>`;
        html += `<p>New optimal Z (if feasible): ${roundNum(lastFinalZ)} + ${roundNum(deltaZ)} = <strong>${roundNum(newZ)}</strong></p>`;

        html += '<div class="feasibility-check">';
        html += '<p><strong>Feasibility Check:</strong></p>';
        html += '<p>Need to verify that new RHS values remain non-negative after the change.</p>';
        html += '<p class="action">⚠️ Check that all constraints remain satisfied with the new b<sub>i</sub> value.</p>';
        html += '</div>';
    } else {
        html += '<p class="info">This constraint does not have a slack variable (≥ or = type).</p>';
        html += '<p class="action">⚠️ Re-solve the problem to determine the effect.</p>';
    }

    return html;
}

function analyzeAddConstraint() {
    let html = '<h4>Adding New Constraint</h4>';

    let coeffs = [];
    for (let j = 0; j < numVars; j++) {
        coeffs.push(parseFloat(document.getElementById(`newCon_${j}`).value) || 0);
    }
    const conType = document.getElementById('newConType').value;
    const rhs = parseFloat(document.getElementById('newConRHS').value) || 0;

    let constraintStr = coeffs.map((c, j) => `${c}x<sub>${j + 1}</sub>`).join(' + ');
    constraintStr += ` ${conType} ${rhs}`;

    html += `<p>New constraint: ${constraintStr}</p>`;

    let lhs = 0;
    for (let j = 0; j < numVars; j++) {
        const varVal = lastSolution[`x${j + 1}`] || 0;
        lhs += coeffs[j] * varVal;
    }

    html += `<p>Evaluating at current optimal solution:</p>`;
    html += `<p>LHS = ${coeffs.map((c, j) => `${c}(${lastSolution[`x${j + 1}`] || 0})`).join(' + ')} = ${roundNum(lhs)}</p>`;
    html += `<p>RHS = ${rhs}</p>`;

    let satisfied = false;
    if (conType === '<=' && lhs <= rhs + 1e-10) satisfied = true;
    if (conType === '>=' && lhs >= rhs - 1e-10) satisfied = true;
    if (conType === '=' && Math.abs(lhs - rhs) < 1e-10) satisfied = true;

    if (satisfied) {
        html += '<p class="success"><svg class="tick-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Current solution satisfies the new constraint!</p>';
        html += `<p>Optimal solution remains: Z = ${roundNum(lastFinalZ)}</p>`;
    } else {
        html += '<p class="warning">❌ Current solution violates the new constraint!</p>';
        html += '<p class="action">⚠️ <strong>Re-optimization required</strong> using Dual Simplex method.</p>';
    }

    return html;
}

function analyzeAddVariable() {
    const objCoef = parseFloat(document.getElementById('newVarObj').value) || 0;
    const conCoefs = [];
    for (let i = 0; i < numConstraints; i++) {
        conCoefs.push(parseFloat(document.getElementById(`newVarCon_${i}`).value) || 0);
    }

    let html = `<h4>Adding New Variable x<sub>${numVars + 1}</sub></h4>`;
    html += `<p>Objective coefficient: c<sub>${numVars + 1}</sub> = ${objCoef}</p>`;
    html += '<p>Constraint coefficients: [' + conCoefs.join(', ') + ']</p>';

    let reducedCost = objCoef;

    for (let i = 0; i < lastOptimalBasicVars.length; i++) {
        let slackVarIdx = -1;
        let slackCount = 0;
        for (let k = 0; k <= i; k++) {
            const conType = document.getElementById(`con_type_${k}`)?.value;
            if (conType === '<=') {
                if (k === i) slackVarIdx = numVars + slackCount;
                slackCount++;
            }
        }
        if (slackVarIdx !== -1) {
            const shadowPrice = -lastOptimalZRow[slackVarIdx];
            reducedCost -= shadowPrice * conCoefs[i];
        }
    }

    html += `<p>Calculated reduced cost for x<sub>${numVars + 1}</sub>: <strong>${roundNum(reducedCost)}</strong></p>`;

    if (reducedCost >= -1e-10) {
        html += '<p class="success"><svg class="tick-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Reduced cost ≥ 0. Current solution remains optimal.</p>';
        html += `<p>Z = ${roundNum(lastFinalZ)} (unchanged)</p>`;
    } else {
        html += '<p class="warning">❌ Reduced cost < 0. Variable x<sub>' + (numVars + 1) + '</sub> should enter the basis.</p>';
        html += '<p class="action">⚠️ <strong>Re-optimization required.</strong> The new variable can improve the solution.</p>';
    }

    return html;
}

document.addEventListener('DOMContentLoaded', function () {
    generateInputs();
});

