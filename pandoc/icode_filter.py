"""
Pandoc filter to process fenced divs with class "ICode" into interactive code
elements.

Depends on dominate
"""

import dominate
import json
import os
import sys
import yaml

import panflute as pf

from dominate.tags import *

from icode_schema import icode_validator

from utils import LupbookLoader

def encode_html_attr(obj):
    str = json.dumps(obj)
    str = str.replace("%", "%25")
    str = str.replace('"', "%22")
    return str

def normalize_line_ranges(yaml_rangelist, max_lines):
    sanitized = []
    for item in yaml_rangelist:
        if type(item) is int:
            start, end = item, item
        elif type(item) is dict:
            start, end = item["from"], item["to"]

        start = max_lines + start + 1 if start < 0 else start
        start = max_lines if start > max_lines else start
        end = max_lines if end > max_lines else end
        end = max_lines + end + 1 if end < 0 else end

        if start > end:
            start, end = end, start

        sanitized.append((start, end))

    sanitized.sort()

    merged = []
    while sanitized:
        cur = sanitized.pop(0)
        if sanitized and cur[1] >= sanitized[0][0] - 1:
            merged.append((cur[0], sanitized.pop(0)[1]))
        else:
            merged.append(cur)

    return merged

def negate_line_ranges(rangelist, max_lines):
    negated = []

    if rangelist[0][0] > 1:
        negated.append((1, rangelist[0][0] - 1))

    while rangelist:
        cur = rangelist.pop(0)
        if not rangelist and cur[1] < max_lines:
            negated.append((cur[1] + 1, max_lines))
        elif rangelist:
            negated.append((cur[1] + 1, rangelist[0][0] - 1))

    return negated


def encode_rdonly(yaml_ro, file_data):
    endl = file_data.count("\n") + 1

    if type(yaml_ro) == bool:
        return yaml_ro

    negate = False
    if type(yaml_ro) == dict and "except" in yaml_ro:
        negate = True
        yaml_ro = yaml_ro["except"]

    rangelist = normalize_line_ranges(yaml_ro, endl)
    if negate:
        rangelist = negate_line_ranges(rangelist, endl)

    return encode_html_attr(rangelist)

def header(args):

    with div(cls = "card-header"):
        if "title" in args:
            h5(args["title"], cls = "card-title")
        nav_ul = ul(cls = "nav nav-tabs card-header-tabs", data_bs_tabs = "tabs")

    active_link = None
    for i, src_file in enumerate(args["skeleton"]):
        file_id = "{}-inp-{:x}".format(args["id"], id(src_file))

        if src_file["hidden"]:
            continue

        link_classes = ["nav-link"]
        if active_link is None:
            active_link = src_file
            link_classes.append("active")

        link = a(src_file["filename"],
            cls = " ".join(link_classes),
            data_bs_toggle = "tab",
            data_bs_target = "#{}".format(file_id),
            type = "button",
            role = "tab")
        nav_ul += li(link, cls = "nav-item")

def body(args):
    body_div = div(cls = "p-0 m-0 card-body tab-content ic-l-srcfiles")

    active_tab = None
    for i, src_file in enumerate(args["skeleton"]):
        file_id = "{}-inp-{:x}".format(args["id"], id(src_file))
        tab_classes = ["tab-pane"]

        if active_tab is None and not src_file["hidden"]:
            active_tab = src_file
            tab_classes.append("active")

        textarea_args = {
            "data_filename": src_file["filename"],
            "cls": "ic-c-srcfile"
        }

        if src_file["readonly"]:
            textarea_args["data_readonly"] = encode_rdonly(src_file["readonly"],
                src_file["data"])

        body_div += div(textarea(src_file["data"], **textarea_args),
            id = file_id, cls = " ".join(tab_classes))

def controls(args):
    hr(cls = "m-0")
    feedback_id = "{}-fb".format(args["id"])
    with div(cls = "m-0 card-body ic-l-controls"):
        with div(cls = "d-flex align-items-center"):
            with div(cls = "px-2 flex-shrink-1"):
                button("Run",
                    cls = "btn btn-primary ic-c-button ic-c-button__run")

            with div(cls = "px-2 w-100"):
                with div(cls = "progress ic-c-progress d-none"):
                    div(cls = "progress-bar", role = "progressbar")

            with div(cls = "px-2 flex-shrink-1"):
                button(cls = "ic-c-tests__toggle collapsed", type = "button",
                    data_bs_toggle = "collapse",
                    data_bs_target = "#{}".format(feedback_id))

def feedback(args):
    feedback_id = "{}-fb".format(args["id"])
    with div(cls = "collapse", id = feedback_id):
        with div(cls = "p-0 card-body ic-l-feedback"):
            hr(cls = "m-0")
            accord_div = div(cls = "accordion accordion-flush")

    for idx, test in enumerate(args["tests"]):
        test_id = "{}-t{:d}".format(args["id"], idx)
        header_id = "{}-h{:d}".format(args["id"], idx)

        accord_item_div = div(cls = "accordion-item ic-l-test",
            data_params = encode_html_attr(test))
        with accord_item_div:
            with h2(cls = "accordion-header", id = header_id):
                accord_btn = button(
                    cls = "accordion-button collapsed ic-c-test__hdr",
                    type = "button",
                    disabled = True,
                    data_bs_toggle = "collapse",
                    data_bs_target = "#{}".format(test_id))
                accord_btn["aria-expanded"] = "false"
                accord_btn["aria-controls"] = test_id
                with accord_btn:
                    span(test["name"])

            accord_body = div(cls = "accordion-collapse collapse", id = test_id)
            accord_body["aria-labelledby"] = header_id
            with accord_body:
                div(cls = "accordion-body",
                    id = "{}-fb".format(test_id))

        accord_div += accord_item_div


# TODO: separate generation for with and without bootstrap
def ICode(element, doc):
    if type(element)!= pf.CodeBlock or not "icode" in element.classes or not doc.format == "html":
        return
    
    # get CodeBlock content
    icode_args = yaml.load(element.text, LupbookLoader)

    # validate arguments
    try:
        icode_validator.validate(icode_args)
    except:
        sys.stderr.write("Validation error in icode element.\n")
        raise

    # generate HTML
    root = div(id = icode_args["id"], cls = "card my-3 ic-l-container")
    with root:
        header(icode_args)
        body(icode_args)
        controls(icode_args)
        feedback(icode_args)
        div(cls = "card-footer text-muted")

    return pf.RawBlock(text=root.render(), format='html')

