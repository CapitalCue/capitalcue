'use client'

import { useAuth } from '@/hooks/use-auth'
import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api-client'
import Link from 'next/link'
import { 
  FileText, 
  Settings, 
  BarChart3, 
  Bell, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Upload,
  Plus
} from 'lucide-react'

interface DashboardStats {
  documents: number
  constraints: number
  analyses: number
  alerts: number
  recentActivity: Array<{
    id: string
    type: 'document' | 'constraint' | 'analysis' | 'alert'
    title: string
    timestamp: string
    status?: string
  }>
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    documents: 0,
    constraints: 0,
    analyses: 0,
    alerts: 0,
    recentActivity: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await apiClient.get<DashboardStats>('/user/dashboard')
        if (response.success && response.data) {
          setStats(response.data)
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const quickActions = [
    {
      name: 'Upload Document',
      description: 'Add new financial documents',
      href: '/documents?action=upload',
      icon: Upload,
      color: 'bg-blue-600'
    },
    {
      name: 'Create Constraint',
      description: 'Set up new analysis rules',
      href: '/constraints?action=create',
      icon: Plus,
      color: 'bg-green-600'
    },
    {
      name: 'Run Analysis',
      description: 'Analyze documents with constraints',
      href: '/analysis?action=run',
      icon: BarChart3,
      color: 'bg-purple-600'
    }
  ]

  const statCards = [
    {
      name: 'Documents',
      stat: stats.documents,
      href: '/documents',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      name: 'Constraints',
      stat: stats.constraints,
      href: '/constraints',
      icon: Settings,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      name: 'Analyses',
      stat: stats.analyses,
      href: '/analysis',
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      name: 'Active Alerts',
      stat: stats.alerts,
      href: '/alerts',
      icon: Bell,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'document': return FileText
      case 'constraint': return Settings
      case 'analysis': return BarChart3
      case 'alert': return Bell
      default: return FileText
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed': 
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'processing':
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white overflow-hidden shadow rounded-lg p-6">
              <div className="h-12 bg-gray-200 rounded mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Welcome back, {user?.firstName}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Here's what's happening with your financial analysis
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((item) => (
          <Link key={item.name} href={item.href}>
            <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`p-3 rounded-md ${item.bgColor}`}>
                      <item.icon className={`h-6 w-6 ${item.color}`} />
                    </div>
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {item.name}
                      </dt>
                      <dd className="text-2xl font-semibold text-gray-900">
                        {item.stat}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-6 space-y-4">
              {quickActions.map((action) => (
                <Link key={action.name} href={action.href}>
                  <div className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer">
                    <div className={`p-2 rounded-md ${action.color}`}>
                      <action.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{action.name}</p>
                      <p className="text-xs text-gray-500">{action.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            </div>
            <div className="p-6">
              {stats.recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by uploading your first document or creating a constraint.
                  </p>
                  <div className="mt-6">
                    <Link href="/documents?action=upload">
                      <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Document
                      </button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flow-root">
                  <ul className="divide-y divide-gray-200">
                    {stats.recentActivity.map((activity) => {
                      const ActivityIcon = getActivityIcon(activity.type)
                      return (
                        <li key={activity.id} className="py-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <ActivityIcon className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {activity.title}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(activity.timestamp).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex-shrink-0">
                              {getStatusIcon(activity.status)}
                            </div>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}