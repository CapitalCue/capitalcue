'use client'

import React, { useState } from 'react';
import { Upload, Plus, TrendingUp, FileText, AlertCircle, CheckCircle, XCircle, BarChart3, Filter, Download, Calendar, DollarSign, TrendingDown, Target } from 'lucide-react';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('analyze');

  // Professional mock data for VC/analyst use
  const recentAnalyses = [
    {
      id: 1,
      company: 'TechCorp Inc.',
      ticker: 'TECH',
      document: 'Q3 2024 Quarterly Report',
      date: '2024-01-15',
      status: 'completed',
      constraintsPassed: 7,
      totalConstraints: 10,
      overall: 'warning',
      revenue: '$2.3B',
      growth: '+23%',
      sector: 'Technology',
      investmentStage: 'Series C'
    },
    {
      id: 2,
      company: 'GrowthCo Ltd.',
      ticker: 'GROW',
      document: 'Q4 2023 Earnings Report',
      date: '2024-01-12',
      status: 'completed',
      constraintsPassed: 9,
      totalConstraints: 10,
      overall: 'pass',
      revenue: '$890M',
      growth: '+45%',
      sector: 'SaaS',
      investmentStage: 'Series B'
    },
    {
      id: 3,
      company: 'StartupXYZ',
      ticker: 'STUP',
      document: 'Q4 2023 Financial Statement',
      date: '2024-01-10',
      status: 'completed',
      constraintsPassed: 3,
      totalConstraints: 10,
      overall: 'fail',
      revenue: '$45M',
      growth: '+12%',
      sector: 'Fintech',
      investmentStage: 'Series A'
    },
    {
      id: 4,
      company: 'BioMed Solutions',
      ticker: 'BMED',
      document: 'Q3 2024 Report',
      date: '2024-01-08',
      status: 'completed',
      constraintsPassed: 6,
      totalConstraints: 8,
      overall: 'warning',
      revenue: '$120M',
      growth: '+67%',
      sector: 'Biotech',
      investmentStage: 'Series C'
    },
    {
      id: 5,
      company: 'CleanEnergy Corp',
      ticker: 'CLEN',
      document: 'Annual Report 2023',
      date: '2024-01-05',
      status: 'completed',
      constraintsPassed: 8,
      totalConstraints: 9,
      overall: 'pass',
      revenue: '$1.8B',
      growth: '+35%',
      sector: 'Clean Energy',
      investmentStage: 'Pre-IPO'
    }
  ];

  const myConstraints = [
    { id: 1, name: 'Revenue Growth > 20%', category: 'Growth', type: 'percentage', critical: true },
    { id: 2, name: 'Debt-to-Equity < 0.5', category: 'Risk', type: 'ratio', critical: true },
    { id: 3, name: 'Gross Margin > 60%', category: 'Profitability', type: 'percentage', critical: false },
    { id: 4, name: 'Current Ratio > 1.5', category: 'Liquidity', type: 'ratio', critical: false },
    { id: 5, name: 'ROE > 15%', category: 'Returns', type: 'percentage', critical: true },
    { id: 6, name: 'Burn Rate < 18 months', category: 'Runway', type: 'months', critical: true },
    { id: 7, name: 'Customer Acquisition Cost decreasing', category: 'Efficiency', type: 'trend', critical: false },
    { id: 8, name: 'Monthly Recurring Revenue > $1M', category: 'Scale', type: 'currency', critical: false },
    { id: 9, name: 'Market Cap > $500M', category: 'Valuation', type: 'currency', critical: false },
    { id: 10, name: 'Team Size > 50 employees', category: 'Operations', type: 'count', critical: false }
  ];

  const getStatusIcon = (overall: string) => {
    switch (overall) {
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (overall: string) => {
    switch (overall) {
      case 'pass':
        return 'text-green-600 bg-green-50';
      case 'fail':
        return 'text-red-600 bg-red-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Investment Analysis Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Analyze company quarterly reports against your investment constraints
            </p>
          </div>
          <div className="mt-4 lg:mt-0 flex space-x-3">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              New Analysis
            </button>
            <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Analyses</p>
              <p className="text-2xl font-bold text-gray-900">127</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pass Rate</p>
              <p className="text-2xl font-bold text-gray-900">68%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Constraints</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Deal Size</p>
              <p className="text-2xl font-bold text-gray-900">$2.4M</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('analyze')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analyze'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            New Analysis
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Analysis History
          </button>
          <button
            onClick={() => setActiveTab('constraints')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'constraints'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            My Constraints
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'analyze' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Upload Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                📊 Upload Company Documents
              </h2>
              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Step 1</span>
            </div>
            
            <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer bg-blue-50/30">
              <Upload className="mx-auto h-12 w-12 text-blue-500 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Drop quarterly reports or financial documents here
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Supports 10-K, 10-Q, earnings reports, investor decks (PDF, Excel, up to 100MB)
              </p>
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Select Documents
              </button>
              <p className="text-xs text-gray-400 mt-2">or drag and drop files here</p>
            </div>
            
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">📈 Quarterly Reports</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Q1, Q2, Q3, Q4 earnings reports</li>
                  <li>• SEC 10-Q filings</li>
                  <li>• Quarterly investor presentations</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">📋 Financial Statements</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Income statements</li>
                  <li>• Balance sheets</li>
                  <li>• Cash flow statements</li>
                </ul>
              </div>
            </div>

            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                🔒 All documents are encrypted and processed securely. Data is automatically extracted and analyzed.
              </p>
            </div>
          </div>

          {/* Constraints Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                🎯 Select Investment Constraints
              </h2>
              <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">Step 2</span>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-3">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Quick Filters:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Critical Only</button>
                <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Growth Stage</button>
                <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Risk Metrics</button>
              </div>
            </div>

            <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
              {myConstraints.slice(0, 6).map((constraint) => (
                <label key={constraint.id} className="flex items-center p-2 rounded hover:bg-gray-50">
                  <input
                    type="checkbox"
                    defaultChecked={constraint.critical}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">{constraint.name}</span>
                      {constraint.critical && (
                        <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">Critical</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded mt-1 inline-block">
                      {constraint.category}
                    </span>
                  </div>
                </label>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center text-sm">
                <Plus className="w-4 h-4 mr-2" />
                Custom Rule
              </button>
              <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center text-sm">
                📋 Templates
              </button>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">Selected: 4 constraints</span>
                <span className="text-sm text-gray-600">Est. time: ~30s</span>
              </div>
              <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors font-medium shadow-lg">
                ⚡ Analyze Now
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Investment Analysis History</h2>
              <p className="text-sm text-gray-600 mt-1">Track all your company evaluations and decisions</p>
            </div>
            <div className="flex space-x-3">
              <button className="text-sm border border-gray-300 px-3 py-1 rounded-lg hover:bg-gray-50 flex items-center">
                <Filter className="w-4 h-4 mr-1" />
                Filter
              </button>
              <button className="text-sm border border-gray-300 px-3 py-1 rounded-lg hover:bg-gray-50 flex items-center">
                <Download className="w-4 h-4 mr-1" />
                Export
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Financial Metrics
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Analysis Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Constraint Results
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Investment Decision
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentAnalyses.map((analysis) => (
                  <tr key={analysis.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{analysis.company}</div>
                          <div className="text-xs text-gray-500">{analysis.ticker} • {analysis.sector}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{analysis.revenue}</div>
                      <div className="flex items-center">
                        <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                        <span className="text-xs text-green-600 font-medium">{analysis.growth}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{analysis.document}</div>
                      <div className="text-xs text-gray-500">{analysis.investmentStage}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-500">{analysis.date}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {analysis.constraintsPassed}/{analysis.totalConstraints} passed
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className={`h-2 rounded-full ${
                            analysis.overall === 'pass' ? 'bg-green-500' : 
                            analysis.overall === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${(analysis.constraintsPassed / analysis.totalConstraints) * 100}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(analysis.overall)}`}>
                        {getStatusIcon(analysis.overall)}
                        <span className="ml-1 capitalize">
                          {analysis.overall === 'pass' ? 'Recommend' : 
                           analysis.overall === 'warning' ? 'Review' : 'Decline'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">View</button>
                        <button className="text-gray-400 hover:text-gray-600">Share</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'constraints' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* My Constraints */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">My Constraints</h2>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                Add New
              </button>
            </div>
            
            <div className="space-y-3">
              {myConstraints.map((constraint) => (
                <div key={constraint.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{constraint.name}</p>
                    <p className="text-sm text-gray-500">{constraint.category}</p>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Constraint Templates */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Popular Templates</h2>
            
            <div className="space-y-4">
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50/30">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">🚀 Series A/B Growth Stage</h3>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Most Used</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">Perfect for evaluating fast-growing startups seeking venture funding</p>
                <ul className="text-xs text-gray-600 space-y-1 mb-3">
                  <li>✓ Revenue growth > 100% YoY</li>
                  <li>✓ Gross margin > 70%</li>
                  <li>✓ Burn rate < 24 months runway</li>
                  <li>✓ CAC payback < 12 months</li>
                  <li>✓ Net revenue retention > 110%</li>
                </ul>
                <button className="w-full bg-blue-600 text-white text-sm py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Apply Template (5 constraints)
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">💼 Pre-IPO Value Assessment</h3>
                <p className="text-sm text-gray-600 mb-3">Conservative criteria for mature, profitable companies</p>
                <ul className="text-xs text-gray-600 space-y-1 mb-3">
                  <li>✓ P/E ratio < 25</li>
                  <li>✓ Debt-to-equity < 0.4</li>
                  <li>✓ Free cash flow positive</li>
                  <li>✓ Revenue > $100M ARR</li>
                  <li>✓ Market leadership position</li>
                </ul>
                <button className="w-full border border-gray-300 text-gray-700 text-sm py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  Apply Template (5 constraints)
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">⚡ SaaS Deep Dive</h3>
                <p className="text-sm text-gray-600 mb-3">Comprehensive SaaS metrics for software companies</p>
                <ul className="text-xs text-gray-600 space-y-1 mb-3">
                  <li>✓ ARR growth > 40%</li>
                  <li>✓ Net dollar retention > 120%</li>
                  <li>✓ LTV/CAC ratio > 3</li>
                  <li>✓ Gross revenue retention > 90%</li>
                  <li>✓ Rule of 40 > 40%</li>
                </ul>
                <button className="w-full border border-gray-300 text-gray-700 text-sm py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  Apply Template (5 constraints)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}