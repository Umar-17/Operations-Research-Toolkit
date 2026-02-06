/**
 * =============================================================================
 * KNAPSACK PROBLEM SOLVER (DYNAMIC PROGRAMMING)
 * =============================================================================
 * 
 * This module solves the Knapsack Problem using Dynamic Programming.
 * Supports three variants:
 * 
 * 1. 0/1 KNAPSACK:
 *    - Each item can be taken at most once
 *    - Recurrence: dp[i][w] = max(dp[i-1][w], dp[i-1][w-w_i] + v_i)
 * 
 * 2. UNBOUNDED KNAPSACK:
 *    - Each item can be taken unlimited times
 *    - Recurrence: dp[w] = max over all i where w_i <= w of (dp[w-w_i] + v_i)
 * 
 * 3. BOUNDED KNAPSACK:
 *    - Each item has a maximum quantity limit
 *    - Solved by expanding items into copies and using 0/1 approach
 * 
 * ALGORITHM FLOW:
 * 1. Build DP table iteratively (bottom-up)
 * 2. Backtrack from dp[n][W] to find selected items
 * 3. Visualize table filling and backtracking steps
 * 
 * COMPLEXITY: O(n × W) pseudo-polynomial time
 * 
 * =============================================================================
 */

let items = [];  // Array of { name, weight, value, maxQty? }
let n = 0;  // Number of items
let W = 0;  // Knapsack capacity
let knapsackType = '01';  // '01', 'unbounded', or 'bounded'

function getKnapsackType() {
    return document.querySelector('input[name="knapsackType"]:checked').value;
}

function updateInputs() {
    knapsackType = getKnapsackType();
    generateInputs();
}

function generateInputs() {
    n = parseInt(document.getElementById('numItems').value);
    W = parseInt(document.getElementById('capacity').value);
    knapsackType = getKnapsackType();

    if (n < 1 || n > 10) {
        alert('Number of items must be between 1 and 10');
        return;
    }

    if (W < 1 || W > 50) {
        alert('Capacity must be between 1 and 50');
        return;
    }

    let html = '<table class="items-table">';

    if (knapsackType === 'bounded') {
        html += '<tr><th>Item</th><th>Name</th><th>Weight (w)</th><th>Value (v)</th><th>Max Qty</th></tr>';
    } else {
        html += '<tr><th>Item</th><th>Name</th><th>Weight (w)</th><th>Value/Profit (v)</th></tr>';
    }

    for (let i = 0; i < n; i++) {
        html += `
            <tr>
                <td><span class="item-number">${i + 1}</span></td>
                <td><input type="text" id="name_${i}" value="Item ${i + 1}" class="name-input"></td>
                <td><input type="number" id="weight_${i}" value="${i + 2}" min="1"></td>
                <td><input type="number" id="value_${i}" value="${(i + 1) * 3}" min="0"></td>
        `;

        if (knapsackType === 'bounded') {
            html += `<td><input type="number" id="qty_${i}" value="2" min="1" class="qty-input"></td>`;
        }

        html += '</tr>';
    }

    html += '</table>';
    document.getElementById('itemsContainer').innerHTML = html;
    document.getElementById('resultsCard').classList.add('hidden');
}

function getData() {
    items = [];
    for (let i = 0; i < n; i++) {
        const weightVal = document.getElementById(`weight_${i}`).value.trim();
        const valueVal = document.getElementById(`value_${i}`).value.trim();

        const item = {
            index: i + 1,
            name: document.getElementById(`name_${i}`).value || `Item ${i + 1}`,
            weight: parseFloat(weightVal) || 0,
            value: parseFloat(valueVal) || 0
        };

        if (knapsackType === 'bounded') {
            item.maxQty = parseInt(document.getElementById(`qty_${i}`).value) || 1;
        }

        items.push(item);
    }
    W = parseFloat(document.getElementById('capacity').value) || 10;
}

/**
 * Solve 0/1 Knapsack using 2D DP table.
 * Each item can only be included once.
 * @returns {Object} { steps, dp, selectedItems, backtrackSteps, formula }
 */
