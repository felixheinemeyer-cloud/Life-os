import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, PanResponder, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Line, Circle, Text as SvgText } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// --- Slider Rating Bar ---
interface SliderRatingBarProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  color: string;
  isLast?: boolean;
}

export const SliderRatingBar: React.FC<SliderRatingBarProps> = ({ icon, label, value, color, isLast }) => {
  const percentage = (value / 10) * 100;
  return (
    <View style={[styles.sliderRatingRow, isLast && styles.sliderRatingRowLast]}>
      <View style={[styles.sliderRatingIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <View style={styles.sliderRatingContent}>
        <View style={styles.sliderRatingHeader}>
          <Text style={styles.sliderRatingLabel}>{label}</Text>
          <Text style={[styles.sliderRatingValue, { color }]}>{value}/10</Text>
        </View>
        <View style={styles.sliderRatingProgressBg}>
          <View style={[styles.sliderRatingProgressFill, { backgroundColor: color, width: `${percentage}%` }]} />
        </View>
      </View>
    </View>
  );
};

// --- Metric Row ---
interface MetricRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  numericValue: number;
  maxValue: number;
  color: string;
  bgColor: string;
  trend: number;
  isLast?: boolean;
}

export const MetricRow: React.FC<MetricRowProps> = ({
  icon, label, value, numericValue, maxValue, color, bgColor, trend, isLast,
}) => {
  const progress = Math.min(numericValue / maxValue, 1);
  const getTrendColor = () => {
    if (trend > 0) return '#059669';
    if (trend < 0) return '#EF4444';
    return '#9CA3AF';
  };
  const getTrendLabel = () => {
    if (trend === 0) return 'no change';
    const symbol = trend > 0 ? '↑' : '↓';
    return `${symbol} ${Math.abs(trend)}%`;
  };

  return (
    <View style={[styles.metricRow, isLast && styles.metricRowLast]}>
      <View style={[styles.metricIcon, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <View style={styles.metricContent}>
        <View style={styles.metricHeader}>
          <Text style={styles.metricLabel}>{label}</Text>
          <Text style={[styles.metricValue, { color }]}>{value}</Text>
        </View>
        <View style={styles.metricProgressRow}>
          <View style={styles.metricProgressBg}>
            <View style={[styles.metricProgressFill, { backgroundColor: color, width: `${progress * 100}%` }]} />
          </View>
          <Text style={[styles.metricTrend, { color: getTrendColor() }]}>{getTrendLabel()}</Text>
        </View>
      </View>
    </View>
  );
};

// --- Single Choice Section ---
interface SingleChoiceSectionProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  selectedLabel: string;
  selectedDescription: string;
  color: string;
}

export const SingleChoiceSection: React.FC<SingleChoiceSectionProps> = ({
  title, icon, selectedLabel, selectedDescription, color,
}) => (
  <View style={styles.singleChoiceSection}>
    <Text style={styles.singleChoiceSectionTitle}>{title}</Text>
    <View style={styles.singleChoiceSelectedCard}>
      <View style={[styles.singleChoiceSelectedIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.singleChoiceSelectedContent}>
        <Text style={styles.singleChoiceSelectedLabel}>{selectedLabel}</Text>
        <Text style={styles.singleChoiceSelectedDescription}>{selectedDescription}</Text>
      </View>
    </View>
  </View>
);

// --- Section Card Wrapper ---
interface SectionCardProps {
  title: string;
  children: React.ReactNode;
}

export const SectionCard: React.FC<SectionCardProps> = ({ title, children }) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionHeader}>
      <LinearGradient
        colors={['#BAE6FD', '#38BDF8', '#0EA5E9']}
        style={styles.sectionIconRing}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.sectionIconInner}>
          <Ionicons name="body" size={22} color="#0EA5E9" />
        </View>
      </LinearGradient>
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
    </View>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

// --- Health Notes / Promise Section ---
interface TextSectionProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  text: string;
}

export const TextSection: React.FC<TextSectionProps> = ({ icon, iconColor, title, text }) => (
  <View style={styles.healthNotesSection}>
    <View style={styles.healthNotesTitleRow}>
      <Ionicons name={icon} size={16} color={iconColor} />
      <Text style={styles.healthNotesTitle}>{title}</Text>
    </View>
    <Text style={styles.healthNotesText}>{text}</Text>
  </View>
);

