import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    // Get weekly sales data for the last 12 weeks
    const salesData = await sql`
      WITH weeks AS (
        SELECT generate_series(
          date_trunc('week', NOW() - INTERVAL '11 weeks'),
          date_trunc('week', NOW()),
          '1 week'::interval
        ) AS week_start
      ),
      weekly_sales AS (
        SELECT 
          date_trunc('week', week_starting) as week_start,
          SUM(cash_collected) as cash_collected,
          SUM(invoices_raised) as invoices_raised,
          SUM(value_of_new_clients) as value_of_new_clients
        FROM weekly_sales_reports
        WHERE week_starting >= NOW() - INTERVAL '12 weeks'
        GROUP BY week_start
      ),
      weekly_commission AS (
        SELECT 
          date_trunc('week', wsr.week_starting) as week_start,
          SUM(COALESCE(slg.commission_amount, 0)) as commission
        FROM weekly_sales_reports wsr
        LEFT JOIN sales_lead_generation slg ON slg.weekly_report_id = wsr.id
        WHERE wsr.week_starting >= NOW() - INTERVAL '12 weeks'
        GROUP BY week_start
      )
      SELECT 
        TO_CHAR(w.week_start, 'Mon DD') as week,
        COALESCE(ws.cash_collected, 0) as "cashCollected",
        COALESCE(ws.invoices_raised, 0) as "invoicesRaised",
        COALESCE(ws.value_of_new_clients, 0) as "valueOfNewClients",
        COALESCE(wc.commission, 0) as "commission"
      FROM weeks w
      LEFT JOIN weekly_sales ws ON w.week_start = ws.week_start
      LEFT JOIN weekly_commission wc ON w.week_start = wc.week_start
      ORDER BY w.week_start
    `

    return NextResponse.json(salesData || [])
  } catch (error) {
    console.error("Error fetching sales performance data:", error)
    // Return empty array instead of error to prevent client-side errors
    return NextResponse.json([])
  }
}
