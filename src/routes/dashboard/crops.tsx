import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cropsQueryOptions, addCrop, deleteCrop } from '@/utils/crops'
import { fieldsQueryOptions } from '@/utils/fields'
import { Card, CardContent } from '@/components/ui/card' // still used for empty states
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
import { Leaf, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { formatDate } from '@/utils/format'
import { authMiddleware } from '@/middleware/auth'

export const Route = createFileRoute('/dashboard/crops')({
  component: CropsPage,
  server: {
    middleware: [authMiddleware],
  },
})

function CropsPage() {
  const queryClient = useQueryClient()
  const { data: crops, isLoading } = useQuery(cropsQueryOptions())
  const { data: fields } = useQuery(fieldsQueryOptions())
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    fieldId: '',
    variety: '',
    season: '',
    plantingDate: '',
    expectedHarvestDate: '',
    notes: '',
  })

  const addMutation = useMutation({
    mutationFn: addCrop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crops'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      toast.success('🌱 Crop added successfully')
      setOpen(false)
      setFormData({
        name: '',
        fieldId: '',
        variety: '',
        season: '',
        plantingDate: '',
        expectedHarvestDate: '',
        notes: '',
      })
    },
    onError: (error) => {
      toast.error('Failed to add crop')
      console.error('🔴 Add crop error:', error)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCrop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crops'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      toast.success('🗑️ Crop deleted')
    },
    onError: (error) => {
      toast.error('Failed to delete crop')
      console.error('🔴 Delete crop error:', error)
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    addMutation.mutate({
      data: {
        name: formData.name,
        fieldId: parseInt(formData.fieldId),
        variety: formData.variety || undefined,
        season: formData.season,
        plantingDate: formData.plantingDate || undefined,
        expectedHarvestDate: formData.expectedHarvestDate || undefined,
        notes: formData.notes || undefined,
      },
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Crops</h1>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 animate-pulse"
            >
              <div className="w-12 h-12 rounded-2xl bg-muted shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-24" />
                <div className="h-3 bg-muted rounded w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Crops</h1>
          <p className="text-muted-foreground">
            {crops?.length ?? 0} crop{crops?.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button disabled={!fields?.length}>
              Add Crop
              <Plus className="h-4 w-4 ml-2" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Crop</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Crop Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Maize"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fieldId">Field *</Label>
                  <Select
                    value={formData.fieldId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, fieldId: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      {fields?.map((field) => (
                        <SelectItem key={field.id} value={field.id.toString()}>
                          {field.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="variety">Variety</Label>
                  <Input
                    id="variety"
                    placeholder="e.g., H614"
                    value={formData.variety}
                    onChange={(e) =>
                      setFormData({ ...formData, variety: e.target.value })
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plantingDate">Planting Date</Label>
                  <Input
                    id="plantingDate"
                    type="date"
                    value={formData.plantingDate}
                    onChange={(e) =>
                      setFormData({ ...formData, plantingDate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expectedHarvestDate">Expected Harvest</Label>
                  <Input
                    id="expectedHarvestDate"
                    type="date"
                    value={formData.expectedHarvestDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        expectedHarvestDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  placeholder="Any additional notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={addMutation.isPending || !formData.fieldId}
              >
                {addMutation.isPending ? 'Adding...' : 'Add Crop'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!fields?.length ? (
        <Card className="py-12 shadow-none">
          <CardContent className="text-center text-muted-foreground py-0">
            <Leaf className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Add a field first before adding crops.</p>
          </CardContent>
        </Card>
      ) : crops?.length === 0 ? (
        <Card className="py-12 shadow-none">
          <CardContent className="text-center text-muted-foreground py-0">
            <Leaf className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No crops yet. Add your first crop to get started!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {crops?.map((crop) => (
            <div
              key={crop.id}
              className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 text-xl shadow-inner">
                  🌱
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{crop.name}</h4>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {crop.variety && (
                      <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                        {crop.variety}
                      </span>
                    )}
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                      {crop.fieldName ?? 'Unknown'}
                    </span>
                    {crop.plantingDate && (
                      <span className="text-xs text-gray-400">
                        {formatDate(crop.plantingDate)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{crop.season}</p>
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-destructive shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete crop?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{crop.name}"? This will
                      also delete all harvests and sales linked to this crop.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-white hover:bg-destructive/90"
                      onClick={() => deleteMutation.mutate({ data: crop.id })}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

