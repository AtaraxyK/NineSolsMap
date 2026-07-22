# Nine Sols Exploration Map

나인 솔즈 아이템 체크와 도교 석굴 서쪽 연결 정보를 함께 보는 개인 탐사 지도입니다.

## GitHub Pages

이 저장소는 GitHub Pages의 **Deploy from a branch** 방식을 사용합니다.

- Branch: `main`
- Folder: `/(root)`
- URL: <https://ataraxyk.github.io/NineSolsMap/>

루트의 `index.html`, `assets/`, `markers.json`이 실제 배포 파일입니다. 별도의 GitHub Actions 워크플로는 필요하지 않습니다.

## 로컬 실행

```bash
npm install
npm run dev
```

GitHub Pages와 같은 정적 결과를 미리 보려면 다음 명령을 사용합니다.

```bash
npm run publish:branch
npm run preview:pages
```

## 수정 후 배포

소스 코드를 수정한 뒤 아래 명령으로 정적 빌드를 루트에 복사하고 `main`에 푸시합니다.

```bash
npm run publish:branch
git add -A
git commit -m "Update map"
git push origin main
```

원본 지도 아이템 데이터를 새로 받으려면 먼저 `npm run sync:markers`를 실행합니다.
