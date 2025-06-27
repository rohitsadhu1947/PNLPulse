"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Edit } from "lucide-react";

export default function SalesRecordViewPage() {
  const params = useParams();
  const router = useRouter();
  const [sale, setSale] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params || !params.id) return;
    fetch(`/api/sales/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setSale(data);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [params && params.id]);

  if (loading) return <AppLayout><div className="p-6 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div></AppLayout>;
  if (error) return <AppLayout><div className="p-6 text-red-600">{error}</div></AppLayout>;
  if (!sale) return <AppLayout><div className="p-6">No data</div></AppLayout>;

  return (
    <AppLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
        <Card>
          <CardHeader>
            <CardTitle>Sales Record Details</CardTitle>
            <CardDescription>Sale ID: {sale.id}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><b>Sales Rep:</b> {sale.sales_representatives?.name || "Unknown"}</div>
            <div><b>Product:</b> {sale.products?.name || "Unknown"}</div>
            <div><b>Client:</b> {sale.clients?.name || "Unknown"}</div>
            <div><b>Units Sold:</b> {sale.units_sold}</div>
            <div className="space-y-4">
              <div><b>Revenue Generated:</b> ₹{sale.revenue_generated?.toLocaleString()}</div>
              <div><b>Invoice Amount:</b> ₹{sale.invoices_raised?.toLocaleString()}</div>
              <div><b>Cash Collected:</b> ₹{sale.cash_collected?.toLocaleString()}</div>
            </div>
            <div><b>Sale Date:</b> {sale.sale_date ? new Date(sale.sale_date).toLocaleDateString() : "-"}</div>
            <div><b>Invoice Date:</b> {sale.invoice_date ? new Date(sale.invoice_date).toLocaleDateString() : "-"}</div>
            <div><b>Collection Date:</b> {sale.cash_collection_date ? new Date(sale.cash_collection_date).toLocaleDateString() : "-"}</div>
            <Button className="mt-4" onClick={() => router.push(`/sales/${sale.id}/edit`)}><Edit className="mr-2 h-4 w-4" /> Edit</Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
} 