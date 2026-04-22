import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withRepeat, 
  withTiming, 
  interpolate,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CENTERPIECE_SIZE = SCREEN_WIDTH * 1.5;

export function ThreeDimensionalCenterpiece() {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  
  // Base floating animation
  const floatValue = useSharedValue(0);

  React.useEffect(() => {
    floatValue.value = withRepeat(
      withTiming(1, { duration: 6000 }),
      -1,
      true
    );
  }, []);

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX * 0.15;
      translateY.value = event.translationY * 0.15;
    })
    .onEnd(() => {
      translateX.value = withSpring(0, { damping: 15 });
      translateY.value = withSpring(0, { damping: 15 });
    });

  const animatedStyle = useAnimatedStyle(() => {
    const float = interpolate(floatValue.value, [0, 1], [-30, 30]);
    
    return {
      transform: [
        { translateY: float + translateY.value },
        { translateX: translateX.value },
        { perspective: 1200 },
        { rotateX: `${-translateY.value * 0.3}deg` },
        { rotateY: `${translateX.value * 0.3}deg` },
        { scale: interpolate(floatValue.value, [0, 1], [0.95, 1.05]) },
      ],
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(floatValue.value, [0, 1], [0.15, 0.4]),
      transform: [
        { scale: interpolate(floatValue.value, [0, 1], [1, 1.3]) },
        { translateX: translateX.value * 0.5 },
        { translateY: translateY.value * 0.5 },
      ],
    };
  });

  return (
    <View style={styles.container} pointerEvents="none">
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.imageWrapper, animatedStyle]}>
          <Image
            source={require('../assets/images/3d-centerpiece.png')}
            style={styles.image}
            contentFit="cover"
            priority="high"
          />
        </Animated.View>
      </GestureDetector>
      
      {/* Subtle bottom vignette to ensure legibility of bottom elements */}
      <LinearGradient
        colors={['transparent', Colors.dark.background]}
        style={styles.vignette}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: Colors.dark.background,
  },
  imageWrapper: {
    width: SCREEN_WIDTH * 1.8,
    height: SCREEN_WIDTH * 1.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  vignette: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.4,
  },
});
