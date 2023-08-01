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
                    instance.setdefault(
                        property, subschema["default"](instance))
                else:
                    instance.setdefault(property, subschema["default"])

        for error in validate_properties(
            validator, properties, instance, schema,
        ):
            yield error

    return validators.extend(
        validator_class, {"properties": set_defaults},
    )


fia_format_checker = FormatChecker()

all_ids = set()


@fia_format_checker.checks('unique_html5_id')
def is_unique_html5_id(value):
    if not re.fullmatch("[\S]+", value) or value in all_ids:
        return False
    all_ids.add(value)
    return True


@fia_format_checker.checks('nonzero')
def is_nonzero(value):
    return value != 0


DefaultValidatingDraft4Validator = extend_with_default(Draft4Validator)

fia_schema = {
    "title": "fia",
    "description": "The specification for a Fill-in Answer component",
    "type": "object",
    "properties": {
        "id": {
            "type": "string",
            "format": "unique_html5_id",
            "default": lambda inst: "fia-{:x}".format(id(inst))
        },
        "title": {
            "type": "string",
        },
        "text": {
            "type": "string",
        },
        "answers": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "answer": {
                        "type": "string"
                    },
                    "type": {
                        "type": "string",
                        "enum": ["text", "number"],
                        "default": "text"
                    },
                    "feedback": {
                        "type": "string",
                        "default": ""
                    }
                },
                "required": ["answer"],
                "additionalProperties": False
            }
        }
    },
    "required": ["id", "title", "text", "answers"],
    "additionalProperties": False
}

fia_validator = DefaultValidatingDraft4Validator(fia_schema,
                                                 format_checker=fia_format_checker)
