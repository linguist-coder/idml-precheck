// a frame that is itself locked / hidden on a normal layer (R17), and the Object menu names.
// Works only on a document it creates and closes it by reference.
// Change this to an existing folder before you run the script.
var DIR = "C:/idml-precheck-tests/";
var prevUI = app.scriptPreferences.userInteractionLevel;
app.scriptPreferences.userInteractionLevel = UserInteractionLevels.NEVER_INTERACT;
var out = [];
try {
  var d = app.documents.add(false);
  d.pages[0].textFrames.add({ geometricBounds: [36, 36, 80, 400], contents: "ALPHA baseline text for R17." });
  var a = d.pages[0].textFrames.add({ geometricBounds: [120, 36, 160, 400], contents: "KELP locked frame." });
  var b = d.pages[0].textFrames.add({ geometricBounds: [200, 36, 240, 400], contents: "LILAC hidden frame." });
  a.locked = true;
  b.visible = false;
  d.save(File(DIR + "R17_frame_locked_hidden.indd"));
  d.exportFile(ExportFormat.INDESIGN_MARKUP, File(DIR + "R17_frame_locked_hidden.idml"), false);
  d.close(SaveOptions.NO);
  out.push("R17: saved");
  var obj = app.menus.item("$ID/Main").submenus.everyItem().getElements();
  for (var i = 0; i < obj.length; i++) {
    if (obj[i].title.replace(/&/g, "") !== "Object") continue;
    var its = obj[i].menuItems.everyItem().getElements();
    for (var k = 0; k < its.length; k++) {
      var t = its[k].title.replace(/&/g, "");
      if (/lock|hide|show/i.test(t)) out.push("Object > " + t);
    }
  }
} catch (e) {
  out.push("ERROR line " + e.line + ": " + e.message);
} finally {
  app.scriptPreferences.userInteractionLevel = prevUI;
}
out.join("\n");
