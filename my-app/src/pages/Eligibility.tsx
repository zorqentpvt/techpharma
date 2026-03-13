import React, { useState, useEffect } from "react";
import { applyForEligibility, getMyEligibility } from "../api/freeMedicineApi";
import { Upload, X } from "lucide-react";

export default function Eligibility() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    schemeType: "cancer_patient",
    documentType: "medical_report",
    documentNumber: "",
    medicalCondition: "",
    diagnosisDate: "",
    bplCardNumber: "",
    bplState: "",
    validFrom: new Date().toISOString().split("T")[0],
    validUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
  });

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await getMyEligibility();
      if (res.success) {
        setRecords(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = new FormData();
      payload.append("schemeType", formData.schemeType);
      payload.append("documentType", formData.documentType);
      payload.append("documentNumber", formData.documentNumber);
      
      if (formData.medicalCondition) payload.append("medicalCondition", formData.medicalCondition);
      if (formData.diagnosisDate) payload.append("diagnosisDate", new Date(formData.diagnosisDate).toISOString());
      if (formData.bplCardNumber) payload.append("bplCardNumber", formData.bplCardNumber);
      if (formData.bplState) payload.append("bplState", formData.bplState);
      
      payload.append("validFrom", new Date(formData.validFrom).toISOString());
      payload.append("validUntil", new Date(formData.validUntil).toISOString());

      if (selectedFile) {
        payload.append("document", selectedFile);
      }

      const res = await applyForEligibility(payload as any);
      if (res.success) {
        alert("Application submitted successfully!");
        setShowForm(false);
        setSelectedFile(null);
        fetchRecords();
      } else {
        alert("Failed: " + res.message);
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting application");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-700";
      case "rejected": return "bg-red-100 text-red-700";
      case "pending": return "bg-yellow-100 text-yellow-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#002E6E]">Free Medicine Eligibility</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-[#002E6E] text-white px-6 py-2 rounded-lg hover:bg-[#0043A4] transition"
          >
            {showForm ? "View My Requests" : "Apply for Eligibility"}
          </button>
        </div>

        {showForm ? (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-6 text-gray-800">Eligibility Application Form</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Scheme Type</label>
                  <select name="schemeType" value={formData.schemeType} onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="cancer_patient">Cancer Patient Support</option>
                    <option value="kidney_patient">Kidney Patient Support</option>
                    <option value="bpl_card">BPL Card Holder</option>
                    <option value="government_scheme">Government Scheme</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
                  <select name="documentType" value={formData.documentType} onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="medical_report">Medical Report</option>
                    <option value="bpl_card">BPL Card</option>
                    <option value="aadhaar">Aadhaar Card</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Document Number</label>
                  <input required type="text" name="documentNumber" value={formData.documentNumber} onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g. Report ID or Card No." />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload Document</label>
                  <div className="flex items-center gap-2">
                    <label className="flex flex-1 items-center gap-2 cursor-pointer bg-white border border-gray-300 text-gray-600 px-4 py-3 rounded-lg hover:bg-gray-50 transition border-dashed">
                      <Upload size={18} />
                      <span className="text-sm truncate">
                        {selectedFile ? selectedFile.name : "Choose File (PDF/Image)"}
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                      />
                    </label>
                    {selectedFile && (
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="p-3 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition"
                        title="Remove file"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                </div>

                {["cancer_patient", "kidney_patient"].includes(formData.schemeType) && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Medical Condition</label>
                      <input required type="text" name="medicalCondition" value={formData.medicalCondition} onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Diagnosis Details" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Diagnosis Date</label>
                      <input required type="date" name="diagnosisDate" value={formData.diagnosisDate} onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </>
                )}

                {formData.schemeType === "bpl_card" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">BPL Card Number</label>
                      <input required type="text" name="bplCardNumber" value={formData.bplCardNumber} onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">BPL State</label>
                      <input required type="text" name="bplState" value={formData.bplState} onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Valid From</label>
                  <input type="date" name="validFrom" value={formData.validFrom} onChange={handleChange} className="w-full p-3 border rounded-lg bg-gray-50" readOnly />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Valid Until</label>
                  <input type="date" name="validUntil" value={formData.validUntil} onChange={handleChange} className="w-full p-3 border rounded-lg bg-gray-50" readOnly />
                </div>

              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition">Cancel</button>
                <button type="submit" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">Submit Application</button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading records...</div>
            ) : records.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <p className="text-lg">No eligibility records found.</p>
                <p className="text-sm mt-2">Apply now to avail free medicine benefits.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left py-4 px-6 font-medium text-gray-500">Scheme</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-500">Document</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-500">Applied On</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-500">Status</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-500">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {records.map((rec: any) => (
                      <tr key={rec.id} className="hover:bg-gray-50">
                        <td className="py-4 px-6 capitalize">{rec.schemeType.replace(/_/g, " ")}</td>
                        <td className="py-4 px-6">
                          <div className="text-sm font-medium">{rec.documentType.replace(/_/g, " ")}</div>
                          <div className="text-xs text-gray-500">{rec.documentNumber}</div>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600">
                          {new Date(rec.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${getStatusColor(rec.status)}`}>
                            {rec.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600">
                          {rec.status === "rejected" && (
                            <div className="text-red-600 text-xs">Reason: {rec.rejectionReason}</div>
                          )}
                          {rec.status === "approved" && (
                            <div className="text-green-600 text-xs">Valid until: {new Date(rec.validUntil).toLocaleDateString()}</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}