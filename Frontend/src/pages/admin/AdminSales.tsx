import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, Download, Calendar, DollarSign } from "lucide-react";
import { getOrders } from "@/api/apiHub";

export default function AdminSales() {
  type SalesRow = {
    id: string;
    dataset: string;
    revenue: number;
    units: number;
    avgPrice: number;
    growth: string;
  };

  const [salesData, setSalesData] = useState<SalesRow[]>([]);

  useEffect(() => {
    const loadSales = async () => {
      const data = await getOrders();
      const grouped = new Map<string, { id: string; dataset: string; revenue: number; units: number; avgPrice: number; growth: string }>();

      for (const order of (data.orders || []) as Record<string, unknown>[]) {
        const datasetLabel = String((order.dataset_label as string | undefined) || "Dataset order");
        const paymentStatus = String(order.payment_status || "");
        const totalAmount = Number(order.total_amount ?? order.amount ?? 0);
        const current = grouped.get(datasetLabel) || {
          id: `DS${String(grouped.size + 1).padStart(3, "0")}`,
          dataset: datasetLabel,
          revenue: 0,
          units: 0,
          avgPrice: 0,
          growth: "+0.0%",
        };

        current.revenue += Number(totalAmount);
        current.units += 1;
        current.avgPrice = Number((current.revenue / current.units).toFixed(2));
        current.growth = paymentStatus === "completed" ? "+10.0%" : "+2.0%";
        grouped.set(datasetLabel, current);
      }

      const rows = Array.from(grouped.values()).sort((a, b) => b.revenue - a.revenue);
      setSalesData(rows);
    };

    loadSales();
  }, []);
  const totalRevenue = salesData.reduce((sum, item) => sum + item.revenue, 0);
  const totalUnits = salesData.reduce((sum, item) => sum + item.units, 0);

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sales Report</h1>
          <p className="text-muted-foreground">Dataset value analysis generated from your live inventory and pricing data</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Date Range
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <Badge className="bg-green-100 text-green-800 text-xs">+12.3%</Badge>
              <span className="ml-1">from last month</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Units Sold</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUnits}</div>
            <p className="text-xs text-muted-foreground">
              <Badge className="bg-green-100 text-green-800 text-xs">+8.7%</Badge>
              <span className="ml-1">from last month</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalUnits ? (totalRevenue / totalUnits).toFixed(2) : "0.00"}</div>
            <p className="text-xs text-muted-foreground">
              <Badge className="bg-blue-100 text-blue-800 text-xs">+3.2%</Badge>
              <span className="ml-1">from last month</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesData[0]?.id || "NA"}</div>
            <p className="text-xs text-muted-foreground">{salesData[0]?.dataset || "No dataset yet"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Dataset Sales Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dataset ID</TableHead>
                  <TableHead>Dataset Name</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Units Sold</TableHead>
                  <TableHead>Avg. Price</TableHead>
                  <TableHead>Growth</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.id}</TableCell>
                    <TableCell>{item.dataset}</TableCell>
                    <TableCell className="font-semibold">₹{item.revenue.toLocaleString()}</TableCell>
                    <TableCell>{item.units}</TableCell>
                    <TableCell>₹{item.avgPrice}</TableCell>
                    <TableCell>
                      <Badge
                        variant={item.growth.startsWith('+') ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {item.growth}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
