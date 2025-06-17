import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { getAllWeeklySalesReports, getAllSalesReps } from "@/lib/db"
import { formatCurrency } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { sql } from "@/lib/db"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"

export const dynamic = "force-dynamic"

async function getWeeklyReportsSummary() {
  try {
    // Get summary metrics for all weekly reports
    const [summary] = await sql`
      SELECT 
        COUNT(*) as total_reports,
        SUM(new_clients_added) as total_clients_added,
        SUM(invoices_raised) as total_invoices_raised,
        SUM(cash_collected) as total_cash_collected
      FROM weekly_sales_reports
    `

    // Check if the sales_lead_generation table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'sales_lead_generation'
      ) as exists
    `

    let leadSummary = { total_commission: 0 }

    // Only fetch lead generation data if the table exists
    if (tableExists[0].exists) {
      try {
        const [leadData] = await sql`
          SELECT SUM(commission_amount) as total_commission
          FROM sales_lead_generation
        `
        if (leadData) {
          leadSummary = leadData
        }
      } catch (error) {
        console.error("Error fetching lead generation summary:", error)
      }
    }

    return {
      ...summary,
      total_commission: leadSummary.total_commission || 0,
    }
  } catch (error) {
    console.error("Error fetching weekly reports summary:", error)
    return {
      total_reports: 0,
      total_clients_added: 0,
      total_invoices_raised: 0,
      total_cash_collected: 0,
      total_commission: 0,
    }
  }
}

export default async function WeeklyReportsPage() {
  try {
    const [reports, salesReps, summary] = await Promise.all([
      getAllWeeklySalesReports(),
      getAllSalesReps(),
      getWeeklyReportsSummary(),
    ])

    // Create a map of sales rep IDs to names for easy lookup
    const salesRepMap = new Map(salesReps.map((rep) => [rep.id, rep.name]))

    return (
      <ProtectedRoute permission="reports:read">
        <div className="container mx-auto py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Weekly Sales Reports</h1>
            <ProtectedRoute permission="reports:write">
              <Link href="/weekly-reports/new">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Report
                </Button>
              </Link>
            </ProtectedRoute>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.total_reports}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">New Clients Added</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.total_clients_added}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Invoices Raised</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summary.total_invoices_raised)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Cash Collected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summary.total_cash_collected)}</div>
                {summary.total_commission > 0 && (
                  <p className="text-xs text-muted-foreground">
                    +{formatCurrency(summary.total_commission)} from commissions
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Week Starting</TableHead>
                  <TableHead>Sales Rep</TableHead>
                  <TableHead>New Clients</TableHead>
                  <TableHead>Invoices Raised</TableHead>
                  <TableHead>Cash Collected</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.length > 0 ? (
                  reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>{new Date(report.week_starting).toLocaleDateString()}</TableCell>
                      <TableCell>{salesRepMap.get(report.sales_rep_id) || "Unknown"}</TableCell>
                      <TableCell>{report.new_clients_added}</TableCell>
                      <TableCell>{formatCurrency(report.invoices_raised)}</TableCell>
                      <TableCell>{formatCurrency(report.cash_collected)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/weekly-reports/${report.id}`}>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </Link>
                          <ProtectedRoute permission="reports:write">
                            <Link href={`/weekly-reports/${report.id}/edit`}>
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                            </Link>
                          </ProtectedRoute>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No weekly reports found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </ProtectedRoute>
    )
  } catch (error) {
    console.error("Error in WeeklyReportsPage:", error)
    return (
      <ProtectedRoute permission="reports:read">
        <div className="container mx-auto py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Weekly Sales Reports</h1>
            <ProtectedRoute permission="reports:write">
              <Link href="/weekly-reports/new">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Report
                </Button>
              </Link>
            </ProtectedRoute>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
            <h2 className="text-xl font-medium text-red-600 mb-4">Error Loading Reports</h2>
            <p className="mb-4">There was an error loading the weekly reports. This might be due to database issues.</p>
            <Link href="/">
              <Button>Return to Dashboard</Button>
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    )
  }
}
