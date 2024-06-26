/*
 * Copyright (c) 2023 LupLab
 * SPDX-License-Identifier: AGPL-3.0-only
 */

class MCQActivity extends LupBookActivity {
  /* Class members */
  choiceItems = [];

  testingScore;
  feedbackItems = [];

  totalCorrectCount = 0;
  testingCount = 0;

  selectedCount = 0;

  /* Class methods */
  constructor(elt) {
    super("mcq", elt);

    /* Handles on various elements of our activity */
    this.choiceItems = Array.from(
      elt.getElementsByClassName("form-check-input")
    );
    this.testingScore = document.getElementById(
      `${this.prefixId}-testing-score`
    );
    this.feedbackItems = Array.from(
      elt.getElementsByClassName("mcq-feedback-item")
    );

    /* Init activity */
    this.initActivity();
  }

  resetSelection() {
    this.selectedCount = 0;
    this.choiceItems.forEach((item) => {
      item.checked = false;
    });

    /* No new submission until an item is clicked */
    this.submitStatus(LupBookActivity.SubmitStatus.DISABLED);
    this.resetStatus(false);
  }

  initActivity() {
    this.resetSelection();

    this.choiceItems.forEach((item) => {
      if (item.dataset.correct !== undefined) this.totalCorrectCount++;

      item.addEventListener("click", () => {
        if (item.checked) this.selectedCount++;
        else this.selectedCount--;

        if (this.selectedCount == 0) {
          this.submitStatus(LupBookActivity.SubmitStatus.DISABLED);
        } else if (this.selectedCount >= 1) {
          this.submitStatus(LupBookActivity.SubmitStatus.ENABLED);
          this.resetStatus(true);
        }
      });
    });

    this.testingCount =
      this.choiceItems[0].type == "radio" ? 1 : this.choiceItems.length;
  }

  onReset() {
    this.resetSelection();

    /* Clear testing area */
    this.visibilityProgress(false);
    this.hideFeedback(true);

    this.visibilityTesting(false);
    this.clearTesting();
  }

  onSubmit() {
    let userSelected = 0,
      userCorrect = 0;

    /* Disable buttons */
    this.submitStatus(LupBookActivity.SubmitStatus.DISABLED);
    this.resetStatus(false);

    /* Clear info from previous submission if any */
    this.clearProgress();
    this.clearTesting();

    /* Now compute which choice items are correct */
    this.choiceItems.forEach((item, idx) => {
      const feedbackItem = this.feedbackItems[idx];

      /* Show feedback only if choice item was selected */
      if (item.checked == true) {
        userSelected++;

        /* Show corresponding feedback item and color it appropriately */
        feedbackItem.classList.remove("d-none");
        if (item.dataset.correct !== undefined) {
          feedbackItem.classList.add("border-success");
          userCorrect++;
        } else {
          feedbackItem.classList.add("border-danger");
        }
      } else {
        feedbackItem.classList.add("d-none");
      }
    });

    /* Overall success */
    let success =
      userSelected == this.totalCorrectCount &&
      userCorrect == this.totalCorrectCount;

    /* Set up progress bar */
    for (let i = 0; i < this.testingCount; i++) {
      let s =
        success ||
        i <
          this.testingCount -
            ((this.totalCorrectCount - userCorrect) +
            (userSelected - userCorrect))
          ? LupBookActivity.ProgressStatus.SUCCESS
          : LupBookActivity.ProgressStatus.FAILURE;
      this.progressStatus(i, s);
    }
    this.visibilityProgress(true);

    /* Feedback score */
    if (success) {
      this.testingScore.classList.add("alert-success");
      this.testingScore.textContent = "Congratulations!";
    } else {
      this.testingScore.classList.add("alert-danger");

      if (this.choiceItems[0].type == "radio" )
        this.testingScore.textContent = "Incorrect answer.";
      else
        this.testingScore.textContent = `You selected ${userSelected} items: ${userCorrect} out of ${this.totalCorrectCount} correct items and ${userSelected - userCorrect} incorrect items.`;
    }

    /* Show feedback */
    this.testingScore.classList.remove("d-none");
    this.showFeedback();

    /* Overall feedback via submit button */
    let s = success
      ? LupBookActivity.SubmitStatus.SUCCESS
      : LupBookActivity.SubmitStatus.FAILURE;
    this.submitStatus(s);
    this.resetStatus(true);
  }

  clearTesting() {
    this.testingScore.classList.remove("alert-success", "alert-danger");
    this.feedbackItems.forEach((item) => {
      item.classList.remove("border-success", "border-danger");
    });
  }

  visibilityTesting(visible) {
    if (visible) {
      this.testingScore.classList.remove("d-none");
      this.feedbackItems.forEach((item) => {
        item.classList.remove("d-none");
      });
    } else {
      this.testingScore.classList.add("d-none");
      this.feedbackItems.forEach((item) => {
        item.classList.add("d-none");
      });
    }
  }
}

/*
 * Initialize "MCQ" interactive activities after page loading
 */
window.addEventListener("DOMContentLoaded", () => {
  let mcqActivities = [];

  for (const e of document.getElementsByClassName("mcq-container")) {
    mcqActivities.push(new MCQActivity(e));
  }
});
