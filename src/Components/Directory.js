import React, { useEffect, useState } from "react";
import CountUp from "react-countup";
const API_BASE =
  process.env.NODE_ENV === "development"
    ? "http://localhost:8888/.netlify/functions"
    : "/.netlify/functions";

const Directory = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState("");
  const [activeTab, setActiveTab] = useState("");
  const [pageByGroup, setPageByGroup] = useState({}); // Stores current page per group
  const itemsPerPage = 150;

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch(`${API_BASE}/getMembers`);
        const data = await res.json();

        const sorted =
          data.members?.sort((a, b) => a.name.localeCompare(b.name)) || [];

        setMembers(sorted);
      } catch (err) {
        console.error("Failed to load members", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  const groupMembers = (membersList) => {
    const groups = {};
    membersList.forEach((member) => {
      const type = member.membership || "Unknown";
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(member);
    });
    return groups;
  };

  const filteredMembers = members.filter((member) =>
    member.name?.toLowerCase().includes(searchName.toLowerCase())
  );

  const groupedMembers = groupMembers(filteredMembers);
  const groupEntries = Object.entries(groupedMembers);
  useEffect(() => {
    if (groupEntries.length && !activeTab) {
      setActiveTab(groupEntries[0][0]);
    }
  }, [groupEntries, activeTab]);

  const handlePageChange = (groupType, newPage) => {
    setPageByGroup((prev) => ({ ...prev, [groupType]: newPage }));
  };

  if (loading) return <div className="p-4 text-lg">Loading members...</div>;
  if (!groupEntries.length) return <div className="p-4">No members found.</div>;

  return (
    <div className="p-4 about_us about_ta">
      <h2 className="text-2xl font-bold mb-6">Member Directory</h2>
      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        {groupEntries.map(([type, group]) => (
         <button
  key={type}
  onClick={() => setActiveTab(type)}
  className={`text-sm px-4 py-2 rounded-md border transition ${
    activeTab === type
      ? "bg-[#a37bb6] text-white border-[#a37bb6]"
      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
  }`}
>
  {type} (
  <CountUp className=" font-bold "
    start={0}
    end={group.length}
    duration={1.5}
    separator=","
  />
  )
</button>
        ))}
      </div>
      <div className="w-full max-w-2xl mb-6">
        <div className="flex flex-col sm:flex-row  w-full">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="border px-4 py-2 rounded-md sm:rounded-l-md sm:rounded-r-none w-full"
          />
          <button
            onClick={() => console.log("Search:", searchName)}
            className="bg-[#a37bb6] text-white px-4 py-2 rounded-md sm:rounded-l-none sm:rounded-r-md w-full sm:w-auto"
          >
            Search
          </button>
        </div>
      </div>
      {activeTab && (
        <div>
          {groupEntries
            .filter(([type]) => type === activeTab)
            .map(([type, group]) => {
              const currentPage = pageByGroup[type] || 1;
              const startIndex = (currentPage - 1) * itemsPerPage;
              const paginatedMembers = group.slice(
                startIndex,
                startIndex + itemsPerPage
              );
              const totalPages = Math.ceil(group.length / itemsPerPage);
              return (
                <div key={type} className="w-full overflow-x-auto">
                  <table className="min-w-[800px] w-full table-auto border text-sm">
                    <thead>
                      <tr className="bg-gray-200 text-left">
                        <th className="border px-4 py-3">#</th>
                        <th className="border px-4 py-3">Full Name</th>
                        <th className="border px-4 py-3">Email Address</th>
                        <th className="border px-4 py-3">Membership Type</th>
                        <th className="border px-4 py-3">Validity Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedMembers.map((member, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="border px-4 py-2 font-medium">
                            {startIndex + i + 1}
                          </td>
                          <td className="border px-4 py-2">{member.name}</td>
                          <td className="border px-4 py-2">{member.email}</td>
                          <td className="border px-4 py-2">
                            {member.membership}
                          </td>
                          <td className="border px-4 py-2">
                            {member.validity
                              ? new Date(
                                  member.validity
                                ).toLocaleDateString("en-GB")
                              : "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex justify-center mt-4 space-x-2">
                      <button
                        onClick={() =>
                          handlePageChange(type, Math.max(currentPage - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className={`px-3 py-1 border rounded ${
                          currentPage === 1
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-gray-100 hover:bg-gray-200"
                        }`}
                      >
                        Prev
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => (
                        <button
                          key={i}
                          onClick={() => handlePageChange(type, i + 1)}
                          className={`px-3 py-1 border rounded ${
                            currentPage === i + 1
                              ? "bg-[#a37bb6] text-white"
                              : "bg-gray-100 hover:bg-gray-200"
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}

                      <button
                        onClick={() =>
                          handlePageChange(
                            type,
                            Math.min(currentPage + 1, totalPages)
                          )
                        }
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 border rounded ${
                          currentPage === totalPages
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-gray-100 hover:bg-gray-200"
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default Directory;
