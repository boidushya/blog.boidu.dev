import { sungWords } from "@/utils/sung";
import { memo } from "react";

function Letters({ word, long, lit }: { word: string; long: boolean; lit?: boolean }) {
  return (
    <span className={lit ? "sung-letters sung-lit" : "sung-letters"}>
      {Array.from(word, (char, i) => (
        <span
          key={i}
          className={long ? "sung-letter sung-letter--long" : "sung-letter"}
          data-char={lit ? char : undefined}
        >
          {lit ? null : char}
        </span>
      ))}
    </span>
  );
}

export const SungTitle = memo(function SungTitle({ title }: { title: string }) {
  return (
    <span className="sung">
      <span className="sung-spoken">{title}</span>
      <span aria-hidden="true" inert>
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
    </span>
  );
});
