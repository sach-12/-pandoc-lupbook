# Horizontal Parsons examples

## Simple Example

Write any horizontal parsons exercise you want, drag and drop blocks and see its
result.

``` hparsons
id: eg4
title: SQL
prompt: |
      Rearrange the blocks to form a valid `SQL` statement
frags:
  - order: 4
    text: |
      `test`
  - order: 1
    text: |
     `SELECT`
  - order: 2
    text: |
      `*`
  - order: 3
    text: |
      `FROM`
  - order: -1
    text: |
      Distractor
```

## Label and Random Example

You can activate the `label` option, resulting in the creation of a numbered
label on the left side of each block.

Similarly, you have the option to enable `random`, which will introduce
randomness to the order of the blocks.

``` hparsons
id: eg5
random: true
label: true
title: Sentence
prompt: |
      Reorder the following words to make a sentence.
frags:
    - order: 3
      text: brown
    - order: 7
      text: the
    - order: 2
      text: quick
    - order: 5
      text: jumped
    - order: 8
      text: lazy
    - order: 4
      text: fox
    - order: 9
      text: dog
    - order: 6
      text: over
    - order: 1
      text: The
```
