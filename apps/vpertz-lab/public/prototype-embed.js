if (new URLSearchParams(location.search).has("embed")) {
  const page = document.currentScript?.dataset.page || "";
  document.body.classList.add("vplab-embed");
  addEventListener("load", () => {
    const send = () => parent.postMessage({
      type: "vplab-prototype-height",
      page,
      height: document.documentElement.scrollHeight
    }, location.origin);
    new ResizeObserver(send).observe(document.documentElement);
    send();
  });
}
