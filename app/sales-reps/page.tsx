import Link from "next/link"
import { getAllSalesReps } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"

export const dynamic = "force-dynamic"

export default async function SalesRepsPage() {
  const salesReps = await getAllSalesReps()

  return (
    <ProtectedRoute permission="sales_reps:read">
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Sales Representatives</h1>
          <ProtectedRoute permission="sales_reps:write">
            <Link href="/sales-reps/new">
              <Button>Add New Rep</Button>
            </Link>
          </ProtectedRoute>
        </div>

        {salesReps.length === 0 ? (
          <div className="text-center py-12 bg-muted rounded-lg">
            <h2 className="text-xl font-medium mb-2">No sales representatives found</h2>
            <p className="text-muted-foreground mb-4">Get started by adding your first sales representative</p>
            <ProtectedRoute permission="sales_reps:write">
              <Link href="/sales-reps/new">
                <Button>Add Sales Rep</Button>
              </Link>
            </ProtectedRoute>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Hire Date</TableHead>
                  <TableHead>Target Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesReps.map((rep) => (
                  <TableRow key={rep.id}>
                    <TableCell className="font-medium">{rep.name}</TableCell>
                    <TableCell>{rep.email}</TableCell>
                    <TableCell>{rep.phone || "-"}</TableCell>
                    <TableCell>{new Date(rep.hire_date).toLocaleDateString()}</TableCell>
                    <TableCell>{rep.target_amount ? formatCurrency(rep.target_amount) : "-"}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/sales-reps/${rep.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
