import { Divide } from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signup } from "../api/authapir";
import { Eye, EyeOff } from "lucide-react";

export default function SignupForm() {

  const [showPassword, setShowPassword] = useState(false);

  const [fileName, setFileName] = useState("");
  const navigate = useNavigate();

  const [error, setError] = useState("");

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

    if (name === "cpassword" || name === "password") {
      setError(
        name === "cpassword" && value !== formData.password
          ? "Passwords do not match"
          : ""
      );
    }

    
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    try {
      // Call signup API
      const result = await signup(formData);
  
      if (result.success) {
        // Optionally save user info to localStorage
        localStorage.setItem("user", JSON.stringify(result.user || formData));
  
        alert(`Welcome, ${formData.username}!`);
        navigate("/dashboard");
      } else {
        alert(result.message || "Signup failed. Please try again.");
      }
    } catch (error) {
      console.error("Signup error:", error);
      alert("An unexpected error occurred. Please try again.");
    }
  };

  // Render role-specific fields
  const renderExtraFields = () => {
    switch (formData.role) {

      case "doctor":
        return (
          <>

            <div></div>

            <div>
              <label className="block mb-1 font-medium">Specialization <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="specialization"
                value={formData.specialization}
                required
                onChange={handleChange}
                placeholder="e.g., Cardiologist, Dentist"
                className="w-full p-2 border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Medical License Number <span className="text-red-500">*</span></label>
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
              <label className="block mb-1 font-medium"> Qualification </label>
              <input
                type="text"
                name="qual"
                value={formData.qual}
                onChange={handleChange}
                placeholder="e.g., MBBS,MD"
                className="w-full p-2 border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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

          {/* file uploading down */}

            <div className="flex flex-col items-start gap-3">
              <label className="text-md font-medium text-gray-700">Upload Medical License</label>
      
              <label className="flex items-center gap-2 cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                      <input
                        disabled
                        type="file"
                        name="certi"
                        // required
                        value={formData.certi}
                        className="hidden"
                        onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
                      />
                      <span>Choose File</span>
                    </label>

                    {fileName && (
                      <p className="text-sm text-gray-600 mt-1">Selected: {fileName}</p>
                    )}
                  </div>
          </>
        );

      case "pharmacy":
        return (
          <>

              <div></div>

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
              <label className="block mb-1 font-medium"> Pharmacy License Number <span className="text-red-500">*</span></label>
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
            <div></div>

            {/* file uploading down */}

            <div className="flex flex-col items-start gap-3">
              <label className="text-md font-medium text-gray-700">Upload Pharmacy License</label>
      
              <label className="flex items-center gap-2 cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                      <input
                        type="file"
                        name="certi"
                        disabled
                        // required
                        value={formData.certi}
                        className="hidden"
                        onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
                      />
                      <span>Choose File</span>
                    </label>

                    {fileName && (
                      <p className="text-sm text-gray-600 mt-1">Selected: {fileName}</p>
                    )}
                  </div>


                  
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center bg-cover bg-center justify-center " style={{ backgroundImage: "url('/images/sign.jpg')" }}>
      <div className="  bg-white/90  p-8 rounded-xl m-5 shadow-xl animated-bg justify-items-center  flex-col">
        <h2 className="text-6xl font-bold text-center text-blue-700 mb-6">
          Create an Account
        </h2>

       <form
            onSubmit={handleSubmit}
                className="
                  grid 
                  grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 
                  gap-6 
                  w-full sm:max-w-2xl md:max-w-4xl lg:max-w-full
                  mx-auto 
                  p-4 sm:p-6 md:p-8 
                  bg-white/30 
                  backdrop-blur-md 
                  rounded-2xl 
                  shadow-md
                ">

          {/* Username */}

          
          
          <div>
            <label className="block mb-1 font-medium">FirstName <span className="text-red-500">*</span></label>
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
            <label className="block mb-1 font-medium">LastName <span className="text-red-500">*</span></label>
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
            <label className="block mb-1 font-medium">Username <span className="text-red-500">*</span></label>
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
            <label className="block mb-1 font-medium">Select Gender <span className="text-red-500">*</span></label>
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
            <label className="block mb-1 font-medium">Phone number <span className="text-red-500">*</span></label>
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
            <label className="block mb-1 font-medium">Date Of Birth <span className="text-red-500">*</span></label>
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
            <label className="block mb-1 font-medium">Email <span className="text-red-500">*</span></label>
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
          <div className="relative">
      <label className="block mb-1 font-medium">Password <span className="text-red-500">*</span></label>
      <input
        type={showPassword ? "text" : "password"}
        name="password"
        value={formData.password}
        onChange={handleChange}
        required
        placeholder="Enter a password"
        className="w-full p-2 pr-10 border border-blue-400 bg-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        className="absolute right-3 top-12 transform -translate-y-1/2 text-gray-600 hover:text-blue-600"
      >
        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>

        <div className="relative">
      <label className="block mb-1 font-medium">Confirm Password <span className="text-red-500">*</span></label>
      <input
        type={showPassword ? "text" : "password"}
        name="cpassword"
        value={formData.password}
        onChange={handleChange}
        required
        placeholder="Re-enter the password"
        className={`w-full p-2 border ${
            error ? "border-red-500" : "border-blue-400"
          } bg-white/30 rounded-lg focus:outline-none focus:ring-2 ${
            error ? "focus:ring-red-500" : "focus:ring-blue-500"
          }`}
      />
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
      <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        className="absolute right-3 top-12 transform -translate-y-1/2 text-gray-600 hover:text-blue-600"
      >
        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>



          {/* <div>
        <label className="block mb-1 font-medium">Confirm Password</label>
        <input
          type="password"
          name="cpassword"
          value={formData.cpassword}
          onChange={handleChange}
          required
          placeholder="Re-enter the password"
          className={`w-full p-2 border ${
            error ? "border-red-500" : "border-blue-400"
          } bg-white/30 rounded-lg focus:outline-none focus:ring-2 ${
            error ? "focus:ring-red-500" : "focus:ring-blue-500"
          }`}
        />
        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
      </div>  */}

          {/* Role Selection */}
          <div>
            <label className="block mb-1 font-medium">Select Your Registration Role <span className="text-red-500">*</span></label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className="w-full p-2 border border-blue-400 rounded-lg bg-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>-- Select Role --</option>
              <option value="normal">Patient/User</option>
              <option value="doctor">Doctor</option>
              <option value="pharmacy">Pharmacy</option>
            </select>
          </div>

          <div></div>

          {/* Role-specific fields */}
          {renderExtraFields()}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-50 h-10 mb-10 bg-blue-600 hover:bg-blue-700 relative top-30 sm:hidden lg:block md:block right-250 md:top-10 md:right-205 sm:right-200 text-white font-semibold  ml-175  py-2 rounded-lg transition"
          >
            Sign Up 𓂃🖊
          </button>

          <button
            type="submit"
            className="w-50 h-10 mb-10 bg-blue-600 hover:bg-blue-700  md:hidden lg:hidden sm:block  relative right-142 text-white font-semibold  ml-175  py-2 rounded-lg transition"
          >
            Sign Up 𓂃🖊
          </button>
          
        </form>
        

        <p className="mt-15 text-center text-gray-600 text-sm ">
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
