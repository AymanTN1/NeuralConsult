import React, { useEffect, useRef } from "react";
import gsap from "gsap";

const CursorFollower = () => {
  const cursorRef = useRef(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    const onMouseMove = (e) => {
      gsap.to(cursor, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.8,
        ease: "power3.out"
      });
    };

    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  return (
    <div
      ref={cursorRef}
      className="landing-cursor-follower"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "400px",
        height: "400px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, transparent 70%)",
        pointerEvents: "none",
        zIndex: 0,
        transform: "translate(-50%, -50%)",
        filter: "blur(40px)",
        willChange: "transform"
      }}
    />
  );
};

export default CursorFollower;
