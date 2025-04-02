import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <>
      <section className="footer">
        <div className="footer_wrapper">
          <div className="get_d_fex">
            <div className="right">
              <div className="footer_logo">
                <a
                  href="https://www.itaaworld.org/"
                  target="_blank"
                  rel="noreferrer"
                >
                  <img src="https://images.ctfassets.net/acxjtojz8lp2/6LUbiWFgIrHWIEp2HhBbgK/51141c84018a913c798ac2f79836025d/itaa2.png" alt="logo" />
                </a>
              </div>
            </div>

            <div className="left">
              <div className="footer_menu">
                <ul>
                  <li>
                    <Link to="/page/about-us">About SAATA</Link>
                  </li>
                  <li>
                    <Link to="/page/history-and-origin-of-saata">
                      History and Origin of SAATA
                    </Link>
                  </li>
                  <li>
                    <Link to="/page/mission-and-vision">
                      Mission and Vision
                    </Link>
                  </li>
                </ul>
                <ul>
                  <li>
                    <Link to="/page/about-ta">About TA</Link>
                  </li>
                  <li>
                    <Link to="page/eric-berne">Eric Berne</Link>
                  </li>

                  <li>
                    <Link to="page/saata-bot">SAATA BOT</Link>
                  </li>
                </ul>
                <ul>
                  {/* <li>
                    <Link to="/page/presidents-note">
                      President’s Note
                    </Link>
                  </li> */}
                  <li>
                    <Link to='/page/governance'>Governance</Link>
                  </li>
                  <li>
                    <Link to="/#contact">Contact Us</Link>
                  </li>
                  <li>
                    <Link to='/page/refund-policy'>Refund Policy</Link>
                  </li>
                </ul>
              </div>
            </div>
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
          <div className="copy_right">
            <p> © Copyright 2025 SAATA </p>
          </div>
        </div>
      </section>
    </>
  );
};

export default Footer;
