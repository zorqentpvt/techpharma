import React from 'react'
import { FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { FaUserMd, FaClinicMedical, FaUserCircle } from "react-icons/fa";


export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("doctor");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const navigate = useNavigate();
  return (
   <div className="h-screen w-full flex flex-col lg:flex-row bg-gradient-to-r from-gray-50 via-blue-100 to-blue-50 relative overflow-hidden">

       {/* Mobile Navbar */}
      <header className="lg:hidden flex items-center justify-between bg-white shadow-md px-4 py-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Menu size={26} className="text-[#002E6E]" />
          </button>
          <h1 className="text-xl font-bold text-[#002E6E]">Admin Panel</h1>
        </div>
        <FaUserCircle size={30} className="text-[#002E6E]" />
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static z-30 top-0 left-0 h-screen w-64 bg-white shadow-2xl p-4 rounded-tr-3xl lg:rounded-br-3xl
        transition-transform duration-300
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 flex flex-col`}
      >
        {/* Admin Info */}
        <div className="flex items-center gap-3 p-3 mb-8 rounded-xl bg-blue-50">
          <FaUserCircle size={40} className="text-[#002E6E]" />
          <div>
            <p className="text-lg font-semibold text-gray-700">Admin</p>
            <p className="text-sm text-gray-500">Control Panel</p>
          </div>
        </div>

        {/* Tabs */}
        <nav className="flex flex-col gap-3">
          <button
                onClick={() => {
                  navigate("/admin/doctor");
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-700 hover:bg-blue-50"
              >
                <FaUserMd size={20} />
                Doctor
              </button>

          <button
              onClick={() => {
                navigate("/admin/pharmacy");
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-700 hover:bg-blue-50"
            >
              <FaClinicMedical size={20} />
              Pharmacy
            </button>
        </nav>
      </aside>

      {/* Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {activeTab === "doctor" && (
            <>
              <h2 className="text-2xl font-bold text-[#002E6E] mb-4">
                Doctor Management
              </h2>
              <p className="text-gray-600">
                View, approve, or manage registered doctors here.
              </p>
            </>
          )}

          {activeTab === "pharmacy" && (
            <>
              <h2 className="text-2xl font-bold text-[#002E6E] mb-4">
                Pharmacy Management
              </h2>
              <p className="text-gray-600">
                View and manage registered pharmacies here.
              </p>
            </>
          )}
        </div>
      </main>
    

    </div>
  );
}