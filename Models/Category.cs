namespace PersonalFinanceTracker.Models
{
    public class Category
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = "expense"; // "income" or "expense"
    }
}
