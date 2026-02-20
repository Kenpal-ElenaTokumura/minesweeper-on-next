# minesweeper-on-next

Next.js + Bun で作ったマインスイーパーです。

## スタイリング

- Tailwind CSS（v4）を利用しています。
- グローバル CSS は `app/globals.css` で `@import "tailwindcss";` を読み込みます。
- PostCSS 設定は `postcss.config.mjs` を参照してください。

## 必要ツール管理（mise）

1. `mise` をインストール
2. プロジェクトルートで以下を実行

```bash
mise install
mise exec -- bun --version
```

`mise.toml` で Bun `latest` を指定しています。

## 開発

```bash
bun install
bun run dev
```

## Lint / Format

```bash
bun run lint
bun run lint:fix
bun run format
```

## ビルド

```bash
bun run build
bun run start
```
