# Personal Finance Tracker

A modern personal finance tracker built with ASP.NET Core MVC, Entity Framework Core, and SQLite. The application helps users manage budgets, categorize transactions, track savings goals, and monitor overall financial health through a modular, three-layer architecture.

---

## 🏗️ Architecture Overview

The project is structured following a strict **3-Layer Architecture** to enforce separation of concerns, maintainability, and clean code principles:

1. **Presentation Layer (MVC & Web APIs)**
   - Located in [Controllers/](file:///c:/Users/tin.dang/source/AI_Project/New_AI_App/Controllers) and [Views/](file:///c:/Users/tin.dang/source/AI_Project/New_AI_App/Views).
   - Responsible for rendering HTML templates, routing, and exposing RESTful API endpoints for client-side JS actions.
   - Controllers should be "thin" and only delegate business logic to the Services layer.

2. **Business Logic Layer (Services)**
   - Located in [Services/](file:///c:/Users/tin.dang/source/AI_Project/New_AI_App/Services) (interfaces under `Services/Interfaces/`).
   - Implements business logic, inputs validation, data transformations, and orchestrates repository calls.

3. **Data Access Layer (Repositories & EF Core)**
   - Repositories located in [Repositories/](file:///c:/Users/tin.dang/source/AI_Project/New_AI_App/Repositories) (interfaces under `Repositories/Interfaces/`).
   - Manages direct CRUD actions on the database using Entity Framework Core.
   - DbContext and entity configurations are defined in [Data/](file:///c:/Users/tin.dang/source/AI_Project/New_AI_App/Data).

---

## 📁 Directory Structure

```text
├── Controllers/         # MVC Controllers & API Endpoints
├── Services/            # Business Logic implementation
│   └── Interfaces/      # Service Contracts
├── Repositories/        # Database CRUD implementations
│   └── Interfaces/      # Repository Contracts
├── Models/              # Database entities & ViewModels
├── Data/                # DbContext and Migrations
├── Views/               # Razor views (.cshtml) per controller
└── wwwroot/             # Static assets (CSS, JS, libraries)
    ├── css/             # Page-specific CSS files
    ├── js/              # Page-specific modular JS files
    └── lib/             # Third-party client dependencies (Bootstrap, etc.)
```

---

## 🛠️ Getting Started

### Prerequisites
* [.NET 9.0 SDK](https://dotnet.microsoft.com/download) or later
* [Entity Framework Core Tools CLI](https://learn.microsoft.com/en-us/ef/core/cli/dotnet) (`dotnet tool install --global dotnet-ef`)

### Local Setup
1. **Clone the Repository**
2. **Restore Dependencies**
   ```powershell
   dotnet restore
   ```
3. **Database Configuration**
   The application uses an SQLite database (`finance.db`) configured in [appsettings.json](file:///c:/Users/tin.dang/source/AI_Project/New_AI_App/appsettings.json). Apply the existing EF Core migrations to initialize the database:
   ```powershell
   dotnet ef database update
   ```
4. **Run the Application**
   ```powershell
   dotnet run
   ```
   Open `http://localhost:5000` (or the HTTPS URL printed in the console) to access the tracker.

---

## 💾 Code-First Database Migrations

When you need to modify database models:
1. Update files in the [Models/](file:///c:/Users/tin.dang/source/AI_Project/New_AI_App/Models) directory.
2. If necessary, configure relationships in [Data/FinanceDbContext.cs](file:///c:/Users/tin.dang/source/AI_Project/New_AI_App/Data/FinanceDbContext.cs).
3. Create a migration:
   ```powershell
   dotnet ef migrations add <MigrationDescription>
   ```
4. Apply the migration to update the SQLite database:
   ```powershell
   dotnet ef database update
   ```

---

## 🎨 CSS & JavaScript Guidelines

To keep page styling and scripts clean and maintainable:
- **Modular Styles**: Page-specific styling should be placed in its corresponding CSS file under `wwwroot/css/` (e.g. `wwwroot/css/budgets.css` for budgets). Keep rules nested and scoped to prevent style leakage.
- **Structured JavaScript**: JavaScript code should be written in separate files under `wwwroot/js/` (e.g. `wwwroot/js/savings.js`). Wrap page operations in standard modules or namespace patterns to avoid polluting the global scope.
