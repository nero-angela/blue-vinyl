import { ControlIcon, createControlIcon } from '../../controls/presentation/control-icons.js';

/**
 * A glass segment that turns the docent on and off. It starts as `on` says; off, its speech bubble is struck through.
 * Returns `toggle`, to turn it from elsewhere (a key) as a click does.
 *
 * @param {HTMLElement} parent a glass capsule
 * @param {{ on: boolean, onChange: (on: boolean) => void }} options
 * @returns {{ toggle: () => void }}
 */
export function createDocentToggle(parent, { on: initial, onChange }) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'glass-segment';
  // A toggle button: its name stays, its pressed state says whether the docent is on.
  button.setAttribute('aria-label', 'Docent');
  button.setAttribute('aria-keyshortcuts', 'D');
  let on = initial;

  function render() {
    button.replaceChildren(createControlIcon(on ? ControlIcon.DOCENT : ControlIcon.DOCENT_OFF));
    button.setAttribute('aria-pressed', String(on));
    button.title = on ? 'Docent on' : 'Docent off';
  }

  function toggle() {
    on = !on;
    render();
    onChange(on);
  }

  button.addEventListener('click', toggle);
  render();
  parent.append(button);
  return { toggle };
}
