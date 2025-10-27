// src/components/DonutChart.tsx
import React, { useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import Svg, { Path, Circle, G, Text as SvgText } from 'react-native-svg';
import { COLORS } from '../constants/colors';

// --- Custom Donut Chart Component ---
const AnimatedPath = Animated.createAnimatedComponent(Path);

type DonutChartProps = {
  data: Array<{ name: string; population: number; color: string }>;
  total: number;
  radius?: number;
  strokeWidth?: number;
};

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  total,
  radius = 100,
  strokeWidth = 20,
}) => {
  const center = radius + strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0); // Reset animation
    Animated.timing(progress, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, [data, total]); // Re-run animation when data changes

  let cumulative = 0;

  const polarToCartesian = (cx, cy, r, degrees) => {
    const radians = ((degrees - 90) * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(radians),
      y: cy + r * Math.sin(radians),
    };
  };

  const arcPath = (cx, cy, r, startAngle, endAngle, isLargeArc) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = isLargeArc ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };

  if (total === 0) {
    return (
      <Svg
        height={center * 2}
        width={center * 2}
        viewBox={`0 0 ${center * 2} ${center * 2}`}
      >
        <G rotation="-90" origin={`${center}, ${center}`}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke={COLORS.primary}
            strokeWidth={strokeWidth}
          />
        </G>
        <SvgText
          x={center}
          y={center - 23}
          textAnchor="middle"
          alignmentBaseline="middle"
          fontSize="12"
          fill={COLORS.darkGray}
        >
          This month's
        </SvgText>
        <SvgText
          x={center}
          y={center - 3}
          textAnchor="middle"
          alignmentBaseline="middle"
          fontSize="12"
          fill={COLORS.darkGray}
        >
          spending
        </SvgText>
        <SvgText
          x={center}
          y={center + 20}
          textAnchor="middle"
          alignmentBaseline="middle"
          fontSize="18"
          fontWeight="bold"
          fill={COLORS.accent}
        >
          RM 0.00
        </SvgText>
      </Svg>
    );
  }

  return (
    <Svg
      height={center * 2}
      width={center * 2}
      viewBox={`0 0 ${center * 2} ${center * 2}`}
    >
      <G rotation="-90" origin={`${center}, ${center}`}>
        {/* Background ring */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke={COLORS.primary}
          strokeWidth={strokeWidth}
        />
        {data.map((slice, index) => {
          const sliceAngle = (slice.population / total) * 360;
          const startAngle = cumulative;
          const endAngle = startAngle + sliceAngle;
          const isLargeArc = sliceAngle > 180;
          const d = arcPath(center, center, radius, startAngle, endAngle, isLargeArc);
          const sliceCirc = (sliceAngle / 360) * circumference;
          const dashOffset = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [sliceCirc, 0],
          });
          cumulative += sliceAngle;
          return (
            <AnimatedPath
              key={index}
              d={d}
              fill="transparent"
              stroke={slice.color}
              strokeWidth={strokeWidth}
              strokeDasharray={sliceCirc}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
            />
          );
        })}
      </G>
      {/* Center text */}
      <SvgText
        x={center}
        y={center - 23}
        textAnchor="middle"
        alignmentBaseline="middle"
        fontSize="12"
        fill={COLORS.darkGray}
      >
        This month's
      </SvgText>
      <SvgText
        x={center}
        y={center - 3}
        textAnchor="middle"
        alignmentBaseline="middle"
        fontSize="12"
        fill={COLORS.darkGray}
      >
        spending
      </SvgText>
      <SvgText
        x={center - 25}
        y={center + 20}
        textAnchor="middle"
        alignmentBaseline="middle"
        fontSize="18"
        fontWeight="bold"
        fill={COLORS.accent}
      >
        RM    {total.toFixed(2)}
      </SvgText>
    </Svg>
  );
};