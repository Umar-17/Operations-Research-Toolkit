/**
 * =============================================================================
 * HUNGARIAN METHOD (KUHN-MUNKRES ALGORITHM)
 * =============================================================================
 * 
 * This module solves the Assignment Problem, which optimally assigns
 * workers to jobs (or rows to columns) to minimize/maximize total cost.
 * 
 * ALGORITHM STEPS:
 * 1. Balance matrix if rows ≠ columns (add dummy rows/columns with 0 cost)
 * 2. For maximization: convert to minimization (subtract from max value)
 * 3. Row Reduction: Subtract row minimum from each row
 * 4. Column Reduction: Subtract column minimum from each column
 * 5. Cover all zeros with minimum lines (rows + columns)
 * 6. If lines = n, optimal assignment exists in zeros
 * 7. If lines < n, modify matrix:
 *    - Subtract min uncovered from uncovered cells
 *    - Add min uncovered to doubly-covered cells
 * 8. Repeat steps 5-7 until optimal
 * 9. Assign workers to jobs using zeros (one per row/column)
 * 
 * COMPLEXITY: O(n³) - Polynomial time for assignment problems
 * 
 * =============================================================================
 */

let originalMatrix = [];
let matrix = [];
let n = 0;  // Matrix dimension (max of workers, jobs)
let originalWorkers = 0;
let originalJobs = 0;
let rowNames = [];
let colNames = [];

function generateMatrix() {
    originalWorkers = parseInt(document.getElementById('numWorkers').value);
    originalJobs = parseInt(document.getElementById('numJobs').value);

    if (originalWorkers < 1 || originalWorkers > 10 || originalJobs < 1 || originalJobs > 10) {
        alert('Please enter values between 1 and 10');
        return;
    }

    n = Math.max(originalWorkers, originalJobs);

    const warningDiv = document.getElementById('balanceWarning');
    const warningMsg = document.getElementById('balanceMessage');

    if (originalWorkers !== originalJobs) {
        warningDiv.classList.remove('hidden');
        if (originalWorkers < originalJobs) {
            warningMsg.innerHTML = `<strong>⚠️ Unbalanced:</strong> ${originalJobs - originalWorkers} dummy row(s) will be added.`;
        } else {
            warningMsg.innerHTML = `<strong>⚠️ Unbalanced:</strong> ${originalWorkers - originalJobs} dummy column(s) will be added.`;
        }
    } else {
        warningDiv.classList.add('hidden');
    }

    generateNameInputs();
    updateMatrixTable();
    document.getElementById('resultsCard').classList.add('hidden');
}

function generateNameInputs() {
    const namesSection = document.getElementById('namesSection');
    namesSection.classList.remove('hidden');

    let rowHTML = '';
    for (let i = 0; i < n; i++) {
        const isDummy = i >= originalWorkers;
        const defaultName = isDummy ? `Dummy R${i + 1}` : `R${i + 1}`;
        const inputClass = isDummy ? 'dummy-name' : '';
        const readonly = isDummy ? 'readonly' : '';
        rowHTML += `<input type="text" id="rowName_${i}" value="${defaultName}" class="${inputClass}" ${readonly} onchange="updateMatrixTable()">`;
    }
    document.getElementById('rowNamesContainer').innerHTML = rowHTML;

    let colHTML = '';
    for (let j = 0; j < n; j++) {
        const isDummy = j >= originalJobs;
        const defaultName = isDummy ? `Dummy C${j + 1}` : `C${j + 1}`;
        const inputClass = isDummy ? 'dummy-name' : '';
        const readonly = isDummy ? 'readonly' : '';
        colHTML += `<input type="text" id="colName_${j}" value="${defaultName}" class="${inputClass}" ${readonly} onchange="updateMatrixTable()">`;
    }
    document.getElementById('colNamesContainer').innerHTML = colHTML;
}

function getNames() {
    rowNames = [];
    colNames = [];

    for (let i = 0; i < n; i++) {
        rowNames.push(document.getElementById(`rowName_${i}`).value || `R${i + 1}`);
    }

    for (let j = 0; j < n; j++) {
        colNames.push(document.getElementById(`colName_${j}`).value || `C${j + 1}`);
    }
}

