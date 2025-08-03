import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PricingPlan } from "@/lib/pricingData";

interface PricingCardProps {
  plan: PricingPlan;
  isAnnual: boolean;
}

const PricingCard = ({ plan, isAnnual }: PricingCardProps) => {
  const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
  const savings = isAnnual ? plan.monthlyPrice - plan.annualPrice : 0;

  return (
    <Card className={`relative h-full ${plan.popular ? 'border-primary shadow-lg scale-105' : 'border-border'}`}>
      {plan.popular && (
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
          Most Popular
        </Badge>
      )}
      
      <CardHeader className="text-center pb-4">
        <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>
        <div className="space-y-2">
          <div className="flex items-baseline justify-center">
            <span className="text-4xl font-bold text-foreground">${price}</span>
            <span className="text-muted-foreground ml-1">/month</span>
          </div>
          {isAnnual && savings > 0 && (
            <div className="text-sm text-success">
              Save ${savings}/month
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-2">{plan.target}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
              <span className="text-sm text-foreground">{feature}</span>
            </li>
          ))}
        </ul>

        <Button 
          className="w-full mt-6" 
          variant={plan.buttonVariant === 'primary' ? 'default' : 'outline'}
        >
          {plan.buttonText}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PricingCard;