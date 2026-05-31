import { router } from '@granite-js/plugin-router';
import { hermes } from '@granite-js/plugin-hermes';
import { defineConfig } from '@granite-js/react-native/config';

// 참고: `.ait` 빌드(ait build)는 Hermes 바이트코드 컴파일이 필수다.
// Windows 에는 hermes-compiler 의 win64 바이너리가 없으므로, 빌드는
// Linux/macOS(또는 Docker/WSL) 에서 수행한다. 자세한 내용은 BUILD.md 참고.
export default defineConfig({
  appName: 'lucky-draw',
  scheme: 'granite',
  plugins: [router(), hermes()],
});
