using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using PersonalFinanceTracker.Data;
using PersonalFinanceTracker.Models;

using PersonalFinanceTracker.Repositories.Interfaces;

namespace PersonalFinanceTracker.Repositories;

public class SavingsGoalRepository : ISavingsGoalRepository
{
    private readonly FinanceDbContext _context;

    public SavingsGoalRepository(FinanceDbContext context)
    {
        _context = context;
    }

    public async Task<List<SavingsGoal>> GetAllGoalsAsync(int userId)
    {
        return await _context.SavingsGoals.Where(g => g.UserId == userId).ToListAsync();
    }

    public async Task<SavingsGoal?> GetByIdAsync(int id)
    {
        return await _context.SavingsGoals.FindAsync(id);
    }

    public async Task AddAsync(SavingsGoal goal)
    {
        await _context.SavingsGoals.AddAsync(goal);
    }

    public void Update(SavingsGoal goal)
    {
        _context.SavingsGoals.Update(goal);
    }

    public void Delete(SavingsGoal goal)
    {
        _context.SavingsGoals.Remove(goal);
    }

    public void DeleteAll(int userId)
    {
        var userGoals = _context.SavingsGoals.Where(g => g.UserId == userId);
        _context.SavingsGoals.RemoveRange(userGoals);
    }

    public async Task AddRangeAsync(IEnumerable<SavingsGoal> goals)
    {
        await _context.SavingsGoals.AddRangeAsync(goals);
    }

    public async Task<decimal> GetTotalSavingsAsync(int userId)
    {
        return await _context.SavingsGoals
            .Where(g => g.UserId == userId)
            .SumAsync(g => g.CurrentAmount);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
