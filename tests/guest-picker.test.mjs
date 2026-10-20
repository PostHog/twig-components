import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { GuestPicker } from "../dist/GuestPicker.js";

test("guest picker renders a Twig menu trigger with the current guest count", () => {
  const markup = renderToStaticMarkup(createElement(GuestPicker, {
    id: "stay-guests",
    value: "3",
    capacity: 4,
    onChange: () => {},
  }));
  assert.match(markup, /aria-haspopup="listbox"/);
  assert.match(markup, /Guests: 3 guests/);
  assert.doesNotMatch(markup, /<select/);
});
