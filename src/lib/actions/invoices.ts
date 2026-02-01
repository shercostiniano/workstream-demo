"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { InvoiceStatus } from "@/generated/prisma/client"

// Types for invoice operations
export type InvoiceResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

export interface InvoiceItemInput {
  description: string
  quantity: number
  unitPrice: number // cents
}

export interface CreateInvoiceInput {
  clientName: string
  clientEmail?: string
  issueDate: Date
  dueDate: Date
  notes?: string
  items: InvoiceItemInput[]
}

export interface UpdateInvoiceInput {
  id: string
  clientName?: string
  clientEmail?: string
  issueDate?: Date
  dueDate?: Date
  notes?: string
  items?: InvoiceItemInput[]
}

export interface InvoiceWithItems {
  id: string
  invoiceNumber: string
  clientName: string
  clientEmail: string | null
  status: InvoiceStatus
  issueDate: Date
  dueDate: Date
  notes: string | null
  createdAt: Date
  updatedAt: Date
  items: {
    id: string
    description: string
    quantity: number
    unitPrice: number
  }[]
  total: number
}

export interface InvoiceListItem {
  id: string
  invoiceNumber: string
  clientName: string
  status: InvoiceStatus
  issueDate: Date
  dueDate: Date
  total: number
}

async function getCurrentUserId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id ?? null
}

/**
 * Generate the next invoice number in format INV-001, INV-002, etc.
 */
async function generateInvoiceNumber(userId: string): Promise<string> {
  // Get the count of existing invoices for this user
  const count = await prisma.invoice.count({
    where: { userId },
  })

  // Generate the next number, padded to 3 digits
  const nextNumber = count + 1
  return `INV-${nextNumber.toString().padStart(3, "0")}`
}

/**
 * Calculate total for an invoice from its items
 */
function calculateInvoiceTotal(items: { quantity: number; unitPrice: number }[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
}

export async function createInvoice(
  input: CreateInvoiceInput
): Promise<InvoiceResult<{ id: string; invoiceNumber: string }>> {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { success: false, error: "Not authenticated" }
  }

  // Validate input
  if (!input.clientName || input.clientName.trim() === "") {
    return { success: false, error: "Client name is required" }
  }

  if (!input.issueDate) {
    return { success: false, error: "Issue date is required" }
  }

  if (!input.dueDate) {
    return { success: false, error: "Due date is required" }
  }

  if (!input.items || input.items.length === 0) {
    return { success: false, error: "At least one line item is required" }
  }

  // Validate each line item
  for (const item of input.items) {
    if (!item.description || item.description.trim() === "") {
      return { success: false, error: "All line items must have a description" }
    }
    if (item.quantity <= 0) {
      return { success: false, error: "Quantity must be greater than 0" }
    }
    if (item.unitPrice < 0) {
      return { success: false, error: "Unit price cannot be negative" }
    }
  }

  // Generate invoice number
  const invoiceNumber = await generateInvoiceNumber(userId)

  // Create invoice with items in a transaction
  const invoice = await prisma.invoice.create({
    data: {
      userId,
      invoiceNumber,
      clientName: input.clientName.trim(),
      clientEmail: input.clientEmail?.trim() || null,
      status: "draft",
      issueDate: input.issueDate,
      dueDate: input.dueDate,
      notes: input.notes?.trim() || null,
      items: {
        create: input.items.map((item) => ({
          description: item.description.trim(),
          quantity: Math.round(item.quantity),
          unitPrice: Math.round(item.unitPrice),
        })),
      },
    },
  })

  return { success: true, data: { id: invoice.id, invoiceNumber: invoice.invoiceNumber } }
}

export async function getInvoices(): Promise<InvoiceResult<InvoiceListItem[]>> {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { success: false, error: "Not authenticated" }
  }

  const invoices = await prisma.invoice.findMany({
    where: { userId },
    include: {
      items: {
        select: {
          quantity: true,
          unitPrice: true,
        },
      },
    },
    orderBy: { issueDate: "desc" },
  })

  // Calculate totals for each invoice
  const invoicesWithTotals: InvoiceListItem[] = invoices.map((invoice) => ({
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    clientName: invoice.clientName,
    status: invoice.status,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    total: calculateInvoiceTotal(invoice.items),
  }))

  return { success: true, data: invoicesWithTotals }
}

export async function getInvoice(id: string): Promise<InvoiceResult<InvoiceWithItems>> {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { success: false, error: "Not authenticated" }
  }

  if (!id) {
    return { success: false, error: "Invoice ID is required" }
  }

  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      items: {
        select: {
          id: true,
          description: true,
          quantity: true,
          unitPrice: true,
        },
      },
    },
  })

  if (!invoice) {
    return { success: false, error: "Invoice not found" }
  }

  return {
    success: true,
    data: {
      ...invoice,
      total: calculateInvoiceTotal(invoice.items),
    },
  }
}

