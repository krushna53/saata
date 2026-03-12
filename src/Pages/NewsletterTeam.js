import React, { useState, useEffect } from "react";
import client from "../client";
import NewsLetterTeamSidebar from "../Components/NewsLetterTeamSidebar";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";

function NewsletterTeam() {
  const [entries, setEntries] = useState([]);
  const [activeSlug, setActiveSlug] = useState(null);

  useEffect(() => {
  const fetchPage = async () => {
    try {
      const response = await client.getEntries({
        content_type: "newsletterTeam",
      });

      if (response.items.length) {
        const items = response.items;
        setEntries(items);

        const hash = window.location.hash.replace("#", "");

        if (hash) {
          setActiveSlug(hash);
        } else {
          const firstSlug = items[0].fields.slug;

          window.location.hash = firstSlug;

          setActiveSlug(firstSlug);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  fetchPage();
}, []);

  const activeItem = entries.find(
    (item) => item.fields.slug === activeSlug
  );

  return (
    <div className="news-letter-team-wrapper">
      <NewsLetterTeamSidebar
        entries={entries}
        activeSlug={activeSlug}
        setActiveSlug={setActiveSlug}
      />

      {activeItem && (
        <div className="news-letter-team">
          <div className="new-letter-team-d-flex">
            <img
              src={activeItem.fields.image.fields.file.url}
              alt={activeItem.fields.fullName}
            />
            <div className="nes-letter-team-wrapper">
              <h2>{activeItem.fields.fullName}</h2>
              <h6>{activeItem.fields.designation}</h6>
            </div>
          </div>

          <div className="description">
            {documentToReactComponents(
              activeItem.fields.richTextEditor
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NewsletterTeam;