import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { View, Animated, StyleSheet, Dimensions, Text } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

const { width, height } = Dimensions.get('window');

export interface CelebrationOverlayRef {
  triggerConfetti: () => void;
  triggerFire: () => void;
  triggerPoop: () => void;
}

export const CelebrationOverlay = forwardRef<CelebrationOverlayRef, {}>((props, ref) => {
  const [confettiKey, setConfettiKey] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const [fireAnimation, setFireAnimation] = useState({
    visible: false,
    flames: [] as any[],
  });

  const [poopAnimation, setPoopAnimation] = useState({
    visible: false,
    poops: [] as any[],
  });

  useImperativeHandle(ref, () => ({
    triggerConfetti: () => {
      setConfettiKey(prev => prev + 1);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    },
    triggerFire: () => {
      const flames = Array.from({ length: 8 }, (_, i) => {
        const translateY = new Animated.Value(height);
        Animated.timing(translateY, {
          toValue: -100,
          duration: 2000 + Math.random() * 1000,
          useNativeDriver: true,
        }).start();

        return {
          id: `fire-${i}-${Date.now()}`,
          x: Math.random() * (width - 60) + 30,
          translateY,
          scale: Math.random() * 1 + 1,
        };
      });

      setFireAnimation({ visible: true, flames });
      setTimeout(() => setFireAnimation({ visible: false, flames: [] }), 3500);
    },
    triggerPoop: () => {
      const poops = Array.from({ length: 8 }, (_, i) => {
        const startY = -100;
        const targetY = height + 100;
        const translateY = new Animated.Value(startY);

        Animated.timing(translateY, {
          toValue: targetY,
          duration: 2000 + Math.random() * 1500,
          useNativeDriver: true,
        }).start();

        return {
          id: `poop-${i}-${Date.now()}`,
          x: Math.random() * (width - 60) + 30,
          translateY,
          rotation: Math.random() * 360,
          scale: Math.random() * 0.5 + 0.5,
        };
      });

      setPoopAnimation({ visible: true, poops });
      setTimeout(() => setPoopAnimation({ visible: false, poops: [] }), 4000);
    }
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      {showConfetti && (
        <ConfettiCannon
          key={confettiKey}
          count={200}
          origin={{ x: width / 2, y: -20 }}
          autoStart={true}
          fadeOut={true}
        />
      )}

      {fireAnimation.visible && fireAnimation.flames.map((flame) => (
        <Animated.Text
          key={flame.id}
          style={[
            styles.celebrationText,
            {
              left: flame.x,
              transform: [
                { translateY: flame.translateY },
                { scale: flame.scale },
              ],
            }
          ]}
        >
          🔥
        </Animated.Text>
      ))}

      {poopAnimation.visible && poopAnimation.poops.map((poop) => (
        <Animated.Text
          key={poop.id}
          style={[
            styles.celebrationText,
            {
              left: poop.x,
              transform: [
                { translateY: poop.translateY },
                { scale: poop.scale },
                { rotate: `${poop.rotation}deg` },
              ],
            }
          ]}
        >
          💩
        </Animated.Text>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  celebrationText: {
    position: 'absolute',
    fontSize: 40,
  }
});
