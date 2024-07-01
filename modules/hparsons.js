/*
 * Copyright (c) 2024 LupLab
 * SPDX-License-Identifier: AGPL-3.0-only
 */

class HParsonsActivity extends LupBookActivity {
  /* Class members */
  fragBox;
  fragItems = [];
  answerBox;

  testingScore;

  totalOrderCount = 0;
  totalDistractorCount = 0;

  placeHolder;

  /* Class methods */
  constructor(elt) {
    super("hparsons", elt);

    /* Handle on various elements of our activity */
    this.fragBox = document.getElementById(`${this.prefixId}-frags`);
    this.fragItems = Array.from(
      this.fragBox.getElementsByClassName("hparsons-frag")
    );
    this.answerBox = document.getElementById(`${this.prefixId}-answers`);

    this.testingScore = document.getElementById(
      `${this.prefixId}-testing-score`
    );

    /* Init activity */
    this.initActivity();

    /* Activity is ready to be used! */
    this.submitStatus(LupBookActivity.SubmitStatus.ENABLED);
  }

  initActivity() {
    this.placeHolder = document.createElement("div");
    this.placeHolder.className =
      "hparsons-placeholder border border-0 bg-secondary-subtle rounded my-2 mx-1 p-2 d-flex";

    /* Attach "source" dragging functions to frag items */
    this.fragItems.forEach((item) => {
      item.draggable = true;

      if (parseInt(item.dataset.order, 10) !== -1) this.totalOrderCount++;
      else this.totalDistractorCount++;

      item.ondragstart = (event) => {
        event.dataTransfer.clearData();
        event.dataTransfer.setData("text", event.target.id);
        event.dataTransfer.effectAllowed = "move";
        event.target.classList.replace("bg-white", "bg-light-subtle");

        setTimeout(() => {
          const answerBox = this.answerBox;
          Array.from(answerBox.children).forEach((child) => {
            answerBox.insertBefore(this.placeHolder.cloneNode(), child);
          });
          answerBox.appendChild(this.placeHolder.cloneNode());
        }, 0);
      };

      item.ondragend = (event) => {
        event.target.classList.replace("bg-light-subtle", "bg-white");

        setTimeout(() => {
          Array.from(
            this.answerBox.getElementsByClassName("hparsons-placeholder")
          ).forEach((child) => child.remove());
        }, 0);
      };
    });

    /* Attach "target" dragging functions to answer box */
    this.answerBox.ondragover = (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";

      /* Highlight placeholder we're onto if any */
      Array.from(
        this.answerBox.getElementsByClassName("hparsons-placeholder")
      ).forEach((child) => {
        if (child === event.target)
          child.classList.replace("bg-secondary-subtle", "bg-primary-subtle");
        else
          child.classList.replace("bg-primary-subtle", "bg-secondary-subtle");
      });
    };

    this.answerBox.ondrop = (event) => {
      event.preventDefault();

        /* Only dropping in a placeholder */
      if (!event.target.classList.contains("hparsons-placeholder")) return;

      /* Move dragged element to target container */
      const dragged = document.getElementById(
        event.dataTransfer.getData("text")
      );
      this.answerBox.insertBefore(dragged, event.target);

      /* Modifications re-enable the activity's submittability */
      this.submitStatus(LupBookActivity.SubmitStatus.ENABLED);
    };

    /* Move frag items back to frag box in one click */
    this.fragItems.forEach((item) => {
      item.addEventListener("click", () => {
        if (item.parentNode != this.fragBox) {
          this.fragBox.appendChild(item);
          this.submitStatus(LupBookActivity.SubmitStatus.ENABLED);
        }
      });
    });
  }

  onReset() {
    this.fragItems.forEach((item) => this.fragBox.appendChild(item));

    /* Clear testing area */
    this.visibilityProgress(false);
    this.hideFeedback(true);

    this.visibilityTesting(false);
    this.clearTesting();

    /* Allow new submission */
    this.submitStatus(LupBookActivity.SubmitStatus.ENABLED);
  }

  onSubmit() {
    let orderCount = 0;
    let distractorCount = 0;

    /* Disable buttons */
    this.submitStatus(LupBookActivity.SubmitStatus.DISABLED);
    this.resetStatus(false);

    /* Clear info from previous submission if any */
    this.clearProgress();
    this.clearTesting();

    /* Check solution */
    Array.from(this.answerBox.children).forEach((child, idx) => {
      if (parseInt(child.dataset.order, 10) === idx + 1) orderCount++;
    });
    Array.from(this.fragBox.children).forEach((child) => {
      if (parseInt(child.dataset.order, 10) === -1) distractorCount++;
    });

    /* Overall success */
    let success =
      orderCount === this.totalOrderCount &&
      distractorCount === this.totalDistractorCount;

    /* Set up progress bar */
    for (let i = 0; i < this.fragItems.length; i++) {
      let s =
        success || i < orderCount + distractorCount
          ? LupBookActivity.ProgressStatus.SUCCESS
          : LupBookActivity.ProgressStatus.FAILURE;
      this.progressStatus(i, s);
    }
    this.visibilityProgress(true);

    /* Feedback score */
    if (success) {
      this.testingScore.textContent = "Congratulations!";
      this.testingScore.classList.add("alert-success");
    } else {
      this.testingScore.textContent = `You correctly placed ${orderCount} fragment(s), including not placing ${distractorCount} distractor(s).`;
      this.testingScore.classList.add("alert-danger");
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
  }

  visibilityTesting(visible) {
    if (visible) {
      this.testingScore.classList.remove("d-none");
    } else {
      this.testingScore.classList.add("d-none");
    }
  }
}

/*
 * Initialize "matching" interactive components after page loading
 */
window.addEventListener("DOMContentLoaded", () => {
  let hparsonsActivities = [];

  for (const e of document.getElementsByClassName("hparsons-container")) {
    hparsonsActivities.push(new HParsonsActivity(e));
  }
});
