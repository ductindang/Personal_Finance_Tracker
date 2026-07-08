using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using PersonalFinanceTracker.Models;

namespace PersonalFinanceTracker.Repositories.Interfaces
{
    public interface IRecurringTransactionRepository
    {
        Task<List<RecurringTransaction>> GetAllAsync(int userId);
        Task<List<RecurringTransaction>> GetActiveDueAsync(DateTime referenceDate);
        Task<List<RecurringTransaction>> GetActiveDueForUserAsync(int userId, DateTime referenceDate);
        Task<RecurringTransaction?> GetByIdAsync(int id);
        Task AddAsync(RecurringTransaction recurringTransaction);
        void Update(RecurringTransaction recurringTransaction);
        void Delete(RecurringTransaction recurringTransaction);
        Task SaveChangesAsync();
    }
}
