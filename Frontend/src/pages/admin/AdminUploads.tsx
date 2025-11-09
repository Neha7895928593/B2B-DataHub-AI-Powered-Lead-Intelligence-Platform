import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Upload, FileText, CheckCircle, X, Download, Eye, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

// Mock API functions
const uploadData = async (data: FormData) => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 2000));
  return { success: true };
};

const createCategory = async (data: any) => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { success: true };
};

const createCountry = async (data: any) => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { success: true };
};

const createCity = async (data: any) => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { success: true };
};

const createState = async (data: any) => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { success: true };
};

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  uploadDate: string;
  status: 'processing' | 'completed' | 'failed';
  records: number;
}

export default function AdminUploads() {
  const { toast } = useToast();
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([
    {
      id: '1',
      name: 'restaurants_usa.csv',
      size: '2.5 MB',
      uploadDate: '2024-01-15',
      status: 'completed',
      records: 15420
    },
    {
      id: '2',
      name: 'hotels_uk.xlsx',
      size: '1.8 MB',
      uploadDate: '2024-01-14',
      status: 'processing',
      records: 8930
    },
  ]);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [fieldMappings, setFieldMappings] = useState<{ [key: string]: string }>({});
  const [showMapping, setShowMapping] = useState(false);
  const [availableFields, setAvailableFields] = useState([
    { key: 'country', label: 'Country', required: true },
    { key: 'state', label: 'State', required: false },
    { key: 'city', label: 'City', required: false },
    { key: 'name', label: 'Name', required: false },
    { key: 'address', label: 'Address', required: false },
    { key: 'phone', label: 'Phone', required: false },
    { key: 'email', label: 'Email', required: false },
  ]);

  // Custom field form states
  const [showCustomFieldForm, setShowCustomFieldForm] = useState(false);
  const [customFieldName, setCustomFieldName] = useState('');
  const [customFieldDefaultValue, setCustomFieldDefaultValue] = useState('');
  const [customFieldValues, setCustomFieldValues] = useState<{ [key: string]: string }>({});

  // Custom database field form states  
  const [showCustomDbFieldForm, setShowCustomDbFieldForm] = useState(false);
  const [customDbFieldName, setCustomDbFieldName] = useState('');
  const [customDbFieldRequired, setCustomDbFieldRequired] = useState(false);

  const [newDataset, setNewDataset] = useState({
    category:'',
    description: '',
    price: '',
    proofAttachment: null,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      readFileHeaders(file);
      handleFileUpload([file]);
    }
  };

  const readFileHeaders = (file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = e.target?.result;

      if (!data) return;

      if (file.name.endsWith(".csv")) {
        // CSV case
        const text = data as string;
        const lines = text.split("\n");
        const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
        setFileHeaders(headers);
        setShowMapping(true);

      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        // Excel case
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0]; // first sheet
        const sheet = workbook.Sheets[sheetName];

        // Convert sheet to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const headers = (jsonData[0] as string[]).map((h) => h.trim());

        setFileHeaders(headers);
        setShowMapping(true);
      }
    };

    if (file.name.endsWith(".csv")) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file); // for excel
    }
  };

  const handleFileUpload = (files: File[]) => {
    files.forEach((file) => {
      if (file.type === 'text/csv' || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const newFile: UploadedFile = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
          uploadDate: new Date().toISOString().split('T')[0],
          status: 'processing',
          records: Math.floor(Math.random() * 50000) + 1000
        };

        setUploadedFiles(prev => [...prev, newFile]);

        // Simulate processing
        setTimeout(() => {
          setUploadedFiles(prev =>
            prev.map(f => f.id === newFile.id ? { ...f, status: 'completed' as const } : f)
          );
        }, 3000);

        toast({
          title: "File uploaded successfully",
          description: `${file.name} is being processed.`,
        });
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload CSV or Excel files only.",
          variant: "destructive",
        });
      }
    });
  };

  const handleDeleteFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
    toast({
      title: "File deleted",
      description: "Dataset has been removed successfully.",
    });
  };

  const addCustomField = () => {
    if (!customFieldName.trim()) {
      toast({
        title: "Field name required",
        description: "Please enter a field name.",
        variant: "destructive",
      });
      return;
    }

    const key = customFieldName.toLowerCase().replace(/\s+/g, "_");
    
    // // Check if field already exists
    // if (availableFields.some(f => f.key === key) || fileHeaders.includes(customFieldName)) {
    //   toast({
    //     title: "Field already exists",
    //     description: "This field name already exists.",
    //     variant: "destructive",
    //   });
    //   return;
    // }

    // Add to file headers (left side)
    setFileHeaders(prev => [...prev, customFieldName]);
    
    // Store the default value for this custom field
    if (customFieldDefaultValue.trim()) {
      setCustomFieldValues(prev => ({
        ...prev,
        [customFieldName]: customFieldDefaultValue
      }));
    }

    // Reset form
    setCustomFieldName('');
    setCustomFieldDefaultValue('');
    setShowCustomFieldForm(false);

    toast({
      title: "Custom field added",
      description: `Field "${customFieldName}" has been added to file columns.`,
    });
  };

  const addCustomDbField = () => {
    if (!customDbFieldName.trim()) {
      toast({
        title: "Field name required",
        description: "Please enter a database field name.",
        variant: "destructive",
      });
      return;
    }

    const key = customDbFieldName.toLowerCase().replace(/\s+/g, "_");
    
    // Check if field already exists
    // if (availableFields.some(f => f.key === key)) {
    //   toast({
    //     title: "Field already exists",
    //     description: "This database field name already exists.",
    //     variant: "destructive",
    //   });
    //   return;
    // }

    const newField = {
      key,
      label: customDbFieldName,
      required: customDbFieldRequired
    };

    setAvailableFields(prev => [...prev, newField]);

    // Reset form
    setCustomDbFieldName('');
    setCustomDbFieldRequired(false);
    setShowCustomDbFieldForm(false);

    toast({
      title: "Database field added",
      description: `Field "${customDbFieldName}" has been added to database fields.`,
    });
  };

  const removeCustomField = (fieldKey: string) => {
    setAvailableFields(prev => prev.filter(f => f.key !== fieldKey));
    setFieldMappings(prev => {
      const newMappings = { ...prev };
      delete newMappings[fieldKey];
      return newMappings;
    });
    toast({
      title: "Field removed",
      description: "Custom database field has been removed.",
    });
  };

  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string | File | null) => {
    setNewDataset(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateDataset = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please upload a CSV or Excel file before creating dataset.",
        variant: "destructive",
      });
      return;
    }

    // Check if mapping is complete for required fields
    const requiredMappings = ['country','name','address',"phone","email"];
    const missingMappings = requiredMappings.filter(field => !fieldMappings[field]);
    
    // if (missingMappings.length > 0) {
    //   toast({
    //     title: "Incomplete field mapping",
    //     description: `Please map the following required fields: ${missingMappings.join(', ')}`,
    //     variant: "destructive",
    //   });
    //   return;
    // }

    // if (!newDataset.description || !newDataset.price) {
    //   toast({
    //     title: "Missing required fields",
    //     description: "Category, Country, Description and Price are required.",
    //     variant: "destructive",
    //   });
    //   return;
    // }

    const data = new FormData();
    data.append("category", newDataset.category); 
    data.append("description", newDataset.description); 
    data.append("price", newDataset.price);             
    data.append("file", selectedFile);
    
    // Add field mappings to the form data
    data.append("fieldMappings", JSON.stringify(fieldMappings));
    
    // Add custom field values
    data.append("customFieldValues", JSON.stringify(customFieldValues));
                 
    if (newDataset.proofAttachment) {
      data.append("proofAttachment", newDataset.proofAttachment); 
    }

    try {
      setIsLoading(true);
      const res = await uploadData(data);
      toast({
        title: "Dataset created",
        description: "New dataset has been added to the system.",
      });
      setNewDataset({
        category:"",
        description: '',
        price: '',
        proofAttachment:null,
      });
      setSelectedFile(null);
      setFileHeaders([]);
      setFieldMappings({});
      setCustomFieldValues({});
      setShowMapping(false);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to upload dataset.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false); 
    }
  };

  const RequiredLabel = ({ children }: { children: string }) => (
    <Label className="font-medium">
      {children} <span className="text-destructive">*</span>
    </Label>
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-primary/10 text-primary border-primary/20">Completed</Badge>;
      case 'processing':
        return <Badge className="bg-secondary text-secondary-foreground">Processing</Badge>;
      case 'failed':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">File Uploads</h1>
        <p className="text-muted-foreground">Upload and manage dataset files</p>
      </div>

      {/* Enhanced Field Mapping Section */}
      {showMapping && fileHeaders.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Map File Columns to Database Fields</h2>
          <p className="text-muted-foreground mb-6">
            Connect your CSV columns to our database fields. Required fields must be mapped before creating the dataset.
          </p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side - File Columns */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  File Columns ({fileHeaders.length})
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCustomFieldForm(!showCustomFieldForm)}
                  className="h-8"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Custom Column
                </Button>
              </div>

              {/* Custom Field Form */}
              {showCustomFieldForm && (
                <Card className="p-4 bg-accent/30">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Field Name</Label>
                      <Input
                        value={customFieldName}
                        onChange={(e) => setCustomFieldName(e.target.value)}
                        placeholder="e.g., Country, State, etc."
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Default Value (Optional)</Label>
                      <Input
                        value={customFieldDefaultValue}
                        onChange={(e) => setCustomFieldDefaultValue(e.target.value)}
                        placeholder="e.g., USA, N/A, etc."
                        className="h-8"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={addCustomField}
                        className="h-8"
                      >
                        Add Field
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowCustomFieldForm(false);
                          setCustomFieldName('');
                          setCustomFieldDefaultValue('');
                        }}
                        className="h-8"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="space-y-2">
                  {fileHeaders.map((header, idx) => {
                    const isMapped = Object.values(fieldMappings).includes(header);
                    const hasDefaultValue = customFieldValues[header];
                    const isCustomColumn = customFieldValues[header] !== undefined;
                    
                    return (
                      <div key={idx} className={`flex items-center justify-between p-2 rounded border ${
                        isMapped ? 'bg-accent border-primary/20' : 'bg-background border-border'
                      }`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            isMapped ? 'bg-primary' : 'bg-muted-foreground'
                          }`} />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{header}</span>
                            {hasDefaultValue && (
                              <span className="text-xs text-muted-foreground">
                                Default: {customFieldValues[header]}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isMapped && (
                            <Badge variant="secondary" className="text-xs">
                              Mapped
                            </Badge>
                          )}
                          {isCustomColumn && (
                            <Badge variant="outline" className="text-xs bg-primary/10">
                              Custom
                            </Badge>
                          )}
                          {isCustomColumn && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setFileHeaders(prev => prev.filter(h => h !== header));
                                setCustomFieldValues(prev => {
                                  const newValues = { ...prev };
                                  delete newValues[header];
                                  return newValues;
                                });
                                // Remove from field mappings if mapped
                                setFieldMappings(prev => {
                                  const newMappings = { ...prev };
                                  Object.keys(newMappings).forEach(key => {
                                    if (newMappings[key] === header) {
                                      delete newMappings[key];
                                    }
                                  });
                                  return newMappings;
                                });
                              }}
                              className="text-destructive hover:text-destructive h-6 w-6 p-0"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Side - System Fields */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Database Fields ({availableFields.length})
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCustomDbFieldForm(!showCustomDbFieldForm)}
                  className="h-8"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Database Field
                </Button>
              </div>

              {/* Custom Database Field Form */}
              {showCustomDbFieldForm && (
                <Card className="p-4 bg-accent/30">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Database Field Name</Label>
                      <Input
                        value={customDbFieldName}
                        onChange={(e) => setCustomDbFieldName(e.target.value)}
                        placeholder="e.g., Website, Rating, etc."
                        className="h-8"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="customDbFieldRequired"
                        checked={customDbFieldRequired}
                        onChange={(e) => setCustomDbFieldRequired(e.target.checked)}
                        className="rounded border-border"
                      />
                      <Label htmlFor="customDbFieldRequired" className="text-sm">
                        Required field
                      </Label>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={addCustomDbField}
                        className="h-8"
                      >
                        Add Field
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowCustomDbFieldForm(false);
                          setCustomDbFieldName('');
                          setCustomDbFieldRequired(false);
                        }}
                        className="h-8"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              <div className="space-y-3">
                {availableFields.map((field) => {
                  const mappedColumn = fieldMappings[field.key];
                  const isCustom = !['category', 'country', 'state', 'city', 'name', 'address', 'phone', 'email'].includes(field.key);
                  
                  return (
                    <div key={field.key} className="border rounded-lg p-3 bg-background">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Label className="font-medium text-sm">
                            {field.label}
                            {field.required && <span className="text-destructive ml-1">*</span>}
                          </Label>
                          {isCustom && (
                            <Badge variant="outline" className="text-xs">Custom</Badge>
                          )}
                        </div>
                        {isCustom && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCustomField(field.key)}
                            className="text-destructive hover:text-destructive h-6 w-6 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      
                      <Select
                        value={mappedColumn || 'none'}
                        onValueChange={(value) => setFieldMappings(prev => ({ 
                          ...prev, 
                          [field.key]: value === 'none' ? '' : value 
                        }))}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select file column" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">-- No mapping --</SelectItem>
                          {fileHeaders.map((header, idx) => (
                            <SelectItem key={idx} value={header}>
                              <div className="flex items-center gap-2">
                                {header}
                                {Object.values(fieldMappings).includes(header) && 
                                 fieldMappings[field.key] !== header && (
                                  <Badge variant="secondary" className="text-xs ml-2">Used</Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {mappedColumn && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-primary">
                          <CheckCircle className="w-3 h-3" />
                          Mapped to: {mappedColumn}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Mapping Summary */}
          <Separator className="my-6" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span>{Object.keys(fieldMappings).filter(k => fieldMappings[k]).length} fields mapped</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                <span>{fileHeaders.length - Object.values(fieldMappings).filter(v => v).length} columns unmapped</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Auto-map common fields
                  const newMappings = { ...fieldMappings };
                  fileHeaders.forEach(header => {
                    const lowerHeader = header.toLowerCase();
                    if (lowerHeader.includes('country') && !newMappings.country) newMappings.country = header;
                    if (lowerHeader.includes('state') && !newMappings.state) newMappings.state = header;
                    if (lowerHeader.includes('city') && !newMappings.city) newMappings.city = header;
                    if (lowerHeader.includes('name') && !newMappings.name) newMappings.name = header;
                    if (lowerHeader.includes('address') && !newMappings.address) newMappings.address = header;
                    if (lowerHeader.includes('phone') && !newMappings.phone) newMappings.phone = header;
                    if (lowerHeader.includes('email') && !newMappings.email) newMappings.email = header;
                  });
                  setFieldMappings(newMappings);
                  toast({
                    title: "Auto-mapping applied",
                    description: "Common fields have been automatically mapped based on column names."
                  });
                }}
              >
                Auto-Map Common Fields
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFieldMappings({});
                  toast({
                    title: "Mappings cleared",
                    description: "All field mappings have been reset."
                  });
                }}
              >
                Clear All
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Upload New Dataset</h2>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragOver
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="w-8 h-8 lg:w-12 lg:h-12 mx-auto mb-3 lg:mb-4 text-muted-foreground" />
            <h3 className="text-base lg:text-lg font-medium text-card-foreground mb-2">
              Drag & drop files here
            </h3>
            <p className="text-muted-foreground mb-3 lg:mb-4 text-sm lg:text-base">
              Support for CSV and Excel files
            </p>

            <input
              type="file"
              multiple
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <Button asChild variant="outline" className="h-9 lg:h-10 text-sm lg:text-base">
              <label htmlFor="file-upload" className="cursor-pointer">
                <FileText className="w-4 h-4 mr-2" />
                Choose Files
              </label>
            </Button>
          </div>
        </Card>

        <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Dataset Information</h2>
        <div className="space-y-4">
          <div>
            <RequiredLabel>Category</RequiredLabel>
            <Input
              type="text"
              value={newDataset.category}
              onChange={(e) => handleInputChange("category", e.target.value)}
              placeholder="Hotel"
            />
            {errors.category && <p className="text-destructive text-sm">{errors.category}</p>}
          </div>

          {/* Price (Required) */}
          <div>
            <RequiredLabel>Price per Record (₹)</RequiredLabel>
            <Input
              type="number"
              value={newDataset.price}
              onChange={(e) => handleInputChange("price", e.target.value)}
              placeholder="0.5"
            />
            {errors.price && <p className="text-destructive text-sm">{errors.price}</p>}
          </div>

          {/* Description (Required) */}
          <div>
            <RequiredLabel>Description</RequiredLabel>
            <Textarea
              value={newDataset.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Brief description..."
            />
            {errors.description && <p className="text-destructive text-sm">{errors.description}</p>}
          </div>

          {/* Proof (Optional) */}
          <div>
            <Label>Proof Attachment (Optional)</Label>
            <input
              type="file"
              onChange={(e) => handleInputChange("proofAttachment", e.target.files?.[0] || null)}
              className="mt-1 block w-full text-sm file:mr-3 file:py-1 file:px-3
                file:rounded-md file:border-0 file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
          </div>

          <Button onClick={handleCreateDataset} className="w-full" disabled={isLoading}>
           {isLoading ? "Uploading..." : "Create Dataset"}
          </Button>
        </div>
      </Card>
      </div>

      <Card className="p-4 lg:p-6">
        <h2 className="text-lg lg:text-xl font-semibold text-card-foreground mb-4">Uploaded Files</h2>

        {uploadedFiles.length === 0 ? (
          <div className="text-center py-6 lg:py-8">
            <FileText className="w-8 h-8 lg:w-12 lg:h-12 mx-auto mb-3 lg:mb-4 text-muted-foreground" />
            <p className="text-muted-foreground text-sm lg:text-base">No files uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="border border-border rounded-lg p-3 lg:p-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-4 h-4 lg:w-5 lg:h-5 text-primary flex-shrink-0" />
                      <span className="font-medium text-card-foreground text-sm lg:text-base">{file.name}</span>
                      {getStatusBadge(file.status)}
                    </div>
                    <div className="text-xs lg:text-sm text-muted-foreground flex flex-wrap gap-2 lg:gap-4">
                      <span>Size: {file.size}</span>
                      <span>Uploaded: {file.uploadDate}</span>
                      {file.status === 'completed' && (
                        <span>Records: {file.records.toLocaleString()}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 lg:gap-2 mt-2 lg:mt-0">
                    {file.status === 'completed' && (
                      <>
                        <Button variant="outline" size="sm" className="h-8 w-8 lg:h-9 lg:w-auto lg:px-3">
                          <Eye className="w-3 h-3 lg:w-4 lg:h-4" />
                          <span className="hidden lg:inline ml-1">View</span>
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 w-8 lg:h-9 lg:w-auto lg:px-3">
                          <Download className="w-3 h-3 lg:w-4 lg:h-4" />
                          <span className="hidden lg:inline ml-1">Download</span>
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteFile(file.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 lg:h-9 lg:w-auto lg:px-3"
                    >
                      <Trash2 className="w-3 h-3 lg:w-4 lg:h-4" />
                      <span className="hidden lg:inline ml-1">Delete</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}








// import { useEffect, useState } from "react";
// import { Card } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator";
// import { Upload, FileText, CheckCircle, X, Download, Eye, Trash2 } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";
// import { uploadData } from "@/api/apiHub";
// import { Country, State, City } from 'country-state-city';
// import * as XLSX from "xlsx";
// import {createCategory,createCountry,createCity,createState} from '../../api/apiHub'
// interface UploadedFile {
//   id: string;
//   name: string;
//   size: string;
//   uploadDate: string;
//   status: 'processing' | 'completed' | 'failed';
//   records: number;
// }



// export default function AdminUploads() {
//   const { toast } = useToast();
//   const [isDragOver, setIsDragOver] = useState(false);
//   const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([
//     {
//       id: '1',
//       name: 'restaurants_usa.csv',
//       size: '2.5 MB',
//       uploadDate: '2024-01-15',
//       status: 'completed',
//       records: 15420
//     },
//     {
//       id: '2',
//       name: 'hotels_uk.xlsx',
//       size: '1.8 MB',
//       uploadDate: '2024-01-14',
//       status: 'processing',
//       records: 8930
//     },
  
//   ]);
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);
//   const [fileHeaders, setFileHeaders] = useState<string[]>([]);
//   const [fieldMappings, setFieldMappings] = useState<{ [key: string]: string }>({});
//   const [showMapping, setShowMapping] = useState(false);
//   const [availableFields, setAvailableFields] = useState([
//     // { key: 'category', label: 'Category', required: true },
//     { key: 'country', label: 'Country', required: true },
//     { key: 'state', label: 'State', required: false },
//     { key: 'city', label: 'City', required: false },
    
//     { key: 'name', label: 'Name', required: false },
//     { key: 'address', label: 'Address', required: false },
//     { key: 'phone', label: 'Phone', required: false },
//     { key: 'email', label: 'Email', required: false },
//   ]);
 

//   const [newDataset, setNewDataset] = useState({
   
//    category:'',
//     description: '',
//     price: '',
//     proofAttachment: null,
//   });
//  const [errors, setErrors] = useState<{ [key: string]: string }>({});

//   const handleDragOver = (e: React.DragEvent) => {
//     e.preventDefault();
//     setIsDragOver(true);
//   };

//   const handleDragLeave = (e: React.DragEvent) => {
//     e.preventDefault();
//     setIsDragOver(false);
//   };

//   const handleDrop = (e: React.DragEvent) => {
//     e.preventDefault();
//     setIsDragOver(false);

//     const files = Array.from(e.dataTransfer.files);
//     handleFileUpload(files);
//   };

//   const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files[0]) {
//       const file = e.target.files[0];
//       setSelectedFile(file);
//       readFileHeaders(file);
//       handleFileUpload([file]);
//     }
//   };


  

// const readFileHeaders = (file: File) => {
//   const reader = new FileReader();

//   reader.onload = (e) => {
//     const data = e.target?.result;

//     if (!data) return;

//     if (file.name.endsWith(".csv")) {
//       // CSV case
//       const text = data as string;
//       const lines = text.split("\n");
//       const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
//       setFileHeaders(headers);
//       setShowMapping(true);

//     } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
//       // Excel case
//       const workbook = XLSX.read(data, { type: "binary" });
//       const sheetName = workbook.SheetNames[0]; // first sheet
//       const sheet = workbook.Sheets[sheetName];

//       // Convert sheet to JSON with header row
//       const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
//       const headers = (jsonData[0] as string[]).map((h) => h.trim());

//       setFileHeaders(headers);
//       setShowMapping(true);
//     }
//   };

//   if (file.name.endsWith(".csv")) {
//     reader.readAsText(file);
//   } else {
//     reader.readAsBinaryString(file); // for excel
//   }
// };
  


//   const handleFileUpload = (files: File[]) => {
//     files.forEach((file) => {
//       if (file.type === 'text/csv' || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
//         const newFile: UploadedFile = {
//           id: Math.random().toString(36).substr(2, 9),
//           name: file.name,
//           size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
//           uploadDate: new Date().toISOString().split('T')[0],
//           status: 'processing',
//           records: Math.floor(Math.random() * 50000) + 1000
//         };



//         setUploadedFiles(prev => [...prev, newFile]);



//         // Simulate processing
//         setTimeout(() => {
//           setUploadedFiles(prev =>
//             prev.map(f => f.id === newFile.id ? { ...f, status: 'completed' as const } : f)
//           );
//         }, 3000);

//         toast({
//           title: "File uploaded successfully",
//           description: `${file.name} is being processed.`,
//         });
//       } else {
//         toast({
//           title: "Invalid file type",
//           description: "Please upload CSV or Excel files only.",
//           variant: "destructive",
//         });
//       }
//     });
//   };

//   const handleDeleteFile = (id: string) => {
//     setUploadedFiles(prev => prev.filter(f => f.id !== id));
//     toast({
//       title: "File deleted",
//       description: "Dataset has been removed successfully.",
//     });
//   };


//   const addCustomField = () => {
//   const fieldName = prompt("Enter field name"); // user se input lo
//   if (!fieldName) return;

//   const key = fieldName.toLowerCase().replace(/\s+/g, "_"); // spaces ko _ me convert
//   const newField = {
//     key,
//     label: fieldName,
//     required: false
//   };

//   setAvailableFields(prev => [...prev, newField]);
// };


// const removeCustomField = (fieldKey: string) => {
//   setAvailableFields(prev => prev.filter(f => f.key !== fieldKey));
//   setFieldMappings(prev => {
//     const newMappings = { ...prev };
//     delete newMappings[fieldKey];
//     return newMappings;
//   });
// };
//  const [isLoading, setIsLoading] = useState(false);


//   const handleInputChange = (field: string, value: string | File | null) => {
//     setNewDataset(prev => ({ ...prev, [field]: value }));
//   };


//   const handleCreateDataset = async () => {
//     if (!selectedFile) {
//       toast({
//         title: "No file selected",
//         description: "Please upload a CSV or Excel file before creating dataset.",
//         variant: "destructive",
//       });
//       return;
//     }

//     // Check if mapping is complete for required fields
//     const requiredMappings = ['country','name','address',"phone","email"];
//     const missingMappings = requiredMappings.filter(field => !fieldMappings[field]);
    
//     if (missingMappings.length > 0) {
//       toast({
//         title: "Incomplete field mapping",
//         description: `Please map the following required fields: ${missingMappings.join(', ')}`,
//         variant: "destructive",
//       });
//       return;
//     }

//      if (!newDataset.description || !newDataset.price) {
//     toast({
//       title: "Missing required fields",
//       description: "Category, Country, Description and Price are required.",
//       variant: "destructive",
//     });
//     return;
//   }


//   const data = new FormData();
//   data.append("category", newDataset.category); 
 
 
//   data.append("description", newDataset.description); 
//   data.append("price", newDataset.price);             
//   data.append("file", selectedFile);
  
//   // Add field mappings to the form data
//   data.append("fieldMappings", JSON.stringify(fieldMappings));
                 
//      if (newDataset.proofAttachment) {
//     data.append("proofAttachment", newDataset.proofAttachment); 
//   }

//     try {
//        setIsLoading(true);
//       const res = await uploadData(data);
//       toast({
//         title: "Dataset created",
//         description: "New dataset has been added to the system.",
//       });
//       setNewDataset({

//       category:"",
      
//         description: '',
//         price: '',
//         proofAttachment:null,
//       });
//       setSelectedFile(null);
//       setFileHeaders([]);
//       setFieldMappings({});
//       setShowMapping(false);
//     } catch (err) {
//       toast({
//         title: "Error",
//         description: "Failed to upload dataset.",
//         variant: "destructive",
//       });
//     }finally {
//       setIsLoading(false); 
//     }
//   };

//    const RequiredLabel = ({ children }: { children: string }) => (
//     <Label className="font-medium">
//       {children} <span className="text-red-500">*</span>
//     </Label>
//   );

//   const getStatusBadge = (status: string) => {
//     switch (status) {
//       case 'completed':
//         return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
//       case 'processing':
//         return <Badge className="bg-yellow-100 text-yellow-800">Processing</Badge>;
//       case 'failed':
//         return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
//       default:
//         return <Badge variant="secondary">{status}</Badge>;
//     }
//   };

//   return (
//     <div className="space-y-6">
//       <div>
//         <h1 className="text-3xl font-bold text-foreground">File Uploads</h1>
//         <p className="text-muted-foreground">Upload and manage dataset files</p>
//       </div>

//       {/* Enhanced Field Mapping Section */}
//       {showMapping && fileHeaders.length > 0 && (
//         <Card className="p-6">
//           <h2 className="text-xl font-semibold mb-4">Map File Columns to Database Fields</h2>
//           <p className="text-muted-foreground mb-6">
//             Connect your CSV columns to our database fields. Required fields must be mapped before creating the dataset.
//           </p>
          
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//             {/* Left Side - File Columns */}
//             <div className="space-y-4">
//               <h3 className="text-lg font-medium flex items-center gap-2">
//                 <FileText className="w-5 h-5" />
//                 File Columns ({fileHeaders.length})
//               </h3>
//               <div className="border rounded-lg p-4 bg-muted/30">
//                 <div className="space-y-2">
//                   {fileHeaders.map((header, idx) => {
//                     const isMapped = Object.values(fieldMappings).includes(header);
//                     const isCustomField = availableFields.find(f => 
//                       f.key === header.toLowerCase().replace(/\s+/g, '_')
//                     );
                    
//                     return (
//                       <div key={idx} className={`flex items-center justify-between p-2 rounded border ${
//                         isMapped ? 'bg-green-50 border-green-200' : 'bg-background border-border'
//                       }`}>
//                         <div className="flex items-center gap-2">
//                           <div className={`w-2 h-2 rounded-full ${
//                             isMapped ? 'bg-green-500' : 'bg-gray-300'
//                           }`} />
//                           <span className="text-sm font-medium">{header}</span>
//                         </div>
//                         <div className="flex items-center gap-2">
//                           {isMapped && (
//                             <Badge variant="secondary" className="text-xs">
//                               Mapped
//                             </Badge>
//                           )}
//                           {/* {!isMapped && !isCustomField && (
//                             <Button
//                               variant="outline"
//                               size="sm"
//                               onClick={() => addCustomField(header)}
//                               className="h-6 text-xs px-2"
//                             >
//                               Add Field
//                             </Button>
//                           )} */}
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>
//             </div>

//             {/* Right Side - System Fields */}
//             <div className="space-y-4">
              
//               <h3 className="text-lg font-medium flex items-center gap-2">
//                 <CheckCircle className="w-5 h-5" />
//                 Database Fields ({availableFields.length})
//               </h3>
//               <div className="space-y-3">
//                 {availableFields.map((field) => {
//                   const mappedColumn = fieldMappings[field.key];
//                   const isCustom = !['category', 'country', 'state', 'city', 'name', 'address', 'phone', 'email'].includes(field.key);
                  
//                   return (
                    
//                     <div key={field.key} className="border rounded-lg p-3 bg-background">
//                       <div className="flex items-center justify-between mb-2">
//                         <div className="flex items-center gap-2">
                             
//                           <Label className="font-medium text-sm">
//                             {field.label}
//                             {field.required && <span className="text-red-500 ml-1">*</span>}
//                           </Label>
                       


//                           {isCustom && (
//                             <Badge variant="outline" className="text-xs">Custom</Badge>
//                           )}
//                         </div>
//                         {isCustom && (
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             onClick={() => removeCustomField(field.key)}
//                             className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
//                           >
//                             <X className="w-3 h-3" />
//                           </Button>
//                         )}
//                       </div>
                      
//                       <Select
//                         value={mappedColumn || 'none'}
//                         onValueChange={(value) => setFieldMappings(prev => ({ 
//                           ...prev, 
//                           [field.key]: value === 'none' ? '' : value 
//                         }))}
//                       >
//                         <SelectTrigger className="h-8">
//                           <SelectValue placeholder="Select file column" />
//                         </SelectTrigger>
//                         <SelectContent>
//                           <SelectItem value="none">-- No mapping --</SelectItem>
//                           {fileHeaders.map((header, idx) => (
//                             <SelectItem key={idx} value={header}>
//                               <div className="flex items-center gap-2">
//                                 {header}
//                                 {Object.values(fieldMappings).includes(header) && 
//                                  fieldMappings[field.key] !== header && (
//                                   <Badge variant="secondary" className="text-xs ml-2">Used</Badge>
//                                 )}
//                               </div>
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>
                      
//                       {mappedColumn && (
//                         <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
//                           <CheckCircle className="w-3 h-3" />
//                           Mapped to: {mappedColumn}
//                         </div>
//                       )}
//                     </div>
//                   );
//                 })}
//               </div>
//               <div className="flex justify-end mb-3">
//   <Button variant="outline" size="sm" onClick={addCustomField}>
//     + Add Custom Field
//   </Button>
// </div>

//             </div>
            
//           </div>

//           {/* Mapping Summary */}
//           <Separator className="my-6" />
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-4 text-sm">
//               <div className="flex items-center gap-2">
//                 <div className="w-2 h-2 rounded-full bg-green-500" />
//                 <span>{Object.keys(fieldMappings).filter(k => fieldMappings[k]).length} fields mapped</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <div className="w-2 h-2 rounded-full bg-gray-300" />
//                 <span>{fileHeaders.length - Object.values(fieldMappings).filter(v => v).length} columns unmapped</span>
//               </div>
//             </div>
            
//             <div className="flex items-center gap-2">
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => {
//                   // Auto-map common fields
//                   const newMappings = { ...fieldMappings };
//                   fileHeaders.forEach(header => {
//                     const lowerHeader = header.toLowerCase();
//                     // if (lowerHeader.includes('category') && !newMappings.category) newMappings.category = header;
//                     if (lowerHeader.includes('country') && !newMappings.country) newMappings.country = header;
//                     if (lowerHeader.includes('state') && !newMappings.state) newMappings.state = header;
//                     if (lowerHeader.includes('city') && !newMappings.city) newMappings.city = header;
                  
//                     if (lowerHeader.includes('name') && !newMappings.name) newMappings.name = header;
//                     if (lowerHeader.includes('address') && !newMappings.address) newMappings.address = header;
//                     if (lowerHeader.includes('phone') && !newMappings.phone) newMappings.phone = header;
//                     if (lowerHeader.includes('email') && !newMappings.email) newMappings.email = header;
//                   });
//                   setFieldMappings(newMappings);
//                   toast({
//                     title: "Auto-mapping applied",
//                     description: "Common fields have been automatically mapped based on column names."
//                   });
//                 }}
//               >
//                 Auto-Map Common Fields
//               </Button>
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => {
//                   setFieldMappings({});
//                   toast({
//                     title: "Mappings cleared",
//                     description: "All field mappings have been reset."
//                   });
//                 }}
//               >
//                 Clear All
//               </Button>
//             </div>
//           </div>
//         </Card>
//       )}


      

//       <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
//         <Card className="p-6">
//           <h2 className="text-xl font-semibold mb-4">Upload New Dataset</h2>
//           <div
//             className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragOver
//               ? 'border-primary bg-primary/5'
//               : 'border-muted-foreground/25 hover:border-primary/50'
//               }`}
//             onDragOver={handleDragOver}
//             onDragLeave={handleDragLeave}
//             onDrop={handleDrop}

//           >
//             <Upload className="w-8 h-8 lg:w-12 lg:h-12 mx-auto mb-3 lg:mb-4 text-muted-foreground" />
//             <h3 className="text-base lg:text-lg font-medium text-card-foreground mb-2">
//               Drag & drop files here
//             </h3>
//             <p className="text-muted-foreground mb-3 lg:mb-4 text-sm lg:text-base">
//               Support for CSV and Excel files
//             </p>

//             <input
//               type="file"
//               multiple
//               accept=".csv,.xlsx,.xls"
//               onChange={handleFileSelect}
//               className="hidden"
//               id="file-upload"
//             />
//             <Button asChild variant="outline" className="h-9 lg:h-10 text-sm lg:text-base">
//               <label htmlFor="file-upload" className="cursor-pointer">
//                 <FileText className="w-4 h-4 mr-2" />
//                 Choose Files
//               </label>
//             </Button>
//           </div>
//         </Card>


//         <Card className="p-6">
//         <h2 className="text-xl font-semibold mb-4">Dataset Information</h2>
//         <div className="space-y-4">


//                 <div>
//             <RequiredLabel>Category</RequiredLabel>

//               <Input
//               type="text"
//               value={newDataset.category}
//               onChange={(e) => handleInputChange("category", e.target.value)}
//               placeholder="Hotel"
//             />
          
//             {errors.category && <p className="text-red-500 text-sm">{errors.category}</p>}
//           </div>


//           {/* Price (Required) */}
//           <div>
//             <RequiredLabel>Price per Record ($)</RequiredLabel>
//             <Input
//               type="number"
//               value={newDataset.price}
//               onChange={(e) => handleInputChange("price", e.target.value)}
//               placeholder="0.05"
//             />
//             {errors.price && <p className="text-red-500 text-sm">{errors.price}</p>}
//           </div>

//           {/* Description (Required) */}
//           <div>
//             <RequiredLabel>Description</RequiredLabel>
//             <Textarea
//               value={newDataset.description}
//               onChange={(e) => handleInputChange("description", e.target.value)}
//               placeholder="Brief description..."
//             />
//             {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
//           </div>

       

//           {/* Proof (Optional) */}
//           <div>
//             <Label>Proof Attachment (Optional)</Label>
//             <input
//               type="file"
//               onChange={(e) => handleInputChange("proofAttachment", e.target.files?.[0] || null)}
//               className="mt-1 block w-full text-sm file:mr-3 file:py-1 file:px-3
//                 file:rounded-md file:border-0 file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
//             />
//           </div>

//           <Button onClick={handleCreateDataset} className="w-full"  disabled={isLoading}>
//            {isLoading ? "Uploading..." : "Create Dataset"}
//             {/* Create Dataset */}
//           </Button>
//         </div>
//       </Card>
//       </div>

//       <Card className="p-4 lg:p-6">
//         <h2 className="text-lg lg:text-xl font-semibold text-card-foreground mb-4">Uploaded Files</h2>

//         {uploadedFiles.length === 0 ? (
//           <div className="text-center py-6 lg:py-8">
//             <FileText className="w-8 h-8 lg:w-12 lg:h-12 mx-auto mb-3 lg:mb-4 text-muted-foreground" />
//             <p className="text-muted-foreground text-sm lg:text-base">No files uploaded yet</p>
//           </div>
//         ) : (
//           <div className="space-y-4">
//             {uploadedFiles.map((file) => (
//               <div key={file.id} className="border border-border rounded-lg p-3 lg:p-4">
//                 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
//                   <div className="flex-1">
//                     <div className="flex items-center gap-3 mb-2">
//                       <FileText className="w-4 h-4 lg:w-5 lg:h-5 text-primary flex-shrink-0" />
//                       <span className="font-medium text-card-foreground text-sm lg:text-base">{file.name}</span>
//                       {getStatusBadge(file.status)}
//                     </div>
//                     <div className="text-xs lg:text-sm text-muted-foreground flex flex-wrap gap-2 lg:gap-4">
//                       <span>Size: {file.size}</span>
//                       <span>Uploaded: {file.uploadDate}</span>
//                       {file.status === 'completed' && (
//                         <span>Records: {file.records.toLocaleString()}</span>
//                       )}
//                     </div>
//                   </div>

//                   <div className="flex items-center gap-1 lg:gap-2 mt-2 lg:mt-0">
//                     {file.status === 'completed' && (
//                       <>
//                         <Button variant="outline" size="sm" className="h-8 w-8 lg:h-9 lg:w-auto lg:px-3">
//                           <Eye className="w-3 h-3 lg:w-4 lg:h-4" />
//                           <span className="hidden lg:inline ml-1">View</span>
//                         </Button>
//                         <Button variant="outline" size="sm" className="h-8 w-8 lg:h-9 lg:w-auto lg:px-3">
//                           <Download className="w-3 h-3 lg:w-4 lg:h-4" />
//                           <span className="hidden lg:inline ml-1">Download</span>
//                         </Button>
//                       </>
//                     )}
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       onClick={() => handleDeleteFile(file.id)}
//                       className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 lg:h-9 lg:w-auto lg:px-3"
//                     >
//                       <Trash2 className="w-3 h-3 lg:w-4 lg:h-4" />
//                       <span className="hidden lg:inline ml-1">Delete</span>
//                     </Button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </Card>
//     </div>
//   );
// }






// import { useEffect, useState } from "react";
// import { Card } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator";
// import { Upload, FileText, CheckCircle, X, Download, Eye, Trash2 } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";
// import { uploadData } from "@/api/apiHub";
// import { Country, State, City } from 'country-state-city';
// import * as XLSX from "xlsx";
// import {createCategory,createCountry,createCity,createState} from '../../api/apiHub'
// interface UploadedFile {
//   id: string;
//   name: string;
//   size: string;
//   uploadDate: string;
//   status: 'processing' | 'completed' | 'failed';
//   records: number;
// }



// export default function AdminUploads() {
//   const { toast } = useToast();
//   const [isDragOver, setIsDragOver] = useState(false);
//   const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([
//     {
//       id: '1',
//       name: 'restaurants_usa.csv',
//       size: '2.5 MB',
//       uploadDate: '2024-01-15',
//       status: 'completed',
//       records: 15420
//     },
//     {
//       id: '2',
//       name: 'hotels_uk.xlsx',
//       size: '1.8 MB',
//       uploadDate: '2024-01-14',
//       status: 'processing',
//       records: 8930
//     },
  
//   ]);
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);
//   const [fileHeaders, setFileHeaders] = useState<string[]>([]);
//   const [fieldMappings, setFieldMappings] = useState<{ [key: string]: string }>({});
//   const [showMapping, setShowMapping] = useState(false);
//   const [availableFields, setAvailableFields] = useState([
//     { key: 'category', label: 'Category', required: true },
//     { key: 'country', label: 'Country', required: true },
//     { key: 'state', label: 'State', required: false },
//     { key: 'city', label: 'City', required: false },
    
//     { key: 'name', label: 'Name', required: false },
//     { key: 'address', label: 'Address', required: false },
//     { key: 'phone', label: 'Phone', required: false },
//     { key: 'email', label: 'Email', required: false },
//   ]);
 

//   const [newDataset, setNewDataset] = useState({
   
   
//     description: '',
//     price: '',
//     proofAttachment: null,
//   });
//  const [errors, setErrors] = useState<{ [key: string]: string }>({});

//   const handleDragOver = (e: React.DragEvent) => {
//     e.preventDefault();
//     setIsDragOver(true);
//   };

//   const handleDragLeave = (e: React.DragEvent) => {
//     e.preventDefault();
//     setIsDragOver(false);
//   };

//   const handleDrop = (e: React.DragEvent) => {
//     e.preventDefault();
//     setIsDragOver(false);

//     const files = Array.from(e.dataTransfer.files);
//     handleFileUpload(files);
//   };

//   const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files[0]) {
//       const file = e.target.files[0];
//       setSelectedFile(file);
//       readFileHeaders(file);
//       handleFileUpload([file]);
//     }
//   };


  

// const readFileHeaders = (file: File) => {
//   const reader = new FileReader();

//   reader.onload = (e) => {
//     const data = e.target?.result;

//     if (!data) return;

//     if (file.name.endsWith(".csv")) {
//       // CSV case
//       const text = data as string;
//       const lines = text.split("\n");
//       const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
//       setFileHeaders(headers);
//       setShowMapping(true);

//     } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
//       // Excel case
//       const workbook = XLSX.read(data, { type: "binary" });
//       const sheetName = workbook.SheetNames[0]; // first sheet
//       const sheet = workbook.Sheets[sheetName];

//       // Convert sheet to JSON with header row
//       const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
//       const headers = (jsonData[0] as string[]).map((h) => h.trim());

//       setFileHeaders(headers);
//       setShowMapping(true);
//     }
//   };

//   if (file.name.endsWith(".csv")) {
//     reader.readAsText(file);
//   } else {
//     reader.readAsBinaryString(file); // for excel
//   }
// };
  


//   const handleFileUpload = (files: File[]) => {
//     files.forEach((file) => {
//       if (file.type === 'text/csv' || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
//         const newFile: UploadedFile = {
//           id: Math.random().toString(36).substr(2, 9),
//           name: file.name,
//           size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
//           uploadDate: new Date().toISOString().split('T')[0],
//           status: 'processing',
//           records: Math.floor(Math.random() * 50000) + 1000
//         };



//         setUploadedFiles(prev => [...prev, newFile]);



//         // Simulate processing
//         setTimeout(() => {
//           setUploadedFiles(prev =>
//             prev.map(f => f.id === newFile.id ? { ...f, status: 'completed' as const } : f)
//           );
//         }, 3000);

//         toast({
//           title: "File uploaded successfully",
//           description: `${file.name} is being processed.`,
//         });
//       } else {
//         toast({
//           title: "Invalid file type",
//           description: "Please upload CSV or Excel files only.",
//           variant: "destructive",
//         });
//       }
//     });
//   };

//   const handleDeleteFile = (id: string) => {
//     setUploadedFiles(prev => prev.filter(f => f.id !== id));
//     toast({
//       title: "File deleted",
//       description: "Dataset has been removed successfully.",
//     });
//   };


//   const addCustomField = () => {
//   const fieldName = prompt("Enter field name"); // user se input lo
//   if (!fieldName) return;

//   const key = fieldName.toLowerCase().replace(/\s+/g, "_"); // spaces ko _ me convert
//   const newField = {
//     key,
//     label: fieldName,
//     required: false
//   };

//   setAvailableFields(prev => [...prev, newField]);
// };


// const removeCustomField = (fieldKey: string) => {
//   setAvailableFields(prev => prev.filter(f => f.key !== fieldKey));
//   setFieldMappings(prev => {
//     const newMappings = { ...prev };
//     delete newMappings[fieldKey];
//     return newMappings;
//   });
// };
//  const [isLoading, setIsLoading] = useState(false);


//   const handleInputChange = (field: string, value: string | File | null) => {
//     setNewDataset(prev => ({ ...prev, [field]: value }));
//   };


//   const handleCreateDataset = async () => {
//     if (!selectedFile) {
//       toast({
//         title: "No file selected",
//         description: "Please upload a CSV or Excel file before creating dataset.",
//         variant: "destructive",
//       });
//       return;
//     }

//     // Check if mapping is complete for required fields
//     const requiredMappings = ['category', 'country','name','address',"phone","email"];
//     const missingMappings = requiredMappings.filter(field => !fieldMappings[field]);
    
//     if (missingMappings.length > 0) {
//       toast({
//         title: "Incomplete field mapping",
//         description: `Please map the following required fields: ${missingMappings.join(', ')}`,
//         variant: "destructive",
//       });
//       return;
//     }

//      if (!newDataset.description || !newDataset.price) {
//     toast({
//       title: "Missing required fields",
//       description: "Category, Country, Description and Price are required.",
//       variant: "destructive",
//     });
//     return;
//   }


//   const data = new FormData();
 
 
//   data.append("description", newDataset.description); 
//   data.append("price", newDataset.price);             
//   data.append("file", selectedFile);
  
//   // Add field mappings to the form data
//   data.append("fieldMappings", JSON.stringify(fieldMappings));
                 
//      if (newDataset.proofAttachment) {
//     data.append("proofAttachment", newDataset.proofAttachment); 
//   }

//     try {
//        setIsLoading(true);
//       const res = await uploadData(data);
//       toast({
//         title: "Dataset created",
//         description: "New dataset has been added to the system.",
//       });
//       setNewDataset({
      
      
//         description: '',
//         price: '',
//         proofAttachment:null,
//       });
//       setSelectedFile(null);
//       setFileHeaders([]);
//       setFieldMappings({});
//       setShowMapping(false);
//     } catch (err) {
//       toast({
//         title: "Error",
//         description: "Failed to upload dataset.",
//         variant: "destructive",
//       });
//     }finally {
//       setIsLoading(false); 
//     }
//   };

//    const RequiredLabel = ({ children }: { children: string }) => (
//     <Label className="font-medium">
//       {children} <span className="text-red-500">*</span>
//     </Label>
//   );

//   const getStatusBadge = (status: string) => {
//     switch (status) {
//       case 'completed':
//         return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
//       case 'processing':
//         return <Badge className="bg-yellow-100 text-yellow-800">Processing</Badge>;
//       case 'failed':
//         return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
//       default:
//         return <Badge variant="secondary">{status}</Badge>;
//     }
//   };

//   return (
//     <div className="space-y-6">
//       <div>
//         <h1 className="text-3xl font-bold text-foreground">File Uploads</h1>
//         <p className="text-muted-foreground">Upload and manage dataset files</p>
//       </div>

//       {/* Enhanced Field Mapping Section */}
//       {showMapping && fileHeaders.length > 0 && (
//         <Card className="p-6">
//           <h2 className="text-xl font-semibold mb-4">Map File Columns to Database Fields</h2>
//           <p className="text-muted-foreground mb-6">
//             Connect your CSV columns to our database fields. Required fields must be mapped before creating the dataset.
//           </p>
          
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//             {/* Left Side - File Columns */}
//             <div className="space-y-4">
//               <h3 className="text-lg font-medium flex items-center gap-2">
//                 <FileText className="w-5 h-5" />
//                 File Columns ({fileHeaders.length})
//               </h3>
//               <div className="border rounded-lg p-4 bg-muted/30">
//                 <div className="space-y-2">
//                   {fileHeaders.map((header, idx) => {
//                     const isMapped = Object.values(fieldMappings).includes(header);
//                     const isCustomField = availableFields.find(f => 
//                       f.key === header.toLowerCase().replace(/\s+/g, '_')
//                     );
                    
//                     return (
//                       <div key={idx} className={`flex items-center justify-between p-2 rounded border ${
//                         isMapped ? 'bg-green-50 border-green-200' : 'bg-background border-border'
//                       }`}>
//                         <div className="flex items-center gap-2">
//                           <div className={`w-2 h-2 rounded-full ${
//                             isMapped ? 'bg-green-500' : 'bg-gray-300'
//                           }`} />
//                           <span className="text-sm font-medium">{header}</span>
//                         </div>
//                         <div className="flex items-center gap-2">
//                           {isMapped && (
//                             <Badge variant="secondary" className="text-xs">
//                               Mapped
//                             </Badge>
//                           )}
//                           {/* {!isMapped && !isCustomField && (
//                             <Button
//                               variant="outline"
//                               size="sm"
//                               onClick={() => addCustomField(header)}
//                               className="h-6 text-xs px-2"
//                             >
//                               Add Field
//                             </Button>
//                           )} */}
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>
//             </div>

//             {/* Right Side - System Fields */}
//             <div className="space-y-4">
              
//               <h3 className="text-lg font-medium flex items-center gap-2">
//                 <CheckCircle className="w-5 h-5" />
//                 Database Fields ({availableFields.length})
//               </h3>
//               <div className="space-y-3">
//                 {availableFields.map((field) => {
//                   const mappedColumn = fieldMappings[field.key];
//                   const isCustom = !['category', 'country', 'state', 'city', 'name', 'address', 'phone', 'email'].includes(field.key);
                  
//                   return (
//                     <div key={field.key} className="border rounded-lg p-3 bg-background">
//                       <div className="flex items-center justify-between mb-2">
//                         <div className="flex items-center gap-2">
//                           <Label className="font-medium text-sm">
//                             {field.label}
//                             {field.required && <span className="text-red-500 ml-1">*</span>}
//                           </Label>


//                           {isCustom && (
//                             <Badge variant="outline" className="text-xs">Custom</Badge>
//                           )}
//                         </div>
//                         {isCustom && (
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             onClick={() => removeCustomField(field.key)}
//                             className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
//                           >
//                             <X className="w-3 h-3" />
//                           </Button>
//                         )}
//                       </div>
                      
//                       <Select
//                         value={mappedColumn || 'none'}
//                         onValueChange={(value) => setFieldMappings(prev => ({ 
//                           ...prev, 
//                           [field.key]: value === 'none' ? '' : value 
//                         }))}
//                       >
//                         <SelectTrigger className="h-8">
//                           <SelectValue placeholder="Select file column" />
//                         </SelectTrigger>
//                         <SelectContent>
//                           <SelectItem value="none">-- No mapping --</SelectItem>
//                           {fileHeaders.map((header, idx) => (
//                             <SelectItem key={idx} value={header}>
//                               <div className="flex items-center gap-2">
//                                 {header}
//                                 {Object.values(fieldMappings).includes(header) && 
//                                  fieldMappings[field.key] !== header && (
//                                   <Badge variant="secondary" className="text-xs ml-2">Used</Badge>
//                                 )}
//                               </div>
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>
                      
//                       {mappedColumn && (
//                         <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
//                           <CheckCircle className="w-3 h-3" />
//                           Mapped to: {mappedColumn}
//                         </div>
//                       )}
//                     </div>
//                   );
//                 })}
//               </div>
//               <div className="flex justify-end mb-3">
//   <Button variant="outline" size="sm" onClick={addCustomField}>
//     + Add Custom Field
//   </Button>
// </div>

//             </div>
            
//           </div>

//           {/* Mapping Summary */}
//           <Separator className="my-6" />
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-4 text-sm">
//               <div className="flex items-center gap-2">
//                 <div className="w-2 h-2 rounded-full bg-green-500" />
//                 <span>{Object.keys(fieldMappings).filter(k => fieldMappings[k]).length} fields mapped</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <div className="w-2 h-2 rounded-full bg-gray-300" />
//                 <span>{fileHeaders.length - Object.values(fieldMappings).filter(v => v).length} columns unmapped</span>
//               </div>
//             </div>
            
//             <div className="flex items-center gap-2">
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => {
//                   // Auto-map common fields
//                   const newMappings = { ...fieldMappings };
//                   fileHeaders.forEach(header => {
//                     const lowerHeader = header.toLowerCase();
//                     if (lowerHeader.includes('category') && !newMappings.category) newMappings.category = header;
//                     if (lowerHeader.includes('country') && !newMappings.country) newMappings.country = header;
//                     if (lowerHeader.includes('state') && !newMappings.state) newMappings.state = header;
//                     if (lowerHeader.includes('city') && !newMappings.city) newMappings.city = header;
                  
//                     if (lowerHeader.includes('name') && !newMappings.name) newMappings.name = header;
//                     if (lowerHeader.includes('address') && !newMappings.address) newMappings.address = header;
//                     if (lowerHeader.includes('phone') && !newMappings.phone) newMappings.phone = header;
//                     if (lowerHeader.includes('email') && !newMappings.email) newMappings.email = header;
//                   });
//                   setFieldMappings(newMappings);
//                   toast({
//                     title: "Auto-mapping applied",
//                     description: "Common fields have been automatically mapped based on column names."
//                   });
//                 }}
//               >
//                 Auto-Map Common Fields
//               </Button>
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => {
//                   setFieldMappings({});
//                   toast({
//                     title: "Mappings cleared",
//                     description: "All field mappings have been reset."
//                   });
//                 }}
//               >
//                 Clear All
//               </Button>
//             </div>
//           </div>
//         </Card>
//       )}

//       <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
//         <Card className="p-6">
//           <h2 className="text-xl font-semibold mb-4">Upload New Dataset</h2>
//           <div
//             className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragOver
//               ? 'border-primary bg-primary/5'
//               : 'border-muted-foreground/25 hover:border-primary/50'
//               }`}
//             onDragOver={handleDragOver}
//             onDragLeave={handleDragLeave}
//             onDrop={handleDrop}

//           >
//             <Upload className="w-8 h-8 lg:w-12 lg:h-12 mx-auto mb-3 lg:mb-4 text-muted-foreground" />
//             <h3 className="text-base lg:text-lg font-medium text-card-foreground mb-2">
//               Drag & drop files here
//             </h3>
//             <p className="text-muted-foreground mb-3 lg:mb-4 text-sm lg:text-base">
//               Support for CSV and Excel files
//             </p>

//             <input
//               type="file"
//               multiple
//               accept=".csv,.xlsx,.xls"
//               onChange={handleFileSelect}
//               className="hidden"
//               id="file-upload"
//             />
//             <Button asChild variant="outline" className="h-9 lg:h-10 text-sm lg:text-base">
//               <label htmlFor="file-upload" className="cursor-pointer">
//                 <FileText className="w-4 h-4 mr-2" />
//                 Choose Files
//               </label>
//             </Button>
//           </div>
//         </Card>


//         <Card className="p-6">
//         <h2 className="text-xl font-semibold mb-4">Dataset Information</h2>
//         <div className="space-y-4">

// {/*        
//            <div className="grid grid-cols-2 gap-4">


//           <div>
//             <RequiredLabel>Category</RequiredLabel>
//             <Select value={newDataset.category} onValueChange={(val) => handleInputChange("category", val)}>
//               <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
//               <SelectContent>
//                    <SelectItem value="civil-engineer">Civil Engineer </SelectItem>
//                 <SelectItem value="restaurants">Restaurants</SelectItem>
//                 <SelectItem value="hotels">Hotels</SelectItem>
//                 <SelectItem value="retail-stores">Retail Stores</SelectItem>
//                 <SelectItem value="healthcare">Healthcare</SelectItem>
//                 <SelectItem value="bus-stops">Transportation</SelectItem>
//               </SelectContent>
//             </Select>
//             {errors.category && <p className="text-red-500 text-sm">{errors.category}</p>}
//           </div>


//           <div>
//             <RequiredLabel>Country</RequiredLabel>
//             <Select value={newDataset.country} onValueChange={handleCountryChange}>
//               <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
//               <SelectContent>
//                {countries.map((country) => (
//                       <SelectItem key={country.isoCode} value={country.isoCode}>
//                         {country.name}
//                       </SelectItem>
//                     ))}
//               </SelectContent>
//             </Select>
//             {errors.country && <p className="text-red-500 text-sm">{errors.country}</p>}
//           </div>
//          </div>
       
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <Label>State (Optional)</Label>
             
//                <Select
//                   value={newDataset.state}
//                   onValueChange={handleStateChange}
//                   disabled={!newDataset.country}
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select state" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {states.map((state) => (
//                       <SelectItem key={state.isoCode} value={state.isoCode}>
//                         {state.name}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//             </div>
//             <div>
//               <Label>City (Optional)</Label>
              
//               <Select
//                 value={newDataset.city}
//                   onValueChange={handleCityChange}
//                   disabled={!newDataset.state}
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select city" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {cities.map((city) => (
//                       <SelectItem key={city.name} value={city.name}>
//                         {city.name}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//             </div>
//           </div> */}

//           {/* Price (Required) */}
//           <div>
//             <RequiredLabel>Price per Record ($)</RequiredLabel>
//             <Input
//               type="number"
//               value={newDataset.price}
//               onChange={(e) => handleInputChange("price", e.target.value)}
//               placeholder="0.05"
//             />
//             {errors.price && <p className="text-red-500 text-sm">{errors.price}</p>}
//           </div>

//           {/* Description (Required) */}
//           <div>
//             <RequiredLabel>Description</RequiredLabel>
//             <Textarea
//               value={newDataset.description}
//               onChange={(e) => handleInputChange("description", e.target.value)}
//               placeholder="Brief description..."
//             />
//             {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
//           </div>

       

//           {/* Proof (Optional) */}
//           <div>
//             <Label>Proof Attachment (Optional)</Label>
//             <input
//               type="file"
//               onChange={(e) => handleInputChange("proofAttachment", e.target.files?.[0] || null)}
//               className="mt-1 block w-full text-sm file:mr-3 file:py-1 file:px-3
//                 file:rounded-md file:border-0 file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
//             />
//           </div>

//           <Button onClick={handleCreateDataset} className="w-full"  disabled={isLoading}>
//            {isLoading ? "Uploading..." : "Create Dataset"}
//             {/* Create Dataset */}
//           </Button>
//         </div>
//       </Card>
//       </div>

//       <Card className="p-4 lg:p-6">
//         <h2 className="text-lg lg:text-xl font-semibold text-card-foreground mb-4">Uploaded Files</h2>

//         {uploadedFiles.length === 0 ? (
//           <div className="text-center py-6 lg:py-8">
//             <FileText className="w-8 h-8 lg:w-12 lg:h-12 mx-auto mb-3 lg:mb-4 text-muted-foreground" />
//             <p className="text-muted-foreground text-sm lg:text-base">No files uploaded yet</p>
//           </div>
//         ) : (
//           <div className="space-y-4">
//             {uploadedFiles.map((file) => (
//               <div key={file.id} className="border border-border rounded-lg p-3 lg:p-4">
//                 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
//                   <div className="flex-1">
//                     <div className="flex items-center gap-3 mb-2">
//                       <FileText className="w-4 h-4 lg:w-5 lg:h-5 text-primary flex-shrink-0" />
//                       <span className="font-medium text-card-foreground text-sm lg:text-base">{file.name}</span>
//                       {getStatusBadge(file.status)}
//                     </div>
//                     <div className="text-xs lg:text-sm text-muted-foreground flex flex-wrap gap-2 lg:gap-4">
//                       <span>Size: {file.size}</span>
//                       <span>Uploaded: {file.uploadDate}</span>
//                       {file.status === 'completed' && (
//                         <span>Records: {file.records.toLocaleString()}</span>
//                       )}
//                     </div>
//                   </div>

//                   <div className="flex items-center gap-1 lg:gap-2 mt-2 lg:mt-0">
//                     {file.status === 'completed' && (
//                       <>
//                         <Button variant="outline" size="sm" className="h-8 w-8 lg:h-9 lg:w-auto lg:px-3">
//                           <Eye className="w-3 h-3 lg:w-4 lg:h-4" />
//                           <span className="hidden lg:inline ml-1">View</span>
//                         </Button>
//                         <Button variant="outline" size="sm" className="h-8 w-8 lg:h-9 lg:w-auto lg:px-3">
//                           <Download className="w-3 h-3 lg:w-4 lg:h-4" />
//                           <span className="hidden lg:inline ml-1">Download</span>
//                         </Button>
//                       </>
//                     )}
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       onClick={() => handleDeleteFile(file.id)}
//                       className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 lg:h-9 lg:w-auto lg:px-3"
//                     >
//                       <Trash2 className="w-3 h-3 lg:w-4 lg:h-4" />
//                       <span className="hidden lg:inline ml-1">Delete</span>
//                     </Button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </Card>
//     </div>
//   );
// }




