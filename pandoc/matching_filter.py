# Copyright (c) 2021 LupLab
# SPDX-License-Identifier: AGPL-3.0-only

from dominate.tags import div, span
from dominate.util import raw

import lupbook_filter
import matching_schema
import panflute


#
# Component generation
#

class LupbookMatching(lupbook_filter.LupbookComponent):
    def __init__(self, yaml_config):
        super().__init__(yaml_config)
        self.testing_cnt = len(self.conf["choices"])

    @staticmethod
    def _yaml_validator():
        return matching_schema.matching_validator

    @staticmethod
    def activity_id():
        return "matching"

    def _activity_name(self):
        return "Matching activity"

    def _gen_choice_block(self, choice, i):
        div_attrs = {
            "id": f"{self.prefix_id}-choice-{choice['id']}",
            "cls": "matching-choice bg-white border rounded m-2 mb-0 p-2 d-flex",
        }
        with div(**div_attrs):
            span(str(i + 1), cls = "badge text-bg-secondary me-2")
            text = choice['text']
            formatted_text = panflute.convert_text(text, output_format = 'html')
            raw(formatted_text)

    def _gen_answer_block(self, answer):
        div_attrs = {
            "cls": "matching-answer bg-light border rounded m-2 mb-0 p-2 d-flex flex-column",
            "data-choices": ','.join(answer['choices'])
        }
        with div(**div_attrs):
            text = answer['text']
            formatted_text = panflute.convert_text(text, output_format = 'html')
            raw(formatted_text)

    def _gen_activity(self):
        # Generate containers and blocks
        with div(cls = "card-body p-2 m-0"):
            with div(cls = "row gx-2 align-items-end"):
                with div(cls = "col"):
                    div("Drag items from here...",
                        cls = "ps-2 small fst-italic text-secondary")
                with div(cls = "col"):
                    div("...and drop them here (click to remove)",
                        cls = "ps-2 small fst-italic text-secondary")
            with div(cls = "row gx-2"):
                with div(cls = "col"):
                    with div(id = f"{self.prefix_id}-choices",
                             cls = "matching-choices border pb-2 h-100"):
                        for i, block in enumerate(self.conf["choices"]):
                            self._gen_choice_block(block, i)
                with div(cls = "col"):
                    with div(id = f"{self.prefix_id}-answers",
                             cls = "border pb-2 h-100"):
                        for block in self.conf['answers']:
                            self._gen_answer_block(block)

    def _gen_testing_activity(self):
        div(id = f"{self.prefix_id}-testing-score",
            cls = "alert d-none")
        for i, choice in enumerate(self.conf["choices"]):
            formatted_text = panflute.convert_text(
                    choice["feedback"], output_format = 'html')
            with div(id = f"{self.prefix_id}-feedback-{choice['id']}",
                     cls = "d-flex align-items-center matching-feedback-item m-1 p-2 border-start border-5 d-none"):
                span(str(i + 1), cls="badge text-bg-secondary me-2")
                div(raw(formatted_text))
