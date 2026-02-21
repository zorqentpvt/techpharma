import React, { useEffect, useState } from "react";
import { FaPlus, FaMotorcycle, FaIdCard, FaUser, FaEdit, FaTrash } from "react-icons/fa";

const BASE_URL = "http://localhost:8080";

interface DeliveryAgent {
  id: string;
  vehicleNumber: string;
  licenseNumber: string;
  status: string;
  isAvailable: boolean;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    avatar?: string;
  };
}

// Utility to correctly resolve image URLs
const resolveImageUrl = (img: string | undefined | null): string => {
  if (!img) return "";
  if (img.startsWith("data:")) return img;
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  return `${BASE_URL}/${img.replace(/^\/?/, "")}`;
};

export default function DeliveryAgents() {
  const [agents, setAgents] = useState<DeliveryAgent[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<DeliveryAgent | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    vehicleNumber: "",
    licenseNumber: "",
  });

  const fetchAgents = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/pharmacy/delivery-agents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setAgents(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingAgent 
        ? `${BASE_URL}/api/pharmacy/delivery-agents/${editingAgent.id}`
        : `${BASE_URL}/api/pharmacy/delivery-agents`;
      
      const method = editingAgent ? "PUT" : "POST";
      
      // For update, we only send vehicle and license numbers
      const body = editingAgent 
        ? JSON.stringify({ vehicleNumber: formData.vehicleNumber, licenseNumber: formData.licenseNumber })
        : JSON.stringify(formData);

      const token = localStorage.getItem("token");
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body,
      });

      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setEditingAgent(null);
        fetchAgents();
        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phoneNumber: "",
          password: "",
          vehicleNumber: "",
          licenseNumber: "",
        });
      } else {
        alert(data.message || "Failed to add agent");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEdit = (agent: DeliveryAgent) => {
    setEditingAgent(agent);
    setFormData({
      firstName: agent.user.firstName,
      lastName: agent.user.lastName,
      email: agent.user.email,
      phoneNumber: agent.user.phoneNumber,
      password: "", // Password not editable here
      vehicleNumber: agent.vehicleNumber,
      licenseNumber: agent.licenseNumber,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this agent?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/pharmacy/delivery-agents/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        fetchAgents();
      } else {
        alert(data.message || "Failed to delete agent");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openAddModal = () => {
    setEditingAgent(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      password: "",
      vehicleNumber: "",
      licenseNumber: "",
    });
    setShowModal(true);
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#002E6E]">Delivery Agents</h1>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-[#002E6E] text-white px-4 py-2 rounded-lg hover:bg-[#0043A4] transition"
        >
          <FaPlus /> Add Agent
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <div key={agent.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-4 mb-4">
                {agent.user.avatar ? (
                  <img 
                    src={resolveImageUrl(agent.user.avatar)} 
                    alt="Agent" 
                    className="w-12 h-12 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-[#002E6E]">
                    <FaUser size={20} />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-lg">
                    {agent.user.firstName} {agent.user.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">{agent.user.phoneNumber}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <FaMotorcycle className="text-gray-400" />
                  <span>{agent.vehicleNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaIdCard className="text-gray-400" />
                  <span>{agent.licenseNumber}</span>
                </div>
                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      agent.status === "online"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {agent.status.toUpperCase()}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(agent)} className="text-blue-600 hover:text-blue-800 p-1">
                      <FaEdit />
                    </button>
                    <button onClick={() => handleDelete(agent.id)} className="text-red-600 hover:text-red-800 p-1">
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingAgent ? "Edit Agent" : "Add New Agent"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingAgent && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <input name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} required className="border p-2 rounded" />
                    <input name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} required className="border p-2 rounded" />
                  </div>
                  <input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} required className="w-full border p-2 rounded" />
                  <input name="phoneNumber" placeholder="Phone" value={formData.phoneNumber} onChange={handleChange} required className="w-full border p-2 rounded" />
                  <input name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} required className="w-full border p-2 rounded" />
                </>
              )}
              
              <input name="vehicleNumber" placeholder="Vehicle Number" value={formData.vehicleNumber} onChange={handleChange} required className="w-full border p-2 rounded" />
              <input name="licenseNumber" placeholder="License Number" value={formData.licenseNumber} onChange={handleChange} required className="w-full border p-2 rounded" />
              
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 py-2 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 bg-[#002E6E] text-white py-2 rounded hover:bg-[#0043A4]">
                  {editingAgent ? "Update" : "Add Agent"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}