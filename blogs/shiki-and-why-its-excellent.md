---
title: "Shiki and why its excellent"
date: "2024-07-01"
banner: "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?q=80&w=1600&h=900&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
labels: ['Tutorial', 'React', 'Shiki']
description: >
  Shiki is a fantastic library that provides a fast and feature-rich syntax
  highlighting experience for code snippets in your applications. But why Shiki?
---

## Introduction

Recently I was working on a project (its this blog) where I needed to add syntax highlighting to code snippets. I could have honestly not gone through such a hassle and used Prismic or some other CMS that provides syntax highlighting out of the box. But I wanted to learn something new and that's when I stumbled upon Shiki.

Now before I say anything else, let me preface this by saying that I am not a Shiki expert. I have only used it for a few days and I am already in love with it. So in this blog post, I will be talking about why I think Shiki is excellent and why you should consider using it in your projects.

## What is Shiki?

Shiki is in its core a syntax highlighting library that is built on top of TextMate grammars. I won't go into what Shiki or TextMate grammars are - the [Shiki documentation](https://shiki.matsu.io/) does a fantastic job of explaining that.
I will however talk about the Developer Experience (DX) that Shiki provides and why I think it's excellent.

> [!Note]
> As of writing this blog post, Shiki is at version 1.10.0.

## Why Shiki?

I needed a syntax highlighter for a very specific use case - to highlight code snippets in my blog posts. I could have used Prism.js or Highlight.js but I wanted something that was a bit more bleeding edge.
I found shiki while reading the source code of [Nextra](https://github.com/shuding/nextra/blob/main/packages/nextra/package.json) and I was intrigued.

Going on a slight tangent, I really wanted to use Nextra at first for my blog but its not been updated in a while and it felt too opinionated for my use case.

Anyways. I found Shiki and I let's just say I was not initially impressed. Shiki in a way is a bit more low-level than Prism.js or Highlight.js. You have to do a bit more work to get it up and running. But once you get it up and running, it's a breeze.

Notice how I said "once you get it up and running". That's partially my fault. I am using Next.js and I wanted to use Shiki with MDX. Plus, I was plugging it into a custom MDX renderer. Can't blame Shiki for that.

Let's look at some code now.

```typescript
// rehype-shiki.ts

import type { LanguageInput } from "shiki/core";
import type { BuiltinLanguage, BuiltinTheme } from "shiki";
import { bundledLanguages, createHighlighter } from "shiki";
import type { Plugin } from "unified";
import type {
  CodeOptionsMeta,
  CodeOptionsThemes,
  CodeToHastOptions,
  HighlighterGeneric,
  TransformerOptions,
} from "shiki/core";
import type { Element, Root } from "hast";
import type { Transformer } from "unified";
import { toString } from "hast-util-to-string";
import { visit } from "unist-util-visit";

export interface MapLike<K = any, V = any> {
  get: (key: K) => V | undefined;
  set: (key: K, value: V) => this;
}

export interface RehypeShikiExtraOptions {
  addLanguageClass?: boolean;
  defaultLanguage?: string;
  fallbackLanguage?: string;
  parseMetaString?: (metaString: string, node: Element, tree: Root) => Record<string, any> | undefined | null;
  cache?: MapLike;
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
                  onClick: `copyText(\`${escapedCode}\`, this)`,
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
      getHandler = createHighlighter({
        themes: themeNames,
        langs,
      }).then(highlighter => rehypeShikiFromHighlighter.call(this, highlighter, options));
    }
    const handler = await getHandler;
    return handler!(tree) as Root;
  };
};

export default rehypeShiki;
```

## Rehype

_**"What the heck is Rehype?"**_

Put down your pitchforks, I'm getting to that. Rehype is a fantastic library that allows you to transform HTML with JavaScript. It's kinda like Babel but for HTML. I used Rehype to transform the HTML generated by MDX to add syntax highlighting using Shiki & many other things. No, I am not going to talk about Rehype in this blog post. Maybe in another one. Maybe.

Okay so the reason I brought up Rehype is because shiki has a rehype plugin that makes it super easy to add syntax highlighting to your MDX files and that's _kinda_ what I used. I say _kinda_ because I wanted to add a copy to clipboard button to my code snippets and also show the language of the code snippet. So I had to create sort of my own plugin. But the shiki rehype plugin was a great starting point, no complaints there.

## Conclusion

As you might've figured out by now (or maybe not), this blog is not serious. I wanted to check if my parser could handle a blog post with a lot of things going on. And it did. So that's cool.Yes, I know I kinda wasted your time and for that I'm sorry - I will be writing more serious blog posts in the future. I promise.
