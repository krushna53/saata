import React, { useCallback, useEffect, useState } from "react";
import Slider from "react-slick";
import  client  from "../client";


function BoardOfMembers() {
  const settings = {
    dots: false,
    arrows: true,
    infinite: true,
    speed: 2000,
    autoplay:true,
    slidesToShow: 3,
    slidesToScroll: 3,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 3,
          infinite: true,
          dots: false,
        },
      },
      {
        breakpoint: 820,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          initialSlide: 1,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          initialSlide: 1,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  const [info, setInfo] = useState([]);

  const cleanUpInfo = useCallback((rawdata) => {
    const cleaninfo = rawdata.map((item) => {
      const { sys, fields } = item;
      const { id } = sys;
      const image = fields.memberImg.fields.file.url;
      const name = fields.name;
      const occupation = fields.occupation;
      const updateinfo = {image, name, occupation}
      return updateinfo;
    });
    setInfo(cleaninfo);
  }, []);

  const getInfo = useCallback(async () => {
    try {
      const response = await client.getEntries({ content_type: "boardOfMembers" });
      const responseData = response.items;
      // console.log(responseData);
      if (responseData) {
        cleanUpInfo(responseData);
      } else {
        setInfo([]);
      }
    } catch (error) {
      console.log(error);
    }
  }, [cleanUpInfo]);

  useEffect(() => {
    getInfo();
  }, [getInfo]);
  return (
    <>
      <div className="board-of-members-section info-container">
        <div className="board-of-members-wrapper">
          <h2 className="Board-of-Members-title info-title">
          SAATA TEAM
          </h2>
          <div className="board-of-members-folder">
            <Slider {...settings}>
              {info.map((item, index) => {
                return (
                  <div
                    className="board-of-members-blog-box-section"
                    key={index}
                  >
                    <div className="board-of-members-image">
                      <img src={item.image} alt={item.image} />
                    </div>
                    <div className="des"> 
                    <h2>{item.name}</h2>
                    <p>{item.occupation}</p>
                    </div>
                  </div>
                );
              })}
            </Slider>
          </div>
        </div>
      </div>
    </>
  );
}

export default BoardOfMembers;
