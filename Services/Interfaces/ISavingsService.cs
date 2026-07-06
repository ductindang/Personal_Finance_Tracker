using System.Collections.Generic;
using System.Threading.Tasks;
using PersonalFinanceTracker.Models;

namespace PersonalFinanceTracker.Services.Interfaces;

public interface ISavingsService
{
    Task<List<SavingsGoal>> GetSavingsGoalsAsync(int userId);
    Task<(bool Success, string? ErrorMessage, SavingsGoal? Goal)> SaveGoalAsync(int userId, SavingsGoal model);
    Task<(bool Success, string? ErrorMessage)> DeleteGoalAsync(int userId, int id);
    Task<(bool Success, string? ErrorMessage, SavingsGoal? Goal)> FundGoalAsync(int userId, int id, decimal amount, string type);
}
