/*
  Utility Functions
*/

/* transform a string for displaying in a <pre> tag,
   such that visually similar multi-line strings are distinguishable */
function render_printable(str) {
  const NUL_code = "\u2370";
  const TAB = "\u27F6";
  const LF = "\u21B2\n";

  var printable = "";

  /* TODO: add support for encodings other than ASCII for the input string */
  for (var i = 0; i < str.length; ++i) {
    const c = str.codePointAt(i);
    if (c >= 0x20 && c < 0xFF)
      printable += String.fromCodePoint(c);
    else if (c == 0x09)
      printable += TAB;
    else if (c == 0x0A)
      printable += LF;
    else
      printable += NUL_code;
  }

  return printable;
};


/*
  Class ICodeTest

  Represents a series of commands that should involve the contents of the
  associated ICode element, as well as subsequent checks against the output of
  those commands.
*/

class ICodeTest {

  states = Object.freeze({
    IDLE: "IDLE",
    PRECMDS: "PRECMDS",
    CMDS: "CMDS",
    POSTCMDS: "POSTCMDS"
  });

  constructor(idx, elt, icode) {
    /* read test parameters from the DOM */
    Object.assign(this, JSON.parse(atob(elt.dataset.params)));

    const test_id = `${icode.prefix_id}-test-${idx}`;

    this.btn_coll_elt = document.getElementById(`${test_id}-btn`);
    this.body_elt = document.getElementById(`${test_id}-feedback`);
    const coll_elt = document.getElementById(`${test_id}`);
    this.collapse = new bootstrap.Collapse(coll_elt, { toggle: false });

    this.icode = icode;
    this.state = this.states.IDLE;
    this.result = null;

    for (var check of this.checks)
      if (check.type == "regex")
        check.re = new RegExp(check.content);

    /* each step of the test is either a command that should be run on the VM
       (represented as a string) or a function. */
    this.steps = [
      () => { this.state = this.states.PRECMDS; this.run(); },
      ...this.precmds,
      () => { this.state = this.states.CMDS; this.run(); },
      ...this.cmds,
      () => { this.do_checks(); },
      () => { this.state = this.states.POSTCMDS; this.run(); },
      ...this.postcmds,
      () => { this.render(); this.icode.run(); }
    ]
  }

  init() {
    /* clear any visually displayed results */
    this.body_elt.textContent = "";
    this.btn_coll_elt.disabled = true;
    this.btn_coll_elt.classList.remove("ic-c-test__hdr--pass");
    this.btn_coll_elt.classList.remove("ic-c-test__hdr--error");

    /* reset the state */
    this.state = this.states.IDLE;
    this.result = null;

    this.steps_it = this.steps[Symbol.iterator]();
    this.collapse.hide();
  }

  do_checks() {
    if (this.checks.length == 0 || this.result === false) {
      if (this.result !== false)
        this.result = true;

      this.run();
      return;
    }

    var checks_complete = 0;

    for (let i = 0; i < this.checks.length; i++) {
      /* add a div to visually represent the check - must be added in advance to
         ensure the ordering is consistent */
      const check = this.checks[i];
      const check_elt = document.createElement('div');
      this.body_elt.appendChild(check_elt);

      /* set up a callback, as the output may reside in a file in the VM,
         requiring an asynchronous call to access */
      var on_data = data => {
        var res = null;

        /* convert to string (if not already) */
        if (ArrayBuffer.isView(data))
          data = new TextDecoder().decode(data);

        if (data == null)
          res = false;
        else if (check.type == "exact")
          res = data == check.content;
        else if (check.type == "regex")
          res = check.re.test(data);

        if (res === false)
          this.result = false;

        this.render_check(check_elt, check, data, res);

        /* ensure run() is called after all checks are completed */
        checks_complete += 1;
        if (checks_complete == this.checks.length) {
          if (this.result !== false)
            this.result = true;
          this.run();
        }
      };

      if (check.output == "stdout" || check.output == "stderr")
        on_data(this.prev_output[check.output]);
      else if (check.output == "file")
        LupBookVM.session_download(this.icode.session, check.filename, on_data);
    }

    /* at this point some files may still need to be retrieved from the VM,
       so run() can't be called here even though all checks have been handled. */
  }

