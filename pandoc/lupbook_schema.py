# Copyright (c) 2021 LupLab
# SPDX-License-Identifier: AGPL-3.0-only

import re
import sys

import jsonschema

### Make the "default" property work as intended
#   https://python-jsonschema.readthedocs.io/en/latest/faq/#why-doesn-t-my-schema-s-default-property-set-the-default-on-my-instance
def _extend_with_default(validator_class):
    validate_properties = validator_class.VALIDATORS["properties"]

    def set_defaults(validator, properties, instance, schema):
        for property, subschema in properties.items():
            if "default" in subschema:
                if not isinstance(instance, dict):
                    continue
                if callable(subschema["default"]):
                    instance.setdefault(property, subschema["default"](instance))
                else:
                    instance.setdefault(property, subschema["default"])

        for error in validate_properties(
            validator, properties, instance, schema,
        ):
            yield error

    return jsonschema.validators.extend(
        validator_class, {"properties" : set_defaults},
    )

LupbookValidator = _extend_with_default(jsonschema.Draft4Validator)


### Check that the ID of each interactive component is
# 1/ a valid HTML5 ID and 2/ a unique ID across the textbook
lupbook_format_checker = jsonschema.FormatChecker()

# Function called for format set to "id_valid" in JSON schema
@lupbook_format_checker.checks('lupbook_id')
def _check_lupbook_id(value):
    # Keep track of all the IDs across format validation calls
    if not hasattr(_check_lupbook_id, 'all_ids'):
        _check_lupbook_id.all_ids = set()

    # Allow all alphanumeric characters and hyphens, but that's it
    if not re.fullmatch(r'[\w\-]+', value):
        sys.stderr.write(f"Invalid activity id '{value}'\n")
        return False
    if value in _check_lupbook_id.all_ids:
        sys.stderr.write(f"Non-unique activity id '{value}'\n")
        return False

    _check_lupbook_id.all_ids.add(value)
    return True
