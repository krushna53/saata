import React from "react";
import NewLetterImg from "../Images/2025_SAATA.jpg";


function NewLetterNov() {

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full text-center">
        <h1 className="text-2xl font-bold mb-4 text-[#a37bb6]">
          SAATA NewsLetter November 2025
        </h1>
        <a href="https://drive.google.com/uc?export=download&id=1W42a31a45_pks7im01unWS9XxLmRbH6t" target="_blank" rel="noopener noreferrer">
  <img
    src={NewLetterImg}
    alt="Certificate"
    className="w-full border rounded-lg"
  />
</a>

      </div>
    </div>
  );
}

export default NewLetterNov;
