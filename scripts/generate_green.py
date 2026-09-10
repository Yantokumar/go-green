"""
GoGreen — GitHub Contribution Full Calendar Generator
Generates realistic, continuous backdated commits covering every day from 2025-01-01 to 2026-09-10.
"""

import os
import sys
import time
import random
import datetime
import subprocess

REPO_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

AUTHOR_NAME = "Bahrudin Yusup Caruban"
AUTHOR_EMAIL = "162004752+Yantokumar@users.noreply.github.com"
AUTHOR_HEADER = f"{AUTHOR_NAME} <{AUTHOR_EMAIL}>"

START_DATE = datetime.date(2025, 1, 1)
END_DATE = datetime.date(2026, 9, 10)

MESSAGES = [
    "feat: add contribution matrix canvas",
    "refactor: optimize grid render speed",
    "style: polish dark-mode theme variables",
    "fix: handle timezone offsets for international users",
    "docs: clarify installation steps in README",
    "perf: memoize active streak calculation",
    "feat: implement synthesizer chime on click",
    "style: add pulse animation to brand dot",
    "refactor: extract audio synthesizer into modular helper",
    "feat: support custom Cyberpunk neon color palette",
    "perf: minimize DOM reflow during drag paint",
    "fix: preserve brush selection on palette switch",
    "docs: update API notes for commit export",
    "feat: add export script generator for Python and Bash",
    "test: unit test streak counter edge cases",
    "style: adjust card glow drop-shadows",
    "refactor: clean up event listeners on grid canvas",
    "feat: add solar amber and moss teal theme palettes",
    "fix: avoid duplicate mark references in fast-import stream",
    "docs: add architecture diagram for contribution engine",
    "feat: add automated streak visualizer",
    "perf: optimize memory footprint for long streaks",
    "style: improve mobile responsive layout for small screens",
    "chore: update project dependencies and metadata",
]

def generate_commits():
    current = START_DATE
    one_day = datetime.timedelta(days=1)
    
    stream = []
    mark_id = 1
    
    # Read current project files to include in git tree
    file_manifest = {}
    for filename in ["index.html", "style.css", "app.js", "README.md", "LICENSE"]:
        filepath = os.path.join(REPO_DIR, filename)
        if os.path.exists(filepath):
            with open(filepath, "rb") as f:
                file_manifest[filename] = f.read()

    log_history = []
    total_days = 0
    total_commits = 0

    print(f"Generating commit stream from {START_DATE} to {END_DATE}...")

    while current <= END_DATE:
        total_days += 1
        # 2 to 7 commits per day
        commits_today = random.randint(2, 7)
        
        # Pick hours spaced out realistically between 8:00 and 23:30
        hours = sorted(random.sample(range(8, 23), commits_today))
        
        for h in hours:
            m = random.randint(0, 59)
            s = random.randint(0, 59)
            dt = datetime.datetime(current.year, current.month, current.day, h, m, s)
            ts = int(dt.timestamp())
            
            msg = random.choice(MESSAGES)
            log_line = f"{dt.isoformat()}+07:00 | commit #{mark_id} | {msg}\n"
            log_history.append(log_line)
            
            stream.append(f"commit refs/heads/main")
            stream.append(f"mark :{mark_id}")
            stream.append(f"author {AUTHOR_HEADER} {ts} +0700")
            stream.append(f"committer {AUTHOR_HEADER} {ts} +0700")
            stream.append(f"data {len(msg.encode('utf-8'))}\n{msg}")
            
            if mark_id > 1:
                stream.append(f"from :{mark_id - 1}")
            
            # File modification
            activity_content = "".join(log_history[-50:]).encode("utf-8")
            stream.append("M 644 inline ACTIVITY.log")
            stream.append(f"data {len(activity_content)}\n" + activity_content.decode("latin1"))
            
            # On last 10 commits, ensure all core project files are explicitly tracked in tree
            if current == END_DATE:
                for fname, fbytes in file_manifest.items():
                    stream.append(f"M 644 inline {fname}")
                    stream.append(f"data {len(fbytes)}\n" + fbytes.decode("latin1"))
            
            mark_id += 1
            total_commits += 1
        
        current += one_day

    full_stream_bytes = ("\n".join(stream) + "\n").encode("latin1")
    print(f"Total days: {total_days} days")
    print(f"Total commits generated: {total_commits} commits")
    print(f"Feeding {len(full_stream_bytes) / 1024 / 1024:.2f} MB stream to git fast-import...")

    t0 = time.time()
    proc = subprocess.Popen(
        ["git", "fast-import", "--quiet"],
        cwd=REPO_DIR,
        stdin=subprocess.PIPE
    )
    proc.communicate(input=full_stream_bytes)
    
    if proc.returncode != 0:
        print(f"Error: git fast-import failed with code {proc.returncode}")
        sys.exit(proc.returncode)

    elapsed = time.time() - t0
    print(f"Successfully imported {total_commits} commits in {elapsed:.2f} seconds!")

    # Checkout and reset to main
    subprocess.run(["git", "checkout", "-B", "main"], cwd=REPO_DIR, check=True)
    subprocess.run(["git", "reset", "--hard", "refs/heads/main"], cwd=REPO_DIR, check=True)
    print("Working directory updated to latest main branch.")

if __name__ == "__main__":
    generate_commits()
