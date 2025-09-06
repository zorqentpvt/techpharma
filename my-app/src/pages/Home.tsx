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

  const handleSearch = async () => {
    if (!search.trim()) return;
    const data = await searchMedicine(search);
    setResults(data);
  };

  const handleBuy = (med: Medicine) => {
    localStorage.setItem("transaction", JSON.stringify(med));
    navigate("/transaction");
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
        </div>
      </header>

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
