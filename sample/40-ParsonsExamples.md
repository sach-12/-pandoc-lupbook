## Parsons examples

### Simple Example

Write any parsons exercise you want, drag and drop fragments and see its result.

``` parsons
id: eg1
title: Example 1
prompt: |
      Create a proof of the theorem:
      if $n$ is an even number, then $n \equiv 0$ mod 2.
frags:
  - order: 3
    text: So $n = 2m + 0$.
  - order: 4
    text: Thus $n \equiv 0$ mod 2.
  - order: 1
    text: Suppose $n$ is even.
  - order: 2
    text: Then there exists an $m$ so that $n = 2m$.
  - order: -1
    text: Redundant fragment
```

This is a simple example without any additional functions. Let's clarify certain
aspects of this configuration.

### Label and Random Example

You can activate the 'label' option, resulting in the creation of a numbered
label on the left side of each fragment.

Similarly, you have the option to enable 'random', which will introduce
randomness to the order of the fragments.

``` parsons
id: eg2
title: Example 2
label: true
random: true
prompt: |
      Create a proof of the theorem:
      if $n$ is an even number, then $n \equiv 0$ mod 2.
frags:
  - order: 3
    text: |
      So $n = 2m + 0$.
  - order: 4
    text: |
     Thus $n \equiv 0$ mod 2.
  - order: 1
    text: |
      Suppose $n$ is even.
  - order: 2
    text: |
      Then there exists an $m$ so that $n = 2m$.
  - order: -1
    text: |
      Redundant fragment
```

### OR-group Examples

To group fragments together as part of the same "or-group," you can assign an
'gid' within each fragment. Fragments with the same 'gid' will be clustered
together, with only one fragment containing the correct answer within that
cluster.

``` parsons
id: eg3
title: Example 3
prompt: |
      Create a proof of the theorem:
      if $n$ is an even number, then $n \equiv 0$ mod 2.
frags:
  - order: 3
    gid: "1"
    text: |
      So $n = 2m + 0$.
  - order: -1
    gid: "1"
    text: |
      So $n = 2m + 1$.
  - order: 4
    text: |
     Thus $n \equiv 0$ mod 2.
  - order: 1
    text: |
      Suppose $n$ is even.
  - order: 2
    gid: "2"
    text: |
      Then there exists an $m$ so that $n = 2m$.
  - order: -1
    gid: "2"
    text: |
      Then there exists an $m$ so that $n = 2m + 1$.
  - order: -1
    gid: "2"
    text: |
      Then $n$ is a prime number.
  - order: -1
    text: |
      Redundant block
```
