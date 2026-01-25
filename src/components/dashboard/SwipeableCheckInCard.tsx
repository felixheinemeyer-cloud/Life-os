import React, { useRef, useCallback, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DISMISS_THRESHOLD = -100;

interface SwipeableCheckInCardProps {
  children: ReactNode;
  onDismiss: () => void;
  cardHeight: number;
  marginBottom?: number;
}

const SwipeableCheckInCard: React.FC<SwipeableCheckInCardProps> = ({
  children,
  onDismiss,
  cardHeight,
  marginBottom = 12,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const itemOpacity = useRef(new Animated.Value(1)).current;
  const itemHeight = useRef(new Animated.Value(cardHeight + marginBottom)).current;
  const isDismissing = useRef(false);

  const handleDismiss = useCallback(() => {
    if (isDismissing.current) return;
    isDismissing.current = true;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: -SCREEN_WIDTH,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(itemOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(itemHeight, {
        toValue: 0,
        duration: 200,
        delay: 100,
        useNativeDriver: false,
      }),
    ]).start(() => {
      onDismiss();
    });
  }, [onDismiss, translateX, itemOpacity, itemHeight]);

  const springBack = useCallback(() => {
    Animated.spring(translateX, {
      toValue: 0,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
  }, [translateX]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
        const isLeftSwipe = gestureState.dx < -10;
        const isNotVertical = Math.abs(gestureState.dy) < 15;
        return isHorizontalSwipe && isLeftSwipe && isNotVertical;
      },
      onPanResponderGrant: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < DISMISS_THRESHOLD) {
          handleDismiss();
        } else {
          springBack();
        }
      },
      onPanResponderTerminate: () => {
        springBack();
      },
      onPanResponderTerminationRequest: (_, gestureState) => {
        return gestureState.dx > -50;
      },
    })
  ).current;

  const dismissOpacity = translateX.interpolate({
    inputRange: [-100, -40, 0],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: itemOpacity,
          height: itemHeight,
        },
      ]}
    >
      {/* Dismiss action behind the card */}
      <Animated.View
        style={[
          styles.dismissAction,
          {
            opacity: dismissOpacity,
            height: cardHeight,
          }
        ]}
      >
        <Ionicons name="close" size={22} color="#FFFFFF" />
        <Text style={styles.dismissActionText}>Dismiss</Text>
      </Animated.View>

      {/* Swipeable card wrapper */}
      <Animated.View
        style={[
          styles.cardWrapper,
          {
            transform: [{ translateX }],
            height: cardHeight,
          }
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.childrenWrapper}>
          {children}
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  dismissAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 88,
    backgroundColor: '#EF4444',
    borderRadius: 20,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dismissActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  cardWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'column',
  },
  childrenWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
});

export default SwipeableCheckInCard;
