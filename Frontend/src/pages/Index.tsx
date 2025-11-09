import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import Navigation from "@/components/Navigation";
import SearchFilters from "@/components/SearchFilters";
import DatasetTable from "@/components/DatasetTable";
import DatasetDetailModal from "@/components/DatasetDetailModal";
import PurchaseModal from "@/components/PurchaseModal";
import { useToast } from "@/hooks/use-toast";
import { Dataset, useDataContext } from "@/contexts/DataContext";

import * as XLSX from "xlsx";


const Index = () => {
  const { toast } = useToast();
  const {
    countries,
    categories,
    datasets,
   
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
    city:""
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [purchaseDataset, setPurchaseDataset] = useState<Dataset | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const itemsPerPage = 4;

  // Fetch initial data
  useEffect(() => {
    fetchCountries();
    fetchCategories();
    fetchDatasets(filters);
  }, []);

  // Update datasets when filters change
  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    fetchDatasets(newFilters);
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

    // Map only professional fields
    const professionalSample = dataset.sample_file_Data.map((item) => ({
      Name: item.name || "-",
      Email: item.email || "-",
      Phone: item.phone || "-",
      Address: item.address || "-",
      Category: item.category_name || item.category || "-",
      Country: item.country_name || item.country || "-",
      State: item.state_name || item.state || "-",
      City: item.city_name || item.city || "-",
      ...item.extra_fields, // spread extra_fields (
    }));

  
    const worksheet = XLSX.utils.json_to_sheet(professionalSample);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Samples");

    XLSX.writeFile(workbook, `${dataset.name}_sample.xlsx`);

    toast({
      title: "Sample Download Started",
      description: `Downloading sample for "${dataset.name}".`,
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



  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Header */}
      <div className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8 text-center">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-card-foreground mb-2 lg:mb-3">
            Search Our B2B Datasets
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-xs sm:text-sm lg:text-base mb-4 lg:mb-6 px-4">
            Explore comprehensive business datasets by category, country, state, or city.
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8 flex flex-col xl:flex-row gap-4 lg:gap-8">
        {/* Filters */}
        <div className="w-full xl:w-80 xl:flex-shrink-0 order-2 xl:order-1">
          <SearchFilters onFilterChange={handleFilterChange} />
        </div>

        {/* Dataset Table */}
        <div className="flex-1 order-1 xl:order-2">
          {filteredDatasets.length === 0 ? (
            <div className="bg-card p-6 lg:p-12 text-center border border-border rounded-lg shadow-sm">
              <h3 className="text-base lg:text-lg font-medium text-card-foreground mb-2">
                No datasets found
              </h3>
              <p className="text-muted-foreground text-sm lg:text-base">
                Try adjusting your search criteria or filters
              </p>
            </div>
          ) : (
            <DatasetTable
              datasets={paginatedDatasets}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              onView={handleViewDataset}
              onPurchase={handlePurchaseDataset}
              onDownload={handleDownloadSample}
            />
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
    </div>
  );
};

export default Index;




// import { useState, useMemo } from "react";
// import { Input } from "@/components/ui/input";
// import { Search } from "lucide-react";
// import Navigation from "@/components/Navigation";
// import SearchFilters from "@/components/SearchFilters";
// import DatasetTable from "@/components/DatasetTable";
// import DatasetDetailModal from "@/components/DatasetDetailModal";
// import PurchaseModal from "@/components/PurchaseModal";
// import { mockDatasets, Dataset } from "@/data/mockData";
// import { useToast } from "@/hooks/use-toast";

// const Index = () => {
//   const { toast } = useToast();
//   const [searchQuery, setSearchQuery] = useState("");
//   const [filters, setFilters] = useState({
//     category: "",
//     country: "",
//     state: ""
//   });

//   const [currentPage, setCurrentPage] = useState(1);
//   const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
//   const [purchaseDataset, setPurchaseDataset] = useState<Dataset | null>(null);
//   const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
//   const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
//   const itemsPerPage = 4;

//   // Filter datasets based on search and filters
//   const filteredDatasets = useMemo(() => {
//     return mockDatasets.filter((dataset) => {
//       const matchesSearch = dataset.name.toLowerCase().includes(searchQuery.toLowerCase());
//       const matchesCategory = !filters.category || dataset.category === filters.category;
//       const matchesCountry = !filters.country || dataset.country === filters.country;
//       const matchesState = !filters.state || dataset.state === filters.state;
      
//       return matchesSearch && matchesCategory && matchesCountry && matchesState;
//     });
//   }, [searchQuery, filters]);

//   // Paginate datasets
//   const paginatedDatasets = useMemo(() => {
//     const startIndex = (currentPage - 1) * itemsPerPage;
//     return filteredDatasets.slice(startIndex, startIndex + itemsPerPage);
//   }, [filteredDatasets, currentPage]);

//   const totalPages = Math.ceil(filteredDatasets.length / itemsPerPage);

//   const handleFilterChange = (newFilters: typeof filters) => {
//     setFilters(newFilters);
//     setCurrentPage(1); // Reset to first page when filters change
//   };

//   const handlePageChange = (page: number) => {
//     setCurrentPage(page);
//   };

//   const handleViewDataset = (dataset: Dataset) => {
//     setSelectedDataset(dataset);
//     setIsDetailModalOpen(true);
//   };

//   const handlePurchaseDataset = (dataset: Dataset) => {
//     setPurchaseDataset(dataset);
//     setIsPurchaseModalOpen(true);
//   };

//   const handleDownloadSample = (dataset: Dataset) => {
//     toast({
//       title: "Sample Download Started",
//       description: `Downloading sample for "${dataset.name}". Check your downloads folder.`,
//     });
//     // Simulate download
//     const link = document.createElement('a');
//     link.href = `data:text/csv;charset=utf-8,Name,Address,Phone,Email\nSample Business,123 Main St,555-1234,sample@business.com`;
//     link.download = `${dataset.name.replace(/\s+/g, '_')}_sample.csv`;
//     link.click();
//   };



//   return (
//     <div className="min-h-screen bg-background">
//       {/* Navigation */}
//       <Navigation />
      
//       {/* Header with Search */}
//       <div className="bg-card border-b border-border shadow-sm">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
//           <div className="text-center">
//             <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-card-foreground mb-2 lg:mb-3">
//               Search Our B2B Datasets
//             </h1>
//             <p className="text-muted-foreground max-w-2xl mx-auto text-xs sm:text-sm lg:text-base mb-4 lg:mb-6 px-4">
//               Explore comprehensive and detailed business datasets by category, country, state, or city.
//               <br className="hidden sm:block" />
//               Empower your business with actionable insights and targeted data
//             </p>
            
//             {/* Search Bar */}
//             <div className="max-w-md mx-auto relative px-4">
//               <Search className="absolute left-6 lg:left-7 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
//               <Input
//                 type="text"
//                 placeholder="Search datasets..."
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 className="pl-10 lg:pl-11 bg-background h-10 lg:h-12 text-sm lg:text-base"
//               />
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
//         <div className="flex flex-col xl:flex-row gap-4 lg:gap-8">
//           {/* Filters Sidebar */}
//           <div className="w-full xl:w-80 xl:flex-shrink-0 order-2 xl:order-1">
//             <SearchFilters onFilterChange={handleFilterChange} />
//           </div>



//         {/* Dataset Table */}
//           <div className="flex-1 order-1 xl:order-2">
//             {filteredDatasets.length === 0 ? (
//               <div className="bg-card p-6 lg:p-12 text-center border border-border rounded-lg shadow-sm">
//                 <h3 className="text-base lg:text-lg font-medium text-card-foreground mb-2">
//                   No datasets found
//                 </h3>
//                 <p className="text-muted-foreground text-sm lg:text-base">
//                   Try adjusting your search criteria or filters
//                 </p>
//               </div>
//             ) : (
//               <DatasetTable
//                 datasets={paginatedDatasets}
//                 currentPage={currentPage}
//                 totalPages={totalPages}
//                 onPageChange={handlePageChange}
//                 onView={handleViewDataset}
//                 onPurchase={handlePurchaseDataset}
//                 onDownload={handleDownloadSample}
//               />
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Modals */}
//       <DatasetDetailModal
//         dataset={selectedDataset}
//         isOpen={isDetailModalOpen}
//         onClose={() => setIsDetailModalOpen(false)}
//         onPurchase={(dataset) => {
//           setIsDetailModalOpen(false);
//           handlePurchaseDataset(dataset);
//         }}
//         onDownload={handleDownloadSample}
//       />

//       <PurchaseModal
//         dataset={purchaseDataset}
//         isOpen={isPurchaseModalOpen}
//         onClose={() => setIsPurchaseModalOpen(false)}
//       />
//     </div>
//   );
// };

// export default Index;