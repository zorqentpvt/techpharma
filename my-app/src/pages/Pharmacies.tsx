import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getActivePharmacies } from "../api/medapir";
import { Search, Store, MapPin } from "lucide-react";

// Define Pharmacy type based on backend entity and other frontend files
interface Pharmacy {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  phoneNumber: string;
  email: string;
  category: 'private_standard' | 'private_approved' | 'government' | 'jan_aushadhi' | string;
  isFreeMedicineEnabled: boolean;
  user: {
    avatar?: string;
  };
  latitude?: number;
  longitude?: number;
  distance?: number;
}

const BASE_URL = "http://localhost:8080";

const resolveImageUrl = (img: string | undefined | null): string => {
  if (!img) return "https://cdn-icons-png.flaticon.com/512/822/822139.png"; // Default pharmacy icon
  if (img.startsWith("data:") || img.startsWith("http")) return img;
  return `${BASE_URL}/${img.replace(/^\/?/, "")}`;
};

const categoryColors = {
  private_standard: { bg: 'bg-blue-100', text: 'text-blue-800' },
  private_approved: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  government: { bg: 'bg-green-100', text: 'text-green-800' },
  jan_aushadhi: { bg: 'bg-orange-100', text: 'text-orange-800' },
  default: { bg: 'bg-gray-100', text: 'text-gray-800' },
};

function PharmacyCard({ pharmacy }: { pharmacy: Pharmacy }) {
  const navigate = useNavigate();
  const categoryStyle = categoryColors[pharmacy.category as keyof typeof categoryColors] || categoryColors.default;

  return (
    <div 
      className="bg-white rounded-2xl shadow-sm hover:shadow-lg border border-gray-100 transition-all transform hover:-translate-y-1 p-5 flex flex-col cursor-pointer"
      onClick={() => navigate(`/dashboard/pharmacies/${pharmacy.id}`)}
    >
      <div className="flex items-start gap-4">
        <img
          src={resolveImageUrl(pharmacy.user?.avatar)}
          alt={pharmacy.name}
          className="w-16 h-16 rounded-lg object-cover border"
        />
        <div className="flex-1">
          <h2 className="text-lg font-bold text-gray-800">{pharmacy.name}</h2>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
            <MapPin size={14} />
            <span>{pharmacy.city}, {pharmacy.state}</span>
          </div>
          {pharmacy.distance !== undefined && pharmacy.distance !== null ? (
            <p className="text-xs font-semibold text-blue-600 mt-1">{pharmacy.distance} km away</p>
          ) : (
            <p className={`text-xs mt-1 ${pharmacy.latitude && pharmacy.longitude ? "text-orange-500" : "text-red-500"}`}>
              {pharmacy.latitude && pharmacy.longitude ? "Give location to get distance" : "Location not available"}
            </p>
          )}
          {pharmacy.latitude && pharmacy.longitude && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(`https://www.google.com/maps?q=${pharmacy.latitude},${pharmacy.longitude}`, "_blank");
              }}
              className="mt-2 text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline font-medium"
            >
              <MapPin size={12} /> View on Map
            </button>
          )}
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${categoryStyle.bg} ${categoryStyle.text}`}>
          {pharmacy.category.replace(/_/g, ' ')}
        </span>
        {pharmacy.isFreeMedicineEnabled && (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
            Free Medicines
          </span>
        )}
      </div>
    </div>
  );
}

export default function Pharmacies() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [filteredPharmacies, setFilteredPharmacies] = useState<Pharmacy[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPharmacies = async () => {
      try {
        const res = await getActivePharmacies();
        if (res.success && Array.isArray(res.data)) {
          setPharmacies(res.data);
          setFilteredPharmacies(res.data);
        } else {
          setError("Could not fetch pharmacies.");
        }
      } catch (err) {
        setError("An error occurred while fetching pharmacies.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPharmacies();
  }, []);

  useEffect(() => {
    let result = pharmacies;

    if (searchTerm) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }

    setFilteredPharmacies(result);
  }, [searchTerm, selectedCategory, pharmacies]);

  const categories = ['all', ...Array.from(new Set(pharmacies.map(p => p.category)))];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-[#002E6E] flex items-center gap-3"><Store /> Available Pharmacies</h1>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border rounded-full focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition ${
                selectedCategory === cat 
                ? 'bg-[#002E6E] text-white shadow' 
                : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {cat.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}
            </button>
          ))}
        </div>

        {loading && <p className="text-center text-gray-500">Loading...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}

        {!loading && !error && (
          filteredPharmacies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPharmacies.map(pharmacy => (
                <PharmacyCard key={pharmacy.id} pharmacy={pharmacy} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-10">No pharmacies found matching your criteria.</p>
          )
        )}
      </div>
    </div>
  );
}