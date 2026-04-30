// =====================================================
// 選択オブジェクトの型を調査
// =====================================================

(function () {
    var doc = app.activeDocument;
    var sel = doc.selection;

    if (!sel || sel.length === 0) {
        alert("何か選択してから実行してください。");
        return;
    }

    var report = "選択数: " + sel.length + "\n\n";

    for (var i = 0; i < sel.length; i++) {
        var item = sel[i];
        report += "[" + i + "] typename = " + item.typename + "\n";
        report += "    name = \"" + item.name + "\"\n";

        // CompoundPathItem の場合は中の pathItems も見る
        if (item.typename === "CompoundPathItem") {
            report += "    pathItems.length = " + item.pathItems.length + "\n";
            for (var j = 0; j < item.pathItems.length; j++) {
                var p = item.pathItems[j];
                report += "      [" + j + "] pathPoints.length = " + p.pathPoints.length + "\n";
            }
        }
        // GroupItem の場合
        if (item.typename === "GroupItem") {
            report += "    pathItems.length = " + item.pathItems.length + "\n";
            report += "    groupItems.length = " + item.groupItems.length + "\n";
        }
        // bounds
        try {
            var b = item.geometricBounds;
            report += "    bounds = [" + b[0].toFixed(1) + ", " + b[1].toFixed(1)
                   + ", " + b[2].toFixed(1) + ", " + b[3].toFixed(1) + "]\n";
        } catch (e) {}

        report += "\n";
    }

    alert(report);
})();
