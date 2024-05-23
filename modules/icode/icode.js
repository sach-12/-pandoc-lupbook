/*
 * Copyright (c) 2021 LupLab
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/*
 * Helper functions
 */

/* Transform a string for displaying in a <pre> tag, such that visually similar
 * multi-line strings are distinguishable */
function strRenderPrintable(str) {
  const NUL_CODE = "\u2370";
  const TAB_CODE = "\u27F6";
  const NL_CODE = "\u21B2\n";

  let printable = "";

  /* TODO: add support for encodings other than ASCII for the input string */
  for (let i = 0; i < str.length; ++i) {
    const c = str.codePointAt(i);

    /* Show printable ASCII */
    if (c >= 0x20 && c < 0x7F)
      printable += String.fromCodePoint(c);

    /* Tabs and newlines */
    else if (c === 0x9)
      printable += TAB_CODE;
    else if (c === 0xA)
      printable += NL_CODE;

    /* Unprintable characters */
    else
      printable += NUL_CODE;
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
  /* Class members */
  states = Object.freeze({
    IDLE: "IDLE",
    PRECMDS: "PRECMDS",
    CMDS: "CMDS",
    POSTCMDS: "POSTCMDS"
  });

  state = this.states.IDLE;
  icode;

  /* Class constructor */
  constructor(idx, elt, icode) {
    /* Read array of test objects from the DOM and transform them into object
     * attributes. */
    Object.assign(this, JSON.parse(atob(elt.dataset.params)));

    const testID = `${icode.prefixID}-test-${idx}`;

    this.feedbackDivBtn = document.getElementById(`${testID}-btn`);
    this.feedbackDivBody = document.getElementById(`${testID}-feedback`);
    const feedbackDiv = document.getElementById(`${testID}`);
    this.feedbackDivCollapse = new bootstrap.Collapse(
      feedbackDiv, { toggle: false });

    this.icode = icode;

    /* XXX: this shouldn't be necessary but Firefox somehow removes the
     * disabled attributes for some accordions */
    this.feedbackDivBtn.disabled = true;

    this.checks.forEach((check) => {
      if (check.type == "regex")
        check.re = new RegExp(check.content);
    });

    /* Each step of the test is either a command that should be run on the VM
     * (represented as a string) or a function. */
    this.steps = [
      () => { this.state = this.states.PRECMDS; this.runNextStep(); },
      ...this.precmds,
      () => { this.state = this.states.CMDS; this.runNextStep(); },
      ...this.cmds,
      () => { this.runChecks(); },
      () => { this.state = this.states.POSTCMDS; this.runNextStep(); },
      ...this.postcmds,
      () => { this.completeTest(); this.icode.runNextTest(); }
    ]

  }

  resetTest() {
    /* Clear any visually displayed results */
    this.feedbackDivBody.textContent = "";
    this.feedbackDivBtn.disabled = true;
    this.feedbackDivBtn.firstElementChild.classList
      .remove("bi-check-circle-fill", "text-success");
    this.feedbackDivBtn.firstElementChild.classList
      .remove("bi-x-circle-fill", "text-danger");
    this.feedbackDivBtn.firstElementChild.classList
      .add("bi-dash-circle-fill", "text-secondary");
    this.feedbackDivCollapse.hide();
  }

  /* Called prior to running the test's various steps */
  initTest() {
    this.resetTest();

    /* Reset the state */
    this.state = this.states.IDLE;
    this.stepRunFailed = false;
    this.stepCheckFailed = false;

    this.stepIterator = this.steps[Symbol.iterator]();
  }

  testFailed() {
    return (this.stepRunFailed || this.stepCheckFailed);
  }

  runNextStep() {
    const stepCurrent = this.stepIterator.next();
    if (stepCurrent.done)
      return;

    /* A step can be either a string or a function */
    if (typeof stepCurrent.value === "string")
      /* Run given string command in the VM */
      this.runCmdVM(stepCurrent.value);
    else if (typeof stepCurrent.value === "function")
      /* Call given function */
      stepCurrent.value();
  }

  runChecks() {
    /* Skip the checks if there are none or if a previous command failed to run */
    if (this.checks.length == 0 || this.stepRunFailed) {
      this.runNextStep();
      return;
    }

    let checkCount = 0;

    this.checks.forEach((check, idx) => {
      /* Add a div to visually represent the check - must be added in advance to
       * ensure the ordering between checks is consistent */
      const checkElt = document.createElement('div');
      this.feedbackDivBody.appendChild(checkElt);

      /* Set up a callback, as the output may reside in a file in the VM,
       * requiring an asynchronous call to access */
      let onData = (data) => {
        let checkFailed = false;

        /* Convert data to string if necessary */
        if (ArrayBuffer.isView(data))
          data = new TextDecoder().decode(data);

        if (data == null)
          checkFailed = true;
        else if (check.type == "exact")
          checkFailed = data != check.content;
        else if (check.type == "regex")
          checkFailed = !check.re.test(data);

        if (checkFailed)
          this.stepCheckFailed = true;

        this.completeCheck(checkElt, check, data, checkFailed);

        /* Ensure runNextStep() is called after *all checks* are completed */
        if (++checkCount == this.checks.length) {
          this.runNextStep();
        }
      };

      if (check.output == "stdout" || check.output == "stderr")
        onData(this.stepExecInfo[check.output]);
      else if (check.output == "file")
        LupBookVM.session_download(this.icode.sessionVM, check.filename, onData);
    });
  }

  completeCheck(checkElt, checkObj, checkData, checkFailed) {
    checkElt.classList.add("ic-l-check");

    /* Describe what is being checked between file or terminal streams */
    const output_desc = checkObj.output == "file" ?
      `file ${checkObj.filename}` : `${checkObj.output}`;

    /* Build expected element */
    let expectElt;
    if (checkObj.type == "regex") {
        expectElt = document.createElement("span");
        expectElt.classList.add("ic-l-code-inline");
        expectElt.textContent = checkObj.content;
    } else if (checkObj.type == "exact") {
        expectElt = document.createElement("pre");
        expectElt.classList.add("ic-l-code");
        expectElt.textContent = strRenderPrintable(checkObj.content);
    }

    /* Check was a success */
    if (!checkFailed) {
      checkElt.classList.add("ic-l-check-pass");
      if (checkObj.type == "regex") {
        checkElt.append(`Output ${output_desc} matches regular expression`);
        checkElt.append(expectElt);
      } else if (checkObj.type == "exact") {
        checkElt.append(`Output ${output_desc} matches`);
        checkElt.append(expectElt);
      }
      return;
    }

    /* Check was an failure */
    checkElt.classList.add("ic-l-check-error");

    if (checkData == null) {
      checkElt.append(`Output ${output_desc} does not exist.`);
      return;
    }

    const outputElt = document.createElement("pre");
    outputElt.classList.add("ic-l-code");
    outputElt.textContent = strRenderPrintable(checkData);

    if (checkObj.type == "regex") {
      checkElt.append(`Output ${output_desc} does not match regular expression`);
      checkElt.append(expectElt);
      checkElt.append(outputElt);
    } else {
      checkElt.append(`Output ${output_desc} differs from expected value`);
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

      left_elt.append("Program output:", outputElt);
      right_elt.append("Expected value:", expectElt);

      checkElt.append(cont_elt);
    }
  }

  completeTest() {
    /* Update the overall progress bar for the parent ICode element */
    this.icode.completeTest(this.testFailed());

    /* Create a check to represent the overall result of the test, and add it
     * before all other rendered checks (if any) */
    const resultElt = document.createElement('div');
    resultElt.classList.add("ic-l-check");
    this.feedbackDivBody.prepend(resultElt);

    /* Refer to the test by the last command it ran */
    const hdr = document.createElement('h5');
    const cmd = document.createElement('span');
    cmd.classList.add("ic-l-code-inline");
    cmd.append(this.cmds.at(-1));
    hdr.append("Command", cmd);
    resultElt.append(hdr);

    this.feedbackDivBtn.firstElementChild.classList
      .remove("bi-dash-circle-fill", "text-secondary");

    /* Describe the overall result */
    if (this.stepRunFailed) {
      /* Command failed with an erroneous exit code */
      this.feedbackDivBtn.firstElementChild.classList
        .add("bi-x-circle-fill", "text-danger");

      hdr.append(`failed with exit code ${this.stepExecInfo.return_code}.`);
      resultElt.classList.add("ic-l-check-error");

      const output = document.createElement('pre');
      output.classList.add("ic-l-code");
      output.append(strRenderPrintable(this.stepExecInfo.stderr));
      resultElt.append(output);

    } else if (this.stepCheckFailed) {
      /* Check failed with incorrect data */
      this.feedbackDivBtn.firstElementChild.classList
        .add("bi-x-circle-fill", "text-danger");

      resultElt.classList.add("ic-l-check-warning");
      hdr.append("succeeded, but some checks failed.");
    } else {
      /* Success! */
      this.feedbackDivBtn.firstElementChild.classList
        .add("bi-check-circle-fill", "text-success");
      resultElt.classList.add("ic-l-check-pass");
      hdr.append("succeeded.");

      if (this.checks.length == 0 && this.stepExecInfo.stdout.trim().length) {
        /* show the output only if there are no additional checks
           (avoid duplicate rendering of the same output) */
        const output = document.createElement('pre');
        output.classList.add("ic-l-code");
        output.append(strRenderPrintable(this.stepExecInfo.stdout));
        resultElt.append(output);
      }
    }

    /* User is allowed to submit again */
    this.feedbackDivBtn.disabled = false;
  }

  runCmdVM(cmd) {
    /* Skip current step if a previous one failed, unless it's a post command */
    if (this.testFailed() && this.state !== this.states.POSTCMDS) {
      this.runNextStep();
      return;
    }

    LupBookVM.session_exec(
      this.icode.sessionVM,
      cmd,
      (execInfo) => {
        /* Ignore completion info for post commands */
        if (this.state === this.states.POSTCMDS) {
          this.runNextStep();
          return;
        }

        this.stepExecInfo = execInfo;

        /* TODO: valid return code should be customizable */
        if (execInfo.return_code != 0)
          this.stepRunFailed = true;

        this.runNextStep();
      },
      null,
      this.icode.timeout);
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

  firstUpload = true;

  feedbackProgress;
  feedbackProgressBars;
  submitBtn;
  resetBtn;
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
      const tab = document.getElementById(srcFileElt.dataset.tab);
      if (tab)
        tab.addEventListener("shown.bs.tab", () => cm.refresh());

      /* Callbacks to editor used in other methods */
      const filename = srcFileElt.dataset.filename;
      this.srcFiles[filename] = {
        docInit: cm.getDoc().copy(),
        resetDoc: function() { cm.swapDoc(this.docInit.copy()) },
        getData: () => cm.getValue(),
        isClean: () => cm.isClean(),
        markClean: () => cm.markClean(),
      }
    });

    /* Button events */
    this.submitBtn = document.getElementById(`${this.prefixID}-submit`);
    this.submitBtn.onclick = () => this.submitActivity();

    this.resetBtn = document.getElementById(`${this.prefixID}-reset`);
    this.resetBtn.onclick = () => this.resetActivity();

    this.feedbackDiv = document.getElementById(`${this.prefixID}-feedback`);
    this.feedbackDivCollapse = new bootstrap.Collapse(
      this.feedbackDiv, { toggle: false });
  }

  /* Transfer files associated with icode activity to the VM */
  uploadSrcFiles() {
    Object.keys(this.srcFiles).forEach((filename) => {
      const srcFile = this.srcFiles[filename];

      /* Skip uploading if file hasn't been modified since the last submit and
       * it's not the first upload */
      if (!this.firstUpload && srcFile.isClean())
        return;

      LupBookVM.session_upload(this.sessionVM, filename, srcFile.getData());

      srcFile.markClean();
    });

    /* From now on, the VM has a version of every file for this activity. We can
     * rely on whether or not files have been modified, via CodeMirror */
    this.firstUpload = false;
  }

  /* Event handler for reset button */
  resetActivity() {
    Object.keys(this.srcFiles).forEach((filename) => {
      const srcFile = this.srcFiles[filename];
      srcFile.resetDoc();
    });
  }

  /* Event handler for submit button */
  submitActivity() {
    this.initActivity();
    this.runNextTest();
  }

  initActivity() {
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
    this.tests.forEach((test) => test.initTest());

    /* Track which test is currently being run */
    this.testIterator = this.tests[Symbol.iterator]();
    this.testCurrent = null;
  }

  runNextTest() {
    /* Stop running tests if a test marked as fatal failed */
    if (this.testCurrent
      && this.testCurrent.testFailed() && this.testCurrent.fatal) {
      this.completeActivity();
      return;
    }

    /* Compute current test index */
    this.fb_idx = this.testCurrent === null ? 0 : this.fb_idx + 1;

    let nextTest = this.testIterator.next();
    if (nextTest.done) {
      this.completeActivity();
    } else {
      /* Show ongoing test in progress bar */
      this.feedbackProgressBars[this.fb_idx].classList.remove("bg-light");
      this.feedbackProgressBars[this.fb_idx].classList.add(
        "progress-bar-striped", "progress-bar-animated");

      /* Run next test */
      this.testCurrent = nextTest.value;
      nextTest.value.runNextStep();
    }
  }

  /* Update progress from test result */
  completeTest(fail) {
    this.feedbackProgressBars[this.fb_idx].classList.remove(
      "progress-bar-striped", "progress-bar-animated");
    if (fail)
      this.feedbackProgressBars[this.fb_idx].classList.add("bg-danger");
    else
      this.feedbackProgressBars[this.fb_idx].classList.add("bg-success");
  }

  completeActivity() {
    /* Activity can now be resubmitted again */
    this.submitBtn.disabled = false;

    /* Jump to the feedback corresponding to the first failed test if any */
    for (const test of this.tests) {
      if (!test.testFailed())
        continue;

      if (this.feedbackDiv.classList.contains('show')) {
        /* Feedback div already open, open accordion of failed test */
        test.feedbackDivCollapse.show();
      } else {
        this.feedbackDiv.addEventListener("shown.bs.collapse", () => {
          /* Open accordion after feedback div has opened */
          test.feedbackDivCollapse.show();
        }, { once: true });
        /* Open feedback div */
        this.feedbackDivCollapse.show();
      }

      break;
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
  const termElt = document.getElementById("lbvm-terminal");
  term.open(termElt);
  fitAddon.fit();

  /* Automatically resize when modal is shown (otherwise there's a weird bug
   * where the scrollbar doesn't appear when the modal is shown for the first
   * time because output was added to a non-visible terminal) */
  const termModElt = document.getElementById('lbvm-terminal-modal')
  termModElt.addEventListener('shown.bs.modal', () => { fitAddon.fit() });

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
      /* Once the VM is up and ready, make icode activities submittable */
      icodes.forEach(icode => icode.submitBtn.disabled = false);
    },
    on_error: () => { console.log("VM Error!"); },
    console_debug_write: c => { term.write(c); }
  });
});
