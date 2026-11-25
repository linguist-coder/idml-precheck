// T9: negative control for T8. Same formatted tagged frame, left on the page.
// Works only on a document it creates and closes it by reference.
// Change this to an existing folder before you run the script.
var DIR = "C:/idml-precheck-tests/";
var prevUI = app.scriptPreferences.userInteractionLevel;
app.scriptPreferences.userInteractionLevel = UserInteractionLevels.NEVER_INTERACT;
var out = [];
try {
  var d = app.documents.add(false);
  d.pages[0].textFrames.add({ geometricBounds: [36, 36, 96, 400], contents: "ALPHA baseline text for T9." });
  var ps = d.paragraphStyles.add({ name: "Head" });
  var cs = d.characterStyles.add({ name: "Strong" });
  var tf = d.pages[0].textFrames.add({ geometricBounds: [120, 36, 240, 400], contents: "KILO heading line.\rLIMA plain and MIKE strong words." });
  var st = tf.parentStory;
  st.paragraphs[0].appliedParagraphStyle = ps;
  var f = st.contents.indexOf("MIKE strong");
  st.characters.itemByRange(f, f + 10).appliedCharacterStyle = cs;
  tf.markup(d.xmlElements[0].xmlElements.add(d.xmlTags.add("Note")));
  out.push("placed: " + d.xmlElements[0].xmlElements[0].contents);
  d.save(File(DIR + "T9_styled_placed.indd"));
  d.exportFile(ExportFormat.INDESIGN_MARKUP, File(DIR + "T9_styled_placed.idml"), false);
  d.close(SaveOptions.NO);
} catch (e) {
  out.push("ERROR line " + e.line + ": " + e.message);
} finally {
  app.scriptPreferences.userInteractionLevel = prevUI;
}
out.join("\n");
