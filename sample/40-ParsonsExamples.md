## Parsons examples

### Simple Example

Write any parsons exercise you want, drag and drop blocks and see its result.

``` parsons
id: eg1
title: Example 1
text: |
      Create a proof of the theorem:
      if $n$ is an even number, then $n \equiv 0$ mod 2.
blocks: 
  - id: "1"
    order: 3
    text: | 
      So $n = 2m + 0$.
  - id: "2"
    order: 4
    text: | 
     Thus $n \equiv 0$ mod 2.
  - id: "3"
    order: 1
    text: | 
      Suppose $n$ is even.
  - id: "4"
    order: 2
    text: | 
      Then there exists an $m$ so that $n = 2m$.
  - id: "5"
    order: -1
    text: | 
      Redundant block
```

This is a simple example without any additional functions. Let's clarify certain
aspects of this configuration.

The term "Text" pertains to the question that will be showcased in the card's
content. "Blocks" encompass the movable content blocks, along with their
corresponding text and their accurate sequencing.

### Label and Random Example

You can activate the 'label' option, resulting in the creation of a numbered
label on the left side of each block.

Similarly, you have the option to enable 'random', which will introduce
randomness to the order of the blocks.

``` parsons
id: eg2
title: Example 2
label: true
random: true
text: |
      Create a proof of the theorem:
      if $n$ is an even number, then $n \equiv 0$ mod 2.
blocks: 
  - id: "1"
    order: 3
    text: | 
      So $n = 2m + 0$.
  - id: "2"
    order: 4
    text: | 
     Thus $n \equiv 0$ mod 2.
  - id: "3"
    order: 1
    text: | 
      Suppose $n$ is even.
  - id: "4"
    order: 2
    text: | 
      Then there exists an $m$ so that $n = 2m$.
  - id: "5"
    order: -1
    text: | 
      Redundant block
```

### Or-block Examples

To group blocks together as part of the same "or-block," you can assign an
'or-id' within each block. Blocks with the same 'or-id' will be clustered
together, with only one block containing the correct answer within that cluster.

``` parsons
id: eg3
title: Example 3
text: |
      Create a proof of the theorem:
      if $n$ is an even number, then $n \equiv 0$ mod 2.
blocks: 
  - id: "1"
    order: 3
    or_id: "1"
    text: | 
      So $n = 2m + 0$.
  - id: "2"
    order: -1
    or_id: "1"
    text: | 
      So $n = 2m + 1$.
  - id: "3"
    order: 4
    text: | 
     Thus $n \equiv 0$ mod 2.
  - id: "4"
    order: 1
    text: | 
      Suppose $n$ is even.
  - id: "5"
    order: 2
    or_id: "2"
    text: | 
      Then there exists an $m$ so that $n = 2m$.
  - id: "6"
    order: -1
    or_id: "2"
    text: | 
      Then there exists an $m$ so that $n = 2m + 1$.
  - id: "7"
    order: -1
    or_id: "2"
    text: | 
      Then $n$ is a prime number.
  - id: "8"
    order: -1
    text: | 
      Redundant block
```
