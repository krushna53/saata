import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Route, Routes } from 'react-router-dom'
import Footer from "./Components/Footer";
import TopHeader from "./Components/TopHeader";
import Gallery from "./Pages/Gallery";
import Home from "./Pages/Home";
import MembershipRegistration from "./Pages/MembershipRegistration";
import CertifiedMembers from "./Pages/CertifiedMembers";
// import Article from "./Pages/Article";
// import Articles from "./Pages/ArticleDetail";
import BasicPage from './Pages/BasicPage'
import NewsletterTeam from './Pages/NewsletterTeam';
import CurrentandPreviousIssues from './Components/CurrentandPreviousIssues';
import Videos from './Components/Videos';
import SatjaTeam from './Pages/SatjaTeam';
import Faq from './Components/Faq';
import ExcelDisplay from './Components/ExcelDisplay';
import "./Css/input.css"
import CertificateForm from './Components/CertificateForm';
// import RazorpayButton from './Components/RazorpayButton';
import Payment from './Pages/Payment'
import AdvertiserRazorpay from "./Components/AdvertiserRazorpay";
function App() {
  const location = useLocation();
  const activeSlug = location.pathname.split('/').pop(); // Get the last part of the URL path
  const fileName = 'SAJTAMaster.xlsx'; // Specify your Excel file here

  useEffect(() => {
    document.body.classList.add(`page-${activeSlug}`); // Add the class to the body tag
    return () => {
      document.body.classList.remove(`page-${activeSlug}`); // Remove the class from the body tag when the component unmounts
    };
  }, [activeSlug]);

  return (
    <>
      <TopHeader activeSlug={activeSlug} />
      <Routes>
        <Route exact path='/' element={<Home />} />
        <Route exact path='page/:slug' element={<BasicPage />} />
        <Route exact path='/newsletterlist/' element={<CurrentandPreviousIssues />} />
        <Route exact path='/newsletterTeam/:slug' element={<NewsletterTeam />} />
        <Route exact path='/gallery' element={<Gallery />} />
        <Route exact path='/membershipregistration' element={<MembershipRegistration />} />
        <Route exact path='/Certifiedmembers' element={<CertifiedMembers />} />
        <Route exact path='/SAJTATeam' element={<SatjaTeam />} />
        {/* <Route exact path='/articles' element={<Article />} /> */}
        <Route exact path='/video' element={<Videos />} />
        <Route exact path='/sajta-journals' element={<ExcelDisplay />} fileName={fileName} />
        {/* <Route exact path='/article' element={<Articles />} /> */}
        <Route exact path='/faq' element={<Faq />} />

        <Route exact path='/mll-2025/generate-your-certificate' element={<CertificateForm />} />
        <Route exact path='/faq' element={<Faq />} />
        <Route exact path='/saata-conference-2025-registration' element={<Payment />} />
        <Route path="/advertise" element={<AdvertiserRazorpay />} />
      </Routes>
      {/* <RazorpayButton/> */}

      <Footer />
    </>
  );
}

export default App;
