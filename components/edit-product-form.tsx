"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { updateProduct } from "@/lib/actions"
import type { Product } from "@/lib/db"
import { toast } from "@/components/ui/use-toast"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  price: z.string().min(1, {
    message: "Please enter a price.",
  }),
})

interface EditProductFormProps {
  product: Product
}

export function EditProductForm({ product }: EditProductFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    setError(null)

    try {
      const price = Number.parseFloat(values.price)

      // Simplify the update by only sending text fields
      const result = await updateProduct(
        product.id,
        values.name,
        values.description || null,
        price,
        null, // Don't send image_url at all
      )

      if (result?.success) {
        toast({
          title: "Product updated",
          description: "The product has been updated successfully.",
        })

        router.push(`/products/${product.id}`)
        router.refresh()
      } else {
        throw new Error("Update returned unsuccessful result")
      }
    } catch (err) {
      console.error("Error updating product:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")

      toast({
        title: "Error",
        description: "There was an error updating the product. Please try again.",
        variant: "destructive",
      })
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
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter product name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter product description" className="resize-none min-h-[100px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {error && <div className="bg-destructive/10 text-destructive p-3 rounded-md">{error}</div>}

        <div className="space-y-2">
          <FormLabel>Product Image</FormLabel>
          <p className="text-sm text-muted-foreground mb-2">
            Image updates are disabled in this version to troubleshoot the update functionality.
          </p>
          {product.image_url && (
            <div className="relative w-40 h-40 border rounded-md overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.image_url || "/placeholder.svg"}
                alt={product.name}
                className="object-cover w-full h-full"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.push(`/products/${product.id}`)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Update Product"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
