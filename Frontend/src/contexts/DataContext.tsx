
import React, { createContext, useContext, useState, ReactNode } from "react";
import {
  getCategories,
  getCities,
  getCountries,
  getStates,
  getDatasetsSummary,
  getDatasetRecords,
} from "@/api/apiHub";

export type RecordItem = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  [key: string]: any; 
};


export type SampleItem = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  [key: string]: any; 
};


export type Dataset = {
  id: number;
  name: string;
  category: string;
  category_id: number;
  country: string;
  country_id: number;
  state?: string;
  state_id?: number;
  city?: string;
  city_id?: number;
  total_records: number;
  total_emails: number;
  total_phones: number;
  sample_file_Data?: SampleItem[];
  total_price?: number;
  filtered_total_price?: number;
  filtered_total_records?: number;
  filtered_email_count?: number;
  filtered_phone_count?: number;
  view_record?:RecordItem[];
};



export type Category = {
 category_id?: string,
  category_name?:string
};


export type Country = {
 country_id?: string,
  country_name?:string
};

export type State = {
 state_id?: string,
  state_name?:string
};

export type City = {
 city_id?: string,
  city_name?:string
};

type DataContextType = {
  countries: Country[];
  states:State[];
  cities: City[];
  categories: Category[];
  datasets: Dataset[];
  // datasetRecords: DatasetRecord[];
  fetchCountries: () => Promise<void>;
  fetchStates: (country:string ) => Promise<void>;
  fetchCities: ( state:string) => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchDatasets: (filters: { category?: string; country?: string; state?: string }) => Promise<void>;
  // fetchDatasetRecords: (id: string) => Promise<void>;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  // const [datasetRecords, setDatasetRecords] = useState<DatasetRecord[]>([]);

  //  Fetch Countries
  const fetchCountries = async () => {
    try {
      const data = await getCountries();
      setCountries(data.countries);
    } catch (error) {
      console.error("Error fetching countries:", error);
    }
  };

  //  Fetch States
  const fetchStates = async (country: string) => {
    try {
      const data = await getStates(country);
      console.log(data)
      setStates(data.states);
    } catch (error) {
      console.error("Error fetching states:", error);
    }
  };

  //  Fetch Cities
  const fetchCities = async ( state: string) => {
    try {
      const data = await getCities(state);
      setCities(data.cities);
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  };

  //  Fetch Categories
  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data.categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  //  Fetch Datasets

  //  Fetch Datasets
const fetchDatasets = async (filters: { category?: string; country?: string; state?: string; city?: string }) => {
  try {
    const data = await getDatasetsSummary(filters);

    if (!data || !data.lists) {
      console.warn("No datasets found.");
      setDatasets([]);
      return;
    }

    const mappedDatasets: Dataset[] = data.lists.map((list: any, index: number) => ({
      id: index + 1,
      name: list.name || `Dataset ${index + 1}`,
      category: list.category || "Unknown",
      category_id: list.category_id,
      country: list.country || "Unknown",
      country_id: list.country_id,
      state: list.state || undefined,
      state_id: list.state_id || undefined,
      city: list.city || undefined,
      city_id: list.city_id || undefined,
      total_records: Number(list.total_records) || 0,
      total_emails: Number(list.email_count) || 0,
      total_phones: Number(list.phone_count) || 0,
      sample_file_Data: Array.isArray(list.samples) ? list.samples : [],
      filtered_total_price: Number(list.total_price) || 0,
      filtered_total_records: Number(list.total_records) || 0,
      filtered_email_count: Number(list.email_count) || 0,
      filtered_phone_count: Number(list.phone_count) || 0,
      view_record: Array.isArray(list.view) ? list.view : [],
      
    }));

    setDatasets(mappedDatasets);

  } catch (error) {
    console.error("Error fetching datasets:", error);
    setDatasets([]);
  }
};



// const fetchDatasets = async (filters: { category?: string; country?: string; state?: string; city?: string }) => {
//   try {
//     const data = await getDatasetsSummary(filters);
//    const mappedDatasets: Dataset[] = data.lists.map((list: any, index: number) => ({
//   id: index + 1,
//   name: list.name,
//   category: list.category,
//   category_id: list.category_id,
//   country: list.country,
//   country_id: list.country_id,
//   state: list.state,
//   state_id: list.state_id,
//   city: list.city,
//   city_id: list.city_id,
//   total_records: data.summary.totalRecords,
//   total_emails: data.summary.emailCount,
//   total_phones: data.summary.phoneCount,
//   sample_file_Data: list.sample,
//   filtered_total_price: list.total_price,
//   filtered_total_records: list.total_records,
//   filtered_email_count: list.email_count,
//   filtered_phone_count: list.phone_count,
//   view_record:list.view

// }));


//     setDatasets(mappedDatasets);  
//   } catch (error) {
//     console.error("Error fetching datasets:", error);
//   }
// };




//  const fetchDatasets = async (filters: { category?: string; country?: string; state?: string }) => {
//   try {
//     const data = await getDatasetsSummary(filters);
//     const dataset = data.filteredData;

//     const mappedDatasets: Dataset[] = data.lists.map((list: any, index: number) => {
      

//       return {
//         id: index + 1,
//         name: list.name,
//         // category: list.category,
//         // country: list.country,
//         // state: list.state,
//         // city: list.city,
//         total_records: data.summary.totalRecords,
//         total_emails: data.summary.emailCount,
//         total_phones: data.summary.phoneCount,
//         sample_file_path: list.samples[index],
//         filtered_total_price:list.total_price,
//          filtered_total_records:list.total_records,
//           filtered_email_count:list.email_count,
//           filtered_phone_count:list.phone_count,
//       };
//     });

//     setDatasets(mappedDatasets);  
//   } catch (error) {
//     console.error("Error fetching datasets:", error);
//   }
// };


  //  Fetch Dataset Records
  
  
  // const fetchDatasetRecords = async (id: string) => {
  //   try {
  //     const data = await getDatasetRecords(id);
  //     setDatasetRecords(data);
  //   } catch (error) {
  //     console.error("Error fetching dataset records:", error);
  //   }
  // };

  return (
    <DataContext.Provider
      value={{
        countries,
        states,
        cities,
        categories,
        datasets,

        fetchCountries,
        fetchStates,
        fetchCities,
        fetchCategories,
        fetchDatasets,
        
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

// Custom Hook
export const useDataContext = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useDataContext must be used within a DataProvider");
  }
  return context;
};
