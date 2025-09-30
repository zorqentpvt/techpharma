import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { Medicine } from "../api/medapi";

export default function Transaction() {
  const navigate = useNavigate();
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const stored = localStorage.getItem("transaction");
    if (stored) setMedicine(JSON.parse(stored));
    else navigate("/dashboard");
  }, [navigate]);

  const handleBuy = () => {
    alert(`✅ You bought ${quantity} of ${medicine?.name}`);
    localStorage.removeItem("transaction");
    navigate("/dashboard");
  };

  if (!medicine) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">Buy Medicine</h2>
        <p className="mb-2"><strong>Name:</strong> {medicine.name}</p>
        <p className="mb-2"><strong>Pharmacy:</strong> {medicine.pharmacy}</p>
        <p className="mb-2"><strong>Stock:</strong> {medicine.stock}</p>
        <p className="mb-2"><strong>Contents:</strong> {medicine.contents}</p>

        <div className="mt-4 flex gap-2 items-center">
          <label>Quantity:</label>
          <input
            type="number"
            min={1}
            max={medicine.stock}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="border p-2 rounded w-24"
          />
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <Button onClick={() => navigate("/dashboard")} variant="secondary">Cancel</Button>
          <Button onClick={handleBuy}>Buy </Button>
        </div>
      </div>
    </div>
  );
}
