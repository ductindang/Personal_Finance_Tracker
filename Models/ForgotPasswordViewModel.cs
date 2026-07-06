using System.ComponentModel.DataAnnotations;

namespace PersonalFinanceTracker.Models
{
    public class ForgotPasswordViewModel
    {
        [Required(ErrorMessage = "Email address is required.")]
        [EmailAddress(ErrorMessage = "Invalid email address format.")]
        [Display(Name = "Email Address")]
        public string Email { get; set; } = null!;
    }
}
