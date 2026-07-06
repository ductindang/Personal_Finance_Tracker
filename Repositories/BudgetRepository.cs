using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using PersonalFinanceTracker.Data;
using PersonalFinanceTracker.Models;

using PersonalFinanceTracker.Repositories.Interfaces;

namespace PersonalFinanceTracker.Repositories;

public class BudgetRepository : IBudgetRepository
{
    private readonly FinanceDbContext _context;

    public BudgetRepository(FinanceDbContext context)
    {
        _context = context;
    }

    public async Task<List<Budget>> GetBudgetsByMonthAsync(int userId, string month)
    {
        return await _context.Budgets
            .Where(b => b.UserId == userId && b.Month == month)
            .ToListAsync();
    }

    public async Task<List<Budget>> GetAllBudgetsAsync(int userId)
    {
        return await _context.Budgets.Where(b => b.UserId == userId).ToListAsync();
    }

    public async Task<Budget?> GetByCategoryAndMonthAsync(int userId, string category, string month)
    {
        return await _context.Budgets
            .FirstOrDefaultAsync(b => b.UserId == userId && b.Category == category && b.Month == month);
    }

    public async Task<Budget?> GetByIdAsync(int id)
    {
        return await _context.Budgets.FindAsync(id);
    }

    public async Task AddAsync(Budget budget)
    {
        await _context.Budgets.AddAsync(budget);
    }

    public void Update(Budget budget)
    {
        _context.Budgets.Update(budget);
    }

    public void Delete(Budget budget)
    {
        _context.Budgets.Remove(budget);
    }

    public void DeleteAll(int userId)
    {
        var userBudgets = _context.Budgets.Where(b => b.UserId == userId);
        _context.Budgets.RemoveRange(userBudgets);
    }

    public async Task AddRangeAsync(IEnumerable<Budget> budgets)
    {
        await _context.Budgets.AddRangeAsync(budgets);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
