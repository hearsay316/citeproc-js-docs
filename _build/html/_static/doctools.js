/*
 * Base JavaScript utilities for all Sphinx HTML documentation.
 * 这是所有 Sphinx HTML 文档的基础 JavaScript 工具库。
 */
"use strict"; // 使用严格模式，增强代码安全性

// 定义一个被禁止用于键盘快捷键的 HTML 元素集合
const BLACKLISTED_KEY_CONTROL_ELEMENTS = new Set([
  "TEXTAREA", // 文本域
  "INPUT",    // 输入框
  "SELECT",   // 选择框
  "BUTTON",   // 按钮元素
]);

// 页面加载完成后的回调函数封装
const _ready = (callback) => {
  if (document.readyState !== "loading") {
    callback();
  } else {
    document.addEventListener("DOMContentLoaded", callback);
  }
};

/**
 * Small JavaScript module for the documentation.
 * 文档的小型 JavaScript 模块
 */
const Documentation = {
  init: () => {
    Documentation.initDomainIndexTable();    // 初始化域名索引表
    Documentation.initOnKeyListeners();     // 初始化键盘事件监听器
  },

  /**
   * i18n support
   * 国际化支持
   */
  TRANSLATIONS: {},  // 翻译对象，存储翻译文本
  PLURAL_EXPR: (n) => (n === 1 ? 0 : 1),  // 复数表达式处理函数
  LOCALE: "unknown", // 当前语言环境

  // gettext and ngettext don't access this so that the functions
  // can safely bound to a different name (_ = Documentation.gettext)
  // gettext 和 ngettext 不直接访问此属性，以便可以安全地将其绑定到不同的名称
  gettext: (string) => {
    const translated = Documentation.TRANSLATIONS[string];
    switch (typeof translated) {
      case "undefined":
        return string; // no translation - 没有翻译
      case "string":
        return translated; // translation exists - 翻译存在
      default:
        return translated[0]; // (singular, plural) translation tuple exists - 单复数翻译元组存在
    }
  },

  ngettext: (singular, plural, n) => {
    const translated = Documentation.TRANSLATIONS[singular];
    if (typeof translated !== "undefined")
      return translated[Documentation.PLURAL_EXPR(n)];
    return n === 1 ? singular : plural;
  },

  addTranslations: (catalog) => {
    Object.assign(Documentation.TRANSLATIONS, catalog.messages);
    Documentation.PLURAL_EXPR = new Function(
      "n",
      `return (${catalog.plural_expr})`
    );
    Documentation.LOCALE = catalog.locale;
  },

  /**
   * helper function to focus on search bar
   * 辅助函数，用于聚焦搜索栏
   */
  focusSearchBar: () => {
    document.querySelectorAll("input[name=q]")[0]?.focus();
  },

  /**
   * Initialise the domain index toggle buttons
   * 初始化域名索引切换按钮
   */
  initDomainIndexTable: () => {
    const toggler = (el) => {
      const idNumber = el.id.substr(7);
      const toggledRows = document.querySelectorAll(`tr.cg-${idNumber}`);
      if (el.src.substr(-9) === "minus.png") {
        el.src = `${el.src.substr(0, el.src.length - 9)}plus.png`;
        toggledRows.forEach((el) => (el.style.display = "none"));
      } else {
        el.src = `${el.src.substr(0, el.src.length - 8)}minus.png`;
        toggledRows.forEach((el) => (el.style.display = ""));
      }
    };

    const togglerElements = document.querySelectorAll("img.toggler");
    togglerElements.forEach((el) =>
      el.addEventListener("click", (event) => toggler(event.currentTarget))
    );
    togglerElements.forEach((el) => (el.style.display = ""));
    if (DOCUMENTATION_OPTIONS.COLLAPSE_INDEX) togglerElements.forEach(toggler);
  },

  initOnKeyListeners: () => {
    // only install a listener if it is really needed
    // 仅在真正需要时安装监听器
    if (
      !DOCUMENTATION_OPTIONS.NAVIGATION_WITH_KEYS &&
      !DOCUMENTATION_OPTIONS.ENABLE_SEARCH_SHORTCUTS
    )
      return;

    document.addEventListener("keydown", (event) => {
      // bail for input elements
      // 对于输入元素直接返回
      if (BLACKLISTED_KEY_CONTROL_ELEMENTS.has(document.activeElement.tagName)) return;
      // bail with special keys
      // 特殊键直接返回
      if (event.altKey || event.ctrlKey || event.metaKey) return;

      if (!event.shiftKey) {
        switch (event.key) {
          case "ArrowLeft":
            if (!DOCUMENTATION_OPTIONS.NAVIGATION_WITH_KEYS) break;

            const prevLink = document.querySelector('link[rel="prev"]');
            if (prevLink && prevLink.href) {
              window.location.href = prevLink.href;
              event.preventDefault();
            }
            break;
          case "ArrowRight":
            if (!DOCUMENTATION_OPTIONS.NAVIGATION_WITH_KEYS) break;

            const nextLink = document.querySelector('link[rel="next"]');
            if (nextLink && nextLink.href) {
              window.location.href = nextLink.href;
              event.preventDefault();
            }
            break;
        }
      }

      // some keyboard layouts may need Shift to get /
      // 某些键盘布局可能需要 Shift 键来输入 /
      switch (event.key) {
        case "/":
          if (!DOCUMENTATION_OPTIONS.ENABLE_SEARCH_SHORTCUTS) break;
          Documentation.focusSearchBar();
          event.preventDefault();
      }
    });
  },
};

// quick alias for translations
// 翻译的快速别名
const _ = Documentation.gettext;

// 初始化文档
_ready(Documentation.init);
