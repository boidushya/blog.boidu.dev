import type { Element, Root } from "hast";
import { toString } from "hast-util-to-string";
import type { BuiltinLanguage, BuiltinTheme } from "shiki";
import { bundledLanguages, getSingletonHighlighter } from "shiki";
/// <reference types="mdast-util-to-hast" />
import type { LanguageInput } from "shiki/core";
import type {
  CodeOptionsMeta,
  CodeOptionsThemes,
  CodeToHastOptions,
  HighlighterGeneric,
  TransformerOptions,
} from "shiki/core";
import type { Plugin } from "unified";
import type { Transformer } from "unified";
import { visit } from "unist-util-visit";

export interface MapLike<K = any, V = any> {
  get: (key: K) => V | undefined;
  set: (key: K, value: V) => this;
}

export interface RehypeShikiExtraOptions {
  /**
   * Add `language-*` class to code element
   *
   * @default false
   */
  addLanguageClass?: boolean;

  /**
   * The default language to use when is not specified
   */
  defaultLanguage?: string;

  /**
   * The fallback language to use when specified language is not loaded
   */
  fallbackLanguage?: string;

  /**
   * Custom meta string parser
   * Return an object to merge with `meta`
   */
  parseMetaString?: (metaString: string, node: Element, tree: Root) => Record<string, any> | undefined | null;

  /**
   * Custom map to cache transformed codeToHast result
   *
   * @default undefined
   */
  cache?: MapLike;

  /**
   * Chance to handle the error
   * If not provided, the error will be thrown
   */
  onError?: (error: unknown) => void;
}

export type RehypeShikiCoreOptions = CodeOptionsThemes<BuiltinTheme> &
  TransformerOptions &
  CodeOptionsMeta &
  RehypeShikiExtraOptions;

const languagePrefix = "language-";

function rehypeShikiFromHighlighter(
  highlighter: HighlighterGeneric<any, any>,
  options: RehypeShikiCoreOptions
): Transformer<Root, Root> {
  const langs = highlighter.getLoadedLanguages();
  const {
    addLanguageClass = false,
    parseMetaString,
    cache,
    defaultLanguage,
    fallbackLanguage,
    onError,
    ...rest
  } = options;

  return function (tree) {
    visit(tree, "element", (node, index, parent) => {
      if (!parent || index == null || node.tagName !== "pre") return;

      const head = node.children[0];

      if (!head || head.type !== "element" || head.tagName !== "code" || !head.properties) {
        return;
      }

      const classes = head.properties.className;
      const languageClass = Array.isArray(classes)
        ? classes.find(d => typeof d === "string" && d.startsWith(languagePrefix))
        : undefined;

      let lang =
        typeof languageClass === "string" ? languageClass.slice(languagePrefix.length) : (defaultLanguage as string);

      if (!lang) return;

      if (fallbackLanguage && !langs.includes(lang)) lang = fallbackLanguage;

      const code = toString(head);
      const cachedValue = cache?.get(code);

      if (cachedValue) {
        parent.children.splice(index, 1, ...cachedValue);
        return;
      }

      const metaString = head.data?.meta ?? head.properties.metastring?.toString() ?? "";
      const meta = parseMetaString?.(metaString, node, tree) || {};

      const codeOptions: CodeToHastOptions = {
        ...rest,
        lang,
        meta: {
          ...rest.meta,
          ...meta,
          __raw: metaString,
        },
      };

      if (addLanguageClass) {
        codeOptions.transformers ||= [];
        codeOptions.transformers.push({
          name: "rehype-shiki:code-language-class",
          code(node) {
            this.addClassToHast(node, `${languagePrefix}${lang}`);
            return node;
          },
        });
      }

      // Add new transformer for the copy button and language display

      codeOptions.transformers ||= [];
      codeOptions.transformers.push({
        name: "rehype-shiki:add-copy-button",
        pre(node) {
          const escapedCode = code.replace(/`/g, "\\`").replace(/\$/g, "\\$");

          const buttonElement: Element = {
            type: "element",
            tagName: "div",
            properties: { class: "highlight__before" },
            children: [
              {
                type: "element",
                tagName: "span",
                properties: {},
                children: [{ type: "text", value: lang }],
              },
              {
                type: "element",
                tagName: "button",
                properties: {
                  class: "copy",
                  "data-code": escapedCode,
                  onClick: `copyText(this)`,
                },
                children: [
                  {
                    type: "element",
                    tagName: "svg",
                    properties: {
                      xmlns: "http://www.w3.org/2000/svg",
                      fill: "none",
                      viewBox: "0 0 24 24",
                      "stroke-width": "2",
                      stroke: "currentColor",
                      class: "copy-icon",
                    },
                    children: [
                      {
                        type: "element",
                        tagName: "path",
                        properties: {
                          "stroke-linecap": "round",
                          "stroke-linejoin": "round",
                          d: "M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184",
                        },
                        children: [],
                      },
                    ],
                  },
                  {
                    type: "element",
                    tagName: "svg",
                    properties: {
                      xmlns: "http://www.w3.org/2000/svg",
                      fill: "none",
                      viewBox: "0 0 24 24",
                      "stroke-width": "2",
                      stroke: "currentColor",
                      class: "checked-icon",
                    },
                    children: [
                      {
                        type: "element",
                        tagName: "path",
                        properties: {
                          "stroke-linecap": "round",
                          "stroke-linejoin": "round",
                          d: "m4.5 12.75 6 6 9-13.5",
                        },
                        children: [],
                      },
                    ],
                  },
                ],
              },
            ],
          };

          node.children.unshift(buttonElement as any);
          return node;
        },
      });

      try {
        const fragment = highlighter.codeToHast(code, codeOptions);
        cache?.set(code, fragment.children);
        // @ts-ignore
        parent.children.splice(index, 1, ...fragment.children);
      } catch (error) {
        if (onError) onError(error);
        else throw error;
      }
    });
  };
}

export type RehypeShikiOptions = RehypeShikiCoreOptions & {
  /**
   * Language names to include.
   *
   * @default Object.keys(bundledLanguages)
   */
  langs?: Array<LanguageInput | BuiltinLanguage>;
};

const rehypeShiki: Plugin<[RehypeShikiOptions], Root> = function (options = {} as RehypeShikiOptions) {
  const themeNames = ("themes" in options ? Object.values(options.themes) : [options.theme]).filter(
    Boolean
  ) as BuiltinTheme[];
  const langs = options.langs || Object.keys(bundledLanguages);

  let getHandler: Promise<any>;

  return async tree => {
    if (!getHandler) {
      getHandler = getSingletonHighlighter({
        themes: themeNames,
        langs,
      }).then(highlighter => rehypeShikiFromHighlighter.call(this, highlighter, options));
    }
    const handler = await getHandler;
    return handler!(tree) as Root;
  };
};

export default rehypeShiki;
