import Link from "next/link"
import { sql } from "@/lib/db"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

async function getTopSalesReps() {
  try {
    const result = await sql`
      SELECT 
        sr.id, 
        sr.name, 
        SUM(wsr.cash_collected) as total_cash_collected
      FROM 
        sales_representatives sr
      JOIN 
        weekly_sales_reports wsr ON sr.id = wsr.sales_rep_id
      GROUP BY 
        sr.id, sr.name
      ORDER BY 
        total_cash_collected DESC
      LIMIT 5
    `
    return result
  } catch (error) {
    console.error("Error fetching top sales reps:", error)
    return []
  }
}

async function getTopProducts() {
  try {
    const result = await sql`
      SELECT 
        p.id, 
        p.name, 
        SUM(srp.units_sold) as total_units_sold,
        SUM(srp.revenue_generated) as total_revenue
      FROM 
        products p
      JOIN 
        sales_rep_products srp ON p.id = srp.product_id
      GROUP BY 
        p.id, p.name
      ORDER BY 
        total_revenue DESC
      LIMIT 5
    `
    return result
  } catch (error) {
    console.error("Error fetching top products:", error)
    return []
  }
}

async function getTopLeadGenerators() {
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
      SELECT 
        sr.id, 
        sr.name, 
        SUM(slg.leads_generated) as total_leads_generated,
        SUM(slg.leads_converted) as total_leads_converted,
        SUM(slg.value_of_converted_leads * slg.commission_percentage / 100) as total_commission
      FROM 
        sales_representatives sr
      JOIN 
        sales_lead_generation slg ON sr.id = slg.generator_id
      GROUP BY 
        sr.id, sr.name
      ORDER BY 
        total_commission DESC
      LIMIT 5
    `
    return result
  } catch (error) {
    console.error("Error fetching top lead generators:", error)
    return []
  }
}

async function getRecentWeeklyReports() {
  try {
    const result = await sql`
      SELECT 
        wsr.id, 
        wsr.week_starting, 
        sr.name as sales_rep_name,
        wsr.cash_collected,
        wsr.invoices_raised
      FROM 
        weekly_sales_reports wsr
      JOIN 
        sales_representatives sr ON wsr.sales_rep_id = sr.id
      ORDER BY 
        wsr.week_starting DESC
      LIMIT 5
    `
    return result
  } catch (error) {
    console.error("Error fetching recent weekly reports:", error)
    return []
  }
}

export default async function DashboardPage() {
  const [topSalesReps, topProducts, topLeadGenerators, recentWeeklyReports] = await Promise.all([
    getTopSalesReps(),
    getTopProducts(),
    getTopLeadGenerators(),
    getRecentWeeklyReports(),
  ])

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex space-x-2">
          <Button asChild>
            <Link href="/weekly-reports/new">New Weekly Report</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Sales Representatives</CardTitle>
            <CardDescription>Based on total cash collected</CardDescription>
          </CardHeader>
          <CardContent>
            {topSalesReps.length === 0 ? (
              <p className="text-center py-4 text-gray-500">No data available</p>
            ) : (
              <div className="space-y-4">
                {topSalesReps.map((rep) => (
                  <div key={rep.id} className="flex justify-between items-center">
                    <Link href={`/sales-reps/${rep.id}`} className="hover:underline">
                      {rep.name}
                    </Link>
                    <span className="font-medium">{formatCurrency(rep.total_cash_collected)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Based on total revenue generated</CardDescription>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-center py-4 text-gray-500">No data available</p>
            ) : (
              <div className="space-y-4">
                {topProducts.map((product) => (
                  <div key={product.id} className="flex justify-between items-center">
                    <Link href={`/products/${product.id}`} className="hover:underline">
                      {product.name}
                    </Link>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(product.total_revenue)}</div>
                      <div className="text-sm text-gray-500">{product.total_units_sold} units</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Lead Generators</CardTitle>
            <CardDescription>Based on total sales credit earned</CardDescription>
          </CardHeader>
          <CardContent>
            {topLeadGenerators.length === 0 ? (
              <p className="text-center py-4 text-gray-500">No data available</p>
            ) : (
              <div className="space-y-4">
                {topLeadGenerators.map((generator) => (
                  <div key={generator.id} className="flex justify-between items-center">
                    <Link href={`/sales-reps/${generator.id}`} className="hover:underline">
                      {generator.name}
                    </Link>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(generator.total_commission)}</div>
                      <div className="text-sm text-gray-500">
                        {generator.total_leads_converted} / {generator.total_leads_generated} leads
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Weekly Reports</CardTitle>
            <CardDescription>Latest submitted reports</CardDescription>
          </CardHeader>
          <CardContent>
            {recentWeeklyReports.length === 0 ? (
              <p className="text-center py-4 text-gray-500">No data available</p>
            ) : (
              <div className="space-y-4">
                {recentWeeklyReports.map((report) => (
                  <div key={report.id} className="flex justify-between items-center">
                    <div>
                      <Link href={`/weekly-reports/${report.id}`} className="hover:underline">
                        {new Date(report.week_starting).toLocaleDateString()}
                      </Link>
                      <div className="text-sm text-gray-500">{report.sales_rep_name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(report.cash_collected)}</div>
                      <div className="text-sm text-gray-500">{formatCurrency(report.invoices_raised)} invoiced</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
