# Fill-in-the-blanks examples

## Simple Example

Write any FIB you want, fill in the blank and see its result.

```fib
id: bones
title: Bones
prompt: Fill in the blanks below about the human body.
text: |
      How many **bones** are there in an *adult's* body?

      There are |blank| bones in an adult's body.
blanks:
  - answer: "206"
    type: number
    feedback: |
      The skeleton of an adult consists of **206** bones. Fun fact: the average
      weight of a *woman's* skeleton is 10 kg while the average weight of a
      *man's* skeleton is 12kg.
```

This is a straightforward example with just one blank. Let's clarify some of the
elements of this setup.

"Text" refers to the entire paragraph that will be displayed in the card body,
which may include one or more blanks. "|blank|" means blank in the text. Answers
contain the answer of each blank, along with the corresponding feedback.

## Multiple Blanks Example

If you want to incorporate additional blanks into the text, you can simply
insert more "|blank|" placeholders within the paragraph. Additionally, make sure
to include corresponding elements in the answers section to accommodate the
answers and responses for each additional blank.

```fib
id: program
title: Program
prompt: Fill in the blanks below about variable declaration in Python.
text: |
      Complete the following line of a Python program so that it will declare an
      **integer** variable age with an initial value of **5**.

      |blank| `age =`  |blank|`;`
blanks:
  - answer: int
    type: text
    feedback: |
      Remember that **Java** uses just the first **three** letters of the word
      "integer" to define an integral type.
  - answer: "5"
    type: number
    feedback: |
      Use **5** as the initial value of the variable.
```

### Case Sensitive Example

The casing property is applied to this question and applies to all blanks. 

```fib
id: python-keywords
title: Python Keyword Trivia
prompt: Fill in the blanks with Python keywords.
casing: true
text: |
      In Python, to define a function, you use the |blank| keyword, and to indicate the end of a loop or conditional block, you use the |blank| keyword.
blanks:
  - answer: def
    type: text
    feedback: |
      In Python, you define a function using the `def` keyword.
  - answer: break
    type: text
    feedback: |
      To indicate the end of a loop or conditional block in Python, you use the `break` keyword.
```

