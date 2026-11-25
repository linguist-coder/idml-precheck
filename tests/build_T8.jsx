// T8: XML leftover with formatting. A tagged frame with two paragraphs (second one in its
// own paragraph style, one word with a character style) is deleted. Does the checker see it?
// Works only on a document it creates and closes it by reference.
// Change this to an existing folder before you run the script.
var DIR = "C:/idml-precheck-tests/";
var prevUI = app.scriptPreferences.userInteractionLevel;
app.scriptPreferences.userInteractionLevel = UserInteractionLevels.NEVER_INTERACT;
var out = [];
try {
  var d = app.documents.add(false);
  d.pages[0].textFrames.add({ geometricBounds: [36, 36, 96, 400], contents: "ALPHA baseline text for T8." });
  var ps = d.paragraphStyles.add({ name: "Head" });
  var cs = d.characterStyles.add({ name: "Strong" });
  var tf = d.pages[0].textFrames.add({ geometricBounds: [120, 36, 240, 400], contents: "KILO heading line.\rLIMA plain and MIKE strong words." });
  var st = tf.parentStory;
  st.paragraphs[0].appliedParagraphStyle = ps;
  var f = st.contents.indexOf("MIKE strong");
  st.characters.itemByRange(f, f + 10).appliedCharacterStyle = cs;
  tf.markup(d.xmlElements[0].xmlElements.add(d.xmlTags.add("Note")));
  tf.remove();
  out.push("leftover: " + d.xmlElements[0].xmlElements[0].contents);
  d.save(File(DIR + "T8_styled_leftover.indd"));
  d.exportFile(ExportFormat.INDESIGN_MARKUP, File(DIR + "T8_styled_leftover.idml"), false);
  d.close(SaveOptions.NO);
} catch (e) {
  out.push("ERROR line " + e.line + ": " + e.message);
} finally {
  app.scriptPreferences.userInteractionLevel = prevUI;
}
out.join("\n");
