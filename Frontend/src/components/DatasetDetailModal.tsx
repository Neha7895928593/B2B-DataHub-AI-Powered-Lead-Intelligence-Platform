import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { MapPin, Mail, Phone, Database, ShoppingCart, Download, ChevronDown, Sparkles, Wand2, Loader2, Copy, Check } from "lucide-react";
import { Dataset, useDataContext } from "@/contexts/DataContext";
import { useState } from "react";
import api from "@/api/api";
import { generateOutreachHooksAI } from "@/api/apiHub";
import { toast } from "sonner";

interface DatasetDetailModalProps {
  dataset: Dataset | null;
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (dataset: Dataset) => void;
  onDownload: (dataset: Dataset) => void;
}

const DatasetDetailModal = ({ dataset, isOpen, onClose, onPurchase, onDownload }: DatasetDetailModalProps) => {
  const { categories, countries } = useDataContext();
  const [hooks, setHooks] = useState<{ leadId: number; hook: string }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  if (!dataset) return null;

  const formatNumber = (num?: number | string) => {
    if (num === undefined || num === null) return "0";
    return Number(num).toLocaleString();
  };

  const categoryLabel =
    categories.find(cat => Number(cat.category_id) === dataset.category_id)?.category_name
    || dataset.category
    || "N/A";

  const countryLabel =
    countries.find(c => Number(c.country_id) === dataset.country_id)?.country_name
    || dataset.country
    || "N/A";

  const sampleRecords = (dataset.sample_file_Data || []).slice(0, 4);
  const hasMorePreviewRows = (dataset.sample_file_Data?.length || 0) > sampleRecords.length;

  const formatValue = (value: unknown) => {
    if (value == null || value === "") return "-";
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  const baseFields = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "address", label: "Address" },
    { key: "category_name", label: "Category" },
    { key: "country_name", label: "Country" },
    { key: "state_name", label: "State" },
    { key: "city_name", label: "City" },
  ];

  const dynamicFieldKeys = Array.from(
    sampleRecords.reduce((keys, record) => {
      const extraFields = record.extra_fields && typeof record.extra_fields === "object"
        ? record.extra_fields
        : {};

      Object.keys(extraFields).forEach((key) => keys.add(key));
      return keys;
    }, new Set<string>()),
  );

  const getFieldValue = (record: Record<string, unknown>, key: string) => {
    if (key in record) return record[key];
    return record.extra_fields?.[key as keyof Record<string, unknown>];
  };

  const previewColumns = [
    { key: "name", label: "Name", width: "minmax(0,1.2fr)" },
    { key: "email", label: "Email", width: "minmax(0,1.4fr)" },
    { key: "phone", label: "Phone", width: "minmax(0,1fr)" },
    { key: "country_name", label: "Country", width: "minmax(0,0.9fr)" },
    { key: "city_name", label: "City", width: "minmax(0,0.9fr)" },
    { key: "price", label: "Price", width: "minmax(0,0.7fr)" },
  ];
 
  const generateHooks = async () => {
    if (!dataset?.sample_file_Data?.length) return;
    
    setIsGenerating(true);
    try {
      const data = await generateOutreachHooksAI({
        leads: dataset.sample_file_Data.slice(0, 5)
      });
      
      if (data.success) {
        setHooks(data.hooks);
        toast.success("AI hooks generated!");
      }
    } catch (error: any) {
      console.error("Hooks generation error:", error);
      toast.error(error.response?.data?.message || "Failed to generate hooks");
    } finally {
      setIsGenerating(false);
    }
  };
 
  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Hook copied to clipboard");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[92vw] lg:max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl lg:text-2xl font-semibold text-card-foreground">
            Dataset Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 lg:space-y-6 pt-2">

          {/* Dataset Name */}
          <div className="space-y-2">
            <h3 className="text-lg lg:text-xl font-medium text-card-foreground">{dataset.name}</h3>
            <Badge variant="secondary" className="bg-primary/10 text-primary text-xs lg:text-sm">
              {categoryLabel}
            </Badge>
          </div>

          <Separator />

          {/* Dataset Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
            <div className="text-center p-3 lg:p-4 bg-muted/50 rounded-lg">
              <Database className="w-5 h-5 lg:w-6 lg:h-6 mx-auto mb-2 text-primary" />
              <div className="text-lg lg:text-2xl font-bold text-card-foreground">
                {formatNumber(dataset.total_records)}
              </div>
              <div className="text-xs lg:text-sm text-muted-foreground">Total Records</div>
            </div>
            <div className="text-center p-3 lg:p-4 bg-muted/50 rounded-lg">
              <Mail className="w-5 h-5 lg:w-6 lg:h-6 mx-auto mb-2 text-primary" />
              <div className="text-lg lg:text-2xl font-bold text-card-foreground">
                {formatNumber(dataset.total_emails)}
              </div>
              <div className="text-xs lg:text-sm text-muted-foreground">Email Addresses</div>
            </div>
            <div className="text-center p-3 lg:p-4 bg-muted/50 rounded-lg">
              <Phone className="w-5 h-5 lg:w-6 lg:h-6 mx-auto mb-2 text-primary" />
              <div className="text-lg lg:text-2xl font-bold text-card-foreground">
                {formatNumber(dataset.total_phones)}
              </div>
              <div className="text-xs lg:text-sm text-muted-foreground">Phone Numbers</div>
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-3">
            <h4 className="font-medium text-card-foreground flex items-center gap-2 text-sm lg:text-base">
              <MapPin className="w-4 h-4" />
              Location Details
            </h4>
            <div className="space-y-2 text-xs lg:text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Country:</span>
                <span className="text-card-foreground font-medium">{countryLabel}</span>
              </div>
              {dataset.state && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">State:</span>
                  <span className="text-card-foreground font-medium capitalize">{dataset.state.replace('-', ' ')}</span>
                </div>
              )}
              {dataset.city && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">City:</span>
                  <span className="text-card-foreground font-medium capitalize">{dataset.city.replace('-', ' ')}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <Card className="border border-border overflow-hidden">
            <div className="bg-muted/30 px-4 py-2 border-b border-border flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Sample Preview</span>
              <span className="text-[10px] text-muted-foreground">
                Showing top {sampleRecords.length} rows
              </span>
            </div>

            <div className="relative">
              <div className="max-h-[320px] overflow-hidden">
                <div className="overflow-x-hidden">
                  <div
                    className="grid gap-3 border-b border-border bg-muted/50 px-4 py-3 text-xs font-semibold text-muted-foreground"
                    style={{ gridTemplateColumns: previewColumns.map((column) => column.width).join(" ") }}
                  >
                    {previewColumns.map((column) => (
                      <div key={column.key} className="truncate">
                        {column.label}
                      </div>
                    ))}
                  </div>

                  <div className="divide-y divide-border">
                    {sampleRecords.map((record, index) => (
                      <div
                        key={record.id || index}
                        className="px-4 py-3 hover:bg-muted/10 transition-colors"
                      >
                        <div
                          className="grid gap-3 text-sm"
                          style={{ gridTemplateColumns: previewColumns.map((column) => column.width).join(" ") }}
                        >
                          <div className="truncate font-medium text-card-foreground">
                            {formatValue(getFieldValue(record, "name"))}
                          </div>
                          <div className="truncate text-muted-foreground">
                            {formatValue(getFieldValue(record, "email"))}
                          </div>
                          <div className="truncate text-muted-foreground">
                            {formatValue(getFieldValue(record, "phone"))}
                          </div>
                          <div className="truncate text-muted-foreground">
                            {formatValue(getFieldValue(record, "country_name"))}
                          </div>
                          <div className="truncate text-muted-foreground">
                            {formatValue(getFieldValue(record, "city_name"))}
                          </div>
                          <div className="truncate font-medium text-primary">
                            {formatValue(getFieldValue(record, "price"))}
                          </div>
                        </div>

                        {dynamicFieldKeys.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {dynamicFieldKeys.slice(0, 4).map((key) => (
                              <Badge key={key} variant="outline" className="text-[10px]">
                                {key}: {formatValue(record.extra_fields?.[key])}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {hasMorePreviewRows && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card via-card/95 to-transparent">
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground flex items-center gap-1">
                    <ChevronDown className="h-3 w-3" />
                    More rows available in the full file
                  </div>
                </div>
              )}
            </div>
          </Card>
 
          {/* AI Strategic Hooks Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-card-foreground flex items-center gap-2 text-sm lg:text-base">
                <Sparkles className="w-4 h-4 text-primary" />
                AI Outreach Hooks
              </h4>
              {!hooks.length && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={generateHooks}
                  disabled={isGenerating}
                  className="text-xs h-8 text-primary hover:text-primary hover:bg-primary/10"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3 h-3 mr-2" />
                      Generate Hooks
                    </>
                  )}
                </Button>
              )}
            </div>
 
            {hooks.length > 0 ? (
              <div className="grid gap-3">
                {hooks.map((hookData, idx) => {
                  const lead = dataset.sample_file_Data?.[idx];
                  return (
                    <div key={idx} className="group relative rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] uppercase font-bold text-primary/70">
                          For {lead?.name || `Lead #${idx + 1}`}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => copyToClipboard(hookData.hook, idx)}
                        >
                          {copiedId === idx ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </Button>
                      </div>
                      <p className="text-card-foreground leading-relaxed italic">
                        "{hookData.hook}"
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-6 text-center">
                <p className="text-xs text-muted-foreground mb-2">
                  Get personalized AI outreach hooks for these leads to increase conversion.
                </p>
                {!isGenerating && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={generateHooks}
                    className="text-xs"
                  >
                    Generate Sample Hooks
                  </Button>
                )}
              </div>
            )}
          </div>


          {/* Pricing */}
          <div className="bg-primary/5 p-4 rounded-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Dataset Price</div>
                <div className="text-2xl font-bold text-primary">₹{dataset.filtered_total_price}</div>
                <div className="text-xs text-muted-foreground">One-time purchase</div>
              </div>

               
              {/* <div className="text-left sm:text-right">
                
                <div className="text-xs lg:text-sm text-muted-foreground">Per Record</div>
                <div className="text-lg font-semibold text-card-foreground">₹ 0.05</div>
              </div> */}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2 lg:pt-4">
            <Button onClick={() => onDownload(dataset)} variant="outline" className="flex-1 hover:bg-primary hover:text-primary-foreground h-10 lg:h-11 text-sm lg:text-base">
              <Download className="w-4 h-4 mr-2" />
              Download Sample
            </Button>
            <Button onClick={() => onPurchase(dataset)} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground h-10 lg:h-11 text-sm lg:text-base">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Purchase Dataset
            </Button>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DatasetDetailModal;







// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Separator } from "@/components/ui/separator";
// import { MapPin, Mail, Phone, Database, ShoppingCart, Download } from "lucide-react";
// import { Dataset, useDataContext } from "@/contexts/DataContext";

// interface DatasetDetailModalProps {
//   dataset: Dataset | null;
//   isOpen: boolean;
//   onClose: () => void;
//   onPurchase: (dataset: Dataset) => void;
//   onDownload: (dataset: Dataset) => void;
// }

// const DatasetDetailModal = ({ dataset, isOpen, onClose, onPurchase, onDownload }: DatasetDetailModalProps) => {
//   if (!dataset) return null;

//   const { categories, countries } = useDataContext();

//   const formatNumber = (num: number) => num.toLocaleString();

//   // Dynamically find category label
//   const categoryLabel = categories.map(cat => cat.category_id === dataset.category );

//   // Dynamically find country label
//   const countryLabel = countries.map(c => c.country_id === dataset.country);

//   const price = Math.floor(dataset.total_records * 0.05); // $0.05 per record

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="max-w-4xl w-[95vw] max-h-[95vh] overflow-y-auto mx-4">
//         <DialogHeader>
//           <DialogTitle className="text-xl lg:text-2xl font-semibold text-card-foreground">
//             Dataset Details
//           </DialogTitle>
//         </DialogHeader>
        
