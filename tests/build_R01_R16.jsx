// review round 1: fixtures for the cases the reviewer reported.
// Works only on documents it creates (documents.add(false)) and closes them by reference.
// Change this to an existing folder before you run the script.
var DIR = "C:/idml-precheck-tests/";
var prevUI = app.scriptPreferences.userInteractionLevel;
app.scriptPreferences.userInteractionLevel = UserInteractionLevels.NEVER_INTERACT;
var out = [];

function newDoc() {
  var d = app.documents.add(false);
  d.viewPreferences.horizontalMeasurementUnits = MeasurementUnits.POINTS;
  d.viewPreferences.verticalMeasurementUnits = MeasurementUnits.POINTS;
  return d;
}
function frame(d, top, text, layer) {
  var props = { geometricBounds: [top, 36, top + 50, 400], contents: text };
  if (layer) props.itemLayer = layer;
  return d.pages[0].textFrames.add(props);
}
function finish(d, name) {
  d.save(File(DIR + name + ".indd"));
  d.exportFile(ExportFormat.INDESIGN_MARKUP, File(DIR + name + ".idml"), false);
  d.close(SaveOptions.NO);
  out.push(name + ": saved");
}
function range(st, text) {
  var f = st.contents.indexOf(text);
  return st.characters.itemByRange(f, f + text.length - 1);
}
function run(name, fn) {
  var d = null;
  try {
    d = newDoc();
    frame(d, 36, "ALPHA baseline text for " + name + ".");
    fn(d);
    finish(d, name);
  } catch (e) {
    out.push(name + " ERROR line " + e.line + ": " + e.message);
    try { if (d && d.isValid) d.close(SaveOptions.NO); } catch (e2) {}
  }
}

