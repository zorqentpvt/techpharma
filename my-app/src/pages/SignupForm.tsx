import { useLocation } from "react-router-dom";
import React from "react";

const SignupForm = () => {
  const { state } = useLocation();
  const { username, email, password, role } = state || {};

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-2xl shadow">
      <h2 className="text-xl font-bold mb-4 text-center">Signup Details</h2>

      <form className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Username</label>
          <input
            type="text"
            value={username || ""}
            disabled
            className="w-full p-2 border rounded bg-gray-100"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Email</label>
          <input
            type="email"
            value={email || ""}
            disabled
            className="w-full p-2 border rounded bg-gray-100"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Password</label>
          <input
            type="password"
            value={password || ""}
            disabled
            className="w-full p-2 border rounded bg-gray-100"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Role</label>
          <input
            type="text"
            value={role || ""}
            disabled
            className="w-full p-2 border rounded bg-gray-100"
          />
        </div>
      </form>
    </div>
  );
};

export default SignupForm;
