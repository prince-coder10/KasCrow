function LinesSvg() {
  return (
    <div>
      <svg
        className="absolute left-0 top-0 w-full h-24 pointer-events-none"
        viewBox="0 0 100 24"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Animation styles */}
        <style>{`
          .moving-line-group {
            transform-box: fill-box;
            transform-origin: 0 0;
          }

          @keyframes moveRight {
            0% {
              transform: translateX(-30%);
              opacity: 0;
            }
            5% {
              opacity: 1;
            }
            70% {
              opacity: 1;
            }
            100% {
              transform: translateX(110%);
              opacity: 0;
            }
          }
        `}</style>

        {/* Moving lines */}
        {(() => {
          const configs = Array.from({ length: 5 }).map((_, i) => ({
            y: 6 + i * 3.6,
            height: 1.4 + (i % 2) * 0.6,
            width: 18 + i * 6,
            duration: 1.5 + i * 0.01,
            delay: -(i * 0.8),
            opacity: 0.85 - i * 0.1,
          }));

          return configs.map((c, i) => (
            <g
              key={i}
              className="moving-line-group"
              style={{
                animationName: "moveRight",
                animationDuration: `${c.duration}s`,
                animationTimingFunction: "linear",
                animationIterationCount: "infinite",
                animationDelay: `${c.delay}s`,
              }}
            >
              <rect
                x={0}
                y={c.y}
                width={c.width / 2}
                height={c.height / 6}
                rx={c.height / 2}
                fill="#22D3EE"
                className="stroke-1"
                opacity={c.opacity}
                shapeRendering="crispEdges"
              />
            </g>
          ));
        })()}
      </svg>
    </div>
  );
}

export default LinesSvg;