try {
  // Layers
  run("R01_hidden_layer", function (d) {
    var ly = d.layers.add({ name: "Hidden notes" });
    frame(d, 120, "NOVEMBER plain frame on a hidden layer.", ly);
    ly.visible = false;
  });
  run("R02_grouped", function (d) {
    var ly = d.layers.add({ name: "Locked notes" });
    var a = frame(d, 120, "OSCAR grouped frame.", ly);
    var b = frame(d, 200, "PAPA grouped frame.", ly);
    d.pages[0].groups.add([a, b]);
    ly.locked = true;
  });
  run("R03_anchored", function (d) {
    var ly = d.layers.add({ name: "Hidden notes" });
    var host = frame(d, 120, "QUEBEC host text.", ly);
    var an = host.insertionPoints[-1].textFrames.add({ geometricBounds: [0, 0, 20, 100], contents: "ROMEO anchored frame." });
    out.push("R03 anchored parent: " + an.parent.constructor.name);
    ly.visible = false;
  });
  run("R04_text_path", function (d) {
    var ly = d.layers.add({ name: "Hidden notes" });
    var ln = d.pages[0].graphicLines.add({ itemLayer: ly, geometricBounds: [200, 36, 200, 400] });
    ln.textPaths.add({ contents: "SIERRA text on a path." });
    ly.visible = false;
  });
  run("R05_threaded", function (d) {
    // the frame comes first: layers.add makes the new layer active
    var a = frame(d, 120, "TANGO first frame, normal layer.\rUNIFORM second frame, locked layer.");
    a.geometricBounds = [120, 36, 136, 400];
    var ly = d.layers.add({ name: "Locked notes" });
    var b = frame(d, 200, "", ly);
    a.nextTextFrame = b;
    ly.locked = true;
    out.push("R05 frame 1 on " + a.itemLayer.name + ", frame 2 on " + b.itemLayer.name + ": " + b.contents);
  });
  run("R06_parent_page", function (d) {
    var ly = d.layers.add({ name: "Locked notes" });
    d.masterSpreads[0].pages[0].textFrames.add({ geometricBounds: [300, 36, 350, 400], itemLayer: ly, contents: "VICTOR parent page text." });
    ly.locked = true;
  });
  run("R07_visible_control", function (d) {
    // negative control for R02-R04: group, anchored frame and path text on a normal layer
    var a = frame(d, 120, "Grouped one."), b = frame(d, 200, "Grouped two.");
    d.pages[0].groups.add([a, b]);
    var host = frame(d, 280, "Host.");
    host.insertionPoints[-1].textFrames.add({ geometricBounds: [0, 0, 20, 100], contents: "Anchored." });
    var ln = d.pages[0].graphicLines.add({ geometricBounds: [400, 36, 400, 400] });
    ln.textPaths.add({ contents: "Path." });
    var ly = d.layers.add({ name: "Locked empty" });
    ly.locked = true;
  });

  // XML with a table
  function taggedTable(d) {
    var tf = frame(d, 120, "");
    tf.geometricBounds = [120, 36, 300, 400];
    var tb = tf.parentStory.insertionPoints[-1].tables.add({ bodyRowCount: 2, columnCount: 2 });
    tb.cells[0].contents = "WHISKEY cell one";
    tb.cells[1].contents = "XRAY cell two";
    var tag = d.xmlTags.add("Story1");
    tf.markup(d.xmlElements[0].xmlElements.add(tag));
    var tTable = d.xmlTags.add("Table1"), tCell = d.xmlTags.add("Cell1");
    tb.markup(d.xmlElements[0].xmlElements[0].xmlElements.add(tTable));
    return tf;
  }
  run("R08_table_deleted", function (d) { taggedTable(d).remove(); });
  run("R09_table_placed", function (d) { taggedTable(d); });

  // Conditions
  run("R10_two_conditions", function (d) {
    var st = frame(d, 120, "Text. YANKEE visible and hidden. ZULU both hidden. End.").parentStory;
    var v = d.conditions.add({ name: "Shown", visible: true });
    var h = d.conditions.add({ name: "Internal review", visible: true });
    var h2 = d.conditions.add({ name: "Old", visible: true });
    range(st, "YANKEE visible and hidden.").applyConditions([v, h]);
    range(st, "ZULU both hidden.").applyConditions([h, h2]);
    h.visible = false;
    h2.visible = false;
  });
  run("R11_condition_and_change", function (d) {
    var st = frame(d, 120, "Text. AMBER hidden then edited. End.").parentStory;
    var h = d.conditions.add({ name: "Internal", visible: true });
    range(st, "AMBER hidden then edited.").applyConditions([h]);
    st.trackChanges = true;
    range(st, "then ").remove();
    st.insertionPoints[st.contents.indexOf("edited")].contents = "BRONZE ";
    st.trackChanges = false;
    h.visible = false;
  });
  run("R12_hidden_anchor", function (d) {
    var st = frame(d, 120, "Text before. After.").parentStory;
    var h = d.conditions.add({ name: "Internal", visible: true });
    var ip = st.insertionPoints[13];
    ip.textFrames.add({ geometricBounds: [0, 0, 20, 100], contents: "COPPER anchored in hidden text." });
    st.characters[13].applyConditions([h]);
    h.visible = false;
  });

  // Tables, footnotes, notes
  run("R13_cell_footnote_note", function (d) {
    var ly = d.layers.add({ name: "Locked notes" });
    var tf = frame(d, 120, "Body start. Body end.", ly);
    tf.geometricBounds = [120, 36, 400, 400];
    var st = tf.parentStory;
    var fn = st.insertionPoints[11].footnotes.add();
    fn.insertionPoints[-1].contents = "DELFT footnote.";
    var nt = st.insertionPoints[5].notes.add();
    nt.texts[0].contents = "EMBER editorial note.";
    var tb = st.insertionPoints[-1].tables.add({ bodyRowCount: 1, columnCount: 2 });
    tb.cells[0].contents = "FLINT cell one";
    tb.cells[1].contents = "GARNET cell two";
    ly.locked = true;
  });
  run("R14_note_only", function (d) {
    var st = frame(d, 120, "Body start. Body end.").parentStory;
    var nt = st.insertionPoints[5].notes.add();
    nt.texts[0].contents = "EMBER editorial note.";
  });
  run("R15_change_in_cell_footnote", function (d) {
    var tf = frame(d, 120, "Body start. Body end.");
    tf.geometricBounds = [120, 36, 400, 400];
    var st = tf.parentStory;
    var fn = st.insertionPoints[11].footnotes.add();
    fn.insertionPoints[-1].contents = "Footnote.";
    var tb = st.insertionPoints[-1].tables.add({ bodyRowCount: 1, columnCount: 1 });
    tb.cells[0].contents = "Cell.";
    st.trackChanges = true;
    tb.cells[0].insertionPoints[-1].contents = " HAZEL cell edit.";
    fn.insertionPoints[-1].contents = " INDIGO footnote edit.";
    st.trackChanges = false;
  });
  run("R16_moved", function (d) {
    var st = frame(d, 120, "First part. JASPER moved text. Last part.").parentStory;
    st.trackChanges = true;
    range(st, "JASPER moved text. ").move(LocationOptions.AT_END, st);
    st.trackChanges = false;
    for (var i = 0; i < st.changes.length; i++) out.push("R16 change " + i + ": " + st.changes[i].changeType.toString());
  });
} finally {
  app.scriptPreferences.userInteractionLevel = prevUI;
}
out.join("\n");
