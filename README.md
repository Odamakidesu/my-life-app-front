# my-life-app-front

React + TypeScript のフロントエンドです。開発サーバとビルドは [Vite](https://vite.dev/)、
テストは [Vitest](https://vitest.dev/)（jsdom + Testing Library）で動かします。
（Create React App から移行済み。`react-scripts` は使っていません。）

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

インポートは `import { Note } from "features/note/domain/types/Note";` のように
`src` 起点で記述します。対応表は `tsconfig.json` の `paths`（型検査用）と
`vite.config.ts` の `resolve.alias`（ビルド・テスト用）の 2 か所にあるため、
`src` 直下にディレクトリを増やすときは両方に追加してください。

### テストの置き場所

テストは `src/test/` 配下にまとめ、対象と同じ階層構造で並べます
（例: `src/features/note/domain/schemas/NoteSchema.ts` →
`src/test/features/note/domain/NoteSchema.test.ts`）。

Vitest は `vite.config.ts` の `test.include`（`src/test/**/*.test.{ts,tsx}`）に
一致するファイルだけを実行します。`describe` / `test` / `expect` / `vi` はグローバルに
使えます（`test.globals: true`）。モックの型が必要なときは `import type { Mock } from "vitest";`。

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
npm start   # = vite。http://localhost:5173 で起動
```

ポートは `vite.config.ts` の `server.port` で固定し、`strictPort: true` にしているため、
5173 が使用中なら別ポートへ逃げずに起動エラーになります。

ポートを **5173** に固定しているのは、バックエンドの CORS 許可オリジンが
`app.api.endpoint.base-url=http://localhost:5173` の 1 つだけで、かつ
`withCredentials: true` で通信しているためです。別のポートだとプリフライトで
拒否されます。

接続先は環境変数 `VITE_API_BASE_URL`（末尾の `/api` まで含める）で決まります。
Vite がクライアントに埋め込むのは `VITE_` で始まる変数だけで、コードからは
`import.meta.env.VITE_API_BASE_URL` で参照します（型は `src/vite-env.d.ts`）。
CRA 時代の `REACT_APP_API_BASE_URL` は Vite では読まれません。手元の `.env.local` などに
残っている場合は、`npm start` / `npm run build` / `npm test` の起動時に `VITE_API_BASE_URL` へ
自動で書き換えます（`config/migrateLegacyEnv.ts`。新しい名前が既にあれば古い行をコメントアウト）。
シェルの環境変数に古い名前を設定している場合は警告だけ出すので、自分で名前を変えてください。

| ファイル | 用途 | コミット |
|---|---|---|
| `.env.development` | ローカルの既定値（`http://localhost:8080/api`） | する |
| `.env.local` | 端末ごとの上書き（ポート変更時など） | しない |
| `.env.production` | 本番。CI が Secret `REACT_APP_API_BASE_URL` の値を `VITE_API_BASE_URL` として書き出す | しない |

8080 が別プロセスに使われているなど既定値で動かない場合は、バックエンドのポートを
変えたうえで `.env.local` に次のように書いて上書きします。

```
VITE_API_BASE_URL=http://localhost:8081/api
```

## コマンド

| コマンド | 内容 |
|---|---|
| `npm start`（`npm run dev`） | 開発サーバを http://localhost:5173 で起動 |
| `npm test` | テストを 1 回だけ実行（`vitest run`）。`npm test -- --coverage` でカバレッジを `coverage/` に出力 |
| `npm run test:watch` | テストを監視モードで実行 |
| `npm run typecheck` | 型検査（`tsc --noEmit`） |
| `npm run build` | 本番ビルドを `build/` に出力（デプロイジョブが S3 へ同期する） |
| `npm run preview` | `build/` を http://localhost:5173 で配信して確認 |

ESLint は CRA に同梱されていた設定（`eslintConfig`）を移行時に外しており、現在は未設定です。
typescript-eslint が TypeScript 7 にまだ対応していない（peer が `<6.1.0`）ためで、
対応後に flat config で追加する想定です。
