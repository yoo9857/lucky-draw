/**
 * Confetti — 네이티브 의존성 없는 가벼운 컨페티 (RN Animated).
 * `burst`(숫자)가 바뀔 때마다 `count`개 조각을 위에서 흩뿌린다.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View, Easing } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');
const COLORS = ['#7C5CFF', '#FF7AD9', '#7DE3D0', '#FFD56B', '#A78BFA', '#5BE0C0'];

interface Props {
  burst: number; // 값이 바뀌면 발사
  count?: number;
}

export function Confetti({ burst, count = 80 }: Props) {
  const pieces = useRef(
    Array.from({ length: count }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      rot: new Animated.Value(0),
      opacity: new Animated.Value(0),
      color: COLORS[Math.floor((COLORS.length) * ((Math.sin(Math.random() * 1000) + 1) / 2))] ?? COLORS[0]!,
      size: 6 + Math.floor(Math.random() * 6),
      dx: (Math.random() - 0.5) * W,
      dur: 1400 + Math.random() * 900,
    })),
  ).current;

  useEffect(() => {
    if (burst === 0) return;
    const anims = pieces.map((p) => {
      p.x.setValue(0); p.y.setValue(0); p.rot.setValue(0); p.opacity.setValue(1);
      return Animated.parallel([
        Animated.timing(p.y, { toValue: H * 0.9, duration: p.dur, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(p.x, { toValue: p.dx, duration: p.dur, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(p.rot, { toValue: 6, duration: p.dur, useNativeDriver: true }),
        Animated.timing(p.opacity, { toValue: 0, duration: p.dur, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]);
    });
    Animated.stagger(8, anims).start();
  }, [burst]);

  if (burst === 0) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: W / 2,
            top: H * 0.28,
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            borderRadius: 2,
            opacity: p.opacity,
            transform: [
              { translateX: p.x },
              { translateY: p.y },
              { rotate: p.rot.interpolate({ inputRange: [0, 6], outputRange: ['0deg', '1080deg'] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}