// --- What Helped Section ---
interface WhatHelpedProps {
  helpers: Array<{ label: string; icon: string }>;
}

export const WhatHelpedSection: React.FC<WhatHelpedProps> = ({ helpers }) => (
  <View style={styles.whatHelpedSection}>
    <Text style={styles.whatHelpedTitle}>What Helped</Text>
    <View style={styles.whatHelpedCardsContainer}>
      {helpers.map((helper, index) => (
        <View key={index} style={styles.whatHelpedCard}>
          <View style={styles.whatHelpedCardIcon}>
            <Ionicons name={helper.icon as keyof typeof Ionicons.glyphMap} size={18} color="#0EA5E9" />
          </View>
          <Text style={styles.whatHelpedCardLabel}>{helper.label}</Text>
        </View>
      ))}
    </View>
  </View>
);

// --- Photo + Weight Row ---
interface PhotoWeightRowProps {
  photoUri?: string | null;
  weight?: { value: number; unit: string; change: number };
  otherStats?: Array<{ label: string; value: string }>;
  onPhotoPress?: () => void;
}

export const PhotoWeightRow: React.FC<PhotoWeightRowProps> = ({ photoUri, weight, otherStats, onPhotoPress }) => (
  <View style={styles.summaryTopSection}>
    {photoUri && (
      <TouchableOpacity style={styles.photoPreview} onPress={onPhotoPress} activeOpacity={0.9}>
        <Image source={{ uri: photoUri }} style={styles.photoPreviewImage} />
        {onPhotoPress && (
          <View style={styles.photoExpandIcon}>
            <Ionicons name="expand" size={14} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
    )}
    {weight && (
      <View style={styles.bodyMetricCard}>
        <Text style={styles.bodyMetricLabel}>Weight</Text>
        <View style={styles.bodyMetricValueRow}>
          <Text style={styles.bodyMetricValue}>{weight.value}</Text>
          <Text style={styles.bodyMetricUnit}>{weight.unit}</Text>
        </View>
        <View style={[styles.bodyMetricChange, { backgroundColor: weight.change < 0 ? '#D1FAE5' : '#FEE2E2' }]}>
          <Ionicons name={weight.change < 0 ? 'arrow-down' : 'arrow-up'} size={10} color={weight.change < 0 ? '#059669' : '#EF4444'} />
          <Text style={[styles.bodyMetricChangeText, { color: weight.change < 0 ? '#059669' : '#EF4444' }]}>
            {Math.abs(weight.change)} {weight.unit}
          </Text>
        </View>
      </View>
    )}
    {otherStats && otherStats.length > 0 && (
      <View style={styles.bodyMetricCardOtherStats}>
        <Text style={styles.bodyMetricLabelOtherStats}>Other Stats</Text>
        <ScrollView style={styles.bodyStatsTextField} contentContainerStyle={styles.bodyStatsTextFieldContent} showsVerticalScrollIndicator nestedScrollEnabled>
          <Text style={styles.bodyStatsTextFieldText}>
            {otherStats.map(stat => `${stat.label}: ${stat.value}`).join(', ')}
          </Text>
        </ScrollView>
      </View>
    )}
  </View>
);

// --- Simple Photo + Weight for Completion Screen ---
interface SimplePhotoWeightRowProps {
  photoUri?: string | null;
  weight?: string;
  weightUnit?: string;
}

export const SimplePhotoWeightRow: React.FC<SimplePhotoWeightRowProps> = ({ photoUri, weight, weightUnit }) => (
  <View style={styles.summaryTopSection}>
    {photoUri && (
      <View style={styles.photoPreview}>
        <Image source={{ uri: photoUri }} style={styles.photoPreviewImage} />
      </View>
    )}
    {weight && (
      <View style={styles.bodyMetricCard}>
        <Text style={styles.bodyMetricLabel}>Weight</Text>
        <View style={styles.bodyMetricValueRow}>
          <Text style={styles.bodyMetricValue}>{weight}</Text>
          <Text style={styles.bodyMetricUnit}>{weightUnit || 'kg'}</Text>
        </View>
      </View>
    )}
  </View>
);

// --- Ratings Section Title ---
export const RatingsSectionTitle: React.FC<{ title: string; withBorder?: boolean }> = ({ title, withBorder = true }) => (
  <View style={[styles.ratingsSectionContainer, withBorder && styles.ratingsSectionBorder]}>
    <Text style={styles.ratingsSectionTitle}>{title}</Text>
  </View>
);

// --- 30-Day Patterns Chart ---

export const CHART_METRIC_COLORS = {
  sleep: { primary: '#8B5CF6', light: '#C4B5FD', name: 'Sleep' },
  energy: { primary: '#F59E0B', light: '#FDE68A', name: 'Energy' },
  nutrition: { primary: '#10B981', light: '#A7F3D0', name: 'Nutrition' },
};

export type ChartMetricType = 'sleep' | 'energy' | 'nutrition';

export interface ChartInsightsData {
  sleep: number[];
  energy: number[];
  nutrition: number[];
}

export const generateChartMockData = (): ChartInsightsData => {
  const data: ChartInsightsData = { sleep: [], energy: [], nutrition: [] };
  for (let i = 0; i < 30; i++) {
    const baseSleep = 6.5 + Math.sin(i * 0.3) * 1.5 + (Math.random() - 0.5) * 1.5;
    data.sleep.push(Math.max(4, Math.min(10, baseSleep)));
    const baseNutrition = 6 + Math.sin(i * 0.2 + 1) * 2 + (Math.random() - 0.5) * 2;
    data.nutrition.push(Math.round(Math.max(3, Math.min(10, baseNutrition))));
    const sleepFactor = i > 0 ? data.sleep[i - 1] : data.sleep[0];
    const nutritionFactor = data.nutrition[i];
    const baseEnergy = (sleepFactor * 0.5 + nutritionFactor * 0.3 + 2) + (Math.random() - 0.5) * 1.5;
    data.energy.push(Math.round(Math.max(3, Math.min(10, baseEnergy))));
  }
  return data;
};

interface CombinedChartProps {
  data: ChartInsightsData;
  activeMetrics: Set<ChartMetricType>;
  onToggleMetric: (metric: ChartMetricType) => void;
}

export const CombinedChart: React.FC<CombinedChartProps> = ({ data, activeMetrics, onToggleMetric }) => {
  const chartWidth = SCREEN_WIDTH - 64;
  const chartHeight = 180;
  const padding = { top: 16, right: 12, bottom: 32, left: 32 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  const scale = { min: 1, max: 10 };
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const dates = useMemo(() => {
    const today = new Date();
    const dateArray: Date[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dateArray.push(date);
    }
    return dateArray;
  }, []);

  const selectedDateStr = useMemo(() => {
    if (activeIndex === null) return null;
    const date = dates[activeIndex];
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }, [activeIndex, dates]);

  const getX = (index: number): number => padding.left + (index / 29) * plotWidth;
  const getY = (value: number): number => {
    const normalizedValue = Math.max(scale.min, Math.min(scale.max, value));
    return padding.top + plotHeight - ((normalizedValue - scale.min) / (scale.max - scale.min)) * plotHeight;
  };

  const generatePath = (values: number[]): string => {
    if (values.length === 0) return '';
    const points = values.map((value, index) => ({ x: getX(index), y: getY(value) }));
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];
      const cp1x = p1.x + (p2.x - p0.x) / 8;
      const cp1y = p1.y + (p2.y - p0.y) / 8;
      const cp2x = p2.x - (p3.x - p1.x) / 8;
      const cp2y = p2.y - (p3.y - p1.y) / 8;
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  };

  const getIndexFromX = useCallback((locationX: number): number => {
    const relativeX = locationX - padding.left;
    const clampedX = Math.max(0, Math.min(relativeX, plotWidth));
    const index = Math.round((clampedX / plotWidth) * 29);
    return Math.max(0, Math.min(29, index));
  }, [plotWidth, padding.left]);

  const panResponder = useMemo(() => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt) => {
        const index = getIndexFromX(evt.nativeEvent.locationX);
        setActiveIndex(index);
        if (Platform.OS === 'ios') Haptics.selectionAsync();
      },
      onPanResponderMove: (evt) => {
        const index = getIndexFromX(evt.nativeEvent.locationX);
        setActiveIndex((prev) => {
          if (prev !== index && Platform.OS === 'ios') Haptics.selectionAsync();
          return index;
        });
      },
      onPanResponderRelease: () => setActiveIndex(null),
      onPanResponderTerminate: () => setActiveIndex(null),
    });
  }, [getIndexFromX]);

  return (
    <View style={chartStyles.patternsChartSection}>
      <View style={chartStyles.patternsHeader}>
        <Text style={chartStyles.patternsTitle}>30-Day Patterns</Text>
      </View>
      <View style={chartStyles.chartLegendRow}>
        {activeIndex === null ? (
          <>
            {(Object.keys(CHART_METRIC_COLORS) as ChartMetricType[]).map((metric) => (
              <TouchableOpacity
                key={metric}
                style={[chartStyles.chartLegendItem, !activeMetrics.has(metric) && chartStyles.chartLegendItemInactive]}
                onPress={() => { if (Platform.OS === 'ios') Haptics.selectionAsync(); onToggleMetric(metric); }}
                activeOpacity={0.7}
              >
                <View style={[chartStyles.chartLegendDot, { backgroundColor: activeMetrics.has(metric) ? CHART_METRIC_COLORS[metric].primary : '#D1D5DB' }]} />
                <Text style={[chartStyles.chartLegendText, { color: activeMetrics.has(metric) ? '#374151' : '#9CA3AF' }]}>
                  {CHART_METRIC_COLORS[metric].name}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        ) : (
          <View style={chartStyles.chartScrubbingContent}>
            <Text style={chartStyles.chartScrubbingDate}>{selectedDateStr}</Text>
            <View style={chartStyles.chartScrubbingValues}>
              {activeMetrics.has('sleep') && (
                <Text style={chartStyles.chartScrubbingValueText}>
                  <Text style={{ color: CHART_METRIC_COLORS.sleep.primary, fontWeight: '600' }}>{data.sleep[activeIndex].toFixed(1)}</Text>
                  <Text style={{ color: '#9CA3AF' }}> hrs</Text>
                </Text>
              )}
              {activeMetrics.has('energy') && (
                <Text style={chartStyles.chartScrubbingValueText}>
                  <Text style={{ color: CHART_METRIC_COLORS.energy.primary, fontWeight: '600' }}>{data.energy[activeIndex].toFixed(1)}</Text>
                  <Text style={{ color: '#9CA3AF' }}>/10</Text>
                </Text>
              )}
              {activeMetrics.has('nutrition') && (
                <Text style={chartStyles.chartScrubbingValueText}>
                  <Text style={{ color: CHART_METRIC_COLORS.nutrition.primary, fontWeight: '600' }}>{data.nutrition[activeIndex].toFixed(1)}</Text>
                  <Text style={{ color: '#9CA3AF' }}>/10</Text>
                </Text>
              )}
            </View>
          </View>
        )}
      </View>
      <View style={chartStyles.chartContainer} {...panResponder.panHandlers}>
        <Svg width={chartWidth} height={chartHeight}>
          {[10, 5, 1].map((value) => {
            const normalized = (value - scale.min) / (scale.max - scale.min);
            const y = padding.top + plotHeight * (1 - normalized);
            return <Line key={value} x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke="#D1D5DB" strokeWidth="1" strokeDasharray="2,6" opacity={0.5} />;
          })}
          {[10, 5, 1].map((value) => {
            const normalized = (value - scale.min) / (scale.max - scale.min);
            const y = padding.top + plotHeight * (1 - normalized) + 4;
            return <SvgText key={value} x={padding.left - 8} y={y} fontSize="10" fill="#9CA3AF" textAnchor="end">{value}</SvgText>;
          })}
          {activeMetrics.has('sleep') && <Path d={generatePath(data.sleep)} stroke={CHART_METRIC_COLORS.sleep.primary} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
          {activeMetrics.has('nutrition') && <Path d={generatePath(data.nutrition)} stroke={CHART_METRIC_COLORS.nutrition.primary} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
          {activeMetrics.has('energy') && <Path d={generatePath(data.energy)} stroke={CHART_METRIC_COLORS.energy.primary} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
          {activeIndex !== null && <Line x1={getX(activeIndex)} y1={padding.top} x2={getX(activeIndex)} y2={padding.top + plotHeight} stroke="rgba(0, 0, 0, 0.12)" strokeWidth={1.5} />}
          {activeIndex !== null && activeMetrics.has('sleep') && <Circle cx={getX(activeIndex)} cy={getY(data.sleep[activeIndex])} r={5} fill={CHART_METRIC_COLORS.sleep.primary} stroke="#FFFFFF" strokeWidth={2} />}
          {activeIndex !== null && activeMetrics.has('nutrition') && <Circle cx={getX(activeIndex)} cy={getY(data.nutrition[activeIndex])} r={5} fill={CHART_METRIC_COLORS.nutrition.primary} stroke="#FFFFFF" strokeWidth={2} />}
          {activeIndex !== null && activeMetrics.has('energy') && <Circle cx={getX(activeIndex)} cy={getY(data.energy[activeIndex])} r={5} fill={CHART_METRIC_COLORS.energy.primary} stroke="#FFFFFF" strokeWidth={2} />}
          <SvgText x={padding.left} y={chartHeight - 8} fontSize="10" fill="#C9CDD3" textAnchor="start" fontWeight="500">30d ago</SvgText>
          <SvgText x={chartWidth - padding.right} y={chartHeight - 8} fontSize="10" fill="#C9CDD3" textAnchor="end" fontWeight="500">Today</SvgText>
        </Svg>
      </View>
      <Text style={chartStyles.chartHint}>Tap metrics to show/hide</Text>
    </View>
  );
};

// ---- Styles (copied 1:1 from BodyCheckInReviewScreen) ----
const styles = StyleSheet.create({
  // Section Card
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionIconRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    padding: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionIconInner: {
    width: 43,
    height: 43,
    borderRadius: 21.5,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  sectionContent: {
    gap: 0,
  },

  // Slider Rating Bar
  sliderRatingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB60',
  },
  sliderRatingRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 2,
  },
  sliderRatingIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sliderRatingContent: {
    flex: 1,
    gap: 6,
  },
  sliderRatingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderRatingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  sliderRatingValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  sliderRatingProgressBg: {
    height: 5,
    backgroundColor: '#E5E7EB',
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  sliderRatingProgressFill: {
    height: '100%',
    borderRadius: 2.5,
  },

  // Metric Row
  metricRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB60',
  },
  metricRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 2,
  },
  metricIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  metricContent: {
    flex: 1,
    gap: 6,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  metricProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricProgressBg: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  metricProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  metricTrend: {
    fontSize: 11,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'right',
  },

  // Single Choice Section
  singleChoiceSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  singleChoiceSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
  },
  singleChoiceSelectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  singleChoiceSelectedIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  singleChoiceSelectedContent: {
    flex: 1,
  },
  singleChoiceSelectedLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 1,
  },
  singleChoiceSelectedDescription: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 16,
  },

  // Health Notes Section
  healthNotesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  healthNotesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  healthNotesTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.1,
  },
  healthNotesText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#374151',
    lineHeight: 20,
  },

  // What Helped Section
  whatHelpedSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  whatHelpedTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  whatHelpedCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  whatHelpedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    gap: 8,
  },
  whatHelpedCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  whatHelpedCardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },

  // Ratings Section Title
  ratingsSectionContainer: {
    paddingBottom: 0,
    marginBottom: 0,
  },
  ratingsSectionBorder: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  ratingsSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },

  // Photo + Weight
  summaryTopSection: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 0,
  },
  photoPreview: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  photoPreviewImage: {
    width: '100%',
    height: '100%',
  },
  photoExpandIcon: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bodyMetricCard: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    height: 140,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyMetricLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  bodyMetricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  bodyMetricValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
  },
  bodyMetricUnit: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  bodyMetricChange: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
    marginTop: 6,
  },
  bodyMetricChangeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  bodyMetricCardOtherStats: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    height: 140,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  bodyMetricLabelOtherStats: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  bodyStatsTextField: {
    width: '100%',
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  bodyStatsTextFieldContent: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexGrow: 1,
  },
  bodyStatsTextFieldText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 18,
  },
});

// Chart styles (separate to avoid name collisions)
const chartStyles = StyleSheet.create({
  patternsChartSection: {
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  patternsHeader: {
    marginBottom: 12,
  },
  patternsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  chartLegendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    minHeight: 36,
  },
  chartLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  chartLegendItemInactive: {
    opacity: 0.6,
  },
  chartLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  chartLegendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chartContainer: {
    alignItems: 'center',
  },
  chartHint: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  chartScrubbingContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartScrubbingDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  chartScrubbingValues: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  chartScrubbingValueText: {
    fontSize: 13,
  },
});
