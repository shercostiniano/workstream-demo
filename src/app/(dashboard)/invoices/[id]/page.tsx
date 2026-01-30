"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Send, DollarSign, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { InvoiceForm } from "@/components/invoices/invoice-form"
import {
  getInvoice,
  updateInvoiceStatus,
  type InvoiceWithItems,
} from "@/lib/actions/invoices"
import { InvoiceStatus } from "@/lib/types"

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatAmount(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  })
}

function getStatusBadgeVariant(status: string): "secondary" | "default" | "outline" {
  switch (status) {
    case InvoiceStatus.draft:
      return "secondary" // gray
    case InvoiceStatus.sent:
      return "default" // blue
    case InvoiceStatus.paid:
      return "outline" // will style with green
    default:
      return "secondary"
  }
}

function getStatusBadgeClassName(status: string): string {
  if (status === InvoiceStatus.paid) {
    return "bg-green-100 text-green-700 border-green-300 hover:bg-green-100"
  }
  if (status === InvoiceStatus.sent) {
    return "bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-100"
  }
  return "" // default gray for draft
}

export default function InvoiceDetailPage() {
  const router = useRouter()
  const params = useParams()
  const invoiceId = params.id as string

  const [invoice, setInvoice] = useState<InvoiceWithItems | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showEditModal, setShowEditModal] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)

  const loadInvoice = useCallback(async () => {
    setLoading(true)
    setError("")
    const result = await getInvoice(invoiceId)
    if (result.success) {
      setInvoice(result.data)
    } else {
      setError(result.error)
    }
    setLoading(false)
  }, [invoiceId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadInvoice()
  }, [loadInvoice])

  const handleEditSuccess = () => {
    setShowEditModal(false)
    loadInvoice()
  }

  const handleMarkAsSent = async () => {
    if (!invoice) return

    setStatusLoading(true)
    const result = await updateInvoiceStatus(invoice.id, "sent")
    if (result.success) {
      loadInvoice()
    } else {
      setError(result.error)
    }
    setStatusLoading(false)
  }

  const handleMarkAsPaid = async () => {
    if (!invoice) return

    setStatusLoading(true)
    const result = await updateInvoiceStatus(invoice.id, "paid")
    if (result.success) {
      loadInvoice()
    } else {
      setError(result.error)
    }
    setStatusLoading(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">Loading invoice...</div>
      </div>
    )
  }

  if (error && !invoice) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push("/invoices")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Invoices
        </Button>
        <div className="text-red-600 bg-red-50 p-4 rounded-lg">{error}</div>
      </div>
    )
  }

  if (!invoice) {
    return null
  }

  const isDraft = invoice.status === InvoiceStatus.draft
  const isSent = invoice.status === InvoiceStatus.sent
  const isPaid = invoice.status === InvoiceStatus.paid

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/invoices")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {invoice.invoiceNumber}
              </h1>
              <Badge
                variant={getStatusBadgeVariant(invoice.status)}
                className={getStatusBadgeClassName(invoice.status)}
              >
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </Badge>
            </div>
            <p className="text-gray-600">{invoice.clientName}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {isDraft && (
            <>
              <Button variant="outline" onClick={() => setShowEditModal(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button onClick={handleMarkAsSent} disabled={statusLoading}>
                <Send className="h-4 w-4 mr-2" />
                {statusLoading ? "Updating..." : "Mark as Sent"}
              </Button>
            </>
          )}
          {isSent && (
            <Button onClick={handleMarkAsPaid} disabled={statusLoading}>
              <DollarSign className="h-4 w-4 mr-2" />
              {statusLoading ? "Updating..." : "Mark as Paid"}
            </Button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>
      )}

      {/* Invoice Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm text-gray-500">Name</span>
              <p className="font-medium">{invoice.clientName}</p>
            </div>
            {invoice.clientEmail && (
              <div>
                <span className="text-sm text-gray-500">Email</span>
                <p className="font-medium">{invoice.clientEmail}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm text-gray-500">Issue Date</span>
              <p className="font-medium">{formatDate(invoice.issueDate)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Due Date</span>
              <p className="font-medium">{formatDate(invoice.dueDate)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Total */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">
              {formatAmount(invoice.total)}
            </p>
            {isPaid && (
              <p className="text-sm text-green-600 mt-1">Paid</p>
            )}
            {isSent && (
              <p className="text-sm text-blue-600 mt-1">Awaiting Payment</p>
            )}
            {isDraft && (
              <p className="text-sm text-gray-500 mt-1">Draft</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-gray-500">
                  <th className="pb-3 font-medium">Description</th>
                  <th className="pb-3 font-medium text-right">Quantity</th>
                  <th className="pb-3 font-medium text-right">Unit Price</th>
                  <th className="pb-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-4">{item.description}</td>
                    <td className="py-4 text-right">{item.quantity}</td>
                    <td className="py-4 text-right">
                      {formatAmount(item.unitPrice)}
                    </td>
                    <td className="py-4 text-right font-medium">
                      {formatAmount(item.quantity * item.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="pt-4 text-right font-semibold">
                    Total:
                  </td>
                  <td className="pt-4 text-right font-bold text-lg">
                    {formatAmount(invoice.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Invoice {invoice.invoiceNumber}</DialogTitle>
          </DialogHeader>
          <InvoiceForm
            invoice={invoice}
            onSuccess={handleEditSuccess}
            onCancel={() => setShowEditModal(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