  render_check(dest_elt, check, output_data, result) {
    /* update the overall progress bar for the parent ICode element */
    this.icode.on_progress(result === false ? "error" : "success");

    dest_elt.classList.add("ic-l-check");

    /* describe what is being checked */
    const output_desc = check.output == "file" ? `file ${check.filename}` :
      `${check.output}`;

    var expect_elt;
    if (check.type == "regex") {
        expect_elt = document.createElement("span");
        expect_elt.classList.add("ic-l-code-inline");
        expect_elt.textContent = check.content;
    } else if (check.type == "exact") {
        expect_elt = document.createElement("pre");
        expect_elt.classList.add("ic-l-code");
        expect_elt.textContent = render_printable(check.content);
    }

    /* describe the result of the check */
    if (result === true) {
      dest_elt.classList.add("ic-l-check-pass");
      if (check.type == "regex") {
        dest_elt.append(`Output ${output_desc} matches regular expression`);
        dest_elt.append(expect_elt);
      } else if (check.type == "exact") {
        dest_elt.append(`Output ${output_desc} matches`);
        dest_elt.append(expect_elt);
      }
      return;
    }

    dest_elt.classList.add("ic-l-check-error");

    /* there was an error result, describe the error */
    if (output_data == null) {
      dest_elt.append(`Output ${output_desc} does not exist.`);
      return;
    }

    var output_elt = document.createElement("pre");
    output_elt.classList.add("ic-l-code");
    output_elt.textContent = render_printable(output_data);

    if (check.type == "regex") {
      dest_elt.append(`Output ${output_desc} does not match regular expression`);
      dest_elt.append(expect_elt);
      dest_elt.append(output_elt);
    } else {
      dest_elt.append(`Output ${output_desc} differs from expected value`);
      const cont_elt = document.createElement("div");
      const row_elt = document.createElement("div");
      const left_elt = document.createElement("div");
      const right_elt = document.createElement("div");
      cont_elt.classList.add("container");
      row_elt.classList.add("row");
      left_elt.classList.add("col-6");
      right_elt.classList.add("col-6");
      cont_elt.append(row_elt);
      row_elt.append(left_elt, right_elt);

      left_elt.append("Program output:", output_elt);
      right_elt.append("Expected value:", expect_elt);

      dest_elt.append(cont_elt);
    }
  }

  render() {
    /* update the overall progress bar for the parent ICode element */
    this.icode.on_progress(this.result === false ? "error" : "success");

    /* create a check to represent the overall result of the test, and add it
       before all other rendered checks (if any) */
    const result_elt = document.createElement('div');
    result_elt.classList.add("ic-l-check");
    this.body_elt.prepend(result_elt);

    /* refer to the test by the command it runs */
    const hdr = document.createElement('h5');
    const cmd = document.createElement('span');
    cmd.classList.add("ic-l-code-inline");
    cmd.append(this.cmds.at(-1));
    hdr.append("Command", cmd);
    result_elt.append(hdr);

    /* describe the overall result */
    if (this.result === true) {
      this.btn_coll_elt.classList.add("ic-c-test__hdr--pass");
      result_elt.classList.add("ic-l-check-pass");
      hdr.append("succeeded.");

      if (this.checks.length == 0 && this.prev_output.stdout.trim().length) {
        /* show the output only if there are no additional checks
           (avoid duplicate rendering of the same output) */
        const output = document.createElement('pre');
        output.classList.add("ic-l-code");
        output.append(render_printable(this.prev_output.stdout));
        result_elt.append(output);
      }
    } else if (this.result === false) {
      this.btn_coll_elt.classList.add("ic-c-test__hdr--error");

      if (this.prev_output.return_code == 0) {
        result_elt.classList.add("ic-l-check-warning");
        hdr.append("succeeded, but some checks failed.");
      } else {
        hdr.append(`failed with exit code ${this.prev_output.return_code}.`);
        result_elt.classList.add("ic-l-check-error");

        const output = document.createElement('pre');
        output.classList.add("ic-l-code");
        output.append(render_printable(this.prev_output.stderr));
        result_elt.append(output);
      }
    }

    this.btn_coll_elt.disabled = false;
  }

  vm_cmd(cmd) {
    if (this.result === false && this.state !== this.states.POSTCMDS) {
      this.run();
      return;
    }

    LupBookVM.session_exec(this.icode.session, cmd,
      result => { this.on_cmd_complete(result) }, null, this.icode.timeout);
  }

  on_cmd_complete(output) {
    this.icode.on_progress();

    if (this.state === this.states.POSTCMDS) {
      this.run();
      return;
    }

    this.prev_output = output;

    if (output.return_code != 0)
      this.result = false;

    this.run();
  }

