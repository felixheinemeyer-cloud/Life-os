import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  GestureResponderEvent,
  InteractionManager,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Defs, LinearGradient as SvgLinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

interface MorningTrackingSleepContentProps {
  bedtime: { hour: number; minute: number };
  wakeTime: { hour: number; minute: number };
  onBedtimeChange: (value: { hour: number; minute: number }) => void;
  onWakeTimeChange: (value: { hour: number; minute: number }) => void;
  onContinue: () => void;
}

const MorningTrackingSleepContent: React.FC<MorningTrackingSleepContentProps> = ({
  bedtime,
  wakeTime,
  onBedtimeChange,
  onWakeTimeChange,
  onContinue,
}) => {
  const [activeHandle, setActiveHandle] = useState<'bedtime' | 'wakeTime' | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Defer heavy SVG rendering until after navigation transition completes
  useEffect(() => {
    const handle = InteractionManager.runAfterInteractions(() => {
      setIsReady(true);
    });
    return () => handle.cancel();
  }, []);

  // Track previous values for haptic feedback on change
  const prevBedtimeRef = useRef(bedtime);
  const prevWakeTimeRef = useRef(wakeTime);

  // Convert angle to time with 5-minute snapping
  const angleToTime = (angle: number): { hour: number; minute: number } => {
    let normalizedAngle = (angle + 90) % 360;
    if (normalizedAngle < 0) normalizedAngle += 360;
    const totalMinutes = (normalizedAngle / 360) * 24 * 60;
    const hour = Math.floor(totalMinutes / 60) % 24;
    const rawMinute = Math.round(totalMinutes % 60);
    // Snap to nearest 5-minute interval
    const minute = Math.round(rawMinute / 5) * 5;
    return { hour: minute === 60 ? (hour + 1) % 24 : hour, minute: minute === 60 ? 0 : minute };
  };

  // Calculate distance between two points
  const distance = (x1: number, y1: number, x2: number, y2: number): number => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  };

  // Handle touch/drag on the circular slider
  const handleSliderTouch = (event: GestureResponderEvent): void => {
    const { locationX, locationY } = event.nativeEvent;

    // Match the actual slider dimensions
    const size = 340;
    const strokeWidth = 36;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = (size - strokeWidth - 40) / 2;

    // Calculate positions of both handles using CURRENT state
    const bedtimeAngle = ((bedtime.hour + bedtime.minute / 60) / 24) * 360 - 90;
    const wakeTimeAngle = ((wakeTime.hour + wakeTime.minute / 60) / 24) * 360 - 90;

    const bedtimeRad = (bedtimeAngle * Math.PI) / 180;
    const wakeTimeRad = (wakeTimeAngle * Math.PI) / 180;

    const bedtimeX = centerX + radius * Math.cos(bedtimeRad);
    const bedtimeY = centerY + radius * Math.sin(bedtimeRad);
    const wakeTimeX = centerX + radius * Math.cos(wakeTimeRad);
    const wakeTimeY = centerY + radius * Math.sin(wakeTimeRad);

    // Calculate distance to each handle
    const distToBedtime = distance(locationX, locationY, bedtimeX, bedtimeY);
    const distToWakeTime = distance(locationX, locationY, wakeTimeX, wakeTimeY);

    // Define hit box threshold
    const hitBoxRadius = 80;

    // Only proceed if touch is within hit box of at least one handle
    if (distToBedtime > hitBoxRadius && distToWakeTime > hitBoxRadius) {
      return;
    }

    // Convert touch position to time
    const dx = locationX - centerX;
    const dy = locationY - centerY;
    const touchAngle = Math.atan2(dy, dx) * (180 / Math.PI);
    const time = angleToTime(touchAngle);

    // Update ONLY the closer handle
    if (distToBedtime < distToWakeTime) {
      onBedtimeChange(time);
      setActiveHandle('bedtime');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      onWakeTimeChange(time);
      setActiveHandle('wakeTime');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSliderMove = (event: GestureResponderEvent): void => {
    if (!activeHandle) return;

    const { locationX, locationY } = event.nativeEvent;
    const size = 340;
    const centerX = size / 2;
    const centerY = size / 2;

    const dx = locationX - centerX;
    const dy = locationY - centerY;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    const time = angleToTime(angle);

    if (activeHandle === 'bedtime') {
      const prevTime = prevBedtimeRef.current;
      const hasChanged = time.hour !== prevTime.hour || time.minute !== prevTime.minute;
      onBedtimeChange(time);
      if (hasChanged) {
        prevBedtimeRef.current = time;
        Haptics.selectionAsync();
      }
    } else {
      const prevTime = prevWakeTimeRef.current;
      const hasChanged = time.hour !== prevTime.hour || time.minute !== prevTime.minute;
      onWakeTimeChange(time);
      if (hasChanged) {
        prevWakeTimeRef.current = time;
        Haptics.selectionAsync();
      }
    }
  };

  const handleSliderRelease = (): void => {
    setActiveHandle(null);
  };

  // Calculate total sleep duration
  const calculateSleepDuration = (): string => {
    const bedtimeMinutes = bedtime.hour * 60 + bedtime.minute;
    const wakeTimeMinutes = wakeTime.hour * 60 + wakeTime.minute;

    let durationMinutes = wakeTimeMinutes - bedtimeMinutes;
    if (durationMinutes < 0) {
      durationMinutes += 24 * 60;
    }

    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    return `${hours}h ${minutes}m`;
  };

  // Format time as 12-hour with AM/PM
  const formatTime = (hour: number, minute: number): string => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      bounces={false}
      scrollEnabled={activeHandle === null}
    >
      {/* Content */}
      <View style={styles.content}>
        {/* Time Info Cards Row */}
        <View style={styles.timeCardsRow}>
          {/* Bedtime Card */}
          <View style={styles.timeCard}>
            <LinearGradient
              colors={['#A78BFA', '#8B5CF6', '#7C3AED']}
              style={styles.timeCardIconGradientRing}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.timeCardIconInnerCircle}>
                <Ionicons name="moon" size={20} color="#7C3AED" />
              </View>
            </LinearGradient>
            <View style={styles.timeCardContent}>
              <Text style={styles.timeCardLabel}>Bedtime</Text>
              <Text style={styles.timeCardValue}>
                {formatTime(bedtime.hour, bedtime.minute)}
              </Text>
            </View>
          </View>

          {/* Wake-up Card */}
          <View style={styles.timeCard}>
            <LinearGradient
              colors={['#FBBF24', '#F59E0B', '#D97706']}
              style={styles.timeCardIconGradientRing}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.timeCardIconInnerCircle}>
                <Ionicons name="sunny" size={20} color="#D97706" />
              </View>
            </LinearGradient>
            <View style={styles.timeCardContent}>
              <Text style={styles.timeCardLabel}>Wake up</Text>
              <Text style={styles.timeCardValue}>
                {formatTime(wakeTime.hour, wakeTime.minute)}
              </Text>
            </View>
          </View>
        </View>

        {/* Top Spacer for equal spacing */}
        <View style={{ flex: 1 }} />

        {/* Circular Sleep Slider - Interactive */}
        <View
          style={styles.sliderContainer}
          onStartShouldSetResponder={() => true}
          onResponderGrant={handleSliderTouch}
          onResponderMove={handleSliderMove}
          onResponderRelease={handleSliderRelease}
        >
          {isReady ? (
            <CircularSleepSlider
              bedtime={bedtime}
              wakeTime={wakeTime}
            />
          ) : (
            <View style={styles.sliderPlaceholder} />
          )}
        </View>

        {/* Bottom Spacer for equal spacing */}
        <View style={{ flex: 1 }} />

        {/* Total Sleep Summary - Hero Card */}
        <View style={styles.totalSleepCard}>
          <Text style={styles.totalSleepLabel}>TOTAL SLEEP</Text>
          <Text style={styles.totalSleepValue}>{calculateSleepDuration()}</Text>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => { Keyboard.dismiss(); onContinue(); }}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// HSL Color utilities for smooth gradient interpolation
