import { getAllSalesReps, getAllProducts } from "@/lib/db"
import { AddWeeklyReportForm } from "@/components/add-weekly-report-form"

export default async function NewWeeklyReportPage() {
  const [salesReps, products] = await Promise.all([getAllSalesReps(), getAllProducts()])

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Add New Weekly Sales Report</h1>
      <div className="max-w-4xl mx-auto">
        <AddWeeklyReportForm salesReps={salesReps} products={products} />
      </div>
    </div>
  )
}
