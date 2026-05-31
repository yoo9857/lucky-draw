# 빌드 가이드 — `.ait` 만들기

## ⚠️ 핵심: `.ait` 빌드는 Linux/macOS 에서

`ait build`(= 콘솔에 올리는 `.ait` 생성)는 **Hermes 바이트코드(.hbc) 컴파일이 필수**다.
그런데 `hermes-compiler` 패키지는 **linux64 / osx 바이너리만 제공하고 Windows(win64) 바이너리가 없다.**
따라서 **Windows 에서는 `.ait` 빌드가 불가능**하다. (JS 번들링까지는 Windows 에서도 정상 동작)

> 임의의 Windows hermesc.exe 를 받아 쓰는 건 **금물**이다. Hermes 바이트코드(HBC) 버전이
> 토스 앱 런타임과 어긋나면 앱이 로드 단계에서 크래시한다. node_modules 에 들어있는
> linux64 hermesc 와 같은 버전으로 빌드해야 호환이 보장된다.

검증 완료 항목 (Windows 에서 확인):
- ✅ `npm run typecheck` — 0 errors
- ✅ `npm test` — 13/13 통과
- ✅ JS 번들링 — android/ios 각 1237/1236 모듈, 0 errors

남은 단계는 **Hermes 컴파일 + 패키징 = `.ait`** 뿐이며, 아래 중 하나로 수행한다.

---

## 방법 A — Docker (Windows 에서 가장 간단)

Docker Desktop 이 실행 중이면, 프로젝트 루트에서:

```powershell
docker run --rm -v "${PWD}:/app" -w /app node:22-bookworm bash -c "npm ci && npx ait build"
```

- 컨테이너(리눅스) 안에서는 linux64 hermesc 가 동작하므로 `.ait` 가 생성된다.
- 결과물은 호스트의 프로젝트 디렉터리에 그대로 나온다(볼륨 마운트).

> 주의: 컨테이너는 호스트의 `node_modules`(Windows 바이너리)를 못 쓰므로 `npm ci` 로
> 리눅스용 의존성을 새로 설치한다(최초 1회 수 분 소요).

---

## 방법 B — WSL2 (Ubuntu 등 실제 배포판)

```bash
# WSL Ubuntu 안에서
cd /mnt/d/fg/lucky-draw
rm -rf node_modules            # Windows용 모듈 제거
npm ci                         # 리눅스용 재설치
npx ait build                  # .ait 생성
```

---

## 방법 C — macOS / Linux CI

GitHub Actions 등 리눅스 러너에서:

```yaml
- uses: actions/setup-node@v4
  with: { node-version: 22 }
- run: npm ci
- run: npx ait build
```

---

## 빌드 후

1. 생성된 `.ait` 파일을 앱인토스 콘솔의 **앱 번들** 업로드란에 올린다.
2. 샌드박스 앱에서 동작 확인 → 심사 제출.

## 로컬 개발(빌드 없이 화면 확인)

```bash
npm run dev      # Metro 개발 서버 → 샌드박스 앱에서 실시간 미리보기
```
개발 모드는 Hermes 가 필요 없어 Windows 에서도 동작한다.
