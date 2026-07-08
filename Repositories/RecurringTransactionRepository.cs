using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using PersonalFinanceTracker.Data;
using PersonalFinanceTracker.Models;
using PersonalFinanceTracker.Repositories.Interfaces;

namespace PersonalFinanceTracker.Repositories
{
    public class RecurringTransactionRepository : IRecurringTransactionRepository
    {
        private readonly FinanceDbContext _context;

        public RecurringTransactionRepository(FinanceDbContext context)
        {
            _context = context;
        }

        public async Task<List<RecurringTransaction>> GetAllAsync(int userId)
        {
            return await _context.RecurringTransactions
                .Where(rt => rt.UserId == userId)
                .OrderByDescending(rt => rt.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<RecurringTransaction>> GetActiveDueAsync(DateTime referenceDate)
        {
            return await _context.RecurringTransactions
                .Where(rt => rt.IsActive && rt.NextOccurrence <= referenceDate)
                .ToListAsync();
        }

        public async Task<List<RecurringTransaction>> GetActiveDueForUserAsync(int userId, DateTime referenceDate)
        {
            return await _context.RecurringTransactions
                .Where(rt => rt.UserId == userId && rt.IsActive && rt.NextOccurrence <= referenceDate)
                .ToListAsync();
        }

        public async Task<RecurringTransaction?> GetByIdAsync(int id)
        {
            return await _context.RecurringTransactions.FindAsync(id);
        }

        public async Task AddAsync(RecurringTransaction recurringTransaction)
        {
            await _context.RecurringTransactions.AddAsync(recurringTransaction);
        }

        public void Update(RecurringTransaction recurringTransaction)
        {
            _context.RecurringTransactions.Update(recurringTransaction);
        }

        public void Delete(RecurringTransaction recurringTransaction)
        {
            _context.RecurringTransactions.Remove(recurringTransaction);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
