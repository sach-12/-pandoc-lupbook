# Copyright (c) 2023 LupLab
# SPDX-License-Identifier: AGPL-3.0-only

import lupbook_schema

_mcq_schema = {
    "title": "Lupbook Mcq",
    "description": "Schema for Lupbook's MCQ interactive activity",
    "type": "object",
    "properties": {
        "id": {
            "type": "string",
            "format": "lupbook_id",
            },
        "title":{
            "type": "string",
            },
        "prompt":{
            "type": "string",
            },
        "many": {
            "type": "boolean",
            "default": False,
            },
        "random":{
            "type": "boolean",
            "default": False
            },
        "choices":{
            "type": "array",
            "items": {
                "type": "object",
                "properties":{
                    "text": {
                        "type": "string"
                        },
                    "correct": {
                        "type": "boolean",
                        "default": False
                        },
                    "feedback": {
                        "type": "string",
                        }
                    },
                "required": [ "text", "feedback" ],
                "additionalProperties": False
                }
            },
        },
    "required": [ "id", "title", "prompt", "choices" ],
    "additionalProperties": False
}

mcq_validator = lupbook_schema.LupbookValidator(
        _mcq_schema,
        format_checker = lupbook_schema.lupbook_format_checker)
