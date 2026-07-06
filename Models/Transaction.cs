using System;

namespace PersonalFinanceTracker.Models
{
    public class Transaction
    {
        public int Id { get; set; }
        public string Type { get; set; } = "expense"; // "income" or "expense"
        public decimal Amount { get; set; }
        public string Category { get; set; } = "Others";
        public DateTime Date { get; set; }
        public string Description { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public int UserId { get; set; }
        public User? User { get; set; }
    }
}
