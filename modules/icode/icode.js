/*
 * Copyright (c) 2021 LupLab
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/*
 * Helper functions
 */

/* Transform a string for displaying in a <pre> tag, such that visually similar
 * multi-line strings are distinguishable */
function str_render_printable(str) {
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
 * Class ICodeTest
 *
 * Represents a series of commands that should invoke the contents of the
 * associated ICode element, as well as subsequent checks against the output of
 * those commands.
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

    const test_id = `${icode.prefixID}-test-${idx}`;

    this.btn_coll_elt = document.getElementById(`${test_id}-btn`);
    this.body_elt = document.getElementById(`${test_id}-feedback`);
    const coll_elt = document.getElementById(`${test_id}`);
    this.collapse = new bootstrap.Collapse(coll_elt, { toggle: false });

    this.icode = icode;
    this.state = this.states.IDLE;
    this.result = null;

    this.btn_coll_elt.disabled = true;

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
      () => { this.render(); this.icode.activityRun(); }
    ]
  }

  init() {
    /* clear any visually displayed results */
    this.body_elt.textContent = "";
    this.btn_coll_elt.disabled = true;
    this.btn_coll_elt.firstElementChild.classList
      .remove("bi-check-circle-fill", "text-success");
    this.btn_coll_elt.firstElementChild.classList
      .remove("bi-x-circle-fill", "text-danger");
    this.btn_coll_elt.firstElementChild.classList
      .add("bi-dash-circle-fill", "text-secondary");

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
        LupBookVM.session_download(this.icode.sessionVM, check.filename, on_data);
    }

    /* at this point some files may still need to be retrieved from the VM,
       so run() can't be called here even though all checks have been handled. */
  }

  render_check(dest_elt, check, output_data, result) {
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
        expect_elt.textContent = str_render_printable(check.content);
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
    output_elt.textContent = str_render_printable(output_data);

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
    this.icode.activityProgress(this.result);

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

    this.btn_coll_elt.firstElementChild.classList
      .remove("bi-dash-circle-fill", "text-secondary");

    /* describe the overall result */
    if (this.result === true) {
      this.btn_coll_elt.firstElementChild.classList
        .add("bi-check-circle-fill", "text-success");
      result_elt.classList.add("ic-l-check-pass");
      hdr.append("succeeded.");

      if (this.checks.length == 0 && this.prev_output.stdout.trim().length) {
        /* show the output only if there are no additional checks
           (avoid duplicate rendering of the same output) */
        const output = document.createElement('pre');
        output.classList.add("ic-l-code");
        output.append(str_render_printable(this.prev_output.stdout));
        result_elt.append(output);
      }
    } else if (this.result === false) {
      this.btn_coll_elt.firstElementChild.classList
        .add("bi-x-circle-fill", "text-danger");

      if (this.prev_output.return_code == 0) {
        result_elt.classList.add("ic-l-check-warning");
        hdr.append("succeeded, but some checks failed.");
      } else {
        hdr.append(`failed with exit code ${this.prev_output.return_code}.`);
        result_elt.classList.add("ic-l-check-error");

        const output = document.createElement('pre');
        output.classList.add("ic-l-code");
        output.append(str_render_printable(this.prev_output.stderr));
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

    LupBookVM.session_exec(this.icode.sessionVM, cmd,
      result => { this.on_cmd_complete(result) }, null, this.icode.timeout);
  }

  on_cmd_complete(output) {
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

/*
 * Class ICode
 *
 * There is one object per icode activity.
 */
class ICode {
  /* Class members */
  prefixID;
  sessionVM;
  srcFiles = {};
  tests = [];

  feedbackProgress;
  feedbackProgressBars;
  submitBtn;
  feedbackDiv;
  feedbackDivCollapse;

  /* Class constructor */
  constructor(elt) {
    /*
     * Collect handles to various elements
     */
    this.prefixID = `icode-${elt.id}`;

    /* Progress bars */
    this.feedbackProgress = document.getElementById(`${this.prefixID}-feedback-progress`);
    this.feedbackProgressBars = Array.from(
      this.feedbackProgress.getElementsByClassName("progress-bar"));
    this.sessionVM = LupBookVM.session_open();

    const icodeTests = Array.from(elt.getElementsByClassName("icode-test"));
    const icodeSrcFiles = Array.from(elt.getElementsByClassName("icode-srcfile"));

    /*
     * Create test objects
     */
    icodeTests.forEach((test_elt, idx) => {
      const t = new ICodeTest(idx, test_elt, this);
      this.tests.push(t);
    });

    /*
     * Source file editor
     */
    /* Code mirror generic arguments */
    const cmBaseArgs = {
      lineNumbers: true,
      matchBrackets: true,
      indentUnit: 4,
      mode: "text/x-csrc", /* TODO: auto-detection of mode using mode/meta.js addon */
      extraKeys: {
        Tab: cm => cm.execCommand("indentMore"),
        "Shift-Tab": cm => cm.execCommand("indentLess"),
      }
    };

    icodeSrcFiles.forEach((srcFileElt) => {
      const cmArgs = {...cmBaseArgs};

      /* By default, files aren't readonly at all. Here, determine if a file is
       * entirely readonly (in which case, it needs to be specified when
       * creating the editor) or partially readonly (in which case, it needs to
       * be specified after creating the editor) */
      let readOnlyPartial = false;
      if (typeof srcFileElt.dataset.readonly !== "undefined") {
        if (srcFileElt.dataset.readonly == "data-readonly") {
          /* The whole file is readonly */
          cmArgs["readOnly"] = "nocursor";
          cmArgs["theme"] = "default readonly";
        } else {
          /* Source file is partially readonly*/
          readOnlyPartial = true;
        }
      }

      /* Create editor instance */
      const cm = CodeMirror.fromTextArea(srcFileElt, cmArgs);

      /* Specify ranges of readonly lines if any */
      if (readOnlyPartial) {
        const readOnlyRanges = JSON.parse(atob(srcFileElt.dataset.readonly));
        readOnlyRanges.forEach((range) => {
          cm.markText({line: range[0] - 2}, {line: range[1], ch: 0},
            {
              readOnly: true,
              inclusiveLeft: range[0] == 1,
              inclusiveRight: range[1] == cm.lineCount()
            });
          cm.eachLine(range[0] - 1, range[1], line => {
            cm.addLineClass(line, "background", "bg-body-secondary");
          });
        });
      }

      /* Refresh editor when corresponding tab is shown */
      const tab = elt.querySelector(
        `[data-bs-target="#${srcFileElt.parentElement.id}"]`);
      if (tab)
        tab.addEventListener("shown.bs.tab", () => cm.refresh());

      /* Callbacks to editor used in other methods */
      const filename = srcFileElt.dataset.filename;
      this.srcFiles[filename] = {
        getData: () => { return cm.getValue() },
        isClean: () => { return cm.isClean() },
        markClean: () => { return cm.markClean() },
      }
    });

    /* Button events */
    this.submitBtn = document.getElementById(`${this.prefixID}-submit`);
    this.submitBtn.onclick = () => this.submitActivity();

    this.feedbackDiv = document.getElementById(`${this.prefixID}-feedback`);
    this.feedbackDivCollapse = new bootstrap.Collapse(
      this.feedbackDiv, { toggle: false });
  }

  /* Transfer files associated with icode activity to the VM */
  uploadSrcFiles(force = false) {
    Object.keys(this.srcFiles).forEach((filename) => {
      const srcFile = this.srcFiles[filename];

      /* Skip uploading if file hasn't been modified since the last submit,
       * unless we're forcing it */
      if (!force && srcFile.isClean())
        return;

      LupBookVM.session_upload(this.sessionVM, filename, srcFile.getData());

      srcFile.markClean();
    });
  }

  /* Event handler for submit button */
  submitActivity() {
    this.activityInit();
    this.activityRun();
  }

  activityInit() {
    /* Prevent user from submitting again until all the tests have completed */
    this.submitBtn.disabled = true;

    /* Upload the files to the VM */
    this.uploadSrcFiles();

    /* Reset progress bar */
    this.feedbackProgressBars.forEach((item) => {
        item.classList.remove("bg-success", "bg-danger");
        item.classList.add("bg-light");
    });
    this.feedbackProgress.classList.remove("d-none");

    /* Init all the tests */
    this.tests.forEach((test) => test.init());

    /* Track which test is currently being run */
    this.testIterator = this.tests[Symbol.iterator]();
    this.testPrevious = null;
  }

  activityRun() {
    /* Stop running tests if a test marked as fatal failed */
    if (this.testPrevious
      && this.testPrevious.result === false && this.testPrevious.fatal) {
      this.activityCompleted();
      return;
    }

    /* Compute current test index */
    this.fb_idx = this.testPrevious === null ? 0 : this.fb_idx + 1;

    let nextTest = this.testIterator.next();
    if (nextTest.done) {
      this.activityCompleted();
    } else {
      /* Show ongoing test in progress bar */
      this.feedbackProgressBars[this.fb_idx].classList.remove("bg-light");
      this.feedbackProgressBars[this.fb_idx].classList.add(
        "progress-bar-striped", "progress-bar-animated");

      /* Run next test */
      this.testPrevious = nextTest.value;
      nextTest.value.run();
    }
  }

  activityCompleted() {
    /* Activity can now be resubmitted again */
    this.submitBtn.disabled = false;

    /* Jump to the feedback corresponding to the first failed test if any */
    this.tests.forEach((test) => {
      if (test.result !== false)
        return;

      if (this.feedbackDiv.classList.contains('show')) {
        /* Feedback div already open, open accordion of failed test */
        test.collapse.show();
      } else {
        this.feedbackDiv.addEventListener("shown.bs.collapse", () => {
          /* Open accordion after feedback div has opened */
          test.collapse.show();
        }, { once: true });
        /* Open feedback div */
        this.feedbackDivCollapse.show();
      }
    });
  }

  /* Update progress from test result */
  activityProgress(result) {
    this.feedbackProgressBars[this.fb_idx].classList.remove(
      "progress-bar-striped", "progress-bar-animated");
    if (result === true)
      this.feedbackProgressBars[this.fb_idx].classList.add("bg-success");
    else
      this.feedbackProgressBars[this.fb_idx].classList.add("bg-danger");
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
      icodes.forEach(icode => icode.uploadSrcFiles(true));
    },
    on_error: () => { console.log("VM Error!"); },
    console_debug_write: c => { term.write(c); }
  });
});
