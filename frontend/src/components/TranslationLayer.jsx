import { useEffect, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { translateText } from "@/i18n/translations";

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "TEXTAREA", "INPUT", "SELECT", "OPTION", "SVG", "PATH"]);

export default function TranslationLayer() {
  const { language } = useLanguage();
  const languageRef = useRef(language);
  const originalText = useRef(new WeakMap());
  const originalAttributes = useRef(new WeakMap());

  useEffect(() => {
    languageRef.current = language;
    translateDocument();
  }, [language]);

  useEffect(() => {
    const translateNode = (node) => {
      if (!node) return;
      if (node.nodeType === Node.TEXT_NODE) {
        const parent = node.parentElement;
        if (!parent || SKIP_TAGS.has(parent.tagName) || parent.closest("[data-no-translate],script,style,code,pre,textarea,input,select,svg,[contenteditable='true']")) return;
        if (!originalText.current.has(node)) originalText.current.set(node, node.nodeValue);
        const original = originalText.current.get(node);
        const next = translateText(original, languageRef.current);
        if (node.nodeValue !== next) node.nodeValue = next;
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE && node !== document) return;
      const element = node.nodeType === Node.ELEMENT_NODE ? node : document.documentElement;
      if (SKIP_TAGS.has(element.tagName) || element.closest?.("[data-no-translate]")) return;

      ["placeholder", "aria-label", "title", "alt"].forEach((attribute) => {
        if (!element.hasAttribute(attribute)) return;
        let values = originalAttributes.current.get(element);
        if (!values) {
          values = {};
          originalAttributes.current.set(element, values);
        }
        if (!(attribute in values)) values[attribute] = element.getAttribute(attribute);
        const next = translateText(values[attribute], languageRef.current);
        if (element.getAttribute(attribute) !== next) element.setAttribute(attribute, next);
      });

      for (const child of element.childNodes) translateNode(child);
    };

    const translateDocument = () => translateNode(document);
    translateDocument();

    const observer = new MutationObserver((records) => {
      records.forEach((record) => {
        if (record.type === "childList") record.addedNodes.forEach(translateNode);
        if (record.type === "characterData") translateNode(record.target);
        if (record.type === "attributes") translateNode(record.target);
      });
    });
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder", "aria-label", "title", "alt"],
    });
    return () => observer.disconnect();
  }, []);

  function translateDocument() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      const parent = node.parentElement;
      if (!parent || SKIP_TAGS.has(parent.tagName) || parent.closest("[data-no-translate],script,style,code,pre,textarea,input,select,svg,[contenteditable='true']")) return;
      if (!originalText.current.has(node)) originalText.current.set(node, node.nodeValue);
      const next = translateText(originalText.current.get(node), language);
      if (node.nodeValue !== next) node.nodeValue = next;
    });

    document.querySelectorAll("[placeholder],[aria-label],[title],[alt]").forEach((element) => {
      ["placeholder", "aria-label", "title", "alt"].forEach((attribute) => {
        if (!element.hasAttribute(attribute)) return;
        let values = originalAttributes.current.get(element);
        if (!values) {
          values = {};
          originalAttributes.current.set(element, values);
        }
        if (!(attribute in values)) values[attribute] = element.getAttribute(attribute);
        const next = translateText(values[attribute], language);
        if (element.getAttribute(attribute) !== next) element.setAttribute(attribute, next);
      });
    });
  }

  return null;
}
