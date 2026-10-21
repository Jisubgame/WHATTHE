# WHATTHE

폐쇄된 4병동에서 탈출하는 1인칭 3D 공포 게임. PC와 모바일 브라우저에서 돌아갑니다.

발전기 4대를 게이지 미니게임으로 가동하고, 카드키를 찾아 탈출구를 여세요.
그것은 소리를 듣습니다. 뛰면 들키고, 사물함에 숨는 모습을 보이면 끝입니다.

## 조작

| | PC | 모바일 |
|---|---|---|
| 이동 | WASD | 화면 왼쪽 끌기 |
| 시점 | 마우스 (클릭하면 고정) | 화면 오른쪽 끌기 |
| 달리기 | Shift | 달리기 버튼 (켜기/끄기) |
| 상호작용 | E / 클릭 | 화면 탭 / 사용 버튼 |
| 일시정지 | Esc | ⏸ 버튼 |

## 실행

`index.html`이 `assets/` 폴더의 3D 모델을 불러오기 때문에 웹 서버로 열어야 합니다
(파일을 더블클릭해서 열면 모델이 안 뜹니다).

- GitHub Pages: Settings → Pages → Branch `main` / `(root)`
- 로컬: `python3 -m http.server` 후 `http://localhost:8000`

## 구성

- `index.html` — 게임 전체 (three.js 0.160, CDN)
- `assets/monster.glb` — 괴물 (걷기·수색·질주·돌진 애니메이션)
- `assets/generator.glb`, `assets/locker.glb` — 발전기, 사물함
- `assets/jumpscare.png` — 점프스케어 이미지
