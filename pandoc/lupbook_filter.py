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
        # Load YAML config
        try:
            self.conf = yaml.load(yaml_config, LupbookLoader)
        except yaml.YAMLError as error:
            sys.stderr.write("Error loading YAML configuration: ", error)
            raise

        # Validate YAML against schema
        try:
            self._yaml_validator().validate(self.conf)

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

        self.prefix_id = f"{self.activity_id()}-{self.conf['id']}"

    @staticmethod
    def activity_id():
        raise NotImplementedError

    def _activity_name(self):
        raise NotImplementedError

    @staticmethod
    def _yaml_validator():
        raise NotImplementedError

    def _gen_header(self):
        with div(cls = "card-header"):
            div(self._activity_name(), cls = "text-secondary small")

    def _gen_description(self):
        with div(cls = "card-body"):
            h5(self.conf["title"], cls = "card-title")
            prompt_html = panflute.convert_text(self.conf["prompt"],
                                                output_format='html')
            div(raw(prompt_html), cls = "card-text lupbook-description")

    def _gen_activity(self):
        raise NotImplementedError

    def _gen_controls(self):
        raise NotImplementedError

    def _gen_feedback(self):
        raise NotImplementedError

    def _gen_footer(self):
        with div(cls = "card-footer"):
            div(self.conf["id"], cls = "text-end text-secondary small")

    def _generate_html(self):
        root = div(id = self.conf["id"],
                   cls = "card my-3 {}-container".format(self.activity_id()))
        with root:
            self._gen_header()
            self._gen_description()
            self._gen_activity()
            self._gen_controls()
            self._gen_feedback()
            self._gen_footer()

        return panflute.RawBlock(text=root.render(), format='html')

    def process(self):
        return self._generate_html();

