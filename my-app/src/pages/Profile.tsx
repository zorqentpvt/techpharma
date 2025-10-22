import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Lock, Power, X } from "lucide-react";

export default function ProfilePage() {
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    address: "",
    phoneNumber: "",
    password: "",
    profilePic: "",
    role: "",
    active: true,
  });

  const [editMode, setEditMode] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("userdata");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUserData({
        firstName: parsedUser.firstName || "",
        lastName: parsedUser.lastName || "",
        address: parsedUser.address?.address || "",
        phoneNumber: parsedUser.phoneNumber || "",
        password: parsedUser.password || "",
        profilePic: parsedUser.profilePic || "",
        role: parsedUser.role || "patient",
        active: parsedUser.active ?? true,
      });
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        setUserData((prev) => ({ ...prev, profilePic: reader.result as string }));
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const storedUser = localStorage.getItem("userdata");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      const updatedUser = { ...parsedUser, ...userData };
      localStorage.setItem("userdata", JSON.stringify(updatedUser));
      setEditMode(false);
      alert("Profile updated successfully!");
    }
  };

  const handleSavePassword = () => {
    if (newPassword && newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    const storedUser = localStorage.getItem("userdata");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      const updatedUser = {
        ...parsedUser,
        password: newPassword || parsedUser.password,
      };
      localStorage.setItem("userdata", JSON.stringify(updatedUser));
      setUserData(updatedUser);
      setShowChangePassword(false);
      alert("Password changed successfully!");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const toggleActiveMode = () => {
    const updated = { ...userData, active: !userData.active };
    setUserData(updated);
    localStorage.setItem("userdata", JSON.stringify(updated));
  };

  const isDoctor = userData.role?.toLowerCase() === "doctor";

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-100 relative">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-2xl relative">
        {/* ⚙️ Settings Dropdown */}
        <div className="absolute top-5 right-5" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown((prev) => !prev)}
            className="flex items-center gap-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-3 py-1.5 rounded-lg transition"
          >
            ⚙️ Settings <ChevronDown size={16} />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <button
                onClick={() => {
                  setShowChangePassword(true);
                  setShowDropdown(false);
                }}
                className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-100 transition"
              >
                <Lock size={16} /> Change Password
              </button>

              {isDoctor && (
                <button
                  onClick={() => {
                    toggleActiveMode();
                    setShowDropdown(false);
                  }}
                  className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                >
                  <Power size={16} />{" "}
                  {userData.active ? "Set Inactive" : "Set Active"}
                </button>
              )}

              <button
                onClick={() => setShowDropdown(false)}
                className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-100 transition"
              >
                <X size={16} /> Close
              </button>
            </div>
          )}
        </div>

        <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">
          Your Profile
        </h2>

        {/* ✅ Active Mode Toggle (Visible for Doctors) */}
        {isDoctor && (
          <div className="flex items-center justify-between mb-6 bg-blue-50 px-4 py-3 rounded-lg border border-blue-200">
            <span className="text-gray-700 font-medium">
              Active for Consulting:
            </span>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only"
                checked={userData.active}
                onChange={toggleActiveMode}
              />
              <div
                className={`w-12 h-6 rounded-full p-1 transition-all ${
                  userData.active ? "bg-green-500" : "bg-gray-400"
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-all ${
                    userData.active ? "translate-x-6" : ""
                  }`}
                ></div>
              </div>
            </label>
          </div>
        )}

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col items-center gap-3">
            <img
              src={
                userData.profilePic ||
                "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
              }
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-2 border-blue-500 shadow-md"
            />
            {editMode && (
              <input type="file" accept="image/*" onChange={handleFileChange} />
            )}
          </div>

          {/* User Info */}
          {["firstName", "lastName", "address", "phoneNumber"].map((field) => (
            <div key={field}>
              <label className="block mb-1 font-medium capitalize">
                {field.replace(/([A-Z])/g, " $1")}
              </label>
              <input
                type="text"
                name={field}
                value={(userData as any)[field]}
                onChange={handleChange}
                readOnly={!editMode}
                className={`w-full p-2 border rounded-lg focus:outline-none ${
                  editMode
                    ? "border-blue-400 focus:ring-2 focus:ring-blue-500"
                    : "border-gray-300 bg-gray-100"
                }`}
              />
            </div>
          ))}

          {/* Password */}
          <div>
            <label className="block mb-1 font-medium">Password</label>
            <input
              type="password"
              name="password"
              value={userData.password}
              readOnly
              className="w-full p-2 border rounded-lg border-gray-300 bg-gray-100"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-between gap-4">
            {editMode ? (
              <>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEditMode(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
              >
                Edit Profile
              </button>
            )}
          </div>
        </form>
      </div>

      {/* 🔐 Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-gray-100 bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-[#22549a] w-150 rounded-xl shadow-blue-400 shadow-xl  p-6 space-y-5 relative">
            <h3 className="text-xl font-semibold text-white text-center mb-4">
              🔒 Change Password
            </h3>

            <div>
              <label className="block text-sm text-white font-medium mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2 border bg-white rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2 border bg-white rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={handleSavePassword}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg mr-2"
              >
                Save
              </button>
              <button
                onClick={() => setShowChangePassword(false)}
                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 rounded-lg ml-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
