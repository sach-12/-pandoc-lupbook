# Horizontal Parsons examples

## Simple Example

Write any horizontal parsons exercise you want, drag and drop fragments and see
its result.

``` hparsons
id: eg4
title: SQL
prompt: |
      Rearrange the fragments to form a valid `SQL` statement
frags:
  - id: 4
    depend: 3
    text: |
      `test`
  - id: 1
    text: |
     `SELECT`
  - id: 2
    depend: 1
    text: |
      `*`
  - id: 3
    depend: 2
    text: |
      `FROM`
  - id: -1
    text: |
      Distractor
```

## Label and Random Example

You can activate the 'label' option, resulting in the creation of a numbered
label on the left side of each fragment.

Similarly, you have the option to enable 'random', which will introduce
randomness to the order of the fragments. Note that the randomization is
performed once statically when the HTML book is generated.

``` hparsons
id: eg5
random: true
label: true
title: Sentence
prompt: |
      Reorder the following words to make a sentence.
frags:
    - id: 1
      text: The
    - id: 2
      depend: 1
      text: quick
    - id: 3
      depend: 2
      text: brown
    - id: 4
      depend: 3
      text: fox
    - id: 5
      depend: 4
      text: jumped
    - id: 6
      depend: 5
      text: over
    - id: 7
      depend: 6
      text: the
    - id: 8
      depend: 7
      text: lazy
    - id: 9
      depend: 8
      text: dog
```
