import React, { useState } from "react";
import logo from '../Images/logo.png';
import { Link, NavLink } from "react-router-dom";

const TopHeader = () => {
  const [modal, sertModal] = useState(false);

    const toggleModal = () => { sertModal(!modal) }
  return (
    <>
    <a href="#" onClick={toggleModal} className="show-btn"><i className="fa-solid fa-bars"></i></a>
    {modal &&(
      <div className="Top-header-section">
        <div className="Top-Header-wrapper">
          <div className="logo">
            <Link to='/'><img src={logo} alt="Logo"/></Link>
          </div>
          <ul onClick={toggleModal} className="menu">
          <li>
              <NavLink to="/">Certifications</NavLink>
            </li>
            <li>
              <a href="#member">Membership</a>
            </li>
            <li>
              <a href="#directory">Directory</a>
            </li>
            <li>
              <a href="#prg">Programs</a>
            </li>
            <li>
              <a href="#aw">Awards</a>
            </li>
            <li>
              <NavLink to="/Gallery">Gallery</NavLink>
            </li>
            <li>
              <a href="#news">Newsletter</a>
            </li>
            <li>
              <a href="#art">Articles</a>
            </li>
            <li>
              <a href="#jour">Journals</a>
            </li>
          </ul>
        </div>
      </div>
    )}
    <div className="Top-header-section-folder">
        <div className="Top-Header-wrapper-folder">
          <div className="logo">
          <Link to='/'><img src={logo} alt="Logo"/></Link>
          </div>
          <ul className="menu-folder">
            <li>
              <NavLink to="/">Certifications</NavLink>
            </li>
            <li>
              <NavLink to="/Membership_Registration" href="#member">Membership</NavLink>
            </li>
            <li>
              <NavLink to="/Certified_Members" href="#directory">Directory</NavLink>
            </li>
            <li>
              <a href="#prg">Programs</a>
            </li>
            <li>
              <a href="#aw">Awards</a>
            </li>
            <li>
              <NavLink to="/Gallery">Gallery</NavLink>
            </li>
            <li>
              <a href="#news">Newsletter</a>
            </li>
            <li>
              <a href="#art">Articles</a>
            </li>
            <li>
              <a href="#jour">Journals</a>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default TopHeader;