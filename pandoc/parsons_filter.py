# Copyright (c) 2023 LupLab
# SPDX-License-Identifier: AGPL-3.0-only

import random

from dominate.tags import div, span
from dominate.util import raw

import lupbook_filter
import parsons_schema
import panflute

#
# Component generation
#

class LupbookParsons(lupbook_filter.LupbookComponent):
    def __init__(self, yaml_config):
        super().__init__(yaml_config)

        # Error checking

        ## At least one valid fragment to place
        frag_ids = [f["id"] for f in self.conf["frags"] if f["id"] != -1]
        if len(frag_ids) < 1:
            raise Exception(f"Parsons activity '{self.conf['id']}'"
                            " must have at least one valid fragment")

        ## All dependencies must be valid ids
        frags_deps = [f["depend"] for f in self.conf["frags"]
                      if f["id"] != -1 and f.get("depend")]
        if not all(i in frag_ids for i in frags_deps):
            raise Exception(f"Parsons activity '{self.conf['id']}'"
                            " contains invalid dependencies")

        ## Check for dependency loop
        if self._detect_dependency_loop():
            raise Exception(f"Parsons activity '{self.conf['id']}'"
                            " contains at least one dependency loop")

        # Activity config
        self.testing_cnt = len(self.conf["frags"])
        if self.conf["random"]:
            random.shuffle(self.conf["frags"])

    def _detect_dependency_loop(self):
        # Build fragment graph
        graph = {f['id']: f.get('depend') for f in self.conf["frags"]}

        # Sets to keep track of explored nodes and the recursion stack
        explored = set()
        stack = set()

        # Run DFS from a given frag
        def dfs(fid):
            if fid in stack:    # Already seen during DFS => cycle!
                return True
            if fid in explored: # Already DFS'ed and no cycle
                return False

            explored.add(fid)
            stack.add(fid)

            # Recurse if frag has a dependency
            depend = graph.get(fid)
            if depend and dfs(depend):
                return True

            # Remove the node from the recursion stack after exploring it
            stack.remove(fid)
            return False

        # Run DFS for each fragment in the graph
        for fid in graph:
            if dfs(fid):
                return True
        return False

    @staticmethod
    def _yaml_validator():
        return parsons_schema.parsons_validator

    @staticmethod
    def activity_id():
        return "parsons"

    def _activity_name(self):
        return "Parsons activity"

    def _group_frags(self):
        result = []
        gids = {}

        for frag in self.conf["frags"]:
            gid = frag.get("gid")

            if not gid:
                # Individual frag, not in a group
                result.append([frag])
            else:
                # Frag part of an OR-group
                if gid not in gids:
                    # New group, keep track of index in result list
                    gids[gid] = len(result)
                    result.append([])

                # Insert frag in group list
                result[gids[gid]].append(frag)

        return result

    def _gen_frag_block(self, frag, margin, idx, gid):
        div_attrs = {
            "id": f"{self.prefix_id}-frag-{idx}",
            "cls": f"parsons-frag bg-white border rounded {margin} p-2 d-flex",
            "data-id": f"{frag['id']}",
            "data-depend": f"{frag.get('depend', '')}",
            "data-gid": f"{gid}",
        }
        with div(**div_attrs):
            if self.conf["label"]:
                span(idx, cls = "badge text-bg-light fw-medium me-1")
            text = frag["text"]
            formatted_text = panflute.convert_text(text, output_format="html")
            raw(formatted_text)

    def _gen_activity(self):
        group_frags = self._group_frags()

        # Generate containers and blocks
        with div(cls = "card-body p-2 m-0 ms-4"):
            with div(cls = "row gx-2 align-items-end"):
                with div(cls = "col"):
                    div("Drag items from here...",
                        cls = "ps-2 small fst-italic text-secondary")
                with div(cls = "col"):
                    div("...and drop them here (click to remove)",
                        cls = "ps-2 small fst-italic text-secondary")
            with div(cls = "row gx-2"):
                with div(cls = "col"):
                    with div(id = f"{self.prefix_id}-frags",
                             cls = "parsons-frags border pb-2 h-100"):
                        fid = 0
                        color_alt = 0

                        # Iterate by group
                        for gid, group in enumerate(group_frags):
                            is_group = len(group) > 1

                            # Alternate between colors for frag groups
                            if is_group:
                                bg_color = "bg-primary-subtle" if color_alt \
                                        else "bg-warning-subtle"
                                color_alt = (color_alt + 1) % 2
                            else:
                                # Default color for individual frags
                                bg_color = "bg-white"

                            with div(id = f"{self.prefix_id}-frags-{gid}",
                                     cls = f"parsons-frags-group position-relative rounded {bg_color}"):
                                if is_group:
                                    span("or{",
                                         cls = ("parsons-group-symbol fw-bold "
                                         "position-absolute top-50 start-0"))

                                # Iterate by fragment
                                for frag in group:
                                    self._gen_frag_block(frag, "m-2 mb-0", fid, gid)
                                    fid += 1

                with div(cls = "col"):
                    div(id = f"{self.prefix_id}-answers",
                        cls = "parsons-answers bg-light border h-100 pb-2 d-flex flex-column")

    def _gen_testing_activity(self):
        div(id = f"{self.prefix_id}-testing-score",
            cls = "alert d-none")
