"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AppLayout from "@/components/layout/app-layout";
import { useSessionData } from "@/hooks/use-session-data";
import { 
  Plus, 
  Search, 
  Edit, 
  Eye, 
  MoreHorizontal,
  DollarSign,
  FileText,
  CreditCard,
  TrendingUp,
  Loader2,
  Calendar,
  Users,
  Package
} from "lucide-react";
import { formatCurrency } from "@/lib/utils"

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

interface SalesData {
  salesRecords: SalesRecord[];
}

interface SalesRepsData {
  salesReps: SalesRep[];
}

export default function SalesPage() {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
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

  // Fetch data using session-aware hooks
  const { data: salesData, loading: salesLoading, error: salesError } = useSessionData<SalesData>({
    endpoint: '/api/sales'
  });

  const { data: salesRepsData, loading: salesRepsLoading, error: salesRepsError } = useSessionData<SalesRepsData>({
    endpoint: '/api/sales-reps'
  });

  const { data: products = [], loading: productsLoading, error: productsError } = useSessionData<Product[]>({
    endpoint: '/api/products'
  });

  const { data: clients = [], loading: clientsLoading, error: clientsError } = useSessionData<Client[]>({
    endpoint: '/api/clients'
  });

  // Extract data with defaults
  const salesRecords = salesData?.salesRecords || [];
  const salesReps = salesRepsData?.salesReps || [];

  // Helper to check if user is a sales rep
  const isSalesRep = (session?.user as any)?.roles?.includes('sales_rep');
  // Get the logged-in user's sales rep id (assuming it's stored as sales_rep_id on the user object)
  const userSalesRepId = (session?.user as any)?.sales_rep_id;
  const userSalesRepName = salesReps.find(rep => rep.id === userSalesRepId)?.name || session?.user?.name || '';

  // Auto-set sales_rep_id for sales reps when dialog opens
  useEffect(() => {
    if (isCreateDialogOpen && isSalesRep && userSalesRepId) {
      setCreateForm(prev => ({ ...prev, sales_rep_id: userSalesRepId.toString() }));
    }
  }, [isCreateDialogOpen, isSalesRep, userSalesRepId]);

  // Check if any data is still loading
  const loading = salesLoading || salesRepsLoading || productsLoading || clientsLoading;
  
  // Check if any data has errors
  const error = salesError || salesRepsError || productsError || clientsError;

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Creating sale with data:', createForm);
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createForm,
          sales_rep_id: parseInt(createForm.sales_rep_id),
          product_id: parseInt(createForm.product_id),
          client_id: parseInt(createForm.client_id),
          units_sold: parseInt(createForm.units_sold),
          revenue_generated: parseFloat(createForm.revenue_generated),
          invoices_raised: parseFloat(createForm.invoices_raised),
          cash_collected: parseFloat(createForm.cash_collected)
        })
      });

      console.log('Create sale response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Create sale error:', errorData);
        throw new Error(errorData.error || 'Failed to create sale');
      }

      const result = await response.json();
      console.log('Sale created successfully:', result);

      setIsCreateDialogOpen(false);
      setCreateForm({
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
      
      // Force a page reload to refresh data
      console.log('Refreshing data after sale creation...');
      window.location.reload();
    } catch (err) {
      console.error('Error creating sale:', err);
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const formatCurrency = (amount: number) => {
    if (isNaN(amount)) return '₹0.00';
    return `₹${amount.toLocaleString('en-IN')}`;
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const getRevenueStatus = (invoiced: number, collected: number) => {
    if (collected >= invoiced) return "green";
    if (collected > 0) return "yellow";
    return "red";
  };

  const filteredSales = salesRecords.filter(sale => {
    const salesRepName = sale.sales_representatives?.name || '';
    const productName = sale.products?.name || '';
    const clientName = sale.clients?.name || '';
    
    return salesRepName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           clientName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalRevenue = salesRecords.reduce((sum, sale) => sum + Number(sale.revenue_generated), 0);
  const totalInvoiced = salesRecords.reduce((sum, sale) => sum + Number(sale.invoices_raised), 0);
  const totalCollected = salesRecords.reduce((sum, sale) => sum + Number(sale.cash_collected), 0);

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading sales data...</p>
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
            <Button onClick={() => window.location.reload()}>Try Again</Button>
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
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <TrendingUp className="mr-2 h-7 w-7" /> Sales Management
                </h1>
                <p className="text-gray-600 mt-2">
                  Track sales, invoices, and cash collections across all products and clients
                </p>
              </div>
              <div className="flex space-x-2">
                <Button onClick={() => window.location.reload()} variant="outline">
                  <Loader2 className="mr-2 h-4 w-4" /> Refresh
                </Button>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> Record Sale
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Record New Sale</DialogTitle>
                      <DialogDescription>
                        Create a new sales record with revenue, invoice, and cash collection details
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateSale} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="sales_rep_id">Sales Representative</Label>
                          {isSalesRep ? (
                            <Input
                              id="sales_rep_id"
                              value={userSalesRepName}
                              readOnly
                              disabled
                              className="bg-gray-100 cursor-not-allowed"
                            />
                          ) : (
                            <Select value={createForm.sales_rep_id} onValueChange={(value) => setCreateForm(prev => ({ ...prev, sales_rep_id: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select sales rep" />
                              </SelectTrigger>
                              <SelectContent>
                                {salesReps.map(rep => (
                                  <SelectItem key={rep.id} value={rep.id.toString()}>
                                    {rep.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="product_id">Product</Label>
                          <Select value={createForm.product_id} onValueChange={(value) => setCreateForm(prev => ({ ...prev, product_id: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {(products || []).map((product: Product) => (
                                <SelectItem key={product.id} value={product.id.toString()}>
                                  {product.name} - {formatCurrency(product.price)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="client_id">Client</Label>
                          <Select value={createForm.client_id} onValueChange={(value) => setCreateForm(prev => ({ ...prev, client_id: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select client" />
                            </SelectTrigger>
                            <SelectContent>
                              {(clients || []).map((client: Client) => (
                                <SelectItem key={client.id} value={client.id.toString()}>
                                  {client.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="units_sold">Units Sold</Label>
                          <Input
                            id="units_sold"
                            type="number"
                            value={createForm.units_sold}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, units_sold: e.target.value }))}
                            placeholder="0"
                            min="1"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="revenue_generated">Revenue Generated</Label>
                          <Input
                            id="revenue_generated"
                            type="number"
                            value={createForm.revenue_generated}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, revenue_generated: e.target.value }))}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="invoices_raised">Invoice Amount</Label>
                          <Input
                            id="invoices_raised"
                            type="number"
                            value={createForm.invoices_raised}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, invoices_raised: e.target.value }))}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="cash_collected">Cash Collected</Label>
                          <Input
                            id="cash_collected"
                            type="number"
                            value={createForm.cash_collected}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, cash_collected: e.target.value }))}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="sale_date">Sale Date</Label>
                          <Input
                            id="sale_date"
                            type="date"
                            value={createForm.sale_date}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, sale_date: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="invoice_date">Invoice Date</Label>
                          <Input
                            id="invoice_date"
                            type="date"
                            value={createForm.invoice_date}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, invoice_date: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="cash_collection_date">Collection Date</Label>
                          <Input
                            id="cash_collection_date"
                            type="date"
                            value={createForm.cash_collection_date}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, cash_collection_date: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                          Create Sale
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          {/* Revenue Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
                    <p className="text-gray-600">Total Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{formatCurrency(totalInvoiced)}</p>
                    <p className="text-gray-600">Total Invoiced</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <CreditCard className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">{formatCurrency(totalCollected)}</p>
                    <p className="text-gray-600">Total Collected</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search sales by rep, product, or client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Sales Table */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Records</CardTitle>
              <CardDescription>
                Showing {filteredSales.length} of {salesRecords.length} sales records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Sales Rep</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Units</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Invoiced</TableHead>
                      <TableHead>Collected</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.length > 0 ? (
                      filteredSales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell>{formatDate(sale.sale_date)}</TableCell>
                          <TableCell className="font-medium">{sale.sales_representatives?.name || 'Unknown'}</TableCell>
                          <TableCell>{sale.products?.name || 'Unknown'}</TableCell>
                          <TableCell>{sale.clients?.name || 'Unknown'}</TableCell>
                          <TableCell>{sale.units_sold}</TableCell>
                          <TableCell>{formatCurrency(sale.revenue_generated)}</TableCell>
                          <TableCell>{formatCurrency(sale.invoices_raised)}</TableCell>
                          <TableCell>{formatCurrency(sale.cash_collected)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" asChild>
                                <a href={`/sales/${sale.id}`}><Eye className="h-4 w-4" /></a>
                              </Button>
                              <Button variant="outline" size="sm" asChild>
                                <a href={`/sales/${sale.id}/edit`}><Edit className="h-4 w-4" /></a>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                          No sales records found
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