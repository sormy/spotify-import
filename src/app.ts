import chalk from "chalk";
import prompts from "prompts";
import { program } from "commander";

import { compareTrack } from "./compare";
import { Track } from "./model";
import {
  spotifyLikeTracks,
  spotifySearchTracks,
  spotifyGetLikedTracks,
} from "./spotify";
import { readTextTracks } from "./text";

function formatDuration(durationSec: number | undefined) {
  if (durationSec === undefined) {
    return "??:??";
  }
  return (
    `${Math.trunc(durationSec / 60)}` +
    ":" +
    `${durationSec % 60}`.padStart(2, "0")
  );
}

function containsTrack(
  track: Track,
  list: Track[],
  durationToleranceSec?: number,
) {
  return !!list.find((track2) =>
    compareTrack(track, track2, durationToleranceSec),
  );
}

function findMissingTracks(
  sourceList: Track[],
  targetList: Track[],
  durationToleranceSec?: number,
) {
  return sourceList.filter(
    (sourceTrack) =>
      !containsTrack(sourceTrack, targetList, durationToleranceSec),
  );
}

function formatTrack(track: Track) {
  return `${track.artist} -- ${track.name} [${formatDuration(
    track.duration,
  )}] (${track.album ?? "NO ALBUM"})`;
}

async function selectTrack(tracks: Track[]): Promise<string | undefined> {
  const response = await prompts({
    type: "select",
    name: "value",
    message: "Pick a track",
    choices: tracks.map((track) => ({
      title: formatTrack(track),
      value: track.id,
    })),
    initial: 0,
  });

  return response.value;
}

async function confirmTrack(track: Track): Promise<boolean> {
  const response = await prompts({
    type: "confirm",
    name: "value",
    message: `Confirm match: ${formatTrack(track)}`,
  });

  return response.value;
}

async function spotifyImportTracks(
  tracks: Track[],
  options: { unattended?: boolean; durationTolerance?: number } = {},
) {
  console.log("Loading Spotify tracks...");
  const spotifyTracks = await spotifyGetLikedTracks();
  console.log(`Spotify tracks: ${spotifyTracks.length}`);

  const spotifyIds = Object.fromEntries<boolean>(
    spotifyTracks.map((track) => [track.id, true]),
  );

  const missingTracks = findMissingTracks(
    tracks,
    spotifyTracks,
    options.durationTolerance,
  );
  let trackIndex = 0;
  for (const track of missingTracks) {
    console.log(
      `New track (${trackIndex + 1} / ${missingTracks.length}): ${formatTrack(
        track,
      )}`,
    );
    const foundTracks = await spotifySearchTracks(
      `${track.artist} -- ${track.name}`,
      20,
    );
    if (foundTracks.length) {
      const exactMatchedTrack = foundTracks.find((foundTrack) =>
        compareTrack(track, foundTrack, options.durationTolerance),
      );
      if (exactMatchedTrack) {
        if (spotifyIds[exactMatchedTrack.id]) {
          console.warn(
            `${chalk.yellow("⚠")} Exactly matched track is already added`,
          );
        } else {
          if (options.unattended) {
            console.log(
              `${chalk.green(
                "✔",
              )} Exactly matched track is being added: ${formatTrack(
                exactMatchedTrack,
              )}`,
            );
            await spotifyLikeTracks([exactMatchedTrack.id]);
            spotifyIds[exactMatchedTrack.id] = true;
          } else {
            const confirmed = await confirmTrack(exactMatchedTrack);
            if (confirmed) {
              await spotifyLikeTracks([exactMatchedTrack.id]);
              spotifyIds[exactMatchedTrack.id] = true;
            } else {
              console.warn(`${chalk.yellow("⚠")} Track has been skipped`);
            }
          }
        }
      } else {
        if (options.unattended) {
          console.warn(
            `${chalk.yellow(
              "⚠",
            )} Track has been skipped - requires manual action`,
          );
        } else {
          const selectedId = await selectTrack(foundTracks);
          if (selectedId) {
            if (spotifyIds[selectedId]) {
              console.warn(
                `${chalk.yellow("⚠")} Track has been already added`,
              );
            } else {
              await spotifyLikeTracks([selectedId]);
              spotifyIds[selectedId] = true;
            }
          } else {
            console.warn(`${chalk.yellow("⚠")} Track has been skipped`);
          }
        }
      }
    } else {
      console.error(`${chalk.red("✖")} Unable to match track`);
    }
    trackIndex += 1;
  }
}

function sortTracks(tracks: Track[]) {
  return tracks.sort((a, b) => {
    const artistDiff = a.artist.localeCompare(b.artist);
    return artistDiff !== 0 ? artistDiff : a.name.localeCompare(b.name);
  });
}

async function main() {
  program
    .option(
      "--unattended",
      "In unattended mode the app will import all it can confidently without asking questions",
      false,
    )
    .option(
      "--duration-tolerance <seconds>",
      "Max track duration difference that is still considered as exact match",
      (value) => parseInt(value),
      5,
    )
    .argument(
      "<filename>",
      "CSV/TSV text file with columns performer/artist, title, album, duration/time",
    );

  program.parse();

  const opts = program.opts<{
    unnatended: boolean;
    durationTolerance: number;
  }>();
  const args = program.args;

  const importFile = args[0];

  console.log(`Loading tracks from ${importFile}...`);
  const sourceTracks = readTextTracks(importFile);
  console.log(
    `Loaded tracks: ${sourceTracks.length} (with potential duplicates)`,
  );

  sortTracks(sourceTracks);

  console.log("Running import to Spotify...");
  await spotifyImportTracks(sourceTracks, opts);
}

main();
