import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import FormControlLabel from "@mui/material/FormControlLabel";

import AnalyticsComponent from "../components/AnalyticsComponent";

import { motion, AnimatePresence } from "framer-motion";

import Checkbox from '@mui/material/Checkbox';
import { getUserStats } from "../api/adminapi";

const label = { slotProps: { input: { 'aria-label': 'Checkbox demo' } } };

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

  const [addtab,setaddtab] = useState(false)
  const [lastOrder,setlastOrder] = useState(false)
  const [ActiveP,setActiveP] = useState(false)
  const [Htips,setHtips] = useState(true)
  const [Well,setWell] = useState(false)



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
    if (user.role === "admin") {
      const fetchAdminStats = async () => {
        try {
          const res = await getUserStats();
          console.log("Admin stats:", res);
        } catch (err) {
          console.error("Failed to load admin stats", err);
        }
      };
  
      fetchAdminStats();
    }
  }, [user.role]);

  const fetchAdminStats = async () => {
  try {
    const res = await getUserStats();
    console.log(res)
  } catch (err) {
    console.error("Failed to load pharmacies", err);
  } finally {
    
  }
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
                       <span className="font-semibold text-[#0f4c81]">5</span> </p> </div> </div> </div> 
                       )}

        {/* Normal User Dashboard */}
        {user.role === "normal" && (
  <div className="space-y-10 max-w-4xl mx-auto">


          {/* mui */}
          <Box sx={{ '& > :not(style)': { m: 1 } }}>
      <Fab color="primary"  aria-label="add" onClick={()=>setaddtab((prev) => !prev)}>
        <AddIcon 
        sx={{cursor:"pointer", }}
        
        />
      </Fab>

    </Box>

    {addtab && (
        <div className=" mt-1 " >
          
          <FormControlLabel className=" text-[#0f4c81] "
            control={<Checkbox checked ={Htips}  size="small" onChange={()=>setHtips((prev)=>!prev)} />}
            label="Daily Health Tip"
            
          />
          <FormControlLabel className=" text-[#0f4c81]"
            control={<Checkbox checked ={lastOrder}  size="small" onChange={()=>setlastOrder((prev)=>!prev)}/>}
            label="Last Order"
          />

          <FormControlLabel className=" text-[#0f4c81]"
            control={<Checkbox checked ={ActiveP}  size="small" onChange={()=>setActiveP((prev)=>!prev)}/>}
            label="Active Prescriptions"
          />

          <FormControlLabel className=" text-[#0f4c81]"
            control={<Checkbox checked ={Well}  size="small" onChange={()=>setWell((prev)=>!prev)}/>}
            label="Wellness Goals"
          />
        </div>
      )}

          {/* --- 🔔 Notifications --- */}
        <div className="w-full bg-gradient-to-r from-blue-50 to-white rounded-3xl shadow-md hover:shadow-xl transition-all p-8  flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div className="flex items-start gap-3">
            <div className="bg-[#0f4c81]/10 text-[#0f4c81] w-10 h-10 flex items-center justify-center rounded-full text-lg">
              🔔
            </div>
            <div>
              <h3 className="font-bold text-[#0f4c81] text-xl">Notifications</h3>
              <p className="text-gray-600">3 unread alerts — one about a prescription refill.</p>
              <p className="text-sm text-gray-500 mt-1">Last updated 2 hours ago</p>
            </div>
          </div>
          <button className="text-[#0f4c81] font-semibold hover:underline mt-4 sm:mt-0">
            View All →
          </button>
        </div>


        {/* --- 💡 Health Tip Section --- */}
  { Htips &&  (<div className="w-full bg-gradient-to-r from-blue-50 to-white rounded-3xl shadow-md hover:shadow-xl transition-all p-8 flex flex-col sm:flex-row items-center justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-[#0f4c81] mb-3 flex items-center gap-2">
            💡 Daily Health Tip
          </h2>
          <AnimatePresence mode="wait">
            <motion.p
              key={currentTipIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="text-gray-700 leading-relaxed text-lg"
            >
              {tips[currentTipIndex]}
            </motion.p>
          </AnimatePresence>
          <p className="text-sm text-gray-500 mt-2">
            Source: World Health Organization
          </p>
        </div>
        <img
          src="https://cdn-icons-png.flaticon.com/512/2966/2966481.png"
          alt="Health tip"
          className="w-28 h-28 mt-6 sm:mt-0"
        />
      </div>)}


    {/* --- 📦 Last Order Section --- */}
    { lastOrder &&  (<div className="w-full bg-white/90 backdrop-blur-sm rounded-3xl shadow-md hover:shadow-xl transition-all p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
      <div>
        <h2 className="text-2xl font-bold text-[#0f4c81] mb-3 flex items-center gap-2">
          📦 Last Order
        </h2>
        <p className="text-gray-700 text-lg">
          <span className="font-semibold">Medicines:</span> Paracetamol 500mg, Vitamin C
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Delivered on <strong>Oct 10, 2025</strong> | Order ID: #PHM10234
        </p>
      </div>
      <div className="mt-5 sm:mt-0 flex flex-col items-end">
        <span className="text-sm font-medium text-green-600 bg-green-100 px-3 py-1 rounded-full">
          ✅ Delivered
        </span>
        <button className="mt-3 text-[#0f4c81] font-semibold hover:underline">
          View Invoice →
        </button>
      </div>
    </div>)}

    

    {/* --- 💊 Active Prescriptions --- */}
      { ActiveP && (<div className="w-full bg-white rounded-3xl shadow-md hover:shadow-xl transition-all p-10  flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div className="flex items-start gap-3">
          <div className="bg-[#0f4c81]/10 text-[#0f4c81] w-10 h-10 flex items-center justify-center rounded-full text-lg">
            💊
          </div>
          <div>
            <h3 className="font-bold text-[#0f4c81] text-xl">Active Prescriptions</h3>
            <p className="text-gray-600">
              2 ongoing — <strong>Amoxicillin</strong> and <strong>Vitamin D3</strong>
            </p>
            <p className="text-sm text-gray-500 mt-1">Next refill due: Oct 25, 2025</p>
          </div>
        </div>
        <button className="text-[#0f4c81] font-semibold hover:underline mt-4 sm:mt-0">
          Manage →
        </button>
      </div>)}

          {/* --- 🏥 Nearby Pharmacies ---
          <div className="w-full bg-gradient-to-r from-blue-50 to-white rounded-3xl shadow-md hover:shadow-xl transition-all p-8 border-l-4 border-[#0f4c81] flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="flex items-start gap-3">
              <div className="bg-[#0f4c81]/10 text-[#0f4c81] w-10 h-10 flex items-center justify-center rounded-full text-lg">
                🏥
              </div>
              <div>
                <h3 className="font-bold text-[#0f4c81] text-xl">Nearby Pharmacies</h3>
                <p className="text-gray-600">
                  <strong>HealthPlus</strong> — 0.8 km away  
                </p>
                <p className="text-sm text-gray-500 mt-1">Open till 10:00 PM</p>
              </div>
            </div>
            <button className="text-[#0f4c81] font-semibold hover:underline mt-4 sm:mt-0">
              View Map →
            </button>
          </div> */}

          {/* --- 🧘 Wellness Goals --- */}
        {Well &&(<div className="w-full bg-white rounded-3xl shadow-md hover:shadow-xl transition-all p-10  flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div className="flex items-start gap-3">
            <div className="bg-[#0f4c81]/10 text-[#0f4c81] w-10 h-10 flex items-center justify-center rounded-full text-lg">
              🧘
            </div>
            <div>
              <h3 className="font-bold text-[#0f4c81] text-xl">Wellness Goals</h3>
              <p className="text-gray-600">Goal: Walk 6,000 steps daily</p>
              <p className="text-sm text-gray-500 mt-1">Progress: 4,320 steps today</p>
            </div>
          </div>
          <button className="text-[#0f4c81] font-semibold hover:underline mt-4 sm:mt-0">
            Update Goals →
          </button>
        </div>)}

          

    {/* --- ⏰ Reminder Setup Section --- */}
    <div className="bg-gradient-to-br from-white to-blue-50 p-8 rounded-3xl shadow-lg w-full">
      <h2 className="text-2xl font-bold text-[#0f4c81] mb-3 flex items-center gap-2">
        ⏰ Set a New Reminder
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
          placeholder="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border border-blue-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
        />
        <input
          type="time"
          placeholder="time"
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

      <div className="flex justify-center mb-6">
        <button
          onClick={addReminder}
          className="bg-[#0f4c81] hover:bg-[#0c3a66] text-white font-medium px-6 py-2.5 rounded-full shadow-md transition-all"
        >
          ➕ Add Reminder
        </button>
      </div>

      {/* --- Enhanced Reminder List --- */}
      <div className="space-y-4">
        {reminders.length === 0 ? (
          <p className="text-gray-500 text-center">No reminders set yet.</p>
        ) : (
          reminders.map((r) => (
            <div
              key={r.id}
              className="w-full bg-white rounded-3xl p-6 shadow-md hover:shadow-lg transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center border-l-4 border-[#0f4c81]"
            >
              <div className="flex items-start gap-3">
                <div className="bg-[#0f4c81]/10 text-[#0f4c81] w-10 h-10 flex items-center justify-center rounded-full text-lg">
                  ⏰
                </div>
                <div>
                  <h3 className="font-semibold text-[#0f4c81] text-lg">
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
              </div>
              <button
                onClick={() => deleteReminder(r.id)}
                className="text-red-500 font-bold hover:text-red-700 transition mt-4 sm:mt-0"
              >
                ✖ Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  </div>
)}
        {user.role === "admin" && (
          <h1>Hi i am admin</h1>
                       )}


      </div>
    </div>
  );
}
