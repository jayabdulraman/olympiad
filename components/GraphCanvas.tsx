import React from 'react';
import { parseEquation } from '@/lib/utils';

/**
 * Renders an SVG graph for a given linear equation.
 */
export function GraphCanvas({equation}: {equation: string}) {
  const SIZE = 400;
  const MIN_X = -10;
  const MAX_X = 10;
  const MIN_Y = -10;
  const MAX_Y = 10;
  const X_RANGE = MAX_X - MIN_X;
  const Y_RANGE = MAX_Y - MIN_Y;

  const mapX = (x: number) => ((x - MIN_X) / X_RANGE) * SIZE;
  const mapY = (y: number) => SIZE - ((y - MIN_Y) / Y_RANGE) * SIZE;

  const lineParams = parseEquation(equation);
  let lineCoords = null;

  if (lineParams) {
    if (lineParams.type === 'vertical') {
      lineCoords = {
        x1: mapX(lineParams.x || 0),
        y1: mapY(MIN_Y),
        x2: mapX(lineParams.x || 0),
        y2: mapY(MAX_Y),
      };
    } else if (lineParams.type === 'horizontal') {
      lineCoords = {
        x1: mapX(MIN_X),
        y1: mapY(lineParams.y || 0),
        x2: mapX(MAX_X),
        y2: mapY(lineParams.y || 0),
      };
    } else if (lineParams.type === 'slope-intercept') {
      const y1 = lineParams.m! * MIN_X + lineParams.b!;
      const y2 = lineParams.m! * MAX_X + lineParams.b!;
      lineCoords = {x1: mapX(MIN_X), y1: mapY(y1), x2: mapX(MAX_X), y2: mapY(y2)};
    }
  }

  const gridLines = [];
  // Vertical grid lines and labels
  for (let i = MIN_X; i <= MAX_X; i++) {
    const xPos = mapX(i);
    gridLines.push(
      <line
        key={`v${i}`}
        x1={xPos}
        y1="0"
        x2={xPos}
        y2={SIZE}
        stroke="#e5e7eb"
        strokeWidth="1"
      />,
    );
    if (i !== 0 && i % 2 === 0) {
      gridLines.push(
        <text
          key={`vt${i}`}
          x={xPos + 2}
          y={mapY(0) - 2}
          fontSize="10"
          fill="#9ca3af"
          textAnchor="start">
          {i}
        </text>,
      );
    }
  }
  // Horizontal grid lines and labels
  for (let i = MIN_Y; i <= MAX_Y; i++) {
    const yPos = mapY(i);
    gridLines.push(
      <line
        key={`h${i}`}
        x1="0"
        y1={yPos}
        x2={SIZE}
        y2={yPos}
        stroke="#e5e7eb"
        strokeWidth="1"
      />,
    );
    if (i !== 0 && i % 2 === 0) {
      gridLines.push(
        <text
          key={`ht${i}`}
          x={mapX(0) + 2}
          y={yPos - 2}
          fontSize="10"
          fill="#9ca3af"
          textAnchor="start">
          {i}
        </text>,
      );
    }
  }

  return (
    <div className="flex justify-center items-center bg-white p-2 border rounded-md">
      <svg width="100%" height="auto" viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {gridLines}
        {/* X-Axis */}
        <line
          x1="0"
          y1={mapY(0)}
          x2={SIZE}
          y2={mapY(0)}
          stroke="#4b5563"
          strokeWidth="1.5"
        />
        {/* Y-Axis */}
        <line
          x1={mapX(0)}
          y1="0"
          x2={mapX(0)}
          y2={SIZE}
          stroke="#4b5563"
          strokeWidth="1.5"
        />
        {/* The plotted line */}
        {lineCoords && (
          <line
            x1={lineCoords.x1}
            y1={lineCoords.y1}
            x2={lineCoords.x2}
            y2={lineCoords.y2}
            stroke="#ef4444"
            strokeWidth="3"
            strokeLinecap="round"
          />
        )}
      </svg>
    </div>
  );
}
