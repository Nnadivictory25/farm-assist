import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  expensesQueryOptions,
  addExpense,
  deleteExpense,
  EXPENSE_CATEGORIES,
} from '@/utils/expenses'
import { cropsQueryOptions } from '@/utils/crops'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { formatCurrency, formatDate } from '@/utils/format'
import { authMiddleware } from '@/middleware/auth'

export const Route = createFileRoute('/dashboard/expenses')({
  component: ExpensesPage,
  server: {
    middleware: [authMiddleware],
  },
})

const CATEGORY_ICONS: Record<string, string> = {
  Seeds: '🌱',
  Fertilizer: '🧪',
  Pesticides: '🐛',
  Labor: '👷',
  Equipment: '🚜',
  Fuel: '⛽',
  Transport: '🚚',
  Storage: '📦',
  Other: '📋',
}

function ExpensesPage() {
  const queryClient = useQueryClient()
  const { data: expenses, isLoading } = useQuery(expensesQueryOptions())
  const { data: crops } = useQuery(cropsQueryOptions())
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    category: '',
    item: '',
    totalCost: '',
    purchasedOn: '',
    season: '',
    cropId: '',
    notes: '',
  })

  const addMutation = useMutation({
    mutationFn: addExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      toast.success('💸 Expense added successfully')
      setOpen(false)
      setFormData({
        category: '',
        item: '',
        totalCost: '',
        purchasedOn: '',
        season: '',
        cropId: '',
        notes: '',
      })
    },
    onError: (error) => {
      toast.error('Failed to add expense')
      console.error('🔴 Add expense error:', error)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      toast.success('🗑️ Expense deleted')
    },
    onError: (error) => {
      toast.error('Failed to delete expense')
      console.error('🔴 Delete expense error:', error)
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    addMutation.mutate({
      data: {
        category: formData.category,
        item: formData.item,
        totalCost: parseFloat(formData.totalCost),
        purchasedOn: formData.purchasedOn,
        season: formData.season,
        cropId: formData.cropId ? parseInt(formData.cropId) : undefined,
        notes: formData.notes || undefined,
      },
    })
  }

  // Calculate total expenses
  const totalExpenses = expenses?.reduce((sum, e) => sum + e.totalCost, 0) ?? 0

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Expenses</h1>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(4)].map((_, i) => (
                <TableRow key={i} className="animate-pulse">
                  <TableCell><div className="h-4 bg-muted rounded w-24" /></TableCell>
                  <TableCell><div className="h-4 bg-muted rounded w-32" /></TableCell>
                  <TableCell><div className="h-4 bg-muted rounded w-24" /></TableCell>
                  <TableCell><div className="h-4 bg-muted rounded w-20 ml-auto" /></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">
            {expenses?.length ?? 0} expense{expenses?.length !== 1 ? 's' : ''} •{' '}
            {formatCurrency(totalExpenses)} total
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              Add Expense
              <Plus className="h-4 w-4 ml-2" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {CATEGORY_ICONS[cat]} {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item">Description *</Label>
                  <Input
                    id="item"
                    placeholder="e.g., Tractor, NPK Fertilizer"
                    value={formData.item}
                    onChange={(e) =>
                      setFormData({ ...formData, item: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalCost">Amount *</Label>
                  <Input
                    id="totalCost"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 50000"
                    value={formData.totalCost}
                    onChange={(e) =>
                      setFormData({ ...formData, totalCost: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchasedOn">Date *</Label>
                  <Input
                    id="purchasedOn"
                    type="date"
                    value={formData.purchasedOn}
                    onChange={(e) =>
                      setFormData({ ...formData, purchasedOn: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="season">Season *</Label>
                <Input
                  id="season"
                  placeholder="e.g., 2024 Long Rains"
                  value={formData.season}
                  onChange={(e) =>
                    setFormData({ ...formData, season: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cropId">
                    Crop <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Select
                    value={formData.cropId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, cropId: value === 'none' ? '' : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Link to crop" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {crops?.map((crop) => (
                        <SelectItem key={crop.id} value={crop.id.toString()}>
                          {crop.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">
                    Notes <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="notes"
                    placeholder="Any details"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={addMutation.isPending}
              >
                {addMutation.isPending ? 'Adding...' : 'Add Expense'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {expenses?.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border-2 border-dashed border-gray-200">
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
            💸
          </div>
          <p className="text-gray-500 font-medium">No expenses yet.</p>
          <p className="text-sm text-gray-400 mt-1">
            Add your first expense to start tracking.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses?.map((expense) => (
                <TableRow key={expense.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
                        <span className="text-base">{CATEGORY_ICONS[expense.category] ?? '📋'}</span>
                      </div>
                      <span className="text-sm text-gray-700">{expense.category}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-semibold text-gray-900">{expense.item}</p>
                      {expense.cropName && (
                        <span className="text-xs text-primary">{expense.cropName}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {formatDate(expense.purchasedOn)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-bold text-red-600">
                      -{formatCurrency(expense.totalCost)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete expense?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{expense.item}" (
                            {formatCurrency(expense.totalCost)})?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-white hover:bg-destructive/90"
                            onClick={() =>
                              deleteMutation.mutate({ data: expense.id })
                            }
                            disabled={deleteMutation.isPending}
                          >
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
