# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## このリポジトリの概要

書籍の表紙ビジュアルを生成する単一ページのブラウザツール（Vanilla JS、ビルドステップなし）。`VISUALIZE` の文字輪郭上のドット配置に対し、ノードリンクグラフを重ねる：ノード=章ごとのキーワード頻度、エッジ=章をまたぐ単語共起。出力はダウンロード可能なSVG。

このリポジトリは下流の成果物であり、CSV/PNG入力はすべて上流の原稿リポジトリ [book-of-datavis-with-Processing](https://github.com/masakick/book-of-datavis-with-Processing) （`cover-viz/` 配下）のスクリプトで生成される。再生成手順は [README.md](README.md) を参照。

## ローカル実行

`fetch()` が HTTP を必要とするため、静的サーバー必須：

```bash
python3 -m http.server 8000
# http://localhost:8000 を開く
```

[data/](data/) 配下のファイルを更新したら、ブラウザでハードリロード（`Cmd+Shift+R`）してキャッシュを無効化する。

## アーキテクチャ

すべての実装は [index.html](index.html) に集約されている — マークアップ、CSS、単一の `<script>` ブロック。バンドラ・フレームワーク・テストハーネスは存在しない。

### レンダリングパイプライン

1. **`loadData()`** — 4つのデータファイルを並列 fetch。PNGは base64 の `data:` URI に変換して保持するため、書き出されたSVGは自己完結する（外部画像参照を持たない）。
2. **`getParams()`** — レンダリングごとに全スライダー／チェックボックスをフラットな params オブジェクトに読み出す。
3. **`buildSVG(p)`** — 純関数：params + モジュールレベルのデータ → SVG文字列。Inkscape ラベル付きの `<g>` レイヤを `background` → `edges` → `nodes` → `labels` の順に出力する。`<defs>` ブロックは先頭に予約しておき（`out[defsIdx]`）、エッジグラデーションが使われた場合のみ後から埋める。
4. **`render()`** — `buildSVG` を再実行し `#preview` の innerHTML を差し替え。すべての `input`/`change` イベントにバインドされており、スライダーをドラッグすると毎ティック同期的に再描画される。`buildSVG` は安価に保つこと。

### データのジョイン（ビジュアルの核）

3つのCSVは2つの暗黙キーで結合される：

- **`(chapter, position-order)`** — [data/dot_positions.csv](data/dot_positions.csv)（`VISUALIZE` 輪郭上のxy座標、`index` は path traversal order）と [data/tf_by_chapter.csv](data/tf_by_chapter.csv)（章ごとの上位50名詞）を結合する。`buildSVG()` は **UI で選択された並び順**（ラジオ "Node Order"）に応じて tf_by_chapter の行を `rank` または `appearance` で**明示的に昇順ソート**してから上位 N 個を取り、その i 番目を path 上の i 番目のドット位置に割り当てる。**CSV の物理行順には依存しない**（過去の実装は CSV 順前提だったが、appearance モード追加時に堅牢化済み）。
- **`(word1, word2)`** — [data/cooccurrence.csv](data/cooccurrence.csv) は、章→ノードマップから組み立てたインメモリの `wordIndex` で解決される。エッジは「**異なる章**にあるノードインスタンス間」のみ描画される（`n1.ci !== n2.ci`）。同一章内ペアはスキップ。したがって共起1行から複数のSVG `<line>` が生成されうる。

`tf_by_chapter.csv` の列：`chapter, rank, word, count, freq, appearance`。`appearance` はその章の本文中で**初めて出現した順番**を表す整数（top-50 by TF に入った単語のみ番号を持ち、値は連続でない）。

ドット位置は `index` 順の生座標そのままではなく、`sampleAlongPath()` で**弧長等間隔**にリサンプリングされる。`Dots / Chapter` を減らしても文字輪郭の冒頭区間に偏らず全体に等間隔配置される。隣接 index 間が `STROKE_BREAK_DIST=80px` を超えるとストローク区切り（"E" の横棒など）とみなして弧長から除外。`index=0` のドットは常に `sampled[0]` （t=0）として保持されるため、UI 上 i 番目に並ぶ単語は常に index=0 のドット位置に**最も近い**サンプル点に置かれる。

ノード半径は `sqrt(freq)` でスケールする（唯一の非線形マッピング）。彩度・明度は `fmap()` による線形マッピング。HSB→RGB は SVG が RGB 文字列を要求するため JS 側で実装（`hsbToRgb`）。

### ラベル描画（renderer 非依存）

`<text>` の `text-anchor` / `dominant-baseline` は Inkscape / Illustrator / ブラウザで解釈差があり書き出した SVG がズレる原因になる。本実装はこれを**使わず**、`measureLabels()` がブラウザ DOM の `getBBox()` で各単語の bbox を実測し、絶対座標で `<text x="..." y="...">` を出力する。同じ単語は 1 度だけ計測してキャッシュ。Label セクションのラジオ（中央揃え／左揃え）は bbox からの tx 計算式を切り替えるだけで、座標方式自体は不変。

注意点：書き出した SVG を別環境で開くときに同じフォント（`Hiragino Sans` 系）が無いとフォールバックフォント metrics で再描画されラベルがズレる。完全な可搬性が必要なら font embed が次の手。

### 同期が必要な定数

`CHAPTERS` と `CHAPTER_HUES` はスクリプト先頭で宣言されている**並列配列**。長さが章数を表し、`tf_by_chapter.csv` と `dot_positions.csv` の両方の `chapter` 列の値と**必ず一致**させる必要がある。データ側で章を追加・削除・改名した場合は両配列を更新すること。

`Dots / Chapter` スライダーの `max`（現在 49）は `dot_positions.csv` の章あたりドット数と一致させる必要がある。上流でドット数を変更した場合は [index.html](index.html) のスライダーの `max` も編集する。

`FIXED_PARAMS` は意図的にハードコードされている値（エッジ非グラデーション時の hue=0/sat=0 → グレースケール、ラベル色は near-white）。設計上スライダー化していないので、理由なくスライダーに昇格させない。

### CSV パーサ

`parseCSV()` は素朴な実装：カンマで split するだけで、引用符・カンマを含むフィールド・エスケープには対応していない。BOM と CRLF/CR/LF は処理する（dot_positions.csv は Illustrator の ExtendScript から書き出されており CR を含むことがある）。上流が引用符付き文字列やフィールド内カンマを導入した場合、このパーサは壊れる — その時はパッチではなく置き換えること。

## 編集時の注意

- 書き出される SVG は各 `<g>` に Inkscape の `groupmode`/`label` 属性を保持しているため、Inkscape/Illustrator で開くと4レイヤとして分離される。SVG生成をリファクタする場合はこの属性を維持すること。
- キャンバスは固定 1920×964（`visualize_base.png` の寸法と一致）。背景画像を差し替える際もこのアスペクト比を保たないとドット座標が崩れる。
- ダウンロードファイル名には ISO タイムスタンプを埋め込んでいる。ディスク上で各バリエーションを区別するための仕掛けなので、理由なく変更しない。
