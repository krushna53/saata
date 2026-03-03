import React from "react";

const NewsLetterTeamSidebar = ({ entries, activeSlug, setActiveSlug }) => {
  return (
    <div className="newsletterTeam-folder">
      <ul>
        <li className="title">Meet the Newsletter Team</li>

        {entries.map((item) => {
          const { slug, title } = item.fields;

          return (
            <li key={slug}>
              <a
                href={`#${slug}`}
                className={activeSlug === slug ? "active" : ""}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveSlug(slug);
                  window.location.hash = slug;
                }}
              >
                {title}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default NewsLetterTeamSidebar;