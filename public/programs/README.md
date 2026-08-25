# 프로그램 등록 규격

각 프로그램을 `public/programs/{program-id}` 폴더로 추가합니다.

```text
public/programs/calculator/
├── index.html
├── icon.png
└── manifest.json
```

`manifest.json` 예시:

```json
{
  "id": "calculator",
  "name": "계산기",
  "description": "업무용 계산기",
  "entry": "index.html",
  "icon": "icon.png",
  "defaultWidth": 720,
  "defaultHeight": 520,
  "minWidth": 400,
  "minHeight": 300,
  "allowMultiple": false
}
```

폴더명과 `id`는 같아야 하며 영문 소문자, 숫자, 하이픈, 밑줄만 사용할
수 있습니다. 시작 파일과 아이콘이 실제로 존재하지 않거나 manifest가
유효하지 않은 프로그램은 API 목록에서 제외됩니다.
