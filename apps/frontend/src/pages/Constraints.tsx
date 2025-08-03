import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Shield, Plus, Edit, Trash2 } from "lucide-react";
import { getConstraints, createConstraint } from "@/lib/realApi";
import { Constraint } from "@/types";
import { constraintTemplates } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";

const Constraints = () => {
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    metric: "",
    operator: "",
    value: "",
    severity: "",
    message: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    loadConstraints();
  }, []);

  const loadConstraints = async () => {
    try {
      const data = await getConstraints();
      setConstraints(data);
    } catch (error) {
      console.error('Failed to load constraints:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createConstraint({
        name: formData.name,
        metric: formData.metric,
        operator: formData.operator as any,
        value: parseFloat(formData.value),
        severity: formData.severity as any,
        message: formData.message,
        isActive: true
      });
      
      toast({
        title: "Constraint created",
        description: "New investment constraint has been added successfully.",
      });
      
      setFormData({
        name: "",
        metric: "",
        operator: "",
        value: "",
        severity: "",
        message: ""
      });
      setShowForm(false);
      loadConstraints();
    } catch (error) {
      toast({
        title: "Failed to create constraint",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const loadTemplate = (template: any) => {
    setFormData({
      name: template.name,
      metric: template.metric,
      operator: template.operator,
      value: template.value.toString(),
      severity: template.severity,
      message: template.message
    });
    setShowForm(true);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-destructive bg-destructive/10';
      case 'warning':
        return 'text-warning bg-warning/10';
      case 'info':
        return 'text-primary bg-primary/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Investment Constraints</h1>
            <p className="text-muted-foreground">Define rules for investment analysis</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Constraint
          </Button>
        </div>

        {/* Constraint Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Constraint</CardTitle>
              <CardDescription>Define investment criteria and thresholds</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Constraint Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => updateFormData("name", e.target.value)}
                      placeholder="e.g., Revenue Growth Target"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="metric">Financial Metric</Label>
                    <Select onValueChange={(value) => updateFormData("metric", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select metric" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="revenue_growth">Revenue Growth (%)</SelectItem>
                        <SelectItem value="debt_to_equity">Debt-to-Equity Ratio</SelectItem>
                        <SelectItem value="profit_margin">Profit Margin (%)</SelectItem>
                        <SelectItem value="cash_runway_months">Cash Runway (months)</SelectItem>
                        <SelectItem value="current_ratio">Current Ratio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="operator">Operator</Label>
                    <Select onValueChange={(value) => updateFormData("operator", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select operator" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=">">Greater than (&gt;)</SelectItem>
                        <SelectItem value="<">Less than (&lt;)</SelectItem>
                        <SelectItem value=">=">Greater than or equal (&gt;=)</SelectItem>
                        <SelectItem value="<=">Less than or equal (&lt;=)</SelectItem>
                        <SelectItem value="=">Equal to (=)</SelectItem>
                        <SelectItem value="!=">Not equal to (!=)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="value">Target Value</Label>
                    <Input
                      id="value"
                      type="number"
                      step="0.01"
                      value={formData.value}
                      onChange={(e) => updateFormData("value", e.target.value)}
                      placeholder="e.g., 20"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="severity">Severity</Label>
                    <Select onValueChange={(value) => updateFormData("severity", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Custom Message</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => updateFormData("message", e.target.value)}
                    placeholder="Explain why this constraint is important..."
                    rows={3}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button type="submit">Create Constraint</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Constraint Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Constraint Templates</CardTitle>
            <CardDescription>Quick start with common investment criteria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {constraintTemplates.map((template, index) => (
                <div key={index} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{template.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(template.severity)}`}>
                      {template.severity}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{template.message}</p>
                  <Button variant="outline" size="sm" onClick={() => loadTemplate(template)}>
                    Use Template
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Constraints */}
        <Card>
          <CardHeader>
            <CardTitle>Active Constraints</CardTitle>
            <CardDescription>Currently applied investment rules</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {constraints.map((constraint) => (
                <div key={constraint.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Shield className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-medium">{constraint.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {constraint.metric.replace('_', ' ')} {constraint.operator} {constraint.value}
                      </p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getSeverityColor(constraint.severity)}`}>
                        {constraint.severity}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {constraints.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="mx-auto h-12 w-12 mb-4" />
                  <p>No constraints defined yet</p>
                  <p className="text-sm">Create your first investment constraint to get started</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Constraints;