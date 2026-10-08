#!/usr/bin/env python3
"""Download each player's Twitch profile picture into the repo.

For every data/players/<slug>/info.yaml with a `twitch` handle, looks up the
channel's profile image (via decapi.me, which needs no Twitch API token),
saves it as static/images/players/<slug>.<ext> and points `avatar` at it.
Players without a handle are left alone. Rerun whenever players change their
picture. Standard library only; run from the repo root:

    python3 scripts/fetch-avatars.py
"""

import re
import sys
import urllib.request
from pathlib import Path

PLAYERS_DIR = Path("data/players")
AVATAR_DIR = Path("static/images/players")
LOOKUP_URL = "https://decapi.me/twitch/avatar/{}"
USER_AGENT = "scadustats-site avatar fetcher"


def fetch(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=20) as response:
        return response.read()


def main() -> int:
    if not PLAYERS_DIR.is_dir():
        print("Run from the repo root (data/players not found).", file=sys.stderr)
        return 1
    AVATAR_DIR.mkdir(parents=True, exist_ok=True)

    failures = 0
    for info_path in sorted(PLAYERS_DIR.glob("*/info.yaml")):
        slug = info_path.parent.name
        info = info_path.read_text()
        handle = re.search(r"^twitch:\s*(\S+)\s*$", info, re.MULTILINE)
        if not handle or handle.group(1) in ("null", "~", "''", '""'):
            print(f"{slug}: no twitch handle, skipped")
            continue
        handle = handle.group(1).strip("'\"")

        try:
            image_url = fetch(LOOKUP_URL.format(handle)).decode().strip()
            if not image_url.startswith("https://"):
                raise ValueError(image_url)  # decapi reports errors as plain text
            image = fetch(image_url)
        except Exception as error:
            print(f"{slug}: failed ({error})", file=sys.stderr)
            failures += 1
            continue

        ext = Path(image_url.split("?")[0]).suffix.lower() or ".png"
        for old in AVATAR_DIR.glob(f"{slug}.*"):
            old.unlink()
        (AVATAR_DIR / f"{slug}{ext}").write_bytes(image)

        avatar = f"/images/players/{slug}{ext}"
        if re.search(r"^avatar:", info, re.MULTILINE):
            info = re.sub(r"^avatar:.*$", f"avatar: {avatar}", info, flags=re.MULTILINE)
        else:
            info = info.rstrip("\n") + f"\navatar: {avatar}\n"
        info_path.write_text(info)
        print(f"{slug}: {avatar}")

    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
