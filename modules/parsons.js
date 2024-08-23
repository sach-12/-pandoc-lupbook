/*
 * Copyright (c) 2023 LupLab
 * SPDX-License-Identifier: AGPL-3.0-only
 */

class ParsonsActivity extends LupBookActivity {
  /* Class members */
  fragItems = [];
  answerBox;

  testingScore;

  totalValidFrags = 0;
  totalInvalidFrags = 0;

  placeHolder;

  /* Class methods */
  constructor(elt, type = "parsons") {
    super(type, elt);

    /* Handle on various elements of our activity */
    const fragBox = document.getElementById(`${this.prefixId}-frags`);
    this.fragItems = Array.from(
      fragBox.getElementsByClassName(`parsons-frag`)
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
      "parsons-placeholder border border-0 bg-secondary-subtle rounded m-2 mb-0 p-2 d-flex";

    /* Attach "source" dragging functions to frag items */
    this.fragItems.forEach((item) => {
      this.setFragDraggable(item, true);

      if (parseInt(item.dataset.id, 10) !== -1) this.totalValidFrags++;
      else this.totalInvalidFrags++;

      item.ondragstart = (event) => {
        event.dataTransfer.clearData();
        event.dataTransfer.setData("text", event.target.id);
        event.dataTransfer.effectAllowed = "move";
        event.target.classList.replace("bg-white", "bg-light-subtle");

        setTimeout(() => {
          /* Placeholders at possible dropping spots. Avoid spots directly
           * around currently dragged item since it wouldn't make it move. */
          const answerBox = this.answerBox;
          Array.from(answerBox.children).forEach((child) => {
            if (child !== item && child.previousSibling !== item)
              answerBox.insertBefore(this.placeHolder.cloneNode(), child);
          });
          if (answerBox.lastChild !== item)
            answerBox.appendChild(this.placeHolder.cloneNode());
        }, 0);
      };

      item.ondragend = (event) => {
        event.target.classList.replace("bg-light-subtle", "bg-white");

        setTimeout(() => {
          Array.from(
            this.answerBox.getElementsByClassName("parsons-placeholder")
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
        this.answerBox.getElementsByClassName("parsons-placeholder")
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
      if (!event.target.classList.contains("parsons-placeholder")) return;

      /* Move dragged element to target container */
      const dragged = document.getElementById(
        event.dataTransfer.getData("text")
      );
      this.answerBox.insertBefore(dragged, event.target);

      /* Members of the same OR-group are no longer draggable */
      this.setGroupDraggable(this.getGroup(dragged), false);

      /* Modifications re-enable the activity's submittability */
      this.submitStatus(LupBookActivity.SubmitStatus.ENABLED);
    };

    /* Move frag items back to frag box in one click */
    this.fragItems.forEach((item) => {
      item.addEventListener("click", () => {
        if (item.parentNode === this.answerBox) {
          const group = this.getGroup(item);
          group.appendChild(item);
          this.setGroupDraggable(group, true);
          this.submitStatus(LupBookActivity.SubmitStatus.ENABLED);
        }
      });
    });
  }

  getGroup(frag) {
    return document.getElementById(
      `${this.prefixId}-frags-${frag.dataset.gid}`
    );
  }

  setFragDraggable(frag, draggable) {
    frag.draggable = draggable;
    if (draggable) frag.classList.add("grabbable");
    else frag.classList.remove("grabbable");
  }

  setGroupDraggable(group, draggable) {
    Array.from(group.getElementsByClassName("parsons-frag")).forEach(
      (child) => {
        this.setFragDraggable(child, draggable);
      }
    );
  }

  onReset() {
    this.fragItems.forEach((item) => {
      this.getGroup(item).appendChild(item);
      this.setFragDraggable(item, true);
    });

    /* Clear testing area */
    this.visibilityProgress(false);
    this.hideFeedback(true);

    this.visibilityTesting(false);
    this.clearTesting();

    /* Allow new submission */
    this.submitStatus(LupBookActivity.SubmitStatus.ENABLED);
  }

  onSubmit() {
    let visitedFrags = new Set();
    let missingCount = 0;
    let misplacedCount = 0;
    let invalidCount = 0;

    /* Disable buttons */
    this.submitStatus(LupBookActivity.SubmitStatus.DISABLED);
    this.resetStatus(false);

    /* Clear info from previous submission if any */
    this.clearProgress();
    this.clearTesting();

    /* Check solution */
    Array.from(this.answerBox.children).forEach((frag) => {
      /* Count number of placed distractors */
      const fragID = parseInt(frag.dataset.id, 10);
      if (fragID === -1) {
        invalidCount++;
        return;
      }

      /* Keep track of valid fragments */
      visitedFrags.add(fragID);

      /* If current fragment has no dependency, then it is necessarily properly
       * placed */
      const fragDepend = frag.dataset.depend
        ? parseInt(frag.dataset.depend, 10)
        : null;
      if (fragDepend === null) return;

      /* If the fragment's dependency has already been visited, then it's
       * prerequisites are met and is properly placed */
      if (visitedFrags.has(fragDepend)) return;

      /* Determine if the missing dependency was misplaced in the answer box, or
       * not placed at all*/
      const dependInAnswerBox = Array.from(this.answerBox.children).some(
        (child) => parseInt(child.dataset.id, 10) === fragDepend
      );
      if (dependInAnswerBox) misplacedCount++;
      else missingCount++;
    });

    const totalSubmittedFrags = Array.from(this.answerBox.children).length;

    /* Number of valid frags correctly placed in answer box */
    const correctValidCount =
      totalSubmittedFrags - misplacedCount - missingCount - invalidCount;
    /* Number of valid frags missing from answer box */
    const missingValidCount =
      this.totalValidFrags - (totalSubmittedFrags - invalidCount);
    /* Number of invalid frags correctly left in frag box */
    const correctInvalidCount = this.totalInvalidFrags - invalidCount;

    /* Overall success */
    const success =
      correctValidCount === this.totalValidFrags && invalidCount === 0;

    /* Set up progress bar */
    for (let i = 0; i < this.fragItems.length; i++) {
      const s =
        success || i < correctValidCount + correctInvalidCount
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
      this.testingScore.classList.add("alert-danger");
      this.testingScore.textContent = "";
      if (correctValidCount)
        this.testingScore.textContent += `At least ${correctValidCount} valid fragment(s) are correctly placed (more may be properly placed but are missing their dependencies). `;
      if (missingValidCount)
        this.testingScore.textContent += `You are still missing ${missingValidCount} valid fragment(s). `;
      if (invalidCount)
        this.testingScore.textContent += `You have incorrectly placed ${invalidCount} invalid fragment(s).`;
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
  let parsonsActivities = [];

  for (const e of document.getElementsByClassName("parsons-container")) {
    parsonsActivities.push(new ParsonsActivity(e));
  }
});
