using System.Threading.Tasks;
using PersonalFinanceTracker.Models;

namespace PersonalFinanceTracker.Services.Interfaces;

public interface IAccountService
{
    Task<(bool Success, string? ErrorMessage)> RegisterAsync(RegisterViewModel model);
    Task<User?> ValidateLoginAsync(string usernameOrEmail, string password);
    Task<User> SyncGoogleUserAsync(string email, string? name, string? pictureUrl);
    Task<bool> ForgotPasswordAsync(string email);
    Task<(bool Success, string? ErrorMessage)> SendVerificationCodeAsync(string email);
    Task<(bool Success, string? ErrorMessage)> VerifyCodeAsync(string email, string code);
    Task<(bool Success, string? ErrorMessage)> ResetPasswordAsync(string email, string code, string newPassword);
    Task<(bool Success, string? ErrorMessage)> VerifyEmailCodeAsync(string email, string code);
    Task<(bool Success, string? ErrorMessage)> ResendEmailVerificationCodeAsync(string email);
}