  run() {
    var cur_step = this.steps_it.next();

    if (cur_step.done)
      return;

    if (typeof cur_step.value === "string")
      this.vm_cmd(cur_step.value);
    else if (typeof cur_step.value === "function")
      cur_step.value();
  }
}


class ICode {
  constructor(elt) {
    this.id = elt.id;
    this.prefix_id = `icode-${this.id}`;

    this.session = LupBookVM.session_open();
    this.src_files = {};

    /* initialize tests */

    this.progress_elt = document.getElementById(`${this.prefix_id}-feedback-progress`);

    /* while the tests are still running there are increments for all commands,
       to maximize visual indication that progress is occurring. */
    this.progress_divisor = 0;
    /* when the test is complete, the results are summarized by colored segments
       within the progress bar. This display has as many increments as the
       number of tests plus the number of checks across all tests, so that it is
       visually consistent with the colored feedback provided in the collapse */
    this.results_divisor = 0;
    this.tests = [];
    for (const [idx, test_elt] of Array.from(elt.getElementsByClassName("icode-test")).entries()) {
      var test = new ICodeTest(idx, test_elt, this);
      this.tests.push(test);
      /* It is critical that the test call on_progress() during run() as many
         times as are accounted for here in progress_divisor.
         Whenever such a call should contribute to results_divisor, it must pass
         a value for the result argument. */
      this.progress_divisor += 1 + test.precmds.length + test.cmds.length +
        test.checks.length + test.postcmds.length;
      this.results_divisor += 1 + test.checks.length;
    }

    /* initialize source file editors */
    for (var inp_elt of elt.getElementsByClassName("icode-srcfile")) {
      const filename = inp_elt.dataset.filename;
      const src_file = {};

      const cm_args = {
        lineNumbers: true,
        matchBrackets: true,
        indentUnit: 4,
        mode: "text/x-csrc",
        extraKeys: {
          Tab: cm => cm.execCommand("indentMore"),
          "Shift-Tab": cm => cm.execCommand("indentLess"),
        }
      };

      src_file.readonly = false;
      if (typeof inp_elt.dataset.readonly !== "undefined") {
        if (inp_elt.dataset.readonly == "data-readonly") {
          src_file.readonly = true;
          cm_args["readOnly"] = "nocursor";
          cm_args["theme"] = "default readonly";
        } else {
          src_file.readonly = JSON.parse(atob(inp_elt.dataset.readonly));
        }
      }

      const cm = CodeMirror.fromTextArea(inp_elt, cm_args);
      src_file.cm = cm;

      src_file.getData = () => { return cm.getValue(); };
      src_file.isClean = () => { return cm.isClean(); };
      src_file.markClean = () => { return cm.markClean(); };

      if (src_file.readonly && src_file.readonly !== true) {
        for (let ro_range of src_file.readonly) {
          cm.markText({line: ro_range[0] - 2}, {line: ro_range[1], ch: 0},
            {
              readOnly: true,
              inclusiveLeft: ro_range[0] == 1,
              inclusiveRight: ro_range[1] == cm.lineCount()
            });
          cm.eachLine(ro_range[0] - 1, ro_range[1], line => {
            cm.addLineClass(line, "background", "bg-body-secondary");
          });
        }
      }

      const tab = elt.querySelector(
        `[data-bs-target="#${inp_elt.parentElement.id}"]`);

      if (tab)
        tab.addEventListener("shown.bs.tab", evt => { cm.refresh(); });
      this.src_files[filename] = src_file;
    }

    this.submit_btn = document.getElementById(`${this.prefix_id}-submit`);
    this.submit_btn.onclick = evt => { this.on_run_clicked(evt) };

    this.feedback_elt = document.getElementById(`${this.prefix_id}-feedback`);
    this.feedback_coll = new bootstrap.Collapse(this.feedback_elt, {
      toggle: false
    });
  }

  /* transfer the files associated with the interactive code element to the VM */
  upload(force = false) {
    var dirty = false;

    for (const filename in this.src_files) {
      const src_file = this.src_files[filename];

      /* don't upload unless the file has been modified */
      if (!force && src_file.isClean())
        continue;

      dirty = true;
      LupBookVM.session_upload(this.session, filename, src_file.getData());

      src_file.markClean();
    }

    return dirty;
  }

  on_run_clicked(evt) {
    this.init();
    this.run();
  }

