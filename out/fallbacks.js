"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fallbackDB = void 0;
exports.fallbackDB = {
    'css-has-pseudo': {
        friendlyName: 'CSS :has() Selector',
        explanation: 'The :has() pseudo-class had incomplete browser support before 2023. Use JavaScript to add conditional classes instead.',
        fallback: `// Add class to parent if child exists
document.querySelectorAll('.parent').forEach(el => {
  if (el.querySelector('.child')) {
    el.classList.add('has-child');
  }
});

/* Then style with: */
.parent.has-child { /* styles */ }`
    },
    'css-backdrop-filter': {
        friendlyName: 'CSS backdrop-filter Property',
        explanation: 'backdrop-filter lacked full support until 2022. Use a semi-transparent background as fallback.',
        fallback: `/* Fallback approach */
.element {
  background: rgba(255, 255, 255, 0.8);
  /* backdrop-filter: blur(10px); */
}

/* Or use @supports */
@supports (backdrop-filter: blur(10px)) {
  .element {
    backdrop-filter: blur(10px);
  }
}`
    }
};
//# sourceMappingURL=fallbacks.js.map