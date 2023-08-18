"""
Pandoc filter to process fenced divs with class "parsons" into
Parsons Exercise components.

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

from parsons_schema import parsons_validator

from utils import LupbookLoader


def header(args):
    with div(cls="card-header"):
        h4(args["title"], cls="card-title")


def body(args):
    # Generate question
    with div(cls="px-2 m-0 card-body parsons-l-question"):
        text = args["text"]
        formatted_text = pf.convert_text(text=text, output_format='html')
        raw(formatted_text)

    # Generate containers and blocks
    with div(cls="m-0 card-body parsons-l-sortable-code-container row"):
        with div(id=f"{args['id']}-sourceRegion", cls="sortable-code col m-2"):
            div("Drag from here", id=f"{args['id']}-sourceTip")
            with div(id=f"{args['id']}-source", cls="sortable-container parsons-l-source border",
                     ondragover="dragover(event)", ondrop="drop(event)", ondragleave="dragleave(event)"):
                # Congregate or-block
                blocks = combineOrBlocks(args['blocks'])
                if args['random']:
                    random.shuffle(blocks)
                block_label = 1
                for i, block in enumerate(blocks):
                    if isinstance(block, dict):
                        generateBlock(args, block, block_label)
                        block_label += 1
                    elif isinstance(block, list):
                        or_blocks = block
                        or_block_id = f"{args['id']}-or-blocks-{or_blocks[0]['or_id']}"
                        with div(id=or_block_id, cls="text-bg-secondary rounded parsons-l-or-blocks"):
                            span("or{", cls="parsons-l-or-symbol text-black")
                            with div(cls="parsons-l-or-content flex-fill"):
                                for or_block in or_blocks:
                                    generateBlock(
                                        args, or_block, block_label, True, or_block_id)
                                    block_label += 1
                    else:
                        raise TypeError("Not a valid type: ", block)

        with div(id=f"{args['id']}-answerRegion", cls="sortable-code col m-2"):
            div("Drop blocks here", id=f"{args['id']}-answerTip")
            div(id=f"{args['id']}-answer", cls="sortable-container parsons-l-answer border",
                ondragover="dragover(event)", ondrop="drop(event)", ondragleave="dragleave(event)")


def combineOrBlocks(blocks):
    result = []
    index = 0

    while index < len(blocks):
        block = blocks[index]

        if 'or_id' not in block:
            result.append(block)
            index += 1
            continue

        or_id = block['or_id']
        or_block = [block]

        or_index = index + 1
        while or_index < len(blocks):
            if blocks[or_index].get('or_id') == or_id:
                or_block.append(blocks.pop(or_index))
                continue
            or_index += 1

        result.append(or_block)
        index += 1

    return result


def generateBlock(args, block, block_label, is_or_block=False, or_block_id=""):
    div_attrs = {
        "id": f"{args['id']}-block-{block['id']}",
        "cls": "parsons-l-block border rounded m-2 p-2 d-flex",
        "draggable": "true",
        "ondragstart": "dragstart(event)",
        "ondragend": "dragend(event)",
        "data_correct_order": block['order']
    }

    if is_or_block:
        div_attrs["data_or_block_id"] = or_block_id
        div_attrs['cls'] += ' parsons-l-or-block'

    with div(**div_attrs):
        if args['label']:
            span(block_label, cls="badge text-bg-light m-1")
        text = block['text']
        formatted_text = pf.convert_text(
            text=text, output_format='html')
        modified_text = formatted_text.replace(
            '<p>', '<p class="m-1">')
        raw(modified_text)


def controls(args):
    with div(cls="m-0 card-body parsons-l-controls"):
        with div(cls="d-flex align-items-center"):
            with div(cls="px-2 flex-shrink-0"):
                button(
                    "Submit", cls="btn btn-primary parsons-c-button parsons-c-button__submit")
                button(
                    "Reset", cls="btn btn-secondary parsons-c-button parsons-c-button__reset")
            with div(cls="px-2 w-100"):
                div(cls="d-none")
            with div(cls="px-2 flex-shrink-1"):
                button(cls="parsons-c-feedback__toggle collapsed d-none",
                       data_bs_target=f"#{args['id']}-fb", data_bs_toggle="collapse", type="button")


def feedback(args):
    with div(cls="collapse parsons-l-feedback", id=f"{args['id']}-fb"):
        with div(cls="px-2 card-body"):
            div(id=f"{args['id']}-fb-warn")
            with div(id=f"{args['id']}-fb-check"):
                div("You got it right! Congratulations!",
                    cls="parsons-l-check parsons-l-check-pass d-none")
                div("Try it again!", cls="parsons-l-check parsons-l-check-error d-none")


def Parsons(element, doc):
    if type(element) != pf.CodeBlock or not "parsons" in element.classes or not doc.format == "html":
        return

    # get CodeBlock content
    parsons_args = yaml.load(element.text, LupbookLoader)

    # validate arguments
    try:
        parsons_validator.validate(parsons_args)
    except:
        sys.stderr.write("Validation error in parsons element.\n")
        raise

    # generate HTML
    root = div(id=parsons_args["id"],
               cls="card my-3" + " " + "parsons-l-container")
    with root:
        header(parsons_args)
        body(parsons_args)
        controls(parsons_args)
        feedback(parsons_args)
        div(cls="card-footer text-muted")

    return pf.RawBlock(text=root.render(), format='html')