  on_run_complete() {
    this.submit_btn.disabled = false;
    for (var test of this.tests) {
      if (test.result !== false)
        continue;

      /* A test resulted in an error; expand the feedback section, and after the
         animation additionally expand the details of the first error */
      if (this.feedback_coll._isShown()) {
        test.collapse.show();
      } else {
        this.feedback_elt.addEventListener("shown.bs.collapse", () => {
          test.collapse.show();
        }, { once: true });
        this.feedback_coll.show();
      }
      break;
    }

    /* reset the progress bar and rebuild its contents based on the test results */
    this.progress_elt.textContent = "";
    const bar_success_elt = document.createElement("div");
    const bar_error_elt = document.createElement("div");
    bar_success_elt.classList.add("progress-bar");
    bar_success_elt.classList.add("bg-success");
    bar_error_elt.classList.add("progress-bar");
    bar_error_elt.classList.add("bg-danger");

    bar_success_elt.style.width =
      `${(this.progress_results.success / this.results_divisor) * 100}%`;
    bar_error_elt.style.width =
      `${(this.progress_results.error / this.results_divisor) * 100}%`;

    this.progress_elt.append(bar_success_elt, bar_error_elt);
  }

  on_progress(result_type) {
    this.progress_dividend += 1;
    if (typeof result_type !== "undefined")
      this.progress_results[result_type] += 1;
    this.progress_elt.childNodes[0].style.width =
      `${(this.progress_dividend / this.progress_divisor) * 100}%`;
  }

  init() {
    this.submit_btn.disabled = true;
    this.upload();

    /* reset feedback */
    for (var test of this.tests)
      test.init();

    /* reset progress tracking, progress bar */
    this.progress_dividend = 0;
    this.progress_results = {
      success: 0,
      error: 0
    };
    this.progress_elt.textContent = "";
    const bar_elt = document.createElement("div");
    bar_elt.classList.add("progress-bar");
    bar_elt.classList.add("progress-bar-striped");
    bar_elt.classList.add("progress-bar-animated");
    bar_elt.setAttribute("role", "progress");
    this.progress_elt.append(bar_elt);
    /* a positive initial value shows the animated bar, providing a visual
       indication that the test is running */
    bar_elt.style.width = "1%";
    this.progress_elt.classList.remove("d-none");

    /* track which test is currently being run */
    this.test_it = this.tests[Symbol.iterator]();
    this.test_prev = null;
  }

  run() {
    if (this.test_prev && this.test_prev.result === false && this.test_prev.fatal) {
      /* skip remaining tests */
      this.on_run_complete();
      return;
    }

    var next = this.test_it.next();
    if (next.done) {
      this.on_run_complete();
    } else {
      this.test_prev = next.value;
      next.value.run();
    }
  }
}


/*
 * Initialization of icode activities after DOM loading
 */
window.addEventListener('DOMContentLoaded', () => {

  /*
   * Set up terminal once
   */
  /* Creation */
  const term = new Terminal({
    scrollback: 10000,
    fontSize: 15,
    cursorBlink: true
  });
  const fitAddon = new FitAddon.FitAddon();
  term.loadAddon(fitAddon);

  /* Attach to container */
  const term_el = document.getElementById("lbvm-terminal");
  term.open(term_el);
  fitAddon.fit();

  /* Automatically resize when modal is shown (otherwise there's a weird bug
   * where the scrollbar doesn't appear when the modal is shown for the first
   * time because output was added to a non-visible terminal) */
  const term_mod_el = document.getElementById('lbvm-terminal-modal')
  term_mod_el.addEventListener('shown.bs.modal', () => { fitAddon.fit() });

  /* Automatically resize if the window gets resized */
  window.onresize = () => { fitAddon.fit(); };

  /* Bind terminal input to VM */
  term.onKey(ev => {
    LupBookVM.on_console_queue(ev.key.charCodeAt(0));
  });

  /*
   * icode activites
   */
  let icodes = [];
  for (const e of document.getElementsByClassName("icode-container")) {
    icodes.push(new ICode(e));
  }

  /*
   * Virtual Machine
   */
  term.write("Loading virtual machine...\r\n");
  LupBookVM.start({
    on_init: () => {
      /* Once the VM is up and ready, upload the skeleton code for each
       * activity. XXX: this should be done dynamically the first done an icode
       * is run (with an internal state we can maintain). This callback could be
       * used to enable the Submit buttons instead? */
      icodes.forEach(icode => icode.upload(true));
    },
    on_error: () => { console.log("VM Error!"); },
    console_debug_write: c => { term.write(c); }
  });
});
