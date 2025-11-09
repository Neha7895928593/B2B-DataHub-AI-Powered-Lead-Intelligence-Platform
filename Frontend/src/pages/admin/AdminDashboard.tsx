import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  TrendingUp,
  Users,
  Database,
  DollarSign,
  Download,
  Eye,
  MoreHorizontal,
} from "lucide-react";

const stats = [
  {
    title: "Total Revenue",
    value: "$45,231.89",
    change: "+20.1%",
    trend: "up",
    icon: DollarSign,
  },
  {
    title: "Active Customers",
    value: "2,350",
    change: "+180",
    trend: "up",
    icon: Users,
  },
  {
    title: "Total Datasets",
    value: "186",
    change: "+12",
    trend: "up",
    icon: Database,
  },
  {
    title: "Downloads",
    value: "12,234",
    change: "+15%",
    trend: "up",
    icon: Download,
  },
];

const recentOrders = [
  {
    id: "ORD-001",
    customer: "John Doe",
    dataset: "US Restaurants",
    amount: "$299.00",
    status: "completed",
    date: "2024-01-15",
  },
  {
    id: "ORD-002",
    customer: "Jane Smith",
    dataset: "UK Hotels",
    amount: "$199.00",
    status: "processing",
    date: "2024-01-15",
  },
  {
    id: "ORD-003",
    customer: "Mike Johnson",
    dataset: "Global Airports",
    amount: "$499.00",
    status: "completed",
    date: "2024-01-14",
  },
  {
    id: "ORD-004",
    customer: "Sarah Wilson",
    dataset: "EU Car Dealerships",
    amount: "$399.00",
    status: "pending",
    date: "2024-01-14",
  },
];

const topDatasets = [
  {
    name: "US Restaurants Database",
    downloads: 1234,
    revenue: "$12,340",
    rating: 4.8,
  },
  {
    name: "Global Hotels Directory",
    downloads: 987,
    revenue: "$9,870",
    rating: 4.6,
  },
  {
    name: "European Retail Stores",
    downloads: 756,
    revenue: "$7,560",
    rating: 4.7,
  },
  {
    name: "Asian Healthcare Centers",
    downloads: 543,
    revenue: "$5,430",
    rating: 4.5,
  },
];

export default function AdminDashboard() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-success/10 text-success">Completed</Badge>;
      case "processing":
        return <Badge className="bg-warning/10 text-warning">Processing</Badge>;
      case "pending":
        return <Badge className="bg-muted text-muted-foreground">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your business today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-success flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        {/* <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recent Orders
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                View All
              </Button>
            </CardTitle>
            <CardDescription>Latest customer orders and transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.customer}</p>
                        <p className="text-sm text-muted-foreground">{order.dataset}</p>
                      </div>
                    </TableCell>
                    <TableCell>{order.amount}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card> */}

        {/* Top Performing Datasets */}
        {/* <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Top Performing Datasets
              <Button variant="outline" size="sm">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </Button>
            </CardTitle>
            <CardDescription>Most popular and revenue-generating datasets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topDatasets.map((dataset, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{dataset.name}</h4>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-muted-foreground">
                        {dataset.downloads} downloads
                      </span>
                      <span className="text-sm font-medium text-success">
                        {dataset.revenue}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-sm font-medium text-foreground">
                        ⭐ {dataset.rating}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card> */}
      </div>
    </div>
  );
}