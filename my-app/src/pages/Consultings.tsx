// Consultings.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import OpChart, { OpChartData } from "../components/OpChart"; // Assuming OpChart is in components
import { fetchConsultations, fetchPatientConsultations, Consultation } from "../api/docApi";

interface User {
  username: string;
  role: string;
}

export default function Consultings() {
  const navigate = useNavigate();
  const user: User = JSON.parse(localStorage.getItem("user") || "{}");

  const [upcomingConsultations, setUpcomingConsultations] = useState<Consultation[]>([]);
  const [historyConsultations, setHistoryConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showOpChart, setShowOpChart] = useState(false);
  const [opChartData, setOpChartData] = useState<OpChartData>({});

  // Fetch consultations
  useEffect(() => {
    const loadConsultations = async () => {
      try {
        setLoading(true);
        setError(null);

        let response;
        if (user.role === "normal") {
          response = await fetchPatientConsultations();
        } else {
          response = await fetchConsultations();
        }

        console.log("API Response:", response);

        if (response.success && response.data) {
          const now = new Date();

          const upcoming: Consultation[] = [];
          const history: Consultation[] = [];

          // Process upcoming consultations
          (response.data.upcoming || []).forEach((c) => {
            const consultationDateTime = new Date(`${c.date}T${c.time}`);
            const diffHours = (now.getTime() - consultationDateTime.getTime()) / (1000 * 60 * 60);

            if (diffHours > 2.5) {
              // Move to history if more than 2.5 hours past
              if (c.status !== "confirmed") history.push(c);
            } else {
              upcoming.push(c);
            }
          });

          // Process history consultations
          (response.data.history || []).forEach((c) => {
            if (c.status !== "confirmed") {
              history.push(c);
            }
          });

          setUpcomingConsultations(upcoming);
          setHistoryConsultations(history);
        } else {
          setError("Failed to load consultations.");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load consultations. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadConsultations();
  }, []);

const handleJoinCall = (consultation) => {
  console.log("Joining call for consultation:", consultation);

  navigate("/videocall", {
    state: consultation,
  });
};




  const handleViewOpChart = (consultation?: Consultation, isUpcoming = false) => {
    if (isUpcoming) {
      setOpChartData({});
    } else if (consultation) {
      setOpChartData({
        name: consultation.name,
        time: consultation.opChart.time,
        date: consultation.opChart.date,
        diagnosis: consultation.opChart.diagnosis,
        prescription: consultation.opChart.prescription,
        notes: consultation.opChart.doctorNotes,
      });
    }
    setShowOpChart(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      confirmed: { bg: "bg-green-100", text: "text-green-700", label: "Confirmed" },
      cancelled: { bg: "bg-red-100", text: "text-red-700", label: "Cancelled" },
      consulted: { bg: "bg-blue-100", text: "text-blue-700", label: "Consulted" },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || { bg: "bg-gray-100", text: "text-gray-700", label: status };
    return <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>{config.label}</span>;
  };

  const SectionCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
      <h3 className="text-lg font-semibold text-[#002E6E] mb-4">{title}</h3>
      {children}
    </div>
  );

  const renderConsultationList = (consultations: Consultation[], isUpcoming: boolean) => (
    <ul className="divide-y divide-gray-100">
      {consultations.map((c) => (
        <li key={c.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-gray-800">{c.name}</span>
              {getStatusBadge(c.status)}
            </div>
            <div className="text-gray-500 text-sm">
              {c.date}, {c.time}
              {c.reason && <span className="ml-2 text-gray-400">• {c.reason}</span>}
              {c.mode && <span className="ml-2 text-gray-400">• {c.mode === "online" ? "🌐 Online" : "🏥 Offline"}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            {isUpcoming && c.status === "confirmed" && c.mode === "online" && (
              <button
                onClick={() => handleJoinCall(c)}
                className="px-4 py-1.5 rounded-md text-sm font-medium text-white bg-[#002E6E] hover:bg-[#0043A4] transition"
              >
                Join Call
              </button>
            )}
            <button
              onClick={() => handleViewOpChart(c, isUpcoming)}
              className="px-4 py-1.5 rounded-md text-sm font-medium text-[#002E6E] border border-[#002E6E] hover:bg-[#f0f4ff] transition"
            >
              View OP Chart
            </button>
          </div>
        </li>
      ))}
    </ul>
  );

  const renderSection = () => {
    if (loading) {
      return (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#002E6E]"></div>
          <p className="mt-4 text-gray-600">Loading consultations...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      );
    }

    if (user.role !== "doctor" && user.role !== "normal") {
      return <div className="text-center text-gray-500">Unknown role — please log in again.</div>;
    }

    return (
      <>
        <SectionCard title="Upcoming Consultations">
          {upcomingConsultations.length ? renderConsultationList(upcomingConsultations, true) : <p className="text-gray-500 text-center py-4">No upcoming consultations</p>}
        </SectionCard>

        <SectionCard title="Consultation History">
          {historyConsultations.length ? renderConsultationList(historyConsultations, false) : <p className="text-gray-500 text-center py-4">No consultation history</p>}
        </SectionCard>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] px-4 py-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#002E6E]">🧑‍⚕️ Consultations</h1>
        <h2 className="text-sm sm:text-base font-medium text-[#002E6E]">Welcome {user.username || "Guest"}</h2>
      </header>

      {renderSection()}

      <OpChart open={showOpChart} data={opChartData} onClose={() => setShowOpChart(false)} />
    </div>
  );
}
