import { useEffect, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { translateText } from "@/i18n/translations";

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "TEXTAREA", "INPUT", "SVG", "PATH"]);
const ATTRIBUTES = ["placeholder", "aria-label", "title", "alt"];

export default function TranslationLayer() {
  const { language } = useLanguage();
  const languageRef = useRef(language);
  const originalText = useRef(new WeakMap());
  const lastAppliedText = useRef(new WeakMap());
  const originalAttributes = useRef(new WeakMap());
  const lastAppliedAttributes = useRef(new WeakMap());

  function translateDocument(activeLanguage) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) translateTextNode(walker.currentNode, activeLanguage);
    document.querySelectorAll("[placeholder],[aria-label],[title],[alt]").forEach((element) => {
      translateAttributes(element, activeLanguage);
    });
  }

  function translateTextNode(node, activeLanguage) {
    const parent = node.parentElement;
    if (!parent || SKIP_TAGS.has(parent.tagName) || parent.closest("[data-no-translate],script,style,code,pre,textarea,input,svg,[contenteditable='true']")) return;
    const current = node.nodeValue;
    if (!originalText.current.has(node)) originalText.current.set(node, current);
    else if (current !== lastAppliedText.current.get(node) && current !== originalText.current.get(node)) {
      originalText.current.set(node, current);
    }
    const next = translateText(originalText.current.get(node), activeLanguage);
    if (current !== next) node.nodeValue = next;
    lastAppliedText.current.set(node, next);
  }

  function translateAttributes(element, activeLanguage) {
    if (SKIP_TAGS.has(element.tagName) || element.closest?.("[data-no-translate]")) return;
    let originals = originalAttributes.current.get(element);
    let applied = lastAppliedAttributes.current.get(element);
    if (!originals) {
      originals = {};
      originalAttributes.current.set(element, originals);
    }
    if (!applied) {
      applied = {};
      lastAppliedAttributes.current.set(element, applied);
    }
    ATTRIBUTES.forEach((attribute) => {
      if (!element.hasAttribute(attribute)) return;
      const current = element.getAttribute(attribute);
      if (!(attribute in originals)) originals[attribute] = current;
      else if (current !== applied[attribute] && current !== originals[attribute]) originals[attribute] = current;
      const next = translateText(originals[attribute], activeLanguage);
      if (current !== next) element.setAttribute(attribute, next);
      applied[attribute] = next;
    });
  }

  useEffect(() => {
    languageRef.current = language;
    translateDocument(language);
  }, [language]);

  useEffect(() => {
    const observer = new MutationObserver((records) => {
      records.forEach((record) => {
        if (record.type === "childList") record.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) translateTextNode(node, languageRef.current);
          else if (node.nodeType === Node.ELEMENT_NODE) {
            const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
            while (walker.nextNode()) translateTextNode(walker.currentNode, languageRef.current);
            translateAttributes(node, languageRef.current);
            node.querySelectorAll?.("[placeholder],[aria-label],[title],[alt]").forEach((element) => translateAttributes(element, languageRef.current));
          }
        });
        if (record.type === "characterData") translateTextNode(record.target, languageRef.current);
        if (record.type === "attributes") translateAttributes(record.target, languageRef.current);
      });
    });
    observer.observe(document.documentElement, {
      subtree: true, childList: true, characterData: true, attributes: true,
      attributeFilter: ATTRIBUTES,
    });
    return () => observer.disconnect();
  }, []);

  return null;
}
