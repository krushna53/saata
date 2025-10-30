import React, { useState, useEffect } from "react";
import client from "../client";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { BLOCKS, INLINES } from "@contentful/rich-text-types";

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

  // ✅ Extract plain text name
  const extractName = (nameNode) => {
    if (!nameNode?.content) return "";
    const extractText = (nodes) =>
      nodes
        .flatMap((node) =>
          node.content
            ? extractText(node.content)
            : node.value
            ? [node.value]
            : []
        )
        .join("");
    return extractText(nameNode.content);
  };

  // ✅ Extract specific fields cleanly from "Qualification" rich text
  const extractFieldsFromQualification = (node) => {
    if (!node?.content) return {};

    const extractText = (nodes) =>
      nodes
        .flatMap((node) =>
          node.content
            ? extractText(node.content)
            : node.value
            ? [node.value]
            : []
        )
        .join("\n");

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
      .map((s) => s.trim())
      .filter(Boolean);

    const knownSpecs = {
      psychotherapy: "Psychotherapy",
      education: "Education",
      counselling: "Counselling",
      counseling: "Counselling",
      organisation: "Organisation",
      organization: "Organisation",
    };

    const specialization = specializationList
      .map((s) => knownSpecs[s.toLowerCase()])
      .filter(Boolean);

    return {
      qualification: getValue("Qualification"),
      specialization,
      role: getValue("Role"),
      city: getValue("Geographical Location"),
      fieldOfTraining: getValue("Field of Training"),
      contact: getValue("Email"),
    };
  };

  // ✅ Fetch Contentful data
  useEffect(() => {
    const fetchPage = async () => {
      try {
        const response = await client.getEntries({
          content_type: "certifiedMembers",
          order: "fields.title",
        });

        if (response.items.length) {
          const certifiedMembers = response.items.filter(
            (item) => item.fields.lable === "CertifiedMembers"
          );

          const summary = {
            total: certifiedMembers.length,
            certificationLevel: {},
            specialization: {},
          };

          const processed = certifiedMembers.map((item) => {
  const fields = extractFieldsFromQualification(item.fields.qualification);
  const name = extractName(item.fields.title); // ✅ extract name here
  const certLevels = item.fields.certificationLevels || [];

  certLevels.forEach((level) => {
    summary.certificationLevel[level] =
      (summary.certificationLevel[level] || 0) + 1;
  });

  fields.specialization.forEach((spec) => {
    summary.specialization[spec] =
      (summary.specialization[spec] || 0) + 1;
  });

  return {
    ...item,
    parsedFields: { 
      title: item.fields.title,
      ...fields, 
      certificationLevels: certLevels 
    },
  };
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

  // ✅ Filters
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const updatedFilters = { ...filters, [name]: value };
    setFilters(updatedFilters);

    const results = entry.filter((item) => {
      const field = (key) => item.parsedFields?.[key]?.toLowerCase?.() || "";
      const nameValue = extractName(item.fields.name).toLowerCase();
      const titleValue = item.fields.title?.toLowerCase() || "";

      const nameOrTitleMatch =
        nameValue.includes(updatedFilters.name.toLowerCase()) ||
        titleValue.includes(updatedFilters.name.toLowerCase());

      const cityMatch =
        updatedFilters.city === "" ||
        item.parsedFields.city
          ?.toLowerCase()
          .includes(updatedFilters.city.toLowerCase());

      const roleMatch =
        updatedFilters.role === "All" ||
        field("role").includes(updatedFilters.role.toLowerCase());

      const specMatch =
        updatedFilters.specialization === "All" ||
        item.parsedFields.specialization.includes(
          updatedFilters.specialization
        );

      const certLevelMatch =
        updatedFilters.certificationLevel === "All" ||
        item.parsedFields.certificationLevels?.includes(
          updatedFilters.certificationLevel
        );

      return (
        nameOrTitleMatch &&
        cityMatch &&
        certLevelMatch &&
        roleMatch &&
        specMatch
      );
    });

    setFiltered(results);
  };

  // ✅ Render
  return (
    <div className="Certified-Members-section">
      <div className="Certified-Members-wrapper">
        <h2 className="Certified-Members-text text-3xl font-bold text-center text-purple-700 mb-8">
          Certified Members
        </h2>

        <div className="Certified-Members-folder mt-8">
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-xl overflow-hidden">
              <thead className="bg-gradient-to-r from-purple-100 to-indigo-100">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700 border-b">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700 border-b">
                    Qualification
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700 border-b">
                    Field of Training
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700 border-b">
                    Contact
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filtered.length > 0 ? (
                  filtered.map(({ fields, sys, parsedFields }) => (
                    <tr
                      key={sys.id}
                      className="hover:bg-purple-50 transition-colors duration-150"
                    >
                      <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                         {fields.title || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {parsedFields.qualification || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {parsedFields.fieldOfTraining || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {parsedFields.contact ? (
                          <a
                            href={`mailto:${parsedFields.contact}`}
                            className="text-purple-600 hover:text-purple-800 underline"
                          >
                            {parsedFields.contact}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-4 py-6 text-center text-gray-500 italic"
                    >
                      No certified members found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CertifiedMembers;
