# eBay Photo Rescue

A tiny two-part tool for recovering photos from your own unsold / ended eBay listings while eBay still has them available.

## Part 1 — Collect the photo URLs in Chrome

1. In eBay Seller Hub, filter to the ended / unsold listings you want.
2. Select them.
3. Click **Sell similar** to open eBay's bulk editor.
4. Open Chrome DevTools (`Option + Command + I` on Mac).
5. Open **Console**.
6. Make sure the Console context says **top**.
7. Paste the contents of `ebay-photo-collector.js` and press Return.
8. Let it run. It opens each listing editor, collects its original full-size image URLs, and clicks **Done**.
9. Chrome will download `ebay-photo-recovery.json`.

It does not submit or relist anything.

## Part 2 — Download everything

Put `ebay-photo-download.py` anywhere convenient, then run:

    python3 ebay-photo-download.py

It expects:

    ~/Downloads/ebay-photo-recovery.json

and creates:

    ~/Downloads/ebay-photo-archive/

Each listing gets its own numbered folder.

You can also pass a different JSON file:

    python3 ebay-photo-download.py /path/to/ebay-photo-recovery.json

## Notes

- This relies on eBay's current bulk Sell Similar editor and may need adjustment if eBay changes the page.
- The collector stores progress in `window.ebayPhotoResults` while the page remains open.
- The downloader skips files that already exist, so rerunning it is safe.
