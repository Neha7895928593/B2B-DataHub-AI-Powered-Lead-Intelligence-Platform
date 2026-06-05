import type { Dataset } from "@/contexts/DataContext";
import { buildAIInsightSummary, scoreDataset } from "@/lib/aiInsights";

const formatDateOffset = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
};

export const buildOrderRows = (datasets: Dataset[]) =>
  datasets.map((dataset, index) => {
    const insight = scoreDataset(dataset);
    const totalRecords = dataset.filtered_total_records || dataset.total_records || 0;
    const totalPrice = dataset.filtered_total_price || dataset.total_price || 0;
    const unitPrice = totalRecords ? totalPrice / totalRecords : 0;

    return {
      id: `ORD-${String(index + 1).padStart(3, "0")}`,
      customer: `${dataset.country} ${dataset.category} buyers`,
      email: `${dataset.category.toLowerCase().replace(/\s+/g, "-")}@${dataset.country
        .toLowerCase()
        .replace(/\s+/g, "")}.demo`,
      dataset: dataset.name,
      amount: totalPrice,
      status:
        insight.label === "High Intent"
          ? "completed"
          : insight.label === "Balanced"
            ? "processing"
            : "pending",
      date: formatDateOffset(index * 2 + 1),
      downloadCount: dataset.sample_file_Data?.length || 0,
      paymentMethod: insight.label === "High Intent" ? "Card" : "Invoice",
      unitPrice,
    };
  });

export const buildCustomerRows = (datasets: Dataset[]) => {
  const grouped = new Map<
    string,
    {
      id: string;
      name: string;
      email: string;
      totalOrders: number;
      totalSpent: number;
      status: "active" | "premium" | "inactive";
      joinDate: string;
      lastOrder: string;
    }
  >();

  datasets.forEach((dataset, index) => {
    const key = `${dataset.country}-${dataset.category}`;
    const current = grouped.get(key);
    const totalPrice = dataset.filtered_total_price || dataset.total_price || 0;

    if (current) {
      current.totalOrders += 1;
      current.totalSpent += totalPrice;
      current.lastOrder = formatDateOffset(index);
      if (totalPrice > 10000) current.status = "premium";
      else if (current.status !== "premium") current.status = "active";
      return;
    }

    grouped.set(key, {
      id: `SEG-${String(index + 1).padStart(3, "0")}`,
      name: `${dataset.country} ${dataset.category} segment`,
      email: `${dataset.category.toLowerCase().replace(/\s+/g, "-")}@${dataset.country
        .toLowerCase()
        .replace(/\s+/g, "")}.demo`,
      totalOrders: 1,
      totalSpent: totalPrice,
      status: totalPrice > 10000 ? "premium" : totalPrice > 0 ? "active" : "inactive",
      joinDate: formatDateOffset(index * 3 + 2),
      lastOrder: formatDateOffset(index),
    });
  });

  return Array.from(grouped.values());
};

export const buildSalesRows = (datasets: Dataset[]) =>
  datasets.map((dataset, index) => {
    const revenue = dataset.filtered_total_price || dataset.total_price || 0;
    const units = dataset.filtered_total_records || dataset.total_records || 0;
    const avgPrice = units ? revenue / units : 0;
    const insight = scoreDataset(dataset);

    return {
      id: `DS${String(index + 1).padStart(3, "0")}`,
      dataset: dataset.name,
      revenue,
      units,
      avgPrice,
      growth:
        insight.label === "High Intent"
          ? "+14.2%"
          : insight.label === "Balanced"
            ? "+6.8%"
            : "-1.4%",
    };
  });

export const buildAnalyticsMetrics = (datasets: Dataset[]) => {
  const totalRevenue = datasets.reduce(
    (sum, item) => sum + (item.filtered_total_price || item.total_price || 0),
    0,
  );
  const totalOrders = datasets.length;
  const reachableEmails = datasets.reduce(
    (sum, item) => sum + (item.filtered_email_count || item.total_emails || 0),
    0,
  );
  const totalRecords = datasets.reduce(
    (sum, item) => sum + (item.filtered_total_records || item.total_records || 0),
    0,
  );
  const avgConversion = totalRecords ? ((reachableEmails / totalRecords) * 100).toFixed(1) : "0.0";
  const insightSummary = buildAIInsightSummary(datasets);

  return {
    totalRevenue,
    totalOrders,
    reachableEmails,
    totalRecords,
    avgConversion,
    insightSummary,
  };
};
