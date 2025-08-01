'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import { toast } from '@/components/ui/toaster'
import { useSearchParams } from 'next/navigation'
import { 
  Plus, 
  Settings, 
  Edit, 
  Trash2, 
  Power, 
  PowerOff,
  Filter,
  Search,
  File,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  X,
  Save
} from 'lucide-react'

interface Constraint {
  id: string
  name: string
  description: string
  metric: string
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'ne' | 'contains' | 'not_contains' | 'between' | 'not_between'
  value: string
  isActive: boolean
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  tags: string[]
  createdAt: string
  updatedAt: string
}

interface ConstraintTemplate {
  id: string
  name: string
  description: string
  constraints: Array<{
    name: string
    description: string
    metric: string
    operator: string
    value: string
    priority: string
  }>
}

export default function ConstraintsPage() {
  const [constraints, setConstraints] = useState<Constraint[]>([])
  const [templates, setTemplates] = useState<ConstraintTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [editingConstraint, setEditingConstraint] = useState<Constraint | null>(null)
  
  const searchParams = useSearchParams()
  const showCreate = searchParams.get('action') === 'create'

  const [newConstraint, setNewConstraint] = useState({
    name: '',
    description: '',
    metric: '',
    operator: 'gt' as const,
    value: '',
    priority: 'MEDIUM' as const,
    tags: [] as string[]
  })

  const fetchConstraints = useCallback(async () => {
    try {
      const response = await apiClient.get<Constraint[]>('/constraints')
      if (response.success && response.data) {
        setConstraints(response.data)
      }
    } catch (error) {
      console.error('Error fetching constraints:', error)
      toast.error('Failed to load constraints')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTemplates = useCallback(async () => {
    try {
      const response = await apiClient.get<ConstraintTemplate[]>('/constraints/templates')
      if (response.success && response.data) {
        setTemplates(response.data)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }, [])

  useEffect(() => {
    fetchConstraints()
    fetchTemplates()
  }, [fetchConstraints, fetchTemplates])

  useEffect(() => {
    if (showCreate) {
      setShowCreateModal(true)
    }
  }, [showCreate])

  const handleCreateConstraint = async () => {
    if (!newConstraint.name || !newConstraint.metric || !newConstraint.value) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const response = await apiClient.post('/constraints', newConstraint)
      if (response.success) {
        toast.success('Constraint created successfully')
        setShowCreateModal(false)
        setNewConstraint({
          name: '',
          description: '',
          metric: '',
          operator: 'gt',
          value: '',
          priority: 'MEDIUM',
          tags: []
        })
        fetchConstraints()
      } else {
        toast.error(response.error || 'Failed to create constraint')
      }
    } catch (error) {
      toast.error('Failed to create constraint')
    }
  }

  const handleUpdateConstraint = async () => {
    if (!editingConstraint) return

    try {
      const response = await apiClient.put(`/constraints/${editingConstraint.id}`, editingConstraint)
      if (response.success) {
        toast.success('Constraint updated successfully')
        setEditingConstraint(null)
        fetchConstraints()
      } else {
        toast.error(response.error || 'Failed to update constraint')
      }
    } catch (error) {
      toast.error('Failed to update constraint')
    }
  }

  const handleDeleteConstraint = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return

    try {
      const response = await apiClient.delete(`/constraints/${id}`)
      if (response.success) {
        toast.success('Constraint deleted successfully')
        fetchConstraints()
      } else {
        toast.error(response.error || 'Failed to delete constraint')
      }
    } catch (error) {
      toast.error('Failed to delete constraint')
    }
  }

  const handleToggleConstraint = async (id: string, isActive: boolean) => {
    try {
      const response = await apiClient.post(`/constraints/${id}/toggle`)
      if (response.success) {
        toast.success(`Constraint ${isActive ? 'disabled' : 'enabled'} successfully`)
        fetchConstraints()
      } else {
        toast.error(response.error || 'Failed to toggle constraint')
      }
    } catch (error) {
      toast.error('Failed to toggle constraint')
    }
  }

  const handleApplyTemplate = async (templateId: string) => {
    try {
      const response = await apiClient.post(`/constraints/templates/${templateId}/apply`)
      if (response.success) {
        toast.success('Template applied successfully')
        setShowTemplateModal(false)
        fetchConstraints()
      } else {
        toast.error(response.error || 'Failed to apply template')
      }
    } catch (error) {
      toast.error('Failed to apply template')
    }
  }

  const getOperatorLabel = (operator: string) => {
    const operators = {
      'gt': 'Greater than',
      'lt': 'Less than',
      'gte': 'Greater than or equal',
      'lte': 'Less than or equal',
      'eq': 'Equals',
      'ne': 'Not equals',
      'contains': 'Contains',
      'not_contains': 'Does not contain',
      'between': 'Between',
      'not_between': 'Not between'
    }
    return operators[operator as keyof typeof operators] || operator
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'text-red-600 bg-red-50'
      case 'HIGH': return 'text-orange-600 bg-orange-50'
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50'
      case 'LOW': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const filteredConstraints = constraints.filter(constraint => {
    const matchesFilter = filter === 'all' || 
      (filter === 'active' && constraint.isActive) ||
      (filter === 'inactive' && !constraint.isActive) ||
      constraint.priority === filter
    const matchesSearch = constraint.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      constraint.metric.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

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
            Constraints
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Define rules and thresholds for your financial analysis
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
          <button
            onClick={() => setShowTemplateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <File className="h-4 w-4 mr-2" />
            Templates
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Constraint
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
                  <option value="all">All Constraints</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="CRITICAL">Critical Priority</option>
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="LOW">Low Priority</option>
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
                  placeholder="Search constraints..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Constraints List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Your Constraints ({filteredConstraints.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredConstraints.length === 0 ? (
            <div className="p-12 text-center">
              <Settings className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No constraints found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Get started by creating your first constraint'
                }
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Constraint
                </button>
              </div>
            </div>
          ) : (
            filteredConstraints.map((constraint) => (
              <div key={constraint.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {constraint.isActive ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {constraint.name}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {constraint.description}
                      </p>
                      <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                          {constraint.metric} {getOperatorLabel(constraint.operator).toLowerCase()} {constraint.value}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(constraint.priority)}`}>
                          {constraint.priority}
                        </span>
                        {constraint.tags.length > 0 && (
                          <div className="flex space-x-1">
                            {constraint.tags.map((tag, index) => (
                              <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleConstraint(constraint.id, constraint.isActive)}
                      className={`text-sm px-3 py-1 rounded-full border ${
                        constraint.isActive 
                          ? 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100'
                          : 'border-gray-200 text-gray-700 bg-gray-50 hover:bg-gray-100'
                      }`}
                      title={constraint.isActive ? 'Disable' : 'Enable'}
                    >
                      {constraint.isActive ? (
                        <>
                          <Power className="h-3 w-3 mr-1 inline" />
                          Active
                        </>
                      ) : (
                        <>
                          <PowerOff className="h-3 w-3 mr-1 inline" />
                          Inactive
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setEditingConstraint(constraint)}
                      className="text-gray-400 hover:text-gray-600"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteConstraint(constraint.id, constraint.name)}
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

      {/* Create Constraint Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create New Constraint</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={newConstraint.name}
                    onChange={(e) => setNewConstraint({...newConstraint, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g., Revenue Growth Rate"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newConstraint.description}
                    onChange={(e) => setNewConstraint({...newConstraint, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Optional description"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Metric *
                  </label>
                  <input
                    type="text"
                    value={newConstraint.metric}
                    onChange={(e) => setNewConstraint({...newConstraint, metric: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g., revenue_growth_rate"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Operator *
                    </label>
                    <select
                      value={newConstraint.operator}
                      onChange={(e) => setNewConstraint({...newConstraint, operator: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="gt">Greater than</option>
                      <option value="gte">Greater than or equal</option>
                      <option value="lt">Less than</option>
                      <option value="lte">Less than or equal</option>
                      <option value="eq">Equals</option>
                      <option value="ne">Not equals</option>
                      <option value="contains">Contains</option>
                      <option value="not_contains">Does not contain</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Value *
                    </label>
                    <input
                      type="text"
                      value={newConstraint.value}
                      onChange={(e) => setNewConstraint({...newConstraint, value: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="e.g., 0.15"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={newConstraint.priority}
                    onChange={(e) => setNewConstraint({...newConstraint, priority: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateConstraint}
                    className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Create Constraint
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Constraint Templates</h3>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {templates.map((template) => (
                  <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{template.name}</h4>
                      <button
                        onClick={() => handleApplyTemplate(template.id)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Apply
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">{template.description}</p>
                    <div className="text-xs text-gray-600">
                      <strong>Includes:</strong> {template.constraints.length} constraints
                    </div>
                  </div>
                ))}
                {templates.length === 0 && (
                  <div className="text-center py-8">
                    <File className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No templates available</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Templates will be available soon
                    </p>
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