import React, { useState, useEffect } from "react";
import client from "../client";

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

  // Pagination
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

  // Fetch Contentful data
  useEffect(() => {
    const fetchPage = async () => {
      try {
        const response = await client.getEntries({
          content_type: "certifiedMembersNew",
          order: "fields.name",
        });

        if (response.items.length) {
          const summary = {
            total: response.items.length,
            certificationLevel: {},
            specialization: {},
            roles: {},
          };

          const splitMulti = (value) =>
  value
    ? value.split(/[,;]+/).map((v) => v.trim()).filter(Boolean)
    : [];

const processed = response.items.map((item) => {
  const certLevels = splitMulti(item.fields.certifications);
  const roles = splitMulti(item.fields.roleThatDescribesYourCurrentProfessionalPrac);
  const specialization = splitMulti(item.fields.fieldOfTraining);

  // Update summary counts
  certLevels.forEach((level) => {
    summary.certificationLevel[level] = (summary.certificationLevel[level] || 0) + 1;
  });
  specialization.forEach((spec) => {
    summary.specialization[spec] = (summary.specialization[spec] || 0) + 1;
  });
  roles.forEach((r) => {
    summary.roles[r] = (summary.roles[r] || 0) + 1;
  });

  return {
    ...item,
    parsedFields: {
      name: item.fields.name || "",
      certifications: certLevels,
      fieldOfTraining: specialization,
      city: item.fields.city || "",
      contact: item.fields.contact || "",
      roles: roles,
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

  // Filters
const handleFilterChange = (e) => {
  const { name, value } = e.target;

  // update filters
  const updatedFilters = { ...filters, [name]: value };
  setFilters(updatedFilters);

  // filter logic
  const results = entry.filter((item) => {
    const itemName = item.parsedFields.name?.toLowerCase() || "";
    const itemCity = item.parsedFields.city?.toLowerCase() || "";

    // filter checks
    const nameMatch =
      itemName.includes(updatedFilters.name.toLowerCase());

    const cityMatch =
      updatedFilters.city === "" ||
      itemCity.includes(updatedFilters.city.toLowerCase());

    const roleMatch =
      updatedFilters.role === "All" ||
      item.parsedFields.roles?.includes(updatedFilters.role);

    const specMatch =
      updatedFilters.specialization === "All" ||
      item.parsedFields.fieldOfTraining?.includes(updatedFilters.specialization);

    const certMatch =
      updatedFilters.certificationLevel === "All" ||
      item.parsedFields.certifications?.includes(updatedFilters.certificationLevel);

    return (
      nameMatch &&
      cityMatch &&
      roleMatch &&
      specMatch &&
      certMatch
    );
  });

  // update results + reset pagination
  setFiltered(results);
  setCurrentPage(1);
};
const uniqueCertLevels = [...new Set(
  entry.flatMap(item => item.parsedFields.certifications)
)];

const uniqueSpecialisations = [...new Set(
  entry.flatMap(item => item.parsedFields.fieldOfTraining)
)];


  return (
    <div className="Certified-Members-section">
      <div className="Certified-Members-wrapper">
        <h2 className="text-3xl font-bold text-center text-purple-700 mb-8">Certified Members</h2>

        {/* Filters & Summary */}
        <div className="bg-purple-50 p-6 rounded-2xl shadow-sm mb-8">
          <h3 className="text-lg font-bold text-purple-700 mb-2">Certified Members Summary</h3>
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm border text-purple-700 font-semibold flex items-center">
              Total Certified Members: <span className="text-2xl font-bold text-purple-800">{stats.total || 0}</span>
            </div>
          </div>

          {/* Certification Level */}
          <div className="mb-4">
            <h4 className="text-base font-semibold text-gray-800 mb-2">By Certification Level</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.certificationLevel || {}).map(([level, count]) => (
                <button
                  key={level}
                  className="bg-[#a37bb6] bg-gradient-to-r text-white px-2 py-1.5 rounded-full text-xs font-bold shadow-sm"
                >
                  {level}: {count}
                </button>
              ))}
            </div>
          </div>

          {/* Specialization */}
          <div className="mb-4">
            <h4 className="text-base font-semibold text-gray-800 mb-2">By Specialization</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.specialization || {}).map(([spec, count]) => (
                <button
                  key={spec}
                  className="bg-[#a37bb6] bg-gradient-to-r text-white px-2 py-1.5 rounded-full text-xs font-bold shadow-sm"
                >
                  {spec}: {count}
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
     <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4">

  {/* By Name */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      By Name
    </label>
    <input
      type="text"
      name="name"
      value={filters.name}
      onChange={handleFilterChange}
      placeholder="Enter name"
      className="w-full border-gray-300 rounded-lg shadow-sm px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
    />
  </div>

  {/* By City */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      By City
    </label>
    <input
      type="text"
      name="city"
      value={filters.city}
      onChange={handleFilterChange}
      placeholder="Enter city"
      className="w-full border-gray-300 rounded-lg shadow-sm px-3 py-2"
    />
  </div>
{/* Certification Level */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Certification Level
  </label>

  <select
    name="certificationLevel"
    value={filters.certificationLevel}
    onChange={handleFilterChange}
    className="w-full border-gray-300 rounded-lg shadow-sm px-3 py-2"
  >
    <option value="All">All</option>

    {[...new Set(entry.flatMap(e => e.parsedFields.certifications))].map(level => (
      <option key={level} value={level}>
        {level}
      </option>
    ))}
  </select>
</div>


  {/* Role */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Role
    </label>
    <select
      name="role"
      value={filters.role}
      onChange={handleFilterChange}
      className="w-full border-gray-300 rounded-lg shadow-sm px-3 py-2"
    >
      <option value="All">All</option>
      {[...new Set(entry.flatMap((e) => e.parsedFields.roles))].map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </select>
  </div>

{/* Field of Training / Specialization */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Specialization
  </label>

  <select
    name="specialization"
    value={filters.specialization}
    onChange={handleFilterChange}
    className="w-full border-gray-300 rounded-lg shadow-sm px-3 py-2"
  >
    <option value="All">All</option>

    {[...new Set(entry.flatMap(e => e.parsedFields.fieldOfTraining))].map(spec => (
      <option key={spec} value={spec}>
        {spec}
      </option>
    ))}
  </select>
</div>


</div>

        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-xl">
            <thead className="bg-gradient-to-r from-purple-100 to-indigo-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Certifications</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Field of Training</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Role that describes your current professional practice</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">City</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Contact</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {currentItems.length > 0 ? (
                currentItems.map(({ sys, parsedFields }) => (
                  <tr key={sys.id} className="hover:bg-purple-50">

                    {/* Name */}
                    <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                      {parsedFields.name || "—"}
                    </td>

                    {/* Certifications */}
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {parsedFields.certifications?.length
                        ? parsedFields.certifications.join(", ")
                        : "—"}
                    </td>

                    {/* Field of Training */}
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {parsedFields.fieldOfTraining?.length
                        ? parsedFields.fieldOfTraining.join(", ")
                        : "—"}
                    </td>

                    {/* Roles */}
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {parsedFields.roles?.length
                        ? parsedFields.roles.join(", ")
                        : "—"}
                    </td>

                    {/* City */}
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {parsedFields.city || "—"}
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {parsedFields.contact || "—"}
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-6 text-center text-gray-500 italic"
                  >
                    No certified members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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
    </div>
  );
}

export default CertifiedMembers;
