import { useState } from "react";
import Button from "../components/Button";
import { searchMedicine, Medicine } from "../api/medapi";
import { MedicineResults } from "../components/MedicineResults";
import { HiShoppingCart } from "react-icons/hi";
import React from "react";

interface User {
  username: string;
  role: string;
}

interface MedicinesProps {
  setActiveTab: (tab: string) => void; // Pass from Dashboard
}

export default function Medicines({ setActiveTab }: MedicinesProps) {
  const user: User = JSON.parse(localStorage.getItem("user") || "{}");

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Medicine[]>([]);
  const [location, setLocation] = useState<string>("");

  const handleSearch = async () => {
    if (!search.trim()) return;
    const data = await searchMedicine(search);
    setResults(data);
  };

  const handleBuy = (med: Medicine) => {
    localStorage.setItem("transaction", JSON.stringify(med));
    setActiveTab("cart"); // Switch to Cart tab instead of navigating
  };

  const addToCart = (med: Medicine) => {
    localStorage.setItem("transaction", JSON.stringify(med));
    setActiveTab("cart");
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocation("❌ Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
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
      },
      (error) => {
        console.error(error);
        setLocation("⚠️ Unable to retrieve your location");
      }
    );
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-gray-800 to-gray-700 bg-clip-text text-transparent">
          Medicines
        </h1>

        {/* Search Bar + Buttons */}
        <div className="flex gap-3 flex-col sm:flex-row w-full sm:w-auto">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search medicine or pharmacy..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="absolute left-3 top-3 text-gray-400">🔍</span>
          </div>

          <Button
            onClick={handleSearch}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium shadow hover:from-blue-600 hover:to-indigo-600 transition"
          >
            Search
          </Button>

          {user.role === "normal" && (
            <div className="flex gap-3 flex-col sm:flex-row w-full sm:w-auto">
              <Button
                onClick={handleDetectLocation}
                className="px-6 py-3 rounded-xl bg-green-100 text-green-700 hover:bg-green-200 transition"
              >
                Detect Location
              </Button>
              <Button
                onClick={() => setActiveTab("cart")}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-blue-500 text-white font-semibold shadow-lg hover:from-teal-600 hover:to-blue-600 transition transform hover:scale-105"
              >
                <HiShoppingCart className="w-5 h-5" />
                Go to Cart
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Display location */}
      {user.role === "normal" && location && (
        <div className="mb-6 p-4 bg-white shadow rounded-xl flex items-center gap-2 text-gray-700">
          <span className="truncate">{location}</span>
        </div>
      )}

      {/* Results */}
      <MedicineResults
        results={results}
        userRole={user.role}
        handleBuy={handleBuy}
        cart={addToCart}
      />
    </div>
  );
}
