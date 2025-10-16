import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { searchDoctor, docAppointments  } from "../api/medapir";
import { Search, X } from "lucide-react";
import PatientAppointment, { AppointmentSlot } from "../components/PatientAppointment";
import docImage from "../assets/doc.png";

// Doctor card component
function DoctorCard({
  doctor,
  onAppointment,
}: {
  doctor: Doctor;
  onAppointment: (id: string) => void;
}) {
  console.log(doctor);

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-100 transition-transform transform hover:-translate-y-1 p-5 flex flex-row items-center space-x-6">
      <div className="flex-shrink-0">
        <img
          src={doctor.photo || docImage}
          alt={doctor.user.displayName}
          className="w-32 h-32 rounded-full object-cover"
          onError={(e) => { e.currentTarget.src = docImage; }}
        />
      </div>

      <div className="flex flex-col flex-1">
        <div className="mb-2">
          <h2 className="text-xl font-semibold text-gray-800">{doctor.user.displayName}</h2>
          <p className="text-sm text-gray-500">Specialization  : {doctor.specialty || doctor.specializationId}</p>
          <p className="text-sm text-gray-500">Consultation Fee: ${doctor.consultationFee}</p>
        </div>

       

        <div className="mt-auto pt-3">
          <button
            onClick={() => onAppointment(doctor.id)}
            className="flex-1 px-4 py-1.5 rounded-md text-sm font-medium text-white bg-[#002E6E] hover:bg-[#0043A4] transition"
          >
            Book Appointment
          </button>
        </div>
      </div>
    </div>
  );
}


// Main Doctors page
export default function Doctors() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [DoctorAppointments, setDoctorAppointments] = useState<AppointmentSlot[]>([]);
  const [nearby, setNearby] = useState(true);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [location, setLocation] = useState<string>("");

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) return navigate("/");
    const parsed = JSON.parse(user);
    if (parsed.role !== "normal") return navigate("/");

    // Get user location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCoords({ latitude, longitude });
          reverseGeocode(latitude, longitude);
        },
        () => setLocation("⚠️ Unable to retrieve location")
      );
    }

    handleSearch(); // Initial fetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await res.json();
      setLocation(data.display_name || "Location not found");
    } catch {
      setLocation("⚠️ Unable to retrieve location");
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setIsSearching(true);
    try {
      const coordsToSend = nearby ? coords : null; // ✅ use this instead of modifying state
  
      const res = await searchDoctor(searchTerm, coordsToSend);
      let fetchedDoctors: Doctor[] = Array.isArray(res.data) ? res.data : [];
      if (nearby && coords) {
        fetchedDoctors = sortByDistance(fetchedDoctors, coords);
      }
  
      setDoctors(fetchedDoctors);
      setError("");
    } catch (err) {
      console.error(err);
      setDoctors([]);
      setError("⚠️ Failed to load doctors.");
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };
 

  const sortByDistance = (list: Doctor[], coords: { latitude: number; longitude: number }) => {
    return [...list].sort((a, b) => {
      const distA = getDistance(coords.latitude, coords.longitude, a.lat || 0, a.lng || 0);
      const distB = getDistance(coords.latitude, coords.longitude, b.lat || 0, b.lng || 0);
      return distA - distB;
    });
  };

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleAppointment = async (id: string) => {
    try {
      // Call your API helper function
      const appointments = await docAppointments(id);
  
      // If API returned an error object
      if ((appointments as any).success === false) {
        console.error("Error fetching appointments:", (appointments as any).message);
        return;
      }
 // Update state
      setSelectedDoctorId(id);
      setDoctorAppointments(appointments); // assuming you have this state
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  };
  console.log(doctors)
  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      {/* Top Bar */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">🩺 Find Your Doctor</h1>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative flex items-center w-full sm:w-80">
              <Search className="absolute left-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or specialty..."
                className="w-full pl-10 pr-24 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => { setSearchTerm(""); handleSearch(); }}
                  className="absolute right-16 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="absolute right-2 bg-blue-600 text-white px-4 py-1.5 rounded-full hover:bg-blue-700 transition text-sm"
              >
                {isSearching ? "..." : "Search"}
              </button>
            </div>

            {/* Nearby toggle */}
            <button
              onClick={() => {
                setNearby(!nearby);
                handleSearch();
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium border ${
                nearby ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300"
              } hover:bg-blue-600 hover:text-white transition`}
            >
              {nearby ? "Nearby ON" : "Nearby OFF"}
            </button>
          </div>
        </div>
      </div>

      {/* Location & Results */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {nearby && location && (
          <div className="mb-6 p-4 bg-white shadow rounded-xl flex items-center gap-2 text-gray-700">
            {location}
          </div>
        )}

        {loading && <p className="text-center text-gray-500 text-lg animate-pulse">Loading doctors...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}

        {!loading && !error && (
          <>
            {selectedDoctorId ? (
              <div className="max-w-3xl mx-auto bg-white rounded-2xl p-6 shadow-sm">
                <button
                  onClick={() => setSelectedDoctorId(null)}
                  className="mb-4 text-blue-600 hover:underline flex items-center gap-1 text-sm"
                >
                  ← Back to doctors
                </button>

                <PatientAppointment
                  doctorId={selectedDoctorId}
                  patientId="mock-patient-id"
                  bookedSlots={DoctorAppointments}
                  onSubmit={(data) => {
                    console.log("Submitted appointment:", data);
                    alert("Appointment request submitted!");
                    setSelectedDoctorId(null);
                  }}
                />
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {doctors.length > 0 ? (
                  doctors.map((doc) => (
                    <DoctorCard key={doc.id} doctor={doc} onAppointment={handleAppointment} />
                  ))
                ) : (
                  <p className="col-span-full text-center text-gray-500 text-lg">No doctors found.</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
