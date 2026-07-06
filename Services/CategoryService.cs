using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using PersonalFinanceTracker.Models;
using PersonalFinanceTracker.Repositories.Interfaces;
using PersonalFinanceTracker.Services.Interfaces;

namespace PersonalFinanceTracker.Services;

public class CategoryService : ICategoryService
{
    private readonly ICategoryRepository _categoryRepository;
    private readonly ITransactionRepository _transactionRepository;

    public CategoryService(ICategoryRepository categoryRepository, ITransactionRepository transactionRepository)
    {
        _categoryRepository = categoryRepository;
        _transactionRepository = transactionRepository;
    }

    public async Task<List<Category>> GetCategoriesAsync()
    {
        return await _categoryRepository.GetAllCategoriesAsync();
    }

    public async Task<(bool Success, string? ErrorMessage, Category? Category)> SaveCategoryAsync(Category model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.Name))
        {
            return (false, "Category name is required.", null);
        }

        model.Name = model.Name.Trim();

        // Check for duplicates for new category
        if (model.Id == 0)
        {
            var existing = await _categoryRepository.GetByNameAndTypeAsync(model.Name, model.Type);
            if (existing != null)
            {
                return (false, $"Category '{model.Name}' already exists under {model.Type}.", null);
            }

            await _categoryRepository.AddAsync(model);
        }
        else
        {
            var original = await _categoryRepository.GetByIdAsync(model.Id);
            if (original == null)
            {
                return (false, "Category not found.", null);
            }

            // Check if renaming causes a duplicate with another category
            var duplicate = await _categoryRepository.GetByNameAndTypeAsync(model.Name, model.Type);
            if (duplicate != null && duplicate.Id != model.Id)
            {
                return (false, $"Category '{model.Name}' already exists.", null);
            }

            // Update transactions using this category
            await _transactionRepository.UpdateCategoryNameAsync(original.Name, original.Type, model.Name);
            await _transactionRepository.SaveChangesAsync(); // Commit transaction changes first or save them together

            original.Name = model.Name;
            original.Type = model.Type;
            _categoryRepository.Update(original);
            model = original;
        }

        await _categoryRepository.SaveChangesAsync();
        return (true, null, model);
    }

    public async Task<(bool Success, string? ErrorMessage)> DeleteCategoryAsync(int id)
    {
        var category = await _categoryRepository.GetByIdAsync(id);
        if (category == null)
        {
            return (false, "Category not found.");
        }

        if (category.Name == "Others")
        {
            return (false, "Cannot delete the default 'Others' category.");
        }

        // Update all transactions of this category to "Others"
        await _transactionRepository.SetCategoryToOthersAsync(category.Name, category.Type);
        await _transactionRepository.SaveChangesAsync();

        _categoryRepository.Delete(category);
        await _categoryRepository.SaveChangesAsync();

        return (true, null);
    }
}
