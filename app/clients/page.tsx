import Link from "next/link"
import { getAllClients, getClientStatisticsSafe } from "@/lib/db"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"

export const dynamic = "force-dynamic"

export default async function ClientsPage() {
  let clients = []
  let statistics = null

  try {
    // Use the safe version that handles missing columns
    clients = await getAllClients()
    statistics = await getClientStatisticsSafe()
  } catch (error) {
    console.error("Error fetching clients:", error)
    // Continue with empty data rather than failing
  }

  const getStageBadgeColor = (stage: string | null) => {
    switch (stage) {
      case "Lead":
        return "bg-gray-200 text-gray-800"
      case "Qualified":
        return "bg-blue-200 text-blue-800"
      case "Demo":
        return "bg-indigo-200 text-indigo-800"
      case "Proposal Sent":
        return "bg-purple-200 text-purple-800"
      case "Negotiation":
        return "bg-amber-200 text-amber-800"
      case "Closed":
        return "bg-green-200 text-green-800"
      default:
        return "bg-gray-200 text-gray-800"
    }
  }

  return (
    <ProtectedRoute permission="clients:read">
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Clients</h1>
          <ProtectedRoute permission="clients:write">
            <Button asChild>
              <Link href="/clients/new">Add New Client</Link>
            </Button>
          </ProtectedRoute>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics?.total_clients || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics?.total_clients ? statistics.total_clients - (statistics.closed_count || 0) : 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Closed Deals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics?.closed_count || 0}</div>
              <p className="text-xs text-muted-foreground">{formatCurrency(statistics?.closed_value || 0)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Weighted Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(statistics?.weighted_pipeline || 0)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Client List */}
        <Card>
          <CardHeader>
            <CardTitle>All Clients</CardTitle>
            <CardDescription>Manage your client relationships</CardDescription>
          </CardHeader>
          <CardContent>
            {clients.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No clients found. Add your first client to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Client Name</th>
                      <th className="text-left py-3 px-4">Type</th>
                      <th className="text-left py-3 px-4">Industry</th>
                      <th className="text-left py-3 px-4">Sales Stage</th>
                      <th className="text-left py-3 px-4">Deal Value</th>
                      <th className="text-left py-3 px-4">Target Close</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((client) => (
                      <tr key={client.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <Link href={`/clients/${client.id}`} className="font-medium hover:underline">
                            {client.name}
                          </Link>
                        </td>
                        <td className="py-3 px-4">{client.client_type || "-"}</td>
                        <td className="py-3 px-4">{client.industry || "-"}</td>
                        <td className="py-3 px-4">
                          {client.sales_stage ? (
                            <Badge className={getStageBadgeColor(client.sales_stage)}>{client.sales_stage}</Badge>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="py-3 px-4">{client.deal_value ? formatCurrency(client.deal_value) : "-"}</td>
                        <td className="py-3 px-4">
                          {client.target_close_date ? new Date(client.target_close_date).toLocaleDateString() : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
