// try to produce nested <Change> elements (RWS thread 9663).
// User A inserts text with tracking on; user B then deletes part of it (T1c) or inserts inside it (T1d).
// app.userName is read first and restored at the end.
// Change this to an existing folder before you run the script.
var DIR = "C:/idml-precheck-tests/";
var prevUI = app.scriptPreferences.userInteractionLevel;
app.scriptPreferences.userInteractionLevel = UserInteractionLevels.NEVER_INTERACT;
var prevUser = app.userName;
var out = ["userName before: " + prevUser];

function build(name, secondStep) {
  var d = app.documents.add(false);
  var tf = d.pages[0].textFrames.add({ geometricBounds: [36, 36, 120, 400], contents: "ALPHA baseline text for " + name + "." });
  var st = tf.parentStory;
  app.userName = "Editor A";
  st.trackChanges = true;
  st.insertionPoints[-1].contents = " DELTA outer ECHO inner FOXTROT end.";
  app.userName = "Editor B";
  secondStep(st);
  st.trackChanges = false;
  out.push(name + " changes: " + st.changes.length);
  d.save(File(DIR + name + ".indd"));
  d.exportFile(ExportFormat.INDESIGN_MARKUP, File(DIR + name + ".idml"), false);
  d.close(SaveOptions.NO);
}

try {
  build("T1c_nested_delete", function (st) {
    var f = st.contents.indexOf("ECHO inner ");
    st.characters.itemByRange(f, f + "ECHO inner ".length - 1).remove();
  });
  build("T1d_nested_insert", function (st) {
    var f = st.contents.indexOf("FOXTROT");
    st.insertionPoints[f].contents = "GOLF added by B ";
  });
} catch (e) {
  out.push("ERROR line " + e.line + ": " + e.message);
} finally {
  app.userName = prevUser;
  app.scriptPreferences.userInteractionLevel = prevUI;
  out.push("userName after: " + app.userName);
}
out.join("\n");
