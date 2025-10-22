import React, { useState, useEffect } from "react";

export default function ProfilePage() {
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    address: "",
    phoneNumber: "",
    password: "",
    profilePic: "",
  });

  const [editMode, setEditMode] = useState(false);

  // Load user data from localStorage
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
      });
    }
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-2xl">
        <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">
          Your Profile
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Profile Picture */}
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

          {/* First Name */}
          <div>
            <label className="block mb-1 font-medium">First Name</label>
            <input
              type="text"
              name="firstName"
              value={userData.firstName}
              onChange={handleChange}
              readOnly={!editMode}
              className={`w-full p-2 border rounded-lg focus:outline-none ${
                editMode
                  ? "border-blue-400 focus:ring-2 focus:ring-blue-500"
                  : "border-gray-300 bg-gray-100"
              }`}
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="block mb-1 font-medium">Last Name</label>
            <input
              type="text"
              name="lastName"
              value={userData.lastName}
              onChange={handleChange}
              readOnly={!editMode}
              className={`w-full p-2 border rounded-lg focus:outline-none ${
                editMode
                  ? "border-blue-400 focus:ring-2 focus:ring-blue-500"
                  : "border-gray-300 bg-gray-100"
              }`}
            />
          </div>

          {/* Address */}
          <div>
            <label className="block mb-1 font-medium">Address</label>
            <input
              type="text"
              name="address"
              value={userData.address}
              onChange={handleChange}
              readOnly={!editMode}
              className={`w-full p-2 border rounded-lg focus:outline-none ${
                editMode
                  ? "border-blue-400 focus:ring-2 focus:ring-blue-500"
                  : "border-gray-300 bg-gray-100"
              }`}
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block mb-1 font-medium">Phone Number</label>
            <input
              type="text"
              name="phoneNumber"
              value={userData.phoneNumber}
              onChange={handleChange}
              readOnly={!editMode}
              className={`w-full p-2 border rounded-lg focus:outline-none ${
                editMode
                  ? "border-blue-400 focus:ring-2 focus:ring-blue-500"
                  : "border-gray-300 bg-gray-100"
              }`}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block mb-1 font-medium">Password</label>
            <input
              type="password"
              name="password"
              value={userData.password}
              onChange={handleChange}
              readOnly={!editMode}
              className={`w-full p-2 border rounded-lg focus:outline-none ${
                editMode
                  ? "border-blue-400 focus:ring-2 focus:ring-blue-500"
                  : "border-gray-300 bg-gray-100"
              }`}
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
    </div>
  );
}
