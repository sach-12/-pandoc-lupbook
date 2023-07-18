"""
Shared code between filters
"""

import yaml
import os

class LupbookLoader(yaml.SafeLoader):
    def include(self, node):
        fname = os.path.join(os.path.curdir, self.construct_scalar(node))
        with open(fname, 'r') as fin:
            return yaml.load(fin, LupbookLoader)

    def raw_include(self, node):
        fname = os.path.join(os.path.curdir, self.construct_scalar(node))
        with open(fname, 'rb') as fin:
            return fin.read().decode('utf-8')

LupbookLoader.add_constructor('!include', LupbookLoader.include)
LupbookLoader.add_constructor('!raw_include', LupbookLoader.raw_include)