function updateMatrixTable() {
    getNames();

    let savedValues = [];
    for (let i = 0; i < n; i++) {
        savedValues[i] = [];
        for (let j = 0; j < n; j++) {
            const cell = document.getElementById(`cell_${i}_${j}`);
            savedValues[i][j] = cell ? cell.value : '0';
        }
    }

    let html = '<table>';

    html += '<tr><th></th>';
    for (let j = 0; j < n; j++) {
        const isDummy = j >= originalJobs;
        const thClass = isDummy ? 'dummy' : '';
        html += `<th class="${thClass}">${colNames[j]}</th>`;
    }
    html += '</tr>';

    for (let i = 0; i < n; i++) {
        const isRowDummy = i >= originalWorkers;
        const rowClass = isRowDummy ? 'row-header dummy' : 'row-header';
        html += `<tr><td class="${rowClass}">${rowNames[i]}</td>`;

        for (let j = 0; j < n; j++) {
            const isDummy = (i >= originalWorkers || j >= originalJobs);
            const cellClass = isDummy ? 'dummy-cell' : '';
            const cellValue = isDummy ? '0' : (savedValues[i] && savedValues[i][j] ? savedValues[i][j] : '0');
            const readonly = isDummy ? 'readonly' : '';
            html += `<td><input type="number" id="cell_${i}_${j}" value="${cellValue}" class="${cellClass}" ${readonly}></td>`;
        }
        html += '</tr>';
    }
    html += '</table>';

    document.getElementById('matrixInput').innerHTML = html;
}

function getMatrix() {
    let mat = [];
    for (let i = 0; i < n; i++) {
        mat[i] = [];
        for (let j = 0; j < n; j++) {
            mat[i][j] = parseFloat(document.getElementById(`cell_${i}_${j}`).value) || 0;
        }
    }
    return mat;
}

function copyMatrix(mat) {
    return mat.map(row => [...row]);
}

function matrixToHTML(mat, highlights = {}) {
    let html = '<table>';

    html += '<tr><th></th>';
    for (let j = 0; j < n; j++) {
        const isDummy = j >= originalJobs;
        const thClass = isDummy ? 'dummy' : '';
        html += `<th class="${thClass}">${colNames[j]}</th>`;
    }
    html += '</tr>';

    for (let i = 0; i < mat.length; i++) {
        html += '<tr>';

        const isRowDummy = i >= originalWorkers;
        const rowClass = isRowDummy ? 'row-header dummy' : 'row-header';
        html += `<td class="${rowClass}">${rowNames[i]}</td>`;

        for (let j = 0; j < mat[i].length; j++) {
            let cellClass = '';
            const isDummy = (i >= originalWorkers || j >= originalJobs);

            if (highlights.assigned && highlights.assigned.some(a => a[0] === i && a[1] === j)) {
                cellClass = 'assigned';
            } else if (isDummy) {
                cellClass = 'dummy';
            } else if (highlights.zeros && mat[i][j] === 0) {
                cellClass = 'zero';
            } else if (highlights.covered && (highlights.coveredRows?.includes(i) || highlights.coveredCols?.includes(j))) {
                cellClass = 'covered';
            }
            html += `<td class="${cellClass}">${mat[i][j]}</td>`;
        }
        html += '</tr>';
    }
    html += '</table>';
    return html;
}

/**
 * Main solve function - executes the Hungarian Algorithm.
 * Handles both minimization and maximization problems.
 * Iteratively reduces matrix and finds optimal assignment.
 * @returns {void} Displays results in the UI
 */
