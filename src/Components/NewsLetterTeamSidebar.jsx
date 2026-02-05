import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import client from "../client";

const NewsLetterTeamSidebar = () => {
    const [entry, setEntry] = useState([]);

    useEffect(() => {
        const fetchPage = async () => {
            try {
                const response = await client.getEntries({
                    content_type: "newsletterTeam",
                });
                console.log(response)
                if (response.items.length) {
                    setEntry(response.items);
                }
            } catch (error) {
                console.error(error);
            }
        };
        fetchPage();
    }, []);
    return (
        <>
            <div className="newsletterTeam-folder">
                <ul>
                    <li>
                        <NavLink to={`/basicPage/editors-collage`}  onClick={(e) => e.preventDefault()}>Meet the Newsletter Team </NavLink>
                    </li>
                    {
                        entry.map((item) => {
                            const { slug, title } = item.fields;
                            return (
                                <React.Fragment key={slug}>
                                    <li>
                                        <NavLink to={`/newsletterTeam/${slug}`}>{title}</NavLink>
                                    </li>
                                </React.Fragment>
                            )
                        })
                    }
                </ul>
            </div>
        </>
    )
}

export default NewsLetterTeamSidebar
