import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChevronDown, Lock, Power, X } from "lucide-react";
import EditIcon from "@mui/icons-material/Edit";
import { updateProfile } from "../api/authapir";

interface Address {
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

interface ContactInfo {
  primaryPhone?: string;
}

interface DoctorInfo {
  id?: string;
  userId?: string;
  specializationId?: string;
  licenseNumber?: string;
  experience?: number;
  consultationFee?: number;
  qualification?: string;
  isActive?: boolean;
}

interface PharmacyInfo {
  id?: string;
  userId?: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  licenseNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  isActive?: boolean;
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
  displayName?: string;
  isActive?: boolean;
  address?: Address;
  contactInfo?: ContactInfo;
  doctor?: DoctorInfo;
  pharmacy?: PharmacyInfo;
  status?: string;
  language?: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  firsttime?: boolean;
}

// Separate InputField component OUTSIDE the main component
const InputField = ({ 
  label, 
  name, 
  value,
  type = "text", 
  required = false, 
  disabled = false,
  textarea = false,
  onChange
}: {
  label: string;
  name: string;
  value: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  textarea?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}) => {
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
        onChange={onChange}
        disabled={disabled}
        required={required}
        rows={textarea ? 3 : undefined}
        className={`w-full p-2 border rounded-lg focus:outline-none ${
          disabled 
            ? "border-gray-300 bg-gray-100 cursor-not-allowed text-gray-600" 
            : "border-blue-400 focus:ring-2 focus:ring-blue-500"
        }`}
      />
    </div>
  );
};

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
        id: parsedUserData.id,
        username: parsedUser.username,
        password: parsedUser.password,
        email: parsedUserData.email || parsedUser.email,
        firstName: parsedUserData.firstName || "",
        lastName: parsedUserData.lastName || "",
        phoneNumber: parsedUserData.phoneNumber || "",
        dateOfBirth: parsedUserData.dateOfBirth?.split('T')[0] || "",
        gender: parsedUserData.gender || "",
        roleId: parsedUserData.roleId || parsedUser.role || "normal",
        fileURL: parsedUserData.fileURL || "",
        displayName: parsedUserData.displayName,
        isActive: parsedUserData.isActive ?? true,
        address: parsedUserData.address || {},
        contactInfo: parsedUserData.contactInfo || {},
        status: parsedUserData.status,
        language: parsedUserData.language,
        isEmailVerified: parsedUserData.isEmailVerified,
        isPhoneVerified: parsedUserData.isPhoneVerified,
        firsttime: parsedUserData.firsttime,
        doctor: parsedUserData.doctor,
        pharmacy: parsedUserData.pharmacy,
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

  // Use useCallback to memoize handlers
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTempData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleAddressChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const field = name.replace('address.', '');
    setTempData((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value }
    }));
  }, []);

  const handleDoctorChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const field = name.replace('doctor.', '');
    const parsedValue = (field === 'consultationFee' || field === 'experience') 
      ? parseFloat(value) || 0 
      : value;
    
    setTempData((prev) => ({
      ...prev,
      doctor: {
        ...prev.doctor,
        [field]: parsedValue
      }
    }));
  }, []);

  const handlePharmacyChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const field = name.replace('pharmacy.', '');
    setTempData((prev) => ({
      ...prev,
      pharmacy: {
        ...prev.pharmacy,
        [field]: value
      }
    }));
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("💾 Saving...", { current: userData, updated: tempData });
    
    if (!tempData.firstName || !tempData.lastName || !tempData.phoneNumber) {
      console.error("❌ Validation failed");
      alert("Please fill required fields!");
      return;
    }
    const res = await updateProfile(tempData);
    console.log(res);
    if(res.success){
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
      contactInfo: tempData.contactInfo,
      fileURL: tempData.fileURL,
      updatedAt: new Date().toISOString(),
      ...(isDoctor && tempData.doctor && {
        doctor: {
          ...parsedUserData.doctor,
          ...tempData.doctor,
        }
      }),
      ...(isPharmacy && tempData.pharmacy && {
        pharmacy: {
          ...parsedUserData.pharmacy,
          ...tempData.pharmacy,
        }
      }),
    };
    
    
    
    console.log("✅ Saved:", updatedUserData);
    
    setUserData({ ...tempData, ...updatedUserData });
    setEditMode(false);
    alert("Profile updated successfully!");
  }
    else{
      alert("Profile updation failed!");
    }
  };

  const handleCancel = () => {
    console.log("❌ Cancelled");
    setTempData(userData);
    setEditMode(false);
  };

  const handleSavePassword = () => {
    console.log("🔐 Changing password...");
    
    if (!newPassword || !confirmPassword) {
      alert("Please enter both password fields!");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("Passwords don't match!");
      return;
    }
    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters!");
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
    alert("Password changed successfully!");
  };

  const toggleActiveMode = () => {
    const isDoctor = userData.roleId?.toLowerCase() === "doctor";
    const newActiveState = !userData.isActive;
    
    console.log(`🔄 Toggling active: ${userData.isActive} → ${newActiveState}`);
    
    const storedUserData = localStorage.getItem("userdata");
    if (storedUserData) {
      const parsed = JSON.parse(storedUserData);
      const updated = {
        ...parsed,
        isActive: newActiveState,
        updatedAt: new Date().toISOString(),
        ...(isDoctor && {
          doctor: {
            ...parsed.doctor,
            isActive: newActiveState
          }
        })
      };
      localStorage.setItem("userdata", JSON.stringify(updated));
      console.log("✅ Active updated:", updated.isActive);
      
      const newData = {
        ...userData,
        isActive: newActiveState,
        ...(isDoctor && {
          doctor: {
            ...userData.doctor,
            isActive: newActiveState
          }
        })
      };
      setUserData(newData);
      setTempData(newData);
    }
  };

  const isDoctor = userData.roleId?.toLowerCase() === "doctor";
  const isPharmacy = userData.roleId?.toLowerCase() === "pharmacy";

  // Helper function to get value from nested objects
  const getValue = (name: string): string => {
    if (name.includes('address.')) {
      const field = name.replace('address.', '') as keyof Address;
      return tempData.address?.[field]?.toString() || "";
    } else if (name.includes('doctor.')) {
      const field = name.replace('doctor.', '') as keyof DoctorInfo;
      return tempData.doctor?.[field]?.toString() || "";
    } else if (name.includes('pharmacy.')) {
      const field = name.replace('pharmacy.', '') as keyof PharmacyInfo;
      return tempData.pharmacy?.[field]?.toString() || "";
    }
    return (tempData[name as keyof ProfileData] as string) || "";
  };

  // Helper to get correct onChange handler
  const getOnChange = (name: string) => {
    if (name.includes('address.')) return handleAddressChange;
    if (name.includes('doctor.')) return handleDoctorChange;
    if (name.includes('pharmacy.')) return handlePharmacyChange;
    return handleChange;
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
              <input type="checkbox" className="sr-only" checked={userData.doctor?.isActive ?? userData.isActive} onChange={toggleActiveMode} />
              <div className={`w-12 h-6 rounded-full p-1 transition ${(userData.doctor?.isActive ?? userData.isActive) ? "bg-green-500" : "bg-gray-400"}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition ${(userData.doctor?.isActive ?? userData.isActive) ? "translate-x-6" : ""}`} />
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
            <InputField 
              label="First Name" 
              name="firstName" 
              value={getValue('firstName')}
              onChange={getOnChange('firstName')}
              required 
              disabled={!editMode}
            />
            <InputField 
              label="Last Name" 
              name="lastName" 
              value={getValue('lastName')}
              onChange={getOnChange('lastName')}
              required 
              disabled={!editMode}
            />
          </div>
          
          <InputField 
            label="Username" 
            name="username" 
            value={getValue('username')}
            onChange={getOnChange('username')}
            required 
            disabled={true}
          />
          <InputField 
            label="Email" 
            name="email" 
            value={getValue('email')}
            onChange={getOnChange('email')}
            type="email" 
            required 
            disabled={true}
          />
          <InputField 
            label="Phone Number" 
            name="phoneNumber" 
            value={getValue('phoneNumber')}
            onChange={getOnChange('phoneNumber')}
            type="tel" 
            required 
            disabled={!editMode}
          />
          <InputField 
            label="Address" 
            name="address.address" 
            value={getValue('address.address')}
            onChange={getOnChange('address.address')}
            textarea 
            disabled={!editMode}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <InputField 
              label="City" 
              name="address.city" 
              value={getValue('address.city')}
              onChange={getOnChange('address.city')}
              disabled={!editMode}
            />
            <InputField 
              label="State" 
              name="address.state" 
              value={getValue('address.state')}
              onChange={getOnChange('address.state')}
              disabled={!editMode}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <InputField 
              label="Postal Code" 
              name="address.postalCode" 
              value={getValue('address.postalCode')}
              onChange={getOnChange('address.postalCode')}
              disabled={!editMode}
            />
            <InputField 
              label="Country" 
              name="address.country" 
              value={getValue('address.country')}
              onChange={getOnChange('address.country')}
              disabled={!editMode}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <InputField 
              label="Date of Birth" 
              name="dateOfBirth" 
              value={getValue('dateOfBirth')}
              onChange={getOnChange('dateOfBirth')}
              type="date" 
              required 
              disabled={true}
            />
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                name="gender"
                value={tempData.gender}
                onChange={handleChange}
                disabled={true}
                className="w-full p-2 border border-gray-300 bg-gray-100 rounded-lg cursor-not-allowed text-gray-600"
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
              <InputField 
                label="Specialization ID" 
                name="doctor.specializationId" 
                value={getValue('doctor.specializationId')}
                onChange={getOnChange('doctor.specializationId')}
                disabled={!editMode}
              />
              <InputField 
                label="License Number" 
                name="doctor.licenseNumber" 
                value={getValue('doctor.licenseNumber')}
                onChange={getOnChange('doctor.licenseNumber')}
                disabled={!editMode}
              />
              <InputField 
                label="Qualification" 
                name="doctor.qualification" 
                value={getValue('doctor.qualification')}
                onChange={getOnChange('doctor.qualification')}
                disabled={!editMode}
              />
              <div className="grid grid-cols-2 gap-4">
                <InputField 
                  label="Experience (years)" 
                  name="doctor.experience" 
                  value={getValue('doctor.experience')}
                  onChange={getOnChange('doctor.experience')}
                  type="number" 
                  disabled={!editMode}
                />
                <InputField 
                  label="Consultation Fee" 
                  name="doctor.consultationFee" 
                  value={getValue('doctor.consultationFee')}
                  onChange={getOnChange('doctor.consultationFee')}
                  type="number" 
                  disabled={!editMode}
                />
              </div>
            </div>
          )}

          {/* Pharmacy Fields */}
          {isPharmacy && (
            <div className="border-t pt-4 mt-4 space-y-4">
              <h3 className="text-lg font-semibold text-blue-600">Pharmacy Information</h3>
              <InputField 
                label="Pharmacy Name" 
                name="pharmacy.name" 
                value={getValue('pharmacy.name')}
                onChange={getOnChange('pharmacy.name')}
                disabled={!editMode}
              />
              <InputField 
                label="Pharmacy Email" 
                name="pharmacy.email" 
                value={getValue('pharmacy.email')}
                onChange={getOnChange('pharmacy.email')}
                type="email" 
                disabled={!editMode}
              />
              <InputField 
                label="Pharmacy Phone" 
                name="pharmacy.phoneNumber" 
                value={getValue('pharmacy.phoneNumber')}
                onChange={getOnChange('pharmacy.phoneNumber')}
                type="tel" 
                disabled={!editMode}
              />
              <InputField 
                label="License Number" 
                name="pharmacy.licenseNumber" 
                value={getValue('pharmacy.licenseNumber')}
                onChange={getOnChange('pharmacy.licenseNumber')}
                disabled={!editMode}
              />
              <InputField 
                label="Pharmacy Address" 
                name="pharmacy.address" 
                value={getValue('pharmacy.address')}
                onChange={getOnChange('pharmacy.address')}
                textarea 
                disabled={!editMode}
              />
              <div className="grid grid-cols-2 gap-4">
                <InputField 
                  label="City" 
                  name="pharmacy.city" 
                  value={getValue('pharmacy.city')}
                  onChange={getOnChange('pharmacy.city')}
                  disabled={!editMode}
                />
                <InputField 
                  label="State" 
                  name="pharmacy.state" 
                  value={getValue('pharmacy.state')}
                  onChange={getOnChange('pharmacy.state')}
                  disabled={!editMode}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputField 
                  label="Postal Code" 
                  name="pharmacy.postalCode" 
                  value={getValue('pharmacy.postalCode')}
                  onChange={getOnChange('pharmacy.postalCode')}
                  disabled={!editMode}
                />
                <InputField 
                  label="Country" 
                  name="pharmacy.country" 
                  value={getValue('pharmacy.country')}
                  onChange={getOnChange('pharmacy.country')}
                  disabled={!editMode}
                />
              </div>
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