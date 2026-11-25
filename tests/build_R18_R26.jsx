// review round 2: fixtures for the cases the reviewer reported.
// Works only on documents it creates (documents.add(false)) and closes them by reference.
// Change this to an existing folder before you run the script.
var DIR = "C:/idml-precheck-tests/";
var prevUI = app.scriptPreferences.userInteractionLevel;
app.scriptPreferences.userInteractionLevel = UserInteractionLevels.NEVER_INTERACT;
var out = [];

function frame(d, top, text) {
  return d.pages[0].textFrames.add({ geometricBounds: [top, 36, top + 50, 400], contents: text });
}
function range(st, text) {
  var f = st.contents.indexOf(text);
  return st.characters.itemByRange(f, f + text.length - 1);
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
function threadWithAnchors(d) {
  var a = frame(d, 120, "MAPLE first frame text.\rOLIVE second frame text.");
  a.geometricBounds = [120, 36, 136, 400];
  var b = frame(d, 200, "");
  a.nextTextFrame = b;
  var st = a.parentStory;
  var p0 = st.paragraphs[0].insertionPoints[5];
  p0.textFrames.add({ geometricBounds: [0, 0, 8, 60], contents: "PLUM anchor in first frame." });
  var p1 = st.paragraphs[1].insertionPoints[5];
  p1.textFrames.add({ geometricBounds: [0, 0, 8, 60], contents: "QUINCE anchor in second frame." });
  return [a, b];
}

try {
  run("R18_xml_parent_own_and_child", function (d) {
    var root = d.xmlElements[0];
    var el = root.xmlElements.add(d.xmlTags.add("Sec"));
    el.contents = "ROWAN own text of the parent. ";
    var ch = el.xmlElements.add(d.xmlTags.add("Para"));
    var live = frame(d, 120, "SORREL live text in a frame.");
    live.markup(ch);
    out.push("R18 before: frames " + d.textFrames.length + " / live text [" + live.contents + "] / parent [" + el.contents + "] children " + el.xmlElements.length);
    exportAs(d, "R18a_before_remove");
    el.remove();
    out.push("R18 after removing the parent: frames " + d.textFrames.length + " / live text [" + (live.isValid ? live.contents : "frame gone") + "]");
  });
  run("R19_anchor_in_deleted_tagged", function (d) {
    var tf = frame(d, 120, "");
    tf.insertionPoints[0].textFrames.add({ geometricBounds: [0, 0, 20, 120], contents: "TEAK anchored in a deleted tagged frame." });
    tf.markup(d.xmlElements[0].xmlElements.add(d.xmlTags.add("Note")));
    tf.remove();
  });
  run("R19b_anchor_in_placed_tagged", function (d) {
    var tf = frame(d, 120, "");
    tf.insertionPoints[0].textFrames.add({ geometricBounds: [0, 0, 20, 120], contents: "TEAK anchored in a placed tagged frame." });
    tf.markup(d.xmlElements[0].xmlElements.add(d.xmlTags.add("Note")));
  });
  run("R20_thread_anchor_layer", function (d) {
    var f = threadWithAnchors(d);
    var ly = d.layers.add({ name: "Hidden notes" });
    f[1].itemLayer = ly;
    ly.visible = false;
  });
  run("R21_thread_anchor_hidden", function (d) {
    var f = threadWithAnchors(d);
    f[1].visible = false;
  });
  run("R22_hidden_group", function (d) {
    var a = frame(d, 120, "UMBER grouped one."), b = frame(d, 200, "VIOLET grouped two.");
    a.insertionPoints[-1].textFrames.add({ geometricBounds: [0, 0, 8, 60], contents: "WILLOW nested anchor." });
    d.pages[0].groups.add([a, b]).visible = false;
  });
  run("R23_condition_in_note", function (d) {
    var st = frame(d, 120, "Body start. Body end.").parentStory;
    var nt = st.insertionPoints[5].notes.add();
    nt.texts[0].contents = "XENON note text.";
    var h = d.conditions.add({ name: "Internal", visible: true });
    nt.texts[0].characters.itemByRange(0, 4).applyConditions([h]);
    h.visible = false;
  });
  run("R24_same_opening", function (d) {
    var tag = d.xmlTags.add("Note");
    var open = "YARROW this is a long shared opening that runs for more than seventy characters in both, ";
    for (var i = 1; i <= 2; i++) {
      var tf = frame(d, 100 + 60 * i, open + "ending " + i + ".");
      tf.markup(d.xmlElements[0].xmlElements.add(tag));
      tf.remove();
    }
  });
  run("R25_inner_outer", function (d) {
    var st = frame(d, 120, "Text. ZINNIA outer inner word end. Tail.").parentStory;
    var o = d.conditions.add({ name: "Outer", visible: true });
    var n = d.conditions.add({ name: "Inner", visible: true });
    range(st, "ZINNIA outer inner word end.").applyConditions([o]);
    range(st, "inner word ").applyConditions([n], true);
    st.trackChanges = true;
    range(st, "inner word ").remove();
    st.trackChanges = false;
    o.visible = false;
    n.visible = false;
  });
  run("R26_pipes", function (d) {
    var tf = frame(d, 120, "|");
    tf.markup(d.xmlElements[0].xmlElements.add(d.xmlTags.add("Note")));
    tf.remove();
    var f2 = frame(d, 200, "|");
    var ly = d.layers.add({ name: "Hidden notes" });
    f2.itemLayer = ly;
    ly.visible = false;
  });
} finally {
  app.scriptPreferences.userInteractionLevel = prevUI;
}
out.join("\n");
