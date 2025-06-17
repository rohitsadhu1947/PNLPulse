"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  addLeadGenerationData,
  updateLeadGenerationData,
  deleteLeadGenerationData,
  updateWeeklySalesReport,
  addWeeklyReportProductAction,
  updateWeeklyReportProductAction,
  deleteWeeklyReportProductAction,
} from "@/lib/actions"
import { toast } from "@/components/ui/use-toast"
import { Trash2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

// Define the form schema for weekly report
const weeklyReportFormSchema = z.object({
  new_clients_targeted: z.coerce.number().min(0, "Must be a positive number"),
  new_clients_added: z.coerce.number().min(0, "Must be a positive number"),
  value_of_new_clients: z.coerce.number().min(0, "Must be a positive number"),
  invoices_raised: z.coerce.number().min(0, "Must be a positive number"),
  cash_collected: z.coerce.number().min(0, "Must be a positive number"),
  key_wins: z.string().optional(),
  blockers: z.string().optional(),
  action_items: z.string().optional(),
})

// Define the form schema for lead generation
const leadGenerationFormSchema = z.object({
  recipient_id: z.coerce.number().min(1, "Please select a recipient"),
  leads_generated: z.coerce.number().min(0, "Must be a positive number"),
  leads_converted: z.coerce.number().min(0, "Must be a positive number"),
  value_of_converted_leads: z.coerce.number().min(0, "Must be a positive number"),
  commission_percentage: z.coerce.number().min(0, "Must be a positive number").max(100, "Cannot exceed 100%"),
})

// Define the form schema for product sales
const productSaleFormSchema = z.object({
  product_id: z.coerce.number().min(1, "Please select a product"),
  units_sold: z.coerce.number().min(1, "Must be at least 1"),
  revenue_generated: z.coerce.number().min(0, "Must be a positive number"),
})

type WeeklyReportFormValues = z.infer<typeof weeklyReportFormSchema>
type LeadGenerationFormValues = z.infer<typeof leadGenerationFormSchema>
type ProductSaleFormValues = z.infer<typeof productSaleFormSchema>

interface EditWeeklyReportFormProps {
  report: any
  salesReps: any[]
  leadGeneration: any[]
  products?: any[]
  productSales?: any[]
}

export function EditWeeklyReportForm({
  report,
  salesReps,
  leadGeneration = [],
  products = [],
  productSales = [],
}: EditWeeklyReportFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [leadGenerationItems, setLeadGenerationItems] = useState<any[]>(leadGeneration || [])
  const [showLeadGenerationForm, setShowLeadGenerationForm] = useState(false)
  const [editingLeadId, setEditingLeadId] = useState<number | null>(null)

  // Log the product sales data
  console.log("Product sales data:", productSales)

  const [productSalesItems, setProductSalesItems] = useState<any[]>(productSales || [])
  const [showProductSaleForm, setShowProductSaleForm] = useState(false)
  const [editingProductId, setEditingProductId] = useState<number | null>(null)

  // Create form for weekly report
  const form = useForm<WeeklyReportFormValues>({
    resolver: zodResolver(weeklyReportFormSchema),
    defaultValues: {
      new_clients_targeted: report.new_clients_targeted || 0,
      new_clients_added: report.new_clients_added || 0,
      value_of_new_clients: report.value_of_new_clients || 0,
      invoices_raised: report.invoices_raised || 0,
      cash_collected: report.cash_collected || 0,
      key_wins: report.key_wins || "",
      blockers: report.blockers || "",
      action_items: report.action_items || "",
    },
  })

  // Create form for lead generation
  const leadGenerationForm = useForm<LeadGenerationFormValues>({
    resolver: zodResolver(leadGenerationFormSchema),
    defaultValues: {
      recipient_id: 0,
      leads_generated: 0,
      leads_converted: 0,
      value_of_converted_leads: 0,
      commission_percentage: 10, // Default commission percentage
    },
  })

  // Create form for product sales
  const productSaleForm = useForm<ProductSaleFormValues>({
    resolver: zodResolver(productSaleFormSchema),
    defaultValues: {
      product_id: 0,
      units_sold: 1,
      revenue_generated: 0,
    },
  })

  // Reset lead generation form when editing a lead
  useEffect(() => {
    if (editingLeadId !== null) {
      const leadToEdit = leadGenerationItems.find((lead) => lead.id === editingLeadId)
      if (leadToEdit) {
        leadGenerationForm.reset({
          recipient_id: leadToEdit.recipient_id,
          leads_generated: leadToEdit.leads_generated,
          leads_converted: leadToEdit.leads_converted,
          value_of_converted_leads: leadToEdit.value_of_converted_leads,
          commission_percentage: leadToEdit.commission_percentage,
        })
      }
    } else {
      leadGenerationForm.reset({
        recipient_id: 0,
        leads_generated: 0,
        leads_converted: 0,
        value_of_converted_leads: 0,
        commission_percentage: 10,
      })
    }
  }, [editingLeadId, leadGenerationItems, leadGenerationForm])

  // Reset product sale form when editing a product
  useEffect(() => {
    if (editingProductId !== null) {
      const productToEdit = productSalesItems.find((product) => product.id === editingProductId)
      if (productToEdit) {
        productSaleForm.reset({
          product_id: productToEdit.product_id,
          units_sold: productToEdit.units_sold,
          revenue_generated: productToEdit.revenue_generated,
        })
      }
    } else {
      productSaleForm.reset({
        product_id: 0,
        units_sold: 1,
        revenue_generated: 0,
      })
    }
  }, [editingProductId, productSalesItems, productSaleForm])

  // Handle weekly report form submission
  async function onSubmit(data: WeeklyReportFormValues) {
    try {
      setIsSubmitting(true)

      // Update the weekly report
      await updateWeeklySalesReport(
        report.id,
        data.new_clients_targeted,
        data.new_clients_added,
        data.value_of_new_clients,
        data.invoices_raised,
        data.cash_collected,
        data.key_wins || null,
        data.blockers || null,
        data.action_items || null,
      )

      toast({
        title: "Weekly report updated",
        description: "Your weekly report has been updated successfully.",
      })

      // Redirect to the weekly report detail page
      router.push(`/weekly-reports/${report.id}`)
      router.refresh()
    } catch (error) {
      console.error("Error updating weekly report:", error)
      toast({
        title: "Error",
        description: "There was an error updating the weekly report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle lead generation form submission
  async function onLeadGenerationSubmit(data: LeadGenerationFormValues) {
    try {
      if (editingLeadId !== null) {
        // Update existing lead generation
        const updatedLead = await updateLeadGenerationData(
          editingLeadId,
          data.leads_generated,
          data.leads_converted,
          data.value_of_converted_leads,
          data.commission_percentage,
        )

        // Update the lead generation items
        setLeadGenerationItems((prev) => prev.map((lead) => (lead.id === editingLeadId ? updatedLead : lead)))

        toast({
          title: "Lead generation updated",
          description: "The lead generation data has been updated successfully.",
        })
      } else {
        // Add new lead generation
        const newLead = await addLeadGenerationData(
          report.id,
          report.sales_rep_id,
          data.recipient_id,
          data.leads_generated,
          data.leads_converted,
          data.value_of_converted_leads,
          data.commission_percentage,
        )

        // Add the new lead to the list
        setLeadGenerationItems((prev) => [...prev, newLead])

        toast({
          title: "Lead generation added",
          description: "The lead generation data has been added successfully.",
        })
      }

      // Reset the form and hide it
      leadGenerationForm.reset()
      setShowLeadGenerationForm(false)
      setEditingLeadId(null)

      // Refresh the router to update the UI
      router.refresh()
    } catch (error) {
      console.error("Error handling lead generation:", error)
      toast({
        title: "Error",
        description: "There was an error processing the lead generation data. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle product sale form submission
  async function onProductSaleSubmit(data: ProductSaleFormValues) {
    try {
      if (editingProductId !== null) {
        // Update existing product sale
        const result = await updateWeeklyReportProductAction(
          editingProductId,
          data.units_sold,
          data.revenue_generated,
          report.id,
        )

        if (result.success) {
          // Update the product sales items
          setProductSalesItems((prev) =>
            prev.map((product) => (product.id === editingProductId ? result.data : product)),
          )

          toast({
            title: "Product sale updated",
            description: "The product sale data has been updated successfully.",
          })
        } else {
          throw new Error(result.error || "Failed to update product sale")
        }
      } else {
        // Add new product sale
        const result = await addWeeklyReportProductAction(
          report.id,
          data.product_id,
          data.units_sold,
          data.revenue_generated,
        )

        if (result.success) {
          // Add the new product to the list
          setProductSalesItems((prev) => [...prev, result.data])

          toast({
            title: "Product sale added",
            description: "The product sale data has been added successfully.",
          })
        } else {
          throw new Error(result.error || "Failed to add product sale")
        }
      }

      // Reset the form and hide it
      productSaleForm.reset()
      setShowProductSaleForm(false)
      setEditingProductId(null)

      // Refresh the router to update the UI
      router.refresh()
    } catch (error) {
      console.error("Error handling product sale:", error)
      toast({
        title: "Error",
        description: "There was an error processing the product sale data. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle deleting a lead generation item
  async function handleDeleteLead(leadId: number) {
    try {
      await deleteLeadGenerationData(leadId)

      // Remove the lead from the list
      setLeadGenerationItems((prev) => prev.filter((lead) => lead.id !== leadId))

      toast({
        title: "Lead generation deleted",
        description: "The lead generation data has been deleted successfully.",
      })

      // Refresh the router to update the UI
      router.refresh()
    } catch (error) {
      console.error("Error deleting lead generation:", error)
      toast({
        title: "Error",
        description: "There was an error deleting the lead generation data. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle deleting a product sale item
  async function handleDeleteProduct(productId: number) {
    try {
      const result = await deleteWeeklyReportProductAction(productId, report.id)

      if (result.success) {
        // Remove the product from the list
        setProductSalesItems((prev) => prev.filter((product) => product.id !== productId))

        toast({
          title: "Product sale deleted",
          description: "The product sale data has been deleted successfully.",
        })

        // Refresh the router to update the UI
        router.refresh()
      } else {
        throw new Error(result.error || "Failed to delete product sale")
      }
    } catch (error) {
      console.error("Error deleting product sale:", error)
      toast({
        title: "Error",
        description: "There was an error deleting the product sale data. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Get the recipient name for a lead
  function getRecipientName(recipientId: number) {
    const recipient = salesReps.find((rep) => rep.id === recipientId)
    return recipient ? recipient.name : "Unknown"
  }

  // Get the product name and price
  function getProductDetails(productId: number) {
    const product = products.find((p) => p.id === productId)
    return product ? { name: product.name, price: product.price } : { name: "Unknown", price: 0 }
  }

  // Calculate commission amount
  function calculateCommission(valueOfConvertedLeads: number, commissionPercentage: number) {
    return (valueOfConvertedLeads * commissionPercentage) / 100
  }

  // Calculate revenue based on product price and units sold
  function calculateRevenue(productId: number, unitsSold: number) {
    const product = products.find((p) => p.id === productId)
    if (product && typeof product.price === "number") {
      return product.price * unitsSold
    }
    return 0
  }

  // Update revenue when product or units change
  const watchProductId = productSaleForm.watch("product_id")
  const watchUnitsSold = productSaleForm.watch("units_sold")

  useEffect(() => {
    if (watchProductId && watchUnitsSold) {
      const revenue = calculateRevenue(watchProductId, watchUnitsSold)
      productSaleForm.setValue("revenue_generated", revenue)
    }
  }, [watchProductId, watchUnitsSold, productSaleForm])

  return (
    <div className="space-y-6">
      <Tabs defaultValue="direct-sales" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="direct-sales">Direct Sales</TabsTrigger>
          <TabsTrigger value="lead-generation">Lead Generation</TabsTrigger>
          <TabsTrigger value="product-sales">Product Sales</TabsTrigger>
        </TabsList>

        <TabsContent value="direct-sales">
          <Card>
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Client Acquisition</h3>

                      <FormField
                        control={form.control}
                        name="new_clients_targeted"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Clients Targeted</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} />
                            </FormControl>
                            <FormDescription>Number of new clients targeted this week</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="new_clients_added"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Clients Added</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} />
                            </FormControl>
                            <FormDescription>Number of new clients added this week</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="value_of_new_clients"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Value of New Clients</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" step="0.01" {...field} />
                            </FormControl>
                            <FormDescription>Total value of new clients added this week</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Financial</h3>

                      <FormField
                        control={form.control}
                        name="invoices_raised"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Invoices Raised</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" step="0.01" {...field} />
                            </FormControl>
                            <FormDescription>Total value of invoices raised this week</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="cash_collected"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cash Collected</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" step="0.01" {...field} />
                            </FormControl>
                            <FormDescription>Total cash collected this week</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Notes</h3>

                    <FormField
                      control={form.control}
                      name="key_wins"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Key Wins</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter key wins for this week" className="min-h-[100px]" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="blockers"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Blockers</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter any blockers or challenges faced this week"
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="action_items"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Action Items for Next Week</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter action items for next week"
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Updating..." : "Update Report"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lead-generation">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Lead Generation</h3>
                  {!showLeadGenerationForm && (
                    <Button onClick={() => setShowLeadGenerationForm(true)}>Add Lead Generation</Button>
                  )}
                </div>

                {showLeadGenerationForm && (
                  <Card className="border-dashed border-2 border-primary/50">
                    <CardContent className="pt-6">
                      <Form {...leadGenerationForm}>
                        <form onSubmit={leadGenerationForm.handleSubmit(onLeadGenerationSubmit)} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={leadGenerationForm.control}
                              name="recipient_id"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Recipient Sales Rep</FormLabel>
                                  <Select
                                    onValueChange={(value) => field.onChange(Number(value))}
                                    defaultValue={field.value.toString()}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select a sales rep" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {salesReps
                                        .filter((rep) => rep.id !== report.sales_rep_id) // Exclude the current sales rep
                                        .map((rep) => (
                                          <SelectItem key={rep.id} value={rep.id.toString()}>
                                            {rep.name}
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                  <FormDescription>The sales rep who received the leads</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={leadGenerationForm.control}
                              name="leads_generated"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Leads Generated</FormLabel>
                                  <FormControl>
                                    <Input type="number" min="0" {...field} />
                                  </FormControl>
                                  <FormDescription>Number of leads generated for this sales rep</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={leadGenerationForm.control}
                              name="leads_converted"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Leads Converted</FormLabel>
                                  <FormControl>
                                    <Input type="number" min="0" {...field} />
                                  </FormControl>
                                  <FormDescription>Number of leads that were converted to clients</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={leadGenerationForm.control}
                              name="value_of_converted_leads"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Value of Converted Leads</FormLabel>
                                  <FormControl>
                                    <Input type="number" min="0" step="0.01" {...field} />
                                  </FormControl>
                                  <FormDescription>Total value of the converted leads</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={leadGenerationForm.control}
                              name="commission_percentage"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Commission Percentage</FormLabel>
                                  <FormControl>
                                    <Input type="number" min="0" max="100" step="0.1" {...field} />
                                  </FormControl>
                                  <FormDescription>Percentage of the value you receive as commission</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setShowLeadGenerationForm(false)
                                setEditingLeadId(null)
                                leadGenerationForm.reset()
                              }}
                            >
                              Cancel
                            </Button>
                            <Button type="submit">{editingLeadId !== null ? "Update" : "Add"} Lead Generation</Button>
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                )}

                {leadGenerationItems.length > 0 ? (
                  <div className="space-y-4">
                    {leadGenerationItems.map((lead) => (
                      <Card key={lead.id} className="overflow-hidden">
                        <CardContent className="p-0">
                          <div className="p-4 bg-primary/5 flex justify-between items-center">
                            <h4 className="font-medium">Lead Generation for {getRecipientName(lead.recipient_id)}</h4>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingLeadId(lead.id)
                                  setShowLeadGenerationForm(true)
                                }}
                              >
                                Edit
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteLead(lead.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="p-4 grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Leads Generated</p>
                              <p className="font-medium">{lead.leads_generated}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Leads Converted</p>
                              <p className="font-medium">{lead.leads_converted}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Value of Converted Leads</p>
                              <p className="font-medium">{formatCurrency(lead.value_of_converted_leads)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Commission %</p>
                              <p className="font-medium">{lead.commission_percentage}%</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Commission Amount</p>
                              <p className="font-medium text-green-600">
                                {formatCurrency(
                                  calculateCommission(lead.value_of_converted_leads, lead.commission_percentage),
                                )}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-muted rounded-lg">
                    <h2 className="text-xl font-medium mb-2">No lead generation data</h2>
                    <p className="text-muted-foreground mb-4">
                      Add lead generation data for other sales representatives
                    </p>
                    {!showLeadGenerationForm && (
                      <Button onClick={() => setShowLeadGenerationForm(true)}>Add Lead Generation</Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="product-sales">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Product Sales</h3>
                  {!showProductSaleForm && (
                    <Button onClick={() => setShowProductSaleForm(true)}>Add Product Sale</Button>
                  )}
                </div>

                {showProductSaleForm && (
                  <Card className="border-dashed border-2 border-primary/50">
                    <CardContent className="pt-6">
                      <Form {...productSaleForm}>
                        <form onSubmit={productSaleForm.handleSubmit(onProductSaleSubmit)} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                              control={productSaleForm.control}
                              name="product_id"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Product</FormLabel>
                                  <Select
                                    onValueChange={(value) => field.onChange(Number(value))}
                                    defaultValue={field.value.toString()}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select a product" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {products.map((product) => (
                                        <SelectItem key={product.id} value={product.id.toString()}>
                                          {product.name} ({formatCurrency(product.price)})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormDescription>Select the product that was sold</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={productSaleForm.control}
                              name="units_sold"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Units Sold</FormLabel>
                                  <FormControl>
                                    <Input type="number" min="1" {...field} />
                                  </FormControl>
                                  <FormDescription>Number of units sold</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={productSaleForm.control}
                              name="revenue_generated"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Revenue Generated</FormLabel>
                                  <FormControl>
                                    <Input type="number" min="0" step="0.01" {...field} />
                                  </FormControl>
                                  <FormDescription>Total revenue from this sale</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setShowProductSaleForm(false)
                                setEditingProductId(null)
                                productSaleForm.reset()
                              }}
                            >
                              Cancel
                            </Button>
                            <Button type="submit">{editingProductId !== null ? "Update" : "Add"} Product Sale</Button>
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                )}

                {productSalesItems.length > 0 ? (
                  <div className="space-y-4">
                    {productSalesItems.map((product) => (
                      <Card key={product.id} className="overflow-hidden">
                        <CardContent className="p-0">
                          <div className="p-4 bg-primary/5 flex justify-between items-center">
                            <h4 className="font-medium">{product.product_name || "Unknown Product"}</h4>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingProductId(product.id)
                                  setShowProductSaleForm(true)
                                }}
                              >
                                Edit
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteProduct(product.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Units Sold</p>
                              <p className="font-medium">{product.units_sold}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Unit Price</p>
                              <p className="font-medium">{formatCurrency(product.product_price || 0)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Revenue Generated</p>
                              <p className="font-medium">{formatCurrency(product.revenue_generated)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-muted rounded-lg">
                    <h2 className="text-xl font-medium mb-2">No product sales data</h2>
                    <p className="text-muted-foreground mb-4">Record product sales for this reporting period</p>
                    {!showProductSaleForm && (
                      <Button onClick={() => setShowProductSaleForm(true)}>Add Product Sale</Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
