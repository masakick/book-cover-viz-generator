// =====================================================
// Illustrator JSX: 選択した円と同じ座標のアンカーポイントを
//                  ダイレクト選択する (v7)
// =====================================================
// 動作確認済: Illustrator v29.8.1
// 互換性目標: v27.x 以降
//
// 改良点 (v6 -> v7):
//   - GroupItem の compoundPathItems への直接アクセスを削除
//     (pathItems に含まれるため重複参照になる、かつ古い版では
//      プロパティが存在しない可能性があるため)
//   - CompoundPathItem は元から pathItems 経由でアクセス
// =====================================================

(function () {
    var TOLERANCE = 1.0;

    var doc = app.activeDocument;

    // ---- 全レイヤーのロック・非表示を解除 (ボトムアップ) ----
    function unlockAllLayers(layers) {
        for (var i = 0; i < layers.length; i++) {
            if (layers[i].layers && layers[i].layers.length > 0) {
                unlockAllLayers(layers[i].layers);
            }
        }
        for (var i = 0; i < layers.length; i++) {
            try { layers[i].visible = true; } catch (e) {}
            try { layers[i].locked = false; } catch (e) {}
        }
    }
    unlockAllLayers(doc.layers);

    // ---- 実行前の選択状態を保存 ----
    var originalSelection = [];
    if (doc.selection && doc.selection.length > 0) {
        for (var i = 0; i < doc.selection.length; i++) {
            originalSelection.push(doc.selection[i]);
        }
    }

    // ---- 全パスのダイレクト選択状態をスナップショット ----
    var anchorSnapshot = [];
    function snapshotAnchors(container) {
        for (var i = 0; i < container.pathItems.length; i++) {
            var path = container.pathItems[i];
            for (var j = 0; j < path.pathPoints.length; j++) {
                try {
                    var pt = path.pathPoints[j];
                    if (pt.selected !== PathPointSelection.NOSELECTION) {
                        anchorSnapshot.push({
                            path: path,
                            index: j,
                            state: pt.selected
                        });
                    }
                } catch (e) {}
            }
        }
        for (var g = 0; g < container.groupItems.length; g++) {
            snapshotAnchors(container.groupItems[g]);
        }
        if (container.layers) {
            for (var L = 0; L < container.layers.length; L++) {
                snapshotAnchors(container.layers[L]);
            }
        }
    }
    snapshotAnchors(doc);

    if (originalSelection.length === 0) {
        alert("ノード（円）またはノードグループを選択してから実行してください。");
        return;
    }

    // ---- 選択オブジェクトを再帰展開してPathItemを集める ----
    var collectedPaths = [];

    function collectPathItems(item) {
        var t = item.typename;
        if (t === "PathItem") {
            collectedPaths.push(item);
        } else if (t === "CompoundPathItem") {
            // CompoundPathItemは内部にpathItemsを持つ
            for (var i = 0; i < item.pathItems.length; i++) {
                collectedPaths.push(item.pathItems[i]);
            }
        } else if (t === "GroupItem") {
            // pathItems は CompoundPath 内のものも含めて全展開される
            for (var i = 0; i < item.pathItems.length; i++) {
                collectedPaths.push(item.pathItems[i]);
            }
            // 子のGroupItemを再帰
            for (var g = 0; g < item.groupItems.length; g++) {
                collectPathItems(item.groupItems[g]);
            }
        }
    }

    for (var i = 0; i < originalSelection.length; i++) {
        collectPathItems(originalSelection[i]);
    }

    // ---- 各PathItemの中心座標を集める ----
    var targetCoords = [];
    var targetPathSet = [];
    for (var i = 0; i < collectedPaths.length; i++) {
        var path = collectedPaths[i];
        try {
            var b = path.geometricBounds;  // [left, top, right, bottom]
            var cx = (b[0] + b[2]) / 2;
            var cy = (b[1] + b[3]) / 2;
            targetCoords.push({ x: cx, y: cy });
            targetPathSet.push(path);
        } catch (e) {}
    }

    if (targetCoords.length === 0) {
        alert("選択にパスオブジェクトが見つかりませんでした。");
        return;
    }

    // ---- 一旦選択解除 ----
    doc.selection = null;

    var matchedCount = 0;

    function isTargetPath(path) {
        for (var s = 0; s < targetPathSet.length; s++) {
            if (path === targetPathSet[s]) return true;
        }
        return false;
    }

    function walkPaths(container) {
        for (var i = 0; i < container.pathItems.length; i++) {
            var path = container.pathItems[i];
            if (isTargetPath(path)) continue;

            for (var j = 0; j < path.pathPoints.length; j++) {
                var pt = path.pathPoints[j];
                var ax = pt.anchor[0];
                var ay = pt.anchor[1];

                for (var k = 0; k < targetCoords.length; k++) {
                    var t = targetCoords[k];
                    if (Math.abs(ax - t.x) <= TOLERANCE &&
                        Math.abs(ay - t.y) <= TOLERANCE) {
                        try {
                            pt.selected = PathPointSelection.ANCHORPOINT;
                            matchedCount++;
                        } catch (e) {}
                        break;
                    }
                }
            }
        }
        for (var g = 0; g < container.groupItems.length; g++) {
            walkPaths(container.groupItems[g]);
        }
        if (container.layers) {
            for (var L = 0; L < container.layers.length; L++) {
                walkPaths(container.layers[L]);
            }
        }
    }
    walkPaths(doc);

    // ---- 元のダイレクト選択を復元 ----
    for (var a = 0; a < anchorSnapshot.length; a++) {
        var snap = anchorSnapshot[a];
        try {
            snap.path.pathPoints[snap.index].selected = snap.state;
        } catch (e) {}
    }

    // ---- 元のオブジェクト選択を復元 ----
    for (var r = 0; r < originalSelection.length; r++) {
        try {
            originalSelection[r].selected = true;
        } catch (e) {}
    }

    redraw();
    alert(matchedCount + " 個のアンカーポイントをダイレクト選択しました。\n"
        + "対象ノード数: " + targetCoords.length + "\n"
        + "元の選択状態は維持されています。");
})();
