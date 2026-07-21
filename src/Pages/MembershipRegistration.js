import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const ZF_SCRIPT_ID = "zoho-zf-widget-script";
const ZF_SCRIPT_SRC =
  "https://js.zohostatic.com/books/zfwidgets/assets/js/zf-widget.js";
const WIDGET_CONTAINER_ID = "zf-widget-root-id";
// Fixed widget-name token Zoho's script expects as the first arg to
// ZFWidget.init - NOT the container DOM id (that comes from
// pricingTableComponentOptions.id / WIDGET_CONTAINER_ID below). Passing
// the container id here triggers "Invalid Value passed for widget name"
// inside zf-widget.js.
const ZF_WIDGET_NAME = "zf-pricing-table";
const POLL_INTERVAL_MS = 250;

const pricingTableComponentOptions = {
  id: "zf-widget-root-id",
  product_id:
    "2-100f56041247420861863c48d4996d31765f229dfe24ca784f7467fa64ca8b964690270b9f1a55cddcd6c241ff4b3036dfa3a71ded51c7686df85e795f5745a5",
  template: "elegant",
  most_popular_plan: "",
  is_group_by_frequency: false,
  isFrequencyDropdown: false,
  isCurrencyDropdown: false,
  can_show_plan_freq: true,
  pricebooks: [
    {
      pricebook_id: "968269000000000261",
      currency_code: "INR",
      currency_symbol: "Rs.",
      plans: [
        {
          plan_code: "AM",
          url: "https://subscriptions.zoho.in/subscribe/c327e9ccb28221cfdb4be4eb717e228a62117e38d252aed00823bcb88ecfdc2b/AM",
          recurring_price: "600",
          recurring_price_formatted: "Rs.600.00",
          hp_settings_id: "968269000000000291",
        },
        {
          plan_code: "TM",
          url: "https://subscriptions.zoho.in/subscribe/c327e9ccb28221cfdb4be4eb717e228a62117e38d252aed00823bcb88ecfdc2b/TM",
          recurring_price: "800",
          recurring_price_formatted: "Rs.800.00",
          hp_settings_id: "968269000000000291",
        },
        {
          plan_code: "CM",
          url: "https://subscriptions.zoho.in/subscribe/c327e9ccb28221cfdb4be4eb717e228a62117e38d252aed00823bcb88ecfdc2b/CM",
          recurring_price: "1500",
          recurring_price_formatted: "Rs.1,500.00",
          hp_settings_id: "968269000000000291",
        },
        {
          plan_code: "LM",
          url: "https://subscriptions.zoho.in/subscribe/c327e9ccb28221cfdb4be4eb717e228a62117e38d252aed00823bcb88ecfdc2b/LM",
          recurring_price: "15000",
          recurring_price_formatted: "Rs.15,000.00",
          hp_settings_id: "968269000000000291",
        },
      ],
    },
  ],
  group_options: [],
  plans: [
    { plan_code: "AM", selectedAddons: [] },
    { plan_code: "TM", selectedAddons: [] },
    { plan_code: "CM", selectedAddons: [] },
    { plan_code: "LM", selectedAddons: [] },
  ],
  theme: {
    color: "#7952b3",
    theme_color_light: "",
  },
  button_text: "Subscribe",
  product_url: "https://subscriptions.zoho.in",
  price_caption: "",
  language_code: "en",
  open_inSameTab: false,
};

const MembershipRegistration = () => {
  const [loading, setLoading] = useState(true);

  // Persists across React Strict Mode's mount -> cleanup -> mount replay
  // (same component instance, so refs are not reset), preventing
  // ZFWidget.init from ever being called more than once.
  const initializedRef = useRef(false);

  // Loads the script and calls ZFWidget.init once. Doesn't touch the
  // spinner - that's handled separately below.
  useEffect(() => {
    let script = document.getElementById(ZF_SCRIPT_ID);

    if (!script) {
      script = document.createElement("script");
      script.id = ZF_SCRIPT_ID;
      script.src = ZF_SCRIPT_SRC;
      script.type = "text/javascript";
      script.async = true;
      document.body.appendChild(script);
    }

    const initInterval = setInterval(() => {
      if (initializedRef.current) {
        clearInterval(initInterval);
        return;
      }

      if (window.ZFWidget && typeof window.ZFWidget.init === "function") {
        window.ZFWidget.init(ZF_WIDGET_NAME, pricingTableComponentOptions);
        initializedRef.current = true;
        clearInterval(initInterval);
      }
    }, POLL_INTERVAL_MS);

    return () => {
      clearInterval(initInterval);
    };
  }, []);

 // Show spinner until Zoho iframe is fully loaded
useEffect(() => {
  const interval = setInterval(() => {
    const iframe = document.querySelector("#zf-widget-root-id iframe");

    if (iframe) {
      clearInterval(interval);

      // Agar iframe pehle hi load ho chuka ho
      if (
        iframe.contentDocument?.readyState === "complete" ||
        iframe.contentWindow
      ) {
        setLoading(false);
      } else {
        iframe.addEventListener(
          "load",
          () => {
            setLoading(false);
          },
          { once: true }
        );
      }
    }
  }, 500);

  return () => {
    clearInterval(interval);
  };
}, []);

  return (
    <>
      {loading && (
        <div className="membership-loader">
          <div className="membership-spinner"></div>
          <h3>Please wait while the page loads</h3>
        </div>
      )}

      <div className="membership-ragistaion">
        <h4
          className="text-align-center"
          data-placeholder="Translation"
          dir="ltr"
          id="tw-target-text"
        >
          If you are already an existing SAATA Member,&nbsp;
          <a href="https://subscriptions.zoho.in/portal/saata1/login">
            Click here to login
          </a>
          &nbsp;|&nbsp;
          <Link to="/page/membership-details#Faq">FAQ</Link>
        </h4>

        <div id="zf-widget-root-id"></div>
      </div>
    </>
  );
};

export default MembershipRegistration;