export default async function handler(req, res) {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }
  
    const { token } = req.body;
    const secretKey = "6LfHadkqAAAAAJATSrkKZUDFWqeNh2v6DD7tf4D8"; // Use your Secret Key here
  
    try {
      const response = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `secret=${secretKey}&response=${token}`,
      });
  
      const data = await response.json();
  
      if (data.success) {
        return res.status(200).json({ success: true });
      } else {
        return res.status(400).json({ success: false, error: "reCAPTCHA verification failed" });
      }
    } catch (error) {
      console.error("reCAPTCHA verification error:", error);
      return res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  }
  