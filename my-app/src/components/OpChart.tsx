import React from "react";

export interface OpChartData {
  id?: number;
  name?: string;
  date?: string;
  time?: string;
  diagnosis?: string;
  prescription?: string;
  notes?: string;
}

interface OpChartProps {
  data?: OpChartData;
  open: boolean;
  onClose: () => void;
}

const OpChart: React.FC<OpChartProps> = ({ data = {}, open, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-500 hover:text-gray-700 text-xl"
        >
          ✕
        </button>
        <h2 className="text-xl font-semibold text-[#002E6E] mb-4">
          OP Chart (View Only)
        </h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Patient Name
            </label>
            <input
              type="text"
              value={data.name || ""}
              readOnly
              className="w-full mt-1 px-3 py-2 rounded-md border border-gray-200 bg-gray-50"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600">
                Date
              </label>
              <input
                type="text"
                value={data.date || ""}
                readOnly
                className="w-full mt-1 px-3 py-2 rounded-md border border-gray-200 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">
                Time
              </label>
              <input
                type="text"
                value={data.time || ""}
                readOnly
                className="w-full mt-1 px-3 py-2 rounded-md border border-gray-200 bg-gray-50"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Diagnosis
            </label>
            <textarea
              value={data.diagnosis || ""}
              readOnly
              className="w-full mt-1 px-3 py-2 rounded-md border border-gray-200 bg-gray-50 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Prescription
            </label>
            <textarea
              value={data.prescription || ""}
              readOnly
              className="w-full mt-1 px-3 py-2 rounded-md border border-gray-200 bg-gray-50 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Doctor Notes
            </label>
            <textarea
              value={data.notes || ""}
              readOnly
              className="w-full mt-1 px-3 py-2 rounded-md border border-gray-200 bg-gray-50 resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpChart;
