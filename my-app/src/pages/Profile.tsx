import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ProfilePage() {
  const navigate = useNavigate();

  interface UserData {
  profilePic?: string;
}

// export default function ProfileUploader() {
//   const [userData, setUserData] = useState<UserData>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        setUserData((prev) => ({ ...prev, profilePic: reader.result as string }));
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const [image, setImage] = useState<string | null>(null);

  const handleFile1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(URL.createObjectURL(file));
    }
  };

  const [userData, setUserData] = useState({
    firstname: "",
    lastname: "",
    address: "",
    num: "",
    password: "",
    profilePic: "",
  });

  // Load user data from localStorage when component mounts
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUserData({
        firstname: parsedUser.firstname || "",
        lastname: parsedUser.lastname || "",
        address: parsedUser.address || "",
        num: parsedUser.num || "",
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

  // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   if (e.target.files && e.target.files[0]) {
  //     const reader = new FileReader();
  //     reader.onload = () => {
  //       setUserData((prev) => ({ ...prev, profilePic: reader.result as string }));
  //     };
  //     reader.readAsDataURL(e.target.files[0]);
  //   }
  // };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      const updatedUser = { ...parsedUser, ...userData };
      localStorage.setItem("user", JSON.stringify(updatedUser));
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
                              {/* <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <img
                    src={userData.profilePic || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-2 border-blue-500 shadow-md"
                  />

                 
                  <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 p-2 rounded-full cursor-pointer transition">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </label>
                </div>

                <p className="text-sm text-gray-600">
                  {userData.profilePic ? "Change photo" : "Upload profile picture"}
                </p>
              </div> */}

          {/* <div className="flex flex-col items-center">
            {userData.profilePic && (
              <img
                src={userData.profilePic}
                alt="Profile"
                className="w-24 h-24 rounded-full mb-3 object-cover"
              />
            )}
            <input type="file" onChange={handleFileChange} />
          </div> */}

          {/* First Name */}
          <div>
            <label className="block mb-1 font-medium">First Name</label>
            <input
              type="text"
              name="firstname"
              value={userData.firstname}
              onChange={handleChange}
              className="w-full p-2 border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="block mb-1 font-medium">Last Name</label>
            <input
              type="text"
              name="lastname"
              value={userData.lastname}
              onChange={handleChange}
              className="w-full p-2 border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full p-2 border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block mb-1 font-medium">Phone Number</label>
            <input
              type="number"
              name="num"
              value={userData.num}
              onChange={handleChange}
              className="w-full p-2 border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full p-2 border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
          >
            Update Profile
          </button>
        </form>

        {/* <p
          onClick={() => navigate("/dashboard")}
          className="text-center text-blue-700 font-medium mt-5 cursor-pointer hover:underline"
        >
          Back to Dashboard
        </p> */}
      </div>
    </div>
  );
}
