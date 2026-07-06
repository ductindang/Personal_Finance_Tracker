/**
 * Aura Savings Goals Module
 */

(function () {
    // Check if the main application namespace exists
    if (!window.AuraApp) {
        return;
    }

    const Savings = {
        // Initialize buttons, forms, and handlers for savings goals page
        initSavings() {
            // Register target modal show trigger
            const addBtn = document.getElementById('add-goal-btn');
            if (addBtn) {
                addBtn.addEventListener('click', () => {
                    this.openGoalModal();
                });
            }

            // Savings Goal form submission handler
            const goalForm = document.getElementById('goal-form');
            if (goalForm) {
                goalForm.addEventListener('submit', async (event) => {
                    event.preventDefault();
                    await this.saveSavingsGoal();
                });
            }

            // Fund Goal transfer form submission handler
            const fundForm = document.getElementById('goal-fund-form');
            if (fundForm) {
                fundForm.addEventListener('submit', async (event) => {
                    event.preventDefault();
                    await this.transferGoalFunds();
                });
            }

            // Close actions for forms & modal elements
            const closeBtn = document.getElementById('goal-modal-close-btn');
            const cancelBtn = document.getElementById('goal-cancel-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.hideModal('goal-modal');
                });
            }
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    this.hideModal('goal-modal');
                });
            }

            const closeFundBtn = document.getElementById('goal-fund-modal-close-btn');
            const cancelFundBtn = document.getElementById('goal-fund-cancel-btn');
            if (closeFundBtn) {
                closeFundBtn.addEventListener('click', () => {
                    this.hideModal('goal-fund-modal');
                });
            }
            if (cancelFundBtn) {
                cancelFundBtn.addEventListener('click', () => {
                    this.hideModal('goal-fund-modal');
                });
            }

            this.loadSavingsGoals();
        },

        // Setup options inside new goal pop-up modal
        openGoalModal() {
            const form = document.getElementById('goal-form');
            if (form) {
                form.reset();
            }

            // Ingest target currency sign prefixes
            const prefixes = document.querySelectorAll('.modal-currency-prefix');
            for (let i = 0; i < prefixes.length; i++) {
                prefixes[i].textContent = this.state.currency;
            }

            // Set default date to exactly 1 year from now
            const targetDate = new Date();
            targetDate.setFullYear(targetDate.getFullYear() + 1);
            document.getElementById('goal-date').value = targetDate.toISOString().substring(0, 10);

            this.showModal('goal-modal');
        },

        // Save new savings goal record to DB
        async saveSavingsGoal() {
            const title = document.getElementById('goal-title').value;
            const targetAmount = parseFloat(document.getElementById('goal-target').value);
            const currentAmount = parseFloat(document.getElementById('goal-current').value) || 0;
            const targetDate = document.getElementById('goal-date').value;

            if (isNaN(targetAmount) || targetAmount <= 0) {
                this.showAlert('Validation Error', 'Please enter a valid target amount.', 'danger');
                return;
            }

            const payload = { 
                id: 0, 
                title: title, 
                targetAmount: targetAmount, 
                currentAmount: currentAmount, 
                targetDate: targetDate 
            };

            try {
                const response = await fetch('/api/finance/savings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    this.hideModal('goal-modal');
                    this.showAlert('Goal Created', 'New savings goal has been configured.', 'success');
                    this.loadSavingsGoals();
                } else {
                    const err = await response.json();
                    this.showAlert('Error', err.message || 'Failed to create goal.', 'danger');
                }
            } catch (error) {
                this.showAlert('Error', 'Failed to connect to API.', 'danger');
            }
        },

        // Open modal for deposits (Save) or withdrawals (Use) funds from goal
        openFundModal(goalId, transferType, goalTitle) {
            document.getElementById('goal-fund-id').value = goalId;
            document.getElementById('goal-fund-type').value = transferType;
            document.getElementById('goal-fund-amount').value = '';

            const prefixes = document.querySelectorAll('.modal-currency-prefix');
            for (let i = 0; i < prefixes.length; i++) {
                prefixes[i].textContent = this.state.currency;
            }

            const titleEl = document.getElementById('goal-fund-title');
            const subtitleEl = document.getElementById('goal-fund-subtitle');
            const submitBtn = document.getElementById('goal-fund-submit-btn');

            if (transferType === 'deposit') {
                titleEl.textContent = 'Save Money';
                subtitleEl.textContent = `Transfer spendable funds into "${goalTitle}".`;
                submitBtn.textContent = 'Deposit Funds';
                submitBtn.className = 'btn btn-primary';
            } else {
                titleEl.textContent = 'Withdraw Money';
                subtitleEl.textContent = `Release funds from "${goalTitle}" back into Net Balance.`;
                submitBtn.textContent = 'Withdraw Funds';
                submitBtn.className = 'btn btn-danger';
            }

            this.showModal('goal-fund-modal');
        },

        // Save deposit/withdrawal adjustment to DB
        async transferGoalFunds() {
            const id = parseInt(document.getElementById('goal-fund-id').value);
            const type = document.getElementById('goal-fund-type').value;
            const amount = parseFloat(document.getElementById('goal-fund-amount').value);

            if (isNaN(amount) || amount <= 0) {
                this.showAlert('Validation Error', 'Please enter a valid positive transfer amount.', 'danger');
                return;
            }

            try {
                const queryUrl = `/api/finance/savings/fund?id=${id}&amount=${amount}&type=${type}`;
                const response = await fetch(queryUrl, { 
                    method: 'POST' 
                });

                if (response.ok) {
                    this.hideModal('goal-fund-modal');
                    
                    let successMessage = 'Withdrawn savings from goal.';
                    if (type === 'deposit') {
                        successMessage = 'Added savings to goal!';
                    }
                    this.showAlert('Transferred', successMessage, 'success');
                    
                    this.loadSavingsGoals();
                } else {
                    const err = await response.json();
                    this.showAlert('Error', err.message || 'Transfer failed.', 'danger');
                }
            } catch (error) {
                this.showAlert('Error', 'Connection to API failed.', 'danger');
            }
        },

        // Request API to delete a goal
        async deleteSavingsGoal(goalId) {
            const warningMsg = 'Are you sure you want to delete this savings goal? Money stored in it will be lost.';
            this.showAlert('Confirm Delete', warningMsg, 'danger', async () => {
                try {
                    const response = await fetch(`/api/finance/savings/${goalId}`, { 
                        method: 'DELETE' 
                    });
                    if (response.ok) {
                        this.showAlert('Deleted', 'Savings goal deleted.', 'success');
                        this.loadSavingsGoals();
                    } else {
                        this.showAlert('Error', 'Failed to delete goal.', 'danger');
                    }
                } catch (error) {
                    this.showAlert('Error', 'Failed to delete goal.', 'danger');
                }
            });
        },

        // Pull savings records and render cards inside grid layout
        async loadSavingsGoals() {
            const grid = document.getElementById('savings-grid-container');
            if (!grid) {
                return;
            }

            try {
                const response = await fetch('/api/finance/savings');
                if (response.ok) {
                    const list = await response.json();
                    grid.innerHTML = '';

                    if (list.length === 0) {
                        grid.innerHTML = `
                            <div style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 3rem;">
                                <i class="fa-solid fa-bullseye" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                                <p>No savings goals created.</p>
                                <p style="font-size: 0.85rem; margin-top: 0.5rem; color: var(--text-secondary);">Click "Create Savings Goal" to start saving.</p>
                            </div>
                        `;
                        return;
                    }

                    // Render cards
                    for (let i = 0; i < list.length; i++) {
                        const item = list[i];
                        const card = document.createElement('div');
                        card.className = 'card goal-card';

                        let percent = 0;
                        if (item.targetAmount > 0) {
                            percent = (item.currentAmount / item.targetAmount) * 100;
                        }
                        const percentStr = percent.toFixed(0) + '%';
                        
                        const dateObj = new Date(item.targetDate);
                        const dateStr = dateObj.toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                        });

                        const progressFillWidth = Math.min(percent, 100);

                        card.innerHTML = `
                            <div class="goal-progress-percentage">${percentStr}</div>
                            <div class="goal-info">
                                <h4>${item.title}</h4>
                                <span class="goal-date"><i class="fa-solid fa-calendar-day"></i> Target: ${dateStr}</span>
                            </div>
                            <div>
                                <div class="progress-bar-container">
                                    <div class="progress-fill progress-green" style="width: ${progressFillWidth}%"></div>
                                </div>
                                <div class="goal-progress-details">
                                    <span class="goal-current-amount">${this.formatCurrency(item.currentAmount)}</span>
                                    <span class="goal-target-amount">of ${this.formatCurrency(item.targetAmount)}</span>
                                </div>
                            </div>
                            <div class="goal-actions">
                                <button class="btn btn-secondary deposit-btn" title="Add savings"><i class="fa-solid fa-plus"></i> Save</button>
                                <button class="btn btn-secondary-outline withdraw-btn" title="Withdraw savings"><i class="fa-solid fa-minus"></i> Use</button>
                                <button class="btn-icon delete-btn" title="Delete Goal"><i class="fa-solid fa-trash-can"></i></button>
                            </div>
                        `;

                        // Bind actions
                        card.querySelector('.deposit-btn').addEventListener('click', () => {
                            this.openFundModal(item.id, 'deposit', item.title);
                        });
                        card.querySelector('.withdraw-btn').addEventListener('click', () => {
                            this.openFundModal(item.id, 'withdraw', item.title);
                        });
                        card.querySelector('.delete-btn').addEventListener('click', () => {
                            this.deleteSavingsGoal(item.id);
                        });

                        grid.appendChild(card);
                    }
                }
            } catch (error) {
                console.error('Failed to load savings goals', error);
            }
        }
    };

    // Attach to core application namespace
    Object.assign(window.AuraApp, Savings);
})();
