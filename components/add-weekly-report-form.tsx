"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { addWeeklySalesReport, addLeadGenerationData, addSalesRepProduct } from "@/lib/actions"
import type { SalesRepresentative } from "@/lib/db"
import { getStartOfWeek } from "@/lib/utils"
import { PlusCircle, Trash2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

const formSchema = z.object({
  sales_rep_id: z.string().min(1, {
    message: "Please select a sales representative.",
  }),
  week_starting: z.string().min(1, {
    message: "Please select a week starting date.",
  }),
  new_clients_targeted: z.string().min(0),
  new_clients_added: z.string().min(0),
  value_of_new_clients: z.string().min(0),
  invoices_raised: z.string().min(0),
  cash_collected: z.string().min(0),
  key_wins: z.string().optional(),
  blockers: z.string().optional(),
  action_items: z.string().optional(),
  lead_generation: z
    .array(
      z.object({
        recipient_id: z.string().min(1, { message: "Please select a recipient" }),
        leads_generated: z.string().min(0),
        leads_converted: z.string().min(0),
        value_of_converted_leads: z.string().min(0),
        commission_percentage: z.string().min(0),
      }),
    )
    .optional(),
  product_sales: z
    .array(
      z.object({
        product_id: z.string().min(1, { message: "Please select a product" }),
        units_sold: z.string().min(0),
        revenue_generated: z.string().min(0),
      }),
    )
    .optional(),
})

interface AddWeeklyReportFormProps {
  salesReps: SalesRepresentative[]
  products?: any[] // Add this line
}

export function AddWeeklyReportForm({ salesReps, products }: AddWeeklyReportFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("direct-sales")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sales_rep_id: "",
      week_starting: getStartOfWeek(new Date()).toISOString().split("T")[0],
      new_clients_targeted: "0",
      new_clients_added: "0",
      value_of_new_clients: "0",
      invoices_raised: "0",
      cash_collected: "0",
      key_wins: "",
      blockers: "",
      action_items: "",
      lead_generation: [],
      product_sales: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lead_generation",
  })

  // Add this after the lead generation fieldArray
  const {
    fields: productFields,
    append: appendProduct,
    remove: removeProduct,
  } = useFieldArray({
    control: form.control,
    name: "product_sales",
  })

  const selectedSalesRepId = form.watch("sales_rep_id")

  // Filter out the selected sales rep from the recipients dropdown
  const availableRecipients = salesReps.filter((rep) => rep.id.toString() !== selectedSalesRepId)

  const addLeadGenerationField = () => {
    append({
      recipient_id: "",
      leads_generated: "0",
      leads_converted: "0",
      value_of_converted_leads: "0",
      commission_percentage: "10", // Default commission percentage
    })

    // Switch to the lead generation tab
    setActiveTab("lead-generation")
  }

  const addProductSaleField = () => {
    appendProduct({
      product_id: "",
      units_sold: "1",
      revenue_generated: "0",
    })

    // Switch to the product sales tab
    setActiveTab("product-sales")
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    setError(null)

    try {
      // First, add the weekly sales report
      const reportResult = await addWeeklySalesReport(
        Number.parseInt(values.sales_rep_id),
        values.week_starting,
        Number.parseInt(values.new_clients_targeted) || 0,
        Number.parseInt(values.new_clients_added) || 0,
        Number.parseFloat(values.value_of_new_clients) || 0,
        Number.parseFloat(values.invoices_raised) || 0,
        Number.parseFloat(values.cash_collected) || 0,
        values.key_wins || null,
        values.blockers || null,
        values.action_items || null,
      )

      if (!reportResult.success) {
        setError(reportResult.error || "Failed to add weekly report")
        return
      }

      // If we have lead generation data, add it
      if (values.lead_generation && values.lead_generation.length > 0 && reportResult.data) {
        const weeklyReportId = reportResult.data.id
        const generatorId = Number.parseInt(values.sales_rep_id)

        // Add each lead generation entry
        for (const leadGen of values.lead_generation) {
          if (leadGen.recipient_id) {
            await addLeadGenerationData(
              weeklyReportId,
              generatorId,
              Number.parseInt(leadGen.recipient_id),
              Number.parseInt(leadGen.leads_generated) || 0,
              Number.parseInt(leadGen.leads_converted) || 0,
              Number.parseFloat(leadGen.value_of_converted_leads) || 0,
              Number.parseFloat(leadGen.commission_percentage) || 0,
            )
          }
        }
      }

      // If we have product sales data, add it
      if (values.product_sales && values.product_sales.length > 0 && reportResult.data) {
        const weeklyReportId = reportResult.data.id
        const salesRepId = Number.parseInt(values.sales_rep_id)

        // Add each product sale entry
        for (const sale of values.product_sales) {
          if (sale.product_id) {
            await addSalesRepProduct(
              salesRepId,
              Number.parseInt(sale.product_id),
              Number.parseInt(sale.units_sold) || 1,
              Number.parseFloat(sale.revenue_generated) || 0,
              values.week_starting,
            )
          }
        }
      }

      router.push("/weekly-reports")
      router.refresh()
    } catch (error) {
      console.error("Error adding weekly report:", error)
      setError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="sales_rep_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sales Representative</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a sales representative" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {salesReps.map((rep) => (
                      <SelectItem key={rep.id} value={rep.id.toString()}>
                        {rep.name}
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
            name="week_starting"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Week Starting</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="direct-sales">Direct Sales</TabsTrigger>
            <TabsTrigger value="lead-generation">Lead Generation</TabsTrigger>
            <TabsTrigger value="product-sales">Product Sales</TabsTrigger>
          </TabsList>

          <TabsContent value="direct-sales" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="new_clients_targeted"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Clients Targeted</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="value_of_new_clients"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value of New Clients (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="invoices_raised"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoices Raised (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cash_collected"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cash Collected (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="key_wins"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Key Wins</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter key wins for the week"
                      className="resize-none min-h-[100px]"
                      {...field}
                    />
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
                      placeholder="Enter any blockers or challenges faced"
                      className="resize-none min-h-[100px]"
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
                      placeholder="Enter action items for the next week"
                      className="resize-none min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="lead-generation" className="space-y-6">
            {selectedSalesRepId ? (
              <>
                {fields.length === 0 ? (
                  <div className="text-center py-8 bg-muted rounded-lg">
                    <p className="text-muted-foreground mb-4">No lead generation data added yet</p>
                    <Button type="button" onClick={addLeadGenerationField} className="flex items-center gap-2">
                      <PlusCircle className="h-4 w-4" />
                      Add Lead Generation
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {fields.map((field, index) => (
                      <Card key={field.id} className="relative">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Lead Generation #{index + 1}</CardTitle>
                          <CardDescription>Record leads generated for another sales representative</CardDescription>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 text-destructive"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <FormField
                            control={form.control}
                            name={`lead_generation.${index}.recipient_id`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Recipient Sales Rep</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select recipient sales rep" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {availableRecipients.map((rep) => (
                                      <SelectItem key={rep.id} value={rep.id.toString()}>
                                        {rep.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`lead_generation.${index}.leads_generated`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Leads Generated</FormLabel>
                                  <FormControl>
                                    <Input type="number" min="0" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`lead_generation.${index}.leads_converted`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Leads Converted</FormLabel>
                                  <FormControl>
                                    <Input type="number" min="0" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`lead_generation.${index}.value_of_converted_leads`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Value of Converted Leads (₹)</FormLabel>
                                  <FormControl>
                                    <Input type="number" min="0" step="0.01" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`lead_generation.${index}.commission_percentage`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Commission Percentage (%)</FormLabel>
                                  <FormControl>
                                    <Input type="number" min="0" max="100" step="0.01" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={addLeadGenerationField}
                      className="flex items-center gap-2"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Add Another Recipient
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 bg-muted rounded-lg">
                <p className="text-muted-foreground">Please select a sales representative first</p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="product-sales">
            {selectedSalesRepId ? (
              <>
                {productFields.length === 0 ? (
                  <div className="text-center py-8 bg-muted rounded-lg">
                    <p className="text-muted-foreground mb-4">No product sales added yet</p>
                    <Button type="button" onClick={addProductSaleField} className="flex items-center gap-2">
                      <PlusCircle className="h-4 w-4" />
                      Add Product Sale
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {productFields.map((field, index) => (
                      <Card key={field.id} className="relative">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Product Sale #{index + 1}</CardTitle>
                          <CardDescription>Record product sales for this reporting period</CardDescription>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 text-destructive"
                            onClick={() => removeProduct(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <FormField
                            control={form.control}
                            name={`product_sales.${index}.product_id`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Product</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a product" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {products &&
                                      products.map((product) => (
                                        <SelectItem key={product.id} value={product.id.toString()}>
                                          {product.name} (
                                          {typeof product.price === "number"
                                            ? formatCurrency(product.price)
                                            : product.price}
                                          )
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`product_sales.${index}.units_sold`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Units Sold</FormLabel>
                                  <FormControl>
                                    <Input type="number" min="1" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`product_sales.${index}.revenue_generated`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Revenue Generated (₹)</FormLabel>
                                  <FormControl>
                                    <Input type="number" min="0" step="0.01" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={addProductSaleField}
                      className="flex items-center gap-2"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Add Another Product
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 bg-muted rounded-lg">
                <p className="text-muted-foreground">Please select a sales representative first</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {error && <div className="bg-destructive/10 text-destructive p-3 rounded-md">{error}</div>}

        <div className="flex justify-between gap-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={addLeadGenerationField}
              disabled={!selectedSalesRepId}
              className="flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Add Lead Generation
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={addProductSaleField}
              disabled={!selectedSalesRepId}
              className="flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Add Product Sale
            </Button>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => router.push("/weekly-reports")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Report"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}
