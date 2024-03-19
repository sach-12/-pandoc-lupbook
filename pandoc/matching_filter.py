"""
Pandoc filter to process fenced divs with class "matching" into
Matchig Exercise components.

Depends on dominate for HTML generation
"""

import dominate
import json
import os
import sys
import yaml
import random

import panflute as pf

from dominate.tags import *
from dominate.util import raw

from matching_schema import matching_validator

from utils import LupbookLoader


def header(args):
    with div(cls="card-header matching-c-title"):
        div(args["title"], cls="card-title")

def body(args):
    # Generate question
    with div(cls="px-2 m-0 card-body matching-c-question"):
        text = args["text"]
        formatted_text = pf.convert_text(text=text, output_format='html')
        raw(formatted_text)

    # Generate containers and blocks
    with div(cls="m-0 card-body row matching-l-body"):
        with div(cls="m-2 col"):
            div("Drag from here")
            with div(id=f"matching-{args['id']}-choices",
                     cls="matching-l-choices border"):
                choices = args["choices"]
                if args['random']:
                    random.shuffle(choices)
                for i, block in enumerate(choices):
                    generateChoiceBlock(args, block)

        with div(cls="m-2 col"):
            div("Drop blocks here")
            with div(id=f"matching-{args['id']}-answers",
                     cls="matching-l-answers border"):
                for i, block in enumerate(args['answers']):
                    generateAnswerBlock(args, block)

def generateChoiceBlock(args, choice):
    div_attrs = {
        "id": f"matching-{args['id']}-choice-{choice['id']}",
        "cls": "matching-c-choice border rounded m-2 p-2 d-flex",
        "matchid": f"{choice['match_id']}"
    }
    with div(**div_attrs):
        text = choice['text']
        formatted_text = pf.convert_text(text=text, output_format='html')
        modified_text = formatted_text.replace('<p>', '<p class="m-1">')
        raw(modified_text)

def generateAnswerBlock(args, answer):
    div_attrs = {
        "id": f"matching-{args['id']}-answer-{answer['id']}",
        "cls": "matching-c-answer border rounded m-2 p-2 d-flex flex-column",
    }
    with div(**div_attrs):
        text = answer['text']
        formatted_text = pf.convert_text(text=text, output_format='html')
        modified_text = formatted_text.replace('<p>', '<p class="m-1">')
        raw(modified_text)

def controls(args):
    with div(cls="m-0 card-body matching-l-controls"):
        with div(cls="d-flex align-items-center"):
            with div(cls="px-2 flex-shrink-0"):
                button("Submit",
                       id=f"matching-{args['id']}-submit",
                       cls="btn btn-primary matching-c-button matching-c-button__submit")
                button("Reset",
                       id=f"matching-{args['id']}-reset",
                       cls="btn btn-secondary matching-c-button matching-c-button__reset")
            with div(cls="px-2 w-100"):
                div(cls="d-none")
            with div(cls="px-2 flex-shrink-1"):
                button(id=f"matching-{args['id']}-feedback-btn",
                       cls="matching-c-feedback__toggle collapsed d-none",
                       data_bs_target=f"#matching-{args['id']}-feedback",
                       data_bs_toggle="collapse", type="button")


def feedback(args):
    with div(id=f"matching-{args['id']}-feedback",
             cls="collapse matching-l-feedback"):
        with div(cls="px-2 card-body"):
            div(id=f"matching-{args['id']}-correct",
                cls="matching-c-feedback-correct d-none")
            with div(cls="matching-l-feedback-items"):
                for i, choice in enumerate(args["choices"]):
                    formatted_text = pf.convert_text(choice["feedback"],
                                                     output_format='html')
                    div(raw(formatted_text),
                        id = f"matching-{args['id']}-feedback-{choice['id']}",
                        cls = "matching-c-feedback-item d-none")

def Matching(element, doc):
    if (type(element) != pf.CodeBlock
        or not "matching" in element.classes
        or not doc.format == "html"):
        return

    # YAML specification of interactive activity
    matching_args = yaml.load(element.text, LupbookLoader)

    # Validate arguments
    try:
        matching_validator.validate(matching_args)
    except:
        sys.stderr.write("Validation error in matching element.\n")
        raise

    # Generate corresponding HTML
    root = div(id=matching_args["id"],
               cls="card my-3" + " " + "matching-l-container")
    with root:
        header(matching_args)
        body(matching_args)
        controls(matching_args)
        feedback(matching_args)
        div(cls="card-footer text-muted")

    return pf.RawBlock(text=root.render(), format='html')
