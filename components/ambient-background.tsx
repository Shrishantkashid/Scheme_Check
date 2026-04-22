import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, withDelay, interpolate, Extrapolation } from 'react-native-reanimated';

import { Colors } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function AmbientBackground() {
  return (
    <View style={styles.container}>
      <LuminousBlob 
        color={Colors.premium.primary} 
        size={SCREEN_WIDTH * 1.2} 
        initialX={-SCREEN_WIDTH * 0.2} 
        initialY={-SCREEN_HEIGHT * 0.1}
        duration={8000}
      />
      <LuminousBlob 
        color={Colors.premium.secondary} 
        size={SCREEN_WIDTH * 1.5} 
        initialX={SCREEN_WIDTH * 0.3} 
        initialY={SCREEN_HEIGHT * 0.4}
        duration={12000}
        delay={1000}
      />
      <LuminousBlob 
        color={Colors.premium.accent} 
        size={SCREEN_WIDTH * 1.0} 
        initialX={-SCREEN_WIDTH * 0.3} 
        initialY={SCREEN_HEIGHT * 0.7}
        duration={10000}
        delay={2000}
      />
      
      {/* Dark overlay to ensure contrast */}
      <View style={styles.overlay} />
    </View>
  );
}

function LuminousBlob({ color, size, initialX, initialY, duration, delay = 0 }: any) {
  const movement = useSharedValue(0);

  useEffect(() => {
    movement.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration }),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      movement.value,
      [0, 1],
      [initialX, initialX + 50],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      movement.value,
      [0, 1],
      [initialY, initialY - 50],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      movement.value,
      [0, 1],
      [1, 1.2],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      movement.value,
      [0, 1],
      [0.05, 0.12],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ translateX }, { translateY }, { scale }],
      opacity,
    };
  });

  return (
    <Animated.View 
      style={[
        styles.blob, 
        { 
          width: size, 
          height: size, 
          borderRadius: size / 2, 
          backgroundColor: color 
        }, 
        animatedStyle
      ]} 
    />
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.dark.background,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    // Use blur for soft edges if possible, otherwise rely on low opacity
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.6)', // nocturnal base with transparency
  },
});
