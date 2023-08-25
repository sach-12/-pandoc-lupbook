var parsonses = {};

class Parsons {

    constructor(elt) {
        // Element ID
        this.id = elt.id;

        // DOM elements
        this.submit_btn = elt.getElementsByClassName("parsons-c-button__submit")[0];
        this.reset_btn = elt.getElementsByClassName("parsons-c-button__reset")[0];
        this.feedback_btn = elt.getElementsByClassName("parsons-c-feedback__toggle")[0];
        this.feedback_elt = elt.getElementsByClassName("parsons-l-feedback")[0];
        this.feedback_coll = new bootstrap.Collapse(this.feedback_elt, { toggle: false });
        this.pass_feedback = elt.getElementsByClassName("parsons-l-check-pass")[0];
        this.error_feedbacks = Array.from(elt.getElementsByClassName("parsons-l-check-error"));
        this.blocks = Array.from(elt.getElementsByClassName("parsons-l-block"));
        this.or_blocks = Array.from(elt.getElementsByClassName("parsons-l-or-blocks"));
        this.source = elt.getElementsByClassName("parsons-l-source")[0];
        this.answer = elt.getElementsByClassName("parsons-l-answer")[0];

        // Soft reset: When a block is dragged, the submit button is automatically enabled
        Array.from(this.blocks).forEach((block) => {
            block.addEventListener('dragend', () => {
                if (this.submit_btn.disabled) {
                    // Collapse feedback
                    this.feedback_btn.classList.add("d-none");
                    this.feedback_coll.hide();

                    this.pass_feedback.classList.add("d-none");
                    this.error_feedbacks.forEach((error_feedback) => {
                        error_feedback.classList.add("d-none");
                    })

                    // Remove error blocks' color
                    this.blocks.forEach((block) => {
                        block.classList.toggle("parsons-c-block-error", false);
                        block.classList.toggle("parsons-c-block-relative-correct", false);
                    })

                    // Reset submit button
                    this.submit_btn.style.backgroundColor = "#0B5ED7";
                    this.submit_btn.disabled = false;
                    this.reset_btn.disabled = false;
                }
            });
        });

        // Submit button click event
        this.submit_btn.addEventListener('click', () => {
            this.submit_btn.disabled = true;

            let answer_length = this.answer.children.length;
            let correct_length = getAnswerLength(this.blocks);

            let all_blocks_in_correct_order = true;
            if (answer_length < correct_length) {
                all_blocks_in_correct_order = false;
                this.error_feedbacks[0].classList.toggle("d-none", false);
            } else if (answer_length > correct_length) {
                all_blocks_in_correct_order = false;
                this.error_feedbacks[1].classList.toggle("d-none", false);
            } else {
                let blocks_in_answer = this.answer.children;
                let max_correct_sequence_length = 0;
                let current_correct_sequence_length = 0;
                let longest_sequence_start = 0;

                // Find the longest correct sequence
                for (let i = 0; i < blocks_in_answer.length; i++) {
                    const block = blocks_in_answer[i];
                    const correct_order = parseInt(block.dataset.correctOrder);

                    // Get the previous block's information
                    let block_before;
                    let correct_order_before;
                    if (i !== 0) {
                        block_before = blocks_in_answer[i - 1];
                        correct_order_before = parseInt(block_before.dataset.correctOrder);
                    }

                    if (correct_order === -1) {
                        // Handle decoy blocks
                        current_correct_sequence_length = 0;
                    } else {
                        if (current_correct_sequence_length === 0) {
                            current_correct_sequence_length = 1;
                        } else {
                            if (block_before && correct_order === correct_order_before + 1) {
                                current_correct_sequence_length++;
                                if (current_correct_sequence_length > max_correct_sequence_length) {
                                    max_correct_sequence_length = current_correct_sequence_length;
                                    longest_sequence_start = i - current_correct_sequence_length + 1;
                                }
                            } else {
                                current_correct_sequence_length = 1;
                            }
                        }
                    }
                }

                // Label the blocks
                for (let i = 0; i < blocks_in_answer.length; i++) {
                    const block = blocks_in_answer[i];
                    const correct_order = parseInt(block.dataset.correctOrder);

                    if (correct_order === -1) {
                        all_blocks_in_correct_order = false;
                        block.classList.add("parsons-c-block-error");
                    } else {
                        if (i === correct_order - 1) {
                            continue;
                        } else {
                            all_blocks_in_correct_order = false;

                            // Check if the block is in the longest correct sequence
                            if (max_correct_sequence_length > 1 && i >= longest_sequence_start && i < longest_sequence_start + max_correct_sequence_length) {
                                block.classList.add("parsons-c-block-relative-correct");
                            } else {
                                block.classList.add("parsons-c-block-error");
                            }
                        }
                    }
                }

                // Toggle feedback visibility
                this.pass_feedback.classList.toggle("d-none", !all_blocks_in_correct_order);
                this.error_feedbacks[2].classList.toggle("d-none", all_blocks_in_correct_order);
            }

            // Set submit button color based on correctness
            this.submit_btn.style.backgroundColor = all_blocks_in_correct_order ? "#198754" : "#e35d6a";

            /* Expand feedback */
            this.feedback_btn.classList.remove("d-none");
            this.feedback_coll.show();
        });

        // Reset button click event
        this.reset_btn.addEventListener('click', () => {
            // Collapse feedback
            this.feedback_btn.classList.add("d-none");
            this.feedback_coll.hide();

            // Remove placeholders
            let placeholders = Array.from(elt.getElementsByClassName("placeholder"));
            placeholders.forEach((placeholder) => {
                placeholder.remove();
            })

            // Remove error blocks' color
            this.blocks.forEach((block) => {
                block.classList.toggle("parsons-c-block-error", false);
                block.classList.toggle("parsons-c-block-relative-correct", false);
            })

            // Reset blocks
            this.blocks.forEach((block) => {
                if (block.classList.contains("parsons-l-or-block")) {
                    let or_block = document.getElementById(block.dataset.orBlockId);
                    if (or_block) {
                        or_block.children[1].appendChild(block);
                        this.source.appendChild(or_block);
                    } else {
                        this.source.appendChild(createOrBlock(block));
                    }
                } else {
                    this.source.appendChild(block);
                }
            })

            this.pass_feedback.classList.add("d-none");
            Array.from(this.error_feedbacks).forEach((error_feedback) => {
                error_feedback.classList.add("d-none")
            })

            // Reset submit button
            this.submit_btn.style.backgroundColor = "#0B5ED7";
            this.submit_btn.disabled = false;
            this.reset_btn.disabled = false;
        });

        // Set container height
        setContainerHeight(elt);
    }
}

