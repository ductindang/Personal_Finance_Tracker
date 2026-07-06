using System;

namespace PersonalFinanceTracker.Models
{
    public class SavingsGoal
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public decimal TargetAmount { get; set; }
        public decimal CurrentAmount { get; set; }
        public DateTime TargetDate { get; set; }

        public int UserId { get; set; }
        public User? User { get; set; }
    }
}
