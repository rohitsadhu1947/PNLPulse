"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addStakeholder } from "@/lib/actions"

// Define the form schema with Zod
const stakeholderFormSchema = z.object({
  name: z.string().min(1, "Stakeholder name is required"),
  email: z.string().email("Please enter a valid email").optional().nullable(),
  phone: z.string().optional().nullable(),
  designation: z.string().optional().nullable(),
  decision_role: z.enum(["Decision Maker", "Influencer", "Gatekeeper", "User"]).optional().nullable(),
  relationship_status: z.enum(["Cold", "Engaged", "Advocate"]).optional().nullable(),
})

type StakeholderFormValues = z.infer<typeof stakeholderFormSchema>

export function AddStakeholderForm({
  clientId,
  clientName,
}: {
  clientId: number
  clientName: string
}) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize the form with default values
  const form = useForm<StakeholderFormValues>({
    resolver: zodResolver(stakeholderFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      designation: "",
      decision_role: undefined,
      relationship_status: "Cold", // Default to Cold
    },
  })

  async function onSubmit(data: StakeholderFormValues) {
    setIsSubmitting(true)

    try {
      // Add client_id to the data
      const stakeholderData = {
        ...data,
        client_id: clientId,
      }

      const result = await addStakeholder(stakeholderData)

      if (result.success) {
        router.push(`/clients/${clientId}?tab=stakeholders`)
      } else {
        console.error("Failed to add stakeholder:", result.error)
        // Handle error (could show a toast notification)
      }
    } catch (error) {
      console.error("Error adding stakeholder:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Stakeholder Details</CardTitle>
            <CardDescription>Add a new contact person for {clientName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter stakeholder name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter email address" {...field} value={field.value || ""} />
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
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="designation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Designation</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. CEO, CTO, Manager" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="decision_role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role in Decision</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Decision Maker">Decision Maker</SelectItem>
                        <SelectItem value="Influencer">Influencer</SelectItem>
                        <SelectItem value="Gatekeeper">Gatekeeper</SelectItem>
                        <SelectItem value="User">User</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="relationship_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relationship Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Cold">Cold</SelectItem>
                        <SelectItem value="Engaged">Engaged</SelectItem>
                        <SelectItem value="Advocate">Advocate</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/clients/${clientId}?tab=stakeholders`)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Stakeholder"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
