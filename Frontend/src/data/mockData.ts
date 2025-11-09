export interface Dataset {
  id: string;
  name: string;
  totalRecords: number;
  emails: number;
  phones: number;
  category: string;
  country: string;
  state?: string;
  city?:string;
  total_records?:number;
  total_emails?:number;
  total_phones?:number;
  sample_file_path?:string;

}


export interface DatasetRecord {
  id: string;
  name: string;
  
  email: number;
  address?:string;
  phone: number;
  category: string;
  country: string;
  state?: string;
  city?:string;
 review_count?:number;
  review_score?:number;
  url?:string;
}

export const mockDatasets: Dataset[] = [
  {
    id: "1",
    name: "List of Bus stops in United States",
    totalRecords: 359274,
    emails: 1169,
    phones: 616,
    category: "bus-stops",
    country: "united-states",
    state: "california"
  },
  {
    id: "2", 
    name: "List of Bus stops in United Kingdom",
    totalRecords: 56661,
    emails: 116,
    phones: 393,
    category: "bus-stops",
    country: "united-kingdom"
  },
  {
    id: "3",
    name: "List of Bus stops in Canada", 
    totalRecords: 29081,
    emails: 124,
    phones: 70,
    category: "bus-stops",
    country: "canada",
    state: "ontario"
  },
  {
    id: "4",
    name: "List of Bus stops in Australia",
    totalRecords: 24620,
    emails: 45,
    phones: 85,
    category: "bus-stops", 
    country: "australia"
  },
  {
    id: "5",
    name: "List of Restaurants in United States",
    totalRecords: 892456,
    emails: 2847,
    phones: 3921,
    category: "restaurants",
    country: "united-states",
    state: "california"
  },
  {
    id: "6",
    name: "List of Hotels in United Kingdom",
    totalRecords: 67834,
    emails: 1567,
    phones: 2103,
    category: "hotels",
    country: "united-kingdom"
  },
  {
    id: "7",
    name: "List of Retail Stores in Canada",
    totalRecords: 145623,
    emails: 987,
    phones: 1245,
    category: "retail-stores",
    country: "canada",
    state: "ontario"
  },
  {
    id: "8",
    name: "List of Healthcare Facilities in Australia", 
    totalRecords: 89234,
    emails: 734,
    phones: 892,
    category: "healthcare",
    country: "australia"
  },
  {
    id: "9",
    name: "List of Bus stops in India",
    totalRecords: 456789,
    emails: 892,
    phones: 1234,
    category: "bus-stops",
    country: "india",
    state: "uttar-pradesh"
  },
  {
    id: "10",
    name: "List of Restaurants in Germany",
    totalRecords: 234567,
    emails: 1456,
    phones: 1892,
    category: "restaurants", 
    country: "germany"
  }
];