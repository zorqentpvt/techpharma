import { FC, useEffect, useState } from "react";
import { FaClinicMedical } from "react-icons/fa";
import { getUsersByRole } from "../api/adminapi"; // adjust path
import { useNavigate } from "react-router-dom";

const PharmacyPage: FC = () => {
  const [pharmacies, setPharmacies] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPharmacies();
  }, []);

  const fetchPharmacies = async () => {
    try {
      const res = await getUsersByRole("pharmacy");
      setPharmacies(res.data);
    } catch (err) {
      console.error("Failed to load pharmacies", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-[#002E6E] flex items-center gap-2 mb-4">
        <FaClinicMedical /> Pharmacy Management
      </h2>

      <p className="text-gray-600 mb-6">
        Manage pharmacies, licenses, and access.
      </p>

      {loading ? (
        <p className="text-gray-500">Loading pharmacies...</p>
      ) : pharmacies.length === 0 ? (
        <p className="text-gray-500">No pharmacies found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pharmacies.map((user) => (
            <div
              key={user.id}
              className="border rounded-xl p-5 shadow-sm hover:shadow-md transition"
            >
              <h3 className="text-lg font-semibold text-[#002E6E]">
                {user.pharmacy?.name}
              </h3>

              <p className="text-sm text-gray-600">
                License: {user.pharmacy?.licenseNumber}
              </p>

              <p className="text-sm text-gray-600">
                Email: {user.pharmacy?.email}
              </p>

              <p className="text-sm text-gray-600">
                Phone: {user.pharmacy?.phoneNumber}
              </p>

              <p className="text-sm text-gray-600 mt-1">
                Status:{" "}
                <span
                  className={
                    user.status == "active"
                      ? "text-green-600 font-medium"
                      : "text-red-500 font-medium"
                  }
                >
                  {user.status}
                </span>
              </p>
 
              <button
                onClick={() =>
                  navigate(`/dashboard/admin/pharmacies/view/${user.pharmacy?.id}`, {
                    state: { pharmacy: user }
                  })
                }
                className="mt-4 w-full bg-[#002E6E] text-white py-2 rounded-lg hover:bg-[#001f4d]"
              >
                View
              </button>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PharmacyPage;
