"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { updateSalesRep } from "@/lib/actions"
import { FileUpload } from "./file-upload"
import type { SalesRepresentative } from "@/lib/db"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().optional(),
  hire_date: z.string().min(1, {
    message: "Please select a hire date.",
  }),
  target_amount: z.string().optional(),
})

interface EditSalesRepFormProps {
  salesRep: SalesRepresentative
}

export function EditSalesRepForm({ salesRep }: EditSalesRepFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: salesRep.name,
      email: salesRep.email,
      phone: salesRep.phone || "",
      hire_date: new Date(salesRep.hire_date).toISOString().split("T")[0],
      target_amount: salesRep.target_amount ? salesRep.target_amount.toString() : "",
    },
  })

  const handleFileUpload = (file: File) => {
    setImageFile(file)
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      const targetAmount = values.target_amount ? Number.parseFloat(values.target_amount) : null

      // For now, we'll just use a placeholder URL for the image or keep the existing one
      // In a real app, you would upload the image to a storage service
      const imageUrl = imageFile ? URL.createObjectURL(imageFile) : salesRep.image_url

      await updateSalesRep(
        salesRep.id,
        values.name,
        values.email,
        values.phone || null,
        values.hire_date,
        targetAmount,
        imageUrl,
      )

      router.push(`/sales-reps/${salesRep.id}`)
      router.refresh()
    } catch (error) {
      console.error("Error updating sales rep:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john.doe@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone (optional)</FormLabel>
              <FormControl>
                <Input placeholder="(555) 123-4567" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hire_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hire Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="target_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target Amount (optional)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="50000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FileUpload
          onUpload={handleFileUpload}
          label="Profile Image (optional)"
          defaultPreview={salesRep.image_url || undefined}
        />

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.push(`/sales-reps/${salesRep.id}`)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Update Sales Rep"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
