using System.Threading.Tasks;
using PersonalFinanceTracker.Models;

namespace PersonalFinanceTracker.Services.Interfaces;

public interface IAccountService
{
    Task<(bool Success, string? ErrorMessage)> RegisterAsync(RegisterViewModel model);
    Task<User?> ValidateLoginAsync(string usernameOrEmail, string password);
    Task<User> SyncGoogleUserAsync(string email, string? name, string? pictureUrl);
    Task<bool> ForgotPasswordAsync(string email);
}
