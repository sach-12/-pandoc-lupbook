# Copyright (c) 2023 LupLab
# SPDX-License-Identifier: AGPL-3.0-only

from dominate.tags import div, label, input_
from dominate.util import raw

import lupbook_filter
import mcq_schema
import panflute

#
# Activity HTML generation
#

class LupbookMCQ(lupbook_filter.LupbookComponent):
    def __init__(self, yaml_config):
        super().__init__(yaml_config)

        # Error checking
        correct_count = sum(choice["correct"] for choice in self.conf["choices"])
        if ((not self.conf['many'] and correct_count != 1)
            or (self.conf['many'] and correct_count < 1)):
            raise Exception("Invalid number of correct choices in MCQ activity: "
                            f"'{self.conf['id']}'")
        self.form_type = 'checkbox' if self.conf['many'] else 'radio'

        self.testing_cnt = len(self.conf["choices"]) if self.conf['many'] else 1

    @staticmethod
    def _yaml_validator():
        return mcq_schema.mcq_validator

    @staticmethod
    def activity_id():
        return "mcq"

    def _activity_name(self):
        return "MCQ activity"

    def _gen_activity(self):
        with div(cls = "card-body px-3 pt-0 pb-2 m-0"):
            for i, choice in enumerate(self.conf["choices"]):
                with div(cls = "form-check"):
                    input_(cls = "form-check-input",
                          type = self.form_type,
                          name = f"{self.prefix_id}-choice",
                          id = f"{self.prefix_id}-choice-{i}",
                          data_correct = choice['correct'])
                    with label(cls = "form-check-label mcq-choice-item",
                               for_ = f"{self.prefix_id}-choice-{i}"):
                        formatted_text = panflute.convert_text(
                                choice["text"], output_format='html')
                        raw(formatted_text)

    def _gen_testing_activity(self):
        div(id = f"{self.prefix_id}-testing-score",
            cls = "alert d-none")
        for i, choice in enumerate(self.conf["choices"]):
            formatted_text = panflute.convert_text(
                    choice["feedback"], output_format = 'html')
            div(raw(formatted_text),
                id = f"{self.prefix_id}-feedback-{i}",
                cls = "mcq-feedback-item m-1 p-2 border-start border-5 d-none")
