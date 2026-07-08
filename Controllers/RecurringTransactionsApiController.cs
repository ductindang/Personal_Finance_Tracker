using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalFinanceTracker.Models;
using PersonalFinanceTracker.Services.Interfaces;

namespace PersonalFinanceTracker.Controllers
{
    [Authorize]
    [ApiController]
    public class RecurringTransactionsApiController : Controller
    {
        private readonly IRecurringTransactionService _recurringTransactionService;

        public RecurringTransactionsApiController(IRecurringTransactionService recurringTransactionService)
        {
            _recurringTransactionService = recurringTransactionService;
        }

        private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // 1. Get Recurring Transactions
        [HttpGet]
        [Route("api/finance/recurring")]
        public async Task<IActionResult> GetRecurringTransactions()
        {
            try
            {
                var list = await _recurringTransactionService.GetRecurringTransactionsAsync(CurrentUserId);
                return Json(list);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // 2. Get Single Recurring Transaction
        [HttpGet]
        [Route("api/finance/recurring/{id}")]
        public async Task<IActionResult> GetRecurringTransaction(int id)
        {
            try
            {
                var item = await _recurringTransactionService.GetRecurringTransactionByIdAsync(CurrentUserId, id);
                if (item == null) return NotFound();
                return Json(item);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // 3. Save Recurring Transaction
        [HttpPost]
        [Route("api/finance/recurring")]
        public async Task<IActionResult> SaveRecurringTransaction([FromBody] RecurringTransaction model)
        {
            try
            {
                var result = await _recurringTransactionService.SaveRecurringTransactionAsync(CurrentUserId, model);
                if (!result.Success)
                {
                    if (result.ErrorMessage == "Recurring transaction not found.")
                    {
                        return NotFound();
                    }
                    return BadRequest(new { message = result.ErrorMessage });
                }

                return Json(new { success = true, data = result.RecurringTransaction });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // 4. Delete Recurring Transaction
        [HttpDelete]
        [Route("api/finance/recurring/{id}")]
        public async Task<IActionResult> DeleteRecurringTransaction(int id)
        {
            try
            {
                var result = await _recurringTransactionService.DeleteRecurringTransactionAsync(CurrentUserId, id);
                if (!result.Success)
                {
                    if (result.ErrorMessage == "Recurring transaction not found.")
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

        // 5. Trigger Process Recurring Transactions
        [HttpPost]
        [Route("api/finance/recurring/process")]
        public async Task<IActionResult> ProcessRecurringTransactions()
        {
            try
            {
                var generated = await _recurringTransactionService.ProcessDueRecurringTransactionsAsync(CurrentUserId);
                return Json(new { success = true, count = generated.Count, data = generated });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }
    }
}
