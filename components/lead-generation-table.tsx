import Link from "next/link"
import { notFound } from "next/navigation"
import { formatCurrency, formatDate, formatPercentage } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DeleteWeeklyReportButton } from "@/components/delete-weekly-report-button"
import { ProductSalesTable } from "@/components/product-sales-table"
import { sql } from "@/lib/db"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface LeadGeneration {
  id: number
  weekly_report_id: number
  recipient_id: number
  leads_generated: number
  leads_converted: number
  value_of_converted_leads: number
  commission_percentage: number
}

interface SalesRep {
  id: number
  name: string
}

interface LeadGenerationTableProps {
  leadGeneration: LeadGeneration[]
  salesReps: SalesRep[]
  canEdit?: boolean
}

export function LeadGenerationTable({ leadGeneration, salesReps, canEdit = false }: LeadGenerationTableProps) {
  if (!leadGeneration || leadGeneration.length === 0) {
    return <div className="text-center py-4 text-gray-500">No lead generation data available</div>
  }

  // Function to get sales rep name by ID
  const getSalesRepName = (id: number) => {
    const rep = salesReps.find((rep) => rep.id === id)
    return rep ? rep.name : "Unknown"
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sales Rep</TableHead>
            <TableHead className="text-right">Leads Generated</TableHead>
            <TableHead className="text-right">Leads Converted</TableHead>
            <TableHead className="text-right">Conversion Rate</TableHead>
            <TableHead className="text-right">Value</TableHead>
            <TableHead className="text-right">Sales Credit %</TableHead>
            <TableHead className="text-right">Sales Credit Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leadGeneration.map((item) => {
            const conversionRate = item.leads_generated > 0 ? item.leads_converted / item.leads_generated : 0
            const commissionValue = (item.value_of_converted_leads * item.commission_percentage) / 100

            return (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{getSalesRepName(item.recipient_id)}</TableCell>
                <TableCell className="text-right">{item.leads_generated}</TableCell>
                <TableCell className="text-right">{item.leads_converted}</TableCell>
                <TableCell className="text-right">{formatPercentage(conversionRate)}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.value_of_converted_leads)}</TableCell>
                <TableCell className="text-right">{item.commission_percentage}%</TableCell>
                <TableCell className="text-right">{formatCurrency(commissionValue)}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

async function getWeeklyReportById(id: string) {
  try {
    const result = await sql`
      SELECT 
        wsr.*,
        sr.name as sales_rep_name
      FROM 
        weekly_sales_reports wsr
      JOIN 
        sales_representatives sr ON wsr.sales_rep_id = sr.id
      WHERE 
        wsr.id = ${id}
    `

    if (result.length === 0) {
      return null
    }

    return result[0]
  } catch (error) {
    console.error("Error fetching weekly report:", error)
    return null
  }
}

async function getLeadGenerationByWeeklyReportId(weekly_report_id: number) {
  try {
    // Check if the sales_lead_generation table exists
    const tableExistsResult = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'sales_lead_generation'
      ) as exists
    `

    const tableExists = tableExistsResult[0]?.exists || false

    if (!tableExists) {
      return []
    }

    const result = await sql`
      SELECT * FROM sales_lead_generation 
      WHERE weekly_report_id = ${weekly_report_id}
      ORDER BY recipient_id ASC
    `
    return result
  } catch (error) {
    console.error("Error fetching lead generation data:", error)
    return []
  }
}

async function getAllSalesReps() {
  try {
    const result = await sql`
      SELECT * FROM sales_representatives ORDER BY name ASC
    `
    return result
  } catch (error) {
    console.error("Error fetching sales reps:", error)
    return []
  }
}

async function getProductSalesByWeeklyReport(report) {
  try {
    if (!report || !report.sales_rep_id || !report.week_starting) {
      return []
    }

    const result = await sql`
      SELECT 
        srp.*,
        p.name as product_name,
        p.price as product_price
      FROM 
        sales_rep_products srp
      JOIN 
        products p ON srp.product_id = p.id
      WHERE 
        srp.sales_rep_id = ${report.sales_rep_id}
        AND srp.sale_date = ${report.week_starting}
      ORDER BY 
        p.name ASC
    `
    return result
  } catch (error) {
    console.error("Error fetching product sales:", error)
    return []
  }
}

export default async function WeeklyReportDetailPage({ params }: { params: { id: string } }) {
  const report = await getWeeklyReportById(params.id)

  if (!report) {
    notFound()
  }

  const [leadGeneration, salesReps, productSales] = await Promise.all([
    getLeadGenerationByWeeklyReportId(report.id),
    getAllSalesReps(),
    getProductSalesByWeeklyReport(report),
  ])

  // Calculate total lead generation metrics
  const totalLeadsGenerated = leadGeneration.reduce((sum, item) => sum + item.leads_generated, 0)
  const totalLeadsConverted = leadGeneration.reduce((sum, item) => sum + item.leads_converted, 0)
  const totalValueOfConvertedLeads = leadGeneration.reduce((sum, item) => sum + item.value_of_converted_leads, 0)
  const totalCommissionValue = leadGeneration.reduce(
    (sum, item) => sum + (item.value_of_converted_leads * item.commission_percentage) / 100,
    0,
  )

  // Calculate total product sales metrics
  const totalUnitsSold = productSales.reduce((sum, item) => sum + item.units_sold, 0)
  const totalRevenueGenerated = productSales.reduce((sum, item) => sum + item.revenue_generated, 0)

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Weekly Sales Report</h1>
          <p className="text-gray-500">
            {formatDate(report.week_starting)} - {report.sales_rep_name}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button asChild variant="outline">
            <Link href={`/weekly-reports/${report.id}/edit`}>Edit Report</Link>
          </Button>
          <DeleteWeeklyReportButton id={report.id} salesRepId={report.sales_rep_id} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>New Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{report.new_clients_added}</div>
            <div className="text-sm text-gray-500">
              of {report.new_clients_targeted} targeted (
              {formatPercentage(report.new_clients_added / report.new_clients_targeted)})
            </div>
            <div className="mt-2">
              <div className="text-sm font-medium">Value: {formatCurrency(report.value_of_new_clients)}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Invoices Raised</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(report.invoices_raised)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Cash Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(report.cash_collected)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Product Sales</CardTitle>
            <CardDescription>Products sold during this week</CardDescription>
          </CardHeader>
          <CardContent>
            <ProductSalesTable productSales={productSales} canEdit={false} />
            <div className="mt-4 text-right">
              <div className="text-sm font-medium">Total Units: {totalUnitsSold}</div>
              <div className="text-lg font-bold">Total Revenue: {formatCurrency(totalRevenueGenerated)}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead Generation</CardTitle>
            <CardDescription>Leads generated and received during this week</CardDescription>
          </CardHeader>
          <CardContent>
            <LeadGenerationTable leadGeneration={leadGeneration} salesReps={salesReps} canEdit={false} />
            <div className="mt-4 text-right">
              <div className="text-sm font-medium">
                Total Leads: {totalLeadsConverted} / {totalLeadsGenerated} converted
              </div>
              <div className="text-sm font-medium">Total Value: {formatCurrency(totalValueOfConvertedLeads)}</div>
              <div className="text-lg font-bold">Total Sales Credit: {formatCurrency(totalCommissionValue)}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-1">Key Wins</h3>
                <p className="whitespace-pre-line">{report.key_wins || "None"}</p>
              </div>
              <div>
                <h3 className="font-medium">Key Challenges</h3>
                <p className="whitespace-pre-line">{report.key_challenges || "None"}</p>
              </div>
              <div>
                <h3 className="font-medium">Next Week Focus</h3>
                <p className="whitespace-pre-line">{report.next_week_focus || "None"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
