import React, { type PropsWithChildren } from 'react';
import { Granite, type InitialProps } from '@granite-js/react-native';
import { context } from '../require.context';
import { ErrorBoundary } from './ui/ErrorBoundary';

function AppContainer({ children }: PropsWithChildren<InitialProps>) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

export default Granite.registerApp(AppContainer, {
  appName: 'lucky-draw',
  context,
});
