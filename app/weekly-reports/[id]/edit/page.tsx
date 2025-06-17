import { notFound } from "next/navigation"
import { EditWeeklyReportForm } from "@/components/edit-weekly-report-form"
import { sql } from "@/lib/db"
import { getAllProducts } from "@/lib/db"

async function getWeeklyReportById(id: string) {
  try {
    // Fetch the weekly report directly with a simple query first
    const reportResult = await sql`
      SELECT * FROM weekly_sales_reports WHERE id = ${id}
    `

    if (reportResult.length === 0) {
      console.log(`No weekly report found with id ${id}`)
      return null
    }

    return reportResult[0]
  } catch (error) {
    console.error("Error fetching weekly report:", error)
    return null
  }
}

async function getAllSalesReps() {
  try {
    const salesReps = await sql`
      SELECT * FROM sales_representatives ORDER BY name ASC
    `
    return salesReps
  } catch (error) {
    console.error("Error fetching sales reps:", error)
    return []
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

    const leadData = await sql`
      SELECT * FROM sales_lead_generation 
      WHERE weekly_report_id = ${weekly_report_id}
      ORDER BY recipient_id ASC
    `
    return leadData
  } catch (error) {
    console.error("Error fetching lead generation data:", error)
    return []
  }
}

// Updated function to fetch product sales from sales_rep_products table
async function getProductSalesForWeeklyReport(report) {
  try {
    if (!report || !report.sales_rep_id || !report.week_starting) {
      console.log("Missing required report data for product sales query")
      return []
    }

    console.log(
      `Fetching product sales for sales_rep_id: ${report.sales_rep_id}, week_starting: ${report.week_starting}`,
    )

    const productSales = await sql`
      SELECT 
        srp.*,
        p.name as product_name,
        p.price as product_price
      FROM sales_rep_products srp
      JOIN products p ON srp.product_id = p.id
      WHERE srp.sales_rep_id = ${report.sales_rep_id}
        AND srp.sale_date = ${report.week_starting}
      ORDER BY p.name ASC
    `

    console.log(`Found ${productSales.length} product sales for weekly report`)
    return productSales
  } catch (error) {
    console.error("Error fetching product sales for weekly report:", error)
    return []
  }
}

export default async function EditWeeklyReportPage({
  params,
}: {
  params: { id: string }
}) {
  try {
    const reportId = Number.parseInt(params.id)

    if (isNaN(reportId)) {
      notFound()
    }

    // First, fetch the report
    const report = await getWeeklyReportById(params.id)

    if (!report) {
      notFound()
    }

    // Then fetch the rest of the data
    const [salesReps, leadGeneration, products, productSales] = await Promise.all([
      getAllSalesReps(),
      getLeadGenerationByWeeklyReportId(reportId),
      getAllProducts(),
      getProductSalesForWeeklyReport(report),
    ])

    console.log("Data fetched for weekly report:", {
      reportId,
      salesRepsCount: salesReps.length,
      leadGenerationCount: leadGeneration.length,
      productsCount: products.length,
      productSalesCount: productSales.length,
    })

    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Edit Weekly Sales Report</h1>
        <EditWeeklyReportForm
          report={report}
          salesReps={salesReps}
          leadGeneration={leadGeneration}
          products={products}
          productSales={productSales}
        />
      </div>
    )
  } catch (error) {
    console.error("Error in EditWeeklyReportPage:", error)
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Edit Weekly Sales Report</h1>
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6 text-center">
          <h2 className="text-xl font-medium text-red-600 mb-4">Error Loading Report</h2>
          <p className="mb-4">
            There was an error loading this weekly report for editing. This might be due to missing data or database
            issues.
          </p>
          <pre className="bg-gray-100 p-4 rounded text-left text-xs overflow-auto max-h-40 mb-4">
            {error instanceof Error ? error.message : String(error)}
          </pre>
          <a
            href="/weekly-reports"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Return to Weekly Reports
          </a>
        </div>
      </div>
    )
  }
}
