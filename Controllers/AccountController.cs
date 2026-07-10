using System.Linq;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalFinanceTracker.Models;
using PersonalFinanceTracker.Services.Interfaces;

namespace PersonalFinanceTracker.Controllers
{
    public class AccountController : Controller
    {
        private readonly IAccountService _accountService;
        private readonly IConfiguration _configuration;

        public AccountController(IAccountService accountService, IConfiguration configuration)
        {
            _accountService = accountService;
            _configuration = configuration;
        }

        [HttpGet]
        public IActionResult Login(string? returnUrl = null)
        {
            if (User.Identity?.IsAuthenticated == true)
            {
                return RedirectToAction("Index", "Home");
            }

            ViewData["ReturnUrl"] = returnUrl;
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Login(LoginViewModel model, string? returnUrl = null)
        {
            ViewData["ReturnUrl"] = returnUrl;

            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                return Json(new { success = false, errors });
            }

            var user = await _accountService.ValidateLoginAsync(model.UsernameOrEmail, model.Password);
            if (user == null)
            {
                return Json(new { success = false, errors = new[] { "Invalid login credentials." } });
            }

            if (!user.IsEmailVerified)
            {
                return Json(new { success = false, requiresVerification = true, redirectUrl = Url.Action(nameof(VerifyEmail), new { email = user.Email }) });
            }

            await SignInUserAsync(user);

            var redirectUrl = (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl)) ? returnUrl : Url.Action("Index", "Home");
            return Json(new { success = true, redirectUrl });
        }

        [HttpGet]
        public IActionResult Register()
        {
            if (User.Identity?.IsAuthenticated == true)
            {
                return RedirectToAction("Index", "Home");
            }

            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Register(RegisterViewModel model)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                return Json(new { success = false, errors });
            }

            var (success, errorMessage) = await _accountService.RegisterAsync(model);
            if (!success)
            {
                return Json(new { success = false, errors = new[] { errorMessage ?? "Registration failed." } });
            }

