import { Sparkles, BrainCircuit, Radar, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Dataset } from "@/contexts/DataContext";
import { buildAIInsightSummary } from "@/lib/aiInsights";

interface AIInsightsPanelProps {
  datasets: Dataset[];
  compact?: boolean;
}

const labelStyles = {
  "High Intent": "bg-emerald-100 text-emerald-800",
  Balanced: "bg-amber-100 text-amber-800",
  "Needs Enrichment": "bg-rose-100 text-rose-800",
};

export default function AIInsightsPanel({
  datasets,
  compact = false,
}: AIInsightsPanelProps) {
  const summary = buildAIInsightSummary(datasets);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            AI-ranked signals
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            Lead quality overview
          </h2>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Fast signal scoring based on contact coverage, usable volume, and list quality.
          </p>
        </div>
      </div>

      <div className={`grid gap-4 ${compact ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <BrainCircuit className="h-4 w-4 text-primary" />
              Average Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{summary.averageScore}/100</div>
            <Progress className="mt-3 h-2" value={summary.averageScore} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Radar className="h-4 w-4 text-primary" />
              Ready Lists
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{summary.highIntentCount}</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Datasets that can move directly into outreach workflows.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Best Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{summary.topScore}/100</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Strongest list in the current filtered view.
            </p>
          </CardContent>
        </Card>

        {!compact && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Enrichment Queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{summary.enrichmentCount}</div>
              <p className="mt-2 text-sm text-muted-foreground">
                Lists that should be cleaned or enriched before outreach.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className={`grid gap-4 ${compact ? "lg:grid-cols-1" : "lg:grid-cols-[1.1fr_1.3fr]"}`}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Signal summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.narratives.map((item) => (
              <div
                key={item}
                className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground"
              >
                {item}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recommended next steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary.recommendations.map((item) => (
              <div key={item.datasetId} className="rounded-xl border border-border p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground">{item.datasetName}</h3>
                      <Badge className={labelStyles[item.label]}>{item.label}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.reason}</p>
                    <p className="text-sm font-medium text-foreground">{item.suggestedAction}</p>
                  </div>
                  <div className="min-w-28">
                    <div className="text-sm text-muted-foreground">Score</div>
                    <div className="text-2xl font-semibold text-foreground">{item.score}/100</div>
                    <div className="text-xs text-muted-foreground">
                      Confidence {item.confidence}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
