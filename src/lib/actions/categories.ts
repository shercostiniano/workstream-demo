"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { CategoryType } from "@/generated/prisma/client"

// Types for category operations
export type CategoryResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

export interface CategoryWithDetails {
  id: string
  name: string
  type: CategoryType
  isDefault: boolean
}

export interface CreateCategoryInput {
  name: string
  type: CategoryType
}

export interface UpdateCategoryInput {
  id: string
  name: string
}

async function getCurrentUserId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id ?? null
}

/**
 * Get all categories for the current user (default + custom)
 */
export async function getCategories(): Promise<CategoryResult<CategoryWithDetails[]>> {
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
      isDefault: true,
    },
    orderBy: [
      { type: "asc" },
      { name: "asc" },
    ],
  })

  return { success: true, data: categories }
}

/**
 * Create a custom category for the current user
 */
export async function createCategory(
  input: CreateCategoryInput
): Promise<CategoryResult<{ id: string }>> {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { success: false, error: "Not authenticated" }
  }

  // Validate input
  if (!input.name || input.name.trim() === "") {
    return { success: false, error: "Category name is required" }
  }

  if (!input.type || (input.type !== "income" && input.type !== "expense")) {
    return { success: false, error: "Category type must be 'income' or 'expense'" }
  }

  const trimmedName = input.name.trim()

  // Check if a category with the same name and type already exists for this user
  const existingCategory = await prisma.category.findFirst({
    where: {
      userId,
      name: trimmedName,
      type: input.type,
    },
  })

  if (existingCategory) {
    return { success: false, error: "A category with this name already exists" }
  }

  // Create the category
  const category = await prisma.category.create({
    data: {
      userId,
      name: trimmedName,
      type: input.type,
      isDefault: false,
    },
  })

  return { success: true, data: { id: category.id } }
}

/**
 * Update a category name if owned by user and not a default category
 */
export async function updateCategory(
  input: UpdateCategoryInput
): Promise<CategoryResult<void>> {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { success: false, error: "Not authenticated" }
  }

  if (!input.id) {
    return { success: false, error: "Category ID is required" }
  }

  if (!input.name || input.name.trim() === "") {
    return { success: false, error: "Category name is required" }
  }

  // Verify the category belongs to the user
  const category = await prisma.category.findFirst({
    where: {
      id: input.id,
      userId,
    },
  })

  if (!category) {
    return { success: false, error: "Category not found" }
  }

  // Check if it's a default category
  if (category.isDefault) {
    return { success: false, error: "Cannot edit default categories" }
  }

  const trimmedName = input.name.trim()

  // Check if a category with the new name already exists (excluding current category)
  const existingCategory = await prisma.category.findFirst({
    where: {
      userId,
      name: trimmedName,
      type: category.type,
      id: { not: input.id },
    },
  })

  if (existingCategory) {
    return { success: false, error: "A category with this name already exists" }
  }

  // Update the category
  await prisma.category.update({
    where: { id: input.id },
    data: { name: trimmedName },
  })

  return { success: true, data: undefined }
}

/**
 * Delete a category if owned by user, not default, and no transactions use it
 */
export async function deleteCategory(
  id: string
): Promise<CategoryResult<void>> {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { success: false, error: "Not authenticated" }
  }

  if (!id) {
    return { success: false, error: "Category ID is required" }
  }

  // Verify the category belongs to the user
  const category = await prisma.category.findFirst({
    where: {
      id,
      userId,
    },
  })

  if (!category) {
    return { success: false, error: "Category not found" }
  }

  // Check if it's a default category
  if (category.isDefault) {
    return { success: false, error: "Cannot delete default categories" }
  }

  // Check if any transactions use this category
  const transactionCount = await prisma.transaction.count({
    where: {
      categoryId: id,
    },
  })

  if (transactionCount > 0) {
    return {
      success: false,
      error: `Cannot delete category: ${transactionCount} transaction${transactionCount === 1 ? "" : "s"} use this category`,
    }
  }

  // Delete the category
  await prisma.category.delete({
    where: { id },
  })

  return { success: true, data: undefined }
}
