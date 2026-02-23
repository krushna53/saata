import React, { useEffect, useState } from "react";
import { createClient } from "contentful";
import * as XLSX from "xlsx";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import "bootstrap/dist/css/bootstrap.min.css";
import client from "../client";
const ExcelDisplay = () => {
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState(null);
  const [additionalInfo, setAdditionalInfo] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/data/sajta.json");
        const data = await res.json();

        setArticles(data);
        setHeaders(Object.keys(data[0] || {}));
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchContent = async () => {
      const cacheKey = "sajta_content_v1";
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        const parsed = JSON.parse(cached);
        setDescription(parsed.description);
        setAdditionalInfo(parsed.additionalInfo);
        return; // 🚀 STOP API CALL
      }

      try {
        const response = await client.getEntries({
          content_type: "article",
          select: "fields.description,fields.linkWithDec",
          limit: 1,
        });

        if (response.items.length > 0) {
          const data = {
            description: response.items[0].fields.description,
            additionalInfo: response.items[0].fields.linkWithDec,
          };

          localStorage.setItem(cacheKey, JSON.stringify(data));

          setDescription(data.description);
          setAdditionalInfo(data.additionalInfo);
        }
      } catch (error) {
        console.error("Contentful error:", error);
      }
    };

    fetchContent();
  }, []);
  const handleSearchInput = (e) => {
    setSearchTerm(e.target.value);
  };

  const filterArticles = () => {
    const filtered = articles.filter((article) =>
      Object.values(article).some(
        (cell) =>
          typeof cell === "string" &&
          cell.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    );
    setFilteredArticles(filtered);
  };

  useEffect(() => {
    if (searchTerm) {
      filterArticles();
    }
  }, [searchTerm]);

  const handleSearch = () => {
    setLoading(true);
    setSearchTriggered(true);
    setTimeout(() => {
      filterArticles();
      setLoading(false);
      setSearchTriggered(false);
    }, 500);
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const shortenUrl = (url) => {
    try {
      const { hostname, pathname } = new URL(url);
      const shortPath =
        pathname.length > 30 ? `${pathname.slice(0, 30)}...` : pathname;
      return `${hostname}${shortPath}`;
    } catch (error) {
      return url;
    }
  };

  const displayData = searchTerm ? filteredArticles : [];
  const options = {
    renderNode: {
      "embedded-asset-block": (node) => {
        return null;
      },
      hyperlink: (node) => {
        const { uri } = node.data;
        return (
          <a
            href={uri}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary"
          >
            {node.content[0].value}
          </a>
        );
      },
      "asset-hyperlink": (node) => {
        const assetTitle = node.content[0].value;
        const assetUrl = node.data.target.fields.file.url;

        return (
          <a
            href={assetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary"
          >
            {assetTitle}
          </a>
        );
      },
    },
  };

  return (
    <div className="container excel-display my-5">
      <div className="about_us_wrapper">
        <h2>SAJTA – South Asian Journal of Transactional Analysis</h2>
      </div>
      <div className="about_us_content">
        {additionalInfo && documentToReactComponents(additionalInfo, options)}
        <br />
      </div>

      <div className="input-group mb-3">
        <input
          type="text"
          placeholder="Search by author, keywords, field of specialisation, context etc"
          value={searchTerm}
          onChange={handleSearchInput}
          className="form-control"
        />
        <button className="btn btn-primary" onClick={handleSearch}>
          Search
        </button>
      </div>
      {loading && <div className="text-center">Loading...</div>}
      {!loading && displayData.length > 0 ? (
        <div className="row">
          {displayData.map((item, index) => (
            <div className="col-12 col-md-6 col-lg-4 mb-4" key={index}>
              <div className="card h-100">
                <div className="card-body">
                  {headers.map((header) => {
                    const cellData = item[header];

                    if (
                      header === "articleFile" &&
                      cellData &&
                      cellData.fields &&
                      cellData.fields.file &&
                      cellData.fields.file.url
                    ) {
                      return (
                        <div key={header} className="mb-2">
                          <strong>Access these Articles Here: </strong>
                          <a
                            href={cellData.fields.file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View File
                          </a>
                        </div>
                      );
                    }

                    if (typeof cellData === "string" && isValidUrl(cellData)) {
                      return (
                        <div key={header} className="mb-2">
                          <a
                            href={cellData}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary"
                            title={cellData}
                          >
                            {shortenUrl(cellData)}
                          </a>
                        </div>
                      );
                    }

                    return (
                      <div key={header} className="mb-2">
                        {cellData ? (
                          <>
                            <strong>{header}: </strong>
                            {cellData.toString()}
                          </>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !loading &&
        searchTerm &&
        displayData.length === 0 && (
          <p className="text-center">No matching articles found.</p>
        )
      )}
      <br />
      <div className="about_us_content">
        {description && documentToReactComponents(description, options)}{" "}
        {/* Ensure this is rendering correctly */}
      </div>
    </div>
  );
};

export default ExcelDisplay;
