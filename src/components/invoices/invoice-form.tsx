"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  createInvoice,
  updateInvoice,
  updateInvoiceStatus,
  type InvoiceItemInput,
  type InvoiceWithItems,
} from "@/lib/actions/invoices"
import { InvoiceStatus } from "@/lib/types"
import { Plus, Trash2 } from "lucide-react"

interface LineItem {
  id: string
  description: string
  quantity: string
  unitPrice: string
}

interface InvoiceFormProps {
  invoice?: InvoiceWithItems
  onSuccess?: () => void
  onCancel?: () => void
}

export function InvoiceForm({ invoice, onSuccess, onCancel }: InvoiceFormProps) {
  const router = useRouter()
  const isEditing = !!invoice
  const isReadOnly = invoice && invoice.status !== InvoiceStatus.draft

  const [clientName, setClientName] = useState(invoice?.clientName ?? "")
  const [clientEmail, setClientEmail] = useState(invoice?.clientEmail ?? "")
  const [issueDate, setIssueDate] = useState(() => {
    if (invoice) {
      return new Date(invoice.issueDate).toISOString().split("T")[0]
    }
    return new Date().toISOString().split("T")[0]
  })
  const [dueDate, setDueDate] = useState(() => {
    if (invoice) {
      return new Date(invoice.dueDate).toISOString().split("T")[0]
    }
    // Default due date is 30 days from now
    const defaultDue = new Date()
    defaultDue.setDate(defaultDue.getDate() + 30)
    return defaultDue.toISOString().split("T")[0]
  })
  const [notes, setNotes] = useState(invoice?.notes ?? "")

  const [lineItems, setLineItems] = useState<LineItem[]>(() => {
    if (invoice && invoice.items.length > 0) {
      return invoice.items.map((item, index) => ({
        id: `item-${index}`,
        description: item.description,
        quantity: item.quantity.toString(),
        unitPrice: (item.unitPrice / 100).toFixed(2),
      }))
    }
    // Start with one empty line item
    return [{ id: "item-0", description: "", quantity: "1", unitPrice: "" }]
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Calculate line item total (quantity * unit price)
  const getLineTotal = (item: LineItem): number => {
    const qty = parseFloat(item.quantity) || 0
    const price = parseFloat(item.unitPrice) || 0
    return qty * price
  }

  // Calculate invoice total
  const invoiceTotal = lineItems.reduce((sum, item) => sum + getLineTotal(item), 0)

  // Add a new line item
  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { id: `item-${Date.now()}`, description: "", quantity: "1", unitPrice: "" },
    ])
  }

  // Remove a line item
  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((item) => item.id !== id))
    }
  }

  // Update a line item field
  const updateLineItem = (id: string, field: keyof LineItem, value: string) => {
    setLineItems(
      lineItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    )
  }

  // Format amount for display
  const formatAmount = (amount: number): string => {
    return amount.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    })
  }

  // Validate form
  const validateForm = (): string | null => {
    if (!clientName.trim()) {
      return "Client name is required"
    }

    if (!issueDate) {
      return "Issue date is required"
    }

    if (!dueDate) {
      return "Due date is required"
    }

    // Validate line items
    const validItems = lineItems.filter((item) => item.description.trim())
    if (validItems.length === 0) {
      return "At least one line item is required"
    }

    for (const item of validItems) {
      const qty = parseFloat(item.quantity)
      if (isNaN(qty) || qty <= 0) {
        return "All line items must have a valid quantity greater than 0"
      }
      const price = parseFloat(item.unitPrice)
      if (isNaN(price) || price < 0) {
        return "All line items must have a valid unit price"
      }
    }

    return null
  }

  // Convert line items to input format
  const getItemInputs = (): InvoiceItemInput[] => {
    return lineItems
      .filter((item) => item.description.trim())
      .map((item) => ({
        description: item.description.trim(),
        quantity: Math.round(parseFloat(item.quantity) || 1),
        unitPrice: Math.round((parseFloat(item.unitPrice) || 0) * 100), // Convert to cents
      }))
  }

  // Handle Save as Draft
  const handleSaveDraft = async () => {
    setError("")
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    try {
      const items = getItemInputs()

      if (isEditing) {
        const result = await updateInvoice({
          id: invoice.id,
          clientName: clientName.trim(),
          clientEmail: clientEmail.trim() || undefined,
          issueDate: new Date(issueDate),
          dueDate: new Date(dueDate),
          notes: notes.trim() || undefined,
          items,
        })

        if (result.success) {
          onSuccess?.()
          router.refresh()
        } else {
          setError(result.error)
        }
      } else {
        const result = await createInvoice({
          clientName: clientName.trim(),
          clientEmail: clientEmail.trim() || undefined,
          issueDate: new Date(issueDate),
          dueDate: new Date(dueDate),
          notes: notes.trim() || undefined,
          items,
        })

        if (result.success) {
          onSuccess?.()
          router.push(`/invoices/${result.data.id}`)
        } else {
          setError(result.error)
        }
      }
    } catch {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Handle Mark as Sent
  const handleMarkAsSent = async () => {
    setError("")
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    try {
      const items = getItemInputs()

      if (isEditing) {
        // First update the invoice if there are changes
        const updateResult = await updateInvoice({
          id: invoice.id,
          clientName: clientName.trim(),
          clientEmail: clientEmail.trim() || undefined,
          issueDate: new Date(issueDate),
          dueDate: new Date(dueDate),
          notes: notes.trim() || undefined,
          items,
        })

        if (!updateResult.success) {
          setError(updateResult.error)
          return
        }

        // Then update status to sent
        const statusResult = await updateInvoiceStatus(invoice.id, "sent")
        if (statusResult.success) {
          onSuccess?.()
          router.refresh()
        } else {
          setError(statusResult.error)
        }
      } else {
        // Create new invoice first
        const createResult = await createInvoice({
          clientName: clientName.trim(),
          clientEmail: clientEmail.trim() || undefined,
          issueDate: new Date(issueDate),
          dueDate: new Date(dueDate),
          notes: notes.trim() || undefined,
          items,
        })

        if (!createResult.success) {
          setError(createResult.error)
          return
        }

        // Then update status to sent
        const statusResult = await updateInvoiceStatus(createResult.data.id, "sent")
        if (statusResult.success) {
          onSuccess?.()
          router.push(`/invoices/${createResult.data.id}`)
        } else {
          setError(statusResult.error)
        }
      }
    } catch {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Client Information */}
      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="clientName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Client Name *
              </label>
              <Input
                id="clientName"
                type="text"
                placeholder="Enter client name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                disabled={isReadOnly}
                required
              />
            </div>
            <div>
              <label
                htmlFor="clientEmail"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Client Email
              </label>
              <Input
                id="clientEmail"
                type="email"
                placeholder="client@example.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                disabled={isReadOnly}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Details */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="issueDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Issue Date *
              </label>
              <Input
                id="issueDate"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                disabled={isReadOnly}
                required
              />
            </div>
            <div>
              <label
                htmlFor="dueDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Due Date *
              </label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isReadOnly}
                required
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              placeholder="Additional notes for the client..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isReadOnly}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Line Items</CardTitle>
          {!isReadOnly && (
            <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Header */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 text-sm font-medium text-gray-700 border-b pb-2">
              <div className="col-span-5">Description</div>
              <div className="col-span-2 text-right">Quantity</div>
              <div className="col-span-2 text-right">Unit Price</div>
              <div className="col-span-2 text-right">Total</div>
              <div className="col-span-1"></div>
            </div>

            {/* Line Items */}
            {lineItems.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start p-4 md:p-0 border md:border-0 rounded-lg md:rounded-none"
              >
                <div className="md:col-span-5">
                  <label className="block md:hidden text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <Input
                    type="text"
                    placeholder="Item description"
                    value={item.description}
                    onChange={(e) =>
                      updateLineItem(item.id, "description", e.target.value)
                    }
                    disabled={isReadOnly}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block md:hidden text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="1"
                    value={item.quantity}
                    onChange={(e) =>
                      updateLineItem(item.id, "quantity", e.target.value)
                    }
                    disabled={isReadOnly}
                    className="text-right"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block md:hidden text-sm font-medium text-gray-700 mb-1">
                    Unit Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={item.unitPrice}
                      onChange={(e) =>
                        updateLineItem(item.id, "unitPrice", e.target.value)
                      }
                      disabled={isReadOnly}
                      className="pl-7 text-right"
                    />
                  </div>
                </div>
                <div className="md:col-span-2 flex items-center justify-end">
                  <span className="md:hidden text-sm font-medium text-gray-700 mr-2">
                    Total:
                  </span>
                  <span className="text-sm font-medium">
                    {formatAmount(getLineTotal(item))}
                  </span>
                </div>
                <div className="md:col-span-1 flex justify-end">
                  {!isReadOnly && lineItems.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLineItem(item.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {/* Invoice Total */}
            <div className="border-t pt-4 flex justify-end">
              <div className="text-right">
                <span className="text-lg font-semibold text-gray-700">
                  Invoice Total:{" "}
                </span>
                <span className="text-lg font-bold text-gray-900">
                  {formatAmount(invoiceTotal)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>
      )}

      {/* Form Actions */}
      {!isReadOnly && (
        <div className="flex gap-3 justify-end">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save as Draft"}
          </Button>
          <Button
            type="button"
            onClick={handleMarkAsSent}
            disabled={loading}
          >
            {loading ? "Saving..." : "Mark as Sent"}
          </Button>
        </div>
      )}
    </div>
  )
}
