import React, { useRef, useLayoutEffect, useState, Fragment } from "react";

const Timeline = ({ nowTime = 1, timestamps, armTimestamps, initialArmState=false, className }) => {

  const svgRef = useRef(null);
  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
  });

  useLayoutEffect(() => {
    const handleResize = () => {
      if (svgRef.current) {
        setContainerDimensions({
          width: svgRef.current.clientWidth,
          height: svgRef.current.clientHeight,
        });
      }
    };

    handleResize(); // Initial calculation

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const calculateDotPosition = (timestamp) => {
    const date = new Date(timestamp);
    const hour = date.getHours() * 60;
    const totalMinutes = hour + date.getMinutes();
    const truncatedMinutes = Math.floor(totalMinutes / 15) * 15; // Truncate to 15-minute intervals
    const totalMinutesInDay = 24 * 60;
    const position = (truncatedMinutes / totalMinutesInDay) * 100;
    return position;
  };

  // const generateSquareWavePath = (xPositions, state = false) => {
  //   const pathSegments = [];
  //   let currentState = state; // true represents y=100, false represents y=0

  //   const x = (i) => (i / 100) * containerDimensions.width;
  //   const y = () =>
  //     currentState
  //       ? containerDimensions.height * 0.25
  //       : containerDimensions.height * 0.90;
  //   // Start with the initial point (0, height)
  //   pathSegments.push(`M0,${y()}`);

  //   for (let i = 0; i < xPositions.length; i++) {
  //     // Move to the current x,y
  //     pathSegments.push(`L${x(xPositions[i])},${y()}`);

  //     // Invert the state
  //     currentState = !currentState;

  //     // Draw a line to the new y with the same x
  //     pathSegments.push(`L${x(xPositions[i])},${y()}`);
  //   }

  //   pathSegments.push(`L${x(100)},${y()}`);
  //   currentState = false;
  //   pathSegments.push(`L${x(100)},${containerDimensions.height * 2}`);
  //   pathSegments.push(`L${x(0)},${containerDimensions.height * 2}`);
  //   return pathSegments.join(" ");
  // };

  const tsXPositions = timestamps
    ? timestamps
        .map((timestamp) => calculateDotPosition(timestamp))
        // .sort((a, b) => a - b)
    : [];

  const armXPositions = armTimestamps
    ? armTimestamps
        .map((timestamp) => calculateDotPosition(timestamp))
        // .sort((a, b) => a - b)
    : [];

  return (
    <svg
      className={"timeline " + className}
      ref={svgRef}
      width="100%"
      height="100%"
    >
      {/* Minor tick lines */}
      {[...Array(24 * 2).keys()].map((minute, i, a) => (
        <line
          key={minute+'min'}
          x1={`${(minute / (24 * 2)) * 100}%`}
          y1="50%"
          x2={`${(minute / (24 * 2)) * 100}%`}
          y2="0%"
          stroke={`rgba(0,60,30,0.2)`}
        />
      ))}

      {/* Hour tick lines */}
      {[...Array(24).keys()].map((hour, i, a) => (
        <line
          key={hour+'hr'}
          x1={`${(hour / 24) * 100}%`}
          y1="0"
          x2={`${(hour / 24) * 100}%`}
          y2="75%"
          stroke={`rgba(0,30,30,${0.1 + (0.9 * i) / a.length})`}
        />
      ))}


      {/* Current time hand */}
      <rect
        x="0"
        y="0"
        width={`${calculateDotPosition(nowTime)}%`}
        height='100%'
        fill='palegreen'
        opacity={0.5}
      />

      {/* Square Wave Path */}
      {/* {
        <path
          d={generateSquareWavePath(armXPositions,initialArmState)}
          stroke="green"
          strokeWidth="3"
          fill="greenyellow"
          opacity="0.15"
        />
      } */}

      {/* Hour labels (every 3 hours starting at 3am) */}
      {[...Array(24).keys()].map(
        (hour) =>
          hour % 5 === 0 &&
          hour >= 3 && (<Fragment key={hour+'hr'}>
            <text
              x={`${((0.1 + hour) / 24) * 100}%`}
              y="1.8rem"
              fontSize="2rem"
              textAnchor="start"
              fill="darkolivegreen"
              fontFamily="Arial, Helvetica, sans-serif"
            >
              {`${hour}:00`}
            </text>
            <line
              x1={`${(hour / 24) * 100}%`}
              y1="0"
              x2={`${(hour / 24) * 100}%`}
              y2="100%"
              strokeWidth={3}
              stroke={'darkolivegreen'}
            />
          </Fragment>)
      )}


      {/* Dots for Timestamp Entries */}
      {tsXPositions.map((x, index, a) => (
        <circle
          key={index+'dot'}
          cx={x + "%"}
          cy={(20 + (80 * index) / a.length) + "%"}
          r="10"
          fill="mediumspringgreen"
          stroke="black"
        />
      ))}
    </svg>
  );
};

export default Timeline;
