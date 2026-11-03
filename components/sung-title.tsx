import { sungWords } from "@/utils/sung";

function Letters({ word, long, lit }: { word: string; long: boolean; lit?: boolean }) {
  return (
    <span className={lit ? "sung-letters sung-lit" : "sung-letters"} aria-hidden={lit || undefined}>
      {Array.from(word, (char, i) => (
        <span key={i} className={long ? "sung-letter sung-letter--long" : "sung-letter"}>
          {char}
        </span>
      ))}
    </span>
  );
}

export function SungTitle({ title }: { title: string }) {
  return (
    <span className="sung">
      {sungWords(title).map(({ word, long }, i) => (
        <span key={i}>
          {i > 0 && " "}
          <span className="sung-word">
            <Letters word={word} long={long} />
            <Letters word={word} long={long} lit />
          </span>
        </span>
      ))}
    </span>
  );
}
