"""
Shared code between filters
"""

import os
import sys

from dominate.tags import button, div, h5, i
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
# Generic class from which filters for the different interactive activities are
# meant to derive
#
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
        with div(cls = "card-header py-1 px-2"):
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
        with div(cls = "card-body p-2 m-0 border-top"):
            with div(cls = "d-flex align-items-center"):
                with div(cls = "ps-2"):
                    button("Submit",
                           id = f"{self.prefix_id}-submit",
                           cls = "btn btn-primary",
                           disabled = True)
                    button("Reset",
                           id = f"{self.prefix_id}-reset",
                           cls = "btn btn-secondary")

                with div(cls = "px-2 flex-grow-1"):
                    with div(id = f"{self.prefix_id}-testing-progress",
                             cls = "progress-stacked d-none",
                             style="cursor: pointer;",
                             data_bs_target = f"#{self.prefix_id}-testing",
                             data_bs_toggle = "collapse"):
                        for _ in range(self.testing_cnt):
                            with div(cls = "progress", role = "progressbar",
                                     style = f"width: {100 / self.testing_cnt}%"):
                                div(cls = "progress-bar")

                with div(cls = "pe-2"):
                    with button(id = f"{self.prefix_id}-testing-btn",
                                cls = "lupbook-testing-btn btn btn-light collapsed d-none",
                                data_bs_target = f"#{self.prefix_id}-testing",
                                data_bs_toggle = "collapse", type = "button"):
                        i(cls = "bi bi-chevron-up")

    def _gen_testing(self):
        with div(id = f"{self.prefix_id}-testing", cls = "collapse"):
            with div(cls = "card-body border-top"):
                self._gen_testing_activity()

    def _gen_testing_activity(self):
        raise NotImplementedError

    def _gen_footer(self):
        with div(cls = "card-footer py-1 px-2"):
            div(self.conf["id"], cls = "text-end text-secondary small")

    def _generate_html(self):
        root = div(id = self.conf["id"],
                   cls = "card my-3 {}-container".format(self.activity_id()))
        with root:
            self._gen_header()
            self._gen_description()
            self._gen_activity()
            self._gen_controls()
            self._gen_testing()
            self._gen_footer()

        return panflute.RawBlock(root.render(), 'html')

    def process(self):
        return self._generate_html()

