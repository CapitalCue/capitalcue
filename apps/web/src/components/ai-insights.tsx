'use client'

import { useState } from 'react'
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Target, 
  Lightbulb,
  BarChart3,
  Sparkles,
  Clock,
  Eye,
  ChevronDown,
  ChevronUp,
  Star,
  Info,
  AlertTriangle as Warning,
  Shield,
  Zap
} from 'lucide-react'

interface AIInsight {
  type: 'strength' | 'weakness' | 'opportunity' | 'risk'
  category: string
  title: string
  description: string
  confidence: number
  actionable: boolean
  priority: 'low' | 'medium' | 'high' | 'critical'
}

interface ConstraintSuggestion {
  name: string
  description: string
  metric: string
  operator: string
  value: string
  priority: string
  rationale: string
  confidence: number
}

interface PredictiveInsights {
  predictions: Array<{
    metric: string
    forecast: number
    confidence: number
    timeframe: string
    reasoning: string
  }>
  risks: Array<{
    factor: string
    impact: 'low' | 'medium' | 'high'
    probability: number
    description: string
  }>
  opportunities: Array<{
    area: string
    potential: 'low' | 'medium' | 'high'
    confidence: number
    description: string
  }>
}

interface AIInsightsProps {
  insights: AIInsight[]
  constraintSuggestions: ConstraintSuggestion[]
  predictiveInsights: PredictiveInsights
  serviceStatus: {
    configured: boolean
    message: string
  }
  className?: string
}

export function AIInsights({ 
  insights, 
  constraintSuggestions, 
  predictiveInsights, 
  serviceStatus,
  className = ''
}: AIInsightsProps) {
  const [activeTab, setActiveTab] = useState<'insights' | 'constraints' | 'predictions'>('insights')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'strength':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'weakness':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'opportunity':
        return <TrendingUp className="h-5 w-5 text-blue-500" />
      case 'risk':
        return <Warning className="h-5 w-5 text-orange-500" />
      default:
        return <Info className="h-5 w-5 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-red-600'
      case 'medium':
        return 'text-yellow-600'
      case 'low':
        return 'text-green-600'
      default:
        return 'text-gray-600'
    }
  }

  if (!serviceStatus.configured) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center">
          <Brain className="h-8 w-8 text-yellow-500 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-yellow-800 mb-1">
              AI Insights Not Available
            </h3>
            <p className="text-sm text-yellow-700">
              {serviceStatus.message}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white shadow rounded-lg ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Sparkles className="h-6 w-6 text-purple-500 mr-3" />
            <h3 className="text-lg font-medium text-gray-900">AI-Powered Insights</h3>
          </div>
          <div className="flex items-center space-x-1">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
              Claude AI Active
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex">
          <button
            onClick={() => setActiveTab('insights')}
            className={`py-4 px-6 border-b-2 font-medium text-sm ${
              activeTab === 'insights'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <Eye className="h-4 w-4 mr-2" />
              Insights ({insights.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('constraints')}
            className={`py-4 px-6 border-b-2 font-medium text-sm ${
              activeTab === 'constraints'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Suggestions ({constraintSuggestions.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('predictions')}
            className={`py-4 px-6 border-b-2 font-medium text-sm ${
              activeTab === 'predictions'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Predictions ({predictiveInsights.predictions.length})
            </div>
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'insights' && (
          <div className="space-y-4">
            {insights.length === 0 ? (
              <div className="text-center py-8">
                <Brain className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No insights available</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Run an analysis with AI insights enabled to see recommendations.
                </p>
              </div>
            ) : (
              insights.map((insight, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-sm font-medium text-gray-900">{insight.title}</h4>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(insight.priority)}`}>
                            {insight.priority.toUpperCase()}
                          </span>
                          {insight.actionable && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <Zap className="h-3 w-3 mr-1" />
                              Actionable
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center">
                            <Star className="h-3 w-3 mr-1" />
                            Category: {insight.category}
                          </span>
                          <span className={`font-medium ${getConfidenceColor(insight.confidence)}`}>
                            {Math.round(insight.confidence * 100)}% confidence
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'constraints' && (
          <div className="space-y-4">
            {constraintSuggestions.length === 0 ? (
              <div className="text-center py-8">
                <Target className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No constraint suggestions</h3>
                <p className="mt-1 text-sm text-gray-500">
                  AI analysis didn't identify new constraint opportunities for this dataset.
                </p>
              </div>
            ) : (
              constraintSuggestions.map((suggestion, index) => {
                const itemId = `constraint-${index}`
                const isExpanded = expandedItems.has(itemId)
                
                return (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-gray-900">{suggestion.name}</h4>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(suggestion.priority.toLowerCase())}`}>
                              {suggestion.priority}
                            </span>
                            <button
                              onClick={() => toggleExpanded(itemId)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                          <span>
                            <strong>Constraint:</strong> {suggestion.metric} {suggestion.operator} {suggestion.value}
                          </span>
                          <span className={`font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                            {Math.round(suggestion.confidence * 100)}% confidence
                          </span>
                        </div>
                        {isExpanded && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-md">
                            <h5 className="text-xs font-medium text-gray-900 mb-1">Rationale:</h5>
                            <p className="text-xs text-gray-600">{suggestion.rationale}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {activeTab === 'predictions' && (
          <div className="space-y-6">
            {/* Predictions */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Financial Forecasts</h4>
              <div className="space-y-3">
                {predictiveInsights.predictions.map((prediction, index) => (
                  <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium text-blue-900 capitalize">
                        {prediction.metric.replace(/_/g, ' ')}
                      </h5>
                      <span className={`text-sm font-medium ${getConfidenceColor(prediction.confidence)}`}>
                        {Math.round(prediction.confidence * 100)}% confidence
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 mb-2">
                      <span className="text-lg font-bold text-blue-900">
                        {typeof prediction.forecast === 'number' 
                          ? prediction.forecast.toLocaleString()
                          : prediction.forecast}
                      </span>
                      <span className="text-sm text-blue-700">
                        {prediction.timeframe}
                      </span>
                    </div>
                    <p className="text-sm text-blue-800">{prediction.reasoning}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Risks */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Risk Factors</h4>
              <div className="space-y-3">
                {predictiveInsights.risks.map((risk, index) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium text-red-900">{risk.factor}</h5>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${getImpactColor(risk.impact)}`}>
                          {risk.impact.toUpperCase()} impact
                        </span>
                        <span className="text-sm text-red-700">
                          {Math.round(risk.probability * 100)}% probability
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-red-800">{risk.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Opportunities */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Growth Opportunities</h4>
              <div className="space-y-3">
                {predictiveInsights.opportunities.map((opportunity, index) => (
                  <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium text-green-900">{opportunity.area}</h5>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${getImpactColor(opportunity.potential)}`}>
                          {opportunity.potential.toUpperCase()} potential
                        </span>
                        <span className={`text-sm font-medium ${getConfidenceColor(opportunity.confidence)}`}>
                          {Math.round(opportunity.confidence * 100)}% confidence
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-green-800">{opportunity.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}