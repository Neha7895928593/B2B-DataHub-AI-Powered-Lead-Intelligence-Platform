// src/api/apiHub.ts
import api from "./api";

/// Admin
export const uploadData = async (formData: FormData) => {
  const res = await api.post("/admin/manage-data/upload-data", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
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




export const createCategory = async (category_name) => {
  const res = await api.post("/categories", { category_name });
  return res.data;
};

export const createCountry = async (country_name) => {
  const res = await api.post("/countries", { country_name });
  return res.data;
};


export const createState = async (state_name, country_id) => {
  const res = await api.post("/states", { state_name, country_id });
  return res.data;
};


export const createCity = async (city_name, state_id) => {
  const res = await api.post("/cities", { city_name, state_id });
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