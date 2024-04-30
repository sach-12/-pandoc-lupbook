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
  const feedback_prog = document.getElementById(`${prefix_id}-feedback-progress`);
  const feedback_progs = Array.from(feedback_prog.getElementsByClassName("progress-bar"));
  const feedback_btn = document.getElementById(`${prefix_id}-feedback-btn`);

  const feedback_sect = document.getElementById(`${prefix_id}-feedback`);
  const feedback_coll = new bootstrap.Collapse(feedback_sect, { toggle: false });

  const feedback_score = document.getElementById(`${prefix_id}-feedback-score`);
  const feedback_items = Array.from(feedback_sect.getElementsByClassName("matching-feedback-item"));


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

      softReset();
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
    softReset();
  });

  // Choice items click events
  choice_items.forEach((choice_item) => {
    choice_item.addEventListener('click', (event) => {
      /* Move choice items back to choice box in one click */
      if (choice_item.parentNode != choice_box) {
        choice_box.appendChild(choice_item);
        if (submit_btn.disabled)
          softReset();
      }
    })
  });

  // Submit button click event
  submit_btn.addEventListener('click', () => {
    let correct_count = 0;

    // Prevent submitting again if nothing has changed
    submit_btn.disabled = true;

    // Check each items
    choice_items.forEach((choice_item) => {
      const choice_id = choice_item.id.split('-').pop();
      const choice_match = choice_item.dataset.match;
      const containing_box = choice_item.parentNode;
      const feedback_item = document.getElementById(`${prefix_id}-feedback-${choice_id}`);

      // Show feedback only if choice item was moved to answer box
      if (containing_box.classList.contains("matching-answer")) {
        // show corresponding feedback item and color it appropriately
        feedback_item.classList.remove("d-none");
        if (containing_box.id != `${prefix_id}-answer-${choice_match}`) {
          feedback_item.classList.add("border-danger");
        } else {
          feedback_item.classList.add("border-success");
          correct_count++;
        }
      }
    });

    // Set up progress bar
    feedback_prog.classList.remove("d-none");
    feedback_progs.forEach((item, index) => {
      if (index < correct_count)
        item.classList.add("bg-success");
      else
        item.classList.add("bg-danger");
    });

    // Configure feedback
    if (correct_count == choice_items.length) {
      feedback_score.innerHTML = "Congratulations!";
      feedback_score.classList.add("bg-success-subtle");
    } else {
      feedback_score.innerHTML = `You correctly matched ${correct_count} items`
        + ` out of ${choice_items.length}.`;
      feedback_score.classList.add("bg-danger-subtle");
    }

    // Show feedback
    feedback_score.classList.remove("d-none");
    feedback_btn.classList.remove("d-none");
    feedback_coll.show();
  });

  /*
   * Helper functions
   */
  // A soft reset makes the interactive activity be submittable again
  function softReset () {
    // Re-enable submit button
    submit_btn.disabled = false;

    // Hide feedback section
    feedback_btn.classList.add("d-none");
    feedback_coll.hide();

    // Reset progress bar
    feedback_prog.classList.add("d-none");
    feedback_progs.forEach((item) => {
        item.classList.remove("bg-success", "bg-danger");
    });

    // Reset feedback score
    feedback_score.classList.add("d-none");
    feedback_score.classList.remove("bg-success-subtle", "bg-danger-subtle");

    // Reset feedback items
    feedback_items.forEach((item) => {
      item.classList.add("d-none");
      item.classList.remove("border-success", "border-danger");
    });
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
