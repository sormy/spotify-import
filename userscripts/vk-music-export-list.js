function csvEncode(value) {
  const encoded = value.replace(/"/g, '""');
  if (/[,\r\n"]/.test(encoded)) {
    return `"${encoded}"`;
  } else {
    return encoded;
  }
}

function csvCols(cols) {
  return cols.map((col) => csvEncode(col)).join(",");
}

function csvRows(rows) {
  return "" + rows.join("\r\n");
}

function downloadFile(blob, filename) {
  // Create a link and set the URL using `createObjectURL`
  const link = document.createElement("a");
  link.style.display = "none";
  link.href = URL.createObjectURL(blob);
  link.download = filename;

  // It needs to be added to the DOM so it can be clicked
  document.body.appendChild(link);
  link.click();

  // To make this work on Firefox we need to wait
  // a little while before removing it.
  setTimeout(() => {
    URL.revokeObjectURL(link.href);
    link.parentNode.removeChild(link);
  }, 0);
}

function getTracks() {
  const audioRows = [...document.querySelectorAll(".audio_row")];

  const audioTracks = audioRows.map((rowEl) => {
    const performer = rowEl.querySelector(".audio_row__performers").innerText;
    const title = rowEl.querySelector(".audio_row__title_inner").innerText;
    const duration = rowEl.querySelector(".audio_row__duration").innerText;
    return { performer, title, duration };
  });

  return audioTracks;
}

function vkExportTracksAsCsv() {
  const csv = csvRows([
    csvCols(["performer", "title", "duration"]),
    ...getTracks().map((audio) =>
      csvCols([audio.performer, audio.title, audio.duration]),
    ),
  ]);

  const bom = new Uint8Array(3);
  bom[0] = 0xef;
  bom[1] = 0xbb;
  bom[2] = 0xbf;

  const csvBlob = new Blob([bom, csv], { type: "text/csv" });

  downloadFile(csvBlob, "vk-music.csv");
}

function vkExportTracksAsTsv() {
  const tsv = [
    ["performer", "title", "duration"].join("\t"),
    ...getTracks().map((audio) =>
      [audio.performer, audio.title, audio.duration].join("\t"),
    ),
  ].join("\n");

  const csvBlob = new Blob([tsv], { type: "text/tab-separated-values" });

  downloadFile(csvBlob, "vk-music.tsv");
}

vkExportTracksAsCsv();
