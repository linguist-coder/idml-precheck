#!/usr/bin/env python3
"""idml_precheck.py - list text in an IDML that a translation tool may drop or show by mistake.

Reads the IDML directly (it is a zip of XML files) and changes nothing.
InDesign is not needed. Python 3.8+ standard library only.

Reports:
  [tracked change]     changes in the text that were never accepted or rejected
  [layer]              stories with a frame or path on a locked or hidden layer
  [object]             stories in a frame, path or group locked or hidden in the Object menu
  [path text]          stories with a text path in the layout (some tools skip them)
  [unplaced XML text]  tagged text in the XML structure that is not on any page
  [hidden text]        conditional text that is hidden in this export

The quoted words are the start of the story or block, also when only a part of it is affected.

Usage:
  python idml_precheck.py file.idml [more.idml ...]

Exit code: 0 = nothing found, 1 = something found, 2 = file could not be read.
"""
import sys
import zipfile
import xml.etree.ElementTree as ET
from urllib.parse import unquote

BOM = chr(0xFEFF)
SEP = chr(31)  # marks cell and footnote edges; XML text can never contain it


def local(tag):
    return tag.rsplit("}", 1)[-1]


def name_of(ref):
    """'Condition/Internal%20review' -> 'Internal review'"""
    return unquote(ref.split("/", 1)[-1])


def nodes(el):
    """el and everything under it, without editorial notes."""
    yield el
    for child in el:
        if local(child.tag) != "Note":
            yield from nodes(child)


def text_of(el, skip=("Note",)):
    """Text under el. Editorial notes are left out, tracked deletions are marked."""
    parts = []
    for child in el:
        name = local(child.tag)
        if name in skip:
            continue
        if name == "Content":
            parts.append(child.text or "")
        elif name == "Br":
            parts.append(" ")
        elif name in ("Cell", "Footnote", "Endnote"):
            parts.append(SEP + text_of(child, skip) + SEP)
        elif name == "Change" and child.get("ChangeType") == "DeletedText":
            parts.append("[deleted: " + text_of(child, skip) + "]")
        else:
            parts.append(text_of(child, skip))
    return "".join(parts).replace(BOM, "")


def is_blank(raw):
    return not raw.replace(SEP, "").strip()


def excerpt(raw, n=70):
    pieces = [" ".join(p.split()) for p in raw.split(SEP)]
    s = " | ".join(p for p in pieces if p)
    if s:
        return '"' + (s if len(s) <= n else s[: n - 3] + "...") + '"'
    return "(spaces or line breaks only)" if raw else "(no plain text in this item)"


def read_parts(path):
    """The parts that designmap.xml lists. A listed part that is missing raises KeyError."""
    parts = {"Story": [], "Spread": [], "MasterSpread": [], "BackingStory": []}
    with zipfile.ZipFile(path) as z:
        design = ET.fromstring(z.read("designmap.xml"))
        for el in design.iter():
            if el.get("src") and local(el.tag) in parts:
                parts[local(el.tag)].append((el.get("src"), ET.fromstring(z.read(el.get("src")))))
    return design, parts


