import React, { useState, useEffect } from "react";
import client from "../client";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { BLOCKS, INLINES } from "@contentful/rich-text-types";
import CountUp from "react-countup";
function CertifiedMembers() {
  const [entry, setEntry] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filters, setFilters] = useState({
    name: "",
    city: "",
    certificationLevel: "All",
    role: "All",
    specialization: "All",
  });
  const [stats, setStats] = useState({});

  const extractName = (nameNode) => {
    if (!nameNode?.content) return "";
    const extractText = (nodes) =>
      nodes.flatMap((node) =>
        node.content ? extractText(node.content) : node.value ? [node.value] : []
      ).join("");
    return extractText(nameNode.content);
  };

 const extractFieldsFromQualification = (node) => {
  if (!node?.content) return {};

  const extractText = (nodes) =>
    nodes.flatMap((node) =>
      node.content ? extractText(node.content) : node.value ? [node.value] : []
    ).join("\n");

  const raw = extractText(node.content);
  const getValue = (label) => {
    const match = raw.match(new RegExp(`${label}:\\s*(.+)`, "i"));
    return match ? match[1].trim() : "";
  };

  const specializationRaw = getValue("Field of Training").toLowerCase();

  const specializationList = specializationRaw
    .replace(/ and /gi, ",")
    .replace(/\//g, ",")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  const knownSpecs = {
    psychotherapy: "Psychotherapy",
    education: "Education",
    counselling: "Counselling",
    counseling: "Counselling",
    organisation: "Organisation",
    organization: "Organisation"
  };

  const specialization = specializationList
    .map(s => knownSpecs[s.toLowerCase()])
    .filter(Boolean);

  return {
    specialization,
    role: getValue("Role"),
    city: getValue("Geographical Location") 
  };
};


  useEffect(() => {
    const fetchPage = async () => {
      try {
        const response = await client.getEntries({
          content_type: "certifiedMembers",
          order: "fields.title",
        });

        if (response.items.length) {
          const certifiedMembers = response.items.filter(
            item => item.fields.lable === "CertifiedMembers"
          );

          const summary = { total: certifiedMembers.length, certificationLevel: {}, specialization: {} };

         const processed = certifiedMembers.map(item => {
  const fields = {
    ...extractFieldsFromQualification(item.fields.qualification),
    role: item.fields.currentRoleStatus || "", 
  };

  const certLevels = item.fields.certificationLevels || [];

  certLevels.forEach((level) => {
    summary.certificationLevel[level] = (summary.certificationLevel[level] || 0) + 1;
  });

  fields.specialization.forEach(spec => {
    summary.specialization[spec] = (summary.specialization[spec] || 0) + 1;
  });

  return { ...item, parsedFields: { ...fields, certificationLevels: certLevels } };
});


          setEntry(processed);
          setFiltered(processed);
          setStats(summary);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchPage();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const updatedFilters = { ...filters, [name]: value };
    setFilters(updatedFilters);

    const results = entry.filter((item) => {
      const field = (key) => item.parsedFields?.[key]?.toLowerCase?.() || "";
      const nameValue = extractName(item.fields.name).toLowerCase();
      const titleValue = item.fields.title?.toLowerCase() || "";

      const nameOrTitleMatch = nameValue.includes(updatedFilters.name.toLowerCase()) ||
        titleValue.includes(updatedFilters.name.toLowerCase());

      const cityMatch =
  updatedFilters.city === "" ||
  item.parsedFields.city?.toLowerCase().includes(updatedFilters.city.toLowerCase());


      const roleMatch = updatedFilters.role === "All" || field("role").includes(updatedFilters.role.toLowerCase());

      const specMatch = updatedFilters.specialization === "All" ||
        item.parsedFields.specialization.includes(updatedFilters.specialization);

      const certLevelMatch =
        updatedFilters.certificationLevel === "All" ||
        item.parsedFields.certificationLevels?.includes(updatedFilters.certificationLevel);

      return nameOrTitleMatch && cityMatch && certLevelMatch && roleMatch && specMatch;
    });

    setFiltered(results);
  };

  const renderRichText = (content) =>
    documentToReactComponents(content, {
      renderNode: {
        [INLINES.ASSET_HYPERLINK]: (node) => (
          <a href={`https://${node.data.target.fields.file.url}`} target="_blank" rel="noopener noreferrer">
            {node.data.target.fields.title}
          </a>
        ),
        [BLOCKS.EMBEDDED_ASSET]: (node) => (
          <img
            src={`https:${node.data.target.fields.file.url}`}
            alt={node.data.target.fields.description || ""}
          />
        ),
      },
    });

  return (
    <div className="Certified-Members-section">
      <div className="Certified-Members-wrapper">
        <h2 className="Certified-Members-text">Certified Members</h2>
<div className="max-w-[1100px] mx-auto">
  <div className="bg-white border border-gray-200 rounded-2xl  p-6 mb-6">
   {/* Summary */}
<h2 className="text-lg font-bold text-purple-700 mb-2">
  Certified Members Summary
</h2>
<p className="text-base text-gray-800 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 mb-2 border border-purple-100 flex items-center gap-2">
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-6 h-6 text-purple-600"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 14c-3.314 0-6 2.239-6 5v1h12v-1c0-2.761-2.686-5-6-5zm0-2a4 4 0 100-8 4 4 0 000 8z"
    />
  </svg>

  <span className="font-semibold">Total Certified Members:</span>
  <CountUp
    className="text-2xl font-bold text-purple-700"
    end={stats.total || 0}
    duration={1.5}
  />
</p>

<div className=" gap-4 mb-6">
  <div>
   <h3 className="text-base font-semibold text-gray-800 mb-2 flex items-center gap-2">
    <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-5 h-5 text-[#a37bb6]"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a5 5 0 100-10 5 5 0 000 10z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.21 15.89l-1.42 4.11a.75.75 0 001.08.86L12 18.5l4.13 2.36a.75.75 0 001.08-.86l-1.42-4.11" />
  </svg>
  By Certification Level
</h3>
    <ul className=" flex flex-col sm:flex-row gap-2 mb-2 space-y-1 text-gray-700 text-sm">
      {["CTA", "PTSTA", "TSTA", "Diploma", "Advanced Diploma"].map((lvl) => (
        <li key={lvl} className="bg-[#a37bb6] bg-gradient-to-r  text-white px-2 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200 min-w-[120px] text-center mt-0 flex flex-col-reverse items-center gap-2">
          <span className="font-medium">{lvl}</span>{" "}
          <CountUp className="text-[18px] font-bold " end={stats.certificationLevel?.[lvl] || 0} duration={1.5} />
        </li>
      ))}
    </ul>
  </div>

  <div>
    <h3 className="text-base font-semibold text-gray-800 mb-2 flex items-center gap-2">
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-5 h-5 text-[#a37bb6]"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 9l10-5 10 5-10 5-10-5z" />
    <path d="M12 4v10" />
    <path d="M20 9v4a2 2 0 01-4 0v-2" />
    <path d="M6 12v4a6 3 0 0012 0v-4" />
  </svg>
  By Specialization
</h3>
    <ul className="flex flex-col sm:flex-row gap-2 space-y-1 text-gray-700 text-sm">
      {["Psychotherapy", "Education", "Counselling", "Organisation"].map(
        (spec) => (
          <li key={spec} className="bg-[#a37bb6] bg-gradient-to-r  text-white px-2 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200 min-w-[120px] text-center mt-0 flex flex-col-reverse items-center gap-2">
            <span className="font-medium">{spec}</span>{" "}
            <CountUp className="text-[18px] font-bold "
              end={stats.specialization?.[spec] || 0}
              duration={1.5}
            />
          </li>
        )
      )}
    </ul>
  </div>
</div>

    {/* Filters */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <div>
        <label htmlFor="name" className="block text-xs font-medium text-gray-700 mb-1">By Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={filters.name}
          onChange={handleFilterChange}
          placeholder="Enter name or title"
          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
        />
      </div>
      <div>
        <label htmlFor="city" className="block text-xs font-medium text-gray-700 mb-1">By City</label>
        <input
          type="text"
          id="city"
          name="city"
          value={filters.city}
          onChange={handleFilterChange}
          placeholder="Enter city"
          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
        />
      </div>
      <div>
        <label htmlFor="certificationLevel" className="block text-xs font-medium text-gray-700 mb-1">By Certification Level</label>
        <select
          id="certificationLevel"
          name="certificationLevel"
          value={filters.certificationLevel}
          onChange={handleFilterChange}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
        >
          {["All", "Diploma", "Advanced Diploma", "CTA", "PTSTA", "TSTA"].map((lvl) => (
            <option key={lvl}>{lvl}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="role" className="block text-xs font-medium text-gray-700 mb-1">By Role</label>
        <select
          id="role"
          name="role"
          value={filters.role}
          onChange={handleFilterChange}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
        >
          {["All", "Therapist", "Trainer", "Supervisor"].map((role) => (
            <option key={role}>{role}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="specialization" className="block text-xs font-medium text-gray-700 mb-1">By Field of Specialization</label>
        <select
          id="specialization"
          name="specialization"
          value={filters.specialization}
          onChange={handleFilterChange}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
        >
          {["All", "Psychotherapy", "Education", "Counselling", "Organisation"].map((spec) => (
            <option key={spec}>{spec}</option>
          ))}
        </select>
      </div>
    </div>
  </div>
</div>
        {/* Filtered Member Cards */}
        <div className="Certified-Members-folder">
          {filtered.map(({ fields, sys }) => (
            <div key={sys.id}>
              <div>{renderRichText(fields.qualification)}</div>
              <div className="certified-members-image-folder">
                <h2>{fields.title}</h2>
                {renderRichText(fields.name)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CertifiedMembers;