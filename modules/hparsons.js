/*
 * Copyright (c) 2024 LupLab
 * SPDX-License-Identifier: AGPL-3.0-only
 */

class HParsonsActivity extends ParsonsActivity {
  /* Class methods */
  constructor(elt) {
    super(elt, "hparsons");

    /* Fix margins of placeholder object */
    /* TODO: one day, figure out a more elegant solution */
    this.placeHolder.classList.remove("m-2", "mb-0");
    this.placeHolder.classList.add("my-2", "mx-1");
  }
}

/*
 * Initialize "matching" interactive components after page loading
 */
window.addEventListener("DOMContentLoaded", () => {
  let hparsonsActivities = [];

  for (const e of document.getElementsByClassName("hparsons-container")) {
    hparsonsActivities.push(new HParsonsActivity(e));
  }
});
