using Microsoft.EntityFrameworkCore;
using PersonalFinanceTracker.Models;

namespace PersonalFinanceTracker.Data
{
    public class FinanceDbContext : DbContext
    {
        public FinanceDbContext(DbContextOptions<FinanceDbContext> options)
            : base(options)
        {
        }

        public DbSet<Transaction> Transactions { get; set; } = null!;
        public DbSet<Budget> Budgets { get; set; } = null!;
        public DbSet<SavingsGoal> SavingsGoals { get; set; } = null!;
        public DbSet<Category> Categories { get; set; } = null!;
        public DbSet<User> Users { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Seed Admin User
            var adminUser = new User
            {
                Id = 1,
                Username = "admin",
                Email = "admin@example.com",
                FullName = "Administrator",
                ProfilePictureUrl = "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/712020:e878da9b-63da-4d9d-895d-92478f695579/152fb82e-dd1a-44a4-bdca-57ab9feb5d58/48",
                PasswordHash = "AQAAAAIAAYagAAAAEGDPrVfxsYQwKGNckFi/vyGW6Jr7vaKHVkR8nXh691jQtU1T7Y2lzLPK4sM82xg7oA=="
            };

            modelBuilder.Entity<User>().HasData(adminUser);

            // Default categories seeding
            modelBuilder.Entity<Category>().HasData(
                new Category { Id = 1, Name = "Salary", Type = "income" },
                new Category { Id = 2, Name = "Investment", Type = "income" },
                new Category { Id = 3, Name = "Bonus", Type = "income" },
                new Category { Id = 4, Name = "Others", Type = "income" },
                new Category { Id = 5, Name = "Food & Beverage", Type = "expense" },
                new Category { Id = 6, Name = "Shopping", Type = "expense" },
                new Category { Id = 7, Name = "Housing", Type = "expense" },
                new Category { Id = 8, Name = "Transportation", Type = "expense" },
                new Category { Id = 9, Name = "Utilities", Type = "expense" },
                new Category { Id = 10, Name = "Entertainment", Type = "expense" },
                new Category { Id = 11, Name = "Health", Type = "expense" },
                new Category { Id = 12, Name = "Others", Type = "expense" }
            );

            // Configure decimal precision for SQL Server
            modelBuilder.Entity<Transaction>()
                .Property(t => t.Amount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Budget>()
                .Property(b => b.LimitAmount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<SavingsGoal>()
                .Property(g => g.TargetAmount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<SavingsGoal>()
                .Property(g => g.CurrentAmount)
                .HasPrecision(18, 2);
        }
    }
}
