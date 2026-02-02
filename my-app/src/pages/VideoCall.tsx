import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { completeConsultation } from "../api/docApi";

interface OpChartData {
  diagnosis?: string;
  prescription?: string;
  doctorNotes?: string;
}

type PayMethod = "upi" | "card" | "wallet" | null;

const VideoCall = () => {
  const { state: consultation } = useLocation();
  const navigate = useNavigate();

  const storedUser = JSON.parse(localStorage.getItem("userdata") || "null");

  useEffect(() => {
    if (!consultation) navigate("/dashboard");
    if (!storedUser) navigate("/login");
  }, [consultation, storedUser, navigate]);

  if (!consultation || !storedUser) return null;

  const {
    id: appointmentId,
    doctorId,
    doctorName,
    doctorSpecialization,
    patientId,
    name,
    date,
    time,
    reason,
    phno,
    fee,
  } = consultation;

  const isDoctor =
    storedUser.roleId?.trim().toLowerCase() === "doctor" &&
    storedUser.id === doctorId;

  const me = {
    id: storedUser.id,
    name: isDoctor
      ? "Dr " + storedUser.displayName
      : storedUser.firstName + " " + storedUser.lastName,
    role: isDoctor ? "doctor" : "patient",
  };

  const otherUser = isDoctor
    ? { id: patientId, name: name, role: "patient" }
    : {
        id: doctorId,
        name: doctorName,
        role: "doctor",
        specialization: doctorSpecialization,
        phone: phno,
      };

  const [now, setNow] = useState(new Date());
  const [canJoin, setCanJoin] = useState(false);
  const [joinedCall, setJoinedCall] = useState(false);
  const [opData, setOpData] = useState<OpChartData>({});
  const [paid, setPaid] = useState(false);

  // 💳 payment states
  const [showPayment, setShowPayment] = useState(false);
  const [payMethod, setPayMethod] = useState<PayMethod>(null);
  const [confirmPay, setConfirmPay] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const scheduled = useMemo(() => {
    const t = time.length === 5 ? `${time}:00` : time;
    return new Date(`${date}T${t}`);
  }, [date, time]);

  const diffMinutes = (scheduled.getTime() - now.getTime()) / (1000 * 60);

  useEffect(() => {
    setCanJoin(diffMinutes <= 5 && diffMinutes >= -120);
  }, [diffMinutes]);

  const roomName = useMemo(() => {
    const raw = `${doctorId}-${patientId}-${date}-${time}`;
    return Math.abs(
      [...raw].reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) | 0, 0)
    )
      .toString(36)
      .slice(0, 16);
  }, [doctorId, patientId, date, time]);

  const handleLeave = () => navigate("/dashboard");

  const handleOpChange = (field: keyof OpChartData, value: string) => {
    setOpData(prev => ({ ...prev, [field]: value }));
  };

  const handleopsubmit = async () => {
    const payload = {
      appointmentId,
      slotId: consultation.slotId,
      diagnosis: opData.diagnosis || "",
      prescription: opData.prescription || "",
      doctorNotes: opData.doctorNotes || "",
    };

    try {
      await completeConsultation(payload);
      alert("OP submitted successfully");
    } catch {
      alert("Failed to submit OP Chart");
    }
  };

  // ✅ FINAL PAY
  const finishPayment = () => {
    setPaid(true);
    setShowPayment(false);
    setConfirmPay(false);
    setPayMethod(null);
  };

  return (
    <div className="w-full h-screen flex bg-gray-900 text-white overflow-hidden">
      {!canJoin ? (
        <div className="m-auto text-center px-6">
          <h2 className="text-2xl font-bold mb-3">Not Time Yet</h2>
          <p className="text-gray-400">
            Scheduled for {date} at {time}
          </p>
        </div>
      ) : (
        <>
          {/* JITSI */}
          <div className="flex-1 bg-black relative">
            <iframe
              title="Jitsi Call"
              allow="camera; microphone; fullscreen; autoplay"
              src={`https://meet.jit.si/${roomName}#userInfo.displayName="${encodeURIComponent(
                me.name
              )}"`}
              style={{ width: "100%", height: "100%", border: 0 }}
              onLoad={() => setJoinedCall(true)}
            />
          </div>

          {/* SIDEBAR */}
          <div className="w-96 bg-gray-800 p-6 flex flex-col justify-between overflow-y-auto shadow-xl">
            <div className="space-y-6">
              <div className="bg-gray-700 p-4 rounded-xl">
                <h3 className="text-lg font-semibold mb-2">Meeting With</h3>
                <p className="text-xl font-bold">{otherUser.name}</p>
                <p className="text-sm text-gray-300 capitalize">
                  {otherUser.role}
                  {otherUser.specialization &&
                    ` • ${otherUser.specialization}`}
                </p>
              </div>

              <div className="bg-gray-700 p-4 rounded-xl space-y-2">
                <p>Reason: {reason}</p>
                <p>Date: {date}</p>
                <p>Time: {time}</p>
              </div>

              <button
                onClick={handleLeave}
                className="w-full bg-red-600 hover:bg-red-700 py-2 rounded-lg font-semibold"
              >
                Leave Call
              </button>

              {/* OP CHART */}
              {isDoctor && (
                <div className="bg-gray-700 p-4 rounded-xl space-y-3">
                  <h3 className="text-lg font-semibold text-cyan-400">
                    OP Chart
                  </h3>

                  {["diagnosis", "prescription", "doctorNotes"].map(f => (
                    <textarea
                      key={f}
                      placeholder={f}
                      disabled={!joinedCall}
                      value={(opData as any)[f] || ""}
                      onChange={e =>
                        handleOpChange(f as keyof OpChartData, e.target.value)
                      }
                      className="w-full bg-gray-900 p-2 rounded"
                    />
                  ))}

                  <button
                    onClick={handleopsubmit}
                    disabled={!joinedCall}
                    className="w-full bg-blue-600 py-2 rounded"
                  >
                    Submit OP
                  </button>
                </div>
              )}

              {/* PAY BUTTON */}
              {joinedCall && !paid && !isDoctor && (
                <button
                  onClick={() => setShowPayment(true)}
                  className="w-full bg-green-600 py-2 rounded-lg font-semibold"
                >
                  Pay ₹{fee}
                </button>
              )}

              {paid && (
                <div className="bg-green-600 text-center py-2 rounded-lg">
                  Paid Successfully ✅
                </div>
              )}
            </div>
          </div>

          {/* ================= PAYMENT MODAL ================= */}

          {showPayment && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
              <div className="bg-gray-800 w-96 p-6 rounded-xl space-y-4">

                {!confirmPay ? (
                  <>
                    <h2 className="text-xl font-bold">Select Payment Method</h2>

                    <button
                      onClick={() => {
                        setPayMethod("upi");
                        setConfirmPay(true);
                      }}
                      className="w-full bg-gray-700 py-2 rounded"
                    >
                      UPI
                    </button>

                    <button
                      onClick={() => {
                        setPayMethod("card");
                        setConfirmPay(true);
                      }}
                      className="w-full bg-gray-700 py-2 rounded"
                    >
                      Card
                    </button>

                    <button
                      onClick={() => {
                        setPayMethod("wallet");
                        setConfirmPay(true);
                      }}
                      className="w-full bg-gray-700 py-2 rounded"
                    >
                      Wallet
                    </button>

                    <button
                      onClick={() => setShowPayment(false)}
                      className="w-full bg-red-600 py-2 rounded"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-bold">Confirm Payment</h2>

                    <div className="bg-gray-700 p-3 rounded space-y-1">
                      <p><b>Doctor:</b> {doctorName}</p>
                      <p><b>Phone:</b> {phno}</p>
                      <p><b>Method:</b> {payMethod?.toUpperCase()}</p>
                      <p><b>Amount:</b> ₹{fee}</p>
                    </div>

                    <button
                      onClick={finishPayment}
                      className="w-full bg-green-600 py-2 rounded"
                    >
                      OK PAY
                    </button>
                  </>
                )}

              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VideoCall;
