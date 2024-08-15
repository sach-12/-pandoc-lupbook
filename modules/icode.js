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
    if (c >= 0x20 && c < 0x7f) printable += String.fromCodePoint(c);
    /* Tabs and newlines */
    else if (c === 0x9) printable += TAB_CODE;
    else if (c === 0xa) printable += NL_CODE;
    /* Unprintable characters */
    else printable += NUL_CODE;
  }

  return printable;
}

/*
 * Each class object represents a series of commands that should invoke the
 * contents of the associated IcodeActivity, as well as subsequent checks
 * against the output of those commands.
 */
class IcodeTest {
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

    const testId = `${icode.prefixId}-test-${idx}`;

    this.testingElt = elt;
    this.testingDivBtn = document.getElementById(`${testId}-btn`);
    this.testingDivBody = document.getElementById(`${testId}-testing`);
    this.testingDiv = document.getElementById(`${testId}`);
    this.testingDivCollapse = new bootstrap.Collapse(this.testingDiv, {
      toggle: false
    });

    this.icode = icode;

    /* XXX: this shouldn't be necessary but Firefox somehow removes the
     * disabled attributes for some accordions */
    this.testingDivBtn.disabled = true;

    this.checks.forEach((check) => {
      if (check.type == "regex") check.re = new RegExp(check.content);
    });

    /* Each step of the test is either a command that should be run on the VM
     * (represented as a string) or a function. */
    this.steps = [
      () => {
        this.state = this.states.PRECMDS;
        this.runNextStep();
      },
      ...this.precmds,
      () => {
        this.state = this.states.CMDS;
        this.runNextStep();
      },
      ...this.cmds,
      () => {
        this.runChecks();
      },
      () => {
        this.state = this.states.POSTCMDS;
        this.runNextStep();
      },
      ...this.postcmds,
      () => {
        this.completeTest();
        this.icode.runNextTest();
      }
    ];
  }

  resetTest() {
    /* Clear any visually displayed results */
    this.testingDivBody.textContent = "";
    this.testingDivBtn.disabled = true;
    this.testingDivBtn.firstElementChild.classList.remove(
      "bi-check-circle-fill",
      "text-success"
    );
    this.testingDivBtn.firstElementChild.classList.remove(
      "bi-x-circle-fill",
      "text-danger"
    );
    this.testingDivBtn.firstElementChild.classList.add(
      "bi-dash-circle-fill",
      "text-secondary"
    );
    this.testingDivCollapse.hide();
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
    return this.stepRunFailed || this.stepCheckFailed;
  }

  runNextStep() {
    const stepCurrent = this.stepIterator.next();
    if (stepCurrent.done) return;

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
      const checkElt = document.createElement("div");
      this.testingDivBody.appendChild(checkElt);

      /* Set up a callback, as the output may reside in a file in the VM,
       * requiring an asynchronous call to access */
      let onData = (data) => {
        let checkFailed = false;

        /* Convert data to string if necessary */
        if (ArrayBuffer.isView(data)) data = new TextDecoder().decode(data);

        if (data == null) checkFailed = true;
        else if (check.type == "exact") checkFailed = data != check.content;
        else if (check.type == "regex") checkFailed = !check.re.test(data);

        if (checkFailed) this.stepCheckFailed = true;

        this.completeCheck(checkElt, check, data, checkFailed);

        /* Ensure runNextStep() is called after *all checks* are completed */
        if (++checkCount == this.checks.length) {
          this.runNextStep();
        }
      };

      if (check.output == "stdout" || check.output == "stderr")
        onData(this.stepExecInfo[check.output]);
      else if (check.output == "file")
        LupBookVM.session_download(
          this.icode.sessionVM,
          check.filename,
          onData
        );
    });
  }

  completeCheck(checkElt, checkObj, checkData, checkFailed) {
    checkElt.classList.add("ic-l-check");

    /* Describe what is being checked between file or terminal streams */
    const outputDesc =
      checkObj.output == "file"
        ? `file ${checkObj.filename}`
        : `${checkObj.output}`;

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
        checkElt.append(`Output ${outputDesc} matches regular expression`);
        checkElt.append(expectElt);
      } else if (checkObj.type == "exact") {
        checkElt.append(`Output ${outputDesc} matches`);
        checkElt.append(expectElt);
      }
      return;
    }

    /* Check was an failure */
    checkElt.classList.add("ic-l-check-error");

    if (checkData == null) {
      checkElt.append(`Output ${outputDesc} does not exist.`);
      return;
    }

    const outputElt = document.createElement("pre");
    outputElt.classList.add("ic-l-code");
    outputElt.textContent = strRenderPrintable(checkData);

    if (checkObj.type == "regex") {
      checkElt.append(`Output ${outputDesc} does not match regular expression`);
      checkElt.append(expectElt);
      checkElt.append(outputElt);
    } else {
      checkElt.append(`Output ${outputDesc} differs from expected value`);
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
    /* Update the overall progress bar for the parent IcodeActivity */
    this.icode.completeTest(this.testFailed());

    /* Create a check to represent the overall result of the test, and add it
     * before all other rendered checks (if any) */
    const resultElt = document.createElement("div");
    resultElt.classList.add("ic-l-check");
    this.testingDivBody.prepend(resultElt);

    /* Refer to the test by the last command it ran */
    const hdr = document.createElement("h5");
    const cmd = document.createElement("span");
    cmd.classList.add("ic-l-code-inline");
    cmd.append(this.cmds.at(-1));
    hdr.append("Command", cmd);
    resultElt.append(hdr);

    this.testingDivBtn.firstElementChild.classList.remove(
      "bi-dash-circle-fill",
      "text-secondary"
    );

    /* Describe the overall result */
    if (this.stepRunFailed) {
      /* Command failed with an erroneous exit code */
      this.testingDivBtn.firstElementChild.classList.add(
        "bi-x-circle-fill",
        "text-danger"
      );

      hdr.append(`failed with exit code ${this.stepExecInfo.return_code}.`);
      resultElt.classList.add("ic-l-check-error");

      const output = document.createElement("pre");
      output.classList.add("ic-l-code");
      output.append(strRenderPrintable(this.stepExecInfo.stderr));
      resultElt.append(output);
    } else if (this.stepCheckFailed) {
      /* Check failed with incorrect data */
      this.testingDivBtn.firstElementChild.classList.add(
        "bi-x-circle-fill",
        "text-danger"
      );

      resultElt.classList.add("ic-l-check-warning");
      hdr.append("succeeded, but some checks failed.");
    } else {
      /* Success! */
      this.testingDivBtn.firstElementChild.classList.add(
        "bi-check-circle-fill",
        "text-success"
      );
      resultElt.classList.add("ic-l-check-pass");
      hdr.append("succeeded.");

      if (this.checks.length == 0 && this.stepExecInfo.stdout.trim().length) {
        /* show the output only if there are no additional checks
           (avoid duplicate rendering of the same output) */
        const output = document.createElement("pre");
        output.classList.add("ic-l-code");
        output.append(strRenderPrintable(this.stepExecInfo.stdout));
        resultElt.append(output);
      }
    }

    /* User is allowed to submit again */
    this.testingDivBtn.disabled = false;
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
        if (execInfo.return_code != 0) this.stepRunFailed = true;

        this.runNextStep();
      },
      null,
      this.icode.timeout
    );
  }
}

