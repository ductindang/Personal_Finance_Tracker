using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using PersonalFinanceTracker.Models;
using PersonalFinanceTracker.Services.Interfaces;

namespace PersonalFinanceTracker.Controllers;

[ApiController]
public class CategoriesApiController : Controller
{
    private readonly ICategoryService _categoryService;

    public CategoriesApiController(ICategoryService categoryService)
    {
        _categoryService = categoryService;
    }

    // 1. Get Categories
    [HttpGet]
    [Route("api/finance/categories")]
    public async Task<IActionResult> GetCategories()
    {
        try
        {
            var categories = await _categoryService.GetCategoriesAsync();
            return Json(categories);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // 2. Save Category (Add/Edit)
    [HttpPost]
    [Route("api/finance/categories")]
    public async Task<IActionResult> SaveCategory([FromBody] Category model)
    {
        try
        {
            var result = await _categoryService.SaveCategoryAsync(model);
            if (!result.Success)
            {
                if (result.ErrorMessage == "Category not found.")
                {
                    return NotFound();
                }
                return BadRequest(new { message = result.ErrorMessage });
            }

            return Json(new { success = true, data = result.Category });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // 3. Delete Category
    [HttpDelete]
    [Route("api/finance/categories/{id}")]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        try
        {
            var result = await _categoryService.DeleteCategoryAsync(id);
            if (!result.Success)
            {
                if (result.ErrorMessage == "Category not found.")
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
