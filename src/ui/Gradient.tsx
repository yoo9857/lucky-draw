/**
 * LinearGradientLite — 네이티브 의존성 없는 그라데이션.
 *
 * react-native-linear-gradient 같은 네이티브 모듈을 추가하면 .ait 빌드가
 * 복잡해질 수 있어, 얇은 색 밴드(View)를 여러 장 깔아 그라데이션을 흉내낸다.
 * 배경/버튼 등 어디든 쓸 수 있고 빌드는 그대로 유지된다.
 */

import React from 'react';
import { View, Dimensions, type ViewStyle, type StyleProp } from 'react-native';

type RGB = [number, number, number];

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function colorAt(stops: RGB[], t: number): string {
  if (stops.length === 1) {
    const s = stops[0]!;
    return `rgb(${s[0]},${s[1]},${s[2]})`;
  }
  const seg = (stops.length - 1) * t;
  const i = Math.min(stops.length - 2, Math.floor(seg));
  const f = seg - i;
  const a = stops[i]!;
  const b = stops[i + 1]!;
  return `rgb(${lerp(a[0], b[0], f)},${lerp(a[1], b[1], f)},${lerp(a[2], b[2], f)})`;
}

interface Props {
  colors: string[];
  horizontal?: boolean;
  bands?: number;
  /** 밴드가 채울 영역 크기(px). 기본은 화면 크기. */
  width?: number;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function LinearGradientLite({
  colors,
  horizontal = false,
  bands = 48,
  width,
  height,
  borderRadius = 0,
  style,
  children,
}: Props) {
  const stops = colors.map(hexToRgb);
  const W = width ?? SCREEN_W;
  const H = height ?? SCREEN_H;
  const span = horizontal ? W : H;
  const bandSize = span / bands;

  return (
    <View style={[{ overflow: 'hidden', borderRadius }, style]}>
      {Array.from({ length: bands }).map((_, i) => {
        const t = bands === 1 ? 0 : i / (bands - 1);
        const pos = i * bandSize;
        const band: ViewStyle = horizontal
          ? { position: 'absolute', left: pos, width: bandSize + 1, top: 0, bottom: 0 }
          : { position: 'absolute', top: pos, height: bandSize + 1, left: 0, right: 0 };
        return (
          <View key={i} style={[band, { backgroundColor: colorAt(stops, t) }]} />
        );
      })}
      {children}
    </View>
  );
}

/** 파스텔 브랜드 팔레트 (play.html 과 동일 톤) */
export const PALETTE = {
  bg: ['#EEE7FF', '#FFE9FB', '#E4FBF4'],
  button: ['#7C5CFF', '#B95CFF', '#FF7AD9'],
  brand: '#7C5CFF',
  ink: '#2A2150',
  muted: '#7C76A8',
};
