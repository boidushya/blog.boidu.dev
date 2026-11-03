function copyText(el) {
  const text = el.getAttribute("data-code");
  navigator.clipboard.writeText(text).then(() => {
    announce("Copied");
    el.classList.add("copied");
    setTimeout(() => {
      el.classList.remove("copied");
      el.classList.add("copy-complete");
      setTimeout(() => {
        el.classList.remove("copy-complete");
      }, 500);
    }, 2000);
  });
}

function announce(message) {
  let region = document.getElementById("announcer");
  if (!region) {
    region = Object.assign(document.createElement("div"), { id: "announcer", className: "sr-only" });
    region.setAttribute("aria-live", "polite");
    document.body.append(region);
  }
  region.textContent = "";
  setTimeout(() => {
    region.textContent = message;
  }, 50);
}

document.addEventListener("click", event => {
  const button = event.target.closest?.("button.copy[data-code]");
  if (button) copyText(button);
});
