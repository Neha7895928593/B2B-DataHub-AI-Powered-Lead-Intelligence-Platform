import { useEffect, useState } from "react";
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
import { getFilterOptions } from "@/api/apiHub";

interface SearchFiltersProps {
  onFilterChange: (filters: {
    category: string;
    country: string;
    state: string;
    city?: string;
  }) => void;
}

type FilterOption = {
  id: number;
  name: string;
};

const SearchFilters = ({ onFilterChange }: SearchFiltersProps) => {
  const [category, setCategory] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");

  const [availableCategories, setAvailableCategories] = useState<FilterOption[]>([]);
  const [availableCountries, setAvailableCountries] = useState<FilterOption[]>([]);
  const [availableStates, setAvailableStates] = useState<FilterOption[]>([]);
  const [availableCities, setAvailableCities] = useState<FilterOption[]>([]);

  useEffect(() => {
    let active = true;

    const loadOptions = async () => {
      try {
        const data = await getFilterOptions({
          category,
          country,
          state,
          city,
        });

        if (!active) return;

        setAvailableCategories(
          Array.isArray(data?.categories)
            ? data.categories.map((item: { category_id: number; category_name: string }) => ({
                id: Number(item.category_id),
                name: item.category_name,
              }))
            : [],
        );
        setAvailableCountries(
          Array.isArray(data?.countries)
            ? data.countries.map((item: { country_id: number; country_name: string }) => ({
                id: Number(item.country_id),
                name: item.country_name,
              }))
            : [],
        );
        setAvailableStates(
          Array.isArray(data?.states)
            ? data.states.map((item: { state_id: number; state_name: string }) => ({
                id: Number(item.state_id),
                name: item.state_name,
              }))
            : [],
        );
        setAvailableCities(
          Array.isArray(data?.cities)
            ? data.cities.map((item: { city_id: number; city_name: string }) => ({
                id: Number(item.city_id),
                name: item.city_name,
              }))
            : [],
        );
      } catch (error) {
        console.error("Failed to fetch filter options:", error);
      }
    };

    void loadOptions();

    return () => {
      active = false;
    };
  }, [category, country, state, city]);

  const handleFilterChange = (type: string, value: string) => {
    const normalizedValue = value === "all" ? "" : value;
    let newCategory = category;
    let newCountry = country;
    let newState = state;
    let newCity = city;

    if (type === "category") {
      newCategory = normalizedValue;
      newCountry = "";
      newState = "";
      newCity = "";
    } else if (type === "country") {
      newCountry = normalizedValue;
      newState = "";
      newCity = "";
    } else if (type === "state") {
      newState = normalizedValue;
      newCity = "";
    } else if (type === "city") {
      newCity = normalizedValue;
    }

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
        <Select value={category} onValueChange={(value) => handleFilterChange("category", value)}>
          <SelectTrigger className="w-full h-9 lg:h-10 text-xs lg:text-sm">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {availableCategories.map((cat) => (
              <SelectItem key={cat.id} value={String(cat.id)}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={country} onValueChange={(value) => handleFilterChange("country", value)}>
          <SelectTrigger className="w-full h-9 lg:h-10 text-xs lg:text-sm">
            <SelectValue placeholder="All countries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All countries</SelectItem>
            {availableCountries.map((item) => (
              <SelectItem key={item.id} value={String(item.id)}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={state} onValueChange={(value) => handleFilterChange("state", value)}>
          <SelectTrigger className="w-full h-9 lg:h-10 text-xs lg:text-sm">
            <SelectValue placeholder="All states" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All states</SelectItem>
            {availableStates.map((item) => (
              <SelectItem key={item.id} value={String(item.id)}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={city} onValueChange={(value) => handleFilterChange("city", value)}>
          <SelectTrigger className="w-full h-9 lg:h-10 text-xs lg:text-sm">
            <SelectValue placeholder="All cities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cities</SelectItem>
            {availableCities.map((item) => (
              <SelectItem key={item.id} value={String(item.id)}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          className="w-full h-9 lg:h-10 text-xs lg:text-sm font-medium hover:bg-muted"
          onClick={handleClearFilters}
        >
          Clear All Filters
        </Button>

        <Button className="w-full h-9 lg:h-10 bg-primary hover:bg-primary/90 text-primary-foreground text-xs lg:text-sm font-medium">
          Request Custom Dataset
        </Button>
      </div>
    </Card>
  );
};

export default SearchFilters;
