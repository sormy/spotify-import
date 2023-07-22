function getAccessToken() {
  const rootEl = document.querySelector("#main");
  const reactRoot = rootEl?._reactRootContainer?._internalRoot?.current;
  const store = reactRoot?.memoizedState?.element?.props?.store;
  const state = store?.getState();
  return state?.session?.accessToken;
}

async function invokeAPI({ endpoint, method, body }) {
  const token = getAccessToken();
  const res = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${token}` },
    method,
    body: JSON.stringify(body),
  });
  return await res.json();
}

async function getAllTracks() {
  const pages = [];
  const limit = 50; // max available
  let next = `https://api.spotify.com/v1/me/tracks?limit=${limit}`;
  do {
    const result = await invokeAPI({ endpoint: next, method: "GET" });
    next = result.next;
    pages.push(result.items);
  } while (next);
  return pages.flat();
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

async function spotifyExportTracksAsJson() {
  const data = await getAllTracks();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  downloadFile(blob, "spotify-music.json");
}

spotifyExportTracksAsJson();
