"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { CategoryType } from "@/generated/prisma/client"

// Types for transaction operations
export type TransactionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

export interface CreateTransactionInput {
  type: CategoryType
  amount: number // cents
  description?: string
  categoryId: string
  date: Date
}

export interface UpdateTransactionInput {
  id: string
  type?: CategoryType
  amount?: number // cents
  description?: string
  categoryId?: string
  date?: Date
}

export interface TransactionFilters {
  startDate?: Date
  endDate?: Date
  categoryIds?: string[]
  page?: number
  limit?: number
}

export interface PaginatedTransactions {
  transactions: TransactionWithCategory[]
  total: number
  page: number
  totalPages: number
}

export interface TransactionWithCategory {
  id: string
  type: CategoryType
  amount: number
  description: string | null
  categoryId: string
  date: Date
  createdAt: Date
  updatedAt: Date
  category: {
    id: string
    name: string
    type: CategoryType
  }
}

async function getCurrentUserId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id ?? null
}

export async function createTransaction(
  input: CreateTransactionInput
): Promise<TransactionResult<{ id: string }>> {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { success: false, error: "Not authenticated" }
  }

  // Validate input
  if (!input.amount || input.amount <= 0) {
    return { success: false, error: "Amount must be a positive number" }
  }

  if (!input.categoryId) {
    return { success: false, error: "Category is required" }
  }

  if (!input.date) {
    return { success: false, error: "Date is required" }
  }

  // Verify the category belongs to the user
  const category = await prisma.category.findFirst({
    where: {
      id: input.categoryId,
      userId,
    },
  })

  if (!category) {
    return { success: false, error: "Invalid category" }
  }

  // Create the transaction
  const transaction = await prisma.transaction.create({
    data: {
      userId,
      type: input.type,
      amount: Math.round(input.amount), // Ensure it's an integer (cents)
      description: input.description ?? null,
      categoryId: input.categoryId,
      date: input.date,
    },
  })

  return { success: true, data: { id: transaction.id } }
}

export async function getTransactions(
  filters?: TransactionFilters
): Promise<TransactionResult<PaginatedTransactions>> {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { success: false, error: "Not authenticated" }
  }

  const page = filters?.page ?? 1
  const limit = filters?.limit ?? 20

  // Build where clause with filters
  const where: {
    userId: string
    date?: { gte?: Date; lte?: Date }
    categoryId?: { in: string[] }
  } = { userId }

  if (filters?.startDate || filters?.endDate) {
    where.date = {}
    if (filters.startDate) {
      where.date.gte = filters.startDate
    }
    if (filters.endDate) {
      where.date.lte = filters.endDate
    }
  }

  if (filters?.categoryIds && filters.categoryIds.length > 0) {
    where.categoryId = { in: filters.categoryIds }
  }

  // Get total count for pagination
  const total = await prisma.transaction.count({ where })

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      category: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
    orderBy: {
      date: "desc",
    },
    skip: (page - 1) * limit,
    take: limit,
  })

  return {
    success: true,
    data: {
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function updateTransaction(
  input: UpdateTransactionInput
): Promise<TransactionResult<void>> {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { success: false, error: "Not authenticated" }
  }

  if (!input.id) {
    return { success: false, error: "Transaction ID is required" }
  }

  // Verify the transaction belongs to the user
  const existingTransaction = await prisma.transaction.findFirst({
    where: {
      id: input.id,
      userId,
    },
  })

  if (!existingTransaction) {
    return { success: false, error: "Transaction not found" }
  }

  // If updating category, verify it belongs to the user
  if (input.categoryId) {
    const category = await prisma.category.findFirst({
      where: {
        id: input.categoryId,
        userId,
      },
    })

    if (!category) {
      return { success: false, error: "Invalid category" }
    }
  }

  // Validate amount if provided
  if (input.amount !== undefined && input.amount <= 0) {
    return { success: false, error: "Amount must be a positive number" }
  }

  // Update the transaction
  await prisma.transaction.update({
    where: { id: input.id },
    data: {
      ...(input.type !== undefined && { type: input.type }),
      ...(input.amount !== undefined && { amount: Math.round(input.amount) }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
      ...(input.date !== undefined && { date: input.date }),
    },
  })

  return { success: true, data: undefined }
}

export async function deleteTransaction(
  id: string
): Promise<TransactionResult<void>> {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { success: false, error: "Not authenticated" }
  }

  if (!id) {
    return { success: false, error: "Transaction ID is required" }
  }

  // Verify the transaction belongs to the user
  const transaction = await prisma.transaction.findFirst({
    where: {
      id,
      userId,
    },
  })

  if (!transaction) {
    return { success: false, error: "Transaction not found" }
  }

  // Delete the transaction
  await prisma.transaction.delete({
    where: { id },
  })

  return { success: true, data: undefined }
}

// Category type for the form
export interface CategoryOption {
  id: string
  name: string
  type: CategoryType
}

export async function getCategories(): Promise<TransactionResult<CategoryOption[]>> {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { success: false, error: "Not authenticated" }
  }

  const categories = await prisma.category.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      type: true,
    },
    orderBy: { name: "asc" },
  })

  return { success: true, data: categories }
}

export interface TransactionTotals {
  income: number
  expense: number
  net: number
}

export interface DashboardSummary {
  currentMonthIncome: number
  currentMonthExpenses: number
  netBalance: number
  recentTransactions: TransactionWithCategory[]
}

export async function getDashboardSummary(): Promise<TransactionResult<DashboardSummary>> {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { success: false, error: "Not authenticated" }
  }

  // Get first and last day of current month
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

  // Get all transactions for current month
  const currentMonthTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: {
        gte: firstDayOfMonth,
        lte: lastDayOfMonth,
      },
    },
    select: {
      type: true,
      amount: true,
    },
  })

  // Calculate current month totals
  let currentMonthIncome = 0
  let currentMonthExpenses = 0

  for (const t of currentMonthTransactions) {
    if (t.type === "income") {
      currentMonthIncome += t.amount
    } else {
      currentMonthExpenses += t.amount
    }
  }

  // Get 5 most recent transactions with category info
  const recentTransactions = await prisma.transaction.findMany({
    where: { userId },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
    orderBy: { date: "desc" },
    take: 5,
  })

  return {
    success: true,
    data: {
      currentMonthIncome,
      currentMonthExpenses,
      netBalance: currentMonthIncome - currentMonthExpenses,
      recentTransactions,
    },
  }
}

export async function getTransactionTotals(
  filters?: Omit<TransactionFilters, "page" | "limit">
): Promise<TransactionResult<TransactionTotals>> {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { success: false, error: "Not authenticated" }
  }

  // Build where clause with filters (same as getTransactions)
  const where: {
    userId: string
    date?: { gte?: Date; lte?: Date }
    categoryId?: { in: string[] }
  } = { userId }

  if (filters?.startDate || filters?.endDate) {
    where.date = {}
    if (filters.startDate) {
      where.date.gte = filters.startDate
    }
    if (filters.endDate) {
      where.date.lte = filters.endDate
    }
  }

  if (filters?.categoryIds && filters.categoryIds.length > 0) {
    where.categoryId = { in: filters.categoryIds }
  }

  // Get all transactions matching filters
  const transactions = await prisma.transaction.findMany({
    where,
    select: {
      type: true,
      amount: true,
    },
  })

  // Calculate totals
  let income = 0
  let expense = 0

  for (const t of transactions) {
    if (t.type === "income") {
      income += t.amount
    } else {
      expense += t.amount
    }
  }

  return {
    success: true,
    data: {
      income,
      expense,
      net: income - expense,
    },
  }
}
