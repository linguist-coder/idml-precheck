# idml-precheck

Lists text in an IDML file that a translation tool may drop or show by mistake: tracked changes, hidden or locked layers and objects, text on a path, tagged text that is not on any page, and hidden conditional text.

It reads the IDML directly and changes nothing. InDesign is not needed. Python 3.8 or later, standard library only.

```
python idml_precheck.py brochure.idml
```

To save the report of a multilingual file on Windows, use UTF-8 in Command Prompt (PowerShell may convert the text again). Without it, characters outside the system encoding are written as escapes such as `\u0e23`.

```
python -X utf8 idml_precheck.py brochure.idml > report.txt
```

Exit code: 0 = nothing found, 1 = something found, 2 = a file could not be read.

What each entry means, and what to do about it:

- Video: https://youtu.be/n5rPnKggO0A
- Written guide: https://www.linguist-coder.com/2026/11/missing-or-extra-text-idml-translation.html

Download `idml_precheck.py` from the [latest release](https://github.com/linguist-coder/idml-precheck/releases/latest).

## Test results

49 IDML files, built with scripts in InDesign 21.6 on Windows. All of them went through the script and Okapi Tikal 1.48 (default settings). A dash in the Redokun column means the file was not uploaded there. Most files include a baseline paragraph. The table reports what happened to the text under test.

Words: "extracted" and "offered" mean the text came out as text to translate. "Refused" means the tool did not accept the file.

| File | What it holds | Okapi Tikal | Redokun | Script |
|---|---|---|---|---|
| T0_control | Nothing extra | Extracted | Offered | Nothing found |
| T1_tracked | An insertion and a deletion, Track Changes off again | Insertion extracted, deletion left out | Refused | 3 tracked changes |
| T1b_nested | A user deletes part of their own insertion | Remaining insertion extracted | - | 1 tracked change |
| T1c_nested_delete | A second user deletes inside an insertion | Accepted text extracted | Refused | 4 tracked changes, with users |
| T1d_nested_insert | A second user inserts inside an insertion | Accepted text extracted | Refused | 3 tracked changes, with users |
| T2_locked_layer | A frame on a locked layer | Extracted | Offered | Locked layer |
| T3_xml_leftover | A tagged frame, deleted | Not extracted | Not offered | Unplaced XML text |
| T4_hidden_condition | A hidden condition | Kept as a code | Offered | Hidden text |
| T5_tagged_placed | Control: a tagged frame on the page | Extracted | - | Nothing found |
| T6_untag_all | Leftover and placed text, every element untagged | Leftover not extracted | - | Unplaced XML text, in Root |
| T7_remove_orphan | Leftover and placed text, only the leftover deleted | Placed text extracted | - | Nothing found |
| T8_styled_leftover | A tagged frame with styled text, deleted | Not extracted | Not offered | Unplaced XML text |
| T9_styled_placed | Control: the T8 frame on the page | Extracted | - | Nothing found |
| R01_hidden_layer | A frame on a hidden layer | Not extracted | Offered | Hidden layer |
| R02_grouped | Grouped frames on a locked layer | Extracted | - | Locked layer, both frames |
| R03_anchored | Text on a hidden layer with an anchored frame | Anchored frame only | Offered, both | Hidden layer, both |
| R04_text_path | Text on a path on a hidden layer | Not extracted | Not offered | Hidden layer, path text |
| R05_threaded | A threaded story, second frame on a locked layer | Extracted | - | Locked layer, one of the story's containers |
| R06_parent_page | A frame on a locked layer on a parent page | Extracted | - | Locked layer, parent page |
| R07_visible_control | Group, anchored frame and text on a path, normal layer | Extracted | All offered except the text on the path | Path text |
| R08_table_deleted | A tagged table, frame deleted | Not extracted | - | Unplaced XML text, both cells |
| R09_table_placed | Control: a tagged table on the page | Extracted | - | Nothing found |
| R10_two_conditions | Two passages with two conditions each: one visible / both hidden | Extracted / kept as a code | Offered / offered | Nothing / hidden text |
| R11_condition_and_change | Tracked changes inside hidden text | Kept as a code | - | 2 tracked changes, hidden text |
| R12_hidden_anchor | A frame anchored in hidden text | Anchored frame extracted | Anchored frame offered | Hidden text |
| R13_cell_footnote_note | Footnote, table and editorial note on a locked layer | Extracted, without the note | - | Locked layer |
| R14_note_only | An editorial note | Note not extracted | - | Nothing found |
| R15_change_in_cell_footnote | Edits in a cell and a footnote, Track Changes on | Both edits extracted | - | 1 tracked change (the cell) |
| R16_moved | A passage moved with Track Changes on | Text in its new place only | - | 2 tracked changes |
| R17_frame_locked_hidden | One frame locked, one hidden (Object menu) | Locked frame only | Neither | Object locked, object hidden |
| R18a_before_remove | An unplaced element with a child linked to a frame | Frame text extracted, own text not | - | Unplaced XML text, linked content inside |
| R18_xml_parent_own_and_child | R18a after deleting that element by script: the frame is empty | Baseline only | - | Nothing found |
| R19_anchor_in_deleted_tagged | A frame anchored in a deleted tagged frame | Extracted | Not offered | Unplaced XML text |
| R19b_anchor_in_placed_tagged | Control: the R19 frame on the page | Extracted | - | Nothing found |
| R20_thread_anchor_layer | Anchors in both frames of a thread, second frame on a hidden layer | All extracted | - | Hidden layer: one of the story's containers, anchors not certain |
| R21_thread_anchor_hidden | The same thread, second frame hidden | All extracted | - | Object hidden: one of the story's containers, anchors not certain |
| R22_hidden_group | A hidden group, with a frame anchored in one of its frames | All extracted | All offered | Object hidden, all three |
| R23_condition_in_note | Hidden condition inside an editorial note | Note not extracted | - | Nothing found |
| R24_same_opening | Two leftovers with the same first 70 characters | Not extracted | - | 2 unplaced XML texts, different ids |
| R25_inner_outer | Two hidden conditions, one on part of the passage, and a tracked deletion | Kept as a code | - | 1 tracked change, hidden text |
| R26_pipes | A single "\|" as leftover and on a hidden layer | Not extracted | - | Unplaced XML text, hidden layer |
| R27a_before_remove | An unplaced element with an anchored frame and a child linked to a frame | Anchored text and frame text extracted | - | Unplaced XML text, linked content inside |
| R27_anchor_and_linked_child | R27a after deleting that element by script: the frame is empty and its tag is gone | Baseline only | - | Nothing found |
| R28_same_anchored_text | Two leftovers with the same anchored text | Both extracted | - | 2 unplaced XML texts, different ids |
| R29_anchored_path_deleted | A deleted tagged frame with an anchored line carrying text on a path | Path text extracted | - | Unplaced XML text, on a path |
| R30_empty_containers | An empty locked frame and an empty path at the end of two threads | All extracted | - | Object locked: one of the story's containers; path text |
| R31_frame_to_path | A thread from a frame to a path | All extracted | - | Path text |
| R32_unplaced_table_links | A deleted tagged frame with a tagged table | Not extracted | - | 3 unplaced XML texts, one with linked content inside (none of it is placed) |
| R33_locked_inherited | A locked group with a nested anchor, and a locked line with text on a path | All extracted | - | Object locked, all four; path text |

The results show these files in these versions and settings. Not tested: Trados Studio, memoQ and other CAT tools, InDesign versions other than 21.6, macOS, InCopy files, production files.

## Files in tests

- `idml`: the 49 files in the table.
- `build_*.jsx`: the InDesign scripts that made them. Change the folder at the top before you run one.
- `output-script.txt`: what `idml_precheck.py` printed for each file.
- `output-tikal.txt`: the source segments Okapi Tikal extracted.
- `make_malformed.py` and `test_malformed.py`: five damaged copies, and the expected result for each. `python tests/make_malformed.py tests/idml out`, then `python tests/test_malformed.py out`.

## Custom scripts

Need a script for your own InDesign or Illustrator task? See [Work with me](https://www.linguist-coder.com/work-with-me.html).

## License

MIT. See [LICENSE](LICENSE).