def check(path):
    findings = []
    design, parts = read_parts(path)
    layers = {el.get("Self"): el for el in design.iter() if local(el.tag) == "Layer"}

    stories = {}
    for n, root in parts["Story"]:
        # the file root is <idPkg:Story>, the story is the plain <Story> inside it
        found = [el for el in root.iter() if el.tag == "Story"]
        if not found:
            raise KeyError("no Story element in " + n)
        for el in found:
            stories[el.get("Self")] = (n, el)

    def anchored(el, seen):
        """(story id, what holds it) for the frames and paths under el, each story once."""
        for d in nodes(el):
            sid = d.get("ParentStory")
            if local(d.tag) in ("TextFrame", "TextPath") and sid in stories and sid not in seen:
                seen.add(sid)
                yield sid, "text on a path" if local(d.tag) == "TextPath" else "frame"
                yield from anchored(stories[sid][1], seen)

    # 1. Tracked changes
    for n, st in stories.values():
        for ch in nodes(st):
            if local(ch.tag) == "Change":
                user = ch.get("UserName", "").replace("$ID/", "")
                findings.append(("tracked change", f"{n}: {ch.get('ChangeType')} by {user}", text_of(ch)))

    # 2. Layers, locked or hidden objects, and text on a path. A frame or path takes its layer from
    #    itself, from the group or line around it, or, when it is anchored, from the story that holds it.
    containers = {}  # story id -> [(layer id, host story id, on a parent page, object states)]
    on_path = set()

    def walk(el, layer, host, parent_page, states=frozenset()):
        layer = el.get("ItemLayer") or layer
        if el.get("Visible") == "false":
            states = states | {"hidden"}
        if el.get("Locked") == "true":
            states = states | {"locked"}
        if el.get("ParentStory") and local(el.tag) in ("TextFrame", "TextPath"):
            containers.setdefault(el.get("ParentStory"), []).append((layer, host, parent_page, states))
            if local(el.tag) == "TextPath":
                on_path.add(el.get("ParentStory"))
        for child in el:
            walk(child, layer, host, parent_page, states)

    for _, root in parts["Spread"]:
        walk(root, None, None, False)
    for _, root in parts["MasterSpread"]:
        walk(root, None, None, True)
    for sid, (_, st) in stories.items():
        walk(st, None, sid, False)

    def places(sid, seen=()):
        """({(layer, on a parent page, object states)}, sure). Not sure = anchored in a host that is
        in different places, and the IDML does not say which of them holds the anchor."""
        found, sure = set(), True
        for layer, host, parent_page, states in containers.get(sid, []):
            if layer:
                found.add((layer, parent_page, states))
            elif host and host not in seen:
                up, up_sure = places(host, seen + (sid,))
                sure = sure and up_sure and len(up) < 2
                found |= {(a, b, c | states) for a, b, c in up}
        return found, sure

    for sid, (n, st) in stories.items():
        text = text_of(st)
        if is_blank(text):
            continue
        where, sure = places(sid)
        mixed = " (one of the story's containers)" if sure else " (not certain: the host story is in several frames)"
        for state in ("locked", "hidden"):
            hits = [state in states for _, _, states in where]
            if any(hits):
                part = "" if all(hits) else mixed
                findings.append(("object", f"{n}: frame, path or group is {state}{part}", text))
        for layer, parent_page in sorted({(a, b) for a, b, _ in where}):
            ly = layers.get(layer)
            if ly is None:
                continue
            flags = [w for w, on in (("locked", ly.get("Locked") == "true"),
                                     ("hidden", ly.get("Visible") == "false")) if on]
            if flags:
                note = " (parent page)" if parent_page else ""
                if len({a for a, _, _ in where}) > 1:
                    note += mixed
                findings.append(("layer", f"{n}: layer '{ly.get('Name')}' is {' and '.join(flags)}{note}", text))
        if sid in on_path and where:
            findings.append(("path text", f"{n}: story has a text path", text))

    # 3. Tagged text that is not on any page. The text of placed elements is in Stories/*.xml.
    #    A frame anchored in unplaced text keeps its own story, so that story is followed too.
    listed = set()

    def unplaced(el, trail, owner, n):
        if local(el.tag) == "XMLElement":
            trail = trail + [name_of(el.get("MarkupTag", ""))]
            linked = any(d is not el and d.get("XMLContent") for d in el.iter())
            owner = f"{' > '.join(trail)} (id {el.get('Self')})" + (" (has linked content inside)" if linked else "")
            own = text_of(el, skip=("Note", "XMLElement"))
            if not is_blank(own):
                findings.append(("unplaced XML text", f"{n}: {owner}", own))
        # the frames and paths right under this element belong to it; nested ones come with them
        if local(el.tag) in ("TextFrame", "TextPath"):
            for sid, what in anchored(el, set()):
                sn, st = stories[sid]
                if sid not in listed and not places(sid)[0] and not is_blank(text_of(st)):
                    listed.add(sid)
                    findings.append(("unplaced XML text", f"{sn}: {what} anchored in {owner}", text_of(st)))
        for child in el:
            unplaced(child, trail, owner, n)

    for n, root in parts["BackingStory"]:
        unplaced(root, [], "?", n)

    # 4. Conditional text that is hidden in this export, and the text of frames anchored in it
    def hidden(el, host, n):
        for child in el:
            if local(child.tag) == "Note":
                continue
            if local(child.tag) != "HiddenText":
                hidden(child, host, n)
                continue
            refs = {c for r in nodes(child) for c in (r.get("AppliedConditions") or "").split()}
            names = "conditions in this block: " + (", ".join(sorted(name_of(c) for c in refs)) or "?")
            inside = list(anchored(child, {host}))
            if text_of(child) or not inside:
                findings.append(("hidden text", f"{n}: {names}", text_of(child)))
            for sid, what in inside:
                sn, st = stories[sid]
                findings.append(("hidden text", f"{sn}: {what} anchored in hidden text, {names}", text_of(st)))

    for sid, (n, st) in stories.items():
        hidden(st, sid, n)
    return findings


def main(argv):
    # Sent to a file, the report may meet characters the system encoding does not have.
    sys.stdout.reconfigure(errors="backslashreplace")
    if len(argv) < 2:
        print(__doc__)
        return 2
    status = 0
    for path in argv[1:]:
        try:
            findings = check(path)
        except (OSError, zipfile.BadZipFile, KeyError, ET.ParseError, RecursionError) as e:
            print(f"{path}: cannot read ({e})")
            status = 2
            continue
        if not findings:
            print(f"{path}: nothing found")
            continue
        status = max(status, 1)
        print(f"{path}: {len(findings)} item(s)")
        for kind, where, text in findings:
            print(f"  [{kind}] {where}")
            print(f"      {excerpt(text)}")
    return status


if __name__ == "__main__":
    sys.exit(main(sys.argv))
