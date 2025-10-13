import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SignupForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    address:"",
    dob:"",
    username: "",
    qual:"",
    email: "",
    gen:"",
    num:"",
    gstnumber:"",
    pnum:"",
    password: "",
    cpassword: "",
    role: "",

    certi:"",
    specialization: "", // for doctor
    licenseNumber: "",  // for doctor
    pharmacyName: "",   // for pharmacy
    paddress: "",        // for pharmacy
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Save user in localStorage or send to backend
    localStorage.setItem("user", JSON.stringify(formData));
    alert(`Welcome, ${formData.username}!`);
    navigate("/dashboard");
  };

  // Render role-specific fields
  const renderExtraFields = () => {
    switch (formData.role) {

      case "doctor":
        return (
          <>
            <div>
              <label className="block mb-1 font-medium">Specialization</label>
              <input
                type="text"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                placeholder="e.g., Cardiologist, Dentist"
                className="w-full p-2 border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">License Number</label>
              <input
                type="text"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleChange}
                placeholder="Enter your medical license number"
                className="w-full p-2 border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium"> Upload Doctor License Certificate</label>
              <input
                type="file"
                name="certi"
                value={formData.certi}
                onChange={handleChange}
                placeholder=""
                className="w-full p-2 border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium"> Qualification</label>
              <input
                type="text"
                name="qual"
                value={formData.qual}
                onChange={handleChange}
                placeholder="e.g., MBBS,MD"
                className="w-full p-2 border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        );

      case "pharmacy":
        return (
          <>
            <div>
              <label className="block mb-1 font-medium">Pharmacy Name</label>
              <input
                type="text"
                name="pharmacyName"
                value={formData.pharmacyName}
                onChange={handleChange}
                placeholder="Your pharmacy's name"
                className="w-full p-2 border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Pharmacy Address</label>
              <input
                type="text"
                name="paddress"
                value={formData.paddress}
                onChange={handleChange}
                placeholder="Pharmacy address"
                className="w-full p-2 border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium"> Pharmacy License Number</label>
              <input
                type="text"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleChange}
                required
                placeholder="Enter your Pharmacy license number"
                className="w-full p-2 border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium"> Pharmacy GST Registration Number</label>
              <input
                type="text"
                name="gstNumber"
                value={formData.gstnumber}
                onChange={handleChange}
                placeholder="Enter your Pharmacy GST reg number"
                className="w-full p-2 border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium"> Pharmacy Contact Number</label>
              <input
                type="number"
                name="pnum"
                value={formData.pnum}
                onChange={handleChange}
                placeholder="Enter your Pharmacy Contact number"
                className="w-full p-2 border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium"> Upload Pharmacy License Certificate</label>
              <input
                type="file"
                name="certi"
                value={formData.certi}
                onChange={handleChange}
                placeholder=""
                className="w-full p-2 border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center bg-cover bg-center justify-center " style={{ backgroundImage: "url('/images/sign.jpg')" }}>
      <div className="  bg-white/80  p-8 rounded-xl m-5 shadow-xl animated-bg justify-items-center  flex-col">
        <h2 className="text-6xl font-bold text-center text-blue-700 mb-6">
          Create an Account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5 grid grid-cols-2 w-7xl  m-2 p-5 space-x-10  ">
          {/* Username */}

          
          
          <div>
            <label className="block mb-1 font-medium">FirstName</label>
            <input
              type="text"
              name="firstname"
              value={formData.firstname}
              onChange={handleChange}
              required
              placeholder="Enter your Firstname"
              className="w-full p-2 border-blue-400 border bg-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          
          
          <div>
            <label className="block mb-1 font-medium">LastName</label>
            <input
              type="text"
              name="lastname"
              value={formData.lastname}
              onChange={handleChange}
              required
              placeholder="Enter your Lastname"
              className="w-full p-2 border-blue-400 border bg-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Enter your Username"
              className="w-full p-2 border-blue-400 border bg-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block mb-1 font-medium">Select Gender</label>
            <select
              name="gen"
              value={formData.gen}
              onChange={handleChange}
              required
              className="w-full p-2 border border-blue-400 rounded-lg bg-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose your Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>

            </select>
          </div>

          <div>
            <label className="block mb-1 font-medium">Personal Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              placeholder="Enter your Address "
              className="w-full p-2 border-blue-400 border bg-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Phone number</label>
            <input
              type="number"
              name="num"
              value={formData.num}
              onChange={handleChange}
              required
              placeholder="Enter your Phone Number "
              className="w-full p-2 border-blue-400 border bg-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Date Of Birth</label>
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              required
              placeholder="Enter your DOB "
              className="w-full p-2 border-blue-400 border bg-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block mb-1 font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
              className="w-full p-2 border border-blue-400 bg-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block mb-1 font-medium">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter a password"
              className="w-full p-2 border border-blue-400 bg-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Confirm Password</label>
            <input
              type="password"
              name="cpassword"
              value={formData.cpassword}
              onChange={handleChange}
              required
              placeholder="RE-Enter the Password"
              className="w-full p-2 border border-blue-400 bg-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>  

          {/* Role Selection */}
          <div>
            <label className="block mb-1 font-medium">Select Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className="w-full p-2 border border-blue-400 rounded-lg bg-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose your role</option>
              <option value="normal">Patient</option>
              <option value="doctor">Doctor</option>
              <option value="pharmacy">Pharmacy</option>
            </select>
          </div>

          {/* Role-specific fields */}
          {renderExtraFields()}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-50 h-10 bg-blue-600 hover:bg-blue-700 relative top-22 right-200  text-white font-semibold  ml-175  py-2 rounded-lg transition"
          >
            Sign Up 𓂃🖊
          </button>
          
        </form>
        

        <p className="text-center text-gray-600 text-sm mt-7">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/")}
            className="text-blue-700  font-medium hover:underline cursor-pointer"
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}
