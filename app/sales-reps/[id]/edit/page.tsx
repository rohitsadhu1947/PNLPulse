"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AppLayout from "@/components/layout/app-layout";
import { 
  ArrowLeft, 
  Save, 
  Loader2,
  Users,
  Phone,
  Mail,
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

export default function EditSalesRepPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [salesRep, setSalesRep] = useState<SalesRep | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    hire_date: "",
    target_amount: ""
  });

  const salesRepId = params?.id as string;

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
      
      // Populate form with existing data
      setFormData({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        hire_date: data.hire_date ? new Date(data.hire_date).toISOString().split('T')[0] : "",
        target_amount: data.target_amount ? data.target_amount.toString() : ""
      });
    } catch (err) {
      console.error('Error fetching sales rep:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      alert('Name and email are required');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/sales-reps/${salesRepId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          hire_date: formData.hire_date || null,
          target_amount: formData.target_amount ? parseFloat(formData.target_amount) : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update sales representative');
      }

      router.push(`/sales-reps/${salesRepId}`);
    } catch (err) {
      console.error('Error updating sales rep:', err);
      alert(err instanceof Error ? err.message : 'Failed to update sales representative');
    } finally {
      setSaving(false);
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
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push(`/sales-reps/${salesRep.id}`)}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Sales Representative</h1>
                <p className="text-gray-600 mt-1">Update {salesRep.name}'s information</p>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Sales Representative Information</span>
              </CardTitle>
              <CardDescription>
                Update the sales representative's details below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter phone number"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="hire_date">Hire Date</Label>
                    <Input
                      id="hire_date"
                      name="hire_date"
                      type="date"
                      value={formData.hire_date}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="target_amount">Target Amount (₹)</Label>
                    <Input
                      id="target_amount"
                      name="target_amount"
                      type="number"
                      step="0.01"
                      value={formData.target_amount}
                      onChange={handleInputChange}
                      placeholder="Enter target amount"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/sales-reps/${salesRep.id}`)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="flex items-center space-x-2"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
} 