//         <div className="space-y-4 lg:space-y-6 p-1">
//           {/* Dataset Name */}
//           <div className="space-y-2">
//             <h3 className="text-lg lg:text-xl font-medium text-card-foreground leading-tight">
//               {dataset.name}
//             </h3>
//             <Badge variant="secondary" className="bg-primary/10 text-primary text-xs lg:text-sm">
//               {categoryLabel}
//             </Badge>
//           </div>

//           <Separator />

//           {/* Dataset Statistics */}
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
//             <div className="text-center p-3 lg:p-4 bg-muted/50 rounded-lg">
//               <Database className="w-5 h-5 lg:w-6 lg:h-6 mx-auto mb-2 text-primary" />
//               <div className="text-lg lg:text-2xl font-bold text-card-foreground">
//                 {formatNumber(dataset.total_records)}
//               </div>
//               <div className="text-xs lg:text-sm text-muted-foreground">Total Records</div>
//             </div>
            
//             <div className="text-center p-3 lg:p-4 bg-muted/50 rounded-lg">
//               <Mail className="w-5 h-5 lg:w-6 lg:h-6 mx-auto mb-2 text-primary" />
//               <div className="text-lg lg:text-2xl font-bold text-card-foreground">
//                 {formatNumber(dataset.total_emails)}
//               </div>
//               <div className="text-xs lg:text-sm text-muted-foreground">Email Addresses</div>
//             </div>
            
