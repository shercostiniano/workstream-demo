"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, TrendingUp, TrendingDown, DollarSign, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { TransactionForm } from "@/components/transactions/transaction-form"
import {
  getDashboardSummary,
  type DashboardSummary,
  type TransactionWithCategory,
} from "@/lib/actions/transactions"
import { CategoryType } from "@/lib/types"

function formatAmount(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  })
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false)
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)

  const loadSummary = async () => {
    setLoading(true)
    const result = await getDashboardSummary()
    if (result.success) {
      setSummary(result.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadSummary()
  }, [])

  const handleTransactionAdded = () => {
    setIsAddIncomeOpen(false)
    setIsAddExpenseOpen(false)
    loadSummary()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-gray-600">
            Your financial overview for this month.
          </p>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex gap-3 mb-6">
        <Button onClick={() => setIsAddIncomeOpen(true)} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Income
        </Button>
        <Button onClick={() => setIsAddExpenseOpen(true)} className="bg-red-600 hover:bg-red-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Total Income Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Income
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatAmount(summary?.currentMonthIncome ?? 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">This month</p>
          </CardContent>
        </Card>

        {/* Total Expenses Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Expenses
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatAmount(summary?.currentMonthExpenses ?? 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">This month</p>
          </CardContent>
        </Card>

        {/* Net Balance Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Net Balance
            </CardTitle>
            <DollarSign className={`h-4 w-4 ${(summary?.netBalance ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(summary?.netBalance ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
              {(summary?.netBalance ?? 0) >= 0 ? "+" : ""}
              {formatAmount(summary?.netBalance ?? 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <Link href="/transactions">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {summary?.recentTransactions && summary.recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {summary.recentTransactions.map((transaction: TransactionWithCategory) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {transaction.description || (
                        <span className="text-gray-400 italic">No description</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {transaction.category.name} &middot; {formatDate(transaction.date)}
                    </div>
                  </div>
                  <div
                    className={`font-semibold ${
                      transaction.type === CategoryType.income
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {transaction.type === CategoryType.income ? "+" : "-"}
                    {formatAmount(transaction.amount)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p>No transactions yet.</p>
              <p className="text-sm mt-1">Add your first income or expense to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Income Modal */}
      <Dialog open={isAddIncomeOpen} onOpenChange={setIsAddIncomeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Income</DialogTitle>
          </DialogHeader>
          <TransactionForm
            defaultType="income"
            onSuccess={handleTransactionAdded}
            onCancel={() => setIsAddIncomeOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Add Expense Modal */}
      <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
          </DialogHeader>
          <TransactionForm
            defaultType="expense"
            onSuccess={handleTransactionAdded}
            onCancel={() => setIsAddExpenseOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
