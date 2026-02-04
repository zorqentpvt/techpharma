import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Lock, Power, X } from "lucide-react";
import EditIcon from "@mui/icons-material/Edit";

interface Address {
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

interface ProfileData {
  id?: string;
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  roleId: string;
  fileURL?: string;
  address?: Address;
  displayName?: string;
  isActive?: boolean;
  
  // Doctor fields
  specialization?: string;
  licenseNumber?: string;
  qualification?: string;
  consultation_fee?: number;
  
  // Pharmacy fields
  pharmacyName?: string;
  pharmacyAddress?: string;
  gstNumber?: string;
  pharmacyPhone?: string;
}

export default function ProfilePage() {
  const [userData, setUserData] = useState<ProfileData>({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    dateOfBirth: "",
    gender: "",
    roleId: "patient",
  });

  const [tempData, setTempData] = useState<ProfileData>(userData);
  const [editMode, setEditMode] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const populateUserData = () => {
    console.log("🔄 Populating user data...");
    const storedUserData = localStorage.getItem("userdata");
    const storedUser = localStorage.getItem("user");
    
    if (!storedUserData || !storedUser) {
      console.warn("⚠️ Missing localStorage data");
      return;
    }

    try {
      const parsedUserData = JSON.parse(storedUserData);
      const parsedUser = JSON.parse(storedUser);
      
      const populated: ProfileData = {
        username: parsedUser.username,
        password: parsedUser.password,
        email: parsedUserData.email || parsedUser.email,
        firstName: parsedUserData.firstName || "",
        lastName: parsedUserData.lastName || "",
        phoneNumber: parsedUserData.phoneNumber || "",
        dateOfBirth: parsedUserData.dateOfBirth?.split('T')[0] || "",
        gender: parsedUserData.gender || "",
        roleId: parsedUserData.roleId || parsedUser.role || "patient",
        fileURL: parsedUserData.fileURL || "",
        address: parsedUserData.address,
        displayName: parsedUserData.displayName,
        isActive: parsedUserData.isActive ?? true,
        id: parsedUserData.id,
        specialization: parsedUserData.specialization || "",
        licenseNumber: parsedUserData.licenseNumber || "",
        qualification: parsedUserData.qualification || "",
        consultation_fee: parsedUserData.consultation_fee || 0,
        pharmacyName: parsedUserData.pharmacyName || "",
        pharmacyAddress: parsedUserData.pharmacyAddress || "",
        gstNumber: parsedUserData.gstNumber || "",
        pharmacyPhone: parsedUserData.pharmacyPhone || "",
      };

      console.log("✅ Data loaded:", populated);
      setUserData(populated);
      setTempData(populated);
    } catch (error) {
      console.error("❌ Error parsing data:", error);
    }
  };

  useEffect(() => {
    populateUserData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    console.log(`📝 ${name} = ${value}`);
    setTempData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    console.log("📷 Profile picture:", file.name);
    const reader = new FileReader();
    reader.onload = () => {
      console.log("✅ Image loaded");
      setTempData((prev) => ({ ...prev, fileURL: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("💾 Saving...", { current: userData, updated: tempData });
    
    if (!tempData.firstName || !tempData.lastName || !tempData.phoneNumber) {
      console.error("❌ Validation failed");
      alert("Please fill required fields!");
      return;
    }

    const storedUserData = localStorage.getItem("userdata");
    const parsedUserData = storedUserData ? JSON.parse(storedUserData) : {};
    
    const isDoctor = userData.roleId?.toLowerCase() === "doctor";
    const isPharmacy = userData.roleId?.toLowerCase() === "pharmacy";
    
    const updatedUserData = {
      ...parsedUserData,
      firstName: tempData.firstName,
      lastName: tempData.lastName,
      displayName: `${tempData.firstName} ${tempData.lastName}`,
      phoneNumber: tempData.phoneNumber,
      address: tempData.address,
      fileURL: tempData.fileURL,
      updatedAt: new Date().toISOString(),
      ...(isDoctor && {
        specialization: tempData.specialization,
        licenseNumber: tempData.licenseNumber,
        qualification: tempData.qualification,
        consultation_fee: tempData.consultation_fee,
      }),
      ...(isPharmacy && {
        pharmacyName: tempData.pharmacyName,
        pharmacyAddress: tempData.pharmacyAddress,
        gstNumber: tempData.gstNumber,
        pharmacyPhone: tempData.pharmacyPhone,
      }),
    };
    
    localStorage.setItem("userdata", JSON.stringify(updatedUserData));
    console.log("✅ Saved:", updatedUserData);
    
    setUserData({ ...tempData, ...updatedUserData });
    setEditMode(false);
    alert("Profile updated!");
  };

  const handleCancel = () => {
    console.log("❌ Cancelled");
    setTempData(userData);
    setEditMode(false);
  };

  const handleSavePassword = () => {
    console.log("🔐 Changing password...");
    
    if (!newPassword || !confirmPassword) {
      alert("Enter both password fields!");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("Passwords don't match!");
      return;
    }
    if (newPassword.length < 6) {
      alert("Password must be 6+ characters!");
      return;
    }

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      localStorage.setItem("user", JSON.stringify({ ...parsed, password: newPassword }));
    }
    
    const storedUserData = localStorage.getItem("userdata");
    if (storedUserData) {
      const parsed = JSON.parse(storedUserData);
      localStorage.setItem("userdata", JSON.stringify({ ...parsed, updatedAt: new Date().toISOString() }));
    }
    
    console.log("✅ Password changed");
    setUserData({ ...userData, password: newPassword });
    setTempData({ ...tempData, password: newPassword });
    setShowChangePassword(false);
    setNewPassword("");
    setConfirmPassword("");
    alert("Password changed!");
  };

  const toggleActiveMode = () => {
    console.log(`🔄 Toggling active: ${userData.isActive} → ${!userData.isActive}`);
    
    const storedUserData = localStorage.getItem("userdata");
    if (storedUserData) {
      const parsed = JSON.parse(storedUserData);
      const updated = { ...parsed, isActive: !userData.isActive, updatedAt: new Date().toISOString() };
      localStorage.setItem("userdata", JSON.stringify(updated));
      console.log("✅ Active updated:", updated.isActive);
      
      const newData = { ...userData, isActive: !userData.isActive };
      setUserData(newData);
      setTempData(newData);
    }
  };

  const isDoctor = userData.roleId?.toLowerCase() === "doctor";
  const isPharmacy = userData.roleId?.toLowerCase() === "pharmacy";

  const InputField = ({ label, name, type = "text", required = false, editable = true, textarea = false }: any) => {
    const isReadOnly = !editMode || !editable;
    const value = name.includes('.') 
      ? tempData.address?.[name.split('.')[1] as keyof Address] || ""
      : (tempData[name as keyof ProfileData] as string) || "";
    
    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const addressField = name.split('.')[1];
      console.log(`📝 address.${addressField} = ${e.target.value}`);
      setTempData((prev) => ({
        ...prev,
        address: { ...prev.address, [addressField]: e.target.value }
      }));
    };

    const Component = textarea ? 'textarea' : 'input';
    
    return (
      <div>
        <label className="block mb-1 font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <Component
          type={!textarea ? type : undefined}
          name={name}
          value={value}
          onChange={name.includes('.') ? handleAddressChange : handleChange}
          readOnly={isReadOnly}
          required={required}
          rows={textarea ? 2 : undefined}
          className={`w-full p-2 border rounded-lg focus:outline-none ${
            isReadOnly 
              ? "border-gray-300 bg-gray-100 cursor-not-allowed" 
              : "border-blue-400 focus:ring-2 focus:ring-blue-500"
          }`}
          title={!editable ? `${label} cannot be changed` : ""}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-100 py-8">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-2xl relative">
        {/* Settings Dropdown */}
        <div className="absolute top-5 right-5" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-3 py-1.5 rounded-lg transition"
          >
            ⚙️ Settings <ChevronDown size={16} />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-52 bg-white border rounded-lg shadow-lg z-10">
              <button
                type="button"
                onClick={() => { setShowChangePassword(true); setShowDropdown(false); }}
                className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                <Lock size={16} /> Change Password
              </button>
              {isDoctor && (
                <button
                  type="button"
                  onClick={() => { toggleActiveMode(); setShowDropdown(false); }}
                  className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  <Power size={16} /> {userData.isActive ? "Set Inactive" : "Set Active"}
                </button>
              )}
              <button type="button" onClick={() => setShowDropdown(false)} className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-100">
                <X size={16} /> Close
              </button>
            </div>
          )}
        </div>

        <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">Your Profile</h2>

        {/* Role Badge */}
        <div className="flex justify-center mb-4">
          <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium capitalize">
            {userData.roleId}
          </span>
        </div>

        {/* Doctor Active Toggle */}
        {isDoctor && (
          <div className="flex items-center justify-between mb-6 bg-blue-50 px-4 py-3 rounded-lg border border-blue-200">
            <span className="text-gray-700 font-medium">Active for Consulting:</span>
            <label className="inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only" checked={userData.isActive} onChange={toggleActiveMode} />
              <div className={`w-12 h-6 rounded-full p-1 transition ${userData.isActive ? "bg-green-500" : "bg-gray-400"}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition ${userData.isActive ? "translate-x-6" : ""}`} />
              </div>
            </label>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Profile Picture */}
          <div className="relative flex justify-center">
            <div className="relative group">
              <img
                src={tempData.fileURL || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-2 border-blue-500 shadow-md"
              />
              {editMode && (
                <>
                  <input type="file" accept="image/*" id="profile-upload" onChange={handleFileChange} className="hidden" />
                  <label
                    htmlFor="profile-upload"
                    className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer"
                  >
                    <EditIcon className="text-white" />
                  </label>
                </>
              )}
            </div>
          </div>

          {/* Basic Fields */}
          <div className="grid grid-cols-2 gap-4">
            <InputField label="First Name" name="firstName" required editable />
            <InputField label="Last Name" name="lastName" required editable />
          </div>
          
          <InputField label="Username" name="username" required editable={false} />
          <InputField label="Email" name="email" type="email" required editable={false} />
          <InputField label="Phone Number" name="phoneNumber" type="tel" required editable />
          <InputField label="Address" name="address.address" textarea editable />
          
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Date of Birth" name="dateOfBirth" type="date" required editable={false} />
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                name="gender"
                value={tempData.gender}
                readOnly={!editMode}
                className={`w-full p-2 border rounded-lg ${
                  !editMode 
                    ? "border-gray-300 bg-gray-100 cursor-not-allowed" 
                    : "border-blue-400 focus:ring-2 focus:ring-blue-500"
                }`}
                title="Gender cannot be changed"
                style={{ pointerEvents: 'none' }}
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Doctor Fields */}
          {isDoctor && (
            <div className="border-t pt-4 mt-4 space-y-4">
              <h3 className="text-lg font-semibold text-blue-600">Doctor Information</h3>
              <InputField label="Specialization" name="specialization" editable />
              <InputField label="License Number" name="licenseNumber" editable />
              <InputField label="Qualification" name="qualification" editable />
              <InputField label="Consultation Fee" name="consultation_fee" type="number" editable />
            </div>
          )}

          {/* Pharmacy Fields */}
          {isPharmacy && (
            <div className="border-t pt-4 mt-4 space-y-4">
              <h3 className="text-lg font-semibold text-blue-600">Pharmacy Information</h3>
              <InputField label="Pharmacy Name" name="pharmacyName" editable />
              <InputField label="Pharmacy Address" name="pharmacyAddress" textarea editable />
              <InputField label="GST Number" name="gstNumber" editable />
              <InputField label="Pharmacy Phone" name="pharmacyPhone" type="tel" editable />
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            {editMode ? (
              <>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition">
                  Save Changes
                </button>
                <button type="button" onClick={handleCancel} className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 rounded-lg transition">
                  Cancel
                </button>
              </>
            ) : (
              <button 
                type="button" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("✏️ Edit mode enabled");
                  setEditMode(true);
                }} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
              >
                Edit Profile
              </button>
            )}
          </div>
        </form>

        {/* Change Password Modal */}
        {showChangePassword && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white w-96 rounded-xl shadow-2xl p-6 space-y-5">
              <h3 className="text-xl font-semibold text-blue-600 text-center">🔒 Change Password</h3>
              <div>
                <label className="block text-sm text-gray-700 font-medium mb-1">
                  New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Min. 6 characters"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Re-enter password"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={handleSavePassword} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg">
                  Save Password
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    console.log("❌ Password change cancelled");
                    setShowChangePassword(false);
                    setNewPassword("");
                    setConfirmPassword("");
                  }} 
                  className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}