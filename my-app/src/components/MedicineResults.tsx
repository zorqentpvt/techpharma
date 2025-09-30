import Button from "../components/Button";
import { Medicine } from "../api/medapi";
import React from "react";

interface MedicineResultsProps {
  results: Medicine[];
  userRole: string;
  handleBuy: (med: Medicine) => void;
  cart: (med: Medicine) => void;
}

export function MedicineResults({ results, userRole, handleBuy ,cart}: MedicineResultsProps) {
  if (results.length === 0) {
    return (
      <p className="text-gray-500 col-span-full text-center text-lg">
        Use the search box to find medicines.
      </p>
    );
  }
  

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {results.map((med, idx) => (
        <div
          key={idx}
          className="p-6 bg-white rounded-2xl shadow hover:shadow-lg transition transform hover:-translate-y-1 flex flex-col gap-3"
        >
          <h3 className="font-bold text-lg text-gray-800">{med.name}</h3>
          <p className="text-sm text-gray-600">Pharmacy: {med.pharmacy}</p>
          <span
            className={`px-2 py-1 w-fit rounded-full text-xs font-semibold ${
              med.stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {med.stock > 0 ? `In Stock: ${med.stock}` : "Out of Stock"}
          </span>
          <p className="text-sm text-gray-500">{med.contents}</p>

          {userRole === "normal" && med.stock > 0 && (
            <>
            <Button
              onClick={() => handleBuy(med)}
              className="mt-auto px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow hover:from-blue-600 hover:to-indigo-600 transform hover:scale-[1.02] transition"
            >
              Buy Now
            </Button>
                        <Button
                        onClick={() => cart(med)}
                        className="mt-auto px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow hover:from-blue-600 hover:to-indigo-600 transform hover:scale-[1.02] transition"
                      >
                        Add to cart
                      </Button>
                      </>
          )}
        </div>
      ))}
    </div>
  );
}
