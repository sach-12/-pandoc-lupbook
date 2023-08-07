## Multiple Choice Question examples

### Simple Example

Write any MCQ you want, select your answer(s) and click on run to see the answer.

``` mcq
id: circum
title: Circumference
type: one
random: false
stem: |
      *Let’s explore the mathematical world of circles!*

      What is the formula for the **circumference of a circle**?

      We covered this in `Section 1`.
answers: 
  - id: choice1
    text: $r$
    feedback: | 
      The radius only refers to the distance from the 
      center to any edge of the circle, not the 
      circumference itself
  - id: choice2
    text: $2\pi^2$
    feedback: |
      That’s right! The circumference of a circle is                      
      given by $2\pi^2$.
key:
   - choice2   
```

This is a simple example where only one of the choices is correct. Let us define some of the elements of this configuration. Firstly, we have the `type`. The `type` key specifies the type of the question; `one` indicates that there is only one correct answer. 

Notice the use of $ signs in the example above. This is the syntax used in Markdown to style mathematical expressions with the appropriate format and symbols.

### Randomizing answer choices

One can specify whether the choices to each question are randomized using the `random` key. Set `random: true` to enable randomization. This is an optional key; its default value is `false`.

``` mcq
id: circumference
title: Circumference
type: one
random: true
stem: |
      *Let’s explore the mathematical world of circles!*

      What is the formula for the **circumference of a circle**?

      We covered this in `Section 1`.
answers: 
  - id: choice1
    text: $r$
    feedback: | 
      The radius only refers to the distance from the 
      center to any edge of the circle, not the 
      circumference itself
  - id: choice2
    text: $2\pi^2$
    feedback: |
      That’s right! The circumference of a circle is                      
      given by $2\pi r^2$.
key:
   - choice2   
```

Notice that each choice is given its own unique id. This id is referred to in the `key` when listing which choice(s) are correct.

### One-to-many MCQs

With the `type: many` key, one can specify multiple correct answers to a question.

``` mcq
id: c-native-types
title: Data Types
type: many
random: true
stem: |
      Which of the following are **native C data types**?
answers: 
  - id: choice1
    text: int
    feedback: | 
      Yes, 'int' is a type for holding integers.
  - id: choice2
    text: let
    feedback: |
      'let' is a construct for declaring variables in Javascript.
  - id: choice3
    text: var
    feedback: |
      'var' is a construct for declaring variables in Javascript.
  - id: choice4
    text: char
    feedback: |
      Yes, 'char' is a type for holding characters.
key:
   - choice1
   - choice4
```
