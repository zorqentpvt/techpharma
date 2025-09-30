import React from "react";
import CartItems from "../components/CartItems";
import AnalyticsComponent from "../components/AnalyticsComponent";

type OrderSummary = {
  productsTotal: number;
  shipping: number;
  taxes: number;
};

const mockOrderSummary: OrderSummary = {
  productsTotal: 205,
  shipping: 0,
  taxes: 48,
};

const Cart: React.FC = () => {
  const totalOrders = 5; // mock total orders
  const totalRevenue = 253; // mock total revenue (productsTotal + taxes)

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      {/* Content area */}
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full">
            {/* Page content */}
            <div className="max-w-5xl mx-auto flex flex-col lg:flex-row lg:space-x-8 xl:space-x-16">
              {/* Cart items */}
              <div className="mb-6 lg:mb-0">
                <div className="mb-3">
                  <div className="flex text-sm font-medium text-gray-400 dark:text-gray-500 space-x-2">
                    <span className="text-violet-500">Review</span>
                    <span>-&gt;</span>
                    <span className="text-gray-500 dark:text-gray-400">Payment</span>
                    <span>-&gt;</span>
                    <span className="text-gray-500 dark:text-gray-400">Confirm</span>
                  </div>
                </div>
                <header className="mb-2">
                  <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">
                    Shopping Cart ({totalOrders})
                  </h1>
                </header>

                {/* Cart items */}
                <CartItems />
              </div>

              {/* Order summary sidebar */}
              <div>
                <div className="bg-white dark:bg-gray-800 p-5 shadow-xs rounded-xl lg:w-72 xl:w-80">
                  <div className="text-gray-800 dark:text-gray-100 font-semibold mb-2">
                    Order Summary
                  </div>

                  {/* Order details */}
                  <ul className="mb-4">
                    <li className="text-sm w-full flex justify-between py-3 border-b border-gray-200 dark:border-gray-700/60">
                      <div>Products & Subscriptions</div>
                      <div className="font-medium text-gray-800 dark:text-gray-100">
                        ${mockOrderSummary.productsTotal}
                      </div>
                    </li>
                    <li className="text-sm w-full flex justify-between py-3 border-b border-gray-200 dark:border-gray-700/60">
                      <div>Shipping</div>
                      <div className="font-medium text-gray-800 dark:text-gray-100">
                        {mockOrderSummary.shipping === 0 ? "-" : `$${mockOrderSummary.shipping}`}
                      </div>
                    </li>
                    <li className="text-sm w-full flex justify-between py-3 border-b border-gray-200 dark:border-gray-700/60">
                      <div>Taxes</div>
                      <div className="font-medium text-gray-800 dark:text-gray-100">
                        ${mockOrderSummary.taxes}
                      </div>
                    </li>
                    <li className="text-sm w-full flex justify-between py-3 border-b border-gray-200 dark:border-gray-700/60">
                      <div>Total due (including taxes)</div>
                      <div className="font-medium text-green-600">
                        ${mockOrderSummary.productsTotal + mockOrderSummary.taxes}
                      </div>
                    </li>
                  </ul>

                  {/* Promo box */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium mb-1" htmlFor="promo">
                        Promo Code
                      </label>
                      <div className="text-sm text-gray-400 dark:text-gray-500 italic">
                        optional
                      </div>
                    </div>
                    <input id="promo" className="form-input w-full mb-2" type="text" />
                    <button
                      className="btn w-full bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white disabled:border-gray-200 dark:disabled:border-gray-700 disabled:bg-white dark:disabled:bg-gray-800 disabled:text-gray-300 dark:disabled:text-gray-600 disabled:cursor-not-allowed"
                      disabled
                    >
                      Apply Code
                    </button>
                  </div>

                  <div className="mb-4">
                    <button className="btn w-full bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white">
                      Buy Now - ${mockOrderSummary.productsTotal + mockOrderSummary.taxes}
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 italic text-center">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do{" "}
                    <a className="underline hover:no-underline" href="#0">
                      Terms
                    </a>
                    .
                  </div>
                </div>

                {/* Analytics Component */}
                <div className="mt-6">
                  <AnalyticsComponent
                    totalOrders={totalOrders}
                    totalRevenue={mockOrderSummary.productsTotal + mockOrderSummary.taxes}
                  />
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
