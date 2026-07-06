using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using PersonalFinanceTracker.Models;
using PersonalFinanceTracker.Repositories.Interfaces;
using PersonalFinanceTracker.Services.Interfaces;

namespace PersonalFinanceTracker.Services;

public class TransactionService : ITransactionService
{
    private readonly ITransactionRepository _transactionRepository;

    public TransactionService(ITransactionRepository transactionRepository)
    {
        _transactionRepository = transactionRepository;
    }

    public async Task<List<Transaction>> GetRecentTransactionsAsync(int userId)
    {
        return await _transactionRepository.GetRecentTransactionsAsync(userId);
    }

    public async Task<(int Total, List<Transaction> Data)> GetTransactionsAsync(
        int userId, string? search, string? type, string? category, string? dateFrom, string? dateTo, int page, int pageSize)
    {
        DateTime? parsedFrom = null;
        DateTime? parsedTo = null;

        if (DateTime.TryParse(dateFrom, out var fromDate))
        {
            parsedFrom = fromDate;
        }

        if (DateTime.TryParse(dateTo, out var toDate))
        {
            parsedTo = toDate;
        }

        return await _transactionRepository.GetFilteredTransactionsAsync(
            userId, search, type, category, parsedFrom, parsedTo, page, pageSize);
    }

    public async Task<Transaction?> GetTransactionByIdAsync(int userId, int id)
    {
        var trans = await _transactionRepository.GetByIdAsync(id);
        if (trans == null || trans.UserId != userId)
        {
            return null;
        }
        return trans;
    }

    public async Task<(bool Success, string? ErrorMessage, Transaction? Transaction)> SaveTransactionAsync(int userId, Transaction model)
    {
        if (model == null || model.Amount <= 0 || string.IsNullOrWhiteSpace(model.Description))
        {
            return (false, "Invalid transaction payload.", null);
        }

        if (model.Id == 0)
        {
            model.UserId = userId;
            await _transactionRepository.AddAsync(model);
        }
        else
        {
            var existing = await _transactionRepository.GetByIdAsync(model.Id);
            if (existing == null || existing.UserId != userId)
            {
                return (false, "Transaction not found.", null);
            }

            existing.Type = model.Type;
            existing.Amount = model.Amount;
            existing.Category = model.Category;
            existing.Date = model.Date;
            existing.Description = model.Description;
            _transactionRepository.Update(existing);
            model = existing;
        }

        await _transactionRepository.SaveChangesAsync();
        return (true, null, model);
    }

    public async Task<(bool Success, string? ErrorMessage)> DeleteTransactionAsync(int userId, int id)
    {
        var trans = await _transactionRepository.GetByIdAsync(id);
        if (trans == null || trans.UserId != userId)
        {
            return (false, "Transaction not found.");
        }

        _transactionRepository.Delete(trans);
        await _transactionRepository.SaveChangesAsync();
        return (true, null);
    }
}
