// biome-ignore lint/correctness/noUnusedVariables: <explanation>
function copyText(text, el) {
  navigator.clipboard.writeText(text).then(() => {
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
