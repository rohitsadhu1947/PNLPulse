import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import { sql } from "@/lib/db"
import { Badge } from "@/components/ui/badge"

async function getTopPerformers() {
  try {
    // Check if the sales_lead_generation table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'sales_lead_generation'
      ) as exists
    `

    let topSales

    if (tableExists[0].exists) {
      // If the table exists, include lead generation data
      topSales = await sql`
        WITH rep_metrics AS (
          SELECT 
            sr.id,
            sr.name,
            SUM(wsr.cash_collected) as total_sales,
            SUM(wsr.new_clients_added) as clients_added,
            COUNT(DISTINCT wsr.id) as reports_count
          FROM sales_representatives sr
          JOIN weekly_sales_reports wsr ON sr.id = wsr.sales_rep_id
          WHERE wsr.week_starting >= NOW() - INTERVAL '90 days'
          GROUP BY sr.id, sr.name
        ),
        lead_metrics AS (
          SELECT 
            generator_id,
            SUM(commission_amount) as total_commission,
            SUM(leads_generated) as leads_generated,
            SUM(leads_converted) as leads_converted
          FROM sales_lead_generation
          WHERE created_at >= NOW() - INTERVAL '90 days'
          GROUP BY generator_id
        )
        SELECT 
          rm.id,
          rm.name,
          rm.total_sales,
          rm.clients_added,
          COALESCE(lm.total_commission, 0) as total_commission,
          COALESCE(lm.leads_generated, 0) as leads_generated,
          COALESCE(lm.leads_converted, 0) as leads_converted,
          (rm.total_sales + COALESCE(lm.total_commission, 0)) as total_revenue
        FROM rep_metrics rm
        LEFT JOIN lead_metrics lm ON rm.id = lm.generator_id
        ORDER BY total_revenue DESC
        LIMIT 5
      `
    } else {
      // If the table doesn't exist, only include sales data
      topSales = await sql`
        SELECT 
          sr.id,
          sr.name,
          SUM(wsr.cash_collected) as total_sales,
          SUM(wsr.new_clients_added) as clients_added,
          COUNT(DISTINCT wsr.id) as reports_count,
          0 as total_commission,
          0 as leads_generated,
          0 as leads_converted,
          SUM(wsr.cash_collected) as total_revenue
        FROM sales_representatives sr
        JOIN weekly_sales_reports wsr ON sr.id = wsr.sales_rep_id
        WHERE wsr.week_starting >= NOW() - INTERVAL '90 days'
        GROUP BY sr.id, sr.name
        ORDER BY total_revenue DESC
        LIMIT 5
      `
    }

    return topSales || []
  } catch (error) {
    console.error("Error fetching top performers:", error)
    return []
  }
}

export default async function TopPerformersTable() {
  const topPerformers = await getTopPerformers()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Sales Representative</TableHead>
          <TableHead>Direct Sales</TableHead>
          <TableHead>Commission</TableHead>
          <TableHead>Total Revenue</TableHead>
          <TableHead>Clients Added</TableHead>
          <TableHead>Lead Conversion</TableHead>
          <TableHead>Performance</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {topPerformers.map((performer) => {
          const leadConversionRate =
            performer.leads_generated > 0 ? (performer.leads_converted / performer.leads_generated) * 100 : 0

          // Calculate performance rating
          let performanceRating
          const totalRevenue = performer.total_revenue

          if (totalRevenue > 1000000) {
            performanceRating = { label: "Exceptional", color: "bg-green-500" }
          } else if (totalRevenue > 500000) {
            performanceRating = { label: "Excellent", color: "bg-emerald-500" }
          } else if (totalRevenue > 250000) {
            performanceRating = { label: "Good", color: "bg-blue-500" }
          } else if (totalRevenue > 100000) {
            performanceRating = { label: "Average", color: "bg-yellow-500" }
          } else {
            performanceRating = { label: "Needs Improvement", color: "bg-red-500" }
          }

          return (
            <TableRow key={performer.id}>
              <TableCell className="font-medium">{performer.name}</TableCell>
              <TableCell>{formatCurrency(performer.total_sales)}</TableCell>
              <TableCell>{formatCurrency(performer.total_commission)}</TableCell>
              <TableCell className="font-bold">{formatCurrency(performer.total_revenue)}</TableCell>
              <TableCell>{performer.clients_added}</TableCell>
              <TableCell>
                {leadConversionRate.toFixed(1)}%
                <span className="text-muted-foreground text-xs ml-1">
                  ({performer.leads_converted}/{performer.leads_generated})
                </span>
              </TableCell>
              <TableCell>
                <Badge className={performanceRating.color}>{performanceRating.label}</Badge>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
