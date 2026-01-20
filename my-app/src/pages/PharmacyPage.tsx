import { FC } from "react";
import { FaClinicMedical } from "react-icons/fa";

const PharmacyPage: FC = () => {
  return (
    <div className="min-h-full bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-[#002E6E] flex items-center gap-2 mb-4">
        <FaClinicMedical /> Pharmacy Management
      </h2>

      <p className="text-gray-600 mb-6">
        Manage pharmacies, licenses, and access.
      </p>

      <div className="border-2 border-dashed rounded-xl p-6 text-center text-gray-400">
        Pharmacy table / cards go here
      </div>
    </div>
  );
};

export default PharmacyPage;
