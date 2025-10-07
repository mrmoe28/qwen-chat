import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/icons";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/50">
      {/* Navigation */}
      <nav className="border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Icon name="shield" className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">Ledgerflow</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
              Professional Invoicing
              <span className="text-primary block">Made Simple</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Streamline your billing with Square-powered payments, automated reminders, and real-time analytics. 
              Get paid faster and focus on what matters most.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="px-8 py-3">
                <Link href="/guest">
                  Try Free - No Signup Required
                  <Icon name="arrowRight" className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="px-8 py-3">
                <Link href="/sign-up">
                  Sign Up for Full Access
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Create 3 professional invoices instantly • No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Everything you need to get paid
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed for service professionals and small businesses
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Icon name="creditCard" className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Square Integration</CardTitle>
                <CardDescription>
                  Accept payments securely with Square&apos;s trusted payment processing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Icon name="check" className="h-4 w-4 text-green-600" />
                    Credit & debit cards
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon name="check" className="h-4 w-4 text-green-600" />
                    Digital wallets
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon name="check" className="h-4 w-4 text-green-600" />
                    Instant deposits
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Icon name="bell" className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Smart Reminders</CardTitle>
                <CardDescription>
                  Automated email notifications to keep payments on track
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Icon name="check" className="h-4 w-4 text-green-600" />
                    Payment due alerts
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon name="check" className="h-4 w-4 text-green-600" />
                    Overdue notifications
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon name="check" className="h-4 w-4 text-green-600" />
                    Custom templates
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Icon name="barChart" className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Revenue Analytics</CardTitle>
                <CardDescription>
                  Track your cash flow and business performance in real-time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Icon name="check" className="h-4 w-4 text-green-600" />
                    Revenue tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon name="check" className="h-4 w-4 text-green-600" />
                    Payment insights
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon name="check" className="h-4 w-4 text-green-600" />
                    Customer analytics
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary rounded-2xl px-8 py-12 text-center text-primary-foreground">
            <h2 className="text-3xl font-bold mb-4">
              Ready to streamline your invoicing?
            </h2>
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
              Join thousands of service professionals who trust Ledgerflow to manage their billing and get paid faster today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild className="px-8 py-3">
                <Link href="/guest">
                  Try Free Now
                  <Icon name="arrowRight" className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="px-8 py-3 bg-white/10 hover:bg-white/20">
                <Link href="/sign-up">
                  Full Access Trial
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Icon name="shield" className="h-6 w-6 text-primary" />
              <span className="font-semibold">Ledgerflow</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <Link href="/sign-in" className="hover:text-foreground transition-colors">
                Sign In
              </Link>
              <Link href="/sign-up" className="hover:text-foreground transition-colors">
                Sign Up
              </Link>
              <a href="mailto:hello@ledgerflow.app" className="hover:text-foreground transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
