import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  harvestsQueryOptions,
  addHarvest,
  deleteHarvest,
  HARVEST_UNITS,
  QUALITY_GRADES,
} from '@/utils/harvests'
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
import { formatDate, formatNumber } from '@/utils/format'
import { authMiddleware } from '@/middleware/auth'

export const Route = createFileRoute('/dashboard/harvests')({
  component: HarvestsPage,
  server: {
    middleware: [authMiddleware],
  },
})

function HarvestsPage() {
  const queryClient = useQueryClient()
  const { data: harvests, isLoading } = useQuery(harvestsQueryOptions())
  const { data: crops } = useQuery(cropsQueryOptions())
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    cropId: '',
    harvestedOn: '',
    quantity: '',
    unit: '',
    season: '',
    qualityGrade: '',
    notes: '',
  })

  const addMutation = useMutation({
    mutationFn: addHarvest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['harvests'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      toast.success('🌾 Harvest recorded successfully')
      setOpen(false)
      setFormData({
        cropId: '',
        harvestedOn: '',
        quantity: '',
        unit: '',
        season: '',
        qualityGrade: '',
        notes: '',
      })
    },
    onError: (error) => {
      toast.error('Failed to record harvest')
      console.error('🔴 Add harvest error:', error)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteHarvest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['harvests'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      toast.success('🗑️ Harvest deleted')
    },
    onError: (error) => {
      toast.error('Failed to delete harvest')
      console.error('🔴 Delete harvest error:', error)
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    addMutation.mutate({
      data: {
        cropId: parseInt(formData.cropId),
        harvestedOn: formData.harvestedOn,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        season: formData.season,
        qualityGrade: formData.qualityGrade || undefined,
        notes: formData.notes || undefined,
      },
    })
  }

  // Calculate total quantity (grouped by unit would be better, but simple sum for now)
  const totalQuantity = harvests?.reduce((sum, h) => sum + h.quantity, 0) ?? 0

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Harvests</h1>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Crop</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Quality</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(4)].map((_, i) => (
                <TableRow key={i} className="animate-pulse">
                  <TableCell>
                    <div className="h-4 bg-muted rounded w-24" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-muted rounded w-20" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-muted rounded w-16" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-muted rounded w-24" />
                  </TableCell>
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
          <h1 className="text-2xl font-bold">Harvests</h1>
          <p className="text-muted-foreground">
            {harvests?.length ?? 0} harvest{harvests?.length !== 1 ? 's' : ''}{' '}
            recorded
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button disabled={!crops?.length}>
              Record Harvest
              <Plus className="h-4 w-4 ml-2" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Harvest</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cropId">Crop *</Label>
                <Select
                  value={formData.cropId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, cropId: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select crop" />
                  </SelectTrigger>
                  <SelectContent>
                    {crops?.map((crop) => (
                      <SelectItem key={crop.id} value={crop.id.toString()}>
                        {crop.name}
                        {crop.fieldName && ` (${crop.fieldName})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 500"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
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
                  <Label htmlFor="harvestedOn">Date *</Label>
                  <Input
                    id="harvestedOn"
                    type="date"
                    value={formData.harvestedOn}
                    onChange={(e) =>
                      setFormData({ ...formData, harvestedOn: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qualityGrade">
                    Quality{' '}
                    <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Select
                    value={formData.qualityGrade}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        qualityGrade: value === 'none' ? '' : value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {QUALITY_GRADES.map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  placeholder="Any details about this harvest"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={addMutation.isPending || !formData.cropId}
              >
                {addMutation.isPending ? 'Recording...' : 'Record Harvest'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!crops?.length ? (
        <div className="bg-white rounded-3xl p-8 text-center border-2 border-dashed border-gray-200">
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
            🌾
          </div>
          <p className="text-gray-500 font-medium">Add crops first.</p>
          <p className="text-sm text-gray-400 mt-1">
            You need to add crops before recording harvests.
          </p>
        </div>
      ) : harvests?.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border-2 border-dashed border-gray-200">
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
            🌾
          </div>
          <p className="text-gray-500 font-medium">No harvests yet.</p>
          <p className="text-sm text-gray-400 mt-1">
            Record your first harvest to start tracking yields.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Crop</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Quality</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {harvests?.map((harvest) => (
                <TableRow key={harvest.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                        <span className="text-base">🌾</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {harvest.cropName}
                        </p>
                        {harvest.fieldName && (
                          <span className="text-xs text-muted-foreground">
                            {harvest.fieldName}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-amber-700">
                      {formatNumber(harvest.quantity)} {harvest.unit}
                    </span>
                  </TableCell>
                  <TableCell>
                    {harvest.qualityGrade ? (
                      <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                        {harvest.qualityGrade}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {formatDate(harvest.harvestedOn)}
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
                          <AlertDialogTitle>Delete harvest?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this harvest record (
                            {harvest.quantity} {harvest.unit} of{' '}
                            {harvest.cropName})?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-white hover:bg-destructive/90"
                            onClick={() =>
                              deleteMutation.mutate({ data: harvest.id })
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
