using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using PersonalFinanceTracker.Models;
using PersonalFinanceTracker.Repositories.Interfaces;
using PersonalFinanceTracker.Services.Interfaces;

namespace PersonalFinanceTracker.Services
{
    public class RecurringTransactionService : IRecurringTransactionService
    {
        private readonly IRecurringTransactionRepository _recurringTransactionRepository;
        private readonly ITransactionRepository _transactionRepository;

        public RecurringTransactionService(
            IRecurringTransactionRepository recurringTransactionRepository,
            ITransactionRepository transactionRepository)
        {
            _recurringTransactionRepository = recurringTransactionRepository;
            _transactionRepository = transactionRepository;
        }

        public async Task<List<RecurringTransaction>> GetRecurringTransactionsAsync(int userId)
        {
            return await _recurringTransactionRepository.GetAllAsync(userId);
        }

        public async Task<RecurringTransaction?> GetRecurringTransactionByIdAsync(int userId, int id)
        {
            var item = await _recurringTransactionRepository.GetByIdAsync(id);
            if (item == null || item.UserId != userId)
            {
                return null;
            }
            return item;
        }

        public async Task<(bool Success, string? ErrorMessage, RecurringTransaction? RecurringTransaction)> SaveRecurringTransactionAsync(int userId, RecurringTransaction model)
        {
            if (model == null)
            {
                return (false, "Invalid payload.", null);
            }

            if (model.Amount <= 0)
            {
                return (false, "Amount must be greater than zero.", null);
            }

            if (string.IsNullOrWhiteSpace(model.Description))
            {
                return (false, "Description is required.", null);
            }

            string freq = model.Frequency.Trim();
            if (freq != "Daily" && freq != "Weekly" && freq != "Monthly" && freq != "Yearly")
            {
                return (false, "Frequency must be Daily, Weekly, Monthly, or Yearly.", null);
            }

            if (string.IsNullOrWhiteSpace(model.ExecutionTime) || !TimeSpan.TryParse(model.ExecutionTime, out var executionTimeSpan))
            {
                return (false, "Invalid execution time. Format must be HH:mm.", null);
            }

            // Combine Date with the Execution Time timespan
            model.StartDate = model.StartDate.Date.Add(executionTimeSpan);
            if (model.EndDate.HasValue)
            {
                model.EndDate = model.EndDate.Value.Date.Add(executionTimeSpan);
            }

            if (model.EndDate.HasValue && model.EndDate.Value < model.StartDate)
            {
                return (false, "End date cannot be before start date.", null);
            }

            if (model.Id == 0)
            {
                model.UserId = userId;
                model.CreatedAt = DateTime.UtcNow;
                model.NextOccurrence = model.StartDate;
                model.LastProcessed = null;
                model.IsActive = true;
                await _recurringTransactionRepository.AddAsync(model);
            }
            else
            {
                var existing = await _recurringTransactionRepository.GetByIdAsync(model.Id);
                if (existing == null || existing.UserId != userId)
                {
                    return (false, "Recurring transaction not found.", null);
                }

                existing.Type = model.Type;
                existing.Amount = model.Amount;
                existing.Category = model.Category;
                existing.Description = model.Description;
                existing.Frequency = freq;
                existing.ExecutionTime = model.ExecutionTime;
                existing.StartDate = model.StartDate;
                existing.EndDate = model.EndDate;
                existing.IsActive = model.IsActive;

                // Adjust NextOccurrence based on new configuration rules
                if (existing.LastProcessed == null)
                {
                    existing.NextOccurrence = model.StartDate;
                }
                else
                {
                    // Recalculate NextOccurrence starting from the last processed date using the new frequency and execution time
                    var lastProcessedDate = existing.LastProcessed.Value.Date;
                    existing.NextOccurrence = freq switch
                    {
                        "Daily" => lastProcessedDate.AddDays(1).Add(executionTimeSpan),
                        "Weekly" => lastProcessedDate.AddDays(7).Add(executionTimeSpan),
                        "Monthly" => lastProcessedDate.AddMonths(1).Add(executionTimeSpan),
                        "Yearly" => lastProcessedDate.AddYears(1).Add(executionTimeSpan),
                        _ => lastProcessedDate.AddMonths(1).Add(executionTimeSpan)
                    };
                }

                _recurringTransactionRepository.Update(existing);
                model = existing;
            }

            await _recurringTransactionRepository.SaveChangesAsync();
            return (true, null, model);
        }

        public async Task<(bool Success, string? ErrorMessage)> DeleteRecurringTransactionAsync(int userId, int id)
        {
            var item = await _recurringTransactionRepository.GetByIdAsync(id);
            if (item == null || item.UserId != userId)
            {
                return (false, "Recurring transaction not found.");
            }

            _recurringTransactionRepository.Delete(item);
            await _recurringTransactionRepository.SaveChangesAsync();
            return (true, null);
        }

        public async Task<List<Transaction>> ProcessDueRecurringTransactionsAsync(int userId)
        {
            var now = DateTime.Now;
            var dueTransactions = await _recurringTransactionRepository.GetActiveDueForUserAsync(userId, now);
            var generatedTransactions = new List<Transaction>();

            foreach (var rt in dueTransactions)
            {
                while (rt.IsActive && rt.NextOccurrence <= now)
                {
                    var occurrenceDate = rt.NextOccurrence;

                    var transaction = new Transaction
                    {
                        UserId = userId,
                        Type = rt.Type,
                        Amount = rt.Amount,
                        Category = rt.Category,
                        Description = rt.Description,
                        Date = occurrenceDate,
                        CreatedAt = now
                    };

                    await _transactionRepository.AddAsync(transaction);
                    generatedTransactions.Add(transaction);

                    rt.LastProcessed = occurrenceDate;

                    // Compute next occurrence based on frequency
                    rt.NextOccurrence = rt.Frequency switch
                    {
                        "Daily" => occurrenceDate.AddDays(1),
                        "Weekly" => occurrenceDate.AddDays(7),
                        "Monthly" => occurrenceDate.AddMonths(1),
                        "Yearly" => occurrenceDate.AddYears(1),
                        _ => occurrenceDate.AddMonths(1) // Default fallback
                    };

                    if (rt.EndDate.HasValue && rt.NextOccurrence > rt.EndDate.Value)
                    {
                        rt.IsActive = false;
                        break;
                    }
                }

                _recurringTransactionRepository.Update(rt);
            }

            if (generatedTransactions.Count > 0)
            {
                // Save both new transactions and updated recurring transaction info
                await _transactionRepository.SaveChangesAsync();
                await _recurringTransactionRepository.SaveChangesAsync();
            }

            return generatedTransactions;
        }
    }
}
