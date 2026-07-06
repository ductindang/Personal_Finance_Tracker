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
public class SavingsApiController : Controller
{
    private readonly ISavingsService _savingsService;

    public SavingsApiController(ISavingsService savingsService)
    {
        _savingsService = savingsService;
    }

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // 1. Get Savings Goals
    [HttpGet]
    [Route("api/finance/savings")]
    public async Task<IActionResult> GetSavingsGoals()
    {
        try
        {
            var goals = await _savingsService.GetSavingsGoalsAsync(CurrentUserId);
            return Json(goals);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // 2. Create/Edit Savings Goal
    [HttpPost]
    [Route("api/finance/savings")]
    public async Task<IActionResult> SaveSavingsGoal([FromBody] SavingsGoal model)
    {
        try
        {
            var result = await _savingsService.SaveGoalAsync(CurrentUserId, model);
            if (!result.Success)
            {
                if (result.ErrorMessage == "Savings goal not found.")
                {
                    return NotFound();
                }
                return BadRequest(new { message = result.ErrorMessage });
            }

            return Json(new { success = true, data = result.Goal });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // 3. Delete Savings Goal
    [HttpDelete]
    [Route("api/finance/savings/{id}")]
    public async Task<IActionResult> DeleteSavingsGoal(int id)
    {
        try
        {
            var result = await _savingsService.DeleteGoalAsync(CurrentUserId, id);
            if (!result.Success)
            {
                if (result.ErrorMessage == "Savings goal not found.")
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

    // 4. Fund Goal (Deposit or Withdraw)
    [HttpPost]
    [Route("api/finance/savings/fund")]
    public async Task<IActionResult> FundSavingsGoal(int id, decimal amount, string type)
    {
        try
        {
            var result = await _savingsService.FundGoalAsync(CurrentUserId, id, amount, type);
            if (!result.Success)
            {
                if (result.ErrorMessage == "Savings goal not found.")
                {
                    return NotFound();
                }
                return BadRequest(new { message = result.ErrorMessage });
            }

            return Json(new { success = true, data = result.Goal });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }
}
