import { AddProductForm } from "@/components/add-product-form"

export default function NewProductPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Add New Product</h1>
      <div className="max-w-2xl mx-auto">
        <AddProductForm />
      </div>
    </div>
  )
}
