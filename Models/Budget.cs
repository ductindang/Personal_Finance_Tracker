namespace PersonalFinanceTracker.Models
{
    public class Budget
    {
        public int Id { get; set; }
        public string Category { get; set; } = string.Empty;
        public decimal LimitAmount { get; set; }
        public string Month { get; set; } = string.Empty; // Format: "YYYY-MM"

        public int UserId { get; set; }
        public User? User { get; set; }
    }
}
