# PRD: Basic Bookkeeping with AI

## Introduction

A web-based bookkeeping application for freelancers, small business owners, and individuals to track income and expenses, manage invoices, and generate financial reports. The MVP focuses on core bookkeeping functionality with a foundation for future AI enhancements like auto-categorization, receipt OCR, and natural language queries.

## Goals

- Enable users to manually record income and expense transactions with categories
- Provide basic invoice creation and tracking
- Allow receipt uploads attached to transactions
- Generate simple financial reports (income vs expense, category breakdown)
- Establish user authentication for secure, personal data access
- Build a foundation that can later support AI features (OCR, auto-categorization, insights)

## User Stories

### US-001: User Registration and Authentication
**Description:** As a new user, I want to create an account and log in so that my financial data is secure and private.

**Acceptance Criteria:**
- [ ] User can register with email and password
- [ ] User can log in with email and password
- [ ] User can log out
- [ ] Password is securely hashed (bcrypt or similar)
- [ ] Session persists across browser refreshes
- [ ] Unauthenticated users are redirected to login page
- [ ] Typecheck passes

---

### US-002: Create Database Schema for Transactions
**Description:** As a developer, I need to set up the database schema for transactions so that financial data can be stored persistently.

**Acceptance Criteria:**
- [ ] Transactions table with: id, user_id, type (income/expense), amount, description, category_id, date, created_at, updated_at
- [ ] Categories table with: id, user_id, name, type (income/expense), is_default
- [ ] Seed default categories (e.g., Salary, Freelance, Rent, Utilities, Food, Transportation)
- [ ] Foreign key relationships properly defined
- [ ] Migration runs successfully
- [ ] Typecheck passes

---

### US-003: Add New Transaction
**Description:** As a user, I want to add income or expense transactions so that I can track my money flow.

**Acceptance Criteria:**
- [ ] Form with fields: type (income/expense toggle), amount, description, category dropdown, date
- [ ] Amount accepts decimal values (e.g., 123.45)
- [ ] Date defaults to today but can be changed
- [ ] Category dropdown shows only categories matching the selected type
- [ ] Transaction saves to database on submit
- [ ] Form clears after successful submission
- [ ] Validation prevents empty amount or future dates more than 1 year ahead
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-004: View Transaction List
**Description:** As a user, I want to see a list of my transactions so that I can review my financial activity.

**Acceptance Criteria:**
- [ ] Transactions displayed in a table/list format
- [ ] Shows: date, description, category, amount (color-coded: green for income, red for expense)
- [ ] Sorted by date descending (newest first)
- [ ] Pagination or infinite scroll for large lists (20 items per page)
- [ ] Empty state message when no transactions exist
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-005: Edit Transaction
**Description:** As a user, I want to edit an existing transaction so that I can fix mistakes.

**Acceptance Criteria:**
- [ ] Click on a transaction opens edit modal/form
- [ ] Pre-fills all current values
- [ ] Can modify any field (type, amount, description, category, date)
- [ ] Save button updates the database
- [ ] Cancel button closes without saving
- [ ] List updates immediately after save
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-006: Delete Transaction
**Description:** As a user, I want to delete a transaction so that I can remove erroneous entries.

**Acceptance Criteria:**
- [ ] Delete button/icon on each transaction row
- [ ] Confirmation dialog before deletion ("Are you sure you want to delete this transaction?")
- [ ] Transaction removed from database on confirm
- [ ] List updates immediately after deletion
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-007: Manage Custom Categories
**Description:** As a user, I want to create and manage my own categories so that I can organize transactions my way.

**Acceptance Criteria:**
- [ ] Categories page accessible from navigation
- [ ] List of all categories (default + custom)
- [ ] Can add new category with name and type (income/expense)
- [ ] Can edit custom category name
- [ ] Can delete custom categories (with confirmation)
- [ ] Cannot delete default categories (delete button disabled/hidden)
- [ ] Cannot delete category if transactions are using it (show error message)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-008: Filter Transactions by Date Range
**Description:** As a user, I want to filter transactions by date range so that I can focus on specific time periods.

**Acceptance Criteria:**
- [ ] Date range picker with start and end date
- [ ] Quick filters: This Month, Last Month, This Year, Last 30 Days, All Time
- [ ] Transaction list updates to show only matching transactions
- [ ] Filter state persists in URL params
- [ ] Running total updates based on filtered transactions
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-009: Filter Transactions by Category
**Description:** As a user, I want to filter transactions by category so that I can see spending in specific areas.

