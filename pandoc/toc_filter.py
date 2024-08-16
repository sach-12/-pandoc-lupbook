#!/usr/bin/env python3

# Copyright (c) 2024 LupLab
# SPDX-License-Identifier: AGPL-3.0-only

from dominate.tags import a, li, nav, ul
import panflute

# Prep our data structures, before processing each node
def _prepare_toc_filter(doc):
    # Number of components in the main TOC (e.g., parts, chapters, sections)
    # Default 1: h1 level are sections, which are listed in main TOC
    doc.main_toc_depth = int(doc.get_metadata("main-toc-depth", default = 1))

    # Number of components in the section TOCs (e.g., subsections,
    # subsubsections)
    # Default 1: subsections are listed in page TOC
    doc.section_toc_depth = int(doc.get_metadata("section-toc-depth", default = 1))

    # Overall depth
    doc.toc_depth = doc.main_toc_depth + doc.section_toc_depth

    if doc.main_toc_depth < 0 or doc.section_toc_depth < 0 or doc.toc_depth > 6:
        raise Exception("Incorrect TOC depth values")

    # Entire hierarchy of nodes
    doc.toc_all = [[] for _ in range(doc.toc_depth + 1)]

    # Only current hierarchy (one node per level)
    doc.toc_current = [ None ] * (doc.toc_depth + 1)

    # Root node by default
    root_node = { "id": "lb-root-section",
                 "title": panflute.stringify(doc.metadata["title"]),
                 "children": [] }
    doc.toc_all[0].append(root_node)
    doc.toc_current[0] = root_node

# Called on each element of input document
def _process_toc_filter(element, doc):
    if not isinstance(element, panflute.Header) \
            or element.level > doc.toc_depth:
        return

    # Current toc node
    node = {"id": element.identifier,
            "title": panflute.stringify(element),
            "children": []}

    # Remap markdown levels from [1:n] to [0:n-1]
    level = element.level

    # Keep track of node in current hierarchy (replace node as same level, reset
    # all levels below)
    doc.toc_current[level] = node
    doc.toc_current[level + 1:] = [None] * (doc.toc_depth - level)

    # Ensure that hierarchy is complete (all levels above ours should be
    # populated)
    if any(n is None for n in doc.toc_current[:level]):
        raise Exception("Incomplete hierarchy")

    # Insert node in tree
    doc.toc_current[level - 1]["children"].append(node)

    doc.toc_all[element.level].append(node)

# Finalize our output after processing the entire document
def _finalize_toc_filter(doc):
    # Build main TOC
    if doc.main_toc_depth > 0:
        main_toc = nav(id = "lb-main-toc-nav", cls = "small")
        with main_toc:
            root = doc.toc_all[0][0]
            with ul(cls = "list-unstyled ps-2",
                    data_title = root["title"]):
               _build_main_toc_html(doc.main_toc_depth, root["children"], 1)

        # Variable to be inserted in template HTML
        doc.metadata["main-toc"] = panflute.RawBlock(main_toc.render(), 'html')

    # Build page TOC
    if doc.toc_depth > 0:
        page_toc = nav(id = "lb-page-toc-list", cls = "small",
                          data_level = f"{doc.main_toc_depth}")
        with page_toc:
            # 1-level TOCs for each uppersection level
            for i in range(doc.main_toc_depth):
                for sect in doc.toc_all[i]:
                    with ul(id = f"{sect['id']}-toc",
                            cls = "list-unstyled ps-2 d-none",
                            data_title = sect["title"]):
                        _build_page_toc_html(1, sect["children"] , 1)

            if doc.section_toc_depth > 0:
                # N-level TOCs for each section
                for sect in doc.toc_all[doc.main_toc_depth]:
                    with ul(id = f"{sect['id']}-toc",
                            cls = "list-unstyled ps-2 d-none",
                            data_title = sect["title"]):
                        _build_page_toc_html(doc.section_toc_depth, sect["children"], 1)

        doc.metadata["page-toc"] = panflute.RawBlock(page_toc.render(), 'html')

def _build_main_toc_html(max_depth, level, cur_depth):
    for node in level:
        with li():
            a(node["title"], href = f"#{node['id']}",
              cls = "px-2 py-1 mt-1 d-inline-block text-decoration-none text-reset rounded")
            if node["children"] and cur_depth < max_depth:
                with ul(cls = "list-unstyled ps-2"):
                    _build_main_toc_html(max_depth, node["children"], cur_depth + 1)

def _build_page_toc_html(max_depth, level, cur_depth):
    for node in level:
        with li():
            a(node["title"], href = f"#{node['id']}",
              cls = "px-2 py-1 mt-1 d-inline-block text-decoration-none text-reset rounded")
            if node["children"] and cur_depth < max_depth:
                with ul(cls = "list-unstyled ps-2"):
                    _build_page_toc_html(max_depth, node["children"],
                                         cur_depth + 1)

if __name__ == "__main__":
    panflute.run_filter(_process_toc_filter,
                        prepare = _prepare_toc_filter,
                        finalize = _finalize_toc_filter)
