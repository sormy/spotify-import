import fetch from "node-fetch";
import { readJsonFile } from "./utils";
import chunk from "lodash.chunk";
import { Track } from "./model";

async function spotifyAPI(opts: {
  endpoint: string;
  method?: string;
  payload?: any;
}): Promise<any> {
  const token = process.env.SPOTIFY_TOKEN;
  const endpoint = opts.endpoint.startsWith("/")
    ? "https://api.spotify.com" + opts.endpoint
    : opts.endpoint;

  const res = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
      ...(opts.payload ? { "Content-Type": "application/json" } : {}),
    },
    method: opts.method ?? "GET",
    body: JSON.stringify(opts.payload),
  });

  const responseContentType = res.headers.get("Content-Type");
  const isJSON =
    responseContentType &&
    /^application\/json(;.*|$)/.test(responseContentType);

  if (!res.ok) {
    const message =
      (isJSON ? (await res.json())?.error?.message : await res.text()) ??
      "unknown";
    throw new Error(
      `Spotify API error: ${res.status} ${res.statusText}; ${message}`,
    );
  }

  if (isJSON) {
    return res.json();
  }
}

function spotifyConvertTrack(spotifyTrack: any) {
  return {
    id: spotifyTrack.id,
    artist: spotifyTrack.artists.map((artist: any) => artist.name).join(" & "),
    name: spotifyTrack.name,
    album: spotifyTrack.album.name,
    duration: Math.round(spotifyTrack.duration_ms / 1000),
  };
}

export async function spotifySearchTracks(
  query: string,
  limit?: number,
): Promise<Track[]> {
  const tracks = [];

  const paginate = limit === undefined ? true : false;
  const pageSize = limit === undefined ? 50 : limit;

  let endpoint = `/v1/search?q=${encodeURIComponent(
    query,
  )}&type=track&limit=${pageSize}`;

  do {
    const result = await spotifyAPI({ endpoint });
    endpoint = result.next;
    tracks.push(result.tracks.items);
  } while (paginate && endpoint);

  return tracks.flat().map((track) => spotifyConvertTrack(track));
}

export async function spotifyLikeTracks(ids: string[]) {
  for (const chunkIds of chunk(ids, 50)) {
    await spotifyAPI({
      endpoint: `/v1/me/tracks?ids=${chunkIds.join(",")}`,
      method: "PUT",
    });
  }
}

export async function spotifyGetLikedTracks(): Promise<Track[]> {
  const items = [];
  const limit = 50; // max available
  let endpoint = `https://api.spotify.com/v1/me/tracks?limit=${limit}`;

  do {
    const result = await spotifyAPI({ endpoint });
    endpoint = result.next;
    items.push(result.items);
  } while (endpoint);

  return items.flat().map((item) => spotifyConvertTrack(item.track));
}

export function spotifyReadTracks(filename: string): Track[] {
  return readJsonFile(filename).map((item: any) =>
    spotifyConvertTrack(item.track),
  );
}