**Acceptance Criteria:**
- [ ] Category filter dropdown (multi-select)
- [ ] Can combine with date range filter
- [ ] "All Categories" option to clear filter
- [ ] Filter state persists in URL params
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-010: Dashboard with Summary
**Description:** As a user, I want to see a dashboard with financial summary so that I get an overview at a glance.

**Acceptance Criteria:**
- [ ] Dashboard is the landing page after login
- [ ] Shows total income for current month
- [ ] Shows total expenses for current month
- [ ] Shows net balance (income - expenses) for current month
- [ ] Shows 5 most recent transactions
- [ ] Quick action buttons: Add Income, Add Expense
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-011: Create Database Schema for Invoices
**Description:** As a developer, I need to set up the database schema for invoices to support basic invoicing.

**Acceptance Criteria:**
- [ ] Invoices table: id, user_id, invoice_number, client_name, client_email, status (draft/sent/paid), issue_date, due_date, notes, created_at, updated_at
- [ ] Invoice_items table: id, invoice_id, description, quantity, unit_price
- [ ] Invoice number auto-generates (e.g., INV-001, INV-002)
- [ ] Migration runs successfully
- [ ] Typecheck passes

---

### US-012: Create New Invoice
**Description:** As a user, I want to create an invoice so that I can bill my clients.

**Acceptance Criteria:**
- [ ] Invoice form with: client name, client email, issue date, due date, notes
- [ ] Can add multiple line items (description, quantity, unit price)
- [ ] Line item total calculated automatically (quantity × unit price)
- [ ] Invoice total calculated as sum of line items
- [ ] Can save as draft or mark as sent
- [ ] Invoice number auto-assigned on creation
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-013: View Invoice List
**Description:** As a user, I want to see all my invoices so that I can track what I've billed.

**Acceptance Criteria:**
- [ ] Invoice list page accessible from navigation
- [ ] Shows: invoice number, client name, total amount, status, due date
- [ ] Status shown with color indicator (gray=draft, blue=sent, green=paid)
- [ ] Sorted by issue date descending
- [ ] Can click to view invoice details
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-014: View and Edit Invoice
**Description:** As a user, I want to view and edit an invoice so that I can make corrections before sending.

**Acceptance Criteria:**
- [ ] Invoice detail page shows all information
- [ ] Edit button opens editable form
- [ ] Can modify all fields including line items
- [ ] Can change status (draft → sent → paid)
- [ ] Cannot edit sent/paid invoices (only status change allowed)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-015: Delete Invoice
**Description:** As a user, I want to delete an invoice so that I can remove cancelled or erroneous invoices.

**Acceptance Criteria:**
- [ ] Delete button on invoice detail page
- [ ] Confirmation dialog before deletion
- [ ] Only draft invoices can be deleted
- [ ] Sent/paid invoices show "void" option instead (marks as cancelled but keeps record)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-016: Create Database Schema for Receipts
**Description:** As a developer, I need to set up the database schema for receipt uploads.

**Acceptance Criteria:**
- [ ] Receipts table: id, user_id, transaction_id (nullable), file_path, file_name, uploaded_at
- [ ] transaction_id is nullable to allow orphan receipts
- [ ] Migration runs successfully
- [ ] Typecheck passes

---

### US-017: Upload Receipt
**Description:** As a user, I want to upload a receipt image so that I have proof of my expenses.

**Acceptance Criteria:**
- [ ] Upload button on transaction form and transaction detail
- [ ] Accepts image files (jpg, png) and PDF
- [ ] File size limit of 5MB
- [ ] Shows upload progress indicator
- [ ] Preview of uploaded image
- [ ] File stored securely (local filesystem or cloud storage)
- [ ] Receipt record linked to transaction
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-018: View Receipt
**Description:** As a user, I want to view an uploaded receipt so that I can reference it later.

**Acceptance Criteria:**
- [ ] Receipt thumbnail visible on transaction row (if attached)
- [ ] Click thumbnail opens full-size view in modal
- [ ] Download button to save receipt locally
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-019: Delete Receipt
**Description:** As a user, I want to delete a receipt so that I can remove incorrect uploads.

**Acceptance Criteria:**
- [ ] Delete button on receipt view modal
- [ ] Confirmation dialog before deletion
- [ ] Removes file from storage
- [ ] Removes receipt record from database
- [ ] Transaction remains intact (only receipt attachment removed)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-020: Income vs Expense Report
**Description:** As a user, I want to see a report comparing my income and expenses so that I understand my financial position.

