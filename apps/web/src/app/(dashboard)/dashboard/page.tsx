'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Upload, 
  FileText, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Eye,
  Download,
  Settings,
  Activity,
  DollarSign,
  Target,
  Brain,
  Sparkles,
  Filter,
  Search,
  Calendar,
  Users
} from 'lucide-react'

interface DashboardStats {
  totalAnalyses: number
  completedAnalyses: number
  pendingAnalyses: number
  averageScore: number
  documentsProcessed: number
  activeConstraints: number
  riskAlerts: number
  portfolioCompanies: number
}

interface RecentAnalysis {
  id: string
  name: string
  company: string
  score: number
  status: 'COMPLETED' | 'RUNNING' | 'FAILED'
  date: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

interface TopAlert {
  id: string
  company: string
  constraint: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  message: string
  date: string
}

export default function DashboardPage() {
  const [stats] = useState<DashboardStats>({
    totalAnalyses: 127,
    completedAnalyses: 119,
    pendingAnalyses: 8,
    averageScore: 78.5,
    documentsProcessed: 234,
    activeConstraints: 18,
    riskAlerts: 12,
    portfolioCompanies: 45
  })

  const [recentAnalyses] = useState<RecentAnalysis[]>([
    {
      id: '1',
      name: 'Q4 2024 Financial Review',
      company: 'TechFlow Inc.',
      score: 85,
      status: 'COMPLETED',
      date: '2024-01-15',
      riskLevel: 'LOW'
    },
    {
      id: '2', 
      name: 'Series B Due Diligence',
      company: 'DataStream Corp',
      score: 42,
      status: 'COMPLETED',
      date: '2024-01-14',
      riskLevel: 'HIGH'
    },
    {
      id: '3',
      name: 'Annual Report Analysis',
      company: 'GreenTech Solutions',
      score: 0,
      status: 'RUNNING',
      date: '2024-01-14',
      riskLevel: 'MEDIUM'
    }
  ])

  const [topAlerts] = useState<TopAlert[]>([
    {
      id: '1',
      company: 'DataStream Corp',
      constraint: 'Debt-to-Equity Ratio',
      severity: 'CRITICAL',
      message: 'Debt-to-equity ratio exceeds 2.5x threshold',
      date: '2024-01-14'
    },
    {
      id: '2',
      company: 'CloudVault Inc.',
      constraint: 'Revenue Growth',
      severity: 'HIGH',
      message: 'Revenue growth below 15% target for Q4',
      date: '2024-01-13'
    }
  ])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'RUNNING':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'FAILED':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'bg-green-100 text-green-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'CRITICAL': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'border-red-500 bg-red-50'
      case 'HIGH': return 'border-orange-500 bg-orange-50'
      case 'MEDIUM': return 'border-yellow-500 bg-yellow-50'
      case 'LOW': return 'border-green-500 bg-green-50'
      default: return 'border-gray-500 bg-gray-50'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Investment Analysis Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Monitor portfolio performance and constraint compliance across all investments
          </p>
        </div>
        <div className="flex space-x-3">
          <Link href="/documents?action=upload" className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 inline-flex items-center">
            <Upload className="h-4 w-4 mr-2" />
            Upload Documents
          </Link>
          <Link href="/analysis?action=run" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            Run Analysis
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Analyses</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalAnalyses}</p>
              <p className="text-sm text-green-600 mt-1">+12% from last month</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-3xl font-bold text-gray-900">{stats.averageScore}%</p>
              <p className="text-sm text-green-600 mt-1">+3.2% improvement</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Target className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Risk Alerts</p>
              <p className="text-3xl font-bold text-gray-900">{stats.riskAlerts}</p>
              <p className="text-sm text-red-600 mt-1">2 critical issues</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Portfolio Companies</p>
              <p className="text-3xl font-bold text-gray-900">{stats.portfolioCompanies}</p>
              <p className="text-sm text-blue-600 mt-1">3 new this quarter</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/documents?action=upload" className="group border-2 border-dashed border-blue-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Documents</h3>
              <p className="text-gray-600">
                Upload quarterly reports, financial statements, and company documents
              </p>
            </Link>

            <Link href="/constraints" className="group border-2 border-dashed border-green-300 rounded-lg p-8 text-center hover:border-green-500 transition-colors">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200">
                <Settings className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Define Constraints</h3>
              <p className="text-gray-600">
                Set investment criteria and financial constraints for analysis
              </p>
            </Link>

            <Link href="/analysis?action=run" className="group border-2 border-dashed border-purple-300 rounded-lg p-8 text-center hover:border-purple-500 transition-colors">
              <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Analysis</h3>
              <p className="text-gray-600">
                Run constraint analysis with AI-powered insights and recommendations
              </p>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Analyses */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Recent Analyses</h2>
            <Link href="/analysis" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {recentAnalyses.map((analysis) => (
              <div key={analysis.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(analysis.status)}
                    <div>
                      <h3 className="font-medium text-gray-900">{analysis.name}</h3>
                      <p className="text-sm text-gray-600">{analysis.company}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {analysis.status === 'COMPLETED' && (
                      <div className={`text-2xl font-bold ${getScoreColor(analysis.score)}`}>
                        {analysis.score}%
                      </div>
                    )}
                    <div className="text-xs text-gray-500">{analysis.date}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(analysis.riskLevel)}`}>
                    {analysis.riskLevel} RISK
                  </span>
                  <Link href={`/analysis/${analysis.id}`} className="text-blue-600 hover:text-blue-700">
                    <Eye className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Alerts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Critical Alerts</h2>
            <Link href="/alerts" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {topAlerts.map((alert) => (
              <div key={alert.id} className={`p-6 border-l-4 ${getSeverityColor(alert.severity)}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">{alert.company}</h3>
                    <p className="text-sm text-gray-600">{alert.constraint}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                    alert.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {alert.severity}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
                <p className="text-xs text-gray-500">{alert.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Portfolio Performance Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Portfolio Performance Overview</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">73%</div>
              <div className="text-sm text-gray-600">Companies Meeting All Constraints</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">18%</div>
              <div className="text-sm text-gray-600">Companies with Minor Issues</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">9%</div>
              <div className="text-sm text-gray-600">Companies Requiring Attention</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}