"""
Pandoc filter to process fenced divs with class "mcq" into Multiple Choice
Question components.

Depends on dominate for HTML generation
"""

import dominate
import json
import os
import sys
import yaml

import pandocfilters

from dominate.tags import *

from mcq_schema import mcq_validator

from utils import LupbookLoader

def header(args):
    with div(cls = "card-header"):
        h5(args["title"], cls = "card-title")
    with div(cls = "px-2 m-0 card-body mcq-l-stem"):
        p(args["stem"])

def body(args):
    with div(cls = "p-2 m-0 card-body mcq-l-form"):
        for i, answer in enumerate(args["answers"]):
            with div(cls = "form-check"):
                if (args["type"] == "one"):
                    input_type = "mcq-l-radio"
                    type = "radio"
                else:
                    input_type = "mcq-l-checkbox"
                    type = "checkbox"
                input_(cls = "form-check-input" + " " + input_type, type = type,
                       name = f"{args['id']}-choice", id = f"{args['id']}-choice-{i}", data_correct = "true")
                with label(cls = "form-check-label"):
                    span(cls = "mcq-l-spans")
                    span(answer["text"])
    hr(cls = "m-0")

def controls(args):
    with div(cls = "m-0 card-body mcq-l-controls"):
        with div(cls = "d-flex align-items-center"):
            with div(cls = "px-2 flex-shrink-0"):
                button("Submit", cls = "btn btn-primary mcq-c-button mcq-c-button__submit")
                button("Reset", cls = "btn btn-secondary mcq-c-button mcq-c-button__reset")
            with div(cls = "px-2 w-100"):
                div (cls = "d-none")
            with div(cls = "px-2 flex-shrink-1"):
                button(cls = "mcq-c-feedback__toggle collapsed d-none",
                       data_bs_target = f"#{args['id']}-fb", data_bs_toggle = "collapse", type = "button")

def feedback(args):
    with div(cls = "collapse mcq-l-feedback", id = f"{args['id']}-fb"):
        with div(cls = "px-2 card-body"):
            div(id = f"{args['id']}-fb-warn")
            with div(id = f"{args['id']}-fb-check"):
                if(args["type"] == "many"):
                    div(cls = "mcq-l-num-correct d-none", id = f"{args['id']}-num-correct")
                for i, answer in enumerate(args["answers"]):
                    div_type = "mcq-l-check-pass" if (answer["id"] in args["key"]) else "mcq-l-check-error"
                    div(answer["feedback"], cls = "mcq-l-check" + " " + div_type + " " + "d-none", id = f"{args['id']}-choice-{i}-fb")

# TODO: separate generation for with and without bootstrap
def MCQ(key, value, format, meta):
    if key != "CodeBlock" or format != "html":
        return

    # unpack pandoc object
    [[ident, classes, keyvals], data] = value

    if not "mcq" in classes:
        return

    mcq_args = yaml.load(data, LupbookLoader)
    try:
        mcq_validator.validate(mcq_args)
    except:
        sys.stderr.write("Validation error in mcq element:\n{}\n".format(data))
        raise

    mcq_type = "mcq-l-container-one" if (mcq_args["type"] == "one") else "mcq-l-container-many"
    root = div(id = mcq_args["id"], cls = "card my-3 " + " " + mcq_type)

    with root:
        header(mcq_args)
        body(mcq_args)
        controls(mcq_args)
        feedback(mcq_args)
        div(cls = "card-footer text-muted")

    return pandocfilters.RawBlock("html", root.render())

