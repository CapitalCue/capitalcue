'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { toast } from '@/components/ui/toaster'
import { AIInsights } from '@/components/ai-insights'
import { 
  ArrowLeft,
  Brain,
  Download,
  RefreshCw,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Clock,
  Eye,
  BarChart3,
  FileText,
  Target,
  TrendingUp,
  Sparkles
} from 'lucide-react'

interface AnalysisDetails {
  id: string
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  startedAt: string
  completedAt: string | null
  errorMessage: string | null
  aiInsights: {
    insights: any[]
    constraintSuggestions: any[]
    predictiveInsights: {
      predictions: any[]
      risks: any[]
      opportunities: any[]
    }
    generatedAt: string
  } | null
  document: {
    id: string
    fileName: string
    documentType: string
    company: {
      name: string
      ticker: string | null
    }
  }
  financialMetrics: Array<{
    id: string
    name: string
    value: number
    unit: string
    period: string
    confidence: number
  }>
  alerts: Array<{
    id: string
    severity: string
    message: string
    actualValue: string
    expectedValue: string
    isAcknowledged: boolean
    createdAt: string
    constraint: {
      name: string
      severity: string
    }
  }>
  analysisConstraints: Array<{
    constraint: {
      id: string
      name: string
      metric: string
      operator: string
      value: string
      severity: string
    }
  }>
}

interface AnalysisStats {
  totalMetrics: number
  totalAlerts: number
  criticalAlerts: number
  warningAlerts: number
  infoAlerts: number
  unacknowledgedAlerts: number
  constraintsEvaluated: number
}

