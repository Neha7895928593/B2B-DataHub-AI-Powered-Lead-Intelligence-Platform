import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Download, Package, ShieldCheck, User } from "lucide-react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { downloadMyOrder, getMyOrders } from "@/api/apiHub";
import { useToast } from "@/hooks/use-toast";

type MyOrder = {
  order_id: number;
  dataset_label: string;
  amount: number;
  tax: number;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
  customer_email: string;
  download_link?: string;
  download_count?: number;
};

const safeFilename = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "dataset_download";

export default function Account() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await getMyOrders();
        setOrders(data.orders || []);
      } catch (error) {
        console.error("Failed to load user orders:", error);
        toast({
          title: "Unable to load orders",
          description: "Please refresh the page and try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, [toast]);

  const summary = useMemo(() => {
    const totalOrders = orders.length;
    const completed = orders.filter((order) => order.payment_status === "completed").length;
    const totalSpend = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

    return { totalOrders, completed, totalSpend };
  }, [orders]);

  const handleDownload = async (order: MyOrder) => {
    try {
      setDownloadingId(order.order_id);
      const blob = await downloadMyOrder(order.order_id);
      const url = window.URL.createObjectURL(new Blob([blob], { type: "text/csv;charset=utf-8;" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${safeFilename(order.dataset_label)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      toast({
        title: "Download failed",
        description: "The purchased dataset could not be downloaded right now.",
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                My Account
              </CardTitle>
              <CardDescription>
                Purchases and downloads are tied to this signed-in account only.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Name</div>
                  <div className="mt-1 font-medium text-card-foreground">{user?.fullName || "-"}</div>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Email</div>
                  <div className="mt-1 font-medium text-card-foreground break-all">{user?.email || "-"}</div>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Role</div>
                  <div className="mt-1 font-medium text-card-foreground capitalize">{user?.role || "user"}</div>
                </div>
              </div>

              <Separator />

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border/60 p-4">
                  <div className="text-xs text-muted-foreground">Total Orders</div>
                  <div className="mt-1 text-2xl font-semibold">{summary.totalOrders}</div>
                </div>
                <div className="rounded-xl border border-border/60 p-4">
                  <div className="text-xs text-muted-foreground">Completed</div>
                  <div className="mt-1 text-2xl font-semibold">{summary.completed}</div>
                </div>
                <div className="rounded-xl border border-border/60 p-4">
                  <div className="text-xs text-muted-foreground">Total Spend</div>
                  <div className="mt-1 text-2xl font-semibold">₹{summary.totalSpend.toLocaleString()}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild variant="outline">
                  <Link to="/">Back to public data</Link>
                </Button>
                <Button variant="secondary" onClick={logout}>
                  Sign out
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Private Deliveries
              </CardTitle>
              <CardDescription>
                Only your purchased datasets appear here. Nobody else can see this list.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-sm text-muted-foreground">Loading your orders...</div>
              ) : orders.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
                  No purchases yet. Browse public datasets and complete a purchase to unlock downloads.
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div
                      key={order.order_id}
                      className="rounded-xl border border-border/60 bg-card p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-medium text-card-foreground">{order.dataset_label}</div>
                            <Badge variant={order.payment_status === "completed" ? "default" : "secondary"}>
                              {order.payment_status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Order #{order.order_id} • {new Date(order.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Buyer: {order.customer_email}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">₹{Number(order.total_amount).toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Paid via {order.payment_method}</div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <Button
                          size="sm"
                          onClick={() => handleDownload(order)}
                          disabled={downloadingId === order.order_id}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          {downloadingId === order.order_id ? "Preparing..." : "Download CSV"}
                        </Button>
                        <div className="text-xs text-muted-foreground">
                          Download count: {order.download_count || 0}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
