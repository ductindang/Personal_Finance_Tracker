using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;
using PersonalFinanceTracker.Models;
using PersonalFinanceTracker.Repositories.Interfaces;
using PersonalFinanceTracker.Services.Interfaces;

namespace PersonalFinanceTracker.Services;

public class SettingsService : ISettingsService
{
    private readonly ITransactionRepository _transactionRepository;
    private readonly IBudgetRepository _budgetRepository;
    private readonly ISavingsGoalRepository _savingsGoalRepository;
    private readonly ICategoryRepository _categoryRepository;

    public SettingsService(
        ITransactionRepository transactionRepository,
        IBudgetRepository budgetRepository,
        ISavingsGoalRepository savingsGoalRepository,
        ICategoryRepository categoryRepository)
    {
        _transactionRepository = transactionRepository;
        _budgetRepository = budgetRepository;
        _savingsGoalRepository = savingsGoalRepository;
        _categoryRepository = categoryRepository;
    }

    public async Task<FinancialSummaryDto> GetFinancialSummaryAsync(int userId)
    {
        var income = await _transactionRepository.GetTotalAmountByTypeAsync(userId, "income");
        var expense = await _transactionRepository.GetTotalAmountByTypeAsync(userId, "expense");
        var savings = await _savingsGoalRepository.GetTotalSavingsAsync(userId);
        var balance = income - expense - savings;

        return new FinancialSummaryDto(balance, income, expense, savings);
    }

    public async Task<(List<Transaction> Transactions, List<Budget> Budgets, List<SavingsGoal> SavingsGoals, List<Category> Categories)> GetExportDataAsync(int userId)
    {
        var transactions = await _transactionRepository.GetAllTransactionsAsync(userId);
        var budgets = await _budgetRepository.GetAllBudgetsAsync(userId);
        var savingsGoals = await _savingsGoalRepository.GetAllGoalsAsync(userId);
        var categories = await _categoryRepository.GetAllCategoriesAsync();

        return (transactions, budgets, savingsGoals, categories);
    }

    public async Task<(bool Success, string? ErrorMessage)> ImportDataAsync(int userId, Stream fileStream)
    {
        try
        {
            using var reader = new StreamReader(fileStream);
            var json = await reader.ReadToEndAsync();
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            // Database Purge for this user only
            _transactionRepository.DeleteAll(userId);
            _budgetRepository.DeleteAll(userId);
            _savingsGoalRepository.DeleteAll(userId);

            // First SaveChanges to clear tables before adding
            await _transactionRepository.SaveChangesAsync();
            await _budgetRepository.SaveChangesAsync();
            await _savingsGoalRepository.SaveChangesAsync();

            // Import Transactions
            if (root.TryGetProperty("transactions", out var transArr) && transArr.ValueKind == JsonValueKind.Array)
            {
                var transactionsToImport = new List<Transaction>();
                foreach (var element in transArr.EnumerateArray())
                {
                    transactionsToImport.Add(new Transaction {
                        UserId = userId,
                        Type = element.GetProperty("Type").GetString() ?? "expense",
                        Amount = element.GetProperty("Amount").GetDecimal(),
                        Category = element.GetProperty("Category").GetString() ?? "Others",
                        Date = element.GetProperty("Date").GetDateTime(),
                        Description = element.GetProperty("Description").GetString() ?? string.Empty
                    });
                }
                await _transactionRepository.AddRangeAsync(transactionsToImport);
            }

            // Import Budgets
            if (root.TryGetProperty("budgets", out var budgetArr) && budgetArr.ValueKind == JsonValueKind.Array)
            {
                var budgetsToImport = new List<Budget>();
                foreach (var element in budgetArr.EnumerateArray())
                {
                    budgetsToImport.Add(new Budget {
                        UserId = userId,
                        Category = element.GetProperty("Category").GetString() ?? string.Empty,
                        LimitAmount = element.GetProperty("LimitAmount").GetDecimal(),
                        Month = element.GetProperty("Month").GetString() ?? string.Empty
                    });
                }
                await _budgetRepository.AddRangeAsync(budgetsToImport);
            }

            // Import Savings Goals
            if (root.TryGetProperty("savingsGoals", out var goalArr) && goalArr.ValueKind == JsonValueKind.Array)
            {
                var goalsToImport = new List<SavingsGoal>();
                foreach (var element in goalArr.EnumerateArray())
                {
                    goalsToImport.Add(new SavingsGoal {
                        UserId = userId,
                        Title = element.GetProperty("Title").GetString() ?? string.Empty,
                        TargetAmount = element.GetProperty("TargetAmount").GetDecimal(),
                        CurrentAmount = element.GetProperty("CurrentAmount").GetDecimal(),
                        TargetDate = element.GetProperty("TargetDate").GetDateTime()
                    });
                }
                await _savingsGoalRepository.AddRangeAsync(goalsToImport);
            }

            // Save all additions
            await _transactionRepository.SaveChangesAsync();
            await _budgetRepository.SaveChangesAsync();
            await _savingsGoalRepository.SaveChangesAsync();

            return (true, null);
        }
        catch (Exception ex)
        {
            return (false, "Failed to parse backup file. Error: " + ex.Message);
        }
    }

    public async Task PurgeDataAsync(int userId)
    {
        _transactionRepository.DeleteAll(userId);
        _budgetRepository.DeleteAll(userId);
        _savingsGoalRepository.DeleteAll(userId);

        await _transactionRepository.SaveChangesAsync();
        await _budgetRepository.SaveChangesAsync();
        await _savingsGoalRepository.SaveChangesAsync();
    }

    private async Task SeedDefaultCategoriesAsync()
    {
        var defaults = new List<Category>
        {
            new Category { Name = "Salary", Type = "income" },
            new Category { Name = "Investment", Type = "income" },
            new Category { Name = "Bonus", Type = "income" },
            new Category { Name = "Others", Type = "income" },
            new Category { Name = "Food & Beverage", Type = "expense" },
            new Category { Name = "Shopping", Type = "expense" },
            new Category { Name = "Housing", Type = "expense" },
            new Category { Name = "Transportation", Type = "expense" },
            new Category { Name = "Utilities", Type = "expense" },
            new Category { Name = "Entertainment", Type = "expense" },
            new Category { Name = "Health", Type = "expense" },
            new Category { Name = "Others", Type = "expense" }
        };
        
        await _categoryRepository.AddRangeAsync(defaults);
    }
}
