import { useRef, useState, useLayoutEffect } from "react";

export default function useDynamicSize() {
  const ref = useRef(null);
  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
  });

  useLayoutEffect(() => {
    const handleResize = () => {
      if (ref.current) {
        setContainerDimensions({
          width: ref.current.clientWidth,
          height: ref.current.clientHeight,
        });
      }
    };

    handleResize(); // Initial calculation

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return [ref, containerDimensions.width, containerDimensions.height];
}
