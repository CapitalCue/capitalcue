import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, CheckCircle, Clock, Settings } from "lucide-react";

const Alerts = () => {
  const mockAlerts = [
    {
      id: "1",
      title: "Critical Constraint Violation",
      message: "TechCorp_Q4_2023.pdf has cash runway below 18 months threshold",
      severity: "critical",
      timestamp: new Date("2024-01-15T10:30:00"),
      read: false,
      documentName: "TechCorp_Q4_2023.pdf"
    },
    {
      id: "2",
      title: "Document Processing Complete",
      message: "StartupX_Q3_2023.xlsx has been successfully processed and analyzed",
      severity: "info",
      timestamp: new Date("2024-01-14T15:45:00"),
      read: true,
      documentName: "StartupX_Q3_2023.xlsx"
    },
    {
      id: "3",
      title: "Constraint Violation Warning",
      message: "Debt-to-equity ratio exceeds recommended threshold in latest analysis",
      severity: "warning",
      timestamp: new Date("2024-01-14T09:20:00"),
      read: false,
      documentName: "FinanceInc_Q2_2023.csv"
    },
    {
      id: "4",
      title: "New Document Uploaded",
      message: "GrowthCo_Annual_2023.pdf has been uploaded and is being processed",
      severity: "info",
      timestamp: new Date("2024-01-13T16:10:00"),
      read: true,
      documentName: "GrowthCo_Annual_2023.pdf"
    }
  ];

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'info':
        return <CheckCircle className="h-4 w-4 text-primary" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
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

  const unreadCount = mockAlerts.filter(alert => !alert.read).length;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Alerts & Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated on constraint violations and system events
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Alert Settings
            </Button>
            <Button>
              Mark All Read
            </Button>
          </div>
        </div>

        {/* Alert Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread Alerts</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{unreadCount}</div>
              <p className="text-xs text-muted-foreground">
                Require attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {mockAlerts.filter(a => a.severity === 'critical').length}
              </div>
              <p className="text-xs text-muted-foreground">
                High priority
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Alerts</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {mockAlerts.filter(a => 
                  a.timestamp.toDateString() === new Date().toDateString()
                ).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Recent activity
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Alerts List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
            <CardDescription>Latest notifications and system events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockAlerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-4 border rounded-lg transition-colors ${
                    !alert.read 
                      ? 'bg-primary/5 border-primary/20' 
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getSeverityIcon(alert.severity)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-medium ${!alert.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {alert.title}
                          </h3>
                          <Badge variant={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          {!alert.read && (
                            <div className="w-2 h-2 bg-primary rounded-full" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {alert.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{alert.timestamp.toLocaleString()}</span>
                          <span>Document: {alert.documentName}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!alert.read && (
                        <Button variant="ghost" size="sm">
                          Mark Read
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alert Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Alert Preferences</CardTitle>
            <CardDescription>Configure when and how you receive notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Critical Constraint Violations</h3>
                  <p className="text-sm text-muted-foreground">
                    Get notified immediately when critical investment constraints are violated
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Enabled
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Document Processing Updates</h3>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications when document processing is complete
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Enabled
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Weekly Analysis Summary</h3>
                  <p className="text-sm text-muted-foreground">
                    Get a weekly summary of all investment analyses
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Disabled
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">System Maintenance Alerts</h3>
                  <p className="text-sm text-muted-foreground">
                    Be notified about scheduled maintenance and system updates
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Enabled
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Alerts;