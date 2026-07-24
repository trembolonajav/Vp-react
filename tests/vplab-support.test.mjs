import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { parseHTML } from "linkedom";

const LAB = path.join(process.cwd(), "apps", "vpertz-lab", "public");
const html = fs.readFileSync(path.join(LAB, "index.html"), "utf8");
const css = fs.readFileSync(path.join(LAB, "styles.css"), "utf8");
const modalJs = fs.readFileSync(path.join(LAB, "support-modal.js"), "utf8");
const { document } = parseHTML(html);

test("os dois controles de apoio são independentes e ficam no rodapé", () => {
  const actions = document.querySelector("footer .foot-actions");
  assert.ok(actions);

  const supportButton = actions.querySelector("button[data-open-support]");
  assert.ok(supportButton);
  assert.ok(supportButton.querySelector('img[src="assets/support-vplab.png"]'));

  const referral = actions.querySelector('a[href="https://poke.idleworld.online/?ref=HJ94JAX"]');
  assert.ok(referral);
  assert.ok(referral.querySelector('img[src="assets/referral-vplab.png"]'));
});

test("o referral abre em nova aba com atributos seguros", () => {
  const link = document.querySelector('footer a[href="https://poke.idleworld.online/?ref=HJ94JAX"]');
  assert.equal(link.getAttribute("target"), "_blank");
  for (const token of ["noopener", "noreferrer", "sponsored"]) {
    assert.ok(link.getAttribute("rel").split(/\s+/).includes(token), `rel precisa conter ${token}`);
  }
  assert.match(link.getAttribute("aria-label"), /Usar meu referral/);
});

test("o modal de apoio começa fechado e contém QR Code e aviso", () => {
  const modal = document.querySelector("dialog#support-modal");
  assert.ok(modal);
  assert.equal(modal.hasAttribute("open"), false);
  assert.ok(modal.querySelector("[data-close-support]"));
  assert.ok(modal.querySelector('img[src="assets/apoio-streamer-qr.png"]'));
  assert.match(modal.textContent, /100% opcional/);
});

test("o modal usa JavaScript externo compatível com a CSP e tem versão móvel", () => {
  assert.ok(document.querySelector('script[src="support-modal.js"]'));
  assert.equal(document.querySelector("script:not([src])"), null);
  assert.match(modalJs, /showModal\(\)/);
  assert.match(modalJs, /data-open-support/);
  assert.match(css, /\.foot-action-button:focus-visible/);
  assert.match(css, /@media\(max-width:640px\)[\s\S]*\.support-modal-card/);
});
