// src/components/DonutChart.tsx
import React, { useRef, useEffect } from 'react';
import { Animated, Easing, View, Text } from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { COLORS } from '../constants/colors';

// --- Custom Donut Chart Component ---
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';

// --- Custom Donut Chart Component ---
const AnimatedPath = Animated.createAnimatedComponent(Path);

type DonutChartProps = {
  data: Array<{ name: string; population: number; color: string }>;
  total: number;
  radius?: number;
  strokeWidth?: number;
  showCenterText?: boolean;
  centerIcon?: string;
  centerLabel?: string;
};

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  total,
  radius = 90,
  strokeWidth = 24,
  showCenterText = true,
  centerIcon,
  centerLabel = 'THIS MONTH SPENDING',
}) => {
  const center = radius + strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const progress = useRef(new Animated.Value(0)).current;

  // Helper for type safety
  const polarToCartesian = (cx: number, cy: number, r: number, degrees: number) => {
    const radians = ((degrees - 90) * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(radians),
      y: cy + r * Math.sin(radians),
    };
  };

  const arcPath = (cx: number, cy: number, r: number, startAngle: number, endAngle: number, isLargeArc: boolean) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = isLargeArc ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };

  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [data, total]);

  let cumulative = 0;

  // --- RENDERING ---
  const renderContent = () => {
    if (total === 0) {
      // Empty State
      return (
        <G rotation="-90" origin={`${center}, ${center}`}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke={COLORS.lightGray}
            strokeWidth={strokeWidth}
            opacity={0.5}
          />
        </G>
      );
    }

    return (
      <G rotation="-90" origin={`${center}, ${center}`}>
        {/* Background track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke={COLORS.lightGray}
          strokeWidth={strokeWidth}
          opacity={0.3}
        />

        {data.map((slice, index) => {
          const sliceAngle = (slice.population / total) * 360;
          const startAngle = cumulative;
          const endAngle = startAngle + (sliceAngle === 360 ? 359.99 : sliceAngle);

          const isLargeArc = sliceAngle > 180;

          const d = arcPath(center, center, radius, startAngle, endAngle, isLargeArc);

          const sliceCirc = (sliceAngle / 360) * circumference;

          // Animate the stroke dash
          const dashOffset = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [sliceCirc, 0],
          });

          cumulative += sliceAngle;

          return (
            <AnimatedPath
              key={`slice-${index}`}
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
    );
  };

  return (
    <View style={{ width: center * 2, height: center * 2, alignItems: 'center', justifyContent: 'center' }}>
      <Svg
        height={center * 2}
        width={center * 2}
        viewBox={`0 0 ${center * 2} ${center * 2}`}
      >
        {renderContent()}
      </Svg>

      {/* --- CENTER OVERLAY --- */}
      <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
        {centerIcon && (
          <MaterialCommunityIcon name={centerIcon} size={radius * 0.8} color={COLORS.primary} style={{ opacity: 0.15 }} />
        )}
        {showCenterText && (
          <>
            <Text
              style={{
                fontSize: radius > 80 ? 8 : 7,
                fontWeight: '700',
                color: COLORS.darkGray,
                letterSpacing: 0.5,
                marginBottom: 2,
                opacity: 0.5,
              }}
            >
              {centerLabel}
            </Text>
            <Text
              style={{
                fontSize: radius > 80 ? 18 : 15,
                fontWeight: '800',
                color: COLORS.accent,
              }}
            >
              RM {total.toFixed(2)}
            </Text>
          </>
        )}
      </View>
    </View>
  );
};