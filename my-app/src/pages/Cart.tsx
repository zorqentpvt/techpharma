import React, { useEffect, useState } from "react";
import CartItems from "../components/CartItems";
import { cartdata } from "../api/medapir";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  quantity: number;
};

type OrderSummary = {
  products: Product[];
  shipping: number;
  taxes: number;
  totalcost: number;
};

const Cart: React.FC<{ userId: string }> = ({ userId }) => {
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const response: any = await cartdata(userId);
      if (response.success && response.data) {
        setOrderSummary(response.data);
      } else {
        setOrderSummary({ products: [], shipping: 0, taxes: 0, totalcost: 0 });
      }
      setLoading(false);
    };
    fetchData();
  }, [userId]);

  const handleQuantityChange = (productId: number, quantity: number) => {
    if (!orderSummary) return;
    const updatedProducts = orderSummary.products.map((p) =>
      p.id === productId ? { ...p, quantity } : p
    );
    setOrderSummary({ ...orderSummary, products: updatedProducts });
  };

  const handleRemove = (productId: number) => {
    if (!orderSummary) return;
    const updatedProducts = orderSummary.products.filter((p) => p.id !== productId);
    setOrderSummary({ ...orderSummary, products: updatedProducts });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[100dvh]">Loading...</div>
    );
  }

  if (!orderSummary || orderSummary.products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] text-gray-700">
        <h2 className="text-2xl font-semibold mb-4">Your shopping cart is empty</h2>
        <p>Add some products to see them here.</p>
      </div>
    );
  }

  const { products, shipping, taxes } = orderSummary;
  const productsTotal = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const totalDue = productsTotal + taxes + shipping;

  return (
    <div className="flex h-[100dvh] overflow-hidden">
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
                  <h2 className="text-blue-800 text-xl font-semibold mb-4">
                    Order Summary
                  </h2>
                  <ul className="mb-6">
                    <li className="flex justify-between py-2 border-b">
                      <span>Products & Subscriptions</span>
                      <span>${productsTotal}</span>
                    </li>
                    <li className="flex justify-between py-2 border-b">
                      <span>Shipping</span>
                      <span>{shipping === 0 ? "-" : `$${shipping}`}</span>
                    </li>
                    <li className="flex justify-between py-2 border-b">
                      <span>Taxes</span>
                      <span>${taxes}</span>
                    </li>
                    <li className="flex justify-between py-2 font-semibold text-blue-600">
                      <span>Total due</span>
                      <span>${totalDue}</span>
                    </li>
                  </ul>
                  <button className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Buy Now - ${totalDue}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Cart;
