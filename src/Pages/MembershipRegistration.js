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
  console.log("MembershipRegistration mounted");

  let script = document.getElementById(ZF_SCRIPT_ID);

  if (!script) {
    console.log("Creating script...");

    script = document.createElement("script");
    script.id = ZF_SCRIPT_ID;
    script.src = ZF_SCRIPT_SRC;
    script.type = "text/javascript";
    script.async = true;

    script.onload = () => {
      console.log("✅ Script Loaded");
      console.log("ZFWidget:", window.ZFWidget);
    };

    script.onerror = () => {
      console.log("❌ Script Failed");
    };

    document.body.appendChild(script);

    console.log("Script appended:", document.getElementById(ZF_SCRIPT_ID));
  }

  const initInterval = setInterval(() => {
    console.log("Polling:", window.ZFWidget);

    if (initializedRef.current) {
      clearInterval(initInterval);
      return;
    }

    if (window.ZFWidget && typeof window.ZFWidget.init === "function") {
      console.log("Calling ZFWidget.init()");

      window.ZFWidget.init(
        ZF_WIDGET_NAME,
        pricingTableComponentOptions
      );

      initializedRef.current = true;
      clearInterval(initInterval);
    }
  }, 500);

  return () => clearInterval(initInterval);
}, []);

 // Show spinner until the widget's content has rendered, then hide it
// shortly after. Waiting for mutations to go fully "quiet" doesn't work
// here - this widget keeps touching the DOM (hover states etc.) even
// after the real pricing cards are visible, so that quiet window never
// arrives and the spinner never hides. Instead: wait for the *first*
// sign of real content, then hide the spinner a fixed short delay after
// that (enough time for an empty-wrapper-then-fill swap to finish).
const RENDER_GRACE_MS = 2000;

useEffect(() => {
  const container = document.getElementById("zf-widget-root-id");
  if (!container) return undefined;

  let renderTimer = null;
  let contentSeen = false;

  const finish = () => {
    console.log("Widget content ready");
    setLoading(false);
    observer.disconnect();
  };

  const onContentDetected = () => {
    if (contentSeen) return;
    contentSeen = true;
    renderTimer = setTimeout(finish, RENDER_GRACE_MS);
  };

  const observer = new MutationObserver(() => {
    if (container.childElementCount > 0) {
      onContentDetected();
    }
  });

  observer.observe(container, {
    childList: true,
    subtree: true,
  });

  // Covers the case where content is already there by the time this
  // effect runs.
  if (container.childElementCount > 0) {
    onContentDetected();
  }

  return () => {
    observer.disconnect();
    if (renderTimer) clearTimeout(renderTimer);
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