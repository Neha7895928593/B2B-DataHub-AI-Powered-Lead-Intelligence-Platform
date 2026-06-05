import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Download, Users, DollarSign, Mail, Database } from "lucide-react";
import { getAnalyticsSummary } from "@/api/apiHub";

export default function AdminAnalytics() {
  type AnalyticsPayload = {
    totalRevenue?: number;
    totalOrders?: number;
    totalTransactions?: number;
    totalFees?: number;
    totalDatasets?: number;
    reachableEmails?: number;
    totalRecords?: number;
    successRate?: number;
    conversionRate?: number;
  };

  const [analytics, setAnalytics] = useState<AnalyticsPayload | null>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      const data = await getAnalyticsSummary();
      setAnalytics(data.analytics);
    };

    loadAnalytics();
  }, []);

  const metrics: AnalyticsPayload = useMemo(() => analytics || {
    totalRevenue: 0,
    totalOrders: 0,
    totalTransactions: 0,
    totalFees: 0,
    totalDatasets: 0,
    reachableEmails: 0,
    totalRecords: 0,
    successRate: 0,
    conversionRate: 0,
  }, [analytics]);
  const stats = [
    { title: "Revenue Signal", value: `₹${metrics.totalRevenue.toLocaleString()}`, change: `${metrics.successRate}% success`, trend: "up", icon: DollarSign },
    { title: "Reachable Emails", value: metrics.reachableEmails.toLocaleString(), change: `${metrics.conversionRate}% conversion`, trend: "up", icon: Mail },
    { title: "Live Datasets", value: metrics.totalDatasets.toLocaleString(), change: `${metrics.totalOrders} orders`, trend: "up", icon: Database },
    { title: "Lead Volume", value: metrics.totalRecords.toLocaleString(), change: `${metrics.totalTransactions} transactions`, trend: "down", icon: Users },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Measure the commercial strength of your currently imported dataset inventory</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <Badge variant={stat.trend === "up" ? "default" : "destructive"} className="text-xs">
                  {stat.change}
                </Badge>
                <span className="ml-1">current signal</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics Charts Placeholder */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Revenue Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
              <div className="space-y-3 text-left max-w-md">
                <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                  Revenue is being calculated from live order totals stored in PostgreSQL.
                </div>
                <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                  Transaction success rate is based on completed vs total payment records.
                </div>
                <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                  Conversion rate reflects reachable email coverage across imported leads.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Customer Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
              <div className="space-y-4 w-full max-w-lg">
                <div className="rounded-lg border border-border p-4 text-left">
                  <div className="font-medium">Orders recorded</div>
                  <div className="text-sm text-muted-foreground">{metrics.totalOrders} total customer purchases have been stored so far.</div>
                </div>
                <div className="rounded-lg border border-border p-4 text-left">
                  <div className="font-medium">Fee tracking</div>
                  <div className="text-sm text-muted-foreground">₹{metrics.totalFees.toLocaleString()} total gateway fees are tracked from transactions.</div>
                </div>
                <div className="rounded-lg border border-border p-4 text-left">
                  <div className="font-medium">Dataset coverage</div>
                  <div className="text-sm text-muted-foreground">{metrics.totalDatasets} datasets and {metrics.totalRecords.toLocaleString()} lead records are included in the current analysis.</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
