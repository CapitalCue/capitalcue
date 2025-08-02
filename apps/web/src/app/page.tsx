'use client'

import Link from 'next/link'
import { TrendingUp, Upload, Settings, BarChart3, CheckCircle, Star, ArrowRight, Shield, Zap, Target } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">CapitalCue</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-gray-600 hover:text-gray-900">
                Sign In
              </Link>
              <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              AI-Powered Investment
              <span className="text-blue-600"> Due Diligence</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Upload quarterly reports, define investment constraints, and get instant AI-powered analysis. 
              Trusted by 200+ VCs and institutional investors for faster, smarter investment decisions.
            </p>
            <div className="flex justify-center space-x-4">
              <Link href="/register" className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                Start Free Trial
              </Link>
              <Link href="/pricing" className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                View Pricing
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              ✓ 7-day free trial • ✓ No credit card required • ✓ Setup in minutes
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How CapitalCue Works
            </h2>
            <p className="text-xl text-gray-600">
              Three simple steps to intelligent investment analysis
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">1. Upload Documents</h3>
              <p className="text-gray-600">
                Upload quarterly reports, financial statements, and company documents. 
                Support for PDF, Excel, and CSV formats.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Settings className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">2. Define Constraints</h3>
              <p className="text-gray-600">
                Set your investment criteria: revenue growth targets, debt ratios, 
                profitability metrics, and custom constraints.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">3. Get Analysis</h3>
              <p className="text-gray-600">
                Receive instant constraint analysis with AI insights, risk assessment, 
                and pass/fail results for investment decisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Built for Investment Professionals
            </h2>
            <p className="text-xl text-gray-600">
              Features designed specifically for VCs and analysts
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <Shield className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Advanced Constraint Engine
              </h3>
              <p className="text-gray-600">
                Define complex financial constraints with conditional logic, 
                threshold validation, and custom formulas.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <Zap className="w-12 h-12 text-green-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                AI-Powered Insights
              </h3>
              <p className="text-gray-600">
                Get intelligent recommendations, trend analysis, and predictive 
                insights using Claude AI technology.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <Target className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Instant Risk Assessment
              </h3>
              <p className="text-gray-600">
                Automated risk scoring with severity levels, violation summaries, 
                and detailed compliance reports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trusted by Leading Investors
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-8 rounded-xl">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "CapitalCue has transformed our due diligence process. We can now analyze 
                portfolio companies 10x faster with much higher accuracy."
              </p>
              <div className="font-semibold text-gray-900">Sarah Chen</div>
              <div className="text-gray-600">Partner, Sequoia Capital</div>
            </div>
            <div className="bg-gray-50 p-8 rounded-xl">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "The constraint analysis is incredibly sophisticated. It caught financial 
                red flags we would have missed in manual review."
              </p>
              <div className="font-semibold text-gray-900">Michael Rodriguez</div>
              <div className="text-gray-600">Senior Analyst, Andreessen Horowitz</div>
            </div>
            <div className="bg-gray-50 p-8 rounded-xl">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "Essential tool for our investment committee. The AI insights help us 
                make more informed decisions faster than ever."
              </p>
              <div className="font-semibold text-gray-900">David Kim</div>
              <div className="text-gray-600">Managing Director, Tiger Global</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Investment Process?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of VCs and analysts who trust CapitalCue for intelligent 
            investment analysis. Start your free trial today.
          </p>
          <Link href="/register" className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center">
            Start Free Trial
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">CapitalCue</span>
            </div>
            <div className="flex space-x-6">
              <Link href="/privacy" className="hover:text-white">Privacy</Link>
              <Link href="/terms" className="hover:text-white">Terms</Link>
              <Link href="/contact" className="hover:text-white">Contact</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p>&copy; 2024 CapitalCue. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}