/*
 * Copyright (c) 2023 LupLab
 * SPDX-License-Identifier: AGPL-3.0-only
 */

class FIBActivity extends LupBookActivity {
  /* Class members */
  blankItems = [];

  testingScore;
  feedbackItems = [];

  filledCount = [];
  casing;

  /* Class methods */
  constructor(elt) {
    super("fib", elt);

    /* Handles on various elements of our activity */
    this.blankItems = Array.from(elt.getElementsByClassName("form-control"));
    this.testingScore = document.getElementById(
      `${this.prefixId}-testing-score`
    );
    this.feedbackItems = Array.from(
      elt.getElementsByClassName("fib-feedback-item")
    );
    const casingDiv = document.getElementById(
      `${this.prefixId}-casing-div`
    );
    this.casing = casingDiv.dataset.casing;


    /* Init activity */
    this.initActivity();
  }

  resetBlanks() {
    this.filledCount.fill(false);

    this.blankItems.forEach((item) => {
      item.value = "";
    });

    /* No new submission all blanks are filled out */
    this.submitStatus(LupBookActivity.SubmitStatus.DISABLED);
    this.resetStatus(false);
  }

  initActivity() {
    this.filledCount = new Array(this.blankItems.length);

    this.resetBlanks();

    this.blankItems.forEach((item, idx) => {
      item.addEventListener("input", () => {
        if (item.value != "") this.filledCount[idx] = true;
        else this.filledCount[idx] = false;

        /* Reset button active when at least one input is filled */
        if (this.filledCount.some(Boolean)) this.resetStatus(true);
        else this.resetStatus(false);

        /* Submit button active only when all inputs are filled */
        if (this.filledCount.every(Boolean))
          this.submitStatus(LupBookActivity.SubmitStatus.ENABLED);
        else this.submitStatus(LupBookActivity.SubmitStatus.DISABLED);
      });
    });
  }

  onReset() {
    this.resetBlanks();

    /* Clear testing area */
    this.visibilityProgress(false);
    this.hideFeedback(true);

    this.visibilityTesting(false);
    this.clearTesting();
  }

  onSubmit() {
    const blankCount = this.blankItems.length;
    let correctCount = 0;

    /* Disable buttons */
    this.submitStatus(LupBookActivity.SubmitStatus.DISABLED);
    this.resetStatus(false);

    /* Clear info from previous submission if any */
    this.clearProgress();
    this.clearTesting();

    /* Now compute which blank items are correct */
    this.blankItems.forEach((item, idx) => {
      const feedbackItem = this.feedbackItems[idx];

      /* Show corresponding feedback item and color it appropriately */
      feedbackItem.classList.remove("d-none");

      /* By default, case sensitive */
      let itemVal = item.value;
      let answerVal = item.dataset.answer;

      /* Unless specified otherwise */
      if (this.casing === false) {
        itemVal = itemVal.toLowerCase();
        answerVal = answerVal.toLowerCase();
      }

      if (itemVal === answerVal) {
        feedbackItem.classList.add("border-success");
        correctCount++;
      } else {
        feedbackItem.classList.add("border-danger");
      }
    });

    /* Set up progress bar */
    for (let i = 0; i < blankCount; i++) {
      let s =
        i < correctCount
          ? LupBookActivity.ProgressStatus.SUCCESS
          : LupBookActivity.ProgressStatus.FAILURE;
      this.progressStatus(i, s);
    }
    this.visibilityProgress(true);

    /* Feedback score */
    if (correctCount == blankCount) {
      this.testingScore.textContent = "Congratulations!";
      this.testingScore.classList.add("alert-success");
    } else {
      this.testingScore.textContent = `You correctly filled in ${correctCount} blanks out of ${blankCount}.`;
      this.testingScore.classList.add("alert-danger");
    }

    /* Show feedback */
    this.testingScore.classList.remove("d-none");
    this.showFeedback();

    /* Overall feedback via submit button */
    let s =
      correctCount == blankCount
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
 * Initialize "FIB" interactive activities after page loading
 */
window.addEventListener("DOMContentLoaded", () => {
  let fibActivities = [];

  for (const e of document.getElementsByClassName("fib-container")) {
    fibActivities.push(new FIBActivity(e));
  }
});
