# Agent Coding Rules & Standards

These rules are applied to all agent operations within the `New_AI_App` workspace. All code modifications must strictly adhere to these guidelines.

---

## 🏗️ 3-Layer Architecture Constraints

To maintain a clean separation of concerns, the application is divided into three distinct layers. Code must not cross layer boundaries (e.g., controllers calling DbContext directly).

### 1. Presentation Layer (Controllers & Views)
- **Files**: Found under [Controllers/](file:///c:/Users/tin.dang/source/AI_Project/New_AI_App/Controllers) and [Views/](file:///c:/Users/tin.dang/source/AI_Project/New_AI_App/Views).
- **Rules**:
  - Controllers must **only** interact with the Service layer (via interfaces registered in `Program.cs`).
  - Controllers must not reference `FinanceDbContext` or execute direct EF Core queries.
  - Return View models (`*ViewModel`) or simple JSON responses. Avoid returning raw DB Entities directly from API controllers to prevent serialization issues.
  - Keep controllers thin; route handling, model state validation, and delegation to services are the only operations allowed here.

### 2. Business Logic Layer (Services)
- **Files**: Found under [Services/](file:///c:/Users/tin.dang/source/AI_Project/New_AI_App/Services) (Interfaces under `Services/Interfaces/`).
- **Rules**:
  - Implements all business validation, logic flows, permissions checks, and calculations.
  - Services must interact with the Data layer through Repository interfaces.
  - Inject multiple Repository interfaces if a service orchestrates multiple entities (e.g., `SavingsService` using `SavingsGoalRepository` and `TransactionRepository`).

### 3. Data Access Layer (Repositories & EF Core)
- **Files**: Found under [Repositories/](file:///c:/Users/tin.dang/source/AI_Project/New_AI_App/Repositories) (Interfaces under `Repositories/Interfaces/`).
- **Rules**:
  - Direct database interactions must live here. Inject `FinanceDbContext` into repositories.
  - Use async/await for all DbContext queries (e.g., `ToListAsync()`, `FirstOrDefaultAsync()`, `SaveChangesAsync()`).
  - Return data entities directly to the services. Do not leak `IQueryable` outside the repository to prevent deferred execution queries outside of the data context lifecycle. Materialize lists inside the repository.

---

## 💾 Code-First Database Rules

- **Entity Models**: Keep database models under [Models/](file:///c:/Users/tin.dang/source/AI_Project/New_AI_App/Models). They must contain primary keys and navigation properties for relationships.
- **DbContext Mapping**: Update [FinanceDbContext.cs](file:///c:/Users/tin.dang/source/AI_Project/New_AI_App/Data/FinanceDbContext.cs) with any new `DbSet<TEntity>` or configuration tweaks in `OnModelCreating`.
- **Migrations Only**: Never update `finance.db` manually. Schema changes must be added via EF Core migrations:
  ```powershell
  dotnet ef migrations add <MigrationName>
  ```
  And applied to the SQLite database via:
  ```powershell
  dotnet ef database update
  ```

---

## 🎨 Frontend Guidelines (JavaScript & CSS)

To prevent bloated files and styling collision, adhere to the following frontend principles:

### 1. JavaScript Standards
- **File Location**: Page-specific scripts must live in `wwwroot/js/<feature>.js` (e.g., `wwwroot/js/budgets.js`).
- **Encapsulation**: Wrap all JS logic in modular patterns (IIFE, Object literals, or ES6 Classes) to avoid polluting the global namespace.
  *Example*:
  ```javascript
  const BudgetPage = (() => {
      const DOM = {
          form: '#budgetForm',
          saveBtn: '#saveBudgetBtn'
      };

      const handleSave = async (e) => {
          e.preventDefault();
          // API calling logic with fetch
      };

      return {
          init: () => {
              const btn = document.querySelector(DOM.saveBtn);
              if (btn) btn.addEventListener('click', handleSave);
          }
      };
  })();

  document.addEventListener('DOMContentLoaded', () => BudgetPage.init());
  ```
- **Asynchronous Operations**: Use `async/await` and the `fetch` API for all background network requests. Always wrap requests in `try/catch` and display user-friendly error indicators.

### 2. CSS Standards
- **File Location**: Page-specific styles must live in `wwwroot/css/<feature>.css`.
- **Global Styles**: Global variables and shared utility classes must live in `wwwroot/css/site.css`. Do not write page-specific styles in `site.css`.
- **Design Tokens**: Use CSS Custom Properties defined in `site.css` for consistent spacing, fonts, and colors:
  *Example*: `color: var(--primary-color);`
- **Naming Conventions**: Use structured class names (such as BEM - Block Element Modifier) to avoid cascading scope leakage. For example: `.savings-card`, `.savings-card__title`, `.savings-card--active`.
- **Responsiveness**: Ensure all views are responsive using mobile-first layout rules and media queries.

---

## 🎫 Jira Integration & Safety Rules

To prevent accidental modifications, data loss, or incorrect workflows in Jira:
- **Confirmation Prior to Mutation**: Before executing write operations (such as creating, updating, transitioning, or deleting issues, comments, worklogs, or sprints), the agent must clearly present the proposed changes/actions to the user and obtain explicit confirmation.
- **Search & Scope Constraints**: Only retrieve or modify issues that are directly relevant to this workspace project. Do not run broad bulk actions unless requested.
- **No Mock IDs**: Ensure Jira project keys (e.g. `KAN`, `SAM1`) and issue keys are derived directly from Jira search results, not hardcoded or guessed.
- **Sanitized Comments & Content**: Keep all automated logs, comments, and issue descriptions professional, concise, and focused strictly on the technical context. Avoid publishing internal debugging scripts or credentials.

---

## 📝 Documentation Maintenance Rule

- **Keep Project Guide Updated**: Whenever any new feature, controller, service, database schema, or integration is added, changed, or deleted, the agent must immediately update [PROJECT_GUIDE.md](file:///c:/Users/tin.dang/source/AI_Project/Personal_Finance_Tracker/PROJECT_GUIDE.md) to ensure the documentation is fully up to date and covers the complete project scope.

