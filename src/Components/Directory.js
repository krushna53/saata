import React, { useEffect, useState } from "react";

const API_BASE =
  process.env.NODE_ENV === "development"
    ? "http://localhost:8888/.netlify/functions"
    : "/.netlify/functions";

const Directory = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState("");
  const [activeTab, setActiveTab] = useState("");

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

  if (loading) return <div className="p-4 text-lg">Loading members...</div>;
  if (!groupEntries.length) return <div className="p-4">No members found.</div>;

  return (
    <div className="p-4 about_us about_ta">
      <h2 className="text-2xl font-bold mb-6">Member Directory</h2>

      {/* Tabs */}
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
            {type} ({group.length})
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="w-full max-w-2xl mb-6">
        <div className="flex flex-col sm:flex-row gap-2 w-full">
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

      {/* Table */}
      {activeTab && (
        <div>
          {groupEntries
            .filter(([type]) => type === activeTab)
            .map(([type, group]) => (
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
                    {group.map((member, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="border px-4 py-2 font-medium">{i + 1}</td>
                        <td className="border px-4 py-2">{member.name}</td>
                        <td className="border px-4 py-2">{member.email}</td>
                        <td className="border px-4 py-2">{member.membership}</td>
                        <td className="border px-4 py-2">
                          {member.validity
                            ? new Date(member.validity).toLocaleDateString("en-GB")
                            : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default Directory;
