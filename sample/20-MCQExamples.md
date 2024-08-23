# Multiple Choice Question examples

## Simple Example

Write any MCQ you want, select your answer(s) and click on run to see the
answer.

``` mcq
id: circumference
title: Circumference
prompt: |
      *Let’s explore the mathematical world of circles!*

      What is the formula for the **circumference of a circle**?

      We covered this in `Section 1`.
choices:
  - text: $r$
    feedback: |
      The radius only refers to the distance from the center to any edge of the
      circle, not the circumference itself.
  - text: $2\pi^2$
    feedback: |
      That’s right! The circumference of a circle is given by $2\pi^2$.
    correct: true
```

This is a simple example where only one of the choices is correct. Let us define
some of the elements of this configuration. Firstly, we have the `type`. The
`type` key specifies the type of the question; `one` indicates that there is
only one correct answer.

Notice the use of $ signs in the example above. This is the syntax used in
Markdown to style mathematical expressions with the appropriate format and
symbols.

## Randomizing answer choices

One can specify whether the choices to each question are randomized using the
`random` key. Set `random: true` to enable randomization. This is an optional
key; its default value is `false`. Note that the randomization is performed once
statically when the HTML book is generated.

``` mcq
id: prog-language
title: Programming languages
random: true
prompt: |
    Which of the following is **not** a programming language?
choices:
  - text: Python
    feedback: |
      Python is a progamming language created by Guido Van Rossum.
  - text: Javascript
    feedback: |
      Did you know that the first version of Javascript had been created in only
      10 days back in 1995, as a way to make web pages dynamic!
  - text: HTML
    feedback: |
      HTML is a *markup* language for displaying documents in a web browser. It
      was invented at CERN and released in 1993.
    correct: true
  - text: Java
    feedback: |
      Java is one of the most popular object-oriented programming languages,
      developed by Sun Microsystems in 1995.
```

## One-to-many MCQs

With the `many: true` key, one can specify multiple correct answers to a
question.

``` mcq
id: c-native-types
title: Data Types in C
many: true
prompt: |
      Which of the following are **native C data types**?
choices:
  - text: int
    feedback: |
      Yes, `int` is a type for holding integers.
    correct: true
  - text: let
    feedback: |
      `let` is a construct for declaring variables in Javascript.
  - text: var
    feedback: |
      `var` is a construct for declaring variables in Javascript.
  - text: char
    feedback: |
      Yes, `char` is a type for holding characters.
    correct: true
```
