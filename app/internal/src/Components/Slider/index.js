import React, { useState, useEffect, useRef } from "react";
import useDynamicSize from "../../Hooks";

const Slider = ({ className, style, onSlide, forceSad }) => {
  const [position, setPosition] = useState(0);
  const [ref, width, height] = useDynamicSize();

  const [anim, setAnim] = useState(null);

  const normalizePosition = (x, svgRect) => {
    // Ensure the position is between 0.0 and 1.0 relative to the SVG width
    const relativeX = x - svgRect.left;
    return Math.min(1, Math.max(0, relativeX / width));
  };

  const handlePointerMove = (event) => {
    event.preventDefault();
    const svgElement = ref.current;
    if (svgElement) {
      const svgRect = svgElement.getBoundingClientRect();
      const clientX = event.type.startsWith("touch")
        ? event.touches[0].clientX
        : event.clientX;
      const newPosition = normalizePosition(clientX, svgRect);
      setPosition(newPosition);
    }
  };

  const handlePointerDown = (event) => {
    setAnim(null);
    const svgElement = ref.current;
    if (
      svgElement &&
      (event.type === "mousedown" || event.target === svgElement)
    ) {
      const svgRect = svgElement.getBoundingClientRect();
      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
      const clientX = event.type.startsWith("touch")
        ? event.touches[0].clientX
        : event.clientX;
      const newPosition = normalizePosition(clientX, svgRect);
      setPosition(newPosition);
    }
  };

  const handlePointerUp = () => {
    setAnim("feed");
    document.removeEventListener("pointermove", handlePointerMove);
    document.removeEventListener("pointerup", handlePointerUp);
  };

  useEffect(() => {
    if(anim === 'happy') onSlide?.(position);
  },[position, anim]);

  useEffect(()=>{
    if(anim === 'happy' && forceSad) setAnim(null);
  },[forceSad])

  const timerRef = useRef();
  useEffect(() => {
    const clear = () => clearTimeout(timerRef?.current);

    clear();

    if (anim === "feed") {
      timerRef.current = setTimeout(() => {
        setAnim("happy");
      }, 2000);
    }

    return clear;
  }, [anim]);

  const ignore = {
    pointerEvents: 'none',
    userSelect: "none",
    touchAction: "none",
  };

  const [spawn, setSpawn] = useState(false);
  useEffect(()=>{
    setSpawn(true)
  },[])

  return (
    <svg
    className={className}
      ref={ref}
      onPointerDown={handlePointerDown}
      onTouchStart={handlePointerDown}
      
      style={{
        display: "block",
        position: "relative",
        cursor: "pointer",
        userSelect: "none",
        touchAction: "none",
        webkitTapHighlightColor: 'transparent',
        ...style,
      }}
    >
      {/* Marks for 25%, 50%, and 75% */}
      <line x1="25%" y1="0" x2="25%" y2="90%" stroke="black" />
      <text x="24%" y="90%" textAnchor="end">
        25%
      </text>

      <line x1="50%" y1="0" x2="50%" y2="100%" stroke="black" />
      {/* <text x="51%" y="90%">
        50%
      </text> */}

      <line x1="75%" y1="0" x2="75%" y2="90%" stroke="black" />
      <text x="76%" y="90%">
        75%
      </text>

      {/* Slider handle */}
      <rect
        style={{
          pointerEvents: "none",
          transition: "width 500ms",
        }}
        width={`${position * 100}%`}
        height="100%"
        fill="lightblue"
        opacity={0.5}
      />

      <g
        style={{
          ...ignore,
          transition: anim && "transform 2s 1s, opacity 1.5s 0.5s",
          transform: `translateX(${anim ? 50 : 0}%)`,
          opacity: anim === "feed" ? 1 : 0,
        }}
      >
        <svg
          width={height * 0.7}
          height={height * 0.7}
          x={`${height * 0.7 * -0.5}`}
          y={`${height * 0.7 * -0.5 + height / 2}`}
          viewBox="0 0 25 25"
          fill="none"
          style={ignore}
        >
          <Fish />
        </svg>
      </g>

      <g
        style={{
          ...ignore,
          transition: "transform 1.5s",
          transform: `translateY(${spawn ? 0 : -100}%)`,
        }}
      >
        <svg
          width={height * 0.9}
          height={height * 0.9}
          x={`${width / 2 - height * 0.5}`}
          y={`${height * 0.9 * -0.6 + height / 2}`}
          viewBox="0 0 400 400"
          fill="none"
          style={ignore}
        >
          {anim?.includes("happy") ? <CatHappy /> : <CatSad />}
        </svg>
      </g>
    </svg>
  );
};

