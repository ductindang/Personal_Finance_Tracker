using System.Collections.Generic;
using System.Threading.Tasks;
using PersonalFinanceTracker.Models;

namespace PersonalFinanceTracker.Services.Interfaces;

public interface ITransactionService
{
    Task<List<Transaction>> GetRecentTransactionsAsync(int userId);
    Task<(int Total, List<Transaction> Data)> GetTransactionsAsync(
        int userId, string? search, string? type, string? category, string? dateFrom, string? dateTo, int page, int pageSize);
    Task<Transaction?> GetTransactionByIdAsync(int userId, int id);
    Task<(bool Success, string? ErrorMessage, Transaction? Transaction)> SaveTransactionAsync(int userId, Transaction model);
    Task<(bool Success, string? ErrorMessage)> DeleteTransactionAsync(int userId, int id);
}