function setContainerHeight(parsons_elt) {
    let blocks = Array.from(parsons_elt.getElementsByClassName("parsons-l-block"));
    let totalHeight = 0;

    blocks.forEach(block => {
        totalHeight += block.offsetHeight + parseInt(getComputedStyle(block).marginTop)
            + parseInt(getComputedStyle(block).marginBottom);
    });

    let sortable_containers = parsons_elt.getElementsByClassName("sortable-container");
    Array.from(sortable_containers).forEach(element => {
        element.style.height = `${totalHeight}px`;
    });
}

function setContainersHeight() {
    for (const parsons_elt of document.getElementsByClassName("parsons-l-container")) {
        setContainerHeight(parsons_elt);
    }
}

function getAnswerLength(blocks) {
    let length = Number.NEGATIVE_INFINITY;

    for (const block of blocks) {
        const correctOrder = parseInt(block.dataset.correctOrder, 10);
        if (!isNaN(correctOrder)) {
            length = Math.max(length, correctOrder);
        }
    }

    return length;
}

window.addEventListener('DOMContentLoaded', (evt) => {
    for (const parsons_elt of document.getElementsByClassName("parsons-l-container")) {
        parsonses[parsons_elt.id] = new Parsons(parsons_elt);
    }
});

window.addEventListener('resize', setContainersHeight);

class DragState {
    constructor() {
        this.dragged_element_id = "";
        this.dragged_element_height = 0;
        this.dragged_element_next_sibling_id = "";
    }

