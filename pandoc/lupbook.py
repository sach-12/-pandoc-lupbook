#!/usr/bin/env python3

# Copyright (c) 2021 LupLab
# SPDX-License-Identifier: AGPL-3.0-only

import panflute

import fib_filter
import icode_filter
import matching_filter
import mcq_filter
import parsons_filter
import hparsons_filter

def _process_lupbook_filters(element, doc):
    # Quit early when incorrect type of element
    if type(element) is not panflute.CodeBlock or not doc.format == "html":
        return

    # TODO: May want to enforce that our interactive element have an ID in order
    # to help with debugging (if the YAML config is incorrect for instance).
    # Otherwise, we don't have a good way of pointing where errors are.
    # => if element.ident == "": raise Exception

    # Find the corresponding lupbook filter if any
    # NOTE: we only look at the first element class
    lb_filters = [
        fib_filter.LupbookFIB,
        hparsons_filter.LupbookHParsons,
        icode_filter.LupbookICode,
        matching_filter.LupbookMatching,
        mcq_filter.LupbookMCQ,
        parsons_filter.LupbookParsons,
        ]
    lb_filter_map = { f.activity_id(): f for f in lb_filters }
    try:
        lb_filter = lb_filter_map[element.classes[0]]
    except KeyError:
        return

    # Found an element we know how to process!
    return lb_filter(element.text).process()

if __name__ == "__main__":
    panflute.run_filter(_process_lupbook_filters)
