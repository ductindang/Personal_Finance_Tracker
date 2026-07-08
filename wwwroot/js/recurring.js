/**
 * Aura Recurring Transactions Manager Module
 */

(function () {
    // Check if the main application namespace exists
    if (!window.AuraApp) {
        return;
    }

    const Recurring = {
        initRecurring() {
            // Setup selectors
            const addBtn = document.getElementById('add-recurring-btn');
            const closeBtn = document.getElementById('recurring-modal-close-btn');
            const cancelBtn = document.getElementById('rec-cancel-btn');
            const form = document.getElementById('recurring-form');
            const typeRadios = document.getElementsByName('rec-type');

            // Add config trigger
            if (addBtn) {
                addBtn.addEventListener('click', () => this.openRecurringModal(0));
            }

            // Modal cancel/close triggers
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.hideModal('recurring-modal'));
            }
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => this.hideModal('recurring-modal'));
            }

            // Radio button type change category populations
            for (let i = 0; i < typeRadios.length; i++) {
                typeRadios[i].addEventListener('change', (e) => {
                    this.populateCategories(e.target.value);
                });
            }

            // Form Submit hook
            if (form) {
                form.addEventListener('submit', (e) => this.saveRecurring(e));
            }

            this.loadRecurringList();
        },

        // Fetch recurring transactions and compute metrics
        async loadRecurringList() {
            const tbody = document.getElementById('recurring-tbody');
            if (!tbody) return;

            try {
                const response = await fetch('/api/finance/recurring');
                if (response.ok) {
                    const data = await response.json();
                    tbody.innerHTML = '';

                    let activeCount = 0;
                    let totalInflow = 0;
                    let totalOutflow = 0;

                    if (data.length === 0) {
                        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 2rem;">No recurring configurations found.</td></tr>`;
                        this.updateMetricsUI(0, 0, 0);
                        return;
                    }

                    // Render rows
                    for (let i = 0; i < data.length; i++) {
                        const rec = data[i];
                        const tr = document.createElement('tr');

                        const startObj = new Date(rec.startDate);
                        const startStr = startObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

                        const nextObj = new Date(rec.nextOccurrence);
                        const nextStr = nextObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

                        let amountClass = 'amount-expense';
                        let badgeClass = 'badge-expense';
                        let typeSign = '-';
                        if (rec.type === 'income') {
                            amountClass = 'amount-income';
                            badgeClass = 'badge-income';
                            typeSign = '+';
                        }

                        const statusBadge = rec.isActive 
                            ? '<span class="badge badge-active">Active</span>' 
                            : '<span class="badge badge-inactive">Inactive</span>';

                        tr.innerHTML = `
                            <td>${rec.description}</td>
                            <td><span class="badge ${badgeClass}">${rec.category}</span></td>
                            <td>${rec.frequency}</td>
                            <td class="${amountClass}">${typeSign}${this.formatCurrency(rec.amount)}</td>
                            <td>${rec.isActive ? nextStr : '-'}</td>
                            <td>${statusBadge}</td>
                            <td>
                                <div class="row-actions">
                                    <button class="btn-icon edit-btn" data-id="${rec.id}" title="Edit">
                                        <i class="fa-solid fa-pen-to-square"></i>
                                    </button>
                                    <button class="btn-icon delete-btn" data-id="${rec.id}" title="Delete">
                                        <i class="fa-solid fa-trash-can"></i>
                                    </button>
                                </div>
                            </td>
                        `;

                        // Bind actions
                        tr.querySelector('.edit-btn').addEventListener('click', () => {
                            this.openRecurringModal(rec.id);
                        });
                        tr.querySelector('.delete-btn').addEventListener('click', () => {
                            this.deleteRecurring(rec.id);
                        });

                        tbody.appendChild(tr);

                        // Accumulate metrics if configuration is active
                        if (rec.isActive) {
                            activeCount++;

                            // Approximate monthly normalization
                            let monthlyFactor = 1;
                            switch (rec.frequency) {
                                case 'Daily':
                                    monthlyFactor = 30;
                                    break;
                                case 'Weekly':
                                    monthlyFactor = 4.33; // Approx 52 weeks / 12 months
                                    break;
                                case 'Monthly':
                                    monthlyFactor = 1;
                                    break;
                                case 'Yearly':
                                    monthlyFactor = 1 / 12.0;
                                    break;
                            }

                            if (rec.type === 'income') {
                                totalInflow += rec.amount * monthlyFactor;
                            } else {
                                totalOutflow += rec.amount * monthlyFactor;
                            }
                        }
                    }

                    this.updateMetricsUI(activeCount, totalInflow, totalOutflow);
                }
            } catch (error) {
                console.error('Failed to load recurring transactions list', error);
            }
        },

        updateMetricsUI(active, inflow, outflow) {
            const activeEl = document.getElementById('metric-active-count');
            const inflowEl = document.getElementById('metric-total-inflow');
            const outflowEl = document.getElementById('metric-total-outflow');

            if (activeEl) activeEl.textContent = active;
            if (inflowEl) inflowEl.textContent = this.formatCurrency(inflow);
            if (outflowEl) outflowEl.textContent = this.formatCurrency(outflow);
        },

        // Dynamically populate categories dropdown based on type selection
        populateCategories(type, selectedCategory = "") {
            const selectEl = document.getElementById('rec-category');
            if (!selectEl) return;

            selectEl.innerHTML = '';
            const catsList = type === 'income' ? this.state.categories.income : this.state.categories.expense;

            for (let i = 0; i < catsList.length; i++) {
                const opt = document.createElement('option');
                opt.value = catsList[i];
                opt.textContent = catsList[i];
                if (catsList[i] === selectedCategory) {
                    opt.selected = true;
                }
                selectEl.appendChild(opt);
            }
        },

        // Open modal for add or edit
        async openRecurringModal(id) {
            const modalTitle = document.getElementById('recurring-modal-title');
            const recIdInput = document.getElementById('rec-id');
            const typeExpense = document.getElementById('rec-type-expense');
            const typeIncome = document.getElementById('rec-type-income');
            const amountInput = document.getElementById('rec-amount');
            const frequencyInput = document.getElementById('rec-frequency');
            const startDateInput = document.getElementById('rec-startdate');
            const endDateInput = document.getElementById('rec-enddate');
            const descriptionInput = document.getElementById('rec-description');
            const isActiveInput = document.getElementById('rec-isactive');

            if (id === 0) {
                // Add mode
                if (modalTitle) modalTitle.textContent = 'Add Recurring Transaction';
                if (recIdInput) recIdInput.value = '';
                if (typeExpense) typeExpense.checked = true;
                this.populateCategories('expense');
                if (amountInput) amountInput.value = '';
                if (frequencyInput) frequencyInput.value = 'Monthly';
                if (startDateInput) startDateInput.value = new Date().toISOString().substring(0, 10);
                if (endDateInput) endDateInput.value = '';
                if (descriptionInput) descriptionInput.value = '';
                if (isActiveInput) isActiveInput.checked = true;

                this.showModal('recurring-modal');
            } else {
                // Edit mode
                if (modalTitle) modalTitle.textContent = 'Edit Recurring Transaction';
                try {
                    const response = await fetch(`/api/finance/recurring/${id}`);
                    if (response.ok) {
                        const rec = await response.json();
                        if (recIdInput) recIdInput.value = rec.id;
                        if (rec.type === 'income') {
                            if (typeIncome) typeIncome.checked = true;
                        } else {
                            if (typeExpense) typeExpense.checked = true;
                        }

                        this.populateCategories(rec.type, rec.category);

                        if (amountInput) amountInput.value = rec.amount;
                        if (frequencyInput) frequencyInput.value = rec.frequency;
                        if (startDateInput) startDateInput.value = new Date(rec.startDate).toISOString().substring(0, 10);
                        if (endDateInput) {
                            endDateInput.value = rec.endDate ? new Date(rec.endDate).toISOString().substring(0, 10) : '';
                        }
                        if (descriptionInput) descriptionInput.value = rec.description;
                        if (isActiveInput) isActiveInput.checked = rec.isActive;

                        this.showModal('recurring-modal');
                    }
                } catch (error) {
                    console.error('Failed to load recurring details', error);
                }
            }
        },

        // Save (create or edit) recurring transaction configuration
        async saveRecurring(e) {
            e.preventDefault();

            const recIdInput = document.getElementById('rec-id');
            const typeInput = document.querySelector('input[name="rec-type"]:checked');
            const amountInput = document.getElementById('rec-amount');
            const categoryInput = document.getElementById('rec-category');
            const frequencyInput = document.getElementById('rec-frequency');
            const startDateInput = document.getElementById('rec-startdate');
            const endDateInput = document.getElementById('rec-enddate');
            const descriptionInput = document.getElementById('rec-description');
            const isActiveInput = document.getElementById('rec-isactive');

            const payload = {
                id: recIdInput.value ? parseInt(recIdInput.value) : 0,
                type: typeInput ? typeInput.value : 'expense',
                amount: parseFloat(amountInput.value),
                category: categoryInput ? categoryInput.value : 'Others',
                frequency: frequencyInput ? frequencyInput.value : 'Monthly',
                startDate: new Date(startDateInput.value).toISOString(),
                endDate: endDateInput.value ? new Date(endDateInput.value).toISOString() : null,
                description: descriptionInput.value,
                isActive: isActiveInput ? isActiveInput.checked : true
            };

            try {
                const response = await fetch('/api/finance/recurring', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        this.hideModal('recurring-modal');
                        this.showAlert('Success', 'Recurring configuration saved successfully.', 'success');
                        this.loadRecurringList();
                    } else {
                        this.showAlert('Error', result.message || 'Failed to save configuration.', 'danger');
                    }
                } else {
                    const err = await response.json();
                    this.showAlert('Error', err.message || 'Failed to save configuration.', 'danger');
                }
            } catch (error) {
                console.error('Failed to save recurring configuration', error);
                this.showAlert('Error', 'Network error occured while saving configuration.', 'danger');
            }
        },

        // Delete recurring configuration
        deleteRecurring(id) {
            this.showAlert(
                'Confirm Deletion', 
                'Are you sure you want to delete this recurring transaction configuration?', 
                'danger',
                async () => {
                    try {
                        const response = await fetch(`/api/finance/recurring/${id}`, {
                            method: 'DELETE'
                        });

                        if (response.ok) {
                            const result = await response.json();
                            if (result.success) {
                                this.showAlert('Success', 'Recurring transaction configuration deleted.', 'success');
                                this.loadRecurringList();
                            } else {
                                this.showAlert('Error', 'Failed to delete configuration.', 'danger');
                            }
                        }
                    } catch (error) {
                        console.error('Failed to delete recurring configuration', error);
                    }
                },
                () => {} // Cancel callback do nothing
            );
        }
    };

    // Attach to global application namespace
    Object.assign(window.AuraApp, Recurring);
})();
