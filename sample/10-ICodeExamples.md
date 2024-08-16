# Interactive code (ICode) examples

## Simplest Example

Example with program from scratch and no output checking.

``` icode
id: write-any-program
title: Free writing
prompt: Write any program you want, and run it to see its output.
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

## Starter code and output checking

Example with started code that students need to complete. We check the program's
output.

``` icode
id: simple-example-skel
title: Hello world
prompt: >
    Finish the program below so that it outputs the following to stdout:
    ```
    Hello World!
    ```
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

## Checking file output

A test can also check the contents of files created by the interactive code.

``` icode
id: write-file
title: File output
prompt: >
    Finish the program so that it outputs the text `Hello World`, both to stdout
    and the file `message.txt`.
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

## Complex example

By hiding some of the input files from the user, you can design complex test
cases without necessarily exposing this code as part of the exercise.

It is also possible to make input files readonly, or restrict editing to certain
lines.

``` icode
!include complex_example/icode.yaml
```
