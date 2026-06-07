
import { useCallback, useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";

import {
  getCategories,
  createCategory,
  uploadData,
  getDatasetSources,
  deleteDatasetSource,
  getDatasetSourcePreview,
  analyzeDatasetAI,
} from '@/api/apiHub';

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Upload, FileText, X, Eye, Trash2, Plus, Loader2, Download, Mail, Phone, ChevronRight, History, FilePlus, Settings2, TableProperties, Sparkles, BrainCircuit, Target, ShieldCheck, Zap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getFriendlyAiErrorMessage } from "@/lib/aiError";


interface UploadedFile {
  source_id: number;
  source_name: string;
  description: string;
  created_at: string;
}

interface Category {
  category_id: number;
  category_name: string;
}

interface DatasetSourcePreview {
  source: UploadedFile;
  summary: {
    total_records: string;
    email_count: string;
    phone_count: string;
    total_price: string;
  };
  rows: Array<Record<string, unknown>>;
}

interface AiInsight {
  summary: string;
  topSegments: string[];
  outreachTip: string;
  trustScore: number;
  potentialValue: string;
}

interface CustomFieldMapping {
  id: number;
  label: string;
  source: string;
}

type TemplateRow = {
  name: string;
  email: string;
  phone: string;
  country: string;
  state: string;
  city: string;
  address: string;
  price: number;
};

const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
  <Label className="font-medium">
    {children} <span className="text-destructive">*</span>
  </Label>
);

const formatDetailValue = (value: unknown): string => {
  if (value === undefined || value === null || value === "") return "-";
  if (Array.isArray(value)) return value.map((item) => formatDetailValue(item)).join(", ");
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  if (typeof value === "string") return value;
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
};

const normalizeFieldKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/gi, "");

const getRowDetails = (row: Record<string, unknown>) => {
  const baseEntries: Array<{ key: string; value: unknown; section: "base" }> = Object.entries(row)
    .filter(([key]) => key !== "extra_fields")
    .map(([key, value]) => ({ key, value, section: "base" }));

  const extraFieldsRaw = row.extra_fields;
  const extraFields =
    typeof extraFieldsRaw === "string"
      ? (() => {
          try {
            const parsed = JSON.parse(extraFieldsRaw);
            return typeof parsed === "object" && parsed !== null ? parsed : {};
          } catch {
            return {};
          }
        })()
      : (typeof extraFieldsRaw === "object" && extraFieldsRaw !== null && !Array.isArray(extraFieldsRaw))
          ? extraFieldsRaw as Record<string, unknown>
          : {};

  const baseKeys = new Set(baseEntries.map((item) => normalizeFieldKey(item.key)));
  const extraEntries: Array<{ key: string; value: unknown; section: "custom" }> = Object.entries(extraFields)
    .filter(([key]) => key && !baseKeys.has(normalizeFieldKey(key)))
    .map(([key, value]) => ({ key, value, section: "custom" }));

  return [...baseEntries, ...extraEntries];
};

