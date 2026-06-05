import { useEffect, useMemo, useState } from "react";
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
import { getTransactions } from "@/api/apiHub";

export default function AdminTransactions() {
  type TransactionRecord = Record<string, unknown>;

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);

  useEffect(() => {
    const loadTransactions = async () => {
      const data = await getTransactions();
      setTransactions(data.transactions || []);
    };

    loadTransactions();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-success/10 text-success">Completed</Badge>;
      case "processing":
        return <Badge className="bg-warning/10 text-warning">Processing</Badge>;
      case "pending":
        return <Badge className="bg-muted text-muted-foreground">Pending</Badge>;
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

  const filteredTransactions = useMemo(() => transactions.filter((transaction) => {
    const matchesSearch =
      transaction.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(transaction.transaction_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(transaction.order_id).toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  }), [transactions, searchTerm, statusFilter, typeFilter]);

  const stats = useMemo(() => {
    const totalRevenue = transactions.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const totalFees = transactions.reduce((sum, item) => sum + Number(item.fee || 0), 0);
    const completed = transactions.filter((item) => item.status === "completed").length;

    return {
      totalRevenue,
      totalTransactions: transactions.length,
      successRate: transactions.length ? Number(((completed / transactions.length) * 100).toFixed(1)) : 0,
      totalFees,
    };
  }, [transactions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Transactions</h1>
          <p className="text-muted-foreground">Monitor payment records and fee performance pulled from PostgreSQL</p>
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-foreground">₹{stats.totalRevenue.toLocaleString()}</div>
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
                <div className="text-2xl font-bold text-foreground">{stats.successRate}%</div>
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
                <div className="text-2xl font-bold text-foreground">₹{stats.totalFees.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">Total Fees</p>
              </div>
              <DollarSign className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

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
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
                  <TableHead>Fee</TableHead>
                  <TableHead>Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.transaction_id}>
                    <TableCell className="font-medium">TXN-{String(transaction.transaction_id).padStart(3, "0")}</TableCell>
                    <TableCell>ORD-{String(transaction.order_id).padStart(3, "0")}</TableCell>
                    <TableCell>{transaction.customer_name}</TableCell>
                    <TableCell>₹{Number(transaction.amount || 0).toLocaleString()}</TableCell>
                    <TableCell>{getTypeBadge(transaction.type)}</TableCell>
                    <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                    <TableCell className="capitalize">{transaction.payment_method}</TableCell>
                    <TableCell>{transaction.gateway}</TableCell>
                    <TableCell>{String(transaction.created_at).slice(0, 10)}</TableCell>
                    <TableCell>₹{Number(transaction.fee || 0).toLocaleString()}</TableCell>
                    <TableCell>₹{Number(transaction.net_amount || 0).toLocaleString()}</TableCell>
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
