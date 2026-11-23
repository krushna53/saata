import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import client from "../client";
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import { BLOCKS, INLINES } from '@contentful/rich-text-types';


const InfoSection = () => {
  const [info, setInfo] = useState([]);

  const cleanUpInfo = useCallback((rawdata) => {
    const cleaninfo = rawdata.map((item) => {
      const { sys, fields } = item;
      const { id } = sys;
      const infoTitle = fields.title;
      const link = fields.link;
      const linkLabel = fields.linkLabel;
      const infoDesc = fields.decription;
      const updatedInfo = { id, infoTitle, infoDesc, link, linkLabel };
      return updatedInfo;
    });
    setInfo(cleaninfo);
  }, []);

  const getInfo = useCallback(async () => {
    try {
      const response = await client.getEntries({
        content_type: "infoSection",
        order: "fields.order"
      });
      const responseData = response.items;
      if (responseData) {
        cleanUpInfo(responseData);
      } else {
        setInfo([]);
      }
    } catch (error) {
      console.log(error);
    }
  }, [cleanUpInfo]);

  useEffect(() => {
    getInfo();
  }, [getInfo]);
  const renderNode = (node, children) => {
    if (node.nodeType === 'embedded-asset-block' && node.data.target.sys.contentType.sys.id === 'pdf') {
      const { title, file } = node.data.target.fields;
      const url = file.url;
      return (
        <div style={{ width: '100%', height: '100vh' }}>
          <iframe src={url} title={title} style={{ width: '100%', height: '100%' }}></iframe>
        </div>
      );
    }

    return null;
  };
  return (
    <div className="main-container">
      <h2 className="main_title"></h2>
      {/* <div style={{color:"black", textAlign:"center", fontSize:"25px",margin:"10px 0"}}><a className="block w-full md:w-[500px] m-auto" href="/page/saata-conference"><img src="https://images.ctfassets.net/acxjtojz8lp2/3jJtJRK7b73qNqTgBzW2Hu/e9f26e13539025cf348ddb5c4f86cc2a/event-img.png" alt="banner"  style={{textAlign:"center", margin:"auto",}}/></a>
      <h3 style={{marginBottom:"50px",marginTop:"20px", color:"#a37bb6", fontSize:"35px", textTransform:"uppercase"}}>
      Tickets opening soon...
      <a href="/page/saata-conference">
     REGISTRATIONS ARE OPEN
      </a>
      </h3>
      </div> */}
      <div className="info-container mll-card">
        <div className="info-body">
          <span className="mll-badge">Celebrating 20 years of SAATA</span>
          <h2 className="info-title">MLL 2027</h2>
          <div className="mll-meta">
            <span className="mll-meta-item">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M3 10h18M8 3v4M16 3v4" />
              </svg>
              9–10 January 2027
            </span>
            <span className="mll-meta-dot" aria-hidden="true">•</span>
            <span className="mll-meta-item">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
                <circle cx="12" cy="9.5" r="2.5" />
              </svg>
              Montfort College, Bengaluru
            </span>
          </div>
          <p className="mll-theme">
            “The Many Faces of Confidentiality: Building Trust in a Complex World”
          </p>
          <div className="mll-deadline">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            Registration closes <strong>30 November 2026</strong>
          </div>
          <Link to="/page/mll-2027">
            <button className="read-more">Read More</button>
          </Link>
        </div>
      </div>
      {info.map((item, index) => {
        const richTextContent = documentToReactComponents(item.infoDesc, {
          renderNode: {
            ...renderNode,
            [INLINES.ASSET_HYPERLINK]: (node) => {
              const url = `https://${node.data.target.fields.file.url}`;
              return (
                <a href={url} target="_blank" rel="noopener noreferrer">
                  {node.data.target.fields.title}
                </a>
              );
            },
            [BLOCKS.EMBEDDED_ASSET]: (node) => {
              const { title, description, file } = node.data.target.fields;
              const url = file.url;
              const isPDF = file.contentType === 'application/pdf';

              if (isPDF) {
                return (
                  <div>
                    <iframe src={url} title={title} style={{ width: '100%', height: '100vh' }}></iframe>
                    {description}
                  </div>
                );
              }

              return null;
            },
          },
        });

        const linkProps = item.link.endsWith('.pdf') ? { target: '_blank' } : {};

        return (
          <div className="info-container" key={index}>
            <div className="info-body">
              <h2 className="info-title">{item.infoTitle}</h2>
              <p className="info-desc">{richTextContent}</p>
              <Link to={item.link} {...linkProps}>
                <button className="read-more">{item.linkLabel}</button>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default InfoSection;
