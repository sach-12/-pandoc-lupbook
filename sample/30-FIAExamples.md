## Fill-in Answer examples

### Simple Example

Write any FIA you want, fill in the blank and see its result.

``` fia
id: bones
title: Bones
text: |
      How many **bones** are there in an *adult's* body?
      
      There are |blank| bones in an adult's body.
answers: 
  - answer: "206"
    type: number
    feedback: | 
      The skeleton of an adult consists of ***206*** bones. The average weight
      of a *woman's* skeleton is 10 kg and the average weight of a *man's*
      skeleton is 12kg.
```

This is a straightforward example with just one blank. Let's clarify some of the
elements of this setup.

"Text" refers to the entire paragraph that will be displayed in the card body,
which may include one or more blanks. "|blank|" means blank in the text. Answers
contain the answer of each blank, along with the corresponding feedback.

### Multiple Blanks Example 

If you want to incorporate additional blanks into the text, you can simply
insert more "|blank|" placeholders within the paragraph. Additionally, make sure
to include corresponding elements in the answers section to accommodate the
answers and responses for each additional blank.

``` fia
id: program
title: Program
text: |
      Complete the following line of a Python program so that it will declare an
      ***integer*** variable age with an initial value of ***5***.

      |blank| `age =`  |blank|`;`
answers: 
  - answer: "int"
    type: text
    feedback: | 
      Remember that **Java** uses just the first **three** letters of the word
      “integer” to define an integral type.
  - answer: "5"
    type: number
    feedback: | 
      Use **5** as the initial value of the variable.
```
