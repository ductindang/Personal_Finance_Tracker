/**
 * Aura Base Client Application Logic - Core layout theme, shared modals, alerts, and currency utilities.
 */

(function () {
    const AuraApp = {
        // App State
        state: {
            currency: localStorage.getItem('aura_currency') || '$',
            theme: localStorage.getItem('aura_theme') || 'dark',
            categories: {
                income: [],
                expense: [],
                rawList: []
            },
            // Paginated Transactions state (used by transactions.js)
            transactions: {
                data: [],
                total: 0,
                page: 1,
                pageSize: 10,
                filters: {
                    search: '',
                    type: 'all',
                    category: 'all',
                    dateFrom: '',
                    dateTo: ''
                }
            },
            // Budgets state (used by budgets.js)
            budgets: {
                data: [],
                selectedMonth: new Date().toISOString().substring(0, 7) // YYYY-MM
            },
            // Savings Goal state (used by savings.js)
            savings: []
        },

        // Charts Cache (used by dashboard.js)
        charts: {
            cashflow: null,
            category: null
        },

        // Init App (runs immediately)
        async init() {
            this.setupTheme();
            this.setupGlobalEvents();
            this.setupModals();
            await this.fetchCategories();
        },

        async fetchCategories() {
            try {
                const r = await fetch('/api/finance/categories');
                if (r.ok) {
                    const list = await r.json();
                    this.state.categories.income = list.filter(c => c.type === 'income').map(c => c.name);
                    this.state.categories.expense = list.filter(c => c.type === 'expense').map(c => c.name);
                    this.state.categories.rawList = list;
                }
            } catch (e) {
                console.error('Failed to load categories', e);
            }
        },

        // --- Preferences and Themes ---
        setupTheme() {
            const body = document.body;
            const btn = document.getElementById('theme-toggle-btn');
            const icon = btn ? btn.querySelector('i') : null;
            const text = document.getElementById('theme-btn-text');

            const applyTheme = (themeName) => {
                if (themeName === 'light') {
                    body.classList.add('light-theme');
                    body.classList.remove('dark-theme');
                    if (icon) icon.className = 'fa-solid fa-sun';
                    if (text) text.textContent = 'Light Mode';
                } else {
                    body.classList.add('dark-theme');
                    body.classList.remove('light-theme');
                    if (icon) icon.className = 'fa-solid fa-moon';
                    if (text) text.textContent = 'Dark Mode';
                }
            };

            applyTheme(this.state.theme);

            if (btn) {
                btn.addEventListener('click', () => {
                    this.state.theme = this.state.theme === 'dark' ? 'light' : 'dark';
                    localStorage.setItem('aura_theme', this.state.theme);
                    applyTheme(this.state.theme);
                    // Rerender active page charts if refreshCharts is available (attached in dashboard.js)
                    if (typeof this.refreshCharts === 'function') {
                        this.refreshCharts();
                    }
                });
            }
        },

        formatCurrency(val) {
            const num = parseFloat(val) || 0;
            if (this.state.currency === '₫') {
                const formatted = Math.round(num).toLocaleString('vi-VN');
                return formatted + ' ₫';
            }
            const formatted = num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            return this.state.currency + formatted;
        },

        // --- Custom Alert/Confirm Modals ---
        showAlert(title, message, type = 'info', onOk = null, onCancel = null) {
            const modal = document.getElementById('alert-modal');
            const icon = document.getElementById('alert-modal-icon');
            const titleEl = document.getElementById('alert-modal-title');
            const msgEl = document.getElementById('alert-modal-message');
            const okBtn = document.getElementById('alert-modal-ok-btn');
            const cancelBtn = document.getElementById('alert-modal-cancel-btn');

            if (!modal) return;

            // Setup icons and colors
            modal.className = `modal modal-alert alert-type-${type}`;
            if (type === 'danger') {
                icon.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i>';
            } else if (type === 'success') {
                icon.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
            } else {
                icon.innerHTML = '<i class="fa-solid fa-circle-info"></i>';
            }

            titleEl.textContent = title;
            msgEl.textContent = message;

            if (onCancel) {
                cancelBtn.style.display = 'block';
            } else {
                cancelBtn.style.display = 'none';
            }

            // Cleanup previous listeners
            const newOk = okBtn.cloneNode(true);
            const newCancel = cancelBtn.cloneNode(true);
            okBtn.parentNode.replaceChild(newOk, okBtn);
            cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

            newOk.addEventListener('click', () => {
                this.hideModal('alert-modal');
                if (onOk) onOk();
            });

            newCancel.addEventListener('click', () => {
                this.hideModal('alert-modal');
                if (onCancel) onCancel();
            });

            this.showModal('alert-modal');
        },

        // --- Modal Utility Actions ---
        showModal(id) {
            const el = document.getElementById(id);
            if (el) el.classList.add('active');
        },

        hideModal(id) {
            const el = document.getElementById(id);
            if (el) el.classList.remove('active');
        },

        setupModals() {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    const activeModal = document.querySelector('.modal.active');
                    if (activeModal) this.hideModal(activeModal.id);
                }
            });

            document.querySelectorAll('.modal').forEach(modal => {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.hideModal(modal.id);
                    }
                });
            });
        },

        // --- Global Actions & Event Handlers ---
        setupGlobalEvents() {
            // Quick Add Transaction trigger
            const quickBtn = document.getElementById('quick-add-btn');
            if (quickBtn) {
                quickBtn.addEventListener('click', () => {
                    this.openTransactionModal();
                });
            }

            // Transaction Add Form Submit
            const transForm = document.getElementById('transaction-form');
            if (transForm) {
                transForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await this.saveTransaction();
                });
            }

            // Close buttons
            const closeBtn = document.getElementById('transaction-modal-close-btn');
            const cancelBtn = document.getElementById('trans-cancel-btn');
            if (closeBtn) closeBtn.addEventListener('click', () => this.hideModal('transaction-modal'));
            if (cancelBtn) cancelBtn.addEventListener('click', () => this.hideModal('transaction-modal'));

            // Watch type switch changes to toggle categories select
            const expenseRadio = document.getElementById('type-expense');
            const incomeRadio = document.getElementById('type-income');
            if (expenseRadio && incomeRadio) {
                expenseRadio.addEventListener('change', () => this.updateModalCategories('expense'));
                incomeRadio.addEventListener('change', () => this.updateModalCategories('income'));
            }
        },

        updateModalCategories(type, selectedCategory = '') {
            const select = document.getElementById('trans-category');
            if (!select) return;
            select.innerHTML = '';
            
            const list = this.state.categories[type];
            list.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c;
                opt.textContent = c;
                if (c === selectedCategory) opt.selected = true;
                select.appendChild(opt);
            });
        },

        // --- Transaction Modal Add/Edit Actions ---
        openTransactionModal(id = null) {
            const titleEl = document.getElementById('transaction-modal-title');
            const form = document.getElementById('transaction-form');
            
            // Set currency sign
            const currencyPrefix = document.querySelector('.modal-currency-prefix');
            if (currencyPrefix) currencyPrefix.textContent = this.state.currency;

            form.reset();
            document.getElementById('trans-id').value = '0';
            document.getElementById('trans-date').value = new Date().toISOString().substring(0, 10);
            
            // Set defaults (expense)
            document.getElementById('type-expense').checked = true;
            this.updateModalCategories('expense');

            if (id) {
                titleEl.textContent = 'Edit Transaction';
                fetch(`/api/finance/transactions/${id}`)
                    .then(r => r.json())
                    .then(t => {
                        document.getElementById('trans-id').value = t.id;
                        document.getElementById('trans-amount').value = t.amount;
                        document.getElementById('trans-date').value = t.date.substring(0, 10);
                        document.getElementById('trans-description').value = t.description;
                        
                        if (t.type === 'income') {
                            document.getElementById('type-income').checked = true;
                            this.updateModalCategories('income', t.category);
                        } else {
                            document.getElementById('type-expense').checked = true;
                            this.updateModalCategories('expense', t.category);
                        }
                        this.showModal('transaction-modal');
                    });
            } else {
                titleEl.textContent = 'Add Transaction';
                this.showModal('transaction-modal');
            }
        },

        async saveTransaction() {
            const id = parseInt(document.getElementById('trans-id').value) || 0;
            const type = document.querySelector('input[name="trans-type"]:checked').value;
            const amount = parseFloat(document.getElementById('trans-amount').value);
            const category = document.getElementById('trans-category').value;
            const date = document.getElementById('trans-date').value;
            const description = document.getElementById('trans-description').value;

            if (isNaN(amount) || amount <= 0) {
                this.showAlert('Validation Error', 'Please enter a valid amount.', 'danger');
                return;
            }

            const payload = { id, type, amount, category, date, description };

            try {
                const response = await fetch('/api/finance/transactions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                if (response.ok) {
                    this.hideModal('transaction-modal');
                    this.showAlert('Success', id === 0 ? 'Transaction added successfully!' : 'Transaction updated successfully!', 'success');
                    
                    const activeAction = window.location.pathname.split('/').pop() || 'Index';
                    this.refreshActivePage(activeAction);
                } else {
                    const err = await response.json();
                    this.showAlert('Error', err.message || 'Failed to save transaction.', 'danger');
                }
            } catch (e) {
                this.showAlert('Error', 'Failed to connect to API.', 'danger');
            }
        },

        async deleteTransaction(id) {
            this.showAlert('Confirm Delete', 'Are you sure you want to delete this transaction?', 'danger', async () => {
                try {
                    const r = await fetch(`/api/finance/transactions/${id}`, { method: 'DELETE' });
                    if (r.ok) {
                        this.showAlert('Deleted', 'Transaction deleted successfully.', 'success');
                        
                        const activeAction = window.location.pathname.split('/').pop() || 'Index';
                        this.refreshActivePage(activeAction);
                    } else {
                        this.showAlert('Error', 'Failed to delete transaction.', 'danger');
                    }
                } catch (e) {
                    this.showAlert('Error', 'Failed to connect to API.', 'danger');
                }
            }, () => {});
        },

        refreshActivePage(actionName) {
            actionName = actionName.toLowerCase();
            if (actionName === 'index' || actionName === 'home' || actionName === '') {
                if (typeof this.initDashboard === 'function') this.initDashboard();
            } else if (actionName === 'transactions') {
                if (typeof this.loadTransactionsList === 'function') this.loadTransactionsList();
            } else if (actionName === 'budgets') {
                if (typeof this.loadBudgetsGrid === 'function') this.loadBudgetsGrid();
            } else if (actionName === 'savings') {
                if (typeof this.loadSavingsGoals === 'function') this.loadSavingsGoals();
            }
        }
    };

    window.AuraApp = AuraApp;
    
    document.addEventListener('DOMContentLoaded', () => {
        AuraApp.init();
    });
})();
