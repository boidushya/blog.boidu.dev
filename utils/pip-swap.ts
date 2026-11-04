const swapTimers = new WeakMap<HTMLElement, number>();

function layer(front: boolean) {
  const el = document.createElement("span");
  el.className = "pip-layer";
  el.dataset.front = String(front);
  return el;
}

function unit(text: string, index: number) {
  const el = document.createElement("span");
  el.className = "pip-unit";
  el.style.setProperty("--i", String(index));
  el.textContent = text;
  return el;
}

export function swapText(row: HTMLElement, units: string[], delay = 0) {
  if (!row.children.length) row.append(layer(true), layer(false));
  const [a, b] = Array.from(row.children) as HTMLElement[];
  const front = a.dataset.front === "true" ? a : b;
  const back = front === a ? b : a;
  if (front.childElementCount === units.length && front.textContent === units.join("")) return;
  const first = !front.childElementCount;
  row.setAttribute("data-swapping", "false");
  void row.offsetWidth;
  back.replaceChildren(...units.map(unit));
  back.dataset.front = "true";
  front.dataset.front = "false";
  if (first) {
    row.removeAttribute("data-swapping");
    return;
  }
  row.style.setProperty("--line-delay", `${delay}ms`);
  row.setAttribute("data-swapping", "true");
  window.clearTimeout(swapTimers.get(row));
  swapTimers.set(
    row,
    window.setTimeout(() => row.removeAttribute("data-swapping"), 620 + units.length * 45 + delay + 50)
  );
}

export function setRollingText(row: HTMLElement, text: string) {
  const chars = Array.from(text);
  while (row.children.length < chars.length) {
    const line = document.createElement("span");
    line.className = "pip-line";
    row.append(line);
  }
  while (row.children.length > chars.length) row.lastElementChild?.remove();
  chars.forEach((ch, i) => swapText(row.children[i] as HTMLElement, [ch]));
}
