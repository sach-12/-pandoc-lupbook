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

import panflute as pf

from dominate.tags import *
from dominate.util import raw

from mcq_schema import mcq_validator

from utils import LupbookLoader

def header(args):
    with div(cls = "card-header"):
        h5(args["title"], cls = "card-title")
    with div(cls = "px-2 m-0 card-body mcq-l-stem"):
        formatted_text = pf.convert_text(text=args["stem"], output_format='html')
        raw(formatted_text)

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
                with label(cls = "form-check-label d-flex"):
                    span(cls = "mcq-l-spans")
                    formatted_text = pf.convert_text(text=answer["text"], output_format='html')
                    raw(formatted_text)
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
                    formatted_text = pf.convert_text(answer["feedback"], output_format='html')
                    div(raw(formatted_text), cls = "mcq-l-check" + " " + div_type + " " + "d-none" + " "+ "d-flex", id = f"{args['id']}-choice-{i}-fb")


# TODO: separate generation for with and without bootstrap
def MCQ(element, doc):
    if type(element)!= pf.CodeBlock or not "mcq" in element.classes or not doc.format == "html":
        return
    
    # get CodeBlock content
    mcq_args = yaml.load(element.text, LupbookLoader)

    # validate arguments
    try:
        mcq_validator.validate(mcq_args)
    except:
        sys.stderr.write("Validation error in mcq element.\n")
        raise

    # generate HTML
    mcq_type = "mcq-l-container-one" if (mcq_args["type"] == "one") else "mcq-l-container-many"
    root = div(id = mcq_args["id"], cls = "card my-3 " + " " + mcq_type)
    with root:
        header(mcq_args)
        body(mcq_args)
        controls(mcq_args)
        feedback(mcq_args)
        div(cls = "card-footer text-muted")

    return pf.RawBlock(text=root.render(), format='html')

