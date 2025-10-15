import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import OpChart, { OpChartData } from "../components/OpChart";

interface User {
  username: string;
  role: string;
}

interface Consultation extends OpChartData {
  id: number;
}

export default function Consultings() {
  const navigate = useNavigate();
  const user: User = JSON.parse(localStorage.getItem("user") || "{}");

  const upcomingConsultations: Consultation[] = [
    { id: 1, name: "John Doe", time: "4:00 PM", date: "Today" },
    { id: 2, name: "Sarah Lee", time: "5:30 PM", date: "Today" },
  ];

  const historyConsultations: Consultation[] = [
    {
      id: 3,
      name: "Emily Davis",
      time: "3:00 PM",
      date: "Oct 10",
      diagnosis: "Migraine",
      prescription: "Sumatriptan 50mg",
      notes: "Follow up in 1 week.",
    },
    {
      id: 4,
      name: "Michael Scott",
      time: "11:00 AM",
      date: "Oct 12",
      diagnosis: "High BP",
      prescription: "Amlodipine 5mg daily",
      notes: "Monitor BP at home.",
    },
  ];

  const [showOpChart, setShowOpChart] = useState(false);
  const [opChartData, setOpChartData] = useState<OpChartData>({});

  const handleJoinCall = () => {
    alert("Joining video consultation...");
  };

  const handleViewOpChart = (consultation?: Consultation, isUpcoming = false) => {
    if (isUpcoming) {
      setOpChartData({}); // always empty for upcoming
    } else if (consultation) {
      setOpChartData(consultation);
    }
    setShowOpChart(true);
  };

  const SectionCard: React.FC<{ title: string; children: React.ReactNode }> = ({
    title,
    children,
  }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
      <h3 className="text-lg font-semibold text-[#002E6E] mb-4">{title}</h3>
      {children}
    </div>
  );

  const renderConsultationList = (
    consultations: Consultation[],
    isUpcoming: boolean
  ) => (
    <ul className="divide-y divide-gray-100">
      {consultations.map((c) => (
        <li
          key={c.id}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 gap-2"
        >
          <div className="text-gray-800">
            <span className="font-medium">{c.name}</span>{" "}
            <span className="text-gray-500 text-sm">
              — {c.date}, {c.time}
            </span>
          </div>
          <div className="flex gap-2">
            {isUpcoming && (
              <button
                onClick={handleJoinCall}
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
    switch (user.role) {
      case "doctor":
      case "normal":
        return (
          <>
            <SectionCard title="Upcoming Consultations">
              {renderConsultationList(upcomingConsultations, true)}
            </SectionCard>

            <SectionCard title="Consultation History">
              {renderConsultationList(historyConsultations, false)}
            </SectionCard>
          </>
        );

      default:
        return (
          <div className="text-center text-gray-500">
            Unknown role — please log in again.
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] px-4 py-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#002E6E]">
          🧑‍⚕️ Consultations
        </h1>
        <h2 className="text-sm sm:text-base font-medium text-[#002E6E]">
          Welcome {user.username || "Guest"}
        </h2>
      </header>

      {renderSection()}

      <OpChart open={showOpChart} data={opChartData} onClose={() => setShowOpChart(false)} />
    </div>
  );
}
