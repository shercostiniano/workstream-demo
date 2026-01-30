"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
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
import { TransactionFilters } from "@/components/transactions/transaction-filters"
import {
  getTransactions,
  getCategories,
  getTransactionTotals,
  deleteTransaction,
  type TransactionWithCategory,
  type CategoryOption,
  type TransactionTotals,
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

interface Filters {
  startDate?: Date
  endDate?: Date
  categoryIds?: string[]
}

function TransactionsContent() {
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [totals, setTotals] = useState<TransactionTotals | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  })
  const [filters, setFilters] = useState<Filters>({})
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithCategory | null>(null)
  const [deletingTransaction, setDeletingTransaction] = useState<TransactionWithCategory | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Load categories on mount
  useEffect(() => {
    async function loadCategories() {
      const result = await getCategories()
      if (result.success) {
        setCategories(result.data)
      }
    }
    loadCategories()
  }, [])

  const loadTransactions = useCallback(async (page: number = 1, currentFilters: Filters = filters) => {
    setLoading(true)
    const result = await getTransactions({
      page,
      limit: 20,
      startDate: currentFilters.startDate,
      endDate: currentFilters.endDate,
      categoryIds: currentFilters.categoryIds,
    })
    if (result.success) {
      setTransactions(result.data.transactions)
      setPagination({
        page: result.data.page,
        totalPages: result.data.totalPages,
        total: result.data.total,
      })
    }
    setLoading(false)
  }, [filters])

  const loadTotals = useCallback(async (currentFilters: Filters = filters) => {
    const result = await getTransactionTotals({
      startDate: currentFilters.startDate,
      endDate: currentFilters.endDate,
      categoryIds: currentFilters.categoryIds,
    })
    if (result.success) {
      setTotals(result.data)
    }
  }, [filters])

  // Load transactions when filters change
  useEffect(() => {
    loadTransactions(1, filters)
    loadTotals(filters)
  }, [filters]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFiltersChange = useCallback((newFilters: Filters) => {
    setFilters(newFilters)
  }, [])

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadTransactions(newPage, filters)
    }
  }

  const handleTransactionAdded = () => {
    setIsAddModalOpen(false)
    loadTransactions(1, filters) // Refresh and go back to page 1
    loadTotals(filters)
  }

  const handleTransactionUpdated = () => {
    setEditingTransaction(null)
    loadTransactions(pagination.page, filters) // Refresh current page
    loadTotals(filters)
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
        loadTransactions(pagination.page - 1, filters)
      } else {
        loadTransactions(pagination.page, filters)
      }
      loadTotals(filters)
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

      {/* Filters */}
      <TransactionFilters
        categories={categories}
        onFiltersChange={handleFiltersChange}
      />

      {/* Running Totals */}
      {totals && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm font-medium text-green-600">Total Income</div>
            <div className="text-2xl font-bold text-green-700">
              {formatAmount(totals.income)}
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-sm font-medium text-red-600">Total Expenses</div>
            <div className="text-2xl font-bold text-red-700">
              {formatAmount(totals.expense)}
            </div>
          </div>
          <div className={`${totals.net >= 0 ? "bg-blue-50 border-blue-200" : "bg-orange-50 border-orange-200"} border rounded-lg p-4`}>
            <div className={`text-sm font-medium ${totals.net >= 0 ? "text-blue-600" : "text-orange-600"}`}>
              Net Balance
            </div>
            <div className={`text-2xl font-bold ${totals.net >= 0 ? "text-blue-700" : "text-orange-700"}`}>
              {totals.net >= 0 ? "+" : ""}{formatAmount(totals.net)}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-500">Loading transactions...</div>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No transactions found
          </h3>
          <p className="text-gray-600 mb-4">
            {filters.startDate || filters.endDate || filters.categoryIds?.length
              ? "Try adjusting your filters or add a new transaction."
              : "Get started by adding your first income or expense transaction."}
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

export default function TransactionsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center py-12"><div className="text-gray-500">Loading...</div></div>}>
      <TransactionsContent />
    </Suspense>
  )
}
