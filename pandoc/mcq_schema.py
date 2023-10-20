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

mcq_format_checker = FormatChecker()

all_ids = set()
@mcq_format_checker.checks('unique_html5_id')
def is_unique_html5_id(value):
    if not re.fullmatch("[\S]+", value) or value in all_ids:
        return False
    all_ids.add(value)
    return True

@mcq_format_checker.checks('nonzero')
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

mcq_schema = {
  "title": "MCQ",
  "description": "The specification for a Multiple Choice Question component",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "unique_html5_id",
    },
    "title":{
      "type": "string",
    },
    "type": {
      "type": "string",
    },
    "random":{
      "type": "boolean",
      "default": False
    },
    "stem":{
      "type": "string",
    },
    "answers":{
      "type": "array",
      "items": {
        "type": "object",
        "properties":{
          "id":{
            "type": "string"
              },
          "text": {
            "type": "string"
          },
          "feedback": {
            "type": "string",
            "default": ""
          }
        },
        "required": [ "id", "text" ],
        "additionalProperties": False
      }
    },
    "key":{
      "type": "array",
      "items": {
        "type": "string"
      },
    }
  },
  "required": [ "id", "title", "type", "stem", "answers", "key" ],
  "additionalProperties": False
 }

mcq_validator = DefaultValidatingDraft4Validator(mcq_schema,
    format_checker = mcq_format_checker)
