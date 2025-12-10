import { createFileRoute } from '@tanstack/react-router'
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { fieldsQueryOptions, addField, deleteField } from '@/utils/fields'
import { Card, CardContent } from '@/components/ui/card'
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
import { MapPin, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { authMiddleware } from '@/middleware/auth'

export const Route = createFileRoute('/dashboard/fields')({
  component: FieldsPage,
  server: {
    middleware: [authMiddleware],
  },
})

function FieldsPage() {
  const queryClient = useQueryClient()
  const { data: fields } = useSuspenseQuery(fieldsQueryOptions())
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    areaHa: '',
    location: '',
    season: '',
    notes: '',
  })

  const addMutation = useMutation({
    mutationFn: addField,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fields'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      toast.success('🌾 Field added successfully')
      setOpen(false)
      setFormData({ name: '', areaHa: '', location: '', season: '', notes: '' })
    },
    onError: (error) => {
      toast.error('Failed to add field')
      console.error('🔴 Add field error:', error)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteField,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fields'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      toast.success('🗑️ Field deleted')
    },
    onError: (error) => {
      toast.error('Failed to delete field')
      console.error('🔴 Delete field error:', error)
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    addMutation.mutate({
      data: {
        name: formData.name,
        areaHa: formData.areaHa ? parseFloat(formData.areaHa) : undefined,
        location: formData.location || undefined,
        season: formData.season,
        notes: formData.notes || undefined,
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fields</h1>
          <p className="text-muted-foreground">
            {fields?.length ?? 0} field{fields?.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              Add Field
              <Plus className="h-4 w-4 ml-2" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Field</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Field Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., North Plot"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="areaHa">Area (hectares)</Label>
                  <Input
                    id="areaHa"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 2.5"
                    value={formData.areaHa}
                    onChange={(e) =>
                      setFormData({ ...formData, areaHa: e.target.value })
                    }
                  />
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., Village name or GPS"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
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
                disabled={addMutation.isPending}
              >
                {addMutation.isPending ? 'Adding...' : 'Add Field'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {fields?.length === 0 ? (
        <Card className="py-12 shadow-none">
          <CardContent className="text-center text-muted-foreground py-0">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No fields yet. Add your first field to get started!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {fields?.map((field) => (
            <Card key={field.id} className="py-4 shadow-none">
              <CardContent className="py-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{field.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {field.areaHa ? `${field.areaHa} ha` : 'No size set'}
                      {field.location && ` • ${field.location}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {field.season}
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete field?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{field.name}"? This
                          will also delete all crops, harvests, and sales linked
                          to this field.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-white hover:bg-destructive/90"
                          onClick={() =>
                            deleteMutation.mutate({ data: field.id })
                          }
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
