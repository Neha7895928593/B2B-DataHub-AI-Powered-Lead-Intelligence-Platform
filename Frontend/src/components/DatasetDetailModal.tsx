import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { MapPin, Mail, Phone, Database, ShoppingCart, Download } from "lucide-react";
import { Dataset, useDataContext } from "@/contexts/DataContext";

interface DatasetDetailModalProps {
  dataset: Dataset | null;
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (dataset: Dataset) => void;
  onDownload: (dataset: Dataset) => void;
}

const DatasetDetailModal = ({ dataset, isOpen, onClose, onPurchase, onDownload }: DatasetDetailModalProps) => {
  if (!dataset) return null;

  const { categories, countries } = useDataContext();

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

  const price = Math.floor(Number(dataset.total_records) * 0.05); // $0.05 per record

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[95vh] overflow-y-auto mx-2 sm:mx-4">
        <DialogHeader>
          <DialogTitle className="text-xl lg:text-2xl font-semibold text-card-foreground">
            Dataset Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 lg:space-y-6 p-1">

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

         <Card className="shadow-md border border-border">
 
  <div className="overflow-x-auto">
    {/* Table Header */}
    <div className="hidden md:grid min-w-[800px] grid-cols-7 gap-2 lg:gap-4 bg-muted/50 px-4 lg:px-6 py-3 border-b border-border text-xs lg:text-sm font-medium text-muted-foreground">
      <div>Name</div>
      <div>Address</div>
      <div>City</div>
      <div>State</div>
      <div>Country</div>
      <div>Email</div>
      <div>Phone</div>
    </div>

    {/* Table Body */}
    <div className="divide-y divide-border">
      {dataset.view_record?.map((record, index) => (
        <div
          key={record.id || index}
            className="px-4 lg:px-6 py-3 lg:py-4 hover:bg-blue-50 transition-colors min-w-[800px] grid grid-cols-7 gap-2 lg:gap-4 text-xs lg:text-sm items-center"

        >
          <div className="truncate">{record.name || "-"}</div>
          <div className="truncate">{record.address || "-"}</div>
          <div className="truncate">{record.city_name || "-"}</div>
          <div className="truncate">{record.state_name || "-"}</div>
          <div className="truncate">{record.country_name || "-"}</div>
          <div className="truncate flex justify-center items-center gap-1">
            <Mail className="inline w-3 h-3 mr-1" /> Email
          </div>
          <div className="truncate flex justify-center items-center gap-1">
            <Phone className="inline w-3 h-3 mr-1" /> Phone
          </div>
        </div>
      ))}
    </div>
  </div>
</Card>


          {/* Pricing */}
          <div className="bg-primary/5 p-3 lg:p-4 rounded-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <div className="text-xs lg:text-sm text-muted-foreground">Dataset Price</div>
                <div className="text-xl lg:text-2xl font-bold text-primary">₹ {dataset.filtered_total_price}</div>
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

