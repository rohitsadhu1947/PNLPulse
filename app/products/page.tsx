"use client";
import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Eye, Edit, Loader2, Package } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image_url?: string | null;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: session } = useSession();
  const user = session?.user as any;
  const canEditProduct = user?.permissions?.includes('products:edit') || user?.roles?.includes('admin') || user?.roles?.includes('sales_manager');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading products...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="p-6 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error: {error}</p>
            <Button onClick={fetchProducts}>
              Try Again
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center"><Package className="mr-2 h-7 w-7" /> Products</h1>
                <p className="text-gray-600 mt-2">
                  Manage your product catalog
                </p>
              </div>
              <Link href="/products/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Add Product
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Card */}
          <div className="mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Package className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{products.length}</p>
                    <p className="text-gray-600">Total Products</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Products Table */}
          <Card>
            <CardHeader>
              <CardTitle>Product List</CardTitle>
              <CardDescription>
                Showing {products.length} products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.length > 0 ? (
                      products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.description || "-"}</TableCell>
                          <TableCell>{product.price?.toLocaleString(undefined, { style: 'currency', currency: 'INR' })}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                              >
                                <Link href={`/products/${product.id}`}><Eye className="h-4 w-4" /></Link>
                              </Button>
                              {canEditProduct && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                >
                                  <Link href={`/products/${product.id}/edit`}><Edit className="h-4 w-4" /></Link>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                          No products found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
} 