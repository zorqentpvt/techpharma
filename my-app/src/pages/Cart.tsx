import React, { useEffect, useState } from "react";
import CartItems from "../components/CartItems";
import { cartdata, removeCart } from "../api/medapir";
import { useNavigate } from "react-router-dom";
import { getActiveEligibility } from "../api/freeMedicineApi";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle } from "lucide-react";

const BASE_URL = "http://localhost:8080";

type Product = {
  id: string;
  medicineId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  pharmacyId: string;
  quantity: number;
  prescriptionRequired: boolean;
  isFreeScheme: boolean;
};

type OrderSummary = {
  id: string | null;
  products: Product[];
  shipping: number;
  taxes: number;
  totalcost: number;
};

type CartProps = {
  userId?: string;
};

const Cart: React.FC<CartProps> = ({ userId: propUserId }) => {
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEligible, setIsEligible] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successOrderNumber, setSuccessOrderNumber] = useState("");
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const navigate = useNavigate();

  const userId = propUserId || (() => {
    try {
      const data = localStorage.getItem("userdata");
      return data ? JSON.parse(data).id : "";
    } catch {
      return "";
    }
  })();

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response: any = await cartdata(userId);
        if (response.success && response.data) {
          const medicines: Product[] = response.data.medicines.map((item: any) => ({
            id: item.id,
            medicineId: item.medicine.id,
            name: item.medicine.name,
            description: item.medicine.description,
            price: item.medicine.price,
            image: item.medicine.image,
            pharmacyId: item.medicine.pharmacyId,
            quantity: item.quantity,
            prescriptionRequired: item.medicine.prescriptionRequired || false,
            isFreeScheme: item.medicine.isFreeScheme || false,
          }));

          setOrderSummary({
            id: response.data.id,
            products: medicines,
            shipping: 0,
            taxes: 0,
            totalcost: response.data.total_amount,
          });
        } else {
          setOrderSummary({ id: null, products: [], shipping: 0, taxes: 0, totalcost: 0 });
        }
      } catch (error) {
        console.error(error);
        setOrderSummary({ id: null, products: [], shipping: 0, taxes: 0, totalcost: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  useEffect(() => {
    const checkEligibility = async () => {
      try {
        const res = await getActiveEligibility();
        if (res.success && res.data) {
          setIsEligible(true);
        }
      } catch (e) { /* ignore error */ }
    };
    checkEligibility();
  }, []);

  const handleBuy = (products: Product[]) => {
    localStorage.setItem(
    "transaction",
    JSON.stringify({ products, price: productsTotal, cartId: orderSummary?.id })
  );
    navigate("/dashboard/pay"); // navigate to pay page
  };

  const handleFreeOrder = async () => {
    if (!orderSummary || !orderSummary.id || orderSummary.products.length === 0) return;
    
    // Assumption: Cart contains items from one pharmacy for free order simplicity
    const pharmacyId = orderSummary.products[0].pharmacyId;

    if (!prescriptionFile) {
      alert("Please upload a prescription to proceed with the free medicine order.");
      return;
    }
    
    if (!window.confirm("Place this order for FREE under your eligibility scheme?")) return;

    try {
      const formData = new FormData();
      formData.append("cartId", orderSummary.id);
      formData.append("pharmacyId", pharmacyId);
      formData.append("prescription", prescriptionFile);

      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/user/order/free`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        setOrderSummary({ id: null, products: [], shipping: 0, taxes: 0, totalcost: 0 }); // Clear cart locally
        setSuccessOrderNumber(data.data?.orderNumber || "Pending");
        setShowSuccessModal(true);
      } else {
        const msg = data.error?.message || data.message || "Unknown error";
        alert("Failed to place free order: " + msg);
      }
    } catch (err) {
      console.error(err);
      alert("Error placing order");
    }
  };


  const handleQuantityChange = async (productId: string, quantity: number) => {
    if (!orderSummary) return;

    const product = orderSummary.products.find((p) => p.id === productId);
    if (!product) return;

    const updatedProducts = orderSummary.products.map((p) =>
      p.id === productId ? { ...p, quantity } : p
    );
    setOrderSummary({ ...orderSummary, products: updatedProducts });

    try {
      const token = localStorage.getItem("token");
      await fetch(`${BASE_URL}/api/user/update-cart`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ medicine_id: product.medicineId, quantity }),
      });
    } catch (error) {
      console.error("Error updating cart quantity:", error);
    }
  };

  const handleRemove = async (productId: string) => {
    try {
      const res = await removeCart(productId);
      console.log(res);
      if (res.success) console.log(`Product ${productId} removed from cart`);
      // Optionally refresh UI or update state here
    } catch (error) {
      console.error("Error removing product:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPrescriptionFile(e.target.files[0]);
    }
  };

  if (loading)
    return <div className="flex items-center justify-center h-[100dvh]">Loading...</div>;

  const products = orderSummary?.products || [];
  const shipping = orderSummary?.shipping || 0;
  const taxes = orderSummary?.taxes || 0;
  const productsTotal = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const totalDue = productsTotal + taxes + shipping;
  const isEmpty = products.length === 0;
  const allFreeSchemeEligible = !isEmpty && products.every(p => p.prescriptionRequired && p.isFreeScheme);

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center h-full w-full text-gray-700">
          <h2 className="text-2xl font-semibold mb-4">Your shopping cart is empty</h2>
          <p>Add some products to see them here.</p>
        </div>
      ) : (
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full">
            <div className="max-w-5xl mx-auto flex flex-col lg:flex-row lg:space-x-8 xl:space-x-16">
              {/* Cart Items */}
              <div className="mb-6 lg:mb-0 flex-1">
                <header className="mb-4">
                  <h1 className="text-2xl md:text-3xl text-gray-800 font-bold">
                    Shopping Cart ({products.length} items)
                  </h1>
                </header>
                <CartItems
                  products={products}
                  onQuantityChange={handleQuantityChange}
                  onRemove={handleRemove}
                />
              </div>

              {/* Order Summary */}
              <div className="lg:w-72 xl:w-80">
                <div className="bg-white p-5 mt-6 shadow rounded-xl border">
                  <h2 className="text-blue-800 text-xl font-semibold mb-4">Order Summary</h2>
                  <ul className="mb-6">
                    <li className="flex justify-between py-2 border-b">
                      <span>Products & Subscriptions</span>
                      <span>${productsTotal.toFixed(2)}</span>
                    </li>
                    <li className="flex justify-between py-2 border-b">
                      <span>Shipping</span>
                      <span>{shipping === 0 ? "-" : `$${shipping.toFixed(2)}`}</span>
                    </li>
                    <li className="flex justify-between py-2 border-b">
                      <span>Taxes</span>
                      <span>${taxes.toFixed(2)}</span>
                    </li>
                    <li className="flex justify-between py-2 font-semibold text-blue-600">
                      <span>Total due</span>
                      <span>${totalDue.toFixed(2)}</span>
                    </li>
                  </ul>
                  <button
                    onClick={() => handleBuy(products)}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-800"
                  >
                    Buy Now - ${totalDue.toFixed(2)}
                  </button>
                  
                  {isEligible && allFreeSchemeEligible && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-800 font-medium mb-2">Free Medicine Scheme Eligible</p>
                      
                      <div className="mb-3">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Upload Prescription *</label>
                        <input 
                          type="file" 
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFileChange}
                          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-green-100 file:text-green-700 hover:file:bg-green-200"
                        />
                      </div>

                      <button
                        onClick={handleFreeOrder}
                        className="w-full py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 transition"
                      >
                        Order Free (Scheme)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      )}

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-emerald-600" />
              
              <div className="flex justify-center mb-6 mt-2">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                  className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-green-500 shadow-inner"
                >
                  <CheckCircle size={56} strokeWidth={2.5} />
                </motion.div>
              </div>

              <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Placed!</h2>
              <p className="text-gray-500 mb-6 leading-relaxed">Your free medicine request has been submitted successfully for verification.</p>

              <div className="bg-gray-50 rounded-xl p-4 mb-8 border border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Order ID</p>
                <p className="text-xl font-mono font-bold text-[#002E6E] tracking-tight">{successOrderNumber}</p>
              </div>

              <button
                onClick={() => navigate(`/dashboard/track/${successOrderNumber}`)}
                className="w-full py-3.5 bg-[#002E6E] text-white rounded-xl font-bold hover:bg-[#0043A4] transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-900/20"
              >
                Track Status
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Cart;
