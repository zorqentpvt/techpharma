import React from "react";
import jsPDF from "jspdf";

export interface OpChartData {
  id?: number;
  name?: string;
  date?: string;
  time?: string;
  diagnosis?: string;
  prescription?: string;
  notes?: string;
  doctor?: string;
}

interface OpChartProps {
  data?: OpChartData;
  open: boolean;
  onClose: () => void;
}

const OpChart: React.FC<OpChartProps> = ({ data = {}, open, onClose }) => {
  if (!open) return null;

  const downloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = 20;

    // Header with clinic name
    doc.setFillColor(0, 46, 110); // #002E6E
    doc.rect(0, 0, pageWidth, 40, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("TECHPHARMA", pageWidth / 2, 15, { align: "center" });
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.text("MEDICAL OP CHART", pageWidth / 2, 25, { align: "center" });
    
    doc.setFontSize(9);
    doc.text("Official Patient Record", pageWidth / 2, 33, { align: "center" });

    yPosition = 55;

    // Document ID and Date
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text(`Chart ID: ${data.id || "N/A"}`, margin, yPosition);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin, yPosition, { align: "right" });
    
    yPosition += 15;

    // Patient Information Section
    doc.setTextColor(0, 46, 110);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("PATIENT INFORMATION", margin, yPosition);
    yPosition += 8;

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Patient Details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Patient Name:", margin, yPosition);
    doc.setFont("helvetica", "normal");
    doc.text(data.name || "N/A", margin + 35, yPosition);
    yPosition += 10;

    doc.setFont("helvetica", "bold");
    doc.text("Date:", margin, yPosition);
    doc.setFont("helvetica", "normal");
    doc.text(data.date || "N/A", margin + 35, yPosition);
    
    doc.setFont("helvetica", "bold");
    doc.text("Time:", margin + 80, yPosition);
    doc.setFont("helvetica", "normal");
    doc.text(data.time || "N/A", margin + 95, yPosition);
    yPosition += 15;

    // Diagnosis Section
    doc.setTextColor(0, 46, 110);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DIAGNOSIS", margin, yPosition);
    yPosition += 8;

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const diagnosisLines = doc.splitTextToSize(data.diagnosis || "N/A", pageWidth - 2 * margin);
    doc.text(diagnosisLines, margin, yPosition);
    yPosition += diagnosisLines.length * 6 + 10;

    // Prescription Section
    doc.setTextColor(0, 46, 110);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("PRESCRIPTION", margin, yPosition);
    yPosition += 8;

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const prescriptionLines = doc.splitTextToSize(data.prescription || "N/A", pageWidth - 2 * margin);
    doc.text(prescriptionLines, margin, yPosition);
    yPosition += prescriptionLines.length * 6 + 10;

    // Doctor Notes Section
    doc.setTextColor(0, 46, 110);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DOCTOR NOTES", margin, yPosition);
    yPosition += 8;

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const notesLines = doc.splitTextToSize(data.notes || "N/A", pageWidth - 2 * margin);
    doc.text(notesLines, margin, yPosition);
    yPosition += notesLines.length * 6 + 15;

    // Doctor Signature Section
    if (data.doctor) {
      doc.setFont("helvetica", "bold");
      doc.text("Attending Physician:", margin, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(data.doctor, margin + 45, yPosition);
      yPosition += 10;
      
      doc.line(margin + 45, yPosition, margin + 120, yPosition);
      doc.setFontSize(8);
      doc.text("(Digital Signature)", margin + 60, yPosition + 5);
    }

    // Footer
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFillColor(240, 240, 240);
    doc.rect(0, pageHeight - 25, pageWidth, 25, "F");
    
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text("This is a computer-generated document and is valid without signature.", pageWidth / 2, pageHeight - 15, { align: "center" });
    doc.text("Confidential Medical Record - Handle with Care", pageWidth / 2, pageHeight - 9, { align: "center" });
    
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("TechPharma Medical Services", pageWidth / 2, pageHeight - 4, { align: "center" });

    // Save the PDF
    const fileName = `TechPharma_OP_Chart_${data.name?.replace(/\s+/g, "_") || "Patient"}_${data.date?.replace(/\//g, "-") || new Date().toLocaleDateString().replace(/\//g, "-")}.pdf`;
    doc.save(fileName);
  };

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
        
        {/* Download Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={downloadPDF}
            className="flex items-center gap-2 bg-[#002E6E] text-white px-4 py-2 rounded-lg hover:bg-[#003d8f] transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default OpChart;