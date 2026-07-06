using System.Collections.Generic;
using System.Threading.Tasks;
using PersonalFinanceTracker.Models;

namespace PersonalFinanceTracker.Services.Interfaces;

public interface ICategoryService
{
    Task<List<Category>> GetCategoriesAsync();
    Task<(bool Success, string? ErrorMessage, Category? Category)> SaveCategoryAsync(Category model);
    Task<(bool Success, string? ErrorMessage)> DeleteCategoryAsync(int id);
}
