/**
 * Aura Base Client Application Logic - Core layout theme, shared modals, alerts, and currency utilities.
 */

(function () {
    const AuraApp = {
        // App State - stores global values like selected currency, theme, categories, and page states
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

        // Init App (runs immediately when the page finishes loading)
        async init() {
            this.setupTheme();
            this.setupGlobalEvents();
            this.setupModals();
            await this.fetchCategories();
        },

        // Fetch income/expense categories from the server database
        async fetchCategories() {
            try {
                const response = await fetch('/api/finance/categories');
                if (response.ok) {
                    const list = await response.json();
                    
                    // Filter and map category names
                    this.state.categories.income = [];
                    this.state.categories.expense = [];
                    
                    for (let i = 0; i < list.length; i++) {
                        const cat = list[i];
                        if (cat.type === 'income') {
                            this.state.categories.income.push(cat.name);
                        } else if (cat.type === 'expense') {
                            this.state.categories.expense.push(cat.name);
                        }
                    }
                    this.state.categories.rawList = list;
                }
            } catch (error) {
                console.error('Failed to load categories', error);
            }
        },

        // --- Preferences and Themes ---
        setupTheme() {
            const body = document.body;
            const btn = document.getElementById('theme-toggle-btn');
            const icon = btn ? btn.querySelector('i') : null;
            const text = document.getElementById('theme-btn-text');

            // Apply selected theme to HTML body class
            const applyTheme = (themeName) => {
                if (themeName === 'light') {
                    body.classList.add('light-theme');
                    body.classList.remove('dark-theme');
                    if (icon) {
                        icon.className = 'fa-solid fa-sun';
                    }
                    if (text) {
                        text.textContent = 'Light Mode';
                    }
                } else {
                    body.classList.add('dark-theme');
                    body.classList.remove('light-theme');
                    if (icon) {
                        icon.className = 'fa-solid fa-moon';
                    }
                    if (text) {
                        text.textContent = 'Dark Mode';
                    }
                }
            };

            applyTheme(this.state.theme);

            // Set up click listener to switch themes
            if (btn) {
                btn.addEventListener('click', () => {
                    if (this.state.theme === 'dark') {
                        this.state.theme = 'light';
                    } else {
                        this.state.theme = 'dark';
                    }
                    
                    localStorage.setItem('aura_theme', this.state.theme);
                    applyTheme(this.state.theme);
                    
                    // Rerender active page charts if refreshCharts is available (attached in dashboard.js)
                    if (typeof this.refreshCharts === 'function') {
                        this.refreshCharts();
                    }
                });
            }
        },

        // Format a number to currency format (e.g. 1000 -> $1,000.00 or 1000 ₫)
        formatCurrency(value) {
            const num = parseFloat(value) || 0;
            if (this.state.currency === '₫') {
                const formatted = Math.round(num).toLocaleString('vi-VN');
                return formatted + ' ₫';
            }
            const formatted = num.toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
            });
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

            if (!modal) {
                return;
            }

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

            // Show or hide cancel button and adjust layout
            const actionsContainer = okBtn.closest('.alert-actions');
            if (onCancel) {
                cancelBtn.style.display = 'block';
                if (actionsContainer) actionsContainer.classList.add('alert-actions--confirm');
            } else {
                cancelBtn.style.display = 'none';
                if (actionsContainer) actionsContainer.classList.remove('alert-actions--confirm');
            }

            // Cleanup previous event listeners by cloning the buttons
            const newOk = okBtn.cloneNode(true);
            const newCancel = cancelBtn.cloneNode(true);
            okBtn.parentNode.replaceChild(newOk, okBtn);
            cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

            // Bind click handlers to the new buttons
            newOk.addEventListener('click', () => {
                this.hideModal('alert-modal');
                if (onOk) {
                    onOk();
                }
            });

            newCancel.addEventListener('click', () => {
                this.hideModal('alert-modal');
                if (onCancel) {
                    onCancel();
                }
            });

            this.showModal('alert-modal');

            // Move focus to OK button so Enter dismisses the alert
            // instead of re-triggering the hidden form's submit button
            newOk.focus();
        },

        // --- Modal Utility Actions ---
        showModal(id) {
            const element = document.getElementById(id);
            if (element) {
                element.classList.add('active');
            }
        },

        hideModal(id) {
            const element = document.getElementById(id);
            if (element) {
                element.classList.remove('active');
            }
        },

        setupModals() {
            // Close active modal when Escape key is pressed
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape') {
                    const activeModal = document.querySelector('.modal.active');
                    if (activeModal) {
                        this.hideModal(activeModal.id);
                    }
                }
            });

            // Close modal when clicking outside the modal content box
            const modalsList = document.querySelectorAll('.modal');
            for (let i = 0; i < modalsList.length; i++) {
                const modal = modalsList[i];
                modal.addEventListener('click', (event) => {
                    if (event.target === modal) {
                        this.hideModal(modal.id);
                    }
                });
            }
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
                transForm.addEventListener('submit', async (event) => {
                    event.preventDefault();
                    // Prevent duplicate submissions when alert modal is visible
                    const alertModal = document.getElementById('alert-modal');
                    if (alertModal && alertModal.classList.contains('active')) {
                        return;
                    }
                    await this.saveTransaction();
                });
            }

            // Close buttons in transaction modal
            const closeBtn = document.getElementById('transaction-modal-close-btn');
            const cancelBtn = document.getElementById('trans-cancel-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.hideModal('transaction-modal');
                });
            }
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    this.hideModal('transaction-modal');
                });
            }

            // Watch type switch changes to toggle categories select dropdown
            const expenseRadio = document.getElementById('type-expense');
            const incomeRadio = document.getElementById('type-income');
            if (expenseRadio && incomeRadio) {
                expenseRadio.addEventListener('change', () => {
                    this.updateModalCategories('expense');
                });
                incomeRadio.addEventListener('change', () => {
                    this.updateModalCategories('income');
                });
            }
        },

        // Populate transaction categories select menu based on selected type (income/expense)
        updateModalCategories(type, selectedCategory = '') {
            const select = document.getElementById('trans-category');
            if (!select) {
                return;
            }
            select.innerHTML = '';
            
            const list = this.state.categories[type];
            for (let i = 0; i < list.length; i++) {
                const categoryName = list[i];
                const option = document.createElement('option');
                option.value = categoryName;
                option.textContent = categoryName;
                if (categoryName === selectedCategory) {
                    option.selected = true;
                }
                select.appendChild(option);
            }
        },

        // --- Transaction Modal Add/Edit Actions ---
        openTransactionModal(transactionId = null) {
            const titleEl = document.getElementById('transaction-modal-title');
            const form = document.getElementById('transaction-form');
            
            // Set currency sign
            const currencyPrefix = document.querySelector('.modal-currency-prefix');
            if (currencyPrefix) {
                currencyPrefix.textContent = this.state.currency;
            }

            form.reset();
            document.getElementById('trans-id').value = '0';
            document.getElementById('trans-date').value = new Date().toISOString().substring(0, 10);
            
            // Set defaults (expense)
            document.getElementById('type-expense').checked = true;
            this.updateModalCategories('expense');

            if (transactionId) {
                titleEl.textContent = 'Edit Transaction';
                fetch(`/api/finance/transactions/${transactionId}`)
                    .then(response => response.json())
                    .then(transaction => {
                        document.getElementById('trans-id').value = transaction.id;
                        document.getElementById('trans-amount').value = transaction.amount;
                        document.getElementById('trans-date').value = transaction.date.substring(0, 10);
                        document.getElementById('trans-description').value = transaction.description;
                        
                        if (transaction.type === 'income') {
                            document.getElementById('type-income').checked = true;
                            this.updateModalCategories('income', transaction.category);
                        } else {
                            document.getElementById('type-expense').checked = true;
                            this.updateModalCategories('expense', transaction.category);
                        }
                        this.showModal('transaction-modal');
                    });
            } else {
                titleEl.textContent = 'Add Transaction';
                this.showModal('transaction-modal');
            }
        },

        // Save new or edited transaction to the database
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

            const payload = { 
                id: id, 
                type: type, 
                amount: amount, 
                category: category, 
                date: date, 
                description: description 
            };

            try {
                const response = await fetch('/api/finance/transactions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                if (response.ok) {
                    this.hideModal('transaction-modal');
                    
                    let successMessage = 'Transaction added successfully!';
                    if (id !== 0) {
                        successMessage = 'Transaction updated successfully!';
                    }
                    this.showAlert('Success', successMessage, 'success');
                    
                    const activeAction = window.location.pathname.split('/').pop() || 'Index';
                    this.refreshActivePage(activeAction);
                } else {
                    const err = await response.json();
                    this.showAlert('Error', err.message || 'Failed to save transaction.', 'danger');
                }
            } catch (error) {
                this.showAlert('Error', 'Failed to connect to API.', 'danger');
            }
        },

        // Delete a transaction by ID
        async deleteTransaction(transactionId) {
            const confirmMessage = 'Are you sure you want to delete this transaction?';
            this.showAlert('Confirm Delete', confirmMessage, 'danger', async () => {
                try {
                    const response = await fetch(`/api/finance/transactions/${transactionId}`, { 
                        method: 'DELETE' 
                    });
                    
                    if (response.ok) {
                        this.showAlert('Deleted', 'Transaction deleted successfully.', 'success');
                        
                        const activeAction = window.location.pathname.split('/').pop() || 'Index';
                        this.refreshActivePage(activeAction);
                    } else {
                        this.showAlert('Error', 'Failed to delete transaction.', 'danger');
                    }
                } catch (error) {
                    this.showAlert('Error', 'Failed to connect to API.', 'danger');
                }
            });
        },

        // Refresh grid lists depending on current active page
        refreshActivePage(actionName) {
            actionName = actionName.toLowerCase();
            if (actionName === 'index' || actionName === 'home' || actionName === '') {
                if (typeof this.initDashboard === 'function') {
                    this.initDashboard();
                }
            } else if (actionName === 'transactions') {
                if (typeof this.loadTransactionsList === 'function') {
                    this.loadTransactionsList();
                }
            } else if (actionName === 'budgets') {
                if (typeof this.loadBudgetsGrid === 'function') {
                    this.loadBudgetsGrid();
                }
            } else if (actionName === 'savings') {
                if (typeof this.loadSavingsGoals === 'function') {
                    this.loadSavingsGoals();
                }
            }
        }
    };

    window.AuraApp = AuraApp;
    
    document.addEventListener('DOMContentLoaded', () => {
        AuraApp.init();
    });
})();
