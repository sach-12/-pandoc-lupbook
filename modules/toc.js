/*
 * Copyright (c) 2024 LupLab
 * SPDX-License-Identifier: AGPL-3.0-only
 */

function LupbookTOC() {
  const mainTOC = document.getElementById("lb-main-toc-offcanvas");
  const mainTOCOffcanvas = new bootstrap.Offcanvas(mainTOC);
  const pageTOC = document.getElementById("lb-page-toc-list");
  const pageBody = document.getElementById("lb-page-body");
  const sectionTOCLevel = parseInt(pageTOC.dataset.level, 10);
  const pageTitle = document.getElementById("lb-page-title");
  const rootSection = document.getElementById("lb-root-section");

  let currentSectionElt;
  let currentSectionTOC;
  let currentSectionLvl;

  function setMainTOC(link, active, level) {
    link.classList.toggle("active", active);
    /* Set super sections as well */
    if (level > 1) {
      const mainTOCLink = link.closest("ul").previousElementSibling;
      if (mainTOCLink.tagName !== "A")
        throw new Error("Element should be an <a>");
      setMainTOC(mainTOCLink, active, level - 1);
    }
  }

  function toggleCurrentSection(show) {
    const hide = !show;

    /* Super section: toggle elements prior to first inner section */
    if (currentSectionLvl < sectionTOCLevel) {
      for (const child of currentSectionElt.children) {
        /* Stop at the first encountered internal section */
        if (child.tagName === "SECTION") break;
        else child.classList.toggle("d-none", hide);
      }
    }

    /* Update page title */
    if (show) pageTitle.textContent = currentSectionTOC.dataset.title;
    else pageTitle.textContent = "";

    /* Toggle section as page body*/
    currentSectionElt.classList.toggle("d-none", hide);

    /* Toggle parent sections */
    let s = currentSectionElt;
    for (let l = currentSectionLvl; l != 0; l--) {
      s = s.parentElement;
      s.classList.toggle("d-none", hide);
    }

    /* Toggle corresponding page TOC */
    currentSectionTOC.classList.toggle("d-none", hide);

    /* Toggle location in main TOC */
    if (currentSectionLvl != 0) {
      const mainTOCLink = mainTOC.querySelector(
        `a[href="#${currentSectionElt.id}"]`
      );
      setMainTOC(mainTOCLink, show, currentSectionLvl);
    }
  }

  function updatePageView() {
    /* Hide offcanvas with mainTOC (in case it was shown) */
    mainTOCOffcanvas.hide();

    /* Determine target book section */
    const sectionElt =
      location.hash !== ""
        ? document.getElementById(location.hash.substring(1))
        : rootSection;

    /* Section we're already onto */
    if (sectionElt === currentSectionElt) {
      sectionElt.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    /* Check we're on the right type of section */
    const sectionTag = sectionElt.tagName;
    if (sectionElt === undefined || sectionTag !== "SECTION")
      throw new Error("Incorrect hash location");

    /* Determine section level */
    const sectionLvl = parseInt(
      [...sectionElt.classList]
        .find((cls) => cls.startsWith("level"))
        .replace("level", ""),
      10
    );

    /* Get corresponding TOC in the aside */
    const sectionTOC = document.getElementById(`${sectionElt.id}-toc`);

    /* Toggle between previous section and new section */
    if (currentSectionElt !== undefined) toggleCurrentSection(false);
    currentSectionElt = sectionElt;
    currentSectionTOC = sectionTOC;
    currentSectionLvl = sectionLvl;
    toggleCurrentSection(true);

    /* XXX: the first TOC link typically doesn't get activated by scrollspy. I
     * tried to wrap the refresh inside of a setTimeout to potentially refresh
     * after the DOM is updated but it didn't fix the issue. */
    bootstrap.ScrollSpy.getOrCreateInstance(pageBody).refresh();

    window.scrollTo({ top: 0, behavior: "instant" });

    /* In case some sections contain components that need to be refreshed when
     * shown (such as CodeMirror for icode) */
    dispatchShowEvents(
      currentSectionElt,
      currentSectionLvl,
      new Event("shown.lb.section")
    );
  }

  function dispatchShowEvents(section, level, event) {
    section.dispatchEvent(event);
    if (level >= sectionTOCLevel) {
      /* If we're in a regular section, recurse through all the subsections */
      section
        .querySelectorAll(":scope > section")
        .forEach((s) => dispatchShowEvents(s, level + 1, event));
    }
  }

  function initPageView(section, level) {
    /* Stop when we get to regular sections */
    if (level >= sectionTOCLevel) return;

    /* Recurse through hierarchy of super sections and hide all the inner
     * elements */
    for (const child of section.children) {
      child.classList.add("d-none");
      initPageView(child, level + 1);
    }
  }

  initPageView(rootSection, 0);
  window.addEventListener("hashchange", updatePageView);
  updatePageView();
}

/* Initialize the table of content management */
window.addEventListener("DOMContentLoaded", LupbookTOC);
