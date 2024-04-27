# Copyright (c) 2021 LupLab
# SPDX-License-Identifier: AGPL-3.0-only

from dominate.tags import *
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
        self.prefix_id = f"matching-{self.conf['id']}"

    @staticmethod
    def _yaml_validator():
        return matching_schema.matching_validator

    @staticmethod
    def activity_id():
        return "matching"

    def _activity_name(self):
        return "Matching activity"

    def _gen_choice_block(self, choice):
        div_attrs = {
            "id": f"{self.prefix_id}-choice-{choice['id']}",
            "cls": "matching-choice bg-white border rounded m-2 p-2 d-flex",
            "data-match": f"{choice['match']}"
        }
        with div(**div_attrs):
            text = choice['text']
            formatted_text = panflute.convert_text(text, output_format = 'html')
            # TODO: fix this in CSS (the last paragraph of the parent div should
            # not have a bottom margin)
            modified_text = formatted_text.replace('<p>', '<p class = "m-1">')
            raw(modified_text)

    def _gen_answer_block(self, answer):
        div_attrs = {
            "id": f"{self.prefix_id}-answer-{answer['id']}",
            "cls": "matching-answer bg-light border rounded m-2 p-2 d-flex flex-column",
        }
        with div(**div_attrs):
            text = answer['text']
            formatted_text = panflute.convert_text(text, output_format = 'html')
            # TODO: see above
            modified_text = formatted_text.replace('<p>', '<p class = "m-1">')
            raw(modified_text)

    def _gen_activity(self):
        # Generate containers and blocks
        with div(cls = "card-body p-2 m-0 row"):
            with div(cls = "col"):
                div("Drag items from here...",
                    cls = "small fst-italic text-secondary")
                with div(id = f"{self.prefix_id}-choices",
                         cls = "matching-choices border"):
                    for i, block in enumerate(self.conf["choices"]):
                        self._gen_choice_block(block)

            with div(cls = "col"):
                div("...and drop them here (click to remove)",
                    cls = "small fst-italic text-secondary")
                with div(id = f"{self.prefix_id}-answers",
                         cls = "matching-l-answers border"):
                    for i, block in enumerate(self.conf['answers']):
                        self._gen_answer_block(block)

    def _gen_controls(self):
        with div(cls = "card-body border-top"):
            with div(cls = "d-flex align-items-center"):
                with div(cls = "px-1"):
                    button("Submit",
                           id = f"{self.prefix_id}-submit",
                           cls = "btn btn-primary")
                    button("Reset",
                           id = f"{self.prefix_id}-reset",
                           cls = "btn btn-secondary")

                with div(cls = "px-1 flex-grow-1"):
                    div(cls = "d-none")

                with div(cls = "px-1"):
                    button(id = f"{self.prefix_id}-feedback-btn",
                           cls = "matching-c-feedback__toggle collapsed d-none",
                           data_bs_target = f"#{self.prefix_id}-feedback",
                           data_bs_toggle = "collapse", type = "button")

    def _gen_feedback(self):
        with div(id = f"{self.prefix_id}-feedback", cls = "collapse"):
            with div(cls = "card-body border-top"):
                div(id = f"{self.prefix_id}-feedback-score",
                    cls = "m-2 p-2 rounded d-none")
                for i, choice in enumerate(self.conf["choices"]):
                    formatted_text = panflute.convert_text(
                            choice["feedback"], output_format = 'html')
                    div(raw(formatted_text),
                        id = f"{self.prefix_id}-feedback-{choice['id']}",
                        cls = "matching-feedback-item m-2 p-2 border-start border-5 d-none")
