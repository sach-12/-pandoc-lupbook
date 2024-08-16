# Copyright (c) 2024 LupLab
# SPDX-License-Identifier: AGPL-3.0-only

import lupbook_schema

_hparsons_schema = {
    "title": "Lupbook Horizontal Parsons",
    "description": "Schema for Lupbook's horizontal parsons interactive activity",
    "type": "object",
    "properties": {
        "id": {
            "type": "string",
            "format": "lupbook_id",
        },
        "title": {
            "type": "string",
        },
        "prompt": {
            "type": "string",
        },
        "random": {
            "type": "boolean",
            "default": False
        },
        "label": {
            "type": "boolean",
            "default": False
        },
        "frags": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {
                        "type": "integer"
                    },
                    "depend": {
                        "type": "integer"
                    },
                    "text": {
                        "type": "string"
                    }
                },
                "required": ["id", "text"],
                "additionalProperties": False
            }
        }
    },
    "required": ["id", "title", "prompt", "frags"],
    "additionalProperties": False
}

hparsons_validator = lupbook_schema.LupbookValidator(
        _hparsons_schema,
        format_checker = lupbook_schema.lupbook_format_checker)
