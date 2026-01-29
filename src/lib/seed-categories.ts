import { prisma } from "./prisma"
import { CategoryType } from "@/generated/prisma/client"

const DEFAULT_INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Investments",
  "Other Income",
]

const DEFAULT_EXPENSE_CATEGORIES = [
  "Rent",
  "Utilities",
  "Food",
  "Transportation",
  "Entertainment",
  "Healthcare",
  "Other Expense",
]

export async function seedDefaultCategories(userId: string): Promise<void> {
  const incomeCategories = DEFAULT_INCOME_CATEGORIES.map((name) => ({
    userId,
    name,
    type: CategoryType.income,
    isDefault: true,
  }))

  const expenseCategories = DEFAULT_EXPENSE_CATEGORIES.map((name) => ({
    userId,
    name,
    type: CategoryType.expense,
    isDefault: true,
  }))

  await prisma.category.createMany({
    data: [...incomeCategories, ...expenseCategories],
  })
}
