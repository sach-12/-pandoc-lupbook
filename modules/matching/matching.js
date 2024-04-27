function matching_init(elt) {
  /*
   * Collect handles to various elements
   */
  const id = elt.id;

  // Body elements
  const choice_box = document.getElementById(`matching-${id}-choices`);
  const choice_blocks = Array.from(elt.getElementsByClassName("matching-choice"));
  const answer_blocks = Array.from(elt.getElementsByClassName("matching-answer"));

  // Control buttons
  const submit_btn = document.getElementById(`matching-${id}-submit`);
  const reset_btn = document.getElementById(`matching-${id}-reset`);
  const feedback_btn = document.getElementById(`matching-${id}-feedback-btn`);

  // Feedback section
  const feedback_elt = document.getElementById(`matching-${id}-feedback`);
  const feedback_score = document.getElementById(`matching-${id}-feedback-score`);
  const feedback_items = Array.from(elt.getElementsByClassName("matching-feedback-item"));

  const feedback_coll = new bootstrap.Collapse(feedback_elt, { toggle: false });

  /*
   * Dragging feature
   */
  // Attach "source" dragging functions to choice blocks
  choice_blocks.forEach((choice_block) => {
    choice_block.draggable = true;

    choice_block.ondragstart = (event) => {
      event.dataTransfer.clearData();
      event.dataTransfer.setData("text", event.target.id);
      event.dataTransfer.effectAllowed = "move";
      event.target.classList.replace("bg-white", "bg-light-subtle");
    };

    choice_block.ondragend = (event) => {
      event.target.classList.replace("bg-light-subtle", "bg-white");
    };
  });

  // Attach "target" dragging functions to answer blocks
  answer_blocks.forEach((answer_block) => {
    answer_block.ondragover = (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    };

    answer_block.ondragenter = (event) => {
      event.preventDefault();
      event.target.classList.replace("bg-light", "bg-secondary-subtle");
    };

    answer_block.ondragleave = (event) => {
      event.preventDefault();
      event.target.classList.replace("bg-secondary-subtle", "bg-light");
    };

    answer_block.ondrop = (event) => {
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
    softReset();

    // Move all choice blocks back to choice box
    choice_blocks.forEach((choice_block) => {
      choice_box.appendChild(choice_block);
    })
  });

  // Choice blocks click events
  choice_blocks.forEach((choice_block) => {
    choice_block.addEventListener('click', (event) => {
      /* Move choice blocks back to choice box in one click */
      if (choice_block.parentNode != choice_box) {
        choice_box.appendChild(choice_block);
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

    // Check each blocks
    choice_blocks.forEach((choice_block) => {
      const choice_id = choice_block.id.split('-').pop();
      const choice_match = choice_block.dataset.match;
      const containing_box = choice_block.parentNode;
      const feedback_item = document.getElementById(`matching-${id}-feedback-${choice_id}`);

      // Show feedback only if choice block was moved to answer box
      if (containing_box.classList.contains("matching-answer")) {
        // show corresponding feedback item and color it appropriately
        feedback_item.classList.remove("d-none");
        if (containing_box.id != `matching-${id}-answer-${choice_match}`) {
          feedback_item.classList.add("border-danger");
        } else {
          feedback_item.classList.add("border-success");
          correct_count++;
        }
      }
    });

    // Configure feedback
    if (correct_count == choice_blocks.length) {
      feedback_score.innerHTML = "Congratulations!";
      feedback_score.classList.add("bg-success-subtle");
    } else {
      feedback_score.innerHTML = `You correctly matched ${correct_count} items`
        + ` out of ${choice_blocks.length}.`;
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

    // Reset feedback score
    feedback_score.classList.remove("bg-success-subtle", "bg-danger-subtle");
    feedback_score.classList.add("d-none");

    // Reset each feedback item
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
