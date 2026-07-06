using System.Collections.Generic;
using System.Threading.Tasks;
using PersonalFinanceTracker.Models;

namespace PersonalFinanceTracker.Repositories.Interfaces;

public interface IBudgetRepository
{
    Task<List<Budget>> GetBudgetsByMonthAsync(int userId, string month);
    Task<List<Budget>> GetAllBudgetsAsync(int userId);
    Task<Budget?> GetByCategoryAndMonthAsync(int userId, string category, string month);
    Task<Budget?> GetByIdAsync(int id);
    Task AddAsync(Budget budget);
    void Update(Budget budget);
    void Delete(Budget budget);
    void DeleteAll(int userId);
    Task AddRangeAsync(IEnumerable<Budget> budgets);
    Task SaveChangesAsync();
}
