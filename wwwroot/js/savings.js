/**
 * Aura Savings Goals Module
 */

(function () {
    if (!window.AuraApp) return;

    const Savings = {
        initSavings() {
            // Register triggers
            const addBtn = document.getElementById('add-goal-btn');
            if (addBtn) {
                const newAddBtn = addBtn.cloneNode(true);
                addBtn.parentNode.replaceChild(newAddBtn, addBtn);
                newAddBtn.addEventListener('click', () => this.openGoalModal());
            }

            // Goal Submit
            const goalForm = document.getElementById('goal-form');
            if (goalForm) {
                const newGoalForm = goalForm.cloneNode(true);
                goalForm.parentNode.replaceChild(newGoalForm, goalForm);
                newGoalForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await this.saveSavingsGoal();
                });
            }

            // Fund Goal Submit
            const fundForm = document.getElementById('goal-fund-form');
            if (fundForm) {
                const newFundForm = fundForm.cloneNode(true);
                fundForm.parentNode.replaceChild(newFundForm, fundForm);
                newFundForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await this.transferGoalFunds();
                });
            }

            // Close actions
            const closeBtn = document.getElementById('goal-modal-close-btn');
            const cancelBtn = document.getElementById('goal-cancel-btn');
            if (closeBtn) closeBtn.addEventListener('click', () => this.hideModal('goal-modal'));
            if (cancelBtn) cancelBtn.addEventListener('click', () => this.hideModal('goal-modal'));

            const closeFundBtn = document.getElementById('goal-fund-modal-close-btn');
            const cancelFundBtn = document.getElementById('goal-fund-cancel-btn');
            if (closeFundBtn) closeFundBtn.addEventListener('click', () => this.hideModal('goal-fund-modal'));
            if (cancelFundBtn) cancelFundBtn.addEventListener('click', () => this.hideModal('goal-fund-modal'));

            this.loadSavingsGoals();
        },

        openGoalModal() {
            const form = document.getElementById('goal-form');
            form.reset();

            const targetPrefix = document.getElementById('goal-target');
            // Select all prefix placeholders
            document.querySelectorAll('.modal-currency-prefix').forEach(el => {
                el.textContent = this.state.currency;
            });

            const targetDate = new Date();
            targetDate.setFullYear(targetDate.getFullYear() + 1);
            document.getElementById('goal-date').value = targetDate.toISOString().substring(0, 10);

            this.showModal('goal-modal');
        },

        async saveSavingsGoal() {
            const title = document.getElementById('goal-title').value;
            const targetAmount = parseFloat(document.getElementById('goal-target').value);
            const currentAmount = parseFloat(document.getElementById('goal-current').value) || 0;
            const targetDate = document.getElementById('goal-date').value;

            if (isNaN(targetAmount) || targetAmount <= 0) {
                this.showAlert('Validation Error', 'Please enter a valid target amount.', 'danger');
                return;
            }

            const payload = { id: 0, title, targetAmount, currentAmount, targetDate };

            try {
                const r = await fetch('/api/finance/savings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (r.ok) {
                    this.hideModal('goal-modal');
                    this.showAlert('Goal Created', 'New savings goal has been configured.', 'success');
                    this.loadSavingsGoals();
                } else {
                    const err = await r.json();
                    this.showAlert('Error', err.message || 'Failed to create goal.', 'danger');
                }
            } catch (e) {
                this.showAlert('Error', 'Failed to connect to API.', 'danger');
            }
        },

        openFundModal(id, type, title) {
            document.getElementById('goal-fund-id').value = id;
            document.getElementById('goal-fund-type').value = type;
            document.getElementById('goal-fund-amount').value = '';

            document.querySelectorAll('.modal-currency-prefix').forEach(el => {
                el.textContent = this.state.currency;
            });

            const titleEl = document.getElementById('goal-fund-title');
            const subtitleEl = document.getElementById('goal-fund-subtitle');
            const submitBtn = document.getElementById('goal-fund-submit-btn');

            if (type === 'deposit') {
                titleEl.textContent = 'Save Money';
                subtitleEl.textContent = `Transfer spendable funds into "${title}".`;
                submitBtn.textContent = 'Deposit Funds';
                submitBtn.className = 'btn btn-primary';
            } else {
                titleEl.textContent = 'Withdraw Money';
                subtitleEl.textContent = `Release funds from "${title}" back into Net Balance.`;
                submitBtn.textContent = 'Withdraw Funds';
                submitBtn.className = 'btn btn-danger';
            }

            this.showModal('goal-fund-modal');
        },

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
                const r = await fetch(queryUrl, { method: 'POST' });

                if (r.ok) {
                    this.hideModal('goal-fund-modal');
                    this.showAlert('Transferred', type === 'deposit' ? 'Added savings to goal!' : 'Withdrawn savings from goal.', 'success');
                    this.loadSavingsGoals();
                } else {
                    const err = await r.json();
                    this.showAlert('Error', err.message || 'Transfer failed.', 'danger');
                }
            } catch (e) {
                this.showAlert('Error', 'Connection to API failed.', 'danger');
            }
        },

        async deleteSavingsGoal(id) {
            this.showAlert('Confirm Delete', 'Are you sure you want to delete this savings goal? Money stored in it will be lost.', 'danger', async () => {
                try {
                    const r = await fetch(`/api/finance/savings/${id}`, { method: 'DELETE' });
                    if (r.ok) {
                        this.showAlert('Deleted', 'Savings goal deleted.', 'success');
                        this.loadSavingsGoals();
                    } else {
                        this.showAlert('Error', 'Failed to delete goal.', 'danger');
                    }
                } catch (e) {
                    this.showAlert('Error', 'Failed to delete goal.', 'danger');
                }
            });
        },

        async loadSavingsGoals() {
            const grid = document.getElementById('savings-grid-container');
            if (!grid) return;

            try {
                const r = await fetch('/api/finance/savings');
                if (r.ok) {
                    const list = await r.json();
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

                    list.forEach(g => {
                        const card = document.createElement('div');
                        card.className = 'card goal-card';

                        const percent = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
                        const percentStr = percent.toFixed(0) + '%';
                        const dateStr = new Date(g.targetDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

                        card.innerHTML = `
                            <div class="goal-progress-percentage">${percentStr}</div>
                            <div class="goal-info">
                                <h4>${g.title}</h4>
                                <span class="goal-date"><i class="fa-solid fa-calendar-day"></i> Target: ${dateStr}</span>
                            </div>
                            <div>
                                <div class="progress-bar-container">
                                    <div class="progress-fill progress-green" style="width: ${Math.min(percent, 100)}%"></div>
                                </div>
                                <div class="goal-progress-details">
                                    <span class="goal-current-amount">${this.formatCurrency(g.currentAmount)}</span>
                                    <span class="goal-target-amount">of ${this.formatCurrency(g.targetAmount)}</span>
                                </div>
                            </div>
                            <div class="goal-actions">
                                <button class="btn btn-secondary deposit-btn" title="Add savings"><i class="fa-solid fa-plus"></i> Save</button>
                                <button class="btn btn-secondary-outline withdraw-btn" title="Withdraw savings"><i class="fa-solid fa-minus"></i> Use</button>
                                <button class="btn-icon delete-btn" title="Delete Goal"><i class="fa-solid fa-trash-can"></i></button>
                            </div>
                        `;

                        card.querySelector('.deposit-btn').addEventListener('click', () => this.openFundModal(g.id, 'deposit', g.title));
                        card.querySelector('.withdraw-btn').addEventListener('click', () => this.openFundModal(g.id, 'withdraw', g.title));
                        card.querySelector('.delete-btn').addEventListener('click', () => this.deleteSavingsGoal(g.id));

                        grid.appendChild(card);
                    });
                }
            } catch (e) {
                console.error('Failed to load savings goals', e);
            }
        }
    };

    Object.assign(window.AuraApp, Savings);
})();