export default Slider;

const Fish = ({ size, container }) => {
  return (
    <>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.5054 9.89526C5.55475 9.66558 5.72029 9.47825 5.94216 9.40102C6.16403 9.3238 6.41011 9.36785 6.5914 9.51726L7.9354 10.4173C8.11049 10.5229 8.32272 10.5475 8.51733 10.4848C8.71194 10.4221 8.86989 10.2782 8.9504 10.0903C11.4544 5.05926 17.6994 6.56326 19.4634 11.7773C19.512 11.922 19.512 12.0786 19.4634 12.2233C17.6994 17.4373 11.4544 18.9413 8.9504 13.9103C8.86953 13.7224 8.71124 13.5787 8.51641 13.5164C8.32158 13.4541 8.10931 13.4792 7.9344 13.5853L6.5904 14.4853C6.40884 14.6342 6.16278 14.6777 5.94115 14.6001C5.71952 14.5225 5.55438 14.3349 5.5054 14.1053C5.49312 14.0207 5.50348 13.9345 5.5354 13.8553L6.0994 12.2513C6.1558 12.0894 6.1558 11.9132 6.0994 11.7513L5.5364 10.1513C5.50306 10.0703 5.49235 9.98183 5.5054 9.89526Z"
        stroke="orangered"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.8261 13.9699C13.5332 14.2628 13.5332 14.7377 13.8261 15.0306C14.119 15.3235 14.5938 15.3235 14.8867 15.0306L13.8261 13.9699ZM17.0297 12.8876C17.3226 12.5947 17.3226 12.1198 17.0297 11.8269C16.7368 11.534 16.262 11.534 15.9691 11.8269L17.0297 12.8876ZM11.3011 13.6379C11.0082 13.9308 11.0082 14.4057 11.3011 14.6986C11.594 14.9915 12.0688 14.9915 12.3617 14.6986L11.3011 13.6379ZM16.6467 10.4136C16.9396 10.1207 16.9396 9.64581 16.6467 9.35291C16.3538 9.06002 15.879 9.06002 15.5861 9.35291L16.6467 10.4136ZM10.9691 11.1129C10.6762 11.4058 10.6762 11.8807 10.9691 12.1736C11.262 12.4665 11.7368 12.4665 12.0297 12.1736L10.9691 11.1129ZM14.1727 10.0306C14.4656 9.73768 14.4656 9.26281 14.1727 8.96991C13.8798 8.67702 13.405 8.67702 13.1121 8.96991L14.1727 10.0306ZM14.8867 15.0306L17.0297 12.8876L15.9691 11.8269L13.8261 13.9699L14.8867 15.0306ZM12.3617 14.6986L16.6467 10.4136L15.5861 9.35291L11.3011 13.6379L12.3617 14.6986ZM12.0297 12.1736L14.1727 10.0306L13.1121 8.96991L10.9691 11.1129L12.0297 12.1736Z"
        fill="orangered"
      />
    </>
  );
};

