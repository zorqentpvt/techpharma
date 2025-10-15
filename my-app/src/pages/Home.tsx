import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AnalyticsComponent from "../components/AnalyticsComponent";
import "../index.css";

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
  console.log(user);

  // Reminder Section State
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

  // Schedule Notification
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

  // Schedule all reminders on mount
  useEffect(() => {
    reminders.forEach(scheduleNotification);
  }, [reminders]);

  // Add Reminder
  const handleAddReminder = () => {
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

  const toggleDay = (day: string) => {
    if (repeatDays.includes(day)) {
      setRepeatDays(repeatDays.filter((d) => d !== day));
    } else {
      setRepeatDays([...repeatDays, day]);
    }
  };

  const deleteReminder = (id: string) => {
    const updatedReminders = reminders.filter((r) => r.id !== id);
    setReminders(updatedReminders);
    localStorage.setItem("reminders", JSON.stringify(updatedReminders));
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <div className="max-w-7xl mx-auto pt-24 pb-10 px-6">
        {/* Pharmacy Dashboard */}
        {user.role === "pharmacy" && (
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-[#0f4c81] mb-4">Business Analytics</h2>
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

        {/* Doctor Dashboard */}
        {user.role === "doctor" && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition">
              <h2 className="text-xl font-semibold text-[#0f4c81] mb-4">Upcoming Appointments</h2>
              <ul className="divide-y divide-gray-100">
                <li className="py-3 flex justify-between">
                  <span className="font-medium">John Doe</span>
                  <span className="text-gray-500 text-sm">10:00 AM</span>
                </li>
                <li className="py-3 flex justify-between">
                  <span className="font-medium">Jane Smith</span>
                  <span className="text-gray-500 text-sm">11:30 AM</span>
                </li>
                <li className="py-3 flex justify-between">
                  <span className="font-medium">Michael Lee</span>
                  <span className="text-gray-500 text-sm">1:00 PM</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition">
              <h2 className="text-xl font-semibold text-[#0f4c81] mb-4">Patient Overview</h2>
              <div className="space-y-3 text-gray-700">
                <p className="flex justify-between">
                  <span>Total Patients</span>
                  <span className="font-semibold text-[#0f4c81]">320</span>
                </p>
                <p className="flex justify-between">
                  <span>Today's Appointments</span>
                  <span className="font-semibold text-[#0f4c81]">8</span>
                </p>
                <p className="flex justify-between">
                  <span>Pending Reports</span>
                  <span className="font-semibold text-[#0f4c81]">5</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Normal User Dashboard */}
        {user.role === "normal" && (
          <div className="space-y-6">
            {/* Last Orders / Tips */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition">
                <h2 className="text-lg font-semibold text-[#0f4c81] mb-2">📦 Last Order</h2>
                <p className="text-gray-700">Paracetamol 500mg, Vitamin C</p>
                <p className="text-sm text-gray-500 mt-1">Delivered on: Oct 10, 2025</p>
              </div>
              <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition">
                <h2 className="text-lg font-semibold text-[#0f4c81] mb-2">💡 Health Tip</h2>
                <p className="text-gray-700">
                  Stay hydrated! Drink at least <span className="font-bold">8 glasses of water</span> a day.
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition">
                <h2 className="text-lg font-semibold text-[#0f4c81] mb-2">⏰ Reminders</h2>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  {reminders.map((r) => (
                    <li key={r.id}>
                      {r.title} at {r.time} {r.repeatDays?.length > 0 && `| Repeats: ${r.repeatDays.join(", ")}`}
                    </li>
                  ))}
                  {reminders.length === 0 && <li className="text-gray-500">No reminders set.</li>}
                </ul>
              </div>
            </div>

            {/* Reminder Setup Section */}
            <div className="bg-gray-50 p-6 rounded-2xl shadow-md max-w-4xl mx-auto">
              <h2 className="text-2xl font-semibold text-[#0f4c81] mb-6">⏰ Set Reminder</h2>

              <div className="grid gap-4 md:grid-cols-2 mb-6">
                <input
                  type="text"
                  placeholder="Reminder Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="border p-2 rounded"
                />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="border p-2 rounded"
                />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="border p-2 rounded"
                />

                {/* Repeat Days */}
                <div className="flex flex-wrap gap-2 items-center">
                  {daysOfWeek.map((day) => (
                    <button
                      key={day}
                      type="button"
                      className={`px-3 py-1 rounded-full border ${
                        repeatDays.includes(day)
                          ? "bg-[#0f4c81] text-white"
                          : "bg-white text-gray-700"
                      }`}
                      onClick={() => {
                        if (repeatDays.includes(day)) {
                          setRepeatDays(repeatDays.filter((d) => d !== day));
                        } else {
                          setRepeatDays([...repeatDays, day]);
                        }
                      }}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
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

                  // Schedule notification
                  if ("Notification" in window) {
                    Notification.requestPermission().then((permission) => {
                      if (permission === "granted") {
                        const now = new Date();
                        const reminderDate = new Date(`${newReminder.date}T${newReminder.time}`);
                        const timeout = reminderDate.getTime() - now.getTime();
                        if (timeout > 0) {
                          setTimeout(() => {
                            new Notification(newReminder.title, {
                              body: `Reminder at ${newReminder.time}`,
                              icon: "/medication-icon.png",
                            });
                          }, timeout);
                        }
                      }
                    });
                  }

                  setTitle("");
                  setDate("");
                  setTime("");
                  setRepeatDays([]);
                }}
                className="bg-[#0f4c81] text-white px-6 py-2 rounded hover:bg-[#0c3a66] transition"
              >
                Add Reminder
              </button>

              {/* List Reminders */}
              <div className="mt-8 space-y-4">
                {reminders.length === 0 && <p className="text-gray-500">No reminders set.</p>}
                {reminders.map((r) => (
                  <div
                    key={r.id}
                    className="bg-white p-4 rounded-2xl shadow hover:shadow-lg flex justify-between items-center"
                  >
                    <div>
                      <h3 className="font-semibold text-[#0f4c81]">{r.title}</h3>
                      <p className="text-gray-600 text-sm">
                        {r.date} at {r.time}{" "}
                        {r.repeatDays?.length > 0 && `| Repeats: ${r.repeatDays.join(", ")}`}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const updatedReminders = reminders.filter((rem) => rem.id !== r.id);
                        setReminders(updatedReminders);
                        localStorage.setItem("reminders", JSON.stringify(updatedReminders));
                      }}
                      className="text-red-500 font-bold hover:text-red-700"
                    >
                      Delete
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
