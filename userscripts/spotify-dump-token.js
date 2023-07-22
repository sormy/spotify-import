alert(
  document
    .querySelector("#main")
    ._reactRootContainer._internalRoot.current.memoizedState.element.props.store.getState()
    .session.accessToken,
);