class IcodeActivity extends LupBookActivity {
  /* Class members */
  sessionVM;
  tests = [];
  srcFiles = {};
  forceUpload = true;
  testIdx;
  testCurrent;
  testIterator;

  /* Class constructor */
  constructor(elt) {
    super("icode", elt);

    this.sessionVM = LupBookVM.session_open();

    /*
     * Create test objects
     */
    const icodeTests = Array.from(elt.getElementsByClassName("icode-test"));
    icodeTests.forEach((testElt, idx) => {
      const t = new IcodeTest(idx, testElt, this);
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
      mode: "text/x-csrc" /* TODO: auto-detection of mode using mode/meta.js addon */,
      extraKeys: {
        Tab: (cm) => cm.execCommand("indentMore"),
        "Shift-Tab": (cm) => cm.execCommand("indentLess")
      }
    };

    const icodeSrcFiles = Array.from(
      elt.getElementsByClassName("icode-srcfile")
    );
    icodeSrcFiles.forEach((srcFileElt) => {
      const cmArgs = { ...cmBaseArgs };

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
          cm.markText(
            { line: range[0] - 2 },
            { line: range[1], ch: 0 },
            {
              readOnly: true,
              inclusiveLeft: range[0] == 1,
              inclusiveRight: range[1] == cm.lineCount()
            }
          );
          cm.eachLine(range[0] - 1, range[1], (line) => {
            cm.addLineClass(line, "background", "bg-body-secondary");
          });
        });
      }

      /* Refresh editor when tab is shown or when section is displayed */
      const tab = document.getElementById(srcFileElt.dataset.tab);
      if (tab) tab.addEventListener("shown.bs.tab", () => cm.refresh());
      this.sectionDiv.addEventListener("shown.lb.section", () => cm.refresh());

      /* Re-enable the submission upon changes */
      cm.on("changes", () =>
        this.submitStatus(LupBookActivity.SubmitStatus.ENABLED)
      );

      /* Callbacks to editor used in other methods */
      const filename = srcFileElt.dataset.filename;
      this.srcFiles[filename] = {
        docInit: cm.getDoc().copy(),
        resetDoc: function () {
          cm.swapDoc(this.docInit.copy());
        },
        getData: () => cm.getValue(),
        isClean: () => cm.isClean(),
        markClean: () => cm.markClean()
      };
    });
  }

  /* Transfer files associated with icode activity to the VM */
  uploadSrcFiles() {
    Object.keys(this.srcFiles).forEach((filename) => {
      const srcFile = this.srcFiles[filename];

      /* Skip uploading if file hasn't been modified since the last submit and
       * it's not the first upload */
      if (!this.forceUpload && srcFile.isClean()) return;

      LupBookVM.session_upload(this.sessionVM, filename, srcFile.getData());

      srcFile.markClean();
    });

    /* Now the VM has a version of every file for this activity. We can rely on
     * whether or not files have been modified, via CodeMirror */
    this.forceUpload = false;
  }

  /* Event handler for reset button */
  onReset() {
    /* Reset code */
    Object.keys(this.srcFiles).forEach((filename) => {
      const srcFile = this.srcFiles[filename];
      srcFile.resetDoc();
    });
    this.forceUpload = true;

    /* Reset testing */
    this.visibilityProgress(false);
    this.hideFeedback();
    this.tests.forEach((test) => test.resetTest());

    /* Allow new submission */
    this.submitStatus(LupBookActivity.SubmitStatus.ENABLED);
  }

  /* Event handler for submit button */
  onSubmit() {
    /* Disable buttons */
    this.submitStatus(LupBookActivity.SubmitStatus.DISABLED);
    this.resetStatus(false);

    /* Clear and show progress bar */
    this.clearProgress();
    this.visibilityProgress(true);

    /* Upload the files to the VM */
    this.uploadSrcFiles();

    /* Init all the tests */
    this.tests.forEach((test) => test.initTest());

    /* Track which test is currently being run */
    this.testIterator = this.tests[Symbol.iterator]();
    this.testCurrent = null;

    this.runNextTest();
  }

  runNextTest() {
    /* Stop running tests if a test tagged as "fatal" failed */
    if (
      this.testCurrent &&
      this.testCurrent.testFailed() &&
      this.testCurrent.fatal
    ) {
      return this.completeActivity();
    }

    /* We just run the last test */
    let nextTest = this.testIterator.next();
    if (nextTest.done) {
      return this.completeActivity();
    }

    this.testIdx = this.testCurrent ? this.testIdx + 1 : 0;

    /* Show ongoing test in progress bar */
    this.progressStatus(this.testIdx, LupBookActivity.ProgressStatus.PENDING);

    /* Run next test */
    this.testCurrent = nextTest.value;
    nextTest.value.runNextStep();
  }

  /* Update progress from test result */
  completeTest(fail) {
    let s = fail
      ? LupBookActivity.ProgressStatus.FAILURE
      : LupBookActivity.ProgressStatus.SUCCESS;
    this.progressStatus(this.testIdx, s);
  }

  completeActivity() {
    let fail = false;

    /* Jump to the first failed test if any */
    for (const test of this.tests) {
      if (!test.testFailed()) continue;

      fail = true;

      this.showFeedback(() => {
        test.testingDiv.addEventListener(
          "shown.bs.collapse",
          () => test.testingElt.scrollIntoView(),
          { once: true }
        );
        test.testingDivCollapse.show();
      });

      break;
    }

    /* Overall feedback via submit button */
    let s = fail
      ? LupBookActivity.SubmitStatus.FAILURE
      : LupBookActivity.SubmitStatus.SUCCESS;
    this.submitStatus(s);
    this.resetStatus(true);
  }
}

/*
 * Initialization of icode activities after DOM loading
 */
window.addEventListener("DOMContentLoaded", () => {
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
  const termModElt = document.getElementById("lbvm-terminal-modal");
  termModElt.addEventListener("shown.bs.modal", () => {
    fitAddon.fit();
  });

  /* Automatically resize if the window gets resized */
  window.onresize = () => {
    fitAddon.fit();
  };

  /* Bind terminal input to VM */
  term.onKey((ev) => {
    LupBookVM.on_console_queue(ev.key.charCodeAt(0));
  });

  /*
   * icode activites
   */
  let icodes = [];
  for (const e of document.getElementsByClassName("icode-container")) {
    icodes.push(new IcodeActivity(e));
  }

  /*
   * Virtual Machine
   */
  term.write("Loading virtual machine...\r\n");
  LupBookVM.start({
    on_init: () => {
      /* Once the VM is up and ready, make icode activities submittable */
      icodes.forEach((icode) =>
        icode.submitStatus(LupBookActivity.SubmitStatus.ENABLED)
      );
    },
    on_error: () => {
      console.log("VM Error!");
    },
    console_debug_write: (c) => {
      term.write(c);
    }
  });
});
