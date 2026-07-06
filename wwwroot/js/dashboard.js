/**
 * Aura Dashboard Page Module
 */

(function () {
    // Check if the main application namespace exists
    if (!window.AuraApp) {
        return;
    }

    const Dashboard = {
        // Initialize dashboard summaries, charts, and recent transaction records
        async initDashboard() {
            await this.loadDashboardSummary();
            await this.loadDashboardCharts();
            await this.loadRecentTransactions();
        },

        // Fetch total balance, total income, and total expenses to display in top banners
        async loadDashboardSummary() {
            try {
                const response = await fetch('/api/finance/summary');
                if (response.ok) {
                    const summary = await response.json();
                    const balanceEl = document.getElementById('dash-balance');
                    const incomeEl = document.getElementById('dash-income');
                    const expenseEl = document.getElementById('dash-expense');
                    
                    if (balanceEl) {
                        balanceEl.textContent = this.formatCurrency(summary.balance);
                    }
                    if (incomeEl) {
                        incomeEl.textContent = this.formatCurrency(summary.income);
                    }
                    if (expenseEl) {
                        expenseEl.textContent = this.formatCurrency(summary.expense);
                    }
                }
            } catch (error) {
                console.error('Failed to load dashboard summary', error);
            }
        },

        // Fetch recent transactions list and display them in the dashboard table
        async loadRecentTransactions() {
            const tbody = document.getElementById('recent-transactions-tbody');
            if (!tbody) {
                return;
            }

            try {
                const response = await fetch('/api/finance/transactions/recent');
                if (response.ok) {
                    const list = await response.json();
                    tbody.innerHTML = ''; // Clear older table content

                    if (list.length === 0) {
                        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">No transactions recorded. Click "Add Transaction" to start.</td></tr>`;
                        return;
                    }

                    // Render rows
                    for (let i = 0; i < list.length; i++) {
                        const transaction = list[i];
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
                                <button class="btn-icon delete-btn" title="Delete" data-id="${transaction.id}">
                                    <i class="fa-solid fa-trash-can"></i>
                                </button>
                            </td>
                        `;
                        
                        // Bind delete action to button
                        const deleteBtn = tr.querySelector('.delete-btn');
                        if (deleteBtn) {
                            deleteBtn.addEventListener('click', () => {
                                this.deleteTransaction(transaction.id);
                            });
                        }
                        
                        tbody.appendChild(tr);
                    }
                }
            } catch (error) {
                console.error('Failed to load recent transactions', error);
            }
        },

        // Fetch all transactions data to process and build the interactive charts
        async loadDashboardCharts() {
            try {
                const transResponse = await fetch('/api/finance/transactions?pageSize=1000');
                if (!transResponse.ok) {
                    return;
                }

                const transObj = await transResponse.json();
                const list = transObj.data;

                // 1. Prepare Category Expense Chart Data
                const expensesByCategory = {};
                
                // Initialize categories with zero
                const expenseCats = this.state.categories.expense;
                for (let i = 0; i < expenseCats.length; i++) {
                    expensesByCategory[expenseCats[i]] = 0;
                }

                // Sum up categories
                for (let i = 0; i < list.length; i++) {
                    const t = list[i];
                    if (t.type === 'expense') {
                        if (expensesByCategory[t.category] !== undefined) {
                            expensesByCategory[t.category] += t.amount;
                        } else {
                            if (expensesByCategory['Others'] === undefined) {
                                expensesByCategory['Others'] = 0;
                            }
                            expensesByCategory['Others'] += t.amount;
                        }
                    }
                }

                const catLabels = [];
                const catData = [];
                const allCategoryNames = Object.keys(expensesByCategory);
                
                for (let i = 0; i < allCategoryNames.length; i++) {
                    const catName = allCategoryNames[i];
                    if (expensesByCategory[catName] > 0) {
                        catLabels.push(catName);
                        catData.push(expensesByCategory[catName]);
                    }
                }

                // 2. Prepare Cash Flow Chart Data (last 6 months)
                const monthlyData = {};
                for (let i = 5; i >= 0; i--) {
                    const d = new Date();
                    d.setMonth(d.getMonth() - i);
                    const key = d.toISOString().substring(0, 7); // YYYY-MM
                    const monthText = d.toLocaleDateString('en-US', { month: 'short' });
                    
                    monthlyData[key] = { 
                        monthLabel: monthText, 
                        income: 0, 
                        expense: 0 
                    };
                }

                // Fill monthly data
                for (let i = 0; i < list.length; i++) {
                    const t = list[i];
                    const key = t.date.substring(0, 7); // extract YYYY-MM
                    if (monthlyData[key] !== undefined) {
                        if (t.type === 'income') {
                            monthlyData[key].income += t.amount;
                        } else {
                            monthlyData[key].expense += t.amount;
                        }
                    }
                }

                const months = Object.keys(monthlyData);
                const barLabels = [];
                const incomeData = [];
                const expenseData = [];
                
                for (let i = 0; i < months.length; i++) {
                    const monthKey = months[i];
                    barLabels.push(monthlyData[monthKey].monthLabel);
                    incomeData.push(monthlyData[monthKey].income);
                    expenseData.push(monthlyData[monthKey].expense);
                }

                // Setup Themes specific colors
                const isLight = this.state.theme === 'light';
                let gridColor = 'rgba(255, 255, 255, 0.05)';
                let labelColor = '#9ca3af';
                if (isLight) {
                    gridColor = 'rgba(0, 0, 0, 0.05)';
                    labelColor = '#4b5563';
                }

                // Chart 1: Cashflow (Bar chart)
                const cashflowCtx = document.getElementById('cashflowChart');
                if (cashflowCtx) {
                    if (this.charts.cashflow) {
                        this.charts.cashflow.destroy(); // Destroy previous chart to avoid layout overlapping
                    }

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
                    if (this.charts.category) {
                        this.charts.category.destroy(); // Destroy previous chart
                    }

                    if (catLabels.length === 0) {
                        this.charts.category = new Chart(categoryCtx, {
                            type: 'doughnut',
                            data: {
                                labels: ['No Expense Data'],
                                datasets: [{ data: [1], backgroundColor: ['rgba(156, 163, 175, 0.2)'] }]
                            },
                            options: { 
                                responsive: true, 
                                maintainAspectRatio: false, 
                                plugins: { legend: { labels: { color: labelColor } } } 
                            }
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
            } catch (error) {
                console.error('Failed to load dashboard charts', error);
            }
        }
    };

    // Merge Dashboard methods into global AuraApp object
    Object.assign(window.AuraApp, Dashboard);
})();
