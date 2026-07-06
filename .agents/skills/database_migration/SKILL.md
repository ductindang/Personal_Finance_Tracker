---
name: database_migration
description: "Triggers when adding or modifying database model structures and running Entity Framework Core migrations"
---

# Database Migration Guide

Follow this systematic checklist when updating the database schema:

## 1. Update Models
- Add or modify model properties in the [Models/](file:///c:/Users/tin.dang/source/AI_Project/New_AI_App/Models) directory.
- For new entities, ensure proper annotations (e.g. `[Key]`, `[Required]`, `[ForeignKey]`).
- For new entities, register them as `DbSet<TEntity>` in [FinanceDbContext.cs](file:///c:/Users/tin.dang/source/AI_Project/New_AI_App/Data/FinanceDbContext.cs).

## 2. Verify Compilation
Before creating a migration, ensure the project builds successfully. Propose the following command:
```powershell
dotnet build
```

## 3. Create Migration
If the build succeeds, propose creating the migration. Name it using `CamelCase` indicating the change:
```powershell
dotnet ef migrations add <MigrationName>
```

## 4. Review Migration File
Inspect the generated migration file under `Data/Migrations/` to ensure it only performs the intended schema updates.

## 5. Update Database
Propose applying the migration to the local SQLite database (`finance.db`):
```powershell
dotnet ef database update
```

## 6. Verify Table Schema
Ensure that the database update executed successfully without throwing SQLite errors. Verify the schema works as expected by running the app and inspecting data operations.
