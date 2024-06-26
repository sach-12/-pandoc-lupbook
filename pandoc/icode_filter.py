# Copyright (c) 2021 LupLab
# SPDX-License-Identifier: AGPL-3.0-only

import base64
import json

from dominate.tags import button, div, i, li, textarea, ul

import icode_schema
import lupbook_filter


#
# Various helpers
#

def _encode_html_attr(obj):
    """
    Encode JSON portion into base64
    """
    return base64.b64encode(json.dumps(obj).encode()).decode()

def _normalize_line_ranges(yaml_rangelist, max_lines):
    """
    Process a list of line ranges
    """
    sanitized = []
    for item in yaml_rangelist:
        if isinstance(item, int):
            start, end = item, item
        elif isinstance(item, dict):
            start, end = item["from"], item["to"]

        # Count from the end if values are negative
        start = max_lines + start + 1 if start < 0 else start
        end = max_lines if end > max_lines else end

        # Limit value to actual max lines
        start = max_lines if start > max_lines else start
        end = max_lines + end + 1 if end < 0 else end

        # Swap values is range is described in opposite order
        if start > end:
            start, end = end, start

        sanitized.append((start, end))

    # List of ranges sorted by starting lines
    sanitized.sort()

    # Merge consecutive ranges that overlap with one another
    merged = []
    while sanitized:
        cur = sanitized.pop(0)
        while sanitized and cur[1] >= sanitized[0][0] - 1:
            cur = (cur[0], max(cur[1], sanitized.pop(0)[1]))
        merged.append(cur)

    # Return list of ordered, distinct ranges
    return merged

def _negate_line_ranges(rangelist, max_lines):
    """
    Give a list of ordered, distinct lines ranges, compute the negated list
    """
    negated = []

    start = 1
    for start_range, end_range in rangelist:
        if start_range > start:
            negated.append((start, start_range - 1))
        start = end_range + 1

    if start <= max_lines:
        negated.append((start, max_lines))

    return negated

def _encode_rdonly(yaml_ro, file_data):
    if yaml_ro is None:
        return ""

    endl = file_data.count("\n") + 1

    if isinstance(yaml_ro, bool):
        return yaml_ro

    negate = False
    if isinstance(yaml_ro, dict) and "except" in yaml_ro:
        negate = True
        yaml_ro = yaml_ro["except"]

    rangelist = _normalize_line_ranges(yaml_ro, endl)
    if negate:
        rangelist = _negate_line_ranges(rangelist, endl)

    return _encode_html_attr(rangelist)


#
# Component generation
#

class LupbookICode(lupbook_filter.LupbookComponent):
    def __init__(self, yaml_config):
        super().__init__(yaml_config)
        self.testing_cnt = len(self.conf["tests"])

    @staticmethod
    def _yaml_validator():
        return icode_schema.icode_validator

    @staticmethod
    def activity_id():
        return "icode"

    def _activity_name(self):
        return "Coding activity"

    def _gen_activity(self):
        active_tab = None
        tab_data = []

        with div(cls = "card-body p-2 m-0"):
            # Tab buttons
            with ul(cls = "nav nav-tabs", role = "tablist"):
                for src_file in self.conf["skeleton"]:

                    file_name = src_file["filename"]
                    file_uid = f"{self.prefix_id}-{id(src_file):x}"

                    # Store tab data for next loop which needs the same info
                    tab_data.append((src_file, file_name, file_uid))

                    # Don't show nav tab for hidden files
                    if src_file["hidden"]:
                        continue

                    if active_tab is None:
                        active_tab = file_name

                    with li(cls = "nav-item"):
                        button(file_name,
                               id = f"{file_uid}-tab",
                               cls = "nav-link" + (
                                   " active" if active_tab == file_name else ""),
                               data_bs_toggle = "tab",
                               data_bs_target = f"#{file_uid}",
                               type = "button",
                               role = "tab")

            # Tab contents
            with div(cls = "border border-top-0 tab-content"):
                for src_file, file_name, file_uid in tab_data:

                    # Prep textarea
                    textarea_args = {
                        "data_tab": f"{file_uid}-tab",
                        "data_filename": file_name,
                        "cls": "icode-srcfile"
                    }
                    if src_file["readonly"]:
                        textarea_args["data_readonly"] = _encode_rdonly(
                                src_file["readonly"], src_file["data"])

                    with div(cls = "tab-pane"
                             + (" active" if active_tab == file_name else ""),
                             id = file_uid,
                             role = "tabpanel"):
                        textarea(src_file["data"], **textarea_args)

    def _gen_testing_activity(self):
        accord_div = div(cls = "accordion accordion-flush")

        for idx, test in enumerate(self.conf["tests"]):
            test_id = f"{self.prefix_id}-test-{idx:d}"

            # One accordion item per test to run
            accord_item_div = div(cls = "accordion-item icode-test",
                data_params = _encode_html_attr(test))
            with accord_item_div:
                # Accordion header
                with div(cls = "accordion-header"):
                    with button(id = f"{test_id}-btn",
                                cls = "accordion-button collapsed",
                                type = "button",
                                disabled = True,
                                data_bs_toggle = "collapse",
                                data_bs_target = "#{}".format(test_id)):
                        i(cls = "bi bi-dash-circle-fill text-secondary me-1")
                        div(test["name"])
                # Accordion body
                with div(id = test_id, cls = "accordion-collapse collapse"):
                    div(id = f"{test_id}-testing", cls = "accordion-body")

            accord_div += accord_item_div
