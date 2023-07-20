#!/usr/bin/env python3

import os
import yaml

import pandocfilters

import icode_filter

if __name__ == "__main__":
    pandocfilters.toJSONFilters([
        icode_filter.ICode,
        ])
