# book-cover-viz-generator

書籍の表紙ビジュアルを生成するブラウザツール。

## デモ

**[https://masakick.github.io/book-cover-viz-generator/](https://masakick.github.io/book-cover-viz-generator/)**

## これは何か

`VISUALIZE` の文字輪郭上にノードリンクグラフを重ねた表紙ビジュアルを、ブラウザ上でインタラクティブに生成するツールです。

- **ノード** = 各章のキーワード（TF頻度に比例したサイズ、章ごとに色分け）
- **エッジ** = 章をまたぐ単語の共起関係
- スライダーでパラメータを調整し、SVG形式でダウンロードできます

## 書籍

本ツールは書籍『ProcessingとPythonではじめる データビジュアライゼーション入門』の表紙ビジュアル制作のために開発されました。

著者: Masaki Yamabe  
サポートサイト: [https://vizbook.masakiyamabe.com/](https://vizbook.masakiyamabe.com/)

## 遊び方

1. [デモページ](https://masakick.github.io/book-cover-viz-generator/)をブラウザで開く
2. 各スライダーでノード数・エッジ数・色相・サイズなどを調整する
3. 気に入ったバリエーションができたら **Download SVG** ボタンでSVGを保存する

主なコントロール:

| コントロール | 内容 |
|---|---|
| Dots / Chapter | 章ごとに配置するノード数 |
| Edge Count | 表示するエッジ数 |
| Node Hue / Saturation | ノードの色相・彩度 |
| Edge Gradient | エッジに章ごとのグラデーションを適用するか |
| Node Order | ノードをTFランク順 / 初出順で並べる |
| Label Align | ラベルを中央揃え / 左揃えにする |

## 仕組み

3つのCSVと背景画像を組み合わせています：

- `data/tf_by_chapter.csv` — 章ごとの名詞TFランキング（上位50語）
- `data/dot_positions.csv` — `VISUALIZE` 文字輪郭上のドット座標
- `data/cooccurrence.csv` — 章間の単語共起ペア
- `data/visualize_base.png` — 背景画像（1920×964px）

ドット座標は弧長等間隔にリサンプリングされるため、ノード数を減らしても文字輪郭全体に均一に配置されます。出力SVGはIllustratorで開くと `background` / `edges` / `nodes` / `labels` の4レイヤに分離されます。

## ローカル実行

`fetch()` がHTTPを必要とするため、静的サーバー経由で起動してください：

```bash
git clone https://github.com/masakick/book-cover-viz-generator.git
cd book-cover-viz-generator
python3 -m http.server 8000
```

ブラウザで [http://localhost:8000](http://localhost:8000) を開く。

データファイルを更新した場合はハードリロード（`Cmd+Shift+R`）でキャッシュを無効化してください。

## ライセンス

MIT License — 詳細は [LICENSE](LICENSE) を参照。

## クレジット

本ツールは書籍プロジェクトの一部として開発されました。  
原稿リポジトリ: [https://github.com/masakick/book-of-datavis-with-Processing](https://github.com/masakick/book-of-datavis-with-Processing)

<details>
<summary>データ更新・開発者向け情報</summary>

[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) を参照してください。

</details>
