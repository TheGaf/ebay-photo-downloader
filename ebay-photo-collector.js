/*
eBay Photo Rescue — Browser Collector
Run this from Chrome DevTools Console on eBay's bulk "Sell similar" page.
It will:
- find all selected listings via their edit buttons
- open each listing editor
- collect full-size eBay image URLs
- click Done
- download ebay-photo-recovery.json

It does NOT submit or relist anything.
*/

(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  async function waitFor(test, timeout = 15000, interval = 250) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        const result = test();
        if (result) return result;
      } catch {}
      await sleep(interval);
    }
    throw new Error("Timed out");
  }

  const getEditButtons = () =>
    [...document.querySelectorAll('button[aria-label^="edit item - "]')];

  const total = getEditButtons().length;
  if (!total) {
    throw new Error(
      'No listing edit buttons found. Make sure you are on the bulk "Sell similar" page and Console context is "top".'
    );
  }

  window.ebayPhotoResults = window.ebayPhotoResults || [];

  console.log(`eBay Photo Rescue: starting ${total} listings...`);

  for (let i = 0; i < total; i++) {
    if (window.ebayPhotoResults[i]) {
      console.log(`[${i + 1}/${total}] already collected`);
      continue;
    }

    const button = getEditButtons()[i];
    if (!button) throw new Error(`Missing edit button for listing ${i + 1}`);

    const title = button
      .getAttribute("aria-label")
      .replace(/^edit item - /, "")
      .trim();

    console.log(`[${i + 1}/${total}] ${title}`);
    button.click();

    await waitFor(() =>
      document.querySelector('iframe[name="editPaneFrame"]')
    );

    await waitFor(() => {
      const frame = document.querySelector('iframe[name="editPaneFrame"]');
      const perf = frame?.contentWindow?.performance;
      if (!perf) return false;

      return perf.getEntriesByType("resource")
        .some(x => x.name.includes("i.ebayimg.com/00/"));
    });

    await sleep(1200);

    const frame = document.querySelector('iframe[name="editPaneFrame"]');
    const perf = frame?.contentWindow?.performance;
    if (!perf) throw new Error(`No performance data for "${title}"`);

    const urls = [...new Set(
      perf.getEntriesByType("resource")
        .map(x => x.name)
        .filter(x => x.includes("i.ebayimg.com/00/"))
        .map(x => x.replace(/\$_(?:2|12|26|57)\./, "$_57."))
        .map(x => x.split("?")[0])
    )];

    window.ebayPhotoResults[i] = {
      index: i,
      title,
      photos: urls
    };

    console.log(`   ${urls.length} photos`);

    const done = [...document.querySelectorAll("button")]
      .find(b =>
        b.textContent.trim() === "Done" &&
        b.offsetParent !== null
      );

    if (!done) throw new Error(`No visible Done button for "${title}"`);
    done.click();

    await waitFor(() =>
      document.querySelectorAll('button[aria-label^="edit item - "]').length === total
    );

    await sleep(700);
  }

  const output = JSON.stringify(window.ebayPhotoResults, null, 2);
  const blob = new Blob([output], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = "ebay-photo-recovery.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  const totalPhotos = window.ebayPhotoResults
    .reduce((n, x) => n + (x?.photos?.length || 0), 0);

  console.log("DONE");
  console.log(`${window.ebayPhotoResults.length} listings / ${totalPhotos} photos`);
})();
