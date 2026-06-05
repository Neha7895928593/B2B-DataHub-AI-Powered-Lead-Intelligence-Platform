import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter } from "lucide-react";
import { useDataContext } from "@/contexts/DataContext";

interface SearchFiltersProps {
  onFilterChange: (filters: {
    category: string;
    country: string;
    state: string;
    city?: string;
  }) => void;
}

const SearchFilters = ({ onFilterChange }: SearchFiltersProps) => {
  const {
    countries,
    states,
    cities,
    categories,
    fetchCountries,
    fetchCategories,
    fetchStates,
    fetchCities,
  } = useDataContext();

  const [category, setCategory] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");

  // Fetch initial countries & categories
  useEffect(() => {
    fetchCountries();
    fetchCategories();
  }, [fetchCountries, fetchCategories]);

  // Fetch states when country changes
  useEffect(() => {
    setState("");
    setCity("");
    if (country) {
      fetchStates(country); // country = selected country_id as string
    }
  }, [country, fetchStates]);

  // Fetch cities when state changes
  useEffect(() => {
    setCity("");
    if (state) {
      fetchCities(state); // state = selected state_id as string
    }
  }, [state, fetchCities]);

  const handleFilterChange = (type: string, value: string) => {
    const newCategory = type === "category" ? (value === "all" ? "" : value) : category;
    const newCountry = type === "country" ? (value === "all" ? "" : value) : country;
    const newState = type === "state" ? (value === "all" ? "" : value) : state;
    const newCity = type === "city" ? (value === "all" ? "" : value) : city;

    setCategory(newCategory);
    setCountry(newCountry);
    setState(newState);
    setCity(newCity);

    onFilterChange({
      category: newCategory,
      country: newCountry,
      state: newState,
      city: newCity,
    });
  };

  const handleClearFilters = () => {
    setCategory("");
    setCountry("");
    setState("");
    setCity("");
    onFilterChange({ category: "", country: "", state: "", city: "" });
  };

  return (
    <Card className="p-3 lg:p-4 border border-border shadow-sm sticky top-4">
      <div className="flex items-center gap-2 mb-2 lg:mb-3">
        <Filter className="w-3.5 h-3.5 text-primary" />
        <h3 className="font-bold text-card-foreground text-xs lg:text-sm uppercase tracking-wider">
          Market Filters
        </h3>
      </div>

      <div className="space-y-2 lg:space-y-3">
        {/* Category */}
        <Select
          value={category}
          onValueChange={(value) => handleFilterChange("category", value)}
        >
          <SelectTrigger className="w-full h-9 lg:h-10 text-xs lg:text-sm">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.category_id} value={String(cat.category_id)}>
                {cat.category_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Country */}
        <Select
          value={country}
          onValueChange={(value) => handleFilterChange("country", value)}
        >
          <SelectTrigger className="w-full h-9 lg:h-10 text-xs lg:text-sm">
            <SelectValue placeholder="All countries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All countries</SelectItem>
            {countries.map((c) => (
              <SelectItem key={c.country_id} value={String(c.country_id)}>
                {c.country_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* State */}
        <Select
          value={state}
          onValueChange={(value) => handleFilterChange("state", value)}
          disabled={!country}
        >
          <SelectTrigger className="w-full h-9 lg:h-10">
            <SelectValue placeholder="All states" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All states</SelectItem>
            {states.map((s) => (
              <SelectItem key={s.state_id} value={String(s.state_id)}>
                {s.state_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* City */}
        <Select
          value={city}
          onValueChange={(value) => handleFilterChange("city", value)}
          disabled={!state}
        >
          <SelectTrigger className="w-full h-9 lg:h-10">
            <SelectValue placeholder="All cities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cities</SelectItem>
            {cities.map((c) => (
              <SelectItem key={c.city_id} value={String(c.city_id)}>
                {c.city_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        <Button
          variant="outline"
          className="w-full h-9 lg:h-10 text-xs lg:text-sm font-medium hover:bg-muted"
          onClick={handleClearFilters}
        >
          Clear All Filters
        </Button>

        {/* Request Custom Dataset */}
        <Button className="w-full h-9 lg:h-10 bg-primary hover:bg-primary/90 text-primary-foreground text-xs lg:text-sm font-medium">
          Request Custom Dataset
        </Button>
      </div>
    </Card>
  );
};

export default SearchFilters;
//     country: string;
//     state: string;
//     city?: string;
//   }) => void;
// }

// const SearchFilters = ({ onFilterChange }: SearchFiltersProps) => {
//   const {
//     countries,
//     states,
//     cities,
//     categories,
//     fetchCountries,
//     fetchCategories,
//     fetchStates,
//     fetchCities,
//   } = useDataContext();

//   const [category, setCategory] = useState("all-categories");
//   const [country, setCountry] = useState("all-countries");
//   const [state, setState] = useState("all-states");
//   const [city, setCity] = useState("all-cities");

//   // Fetch initial countries & categories
//   useEffect(() => {
//     fetchCountries();
//     fetchCategories();
//   }, []);

//   // Fetch states when country changes
//   useEffect(() => {
//     if (country !== "all-countries") {
//       fetchStates(country);
//     }
//     setState("all-states");
//     setCity("all-cities");
//   }, [country]);

//   // Fetch cities when state changes
//   useEffect(() => {
//     if (country !== "all-countries" && state !== "all-states") {
//       fetchCities(country, state);
//     }
//     setCity("all-cities");
//   }, [state]);

//   const handleFilterChange = (type: string, value: string) => {
//     const filterValue =
//       value === "all-categories" ||
//       value === "all-countries" ||
//       value === "all-states" ||
//       value === "all-cities"
//         ? ""
//         : value;

//     if (type === "category") setCategory(value);
//     if (type === "country") setCountry(value);
//     if (type === "state") setState(value);
//     if (type === "city") setCity(value);

//     onFilterChange({
//       category: type === "category" ? filterValue : category === "all-categories" ? "" : category,
//       country: type === "country" ? filterValue : country === "all-countries" ? "" : country,
//       state: type === "state" ? filterValue : state === "all-states" ? "" : state,
//       city: type === "city" ? filterValue : city === "all-cities" ? "" : city,
//     });
//   };

//   const handleClearFilters = () => {
//     setCategory("all-categories");
//     setCountry("all-countries");
//     setState("all-states");
//     setCity("all-cities");
//     onFilterChange({ category: "", country: "", state: "", city: "" });
//   };

//   return (
//     <Card className="p-4 lg:p-6 border border-border shadow-sm">
//       <div className="flex items-center gap-2 mb-3 lg:mb-4">
//         <Filter className="w-4 h-4 text-primary" />
//         <h3 className="font-medium text-card-foreground text-sm lg:text-base">Filters</h3>
//       </div>

//       <div className="space-y-3 lg:space-y-4">
//         {/* Category Filter */}
//         <div>
//           <div className="text-xs lg:text-sm font-medium text-card-foreground mb-1">Category</div>
//           <Select value={category} onValueChange={(value) => handleFilterChange("category", value)}>
//             <SelectTrigger className="w-full h-9 lg:h-10 text-xs lg:text-sm">
//               <SelectValue placeholder="All categories" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="all-categories">All categories</SelectItem>
//               {categories.map((cat) => (
//                 <SelectItem key={cat} value={cat}>
//                   {cat}
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>
//         </div>

//         {/* Country Filter */}
//         <div>
//           <div className="text-xs lg:text-sm font-medium text-card-foreground mb-1">Country</div>
//           <Select value={country} onValueChange={(value) => handleFilterChange("country", value)}>
//             <SelectTrigger className="w-full h-9 lg:h-10 text-xs lg:text-sm">
//               <SelectValue placeholder="All countries" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="all-countries">All countries</SelectItem>
//               {countries.map((c) => (
//                 <SelectItem key={c} value={c}>
//                   {c}
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>
//         </div>

//         {/* State Filter */}
//         <div>
//           <div className="flex items-center gap-2 mb-2">
//             <span className="text-sm font-medium text-card-foreground">State</span>
//           </div>
//           <Select
//             value={state}
//             onValueChange={(value) => handleFilterChange("state", value)}
//             disabled={country === "all-countries"}
//           >
//             <SelectTrigger className="w-full h-9 lg:h-10">
//               <SelectValue placeholder="All states" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="all-states">All states</SelectItem>
//               {states.map((s) => (
//                 <SelectItem key={s} value={s}>
//                   {s}
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>
//         </div>

//         {/* City Filter */}
//         <div>
//           <div className="text-xs lg:text-sm font-medium text-card-foreground mb-1">City</div>
//           <Select
//             value={city}
//             onValueChange={(value) => handleFilterChange("city", value)}
//             disabled={state === "all-states"}
//           >
//             <SelectTrigger className="w-full h-9 lg:h-10">
//               <SelectValue placeholder="All cities" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="all-cities">All cities</SelectItem>
//               {cities.map((c) => (
//                 <SelectItem key={c} value={c}>
//                   {c}
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>
//         </div>

//         {/* Clear Filters */}
//         <Button
//           variant="outline"
//           className="w-full h-9 lg:h-10 text-xs lg:text-sm font-medium hover:bg-muted"
//           onClick={handleClearFilters}
//         >
//           Clear All Filters
//         </Button>

//         {/* Request Custom Dataset */}
//         <Button className="w-full h-9 lg:h-10 bg-primary hover:bg-primary/90 text-primary-foreground text-xs lg:text-sm font-medium">
//           Request Custom Dataset
//         </Button>
//       </div>
//     </Card>
//   );
// };

// export default SearchFilters;



// import { useState } from "react";
// import { Card } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Filter } from "lucide-react";

// interface SearchFiltersProps {
//   onFilterChange: (filters: {
//     category: string;
//     country: string;
//     state: string;
//   }) => void;
// }

// const SearchFilters = ({ onFilterChange }: SearchFiltersProps) => {
//   const [category, setCategory] = useState("all-categories");
//   const [country, setCountry] = useState("all-countries");
//   const [state, setState] = useState("all-states");

//   const handleFilterChange = (type: string, value: string) => {
//     // Convert placeholder values to empty strings for filtering logic
//     const filterValue = value === "all-categories" || value === "all-countries" || value === "all-states" ? "" : value;   

 

    
//     if (type === "category") {
//       setCategory(value);
//     } else if (type === "country") {
//       setCountry(value);
//       setState("all-states"); // Reset state when country changes
//     } else if (type === "state") {
//       setState(value);
//     }
    
//     onFilterChange({
//       category: type === "category" ? filterValue : (category === "all-categories" ? "" : category),
//       country: type === "country" ? filterValue : (country === "all-countries" ? "" : country),
//       state: type === "state" ? filterValue : (type === "country" ? "" : (state === "all-states" ? "" : state)),
//     });
//   };

//   const handleClearFilters = () => {
//     setCategory("all-categories");
//     setCountry("all-countries");
//     setState("all-states");
//     onFilterChange({ category: "", country: "", state: "" });
//   };

//   return (
//     <Card className="p-4 lg:p-6 border border-border shadow-sm">
//       <div className="flex items-center gap-2 mb-3 lg:mb-4">
//         <Filter className="w-4 h-4 text-primary" />
//         <h3 className="font-medium text-card-foreground text-sm lg:text-base">Filters</h3>
//       </div>

//       <div className="space-y-3 lg:space-y-4">
//         {/* Category Filter */}
//         <div>
//           <div className="text-xs lg:text-sm font-medium text-card-foreground mb-1">Category</div>
//           <Select value={category} onValueChange={(value) => handleFilterChange("category", value)}>
//             <SelectTrigger className="w-full h-9 lg:h-10 text-xs lg:text-sm">
//               <SelectValue placeholder="All categories" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="all-categories">All categories</SelectItem>
//               <SelectItem value="bus-stops">Transportation</SelectItem>
//               <SelectItem value="restaurants">Restaurants</SelectItem>
//               <SelectItem value="hotels">Hotels</SelectItem>
//               <SelectItem value="retail-stores">Retail Stores</SelectItem>
//               <SelectItem value="healthcare">Healthcare</SelectItem>
//             </SelectContent>
//           </Select>
//         </div>

//         {/* Country Filter */}
//         <div>
//           <div className="text-xs lg:text-sm font-medium text-card-foreground mb-1">Country</div>
//           <Select value={country} onValueChange={(value) => handleFilterChange("country", value)}>
//             <SelectTrigger className="w-full h-9 lg:h-10 text-xs lg:text-sm">
//               <SelectValue placeholder="All countries" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="all-countries">All countries</SelectItem>
//               <SelectItem value="united-states">United States</SelectItem>
//               <SelectItem value="united-kingdom">United Kingdom</SelectItem>
//               <SelectItem value="canada">Canada</SelectItem>
//               <SelectItem value="australia">Australia</SelectItem>
//               <SelectItem value="india">India</SelectItem>
//               <SelectItem value="germany">Germany</SelectItem>
//             </SelectContent>
//           </Select>
//         </div>

//         {/* State Filter */}
//         <div>
//           <div className="flex items-center gap-2 mb-2">
//             <span className="text-sm font-medium text-card-foreground">State</span>
//           </div>
//           <Select value={state} onValueChange={(value) => handleFilterChange("state", value)} disabled={country === "all-countries"}>
//             <SelectTrigger className="w-full h-9 lg:h-10">
//               <SelectValue placeholder="Uttar Pradesh" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="all-states">All states</SelectItem>
//               {country === "united-states" && (
//                 <>
//                   <SelectItem value="california">California</SelectItem>
//                   <SelectItem value="texas">Texas</SelectItem>
//                   <SelectItem value="new-york">New York</SelectItem>
//                   <SelectItem value="florida">Florida</SelectItem>
//                 </>
//               )}
//               {country === "india" && (
//                 <>
//                   <SelectItem value="uttar-pradesh">Uttar Pradesh</SelectItem>
//                   <SelectItem value="maharashtra">Maharashtra</SelectItem>
//                   <SelectItem value="karnataka">Karnataka</SelectItem>
//                   <SelectItem value="tamil-nadu">Tamil Nadu</SelectItem>
//                 </>
//               )}
//               {country === "canada" && (
//                 <>
//                   <SelectItem value="ontario">Ontario</SelectItem>
//                   <SelectItem value="quebec">Quebec</SelectItem>
//                   <SelectItem value="british-columbia">British Columbia</SelectItem>
//                 </>
//               )}
//             </SelectContent>
//           </Select>
//           {/* <div className="text-xs text-muted-foreground mt-1">No options</div> */}
//         </div>

//         <div>
//           <div className="text-xs text-muted-foreground mb-2">Select City</div>
//           <Select disabled>
//             <SelectTrigger className="w-full h-9 lg:h-10">
//               <SelectValue placeholder="Select City" />
//             </SelectTrigger>
//           </Select>
//         </div>

//         {/* Clear Filters */}
//         <Button 
//           variant="outline" 
//           className="w-full h-9 lg:h-10 text-xs lg:text-sm font-medium hover:bg-muted"
//           onClick={handleClearFilters}
//         >
//           Clear All Filters
//         </Button>

//         {/* Request Custom Dataset Button */}
//         <Button className="w-full h-9 lg:h-10 bg-primary hover:bg-primary/90 text-primary-foreground text-xs lg:text-sm font-medium">
//           Request Custom Dataset
//         </Button>
//       </div>
//     </Card>
//   );
// };

// export default SearchFilters;
