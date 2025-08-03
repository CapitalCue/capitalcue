import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, AlertTriangle, CheckCircle, Download, Eye } from "lucide-react";
import { evaluateConstraints, analyzeDocument } from "@/lib/realApi";
import { sampleEvaluation } from "@/lib/mockData";
import { EvaluationResult, ConstraintViolation } from "@/types";

const Analysis = () => {
  const [evaluation, setEvaluation] = useState<EvaluationResult>(sampleEvaluation);
  const [insights, setInsights] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAnalysisData();
  }, []);

  const loadAnalysisData = async () => {
    setIsLoading(true);
    try {
      const analysisData = await analyzeDocument("1");
      setInsights(analysisData.insights);
      setRecommendations(analysisData.recommendations);
    } catch (error) {
      console.error('Failed to load analysis data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'text-success bg-success/10';
      case 'warning':
        return 'text-warning bg-warning/10';
      case 'fail':
        return 'text-destructive bg-destructive/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'info':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const compliancePercentage = Math.round((evaluation.passedConstraints / evaluation.totalConstraints) * 100);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analysis Results</h1>
            <p className="text-muted-foreground">Investment constraint evaluation and insights</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Button>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Overall Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Overall Investment Assessment
              <Badge className={getStatusColor(evaluation.overallStatus)}>
                {evaluation.overallStatus.toUpperCase()}
              </Badge>
            </CardTitle>
            <CardDescription>
              Analysis based on {evaluation.totalConstraints} investment constraints
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-success mb-1">
                  {evaluation.passedConstraints}
                </div>
                <p className="text-sm text-muted-foreground">Passed</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-warning mb-1">
                  {evaluation.warningCount}
                </div>
                <p className="text-sm text-muted-foreground">Warnings</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-destructive mb-1">
                  {evaluation.criticalCount}
                </div>
                <p className="text-sm text-muted-foreground">Critical</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground mb-1">
                  {compliancePercentage}%
                </div>
                <p className="text-sm text-muted-foreground">Compliance</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Constraint Compliance</span>
                <span>{compliancePercentage}%</span>
              </div>
              <Progress value={compliancePercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Violations List */}
        {evaluation.violations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Constraint Violations
              </CardTitle>
              <CardDescription>
                Issues that require attention before investment decision
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {evaluation.violations.map((violation, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{violation.metric.replace('_', ' ').toUpperCase()}</h3>
                      <Badge variant={getSeverityColor(violation.severity)}>
                        {violation.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {violation.message}
                    </p>
                    <div className="flex gap-4 text-sm">
                      <span>
                        <strong>Actual:</strong> {violation.actualValue}
                      </span>
                      <span>
                        <strong>Expected:</strong> {violation.operator} {violation.expectedValue}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Insights and Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                AI Insights
              </CardTitle>
              <CardDescription>
                Key findings from financial analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{insight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Recommendations
              </CardTitle>
              <CardDescription>
                Suggested actions and improvements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-warning/5 rounded-lg border border-warning/20">
                    <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Investment Decision Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Investment Decision Summary</CardTitle>
            <CardDescription>Final recommendation based on analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-6 rounded-lg border-2 border-dashed border-primary/20 bg-primary/5">
              <div className="flex items-center gap-4 mb-4">
                {evaluation.overallStatus === 'pass' ? (
                  <CheckCircle className="h-8 w-8 text-success" />
                ) : evaluation.overallStatus === 'warning' ? (
                  <AlertTriangle className="h-8 w-8 text-warning" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                )}
                <div>
                  <h3 className="text-lg font-semibold">
                    {evaluation.overallStatus === 'pass' 
                      ? 'RECOMMENDED FOR INVESTMENT' 
                      : evaluation.overallStatus === 'warning'
                      ? 'CONDITIONAL RECOMMENDATION'
                      : 'NOT RECOMMENDED'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Based on {evaluation.totalConstraints} investment criteria
                  </p>
                </div>
              </div>
              
              <p className="text-sm leading-relaxed">
                {evaluation.overallStatus === 'pass' 
                  ? 'This investment opportunity meets all critical constraints and shows strong potential for returns. Proceed with due diligence and investment planning.'
                  : evaluation.overallStatus === 'warning'
                  ? 'This investment opportunity has potential but requires addressing several warning-level constraints before proceeding. Consider additional due diligence.'
                  : 'This investment opportunity does not meet critical investment constraints. Significant improvements would be required before investment consideration.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Analysis;