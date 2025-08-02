import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { TrendingUp, ArrowRight, Check, Star, Users, Shield, Zap } from 'lucide-react';

const HomePage: React.FC = () => {
  return (
    <>
      <Head>
        <title>CapitalCue - AI-Powered Financial Analysis Platform</title>
        <meta 
          name="description" 
          content="Transform your investment decisions with CapitalCue's AI-powered financial analysis. Built for VCs, investors, and financial professionals." 
        />
        <meta name="keywords" content="financial analysis, VC software, investment tools, AI finance, constraint analysis" />
        <meta property="og:title" content="CapitalCue - AI-Powered Financial Analysis Platform" />
        <meta property="og:description" content="Transform your investment decisions with AI-powered financial analysis." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">CapitalCue</span>
            </Link>
            
            <div className="hidden md:flex space-x-8">
              <Link href="/pricing" className="text-gray-700 hover:text-gray-900">Pricing</Link>
              <Link href="/contact" className="text-gray-700 hover:text-gray-900">Contact</Link>
            </div>

            <div className="flex space-x-4">
              <Link 
                href="/signup" 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            AI-Powered Financial
            <span className="text-blue-600 block">Analysis Platform</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Transform your investment decisions with intelligent constraint analysis, 
            automated document processing, and AI-driven insights. Built for VCs, 
            investors, and financial professionals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link 
              href="/signup?plan=professional" 
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link 
              href="/demo" 
              className="border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:border-gray-400 transition-colors"
            >
              Watch Demo
            </Link>
          </div>
          <p className="text-sm text-gray-500">
            ✓ 7-day free trial • ✓ No credit card required • ✓ Cancel anytime
          </p>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need for smarter investments
            </h2>
            <p className="text-xl text-gray-600">
              Powerful features designed for modern investment professionals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-blue-100 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">AI-Powered Analysis</h3>
              <p className="text-gray-600">
                Advanced AI processes financial documents and provides intelligent insights
                using Claude API integration.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-green-100 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Enterprise Security</h3>
              <p className="text-gray-600">
                Bank-grade encryption, audit logs, and compliance features
                built for institutional requirements.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-purple-100 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Team Collaboration</h3>
              <p className="text-gray-600">
                Share analyses, collaborate on constraints, and maintain
                consistency across your investment team.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Preview */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            Choose the perfect plan for your investment analysis needs
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Starter */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
              <div className="text-4xl font-bold text-gray-900 mb-4">$49<span className="text-lg text-gray-600">/month</span></div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center"><Check className="w-5 h-5 text-green-500 mr-2" />50 documents/month</li>
                <li className="flex items-center"><Check className="w-5 h-5 text-green-500 mr-2" />10 constraints</li>
                <li className="flex items-center"><Check className="w-5 h-5 text-green-500 mr-2" />Basic AI analysis</li>
              </ul>
              <Link href="/signup?plan=starter" className="w-full bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors block text-center">
                Start Free Trial
              </Link>
            </div>

            {/* Professional */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-blue-500 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">Most Popular</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Professional</h3>
              <div className="text-4xl font-bold text-gray-900 mb-4">$199<span className="text-lg text-gray-600">/month</span></div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center"><Check className="w-5 h-5 text-green-500 mr-2" />500 documents/month</li>
                <li className="flex items-center"><Check className="w-5 h-5 text-green-500 mr-2" />100 constraints</li>
                <li className="flex items-center"><Check className="w-5 h-5 text-green-500 mr-2" />Advanced AI analysis</li>
                <li className="flex items-center"><Check className="w-5 h-5 text-green-500 mr-2" />Team collaboration</li>
              </ul>
              <Link href="/signup?plan=professional" className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors block text-center">
                Start Free Trial
              </Link>
            </div>

            {/* Enterprise */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
              <div className="text-4xl font-bold text-gray-900 mb-4">$999<span className="text-lg text-gray-600">/month</span></div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center"><Check className="w-5 h-5 text-green-500 mr-2" />Unlimited documents</li>
                <li className="flex items-center"><Check className="w-5 h-5 text-green-500 mr-2" />Unlimited constraints</li>
                <li className="flex items-center"><Check className="w-5 h-5 text-green-500 mr-2" />Custom AI models</li>
                <li className="flex items-center"><Check className="w-5 h-5 text-green-500 mr-2" />Dedicated support</li>
              </ul>
              <Link href="/contact?plan=enterprise" className="w-full bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors block text-center">
                Contact Sales
              </Link>
            </div>
          </div>

          <div className="mt-8">
            <Link href="/pricing" className="text-blue-600 hover:text-blue-700 font-medium">
              View detailed pricing comparison →
            </Link>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to transform your investment process?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of investment professionals who trust CapitalCue for critical financial decisions.
          </p>
          <Link 
            href="/signup?plan=professional" 
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors inline-flex items-center"
          >
            Start Your Free Trial
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
          <p className="text-sm text-blue-100 mt-4">
            7-day free trial • No credit card required • Cancel anytime
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <Link href="/" className="flex items-center space-x-2 mb-4">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold">CapitalCue</span>
              </Link>
              <p className="text-gray-400 mb-4">
                AI-powered financial analysis platform for investment professionals.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/pricing">Pricing</Link></li>
                <li><Link href="/features">Features</Link></li>
                <li><Link href="/demo">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about">About</Link></li>
                <li><Link href="/contact">Contact</Link></li>
                <li><Link href="/careers">Careers</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            © 2024 CapitalCue. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
};

export default HomePage;