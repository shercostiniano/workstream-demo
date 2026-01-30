"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  createTransaction,
  updateTransaction,
  getCategories,
  type CategoryOption,
  type TransactionWithCategory,
} from "@/lib/actions/transactions"
import { CategoryType } from "@/lib/types"

interface TransactionFormProps {
  transaction?: TransactionWithCategory
  onSuccess?: () => void
  onCancel?: () => void
}

export function TransactionForm({ transaction, onSuccess, onCancel }: TransactionFormProps) {
  const isEditing = !!transaction

  const [type, setType] = useState<CategoryType>(
    transaction?.type ?? CategoryType.expense
  )
  const [amount, setAmount] = useState(() => {
    if (transaction) {
      return (transaction.amount / 100).toString()
    }
    return ""
  })
  const [description, setDescription] = useState(transaction?.description ?? "")
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? "")
  const [date, setDate] = useState(() => {
    if (transaction) {
      return new Date(transaction.date).toISOString().split("T")[0]
    }
    const today = new Date()
    return today.toISOString().split("T")[0]
  })
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const loadCategories = useCallback(async () => {
    const result = await getCategories()
    if (result.success) {
      setCategories(result.data)
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  // Filter categories by selected type
  const filteredCategories = categories.filter((cat) => cat.type === type)

  // Reset category when type changes (but not for initial load when editing)
  const [initialLoad, setInitialLoad] = useState(true)
  useEffect(() => {
    if (initialLoad) {
      setInitialLoad(false)
      return
    }
    setCategoryId("")
  }, [type, initialLoad])

  const validateForm = (): string | null => {
    const amountNum = parseFloat(amount)
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      return "Amount is required and must be a positive number"
    }

    if (!categoryId) {
      return "Category is required"
    }

    if (!date) {
      return "Date is required"
    }

    // Check date is not more than 1 year in the future
    const selectedDate = new Date(date)
    const oneYearFromNow = new Date()
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)
    if (selectedDate > oneYearFromNow) {
      return "Date cannot be more than 1 year in the future"
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      // Convert amount from dollars to cents
      const amountInCents = Math.round(parseFloat(amount) * 100)

      if (isEditing) {
        const result = await updateTransaction({
          id: transaction.id,
          type,
          amount: amountInCents,
          description: description.trim() || undefined,
          categoryId,
          date: new Date(date),
        })

        if (result.success) {
          onSuccess?.()
        } else {
          setError(result.error)
        }
      } else {
        const result = await createTransaction({
          type,
          amount: amountInCents,
          description: description.trim() || undefined,
          categoryId,
          date: new Date(date),
        })

        if (result.success) {
          // Clear form on success
          setAmount("")
          setDescription("")
          setCategoryId("")
          setDate(new Date().toISOString().split("T")[0])
          onSuccess?.()
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type Toggle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Type
        </label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={type === CategoryType.income ? "default" : "outline"}
            onClick={() => setType(CategoryType.income)}
            className={
              type === CategoryType.income
                ? "bg-green-600 hover:bg-green-700"
                : ""
            }
          >
            Income
          </Button>
          <Button
            type="button"
            variant={type === CategoryType.expense ? "default" : "outline"}
            onClick={() => setType(CategoryType.expense)}
            className={
              type === CategoryType.expense
                ? "bg-red-600 hover:bg-red-700"
                : ""
            }
          >
            Expense
          </Button>
        </div>
      </div>

      {/* Amount Input */}
      <div>
        <label
          htmlFor="amount"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Amount
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            $
          </span>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-7"
            required
          />
        </div>
      </div>

      {/* Description Input */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description (optional)
        </label>
        <Input
          id="description"
          type="text"
          placeholder="Enter a description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* Category Dropdown */}
      <div>
        <label
          htmlFor="category"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Category
        </label>
        <select
          id="category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring"
          required
        >
          <option value="">Select a category</option>
          {filteredCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Date Picker */}
      <div>
        <label
          htmlFor="date"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Date
        </label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</div>
      )}

      {/* Form Actions */}
      <div className="flex gap-2 justify-end pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : isEditing ? "Save Changes" : "Save Transaction"}
        </Button>
      </div>
    </form>
  )
}
