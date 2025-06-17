"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { addClient } from "@/lib/actions"
import type { SalesRepresentative } from "@/lib/db"

// Define the form schema with Zod
const clientFormSchema = z.object({
  // Client Information
  name: z.string().min(1, "Client name is required"),
  client_type: z.enum(["Strategic", "Growth", "Volume", "Partner", "Other"]).optional(),
  industry: z.string().optional().nullable(),
  website: z.string().url("Please enter a valid URL").optional().nullable(),
  company_size: z.enum(["1-10", "11-50", "51-200", "201-1000", "1000+"]).optional().nullable(),
  hq_location: z.string().optional().nullable(),
  pan_gst_number: z.string().optional().nullable(),

  // Sales funnel & deal info
  lead_source: z
    .enum(["Inbound", "Outbound", "Referral", "Event", "LinkedIn", "Channel Partner"])
    .optional()
    .nullable(),
  account_owner_id: z.number().optional().nullable(),
  sales_stage: z.enum(["Lead", "Qualified", "Demo", "Proposal Sent", "Negotiation", "Closed"]).optional().nullable(),
  deal_value: z.number().optional().nullable(),
  target_close_date: z.date().optional().nullable(),
  probability_to_close: z.number().min(0).max(100).optional().nullable(),
  notes: z.string().optional().nullable(),

  // Product & commercial details
  products_interested: z.array(z.string()).optional().nullable(),
  pricing_model: z.enum(["Flat Fee", "Commission %", "Per API Call", "Per Seat"]).optional().nullable(),
  custom_requirements: z.string().optional().nullable(),
  tc_compliance_status: z.enum(["Not started", "In Progress", "Approved"]).optional().nullable(),

  // Post-sale info
  onboarding_status: z.enum(["Not Started", "In Progress", "Live"]).optional().nullable(),
  csm_assigned: z.string().optional().nullable(),
  support_channels: z.array(z.string()).optional().nullable(),
  renewal_date: z.date().optional().nullable(),
})

type ClientFormValues = z.infer<typeof clientFormSchema>

// Product options for multi-select
const productOptions = [
  { id: "Group Health", label: "Group Health" },
  { id: "Motor", label: "Motor" },
  { id: "WhatsApp Insurance", label: "WhatsApp Insurance" },
  { id: "Cyber", label: "Cyber" },
  { id: "Others", label: "Others" },
]

// Support channel options for checkboxes
const supportChannelOptions = [
  { id: "Email", label: "Email" },
  { id: "Phone", label: "Phone" },
  { id: "WhatsApp", label: "WhatsApp" },
]