    setDragState(id, height, dragged_element_next_sibling_id) {
        this.dragged_element_id = id;
        this.dragged_element_height = height;
        this.dragged_element_next_sibling_id = dragged_element_next_sibling_id;
    }

    getDraggedElementId() {
        return this.dragged_element_id;
    }

    getDraggedElementHeight() {
        return this.dragged_element_height;
    }

    getDraggedElementNextSiblingId() {
        return this.dragged_element_next_sibling_id;
    }
}

let drag_state = new DragState();

function dragstart(ev) {
    const dragged_element = ev.target;

    // Store dragged element's height and next sibling ID
    let dragged_element_id = dragged_element.id;
    let dragged_element_height = dragged_element.getBoundingClientRect().height;
    let dragged_element_next_sibling_id = "";
    if (dragged_element.nextElementSibling) {
        dragged_element_next_sibling_id = dragged_element.nextElementSibling.id;
    }
    drag_state.setDragState(dragged_element_id, dragged_element_height, dragged_element_next_sibling_id);

    // Set data for the drag operation and hide the dragged element
    ev.dataTransfer.setData("text", dragged_element.id);
    dragged_element.classList.add("hide");
}

function dragend(ev) {
    const dragged_element = document.getElementById(ev.target.id);

    // Show the dragged element and reset stored values
    dragged_element.classList.remove("hide");
    drag_state = new DragState();
}

function dragover(ev) {
    ev.preventDefault();

    // Get container
    let container = ev.target;
    while (!container.classList.contains("sortable-container")) {
        container = container.parentNode;
    }

    // Delete placeholder
    let placeholders = Array.from(document.getElementsByClassName("placeholder"));
    if (placeholders) {
        placeholders.forEach((placeholder) => {
            placeholder.remove();
        })
    }

    // If container is empty
    let placeholder;
    if (container.children.length === 0) {
        placeholder = document.createElement("div");
        placeholder.style.height = drag_state.getDraggedElementHeight() + "px";
        placeholder.classList.add("placeholder");
        container.appendChild(placeholder);
        return;
    }

    // Handle placeholder
    let dragged_element = document.getElementById(drag_state.getDraggedElementId());

    // Handle placeholder in or-blocks
    let dragged_element_or_block_id = dragged_element.dataset.orBlockId;
    let dragged_element_or_block = container.querySelector(`#${dragged_element_or_block_id}`);
    // Check if the container has the or-block to which the dragged element belongs
    // This container could only be source container,
    // since only source container has or-blocks 
    if (dragged_element_or_block) {
        container = dragged_element_or_block.children[1];
        insertPlaceholder(ev, container);
        return;
    }

    // Handle where to put the placeholder not in or-blocks
    insertPlaceholder(ev, container);
}

function insertPlaceholder(ev, container) {
    const blocks = Array.from(container.children);
    let dragged_element_id = drag_state.getDraggedElementId();
    let dragged_element_height = drag_state.getDraggedElementHeight();
    let dragged_element_next_sibling_id = drag_state.getDraggedElementNextSiblingId();

    // If the container has only one block, and the block is the dragged element, we don't need to do anything.
    if (container.children.length === 1
        && container.children[0].id === dragged_element_id) {
        return;
    }

    for (const block of blocks) {
        // We don't insert placeholder before the dragged element
        if (block.id === dragged_element_id) {
            continue;
        }

        const mouseY = ev.clientY;
        const rect = block.getBoundingClientRect();
        const middleY = rect.top + rect.height / 2;
        if (mouseY < middleY) {
            // Don't insert placeholder before dragged element's next sibling
            if (dragged_element_next_sibling_id !== "" &&
                block.id === dragged_element_next_sibling_id) {
                return;
            }
            // Create and insert placeholder
            const placeholder = document.createElement("div");
            placeholder.style.height = dragged_element_height + "px";
            placeholder.classList.add("placeholder");
            container.insertBefore(placeholder, block);
            return;
        }
    }

    // The mouse is below the middle of the last element, 
    // so we insert the placeholder at the end of the container.
    const mouseY = ev.clientY;
    const rect = container.getBoundingClientRect();
    const container_bottom_y = rect.bottom;
    if (mouseY < container_bottom_y) {
        placeholder = document.createElement("div");
        placeholder.style.height = dragged_element_height + "px";
        placeholder.classList.add("placeholder");
        container.appendChild(placeholder);
    }
}

