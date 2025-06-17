import { getProductById } from "@/lib/db"
import { notFound } from "next/navigation"
import { EditProductForm } from "@/components/edit-product-form"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function EditProductPage({
  params,
}: {
  params: { id: string }
}) {
  const productId = Number.parseInt(params.id)

  if (isNaN(productId)) {
    notFound()
  }

  const product = await getProductById(productId)

  if (!product) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Edit Product</h1>
        <Link href={`/products/${product.id}`}>
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>

      <div className="max-w-2xl mx-auto">
        <EditProductForm product={product} />
      </div>
    </div>
  )
}
