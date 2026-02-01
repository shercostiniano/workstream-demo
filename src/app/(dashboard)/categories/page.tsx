"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type CategoryWithDetails,
} from "@/lib/actions/categories"
import { CategoryType } from "@/lib/types"

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Add form state
  const [isAddFormOpen, setIsAddFormOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryType, setNewCategoryType] = useState<CategoryType>("expense")
  const [isAdding, setIsAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  // Edit form state
  const [editingCategory, setEditingCategory] = useState<CategoryWithDetails | null>(null)
  const [editName, setEditName] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // Delete confirmation state
  const [deletingCategory, setDeletingCategory] = useState<CategoryWithDetails | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function loadCategories() {
    setLoading(true)
    const result = await getCategories()
    if (result.success) {
      setCategories(result.data)
      setError(null)
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadCategories()
  }, [])

  // Group categories by type
  const incomeCategories = categories.filter((c) => c.type === CategoryType.income)
  const expenseCategories = categories.filter((c) => c.type === CategoryType.expense)

  // Handle add category
  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault()
    setIsAdding(true)
    setAddError(null)

    const result = await createCategory({
      name: newCategoryName,
      type: newCategoryType,
    })

    if (result.success) {
      setNewCategoryName("")
      setNewCategoryType("expense")
      setIsAddFormOpen(false)
      loadCategories()
    } else {
      setAddError(result.error)
    }
    setIsAdding(false)
  }

  // Handle edit category
  function openEditDialog(category: CategoryWithDetails) {
    setEditingCategory(category)
    setEditName(category.name)
    setEditError(null)
  }

  async function handleEditCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!editingCategory) return

    setIsEditing(true)
    setEditError(null)

    const result = await updateCategory({
      id: editingCategory.id,
      name: editName,
    })

    if (result.success) {
      setEditingCategory(null)
      setEditName("")
      loadCategories()
    } else {
      setEditError(result.error)
    }
    setIsEditing(false)
  }

  // Handle delete category
  function openDeleteDialog(category: CategoryWithDetails) {
    setDeletingCategory(category)
    setDeleteError(null)
  }

  async function handleDeleteCategory() {
    if (!deletingCategory) return

    setIsDeleting(true)
    setDeleteError(null)

    const result = await deleteCategory(deletingCategory.id)

    if (result.success) {
      setDeletingCategory(null)
      loadCategories()
    } else {
      setDeleteError(result.error)
    }
    setIsDeleting(false)
  }

  function CategoryRow({ category }: { category: CategoryWithDetails }) {
    return (
      <div className="flex items-center justify-between py-3 border-b last:border-b-0">
        <span className="font-medium text-gray-900">{category.name}</span>
        <div className="flex items-center gap-2">
          {category.isDefault ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                disabled
                className="h-8 w-8 p-0 text-gray-300 cursor-not-allowed"
                title="Cannot edit default categories"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled
                className="h-8 w-8 p-0 text-gray-300 cursor-not-allowed"
                title="Cannot delete default categories"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openEditDialog(category)}
                className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                title="Edit category"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openDeleteDialog(category)}
                className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                title="Delete category"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="mt-1 text-gray-600">
            Manage your income and expense categories.
          </p>
        </div>
        <Button onClick={() => setIsAddFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-500">Loading categories...</div>
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-red-50 rounded-lg border border-red-200">
          <p className="text-red-600">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Income Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Income Categories</CardTitle>
              <CardDescription>
                Categories for tracking your income sources
              </CardDescription>
            </CardHeader>
            <CardContent>
              {incomeCategories.length === 0 ? (
                <p className="text-gray-500 text-sm">No income categories yet.</p>
              ) : (
                <div>
                  {incomeCategories.map((category) => (
                    <CategoryRow key={category.id} category={category} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expense Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Expense Categories</CardTitle>
              <CardDescription>
                Categories for tracking your expenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {expenseCategories.length === 0 ? (
                <p className="text-gray-500 text-sm">No expense categories yet.</p>
              ) : (
                <div>
                  {expenseCategories.map((category) => (
                    <CategoryRow key={category.id} category={category} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Category Dialog */}
      <Dialog open={isAddFormOpen} onOpenChange={setIsAddFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>
              Create a new custom category for tracking transactions.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCategory}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Category Name
                </label>
                <Input
                  id="name"
                  placeholder="Enter category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  disabled={isAdding}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="type" className="text-sm font-medium text-gray-700">
                  Category Type
                </label>
                <Select
                  value={newCategoryType}
                  onValueChange={(value) => setNewCategoryType(value as CategoryType)}
                  disabled={isAdding}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {addError && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {addError}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddFormOpen(false)}
                disabled={isAdding}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isAdding || !newCategoryName.trim()}>
                {isAdding ? "Adding..." : "Add Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog
        open={!!editingCategory}
        onOpenChange={(open) => {
          if (!open) {
            setEditingCategory(null)
            setEditError(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the name of your custom category.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditCategory}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="editName" className="text-sm font-medium text-gray-700">
                  Category Name
                </label>
                <Input
                  id="editName"
                  placeholder="Enter category name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  disabled={isEditing}
                  required
                />
              </div>
              {editingCategory && (
                <div className="text-sm text-gray-500">
                  Type: <span className="font-medium capitalize">{editingCategory.type}</span>
                </div>
              )}
              {editError && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {editError}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingCategory(null)}
                disabled={isEditing}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isEditing || !editName.trim()}>
                {isEditing ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingCategory}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingCategory(null)
            setDeleteError(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? This action cannot be undone.
              {deletingCategory && (
                <span className="block mt-2 font-medium text-gray-700">
                  {deletingCategory.name} ({deletingCategory.type})
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
              {deleteError}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
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
