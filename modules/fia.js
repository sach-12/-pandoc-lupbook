var fias = {};

class FIA {

    constructor(elt) {
        this.id = elt.id;

        this.submit_btn = elt.getElementsByClassName("fia-c-button__submit")[0];
        this.reset_btn = elt.getElementsByClassName("fia-c-button__reset")[0];
        this.feedback_btn = elt.getElementsByClassName("fia-c-feedback__toggle")[0];

        this.feedback_elt = elt.getElementsByClassName("fia-l-feedback")[0];
        this.feedback_coll = new bootstrap.Collapse(this.feedback_elt, {
            toggle: false
        });

        this.all_pass_feedback = elt.getElementsByClassName("fia-l-check-pass")[0];
        this.each_error_feedback = Array.from(elt.getElementsByClassName("fia-l-check")).slice(1);

        this.inputs = elt.getElementsByClassName("fia-l-input");

        Array.from(this.inputs).forEach((input) => {
            input.addEventListener('click', () => {
                if (this.submit_btn.disabled) {
                    // Collapse feedback
                    this.feedback_btn.classList.add("d-none");
                    this.feedback_coll.hide();

                    this.all_pass_feedback.classList.add("d-none");
                    Array.from(this.each_error_feedback).forEach((error_feedback) => {
                        error_feedback.classList.add("d-none")
                    })

                    // Reset submit button
                    this.submit_btn.style.backgroundColor = "#0B5ED7";
                    this.submit_btn.disabled = false;
                    this.reset_btn.disabled = false;
                }
            });
        });

        this.submit_btn.addEventListener('click', () => {
            this.submit_btn.disabled = true;

            let allInputsMatchAnswer = true;
            for (let i = 0; i < this.inputs.length; i++) {
                let input = this.inputs[i];
                let feedback = this.each_error_feedback[i];

                let value = input.value;
                let answer = input.dataset.answer;
                let regex = new RegExp(answer);

                let ignoreCase = input.dataset.ignoreCase === 'true';
                if (ignoreCase) {
                    regex = new RegExp(answer, "i")
                }

                if (!regex.test(value)) {
                    allInputsMatchAnswer = false;
                    feedback.classList.toggle("d-none", false);
                }
            }

            this.all_pass_feedback.classList.toggle("d-none", !allInputsMatchAnswer);

            allInputsMatchAnswer ?
                this.submit_btn.style.backgroundColor = "#198754" :
                this.submit_btn.style.backgroundColor = "#e35d6a";

            /* Uncollapse feedback */
            this.feedback_btn.classList.remove("d-none");
            this.feedback_coll.show();
        });

        this.reset_btn.addEventListener('click', () => {
            // Collapse feedback
            this.feedback_btn.classList.add("d-none");
            this.feedback_coll.hide();

            // Reset inputs
            Array.from(this.inputs).forEach((input) => {
                input.value = "";
            });

            this.all_pass_feedback.classList.add("d-none");
            Array.from(this.each_error_feedback).forEach((error_feedback) => {
                error_feedback.classList.add("d-none")
            })

            // Reset submit button
            this.submit_btn.style.backgroundColor = "#0B5ED7";
            this.submit_btn.disabled = false;
            this.reset_btn.disabled = false;
        });
    }
}


window.addEventListener('DOMContentLoaded', (evt) => {
    for (const fia_elt of document.getElementsByClassName("fia-l-container")) {
        fias[fia_elt.id] = new FIA(fia_elt);
    }
});
