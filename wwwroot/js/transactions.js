/**
 * Aura Transactions Manager Module
 */

(function () {
    // Check if the main application namespace exists
    if (!window.AuraApp) {
        return;
    }

    const Transactions = {
        // Initialize filters, pagination controls, and query lists on load
        initTransactions() {
            // Fill Categories select filter dropdown dynamically
            const filterCat = document.getElementById('filter-category');
            if (filterCat) {
                filterCat.innerHTML = '<option value="all">All Categories</option>';
                
                // Merge income and expense categories into single flat array
                const allCats = [];
                const incomeCats = this.state.categories.income;
                const expenseCats = this.state.categories.expense;
                
                for (let i = 0; i < incomeCats.length; i++) {
                    allCats.push(incomeCats[i]);
                }
                for (let i = 0; i < expenseCats.length; i++) {
                    allCats.push(expenseCats[i]);
                }
                
                // Keep unique entries
                const uniqueCats = [...new Set(allCats)];
                for (let i = 0; i < uniqueCats.length; i++) {
                    const categoryName = uniqueCats[i];
                    const opt = document.createElement('option');
                    opt.value = categoryName;
                    opt.textContent = categoryName;
                    filterCat.appendChild(opt);
                }
            }

            // Target HTML filter controls
            const searchInput = document.getElementById('filter-search');
            const typeInput = document.getElementById('filter-type');
            const catInput = document.getElementById('filter-category');
            const dateFromInput = document.getElementById('filter-date-from');
            const dateToInput = document.getElementById('filter-date-to');
            const resetBtn = document.getElementById('reset-filters-btn');

            let searchTimeout;
            const filterChangeHandler = () => {
                this.state.transactions.page = 1; // Reset to page 1 on filter modification
                this.state.transactions.filters = {
                    search: searchInput ? searchInput.value : '',
                    type: typeInput ? typeInput.value : 'all',
                    category: catInput ? catInput.value : 'all',
                    dateFrom: dateFromInput ? dateFromInput.value : '',
                    dateTo: dateToInput ? dateToInput.value : ''
                };
                this.loadTransactionsList();
            };

            // Implement a debounce input search wrapper (wait 400ms after user stops typing)
            if (searchInput) {
                searchInput.addEventListener('input', () => {
                    clearTimeout(searchTimeout);
                    searchTimeout = setTimeout(filterChangeHandler, 400);
                });
            }

            // Bind change handlers
            const inputsList = [typeInput, catInput, dateFromInput, dateToInput];
            for (let i = 0; i < inputsList.length; i++) {
                const inputElement = inputsList[i];
                if (inputElement) {
                    inputElement.addEventListener('change', filterChangeHandler);
                }
            }

            // Click reset filter button actions
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    if (searchInput) {
                        searchInput.value = '';
                    }
                    if (typeInput) {
                        typeInput.value = 'all';
                    }
                    if (catInput) {
                        catInput.value = 'all';
                    }
                    if (dateFromInput) {
                        dateFromInput.value = '';
                    }
                    if (dateToInput) {
                        dateToInput.value = '';
                    }
                    filterChangeHandler();
                });
            }

            // Paginated Buttons listeners
            const prevBtn = document.getElementById('prev-page-btn');
            const nextBtn = document.getElementById('next-page-btn');

            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    if (this.state.transactions.page > 1) {
                        this.state.transactions.page--;
                        this.loadTransactionsList();
                    }
                });
            }

            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    const totalPages = Math.ceil(this.state.transactions.total / this.state.transactions.pageSize);
                    if (this.state.transactions.page < totalPages) {
                        this.state.transactions.page++;
                        this.loadTransactionsList();
                    }
                });
            }

            this.loadTransactionsList();
        },

        // Fetch transaction items with active filters applied and output to list layout
        async loadTransactionsList() {
            const tbody = document.getElementById('transactions-tbody');
            if (!tbody) {
                return;
            }

            const page = this.state.transactions.page;
            const pageSize = this.state.transactions.pageSize;
            const filters = this.state.transactions.filters;
            
            const searchParam = encodeURIComponent(filters.search);
            const queryUrl = `/api/finance/transactions?page=${page}&pageSize=${pageSize}&search=${searchParam}&type=${filters.type}&category=${filters.category}&dateFrom=${filters.dateFrom}&dateTo=${filters.dateTo}`;

            try {
                const response = await fetch(queryUrl);
                if (response.ok) {
                    const result = await response.json();
                    this.state.transactions.total = result.total;
                    this.state.transactions.data = result.data;

                    tbody.innerHTML = ''; // Clear older contents

                    if (result.data.length === 0) {
                        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 2rem;">No matching transactions found.</td></tr>`;
                        this.updatePaginationUI(0, 0, 0);
                        return;
                    }

                    // Render rows
                    for (let i = 0; i < result.data.length; i++) {
                        const transaction = result.data[i];
                        const tr = document.createElement('tr');
                        
                        const dateObj = new Date(transaction.date);
                        const dateStr = dateObj.toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                        });
                        
                        let sign = '-';
                        let amountClass = 'amount-expense';
                        if (transaction.type === 'income') {
                            sign = '+';
                            amountClass = 'amount-income';
                        }

                        tr.innerHTML = `
                            <td>${transaction.description}</td>
                            <td><span class="badge badge-category">${transaction.category}</span></td>
                            <td>${dateStr}</td>
                            <td class="${amountClass}">${sign}${this.formatCurrency(transaction.amount)}</td>
                            <td>
                                <div class="row-actions">
                                    <button class="btn-icon edit-btn" data-id="${transaction.id}" title="Edit">
                                        <i class="fa-solid fa-pen-to-square"></i>
                                    </button>
                                    <button class="btn-icon delete-btn" data-id="${transaction.id}" title="Delete">
                                        <i class="fa-solid fa-trash-can"></i>
                                    </button>
                                </div>
                            </td>
                        `;

                        // Bind actions
                        tr.querySelector('.edit-btn').addEventListener('click', () => {
                            this.openTransactionModal(transaction.id);
                        });
                        tr.querySelector('.delete-btn').addEventListener('click', () => {
                            this.deleteTransaction(transaction.id);
                        });

                        tbody.appendChild(tr);
                    }

                    const startIdx = (page - 1) * pageSize + 1;
                    const endIdx = Math.min(startIdx + result.data.length - 1, result.total);
                    this.updatePaginationUI(startIdx, endIdx, result.total);
                }
            } catch (error) {
                console.error('Failed to load transactions list', error);
            }
        },

        // Update status of page counts, limits and disable next/previous button hooks
        updatePaginationUI(start, end, total) {
            const startEl = document.getElementById('paginated-start');
            const endEl = document.getElementById('paginated-end');
            const totalEl = document.getElementById('paginated-total');
            const pageNumEl = document.getElementById('page-num');
            const prevBtn = document.getElementById('prev-page-btn');
            const nextBtn = document.getElementById('next-page-btn');

            if (startEl) {
                startEl.textContent = start;
            }
            if (endEl) {
                endEl.textContent = end;
            }
            if (totalEl) {
                totalEl.textContent = total;
            }
            if (pageNumEl) {
                pageNumEl.textContent = this.state.transactions.page;
            }

            if (prevBtn) {
                prevBtn.disabled = this.state.transactions.page <= 1;
            }
            if (nextBtn) {
                const totalPages = Math.ceil(total / this.state.transactions.pageSize);
                nextBtn.disabled = this.state.transactions.page >= totalPages || total === 0;
            }
        }
    };

    // Attach to global application namespace
    Object.assign(window.AuraApp, Transactions);
})();
