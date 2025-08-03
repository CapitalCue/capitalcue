import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Clock, Users } from "lucide-react";
import PricingCard from "@/components/pricing/PricingCard";
import BillingToggle from "@/components/pricing/BillingToggle";
import FeaturesTable from "@/components/pricing/FeaturesTable";
import PricingFAQ from "@/components/pricing/PricingFAQ";
import { pricingPlans } from "@/lib/pricingData";

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/5 to-background py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Choose Your Investment Analysis Plan
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Streamline your due diligence process with AI-powered constraint analysis
            </p>
            
            <BillingToggle isAnnual={isAnnual} onToggle={setIsAnnual} />
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 -mt-8">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <PricingCard key={index} plan={plan} isAnnual={isAnnual} />
          ))}
        </div>
      </div>

      {/* Features Comparison Table */}
      <div className="container mx-auto px-4">
        <FeaturesTable />
      </div>

      {/* Trust Indicators */}
      <div className="container mx-auto px-4 mt-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Trusted by 200+ VC Firms</h3>
              <p className="text-sm text-muted-foreground">Leading investment firms rely on CapitalCue</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">SOC 2 & GDPR Compliant</h3>
              <p className="text-sm text-muted-foreground">Enterprise-grade security and privacy</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <Clock className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">99.9% Uptime Guarantee</h3>
              <p className="text-sm text-muted-foreground">Reliable service you can count on</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="container mx-auto px-4">
        <PricingFAQ />
      </div>

      {/* Call-to-Action Section */}
      <div className="bg-gradient-to-r from-primary/10 to-primary-glow/10 py-16 mt-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Start Your Free 14-Day Trial
          </h2>
          <p className="text-xl text-muted-foreground mb-6">
            No credit card required • Setup takes less than 5 minutes
          </p>
          <Button size="lg" className="px-8">
            Get Started Today
          </Button>
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-background py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Need a custom plan?
          </h2>
          <p className="text-muted-foreground mb-6">
            Contact our sales team to discuss your specific requirements
          </p>
          <Button variant="outline">
            Contact Sales
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Pricing;