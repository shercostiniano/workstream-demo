# PRD: QA Testing and Dummy Data Population

## Introduction

This PRD covers comprehensive QA testing of the bookkeeping application and population of realistic dummy data. The goal is to create 3-5 test user accounts with realistic financial data (transactions and reports data), then perform thorough QA testing including smoke testing, functional testing, and end-to-end user journey testing across all application features.

## Goals

- Create 3-5 test user accounts with password `admin123` for QA purposes
- Populate realistic dummy data including transactions with varied dates, amounts, and categories
- Ensure reports have meaningful data to display (income vs expense trends, category breakdowns)
- Verify all application features work correctly through comprehensive testing
- Document any bugs or issues discovered during testing

## User Stories

### US-001: Create test user accounts
**Description:** As a QA tester, I need multiple test accounts so that I can test the application from different user perspectives.

**Acceptance Criteria:**
- [ ] Create 3-5 user accounts with realistic names and emails
- [ ] All accounts use password `admin123`
- [ ] Each account is created via the registration flow
- [ ] Verify each account can log in successfully
- [ ] Each account receives default categories on creation
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-002: Populate transactions for test accounts
**Description:** As a QA tester, I need realistic transaction data so that I can test transaction features and reports.

**Acceptance Criteria:**
- [ ] Each account has 20-50 transactions spanning the last 6 months
- [ ] Mix of income and expense transactions
- [ ] Transactions use various categories (Salary, Freelance, Rent, Food, etc.)
- [ ] Realistic amounts (e.g., Salary: $3000-5000, Rent: $1200-2000, Food: $50-200)
- [ ] Realistic descriptions (e.g., "Monthly salary - January", "Grocery shopping at Whole Foods")
- [ ] Dates distributed across multiple months for report testing
- [ ] Typecheck passes

### US-003: Smoke test authentication
**Description:** As a QA tester, I need to verify basic auth flows work so that users can access the application.

**Acceptance Criteria:**
- [ ] Registration page loads correctly
- [ ] Can register a new user with valid credentials
- [ ] Registration fails with invalid email format
- [ ] Registration fails with password less than 8 characters
- [ ] Registration fails when passwords don't match
- [ ] Login page loads correctly
- [ ] Can log in with valid credentials
- [ ] Login fails with incorrect password
- [ ] Login fails with non-existent email
- [ ] Logout redirects to login page
- [ ] Protected routes redirect unauthenticated users to login
- [ ] Verify in browser using dev-browser skill

### US-004: Functional test dashboard
**Description:** As a QA tester, I need to verify the dashboard displays correct data and actions work.

**Acceptance Criteria:**
- [ ] Dashboard loads and displays summary cards
- [ ] Total Income shows correct sum for current month
- [ ] Total Expenses shows correct sum for current month
- [ ] Net Balance calculation is correct (Income - Expenses)
- [ ] Recent transactions shows last 5 transactions
- [ ] "Add Income" button opens modal with correct form
- [ ] "Add Expense" button opens modal with correct form
- [ ] Adding transaction from dashboard updates summary
- [ ] Verify in browser using dev-browser skill

### US-005: Functional test transactions page
**Description:** As a QA tester, I need to verify all transaction CRUD operations work correctly.

**Acceptance Criteria:**
- [ ] Transactions page loads with paginated list (20 per page)
- [ ] Can create new income transaction
- [ ] Can create new expense transaction
- [ ] Can edit existing transaction (description, amount, category, date)
- [ ] Can delete transaction with confirmation dialog
- [ ] Date range filter works correctly (start date, end date)
- [ ] Category filter works (single and multiple selection)
- [ ] Transaction totals update based on filters
- [ ] Pagination works (next/previous buttons)
- [ ] CSV export downloads file with correct data
- [ ] Verify in browser using dev-browser skill

### US-006: Functional test categories page
**Description:** As a QA tester, I need to verify category management works correctly.

**Acceptance Criteria:**
- [ ] Categories page loads with income and expense sections
- [ ] Default categories are displayed and marked as non-editable
- [ ] Can create new custom income category
- [ ] Can create new custom expense category
- [ ] Can edit custom category name
- [ ] Cannot edit default category (edit button disabled)
- [ ] Can delete custom category with no transactions
- [ ] Cannot delete category that has transactions (error message shown)
- [ ] Cannot delete default category (delete button disabled)
- [ ] Verify in browser using dev-browser skill

### US-007: Functional test reports page
**Description:** As a QA tester, I need to verify reports display accurate data with correct visualizations.

**Acceptance Criteria:**
- [ ] Reports page loads with income vs expense report
- [ ] Quick filters work (This Month, Last Month, Last 30 Days, YTD, Full Year)
- [ ] Custom date range picker works
- [ ] Summary cards show correct totals for selected range
- [ ] Bar chart displays monthly breakdown correctly
- [ ] Monthly table shows correct values
- [ ] Category breakdown toggle switches between expense/income
- [ ] Pie chart displays correct percentages
- [ ] Category table shows amounts and percentages
- [ ] Empty date ranges show appropriate empty state
- [ ] Verify in browser using dev-browser skill

### US-008: Functional test invoices page
**Description:** As a QA tester, I need to verify invoice management works correctly.

**Acceptance Criteria:**
- [ ] Invoices list page loads correctly
- [ ] Can create new invoice with client info and line items
- [ ] Invoice number auto-generates (INV-001, INV-002, etc.)
- [ ] Line item totals calculate correctly (quantity × unit price)
- [ ] Invoice total sums all line items
- [ ] Can view invoice details page
- [ ] Can edit draft invoice
- [ ] Cannot edit sent/paid invoice
- [ ] Status transitions work (draft → sent → paid)
- [ ] Can cancel invoice
- [ ] Can delete draft invoice only
- [ ] Verify in browser using dev-browser skill

