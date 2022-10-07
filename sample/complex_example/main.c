#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include "list.h"

int main(int argc, char **argv) {

    list *l = list_new();

    if (argc < 2)
        return 1;

    char *test_case = argv[1];

    if (strcmp(test_case, "push") == 0) {
        for (int i = 2; i < argc; ++i) {
            int d = atoi(argv[i]);

            node *n = node_new(d);
            list_push_front(l, n);
        }

        node *n = l->head;
        while (n) {
            printf(" %d", n->data);
            n = n->next;
        }
        printf("\n");

    } else if (strcmp(test_case, "err_null_list") == 0) {
        node *n = node_new(10);
        int rc = list_push_front(0, n);
        printf("list_push_front returned %d\n", rc);
    } else if (strcmp(test_case, "err_null_node") == 0) {
        int rc = list_push_front(l, 0);
        printf("list_push_front returned %d\n", rc);
    }

    return 0;
}
