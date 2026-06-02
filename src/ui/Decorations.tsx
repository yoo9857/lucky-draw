/**
 * Decorations — 드리미 배경 장식(떠다니는 클로버·버블·반짝임).
 * rank.png 톤. 게임화면/랭킹 공용. pointerEvents none 으로 터치 방해 없음.
 *
 * 일부 요소는 위아래로 천천히 떠다니는 애니메이션(useNativeDriver)으로 생동감.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet, Dimensions, type DimensionValue } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');

interface Item {
  emoji?: string;
  bubble?: number; // 지름(px)
  left: DimensionValue;
  top: DimensionValue;
  size?: number;
  opacity?: number;
  float?: number; // 떠다니는 진폭(px). 0이면 정적
  delay?: number;
}

const DEFAULT_ITEMS: Item[] = [
  { emoji: '🍀', left: '4%', top: '8%', size: 24, opacity: 0.85, float: 8, delay: 0 },
  { emoji: '🍀', left: '86%', top: '14%', size: 30, opacity: 0.8, float: 10, delay: 600 },
  { emoji: '🍀', left: '8%', top: '52%', size: 18, opacity: 0.7, float: 6, delay: 300 },
  { emoji: '✨', left: '78%', top: '30%', size: 16, opacity: 0.9, float: 0 },
  { emoji: '✨', left: '18%', top: '34%', size: 13, opacity: 0.8, float: 0 },
  { emoji: '🫧', left: '70%', top: '60%', size: 22, opacity: 0.5, float: 12, delay: 200 },
  { bubble: 64, left: '76%', top: '10%', opacity: 0.35, float: 14, delay: 400 },
  { bubble: 36, left: '6%', top: '26%', opacity: 0.3, float: 10, delay: 100 },
  { bubble: 84, left: '-4%', top: '78%', opacity: 0.28, float: 16, delay: 500 },
];

function FloatItem({ item }: { item: Item }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!item.float) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 2200, delay: item.delay ?? 0, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 2200, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [0, -(item.float ?? 0)] });

  const base = { position: 'absolute' as const, left: item.left, top: item.top, opacity: item.opacity ?? 1 };
  const content = item.bubble != null ? (
    <View style={[styles.bubble, { width: item.bubble, height: item.bubble, borderRadius: item.bubble / 2 }]} />
  ) : (
    <Text style={{ fontSize: item.size ?? 20 }}>{item.emoji}</Text>
  );

  if (!item.float) return <View pointerEvents="none" style={base}>{content}</View>;
  return <Animated.View pointerEvents="none" style={[base, { transform: [{ translateY }] }]}>{content}</Animated.View>;
}

export function Decorations({ items = DEFAULT_ITEMS }: { items?: Item[] }) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { width: W, height: H }]}>
      {items.map((it, i) => <FloatItem key={i} item={it} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: { backgroundColor: 'rgba(255,255,255,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' },
});
