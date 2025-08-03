export interface PricingPlan {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  popular?: boolean;
  target: string;
  features: string[];
  buttonText: string;
  buttonVariant: 'primary' | 'secondary';
}

export interface Feature {
  name: string;
  starter: string | boolean;
  professional: string | boolean;
  enterprise: string | boolean;
}

export const pricingPlans: PricingPlan[] = [
  {
    name: "Starter",
    monthlyPrice: 99,
    annualPrice: 79,
    popular: false,
    target: "Individual investors and small VCs",
    features: [
      "10 document uploads/month",
      "5 basic constraint templates",
      "Standard AI analysis",
      "PDF report exports",
      "Email support",
      "1 user account"
    ],
    buttonText: "Start Free Trial",
    buttonVariant: "secondary"
  },
  {
    name: "Professional",
    monthlyPrice: 299,
    annualPrice: 239,
    popular: true,
    target: "Growing VC firms and investment teams",
    features: [
      "100 document uploads/month",
      "20+ advanced constraint templates",
      "Priority AI analysis with insights",
      "Real-time alerts",
      "Advanced reporting & analytics",
      "API access",
      "Up to 5 user accounts",
      "Phone & email support"
    ],
    buttonText: "Start Free Trial",
    buttonVariant: "primary"
  },
  {
    name: "Enterprise",
    monthlyPrice: 799,
    annualPrice: 639,
    popular: false,
    target: "Large VC firms and institutional investors",
    features: [
      "Unlimited document uploads",
      "Custom constraint creation",
      "White-label AI reports",
      "Custom integrations & webhooks",
      "Dedicated account manager",
      "SSO and advanced security",
      "Unlimited user accounts",
      "Priority 24/7 support",
      "Custom onboarding & training"
    ],
    buttonText: "Contact Sales",
    buttonVariant: "secondary"
  }
];

export const comparisonFeatures: Feature[] = [
  {
    name: "Document uploads per month",
    starter: "10",
    professional: "100",
    enterprise: "Unlimited"
  },
  {
    name: "Constraint templates included",
    starter: "5 basic",
    professional: "20+ advanced",
    enterprise: "Custom creation"
  },
  {
    name: "AI analysis depth",
    starter: "Standard",
    professional: "Priority with insights",
    enterprise: "White-label reports"
  },
  {
    name: "User accounts",
    starter: "1",
    professional: "Up to 5",
    enterprise: "Unlimited"
  },
  {
    name: "API access",
    starter: false,
    professional: true,
    enterprise: true
  },
  {
    name: "Support level",
    starter: "Email",
    professional: "Phone & email",
    enterprise: "Priority 24/7"
  },
  {
    name: "Custom integrations",
    starter: false,
    professional: false,
    enterprise: true
  },
  {
    name: "White-label reports",
    starter: false,
    professional: false,
    enterprise: true
  },
  {
    name: "SSO/Security features",
    starter: false,
    professional: false,
    enterprise: true
  },
  {
    name: "Onboarding assistance",
    starter: false,
    professional: false,
    enterprise: "Custom training"
  }
];

export const faqData = [
  {
    question: "Can I change my plan anytime?",
    answer: "Yes, you can upgrade or downgrade your plan at any time. Changes will be prorated and reflected in your next billing cycle."
  },
  {
    question: "What happens to my data if I cancel?",
    answer: "Your data is safely stored for 90 days after cancellation, giving you time to export or reactivate your account. After 90 days, data is permanently deleted."
  },
  {
    question: "Do you offer custom enterprise pricing?",
    answer: "Yes, we offer custom pricing for large organizations with specific requirements. Contact our sales team to discuss your needs."
  },
  {
    question: "Is there a free trial?",
    answer: "Yes, all plans come with a 14-day free trial. No credit card required to start your trial."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, bank transfers, and can set up invoicing for annual enterprise plans."
  }
];