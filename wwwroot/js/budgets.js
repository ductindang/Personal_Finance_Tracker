/**
 * Aura Budgets Planner Module
 */

(function () {
    if (!window.AuraApp) return;

    const Budgets = {
        initBudgets() {
            const monthInput = document.getElementById('budget-month-select');
            if (monthInput) {
                monthInput.value = this.state.budgets.selectedMonth;
                // Avoid binding multiple times
                const newMonthInput = monthInput.cloneNode(true);
                monthInput.parentNode.replaceChild(newMonthInput, monthInput);
                newMonthInput.addEventListener('change', (e) => {
                    this.state.budgets.selectedMonth = e.target.value;
                    this.loadBudgetsGrid();
                });
            }

            // Set Budget trigger button
            const setBtn = document.getElementById('set-budget-btn');
            if (setBtn) {
                const newSetBtn = setBtn.cloneNode(true);
                setBtn.parentNode.replaceChild(newSetBtn, setBtn);
                newSetBtn.addEventListener('click', () => {
                    this.openBudgetModal();
                });
            }

            // Budget Submit
            const budgetForm = document.getElementById('budget-form');
            if (budgetForm) {
                const newForm = budgetForm.cloneNode(true);
                budgetForm.parentNode.replaceChild(newForm, budgetForm);
                newForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await this.saveBudget();
                });
            }

            // Modal cancel/close
            const closeBtn = document.getElementById('budget-modal-close-btn');
            const cancelBtn = document.getElementById('budget-cancel-btn');
            if (closeBtn) closeBtn.addEventListener('click', () => this.hideModal('budget-modal'));
            if (cancelBtn) cancelBtn.addEventListener('click', () => this.hideModal('budget-modal'));

            this.loadBudgetsGrid();
        },

        openBudgetModal() {
            const form = document.getElementById('budget-form');
            form.reset();

            const currencyPrefix = document.getElementById('budget-currency-prefix');
            if (currencyPrefix) currencyPrefix.textContent = this.state.currency;

            document.getElementById('budget-month').value = this.state.budgets.selectedMonth;

            const select = document.getElementById('budget-category');
            if (select) {
                select.innerHTML = '';
                this.state.categories.expense.forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c;
                    opt.textContent = c;
                    select.appendChild(opt);
                });
            }

            this.showModal('budget-modal');
        },

        async saveBudget() {
            const category = document.getElementById('budget-category').value;
            const limitAmount = parseFloat(document.getElementById('budget-limit').value);
            const month = document.getElementById('budget-month').value;

            if (isNaN(limitAmount) || limitAmount <= 0) {
                this.showAlert('Validation Error', 'Please enter a valid limit amount.', 'danger');
                return;
            }

            const payload = { category, limitAmount, month };

            try {
                const r = await fetch('/api/finance/budgets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (r.ok) {
                    this.hideModal('budget-modal');
                    this.showAlert('Success', 'Budget limit updated successfully!', 'success');
                    this.loadBudgetsGrid();
                } else {
                    const err = await r.json();
                    this.showAlert('Error', err.message || 'Failed to save budget limit.', 'danger');
                }
            } catch (e) {
                this.showAlert('Error', 'Failed to connect to API.', 'danger');
            }
        },

        async deleteBudget(id) {
            this.showAlert('Confirm Delete', 'Are you sure you want to delete this category budget limit?', 'danger', async () => {
                try {
                    const r = await fetch(`/api/finance/budgets/${id}`, { method: 'DELETE' });
                    if (r.ok) {
                        this.showAlert('Deleted', 'Budget limit deleted.', 'success');
                        this.loadBudgetsGrid();
                    } else {
                        this.showAlert('Error', 'Failed to delete budget limit.', 'danger');
                    }
                } catch (e) {
                    this.showAlert('Error', 'Failed to connect to API.', 'danger');
                }
            });
        },

        async loadBudgetsGrid() {
            const grid = document.getElementById('budgets-grid-container');
            if (!grid) return;

            const month = this.state.budgets.selectedMonth;

            try {
                const r = await fetch(`/api/finance/budgets?month=${month}`);
                if (r.ok) {
                    const list = await r.json();
                    grid.innerHTML = '';

                    if (list.length === 0) {
                        grid.innerHTML = `
                            <div style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 3rem;">
                                <i class="fa-solid fa-piggy-bank" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                                <p>No budget limits configured for this month.</p>
                                <p style="font-size: 0.85rem; margin-top: 0.5rem; color: var(--text-secondary);">Click "Set Category Budget" to start planning.</p>
                            </div>
                        `;
                        return;
                    }

                    list.forEach(b => {
                        const card = document.createElement('div');
                        card.className = 'card budget-card';

                        const percent = b.limitAmount > 0 ? (b.spent / b.limitAmount) * 100 : 0;
                        const percentStr = percent.toFixed(0) + '%';
                        
                        let barClass = 'progress-green';
                        let warningText = 'Within Budget';
                        let warningClass = 'text-green';

                        if (percent >= 100) {
                            barClass = 'progress-red';
                            warningText = 'Exceeded Limit';
                            warningClass = 'text-red';
                        } else if (percent >= 70) {
                            barClass = 'progress-orange';
                            warningText = 'Approaching Limit';
                            warningClass = 'text-orange';
                        }

                        card.innerHTML = `
                            <div class="budget-card-header">
                                <div class="budget-card-title">
                                    <h4>${b.category}</h4>
                                    <span class="budget-warning-text ${warningClass}">
                                        <i class="fa-solid fa-circle-info"></i> ${warningText} (${percentStr})
                                    </span>
                                </div>
                                <button class="btn-icon delete-btn" title="Delete Budget limit"><i class="fa-solid fa-trash-can"></i></button>
                            </div>
                            <div>
                                <div class="progress-bar-container">
                                    <div class="progress-fill ${barClass}" style="width: ${Math.min(percent, 100)}%"></div>
                                </div>
                                <div class="budget-amounts">
                                    <span class="budget-spent">${this.formatCurrency(b.spent)}</span>
                                    <span class="budget-limit">of ${this.formatCurrency(b.limitAmount)}</span>
                                </div>
                            </div>
                        `;

                        card.querySelector('.delete-btn').addEventListener('click', () => this.deleteBudget(b.id));
                        grid.appendChild(card);
                    });
                }
            } catch (e) {
                console.error('Failed to load budgets grid', e);
            }
        }
    };

    Object.assign(window.AuraApp, Budgets);
})();
