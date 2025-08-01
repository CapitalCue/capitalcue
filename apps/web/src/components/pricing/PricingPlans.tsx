import React, { useState } from 'react';
import { Check, X, Star, Crown, Building, Zap } from 'lucide-react';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  yearlyPrice: number;
  description: string;
  icon: React.ReactNode;
  popular?: boolean;
  features: string[];
  limitations: string[];
  cta: string;
  badge?: string;
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 49,
    yearlyPrice: 490, // 2 months free
    description: 'Perfect for individual investors and analysts',
    icon: <Zap className="w-6 h-6" />,
    features: [
      '50 documents per month',
      '10 active constraints',
      'Basic AI analysis',
      'Email support',
      'Standard templates',
      'Dashboard analytics',
      'Export to PDF/CSV'
    ],
    limitations: [
      'Single user account',
      'Basic AI models only',
      'Email support only'
    ],
    cta: 'Start Free Trial'
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 199,
    yearlyPrice: 1990, // 2 months free
    description: 'For small VC firms and investment teams',
    icon: <Star className="w-6 h-6" />,
    popular: true,
    badge: 'Most Popular',
    features: [
      '500 documents per month',
      '100 active constraints',
      'Advanced AI analysis',
      'Priority email & chat support',
      'Custom constraint templates',
      'Team collaboration (5 users)',
      'Advanced dashboard',
      'API access (basic)',
      'White-label reports',
      'Data export & backup'
    ],
    limitations: [
      'Up to 5 team members',
      'Standard integrations only'
    ],
    cta: 'Start Professional Trial'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 999,
    yearlyPrice: 9990, // 2 months free
    description: 'For large VC/PE firms and institutions',
    icon: <Crown className="w-6 h-6" />,
    features: [
      'Unlimited documents',
      'Unlimited constraints',
      'Custom AI models',
      'Dedicated support manager',
      'Custom templates & workflows',
      'Unlimited team members',
      'Advanced analytics & reporting',
      'Full API access',
      'White-label platform',
      'Custom integrations',
      'SSO & advanced security',
      'On-premise deployment option'
    ],
    limitations: [],
    cta: 'Contact Sales'
  },
  {
    id: 'custom',
    name: 'Custom Enterprise',
    price: 0, // Custom pricing
    yearlyPrice: 0,
    description: 'Tailored solutions for Fortune 500 companies',
    icon: <Building className="w-6 h-6" />,
    badge: 'Custom Pricing',
    features: [
      'Everything in Enterprise',
      'Custom development',
      'Dedicated infrastructure',
      '24/7 phone support',
      'Custom compliance certifications',
      'Advanced security features',
      'Custom SLA agreements',
      'On-site training & setup'
    ],
    limitations: [],
    cta: 'Schedule Consultation'
  }
];

const PricingPlans: React.FC = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    // Trigger payment flow or trial signup
    if (planId === 'enterprise' || planId === 'custom') {
      // Redirect to contact form
      window.location.href = '/contact?plan=' + planId;
    } else {
      // Redirect to signup with plan selection
      window.location.href = '/signup?plan=' + planId + '&billing=' + billingPeriod;
    }
  };

  const formatPrice = (plan: PricingPlan) => {
    if (plan.price === 0) return 'Custom';
    
    const price = billingPeriod === 'yearly' ? plan.yearlyPrice / 12 : plan.price;
    return `$${Math.round(price)}`;
  };

  const getSavings = (plan: PricingPlan) => {
    if (plan.price === 0) return null;
    const monthlyTotal = plan.price * 12;
    const savings = monthlyTotal - plan.yearlyPrice;
    return savings;
  };

  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Choose the perfect CapitalCue plan for your investment analysis needs
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-8">
            <span className={`mr-3 ${billingPeriod === 'monthly' ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                billingPeriod === 'yearly' ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`ml-3 ${billingPeriod === 'yearly' ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
              Yearly
            </span>
            {billingPeriod === 'yearly' && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Save 17%
              </span>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
                plan.popular
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Popular Badge */}
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className={`inline-flex items-center px-4 py-1 rounded-full text-sm font-medium ${
                    plan.popular
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-900 text-white'
                  }`}>
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="p-8">
                {/* Plan Header */}
                <div className="text-center mb-8">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${
                    plan.popular
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {plan.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-gray-600 mt-2">{plan.description}</p>
                </div>

                {/* Pricing */}
                <div className="text-center mb-8">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900">
                      {formatPrice(plan)}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-gray-500 ml-2">
                        /{billingPeriod === 'yearly' ? 'month' : 'month'}
                      </span>
                    )}
                  </div>
                  {billingPeriod === 'yearly' && plan.price > 0 && (
                    <div className="mt-2">
                      <span className="text-sm text-gray-500">
                        Billed yearly (${plan.yearlyPrice})
                      </span>
                      {getSavings(plan) && (
                        <div className="text-sm text-green-600 font-medium">
                          Save ${getSavings(plan)} per year
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                  {plan.limitations.map((limitation, index) => (
                    <div key={index} className="flex items-start">
                      <X className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-500">{limitation}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handlePlanSelect(plan.id)}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors duration-200 ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {plan.cta}
                </button>

                {/* Free Trial Note */}
                {(plan.id === 'starter' || plan.id === 'professional') && (
                  <p className="text-center text-sm text-gray-500 mt-3">
                    7-day free trial • No credit card required
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">
            Frequently Asked Questions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left max-w-4xl mx-auto">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Can I change plans anytime?
              </h4>
              <p className="text-gray-600">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and billing is prorated.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                What payment methods do you accept?
              </h4>
              <p className="text-gray-600">
                We accept all major credit cards, ACH transfers, and wire transfers for enterprise plans.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Is there a free trial?
              </h4>
              <p className="text-gray-600">
                Yes, we offer a 7-day free trial for Starter and Professional plans with full access to features.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                What happens to my data if I cancel?
              </h4>
              <p className="text-gray-600">
                You can export all your data anytime. After cancellation, we retain your data for 30 days for reactivation.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-16 text-center bg-white rounded-2xl p-8 shadow-lg">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Need a Custom Solution?
          </h3>
          <p className="text-gray-600 mb-6">
            We work with Fortune 500 companies and large investment firms to create tailored solutions.
          </p>
          <button
            onClick={() => window.location.href = '/contact?type=enterprise'}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800"
          >
            Contact Enterprise Sales
          </button>
        </div>
      </div>
    </div>
  );
};

export default PricingPlans;