import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import client from "../client";
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import { BLOCKS, INLINES, MARKS } from '@contentful/rich-text-types';
import Faq from '../Components/Faq';

// Returns true if a node should become a card header.
// Matches: h2, h3, h4 nodes, AND paragraphs whose text is entirely bold.
const isCardHeader = (node) => {
  if ([BLOCKS.HEADING_2, BLOCKS.HEADING_3, BLOCKS.HEADING_4].includes(node.nodeType)) return true;
  if (node.nodeType !== BLOCKS.PARAGRAPH) return false;
  const inlines = node.content;
  if (!inlines || inlines.length === 0) return false;
  const hasText = inlines.some((n) => n.nodeType === 'text' && n.value && n.value.trim() !== '');
  if (!hasText) return false;
  return inlines.every((inline) => {
    if (inline.nodeType !== 'text') return true;
    if (!inline.value || inline.value.trim() === '') return true;
    return inline.marks && inline.marks.some((m) => m.type === MARKS.BOLD);
  });
};

// Extracts plain text from a Contentful node
const extractText = (node) => {
  if (!node.content) return node.value || '';
  return node.content.map(extractText).join('');
};

const BasicPage = () => {
  const { slug } = useParams();
  const [entry, setEntry] = useState([]);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const response = await client.getEntries({
          content_type: "basicPage",
          "fields.slug": slug,
          include: 2,
        });
        if (response.items.length) {
          setEntry(response.items);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchPage();
  }, [slug]);

  const isPathways = slug === 'pathways-to-TA-credentialing';

  const renderNode = (node) => {
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

  const sharedRenderOptions = {
    renderNode: {
      [INLINES.ASSET_HYPERLINK]: (node) => (
        <a href={`https://` + node.data.target.fields.file.url} target="_blank" rel="noopener noreferrer">
          {node.data.target.fields.title}
        </a>
      ),
      [BLOCKS.EMBEDDED_ASSET]: (node) => {
        const { title, description, file } = node.data.target.fields;
        const url = file.url;
        if (file.details?.image) {
          const altText = description || title || "Image";
          return (
            <div className="custom-rich-text-image">
              <img src={url} alt={altText} />
            </div>
          );
        }
        if (file.contentType === 'application/pdf') {
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
  };

  const renderDoc = (contentNodes) =>
    documentToReactComponents(
      { nodeType: BLOCKS.DOCUMENT, data: {}, content: contentNodes },
      sharedRenderOptions
    );

  // Groups raw Contentful nodes into cards split by bold-only paragraphs
  const buildPathwaysContent = (description) => {
    const nodes = description.content;
    const groups = [];
    let current = { heading: null, body: [] };

    nodes.forEach((node) => {
      if (isCardHeader(node)) {
        groups.push({ ...current });
        current = { heading: node, body: [] };
      } else {
        current.body.push(node);
      }
    });
    groups.push({ ...current });

    return groups.map((group, i) => {
      if (!group.heading) {
        return group.body.length > 0 ? (
          <div key={`intro-${i}`} className="pathways-intro">
            {renderDoc(group.body)}
          </div>
        ) : null;
      }

      const headerText = extractText(group.heading);

      return (
        <div key={`card-${i}`} className="pathways-card">
          <div className="pathways-card-header">{headerText}</div>
          <div className="pathways-card-body">
            {renderDoc(group.body)}
          </div>
        </div>
      );
    });
  };

  return (
    <>
      {entry.map((item) => {
        const { title, description, subTitle } = item.fields;
        const id = item.sys.id;
        const imageUrl = item?.fields?.image?.fields?.file?.url ?? '';

        const richTextContent = isPathways
          ? buildPathwaysContent(description)
          : documentToReactComponents(description, {
              renderNode: {
                ...renderNode,
                ...sharedRenderOptions.renderNode,
              },
            });

        const faqReferences = item.fields.faq || [];
        const hasFaqReference = faqReferences.length > 0;

        return (
          <React.Fragment key={id}>
            <div className="about_us about_ta">
              <div className="about_us_wrapper">
                <h2>{title}</h2>
              </div>
              <div className="aboutus_parent">
                {imageUrl && (
                  <div className="about_us_img">
                    <img src={imageUrl} alt={title} />
                    <h3>{subTitle}</h3>
                  </div>
                )}
                <div className={`about_us_content${isPathways ? ' pathways-content' : ''}`}>
                  {richTextContent}
                </div>
                {hasFaqReference && (
                  <div id="Faq">
                    <h3 className="text-center">FAQ</h3>
                    <Faq />
                  </div>
                )}
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </>
  );
};

export default BasicPage;
