import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminSignInForm } from "@/components/forms/admin-sign-in-form";

export default function AdminSignInPage() {
  return (
    <div className="min-h-screen bg-muted/50 px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Admin Access</h1>
          <p className="text-muted-foreground mt-2">
            Administrator sign-in for Ledgerflow
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Admin Sign In</CardTitle>
            <CardDescription>
              Enter your admin credentials to access the full platform without subscription limits.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminSignInForm />
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Link href="/sign-in">
            <Button variant="outline" size="sm">
              ← Regular Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}