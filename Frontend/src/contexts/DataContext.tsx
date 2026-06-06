import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from "react";
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
  [key: string]: unknown;
};


export type SampleItem = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  [key: string]: unknown;
};


export type Dataset = {
  id: number;
  dataset_ids?: number[];
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
  isDatasetsLoading: boolean;
  datasetsError: string | null;
  // datasetRecords: DatasetRecord[];
  fetchCountries: () => Promise<void>;
  fetchStates: (country:string ) => Promise<void>;
  fetchCities: ( state:string) => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchDatasets: (filters: { category?: string; country?: string; state?: string; city?: string }) => Promise<void>;
  // fetchDatasetRecords: (id: string) => Promise<void>;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isDatasetsLoading, setIsDatasetsLoading] = useState(false);
  const [datasetsError, setDatasetsError] = useState<string | null>(null);
  // const [datasetRecords, setDatasetRecords] = useState<DatasetRecord[]>([]);

  //  Fetch Countries
  const fetchCountries = useCallback(async () => {
    try {
      const data = await getCountries();
      setCountries(data.countries);
    } catch (error) {
      console.error("Error fetching countries:", error);
    }
  }, []);

  //  Fetch States
  const fetchStates = useCallback(async (country: string) => {
    try {
      const data = await getStates(country);
      setStates(data.states);
    } catch (error) {
      console.error("Error fetching states:", error);
    }
  }, []);

  //  Fetch Cities
  const fetchCities = useCallback(async (state: string) => {
    try {
      const data = await getCities(state);
      setCities(data.cities);
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  }, []);

  //  Fetch Categories
  const fetchCategories = useCallback(async () => {
    try {
      const data = await getCategories();
      setCategories(data.categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, []);

  const fetchDatasets = useCallback(
    async (filters: { category?: string; country?: string; state?: string; city?: string }) => {
      try {
        setIsDatasetsLoading(true);
        setDatasetsError(null);
        const data = await getDatasetsSummary(filters);

        if (!data || !data.lists) {
          console.warn("No datasets found.");
          setDatasets([]);
          return;
        }

        const mappedDatasets: Dataset[] = data.lists.map((list: Record<string, unknown>, index: number) => ({
          id: Number(list.primary_dataset_id) || index + 1,
          dataset_ids: Array.isArray(list.dataset_ids)
            ? list.dataset_ids.map((value: unknown) => Number(value as string | number))
            : [],
          name: list.name || `Dataset ${index + 1}`,
          category: list.category || "Unknown",
          category_id: list.category_id,
          country: list.country || "Unknown",
          country_id: list.country_id,
          state: list.state_name || undefined,
          state_id: list.state_id || undefined,
          city: list.city_name || undefined,
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
        setDatasetsError("Failed to load datasets. Retrying or refreshing will usually fix this.");
      } finally {
        setIsDatasetsLoading(false);
      }
    },
    [],
  );

  const value = useMemo(
    () => ({
      countries,
      states,
      cities,
      categories,
      datasets,
      isDatasetsLoading,
      datasetsError,
      fetchCountries,
      fetchStates,
      fetchCities,
      fetchCategories,
      fetchDatasets,
    }),
    [
      countries,
      states,
      cities,
      categories,
      datasets,
      isDatasetsLoading,
      datasetsError,
      fetchCountries,
      fetchStates,
      fetchCities,
      fetchCategories,
      fetchDatasets,
    ],
  );

  return (
    <DataContext.Provider value={value}>{children}</DataContext.Provider>
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
