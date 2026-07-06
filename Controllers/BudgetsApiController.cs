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
public class BudgetsApiController : Controller
{
    private readonly IBudgetService _budgetService;

    public BudgetsApiController(IBudgetService budgetService)
    {
        _budgetService = budgetService;
    }

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // 1. Get Monthly Budgets & Spent Status
    [HttpGet]
    [Route("api/finance/budgets")]
    public async Task<IActionResult> GetBudgets(string month)
    {
        try
        {
            var result = await _budgetService.GetBudgetsAsync(CurrentUserId, month);
            return Json(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // 2. Save Budget (Set/Update limit)
    [HttpPost]
    [Route("api/finance/budgets")]
    public async Task<IActionResult> SaveBudget([FromBody] Budget model)
    {
        try
        {
            var result = await _budgetService.SaveBudgetAsync(CurrentUserId, model);
            if (!result.Success)
            {
                return BadRequest(new { message = result.ErrorMessage });
            }

            return Json(new { success = true, data = result.Budget });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // 3. Delete Budget
    [HttpDelete]
    [Route("api/finance/budgets/{id}")]
    public async Task<IActionResult> DeleteBudget(int id)
    {
        try
        {
            var result = await _budgetService.DeleteBudgetAsync(CurrentUserId, id);
            if (!result.Success)
            {
                if (result.ErrorMessage == "Budget not found.")
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
