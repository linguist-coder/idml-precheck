// build test documents T0-T4, save .indd and export .idml.
// Works only on documents it creates (documents.add(false)) and closes them by reference.
// Every case has a visible baseline paragraph plus marker words for the case, so the
// extracted text can be checked with a plain search.
// Change this to an existing folder before you run the script.
var DIR = "C:/idml-precheck-tests/";
Folder(DIR).create();
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
  var pg = d.pages[0];
  var props = { geometricBounds: [top, 36, top + 60, 400], contents: text };
  if (layer) props.itemLayer = layer;
  return pg.textFrames.add(props);
}
function finish(d, name) {
  d.save(File(DIR + name + ".indd"));
  d.exportFile(ExportFormat.INDESIGN_MARKUP, File(DIR + name + ".idml"), false);
  d.close(SaveOptions.NO);
  out.push(name + ": saved");
}

try {
  // T0: control
  var d = newDoc();
  frame(d, 36, "ALPHA baseline text for T0.");
  finish(d, "T0_control");

  // T1: tracked insertion and deletion, not accepted, tracking turned off
  d = newDoc();
  var tf = frame(d, 36, "ALPHA baseline text for T1. CHARLIE will be deleted.");
  var st = tf.parentStory;
  st.trackChanges = true;
  st.insertionPoints[-1].contents = " BRAVO was inserted.";
  var t = st.texts[0];
  var f = st.contents.indexOf("CHARLIE will be deleted.");
  st.characters.itemByRange(f, f + "CHARLIE will be deleted.".length - 1).remove();
  st.trackChanges = false;
  out.push("T1 changes: " + st.changes.length);
  finish(d, "T1_tracked");

  // T1b: nested: a tracked deletion inside a tracked insertion
  d = newDoc();
  tf = frame(d, 36, "ALPHA baseline text for T1b.");
  st = tf.parentStory;
  st.trackChanges = true;
  st.insertionPoints[-1].contents = " DELTA outer ECHO inner FOXTROT end.";
  var s = st.contents;
  f = s.indexOf("ECHO inner ");
  st.characters.itemByRange(f, f + "ECHO inner ".length - 1).remove();
  st.trackChanges = false;
  out.push("T1b changes: " + st.changes.length);
  finish(d, "T1b_nested");

  // T2: text on a locked layer
  d = newDoc();
  frame(d, 36, "ALPHA baseline text for T2.");
  var ly = d.layers.add({ name: "Locked notes" });
  frame(d, 120, "GOLF text on a locked layer.", ly);
  ly.locked = true;
  finish(d, "T2_locked_layer");

  // T3: tagged frame deleted, tagged text left in the XML structure
  d = newDoc();
  frame(d, 36, "ALPHA baseline text for T3.");
  var tag = d.xmlTags.add("Note");
  var tf3 = frame(d, 120, "HOTEL tagged text in a deleted frame.");
  tf3.markup(d.xmlElements[0].xmlElements.add(tag));
  tf3.remove();
  out.push("T3 xml children after delete: " + d.xmlElements[0].xmlElements.length +
    " / contents: " + (d.xmlElements[0].xmlElements.length ? d.xmlElements[0].xmlElements[0].contents : ""));
  finish(d, "T3_xml_leftover");

  // T4: hidden conditional text
  d = newDoc();
  tf = frame(d, 36, "ALPHA baseline text for T4. INDIA hidden condition text.");
  var cond = d.conditions.add({ name: "Internal", visible: true });
  st = tf.parentStory;
  f = st.contents.indexOf("INDIA hidden condition text.");
  st.characters.itemByRange(f, f + "INDIA hidden condition text.".length - 1).applyConditions([cond]);
  cond.visible = false;
  finish(d, "T4_hidden_condition");
} catch (e) {
  out.push("ERROR line " + e.line + ": " + e.message);
} finally {
  app.scriptPreferences.userInteractionLevel = prevUI;
}
out.join("\n");
