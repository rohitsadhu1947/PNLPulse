import { getProductSalesSummaryBySalesRep, getSalesRepProductsBySalesRepId } from "@/lib/db"
import { formatCurrency } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface SalesRepProductListProps {
  salesRepId: number
}

export async function SalesRepProductList({ salesRepId }: SalesRepProductListProps) {
  // Get the product sales summary for this sales rep
  const productSummary = await getProductSalesSummaryBySalesRep(salesRepId)

  // Get the detailed product sales for this sales rep
  const salesRepProducts = await getSalesRepProductsBySalesRepId(salesRepId)

  // Calculate totals
  const totalUnitsSold = productSummary.reduce((sum, product) => {
    const units = Number.parseInt(product.total_units_sold)
    return sum + (isNaN(units) ? 0 : units)
  }, 0)

  const totalRevenue = productSummary.reduce((sum, product) => {
    const revenue = Number.parseFloat(product.total_revenue)
    return sum + (isNaN(revenue) ? 0 : revenue)
  }, 0)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Product Sales Summary</CardTitle>
          <CardDescription>Summary of products sold by this sales representative</CardDescription>
        </CardHeader>
        <CardContent>
          {productSummary.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-primary/5 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Units Sold</h3>
                  <p className="text-2xl font-bold">{totalUnitsSold}</p>
                </div>
                <div className="bg-primary/5 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Revenue</h3>
                  <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Units Sold</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>% of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productSummary.map((product) => (
                      <TableRow key={product.product_id}>
                        <TableCell className="font-medium">{product.product_name}</TableCell>
                        <TableCell>
                          {typeof product.product_price === "number"
                            ? formatCurrency(product.product_price)
                            : product.product_price}
                        </TableCell>
                        <TableCell>{product.total_units_sold}</TableCell>
                        <TableCell>{formatCurrency(product.total_revenue)}</TableCell>
                        <TableCell>
                          {totalRevenue > 0
                            ? ((Number.parseFloat(product.total_revenue) / totalRevenue) * 100).toFixed(1) + "%"
                            : "0%"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <div className="text-center py-12 bg-muted rounded-lg">
              <h2 className="text-xl font-medium mb-2">No product sales recorded</h2>
              <p className="text-muted-foreground">This sales representative hasn't sold any products yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {salesRepProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Product Sales History</CardTitle>
            <CardDescription>Detailed history of product sales by this sales representative</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Units Sold</TableHead>
                    <TableHead>Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesRepProducts.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>{new Date(sale.sale_date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{sale.product_name}</TableCell>
                      <TableCell>{sale.units_sold}</TableCell>
                      <TableCell>{formatCurrency(sale.revenue_generated)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