//             <div className="text-center p-3 lg:p-4 bg-muted/50 rounded-lg">
//               <Phone className="w-5 h-5 lg:w-6 lg:h-6 mx-auto mb-2 text-primary" />
//               <div className="text-lg lg:text-2xl font-bold text-card-foreground">
//                 {formatNumber(dataset.total_phones)}
//               </div>
//               <div className="text-xs lg:text-sm text-muted-foreground">Phone Numbers</div>
//             </div>
//           </div>

//           {/* Location Information */}
//           <div className="space-y-3">
//             <h4 className="font-medium text-card-foreground flex items-center gap-2 text-sm lg:text-base">
//               <MapPin className="w-4 h-4" />
//               Location Details
//             </h4>
//             <div className="space-y-2 text-xs lg:text-sm">
//               <div className="flex justify-between">
//                 <span className="text-muted-foreground">Country:</span>
//                 <span className="text-card-foreground font-medium">{countryLabel}</span>
//               </div>
//               {dataset.state && (
//                 <div className="flex justify-between">
//                   <span className="text-muted-foreground">State:</span>
//                   <span className="text-card-foreground font-medium capitalize">{dataset.state.replace('-', ' ')}</span>
//                 </div>
//               )}
//             </div>
//           </div>

//           <Separator />
            

          

//           {/* Pricing */}
//           <div className="bg-primary/5 p-3 lg:p-4 rounded-lg">
//             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
//               <div>
//                 <div className="text-xs lg:text-sm text-muted-foreground">Dataset Price</div>
//                 <div className="text-xl lg:text-2xl font-bold text-primary">${price}</div>
//                 <div className="text-xs text-muted-foreground">One-time purchase</div>
//               </div>
//               <div className="text-left sm:text-right">
//                 <div className="text-xs lg:text-sm text-muted-foreground">Per Record</div>
//                 <div className="text-lg font-semibold text-card-foreground">$0.05</div>
//               </div>
//             </div>
//           </div>

//           {/* Action Buttons */}
//           <div className="flex flex-col sm:flex-row gap-3 pt-2 lg:pt-4">
//             <Button onClick={() => onDownload(dataset)} variant="outline" className="flex-1 hover:bg-primary hover:text-primary-foreground h-10 lg:h-11 text-sm lg:text-base">
//               <Download className="w-4 h-4 mr-2" />
//               Download Sample
//             </Button>
//             <Button onClick={() => onPurchase(dataset)} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground h-10 lg:h-11 text-sm lg:text-base">
//               <ShoppingCart className="w-4 h-4 mr-2" />
//               Purchase Dataset
//             </Button>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default DatasetDetailModal;
