// negative control: tagged text that IS placed in a frame (should not be reported).
// Change this to an existing folder before you run the script.
var DIR = "C:/idml-precheck-tests/";
var prevUI = app.scriptPreferences.userInteractionLevel;
app.scriptPreferences.userInteractionLevel = UserInteractionLevels.NEVER_INTERACT;
var out = "";
try {
  var d = app.documents.add(false);
  var pg = d.pages[0];
  pg.textFrames.add({ geometricBounds: [36, 36, 96, 400], contents: "ALPHA baseline text for T5." });
  var tag = d.xmlTags.add("Note");
  var tf = pg.textFrames.add({ geometricBounds: [120, 36, 180, 400], contents: "JULIET tagged text in a live frame." });
  tf.markup(d.xmlElements[0].xmlElements.add(tag));
  d.save(File(DIR + "T5_tagged_placed.indd"));
  d.exportFile(ExportFormat.INDESIGN_MARKUP, File(DIR + "T5_tagged_placed.idml"), false);
  d.close(SaveOptions.NO);
  out = "T5: saved";
} catch (e) {
  out = "ERROR line " + e.line + ": " + e.message;
} finally {
  app.scriptPreferences.userInteractionLevel = prevUI;
}
out;
