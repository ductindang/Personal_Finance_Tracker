using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using PersonalFinanceTracker.Data;
using PersonalFinanceTracker.Models;

using PersonalFinanceTracker.Repositories.Interfaces;

namespace PersonalFinanceTracker.Repositories;

public class TransactionRepository : ITransactionRepository
{
    private readonly FinanceDbContext _context;

    public TransactionRepository(FinanceDbContext context)
    {
        _context = context;
    }

    public async Task<List<Transaction>> GetRecentTransactionsAsync(int userId)
    {
        return await _context.Transactions
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.Date)
            .ThenByDescending(t => t.CreatedAt)
            .Take(5)
            .ToListAsync();
    }

    public async Task<(int Total, List<Transaction> Data)> GetFilteredTransactionsAsync(
        int userId, string? search, string? type, string? category, DateTime? dateFrom, DateTime? dateTo, int page, int pageSize)
    {
        var query = _context.Transactions.Where(t => t.UserId == userId);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(t => t.Description.ToLower().Contains(s));
        }

        if (!string.IsNullOrWhiteSpace(type) && type != "all")
        {
            query = query.Where(t => t.Type == type);
        }

        if (!string.IsNullOrWhiteSpace(category) && category != "all")
        {
            query = query.Where(t => t.Category == category);
        }

        if (dateFrom.HasValue)
        {
            query = query.Where(t => t.Date >= dateFrom.Value);
        }

        if (dateTo.HasValue)
        {
            query = query.Where(t => t.Date <= dateTo.Value);
        }

        var total = await query.CountAsync();
        var list = await query
            .OrderByDescending(t => t.Date)
            .ThenByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (total, list);
    }

    public async Task<Transaction?> GetByIdAsync(int id)
    {
        return await _context.Transactions.FindAsync(id);
    }

    public async Task AddAsync(Transaction transaction)
    {
        await _context.Transactions.AddAsync(transaction);
    }

    public void Update(Transaction transaction)
    {
        _context.Transactions.Update(transaction);
    }

    public void Delete(Transaction transaction)
    {
        _context.Transactions.Remove(transaction);
    }

    public async Task<List<Transaction>> GetAllTransactionsAsync(int userId)
    {
        return await _context.Transactions.Where(t => t.UserId == userId).ToListAsync();
    }

    public async Task AddRangeAsync(IEnumerable<Transaction> transactions)
    {
        await _context.Transactions.AddRangeAsync(transactions);
    }

    public void DeleteAll(int userId)
    {
        var userTransactions = _context.Transactions.Where(t => t.UserId == userId);
        _context.Transactions.RemoveRange(userTransactions);
    }

    public async Task<decimal> GetTotalAmountByTypeAsync(int userId, string type)
    {
        return await _context.Transactions
            .Where(t => t.UserId == userId && t.Type == type)
            .SumAsync(t => t.Amount);
    }

    public async Task<Dictionary<string, decimal>> GetExpensesByCategoryAsync(int userId, DateTime startDate, DateTime endDate)
    {
        var expenses = await _context.Transactions
            .Where(t => t.UserId == userId && t.Type == "expense" && t.Date >= startDate && t.Date <= endDate)
            .GroupBy(t => t.Category)
            .Select(g => new { Category = g.Key, Spent = g.Sum(t => t.Amount) })
            .ToListAsync();

        return expenses.ToDictionary(e => e.Category, e => e.Spent);
    }

    public async Task UpdateCategoryNameAsync(int userId, string oldCategoryName, string categoryType, string newCategoryName)
    {
        var trans = await _context.Transactions
            .Where(t => t.UserId == userId && t.Category == oldCategoryName && t.Type == categoryType)
            .ToListAsync();
        foreach (var t in trans)
        {
            t.Category = newCategoryName;
        }
    }

    public async Task SetCategoryToOthersAsync(int userId, string categoryName, string categoryType)
    {
        var trans = await _context.Transactions
            .Where(t => t.UserId == userId && t.Category == categoryName && t.Type == categoryType)
            .ToListAsync();
        foreach (var t in trans)
        {
            t.Category = "Others";
        }
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
