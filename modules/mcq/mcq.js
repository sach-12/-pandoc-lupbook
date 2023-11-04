function nextChar(c) {
  return String.fromCharCode(c.charCodeAt(0) + 1);
}

var mcqs = {};

class MCQ_One {

  constructor(elt) {
    this.id = elt.id;

    this.submit_btn = elt.getElementsByClassName("mcq-c-button__submit")[0];
    this.submit_btn.disabled = true;

    this.reset_btn = elt.getElementsByClassName("mcq-c-button__reset")[0];
    this.reset_btn.disabled = true;

    this.choices = elt.getElementsByClassName("mcq-l-radio");
    for (let choice of this.choices) {
      // reset the Radio buttons on page reload
      choice.checked = false;

      choice.addEventListener('click', () => {
        this.submit_btn.disabled = false;
        this.reset_btn.disabled = false;
      })
    }

    this.feedback_btn = elt.getElementsByClassName("mcq-c-feedback__toggle")[0];
    this.feedback_elt = elt.getElementsByClassName("mcq-l-feedback")[0];
    this.feedback_coll = new bootstrap.Collapse(this.feedback_elt, {
      toggle: false
    });
    this.feedbacks = elt.getElementsByClassName("mcq-l-check");

    this.submit_btn.addEventListener('click', () => {
      this.submit_btn.disabled = true;

      for (let i = 0; i < this.choices.length; i++) {
        let choice = this.choices[i];
        let feedback = this.feedbacks[i];

        choice.disabled = true;
        feedback.classList.toggle("d-none", !choice.checked);

        choice.checked && feedback.classList.contains("mcq-l-check-pass") ?
        this.submit_btn.style.backgroundColor = "#198754" :
        this.submit_btn.style.backgroundColor = "#e35d6a";
      }

      /* Uncollapse feedback */
      this.feedback_btn.classList.remove("d-none");
      this.feedback_coll.show();
    });

    this.reset_btn.addEventListener('click', () => {
      /* Collapse feedback */
      this.feedback_btn.classList.add("d-none");
      this.feedback_coll.hide();

      /* Reset choices */
      for (let i = 0; i < this.choices.length; i++) {
        let choice = this.choices[i];
        let feedback = this.feedbacks[i];

        choice.disabled = false;
        choice.checked = false;
        feedback.classList.add("d-none");
      }
      this.submit_btn.style.backgroundColor = "#0B5ED7";
      this.submit_btn.disabled = true;
      this.reset_btn.disabled = true;
    });

    this.spans = elt.getElementsByClassName("mcq-l-spans");
    /* Lettering for choices and feedback */
    let label = 'A';
    for (let span of this.spans) {
      span.textContent = label + ". ";
      span.style.fontWeight = "bold";
      label = nextChar(label);
    }
    label = 'A';
    for (let i = 0; i < this.feedbacks.length; i++) {
      let feedback = this.feedbacks[i];
      let label_node = document.createTextNode(label+". ");
      feedback.insertBefore(label_node, feedback.firstChild);
      label = nextChar(label);
    }
  }
}

class MCQ_Many {

  constructor(elt){
    this.id = elt.id;

    this.submit_btn = elt.getElementsByClassName("mcq-c-button__submit")[0];
    this.submit_btn.disabled = true;

    this.reset_btn = elt.getElementsByClassName("mcq-c-button__reset")[0];
    this.reset_btn.disabled = true;

    this.num_correct = elt.getElementsByClassName("mcq-l-num-correct")[0];

    this.choices = elt.getElementsByClassName("mcq-l-checkbox");
    for (let choice of this.choices) {
      // reset the check boxes on page reload
      choice.checked = false;

      choice.addEventListener('click', () => {
        this.submit_btn.disabled = false;
        this.reset_btn.disabled = false;
      })
    }

    this.feedback_btn = elt.getElementsByClassName("mcq-c-feedback__toggle")[0];
    this.feedback_elt = elt.getElementsByClassName("mcq-l-feedback")[0];
    this.feedback_coll = new bootstrap.Collapse(this.feedback_elt, {
      toggle: false
    });
    this.feedbacks = elt.getElementsByClassName("mcq-l-check");

    this.submit_btn.addEventListener('click', () => {
      let chosen = [], answers = [];
      let numCorrect = 0;
      this.submit_btn.disabled = true;

      for (let i = 0; i < this.choices.length; i++) {
        let choice = this.choices[i];
        let feedback = this.feedbacks[i];

        choice.disabled = true;
        feedback.classList.toggle("d-none", !choice.checked);

        /* Calculations to get number of correct answers */
        if (feedback.classList.contains("mcq-l-check-pass")) {
          answers.push(choice.id);
          if (choice.checked) {
            numCorrect++;
            chosen.push(choice.id);
          }
        }
        else {
          if (choice.checked) {
            chosen.push(choice.id);
          }
        }
      }

      if (chosen.toString() == answers.toString()) {
        this.submit_btn.style.backgroundColor = "#198754";
        this.num_correct.classList.add("d-none");
      }
      else {
        this.submit_btn.style.backgroundColor = "#e35d6a";
        let numCorrectMsg = `You gave ${chosen.length} answer(s) and got ${numCorrect} out of ${answers.length} correct`;
        this.num_correct.innerHTML = numCorrectMsg;
        this.num_correct.classList.remove("d-none");
      }

      /* Uncollapse feedback */
      this.feedback_btn.classList.remove("d-none");
      this.feedback_coll.show();
    });

    this.reset_btn.addEventListener('click', () => {
      /* Collapse feedback */
      this.feedback_btn.classList.add("d-none");
      this.feedback_coll.hide();

      /* Reset choices */
      for (let i = 0; i < this.choices.length; i++) {
        let choice = this.choices[i];
        let feedback = this.feedbacks[i];

        choice.disabled = false;
        choice.checked = false;
        feedback.classList.add("d-none");
      }
      this.submit_btn.style.backgroundColor = "#0B5ED7";
      this.submit_btn.disabled = true;
      this.reset_btn.disabled = true;
    });

    this.spans = elt.getElementsByClassName("mcq-l-spans");
    /* Lettering for choices and feedback */
    let label = 'A';
    for (let span of this.spans) {
      span.textContent = label + ". ";
      span.style.fontWeight = "bold";
      label = nextChar(label);
    }
    label = 'A';
    for (let i = 0; i < this.feedbacks.length; i++) {
      let feedback = this.feedbacks[i];
      let label_node = document.createTextNode(label+". ");
      feedback.insertBefore(label_node, feedback.firstChild);
      label = nextChar(label);
    }
  }
}

window.addEventListener('DOMContentLoaded', (evt) => {
  for (const mcq_elt of document.getElementsByClassName("mcq-l-container-one")) {
    mcqs[mcq_elt.id] = new MCQ_One(mcq_elt);
  }
  for (const mcq_elt of document.getElementsByClassName("mcq-l-container-many")){
    mcqs[mcq_elt.id] = new MCQ_Many(mcq_elt);
  }
});
