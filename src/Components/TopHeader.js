import React, { useState } from "react";
import logo from '../Images/logo.png';
import { Link, NavLink } from "react-router-dom";

const TopHeader = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div className="Top-header-section-folder">
      <div className="Top-Header-wrapper-folder">
        <div className="logo">
          <Link to='/'><img src={logo} alt="Logo" /></Link>
        </div>
        <div className="social_icon">
          <a
            href="https://www.facebook.com/saataworld"
            target="_blank"
            rel="noreferrer"
          >
            {" "}
            <i className="fa-brands fa-facebook"></i>
          </a>
          <a href="https://www.instagram.com/saata_org/?igshid=MzRlODBiNWFlZA%3D%3D"
            target="_blank"
            rel="noreferrer">
            {""}
            <i className="fa-brands fa-instagram"></i>
          </a>
          <a
            href="https://twitter.com/saataorg"
            target="_blank"
            rel="noreferrer"
          >
            {" "}
            <i className="fa-brands fa-twitter"></i>
          </a>
          <a
            href="https://www.youtube.com/channel/UCGTMW3BmOElfJNNoUH2x9JA/videos"
            target="_blank"
            rel="noreferrer"
          >
            {" "}
            <i className="fa-brands fa-youtube"></i>
          </a>
        </div>
        <button className="menu-toggle" onClick={toggleMenu}>
          <div className="menu-toggle-bar"></div>
          <div className="menu-toggle-bar"></div>
          <div className="menu-toggle-bar"></div>
        </button>
        <ul className={`menu-folder ${menuOpen ? 'menu-open' : ''}`}>
          <li className="menu_item"><NavLink to='/'>Home</NavLink></li>
          <li className="Certifications menu_item">
            <NavLink to="/">Certifications</NavLink>
            <ul className="Certifications-folder">
            <li>
                <NavLink to="/page/pathways-to-TA-credentialing" onClick={toggleMenu}>
                Pathways to TA Credentialing
                </NavLink>
              </li>
              <li>
                <NavLink to="/page/examination-documents" onClick={toggleMenu}>
                  Examination Documents
                </NavLink>
              </li>
              <li>
                <NavLink to="/page/examination-forms" onClick={toggleMenu}>
                  Examination forms
                </NavLink>
              </li>
            </ul>
          </li>
          <li className="Membership menu_item Newsletter">
            <NavLink to="/">Membership</NavLink>
            <ul className="Membership-folder">
              <li>
                <NavLink to="/page/membership-details" onClick={toggleMenu}>
                  Membership Details
                </NavLink>
              </li>
              <li>
                <NavLink to="/membershipRegistration" onClick={toggleMenu}>
                  Registration
                </NavLink>
              </li>
              <li>
                <NavLink to="/page/membership-renewal" onClick={toggleMenu}>
                  Renewal / Login
                </NavLink>
              </li>
              <li className="directory menu_item Newsletter">
                <NavLink to="/CertifiedMembers">Directory</NavLink>
               
              </li>
            </ul>
          </li>
          <li className="Programs menu_item">
            <NavLink to="/">Events</NavLink>
            <ul className="Programs-folder">
              <li>
                <NavLink to="/page/saata-calendar" onClick={toggleMenu}>
                Saata Calendar
                </NavLink>
              </li>
              <li>
                <NavLink to="/page/ta-101-program-details" onClick={toggleMenu}>
                  TA 101 - Program Details
                </NavLink>
              </li>
              <li>
                <NavLink to="/page/sajta-event" onClick={toggleMenu}>
                SAJTA Event
                </NavLink>
              </li>
              <li>
                <NavLink to="/page/mll-2025" onClick={toggleMenu}>
                  MLL 2025
                </NavLink>
              </li>
              <li className="News_hover">
              <NavLink to="/">Past Events</NavLink>
                <ul className="hover">
                <li>
                <NavLink to="/page/mll-2024" onClick={toggleMenu}>
                  MLL 2024
                </NavLink>
              </li>
                  
                </ul>
              </li>
              {/* <li>
                <NavLink to="/page/saata-conference" onClick={toggleMenu}>
                SAATA Conference
                </NavLink>
              </li> */}
              {/* <li>
                <NavLink to="/page/call-for-proposals" onClick={toggleMenu}>
                  Call for Proposals
                </NavLink>
              </li> */}
              {/* <li>
                <NavLink to="/page/conference-brochure" onClick={toggleMenu}>
                  Conference Brochure
                </NavLink>
              </li>
              <li>
                <NavLink to="/page/saata-conference-registration" onClick={toggleMenu}>
                  Conference Registration
                </NavLink>
              </li> */}
            </ul>
          </li>
          <li className="Awards menu_item">
            <NavLink to="/">Awards</NavLink>
            <ul className="Awards-folder">
              <li>
                <NavLink to="/page/awards" onClick={toggleMenu}>
                  Professional Excellence Award
                </NavLink>
              </li>
              <li>
                <NavLink to="/page/service-award" onClick={toggleMenu}>
                  Service Awards
                </NavLink>
              </li>
              <li>
                <NavLink to="/page/call-for-nominations" onClick={toggleMenu}>
                  Call for Nominations
                </NavLink>
              </li>
            </ul>
          </li>
          <li className="menu_item">
            <NavLink to="/Gallery" onClick={toggleMenu}>
              Gallery
            </NavLink>
          </li>
          <li className="Newsletter menu_item">
            <NavLink to="/">Publications</NavLink>
            <ul className="Newsletter-folder">
              <li className="News_hover">
                <NavLink to="/">Newsletter</NavLink>
                <ul className="hover">
                  <li>
                    <NavLink to="/newsletterTeam/truth-seeker" onClick={toggleMenu}>
                      Newsletter Team
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/newsletterlist/" onClick={toggleMenu}>
                      Current and Previous Issues
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/page/guidelines-for-content-contributors" onClick={toggleMenu}>
                      Guidelines
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/page/newsletter-advertisement-policy" onClick={toggleMenu}>
                      Advertisement Policy
                    </NavLink>
                  </li>
                  {/* <!-- <li>
                    <NavLink to="/page/team-that-was" onClick={toggleMenu}>
                      Team that Was
                    </NavLink>
                  </li> --> */}
                </ul>
              </li>
              <li className="News_hover">
                <NavLink to="/page/journals" onClick={toggleMenu}>
                  SAJTA Journals
                </NavLink>
                <ul className="hover">
                <li>
                    <NavLink to="/sajta-journals" onClick={toggleMenu}>
                    Current and Previous Issues
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/SAJTATeam" onClick={toggleMenu}>
                      SAJTA Team
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/page/sajta-submission-guidelines" onClick={toggleMenu}>
                    SAJTA Guidelines
                    </NavLink>
                  </li>
                  
                </ul>
              </li>

            </ul>
          </li>
          <li className="Newsletter menu_item">
            <NavLink to="/">Resources</NavLink>
            <ul className="Newsletter-folder">
              <li>
                <NavLink to="/" onClick={toggleMenu}>
                  Articles
                </NavLink>
              </li>
              <li>
                <NavLink to="/video" onClick={toggleMenu}>
                  Videos
                </NavLink>
              </li>
            </ul>
          </li>
          <li className="login_btn">
            <a
              href="https://subscriptions.zoho.in/portal/saata1/login"
              target="_blank"
              rel="noreferrer"
              onClick={toggleMenu}
              title="Click here to login to Zoho Portal to view member details"
            >
              Member Login
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default TopHeader;
