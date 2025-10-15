import React from "react";

const CartItems: React.FC = () => {
  return (
    <>
      <ul className=" p-6 bg-gradient-to-br from-white to-blue-50 border-2 border-blue-100 rounded-2xl">
        {/* Cart item */}
        <li className="sm:flex items-center py-6 border-b border-gray-200 dark:border-gray-700/60">
          <a
            className="block mb-4 sm:mb-0 mr-5 md:w-32 xl:w-auto shrink-0"
            href="#0"
          >
            <img
              className="rounded-xs"
              src="https://via.placeholder.com/200x142.png?text=Product+01"
              width={200}
              height={142}
              alt="Product 01"
            />
          </a>
          <div className="grow">
            <a href="#0">
              <h3 className="text-2xl font-semibold text-blue-800  mb-1">
                Panadol
              </h3>
            </a>
            <div className="text-sm mb-2">
              Paracetamol
            </div>
            {/* Product meta */}
            <div className="flex flex-wrap justify-between items-center">
              {/* Rating and price */}
              <div className="flex flex-wrap items-center space-x-2 mr-2">
                {/* Rating */}
                <div className="flex items-center space-y-2">
                </div>
                <div>
                  <div className="inline-flex text-sm font-medium bg-green-500/20 text-green-700 rounded-full text-center px-2 py-0.5">
                    10 .00 Rs
                  </div>
                </div>
              </div>
              <button className="text-xs rounded-2xl text-blue-50 bg-blue-500  hover:bg-blue-50 hover:text-blue-800 p-1.5 pt-0.5 pb-0.5">
                Remove
              </button>
            </div>
          </div>
        </li>

        {/* Cart item */}
        <li className="sm:flex items-center py-6 border-b border-gray-200 dark:border-gray-700/60">
          <a
            className="block mb-4 sm:mb-0 mr-5 md:w-32 xl:w-auto shrink-0"
            href="#0"
          >
            <img
              className="rounded-xs"
              src="https://via.placeholder.com/200x142.png?text=Product+02"
              width={200}
              height={142}
              alt="Product 02"
            />
          </a>
          <div className="grow">
            <a href="#0">
              <h3 className="text-2xl font-semibold text-blue-800  mb-1">
                Ozempic 
              </h3>
            </a>
            <div className="text-sm mb-2">
              Semaglutide injection
            </div>
            {/* Product meta */}
            <div className="flex flex-wrap justify-between items-center">
              <div className="flex flex-wrap items-center space-x-2 mr-2">
                    
                
                <div>
                  <div className="inline-flex text-sm font-medium bg-green-500/20 text-green-700 rounded-full text-center px-2 py-0.5">
                    30 .00 Rs
                  </div>
                </div>
              </div>
              <button className="text-xs rounded-2xl text-blue-50 bg-blue-500  hover:bg-blue-50 hover:text-blue-800 p-1.5 pt-0.5 pb-0.5">
                Remove
              </button>
            </div>
          </div>
        </li>

        {/* Cart item */}
        <li className="sm:flex items-center py-6 border-b border-gray-200 dark:border-gray-700/60 min-w-150">
          <a
            className="block mb-4 sm:mb-0 mr-5 md:w-32 xl:w-auto shrink-0"
            href="#0"
          >
            <img
              className="rounded-xs"
              src="https://via.placeholder.com/200x142.png?text=Product+03"
              width={200}
              height={142}
              alt="Product 03"
            />
          </a>
          <div className="grow ">
            <a href="#0">
              <h3 className="text-2xl font-semibold text-blue-800  mb-1">
                Cipro
              </h3>
            </a>
            <div className="text-sm mb-2">
              ciprofloxacin (oral) 
            </div>
            {/* Product meta */}
            <div className="flex flex-wrap justify-between items-center">
              <div className="flex flex-wrap items-center space-x-2 mr-2">
                
                <div className="text-gray-400 dark:text-gray-600">·</div>
                <div>
                  <div className="inline-flex text-sm font-medium bg-green-500/20 text-green-700 rounded-full text-center px-2 py-0.5">
                    27 .00 Rs
                  </div>
                </div>
              </div>
              <button className="text-xs rounded-2xl text-blue-50 bg-blue-500  hover:bg-blue-50 hover:text-blue-800 p-1.5 pt-0.5 pb-0.5">
                Remove
              </button>
            </div>
          </div>
        </li>
      </ul>

      <div className="flex items-center gap-3 text-left px-4 py-2 rounded-lg hover:shadow-xl pt-3 mt-6 w-40 font-medium transition-all
      bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md">
        <a
          className="text-sm font-medium text-blue-50 "          
          href="#0">
           Back To Shopping
        </a>
      </div>
    </>
  );
};

export default CartItems;

