"""
Shared code between filters
"""

import os
import sys

from dominate.tags import *
from dominate.util import raw
import jsonschema
import panflute
import yaml

#
# YAML loading
#
class LupbookLoader(yaml.SafeLoader):
    def include(self, node):
        """ Include YAML file """
        fname = os.path.join(os.path.curdir, self.construct_scalar(node))
        with open(fname, 'r') as fin:
            return yaml.load(fin, LupbookLoader)

    def raw_include(self, node):
        """ Include file verbatim """
        fname = os.path.join(os.path.curdir, self.construct_scalar(node))
        with open(fname, 'rb') as fin:
            return fin.read().decode('utf-8')

# New `!include` command for including YAML file
LupbookLoader.add_constructor('!include', LupbookLoader.include)
# New `!raw_include` command for including data file
LupbookLoader.add_constructor('!raw_include', LupbookLoader.raw_include)

#
# Generic interactive component
#

# Only consider fenced code blocks that correspond to @cls
def validate_element(cls, element, doc):
    if type(element)!= panflute.CodeBlock \
            or not cls in element.classes \
            or not doc.format == "html":
                return False

    # TODO: May want to enforce that our interactive element have an ID in order
    # to help with debugging (if the YAML config is incorrect for instance).
    # Otherwise, we don't have a good way of pointing where errors are.
    # => if element.ident == "": raise Exception

    return True

class LupbookComponent:
    def __init__(self, yaml_config):
        self.yaml_config = yaml_config
        self.args = None

    def _yaml_validator(self):
        raise NotImplementedError

    def _activity_id(self):
        raise NotImplementedError

    def _activity_name(self):
        raise NotImplementedError

    def _load_yaml(self):
        try:
            self.args = yaml.load(self.yaml_config, LupbookLoader)
        except yaml.YAMLError as error:
            sys.stderr.write("Error loading YAML configuration: ", error)
            raise

    def _validate_yaml(self):
        try:
            self._yaml_validator().validate(self.args)

        except jsonschema.exceptions.ValidationError as error:
            # User error in their YAML description
            # TODO: improve error reporting
            sys.stderr.write("Error parsing YAML configuration: {}.\n"
                             .format(error))
            raise

        except Exception as e:
            # Other errors potentially because of us, fail
            sys.stderr.write("Internal error: {}.\n".format(e))
            raise

    def _gen_header(self):
        with div(cls = "card-header"):
            div(self._activity_name(), cls = "text-secondary small")

    def _gen_description(self):
        with div(cls = "card-body"):
            h5(self.args["title"], cls = "card-title")
            formatted_text = panflute.convert_text(self.args["prompt"],
                                                   output_format='html')
            div(raw(formatted_text), cls = "card-text")

    def _gen_activity(self):
        raise NotImplementedError

    def _gen_controls(self):
        raise NotImplementedError

    def _gen_feedback(self):
        raise NotImplementedError

    def _gen_footer(self):
        with div(cls = "card-footer"):
            div(self.args["id"], cls = "text-end text-secondary small")

    def _generate_html(self):
        root = div(id = self.args["id"],
                   cls = "card my-3 {}-container".format(self._activity_id()))
        with root:
            self._gen_header()
            self._gen_description()
            self._gen_activity()
            self._gen_controls()
            self._gen_feedback()
            self._gen_footer()

        return panflute.RawBlock(text=root.render(), format='html')

    def process(self):
        self._load_yaml();
        self._validate_yaml();
        return self._generate_html();

