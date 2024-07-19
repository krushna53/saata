import React from "react";
import sajtaContent from "../DataJson/JournalsData.json";

const Journals = () => {
  const { title, description, currentIssue, previousIssues } = sajtaContent;

  return (
    <div className="about_us about_ta">
      <div className="about_us_wrapper">
        <h2>{title}</h2>
      </div>
      <div className="about_us_img">
        <img src="" alt="" />
        <h3>{}</h3>
      </div>
      <div className="aboutus_parent">
        <div className="about_us_content">
          <p>{description}</p>
          <h3>
            <b>{currentIssue.title}</b>
          </h3>
          <p>
            <a href={currentIssue.issue.link}>
              {currentIssue.issue.name}
            </a>
          </p>
          <h3>
            <b>{previousIssues.title}</b>
          </h3>
          {previousIssues.issues.map((issue, index) => (
            <p key={index}>
              <a
                href={issue.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                {issue.name}
              </a>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Journals;
