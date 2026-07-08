using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using PersonalFinanceTracker.Models;
using PersonalFinanceTracker.Repositories.Interfaces;
using PersonalFinanceTracker.Services.Interfaces;

namespace PersonalFinanceTracker.Services;

public class AccountService : IAccountService
{
    private readonly IUserRepository _userRepository;
    private readonly PasswordHasher<User> _passwordHasher;
    private readonly IEmailService _emailService;

    public AccountService(IUserRepository userRepository, IEmailService emailService)
    {
        _userRepository = userRepository;
        _passwordHasher = new PasswordHasher<User>();
        _emailService = emailService;
    }

    public async Task<(bool Success, string? ErrorMessage)> RegisterAsync(RegisterViewModel model)
    {
        var existingEmail = await _userRepository.GetByEmailAsync(model.Email);
        if (existingEmail != null)
        {
            return (false, "Email address is already registered.");
        }

        var existingUsername = await _userRepository.GetByUsernameAsync(model.Username);
        if (existingUsername != null)
        {
            return (false, "Username is already taken.");
        }

        var user = new User
        {
            Username = model.Username,
            Email = model.Email,
            FullName = model.FullName
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, model.Password);

        await _userRepository.AddAsync(user);
        await _userRepository.SaveChangesAsync();

        return (true, null);
    }

    public async Task<User?> ValidateLoginAsync(string usernameOrEmail, string password)
    {
        var user = await _userRepository.GetByEmailOrUsernameAsync(usernameOrEmail);
        if (user == null || string.IsNullOrEmpty(user.PasswordHash))
        {
            return null;
        }

        var verificationResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, password);
        if (verificationResult == PasswordVerificationResult.Failed)
        {
            return null;
        }

        return user;
    }

    public async Task<User> SyncGoogleUserAsync(string email, string? name, string? pictureUrl)
    {
        var user = await _userRepository.GetByEmailAsync(email);
        if (user == null)
        {
            user = new User
            {
                Username = email.Split('@')[0],
                Email = email,
                FullName = name,
                ProfilePictureUrl = pictureUrl
            };
            await _userRepository.AddAsync(user);
        }
        else
        {
            user.FullName = name ?? user.FullName;
            user.ProfilePictureUrl = pictureUrl ?? user.ProfilePictureUrl;
            _userRepository.Update(user);
        }

        await _userRepository.SaveChangesAsync();
        return user;
    }

    public async Task<bool> ForgotPasswordAsync(string email)
    {
        var user = await _userRepository.GetByEmailAsync(email);
        return user != null;
    }

    public async Task<(bool Success, string? ErrorMessage)> SendVerificationCodeAsync(string email)
    {
        var user = await _userRepository.GetByEmailAsync(email);
        if (user == null)
        {
            return (false, "User with this email does not exist.");
        }

        if (user.PasswordResetCodeLastSent.HasValue && (DateTime.UtcNow - user.PasswordResetCodeLastSent.Value).TotalSeconds < 30)
        {
            var remaining = 30 - (int)(DateTime.UtcNow - user.PasswordResetCodeLastSent.Value).TotalSeconds;
            return (false, $"Please wait {remaining} seconds before requesting a new verification code.");
        }

        var random = new Random();
        var code = random.Next(100000, 999999).ToString();

        user.PasswordResetCode = code;
        user.PasswordResetCodeExpiry = DateTime.UtcNow.AddMinutes(15);
        user.PasswordResetCodeLastSent = DateTime.UtcNow;

        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();

        // Send actual email
        var subject = "Your Password Reset Verification Code";
        var body = $@"
            <div style='font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px; max-width: 500px;'>
                <h2 style='color: #4f46e5;'>Aura Finance Tracker</h2>
                <p>Hello,</p>
                <p>You requested to reset your password. Please use the following 6-digit verification code to proceed:</p>
                <div style='background-color: #f3f4f6; font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; padding: 12px; margin: 20px 0; border-radius: 8px; color: #1e1b4b;'>
                    {code}
                </div>
                <p>This code is valid for 15 minutes. If you did not request this, you can safely ignore this email.</p>
                <hr style='border: none; border-top: 1px solid #eee; margin-top: 20px;' />
                <p style='font-size: 12px; color: #6b7280;'>This is an automated email, please do not reply.</p>
            </div>";

        try
        {
            await _emailService.SendEmailAsync(email, subject, body);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[EMAIL ERROR] Failed to send actual email to {email}: {ex.Message}");
            System.Diagnostics.Debug.WriteLine($"[EMAIL ERROR] Failed to send actual email to {email}: {ex.Message}");
            
            // For resilience in development, print code to console so developer is not blocked if credentials are missing
            Console.WriteLine($"\n==================================================");
            Console.WriteLine($"[FALLBACK SIMULATION] Verification Code for {email}: {code}");
            Console.WriteLine($"==================================================\n");
            
            return (false, "Could not send verification email. Please check your SMTP settings or verify the console logs for the fallback code.");
        }

        return (true, null);
    }

    public async Task<(bool Success, string? ErrorMessage)> VerifyCodeAsync(string email, string code)
    {
        var user = await _userRepository.GetByEmailAsync(email);
        if (user == null)
        {
            return (false, "User not found.");
        }

        if (string.IsNullOrEmpty(user.PasswordResetCode) || user.PasswordResetCode != code)
        {
            return (false, "Invalid verification code.");
        }

        if (!user.PasswordResetCodeExpiry.HasValue || user.PasswordResetCodeExpiry.Value < DateTime.UtcNow)
        {
            return (false, "Verification code has expired.");
        }

        return (true, null);
    }

    public async Task<(bool Success, string? ErrorMessage)> ResetPasswordAsync(string email, string code, string newPassword)
    {
        var verifyResult = await VerifyCodeAsync(email, code);
        if (!verifyResult.Success)
        {
            return verifyResult;
        }

        var user = await _userRepository.GetByEmailAsync(email);
        if (user == null)
        {
            return (false, "User not found.");
        }

        user.PasswordHash = _passwordHasher.HashPassword(user, newPassword);
        user.PasswordResetCode = null;
        user.PasswordResetCodeExpiry = null;

        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();

        return (true, null);
    }
}
