import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import client from "../client";
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import { BLOCKS, INLINES } from '@contentful/rich-text-types';
import Faq from '../Components/Faq'; // Import the Faq component

const BasicPage = () => {
  const { slug } = useParams();
  const [entry, setEntry] = useState([]);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const response = await client.getEntries({
          content_type: "basicPage",
          "fields.slug": slug,
          include: 2, // Include linked entries
        });
        // console.log(response)
        if (response.items.length) {
          setEntry(response.items);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchPage();
  }, [slug]);

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
    <>
      {
        entry.map((item) => {
          const { title, description, subTitle } = item.fields;
          const id = item.sys.id;
          const imageUrl = (item?.fields?.image?.fields?.file?.url) ? item?.fields?.image?.fields?.file?.url : '';
          const richTextContent = documentToReactComponents(description, {
            renderNode: {
              ...renderNode,
              [INLINES.ASSET_HYPERLINK]: (node) => (
                <a href={`https://` + node.data.target.fields.file.url} target="_blank" rel="noopener noreferrer">{node.data.target.fields.title}</a>
              ),
              [BLOCKS.EMBEDDED_ASSET]: (node) => {
                const { title, description, file } = node.data.target.fields;
                const url = file.url;
                const isPDF = file.contentType === 'application/pdf';
                if (file.details?.image) {
                  const { title, description, file } = node.data.target.fields;
                  const imageUrl = file.url;
                  const altText = description || title || "Image";
                  return (
                    <div className="custom-rich-text-image">
                      <img src={imageUrl} alt={altText} />
                    </div>
                  );
                }
                if (isPDF) {
                  return (
                    <div className="custom-rich-text-pdf">
                      <iframe src={url} title={title} style={{ width: '100%', height: '100vh' }}></iframe>
                      <p>{description}</p>
                    </div>
                  );
                }

                return null;
              },
            },
          });

          // Check if the "faq" reference is present in the "faq" field
          const faqReferences = item.fields.faq || [];
          const hasFaqReference = faqReferences.length > 0;

          // Check if the slug matches '/page/saata-conference'
          const isSaataConference = slug === 'saata-conference';
          
          return (
            <React.Fragment key={id}>
              <div className="about_us about_ta">
                <div className="about_us_wrapper">
                  <h2>{title}</h2>
                </div>
                <div className="aboutus_parent">
                  <div className="about_us_img">
                    <img src={imageUrl} alt={imageUrl.title} />
                    <h3>{subTitle}</h3>
                  </div>
                  {/* Conditionally render the button above the content */}
                  {isSaataConference && (
                    <div className="ticket-button-container">
                      <a href="/saata-conference-2025-registration" className="disabled-link">
                      Register Here
                      </a>
                    </div>
                  )}
                  <div className="about_us_content">
                    {richTextContent}
                  </div>
                  {hasFaqReference && (
                    <div id="Faq"> {/* Add id to scroll to */}
                      <h3 className=" text-center">FAQ</h3>
                      <Faq />
                    </div>
                  )}
                </div>
              </div>
            </React.Fragment>
          )
        })
      }
    </>
  )
}

export default BasicPage;
