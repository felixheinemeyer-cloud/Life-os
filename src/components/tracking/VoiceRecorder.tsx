import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

interface VoiceRecorderProps {
  onRecordingComplete?: (uri: string, duration: number) => void;
  onRecordingDelete?: () => void;
}

type RecorderState = 'idle' | 'recording' | 'recorded';

const NUM_BARS = 7;

const BAR_CONFIGS = [
  { min: 0.2, max: 0.65, duration: 420 },
  { min: 0.3, max: 0.9, duration: 520 },
  { min: 0.15, max: 1.0, duration: 360 },
  { min: 0.35, max: 0.85, duration: 480 },
  { min: 0.2, max: 0.95, duration: 340 },
  { min: 0.3, max: 0.7, duration: 500 },
  { min: 0.2, max: 0.8, duration: 400 },
];

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  onRecordingDelete,
}) => {
  const [recorderState, setRecorderState] = useState<RecorderState>('idle');
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const recordingUriRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordedDurationRef = useRef(0);

  // Animations
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.4)).current;
  const barAnims = useRef(
    Array.from({ length: NUM_BARS }, () => new Animated.Value(0.3))
  ).current;
  const contentFade = useRef(new Animated.Value(1)).current;
  const playbackProgress = useRef(new Animated.Value(0)).current;
  const playbackAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      soundRef.current?.unloadAsync().catch(() => {});
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  // Recording animations
  useEffect(() => {
    if (recorderState === 'recording') {
      // Pulse ripple
      pulseScale.setValue(1);
      pulseOpacity.setValue(0.35);

      const pulse = Animated.loop(
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: 1.6,
            duration: 1500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0,
            duration: 1500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      // Waveform bar animations
      const barLoops = barAnims.map((anim, i) => {
        const config = BAR_CONFIGS[i];
        anim.setValue(config.min);
        return Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: config.max,
              duration: config.duration,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: config.min,
              duration: config.duration + 80,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ])
        );
      });
      barLoops.forEach((l) => l.start());

      return () => {
        pulse.stop();
        barLoops.forEach((l) => l.stop());
        pulseScale.setValue(1);
        pulseOpacity.setValue(0.4);
        barAnims.forEach((a) => a.setValue(0.3));
      };
    }
  }, [recorderState, pulseScale, pulseOpacity, barAnims]);

  // Fade transition between states
  const transitionTo = useCallback(
    (newState: RecorderState) => {
      Animated.timing(contentFade, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }).start(() => {
        setRecorderState(newState);
        Animated.timing(contentFade, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    },
    [contentFade]
  );

  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert(
          'Microphone Access',
          'Please allow microphone access in Settings to record voice memos.',
          [{ text: 'OK' }]
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setDuration(0);
      transitionTo('recording');

      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Could not start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recordingRef.current) return;

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = recordingRef.current.getURI();
      recordingUriRef.current = uri;
      recordedDurationRef.current = duration;
      recordingRef.current = null;

      transitionTo('recorded');

      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      if (uri) {
        onRecordingComplete?.(uri, duration);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const startProgressAnimation = (fromProgress: number, totalDurationMs: number) => {
    playbackAnimRef.current?.stop();
    const remainingMs = totalDurationMs * (1 - fromProgress);
    playbackAnimRef.current = Animated.timing(playbackProgress, {
      toValue: 1,
      duration: remainingMs,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    playbackAnimRef.current.start(({ finished }) => {
      if (finished) {
        setIsPlaying(false);
        playbackProgress.setValue(0);
      }
    });
  };

  const playRecording = async () => {
    try {
      if (!recordingUriRef.current) return;

      // Toggle pause
      if (isPlaying && soundRef.current) {
        playbackAnimRef.current?.stop();
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
        return;
      }

      // Resume if paused mid-playback
      if (soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          const atEnd =
            status.durationMillis != null &&
            status.positionMillis >= status.durationMillis - 50;

          if (atEnd) {
            // Finished — replay from start
            await soundRef.current.setPositionAsync(0);
            await soundRef.current.playAsync();
            setIsPlaying(true);
            playbackProgress.setValue(0);
            startProgressAnimation(0, status.durationMillis || 0);
            return;
          }

          if (status.positionMillis > 0) {
            // Paused mid-way — resume
            await soundRef.current.playAsync();
            setIsPlaying(true);
            const currentProgress = status.durationMillis
              ? status.positionMillis / status.durationMillis
              : 0;
            startProgressAnimation(currentProgress, status.durationMillis || 0);
            return;
          }
        }
        await soundRef.current.unloadAsync();
      }

      // Play from start
      playbackProgress.setValue(0);
      const { sound } = await Audio.Sound.createAsync(
        { uri: recordingUriRef.current },
        { shouldPlay: true, progressUpdateIntervalMillis: 500 },
        (status) => {
          if (status.isLoaded && status.didJustFinish) {
            playbackAnimRef.current?.stop();
            setIsPlaying(false);
            playbackProgress.setValue(0);
          }
        }
      );

      soundRef.current = sound;
      setIsPlaying(true);

      // Get actual duration and kick off one smooth animation
      const status = await sound.getStatusAsync();
      if (status.isLoaded && status.durationMillis) {
        startProgressAnimation(0, status.durationMillis);
      }

      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('Failed to play recording:', error);
    }
  };

  const reRecord = async () => {
    playbackAnimRef.current?.stop();
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }

    setIsPlaying(false);
    playbackProgress.setValue(0);
    setDuration(0);
    recordingUriRef.current = null;
    recordedDurationRef.current = 0;
    transitionTo('idle');
    onRecordingDelete?.();

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // ─── IDLE STATE ─────────────────────────────────────────────
  const renderIdle = () => (
    <TouchableOpacity
      onPress={startRecording}
      activeOpacity={0.8}
      style={styles.stateContainer}
    >
      <View style={styles.mainButtonTouchable}>
        <LinearGradient
          colors={['#A78BFA', '#8B5CF6', '#7C3AED']}
          style={styles.gradientRing}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.innerCircle}>
            <Ionicons name="mic" size={32} color="#7C3AED" />
          </View>
        </LinearGradient>
      </View>

      <Text style={styles.titleText}>Tap to record</Text>
      <Text style={styles.subtitleText}>Share your thoughts out loud</Text>
    </TouchableOpacity>
  );

  // ─── RECORDING STATE ───────────────────────────────────────
  const renderRecording = () => (
    <View style={styles.stateContainer}>
      <TouchableOpacity
        onPress={stopRecording}
        activeOpacity={0.8}
        style={styles.mainButtonTouchable}
      >
        {/* Pulse ripple */}
        <Animated.View
          style={[
            styles.pulseRing,
            {
              transform: [{ scale: pulseScale }],
              opacity: pulseOpacity,
            },
          ]}
        />
        <LinearGradient
          colors={['#FCA5A5', '#EF4444', '#DC2626']}
          style={styles.gradientRing}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.innerCircle}>
            <View style={styles.stopIcon} />
          </View>
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.recordingIndicator}>
        <View style={styles.recordingDot} />
        <Text style={styles.recordingLabel}>Recording</Text>
      </View>

      <Text style={styles.timerText}>{formatTime(duration)}</Text>

      {/* Waveform bars */}
      <View style={styles.waveformContainer}>
        {barAnims.map((anim, i) => (
          <Animated.View
            key={i}
            style={[
              styles.waveformBar,
              { transform: [{ scaleY: anim }] },
            ]}
          />
        ))}
      </View>
    </View>
  );

  // ─── RECORDED STATE ────────────────────────────────────────
  const renderRecorded = () => (
    <View style={styles.stateContainer}>
      <TouchableOpacity
        onPress={playRecording}
        activeOpacity={0.8}
        style={styles.mainButtonTouchable}
      >
        <LinearGradient
          colors={['#A78BFA', '#8B5CF6', '#7C3AED']}
          style={styles.gradientRing}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.innerCircle}>
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={30}
              color="#7C3AED"
              style={!isPlaying ? { marginLeft: 3 } : undefined}
            />
          </View>
        </LinearGradient>
      </TouchableOpacity>

      <Text style={styles.titleText}>Voice memo saved</Text>
      <Text style={styles.durationText}>
        {formatTime(recordedDurationRef.current)}
      </Text>

      {/* Playback progress bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBg}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: playbackProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </View>

      {/* Re-record button */}
      <TouchableOpacity
        onPress={reRecord}
        style={styles.reRecordButton}
        activeOpacity={0.7}
      >
        <Ionicons name="refresh" size={16} color="#6B7280" />
        <Text style={styles.reRecordText}>Re-record</Text>
      </TouchableOpacity>
    </View>
  );

  const renderState = () => {
    switch (recorderState) {
      case 'idle':
        return renderIdle();
      case 'recording':
        return renderRecording();
      case 'recorded':
        return renderRecorded();
    }
  };

  return (
    <View style={styles.card}>
      <Animated.View style={{ opacity: contentFade }}>
        {renderState()}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  stateContainer: {
    alignItems: 'center',
  },

  // Main button
  mainButtonTouchable: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  innerCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Pulse animation
  pulseRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
  },

  // Stop icon (recording state)
  stopIcon: {
    width: 22,
    height: 22,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },

  // Text styles
  titleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  subtitleText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9CA3AF',
    letterSpacing: -0.2,
  },

  // Recording indicator
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  recordingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
    letterSpacing: -0.2,
  },

  // Timer
  timerText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },

  // Waveform
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    gap: 5,
    marginTop: 20,
  },
  waveformBar: {
    width: 4,
    height: 32,
    borderRadius: 2,
    backgroundColor: '#EF4444',
  },

  // Recorded state
  durationText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
    letterSpacing: -0.2,
    marginBottom: 16,
  },

  // Progress bar
  progressBarContainer: {
    width: '80%',
    marginBottom: 20,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 2,
  },

  // Re-record button
  reRecordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  reRecordText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    letterSpacing: -0.2,
  },
});

export default VoiceRecorder;
