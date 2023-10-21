
## Interactive code (ICode) examples

### Simplest Example

Write any program you want, and run it to see its output.

``` icode
id: write-any-program

skeleton:
  - filename: main.c
tests:
  - name: build
    fatal: true
    cmds:
      - gcc main.c
  - name: run
    cmds:
      - ./a.out
```

### Starter code and output checking

Finish the program so that it outputs the following to stdout:

```
Hello World!
```

``` icode
id: simple-example-skel

skeleton:
  - filename: main.c
    data: |
      #include <stdio.h>

      int main(int argc, char **argv) {
          printf("Hello!!\nHello!\a\n");

          return 0;
      }

tests:
  - name: build
    fatal: true
    cmds:
      - gcc main.c
  - name: correct output
    cmds:
      - ./a.out
    checks:
      - output: stdout
        type: regex
        content: Hello.*
      - output: stdout
        content: Hello World!
```

### Checking file output

A test can also check the contents of files created by the interactive code.

Finish the program so that it outputs the text `Hello World`, both to stdout and
the file `message.txt`:


``` icode
id: write-file

skeleton:
  - filename: main.c
    data: |
      #include <stdio.h>

      int main(int argc, char **argv) {

          fprintf(stdout, "Hello World!\n");

          FILE *fid = fopen("message.txt", "w");
          // Also write the string to the file
          fclose(fid);

          return 0;
      }

tests:
  - name: build
    fatal: true
    cmds:
      - gcc main.c
  - name: correct output
    cmds:
      - ./a.out
    postcmds:
      - rm -f message.txt
    checks:
      - output: stdout
        type: regex
        content: Hello World.*
      - output: file
        filename: message.txt
        type: regex
        content: Hello World.*
```

### Complex example

By hiding some of the input files from the user, you can design complex test
cases without necessarily exposing this code as part of the exercise.

It is also possible to make input files readonly, or restrict editing to certain
lines.

In this example, a simple list API is defined in `list.h`; finish the incomplete
function in `list.c` to complete the exercise.

``` icode
!include complex_example/icode.yaml
```