**Acceptance Criteria:**
- [ ] Reports page accessible from navigation
- [ ] Income vs Expense report option
- [ ] Date range selector for report period
- [ ] Shows total income, total expenses, net profit/loss
- [ ] Bar chart visualization (income bar, expense bar)
- [ ] Monthly breakdown table if date range spans multiple months
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-021: Category Breakdown Report
**Description:** As a user, I want to see spending broken down by category so that I know where my money goes.

**Acceptance Criteria:**
- [ ] Category breakdown report option
- [ ] Toggle between income categories and expense categories
- [ ] Date range selector for report period
- [ ] Pie chart showing percentage per category
- [ ] Table showing category name, total amount, percentage of total
- [ ] Sorted by amount descending
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-022: Export Transactions to CSV
**Description:** As a user, I want to export my transactions to CSV so that I can use the data in spreadsheets or other tools.

**Acceptance Criteria:**
- [ ] Export button on transactions page
- [ ] Exports currently filtered transactions (respects date/category filters)
- [ ] CSV includes: date, type, description, category, amount
- [ ] File downloads with name format: transactions_YYYY-MM-DD.csv
- [ ] Typecheck passes

---

### US-023: Basic Navigation and Layout
**Description:** As a user, I want a clean navigation layout so that I can easily access all features.

**Acceptance Criteria:**
- [ ] Sidebar or top navigation with links: Dashboard, Transactions, Invoices, Categories, Reports
- [ ] Current page highlighted in navigation
- [ ] User menu with logout option
- [ ] Responsive design works on tablet and mobile
- [ ] Consistent header/footer across pages
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

## Functional Requirements

- FR-1: Users must authenticate to access the application
- FR-2: All data is scoped to the authenticated user (users cannot see others' data)
- FR-3: Transactions must have a type (income or expense), amount, and date
- FR-4: Categories are typed (income or expense) and filter accordingly in dropdowns
- FR-5: Default categories are seeded on account creation
- FR-6: Invoice numbers are auto-generated and unique per user
- FR-7: Invoice totals are calculated from line items, not manually entered
- FR-8: Receipts are stored securely and accessible only to the owning user
- FR-9: Reports calculate aggregations based on the selected date range
- FR-10: All monetary values stored as integers (cents) to avoid floating point issues

## Non-Goals (Out of Scope for MVP)

- Bank account syncing/import (Plaid integration)
- AI auto-categorization of transactions
- Receipt OCR (automatic data extraction from images)
- Natural language queries ("How much did I spend on coffee?")
- Financial insights or recommendations
- Double-entry accounting (debits/credits, balance sheets)
- Multi-currency support
- Recurring transactions
- Invoice emailing directly from the app
- PDF invoice generation
- Tax calculations or tax reports
- Multi-user/team access
- Mobile native apps (web-only for MVP)
- Payroll features
- Bank reconciliation
- Budgeting/budget alerts

## Technical Considerations

- **Stack:** Next.js with React, TypeScript
- **Database:** PostgreSQL (or SQLite for simpler deployment)
- **ORM:** Prisma or Drizzle
- **Auth:** NextAuth.js with email/password credentials
- **File Storage:** Local filesystem for MVP, designed for easy migration to S3/cloud
- **Styling:** Tailwind CSS with shadcn/ui components
- **Charts:** Recharts or Chart.js for report visualizations
- **State:** React Query for server state, React Context for auth state

## Design Considerations

- Clean, minimal interface similar to workstream.us aesthetic
- Color coding: green for income/positive, red for expenses/negative
- Forms should be fast to complete (keyboard navigation, smart defaults)
- Mobile-responsive but optimized for desktop use
- Dark mode support (can be added post-MVP)

## Success Metrics

- User can add a transaction in under 30 seconds
- User can create an invoice in under 2 minutes
- All core pages load in under 2 seconds
- Zero data leakage between user accounts
- All CRUD operations complete without errors

## Open Questions

1. Should the app support multiple "books" or accounts per user (e.g., personal + business)?
2. What invoice payment terms should be supported (Net 15, Net 30, custom)?
3. Should we include a simple search across transactions?
4. Is there a specific color scheme or branding to follow?
5. Should deleted transactions be soft-deleted (recoverable) or hard-deleted?

---

## Future AI Enhancements (Post-MVP Roadmap)

These features are documented for future reference but are explicitly out of scope for the MVP:

1. **Auto-Categorization:** ML model suggests category based on transaction description
2. **Receipt OCR:** Extract vendor, amount, date from uploaded receipt images
3. **Natural Language Queries:** Ask questions about finances in plain English
4. **Financial Insights:** AI-generated summaries and spending trend alerts
5. **Smart Invoice Reminders:** AI suggests when to follow up on unpaid invoices
