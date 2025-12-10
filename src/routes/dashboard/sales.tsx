import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salesQueryOptions, addSale, deleteSale } from '@/utils/sales'
import { harvestsQueryOptions, HARVEST_UNITS } from '@/utils/harvests'
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
import { formatCurrency, formatDate, formatNumber } from '@/utils/format'
import { authMiddleware } from '@/middleware/auth'

export const Route = createFileRoute('/dashboard/sales')({
  component: SalesPage,
  server: {
    middleware: [authMiddleware],
  },
})

function SalesPage() {
  const queryClient = useQueryClient()
  const { data: sales } = useSuspenseQuery(salesQueryOptions())
  const { data: harvests } = useSuspenseQuery(harvestsQueryOptions())
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    harvestId: '',
    soldOn: '',
    quantity: '',
    unit: '',
    pricePerUnit: '',
    totalAmount: '',
    season: '',
    buyer: '',
    notes: '',
  })

  const addMutation = useMutation({
    mutationFn: addSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      toast.success('💰 Sale recorded successfully')
      setOpen(false)
      setFormData({
        harvestId: '',
        soldOn: '',
        quantity: '',
        unit: '',
        pricePerUnit: '',
        totalAmount: '',
        season: '',
        buyer: '',
        notes: '',
      })
    },
    onError: (error) => {
      toast.error('Failed to record sale')
      console.error('🔴 Add sale error:', error)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      toast.success('🗑️ Sale deleted')
    },
    onError: (error) => {
      toast.error('Failed to delete sale')
      console.error('🔴 Delete sale error:', error)
    },
  })

  // Auto-calculate total when quantity and price change
  function updateTotal(quantity: string, pricePerUnit: string) {
    const qty = parseFloat(quantity) || 0
    const price = parseFloat(pricePerUnit) || 0
    const total = qty * price
    setFormData((prev) => ({
      ...prev,
      quantity,
      pricePerUnit,
      totalAmount: total > 0 ? total.toString() : '',
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    addMutation.mutate({
      data: {
        harvestId: parseInt(formData.harvestId),
        soldOn: formData.soldOn,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        pricePerUnit: parseFloat(formData.pricePerUnit),
        totalAmount: parseFloat(formData.totalAmount),
        season: formData.season,
        buyer: formData.buyer || undefined,
        notes: formData.notes || undefined,
      },
    })
  }

  // Calculate total revenue
  const totalRevenue = sales?.reduce((sum, s) => sum + s.totalAmount, 0) ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sales</h1>
          <p className="text-muted-foreground">
            {sales?.length ?? 0} sale{sales?.length !== 1 ? 's' : ''} •{' '}
            {formatCurrency(totalRevenue)} total revenue
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button disabled={!harvests?.length}>
              Record Sale
              <Plus className="h-4 w-4 ml-2" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Sale</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="harvestId">Harvest *</Label>
                <Select
                  value={formData.harvestId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, harvestId: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select harvest" />
                  </SelectTrigger>
                  <SelectContent>
                    {harvests?.map((harvest) => (
                      <SelectItem
                        key={harvest.id}
                        value={harvest.id.toString()}
                      >
                        {harvest.cropName} - {formatNumber(harvest.quantity)}{' '}
                        {harvest.unit} ({formatDate(harvest.harvestedOn)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity Sold *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 100"
                    value={formData.quantity}
                    onChange={(e) =>
                      updateTotal(e.target.value, formData.pricePerUnit)
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit *</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) =>
                      setFormData({ ...formData, unit: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {HARVEST_UNITS.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pricePerUnit">Price per Unit *</Label>
                  <Input
                    id="pricePerUnit"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 50"
                    value={formData.pricePerUnit}
                    onChange={(e) =>
                      updateTotal(formData.quantity, e.target.value)
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalAmount">Total Amount *</Label>
                  <Input
                    id="totalAmount"
                    type="number"
                    step="0.01"
                    placeholder="Auto-calculated"
                    value={formData.totalAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, totalAmount: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="soldOn">Date *</Label>
                  <Input
                    id="soldOn"
                    type="date"
                    value={formData.soldOn}
                    onChange={(e) =>
                      setFormData({ ...formData, soldOn: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buyer">
                    Buyer{' '}
                    <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="buyer"
                    placeholder="e.g., Market, John"
                    value={formData.buyer}
                    onChange={(e) =>
                      setFormData({ ...formData, buyer: e.target.value })
                    }
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

              <div className="space-y-2">
                <Label htmlFor="notes">
                  Notes <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="notes"
                  placeholder="Any details about this sale"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={addMutation.isPending || !formData.harvestId}
              >
                {addMutation.isPending ? 'Recording...' : 'Record Sale'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!harvests?.length ? (
        <div className="bg-white rounded-3xl p-8 text-center border-2 border-dashed border-gray-200">
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
            💰
          </div>
          <p className="text-gray-500 font-medium">Record harvests first.</p>
          <p className="text-sm text-gray-400 mt-1">
            You need to record harvests before recording sales.
          </p>
        </div>
      ) : sales?.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border-2 border-dashed border-gray-200">
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
            💰
          </div>
          <p className="text-gray-500 font-medium">No sales yet.</p>
          <p className="text-sm text-gray-400 mt-1">
            Record your first sale to start tracking revenue.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Crop</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales?.map((sale) => (
                <TableRow key={sale.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <span className="text-base">💰</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {sale.cropName}
                        </p>
                        {sale.fieldName && (
                          <span className="text-xs text-muted-foreground">
                            {sale.fieldName}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {sale.buyer ? (
                      <span className="text-gray-700">{sale.buyer}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {formatNumber(sale.quantity)} {sale.unit}
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {formatDate(sale.soldOn)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-bold text-emerald-600">
                      +{formatCurrency(sale.totalAmount)}
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
                          <AlertDialogTitle>Delete sale?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this sale record (
                            {formatCurrency(sale.totalAmount)} from{' '}
                            {sale.cropName})?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-white hover:bg-destructive/90"
                            onClick={() =>
                              deleteMutation.mutate({ data: sale.id })
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

