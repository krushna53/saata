import React from "react";
import CertifiedMembersData from "../DataJson/CertifiedMembersData";

function CertifiedMembers() {
  return (
    <>
      <div className="Certified-Members-section">
        <div className="Certified-Members-wrapper">
          <h2 className="Certified-Members-text">Certified Members</h2>
          <div className="Certified-Members-folder">
            {CertifiedMembersData.map((val) => {
              return (
                <div className="Certified-Members-card">
                  <div className="Certified-Members-image">
                    <img src={val.image} alt={val.image} />
                  </div>
                  <h2>{val.title}</h2>
                  <div className="Certified-Members-details-folder">
                    <div className="Certified-Members-details">
                      <h2>{val.Qualification1}</h2>
                      <p>{val.Qualificationdes1}</p>
                    </div>
                    <div className="Certified-Members-details">
                      <h2>{val.Qualification2}</h2>
                      <p>{val.Qualificationdes2}</p>
                    </div>
                    <div className="Certified-Members-details">
                      <h2>{val.Qualification3}</h2>
                      <p>{val.Qualificationdes3}</p>
                    </div>
                    <div className="Certified-Members-details">
                      <h2>{val.Qualification4}</h2>
                      <p>{val.Qualificationdes4}</p>
                    </div>
                    <div className="Certified-Members-details">
                      <h2>{val.Qualification5}</h2>
                      <p>{val.Qualificationdes5}</p>
                    </div>
                    <div className="Certified-Members-details">
                      <h2>{val.Qualification6}</h2>
                      <p>{val.Qualificationdes6}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

export default CertifiedMembers;