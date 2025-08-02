import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown,
  Download,
  Share2,
  Calendar,
  FileText,
  Target,
  BarChart3
} from 'lucide-react';

const AnalysisResults: React.FC = () => {
  // Mock analysis data
  const analysisData = {
    company: "TechCorp Inc.",
    ticker: "TECH",
    document: "Q3 2024 Quarterly Report",
    analysisDate: "2024-01-15",
    sector: "SaaS Technology",
    stage: "Series C",
    totalConstraints: 8,
    passedConstraints: 6,
    overallDecision: "Review Recommended",
    confidence: 85
  };

  const constraintResults = [
    {
      id: 1,
      name: "Revenue Growth > 20%",
      category: "Growth",
      result: "PASS",
      actual: "28%",
      benchmark: "> 20%",
      trend: "up",
      importance: "critical"
    },
    {
      id: 2,
      name: "Gross Margin > 70%",
      category: "Profitability", 
      result: "PASS",
      actual: "78%",
      benchmark: "> 70%",
      trend: "up",
      importance: "high"
    },
    {
      id: 3,
      name: "Debt-to-Equity < 0.3",
      category: "Risk",
      result: "FAIL",
      actual: "0.47",
      benchmark: "< 0.3",
      trend: "down",
      importance: "critical"
    },
    {
      id: 4,
      name: "Current Ratio > 1.5",
      category: "Liquidity",
      result: "PASS",
      actual: "2.1",
      benchmark: "> 1.5",
      trend: "up",
      importance: "medium"
    },
    {
      id: 5,
      name: "Burn Rate < 18 months",
      category: "Runway",
      result: "WARNING",
      actual: "16 months",
      benchmark: "< 18 months",
      trend: "down",
      importance: "critical"
    },
    {
      id: 6,
      name: "Net Revenue Retention > 110%",
      category: "Growth",
      result: "PASS",
      actual: "127%",
      benchmark: "> 110%",
      trend: "up",
      importance: "high"
    },
    {
      id: 7,
      name: "Customer Acquisition Cost decreasing",
      category: "Efficiency",
      result: "FAIL",
      actual: "Increasing 15%",
      benchmark: "Decreasing",
      trend: "down",
      importance: "high"
    },
    {
      id: 8,
      name: "Market Leadership Position",
      category: "Strategic",
      result: "PASS",
      actual: "Yes - #2 in vertical",
      benchmark: "Top 3 position",
      trend: "stable",
      importance: "medium"
    }
  ];

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'PASS':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'FAIL':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'WARNING':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'PASS':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'FAIL':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'WARNING':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
    }
  };

  return (
    <>
      <Head>
        <title>Analysis Results - {analysisData.company} - CapitalCue</title>
        <meta name="description" content="Investment constraint analysis results" />
      </Head>

      {/* Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">CapitalCue</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">John Peterson</p>
                  <p className="text-xs text-gray-500">Senior Partner, Acme Ventures</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">JP</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Breadcrumb & Actions */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900 font-medium">Analysis Results</span>
            </div>
            <div className="flex space-x-3">
              <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </button>
            </div>
          </div>

          {/* Summary Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Company Info */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{analysisData.company}</h1>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-700 w-20">Ticker:</span>
                    <span>{analysisData.ticker}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium text-gray-700 w-20">Sector:</span>
                    <span>{analysisData.sector}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium text-gray-700 w-20">Stage:</span>
                    <span>{analysisData.stage}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    <span>Analyzed on {analysisData.analysisDate}</span>
                  </div>
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{analysisData.document}</span>
                  </div>
                </div>
              </div>

              {/* Results Summary */}
              <div className="text-center">
                <div className="mb-4">
                  <div className="text-5xl font-bold text-gray-900 mb-2">
                    {analysisData.passedConstraints}/{analysisData.totalConstraints}
                  </div>
                  <p className="text-gray-600">Constraints Passed</p>
                </div>
                <div className="w-32 h-32 mx-auto mb-4">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="3"
                      strokeDasharray={`${(analysisData.passedConstraints / analysisData.totalConstraints) * 100}, 100`}
                    />
                  </svg>
                  <div className="text-center -mt-20">
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.round((analysisData.passedConstraints / analysisData.totalConstraints) * 100)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Investment Decision */}
              <div className="flex flex-col justify-center">
                <div className="text-center p-6 rounded-lg bg-yellow-50 border border-yellow-200">
                  <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
                  <h3 className="text-xl font-semibold text-yellow-900 mb-2">
                    {analysisData.overallDecision}
                  </h3>
                  <p className="text-sm text-yellow-700 mb-4">
                    Strong fundamentals but requires deeper due diligence on debt levels and CAC trends
                  </p>
                  <div className="text-sm text-yellow-600">
                    Confidence: {analysisData.confidence}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="bg-white rounded-lg shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Constraint Analysis Results
              </h2>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {constraintResults.map((constraint) => (
                  <div key={constraint.id} className={`border rounded-lg p-4 ${getResultColor(constraint.result)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getResultIcon(constraint.result)}
                        <div>
                          <h3 className="font-semibold">{constraint.name}</h3>
                          <div className="flex items-center space-x-4 text-sm mt-1">
                            <span className="px-2 py-1 bg-white/50 rounded text-xs font-medium">
                              {constraint.category}
                            </span>
                            {constraint.importance === 'critical' && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                                Critical
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <div className="text-right">
                            <div className="font-semibold">{constraint.actual}</div>
                            <div className="text-xs opacity-75">vs {constraint.benchmark}</div>
                          </div>
                          {getTrendIcon(constraint.trend)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Key Insights */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                Strengths
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Strong revenue growth at 28% YoY, well above benchmark</li>
                <li>• Excellent gross margins at 78%, indicating pricing power</li>
                <li>• Outstanding net revenue retention at 127%</li>
                <li>• Solid market position as #2 player in vertical</li>
                <li>• Healthy liquidity with current ratio of 2.1</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <XCircle className="w-5 h-5 text-red-600 mr-2" />
                Concerns
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• High debt-to-equity ratio at 0.47, above 0.3 threshold</li>
                <li>• Customer acquisition costs increasing by 15%</li>
                <li>• Burn rate gives only 16 months runway, close to limit</li>
                <li>• Need to monitor capital efficiency trends</li>
                <li>• Requires debt restructuring plan before investment</li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default AnalysisResults;