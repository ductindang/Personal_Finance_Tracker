/**
 * Aura Settings Module
 */

(function () {
    // Check if the main application namespace exists
    if (!window.AuraApp) {
        return;
    }

    const Settings = {
        // Initialize all settings page inputs, buttons, and form triggers
        async initSettings() {
            // Currency select dropdown setting
            const currencySelect = document.getElementById('setting-currency');
            if (currencySelect) {
                currencySelect.value = this.state.currency;
                currencySelect.addEventListener('change', (event) => {
                    this.state.currency = event.target.value;
                    localStorage.setItem('aura_currency', this.state.currency);
                    
                    const successMsg = `Base currency has been updated to "${this.state.currency}".`;
                    this.showAlert('Preferences Saved', successMsg, 'success');
                });
            }

            // Category list load
            await this.fetchCategories();
            this.loadSettingsCategories();

            // Add Category form submission trigger
            const addCatForm = document.getElementById('add-category-form');
            if (addCatForm) {
                addCatForm.addEventListener('submit', async (event) => {
                    event.preventDefault();
                    await this.saveCategory();
                });
            }

            // Export backup button trigger
            const exportBtn = document.getElementById('export-data-btn');
            if (exportBtn) {
                exportBtn.addEventListener('click', () => {
                    window.location.href = '/api/finance/backup/export';
                });
            }

            // Import backup file input trigger
            const fileInput = document.getElementById('import-file-input');
            if (fileInput) {
                fileInput.addEventListener('change', async (event) => {
                    const files = event.target.files;
                    if (files.length === 0) {
                        return;
                    }

                    const file = files[0];
                    const formData = new FormData();
                    formData.append('file', file);

                    const warningMsg = 'Are you sure you want to import this file? It will replace all existing transactions, budgets, and goals!';
                    this.showAlert('Import Backup', warningMsg, 'danger', async () => {
                        try {
                            const response = await fetch('/api/finance/backup/import', {
                                method: 'POST',
                                body: formData
                            });

                            if (response.ok) {
                                this.showAlert('Import Completed', 'Financial database restored successfully.', 'success');
                                await this.fetchCategories();
                                this.loadSettingsCategories();
                            } else {
                                const err = await response.json();
                                this.showAlert('Import Failed', err.message || 'Error occurred during parsing.', 'danger');
                            }
                        } catch (err) {
                            this.showAlert('Error', 'Connection to server failed.', 'danger');
                        }
                    });
                });
            }

            // Purge db database trigger
            const purgeBtn = document.getElementById('purge-data-btn');
            if (purgeBtn) {
                purgeBtn.addEventListener('click', () => {
                    const warningMsg = 'WARNING: This will delete ALL database records forever! There is no recovery. Proceed?';
                    this.showAlert('Purge Database', warningMsg, 'danger', async () => {
                        try {
                            const response = await fetch('/api/finance/backup/purge', { 
                                method: 'POST' 
                            });
                            if (response.ok) {
                                this.showAlert('Database Purged', 'All transactions, budgets, and goals have been wiped.', 'success');
                                await this.fetchCategories();
                                this.loadSettingsCategories();
                            } else {
                                this.showAlert('Error', 'Purge failed.', 'danger');
                            }
                        } catch (err) {
                            this.showAlert('Error', 'API request failed.', 'danger');
                        }
                    });
                });
            }
        },

        // Render income/expense categories lists dynamically inside lists container
        loadSettingsCategories() {
            const incomeDiv = document.getElementById('settings-income-categories');
            const expenseDiv = document.getElementById('settings-expense-categories');
            if (!incomeDiv || !expenseDiv) {
                return;
            }

            incomeDiv.innerHTML = '';
            expenseDiv.innerHTML = '';

            const list = this.state.categories.rawList || [];
            for (let i = 0; i < list.length; i++) {
                const category = list[i];
                const item = document.createElement('div');
                item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 0.4rem 0.8rem; background: var(--input-bg); border: 1px solid var(--glass-border); border-radius: 8px; font-size: 0.9rem; margin-bottom: 0.4rem;';
                
                const nameSpan = document.createElement('span');
                nameSpan.textContent = category.name;
                item.appendChild(nameSpan);

                // Lock core system category ('Others') from deletion
                if (category.name !== 'Others') {
                    const delBtn = document.createElement('button');
                    delBtn.className = 'btn-icon delete-btn';
                    delBtn.innerHTML = '<i class="fa-solid fa-trash-can" style="font-size: 0.8rem;"></i>';
                    delBtn.title = 'Delete Category';
                    delBtn.addEventListener('click', () => {
                        this.deleteCategoryItem(category.id, category.name);
                    });
                    item.appendChild(delBtn);
                } else {
                    const lockIcon = document.createElement('span');
                    lockIcon.innerHTML = '<i class="fa-solid fa-lock" style="font-size: 0.8rem; opacity: 0.4;"></i>';
                    lockIcon.title = 'System Category';
                    item.appendChild(lockIcon);
                }

                if (category.type === 'income') {
                    incomeDiv.appendChild(item);
                } else {
                    expenseDiv.appendChild(item);
                }
            }
        },

        // Create new category record and save to database
        async saveCategory() {
            const nameEl = document.getElementById('new-cat-name');
            const typeEl = document.getElementById('new-cat-type');
            if (!nameEl || !typeEl) {
                return;
            }

            const categoryName = nameEl.value.trim();
            const categoryType = typeEl.value;

            if (!categoryName) {
                return;
            }

            try {
                const response = await fetch('/api/finance/categories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        id: 0, 
                        name: categoryName, 
                        type: categoryType 
                    })
                });

                if (response.ok) {
                    nameEl.value = '';
                    this.showAlert('Category Added', `Category '${categoryName}' created successfully.`, 'success');
                    await this.fetchCategories();
                    this.loadSettingsCategories();
                } else {
                    const err = await response.json();
                    this.showAlert('Error', err.message || 'Failed to add category.', 'danger');
                }
            } catch (error) {
                this.showAlert('Error', 'API request failed.', 'danger');
            }
        },

        // Delete custom category record from database
        async deleteCategoryItem(categoryId, categoryName) {
            const confirmMsg = `Are you sure you want to delete category '${categoryName}'? Any transaction using this category will be changed to 'Others'.`;
            this.showAlert('Delete Category', confirmMsg, 'danger', async () => {
                try {
                    const response = await fetch(`/api/finance/categories/${categoryId}`, { 
                        method: 'DELETE' 
                    });
                    if (response.ok) {
                        this.showAlert('Deleted', `Category '${categoryName}' deleted successfully.`, 'success');
                        await this.fetchCategories();
                        this.loadSettingsCategories();
                    } else {
                        const err = await response.json();
                        this.showAlert('Error', err.message || 'Failed to delete category.', 'danger');
                    }
                } catch (error) {
                    this.showAlert('Error', 'API request failed.', 'danger');
                }
            });
        }
    };

    // Attach Settings module to global application context
    Object.assign(window.AuraApp, Settings);
})();
