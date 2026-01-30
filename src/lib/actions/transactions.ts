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
): Promise<TransactionResult<TransactionWithCategory[]>> {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { success: false, error: "Not authenticated" }
  }

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
  })

  return { success: true, data: transactions }
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
