using System.Collections.Generic;
using System.Threading.Tasks;
using PersonalFinanceTracker.Models;

namespace PersonalFinanceTracker.Repositories.Interfaces;

public interface ISavingsGoalRepository
{
    Task<List<SavingsGoal>> GetAllGoalsAsync(int userId);
    Task<SavingsGoal?> GetByIdAsync(int id);
    Task AddAsync(SavingsGoal goal);
    void Update(SavingsGoal goal);
    void Delete(SavingsGoal goal);
    void DeleteAll(int userId);
    Task AddRangeAsync(IEnumerable<SavingsGoal> goals);
    Task<decimal> GetTotalSavingsAsync(int userId);
    Task SaveChangesAsync();
}
