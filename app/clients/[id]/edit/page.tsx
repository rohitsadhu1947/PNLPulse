import { notFound } from "next/navigation"
import { getClientById, getAllSalesReps } from "@/lib/db"
import { EditClientForm } from "@/components/edit-client-form"

export default async function EditClientPage({ params }: { params: { id: string } }) {
  const clientId = Number.parseInt(params.id)

  if (isNaN(clientId)) {
    notFound()
  }

  const [client, salesReps] = await Promise.all([getClientById(clientId), getAllSalesReps()])

  if (!client) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Edit Client: {client.name}</h1>
      <EditClientForm client={client} salesReps={salesReps} />
    </div>
  )
}
