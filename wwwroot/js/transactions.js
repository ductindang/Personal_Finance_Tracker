/**
 * Aura Transactions Manager Module
 */

(function () {
    if (!window.AuraApp) return;

    const Transactions = {
        initTransactions() {
            // Fill Categories select filter
            const filterCat = document.getElementById('filter-category');
            if (filterCat) {
                filterCat.innerHTML = '<option value="all">All Categories</option>';
                const allCats = [...this.state.categories.income, ...this.state.categories.expense];
                const uniqueCats = [...new Set(allCats)];
                uniqueCats.forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c;
                    opt.textContent = c;
                    filterCat.appendChild(opt);
                });
            }

            // Register Filters handlers
            const searchInput = document.getElementById('filter-search');
            const typeInput = document.getElementById('filter-type');
            const catInput = document.getElementById('filter-category');
            const dateFromInput = document.getElementById('filter-date-from');
            const dateToInput = document.getElementById('filter-date-to');
            const resetBtn = document.getElementById('reset-filters-btn');

            let searchTimeout;
            const filterChangeHandler = () => {
                this.state.transactions.page = 1;
                this.state.transactions.filters = {
                    search: searchInput ? searchInput.value : '',
                    type: typeInput ? typeInput.value : 'all',
                    category: catInput ? catInput.value : 'all',
                    dateFrom: dateFromInput ? dateFromInput.value : '',
                    dateTo: dateToInput ? dateToInput.value : ''
                };
                this.loadTransactionsList();
            };

            if (searchInput) {
                searchInput.addEventListener('input', () => {
                    clearTimeout(searchTimeout);
                    searchTimeout = setTimeout(filterChangeHandler, 400);
                });
            }

            [typeInput, catInput, dateFromInput, dateToInput].forEach(el => {
                if (el) el.addEventListener('change', filterChangeHandler);
            });

            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    if (searchInput) searchInput.value = '';
                    if (typeInput) typeInput.value = 'all';
                    if (catInput) catInput.value = 'all';
                    if (dateFromInput) dateFromInput.value = '';
                    if (dateToInput) dateToInput.value = '';
                    filterChangeHandler();
                });
            }

            // Paginated Buttons listeners
            const prevBtn = document.getElementById('prev-page-btn');
            const nextBtn = document.getElementById('next-page-btn');

            if (prevBtn) {
                // Remove existing to avoid duplicate handlers
                const newPrev = prevBtn.cloneNode(true);
                prevBtn.parentNode.replaceChild(newPrev, prevBtn);
                newPrev.addEventListener('click', () => {
                    if (this.state.transactions.page > 1) {
                        this.state.transactions.page--;
                        this.loadTransactionsList();
                    }
                });
            }

            if (nextBtn) {
                const newNext = nextBtn.cloneNode(true);
                nextBtn.parentNode.replaceChild(newNext, nextBtn);
                newNext.addEventListener('click', () => {
                    const totalPages = Math.ceil(this.state.transactions.total / this.state.transactions.pageSize);
                    if (this.state.transactions.page < totalPages) {
                        this.state.transactions.page++;
                        this.loadTransactionsList();
                    }
                });
            }

            this.loadTransactionsList();
        },

        async loadTransactionsList() {
            const tbody = document.getElementById('transactions-tbody');
            if (!tbody) return;

            const { page, pageSize, filters } = this.state.transactions;
            const queryUrl = `/api/finance/transactions?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(filters.search)}&type=${filters.type}&category=${filters.category}&dateFrom=${filters.dateFrom}&dateTo=${filters.dateTo}`;

            try {
                const r = await fetch(queryUrl);
                if (r.ok) {
                    const res = await r.json();
                    this.state.transactions.total = res.total;
                    this.state.transactions.data = res.data;

                    tbody.innerHTML = '';

                    if (res.data.length === 0) {
                        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 2rem;">No matching transactions found.</td></tr>`;
                        this.updatePaginationUI(0, 0, 0);
                        return;
                    }

                    res.data.forEach(t => {
                        const tr = document.createElement('tr');
                        const dateStr = new Date(t.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                        const sign = t.type === 'income' ? '+' : '-';
                        const amountClass = t.type === 'income' ? 'amount-income' : 'amount-expense';

                        tr.innerHTML = `
                            <td>${t.description}</td>
                            <td><span class="badge badge-category">${t.category}</span></td>
                            <td>${dateStr}</td>
                            <td class="${amountClass}">${sign}${this.formatCurrency(t.amount)}</td>
                            <td>
                                <div class="row-actions">
                                    <button class="btn-icon edit-btn" data-id="${t.id}" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                                    <button class="btn-icon delete-btn" data-id="${t.id}" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
                                </div>
                            </td>
                        `;

                        tr.querySelector('.edit-btn').addEventListener('click', () => this.openTransactionModal(t.id));
                        tr.querySelector('.delete-btn').addEventListener('click', () => this.deleteTransaction(t.id));

                        tbody.appendChild(tr);
                    });

                    const startIdx = (page - 1) * pageSize + 1;
                    const endIdx = Math.min(startIdx + res.data.length - 1, res.total);
                    this.updatePaginationUI(startIdx, endIdx, res.total);
                }
            } catch (e) {
                console.error('Failed to load transactions list', e);
            }
        },

        updatePaginationUI(start, end, total) {
            const startEl = document.getElementById('paginated-start');
            const endEl = document.getElementById('paginated-end');
            const totalEl = document.getElementById('paginated-total');
            const pageNumEl = document.getElementById('page-num');
            const prevBtn = document.getElementById('prev-page-btn');
            const nextBtn = document.getElementById('next-page-btn');

            if (startEl) startEl.textContent = start;
            if (endEl) endEl.textContent = end;
            if (totalEl) totalEl.textContent = total;
            if (pageNumEl) pageNumEl.textContent = this.state.transactions.page;

            if (prevBtn) prevBtn.disabled = this.state.transactions.page <= 1;
            if (nextBtn) {
                const totalPages = Math.ceil(total / this.state.transactions.pageSize);
                nextBtn.disabled = this.state.transactions.page >= totalPages || total === 0;
            }
        }
    };

    Object.assign(window.AuraApp, Transactions);
})();
