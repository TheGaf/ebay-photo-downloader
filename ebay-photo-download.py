#!/usr/bin/env python3
"""
eBay Photo Rescue — Downloader

Usage:
    python3 ebay-photo-download.py
or:
    python3 ebay-photo-download.py /path/to/ebay-photo-recovery.json

Defaults:
    Input:  ~/Downloads/ebay-photo-recovery.json
    Output: ~/Downloads/ebay-photo-archive
"""

import json
import os
import re
import sys
import urllib.request
from pathlib import Path

src = Path(
    os.path.expanduser(
        sys.argv[1] if len(sys.argv) > 1
        else "~/Downloads/ebay-photo-recovery.json"
    )
)

out = Path(os.path.expanduser("~/Downloads/ebay-photo-archive"))
out.mkdir(parents=True, exist_ok=True)

if not src.exists():
    raise SystemExit(f"Missing JSON file: {src}")

with src.open("r", encoding="utf-8") as f:
    listings = json.load(f)

def safe_name(s: str) -> str:
    s = re.sub(r'[/:*?"<>|]', "-", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s[:140]

downloaded = 0
skipped = 0
errors = 0

for idx, listing in enumerate(listings, 1):
    title = safe_name(listing.get("title", f"listing-{idx}"))
    photos = listing.get("photos", [])

    folder = out / f"{idx:02d} - {title}"
    folder.mkdir(exist_ok=True)

    print(f"[{idx:02d}/{len(listings)}] {title}")

    for n, url in enumerate(photos, 1):
        ext = os.path.splitext(url)[1].lower() or ".jpg"
        dest = folder / f"photo-{n:02d}{ext}"

        if dest.exists() and dest.stat().st_size > 0:
            print(f"   skip {dest.name}")
            skipped += 1
            continue

        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "Mozilla/5.0"}
            )
            with urllib.request.urlopen(req, timeout=30) as r, dest.open("wb") as f:
                f.write(r.read())

            print(f"   {dest.name}")
            downloaded += 1

        except Exception as e:
            print(f"   ERROR {url}: {e}")
            errors += 1

print()
print(f"Done: {out}")
print(f"Downloaded: {downloaded} | Skipped: {skipped} | Errors: {errors}")
