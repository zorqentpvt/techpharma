import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AnalyticsComponent from "../components/AnalyticsComponent";
import "../index.css";
import { motion, AnimatePresence } from "framer-motion";

interface User {
  username: string;
  role: string;
}

interface Reminder {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  repeatDays: string[]; // ["Mon", "Tue", ...]
}

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Home() {
  const navigate = useNavigate();
  const user: User = JSON.parse(localStorage.getItem("user") || "{}");

  // ✅ Health Tips (auto changing)
  const tips: string[] = [
    "Stay hydrated! Drink at least 8 glasses of water a day.",
    "Get at least 7–8 hours of sleep for better recovery.",
    "Take short breaks when working or studying to rest your eyes.",
    "Eat more fruits and vegetables for essential nutrients.",
    "Exercise at least 30 minutes a day to stay active.",
  ];

  const [currentTipIndex, setCurrentTipIndex] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % tips.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [tips.length]);

  // ✅ Reminder logic
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const stored = localStorage.getItem("reminders");
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      return parsed.map((r: any) => ({
        id: r.id,
        title: r.title || "",
        date: r.date || "",
        time: r.time || "",
        repeatDays: Array.isArray(r.repeatDays) ? r.repeatDays : [],
      }));
    } catch {
      return [];
    }
  });

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [repeatDays, setRepeatDays] = useState<string[]>([]);

  // Schedule Notifications
  const scheduleNotification = (reminder: Reminder) => {
    if (!("Notification" in window)) return;
    Notification.requestPermission().then((permission) => {
      if (permission !== "granted") return;

      const now = new Date();
      const reminderDate = new Date(`${reminder.date}T${reminder.time}`);
      const timeout = reminderDate.getTime() - now.getTime();

      if (timeout > 0) {
        setTimeout(() => {
          new Notification(reminder.title, {
            body: `Reminder at ${reminder.time}`,
            icon: "/medication-icon.png",
          });
        }, timeout);
      }
    });
  };

  useEffect(() => {
    reminders.forEach(scheduleNotification);
  }, [reminders]);

  const toggleDay = (day: string) => {
    if (repeatDays.includes(day)) {
      setRepeatDays(repeatDays.filter((d) => d !== day));
    } else {
      setRepeatDays([...repeatDays, day]);
    }
  };

  const addReminder = () => {
    if (!title || !date || !time) return;

    const newReminder: Reminder = {
      id: Date.now().toString(),
      title,
      date,
      time,
      repeatDays,
    };

    const updatedReminders = [...reminders, newReminder];
    setReminders(updatedReminders);
    localStorage.setItem("reminders", JSON.stringify(updatedReminders));
    scheduleNotification(newReminder);

    setTitle("");
    setDate("");
    setTime("");
    setRepeatDays([]);
  };

  const deleteReminder = (id: string) => {
    const updatedReminders = reminders.filter((r) => r.id !== id);
    setReminders(updatedReminders);
    localStorage.setItem("reminders", JSON.stringify(updatedReminders));
  };

  // ✅ JSX
  return (
    <div className="min-h-screen rounded-2xl bg-blue-50">
      <div className="max-w-7xl mx-auto pt-4 pb-10 px-6">
        {/* Pharmacy Dashboard */}
        {user.role === "pharmacy" && (
          <div className="bg-[#e7f3ffd0] rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-[#084377] mb-4">
              Business Analytics
            </h2>
            <AnalyticsComponent
              totalOrders={1250}
              totalRevenue={48000}
              currency="USD"
              labels={["Jan", "Feb", "Mar", "Apr", "May", "Jun"]}
              orderTrend={[100, 200, 150, 250, 300, 400]}
              revenueTrend={[500, 800, 600, 1000, 1200, 1400]}
            />
          </div>
        )}

        {user.role === "doctor" && (
           <div className="grid gap-6 md:grid-cols-2"> 
           <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition"> 
            <h2 className="text-xl font-semibold text-[#0f4c81] mb-4">Upcoming Appointments</h2> 
            <ul className="divide-y divide-gray-100"> <li className="py-3 flex justify-between"> 
              <span className="font-medium">John Doe</span> <span className="text-gray-500 text-sm">10:00 AM</span> 
              </li> <li className="py-3 flex justify-between"> 
                <span className="font-medium">Jane Smith</span> 
                <span className="text-gray-500 text-sm">11:30 AM</span> 
                </li> <li className="py-3 flex justify-between"> 
                  <span className="font-medium">Michael Lee</span> 
                  <span className="text-gray-500 text-sm">1:00 PM</span> 
                  </li> </ul> </div> 
                  <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition"> 
                    <h2 className="text-xl font-semibold text-[#0f4c81] mb-4">Patient Overview</h2> 
                    <div className="space-y-3 text-gray-700"> <p className="flex justify-between"> 
                      <span>Total Patients</span> <span className="font-semibold text-[#0f4c81]">320</span>
                       </p> <p className="flex justify-between"> <span>Today's Appointments</span> 
                       <span className="font-semibold text-[#0f4c81]">8</span> </p> 
                       <p className="flex justify-between"> <span>Pending Reports</span> 
                       <span className="font-semibold text-[#0f4c81]">5</span> </p> </div> </div> </div> )}

        {/* Normal User Dashboard */}
        {user.role === "normal" && (
          <div className="space-y-10">
            {/* --- Dashboard Cards --- */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Last Order */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-xl transition-all p-6">
                <h2 className="text-lg font-semibold text-[#0f4c81] mb-2 flex items-center gap-2">
                  📦 Last Order
                </h2>
                <p className="text-gray-700">Paracetamol 500mg, Vitamin C</p>
                <p className="text-sm text-gray-500 mt-1">
                  Delivered on: Oct 10, 2025
                </p>
              </div>

              {/* 💡 Health Tip */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-xl transition-all p-6">
                <h2 className="text-lg font-semibold text-[#0f4c81] mb-2 flex items-center gap-2">
                  💡 Health Tip
                </h2>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentTipIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-gray-700 leading-relaxed"
                  >
                    {tips[currentTipIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* ⏰ Reminder Summary */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-xl transition-all p-6">
                <h2 className="text-lg font-semibold text-[#0f4c81] mb-2 flex items-center gap-2">
                  ⏰ Reminders
                </h2>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  {reminders.length > 0 ? (
                    reminders.map((r) => (
                      <li key={r.id} className="text-sm">
                        {r.title} at {r.time}{" "}
                        {r.repeatDays?.length > 0 && (
                          <span className="text-gray-500">
                            | {r.repeatDays.join(", ")}
                          </span>
                        )}
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-500">No reminders set.</li>
                  )}
                </ul>
              </div>
            </div>

            {/* --- Reminder Setup Section --- */}
            <div className="bg-gradient-to-br from-white to-blue-50 p-6 rounded-3xl shadow-lg max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-[#0f4c81] mb-3 flex items-center gap-2">
                ⏰ Set Reminder
              </h2>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                <input
                  type="text"
                  placeholder="Reminder Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="border border-blue-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="border border-blue-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="border border-blue-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />

                {/* Repeat Days */}
                <div className="col-span-full flex flex-wrap gap-2 items-center">
                  {daysOfWeek.map((day) => (
                    <button
                      key={day}
                      type="button"
                      className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                        repeatDays.includes(day)
                          ? "bg-[#0f4c81] text-white border-[#0f4c81]"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50"
                      }`}
                      onClick={() => toggleDay(day)}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Reminder Button */}
              <div className="flex justify-center">
                <button
                  onClick={addReminder}
                  className="bg-[#0f4c81] hover:bg-[#0c3a66] text-white font-medium px-5 py-2 rounded-full shadow-md transition-all"
                >
                  ➕ Add Reminder
                </button>
              </div>

              {/* --- List of Reminders --- */}
              <div className="mt-3 space-y-4">
                {reminders.length === 0 && (
                  <p className="text-gray-500 text-center">
                    No reminders set yet.
                  </p>
                )}
                {reminders.map((r) => (
                  <div
                    key={r.id}
                    className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg flex justify-between items-center transition"
                  >
                    <div>
                      <h3 className="font-semibold text-[#0f4c81]">
                        {r.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {r.date} at {r.time}{" "}
                        {r.repeatDays?.length > 0 && (
                          <span className="text-gray-500">
                            | {r.repeatDays.join(", ")}
                          </span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteReminder(r.id)}
                      className="text-red-500 font-bold hover:text-red-700 transition"
                    >
                      ✖
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
