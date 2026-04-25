import React from "react";
import { appPlans } from "../assets/assets";
import Footer from "../components/Footer";
import { authClient } from "../lib/auth-client"; // For getting auth token if needed, or we use standard fetch with credentials

interface Plan {
  id: string;
  name: string;
  price: string; // ✅ Added price
  credits: number;
  description: string;
  features: string[];
}

const Pricing = () => {
  const [plans] = React.useState<Plan[]>(appPlans);

  const handlePurchase = async (planId: string) => {
    try {
      // Assuming credentials are sent automatically or we extract session
      const baseUrl = import.meta.env.VITE_BASEURL || "http://localhost:3000";
      const { data: session } = await authClient.getSession();
      
      if (!session) {
        alert("Please login to purchase credits.");
        return;
      }

      const response = await fetch(`${baseUrl}/api/user/purchase-credits`, {
        method: "POST",
        credentials: "include", // Send auth cookies
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.message || "Failed to initiate checkout");
      }
    } catch (error) {
      console.error("Error during purchase:", error);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <>
      <div className="w-full max-w-5xl mx-auto z-20 max-md:px-4 min-h-[80vh]">

        {/* Header */}
        <div className="text-center mt-16">
          <h2 className="text-gray-100 text-3xl font-medium">
            Choose Your Plan
          </h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto mt-2">
            Start for free and scale up as you grow. Find the perfect plan
            for your content creation needs
          </p>
        </div>

        {/* Cards */}
        <div className="pt-14 py-4 px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="p-6 bg-black/20 ring ring-indigo-950 
                mx-auto w-full max-w-sm rounded-lg text-white 
                shadow-lg hover:ring-indigo-500 
                transition-all duration-300"
              >
                <h3 className="text-xl font-bold">{plan.name}</h3>

                <div className="my-3">
                  <span className="text-4xl font-bold">
                    {plan.price}
                  </span>
                  <span className="text-gray-300">
                    {" "} / {plan.credits} credits
                  </span>
                </div>

                <p className="text-gray-300 mb-6">
                  {plan.description}
                </p>

                <ul className="space-y-2 mb-6 text-sm">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <svg
                        className="h-5 w-5 text-indigo-400 mr-2"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-gray-400">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePurchase(plan.id)}
                  className="w-full py-2 px-4 
                  bg-indigo-500 hover:bg-indigo-600 
                  active:scale-95 text-sm 
                  rounded-md transition-all"
                >
                  Buy Now
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Text */}
        <p className="mx-auto text-center text-sm max-w-md mt-10 text-white/60 font-light">
          Project <span className="text-white">Creation / Revision</span> consume{" "}
          <span className="text-white">5 credits</span>.
          You can purchase more credits to create more projects.
        </p>

        <Footer />
      </div>
    </>
  );
};

export default Pricing;
