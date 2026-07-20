import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const ZF_SCRIPT_ID = "zoho-zf-widget-script";
const ZF_SCRIPT_SRC =
  "https://js.zohostatic.com/books/zfwidgets/assets/js/zf-widget.js";
const WIDGET_CONTAINER_ID = "zf-widget-root-id";
const MAX_WAIT_MS = 20000;
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
  const [loadFailed, setLoadFailed] = useState(false);

  // Persists across React Strict Mode's mount -> cleanup -> mount replay
  // (same component instance, so refs are not reset), preventing
  // ZFWidget.init from ever being called more than once.
  const initializedRef = useRef(false);
  const pollIntervalRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    startTimeRef.current = Date.now();

    const stopPolling = () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };

    const fail = () => {
      stopPolling();
      setLoadFailed(true);
      setLoading(false);
    };

    const succeed = () => {
      stopPolling();
      setLoading(false);
    };

    const tick = () => {
      // Already failed/stopped in a previous tick; nothing left to do.
      if (!pollIntervalRef.current) return;

      if (!initializedRef.current) {
        // Wait until the widget library has fully attached itself to
        // window before calling init - no fixed-delay guessing.
        if (window.ZFWidget && typeof window.ZFWidget.init === "function") {
          try {
            window.ZFWidget.init(
              WIDGET_CONTAINER_ID,
              pricingTableComponentOptions
            );
            initializedRef.current = true;
          } catch (err) {
            fail();
            return;
          }
        }
      } else {
        const iframe = document.querySelector(
          `#${WIDGET_CONTAINER_ID} iframe`
        );
        if (iframe) {
          succeed();
          return;
        }
      }

      if (Date.now() - startTimeRef.current >= MAX_WAIT_MS) {
        fail();
      }
    };

    const handleScriptError = () => {
      fail();
    };

    // Reuse an already-injected tag (e.g. from a previous mount) instead
    // of adding a second <script src="..."> to the document.
    let script = document.getElementById(ZF_SCRIPT_ID);

    if (!script) {
      script = document.createElement("script");
      script.id = ZF_SCRIPT_ID;
      script.src = ZF_SCRIPT_SRC;
      script.type = "text/javascript";
      script.async = true;
      document.body.appendChild(script);
    }

    script.addEventListener("error", handleScriptError);

    pollIntervalRef.current = setInterval(tick, POLL_INTERVAL_MS);
    tick(); // covers the case where ZFWidget is already loaded/ready

    return () => {
      script.removeEventListener("error", handleScriptError);
      stopPolling();
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

      {loadFailed && (
        <div className="membership-loader">
          <h3>
            We couldn't load the membership plans. Please refresh the page or
            try again later.
          </h3>
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