import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  GestureResponderEvent,
  InteractionManager,
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

        {/* Total Sleep Summary */}
        <View style={styles.totalSleepCard}>
          <Ionicons name="time-outline" size={22} color="#9CA3AF" />
          <Text style={styles.totalSleepLabel}>TOTAL SLEEP</Text>
          <Text style={styles.totalSleepValue}>{calculateSleepDuration()}</Text>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={styles.continueButton}
          onPress={onContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

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
  const labelRadius = radius * 0.75;

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

  // Calculate positions for hour number labels
  const getHourLabelPosition = (hour: number) => {
    const angle = ((hour / 24) * 360 - 90) * Math.PI / 180;
    return {
      x: center + labelRadius * Math.cos(angle),
      y: center + labelRadius * Math.sin(angle),
    };
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

  // Hour positions for labels
  const hourLabels = [
    { hour: 22, label: '10' },
    { hour: 2, label: '2' },
    { hour: 4, label: '4' },
    { hour: 8, label: '8' },
    { hour: 14, label: '2' },
    { hour: 16, label: '4' },
    { hour: 20, label: '8' },
    { hour: 10, label: '10' },
  ];

  return (
    <View style={styles.circularSliderWrapper}>
      <View style={styles.circularSlider}>
        <Svg width={size} height={size}>
          {/* Gradient Definition */}
          <Defs>
            <SvgLinearGradient id="sleepGradient" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#A78BFA" stopOpacity="1" />
              <Stop offset="0.5" stopColor="#C084FC" stopOpacity="1" />
              <Stop offset="1" stopColor="#F59E0B" stopOpacity="1" />
            </SvgLinearGradient>
          </Defs>

          {/* Main track base */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#E8EAED"
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Inner shadow */}
          <Circle
            cx={center}
            cy={center}
            r={radius - strokeWidth / 2 + 3}
            stroke="#000000"
            strokeWidth={4}
            fill="none"
            opacity={0.06}
          />

          {/* Hour number labels */}
          {hourLabels.map((item, index) => {
            const pos = getHourLabelPosition(item.hour);
            return (
              <SvgText
                key={`hour-${index}`}
                x={pos.x}
                y={pos.y + 5}
                fontSize="13"
                fill="#D1D5DB"
                fontWeight="500"
                textAnchor="middle"
              >
                {item.label}
              </SvgText>
            );
          })}

          {/* Sleep Duration Arc shadow */}
          <Path
            d={createArcPath()}
            stroke="#000000"
            strokeWidth={30}
            fill="none"
            strokeLinecap="round"
            opacity={0.15}
          />

          {/* Sleep Duration Arc with gradient */}
          <Path
            d={createArcPath()}
            stroke="url(#sleepGradient)"
            strokeWidth={29}
            fill="none"
            strokeLinecap="round"
          />

          {/* Inner highlight on sleep arc */}
          <Path
            d={createArcPath()}
            stroke="#FFFFFF"
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
            opacity={0.3}
          />
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

        {/* Time Labels positioned inside circle */}
        <View style={[styles.timeLabelContainer, { top: '18%', left: '50%', transform: [{ translateX: -20 }] }]}>
          <Text style={styles.timeLabel}>12AM</Text>
        </View>
        <View style={[styles.timeLabelContainer, { top: '50%', right: '18%', transform: [{ translateY: -10 }] }]}>
          <Text style={styles.timeLabel}>6AM</Text>
        </View>
        <View style={[styles.timeLabelContainer, { bottom: '18%', left: '50%', transform: [{ translateX: -20 }] }]}>
          <Text style={styles.timeLabel}>12PM</Text>
        </View>
        <View style={[styles.timeLabelContainer, { top: '50%', left: '18%', transform: [{ translateY: -10 }] }]}>
          <Text style={styles.timeLabel}>6PM</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5F2',
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
    gap: 10,
  },
  timeCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  timeCardIconGradientRing: {
    width: 42,
    height: 42,
    borderRadius: 21,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  timeCardIconInnerCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeCardContent: {
    flex: 1,
  },
  timeCardLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 2,
  },
  timeCardValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.3,
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
  timeLabelContainer: {
    position: 'absolute',
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },

  // Total Sleep Card
  totalSleepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  totalSleepLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 1.2,
    marginTop: 6,
    marginBottom: 2,
  },
  totalSleepValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.4,
  },

  // Continue Button
  continueButton: {
    backgroundColor: '#1F2937',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 4,
    letterSpacing: -0.2,
  },
});

export default MorningTrackingSleepContent;
