"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, Save } from "lucide-react";

interface SalesRecord {
  id: number;
  sales_rep_id: number;
  product_id: number;
  client_id: number;
  units_sold: number;
  revenue_generated: number;
  invoices_raised: number;
  cash_collected: number;
  sale_date: string;
  invoice_date: string | null;
  cash_collection_date: string | null;
  sales_representatives?: {
    name: string;
  };
  products?: {
    name: string;
    price: number;
  };
  clients?: {
    name: string;
  };
}

interface SalesRep {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
}

interface Client {
  id: number;
  name: string;
}

export default function SalesRecordEditPage() {
  const params = useParams();
  const router = useRouter();
  const [sale, setSale] = useState<SalesRecord | null>(null);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    sales_rep_id: "",
    product_id: "",
    client_id: "",
    units_sold: "",
    revenue_generated: "",
    invoices_raised: "",
    cash_collected: "",
    sale_date: "",
    invoice_date: "",
    cash_collection_date: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!params?.id) return;
      
      try {
        setLoading(true);
        const [saleResponse, salesRepsResponse, productsResponse, clientsResponse] = await Promise.all([
          fetch(`/api/sales/${params.id}`),
          fetch('/api/sales-reps'),
          fetch('/api/products'),
          fetch('/api/clients')
        ]);

        if (!saleResponse.ok) {
          throw new Error('Failed to fetch sale');
        }

        const saleData = await saleResponse.json();
        setSale(saleData);
        setFormData({
          sales_rep_id: saleData.sales_rep_id.toString(),
          product_id: saleData.product_id.toString(),
          client_id: saleData.client_id.toString(),
          units_sold: saleData.units_sold.toString(),
          revenue_generated: saleData.revenue_generated.toString(),
          invoices_raised: saleData.invoices_raised.toString(),
          cash_collected: saleData.cash_collected.toString(),
          sale_date: saleData.sale_date,
          invoice_date: saleData.invoice_date || '',
          cash_collection_date: saleData.cash_collection_date || ''
        });

        if (salesRepsResponse.ok) {
          const salesRepsData = await salesRepsResponse.json();
          setSalesReps(salesRepsData.salesReps || []);
        }

        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          setProducts(productsData.products || []);
        }

        if (clientsResponse.ok) {
          const clientsData = await clientsResponse.json();
          setClients(clientsData.clients || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!params?.id) return;
    
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/sales/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          sales_rep_id: parseInt(formData.sales_rep_id),
          product_id: parseInt(formData.product_id),
          client_id: parseInt(formData.client_id),
          units_sold: parseInt(formData.units_sold),
          revenue_generated: parseFloat(formData.revenue_generated),
          invoices_raised: parseFloat(formData.invoices_raised),
          cash_collected: parseFloat(formData.cash_collected)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update sale');
      }

      // Redirect to the view page
      router.push(`/sales/${params.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="p-6 text-red-600">{error}</div>
      </AppLayout>
    );
  }

  if (!sale) {
    return (
      <AppLayout>
        <div className="p-6">Sale not found</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle>Edit Sales Record</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sales_rep_id">Sales Representative</Label>
                  <Select value={formData.sales_rep_id} onValueChange={(value) => handleInputChange('sales_rep_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sales rep" />
                    </SelectTrigger>
                    <SelectContent>
                      {salesReps.map((rep) => (
                        <SelectItem key={rep.id} value={rep.id.toString()}>
                          {rep.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product_id">Product</Label>
                  <Select value={formData.product_id} onValueChange={(value) => handleInputChange('product_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name} - ₹{product.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_id">Client</Label>
                  <Select value={formData.client_id} onValueChange={(value) => handleInputChange('client_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="units_sold">Units Sold</Label>
                  <Input
                    id="units_sold"
                    type="number"
                    value={formData.units_sold}
                    onChange={(e) => handleInputChange('units_sold', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="revenue_generated">Revenue Generated (₹)</Label>
                  <Input
                    id="revenue_generated"
                    type="number"
                    step="0.01"
                    value={formData.revenue_generated}
                    onChange={(e) => handleInputChange('revenue_generated', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoices_raised">Invoice Amount (₹)</Label>
                  <Input
                    id="invoices_raised"
                    type="number"
                    step="0.01"
                    value={formData.invoices_raised}
                    onChange={(e) => handleInputChange('invoices_raised', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cash_collected">Cash Collected (₹)</Label>
                  <Input
                    id="cash_collected"
                    type="number"
                    step="0.01"
                    value={formData.cash_collected}
                    onChange={(e) => handleInputChange('cash_collected', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sale_date">Sale Date</Label>
                  <Input
                    id="sale_date"
                    type="date"
                    value={formData.sale_date}
                    onChange={(e) => handleInputChange('sale_date', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoice_date">Invoice Date</Label>
                  <Input
                    id="invoice_date"
                    type="date"
                    value={formData.invoice_date}
                    onChange={(e) => handleInputChange('invoice_date', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cash_collection_date">Cash Collection Date</Label>
                  <Input
                    id="cash_collection_date"
                    type="date"
                    value={formData.cash_collection_date}
                    onChange={(e) => handleInputChange('cash_collection_date', e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Changes
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
} 