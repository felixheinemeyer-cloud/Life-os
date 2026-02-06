import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Animated,
  Easing,
  Platform,
  Alert,
  Modal,
  GestureResponderEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode, Audio, AVPlaybackStatus } from 'expo-av';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

interface VideoRecorderProps {
  onRecordingComplete?: (uri: string, duration: number) => void;
  onRecordingDelete?: () => void;
}

type RecorderState = 'idle' | 'recorded';

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const VideoRecorder: React.FC<VideoRecorderProps> = ({
  onRecordingComplete,
  onRecordingDelete,
}) => {
  const insets = useSafeAreaInsets();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const [recorderState, setRecorderState] = useState<RecorderState>('idle');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playbackProgress = useRef(new Animated.Value(0)).current;
  const playbackAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const [durationMs, setDurationMs] = useState(0);
  const progressBarWidth = useRef(0);

  // Camera state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('front');
  const recordingSecondsRef = useRef(0);
  const recordingCancelledRef = useRef(false);
  const switchingCameraRef = useRef(false);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenVideoRef = useRef<Video>(null);
  const [isFsPlaying, setIsFsPlaying] = useState(false);
  const fsProgress = useRef(new Animated.Value(0)).current;
  const fsAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const [fsDurationMs, setFsDurationMs] = useState(0);
  const [fsPositionMs, setFsPositionMs] = useState(0);
  const fsProgressBarWidth = useRef(0);
  const [fsNaturalAspect, setFsNaturalAspect] = useState(9 / 16);

  const videoRef = useRef<Video>(null);
  const cameraRef = useRef<CameraView>(null);
  const contentFade = useRef(new Animated.Value(1)).current;

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecordingVideo) {
      setRecordingSeconds(0);
      recordingSecondsRef.current = 0;
      interval = setInterval(() => {
        setRecordingSeconds(prev => {
          recordingSecondsRef.current = prev + 1;
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecordingVideo]);

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

  // ─── Camera functions ────────────────────────────────────────

  const openCamera = async () => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert(
          'Camera Access',
          'Please allow camera access in Settings to record video journal entries.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    const { granted: micGranted } = await Audio.requestPermissionsAsync();
    if (!micGranted) {
      Alert.alert(
        'Microphone Access',
        'Please allow microphone access in Settings for video recording.',
        [{ text: 'OK' }]
      );
      return;
    }

    setCameraFacing('front');
    setIsCameraOpen(true);
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const startRecording = async () => {
    if (!cameraRef.current) return;
    recordingCancelledRef.current = false;
    switchingCameraRef.current = false;

    // Only set recording state + haptic on the initial start (not camera-switch restarts)
    if (!isRecordingVideo) {
      setIsRecordingVideo(true);
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }

    try {
      const video = await cameraRef.current.recordAsync({ maxDuration: 60 });

      // If we're switching cameras, restart recording on the new camera
      if (switchingCameraRef.current) {
        switchingCameraRef.current = false;
        // Small delay to let the camera settle after switching
        setTimeout(() => startRecording(), 300);
        return;
      }

      setIsRecordingVideo(false);

      if (video?.uri && !recordingCancelledRef.current) {
        const durationSec = recordingSecondsRef.current;
        setVideoUri(video.uri);
        setVideoDuration(durationSec);
        setIsCameraOpen(false);
        transitionTo('recorded');

        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        onRecordingComplete?.(video.uri, durationSec);
      } else {
        setIsCameraOpen(false);
      }
    } catch (error) {
      // Ignore errors during camera switch (expected when reconfiguring)
      if (switchingCameraRef.current) {
        switchingCameraRef.current = false;
        setTimeout(() => startRecording(), 300);
        return;
      }
      console.error('Failed to record video:', error);
      setIsRecordingVideo(false);
      Alert.alert('Error', 'Could not record video. Please try again.');
    }
  };

  const stopRecording = () => {
    recordingCancelledRef.current = false;
    switchingCameraRef.current = false;
    cameraRef.current?.stopRecording();
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const flipCamera = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (isRecordingVideo) {
      switchingCameraRef.current = true;
      cameraRef.current?.stopRecording();
    }
    setCameraFacing(f => f === 'front' ? 'back' : 'front');
  };

  const cancelCamera = () => {
    if (isRecordingVideo) {
      switchingCameraRef.current = false;
      recordingCancelledRef.current = true;
      cameraRef.current?.stopRecording();
    } else {
      setIsCameraOpen(false);
    }
  };

  // ─── Playback functions ──────────────────────────────────────

  const startProgressAnimation = (fromFraction: number, totalMs: number) => {
    playbackAnimRef.current?.stop();
    const remainingMs = totalMs * (1 - fromFraction);
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

  const togglePlayback = async () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      playbackAnimRef.current?.stop();
      await videoRef.current.pauseAsync();
      setIsPlaying(false);
    } else {
      const status = await videoRef.current.getStatusAsync();
      if (status.isLoaded) {
        const dur = status.durationMillis ?? 0;
        const atEnd = dur > 0 && status.positionMillis >= dur - 50;
        if (atEnd) {
          await videoRef.current.setPositionAsync(0);
          playbackProgress.setValue(0);
          setDurationMs(dur);
          await videoRef.current.playAsync();
          setIsPlaying(true);
          startProgressAnimation(0, dur);
        } else {
          const currentFraction = dur > 0 ? status.positionMillis / dur : 0;
          setDurationMs(dur);
          await videoRef.current.playAsync();
          setIsPlaying(true);
          startProgressAnimation(currentFraction, dur);
        }
      }
    }

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSeek = async (e: GestureResponderEvent) => {
    if (!videoRef.current || progressBarWidth.current === 0 || durationMs === 0) return;
    playbackAnimRef.current?.stop();
    const locationX = e.nativeEvent.locationX;
    const fraction = Math.max(0, Math.min(1, locationX / progressBarWidth.current));
    playbackProgress.setValue(fraction);
    await videoRef.current.setPositionAsync(fraction * durationMs);
    if (isPlaying) {
      startProgressAnimation(fraction, durationMs);
    }
  };

  const reRecord = () => {
    playbackAnimRef.current?.stop();
    setIsPlaying(false);
    playbackProgress.setValue(0);
    setVideoUri(null);
    setVideoDuration(0);
    transitionTo('idle');
    onRecordingDelete?.();

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // ─── Fullscreen functions ─────────────────────────────────────

  const startFsAnimation = (fromFraction: number, totalMs: number) => {
    fsAnimRef.current?.stop();
    const remainingMs = totalMs * (1 - fromFraction);
    fsAnimRef.current = Animated.timing(fsProgress, {
      toValue: 1,
      duration: remainingMs,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    fsAnimRef.current.start(({ finished }) => {
      if (finished) {
        setIsFsPlaying(false);
        fsProgress.setValue(0);
        setFsPositionMs(0);
      }
    });
  };

  const openFullscreen = async () => {
    // Pause inline playback
    playbackAnimRef.current?.stop();
    if (isPlaying && videoRef.current) {
      await videoRef.current.pauseAsync();
      setIsPlaying(false);
    }
    setIsFsPlaying(false);
    fsProgress.setValue(0);
    setFsPositionMs(0);
    setIsFullscreen(true);
  };

  const closeFullscreen = async () => {
    fsAnimRef.current?.stop();
    if (fullscreenVideoRef.current) {
      await fullscreenVideoRef.current.pauseAsync();
    }
    setIsFsPlaying(false);
    setIsFullscreen(false);
  };

  const toggleFsPlayback = async () => {
    if (!fullscreenVideoRef.current) return;
    if (isFsPlaying) {
      fsAnimRef.current?.stop();
      await fullscreenVideoRef.current.pauseAsync();
      setIsFsPlaying(false);
    } else {
      const status = await fullscreenVideoRef.current.getStatusAsync();
      if (status.isLoaded) {
        const dur = status.durationMillis ?? 0;
        const atEnd = dur > 0 && status.positionMillis >= dur - 50;
        if (atEnd) {
          await fullscreenVideoRef.current.setPositionAsync(0);
          fsProgress.setValue(0);
        }
        setFsDurationMs(dur);
        await fullscreenVideoRef.current.playAsync();
        setIsFsPlaying(true);
        const frac = dur > 0 ? (atEnd ? 0 : status.positionMillis / dur) : 0;
        startFsAnimation(frac, dur);
      }
    }
  };

  const handleFsSeek = async (e: GestureResponderEvent) => {
    if (!fullscreenVideoRef.current || fsProgressBarWidth.current === 0 || fsDurationMs === 0) return;
    fsAnimRef.current?.stop();
    const fraction = Math.max(0, Math.min(1, e.nativeEvent.locationX / fsProgressBarWidth.current));
    fsProgress.setValue(fraction);
    const posMs = fraction * fsDurationMs;
    setFsPositionMs(posMs);
    await fullscreenVideoRef.current.setPositionAsync(posMs);
    if (isFsPlaying) {
      startFsAnimation(fraction, fsDurationMs);
    }
  };

  // ─── IDLE STATE ─────────────────────────────────────────────
  const renderIdle = () => (
    <TouchableOpacity
      onPress={openCamera}
      activeOpacity={0.8}
      style={styles.idleContainer}
    >
      <View style={styles.mainButtonArea}>
        <LinearGradient
          colors={['#A78BFA', '#8B5CF6', '#7C3AED']}
          style={styles.gradientRing}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.innerCircle}>
            <Ionicons name="videocam" size={32} color="#7C3AED" />
          </View>
        </LinearGradient>
      </View>

      <Text style={styles.titleText}>Tap to record</Text>
      <Text style={styles.subtitleText}>Capture a moment on video</Text>
    </TouchableOpacity>
  );

  // ─── RECORDED STATE ────────────────────────────────────────
  const renderRecorded = () => (
    <View style={styles.recordedContainer}>
      {/* Video preview with play overlay */}
      <TouchableOpacity
        onPress={togglePlayback}
        activeOpacity={0.95}
        style={styles.videoTouchable}
      >
        <View style={styles.videoPreviewContainer}>
          <Video
            ref={videoRef}
            source={{ uri: videoUri! }}
            style={styles.videoPreview}
            resizeMode={ResizeMode.COVER}
            shouldPlay={false}
            isLooping={false}
            onPlaybackStatusUpdate={(status) => {
              if (status.isLoaded) {
                if (status.durationMillis) {
                  setDurationMs(status.durationMillis);
                }
                if (status.didJustFinish) {
                  playbackAnimRef.current?.stop();
                  setIsPlaying(false);
                  playbackProgress.setValue(0);
                }
              }
            }}
          />

          {/* Play overlay */}
          {!isPlaying && (
            <View style={styles.playOverlay}>
              <View style={styles.playButtonCircle}>
                <Ionicons
                  name="play"
                  size={28}
                  color="#FFFFFF"
                  style={{ marginLeft: 3 }}
                />
              </View>
            </View>
          )}

          {/* Duration badge */}
          <View style={styles.durationBadge}>
            <Ionicons name="time-outline" size={11} color="#FFFFFF" />
            <Text style={styles.durationBadgeText}>
              {formatTime(videoDuration)}
            </Text>
          </View>

          {/* Fullscreen button */}
          <TouchableOpacity
            style={styles.expandButton}
            onPress={openFullscreen}
            activeOpacity={0.7}
          >
            <Ionicons name="expand" size={16} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Seekable progress bar */}
          <View
            style={styles.progressBarContainer}
            onLayout={(e) => { progressBarWidth.current = e.nativeEvent.layout.width; }}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={handleSeek}
            onResponderMove={handleSeek}
          >
            <View style={styles.progressBarTrack}>
              <Animated.View style={[styles.progressBarFill, {
                width: playbackProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              }]} />
            </View>
          </View>
        </View>
      </TouchableOpacity>

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

  return (
    <>
      <View style={styles.cardOuter}>
        <View style={styles.cardInner}>
          <Animated.View style={{ opacity: contentFade }}>
            {recorderState === 'idle' ? renderIdle() : renderRecorded()}
          </Animated.View>
        </View>
      </View>

      {/* Camera Modal */}
      <Modal visible={isCameraOpen} animationType="slide">
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.cameraPreview}
            facing={cameraFacing}
            mode="video"
          />

          {/* Top bar */}
          <View style={[styles.cameraTopBar, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity
              style={styles.cameraCloseBtn}
              onPress={cancelCamera}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {isRecordingVideo ? (
              <View style={styles.timerBadge}>
                <View style={styles.timerDot} />
                <Text style={styles.timerText}>{formatTime(recordingSeconds)}</Text>
              </View>
            ) : (
              <View />
            )}

            <View style={{ width: 40 }} />
          </View>

          {/* Bottom bar */}
          <View style={[styles.cameraBottomBar, { paddingBottom: insets.bottom + 20 }]}>
            {/* Flip camera */}
            <TouchableOpacity
              style={styles.cameraFlipBtn}
              onPress={flipCamera}
              activeOpacity={0.7}
            >
              <Ionicons
                name="camera-reverse"
                size={22}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            {/* Record / Stop button */}
            <TouchableOpacity
              style={styles.recordBtnOuter}
              onPress={isRecordingVideo ? stopRecording : startRecording}
              activeOpacity={0.8}
            >
              <View
                style={isRecordingVideo ? styles.recordBtnStop : styles.recordBtnInner}
              />
            </TouchableOpacity>

            {/* Spacer for symmetry */}
            <View style={{ width: 44 }} />
          </View>
        </View>
      </Modal>

      {/* Fullscreen Video Modal */}
      {videoUri ? (
        <Modal visible={isFullscreen} animationType="fade" statusBarTranslucent>
          <View style={styles.fsContainer}>
            {/* Top bar */}
            <View style={[styles.fsTopBar, { paddingTop: insets.top + 8 }]}>
              <TouchableOpacity
                style={styles.fsButton}
                onPress={closeFullscreen}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Video — sized to natural aspect ratio, aligned to top */}
            <View style={styles.fsVideoArea}>
              <View style={{ width: '100%', aspectRatio: fsNaturalAspect }}>
                <Video
                  ref={fullscreenVideoRef}
                  source={{ uri: videoUri }}
                  style={styles.fsVideo}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay={false}
                  isLooping={false}
                  onReadyForDisplay={(event: { naturalSize: { width: number; height: number } }) => {
                    const { width, height } = event.naturalSize;
                    if (width > 0 && height > 0) {
                      setFsNaturalAspect(width / height);
                    }
                  }}
                  onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
                    if (status.isLoaded) {
                      if (status.durationMillis) {
                        setFsDurationMs(status.durationMillis);
                        setFsPositionMs(status.positionMillis);
                      }
                      if (status.didJustFinish) {
                        fsAnimRef.current?.stop();
                        setIsFsPlaying(false);
                        fsProgress.setValue(0);
                        setFsPositionMs(0);
                      }
                    }
                  }}
                />

                <Pressable onPress={toggleFsPlayback} style={styles.fsTapArea}>
                  {!isFsPlaying && (
                    <View style={styles.fsPlayOverlay}>
                      <View style={styles.fsPlayCircle}>
                        <Ionicons name="play" size={36} color="#FFFFFF" style={{ marginLeft: 4 }} />
                      </View>
                    </View>
                  )}
                </Pressable>
              </View>
            </View>

            {/* Bottom controls */}
            <View style={[styles.fsBottomBar, { paddingBottom: insets.bottom + 16 }]}>
              <LinearGradient
                colors={['transparent', 'rgba(0, 0, 0, 0.7)']}
                style={styles.fsBottomGradient}
                pointerEvents="none"
              />
              <View style={styles.fsControlsRow}>
                <Text style={styles.fsTimeText}>
                  {formatTime(Math.round(fsPositionMs / 1000))}
                </Text>
                <View
                  style={styles.fsProgressContainer}
                  onLayout={(e) => { fsProgressBarWidth.current = e.nativeEvent.layout.width; }}
                  onStartShouldSetResponder={() => true}
                  onMoveShouldSetResponder={() => true}
                  onResponderGrant={handleFsSeek}
                  onResponderMove={handleFsSeek}
                >
                  <View style={styles.fsProgressTrack}>
                    <Animated.View style={[styles.fsProgressFill, {
                      width: fsProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    }]} />
                  </View>
                </View>
                <Text style={styles.fsTimeText}>
                  {formatTime(Math.round(fsDurationMs / 1000))}
                </Text>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  // Two-layer card: outer for shadow, inner for overflow clipping
  cardOuter: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardInner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
  },

  // ─── Idle state ─────────────────────────────────
  idleContainer: {
    alignItems: 'center',
    padding: 32,
  },
  mainButtonArea: {
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

  // ─── Recorded state ────────────────────────────
  recordedContainer: {
    alignItems: 'center',
  },
  videoTouchable: {
    width: '100%',
  },
  videoPreviewContainer: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: '#000',
  },
  videoPreview: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  durationBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },

  // ─── Progress bar ───────────────────────────────
  progressBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 28,
    justifyContent: 'flex-end',
  },
  progressBarTrack: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
  },

  // ─── Re-record button ─────────────────────────
  reRecordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  reRecordText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    letterSpacing: -0.2,
  },

  // ─── Camera modal ──────────────────────────────
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraPreview: {
    flex: 1,
  },
  cameraTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  cameraCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 8,
  },
  timerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  cameraBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 36,
  },
  cameraFlipBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraFlipBtnDisabled: {
    opacity: 0.4,
  },
  recordBtnOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  recordBtnInner: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    backgroundColor: '#EF4444',
  },
  recordBtnStop: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#EF4444',
  },

  // ─── Expand button ──────────────────────────────
  expandButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Fullscreen modal ───────────────────────────
  fsContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  fsTopBar: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  fsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fsVideoArea: {
    flex: 1,
    marginTop: 16,
    justifyContent: 'flex-start',
  },
  fsVideo: {
    width: '100%',
    height: '100%',
  },
  fsTapArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  fsPlayOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fsPlayCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  fsBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  fsBottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 160,
  },
  fsControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fsTimeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    fontVariant: ['tabular-nums' as const],
  },
  fsProgressContainer: {
    flex: 1,
    height: 28,
    justifyContent: 'center',
  },
  fsProgressTrack: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1.5,
  },
  fsProgressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
  },
});

export default VideoRecorder;
