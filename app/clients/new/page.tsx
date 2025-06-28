"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppLayout from "@/components/layout/app-layout";
import { ArrowLeft, Loader2, Save, Plus, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Stakeholder {
  name: string;
  email: string;
  phone: string;
  designation: string;
  decision_role: string;
  relationship_status: string;
}

export default function NewClientPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [newStakeholder, setNewStakeholder] = useState<Stakeholder>({
    name: "", email: "", phone: "", designation: "", decision_role: "", relationship_status: ""
  });

  const [formData, setFormData] = useState({
    name: "",
    client_type: "",
    industry: "",
    website: "",
    company_size: "",
    hq_location: "",
    pan_gst_number: "",
    lead_source: "",
    account_owner_id: "",
    sales_stage: "Prospecting",
    deal_value: "",
    deal_currency: "INR",
    target_close_date: "",
    probability_to_close: "",
    notes: "",
    products_interested: [] as number[],
    pricing_model: "",
    custom_requirements: "",
    tc_compliance_status: "",
    onboarding_status: "",
    csm_assigned: "",
    support_channels: [] as string[],
    renewal_date: "",
  });

  const handleInputChange = (field: string, value: string | number[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSupportChannelToggle = (channel: string) => {
    setFormData(prev => ({
      ...prev,
      support_channels: prev.support_channels.includes(channel)
        ? prev.support_channels.filter(c => c !== channel)
        : [...prev.support_channels, channel]
    }));
  };

  const addStakeholder = () => {
    if (newStakeholder.name.trim()) {
      setStakeholders([...stakeholders, { ...newStakeholder }]);
      setNewStakeholder({
        name: "", email: "", phone: "", designation: "", decision_role: "", relationship_status: ""
      });
    }
  };

  const removeStakeholder = (index: number) => {
    setStakeholders(stakeholders.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          deal_value: formData.deal_value ? parseFloat(formData.deal_value) : null,
          probability_to_close: formData.probability_to_close ? parseInt(formData.probability_to_close) : null,
          account_owner_id: formData.account_owner_id ? parseInt(formData.account_owner_id) : null,
        }),
      });

      if (!response.ok) throw new Error('Failed to create client');

      const result = await response.json();
      
      if (stakeholders.length > 0) {
        await fetch(`/api/clients/${result.id}/stakeholders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stakeholders }),
        });
      }
      
      toast({ title: "Success", description: "Client created successfully!" });
      router.push('/clients');
    } catch (error) {
      console.error('Error creating client:', error);
      toast({
        title: "Error",
        description: "Failed to create client. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  return (
    <AppLayout>
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Add New Client</h1>
            <p className="text-gray-600 mt-2">Create a comprehensive client record</p>
          </div>

          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="basic" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="sales">Sales Info</TabsTrigger>
                <TabsTrigger value="stakeholders">Stakeholders</TabsTrigger>
                <TabsTrigger value="additional">Additional</TabsTrigger>
              </TabsList>

              <TabsContent value="basic">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>Essential client details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Client Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="Enter client name"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="client_type">Client Type</Label>
                        <Select
                          value={formData.client_type}
                          onValueChange={(value) => handleInputChange('client_type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select client type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Enterprise">Enterprise</SelectItem>
                            <SelectItem value="SMB">SMB</SelectItem>
                            <SelectItem value="Startup">Startup</SelectItem>
                            <SelectItem value="Government">Government</SelectItem>
                            <SelectItem value="Non-Profit">Non-Profit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="industry">Industry</Label>
                        <Input
                          id="industry"
                          value={formData.industry}
                          onChange={(e) => handleInputChange('industry', e.target.value)}
                          placeholder="e.g., Technology, Healthcare"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={formData.website}
                          onChange={(e) => handleInputChange('website', e.target.value)}
                          placeholder="https://example.com"
                          type="url"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="company_size">Company Size</Label>
                        <Select
                          value={formData.company_size}
                          onValueChange={(value) => handleInputChange('company_size', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select company size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1-10">1-10 employees</SelectItem>
                            <SelectItem value="11-50">11-50 employees</SelectItem>
                            <SelectItem value="51-200">51-200 employees</SelectItem>
                            <SelectItem value="201-1000">201-1000 employees</SelectItem>
                            <SelectItem value="1000+">1000+ employees</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="hq_location">HQ Location</Label>
                        <Input
                          id="hq_location"
                          value={formData.hq_location}
                          onChange={(e) => handleInputChange('hq_location', e.target.value)}
                          placeholder="e.g., Mumbai, India"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pan_gst_number">PAN/GST Number</Label>
                        <Input
                          id="pan_gst_number"
                          value={formData.pan_gst_number}
                          onChange={(e) => handleInputChange('pan_gst_number', e.target.value)}
                          placeholder="Enter PAN or GST number"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lead_source">Lead Source</Label>
                        <Select
                          value={formData.lead_source}
                          onValueChange={(value) => handleInputChange('lead_source', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select lead source" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Website">Website</SelectItem>
                            <SelectItem value="Referral">Referral</SelectItem>
                            <SelectItem value="Cold Call">Cold Call</SelectItem>
                            <SelectItem value="Social Media">Social Media</SelectItem>
                            <SelectItem value="Trade Show">Trade Show</SelectItem>
                            <SelectItem value="Partner">Partner</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sales">
                <Card>
                  <CardHeader>
                    <CardTitle>Sales Information</CardTitle>
                    <CardDescription>Sales pipeline details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="sales_stage">Sales Stage</Label>
                        <Select
                          value={formData.sales_stage}
                          onValueChange={(value) => handleInputChange('sales_stage', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Prospecting">Prospecting</SelectItem>
                            <SelectItem value="Qualification">Qualification</SelectItem>
                            <SelectItem value="Proposal">Proposal</SelectItem>
                            <SelectItem value="Negotiation">Negotiation</SelectItem>
                            <SelectItem value="Closed Won">Closed Won</SelectItem>
                            <SelectItem value="Closed Lost">Closed Lost</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="deal_value">Deal Value</Label>
                        <Input
                          id="deal_value"
                          value={formData.deal_value}
                          onChange={(e) => handleInputChange('deal_value', e.target.value)}
                          placeholder="0.00"
                          type="number"
                          min="0"
                          step="0.01"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="deal_currency">Currency</Label>
                        <Select
                          value={formData.deal_currency}
                          onValueChange={(value) => handleInputChange('deal_currency', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INR">INR (₹)</SelectItem>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="probability_to_close">Probability to Close (%)</Label>
                        <Input
                          id="probability_to_close"
                          value={formData.probability_to_close}
                          onChange={(e) => handleInputChange('probability_to_close', e.target.value)}
                          placeholder="0"
                          type="number"
                          min="0"
                          max="100"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="target_close_date">Target Close Date</Label>
                        <Input
                          id="target_close_date"
                          value={formData.target_close_date}
                          onChange={(e) => handleInputChange('target_close_date', e.target.value)}
                          type="date"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pricing_model">Pricing Model</Label>
                        <Select
                          value={formData.pricing_model}
                          onValueChange={(value) => handleInputChange('pricing_model', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select pricing model" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Subscription">Subscription</SelectItem>
                            <SelectItem value="One-time">One-time</SelectItem>
                            <SelectItem value="Usage-based">Usage-based</SelectItem>
                            <SelectItem value="Custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="renewal_date">Renewal Date</Label>
                        <Input
                          id="renewal_date"
                          value={formData.renewal_date}
                          onChange={(e) => handleInputChange('renewal_date', e.target.value)}
                          type="date"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="stakeholders">
                <Card>
                  <CardHeader>
                    <CardTitle>Stakeholders</CardTitle>
                    <CardDescription>Key contacts and decision makers</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-4">Add New Stakeholder</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="stakeholder_name">Name *</Label>
                          <Input
                            id="stakeholder_name"
                            value={newStakeholder.name}
                            onChange={(e) => setNewStakeholder(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter stakeholder name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="stakeholder_email">Email</Label>
                          <Input
                            id="stakeholder_email"
                            value={newStakeholder.email}
                            onChange={(e) => setNewStakeholder(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="email@example.com"
                            type="email"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="stakeholder_phone">Phone</Label>
                          <Input
                            id="stakeholder_phone"
                            value={newStakeholder.phone}
                            onChange={(e) => setNewStakeholder(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="+91 98765 43210"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="stakeholder_designation">Designation</Label>
                          <Input
                            id="stakeholder_designation"
                            value={newStakeholder.designation}
                            onChange={(e) => setNewStakeholder(prev => ({ ...prev, designation: e.target.value }))}
                            placeholder="e.g., CEO, CTO"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="stakeholder_decision_role">Decision Role</Label>
                          <Select
                            value={newStakeholder.decision_role}
                            onValueChange={(value) => setNewStakeholder(prev => ({ ...prev, decision_role: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select decision role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Decision Maker">Decision Maker</SelectItem>
                              <SelectItem value="Influencer">Influencer</SelectItem>
                              <SelectItem value="User">User</SelectItem>
                              <SelectItem value="Champion">Champion</SelectItem>
                              <SelectItem value="Gatekeeper">Gatekeeper</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="stakeholder_relationship">Relationship Status</Label>
                          <Select
                            value={newStakeholder.relationship_status}
                            onValueChange={(value) => setNewStakeholder(prev => ({ ...prev, relationship_status: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select relationship status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Positive">Positive</SelectItem>
                              <SelectItem value="Neutral">Neutral</SelectItem>
                              <SelectItem value="Negative">Negative</SelectItem>
                              <SelectItem value="Unknown">Unknown</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Button
                        type="button"
                        onClick={addStakeholder}
                        className="mt-4"
                        disabled={!newStakeholder.name.trim()}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Stakeholder
                      </Button>
                    </div>

                    {stakeholders.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="font-medium">Added Stakeholders</h4>
                        {stakeholders.map((stakeholder, index) => (
                          <div key={index} className="border rounded-lg p-4 flex justify-between items-start">
                            <div className="flex-1">
                              <h5 className="font-medium">{stakeholder.name}</h5>
                              <p className="text-sm text-gray-600">{stakeholder.designation}</p>
                              <p className="text-sm text-gray-600">{stakeholder.email}</p>
                              <p className="text-sm text-gray-600">{stakeholder.phone}</p>
                              <div className="flex gap-2 mt-2">
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  {stakeholder.decision_role}
                                </span>
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                  {stakeholder.relationship_status}
                                </span>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeStakeholder(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="additional">
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Information</CardTitle>
                    <CardDescription>Compliance, onboarding, and support details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="tc_compliance_status">TC Compliance Status</Label>
                        <Select
                          value={formData.tc_compliance_status}
                          onValueChange={(value) => handleInputChange('tc_compliance_status', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select compliance status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Not Required">Not Required</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="onboarding_status">Onboarding Status</Label>
                        <Select
                          value={formData.onboarding_status}
                          onValueChange={(value) => handleInputChange('onboarding_status', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select onboarding status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Not Started">Not Started</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="On Hold">On Hold</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="csm_assigned">CSM Assigned</Label>
                        <Input
                          id="csm_assigned"
                          value={formData.csm_assigned}
                          onChange={(e) => handleInputChange('csm_assigned', e.target.value)}
                          placeholder="Enter CSM name"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Support Channels</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {['Email', 'Phone', 'Chat', 'WhatsApp', 'Video Call', 'On-site'].map((channel) => (
                          <div key={channel} className="flex items-center space-x-2">
                            <Checkbox
                              id={`channel-${channel}`}
                              checked={formData.support_channels.includes(channel)}
                              onCheckedChange={() => handleSupportChannelToggle(channel)}
                            />
                            <Label htmlFor={`channel-${channel}`}>{channel}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="custom_requirements">Custom Requirements</Label>
                      <Textarea
                        id="custom_requirements"
                        value={formData.custom_requirements}
                        onChange={(e) => handleInputChange('custom_requirements', e.target.value)}
                        placeholder="Any specific requirements or customizations needed..."
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        placeholder="Additional notes about this client..."
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-4 mt-8">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Create Client
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
