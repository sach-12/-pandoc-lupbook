#!/usr/bin/env python3

import os
import yaml

import pandocfilters

import icode_filter
import mcq_filter

if __name__ == "__main__":
    pandocfilters.toJSONFilters([
        icode_filter.ICode,
        mcq_filter.MCQ
        ])
