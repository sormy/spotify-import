alert(
  Object.entries(document.querySelector("#main"))
    .find(([k, v]) => k.startsWith("__reactContainer$"))[1]
    .memoizedState.element.props.store.getState()?.session?.accessToken,
);
