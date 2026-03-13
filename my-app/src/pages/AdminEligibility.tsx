import React, { useState, useEffect } from "react";
import { getEligibilityRequests, approveEligibility, rejectEligibility } from "../api/freeMedicineApi";
import { Check, X, Eye } from "lucide-react";

const BASE_URL = "http://localhost:8080";

const resolveImageUrl = (img: string | undefined | null): string => {
  if (!img) return "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
  if (img.startsWith("data:")) return img;
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  return `${BASE_URL}/${img.replace(/^\/?/, "")}`;
};

export default function AdminEligibility() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [filter, setFilter] = useState("all");

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await getEligibilityRequests(filter === "all" ? undefined : filter);
      // Filter only pending requests for action, or show all if needed
      if (res.success) {
        setRequests(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const handleApprove = async (id: string) => {
    if (!window.confirm("Approve this eligibility request?")) return;
    setProcessingId(id);
    try {
      const res = await approveEligibility(id);
      if (res.success) {
        alert("Approved successfully");
        fetchRequests();
      } else {
        alert("Failed: " + res.message);
      }
    } catch (err) {
      alert("Error processing request");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;
    setProcessingId(id);
    try {
      const res = await rejectEligibility(id, reason);
      if (res.success) {
        alert("Rejected successfully");
        fetchRequests();
      } else {
        alert("Failed: " + res.message);
      }
    } catch (err) {
      alert("Error processing request");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading requests...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-[#002E6E]">Eligibility Approvals</h1>
          <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
            {["all", "pending", "approved", "rejected"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-all ${
                  filter === f
                    ? "bg-[#002E6E] text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {requests.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No pending eligibility requests found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-4 px-6 font-medium text-gray-500">User</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-500">Scheme Info</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-500">Document</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-500">Status</th>
                    <th className="text-right py-4 px-6 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {requests.map((req: any) => (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="font-medium">{req.user?.firstName} {req.user?.lastName}</div>
                        <div className="text-xs text-gray-500">{req.user?.email}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="capitalize font-medium">{req.schemeType.replace(/_/g, " ")}</div>
                        {req.medicalCondition && <div className="text-xs text-gray-500">Cond: {req.medicalCondition}</div>}
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm">{req.documentType}</div>
                        <div className="text-xs text-gray-500 font-mono">{req.documentNumber}</div>
                        {req.documentUrl && (
                          <a href={req.documentUrl.startsWith("http") ? req.documentUrl : `${BASE_URL}/${req.documentUrl}`} target="_blank" rel="noreferrer" className="text-blue-600 text-xs hover:underline">View Doc</a>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : req.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setSelectedRequest(req)}
                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          {req.status === "pending" && (
                            <>
                            <button 
                              onClick={() => handleApprove(req.id)} 
                              disabled={processingId === req.id}
                              className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition disabled:opacity-50"
                            >
                              <Check size={18} />
                            </button>
                            <button 
                              onClick={() => handleReject(req.id)}
                              disabled={processingId === req.id}
                              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition disabled:opacity-50"
                            >
                              <X size={18} />
                            </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* View Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
              <div className="bg-[#002E6E] px-6 py-4 flex justify-between items-center shrink-0">
                <h2 className="text-xl font-bold text-white">Eligibility Details</h2>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-white/80 hover:text-white transition"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto">
                {/* Patient Info */}
                <div className="flex items-center gap-5 border-b pb-6">
                  <img
                    src={resolveImageUrl(selectedRequest.user?.avatar)}
                    alt="Patient"
                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-100 shadow-sm"
                  />
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">
                      {selectedRequest.user?.firstName} {selectedRequest.user?.lastName}
                    </h3>
                    <div className="text-gray-500 mt-1 flex flex-col text-sm">
                      <span>{selectedRequest.user?.email}</span>
                      <span>{selectedRequest.user?.phoneNumber || "No phone number"}</span>
                    </div>
                  </div>
                </div>

                {/* Grid Info */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Medical Scheme</h4>
                    <p className="font-medium text-gray-900 capitalize">{selectedRequest.schemeType?.replace(/_/g, " ")}</p>
                    <p className="text-sm text-gray-600">Condition: {selectedRequest.medicalCondition || "N/A"}</p>
                    <p className="text-sm text-gray-600">Diagnosis: {selectedRequest.diagnosisDate ? new Date(selectedRequest.diagnosisDate).toLocaleDateString() : "N/A"}</p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Document</h4>
                    <p className="font-medium text-gray-900 capitalize">{selectedRequest.documentType?.replace(/_/g, " ")}</p>
                    <p className="text-sm text-gray-600">No: {selectedRequest.documentNumber}</p>
                  </div>
                </div>

                {selectedRequest.documentUrl ? (
                  <div className="mt-4 border rounded-xl overflow-hidden bg-gray-100 h-[500px]">
                    <iframe 
                      src={selectedRequest.documentUrl.startsWith("http") ? selectedRequest.documentUrl : `${BASE_URL}/${selectedRequest.documentUrl.replace(/^\/+/, "")}`}
                      className="w-full h-full"
                      title="Document Preview"
                    />
                  </div>
                ) : (
                  <div className="mt-4 p-8 text-center bg-gray-50 rounded-xl text-gray-500">No document attached</div>
                )}

                {/* Status & Actions */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-500">Status</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      selectedRequest.status === "approved" ? "bg-green-100 text-green-700" :
                      selectedRequest.status === "rejected" ? "bg-red-100 text-red-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {selectedRequest.status}
                    </span>
                  </div>
                  
                  {selectedRequest.status === "rejected" && (
                    <p className="text-sm text-red-600">Reason: {selectedRequest.rejectionReason}</p>
                  )}

                  {selectedRequest.status === "pending" && (
                    <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => {
                          handleReject(selectedRequest.id);
                          setSelectedRequest(null);
                        }}
                        className="flex-1 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium transition"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => {
                          handleApprove(selectedRequest.id);
                          setSelectedRequest(null);
                        }}
                        className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition"
                      >
                        Approve
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}