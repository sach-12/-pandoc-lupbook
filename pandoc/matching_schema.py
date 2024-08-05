# Copyright (c) 2021 LupLab
# SPDX-License-Identifier: AGPL-3.0-only

import lupbook_schema

_matching_schema = {
    "title": "Lupbook Matching",
    "description": "Schema for Lupbook's matching interactive activity",
    "type": "object",
    "properties": {
        "id": {
            "type": "string",
            "format": "lupbook_id",
        },
        "title":{
            "type": "string"
        },
        "prompt": {
            "type": "string",
        },
        "random": {
            "type": "boolean",
            "default": False
        },
        "choices": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {
                        "type": "string"
                    },
                    "text": {
                        "type": "string"
                    },
                    "feedback": {
                        "type": "string"
                    }
                },
                "required": ["id", "text"],
                "additionalProperties": False
            }
        },
        "answers": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "text": {
                        "type": "string"
                    },
                    "choices": {
                        "type": "array",
                        "items": {
                            "type": "string"
                        },
                    },
                },
                "required": ["choices", "text"],
                "additionalProperties": False
            }
        }
    },
    "required": ["id", "title", "prompt", "choices", "answers"],
    "additionalProperties": False
}

matching_validator = lupbook_schema.LupbookValidator(
        _matching_schema,
        format_checker = lupbook_schema.lupbook_format_checker)
