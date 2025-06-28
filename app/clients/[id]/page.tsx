"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/layout/app-layout";
import { ArrowLeft, Edit, Loader2, Building, DollarSign, MapPin, Globe } from "lucide-react";

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
  deal_currency: string | null;
  probability_to_close: number | null;
  created_at: string;
  sales_representatives?: {
    name: string;
  } | null;
}

export default function ClientViewPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<Client | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clientId = params?.id as string;

  useEffect(() => {
    const fetchClient = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/clients/${clientId}`);
        if (!response.ok) {
          throw new Error('Client not found');
        }
        const data = await response.json();
        setClient(data);
      } catch (error) {
        console.error('Error fetching client:', error);
        setError(error instanceof Error ? error.message : 'Failed to load client');
      } finally {
        setLoading(false);
      }
    };

    if (clientId) {
      fetchClient();
    }
  }, [clientId]);

  const formatCurrency = (amount: number | null, currency: string = 'INR') => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStageColor = (stage: string | null) => {
    if (!stage) return "gray";
    switch (stage.toLowerCase()) {
      case 'prospecting': return 'blue';
      case 'qualification': return 'yellow';
      case 'proposal': return 'orange';
      case 'negotiation': return 'purple';
      case 'closed won': return 'green';
      case 'closed lost': return 'red';
      default: return 'gray';
    }
  };

  if (!session) {
    return (
      <AppLayout>
        <div className="p-6 flex items-center justify-center">
          <p className="text-gray-600">Please sign in to access this page.</p>
        </div>
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading client details...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !client) {
    return (
      <AppLayout>
        <div className="p-6 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error: {error || 'Client not found'}</p>
            <Button onClick={() => router.back()}>
              Go Back
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
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Clients
            </Button>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
                <p className="text-gray-600 mt-2">
                  Client ID: {client.id} • Created: {formatDate(client.created_at)}
                </p>
              </div>
              <Button onClick={() => router.push(`/clients/${client.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Client
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Client Type</p>
                    <p className="text-sm">{client.client_type || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Industry</p>
                    <p className="text-sm">{client.industry || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Company Size</p>
                    <p className="text-sm">{client.company_size || "Not specified"}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Website
                  </p>
                  {client.website ? (
                    <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                      {client.website}
                    </a>
                  ) : (
                    <p className="text-sm text-gray-500">Not specified</p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    HQ Location
                  </p>
                  <p className="text-sm">{client.hq_location || "Not specified"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Sales Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Sales Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Sales Stage</p>
                    <Badge variant={getStageColor(client.sales_stage) as any} className="mt-1">
                      {client.sales_stage || "Not Set"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Deal Value</p>
                    <p className="text-sm font-semibold">
                      {formatCurrency(client.deal_value, client.deal_currency || 'INR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Probability</p>
                    <p className="text-sm">{client.probability_to_close ? `${client.probability_to_close}%` : "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Account Owner</p>
                    <p className="text-sm">{client.sales_representatives?.name || "Unassigned"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
