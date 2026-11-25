// how to clear tagged text left in the XML structure without losing placed text.
// Builds one document with a placed tagged frame (JULIET) and an orphan (HOTEL), then tries
// (a) untag every element and (b) remove only elements whose text is not in a frame.
// Change this to an existing folder before you run the script.
var DIR = "C:/idml-precheck-tests/";
var prevUI = app.scriptPreferences.userInteractionLevel;
app.scriptPreferences.userInteractionLevel = UserInteractionLevels.NEVER_INTERACT;
var out = [];
function build(name) {
  var d = app.documents.add(false);
  var pg = d.pages[0];
  var tag = d.xmlTags.add("Note");
  var live = pg.textFrames.add({ geometricBounds: [36, 36, 96, 400], contents: "JULIET tagged text in a live frame." });
  live.markup(d.xmlElements[0].xmlElements.add(tag));
  var gone = pg.textFrames.add({ geometricBounds: [120, 36, 180, 400], contents: "HOTEL tagged text in a deleted frame." });
  gone.markup(d.xmlElements[0].xmlElements.add(tag));
  gone.remove();
  return d;
}
function report(d, label) {
  var els = d.xmlElements[0].xmlElements, s = [];
  for (var i = 0; i < els.length; i++) s.push("[" + els[i].contents + "]");
  var txt = [];
  for (var j = 0; j < d.stories.length; j++) txt.push(d.stories[j].contents);
  out.push(label + " | elements: " + s.join(" ") + " | stories: " + txt.join(" / "));
}
try {
  var d = build("a");
  report(d, "before");
  // (a) untag all children of Root
  var els = d.xmlElements[0].xmlElements;
  for (var i = els.length - 1; i >= 0; i--) els[i].untag();
  report(d, "untag all");
  d.exportFile(ExportFormat.INDESIGN_MARKUP, File(DIR + "T6_untag_all.idml"), false);
  d.close(SaveOptions.NO);

  d = build("b");
  els = d.xmlElements[0].xmlElements;
  for (i = els.length - 1; i >= 0; i--) {
    var st = null;
    try { st = els[i].parentStory; } catch (e) {}
    var placed = st && st.constructor.name === "Story" && st.textContainers.length > 0;
    out.push("element " + i + " parentStory=" + (st ? st.constructor.name : "none") + " placed=" + placed);
    if (!placed) els[i].remove();
  }
  report(d, "remove orphan only");
  d.exportFile(ExportFormat.INDESIGN_MARKUP, File(DIR + "T7_remove_orphan.idml"), false);
  d.close(SaveOptions.NO);
} catch (e) {
  out.push("ERROR line " + e.line + ": " + e.message);
} finally {
  app.scriptPreferences.userInteractionLevel = prevUI;
}
out.join("\n");
