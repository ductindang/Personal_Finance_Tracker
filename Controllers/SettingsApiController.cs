using System;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PersonalFinanceTracker.Services.Interfaces;

namespace PersonalFinanceTracker.Controllers;

[Authorize]
[ApiController]
public class SettingsApiController : Controller
{
    private readonly ISettingsService _settingsService;
    private readonly IRecurringTransactionService _recurringTransactionService;

    public SettingsApiController(
        ISettingsService settingsService,
        IRecurringTransactionService recurringTransactionService)
    {
        _settingsService = settingsService;
        _recurringTransactionService = recurringTransactionService;
    }

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // 1. Get Financial Summary
    [HttpGet]
    [Route("api/finance/summary")]
    public async Task<IActionResult> GetSummary()
    {
        try
        {
            // Auto-process due recurring transactions
            await _recurringTransactionService.ProcessDueRecurringTransactionsAsync(CurrentUserId);

            var summary = await _settingsService.GetFinancialSummaryAsync(CurrentUserId);
            return Json(new {
                balance = summary.Balance,
                income = summary.Income,
                expense = summary.Expense,
                savings = summary.Savings
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // 2. Export Data (JSON backup download)
    [HttpGet]
    [Route("api/finance/backup/export")]
    public async Task<IActionResult> ExportData()
    {
        try
        {
            var (transactions, budgets, savingsGoals, categories) = await _settingsService.GetExportDataAsync(CurrentUserId);
            var data = new {
                transactions,
                budgets,
                savingsGoals,
                categories
            };

            var json = JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true });
            var bytes = System.Text.Encoding.UTF8.GetBytes(json);
            return File(bytes, "application/json", "finance_backup_" + DateTime.UtcNow.ToString("yyyyMMdd_HHmmss") + ".json");
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // 3. Import Data (JSON upload)
    [HttpPost]
    [Route("api/finance/backup/import")]
    public async Task<IActionResult> ImportData(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "No backup file uploaded." });
        }

        try
        {
            using var stream = file.OpenReadStream();
            var result = await _settingsService.ImportDataAsync(CurrentUserId, stream);
            if (!result.Success)
            {
                return BadRequest(new { message = result.ErrorMessage });
            }

            return Json(new { success = true });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to parse backup file. Error: " + ex.Message });
        }
    }

    // 4. Purge Database
    [HttpPost]
    [Route("api/finance/backup/purge")]
    public async Task<IActionResult> PurgeData()
    {
        try
        {
            await _settingsService.PurgeDataAsync(CurrentUserId);
            return Json(new { success = true });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }
}