            return Json(new { success = true, redirectUrl = Url.Action(nameof(VerifyEmail), new { email = model.Email }) });
        }

        [HttpGet]
        public IActionResult VerifyEmail(string email)
        {
            if (string.IsNullOrEmpty(email))
            {
                return RedirectToAction(nameof(Login));
            }

            ViewData["Email"] = email;
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> VerifyEmail(string email, string code)
        {
            ViewData["Email"] = email;

            if (string.IsNullOrEmpty(code) || code.Length != 6)
            {
                return Json(new { success = false, errors = new[] { "Verification code must be exactly 6 digits." } });
            }

            var (success, errorMessage) = await _accountService.VerifyEmailCodeAsync(email, code);
            if (!success)
            {
                return Json(new { success = false, errors = new[] { errorMessage ?? "Verification failed." } });
            }

            return Json(new { success = true, redirectUrl = Url.Action(nameof(Login)) });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ResendVerificationCode(string email)
        {
            if (string.IsNullOrEmpty(email))
            {
                return Json(new { success = false, errors = new[] { "Email is required." } });
            }

            var (success, errorMessage) = await _accountService.ResendEmailVerificationCodeAsync(email);
            if (!success)
            {
                return Json(new { success = false, errors = new[] { errorMessage ?? "Failed to resend verification code." } });
            }

            return Json(new { success = true, message = "A new verification code has been sent to your email." });
        }

        [HttpGet]
        public IActionResult ExternalLogin(string provider = "Google", string? returnUrl = null)
        {
            var googleClientId = _configuration["Authentication:Google:ClientId"];
            
            // Check if actual Google keys are configured. If not, redirect to Simulated consent flow
            if (string.IsNullOrEmpty(googleClientId) || googleClientId == "MOCK_CLIENT_ID")
            {
                return RedirectToAction("SimulatedGoogleLogin", new { returnUrl });
            }

            var redirectUrl = Url.Action("GoogleCallback", "Account", new { returnUrl });
            var properties = new AuthenticationProperties { RedirectUri = redirectUrl };
            return Challenge(properties, provider);// <-- Triggers real Google OAuth
        }

        [HttpGet]
        public async Task<IActionResult> GoogleCallback(string? returnUrl = null)
        {
            var result = await HttpContext.AuthenticateAsync("ExternalCookie");
            if (!result.Succeeded || result.Principal == null)
            {
                TempData["ErrorMessage"] = "Google authentication failed.";
                return RedirectToAction(nameof(Login));
            }

            var email = result.Principal.FindFirstValue(ClaimTypes.Email);
            var name = result.Principal.FindFirstValue(ClaimTypes.Name);
            var picture = result.Principal.FindFirstValue("picture"); // Standard OIDC profile image claim

            if (string.IsNullOrEmpty(email))
            {
                TempData["ErrorMessage"] = "Could not retrieve email from Google.";
                return RedirectToAction(nameof(Login));
            }

            var user = await _accountService.SyncGoogleUserAsync(email, name, picture);
            await SignInUserAsync(user);
            await HttpContext.SignOutAsync("ExternalCookie");

            if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl))
            {
                return Redirect(returnUrl);
            }

            return RedirectToAction("Index", "Home");
        }

        [HttpGet]
        public IActionResult SimulatedGoogleLogin(string? returnUrl = null)
        {
            ViewData["ReturnUrl"] = returnUrl;
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> SimulatedGoogleLogin(string email, string name, string? returnUrl = null)
        {
            if (string.IsNullOrEmpty(email) || !email.Contains("@"))
            {
                ModelState.AddModelError(string.Empty, "Please enter a valid email address.");
                return View();
            }

            // Sync user details locally (sync data to my application)
            var mockAvatar = "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/712020:e878da9b-63da-4d9d-895d-92478f695579/152fb82e-dd1a-44a4-bdca-57ab9feb5d58/48";
            var user = await _accountService.SyncGoogleUserAsync(email, name ?? email.Split('@')[0], mockAvatar);
            
            await SignInUserAsync(user);

            if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl))
            {
                return Redirect(returnUrl);
            }

            return RedirectToAction("Index", "Home");
        }

        [HttpGet]
        public IActionResult ForgotPassword()
        {
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> SendVerificationCode(ForgotPasswordViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return Json(new { success = false, message = "Invalid email address format." });
            }

            var (success, error) = await _accountService.SendVerificationCodeAsync(model.Email);
            if (!success)
            {
                return Json(new { success = false, message = error });
            }

            return Json(new { success = true, message = "Verification code has been sent to your email." });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> VerifyCode(VerifyCodeViewModel model)
        {
            if (!ModelState.IsValid)
            {
                var errors = string.Join(" ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
                return Json(new { success = false, message = errors });
            }

            var (success, error) = await _accountService.VerifyCodeAsync(model.Email, model.Code);
            if (!success)
            {
                return Json(new { success = false, message = error });
            }

            return Json(new { success = true, message = "Code verified successfully." });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ResetPassword(ResetPasswordViewModel model)
        {
            if (!ModelState.IsValid)
            {
                var errors = string.Join(" ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
                return Json(new { success = false, message = errors });
            }

            var (success, error) = await _accountService.ResetPasswordAsync(model.Email, model.Code, model.Password);
            if (!success)
            {
                return Json(new { success = false, message = error });
            }

            return Json(new { success = true, message = "Password reset successfully. Redirecting to login..." });
        }

        [HttpPost]
        [Authorize]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return RedirectToAction(nameof(Login));
        }

        private async Task SignInUserAsync(User user)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.FullName ?? user.Username),
                new Claim(ClaimTypes.Email, user.Email)
            };

            if (!string.IsNullOrEmpty(user.ProfilePictureUrl))
            {
                claims.Add(new Claim("ProfilePicture", user.ProfilePictureUrl));
            }

            var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
            var principal = new ClaimsPrincipal(identity);

            await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal, new AuthenticationProperties
            {
                IsPersistent = true,
                ExpiresUtc = DateTimeOffset.UtcNow.AddMinutes(20)
            });
        }
    }
}
