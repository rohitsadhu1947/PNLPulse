import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    // Check if the sales_lead_generation table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'sales_lead_generation'
      ) as exists
    `

    // If the table doesn't exist, return empty array
    if (!tableExists[0].exists) {
      return NextResponse.json([])
    }

    // Get lead generation data by sales rep
    const leadData = await sql`
      WITH lead_metrics AS (
        SELECT 
          sr.id,
          sr.name,
          SUM(COALESCE(slg.leads_generated, 0)) as leads_generated,
          SUM(COALESCE(slg.leads_converted, 0)) as leads_converted,
          SUM(COALESCE(slg.value_of_converted_leads, 0)) as value_of_converted_leads,
          SUM(COALESCE(slg.commission_amount, 0)) as commission
        FROM sales_representatives sr
        LEFT JOIN sales_lead_generation slg ON sr.id = slg.generator_id
        LEFT JOIN weekly_sales_reports wsr ON slg.weekly_report_id = wsr.id
        WHERE wsr.week_starting >= NOW() - INTERVAL '90 days' OR wsr.week_starting IS NULL
        GROUP BY sr.id, sr.name
      )
      SELECT 
        name,
        leads_generated as "leadsGenerated",
        leads_converted as "leadsConverted",
        value_of_converted_leads as "valueOfConvertedLeads",
        commission
      FROM lead_metrics
      WHERE leads_generated > 0 OR leads_converted > 0 OR value_of_converted_leads > 0 OR commission > 0
      ORDER BY commission DESC
      LIMIT 10
    `

    return NextResponse.json(leadData || [])
  } catch (error) {
    console.error("Error fetching lead generation data:", error)
    // Return empty array instead of error to prevent client-side errors
    return NextResponse.json([])
  }
}
