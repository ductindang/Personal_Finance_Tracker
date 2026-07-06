using System.ComponentModel.DataAnnotations;

namespace PersonalFinanceTracker.Models
{
    public class LoginViewModel
    {
        [Required(ErrorMessage = "Username or Email is required.")]
        [EmailAddress(ErrorMessage = "Please enter a valid email address.")]
        [Display(Name = "Username or Email")]
        public string UsernameOrEmail { get; set; } = null!;

        [Required(ErrorMessage = "Password is required.")]
        [MinLength(8, ErrorMessage = "Password must be at least 8 characters.")]
        [RegularExpression(
            @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$",
            ErrorMessage = "Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character.")]
        [DataType(DataType.Password)]
        public string Password { get; set; } = null!;
    }
}
