#!/usr/bin/env python3

import os
import yaml

import panflute as pf

import icode_filter
import mcq_filter
import fia_filter
import parsons_filter


if __name__ == "__main__":
    actions = [icode_filter.ICode, mcq_filter.MCQ, fia_filter.FIA, parsons_filter.Parsons]
    pf.toJSONFilters(actions=actions)