// This function prevents the following situation:
// When a block is dragged into a container but then dragged out without dropping,
// the placeholder remains visible in the container.
function dragleave(ev) {
    // Occasionally, the drag leave event of the parent element might still be triggered
    // when the mouse enters a child element. This code is designed to prevent such a scenario.
    if (ifMouseInBoundary(ev)) {
        return;
    }

    // Get container
    let container = ev.target;
    if (!container.classList.contains("sortable-container")
        && !container.classList.contains("parsons-l-or-content")) {
        // Only execute when leaving the big container, instead of blocks
        return;
    }

    // Remove placeholder if exists
    let placeholder = container.querySelector(".placeholder");
    if (placeholder) {
        placeholder.remove();
    }
}

function ifMouseInBoundary(ev) {
    let container = ev.target;
    const boundingRect = container.getBoundingClientRect();
    const mouseX = ev.clientX;
    const mouseY = ev.clientY;
    if (mouseX >= boundingRect.left &&
        mouseX <= boundingRect.right &&
        mouseY >= boundingRect.top &&
        mouseY <= boundingRect.bottom) {
        return true;
    } else {
        return false;
    }
}

function drop(ev) {
    // Get dragged element
    let dragged_element_id = ev.dataTransfer.getData("text");
    let dragged_element = document.getElementById(dragged_element_id);

    // Get container
    let drop_container = ev.target;
    while (!drop_container.classList.contains("sortable-container")) {
        drop_container = drop_container.parentNode;
    }

    // Handle changes to drag container
    // Find the container that holds the dragged element
    let drag_container = dragged_element;
    while (!drag_container.classList.contains("sortable-container")) {
        drag_container = drag_container.parentNode;
    }
    // Check if the dragged element is the last in or-block and remove it
    let or_blocks = dragged_element.parentNode.parentNode;
    if (drag_container !== drop_container &&
        or_blocks.classList.contains("parsons-l-or-blocks") &&
        or_blocks.children[1].children.length === 1) {
        or_blocks.remove();
    }

    // Handle changes to drop container
    // Check if the element is the first or-block of source region
    // Create the or-block if it is
    let dragged_element_or_block_id = dragged_element.dataset.orBlockId;
    let dragged_element_or_block = drop_container.querySelector(`#${dragged_element_or_block_id}`);
    if (dragged_element.classList.contains("parsons-l-or-block")
        && !dragged_element_or_block
        && drop_container.classList.contains("parsons-l-source")) {
        dragged_element = createOrBlock(dragged_element);
    }

    // Drop in or-blocks
    if (dragged_element_or_block) {
        drop_container = dragged_element_or_block.children[1];
        const placeholder = drop_container.querySelector(".placeholder");
        if (placeholder) {
            drop_container.insertBefore(dragged_element, placeholder);
            placeholder.remove();
            return;
        }
    }

    // Drop not in or-blocks
    const placeholder = drop_container.querySelector(".placeholder");
    if (placeholder) {
        drop_container.insertBefore(dragged_element, placeholder);
        placeholder.remove();
        return;
    }
}

function createOrBlock(dragged_element) {
    // Get or-block id
    let dragged_element_or_block_id = dragged_element.dataset.orBlockId;

    // Create the outer div
    const outerDiv = document.createElement("div");
    outerDiv.id = dragged_element_or_block_id;
    outerDiv.classList.add("text-bg-secondary", "rounded", "parsons-l-or-blocks");

    // Create the inner span
    const innerSpan = document.createElement("span");
    innerSpan.classList.add("parsons-l-or-symbol", "text-black");
    innerSpan.textContent = "or{";

    // Create the inner div
    const innerDiv = document.createElement("div");
    innerDiv.classList.add("flex-fill");
    innerDiv.append(dragged_element);

    // Append the inner span and inner div to the outer div
    outerDiv.appendChild(innerSpan);
    outerDiv.appendChild(innerDiv);

    dragged_element = outerDiv;
    return dragged_element;
}