function solve01Knapsack() {
    const dp = [];
    for (let i = 0; i <= n; i++) {
        dp[i] = new Array(W + 1).fill(0);
    }

    const steps = [];

    steps.push({
        title: 'Initialization',
        description: 'Create DP table with all zeros. dp[0][w] = 0 for all w (no items available).',
        table: dp.map(row => [...row]),
        currentRow: 0
    });

    for (let i = 1; i <= n; i++) {
        const item = items[i - 1];

        for (let w = 0; w <= W; w++) {
            if (item.weight > w) {
                dp[i][w] = dp[i - 1][w];
            } else {
                dp[i][w] = Math.max(
                    dp[i - 1][w],
                    dp[i - 1][w - item.weight] + item.value
                );
            }
        }

        steps.push({
            title: `Row ${i}: Consider ${item.name}`,
            description: `Item ${i}: weight = ${item.weight}, value = ${item.value}. dp[${i}][w] = max(dp[${i - 1}][w], dp[${i - 1}][w-${item.weight}] + ${item.value})`,
            table: dp.map(row => [...row]),
            currentRow: i,
            item: item
        });
    }

    const selectedItems = [];
    let remainingCapacity = W;
    const backtrackSteps = [];

    for (let i = n; i > 0 && remainingCapacity > 0; i--) {
        if (dp[i][remainingCapacity] !== dp[i - 1][remainingCapacity]) {
            const item = items[i - 1];
            selectedItems.push({ ...item, count: 1 });
            backtrackSteps.push({
                i: i,
                w: remainingCapacity,
                included: true,
                item: item,
                reason: `dp[${i}][${remainingCapacity}] = ${dp[i][remainingCapacity]} ≠ dp[${i - 1}][${remainingCapacity}] = ${dp[i - 1][remainingCapacity]}, so ${item.name} is included.`
            });
            remainingCapacity -= item.weight;
        } else {
            backtrackSteps.push({
                i: i,
                w: remainingCapacity,
                included: false,
                item: items[i - 1],
                reason: `dp[${i}][${remainingCapacity}] = dp[${i - 1}][${remainingCapacity}] = ${dp[i][remainingCapacity]}, so ${items[i - 1].name} is NOT included.`
            });
        }
    }

    const selectionPath = backtrackSteps.map(bt => ({ i: bt.i, w: bt.w, included: bt.included }));

    return { steps, dp, selectedItems, backtrackSteps, selectionPath, formula: 'dp[i][w] = max(dp[i-1][w], dp[i-1][w-wᵢ] + vᵢ)' };
}

/**
 * Solve Unbounded Knapsack using 1D DP array.
 * Each item can be included unlimited times.
 * @returns {Object} { steps, dp, selectedItems, backtrackSteps, formula }
 */
function solveUnboundedKnapsack() {
    const dp = new Array(W + 1).fill(0);
    const choice = new Array(W + 1).fill(-1);
    const steps = [];

    steps.push({
        title: 'Initialization',
        description: 'Create 1D DP array. dp[w] = max value with capacity w. All zeros initially.',
        table: [[...dp]],
        currentRow: 0
    });

    for (let w = 1; w <= W; w++) {
        for (let i = 0; i < n; i++) {
            const item = items[i];
            if (item.weight <= w && dp[w - item.weight] + item.value > dp[w]) {
                dp[w] = dp[w - item.weight] + item.value;
                choice[w] = i;
            }
        }
    }

    steps.push({
        title: 'DP Table After Processing',
        description: 'For each capacity w, dp[w] = max over all items i where wᵢ ≤ w of (dp[w-wᵢ] + vᵢ)',
        table: [[...dp]],
        currentRow: 0
    });

    const selectedItems = [];
    const itemCounts = {};
    let remainingCapacity = W;
    const backtrackSteps = [];

    while (remainingCapacity > 0 && choice[remainingCapacity] !== -1) {
        const itemIdx = choice[remainingCapacity];
        const item = items[itemIdx];

        if (!itemCounts[itemIdx]) {
            itemCounts[itemIdx] = 0;
        }
        itemCounts[itemIdx]++;

        backtrackSteps.push({
            w: remainingCapacity,
            included: true,
            item: item,
            reason: `At capacity ${remainingCapacity}, chose ${item.name} (w=${item.weight}, v=${item.value}). Remaining: ${remainingCapacity - item.weight}`
        });

        remainingCapacity -= item.weight;
    }

    for (let idx in itemCounts) {
        selectedItems.push({ ...items[idx], count: itemCounts[idx] });
    }

    return { steps, dp: [dp], selectedItems, backtrackSteps, formula: 'dp[w] = max over all i where wᵢ ≤ w of (dp[w-wᵢ] + vᵢ)', isUnbounded: true };
}

/**
 * Solve Bounded Knapsack by expanding items into copies.
 * Converts to 0/1 problem by treating each copy as separate item.
 * @returns {Object} { steps, dp, selectedItems, backtrackSteps, formula }
 */
