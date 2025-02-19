import React, { useRef, useImperativeHandle, forwardRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";

const Recaptcha = forwardRef(({ onVerify }, ref) => {
  const recaptchaRef = useRef(null);

  // Expose resetRecaptcha function to parent (CertificateForm)
  useImperativeHandle(ref, () => ({
    resetRecaptcha: () => {
      if (recaptchaRef.current) {
        recaptchaRef.current.reset(); // Reset reCAPTCHA
      }
    },
  }));

  return (
    <ReCAPTCHA
      ref={recaptchaRef}
      sitekey="6LeeptsqAAAAAOuZD9fPHKLgIMCupS6Bojj_VeoG" // Replace with your actual site key
      onChange={(token) => onVerify(token)}
      onExpired={() => onVerify(null)}
      className="mb-4"
    />
  );
});

export default Recaptcha;
