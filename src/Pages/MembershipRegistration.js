import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";

const MembershipRegistration = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      const widget = document.querySelector("#zf-widget-root-id iframe");

      if (widget) {
        setLoading(false);
        clearInterval(interval);
      }
    }, 300);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      {loading && (
        <div className="page-loader">
          <div className="spinner"></div>
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

        <Helmet>
          <script
            type="text/javascript"
            src="https://js.zohostatic.com/books/zfwidgets/assets/js/zf-widget.js"
          ></script>

          <script type="text/javascript" defer>
            {`
            var pricingTableComponentOptions = { 
              id: 'zf-widget-root-id',
              product_id: '2-100f56041247420861863c48d4996d31765f229dfe24ca784f7467fa64ca8b964690270b9f1a55cddcd6c241ff4b3036dfa3a71ded51c7686df85e795f5745a5',
              template: 'elegant',
              most_popular_plan: '',
              is_group_by_frequency: false,
              isFrequencyDropdown: false,
              isCurrencyDropdown: false,
              can_show_plan_freq: true,
              pricebooks: [{ 
                pricebook_id: '968269000000000261',
                currency_code: 'INR',
                currency_symbol: 'Rs.',
                plans: [
                  {
                    plan_code: 'AM',
                    url: 'https://subscriptions.zoho.in/subscribe/c327e9ccb28221cfdb4be4eb717e228a62117e38d252aed00823bcb88ecfdc2b/AM',
                    recurring_price: '600',
                    recurring_price_formatted: 'Rs.600.00',
                    hp_settings_id: '968269000000000291'
                  },
                  {
                    plan_code: 'TM',
                    url: 'https://subscriptions.zoho.in/subscribe/c327e9ccb28221cfdb4be4eb717e228a62117e38d252aed00823bcb88ecfdc2b/TM',
                    recurring_price: '800',
                    recurring_price_formatted: 'Rs.800.00',
                    hp_settings_id: '968269000000000291'
                  },
                  {
                    plan_code: 'CM',
                    url: 'https://subscriptions.zoho.in/subscribe/c327e9ccb28221cfdb4be4eb717e228a62117e38d252aed00823bcb88ecfdc2b/CM',
                    recurring_price: '1500',
                    recurring_price_formatted: 'Rs.1,500.00',
                    hp_settings_id: '968269000000000291'
                  },
                  {
                    plan_code: 'LM',
                    url: 'https://subscriptions.zoho.in/subscribe/c327e9ccb28221cfdb4be4eb717e228a62117e38d252aed00823bcb88ecfdc2b/LM',
                    recurring_price: '15000',
                    recurring_price_formatted: 'Rs.15,000.00',
                    hp_settings_id: '968269000000000291'
                  }
                ]
              }],
              group_options: [],
              plans: [
                { plan_code: 'AM', selectedAddons: [] },
                { plan_code: 'TM', selectedAddons: [] },
                { plan_code: 'CM', selectedAddons: [] },
                { plan_code: 'LM', selectedAddons: [] }
              ],
              theme: {
                color: '#7952b3',
                theme_color_light: ''
              },
              button_text: 'Subscribe',
              product_url: 'https://subscriptions.zoho.in',
              price_caption: '',
              language_code: 'en',
              open_inSameTab: false
            };

            setTimeout(function () {
              ZFWidget.init('zf-pricing-table', pricingTableComponentOptions);
            }, 1000);
            `}
          </script>
        </Helmet>
      </div>
    </>
  );
};

export default MembershipRegistration;
