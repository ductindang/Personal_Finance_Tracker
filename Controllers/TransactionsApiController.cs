using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalFinanceTracker.Models;
using PersonalFinanceTracker.Services.Interfaces;

namespace PersonalFinanceTracker.Controllers;

[Authorize]
[ApiController]
public class TransactionsApiController : Controller
{
    private readonly ITransactionService _transactionService;
    private readonly IRecurringTransactionService _recurringTransactionService;

    public TransactionsApiController(
        ITransactionService transactionService,
        IRecurringTransactionService recurringTransactionService)
    {
        _transactionService = transactionService;
        _recurringTransactionService = recurringTransactionService;
    }

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // 1. Get Recent Transactions (Top 5)
    [HttpGet]
    [Route("api/finance/transactions/recent")]
    public async Task<IActionResult> GetRecentTransactions()
    {
        try
        {
            // Auto-process due recurring transactions
            await _recurringTransactionService.ProcessDueRecurringTransactionsAsync(CurrentUserId);

            var transactions = await _transactionService.GetRecentTransactionsAsync(CurrentUserId);
            return Json(transactions);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // 2. Get Filtered & Paginated Transactions
    [HttpGet]
    [Route("api/finance/transactions")]
    public async Task<IActionResult> GetTransactions(
        string? search, string? type, string? category, string? dateFrom, string? dateTo, int page = 1, int pageSize = 10)
    {
        try
        {
            // Auto-process due recurring transactions
            await _recurringTransactionService.ProcessDueRecurringTransactionsAsync(CurrentUserId);

            var (total, data) = await _transactionService.GetTransactionsAsync(
                CurrentUserId, search, type, category, dateFrom, dateTo, page, pageSize);

            return Json(new { total, data, page, pageSize });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // 3. Get Single Transaction
    [HttpGet]
    [Route("api/finance/transactions/{id}")]
    public async Task<IActionResult> GetTransaction(int id)
    {
        try
        {
            var trans = await _transactionService.GetTransactionByIdAsync(CurrentUserId, id);
            if (trans == null) return NotFound();
            return Json(trans);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // 4. Save Transaction (Add/Edit)
    [HttpPost]
    [Route("api/finance/transactions")]
    public async Task<IActionResult> SaveTransaction([FromBody] Transaction model)
    {
        try
        {
            var result = await _transactionService.SaveTransactionAsync(CurrentUserId, model);
            if (!result.Success)
            {
                if (result.ErrorMessage == "Transaction not found.")
                {
                    return NotFound();
                }
                return BadRequest(new { message = result.ErrorMessage });
            }

            return Json(new { success = true, data = result.Transaction });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // 5. Delete Transaction
    [HttpDelete]
    [Route("api/finance/transactions/{id}")]
    public async Task<IActionResult> DeleteTransaction(int id)
    {
        try
        {
            var result = await _transactionService.DeleteTransactionAsync(CurrentUserId, id);
            if (!result.Success)
            {
                if (result.ErrorMessage == "Transaction not found.")
                {
                    return NotFound();
                }
                return BadRequest(new { message = result.ErrorMessage });
            }

            return Json(new { success = true });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }
}
