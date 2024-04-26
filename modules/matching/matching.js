function matching_init(elt) {
  /*
   * Collect handles to various elements
   */
  const id = elt.id;

  // Body elements
  const choice_box = document.getElementById(`matching-${id}-choices`);
  const choice_blocks = Array.from(elt.getElementsByClassName("matching-c-choice"));
  const answer_blocks = Array.from(elt.getElementsByClassName("matching-c-answer"));

  // Control buttons
  const submit_btn = document.getElementById(`matching-${id}-submit`);
  const reset_btn = document.getElementById(`matching-${id}-reset`);
  const feedback_btn = document.getElementById(`matching-${id}-feedback-btn`);

  // Feedback section
  const feedback_elt = document.getElementById(`matching-${id}-feedback`);
  const feedback_correct = document.getElementById(`matching-${id}-correct`);
  const feedback_items = Array.from(elt.getElementsByClassName("matching-c-feedback-item"));

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
      event.target.classList.add("matching-c-choice__dragging");
    };

    choice_block.ondragend = (event) => {
      event.target.classList.remove("matching-c-choice__dragging");
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
      event.target.classList.add("bg-light");
    };

    answer_block.ondragleave = (event) => {
      event.preventDefault();
      event.target.classList.remove("bg-light");
    };

    answer_block.ondrop = (event) => {
      event.preventDefault();

      // Dragged element
      const dragged = document.getElementById(event.dataTransfer.getData("text"));

      // Target container
      const target = event.target.closest(".matching-c-answer");

      // Move dragged element to target container
      target.appendChild(dragged);
      target.classList.remove("bg-light");

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
      const choice_match = choice_block.getAttribute("matchid");
      const containing_box = choice_block.parentNode;
      const feedback_item = document.getElementById(`matching-${id}-feedback-${choice_id}`);

      // Show feedback only if choice block was moved to answer box
      if (containing_box.classList.contains("matching-c-answer")) {
        // show corresponding feedback item and color it appropriately
        feedback_item.classList.remove("d-none");
        if (containing_box.id != `matching-${id}-answer-${choice_match}`) {
          feedback_item.classList.add("matching-c-feedback-item__error");
        } else {
          feedback_item.classList.add("matching-c-feedback-item__pass");
          correct_count++;
        }
      }
    });

    // Configure feedback
    if (correct_count == choice_blocks.length) {
      submit_btn.classList.replace("btn-primary", "btn-success");
      feedback_correct.innerHTML = "Congratulations!";
    } else {
      submit_btn.classList.replace("btn-primary", "btn-danger");
      feedback_correct.innerHTML = `You got ${correct_count} out of`
        + ` ${choice_blocks.length} answers correct.`;
    }

    // Show feedback
    feedback_correct.classList.remove("d-none");
    feedback_btn.classList.remove("d-none");
    feedback_coll.show();
  });

  /*
   * Helper functions
   */
  // A soft reset makes the interactive activity be submittable again
  function softReset () {
    // Re-enable submit button and reset style
    submit_btn.disabled = false;
    submit_btn.classList.remove("btn-danger", "btn-success");
    submit_btn.classList.add("btn-primary");

    // Hide feedback section
    feedback_btn.classList.add("d-none");
    feedback_correct.classList.add("d-none");
    feedback_coll.hide();

    // Reset each feedback item
    feedback_items.forEach((item) => {
      item.classList.add("d-none");
      item.classList.remove("matching-c-feedback-item__error");
      item.classList.remove("matching-c-feedback-item__pass");
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
