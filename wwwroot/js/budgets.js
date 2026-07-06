/**
 * Aura Budgets Planner Module
 */

(function () {
    // 1. Check if the main application namespace exists
    if (!window.AuraApp) {
        return;
    }

    // 2. Define the Budgets module
    const Budgets = {
        // Initialize all events and UI elements on page load
        initBudgets() {
            // Setup Month Dropdown Select
            const monthInput = document.getElementById('budget-month-select');
            if (monthInput) {
                monthInput.value = this.state.budgets.selectedMonth;
                monthInput.addEventListener('change', (event) => {
                    this.state.budgets.selectedMonth = event.target.value;
                    this.loadBudgetsGrid();
                });
            }

            // Setup "Set Budget" Button Click
            const setBtn = document.getElementById('set-budget-btn');
            if (setBtn) {
                setBtn.addEventListener('click', () => {
                    this.openBudgetModal();
                });
            }

            // Setup Budget Form Submission
            const budgetForm = document.getElementById('budget-form');
            if (budgetForm) {
                budgetForm.addEventListener('submit', async (event) => {
                    event.preventDefault(); // Stop page reload
                    await this.saveBudget();
                });
            }

            // Setup Close Modal Buttons
            const closeBtn = document.getElementById('budget-modal-close-btn');
            const cancelBtn = document.getElementById('budget-cancel-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.hideModal('budget-modal');
                });
            }
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    this.hideModal('budget-modal');
                });
            }

            // Load budget items list
            this.loadBudgetsGrid();
        },

        // Open the pop-up modal to add/edit budget
        openBudgetModal() {
            const form = document.getElementById('budget-form');
            if (form) {
                form.reset(); // Clear old values
            }

            // Show current currency symbol (e.g. $)
            const currencyPrefix = document.getElementById('budget-currency-prefix');
            if (currencyPrefix) {
                currencyPrefix.textContent = this.state.currency;
            }

            // Set the month in form
            const budgetMonthInput = document.getElementById('budget-month');
            if (budgetMonthInput) {
                budgetMonthInput.value = this.state.budgets.selectedMonth;
            }

            // Populate category select dropdown
            const select = document.getElementById('budget-category');
            if (select) {
                select.innerHTML = ''; // Clear old options
                
                // Add an option for each expense category
                const expenseCategories = this.state.categories.expense;
                for (let i = 0; i < expenseCategories.length; i++) {
                    const categoryName = expenseCategories[i];
                    const option = document.createElement('option');
                    option.value = categoryName;
                    option.textContent = categoryName;
                    select.appendChild(option);
                }
            }

            // Show the modal window
            this.showModal('budget-modal');
        },

        // Save a budget to the database
        async saveBudget() {
            const category = document.getElementById('budget-category').value;
            const limitInput = document.getElementById('budget-limit').value;
            const limitAmount = parseFloat(limitInput);
            const month = document.getElementById('budget-month').value;

            // Simple validation
            if (isNaN(limitAmount) || limitAmount <= 0) {
                this.showAlert('Validation Error', 'Please enter a valid limit amount.', 'danger');
                return;
            }

            const payload = { 
                category: category, 
                limitAmount: limitAmount, 
                month: month 
            };

            try {
                const response = await fetch('/api/finance/budgets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    this.hideModal('budget-modal');
                    this.showAlert('Success', 'Budget limit updated successfully!', 'success');
                    this.loadBudgetsGrid();
                } else {
                    const errorData = await response.json();
                    this.showAlert('Error', errorData.message || 'Failed to save budget limit.', 'danger');
                }
            } catch (error) {
                this.showAlert('Error', 'Failed to connect to API.', 'danger');
            }
        },

        // Delete a budget
        async deleteBudget(budgetId) {
            const confirmMessage = 'Are you sure you want to delete this category budget limit?';
            
            // showAlert asks for confirmation, then calls the callback function if agreed
            this.showAlert('Confirm Delete', confirmMessage, 'danger', async () => {
                try {
                    const response = await fetch(`/api/finance/budgets/${budgetId}`, { 
                        method: 'DELETE' 
                    });

                    if (response.ok) {
                        this.showAlert('Deleted', 'Budget limit deleted.', 'success');
                        this.loadBudgetsGrid();
                    } else {
                        this.showAlert('Error', 'Failed to delete budget limit.', 'danger');
                    }
                } catch (error) {
                    this.showAlert('Error', 'Failed to connect to API.', 'danger');
                }
            });
        },

        // Load budgets data and display it in the grid
        async loadBudgetsGrid() {
            const grid = document.getElementById('budgets-grid-container');
            if (!grid) {
                return;
            }

            const month = this.state.budgets.selectedMonth;

            try {
                const response = await fetch(`/api/finance/budgets?month=${month}`);
                if (!response.ok) {
                    return;
                }

                const budgetList = await response.json();
                grid.innerHTML = ''; // Clear previous items

                // If no budgets configured, show empty state
                if (budgetList.length === 0) {
                    grid.innerHTML = `
                        <div style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 3rem;">
                            <i class="fa-solid fa-piggy-bank" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                            <p>No budget limits configured for this month.</p>
                            <p style="font-size: 0.85rem; margin-top: 0.5rem; color: var(--text-secondary);">Click "Set Category Budget" to start planning.</p>
                        </div>
                    `;
                    return;
                }

                // Render each budget card
                for (let i = 0; i < budgetList.length; i++) {
                    const budgetItem = budgetList[i];

                    // Calculate usage percentage
                    let percent = 0;
                    if (budgetItem.limitAmount > 0) {
                        percent = (budgetItem.spent / budgetItem.limitAmount) * 100;
                    }
                    const percentString = percent.toFixed(0) + '%';
                    
                    // Determine styling based on percentage
                    let progressColorClass = 'progress-green';
                    let statusLabel = 'Within Budget';
                    let textStatusColorClass = 'text-green';

                    if (percent >= 100) {
                        progressColorClass = 'progress-red';
                        statusLabel = 'Exceeded Limit';
                        textStatusColorClass = 'text-red';
                    } else if (percent >= 70) {
                        progressColorClass = 'progress-orange';
                        statusLabel = 'Approaching Limit';
                        textStatusColorClass = 'text-orange';
                    }

                    // Create the budget card element
                    const card = document.createElement('div');
                    card.className = 'card budget-card';

                    // Ensure progress bar fill is maximum 100%
                    const progressFillWidth = Math.min(percent, 100);

                    card.innerHTML = `
                        <div class="budget-card-header">
                            <div class="budget-card-title">
                                <h4>${budgetItem.category}</h4>
                                <span class="budget-warning-text ${textStatusColorClass}">
                                    <i class="fa-solid fa-circle-info"></i> ${statusLabel} (${percentString})
                                </span>
                            </div>
                            <button class="btn-icon delete-btn" title="Delete Budget limit">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                        <div>
                            <div class="progress-bar-container">
                                <div class="progress-fill ${progressColorClass}" style="width: ${progressFillWidth}%"></div>
                            </div>
                            <div class="budget-amounts">
                                <span class="budget-spent">${this.formatCurrency(budgetItem.spent)}</span>
                                <span class="budget-limit">of ${this.formatCurrency(budgetItem.limitAmount)}</span>
                            </div>
                        </div>
                    `;

                    // Attach click handler to delete button
                    const deleteBtn = card.querySelector('.delete-btn');
                    if (deleteBtn) {
                        deleteBtn.addEventListener('click', () => {
                            this.deleteBudget(budgetItem.id);
                        });
                    }

                    grid.appendChild(card);
                }
            } catch (error) {
                console.error('Failed to load budgets grid', error);
            }
        }
    };

    // 3. Add the Budgets module functions to the global AuraApp namespace
    // We use Object.assign to copy all methods from Budgets to window.AuraApp
    Object.assign(window.AuraApp, Budgets);
})();
