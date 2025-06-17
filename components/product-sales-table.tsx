import { formatCurrency } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface ProductSale {
  id: number
  product_id: number
  product_name: string
  product_price: number
  units_sold: number
  revenue_generated: number
}

interface ProductSalesTableProps {
  productSales: ProductSale[]
  canEdit?: boolean
}

export function ProductSalesTable({ productSales, canEdit = false }: ProductSalesTableProps) {
  if (!productSales || productSales.length === 0) {
    return <div className="text-center py-4 text-gray-500">No product sales data available</div>
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead className="text-right">Unit Price</TableHead>
            <TableHead className="text-right">Units Sold</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {productSales.map((sale) => (
            <TableRow key={sale.id}>
              <TableCell className="font-medium">{sale.product_name}</TableCell>
              <TableCell className="text-right">{formatCurrency(sale.product_price)}</TableCell>
              <TableCell className="text-right">{sale.units_sold}</TableCell>
              <TableCell className="text-right">{formatCurrency(sale.revenue_generated)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
