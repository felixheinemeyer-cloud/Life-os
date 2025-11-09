import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Path,
  Circle,
  G,
  Line,
  Text as SvgText,
  RadialGradient,
  Rect,
} from 'react-native-svg';

interface DataPoint {
  value: number;
}

interface ChartData {
  sleep: number[];
  nutrition: number[];
  wellbeing: number[];
}

interface PremiumStatsChartProps {
  data: ChartData;
  activeVariable?: 'sleep' | 'nutrition' | 'wellbeing' | null;
}

// Opacity configuration for interactive legend
const OPACITY_CONFIG = {
  allActive: {
    line: 1.0,
    lineGlow: 0.25,
    areaFill: 1.0,
    point: 1.0,
    pointGlowOuter: 0.2,
    pointGlowMiddle: 0.25,
  },
  focused: {
    line: 1.0,
    lineGlow: 0.25,
    areaFill: 1.0,
    point: 1.0,
    pointGlowOuter: 0.2,
    pointGlowMiddle: 0.25,
  },
  dimmed: {
    line: 0.35,
    lineGlow: 0,        // NO GLOW - completely removed
    areaFill: 0.33,     // Reduced fill opacity
    point: 0.35,
    pointGlowOuter: 0,  // NO GLOW - completely removed
    pointGlowMiddle: 0, // NO GLOW - completely removed
  },
};

