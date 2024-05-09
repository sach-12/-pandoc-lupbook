/*
 * Copyright (c) 2023 LupLab
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const SubmitState = {
  /* First submission after reset */
  SUBMISSION: 1,
  /* Feedback corresponds to submission */
  SUBMITTED: 2,
  /* Submission modified, feedback possibly outdated */
  RESUBMISSION: 3,
};

function matching_init(elt) {
  /*
   * Collect handles to various elements
   */
  const id = elt.id;
  const prefix_id = `matching-${id}`;

  // Activity
  const choice_box = document.getElementById(`${prefix_id}-choices`);
  const choice_items = Array.from(choice_box.getElementsByClassName("matching-choice"));
  const answer_boxes = Array.from(elt.getElementsByClassName("matching-answer"));

  // Actions
  const submit_btn = document.getElementById(`${prefix_id}-submit`);
  const reset_btn = document.getElementById(`${prefix_id}-reset`);

  // Feedback
  const fb_resubmission = document.getElementById(`${prefix_id}-feedback-resubmission`);
  const fb_progress = document.getElementById(`${prefix_id}-feedback-progress`);
  const fb_progressbars = Array.from(fb_progress.getElementsByClassName("progress-bar"));
  const fb_btn = document.getElementById(`${prefix_id}-feedback-btn`);

  const fb_div = document.getElementById(`${prefix_id}-feedback`);
  const fb_div_collapse = new bootstrap.Collapse(fb_div, { toggle: false });

  const fb_score = document.getElementById(`${prefix_id}-feedback-score`);
  const fb_items = Array.from(fb_div.getElementsByClassName("matching-feedback-item"));


  /*
   * Dragging feature
   */
  // Attach "source" dragging functions to choice items
  choice_items.forEach((choice_item) => {
    choice_item.draggable = true;

    choice_item.ondragstart = (event) => {
      event.dataTransfer.clearData();
      event.dataTransfer.setData("text", event.target.id);
      event.dataTransfer.effectAllowed = "move";
      event.target.classList.replace("bg-white", "bg-light-subtle");
    };

    choice_item.ondragend = (event) => {
      event.target.classList.replace("bg-light-subtle", "bg-white");
    };
  });

  // Attach "target" dragging functions to answer boxes
  answer_boxes.forEach((answer_box) => {
    answer_box.ondragover = (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    };

    answer_box.ondragenter = (event) => {
      event.preventDefault();
      event.target.classList.replace("bg-light", "bg-secondary-subtle");
    };

    answer_box.ondragleave = (event) => {
      event.preventDefault();
      event.target.classList.replace("bg-secondary-subtle", "bg-light");
    };

    answer_box.ondrop = (event) => {
      event.preventDefault();

      // Dragged element
      const dragged = document.getElementById(event.dataTransfer.getData("text"));

      // Target container
      const target = event.target.closest(".matching-answer");

      // Move dragged element to target container
      target.appendChild(dragged);
      event.target.classList.replace("bg-secondary-subtle", "bg-light");

      modified();
    };
  });


  /*
   * Click events
   */
  // Reset button click event
  reset_btn.addEventListener('click', () => {
    // Move all choice items back to choice box
    choice_items.forEach((choice_item) => {
      choice_box.appendChild(choice_item);
    })
    reset();
  });

  // Choice items click events
  choice_items.forEach((choice_item) => {
    choice_item.addEventListener('click', (event) => {
      /* Move choice items back to choice box in one click */
      if (choice_item.parentNode != choice_box) {
        choice_box.appendChild(choice_item);
        modified();
      }
    })
  });

  // Submit button click event
  submit_btn.addEventListener('click', () => {

    // Nothing to do if activity hasn't changed since previous submission
    if (submit_btn.dataset.state == SubmitState.SUBMITTED)
      return;

    let correct_count = 0;

    softReset();

    // Check each items
    choice_items.forEach((choice_item) => {
      const choice_id = choice_item.id.split('-').pop();
      const choice_match = choice_item.dataset.match;
      const containing_box = choice_item.parentNode;
      const fb_item = document.getElementById(`${prefix_id}-feedback-${choice_id}`);

      // Show feedback only if choice item was moved to answer box
      if (containing_box.classList.contains("matching-answer")) {
        // show corresponding feedback item and color it appropriately
        fb_item.classList.remove("d-none");
        if (containing_box.id != `${prefix_id}-answer-${choice_match}`) {
          fb_item.classList.add("border-danger");
        } else {
          fb_item.classList.add("border-success");
          correct_count++;
        }
      } else {
        fb_item.classList.add("d-none");
      }
    });

    // Set up progress bar
    fb_resubmission.classList.add("d-none");
    fb_progress.classList.remove("d-none");
    fb_progressbars.forEach((item, index) => {
      if (index < correct_count)
        item.classList.add("bg-success");
      else
        item.classList.add("bg-danger");
    });

    // Configure feedback
    if (correct_count == choice_items.length) {
      fb_score.innerHTML = "Congratulations!";
      fb_score.classList.add("alert-success");
    } else {
      fb_score.innerHTML = `You correctly matched ${correct_count} items`
        + ` out of ${choice_items.length}.`;
      fb_score.classList.add("alert-danger");
    }

    // Show feedback
    fb_score.classList.remove("d-none");
    fb_btn.classList.remove("d-none");
    fb_div_collapse.show();
    fb_div.addEventListener("shown.bs.collapse", () => {
      fb_div.scrollIntoView();
    }, { once: true });

    submit_btn.dataset.state = SubmitState.SUBMITTED;
  });

  /*
   * State management
   */
  // Initial
  submit_btn.dataset.state = SubmitState.SUBMISSION;

  // Handles modifications in activity
  function modified() {
    // Nothing to do if activity hasn't been submitted once yet, or if we're
    // already in an outdated state
    if (submit_btn.dataset.state != SubmitState.SUBMITTED)
      return;

    // Mark feedback as outdated
    fb_progress.classList.add("d-none");
    fb_resubmission.classList.remove("d-none");
    fb_div.classList.add("opacity-50");

    submit_btn.dataset.state = SubmitState.RESUBMISSION;
  }

  // Upon reset or upon resubmission
  function softReset() {
    fb_div.classList.remove("opacity-50");
    fb_score.classList.remove("alert-success", "alert-danger");
    fb_items.forEach((item) => {
      item.classList.remove("border-success", "border-danger");
    });
    fb_progressbars.forEach((item) => {
        item.classList.remove("bg-success", "bg-danger");
    });
  }

  // Reset activity
  function reset() {
    // Nothing to do if activity hasn't been submitted once yet
    if (submit_btn.dataset.state == SubmitState.SUBMISSION)
      return;

    softReset();

    // Hide feedback section
    fb_btn.classList.add("d-none");
    fb_div_collapse.hide();

    // Hide progress bars
    fb_progress.classList.add("d-none");
    fb_resubmission.classList.add("d-none");

    // Hide feedback score
    fb_score.classList.add("d-none");

    // Hide feedback items
    fb_items.forEach((item) => {
      item.classList.add("d-none");
    });

    submit_btn.dataset.state = SubmitState.SUBMISSION;
  }
}

/*
 * Initialize "matching" interactive components after page loading
 */
window.addEventListener('DOMContentLoaded', () => {
  for (const e of document.getElementsByClassName("matching-container")) {
    matching_init(e);
  }
});
