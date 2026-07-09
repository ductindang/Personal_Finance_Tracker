using System;

namespace PersonalFinanceTracker.Models
{
    public class RecurringTransaction
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User? User { get; set; }
        public string Type { get; set; } = "expense"; // "income" or "expense"
        public decimal Amount { get; set; }
        public string Category { get; set; } = "Others";
        public string Description { get; set; } = string.Empty;
        public string Frequency { get; set; } = "Monthly"; // "Daily", "Weekly", "Monthly", "Yearly"
        public string ExecutionTime { get; set; } = "00:00"; // "HH:mm" execution time
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public DateTime NextOccurrence { get; set; }
        public DateTime? LastProcessed { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