function solveBoundedKnapsack() {
    const expandedItems = [];
    for (let i = 0; i < n; i++) {
        const item = items[i];
        for (let k = 0; k < item.maxQty; k++) {
            expandedItems.push({
                ...item,
                originalIndex: i,
                copyNum: k + 1
            });
        }
    }

    const m = expandedItems.length;
    const dp = [];
    for (let i = 0; i <= m; i++) {
        dp[i] = new Array(W + 1).fill(0);
    }

    const steps = [];

    steps.push({
        title: 'Expand Items by Quantity',
        description: `Expanded ${n} items into ${m} item copies based on max quantities. Will solve as 0/1 Knapsack.`,
        table: dp.map(row => [...row]),
        currentRow: 0
    });

    for (let i = 1; i <= m; i++) {
        const item = expandedItems[i - 1];

        for (let w = 0; w <= W; w++) {
            if (item.weight > w) {
                dp[i][w] = dp[i - 1][w];
            } else {
                dp[i][w] = Math.max(
                    dp[i - 1][w],
                    dp[i - 1][w - item.weight] + item.value
                );
            }
        }
    }

    steps.push({
        title: 'Final DP Table',
        description: `Processed all ${m} item copies. Optimal value = ${dp[m][W]}`,
        table: dp.map(row => [...row]),
        currentRow: m
    });

    const itemCounts = {};
    let remainingCapacity = W;
    const backtrackSteps = [];

    for (let i = m; i > 0 && remainingCapacity > 0; i--) {
        if (dp[i][remainingCapacity] !== dp[i - 1][remainingCapacity]) {
            const item = expandedItems[i - 1];
            const origIdx = item.originalIndex;

            if (!itemCounts[origIdx]) {
                itemCounts[origIdx] = 0;
            }
            itemCounts[origIdx]++;

            backtrackSteps.push({
                included: true,
                item: item,
                reason: `Selected ${item.name} (copy ${item.copyNum}), weight=${item.weight}, value=${item.value}`
            });

            remainingCapacity -= item.weight;
        }
    }

    const selectedItems = [];
    for (let idx in itemCounts) {
        selectedItems.push({ ...items[idx], count: itemCounts[idx] });
    }

    return { steps, dp, selectedItems, backtrackSteps, formula: 'Expanded to 0/1 Knapsack with item copies', isBounded: true };
}

/**
 * Main solve function - executes the appropriate Knapsack algorithm.
 * Routes to 0/1, unbounded, or bounded solver based on user selection.
 * @returns {void} Displays step-by-step DP table and results
 */
function solve() {
    getData();
    knapsackType = getKnapsackType();

    let result;

    if (knapsackType === '01') {
        result = solve01Knapsack();
    } else if (knapsackType === 'unbounded') {
        result = solveUnboundedKnapsack();
    } else {
        result = solveBoundedKnapsack();
    }

    displayResults(result);
    document.getElementById('resultsCard').classList.remove('hidden');
}

function tableToHTML(table, currentRow = -1, selectionPath = null, showOptimal = false) {
    let html = '<div class="dp-table-container"><table class="dp-table">';

    const getSelectionClass = (row, col) => {
        if (!selectionPath) return '';
        const cell = selectionPath.find(s => s.i === row && s.w === col);
        if (cell) {
            return cell.included ? 'cell-selected' : 'cell-not-selected';
        }
        return '';
    };

    if (table.length === 1) {
        html += '<tr><th>W</th>';
        for (let w = 0; w < table[0].length; w++) {
            html += `<th>${w}</th>`;
        }
        html += '</tr>';

        html += '<tr><td class="row-header">dp[w]</td>';
        for (let w = 0; w < table[0].length; w++) {
            const isOptimal = showOptimal && w === table[0].length - 1;
            const cls = isOptimal ? 'optimal-value' : '';
            html += `<td class="${cls}">${table[0][w]}</td>`;
        }
        html += '</tr>';
    } else {
        html += '<tr><th>Item \\ W</th>';
        for (let w = 0; w <= W; w++) {
            html += `<th>${w}</th>`;
        }
        html += '</tr>';

        const rowsToShow = Math.min(table.length, n + 1);
        for (let i = 0; i < rowsToShow; i++) {
            html += '<tr>';

            if (i === 0) {
                html += '<td class="row-header">0 (none)</td>';
            } else {
                html += `<td class="row-header">${i} (${items[i - 1].name})</td>`;
            }

            for (let w = 0; w <= W; w++) {
                let cls = getSelectionClass(i, w);
                if (i === currentRow) cls += ' current-row';
                const isOptimal = showOptimal && i === rowsToShow - 1 && w === W;
                if (isOptimal) cls += ' optimal-value';
                html += `<td class="${cls.trim()}">${table[i][w]}</td>`;
            }
            html += '</tr>';
        }
    }

    html += '</table></div>';
    return html;
}

