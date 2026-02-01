"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { InvoiceForm } from "@/components/invoices/invoice-form"
import { getInvoices, type InvoiceListItem } from "@/lib/actions/invoices"
import { InvoiceStatus } from "@/lib/types"

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function formatAmount(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  })
}

function getStatusBadgeVariant(status: string): "secondary" | "default" | "outline" | "destructive" {
  switch (status) {
    case InvoiceStatus.draft:
      return "secondary" // gray
    case InvoiceStatus.sent:
      return "default" // blue
    case InvoiceStatus.paid:
      return "outline" // will style with green
    case InvoiceStatus.cancelled:
      return "destructive" // red
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
  if (status === InvoiceStatus.cancelled) {
    return "bg-red-100 text-red-700 border-red-300 hover:bg-red-100"
  }
  return "" // default gray for draft
}

export default function InvoicesPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const loadInvoices = useCallback(async () => {
    setLoading(true)
    const result = await getInvoices()
    if (result.success) {
      setInvoices(result.data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadInvoices()
  }, [loadInvoices])

  const handleInvoiceCreated = () => {
    setShowCreateModal(false)
    loadInvoices()
  }

  const handleRowClick = (invoice: InvoiceListItem) => {
    router.push(`/invoices/${invoice.id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="mt-1 text-gray-600">Create and manage your invoices.</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-500">Loading invoices...</div>
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No invoices yet
          </h3>
          <p className="text-gray-600 mb-4">
            Get started by creating your first invoice.
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow
                  key={invoice.id}
                  onClick={() => handleRowClick(invoice)}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <TableCell className="font-medium">
                    {invoice.invoiceNumber}
                  </TableCell>
                  <TableCell>{invoice.clientName}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatAmount(invoice.total)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusBadgeVariant(invoice.status)}
                      className={getStatusBadgeClassName(invoice.status)}
                    >
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Invoice Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
          </DialogHeader>
          <InvoiceForm
            onSuccess={handleInvoiceCreated}
            onCancel={() => setShowCreateModal(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
