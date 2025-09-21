import { useState, useEffect } from "react";
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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user || user.role !== "pharmacy") navigate("/dashboard");
    else setMedList(medicines.filter(m => m.pharmacy === user.username));
  }, [user, navigate]);

  if (!user) return null;

  const handleAddOrUpdate = () => {
    if (!name || !contents || stock <= 0) return;

    if (editingIndex !== null) {
      const updated = [...medList];
      updated[editingIndex] = {
        ...updated[editingIndex],
        name,
        stock,
        contents,
      };
      setMedList(updated);

      const globalIndex = medicines.findIndex(
        m =>
          m.pharmacy === user.username &&
          m.name === medList[editingIndex].name
      );
      if (globalIndex !== -1) medicines[globalIndex] = updated[editingIndex];

      setEditingIndex(null);
    } else {
      const newMed: Medicine = {
        name,
        pharmacy: user.username,
        stock,
        contents,
      };
      setMedList(prev => [...prev, newMed]);
      medicines.push(newMed);
    }

    setName("");
    setStock(0);
    setContents("");
  };

  const handleEdit = (index: number) => {
    const med = medList[index];
    setName(med.name);
    setStock(med.stock);
    setContents(med.contents);
    setEditingIndex(index);
  };

  const handleDelete = (index: number) => {
    const med = medList[index];
    setMedList(prev => prev.filter((_, i) => i !== index));

    const globalIndex = medicines.findIndex(
      m => m.pharmacy === user.username && m.name === med.name
    );
    if (globalIndex !== -1) medicines.splice(globalIndex, 1);
  };

  const filteredMed = medList.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-6 text-blue-900">
        Manage Medicines
      </h1>

      {/* Add / Edit Form */}
      <div className="mb-8 bg-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          {editingIndex !== null ? "✏️ Edit Medicine" : "➕ Add Medicine"}
        </h2>
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Medicine Name"
            className="border p-3 rounded-lg flex-1 focus:ring-2 focus:ring-blue-400"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <input
            type="number"
            placeholder="Stock"
            className="border p-3 rounded-lg w-32 focus:ring-2 focus:ring-blue-400"
            value={stock}
            onChange={e => setStock(Number(e.target.value))}
          />
          <input
            type="text"
            placeholder="Contents"
            className="border p-3 rounded-lg flex-1 focus:ring-2 focus:ring-blue-400"
            value={contents}
            onChange={e => setContents(e.target.value)}
          />
          <Button onClick={handleAddOrUpdate} variant="primary">
            {editingIndex !== null ? "Update ✅" : "Add "}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-8 flex gap-4">
        <input
          type="text"
          placeholder="🔍 Search medicine..."
          className="border p-3 rounded-lg flex-1 focus:ring-2 focus:ring-blue-400"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <Button onClick={() => setSearch("")} variant="secondary">
          Clear ❌
        </Button>
      </div>

      {/* Medicines List */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredMed.length > 0 ? (
          filteredMed.map((med, idx) => (
            <div
              key={idx}
              className="p-6 bg-white rounded-2xl shadow hover:shadow-xl transition flex flex-col gap-2"
            >
              <h3 className="font-semibold text-lg text-blue-800">{med.name}</h3>
              <p className="text-gray-700"> Stock: {med.stock}</p>
              <p className="text-gray-600"> Contents: {med.contents}</p>
              <div className="flex gap-2 mt-4">
                <Button onClick={() => handleEdit(idx)} variant="primary">
                  Edit 
                </Button>
                <Button onClick={() => handleDelete(idx)} variant="danger">
                  Delete 
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 col-span-full text-center">
            No medicines found.
          </p>
        )}
      </div>
    </div>
  );
}