export default function AdminUploads() {
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingFiles, setIsFetchingFiles] = useState(true);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
  const [fieldMappings, setFieldMappings] = useState<{ [key: string]: string }>({});
  const [customFieldMappings, setCustomFieldMappings] = useState<CustomFieldMapping[]>([]);
  const [showMapping, setShowMapping] = useState(false);
  const [isSourcePreviewOpen, setIsSourcePreviewOpen] = useState(false);
  const [selectedSourcePreview, setSelectedSourcePreview] = useState<DatasetSourcePreview | null>(null);
  const [newDataset, setNewDataset] = useState({
    category: '',
    description: '',
    price: '',
    proofAttachment: null as File | null,
  });
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedRowDetails, setSelectedRowDetails] = useState<Record<string, unknown> | null>(null);
  const [isRowDetailOpen, setIsRowDetailOpen] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AiInsight | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);


  const databaseFields = [
    { key: 'name', label: 'Lead Name', required: true },
    { key: 'email', label: 'Email', required: true },
    { key: 'phone', label: 'Phone', required: true },
    { key: 'country', label: 'Country', required: true },
    { key: 'state', label: 'State', required: false },
    { key: 'city', label: 'City', required: false },
    { key: 'address', label: 'Address', required: false },
    { key: 'price', label: 'Row Price', required: false },
  ];

  const templateRows: TemplateRow[] = [
    {
      name: "Aisha Khan",
      email: "aisha.khan@brightretail.ae",
      phone: "+971501112233",
      country: "United Arab Emirates",
      state: "Dubai",
      city: "Dubai",
      address: "Business Bay, Dubai",
      price: 25,
    },
    {
      name: "Rahul Mehta",
      email: "rahul.mehta@urbanfoods.in",
      phone: "+919811223344",
      country: "India",
      state: "Maharashtra",
      city: "Mumbai",
      address: "Bandra West, Mumbai",
      price: 18,
    },
  ];

  const templateColumns = databaseFields.map((field) => field.key);
  const autoMapAliases: Record<string, string[]> = {
    name: ["name", "full name", "lead name", "contact name"],
    email: ["email", "email address", "work email", "business email"],
    phone: ["phone", "phone number", "mobile", "mobile number", "contact number"],
    country: ["country", "country name"],
    state: ["state", "region", "province"],
    city: ["city", "town"],
    address: ["address", "street", "street address", "location"],
    price: ["price", "row price", "lead price", "cost"],
  };

  const normalizeHeader = (value: string) =>
    value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");

  const buildAutoMappings = (headers: string[]) => {
    const mappings: Record<string, string> = {};

    for (const field of databaseFields) {
      const aliases = autoMapAliases[field.key] || [];
      const exactMatch = headers.find((header) => aliases.includes(normalizeHeader(header)));
      if (exactMatch) {
        mappings[field.key] = exactMatch;
      }
    }

    return mappings;
  };

  // --- Data Fetching ---
  const fetchInitialData = useCallback(async () => {
    setIsFetchingFiles(true);
    try {
      const [catData, filesData] = await Promise.all([
        getCategories(),
        getDatasetSources()
      ]);
      if (catData.success) setCategories(catData.categories);
      if (filesData.success) setUploadedFiles(filesData.sources);
    } catch (error) {
      toast({ title: "Error fetching data", description: "Could not load categories or uploaded files.", variant: "destructive" });
    } finally {
      setIsFetchingFiles(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const resetForm = () => {
    setNewDataset({ category: "", description: '', price: '', proofAttachment: null });
    setSelectedFile(null);
    setFileHeaders([]);
    setPreviewRows([]);
    setFieldMappings({});
    setCustomFieldMappings([]);
    setShowMapping(false);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      const file = files[0];
      if (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        if (file.size > 8 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: "Use files up to 8 MB on this deployment. Split bigger datasets into smaller batches.",
            variant: "destructive",
          });
          return;
        }
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          const data = e.target?.result;
          if (!data) return;
          try {
            const workbook = XLSX.read(data, { type: "binary" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            const headers = (jsonData[0] as string[]).map(h => String(h || "").trim()).filter(Boolean);
            const rowPreview = (jsonData.slice(1, 5) as unknown[][]).map((row) =>
              headers.reduce((acc, header, index) => {
                acc[header] = String(row[index] ?? "").trim();
                return acc;
              }, {} as Record<string, string>),
            );
            setFileHeaders(headers);
            setPreviewRows(rowPreview);
            setFieldMappings(buildAutoMappings(headers));
            setShowMapping(true);
          } catch (error) {
            toast({ title: "Error reading file", description: "The file might be corrupt.", variant: "destructive" });
          }
        };
        reader.readAsBinaryString(file);
      } else {
        toast({ title: "Invalid file type", variant: "destructive" });
      }
    }
  };

  const handleCreateDataset = async () => {
    if (!selectedFile || !newDataset.category) {
      return toast({ title: "Missing Information", description: "Select a file and category before uploading.", variant: "destructive" });
    }
    const missingMappings = databaseFields.filter(f => f.required && (!fieldMappings[f.key] || fieldMappings[f.key] === "none"));
    if (missingMappings.length > 0) {
      return toast({ title: "Incomplete Mapping", description: `Map required fields: ${missingMappings.map(f => f.label).join(', ')}`, variant: "destructive" });
    }
    if (!fieldMappings.price && !newDataset.price) {
      return toast({
        title: "Price required",
        description: "Either map a price column from the file, or enter one default price for all rows.",
        variant: "destructive",
      });
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("category", newDataset.category);
    if (newDataset.description.trim()) formData.append("description", newDataset.description.trim());
    if (newDataset.price) formData.append("price", newDataset.price);
    formData.append("fieldMappings", JSON.stringify(fieldMappings));
    formData.append(
      "customFieldMappings",
      JSON.stringify(customFieldMappings.filter((item) => item.label.trim() && item.source)),
    );
    if (newDataset.proofAttachment) formData.append("proofAttachment", newDataset.proofAttachment);

    setIsLoading(true);
    try {
      const response = await uploadData(formData); // Aapke apiHub se
      toast({
        title: "Upload Successful!",
        description: `Added: ${response.summary.added}, Updated: ${response.summary.updated}.`,
      });
      resetForm();
      fetchInitialData();
    } catch (error) {
      const message = ((error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      })?.response?.data?.message) || "An error occurred.";

      toast({ title: "Upload Failed", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNewCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const response = await createCategory(newCategoryName);
      if (response.success) {
        toast({ title: `Category "${newCategoryName}" created.` });
        setCategories(prev => [...prev, response.category]);
        setNewDataset(prev => ({ ...prev, category: response.category.category_name }));
        setIsCategoryDialogOpen(false);
        setNewCategoryName("");
      }
    } catch (error) {
      toast({ title: "Failed to create category", variant: "destructive" });
    }
  };

  const handleDeleteFile = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This will delete all associated leads.`)) return;
    try {
      await deleteDatasetSource(id); // Aapke apiHub se
      toast({ title: `"${name}" has been deleted.` });
      fetchInitialData();
    } catch (error) {
      toast({ title: "Failed to delete file", variant: "destructive" });
    }
  };

  const downloadTemplate = (format: "csv" | "xlsx") => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(templateRows, {
        header: templateColumns,
      });

      if (format === "csv") {
        const csvContent = XLSX.utils.sheet_to_csv(worksheet);
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "b2b_dataset_upload_template.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Upload Template");
        XLSX.writeFile(workbook, "b2b_dataset_upload_template.xlsx");
      }

      toast({
        title: "Template downloaded",
        description: `Upload template downloaded as ${format.toUpperCase()}.`,
      });
    } catch (error) {
      toast({
        title: "Template download failed",
        description: "Could not generate the upload template.",
        variant: "destructive",
      });
    }
  };

  const handleAutoMap = () => {
    setFieldMappings(buildAutoMappings(fileHeaders));
    toast({
      title: "Auto-map applied",
      description: "Common columns were matched where possible.",
    });
  };

  const addCustomField = () => {
    setCustomFieldMappings((prev) => [
      ...prev,
      { id: Date.now() + prev.length, label: "", source: "" },
    ]);
  };

  const updateCustomField = (id: number, updates: Partial<CustomFieldMapping>) => {
    setCustomFieldMappings((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    );
  };

  const removeCustomField = (id: number) => {
    setCustomFieldMappings((prev) => prev.filter((item) => item.id !== id));
  };

  const openSourcePreview = async (id: number) => {
    setIsPreviewLoading(true);
    setIsSourcePreviewOpen(true);
    try {
      const data = await getDatasetSourcePreview(id);
      setSelectedSourcePreview(data);
    } catch (error) {
      const message = ((error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      })?.response?.data?.message) || "Could not load dataset preview.";

      toast({
        title: "Preview failed",
        description: message,
        variant: "destructive",
      });
      setIsSourcePreviewOpen(false);
    } finally {
      setIsPreviewLoading(false);
    }
  };
  const handleAiAnalysis = async () => {
    if (!previewRows.length || !fileHeaders.length) return;
    setIsAiLoading(true);
    try {
      const result = await analyzeDatasetAI({
        sampleData: previewRows,
        headers: fileHeaders,
        categoryName: newDataset.category
      });
      if (result.success) {
        setAiAnalysis(result.analysis);
        toast({ title: "AI Analysis Complete", description: "Smart insights generated for your dataset." });
        return;
      }
      toast({
        title: "AI insights unavailable",
        description: result.error || result.message || "AI service returned an unexpected response.",
        variant: "destructive",
      });
    } catch (error) {
      const message = getFriendlyAiErrorMessage(error, "AI insights are temporarily unavailable.");
      toast({
        title: "AI insights unavailable",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  // --- Render ---
  return (
    <div className="space-y-4">
      <Dialog open={isSourcePreviewOpen} onOpenChange={setIsSourcePreviewOpen}>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedSourcePreview?.source.source_name || "Dataset preview"}</DialogTitle>
          </DialogHeader>

          {isPreviewLoading ? (
            <div className="py-10 text-center text-muted-foreground">Loading preview...</div>
          ) : selectedSourcePreview ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground">Rows</div>
                  <div className="text-2xl font-semibold">{Number(selectedSourcePreview.summary.total_records || 0).toLocaleString()}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground">Emails</div>
                  <div className="text-2xl font-semibold">{Number(selectedSourcePreview.summary.email_count || 0).toLocaleString()}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground">Phones</div>
                  <div className="text-2xl font-semibold">{Number(selectedSourcePreview.summary.phone_count || 0).toLocaleString()}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground">Total Price</div>
                  <div className="text-2xl font-semibold">₹{Number(selectedSourcePreview.summary.total_price || 0).toLocaleString()}</div>
                </Card>
              </div>

              <Card className="overflow-hidden">
                <div className="border-b border-border px-4 py-3">
                  <div className="font-medium">Sample rows</div>
                </div>
                <div className="relative overflow-x-auto">
                  <div
                    className="grid gap-3 bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground"
                    style={{ gridTemplateColumns: "repeat(5, minmax(140px, 1fr))", minWidth: "700px" }}
                  >
                    <div>Name</div>
                    <div>Email</div>
                    <div>Phone</div>
                    <div>Price</div>
                    <div>Action</div>
                  </div>
                  <div className="divide-y divide-border">
                    {selectedSourcePreview.rows.map((row, index) => (
                      <div
                        key={row.dataset_id || index}
                        className="grid gap-3 px-4 py-3 text-sm items-center"
                        style={{ gridTemplateColumns: "repeat(5, minmax(140px, 1fr))", minWidth: "700px" }}
                      >
                        <div className="truncate font-medium">{row.name || "-"}</div>
                        <div className="truncate flex items-center gap-1"><Mail className="w-3 h-3" />{row.email || "-"}</div>
                        <div className="truncate flex items-center gap-1"><Phone className="w-3 h-3" />{row.phone || "-"}</div>
                        <div className="truncate text-primary font-medium">₹{row.price || 0}</div>
                        <div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs"
                            onClick={() => {
                              setSelectedRowDetails(row);
                              setIsRowDetailOpen(true);
                            }}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View All
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Row Detail View Dialog */}
      <Dialog open={isRowDetailOpen} onOpenChange={setIsRowDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Lead Detail</DialogTitle>
          </DialogHeader>
          {selectedRowDetails && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto">
              {getRowDetails(selectedRowDetails).map(({ key, value, section }) => (
                <div key={key} className="border-b pb-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    {key.replace(/_/g, " ")}
                  </p>
                  <p className={`text-sm ${section === "base" ? "font-medium" : "text-primary"}`}>
                    {formatDetailValue(value)}
                  </p>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsRowDetailOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Category</DialogTitle></DialogHeader>
          <Input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="e.g., Real Estate Agents" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddNewCategory}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dataset Management</h1>
        </div>
      </div>

      <Tabs defaultValue="history" className="space-y-6">
        <div className="flex items-center justify-between border-b">
          <TabsList className="bg-transparent h-auto p-0 gap-8">
            <TabsTrigger
              value="history"
              className="px-0 py-3 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent rounded-none shadow-none font-bold transition-all flex items-center gap-2 text-muted-foreground"
            >
              <History className="w-4 h-4" />
              Dataset History
            </TabsTrigger>
            <TabsTrigger
              value="upload"
              className="px-0 py-3 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent rounded-none shadow-none font-bold transition-all flex items-center gap-2 text-muted-foreground"
            >
              <Upload className="w-4 h-4" />
              Import New Lead File
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="history" className="animate-in fade-in-50 duration-500">
          <Card className="border-none shadow-none bg-transparent">
            {isFetchingFiles ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="animate-pulse">Fetching your datasets...</p>
              </div>
            ) : uploadedFiles.length === 0 ? (
              <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed border-muted-foreground/20">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No datasets found</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-8">
                  You haven't uploaded any lead files yet. Start by importing your first dataset.
                </p>
                <Button onClick={() => {
                  const uploadTab = document.querySelector('[value="upload"]') as HTMLButtonElement;
                  uploadTab?.click();
                }} className="rounded-full px-8 shadow-lg shadow-primary/20">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Now
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {uploadedFiles.map((file) => (
                  <Card key={file.source_id} className="group relative overflow-hidden border-border/50 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={() => openSourcePreview(file.source_id)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteFile(file.source_id, file.source_name)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <h3 className="font-bold text-base mb-1 truncate">{file.source_name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">
                        {file.description || "No description provided."}
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t border-border/50">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                          <History className="w-3.5 h-3.5" />
                          {new Date(file.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <Button variant="link" className="p-0 h-auto text-xs font-bold text-primary group-hover:underline flex items-center" onClick={() => openSourcePreview(file.source_id)}>
                          View Data <ChevronRight className="w-3 h-3 ml-0.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="animate-in slide-in-from-bottom-4 duration-500">
          <div className={`grid gap-6 ${showMapping ? 'lg:grid-cols-12 items-start' : 'max-w-4xl mx-auto'}`}>
            <div className={`${showMapping ? 'lg:col-span-7' : ''} space-y-6`}>
              <Card className="p-5 border shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <FilePlus className="w-4 h-4" />
                    </div>
                    Select Lead File
                  </h2>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 rounded-full text-[10px] font-bold tracking-tight px-3" onClick={() => downloadTemplate("csv")}>
                      <Download className="w-3 h-3 mr-1.5" /> CSV Template
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 rounded-full text-[10px] font-bold tracking-tight px-3" onClick={() => downloadTemplate("xlsx")}>
                      <Download className="w-3 h-3 mr-1.5" /> Excel Template
                    </Button>
                  </div>
                </div>

                <div
                  className={`relative overflow-hidden border-2 border-dashed rounded-2xl p-8 text-center transition-all ${isDragOver
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30 hover:bg-muted/30'}`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleFileSelect(e.dataTransfer.files); }}
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold mb-1">Drag your dataset here</h3>
                  <p className="text-xs text-muted-foreground mb-6 max-w-[280px] mx-auto">
                    Supports .csv, .xlsx, and .xls formats up to <span className="font-bold text-foreground">8MB</span>.
                  </p>
                  <input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => handleFileSelect(e.target.files)} className="hidden" id="file-upload" />
                  <Button asChild variant="default" className="rounded-lg h-10 text-xs font-bold shadow-sm cursor-pointer">
                    <label htmlFor="file-upload">
                      <FileText className="w-3 h-3 mr-2" />
                      Browse Files
                    </label>
                  </Button>
                </div>

                {selectedFile && (
                  <div className="mt-8 p-5 rounded-3xl bg-primary/[0.03] border border-primary/20 flex items-center justify-between animate-in zoom-in-95 duration-500 shadow-sm">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="relative">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border shadow-sm shrink-0">
                          <FileText className="w-8 h-8 text-primary" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-black text-sm truncate text-foreground">{selectedFile.name}</p>
                        <p className="text-[11px] text-muted-foreground font-bold tracking-tight flex items-center gap-2">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {previewRows.length ? `${previewRows.length}+ rows ready` : 'Scanning file...'}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={resetForm} className="text-muted-foreground hover:text-white h-10 w-10 hover:bg-destructive rounded-full transition-all">
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                )}

                {selectedFile && !aiAnalysis && (
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      className="w-full h-12 rounded-2xl border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary font-bold gap-2 group animate-in slide-in-from-top-2"
                      onClick={handleAiAnalysis}
                      disabled={isAiLoading}
                    >
                      {isAiLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 group-hover:scale-125 transition-transform text-amber-500" />
                      )}
                      {isAiLoading ? "AI is Analyzing..." : "Generate Smart AI Insights"}
                    </Button>
                  </div>
                )}

                {aiAnalysis && (
                  <div className="mt-6 space-y-4 animate-in fade-in zoom-in-95 duration-500">
                    <div className="flex items-center gap-2 px-1">
                      <BrainCircuit className="w-4 h-4 text-primary" />
                      <span className="text-[10px] font-black uppercase text-primary tracking-widest">Dataset AI Intelligence</span>
                      <Button variant="ghost" size="sm" className="ml-auto h-6 text-[9px] hover:text-destructive" onClick={() => setAiAnalysis(null)}>Clear</Button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-2">
                        <div className="flex items-center gap-2 text-primary">
                          <Target className="w-3.5 h-3.5" />
                          <span className="text-[9px] font-black uppercase tracking-tighter">Value Segment</span>
                        </div>
                        <p className="text-xs font-bold leading-tight">{aiAnalysis.potentialValue}</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-green-50/50 border border-green-200/50 space-y-2">
                        <div className="flex items-center gap-2 text-green-600">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span className="text-[9px] font-black uppercase tracking-tighter">AI Trust Score</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-green-100 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500" style={{ width: `${aiAnalysis.trustScore}%` }} />
                          </div>
                          <span className="text-xs font-bold">{aiAnalysis.trustScore}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl border bg-white shadow-sm space-y-3">
                      <div>
                        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter mb-1">Executive Summary</p>
                        <p className="text-[11px] leading-relaxed text-foreground font-medium italic">"{aiAnalysis.summary}"</p>
                      </div>

                      <div className="pt-2 border-t border-dashed">
                        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter mb-2 flex items-center gap-1.5">
                          <Zap className="w-3 h-3 text-amber-500" /> Outreach Strategy
                        </p>
                        <p className="text-[11px] leading-relaxed font-bold text-primary/80">{aiAnalysis.outreachTip}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {aiAnalysis.topSegments.map((seg: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-muted rounded-full text-[9px] font-black text-muted-foreground uppercase tracking-widest border">{seg}</span>
                      ))}
                    </div>
                  </div>
                )}

                {previewRows.length > 0 && (
                  <div className="mt-8 space-y-4 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between px-1">
                      <p className="text-[10px] font-black uppercase text-muted-foreground/80 tracking-widest flex items-center gap-2">
                        Data Preview
                      </p>
                    </div>
                    <Card className="overflow-hidden border-muted-foreground/10 shadow-2xl shadow-black/[0.02] rounded-2xl bg-white/40">
                      <div className="relative overflow-x-auto max-h-[220px] custom-scrollbar">
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead className="sticky top-0 bg-white/90 backdrop-blur-md border-b z-10 shadow-sm">
                            <tr>
                              {fileHeaders.map((header) => (
                                <th key={header} className="px-4 py-3 font-bold text-foreground/70 truncate max-w-[140px] uppercase tracking-tighter">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/20">
                            {previewRows.map((row, index) => (
                              <tr key={index} className="hover:bg-primary/[0.02] transition-colors">
                                {fileHeaders.map((header) => (
                                  <td key={header} className="px-4 py-2.5 text-muted-foreground/90 truncate max-w-[140px] font-medium">
                                    {row[header] || "-"}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                    <p className="text-[10px] text-center text-muted-foreground font-medium bg-muted/40 py-2 rounded-xl border border-dashed">
                      Showing the first few rows to verify your data structure.
                    </p>
                  </div>
                )}
              </Card>

              <Card className="p-6 border shadow-sm rounded-2xl overflow-hidden relative">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-3 relative">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Settings2 className="w-4 h-4" />
                  </div>
                  Campaign Context
                </h2>
                <div className="grid gap-8 md:grid-cols-2 relative">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-xs font-black uppercase text-muted-foreground/80 tracking-widest pl-1">Target Category</Label>
                      <div className="flex gap-2">
                        <Select value={newDataset.category} onValueChange={(value) => setNewDataset(p => ({ ...p, category: value }))}>
                          <SelectTrigger className="rounded-2xl h-12 border-border/60 focus:ring-4 focus:ring-primary/10 hover:border-primary/40 transition-all bg-white shadow-sm">
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl shadow-2xl border-primary/10">
                            {categories.map(c => <SelectItem key={c.category_id} value={c.category_name || `cat-${c.category_id}`} className="rounded-lg my-1">{c.category_name || "Untitled Category"}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" className="h-12 w-12 shrink-0 rounded-2xl hover:bg-primary hover:text-white border-border/60 transition-all shadow-sm" onClick={() => setIsCategoryDialogOpen(true)}>
                          <Plus className="w-6 h-6" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-xs font-black uppercase text-muted-foreground/80 tracking-widest pl-1">Default Cost / Lead</Label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black text-lg group-focus-within:scale-110 transition-transform">₹</div>
                        <Input
                          type="number"
                          className="pl-10 rounded-2xl h-12 border-border/60 focus:ring-4 focus:ring-primary/10 hover:border-primary/40 transition-all bg-white shadow-sm font-bold text-lg"
                          value={newDataset.price}
                          min="0"
                          onKeyDown={(e) => { if (e.key === '-' || e.key === '+' || e.key === 'e') e.preventDefault(); }}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || (parseFloat(value) >= 0 && !isNaN(parseFloat(value)))) setNewDataset(p => ({ ...p, price: value }));
                          }}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="bg-amber-50/50 text-amber-700/80 p-3 rounded-2xl border border-amber-100 flex items-start gap-3">
                        <div className="mt-1 w-2 h-2 rounded-full bg-amber-400 shrink-0 shadow-sm animate-pulse" />
                        <p className="text-[10px] leading-relaxed font-bold">
                          Fallback price used if your file doesn't have a specific price column mapped.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-black uppercase text-muted-foreground/80 tracking-widest pl-1">Internal Reference</Label>
                    <Textarea
                      className="min-h-[148px] resize-none rounded-2xl border-border/60 focus:ring-4 focus:ring-primary/10 hover:border-primary/40 transition-all p-4 text-sm bg-white shadow-sm"
                      value={newDataset.description}
                      onChange={(e) => setNewDataset(p => ({ ...p, description: e.target.value }))}
                      placeholder="e.g. Lead swap with AlphaCorp, Q3 Realty dataset, etc."
                    />
                  </div>
                </div>
                <div className="mt-8 pt-8 border-t border-dashed space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Label className="text-xs font-black uppercase text-muted-foreground/80 tracking-widest pl-1">Verification Document</Label>
                    <span className="bg-muted px-2 py-0.5 rounded text-[9px] font-black text-muted-foreground uppercase">Optional</span>
                  </div>
                  <div className="relative group">
                    <Input
                      type="file"
                      onChange={(e) => setNewDataset(p => ({ ...p, proofAttachment: e.target.files ? e.target.files[0] : null }))}
                      className="rounded-2xl border-2 border-dashed hover:border-primary/40 h-auto py-3 pr-3 text-xs file:mx-4 file:py-2 file:px-6 file:rounded-xl file:border-0 file:bg-primary file:text-white hover:file:bg-primary/90 file:font-bold file:transition-all hover:bg-white transition-all shadow-sm"
                    />
                  </div>
                </div>
              </Card>
            </div>

            {showMapping && (
              <div className="lg:col-span-5 space-y-4">
                <Card className="p-6 border shadow-lg border-l-4 border-l-primary rounded-2xl sticky top-6 animate-in slide-in-from-right-8 duration-500">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-primary flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <TableProperties className="w-4 h-4" />
                      </div>
                      Mapping
                    </h2>
                    <Button variant="outline" size="sm" className="h-8 rounded-full border-primary/20 bg-white text-primary hover:bg-primary hover:text-white transition-all font-bold text-[10px] px-4 shadow-sm" onClick={handleAutoMap}>
                      AUTO-MAP
                    </Button>
                  </div>

                  <div className="space-y-6 max-h-[55vh] overflow-y-auto pr-4 custom-scrollbar pb-4">
                    {databaseFields.map((field) => (
                      <div key={field.key} className="space-y-2 group">
                        <div className="flex items-center justify-between px-1">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest group-focus-within:text-primary transition-colors">
                            {field.label}
                          </Label>
                          {field.required && <span className="bg-destructive/10 text-destructive text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter">REQUIRED</span>}
                        </div>
                        <Select value={fieldMappings[field.key] || 'none'} onValueChange={(value) => setFieldMappings(p => ({ ...p, [field.key]: value }))}>
                          <SelectTrigger className={`h-12 rounded-2xl transition-all shadow-sm border-2 ${field.required && !fieldMappings[field.key] ? 'border-destructive/30 bg-destructive/[0.01]' : 'border-white hover:border-primary/30 bg-white hover:shadow-md'}`}>
                            <SelectValue placeholder="Select Data Source" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl shadow-2xl border-primary/10">
                            <SelectItem value="none" className="text-muted-foreground italic font-medium rounded-lg mb-1">-- Skip this field --</SelectItem>
                            {fileHeaders.map((h, i) => (
                              <SelectItem key={i} value={h || `header-${i}`} className="rounded-lg my-0.5 font-bold">{h || `Column ${i + 1}`}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}

                    <div className="pt-8 mt-8 border-t-2 border-dashed border-primary/10">
                      <div className="flex items-center justify-between mb-6 px-1">
                        <h3 className="text-xs font-black flex items-center gap-2 text-primary/70 uppercase tracking-widest">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Extended Attributes
                        </h3>
                        <Button variant="ghost" size="sm" className="h-8 rounded-full text-[10px] font-black uppercase text-primary hover:bg-primary/10 px-4 transition-all" onClick={addCustomField}>
                          <Plus className="w-3 h-3 mr-1.5" /> ADD CUSTOM
                        </Button>
                      </div>

                      {customFieldMappings.length > 0 ? (
                        <div className="space-y-4">
                          {customFieldMappings.map((item) => (
                            <div key={item.id} className="rounded-3xl border bg-white/80 p-5 shadow-sm animate-in zoom-in-95 duration-300 border-primary/10 group/item relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/[0.02] rounded-full -mr-10 -mt-10 blur-xl" />
                              <div className="grid gap-5 grid-cols-[1fr_1fr_auto] items-end relative">
                                <div className="space-y-2">
                                  <Label className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest">Internal Label</Label>
                                  <Input
                                    value={item.label}
                                    onChange={(e) => updateCustomField(item.id, { label: e.target.value })}
                                    placeholder="e.g. Website"
                                    className="h-10 rounded-xl text-xs font-bold border-2 border-transparent bg-white shadow-inner focus:border-primary/20"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest">Source Column</Label>
                                  <Select value={item.source} onValueChange={(value) => updateCustomField(item.id, { source: value })}>
                                    <SelectTrigger className="h-10 rounded-xl text-xs font-bold border-2 border-transparent bg-white shadow-inner focus:border-primary/20">
                                      <SelectValue placeholder="Column" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl shadow-2xl">
                                      {fileHeaders.map((header, i) => (
                                        <SelectItem key={i} value={header || `custom-header-${i}`} className="rounded-lg my-0.5">{header || `Column ${i + 1}`}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl transition-all" onClick={() => removeCustomField(item.id)}>
                                  <Trash2 className="w-5 h-5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[10px] font-bold text-center text-muted-foreground/60 py-10 border-2 border-dashed rounded-3xl border-primary/10 bg-primary/[0.01] flex flex-col items-center gap-3">
                          <div className="w-10 h-10 bg-muted/50 rounded-full flex items-center justify-center">
                            <Plus className="w-5 h-5 text-muted-foreground/40" />
                          </div>
                          <span>Map extra columns for this dataset.</span>
                          <button className="text-primary hover:underline font-black mt-2 text-[11px] tracking-tight" onClick={addCustomField}>ADD NEW ATTRIBUTE</button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-dashed">
                    <Button
                      size="lg"
                      className="w-full h-12 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 font-bold"
                      onClick={handleCreateDataset}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>IMPORTING LEADS...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          <span>FINALIZE & IMPORT DATASET</span>
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </div>

        </TabsContent>
      </Tabs>
    </div >
  );
}
