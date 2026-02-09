# AGENTS.md - AI Agent Context for Basic Bookkeeping

This file contains critical context, patterns, and gotchas for AI agents working on this codebase.

## Project Overview

**Basic Bookkeeping** - A full-stack bookkeeping web application for tracking income/expenses, managing invoices, and generating financial reports.

### Tech Stack
- **Framework:** Next.js 16.1.6 with App Router and TypeScript
- **UI:** Tailwind CSS v4, shadcn/ui components (Radix-based)
- **Database:** SQLite with Prisma ORM 7.x
- **Auth:** NextAuth.js v5 (beta)
- **Charts:** Recharts

---

## Critical Patterns

### Environment Setup
```bash
# Node.js is installed via nvm - ALWAYS source this before npm commands
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

### Prisma Setup
- **Config:** `prisma/schema.prisma` with `prisma.config.ts` for datasource
- **Client location:** `src/generated/prisma/client`
- **Generate client:** `npx prisma generate` (MUST run after cloning or schema changes)
- **Run migrations:** `npx prisma migrate dev`
- **SQLite adapter:** Prisma 7.x requires `@prisma/adapter-better-sqlite3`

```typescript
// Correct import for server-side code
import { PrismaClient } from "@/generated/prisma/client"
import { CategoryType } from "@/generated/prisma/client"
```

### Type Checking
```bash
# No npm script - run directly
npx tsc --noEmit
```

---

## Critical Gotchas

### 1. Client Components Cannot Import Prisma Types
**Problem:** Importing from `@/generated/prisma/client` in client components pulls Node.js-only code into browser bundle.

**Solution:** Use the shared types file for client components:
```typescript
// ❌ WRONG - in client component
import { CategoryType } from "@/generated/prisma/client"

// ✅ CORRECT - in client component
import { CategoryType } from "@/lib/types"
```

### 2. Turbopack Cache Corruption
**Symptom:** `TurbopackInternalError: Cell CellId ... no longer exists`

**Solution:** Delete `.next` directory and restart dev server:
```bash
rm -rf .next && npm run dev
```

### 3. Prisma Client Not Generated
**Symptom:** `Module not found: Can't resolve '@/generated/prisma/client'`

**Solution:** Generate the Prisma client:
```bash
npx prisma generate
```

### 4. Money Amounts
- **Storage:** Always store as integers (cents) to avoid floating point issues
- **Display:** Convert to dollars for UI: `(amount / 100).toFixed(2)`
- **Input:** Convert from dollars to cents: `Math.round(parseFloat(value) * 100)`

### 5. Date Range Filters
- End dates need end-of-day time for inclusive ranges: `23:59:59.999`
- Quick filter example: Last 30 days = `new Date(now - 30 days)` to `new Date(now, 23:59:59)`

### 6. useSearchParams Requires Suspense
```typescript
// Wrap components using useSearchParams in Suspense
<Suspense fallback={<Loading />}>
  <ComponentUsingSearchParams />
</Suspense>
```

