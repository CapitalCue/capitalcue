'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import { toast } from '@/components/ui/toaster'
import { 
  Bell, 
  BellRing, 
  Check, 
  X, 
  Trash2, 
  Eye, 
  Clock,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Filter,
  Search,
  Archive,
  Volume2,
  VolumeX
} from 'lucide-react'

interface Alert {
  id: string
  type: 'CONSTRAINT_VIOLATION' | 'ANALYSIS_COMPLETE' | 'DOCUMENT_PROCESSED' | 'SYSTEM_ALERT'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  title: string
  message: string
  isRead: boolean
  isAcknowledged: boolean
  isSnoozed: boolean
  snoozeUntil: string | null
  createdAt: string
  readAt: string | null
  acknowledgedAt: string | null
  metadata: {
    constraintId?: string
    constraintName?: string
    analysisId?: string
    documentId?: string
    actualValue?: any
    expectedValue?: any
  }
}

interface AlertStats {
  total: number
  unread: number
  unacknowledged: number
  bySeverity: {
    CRITICAL: number
    HIGH: number
    MEDIUM: number
    LOW: number
  }
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [stats, setStats] = useState<AlertStats>({
    total: 0,
    unread: 0,
    unacknowledged: 0,
    bySeverity: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }
  })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([])
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const [showBulkActions, setShowBulkActions] = useState(false)

  const fetchAlerts = useCallback(async () => {
    try {
      const response = await apiClient.get<Alert[]>('/alerts')
      if (response.success && response.data) {
        setAlerts(response.data)
      }
    } catch (error) {
      console.error('Error fetching alerts:', error)
      toast.error('Failed to load alerts')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      const response = await apiClient.get<AlertStats>('/alerts/stats')
      if (response.success && response.data) {
        setStats(response.data)
      }
    } catch (error) {
      console.error('Error fetching alert stats:', error)
    }
  }, [])

  useEffect(() => {
    fetchAlerts()
    fetchStats()
  }, [fetchAlerts, fetchStats])

  const handleAcknowledge = async (id: string) => {
    try {
      const response = await apiClient.put(`/alerts/${id}/acknowledge`)
      if (response.success) {
        toast.success('Alert acknowledged')
        fetchAlerts()
        fetchStats()
      } else {
        toast.error(response.error || 'Failed to acknowledge alert')
      }
    } catch (error) {
      toast.error('Failed to acknowledge alert')
    }
  }

  const handleUnacknowledge = async (id: string) => {
    try {
      const response = await apiClient.put(`/alerts/${id}/unacknowledge`)
      if (response.success) {
        toast.success('Alert unacknowledged')
        fetchAlerts()
        fetchStats()
      } else {
        toast.error(response.error || 'Failed to unacknowledge alert')
      }
    } catch (error) {
      toast.error('Failed to unacknowledge alert')
    }
  }

  const handleSnooze = async (id: string, hours: number) => {
    try {
      const response = await apiClient.post(`/alerts/snooze/${id}`, { hours })
      if (response.success) {
        toast.success(`Alert snoozed for ${hours} hours`)
        fetchAlerts()
        fetchStats()
      } else {
        toast.error(response.error || 'Failed to snooze alert')
      }
    } catch (error) {
      toast.error('Failed to snooze alert')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this alert?')) return

    try {
      const response = await apiClient.delete(`/alerts/${id}`)
      if (response.success) {
        toast.success('Alert deleted')
        fetchAlerts()
        fetchStats()
      } else {
        toast.error(response.error || 'Failed to delete alert')
      }
    } catch (error) {
      toast.error('Failed to delete alert')
    }
  }

  const handleBulkAcknowledge = async () => {
    if (selectedAlerts.length === 0) return

    try {
      const response = await apiClient.post('/alerts/bulk-acknowledge', {
        alertIds: selectedAlerts
      })
      if (response.success) {
        toast.success(`${selectedAlerts.length} alerts acknowledged`)
        setSelectedAlerts([])
        setShowBulkActions(false)
        fetchAlerts()
        fetchStats()
      } else {
        toast.error(response.error || 'Failed to acknowledge alerts')
      }
    } catch (error) {
      toast.error('Failed to acknowledge alerts')
    }
  }

  const handleSelectAlert = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedAlerts([...selectedAlerts, id])
    } else {
      setSelectedAlerts(selectedAlerts.filter(alertId => alertId !== id))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAlerts(filteredAlerts.map(alert => alert.id))
    } else {
      setSelectedAlerts([])
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'CONSTRAINT_VIOLATION':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'ANALYSIS_COMPLETE':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'DOCUMENT_PROCESSED':
        return <Info className="h-5 w-5 text-blue-500" />
      case 'SYSTEM_ALERT':
        return <Bell className="h-5 w-5 text-yellow-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const getSeverityColor = (severity: string, isAcknowledged: boolean = false) => {
    const baseColors = {
      'CRITICAL': isAcknowledged ? 'text-red-400 bg-red-50' : 'text-red-600 bg-red-100',
      'HIGH': isAcknowledged ? 'text-orange-400 bg-orange-50' : 'text-orange-600 bg-orange-100',
      'MEDIUM': isAcknowledged ? 'text-yellow-400 bg-yellow-50' : 'text-yellow-600 bg-yellow-100',
      'LOW': isAcknowledged ? 'text-green-400 bg-green-50' : 'text-green-600 bg-green-100'
    }
    return baseColors[severity as keyof typeof baseColors] || 'text-gray-600 bg-gray-100'
  }

  const getTypeLabel = (type: string) => {
    const labels = {
      'CONSTRAINT_VIOLATION': 'Constraint Violation',
      'ANALYSIS_COMPLETE': 'Analysis Complete',
      'DOCUMENT_PROCESSED': 'Document Processed',
      'SYSTEM_ALERT': 'System Alert'
    }
    return labels[type as keyof typeof labels] || type
  }

  const filteredAlerts = alerts.filter(alert => {
    const matchesFilter = filter === 'all' || 
      (filter === 'unread' && !alert.isRead) ||
      (filter === 'unacknowledged' && !alert.isAcknowledged) ||
      (filter === 'snoozed' && alert.isSnoozed) ||
      alert.severity === filter ||
      alert.type === filter

    const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const isAlertSnoozed = (alert: Alert) => {
    return alert.isSnoozed && alert.snoozeUntil && new Date(alert.snoozeUntil) > new Date()
  }

  useEffect(() => {
    setShowBulkActions(selectedAlerts.length > 0)
  }, [selectedAlerts])

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white shadow rounded-lg p-6">
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
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
            Alerts
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Monitor and manage your financial analysis alerts
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Bell className="h-8 w-8 text-gray-400" />
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Alerts
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {stats.total}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BellRing className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Unread
                  </dt>
                  <dd className="text-2xl font-semibold text-blue-600">
                    {stats.unread}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-8 w-8 text-orange-500" />
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Needs Action
                  </dt>
                  <dd className="text-2xl font-semibold text-orange-600">
                    {stats.unacknowledged}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Critical
                  </dt>
                  <dd className="text-2xl font-semibold text-red-600">
                    {stats.bySeverity.CRITICAL}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm font-medium text-blue-900">
                {selectedAlerts.length} alert{selectedAlerts.length > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleBulkAcknowledge}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200"
              >
                <Check className="h-4 w-4 mr-1" />
                Acknowledge All
              </button>
              <button
                onClick={() => {
                  setSelectedAlerts([])
                  setShowBulkActions(false)
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <option value="all">All Alerts</option>
                  <option value="unread">Unread</option>
                  <option value="unacknowledged">Needs Action</option>
                  <option value="snoozed">Snoozed</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="LOW">Low Priority</option>
                  <option value="CONSTRAINT_VIOLATION">Constraint Violations</option>
                  <option value="ANALYSIS_COMPLETE">Analysis Complete</option>
                </select>
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search alerts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedAlerts.length === filteredAlerts.length && filteredAlerts.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-500">Select All</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Your Alerts ({filteredAlerts.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredAlerts.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No alerts found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'You have no alerts at this time'
                }
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div key={alert.id} className={`p-6 hover:bg-gray-50 ${!alert.isRead ? 'bg-blue-50' : ''}`}>
                <div className="flex items-start space-x-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedAlerts.includes(alert.id)}
                      onChange={(e) => handleSelectAlert(alert.id, e.target.checked)}
                      className="mr-3"
                    />
                    <div className="flex-shrink-0">
                      {getTypeIcon(alert.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h4 className={`text-sm font-medium ${!alert.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                          {alert.title}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity, alert.isAcknowledged)}`}>
                          {alert.severity}
                        </span>
                        <span className="text-xs text-gray-500">
                          {getTypeLabel(alert.type)}
                        </span>
                        {isAlertSnoozed(alert) && (
                          <div className="flex items-center text-xs text-gray-500">
                            <VolumeX className="h-3 w-3 mr-1" />
                            Snoozed
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        {!alert.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                        <span className="text-xs text-gray-500">
                          {formatDate(alert.createdAt)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {alert.message}
                    </p>
                    {alert.metadata.constraintName && (
                      <div className="text-xs text-gray-500 mb-2">
                        <span className="font-medium">Constraint:</span> {alert.metadata.constraintName}
                        {alert.metadata.actualValue !== undefined && alert.metadata.expectedValue !== undefined && (
                          <span className="ml-2">
                            (Expected: {String(alert.metadata.expectedValue)}, 
                            Actual: {String(alert.metadata.actualValue)})
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        {alert.isAcknowledged && (
                          <div className="flex items-center">
                            <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                            Acknowledged {alert.acknowledgedAt && formatDateTime(alert.acknowledgedAt)}
                          </div>
                        )}
                        {alert.isRead && alert.readAt && (
                          <div>Read {formatDateTime(alert.readAt)}</div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedAlert(alert)}
                          className="text-gray-400 hover:text-gray-600"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {!alert.isAcknowledged ? (
                          <button
                            onClick={() => handleAcknowledge(alert.id)}
                            className="text-gray-400 hover:text-green-600"
                            title="Acknowledge"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUnacknowledge(alert.id)}
                            className="text-green-500 hover:text-gray-600"
                            title="Unacknowledge"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        {!isAlertSnoozed(alert) && (
                          <div className="relative group">
                            <button className="text-gray-400 hover:text-yellow-600" title="Snooze">
                              <Clock className="h-4 w-4" />
                            </button>
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                              <div className="py-1">
                                <button
                                  onClick={() => handleSnooze(alert.id, 1)}
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                >
                                  1 hour
                                </button>
                                <button
                                  onClick={() => handleSnooze(alert.id, 4)}
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                >
                                  4 hours
                                </button>
                                <button
                                  onClick={() => handleSnooze(alert.id, 24)}
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                >
                                  1 day
                                </button>
                                <button
                                  onClick={() => handleSnooze(alert.id, 168)}
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                >
                                  1 week
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                        <button
                          onClick={() => handleDelete(alert.id)}
                          className="text-gray-400 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Alert Details Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Alert Details</h3>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    {getTypeIcon(selectedAlert.type)}
                    <h4 className="font-medium text-gray-900">{selectedAlert.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(selectedAlert.severity, selectedAlert.isAcknowledged)}`}>
                      {selectedAlert.severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{selectedAlert.message}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <span className="ml-2 font-medium">{getTypeLabel(selectedAlert.type)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Severity:</span>
                    <span className="ml-2 font-medium">{selectedAlert.severity}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <span className="ml-2 font-medium">{formatDateTime(selectedAlert.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className="ml-2 font-medium">
                      {selectedAlert.isAcknowledged ? 'Acknowledged' : 'Needs Action'}
                    </span>
                  </div>
                </div>

                {selectedAlert.metadata.constraintName && (
                  <div className="border-t pt-4">
                    <h5 className="font-medium text-gray-900 mb-2">Constraint Details</h5>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">Constraint:</span>
                        <span className="ml-2 font-medium">{selectedAlert.metadata.constraintName}</span>
                      </div>
                      {selectedAlert.metadata.expectedValue !== undefined && (
                        <div>
                          <span className="text-gray-500">Expected Value:</span>
                          <span className="ml-2 font-medium">{String(selectedAlert.metadata.expectedValue)}</span>
                        </div>
                      )}
                      {selectedAlert.metadata.actualValue !== undefined && (
                        <div>
                          <span className="text-gray-500">Actual Value:</span>
                          <span className="ml-2 font-medium">{String(selectedAlert.metadata.actualValue)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  {!selectedAlert.isAcknowledged ? (
                    <button
                      onClick={() => {
                        handleAcknowledge(selectedAlert.id)
                        setSelectedAlert(null)
                      }}
                      className="px-4 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-2 inline" />
                      Acknowledge
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        handleUnacknowledge(selectedAlert.id)
                        setSelectedAlert(null)
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <X className="h-4 w-4 mr-2 inline" />
                      Unacknowledge
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedAlert(null)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}