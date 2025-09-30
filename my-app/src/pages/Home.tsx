import { useState } from "react";
import Button from "../components/Button";
import { searchMedicine, Medicine } from "../api/medapi";
import { useNavigate } from "react-router-dom";

interface User {
  username: string;
  role: string;
}

export default function Home() {
  const navigate = useNavigate();
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
    navigate("/transaction");
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
          setLocation(data.display_name || " Location not found");
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
          Welcome, {user.username} 
        </h1>

        {/* Search Bar + Buttons */}
        <div className="flex gap-3 flex-col sm:flex-row w-full sm:w-auto">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder=" Search medicine or pharmacy..."
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
            <Button
              onClick={handleDetectLocation}
              className="px-6 py-3 rounded-xl bg-green-100 text-green-700 hover:bg-green-200 transition"
            >
               Detect Location
            </Button>
          )}
        </div>
      </header>

      {/* Display location */}
      {user.role === "normal" && location && (
        <div className="mb-6 p-4 bg-white shadow rounded-xl flex items-center gap-2 text-gray-700">
          <span className="text-blue-600"></span>
          <span className="truncate">{location}</span>
        </div>
      )}

      {/* Results */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {results.length > 0 ? (
          results.map((med, idx) => (
            <div
              key={idx}
              className="p-6 bg-white rounded-2xl shadow hover:shadow-lg transition transform hover:-translate-y-1 flex flex-col gap-3"
            >
              <h3 className="font-bold text-lg text-gray-800">{med.name}</h3>
              <p className="text-sm text-gray-600"> Pharmacy: {med.pharmacy}</p>
              <span
                className={`px-2 py-1 w-fit rounded-full text-xs font-semibold ${
                  med.stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}
              >
                {med.stock > 0 ? `In Stock: ${med.stock}` : "Out of Stock"}
              </span>
              <p className="text-sm text-gray-500"> {med.contents}</p>

              {user.role === "normal" && med.stock > 0 && (
                <Button
                  onClick={() => handleBuy(med)}
                  className="mt-auto px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow hover:from-blue-600 hover:to-indigo-600 transform hover:scale-[1.02] transition"
                >
                  Buy Now 
                </Button>
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-500 col-span-full text-center text-lg">
            Use the search box to find medicines.
          </p>
        )}
      </div>
    </div>
  );
}
