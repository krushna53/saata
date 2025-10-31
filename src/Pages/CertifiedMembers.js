import React, { useState, useEffect } from "react";
import client from "../client";
// import * as XLSX from "xlsx";
// import { saveAs } from "file-saver";
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ✅ Pagination calculations
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

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
        .flatMap((n) =>
          n.content ? extractText(n.content) : n.value ? [n.value] : []
        )
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

    const raw = extractText(node.content);

    const getValue = (...labels) => {
      const labelPattern = labels.join("|");
      // Improved regex handles newlines and stops cleanly at next label
      const regex = new RegExp(
        `(?:${labelPattern})\\s*[:|-]?\\s*([\\s\\S]*?)(?=\\s*(?:Qualification|Role|Position|Field of Training|Field|Specialization|Geographical Location|City|Location|Place|Address|Email|E-mail|Contact|Phone|Mobile|Website|Institute Name|Name of the Institute|$))`,
        "i"
      );
      const match = raw.match(regex);
      return match ? match[1].replace(/\s+/g, " ").trim() : "";
    };

    const qualification = getValue("Qualification");
    const role = getValue("Role", "Position");
    const fieldOfTraining = getValue("Field of Training", "Field", "Specialization");
    const city = getValue(
      "Geographical Location",
      "City",
      "Location",
      "Place",
      "Address"
    );
    const emailMatch = raw.match(/(?:Email|E-mail|Contact)\s*[:|-]?\s*([\w._%+-]+\s*@\s*[a-zA-Z0-9.-]+\s*\.\s*[a-zA-Z]{2,})/i);
    const email = emailMatch ? emailMatch[1].replace(/\s+/g, "").trim() : "";

    const phone = getValue("Phone", "Mobile", "Tel", "Contact Number", "Contact No", "Contact #", "Ph", "Number");

    const website = getValue("Website", "Web", "Site");

    const specializationList = fieldOfTraining
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
      qualification,
      specialization,
      role,
      city,
      fieldOfTraining,
      email,
      phone,
      website,
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
  // ✅ Export data to Excel
  // const exportToExcel = () => {
  //   if (!filtered.length) {
  //     alert("No data to export!");
  //     return;
  //   }

  //   // Prepare only the required columns
  //   const exportData = filtered.map(({ parsedFields }) => ({
  //     Name: parsedFields.title || "—",
  //     Certifications: parsedFields.qualification || "—",
  //     City: parsedFields.city || "—",
  //     "Field of Training": parsedFields.fieldOfTraining || "—",
  //     Contact:
  //       parsedFields.email ||
  //       parsedFields.phone ||
  //       parsedFields.website ||
  //       "—",
  //   }));

  //   // Create worksheet + workbook
  //   const ws = XLSX.utils.json_to_sheet(exportData);
  //   const wb = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(wb, ws, "Certified Members");

  //   // Generate and trigger file download
  //   const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  //   const blob = new Blob([excelBuffer], {
  //     type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  //   });
  //   saveAs(
  //     blob,
  //     `Certified_Members_${new Date().toISOString().split("T")[0]}.xlsx`
  //   );
  // };


  // ✅ Render
  return (
    <div className="Certified-Members-section">
      <div className="Certified-Members-wrapper">
        <h2 className="Certified-Members-text text-3xl font-bold text-center text-purple-700 mb-8">
          Certified Members
        </h2>
        {/* === Filter Section === */}
        <div className="Certified-Members-summary bg-purple-50 p-6 rounded-2xl shadow-sm mb-8">
          <h3 className="text-lg font-bold text-purple-700 mb-2">
            Certified Members Summary
          </h3>

          {/* Total Certified Members */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm border text-purple-700 font-semibold">
              Total Certified Members:{" "}
              <span className="text-2xl font-bold text-purple-800">
                {stats.total || 0}
              </span>
            </div>
          </div>

          {/* === Certification & Specialization Summary Buttons === */}
          <div className="mt-2">
            {/* Certification Level */}
            <h4 className="text-base font-semibold text-gray-800 mb-2">
              By Certification Level
            </h4>
            <div className="flex flex-wrap gap-2 mb-6">
              {Object.entries(stats.certificationLevel || {}).map(([level, count]) => (
                <button
                  key={level}
                  className="bg-[#a37bb6] bg-gradient-to-r  text-white px-2 py-1.5 rounded-full text-xs font-bold shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200 min-w-[120px] text-center mt-0"
                >
                  {level}: {count}
                </button>
              ))}
            </div>

            {/* Specialization */}
            <h4 className="text-base font-semibold text-gray-800 mb-2">
              By Specialization
            </h4>
            <div className="flex flex-wrap gap-2 mb-6">
              {Object.entries(stats.specialization || {}).map(([spec, count]) => (
                <button
                  key={spec}
                  className="bg-[#a37bb6] bg-gradient-to-r  text-white px-2 py-1.5 rounded-full text-xs font-bold shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200 min-w-[120px] text-center mt-0"
                >
                  {spec}: {count}
                </button>
              ))}
            </div>
          </div>

          {/* === Filter Inputs === */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                By Name
              </label>
              <input
                type="text"
                name="name"
                value={filters.name}
                onChange={handleFilterChange}
                placeholder="Enter name or title"
                className="w-full border-gray-300 rounded-lg shadow-sm px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* If you want to re-enable City filter, just uncomment */}
            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                By City
              </label>
              <input
                type="text"
                name="city"
                value={filters.city}
                onChange={handleFilterChange}
                placeholder="Enter city"
                className="w-full border-gray-300 rounded-lg shadow-sm px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div> */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                By Certification Level
              </label>
              <select
                name="certificationLevel"
                value={filters.certificationLevel}
                onChange={handleFilterChange}
                className="w-full border-gray-300 rounded-lg shadow-sm px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option>All</option>
                {Object.keys(stats.certificationLevel || {}).map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                By Role
              </label>
              <select
                name="role"
                value={filters.role}
                onChange={handleFilterChange}
                className="w-full border-gray-300 rounded-lg shadow-sm px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option>All</option>
                {[...new Set(entry.map((e) => e.parsedFields?.role).filter(Boolean))].map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                By Field of Specialization
              </label>
              <select
                name="specialization"
                value={filters.specialization}
                onChange={handleFilterChange}
                className="w-full border-gray-300 rounded-lg shadow-sm px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option>All</option>
                {Object.keys(stats.specialization || {}).map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>


        <div className="Certified-Members-folder mt-8">

          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-xl overflow-scroll md:overflow-hidden">
              <thead className="bg-gradient-to-r from-purple-100 to-indigo-100">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700 border-b">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700 border-b">
                    Certifications
                  </th>
                  {/* <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700 border-b">
                    City
                  </th> */}
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700 border-b">
                    Field of Training
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700 border-b">
                    Contact
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {currentItems.length > 0 ? (
                  currentItems.map(({ fields, sys, parsedFields }) => (
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
                      {/* <td className="px-4 py-3 text-sm text-gray-700">
                        {parsedFields.city || "—"}
                      </td> */}
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {parsedFields.fieldOfTraining || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {parsedFields.email ? (
                          <a
                            href={`mailto:${parsedFields.email}`}
                            className="text-purple-600 hover:text-purple-800 underline"
                          >
                            {parsedFields.email}
                          </a>
                        ) : parsedFields.phone ? (
                          <a
                            href={`tel:${parsedFields.phone}`}
                            className="text-purple-600 hover:text-purple-800 underline"
                          >
                            {parsedFields.phone}
                          </a>
                        ) : parsedFields.website ? (
                          <a
                            href={parsedFields.website.startsWith("http") ? parsedFields.website : `https://${parsedFields.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:text-purple-800 underline"
                          >
                            {parsedFields.website}
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
          {/* === Pagination === */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-lg border text-sm font-medium ${currentPage === 1
                  ? "text-gray-400 border-gray-200 cursor-not-allowed"
                  : "text-purple-700 border-purple-300 hover:bg-purple-50"
                  }`}
              >
                Prev
              </button>

              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1;
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded-lg text-sm font-semibold ${currentPage === page
                      ? "bg-purple-600 text-white"
                      : "bg-white text-purple-700 border border-purple-300 hover:bg-purple-50"
                      }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-lg border text-sm font-medium ${currentPage === totalPages
                  ? "text-gray-400 border-gray-200 cursor-not-allowed"
                  : "text-purple-700 border-purple-300 hover:bg-purple-50"
                  }`}
              >
                Next
              </button>
            </div>
          )}
        </div>
        {/* <div className="flex justify-end mb-4">
          <button
            onClick={exportToExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition"
          >
            Export to Excel
          </button>
        </div> */}

      </div>
    </div>
  );
}

export default CertifiedMembers;
