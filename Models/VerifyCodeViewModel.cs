using System.ComponentModel.DataAnnotations;

namespace PersonalFinanceTracker.Models
{
    public class VerifyCodeViewModel
    {
        [Required(ErrorMessage = "Email address is required.")]
        [EmailAddress(ErrorMessage = "Invalid email address format.")]
        public string Email { get; set; } = null!;

        [Required(ErrorMessage = "Verification code is required.")]
        [StringLength(6, MinimumLength = 6, ErrorMessage = "Verification code must be exactly 6 digits.")]
        [RegularExpression(@"^\d{6}$", ErrorMessage = "Verification code must contain digits only.")]
        public string Code { get; set; } = null!;
    }
}
