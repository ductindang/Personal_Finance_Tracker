using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using PersonalFinanceTracker.Models;

namespace PersonalFinanceTracker.Repositories.Interfaces;

public interface ITransactionRepository
{
    Task<List<Transaction>> GetRecentTransactionsAsync(int userId);
    Task<(int Total, List<Transaction> Data)> GetFilteredTransactionsAsync(
        int userId, string? search, string? type, string? category, DateTime? dateFrom, DateTime? dateTo, int page, int pageSize);
    Task<Transaction?> GetByIdAsync(int id);
    Task AddAsync(Transaction transaction);
    void Update(Transaction transaction);
    void Delete(Transaction transaction);
    Task<List<Transaction>> GetAllTransactionsAsync(int userId);
    Task AddRangeAsync(IEnumerable<Transaction> transactions);
    void DeleteAll(int userId);
    Task<decimal> GetTotalAmountByTypeAsync(int userId, string type);
    Task<Dictionary<string, decimal>> GetExpensesByCategoryAsync(int userId, DateTime startDate, DateTime endDate);
    Task UpdateCategoryNameAsync(string oldCategoryName, string categoryType, string newCategoryName);
    Task SetCategoryToOthersAsync(string categoryName, string categoryType);
    Task SaveChangesAsync();
}
