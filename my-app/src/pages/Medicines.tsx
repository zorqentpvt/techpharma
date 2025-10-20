import { useState, useEffect } from "react";
import { searchMedicine } from "../api/medapir";
import { MedicineResults } from "../components/MedicineResults";
import { HiShoppingCart } from "react-icons/hi";
import { X, Search } from "lucide-react";
import React from "react";
import { getUserRole } from "../api/authapir";

interface User {
  username: string;
  role: string;
}

interface MedicinesProps {
  setActiveTab: (tab: string) => void;
}

export default function Medicines({ setActiveTab }: MedicinesProps) {
  const user: User = JSON.parse(localStorage.getItem("user") || "{}");
 const role=getUserRole()
 console.log(role)
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Medicine[]>([]);
  const [location, setLocation] = useState<string>("");
  const [nearby, setNearby] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [noResults, setNoResults] = useState(false);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCoords({ latitude, longitude });
          reverseGeocode(latitude, longitude);
        },
        (error) => {
          console.error(error);
          setLocation("⚠️ Unable to retrieve your location");
        }
      );
    } else {
      setLocation("❌ Geolocation not supported");
    }
  }, []);

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
      );
      const data = await response.json();
      setLocation(data.display_name || "Location not found");
    } catch (error) {
      console.error(error);
      setLocation("⚠️ Unable to retrieve location name");
    }
  };

  const handleSearch = async () => {
    if (!search.trim()) return;
    setIsSearching(true);
    setNoResults(false);
  
    // ✅ Only send coords if nearby is ON
    const coordsToSend = nearby ? coords : null;
  
    const res = await searchMedicine(search, coordsToSend);
    console.log(res.data)
    const medicines: any[] = Array.isArray(res.data) ? res.data : [];
  console.log(medicines)
    if (medicines.length === 0) setNoResults(true);
  if(nearby){
    console.log("sorting")
    const sorted = sortMedicinesByLocation(medicines, nearby); 
    setResults(sorted);
  }
  else{
    console.log("No sorting")
    setResults(medicines);
  }
    setIsSearching(false);
  };
  
  const handleBuy = (med: Medicine) => {
    localStorage.setItem("transaction", JSON.stringify(med));
    setActiveTab("pay");
  };

  const addToCart = (med: Medicine) => {
    localStorage.setItem("transaction", JSON.stringify(med));
    setActiveTab("cart");
  };

  const sortMedicinesByLocation = (list: Medicine[], nearbyEnabled: boolean) => {
    if (nearbyEnabled && coords) {
      return [...list].sort((a, b) => {
        const distA = getDistance(coords.latitude, coords.longitude, a.pharmacy?.lat || 0, a.pharmacy?.lng || 0);
        const distB = getDistance(coords.latitude, coords.longitude, b.pharmacy?.lat || 0, b.pharmacy?.lng || 0);
        return distA - distB;
      });
    }
    return list;
  };

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
console.log(results)
  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Top Bar */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">💊 Medicines</h1>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative flex items-center w-full sm:w-80">
              <Search className="absolute left-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search medicine or pharmacy..."
                className="w-full pl-10 pr-24 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-16 text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="absolute right-2 bg-blue-600 text-white px-4 py-1.5 rounded-full hover:bg-blue-700 transition text-sm"
              >
                {isSearching ? "..." : "Search"}
              </button>
            </div>

            {/* Small Nearby Toggle */}
            <button
              onClick={() => {
                setNearby(!nearby);
                setResults(sortMedicinesByLocation(results, !nearby));
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium border ${
                nearby ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300"
              } hover:bg-blue-600 hover:text-white transition`}
            >
              {nearby ? "Nearby ON" : "Nearby OFF"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {user.role === "normal" && location && nearby && (
          <div className="mb-6 p-4 bg-white shadow rounded-xl flex items-center gap-2 text-gray-700">
            <span className="truncate">{location}</span>
          </div>
        )}

        {noResults ? (
          <div className="text-center text-gray-500 mt-8 text-lg">⚠️ No results found</div>
        ) : (
          <MedicineResults results={results} userRole={role} handleBuy={handleBuy} cart={addToCart} />
        )}
      </div>

      {user.role === "normal" && (
        <button
          onClick={() => setActiveTab("cart")}
          className="fixed bottom-6 right-6 flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-[#002E6E] text-[#f0f4ff] font-semibold border border-[#002E6E] shadow-lg hover:bg-[#f0f4ff] hover:text-[#002E6E] transition transform hover:scale-105 z-50"
        >
          <HiShoppingCart className="w-5 h-5" />
          Go to Cart
        </button>
      )}
    </div>
  );
}
