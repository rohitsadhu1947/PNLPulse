import { getAllSalesReps } from "@/lib/db"
import { AddClientForm } from "@/components/add-client-form"

export default async function NewClientPage() {
  const salesReps = await getAllSalesReps()

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Add New Client</h1>
      <AddClientForm salesReps={salesReps} />
    </div>
  )
}
