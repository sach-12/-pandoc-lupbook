# Matching examples

## Simple Example

``` matching
id: college-year
title: Match College Year to Term
random: false
prompt: |
      Match the term to each college year.
choices:
  - id: choice1
    text: Freshman
    feedback: |
      "Freshman" is used to refer to a first-year student
  - id: choice2
    text: Sophomore
    feedback: |
      "Sophomore" is used to refer to a second-year student
  - id: choice3
    text: Junior
    feedback: |
      "Junior" is used to refer to a third-year student
  - id: choice4
    text: Senior
    feedback: |
      "Senior" is a term used to refer to a fourth-year student
answers:
  - text: First Year
    choices: [choice1]
  - text: Second Year
    choices: [choice2]
  - text: Third Year
    choices: [choice3]
  - text: Fourth Year
    choices: [choice4]
```

### Multiple Choices to Answers Example
``` matching
id: fruit-or-vegetable
title: Match Food Item
random: false
prompt: |
      Match the food items to it's respective food category.
choices:
  - id: choice1
    text: Apple
    feedback: |
      Apples are a fruit, more specifically an accessory fruit!
  - id: choice2
    text: Tomato
    feedback: |
      Tomatoes are thought to be vegetables because of their uses in cooking, but they are actually fruits!
  - id: choice3
    text: Carrot
    feedback: |
      Carrots are root vegetables!
answers:
  - text: Fruit
    choices: [choice1, choice2]
  - text: Vegetable
    choices: [choice3]
```
