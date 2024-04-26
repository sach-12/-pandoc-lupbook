## Matching examples

### Simple Example

``` matching
id: college-year
title: Match College Year to Term
random: false
prompt: |
      Match the term to each college year.
choices:
  - id: choice1
    match_id: answer1
    text: Freshman
    feedback: |
      “Freshman” is used to refer to a first-year student
  - id: choice2
    match_id: answer2
    text: Sophomore
    feedback: |
      “Sophomore” is used to refer to a second-year student
  - id: choice3
    match_id: answer3
    text: Junior
    feedback: |
      “Junior” is used to refer to a third-year student
  - id: choice4
    match_id: answer4
    text: Senior
    feedback: |
      “Senior” is a term used to refer to a fourth-year student
answers:
   - id: answer1
     text: First Year
   - id: answer2
     text: Second Year
   - id: answer3
     text: Third Year
   - id: answer4
     text: Fourth Year
```
