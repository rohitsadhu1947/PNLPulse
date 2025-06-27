"use client";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, DollarSign, TrendingUp } from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  if (status === "loading") {
    return null;
  }

  // Only show sign-in prompt if not authenticated
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Sales Dashboard
        </h1>
        
        {session?.user ? (
          <div className="space-y-6">
            <p className="text-xl text-gray-600">
              Hello, {session.user.name || session.user.email}!
            </p>
            
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Quick Access</CardTitle>
                <CardDescription>
                  Get started with your sales management
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full" 
                  onClick={() => window.location.href = '/dashboard'}
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Button>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="text-center p-4 bg-white rounded-lg shadow">
                <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-semibold">Client Management</h3>
                <p className="text-sm text-gray-600">Manage your client relationships</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <h3 className="font-semibold">Sales Tracking</h3>
                <p className="text-sm text-gray-600">Monitor revenue and performance</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <h3 className="font-semibold">Lead Generation</h3>
                <p className="text-sm text-gray-600">Track and convert leads</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-xl text-gray-600">
              Please log in to access the sales management platform.
            </p>
            <Button 
              size="lg"
              onClick={() => router.push('/auth/signin')}
            >
              Sign In
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}