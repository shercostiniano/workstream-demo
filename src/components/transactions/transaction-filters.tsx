"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Calendar, ChevronDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CategoryType } from "@/lib/types"

interface Category {
  id: string
  name: string
  type: CategoryType
}

interface TransactionFiltersProps {
  categories: Category[]
  onFiltersChange: (filters: {
    startDate?: Date
    endDate?: Date
    categoryIds?: string[]
  }) => void
}

type QuickFilter = "this-month" | "last-month" | "this-year" | "last-30-days" | "all-time"

function getQuickFilterDates(filter: QuickFilter): { startDate?: Date; endDate?: Date } {
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
    case "all-time":
    default:
      return {}
  }
}

function formatDateForInput(date: Date | undefined): string {
  if (!date) return ""
  return date.toISOString().split("T")[0]
}

export function TransactionFilters({ categories, onFiltersChange }: TransactionFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Initialize state from URL params
  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    const param = searchParams.get("startDate")
    return param ? new Date(param) : undefined
  })
  const [endDate, setEndDate] = useState<Date | undefined>(() => {
    const param = searchParams.get("endDate")
    return param ? new Date(param) : undefined
  })
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    const param = searchParams.get("categories")
    return param ? param.split(",") : []
  })
  const [activeQuickFilter, setActiveQuickFilter] = useState<QuickFilter | null>(() => {
    const param = searchParams.get("quickFilter")
    return param as QuickFilter | null
  })

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()

    if (startDate) {
      params.set("startDate", formatDateForInput(startDate))
    }
    if (endDate) {
      params.set("endDate", formatDateForInput(endDate))
    }
    if (selectedCategories.length > 0) {
      params.set("categories", selectedCategories.join(","))
    }
    if (activeQuickFilter) {
      params.set("quickFilter", activeQuickFilter)
    }

    const queryString = params.toString()
    const newUrl = queryString ? `?${queryString}` : window.location.pathname
    router.replace(newUrl, { scroll: false })
  }, [startDate, endDate, selectedCategories, activeQuickFilter, router])

  // Notify parent of filter changes
  useEffect(() => {
    onFiltersChange({
      startDate,
      endDate,
      categoryIds: selectedCategories.length > 0 ? selectedCategories : undefined,
    })
  }, [startDate, endDate, selectedCategories, onFiltersChange])

  const handleQuickFilter = (filter: QuickFilter) => {
    const dates = getQuickFilterDates(filter)
    setStartDate(dates.startDate)
    setEndDate(dates.endDate)
    setActiveQuickFilter(filter)
  }

  const handleDateChange = (type: "start" | "end", value: string) => {
    const date = value ? new Date(value + "T00:00:00") : undefined
    if (type === "start") {
      setStartDate(date)
    } else {
      setEndDate(date)
    }
    setActiveQuickFilter(null) // Clear quick filter when manually setting dates
  }

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const clearFilters = () => {
    setStartDate(undefined)
    setEndDate(undefined)
    setSelectedCategories([])
    setActiveQuickFilter(null)
  }

  const hasActiveFilters = startDate || endDate || selectedCategories.length > 0

  // Group categories by type
  const incomeCategories = categories.filter((c) => c.type === CategoryType.income)
  const expenseCategories = categories.filter((c) => c.type === CategoryType.expense)

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border mb-6">
      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm font-medium text-gray-700 self-center mr-2">Quick filters:</span>
        {(["this-month", "last-month", "this-year", "last-30-days", "all-time"] as QuickFilter[]).map((filter) => (
          <Button
            key={filter}
            variant={activeQuickFilter === filter ? "default" : "outline"}
            size="sm"
            onClick={() => handleQuickFilter(filter)}
          >
            {filter === "this-month" && "This Month"}
            {filter === "last-month" && "Last Month"}
            {filter === "this-year" && "This Year"}
            {filter === "last-30-days" && "Last 30 Days"}
            {filter === "all-time" && "All Time"}
          </Button>
        ))}
      </div>

      {/* Date Range and Category Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        {/* Start Date */}
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

        {/* End Date */}
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

        {/* Category Multi-Select */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Categories</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-between">
                {selectedCategories.length === 0 ? (
                  "All categories"
                ) : (
                  `${selectedCategories.length} selected`
                )}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0" align="start">
              <div className="p-3 max-h-[300px] overflow-y-auto">
                {incomeCategories.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-semibold text-green-600 uppercase mb-2">
                      Income
                    </div>
                    {incomeCategories.map((category) => (
                      <label
                        key={category.id}
                        className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 rounded px-1"
                      >
                        <Checkbox
                          checked={selectedCategories.includes(category.id)}
                          onCheckedChange={() => handleCategoryToggle(category.id)}
                        />
                        <span className="text-sm">{category.name}</span>
                      </label>
                    ))}
                  </div>
                )}
                {expenseCategories.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-red-600 uppercase mb-2">
                      Expense
                    </div>
                    {expenseCategories.map((category) => (
                      <label
                        key={category.id}
                        className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 rounded px-1"
                      >
                        <Checkbox
                          checked={selectedCategories.includes(category.id)}
                          onCheckedChange={() => handleCategoryToggle(category.id)}
                        />
                        <span className="text-sm">{category.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4 mr-1" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Selected Categories Display */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCategories.map((categoryId) => {
            const category = categories.find((c) => c.id === categoryId)
            if (!category) return null
            return (
              <Badge
                key={categoryId}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => handleCategoryToggle(categoryId)}
              >
                {category.name}
                <X className="ml-1 h-3 w-3" />
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}
