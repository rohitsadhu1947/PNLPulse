import { getSalesRepById } from "@/lib/db"
import { notFound } from "next/navigation"
import { EditSalesRepForm } from "@/components/edit-sales-rep-form"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function EditSalesRepPage({
  params,
}: {
  params: { id: string }
}) {
  const salesRepId = Number.parseInt(params.id)

  if (isNaN(salesRepId)) {
    notFound()
  }

  const salesRep = await getSalesRepById(salesRepId)

  if (!salesRep) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Edit Sales Representative</h1>
        <Link href={`/sales-reps/${salesRep.id}`}>
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>

      <div className="max-w-2xl mx-auto">
        <EditSalesRepForm salesRep={salesRep} />
      </div>
    </div>
  )
}
