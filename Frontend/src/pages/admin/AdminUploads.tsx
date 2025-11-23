
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";
;

import {
  getCategories,
  createCategory,
  uploadData,
  getDatasetSources,
  deleteDatasetSource
} from '@/api/apiHub';

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Upload, FileText, X, Eye, Trash2, Plus, Loader2 } from "lucide-react";


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

const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
  <Label className="font-medium">
    {children} <span className="text-destructive">*</span>
  </Label>
);

export default function AdminUploads() {
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingFiles, setIsFetchingFiles] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [fieldMappings, setFieldMappings] = useState<{ [key: string]: string }>({});
  const [showMapping, setShowMapping] = useState(false);
  const [newDataset, setNewDataset] = useState({
    category: '',
    description: '',
    price: '',
    proofAttachment: null as File | null,
  });
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");


  const databaseFields = [
    { key: 'name', label: 'Lead Name', required: true },
    { key: 'email', label: 'Email', required: true },
    { key: 'phone', label: 'Phone', required: true },
    { key: 'country', label: 'Country', required: true },
    { key: 'state', label: 'State', required: false },
    { key: 'city', label: 'City', required: false },
    { key: 'address', label: 'Address', required: false },
    { key: 'price', label: 'Price (per lead)', required: false },
  ];

  // --- Data Fetching ---
  const fetchInitialData = async () => {
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
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const resetForm = () => {
    setNewDataset({ category: "", description: '', price: '', proofAttachment: null });
    setSelectedFile(null);
    setFileHeaders([]);
    setFieldMappings({});
    setShowMapping(false);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      const file = files[0];
      if (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
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
            setFileHeaders(headers);
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
    if (!selectedFile || !newDataset.category || !newDataset.description || !newDataset.price) {
      return toast({ title: "Missing Information", description: "Please fill all required fields and select a file.", variant: "destructive" });
    }
    const missingMappings = databaseFields.filter(f => f.required && !fieldMappings[f.key]);
    if (missingMappings.length > 0) {
      return toast({ title: "Incomplete Mapping", description: `Map required fields: ${missingMappings.map(f => f.label).join(', ')}`, variant: "destructive" });
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("category", newDataset.category);
    formData.append("description", newDataset.description);
    formData.append("price", newDataset.price);
    formData.append("fieldMappings", JSON.stringify(fieldMappings));
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
    } catch (error: any) {
      toast({ title: "Upload Failed", description: error.response?.data?.message || "An error occurred.", variant: "destructive" });
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

  // --- Render ---
  return (
    <div className="space-y-6">
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

      <div>
        <h1 className="text-3xl font-bold">B2B Lead Import</h1>
        <p className="text-muted-foreground">Upload, map, and process lead data files.</p>
      </div>

      <div className={`grid gap-6 ${showMapping ? 'grid-cols-1 lg:grid-cols-2 items-start' : 'grid-cols-1'}`}>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">1. Upload Lead File</h2>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleFileSelect(e.dataTransfer.files); }}
            >
              <Upload className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Drag & Drop File Here</h3>
              <p className="text-muted-foreground mb-4">Supports .csv, .xlsx, .xls</p>
              <input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => handleFileSelect(e.target.files)} className="hidden" id="file-upload" />
              <Button asChild variant="outline"><label htmlFor="file-upload" className="cursor-pointer"><FileText className="w-4 h-4 mr-2" />Or Choose File</label></Button>
            </div>
            {selectedFile && (
              <div className="mt-4 p-3 border rounded-lg bg-muted/50 flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden"><FileText className="w-5 h-5 text-primary flex-shrink-0" /><p className="font-medium text-sm truncate">{selectedFile.name}</p></div>
                <Button variant="ghost" size="sm" onClick={resetForm} className="text-destructive hover:text-destructive h-7 w-7 p-0"><X className="w-4 h-4" /></Button>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">2. Dataset Information</h2>
            <div className="space-y-4">
              <div>
                <RequiredLabel>Lead Category</RequiredLabel>
                <div className="flex gap-2">
                  <Select value={newDataset.category} onValueChange={(value) => setNewDataset(p => ({ ...p, category: value }))}>
                    <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                    <SelectContent>{categories.map(c => <SelectItem key={c.category_id} value={c.category_name}>{c.category_name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={() => setIsCategoryDialogOpen(true)}><Plus className="w-4 h-4" /></Button>
                </div>
              </div>
              <div>
                <RequiredLabel>Default Price per Lead (₹)</RequiredLabel>
                <Input
                  type="number"
                  value={newDataset.price}
                  min="0" 
                  onKeyDown={(e) => {
                  
                    if (e.key === '-' || e.key === '+' || e.key === 'e') {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const value = e.target.value;
                   
                    if (value === '' || (parseFloat(value) >= 0 && !isNaN(parseFloat(value)))) {
                      setNewDataset(p => ({ ...p, price: value }));
                    }
                  }}
                  placeholder="e.g., 0.5"
                />
              </div>

              <div><RequiredLabel>Description</RequiredLabel><Textarea value={newDataset.description} onChange={(e) => setNewDataset(p => ({ ...p, description: e.target.value }))} placeholder="e.g., List of restaurants in the USA" /></div>
              <div><Label>Proof of Source (Optional)</Label><Input type="file" onChange={(e) => setNewDataset(p => ({ ...p, proofAttachment: e.target.files ? e.target.files[0] : null }))} className="mt-1 block w-full text-sm file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-primary/10 file:text-primary hover:file:bg-primary/20" /></div>
            </div>
          </Card>
        </div>

        {showMapping && (
          <Card className="p-6 h-fit sticky top-6">
            <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-semibold">3. Map Data Fields</h2><Button variant="outline" size="sm">Auto-Map</Button></div>
            <p className="text-muted-foreground mb-6">Match columns from your file to the database fields.</p>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">{databaseFields.map((field) => (
              <div key={field.key}>
                {field.required ? <RequiredLabel>{field.label}</RequiredLabel> : <Label>{field.label}</Label>}
                <Select value={fieldMappings[field.key] || ''} onValueChange={(value) => setFieldMappings(p => ({ ...p, [field.key]: value }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="-- Select a column --" /></SelectTrigger>
                  <SelectContent>{fileHeaders.map((h, i) => <SelectItem key={i} value={h}>{h}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            ))}</div>
          </Card>
        )}
      </div>

      {showMapping && (
        <div className="flex justify-end pt-4 border-t">
          <Button size="lg" onClick={handleCreateDataset} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Processing File..." : "Validate & Create Dataset"}
          </Button>
        </div>
      )}

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Previously Uploaded Datasets</h2>
        {isFetchingFiles ? <p className="text-muted-foreground">Loading files...</p> :
          uploadedFiles.length === 0 ? <p className="text-muted-foreground text-center py-4">No datasets have been uploaded yet.</p> :
            <div className="space-y-3">{uploadedFiles.map((file) => (
              <div key={file.source_id} className="border rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{file.source_name}</p>
                  <p className="text-sm text-muted-foreground">{file.description} - Uploaded on {new Date(file.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon"><Eye className="w-4 h-4" /></Button>
                  <Button variant="outline" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteFile(file.source_id, file.source_name)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}</div>
        }
      </Card>
    </div>
  );
}