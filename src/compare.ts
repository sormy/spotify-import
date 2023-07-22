// @ts-ignore
import soundex from "soundex";
import cyrillicToTranslit from "cyrillic-to-translit-js";
import { Track } from "./model";

const translit = cyrillicToTranslit({ preset: "ru" });

function isLatin(str: string) {
  return /^[a-z0-9._ '-]*$/i.test(str);
}

function normalizeName(str: string) {
  return str
    .replace(/[()\[\]._ '`"-]+/g, " ")
    .trim()
    .toLowerCase();
}

function compareName(name1: string, name2: string, enableFuzzyMatch?: boolean) {
  const latin1 = isLatin(name1);
  const latin2 = isLatin(name2);

  // convert to the same locale
  if ((latin1 && !latin2) || (!latin1 && latin2)) {
    name1 = latin1 ? name1 : translit.transform(name1);
    name2 = latin2 ? name2 : translit.transform(name2);
  }

  // convert to lower case
  name1 = name1.toLocaleLowerCase();
  name2 = name2.toLocaleLowerCase();

  if (name1 === name2) {
    return "exact";
  }

  if (normalizeName(name1) === normalizeName(name2)) {
    return "normalized";
  }

  if (latin1 && latin2 && soundex(name1) === soundex(name2)) {
    return "soundex";
  }

  if (enableFuzzyMatch) {
    const major1 = name1.replace(/( -| \(| \&| and |, pt\.).*/i, "");
    const major2 = name2.replace(/( -| \(| \&| and |, pt\.).*/i, "");
    if (major1 && major2 && major1 === major2) {
      return "fuzzy";
    }
  }

  return false;
}

function compareDuration(
  duration1: number,
  duration2: number,
  tolerance: number = 0,
) {
  const diff = Math.abs(duration1 - duration2);
  return diff === 0 ? "exact" : diff <= tolerance ? "fuzzy" : false;
}

export function compareTrack(
  track1: Track,
  track2: Track,
  durationToleranceSec?: number,
) {
  const artistMatch = compareName(track1.artist, track2.artist, true);
  const nameMatch = compareName(track1.name, track2.name, true);
  const albumMatch =
    track1.album && track2.album
      ? compareName(track1.album, track2.album, true)
      : false;
  const durationMatch =
    track1.duration && track2.duration
      ? compareDuration(track1.duration, track2.duration, durationToleranceSec)
      : false;

  if (
    artistMatch &&
    artistMatch !== "fuzzy" &&
    nameMatch &&
    nameMatch !== "fuzzy" &&
    durationMatch
  ) {
    return true;
  }

  if (artistMatch && nameMatch && albumMatch && durationMatch === "exact") {
    return true;
  }

  return false;
}
