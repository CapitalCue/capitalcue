'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import { toast } from '@/components/ui/toaster'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Play, 
  BarChart3, 
  Download, 
  Trash2, 
  Eye, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Search,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  X,
  Settings,
  Brain,
  Sparkles
} from 'lucide-react'

interface Analysis {
  id: string
  name: string
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  progress: number
  createdAt: string
  completedAt: string | null
  aiInsights: any | null
  document: {
    id: string
    originalFilename: string
  }
  constraints: Array<{
    id: string
    name: string
  }>
  results: {
    totalConstraints: number
    passedConstraints: number
    failedConstraints: number
    score: number
    violationsSummary: Array<{
      constraintId: string
      constraintName: string
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
      message: string
      actualValue: any
      expectedValue: any
    }>
    insights: string[]
  } | null
  error: string | null
}

export default function AnalysisPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showRunModal, setShowRunModal] = useState(false)
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [constraints, setConstraints] = useState<any[]>([])
  
  const searchParams = useSearchParams()
  const showRun = searchParams?.get('action') === 'run'

  const [newAnalysis, setNewAnalysis] = useState({
    name: '',
    documentId: '',
    constraintIds: [] as string[],
    includeAIInsights: false
  })

  const fetchAnalyses = useCallback(async () => {
    try {
      const response = await apiClient.get<Analysis[]>('/analysis')
      if (response.success && response.data) {
        setAnalyses(response.data)
      }
    } catch (error) {
      console.error('Error fetching analyses:', error)
      toast.error('Failed to load analyses')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await apiClient.get<any[]>('/documents')
      if (response.success && response.data) {
        setDocuments(response.data.filter((doc: any) => doc.status === 'PROCESSED'))
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    }
  }, [])

  const fetchConstraints = useCallback(async () => {
    try {
      const response = await apiClient.get<any[]>('/constraints')
      if (response.success && response.data) {
        setConstraints(response.data.filter((constraint: any) => constraint.isActive))
      }
    } catch (error) {
      console.error('Error fetching constraints:', error)
    }
  }, [])

  useEffect(() => {
    fetchAnalyses()
    fetchDocuments()
    fetchConstraints()
  }, [fetchAnalyses, fetchDocuments, fetchConstraints])

  useEffect(() => {
    if (showRun) {
      setShowRunModal(true)
    }
  }, [showRun])

  const handleRunAnalysis = async () => {
    if (!newAnalysis.name || !newAnalysis.documentId || newAnalysis.constraintIds.length === 0) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const response = await apiClient.post('/analysis/run', newAnalysis)
      if (response.success) {
        toast.success('Analysis started successfully')
        setShowRunModal(false)
        setNewAnalysis({
          name: '',
          documentId: '',
          constraintIds: [],
          includeAIInsights: false
        })
        fetchAnalyses()
      } else {
        toast.error(response.error || 'Failed to start analysis')
      }
    } catch (error) {
      toast.error('Failed to start analysis')
    }
  }

  const handleDeleteAnalysis = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return

    try {
      const response = await apiClient.delete(`/analysis/${id}`)
      if (response.success) {
        toast.success('Analysis deleted successfully')
        fetchAnalyses()
      } else {
        toast.error(response.error || 'Failed to delete analysis')
      }
    } catch (error) {
      toast.error('Failed to delete analysis')
    }
  }

  const handleRerunAnalysis = async (id: string) => {
    try {
      const response = await apiClient.post(`/analysis/${id}/rerun`)
      if (response.success) {
        toast.success('Analysis restarted successfully')
        fetchAnalyses()
      } else {
        toast.error(response.error || 'Failed to restart analysis')
      }
    } catch (error) {
      toast.error('Failed to restart analysis')
    }
  }

  const handleDownloadReport = async (id: string, name: string) => {
    try {
      const blob = await apiClient.download(`/analysis/${id}/report`)
      if (blob) {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${name.replace(/[^a-zA-Z0-9]/g, '_')}_report.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        toast.error('Download failed')
      }
    } catch (error) {
      toast.error('Download failed')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'RUNNING':
        return <Clock className="h-5 w-5 text-blue-500" />
      case 'FAILED':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pending'
      case 'RUNNING': return 'Running'
      case 'COMPLETED': return 'Completed'
      case 'FAILED': return 'Failed'
      default: return status
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'text-red-600 bg-red-50'
      case 'HIGH': return 'text-orange-600 bg-orange-50'
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50'
      case 'LOW': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const filteredAnalyses = analyses.filter(analysis => {
    const matchesFilter = filter === 'all' || analysis.status === filter
    const matchesSearch = analysis.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analysis.document.originalFilename.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
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
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white shadow rounded-lg p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
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
            Analysis
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Run constraint analysis on your financial documents
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            onClick={() => setShowRunModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Play className="h-4 w-4 mr-2" />
            Run Analysis
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="p-6">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Filter className="h-5 w-5 text-gray-400 mr-2" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Analyses</option>
                  <option value="PENDING">Pending</option>
                  <option value="RUNNING">Running</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search analyses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Your Analyses ({filteredAnalyses.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredAnalyses.length === 0 ? (
            <div className="p-12 text-center">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No analyses found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Get started by running your first analysis'
                }
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowRunModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Run Analysis
                </button>
              </div>
            </div>
          ) : (
            filteredAnalyses.map((analysis) => (
              <div key={analysis.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {getStatusIcon(analysis.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900">
                          {analysis.name}
                        </p>
                        {analysis.aiInsights && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            <Sparkles className="h-3 w-3 mr-1" />
                            AI Enhanced
                          </span>
                        )}
                      </div>
                      <div className="flex items-center mt-1 text-sm text-gray-500 space-x-4">
                        <span>{getStatusText(analysis.status)}</span>
                        <span>{analysis.document.originalFilename}</span>
                        <span>{analysis.constraints.length} constraints</span>
                        <span>{formatDate(analysis.createdAt)}</span>
                        {analysis.completedAt && (
                          <span>{formatDuration(analysis.createdAt, analysis.completedAt)}</span>
                        )}
                      </div>
                      {analysis.status === 'RUNNING' && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${analysis.progress}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{analysis.progress}% complete</p>
                        </div>
                      )}
                      {analysis.error && (
                        <p className="mt-1 text-sm text-red-600">
                          Error: {analysis.error}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {analysis.results && (
                      <div className="flex items-center space-x-3 mr-4">
                        <div className={`text-2xl font-bold ${getScoreColor(analysis.results.score)}`}>
                          {analysis.results.score}%
                        </div>
                        <div className="text-xs text-gray-500">
                          <div className="flex items-center">
                            <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                            {analysis.results.passedConstraints}
                          </div>
                          <div className="flex items-center">
                            <X className="h-3 w-3 text-red-500 mr-1" />
                            {analysis.results.failedConstraints}
                          </div>
                        </div>
                      </div>
                    )}
                    {analysis.status === 'COMPLETED' && analysis.results && (
                      <button
                        onClick={() => handleDownloadReport(analysis.id, analysis.name)}
                        className="text-gray-400 hover:text-gray-600"
                        title="Download Report"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    )}
                    <Link
                      href={`/analysis/${analysis.id}`}
                      className="text-gray-400 hover:text-gray-600"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    {(analysis.status === 'COMPLETED' || analysis.status === 'FAILED') && (
                      <button
                        onClick={() => handleRerunAnalysis(analysis.id)}
                        className="text-gray-400 hover:text-blue-600"
                        title="Rerun"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteAnalysis(analysis.id, analysis.name)}
                      className="text-gray-400 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Run Analysis Modal */}
      {showRunModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Run New Analysis</h3>
                <button
                  onClick={() => setShowRunModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Analysis Name *
                  </label>
                  <input
                    type="text"
                    value={newAnalysis.name}
                    onChange={(e) => setNewAnalysis({...newAnalysis, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g., Q4 Financial Review"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document *
                  </label>
                  <select
                    value={newAnalysis.documentId}
                    onChange={(e) => setNewAnalysis({...newAnalysis, documentId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select a document</option>
                    {documents.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.originalFilename}
                      </option>
                    ))}
                  </select>
                  {documents.length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      No processed documents available. Upload and process documents first.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Constraints * (Select at least one)
                  </label>
                  <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                    {constraints.map((constraint) => (
                      <label key={constraint.id} className="flex items-center py-2">
                        <input
                          type="checkbox"
                          checked={newAnalysis.constraintIds.includes(constraint.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewAnalysis({
                                ...newAnalysis, 
                                constraintIds: [...newAnalysis.constraintIds, constraint.id]
                              })
                            } else {
                              setNewAnalysis({
                                ...newAnalysis, 
                                constraintIds: newAnalysis.constraintIds.filter(id => id !== constraint.id)
                              })
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm">{constraint.name}</span>
                      </label>
                    ))}
                    {constraints.length === 0 && (
                      <p className="text-sm text-gray-500 py-2">
                        No active constraints available. Create constraints first.
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newAnalysis.includeAIInsights}
                      onChange={(e) => setNewAnalysis({...newAnalysis, includeAIInsights: e.target.checked})}
                      className="mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <div className="flex items-center">
                      <Sparkles className="h-4 w-4 text-purple-500 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Include AI-powered insights</span>
                    </div>
                  </label>
                  <p className="text-xs text-gray-500 ml-7 mt-1">
                    Generate intelligent recommendations and predictive analytics using Claude AI
                  </p>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowRunModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRunAnalysis}
                    disabled={!newAnalysis.name || !newAnalysis.documentId || newAnalysis.constraintIds.length === 0}
                    className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Play className="h-4 w-4 mr-2 inline" />
                    Run Analysis
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Details Modal */}
      {selectedAnalysis && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Analysis Details</h3>
                <button
                  onClick={() => setSelectedAnalysis(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-6 max-h-96 overflow-y-auto">
                {/* Analysis Info */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">{selectedAnalysis.name}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <span className="ml-2 font-medium">{getStatusText(selectedAnalysis.status)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Document:</span>
                      <span className="ml-2 font-medium">{selectedAnalysis.document.originalFilename}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <span className="ml-2 font-medium">{formatDate(selectedAnalysis.createdAt)}</span>
                    </div>
                    {selectedAnalysis.completedAt && (
                      <div>
                        <span className="text-gray-500">Duration:</span>
                        <span className="ml-2 font-medium">{formatDuration(selectedAnalysis.createdAt, selectedAnalysis.completedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Results */}
                {selectedAnalysis.results && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Results</h4>
                    <div className="grid grid-cols-4 gap-4 mb-6">
                      <div className="text-center">
                        <div className={`text-3xl font-bold ${getScoreColor(selectedAnalysis.results.score)}`}>
                          {selectedAnalysis.results.score}%
                        </div>
                        <div className="text-sm text-gray-500">Overall Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {selectedAnalysis.results.totalConstraints}
                        </div>
                        <div className="text-sm text-gray-500">Total Constraints</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {selectedAnalysis.results.passedConstraints}
                        </div>
                        <div className="text-sm text-gray-500">Passed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {selectedAnalysis.results.failedConstraints}
                        </div>
                        <div className="text-sm text-gray-500">Failed</div>
                      </div>
                    </div>

                    {/* Violations */}
                    {selectedAnalysis.results.violationsSummary.length > 0 && (
                      <div className="mb-6">
                        <h5 className="font-medium text-gray-900 mb-2">Constraint Violations</h5>
                        <div className="space-y-2">
                          {selectedAnalysis.results.violationsSummary.map((violation, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-900">{violation.constraintName}</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(violation.severity)}`}>
                                  {violation.severity}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{violation.message}</p>
                              <div className="text-xs text-gray-500">
                                <span>Expected: {String(violation.expectedValue)}</span>
                                <span className="ml-4">Actual: {String(violation.actualValue)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Insights */}
                    {selectedAnalysis.results.insights.length > 0 && (
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">AI Insights</h5>
                        <div className="space-y-2">
                          {selectedAnalysis.results.insights.map((insight, index) => (
                            <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <p className="text-sm text-blue-800">{insight}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Error */}
                {selectedAnalysis.error && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Error Details</h4>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-800">{selectedAnalysis.error}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}