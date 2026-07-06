using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using PersonalFinanceTracker.Models;
using PersonalFinanceTracker.Repositories.Interfaces;
using PersonalFinanceTracker.Services.Interfaces;

namespace PersonalFinanceTracker.Services;

public class BudgetService : IBudgetService
{
    private readonly IBudgetRepository _budgetRepository;
    private readonly ITransactionRepository _transactionRepository;

    public BudgetService(IBudgetRepository budgetRepository, ITransactionRepository transactionRepository)
    {
        _budgetRepository = budgetRepository;
        _transactionRepository = transactionRepository;
    }

    public async Task<List<BudgetStatusDto>> GetBudgetsAsync(int userId, string month)
    {
        if (string.IsNullOrWhiteSpace(month))
        {
            month = DateTime.UtcNow.ToString("yyyy-MM");
        }

        var budgets = await _budgetRepository.GetBudgetsByMonthAsync(userId, month);

        var startOfMonth = DateTime.Parse(month + "-01");
        var endOfMonth = startOfMonth.AddMonths(1).AddDays(-1);

        var expenses = await _transactionRepository.GetExpensesByCategoryAsync(userId, startOfMonth, endOfMonth);

        return budgets.Select(b => {
            expenses.TryGetValue(b.Category, out var spent);
            return new BudgetStatusDto(
                b.Id,
                b.Category,
                b.LimitAmount,
                b.Month,
                spent
            );
        }).ToList();
    }

    public async Task<(bool Success, string? ErrorMessage, Budget? Budget)> SaveBudgetAsync(int userId, Budget model)
    {
        if (model == null || model.LimitAmount <= 0 || string.IsNullOrWhiteSpace(model.Category) || string.IsNullOrWhiteSpace(model.Month))
        {
            return (false, "Invalid budget payload.", null);
        }

        var existing = await _budgetRepository.GetByCategoryAndMonthAsync(userId, model.Category, model.Month);
        if (existing != null)
        {
            existing.LimitAmount = model.LimitAmount;
            _budgetRepository.Update(existing);
            model = existing;
        }
        else
        {
            model.UserId = userId;
            await _budgetRepository.AddAsync(model);
        }

        await _budgetRepository.SaveChangesAsync();
        return (true, null, model);
    }

    public async Task<(bool Success, string? ErrorMessage)> DeleteBudgetAsync(int userId, int id)
    {
        var budget = await _budgetRepository.GetByIdAsync(id);
        if (budget == null || budget.UserId != userId)
        {
            return (false, "Budget not found.");
        }

        _budgetRepository.Delete(budget);
        await _budgetRepository.SaveChangesAsync();
        return (true, null);
    }
}