const hexToHsl = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0];

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return [h * 360, s * 100, l * 100];
};

const hslToHex = (h: number, s: number, l: number): string => {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

// Interpolate between two colors in HSL space
const interpolateColor = (color1: string, color2: string, factor: number): string => {
  const [h1, s1, l1] = hexToHsl(color1);
  const [h2, s2, l2] = hexToHsl(color2);

  // Handle hue interpolation (shortest path around the circle)
  let hDiff = h2 - h1;
  if (Math.abs(hDiff) > 180) {
    if (hDiff > 0) {
      hDiff = hDiff - 360;
    } else {
      hDiff = hDiff + 360;
    }
  }

  const h = (h1 + hDiff * factor + 360) % 360;
  const s = s1 + (s2 - s1) * factor;
  const l = l1 + (l2 - l1) * factor;

  return hslToHex(h, s, l);
};

// Generate smooth gradient stops using HSL interpolation
const generateSmoothGradientStops = (): Array<{ offset: string; color: string }> => {
  // Key colors for the gradient (night purple to morning yellow)
  const keyColors = [
    { pos: 0, color: '#6D28D9' },     // Deep violet
    { pos: 0.12, color: '#7C3AED' },  // Purple
    { pos: 0.25, color: '#8B5CF6' },  // Lighter purple
    { pos: 0.35, color: '#A78BFA' },  // Lavender
    { pos: 0.45, color: '#C084FC' },  // Light violet
    { pos: 0.55, color: '#E879F9' },  // Fuchsia
    { pos: 0.65, color: '#F472B6' },  // Pink
    { pos: 0.75, color: '#FB7185' },  // Rose
    { pos: 0.85, color: '#FB923C' },  // Orange
    { pos: 0.95, color: '#FBBF24' },  // Amber
    { pos: 1, color: '#FCD34D' },     // Yellow
  ];

  const stops: Array<{ offset: string; color: string }> = [];
  const totalStops = 50; // Many stops for ultra-smooth gradient

  for (let i = 0; i <= totalStops; i++) {
    const position = i / totalStops;

    // Find the two key colors to interpolate between
    let startIdx = 0;
    for (let j = 0; j < keyColors.length - 1; j++) {
      if (position >= keyColors[j].pos && position <= keyColors[j + 1].pos) {
        startIdx = j;
        break;
      }
    }

    const startColor = keyColors[startIdx];
    const endColor = keyColors[startIdx + 1];

    // Calculate interpolation factor between these two key colors
    const range = endColor.pos - startColor.pos;
    const factor = range > 0 ? (position - startColor.pos) / range : 0;

    // Apply easing for even smoother transitions
    const easedFactor = factor * factor * (3 - 2 * factor); // Smoothstep

    const interpolatedColor = interpolateColor(startColor.color, endColor.color, easedFactor);

    stops.push({
      offset: position.toFixed(3),
      color: interpolatedColor,
    });
  }

  return stops;
};

// Pre-generate gradient stops (memoized outside component)
const smoothGradientStops = generateSmoothGradientStops();

// Circular Sleep Slider Component
interface CircularSleepSliderProps {
  bedtime: { hour: number; minute: number };
  wakeTime: { hour: number; minute: number };
}

const CircularSleepSlider: React.FC<CircularSleepSliderProps> = ({ bedtime, wakeTime }) => {
  const size = 340;
  const strokeWidth = 36;
  const center = size / 2;
  const radius = (size - strokeWidth - 40) / 2;

  // Calculate angles (0° = 12 o'clock, clockwise)
  const bedtimeAngle = ((bedtime.hour + bedtime.minute / 60) / 24) * 360;
  const wakeTimeAngle = ((wakeTime.hour + wakeTime.minute / 60) / 24) * 360;

  // Convert to radians with -90° offset (start from top)
  const bedtimeRad = ((bedtimeAngle - 90) * Math.PI) / 180;
  const wakeTimeRad = ((wakeTimeAngle - 90) * Math.PI) / 180;

  // Calculate handle positions
  const bedtimePos = {
    x: center + radius * Math.cos(bedtimeRad),
    y: center + radius * Math.sin(bedtimeRad),
  };

  const wakeTimePos = {
    x: center + radius * Math.cos(wakeTimeRad),
    y: center + radius * Math.sin(wakeTimeRad),
  };

  // Create arc path for sleep duration
  const createArcPath = (): string => {
    const startX = bedtimePos.x;
    const startY = bedtimePos.y;
    const endX = wakeTimePos.x;
    const endY = wakeTimePos.y;

    let sweep = wakeTimeAngle - bedtimeAngle;
    if (sweep < 0) sweep += 360;
    const largeArcFlag = sweep > 180 ? 1 : 0;

    return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
  };

  // Calculate label positions inside the circle
  const labelRadius = radius - strokeWidth / 2 - 28;

  const getLabelPosition = (hour: number) => {
    const angle = ((hour / 24) * 360 - 90) * Math.PI / 180;
    return {
      x: center + labelRadius * Math.cos(angle),
      y: center + labelRadius * Math.sin(angle),
    };
  };

  const labelPositions = {
    top: getLabelPosition(0),    // 12AM
    right: getLabelPosition(6),  // 6AM
    bottom: getLabelPosition(12), // 12PM
    left: getLabelPosition(18),  // 6PM
  };

  // Generate tick marks inside the circle, between track and numbers (pointing toward center)
  const generateTrackTicks = () => {
    const ticks = [];
    const innerEdge = radius - strokeWidth / 2;
    const majorTickLength = 7;
    const minorTickLength = 3; // Much shorter for 15min marks
    const outerRadius = innerEdge - 2; // Start just inside the track

    // Generate ticks every 15 minutes (96 ticks for 24 hours)
    for (let i = 0; i < 96; i++) {
      const tickAngle = (i / 96) * 360;
      const angleRad = (tickAngle - 90) * Math.PI / 180;
      const isMajor = i % 4 === 0; // Major ticks every hour
      const tickLength = isMajor ? majorTickLength : minorTickLength;
      const innerRadius = outerRadius - tickLength;

      const x1 = center + innerRadius * Math.cos(angleRad);
      const y1 = center + innerRadius * Math.sin(angleRad);
      const x2 = center + outerRadius * Math.cos(angleRad);
      const y2 = center + outerRadius * Math.sin(angleRad);

      ticks.push({ x1, y1, x2, y2, isMajor });
    }
    return ticks;
  };

  const trackTicks = generateTrackTicks();

  // Generate perpendicular tick marks for the sleep arc (radial stripes on colored portion)
  const generateArcTicks = () => {
    const ticks = [];
    // Only 1/4 of the track width, centered (shorter)
    const tickHeight = strokeWidth / 4;
    const innerRadius = radius - tickHeight / 2;
    const outerRadius = radius + tickHeight / 2;

    // Calculate the sleep duration in terms of angle
    let startAngle = bedtimeAngle;
    let endAngle = wakeTimeAngle;
    if (endAngle < startAngle) endAngle += 360;

    // Generate ticks every 15 minutes (96 ticks for 24 hours, 4 per hour)
    for (let i = 0; i < 96; i++) {
      const tickAngle = (i / 96) * 360;

      // Check if this tick falls within the sleep arc
      let normalizedTickAngle = tickAngle;
      if (normalizedTickAngle < startAngle && endAngle > 360) {
        normalizedTickAngle += 360;
      }

      const isInArc = (normalizedTickAngle >= startAngle && normalizedTickAngle <= endAngle) ||
                      (tickAngle + 360 >= startAngle && tickAngle + 360 <= endAngle);

      if (!isInArc) continue;

      const angleRad = (tickAngle - 90) * Math.PI / 180;

      const x1 = center + innerRadius * Math.cos(angleRad);
      const y1 = center + innerRadius * Math.sin(angleRad);
      const x2 = center + outerRadius * Math.cos(angleRad);
      const y2 = center + outerRadius * Math.sin(angleRad);

      ticks.push({ x1, y1, x2, y2 });
    }
    return ticks;
  };

  const arcTicks = generateArcTicks();

  // Even hour labels (2, 4, 8, 10, 14, 16, 20, 22)
  const evenHourLabels = [2, 4, 8, 10, 14, 16, 20, 22];
  const getEvenHourPosition = (hour: number) => {
    const angle = ((hour / 24) * 360 - 90) * Math.PI / 180;
    return {
      x: center + labelRadius * Math.cos(angle),
      y: center + labelRadius * Math.sin(angle),
    };
  };

  return (
    <View style={styles.circularSliderWrapper}>
      <View style={styles.circularSlider}>
        <Svg width={size} height={size}>
          {/* Gradient Definition - Fixed gradient */}
          <Defs>
            <SvgLinearGradient
              id="sleepGradient"
              x1="0"
              y1="0"
              x2="1"
              y2="1"
            >
              <Stop offset="0" stopColor="#7C3AED" stopOpacity="1" />
              <Stop offset="0.12" stopColor="#8B5CF6" stopOpacity="1" />
              <Stop offset="0.24" stopColor="#A78BFA" stopOpacity="1" />
              <Stop offset="0.36" stopColor="#D946EF" stopOpacity="1" />
              <Stop offset="0.48" stopColor="#F472B6" stopOpacity="1" />
              <Stop offset="0.6" stopColor="#FB7185" stopOpacity="1" />
              <Stop offset="0.75" stopColor="#FB923C" stopOpacity="1" />
              <Stop offset="1" stopColor="#FBBF24" stopOpacity="1" />
            </SvgLinearGradient>
          </Defs>

          {/* Main track base - softer color */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Tick marks on the gray track (15min intervals) */}
          {trackTicks.map((tick, index) => (
            <Path
              key={`track-tick-${index}`}
              d={`M ${tick.x1} ${tick.y1} L ${tick.x2} ${tick.y2}`}
              stroke={tick.isMajor ? '#B8BCC4' : '#D0D4DA'}
              strokeWidth={tick.isMajor ? 1.5 : 1}
              strokeLinecap="round"
            />
          ))}

          {/* Outer subtle shadow ring */}
          <Circle
            cx={center}
            cy={center}
            r={radius + strokeWidth / 2 + 1}
            stroke="#000000"
            strokeWidth={1}
            fill="none"
            opacity={0.04}
          />

          {/* Inner shadow */}
          <Circle
            cx={center}
            cy={center}
            r={radius - strokeWidth / 2 + 2}
            stroke="#000000"
            strokeWidth={3}
            fill="none"
            opacity={0.05}
          />

          {/* Time labels inside the circle - 12hr format with icons for midnight and noon */}
          {/* Midnight (12) - just the number, icon added via React Native */}
          <SvgText
            x={labelPositions.top.x}
            y={labelPositions.top.y + 6}
            fontSize="15"
            fontWeight="600"
            fill="#6B7280"
            textAnchor="middle"
          >
            12
          </SvgText>
          {/* 6 AM */}
          <SvgText
            x={labelPositions.right.x}
            y={labelPositions.right.y + 5}
            fontSize="15"
            fontWeight="600"
            fill="#6B7280"
            textAnchor="middle"
          >
            6
          </SvgText>
          {/* Noon (12) - just the number, icon added via React Native */}
          <SvgText
            x={labelPositions.bottom.x}
            y={labelPositions.bottom.y + 4}
            fontSize="15"
            fontWeight="600"
            fill="#6B7280"
            textAnchor="middle"
          >
            12
          </SvgText>
          {/* 6 PM */}
          <SvgText
            x={labelPositions.left.x}
            y={labelPositions.left.y + 5}
            fontSize="15"
            fontWeight="600"
            fill="#6B7280"
            textAnchor="middle"
          >
            6
          </SvgText>

          {/* Even hour labels (2, 4, 8, 10 - displayed twice for AM and PM) */}
          {evenHourLabels.map((hour) => {
            const pos = getEvenHourPosition(hour);
            // Convert 24h to 12h format for display
            const displayHour = hour > 12 ? hour - 12 : hour;
            return (
              <SvgText
                key={`hour-${hour}`}
                x={pos.x}
                y={pos.y + 5}
                fontSize="13"
                fontWeight="500"
                fill="#9CA3AF"
                textAnchor="middle"
              >
                {displayHour}
              </SvgText>
            );
          })}

          {/* Sleep Duration Arc outer glow */}
          <Path
            d={createArcPath()}
            stroke="#8B5CF6"
            strokeWidth={38}
            fill="none"
            strokeLinecap="round"
            opacity={0.08}
          />

          {/* Sleep Duration Arc shadow */}
          <Path
            d={createArcPath()}
            stroke="#000000"
            strokeWidth={32}
            fill="none"
            strokeLinecap="round"
            opacity={0.12}
          />

          {/* Sleep Duration Arc with gradient */}
          <Path
            d={createArcPath()}
            stroke="url(#sleepGradient)"
            strokeWidth={30}
            fill="none"
            strokeLinecap="round"
          />

          {/* Perpendicular tick marks on the colored sleep arc */}
          {arcTicks.map((tick, index) => (
            <Path
              key={`arc-tick-${index}`}
              d={`M ${tick.x1} ${tick.y1} L ${tick.x2} ${tick.y2}`}
              stroke="rgba(255, 255, 255, 0.45)"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          ))}
        </Svg>

        {/* Bedtime Handle */}
        <View
          style={{
            position: 'absolute',
            left: bedtimePos.x - 21,
            top: bedtimePos.y - 21,
            width: 42,
            height: 42,
          }}
          pointerEvents="none"
        >
          <LinearGradient
            colors={['#A78BFA', '#8B5CF6', '#7C3AED']}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              padding: 2,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: '#FFFFFF',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Ionicons name="moon" size={20} color="#7C3AED" />
            </View>
          </LinearGradient>
        </View>

        {/* Wake Time Handle */}
        <View
          style={{
            position: 'absolute',
            left: wakeTimePos.x - 21,
            top: wakeTimePos.y - 21,
            width: 42,
            height: 42,
          }}
          pointerEvents="none"
        >
          <LinearGradient
            colors={['#FBBF24', '#F59E0B', '#D97706']}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              padding: 2,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: '#FFFFFF',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Ionicons name="sunny" size={20} color="#D97706" />
            </View>
          </LinearGradient>
        </View>

        {/* Moon icon below 0 (midnight) */}
        <View style={styles.midnightIcon}>
          <Ionicons name="moon" size={14} color="#9CA3AF" />
        </View>

        {/* Sun icon above 12 (noon) */}
        <View style={styles.noonIcon}>
          <Ionicons name="sunny" size={14} color="#9CA3AF" />
        </View>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0EEE8',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Time Cards
  timeCardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.03)',
  },
  timeCardIconGradientRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  timeCardIconInnerCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeCardContent: {
    flex: 1,
  },
  timeCardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 3,
    letterSpacing: 0.3,
  },
  timeCardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.4,
  },

  // Circular Slider
  sliderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 0,
    paddingHorizontal: 16,
  },
  sliderPlaceholder: {
    width: 340,
    height: 340,
  },
  circularSliderWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularSlider: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 340,
    height: 340,
  },
  midnightIcon: {
    position: 'absolute',
    top: 100,
    left: 163, // (340 - 14) / 2 = 163 to center a 14px icon
  },
  noonIcon: {
    position: 'absolute',
    bottom: 100,
    left: 163,
  },

  // Total Sleep Card - Hero Element
  totalSleepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 0,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.08)',
  },
  totalSleepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  totalSleepValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -1,
  },

  // Continue Button
  continueButton: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 6,
    letterSpacing: -0.2,
  },
});

export default MorningTrackingSleepContent;
