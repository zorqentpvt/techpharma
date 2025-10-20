import React, { useState } from "react";

// PaymentPage.tsx
// React + TypeScript + TailwindCSS
// Pharma App Payment Page
// - Displays order summary from previous checkout step
// - Lets users select a payment method
// - Mock UPI, card, or COD confirmation flow
// - Clean, mobile-friendly UI

export default function Pay() {
  const [method, setMethod] = useState<"upi" | "card" | "cod">("upi");
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const totalAmount = 548; // mock total from checkout

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      alert(`Payment successful via ${method.toUpperCase()}! (Demo)`);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-semibold text-slate-800 mb-2">Complete Your Payment</h1>
        <p className="text-slate-600 text-sm mb-6">
          Please select a payment method and complete the transaction to confirm your order.
        </p>

        {/* Payment Method Selection */}
        <div className="space-y-3 mb-6">
          <label className="flex items-center gap-3">
            <input
              type="radio"
              checked={method === "upi"}
              onChange={() => setMethod("upi")}
              className="w-4 h-4"
            />
            <span className="text-sm text-slate-800">UPI (Google Pay / PhonePe / Paytm)</span>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="radio"
              checked={method === "card"}
              onChange={() => setMethod("card")}
              className="w-4 h-4"
            />
            <span className="text-sm text-slate-800">Debit / Credit Card</span>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="radio"
              checked={method === "cod"}
              onChange={() => setMethod("cod")}
              className="w-4 h-4"
            />
            <span className="text-sm text-slate-800">Cash on Delivery (COD)</span>
          </label>
        </div>

        {/* Dynamic Input Fields */}
        <form onSubmit={handlePayment} className="space-y-4">
          {method === "upi" && (
            <div>
              <label className="block text-sm font-medium text-slate-700">UPI ID</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="example@okhdfc"
                required
                className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400"
              />
            </div>
          )}

          {method === "card" && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">Card Number</label>
                <input
                  type="text"
                  maxLength={16}
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="1234 5678 9012 3456"
                  required
                  className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Expiry</label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="MM/YY"
                    required
                    className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">CVV</label>
                  <input
                    type="password"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    maxLength={3}
                    placeholder="123"
                    required
                    className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>
            </div>
          )}

          {method === "cod" && (
            <div className="p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
              You can pay using cash or card upon delivery. Please keep the amount ready.
            </div>
          )}

          {/* Order Summary */}
          <div className="mt-6 border-t pt-4 text-sm">
            <div className="flex justify-between text-slate-700">
              <span>Order Total</span>
              <span className="font-semibold text-slate-900">₹{totalAmount}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full mt-6 bg-blue-600 text-white text-sm font-medium rounded-md py-2 hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 disabled:opacity-70"
          >
            {isProcessing ? "Processing..." : `Pay ₹${totalAmount}`}
          </button>
        </form>

        <p className="text-xs text-slate-500 text-center mt-6">
          Your transaction is secured and encrypted. For demo purposes, no real payment is processed.
        </p>
      </div>
    </div>
  );
}
