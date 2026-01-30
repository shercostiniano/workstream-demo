"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { CategoryType } from "@/generated/prisma/client"

export type ReportResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

export interface ReportFilters {
  startDate: Date
  endDate: Date
}

export interface IncomeExpenseReport {
  totalIncome: number
  totalExpenses: number
  netProfitLoss: number
  monthlyBreakdown: MonthlyData[]
}

export interface MonthlyData {
  month: string // e.g., "January 2026"
  year: number
  monthNum: number // 0-11
  income: number
  expense: number
  net: number
}

async function getCurrentUserId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id ?? null
}

export async function getIncomeExpenseReport(
  filters: ReportFilters
): Promise<ReportResult<IncomeExpenseReport>> {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { success: false, error: "Not authenticated" }
  }

  // Fetch all transactions in the date range
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: {
        gte: filters.startDate,
        lte: filters.endDate,
      },
    },
    select: {
      type: true,
      amount: true,
      date: true,
    },
    orderBy: {
      date: "asc",
    },
  })

  // Calculate totals
  let totalIncome = 0
  let totalExpenses = 0

  // Group by month for breakdown
  const monthlyMap = new Map<string, { income: number; expense: number }>()

  for (const t of transactions) {
    const date = new Date(t.date)
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`

    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, { income: 0, expense: 0 })
    }

    const monthData = monthlyMap.get(monthKey)!

    if (t.type === CategoryType.income) {
      totalIncome += t.amount
      monthData.income += t.amount
    } else {
      totalExpenses += t.amount
      monthData.expense += t.amount
    }
  }

  // Convert monthly map to array and sort chronologically
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const monthlyBreakdown: MonthlyData[] = Array.from(monthlyMap.entries())
    .map(([key, data]) => {
      const [year, monthNum] = key.split("-").map(Number)
      return {
        month: `${monthNames[monthNum]} ${year}`,
        year,
        monthNum,
        income: data.income,
        expense: data.expense,
        net: data.income - data.expense,
      }
    })
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      return a.monthNum - b.monthNum
    })

  return {
    success: true,
    data: {
      totalIncome,
      totalExpenses,
      netProfitLoss: totalIncome - totalExpenses,
      monthlyBreakdown,
    },
  }
}
