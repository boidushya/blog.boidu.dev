import { SKIP, visit } from "unist-util-visit";
import { isElement } from "hast-util-is-element";
import type { Root, Element, ElementContent, Parent, Text } from "hast";
import { fromHtml } from "hast-util-from-html";

export interface IAlert {
  keyword: string;
  icon: string | Element;
  title: string;
}

export type DefaultBuildType = (alertOptions: IAlert, originalChildren: ElementContent[]) => ElementContent | null;

export interface IOptions {
  alerts: IAlert[];
  supportLegacy?: boolean;
  build?: DefaultBuildType;
}

let internalOptions: IOptions;

export const rehypeAdmonitions = (options: IOptions) => {
  const defaultOptions: IOptions = {
    alerts: [
      {
        keyword: "NOTE",
        icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg>',
        title: "Note",
      },
      {
        keyword: "IMPORTANT",
        icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" /></svg>',
        title: "Important",
      },
      {
        keyword: "WARNING",
        icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>',
        title: "Warning",
      },
      {
        keyword: "TIP",
        icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" width="16" height="16"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg>',
        title: "Tip",
      },
      {
        keyword: "CAUTION",
        icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" /></svg>',
        title: "Caution",
      },
    ],
    supportLegacy: false,
  };

  internalOptions = Object.assign({}, defaultOptions, options);

  return (tree: Root) => {
    visit(tree, "element", (node, index, parent) => {
      create(node, index, parent);
    });
  };
};

const create = (node: Element, index: number | undefined, parent: Parent | undefined) => {
  // check if main element is a blockquote
  if (node.tagName !== "blockquote") {
    return [SKIP];
  }

  // make sure the blockquote is not empty
  if (!node.children) {
    return null;
  }

  // find the first paragraph inside of the blockquote
  const firstParagraph = node.children.find(child => {
    return isElement(child) && child.tagName === "p";
  });

  // check if we found an the blockquote paragraph
  if (!isElement(firstParagraph)) {
    return null;
  }

  // try to find the alert type
  const headerData = extractHeaderData(firstParagraph);

  if (headerData === null) {
    return [SKIP];
  }

  // if the first line contains more than the type
  // drop out of rendering as alert, this is what
  // GitHub does (as of now)
  if (headerData.rest.trim() !== "") {
    if (!headerData.rest.startsWith("\n") && !headerData.rest.startsWith("\r")) {
      return null;
    }
  }

  // try to find options matching the alert keyword
  const alertOptions = getAlertOptions(headerData.alertType);

  if (alertOptions === null) {
    return [SKIP];
  }

  if (typeof parent !== "undefined" && typeof index !== "undefined") {
    // use a build to convert the blockquote into an alert
    const build = internalOptions.build || defaultBuild;

    const alertBodyChildren: ElementContent[] = [];

    // for alerts the blockquote first element is always
    // a pragraph but it can have move children then just
    // the alert type text node
    const remainingFirstParagraphChildren = firstParagraph.children.slice(1, firstParagraph.children.length);

    const newFirstParagraphChildren: ElementContent[] = [];

    if (remainingFirstParagraphChildren.length > 0) {
      // if the alert type has a hardline break we remove it
      // to not start the alert with a blank line
      // meaning we start the slice at 2 to not take
      // the br element and new line text nodes
      if (
        remainingFirstParagraphChildren[0].type === "element" &&
        remainingFirstParagraphChildren[0].tagName === "br"
      ) {
        const remainingChildrenWithoutLineBreak = remainingFirstParagraphChildren.slice(
          2,
          firstParagraph.children.length
        );
        newFirstParagraphChildren.push(...remainingChildrenWithoutLineBreak);
      } else {
        // if the first line of the blockquote has no hard line break
        // after the alert type but some text, then both the type
        // and the text will be in a single text node
        // headerData rest contains the remaining text without the alert type
        if (headerData.rest.trim() !== "") {
          const restAsTextNode: Text = {
            type: "text",
            value: headerData.rest,
          };
          remainingFirstParagraphChildren.unshift(restAsTextNode);
        }
        // if no hard line break (br) take all the remaining
        // and add them to new paragraph to mimick the initial structure
        newFirstParagraphChildren.push(...remainingFirstParagraphChildren);
      }
    } else {
      if (headerData.rest.trim() !== "") {
        const restAsTextNode: Text = {
          type: "text",
          value: headerData.rest,
        };
        newFirstParagraphChildren.push(restAsTextNode);
      }
    }

    if (newFirstParagraphChildren.length > 0) {
      const lineBreak: Text = {
        type: "text",
        value: "\n",
      };
      alertBodyChildren.push(lineBreak);
      const paragrahElement: Element = {
        type: "element",
        tagName: "p",
        properties: {},
        children: newFirstParagraphChildren,
      };
      alertBodyChildren.push(paragrahElement);
    }

    // outside of the first paragraph there may also be children
    // we add them too back into the alert body
    if (node.children.length > 2) {
      alertBodyChildren.push(...node.children.slice(2, node.children.length));
    }

    const alertElement = build(alertOptions, alertBodyChildren);

    // replace the original blockquote with the
    // new alert element and its children
    if (alertElement !== null) {
      parent.children[index] = alertElement;
    }
  }

  return [SKIP];
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const defaultBuild: DefaultBuildType = (alertOptions, originalChildren) => {
  let alertIconElement: Element | undefined;

  if (isElement(alertOptions.icon)) {
    // if an element got passed to the options for the icon
    // use that element
    alertIconElement = alertOptions.icon;
  } else {
    // if a string got passed to the options for the icon
    // first convert it to an element
    const alertIcon = fromHtml(alertOptions.icon, { fragment: true }).children[0];

    if (isElement(alertIcon)) {
      alertIconElement = alertIcon;
    }
  }

  if (typeof alertIconElement === "undefined") {
    return null;
  }

  const titleElementContent: ElementContent = {
    type: "text",
    value: alertOptions.title,
  };

  const alert: ElementContent = {
    type: "element",
    tagName: "div",
    properties: {
      className: ["alert", `alert-${alertOptions.keyword.toLowerCase()}`],
    },
    children: [
      {
        type: "element",
        tagName: "p",
        properties: {
          className: ["alert-title"],
        },
        children: [alertIconElement, titleElementContent],
      },
      ...originalChildren,
    ],
  };

  return alert;
};

const extractHeaderData = (paragraph: Element): { alertType: string; rest: string } | null => {
  const header = paragraph.children[0];
  let alertType: string | undefined;
  let rest: string = "";

  if (internalOptions.supportLegacy) {
    if (header.type === "element" && header.tagName === "strong") {
      if (header.children[0].type === "text") {
        alertType = header.children[0].value;
      }
    }
  }

  if (header.type === "text") {
    const match = header.value.match(/\[!(.*?)\]/);

    if (match === null || typeof match.input === "undefined") {
      return null;
    }

    if (match.input.length > match[0].length) {
      // if in markdown there are no two spaces at the end
      // then in html there will be no line break
      // this means in the first line there will be more
      // content than just the alert type
      rest = match.input.replace(match[0], "");
    }

    alertType = match[1];
  }

  if (typeof alertType === "undefined") {
    return null;
  }

  return { alertType, rest };
};

const getAlertOptions = (alertType: string): IAlert | null => {
  const alertOptions = internalOptions.alerts.find(alert => {
    return alertType.toUpperCase() === alert.keyword.toUpperCase();
  });

  return alertOptions ? alertOptions : null;
};
