"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addSalesRepProduct } from "@/lib/actions"
import type { Product } from "@/lib/db"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const formSchema = z.object({
  product_id: z.string().min(1, {
    message: "Please select a product.",
  }),
  units_sold: z.string().min(1, {
    message: "Please enter the number of units sold.",
  }),
  revenue_generated: z.string().min(1, {
    message: "Please enter the revenue generated.",
  }),
  sale_date: z.date({
    required_error: "Please select a sale date.",
  }),
})

interface AddSalesRepProductFormProps {
  salesRepId: number
  products: Product[]
  onSuccess?: () => void
}

export function AddSalesRepProductForm({ salesRepId, products, onSuccess }: AddSalesRepProductFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      product_id: "",
      units_sold: "",
      revenue_generated: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      const productId = Number.parseInt(values.product_id)
      const unitsSold = Number.parseInt(values.units_sold)
      const revenueGenerated = Number.parseFloat(values.revenue_generated)
      const saleDate = format(values.sale_date, "yyyy-MM-dd")

      const result = await addSalesRepProduct(salesRepId, productId, unitsSold, revenueGenerated, saleDate)

      if (result.success) {
        form.reset()
        router.refresh()
        if (onSuccess) {
          onSuccess()
        }
      } else {
        console.error("Error adding sales rep product:", result.error)
      }
    } catch (error) {
      console.error("Error adding sales rep product:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate revenue based on product price and units sold
  const calculateRevenue = () => {
    const productId = form.watch("product_id")
    const unitsSold = form.watch("units_sold")

    if (productId && unitsSold) {
      const product = products.find((p) => p.id.toString() === productId)
      if (product && typeof product.price === "number") {
        const revenue = product.price * Number.parseInt(unitsSold)
        form.setValue("revenue_generated", revenue.toString())
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="product_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value)
                  // Calculate revenue when product changes
                  setTimeout(calculateRevenue, 0)
                }}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name} (${typeof product.price === "number" ? product.price.toFixed(2) : product.price})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="units_sold"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Units Sold</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  placeholder="Enter units sold"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e)
                    // Calculate revenue when units sold changes
                    setTimeout(calculateRevenue, 0)
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="revenue_generated"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Revenue Generated</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sale_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Sale Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                    >
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Add Product Sale"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