export async function updateInvoice(
  input: UpdateInvoiceInput
): Promise<InvoiceResult<void>> {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { success: false, error: "Not authenticated" }
  }

  if (!input.id) {
    return { success: false, error: "Invoice ID is required" }
  }

  // Verify the invoice belongs to the user and is a draft
  const existingInvoice = await prisma.invoice.findFirst({
    where: {
      id: input.id,
      userId,
    },
  })

  if (!existingInvoice) {
    return { success: false, error: "Invoice not found" }
  }

  if (existingInvoice.status !== "draft") {
    return { success: false, error: "Only draft invoices can be edited" }
  }

  // Validate client name if provided
  if (input.clientName !== undefined && input.clientName.trim() === "") {
    return { success: false, error: "Client name is required" }
  }

  // Validate items if provided
  if (input.items !== undefined) {
    if (input.items.length === 0) {
      return { success: false, error: "At least one line item is required" }
    }

    for (const item of input.items) {
      if (!item.description || item.description.trim() === "") {
        return { success: false, error: "All line items must have a description" }
      }
      if (item.quantity <= 0) {
        return { success: false, error: "Quantity must be greater than 0" }
      }
      if (item.unitPrice < 0) {
        return { success: false, error: "Unit price cannot be negative" }
      }
    }
  }

  // Update invoice - if items are provided, delete existing and create new
  if (input.items !== undefined) {
    // Use transaction to update invoice and replace items
    await prisma.$transaction(async (tx) => {
      // Delete existing items
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: input.id },
      })

      // Update invoice and create new items
      await tx.invoice.update({
        where: { id: input.id },
        data: {
          ...(input.clientName !== undefined && { clientName: input.clientName.trim() }),
          ...(input.clientEmail !== undefined && { clientEmail: input.clientEmail?.trim() || null }),
          ...(input.issueDate !== undefined && { issueDate: input.issueDate }),
          ...(input.dueDate !== undefined && { dueDate: input.dueDate }),
          ...(input.notes !== undefined && { notes: input.notes?.trim() || null }),
          items: {
            create: input.items!.map((item) => ({
              description: item.description.trim(),
              quantity: Math.round(item.quantity),
              unitPrice: Math.round(item.unitPrice),
            })),
          },
        },
      })
    })
  } else {
    // Just update invoice fields
    await prisma.invoice.update({
      where: { id: input.id },
      data: {
        ...(input.clientName !== undefined && { clientName: input.clientName.trim() }),
        ...(input.clientEmail !== undefined && { clientEmail: input.clientEmail?.trim() || null }),
        ...(input.issueDate !== undefined && { issueDate: input.issueDate }),
        ...(input.dueDate !== undefined && { dueDate: input.dueDate }),
        ...(input.notes !== undefined && { notes: input.notes?.trim() || null }),
      },
    })
  }

  return { success: true, data: undefined }
}

export async function updateInvoiceStatus(
  id: string,
  newStatus: InvoiceStatus
): Promise<InvoiceResult<void>> {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { success: false, error: "Not authenticated" }
  }

  if (!id) {
    return { success: false, error: "Invoice ID is required" }
  }

  // Verify the invoice belongs to the user
  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      userId,
    },
  })

  if (!invoice) {
    return { success: false, error: "Invoice not found" }
  }

  // Validate status transitions: draft -> sent -> paid (cancelled is terminal state)
  const validTransitions: Record<InvoiceStatus, InvoiceStatus[]> = {
    draft: ["sent"],
    sent: ["paid"],
    paid: [],
    cancelled: [],
  }

  if (!validTransitions[invoice.status].includes(newStatus)) {
    return {
      success: false,
      error: `Cannot change status from ${invoice.status} to ${newStatus}`,
    }
  }

  await prisma.invoice.update({
    where: { id },
    data: { status: newStatus },
  })

  return { success: true, data: undefined }
}

export async function deleteInvoice(id: string): Promise<InvoiceResult<void>> {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { success: false, error: "Not authenticated" }
  }

  if (!id) {
    return { success: false, error: "Invoice ID is required" }
  }

  // Verify the invoice belongs to the user
  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      userId,
    },
  })

  if (!invoice) {
    return { success: false, error: "Invoice not found" }
  }

  if (invoice.status !== "draft") {
    return { success: false, error: "Only draft invoices can be deleted" }
  }

  // Delete the invoice (items will cascade delete due to schema)
  await prisma.invoice.delete({
    where: { id },
  })

  return { success: true, data: undefined }
}

export async function voidInvoice(id: string): Promise<InvoiceResult<void>> {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { success: false, error: "Not authenticated" }
  }

  if (!id) {
    return { success: false, error: "Invoice ID is required" }
  }

  // Verify the invoice belongs to the user
  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      userId,
    },
  })

  if (!invoice) {
    return { success: false, error: "Invoice not found" }
  }

  // Only sent or paid invoices can be voided
  if (invoice.status !== "sent" && invoice.status !== "paid") {
    return { success: false, error: "Only sent or paid invoices can be voided" }
  }

  // Mark as cancelled
  await prisma.invoice.update({
    where: { id },
    data: { status: "cancelled" },
  })

  return { success: true, data: undefined }
}
