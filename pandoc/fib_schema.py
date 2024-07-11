# Copyright (c) 2023 LupLab
# SPDX-License-Identifier: AGPL-3.0-only

import lupbook_schema

_fib_schema = {
    "title": "Lupbook Fib",
    "description": "Schema for Lupbook's Fill-in-the-blanks interactive activity",
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
        "text": {
            "type": "string",
        },
        "casing": {
            "type": "boolean",
            "default": False
        },
        "blanks": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "answer": {
                        "type": "string"
                    },
                    "type": {
                        "type": "string"
                    },
                    "feedback": {
                        "type": "string",
                    }
                },
                "required": ["answer"],
                "additionalProperties": False
            }
        }
    },
    "required": ["id", "title", "prompt", "blanks"],
    "additionalProperties": False
}

fib_validator = lupbook_schema.LupbookValidator(
        _fib_schema,
        format_checker = lupbook_schema.lupbook_format_checker)
