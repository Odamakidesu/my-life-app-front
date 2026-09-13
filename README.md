# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## アーキテクチャ（機能単位 × レイヤ）

`src/features` の下を **機能（ドメイン）ごとに縦割り**し、その中を
`domain` / `application` / `presentation` のレイヤで分けています。
1 つの機能を直すときに触るファイルが 1 フォルダに収まり、
かつレイヤの境界はフォルダ名として残ります。

依存の向きは機能の中でも **presentation → application → domain** の一方向で、
`domain` は React も axios も知りません。

```
src/
├─ app/                      アプリ全体の起動・横断設定
│   ├─ App.tsx
│   ├─ routes/               画面遷移の定義
│   └─ hooks/                useTheme
├─ features/                 機能（ドメイン）ごとの縦割り
│   ├─ note/
│   │   ├─ domain/           業務ルール（React 非依存）
│   │   │   ├─ types/        Note.ts（型定義）
│   │   │   ├─ schemas/      NoteSchema.ts（Zod／検証ルール）
│   │   │   ├─ policies/     並び順・絞り込み・締切判定
│   │   │   └─ repositories/ NoteRepository.ts（出力ポート）
│   │   ├─ application/      ユースケース
│   │   │   ├─ services/     NoteService.ts
│   │   │   └─ hooks/        useNotes.ts
│   │   └─ presentation/     画面
│   │       ├─ components/   NoteForm, NoteCard, NoteList ...
│   │       ├─ pages/        NotesPage.tsx
│   │       └─ styles/       NotesPage.css
│   ├─ tag/                  同じ構成（domain / application）
│   └─ auth/                 同じ構成（+ presentation: LoginPage, RequireAuth）
├─ shared/                   機能をまたいで使うもの
│   ├─ components/           HighlightedText, ThemeToggle, ToastNotifier
│   ├─ hooks/                useToast
│   ├─ types/                Notifier, theme
│   └─ styles/               App.css, index.css
├─ infrastructure/           技術詳細（domain の出力ポートの実装）
│   ├─ http/                 axios クライアント（ベースURL・認証ヘッダ）
│   ├─ repositories/         REST API によるリポジトリ実装
│   ├─ storage/              localStorage（トークン・テーマ）
│   └─ di/container.ts       依存関係の組み立て（合成ルート）
└─ test/                     テストはすべてここに集約（src 配下の構成を鏡写し）
    ├─ app/
    └─ features/note/...
```

インポートは `tsconfig.json` の `baseUrl: "src"` により
`import { Note } from "features/note/domain/types/Note";` のように
`src` 起点で記述します。

### テストの置き場所

テストは `src/test/` 配下にまとめ、対象と同じ階層構造で並べます
（例: `src/features/note/domain/schemas/NoteSchema.ts` →
`src/test/features/note/domain/NoteSchema.test.ts`）。

`react-scripts` の Jest は `roots` が `<rootDir>/src` に固定されているため、
テストフォルダはプロジェクト直下ではなく **`src` の中**に置く必要があります。

### バリデーション（Zod + React Hook Form）

検証ルールは **domain 層の Zod スキーマが唯一の定義**です。画面もユースケースも
同じスキーマを参照するため、ルールが二重管理になりません。

| 層 | 役割 | 該当ファイル |
|---|---|---|
| domain | ルールそのもの（Zod スキーマ・型・例外） | `features/note/domain/schemas/NoteSchema.ts`, `features/auth/domain/schemas/CredentialsSchema.ts` |
| application | 受け取った入力をスキーマで検証してから永続化 | `features/note/application/services/NoteService.ts` |
| presentation | `zodResolver` でフォームに適用し、項目ごとにエラー表示 | `features/note/presentation/components/NoteForm.tsx`, `features/auth/presentation/pages/LoginPage.tsx` |

- 型は `z.infer` からのみ導出する（`NoteInput`, `Credentials`）ので、スキーマを変えれば
  型・フォーム・サービスの全部が同時に追随します
- 画面の検証をすり抜けても `NoteService` が `parseNoteInput` で再検証し、
  失敗時は `NoteValidationError` を投げます（application 層で捕捉してトースト表示）
- フォームの状態管理は React Hook Form に任せるため、入力欄ごとの `useState` と
  setter のバケツリレーは不要です

新しく機能を追加するときの流れ:

1. `src/features/<機能名>/` を作る
2. `domain/types` と `domain/schemas` に型と検証ルール、`domain/repositories` に出力ポートを置く
3. `infrastructure/repositories` にポートの実装を書き、`di/container.ts` で結線する
4. `application/services` にユースケース、`application/hooks` に React から使うフックを置く
5. `presentation/components` `presentation/pages` で画面を組み立てる
6. テストは `src/test/features/<機能名>/` に同じ階層で置く

## ローカルでの起動

1. バックエンド（`../my-life-app-back`）を起動する
   - `application.properties` の既定で `local` プロファイル・ポート **8080**
   - MySQL（`localhost:3306` / DB `mylifeapp`）が必要
2. フロントエンドを起動する

```bash
npm install
npm start   # http://localhost:5173 で起動
```

ポートを **5173** に固定しているのは、バックエンドの CORS 許可オリジンが
`app.api.endpoint.base-url=http://localhost:5173` の 1 つだけで、かつ
`withCredentials: true` で通信しているためです。3000 番のままだとプリフライトで
拒否されます。

接続先は環境変数 `REACT_APP_API_BASE_URL`（末尾の `/api` まで含める）で決まります。

| ファイル | 用途 | コミット |
|---|---|---|
| `.env.development` | ローカルの既定値（`http://localhost:8080/api`） | する |
| `.env.local` | 端末ごとの上書き（ポート変更時など） | しない |
| `.env.production` | 本番。CI が Secrets から生成 | しない |

8080 が別プロセスに使われているなど既定値で動かない場合は、バックエンドのポートを
変えたうえで `.env.local` に次のように書いて上書きします。

```
REACT_APP_API_BASE_URL=http://localhost:8081/api
```

### テスト環境についての注意

`react-scripts@5` が同梱する Jest 27 は `package.json` の `exports` フィールドに
対応していません。そのため

- `react-router-dom` は `exports` だけで解決される v7 ではなく、`main` を持つ **v6 系**を使用しています
- `axios` / `date-fns` / `date-fns-tz` は ESM のまま配布されているため、
  `package.json` の `jest.transformIgnorePatterns` で変換対象に含めています

これらは Jest 側の制約への対処なので、将来 Vite など `exports` 対応のツールへ
移行する際にはまとめて不要になります。

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
