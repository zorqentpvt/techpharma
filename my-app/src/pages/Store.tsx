import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { medicines, Medicine } from "../mock/medicines";

const getUserFromStorage = () => {
  const stored = localStorage.getItem("user");
  return stored ? JSON.parse(stored) : null;
};

export default function Store() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getUserFromStorage());
  const [medList, setMedList] = useState<Medicine[]>([]);
  const [name, setName] = useState("");
  const [stock, setStock] = useState<number>(0);
  const [contents, setContents] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user || user.role !== "pharmacy") navigate("/dashboard");
    else setMedList(medicines.filter((m) => m.pharmacy === user.username));
  }, [user, navigate]);

  if (!user) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAddOrUpdate = () => {
    if (!name || !contents || stock <= 0) return;

    if (editingIndex !== null) {
      const updated = [...medList];
      updated[editingIndex] = {
        ...updated[editingIndex],
        name,
        stock,
        contents,
        image: image || updated[editingIndex].image || null,
      };
      setMedList(updated);

      const globalIndex = medicines.findIndex(
        (m) => m.pharmacy === user.username && m.name === medList[editingIndex].name
      );
      if (globalIndex !== -1) medicines[globalIndex] = updated[editingIndex];

      setEditingIndex(null);
    } else {
      const newMed: Medicine = {
        name,
        pharmacy: user.username,
        stock,
        contents,
        image: image || null,
      };
      setMedList((prev) => [...prev, newMed]);
      medicines.push(newMed);
    }

    setName("");
    setStock(0);
    setContents("");
    setImage(null);
  };

  const handleEdit = (index: number) => {
    const med = medList[index];
    setName(med.name);
    setStock(med.stock);
    setContents(med.contents);
    setImage(med.image || null);
    setEditingIndex(index);
  };

  const handleDelete = (index: number) => {
    const med = medList[index];
    setMedList((prev) => prev.filter((_, i) => i !== index));

    const globalIndex = medicines.findIndex(
      (m) => m.pharmacy === user.username && m.name === med.name
    );
    if (globalIndex !== -1) medicines.splice(globalIndex, 1);
  };

  const filteredMed = medList.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-semibold text-gray-900">Medicine Inventory</h1>
        </div>

        {/* Add / Edit Form */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            {editingIndex !== null ? "Edit Medicine" : "Add New Medicine"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <input
              type="text"
              placeholder="Medicine Name"
              className="border border-gray-300 px-4 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="number"
              placeholder="Stock Quantity"
              className="border border-gray-300 px-4 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={stock}
              onChange={(e) => setStock(Number(e.target.value))}
            />
            <input
              type="text"
              placeholder="Contents / Composition"
              className="border border-gray-300 px-4 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={contents}
              onChange={(e) => setContents(e.target.value)}
            />
            <div className="flex flex-col items-start gap-2">
              <label className="flex items-center gap-2 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md text-sm transition">
                {image ? "Change Image" : "Upload Image"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
              {image && (
                <div className="mt-2 text-sm text-gray-700">
                  {typeof image === "string" ? image.split("/").pop() : "Selected file"}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddOrUpdate} variant="primary">
                {editingIndex !== null ? "Update" : "Add"}
              </Button>
              {editingIndex !== null && (
                <Button
                  onClick={() => {
                    setEditingIndex(null);
                    setName("");
                    setStock(0);
                    setContents("");
                    setImage(null);
                  }}
                  variant="secondary"
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search medicines..."
              className="w-full border border-gray-300 px-4 py-2 pl-10 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Medicines Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contents
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMed.length > 0 ? (
                filteredMed.map((med, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {med.image ? (
                        <img
                          src={med.image}
                          alt={med.name}
                          className="h-12 w-12 object-cover rounded-md border"
                        />
                      ) : (
                        <div className="h-12 w-12 bg-gray-100 flex items-center justify-center rounded-md text-gray-400 text-xs">
                          No Image
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {med.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          med.stock > 50
                            ? "bg-green-100 text-green-800"
                            : med.stock > 20
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {med.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{med.contents}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleEdit(idx)}
                          className="text-blue-600 hover:text-blue-800 font-medium transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(idx)}
                          className="text-red-600 hover:text-red-800 font-medium transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                    No medicines found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredMed.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredMed.length} {filteredMed.length === 1 ? "medicine" : "medicines"}
          </div>
        )}
      </div>
    </div>
  );
}
