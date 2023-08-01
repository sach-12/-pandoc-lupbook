"""
Pandoc filter to process fenced divs with class "fia" into Fill-in Answer
Question components.

Depends on dominate for HTML generation
"""

import dominate
import json
import os
import sys
import yaml

import pandocfilters
import panflute as pf

from dominate.tags import *
from dominate.util import raw

from fia_schema import fia_validator

from utils import LupbookLoader


def header(args):
    with div(cls="card-header"):
        h4(args["title"], cls="card-title")


def body(args):
    with div(cls="px-2 m-0 card-body fia-l-text"):
        with div(cls="d-flex flex-row flex-wrap"):
            # get answers
            answers = args["answers"]
            index_answer = 0
            # get text
            text = args["text"]
            paragraphs = text.split(os.linesep + os.linesep)
            # generate text
            for index_para, paragraph in enumerate(paragraphs):
                # handle each part split by black
                parts = paragraph.split("|blank|")
                for index_part, part in enumerate(parts):
                    if part != "":
                        formatted_text = pf.convert_text(text=part, output_format='html')
                        div(raw(formatted_text), cls="p-2 align-items-center")
                    # If there is blank spaces behind, generate input HTML
                    if index_part + 1 < len(parts):
                        answer = answers[index_answer]["answer"]
                        type_answer = answers[index_answer]["type"]
                        index_answer += 1
                        with div(cls="p-2"):
                            input_(cls="form-control form-control-sm fia-l-input",
                                   placeholder=type_answer, type=type_answer, data_answer=answer)
                if index_para + 1 < len(paragraphs) and paragraphs[index_para+1] != "":
                    div(cls="line-break")
    hr(cls="m-0")


def controls(args):
    with div(cls="m-0 card-body fia-l-controls"):
        with div(cls="d-flex align-items-center"):
            with div(cls="px-2 flex-shrink-0"):
                button(
                    "Submit", cls="btn btn-primary fia-c-button fia-c-button__submit")
                button(
                    "Reset", cls="btn btn-secondary fia-c-button fia-c-button__reset")
            with div(cls="px-2 w-100"):
                div(cls="d-none")
            with div(cls="px-2 flex-shrink-1"):
                button(cls="fia-c-feedback__toggle collapsed d-none",
                       data_bs_target=f"#{args['id']}-fb", data_bs_toggle="collapse", type="button")


def feedback(args):
    with div(cls="collapse fia-l-feedback", id=f"{args['id']}-fb"):
        with div(cls="px-2 card-body"):
            div(id=f"{args['id']}-fb-warn")
            with div(id=f"{args['id']}-fb-check"):
                div("You got it right! Congratulations!",
                    cls="fia-l-check fia-l-check-pass d-none")

                for i, answer in enumerate(args["answers"]):
                    formatted_text = pf.convert_text(text=answer["feedback"], output_format='html')
                    div(raw(formatted_text), cls="fia-l-check" + " " +
                        "fia-l-check-error" + " " + "d-none", id=f"{args['id']}-input-{i}-fb")


def fia(key, value, format, meta):
    if key != "CodeBlock" or format != "html":
        return

    # unpack pandoc object
    [[ident, classes, keyvals], data] = value

    if not "fia" in classes:
        return

    fia_args = yaml.load(data, LupbookLoader)
    try:
        fia_validator.validate(fia_args)
    except:
        sys.stderr.write("Validation error in fia element:\n{}\n".format(data))
        raise

    root = div(id=fia_args["id"], cls="card my-3 " + " " + "fia-l-container")

    with root:
        header(fia_args)
        body(fia_args)
        controls(fia_args)
        feedback(fia_args)
        div(cls="card-footer text-muted")

    return pandocfilters.RawBlock("html", root.render())
