using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using PersonalFinanceTracker.Models;

namespace PersonalFinanceTracker.Services.Interfaces;

public record FinancialSummaryDto(decimal Balance, decimal Income, decimal Expense, decimal Savings);

public interface ISettingsService
{
    Task<FinancialSummaryDto> GetFinancialSummaryAsync(int userId);
    Task<(List<Transaction> Transactions, List<Budget> Budgets, List<SavingsGoal> SavingsGoals, List<Category> Categories)> GetExportDataAsync(int userId);
    Task<(bool Success, string? ErrorMessage)> ImportDataAsync(int userId, Stream fileStream);
    Task PurgeDataAsync(int userId);
}
