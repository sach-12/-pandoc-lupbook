/*
 * Copyright (c) 2023 LupLab
 * SPDX-License-Identifier: AGPL-3.0-only
 */

class MatchingActivity extends LupBookActivity {
  /* Class members */
  choiceBox;
  choiceItems = [];
  answerContainer;
  answerBoxes = [];

  testingScore;
  feedbackItems = [];

  placeHolder;

  /* Class methods */
  constructor(elt) {
    super("matching", elt);

    /* Handle on various elements of our activity */
    this.choiceBox = document.getElementById(`${this.prefixId}-choices`);
    this.choiceItems = Array.from(
      this.choiceBox.getElementsByClassName("matching-choice")
    );
    this.answerContainer = document.getElementById(`${this.prefixId}-answers`);
    this.answerBoxes = Array.from(
      elt.getElementsByClassName("matching-answer")
    );

    this.testingScore = document.getElementById(
      `${this.prefixId}-testing-score`
    );
    this.feedbackItems = Array.from(
      elt.getElementsByClassName("matching-feedback-item")
    );

    /* Init activity */
    this.initActivity();

    /* Activity is ready to be used! */
    this.submitStatus(LupBookActivity.SubmitStatus.ENABLED);
  }

  initActivity() {
    this.placeHolder = document.createElement("div");
    this.placeHolder.className =
      "matching-placeholder border border-0 bg-secondary-subtle rounded m-2 mb-0 p-2 d-flex";

    /* Attach "source" dragging functions to choice items */
    this.choiceItems.forEach((item) => {
      item.draggable = true;

      item.ondragstart = (event) => {
        event.dataTransfer.clearData();
        event.dataTransfer.setData("text", event.target.id);
        event.dataTransfer.effectAllowed = "move";
        event.target.classList.replace("bg-white", "bg-light-subtle");

        setTimeout(() => {
          this.answerBoxes.forEach((box) => {
            box.appendChild(this.placeHolder.cloneNode());
          });
        }, 0);
      };

      item.ondragend = (event) => {
        event.target.classList.replace("bg-light-subtle", "bg-white");

        setTimeout(() => {
          Array.from(
            this.answerContainer.getElementsByClassName("matching-placeholder")
          ).forEach((node) => node.remove());
        }, 0);
      };
    });

    /* Attach "target" dragging functions to answer boxes */
    this.answerBoxes.forEach((box) => {
      box.ondragover = (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";

        /* Highlight placeholder we're onto if any */
        Array.from(
          this.answerContainer.getElementsByClassName("matching-placeholder")
        ).forEach((node) => {
          if (node === event.target)
            node.classList.replace("bg-secondary-subtle", "bg-primary-subtle");
          else
            node.classList.replace("bg-primary-subtle", "bg-secondary-subtle");
        });
      };

      box.ondrop = (event) => {
        event.preventDefault();

        /* Only dropping in a placeholder */
        if (!event.target.classList.contains("matching-placeholder")) return;

        /* Target answer box */
        const box = event.target.closest(".matching-answer");

        /* Move dragged element to target container */
        const dragged = document.getElementById(
          event.dataTransfer.getData("text")
        );
        box.insertBefore(dragged, event.target);

        /* Modifications re-enable the activity's submittability */
        this.submitStatus(LupBookActivity.SubmitStatus.ENABLED);
      };
    });

    /* Move choice items back to choice box in one click */
    this.choiceItems.forEach((item) => {
      item.addEventListener("click", () => {
        if (item.parentNode != this.choiceBox) {
          this.choiceBox.appendChild(item);
          this.submitStatus(LupBookActivity.SubmitStatus.ENABLED);
        }
      });
    });
  }

  onReset() {
    /* Move all choice items back to choice box */
    this.choiceItems.forEach((item) => this.choiceBox.appendChild(item));

    /* Clear testing area */
    this.visibilityProgress(false);
    this.hideFeedback(true);

    this.visibilityTesting(false);
    this.clearTesting();

    /* Allow new submission */
    this.submitStatus(LupBookActivity.SubmitStatus.ENABLED);
  }

  onSubmit() {
    const choiceCount = this.choiceItems.length;
    let correctCount = 0;

    /* Disable buttons */
    this.submitStatus(LupBookActivity.SubmitStatus.DISABLED);
    this.resetStatus(false);

    /* Clear info from previous submission if any */
    this.clearProgress();
    this.clearTesting();

    /* Now compute which choice items are correct */
    this.choiceItems.forEach((item, idx) => {
      const choiceContainerElt = item.parentNode;
      const feedbackItem = this.feedbackItems[idx];
      const answerChoices = choiceContainerElt.dataset.choices ? 
        choiceContainerElt.dataset.choices.split(",") : [];

      const choiceId = item.id.split("-").pop();
      if (
        feedbackItem !=
        document.getElementById(`${this.prefixId}-feedback-${choiceId}`)
      )
        throw new Error("ohoh");

      /* Show feedback only if choice item was moved to answer box */
      if (choiceContainerElt.classList.contains("matching-answer")) {
        /* Show corresponding feedback item and color it appropriately */
        feedbackItem.classList.remove("d-none");
        if (answerChoices.includes(choiceId)) {
          feedbackItem.classList.add("border-success");
          correctCount++;
        } else {
          feedbackItem.classList.add("border-danger");
        }
      } else {
        feedbackItem.classList.add("d-none");
      }
    });

    /* Set up progress bar */
    for (let i = 0; i < choiceCount; i++) {
      let s =
        i < correctCount
          ? LupBookActivity.ProgressStatus.SUCCESS
          : LupBookActivity.ProgressStatus.FAILURE;
      this.progressStatus(i, s);
    }
    this.visibilityProgress(true);

    /* Feedback score */
    if (correctCount == choiceCount) {
      this.testingScore.textContent = "Congratulations!";
      this.testingScore.classList.add("alert-success");
    } else {
      this.testingScore.textContent = `You correctly matched ${correctCount} items out of ${choiceCount}.`;
      this.testingScore.classList.add("alert-danger");
    }

    /* Show feedback */
    this.testingScore.classList.remove("d-none");
    this.showFeedback();

    /* Overall feedback via submit button */
    let s =
      correctCount == choiceCount
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
 * Initialize "matching" interactive components after page loading
 */
window.addEventListener("DOMContentLoaded", () => {
  let matchingActivities = [];

  for (const e of document.getElementsByClassName("matching-container")) {
    matchingActivities.push(new MatchingActivity(e));
  }
});
