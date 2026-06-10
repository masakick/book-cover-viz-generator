# 開発者向けメモ

本ツールの実装詳細・データ更新手順。ツールの使い方は [README.md](../README.md) を参照。

## ファイル構成

```
book-cover-viz-generator/
├── index.html                   # アプリ本体（HTML + Vanilla JS）
├── README.md
├── LICENSE
└── data/
    ├── tf_by_chapter.csv        # 章ごとの名詞頻度ランキング
    ├── dot_positions.csv        # VISUALIZE文字上のドット座標
    ├── cooccurrence.csv         # 単語共起ペア
    └── visualize_base.png       # 背景画像（VISUALIZE文字の元デザイン）
```

## データファイルの更新方法

各CSV/PNGは原稿リポジトリ（[book-of-datavis-with-Processing](https://github.com/masakick/book-of-datavis-with-Processing)）の解析スクリプトで生成される。原稿が更新されたら以下の手順でデータを更新する。

### 1. `tf_by_chapter.csv` — 章ごとの名詞TF（出現頻度）

各章のTOP50名詞をfreq降順で出力。

**生成元**: [`cover-viz/analyze_tf_by_chapter.py`](https://github.com/masakick/book-of-datavis-with-Processing/blob/main/cover-viz/analyze_tf_by_chapter.py)

**手順**（原稿リポジトリにて）:
```bash
source cover-viz/venv/bin/activate
python3 cover-viz/analyze_tf_by_chapter.py
# → cover-viz/data/tf_by_chapter.csv が更新される
```

ノイズ除外には [`cover-viz/data/user_dict.csv`](https://github.com/masakick/book-of-datavis-with-Processing/blob/main/cover-viz/data/user_dict.csv)（Janomeのユーザー辞書）と、analyze_tf_by_chapter.py 内のSTOPWORDSが効く。複合語が分割される問題があれば user_dict.csv にエントリを追加する。

### 2. `cooccurrence.csv` — 単語共起ペア

同一文に出現する名詞ペアの上位1000組。

**生成元**: [`cover-viz/analyze_textmining.py`](https://github.com/masakick/book-of-datavis-with-Processing/blob/main/cover-viz/analyze_textmining.py)

**手順**:
```bash
source cover-viz/venv/bin/activate
python3 cover-viz/analyze_textmining.py
# → cover-viz/data/cooccurrence.csv が更新される
```

### 3. `dot_positions.csv` — ドット座標

`VISUALIZE` 文字輪郭上のドット座標（章別、49個 × 9章 = 441点）。

**生成元**: Illustratorファイル [`cover-viz/sketch_cover_final/cover-grid-base.ai`](https://github.com/masakick/book-of-datavis-with-Processing/tree/main/cover-viz/sketch_cover_final) + ExtendScript

**手順**:
1. Illustratorで `cover-grid-base.ai` を開く
2. 必要に応じて `add_midpoints.jsx` を実行してドットを増やす
3. `extract_dots.jsx` を実行してCSV出力（File → Scripts → Other Script...）
4. 出力された `data/dot_positions.csv` をこのプロジェクトの `data/` にコピー

### 4. `visualize_base.png` — 背景画像

`VISUALIZE` 文字の表示用ベース画像。

**手順**:
- Illustratorまたは他の画像編集ツールで `visualize_base.png` を編集
- 同じ寸法（1920x964）でPNG書き出し
- このプロジェクトの `data/` に上書きコピー

## データ反映時の注意

- データファイルを更新したら、ブラウザのキャッシュをクリアして再読込（`Cmd+Shift+R`）
- `dot_positions.csv` のドット数を変更した場合、`index.html` 内の `Dots / Chapter` スライダー（max値）も合わせて修正が必要

## カスタマイズ

`index.html` の冒頭付近にある定数で章構成や色相を変更可能：

```js
const CHAPTERS = ["Foreword","Chapter1","Chapter2",...];
const CHAPTER_HUES = [0, 30, 60, 120, 170, 210, 270, 320, 345];
```

章数を変更する場合は、`tf_by_chapter.csv` と `dot_positions.csv` の `chapter` カラム値とも整合させる。

## ローカル実行

```bash
python3 -m http.server 8000
# http://localhost:8000 を開く
```

`fetch()` が HTTP を必要とするため、静的サーバー必須。ファイル更新後はハードリロード（`Cmd+Shift+R`）でキャッシュを無効化する。
