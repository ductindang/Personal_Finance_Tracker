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

    public AccountService(IUserRepository userRepository)
    {
        _userRepository = userRepository;
        _passwordHasher = new PasswordHasher<User>();
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
}
