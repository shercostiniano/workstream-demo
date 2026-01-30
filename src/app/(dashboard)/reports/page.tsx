"use client"

import { useState, useEffect } from "react"
import { Calendar, TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import {
  getIncomeExpenseReport,
  type IncomeExpenseReport,
  type MonthlyData,
} from "@/lib/actions/reports"

function formatAmount(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  })
}

function formatDateForInput(date: Date): string {
  return date.toISOString().split("T")[0]
}

type QuickFilter = "this-month" | "last-month" | "this-year" | "last-30-days" | "ytd"

function getQuickFilterDates(filter: QuickFilter): { startDate: Date; endDate: Date } {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (filter) {
    case "this-month": {
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1)
      const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)
      return { startDate, endDate }
    }
    case "last-month": {
      const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const endDate = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999)
      return { startDate, endDate }
    }
    case "this-year": {
      const startDate = new Date(today.getFullYear(), 0, 1)
      const endDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999)
      return { startDate, endDate }
    }
    case "last-30-days": {
      const startDate = new Date(today)
      startDate.setDate(startDate.getDate() - 30)
      const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
      return { startDate, endDate }
    }
    case "ytd": {
      const startDate = new Date(today.getFullYear(), 0, 1)
      const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
      return { startDate, endDate }
    }
    default: {
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1)
      const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)
      return { startDate, endDate }
    }
  }
}

export default function ReportsPage() {
  // Default to current month
  const [startDate, setStartDate] = useState<Date>(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [endDate, setEndDate] = useState<Date>(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  })
  const [activeQuickFilter, setActiveQuickFilter] = useState<QuickFilter | null>("this-month")
  const [report, setReport] = useState<IncomeExpenseReport | null>(null)
  const [loading, setLoading] = useState(true)

  const loadReport = async () => {
    setLoading(true)
    const result = await getIncomeExpenseReport({
      startDate,
      endDate,
    })
    if (result.success) {
      setReport(result.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReport()
  }, [startDate, endDate]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleQuickFilter = (filter: QuickFilter) => {
    const dates = getQuickFilterDates(filter)
    setStartDate(dates.startDate)
    setEndDate(dates.endDate)
    setActiveQuickFilter(filter)
  }

  const handleDateChange = (type: "start" | "end", value: string) => {
    if (!value) return
    const date = new Date(value + "T00:00:00")
    if (type === "start") {
      setStartDate(date)
    } else {
      // Set end of day for end date
      date.setHours(23, 59, 59, 999)
      setEndDate(date)
    }
    setActiveQuickFilter(null)
  }

  // Prepare chart data - convert cents to dollars for display
  const chartData = report?.monthlyBreakdown.map((m: MonthlyData) => ({
    name: m.month.split(" ")[0].substring(0, 3), // Abbreviated month name
    Income: m.income / 100,
    Expenses: m.expense / 100,
  })) ?? []

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="mt-1 text-gray-600">
            Analyze your income and expenses over time.
          </p>
        </div>
      </div>

      {/* Income vs Expense Report Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Income vs Expense Report</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Date Range Selector */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border mb-6">
            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700 self-center mr-2">Period:</span>
              {(["this-month", "last-month", "last-30-days", "ytd", "this-year"] as QuickFilter[]).map((filter) => (
                <Button
                  key={filter}
                  variant={activeQuickFilter === filter ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleQuickFilter(filter)}
                >
                  {filter === "this-month" && "This Month"}
                  {filter === "last-month" && "Last Month"}
                  {filter === "last-30-days" && "Last 30 Days"}
                  {filter === "ytd" && "Year to Date"}
                  {filter === "this-year" && "Full Year"}
                </Button>
              ))}
            </div>

            {/* Custom Date Range */}
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Start Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    type="date"
                    value={formatDateForInput(startDate)}
                    onChange={(e) => handleDateChange("start", e.target.value)}
                    className="pl-10 w-40"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">End Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    type="date"
                    value={formatDateForInput(endDate)}
                    onChange={(e) => handleDateChange("end", e.target.value)}
                    className="pl-10 w-40"
                  />
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-gray-500">Loading report...</div>
            </div>
          ) : (
            <>
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
                      {formatAmount(report?.totalIncome ?? 0)}
                    </div>
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
                      {formatAmount(report?.totalExpenses ?? 0)}
                    </div>
                  </CardContent>
                </Card>

                {/* Net Profit/Loss Card */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Net Profit/Loss
                    </CardTitle>
                    <DollarSign className={`h-4 w-4 ${(report?.netProfitLoss ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`} />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${(report?.netProfitLoss ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {(report?.netProfitLoss ?? 0) >= 0 ? "+" : ""}
                      {formatAmount(report?.netProfitLoss ?? 0)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Bar Chart */}
              {chartData.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Income vs Expenses by Month</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis
                          tickFormatter={(value) => `$${value.toLocaleString()}`}
                        />
                        <Tooltip
                          formatter={(value) => [`$${Number(value).toLocaleString()}`]}
                        />
                        <Legend />
                        <Bar dataKey="Income" fill="#16a34a" />
                        <Bar dataKey="Expenses" fill="#dc2626" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Monthly Breakdown Table */}
              {report && report.monthlyBreakdown.length > 1 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Breakdown</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Income</TableHead>
                        <TableHead className="text-right">Expenses</TableHead>
                        <TableHead className="text-right">Net</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.monthlyBreakdown.map((month: MonthlyData) => (
                        <TableRow key={month.month}>
                          <TableCell className="font-medium">{month.month}</TableCell>
                          <TableCell className="text-right text-green-600">
                            {formatAmount(month.income)}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            {formatAmount(month.expense)}
                          </TableCell>
                          <TableCell className={`text-right font-medium ${month.net >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {month.net >= 0 ? "+" : ""}{formatAmount(month.net)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Total Row */}
                      <TableRow className="border-t-2 font-bold">
                        <TableCell>Total</TableCell>
                        <TableCell className="text-right text-green-600">
                          {formatAmount(report.totalIncome)}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {formatAmount(report.totalExpenses)}
                        </TableCell>
                        <TableCell className={`text-right ${report.netProfitLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {report.netProfitLoss >= 0 ? "+" : ""}{formatAmount(report.netProfitLoss)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Empty State */}
              {report && report.monthlyBreakdown.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No data for selected period
                  </h3>
                  <p className="text-gray-600">
                    Try selecting a different date range or add some transactions.
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