### US-009: Functional test receipts
**Description:** As a QA tester, I need to verify receipt upload and management works correctly.

**Acceptance Criteria:**
- [ ] Can upload JPG receipt to transaction
- [ ] Can upload PNG receipt to transaction
- [ ] Can upload PDF receipt to transaction
- [ ] Upload rejects files over 5MB
- [ ] Upload rejects invalid file types
- [ ] Receipt thumbnail displays on transaction
- [ ] Can view receipt in modal
- [ ] Can delete receipt
- [ ] Verify in browser using dev-browser skill

### US-010: End-to-end user journey - New user onboarding
**Description:** As a QA tester, I need to verify a complete new user journey from registration to first transaction.

**Acceptance Criteria:**
- [ ] Register new account
- [ ] Redirect to dashboard after registration
- [ ] Dashboard shows $0 for all summary cards (no data yet)
- [ ] Add first income transaction via dashboard
- [ ] Dashboard updates to show income
- [ ] Add first expense transaction via dashboard
- [ ] Dashboard shows correct net balance
- [ ] Navigate to transactions page and verify both transactions visible
- [ ] Navigate to reports and verify data displays
- [ ] Verify in browser using dev-browser skill

### US-011: End-to-end user journey - Monthly bookkeeping workflow
**Description:** As a QA tester, I need to verify a typical monthly bookkeeping workflow.

**Acceptance Criteria:**
- [ ] Log in to existing account with transactions
- [ ] Review dashboard summary for current month
- [ ] Add this month's salary income
- [ ] Add several expense transactions (rent, utilities, groceries)
- [ ] Attach receipt to grocery transaction
- [ ] Navigate to transactions and filter by current month
- [ ] Export current month transactions to CSV
- [ ] Navigate to reports and check income vs expense for this month
- [ ] Check category breakdown to see spending distribution
- [ ] Verify in browser using dev-browser skill

### US-012: End-to-end user journey - Invoice workflow
**Description:** As a QA tester, I need to verify a complete invoice lifecycle.

**Acceptance Criteria:**
- [ ] Create new invoice with client details
- [ ] Add 3 line items with different quantities and prices
- [ ] Verify total calculation
- [ ] Save as draft
- [ ] Edit draft to add notes
- [ ] Mark invoice as sent
- [ ] Verify cannot edit sent invoice
- [ ] Mark invoice as paid
- [ ] Verify final status is paid
- [ ] Verify in browser using dev-browser skill

### US-013: Create test invoices for accounts
**Description:** As a QA tester, I need invoice data to test invoice features.

**Acceptance Criteria:**
- [ ] Create 3-5 invoices per test account
- [ ] Mix of statuses (draft, sent, paid, cancelled)
- [ ] Realistic client names and emails
- [ ] Multiple line items per invoice
- [ ] Varied amounts and due dates
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-014: Cross-browser and responsive testing
**Description:** As a QA tester, I need to verify the application works across different viewport sizes.

**Acceptance Criteria:**
- [ ] Test at mobile viewport (375px width)
- [ ] Test at tablet viewport (768px width)
- [ ] Test at desktop viewport (1280px width)
- [ ] All pages render correctly at each size
- [ ] Navigation is usable at all sizes
- [ ] Forms are usable at all sizes
- [ ] Charts and tables adapt to viewport
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: Test accounts must use email format `testuser[N]@example.com` where N is 1-5
- FR-2: All test accounts must have password `admin123`
- FR-3: Transaction data must span at least 6 months for meaningful report testing
- FR-4: Each test account should have a realistic income/expense ratio (income > expenses for some, expenses > income for others)
- FR-5: Transaction descriptions must be realistic and descriptive
- FR-6: Invoice data should include realistic business scenarios (consulting, services, products)
- FR-7: All QA tests must be performed using the dev-browser skill for visual verification
- FR-8: Any bugs found must be documented with steps to reproduce

## Non-Goals

- Performance/load testing (not testing with hundreds of users)
- Security penetration testing
- Automated test script creation
- Cross-browser testing beyond the dev-browser (Chrome/Chromium only)
- Mobile app testing (web only)
- API testing independent of UI

## Design Considerations

- Use the dev-browser skill for all visual verification
- Take screenshots of any bugs discovered
- Test both happy path and error scenarios
- Test with realistic data volumes (not just 1-2 records)

## Technical Considerations

- Application runs on Next.js with SQLite database
- Database file is `dev.db` in project root
- Uploaded receipts stored in `/uploads` directory
- Password must be at least 8 characters (use `admin123`)
- Amounts stored in cents internally, displayed as dollars

## Test Account Specifications

| Account | Email | Name | Password | Profile |
|---------|-------|------|----------|---------|
| 1 | testuser1@example.com | Sarah Johnson | admin123 | Freelance designer, variable income |
| 2 | testuser2@example.com | Michael Chen | admin123 | Salaried employee, stable income |
| 3 | testuser3@example.com | Emily Rodriguez | admin123 | Small business owner with invoices |
| 4 | testuser4@example.com | James Wilson | admin123 | Part-time worker, lower income |
| 5 | testuser5@example.com | Amanda Foster | admin123 | New user, minimal data for onboarding test |

## Success Metrics

- All 5 test accounts created and accessible
- Each account has appropriate dummy data populated
- All smoke tests pass (basic functionality works)
- All functional tests pass (features work as expected)
- All end-to-end journeys complete successfully
- Any bugs found are documented with reproduction steps
- Reports display meaningful visualizations with test data

## Open Questions

- Should we upload sample receipt files (JPG/PNG/PDF) for receipt testing?
- Should we test with the application in production mode or development mode?
- Should we document bugs in a separate file or inline with test results?
