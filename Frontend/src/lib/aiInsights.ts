import type { Dataset } from "@/contexts/DataContext";

export type DatasetInsight = {
  datasetId: number;
  datasetName: string;
  score: number;
  confidence: number;
  label: "High Intent" | "Balanced" | "Needs Enrichment";
  reason: string;
  suggestedAction: string;
};

export type AIInsightSummary = {
  averageScore: number;
  topScore: number;
  highIntentCount: number;
  enrichmentCount: number;
  narratives: string[];
  recommendations: DatasetInsight[];
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const safeRatio = (value: number, total: number) => {
  if (!total || total <= 0) {
    return 0;
  }

  return value / total;
};

export const scoreDataset = (dataset: Dataset): DatasetInsight => {
  const totalRecords = dataset.filtered_total_records || dataset.total_records || 0;
  const emailCount = dataset.filtered_email_count || dataset.total_emails || 0;
  const phoneCount = dataset.filtered_phone_count || dataset.total_phones || 0;
  const revenueSignal = dataset.filtered_total_price || dataset.total_price || 0;

  const emailCoverage = safeRatio(emailCount, totalRecords);
  const phoneCoverage = safeRatio(phoneCount, totalRecords);
  const reachCoverage = Math.max(emailCoverage, phoneCoverage);
  const volumeScore = clamp(totalRecords / 2500, 0, 1);
  const revenueScore = clamp(revenueSignal / 50000, 0, 1);

  const score = Math.round(
    (emailCoverage * 40 + phoneCoverage * 30 + volumeScore * 20 + revenueScore * 10) * 100,
  );
  const confidence = Math.round((reachCoverage * 70 + volumeScore * 30) * 100);

  if (score >= 70) {
    return {
      datasetId: dataset.id,
      datasetName: dataset.name,
      score,
      confidence,
      label: "High Intent",
      reason: "Good contact coverage and usable volume make this list ready for activation.",
      suggestedAction: "Use this list first for outreach or featured packaging.",
    };
  }

  if (score >= 45) {
    return {
      datasetId: dataset.id,
      datasetName: dataset.name,
      score,
      confidence,
      label: "Balanced",
      reason: "Coverage is usable, but quality can improve before scale.",
      suggestedAction: "Review missing contact fields or bundle with enrichment.",
    };
  }

  return {
    datasetId: dataset.id,
    datasetName: dataset.name,
    score,
    confidence,
      label: "Needs Enrichment",
      reason: "The list is present, but contact depth is still weak.",
      suggestedAction: "Enrich contacts before using this list in campaigns.",
  };
};

export const buildAIInsightSummary = (datasets: Dataset[]): AIInsightSummary => {
  if (!datasets.length) {
    return {
      averageScore: 0,
      topScore: 0,
      highIntentCount: 0,
      enrichmentCount: 0,
      narratives: [
        "Upload data to generate quality signals and ranked recommendations.",
      ],
      recommendations: [],
    };
  }

  const recommendations = datasets.map(scoreDataset).sort((a, b) => b.score - a.score);
  const averageScore = Math.round(
    recommendations.reduce((sum, item) => sum + item.score, 0) / recommendations.length,
  );
  const topScore = recommendations[0]?.score || 0;
  const highIntentCount = recommendations.filter((item) => item.label === "High Intent").length;
  const enrichmentCount = recommendations.filter(
    (item) => item.label === "Needs Enrichment",
  ).length;

  const narratives = [
    `${highIntentCount} list${highIntentCount === 1 ? " is" : "s are"} ready to use now.`,
    `${enrichmentCount} list${enrichmentCount === 1 ? " needs" : "s need"} cleanup before full outreach.`,
    `Current top score: ${topScore}/100.`,
  ];

  return {
    averageScore,
    topScore,
    highIntentCount,
    enrichmentCount,
    narratives,
    recommendations: recommendations.slice(0, 3),
  };
};
