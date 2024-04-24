# Copyright (c) 2021 LupLab
# SPDX-License-Identifier: AGPL-3.0-only

import lupbook_schema

range_list_item = {
  "type": ["integer", "object"],
  "properties": {
    "from": {
      "type": "integer",
      "format": "nonzero",
      "default": 1
    },
    "to": {
      "type": "integer",
      "format": "nonzero",
      "default": -1
    }
  },
  "additionalProperties": False
}

icode_schema = {
  "title": "ICode",
  "description": "The specification for an interactive code element",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "lupbook_id",
    },
    "title": { "type": "string" },
    "skeleton": {
      "description": "one or more source files",
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "filename": {
            "type": "string",
            "minLength": 1
          },
          "data": {
            "type": "string",
            "default": ""
          },
          "key": {
            "type": "string",
            "default": lambda inst: inst["data"]
          },
          "hidden": {
            "type": "boolean",
            "default": False
          },
          "readonly": {
            "type": ["boolean", "object", "array"],
            "properties": {
              "except": {
                "type": "array",
                "items": range_list_item
              }
            },
            "items": range_list_item,
            "additionalProperties": False,
            "default": False
          }
        },
        "required": [ "filename" ],
        "additionalProperties": False
      },
      "minItems": 1
    },
    "tests": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "minLength": 1
          },
          "precmds": {
            "type": "array",
            "items": {
              "type": "string",
              "minLength": 1
            },
            "default": []
          },
          "cmds": {
            "type": "array",
            "items": {
              "type": "string",
              "minLength": 1
            }
          },
          "postcmds": {
            "type": "array",
            "items": {
              "type": "string",
              "minLength": 1
            },
            "default": []
          },
          "fatal": {
            "type": "boolean",
            "default": False
          },
          "checks": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "output": {
                  "type": "string",
                  "enum": [ "stdout", "stderr", "file" ]
                },
                "filename": {
                  "type": "string",
                  "minLength": 1
                },
                "type": {
                  "type": "string",
                  "enum": [ "exact", "regex" ],
                  "default": "exact"
                },
                "content": { "type": "string" }
              },
              # If the check uses a file output, filename must be specified
              "anyOf": [
                {
                  "not": {
                    "properties": {
                      "output": { "enum": [ "file" ] }
                    }
                  }
                },
                { "required": [ "filename" ] }
              ],
              "required": [ "output", "content" ],
              "additionalProperties": False
            },
            "default": []
          }
        },
        "required": [ "name", "cmds" ],
        "additionalProperties": False
      }
    }
  },
  "required": [ "skeleton", "tests" ],
  "additionalProperties": False
}

icode_validator = lupbook_schema.LupbookValidator(
        icode_schema,
        format_checker = lupbook_schema.lupbook_format_checker)
