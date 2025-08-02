import React from 'react';
import Head from 'next/head';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import PricingPlans from '../components/pricing/PricingPlans';
import { Shield, Clock, Users, Zap } from 'lucide-react';

const benefits = [
  {
    icon: <Shield className="w-8 h-8 text-blue-600" />,
    title: 'Enterprise Security',
    description: 'Bank-grade encryption, audit logs, and compliance features built-in from day one.'
  },
  {
    icon: <Clock className="w-8 h-8 text-green-600" />,
    title: 'Save 10+ Hours Weekly',
    description: 'Automate financial analysis and constraint evaluation with AI-powered insights.'
  },
  {
    icon: <Users className="w-8 h-8 text-purple-600" />,
    title: 'Team Collaboration',
    description: 'Share analyses, collaborate on constraints, and maintain team consistency.'
  },
  {
    icon: <Zap className="w-8 h-8 text-orange-600" />,
    title: 'AI-Powered Analysis',
    description: 'Claude AI integration provides intelligent insights and recommendations.'
  }
];

const testimonials = [
  {
    name: 'Sarah Chen',
    title: 'Investment Principal, Accel Partners',
    content: 'This platform has transformed our due diligence process. We can analyze 10x more opportunities with the same team.',
    avatar: '/avatars/sarah-chen.jpg'
  },
  {
    name: 'Michael Rodriguez',
    title: 'Portfolio Manager, Fidelity',
    content: 'The constraint analysis features caught issues we would have missed manually. ROI was immediate.',
    avatar: '/avatars/michael-rodriguez.jpg'
  },
  {
    name: 'David Kim',
    title: 'Managing Partner, Sequoia Capital',
    content: 'Finally, a tool built specifically for investment professionals. The AI insights are remarkably accurate.',
    avatar: '/avatars/david-kim.jpg'
  }
];

const PricingPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Pricing - CapitalCue</title>
        <meta 
          name="description" 
          content="Choose the perfect CapitalCue plan for your investment analysis needs. Start with a 7-day free trial. No credit card required." 
        />
        <meta name="keywords" content="CapitalCue, pricing, financial analysis, investment tools, VC software" />
        <meta property="og:title" content="Pricing - CapitalCue" />
        <meta property="og:description" content="Choose the perfect CapitalCue plan for your investment analysis needs. Start with a 7-day free trial." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <Header />
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Pricing That Scales With You
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              From individual investors to Fortune 500 firms, we have a plan that fits your needs. 
              Start with a free trial and upgrade as you grow.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-2 text-green-600" />
                <span>7-day free trial</span>
              </div>
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-2 text-green-600" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-2 text-green-600" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Pricing Section */}
        <PricingPlans />

        {/* Benefits Section */}
        <div className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Why Choose Our Platform?
              </h2>
              <p className="text-xl text-gray-600">
                Built specifically for investment professionals who demand accuracy and speed
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-4">
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Trusted by Investment Professionals
              </h2>
              <p className="text-xl text-gray-600">
                See what our customers are saying about the platform
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-white rounded-xl p-8 shadow-lg">
                  <p className="text-gray-700 mb-6 italic">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-300 rounded-full mr-4"></div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {testimonial.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {testimonial.title}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Feature Comparison
              </h2>
              <p className="text-xl text-gray-600">
                Compare plans side-by-side to find the perfect fit
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-6 py-4 text-left font-semibold text-gray-900">
                      Feature
                    </th>
                    <th className="border border-gray-300 px-6 py-4 text-center font-semibold text-gray-900">
                      Starter
                    </th>
                    <th className="border border-gray-300 px-6 py-4 text-center font-semibold text-gray-900 bg-blue-50">
                      Professional
                    </th>
                    <th className="border border-gray-300 px-6 py-4 text-center font-semibold text-gray-900">
                      Enterprise
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-6 py-4 font-medium">Documents per month</td>
                    <td className="border border-gray-300 px-6 py-4 text-center">50</td>
                    <td className="border border-gray-300 px-6 py-4 text-center bg-blue-50">500</td>
                    <td className="border border-gray-300 px-6 py-4 text-center">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-6 py-4 font-medium">Active constraints</td>
                    <td className="border border-gray-300 px-6 py-4 text-center">10</td>
                    <td className="border border-gray-300 px-6 py-4 text-center bg-blue-50">100</td>
                    <td className="border border-gray-300 px-6 py-4 text-center">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-6 py-4 font-medium">Team members</td>
                    <td className="border border-gray-300 px-6 py-4 text-center">1</td>
                    <td className="border border-gray-300 px-6 py-4 text-center bg-blue-50">5</td>
                    <td className="border border-gray-300 px-6 py-4 text-center">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-6 py-4 font-medium">AI Analysis</td>
                    <td className="border border-gray-300 px-6 py-4 text-center">Basic</td>
                    <td className="border border-gray-300 px-6 py-4 text-center bg-blue-50">Advanced</td>
                    <td className="border border-gray-300 px-6 py-4 text-center">Custom Models</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-6 py-4 font-medium">API Access</td>
                    <td className="border border-gray-300 px-6 py-4 text-center">❌</td>
                    <td className="border border-gray-300 px-6 py-4 text-center bg-blue-50">Basic</td>
                    <td className="border border-gray-300 px-6 py-4 text-center">Full</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-6 py-4 font-medium">Support</td>
                    <td className="border border-gray-300 px-6 py-4 text-center">Email</td>
                    <td className="border border-gray-300 px-6 py-4 text-center bg-blue-50">Priority</td>
                    <td className="border border-gray-300 px-6 py-4 text-center">Dedicated</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Transform Your Investment Analysis?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of investment professionals who trust our platform for critical financial decisions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.location.href = '/signup?plan=professional'}
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Start Free Trial
              </button>
              <button
                onClick={() => window.location.href = '/demo'}
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                Schedule Demo
              </button>
            </div>
            <p className="text-sm text-blue-100 mt-4">
              No credit card required • 7-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PricingPage;