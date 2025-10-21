import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { Medicine } from "../mock/medicines";
import {
  addMedicine,
  updateMedicine,
  deleteMedicine,
  fetchMedicines,
} from "../api/pharmastoreapi";

const BASE_URL = "http://localhost:8080";

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
  const [price, setPrice] = useState<number>(0);
  const [contents, setContents] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [prescriptionRequired, setPrescriptionRequired] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "pharmacy") {
      navigate("/dashboard");
    } else {
      const fetchMed = async () => {
        try {
          const res = await fetchMedicines();
          if (res?.success && Array.isArray(res.data)) {
            const mapped = res.data.map((m: any) => ({
              id: m.id,
              name: m.name,
              contents: m.content,
              description: m.description,
              stock: m.quantity,
              price: m.price,
              prescriptionRequired: m.prescriptionRequired,
              image: m.image || "",
            }));
            setMedList(mapped);
          }
        } catch (err) {
          console.error("❌ Error fetching medicines:", err);
        }
      };
      fetchMed();
    }
  }, [user, navigate]);

  if (!user) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImage(file);
  };

  const resetForm = () => {
    setName("");
    setStock(0);
    setPrice(0);
    setContents("");
    setDescription("");
    setImage(null);
    setPrescriptionRequired(false);
    setEditingId(null);
  };

  // ✅ FIXED: handleAdd now safely accesses res.data and prevents blank screen
  const handleAdd = async () => {
    if (!name || !contents || stock <= 0 || price <= 0) return;
    try {
      const res = await addMedicine({
        name,
        content: contents,
        quantity: stock,
        price,
        description,
        image: image || undefined,
        prescriptionRequired,
      });

      const created = res?.data;
      if (!created?.name) {
        console.error("⚠️ Invalid medicine data returned:", res);
        return;
      }

      setMedList((prev) => [
        ...prev,
        {
          id: created.id,
          name: created.name,
          contents: created.content,
          description: created.description,
          stock: created.quantity,
          price: created.price,
          prescriptionRequired: created.prescriptionRequired,
          image: created.image || "",
        },
      ]);

      resetForm();
    } catch (err) {
      console.error("❌ Failed to add medicine:", err);
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    try {
      const res = await updateMedicine(editingId, {
        name,
        content: contents,
        quantity: stock,
        price,
        description,
        image: image || undefined,
        prescriptionRequired,
      });
      const updated = res?.data || res;

      setMedList((prev) =>
        prev.map((med) =>
          med.id === editingId
            ? {
                ...med,
                name: updated.name,
                contents: updated.content,
                description: updated.description,
                stock: updated.quantity,
                price: updated.price,
                prescriptionRequired: updated.prescriptionRequired,
                image: updated.image || med.image,
              }
            : med
        )
      );
      resetForm();
    } catch (err) {
      console.error("❌ Failed to update medicine:", err);
    }
  };

  const handleEdit = (id: string) => {
    const med = medList.find((m) => m.id === id);
    if (!med) return;
    setName(med.name);
    setStock(med.stock);
    setPrice(med.price);
    setContents(med.contents);
    setDescription(med.description || "");
    setImage(null);
    setPrescriptionRequired(med.prescriptionRequired || false);
    setEditingId(id);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMedicine(id);
      setMedList((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error("❌ Failed to delete medicine:", err);
    }
  };

  // ✅ FIXED: Optional chaining avoids crash if name is undefined
  const filteredMed = medList.filter((m) =>
    m.name?.toLowerCase().includes(search.toLowerCase())
  );

  const resolveImageUrl = (img: string | File | null) => {
    if (!img) return "";
    if (typeof img === "string") {
      return img.startsWith("http")
        ? img
        : `${BASE_URL}/${img.replace(/^\/?/, "")}`;
    }
    return URL.createObjectURL(img);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-semibold text-gray-900 mb-6">
          Medicine Inventory
        </h1>

        {/* Add/Edit Form */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            {editingId ? "Edit Medicine" : "Add New Medicine"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-8 gap-4 items-end">
            <input
              type="text"
              placeholder="Medicine Name"
              className="border border-gray-300 px-4 py-2 rounded-md text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="number"
              placeholder="Price"
              className="border border-gray-300 px-4 py-2 rounded-md text-sm"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
            <input
              type="number"
              placeholder="Stock Quantity"
              className="border border-gray-300 px-4 py-2 rounded-md text-sm"
              value={stock}
              onChange={(e) => setStock(Number(e.target.value))}
            />
            <input
              type="text"
              placeholder="Contents / Composition"
              className="border border-gray-300 px-4 py-2 rounded-md text-sm"
              value={contents}
              onChange={(e) => setContents(e.target.value)}
            />
            <input
              type="text"
              placeholder="Description"
              className="border border-gray-300 px-4 py-2 rounded-md text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="prescription"
                checked={prescriptionRequired}
                onChange={(e) => setPrescriptionRequired(e.target.checked)}
              />
              <label htmlFor="prescription" className="text-sm text-gray-700">
                Prescription Required
              </label>
            </div>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition">
                {image ? "Change Image" : "Upload Image"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
              {image && (
                <div className="text-xs text-gray-600 truncate w-32">
                  {image.name}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {editingId ? (
                <>
                  <Button onClick={handleUpdate} variant="primary">
                    Update
                  </Button>
                  <Button onClick={resetForm} variant="secondary">
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={handleAdd} variant="primary">
                  Add
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search medicines..."
            className="border border-gray-300 px-4 py-2 rounded-md text-sm w-full md:w-96"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contents
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prescription
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMed.length > 0 ? (
                filteredMed.map((med) => (
                  <tr key={med.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      {med.image ? (
                        <img
                          src={resolveImageUrl(med.image)}
                          alt={med.name}
                          className="h-12 w-12 object-cover rounded-md border"
                        />
                      ) : (
                        <div className="h-12 w-12 bg-gray-100 flex items-center justify-center rounded-md text-gray-400 text-xs">
                          No Image
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {med.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      ${med.price}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {med.stock}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {med.contents}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {med.description || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {med.prescriptionRequired ? "Yes" : "No"}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(med.id)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(med.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-sm text-gray-500"
                  >
                    No medicines found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
