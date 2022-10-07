from jsonschema import Draft4Validator, validators, FormatChecker
import re
import sys

# https://python-jsonschema.readthedocs.io/en/latest/faq/#why-doesn-t-my-schema-s-default-property-set-the-default-on-my-instance
def extend_with_default(validator_class):
    validate_properties = validator_class.VALIDATORS["properties"]

    def set_defaults(validator, properties, instance, schema):
        for property, subschema in properties.items():
            if "default" in subschema:
                if type(instance) != dict:
                    continue
                if callable(subschema["default"]):
                    instance.setdefault(property, subschema["default"](instance))
                else:
                    instance.setdefault(property, subschema["default"])

        for error in validate_properties(
            validator, properties, instance, schema,
        ):
            yield error

    return validators.extend(
        validator_class, {"properties" : set_defaults},
    )

icode_format_checker = FormatChecker()

all_ids = set()
@icode_format_checker.checks('unique_html5_id')
def is_unique_html5_id(value):
    if not re.fullmatch("[\S]+", value) or value in all_ids:
        return False
    all_ids.add(value)
    return True

@icode_format_checker.checks('nonzero')
def is_nonzero(value):
    return value != 0

DefaultValidatingDraft4Validator = extend_with_default(Draft4Validator)

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
      "format": "unique_html5_id",
      "default": lambda inst: "icode-{:x}".format(id(inst))
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

icode_validator = DefaultValidatingDraft4Validator(icode_schema,
    format_checker = icode_format_checker)
