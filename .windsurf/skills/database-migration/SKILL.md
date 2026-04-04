---
name: database-migration
description: Complete guide for creating and managing Prisma database migrations safely
tags:
  - database
  - prisma
  - migration
  - schema
---

# Database Migration Guide

Step-by-step guide for creating, testing, and deploying Prisma migrations safely.

## When to Create a Migration

Create a migration when you:

- Add/remove/modify database tables
- Add/remove/modify columns
- Change column types or constraints
- Add/modify indexes
- Change relationships

## Development Flow

### Step 1: Modify Prisma Schema

Edit `prisma/schema.prisma`:

```prisma
model Expense {
  id          String      @id @default(cuid())
  userId      String
  amount      Float
  description String
  // New field example:
  receiptUrl  String?     // Add optional receipt image URL
  type        ExpenseType
  date        DateTime    @default(now())
  createdAt   DateTime    @default(now())

  user     User      @relation(fields: [userId], references: [id])
  category Category? @relation(fields: [categoryId], references: [id])
}
```

### Step 2: Create Migration

```bash
# Create and apply migration
npm run prisma:migrate

# You will be prompted to name the migration
# Use descriptive names: add_receipt_url, update_user_schema, etc.
```

**Naming Convention:**

- `add_[field_name]` - Adding new field
- `remove_[field_name]` - Removing field
- `update_[model_name]` - Updating model structure
- `create_[model_name]` - Creating new model
- `add_index_[field_name]` - Adding index

### Step 3: Review Generated Migration

Check `prisma/migrations/[timestamp]_[name]/migration.sql`:

```sql
-- Example: AlterTable
ALTER TABLE "Expense" ADD COLUMN "receiptUrl" TEXT;
```

**Verify:**

- [ ] SQL syntax is correct
- [ ] No data loss (for destructive changes)
- [ ] Indexes are properly created
- [ ] Constraints are correct

### Step 4: Update TypeScript Code

Update service files to use new schema:

```typescript
// src/services/expense.ts
export async function createExpense(data: CreateExpenseInput) {
  return prisma.expense.create({
    data: {
      userId: data.userId,
      amount: data.amount,
      description: data.description,
      receiptUrl: data.receiptUrl, // New field
      categoryId: data.categoryId,
      type: data.type,
    },
  });
}
```

### Step 5: Update Types

Update `src/types/index.ts`:

```typescript
export interface CreateExpenseInput {
  userId: string;
  amount: number;
  description: string;
  receiptUrl?: string; // New optional field
  categoryId?: string;
  type: ExpenseType;
}
```

### Step 6: Test Migration

```bash
# Reset and re-apply (development only!)
npx prisma migrate reset

# Verify schema
npx prisma db pull

# Check with Prisma Studio
npm run prisma:studio
```

## Production Deployment

### Pre-Deployment Checklist

- [ ] Migration tested locally
- [ ] Backup database created
- [ ] Migration is backward compatible (if possible)
- [ ] Rollback plan prepared
- [ ] Code changes deployed before migration (if adding fields)
- [ ] Code changes deployed after migration (if removing fields)

### Step 1: Backup Database

```bash
# PostgreSQL backup
pg_dump -h localhost -U postgres -d expensebot > backup_$(date +%Y%m%d_%H%M%S).sql

# Or use cloud provider's backup feature
```

### Step 2: Deploy Migration

```bash
# On production server
npx prisma migrate deploy
```

**Note:** Use `migrate deploy` in production, NOT `migrate dev`

### Step 3: Verify Migration

```bash
# Check migration status
npx prisma migrate status

# Should show: Database schema is up to date!
```

### Step 4: Monitor Application

```bash
# Check logs for errors
pm2 logs expense-bot

# Verify database connections
npx prisma db execute --stdin < check_schema.sql
```

## Common Migration Scenarios

### Adding a Required Field

**Problem:** Existing rows will fail

**Solution:** Use two-step migration

```prisma
// Step 1: Add as optional
receiptUrl String?

// Deploy and populate data

// Step 2: Make required (later migration)
receiptUrl String
```

### Renaming a Column

```prisma
// DON'T: Prisma will drop and recreate (data loss!)
// Old: userName
// New: fullName

// DO: Manual migration
```

Create manual migration in `migrations/[timestamp]_rename_user_name/migration.sql`:

```sql
ALTER TABLE "User" RENAME COLUMN "userName" TO "fullName";
```

### Changing Column Type

```prisma
// Before: amount Float
// After: amount Decimal @db.Decimal(10, 2)
```

**Warning:** May cause data loss or precision issues

**Solution:**

```sql
-- Safe type conversion
ALTER TABLE "Expense"
  ALTER COLUMN "amount" TYPE DECIMAL(10,2)
  USING amount::DECIMAL(10,2);
```

### Adding Indexes

```prisma
model Expense {
  // Add index for common queries
  @@index([userId, date])
  @@index([categoryId])
}
```

**Note:** Indexes improve query performance but slow down writes

## Rollback Procedures

### Rollback Last Migration (Development)

```bash
npx prisma migrate reset
```

### Rollback in Production

```bash
# Restore from backup
psql -h localhost -U postgres -d expensebot < backup_20260325_120000.sql

# Or create reverse migration manually
```

### Create Reverse Migration

```sql
-- migrations/[timestamp]_revert_receipt_url/migration.sql
ALTER TABLE "Expense" DROP COLUMN "receiptUrl";
```

## Troubleshooting

### Issue: Migration fails with "relation already exists"

**Cause:** Migration was partially applied

**Solution:**

```bash
# Mark migration as applied
npx prisma migrate resolve --applied [migration_name]

# Or reset (dev only)
npx prisma migrate reset
```

### Issue: Schema drift detected

**Cause:** Manual database changes

**Solution:**

```bash
# See differences
npx prisma db pull

# Create migration to match current state
npx prisma migrate dev --create-only
```

### Issue: Database locked during migration

**Cause:** Active connections

**Solution:**

```bash
# Stop application
pm2 stop expense-bot

# Run migration
npx prisma migrate deploy

# Restart application
pm2 start expense-bot
```

## Best Practices

✅ **Do:**

- Always backup before production migrations
- Test migrations in development first
- Use descriptive migration names
- Review generated SQL before applying
- Keep migrations small and focused
- Document breaking changes

❌ **Don't:**

- Use `migrate dev` in production
- Modify existing migration files
- Skip migrations
- Force push schema changes
- Make destructive changes without backups

## Docker Environment

When using Docker Compose:

```bash
# Run migration in container
docker-compose exec app npm run prisma:migrate

# Or during build
docker-compose up -d db
docker-compose run --rm app npx prisma migrate deploy
```

## Related Files

- `prisma/schema.prisma` - Database schema
- `prisma/migrations/` - Migration history
- `src/db/prisma.ts` - Prisma client
- `.env` - Database connection string

## Resources

- [Prisma Migrate Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Migration Best Practices](https://www.prisma.io/docs/guides/migrate/production-troubleshooting)