export function AddClientForm({ salesReps }: { salesReps: SalesRepresentative[] }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize the form with default values
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: "",
      client_type: undefined,
      industry: "",
      website: "",
      company_size: undefined,
      hq_location: "",
      pan_gst_number: "",

      lead_source: undefined,
      account_owner_id: undefined,
      sales_stage: "Lead", // Default to Lead
      deal_value: undefined,
      target_close_date: undefined,
      probability_to_close: 0,
      notes: "",

      products_interested: [],
      pricing_model: undefined,
      custom_requirements: "",
      tc_compliance_status: "Not started", // Default to Not started

      onboarding_status: "Not Started", // Default to Not Started
      csm_assigned: "",
      support_channels: [],
      renewal_date: undefined,
    },
  })

  async function onSubmit(data: ClientFormValues) {
    setIsSubmitting(true)

    try {
      // Convert form data to match the expected format
      const clientData = {
        ...data,
        // Convert Date objects to ISO strings for the database
        target_close_date: data.target_close_date ? data.target_close_date.toISOString().split("T")[0] : null,
        renewal_date: data.renewal_date ? data.renewal_date.toISOString().split("T")[0] : null,
      }

      const result = await addClient(clientData)

      if (result.success) {
        router.push(`/clients/${result.data.id}`)
      } else {
        console.error("Failed to add client:", result.error)
        // Handle error (could show a toast notification)
      }
    } catch (error) {
      console.error("Error adding client:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Tabs defaultValue="client-info" className="w-full">
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="client-info">Client Information</TabsTrigger>
            <TabsTrigger value="stakeholders">Stakeholder Details</TabsTrigger>
            <TabsTrigger value="sales-funnel">Sales Funnel</TabsTrigger>
            <TabsTrigger value="product-details">Product Details</TabsTrigger>
            <TabsTrigger value="post-sale">Post-Sale Info</TabsTrigger>
          </TabsList>

          {/* Client Information Tab */}
          <TabsContent value="client-info">
            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
                <CardDescription>Enter the basic information about the client</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter client name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="client_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select client type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Strategic">Strategic</SelectItem>
                            <SelectItem value="Growth">Growth</SelectItem>
                            <SelectItem value="Volume">Volume</SelectItem>
                            <SelectItem value="Partner">Partner</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Healthcare, Finance" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="company_size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Size</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select company size" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1-10">1-10</SelectItem>
                            <SelectItem value="11-50">11-50</SelectItem>
                            <SelectItem value="51-200">51-200</SelectItem>
                            <SelectItem value="201-1000">201-1000</SelectItem>
                            <SelectItem value="1000+">1000+</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hq_location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>HQ Location</FormLabel>
                        <FormControl>
                          <Input placeholder="City, State, Country" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="pan_gst_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PAN / GST Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter PAN or GST number" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stakeholder Details Tab */}
          <TabsContent value="stakeholders">
            <Card>
              <CardHeader>
                <CardTitle>Stakeholder Details</CardTitle>
                <CardDescription>You can add stakeholders after creating the client</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Stakeholders can be added after the client record is created. Please complete the client creation
                  process first.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sales Funnel Tab */}
          <TabsContent value="sales-funnel">
            <Card>
              <CardHeader>
                <CardTitle>Sales Funnel & Deal Information</CardTitle>
                <CardDescription>Enter details about the sales process</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="lead_source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lead Source</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select lead source" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Inbound">Inbound</SelectItem>
                            <SelectItem value="Outbound">Outbound</SelectItem>
                            <SelectItem value="Referral">Referral</SelectItem>
                            <SelectItem value="Event">Event</SelectItem>
                            <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                            <SelectItem value="Channel Partner">Channel Partner</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="account_owner_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Owner</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                              >
                                {field.value
                                  ? salesReps.find((rep) => rep.id === field.value)?.name
                                  : "Select account owner"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[200px] p-0">
                            <Command>
                              <CommandInput placeholder="Search sales rep..." />
                              <CommandList>
                                <CommandEmpty>No sales rep found.</CommandEmpty>
                                <CommandGroup>
                                  {salesReps.map((rep) => (
                                    <CommandItem
                                      key={rep.id}
                                      value={rep.name}
                                      onSelect={() => {
                                        form.setValue("account_owner_id", rep.id)
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          rep.id === field.value ? "opacity-100" : "opacity-0",
                                        )}
                                      />
                                      {rep.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sales_stage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Sales Stage</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select sales stage" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Lead">Lead</SelectItem>
                            <SelectItem value="Qualified">Qualified</SelectItem>
                            <SelectItem value="Demo">Demo</SelectItem>
                            <SelectItem value="Proposal Sent">Proposal Sent</SelectItem>
                            <SelectItem value="Negotiation">Negotiation</SelectItem>
                            <SelectItem value="Closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deal_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deal Value</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter amount"
                            {...field}
                            value={field.value === undefined ? "" : field.value}
                            onChange={(e) => {
                              const value = e.target.value === "" ? undefined : Number(e.target.value)
                              field.onChange(value)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="target_close_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Target Close Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground",
                                )}
                              >
                                {field.value ? field.value.toLocaleDateString() : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="probability_to_close"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Probability to Close (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter percentage"
                            min={0}
                            max={100}
                            {...field}
                            value={field.value === undefined ? "" : field.value}
                            onChange={(e) => {
                              const value = e.target.value === "" ? undefined : Number(e.target.value)
                              field.onChange(value)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter any additional notes about the deal"
                          className="min-h-[100px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Product Details Tab */}
          <TabsContent value="product-details">
            <Card>
              <CardHeader>
                <CardTitle>Product & Commercial Details</CardTitle>
                <CardDescription>Enter details about products and commercial terms</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="products_interested"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel>Products Interested In</FormLabel>
                        <FormDescription>Select all products the client is interested in</FormDescription>
                      </div>
                      {productOptions.map((product) => (
                        <FormField
                          key={product.id}
                          control={form.control}
                          name="products_interested"
                          render={({ field }) => {
                            return (
                              <FormItem key={product.id} className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(product.id)}
                                    onCheckedChange={(checked) => {
                                      const currentValue = field.value || []
                                      return checked
                                        ? field.onChange([...currentValue, product.id])
                                        : field.onChange(currentValue.filter((value) => value !== product.id))
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">{product.label}</FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="pricing_model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pricing Model</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select pricing model" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Flat Fee">Flat Fee</SelectItem>
                            <SelectItem value="Commission %">Commission %</SelectItem>
                            <SelectItem value="Per API Call">Per API Call</SelectItem>
                            <SelectItem value="Per Seat">Per Seat</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tc_compliance_status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>T&C / Compliance Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Not started">Not started</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Approved">Approved</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="custom_requirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Requirements</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter any custom requirements or specifications"
                          className="min-h-[100px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Post-Sale Info Tab */}
          <TabsContent value="post-sale">
            <Card>
              <CardHeader>
                <CardTitle>Post-Sale Information</CardTitle>
                <CardDescription>Enter details for after the sale is closed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="onboarding_status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Onboarding Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Not Started">Not Started</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Live">Live</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="csm_assigned"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CSM Assigned</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter CSM name" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="support_channels"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel>Support Channels Enabled</FormLabel>
                        <FormDescription>Select all support channels that will be available</FormDescription>
                      </div>
                      {supportChannelOptions.map((channel) => (
                        <FormField
                          key={channel.id}
                          control={form.control}
                          name="support_channels"
                          render={({ field }) => {
                            return (
                              <FormItem key={channel.id} className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(channel.id)}
                                    onCheckedChange={(checked) => {
                                      const currentValue = field.value || []
                                      return checked
                                        ? field.onChange([...currentValue, channel.id])
                                        : field.onChange(currentValue.filter((value) => value !== channel.id))
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">{channel.label}</FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="renewal_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Renewal Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value ? field.value.toLocaleDateString() : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.push("/clients")} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Client"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
