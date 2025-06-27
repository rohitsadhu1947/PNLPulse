"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import AppLayout from "@/components/layout/app-layout";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

interface Client {
  id: number;
  name: string;
  client_type: string | null;
  industry: string | null;
  website: string | null;
  company_size: string | null;
  hq_location: string | null;
  sales_stage: string | null;
  deal_value: number | null;
  probability_to_close: number | null;
  sales_representative_id: number | null;
  products_interested: number[];
  pricing_model: string | null;
  custom_requirements: string | null;
}

interface Product {
  id: number;
  name: string;
  price: number;
  description?: string;
}

export default function EditClientPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    client_type: "",
    industry: "",
    website: "",
    company_size: "",
    hq_location: "",
    sales_stage: "",
    deal_value: "",
    probability_to_close: "",
    sales_representative_id: "",
    products_interested: [] as number[],
    pricing_model: "",
    custom_requirements: ""
  });

  useEffect(() => {
    fetchClient();
    fetchProducts();
  }, [params.id]);

  const fetchClient = async () => {
    try {
      const response = await fetch(`/api/clients/${params.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch client');
      }
      const client: Client = await response.json();
      
      setFormData({
        name: client.name,
        client_type: client.client_type || "",
        industry: client.industry || "",
        website: client.website || "",
        company_size: client.company_size || "",
        hq_location: client.hq_location || "",
        sales_stage: client.sales_stage || "",
        deal_value: client.deal_value?.toString() || "",
        probability_to_close: client.probability_to_close?.toString() || "",
        sales_representative_id: client.sales_representative_id?.toString() || "",
        products_interested: client.products_interested || [],
        pricing_model: client.pricing_model || "",
        custom_requirements: client.custom_requirements || ""
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProductInterestChange = (productId: number, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      products_interested: checked 
        ? [...prev.products_interested, productId]
        : prev.products_interested.filter(id => id !== productId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/clients/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update client');
      }

      const client = await response.json();
      router.push(`/clients/${client.id}`);
    } catch (error) {
      console.error('Error updating client:', error);
      alert(error instanceof Error ? error.message : 'An error occurred');
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
            <p className="text-gray-600">Loading client...</p>
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
            <Button onClick={() => router.push('/clients')}>
              Back to Clients
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
            <Button
              variant="ghost"
              onClick={() => router.push(`/clients/${params.id}`)}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Client
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Edit Client</h1>
            <p className="text-gray-600 mt-2">
              Update client information and details
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Essential client details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Client Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter client name"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="client_type">Client Type</Label>
                    <select
                      id="client_type"
                      name="client_type"
                      value={formData.client_type}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="">Select client type</option>
                      <option value="Strategic">Strategic</option>
                      <option value="Growth">Growth</option>
                      <option value="Volume">Volume</option>
                      <option value="Partner">Partner</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      name="industry"
                      value={formData.industry}
                      onChange={handleInputChange}
                      placeholder="e.g., Technology, Healthcare"
                    />
                  </div>

                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      name="website"
                      type="url"
                      value={formData.website}
                      onChange={handleInputChange}
                      placeholder="https://example.com"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Company Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Company Details</CardTitle>
                  <CardDescription>
                    Additional company information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="company_size">Company Size</Label>
                    <select
                      id="company_size"
                      name="company_size"
                      value={formData.company_size}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="">Select company size</option>
                      <option value="1-10">1-10</option>
                      <option value="11-50">11-50</option>
                      <option value="51-200">51-200</option>
                      <option value="201-1000">201-1000</option>
                      <option value="1000+">1000+</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="hq_location">Headquarters Location</Label>
                    <Input
                      id="hq_location"
                      name="hq_location"
                      value={formData.hq_location}
                      onChange={handleInputChange}
                      placeholder="e.g., San Francisco, CA"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Sales Information */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Sales Information</CardTitle>
                  <CardDescription>
                    Sales pipeline and deal details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="sales_stage">Sales Stage</Label>
                      <select
                        id="sales_stage"
                        name="sales_stage"
                        value={formData.sales_stage}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        required
                      >
                        <option value="">Select sales stage</option>
                        <option value="Lead">Lead</option>
                        <option value="Qualified">Qualified</option>
                        <option value="Demo">Demo</option>
                        <option value="Proposal Sent">Proposal Sent</option>
                        <option value="Negotiation">Negotiation</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="deal_value">Deal Value (₹)</Label>
                      <Input
                        id="deal_value"
                        name="deal_value"
                        type="number"
                        value={formData.deal_value}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <Label htmlFor="probability_to_close">Probability to Close (%)</Label>
                      <Input
                        id="probability_to_close"
                        name="probability_to_close"
                        type="number"
                        value={formData.probability_to_close}
                        onChange={handleInputChange}
                        placeholder="0"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Product Interest & Requirements */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Product Interest & Requirements</CardTitle>
                  <CardDescription>
                    Select products the client is interested in and specify requirements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Products Interested In</Label>
                    <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
                      {products.map((product) => (
                        <div key={product.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`product-${product.id}`}
                            checked={formData.products_interested.includes(product.id)}
                            onCheckedChange={(checked) => 
                              handleProductInterestChange(product.id, checked as boolean)
                            }
                          />
                          <Label htmlFor={`product-${product.id}`} className="flex-1 cursor-pointer">
                            <div className="flex justify-between items-center">
                              <span>{product.name}</span>
                              <span className="text-sm text-gray-500">₹{product.price}</span>
                            </div>
                            {product.description && (
                              <p className="text-xs text-gray-400 mt-1">{product.description}</p>
                            )}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="pricing_model">Preferred Pricing Model</Label>
                    <select
                      id="pricing_model"
                      name="pricing_model"
                      value={formData.pricing_model}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select pricing model</option>
                      <option value="Per User">Per User</option>
                      <option value="Per Month">Per Month</option>
                      <option value="Per Year">Per Year</option>
                      <option value="One-time">One-time</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="custom_requirements">Custom Requirements</Label>
                    <Textarea
                      id="custom_requirements"
                      name="custom_requirements"
                      value={formData.custom_requirements}
                      onChange={handleInputChange}
                      placeholder="Describe any custom requirements, integrations, or special needs..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Submit Button */}
            <div className="mt-8 flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/clients/${params.id}`)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
} 