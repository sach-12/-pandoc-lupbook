/*
 * Copyright (c) 2024 LupLab
 * SPDX-License-Identifier: AGPL-3.0-only
 */

class LupBookActivity {
  static SubmitStatus = Object.freeze({
    ENABLED: "ENABLED",
    DISABLED: "DISABLED",
    SUCCESS: "SUCCESS",
    FAILURE: "FAILURE"
  });

  static ProgressStatus = Object.freeze({
    RESET: "CLEAR",
    PENDING: "PENDING",
    SUCCESS: "SUCCESS",
    FAILURE: "FAILURE"
  });

  /* Class members */
  prefixId;
  sectionDiv;

  submitBtn;
  resetBtn;
  testingBtn;

  testingProgress;
  testingProgressBars;

  testingDiv;
  testingDivCollapse;

  /* Class methods */
  constructor(type, elt) {
    this.prefixId = `${type}-${elt.id}`;
    this.sectionDiv = elt.closest("section");

    this.submitBtn = document.getElementById(`${this.prefixId}-submit`);
    this.resetBtn = document.getElementById(`${this.prefixId}-reset`);
    this.testingBtn = document.getElementById(`${this.prefixId}-testing-btn`);

    this.testingProgress = document.getElementById(
      `${this.prefixId}-testing-progress`
    );
    this.testingProgressBars = Array.from(
      this.testingProgress.getElementsByClassName("progress-bar")
    );

    /*
     * Collect handles to various elements
     */
    this.testingDiv = document.getElementById(`${this.prefixId}-testing`);
    this.testingDivCollapse = new bootstrap.Collapse(this.testingDiv, {
      toggle: false
    });

    this.submitBtn.onclick = () => this.onSubmit();
    this.resetBtn.onclick = () => this.onReset();
  }

  onSubmit() {
    throw new Error("This method should be overridden by subclasses");
  }

  onReset() {
    throw new Error("This method should be overridden by subclasses");
  }

  showFeedback(onShow = null) {
    this.testingBtn.classList.remove("d-none");
    let showTestingDiv = () => {
      this.testingDiv.scrollIntoView({ block: "nearest" });
      if (onShow) onShow();
    };
    if (this.testingDiv.classList.contains("show")) {
      showTestingDiv();
    } else {
      this.testingDiv.addEventListener("shown.bs.collapse", showTestingDiv, {
        once: true
      });
      this.testingDivCollapse.show();
    }
  }

  hideFeedback(hideBtn = false) {
    this.testingDivCollapse.hide();
    if (hideBtn) this.testingBtn.classList.add("d-none");
  }

  submitStatus(submitState) {
    switch (submitState) {
      case LupBookActivity.SubmitStatus.ENABLED:
        this.submitBtn.classList.remove("btn-danger", "btn-success");
        this.submitBtn.classList.add("btn-primary");
        this.submitBtn.disabled = false;
        break;
      case LupBookActivity.SubmitStatus.DISABLED:
        this.submitBtn.classList.remove("btn-danger", "btn-success");
        this.submitBtn.classList.add("btn-primary");
        this.submitBtn.disabled = true;
        break;
      case LupBookActivity.SubmitStatus.SUCCESS:
        this.submitBtn.classList.remove("btn-primary");
        this.submitBtn.classList.add("btn-success");
        break;
      case LupBookActivity.SubmitStatus.FAILURE:
        this.submitBtn.classList.remove("btn-primary");
        this.submitBtn.classList.add("btn-danger");
        break;
    }
  }

  resetStatus(resetEnabled) {
    this.resetBtn.disabled = !resetEnabled;
  }

  progressStatus(idx, progressState) {
    if (idx === undefined) throw new Error();
    let item = this.testingProgressBars[idx];
    switch (progressState) {
      case LupBookActivity.ProgressStatus.CLEAR:
        item.classList.remove("bg-success", "bg-danger");
        item.classList.add("bg-light");
        break;
      case LupBookActivity.ProgressStatus.PENDING:
        item.classList.remove("bg-light");
        item.classList.add("progress-bar-striped", "progress-bar-animated");
        break;
      case LupBookActivity.ProgressStatus.SUCCESS:
        item.classList.remove(
          "bg-light",
          "progress-bar-striped",
          "progress-bar-animated"
        );
        item.classList.add("bg-success");
        break;
      case LupBookActivity.ProgressStatus.FAILURE:
        item.classList.remove(
          "bg-light",
          "progress-bar-striped",
          "progress-bar-animated"
        );
        item.classList.add("bg-danger");
        break;
    }
  }

  clearProgress() {
    this.testingProgressBars.forEach((item, idx) => {
      this.progressStatus(idx, LupBookActivity.ProgressStatus.CLEAR);
    });
  }

  visibilityProgress(visible) {
    if (visible) this.testingProgress.classList.remove("d-none");
    else this.testingProgress.classList.add("d-none");
  }
}