function displayResults(result) {
    let stepsHTML = '';
    const typeNames = { '01': '0/1', 'bounded': 'Bounded', 'unbounded': 'Unbounded' };

    stepsHTML += `
        <div class="step-container">
            <div class="step-title">${typeNames[knapsackType]} Knapsack - Recurrence</div>
            <div class="formula-box">
                <p><code>${result.formula}</code></p>
            </div>
        </div>
    `;

    for (let step of result.steps) {
        stepsHTML += `
            <div class="step-container">
                <div class="step-title">${step.title}</div>
                <p style="color: rgba(255,255,255,0.7); margin-bottom: 10px;">${step.description}</p>
                ${tableToHTML(step.table, step.currentRow)}
            </div>
        `;
    }

    if (result.backtrackSteps && result.backtrackSteps.length > 0) {
        stepsHTML += `
            <div class="step-container" style="border-left-color: #81b29a;">
                <div class="step-title" style="color: #81b29a;">↩ Backtracking: Find Selected Items</div>
        `;

        for (let bt of result.backtrackSteps) {
            const color = bt.included ? '#4a90e2' : '#c47a7a';
            const symbol = bt.included ? '✔' : '✖';
            stepsHTML += `<div class="backtrack-step" style="border-left: 3px solid ${color}; padding: 8px 12px; margin: 6px 0; background: rgba(0,0,0,0.2); border-radius: 0 6px 6px 0;"><span style="color: ${color}; margin-right: 8px;">${symbol}</span>${bt.reason}</div>`;
        }

        if (result.selectionPath && result.dp) {
            const finalTable = result.dp.length > 1 ? result.dp : [result.dp];
            stepsHTML += `
                <div style="margin-top: 15px;">
                    <p style="color: rgba(255,255,255,0.7); margin-bottom: 10px;">Final DP table with selection path highlighted:</p>
                    ${tableToHTML(finalTable, -1, result.selectionPath, true)}
                </div>
            `;
        }

        stepsHTML += '</div>';
    }

    document.getElementById('stepsContainer').innerHTML = stepsHTML + getLegendHTML();

    let totalValue = 0;
    let totalWeight = 0;

    for (let item of result.selectedItems) {
        totalValue += item.value * item.count;
        totalWeight += item.weight * item.count;
    }

    let finalHTML = '<h3><svg class="tick-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Optimal Solution</h3>';

    if (result.selectedItems.length === 0) {
        finalHTML += '<p style="color: rgba(255,255,255,0.7);">No items can fit in the knapsack.</p>';
    } else {
        finalHTML += '<div class="selected-items">';
        for (let item of result.selectedItems) {
            const countLabel = item.count > 1 ? ` ×${item.count}` : '';
            finalHTML += `
                    <div class="selected-item">
                        <div class="item-name">${item.name}${countLabel}</div>
                        <div class="item-details">w: ${item.weight} | v: ${item.value}</div>
                    </div>
                `;
        }
        finalHTML += '</div>';
    }

    finalHTML += `
            <div class="total-values">
                <div class="total-box">
                    <div class="label">Total Value</div>
                    <div class="value">${totalValue}</div>
                </div>
                <div class="total-box">
                    <div class="label">Total Weight</div>
                    <div class="value weight">${totalWeight} / ${W}</div>
                </div>
            </div>
        `;

    document.getElementById('finalResult').innerHTML = finalHTML;
}

function getLegendHTML() {
    return `
    <div class="legend-container" style="margin-top: 20px; padding: 15px; background: rgba(0,0,0,0.35); border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
        <h4 style="color: #a0aec0; margin-bottom: 12px; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px;">◈ Key / Legend</h4>
        <div style="display: flex; gap: 24px; flex-wrap: wrap; font-size: 0.85rem;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="width: 22px; height: 22px; background: rgba(74, 144, 226, 0.35); border: 2px solid #4a90e2; border-radius: 4px;"></span>
                <span style="color: #c9d1d9;">Item Selected</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="width: 22px; height: 22px; background: rgba(196, 122, 122, 0.35); border: 2px solid #c47a7a; border-radius: 4px;"></span>
                <span style="color: #c9d1d9;">Not Selected</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="width: 22px; height: 22px; background: rgba(230, 200, 100, 0.25); border: 2px solid #d4b94e; border-radius: 4px;"></span>
                <span style="color: #c9d1d9;">Current Row</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="width: 22px; height: 22px; background: rgba(168, 85, 247, 0.3); border: 2px solid #a855f7; border-radius: 4px;"></span>
                <span style="color: #c9d1d9;">Optimal Value</span>
            </div>
        </div>
    </div>
    `;
}

document.addEventListener('DOMContentLoaded', function () {
    generateInputs();
});
