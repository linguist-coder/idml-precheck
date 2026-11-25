"""repackaged copies for malformed-IDML probes. usage: make_malformed.py <idml dir> <out dir>"""
import os
import re
import sys
import zipfile

src, out = sys.argv[1:3]
os.makedirs(out, exist_ok=True)


def repack(name, base, edit=lambda n, b: b, extra=()):
    with zipfile.ZipFile(os.path.join(src, base)) as z, zipfile.ZipFile(os.path.join(out, name), "w") as w:
        for n, b in extra:
            w.writestr(n, b)
        for n in z.namelist():
            b = edit(n, z.read(n))
            if b is not None:
                w.writestr(n, b)


repack("P01_dir_entry.idml", "T2_locked_layer.idml", extra=[("Stories/", b"")])
repack("P02_missing_story.idml", "T2_locked_layer.idml",
       lambda n, b: None if n == "Stories/Story_ue1.xml" else b)
repack("P03_no_story_element.idml", "T2_locked_layer.idml",
       lambda n, b: b"<x/>" if n == "Stories/Story_ue1.xml" else b)


def dup(n, b):
    """Repeat the anchored frame of R12 inside the hidden block."""
    if not n.startswith("Stories/"):
        return b
    s = b.decode("utf-8")
    m = re.search(r"<TextFrame .*?</TextFrame>", s, re.S)
    return s.replace(m.group(0), m.group(0) * 2).encode("utf-8") if m else b


repack("P04_repeated_anchor.idml", "R12_hidden_anchor.idml", dup)


def cycle(n, b):
    """Put a frame of the host story into the anchored story of R12."""
    s = b.decode("utf-8", "replace")
    if n.startswith("Stories/") and "COPPER" in s:
        return s.replace("</Content>", "</Content><TextFrame Self='x1' ParentStory='uf8'/>", 1).encode("utf-8")
    return b


repack("P05_cycle.idml", "R12_hidden_anchor.idml", cycle)
