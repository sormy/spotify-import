import { Track } from "./model";
import { parseDuration, readCsvFile, readTsvFile } from "./utils";

export function readTextTracks(filename: string, id: string = "txt") {
  const tracks = /\.tsv$/.test(filename)
    ? readTsvFile(filename)
    : readCsvFile(filename);

  if (tracks.length === 0) {
    throw new Error(`Unable to find any rows in file: ${filename}`);
  }

  const firstRow = Object.keys(tracks[0]);

  const artistCol = firstRow.find((name) => /^(artist|performer)$/i.test(name));
  const nameCol = firstRow.find((name) => /^(title)$/i.test(name));
  const albumCol = firstRow.find((name) => /^(album)$/i.test(name));
  const durationCol = firstRow.find((name) => /^(duration|time)$/i.test(name));

  return tracks.map((track, index) => ({
    id: `${id}-${index + 1}`,
    artist: artistCol ? track[artistCol] : "unknown",
    name: nameCol ? track[nameCol] : "unknown",
    album: albumCol ? track[albumCol] : undefined,
    duration: durationCol ? parseDuration(track[durationCol]) : undefined,
  })) as Track[];
}