function solve() {
    getNames();
    originalMatrix = getMatrix();
    matrix = copyMatrix(originalMatrix);
    const isMax = document.querySelector('input[name="problemType"]:checked').value === 'max';

    let steps = [];
    let workMatrix = copyMatrix(matrix);

    let step0Desc = isMax ? 'Maximization problem.' : 'Minimization problem.';
    if (originalWorkers !== originalJobs) {
        step0Desc += ` Added ${Math.abs(originalWorkers - originalJobs)} dummy ${originalWorkers < originalJobs ? 'row(s)' : 'column(s)'} with zero cost.`;
    }
    steps.push({
        title: 'Step 0: Original Matrix',
        description: step0Desc,
        matrix: copyMatrix(workMatrix)
    });

    if (isMax) {
        let maxVal = Math.max(...workMatrix.flat());
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                workMatrix[i][j] = maxVal - workMatrix[i][j];
            }
        }
        steps.push({
            title: 'Step 1: Convert to Minimization',
            description: `Subtract each element from the maximum value (${maxVal}).`,
            matrix: copyMatrix(workMatrix)
        });
    }

    for (let i = 0; i < n; i++) {
        let minVal = Math.min(...workMatrix[i]);
        for (let j = 0; j < n; j++) {
            workMatrix[i][j] -= minVal;
        }
    }
    steps.push({
        title: isMax ? 'Step 2: Row Reduction' : 'Step 1: Row Reduction',
        description: 'Subtract minimum of each row from all elements in that row.',
        matrix: copyMatrix(workMatrix),
        highlights: { zeros: true }
    });

    for (let j = 0; j < n; j++) {
        let minVal = Infinity;
        for (let i = 0; i < n; i++) {
            minVal = Math.min(minVal, workMatrix[i][j]);
        }
        for (let i = 0; i < n; i++) {
            workMatrix[i][j] -= minVal;
        }
    }
    steps.push({
        title: isMax ? 'Step 3: Column Reduction' : 'Step 2: Column Reduction',
        description: 'Subtract minimum of each column from all elements in that column.',
        matrix: copyMatrix(workMatrix),
        highlights: { zeros: true }
    });

    let iteration = 0;
    let maxIterations = 100;
    let assignment = null;

    while (iteration < maxIterations) {
        iteration++;

        let result = findOptimalAssignment(workMatrix);

        if (result.complete) {
            assignment = result.assignment;
            steps.push({
                title: `Optimal Assignment Found`,
                description: 'All assignments completed optimally.',
                matrix: copyMatrix(workMatrix),
                highlights: { assigned: assignment }
            });
            break;
        }

        let { coveredRows, coveredCols, minUncovered } = findMinimumCover(workMatrix);
        let totalLines = coveredRows.length + coveredCols.length;

        steps.push({
            title: `Iteration ${iteration}: Cover Zeros`,
            description: `Lines: ${totalLines}, Required: ${n}. ` +
                (totalLines < n ? `Min uncovered: ${minUncovered}` : 'Optimal found!'),
            matrix: copyMatrix(workMatrix),
            highlights: { zeros: true, covered: true, coveredRows, coveredCols }
        });

        if (totalLines >= n) {
            let finalResult = findOptimalAssignment(workMatrix);
            assignment = finalResult.assignment;
            if (assignment.length === n) {
                steps.push({
                    title: `Optimal Assignment Found`,
                    description: 'All assignments completed optimally.',
                    matrix: copyMatrix(workMatrix),
                    highlights: { assigned: assignment }
                });
            }
            break;
        }

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (!coveredRows.includes(i) && !coveredCols.includes(j)) {
                    workMatrix[i][j] -= minUncovered;
                } else if (coveredRows.includes(i) && coveredCols.includes(j)) {
                    workMatrix[i][j] += minUncovered;
                }
            }
        }

        steps.push({
            title: `Iteration ${iteration}: Matrix Modification`,
            description: `Subtracted ${minUncovered} from uncovered, added to intersections.`,
            matrix: copyMatrix(workMatrix),
            highlights: { zeros: true }
        });
    }

    displaySteps(steps);

    if (assignment && assignment.length === n) {
        displayFinalResult(assignment, isMax);
    } else {
        document.getElementById('finalResult').innerHTML = '<h3 style="color: #ff6b6b;">Could not find optimal solution</h3>';
    }

    document.getElementById('resultsCard').classList.remove('hidden');
}

/**
 * Find optimal assignment using zeros in the reduced matrix.
 * Uses backtracking to find n assignments where each row/column
 * has exactly one assignment at a zero position.
 * @param {Array} mat - Reduced cost matrix
 * @returns {Object} { complete: boolean, assignment: [[row,col],...] }
 */
function findOptimalAssignment(mat) {
    let n = mat.length;
    let assignment = [];
    let usedCols = new Set();

    function backtrack(row) {
        if (row === n) return true;

        let zeros = [];
        for (let j = 0; j < n; j++) {
            if (mat[row][j] === 0 && !usedCols.has(j)) {
                zeros.push(j);
            }
        }

        for (let col of zeros) {
            usedCols.add(col);
            assignment.push([row, col]);
            if (backtrack(row + 1)) return true;
            usedCols.delete(col);
            assignment.pop();
        }

        return false;
    }

    let complete = backtrack(0);
    return { complete, assignment };
}

/**
 * Find minimum cover of zeros using horizontal/vertical lines.
 * Greedily selects rows/columns that cover the most uncovered zeros.
 * Also finds minimum value among uncovered cells for matrix modification.
 * @param {Array} mat - Current reduced matrix
 * @returns {Object} { coveredRows, coveredCols, minUncovered }
 */
