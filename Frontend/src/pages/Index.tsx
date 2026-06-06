import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Sparkles, BrainCircuit, Zap, Bot, X, Loader2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import SearchFilters from "@/components/SearchFilters";
import DatasetTable from "@/components/DatasetTable";
import DatasetDetailModal from "@/components/DatasetDetailModal";
import PurchaseModal from "@/components/PurchaseModal";
import { useToast } from "@/hooks/use-toast";
import { Dataset, useDataContext } from "@/contexts/DataContext";
import { chatWithAI } from "@/api/apiHub";

const normalizeExtraFields = (value: unknown) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
};

const toCsvValue = (value: unknown) => {
  const normalized = value == null ? "" : String(value);
  return `"${normalized.replace(/"/g, '""')}"`;
};

const sanitizeFilename = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "dataset_sample";

const Index = () => {
  const { toast } = useToast();
  const {
    countries,
    categories,
    datasets,
    isDatasetsLoading,
    datasetsError,

    fetchCountries,
    fetchCategories,
    fetchDatasets,

    cities,
    fetchCities
  } = useDataContext();


  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    country: "",
    state: "",
    city: ""
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [purchaseDataset, setPurchaseDataset] = useState<Dataset | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: "Hello! I'm your Data Assistant. Tell me what kind of leads you're looking for, and I'll find them." }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const itemsPerPage = 4;

  // Fetch initial data
  useEffect(() => {
    fetchCountries();
    fetchCategories();
    fetchDatasets(filters);
  }, [fetchCountries, fetchCategories, fetchDatasets, filters]);

  // Update datasets when filters change
  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };


  const filteredDatasets = useMemo(() => {
    return datasets.filter((dataset) => {
      const matchesSearch = dataset.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const matchesCategory = !filters.category || dataset.category_id === Number(filters.category);
      const matchesCountry = !filters.country || dataset.country_id === Number(filters.country);
      const matchesState = !filters.state || dataset.state_id === Number(filters.state);
      const matchesCity = !filters.city || dataset.city_id === Number(filters.city);


      return matchesSearch && matchesCategory && matchesCountry && matchesState && matchesCity;
    });
  }, [datasets, searchQuery, filters]);


  // const filteredDatasets = useMemo(() => {
  //   return datasets.filter((dataset) => {
  //     const matchesSearch = dataset.name
  //       .toLowerCase()
  //       .includes(searchQuery.toLowerCase());

  //     const matchesCategory =
  //       !filters.category || dataset.category === filters.category;

  //     const matchesCountry =
  //       !filters.country || dataset.country === filters.country;

  //     const matchesState =
  //       !filters.state || dataset.state === filters.state;

  //     const matchesCity =
  //       !filters.city || dataset.city === filters.city;

  //     return (
  //       matchesSearch &&
  //       matchesCategory &&
  //       matchesCountry &&
  //       matchesState &&
  //       matchesCity
  //     );
  //   });
  // }, [datasets, searchQuery, filters]);


  // Pagination
  const paginatedDatasets = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDatasets.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDatasets, currentPage]);

  const totalPages = Math.ceil(filteredDatasets.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Dataset Actions
  const handleViewDataset = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setIsDetailModalOpen(true);

  };

  const handlePurchaseDataset = (dataset: Dataset) => {
    setPurchaseDataset(dataset);
    setIsPurchaseModalOpen(true);
  };
  const handleRetryDatasets = () => {
    void fetchDatasets(filters);
  };


  const handleDownloadSample = async (dataset: Dataset) => {
    try {
      if (!dataset.sample_file_Data || dataset.sample_file_Data.length === 0) {
        toast({
          title: "No Sample",
          description: `No sample data available for "${dataset.name}".`,
          variant: "destructive",
        });
        return;
      }

      const professionalSample = dataset.sample_file_Data.map((item) => ({
        Name: item.name || "-",
        Email: item.email || "-",
        Phone: item.phone || "-",
        Address: item.address || "-",
        Category: item.category_name || item.category || "-",
        Country: item.country_name || item.country || "-",
        State: item.state_name || item.state || "-",
        City: item.city_name || item.city || "-",
        ...normalizeExtraFields(item.extra_fields),
      }));

      const headers = Array.from(
        professionalSample.reduce((set, row) => {
          Object.keys(row).forEach((key) => set.add(key));
          return set;
        }, new Set<string>()),
      );

      const csvRows = [
        headers.map(toCsvValue).join(","),
        ...professionalSample.map((row) => headers.map((header) => toCsvValue(row[header as keyof typeof row] ?? "")).join(",")),
      ];

      const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${sanitizeFilename(dataset.name)}_sample.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Sample CSV Downloaded",
        description: `Downloaded CSV sample for "${dataset.name}".`,
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Error",
        description: "Failed to download sample",
        variant: "destructive",
      });
    }
  };
  const handleChatSubmit = async (e?: React.FormEvent, directInput?: string) => {
    e?.preventDefault();
    const message = directInput ?? chatInput;
    if (!message.trim() || isChatLoading) return;

    const userMsg = message;
    setChatInput("");
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsChatLoading(true);

    try {
      const res = await chatWithAI({ message: userMsg });
      if (res.success) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: res.reply }]);
      } else {
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: res.error || "Sorry, I'm having trouble connecting right now. Please try again."
        }]);
      }
    } catch (error) {
      const msg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Sorry, I'm having trouble connecting right now. Please try again.";
      setChatMessages(prev => [...prev, { role: 'assistant', content: String(msg) }]);
    } finally {
      setIsChatLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Header */}
      <div className="bg-card border-b border-border shadow-sm relative overflow-hidden">
        {/* Abstract AI Background Element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full -ml-32 -mb-32 blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6 text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-2 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <Sparkles className="w-3 h-3 text-amber-500" />
            AI-Powered Intelligence
          </div>

          <h1 className="text-xl sm:text-2xl lg:text-4xl font-black text-foreground mb-2 tracking-tight">
            Connect with <span className="text-primary bg-primary/5 px-2 rounded-lg">AI-Verified</span> Leads
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-[10px] sm:text-xs lg:text-sm mb-4 leading-relaxed opacity-80">
            Real-time market analysis bringing you high-intent contact points.
          </p>

          <div className="max-w-md mx-auto relative px-4">
            <Search className="absolute left-6 lg:left-7 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Search datasets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 lg:pl-11 bg-background h-10 lg:h-12 text-sm lg:text-base"
            />
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6 flex flex-col xl:flex-row gap-4 lg:gap-6">
        {/* Filters */}
        <div className="w-full xl:w-80 xl:flex-shrink-0 order-2 xl:order-1">
          <SearchFilters onFilterChange={handleFilterChange} />
        </div>

        {/* Dataset Table */}
        <div className="flex-1 order-1 xl:order-2">
          {datasetsError ? (
            <div className="bg-card p-6 lg:p-12 text-center border border-border rounded-lg shadow-sm space-y-3">
              <h3 className="text-base lg:text-lg font-medium text-card-foreground">
                Unable to load datasets
              </h3>
              <p className="text-muted-foreground text-sm lg:text-base">
                {datasetsError}
              </p>
              <Button onClick={handleRetryDatasets} className="h-10">
                Retry
              </Button>
            </div>
          ) : isDatasetsLoading && datasets.length === 0 ? (
            <div className="bg-card p-8 lg:p-12 text-center border border-border rounded-lg shadow-sm">
              <div className="mx-auto mb-3 h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <h3 className="text-base lg:text-lg font-medium text-card-foreground mb-1">
                Loading datasets
              </h3>
              <p className="text-muted-foreground text-sm lg:text-base">
                This can take a moment on free-tier backend startup.
              </p>
            </div>
          ) : filteredDatasets.length === 0 ? (
            <div className="bg-card p-6 lg:p-12 text-center border border-border rounded-lg shadow-sm">
              <h3 className="text-base lg:text-lg font-medium text-card-foreground mb-2">
                No datasets found
              </h3>
              <p className="text-muted-foreground text-sm lg:text-base">
                Try adjusting your search criteria or filters
              </p>
            </div>
          ) : (
            <>
              <DatasetTable
                datasets={paginatedDatasets}
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredDatasets.length}
                onPageChange={handlePageChange}
                onView={handleViewDataset}
                onPurchase={handlePurchaseDataset}
                onDownload={handleDownloadSample}
              />
              {isDatasetsLoading && datasets.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2 text-right">
                  Updating data from server...
                </p>
              )}
            </>
            )}
        </div>
      </div>

      {/* Modals */}
      <DatasetDetailModal
        dataset={selectedDataset}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onPurchase={(dataset) => {
          setIsDetailModalOpen(false);
          handlePurchaseDataset(dataset);
        }}
        onDownload={handleDownloadSample}
      />

      <PurchaseModal
        dataset={purchaseDataset}
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
      />

      {/* Floating AI Assistant Trigger */}
      <button
        onClick={() => setIsAiAssistantOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-50 group hover:ring-4 ring-primary/20"
      >
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
          <Sparkles className="w-3 h-3 text-white" />
        </div>
        <Bot className="w-6 h-6 group-hover:rotate-12 transition-transform" />
      </button>

      {/* Mini AI Assistant Popover (Placeholder UI) */}
      {isAiAssistantOpen && (
        <div className="fixed bottom-24 right-6 w-80 bg-card border border-border rounded-3xl shadow-2xl z-50 p-5 animate-in slide-in-from-bottom-4 zoom-in-95 duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <BrainCircuit className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-tight">AI Assistant</p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-[10px] text-muted-foreground">Gemini is active</p>
                </div>
              </div>
            </div>
            <button onClick={() => setIsAiAssistantOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto scrollbar-hide">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`p-3 rounded-2xl text-xs font-medium leading-relaxed ${msg.role === 'assistant'
                  ? 'bg-muted text-foreground rounded-tl-none mr-8'
                  : 'bg-primary text-white rounded-tr-none ml-8'
                  } animate-in slide-in-from-bottom-2`}
              >
                {msg.content}
              </div>
            ))}
            {isChatLoading && (
              <div className="bg-muted p-3 rounded-2xl rounded-tl-none mr-8 w-12 flex justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              </div>
            )}
          </div>

          <form onSubmit={handleChatSubmit} className="relative">
            <Input
              placeholder="Ask AI anything..."
              className="pr-10 rounded-2xl h-12 bg-muted/30 border-primary/20"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={isChatLoading}
            />
            <button
              type="submit"
              disabled={isChatLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:scale-110 transition-transform disabled:opacity-50"
            >
              <Zap className="w-4 h-4 fill-primary" />
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2 text-[10px]">
            <span className="text-muted-foreground">Try:</span>
            <button onClick={() => handleChatSubmit(undefined, "Dubai Real Estate")} className="hover:text-primary transition-colors">"Dubai Real Estate"</button>
            <button onClick={() => handleChatSubmit(undefined, "Find tech founders")} className="hover:text-primary transition-colors">"Tech Founders"</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