const CatHappy = () => {
  return (
    <>
      <circle cx={"50%"} cy={"60%"} r={"35%"} fill="lightgray" />
      <path
        d="M104.841 145.759C84.3825 103.24 113.976 93.8934 138.062 126.769"
        stroke="#000000"
        stroke-opacity="0.9"
        stroke-width="16"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M278.45 125.67C310.018 85.9308 316.458 123.485 306.365 156.355"
        stroke="#000000"
        stroke-opacity="0.9"
        stroke-width="16"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M174.149 149.888C174.479 144.709 174.812 139.541 175.142 134.374"
        stroke="#000000"
        stroke-opacity="0.9"
        stroke-width="16"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M208.585 156.344C208.228 146.42 209.43 136.477 210.574 126.629"
        stroke="#000000"
        stroke-opacity="0.9"
        stroke-width="16"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M241.358 149.884C243.072 144.904 242.021 139.545 242.355 134.378"
        stroke="#000000"
        stroke-opacity="0.9"
        stroke-width="16"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M164.116 198.803C205.073 198.238 196.821 210.153 161.861 223.33"
        stroke="#000000"
        stroke-opacity="0.9"
        stroke-width="16"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M237.844 197.687C203.614 212.709 210.546 206.414 236.697 223.526"
        stroke="#000000"
        stroke-opacity="0.9"
        stroke-width="16"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M196.887 254.533C179.946 255.472 195.528 273.667 210.195 255.646"
        stroke="#000000"
        stroke-opacity="0.9"
        stroke-width="16"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M193.39 286.642C181.827 291.678 175.892 289.505 167.537 282.956"
        stroke="#000000"
        stroke-opacity="0.9"
        stroke-width="16"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M197.268 282.956C206.418 297.428 220.936 292.334 232.171 282.956"
        stroke="#000000"
        stroke-opacity="0.9"
        stroke-width="16"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M109.366 231.278C96.7847 231.121 76.1524 227.207 68 226.11"
        stroke="#000000"
        stroke-opacity="0.9"
        stroke-width="16"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M111.951 256.852C96.0698 257.608 82.1144 261.134 69.2927 267.182"
        stroke="#000000"
        stroke-opacity="0.9"
        stroke-width="16"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M333 214.223C316.165 216.03 302.204 220.205 289.049 228.707"
        stroke="#000000"
        stroke-opacity="0.9"
        stroke-width="16"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M331.965 262.448C318.367 258.875 304.68 258.572 290.599 258.572"
        stroke="#000000"
        stroke-opacity="0.9"
        stroke-width="16"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </>
  );
};

const CatSad = () => {
  return (
    <>
      <circle cx={"50%"} cy={"60%"} r={"35%"} fill="lightgray" />
      <path
        d="M165.875 227.216C193.434 223.592 223.034 224.033 248.609 228.166"
        stroke="#000000"
        stroke-opacity="0.9"
        stroke-width="16"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M184.149 239.202C186.305 235.44 184.042 232.185 183.532 228.691"
        stroke="#000000"
        stroke-opacity="0.9"
        stroke-width="16"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M226.673 237.952C226.673 234.782 226.673 231.611 226.673 228.446"
        stroke="#000000"
        stroke-opacity="0.9"
        stroke-width="16"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M166.852 169.756C168.026 164.031 166.251 157.177 165.758 152.273"
        stroke="#000000"
        stroke-opacity="0.9"
        stroke-width="16"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M202.913 177.306C203.087 165.328 202.913 153.241 202.913 141.195"
        stroke="#000000"
        stroke-opacity="0.9"
        stroke-width="16"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M235.45 164.76C235.082 158.095 234.905 151.463 234.905 144.78"
        stroke="#000000"
        stroke-opacity="0.9"
        stroke-width="16"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M91.4068 153.586C42.1211 109.655 104.557 108.056 130.447 148.498"
        stroke="#000000"
        stroke-opacity="0.9"
        stroke-width="16"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M274.791 139.562C293.247 85.053 338.23 108.027 301.693 156.399"
        stroke="#000000"
        stroke-opacity="0.9"
        stroke-width="16"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M206.479 263.551C226.611 257.262 218.083 280.526 204.304 262.485"
        stroke="#000000"
        stroke-opacity="0.9"
        stroke-width="16"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M210.377 276.93C202.99 287.138 198.693 288.53 192.185 291"
        stroke="#000000"
        stroke-opacity="0.9"
        stroke-width="16"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M214.511 279.762C217.76 287.119 223.093 286.651 228.3 288.503"
        stroke="#000000"
        stroke-opacity="0.9"
        stroke-width="16"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M119.495 243.432C104.904 241.829 85.7296 241.203 73.1145 239.686"
        stroke="#000000"
        stroke-opacity="0.9"
        stroke-width="16"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M120.528 271.388C107.545 275.912 94.7465 280.922 81.668 285.124"
        stroke="#000000"
        stroke-opacity="0.9"
        stroke-width="16"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M324.384 228.526C311.275 231.643 298.895 237.582 286.778 243.511"
        stroke="#000000"
        stroke-opacity="0.9"
        stroke-width="16"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M328 269.807C316.039 268.883 303.812 268.297 286.778 269.407"
        stroke="#000000"
        stroke-opacity="0.9"
        stroke-width="16"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </>
  );
};
