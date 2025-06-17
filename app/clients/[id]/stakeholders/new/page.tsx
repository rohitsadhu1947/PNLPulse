import { notFound } from "next/navigation"
import { getClientById } from "@/lib/db"
import { AddStakeholderForm } from "@/components/add-stakeholder-form"

export default async function NewStakeholderPage({ params }: { params: { id: string } }) {
  const clientId = Number.parseInt(params.id)

  if (isNaN(clientId)) {
    notFound()
  }

  const client = await getClientById(clientId)

  if (!client) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-2">Add New Stakeholder</h1>
      <p className="text-muted-foreground mb-6">for {client.name}</p>
      <AddStakeholderForm clientId={clientId} clientName={client.name} />
    </div>
  )
}
