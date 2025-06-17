"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { updateLeadGenerationData } from "@/lib/actions"

const formSchema = z.object({
  leads_generated: z.coerce.number().int().min(0, {
    message: "Leads generated must be a positive number.",
  }),
  leads_converted: z.coerce.number().int().min(0, {
    message: "Leads converted must be a positive number.",
  }),
  value_of_converted_leads: z.coerce.number().min(0, {
    message: "Value of converted leads must be a positive number.",
  }),
  commission_percentage: z.coerce
    .number()
    .min(0, {
      message: "Sales credit percentage must be a positive number.",
    })
    .max(100, {
      message: "Sales credit percentage cannot exceed 100%.",
    }),
})

export function EditLeadGenerationForm({
  leadGeneration,
  onSuccess,
}: {
  leadGeneration: any
  onSuccess?: () => void
}) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      leads_generated: leadGeneration.leads_generated,
      leads_converted: leadGeneration.leads_converted,
      value_of_converted_leads: leadGeneration.value_of_converted_leads,
      commission_percentage: leadGeneration.commission_percentage,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      await updateLeadGenerationData(
        leadGeneration.id,
        values.leads_generated,
        values.leads_converted,
        values.value_of_converted_leads,
        values.commission_percentage,
      )
      router.refresh()
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error updating lead generation data:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="leads_generated"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Leads Generated</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormDescription>Number of leads generated.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="leads_converted"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Leads Converted</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormDescription>Number of leads that converted to sales.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="value_of_converted_leads"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Value of Converted Leads</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormDescription>Total value of converted leads.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="commission_percentage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sales Credit Percentage</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormDescription>Percentage of sales credit the generator receives (0-100%).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Updating..." : "Update Lead Generation Data"}
        </Button>
      </form>
    </Form>
  )
}
