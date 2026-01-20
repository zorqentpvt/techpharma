import { FC } from "react";
import { FaUserMd } from "react-icons/fa";

const DoctorPage: FC = () => {
  return (
    <div className="min-h-full bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-[#002E6E] flex items-center gap-2 mb-4">
        <FaUserMd /> Doctor Management
      </h2>

      <p className="text-gray-600 mb-6">
        Manage doctors, approvals, and profiles.
      </p>

      <div className="border-2 border-dashed rounded-xl p-6 text-center text-gray-400">
        Doctor table / cards go here
      </div>
    </div>
  );
};

export default DoctorPage;
