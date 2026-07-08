using System.Collections.Generic;
using System.Threading.Tasks;
using PersonalFinanceTracker.Models;

namespace PersonalFinanceTracker.Services.Interfaces
{
    public interface IRecurringTransactionService
    {
        Task<List<RecurringTransaction>> GetRecurringTransactionsAsync(int userId);
        Task<RecurringTransaction?> GetRecurringTransactionByIdAsync(int userId, int id);
        Task<(bool Success, string? ErrorMessage, RecurringTransaction? RecurringTransaction)> SaveRecurringTransactionAsync(int userId, RecurringTransaction model);
        Task<(bool Success, string? ErrorMessage)> DeleteRecurringTransactionAsync(int userId, int id);
        Task<List<Transaction>> ProcessDueRecurringTransactionsAsync(int userId);
    }
}
