/**
 * Aura Dashboard Page Module
 */

(function () {
    if (!window.AuraApp) return;

    const Dashboard = {
        async initDashboard() {
            await this.loadDashboardSummary();
            await this.loadDashboardCharts();
            await this.loadRecentTransactions();
        },

        async loadDashboardSummary() {
            try {
                const r = await fetch('/api/finance/summary');
                if (r.ok) {
                    const s = await r.json();
                    const balanceEl = document.getElementById('dash-balance');
                    const incomeEl = document.getElementById('dash-income');
                    const expenseEl = document.getElementById('dash-expense');
                    
                    if (balanceEl) balanceEl.textContent = this.formatCurrency(s.balance);
                    if (incomeEl) incomeEl.textContent = this.formatCurrency(s.income);
                    if (expenseEl) expenseEl.textContent = this.formatCurrency(s.expense);
                }
            } catch (e) {
                console.error('Failed to load dashboard summary', e);
            }
        },

        async loadRecentTransactions() {
            const tbody = document.getElementById('recent-transactions-tbody');
            if (!tbody) return;

            try {
                const r = await fetch('/api/finance/transactions/recent');
                if (r.ok) {
                    const list = await r.json();
                    tbody.innerHTML = '';

                    if (list.length === 0) {
                        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">No transactions recorded. Click "Add Transaction" to start.</td></tr>`;
                        return;
                    }

                    list.forEach(t => {
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
                                <button class="btn-icon delete-btn" title="Delete" data-id="${t.id}">
                                    <i class="fa-solid fa-trash-can"></i>
                                </button>
                            </td>
                        `;
                        
                        tr.querySelector('.delete-btn').addEventListener('click', () => this.deleteTransaction(t.id));
                        tbody.appendChild(tr);
                    });
                }
            } catch (e) {
                console.error('Failed to load recent transactions', e);
            }
        },

        async loadDashboardCharts() {
            try {
                const transResponse = await fetch('/api/finance/transactions?pageSize=1000');
                if (!transResponse.ok) return;

                const transObj = await transResponse.json();
                const list = transObj.data;

                // 1. Prepare Category Expense Chart Data
                const expensesByCategory = {};
                this.state.categories.expense.forEach(c => expensesByCategory[c] = 0);

                list.filter(t => t.type === 'expense').forEach(t => {
                    if (expensesByCategory[t.category] !== undefined) {
                        expensesByCategory[t.category] += t.amount;
                    } else {
                        expensesByCategory['Others'] = (expensesByCategory['Others'] || 0) + t.amount;
                    }
                });

                const catLabels = Object.keys(expensesByCategory).filter(c => expensesByCategory[c] > 0);
                const catData = catLabels.map(c => expensesByCategory[c]);

                // 2. Prepare Cash Flow Chart Data (last 6 months)
                const monthlyData = {};
                for (let i = 5; i >= 0; i--) {
                    const d = new Date();
                    d.setMonth(d.getMonth() - i);
                    const key = d.toISOString().substring(0, 7); // YYYY-MM
                    monthlyData[key] = { monthLabel: d.toLocaleDateString('en-US', { month: 'short' }), income: 0, expense: 0 };
                }

                list.forEach(t => {
                    const key = t.date.substring(0, 7);
                    if (monthlyData[key]) {
                        if (t.type === 'income') monthlyData[key].income += t.amount;
                        else monthlyData[key].expense += t.amount;
                    }
                });

                const months = Object.keys(monthlyData);
                const barLabels = months.map(m => monthlyData[m].monthLabel);
                const incomeData = months.map(m => monthlyData[m].income);
                const expenseData = months.map(m => monthlyData[m].expense);

                // Setup Themes specific colors
                const isLight = this.state.theme === 'light';
                const gridColor = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';
                const labelColor = isLight ? '#4b5563' : '#9ca3af';

                // Chart 1: Cashflow (Bar chart)
                const cashflowCtx = document.getElementById('cashflowChart');
                if (cashflowCtx) {
                    if (this.charts.cashflow) this.charts.cashflow.destroy();

                    this.charts.cashflow = new Chart(cashflowCtx, {
                        type: 'bar',
                        data: {
                            labels: barLabels,
                            datasets: [
                                {
                                    label: 'Income',
                                    data: incomeData,
                                    backgroundColor: 'rgba(16, 185, 129, 0.75)',
                                    borderRadius: 6,
                                },
                                {
                                    label: 'Expense',
                                    data: expenseData,
                                    backgroundColor: 'rgba(239, 68, 68, 0.75)',
                                    borderRadius: 6,
                                }
                            ]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { labels: { color: labelColor } }
                            },
                            scales: {
                                x: { grid: { color: gridColor }, ticks: { color: labelColor } },
                                y: { grid: { color: gridColor }, ticks: { color: labelColor } }
                            }
                        }
                    });
                }

                // Chart 2: Category distribution (Doughnut)
                const categoryCtx = document.getElementById('categoryChart');
                if (categoryCtx) {
                    if (this.charts.category) this.charts.category.destroy();

                    if (catLabels.length === 0) {
                        this.charts.category = new Chart(categoryCtx, {
                            type: 'doughnut',
                            data: {
                                labels: ['No Expense Data'],
                                datasets: [{ data: [1], backgroundColor: ['rgba(156, 163, 175, 0.2)'] }]
                            },
                            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: labelColor } } } }
                        });
                    } else {
                        const donutColors = [
                            '#6366f1', '#3b82f6', '#10b981', '#f59e0b',
                            '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4'
                        ];

                        this.charts.category = new Chart(categoryCtx, {
                            type: 'doughnut',
                            data: {
                                labels: catLabels,
                                datasets: [{
                                    data: catData,
                                    backgroundColor: donutColors.slice(0, catLabels.length),
                                    borderWidth: 0
                                }]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { position: 'right', labels: { color: labelColor } }
                                }
                            }
                        });
                    }
                }
            } catch (e) {
                console.error('Failed to load dashboard charts', e);
            }
        }
    };

    // Merge Dashboard methods into global AuraApp object
    Object.assign(window.AuraApp, Dashboard);
})();
