import { useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Mail, MapPinned, Phone } from "lucide-react";
import { useDataContext } from "@/contexts/DataContext";

export default function AdminDashboard() {
  const { datasets, fetchDatasets } = useDataContext();

  useEffect(() => {
    if (!datasets.length) {
      void fetchDatasets({});
    }
  }, [datasets.length, fetchDatasets]);

  const stats = useMemo(() => {
    const totalRecords = datasets.reduce(
      (sum, item) => sum + (item.filtered_total_records || item.total_records || 0),
      0,
    );
    const totalEmails = datasets.reduce(
      (sum, item) => sum + (item.filtered_email_count || item.total_emails || 0),
      0,
    );
    const totalPhones = datasets.reduce(
      (sum, item) => sum + (item.filtered_phone_count || item.total_phones || 0),
      0,
    );
    const regions = new Set(
      datasets.map((item) => `${item.country}-${item.state || "all"}-${item.city || "all"}`),
    );

    return [
      {
        title: "Live Datasets",
        value: datasets.length.toLocaleString(),
        subtitle: "Available datasets",
        icon: Database,
      },
      {
        title: "Reachable Emails",
        value: totalEmails.toLocaleString(),
        subtitle: "Email contacts",
        icon: Mail,
      },
      {
        title: "Reachable Phones",
        value: totalPhones.toLocaleString(),
        subtitle: "Phone contacts",
        icon: Phone,
      },
      {
        title: "Market Coverage",
        value: regions.size.toLocaleString(),
        subtitle: `${totalRecords.toLocaleString()} total records`,
        icon: MapPinned,
      },
    ];
  }, [datasets]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Operations Dashboard</h1>
      </div>

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
              <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  );
}
