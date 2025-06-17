import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { sql } from "@/lib/db"
import { TrendingUp, Users, Target, Award } from "lucide-react"

async function getSummaryMetrics() {
  try {
    const [metrics] = await sql`
      SELECT 
        SUM(cash_collected) as total_revenue,
        COUNT(DISTINCT sales_rep_id) as active_reps,
        SUM(new_clients_added) as total_clients_added,
        AVG(cash_collected) as avg_revenue_per_rep
      FROM weekly_sales_reports
      WHERE week_starting >= NOW() - INTERVAL '90 days'
    `

    // Check if the sales_lead_generation table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'sales_lead_generation'
      ) as exists
    `

    let leadMetrics = {
      total_commission: 0,
      total_leads_generated: 0,
      total_leads_converted: 0,
      conversion_rate: 0,
    }

    // Only query lead metrics if the table exists
    if (tableExists[0].exists) {
      const [leadData] = await sql`
        SELECT 
          SUM(commission_amount) as total_commission,
          SUM(leads_generated) as total_leads_generated,
          SUM(leads_converted) as total_leads_converted,
          CASE 
            WHEN SUM(leads_generated) > 0 
            THEN (SUM(leads_converted)::float / SUM(leads_generated)) * 100 
            ELSE 0 
          END as conversion_rate
        FROM sales_lead_generation
        WHERE created_at >= NOW() - INTERVAL '90 days'
      `

      if (leadData) {
        leadMetrics = leadData
      }
    }

    return {
      totalRevenue: metrics?.total_revenue || 0,
      activeReps: metrics?.active_reps || 0,
      totalClientsAdded: metrics?.total_clients_added || 0,
      avgRevenuePerRep: metrics?.avg_revenue_per_rep || 0,
      totalCommission: leadMetrics.total_commission || 0,
      totalLeadsGenerated: leadMetrics.total_leads_generated || 0,
      totalLeadsConverted: leadMetrics.total_leads_converted || 0,
      conversionRate: leadMetrics.conversion_rate || 0,
    }
  } catch (error) {
    console.error("Error fetching summary metrics:", error)
    // Return default values in case of error
    return {
      totalRevenue: 0,
      activeReps: 0,
      totalClientsAdded: 0,
      avgRevenuePerRep: 0,
      totalCommission: 0,
      totalLeadsGenerated: 0,
      totalLeadsConverted: 0,
      conversionRate: 0,
    }
  }
}

export default async function SalesMetricCards() {
  const metrics = await getSummaryMetrics()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</div>
          <p className="text-xs text-muted-foreground">
            +{formatCurrency(metrics.totalCommission)} from lead commissions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Sales Reps</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.activeReps}</div>
          <p className="text-xs text-muted-foreground">Avg. {formatCurrency(metrics.avgRevenuePerRep)} per rep</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">New Clients</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalClientsAdded}</div>
          <p className="text-xs text-muted-foreground">In the last 90 days</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Lead Conversion</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            {metrics.totalLeadsConverted} of {metrics.totalLeadsGenerated} leads
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