const PremiumStatsChart: React.FC<PremiumStatsChartProps> = ({
  data,
  activeVariable = null
}) => {
  const screenWidth = Dimensions.get('window').width;
  // Chart width expanded by 8px on each side (total +16px) while maintaining perfect centering
  const chartWidth = screenWidth - 32 - 32; // 32px card horizontal padding, 32px internal chart margins (reduced from 48 to add width)
  const chartHeight = 270;
  // Equal left/right padding centers the plot area horizontally; Y-axis labels positioned within left padding
  const padding = { top: 35, right: 32, bottom: 40, left: 32 };

  // Determine opacity for each variable based on active state
  const getVariableOpacity = (variable: 'sleep' | 'nutrition' | 'wellbeing') => {
    if (activeVariable === null) {
      return OPACITY_CONFIG.allActive; // All variables equally visible
    }
    return activeVariable === variable
      ? OPACITY_CONFIG.focused // This variable is selected
      : OPACITY_CONFIG.dimmed; // This variable is not selected
  };

  // Determine if glow should be rendered for a specific variable
  const shouldRenderGlow = (variable: 'sleep' | 'nutrition' | 'wellbeing') => {
    if (activeVariable === null) return true; // All active - show all glows
    return activeVariable === variable; // Only show glow for selected variable
  };

  const sleepOpacity = getVariableOpacity('sleep');
  const nutritionOpacity = getVariableOpacity('nutrition');
  const wellbeingOpacity = getVariableOpacity('wellbeing');

  const sleepShowGlow = shouldRenderGlow('sleep');
  const nutritionShowGlow = shouldRenderGlow('nutrition');
  const wellbeingShowGlow = shouldRenderGlow('wellbeing');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  // Calculate positions with more vertical spacing
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  const xStep = plotWidth / 6; // 7 days, 6 intervals

  // Full Y-axis range for accurate data representation
  const minValue = 1;
  const maxValue = 10;
  const yScale = plotHeight / (maxValue - minValue);

  const getX = (index: number): number => {
    return padding.left + index * xStep;
  };

  const getY = (value: number): number => {
    // Map value (1-10) to chart Y position with more spacing
    const normalizedValue = Math.max(minValue, Math.min(maxValue, value));
    return padding.top + plotHeight - (normalizedValue - minValue) * yScale;
  };

  // Generate ultra-smooth, organic bezier curve path
  const generateSmoothPath = (dataPoints: number[]): string => {
    if (dataPoints.length === 0) return '';

    const points = dataPoints.map((value, index) => ({
      x: getX(index),
      y: getY(value),
    }));

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];

      // Ultra-smooth curves with gentle control points for organic flow
      const controlPointX1 = current.x + (next.x - current.x) * 0.3;
      const controlPointY1 = current.y + (next.y - current.y) * 0.3;
      const controlPointX2 = current.x + (next.x - current.x) * 0.7;
      const controlPointY2 = current.y + (next.y - current.y) * 0.7;

      path += ` C ${controlPointX1} ${controlPointY1}, ${controlPointX2} ${controlPointY2}, ${next.x} ${next.y}`;
    }

    return path;
  };

  // Generate area fill path
  const generateAreaPath = (dataPoints: number[]): string => {
    if (dataPoints.length === 0) return '';

    const linePath = generateSmoothPath(dataPoints);
    const baselineY = padding.top + plotHeight;
    const lastX = getX(dataPoints.length - 1);
    const firstX = getX(0);

    return `${linePath} L ${lastX} ${baselineY} L ${firstX} ${baselineY} Z`;
  };

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <Animated.View style={[{ opacity: fadeAnim }, styles.chartContainer]}>
      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          {/* Background - Pure White (unified with card) */}
          <LinearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="100%" stopColor="#FFFFFF" />
          </LinearGradient>

          {/* Sleep Line Gradients - Purple (matches legend) */}
          <LinearGradient id="sleepLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#9333EA" />
            <Stop offset="100%" stopColor="#C084FC" />
          </LinearGradient>

          <LinearGradient id="sleepFillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#9333EA" stopOpacity="0.15" />
            <Stop offset="100%" stopColor="#9333EA" stopOpacity="0" />
          </LinearGradient>

          {/* Nutrition Line Gradients - Emerald (matches legend) */}
          <LinearGradient id="nutritionLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#059669" />
            <Stop offset="100%" stopColor="#34D399" />
          </LinearGradient>

          <LinearGradient id="nutritionFillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#059669" stopOpacity="0.15" />
            <Stop offset="100%" stopColor="#059669" stopOpacity="0" />
          </LinearGradient>

          {/* Wellbeing Line Gradients - Orange (matches legend) */}
          <LinearGradient id="wellbeingLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#EA580C" />
            <Stop offset="100%" stopColor="#FB923C" />
          </LinearGradient>

          <LinearGradient id="wellbeingFillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#EA580C" stopOpacity="0.15" />
            <Stop offset="100%" stopColor="#EA580C" stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Background Rectangle with Unified Gradient */}
        <Rect width={chartWidth} height={chartHeight} fill="url(#bgGradient)" />

        {/* Horizontal Grid Lines - Subtle Light */}
        <Line
          x1={padding.left}
          y1={getY(4)}
          x2={chartWidth - padding.right}
          y2={getY(4)}
          stroke="#E5E7EB"
          strokeWidth="0.5"
          strokeDasharray="2,4"
        />
        <Line
          x1={padding.left}
          y1={getY(7)}
          x2={chartWidth - padding.right}
          y2={getY(7)}
          stroke="#E5E7EB"
          strokeWidth="0.5"
          strokeDasharray="2,4"
        />

        {/* Y-axis labels - Dark Gray, right-aligned so "10" aligns with single digits */}
        <SvgText x={padding.left - 8} y={getY(1) + 4} fontSize="10" fill="#6B7280" textAnchor="end">
          1
        </SvgText>
        <SvgText x={padding.left - 8} y={getY(4) + 4} fontSize="10" fill="#6B7280" textAnchor="end">
          4
        </SvgText>
        <SvgText x={padding.left - 8} y={getY(7) + 4} fontSize="10" fill="#6B7280" textAnchor="end">
          7
        </SvgText>
        <SvgText x={padding.left - 8} y={getY(10) + 4} fontSize="10" fill="#6B7280" textAnchor="end">
          10
        </SvgText>

        {/* Axis Lines - Subtle but Visible */}
        {/* Y-axis */}
        <Line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={chartHeight - padding.bottom}
          stroke="#D1D5DB"
          strokeWidth="1"
        />
        {/* X-axis */}
        <Line
          x1={padding.left}
          y1={chartHeight - padding.bottom}
          x2={chartWidth - padding.right}
          y2={chartHeight - padding.bottom}
          stroke="#D1D5DB"
          strokeWidth="1"
        />

        {/* Area Fills - Conditional (only when active) */}
        {sleepShowGlow && (
          <Path
            d={generateAreaPath(data.sleep)}
            fill="url(#sleepFillGrad)"
            opacity={sleepOpacity.areaFill}
          />
        )}
        {nutritionShowGlow && (
          <Path
            d={generateAreaPath(data.nutrition)}
            fill="url(#nutritionFillGrad)"
            opacity={nutritionOpacity.areaFill}
          />
        )}
        {wellbeingShowGlow && (
          <Path
            d={generateAreaPath(data.wellbeing)}
            fill="url(#wellbeingFillGrad)"
            opacity={wellbeingOpacity.areaFill}
          />
        )}

        {/* Sleep Line - With Conditional Glow */}
        <G>
          {/* Soft colored glow layer - only when active */}
          {sleepShowGlow && (
            <Path
              d={generateSmoothPath(data.sleep)}
              stroke="#C084FC"
              strokeWidth="8"
              fill="none"
              opacity={sleepOpacity.lineGlow}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {/* Main line - always visible */}
          <Path
            d={generateSmoothPath(data.sleep)}
            stroke="url(#sleepLineGrad)"
            strokeWidth="3"
            fill="none"
            opacity={sleepOpacity.line}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </G>

        {/* Nutrition Line - With Conditional Glow */}
        <G>
          {/* Soft colored glow layer - only when active */}
          {nutritionShowGlow && (
            <Path
              d={generateSmoothPath(data.nutrition)}
              stroke="#34D399"
              strokeWidth="8"
              fill="none"
              opacity={nutritionOpacity.lineGlow}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {/* Main line - always visible */}
          <Path
            d={generateSmoothPath(data.nutrition)}
            stroke="url(#nutritionLineGrad)"
            strokeWidth="3"
            fill="none"
            opacity={nutritionOpacity.line}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </G>

        {/* Wellbeing Line - With Conditional Glow */}
        <G>
          {/* Soft colored glow layer - only when active */}
          {wellbeingShowGlow && (
            <Path
              d={generateSmoothPath(data.wellbeing)}
              stroke="#FB923C"
              strokeWidth="8"
              fill="none"
              opacity={wellbeingOpacity.lineGlow}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {/* Main line - always visible */}
          <Path
            d={generateSmoothPath(data.wellbeing)}
            stroke="url(#wellbeingLineGrad)"
            strokeWidth="3"
            fill="none"
            opacity={wellbeingOpacity.line}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </G>

        {/* Data Points - Sleep (with conditional glow) */}
        {data.sleep.map((value, index) => (
          <G key={`sleep-${index}`}>
            {/* Soft glow halo - only when active */}
            {sleepShowGlow && sleepOpacity.pointGlowOuter > 0 && (
              <Circle
                cx={getX(index)}
                cy={getY(value)}
                r="7"
                fill="#C084FC"
                opacity={sleepOpacity.pointGlowOuter}
              />
            )}
            {/* Medium glow ring - only when active */}
            {sleepShowGlow && sleepOpacity.pointGlowMiddle > 0 && (
              <Circle
                cx={getX(index)}
                cy={getY(value)}
                r="5"
                fill="#9333EA"
                opacity={sleepOpacity.pointGlowMiddle}
              />
            )}
            {/* Core point - always visible */}
            <Circle
              cx={getX(index)}
              cy={getY(value)}
              r="3.5"
              fill="#9333EA"
              stroke="#FFFFFF"
              strokeWidth="2"
              opacity={sleepOpacity.point}
            />
          </G>
        ))}

        {/* Data Points - Nutrition (with conditional glow) */}
        {data.nutrition.map((value, index) => (
          <G key={`nutrition-${index}`}>
            {/* Soft glow halo - only when active */}
            {nutritionShowGlow && nutritionOpacity.pointGlowOuter > 0 && (
              <Circle
                cx={getX(index)}
                cy={getY(value)}
                r="7"
                fill="#34D399"
                opacity={nutritionOpacity.pointGlowOuter}
              />
            )}
            {/* Medium glow ring - only when active */}
            {nutritionShowGlow && nutritionOpacity.pointGlowMiddle > 0 && (
              <Circle
                cx={getX(index)}
                cy={getY(value)}
                r="5"
                fill="#059669"
                opacity={nutritionOpacity.pointGlowMiddle}
              />
            )}
            {/* Core point - always visible */}
            <Circle
              cx={getX(index)}
              cy={getY(value)}
              r="3.5"
              fill="#059669"
              stroke="#FFFFFF"
              strokeWidth="2"
              opacity={nutritionOpacity.point}
            />
          </G>
        ))}

        {/* Data Points - Wellbeing (with conditional glow) */}
        {data.wellbeing.map((value, index) => (
          <G key={`wellbeing-${index}`}>
            {/* Soft glow halo - only when active */}
            {wellbeingShowGlow && wellbeingOpacity.pointGlowOuter > 0 && (
              <Circle
                cx={getX(index)}
                cy={getY(value)}
                r="7"
                fill="#FB923C"
                opacity={wellbeingOpacity.pointGlowOuter}
              />
            )}
            {/* Medium glow ring - only when active */}
            {wellbeingShowGlow && wellbeingOpacity.pointGlowMiddle > 0 && (
              <Circle
                cx={getX(index)}
                cy={getY(value)}
                r="5"
                fill="#EA580C"
                opacity={wellbeingOpacity.pointGlowMiddle}
              />
            )}
            {/* Core point - always visible */}
            <Circle
              cx={getX(index)}
              cy={getY(value)}
              r="3.5"
              fill="#EA580C"
              stroke="#FFFFFF"
              strokeWidth="2"
              opacity={wellbeingOpacity.point}
            />
          </G>
        ))}

        {/* X-axis labels - Dark Gray */}
        {dayLabels.map((label, index) => (
          <SvgText
            key={label}
            x={getX(index)}
            y={chartHeight - 15}
            fontSize="11"
            fill="#6B7280"
            textAnchor="middle"
          >
            {label}
          </SvgText>
        ))}
      </Svg>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    // Center the chart horizontally within the card
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PremiumStatsChart;
