#!/usr/bin/env python3

# Copyright (c) 2021 LupLab
# SPDX-License-Identifier: AGPL-3.0-only

import os
import yaml

import panflute

import fia_filter
import icode_filter
import matching_filter
import mcq_filter
import parsons_filter


if __name__ == "__main__":
    actions = [
            fia_filter.FIA,
            icode_filter.ICode,
            matching_filter.Matching,
            mcq_filter.MCQ,
            parsons_filter.Parsons,
            ]
    panflute.run_filters(actions)
