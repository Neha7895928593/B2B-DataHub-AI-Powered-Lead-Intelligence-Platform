import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CreditCard, ShoppingCart, Check } from "lucide-react";
import { Dataset } from "@/contexts/DataContext";
import { createOrder } from "@/api/apiHub";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface PurchaseModalProps {
  dataset: Dataset | null;
  isOpen: boolean;
  onClose: () => void;
}

const PurchaseModal = ({ dataset, isOpen, onClose }: PurchaseModalProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<"offline">("offline");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string>("");
  
  const [formData, setFormData] = useState({
    company: "",
    phone: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
    billingAddress: ""
  });

  if (!dataset) return null;

  const formatNumber = (num: number) => num.toLocaleString();
  const price = dataset.filtered_total_price;
  const tax = Math.floor(price * 0.1);
  const total = price + tax;

  const categoryLabels: Record<string, string> = {
    'bus-stops': 'Transportation',
    'restaurants': 'Food & Dining',
    'hotels': 'Hospitality',
    'retail-stores': 'Retail',
    'healthcare': 'Healthcare'
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handlePurchase = async () => {
    if (!dataset) return;
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to submit the order request.",
        variant: "destructive",
      });
      onClose();
      navigate("/login");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createOrder({
        datasetId: dataset.id,
        datasetName: dataset.name,
        totalPrice: price,
        phone: formData.phone,
        company: formData.company,
        paymentMethod,
        datasetContext: {
          categoryId: dataset.category_id,
          countryId: dataset.country_id,
          stateId: dataset.state_id ?? null,
          cityId: dataset.city_id ?? null,
        },
      });
      setOrderId(`ORD-${String(response.order.order_id).padStart(3, "0")}`);
      setStep(4);
    } catch (error) {
      const message = ((error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      })?.response?.data?.message) || "Unable to create order request right now.";

      toast({
        title: "Order request failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetModal = () => {
    setStep(1);
    setPaymentMethod("offline");
    setFormData({
      company: "",
      phone: "",
      cardNumber: "",
      expiry: "",
      cvv: "",
      billingAddress: ""
    });
    setOrderId("");
    onClose();
  };

  const goToSignIn = () => {
    onClose();
    navigate("/login");
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetModal}>
      <DialogContent className="max-w-3xl w-[95vw] max-h-[95vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle className="text-xl lg:text-2xl font-semibold text-card-foreground">
            {step === 4 ? "Order Request Submitted" : "Request Dataset"}
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        {step !== 4 && (
          <div className="flex items-center justify-center mb-4 lg:mb-6">
            <div className="flex items-center space-x-1 lg:space-x-2">
              {[1, 2, 3].map((stepNum) => (
                <div key={stepNum} className="flex items-center">
                  <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-xs lg:text-sm font-medium ${
                    stepNum <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {stepNum}
                  </div>
                  {stepNum < 3 && (
                    <div className={`w-8 lg:w-12 h-1 ${stepNum < step ? 'bg-primary' : 'bg-muted'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 1 - Order Summary */}
        {step === 1 && (
          <div className="space-y-4 lg:space-y-6 p-1">
            <div className="bg-muted/50 p-3 lg:p-4 rounded-lg">
              <h3 className="font-medium text-card-foreground mb-3 text-sm lg:text-base">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                  <div className="flex-1">
                    <div className="font-medium text-xs lg:text-sm text-card-foreground">{dataset.name}</div>
                    <Badge variant="secondary" className="mt-1 bg-primary/10 text-primary text-xs">
                      {categoryLabels[dataset.category] || dataset.category}
                    </Badge>
                  </div>
                  <div className="sm:text-right">
                    <div className="font-medium text-card-foreground text-sm lg:text-base">₹{price}</div>
                  </div>
                </div>
              </div>
              <Separator className="my-3" />
              <div className="space-y-2 text-xs lg:text-sm">
                <div className="flex justify-between"><span>Dataset Price:</span><span>${price}</span></div>
                <div className="flex justify-between"><span>Tax (10%):</span><span>${tax}</span></div>
                <Separator className="my-2" />
                <div className="flex justify-between font-medium text-sm lg:text-base">
                  <span>Total:</span><span>${total}</span>
                </div>
              </div>
            </div>

            {/* Dataset details */}
            <div className="grid grid-cols-3 gap-2 lg:gap-4 text-center">
              <div className="p-2 lg:p-3 bg-muted/30 rounded">
                <div className="text-base lg:text-lg font-bold text-primary">{formatNumber(dataset.filtered_total_records)}</div>
                <div className="text-xs text-muted-foreground">Records</div>
              </div>
              <div className="p-2 lg:p-3 bg-muted/30 rounded">
                <div className="text-base lg:text-lg font-bold text-primary">{formatNumber(dataset.filtered_email_count)}</div>
                <div className="text-xs text-muted-foreground">Emails</div>
              </div>
              <div className="p-2 lg:p-3 bg-muted/30 rounded">
                <div className="text-base lg:text-lg font-bold text-primary">{formatNumber(dataset.filtered_phone_count)}</div>
                <div className="text-xs text-muted-foreground">Phones</div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={handleNext} className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 lg:h-11 px-6 lg:px-8 text-sm lg:text-base">
                {isAuthenticated ? "Continue to Order Request" : "Continue to Sign In"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 - Contact Info */}
        {step === 2 && (
          !isAuthenticated ? (
            <div className="space-y-4 p-1">
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 text-primary" />
                  <div className="space-y-1">
                    <h3 className="font-medium text-card-foreground">Sign in first</h3>
                    <p className="text-sm text-muted-foreground">
                      Your order request is tied to your account, so please sign in before continuing.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2">
                <Button variant="outline" onClick={handleBack}>Back</Button>
                <Button onClick={goToSignIn} className="bg-primary hover:bg-primary/90 text-primary-foreground">Sign in to continue</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 p-1">
              <h3 className="font-medium text-card-foreground text-sm lg:text-base">Account details</h3>
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Signed in as</div>
                <div className="font-medium text-card-foreground">{user?.fullName || "-"}</div>
                <div className="text-sm text-muted-foreground break-all">{user?.email || "-"}</div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company">Company Name</Label>
                  <Input id="company" value={formData.company} onChange={(e) => handleInputChange('company', e.target.value)} placeholder="Your Company" />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} placeholder="+1 (555) 123-4567" />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
                <Button variant="outline" onClick={handleBack}>Back</Button>
                <Button onClick={handleNext} className="bg-primary hover:bg-primary/90 text-primary-foreground">Continue to Order Request</Button>
              </div>
            </div>
          )
        )}

        {/* Step 3 - Payment */}
        {step === 3 && (
          <div className="space-y-4 p-1">
            <h3 className="font-medium text-card-foreground flex items-center gap-2 text-sm lg:text-base">
              <CreditCard className="w-4 h-4" /> Order Request
            </h3>

            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 text-primary" />
                <div className="space-y-1">
                  <h4 className="font-medium text-card-foreground">Payment unavailable right now</h4>
                  <p className="text-sm text-muted-foreground">
                    Online card and UPI checkout is not active yet. Submit the order request and we’ll keep it pending for manual follow-up.
                  </p>
                </div>
              </div>
            </div>

            {/* Final summary */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-card-foreground">Order total</div>
                  <div className="text-sm text-muted-foreground">Payment request will be marked pending</div>
                </div>
                <div className="text-xl font-bold text-primary">₹{total}</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
              <Button variant="outline" onClick={handleBack}>Back</Button>
              <Button onClick={handlePurchase} disabled={isSubmitting} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <ShoppingCart className="w-4 h-4 mr-2" />
                {isSubmitting ? "Submitting..." : "Submit Order Request"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4 - Success */}
        {step === 4 && (
          <div className="text-center space-y-6 py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-card-foreground mb-2">Order Request Submitted</h3>
              <p className="text-muted-foreground">Payment is unavailable right now. Your order is saved as pending and attached to your signed-in account.</p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">Order ID</div>
              <div className="font-mono text-card-foreground">{orderId}</div>
            </div>
            <Button onClick={resetModal}>Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseModal;


// import { useState } from "react";
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Separator } from "@/components/ui/separator";
// import { Badge } from "@/components/ui/badge";
// import { CreditCard, ShoppingCart, Check } from "lucide-react";
// import { Dataset, useDataContext } from "@/contexts/DataContext";
// import {QRCodeCanvas} from 'qrcode.react'

// interface PurchaseModalProps {
//   dataset: Dataset | null;
//   isOpen: boolean;
//   onClose: () => void;
// }

// const PurchaseModal = ({ dataset, isOpen, onClose }: PurchaseModalProps) => {
//   const [step, setStep] = useState(1);
//   const [paymentMethod, setPaymentMethod] = useState<"card" | "upi">("card");

//   const {
//     countries,
//     categories,
//     datasets,
  
//     fetchCountries,
//     fetchCategories,
//     fetchDatasets,
    
//   } = useDataContext();
  
//   const [formData, setFormData] = useState({
//     email: "",
//     company: "",
//     name: "",
//     phone: "",
//     cardNumber: "",
//     expiry: "",
//     cvv: "",
//     billingAddress: ""
//   });

//   if (!dataset) return null;

//   const formatNumber = (num: number) => num.toLocaleString();
//   const price = dataset.filtered_total_price;
//   const tax = Math.floor(price * 0.1);
//   const total = price + tax;

//   const categoryLabels: Record<string, string> = {
//     'bus-stops': 'Transportation',
//     'restaurants': 'Food & Dining',
//     'hotels': 'Hospitality',
//     'retail-stores': 'Retail',
//     'healthcare': 'Healthcare'
//   };

//   const handleInputChange = (field: string, value: string) => {
//     setFormData(prev => ({ ...prev, [field]: value }));
//   };

//   const handleNext = () => {
//     if (step < 3) setStep(step + 1);
//   };

//   const handleBack = () => {
//     if (step > 1) setStep(step - 1);
//   };

//   const handlePurchase = () => {
//     // Simulate purchase success
//     setStep(4);
//     setTimeout(() => {
//       onClose();
//       setStep(1);
//     }, 3000);
//   };

//   const resetModal = () => {
//     setStep(1);
//     setPaymentMethod("card");
//     setFormData({
//       email: "",
//       company: "",
//       name: "",
//       phone: "",
//       cardNumber: "",
//       expiry: "",
//       cvv: "",
//       billingAddress: ""
//     });
//     onClose();
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={resetModal}>
//       <DialogContent className="max-w-3xl w-[95vw] max-h-[95vh] overflow-y-auto mx-4">
//         <DialogHeader>
//           <DialogTitle className="text-xl lg:text-2xl font-semibold text-card-foreground">
//             {step === 4 ? "Purchase Complete!" : "Purchase Dataset"}
//           </DialogTitle>
//         </DialogHeader>

//         {/* Step indicator */}
//         {step !== 4 && (
//           <div className="flex items-center justify-center mb-4 lg:mb-6">
//             <div className="flex items-center space-x-1 lg:space-x-2">
//               {[1, 2, 3].map((stepNum) => (
//                 <div key={stepNum} className="flex items-center">
//                   <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-xs lg:text-sm font-medium ${
//                     stepNum <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
//                   }`}>
//                     {stepNum}
//                   </div>
//                   {stepNum < 3 && (
//                     <div className={`w-8 lg:w-12 h-1 ${stepNum < step ? 'bg-primary' : 'bg-muted'}`} />
//                   )}
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* Step 1 - Order Summary */}
//         {step === 1 && (
//           <div className="space-y-4 lg:space-y-6 p-1">
//             <div className="bg-muted/50 p-3 lg:p-4 rounded-lg">
//               <h3 className="font-medium text-card-foreground mb-3 text-sm lg:text-base">Order Summary</h3>
//               <div className="space-y-2">
//                 <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
//                   <div className="flex-1">
//                     <div className="font-medium text-xs lg:text-sm text-card-foreground">{dataset.name}</div>
//                     <Badge variant="secondary" className="mt-1 bg-primary/10 text-primary text-xs">
//                       {categoryLabels[dataset.category]}
//                     </Badge>
//                   </div>
//                   <div className="sm:text-right">
//                     <div className="font-medium text-card-foreground text-sm lg:text-base">₹{price}</div>
//                   </div>
//                 </div>
//               </div>
//               <Separator className="my-3" />
//               <div className="space-y-2 text-xs lg:text-sm">
//                 <div className="flex justify-between"><span>Dataset Price:</span><span>${price}</span></div>
//                 <div className="flex justify-between"><span>Tax (10%):</span><span>${tax}</span></div>
//                 <Separator className="my-2" />
//                 <div className="flex justify-between font-medium text-sm lg:text-base">
//                   <span>Total:</span><span>${total}</span>
//                 </div>
//               </div>
//             </div>

//             {/* Dataset details */}
//             <div className="grid grid-cols-3 gap-2 lg:gap-4 text-center">
//               <div className="p-2 lg:p-3 bg-muted/30 rounded">
//                 <div className="text-base lg:text-lg font-bold text-primary">{formatNumber(dataset.filtered_total_records)}</div>
//                 <div className="text-xs text-muted-foreground">Records</div>
//               </div>
//               <div className="p-2 lg:p-3 bg-muted/30 rounded">
//                 <div className="text-base lg:text-lg font-bold text-primary">{formatNumber(dataset.filtered_email_count)}</div>
//                 <div className="text-xs text-muted-foreground">Emails</div>
//               </div>
//               <div className="p-2 lg:p-3 bg-muted/30 rounded">
//                 <div className="text-base lg:text-lg font-bold text-primary">{formatNumber(dataset.filtered_phone_count)}</div>
//                 <div className="text-xs text-muted-foreground">Phones</div>
//               </div>
//             </div>

//             <div className="flex justify-end pt-2">
//               <Button onClick={handleNext} className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 lg:h-11 px-6 lg:px-8 text-sm lg:text-base">
//                 Continue to Details
//               </Button>
//             </div>
//           </div>
//         )}

//         {/* Step 2 - Contact Info */}
//         {step === 2 && (
//           <div className="space-y-4 p-1">
//             <h3 className="font-medium text-card-foreground text-sm lg:text-base">Contact Information</h3>
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
//               <div>
//                 <Label htmlFor="name">Full Name</Label>
//                 <Input id="name" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="Enter your full name" />
//               </div>
//               <div>
//                 <Label htmlFor="email">Email Address</Label>
//                 <Input id="email" type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} placeholder="your@company.com" />
//               </div>
//               <div>
//                 <Label htmlFor="company">Company Name</Label>
//                 <Input id="company" value={formData.company} onChange={(e) => handleInputChange('company', e.target.value)} placeholder="Your Company" />
//               </div>
//               <div>
//                 <Label htmlFor="phone">Phone Number</Label>
//                 <Input id="phone" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} placeholder="+1 (555) 123-4567" />
//               </div>
//             </div>
//             <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
//               <Button variant="outline" onClick={handleBack}>Back</Button>
//               <Button onClick={handleNext} className="bg-primary hover:bg-primary/90 text-primary-foreground">Continue to Payment</Button>
//             </div>
//           </div>
//         )}

//         {/* Step 3 - Payment */}
//         {step === 3 && (
//           <div className="space-y-4 p-1">
//             <h3 className="font-medium text-card-foreground flex items-center gap-2 text-sm lg:text-base">
//               <CreditCard className="w-4 h-4" /> Payment Information
//             </h3>

//             {/* Payment method selector */}
//             <div className="flex gap-4">
//               <Button variant={paymentMethod === "card" ? "default" : "outline"} onClick={() => setPaymentMethod("card")}>
//                 Pay with Card
//               </Button>
//               <Button variant={paymentMethod === "upi" ? "default" : "outline"} onClick={() => setPaymentMethod("upi")}>
//                 Pay with UPI
//               </Button>
//             </div>

//             {/* Card form */}
//             {paymentMethod === "card" && (
//               <div className="space-y-4">
//                 <div>
//                   <Label htmlFor="cardNumber">Card Number</Label>
//                   <Input id="cardNumber" value={formData.cardNumber} onChange={(e) => handleInputChange('cardNumber', e.target.value)} placeholder="1234 5678 9012 3456" />
//                 </div>
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <Label htmlFor="expiry">Expiry Date</Label>
//                     <Input id="expiry" value={formData.expiry} onChange={(e) => handleInputChange('expiry', e.target.value)} placeholder="MM/YY" />
//                   </div>
//                   <div>
//                     <Label htmlFor="cvv">CVV</Label>
//                     <Input id="cvv" value={formData.cvv} onChange={(e) => handleInputChange('cvv', e.target.value)} placeholder="123" />
//                   </div>
//                 </div>
//                 <div>
//                   <Label htmlFor="billingAddress">Billing Address</Label>
//                   <Input id="billingAddress" value={formData.billingAddress} onChange={(e) => handleInputChange('billingAddress', e.target.value)} placeholder="123 Main St, City, State, ZIP" />
//                 </div>
//               </div>
//             )}

//             {/* UPI QR code */}
//             {paymentMethod === "upi" && (
//               <div className="text-center space-y-4">
//                 <p className="text-muted-foreground">Scan this QR code to pay</p>
//                 <QRCodeCanvas value={`upi://pay?pa=78959285932@axl=B2B&am=${total}&cu=INR`} size={180} />
//                 <p className="font-medium">Amount: ₹{total}</p>
//               </div>
//             )}

//             {/* Final summary */}
//             <div className="bg-muted/50 p-4 rounded-lg">
//               <div className="flex justify-between items-center">
//                 <div>
//                   <div className="font-medium text-card-foreground">Total Amount</div>
//                   <div className="text-sm text-muted-foreground">Including tax</div>
//                 </div>
//                 <div className="text-xl font-bold text-primary">₹{total}</div>
//               </div>
//             </div>

//             <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
//               <Button variant="outline" onClick={handleBack}>Back</Button>
//               <Button onClick={handlePurchase} className="bg-primary hover:bg-primary/90 text-primary-foreground">
//                 <ShoppingCart className="w-4 h-4 mr-2" />
//                 {paymentMethod === "upi" ? "Confirm UPI Payment" : "Complete Purchase"}
//               </Button>
//             </div>
//           </div>
//         )}

//         {/* Step 4 - Success */}
//         {step === 4 && (
//           <div className="text-center space-y-6 py-8">
//             <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
//               <Check className="w-8 h-8 text-green-600" />
//             </div>
//             <div>
//               <h3 className="text-xl font-semibold text-card-foreground mb-2">Purchase Successful!</h3>
//               <p className="text-muted-foreground">You will receive a download link in your email within 5-10 minutes.</p>
//             </div>
//             <div className="bg-muted/50 p-4 rounded-lg">
//               <div className="text-sm text-muted-foreground">Order ID</div>
//               <div className="font-mono text-card-foreground">#{Math.random().toString(36).substr(2, 9).toUpperCase()}</div>
//             </div>
//           </div>
//         )}
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default PurchaseModal;



// import { useState } from "react";
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Separator } from "@/components/ui/separator";
// import { Badge } from "@/components/ui/badge";
// import { CreditCard, Mail, Phone, MapPin, ShoppingCart, Check } from "lucide-react";
// import { Dataset, useDataContext } from "@/contexts/dataContext";


// interface PurchaseModalProps {
//   dataset: Dataset | null;
//   isOpen: boolean;
//   onClose: () => void;
// }

// const PurchaseModal = ({ dataset, isOpen, onClose }: PurchaseModalProps) => {
//   const [step, setStep] = useState(1);
//   const {
//       countries,
//       categories,
//       datasets,
//       datasetRecords,
//       fetchCountries,
//       fetchCategories,
//       fetchDatasets,
//       fetchDatasetRecords,
//     } = useDataContext();
  
//   const [formData, setFormData] = useState({
//     email: "",
//     company: "",
//     name: "",
//     phone: "",
//     cardNumber: "",
//     expiry: "",
//     cvv: "",
//     billingAddress: ""
//   });

//   if (!dataset) return null;

//   const formatNumber = (num: number) => num.toLocaleString();
//   const price = Math.floor(dataset.total_records * dataset.price);
//   const tax = Math.floor(price * 0.1);
//   const total = price + tax;

//   const categoryLabels: Record<string, string> = {
//     'bus-stops': 'Transportation',
//     'restaurants': 'Food & Dining',
//     'hotels': 'Hospitality',
//     'retail-stores': 'Retail',
//     'healthcare': 'Healthcare'
//   };

//   const handleInputChange = (field: string, value: string) => {
//     setFormData(prev => ({ ...prev, [field]: value }));
//   };

//   const handleNext = () => {
//     if (step < 3) setStep(step + 1);
//   };

//   const handleBack = () => {
//     if (step > 1) setStep(step - 1);
//   };

//   const handlePurchase = () => {
//     // Simulate purchase
//     setStep(4);
//     setTimeout(() => {
//       onClose();
//       setStep(1);
//     }, 3000);
//   };

//   const resetModal = () => {
//     setStep(1);
//     setFormData({
//       email: "",
//       company: "",
//       name: "",
//       phone: "",
//       cardNumber: "",
//       expiry: "",
//       cvv: "",
//       billingAddress: ""
//     });
//     onClose();
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={resetModal}>
//       <DialogContent className="max-w-3xl w-[95vw] max-h-[95vh] overflow-y-auto mx-4">
//         <DialogHeader>
//           <DialogTitle className="text-xl lg:text-2xl font-semibold text-card-foreground">
//             {step === 4 ? "Purchase Complete!" : "Purchase Dataset"}
//           </DialogTitle>
//         </DialogHeader>

//         {step !== 4 && (
//           <div className="flex items-center justify-center mb-4 lg:mb-6">
//             <div className="flex items-center space-x-1 lg:space-x-2">
//               {[1, 2, 3].map((stepNum) => (
//                 <div key={stepNum} className="flex items-center">
//                   <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-xs lg:text-sm font-medium ${
//                     stepNum <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
//                   }`}>
//                     {stepNum}
//                   </div>
//                   {stepNum < 3 && (
//                     <div className={`w-8 lg:w-12 h-1 ${stepNum < step ? 'bg-primary' : 'bg-muted'}`} />
//                   )}
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}

//         {step === 1 && (
//           <div className="space-y-4 lg:space-y-6 p-1">
//             {/* Order Summary */}
//             <div className="bg-muted/50 p-3 lg:p-4 rounded-lg">
//               <h3 className="font-medium text-card-foreground mb-3 text-sm lg:text-base">Order Summary</h3>
//               <div className="space-y-2">
//                 <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
//                   <div className="flex-1">
//                     <div className="font-medium text-xs lg:text-sm text-card-foreground">{dataset.name}</div>
//                     <Badge variant="secondary" className="mt-1 bg-primary/10 text-primary text-xs">
//                       {categoryLabels[dataset.category]}
//                     </Badge>
//                   </div>
//                   <div className="sm:text-right">
//                     <div className="font-medium text-card-foreground text-sm lg:text-base">${price}</div>
//                   </div>
//                 </div>
//               </div>
              
//               <Separator className="my-3" />
              
//               <div className="space-y-2 text-xs lg:text-sm">
//                 <div className="flex justify-between">
//                   <span>Dataset Price:</span>
//                   <span>${price}</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span>Tax (10%):</span>
//                   <span>${tax}</span>
//                 </div>
//                 <Separator className="my-2" />
//                 <div className="flex justify-between font-medium text-sm lg:text-base">
//                   <span>Total:</span>
//                   <span>${total}</span>
//                 </div>
//               </div>
//             </div>

//             {/* Dataset Details */}
//             <div className="grid grid-cols-3 gap-2 lg:gap-4 text-center">
//               <div className="p-2 lg:p-3 bg-muted/30 rounded">
//                 <div className="text-base lg:text-lg font-bold text-primary">{formatNumber(dataset.total_records)}</div>
//                 <div className="text-xs text-muted-foreground">Records</div>
//               </div>
//               <div className="p-2 lg:p-3 bg-muted/30 rounded">
//                 <div className="text-base lg:text-lg font-bold text-primary">{formatNumber(dataset.total_emails)}</div>
//                 <div className="text-xs text-muted-foreground">Emails</div>
//               </div>
//               <div className="p-2 lg:p-3 bg-muted/30 rounded">
//                 <div className="text-base lg:text-lg font-bold text-primary">{formatNumber(dataset.total_phones)}</div>
//                 <div className="text-xs text-muted-foreground">Phones</div>
//               </div>
//             </div>

//             <div className="flex justify-end pt-2">
//               <Button onClick={handleNext} className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 lg:h-11 px-6 lg:px-8 text-sm lg:text-base">
//                 Continue to Details
//               </Button>
//             </div>
//           </div>
//         )}

//         {step === 2 && (
//           <div className="space-y-4 p-1">
//             <h3 className="font-medium text-card-foreground text-sm lg:text-base">Contact Information</h3>
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
//               <div>
//                 <Label htmlFor="name">Full Name</Label>
//                 <Input
//                   id="name"
//                   value={formData.name}
//                   onChange={(e) => handleInputChange('name', e.target.value)}
//                   placeholder="Enter your full name"
//                 />
//               </div>
//               <div>
//                 <Label htmlFor="email">Email Address</Label>
//                 <Input
//                   id="email"
//                   type="email"
//                   value={formData.email}
//                   onChange={(e) => handleInputChange('email', e.target.value)}
//                   placeholder="your@company.com"
//                 />
//               </div>
//               <div>
//                 <Label htmlFor="company">Company Name</Label>
//                 <Input
//                   id="company"
//                   value={formData.company}
//                   onChange={(e) => handleInputChange('company', e.target.value)}
//                   placeholder="Your Company"
//                 />
//               </div>
//               <div>
//                 <Label htmlFor="phone">Phone Number</Label>
//                 <Input
//                   id="phone"
//                   value={formData.phone}
//                   onChange={(e) => handleInputChange('phone', e.target.value)}
//                   placeholder="+1 (555) 123-4567"
//                 />
//               </div>
//             </div>
            
//             <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
//               <Button variant="outline" onClick={handleBack} className="h-10 lg:h-11 px-6 lg:px-8 text-sm lg:text-base">
//                 Back
//               </Button>
//               <Button onClick={handleNext} className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 lg:h-11 px-6 lg:px-8 text-sm lg:text-base">
//                 Continue to Payment
//               </Button>
//             </div>
//           </div>
//         )}

//         {step === 3 && (
//           <div className="space-y-4 p-1">
//             <h3 className="font-medium text-card-foreground flex items-center gap-2 text-sm lg:text-base">
//               <CreditCard className="w-4 h-4" />
//               Payment Information
//             </h3>
//             <div className="space-y-4">
//               <div>
//                 <Label htmlFor="cardNumber">Card Number</Label>
//                 <Input
//                   id="cardNumber"
//                   value={formData.cardNumber}
//                   onChange={(e) => handleInputChange('cardNumber', e.target.value)}
//                   placeholder="1234 5678 9012 3456"
//                 />
//               </div>
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <Label htmlFor="expiry">Expiry Date</Label>
//                   <Input
//                     id="expiry"
//                     value={formData.expiry}
//                     onChange={(e) => handleInputChange('expiry', e.target.value)}
//                     placeholder="MM/YY"
//                   />
//                 </div>
//                 <div>
//                   <Label htmlFor="cvv">CVV</Label>
//                   <Input
//                     id="cvv"
//                     value={formData.cvv}
//                     onChange={(e) => handleInputChange('cvv', e.target.value)}
//                     placeholder="123"
//                   />
//                 </div>
//               </div>
//               <div>
//                 <Label htmlFor="billingAddress">Billing Address</Label>
//                 <Input
//                   id="billingAddress"
//                   value={formData.billingAddress}
//                   onChange={(e) => handleInputChange('billingAddress', e.target.value)}
//                   placeholder="123 Main St, City, State, ZIP"
//                 />
//               </div>
//             </div>

//             {/* Final Summary */}
//             <div className="bg-muted/50 p-4 rounded-lg">
//               <div className="flex justify-between items-center">
//                 <div>
//                   <div className="font-medium text-card-foreground">Total Amount</div>
//                   <div className="text-sm text-muted-foreground">Including tax</div>
//                 </div>
//                 <div className="text-xl font-bold text-primary">${total}</div>
//               </div>
//             </div>
            
//             <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
//               <Button variant="outline" onClick={handleBack} className="h-10 lg:h-11 px-6 lg:px-8 text-sm lg:text-base">
//                 Back
//               </Button>
//               <Button onClick={handlePurchase} className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 lg:h-11 px-6 lg:px-8 text-sm lg:text-base">
//                 <ShoppingCart className="w-4 h-4 mr-2" />
//                 Complete Purchase
//               </Button>
//             </div>
//           </div>
//         )}

//         {step === 4 && (
//           <div className="text-center space-y-6 py-8">
//             <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
//               <Check className="w-8 h-8 text-green-600" />
//             </div>
//             <div>
//               <h3 className="text-xl font-semibold text-card-foreground mb-2">
//                 Purchase Successful!
//               </h3>
//               <p className="text-muted-foreground">
//                 Your dataset has been purchased successfully. You will receive a download link in your email within 5-10 minutes.
//               </p>
//             </div>
//             <div className="bg-muted/50 p-4 rounded-lg">
//               <div className="text-sm text-muted-foreground">Order ID</div>
//               <div className="font-mono text-card-foreground">#{Math.random().toString(36).substr(2, 9).toUpperCase()}</div>
//             </div>
//           </div>
//         )}
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default PurchaseModal;


// import { useState } from "react";
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Separator } from "@/components/ui/separator";
// import { Badge } from "@/components/ui/badge";
// import { CreditCard, Mail, Phone, MapPin, ShoppingCart, Check } from "lucide-react";

// interface Dataset {
//   id: string;
//   name: string;
//   totalRecords: number;
//   emails: number;
//   phones: number;
//   category: string;
//   country: string;
//   state?: string;
// }

// interface PurchaseModalProps {
//   dataset: Dataset | null;
//   isOpen: boolean;
//   onClose: () => void;
// }

// const PurchaseModal = ({ dataset, isOpen, onClose }: PurchaseModalProps) => {
//   const [step, setStep] = useState(1);
//   const [formData, setFormData] = useState({
//     email: "",
//     company: "",
//     name: "",
//     phone: "",
//     cardNumber: "",
//     expiry: "",
//     cvv: "",
//     billingAddress: ""
//   });

//   if (!dataset) return null;

//   const formatNumber = (num: number) => num.toLocaleString();
//   const price = Math.floor(dataset.totalRecords * 0.05);
//   const tax = Math.floor(price * 0.1);
//   const total = price + tax;

//   const categoryLabels: Record<string, string> = {
//     'bus-stops': 'Transportation',
//     'restaurants': 'Food & Dining',
//     'hotels': 'Hospitality',
//     'retail-stores': 'Retail',
//     'healthcare': 'Healthcare'
//   };

//   const handleInputChange = (field: string, value: string) => {
//     setFormData(prev => ({ ...prev, [field]: value }));
//   };

//   const handleNext = () => {
//     if (step < 3) setStep(step + 1);
//   };

//   const handleBack = () => {
//     if (step > 1) setStep(step - 1);
//   };

//   const handlePurchase = () => {
//     // Simulate purchase
//     setStep(4);
//     setTimeout(() => {
//       onClose();
//       setStep(1);
//     }, 3000);
//   };

//   const resetModal = () => {
//     setStep(1);
//     setFormData({
//       email: "",
//       company: "",
//       name: "",
//       phone: "",
//       cardNumber: "",
//       expiry: "",
//       cvv: "",
//       billingAddress: ""
//     });
//     onClose();
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={resetModal}>
//       <DialogContent className="max-w-3xl w-[95vw] max-h-[95vh] overflow-y-auto mx-4">
//         <DialogHeader>
//           <DialogTitle className="text-xl lg:text-2xl font-semibold text-card-foreground">
//             {step === 4 ? "Purchase Complete!" : "Purchase Dataset"}
//           </DialogTitle>
//         </DialogHeader>

//         {step !== 4 && (
//           <div className="flex items-center justify-center mb-4 lg:mb-6">
//             <div className="flex items-center space-x-1 lg:space-x-2">
//               {[1, 2, 3].map((stepNum) => (
//                 <div key={stepNum} className="flex items-center">
//                   <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-xs lg:text-sm font-medium ${
//                     stepNum <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
//                   }`}>
//                     {stepNum}
//                   </div>
//                   {stepNum < 3 && (
//                     <div className={`w-8 lg:w-12 h-1 ${stepNum < step ? 'bg-primary' : 'bg-muted'}`} />
//                   )}
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}

//         {step === 1 && (
//           <div className="space-y-4 lg:space-y-6 p-1">
//             {/* Order Summary */}
//             <div className="bg-muted/50 p-3 lg:p-4 rounded-lg">
//               <h3 className="font-medium text-card-foreground mb-3 text-sm lg:text-base">Order Summary</h3>
//               <div className="space-y-2">
//                 <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
//                   <div className="flex-1">
//                     <div className="font-medium text-xs lg:text-sm text-card-foreground">{dataset.name}</div>
//                     <Badge variant="secondary" className="mt-1 bg-primary/10 text-primary text-xs">
//                       {categoryLabels[dataset.category]}
//                     </Badge>
//                   </div>
//                   <div className="sm:text-right">
//                     <div className="font-medium text-card-foreground text-sm lg:text-base">${price}</div>
//                   </div>
//                 </div>
//               </div>
              
//               <Separator className="my-3" />
              
//               <div className="space-y-2 text-xs lg:text-sm">
//                 <div className="flex justify-between">
//                   <span>Dataset Price:</span>
//                   <span>${price}</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span>Tax (10%):</span>
//                   <span>${tax}</span>
//                 </div>
//                 <Separator className="my-2" />
//                 <div className="flex justify-between font-medium text-sm lg:text-base">
//                   <span>Total:</span>
//                   <span>${total}</span>
//                 </div>
//               </div>
//             </div>

//             {/* Dataset Details */}
//             <div className="grid grid-cols-3 gap-2 lg:gap-4 text-center">
//               <div className="p-2 lg:p-3 bg-muted/30 rounded">
//                 <div className="text-base lg:text-lg font-bold text-primary">{formatNumber(dataset.totalRecords)}</div>
//                 <div className="text-xs text-muted-foreground">Records</div>
//               </div>
//               <div className="p-2 lg:p-3 bg-muted/30 rounded">
//                 <div className="text-base lg:text-lg font-bold text-primary">{formatNumber(dataset.emails)}</div>
//                 <div className="text-xs text-muted-foreground">Emails</div>
//               </div>
//               <div className="p-2 lg:p-3 bg-muted/30 rounded">
//                 <div className="text-base lg:text-lg font-bold text-primary">{formatNumber(dataset.phones)}</div>
//                 <div className="text-xs text-muted-foreground">Phones</div>
//               </div>
//             </div>

//             <div className="flex justify-end pt-2">
//               <Button onClick={handleNext} className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 lg:h-11 px-6 lg:px-8 text-sm lg:text-base">
//                 Continue to Details
//               </Button>
//             </div>
//           </div>
//         )}

//         {step === 2 && (
//           <div className="space-y-4 p-1">
//             <h3 className="font-medium text-card-foreground text-sm lg:text-base">Contact Information</h3>
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
//               <div>
//                 <Label htmlFor="name">Full Name</Label>
//                 <Input
//                   id="name"
//                   value={formData.name}
//                   onChange={(e) => handleInputChange('name', e.target.value)}
//                   placeholder="Enter your full name"
//                 />
//               </div>
//               <div>
//                 <Label htmlFor="email">Email Address</Label>
//                 <Input
//                   id="email"
//                   type="email"
//                   value={formData.email}
//                   onChange={(e) => handleInputChange('email', e.target.value)}
//                   placeholder="your@company.com"
//                 />
//               </div>
//               <div>
//                 <Label htmlFor="company">Company Name</Label>
//                 <Input
//                   id="company"
//                   value={formData.company}
//                   onChange={(e) => handleInputChange('company', e.target.value)}
//                   placeholder="Your Company"
//                 />
//               </div>
//               <div>
//                 <Label htmlFor="phone">Phone Number</Label>
//                 <Input
//                   id="phone"
//                   value={formData.phone}
//                   onChange={(e) => handleInputChange('phone', e.target.value)}
//                   placeholder="+1 (555) 123-4567"
//                 />
//               </div>
//             </div>
            
//             <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
//               <Button variant="outline" onClick={handleBack} className="h-10 lg:h-11 px-6 lg:px-8 text-sm lg:text-base">
//                 Back
//               </Button>
//               <Button onClick={handleNext} className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 lg:h-11 px-6 lg:px-8 text-sm lg:text-base">
//                 Continue to Payment
//               </Button>
//             </div>
//           </div>
//         )}

//         {step === 3 && (
//           <div className="space-y-4 p-1">
//             <h3 className="font-medium text-card-foreground flex items-center gap-2 text-sm lg:text-base">
//               <CreditCard className="w-4 h-4" />
//               Payment Information
//             </h3>
//             <div className="space-y-4">
//               <div>
//                 <Label htmlFor="cardNumber">Card Number</Label>
//                 <Input
//                   id="cardNumber"
//                   value={formData.cardNumber}
//                   onChange={(e) => handleInputChange('cardNumber', e.target.value)}
//                   placeholder="1234 5678 9012 3456"
//                 />
//               </div>
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <Label htmlFor="expiry">Expiry Date</Label>
//                   <Input
//                     id="expiry"
//                     value={formData.expiry}
//                     onChange={(e) => handleInputChange('expiry', e.target.value)}
//                     placeholder="MM/YY"
//                   />
//                 </div>
//                 <div>
//                   <Label htmlFor="cvv">CVV</Label>
//                   <Input
//                     id="cvv"
//                     value={formData.cvv}
//                     onChange={(e) => handleInputChange('cvv', e.target.value)}
//                     placeholder="123"
//                   />
//                 </div>
//               </div>
//               <div>
//                 <Label htmlFor="billingAddress">Billing Address</Label>
//                 <Input
//                   id="billingAddress"
//                   value={formData.billingAddress}
//                   onChange={(e) => handleInputChange('billingAddress', e.target.value)}
//                   placeholder="123 Main St, City, State, ZIP"
//                 />
//               </div>
//             </div>

//             {/* Final Summary */}
//             <div className="bg-muted/50 p-4 rounded-lg">
//               <div className="flex justify-between items-center">
//                 <div>
//                   <div className="font-medium text-card-foreground">Total Amount</div>
//                   <div className="text-sm text-muted-foreground">Including tax</div>
//                 </div>
//                 <div className="text-xl font-bold text-primary">${total}</div>
//               </div>
//             </div>
            
//             <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
//               <Button variant="outline" onClick={handleBack} className="h-10 lg:h-11 px-6 lg:px-8 text-sm lg:text-base">
//                 Back
//               </Button>
//               <Button onClick={handlePurchase} className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 lg:h-11 px-6 lg:px-8 text-sm lg:text-base">
//                 <ShoppingCart className="w-4 h-4 mr-2" />
//                 Complete Purchase
//               </Button>
//             </div>
//           </div>
//         )}

//         {step === 4 && (
//           <div className="text-center space-y-6 py-8">
//             <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
//               <Check className="w-8 h-8 text-green-600" />
//             </div>
//             <div>
//               <h3 className="text-xl font-semibold text-card-foreground mb-2">
//                 Purchase Successful!
//               </h3>
//               <p className="text-muted-foreground">
//                 Your dataset has been purchased successfully. You will receive a download link in your email within 5-10 minutes.
//               </p>
//             </div>
//             <div className="bg-muted/50 p-4 rounded-lg">
//               <div className="text-sm text-muted-foreground">Order ID</div>
//               <div className="font-mono text-card-foreground">#{Math.random().toString(36).substr(2, 9).toUpperCase()}</div>
//             </div>
//           </div>
//         )}
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default PurchaseModal;
