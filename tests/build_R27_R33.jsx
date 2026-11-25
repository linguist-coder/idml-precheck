// review round 3: fixtures for the cases the reviewer reported.
// Works only on documents it creates (documents.add(false)) and closes them by reference.
// Change this to an existing folder before you run the script.
var DIR = "C:/idml-precheck-tests/";
var prevUI = app.scriptPreferences.userInteractionLevel;
app.scriptPreferences.userInteractionLevel = UserInteractionLevels.NEVER_INTERACT;
var out = [];

function frame(d, top, text) {
  return d.pages[0].textFrames.add({ geometricBounds: [top, 36, top + 50, 400], contents: text });
}
function line(d, top) {
  var ln = d.pages[0].graphicLines.add();
  ln.paths[0].entirePath = [[36, top], [400, top]];
  return ln;
}
function tagged(d, tag, el, text) {
  var tf = frame(d, 300, "");
  tf.insertionPoints[0].textFrames.add({ geometricBounds: [0, 0, 20, 120], contents: text });
  var x = el.xmlElements.add(tag);
  tf.markup(x);
  tf.remove();
  return x;
}
function exportAs(d, name) {
  d.exportFile(ExportFormat.INDESIGN_MARKUP, File(DIR + name + ".idml"), false);
  out.push(name + ": exported");
}
function run(name, fn) {
  var d = null;
  try {
    d = app.documents.add(false);
    d.viewPreferences.horizontalMeasurementUnits = MeasurementUnits.POINTS;
    d.viewPreferences.verticalMeasurementUnits = MeasurementUnits.POINTS;
    frame(d, 36, "ALPHA baseline text for " + name + ".");
    fn(d);
    exportAs(d, name);
  } catch (e) {
    out.push(name + " ERROR line " + e.line + ": " + e.message);
  }
  try { if (d && d.isValid) d.close(SaveOptions.NO); } catch (e2) {}
}

try {
  run("R27_anchor_and_linked_child", function (d) {
    var el = tagged(d, d.xmlTags.add("Mixed"), d.xmlElements[0], "ASPEN anchored and not placed.");
    var ch = el.xmlElements.add(d.xmlTags.add("Para"));
    var live = frame(d, 120, "BIRCH live text in a frame.");
    live.markup(ch);
    exportAs(d, "R27a_before_remove");
    el.remove();
    out.push("R27 after removing the branch: live text [" + live.contents + "] tag [" + (live.associatedXMLElement ? live.associatedXMLElement.markupTag.name : "none") + "]");
  });
  run("R28_same_anchored_text", function (d) {
    var tag = d.xmlTags.add("Note");
    tagged(d, tag, d.xmlElements[0], "CEDAR same anchored text.");
    tagged(d, tag, d.xmlElements[0], "CEDAR same anchored text.");
  });
  run("R29_anchored_path_deleted", function (d) {
    var tf = frame(d, 300, "");
    var ln = line(d, 200);
    ln.textPaths.add();
    ln.textPaths[0].contents = "DOGWOOD text on an anchored path.";
    ln.anchoredObjectSettings.insertAnchoredObject(tf.insertionPoints[0], AnchorPosition.ANCHORED);
    tf.markup(d.xmlElements[0].xmlElements.add(d.xmlTags.add("Note")));
    tf.remove();
  });
  run("R30_empty_containers", function (d) {
    var a = frame(d, 120, "EBONY all words are in the first frame.");
    var b = frame(d, 200, "");
    a.nextTextFrame = b;
    b.locked = true;
    var c = frame(d, 280, "FIR all words are in the ordinary frame.");
    var ln = line(d, 360);
    var tp = ln.textPaths.add();
    c.nextTextFrame = tp;
    out.push("R30 second frame chars " + b.characters.length + " / path chars " + tp.characters.length);
  });
  run("R31_frame_to_path", function (d) {
    var a = frame(d, 120, "GINKGO in the frame.\rHICKORY on the path.");
    a.geometricBounds = [120, 36, 136, 400];
    var tp = line(d, 200).textPaths.add();
    a.nextTextFrame = tp;
    out.push("R31 frame [" + a.contents + "] path [" + tp.contents + "]");
  });
  run("R32_unplaced_table_links", function (d) {
    var tf = frame(d, 120, "IRONWOOD before the table.\r");
    var t = tf.insertionPoints[-1].tables.add({ bodyRowCount: 1, columnCount: 2 });
    t.cells[0].contents = "JUNIPER cell one";
    t.cells[1].contents = "KAPOK cell two";
    var x = d.xmlElements[0].xmlElements.add(d.xmlTags.add("Sec"));
    tf.markup(x);
    var tx = x.xmlElements.add(d.xmlTags.add("Tab"));
    try { t.markup(tx); } catch (e) { out.push("R32 table markup: " + e.message); }
    tf.remove();
  });
  run("R33_locked_inherited", function (d) {
    var a = frame(d, 120, "LARCH grouped one."), b = frame(d, 200, "MYRTLE grouped two.");
    a.insertionPoints[-1].textFrames.add({ geometricBounds: [0, 0, 8, 60], contents: "NUTMEG nested anchor." });
    d.pages[0].groups.add([a, b]).locked = true;
    var ln = line(d, 360);
    var tp = ln.textPaths.add();
    tp.contents = "OSIER path on a locked line.";
    ln.locked = true;
  });
} finally {
  app.scriptPreferences.userInteractionLevel = prevUI;
}
out.join("\n");
