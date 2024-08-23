# Copyright (c) 2023 LupLab
# SPDX-License-Identifier: AGPL-3.0-only

import re

from dominate.tags import div, input_, span
from dominate.util import raw

import lupbook_filter
import fib_schema
import panflute

#
# Activity HTML generation
#

def split_into_paragraphs(text):
    # Normalize different newlines to '\n'
    text = re.sub(r'\r\n?|\n', '\n', text)
    # Remove empty lines containing only whitespace
    text = re.sub(r'\n\s*\n', '\n\n', text)
    # Split the text into paragraphs
    text = re.split(r'\n{2,}', text)
    # Strip leading and trailing whitespace from each paragraph
    text = [p.strip() for p in text if p.strip()]
    return text

class LupbookFIB(lupbook_filter.LupbookComponent):
    def __init__(self, yaml_config):
        super().__init__(yaml_config)
        self.testing_cnt = len(self.conf["blanks"])

    @staticmethod
    def _yaml_validator():
        return fib_schema.fib_validator

    @staticmethod
    def activity_id():
        return "fib"

    def _activity_name(self):
        return "FIB activity"

    def _gen_activity(self):
        # Figure out paragraphs
        paragraphs = split_into_paragraphs(self.conf["text"])

        idx_blank = 0
        blanks = self.conf["blanks"]
        casing = self.conf["casing"]

        with div(cls="card-body px-3 pt-0 pb-2 m-0"):
            with div(id = f"{self.prefix_id}-casing-div", data_casing=str(casing)):
                for idx_para, para in enumerate(paragraphs):
                    with div(cls="fib-text d-flex flex-row flex-wrap align-items-baseline"):
                        parts = para.split("|blank|")
                        for idx_part, part in enumerate(parts):
                            formatted_text = panflute.convert_text(
                                    part, output_format='html')
                            div(raw(formatted_text))

                            # If there is blank spaces behind, generate input HTML
                            if idx_part + 1 < len(parts):
                                blank = blanks[idx_blank]
                                idx_blank += 1
                                with div(cls="input-group input-group-sm px-2 w-auto"):
                                    input_(cls="form-control",
                                           type = "text",
                                           placeholder = blank["type"],
                                           data_answer = blank["answer"])
                                    span(str(idx_blank),
                                         cls = "input-group-text fw-medium")

    def _gen_testing_activity(self):
        div(id = f"{self.prefix_id}-testing-score",
            cls = "alert d-none")
        for i, blank in enumerate(self.conf["blanks"]):
            formatted_text = panflute.convert_text(
                    blank["feedback"], output_format = 'html')
            with div(id=f"{self.prefix_id}-feedback-{i}",
                     cls="d-flex align-items-center fib-feedback-item m-1 p-2 border-start border-5 d-none"):
                span(str(i + 1),
                     cls = "badge text-bg-light fw-medium me-1 p-1")
                div(raw(formatted_text))
