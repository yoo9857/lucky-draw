/**
 * ErrorBoundary — 렌더 중 예외를 잡아 앱이 흰 화면으로 죽지 않게 한다.
 *
 * 20년차 원칙: 사용자에게는 친절한 폴백 + 복구 수단을, 개발자에게는 로그를.
 * (운영 전환 시 componentDidCatch 에서 원격 로깅/Sentry 연동)
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  children: React.ReactNode;
}
interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // 콘솔/원격 로깅 지점. 사용자 데이터·토큰은 남기지 않는다.
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error.message, info.componentStack);
  }

  private reset = (): void => this.setState({ error: null });

  render(): React.ReactNode {
    const { error } = this.state;
    if (error) {
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>🍀</Text>
          <Text style={styles.title}>잠시 문제가 생겼어요</Text>
          <Text style={styles.desc}>다시 시도하면 대부분 해결돼요.</Text>
          <TouchableOpacity style={styles.button} onPress={this.reset} activeOpacity={0.85}>
            <Text style={styles.buttonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#EEE7FF' },
  emoji: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '800', color: '#2A2150', marginBottom: 6 },
  desc: { fontSize: 14, color: '#7C76A8', marginBottom: 24, textAlign: 'center' },
  button: { backgroundColor: '#7C5CFF', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
