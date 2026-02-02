import React, { useEffect, useState } from "react";

type Reminder = {
  id: number;
  medicineName: string;
  date: string;
  time: string;
  repeatDays: string[];
};

const daysOfWeek: string[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const MedicineReminder: React.FC = () => {
  const [medicineName, setMedicineName] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [repeatDays, setRepeatDays] = useState<string[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  // Load saved reminders
  useEffect(() => {
    const saved = localStorage.getItem("medicineReminders");
    if (saved) {
      setReminders(JSON.parse(saved));
    }
  }, []);

  // Save reminders
  useEffect(() => {
    localStorage.setItem("medicineReminders", JSON.stringify(reminders));
  }, [reminders]);

  // Ask notification permission
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  // Check reminders every 30s
  useEffect(() => {
    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [reminders]);

  const toggleDay = (day: string) => {
    setRepeatDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day]
    );
  };

  const addReminder = (): void => {
    if (!medicineName || !time) {
      alert("Medicine name and time required");
      return;
    }

    const newReminder: Reminder = {
      id: Date.now(),
      medicineName,
      date,
      time,
      repeatDays,
    };

    setReminders((prev) => [...prev, newReminder]);
    setMedicineName("");
    setDate("");
    setTime("");
    setRepeatDays([]);
  };

  const deleteReminder = (id: number): void => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const playSound = (): void => {
    const audio = new Audio("/alarm.mp3");
    audio.play();
  };

  const showNotification = (text: string): void => {
    if (Notification.permission === "granted") {
      new Notification("💊 Medicine Reminder", { body: text });
    }
  };

  const checkReminders = (): void => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const today = now.toISOString().slice(0, 10);
    const todayName =
      daysOfWeek[now.getDay() === 0 ? 6 : now.getDay() - 1];

    reminders.forEach((r) => {
      if (
        r.time === currentTime &&
        (r.date === today || r.repeatDays.includes(todayName))
      ) {
        playSound();
        showNotification(`Time to take ${r.medicineName}`);
      }
    });
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-lg max-w-4xl mx-auto">

      <h2 className="text-2xl font-bold text-blue-800 mb-6">
        💊 Medicine Reminder
      </h2>

      {/* Inputs */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">

        <input
          type="text"
          placeholder="Medicine Name"
          value={medicineName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setMedicineName(e.target.value)
          }
          className="border p-2 rounded-lg"
        />

        <input
          type="date"
          value={date}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setDate(e.target.value)
          }
          className="border p-2 rounded-lg"
        />

        <input
          type="time"
          value={time}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setTime(e.target.value)
          }
          className="border p-2 rounded-lg"
        />

      </div>

      {/* Repeat Days */}
      <div className="flex flex-wrap gap-2 mb-6">
        {daysOfWeek.map((day) => (
          <button
            key={day}
            onClick={() => toggleDay(day)}
            className={`px-3 py-1 rounded-full border ${
              repeatDays.includes(day)
                ? "bg-blue-700 text-white"
                : "bg-gray-100"
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Add Button */}
      <button
        onClick={addReminder}
        className="bg-blue-700 text-white px-6 py-2 rounded-full hover:bg-blue-800"
      >
        ➕ Add Reminder
      </button>

      {/* Reminder List */}
      <div className="mt-8 space-y-4">

        {reminders.length === 0 && (
          <p className="text-gray-500">No reminders yet.</p>
        )}

        {reminders.map((r) => (
          <div
            key={r.id}
            className="flex justify-between items-center bg-gray-50 p-4 rounded-xl"
          >
            <div>
              <p className="font-semibold">{r.medicineName}</p>
              <p className="text-sm text-gray-500">
                {r.time}
                {r.date && ` | ${r.date}`}
                {r.repeatDays.length > 0 &&
                  ` | ${r.repeatDays.join(", ")}`}
              </p>
            </div>

            <button
              onClick={() => deleteReminder(r.id)}
              className="text-red-600"
            >
              Delete
            </button>
          </div>
        ))}

      </div>

    </div>
  );
};

export default MedicineReminder;