---

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/          # Authenticated routes with shared layout
│   │   ├── page.tsx          # Dashboard (/)
│   │   ├── transactions/     # /transactions
│   │   ├── invoices/         # /invoices, /invoices/[id]
│   │   ├── categories/       # /categories
│   │   ├── reports/          # /reports
│   │   └── layout.tsx        # Dashboard layout with sidebar
│   ├── api/
│   │   ├── auth/[...nextauth]/ # NextAuth endpoints
│   │   ├── upload/           # File upload endpoint
│   │   └── uploads/[filename]/ # Serve uploaded files
│   ├── login/                # /login
│   ├── register/             # /register
│   └── layout.tsx            # Root layout
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── layout/               # Navigation, sidebar
│   ├── transactions/         # Transaction form, filters
│   ├── invoices/             # Invoice form
│   ├── receipts/             # Receipt upload component
│   └── providers/            # Session provider
├── lib/
│   ├── actions/              # Server actions (CRUD operations)
│   │   ├── auth.ts           # registerUser, login helpers
│   │   ├── transactions.ts   # transaction CRUD, export
│   │   ├── categories.ts     # category CRUD
│   │   ├── invoices.ts       # invoice CRUD, status updates
│   │   ├── receipts.ts       # receipt upload, delete
│   │   └── reports.ts        # report data aggregation
│   ├── auth.ts               # NextAuth configuration
│   ├── prisma.ts             # Prisma client singleton
│   ├── seed-categories.ts    # Default category seeding
│   ├── types.ts              # Shared types for client components
│   └── utils.ts              # Utility functions (cn, etc.)
├── generated/
│   └── prisma/               # Generated Prisma client (gitignored)
└── middleware.ts             # Auth middleware for protected routes
```

---

## Server Actions Pattern

All data mutations use Next.js Server Actions in `src/lib/actions/`:

```typescript
"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function createThing(data: ThingInput): Promise<ThingResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const thing = await prisma.thing.create({
      data: { ...data, userId: session.user.id }
    })
    return { success: true, data: thing }
  } catch (error) {
    return { success: false, error: "Failed to create" }
  }
}
```

**Result type pattern:**
```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }
```

---

## Database Schema Notes

### Enums
- `CategoryType`: `income` | `expense`
- `InvoiceStatus`: `draft` | `sent` | `paid` | `cancelled`

### Field Naming
- Use `@map("snake_case")` for field names in DB
- Use `@@map("table_name")` for table names
- Foreign keys: `userId` in code, `user_id` in DB

### Relations
- Always add inverse relations to both models
- Use `onDelete: Cascade` for child records (e.g., InvoiceItems)
- Nullable foreign keys: `String?` for field, `Model?` for relation

### Default Categories (seeded on user registration)
- **Income:** Salary, Freelance, Investments, Other Income
- **Expense:** Rent, Utilities, Food, Transportation, Entertainment, Healthcare, Other Expense

---

## UI Components

### shadcn/ui Components Available
Located in `src/components/ui/`:
- button, input, label, card
- dialog, alert-dialog
- dropdown-menu, select, popover
- table, badge, checkbox
- (add more as needed with `npx shadcn@latest add <component>`)

### Confirmation Dialogs
Use `AlertDialog` from shadcn/ui:
```typescript
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Row Click with Nested Buttons
Use `e.stopPropagation()` on nested interactive elements:
```typescript
<tr onClick={() => openEdit(item)}>
  <td>...</td>
  <td>
    <Button onClick={(e) => { e.stopPropagation(); handleDelete(item) }}>
      Delete
    </Button>
  </td>
</tr>
```

---

## Authentication

### NextAuth.js v5 Configuration
- Config in `src/lib/auth.ts`
- Credentials provider with bcrypt password verification
- Session includes `user.id` for data scoping

### Protected Routes
- Middleware in `src/middleware.ts` protects all routes except `/login`, `/register`
- Unauthenticated users redirected to `/login`

### Test Accounts
- Email format: `testuser[N]@example.com` (e.g., testuser1@example.com)
- Password: `admin123`

---

## File Uploads

### Upload Flow
1. Client sends file to `/api/upload` via FormData
2. Server validates type (jpg, png, pdf) and size (max 5MB)
3. File saved to `/uploads` with UUID filename
4. Receipt record created in database

### Serving Files
- Files served via `/api/uploads/[filename]`
- Appropriate Content-Type headers set

---

## Reports

### Income vs Expense Report
- Aggregates transactions by month
- Uses Recharts BarChart for visualization
- Quick filters: This Month, Last Month, Last 30 Days, YTD, Full Year

### Category Breakdown
- Groups transactions by category
- Recharts PieChart with percentages
- Toggle between income/expense view

---

## Common Tasks

### Adding a New shadcn/ui Component
```bash
npx shadcn@latest add <component-name>
```

### Creating a New Server Action
1. Create/edit file in `src/lib/actions/`
2. Add `"use server"` directive at top
3. Get session with `await auth()`
4. Return typed result with success/error pattern

### Adding a New Database Model
1. Update `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name <migration_name>`
3. Run `npx prisma generate`
4. Create server actions in `src/lib/actions/`
5. If types needed in client components, add to `src/lib/types.ts`

### Debugging Dev Server Issues
```bash
# Clear cache and restart
rm -rf .next && npm run dev

# Regenerate Prisma client
npx prisma generate

# Check for type errors
npx tsc --noEmit
```

---

## Ralph Agent Integration

This project uses Ralph for autonomous development. See `scripts/ralph/` for:
- `prd.json` - Current PRD in Ralph format
- `progress.txt` - Progress log with learnings
- `CLAUDE.md` - Ralph-specific instructions
- `ralph.sh` - Script to run Ralph iterations

When running Ralph, ensure the dev server is running for browser verification steps.
