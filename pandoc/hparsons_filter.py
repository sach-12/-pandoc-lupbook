# Copyright (c) 2024 LupLab
# SPDX-License-Identifier: AGPL-3.0-only

from dominate.tags import div, span
from dominate.util import raw

import parsons_filter
import hparsons_schema
import panflute


#
# Component generation
#

class LupbookHParsons(parsons_filter.LupbookParsons):
    def __init__(self, yaml_config):
        super().__init__(yaml_config)

    @staticmethod
    def _yaml_validator():
        # XXX Could potentially reuse the parsons_schema and just ignore the
        # `gid` field (it's optional anyway)
        return hparsons_schema.hparsons_validator

    @staticmethod
    def activity_id():
        return "hparsons"

    def _activity_name(self):
        return "Horizontal parsons activity"

    def _gen_activity(self):
        # Generate containers and blocks
        with div(cls = "card-body p-2 m-0"):
            div("Drag items from here...",
                cls = "ps-2 small fst-italic text-secondary")
            with div(id = f"{self.prefix_id}-frags",
                     cls = "parsons-frags border d-flex flex-row flex-wrap"):
                for i, frag in enumerate(self.conf["frags"]):
                    # Reuse the block generation of the Parsons component which
                    # has OR group blocks. Here we don't, so we only have groups
                    # of 1 fragment each.
                    with div(id = f"{self.prefix_id}-frags-{i}",
                             cls = "parsons-frags-group position-relative"
                             " rounded bg-white"):
                        self._gen_frag_block(frag, "my-2 mx-1", i, i)

            div("...and drop them here (click to remove)",
                cls = "ps-2 pt-2 small fst-italic text-secondary")
            div(id = f"{self.prefix_id}-answers",
                cls = "parsons-answers bg-light border d-flex flex-row flex-wrap")
