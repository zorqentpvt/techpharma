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
      setLocation("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
        );
        const data = await response.json();
        setLocation(data.display_name || "Location not found");
      } catch (error) {
        console.error(error);
        setLocation("Unable to retrieve location name");
      }
    }, (error) => {
      console.error(error);
      setLocation("Unable to retrieve your location");
    });
  };

  return (
    <div>
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold mb-4 sm:mb-0">
          Welcome, {user.username} 111🎯
        </h1>

        <div className="flex gap-4 flex-col sm:flex-row w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search medicine or pharmacy..."
            className="border p-2 rounded flex-1"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button onClick={handleSearch}>Search 🔍</Button>

          {user.role === "normal" && (
            <Button onClick={handleDetectLocation}>Detect Location 📍</Button>
          )}
        </div>
      </header>

      {/* Display location */}
      {user.role === "normal" && location && (
        <p className="mb-4 text-gray-700">Your location: {location}</p>
      )}

      {/* Results */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {results.length > 0 ? (
          results.map((med, idx) => (
            <div
              key={idx}
              className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition flex flex-col gap-2"
            >
              <h3 className="font-semibold text-lg">{med.name}</h3>
              <p>Pharmacy: {med.pharmacy}</p>
              <p>Stock: {med.stock}</p>
              <p>Contents: {med.contents}</p>

              {user.role === "normal" && (
                <Button onClick={() => handleBuy(med)}>Buy 💊</Button>
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-500 col-span-full">
            Use the search box to find medicines.
          </p>
        )}
      </div>
    </div>
  );
}
