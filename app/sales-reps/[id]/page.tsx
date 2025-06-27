"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/layout/app-layout";
import { 
  ArrowLeft, 
  Edit, 
  Phone, 
  Mail, 
  Calendar, 
  DollarSign, 
  Users,
  Loader2,
  Trash2
} from "lucide-react";

interface SalesRep {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  hire_date: string | null;
  target_amount: number | null;
}

export default function SalesRepDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [salesRep, setSalesRep] = useState<SalesRep | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const salesRepId = params.id as string;

  useEffect(() => {
    if (salesRepId) {
      fetchSalesRep();
    }
  }, [salesRepId]);

  const fetchSalesRep = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sales-reps/${salesRepId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch sales representative');
      }
      const data = await response.json();
      setSalesRep(data);
    } catch (err) {
      console.error('Error fetching sales rep:', err);
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

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this sales representative?')) {
      return;
    }

    try {
      const response = await fetch(`/api/sales-reps/${salesRepId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete sales representative');
      }

      router.push('/sales-reps');
    } catch (err) {
      console.error('Error deleting sales rep:', err);
      alert('Failed to delete sales representative');
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading sales representative...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !salesRep) {
    return (
      <AppLayout>
        <div className="p-6 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error: {error || 'Sales representative not found'}</p>
            <Button onClick={() => router.push('/sales-reps')}>
              Back to Sales Representatives
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => router.push('/sales-reps')}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{salesRep.name}</h1>
                  <p className="text-gray-600 mt-1">Sales Representative Details</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => router.push(`/sales-reps/${salesRep.id}/edit`)}
                  className="flex items-center space-x-2"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  className="flex items-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Basic Information */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Basic Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Full Name</label>
                      <p className="text-lg font-semibold mt-1">{salesRep.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email Address</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <a 
                          href={`mailto:${salesRep.email}`}
                          className="text-lg text-blue-600 hover:underline"
                        >
                          {salesRep.email}
                        </a>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone Number</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-lg">
                          {salesRep.phone || "Not provided"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Hire Date</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-lg">{formatDate(salesRep.hire_date)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5" />
                    <span>Performance Metrics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Target Amount</label>
                      <p className="text-2xl font-bold text-green-600 mt-1">
                        {formatCurrency(salesRep.target_amount)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Sales Rep ID</label>
                      <p className="text-lg font-semibold mt-1">#{salesRep.id}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full justify-start"
                    onClick={() => router.push(`/sales-reps/${salesRep.id}/edit`)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push('/clients')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    View Clients
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push('/dashboard')}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    View Performance
                  </Button>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <a 
                      href={`mailto:${salesRep.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {salesRep.email}
                    </a>
                  </div>
                  {salesRep.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <a 
                        href={`tel:${salesRep.phone}`}
                        className="text-blue-600 hover:underline"
                      >
                        {salesRep.phone}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
} 