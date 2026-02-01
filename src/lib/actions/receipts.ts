"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { unlink } from "fs/promises"
import path from "path"

export type ReceiptResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

export interface ReceiptInfo {
  id: string
  fileName: string
  filePath: string
  uploadedAt: Date
  transactionId: string | null
}

async function getCurrentUserId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id ?? null
}

export async function getReceiptsForTransaction(
  transactionId: string
): Promise<ReceiptResult<ReceiptInfo[]>> {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { success: false, error: "Not authenticated" }
  }

  // Verify transaction belongs to user
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      userId,
    },
  })

  if (!transaction) {
    return { success: false, error: "Transaction not found" }
  }

  const receipts = await prisma.receipt.findMany({
    where: {
      transactionId,
      userId,
    },
    select: {
      id: true,
      fileName: true,
      filePath: true,
      uploadedAt: true,
      transactionId: true,
    },
    orderBy: {
      uploadedAt: "desc",
    },
  })

  return { success: true, data: receipts }
}

export async function linkReceiptToTransaction(
  receiptId: string,
  transactionId: string
): Promise<ReceiptResult<void>> {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { success: false, error: "Not authenticated" }
  }

  // Verify receipt belongs to user
  const receipt = await prisma.receipt.findFirst({
    where: {
      id: receiptId,
      userId,
    },
  })

  if (!receipt) {
    return { success: false, error: "Receipt not found" }
  }

  // Verify transaction belongs to user
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      userId,
    },
  })

  if (!transaction) {
    return { success: false, error: "Transaction not found" }
  }

  await prisma.receipt.update({
    where: { id: receiptId },
    data: { transactionId },
  })

  return { success: true, data: undefined }
}

export async function deleteReceipt(
  receiptId: string
): Promise<ReceiptResult<void>> {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { success: false, error: "Not authenticated" }
  }

  // Verify receipt belongs to user
  const receipt = await prisma.receipt.findFirst({
    where: {
      id: receiptId,
      userId,
    },
  })

  if (!receipt) {
    return { success: false, error: "Receipt not found" }
  }

  // Delete file from storage
  try {
    const filePath = path.join(process.cwd(), receipt.filePath)
    await unlink(filePath)
  } catch {
    // File may already be deleted or not exist, continue with database cleanup
  }

  // Delete record from database
  await prisma.receipt.delete({
    where: { id: receiptId },
  })

  return { success: true, data: undefined }
}
