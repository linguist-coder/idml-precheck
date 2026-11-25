"""expected result for each malformed copy. usage: test_malformed.py <dir made by make_malformed.py>"""
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
EXPECTED = {  # file: (number of findings, exit code)
    "P01_dir_entry.idml": (1, 1),
    "P02_missing_story.idml": (0, 2),
    "P03_no_story_element.idml": (0, 2),
    "P04_repeated_anchor.idml": (1, 1),
    "P05_cycle.idml": (1, 1),
}
failed = 0
for name, want in EXPECTED.items():
    path = os.path.join(sys.argv[1], name)
    if not os.path.isfile(path):
        print(name, "FAIL, file not found")
        failed += 1
        continue
    r = subprocess.run([sys.executable, "-I", os.path.join(HERE, os.pardir, "idml_precheck.py"),
                        path], capture_output=True, text=True)
    got = (sum(line.startswith("  [") for line in r.stdout.splitlines()), r.returncode)
    failed += got != want
    print(name, got, "ok" if got == want else "FAIL, expected %s" % (want,))
sys.exit(1 if failed else 0)
