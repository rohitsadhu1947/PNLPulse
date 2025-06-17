import { getProductById, getFilesByEntity, sql } from "@/lib/db"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { notFound } from "next/navigation"
import { DeleteProductButton } from "@/components/delete-product-button"
import Image from "next/image"
import { FileUploader } from "@/components/file-uploader"
import { FileList } from "@/components/file-list"

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const productId = Number.parseInt(params.id)

  if (isNaN(productId)) {
    notFound()
  }

  try {
    // Fetch the product
    const product = await getProductById(productId)

    if (!product) {
      notFound()
    }

    // Check if the files table exists before trying to query it
    let files = []
    let tableExists = false
    try {
      const tableExistsResult = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'files'
        ) as exists
      `

      tableExists = tableExistsResult[0]?.exists

      if (tableExists) {
        files = await getFilesByEntity("product", productId)
      }
    } catch (error) {
      console.error("Error checking for files table:", error)
      // Continue without files data
    }

    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Product Details</h1>
          <Link href="/products">
            <Button variant="outline">Back to Products</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-2xl font-semibold mb-4">{product.name}</h2>

              {product.image_url && (
                <div className="relative w-full h-64 mb-4 rounded-md overflow-hidden">
                  <Image
                    src={product.image_url || "/placeholder.svg"}
                    alt={product.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <p className="mt-1">{product.description || "No description provided"}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Price</h3>
                  <p className="mt-1 text-xl font-semibold">{formatCurrency(product.price)}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Created At</h3>
                  <p className="mt-1">{new Date(product.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Link href={`/products/${product.id}/edit`} className="flex-1">
                <Button className="w-full">Edit Product</Button>
              </Link>
              <DeleteProductButton productId={product.id} className="flex-1" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">Sales Performance</h2>
            <p className="text-muted-foreground">Sales performance data will be displayed here.</p>
            {/* Add sales performance charts and data here */}
          </div>
        </div>

        {tableExists && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Product Documents</h2>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="mb-6">
                <FileUploader
                  entityType="product"
                  entityId={productId}
                  uploadedBy={null} // In a real app, this would be the current user's ID
                />
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Uploaded Files</h3>
                <FileList files={files} entityType="product" entityId={productId} />
              </div>
            </div>
          </div>
        )}
      </div>
    )
  } catch (error) {
    console.error("Error in ProductDetailPage:", error)
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Product Details</h1>
          <Link href="/products">
            <Button variant="outline">Back to Products</Button>
          </Link>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6 text-center">
          <h2 className="text-xl font-medium text-red-600 mb-4">Error Loading Product</h2>
          <p className="mb-4">
            There was an error loading this product. This might be due to missing data or database issues.
          </p>
          <pre className="bg-gray-100 p-4 rounded text-left text-xs overflow-auto max-h-40 mb-4">
            {error instanceof Error ? error.message : String(error)}
          </pre>
          <Link href="/products">
            <Button>Return to Products</Button>
          </Link>
        </div>
      </div>
    )
  }
}
