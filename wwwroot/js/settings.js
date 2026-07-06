/**
 * Aura Settings Module
 */

(function () {
    if (!window.AuraApp) return;

    const Settings = {
        async initSettings() {
            // Currency dropdown
            const currencySelect = document.getElementById('setting-currency');
            if (currencySelect) {
                currencySelect.value = this.state.currency;
                const newCurrencySelect = currencySelect.cloneNode(true);
                currencySelect.parentNode.replaceChild(newCurrencySelect, currencySelect);
                newCurrencySelect.addEventListener('change', (e) => {
                    this.state.currency = e.target.value;
                    localStorage.setItem('aura_currency', this.state.currency);
                    this.showAlert('Preferences Saved', `Base currency has been updated to "${this.state.currency}".`, 'success');
                });
            }

            // Category list load
            await this.fetchCategories();
            this.loadSettingsCategories();

            // Add Category form submission
            const addCatForm = document.getElementById('add-category-form');
            if (addCatForm) {
                const newForm = addCatForm.cloneNode(true);
                addCatForm.parentNode.replaceChild(newForm, addCatForm);
                newForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await this.saveCategory();
                });
            }

            // Export backup
            const exportBtn = document.getElementById('export-data-btn');
            if (exportBtn) {
                const newExportBtn = exportBtn.cloneNode(true);
                exportBtn.parentNode.replaceChild(newExportBtn, exportBtn);
                newExportBtn.addEventListener('click', () => {
                    window.location.href = '/api/finance/backup/export';
                });
            }

            // Import backup
            const fileInput = document.getElementById('import-file-input');
            if (fileInput) {
                const newFileInput = fileInput.cloneNode(true);
                fileInput.parentNode.replaceChild(newFileInput, fileInput);
                newFileInput.addEventListener('change', async (e) => {
                    const files = e.target.files;
                    if (files.length === 0) return;

                    const file = files[0];
                    const formData = new FormData();
                    formData.append('file', file);

                    this.showAlert('Import Backup', 'Are you sure you want to import this file? It will replace all existing transactions, budgets, and goals!', 'danger', async () => {
                        try {
                            const r = await fetch('/api/finance/backup/import', {
                                method: 'POST',
                                body: formData
                            });

                            if (r.ok) {
                                this.showAlert('Import Completed', 'Financial database restored successfully.', 'success');
                                await this.fetchCategories();
                                this.loadSettingsCategories();
                            } else {
                                const err = await r.json();
                                this.showAlert('Import Failed', err.message || 'Error occurred during parsing.', 'danger');
                            }
                        } catch (err) {
                            this.showAlert('Error', 'Connection to server failed.', 'danger');
                        }
                    });
                });
            }

            // Purge db
            const purgeBtn = document.getElementById('purge-data-btn');
            if (purgeBtn) {
                const newPurgeBtn = purgeBtn.cloneNode(true);
                purgeBtn.parentNode.replaceChild(newPurgeBtn, purgeBtn);
                newPurgeBtn.addEventListener('click', () => {
                    this.showAlert('Purge Database', 'WARNING: This will delete ALL database records forever! There is no recovery. Proceed?', 'danger', async () => {
                        try {
                            const r = await fetch('/api/finance/backup/purge', { method: 'POST' });
                            if (r.ok) {
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

        async loadSettingsCategories() {
            const incomeDiv = document.getElementById('settings-income-categories');
            const expenseDiv = document.getElementById('settings-expense-categories');
            if (!incomeDiv || !expenseDiv) return;

            incomeDiv.innerHTML = '';
            expenseDiv.innerHTML = '';

            const list = this.state.categories.rawList || [];
            list.forEach(c => {
                const item = document.createElement('div');
                item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 0.4rem 0.8rem; background: var(--input-bg); border: 1px solid var(--glass-border); border-radius: 8px; font-size: 0.9rem; margin-bottom: 0.4rem;';
                
                const nameSpan = document.createElement('span');
                nameSpan.textContent = c.name;
                item.appendChild(nameSpan);

                if (c.name !== 'Others') {
                    const delBtn = document.createElement('button');
                    delBtn.className = 'btn-icon delete-btn';
                    delBtn.innerHTML = '<i class="fa-solid fa-trash-can" style="font-size: 0.8rem;"></i>';
                    delBtn.title = 'Delete Category';
                    delBtn.addEventListener('click', () => this.deleteCategoryItem(c.id, c.name));
                    item.appendChild(delBtn);
                } else {
                    const lockIcon = document.createElement('span');
                    lockIcon.innerHTML = '<i class="fa-solid fa-lock" style="font-size: 0.8rem; opacity: 0.4;"></i>';
                    lockIcon.title = 'System Category';
                    item.appendChild(lockIcon);
                }

                if (c.type === 'income') {
                    incomeDiv.appendChild(item);
                } else {
                    expenseDiv.appendChild(item);
                }
            });
        },

        async saveCategory() {
            const nameEl = document.getElementById('new-cat-name');
            const typeEl = document.getElementById('new-cat-type');
            if (!nameEl || !typeEl) return;

            const name = nameEl.value.trim();
            const type = typeEl.value;

            if (!name) return;

            try {
                const r = await fetch('/api/finance/categories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: 0, name, type })
                });

                if (r.ok) {
                    nameEl.value = '';
                    this.showAlert('Category Added', `Category '${name}' created successfully.`, 'success');
                    await this.fetchCategories();
                    this.loadSettingsCategories();
                } else {
                    const err = await r.json();
                    this.showAlert('Error', err.message || 'Failed to add category.', 'danger');
                }
            } catch (e) {
                this.showAlert('Error', 'API request failed.', 'danger');
            }
        },

        async deleteCategoryItem(id, name) {
            this.showAlert('Delete Category', `Are you sure you want to delete category '${name}'? Any transaction using this category will be changed to 'Others'.`, 'danger', async () => {
                try {
                    const r = await fetch(`/api/finance/categories/${id}`, { method: 'DELETE' });
                    if (r.ok) {
                        this.showAlert('Deleted', `Category '${name}' deleted successfully.`, 'success');
                        await this.fetchCategories();
                        this.loadSettingsCategories();
                    } else {
                        const err = await r.json();
                        this.showAlert('Error', err.message || 'Failed to delete category.', 'danger');
                    }
                } catch (e) {
                    this.showAlert('Error', 'API request failed.', 'danger');
                }
            });
        }
    };

    Object.assign(window.AuraApp, Settings);
})();