export default function AnalysisDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [analysis, setAnalysis] = useState<AnalysisDetails | null>(null)
  const [stats, setStats] = useState<AnalysisStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingAI, setLoadingAI] = useState(false)
  const [aiStatus, setAiStatus] = useState<{ configured: boolean; message: string } | null>(null)

  const fetchAnalysis = async () => {
    try {
      const response = await apiClient.get<{
        analysis: AnalysisDetails
        stats: AnalysisStats
      }>(`/analysis/${params.id}`)
      
      if (response.success && response.data) {
        setAnalysis(response.data.analysis)
        setStats(response.data.stats)
      }
    } catch (error) {
      console.error('Error fetching analysis:', error)
      toast.error('Failed to load analysis details')
    } finally {
      setLoading(false)
    }
  }

  const fetchAIStatus = async () => {
    try {
      const response = await apiClient.get<{ configured: boolean; message: string }>('/analysis/ai-status')
      if (response.success && response.data) {
        setAiStatus(response.data)
      }
    } catch (error) {
      console.warn('Failed to fetch AI status:', error)
    }
  }

  const generateAIInsights = async () => {
    if (!analysis) return

    setLoadingAI(true)
    try {
      const response = await apiClient.post(`/analysis/${analysis.id}/ai-insights`)
      if (response.success && response.data) {
        // Update analysis with new AI insights
        const aiData = response.data as any
        setAnalysis(prev => prev ? {
          ...prev,
          aiInsights: {
            insights: aiData.insights || [],
            constraintSuggestions: aiData.constraintSuggestions || [],
            predictiveInsights: aiData.predictiveInsights || { predictions: [], risks: [], opportunities: [] },
            generatedAt: new Date().toISOString()
          }
        } : null)
        toast.success('AI insights generated successfully')
      }
    } catch (error) {
      console.error('Error generating AI insights:', error)
      toast.error('Failed to generate AI insights')
    } finally {
      setLoadingAI(false)
    }
  }

  const handleDownloadReport = async () => {
    if (!analysis) return

    try {
      const blob = await apiClient.download(`/analysis/${analysis.id}/report`)
      if (blob) {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `analysis_${analysis.id}_report.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Report downloaded successfully')
      }
    } catch (error) {
      toast.error('Download failed')
    }
  }

  const handleRerunAnalysis = async () => {
    if (!analysis) return

    try {
      const response = await apiClient.post(`/analysis/${analysis.id}/rerun`)
      if (response.success) {
        toast.success('Analysis restarted successfully')
        router.push('/analysis')
      }
    } catch (error) {
      toast.error('Failed to restart analysis')
    }
  }

  const handleDeleteAnalysis = async () => {
    if (!analysis) return
    if (!confirm('Are you sure you want to delete this analysis?')) return

    try {
      const response = await apiClient.delete(`/analysis/${analysis.id}`)
      if (response.success) {
        toast.success('Analysis deleted successfully')
        router.push('/analysis')
      }
    } catch (error) {
      toast.error('Failed to delete analysis')
    }
  }

  useEffect(() => {
    fetchAnalysis()
    fetchAIStatus()
  }, [params.id])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case 'RUNNING':
        return <Clock className="h-6 w-6 text-blue-500" />
      case 'FAILED':
        return <AlertTriangle className="h-6 w-6 text-red-500" />
      default:
        return <Clock className="h-6 w-6 text-gray-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'warning':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return 'In progress'
    const startTime = new Date(start).getTime()
    const endTime = new Date(end).getTime()
    const duration = Math.round((endTime - startTime) / 1000)
    return `${duration}s`
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="flex items-center mb-6">
          <div className="h-4 w-4 bg-gray-200 rounded mr-2"></div>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </div>
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!analysis || !stats) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Analysis not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The analysis you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <div className="mt-6">
          <button
            onClick={() => router.push('/analysis')}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Analysis
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/analysis')}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Analysis
        </button>
        
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              {getStatusIcon(analysis.status)}
              <div className="ml-3">
                <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
                  Analysis Details
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  {analysis.document.fileName} • {analysis.document.company.name}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-2">
            {analysis.status === 'COMPLETED' && (
              <>
                <button
                  onClick={handleDownloadReport}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </button>
                {aiStatus?.configured && !analysis.aiInsights && (
                  <button
                    onClick={generateAIInsights}
                    disabled={loadingAI}
                    className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                  >
                    {loadingAI ? (
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Brain className="h-4 w-4 mr-2" />
                    )}
                    Generate AI Insights
                  </button>
                )}
              </>
            )}
            {(analysis.status === 'COMPLETED' || analysis.status === 'FAILED') && (
              <button
                onClick={handleRerunAnalysis}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Rerun
              </button>
            )}
            <button
              onClick={handleDeleteAnalysis}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Overview */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Analysis Overview</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{stats.totalMetrics}</div>
              <div className="text-sm text-gray-500">Financial Metrics</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{stats.constraintsEvaluated}</div>
              <div className="text-sm text-gray-500">Constraints Evaluated</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{stats.totalAlerts}</div>
              <div className="text-sm text-gray-500">Total Alerts</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{stats.unacknowledgedAlerts}</div>
              <div className="text-sm text-gray-500">Unacknowledged</div>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Analysis Details</h4>
              <div className="space-y-1">
                <div><span className="text-gray-500">Status:</span> <span className="font-medium">{analysis.status}</span></div>
                <div><span className="text-gray-500">Started:</span> <span className="font-medium">{formatDate(analysis.startedAt)}</span></div>
                {analysis.completedAt && (
                  <div><span className="text-gray-500">Duration:</span> <span className="font-medium">{formatDuration(analysis.startedAt, analysis.completedAt)}</span></div>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Document Information</h4>
              <div className="space-y-1">
                <div><span className="text-gray-500">File:</span> <span className="font-medium">{analysis.document.fileName}</span></div>
                <div><span className="text-gray-500">Type:</span> <span className="font-medium">{analysis.document.documentType}</span></div>
                <div><span className="text-gray-500">Company:</span> <span className="font-medium">{analysis.document.company.name}</span></div>
                {analysis.document.company.ticker && (
                  <div><span className="text-gray-500">Ticker:</span> <span className="font-medium">{analysis.document.company.ticker}</span></div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      {analysis.aiInsights && aiStatus && (
        <AIInsights
          insights={analysis.aiInsights.insights}
          constraintSuggestions={analysis.aiInsights.constraintSuggestions}
          predictiveInsights={analysis.aiInsights.predictiveInsights}
          serviceStatus={aiStatus}
          className="mb-6"
        />
      )}

      {/* Alerts */}
      {analysis.alerts.length > 0 && (
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Constraint Violations ({analysis.alerts.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {analysis.alerts.map((alert) => (
              <div key={alert.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{alert.constraint.name}</span>
                      {!alert.isAcknowledged && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Unacknowledged
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Expected: {alert.expectedValue}</span>
                      <span>Actual: {alert.actualValue}</span>
                      <span>Created: {formatDate(alert.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Financial Metrics */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Financial Metrics ({analysis.financialMetrics.length})
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analysis.financialMetrics.map((metric) => (
              <div key={metric.id} className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-1">
                  {metric.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </h4>
                <div className="text-2xl font-bold text-gray-900">
                  {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
                  {metric.unit && <span className="text-sm text-gray-500 ml-1">{metric.unit}</span>}
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <span>{metric.period}</span>
                  <span>{Math.round(metric.confidence * 100)}% confidence</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Error State */}
      {analysis.errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mt-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <h3 className="text-sm font-medium text-red-800">Analysis Error</h3>
          </div>
          <p className="mt-2 text-sm text-red-700">{analysis.errorMessage}</p>
        </div>
      )}
    </div>
  )
}