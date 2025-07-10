"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/layout/app-layout";
import { 
  Plus, 
  Search, 
  Edit, 
  Eye, 
  MoreHorizontal,
  Users,
  Loader2,
  Phone,
  Calendar,
  DollarSign
} from "lucide-react";

interface SalesRep {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  hire_date: string | null;
  target_amount: number | null;
}

export default function SalesRepsPage() {
  const { data: session } = useSession();
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchSalesReps();
  }, []);

  const fetchSalesReps = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sales-reps');
      if (!response.ok) {
        throw new Error('Failed to fetch sales representatives');
      }
      const data = await response.json();
      console.log('Sales reps data:', data); // Debug log
      setSalesReps(data.salesReps || []);
    } catch (err) {
      console.error('Error fetching sales reps:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const formatPhone = (phone: string | null) => {
    if (!phone) return "N/A";
    return phone;
  };

  const filteredSalesReps = salesReps.filter(salesRep => {
    return salesRep.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           salesRep.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (salesRep.phone && salesRep.phone.includes(searchTerm));
  });

  const user = session?.user as any;
  const canEditSalesRep = user?.permissions?.includes('sales_reps:edit') || user?.roles?.includes('admin') || user?.roles?.includes('sales_manager');

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading sales representatives...</p>
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
            <Button onClick={fetchSalesReps}>
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
                <h1 className="text-3xl font-bold text-gray-900">Sales Representatives</h1>
                <p className="text-gray-600 mt-2">
                  Manage your sales team and their performance
                </p>
              </div>
              <Button onClick={() => window.location.href = '/sales-reps/new'}>
                <Plus className="mr-2 h-4 w-4" />
                Add Sales Rep
              </Button>
            </div>
          </div>

          {/* Stats Card */}
          <div className="mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{salesReps.length}</p>
                    <p className="text-gray-600">Total Sales Representatives</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search Filter */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search sales representatives..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sales Reps Table */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Representatives List</CardTitle>
              <CardDescription>
                Showing {filteredSalesReps.length} of {salesReps.length} sales representatives
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Hire Date</TableHead>
                      <TableHead>Target Amount</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSalesReps.length > 0 ? (
                      filteredSalesReps.map((salesRep) => (
                        <TableRow key={salesRep.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{salesRep.name}</div>
                              <div className="text-sm text-gray-500">ID: {salesRep.id}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-blue-600 hover:underline cursor-pointer">
                              {salesRep.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span>{formatPhone(salesRep.phone)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span>{formatDate(salesRep.hire_date)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <DollarSign className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">{formatCurrency(salesRep.target_amount)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.location.href = `/sales-reps/${salesRep.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {canEditSalesRep && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.location.href = `/sales-reps/${salesRep.id}/edit`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          {salesReps.length === 0 ? "No sales representatives found" : "No sales representatives match your search"}
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