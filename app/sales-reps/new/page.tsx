import { AddSalesRepForm } from "@/components/add-sales-rep-form"

export default function NewSalesRepPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Add New Sales Representative</h1>
      <div className="max-w-2xl mx-auto">
        <AddSalesRepForm />
      </div>
    </div>
  )
}
