# Copyright (c) 2023 LupLab
# SPDX-License-Identifier: AGPL-3.0-only

import lupbook_schema

_parsons_schema = {
    "title": "Lupbook Parsons",
    "description": "Schema for Lupbook's parsons interactive activity",
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
                    "gid": {
                        "type": "string"
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

parsons_validator = lupbook_schema.LupbookValidator(
        _parsons_schema,
        format_checker = lupbook_schema.lupbook_format_checker)