function findMinimumCover(mat) {
    let n = mat.length;
    let coveredRows = [];
    let coveredCols = [];
    let zeroPositions = [];

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (mat[i][j] === 0) {
                zeroPositions.push([i, j]);
            }
        }
    }

    let uncoveredZeros = [...zeroPositions];

    while (uncoveredZeros.length > 0) {
        let bestRow = -1, bestRowCount = 0;
        let bestCol = -1, bestColCount = 0;

        for (let i = 0; i < n; i++) {
            if (!coveredRows.includes(i)) {
                let count = uncoveredZeros.filter(z => z[0] === i).length;
                if (count > bestRowCount) {
                    bestRowCount = count;
                    bestRow = i;
                }
            }
        }

        for (let j = 0; j < n; j++) {
            if (!coveredCols.includes(j)) {
                let count = uncoveredZeros.filter(z => z[1] === j).length;
                if (count > bestColCount) {
                    bestColCount = count;
                    bestCol = j;
                }
            }
        }

        if (bestColCount >= bestRowCount && bestCol !== -1) {
            coveredCols.push(bestCol);
            uncoveredZeros = uncoveredZeros.filter(z => z[1] !== bestCol);
        } else if (bestRow !== -1) {
            coveredRows.push(bestRow);
            uncoveredZeros = uncoveredZeros.filter(z => z[0] !== bestRow);
        } else {
            break;
        }
    }

    let minUncovered = Infinity;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (!coveredRows.includes(i) && !coveredCols.includes(j)) {
                minUncovered = Math.min(minUncovered, mat[i][j]);
            }
        }
    }

    return { coveredRows, coveredCols, minUncovered };
}

function displaySteps(steps) {
    let html = '';
    for (let step of steps) {
        html += `
            <div class="step-container">
                <div class="step-title">${step.title}</div>
                <p style="color: #8892b0; margin-bottom: 10px;">${step.description}</p>
                <div class="step-matrix">
                    ${matrixToHTML(step.matrix, step.highlights || {})}
                </div>
            </div>
        `;
    }
    document.getElementById('stepsContainer').innerHTML = html + getLegendHTML();
}

function getLegendHTML() {
    return `
    <div class="legend-container" style="margin-top: 20px; padding: 15px; background: rgba(0,0,0,0.35); border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
        <h4 style="color: #a0aec0; margin-bottom: 12px; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px;">◈ Key / Legend</h4>
        <div style="display: flex; gap: 24px; flex-wrap: wrap; font-size: 0.85rem;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="width: 22px; height: 22px; background: rgba(129, 178, 154, 0.35); border: 2px solid #81b29a; border-radius: 4px;"></span>
                <span style="color: #c9d1d9;">Assigned Cell</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="width: 22px; height: 22px; background: rgba(230, 200, 100, 0.25); border: 2px solid #d4b94e; border-radius: 4px;"></span>
                <span style="color: #c9d1d9;">Covered</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="width: 22px; height: 22px; background: rgba(107, 138, 173, 0.25); border: 2px solid #6b8aad; border-radius: 4px;"></span>
                <span style="color: #c9d1d9;">Zero Cell</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="width: 22px; height: 22px; background: rgba(200, 200, 200, 0.2); border: 2px solid #c0c0c0; border-radius: 4px;"></span>
                <span style="color: #c9d1d9;">Dummy</span>
            </div>
        </div>
    </div>
    `;
}

function displayFinalResult(assignment, isMax) {
    let totalCost = 0;
    let realAssignments = [];
    let dummyAssignments = [];

    for (let [i, j] of assignment) {
        const isDummy = (i >= originalWorkers || j >= originalJobs);
        const cost = originalMatrix[i][j];

        if (isDummy) {
            dummyAssignments.push({ row: rowNames[i], col: colNames[j], cost, i, j });
        } else {
            realAssignments.push({ row: rowNames[i], col: colNames[j], cost, i, j });
            totalCost += cost;
        }
    }

    let assignmentHTML = '<ul class="assignment-list">';

    for (let a of realAssignments) {
        assignmentHTML += `<li>${a.row} → ${a.col} (${a.cost})</li>`;
    }

    for (let a of dummyAssignments) {
        assignmentHTML += `<li class="dummy-assignment">${a.row} → ${a.col} (dummy)</li>`;
    }

    assignmentHTML += '</ul>';

    let dummyNote = '';
    if (dummyAssignments.length > 0) {
        dummyNote = `<p style="color: #8892b0; margin-top: 10px; font-size: 0.9rem;">
            <em>${dummyAssignments.length} dummy assignment(s) excluded from total.</em>
        </p>`;
    }

    document.getElementById('finalResult').innerHTML = `
        <h3><svg class="tick-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Optimal Assignment</h3>
        ${assignmentHTML}
        <div class="total-cost">
            Total ${isMax ? 'Profit' : 'Cost'}: ${totalCost}
        </div>
        ${dummyNote}
    `;
}

document.addEventListener('DOMContentLoaded', function () {
    generateMatrix();
});
