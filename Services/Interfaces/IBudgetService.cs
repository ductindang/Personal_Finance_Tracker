using System.Collections.Generic;
using System.Threading.Tasks;
using PersonalFinanceTracker.Models;

namespace PersonalFinanceTracker.Services.Interfaces;

public record BudgetStatusDto(int Id, string Category, decimal LimitAmount, string Month, decimal Spent);

public interface IBudgetService
{
    Task<List<BudgetStatusDto>> GetBudgetsAsync(int userId, string month);
    Task<(bool Success, string? ErrorMessage, Budget? Budget)> SaveBudgetAsync(int userId, Budget model);
    Task<(bool Success, string? ErrorMessage)> DeleteBudgetAsync(int userId, int id);
}
