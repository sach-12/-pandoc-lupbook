# Copyright (c) 2024 LupLab
# SPDX-License-Identifier: AGPL-3.0-only

from dominate.tags import div, span
from dominate.util import raw

import lupbook_filter
import hparsons_schema
import panflute


#
# Component generation
#

class LupbookHParsons(lupbook_filter.LupbookComponent):
    def __init__(self, yaml_config):
        super().__init__(yaml_config)

        # TODO: error checking (at least one valid frag, frags should have
        # linear order starting from 1)

        self.testing_cnt = len(self.conf["frags"])

    @staticmethod
    def _yaml_validator():
        return hparsons_schema.hparsons_validator

    @staticmethod
    def activity_id():
        return "hparsons"

    def _activity_name(self):
        return "Horizontal parsons activity"

    def _gen_frag_block(self, frag, idx):
        div_attrs = {
            "id": f"{self.prefix_id}-frag-{idx}",
            "cls": "hparsons-frag bg-white border rounded my-2 mx-1 p-2 d-flex",
            "data-order": f"{frag['order']}"
        }
        with div(**div_attrs):
            if (self.conf["label"]):
                span(idx, cls="badge text-bg-light m-1")
            text = frag['text']
            formatted_text = panflute.convert_text(text, output_format = 'html')
            raw(formatted_text)

    def _gen_activity(self):
        # Generate containers and blocks
        with div(cls = "card-body p-2 m-0"):
            div("Drag items from here...",
                cls = "small fst-italic text-secondary")
            with div(id = f"{self.prefix_id}-frags",
                     cls = "hparsons-frags border d-flex flex-row flex-wrap"):
                for i, frag in enumerate(self.conf["frags"]):
                    self._gen_frag_block(frag, i)

            div("...and drop them here (click to remove)",
                cls = "small fst-italic text-secondary")
            div(id = f"{self.prefix_id}-answers",
                 cls = "hparsons-answers bg-light border d-flex flex-row flex-wrap")

    def _gen_testing_activity(self):
        div(id = f"{self.prefix_id}-testing-score",
            cls = "alert d-none")
