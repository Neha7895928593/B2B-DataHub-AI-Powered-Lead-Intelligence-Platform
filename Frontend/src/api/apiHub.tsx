// src/api/apiHub.ts
import api from "./api";

export const requestPasswordReset = async (payload: { email: string }) => {
  const res = await api.post("/auth/forgot-password", payload);
  return res.data;
};

export const confirmPasswordReset = async (payload: {
  token: string;
  email: string;
  password: string;
}) => {
  const res = await api.post("/auth/reset-password", payload);
  return res.data;
};

/// Admin
export const uploadData = async (formData: FormData) => {
  const res = await api.post("/admin/manage-data/upload-data", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const analyzeDatasetAI = async (payload: {
  sampleData: Array<Record<string, unknown>>;
  headers: string[];
  categoryName?: string;
}) => {
  const res = await api.post("/ai/analyze-dataset", payload);
  return res.data;
};

export const chatWithAI = async (payload: { message: string }) => {
  const res = await api.post("/ai/chat-with-ai", payload);
  return res.data;
};

/// Dataset Summary
export const getDatasetsSummary = async (filters: { category?: string; country?: string; state?: string }) => {
  const query = new URLSearchParams(filters).toString();
  const res = await api.get(`/datasets?${query}`);
  return res.data;
};

/// Dataset Records
export const getDatasetRecords = async (id: string) => {
  const res = await api.get(`/datasets/${id}/records`);
  return res.data;
};

/// Categories
export const getCategories = async () => {
  const res = await api.get("/categories");
  return res.data;
};

/// Countries
export const getCountries = async () => {
  const res = await api.get("/countries");
  return res.data;
};

/// States
export const getStates = async (country: string) => {
  const res = await api.get(`/states?countryId=${country}`);
  return res.data;
};

/// Cities
export const getCities = async (state: string) => {
  const res = await api.get(`/cities?stateId=${state}`);
  return res.data;
};




export const createCategory = async (category_name: string) => {
  const res = await api.post("/categories", { category_name });
  return res.data;
};

export const createCountry = async (country_name: string) => {
  const res = await api.post("/countries", { country_name });
  return res.data;
};


export const createState = async (state_name: string, country_id: string) => {
  const res = await api.post("/states", { state_name, country_id });
  return res.data;
};


export const createCity = async (city_name: string, state_id: string) => {
  const res = await api.post("/cities", { city_name, state_id });
  return res.data;
};




export const getDatasetSources = async () => {
  const res = await api.get("/datasets/sources");
  return res.data;
};

export const getDatasetSourcePreview = async (id: number) => {
  const res = await api.get(`/datasets/sources/${id}`);
  return res.data;
};


export const deleteDatasetSource = async (id: number) => {
  const res = await api.delete(`/datasets/sources/${id}`);
  return res.data;
};

export const createOrder = async (payload: {
  datasetId?: number;
  datasetName: string;
  totalPrice: number;
  phone?: string;
  company?: string;
  paymentMethod: string;
  datasetContext?: {
    categoryId?: number;
    countryId?: number;
    stateId?: number | null;
    cityId?: number | null;
  };
}) => {
  const res = await api.post("/orders", payload);
  return res.data;
};

export const getMyOrders = async () => {
  const res = await api.get("/me/orders");
  return res.data;
};

export const downloadMyOrder = async (orderId: number) => {
  const res = await api.get(`/me/orders/${orderId}/download`, {
    responseType: "blob",
  });
  return res.data;
};

export const getOrders = async () => {
  const res = await api.get("/admin/orders");
  return res.data;
};

export const getCustomers = async () => {
  const res = await api.get("/admin/customers");
  return res.data;
};

export const getTransactions = async () => {
  const res = await api.get("/admin/transactions");
  return res.data;
};

export const getAnalyticsSummary = async () => {
  const res = await api.get("/admin/analytics");
  return res.data;
};


// export const getDatasetsSummery = async () => {
//   const res = await api.get("/datasets");
//   return res.data;
// };



// export const getDatasetsRecord = async (id) => {
//   const res = await api.get(`/datasets/${id}/records`);
//   return res.data;
// };
