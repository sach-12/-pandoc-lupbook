from jsonschema import Draft4Validator, validators, FormatChecker
import re
import sys

# https://python-jsonschema.readthedocs.io/en/latest/faq/#why-doesn-t-my-schema-s-default-property-set-the-default-on-my-instance
# XXX: all the schemas just the same approach, we should move this function
# into a utils file

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


matching_format_checker = FormatChecker()

all_ids = set()


@matching_format_checker.checks('unique_html5_id')
def is_unique_html5_id(value):
    if not re.fullmatch("[\S]+", value) or value in all_ids:
        return False
    all_ids.add(value)
    return True


@matching_format_checker.checks('nonzero')
def is_nonzero(value):
    return value != 0


DefaultValidatingDraft4Validator = extend_with_default(Draft4Validator)

matching_schema = {
    "title": "matching",
    "description": "The specification for a Matching component",
    "type": "object",
    "properties": {
        "id": {
            "type": "string",
            "format": "unique_html5_id",
            "default": lambda inst: "matching-{:x}".format(id(inst))
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
                    "match": {
                        "type": "string"
                    },
                    "text": {
                        "type": "string"
                    },
                    "feedback": {
                        "type": "string"
                    }
                },
                "required": ["id", "match", "text"],
                "additionalProperties": False
            }
        },
        "answers": {
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
                },
                "required": ["id", "text"],
                "additionalProperties": False
            }
        }
    },
    "required": ["id", "title", "prompt", "choices", "answers"],
    "additionalProperties": False
}

matching_validator = DefaultValidatingDraft4Validator(matching_schema,
                                                 format_checker=matching_format_checker)
