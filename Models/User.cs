namespace PersonalFinanceTracker.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string? PasswordHash { get; set; } // Nullable to support external logins (Google)
        public string? FullName { get; set; }
        public string? ProfilePictureUrl { get; set; }
        public string? PasswordResetCode { get; set; }
        public DateTime? PasswordResetCodeExpiry { get; set; }
        public DateTime? PasswordResetCodeLastSent { get; set; }
    }
}
