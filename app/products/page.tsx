import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Link from "next/link"
import { SeedProducts } from "@/components/seed-products"
import { getAllProducts } from "@/lib/db"
import { formatCurrency } from "@/lib/utils"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"

export const dynamic = "force-dynamic"

export default async function ProductsPage() {
  const products = await getAllProducts()

  return (
    <ProtectedRoute permission="products:read">
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Products</h1>
          <ProtectedRoute permission="products:write">
            <Link href="/products/new">
              <Button>Add Product</Button>
            </Link>
          </ProtectedRoute>
        </div>

        {products.length === 0 ? (
          <div className="space-y-8">
            <div className="text-center py-12 bg-muted rounded-lg">
              <h2 className="text-xl font-medium mb-2">No products found</h2>
              <p className="text-muted-foreground mb-4">
                Get started by adding your first product or seed the initial catalog
              </p>
              <ProtectedRoute permission="products:write">
                <Link href="/products/new">
                  <Button>Add Product</Button>
                </Link>
              </ProtectedRoute>
            </div>

            <ProtectedRoute permission="products:write">
              <SeedProducts />
            </ProtectedRoute>
          </div>
        ) : (
          <Table>
            <TableCaption>A list of your products.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.description || "No description"}</TableCell>
                  <TableCell>{formatCurrency(product.price)}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/products/${product.id}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4}>{/* Add pagination or other footer content here */}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        )}
      </div>
    </ProtectedRoute>
  )
}
