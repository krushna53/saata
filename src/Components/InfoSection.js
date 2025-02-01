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
      <div style={{color:"black", textAlign:"center", fontSize:"25px",margin:"10px 0"}}><a href="/page/saata-conference" style={{display:"block", width:"500px", margin:"auto"}}><img src="https://images.ctfassets.net/acxjtojz8lp2/3jJtJRK7b73qNqTgBzW2Hu/e9f26e13539025cf348ddb5c4f86cc2a/event-img.png" alt="banner"  style={{textAlign:"center", margin:"auto",}}/></a>
      <h3 style={{marginBottom:"50px",marginTop:"20px", color:"#a37bb6", fontSize:"35px", textTransform:"uppercase"}}>
      Tickets opening soon...
      </h3>
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