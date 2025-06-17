import Link from "next/link"
import { notFound } from "next/navigation"
import { getClientById, getStakeholdersByClientId, getSalesRepById } from "@/lib/db"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DeleteClientButton } from "@/components/delete-client-button"
import { StakeholderList } from "@/components/stakeholder-list"

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const clientId = Number.parseInt(params.id)

  if (isNaN(clientId)) {
    notFound()
  }

  const [client, stakeholders] = await Promise.all([getClientById(clientId), getStakeholdersByClientId(clientId)])

  if (!client) {
    notFound()
  }

  // Fetch account owner details if available
  let accountOwner = null
  if (client.account_owner_id) {
    accountOwner = await getSalesRepById(client.account_owner_id)
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{client.name}</h1>
            {client.client_type && <Badge variant="outline">{client.client_type}</Badge>}
          </div>
          {client.industry && <p className="text-muted-foreground">{client.industry}</p>}
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/clients/${client.id}/edit`}>Edit Client</Link>
          </Button>
          <DeleteClientButton id={client.id} name={client.name} accountOwnerId={client.account_owner_id || undefined} />
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList className="mb-4">
          <TabsTrigger value="details">Client Details</TabsTrigger>
          <TabsTrigger value="stakeholders">Stakeholders</TabsTrigger>
          <TabsTrigger value="deals">Deal Info</TabsTrigger>
          <TabsTrigger value="products">Product Details</TabsTrigger>
          <TabsTrigger value="post-sale">Post-Sale</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Website</h3>
                <p className="text-base">
                  {client.website ? (
                    <a
                      href={client.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {client.website}
                    </a>
                  ) : (
                    "Not provided"
                  )}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Company Size</h3>
                <p className="text-base">{client.company_size || "Not specified"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">HQ Location</h3>
                <p className="text-base">{client.hq_location || "Not specified"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">PAN/GST Number</h3>
                <p className="text-base">{client.pan_gst_number || "Not provided"}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stakeholders" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Stakeholders</CardTitle>
                <CardDescription>Key contacts at {client.name}</CardDescription>
              </div>
              <Button asChild size="sm">
                <Link href={`/clients/${client.id}/stakeholders/new`}>Add Stakeholder</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <StakeholderList stakeholders={stakeholders} clientId={client.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Funnel & Deal Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Lead Source</h3>
                <p className="text-base">{client.lead_source || "Not specified"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Account Owner</h3>
                <p className="text-base">
                  {accountOwner ? (
                    <Link href={`/sales-reps/${accountOwner.id}`} className="text-primary hover:underline">
                      {accountOwner.name}
                    </Link>
                  ) : (
                    "Not assigned"
                  )}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Current Sales Stage</h3>
                <p className="text-base">
                  {client.sales_stage ? <Badge className="mt-1">{client.sales_stage}</Badge> : "Not specified"}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Deal Value</h3>
                <p className="text-base">{client.deal_value ? formatCurrency(client.deal_value) : "Not specified"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Target Close Date</h3>
                <p className="text-base">
                  {client.target_close_date ? new Date(client.target_close_date).toLocaleDateString() : "Not specified"}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Probability to Close</h3>
                <p className="text-base">
                  {client.probability_to_close ? `${client.probability_to_close}%` : "Not specified"}
                </p>
              </div>

              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                <p className="text-base whitespace-pre-line">{client.notes || "No notes"}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product & Commercial Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-muted-foreground">Products Interested In</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  {client.products_interested && client.products_interested.length > 0 ? (
                    client.products_interested.map((product, index) => (
                      <Badge key={index} variant="secondary">
                        {product}
                      </Badge>
                    ))
                  ) : (
                    <p>None specified</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Pricing Model</h3>
                <p className="text-base">{client.pricing_model || "Not specified"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">T&C / Compliance Status</h3>
                <p className="text-base">{client.tc_compliance_status || "Not specified"}</p>
              </div>

              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-muted-foreground">Custom Requirements</h3>
                <p className="text-base whitespace-pre-line">{client.custom_requirements || "None specified"}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="post-sale" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Post-Sale Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Onboarding Status</h3>
                <p className="text-base">{client.onboarding_status || "Not specified"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">CSM Assigned</h3>
                <p className="text-base">{client.csm_assigned || "Not assigned"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Support Channels Enabled</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  {client.support_channels && client.support_channels.length > 0 ? (
                    client.support_channels.map((channel, index) => (
                      <Badge key={index} variant="outline">
                        {channel}
                      </Badge>
                    ))
                  ) : (
                    <p>None specified</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Renewal Date</h3>
                <p className="text-base">
                  {client.renewal_date ? new Date(client.renewal_date).toLocaleDateString() : "Not specified"}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
