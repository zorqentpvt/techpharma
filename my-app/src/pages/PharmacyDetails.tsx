import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPharmacyDetails, addToCart as addToCartApi } from "../api/medapir";
import { Store, MapPin, Phone, Mail, ChevronLeft, ShoppingCart, Zap } from "lucide-react";

// Types
interface Medicine {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  imageURL?: string;
  prescriptionRequired: boolean;
  pharmacyId: string;
}

interface PharmacyDetailsType {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  phoneNumber: string;
  email: string;
  category: string;
  isFreeMedicineEnabled: boolean;
  user: {
    avatar?: string;
  };
  medicines: Medicine[];
}

const BASE_URL = "http://localhost:8080";

const resolveImageUrl = (img: string | undefined | null, isPharmacy: boolean): string => {
  const defaultIcon = isPharmacy 
    ? "https://cdn-icons-png.flaticon.com/512/822/822139.png"
    : "https://cdn-icons-png.flaticon.com/512/2966/2966327.png";
  if (!img) return defaultIcon;
  if (img.startsWith("data:") || img.startsWith("http")) return img;
  return `${BASE_URL}/${img.replace(/^\/?/, "")}`;
};

function MedicineCard({ medicine }: { medicine: Medicine }) {
  const navigate = useNavigate();

  const handleBuyNow = () => {
    localStorage.setItem("transaction", JSON.stringify({
      id: medicine.id,
      name: medicine.name,
      price: medicine.price,
      prescriptionRequired: medicine.prescriptionRequired,
    }));
    navigate("/dashboard/pay");
  };

  const handleAddToCart = async () => {
    try {
      const res = await addToCartApi(medicine.id, 1);
      if (res.success) {
        alert(`${medicine.name} added to cart!`);
      } else {
        alert(`Failed to add to cart: ${res.message || 'Please try again.'}`);
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      alert("An error occurred while adding to cart.");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col">
      <img
        src={resolveImageUrl(medicine.imageURL, false)}
        alt={medicine.name}
        className="w-full h-32 object-contain rounded-md mb-4 bg-gray-50"
      />
      <div className="flex-1">
        <h3 className="font-bold text-gray-800">{medicine.name}</h3>
        <p className="text-sm text-gray-500 mt-1 truncate">{medicine.description}</p>
        <p className="text-lg font-bold text-blue-600 mt-2">₹{medicine.price.toFixed(2)}</p>
        <p className={`text-xs mt-1 font-medium ${medicine.prescriptionRequired ? 'text-red-500' : 'text-green-600'}`}>
          {medicine.prescriptionRequired ? 'Prescription Required' : 'No Prescription Needed'}
        </p>
      </div>
      <div className="mt-4 pt-4 border-t flex gap-2">
        <button 
          onClick={handleAddToCart}
          className="flex-1 flex items-center justify-center gap-2 text-sm bg-blue-100 text-blue-700 font-semibold py-2 rounded-lg hover:bg-blue-200 transition"
        >
          <ShoppingCart size={16} /> Add to Cart
        </button>
        <button 
          onClick={handleBuyNow}
          className="flex-1 flex items-center justify-center gap-2 text-sm bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Zap size={16} /> Buy Now
        </button>
      </div>
    </div>
  );
}

export default function PharmacyDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pharmacy, setPharmacy] = useState<PharmacyDetailsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("Pharmacy ID is missing.");
      setLoading(false);
      return;
    }

    const fetchDetails = async () => {
      try {
        const res = await getPharmacyDetails(id);
        if (res.success && res.data) {
          setPharmacy(res.data);
        } else {
          setError("Could not fetch pharmacy details.");
        }
      } catch (err) {
        setError("An error occurred.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  if (loading) return <p className="p-8 text-center">Loading pharmacy details...</p>;
  if (error) return <p className="p-8 text-center text-red-500">{error}</p>;
  if (!pharmacy) return <p className="p-8 text-center">Pharmacy not found.</p>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-blue-600 hover:underline mb-6">
          <ChevronLeft size={20} /> Back to Pharmacies
        </button>

        {/* Pharmacy Header */}
        <div className="bg-white rounded-2xl shadow-md p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <img
              src={resolveImageUrl(pharmacy.user?.avatar, true)}
              alt={pharmacy.name}
              className="w-24 h-24 rounded-xl object-cover border-2 border-white shadow-lg"
            />
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-[#002E6E]">{pharmacy.name}</h1>
              <div className="mt-3 space-y-2 text-gray-600">
                <p className="flex items-center gap-2"><MapPin size={16} /> {`${pharmacy.address}, ${pharmacy.city}, ${pharmacy.state} ${pharmacy.postalCode}`}</p>
                <p className="flex items-center gap-2"><Phone size={16} /> {pharmacy.phoneNumber}</p>
                <p className="flex items-center gap-2"><Mail size={16} /> {pharmacy.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Medicines List */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Available Medicines</h2>
          {pharmacy.medicines && pharmacy.medicines.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {pharmacy.medicines.map(med => (
                <MedicineCard key={med.id} medicine={med} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-10 bg-white rounded-xl">No medicines available at this pharmacy yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
