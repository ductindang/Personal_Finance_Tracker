---
name: add_3_layer_feature
description: "Triggers when adding a new page or modular feature involving controllers, services, repositories, or dependency injection configurations"
---

# Add 3-Layer Feature Guide

Follow this guide to introduce a new modular component into the application using the 3-layer architecture:

## 1. Create Model Entity
- Create the database entity file under [Models/](file:///c:/Users/tin.dang/source/AI_Project/New_AI_App/Models).
- Update the Database (following the `database_migration` skill if schema changes are required).

## 2. Define Repository (Data Layer)
- **Interface**: Create `I[EntityName]Repository.cs` under [Repositories/Interfaces/](file:///c:/Users/tin.dang/source/AI_Project/New_AI_App/Repositories/Interfaces).
  - Declare standard CRUD signatures asynchronously (e.g. `Task<IEnumerable<T>> GetAllAsync()`).
- **Implementation**: Create `[EntityName]Repository.cs` under [Repositories/](file:///c:/Users/tin.dang/source/AI_Project/New_AI_App/Repositories).
  - Implement the interface using `FinanceDbContext`.

## 3. Define Service (Business Layer)
- **Interface**: Create `I[EntityName]Service.cs` under [Services/Interfaces/](file:///c:/Users/tin.dang/source/AI_Project/New_AI_App/Services/Interfaces).
  - Define high-level business capabilities.
- **Implementation**: Create `[EntityName]Service.cs` under [Services/](file:///c:/Users/tin.dang/source/AI_Project/New_AI_App/Services).
  - Implement business logic, validations, and inject `I[EntityName]Repository`.

## 4. Register Services in Dependency Injection (Program.cs)
Open [Program.cs](file:///c:/Users/tin.dang/source/AI_Project/New_AI_App/Program.cs) and register the new classes:
```csharp
// Register Repositories
builder.Services.AddScoped<I[EntityName]Repository, [EntityName]Repository>();

// Register Services
builder.Services.AddScoped<I[EntityName]Service, [EntityName]Service>();
```

## 5. Implement Controller (Presentation Layer)
- Create `[EntityName]Controller.cs` (for MVC views) or `[EntityName]ApiController.cs` (for REST API actions) under [Controllers/](file:///c:/Users/tin.dang/source/AI_Project/New_AI_App/Controllers).
- Inject `I[EntityName]Service` into the controller.

## 6. Build Frontend Assets
- **CSS**: Add `wwwroot/css/[entityName_lowercase].css` for custom styling.
- **JS**: Add `wwwroot/js/[entityName_lowercase].js` for client-side API fetches and events.
- **Razor View**: Add a view under `Views/[EntityName]/Index.cshtml`. Inject/reference page-specific styles and scripts at the bottom of the page:
  ```html
  @section Styles {
      <link rel="stylesheet" href="~/css/[entityName_lowercase].css" asp-append-version="true" />
  }
  @section Scripts {
      <script src="~/js/[entityName_lowercase].js" asp-append-version="true"></script>
  }
  ```

## 7. Verify and Build
Build the application to ensure all interface implementations compile and dependency injection resolves correctly:
```powershell
dotnet build
```
