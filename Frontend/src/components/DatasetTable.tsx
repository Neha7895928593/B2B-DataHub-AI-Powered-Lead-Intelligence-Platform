import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eye, Download, ShoppingCart, Mail, Phone, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dataset } from "@/contexts/DataContext";


interface DatasetTableProps {
  datasets: Dataset[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onView?: (dataset: Dataset) => void;
  onPurchase?: (dataset: Dataset) => void;
  onDownload?: (dataset: Dataset) => void;
}

const DatasetTable = ({
  datasets,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  onView,
  onPurchase,
  onDownload,
}: DatasetTableProps) => {
  const { toast } = useToast();

  const handleAction = (action: string, datasetName: string, dataset?: Dataset) => {
    if (action === "View" && dataset && onView) {
      onView(dataset);
    } else if (action === "Purchase" && dataset && onPurchase) {
      onPurchase(dataset);
    } else if (action === "Sample" && dataset && onDownload) {
      onDownload(dataset);
    } else {
      toast({
        title: `${action} Dataset`,
        description: `${action} action for "${datasetName}" has been initiated.`,
      });
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <Card className="shadow-md border border-border overflow-hidden">
      {/* Table Header - Hidden on mobile, shown on larger screens */}
      <div className="hidden md:block bg-muted/50 px-4 lg:px-6 py-2 border-b border-border">
        <div className="grid grid-cols-6 gap-2 lg:gap-4 text-xs lg:text-sm font-medium text-muted-foreground">
          <div className="col-span-2">NAME</div>
          <div className="text-center">Total Records</div>
          <div className="text-center flex items-center justify-center gap-1">
            <Mail className="w-3 lg:w-4 h-3 lg:h-4" />
            <span className="hidden lg:inline">Email</span>
          </div>
          <div className="text-center flex items-center justify-center gap-1">
            <Phone className="w-3 lg:w-4 h-3 lg:h-4" />
            <span className="hidden lg:inline">Phone</span>
          </div>
          <div className="text-center">Actions</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-border">
        {datasets.map((dataset, index) => (
          <div 
            key={dataset.id} 
            className="px-4 lg:px-6 py-2 lg:py-3 hover:bg-muted/20 transition-colors"
          >
            {/* Mobile Layout */}
            <div className="block md:hidden space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-card-foreground truncate">
                    {dataset.name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatNumber(dataset.filtered_total_records)} records
                  </div>
                </div>
              </div>
              
              
              <div className="flex justify-between items-center">
                <div className="flex gap-4 text-xs text-card-foreground">
                  <div className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {formatNumber(dataset.filtered_email_count)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {formatNumber(dataset.filtered_phone_count)}
                  </div>
                </div>
                
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-xs hover:bg-primary hover:text-primary-foreground"
                    onClick={() => handleAction("View", dataset.name, dataset)}
                  >
                    <Eye className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-xs hover:bg-primary hover:text-primary-foreground"
                    onClick={() => handleAction("Sample", dataset.name, dataset)}
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    className="h-6 px-2 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => handleAction("Purchase", dataset.name, dataset)}
                  >
                    <ShoppingCart className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:grid grid-cols-6 gap-2 lg:gap-4 items-center">
              {/* Dataset Name */}
              <div className="col-span-2">
                <div className="text-xs lg:text-sm font-medium text-card-foreground truncate">
                  {dataset.name}
                </div>
              </div>

              {/* Total Records */}
              <div className="text-center">
                <span className="text-xs lg:text-sm font-medium text-primary">
                  {formatNumber(dataset.filtered_total_records)}
                </span>
              </div>

              {/* Email Count */}
              <div className="text-center">
                <span className="text-xs lg:text-sm text-card-foreground">
                  {formatNumber(dataset.filtered_email_count)}
                </span>
              </div>

              {/* Phone Count */}
              <div className="text-center">
                <span className="text-xs lg:text-sm text-card-foreground">
                  {formatNumber(dataset.filtered_phone_count)}
                </span>
              </div>

              {/* Actions */}
              <div className="text-center">
                <div className="flex gap-1 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 lg:h-7 px-1 lg:px-2 text-xs hover:bg-primary hover:text-primary-foreground"
                    onClick={() => handleAction("View", dataset.name, dataset)}
                  >
                    <Eye className="w-3 h-3 lg:mr-1" />
                    <span className="hidden lg:inline">View</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 lg:h-7 px-1 lg:px-2 text-xs hover:bg-primary hover:text-primary-foreground"
                    onClick={() => handleAction("Sample", dataset.name, dataset)}
                  >
                    <Download className="w-3 h-3 lg:mr-1" />
                    <span className="hidden lg:inline">Sample</span>
                  </Button>
                  <Button
                    size="sm"
                    className="h-6 lg:h-7 px-1 lg:px-2 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => handleAction("Purchase", dataset.name, dataset)}
                  >
                    <ShoppingCart className="w-3 h-3 lg:mr-1" />
                    <span className="hidden lg:inline">Buy</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="px-4 lg:px-6 py-3 bg-muted/50 border-t border-border">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="text-xs lg:text-sm text-muted-foreground">
            Showing {totalItems === 0 ? 0 : ((currentPage - 1) * 4) + 1} - {Math.min(currentPage * 4, totalItems)} of {totalItems}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="h-7 px-2 lg:px-3 text-xs disabled:opacity-50 hover:bg-muted"
            >
              <ChevronLeft className="w-3 h-3 mr-1" />
              Previous
            </Button>
            
            <span className="text-xs text-muted-foreground px-2">
              Page {currentPage} of {totalPages}
            </span>
            
            <Button
              variant="outline" 
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="h-7 px-2 lg:px-3 text-xs bg-primary hover:bg-primary/90 text-primary-foreground border-primary disabled:opacity-50"
            >
              Next
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DatasetTable;

//   const handleAction = (action: string, datasetName: string, dataset?: Dataset) => {
//     if (action === "View" && dataset && onView) {
//       onView(dataset);
//     } else if (action === "Purchase" && dataset && onPurchase) {
//       onPurchase(dataset);
//     } else if (action === "Sample" && dataset && onDownload) {
//       onDownload(dataset);
//     } else {
//       toast({
//         title: `${action} Dataset`,
//         description: `${action} action for "${datasetName}" has been initiated.`,
//       });
//     }
//   };

//   const formatNumber = (num: number) => {
//     return num.toLocaleString();
//   };

//   return (
//     <Card className="shadow-md border border-border overflow-hidden">
//       {/* Table Header - Hidden on mobile, shown on larger screens */}
//       <div className="hidden md:block bg-muted/50 px-4 lg:px-6 py-3 border-b border-border">
//         <div className="grid grid-cols-6 gap-2 lg:gap-4 text-xs lg:text-sm font-medium text-muted-foreground">
//           <div className="col-span-2">NAME</div>
//           <div className="text-center">Total Records</div>
//           <div className="text-center flex items-center justify-center gap-1">
//             <Mail className="w-3 lg:w-4 h-3 lg:h-4" />
//             <span className="hidden lg:inline">Email</span>
//           </div>
//           <div className="text-center flex items-center justify-center gap-1">
//             <Phone className="w-3 lg:w-4 h-3 lg:h-4" />
//             <span className="hidden lg:inline">Phone</span>
//           </div>
//           <div className="text-center">Actions</div>
//         </div>
//       </div>

//       {/* Table Body */}
//       <div className="divide-y divide-border">
//         {datasets.map((dataset, index) => (
//           <div 
//             key={dataset.id} 
//             className="px-4 lg:px-6 py-3 lg:py-4 hover:bg-muted/20 transition-colors"
//           >
//             {/* Mobile Layout */}
//             <div className="block md:hidden space-y-3">
//               <div className="flex justify-between items-start">
//                 <div className="flex-1 min-w-0">
//                   <div className="text-sm font-medium text-card-foreground truncate">
//                     {dataset.name}
//                   </div>
//                   <div className="text-xs text-muted-foreground mt-1">
//                     {formatNumber(dataset.totalRecords)} records
//                   </div>
//                 </div>
//               </div>
              
              
//               <div className="flex justify-between items-center">
//                 <div className="flex gap-4 text-xs text-card-foreground">
//                   <div className="flex items-center gap-1">
//                     <Mail className="w-3 h-3" />
//                     {formatNumber(dataset.emails)}
//                   </div>
//                   <div className="flex items-center gap-1">
//                     <Phone className="w-3 h-3" />
//                     {formatNumber(dataset.phones)}
//                   </div>
//                 </div>
                
//                 <div className="flex gap-1">
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     className="h-6 px-2 text-xs hover:bg-primary hover:text-primary-foreground"
//                     onClick={() => handleAction("View", dataset.name, dataset)}
//                   >
//                     <Eye className="w-3 h-3" />
//                   </Button>
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     className="h-6 px-2 text-xs hover:bg-primary hover:text-primary-foreground"
//                     onClick={() => handleAction("Sample", dataset.name, dataset)}
//                   >
//                     <Download className="w-3 h-3" />
//                   </Button>
//                   <Button
//                     size="sm"
//                     className="h-6 px-2 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
//                     onClick={() => handleAction("Purchase", dataset.name, dataset)}
//                   >
//                     <ShoppingCart className="w-3 h-3" />
//                   </Button>
//                 </div>
//               </div>
//             </div>

//             {/* Desktop Layout */}
//             <div className="hidden md:grid grid-cols-6 gap-2 lg:gap-4 items-center">
//               {/* Dataset Name */}
//               <div className="col-span-2">
//                 <div className="text-xs lg:text-sm font-medium text-card-foreground truncate">
//                   {dataset.name}
//                 </div>
//               </div>

//               {/* Total Records */}
//               <div className="text-center">
//                 <span className="text-xs lg:text-sm font-medium text-primary">
//                   {formatNumber(dataset.totalRecords)}
//                 </span>
//               </div>

//               {/* Email Count */}
//               <div className="text-center">
//                 <span className="text-xs lg:text-sm text-card-foreground">
//                   {formatNumber(dataset.emails)}
//                 </span>
//               </div>

//               {/* Phone Count */}
//               <div className="text-center">
//                 <span className="text-xs lg:text-sm text-card-foreground">
//                   {formatNumber(dataset.phones)}
//                 </span>
//               </div>

//               {/* Actions */}
//               <div className="text-center">
//                 <div className="flex gap-1 justify-center">
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     className="h-6 lg:h-7 px-1 lg:px-2 text-xs hover:bg-primary hover:text-primary-foreground"
//                     onClick={() => handleAction("View", dataset.name, dataset)}
//                   >
//                     <Eye className="w-3 h-3 lg:mr-1" />
//                     <span className="hidden lg:inline">View</span>
//                   </Button>
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     className="h-6 lg:h-7 px-1 lg:px-2 text-xs hover:bg-primary hover:text-primary-foreground"
//                     onClick={() => handleAction("Sample", dataset.name, dataset)}
//                   >
//                     <Download className="w-3 h-3 lg:mr-1" />
//                     <span className="hidden lg:inline">Sample</span>
//                   </Button>
//                   <Button
//                     size="sm"
//                     className="h-6 lg:h-7 px-1 lg:px-2 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
//                     onClick={() => handleAction("Purchase", dataset.name, dataset)}
//                   >
//                     <ShoppingCart className="w-3 h-3 lg:mr-1" />
//                     <span className="hidden lg:inline">Buy</span>
//                   </Button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Pagination */}
//       <div className="px-4 lg:px-6 py-3 bg-muted/50 border-t border-border">
//         <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
//           <div className="text-xs lg:text-sm text-muted-foreground">
//             Showing {((currentPage - 1) * 4) + 1} - {Math.min(currentPage * 4, datasets.length * currentPage)} of {datasets.length * totalPages}
//           </div>
          
//           <div className="flex items-center gap-2">
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => onPageChange(Math.max(1, currentPage - 1))}
//               disabled={currentPage === 1}
//               className="h-7 px-2 lg:px-3 text-xs disabled:opacity-50 hover:bg-muted"
//             >
//               <ChevronLeft className="w-3 h-3 mr-1" />
//               Previous
//             </Button>
            
//             <span className="text-xs text-muted-foreground px-2">
//               Page {currentPage} of {totalPages}
//             </span>
            
//             <Button
//               variant="outline" 
//               size="sm"
//               onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
//               disabled={currentPage === totalPages}
//               className="h-7 px-2 lg:px-3 text-xs bg-primary hover:bg-primary/90 text-primary-foreground border-primary disabled:opacity-50"
//             >
//               Next
//               <ChevronRight className="w-3 h-3 ml-1" />
//             </Button>
//           </div>
//         </div>
//       </div>
//     </Card>
//   );
// };

// export default DatasetTable;
