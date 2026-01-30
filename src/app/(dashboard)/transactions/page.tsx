"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Trash2 } from "lucide-react"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { TransactionForm } from "@/components/transactions/transaction-form"
import {
  getTransactions,
  deleteTransaction,
  type TransactionWithCategory,
} from "@/lib/actions/transactions"
import { CategoryType } from "@/lib/types"

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

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  })
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithCategory | null>(null)
  const [deletingTransaction, setDeletingTransaction] = useState<TransactionWithCategory | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadTransactions = useCallback(async (page: number = 1) => {
    setLoading(true)
    const result = await getTransactions({ page, limit: 20 })
    if (result.success) {
      setTransactions(result.data.transactions)
      setPagination({
        page: result.data.page,
        totalPages: result.data.totalPages,
        total: result.data.total,
      })
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadTransactions(newPage)
    }
  }

  const handleTransactionAdded = () => {
    setIsAddModalOpen(false)
    loadTransactions(1) // Refresh and go back to page 1
  }

  const handleTransactionUpdated = () => {
    setEditingTransaction(null)
    loadTransactions(pagination.page) // Refresh current page
  }

  const handleRowClick = (transaction: TransactionWithCategory) => {
    setEditingTransaction(transaction)
  }

  const handleDeleteClick = (e: React.MouseEvent, transaction: TransactionWithCategory) => {
    e.stopPropagation() // Prevent row click from triggering
    setDeletingTransaction(transaction)
  }

  const handleConfirmDelete = async () => {
    if (!deletingTransaction) return

    setIsDeleting(true)
    const result = await deleteTransaction(deletingTransaction.id)
    setIsDeleting(false)

    if (result.success) {
      setDeletingTransaction(null)
      // If we're on a page with only one item and it's not the first page, go back
      if (transactions.length === 1 && pagination.page > 1) {
        loadTransactions(pagination.page - 1)
      } else {
        loadTransactions(pagination.page)
      }
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="mt-1 text-gray-600">
            Manage your income and expense transactions.
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Transaction
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-500">Loading transactions...</div>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No transactions yet
          </h3>
          <p className="text-gray-600 mb-4">
            Get started by adding your first income or expense transaction.
          </p>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow
                  key={transaction.id}
                  onClick={() => handleRowClick(transaction)}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <TableCell>{formatDate(transaction.date)}</TableCell>
                  <TableCell>
                    {transaction.description || (
                      <span className="text-gray-400 italic">No description</span>
                    )}
                  </TableCell>
                  <TableCell>{transaction.category.name}</TableCell>
                  <TableCell
                    className={`text-right font-medium ${
                      transaction.type === CategoryType.income
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {transaction.type === CategoryType.income ? "+" : "-"}
                    {formatAmount(transaction.amount)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteClick(e, transaction)}
                      className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-gray-600">
                Showing {(pagination.page - 1) * 20 + 1} to{" "}
                {Math.min(pagination.page * 20, pagination.total)} of{" "}
                {pagination.total} transactions
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center px-3 text-sm text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Transaction Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
          </DialogHeader>
          <TransactionForm
            onSuccess={handleTransactionAdded}
            onCancel={() => setIsAddModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Modal */}
      <Dialog
        open={!!editingTransaction}
        onOpenChange={(open) => {
          if (!open) setEditingTransaction(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          {editingTransaction && (
            <TransactionForm
              transaction={editingTransaction}
              onSuccess={handleTransactionUpdated}
              onCancel={() => setEditingTransaction(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingTransaction}
        onOpenChange={(open) => {
          if (!open) setDeletingTransaction(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? This action cannot
              be undone.
              {deletingTransaction && (
                <span className="block mt-2 font-medium text-gray-700">
                  {deletingTransaction.description || "No description"} -{" "}
                  {formatAmount(deletingTransaction.amount)}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
