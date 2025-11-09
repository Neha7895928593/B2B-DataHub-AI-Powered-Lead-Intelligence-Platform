import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, Download, Calendar, DollarSign, TrendingUp, ArrowUpDown } from "lucide-react";

const transactions = [
  {
    id: "TXN-001",
    orderId: "ORD-001",
    customer: "John Doe",
    amount: "$299.00",
    type: "sale",
    status: "completed",
    paymentMethod: "Credit Card",
    gateway: "Stripe",
    date: "2024-01-15 14:30",
    fee: "$8.97",
    net: "$290.03",
  },
  {
    id: "TXN-002",
    orderId: "ORD-002",
    customer: "Jane Smith",
    amount: "$199.00",
    type: "sale",
    status: "pending",
    paymentMethod: "PayPal",
    gateway: "PayPal",
    date: "2024-01-15 12:15",
    fee: "$5.97",
    net: "$193.03",
  },
  {
    id: "TXN-003",
    orderId: "ORD-003",
    customer: "Mike Johnson",
    amount: "$499.00",
    type: "sale",
    status: "completed",
    paymentMethod: "Credit Card",
    gateway: "Stripe",
    date: "2024-01-14 09:45",
    fee: "$14.97",
    net: "$484.03",
  },
  {
    id: "TXN-004",
    orderId: "ORD-001",
    customer: "John Doe",
    amount: "$50.00",
    type: "refund",
    status: "completed",
    paymentMethod: "Credit Card",
    gateway: "Stripe",
    date: "2024-01-14 16:20",
    fee: "-$1.50",
    net: "-$48.50",
  },
  {
    id: "TXN-005",
    orderId: "ORD-004",
    customer: "Sarah Wilson",
    amount: "$399.00",
    type: "sale",
    status: "failed",
    paymentMethod: "Bank Transfer",
    gateway: "Manual",
    date: "2024-01-13 11:30",
    fee: "$0.00",
    net: "$0.00",
  },
];

export default function AdminTransactions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-success/10 text-success">Completed</Badge>;
      case "pending":
        return <Badge className="bg-warning/10 text-warning">Pending</Badge>;
      case "failed":
        return <Badge className="bg-destructive/10 text-destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "sale":
        return <Badge className="bg-primary/10 text-primary">Sale</Badge>;
      case "refund":
        return <Badge className="bg-orange-100 text-orange-800">Refund</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = 
      transaction.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.orderId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    totalRevenue: "$1,247.03",
    totalTransactions: transactions.length,
    successRate: "85%",
    totalFees: "$28.41",
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Transactions</h1>
          <p className="text-muted-foreground">Monitor all payment transactions and financial data</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Date Range
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.totalRevenue}</div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
              <DollarSign className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.totalTransactions}</div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
              </div>
              <ArrowUpDown className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.successRate}</div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
              <TrendingUp className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.totalFees}</div>
                <p className="text-sm text-muted-foreground">Total Fees</p>
              </div>
              <DollarSign className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions, customers, or order IDs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="sale">Sales</SelectItem>
            <SelectItem value="refund">Refunds</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions ({filteredTransactions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Gateway</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Net Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.id}</TableCell>
                    <TableCell>
                      <Button variant="link" className="p-0 h-auto">
                        {transaction.orderId}
                      </Button>
                    </TableCell>
                    <TableCell>{transaction.customer}</TableCell>
                    <TableCell className="font-medium">
                      <span className={transaction.type === 'refund' ? 'text-destructive' : 'text-foreground'}>
                        {transaction.type === 'refund' ? '-' : ''}{transaction.amount}
                      </span>
                    </TableCell>
                    <TableCell>{getTypeBadge(transaction.type)}</TableCell>
                    <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                    <TableCell>{transaction.paymentMethod}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{transaction.gateway}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{transaction.date}</TableCell>
                    <TableCell className="font-medium">
                      <span className={transaction.type === 'refund' ? 'text-destructive' : 'text-success'}>
                        {transaction.net}
                      </span>
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